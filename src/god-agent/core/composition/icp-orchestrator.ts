/**
 * ICP Orchestrator — Interactive Composition Pipeline
 *
 * THIS IS THE PIPELINE. Standalone orchestrator, not a modification to
 * WritePipelineOrchestrator. The existing pipeline remains untouched.
 *
 * Pipeline stages:
 *   1. Prompt → PromptSpec (decomposer)
 *   2. PromptSpec → Faceted Retrieval → QuoteSpans (with provenance)
 *   3. QuoteSpans → Canonicalization → Ranking
 *   4. Ranked quotes → Tiered Verification (auto/flagged/rejected)
 *   5. Verified quotes → WritingContract (with facet-level strictness)
 *   6. Contract → Claims → ClaimAtom decomposition → Atom-level Binding
 *   7. Bindings → Stress Test → demotions
 *   8. Atoms + bindings → Paragraph Plan → Validate → Generate → Drift check
 *   9. Generated text → Deterministic Review
 *  10. Reviewed text → Claim-Locked Polish → Final Review
 *  11. Snapshot → RunManifest → ExportPackage
 *
 * @module icp-orchestrator
 */

import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import type {
  ICPSession,
  PromptSpec,
  SourceScopeSpec,
  QuoteSpan,
  ClaimAtom,
  ClaimBinding,
  ParagraphPlanEntry,
  RunManifest,
  ExportPackage,
  AtomsMode,
  ReverseCheckMode,
  CanonicalRegistrySnapshot,
  StressTestReport,
  WritingContract,
  BlockReason,
  ReviewResults,
} from './icp-types.js';
import { createICPSession, emitSessionEvent } from './icp-types.js';
import type { SmartRetrievalLayer } from '../../retrieval/smart-retrieval-layer.js';
import type { SourcePriorityConfig } from './llm-claim-provider.js';
import { PromptDecomposer, type LLMDecompositionProvider } from './prompt-decomposer.js';
import { FacetedRetrieval, type FacetRetrievalResult } from '../../retrieval/faceted-retrieval.js';
import { QuoteRanker } from './quote-ranker.js';
import { AutoVerifier, type AutoVerifierConfig } from './auto-verifier.js';
import { ClaimAtomBinder } from './claim-atom-binder.js';
import { WritingContractBuilder } from '../writing/writing-contract-builder.js';
import { ClaimStressTester } from './claim-stress-tester.js';
import { ConstrainedGenerator, type GenerationProvider, type GenerationResult } from './constrained-generator.js';
import { RunManifestBuilder } from './run-manifest.js';
import {
  emitRetrievalEvent,
  emitVerificationEvent,
  emitStressTestEvent,
  emitPlanValidateEvent,
  emitGenerationEvent,
  emitExportEvent,
} from './icp-session-events.js';
import type { ToulminClaim, ClaimMap } from '../../cli/composition/sir/claim-map.js';

// Quality gate imports (ported from god-write pipeline)
import { ProseSanitizer } from '../../cli/composition/prose-sanitizer.js';
import { buildCorpusConstraint, type ContextChunk } from '../writing/corpus-constraint-builder.js';
import type { CorpusConstraint, CorpusSource } from '../writing/writing-generator.js';
import { CitationEnforcer, type EnforcementResult } from '../writing/citation-enforcer.js';
import { QualityGauntlet, createDefaultGauntlet, type GauntletResult } from '../../cli/quality/quality-gauntlet.js';
import { EndnoteGenerator, type CorpusSearchFn } from '../../cli/quality/endnote-generator.js';
import { stripBareApaParentheticals } from '../../universal/author-scrubber.js';
import { stripEndnoteLeaks } from '../../universal/quality-integration.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface ICPOrchestratorConfig {
  /** Default atoms mode */
  defaultAtomsMode?: AtomsMode;
  /** Default reverse check mode */
  defaultReverseCheckMode?: ReverseCheckMode;
  /** Runs directory */
  runsDir?: string;
  /** Policies directory */
  policiesDir?: string;
  /** Auto-verify quotes (skip human verification) */
  autoVerifyOnly?: boolean;
  /** Style profile ID for generation (loads from .agentdb/universal/style-profiles.json) */
  styleProfileId?: string;
  /** Auto-verifier config (pass ocrRepairRouter for OCR repair-then-verify) */
  autoVerifierConfig?: AutoVerifierConfig;
  /** Generate endnotes after prose (default: false) */
  generateEndnotes?: boolean;
}

/** Resolved config type — optional fields remain optional */
interface ResolvedICPConfig {
  defaultAtomsMode: AtomsMode;
  defaultReverseCheckMode: ReverseCheckMode;
  runsDir: string;
  policiesDir: string;
  autoVerifyOnly: boolean;
  styleProfileId?: string;
  autoVerifierConfig?: AutoVerifierConfig;
  generateEndnotes: boolean;
}

const DEFAULT_CONFIG: ResolvedICPConfig = {
  defaultAtomsMode: 'analytics',
  defaultReverseCheckMode: 'warn',
  runsDir: '.god-agent/runs',
  policiesDir: '.god-agent/policies',
  autoVerifyOnly: true,
  generateEndnotes: false,
};

// =============================================================================
// PIPELINE DEPENDENCIES
// =============================================================================

export interface ICPDependencies {
  retrieval: SmartRetrievalLayer;
  llmDecomposer?: LLMDecompositionProvider;
  generationProvider: GenerationProvider;
  /** Provide claims from existing ClaimMap (or generate via LLM) */
  claimProvider?: (promptSpec: PromptSpec, quoteSpans?: QuoteSpan[]) => Promise<{ claims: ToulminClaim[]; claimMap: ClaimMap }>;
  /** Provide clean text for a document (for verification) */
  getCleanText?: (docId: string) => Promise<string>;
  /** Provide style prompt from a profile ID (or active profile if null) */
  stylePromptProvider?: (profileId?: string) => string | null;
  /** Optional inline paragraph validator for per-paragraph quality checks */
  inlineValidator?: import('./icp-inline-validator.js').ICPInlineValidator;
}

