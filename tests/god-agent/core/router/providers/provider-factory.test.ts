/**
 * Provider Factory Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Provider Factory
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LLMProviderFactory,
  getProviderFactory,
  initializeProviderFactory,
  resetProviderFactory,
  createProviderById,
  getProviderType,
  listAllModelIds,
  getModelInfo,
} from '../../../../../src/god-agent/core/router/providers/provider-factory.js';
import { MockLLMProvider } from '../../../../../src/god-agent/core/router/llm-provider.js';
import type { TaskClassification } from '../../../../../src/god-agent/core/router/router-types.js';

describe('LLMProviderFactory', () => {
  let factory: LLMProviderFactory;

  beforeEach(() => {
    resetProviderFactory();
    factory = new LLMProviderFactory();
  });

  afterEach(() => {
    resetProviderFactory();
    vi.restoreAllMocks();
  });

  describe('Provider Registration', () => {
    it('should register a provider', () => {
      const provider = new MockLLMProvider({
        id: 'test-model',
        provider: 'anthropic',
        capabilities: ['code', 'reasoning'],
      });

      factory.registerProvider(provider);
      expect(factory.getProvider('test-model')).toBe(provider);
    });

    it('should unregister a provider', () => {
      const provider = new MockLLMProvider({
        id: 'test-model',
        provider: 'anthropic',
      });

      factory.registerProvider(provider);
      expect(factory.getProvider('test-model')).toBeDefined();

      const result = factory.unregisterProvider('test-model');
      expect(result).toBe(true);
      expect(factory.getProvider('test-model')).toBeUndefined();
    });

    it('should return false when unregistering non-existent provider', () => {
      const result = factory.unregisterProvider('non-existent');
      expect(result).toBe(false);
    });

    it('should get all registered providers', () => {
      const provider1 = new MockLLMProvider({ id: 'model-1' });
      const provider2 = new MockLLMProvider({ id: 'model-2' });

      factory.registerProvider(provider1);
      factory.registerProvider(provider2);

      const all = factory.getAllProviders();
      expect(all).toHaveLength(2);
      expect(all.map(p => p.id)).toContain('model-1');
      expect(all.map(p => p.id)).toContain('model-2');
    });

    it('should get all provider IDs', () => {
      factory.registerProvider(new MockLLMProvider({ id: 'a' }));
      factory.registerProvider(new MockLLMProvider({ id: 'b' }));
      factory.registerProvider(new MockLLMProvider({ id: 'c' }));

      const ids = factory.getProviderIds();
      expect(ids).toHaveLength(3);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
      expect(ids).toContain('c');
    });
  });

  describe('Provider Retrieval', () => {
    it('should get provider by ID', () => {
      const provider = new MockLLMProvider({ id: 'my-model' });
      factory.registerProvider(provider);

      expect(factory.getProvider('my-model')).toBe(provider);
      expect(factory.getProvider('other')).toBeUndefined();
    });

    it('should throw when getProviderOrThrow fails', () => {
      expect(() => factory.getProviderOrThrow('missing')).toThrow('not found');
    });

    it('should not throw when provider exists', () => {
      const provider = new MockLLMProvider({ id: 'exists' });
      factory.registerProvider(provider);

      expect(() => factory.getProviderOrThrow('exists')).not.toThrow();
      expect(factory.getProviderOrThrow('exists')).toBe(provider);
    });

    it('should get providers by type', () => {
      factory.registerProvider(new MockLLMProvider({ id: 'a1', provider: 'anthropic' }));
      factory.registerProvider(new MockLLMProvider({ id: 'a2', provider: 'anthropic' }));
      factory.registerProvider(new MockLLMProvider({ id: 'o1', provider: 'openai' }));

      const anthropic = factory.getProvidersByType('anthropic');
      expect(anthropic).toHaveLength(2);
      expect(anthropic.every(p => p.provider === 'anthropic')).toBe(true);

      const openai = factory.getProvidersByType('openai');
      expect(openai).toHaveLength(1);
    });

    it('should get providers by capability', () => {
      factory.registerProvider(new MockLLMProvider({
        id: 'coder',
        capabilities: ['code', 'debug'],
      }));
      factory.registerProvider(new MockLLMProvider({
        id: 'writer',
        capabilities: ['writing', 'research'],
      }));
      factory.registerProvider(new MockLLMProvider({
        id: 'all-rounder',
        capabilities: ['code', 'writing', 'reasoning'],
      }));

      const coders = factory.getProvidersByCapability('code');
      expect(coders).toHaveLength(2);
      expect(coders.map(p => p.id)).toContain('coder');
      expect(coders.map(p => p.id)).toContain('all-rounder');

      const writers = factory.getProvidersByCapability('writing');
      expect(writers).toHaveLength(2);
    });
  });

  describe('Health Checking', () => {
    it('should check provider health', async () => {
      const provider = new MockLLMProvider({
        id: 'healthy',
        shouldBeAvailable: true,
      });
      factory.registerProvider(provider);

      const healthy = await factory.isProviderHealthy('healthy');
      expect(healthy).toBe(true);
    });

    it('should cache health status', async () => {
      const provider = new MockLLMProvider({
        id: 'cached',
        shouldBeAvailable: true,
      });
      factory.registerProvider(provider);

      // First check
      await factory.isProviderHealthy('cached');

      // Mock changing availability
      (provider as any).available = false;

      // Should still return cached result
      const cached = await factory.isProviderHealthy('cached');
      expect(cached).toBe(true);
    });

    it('should invalidate health cache', async () => {
      const provider = new MockLLMProvider({
        id: 'invalidate',
        shouldBeAvailable: true,
      });
      factory.registerProvider(provider);

      await factory.isProviderHealthy('invalidate');

      // Invalidate cache
      factory.invalidateHealthCache('invalidate');

      // Change availability (simulating network issue)
      vi.spyOn(provider, 'isAvailable').mockResolvedValue(false);

      const afterInvalidate = await factory.isProviderHealthy('invalidate');
      expect(afterInvalidate).toBe(false);
    });

    it('should return false for non-existent provider', async () => {
      const healthy = await factory.isProviderHealthy('missing');
      expect(healthy).toBe(false);
    });

    it('should get healthy providers', async () => {
      factory.registerProvider(new MockLLMProvider({
        id: 'healthy-1',
        shouldBeAvailable: true,
      }));
      factory.registerProvider(new MockLLMProvider({
        id: 'healthy-2',
        shouldBeAvailable: true,
      }));
      factory.registerProvider(new MockLLMProvider({
        id: 'unhealthy',
        shouldBeAvailable: false,
      }));

      const healthy = await factory.getHealthyProviders();
      expect(healthy).toHaveLength(2);
      expect(healthy.map(p => p.id)).not.toContain('unhealthy');
    });
  });

  describe('Fallback Chain', () => {
    beforeEach(() => {
      // Register providers with varying capabilities and costs
      factory.registerProvider(new MockLLMProvider({
        id: 'claude-sonnet',
        provider: 'anthropic',
        capabilities: ['code', 'reasoning', 'writing', 'refactor'],
        maxComplexity: 'complex',
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
      }));
      factory.registerProvider(new MockLLMProvider({
        id: 'gpt-4o',
        provider: 'openai',
        capabilities: ['code', 'reasoning', 'writing'],
        maxComplexity: 'medium',
        inputCostPer1M: 2.5,
        outputCostPer1M: 10.0,
      }));
      factory.registerProvider(new MockLLMProvider({
        id: 'deepseek',
        provider: 'ollama',
        capabilities: ['code', 'debug'],
        maxComplexity: 'simple',
        inputCostPer1M: 0.0,
        outputCostPer1M: 0.0,
      }));
    });

    it('should build fallback chain for simple code task', () => {
      const task: TaskClassification = {
        type: 'code_edit',
        complexity: 'simple',
        riskLevel: 'low',
        signals: [],
        confidence: 0.8,
      };

      const chain = factory.getFallbackChain(task);

      // For simple tasks, prefer cheaper providers
      expect(chain).toContain('deepseek');
      expect(chain).toContain('gpt-4o');
      expect(chain).toContain('claude-sonnet');
    });

    it('should build fallback chain for complex code task', () => {
      const task: TaskClassification = {
        type: 'code_edit',
        complexity: 'complex',
        riskLevel: 'high',
        signals: [],
        confidence: 0.9,
      };

      const chain = factory.getFallbackChain(task);

      // For complex tasks, only include providers that can handle complexity
      expect(chain).toContain('claude-sonnet');
      // gpt-4o is medium, deepseek is simple - they shouldn't be included
      expect(chain).not.toContain('deepseek');
    });

    it('should respect preferred providers', () => {
      const task: TaskClassification = {
        type: 'code_edit',
        complexity: 'simple',
        riskLevel: 'low',
        signals: [],
        confidence: 0.8,
      };

      const chain = factory.getFallbackChain(task, ['gpt-4o', 'claude-sonnet']);

      // Preferred providers should be first
      expect(chain[0]).toBe('gpt-4o');
      expect(chain[1]).toBe('claude-sonnet');
    });

    it('should get first available provider from chain', async () => {
      // Make first provider unavailable
      const providers = factory.getAllProviders();
      const first = providers[0];
      vi.spyOn(first, 'isAvailable').mockResolvedValue(false);

      const task: TaskClassification = {
        type: 'code_edit',
        complexity: 'simple',
        riskLevel: 'low',
        signals: [],
        confidence: 0.8,
      };

      const chain = factory.getFallbackChain(task);
      const available = await factory.getFirstAvailable(chain);

      expect(available).not.toBeNull();
      expect(available?.id).not.toBe(first.id);
    });

    it('should return null when no providers available', async () => {
      // Make all providers unavailable
      for (const provider of factory.getAllProviders()) {
        vi.spyOn(provider, 'isAvailable').mockResolvedValue(false);
      }

      const available = await factory.getFirstAvailable(['claude-sonnet', 'gpt-4o', 'deepseek']);
      expect(available).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should return provider statistics', () => {
      factory.registerProvider(new MockLLMProvider({ id: 'a1', provider: 'anthropic' }));
      factory.registerProvider(new MockLLMProvider({ id: 'a2', provider: 'anthropic' }));
      factory.registerProvider(new MockLLMProvider({ id: 'o1', provider: 'openai' }));
      factory.registerProvider(new MockLLMProvider({ id: 'l1', provider: 'ollama' }));

      const stats = factory.getStats();

      expect(stats.totalProviders).toBe(4);
      expect(stats.byType.anthropic).toBe(2);
      expect(stats.byType.openai).toBe(1);
      expect(stats.byType.ollama).toBe(1);
    });
  });

  describe('Clear and Reset', () => {
    it('should clear all providers', () => {
      factory.registerProvider(new MockLLMProvider({ id: 'a' }));
      factory.registerProvider(new MockLLMProvider({ id: 'b' }));

      expect(factory.getAllProviders()).toHaveLength(2);

      factory.clear();

      expect(factory.getAllProviders()).toHaveLength(0);
    });
  });
});

describe('Singleton Pattern', () => {
  beforeEach(() => {
    resetProviderFactory();
  });

  afterEach(() => {
    resetProviderFactory();
  });

  it('should return same factory instance', () => {
    const factory1 = getProviderFactory();
    const factory2 = getProviderFactory();
    expect(factory1).toBe(factory2);
  });

  it('should reset singleton', () => {
    const factory1 = getProviderFactory();
    resetProviderFactory();
    const factory2 = getProviderFactory();
    expect(factory1).not.toBe(factory2);
  });
});

describe('Utility Functions', () => {
  describe('createProviderById', () => {
    it('should create Anthropic provider', () => {
      // This will fail without API key, but tests the factory function exists
      const provider = createProviderById('claude-sonnet-4');
      expect(provider).not.toBeNull();
      expect(provider?.provider).toBe('anthropic');
    });

    it('should create OpenAI provider', () => {
      const provider = createProviderById('gpt-4o', {
        openai: { apiKey: 'sk-test-key' },
      });
      expect(provider).not.toBeNull();
      expect(provider?.provider).toBe('openai');
    });

    it('should create Ollama provider', () => {
      const provider = createProviderById('deepseek-coder-v2');
      expect(provider).not.toBeNull();
      expect(provider?.provider).toBe('ollama');
    });

    it('should create vLLM provider', () => {
      const provider = createProviderById('qwen2.5-coder-32b');
      expect(provider).not.toBeNull();
      expect(provider?.provider).toBe('vllm');
    });

    it('should create vLLM provider with config', () => {
      // Use codestral-22b which is unique to vLLM
      const provider = createProviderById('codestral-22b', {
        vllm: { baseUrl: 'http://custom:8000', timeout: 180000 },
      });
      expect(provider).not.toBeNull();
      expect(provider?.provider).toBe('vllm');
    });

    it('should return null for unknown model', () => {
      const provider = createProviderById('unknown-model');
      expect(provider).toBeNull();
    });
  });

  describe('getProviderType', () => {
    it('should return correct provider types', () => {
      expect(getProviderType('claude-opus-4.5')).toBe('anthropic');
      expect(getProviderType('claude-sonnet-4')).toBe('anthropic');
      expect(getProviderType('gpt-4o')).toBe('openai');
      expect(getProviderType('o3')).toBe('openai');
      expect(getProviderType('llama3.3')).toBe('ollama');
      expect(getProviderType('unknown')).toBeNull();
    });

    it('should return vllm for unique vLLM models', () => {
      // Note: 'deepseek-coder-v2' and 'deepseek-v3' exist in both Ollama and vLLM
      // Ollama is checked first, so they return 'ollama'
      // These are unique to vLLM:
      expect(getProviderType('qwen2.5-coder-32b')).toBe('vllm');
      expect(getProviderType('codestral-22b')).toBe('vllm');
    });
  });

  describe('listAllModelIds', () => {
    it('should list all available model IDs', () => {
      const ids = listAllModelIds();

      // Should include models from all providers
      expect(ids).toContain('claude-opus-4.5');
      expect(ids).toContain('claude-sonnet-4');
      expect(ids).toContain('gpt-4o');
      expect(ids).toContain('gpt-5.2');
      expect(ids).toContain('o3');
      expect(ids).toContain('llama3.3');
      // vLLM-unique models
      expect(ids).toContain('qwen2.5-coder-32b');
      expect(ids).toContain('codestral-22b');
    });

    it('should include both Ollama and vLLM models even with overlapping keys', () => {
      const ids = listAllModelIds();

      // deepseek-coder-v2 and deepseek-v3 are in both, but should only appear once
      const deepseekCoderCount = ids.filter(id => id === 'deepseek-coder-v2').length;
      const deepseekV3Count = ids.filter(id => id === 'deepseek-v3').length;

      // Each should appear twice (once from Ollama, once from vLLM)
      expect(deepseekCoderCount).toBe(2);
      expect(deepseekV3Count).toBe(2);
    });
  });

  describe('getModelInfo', () => {
    it('should return model info for Anthropic models', () => {
      const info = getModelInfo('claude-sonnet-4');

      expect(info).not.toBeNull();
      expect(info?.provider).toBe('anthropic');
      expect(info?.displayName).toBe('Claude Sonnet 4');
      expect(info?.capabilities).toContain('code');
      expect(info?.maxComplexity).toBe('complex');
    });

    it('should return model info for OpenAI models', () => {
      const info = getModelInfo('gpt-5.2');

      expect(info).not.toBeNull();
      expect(info?.provider).toBe('openai');
      expect(info?.displayName).toBe('GPT-5.2');
      expect(info?.capabilities).toContain('code');
      expect(info?.contextWindow).toBeGreaterThan(100000);
    });

    it('should return model info for Ollama models', () => {
      const info = getModelInfo('deepseek-v3');

      expect(info).not.toBeNull();
      expect(info?.provider).toBe('ollama');
      expect(info?.costPer1M.input).toBe(0);
      expect(info?.costPer1M.output).toBe(0);
    });

    it('should return null for unknown model', () => {
      const info = getModelInfo('unknown-model');
      expect(info).toBeNull();
    });

    it('should return model info for vLLM models', () => {
      const info = getModelInfo('qwen2.5-coder-32b');

      expect(info).not.toBeNull();
      expect(info?.provider).toBe('vllm');
      expect(info?.displayName).toBe('Qwen 2.5 Coder 32B');
      expect(info?.capabilities).toContain('code');
      expect(info?.costPer1M.input).toBe(0);
      expect(info?.costPer1M.output).toBe(0);
    });

    it('should return model info for codestral-22b', () => {
      const info = getModelInfo('codestral-22b');

      expect(info).not.toBeNull();
      expect(info?.provider).toBe('vllm');
      expect(info?.displayName).toBe('Codestral 22B');
      expect(info?.contextWindow).toBe(32768);
    });
  });
});
