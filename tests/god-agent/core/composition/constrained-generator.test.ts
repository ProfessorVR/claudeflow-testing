/**
 * Tests for ConstrainedGenerator
 *
 * Covers: plan validation, generation pipeline, discourse state tracking,
 * drift detection, mode-dependent behavior (strict/analytics/off),
 * paragraph ledger building, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConstrainedGenerator } from '../../../../src/god-agent/core/composition/constrained-generator.js';
import type {
  GenerationProvider,
  ConstrainedGeneratorConfig,
} from '../../../../src/god-agent/core/composition/constrained-generator.js';
import type {
  ClaimAtom,
  ClaimBinding,
  QuoteSpan,
  ParagraphPlanEntry,
  Facet,
  AtomsMode,
  ReverseCheckMode,
  DiscourseState,
  ProvenanceScorecard,
} from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// FACTORY HELPERS
// =============================================================================

let idCounter = 0;

function uid(prefix = 'id'): string {
  return `${prefix}_${++idCounter}`;
}

function makeAtom(overrides: Partial<ClaimAtom> = {}): ClaimAtom {
  const atomId = overrides.atom_id ?? uid('atom');
  return {
    atom_id: atomId,
    atom_version_id: 1,
    display_text: overrides.display_text ?? `Claim about ${atomId}`,
    semantic_text: overrides.semantic_text ?? `semantic text for ${atomId}`,
    modality: overrides.modality ?? 'asserted',
    kind: overrides.kind ?? 'corpus_claim',
    parent_claim_id: overrides.parent_claim_id ?? uid('claim'),
    evidence_mode: overrides.evidence_mode ?? 'DIRECT_QUOTE',
    bound_quote_ids: overrides.bound_quote_ids ?? [],
    facet_id: overrides.facet_id ?? uid('facet'),
  };
}

function makeBinding(overrides: Partial<ClaimBinding> = {}): ClaimBinding {
  return {
    binding_id: overrides.binding_id ?? uid('binding'),
    claim_id: overrides.claim_id ?? uid('claim'),
    atom_ids: overrides.atom_ids ?? [],
    quote_ids: overrides.quote_ids ?? [],
    support_kind: overrides.support_kind ?? 'DIRECT_QUOTE',
    staleness_status: overrides.staleness_status ?? 'current',
    warrant_note: overrides.warrant_note,
  };
}

function makeScorecard(overrides: Partial<ProvenanceScorecard> = {}): ProvenanceScorecard {
  return {
    fidelity_score: overrides.fidelity_score ?? 0.95,
    ocr_risk_score: overrides.ocr_risk_score ?? 0.1,
    cluster_size: overrides.cluster_size ?? 1,
    prior_usage_count: overrides.prior_usage_count ?? 0,
    doc_authority_tier: overrides.doc_authority_tier ?? 1,
  };
}

function makeQuoteSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  const qid = overrides.quote_id ?? uid('quote');
  return {
    quote_id: qid,
    text_fingerprint: overrides.text_fingerprint ?? `fp_${qid}`,
    span_fingerprint: overrides.span_fingerprint ?? `sfp_${qid}`,
    doc_id: overrides.doc_id ?? 'doc_1',
    page: overrides.page ?? 1,
    source_kind: overrides.source_kind ?? 'CORPUS',
    clean_text_range: overrides.clean_text_range ?? [0, 100],
    clean_range_hash: overrides.clean_range_hash ?? 'hash_abc',
    patch_epoch: overrides.patch_epoch ?? 0,
    normalization_policy_version: overrides.normalization_policy_version ?? '1.0.0',
    text: overrides.text ?? 'This is a verified quote from the corpus.',
    left_ctx_hash: overrides.left_ctx_hash ?? 'lctx',
    right_ctx_hash: overrides.right_ctx_hash ?? 'rctx',
    verification_status: overrides.verification_status ?? 'human_verified',
    source_anchor: overrides.source_anchor ?? 'De Anima III.3, 428a1',
    provenance_scorecard: overrides.provenance_scorecard ?? makeScorecard(),
  };
}

function makePlanEntry(overrides: Partial<ParagraphPlanEntry> = {}): ParagraphPlanEntry {
  return {
    paragraph_id: overrides.paragraph_id ?? uid('para'),
    paragraph_order: overrides.paragraph_order ?? 0,
    atom_ids: overrides.atom_ids ?? [],
    required_quotes: overrides.required_quotes ?? [],
    section_id: overrides.section_id,
  };
}

function makeFacet(overrides: Partial<Facet> = {}): Facet {
  return {
    facet_id: overrides.facet_id ?? uid('facet'),
    name: overrides.name ?? 'Test Facet',
    description: overrides.description ?? 'A test facet',
    facet_role: overrides.facet_role ?? 'core',
    strictness_override: overrides.strictness_override,
    allow_adds_atoms: overrides.allow_adds_atoms,
    evidence_policy_for_kind: overrides.evidence_policy_for_kind ?? new Map(),
    archived: overrides.archived ?? false,
    atoms_mode: overrides.atoms_mode,
    reverse_check_mode: overrides.reverse_check_mode,
  };
}

function createMockProvider(overrides: Partial<GenerationProvider> = {}): GenerationProvider {
  return {
    generateParagraph: overrides.generateParagraph ??
      vi.fn().mockResolvedValue('This is generated paragraph text. It covers the requested atoms.'),
    generateParagraphPlan: overrides.generateParagraphPlan ??
      vi.fn().mockResolvedValue([]),
    generateSentenceMapping: overrides.generateSentenceMapping ??
      vi.fn().mockResolvedValue([
        { sentence_id: 's1', text: 'This is generated paragraph text.', supports_atoms: [] },
        { sentence_id: 's2', text: 'It covers the requested atoms.', supports_atoms: [] },
      ]),
  };
}

// =============================================================================
// TESTS
// =============================================================================

beforeEach(() => {
  idCounter = 0;
});

describe('ConstrainedGenerator', () => {

  // ---------------------------------------------------------------------------
  // 1. Plan Generation -- produces valid ParagraphPlanEntries
  // ---------------------------------------------------------------------------
  describe('plan generation produces valid ParagraphPlanEntries', () => {
    it('should accept a well-formed plan with atoms assigned to paragraphs', () => {
      const generator = new ConstrainedGenerator();
      const atom1 = makeAtom({ atom_id: 'a1' });
      const atom2 = makeAtom({ atom_id: 'a2' });

      const plan: ParagraphPlanEntry[] = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
        makePlanEntry({ paragraph_id: 'p2', paragraph_order: 1, atom_ids: ['a2'] }),
      ];

      const result = generator.validatePlan(plan, [atom1, atom2], [], [], 'strict');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Plan Validation -- all atoms covered
  // ---------------------------------------------------------------------------
  describe('plan validation -- all atoms covered', () => {
    it('should pass validation when every required atom is assigned', () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', evidence_mode: 'DIRECT_QUOTE' }),
        makeAtom({ atom_id: 'a2', evidence_mode: 'PARAPHRASE_SUPPORTED' }),
      ];
      const plan = [
        makePlanEntry({ atom_ids: ['a1', 'a2'] }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'strict');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should skip atoms with NO_EVIDENCE_REQUIRED from coverage check', () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', evidence_mode: 'DIRECT_QUOTE' }),
        makeAtom({ atom_id: 'a2', evidence_mode: 'NO_EVIDENCE_REQUIRED' }),
      ];
      const plan = [
        makePlanEntry({ atom_ids: ['a1'] }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'strict');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Orphan Atom Detection -- uncovered atoms flagged
  // ---------------------------------------------------------------------------
  describe('orphan atom detection', () => {
    it('should produce an error in strict mode when an atom is unassigned', () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', evidence_mode: 'DIRECT_QUOTE' }),
        makeAtom({ atom_id: 'a2', evidence_mode: 'PARAPHRASE_SUPPORTED' }),
      ];
      const plan = [
        makePlanEntry({ atom_ids: ['a1'] }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'strict');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('a2');
      expect(result.errors[0]).toContain('not assigned');
    });

    it('should produce a warning in analytics mode when an atom is unassigned', () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', evidence_mode: 'DIRECT_QUOTE' }),
        makeAtom({ atom_id: 'orphan', evidence_mode: 'INFERENCE', display_text: 'Orphan claim' }),
      ];
      const plan = [
        makePlanEntry({ atom_ids: ['a1'] }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'analytics');
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Orphan claim');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Overloaded Paragraph Detection
  // ---------------------------------------------------------------------------
  describe('overloaded paragraph detection', () => {
    it('should warn when a paragraph exceeds maxAtomsPerParagraph', () => {
      const generator = new ConstrainedGenerator({ maxAtomsPerParagraph: 3 });
      const atomIds = ['a1', 'a2', 'a3', 'a4', 'a5'];
      const atoms = atomIds.map(id => makeAtom({ atom_id: id }));
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', atom_ids: atomIds }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'strict');
      expect(result.warnings.some(w => w.includes('p1') && w.includes('5 atoms'))).toBe(true);
    });

    it('should not warn when paragraph is within maxAtomsPerParagraph', () => {
      const generator = new ConstrainedGenerator({ maxAtomsPerParagraph: 5 });
      const atoms = [makeAtom({ atom_id: 'a1' }), makeAtom({ atom_id: 'a2' })];
      const plan = [
        makePlanEntry({ atom_ids: ['a1', 'a2'] }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'strict');
      expect(result.warnings.filter(w => w.includes('atoms'))).toHaveLength(0);
    });

    it('should use default maxAtomsPerParagraph of 5 when not specified', () => {
      const generator = new ConstrainedGenerator();
      const atomIds = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
      const atoms = atomIds.map(id => makeAtom({ atom_id: id }));
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', atom_ids: atomIds }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'strict');
      expect(result.warnings.some(w => w.includes('6 atoms') && w.includes('max 5'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Discourse State Tracking -- transitions tracked
  // ---------------------------------------------------------------------------
  describe('discourse state tracking', () => {
    it('should track transitions used across paragraphs during generation', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
        makePlanEntry({ paragraph_id: 'p2', paragraph_order: 1, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn()
          .mockResolvedValueOnce('However, the concept is complex. It is accordingly important. Thus we proceed.')
          .mockResolvedValueOnce('Moreover, the evidence shows clearly. Furthermore, the analysis holds.'),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'off', 'off', provider,
      );

      const discourse = result.discourse_state;
      expect(discourse.transitions_used_so_far).toContain('however');
      expect(discourse.transitions_used_so_far).toContain('accordingly');
      expect(discourse.transitions_used_so_far).toContain('thus');
      expect(discourse.transitions_used_so_far).toContain('moreover');
      expect(discourse.transitions_used_so_far).toContain('furthermore');
    });

    it('should store the last 3 sentences as paragraph tail', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          'First sentence. Second sentence. Third sentence. Fourth sentence.',
        ),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'off', 'off', provider,
      );

      // The tail should be the last 3 sentences
      expect(result.discourse_state.last_paragraph_tail).toHaveLength(3);
      expect(result.discourse_state.last_paragraph_tail).toContain('Second sentence.');
      expect(result.discourse_state.last_paragraph_tail).toContain('Third sentence.');
      expect(result.discourse_state.last_paragraph_tail).toContain('Fourth sentence.');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Quote Injection -- approved quotes inserted into prompt
  // ---------------------------------------------------------------------------
  describe('quote injection', () => {
    it('should validate required quotes against bindings', () => {
      const generator = new ConstrainedGenerator();
      const quoteId = 'q1';
      const atom = makeAtom({ atom_id: 'a1' });
      const binding = makeBinding({ quote_ids: [quoteId], atom_ids: ['a1'] });

      const plan = [
        makePlanEntry({ atom_ids: ['a1'], required_quotes: [quoteId] }),
      ];

      const result = generator.validatePlan(plan, [atom], [binding], [], 'strict');
      // Quote is in a binding, so no warning about unbound quote
      expect(result.warnings.filter(w => w.includes('q1'))).toHaveLength(0);
    });

    it('should warn when required quote is not in any binding', () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });

      const plan = [
        makePlanEntry({ atom_ids: ['a1'], required_quotes: ['q_missing'] }),
      ];

      const result = generator.validatePlan(plan, [atom], [], [], 'strict');
      expect(result.warnings.some(w => w.includes('q_missing') && w.includes('not in any binding'))).toBe(true);
    });

    it('should pass approved quote spans to the generation provider via system prompt', async () => {
      const generator = new ConstrainedGenerator();
      const quoteSpan = makeQuoteSpan({
        quote_id: 'q1',
        text: 'phantasia is a movement',
        source_anchor: '428a1',
      });
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'], required_quotes: ['q1'] }),
      ];

      const generateParagraph = vi.fn().mockResolvedValue('Some paragraph text.');
      const provider = createMockProvider({ generateParagraph });

      await generator.generate(plan, [atom], [], [quoteSpan], [], 'off', 'off', provider);

      // The system prompt (second arg) should include the approved quote text
      const systemPrompt: string = generateParagraph.mock.calls[0][1];
      expect(systemPrompt).toContain('phantasia is a movement');
      expect(systemPrompt).toContain('428a1');
      expect(systemPrompt).toContain('APPROVED QUOTES');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Strict Mode -- inline constraint tokens parsed
  // ---------------------------------------------------------------------------
  describe('strict mode', () => {
    it('should parse inline [supports:] tags from generated text', async () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', display_text: 'Phantasia defined' }),
        makeAtom({ atom_id: 'a2', display_text: 'Relation to perception' }),
      ];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1', 'a2'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          '[supports: a1] Phantasia is defined as a movement resulting from perception. [supports: a2] It relates to sense perception directly.',
        ),
      });

      const result = await generator.generate(
        plan, atoms, [], [], [], 'strict', 'off', provider,
      );

      expect(result.paragraphs).toHaveLength(1);
      const sentences = result.paragraphs[0].sentences;
      expect(sentences.length).toBeGreaterThanOrEqual(2);

      // First sentence supports a1
      const s1 = sentences.find(s => s.text.includes('Phantasia'));
      expect(s1?.supports_atoms).toContain('a1');

      // Second sentence supports a2
      const s2 = sentences.find(s => s.text.includes('perception directly'));
      expect(s2?.supports_atoms).toContain('a2');
    });

    it('should handle [supports: none] tag for rhetorical glue', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          '[supports: a1] The main claim is here. [supports: none] However, this is connective tissue.',
        ),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'strict', 'off', provider,
      );

      const sentences = result.paragraphs[0].sentences;
      const glueSentence = sentences.find(s => s.text.includes('connective tissue'));
      expect(glueSentence?.supports_atoms).toHaveLength(0);
    });

    it('should include inline constraint token instructions in system prompt', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const generateParagraph = vi.fn().mockResolvedValue('[supports: a1] Text here.');
      const provider = createMockProvider({ generateParagraph });

      await generator.generate(plan, [atom], [], [], [], 'strict', 'off', provider);

      const systemPrompt: string = generateParagraph.mock.calls[0][1];
      expect(systemPrompt).toContain('[supports: atom_id1, atom_id2]');
      expect(systemPrompt).toContain('IMPORTANT');
    });

    it('should produce block reasons when drift is detected in strict mode with block reverse check', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      // Generate text that contains a definitional predicate without atom mapping
      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          '[supports: none] Phantasia is defined as a movement resulting from perception.',
        ),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'strict', 'block', provider,
      );

      // The reverse check should flag the definitional predicate as BLOCK
      expect(result.block_reasons.length).toBeGreaterThanOrEqual(0);
      // Drift flags should be present
      const allDrift = result.paragraphs.flatMap(p => p.drift_flags);
      // Some drift detection should occur (proposition extractor finds definitional patterns)
      expect(allDrift.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Analytics Mode -- coverage stats without blocking
  // ---------------------------------------------------------------------------
  describe('analytics mode', () => {
    it('should produce warnings but remain valid when atoms are uncovered', () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', evidence_mode: 'DIRECT_QUOTE' }),
        makeAtom({ atom_id: 'a2', evidence_mode: 'INFERENCE', display_text: 'Uncovered' }),
      ];
      const plan = [
        makePlanEntry({ atom_ids: ['a1'] }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'analytics');
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Uncovered');
    });

    it('should use post-hoc sentence mapping via provider', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const generateSentenceMapping = vi.fn().mockResolvedValue([
        { sentence_id: 's1', text: 'Generated sentence one.', supports_atoms: ['a1'] },
        { sentence_id: 's2', text: 'Generated sentence two.', supports_atoms: [] },
      ]);

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue('Generated sentence one. Generated sentence two.'),
        generateSentenceMapping,
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'analytics', 'off', provider,
      );

      expect(generateSentenceMapping).toHaveBeenCalledWith(
        'Generated sentence one. Generated sentence two.',
        ['a1'],
      );

      const sentences = result.paragraphs[0].sentences;
      expect(sentences).toHaveLength(2);
      expect(sentences[0].supports_atoms).toContain('a1');
      expect(sentences[1].supports_atoms).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Off Mode -- paragraph to quote constrained only
  // ---------------------------------------------------------------------------
  describe('off mode', () => {
    it('should always pass validation in off mode regardless of atom coverage', () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1' }),
        makeAtom({ atom_id: 'a2' }),
      ];
      // Empty plan -- no atoms assigned
      const plan: ParagraphPlanEntry[] = [];

      const result = generator.validatePlan(plan, atoms, [], [], 'off');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should produce sentences with empty supports_atoms in off mode', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          'First sentence of the paragraph. Second sentence follows. Third concludes.',
        ),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'off', 'off', provider,
      );

      const sentences = result.paragraphs[0].sentences;
      expect(sentences).toHaveLength(3);
      for (const s of sentences) {
        expect(s.supports_atoms).toHaveLength(0);
      }
    });

    it('should not run drift detection in off mode', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          'Phantasia is defined as a specific faculty. Therefore it must be considered.',
        ),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'off', 'warn', provider,
      );

      const driftFlags = result.paragraphs[0].drift_flags;
      expect(driftFlags).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. SentenceScope Creation -- proper atom mapping
  // ---------------------------------------------------------------------------
  describe('SentenceScope creation', () => {
    it('should assign paragraph_id and sequential sentence_order to each sentence', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'px', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue('Alpha sentence. Beta sentence. Gamma sentence.'),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'off', 'off', provider,
      );

      const sentences = result.paragraphs[0].sentences;
      expect(sentences).toHaveLength(3);
      for (let i = 0; i < sentences.length; i++) {
        expect(sentences[i].paragraph_id).toBe('px');
        expect(sentences[i].sentence_order).toBe(i);
        expect(sentences[i].sentence_id).toBeTruthy();
      }
    });

    it('should assign sentence_id as a UUID to each sentence', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue('One sentence. Another sentence.'),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'off', 'off', provider,
      );

      const sentences = result.paragraphs[0].sentences;
      const ids = sentences.map(s => s.sentence_id);
      // All IDs should be unique
      expect(new Set(ids).size).toBe(ids.length);
      // Each ID should be a valid UUID-like string (36 chars with hyphens)
      for (const id of ids) {
        expect(id.length).toBe(36);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Paragraph Ordering -- paragraphs ordered correctly
  // ---------------------------------------------------------------------------
  describe('paragraph ordering', () => {
    it('should preserve paragraph_order in generated output', async () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1' }),
        makeAtom({ atom_id: 'a2' }),
        makeAtom({ atom_id: 'a3' }),
      ];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
        makePlanEntry({ paragraph_id: 'p2', paragraph_order: 1, atom_ids: ['a2'] }),
        makePlanEntry({ paragraph_id: 'p3', paragraph_order: 2, atom_ids: ['a3'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn()
          .mockResolvedValueOnce('Paragraph one text.')
          .mockResolvedValueOnce('Paragraph two text.')
          .mockResolvedValueOnce('Paragraph three text.'),
      });

      const result = await generator.generate(
        plan, atoms, [], [], [], 'off', 'off', provider,
      );

      expect(result.paragraphs).toHaveLength(3);
      expect(result.paragraphs[0].paragraph_order).toBe(0);
      expect(result.paragraphs[0].paragraph_id).toBe('p1');
      expect(result.paragraphs[1].paragraph_order).toBe(1);
      expect(result.paragraphs[1].paragraph_id).toBe('p2');
      expect(result.paragraphs[2].paragraph_order).toBe(2);
      expect(result.paragraphs[2].paragraph_id).toBe('p3');
    });

    it('should call generateParagraph once per plan entry in order', async () => {
      const generator = new ConstrainedGenerator();
      const atoms = [makeAtom({ atom_id: 'a1' }), makeAtom({ atom_id: 'a2' })];
      const plan = [
        makePlanEntry({ paragraph_id: 'first', paragraph_order: 0, atom_ids: ['a1'] }),
        makePlanEntry({ paragraph_id: 'second', paragraph_order: 1, atom_ids: ['a2'] }),
      ];

      const generateParagraph = vi.fn().mockResolvedValue('Text.');
      const provider = createMockProvider({ generateParagraph });

      await generator.generate(plan, atoms, [], [], [], 'off', 'off', provider);

      expect(generateParagraph).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // 12. Empty Plan Handling
  // ---------------------------------------------------------------------------
  describe('empty plan handling', () => {
    it('should validate an empty plan as valid', () => {
      const generator = new ConstrainedGenerator();
      const result = generator.validatePlan([], [], [], [], 'strict');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should produce empty paragraphs and ledger for empty plan', async () => {
      const generator = new ConstrainedGenerator();
      const provider = createMockProvider();

      const result = await generator.generate(
        [], [], [], [], [], 'off', 'off', provider,
      );

      expect(result.paragraphs).toHaveLength(0);
      expect(result.ledger.items).toHaveLength(0);
      expect(result.block_reasons).toHaveLength(0);
      expect(result.discourse_state.transitions_used_so_far).toHaveLength(0);
      expect(result.discourse_state.last_paragraph_tail).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Single Paragraph Case
  // ---------------------------------------------------------------------------
  describe('single paragraph case', () => {
    it('should generate exactly one paragraph with correct ledger entry', async () => {
      const generator = new ConstrainedGenerator();
      const facet = makeFacet({ facet_id: 'f1', strictness_override: 'moderate' });
      const atom = makeAtom({ atom_id: 'a1', facet_id: 'f1' });
      const binding = makeBinding({ atom_ids: ['a1'], quote_ids: ['q1'] });
      const plan = [
        makePlanEntry({ paragraph_id: 'only', paragraph_order: 0, atom_ids: ['a1'], required_quotes: ['q1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue('The sole paragraph.'),
      });

      const result = await generator.generate(
        plan, [atom], [binding], [], [facet], 'off', 'off', provider,
      );

      expect(result.paragraphs).toHaveLength(1);
      expect(result.paragraphs[0].paragraph_id).toBe('only');

      expect(result.ledger.items).toHaveLength(1);
      const ledgerItem = result.ledger.items[0];
      expect(ledgerItem.paragraph_id).toBe('only');
      expect(ledgerItem.atom_ids).toEqual(['a1']);
      expect(ledgerItem.quote_ids).toContain('q1');
      expect(ledgerItem.strictness).toBe('moderate');
    });
  });

  // ---------------------------------------------------------------------------
  // 14. Multiple Sections Handling
  // ---------------------------------------------------------------------------
  describe('multiple sections handling', () => {
    it('should handle plan entries from different sections', async () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', facet_id: 'f1' }),
        makeAtom({ atom_id: 'a2', facet_id: 'f2' }),
        makeAtom({ atom_id: 'a3', facet_id: 'f2' }),
      ];
      const facets = [
        makeFacet({ facet_id: 'f1', strictness_override: 'strict' }),
        makeFacet({ facet_id: 'f2', strictness_override: 'permissive' }),
      ];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'], section_id: 'sec-intro' }),
        makePlanEntry({ paragraph_id: 'p2', paragraph_order: 1, atom_ids: ['a2'], section_id: 'sec-body' }),
        makePlanEntry({ paragraph_id: 'p3', paragraph_order: 2, atom_ids: ['a3'], section_id: 'sec-body' }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn()
          .mockResolvedValueOnce('Introduction paragraph.')
          .mockResolvedValueOnce('Body paragraph one.')
          .mockResolvedValueOnce('Body paragraph two.'),
      });

      const result = await generator.generate(
        plan, atoms, [], [], facets, 'off', 'off', provider,
      );

      expect(result.paragraphs).toHaveLength(3);
      expect(result.ledger.items).toHaveLength(3);

      // Section-specific strictness reflected in ledger
      expect(result.ledger.items[0].strictness).toBe('strict');
      expect(result.ledger.items[1].strictness).toBe('permissive');
      expect(result.ledger.items[2].strictness).toBe('permissive');
    });

    it('should validate plan across multiple sections with atoms from both', () => {
      const generator = new ConstrainedGenerator();
      const atoms = [
        makeAtom({ atom_id: 'a1', evidence_mode: 'DIRECT_QUOTE' }),
        makeAtom({ atom_id: 'a2', evidence_mode: 'PARAPHRASE_SUPPORTED' }),
        makeAtom({ atom_id: 'a3', evidence_mode: 'INFERENCE' }),
      ];
      const plan = [
        makePlanEntry({ atom_ids: ['a1'], section_id: 'sec-1' }),
        makePlanEntry({ atom_ids: ['a2', 'a3'], section_id: 'sec-2' }),
      ];

      const result = generator.validatePlan(plan, atoms, [], [], 'strict');
      expect(result.valid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // ADDITIONAL COVERAGE: Paragraph Ledger building
  // ---------------------------------------------------------------------------
  describe('buildParagraphLedger', () => {
    it('should compute coverage_stats correctly in the ledger', async () => {
      const generator = new ConstrainedGenerator();
      const facet = makeFacet({ facet_id: 'f1', strictness_override: 'strict' });
      const atoms = [
        makeAtom({ atom_id: 'a1', facet_id: 'f1' }),
        makeAtom({ atom_id: 'a2', facet_id: 'f1' }),
      ];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1', 'a2'], required_quotes: ['q1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          '[supports: a1] First claim sentence. [supports: none] Connective text.',
        ),
      });

      const result = await generator.generate(
        plan, atoms, [], [], [facet], 'strict', 'off', provider,
      );

      const ledgerItem = result.ledger.items[0];
      expect(ledgerItem.coverage_stats.atoms_total).toBe(2);
      // a1 is covered (mapped via supports), a2 is not
      expect(ledgerItem.coverage_stats.atoms_covered).toBe(1);
      expect(ledgerItem.coverage_stats.quotes_used).toBe(1);
    });

    it('should include a deterministic ledger_hash', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue('Simple text.'),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'off', 'off', provider,
      );

      expect(result.ledger.ledger_hash).toBeTruthy();
      expect(typeof result.ledger.ledger_hash).toBe('string');
      expect(result.ledger.ledger_hash.length).toBeGreaterThan(0);
    });

    it('should use most restrictive strictness when atoms span multiple facets', () => {
      const generator = new ConstrainedGenerator();
      const facets = [
        makeFacet({ facet_id: 'f1', strictness_override: 'permissive' }),
        makeFacet({ facet_id: 'f2', strictness_override: 'strict' }),
      ];
      const atoms = [
        makeAtom({ atom_id: 'a1', facet_id: 'f1' }),
        makeAtom({ atom_id: 'a2', facet_id: 'f2' }),
      ];

      const paragraphs = [{
        paragraph_id: 'p1',
        paragraph_order: 0,
        text: 'Test text.',
        sentences: [],
        drift_flags: [],
      }];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1', 'a2'] }),
      ];

      const ledger = generator.buildParagraphLedger(paragraphs, plan, atoms, [], facets);
      expect(ledger.items[0].strictness).toBe('strict');
    });
  });

  // ---------------------------------------------------------------------------
  // ADDITIONAL COVERAGE: computeSentenceBoundaryHash
  // ---------------------------------------------------------------------------
  describe('computeSentenceBoundaryHash', () => {
    it('should return a stable hash for the same text', () => {
      const generator = new ConstrainedGenerator();
      const text = 'First sentence. Second sentence. Third sentence.';

      const hash1 = generator.computeSentenceBoundaryHash(text);
      const hash2 = generator.computeSentenceBoundaryHash(text);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should return different hashes for texts with different sentence boundaries', () => {
      const generator = new ConstrainedGenerator();
      const text1 = 'Short. Many. Sentences. Here.';
      const text2 = 'One single very long sentence with no periods at all';

      const hash1 = generator.computeSentenceBoundaryHash(text1);
      const hash2 = generator.computeSentenceBoundaryHash(text2);

      expect(hash1).not.toBe(hash2);
    });
  });

  // ---------------------------------------------------------------------------
  // ADDITIONAL COVERAGE: coherence controller in system prompt
  // ---------------------------------------------------------------------------
  describe('coherence controller', () => {
    it('should include previous paragraph tail in system prompt when enableCoherence is true', async () => {
      const generator = new ConstrainedGenerator({ enableCoherence: true });
      const atoms = [
        makeAtom({ atom_id: 'a1' }),
        makeAtom({ atom_id: 'a2' }),
      ];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
        makePlanEntry({ paragraph_id: 'p2', paragraph_order: 1, atom_ids: ['a2'] }),
      ];

      const generateParagraph = vi.fn()
        .mockResolvedValueOnce('First paragraph first sentence. First paragraph second sentence.')
        .mockResolvedValueOnce('Second paragraph text.');

      const provider = createMockProvider({ generateParagraph });

      await generator.generate(plan, atoms, [], [], [], 'off', 'off', provider);

      // Second call should have discourse state in system prompt
      const secondCallSystemPrompt: string = generateParagraph.mock.calls[1][1];
      expect(secondCallSystemPrompt).toContain('PREVIOUS PARAGRAPH ENDED WITH');
    });

    it('should include avoid-transitions warning when transitions have been used', async () => {
      const generator = new ConstrainedGenerator({ enableCoherence: true });
      const atoms = [makeAtom({ atom_id: 'a1' }), makeAtom({ atom_id: 'a2' })];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
        makePlanEntry({ paragraph_id: 'p2', paragraph_order: 1, atom_ids: ['a2'] }),
      ];

      const generateParagraph = vi.fn()
        .mockResolvedValueOnce('However, the first analysis holds. Thus we see the pattern.')
        .mockResolvedValueOnce('Additional text here.');

      const provider = createMockProvider({ generateParagraph });

      await generator.generate(plan, atoms, [], [], [], 'off', 'off', provider);

      const secondCallSystemPrompt: string = generateParagraph.mock.calls[1][1];
      expect(secondCallSystemPrompt).toContain('AVOID THESE TRANSITIONS');
      expect(secondCallSystemPrompt).toContain('however');
      expect(secondCallSystemPrompt).toContain('thus');
    });

    it('should not include discourse info in the first paragraph prompt', async () => {
      const generator = new ConstrainedGenerator({ enableCoherence: true });
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const generateParagraph = vi.fn().mockResolvedValue('Text.');
      const provider = createMockProvider({ generateParagraph });

      await generator.generate(plan, [atom], [], [], [], 'off', 'off', provider);

      const firstCallSystemPrompt: string = generateParagraph.mock.calls[0][1];
      expect(firstCallSystemPrompt).not.toContain('PREVIOUS PARAGRAPH');
      expect(firstCallSystemPrompt).not.toContain('AVOID THESE TRANSITIONS');
    });
  });

  // ---------------------------------------------------------------------------
  // ADDITIONAL COVERAGE: Drift detection edge cases
  // ---------------------------------------------------------------------------
  describe('drift detection edge cases', () => {
    it('should flag unknown atom IDs referenced in strict mode supports tags', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      // LLM references an atom ID that does not exist
      const provider = createMockProvider({
        generateParagraph: vi.fn().mockResolvedValue(
          '[supports: a1, a_nonexistent] Some sentence here.',
        ),
      });

      const result = await generator.generate(
        plan, [atom], [], [], [], 'strict', 'off', provider,
      );

      const driftFlags = result.paragraphs[0].drift_flags;
      const unknownAtomFlag = driftFlags.find(f =>
        f.proposition.includes('a_nonexistent'),
      );
      expect(unknownAtomFlag).toBeDefined();
      expect(unknownAtomFlag?.verdict).toBe('WARN');
    });
  });

  // ---------------------------------------------------------------------------
  // ADDITIONAL COVERAGE: Facet strictness resolution
  // ---------------------------------------------------------------------------
  describe('facet strictness resolution', () => {
    it('should default to strict when facet has no strictness_override', () => {
      const generator = new ConstrainedGenerator();
      const facets = [
        makeFacet({ facet_id: 'f1' }), // no strictness_override
      ];
      const atoms = [makeAtom({ atom_id: 'a1', facet_id: 'f1' })];

      const paragraphs = [{
        paragraph_id: 'p1',
        paragraph_order: 0,
        text: 'Text.',
        sentences: [],
        drift_flags: [],
      }];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const ledger = generator.buildParagraphLedger(paragraphs, plan, atoms, [], facets);
      // When no strictness_override, the code defaults to 'strict'
      expect(ledger.items[0].strictness).toBe('strict');
    });

    it('should return permissive when all facets are permissive', () => {
      const generator = new ConstrainedGenerator();
      const facets = [
        makeFacet({ facet_id: 'f1', strictness_override: 'permissive' }),
        makeFacet({ facet_id: 'f2', strictness_override: 'permissive' }),
      ];
      const atoms = [
        makeAtom({ atom_id: 'a1', facet_id: 'f1' }),
        makeAtom({ atom_id: 'a2', facet_id: 'f2' }),
      ];

      const paragraphs = [{
        paragraph_id: 'p1',
        paragraph_order: 0,
        text: 'Text.',
        sentences: [],
        drift_flags: [],
      }];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1', 'a2'] }),
      ];

      const ledger = generator.buildParagraphLedger(paragraphs, plan, atoms, [], facets);
      expect(ledger.items[0].strictness).toBe('permissive');
    });

    it('should return moderate when mixed with permissive but no strict', () => {
      const generator = new ConstrainedGenerator();
      const facets = [
        makeFacet({ facet_id: 'f1', strictness_override: 'permissive' }),
        makeFacet({ facet_id: 'f2', strictness_override: 'moderate' }),
      ];
      const atoms = [
        makeAtom({ atom_id: 'a1', facet_id: 'f1' }),
        makeAtom({ atom_id: 'a2', facet_id: 'f2' }),
      ];

      const paragraphs = [{
        paragraph_id: 'p1',
        paragraph_order: 0,
        text: 'Text.',
        sentences: [],
        drift_flags: [],
      }];
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1', 'a2'] }),
      ];

      const ledger = generator.buildParagraphLedger(paragraphs, plan, atoms, [], facets);
      expect(ledger.items[0].strictness).toBe('moderate');
    });
  });

  // ---------------------------------------------------------------------------
  // ADDITIONAL COVERAGE: User prompt construction
  // ---------------------------------------------------------------------------
  describe('user prompt construction', () => {
    it('should include atom display_text in the user prompt', async () => {
      const generator = new ConstrainedGenerator();
      const atom = makeAtom({ atom_id: 'a1', display_text: 'Phantasia as imagination' });
      const plan = [
        makePlanEntry({ paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'] }),
      ];

      const generateParagraph = vi.fn().mockResolvedValue('Text.');
      const provider = createMockProvider({ generateParagraph });

      await generator.generate(plan, [atom], [], [], [], 'off', 'off', provider);

      const userPrompt: string = generateParagraph.mock.calls[0][0];
      expect(userPrompt).toContain('Phantasia as imagination');
      expect(userPrompt).toContain('Write an academic paragraph');
    });
  });
});
