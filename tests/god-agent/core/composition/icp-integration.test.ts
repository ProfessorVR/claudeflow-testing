/**
 * ICP Integration Tests — Verifies the full provider wiring
 *
 * Tests that ICPProviderFactory correctly assembles all dependencies,
 * and that the wired pipeline components interact correctly.
 */

import { describe, it, expect, vi } from 'vitest';
import { ICPProviderFactory, type ICPFactoryConfig } from '../../../../src/god-agent/core/composition/icp-provider-factory.js';
import { ModelRouter } from '../../../../src/god-agent/core/composition/model-router.js';
import { LLMDecompositionProviderImpl } from '../../../../src/god-agent/core/composition/llm-decomposition-provider.js';
import { LLMGenerationProviderImpl } from '../../../../src/god-agent/core/composition/llm-generation-provider.js';

// =============================================================================
// MOCK RETRIEVAL LAYER
// =============================================================================

function createMockRetrieval() {
  return {
    retrieveContext: vi.fn().mockResolvedValue([]),
    hybridSearch: vi.fn().mockResolvedValue([]),
    getCollections: vi.fn().mockResolvedValue([]),
  } as any;
}

// =============================================================================
// TESTS
// =============================================================================

describe('ICPProviderFactory', () => {
  describe('create()', () => {
    it('should create all providers from a shared ModelRouter', async () => {
      const retrieval = createMockRetrieval();

      const result = await ICPProviderFactory.create(retrieval, {
        anthropicApiKey: 'sk-ant-api03-test-key-that-is-at-least-50-characters-long-for-validation',
        vllmBaseUrl: 'http://localhost:8002/v1',
      });

      expect(result.deps).toBeDefined();
      expect(result.router).toBeInstanceOf(ModelRouter);
      expect(result.deps.retrieval).toBe(retrieval);
      expect(result.deps.llmDecomposer).toBeDefined();
      expect(result.deps.generationProvider).toBeDefined();
      expect(result.orchestratorConfig).toBeDefined();
    });

    it('should wire LLM decomposer as LLMDecompositionProviderImpl', async () => {
      const retrieval = createMockRetrieval();

      const result = await ICPProviderFactory.create(retrieval);

      expect(result.deps.llmDecomposer).toBeInstanceOf(LLMDecompositionProviderImpl);
    });

    it('should wire generation provider as LLMGenerationProviderImpl', async () => {
      const retrieval = createMockRetrieval();

      const result = await ICPProviderFactory.create(retrieval);

      expect(result.deps.generationProvider).toBeInstanceOf(LLMGenerationProviderImpl);
    });

    it('should pass style prompt provider through to deps', async () => {
      const retrieval = createMockRetrieval();
      const styleProvider = vi.fn().mockReturnValue('Use academic style.');

      const result = await ICPProviderFactory.create(retrieval, {
        stylePromptProvider: styleProvider,
        styleProfileId: 'test-profile',
      });

      expect(result.deps.stylePromptProvider).toBe(styleProvider);
      expect(result.orchestratorConfig.styleProfileId).toBe('test-profile');
    });

    it('should detect available backends', async () => {
      const retrieval = createMockRetrieval();

      const result = await ICPProviderFactory.create(retrieval, {
        anthropicApiKey: 'sk-ant-api03-test-key-that-is-at-least-50-characters-long-for-validation',
      });

      // At minimum, should include anthropic (key is valid length)
      expect(result.availableBackends).toContain('anthropic');
    });

    it('should configure OCR repair when vLLM is available', async () => {
      const retrieval = createMockRetrieval();

      // Force vLLM available by enabling OCR repair explicitly
      const result = await ICPProviderFactory.create(retrieval, {
        enableOCRRepair: true,
        ocrRepairThreshold: 0.3,
      });

      expect(result.orchestratorConfig.autoVerifierConfig).toBeDefined();
      expect(result.orchestratorConfig.autoVerifierConfig?.ocrRepairRouter).toBeDefined();
      expect(result.orchestratorConfig.autoVerifierConfig?.ocrRepairThreshold).toBe(0.3);
    });

    it('should not configure OCR repair when explicitly disabled', async () => {
      const retrieval = createMockRetrieval();

      const result = await ICPProviderFactory.create(retrieval, {
        enableOCRRepair: false,
      });

      expect(result.orchestratorConfig.autoVerifierConfig?.ocrRepairRouter).toBeUndefined();
    });

    it('should expose the shared router for direct use', async () => {
      const retrieval = createMockRetrieval();

      const result = await ICPProviderFactory.create(retrieval);

      // Router should be accessible for diagnostics/direct calls
      expect(result.router).toBeInstanceOf(ModelRouter);
      expect(typeof result.router.call).toBe('function');
      expect(typeof result.router.callJSON).toBe('function');
    });
  });

  describe('provider wiring correctness', () => {
    it('should share the same ModelRouter across all providers', async () => {
      const retrieval = createMockRetrieval();

      const result = await ICPProviderFactory.create(retrieval, {
        enableOCRRepair: true,
      });

      // All providers share the same router instance
      const decomposerRouter = (result.deps.llmDecomposer as any).router;
      const generationRouter = (result.deps.generationProvider as any).router;
      const repairRouter = result.orchestratorConfig.autoVerifierConfig?.ocrRepairRouter;

      expect(decomposerRouter).toBe(result.router);
      expect(generationRouter).toBe(result.router);
      expect(repairRouter).toBe(result.router);
    });
  });
});

