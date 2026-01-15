/**
 * Anthropic Provider Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Anthropic Provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AnthropicProvider,
  createAnthropicProvider,
  createAllAnthropicProviders,
  listAnthropicModels,
  ANTHROPIC_MODELS,
  type AnthropicModelKey,
} from '../../../../../src/god-agent/core/router/providers/anthropic-provider.js';

describe('AnthropicProvider', () => {
  describe('Model Definitions', () => {
    it('should define claude-opus-4.5', () => {
      expect(ANTHROPIC_MODELS['claude-opus-4.5']).toBeDefined();
      expect(ANTHROPIC_MODELS['claude-opus-4.5'].id).toBe('claude-opus-4-5-20251101');
      expect(ANTHROPIC_MODELS['claude-opus-4.5'].displayName).toBe('Claude Opus 4.5');
      expect(ANTHROPIC_MODELS['claude-opus-4.5'].maxComplexity).toBe('complex');
    });

    it('should define claude-sonnet-4', () => {
      expect(ANTHROPIC_MODELS['claude-sonnet-4']).toBeDefined();
      expect(ANTHROPIC_MODELS['claude-sonnet-4'].id).toBe('claude-sonnet-4-20250514');
      expect(ANTHROPIC_MODELS['claude-sonnet-4'].displayName).toBe('Claude Sonnet 4');
    });

    it('should define claude-haiku', () => {
      expect(ANTHROPIC_MODELS['claude-haiku']).toBeDefined();
      expect(ANTHROPIC_MODELS['claude-haiku'].id).toBe('claude-3-5-haiku-20241022');
      expect(ANTHROPIC_MODELS['claude-haiku'].maxComplexity).toBe('simple');
    });

    it('should have capabilities for all models', () => {
      for (const [key, config] of Object.entries(ANTHROPIC_MODELS)) {
        expect(config.capabilities.length).toBeGreaterThan(0);
        expect(config.capabilities).toContain('code');
      }
    });

    it('should have cost information for all models', () => {
      for (const [key, config] of Object.entries(ANTHROPIC_MODELS)) {
        expect(config.inputCostPer1M).toBeGreaterThanOrEqual(0);
        expect(config.outputCostPer1M).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Provider Construction', () => {
    it('should create provider with default model', () => {
      const provider = new AnthropicProvider();
      expect(provider.id).toBe('claude-sonnet-4');
      expect(provider.provider).toBe('anthropic');
    });

    it('should create provider with specified model', () => {
      const provider = new AnthropicProvider({ modelKey: 'claude-opus-4.5' });
      expect(provider.id).toBe('claude-opus-4.5');
      expect(provider.model).toBe('claude-opus-4-5-20251101');
    });

    it('should allow custom model ID override', () => {
      const provider = new AnthropicProvider({
        modelKey: 'claude-sonnet-4',
        modelId: 'custom-model-id',
      });
      expect(provider.model).toBe('custom-model-id');
    });

    it('should inherit capabilities from model config', () => {
      const provider = new AnthropicProvider({ modelKey: 'claude-opus-4.5' });
      expect(provider.capabilities).toContain('code');
      expect(provider.capabilities).toContain('reasoning');
      expect(provider.capabilities).toContain('writing');
    });

    it('should inherit max complexity from model config', () => {
      const opusProvider = new AnthropicProvider({ modelKey: 'claude-opus-4.5' });
      expect(opusProvider.maxComplexity).toBe('complex');

      const haikuProvider = new AnthropicProvider({ modelKey: 'claude-haiku' });
      expect(haikuProvider.maxComplexity).toBe('simple');
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost based on token usage', () => {
      const provider = new AnthropicProvider({ modelKey: 'claude-sonnet-4' });

      const cost = provider.getCost(1000, 500);

      // Sonnet: $3/1M input, $15/1M output
      // 1000 input = $0.003, 500 output = $0.0075
      expect(cost.inputCost).toBeCloseTo(0.003, 5);
      expect(cost.outputCost).toBeCloseTo(0.0075, 5);
      expect(cost.totalCost).toBeCloseTo(0.0105, 5);
    });

    it('should calculate cost for Haiku correctly', () => {
      const provider = new AnthropicProvider({ modelKey: 'claude-haiku' });

      const cost = provider.getCost(10000, 5000);

      // Haiku: $0.25/1M input, $1.25/1M output
      expect(cost.inputCost).toBeCloseTo(0.0025, 5);
      expect(cost.outputCost).toBeCloseTo(0.00625, 5);
    });
  });

  describe('Display Information', () => {
    it('should return display name', () => {
      const provider = new AnthropicProvider({ modelKey: 'claude-opus-4.5' });
      expect(provider.getDisplayName()).toBe('Claude Opus 4.5');
    });

    it('should return context window', () => {
      const provider = new AnthropicProvider({ modelKey: 'claude-sonnet-4' });
      expect(provider.getContextWindow()).toBe(200000);
    });
  });
});

describe('Factory Functions', () => {
  describe('createAnthropicProvider', () => {
    it('should create provider with default model', () => {
      const provider = createAnthropicProvider();
      expect(provider.id).toBe('claude-sonnet-4');
    });

    it('should create provider with specified model', () => {
      const provider = createAnthropicProvider('claude-opus-4.5');
      expect(provider.id).toBe('claude-opus-4.5');
    });

    it('should pass through configuration', () => {
      const provider = createAnthropicProvider('claude-sonnet-4', {
        timeout: 30000,
      });
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });
  });

  describe('createAllAnthropicProviders', () => {
    it('should create providers for all models', () => {
      const providers = createAllAnthropicProviders();

      expect(providers.size).toBe(Object.keys(ANTHROPIC_MODELS).length);
      expect(providers.has('claude-opus-4.5')).toBe(true);
      expect(providers.has('claude-sonnet-4')).toBe(true);
      expect(providers.has('claude-haiku')).toBe(true);
    });

    it('should pass configuration to all providers', () => {
      const providers = createAllAnthropicProviders({
        timeout: 45000,
      });

      for (const [id, provider] of providers) {
        expect(provider).toBeInstanceOf(AnthropicProvider);
        expect(provider.id).toBe(id);
      }
    });
  });

  describe('listAnthropicModels', () => {
    it('should list all available models', () => {
      const models = listAnthropicModels();

      expect(models.length).toBe(Object.keys(ANTHROPIC_MODELS).length);

      const opus = models.find(m => m.key === 'claude-opus-4.5');
      expect(opus).toBeDefined();
      expect(opus?.displayName).toBe('Claude Opus 4.5');
      expect(opus?.maxComplexity).toBe('complex');
    });

    it('should include model IDs', () => {
      const models = listAnthropicModels();

      for (const model of models) {
        expect(model.id).toBeDefined();
        expect(model.id.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Provider Interface', () => {
  it('should implement ILLMProvider interface', () => {
    const provider = new AnthropicProvider();

    expect(provider.id).toBeDefined();
    expect(provider.provider).toBe('anthropic');
    expect(provider.model).toBeDefined();
    expect(provider.capabilities).toBeInstanceOf(Array);
    expect(provider.maxComplexity).toBeDefined();
    expect(typeof provider.complete).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(typeof provider.isAvailable).toBe('function');
    expect(typeof provider.getCost).toBe('function');
  });
});
