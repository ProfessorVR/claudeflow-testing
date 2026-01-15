/**
 * Rate Limiter Tests
 *
 * Tests for Phase 7.1: Production Hardening - Rate Limiting
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RateLimiter,
  RateLimiterManager,
  getRateLimiterManager,
  initializeRateLimiter,
  resetRateLimiter,
  formatRateLimitStatus,
  DEFAULT_RATE_LIMITS,
} from '../../../../src/god-agent/core/router/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter('test', {
      maxRequests: 5,
      windowMs: 1000,
      maxConcurrent: 2,
      enableQueue: false,
    });
  });

  afterEach(() => {
    limiter.stop();
  });

  describe('acquire', () => {
    it('should allow requests within limit', async () => {
      const result = await limiter.acquire('req-1');

      expect(result.allowed).toBe(true);
      expect(result.status.currentRequests).toBe(1);
    });

    it('should track concurrent requests', async () => {
      await limiter.acquire('req-1');
      const result = await limiter.acquire('req-2');

      expect(result.allowed).toBe(true);
      expect(result.status.concurrentRequests).toBe(2);
    });

    it('should block when concurrent limit reached', async () => {
      await limiter.acquire('req-1');
      await limiter.acquire('req-2');
      const result = await limiter.acquire('req-3');

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeDefined();
    });

    it('should block when request limit reached', async () => {
      // Acquire all slots
      for (let i = 0; i < 5; i++) {
        const r = await limiter.acquire(`req-${i}`);
        limiter.release(`req-${i}`); // Release to allow more
      }

      // Should be at limit now
      const result = await limiter.acquire('req-6');
      expect(result.allowed).toBe(false);
    });
  });

  describe('release', () => {
    it('should free concurrent slot on release', async () => {
      await limiter.acquire('req-1');
      await limiter.acquire('req-2');

      const before = limiter.getStatus();
      expect(before.concurrentRequests).toBe(2);

      limiter.release('req-1');

      const after = limiter.getStatus();
      expect(after.concurrentRequests).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('should return correct status', async () => {
      await limiter.acquire('req-1');

      const status = limiter.getStatus();

      expect(status.identifier).toBe('test');
      expect(status.currentRequests).toBe(1);
      expect(status.maxRequests).toBe(5);
      expect(status.concurrentRequests).toBe(1);
      expect(status.maxConcurrent).toBe(2);
      expect(status.isLimited).toBe(false);
    });

    it('should indicate limited when at capacity', async () => {
      await limiter.acquire('req-1');
      await limiter.acquire('req-2');

      const status = limiter.getStatus();
      expect(status.isLimited).toBe(true);
    });
  });

  describe('reset', () => {
    it('should clear all state', async () => {
      await limiter.acquire('req-1');
      await limiter.acquire('req-2');

      limiter.reset();

      const status = limiter.getStatus();
      expect(status.currentRequests).toBe(0);
      expect(status.concurrentRequests).toBe(0);
    });
  });
});

describe('RateLimiter with Queue', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter('queue-test', {
      maxRequests: 2,
      windowMs: 1000,
      maxConcurrent: 1,
      enableQueue: true,
      maxQueueSize: 5,
      queueTimeoutMs: 5000,
    });
  });

  afterEach(() => {
    limiter.stop();
  });

  it('should queue requests when limited', async () => {
    // First request - allowed
    const first = await limiter.acquire('req-1');
    expect(first.allowed).toBe(true);

    // Second request - should queue
    const secondPromise = limiter.acquire('req-2');

    // Check queue status
    const status = limiter.getStatus();
    expect(status.queuedRequests).toBe(1);

    // Release first to process queue
    limiter.release('req-1');

    const second = await secondPromise;
    expect(second.allowed).toBe(true);
  });

  it('should respect max queue size', async () => {
    // Fill concurrent
    await limiter.acquire('req-1');

    // Fill queue - catch rejections to avoid unhandled promise warnings
    const queuedPromises: Promise<unknown>[] = [];
    for (let i = 0; i < 5; i++) {
      queuedPromises.push(limiter.acquire(`queue-${i}`).catch(() => {}));
    }

    // Next should be rejected (queue full)
    const overflow = await limiter.acquire('overflow');
    expect(overflow.allowed).toBe(false);

    // Reset and wait for queued promises to settle
    limiter.reset();
    await Promise.allSettled(queuedPromises);
  });
});

describe('RateLimiterManager', () => {
  let manager: RateLimiterManager;

  beforeEach(() => {
    resetRateLimiter();
    manager = new RateLimiterManager();
  });

  afterEach(() => {
    manager.stop();
  });

  describe('getLimiter', () => {
    it('should create limiter for new provider', () => {
      const limiter = manager.getLimiter('anthropic');

      expect(limiter).toBeDefined();
      expect(limiter.getStatus().identifier).toBe('anthropic');
    });

    it('should return same limiter for same provider', () => {
      const first = manager.getLimiter('anthropic');
      const second = manager.getLimiter('anthropic');

      expect(first).toBe(second);
    });

    it('should use default config for unknown provider', () => {
      const limiter = manager.getLimiter('unknown-provider');

      expect(limiter).toBeDefined();
    });
  });

  describe('acquire/release', () => {
    it('should delegate to correct limiter', async () => {
      const result = await manager.acquire('anthropic', 'req-1');

      expect(result.allowed).toBe(true);

      manager.release('anthropic', 'req-1');
    });
  });

  describe('getAllStatus', () => {
    it('should return status for all active limiters', async () => {
      await manager.acquire('anthropic', 'req-1');
      await manager.acquire('openai', 'req-2');

      const statuses = manager.getAllStatus();

      expect(statuses.length).toBe(2);
    });
  });
});

describe('RateLimiterManager with Global Limit', () => {
  let manager: RateLimiterManager;

  beforeEach(() => {
    manager = new RateLimiterManager({
      enableGlobalLimit: true,
      globalMaxRequests: 3,
      globalConfig: {
        enableQueue: false, // Disable queue for tests
        maxConcurrent: 50,
      },
      providerConfigs: {
        // Disable queuing for tests
        anthropic: { enableQueue: false, maxConcurrent: 10 },
        openai: { enableQueue: false, maxConcurrent: 10 },
        ollama: { enableQueue: false, maxConcurrent: 10 },
        vllm: { enableQueue: false, maxConcurrent: 10 },
      },
    });
  });

  afterEach(() => {
    manager.stop();
  });

  it('should enforce global limit across providers', async () => {
    const r1 = await manager.acquire('anthropic', 'req-1');
    expect(r1.allowed).toBe(true);
    manager.release('anthropic', 'req-1'); // Release concurrent slot

    const r2 = await manager.acquire('openai', 'req-2');
    expect(r2.allowed).toBe(true);
    manager.release('openai', 'req-2');

    const r3 = await manager.acquire('ollama', 'req-3');
    expect(r3.allowed).toBe(true);
    manager.release('ollama', 'req-3');

    // Global request limit reached (3 requests in window)
    const result = await manager.acquire('vllm', 'req-4');
    expect(result.allowed).toBe(false);
  });
});

describe('Singleton functions', () => {
  afterEach(() => {
    resetRateLimiter();
  });

  it('should return same instance with getRateLimiterManager', () => {
    const first = getRateLimiterManager();
    const second = getRateLimiterManager();

    expect(first).toBe(second);
  });

  it('should create new instance with initializeRateLimiter', () => {
    const first = getRateLimiterManager();
    const second = initializeRateLimiter({});

    expect(first).not.toBe(second);
  });
});

describe('formatRateLimitStatus', () => {
  it('should format status correctly', () => {
    const status = {
      identifier: 'test',
      currentRequests: 5,
      maxRequests: 10,
      tokensUsed: 1000,
      maxTokensPerMinute: 10000,
      concurrentRequests: 2,
      maxConcurrent: 5,
      queuedRequests: 3,
      resetInMs: 30000,
      isLimited: false,
    };

    const formatted = formatRateLimitStatus(status);

    expect(formatted).toContain('test');
    expect(formatted).toContain('5/10');
    expect(formatted).toContain('🟢 OK');
  });

  it('should show limited status', () => {
    const status = {
      identifier: 'test',
      currentRequests: 10,
      maxRequests: 10,
      tokensUsed: 10000,
      maxTokensPerMinute: 10000,
      concurrentRequests: 5,
      maxConcurrent: 5,
      queuedRequests: 0,
      resetInMs: 5000,
      isLimited: true,
    };

    const formatted = formatRateLimitStatus(status);

    expect(formatted).toContain('🔴 LIMITED');
  });
});

describe('DEFAULT_RATE_LIMITS', () => {
  it('should have config for anthropic', () => {
    expect(DEFAULT_RATE_LIMITS.anthropic).toBeDefined();
    expect(DEFAULT_RATE_LIMITS.anthropic.maxRequests).toBeGreaterThan(0);
  });

  it('should have config for openai', () => {
    expect(DEFAULT_RATE_LIMITS.openai).toBeDefined();
    expect(DEFAULT_RATE_LIMITS.openai.maxRequests).toBeGreaterThan(0);
  });

  it('should have config for local providers', () => {
    expect(DEFAULT_RATE_LIMITS.ollama).toBeDefined();
    expect(DEFAULT_RATE_LIMITS.vllm).toBeDefined();
  });
});