describe('LLMDecompositionProviderImpl', () => {
  it('should call router.callJSON with decomposition system prompt', async () => {
    const mockRouter = {
      callJSON: vi.fn().mockResolvedValue({
        research_questions: ['Test question?'],
        facets: [{ name: 'Test Facet', description: 'desc', role: 'core', retrieval_terms: ['test'], success_criteria: 'found' }],
        retrieval_lexicon: { 'Test Facet': ['test'] },
      }),
    } as any;

    const provider = new LLMDecompositionProviderImpl(mockRouter);
    const result = await provider.decompose('What is the nature of time?');

    expect(mockRouter.callJSON).toHaveBeenCalledTimes(1);
    const call = mockRouter.callJSON.mock.calls[0];
    expect(call[0].costTier).toBe('high');
    expect(call[0].jsonMode).toBe(true);
    expect(result.facets).toHaveLength(1);
    expect(result.facets[0].name).toBe('Test Facet');
  });

  it('should support refinement with previous facets and feedback', async () => {
    const mockRouter = {
      callJSON: vi.fn().mockResolvedValue({
        research_questions: ['Refined question?'],
        facets: [
          { name: 'Refined Facet', description: 'refined', role: 'core', retrieval_terms: ['refined'], success_criteria: 'better' },
        ],
        retrieval_lexicon: {},
      }),
    } as any;

    const provider = new LLMDecompositionProviderImpl(mockRouter);
    const result = await provider.decompose('Original question', {
      previousFacets: [
        { name: 'Old Facet', description: 'old', role: 'core', retrieval_terms: ['old'], success_criteria: 'ok' },
      ],
      feedback: 'Too broad, focus on time specifically',
    });

    expect(result.facets[0].name).toBe('Refined Facet');
    const userPrompt = mockRouter.callJSON.mock.calls[0][0].userPrompt;
    expect(userPrompt).toContain('Old Facet');
    expect(userPrompt).toContain('Too broad');
  });
});

describe('LLMGenerationProviderImpl', () => {
  it('should use costTier=high for paragraph generation', async () => {
    const mockRouter = {
      call: vi.fn().mockResolvedValue({
        content: 'Generated paragraph text.',
        model: 'test',
        backend: 'anthropic',
        usage: { inputTokens: 100, outputTokens: 50 },
      }),
    } as any;

    const provider = new LLMGenerationProviderImpl(mockRouter);
    const result = await provider.generateParagraph('Write about time.', 'Academic style.');

    expect(result).toBe('Generated paragraph text.');
    expect(mockRouter.call).toHaveBeenCalledWith(
      expect.objectContaining({ costTier: 'high' }),
    );
  });

  it('should use costTier=high for paragraph plan generation', async () => {
    const mockRouter = {
      callJSON: vi.fn().mockResolvedValue([
        { paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'], required_quotes: [] },
      ]),
    } as any;

    const provider = new LLMGenerationProviderImpl(mockRouter);
    const result = await provider.generateParagraphPlan(
      [{ atom_id: 'a1', atom_version_id: 1, display_text: 'Test', semantic_text: 'test', modality: 'asserted', kind: 'corpus_claim', parent_claim_id: 'c1', evidence_mode: 'DIRECT_QUOTE', bound_quote_ids: [], facet_id: 'f1' }],
      [],
    );

    expect(result).toHaveLength(1);
    expect(mockRouter.callJSON.mock.calls[0][0].costTier).toBe('high');
  });

  it('should use costTier=high for sentence mapping', async () => {
    const mockRouter = {
      callJSON: vi.fn().mockResolvedValue([
        { sentence_id: 's1', text: 'The sentence.', supports_atoms: ['a1'] },
      ]),
    } as any;

    const provider = new LLMGenerationProviderImpl(mockRouter);
    const result = await provider.generateSentenceMapping('The sentence.', ['a1']);

    expect(result).toHaveLength(1);
    expect(result[0].supports_atoms).toContain('a1');
    expect(mockRouter.callJSON.mock.calls[0][0].costTier).toBe('high');
  });
});
