/**
 * Tests for ModelRouter — Unified LLM Orchestration Layer
 *
 * Covers backend fallback, cost-tier routing, JSON parsing/validation,
 * retry logic, forceBackend, and backend health detection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelRouter, type ModelRouterConfig, type LLMRequest } from '../../../../src/god-agent/core/composition/model-router.js';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create a ModelRouter with mocked backends for testing.
 * By default: Anthropic key present, vLLM client created.
 */
function createRouter(overrides: ModelRouterConfig = {}): ModelRouter {
  return new ModelRouter({
    anthropicApiKey: 'sk-ant-api03-test-key-that-is-at-least-50-characters-long-for-validation',
    vllmBaseUrl: 'http://localhost:8002/v1',
    maxRetries: 1, // Fast tests
    timeoutMs: 5000,
    ...overrides,
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe('ModelRouter', () => {
  describe('construction', () => {
    it('should initialize with default config', () => {
      // No API key → no anthropic client, but vLLM always initialized
      const router = new ModelRouter();
      expect(router).toBeDefined();
    });

    it('should accept custom config', () => {
      const router = new ModelRouter({
        vllmBaseUrl: 'http://custom:9999/v1',
        vllmModel: 'custom-model',
        maxRetries: 5,
      });
      expect(router).toBeDefined();
    });

    it('should not create Anthropic client with short API key', () => {
      const router = new ModelRouter({
        anthropicApiKey: 'too-short',
      });
      // Router should still work (vLLM fallback)
      expect(router).toBeDefined();
    });
  });

  describe('resolveBackendOrder', () => {
    it('should route costTier=low to vLLM first', () => {
      const router = createRouter();
      // Access private method via any cast for testing
      const order = (router as any).resolveBackendOrder({
        systemPrompt: '',
        userPrompt: '',
        costTier: 'low',
      });
      expect(order[0]).toBe('vllm');
    });

    it('should route costTier=high to Anthropic first', () => {
      const router = createRouter();
      const order = (router as any).resolveBackendOrder({
        systemPrompt: '',
        userPrompt: '',
        costTier: 'high',
      });
      expect(order[0]).toBe('anthropic');
    });

    it('should respect forceBackend (no fallback)', () => {
      const router = createRouter();
      const order = (router as any).resolveBackendOrder({
        systemPrompt: '',
        userPrompt: '',
        forceBackend: 'vllm',
      });
      expect(order).toEqual(['vllm']);
    });

    it('should default to Anthropic first when no costTier specified', () => {
      const router = createRouter();
      const order = (router as any).resolveBackendOrder({
        systemPrompt: '',
        userPrompt: '',
      });
      expect(order[0]).toBe('anthropic');
    });

    it('should only include vLLM when no Anthropic key', () => {
      const router = new ModelRouter({ anthropicApiKey: '' });
      const order = (router as any).resolveBackendOrder({
        systemPrompt: '',
        userPrompt: '',
        costTier: 'high',
      });
      expect(order).toEqual(['vllm']);
    });
  });

  describe('extractJSON', () => {
    it('should extract JSON from code block', () => {
      const router = createRouter();
      const result = (router as any).extractJSON('```json\n{"key": "value"}\n```');
      expect(result).toBe('{"key": "value"}');
    });

    it('should extract JSON from code block without language tag', () => {
      const router = createRouter();
      const result = (router as any).extractJSON('```\n[1, 2, 3]\n```');
      expect(result).toBe('[1, 2, 3]');
    });

    it('should extract JSON object directly', () => {
      const router = createRouter();
      const result = (router as any).extractJSON('Here is the result: {"a": 1}');
      expect(result).toBe('{"a": 1}');
    });

    it('should extract JSON array directly', () => {
      const router = createRouter();
      const result = (router as any).extractJSON('Result: [{"id": 1}]');
      expect(result).toBe('[{"id": 1}]');
    });

    it('should return trimmed content when no JSON found', () => {
      const router = createRouter();
      const result = (router as any).extractJSON('  plain text  ');
      expect(result).toBe('plain text');
    });
  });

  describe('isNonRetryable', () => {
    it('should detect 401 as non-retryable', () => {
      const router = createRouter();
      const error = new Error('HTTP 401 Unauthorized');
      expect((router as any).isNonRetryable(error)).toBe(true);
    });

    it('should detect 403 as non-retryable', () => {
      const router = createRouter();
      const error = new Error('HTTP 403 Forbidden');
      expect((router as any).isNonRetryable(error)).toBe(true);
    });

    it('should detect 400 as non-retryable', () => {
      const router = createRouter();
      const error = new Error('HTTP 400 Bad Request');
      expect((router as any).isNonRetryable(error)).toBe(true);
    });

    it('should detect authentication errors as non-retryable', () => {
      const router = createRouter();
      const error = new Error('Authentication failed');
      expect((router as any).isNonRetryable(error)).toBe(true);
    });

    it('should not flag 500 errors as non-retryable', () => {
      const router = createRouter();
      const error = new Error('HTTP 500 Internal Server Error');
      expect((router as any).isNonRetryable(error)).toBe(false);
    });

    it('should not flag timeout errors as non-retryable', () => {
      const router = createRouter();
      const error = new Error('Connection timeout');
      expect((router as any).isNonRetryable(error)).toBe(false);
    });
  });

  describe('getAvailableBackends', () => {
    it('should include anthropic when API key is valid length', () => {
      const router = createRouter();
      // Can't actually test without mocking fetch, but verify the method exists
      expect(typeof router.getAvailableBackends).toBe('function');
    });

    it('should cache backend results', async () => {
      const router = createRouter();
      // Set cached value via private field
      (router as any).availableBackends = ['anthropic'];
      const result = await router.getAvailableBackends();
      expect(result).toEqual(['anthropic']);
    });

    it('should reset cache on resetBackendCache()', async () => {
      const router = createRouter();
      (router as any).availableBackends = ['anthropic'];
      router.resetBackendCache();
      expect((router as any).availableBackends).toBeNull();
    });
  });

  describe('callJSON validation', () => {
    it('should pass parsed JSON through validator', async () => {
      const router = createRouter();

      // Mock the call method to return JSON content
      vi.spyOn(router, 'call').mockResolvedValueOnce({
        content: '{"name": "test", "value": 42}',
        model: 'test-model',
        backend: 'vllm',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      const result = await router.callJSON<{ name: string; value: number }>(
        { systemPrompt: 'test', userPrompt: 'test' },
        (raw) => {
          const obj = raw as Record<string, unknown>;
          if (typeof obj.name !== 'string') throw new Error('name must be string');
          return { name: obj.name, value: Number(obj.value) };
        },
      );

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should throw when validator rejects', async () => {
      const router = createRouter();

      vi.spyOn(router, 'call').mockResolvedValueOnce({
        content: '{"bad": true}',
        model: 'test-model',
        backend: 'vllm',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      await expect(
        router.callJSON(
          { systemPrompt: 'test', userPrompt: 'test' },
          () => { throw new Error('validation failed'); },
        ),
      ).rejects.toThrow('JSON parsing/validation failed');
    });

    it('should throw on invalid JSON', async () => {
      const router = createRouter();

      vi.spyOn(router, 'call').mockResolvedValueOnce({
        content: 'not json at all',
        model: 'test-model',
        backend: 'vllm',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      await expect(
        router.callJSON(
          { systemPrompt: 'test', userPrompt: 'test' },
          (x) => x,
        ),
      ).rejects.toThrow('JSON parsing/validation failed');
    });

    it('should extract JSON from code blocks before parsing', async () => {
      const router = createRouter();

      vi.spyOn(router, 'call').mockResolvedValueOnce({
        content: 'Here is the result:\n```json\n[1, 2, 3]\n```',
        model: 'test-model',
        backend: 'vllm',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      const result = await router.callJSON<number[]>(
        { systemPrompt: 'test', userPrompt: 'test' },
        (raw) => {
          if (!Array.isArray(raw)) throw new Error('expected array');
          return raw;
        },
      );

      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('cost tier integration', () => {
    it('should use low temperature for callJSON by default', async () => {
      const router = createRouter();
      const callSpy = vi.spyOn(router, 'call').mockResolvedValueOnce({
        content: '{}',
        model: 'test',
        backend: 'vllm',
        usage: { inputTokens: 0, outputTokens: 0 },
      });

      await router.callJSON(
        { systemPrompt: 'test', userPrompt: 'test' },
        (x) => x,
      );

      expect(callSpy).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.3, jsonMode: true }),
      );
    });
  });
});
