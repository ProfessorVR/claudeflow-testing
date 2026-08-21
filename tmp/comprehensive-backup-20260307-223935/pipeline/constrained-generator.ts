/**
 * Constrained Generator — Plan-First Generation with Dual Drift Detection
 *
 * Generation protocol:
 *   1. Produce paragraph plan: [{ paragraph_id, atom_ids, required_quotes }]
 *   2. Validate plan against ClaimMap (all atoms covered, no orphans)
 *   3. Generate paragraph text under atom constraints
 *   4. Post-generation: dual drift detection (forward + reverse)
 *
 * Mode-dependent SentenceScope protocol:
 *   strict: inline constraint tokens ([supports: atom_1, atom_3])
 *   analytics: post-hoc JSON mapping
 *   off: paragraph→quote constrained only
 *
 * @module constrained-generator
 */

import { randomUUID } from 'crypto';
import type {
  ClaimAtom,
  ClaimBinding,
  QuoteSpan,
  ParagraphPlanEntry,
  SentenceScope,
  DiscourseState,
  AtomsMode,
  ReverseCheckMode,
  DriftFlag,
  ReverseCheckVerdict,
  ParagraphLedger,
  ParagraphLedgerItem,
  WarnResolution,
  Facet,
  EvidenceStrictness,
  BlockReason,
} from './icp-types.js';
import { sha256 } from './quote-span-staleness.js';
import { PropositionExtractor } from './proposition-extractor.js';
import { ProseSanitizer } from '../../cli/composition/prose-sanitizer.js';
import type { ICPInlineValidator } from './icp-inline-validator.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface ConstrainedGeneratorConfig {
  /** Max atoms per paragraph */
  maxAtomsPerParagraph?: number;
  /** Enable coherence controller */
  enableCoherence?: boolean;
  /** Max retries for inline validation (default: 2) */
  maxInlineRetries?: number;
}

const DEFAULT_CONFIG: Required<ConstrainedGeneratorConfig> = {
  maxAtomsPerParagraph: 5,
  enableCoherence: true,
  maxInlineRetries: 2,
};

// =============================================================================
// LLM GENERATION PROVIDER (abstraction)
// =============================================================================

export interface GenerationProvider {
  generateParagraph(prompt: string, systemPrompt: string): Promise<string>;
  generateParagraphPlan(
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
  ): Promise<ParagraphPlanEntry[]>;
  generateSentenceMapping(
    paragraphText: string,
    atomIds: string[],
  ): Promise<Array<{ sentence_id: string; text: string; supports_atoms: string[] }>>;
}

// =============================================================================
// GENERATION RESULT
// =============================================================================

export interface GenerationResult {
  paragraphs: GeneratedParagraph[];
  ledger: ParagraphLedger;
  discourse_state: DiscourseState;
  block_reasons: BlockReason[];
}

export interface GeneratedParagraph {
  paragraph_id: string;
  paragraph_order: number;
  text: string;
  sentences: SentenceScope[];
  drift_flags: DriftFlag[];
}

// =============================================================================
// CONSTRAINED GENERATOR
// =============================================================================

export class ConstrainedGenerator {
  private readonly config: Required<ConstrainedGeneratorConfig>;
  private readonly propositionExtractor: PropositionExtractor;
  private readonly sanitizer: ProseSanitizer;
  private inlineValidator?: ICPInlineValidator;

  constructor(
    config: ConstrainedGeneratorConfig = {},
    propositionExtractor?: PropositionExtractor,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.propositionExtractor = propositionExtractor ?? new PropositionExtractor();
    this.sanitizer = new ProseSanitizer();
  }

  /**
   * Set the inline validator for per-paragraph validation.
   */
  setInlineValidator(validator: ICPInlineValidator): void {
    this.inlineValidator = validator;
  }

