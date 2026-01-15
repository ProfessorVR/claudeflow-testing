/**
 * OpenAI Provider Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - OpenAI Provider
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  OpenAIProvider,
  createOpenAIProvider,
  createAllOpenAIProviders,
  listOpenAIModels,
  getBestReasoningModel,
  getBestCodeModel,
  getCostEffectiveModel,
  OPENAI_MODELS,
  type OpenAIModelKey,
} from '../../../../../src/god-agent/core/router/providers/openai-provider.js';

// Use a test API key for provider instantiation tests
const TEST_API_KEY = 'sk-test-key-for-unit-tests';
const testConfig = { apiKey: TEST_API_KEY };

describe('OpenAIProvider', () => {
  describe('Model Definitions', () => {
    it('should define gpt-5.2', () => {
      expect(OPENAI_MODELS['gpt-5.2']).toBeDefined();
      expect(OPENAI_MODELS['gpt-5.2'].id).toBe('gpt-5.2-2025-01');
      expect(OPENAI_MODELS['gpt-5.2'].displayName).toBe('GPT-5.2');
      expect(OPENAI_MODELS['gpt-5.2'].maxComplexity).toBe('complex');
      expect(OPENAI_MODELS['gpt-5.2'].contextWindow).toBe(256000);
    });

    it('should define gpt-5', () => {
      expect(OPENAI_MODELS['gpt-5']).toBeDefined();
      expect(OPENAI_MODELS['gpt-5'].id).toBe('gpt-5-2024-12');
      expect(OPENAI_MODELS['gpt-5'].maxComplexity).toBe('complex');
    });

    it('should define gpt-4o', () => {
      expect(OPENAI_MODELS['gpt-4o']).toBeDefined();
      expect(OPENAI_MODELS['gpt-4o'].id).toBe('gpt-4o-2024-11-20');
      expect(OPENAI_MODELS['gpt-4o'].maxComplexity).toBe('medium');
    });

    it('should define gpt-4o-mini', () => {
      expect(OPENAI_MODELS['gpt-4o-mini']).toBeDefined();
      expect(OPENAI_MODELS['gpt-4o-mini'].id).toBe('gpt-4o-mini-2024-07-18');
      expect(OPENAI_MODELS['gpt-4o-mini'].maxComplexity).toBe('simple');
    });

    it('should define o3', () => {
      expect(OPENAI_MODELS['o3']).toBeDefined();
      expect(OPENAI_MODELS['o3'].id).toBe('o3-2025-01');
      expect(OPENAI_MODELS['o3'].maxComplexity).toBe('complex');
      expect(OPENAI_MODELS['o3'].supportsSystemPrompt).toBe(false);
      expect(OPENAI_MODELS['o3'].isReasoningModel).toBe(true);
    });

    it('should define o1', () => {
      expect(OPENAI_MODELS['o1']).toBeDefined();
      expect(OPENAI_MODELS['o1'].id).toBe('o1-2024-12-17');
      expect(OPENAI_MODELS['o1'].isReasoningModel).toBe(true);
    });

    it('should define o1-mini', () => {
      expect(OPENAI_MODELS['o1-mini']).toBeDefined();
      expect(OPENAI_MODELS['o1-mini'].id).toBe('o1-mini-2024-09-12');
      expect(OPENAI_MODELS['o1-mini'].isReasoningModel).toBe(true);
    });

    it('should have capabilities for all models', () => {
      for (const [key, config] of Object.entries(OPENAI_MODELS)) {
        expect(config.capabilities.length).toBeGreaterThan(0);
      }
    });

    it('should have cost information for all models', () => {
      for (const [key, config] of Object.entries(OPENAI_MODELS)) {
        expect(config.inputCostPer1M).toBeGreaterThanOrEqual(0);
        expect(config.outputCostPer1M).toBeGreaterThanOrEqual(0);
      }
    });

    it('should mark reasoning models correctly', () => {
      const reasoningModels = ['o3', 'o1', 'o1-mini'];
      const nonReasoningModels = ['gpt-5.2', 'gpt-5', 'gpt-4o', 'gpt-4o-mini'];

      for (const key of reasoningModels) {
        const config = OPENAI_MODELS[key as OpenAIModelKey];
        expect(config.isReasoningModel).toBe(true);
        expect(config.supportsSystemPrompt).toBe(false);
      }

      for (const key of nonReasoningModels) {
        const config = OPENAI_MODELS[key as OpenAIModelKey];
        expect(config.supportsSystemPrompt).toBe(true);
      }
    });
  });

  describe('Provider Construction', () => {
    it('should create provider with default model (gpt-4o)', () => {
      const provider = new OpenAIProvider(testConfig);
      expect(provider.id).toBe('gpt-4o');
      expect(provider.provider).toBe('openai');
    });

    it('should create provider with specified model', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-5.2' });
      expect(provider.id).toBe('gpt-5.2');
      expect(provider.model).toBe('gpt-5.2-2025-01');
    });

    it('should create provider for o3', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'o3' });
      expect(provider.id).toBe('o3');
      expect(provider.model).toBe('o3-2025-01');
      expect(provider.isReasoningModelType()).toBe(true);
    });

    it('should allow custom model ID override', () => {
      const provider = new OpenAIProvider({
        ...testConfig,
        modelKey: 'gpt-4o',
        modelId: 'custom-gpt-4o',
      });
      expect(provider.model).toBe('custom-gpt-4o');
    });

    it('should inherit capabilities from model config', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-5.2' });
      expect(provider.capabilities).toContain('code');
      expect(provider.capabilities).toContain('reasoning');
      expect(provider.capabilities).toContain('writing');
    });

    it('should inherit max complexity from model config', () => {
      const gpt5Provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-5.2' });
      expect(gpt5Provider.maxComplexity).toBe('complex');

      const miniProvider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-4o-mini' });
      expect(miniProvider.maxComplexity).toBe('simple');
    });
  });

  describe('Reasoning Model Detection', () => {
    it('should detect o3 as reasoning model', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'o3' });
      expect(provider.isReasoningModelType()).toBe(true);
    });

    it('should detect o1 as reasoning model', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'o1' });
      expect(provider.isReasoningModelType()).toBe(true);
    });

    it('should detect gpt-4o as non-reasoning model', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-4o' });
      expect(provider.isReasoningModelType()).toBe(false);
    });

    it('should detect gpt-5.2 as non-reasoning model', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-5.2' });
      expect(provider.isReasoningModelType()).toBe(false);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost for gpt-4o', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-4o' });

      const cost = provider.getCost(1000, 500);

      // GPT-4o: $2.5/1M input, $10/1M output
      expect(cost.inputCost).toBeCloseTo(0.0025, 5);
      expect(cost.outputCost).toBeCloseTo(0.005, 5);
    });

    it('should calculate cost for gpt-4o-mini (cheapest)', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-4o-mini' });

      const cost = provider.getCost(1000000, 500000);

      // Mini: $0.15/1M input, $0.6/1M output
      expect(cost.inputCost).toBeCloseTo(0.15, 2);
      expect(cost.outputCost).toBeCloseTo(0.3, 2);
    });

    it('should calculate cost for o3 (expensive)', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'o3' });

      const cost = provider.getCost(1000, 1000);

      // o3: $20/1M input, $80/1M output
      expect(cost.inputCost).toBeCloseTo(0.02, 4);
      expect(cost.outputCost).toBeCloseTo(0.08, 4);
    });
  });

  describe('Display Information', () => {
    it('should return display name', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-5.2' });
      expect(provider.getDisplayName()).toBe('GPT-5.2');
    });

    it('should return context window', () => {
      const provider = new OpenAIProvider({ ...testConfig, modelKey: 'gpt-5.2' });
      expect(provider.getContextWindow()).toBe(256000);
    });
  });
});

describe('Factory Functions', () => {
  describe('createOpenAIProvider', () => {
    it('should create provider with default model', () => {
      const provider = createOpenAIProvider('gpt-4o', testConfig);
      expect(provider.id).toBe('gpt-4o');
    });

    it('should create provider with specified model', () => {
      const provider = createOpenAIProvider('gpt-5.2', testConfig);
      expect(provider.id).toBe('gpt-5.2');
    });

    it('should pass through configuration', () => {
      const provider = createOpenAIProvider('gpt-4o', {
        ...testConfig,
        timeout: 30000,
      });
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe('createAllOpenAIProviders', () => {
    it('should create providers for all models', () => {
      const providers = createAllOpenAIProviders(testConfig);

      expect(providers.size).toBe(Object.keys(OPENAI_MODELS).length);
      expect(providers.has('gpt-5.2')).toBe(true);
      expect(providers.has('gpt-5')).toBe(true);
      expect(providers.has('gpt-4o')).toBe(true);
      expect(providers.has('o3')).toBe(true);
      expect(providers.has('o1')).toBe(true);
    });
  });

  describe('listOpenAIModels', () => {
    it('should list all available models', () => {
      const models = listOpenAIModels();

      expect(models.length).toBe(Object.keys(OPENAI_MODELS).length);

      const gpt5 = models.find(m => m.key === 'gpt-5.2');
      expect(gpt5).toBeDefined();
      expect(gpt5?.displayName).toBe('GPT-5.2');
      expect(gpt5?.isReasoningModel).toBe(false);

      const o3 = models.find(m => m.key === 'o3');
      expect(o3).toBeDefined();
      expect(o3?.isReasoningModel).toBe(true);
    });
  });

  describe('getBestReasoningModel', () => {
    it('should return o3 as best reasoning model', () => {
      expect(getBestReasoningModel()).toBe('o3');
    });
  });

  describe('getBestCodeModel', () => {
    it('should return gpt-5.2 as best code model', () => {
      expect(getBestCodeModel()).toBe('gpt-5.2');
    });
  });

  describe('getCostEffectiveModel', () => {
    it('should return gpt-4o-mini as most cost effective', () => {
      expect(getCostEffectiveModel()).toBe('gpt-4o-mini');
    });
  });
});

describe('Provider Interface', () => {
  it('should implement ILLMProvider interface', () => {
    const provider = new OpenAIProvider(testConfig);

    expect(provider.id).toBeDefined();
    expect(provider.provider).toBe('openai');
    expect(provider.model).toBeDefined();
    expect(provider.capabilities).toBeInstanceOf(Array);
    expect(provider.maxComplexity).toBeDefined();
    expect(typeof provider.complete).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.getCost).toBe('function');
  });
});
