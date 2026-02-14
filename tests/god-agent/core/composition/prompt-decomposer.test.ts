/**
 * Tests for PromptDecomposer — Prompt to PromptSpec decomposition,
 * facet generation, retrieval lexicon, evidence validation, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PromptDecomposer,
  type PromptDecomposerConfig,
  type LLMDecompositionProvider,
  type LLMDecompositionResult,
  type ProposedFacet,
} from '../../../../src/god-agent/core/composition/prompt-decomposer.js';
import type { PromptSpec, Facet, AtomKind, EvidenceRequirement } from '../../../../src/god-agent/core/composition/icp-types.js';
import type { SmartRetrievalLayer } from '../../../../src/god-agent/retrieval/smart-retrieval-layer.js';
import type { ContextChunk } from '../../../../src/god-agent/retrieval/types.js';

// =============================================================================
// HELPERS
// =============================================================================

/** UUID v4 pattern for facet_id validation */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeChunk(overrides: Partial<ContextChunk> = {}): ContextChunk {
  return {
    chunkId: 'chunk-1',
    docId: 'doc-1',
    content: 'Some corpus text about the topic.',
    metadata: {
      author: 'Aristotle',
      title: 'De Anima',
      year: -350,
      page_start: 1,
      page_end: 5,
      collection: 'philosophy',
    },
    relevanceScore: 0.85,
    ...overrides,
  };
}

/**
 * Create a mock SmartRetrievalLayer. By default, retrieveContext returns
 * one chunk (evidence found). Pass `chunks` to customize.
 */
function makeMockRetrieval(chunks: ContextChunk[] = [makeChunk()]): SmartRetrievalLayer {
  return {
    retrieveContext: vi.fn().mockResolvedValue(chunks),
  } as unknown as SmartRetrievalLayer;
}

/**
 * Create a mock LLM decomposition provider that returns a fixed result.
 */
function makeMockLLM(result: LLMDecompositionResult): LLMDecompositionProvider {
  return {
    decompose: vi.fn().mockResolvedValue(result),
  };
}

