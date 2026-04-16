/**
 * WritePipelineOrchestrator - Write pipeline, corpus integration, and content generation
 *
 * Extracted from UniversalAgent (Phase 4c, SEAM-1).
 * Contains write(), corpus helpers, generation helpers, and content pipeline.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SmartRetrievalLayer, ContextChunk, RetrievalOptions, Logger } from '../retrieval/index.js';
import { stderrLogger } from '../retrieval/index.js';
import {
  getPipelineVersion,
  createPipelineContext,
  computePipelineHealth,
  recordDegraded,
  recordWarning,
  recordHardFailure,
  runRetrievalStage,
  type PipelineVersion,
  type PipelineContext,
  type RetrievalResult as StageRetrievalResult,
  type DraftingResult as StageDraftingResult,
  type ValidationResult as StageValidationResult,
  type RetrievalStageDeps,
} from './stages/index.js';
import { estimateTokenBudget } from './stages/pipeline-utils.js';
import {
  investigateV1 as investigateV1Fn,
  trimChunkContent as trimChunkContentFn,
  reorderChunksForAttention as reorderChunksForAttentionFn,
  enforceSourceDiversity as enforceSourceDiversityFn,
  validateRetrievalCoverage as validateRetrievalCoverageFn,
} from '../core/composition/retrieval-utils.js';
import {
  loadDomainConfig,
  buildAuthorPattern,
  buildConceptPattern,
  isPrimarySource,
  getDomainKeywords,
  extractWorkReferences,
  type DomainConfig,
} from './domain-config.js';
import { resolveAuthor } from '../shared/cross-author-utils.js';
import { GOLD_STANDARD_CONFIG } from './gold-standard-config.js';
import {
  buildGoldStandardPrompt as buildGoldStandardPromptFn,
  buildGoldStandardChunkBlock as buildGoldStandardChunkBlockFn,
  assignSourcesToSections as assignSourcesToSectionsFn,
  buildRollingContextSectionPrompt,
  type GoldStandardPromptOptions,
  type RollingContextCitationTracker,
  type RollingContextSectionPromptOptions,
} from './gold-standard-prompt-builder.js';
import type { QualityIntegration, QualityValidationOptions, QualityValidationResult } from './quality-integration.js';
import { stripEndnoteLeaks } from './quality-integration.js';
import type { ProseSanitizer, SanitizationResult, ArtifactViolation } from '../cli/composition/prose-sanitizer.js';
import type { StyleProfileManager, StoredStyleProfile } from './style-profile.js';
import type { StyleCharacteristics } from './style-analyzer.js';
import type { TrajectoryBridge } from './trajectory-bridge.js';
import type { IEmbeddingProvider } from '../core/memory/types.js';
import type { InteractionStore } from './interaction-store.js';
import type {
  IWritingGenerator,
  CorpusConstraint,
  CitationBudgetResult,
  InlineGenerationResult,
  GenerationUnit,
  CorpusSource,
  CorpusRetriever,
  InlineGenerationConfig,
  ValidationResult,
  EnforcementResult,
} from '../core/writing/index.js';
import {
  AnthropicWritingGenerator,
  buildCorpusConstraint,
  loadCorpusManifest,
  calculateCitationBudget,
  quickBudgetCheck,
  CitationValidator,
  createValidatorFromChunks,
  CitationEnforcer,
  createEnforcerFromChunks,
  InlineValidationOrchestrator,
  createInlineValidationOrchestrator,
} from '../core/writing/index.js';
import {
  compositionOrchestrator,
  type ChapterOutline,
  type CompositionResult,
} from '../cli/composition/synthesis/composition-orchestrator.js';
import {
  generateEndnotes,
  type EndnoteGenerationResult,
  type EndnoteGeneratorConfig,
  type CorpusSearchFn,
} from '../cli/quality/endnote-generator.js';
import { ProvenanceLedger } from '../cli/quality/provenance-ledger.js';
import {
  getSourceVerificationLayer,
  type VerificationSummary,
  type AcquisitionSuggestion,
} from '../cli/quality/source-verification-layer.js';
import {
  MissingSourceAcquisitionLayer,
  getMissingSourceAcquisitionLayer,
  type AcquisitionResult,
} from '../cli/quality/missing-source-acquisition.js';
import { scrubNonCorpusAuthors, stripBareApaParentheticals, buildCorpusSourcesFromChunks } from './author-scrubber.js';
import { estimateQuality, assessQuality, type QualityInteraction } from './quality-estimator.js';
import type { AgentMode, WriteResult, TaskExecutionResult, IWriteTaskPreparation } from './universal-agent.js';
import type { IAgentSelectionResult } from '../core/agents/index.js';
import { ClaudeCodeExecutor, type ICodeExecutionRequest } from '../core/executor/index.js';
import { PipelineAbortController, PipelineAbortError } from '../core/abort/index.js';

export interface WritePipelineDeps {
  smartRetrieval: SmartRetrievalLayer | null;
  qualityIntegration: QualityIntegration | null;
  proseSanitizer: ProseSanitizer;
  styleProfileManager: StyleProfileManager | undefined;
  trajectoryBridge: TrajectoryBridge | null;
  writingGenerator: IWritingGenerator | null;
  interactionStore: InteractionStore;
  config: {
    verbose: boolean;
    autoLearn: boolean;
    autoStoreThreshold: number;
  };
  log: (...args: unknown[]) => void;
  ensureInitialized: () => Promise<void>;
  embed: (text: string) => Promise<Float32Array>;
  generateId: () => string;
  injectDESCEpisodes: (
    description: string,
    context?: { command?: string; mode?: AgentMode }
  ) => Promise<{ augmentedPrompt: string }>;
  storeDESCEpisode: (
    input: string,
    output: string,
    metadata?: { command?: string; mode?: AgentMode; quality?: number }
  ) => Promise<void>;
  maybeStorePattern: (entry: { content: string; type: string; domain: string; tags: string[] }) => Promise<unknown>;
  retrieveRelevant: (query: string, mode: AgentMode, k?: number) => Promise<unknown[]>;
  extractTags: (text: string) => string[];
  executeTaskDefault: (
    agentSelection: { selection: IAgentSelectionResult; prompt: string; context?: string },
    taskExecutionFn?: (agentType: string, prompt: string, options?: { timeout?: number }) => Promise<string>,
    options?: { trajectoryId?: string; forceExecute?: boolean }
  ) => Promise<TaskExecutionResult>;
}

// =============================================================================
// WRITE OPTIONS — extracted from write() parameter for shared type safety
// =============================================================================

export interface WriteOptions {
  style?: 'academic' | 'professional' | 'casual' | 'technical';
  length?: 'short' | 'medium' | 'long' | 'comprehensive';
  format?: 'essay' | 'report' | 'article' | 'paper';
  /** Use a specific learned style profile by ID */
  styleProfileId?: string;
  /** Use the currently active style profile (default: true if one is set) */
  useActiveStyleProfile?: boolean;
  /** Phase 3: Use corpus for source-grounded content generation */
  useCorpus?: boolean;
  /** Phase 3: Target specific corpus collections */
  corpusCollections?: string[];
  /** Phase 3: Number of corpus chunks to retrieve (default: 15) */
  corpusChunkCount?: number;
  /** Phase 3: Minimum relevance for corpus chunks (default: 0.75) */
  corpusMinRelevance?: number;
  /** Phase 5: Use staged composition system (auto-detected for chapters/sections) */
  useStagedComposition?: boolean;
  /** Phase 5: Chapter outline for staged composition */
  chapterOutline?: ChapterOutline;
  /** Force direct execution, bypassing pipeline detection (for testing) */
  forceExecute?: boolean;
  /** Enable endnote generation with supporting quotations (requires useCorpus) */
  enableEndnotes?: boolean;
  /** Maximum supporting quotations per endnote (default: 3) */
  maxQuotationsPerEndnote?: number;
  /** Minimum relevance threshold for endnote quotations (default: 0.65) */
  minEndnoteRelevance?: number;
  /** Render visual provenance bbox overlays for endnote citations (default: false) */
  renderBboxOverlays?: boolean;
  /** Source Verification: Verify all citations exist in corpus */
  verifySources?: boolean;
  /** Source Acquisition: Automatically acquire missing sources */
  acquireMissing?: boolean;
  /** Download directory for acquired sources (default: ./corpus/downloads) */
  downloadDir?: string;
  /** Citation Enforcement: Mode for hallucination prevention (default: 'auto-correct') */
  citationEnforcementMode?: 'strict' | 'auto-correct' | 'warn';
  /** Citation Enforcement: Minimum pass rate for citations (default: 0.85) */
  citationMinPassRate?: number;
  /** Citation Enforcement: Maximum hallucinations allowed (default: 3) */
  citationMaxHallucinations?: number;
  /** Phase 11: Use inline validation during generation (prevents hallucinations DURING generation, not after) */
  useInlineValidation?: boolean;
  /** Phase 11: Inline validation strictness level (default: 'moderate') */
  inlineValidationStrictness?: 'strict' | 'moderate' | 'lenient';
  /** Phase 11: Maximum retry attempts per paragraph (default: 3) */
  inlineMaxRetriesPerUnit?: number;
  /** Phase 11: Enable citation lookup tool-use during generation (default: true) */
  inlineEnableCitationLookup?: boolean;
  /** Phase 11: Minimum corpus chunks required to auto-enable inline validation (default: 3) */
  inlineMinChunks?: number;
  /** Data source mode: 'corpus' = retrieved chunks only, 'hybrid' = chunks + manifest, 'external' = no constraint */
  dataSourceMode?: 'corpus' | 'hybrid' | 'external';
  /** Gold standard mode: multi-query chunk retrieval + style profile injection +
   *  knowledge units + 7-section prompt + single-shot generation.
   *  Replicates the exact approach that produced the gold standard document. */
  whitelistMode?: boolean;
  /** Multi-step drafting: v1 (no style) → investigate → v2 (styled, with prevention plan).
   *  Produces higher-assurance output for dissertation chapters. */
  multiStep?: boolean;
  /** NLI-based claim verification (optional, high-cost). Run after v1 or v2. */
  nliVerify?: boolean;
  /** Per-section candidate selection (optional). Generate 2-3 candidates, pick best. */
  candidateSelection?: boolean;
  /** Rolling context generation: sequential per-section generation with sliding context window.
   *  Requires whitelistMode. Eliminates token-distribution fatigue and inter-section incoherence. */
  rollingContext?: boolean;
  /** Pipeline version: 'legacy' (monolithic) or 'v2' (staged pipeline).
   *  CLI flag --pipeline-version overrides env WRITING_PIPELINE_VERSION.
   *  Default: 'legacy' until v2 is fully validated. */
  pipelineVersion?: PipelineVersion;
  /** Maximum quality gauntlet revision iterations (default: 0 = scoring only).
   *  Each revision re-calls the LLM. Use with caution for cost/latency. */
  maxGauntletRevisions?: number;
  /** Explicit word target override (e.g., '500-1000', '800').
   *  Takes precedence over the length-derived default. */
  wordTarget?: string;
}

export class WritePipelineOrchestrator {
  private manifestCache: Map<string, { sources: CorpusSource[]; ts: number }> = new Map();
  private static readonly MANIFEST_CACHE_TTL_MS = 60_000; // 1 minute
  /** Active abort controller for the current pipeline run (set during write()) */
  private activeAbortCtrl: PipelineAbortController | null = null;

  constructor(private deps: WritePipelineDeps) {}

  /** Build RetrievalStageDeps from this orchestrator's private methods. */
  private buildRetrievalStageDeps(goldLog: (msg: string) => void): RetrievalStageDeps {
    return {
      smartRetrieval: this.deps.smartRetrieval,
      extractSemanticRetrievalQueries: (t) => this.extractSemanticRetrievalQueries(t),
      extractPrimaryAuthors: (t) => this.extractPrimaryAuthors(t),
      extractKeyAuthors: (t) => this.extractKeyAuthors(t),
      extractRetrievalQueries: (t) => this.extractRetrievalQueries(t),
      buildSectionConstraints: (s, p) => this.buildSectionConstraints(s, p),
      cachedLoadCorpusManifest: (opts) => this.cachedLoadCorpusManifest(opts),
      goldLog,
    };
  }

  /** Cached wrapper around loadCorpusManifest(). */
  private async cachedLoadCorpusManifest(
    opts: { collections?: string[] } = {},
  ): Promise<CorpusSource[]> {
    const key = JSON.stringify(opts.collections ?? []);
    const cached = this.manifestCache.get(key);
    if (cached && (Date.now() - cached.ts) < WritePipelineOrchestrator.MANIFEST_CACHE_TTL_MS) {
      return cached.sources;
    }
    const sources = await loadCorpusManifest(opts);
    this.manifestCache.set(key, { sources, ts: Date.now() });
    return sources;
  }

  // ===== Retrieval Query Decomposition =====