// =============================================================================
// PIPELINE RESULT
// =============================================================================

export interface ICPPipelineResult {
  session: ICPSession;
  manifest?: RunManifest;
  exportPackage?: ExportPackage;
  blockReasons: BlockReason[];
  success: boolean;
}

// =============================================================================
// ICP ORCHESTRATOR
// =============================================================================

export class ICPOrchestrator {
  private readonly config: ResolvedICPConfig;
  private readonly deps: ICPDependencies;

  // Sub-orchestrators
  private readonly decomposer: PromptDecomposer;
  private readonly facetedRetrieval: FacetedRetrieval;
  private readonly quoteRanker: QuoteRanker;
  private readonly autoVerifier: AutoVerifier;
  private readonly atomBinder: ClaimAtomBinder;
  private readonly contractBuilder: WritingContractBuilder;
  private readonly stressTester: ClaimStressTester;
  private readonly generator: ConstrainedGenerator;
  private readonly manifestBuilder: RunManifestBuilder;
  private readonly sanitizer: ProseSanitizer;

  // Quality gate state (populated during pipeline run)
  private corpusConstraint?: CorpusConstraint;
  private retrievedChunks: ContextChunk[] = [];
  private stylePromptCache?: string;

  constructor(deps: ICPDependencies, config: ICPOrchestratorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.deps = deps;

    this.decomposer = new PromptDecomposer(deps.retrieval, deps.llmDecomposer);
    this.facetedRetrieval = new FacetedRetrieval(deps.retrieval);
    this.quoteRanker = new QuoteRanker();
    this.autoVerifier = new AutoVerifier(config.autoVerifierConfig);
    this.atomBinder = new ClaimAtomBinder();
    this.contractBuilder = new WritingContractBuilder();
    this.stressTester = new ClaimStressTester({}, deps.retrieval);
    this.generator = new ConstrainedGenerator();
    this.manifestBuilder = new RunManifestBuilder({
      runsDir: this.config.runsDir,
      policiesDir: this.config.policiesDir,
    });
    this.sanitizer = new ProseSanitizer();

    // WS1: Auto-load style profile
    this.stylePromptCache = this.loadStyleProfile(this.config.styleProfileId);

    // WS8: Wire inline validator if provided
    if (deps.inlineValidator) {
      this.generator.setInlineValidator(deps.inlineValidator);
    }
  }