function makeLLMResult(overrides: Partial<LLMDecompositionResult> = {}): LLMDecompositionResult {
  return {
    research_questions: ['What is the nature of phantasia in Aristotle?'],
    facets: [
      {
        name: 'Phantasia as cognitive faculty',
        description: 'Examines phantasia as a faculty of the soul in De Anima',
        role: 'core',
        retrieval_terms: ['phantasia', 'imagination', 'De Anima'],
        success_criteria: 'Must cite at least 2 passages from De Anima on phantasia',
      },
      {
        name: 'Phantasia and perception',
        description: 'Relationship between sense-perception and phantasia',
        role: 'supporting',
        retrieval_terms: ['aisthesis', 'perception', 'sense'],
        success_criteria: 'Establish clear link between perception and phantasia',
      },
    ],
    retrieval_lexicon: {
      phantasia: ['imagination', 'phantasma', 'appearance'],
      aisthesis: ['perception', 'sense-perception', 'sensation'],
    },
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('PromptDecomposer', () => {
  let retrieval: SmartRetrievalLayer;
  let decomposer: PromptDecomposer;

  beforeEach(() => {
    retrieval = makeMockRetrieval();
    decomposer = new PromptDecomposer(retrieval);
  });

  // =========================================================================
  // 1. Basic decomposition -- simple prompt produces valid PromptSpec
  // =========================================================================
  describe('basic decomposition (fallback, no LLM)', () => {
    it('should produce a valid PromptSpec from a simple prompt', async () => {
      const prompt = 'Analyze Aristotle on phantasia in De Anima';

      const spec = await decomposer.decompose(prompt);

      expect(spec).toBeDefined();
      expect(spec.original_prompt).toBe(prompt);
      expect(spec.research_questions).toBeDefined();
      expect(spec.research_questions.length).toBeGreaterThan(0);
      expect(spec.required_facets.length + spec.optional_facets.length).toBeGreaterThan(0);
      expect(spec.retrieval_lexicon).toBeInstanceOf(Map);
      expect(spec.success_criteria).toBeInstanceOf(Map);
    });

    it('should use the whole prompt as a single facet when no list structure is detected', async () => {
      const prompt = 'Discuss the role of phantasia';

      const spec = await decomposer.decompose(prompt);

      // "Discuss the role of phantasia" is a single sentence shorter than
      // the 10-char filter, so it creates one fallback facet from the full prompt.
      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 2. PromptSpec structure -- all required fields present
  // =========================================================================
  describe('PromptSpec structure', () => {
    it('should contain all required PromptSpec fields', async () => {
      const spec = await decomposer.decompose('Examine virtue ethics in Aristotle');

      expect(spec).toHaveProperty('original_prompt');
      expect(spec).toHaveProperty('research_questions');
      expect(spec).toHaveProperty('required_facets');
      expect(spec).toHaveProperty('optional_facets');
      expect(spec).toHaveProperty('retrieval_lexicon');
      expect(spec).toHaveProperty('success_criteria');

      expect(Array.isArray(spec.research_questions)).toBe(true);
      expect(Array.isArray(spec.required_facets)).toBe(true);
      expect(Array.isArray(spec.optional_facets)).toBe(true);
    });

    it('should populate retrieval_lexicon as a Map keyed by facet_id', async () => {
      const spec = await decomposer.decompose('Examine virtue ethics in Aristotle');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(spec.retrieval_lexicon.has(facet.facet_id)).toBe(true);
        const terms = spec.retrieval_lexicon.get(facet.facet_id);
        expect(Array.isArray(terms)).toBe(true);
        expect(terms!.length).toBeGreaterThan(0);
      }
    });

    it('should populate success_criteria as a Map keyed by facet_id', async () => {
      const spec = await decomposer.decompose('Examine virtue ethics in Aristotle');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(spec.success_criteria.has(facet.facet_id)).toBe(true);
        const criteria = spec.success_criteria.get(facet.facet_id);
        expect(typeof criteria).toBe('string');
        expect(criteria!.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 3. Facet generation -- facets have valid UUIDs and roles
  // =========================================================================
  describe('facet generation', () => {
    it('should assign valid UUID v4 facet_ids', async () => {
      const spec = await decomposer.decompose('Discuss ethics and politics in Aristotle');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(facet.facet_id).toMatch(UUID_V4_REGEX);
      }
    });

    it('should assign unique facet_ids to each facet', async () => {
      const llmResult = makeLLMResult();
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(retrieval, llm);

      const spec = await d.decompose('test prompt');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      const ids = allFacets.map(f => f.facet_id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should assign valid facet_role from the proposed role', async () => {
      const llmResult = makeLLMResult({
        facets: [
          { name: 'Core facet', description: 'Core', role: 'core', retrieval_terms: ['term'], success_criteria: 'criteria' },
          { name: 'Supporting facet', description: 'Supporting', role: 'supporting', retrieval_terms: ['term2'], success_criteria: 'criteria2' },
          { name: 'Exploratory facet', description: 'Exploratory', role: 'exploratory', retrieval_terms: ['term3'], success_criteria: 'criteria3' },
        ],
      });
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(retrieval, llm);

      const spec = await d.decompose('test prompt');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      const roles = allFacets.map(f => f.facet_role);
      expect(roles).toContain('core');
      expect(roles).toContain('supporting');
      expect(roles).toContain('exploratory');
    });

    it('should mark all facets as not archived', async () => {
      const spec = await decomposer.decompose('Discuss Aristotle on the soul');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(facet.archived).toBe(false);
      }
    });
  });

  // =========================================================================
  // 4. Retrieval lexicon -- terms generated from prompt
  // =========================================================================
  describe('retrieval lexicon', () => {
    it('should extract meaningful terms excluding stopwords', async () => {
      const spec = await decomposer.decompose('The relationship between phantasia and perception in Aristotle');

      const allTerms: string[] = [];
      for (const terms of spec.retrieval_lexicon.values()) {
        allTerms.push(...terms);
      }

      // Should include content words, not stopwords
      expect(allTerms.some(t => t === 'the' || t === 'and' || t === 'in')).toBe(false);
      expect(allTerms.some(t => t.includes('phantasia') || t.includes('perception') || t.includes('aristotle'))).toBe(true);
    });

    it('should limit terms to at most 10 per facet', async () => {
      // Long prompt with many distinct words
      const longPrompt =
        'Examine virtue, justice, temperance, courage, wisdom, friendship, happiness, pleasure, ' +
        'knowledge, politics, rhetoric, ethics, metaphysics, epistemology, ontology, and dialectic ' +
        'within the Aristotelian corpus and its reception in Hellenistic philosophy';

      const spec = await decomposer.decompose(longPrompt);

      for (const terms of spec.retrieval_lexicon.values()) {
        expect(terms.length).toBeLessThanOrEqual(10);
      }
    });

    it('should deduplicate retrieval terms', async () => {
      const spec = await decomposer.decompose(
        'Aristotle discusses phantasia. Aristotle argues phantasia involves motion.',
      );

      for (const terms of spec.retrieval_lexicon.values()) {
        const unique = new Set(terms);
        expect(unique.size).toBe(terms.length);
      }
    });
  });

  // =========================================================================
  // 5. Research questions -- derived from prompt
  // =========================================================================
  describe('research questions', () => {
    it('should derive at least one research question from fallback decomposition', async () => {
      const prompt = 'Discuss the role of phantasia in perception';
      const spec = await decomposer.decompose(prompt);

      expect(spec.research_questions.length).toBeGreaterThanOrEqual(1);
      // In fallback mode, the prompt itself is the research question
      expect(spec.research_questions).toContain(prompt);
    });

    it('should use LLM-provided research questions when available', async () => {
      const llmResult = makeLLMResult({
        research_questions: [
          'How does Aristotle define phantasia in De Anima?',
          'What is the relationship between phantasia and nous?',
        ],
      });
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(retrieval, llm);

      const spec = await d.decompose('test prompt');

      expect(spec.research_questions).toEqual([
        'How does Aristotle define phantasia in De Anima?',
        'What is the relationship between phantasia and nous?',
      ]);
    });
  });

  // =========================================================================
  // 6. Success criteria -- per-facet criteria
  // =========================================================================
  describe('success criteria', () => {
    it('should set success criteria for every facet in fallback mode', async () => {
      const spec = await decomposer.decompose('Discuss virtue ethics and the good life');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        const criteria = spec.success_criteria.get(facet.facet_id);
        expect(criteria).toBeDefined();
        expect(criteria!.startsWith('Address')).toBe(true);
      }
    });

    it('should use LLM-provided success criteria', async () => {
      const llmResult = makeLLMResult();
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(retrieval, llm);

      const spec = await d.decompose('test prompt');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      // Each facet gets the success_criteria from the corresponding ProposedFacet
      for (const facet of allFacets) {
        const criteria = spec.success_criteria.get(facet.facet_id);
        expect(criteria).toBeDefined();
        expect(typeof criteria).toBe('string');
        expect(criteria!.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 7. Empty/short prompt handling
  // =========================================================================
  describe('empty and short prompt handling', () => {
    it('should handle a very short prompt by creating a single fallback facet', async () => {
      const spec = await decomposer.decompose('Ethics');

      // "Ethics" by itself won't split by sentence (under 10 chars when trimmed),
      // so fallback produces a single facet from the whole prompt
      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBe(1);
      expect(allFacets[0].name).toBe('Ethics');
    });

    it('should handle an empty prompt gracefully', async () => {
      const spec = await decomposer.decompose('');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      // Empty prompt produces a single fallback facet (empty name)
      expect(allFacets.length).toBe(1);
      expect(spec.original_prompt).toBe('');
    });

    it('should handle whitespace-only prompt', async () => {
      const spec = await decomposer.decompose('   ');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeGreaterThanOrEqual(1);
      expect(spec.original_prompt).toBe('   ');
    });
  });

  // =========================================================================
  // 8. Multi-facet decomposition
  // =========================================================================
  describe('multi-facet decomposition', () => {
    it('should parse numbered list prompts into multiple facets', async () => {
      const prompt = [
        '1. Examine phantasia as a cognitive faculty',
        '2. Analyze the relationship between phantasia and perception',
        '3. Discuss deliberative phantasia in practical reasoning',
      ].join('\n');

      const spec = await decomposer.decompose(prompt);

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBe(3);
    });

    it('should parse bulleted list prompts into multiple facets', async () => {
      const prompt = [
        '- The nature of the soul in De Anima',
        '- Nous and intellectual apprehension',
        '- Phantasia as intermediary faculty',
      ].join('\n');

      const spec = await decomposer.decompose(prompt);

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBe(3);
    });

    it('should limit to at most 5 facets from key point extraction', async () => {
      const prompt = [
        '1. Point one about ethics',
        '2. Point two about politics',
        '3. Point three about metaphysics',
        '4. Point four about epistemology',
        '5. Point five about rhetoric',
        '6. Point six about aesthetics',
        '7. Point seven about logic',
      ].join('\n');

      const spec = await decomposer.decompose(prompt);

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeLessThanOrEqual(5);
    });

    it('should assign first facet as core and subsequent as supporting in fallback', async () => {
      const prompt = [
        '1. Primary analysis of phantasia',
        '2. Secondary analysis of perception',
        '3. Tertiary analysis of nous',
      ].join('\n');

      const spec = await decomposer.decompose(prompt);

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets[0].facet_role).toBe('core');
      expect(allFacets[1].facet_role).toBe('supporting');
      expect(allFacets[2].facet_role).toBe('supporting');
    });

    it('should split multi-sentence prompts into separate facets', async () => {
      const prompt =
        'Examine the nature of phantasia as described in De Anima. ' +
        'Analyze how perception relates to imaginative cognition. ' +
        'Consider the role of phantasmata in deliberation.';

      const spec = await decomposer.decompose(prompt);

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBe(3);
    });
  });

  // =========================================================================
  // 9. Facet evidence_policy_for_kind is populated
  // =========================================================================
  describe('facet evidence_policy_for_kind', () => {
    const ALL_ATOM_KINDS: AtomKind[] = [
      'corpus_claim',
      'interpretive_move',
      'authorial_stipulation',
      'method',
      'organization',
    ];

    it('should populate evidence_policy_for_kind as a Map for all atom kinds', async () => {
      const spec = await decomposer.decompose('Discuss Aristotle on phantasia');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(facet.evidence_policy_for_kind).toBeInstanceOf(Map);
        for (const kind of ALL_ATOM_KINDS) {
          expect(facet.evidence_policy_for_kind.has(kind)).toBe(true);
        }
      }
    });

    it('should apply strict evidence policy by default', async () => {
      const spec = await decomposer.decompose('Discuss Aristotle on phantasia');

      const facet = [...spec.required_facets, ...spec.optional_facets][0];

      // corpus_claim always requires evidence
      expect(facet.evidence_policy_for_kind.get('corpus_claim')).toBe('required');

      // interpretive_move requires evidence in strict mode
      expect(facet.evidence_policy_for_kind.get('interpretive_move')).toBe('required_in_strict');

      // authorial_stipulation, method, organization do not require evidence
      expect(facet.evidence_policy_for_kind.get('authorial_stipulation')).toBe('not_required');
      expect(facet.evidence_policy_for_kind.get('method')).toBe('not_required');
      expect(facet.evidence_policy_for_kind.get('organization')).toBe('not_required');
    });

    it('should apply permissive evidence policy when configured', async () => {
      const d = new PromptDecomposer(retrieval, undefined, {
        defaultStrictness: 'permissive',
      });

      const spec = await d.decompose('Discuss Aristotle on phantasia');

      const facet = [...spec.required_facets, ...spec.optional_facets][0];

      // corpus_claim is always required regardless of strictness
      expect(facet.evidence_policy_for_kind.get('corpus_claim')).toBe('required');

      // interpretive_move is not_required in permissive mode
      expect(facet.evidence_policy_for_kind.get('interpretive_move')).toBe('not_required');
    });
  });

  // =========================================================================
  // 10. PromptSpec immutability -- original_prompt preserved
  // =========================================================================
  describe('PromptSpec immutability', () => {
    it('should preserve the original prompt exactly as given', async () => {
      const prompt = '  Analyze Aristotle on phantasia!!  \n\n';

      const spec = await decomposer.decompose(prompt);

      expect(spec.original_prompt).toBe(prompt);
    });

    it('should not mutate the original prompt in research_questions', async () => {
      const prompt = 'Discuss phantasia in Aristotle';

      const spec = await decomposer.decompose(prompt);

      // The original prompt is set as-is
      expect(spec.original_prompt).toBe(prompt);
      // Research questions use the prompt but do not alter original_prompt
      expect(spec.original_prompt).toBe('Discuss phantasia in Aristotle');
    });

    it('should return distinct facet arrays (required vs optional)', async () => {
      // Set up retrieval to return no chunks for some facets, chunks for others
      const mockRetrieval = {
        retrieveContext: vi.fn()
          .mockResolvedValueOnce([makeChunk()])    // first facet: has evidence
          .mockResolvedValueOnce([])                // second facet: no evidence
      } as unknown as SmartRetrievalLayer;

      const llmResult = makeLLMResult();
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(mockRetrieval, llm);

      const spec = await d.decompose('test');

      expect(spec.required_facets.length).toBe(1);
      expect(spec.optional_facets.length).toBe(1);

      // Ensure they are distinct facets
      expect(spec.required_facets[0].facet_id).not.toBe(spec.optional_facets[0].facet_id);
    });
  });

  // =========================================================================
  // 11. Optional facets handling (evidence-based demotion)
  // =========================================================================
  describe('optional facets handling (evidence-based demotion)', () => {
    it('should demote facets with no corpus evidence to optional_facets', async () => {
      // Retrieval returns no chunks = no evidence
      const noEvidenceRetrieval = makeMockRetrieval([]);
      const llmResult = makeLLMResult();
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(noEvidenceRetrieval, llm);

      const spec = await d.decompose('test');

      // All facets should be demoted to optional since no evidence
      expect(spec.required_facets.length).toBe(0);
      expect(spec.optional_facets.length).toBe(llmResult.facets.length);
    });

    it('should keep facets with corpus evidence in required_facets', async () => {
      // Retrieval returns chunks = evidence found
      const evidenceRetrieval = makeMockRetrieval([makeChunk()]);
      const llmResult = makeLLMResult();
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(evidenceRetrieval, llm);

      const spec = await d.decompose('test');

      // All facets should remain required since evidence is found
      expect(spec.required_facets.length).toBe(llmResult.facets.length);
      expect(spec.optional_facets.length).toBe(0);
    });

    it('should treat retrieval errors as no evidence (demote to optional)', async () => {
      const failingRetrieval = {
        retrieveContext: vi.fn().mockRejectedValue(new Error('ChromaDB connection refused')),
      } as unknown as SmartRetrievalLayer;

      const llmResult = makeLLMResult();
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(failingRetrieval, llm);

      const spec = await d.decompose('test');

      // All facets demoted because retrieval failed
      expect(spec.required_facets.length).toBe(0);
      expect(spec.optional_facets.length).toBe(llmResult.facets.length);
    });

    it('should respect configurable minRetrievalHits threshold', async () => {
      // Return exactly 1 chunk, but require 2 hits
      const singleChunkRetrieval = makeMockRetrieval([makeChunk()]);
      const d = new PromptDecomposer(singleChunkRetrieval, undefined, {
        minRetrievalHits: 2,
      });

      const spec = await d.decompose('Discuss phantasia');

      // Should demote because 1 chunk < 2 required hits
      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeGreaterThan(0);
      expect(spec.required_facets.length).toBe(0);
      expect(spec.optional_facets.length).toBe(allFacets.length);
    });

    it('should promote facets when retrieval hits meet the threshold', async () => {
      const multiChunkRetrieval = makeMockRetrieval([makeChunk(), makeChunk(), makeChunk()]);
      const d = new PromptDecomposer(multiChunkRetrieval, undefined, {
        minRetrievalHits: 3,
      });

      const spec = await d.decompose('Discuss phantasia');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeGreaterThan(0);
      // All facets should be required since 3 chunks >= 3 hits threshold
      expect(spec.required_facets.length).toBe(allFacets.length);
    });
  });

  // =========================================================================
  // 12. Edge cases -- special characters, very long prompts
  // =========================================================================
  describe('edge cases', () => {
    it('should handle prompts with special characters', async () => {
      const prompt = 'Analyze Aristotle\'s "De Anima" (III.3, 428a-429a) & phantasia\'s role';

      const spec = await decomposer.decompose(prompt);

      expect(spec.original_prompt).toBe(prompt);
      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle prompts with Unicode characters', async () => {
      const prompt = 'Examine phantasia (from Greek: \u03C6\u03B1\u03BD\u03C4\u03B1\u03C3\u03AF\u03B1) in Aristotle';

      const spec = await decomposer.decompose(prompt);

      expect(spec.original_prompt).toBe(prompt);
      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very long prompts without error', async () => {
      const longSentence = 'Analyze the relationship between soul and body in ancient philosophy. ';
      const prompt = longSentence.repeat(50); // ~3500 chars

      const spec = await decomposer.decompose(prompt);

      expect(spec.original_prompt).toBe(prompt);
      // Should extract up to 5 facets max from sentence splitting
      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeLessThanOrEqual(5);
      expect(allFacets.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle prompts with only punctuation', async () => {
      const prompt = '???!!!...';

      const spec = await decomposer.decompose(prompt);

      expect(spec.original_prompt).toBe(prompt);
      // Should still produce at least one fallback facet
      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      expect(allFacets.length).toBeGreaterThanOrEqual(1);
    });

    it('should truncate facet name to 60 characters', async () => {
      const longPoint =
        '1. This is an extremely long research point that exceeds sixty characters and should be truncated for the facet name field';
      const spec = await decomposer.decompose(longPoint);

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(facet.name.length).toBeLessThanOrEqual(60);
      }
    });
  });

  // =========================================================================
  // LLM provider integration
  // =========================================================================
  describe('LLM provider integration', () => {
    it('should use LLM provider when available', async () => {
      const llmResult = makeLLMResult();
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(retrieval, llm);

      const prompt = 'Discuss phantasia';
      await d.decompose(prompt);

      expect(llm.decompose).toHaveBeenCalledWith(prompt);
    });

    it('should fall back to deterministic decomposition when no LLM', async () => {
      // No LLM provider passed
      const d = new PromptDecomposer(retrieval);

      const spec = await d.decompose('Discuss phantasia');

      // Fallback always sets the prompt as the research question
      expect(spec.research_questions).toContain('Discuss phantasia');
    });
  });

  // =========================================================================
  // Configuration
  // =========================================================================
  describe('configuration', () => {
    it('should set default atoms_mode on facets', async () => {
      const d = new PromptDecomposer(retrieval, undefined, {
        defaultAtomsMode: 'strict',
      });

      const spec = await d.decompose('Discuss phantasia');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(facet.atoms_mode).toBe('strict');
      }
    });

    it('should set default reverse_check_mode on facets', async () => {
      const d = new PromptDecomposer(retrieval, undefined, {
        defaultReverseCheckMode: 'block',
      });

      const spec = await d.decompose('Discuss phantasia');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        // Non-exploratory facets get the configured mode
        if (facet.facet_role !== 'exploratory') {
          expect(facet.reverse_check_mode).toBe('block');
        }
      }
    });

    it('should set reverse_check_mode to off for exploratory facets regardless of config', async () => {
      const llmResult = makeLLMResult({
        facets: [
          { name: 'Exploratory', description: 'Exploratory facet', role: 'exploratory', retrieval_terms: ['term'], success_criteria: 'criteria' },
        ],
      });
      const llm = makeMockLLM(llmResult);
      const d = new PromptDecomposer(retrieval, llm, {
        defaultReverseCheckMode: 'block',
      });

      const spec = await d.decompose('test');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      const exploratoryFacet = allFacets.find(f => f.facet_role === 'exploratory');
      expect(exploratoryFacet).toBeDefined();
      expect(exploratoryFacet!.reverse_check_mode).toBe('off');
    });

    it('should use analytics as default atoms_mode when not configured', async () => {
      const spec = await decomposer.decompose('Discuss phantasia');

      const allFacets = [...spec.required_facets, ...spec.optional_facets];
      for (const facet of allFacets) {
        expect(facet.atoms_mode).toBe('analytics');
      }
    });
  });

  // =========================================================================
  // Retrieval validation calls
  // =========================================================================
  describe('retrieval validation calls', () => {
    it('should call retrieveContext once per facet', async () => {
      const llmResult = makeLLMResult({
        facets: [
          { name: 'F1', description: 'D1', role: 'core', retrieval_terms: ['alpha'], success_criteria: 'C1' },
          { name: 'F2', description: 'D2', role: 'supporting', retrieval_terms: ['beta'], success_criteria: 'C2' },
          { name: 'F3', description: 'D3', role: 'exploratory', retrieval_terms: ['gamma'], success_criteria: 'C3' },
        ],
      });
      const llm = makeMockLLM(llmResult);
      const mockRetrieval = makeMockRetrieval([makeChunk()]);
      const d = new PromptDecomposer(mockRetrieval, llm);

      await d.decompose('test');

      expect((mockRetrieval.retrieveContext as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(3);
    });

    it('should pass retrieval terms joined as query', async () => {
      const llmResult = makeLLMResult({
        facets: [
          { name: 'F1', description: 'D1', role: 'core', retrieval_terms: ['phantasia', 'imagination', 'soul'], success_criteria: 'C1' },
        ],
      });
      const llm = makeMockLLM(llmResult);
      const mockRetrieval = makeMockRetrieval([makeChunk()]);
      const d = new PromptDecomposer(mockRetrieval, llm);

      await d.decompose('test');

      expect((mockRetrieval.retrieveContext as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        'phantasia imagination soul',
        { maxChunks: 3, minRelevance: 0.5 },
      );
    });
  });
});