  private extractRetrievalQueries(topic: string): string[] {
    const lines = topic.split('\n').map(l => l.trim()).filter(Boolean);
    const sectionQueries: string[] = [];

    // Instruction/meta line detector — these are NOT topic sections
    const instructionPattern = /^(use |every |do not |if a |present |this task |quoted |additionally,?\s+explicit)/i;
    const metaSectionPattern = /^(quotation ledger|quotation fidelity|citation ledger|validation summary|claim map|quality gauntlet|works cited|bibliography|references|endnotes|appendix)/i;

    const isTopicSection = (title: string): boolean => {
      // Strip markdown bold markers before testing (e.g., "**Claim Map**:" → "Claim Map:")
      const stripped = title.replace(/\*\*/g, '').replace(/^:\s*/, '').trim();
      if (instructionPattern.test(stripped)) return false;
      if (metaSectionPattern.test(stripped)) return false;
      // Must not start with an imperative verb commonly used in instructions
      if (/^(ensure|always|never|avoid|include|exclude|format|output|generate|write)\b/i.test(stripped)) return false;
      return stripped.length > 10;
    };

    // Pattern 1: Numbered sections — "1. Aristotle on Motion" or "Section 1: Aristotle on Motion"
    const sectionPattern = /^\d+\.\s+(?![a-z]\.)/;
    const labeledSectionPattern = /^Section\s+\d+[:.]\s*/i;
    for (const line of lines) {
      if (sectionPattern.test(line)) {
        const title = line.replace(/^\d+\.\s+/, '').trim();
        if (isTopicSection(title)) {
          sectionQueries.push(title);
        }
      } else if (labeledSectionPattern.test(line)) {
        const title = line.replace(labeledSectionPattern, '').trim();
        if (isTopicSection(title)) {
          sectionQueries.push(title);
        }
      }
    }

    // Pattern 2: Markdown headings
    if (sectionQueries.length === 0) {
      for (const line of lines) {
        if (/^#{1,3}\s+/.test(line)) {
          const title = line.replace(/^#{1,3}\s+/, '').trim();
          if (isTopicSection(title)) {
            sectionQueries.push(title);
          }
        }
      }
    }

    // Pattern 3a: Use reasoning edges to derive concept-rich section queries
    // Instead of generic author×concept cross-products, pull from the knowledge graph
    if (sectionQueries.length === 0) {
      try {
        const edgePath = path.join(process.cwd(), 'god-reason', 'reasoning.jsonl');
        if (fs.existsSync(edgePath)) {
          const edgeLines = fs.readFileSync(edgePath, 'utf-8').split('\n').filter(Boolean);
          const allEdges = edgeLines.map((l: string) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

          // Match edges whose source or target appears in the topic
          const topicLower = topic.toLowerCase();
          const topicTerms = topicLower.split(/\s+/).filter((t: string) => t.length > 3);
          const relevantEdges = allEdges.filter((e: any) => {
            const src = (e.source || '').toLowerCase().replace(/_/g, ' ');
            const tgt = (e.target || '').toLowerCase().replace(/_/g, ' ');
            return topicTerms.some((t: string) => src.includes(t) || tgt.includes(t) || t.includes(src) || t.includes(tgt));
          });

          if (relevantEdges.length >= 4) {
            // Sort by corroboration score, then deduplicate concept pairs
            relevantEdges.sort((a: any, b: any) => (b.corroboration_score || 1) - (a.corroboration_score || 1));
            const seen = new Set<string>();
            const edgeSections: string[] = [];
            for (const e of relevantEdges) {
              const src = (e.source || '').replace(/_/g, ' ');
              const tgt = (e.target || '').replace(/_/g, ' ');
              const key = [src, tgt].sort().join('|');
              if (seen.has(key)) continue;
              seen.add(key);
              // Capitalize for section title: "kinesis and chronos" → "Kinesis and Chronos"
              const title = `${src.charAt(0).toUpperCase() + src.slice(1)} and ${tgt.charAt(0).toUpperCase() + tgt.slice(1)}`;
              edgeSections.push(title);
              if (edgeSections.length >= 8) break;
            }
            if (edgeSections.length >= 3) {
              return edgeSections;
            }
          }
        }
      } catch { /* fall through to Pattern 3b */ }
    }

    // Pattern 3b (fallback): Extract author+concept cross-product queries
    if (sectionQueries.length === 0) {
      const domainConfig = loadDomainConfig();
      const authorPattern = buildAuthorPattern(domainConfig);
      const conceptPattern = buildConceptPattern(domainConfig);

      const authors = new Set<string>();
      const concepts = new Set<string>();
      for (const line of lines) {
        const authorMatches = Array.from(line.matchAll(authorPattern));
        const conceptMatches = Array.from(line.matchAll(conceptPattern));
        for (const m of authorMatches) authors.add(m[0]);
        for (const m of conceptMatches) concepts.add(m[0].toLowerCase());
      }

      const authorConcepts: string[] = [];
      Array.from(authors).forEach(author => {
        Array.from(concepts).forEach(concept => {
          authorConcepts.push(`${author} ${concept}`);
        });
      });

      if (authorConcepts.length > 2) {
        return authorConcepts.slice(0, 6);
      }
    }

    if (sectionQueries.length >= 2) {
      return sectionQueries;
    }

    return [topic];
  }

  /**
   * Extract semantic keyword queries from topic text for gold standard retrieval.
   * Unlike extractRetrievalQueries() which returns raw section headings,
   * this produces concise keyword queries optimized for embedding search
   * (like the original parent Claude's manual queries).
   *
   * Strategy:
   * 1. Extract section titles from the topic
   * 2. Convert each to a compact keyword query by extracting key concepts
   * 3. Add cross-product author×concept queries for coverage
   */
  private extractSemanticRetrievalQueries(topic: string): string[] {
    const domainConfig = loadDomainConfig();
    const authorPattern = buildAuthorPattern(domainConfig);
    const conceptPattern = buildConceptPattern(domainConfig);

    // Extract all authors and concepts from the full topic
    const authors = new Set<string>();
    const concepts = new Set<string>();
    for (const line of topic.split('\n')) {
      for (const m of Array.from(line.matchAll(authorPattern))) authors.add(m[0]);
      for (const m of Array.from(line.matchAll(conceptPattern))) concepts.add(m[0].toLowerCase());
    }

    // Step 1: Get section titles and convert to keyword queries
    const sectionTitles = this.extractRetrievalQueries(topic);
    const keywordQueries: string[] = [];

    for (const title of sectionTitles) {
      // Strip markdown formatting and extract just the key terms
      const cleaned = title
        .replace(/\*\*/g, '')
        .replace(/[:#\-–—]/g, ' ')
        .replace(/\b(the|and|of|in|to|a|an|for|with|from|as|by|on|how|what|why|this|that|its|their|our|between|through)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Only keep if it has meaningful content
      if (cleaned.length > 5) {
        // Truncate to keep queries focused (embedding models work better with short queries)
        const words = cleaned.split(' ').filter(w => w.length > 2).slice(0, 6);
        if (words.length >= 2) {
          keywordQueries.push(words.join(' '));
        }
      }
    }

    // Step 2: Add author×concept cross-product queries if we have both
    // These ensure coverage of key intersections (like "Heidegger kinesis" or "Aristotle phantasia")
    const authorList = Array.from(authors);
    const conceptList = Array.from(concepts);

    if (authorList.length > 0 && conceptList.length > 0) {
      // Add 2-3 targeted cross-product queries not already covered
      const crossQueries: string[] = [];
      for (const author of authorList.slice(0, 3)) {
        // Pick the 2 most relevant concepts for this author
        const authorConcepts = conceptList
          .filter(c => !keywordQueries.some(q => q.toLowerCase().includes(author.toLowerCase()) && q.toLowerCase().includes(c)))
          .slice(0, 2);
        for (const concept of authorConcepts) {
          crossQueries.push(`${author} ${concept}`);
        }
      }
      // Add up to 4 cross-product queries
      keywordQueries.push(...crossQueries.slice(0, 4));
    }

    // Deduplicate and limit
    const seen = new Set<string>();
    const unique = keywordQueries.filter(q => {
      const key = q.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.length >= 2 ? unique.slice(0, 10) : [topic.substring(0, 200)];
  }

  /**
   * Extract key authors from topic text for source-targeted supplementation.
   * Returns author names that should get additional targeted retrieval queries.
   */
  /**
   * Extract primary authors from the prompt — authors explicitly named in the topic
   * who should receive priority retrieval. Returns all named authors (not just 2+ mentions
   * like extractKeyAuthors), since a prompt naming "Aristotle" once is still requesting
   * primary coverage of Aristotle.
   */
  private extractPrimaryAuthors(topic: string): string[] {
    const authorPattern = buildAuthorPattern(loadDomainConfig());
    const found = new Set<string>();
    for (const m of Array.from(topic.matchAll(authorPattern))) {
      const raw = m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase();
      // Resolve to canonical manifest name (e.g., "Rickert" → "Rickert, Thomas")
      // so ChromaDB author_raw $eq filters match
      const canonical = resolveAuthor(raw);
      found.add(canonical);
    }
    return Array.from(found);
  }

  /**
   * Build per-section citation and quotation constraints derived from the prompt's
   * section headings. Maps each section to its primary author(s) and generates
   * constraints like "Section 2 must cite Aristotle at least once."
   */
  private buildSectionConstraints(
    subsections: string[],
    primaryAuthors: string[],
  ): string[] {
    const constraints: string[] = [];
    const primaryLower = primaryAuthors.map(a => a.toLowerCase());

    for (let i = 0; i < subsections.length; i++) {
      const heading = subsections[i];
      const headingLower = heading.toLowerCase();

      // Find which primary authors this section names
      const sectionAuthors = primaryAuthors.filter(a => headingLower.includes(a.toLowerCase()));

      if (sectionAuthors.length > 0) {
        // Section explicitly names an author — require citation to them
        for (const author of sectionAuthors) {
          constraints.push(
            `Section ${i + 1} ("${heading}") names ${author} — include at least 1 citation to ${author} in this section.`
          );
        }
        // If section is specifically about one author's interpretation, require quotation
        if (headingLower.includes('interpretation') || headingLower.includes('reading') ||
            headingLower.includes('heidegger')) {
          constraints.push(
            `Section ${i + 1} ("${heading}") should include at least 2 direct quotations from ${sectionAuthors.join('/')}.`
          );
        }
      } else if (!/conclusion/i.test(heading)) {
        // Non-conclusion section that doesn't name a specific author —
        // require at least one primary author citation if topic is about them
        if (primaryLower.some(a => a === 'aristotle') &&
            (headingLower.includes('motion') || headingLower.includes('time') ||
             headingLower.includes('aisthesis') || headingLower.includes('phantasia') ||
             headingLower.includes('perception') || headingLower.includes('temporal'))) {
          constraints.push(
            `Section ${i + 1} ("${heading}") covers Aristotelian concepts — include at least 1 citation to Aristotle or primary Aristotle scholarship.`
          );
        }
      }

      // Fix 73: Uexküll/biosemiotic section rules (previously only Aristotle/Heidegger had rules)
      if (headingLower.includes('uex') || headingLower.includes('umwelt') ||
          headingLower.includes('merkbild') || headingLower.includes('biosemiotic') ||
          headingLower.includes('biological') || headingLower.includes('foray')) {
        constraints.push(
          `Section ${i + 1} ("${heading}") covers Uexküll/biosemiotic concepts — include at least 1 citation to von Uexküll's *Foray* with page numbers, and at least 1 direct quotation.`
        );
      }

      // Phantasia sections: require internal Aristotelian detail
      if (headingLower.includes('phantasia') || headingLower.includes('imagination')) {
        constraints.push(
          `Section ${i + 1} ("${heading}") on phantasia — address internal distinctions where corpus supports it: its grades (sensory vs deliberative), its relation to belief (doxa), and its voluntariness. If deferred to a later chapter, signpost explicitly.`
        );
      }

      // Heidegger sections: require explicit link-backs to earlier concepts
      if (headingLower.includes('heidegger') && i > 0) {
        const earlierTopics = subsections.slice(0, i)
          .filter(s => !/conclusion/i.test(s))
          .map(s => s.replace(/^\d+\.\s*/, '').trim());
        if (earlierTopics.length > 0) {
          constraints.push(
            `Section ${i + 1} ("${heading}") on Heidegger — explicitly tie Heidegger's concepts back to EACH earlier subsection topic (${earlierTopics.join('; ')}). For each, include at least one sentence showing how Heidegger re-reads that Aristotelian concept.`
          );
        }
      }
    }

    return constraints;
  }

  private extractKeyAuthors(topic: string): string[] {
    const authorPattern = buildAuthorPattern(loadDomainConfig());
    const counts = new Map<string, number>();
    for (const m of Array.from(topic.matchAll(authorPattern))) {
      const raw = m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase();
      const canonical = resolveAuthor(raw);
      counts.set(canonical, (counts.get(canonical) || 0) + 1);
    }
    // Return authors mentioned 2+ times (they're important to the topic)
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }

  /**
   * Enforce source diversity in retrieved chunks.
   * Strategy: Relevance-first selection with per-source cap.
   * Unlike pure round-robin (which forces in low-relevance sources),
   * this takes chunks in relevance order but caps any single source.
   * This preserves thematic relevance while preventing one source from dominating.
   */
  private enforceSourceDiversity(
    chunks: ContextChunk[],
    options: { maxPerSource?: number; targetTotal?: number } = {}
  ): ContextChunk[] {
    return enforceSourceDiversityFn(chunks, options);
  }

  /**
   * Assign relevant sources to each section based on keyword overlap between
   * section titles and chunk content. Returns a map of section index → source strings.
   */
  private assignSourcesToSections(
    subsections: string[],
    chunks: ContextChunk[]
  ): Map<number, string[]> {
    return assignSourcesToSectionsFn(subsections, chunks);
  }

  // ===== Chunk Trimming (P0 — Research-validated) =====
  // Gold standard chunks averaged ~450 chars. Current pipeline sends ~2,071 chars/chunk.
  // Research shows: longer prompts → output compression, lost-in-the-middle effect (20-30% accuracy drop).
  // LLMLingua/LongLLMLingua research validates that prompt compression improves generation quality.

  /**
   * Trim a chunk's content to ~targetChars while preserving the most valuable parts:
   * 1. Sentences containing direct quotations (text in quotation marks)
   * 2. Sentences with page references or citation markers
   * 3. Argument-dense sentences (philosophical key terms)
   * 4. Remove OCR artifacts, headers, boilerplate
   */
  private trimChunkContent(content: string, targetChars: number = GOLD_STANDARD_CONFIG.chunkTrimTarget): string {
    return trimChunkContentFn(content, targetChars);
  }

  /**
   * Reorder chunks to mitigate the "lost in the middle" effect.
   * Research (LongLLMLingua): placing most relevant content at edges of the prompt
   * achieves 21.4% improvement at 4x compression.
   *
   * Strategy: Interleave high-relevance chunks at start and end, medium in middle.
   * Pattern: [high, high, ..., medium, medium, ..., high, high]
   */
  private reorderChunksForAttention(chunks: ContextChunk[]): ContextChunk[] {
    return reorderChunksForAttentionFn(chunks);
  }

  // ===== Corpus Constraint Prompt Builder =====

  private buildCorpusConstraintPromptText(constraint: CorpusConstraint): string {
    if (constraint.sources.length === 0) {
      return '';
    }

    const isStrict = constraint.enforcement === 'strict';
    const placeholder = constraint.missingCitationPlaceholder || '[CITATION NEEDED]';

    // Group sources by type
    const primarySources: typeof constraint.sources = [];
    const secondarySources: typeof constraint.sources = [];

    for (const source of constraint.sources) {
      const isPrimary = isPrimarySource(source.author, source.title, loadDomainConfig());

      if (isPrimary) {
        primarySources.push(source);
      } else {
        secondarySources.push(source);
      }
    }

    let prompt = `
## CORPUS-ONLY CITATION CONSTRAINT (${isStrict ? 'MANDATORY' : 'RECOMMENDED'})

You may ${isStrict ? 'ONLY' : 'preferably'} cite from the following verified sources:`;

    if (primarySources.length > 0) {
      prompt += `

### Primary Sources
${primarySources.map(s => `- ${s.author} (${s.year > 0 ? s.year : 'c. ' + Math.abs(s.year) + ' BCE'}). "${s.title}"${s.pages ? ` [Pages: ${s.pages}]` : ''}${s.citationKey ? ` — Cite as: (${s.citationKey})` : ''}`).join('\n')}`;
    }

    if (secondarySources.length > 0) {
      prompt += `

### Secondary Scholarship
${secondarySources.map(s => `- ${s.author} (${s.year}). "${s.title}"${s.pages ? ` [Pages: ${s.pages}]` : ''}${s.citationKey ? ` — Cite as: (${s.citationKey})` : ''}`).join('\n')}`;
    }

    prompt += `

### Citation Rules (MANDATORY — ZERO TOLERANCE FOR EXTERNAL SOURCES)
1. **EVERY citation MUST include page numbers**: Use format (Author Year, p. X) or (Author Year, pp. X-Y)
2. ${isStrict ? '**ABSOLUTE RULE: Do NOT cite, reference, discuss, or mention ANY scholar not in the list above.** This includes authors you know from your training data. If an author is not listed above, they do not exist for this task.' : 'Prefer citations from this list'}
3. ${isStrict ? 'Do NOT fabricate page numbers - only cite pages from corpus chunks you have access to' : 'Use verified page numbers when available'}
4. Do NOT combine authors who do not co-author in this list
5. Do NOT cite works by listed authors other than those specified above (e.g., if "Gross, Uncomfortable Situations" is listed, do NOT cite "Gross, Secret History of Emotion")
6. ${isStrict ? 'If a corpus chunk MENTIONS another scholar (e.g., "Modrak argues..."), do NOT cite that scholar — cite the AUTHOR of the chunk instead (e.g., cite O\'Gorman who wrote the chunk, not Modrak who is discussed in it)' : 'If you need a source not listed, write "' + placeholder + '" instead of fabricating'}
7. If you cannot determine the page number, write "[PAGE NEEDED]" after the citation
8. ${isStrict ? '**ANY mention of a non-listed author will cause automatic rejection.** Do not write "As X argues" or "X\'s account" unless X is in the list above.' : ''}

### Citation Format Examples
- Direct quote: "quoted text" (Frede 1992, p. 283)
- Paraphrase: As Frede argues (1992, pp. 280-285), phantasia...
- Multiple pages: (Heidegger 1927, pp. 134-137)
- Primary source: (Aristotle, De Anima, 427b14-16)

${isStrict ? '**Citations without page numbers will be flagged and may result in rejection. References to non-listed authors will be stripped from the output.**' : 'Unverified citations will be flagged for review.'}`;

    return prompt;
  }

  // ===== Corpus Context Block Builder =====

  private buildCorpusContextBlock(chunks: ContextChunk[]): string {
    if (chunks.length === 0) return '';

    // Group chunks by source for readability
    const bySource = new Map<string, ContextChunk[]>();
    for (const chunk of chunks) {
      const key = `${chunk.metadata.author} - ${chunk.metadata.title} (${chunk.metadata.year})`;
      if (!bySource.has(key)) bySource.set(key, []);
      bySource.get(key)!.push(chunk);
    }

    let block = `\n## CORPUS SOURCE MATERIAL\n\nThe following are excerpts from the ingested scholarly corpus (OCR-processed). You MUST ground your citations in this material.\n\n**IMPORTANT instructions for using these chunks:**\n- These chunks are raw OCR output and may contain formatting artifacts (running headers, page numbers, line breaks, author names at page tops, etc.)\n- When citing, paraphrase the scholarly content in your own words and cite with (Author Year, p. X)\n- When directly quoting, extract ONLY the meaningful scholarly text — strip out OCR artifacts like page headers, running titles, or stray numbers\n- Never quote raw OCR artifacts like "JOHN SMITH 30 The following..." — instead quote the actual content: "The following..."\n- Use the page numbers from the [Chunk N] metadata, not numbers found within the OCR text\n`;

    let chunkNumber = 1;
    let totalChars = block.length;
    const MAX_CHARS = GOLD_STANDARD_CONFIG.maxCorpusBlockChars; // ~15K tokens budget for corpus context

    for (const [sourceKey, sourceChunks] of bySource) {
      const header = `\n### ${sourceKey}\n`;
      totalChars += header.length;
      if (totalChars > MAX_CHARS) break;
      block += header;

      for (const chunk of sourceChunks) {
        const pages = chunk.metadata.page_start === chunk.metadata.page_end
          ? `p. ${chunk.metadata.page_start}`
          : `pp. ${chunk.metadata.page_start}-${chunk.metadata.page_end}`;
        const entry = `\n**[Chunk ${chunkNumber}]** (${pages}):\n${chunk.content}\n`;
        totalChars += entry.length;
        if (totalChars > MAX_CHARS) {
          block += `\n*[Remaining chunks truncated to stay within context budget]*\n`;
          return block;
        }
        block += entry;
        chunkNumber++;
      }
    }

    block += `\n---\n**Total corpus chunks provided: ${chunkNumber - 1}**\n`;
    return block;
  }

  // ===== Gold Standard Prompt Builder =====

  /** Delegates to the standalone gold-standard-prompt-builder module (single source of truth). */
  private buildGoldStandardPrompt(options: GoldStandardPromptOptions): string {
    return buildGoldStandardPromptFn(options);
  }

  /** Delegates to the standalone gold-standard-prompt-builder module. */
  private buildGoldStandardChunkBlock(chunks: ContextChunk[]): string {
    return buildGoldStandardChunkBlockFn(chunks);
  }

  // ===== Rolling Context Generation =====

  /**
   * Allocate corpus chunks to sections: shared pool (top N by relevance) + section-specific.
   * The shared pool is filtered per-section by the citation tracker to enforce source diversity.
   */
  private allocateChunksToSections(
    subsections: string[],
    chunks: ContextChunk[],
    sharedPoolSize: number,
    maxPerSection: number,
  ): { sharedPool: ContextChunk[]; sectionChunks: Map<number, ContextChunk[]> } {
    // Sort by relevance descending
    const sorted = [...chunks].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

    // Top N → shared pool
    const sharedPool = sorted.slice(0, sharedPoolSize);
    const remaining = sorted.slice(sharedPoolSize);

    // Use term-overlap scoring to assign remaining chunks to sections
    const sectionSourceMap = assignSourcesToSectionsFn(subsections, remaining);
    const sectionChunks = new Map<number, ContextChunk[]>();

    // Build term-overlap scores per chunk per section
    for (let i = 0; i < subsections.length; i++) {
      const sectionLower = subsections[i].toLowerCase();
      const terms = sectionLower
        .split(/\s+/)
        .filter(t => t.length > 3)
        .filter(t => !['with', 'from', 'that', 'this', 'their', 'between', 'focus'].includes(t));

      const scored = remaining.map(c => {
        const contentLower = (c.content || '').toLowerCase();
        const authorLower = (c.metadata.author || '').toLowerCase();
        let score = 0;
        for (const term of terms) {
          if (contentLower.includes(term)) score++;
          if (authorLower.includes(term)) score += 2;
        }
        return { chunk: c, score };
      });

      const topForSection = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPerSection)
        .map(s => s.chunk);

      sectionChunks.set(i, topForSection);
    }

    // Sections with < 3 chunks get supplemented from remaining
    for (let i = 0; i < subsections.length; i++) {
      const current = sectionChunks.get(i) || [];
      if (current.length < 3) {
        const usedIds = new Set(current.map(c => c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`));
        for (const chunk of remaining) {
          if (current.length >= 3) break;
          const id = chunk.metadata.chunk_id || `${chunk.metadata.source_id}:${chunk.metadata.page_start}`;
          if (!usedIds.has(id)) {
            current.push(chunk);
            usedIds.add(id);
          }
        }
        sectionChunks.set(i, current);
      }
    }

    return { sharedPool, sectionChunks };
  }

  /**
   * Extract citation/quotation stats from generated section content.
   * Reuses citation/quotation regexes from investigateV1().
   */
  private extractSectionStats(content: string): {
    wordCount: number;
    citationCount: number;
    quotationCount: number;
    citedAuthors: string[];
  } {
    const words = content.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Citation extraction (same pattern as investigateV1)
    const citRegex = /\(([^)]+?,\s*\*[^*]+\*[^)]*)\)|(?:As\s+|According\s+to\s+)(\w[\w\s]*?)\s+(?:observes|argues|maintains|suggests|notes|contends|emphasizes|demonstrates)\s+in\s+\*([^*]+)\*/gi;
    const citedAuthors: string[] = [];
    let citationCount = 0;
    let match: RegExpExecArray | null;
    while ((match = citRegex.exec(content)) !== null) {
      citationCount++;
      const author = (match[1] || match[2] || '').split(',')[0].trim().toLowerCase();
      if (author && !citedAuthors.includes(author)) citedAuthors.push(author);
    }

    // Quotation extraction
    const quoteRegex = /[""\u201c]([^""\u201d]{15,})[""\u201d]/g;
    let quotationCount = 0;
    while (quoteRegex.exec(content) !== null) quotationCount++;

    return { wordCount, citationCount, quotationCount, citedAuthors };
  }

  /**
   * Generate a 50-word summary of a section using Haiku (cheap, fast).
   * Used for conclusion's hybrid context window.
   */
  private async generateSectionSummary(sectionHeading: string, sectionContent: string): Promise<string> {
    const summaryPrompt = `Summarize the following academic section in EXACTLY one sentence (max 50 words). ` +
      `Focus on the main argument and its contribution to the broader thesis. Do not add commentary.\n\n` +
      `## ${sectionHeading}\n\n${sectionContent}`;

    try {
      return await this.generateViaAnthropicAPI(summaryPrompt, {
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 100,
      });
    } catch {
      // Fallback: first 50 words
      return sectionContent.split(/\s+/).slice(0, 50).join(' ') + '...';
    }
  }

  /**
   * Core rolling context generation loop.
   *
   * Generates sections sequentially, feeding previously generated text back into
   * subsequent prompts. Maintains a citation tracker and filters the shared chunk
   * pool to enforce source diversity.
   */
  private async writeRollingContext(
    topic: string,
    subsections: string[],
    corpusChunks: ContextChunk[],
    knowledgeUnitLines: string[],
    structuralEdgeLines: string[],
    stylePrompt: string,
    wordTarget: string,
    preventionPlan: GoldStandardPromptOptions['preventionPlan'] | undefined,
    sectionConstraints: string[],
    ontologyLines: string[] = [],
    hookLines: string[] = [],
    tensionLines: string[] = [],
  ): Promise<{
    content: string;
    diagnostics: NonNullable<import('./universal-agent.js').WriteResult['rollingContext']>;
  }> {
    const goldLog = (msg: string) => process.stderr.write(`[ROLLING CTX] ${msg}\n`);
    const config = GOLD_STANDARD_CONFIG;

    // Allocate chunks to sections
    const { sharedPool, sectionChunks } = this.allocateChunksToSections(
      subsections, corpusChunks, config.rollingContextSharedPoolSize, config.rollingContextMaxChunksPerSection
    );
    goldLog(`Chunk allocation: ${sharedPool.length} shared pool, ${subsections.length} sections`);
    for (let i = 0; i < subsections.length; i++) {
      goldLog(`  Section ${i + 1}: ${(sectionChunks.get(i) || []).length} section-specific chunks`);
    }

    // All unique authors from corpus (for citation tracker)
    const allCorpusAuthors = [...new Set(corpusChunks.map(c => (c.metadata.author || 'Unknown').toLowerCase()))];

    // Rolling state
    const generatedSections: Array<{ heading: string; content: string }> = [];
    const sectionSummaries: string[] = [];
    const citationTracker: RollingContextCitationTracker = {
      authorsCitedSoFar: [],
      authorsNotYetCited: [...allCorpusAuthors],
      authorCitationCounts: {},
      totalCitationCount: 0,
      totalQuotationCount: 0,
    };
    const sectionDiagnostics: NonNullable<import('./universal-agent.js').WriteResult['rollingContext']>['sectionStats'] = [];
    let sharedPoolEvictions = 0;

    // Compute per-section word target
    const totalTarget = parseInt(wordTarget.replace(/,/g, '').split('-')[0]) || 3000;
    const conclusionIdx = subsections.findIndex(s => /conclusion/i.test(s));
    const regularSections = subsections.length - (conclusionIdx >= 0 ? 1 : 0);
    const wordsPerSection = Math.round(
      (totalTarget - (conclusionIdx >= 0 ? config.rollingContextConclusionWords : 0)) / regularSections
    );

    for (let i = 0; i < subsections.length; i++) {
      const isConclusion = i === conclusionIdx;
      const sectionWordTarget = isConclusion
        ? String(config.rollingContextConclusionWords)
        : `${wordsPerSection - 100}-${wordsPerSection + 100}`;

      goldLog(`\n=== Section ${i + 1}/${subsections.length}: ${subsections[i]} ===`);

      // Build rolling context window
      let priorSectionsText = '';
      let priorSummariesForPrompt: string[] | undefined;

      if (isConclusion) {
        // Conclusion: full text of last 2 sections + summaries for earlier ones
        const windowStart = Math.max(0, generatedSections.length - config.rollingContextWindowSize);
        const fullTextSections = generatedSections.slice(windowStart);
        priorSectionsText = fullTextSections
          .map(s => `## ${s.heading}\n\n${s.content}`)
          .join('\n\n');
        // Summaries for everything before the window
        if (config.rollingContextUseSummaries && sectionSummaries.length > windowStart) {
          priorSummariesForPrompt = sectionSummaries.slice(0, windowStart);
        }
      } else if (generatedSections.length > 0) {
        // Regular section: last N sections from sliding window
        const windowStart = Math.max(0, generatedSections.length - config.rollingContextWindowSize);
        const windowSections = generatedSections.slice(windowStart);
        priorSectionsText = windowSections
          .map(s => `## ${s.heading}\n\n${s.content}`)
          .join('\n\n');
      }

      // Filter shared pool by citation tracker (Amendment A4)
      const filteredSharedPool = sharedPool.filter(chunk => {
        const author = (chunk.metadata.author || '').toLowerCase();
        const count = citationTracker.authorCitationCounts[author] ?? 0;
        if (count >= config.rollingContextSharedPoolMaxCitations) {
          sharedPoolEvictions++;
          return false;
        }
        return true;
      });

      // Merge section-specific chunks + filtered shared pool (dedup by ID)
      const sectionSpecific = sectionChunks.get(i) || [];
      const mergedIds = new Set<string>();
      const mergedChunks: ContextChunk[] = [];
      for (const chunk of [...sectionSpecific, ...filteredSharedPool]) {
        const id = chunk.metadata.chunk_id || `${chunk.metadata.source_id}:${chunk.metadata.page_start}`;
        if (!mergedIds.has(id)) {
          mergedIds.add(id);
          mergedChunks.push(chunk);
        }
      }

      goldLog(`  Chunks: ${mergedChunks.length} (${sectionSpecific.length} specific + ${filteredSharedPool.length} shared)`);
      goldLog(`  Prior context: ${priorSectionsText.length} chars${priorSummariesForPrompt ? ` + ${priorSummariesForPrompt.length} summaries` : ''}`);

      // Build the per-section prompt
      const promptOptions: RollingContextSectionPromptOptions = {
        topic,
        globalOutline: subsections,
        currentSectionIndex: i,
        currentSectionHeading: subsections[i],
        sectionWordTarget,
        chunks: mergedChunks,
        knowledgeUnits: knowledgeUnitLines,
        structuralEdges: structuralEdgeLines,
        ontologyNodes: ontologyLines,
        crossPipelineHooks: hookLines,
        tensionEdges: tensionLines,
        stylePrompt,
        preventionPlan,
        priorSectionsText,
        priorSectionSummaries: priorSummariesForPrompt,
        citationTracker,
        isConclusion,
        nextSectionHeading: i + 1 < subsections.length ? subsections[i + 1] : undefined,
        sectionConstraint: sectionConstraints[i] || undefined,
      };

      const sectionPrompt = buildRollingContextSectionPrompt(promptOptions);
      goldLog(`  Prompt: ${sectionPrompt.length} chars`);

      // Generate section content
      let sectionContent: string;
      try {
        sectionContent = await this.generateViaClaudeCode(sectionPrompt, {
          model: 'claude-opus-4-6',
          maxTokens: config.rollingContextMaxTokens,
        });
        goldLog(`  Generated: ${sectionContent.split(/\s+/).length} words`);
      } catch (e) {
        goldLog(`  Generation failed: ${e}. Using placeholder.`);
        sectionContent = `[Section ${i + 1} generation failed: ${e}]`;
      }

      // Extract stats and update citation tracker
      const stats = this.extractSectionStats(sectionContent);
      goldLog(`  Stats: ${stats.wordCount} words, ${stats.citationCount} citations, ${stats.quotationCount} quotations`);
      goldLog(`  Authors: ${stats.citedAuthors.join(', ') || 'none'}`);

      for (const author of stats.citedAuthors) {
        citationTracker.authorCitationCounts[author] = (citationTracker.authorCitationCounts[author] ?? 0) + 1;
        if (!citationTracker.authorsCitedSoFar.includes(author)) {
          citationTracker.authorsCitedSoFar.push(author);
        }
      }
      citationTracker.authorsNotYetCited = allCorpusAuthors.filter(
        a => !citationTracker.authorsCitedSoFar.includes(a)
      );
      citationTracker.totalCitationCount += stats.citationCount;
      citationTracker.totalQuotationCount += stats.quotationCount;

      // Store generated section
      generatedSections.push({ heading: subsections[i], content: sectionContent });

      // Generate Haiku summary (async, for conclusion context)
      if (!isConclusion && config.rollingContextUseSummaries) {
        // Fire and forget — we'll await all before conclusion
        const summary = await this.generateSectionSummary(subsections[i], sectionContent);
        sectionSummaries.push(summary);
        goldLog(`  Summary: "${summary.substring(0, 80)}..."`);
      }

      sectionDiagnostics.push({
        heading: subsections[i],
        wordCount: stats.wordCount,
        citationCount: stats.citationCount,
        quotationCount: stats.quotationCount,
        citedAuthors: stats.citedAuthors,
        promptChars: sectionPrompt.length,
      });
    }

    // Extract document title from the topic (first non-section line)
    const topicLines = topic.split('\n').map(l => l.trim()).filter(Boolean);
    const instructionStarts = /^(you are|critical rules|use |every |do not |if a |present |this task |quoted |additionally|generate |ensure )/i;
    let documentTitle = '';
    for (const line of topicLines) {
      const cleaned = line.replace(/^["']|["']$/g, '').replace(/^write\s+(a\s+)?/i, '');
      if (!instructionStarts.test(cleaned) && cleaned.length > 10 && !/^\d+\.\s/.test(cleaned)) {
        documentTitle = cleaned;
        break;
      }
    }
    if (!documentTitle) documentTitle = subsections.slice(0, 3).join(', ');

    // Concatenate all sections with title and headings
    const sectionContent = generatedSections
      .map((s, i) => `## ${i + 1}. ${s.heading}\n\n${s.content}`)
      .join('\n\n');

    // Generate validation appendix via a cheap API call
    goldLog('Generating validation appendix...');
    let validationAppendix = '';
    try {
      const appendixPrompt = `You are a scholarly citation auditor. Given the following academic text, produce ONLY a Validation Appendix in this exact format. Do not write any prose or commentary — output ONLY the appendix tables.

# VALIDATION APPENDIX

## Claim Map

| # | Claim | Source | Page(s) |
|---|-------|--------|---------|
(List every substantive claim with its citation)

## Quotation Ledger

| # | Quotation | Source | Page(s) | Corpus Chunk Verified |
|---|-----------|--------|---------|----------------------|
(List every direct quotation with source)

## Citation Ledger

| Work | Author(s) | Pages Referenced |
|------|-----------|-----------------|
(List every distinct work cited)

## Validation Summary

1. **Corpus Grounding**: X of Y citations verified against corpus chunks.
2. **Quotation Fidelity**: X of Y quotations verified verbatim.
3. **Source Diversity**: X distinct works cited across Y sections.
4. **Style Compliance**: Sentence length, passive voice ratio, transition usage.
5. **Argument Structure**: Toulmin claim-data-warrant coverage assessment.

---

TEXT TO AUDIT:

${sectionContent}`;

      validationAppendix = await this.generateViaAnthropicAPI(appendixPrompt, {
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 4096,
      });
      goldLog(`Validation appendix generated: ${validationAppendix.split(/\s+/).length} words`);
    } catch (e) {
      goldLog(`Validation appendix generation failed: ${e}`);
    }

    const fullContent = `# ${documentTitle}\n\n${sectionContent}${validationAppendix ? `\n\n${validationAppendix}` : ''}`;

    goldLog(`\n=== ROLLING CONTEXT COMPLETE ===`);
    goldLog(`Total: ${fullContent.split(/\s+/).length} words, ${citationTracker.totalCitationCount} citations, ${citationTracker.totalQuotationCount} quotations`);
    goldLog(`Authors cited: ${citationTracker.authorsCitedSoFar.join(', ')}`);
    goldLog(`Authors NOT cited: ${citationTracker.authorsNotYetCited.join(', ') || 'none'}`);
    goldLog(`Shared pool evictions: ${sharedPoolEvictions}`);

    return {
      content: fullContent,
      diagnostics: {
        used: true,
        totalSections: subsections.length,
        sectionStats: sectionDiagnostics,
        citationTracker: {
          totalCitations: citationTracker.totalCitationCount,
          totalQuotations: citationTracker.totalQuotationCount,
          authorCitationCounts: citationTracker.authorCitationCounts,
        },
        sharedPoolEvictions,
      },
    };
  }

  // ===== Claude Code Generation =====

  private async generateViaClaudeCode(prompt: string, options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<string> {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const args = ['-p', '--no-input'];
    if (options?.model) args.push('--model', options.model);
    if (options?.systemPrompt) args.push('--system-prompt', options.systemPrompt);
    // --allowedTools "" disables all tools (pure text generation)
    args.push('--allowedTools', '');
    args.push(prompt);

    try {
      const { stdout } = await execFileAsync('claude', args, {
        maxBuffer: 10 * 1024 * 1024,  // 10MB
        timeout: 180000,  // 3 min (increased for longer multi-section targets)
        env: { ...process.env },
      });
      return stdout.trim();
    } catch (error: any) {
      // Fall back to direct Anthropic API on any failure (ENOENT, timeout, etc.)
      // The claude CLI subprocess can hang when run inside an existing Claude Code session.
      process.stderr.write(`[GOLD STD] claude CLI failed (${error.code || error.message}), falling back to Anthropic API...\n`);
      this.deps.log(`claude CLI failed (${error.code || error.message}), falling back to Anthropic API...`);
      return this.generateViaAnthropicAPI(prompt, options);
    }
  }

  // ===== Anthropic API Generation =====

  private async generateViaAnthropicAPI(prompt: string, options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Neither claude CLI nor ANTHROPIC_API_KEY available for generation');
    }

    // Use native fetch instead of @anthropic-ai/sdk (Fix 27: SDK fails in WSL2)
    const model = options?.model || 'claude-sonnet-4-20250514';
    const body: Record<string, unknown> = {
      model,
      max_tokens: options?.maxTokens || 8192,
      messages: [{ role: 'user', content: prompt }],
    };
    if (options?.systemPrompt) {
      body.system = options.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: this.activeAbortCtrl
        ? AbortSignal.any([AbortSignal.timeout(300000), this.activeAbortCtrl.signal])
        : AbortSignal.timeout(300000), // 5 min timeout (increased for longer multi-section targets)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }>; stop_reason?: string; usage?: { input_tokens?: number; output_tokens?: number } };
    process.stderr.write(`[API] stop_reason=${data.stop_reason}, usage=${JSON.stringify(data.usage)}, model=${model}, max_tokens=${options?.maxTokens || 8192}\n`);
    return data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n\n');
  }

  // ===== Mock Academic Content =====

  private generateMockAcademicContent(
    topic: string,
    style: string,
    length: string,
    corpusChunks: ContextChunk[]
  ): string {
    const wordCounts = {
      short: 500,
      medium: 1000,
      long: 2000,
      comprehensive: 2500,
    };
    const targetWords = wordCounts[length as keyof typeof wordCounts] || 1000;

    // Build content with corpus citations if available
    let content = `# ${topic}\n\n`;

    if (corpusChunks.length > 0) {
      content += `## Introduction\n\n`;
      content += `This section examines ${topic.toLowerCase()}, drawing on recent scholarship and theoretical frameworks. `;
      content += `Building on the work of ${corpusChunks[0]?.metadata.author || 'key scholars'} (${corpusChunks[0]?.metadata.year || '2020'}), `;
      content += `we explore the conceptual foundations and implications of this topic.\n\n`;

      content += `## Theoretical Framework\n\n`;
      content += corpusChunks.slice(0, 3).map((chunk, i) => {
        return `${chunk.content.slice(0, 200)}... (${chunk.metadata.author}, ${chunk.metadata.year}, p.${chunk.metadata.page_start})`;
      }).join('\n\n');

      content += `\n\n## Analysis\n\n`;
      content += `The literature reveals multiple perspectives on ${topic.toLowerCase()}. `;
    } else {
      content += `This section provides a comprehensive examination of ${topic.toLowerCase()}. `;
    }

    // Pad to target word count
    const currentWords = content.split(/\s+/).length;
    if (currentWords < targetWords) {
      const fillerParagraph = `Furthermore, this analysis considers the broader implications and contextual factors that shape our understanding. ` +
        `The theoretical underpinnings draw from multiple disciplinary perspectives, including philosophical, empirical, and applied approaches. ` +
        `Each perspective contributes unique insights that enrich our comprehensive understanding of the phenomenon. `;

      const paragraphsNeeded = Math.ceil((targetWords - currentWords) / fillerParagraph.split(/\s+/).length);
      for (let i = 0; i < paragraphsNeeded; i++) {
        content += `\n\n${fillerParagraph}`;
      }
    }

    content += `\n\n## Conclusion\n\n`;
    content += `This examination of ${topic.toLowerCase()} demonstrates the complexity and significance of the topic. `;
    content += `Future research should continue to explore these dimensions in greater depth.`;

    return content;
  }

  // ===== Writing Instructions Builder =====

  private buildWritingInstructions(
    style: 'academic' | 'professional' | 'casual' | 'technical',
    format: 'essay' | 'report' | 'article' | 'paper',
    length: 'short' | 'medium' | 'long' | 'comprehensive',
    stylePrompt: string | null
  ): string {
    const lengthGuide: Record<string, string> = {
      short: '500-800 words',
      medium: '1000-2000 words',
      long: '2500-4000 words',
      comprehensive: '5000+ words with sections',
    };

    const styleGuide: Record<string, string> = {
      academic: 'formal tone, citations where appropriate, objective analysis',
      professional: 'clear and concise, business-appropriate, actionable insights',
      casual: 'conversational tone, engaging, accessible language',
      technical: 'precise terminology, detailed explanations, code examples where relevant',
    };

    const formatGuide: Record<string, string> = {
      essay: 'introduction, body paragraphs with clear thesis, conclusion',
      report: 'executive summary, findings, analysis, recommendations',
      article: 'headline, lead paragraph, supporting sections, conclusion',
      paper: 'abstract, introduction, methodology, results, discussion, conclusion',
    };

    let instructions = `## Writing Instructions

**Style**: ${style} - ${styleGuide[style]}
**Format**: ${format} - ${formatGuide[format]}
**Length**: ${length} - ${lengthGuide[length]}`;

    if (stylePrompt) {
      instructions += `\n\n## Style Profile\n${stylePrompt}`;
    }

    return instructions;
  }

  // ===== Pipeline Detection =====

  private isPipelineWritingTask(topic: string, format: string): boolean {
    // Complex document formats that benefit from pipeline
    const complexFormats = ['paper', 'report'];
    if (complexFormats.includes(format)) {
      // Check for complexity indicators in topic
      const complexityIndicators = [
        /dissertation/i,
        /thesis/i,
        /multi.chapter/i,
        /comprehensive.*research/i,
        /full.*analysis/i,
        /in.depth.*study/i,
        /complete.*guide/i,
      ];
      if (complexityIndicators.some(pattern => pattern.test(topic))) {
        return true;
      }
    }

    // Long-form content indicators
    const longFormIndicators = [
      /book/i,
      /manuscript/i,
      /whitepaper/i,
      /research.*paper/i,
    ];
    return longFormIndicators.some(pattern => pattern.test(topic));
  }

  // ===== Key Points Extraction =====

  private extractKeyPointsFromTopic(topic: string): string[] {
    // Try to extract numbered or bulleted lists
    const numberedPattern = /^\d+\.\s+(.+)$/gm;
    const bulletPattern = /^[•\-\*]\s+(.+)$/gm;

    const numberedMatches = Array.from(topic.matchAll(numberedPattern));
    if (numberedMatches.length > 0) {
      return numberedMatches.map(m => m[1].trim()).slice(0, 5);
    }

    const bulletMatches = Array.from(topic.matchAll(bulletPattern));
    if (bulletMatches.length > 0) {
      return bulletMatches.map(m => m[1].trim()).slice(0, 5);
    }

    // Split by sentences and take first 3-5 as key points
    const sentences = topic.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    if (sentences.length >= 2) {
      return sentences.slice(0, Math.min(5, sentences.length));
    }

    // Fallback: generate generic key points from topic
    return [
      `Understanding the core concepts of ${topic}`,
      `Analyzing the implications and applications`,
      `Synthesizing the key findings and conclusions`,
    ];
  }

  // ===== Local V1 Investigation (no LLM — pure string analysis) =====

  /**
   * Investigate v1 output for faithfulness issues using local string analysis only.
   * Returns a structured investigation result with issues and a prevention plan.
   * Cost: ~0ms (no LLM calls). All checks are regex/string-based.
   */
  investigateV1(v1Content: string, chunks: ContextChunk[], manifestAuthors: string[]) {
    return investigateV1Fn(v1Content, chunks, manifestAuthors);
  }

  /**
   * Validate retrieval coverage: check that key authors mentioned in the topic
   * have sufficient chunks in the retrieved set. Returns authors needing supplementation.
   */
  private validateRetrievalCoverage(
    topic: string,
    chunks: ContextChunk[],
    minChunksPerAuthor: number = 2
  ): { missingAuthors: string[]; weakAuthors: string[]; coverageReport: string[] } {
    return validateRetrievalCoverageFn(topic, chunks, minChunksPerAuthor);
  }

  // ===== Main Write Pipeline =====

  async write(topic: string, options: WriteOptions = {}): Promise<WriteResult> {
    await this.deps.ensureInitialized();

    // =========================================================================
    // PIPELINE VERSION GATE
    // v2 path uses staged pipeline (RetrievalStage → DraftingStage → ValidationStage)
    // legacy path is the existing monolithic logic below
    // =========================================================================
    const pipelineVersion = getPipelineVersion(options);
    if (pipelineVersion === 'v2') {
      return this.writeV2(topic, options);
    }

    // =========================================================================
    // LEGACY PATH — existing monolithic logic (unchanged)
    // =========================================================================

    // Pipeline abort mechanism (Phase 5 Stream Deck integration)
    const abortCtrl = new PipelineAbortController(process.cwd(), (msg) => this.deps.log(msg));
    abortCtrl.start();
    this.activeAbortCtrl = abortCtrl;

    try {

    // Deep-clone options to prevent mutation of caller's object (Issue #5)
    options = { ...options };

    // Rolling context requires whitelist mode
    if (options.rollingContext && !options.whitelistMode) {
      throw new Error('--rolling-context requires --whitelist mode (corpus chunk allocation needs whitelist retrieval)');
    }

    // Fix 27: Resolve data source mode and enforce corpus-only invariants
    const dataSourceMode = options.dataSourceMode ?? 'hybrid';
    const resolved = options;

    if (dataSourceMode === 'corpus') {
      // Hard error on explicit invariant violations (catches UI bugs early)
      if (resolved.acquireMissing) {
        throw new Error(
          'Corpus-only mode forbids acquireMissing. ' +
          'Set dataSourceMode to "hybrid" or "external" to acquire missing sources.'
        );
      }

      // Force corpus-only invariants for unspecified options
      resolved.useCorpus = true;
      resolved.acquireMissing = false;
      resolved.verifySources = true;
      resolved.citationEnforcementMode = 'strict';
      resolved.citationMaxHallucinations = 0;

      this.deps.log(`🔒 Corpus-only mode: enforcing strict citation constraints`);
    }

    // Apply resolved options so all downstream code uses enforced values
    options = resolved;

    // DESC: Inject prior solutions before processing (RULE-010: window size 3)
    // Best-effort — DESC daemon may not be running; not a critical path dependency for god-write
    let augmentedTopic = topic;
    try {
      const descResult = await this.deps.injectDESCEpisodes(topic, { command: 'god-write', mode: 'write' });
      augmentedTopic = descResult.augmentedPrompt;
    } catch {
      // DESC unavailable — proceed without episodic augmentation
    }

    // Fix 10: Skip DAI-001 agent selection for write() — it picks wrong agents
    // (e.g., system-designer for academic topics) and injects irrelevant instructions.
    // Instead, build a clean write-specific prompt from writing instructions + topic.
    const style = options.style ?? 'professional';
    const length = options.length ?? 'medium';
    const format = options.format ?? 'article';

    // Get style prompt from learned profile if available
    let stylePrompt: string | null = null;
    if (this.deps.styleProfileManager) {
      if (options.styleProfileId) {
        stylePrompt = this.deps.styleProfileManager.generateStylePrompt(options.styleProfileId);
      } else if (options.useActiveStyleProfile !== false) {
        stylePrompt = this.deps.styleProfileManager.generateStylePrompt();
      }
    }

    // Build writing instructions with style, format, length, and style profile
    const writingInstructions = this.buildWritingInstructions(style, format, length, stylePrompt);

    // Build clean prompt: writing instructions + topic only (no agent selection noise)
    const writePrompt = `${writingInstructions}\n\n## Topic\n${augmentedTopic}`;

    // Wrap in agentSelection-like structure for compatibility with downstream code.
    // The selection object is a stub — write() bypasses agent routing (Fix 10) and
    // only uses this for the fallback executeTaskDefault path.
    const agentSelection: { selection: IAgentSelectionResult; prompt: string; context?: string } = {
      selection: {
        selected: { key: 'academic-writer', category: 'writing' } as IAgentSelectionResult['selected'],
        candidates: [] as IAgentSelectionResult['candidates'],
        analysis: { taskType: 'write' } as IAgentSelectionResult['analysis'],
      },
      prompt: writePrompt,
      context: undefined,
    };
    this.deps.log(`write() prompt built: style=${style}, format=${format}, length=${length}, styleProfile=${!!stylePrompt}`);

    // Create trajectory for learning (FR-11)
    let trajectoryId: string | undefined;
    if (this.deps.trajectoryBridge) {
      try {
        const embedding = await this.deps.embed(topic);
        const trajectory = await this.deps.trajectoryBridge.createTrajectoryFromInteraction(
          topic, 'write', embedding
        );
        trajectoryId = trajectory.trajectoryId;
      } catch (error) {
        this.deps.log(`Warning: Trajectory creation failed in write(): ${error}`);
      }
    }

    // Get relevant knowledge (existing InteractionStore)
    const knowledge = await this.deps.retrieveRelevant(topic, 'write');

    // =========================================================================
    // WHITELIST MODE vs RAG MODE
    // Whitelist mode: Build source constraint from manifest, NO chunk injection.
    // Claude uses training knowledge constrained to curated source list.
    // RAG mode: Retrieve chunks from ChromaDB and inject into prompt.
    // =========================================================================
    let corpusChunks: ContextChunk[] = [];
    let corpusContextInfo = {
      used: false,
      chunkCount: 0,
      collections: [] as string[],
      citations: [] as string[],
    };
    let corpusConstraint: CorpusConstraint | undefined;
    let citationBudgetResult: CitationBudgetResult | undefined;

    // Gold standard diagnostic logger — writes to stderr directly, bypassing verbose gate.
    // All other orchestrator logs go through this.deps.log() which requires verbose=true.
    const goldLog = (msg: string) => {
      if (options.whitelistMode) {
        process.stderr.write(`[GOLD STD] ${msg}\n`);
      }
    };

    // Multi-step diagnostics tracking (scoped outside whitelistMode block for return access)
    let preventionPlan: {
      blacklistedAuthors: string[];
      strengthenedConstraints: string[];
      underCitedSources: string[];
      overCitedSources: string[];
    } | undefined;
    let multiStepV1Stats: {
      wordCount: number; citationCount: number; quotationCount: number;
      claimsWithoutCitation: number; factualClaimsWithoutCitation: number;
      interpretiveClaimsWithoutCitation: number; uniqueAuthors: string[];
      issues: Array<{ type: string; severity: string; detail: string }>;
      qualityScore?: number;
    } | undefined;
    let primaryAuthors: string[] = [];
    let rollingContextDiagnostics: import('./universal-agent.js').WriteResult['rollingContext'] | undefined;
    let rollingContextContent: string | undefined;

    if (options.whitelistMode) {
      // ===== GOLD STANDARD MODE =====
      // Replicates the exact approach that produced the gold standard document:
      // Multi-query chunk retrieval + style profile injection + knowledge units
      // + gold standard 7-section prompt + single-shot generation.
      // Chunks ARE injected (unlike the old whitelist approach).
      goldLog('Multi-query retrieval + style + single-shot generation...');

      try {
        // Step 1: Multi-query chunk retrieval (replicates parent Claude's manual process)
        // Phase 1a: Semantic keyword queries (not raw heading text)
        const subQueries = this.extractSemanticRetrievalQueries(topic);
        const targetChunks = options.corpusChunkCount ?? GOLD_STANDARD_CONFIG.targetChunks; // Match gold standard's 28 chunks (less = shorter prompt = longer output)
        const retrievalOpts: RetrievalOptions = {
          collections: options.corpusCollections || [],
          minRelevance: options.corpusMinRelevance ?? 0.0, // Low threshold, rank later
          diversityBoost: true,
          rerank: true,
        };

        if (this.deps.smartRetrieval) {
          const allChunks: ContextChunk[] = [];
          const seenIds = new Set<string>();

          const addChunks = (chunks: ContextChunk[]) => {
            for (const c of chunks) {
              const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
              if (!seenIds.has(id)) {
                seenIds.add(id);
                allChunks.push(c);
              }
            }
          };

          // Phase 1a: Multi-query semantic retrieval
          goldLog(`Phase 1a: Multi-query retrieval: ${subQueries.length} semantic queries`);
          for (const sq of subQueries) {
            goldLog(`  Query: "${sq}"`);
          }
          const perQueryMax = Math.ceil(targetChunks / Math.max(subQueries.length, 1)) + 5;

          for (const sq of subQueries) {
            try {
              const chunks = await this.deps.smartRetrieval.retrieveContext(sq, {
                ...retrievalOpts,
                maxChunks: perQueryMax,
              });
              addChunks(chunks);
            } catch (e) {
              goldLog(`Sub-query failed for "${sq}": ${e}`);
            }
          }
          goldLog(`Phase 1a result: ${allChunks.length} unique chunks from ${new Set(allChunks.map(c => c.metadata.author)).size} sources`);

          // Phase 1b: Primary-author-aware retrieval
          // Extract ALL named authors from prompt (not just 2+ mentions) and run
          // author-targeted queries. This ensures primary sources (Aristotle, Heidegger)
          // get adequate representation even when semantic search favors secondary literature.
          primaryAuthors = this.extractPrimaryAuthors(topic);
          const keyAuthors = primaryAuthors.length > 0 ? primaryAuthors : this.extractKeyAuthors(topic);
          if (keyAuthors.length > 0) {
            goldLog(`Phase 1b: Source-targeted supplementation for: ${keyAuthors.join(', ')}`);
            for (const author of keyAuthors.slice(0, 3)) {
              try {
                // Run topic query filtered to this author's works
                const authorChunks = await this.deps.smartRetrieval.retrieveContext(topic.substring(0, 300), {
                  ...retrievalOpts,
                  maxChunks: 16,
                  whereFilter: { author_raw: { $eq: author } },
                });
                const before = allChunks.length;
                addChunks(authorChunks);
                goldLog(`  ${author}: +${allChunks.length - before} new chunks (${authorChunks.length} retrieved)`);

                // If too few results with exact match, try contains
                if (authorChunks.length < 4) {
                  const looseChunks = await this.deps.smartRetrieval.retrieveContext(
                    `${author} ${topic.substring(0, 100)}`,
                    { ...retrievalOpts, maxChunks: 10 }
                  );
                  const looseFiltered = looseChunks.filter(c =>
                    (c.metadata.author || '').toLowerCase().includes(author.toLowerCase())
                  );
                  addChunks(looseFiltered);
                }
              } catch (e) {
                goldLog(`  ${author} supplementation failed: ${e}`);
              }
            }
            goldLog(`Phase 1b result: ${allChunks.length} total unique chunks`);
          }

          // Phase 1b+: Title-targeted retrieval (Fix 68)
          // When the prompt references specific works (e.g., "De Anima III.3"), run
          // title-filtered queries so those works get adequate representation even when
          // other texts by the same author dominate by sheer chunk volume.
          const workRefs = extractWorkReferences(topic, loadDomainConfig());
          if (workRefs.length > 0) {
            goldLog(`Phase 1b+: Title-targeted retrieval for ${workRefs.length} referenced work(s)`);
            for (const { titleRaw, mentions } of workRefs) {
              try {
                // Use short title + key concepts as query (not full topic — poor match for specific works)
                // Drop minRelevance to 0.0 — the title filter is the constraint, not similarity
                const shortQuery = `${titleRaw.split(/[-:(]/)[0].trim()} ${topic.substring(0, 150)}`;
                const titleChunks = await this.deps.smartRetrieval!.retrieveContext(shortQuery, {
                  ...retrievalOpts,
                  minRelevance: 0.0, // title filter is the selectivity, not embedding score
                  maxChunks: Math.min(4 + mentions * 2, 12), // more mentions = more chunks
                  whereFilter: { title_raw: { $eq: titleRaw } },
                });
                const before = allChunks.length;
                addChunks(titleChunks);
                goldLog(`  "${titleRaw}" (${mentions} mention${mentions > 1 ? 's' : ''}): +${allChunks.length - before} new chunks (${titleChunks.length} retrieved)`);
              } catch (e) {
                goldLog(`  "${titleRaw}" title retrieval failed: ${e}`);
              }
            }
            goldLog(`Phase 1b+ result: ${allChunks.length} total unique chunks`);
          }

          // Phase 1c: Source diversity enforcement
          // Ensure no single author dominates (like gold standard's 13 distinct works)
          corpusChunks = this.enforceSourceDiversity(allChunks, {
            maxPerSource: 8,
            targetTotal: targetChunks,
          });

          const authorCounts = new Map<string, number>();
          for (const c of corpusChunks) {
            const a = c.metadata.author || 'Unknown';
            authorCounts.set(a, (authorCounts.get(a) || 0) + 1);
          }
          goldLog(`Phase 1c: Diversity-enforced selection: ${corpusChunks.length} chunks`);
          for (const [author, count] of Array.from(authorCounts.entries()).sort((a, b) => b[1] - a[1])) {
            goldLog(`  ${author}: ${count} chunks`);
          }

          // Phase 1c+: Soft primary ratio check (warning, not hard enforcement)
          // Verify that named primary authors have adequate representation in the pool.
          // Target: ≥30% primary chunks. If below, log warning and notify the model.
          if (primaryAuthors.length > 0) {
            const primaryLower = primaryAuthors.map(a => a.toLowerCase());
            const primaryChunkCount = corpusChunks.filter(c =>
              primaryLower.some(pa => (c.metadata.author || '').toLowerCase().includes(pa))
            ).length;
            const primaryRatio = corpusChunks.length > 0 ? primaryChunkCount / corpusChunks.length : 0;
            goldLog(`Phase 1c+: Primary author ratio: ${primaryChunkCount}/${corpusChunks.length} = ${(primaryRatio * 100).toFixed(0)}% (target: ≥30%)`);
            if (primaryRatio < GOLD_STANDARD_CONFIG.primaryRatioThreshold) {
              goldLog(`  ⚠️ PRIMARY UNDER-COVERAGE: Only ${(primaryRatio * 100).toFixed(0)}% of chunks are from primary authors (${primaryAuthors.join(', ')})`);
              goldLog(`  The model will be warned to weaken unsupported claims about under-represented authors.`);
            }
          }

          // Phase 1d: Intelligent chunk trimming (P0 — research-validated)
          // Gold standard had ~450 chars/chunk. Current chunks average ~2,071 chars.
          // Trimming reduces prompt from ~67K → ~27K chars, which:
          // - Fixes output compression (model generates longer text with shorter prompts)
          // - Reduces "lost in the middle" effect (20-30% accuracy improvement)
          // - Preserves quotation-bearing and argument-dense sentences
          const preTrimedTotal = corpusChunks.reduce((sum, c) => sum + (c.content?.length || 0), 0);
          const avgPreTrim = Math.round(preTrimedTotal / Math.max(corpusChunks.length, 1));
          for (const chunk of corpusChunks) {
            if (chunk.content) {
              chunk.content = this.trimChunkContent(chunk.content, GOLD_STANDARD_CONFIG.chunkTrimTarget);
            }
          }
          const postTrimTotal = corpusChunks.reduce((sum, c) => sum + (c.content?.length || 0), 0);
          const avgPostTrim = Math.round(postTrimTotal / Math.max(corpusChunks.length, 1));
          goldLog(`Phase 1d: Chunk trimming: ${avgPreTrim} → ${avgPostTrim} avg chars/chunk (${((1 - postTrimTotal / preTrimedTotal) * 100).toFixed(0)}% reduction)`);

          // Phase 1e: Reorder chunks for attention (P0 — research-validated)
          // LongLLMLingua shows 21.4% improvement from placing most-relevant at edges
          corpusChunks = this.reorderChunksForAttention(corpusChunks);
          goldLog(`Phase 1e: Chunks reordered for attention (highest relevance at start/end)`);

          // Phase 1f: Retrieval coverage validation
          // Ensure key authors from topic have sufficient chunks. If missing, attempt
          // targeted supplementation. Prevents "garbage in, garbage out" failures.
          const coverage = this.validateRetrievalCoverage(topic, corpusChunks, 2);
          goldLog(`Phase 1f: Retrieval coverage validation`);
          for (const line of coverage.coverageReport) {
            goldLog(line);
          }
          if (coverage.missingAuthors.length > 0 || coverage.weakAuthors.length > 0) {
            const authorsToFetch = [...coverage.missingAuthors, ...coverage.weakAuthors];
            goldLog(`Phase 1f: Attempting targeted retrieval for ${authorsToFetch.length} under-represented author(s)`);
            for (const author of authorsToFetch) {
              try {
                // Try author-filtered query first
                const authorChunks = await this.deps.smartRetrieval!.retrieveContext(
                  `${author} ${topic.substring(0, 150)}`,
                  { ...retrievalOpts, maxChunks: 8, whereFilter: { author_raw: { $eq: author } } }
                );
                let added = 0;
                for (const c of authorChunks) {
                  const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
                  if (!seenIds.has(id)) {
                    seenIds.add(id);
                    if (c.content) c.content = this.trimChunkContent(c.content, GOLD_STANDARD_CONFIG.chunkTrimTarget);
                    corpusChunks.push(c);
                    added++;
                  }
                }
                // Fallback: loose semantic search if author filter returned nothing
                if (added === 0) {
                  const looseChunks = await this.deps.smartRetrieval!.retrieveContext(
                    `${author}`,
                    { ...retrievalOpts, maxChunks: 8 }
                  );
                  const filtered = looseChunks.filter(c =>
                    (c.metadata.author || '').toLowerCase().includes(author.toLowerCase())
                  );
                  for (const c of filtered) {
                    const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
                    if (!seenIds.has(id)) {
                      seenIds.add(id);
                      if (c.content) c.content = this.trimChunkContent(c.content, GOLD_STANDARD_CONFIG.chunkTrimTarget);
                      corpusChunks.push(c);
                      added++;
                    }
                  }
                }
                goldLog(`  ${author}: +${added} chunks from targeted retrieval`);
              } catch (e) {
                goldLog(`  ${author}: targeted retrieval failed: ${e}`);
              }
            }
            // Re-validate after supplementation
            const postCoverage = this.validateRetrievalCoverage(topic, corpusChunks, 2);
            if (postCoverage.missingAuthors.length > 0) {
              goldLog(`⚠️ WARNING: Still missing chunks for: ${postCoverage.missingAuthors.join(', ')}`);
              goldLog(`  Pipeline will proceed, but claims about these authors cannot be grounded.`);
            }
          }
        } else {
          goldLog('WARNING: No smartRetrieval available — generating without chunks');
        }

        // Step 2: Load knowledge units (graceful if file missing)
        let knowledgeUnitLines: string[] = [];
        try {
          const fs = await import('fs');
          const path = await import('path');
          const kuPath = path.join(process.cwd(), 'god-learn', 'knowledge.jsonl');
          if (fs.existsSync(kuPath)) {
            const lines = fs.readFileSync(kuPath, 'utf-8').split('\n').filter(Boolean);
            const allKUs = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
            // Extract domain keywords from topic for filtering
            const topicLower = topic.toLowerCase();
            const domainKeywords = getDomainKeywords(loadDomainConfig());
            const relevantDomains = domainKeywords.filter(d => topicLower.includes(d));
            const relevant = allKUs.filter((ku: any) =>
              relevantDomains.some(d => (ku.claim || ku.content || '').toLowerCase().includes(d))
            );
            knowledgeUnitLines = (relevant.length > 0 ? relevant : allKUs)
              .slice(0, 10)
              .map((ku: any) => `- ${ku.claim || ku.content} (${ku.source || 'corpus'})`);
            goldLog(`Loaded ${knowledgeUnitLines.length} knowledge units (${relevant.length} domain-relevant)`);
          } else {
            this.deps.log('GOLD STD: No knowledge.jsonl found — skipping KU section');
          }
        } catch (e) {
          goldLog(`Knowledge unit loading failed: ${e}`);
        }

        // Step 2b: Load structural reasoning edges (graceful if file missing)
        // See docs/research/ku-reasoning-edge-system-analysis.md §9.2
        let structuralEdgeLines: string[] = [];
        try {
          const fs2 = await import('fs');
          const path2 = await import('path');
          const edgePath = path2.join(process.cwd(), 'god-reason', 'reasoning.jsonl');
          if (fs2.existsSync(edgePath)) {
            const edgeLines = fs2.readFileSync(edgePath, 'utf-8').split('\n').filter(Boolean);
            const allEdges = edgeLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
            // Filter edges relevant to the topic by matching source/target against topic terms
            const topicTerms = topic.toLowerCase().split(/\s+/).filter(t => t.length > 3);
            const relevantEdges = allEdges.filter((e: any) => {
              const src = (e.source || '').toLowerCase();
              const tgt = (e.target || '').toLowerCase();
              return topicTerms.some(t => src.includes(t) || tgt.includes(t) || t.includes(src) || t.includes(tgt));
            });
            // Sort by corroboration_score (if present), then by generation_epoch (newer first)
            relevantEdges.sort((a: any, b: any) => {
              const scoreDiff = (b.corroboration_score || 1) - (a.corroboration_score || 1);
              if (scoreDiff !== 0) return scoreDiff;
              return (b.generation_epoch || 0) - (a.generation_epoch || 0);
            });
            // Format as readable constraint lines (limit to 30 to avoid prompt bloat)
            structuralEdgeLines = relevantEdges.slice(0, 30).map((e: any) =>
              `- ${e.source} ${(e.relation || 'relates_to').toUpperCase()} ${e.target}` +
              (e.pipeline ? ` (${e.pipeline})` : '') +
              (e.corroboration_score && e.corroboration_score > 1 ? ` [corroborated]` : '')
            );
            goldLog(`Loaded ${structuralEdgeLines.length} structural edges (${relevantEdges.length} relevant of ${allEdges.length} total)`);
          } else {
            goldLog('No reasoning.jsonl found — skipping structural edges');
          }
        } catch (e) {
          goldLog(`Structural edge loading failed: ${e}`);
        }

        // Step 2c: Load corpus index context
        let ontologyLines: string[] = [];
        let hookLines: string[] = [];
        let tensionLines: string[] = [];
        try {
          const { loadCorpusIndexContext } = await import('./corpus-index-provider.js');
          const corpusCtx = loadCorpusIndexContext(topic, {
            maxOntologyNodes: 12, maxHooks: 3, maxTensionEdges: 5,
          });
          ontologyLines = corpusCtx.ontologyLines;
          hookLines = corpusCtx.hookLines;
          tensionLines = corpusCtx.tensionLines;
          if (ontologyLines.length > 0 || hookLines.length > 0 || tensionLines.length > 0) {
            goldLog(`Corpus index: ${ontologyLines.length} nodes, ${hookLines.length} hooks, ${tensionLines.length} tensions`);
          }
        } catch (e) {
          goldLog(`Corpus index loading failed: ${e}`);
        }

        // Step 3: Load style profile
        // GOLD_V1=1 disables style injection (replicates v1 timeline: Feb 7 8:16 AM)
        let goldStylePrompt = '';
        if (!process.env.GOLD_V1) {
          goldStylePrompt = stylePrompt || '';
          if (!goldStylePrompt && this.deps.styleProfileManager) {
            goldStylePrompt = this.deps.styleProfileManager.generateStylePrompt() ?? '';
          }
        }
        goldLog(`Style profile: ${goldStylePrompt ? `loaded (${goldStylePrompt.length} chars)` : 'NONE (v1 mode)'}`);
        goldLog(`Knowledge units: ${knowledgeUnitLines.length}`);

        // Step 4: Build gold standard 7-section prompt
        const subsections = this.extractRetrievalQueries(topic);
        goldLog(`Prompt subsections: ${subsections.length} (from extractRetrievalQueries)`);
        const wordTarget = length === 'comprehensive' || (!length && options.whitelistMode) ? '3,000-3,500' :
                      length === 'long' ? '2,000-2,500' :
                      length === 'medium' ? '1,500-2,000' : '800-1,000';

        // Multi-step mode: v1 (no style) → investigate → v2 (styled + prevention plan)
        if (options.multiStep) {
          goldLog('=== MULTI-STEP MODE: v1 → investigate → v2 ===');

          // --- V1: Diagnostic generation (no style profile) ---
          goldLog('Step 4a: Building v1 prompt (no style, grounding focus)...');
          const v1Prompt = this.buildGoldStandardPrompt({
            topic,
            subsections,
            chunks: corpusChunks,
            knowledgeUnits: knowledgeUnitLines,
            structuralEdges: structuralEdgeLines,
            ontologyNodes: ontologyLines,
            crossPipelineHooks: hookLines,
            tensionEdges: tensionLines,
            stylePrompt: '', // No style for diagnostic v1
            wordTarget,
          });

          goldLog(`V1 prompt assembled (${v1Prompt.length} chars). Generating v1...`);
          let v1Content: string;
          try {
            v1Content = await this.generateViaClaudeCode(v1Prompt, {
              model: 'claude-opus-4-6',
              maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens,
            });
            goldLog(`V1 generation complete: ${v1Content.split(/\s+/).length} words`);
          } catch (e) {
            goldLog(`V1 generation failed: ${e}. Falling back to single-shot.`);
            // Fallback to single-shot if v1 generation fails
            const goldPrompt = this.buildGoldStandardPrompt({
              topic, subsections, chunks: corpusChunks,
              knowledgeUnits: knowledgeUnitLines,
              structuralEdges: structuralEdgeLines,
              ontologyNodes: ontologyLines,
              crossPipelineHooks: hookLines,
              tensionEdges: tensionLines,
              stylePrompt: goldStylePrompt, wordTarget,
            });
            agentSelection.prompt = goldPrompt;
            goldLog(`Fallback: single-shot prompt assembled (${goldPrompt.length} chars)`);
            // Skip rest of multi-step
            options.multiStep = false;
            preventionPlan = undefined;
            // Jump to the prompt assignment below
            v1Content = '';
          }

          if (options.multiStep && v1Content) {
            // --- Run quality gauntlet on v1 (scoring only, no revision) ---
            let v1GauntletScore: number | undefined;
            let v1FailedStages: string[] = [];
            if (this.deps.qualityIntegration) {
              try {
                goldLog('Step 4b-pre: Running quality gauntlet on v1...');
                const v1Gauntlet = await this.deps.qualityIntegration.validateAndRevise(v1Content, {
                  topic,
                  style,
                  format,
                  enabled: true,
                  maxRevisions: 0, // Score only
                  corpusChunks: corpusChunks.length > 0 ? corpusChunks : undefined,
                  knownAuthors: corpusConstraint?.sources?.map((s: any) => s.author).filter(Boolean) ?? [],
                });
                v1GauntletScore = v1Gauntlet.qualityScore;
                const metrics = v1Gauntlet.metrics as any;
                if (metrics?.stageScores) {
                  for (const [stage, score] of Object.entries(metrics.stageScores)) {
                    if (typeof score === 'number' && score < 0.7) {
                      v1FailedStages.push(`${stage}: ${(score * 100).toFixed(0)}%`);
                    }
                  }
                }
                goldLog(`V1 quality gauntlet: ${(v1GauntletScore * 100).toFixed(1)}% (${v1FailedStages.length} weak stages)`);
                for (const stage of v1FailedStages) {
                  goldLog(`  ⚠️ ${stage}`);
                }
              } catch (e) {
                goldLog(`V1 quality gauntlet failed: ${e}`);
              }
            }

            // --- Investigate v1 (local string analysis, no LLM) ---
            goldLog('Step 4b: Investigating v1 output (local analysis)...');
            const manifestAuthors = corpusConstraint?.sources?.map((s: any) => s.author).filter(Boolean) ??
              [...new Set(corpusChunks.map(c => c.metadata.author).filter(Boolean))];
            const investigation = this.investigateV1(v1Content, corpusChunks, manifestAuthors);

            // Incorporate gauntlet results into investigation
            if (v1FailedStages.length > 0) {
              investigation.preventionPlan.strengthenedConstraints.push(
                `V1 quality gauntlet flagged weak stages: ${v1FailedStages.join(', ')}. Pay special attention to these areas in v2.`
              );
            }

            goldLog(`Investigation results:`);
            goldLog(`  Word count: ${investigation.stats.wordCount}`);
            goldLog(`  Citations: ${investigation.stats.citationCount}`);
            goldLog(`  Quotations: ${investigation.stats.quotationCount}`);
            goldLog(`  Unique authors cited: ${investigation.stats.uniqueAuthors.join(', ')}`);
            goldLog(`  Issues: ${investigation.issues.length} (${investigation.issues.filter(i => i.severity === 'critical').length} critical)`);
            for (const issue of investigation.issues.filter(i => i.severity === 'critical').slice(0, 5)) {
              goldLog(`    [${issue.severity}] ${issue.type}: ${issue.detail.substring(0, 100)}`);
            }
            goldLog(`  Prevention plan:`);
            goldLog(`    Blacklisted: ${investigation.preventionPlan.blacklistedAuthors.join(', ') || 'none'}`);
            goldLog(`    Under-cited: ${investigation.preventionPlan.underCitedSources.join(', ') || 'none'}`);
            goldLog(`    Constraints: ${investigation.preventionPlan.strengthenedConstraints.length}`);

            preventionPlan = investigation.preventionPlan;

            // Store v1 diagnostics for output JSON
            multiStepV1Stats = {
              wordCount: investigation.stats.wordCount,
              citationCount: investigation.stats.citationCount,
              quotationCount: investigation.stats.quotationCount,
              claimsWithoutCitation: investigation.stats.claimsWithoutCitation,
              factualClaimsWithoutCitation: investigation.stats.factualClaimsWithoutCitation,
              interpretiveClaimsWithoutCitation: investigation.stats.interpretiveClaimsWithoutCitation,
              uniqueAuthors: investigation.stats.uniqueAuthors,
              issues: investigation.issues,
              qualityScore: v1GauntletScore,
            };

            // --- Supplemental retrieval for under-cited sources ---
            if (investigation.preventionPlan.underCitedSources.length > 0 && this.deps.smartRetrieval) {
              goldLog(`Step 4b+: Supplemental retrieval for ${investigation.preventionPlan.underCitedSources.length} under-cited source(s)...`);
              // Build seen set from existing chunks (seenIds from Phase 1a may be out of scope)
              const existingIds = new Set(corpusChunks.map(c =>
                c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`
              ));
              for (const author of investigation.preventionPlan.underCitedSources.slice(0, 3)) {
                try {
                  const supplemental = await this.deps.smartRetrieval.retrieveContext(
                    `${author} ${topic.substring(0, 100)}`,
                    { ...retrievalOpts, maxChunks: 6 }
                  );
                  const filtered = supplemental.filter(c =>
                    (c.metadata.author || '').toLowerCase().includes(author.toLowerCase())
                  );
                  let added = 0;
                  for (const c of filtered) {
                    const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
                    if (!existingIds.has(id)) {
                      existingIds.add(id);
                      if (c.content) c.content = this.trimChunkContent(c.content, GOLD_STANDARD_CONFIG.chunkTrimTarget);
                      corpusChunks.push(c);
                      added++;
                    }
                  }
                  if (added > 0) goldLog(`    ${author}: +${added} supplemental chunks`);
                } catch (e) {
                  goldLog(`    ${author}: supplemental retrieval failed: ${e}`);
                }
              }
            }

            // --- V2: Styled generation with prevention plan ---
            goldLog('Step 4c: Building v2 prompt (full style + prevention plan)...');
          }
        }

        // Build per-section citation constraints from prompt structure + primary authors
        const sectionConstraints = this.buildSectionConstraints(subsections, primaryAuthors);
        if (sectionConstraints.length > 0) {
          goldLog(`Per-section constraints: ${sectionConstraints.length} rules derived from prompt structure`);
        }

        // ---- Rolling Context Branch ----
        // If --rolling-context is enabled, use per-section rolling generation instead of single-shot.
        // The v1→investigate→v2 multi-step path runs first (if enabled) to produce preventionPlan,
        // then rolling context takes over for v2 generation.
        if (options.rollingContext) {
          goldLog('=== ROLLING CONTEXT MODE ===');

          // Build corpus constraint BEFORE rolling generation (needed for post-processing)
          if (corpusChunks.length > 0) {
            const additionalSources = await this.cachedLoadCorpusManifest({
              collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
            }).catch(() => [] as CorpusSource[]);
            corpusConstraint = buildCorpusConstraint(corpusChunks, {
              enforcement: 'strict',
              missingCitationPlaceholder: '',
              minRelevance: 0.0,
              additionalSources,
            });
            goldLog(`Corpus constraint built: ${corpusConstraint.sources.length} verified sources`);
          }

          const rollingResult = await this.writeRollingContext(
            topic,
            subsections,
            corpusChunks,
            knowledgeUnitLines,
            structuralEdgeLines,
            goldStylePrompt,
            wordTarget,
            preventionPlan,
            sectionConstraints,
            ontologyLines,
            hookLines,
            tensionLines,
          );

          // Set content for post-processing pipeline (hoisted variable — `content` isn't declared yet)
          rollingContextContent = rollingResult.content;
          rollingContextDiagnostics = rollingResult.diagnostics;

          // Build corpus context info
          const citations = corpusChunks.map(chunk =>
            `${chunk.metadata.author} (${chunk.metadata.year}), p.${chunk.metadata.page_start}`
          );
          corpusContextInfo = {
            used: true,
            chunkCount: corpusChunks.length,
            collections: options.corpusCollections || [],
            citations: Array.from(new Set(citations)),
          };

          // Skip single-shot gold prompt generation — jump to post-processing
          // (The rest of the whitelist block below only builds the single-shot prompt)
        } else {
        // ---- Single-Shot Gold Standard Path ----

        // Compute primary under-coverage for warning injection
        let primaryUnderCoverage: string[] | undefined;
        if (primaryAuthors.length > 0) {
          const primaryLower = primaryAuthors.map(a => a.toLowerCase());
          const primaryChunkCount = corpusChunks.filter(c =>
            primaryLower.some(pa => (c.metadata.author || '').toLowerCase().includes(pa))
          ).length;
          const primaryRatio = corpusChunks.length > 0 ? primaryChunkCount / corpusChunks.length : 0;
          if (primaryRatio < GOLD_STANDARD_CONFIG.primaryRatioThreshold) {
            // Find which specific primary authors are under-represented
            primaryUnderCoverage = primaryAuthors.filter(author => {
              const count = corpusChunks.filter(c =>
                (c.metadata.author || '').toLowerCase().includes(author.toLowerCase())
              ).length;
              return count < 2;
            });
          }
        }

        const goldPrompt = this.buildGoldStandardPrompt({
          topic,
          subsections,
          chunks: corpusChunks,
          knowledgeUnits: knowledgeUnitLines,
          structuralEdges: structuralEdgeLines,
          ontologyNodes: ontologyLines,
          crossPipelineHooks: hookLines,
          tensionEdges: tensionLines,
          stylePrompt: goldStylePrompt,
          wordTarget,
          preventionPlan,
          sectionConstraints,
          primaryUnderCoverage,
        });

        // Replace the agentSelection prompt with the gold standard prompt
        agentSelection.prompt = goldPrompt;
        goldLog(`Prompt assembled (${goldPrompt.length} chars, ${subsections.length} subsections, ${corpusChunks.length} chunks${preventionPlan ? ', with prevention plan' : ''})`);

        // Step 5: Build corpus constraint for post-gen verification
        if (corpusChunks.length > 0) {
          const additionalSources = await this.cachedLoadCorpusManifest({
            collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
          }).catch(() => [] as CorpusSource[]);

          corpusConstraint = buildCorpusConstraint(corpusChunks, {
            enforcement: 'strict',
            missingCitationPlaceholder: '',
            minRelevance: 0.0,
            additionalSources,
          });
          goldLog(`Corpus constraint built: ${corpusConstraint.sources.length} verified sources`);
        } else {
          // Fallback: constraint from manifest only
          const manifestSources = await this.cachedLoadCorpusManifest({
            collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
          }).catch(() => [] as CorpusSource[]);
          if (manifestSources.length > 0) {
            corpusConstraint = {
              sources: manifestSources,
              enforcement: 'strict',
              missingCitationPlaceholder: '',
            };
          }
        }

        // Build citation list for corpusContextInfo
        const citations = corpusChunks.map(chunk =>
          `${chunk.metadata.author} (${chunk.metadata.year}), p.${chunk.metadata.page_start}`
        );

        corpusContextInfo = {
          used: true,
          chunkCount: corpusChunks.length,
          collections: options.corpusCollections || [],
          citations: Array.from(new Set(citations)),
        };
        } // end single-shot else block
      } catch (error) {
        this.deps.log(`Warning: Gold standard mode setup failed: ${error}`);
        // If retrieval fails, the prompt still has the base writing instructions
      }
    } else if (options.useCorpus) {
      // ===== RAG MODE (Current Approach) =====
      try {
        this.deps.log('Retrieving corpus context for source-grounded generation...');

        // Multi-query retrieval: decompose the topic into sub-queries for better
        // source diversity. A single long prompt biases toward whichever author
        // dominates the corpus for the combined topic vector.
        const subQueries = this.extractRetrievalQueries(topic);
        const maxChunks = options.corpusChunkCount ?? 15;
        const retrievalOpts: RetrievalOptions = {
          collections: options.corpusCollections || [],
          minRelevance: options.corpusMinRelevance ?? 0.35,
          diversityBoost: true,
          rerank: true,
        };

        if (subQueries.length > 1) {
          this.deps.log(`Multi-query retrieval: ${subQueries.length} sub-queries`);
          const perQueryMax = Math.ceil(maxChunks / subQueries.length) + 5;
          const allChunks: ContextChunk[] = [];
          const seenIds = new Set<string>();

          for (const sq of subQueries) {
            const chunks = await this.deps.smartRetrieval!.retrieveContext(sq, {
              ...retrievalOpts,
              maxChunks: perQueryMax,
            });
            for (const c of chunks) {
              const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
              if (!seenIds.has(id)) {
                seenIds.add(id);
                allChunks.push(c);
              }
            }
          }

          // Sort by relevance and cap at maxChunks
          allChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
          corpusChunks = allChunks.slice(0, maxChunks);
        } else {
          corpusChunks = await this.deps.smartRetrieval!.retrieveContext(topic, {
            ...retrievalOpts,
            maxChunks,
          });
        }

        // Build citation list
        const citations = corpusChunks.map(chunk =>
          `${chunk.metadata.author} (${chunk.metadata.year}), p.${chunk.metadata.page_start}`
        );

        corpusContextInfo = {
          used: true,
          chunkCount: corpusChunks.length,
          collections: options.corpusCollections || [],
          citations: Array.from(new Set(citations)), // Deduplicate
        };

        this.deps.log(`Retrieved ${corpusChunks.length} corpus chunks from corpus`);
      } catch (error) {
        this.deps.log(`Warning: Corpus retrieval failed: ${error}`);
        // Continue without corpus (graceful degradation)
      }

      // Build corpus constraint for hallucination prevention (RAG mode)
      if (corpusChunks.length > 0) {
        try {
          const additionalSources = dataSourceMode === 'corpus'
            ? []
            : await this.cachedLoadCorpusManifest({
                collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
              });

          corpusConstraint = buildCorpusConstraint(corpusChunks, {
            enforcement: 'strict',
            missingCitationPlaceholder: '[CITATION NEEDED]',
            minRelevance: 0.0,
            additionalSources,
          });

          const uniqueAuthors = [...new Set(corpusConstraint.sources.map(s => s.author))].sort();
          this.deps.log(`Corpus constraint built: ${corpusConstraint.sources.length} verified sources (${uniqueAuthors.join(', ')})`);

          const constraintPrompt = this.buildCorpusConstraintPromptText(corpusConstraint);
          const corpusContextBlock = this.buildCorpusContextBlock(corpusChunks);

          agentSelection.prompt = `${agentSelection.prompt}\n\n${constraintPrompt}\n\n${corpusContextBlock}`;
          this.deps.log(`Corpus constraint + ${corpusChunks.length} chunk texts injected into agent prompt`);
        } catch (error) {
          this.deps.log(`Warning: Failed to build corpus constraint: ${error}`);
        }
      }

      // Citation Budget Check (RAG mode only)
      if (corpusChunks.length > 0) {
        try {
          const targetWords = length === 'comprehensive' ? 3500 :
                             length === 'long' ? 2500 :
                             length === 'medium' ? 1500 : 800;

          citationBudgetResult = calculateCitationBudget(corpusChunks, {
            targetWords,
            documentType: format === 'paper' ? 'dissertation' : 'paper',
          });

          if (citationBudgetResult.sufficient) {
            this.deps.log(`Citation budget: ${citationBudgetResult.maxSupportableCitations} citations available for ${targetWords} words`);
          } else {
            this.deps.log(`Citation budget warning: ${citationBudgetResult.warning}`);
            for (const rec of citationBudgetResult.recommendations.slice(0, 2)) {
              this.deps.log(`   ${rec}`);
            }
          }
        } catch (error) {
          this.deps.log(`Warning: Citation budget check failed: ${error}`);
        }
      }
    }

    // Fix 28: Fail-fast on insufficient corpus chunks in corpus-only mode.
    // Prevents "write 1500 words with 3 chunks → hallucinate citations" failure mode.
    // Skip this check in whitelist mode — whitelist doesn't need chunks.
    if (dataSourceMode === 'corpus' && !options.whitelistMode) {
      const minByLength: Record<string, number> = {
        short: 4,
        medium: 8,
        long: 14,
        comprehensive: 20,
      };

      // If user explicitly set corpusChunkCount, trust their judgment as an override
      const lengthKey = options.length ?? 'medium';
      const minRequired = options.corpusChunkCount ?? minByLength[lengthKey] ?? 8;
      const actualChunks = corpusChunks.length;

      if (actualChunks < minRequired) {
        throw new Error(
          `Corpus-only mode requires at least ${minRequired} chunks for length="${lengthKey}"; ` +
          `got ${actualChunks}. Options:\n` +
          `  - Broaden collections (current: ${(options.corpusCollections || []).join(', ') || 'all'})\n` +
          `  - Lower --corpus-relevance (current: ${options.corpusMinRelevance ?? 0.75})\n` +
          `  - Reduce --length\n` +
          `  - Set --corpus-chunks ${actualChunks} to explicitly accept low coverage`
        );
      }

      this.deps.log(`✓ Corpus coverage check: ${actualChunks} chunks >= ${minRequired} required for length="${lengthKey}"`);
    }

    // =========================================================================
    // Phase 11: INLINE VALIDATION - Prevent hallucinations DURING generation
    // This is the NEW approach that validates citations paragraph-by-paragraph
    // as content is generated, rather than fixing them POST-HOC
    // =========================================================================
    let inlineValidationResult: InlineGenerationResult | undefined;
    let usedInlineValidation = false;

    // Inline validation: auto-enable when sufficient corpus context exists
    // Precedence: explicit user option > auto-enable based on corpus availability
    const minChunksForInline = options.inlineMinChunks ?? 3;
    const hasUsableCorpus = corpusChunks.length >= minChunksForInline;
    const uniqueSources = new Set(corpusChunks.map(c => c.metadata?.author ?? c.metadata?.source_id ?? 'unknown')).size;
    // Gold standard mode skips inline validation — uses single-shot generation like the original.
    // Post-generation verification handles citation checking instead.
    const shouldUseInlineValidation = options.whitelistMode ? false : (options.useInlineValidation ?? hasUsableCorpus);

    // Log activation decision for debuggability
    const inlineReason = options.useInlineValidation === false
      ? 'user opt-out'
      : options.useInlineValidation === true
        ? 'user opt-in'
        : hasUsableCorpus
          ? `auto (chunks=${corpusChunks.length} >= ${minChunksForInline}, sources=${uniqueSources})`
          : `auto-skip (chunks=${corpusChunks.length} < ${minChunksForInline})`;
    this.deps.log(`[InlineValidation] ${shouldUseInlineValidation && hasUsableCorpus ? 'ON' : 'OFF'} (${inlineReason}${options.forceExecute ? ', forceExecute override' : ''})`);
    this.deps.log( `[write() pipeline] InlineValidation=${shouldUseInlineValidation && hasUsableCorpus ? 'ON' : 'OFF'} (${inlineReason})`);

    if (shouldUseInlineValidation && hasUsableCorpus && !options.forceExecute) {
      try {
        this.deps.log('🔬 Phase 11: Using inline validation for hallucination prevention DURING generation...');
        this.deps.log( '[write() pipeline] Entering inline validation...');
        usedInlineValidation = true;

        // Build corpus sources from chunks
        const corpusSources: CorpusSource[] = buildCorpusSourcesFromChunks(corpusChunks);

        // Create retriever function for citation lookup
        const retriever: CorpusRetriever = async (query: string, opts: { maxChunks: number; minRelevance: number }) => {
          return this.deps.smartRetrieval!.retrieveContext(query, {
            maxChunks: opts.maxChunks,
            minRelevance: opts.minRelevance,
            collections: options.corpusCollections || [],
          });
        };

        // Get style prompt if available
        let stylePrompt: string | undefined;
        if (this.deps.styleProfileManager) {
          if (options.styleProfileId) {
            stylePrompt = this.deps.styleProfileManager.generateStylePrompt(options.styleProfileId) ?? undefined;
          } else if (options.useActiveStyleProfile !== false) {
            stylePrompt = this.deps.styleProfileManager.generateStylePrompt() ?? undefined;
          }
        }

        // Create inline validation orchestrator — use Anthropic API directly
        // (claude CLI subprocess hangs inside existing Claude Code sessions)
        const inlineGenerateFn = async (prompt: string, systemPrompt: string) => {
          return this.generateViaAnthropicAPI(prompt, { model: 'claude-sonnet-4-20250514', systemPrompt, maxTokens: 4096 });
        };
        const orchestrator = createInlineValidationOrchestrator(
          inlineGenerateFn,
          retriever,
          corpusChunks,
          corpusSources,
          {
            maxRetriesPerUnit: options.inlineMaxRetriesPerUnit ?? 3,
            validationStrictness: options.inlineValidationStrictness ?? 'moderate',
            enableCitationLookupTool: options.inlineEnableCitationLookup ?? true,
            // CCV Tier 1 enabled by default in orchestrator constructor;
            // env var CCV_TIER1_ACTIVE=false|0 can override
            model: 'claude-sonnet-4-20250514',
            temperature: 0.7,
            maxTokensPerUnit: 1500,
            stylePrompt,
          }
        );

        // Build outline from topic
        const targetWords = length === 'comprehensive' ? 3500 :
                           length === 'long' ? 2500 :
                           length === 'medium' ? 1500 : 800;
        const wordsPerSection = Math.floor(targetWords / 5); // ~5 sections

        const outline = InlineValidationOrchestrator.createBasicOutline(
          topic,
          this.extractKeyPointsFromTopic(topic),
          wordsPerSection
        );

        this.deps.log(`🔬 Inline generation: ${outline.length} units, ~${wordsPerSection} words each`);

        // Generate with inline validation
        inlineValidationResult = await orchestrator.generateWithInlineValidation(
          topic,
          outline,
          agentSelection.prompt // Include agent context as system prompt
        );

        this.deps.log(
          `🔬 Inline validation complete: ${inlineValidationResult.stats.passedFirstAttempt}/${inlineValidationResult.stats.totalUnits} passed first attempt, ` +
          `${inlineValidationResult.stats.passedAfterRetry} after retry, ${inlineValidationResult.stats.failed} failed, ` +
          `quality=${(inlineValidationResult.qualityScore * 100).toFixed(1)}%`
        );

        // If inline validation produced content, skip regular execution
        if (inlineValidationResult.document.length > 0) {
          // Skip to the return, but first do prose sanitization and other post-processing
        }
      } catch (error) {
        this.deps.log( `[write() pipeline] Inline validation FAILED: ${error}`);
        this.deps.log(`Warning: Inline validation failed, falling back to regular execution: ${error}`);
        usedInlineValidation = false;
        inlineValidationResult = undefined;
        // Continue with regular execution (graceful degradation)
      }
    }

    // Initialize content variable
    let content: string;

    // If rolling context already generated content, use it directly — skip single-shot generation
    if (rollingContextDiagnostics?.used && rollingContextContent) {
      content = rollingContextContent;
      goldLog(`Rolling context content: ${content.split(/\s+/).length} words — skipping single-shot generation`);
    } else {

    // If inline validation was successful, use that content — but only if
    // more than half the units passed. Otherwise fall back to direct generation,
    // since placeholder-filled output is worse than unvalidated prose.
    const inlinePassRate = inlineValidationResult
      ? (inlineValidationResult.stats.totalUnits - inlineValidationResult.stats.failed) / Math.max(inlineValidationResult.stats.totalUnits, 1)
      : 0;
    if (usedInlineValidation && inlineValidationResult && inlineValidationResult.document.length > 0 && inlinePassRate > 0.5) {
      content = inlineValidationResult.document;
      this.deps.log( `[write() pipeline] Using INLINE VALIDATION content (${content.split(/\s+/).length} words, ${(inlinePassRate * 100).toFixed(0)}% pass rate)`);
      this.deps.log(`Using inline-validated content (${content.split(/\s+/).length} words, ${(inlinePassRate * 100).toFixed(0)}% units passed)`);
    } else {
      if (usedInlineValidation && inlineValidationResult && inlinePassRate <= 0.5) {
        this.deps.log(`⚠️ Inline validation rejected: only ${(inlinePassRate * 100).toFixed(0)}% units passed (need >50%). Falling back to direct generation.`);
      }
      this.deps.log( `[write() pipeline] Using DIRECT API path (inline=${usedInlineValidation}, passRate=${(inlinePassRate * 100).toFixed(0)}%, docLen=${inlineValidationResult?.document?.length ?? 'N/A'})`);
      // Direct LLM execution for write() with --execute flag.
      // Uses Anthropic API directly instead of executeTaskDefault() which returns [TASK_QUEUED].
      // This ensures the full pipeline (corpus constraint, quality gauntlet, enforcement) runs
      // on actual generated content, not a task placeholder.

      if (options.forceExecute) {
        // FORCE_EXECUTE: Generate mock content for testing
        const mockContent = this.generateMockAcademicContent(topic, style, length, corpusChunks);
        this.deps.log('FORCE_EXECUTE: Generated mock content for testing', {
          wordCount: mockContent.split(/\s+/).length,
          style,
          length
        });
        content = mockContent;
      } else {
        // Generate via Claude Code CLI (uses Claude subscription, not API key)
        try {
          goldLog(`Generating content (prompt length: ${agentSelection.prompt.length} chars)...`);
          this.deps.log('write() direct execution: Generating via Claude Code CLI...');
          this.deps.log( '[write() pipeline] Claude Code execution: starting...');

          content = await this.generateViaClaudeCode(agentSelection.prompt, {
            model: options.whitelistMode ? 'claude-opus-4-6' : 'claude-sonnet-4-20250514',
            maxTokens: options.whitelistMode ? GOLD_STANDARD_CONFIG.opusMaxTokens : undefined, // Gold standard needs more tokens (~6K words + appendix)
          });

          goldLog(`Generation complete: ${content.split(/\s+/).length} words`);
          this.deps.log(`write() Claude Code execution: Got ${content.split(/\s+/).length} words`);
          this.deps.log( `[write() pipeline] Claude Code execution: Got ${content.split(/\s+/).length} words`);
        } catch (apiError) {
          this.deps.log(`write() Claude Code execution failed: ${apiError}, falling back to task queuing`);
          this.deps.log( `[write() pipeline] Claude Code execution FAILED: ${apiError}`);

          // Fallback: try executeTaskDefault (will return [TASK_QUEUED] but at least won't crash)
          const executionResult = await this.deps.executeTaskDefault(agentSelection, undefined, {
            trajectoryId,
            forceExecute: options.forceExecute
          });
          content = executionResult.success ? executionResult.result : agentSelection.prompt;
        }
      }
    }
    } // end rolling context else block

    // Phase A: Prose Sanitization - Remove research artifacts for publication-ready output
    // Target: 100% clean rate (zero tolerance for artifacts like Q1:, Confidence:, [SYNTHESIS NEEDED])
    let sanitizationResult: SanitizationResult | undefined;
    this.deps.log(`[CONTENT-TRACE] Pre-sanitization: ${content.trim().split(/\s+/).filter(Boolean).length} words`);
    try {
      this.deps.log('Phase A: Running prose sanitization...');
      sanitizationResult = await this.deps.proseSanitizer.sanitize(content);

      // Replace content with sanitized version
      content = sanitizationResult.sanitized;

      if (sanitizationResult.artifactCount > 0) {
        this.deps.log(
          `Prose sanitization: removed ${sanitizationResult.artifactCount} artifacts, ` +
          `cleanRate=${(sanitizationResult.cleanRate * 100).toFixed(1)}%`
        );

        // Log specific violations for debugging
        for (const violation of sanitizationResult.violations.slice(0, 5)) {
          this.deps.log(`  - Removed "${violation.text}" at line ${violation.line}`);
        }
        if (sanitizationResult.violations.length > 5) {
          this.deps.log(`  ... and ${sanitizationResult.violations.length - 5} more`);
        }
      } else {
        this.deps.log('Prose sanitization: content is artifact-free');
      }
    } catch (error) {
      this.deps.log(`Warning: Prose sanitization failed, using original content: ${error}`);
      // Continue without sanitization (graceful degradation)
    }

    this.deps.log(`[CONTENT-TRACE] After sanitization: ${content.trim().split(/\s+/).filter(Boolean).length} words`);

    // Quality Gauntlet: Validate and revise content if needed (0.85 threshold, up to 3 iterations)
    let qualityValidation: QualityValidationResult | undefined;
    this.deps.log( `[write() pipeline] Quality gauntlet: qualityIntegration=${!!this.deps.qualityIntegration}`);
    if (this.deps.qualityIntegration) {
      try {
        this.deps.log( '[write() pipeline] Running quality gauntlet...');
        this.deps.log('Running quality gauntlet validation...');
        // Fix 50: Disable gauntlet REVISION (maxRevisions: 0) while stages return 0.5 default.
        // The revision loop is actively harmful — it introduces hallucinated citations
        // that get rejected by citation enforcement. The gauntlet still runs for scoring
        // but does NOT attempt to revise content. Re-enable once gauntlet stages produce
        // meaningful evaluations (not 0.5 default).
        qualityValidation = await this.deps.qualityIntegration.validateAndRevise(content, {
          topic,
          style,
          format,
          trajectoryId,
          enabled: true, // Always enabled for god-write
          maxRevisions: 0, // Fix 50: Score only, do not revise
          corpusChunks: corpusChunks.length > 0 ? corpusChunks : undefined,
          knownAuthors: corpusConstraint?.sources?.map((s: any) => s.author).filter(Boolean) ?? [],
        });

        // Use validated/revised content
        content = qualityValidation.content;

        this.deps.log(
          `Quality gauntlet complete: score=${qualityValidation.qualityScore.toFixed(2)}, ` +
          `passed=${qualityValidation.passed}, revisions=${qualityValidation.revisionIterations}`
        );
        this.deps.log(`[CONTENT-TRACE] After quality gauntlet: ${content.trim().split(/\s+/).filter(Boolean).length} words`);
      } catch (error) {
        this.deps.log( `[write() pipeline] Quality gauntlet FAILED: ${error}`);
        this.deps.log(`Warning: Quality validation failed, using original content: ${error}`);
      }
    }

    // Phase 2 & 4: Citation Validation and Enforcement (post-generation)
    // This catches and corrects any hallucinated citations that slipped through
    // P1 Fix: Skip enforcement when constraint has no sources — otherwise ALL citations
    // get marked as hallucinated, stripping the document of scholarly references.
    let citationEnforcementResult: EnforcementResult | undefined;
    this.deps.log( `[write() pipeline] Citation enforcement: corpusConstraint=${!!corpusConstraint}, sources=${corpusConstraint?.sources?.length ?? 0}, chunks=${corpusChunks.length}`);
    // In whitelist mode, enforce citations even without chunks (constraint comes from manifest).
    // In RAG mode, require both constraint and chunks.
    const shouldEnforceCitations = corpusConstraint && corpusConstraint.sources.length > 0 &&
      (options.whitelistMode || corpusChunks.length > 0);
    if (shouldEnforceCitations) {
      try {
        this.deps.log( '[write() pipeline] Running citation enforcement...');
        this.deps.log('Phase 2/4: Running citation enforcement...');

        // Create enforcer from corpus constraint with configurable options
        // In whitelist mode, pass empty chunks array — no quotation fidelity check during enforcement
        // (post-hoc verification handles this instead)
        const enforcer = new CitationEnforcer(corpusConstraint!, {
          mode: options.citationEnforcementMode || 'auto-correct',  // Configurable enforcement mode
          minPassRate: options.citationMinPassRate ?? 0.85,          // Configurable minimum pass rate
          maxHallucinations: options.citationMaxHallucinations ?? 3, // Configurable max hallucinations
          placeholder: '',  // Fix 19: Remove hallucinated citations entirely instead of leaving [CITATION NEEDED] markers
          includeReport: true,
        }, options.whitelistMode ? [] : corpusChunks); // Whitelist mode: no chunks for fidelity check

        // Enforce citations on generated content
        citationEnforcementResult = await enforcer.enforce(content);

        if (citationEnforcementResult.action === 'pass') {
          this.deps.log(`✅ Citation enforcement: All ${citationEnforcementResult.validation.totalCitations} citations verified`);
        } else if (citationEnforcementResult.action === 'corrected') {
          this.deps.log(
            `🔧 Citation enforcement: Corrected ${citationEnforcementResult.correctionsCount} citations, ` +
            `pass rate ${(citationEnforcementResult.validation.passRate * 100).toFixed(1)}%`
          );
          // Use corrected content
          content = citationEnforcementResult.content;
        } else if (citationEnforcementResult.action === 'warning') {
          this.deps.log(
            `⚠️ Citation enforcement warning: ${citationEnforcementResult.validation.hallucinated.length} ` +
            `hallucinated citations detected`
          );
          // Keep content but log warnings
          for (const h of citationEnforcementResult.validation.hallucinated.slice(0, 3)) {
            this.deps.log(`   - Line ${h.citation.line}: "${h.citation.raw}" - ${h.reason}`);
          }
        } else if (citationEnforcementResult.action === 'rejected') {
          this.deps.log(`❌ Citation enforcement: Content rejected due to excessive hallucinations`);
          // In production, might want to regenerate or flag for human review
        }
      } catch (error) {
        this.deps.log(`Warning: Citation enforcement failed: ${error}`);
        // Continue without enforcement (graceful degradation)
      }
    }

    // Fix 18: Second sanitizer pass after citation enforcement
    // Citation enforcement may insert markers or leave artifacts that need cleanup
    if (citationEnforcementResult && citationEnforcementResult.action !== 'pass') {
      try {
        const postEnforcementSanitize = await this.deps.proseSanitizer.sanitize(content);
        if (postEnforcementSanitize.artifactCount > 0) {
          content = postEnforcementSanitize.sanitized;
          this.deps.log(`Post-enforcement sanitization: removed ${postEnforcementSanitize.artifactCount} additional artifacts`);
        }
      } catch (error) {
        this.deps.log(`Warning: Post-enforcement sanitization failed: ${error}`);
      }
    }

    // Fix 25/30/46: Post-enforcement non-corpus author scrubbing
    // Final safety net: remove any remaining references to non-corpus authors
    // that slipped through inline validation and citation enforcement.
    // Fix 46: Use FULL corpus manifest for the scrubber's allowedAuthors set,
    // not just retrieved chunks. Semantic search may not return primary source
    // chunks (e.g., Aristotle's raw text is less semantically similar to a
    // research question than secondary scholarship), but the LLM should still
    // be allowed to reference corpus authors whose works are in the collection.
    // In whitelist mode, the constraint already includes all manifest sources — no widening needed.
    // In RAG mode, widen the constraint with manifest authors for scrubbing.
    let scrubConstraint = corpusConstraint;
    if (corpusConstraint && corpusConstraint.sources.length > 0 && !options.whitelistMode) {
      try {
        const manifestSources = await this.cachedLoadCorpusManifest({
          collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
        });
        if (manifestSources.length > 0) {
          scrubConstraint = {
            ...corpusConstraint,
            sources: [...corpusConstraint.sources, ...manifestSources],
          };
        }
      } catch {
        // If manifest loading fails, use the chunk-based constraint
      }
    }
    if (scrubConstraint && scrubConstraint.sources.length > 0) {
      try {
        const scrubResult = scrubNonCorpusAuthors(content, scrubConstraint);
        if (scrubResult.removedCount > 0) {
          // Scrub-and-warn in all modes. The earlier pipeline stages (inline validation,
          // citation enforcement, citation verifier gauntlet) are the primary defenses.
          // The author scrubber is a last safety net — it should remove questionable
          // sentences but not crash the pipeline (too many false positives from common
          // English words matching signal-phrase patterns).
          content = scrubResult.content;
          const severity = dataSourceMode === 'corpus' ? '⚠️' : '🧹';
          this.deps.log(`${severity} Author scrub: removed ${scrubResult.removedCount} non-corpus author reference(s) (${scrubResult.removedAuthors.join(', ')})`);
        }
      } catch (error) {
        this.deps.log(`Warning: Non-corpus author scrubbing failed: ${error}`);
      }
    }

    // Fix 62: Strip bare APA-style parenthetical citations — (Author Year)
    // These are stylistically wrong (MLA requires title+page) and leak through
    // because the citation validator marks them valid when the author IS in the corpus.
    try {
      const apaResult = stripBareApaParentheticals(content);
      if (apaResult.strippedCount > 0) {
        content = apaResult.content;
        this.deps.log(`Fix 62: Stripped ${apaResult.strippedCount} bare APA parenthetical(s): ${apaResult.stripped.join(', ')}`);
      }
    } catch (error) {
      this.deps.log(`Warning: APA parenthetical stripping failed: ${error}`);
    }

    // Fix 61: Strip endnote reference artifacts that leak into main text body
    // during multi-step generation. Must run BEFORE real endnotes are generated
    // so that hallucinated [1], [EN1], or superscript markers from the LLM are
    // removed before the endnote generator inserts legitimate markers.
    try {
      const preEndnoteContent = content;
      content = stripEndnoteLeaks(content);
      const strippedChars = preEndnoteContent.length - content.length;
      if (strippedChars > 0) {
        this.deps.log(`Fix 61: Stripped ${strippedChars} chars of endnote leak artifacts from main text`);
      }
    } catch (error) {
      this.deps.log(`Warning: Endnote leak stripping failed: ${error}`);
    }

    // Phase 5: Staged Composition System Integration
    // Auto-detect if staged composition should be used
    let compositionMetadata: {
      used: boolean;
      succeeded?: boolean;
      wordCount?: number;
      qualityScore?: number;
      processingTime?: number;
    } = { used: false };

    const shouldUseStagedComposition =
      options.useStagedComposition ||
      (options.chapterOutline !== undefined) ||
      (format === 'paper' && length === 'comprehensive');
    // Removed regex /chapter|section/i auto-detection — too fragile when topic
    // contains the full enhanced prompt text (matches "Section-Specific Instructions"
    // etc.). Users who want ICP should use --use-staged-composition explicitly.

    if (shouldUseStagedComposition && !options.forceExecute) {
      try {
        this.deps.log('Phase 5: Using staged composition system...');

        let compositionResult: CompositionResult;

        if (options.chapterOutline) {
          // User provided explicit chapter outline
          compositionResult = await compositionOrchestrator.composeChapter(
            options.chapterOutline,
            true // verbose
          );
        } else {
          // Auto-generate simple outline from topic
          const keyPoints = this.extractKeyPointsFromTopic(topic);
          compositionResult = await compositionOrchestrator.composeSimple(
            topic,
            keyPoints,
            {
              chapterNumber: 1,
              purpose: `Generate ${format} on ${topic}`,
              evidenceType: style === 'academic' ? 'theoretical' : 'analytical',
              verbose: true,
            }
          );
        }

        if (compositionResult.succeeded) {
          // Use composed content
          content = compositionResult.prose;
          compositionMetadata = {
            used: true,
            succeeded: true,
            wordCount: compositionResult.metadata.wordCount,
            qualityScore: compositionResult.metadata.qualityScore,
            processingTime: compositionResult.metadata.processingTime,
          };

          this.deps.log(
            `Staged composition complete: ` +
            `wordCount=${compositionMetadata.wordCount}, ` +
            `quality=${compositionMetadata.qualityScore?.toFixed(2)}`
          );
        } else {
          // Composition failed, keep original content
          compositionMetadata = { used: true, succeeded: false };
          this.deps.log('Staged composition failed, using original content');
        }
      } catch (error) {
        this.deps.log(`Warning: Staged composition failed: ${error}`);
        compositionMetadata = { used: true, succeeded: false };
        // Continue with original content (graceful degradation)
      }
    }

    // Post-generation heading structure fix: ensure ## N. headings are standalone lines
    content = content.replace(/([^\n])(##\s*\d+\s*\.?\s*\w)/g, '$1\n\n$2');
    // Ensure blank line after heading
    content = content.replace(/(^##\s*\d+\.?\s+[^\n]+)\n(?!\n)/gm, '$1\n\n');

    // Capture body word count BEFORE endnotes are appended
    const bodyWordCount = content.trim().split(/\s+/).filter(Boolean).length;

    // Endnote Generation: Add supporting quotations from corpus
    let endnotesMetadata: {
      generated: boolean;
      count: number;
      supportingQuotationsCount: number;
      enhancedContent?: string;
      endnotesSection?: string;
    } = { generated: false, count: 0, supportingQuotationsCount: 0 };

    // Gold standard mode: endnotes OFF by default (gold standard had none).
    // Only generate if --enable-endnotes is explicitly set.
    const shouldGenerateEndnotes = options.enableEndnotes && corpusContextInfo.used && this.deps.smartRetrieval != null;
    if (shouldGenerateEndnotes) {
      try {
        this.deps.log('Generating endnotes with supporting quotations...');

        // Create corpus search function using smart retrieval layer
        const corpusSearch: CorpusSearchFn = async (query: string, limit: number) => {
          const chunks = await this.deps.smartRetrieval!.retrieveContext(query, {
            maxChunks: limit,
            collections: corpusContextInfo.collections,
            minRelevance: 0.65,
          });

          return chunks.map(chunk => ({
            id: chunk.chunkId,
            text: chunk.content,
            metadata: {
              author: chunk.metadata?.author,
              title: chunk.metadata?.title,
              year: chunk.metadata?.year,
              pageRef: chunk.metadata?.pageRef,
              docId: chunk.metadata?.docId,
              // Visual provenance (v7)
              has_bboxes: chunk.metadata?.has_bboxes ?? false,
              source_method: chunk.metadata?.source_method ?? '',
              bboxes: chunk.metadata?.has_bboxes ? (chunk.metadata?.bboxes ?? '') : '',
              path_rel: chunk.metadata?.path_rel ?? '',
            },
            score: chunk.relevanceScore,
          }));
        };

        // Create provenance ledger for tracking
        const provenanceLedger = new ProvenanceLedger();

        // Generate endnotes
        const endnoteConfig: Partial<EndnoteGeneratorConfig> = {
          maxQuotationsPerEndnote: options.maxQuotationsPerEndnote ?? 3,
          minRelevanceThreshold: options.minEndnoteRelevance ?? 0.65,
          includeSameSource: true,
          includeDifferentSources: true,
          maxQuotationLength: 500,
          formatStyle: 'numeric',
          generateInlineMarkers: true,
          renderBboxOverlays: options.renderBboxOverlays ?? false,
        };

        const endnoteResult = await generateEndnotes(content, corpusSearch, {
          config: endnoteConfig,
          provenanceLedger,
          knownSources: corpusConstraint?.sources?.map(s => ({
            author: (s as any).author ?? '',
            title: (s as any).title ?? '',
          })).filter(s => s.author && s.title),
        });

        // Update content with endnotes
        if (endnoteResult.endnotes.length > 0) {
          content = endnoteResult.contentWithMarkers + '\n\n' + endnoteResult.endnotesSection;
          endnotesMetadata = {
            generated: true,
            count: endnoteResult.stats.totalEndnotes,
            supportingQuotationsCount: endnoteResult.stats.totalSupportingQuotations,
            enhancedContent: endnoteResult.contentWithMarkers,
            endnotesSection: endnoteResult.endnotesSection,
          };

          this.deps.log(
            `Endnotes generated: ${endnotesMetadata.count} endnotes, ` +
            `${endnotesMetadata.supportingQuotationsCount} supporting quotations`
          );
        } else {
          this.deps.log('No endnotes generated (no citations found)');
        }
      } catch (error) {
        this.deps.log(`Warning: Endnote generation failed: ${error}`);
        // Continue with original content (graceful degradation)
      }
    }

    // Source Verification and Acquisition (post-generation hook)
    let sourceVerificationResult: {
      verified: boolean;
      summary?: VerificationSummary;
      acquisitionResults?: AcquisitionResult[];
    } = { verified: false };

    if (options.verifySources) {
      try {
        this.deps.log('Verifying sources against corpus...');
        const sourceVerifier = getSourceVerificationLayer();
        const extractedCitations = sourceVerifier.extractCitations(content);
        const verificationSummary = await sourceVerifier.verifyCitationsAgainstCorpus(extractedCitations);

        sourceVerificationResult.verified = true;
        sourceVerificationResult.summary = verificationSummary;

        this.deps.log(
          `Source verification complete: ${verificationSummary.foundInCorpus}/${verificationSummary.totalCitations} ` +
          `found in corpus, ${verificationSummary.missingFromCorpus} missing`
        );

        // Automatic source acquisition if enabled and sources are missing
        if (options.acquireMissing && verificationSummary.missingFromCorpus > 0) {
          this.deps.log('Acquiring missing sources...');
          const acquisitionLayer = getMissingSourceAcquisitionLayer();

          // Configure download directory if provided
          if (options.downloadDir) {
            // Create new instance with custom config
            const customAcquisitionLayer = new MissingSourceAcquisitionLayer({
              downloadDir: options.downloadDir,
              autoDownload: true,
              verbose: true,
            });
            sourceVerificationResult.acquisitionResults = await customAcquisitionLayer.acquireSources(
              verificationSummary.missingSources
            );
          } else {
            sourceVerificationResult.acquisitionResults = await acquisitionLayer.acquireSources(
              verificationSummary.missingSources
            );
          }

          const downloaded = sourceVerificationResult.acquisitionResults.filter(r => r.status === 'downloaded').length;
          const linkProvided = sourceVerificationResult.acquisitionResults.filter(r => r.status === 'link_provided').length;

          this.deps.log(
            `Source acquisition complete: ${downloaded} downloaded, ${linkProvided} links provided`
          );
        }
      } catch (error) {
        this.deps.log(`Warning: Source verification failed: ${error}`);
        // Continue without verification (graceful degradation)
      }
    }

    // Store successful writing patterns (non-blocking — don't delay output)
    this.deps.maybeStorePattern({
      content: `${format} on ${topic}`,
      type: 'example',
      domain: 'writing',
      tags: [style, format, ...this.deps.extractTags(topic)],
    }).catch(err => this.deps.log(`Warning: Pattern storage failed: ${err}`));

    // Auto-feedback if trajectory exists (FR-11)
    // Use quality gauntlet score if available, otherwise estimate
    let writeQuality = qualityValidation?.qualityScore ?? 0.7;
    if (!qualityValidation && this.deps.config.autoLearn) {
      writeQuality = estimateQuality({
        id: trajectoryId ?? 'unknown',
        mode: 'write',
        input: topic,
        output: content,
        timestamp: Date.now(),
      });
    }

    if (this.deps.config.autoLearn && this.deps.trajectoryBridge && trajectoryId) {
      if (writeQuality >= this.deps.config.autoStoreThreshold) {
        // Non-blocking — don't delay output for telemetry
        this.deps.trajectoryBridge.submitFeedback(trajectoryId, writeQuality, { implicit: true })
          .then(() => this.deps.log(`Write auto-feedback: quality=${writeQuality.toFixed(2)}`))
          .catch((error: unknown) => this.deps.log(`Warning: Write auto-feedback failed: ${error}`));
      }
    }

    // DESC: Store episode for future learning (non-blocking, best-effort)
    // DESC daemon may not be running — this is not a critical path dependency
    this.deps.storeDESCEpisode(topic, content, {
      command: 'god-write',
      mode: 'write',
      quality: writeQuality,
    }).catch(() => { /* DESC unavailable — silently skip */ });

    // V2 diagnostics: check if any blacklisted authors appeared in final output (main text only)
    let multiStepDiagnosticsResult: WriteResult['multiStepDiagnostics'] | undefined;
    if (multiStepV1Stats && preventionPlan) {
      let blacklistedAuthorsInMainText = 0;
      let blacklistedAuthorsInAppendix = 0;
      if (preventionPlan.blacklistedAuthors.length > 0) {
        const appendixSplit = content.split(/^#\s*VALIDATION APPENDIX/mi);
        const mainTextLower = (appendixSplit[0] || '').toLowerCase();
        const appendixLower = (appendixSplit[1] || '').toLowerCase();
        for (const author of preventionPlan.blacklistedAuthors) {
          const authorLower = author.toLowerCase();
          if (mainTextLower.includes(authorLower)) blacklistedAuthorsInMainText++;
          if (appendixLower.includes(authorLower)) blacklistedAuthorsInAppendix++;
        }
      }
      multiStepDiagnosticsResult = {
        v1Diagnostics: multiStepV1Stats,
        preventionPlan,
        v2Diagnostics: {
          blacklistedAuthorsUsedInV2: blacklistedAuthorsInMainText,
          blacklistedAuthorsInMainText,
          blacklistedAuthorsInAppendix,
        },
      };
    }

    return {
      topic,
      content,
      style,
      sources: knowledge.map(k => (k as { id?: string }).id ?? ''),
      wordCount: content.split(/\s+/).length,
      bodyWordCount,
      trajectoryId,
      // Include quality metrics if validation was performed
      qualityMetrics: qualityValidation?.metrics,
      qualityScore: qualityValidation?.qualityScore,
      revisionIterations: qualityValidation?.revisionIterations ?? 0,
      // Phase 3: Include corpus context information
      corpusContext: corpusContextInfo.used ? {
        ...corpusContextInfo,
        whitelistMode: options.whitelistMode ?? false,
      } : undefined,
      // Phase 5: Include staged composition metadata
      stagedComposition: compositionMetadata.used ? compositionMetadata : undefined,
      // Include endnotes metadata if generated
      endnotes: endnotesMetadata.generated ? endnotesMetadata : undefined,
      // Include source verification results if performed
      sourceVerification: sourceVerificationResult.verified ? {
        verified: true,
        totalCitations: sourceVerificationResult.summary?.totalCitations ?? 0,
        foundInCorpus: sourceVerificationResult.summary?.foundInCorpus ?? 0,
        missingFromCorpus: sourceVerificationResult.summary?.missingFromCorpus ?? 0,
        missingSources: (sourceVerificationResult.summary?.missingSources ?? []).map(s => ({
          author: s.author,
          title: s.title,
          type: s.type,
        })),
        acquisitionResults: sourceVerificationResult.acquisitionResults?.map(r => ({
          source: r.source,
          status: r.status,
          downloadPath: r.downloadPath,
          accessUrls: r.accessUrls,
        })),
      } : undefined,
      // Phase A: Include prose sanitization results
      proseSanitization: sanitizationResult ? {
        sanitized: true,
        artifactsRemoved: sanitizationResult.artifactCount,
        cleanRate: sanitizationResult.cleanRate,
        violations: sanitizationResult.violations.map(v => ({
          type: v.type,
          text: v.text,
          line: v.line,
        })),
      } : undefined,
      // Phase 2/4: Citation enforcement results
      citationEnforcement: citationEnforcementResult ? {
        action: citationEnforcementResult.action,
        totalCitations: citationEnforcementResult.validation.totalCitations,
        validCitations: citationEnforcementResult.validation.valid.length,
        hallucinatedCitations: citationEnforcementResult.validation.hallucinated.length,
        correctionsMade: citationEnforcementResult.correctionsCount,
        missingPageNumbers: citationEnforcementResult.missingPageNumbersCount,
        passRate: citationEnforcementResult.validation.passRate,
        report: citationEnforcementResult.report,
      } : undefined,
      // Phase 5: Citation budget results (stored in corpusContext)
      // Phase 11: Inline validation results
      inlineValidation: usedInlineValidation && inlineValidationResult ? {
        used: true,
        allPassed: inlineValidationResult.allPassed,
        qualityScore: inlineValidationResult.qualityScore,
        totalUnits: inlineValidationResult.stats.totalUnits,
        passedFirstAttempt: inlineValidationResult.stats.passedFirstAttempt,
        passedAfterRetry: inlineValidationResult.stats.passedAfterRetry,
        failedUnits: inlineValidationResult.stats.failed,
        totalAttempts: inlineValidationResult.stats.totalAttempts,
        avgAttemptsPerUnit: inlineValidationResult.stats.avgAttemptsPerUnit,
        failedUnitDetails: inlineValidationResult.failedUnits.map(f => ({
          type: f.unit.type,
          intent: f.unit.intent,
          lastScore: f.lastValidationResult.overallScore,
          issues: f.lastValidationResult.issues.map(i => i.message),
        })),
      } : undefined,
      // Multi-step diagnostics (v1→investigate→v2)
      multiStepDiagnostics: multiStepDiagnosticsResult,
      // Rolling context diagnostics
      rollingContext: rollingContextDiagnostics,
    };

    } catch (err) {
      if (err instanceof PipelineAbortError || (err instanceof Error && err.name === 'AbortError')) {
        this.deps.log('Pipeline aborted by user -- partial results may be available');
        return {
          topic,
          content: '[Pipeline aborted by user]',
          style: options.style ?? 'professional',
          sources: [],
          wordCount: 0,
          bodyWordCount: 0,
          qualityScore: 0,
        } as WriteResult;
      }
      throw err; // Re-throw non-abort errors
    } finally {
      abortCtrl.stop();
      this.activeAbortCtrl = null;
    }
  }

  // =========================================================================
  // V2 STAGED PIPELINE
  // Thin coordinator that calls the same private methods organized into
  // three lifecycle stages: Retrieval → Drafting → Validation.
  // =========================================================================

  private async writeV2(topic: string, options: WriteOptions): Promise<WriteResult> {
    const ctx = createPipelineContext(stderrLogger);

    // --- Resolve options (same as legacy) ---
    const dataSourceMode = options.dataSourceMode ?? 'hybrid';
    const resolved = { ...options };
    if (dataSourceMode === 'corpus') {
      if (resolved.acquireMissing) {
        throw new Error('Corpus-only mode forbids acquireMissing.');
      }
      resolved.useCorpus = true;
      resolved.acquireMissing = false;
      resolved.verifySources = true;
      resolved.citationEnforcementMode = 'strict';
      resolved.citationMaxHallucinations = 0;
    }
    options = resolved;

    const style = options.style ?? 'professional';
    const length = options.length ?? 'medium';
    const format = options.format ?? 'article';

    // DESC injection (best-effort)
    let augmentedTopic = topic;
    try {
      const descResult = await this.deps.injectDESCEpisodes(topic, { command: 'god-write', mode: 'write' });
      augmentedTopic = descResult.augmentedPrompt;
    } catch {
      recordWarning(ctx, 'init', 'DESC unavailable');
    }

    // Style profile
    let stylePrompt: string | null = null;
    if (this.deps.styleProfileManager) {
      if (options.styleProfileId) {
        stylePrompt = this.deps.styleProfileManager.generateStylePrompt(options.styleProfileId);
      } else if (options.useActiveStyleProfile !== false) {
        stylePrompt = this.deps.styleProfileManager.generateStylePrompt();
      }
    }

    // Trajectory
    let trajectoryId: string | undefined;
    if (this.deps.trajectoryBridge) {
      try {
        const embedding = await this.deps.embed(topic);
        const trajectory = await this.deps.trajectoryBridge.createTrajectoryFromInteraction(topic, 'write', embedding);
        trajectoryId = trajectory.trajectoryId;
      } catch (error) {
        recordWarning(ctx, 'init', `Trajectory creation failed: ${error}`);
      }
    }

    const knowledge = await this.deps.retrieveRelevant(topic, 'write');

    // ===== STAGE 1: RETRIEVAL =====
    ctx.logger.info('[v2] === STAGE 1: RETRIEVAL ===');

    // In v2, --use-corpus activates the same retrieval pipeline as --whitelist.
    // The legacy path kept these as distinct modes, but v2 merged them into
    // a single staged retrieval path (RetrievalStage only checks whitelistMode).
    const effectiveWhitelistMode = options.whitelistMode || options.useCorpus || false;

    const goldLog = (msg: string) => {
      if (effectiveWhitelistMode) {
        process.stderr.write(`[GOLD STD] ${msg}\n`);
      }
    };

    const retrieval = await runRetrievalStage(topic, {
      whitelistMode: effectiveWhitelistMode,
      corpusChunkCount: options.corpusChunkCount,
      corpusCollections: options.corpusCollections,
      corpusMinRelevance: options.corpusMinRelevance,
      length,
      wordTarget: options.wordTarget,
    }, this.buildRetrievalStageDeps(goldLog), ctx);

    let corpusChunks = retrieval.chunks;
    const corpusContextInfo = retrieval.corpusContextInfo;
    let corpusConstraint: CorpusConstraint | undefined = retrieval.corpusConstraint ?? undefined;

    // F-13 Circuit breaker: abort if corpus mode produced 0 chunks.
    // This prevents silent degradation into ungrounded hallucination.
    if (corpusChunks.length === 0 && effectiveWhitelistMode) {
      throw new Error(
        'Retrieval produced 0 corpus chunks — cannot generate corpus-grounded content without evidence. ' +
        'Check services: curl http://localhost:8001/api/v2/heartbeat (ChromaDB) and curl http://localhost:8000/ (embedding)'
      );
    }
    let primaryAuthors = retrieval.primaryAuthors;
    let knowledgeUnitLines = retrieval.knowledgeUnits;
    let structuralEdgeLines = retrieval.structuralEdges;
    const ontologyLines = retrieval.ontologyLines;
    const hookLines = retrieval.hookLines;
    const tensionLines = retrieval.tensionLines;
    let preventionPlan: StageRetrievalResult['preventionPlan'];
    let multiStepV1Stats: StageRetrievalResult['multiStepV1Stats'];
    let sectionConstraints = retrieval.sectionConstraints;
    const subsections = retrieval.subsections;
    let primaryUnderCoverage = retrieval.primaryUnderCoverage;

    // Token budget check
    const goldStylePrompt = stylePrompt || '';
    const wordTarget = retrieval.wordTarget;

    if (corpusChunks.length > 0) {
      const budget = estimateTokenBudget(corpusChunks, goldStylePrompt, sectionConstraints.join('\n'));
      if (budget.overBudget) {
        recordWarning(ctx, 'retrieval', `Token budget exceeded: ~${budget.inputTokens} input tokens, ${budget.totalChars} chars`);
      }
    }

    // ===== STAGE 2: DRAFTING =====
    ctx.logger.info('[v2] === STAGE 2: DRAFTING ===');

    let content: string;

    if (effectiveWhitelistMode) {
      // Multi-step: v1 → investigate → v2
      if (options.multiStep) {
        const v1Prompt = this.buildGoldStandardPrompt({
          topic, subsections, chunks: corpusChunks, knowledgeUnits: knowledgeUnitLines,
          structuralEdges: structuralEdgeLines, ontologyNodes: ontologyLines,
          crossPipelineHooks: hookLines, tensionEdges: tensionLines,
          stylePrompt: '', wordTarget,
        });

        let v1Content: string;
        try {
          v1Content = await this.generateViaClaudeCode(v1Prompt, { model: 'claude-opus-4-6', maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens });
        } catch (e) {
          recordDegraded(ctx, 'drafting', `V1 generation failed: ${e}, falling back to single-shot`);
          v1Content = '';
          options.multiStep = false;
        }

        if (options.multiStep && v1Content) {
          // Gauntlet on v1
          let v1FailedStages: string[] = [];
          if (this.deps.qualityIntegration) {
            try {
              const v1Gauntlet = await this.deps.qualityIntegration.validateAndRevise(v1Content, {
                topic, style, format, enabled: true, maxRevisions: 0,
                corpusChunks: corpusChunks.length > 0 ? corpusChunks : undefined,
                knownAuthors: corpusConstraint?.sources?.map((s: any) => s.author).filter(Boolean) ?? [],
              });
              const metrics = v1Gauntlet.metrics as any;
              if (metrics?.stageScores) {
                for (const [stage, score] of Object.entries(metrics.stageScores)) {
                  if (typeof score === 'number' && score < 0.7) v1FailedStages.push(`${stage}: ${(score * 100).toFixed(0)}%`);
                }
              }
            } catch (e) {
              recordWarning(ctx, 'drafting', `V1 gauntlet failed: ${e}`);
            }
          }

          // Investigate v1
          const manifestAuthors = corpusConstraint?.sources?.map((s: any) => s.author).filter(Boolean) ??
            [...new Set(corpusChunks.map(c => c.metadata.author).filter(Boolean))];
          const investigation = this.investigateV1(v1Content, corpusChunks, manifestAuthors);

          if (v1FailedStages.length > 0) {
            investigation.preventionPlan.strengthenedConstraints.push(
              `V1 quality gauntlet flagged weak stages: ${v1FailedStages.join(', ')}. Pay special attention in v2.`
            );
          }

          preventionPlan = investigation.preventionPlan;
          multiStepV1Stats = {
            wordCount: investigation.stats.wordCount,
            citationCount: investigation.stats.citationCount,
            quotationCount: investigation.stats.quotationCount,
            claimsWithoutCitation: investigation.stats.claimsWithoutCitation,
            factualClaimsWithoutCitation: investigation.stats.factualClaimsWithoutCitation,
            interpretiveClaimsWithoutCitation: investigation.stats.interpretiveClaimsWithoutCitation,
            uniqueAuthors: investigation.stats.uniqueAuthors,
            issues: investigation.issues,
          };

          // Supplemental retrieval for under-cited sources
          if (investigation.preventionPlan.underCitedSources.length > 0 && this.deps.smartRetrieval) {
            const existingIds = new Set(corpusChunks.map(c =>
              c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`
            ));
            for (const author of investigation.preventionPlan.underCitedSources.slice(0, 3)) {
              try {
                const supplemental = await this.deps.smartRetrieval.retrieveContext(
                  `${author} ${topic.substring(0, 100)}`, { maxChunks: 6 }
                );
                for (const c of supplemental.filter(c => (c.metadata.author || '').toLowerCase().includes(author.toLowerCase()))) {
                  const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
                  if (!existingIds.has(id)) {
                    existingIds.add(id);
                    if (c.content) c.content = this.trimChunkContent(c.content, GOLD_STANDARD_CONFIG.chunkTrimTarget);
                    corpusChunks.push(c);
                  }
                }
              } catch (e) {
                recordWarning(ctx, 'drafting', `Supplemental retrieval for ${author} failed: ${e}`);
              }
            }
          }
        }
      }

      // Build final prompt (v2 with prevention plan, or single-shot)
      const goldPrompt = this.buildGoldStandardPrompt({
        topic, subsections, chunks: corpusChunks, knowledgeUnits: knowledgeUnitLines,
        structuralEdges: structuralEdgeLines, ontologyNodes: ontologyLines,
        crossPipelineHooks: hookLines, tensionEdges: tensionLines,
        stylePrompt: goldStylePrompt, wordTarget,
        preventionPlan, sectionConstraints, primaryUnderCoverage,
      });

      // Generate
      try {
        content = await this.generateViaClaudeCode(goldPrompt, { model: 'claude-opus-4-6', maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens });
      } catch (e) {
        recordDegraded(ctx, 'drafting', `Claude Code failed: ${e}, trying Anthropic API`);
        content = await this.generateViaAnthropicAPI(goldPrompt, { model: 'claude-opus-4-6', maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens });
      }
    } else {
      // Non-whitelist: build writing instructions + generate
      const writingInstructions = this.buildWritingInstructions(style, format, length, stylePrompt);
      const writePrompt = `${writingInstructions}\n\n## Topic\n${augmentedTopic}`;

      if (options.forceExecute) {
        content = this.generateMockAcademicContent(topic, style, length, corpusChunks);
      } else {
        try {
          content = await this.generateViaClaudeCode(writePrompt);
        } catch (e) {
          recordDegraded(ctx, 'drafting', `Claude Code failed: ${e}`);
          const executionResult = await this.deps.executeTaskDefault({
            selection: { selected: { key: 'academic-writer', category: 'writing' } as any, candidates: [], analysis: { taskType: 'write' } as any },
            prompt: writePrompt,
          }, undefined, { trajectoryId, forceExecute: options.forceExecute });
          content = executionResult.success ? executionResult.result : writePrompt;
        }
      }
    }

    // ===== STAGE 3: VALIDATION =====
    ctx.logger.info('[v2] === STAGE 3: VALIDATION ===');

    // Prose sanitization
    let sanitizationResult: SanitizationResult | undefined;
    try {
      sanitizationResult = await this.deps.proseSanitizer.sanitize(content);
      content = sanitizationResult.sanitized;
    } catch (error) {
      recordWarning(ctx, 'validation', `Prose sanitization failed: ${error}`);
    }

    // Quality gauntlet (scoring only by default; configurable via --max-revisions)
    let qualityValidation: QualityValidationResult | undefined;
    if (this.deps.qualityIntegration) {
      try {
        qualityValidation = await this.deps.qualityIntegration.validateAndRevise(content, {
          topic, style, format, trajectoryId, enabled: true, maxRevisions: options.maxGauntletRevisions ?? 0,
          corpusChunks: corpusChunks.length > 0 ? corpusChunks : undefined,
          knownAuthors: corpusConstraint?.sources?.map((s: any) => s.author).filter(Boolean) ?? [],
        });
        content = qualityValidation.content;
      } catch (error) {
        recordWarning(ctx, 'validation', `Quality gauntlet failed: ${error}`);
      }
    }

    // Citation enforcement
    let citationEnforcementResult: EnforcementResult | undefined;
    const shouldEnforceCitations = corpusConstraint && corpusConstraint.sources.length > 0 &&
      (effectiveWhitelistMode || corpusChunks.length > 0);
    if (shouldEnforceCitations) {
      try {
        const enforcer = new CitationEnforcer(corpusConstraint!, {
          mode: options.citationEnforcementMode || 'auto-correct',
          minPassRate: options.citationMinPassRate ?? 0.85,
          maxHallucinations: options.citationMaxHallucinations ?? 3,
          placeholder: '',
          includeReport: true,
        }, effectiveWhitelistMode ? [] : corpusChunks);

        citationEnforcementResult = await enforcer.enforce(content);
        if (citationEnforcementResult.action === 'corrected') {
          content = citationEnforcementResult.content;
        }
      } catch (error) {
        recordWarning(ctx, 'validation', `Citation enforcement failed: ${error}`);
      }
    }

    // Post-enforcement sanitization
    if (citationEnforcementResult && citationEnforcementResult.action !== 'pass') {
      try {
        const postSanitize = await this.deps.proseSanitizer.sanitize(content);
        if (postSanitize.artifactCount > 0) content = postSanitize.sanitized;
      } catch (error) {
        recordWarning(ctx, 'validation', `Post-enforcement sanitization failed: ${error}`);
      }
    }

    // Author scrubbing
    let scrubConstraint = corpusConstraint;
    if (corpusConstraint && corpusConstraint.sources.length > 0 && !effectiveWhitelistMode) {
      try {
        const manifestSources = await this.cachedLoadCorpusManifest({
          collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
        });
        if (manifestSources.length > 0) {
          scrubConstraint = { ...corpusConstraint, sources: [...corpusConstraint.sources, ...manifestSources] };
        }
      } catch { /* use chunk-based constraint */ }
    }
    if (scrubConstraint && scrubConstraint.sources.length > 0) {
      try {
        const scrubResult = scrubNonCorpusAuthors(content, scrubConstraint);
        if (scrubResult.removedCount > 0) content = scrubResult.content;
      } catch (error) {
        recordWarning(ctx, 'validation', `Author scrubbing failed: ${error}`);
      }
    }

    // Fix 62: Strip bare APA-style parenthetical citations
    try {
      const apaResult = stripBareApaParentheticals(content);
      if (apaResult.strippedCount > 0) {
        content = apaResult.content;
        ctx.logger.info(`[v2] Fix 62: Stripped ${apaResult.strippedCount} bare APA parenthetical(s): ${apaResult.stripped.join(', ')}`);
      }
    } catch (error) {
      recordWarning(ctx, 'validation', `APA parenthetical stripping failed: ${error}`);
    }

    // Fix 61: Strip endnote reference artifacts from main text body
    try {
      const preStrip = content.length;
      content = stripEndnoteLeaks(content);
      if (content.length < preStrip) {
        ctx.logger.info(`[v2] Fix 61: Stripped ${preStrip - content.length} chars of endnote leak artifacts`);
      }
    } catch (error) {
      recordWarning(ctx, 'validation', `Endnote leak stripping failed: ${error}`);
    }

    // Post-generation heading fix
    content = content.replace(/([^\n])(##\s*\d+\s*\.?\s*\w)/g, '$1\n\n$2');
    content = content.replace(/(^##\s*\d+\.?\s+[^\n]+)\n(?!\n)/gm, '$1\n\n');

    // Change 5: Outline drift detection — warn when LLM ignores explicit headings
    if (retrieval.hasExplicitHeadings && subsections.length > 0) {
      const generatedHeadings = content.split('\n')
        .filter(l => /^##\s/.test(l))
        .map(l => l.replace(/^##\s*\d*\.?\s*/, '').trim());

      const expectedHeadings = subsections.map(s => s.toLowerCase());

      const matched = generatedHeadings.filter(gh =>
        expectedHeadings.some(eh => gh.toLowerCase().includes(eh.substring(0, 20)))
      );

      if (matched.length < expectedHeadings.length * 0.6) {
        const msg =
          `Outline drifted from user-specified sections: ` +
          `expected ${expectedHeadings.length} headings, matched ${matched.length}. ` +
          `Generated: ${generatedHeadings.slice(0, 5).join('; ')}`;
        recordWarning(ctx, 'validation', msg);
        ctx.logger.warn(`[v2] ${msg}`);
      }
    }

    // Capture body word count BEFORE endnotes are appended (mirrors legacy path at line 2871)
    const bodyWordCount = content.trim().split(/\s+/).filter(Boolean).length;

    // V2 Endnote generation (if --enable-endnotes flag is set)
    let endnotesMetadataV2: { generated: boolean; count: number; supportingQuotationsCount: number } = { generated: false, count: 0, supportingQuotationsCount: 0 };
    if (options.enableEndnotes && corpusContextInfo.used && this.deps.smartRetrieval) {
      try {
        ctx.logger.info('[v2] Generating endnotes with visual provenance...');

        const corpusSearch: CorpusSearchFn = async (query: string, limit: number) => {
          const chunks = await this.deps.smartRetrieval!.retrieveContext(query, {
            maxChunks: limit,
            collections: corpusContextInfo.collections,
            minRelevance: 0.65,
          });
          return chunks.map(chunk => ({
            id: chunk.chunkId,
            text: chunk.content,
            metadata: {
              author: chunk.metadata?.author,
              title: chunk.metadata?.title,
              year: chunk.metadata?.year,
              pageRef: chunk.metadata?.pageRef,
              docId: chunk.metadata?.docId,
              has_bboxes: chunk.metadata?.has_bboxes ?? false,
              source_method: chunk.metadata?.source_method ?? '',
              bboxes: chunk.metadata?.has_bboxes ? (chunk.metadata?.bboxes ?? '') : '',
              path_rel: chunk.metadata?.path_rel ?? '',
            },
            score: chunk.relevanceScore,
          }));
        };

        const endnoteResult = await generateEndnotes(content, corpusSearch, {
          config: {
            maxQuotationsPerEndnote: options.maxQuotationsPerEndnote ?? 3,
            minRelevanceThreshold: options.minEndnoteRelevance ?? 0.65,
            includeSameSource: true,
            includeDifferentSources: true,
            maxQuotationLength: 500,
            formatStyle: 'numeric',
            generateInlineMarkers: true,
            renderBboxOverlays: options.renderBboxOverlays ?? false,
          },
          knownSources: corpusConstraint?.sources?.map(s => ({
            author: (s as any).author ?? '',
            title: (s as any).title ?? '',
          })).filter(s => s.author && s.title),
        });

        if (endnoteResult.endnotes.length > 0) {
          content = endnoteResult.contentWithMarkers + '\n\n' + endnoteResult.endnotesSection;
          endnotesMetadataV2 = {
            generated: true,
            count: endnoteResult.stats.totalEndnotes,
            supportingQuotationsCount: endnoteResult.stats.totalSupportingQuotations,
          };
          ctx.logger.info(`[v2] Generated ${endnoteResult.endnotes.length} endnotes with ${endnoteResult.stats.totalSupportingQuotations} supporting quotations`);
        }
      } catch (error) {
        recordWarning(ctx, 'endnotes', `Endnote generation failed: ${error}`);
      }
    }

    // V2 diagnostics
    let multiStepDiagnosticsResult: WriteResult['multiStepDiagnostics'] | undefined;
    if (multiStepV1Stats && preventionPlan) {
      let blacklistedAuthorsInMainText = 0;
      let blacklistedAuthorsInAppendix = 0;
      if (preventionPlan.blacklistedAuthors.length > 0) {
        const appendixSplit = content.split(/^#\s*VALIDATION APPENDIX/mi);
        const mainTextLower = (appendixSplit[0] || '').toLowerCase();
        const appendixLower = (appendixSplit[1] || '').toLowerCase();
        for (const author of preventionPlan.blacklistedAuthors) {
          const authorLower = author.toLowerCase();
          if (mainTextLower.includes(authorLower)) blacklistedAuthorsInMainText++;
          if (appendixLower.includes(authorLower)) blacklistedAuthorsInAppendix++;
        }
      }
      multiStepDiagnosticsResult = {
        v1Diagnostics: multiStepV1Stats,
        preventionPlan,
        v2Diagnostics: { blacklistedAuthorsUsedInV2: blacklistedAuthorsInMainText, blacklistedAuthorsInMainText, blacklistedAuthorsInAppendix },
      };
    }

    // Auto-feedback
    const writeQuality = qualityValidation?.qualityScore ?? 0.7;
    if (this.deps.config.autoLearn && this.deps.trajectoryBridge && trajectoryId && writeQuality >= this.deps.config.autoStoreThreshold) {
      this.deps.trajectoryBridge.submitFeedback(trajectoryId, writeQuality, { implicit: true }).catch(() => {});
    }
    this.deps.storeDESCEpisode(topic, content, { command: 'god-write', mode: 'write', quality: writeQuality }).catch(() => {});

    const pipelineHealth = computePipelineHealth(ctx);

    return {
      topic,
      content,
      style,
      sources: knowledge.map(k => (k as { id?: string }).id ?? ''),
      wordCount: content.split(/\s+/).length,
      bodyWordCount,
      trajectoryId,
      qualityMetrics: qualityValidation?.metrics,
      qualityScore: qualityValidation?.qualityScore,
      revisionIterations: qualityValidation?.revisionIterations ?? 0,
      corpusContext: corpusContextInfo.used ? { ...corpusContextInfo, whitelistMode: effectiveWhitelistMode } : undefined,
      proseSanitization: sanitizationResult ? {
        sanitized: true,
        artifactsRemoved: sanitizationResult.artifactCount,
        cleanRate: sanitizationResult.cleanRate,
        violations: sanitizationResult.violations.map(v => ({ type: v.type, text: v.text, line: v.line })),
      } : undefined,
      citationEnforcement: citationEnforcementResult ? {
        action: citationEnforcementResult.action,
        totalCitations: citationEnforcementResult.validation.totalCitations,
        validCitations: citationEnforcementResult.validation.valid.length,
        hallucinatedCitations: citationEnforcementResult.validation.hallucinated.length,
        correctionsMade: citationEnforcementResult.correctionsCount,
        missingPageNumbers: citationEnforcementResult.missingPageNumbersCount,
        passRate: citationEnforcementResult.validation.passRate,
        report: citationEnforcementResult.report,
      } : undefined,
      multiStepDiagnostics: multiStepDiagnosticsResult,
      endnotes: endnotesMetadataV2.generated ? endnotesMetadataV2 : undefined,
      pipelineHealth,
    };
  }

}
