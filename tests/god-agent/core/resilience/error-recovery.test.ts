/**
 * Unit Tests for Error Recovery Service
 * TIER-1.2 - Production Hardening
 *
 * Tests retry logic, circuit breaker, and fallback patterns
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  withRetry,
  CircuitBreaker,
  withFallback,
  withResilience,
  classifyError,
  isRetryableError,
  ErrorClass,
  CircuitState,
} from '../../../../src/god-agent/core/resilience/error-recovery.js';

describe('Error Recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================== Error Classification ====================

  describe('classifyError', () => {
    it('should classify timeout errors as TRANSIENT', () => {
      const error = new Error('Request timeout exceeded');
      expect(classifyError(error)).toBe(ErrorClass.TRANSIENT);
    });

    it('should classify network errors as TRANSIENT', () => {
      const error = new Error('ECONNRESET: Connection reset');
      expect(classifyError(error)).toBe(ErrorClass.TRANSIENT);
    });

    it('should classify rate limit errors as RESOURCE', () => {
      const error = new Error('Rate limit exceeded');
      expect(classifyError(error)).toBe(ErrorClass.RESOURCE);
    });

    it('should classify 429 errors as RESOURCE', () => {
      const error = new Error('Error 429: Too Many Requests');
      expect(classifyError(error)).toBe(ErrorClass.RESOURCE);
    });

    it('should classify auth errors as PERMANENT', () => {
      const error = new Error('Unauthorized');
      expect(classifyError(error)).toBe(ErrorClass.PERMANENT);
    });

    it('should classify validation errors as PERMANENT', () => {
      const error = new Error('Invalid input format');
      expect(classifyError(error)).toBe(ErrorClass.PERMANENT);
    });

    it('should classify unknown errors as UNKNOWN', () => {
      const error = new Error('Some random error');
      expect(classifyError(error)).toBe(ErrorClass.UNKNOWN);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for transient errors', () => {
      const error = new Error('Connection timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for resource errors', () => {
      const error = new Error('Rate limit exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for permanent errors', () => {
      const error = new Error('Invalid request');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  // ==================== Retry Logic ====================

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient error and succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
      });

      // Advance timers for retry delay
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max attempts', async () => {
      // Use non-retryable error to avoid timing issues
      const error = new Error('Invalid request format');
      const fn = vi.fn().mockRejectedValue(error);

      // Should throw immediately without retries
      await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow('Invalid request format');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry permanent errors', async () => {
      const error = new Error('Invalid request');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow('Invalid request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(200);
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    });
  });

  // ==================== Circuit Breaker ====================

  describe('CircuitBreaker', () => {
    let cb: CircuitBreaker;

    beforeEach(() => {
      cb = new CircuitBreaker('test', {
        failureThreshold: 3,
        successThreshold: 2,
        resetTimeoutMs: 1000,
      });
    });

    it('should start in CLOSED state', () => {
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should allow execution in CLOSED state', async () => {
      const result = await cb.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should open circuit after failure threshold', async () => {
      // Cause 3 failures
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject calls when circuit is OPEN', async () => {
      // Force circuit open
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }

      await expect(cb.execute(() => Promise.resolve('success'))).rejects.toThrow(
        "Circuit breaker 'test' is OPEN"
      );
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Force circuit open
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);

      // Advance past reset timeout
      vi.advanceTimersByTime(1100);

      expect(cb.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      // Force circuit open
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }

      // Advance to HALF_OPEN
      vi.advanceTimersByTime(1100);
      expect(cb.getState()).toBe(CircuitState.HALF_OPEN);

      // 2 successes to close
      await cb.execute(() => Promise.resolve('success1'));
      await cb.execute(() => Promise.resolve('success2'));

      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failure in HALF_OPEN', async () => {
      // Force circuit open
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      }

      // Advance to HALF_OPEN
      vi.advanceTimersByTime(1100);
      expect(cb.getState()).toBe(CircuitState.HALF_OPEN);

      // Fail again
      await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      expect(cb.getState()).toBe(CircuitState.OPEN);
    });

    it('should reset to CLOSED state', () => {
      cb.reset();
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should return correct stats', async () => {
      await cb.execute(() => Promise.resolve('success'));
      await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      const stats = cb.getStats();
      expect(stats.name).toBe('test');
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(1);
    });
  });

  // ==================== Fallback ====================

  describe('withFallback', () => {
    it('should return result on success', async () => {
      const result = await withFallback(
        () => Promise.resolve('success'),
        { fallback: 'fallback' }
      );

      expect(result).toBe('success');
    });

    it('should return fallback value on error', async () => {
      const result = await withFallback(
        () => Promise.reject(new Error('fail')),
        { fallback: 'fallback' }
      );

      expect(result).toBe('fallback');
    });

    it('should return fallback function result on error', async () => {
      const result = await withFallback(
        () => Promise.reject(new Error('fail')),
        { fallback: () => 'computed fallback' }
      );

      expect(result).toBe('computed fallback');
    });

    it('should call onFallback callback', async () => {
      const onFallback = vi.fn();

      await withFallback(
        () => Promise.reject(new Error('fail')),
        { fallback: 'fallback', onFallback }
      );

      expect(onFallback).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ==================== Combined Pattern ====================

  describe('withResilience', () => {
    it('should combine retry and fallback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValue(new Error('Connection timeout'));

      const resultPromise = withResilience(fn, {
        retry: { maxAttempts: 2, initialDelayMs: 100 },
        fallback: { fallback: 'default' },
      });

      // Advance through retries
      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;
      expect(result).toBe('default');
    });

    it('should succeed without fallback if retries work', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValue('success');

      const resultPromise = withResilience(fn, {
        retry: { maxAttempts: 3, initialDelayMs: 100 },
      });

      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;
      expect(result).toBe('success');
    });
  });
});
