/**
 * vLLM Provider Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - vLLM Provider (Phase 5)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VLLMProvider,
  createVLLMProvider,
  createAllVLLMProviders,
  listVLLMModels,
  getBestLocalCodeModel,
  isVLLMEnvConfigured,
  VLLM_MODELS,
  type VLLMModelKey,
} from '../../../../../src/god-agent/core/router/providers/vllm-provider.js';

describe('VLLMProvider', () => {
  describe('Model Definitions', () => {
    it('should define qwen2.5-coder-32b', () => {
      expect(VLLM_MODELS['qwen2.5-coder-32b']).toBeDefined();
      expect(VLLM_MODELS['qwen2.5-coder-32b'].id).toBe('Qwen/Qwen2.5-Coder-32B-Instruct');
      expect(VLLM_MODELS['qwen2.5-coder-32b'].displayName).toBe('Qwen 2.5 Coder 32B');
      expect(VLLM_MODELS['qwen2.5-coder-32b'].maxComplexity).toBe('medium');
    });

    it('should define deepseek-coder-v2', () => {
      expect(VLLM_MODELS['deepseek-coder-v2']).toBeDefined();
      expect(VLLM_MODELS['deepseek-coder-v2'].id).toBe('deepseek-ai/DeepSeek-Coder-V2-Instruct');
      expect(VLLM_MODELS['deepseek-coder-v2'].displayName).toBe('DeepSeek Coder V2');
      expect(VLLM_MODELS['deepseek-coder-v2'].maxComplexity).toBe('medium');
    });

    it('should define deepseek-v3', () => {
      expect(VLLM_MODELS['deepseek-v3']).toBeDefined();
      expect(VLLM_MODELS['deepseek-v3'].id).toBe('deepseek-ai/DeepSeek-V3');
      expect(VLLM_MODELS['deepseek-v3'].maxComplexity).toBe('complex');
      expect(VLLM_MODELS['deepseek-v3'].capabilities).toContain('reasoning');
    });

    it('should define codestral-22b', () => {
      expect(VLLM_MODELS['codestral-22b']).toBeDefined();
      expect(VLLM_MODELS['codestral-22b'].id).toBe('mistralai/Codestral-22B-v0.1');
      expect(VLLM_MODELS['codestral-22b'].displayName).toBe('Codestral 22B');
    });

    it('should have zero cost for all models (local inference)', () => {
      for (const [key, config] of Object.entries(VLLM_MODELS)) {
        expect(config.inputCostPer1M).toBe(0);
        expect(config.outputCostPer1M).toBe(0);
      }
    });

    it('should have capabilities for all models', () => {
      for (const [key, config] of Object.entries(VLLM_MODELS)) {
        expect(config.capabilities.length).toBeGreaterThan(0);
        expect(config.capabilities).toContain('code');
      }
    });

    it('should have context windows for all models', () => {
      for (const [key, config] of Object.entries(VLLM_MODELS)) {
        expect(config.contextWindow).toBeGreaterThan(0);
        expect(config.contextWindow).toBeGreaterThanOrEqual(32768);
      }
    });

    it('should have max tokens for all models', () => {
      for (const [key, config] of Object.entries(VLLM_MODELS)) {
        expect(config.maxTokens).toBeGreaterThan(0);
        expect(config.maxTokens).toBeGreaterThanOrEqual(16384);
      }
    });
  });

  describe('Provider Construction', () => {
    it('should create provider with default model (qwen2.5-coder-32b)', () => {
      const provider = new VLLMProvider();
      expect(provider.id).toBe('qwen2.5-coder-32b');
      expect(provider.provider).toBe('vllm');
    });

    it('should create provider with specified model', () => {
      const provider = new VLLMProvider({ modelKey: 'deepseek-v3' });
      expect(provider.id).toBe('deepseek-v3');
      expect(provider.model).toBe('deepseek-ai/DeepSeek-V3');
    });

    it('should use default base URL (localhost:8000)', () => {
      const provider = new VLLMProvider();
      expect(provider.getBaseUrl()).toBe('http://localhost:8000');
    });

    it('should allow custom base URL', () => {
      const provider = new VLLMProvider({
        baseUrl: 'http://192.168.1.100:8000',
      });
      expect(provider.getBaseUrl()).toBe('http://192.168.1.100:8000');
    });

    it('should allow custom model ID override', () => {
      const provider = new VLLMProvider({
        modelKey: 'qwen2.5-coder-32b',
        modelId: 'custom-qwen-model',
      });
      expect(provider.model).toBe('custom-qwen-model');
    });

    it('should inherit capabilities from model config', () => {
      const provider = new VLLMProvider({ modelKey: 'deepseek-v3' });
      expect(provider.capabilities).toContain('code');
      expect(provider.capabilities).toContain('reasoning');
      expect(provider.capabilities).toContain('writing');
    });

    it('should have longer default timeout for local models', () => {
      const provider = new VLLMProvider();
      // Local models can be slower, so longer timeout (120s)
      expect((provider as any).timeout).toBeGreaterThanOrEqual(120000);
    });

    it('should allow custom timeout', () => {
      const provider = new VLLMProvider({ timeout: 180000 });
      expect((provider as any).timeout).toBe(180000);
    });
  });

  describe('Cost Calculation', () => {
    it('should return zero cost for all operations', () => {
      const provider = new VLLMProvider();

      const cost = provider.getCost(1000000, 500000);

      expect(cost.inputCost).toBe(0);
      expect(cost.outputCost).toBe(0);
      expect(cost.totalCost).toBe(0);
    });

    it('should return zero for all models', () => {
      for (const modelKey of Object.keys(VLLM_MODELS) as VLLMModelKey[]) {
        const provider = new VLLMProvider({ modelKey });
        const cost = provider.getCost(1000000, 1000000);
        expect(cost.totalCost).toBe(0);
      }
    });
  });

  describe('Display Information', () => {
    it('should return display name', () => {
      const provider = new VLLMProvider({ modelKey: 'deepseek-v3' });
      expect(provider.getDisplayName()).toBe('DeepSeek V3');
    });

    it('should return display name for default model', () => {
      const provider = new VLLMProvider();
      expect(provider.getDisplayName()).toBe('Qwen 2.5 Coder 32B');
    });

    it('should return context window', () => {
      const provider = new VLLMProvider({ modelKey: 'qwen2.5-coder-32b' });
      expect(provider.getContextWindow()).toBe(131072);
    });

    it('should return context window for deepseek-v3', () => {
      const provider = new VLLMProvider({ modelKey: 'deepseek-v3' });
      expect(provider.getContextWindow()).toBe(128000);
    });
  });
});

describe('Factory Functions', () => {
  describe('createVLLMProvider', () => {
    it('should create provider with default model', () => {
      const provider = createVLLMProvider();
      expect(provider.id).toBe('qwen2.5-coder-32b');
    });

    it('should create provider with specified model', () => {
      const provider = createVLLMProvider('deepseek-v3');
      expect(provider.id).toBe('deepseek-v3');
    });

    it('should pass through configuration', () => {
      const provider = createVLLMProvider('deepseek-coder-v2', {
        baseUrl: 'http://custom:8000',
        timeout: 180000,
      });
      expect(provider).toBeInstanceOf(VLLMProvider);
      expect(provider.getBaseUrl()).toBe('http://custom:8000');
    });
  });

  describe('createAllVLLMProviders', () => {
    it('should create providers for all models', () => {
      const providers = createAllVLLMProviders();

      expect(providers.size).toBe(Object.keys(VLLM_MODELS).length);
      expect(providers.has('qwen2.5-coder-32b')).toBe(true);
      expect(providers.has('deepseek-coder-v2')).toBe(true);
      expect(providers.has('deepseek-v3')).toBe(true);
      expect(providers.has('codestral-22b')).toBe(true);
    });

    it('should use same base URL for all providers', () => {
      const providers = createAllVLLMProviders({
        baseUrl: 'http://shared-vllm:8000',
      });

      for (const [id, provider] of providers) {
        expect(provider.getBaseUrl()).toBe('http://shared-vllm:8000');
      }
    });
  });

  describe('listVLLMModels', () => {
    it('should list all available models', () => {
      const models = listVLLMModels();

      expect(models.length).toBe(Object.keys(VLLM_MODELS).length);

      const qwen = models.find(m => m.key === 'qwen2.5-coder-32b');
      expect(qwen).toBeDefined();
      expect(qwen?.displayName).toBe('Qwen 2.5 Coder 32B');
      expect(qwen?.maxComplexity).toBe('medium');
    });

    it('should include model IDs', () => {
      const models = listVLLMModels();

      for (const model of models) {
        expect(model.id).toBeDefined();
        expect(model.id.length).toBeGreaterThan(0);
      }
    });

    it('should include HuggingFace-style model IDs', () => {
      const models = listVLLMModels();

      const qwen = models.find(m => m.key === 'qwen2.5-coder-32b');
      expect(qwen?.id).toContain('Qwen/');

      const deepseek = models.find(m => m.key === 'deepseek-v3');
      expect(deepseek?.id).toContain('deepseek-ai/');
    });
  });

  describe('getBestLocalCodeModel', () => {
    it('should return qwen2.5-coder-32b as best local code model', () => {
      expect(getBestLocalCodeModel()).toBe('qwen2.5-coder-32b');
    });
  });

  describe('isVLLMEnvConfigured', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true when VLLM_BASE_URL is set', () => {
      process.env.VLLM_BASE_URL = 'http://localhost:8000';
      // Re-import to get fresh check
      expect(isVLLMEnvConfigured()).toBe(true);
    });

    it('should return true when VLLM_ENABLED is set', () => {
      process.env.VLLM_ENABLED = 'true';
      expect(isVLLMEnvConfigured()).toBe(true);
    });

    it('should return false when no vLLM env vars are set', () => {
      delete process.env.VLLM_BASE_URL;
      delete process.env.VLLM_ENABLED;
      expect(isVLLMEnvConfigured()).toBe(false);
    });
  });
});

describe('Provider Interface', () => {
  it('should implement ILLMProvider interface', () => {
    const provider = new VLLMProvider();

    expect(provider.id).toBeDefined();
    expect(provider.provider).toBe('vllm');
    expect(provider.model).toBeDefined();
    expect(provider.capabilities).toBeInstanceOf(Array);
    expect(provider.maxComplexity).toBeDefined();
    expect(typeof provider.complete).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.getCost).toBe('function');
  });

  it('should have additional vLLM-specific methods', () => {
    const provider = new VLLMProvider();

    expect(typeof provider.getBaseUrl).toBe('function');
    expect(typeof provider.getDisplayName).toBe('function');
    expect(typeof provider.getContextWindow).toBe('function');
    expect(typeof provider.isModelLoaded).toBe('function');
    expect(typeof provider.getLoadedModels).toBe('function');
    expect(typeof provider.getServerMetrics).toBe('function');
  });
});

describe('Model Complexity Coverage', () => {
  it('should have models for medium and complex levels', () => {
    const byComplexity: Record<string, string[]> = {
      simple: [],
      medium: [],
      complex: [],
    };

    for (const [key, config] of Object.entries(VLLM_MODELS)) {
      byComplexity[config.maxComplexity].push(key);
    }

    // vLLM models are generally more capable, so medium and complex
    expect(byComplexity.medium.length).toBeGreaterThan(0);
    expect(byComplexity.complex.length).toBeGreaterThan(0);
  });

  it('should have code capability for all models', () => {
    const codeModels = Object.entries(VLLM_MODELS)
      .filter(([, config]) => config.capabilities.includes('code'))
      .map(([key]) => key);

    expect(codeModels.length).toBe(Object.keys(VLLM_MODELS).length);
  });

  it('should have debugging capability for most models', () => {
    const debugModels = Object.entries(VLLM_MODELS)
      .filter(([, config]) => config.capabilities.includes('debug'))
      .map(([key]) => key);

    expect(debugModels.length).toBeGreaterThan(0);
  });

  it('should have refactor capability for all models', () => {
    const refactorModels = Object.entries(VLLM_MODELS)
      .filter(([, config]) => config.capabilities.includes('refactor'))
      .map(([key]) => key);

    expect(refactorModels.length).toBe(Object.keys(VLLM_MODELS).length);
  });
});

describe('Model Configuration Validation', () => {
  it('should have valid max tokens for all models', () => {
    for (const [key, config] of Object.entries(VLLM_MODELS)) {
      expect(config.maxTokens).toBeLessThanOrEqual(config.contextWindow);
    }
  });

  it('should have unique model IDs', () => {
    const ids = Object.values(VLLM_MODELS).map(config => config.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique display names', () => {
    const names = Object.values(VLLM_MODELS).map(config => config.displayName);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe('Provider Factory Integration', () => {
  it('should be creatable via factory for each model key', () => {
    for (const modelKey of Object.keys(VLLM_MODELS) as VLLMModelKey[]) {
      const provider = createVLLMProvider(modelKey);
      expect(provider.id).toBe(modelKey);
      expect(provider.provider).toBe('vllm');
    }
  });

  it('should have consistent provider type', () => {
    const providers = createAllVLLMProviders();
    for (const [, provider] of providers) {
      expect(provider.provider).toBe('vllm');
    }
  });
});