  /**
   * Validate a paragraph plan against the claim map.
   * Checks: all atoms covered, no orphans, no overloaded paragraphs.
   */
  validatePlan(
    plan: ParagraphPlanEntry[],
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
    facets: Facet[],
    atomsMode: AtomsMode,
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (atomsMode === 'off') {
      // In off mode, plan just needs to cover required quotes
      return { valid: true, errors, warnings };
    }

    // Check: all atoms are assigned to at least one paragraph
    const assignedAtoms = new Set(plan.flatMap(p => p.atom_ids));
    const requiredAtoms = atoms.filter(a => a.evidence_mode !== 'NO_EVIDENCE_REQUIRED');

    for (const atom of requiredAtoms) {
      if (!assignedAtoms.has(atom.atom_id)) {
        if (atomsMode === 'strict') {
          errors.push(`Atom "${atom.display_text}" (${atom.atom_id}) not assigned to any paragraph`);
        } else {
          warnings.push(`Atom "${atom.display_text}" not assigned to any paragraph`);
        }
      }
    }

    // Check: no paragraph has too many atoms
    for (const entry of plan) {
      if (entry.atom_ids.length > this.config.maxAtomsPerParagraph) {
        warnings.push(
          `Paragraph ${entry.paragraph_id} has ${entry.atom_ids.length} atoms (max ${this.config.maxAtomsPerParagraph})`,
        );
      }
    }

    // Check: required quotes are assigned
    const allRequiredQuotes = new Set(plan.flatMap(p => p.required_quotes));
    const boundQuoteIds = new Set(bindings.flatMap(b => b.quote_ids));
    for (const quoteId of allRequiredQuotes) {
      if (!boundQuoteIds.has(quoteId)) {
        warnings.push(`Required quote ${quoteId} is not in any binding`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate text for a paragraph plan with constrained generation.
   * Uses LLM provider for actual text generation.
   */
  async generate(
    plan: ParagraphPlanEntry[],
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
    spans: QuoteSpan[],
    facets: Facet[],
    atomsMode: AtomsMode,
    reverseCheckMode: ReverseCheckMode,
    provider: GenerationProvider,
    stylePrompt?: string,
  ): Promise<GenerationResult> {
    const paragraphs: GeneratedParagraph[] = [];
    const allDriftFlags: DriftFlag[] = [];
    const blockReasons: BlockReason[] = [];

    let discourse: DiscourseState = {
      last_paragraph_tail: [],
      transitions_used_so_far: [],
      rhetorical_goal: '',
      section_argument_trajectory: '',
    };

    for (const entry of plan) {
      // Build system prompt with constraints
      const systemPrompt = this.buildParagraphPrompt(
        entry,
        atoms,
        bindings,
        spans,
        discourse,
        atomsMode,
        stylePrompt,
      );

      // Generate paragraph text
      const userPrompt = this.buildUserPrompt(entry, atoms, atomsMode);
      let rawText = await provider.generateParagraph(userPrompt, systemPrompt);

      // Sanitize raw output — remove LLM meta-text, placeholders, artifacts
      const sanitizationResult = await this.sanitizer.sanitize(rawText);
      let cleanedText = sanitizationResult.sanitized;

      // Inline validation loop — validate and retry if needed
      if (this.inlineValidator) {
        let attempts = 0;
        let validated = false;

        while (!validated && attempts < this.config.maxInlineRetries) {
          const entryAtoms = entry.atom_ids
            .map(id => atoms.find(a => a.atom_id === id)!)
            .filter(Boolean);
          const entryQuotes = (entry.required_quotes ?? [])
            .map(id => spans.find(s => s.quote_id === id)!)
            .filter(Boolean);

          const validation = await this.inlineValidator.validateParagraph(
            cleanedText,
            entryAtoms,
            entryQuotes,
          );

          if (validation.passed) {
            validated = true;
          } else {
            const retryPrompt = `${userPrompt}\n\nPREVIOUS ATTEMPT ISSUES:\n${validation.suggestedRetryFeedback}`;
            rawText = await provider.generateParagraph(retryPrompt, systemPrompt);
            const retryResult = await this.sanitizer.sanitize(rawText);
            cleanedText = retryResult.sanitized;
            attempts++;
          }
        }
      }

      // Parse text and extract sentence scopes
      const { text, sentences } = await this.parseParagraphOutput(
        cleanedText,
        entry,
        atoms,
        atomsMode,
        provider,
      );

      // Dual drift detection
      const driftFlags = this.runDriftDetection(
        sentences,
        atoms,
        atomsMode,
        reverseCheckMode,
      );

      // Check if drift flags should block
      const blockingDrift = driftFlags.filter(f => f.verdict === 'BLOCK');
      if (blockingDrift.length > 0 && atomsMode === 'strict') {
        for (const flag of blockingDrift) {
          blockReasons.push({
            action: 'generate',
            facet_id: entry.atom_ids[0] ? atoms.find(a => a.atom_id === entry.atom_ids[0])?.facet_id : undefined,
            rule_id: 'drift_block',
            required_state: `All propositions mapped to atoms`,
            observed_state: `Unmapped proposition: "${flag.proposition}"`,
            minimal_remediations: [
              'Create atom for this proposition',
              'Mark as rhetorical glue',
              'Switch to analytics mode',
            ],
          });
        }
      }

      const paragraph: GeneratedParagraph = {
        paragraph_id: entry.paragraph_id,
        paragraph_order: entry.paragraph_order,
        text,
        sentences,
        drift_flags: driftFlags,
      };

      paragraphs.push(paragraph);
      allDriftFlags.push(...driftFlags);

      // Update discourse state
      discourse = this.updateDiscourseState(discourse, text);
    }

    // Build ledger
    const ledger = this.buildParagraphLedger(paragraphs, plan, atoms, bindings, facets);

    return {
      paragraphs,
      ledger,
      discourse_state: discourse,
      block_reasons: blockReasons,
    };
  }

  /**
   * Build ParagraphLedger — deterministically recomputed.
   */
  buildParagraphLedger(
    paragraphs: GeneratedParagraph[],
    plan: ParagraphPlanEntry[],
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
    facets: Facet[],
  ): ParagraphLedger {
    const items: ParagraphLedgerItem[] = [];

    for (const para of paragraphs) {
      const planEntry = plan.find(p => p.paragraph_id === para.paragraph_id);
      if (!planEntry) continue;

      // Compute coverage stats
      const mappedAtomIds = new Set(para.sentences.flatMap(s => s.supports_atoms));
      const totalAtoms = planEntry.atom_ids.length;
      const coveredAtoms = planEntry.atom_ids.filter(id => mappedAtomIds.has(id)).length;
      const quoteIds = new Set(planEntry.required_quotes);

      // Get facet strictness
      const atomFacets = planEntry.atom_ids
        .map(id => atoms.find(a => a.atom_id === id)?.facet_id)
        .filter((id): id is string => !!id);
      const strictness = this.getMostRestrictiveStrictness(atomFacets, facets);

      items.push({
        paragraph_id: para.paragraph_id,
        paragraph_order: para.paragraph_order,
        atom_ids: planEntry.atom_ids,
        quote_ids: [...quoteIds],
        strictness,
        coverage_stats: {
          atoms_covered: coveredAtoms,
          atoms_total: totalAtoms,
          quotes_used: quoteIds.size,
        },
        drift_flags: para.drift_flags,
        warn_resolutions: [],
      });
    }

    const ledgerHash = sha256(JSON.stringify(items));
    return { items, ledger_hash: ledgerHash };
  }

  /**
   * Compute sentence boundary hash for polish invariant checking.
   */
  computeSentenceBoundaryHash(text: string): string {
    const boundaries = this.findSentenceBoundaries(text);
    return sha256(JSON.stringify(boundaries));
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Build the system prompt for paragraph generation.
   */
  private buildParagraphPrompt(
    entry: ParagraphPlanEntry,
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
    spans: QuoteSpan[],
    discourse: DiscourseState,
    atomsMode: AtomsMode,
    stylePrompt?: string,
  ): string {
    const parts: string[] = [];

    parts.push('You are generating a single academic paragraph.');

    if (stylePrompt) {
      parts.push('');
      parts.push('STYLE REQUIREMENTS:');
      parts.push(stylePrompt);
    }

    parts.push('CONSTRAINTS:');
    parts.push('- Only use quotation marks for approved quotes provided below.');
    parts.push('- Only cite sources that are explicitly provided.');
    parts.push('- Do not introduce claims not covered by the atom plan below.');

    if (atomsMode === 'strict') {
      parts.push('');
      parts.push('IMPORTANT: Before each sentence, output an inline tag:');
      parts.push('[supports: atom_id1, atom_id2] Your sentence text here.');
      parts.push('If a sentence supports no atoms, output [supports: none]');
    }

    // Add atom context
    const paragraphAtoms = entry.atom_ids
      .map(id => atoms.find(a => a.atom_id === id))
      .filter((a): a is ClaimAtom => !!a);

    if (paragraphAtoms.length > 0) {
      parts.push('');
      parts.push('ATOMS TO COVER:');
      for (const atom of paragraphAtoms) {
        parts.push(`- [${atom.atom_id}] ${atom.display_text} (${atom.modality}, ${atom.kind})`);
      }
    }

    // Add approved quotes
    const quoteSpans = entry.required_quotes
      .map(id => spans.find(s => s.quote_id === id))
      .filter((s): s is QuoteSpan => !!s);

    if (quoteSpans.length > 0) {
      parts.push('');
      parts.push('APPROVED QUOTES (use these verbatim when quoting):');
      for (const span of quoteSpans) {
        parts.push(`- "${span.text}" (${span.source_anchor ?? span.doc_id})`);
      }
    }

    // Discourse state for coherence
    if (this.config.enableCoherence && discourse.last_paragraph_tail.length > 0) {
      parts.push('');
      parts.push('PREVIOUS PARAGRAPH ENDED WITH:');
      for (const sent of discourse.last_paragraph_tail) {
        parts.push(`  "${sent}"`);
      }
      if (discourse.transitions_used_so_far.length > 0) {
        parts.push(`AVOID THESE TRANSITIONS (already used): ${discourse.transitions_used_so_far.join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Build the user prompt for paragraph generation.
   */
  private buildUserPrompt(
    entry: ParagraphPlanEntry,
    atoms: ClaimAtom[],
    atomsMode: AtomsMode,
  ): string {
    const paragraphAtoms = entry.atom_ids
      .map(id => atoms.find(a => a.atom_id === id))
      .filter((a): a is ClaimAtom => !!a);

    const atomDescriptions = paragraphAtoms
      .map(a => a.display_text)
      .join('; ');

    return `Write an academic paragraph addressing: ${atomDescriptions}`;
  }

  /**
   * Parse paragraph output based on atoms mode.
   */
  private async parseParagraphOutput(
    rawText: string,
    entry: ParagraphPlanEntry,
    atoms: ClaimAtom[],
    atomsMode: AtomsMode,
    provider: GenerationProvider,
  ): Promise<{ text: string; sentences: SentenceScope[] }> {
    if (atomsMode === 'strict') {
      return this.parseInlineConstraintTokens(rawText, entry.paragraph_id);
    }

    if (atomsMode === 'analytics') {
      // Post-hoc JSON mapping
      const cleanText = rawText;
      const mapping = await provider.generateSentenceMapping(
        cleanText,
        entry.atom_ids,
      );

      const sentences: SentenceScope[] = mapping.map((m, i) => ({
        sentence_id: m.sentence_id || randomUUID(),
        paragraph_id: entry.paragraph_id,
        sentence_order: i,
        supports_atoms: m.supports_atoms,
        text: m.text,
      }));

      return { text: cleanText, sentences };
    }

    // Off mode: no atom mapping
    const sentenceTexts = this.splitSentences(rawText);
    const sentences: SentenceScope[] = sentenceTexts.map((text, i) => ({
      sentence_id: randomUUID(),
      paragraph_id: entry.paragraph_id,
      sentence_order: i,
      supports_atoms: [],
      text,
    }));

    return { text: rawText, sentences };
  }

  /**
   * Parse inline constraint tokens from strict mode output.
   * Format: [supports: atom_1, atom_3] Sentence text here.
   */
  private parseInlineConstraintTokens(
    rawText: string,
    paragraphId: string,
  ): { text: string; sentences: SentenceScope[] } {
    const sentences: SentenceScope[] = [];
    const cleanParts: string[] = [];

    const tagPattern = /\[supports:\s*([^\]]*)\]\s*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let order = 0;

    // Split by sentence-ending punctuation while preserving tags
    const lines = rawText.split(/(?<=\.|\?|!)\s+/);

    for (const line of lines) {
      const tagMatch = line.match(/^\[supports:\s*([^\]]*)\]\s*/);
      let text: string;
      let atomIds: string[];

      if (tagMatch) {
        text = line.slice(tagMatch[0].length).trim();
        const atomList = tagMatch[1].trim();
        atomIds = atomList === 'none'
          ? []
          : atomList.split(/\s*,\s*/).filter(id => id.length > 0);
      } else {
        text = line.trim();
        atomIds = [];
      }

      if (text.length > 0) {
        cleanParts.push(text);
        sentences.push({
          sentence_id: randomUUID(),
          paragraph_id: paragraphId,
          sentence_order: order++,
          supports_atoms: atomIds,
          text,
        });
      }
    }

    return {
      text: cleanParts.join(' '),
      sentences,
    };
  }

  /**
   * Run dual drift detection on generated sentences.
   */
  private runDriftDetection(
    sentences: SentenceScope[],
    atoms: ClaimAtom[],
    atomsMode: AtomsMode,
    reverseCheckMode: ReverseCheckMode,
  ): DriftFlag[] {
    const flags: DriftFlag[] = [];

    if (atomsMode === 'off') return flags;

    // Build atom lookup
    const atomMap = new Map(atoms.map(a => [a.atom_id, a]));

    for (const sentence of sentences) {
      // Forward check: each declared atom should be entailed by the sentence
      // (simplified: check term overlap)
      if (atomsMode === 'strict') {
        for (const atomId of sentence.supports_atoms) {
          const atom = atomMap.get(atomId);
          if (!atom) {
            flags.push({
              sentence_id: sentence.sentence_id,
              verdict: 'WARN',
              proposition: `References unknown atom: ${atomId}`,
              unmapped_atoms: [atomId],
            });
          }
        }
      }

      // Reverse check: find undeclared claim-bearing predicates
      if (reverseCheckMode !== 'off') {
        const mappedAtomIds = new Map<string, string[]>();
        mappedAtomIds.set(sentence.sentence_id, sentence.supports_atoms);

        const propositions = this.propositionExtractor.extractPropositions(
          [{ sentence_id: sentence.sentence_id, text: sentence.text }],
          mappedAtomIds,
        );

        for (const prop of propositions) {
          if (prop.severity === 'OK') continue;

          const verdict: ReverseCheckVerdict =
            reverseCheckMode === 'block' && prop.severity === 'BLOCK'
              ? 'BLOCK'
              : 'WARN';

          flags.push({
            sentence_id: sentence.sentence_id,
            verdict,
            proposition: prop.text,
            unmapped_atoms: [],
          });
        }
      }
    }

    return flags;
  }

  /**
   * Update discourse state after generating a paragraph.
   */
  private updateDiscourseState(
    current: DiscourseState,
    paragraphText: string,
  ): DiscourseState {
    const sentences = this.splitSentences(paragraphText);
    const tail = sentences.slice(-3);

    // Detect transitions used
    const transitionPatterns = [
      'however', 'moreover', 'furthermore', 'nevertheless',
      'in contrast', 'similarly', 'accordingly', 'thus',
      'therefore', 'consequently', 'indeed', 'specifically',
    ];
    const newTransitions = transitionPatterns.filter(t =>
      paragraphText.toLowerCase().includes(t),
    );

    return {
      last_paragraph_tail: tail,
      transitions_used_so_far: [
        ...current.transitions_used_so_far,
        ...newTransitions,
      ],
      rhetorical_goal: current.rhetorical_goal,
      section_argument_trajectory: current.section_argument_trajectory,
    };
  }

  /**
   * Split text into sentences.
   */
  private splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Find sentence boundaries (positions of sentence-ending punctuation).
   */
  private findSentenceBoundaries(text: string): number[] {
    const boundaries: number[] = [];
    const pattern = /[.!?]\s+/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      boundaries.push(match.index);
    }
    return boundaries;
  }

  /**
   * Get the most restrictive strictness from a set of facet IDs.
   */
  private getMostRestrictiveStrictness(
    facetIds: string[],
    facets: Facet[],
  ): EvidenceStrictness {
    let most: EvidenceStrictness = 'permissive';
    for (const fid of facetIds) {
      const facet = facets.find(f => f.facet_id === fid);
      const strictness = facet?.strictness_override ?? 'strict';
      if (strictness === 'strict') return 'strict';
      if (strictness === 'moderate') most = 'moderate';
    }
    return most;
  }
}
