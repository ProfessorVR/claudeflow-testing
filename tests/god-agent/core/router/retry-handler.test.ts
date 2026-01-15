/**
 * Retry Handler Tests
 *
 * Tests for Phase 7.1: Production Hardening - Retry Logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RetryHandler,
  RetryBudgetManager,
  classifyError,
  isRetryableError,
  getSuggestedDelay,
  withRetry,
  withRetryPreset,
  getRetryBudgetManager,
  resetRetryBudgetManager,
  formatRetryResult,
  DEFAULT_RETRY_CONFIG,
  RETRY_PRESETS,
} from '../../../../src/god-agent/core/router/retry-handler.js';

describe('classifyError', () => {
  it('should classify rate limit errors', () => {
    expect(classifyError(new Error('Rate limit exceeded'))).toBe('rate_limit');
    expect(classifyError(new Error('429 Too Many Requests'))).toBe('rate_limit');
  });

  it('should classify timeout errors', () => {
    expect(classifyError(new Error('Request timed out'))).toBe('timeout');
    expect(classifyError(new Error('timeout exceeded'))).toBe('timeout');
  });

  it('should classify network errors', () => {
    expect(classifyError(new Error('ECONNREFUSED'))).toBe('network');
    expect(classifyError(new Error('ENOTFOUND'))).toBe('network');
    expect(classifyError(new Error('network error'))).toBe('network');
  });

  it('should classify server errors', () => {
    expect(classifyError(new Error('500 Internal Server Error'))).toBe('server_error');
    expect(classifyError(new Error('502 Bad Gateway'))).toBe('server_error');
  });

  it('should classify unavailable errors', () => {
    expect(classifyError(new Error('503 Service Unavailable'))).toBe('unavailable');
    expect(classifyError(new Error('service unavailable'))).toBe('unavailable');
  });

  it('should classify auth errors', () => {
    expect(classifyError(new Error('401 Unauthorized'))).toBe('unauthorized');
    expect(classifyError(new Error('403 Forbidden'))).toBe('forbidden');
  });

  it('should return unknown for unrecognized errors', () => {
    expect(classifyError(new Error('Something went wrong'))).toBe('unknown');
    expect(classifyError(null)).toBe('unknown');
  });
});

describe('isRetryableError', () => {
  it('should return true for retryable errors', () => {
    expect(isRetryableError('rate_limit')).toBe(true);
    expect(isRetryableError('server_error')).toBe(true);
    expect(isRetryableError('timeout')).toBe(true);
    expect(isRetryableError('network')).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    expect(isRetryableError('unauthorized')).toBe(false);
    expect(isRetryableError('forbidden')).toBe(false);
    expect(isRetryableError('invalid_request')).toBe(false);
    expect(isRetryableError('unknown')).toBe(false);
  });

  it('should respect custom retryable list', () => {
    expect(isRetryableError('timeout', ['timeout'])).toBe(true);
    expect(isRetryableError('network', ['timeout'])).toBe(false);
  });
});

describe('getSuggestedDelay', () => {
  it('should extract delay from Retry-After header (seconds)', () => {
    const error = new Error('Rate limited') as Error & { headers: Record<string, string> };
    error.headers = { 'retry-after': '30' };

    expect(getSuggestedDelay(error)).toBe(30000);
  });

  it('should return null when no header', () => {
    expect(getSuggestedDelay(new Error('Some error'))).toBeNull();
  });
});

describe('RetryHandler', () => {
  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const handler = new RetryHandler({ maxRetries: 3 });
      const operation = vi.fn().mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const handler = new RetryHandler({
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const handler = new RetryHandler({ maxRetries: 3 });
      const operation = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));

      const result = await handler.execute(operation);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries', async () => {
      const handler = new RetryHandler({
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      const operation = vi.fn().mockRejectedValue(new Error('timeout'));

      const result = await handler.execute(operation);

      expect(result.success).toBe(false);
      expect(result.retriesExhausted).toBe(true);
      expect(result.attempts).toBe(3); // 1 initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const handler = new RetryHandler({
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
        onRetry,
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      await handler.execute(operation);

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1,
        expect.any(Error),
        expect.any(Number)
      );
    });

    it('should respect total timeout', async () => {
      const handler = new RetryHandler({
        maxRetries: 10,
        initialDelayMs: 100,
        totalTimeoutMs: 200,
      });

      const operation = vi.fn().mockRejectedValue(new Error('timeout'));

      const result = await handler.execute(operation);

      expect(result.timedOut).toBe(true);
      expect(result.attempts).toBeLessThan(10);
    });
  });

  describe('getAttempts', () => {
    it('should track retry attempts', async () => {
      const handler = new RetryHandler({
        maxRetries: 2,
        initialDelayMs: 10,
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      await handler.execute(operation);

      const attempts = handler.getAttempts();
      expect(attempts.length).toBe(1);
      expect(attempts[0].attempt).toBe(1);
      expect(attempts[0].errorType).toBe('timeout');
    });
  });
});

describe('RetryBudgetManager', () => {
  let manager: RetryBudgetManager;

  beforeEach(() => {
    manager = new RetryBudgetManager({ maxRetries: 5, windowMs: 1000 });
  });

  describe('canRetry', () => {
    it('should allow retries within budget', () => {
      expect(manager.canRetry('provider-1')).toBe(true);
    });

    it('should block when budget exhausted', () => {
      for (let i = 0; i < 5; i++) {
        manager.recordRetry('provider-1');
      }

      expect(manager.canRetry('provider-1')).toBe(false);
    });

    it('should track budgets per identifier', () => {
      for (let i = 0; i < 5; i++) {
        manager.recordRetry('provider-1');
      }

      expect(manager.canRetry('provider-1')).toBe(false);
      expect(manager.canRetry('provider-2')).toBe(true);
    });
  });

  describe('getRemainingRetries', () => {
    it('should return remaining retries', () => {
      manager.recordRetry('provider-1');
      manager.recordRetry('provider-1');

      expect(manager.getRemainingRetries('provider-1')).toBe(3);
    });

    it('should return 0 when exhausted', () => {
      for (let i = 0; i < 10; i++) {
        manager.recordRetry('provider-1');
      }

      expect(manager.getRemainingRetries('provider-1')).toBe(0);
    });
  });

  describe('resetBudget', () => {
    it('should reset specific budget', () => {
      for (let i = 0; i < 5; i++) {
        manager.recordRetry('provider-1');
      }

      manager.resetBudget('provider-1');

      expect(manager.canRetry('provider-1')).toBe(true);
    });
  });
});

describe('withRetry', () => {
  it('should return result on success', async () => {
    const result = await withRetry(
      async () => 'success',
      { maxRetries: 2, initialDelayMs: 10 }
    );

    expect(result).toBe('success');
  });

  it('should throw on final failure', async () => {
    await expect(
      withRetry(
        async () => { throw new Error('always fails'); },
        { maxRetries: 1, initialDelayMs: 10 }
      )
    ).rejects.toThrow('always fails');
  });
});

describe('withRetryPreset', () => {
  it('should use aggressive preset', async () => {
    const result = await withRetryPreset(
      async () => 'success',
      'aggressive'
    );

    expect(result).toBe('success');
  });

  it('should use conservative preset', async () => {
    const result = await withRetryPreset(
      async () => 'success',
      'conservative'
    );

    expect(result).toBe('success');
  });
});

describe('Singleton functions', () => {
  afterEach(() => {
    resetRetryBudgetManager();
  });

  it('should return same instance with getRetryBudgetManager', () => {
    const first = getRetryBudgetManager();
    const second = getRetryBudgetManager();

    expect(first).toBe(second);
  });

  it('should reset with resetRetryBudgetManager', () => {
    const first = getRetryBudgetManager();
    resetRetryBudgetManager();
    const second = getRetryBudgetManager();

    expect(first).not.toBe(second);
  });
});

describe('formatRetryResult', () => {
  it('should format successful result', () => {
    const result = {
      success: true,
      result: 'data',
      attempts: 2,
      totalTimeMs: 500,
      retriesExhausted: false,
      timedOut: false,
    };

    const formatted = formatRetryResult(result);

    expect(formatted).toContain('SUCCESS');
    expect(formatted).toContain('2');
    expect(formatted).toContain('500ms');
  });

  it('should format failed result', () => {
    const result = {
      success: false,
      error: new Error('Failed'),
      attempts: 3,
      totalTimeMs: 1500,
      retriesExhausted: true,
      timedOut: false,
    };

    const formatted = formatRetryResult(result);

    expect(formatted).toContain('FAILED');
    expect(formatted).toContain('Retries exhausted');
    expect(formatted).toContain('Failed');
  });

  it('should show timeout', () => {
    const result = {
      success: false,
      error: new Error('Timeout'),
      attempts: 2,
      totalTimeMs: 30000,
      retriesExhausted: false,
      timedOut: true,
    };

    const formatted = formatRetryResult(result);

    expect(formatted).toContain('Timed out');
  });
});

describe('DEFAULT_RETRY_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBeGreaterThan(0);
    expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBeGreaterThan(0);
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBeGreaterThan(DEFAULT_RETRY_CONFIG.initialDelayMs);
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBeGreaterThan(1);
  });
});

describe('RETRY_PRESETS', () => {
  it('should have aggressive preset', () => {
    expect(RETRY_PRESETS.aggressive).toBeDefined();
    expect(RETRY_PRESETS.aggressive.maxRetries).toBeGreaterThan(3);
  });

  it('should have conservative preset', () => {
    expect(RETRY_PRESETS.conservative).toBeDefined();
    expect(RETRY_PRESETS.conservative.maxRetries).toBeLessThan(3);
  });

  it('should have rateLimit preset', () => {
    expect(RETRY_PRESETS.rateLimit).toBeDefined();
  });

  it('should have network preset', () => {
    expect(RETRY_PRESETS.network).toBeDefined();
  });
});