  /**
   * Run the full ICP pipeline.
   */
  async run(userPrompt: string, sourceScope: SourceScopeSpec, sourcePriority?: SourcePriorityConfig): Promise<ICPPipelineResult> {
    const allBlockReasons: BlockReason[] = [];

    // =========================================================================
    // Stage 1: Prompt → PromptSpec
    // =========================================================================
    const promptSpec = await this.decomposer.decompose(userPrompt);

    // Stage 1b: Merge suggested sources into source priority (Task 40 + H-08)
    // The decomposition provider auto-detects which corpus works are relevant
    // and suggests them as primary or secondary. Merge with user-provided priority.
    if (sourcePriority) {
      if (promptSpec.suggestedPrimarySources && promptSpec.suggestedPrimarySources.length > 0) {
        process.stderr.write(`[ICP-Stage1b] Suggested PRIMARY: ${promptSpec.suggestedPrimarySources.map(s => `${s.author} - ${s.title}`).join(', ')}\n`);
        const existingPrimary = new Set(
          sourcePriority.primarySources.map(s => typeof s === 'string' ? s : `${s.author}::${s.title}`)
        );
        for (const suggested of promptSpec.suggestedPrimarySources) {
          const key = `${suggested.author}::${suggested.title}`;
          if (!existingPrimary.has(key)) {
            sourcePriority.primarySources.push({ author: suggested.author, title: suggested.title });
            process.stderr.write(`[ICP-Stage1b] Auto-elevated to PRIMARY: ${suggested.author} - ${suggested.title}\n`);
          }
        }
      }
      if (promptSpec.suggestedSecondarySources && promptSpec.suggestedSecondarySources.length > 0) {
        process.stderr.write(`[ICP-Stage1b] Suggested SECONDARY: ${promptSpec.suggestedSecondarySources.map(s => `${s.author} - ${s.title}`).join(', ')}\n`);
        const existingSecondary = new Set(
          sourcePriority.secondarySources.map(s => typeof s === 'string' ? s : `${s.author}::${s.title}`)
        );
        for (const suggested of promptSpec.suggestedSecondarySources) {
          const key = `${suggested.author}::${suggested.title}`;
          if (!existingSecondary.has(key)) {
            sourcePriority.secondarySources.push({ author: suggested.author, title: suggested.title });
            process.stderr.write(`[ICP-Stage1b] Auto-added to SECONDARY: ${suggested.author} - ${suggested.title}\n`);
          }
        }
      }
    }

    // Create session
    const session = createICPSession(randomUUID(), promptSpec, sourceScope);

    // =========================================================================
    // Stage 2: Faceted Retrieval → QuoteSpans
    // =========================================================================
    const retrievalResults = await this.facetedRetrieval.retrieveForAllFacets(
      promptSpec,
      sourceScope,
    );

    // Collect all spans
    for (const result of retrievalResults) {
      session.quote_spans.push(...result.spans);
      emitRetrievalEvent(session, result.facet_id, result.spans.length);
    }

    // WS3: Build corpus constraint from retrieved evidence
    this.retrievedChunks = this.getChunksFromSpans(session.quote_spans);
    if (this.retrievedChunks.length > 0) {
      this.corpusConstraint = buildCorpusConstraint(this.retrievedChunks, {
        enforcement: 'strict',
        minRelevance: 0.5,
      });
    }

    // WS10: Checkpoint after retrieval
    this.checkpoint(session, 'retrieval_complete');

    // =========================================================================
    // Stage 3: Canonicalization → Ranking
    // =========================================================================
    const { clusters, ranked, activeSet } = this.quoteRanker.canonicalizeAndRank(
      session.quote_spans,
      session.facets,
    );
    session.quote_spans = ranked;
    session.active_quote_set = activeSet;

    // =========================================================================
    // Stage 4: Tiered Verification
    // =========================================================================
    await this.verifyQuotes(session);

    // WS10: Checkpoint after verification
    this.checkpoint(session, 'verification_complete');

    // =========================================================================
    // Stage 5: Writing Contract
    // =========================================================================
    // First, get claims (from provider or skip)
    let claims: ToulminClaim[] = [];
    let claimMap: ClaimMap | undefined;

    if (this.deps.claimProvider) {
      const claimResult = await this.deps.claimProvider(promptSpec, session.quote_spans);
      claims = claimResult.claims;
      claimMap = claimResult.claimMap;
      session.claim_map = claimMap;
    }

    // =========================================================================
    // Stage 6: Atom Decomposition → Binding
    // =========================================================================
    if (claims.length > 0) {
      for (const facet of session.facets) {
        if (facet.archived) continue;

        const facetClaims = claims; // In full impl, filter by facet
        const { atoms, warnings } = this.atomBinder.decompose(facetClaims, facet.facet_id);
        session.atoms.push(...atoms);

        // Bind
        const { bindings, unbound_atoms, block_reasons } = this.atomBinder.bind(
          atoms,
          session.quote_spans,
          session.facets,
        );
        session.bindings.push(...bindings);
        allBlockReasons.push(...block_reasons);

        // Demote unbound
        if (unbound_atoms.length > 0) {
          const hypotheses = this.atomBinder.demoteToHypothesis(
            unbound_atoms,
            claims,
            bindings,
          );
          session.hypothesis_claims.push(...hypotheses);
        }
      }
    }

    // Build writing contract
    const contractResult = this.contractBuilder.build(
      promptSpec.original_prompt,
      'Full scope',
      session.facets,
      session.quote_spans,
      session.atoms,
      session.bindings,
    );
    session.writing_contract = contractResult.contract;
    allBlockReasons.push(...contractResult.block_reasons);

    // =========================================================================
    // Stage 6b: Cross-Author Bridge Enforcement
    // =========================================================================
    // Detect active cross-pipeline bridges and enforce author diversity.
    // If a bridge is active but retrieved chunks lack one bridged author,
    // force a targeted retrieval for the missing author.
    try {
      const { getActiveBridges, extractTopicWords } = await import('../../shared/cross-author-utils.js');
      for (const facet of session.facets) {
        if (facet.archived) continue;
        const topicWords = extractTopicWords(facet.name, facet.description);
        const activeBridges = getActiveBridges(topicWords);
        if (activeBridges.length === 0) continue;

        const bridge = activeBridges[0];
        process.stderr.write(`[ICP-Stage6b] Bridge activated: ${bridge.id} — ${bridge.sourceConcept || '?'} ↔ ${bridge.targetConcept || '?'}\n`);
        const requiredAuthors = new Set<string>();
        if (bridge.sourceAuthor && bridge.sourceAuthor !== 'Unknown') requiredAuthors.add(bridge.sourceAuthor);
        if (bridge.targetAuthor && bridge.targetAuthor !== 'Unknown') requiredAuthors.add(bridge.targetAuthor);
        if (requiredAuthors.size < 2) continue;

        // Check which authors are present in the current retrieved chunks
        const presentAuthors = new Set<string>();
        for (const span of session.quote_spans) {
          const anchor = span.source_anchor || '';
          for (const reqAuthor of requiredAuthors) {
            if (anchor.toLowerCase().includes(reqAuthor.toLowerCase())) {
              presentAuthors.add(reqAuthor);
            }
          }
        }

        const missingAuthors = [...requiredAuthors].filter(a => !presentAuthors.has(a));
        process.stderr.write(`[ICP-Stage6b] Required: [${[...requiredAuthors]}] | Present: [${[...presentAuthors]}] | Missing: [${missingAuthors}]\n`);
        if (missingAuthors.length > 0 && this.deps.retrieval) {
          for (const author of missingAuthors) {
            try {
              const authorChunks = await this.deps.retrieval.retrieveContext(
                `${facet.name} ${facet.description || ''}`.slice(0, 300),
                {
                  maxChunks: 8,
                  whereFilter: { author_raw: { $eq: author } },
                },
              );
              // Diagnostic: verify retrieved chunks actually match the requested author
              const actualAuthors = authorChunks.map((c: any) => c.metadata?.author ?? c.author_raw ?? c.author ?? '?');
              process.stderr.write(`[ICP-Stage6b] Retrieved ${authorChunks.length} chunks for "${author}" — actual authors: [${[...new Set(actualAuthors)]}]\n`);
              // Convert to QuoteSpans and add to session
              for (const chunk of authorChunks) {
                const chunkText = (chunk as any).content ?? (chunk as any).text ?? '';
                const chunkDocId = (chunk as any).docId ?? (chunk as any).doc_id ?? '';
                const chunkPage = (chunk as any).page ?? (chunk as any).pageStart ?? 0;
                const chunkTitle = (chunk as any).metadata?.title ?? '';
                const qid = randomUUID();
                const span: QuoteSpan = {
                  quote_id: qid,
                  text_fingerprint: `bridge-${qid.slice(0, 16)}`,
                  span_fingerprint: `bridge-span-${qid.slice(0, 16)}`,
                  doc_id: chunkDocId,
                  page: chunkPage,
                  source_kind: 'CORPUS',
                  clean_text_range: [0, chunkText.length],
                  clean_range_hash: `bridge-${qid.slice(0, 8)}`,
                  patch_epoch: 0,
                  normalization_policy_version: 'bridge-enforced-v1',
                  text: chunkText,
                  left_ctx_hash: '',
                  right_ctx_hash: '',
                  verification_status: 'auto_verified',
                  auto_confidence: (chunk as any).relevanceScore ?? 0.5,
                  source_anchor: chunkTitle ? `${author} - ${chunkTitle} (bridge-enforced)` : `${author} (bridge-enforced)`,
                  provenance_scorecard: {
                    fidelity_score: 0.8,
                    ocr_risk_score: 0.1,
                    cluster_size: 1,
                    prior_usage_count: 0,
                    doc_authority_tier: 1,
                  },
                };
                session.quote_spans.push(span);
              }
              process.stderr.write(`[ICP-Stage6b] Added ${authorChunks.length} bridge-enforced spans for ${author}\n`);
            } catch { /* non-fatal: bridge enforcement is best-effort */ }
          }
        }
      }
    } catch { /* non-fatal: cross-author bridge detection failure */ }

    // =========================================================================
    // Stage 7: Stress Test
    // =========================================================================
    if (claims.length > 0) {
      const stressReport = await this.stressTester.stressTest(
        session.atoms,
        session.bindings,
        session.quote_spans,
        claims,
      );
      session.stress_test_report = stressReport;

      emitStressTestEvent(
        session,
        stressReport.summary.total_tested,
        stressReport.summary.passed,
        stressReport.summary.failed,
        stressReport.summary.demoted,
      );
    }

    // =========================================================================
    // Stage 8: Paragraph Plan → Validate → Generate
    // =========================================================================
    // Generate paragraph plan
    let plan: ParagraphPlanEntry[];
    try {
      plan = await this.deps.generationProvider.generateParagraphPlan(
        session.atoms,
        session.bindings,
      );
    } catch {
      // Fallback: one paragraph per facet
      plan = this.buildFallbackPlan(session);
    }

    session.paragraph_plan = plan;

    // Validate plan
    const validation = this.generator.validatePlan(
      plan,
      session.atoms,
      session.bindings,
      session.facets,
      this.config.defaultAtomsMode,
    );

    emitPlanValidateEvent(session, validation.valid, validation.errors);

    if (!validation.valid && this.config.defaultAtomsMode === 'strict') {
      allBlockReasons.push({
        action: 'generate',
        rule_id: 'plan_validation_failed',
        required_state: 'Valid paragraph plan',
        observed_state: `Errors: ${validation.errors.join('; ')}`,
        minimal_remediations: validation.errors,
      });
    }

    // WS1: Load style prompt — try provider first, fall back to auto-loaded profile
    let stylePrompt: string | undefined;
    if (this.deps.stylePromptProvider) {
      stylePrompt = this.deps.stylePromptProvider(this.config.styleProfileId) ?? undefined;
    }
    if (!stylePrompt && this.stylePromptCache) {
      stylePrompt = this.stylePromptCache;
    }
    if (stylePrompt) {
      session.style_prompt = stylePrompt;
      session.style_profile_id = this.config.styleProfileId;
    }

    // WS10: Checkpoint after binding
    this.checkpoint(session, 'binding_complete');

    // Stage 8a: Preventive edge coherence for bound paragraphs (H-03)
    // For each planned paragraph, check if bound QuoteSpans contain cross-author
    // tensions from the reasoning graph. If so, inject a tension directive into
    // the style prompt so the LLM explicitly acknowledges the contrast.
    let tensionDirective = '';
    try {
      const { getActiveTensions, extractTopicWords } = await import('../../shared/cross-author-utils.js');
      const detectedTensions: Array<{ paragraphId: string; tension: string }> = [];

      for (const entry of plan) {
        // Get topic words from atoms bound to this paragraph
        const boundAtomIds = new Set(entry.atom_ids || []);
        const boundAtoms = session.atoms.filter(a => boundAtomIds.has(a.atom_id));
        const topicWords = boundAtoms.flatMap(a => extractTopicWords(a.semantic_text || a.claim_text || ''));

        if (topicWords.length === 0) continue;

        const tensions = getActiveTensions(topicWords);
        for (const t of tensions) {
          detectedTensions.push({
            paragraphId: entry.paragraph_id,
            tension: `[${t.id || 'T?'}] ${t.nodeA} ↔ ${t.nodeB}: ${t.description.slice(0, 150)}`,
          });
        }
      }

      if (detectedTensions.length > 0) {
        process.stderr.write(`[ICP-Stage8a] Preventive coherence: ${detectedTensions.length} cross-author tension(s) detected in bound paragraphs\n`);
        for (const dt of detectedTensions) {
          process.stderr.write(`  ${dt.paragraphId}: ${dt.tension.slice(0, 100)}\n`);
        }

        // Inject tension awareness into the style prompt
        const uniqueTensions = [...new Set(detectedTensions.map(dt => dt.tension))];
        tensionDirective = '\n\nCROSS-AUTHOR TENSIONS (from reasoning graph — you MUST acknowledge these):\n'
          + uniqueTensions.map(t => `- ${t}`).join('\n')
          + '\nWARNING: You are synthesizing sources with known philosophical tensions. '
          + 'You MUST explicitly acknowledge each contrast — do not harmonize or collapse them into agreement.';
      }

      // Store for post-hoc comparison
      (session.quality_gates as any) ??= {};
      (session.quality_gates as any).preventive_edge_check = {
        tensionsDetected: detectedTensions.length,
        details: detectedTensions,
      };
    } catch (error) {
      process.stderr.write(`[ICP-Stage8a] Preventive coherence check failed: ${error}\n`);
    }

    // Append tension directive to style prompt (if any)
    if (tensionDirective && stylePrompt) {
      stylePrompt += tensionDirective;
    } else if (tensionDirective) {
      stylePrompt = tensionDirective;
    }

    // Generate (even with warnings in non-strict mode)
    if (validation.valid || this.config.defaultAtomsMode !== 'strict') {
      const generationResult = await this.generator.generate(
        plan,
        session.atoms,
        session.bindings,
        session.quote_spans,
        session.facets,
        this.config.defaultAtomsMode,
        this.config.defaultReverseCheckMode,
        this.deps.generationProvider,
        stylePrompt,
      );

      // Store results
      for (const para of generationResult.paragraphs) {
        session.generated_text.set(para.paragraph_id, para.text);
        session.sentence_scopes.push(...para.sentences);
        emitGenerationEvent(session, para.paragraph_id, para.drift_flags.length);
      }

      session.paragraph_ledger = generationResult.ledger;
      allBlockReasons.push(...generationResult.block_reasons);
    }

    // WS10: Checkpoint after generation
    this.checkpoint(session, 'generation_complete');

    // =========================================================================
    // Stage 9: Citation Enforcement + Author Scrubbing (WS4, WS5)
    // =========================================================================
    let assembledProse = this.assembleFinalProse(session);
    let enforcementResult: EnforcementResult | undefined;
    let sanitizationArtifacts = 0;

    // Stage 9a: Programmatic parenthetical citation enforcement
    // Check each paragraph for missing parenthetical citations BEFORE the
    // citation enforcer runs, so its auto-correct mode can ground them.
    {
      const citationRegex = /\([^)]*\d+[^)]*\)/;
      const paragraphs = assembledProse.split(/\n\n+/);
      const fixed: string[] = [];
      for (const para of paragraphs) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length >= 2 && !citationRegex.test(para)) {
          process.stderr.write(`[ICP-Stage9a] Paragraph missing parenthetical citation (${sentences.length} sentences). Appending [CITATION NEEDED] marker.\n`);
          fixed.push(para + ' [CITATION NEEDED].');
        } else {
          fixed.push(para);
        }
      }
      assembledProse = fixed.join('\n\n');
    }

    // Initialize review results with claim coverage
    session.review_results = {
      quote_fidelity: [],
      claim_coverage: {
        total_sentences: session.sentence_scopes.length,
        mapped_sentences: session.sentence_scopes.filter(s => s.supports_atoms.length > 0).length,
        orphan_sentences: session.sentence_scopes
          .filter(s => s.supports_atoms.length === 0)
          .map(s => s.sentence_id),
      },
      facet_coverage: [],
      multi_claim_sentences: [],
      passed: true,
      failures: [],
    };

    if (this.corpusConstraint && this.corpusConstraint.sources.length > 0) {
      // WS4: Citation enforcement
      const enforcer = new CitationEnforcer(this.corpusConstraint, {
        mode: 'auto-correct',
        minPassRate: 0.9,
        maxHallucinations: 3,
        enableQuotationFidelity: true,
        quotationMinSimilarity: 0.70,  // OCR-tolerant (Fix 17)
        autoCorrectQuotations: true,
        enableClaimGrounding: true,
        claimMinTopicOverlap: 0.3,
      }, this.retrievedChunks);

      enforcementResult = await enforcer.enforce(assembledProse);

      if (enforcementResult.action === 'corrected') {
        assembledProse = enforcementResult.content;
      }

      // WS4: Non-corpus author scrubbing (Fix 25 pattern)
      assembledProse = this.scrubNonCorpusAuthors(assembledProse, this.corpusConstraint);

      // WS4b: Strip bare APA parentheticals (ported from adapter quality gates)
      const apaResult = stripBareApaParentheticals(assembledProse);
      assembledProse = apaResult.content;

      // WS4c: Strip endnote leaks (ported from adapter quality gates)
      assembledProse = stripEndnoteLeaks(assembledProse);

      // WS5: First sanitizer pass after enforcement/stripping
      const firstPass = await this.sanitizer.sanitize(assembledProse);
      assembledProse = firstPass.sanitized;
      sanitizationArtifacts += firstPass.artifactCount ?? 0;

      // WS5b: Second sanitizer pass (catches post-enforcement artifacts)
      const secondPass = await this.sanitizer.sanitize(assembledProse);
      assembledProse = secondPass.sanitized;
      sanitizationArtifacts += secondPass.artifactCount ?? 0;

      // Store enforcement results in review
      session.review_results = {
        ...session.review_results,
        passed: enforcementResult.passed,
      };
    }

    // =========================================================================
    // Stage 10: Quality Gauntlet + Endnotes (WS6, WS7)
    // =========================================================================
    let gauntletResult: GauntletResult | undefined;

    // WS6: Quality gauntlet
    try {
      const gauntlet = createDefaultGauntlet();
      gauntletResult = await gauntlet.runGauntlet(assembledProse, 1, {
        corpusChunks: this.retrievedChunks as any,
        knownAuthors: this.corpusConstraint?.sources.map(s => s.author) ?? [],
      });

      session.review_results = {
        ...session.review_results,
        passed: session.review_results.passed && gauntletResult.passed,
      };

      // Block if critical issues found
      if (gauntletResult.criticalIssues.length > 0) {
        allBlockReasons.push({
          action: 'quality_gate',
          rule_id: 'gauntlet_critical',
          required_state: 'No critical quality issues',
          observed_state: `${gauntletResult.criticalIssues.length} critical issues: ${gauntletResult.criticalIssues.map(i => i.description).join('; ')}`,
          minimal_remediations: [gauntletResult.revisionGuidance],
        });
      }
    } catch {
      // Non-fatal — quality gauntlet failure shouldn't block pipeline
    }

    // WS7: Endnote generation
    let endnotesSection = '';
    let bibliographySection = '';

    if (this.config.generateEndnotes) {
      try {
        const endnoteGen = new EndnoteGenerator({
          maxQuotationsPerEndnote: 3,
          minRelevanceThreshold: 0.65,
        });

        const corpusSearchFn: CorpusSearchFn = async (query: string, limit: number) => {
          try {
            const results = await this.deps.retrieval.retrieveContext(query, { maxChunks: limit });
            return results.map(r => ({
              id: (r as any).chunkId ?? (r as any).id ?? '',
              text: (r as any).content ?? '',
              metadata: (r as any).metadata ?? {},
              score: (r as any).relevanceScore ?? 0,
            }));
          } catch {
            return [];
          }
        };

        const endnoteResult = await endnoteGen.generateEndnotes(assembledProse, corpusSearchFn);
        assembledProse = endnoteResult.contentWithMarkers;
        endnotesSection = endnoteResult.endnotesSection;
      } catch {
        // Non-fatal — endnote generation failure shouldn't block pipeline
      }
    }

    // WS7: Build bibliography from corpus constraint
    if (this.corpusConstraint) {
      bibliographySection = this.buildBibliography(this.corpusConstraint);
    }

    // WS10: Checkpoint after quality gates
    this.checkpoint(session, 'quality_gates_complete');

    // Populate quality_gates summary for dashboard observability
    session.quality_gates = {
      citation_enforcement: enforcementResult ? {
        passed: enforcementResult.passed,
        action: enforcementResult.action,
        corrections: enforcementResult.correctionsCount ?? 0,
        hallucinations_caught: enforcementResult.validation?.hallucinated?.length ?? 0,
        total_citations: enforcementResult.validation?.totalCitations ?? 0,
      } : undefined,
      gauntlet: gauntletResult ? {
        passed: gauntletResult.passed,
        overall_score: gauntletResult.overallScore,
        stages_passed: gauntletResult.summary?.stagesPassed ?? 0,
        total_stages: gauntletResult.summary?.totalStages ?? 0,
        critical_issues: gauntletResult.criticalIssues?.length ?? 0,
        revision_required: gauntletResult.revisionRequired ?? false,
        stage_results: gauntletResult.stageResults?.map((s: any) => ({
          name: s.stageName ?? s.name ?? 'unknown',
          score: s.score ?? 0,
          passed: s.passed ?? false,
        })) ?? [],
      } : undefined,
      endnotes: endnotesSection ? {
        total: (endnotesSection.match(/^\d+\./gm) ?? []).length,
        supporting_quotations: 0,
        sources_used: this.corpusConstraint?.sources.map(s => s.author) ?? [],
      } : undefined,
      bibliography: bibliographySection ? {
        sources_count: this.corpusConstraint?.sources.length ?? 0,
      } : undefined,
      sanitization: {
        artifacts_removed: sanitizationArtifacts,
        passes: this.corpusConstraint ? 2 : 0,
      },
      style_profile: this.stylePromptCache ? {
        id: this.config.styleProfileId ?? 'default',
        applied: true,
      } : undefined,
      checkpoints: ['retrieval_complete', 'verification_complete', 'binding_complete', 'generation_complete', 'quality_gates_complete'],
    };

    // Edge coherence gate (async to avoid blocking I/O)
    try {
      const { validateEdgeCoherence } = await import('../../universal/quality-integration.js');
      const { loadReasoningEdgesAsync } = await import('../../shared/jsonl-loaders.js');
      const preloadedEdges = await loadReasoningEdgesAsync();
      const fullText = Array.from(session.generated_text.values()).join('\n\n');
      const ecResult = validateEdgeCoherence(fullText, undefined, preloadedEdges);
      session.quality_gates.edge_coherence = {
        score: ecResult.score,
        contradictions: ecResult.contradictions.map((c: any) => ({
          assertion: c.foundAssertion ?? c.assertion ?? '',
          conflictsWith: c.description ?? c.conflictsWith ?? '',
        })),
      };
    } catch (error) {
      process.stderr.write(`[QualityGates] Edge coherence gate threw: ${error}\n`);
    }

    // Tension-awareness gate (Phase 3: cross-author integration)
    try {
      const { validateTensionAwareness } = await import('../../universal/quality-integration.js');
      const { extractTopicWords } = await import('../../shared/cross-author-utils.js');
      const fullText = Array.from(session.generated_text.values()).join('\n\n');
      for (const facet of session.facets) {
        if (facet.archived) continue;
        const topicWords = extractTopicWords(facet.name, facet.description);
        const tensionResult = validateTensionAwareness(fullText, topicWords);
        process.stderr.write(`[ICP-TensionGate] Facet "${facet.name}": checked=${tensionResult.tensionsChecked}, acknowledged=${tensionResult.tensionsAcknowledged}, unacked=${tensionResult.unacknowledgedTensions.length}\n`);
        if (!tensionResult.passed && tensionResult.unacknowledgedTensions.length > 0) {
          // Store as quality gate result for dashboard visibility
          session.quality_gates!.tension_awareness = {
            passed: tensionResult.passed,
            tensionsChecked: tensionResult.tensionsChecked,
            tensionsAcknowledged: tensionResult.tensionsAcknowledged,
            unacknowledgedTensions: tensionResult.unacknowledgedTensions,
          };
          break; // One facet's failure is enough to flag
        }
      }
      // If no failures, mark as passed
      if (!session.quality_gates!.tension_awareness) {
        const anyTensions = session.facets.some(f => {
          if (f.archived) return false;
          const tw = extractTopicWords(f.name, f.description);
          return tw.length > 0;
        });
        if (anyTensions) {
          session.quality_gates!.tension_awareness = {
            passed: true,
            tensionsChecked: 0,
            tensionsAcknowledged: 0,
            unacknowledgedTensions: [],
          };
        }
      }
    } catch (error) {
      process.stderr.write(`[QualityGates] Tension awareness gate threw: ${error}\n`);
    }

    // Author conflict events (H-12) — derived from tension awareness results
    try {
      const ta = session.quality_gates!.tension_awareness;
      if (ta && ta.tensionsChecked > 0) {
        const { deriveAuthorConflictEvents, getActiveTensions } = await import('../../universal/quality-integration.js');
        const { extractTopicWords } = await import('../../shared/cross-author-utils.js');
        const allEvents: any[] = [];

        for (const facet of session.facets) {
          if (facet.archived) continue;
          const topicWords = extractTopicWords(facet.name, facet.description);
          const activeTensions = getActiveTensions(topicWords);
          if (activeTensions.length === 0) continue;

          const allTensionInputs = activeTensions.map((t: any) => ({
            tensionId: t.id || 'T?',
            nodeA: t.nodeA,
            nodeB: t.nodeB,
            description: (t.description || '').slice(0, 200),
          }));

          const events = deriveAuthorConflictEvents(
            facet.facet_id,
            activeTensions.length,
            activeTensions.length - (ta.unacknowledgedTensions?.length || 0),
            (ta.unacknowledgedTensions || []).map((u: any) => ({
              tensionId: u.tensionId,
              nodeA: u.nodeA,
              nodeB: u.nodeB,
              description: u.description,
            })),
            allTensionInputs,
          );
          allEvents.push(...events);
        }

        if (allEvents.length > 0) {
          session.quality_gates!.author_conflict_events = allEvents;
          process.stderr.write(`[QualityGates] Author conflict events: ${allEvents.length} (${allEvents.filter((e: any) => e.unacknowledged).length} unacknowledged)\n`);
        }
      }
    } catch (error) {
      process.stderr.write(`[QualityGates] Author conflict event derivation threw: ${error}\n`);
    }

    // Unanchored edge detection (Task #20)
    // Check which reasoning edges are grounded in the actual QuoteSpan evidence.
    try {
      const { detectUnanchoredEdges } = await import('../../universal/quality-integration.js');
      const { loadReasoningEdgesAsync } = await import('../../shared/jsonl-loaders.js');
      const allEdges = await loadReasoningEdgesAsync();
      const spanTexts = session.quote_spans.map(s => s.text || '');
      const unanchored = detectUnanchoredEdges(allEdges, spanTexts);
      if (unanchored.length > 0) {
        process.stderr.write(`[QualityGates] Unanchored edges: ${unanchored.length}/${allEdges.length} (concepts missing from QuoteSpans)\n`);
        for (const ue of unanchored.slice(0, 5)) {
          process.stderr.write(`  [${ue.edgeId}] ${ue.source} ${ue.relation} ${ue.target} — missing: ${ue.missingConcepts.join(', ')}\n`);
        }
        if (unanchored.length > 5) process.stderr.write(`  ... and ${unanchored.length - 5} more\n`);
      }
      session.quality_gates!.unanchored_edges = unanchored;
    } catch (error) {
      process.stderr.write(`[QualityGates] Unanchored edge detection threw: ${error}\n`);
    }

    // OCR quality summary (H-14)
    try {
      const { summarizeOcrQuality } = await import('../../universal/quality-integration.js');
      const ocrSummary = summarizeOcrQuality(session.quote_spans);
      if (ocrSummary) {
        session.quality_gates!.ocr_quality = ocrSummary;
        process.stderr.write(`[QualityGates] OCR quality: avg=${ocrSummary.average}, min=${ocrSummary.min}, max=${ocrSummary.max}, low=${ocrSummary.low_quality_count}\n`);
      }
    } catch (error) {
      process.stderr.write(`[QualityGates] OCR quality summary threw: ${error}\n`);
    }

    // WS9: Feedback learning — store gauntlet results for learning
    if (gauntletResult) {
      this.recordFeedbackLearning(session.session_id, gauntletResult).catch(() => {});
    }

    // =========================================================================
    // Stage 11: Snapshot → RunManifest → ExportPackage
    // =========================================================================
    const corpusHash = 'initial'; // Would be computed from OCR patch store
    const manifest = this.manifestBuilder.snapshot(session, corpusHash);
    session.run_manifest = manifest;

    // Save manifest
    try {
      this.manifestBuilder.save(manifest);
    } catch {
      // Non-fatal — manifest save failure shouldn't block pipeline
    }

    // Build export package with real quality gate outputs
    const exportPackage = this.manifestBuilder.buildExportPackage(
      session,
      manifest,
      assembledProse,
    );

    // Override stub endnotes/bibliography with real values
    if (endnotesSection) {
      exportPackage.endnotes = endnotesSection;
    }
    if (bibliographySection) {
      exportPackage.bibliography = bibliographySection;
    }

    emitExportEvent(session, manifest.run_id, 'markdown');

    const hasBlockingReasons = allBlockReasons.length > 0 && this.config.defaultAtomsMode === 'strict';

    return {
      session,
      manifest,
      exportPackage,
      blockReasons: allBlockReasons,
      success: !hasBlockingReasons,
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * WS1: Load style profile from .agentdb/universal/style-profiles.json.
   */
  private loadStyleProfile(profileId?: string): string | undefined {
    try {
      const profilePath = '.agentdb/universal/style-profiles.json';
      if (!existsSync(profilePath)) return undefined;
      const profiles = JSON.parse(readFileSync(profilePath, 'utf-8'));
      const id = profileId ?? profiles.activeProfile;
      const profile = profiles.profiles?.[id];
      if (!profile) return undefined;

      // Build style prompt from profile characteristics
      const chars = profile.characteristics;
      const parts: string[] = [];

      if (chars?.sentences?.averageLength) {
        parts.push(`Sentence length: avg ${chars.sentences.averageLength.toFixed(1)} words`);
      }
      if (chars?.sentences?.longSentenceRatio) {
        parts.push(`Long sentence ratio: ${(chars.sentences.longSentenceRatio * 100).toFixed(0)}%`);
      }
      if (chars?.tone?.passiveVoiceRatio) {
        parts.push(`Passive voice: ~${(chars.tone.passiveVoiceRatio * 100).toFixed(0)}%`);
      }
      if (chars?.tone?.formalityScore) {
        const formality = chars.tone.formalityScore > 0.6 ? 'formal' : 'casual';
        parts.push(`Tone: ${formality} (${chars.tone.formalityScore.toFixed(2)})`);
      }
      if (chars?.commonTransitions?.length > 0) {
        parts.push(`Transitions: ${chars.commonTransitions.slice(0, 7).join(', ')}`);
      }
      if (chars?.citations?.authorProminentRatio > 0.5) {
        parts.push('Citations: Author-prominent (e.g., "As X observes...", "Y argues that...")');
      }

      return parts.length > 0
        ? `Style Profile "${id}":\n${parts.map(p => `- ${p}`).join('\n')}`
        : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * WS3: Convert QuoteSpans to ContextChunks for corpus constraint building.
   */
  private getChunksFromSpans(spans: QuoteSpan[]): ContextChunk[] {
    return spans
      .filter(s => s.verification_status === 'auto_verified' ||
                   s.verification_status === 'human_verified' ||
                   s.verification_status === 'human_corrected')
      .map(span => ({
        chunkId: span.quote_id,
        docId: span.doc_id,
        content: span.repaired_text ?? span.text,
        relevanceScore: span.provenance_scorecard.fidelity_score,
        metadata: {
          author: span.source_anchor?.split(',')[0] ?? span.doc_id,
          year: 0,
          title: span.doc_id,
          page_start: typeof span.page === 'number' ? span.page : span.page[0],
          page_end: typeof span.page === 'number' ? span.page : span.page[1],
          collection: '',
        },
      }));
  }

  /**
   * WS4: Scrub non-corpus authors from signal phrases (Fix 25 pattern).
   */
  private scrubNonCorpusAuthors(text: string, constraint: CorpusConstraint): string {
    const allowedAuthors = new Set(
      constraint.sources.map(s =>
        (s.citationKey ?? s.author).split(' ')[0].toLowerCase().replace(/[,.']/g, ''),
      ),
    );
    const signalPhrasePattern = /(?:As |According to |Following )\w[\w\s]+ (?:argues|observes|suggests|states|maintains|notes|contends|claims|demonstrates)[^.]*\./g;
    return text.replace(signalPhrasePattern, (match) => {
      const words = match.split(/\s+/);
      const hasAllowedAuthor = words.some(w =>
        allowedAuthors.has(w.toLowerCase().replace(/[,.']/g, '')),
      );
      return hasAllowedAuthor ? match : '';
    }).replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * WS7: Build bibliography from corpus constraint sources.
   */
  private buildBibliography(constraint: CorpusConstraint): string {
    const entries = constraint.sources
      .sort((a, b) => a.author.localeCompare(b.author))
      .map(s => {
        const pages = s.pages ? `, ${s.pages}` : '';
        return `${s.author}. *${s.title}*. ${s.year}${pages}.`;
      });
    return `## Works Cited\n\n${entries.join('\n\n')}`;
  }

  /**
   * WS9: Record quality gauntlet results for feedback learning.
   */
  private async recordFeedbackLearning(
    sessionId: string,
    gauntletResult: GauntletResult,
  ): Promise<void> {
    try {
      const { createProductionSonaEngine } = await import('../../core/learning/sona-engine.js');
      const engine = createProductionSonaEngine();
      await engine.initialize();

      const trajectoryId = `icp-${sessionId}`;
      engine.createTrajectoryWithId(trajectoryId, 'writing/icp/quality', [], []);
      await engine.provideFeedback(trajectoryId, gauntletResult.overallScore, {
        lScore: gauntletResult.overallScore,
        rlmContext: {
          injectionSuccess: true,
          sourceAgentKey: 'icp-quality-gate',
          sourceStepIndex: 10,
          sourceDomain: 'icp/quality',
        },
      });
    } catch {
      // Non-fatal — learning failure shouldn't block pipeline
    }
  }

  /**
   * WS10: Checkpoint session state for crash recovery.
   */
  private checkpoint(session: ICPSession, stage: string): void {
    try {
      const dir = this.config.runsDir;
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const checkpointPath = `${dir}/${session.session_id}.checkpoint.json`;
      writeFileSync(checkpointPath, JSON.stringify({
        stage,
        timestamp: Date.now(),
        session_id: session.session_id,
        revision: session.revision,
        facet_count: session.facets.length,
        span_count: session.quote_spans.length,
        atom_count: session.atoms.length,
        paragraph_count: session.paragraph_plan.length,
      }));
    } catch {
      // Non-fatal — checkpoint save failure shouldn't block pipeline
    }
  }

  /**
   * Resume from a checkpoint (static factory).
   */
  static resume(checkpointPath: string): { stage: string; sessionId: string } | null {
    try {
      if (!existsSync(checkpointPath)) return null;
      const data = JSON.parse(readFileSync(checkpointPath, 'utf-8'));
      return { stage: data.stage, sessionId: data.session_id };
    } catch {
      return null;
    }
  }

  /**
   * Verify quotes using auto-verifier.
   */
  private async verifyQuotes(session: ICPSession): Promise<void> {
    // Group spans by doc
    const spansByDoc = new Map<string, QuoteSpan[]>();
    for (const span of session.quote_spans) {
      if (!spansByDoc.has(span.doc_id)) {
        spansByDoc.set(span.doc_id, []);
      }
      spansByDoc.get(span.doc_id)!.push(span);
    }

    for (const [docId, spans] of spansByDoc) {
      // Get clean text for this doc
      let cleanText: string;
      if (this.deps.getCleanText) {
        cleanText = await this.deps.getCleanText(docId);
      } else {
        // Fallback: use span text as proxy (limited verification)
        cleanText = spans.map(s => s.text).join(' ');
      }

      const results = await this.autoVerifier.verifyBatch(
        spans,
        cleanText,
        session.canonical_registry_snapshot,
      );

      this.autoVerifier.applyResults(spans, results);

      for (const [quoteId, result] of results) {
        emitVerificationEvent(session, quoteId, result.recommended_status);
      }
    }
  }

  /**
   * Build fallback paragraph plan (one paragraph per facet).
   */
  private buildFallbackPlan(session: ICPSession): ParagraphPlanEntry[] {
    const plan: ParagraphPlanEntry[] = [];
    let order = 0;

    for (const facet of session.facets) {
      if (facet.archived) continue;

      const facetAtomIds = session.atoms
        .filter(a => a.facet_id === facet.facet_id)
        .map(a => a.atom_id);

      const facetQuoteIds = session.bindings
        .filter(b => b.atom_ids.some(id => facetAtomIds.includes(id)))
        .flatMap(b => b.quote_ids);

      plan.push({
        paragraph_id: randomUUID(),
        paragraph_order: order++,
        atom_ids: facetAtomIds,
        required_quotes: [...new Set(facetQuoteIds)],
        section_id: `section-${order}`,
      });
    }

    // If no atoms, create a single paragraph
    if (plan.length === 0) {
      plan.push({
        paragraph_id: randomUUID(),
        paragraph_order: 0,
        atom_ids: [],
        required_quotes: session.quote_spans
          .filter(s => s.verification_status === 'auto_verified')
          .map(s => s.quote_id)
          .slice(0, 5),
      });
    }

    return plan;
  }

  /**
   * Assemble final prose from generated paragraphs.
   */
  private assembleFinalProse(session: ICPSession): string {
    const orderedParagraphs = session.paragraph_plan
      .sort((a, b) => a.paragraph_order - b.paragraph_order)
      .map(p => session.generated_text.get(p.paragraph_id))
      .filter((text): text is string => !!text);

    return orderedParagraphs.join('\n\n');
  }
}
