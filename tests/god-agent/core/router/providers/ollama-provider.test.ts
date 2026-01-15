/**
 * Ollama Provider Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Ollama Provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  OllamaProvider,
  createOllamaProvider,
  createAllOllamaProviders,
  listOllamaModels,
  getBestLocalCodeModel,
  getEfficientLocalModel,
  OLLAMA_MODELS,
  type OllamaModelKey,
} from '../../../../../src/god-agent/core/router/providers/ollama-provider.js';

describe('OllamaProvider', () => {
  describe('Model Definitions', () => {
    it('should define deepseek-coder-v2', () => {
      expect(OLLAMA_MODELS['deepseek-coder-v2']).toBeDefined();
      expect(OLLAMA_MODELS['deepseek-coder-v2'].id).toBe('deepseek-coder-v2:33b');
      expect(OLLAMA_MODELS['deepseek-coder-v2'].displayName).toBe('DeepSeek Coder V2 33B');
      expect(OLLAMA_MODELS['deepseek-coder-v2'].maxComplexity).toBe('medium');
    });

    it('should define deepseek-v3', () => {
      expect(OLLAMA_MODELS['deepseek-v3']).toBeDefined();
      expect(OLLAMA_MODELS['deepseek-v3'].id).toBe('deepseek-v3:latest');
      expect(OLLAMA_MODELS['deepseek-v3'].maxComplexity).toBe('complex');
    });

    it('should define qwen2.5-coder', () => {
      expect(OLLAMA_MODELS['qwen2.5-coder']).toBeDefined();
      expect(OLLAMA_MODELS['qwen2.5-coder'].id).toBe('qwen2.5-coder:32b');
      expect(OLLAMA_MODELS['qwen2.5-coder'].capabilities).toContain('code');
      expect(OLLAMA_MODELS['qwen2.5-coder'].capabilities).toContain('test');
    });

    it('should define qwen2.5', () => {
      expect(OLLAMA_MODELS['qwen2.5']).toBeDefined();
      expect(OLLAMA_MODELS['qwen2.5'].id).toBe('qwen2.5:72b');
      expect(OLLAMA_MODELS['qwen2.5'].maxComplexity).toBe('complex');
    });

    it('should define codellama', () => {
      expect(OLLAMA_MODELS['codellama']).toBeDefined();
      expect(OLLAMA_MODELS['codellama'].id).toBe('codellama:34b');
      expect(OLLAMA_MODELS['codellama'].maxComplexity).toBe('simple');
    });

    it('should define llama3.3', () => {
      expect(OLLAMA_MODELS['llama3.3']).toBeDefined();
      expect(OLLAMA_MODELS['llama3.3'].id).toBe('llama3.3:70b');
      expect(OLLAMA_MODELS['llama3.3'].maxComplexity).toBe('complex');
    });

    it('should define llama3.2', () => {
      expect(OLLAMA_MODELS['llama3.2']).toBeDefined();
      expect(OLLAMA_MODELS['llama3.2'].id).toBe('llama3.2:3b');
      expect(OLLAMA_MODELS['llama3.2'].maxComplexity).toBe('simple');
    });

    it('should define mistral', () => {
      expect(OLLAMA_MODELS['mistral']).toBeDefined();
      expect(OLLAMA_MODELS['mistral'].id).toBe('mistral:7b');
    });

    it('should define mixtral', () => {
      expect(OLLAMA_MODELS['mixtral']).toBeDefined();
      expect(OLLAMA_MODELS['mixtral'].id).toBe('mixtral:8x7b');
      expect(OLLAMA_MODELS['mixtral'].maxComplexity).toBe('medium');
    });

    it('should have zero cost for all models', () => {
      for (const [key, config] of Object.entries(OLLAMA_MODELS)) {
        expect(config.inputCostPer1M).toBe(0);
        expect(config.outputCostPer1M).toBe(0);
      }
    });

    it('should have capabilities for all models', () => {
      for (const [key, config] of Object.entries(OLLAMA_MODELS)) {
        expect(config.capabilities.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Provider Construction', () => {
    it('should create provider with default model', () => {
      const provider = new OllamaProvider();
      expect(provider.id).toBe('deepseek-coder-v2');
      expect(provider.provider).toBe('ollama');
    });

    it('should create provider with specified model', () => {
      const provider = new OllamaProvider({ modelKey: 'deepseek-v3' });
      expect(provider.id).toBe('deepseek-v3');
      expect(provider.model).toBe('deepseek-v3:latest');
    });

    it('should use default base URL', () => {
      const provider = new OllamaProvider();
      expect(provider.getBaseUrl()).toBe('http://localhost:11434');
    });

    it('should allow custom base URL', () => {
      const provider = new OllamaProvider({
        baseUrl: 'http://192.168.1.100:11434',
      });
      expect(provider.getBaseUrl()).toBe('http://192.168.1.100:11434');
    });

    it('should allow custom model ID override', () => {
      const provider = new OllamaProvider({
        modelKey: 'deepseek-coder-v2',
        modelId: 'deepseek-coder-v2:latest',
      });
      expect(provider.model).toBe('deepseek-coder-v2:latest');
    });

    it('should inherit capabilities from model config', () => {
      const provider = new OllamaProvider({ modelKey: 'deepseek-v3' });
      expect(provider.capabilities).toContain('code');
      expect(provider.capabilities).toContain('reasoning');
      expect(provider.capabilities).toContain('writing');
    });

    it('should have longer default timeout for local models', () => {
      const provider = new OllamaProvider();
      // Local models can be slower, so longer timeout
      expect((provider as any).timeout).toBeGreaterThanOrEqual(120000);
    });
  });

  describe('Cost Calculation', () => {
    it('should return zero cost for all operations', () => {
      const provider = new OllamaProvider();

      const cost = provider.getCost(1000000, 500000);

      expect(cost.inputCost).toBe(0);
      expect(cost.outputCost).toBe(0);
      expect(cost.totalCost).toBe(0);
    });

    it('should return zero for all models', () => {
      for (const modelKey of Object.keys(OLLAMA_MODELS) as OllamaModelKey[]) {
        const provider = new OllamaProvider({ modelKey });
        const cost = provider.getCost(1000000, 1000000);
        expect(cost.totalCost).toBe(0);
      }
    });
  });

  describe('Display Information', () => {
    it('should return display name', () => {
      const provider = new OllamaProvider({ modelKey: 'deepseek-v3' });
      expect(provider.getDisplayName()).toBe('DeepSeek V3');
    });

    it('should return context window', () => {
      const provider = new OllamaProvider({ modelKey: 'qwen2.5' });
      expect(provider.getContextWindow()).toBe(131072);
    });
  });
});

describe('Factory Functions', () => {
  describe('createOllamaProvider', () => {
    it('should create provider with default model', () => {
      const provider = createOllamaProvider();
      expect(provider.id).toBe('deepseek-coder-v2');
    });

    it('should create provider with specified model', () => {
      const provider = createOllamaProvider('llama3.3');
      expect(provider.id).toBe('llama3.3');
    });

    it('should pass through configuration', () => {
      const provider = createOllamaProvider('deepseek-v3', {
        baseUrl: 'http://custom:11434',
        timeout: 180000,
      });
      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.getBaseUrl()).toBe('http://custom:11434');
    });
  });

  describe('createAllOllamaProviders', () => {
    it('should create providers for all models', () => {
      const providers = createAllOllamaProviders();

      expect(providers.size).toBe(Object.keys(OLLAMA_MODELS).length);
      expect(providers.has('deepseek-coder-v2')).toBe(true);
      expect(providers.has('deepseek-v3')).toBe(true);
      expect(providers.has('qwen2.5-coder')).toBe(true);
      expect(providers.has('llama3.3')).toBe(true);
      expect(providers.has('mistral')).toBe(true);
    });

    it('should use same base URL for all providers', () => {
      const providers = createAllOllamaProviders({
        baseUrl: 'http://shared-ollama:11434',
      });

      for (const [id, provider] of providers) {
        expect(provider.getBaseUrl()).toBe('http://shared-ollama:11434');
      }
    });
  });

  describe('listOllamaModels', () => {
    it('should list all available models', () => {
      const models = listOllamaModels();

      expect(models.length).toBe(Object.keys(OLLAMA_MODELS).length);

      const deepseek = models.find(m => m.key === 'deepseek-v3');
      expect(deepseek).toBeDefined();
      expect(deepseek?.displayName).toBe('DeepSeek V3');
      expect(deepseek?.maxComplexity).toBe('complex');
    });

    it('should include model IDs', () => {
      const models = listOllamaModels();

      for (const model of models) {
        expect(model.id).toBeDefined();
        expect(model.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getBestLocalCodeModel', () => {
    it('should return deepseek-v3 as best local code model', () => {
      expect(getBestLocalCodeModel()).toBe('deepseek-v3');
    });
  });

  describe('getEfficientLocalModel', () => {
    it('should return llama3.2 as most efficient model', () => {
      expect(getEfficientLocalModel()).toBe('llama3.2');
    });
  });
});

describe('Provider Interface', () => {
  it('should implement ILLMProvider interface', () => {
    const provider = new OllamaProvider();

    expect(provider.id).toBeDefined();
    expect(provider.provider).toBe('ollama');
    expect(provider.model).toBeDefined();
    expect(provider.capabilities).toBeInstanceOf(Array);
    expect(provider.maxComplexity).toBeDefined();
    expect(typeof provider.complete).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.getCost).toBe('function');
  });

  it('should have additional Ollama-specific methods', () => {
    const provider = new OllamaProvider();

    expect(typeof provider.getBaseUrl).toBe('function');
    expect(typeof provider.listAvailableModels).toBe('function');
    expect(typeof provider.isOllamaRunning).toBe('function');
    expect(typeof provider.pullModel).toBe('function');
  });
});

describe('Model Complexity Coverage', () => {
  it('should have models for all complexity levels', () => {
    const byComplexity: Record<string, string[]> = {
      simple: [],
      medium: [],
      complex: [],
    };

    for (const [key, config] of Object.entries(OLLAMA_MODELS)) {
      byComplexity[config.maxComplexity].push(key);
    }

    expect(byComplexity.simple.length).toBeGreaterThan(0);
    expect(byComplexity.medium.length).toBeGreaterThan(0);
    expect(byComplexity.complex.length).toBeGreaterThan(0);
  });

  it('should have code capability models at each complexity', () => {
    const codeModels = Object.entries(OLLAMA_MODELS)
      .filter(([, config]) => config.capabilities.includes('code'))
      .map(([key, config]) => ({ key, complexity: config.maxComplexity }));

    const complexities = new Set(codeModels.map(m => m.complexity));
    expect(complexities.has('simple')).toBe(true);
    expect(complexities.has('medium')).toBe(true);
    expect(complexities.has('complex')).toBe(true);
  });
});
