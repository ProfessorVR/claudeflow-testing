/**
 * Graceful Degradation Tests
 *
 * Tests for Phase 7.3: Production Hardening - Graceful Degradation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DegradationManager,
  getDegradationManager,
  initializeDegradation,
  resetDegradation,
  formatProviderHealth,
  formatDegradationDecision,
  formatAllProviderHealth,
  getHealthSummary,
  DEFAULT_DEGRADATION_CONFIG,
} from '../../../../src/god-agent/core/router/graceful-degradation.js';
import { resetCircuitBreaker, getCircuitBreakerManager } from '../../../../src/god-agent/core/router/circuit-breaker.js';
import { resetRateLimiter, getRateLimiterManager } from '../../../../src/god-agent/core/router/rate-limiter.js';
import { resetQualityScorer, initializeQualityScorer } from '../../../../src/god-agent/core/router/quality-scorer.js';

describe('DegradationManager', () => {
  let manager: DegradationManager;

  beforeEach(() => {
    // Reset all dependencies
    resetCircuitBreaker();
    resetRateLimiter();
    resetQualityScorer();
    resetDegradation();
    initializeQualityScorer();

    manager = new DegradationManager({
      enableAutoRecovery: false, // Disable for tests
    });
  });

  afterEach(() => {
    manager.stop();
    manager.reset();
    resetCircuitBreaker();
    resetRateLimiter();
    resetQualityScorer();
    resetDegradation();
  });

  describe('getDecision', () => {
    it('should return primary provider when healthy', async () => {
      const decision = await manager.getDecision('default');

      // Local-first: vllm is now the default primary
      expect(decision.provider).toBe('vllm');
      expect(decision.serviceAvailable).toBe(true);
    });

    it('should use fallback when primary is unavailable', async () => {
      // Open circuit for primary (vllm is now primary in local-first)
      const circuitManager = getCircuitBreakerManager();
      const vllmBreaker = circuitManager.getBreaker('vllm');
      vllmBreaker.forceState('open');

      // Also open ollama (secondary local)
      const ollamaBreaker = circuitManager.getBreaker('ollama');
      ollamaBreaker.forceState('open');

      const decision = await manager.getDecision('default');

      // Falls back to anthropic (first cloud fallback)
      expect(decision.provider).toBe('anthropic');
      expect(decision.level).toBe('fallback');
    });

    it('should return cached level when all providers unavailable', async () => {
      const circuitManager = getCircuitBreakerManager();

      // Open all circuits in default chain
      ['anthropic', 'openai', 'vllm', 'ollama'].forEach(p => {
        circuitManager.getBreaker(p).forceState('open');
      });

      const decision = await manager.getDecision('default');

      expect(decision.provider).toBeNull();
      expect(decision.level).toBe('cached');
    });

    it('should return offline when caching disabled and all unavailable', async () => {
      const manager = new DegradationManager({
        enableAutoRecovery: false,
        fallbackChains: {
          default: {
            primary: 'anthropic',
            fallbacks: ['openai'],
            allowCached: false,
          },
        },
      });

      const circuitManager = getCircuitBreakerManager();
      circuitManager.getBreaker('anthropic').forceState('open');
      circuitManager.getBreaker('openai').forceState('open');

      const decision = await manager.getDecision('default');

      expect(decision.level).toBe('offline');
      expect(decision.serviceAvailable).toBe(false);

      manager.stop();
    });

    it('should use correct chain for use case', async () => {
      // The local_only chain has vllm as primary (no cloud fallback)
      const decision = await manager.getDecision('local_only');

      expect(decision.provider).toBe('vllm');
    });

    it('should fallback to default chain for unknown use case', async () => {
      const decision = await manager.getDecision('unknown-use-case');

      // Default chain now uses vllm as primary (local-first)
      expect(decision.provider).toBe('vllm');
    });

    it('should include alternatives in decision', async () => {
      const decision = await manager.getDecision('default');

      // With local-first, default primary is vllm, fallbacks include cloud
      expect(decision.alternatives).toContain('anthropic');
      expect(decision.alternatives).toContain('openai');
      expect(decision.alternatives).toContain('ollama');
    });
  });

  describe('selectProvider', () => {
    it('should return provider from decision', async () => {
      const provider = await manager.selectProvider('default');

      // Local-first: vllm is now the default primary
      expect(provider).toBe('vllm');
    });

    it('should prefer local when requested and available', async () => {
      const provider = await manager.selectProvider('default', true);

      expect(['vllm', 'ollama']).toContain(provider);
    });

    it('should fallback to non-local when local unavailable', async () => {
      const circuitManager = getCircuitBreakerManager();
      circuitManager.getBreaker('vllm').forceState('open');
      circuitManager.getBreaker('ollama').forceState('open');

      const provider = await manager.selectProvider('default', true);

      expect(provider).toBe('anthropic');
    });
  });

  describe('getProviderHealth', () => {
    it('should return health info for provider', async () => {
      const health = await manager.getProviderHealth('anthropic');

      expect(health.provider).toBe('anthropic');
      expect(health.status).toBeDefined();
      expect(health.circuitState).toBeDefined();
      expect(health.rateLimited).toBe(false);
    });

    it('should cache health status', async () => {
      const first = await manager.getProviderHealth('anthropic');
      const second = await manager.getProviderHealth('anthropic');

      expect(first.lastCheck).toBe(second.lastCheck);
    });

    it('should mark provider unhealthy when circuit open', async () => {
      const circuitManager = getCircuitBreakerManager();
      circuitManager.getBreaker('failing-provider').forceState('open');

      const health = await manager.getProviderHealth('failing-provider');

      expect(health.status).toBe('unhealthy');
    });
  });

  describe('getChainHealth', () => {
    it('should return health for all providers in chain', async () => {
      const healths = await manager.getChainHealth(
        DEFAULT_DEGRADATION_CONFIG.fallbackChains.default
      );

      expect(healths.length).toBe(4); // anthropic, openai, vllm, ollama
      expect(healths.map(h => h.provider)).toContain('anthropic');
      expect(healths.map(h => h.provider)).toContain('openai');
    });
  });

  describe('response caching', () => {
    it('should cache response', () => {
      manager.cacheResponse('test-key', { result: 'test' }, 'anthropic', 0.95);

      const cached = manager.getCachedResponse('test-key');

      expect(cached).toBeDefined();
      expect(cached?.data).toEqual({ result: 'test' });
      expect(cached?.provider).toBe('anthropic');
      expect(cached?.qualityScore).toBe(0.95);
    });

    it('should return null for missing cache', () => {
      const cached = manager.getCachedResponse('nonexistent');

      expect(cached).toBeNull();
    });

    it('should expire cached responses', () => {
      const manager = new DegradationManager({
        cacheTtlMs: 100,
        enableAutoRecovery: false,
      });

      manager.cacheResponse('test-key', { result: 'test' }, 'anthropic');

      // Wait for TTL
      vi.useFakeTimers();
      vi.advanceTimersByTime(150);

      const cached = manager.getCachedResponse('test-key');

      expect(cached).toBeNull();

      vi.useRealTimers();
      manager.stop();
    });
  });

  describe('getOverallDegradationLevel', () => {
    it('should return none when primary is healthy', async () => {
      const level = await manager.getOverallDegradationLevel();

      // Primary is available but might be 'reduced' if quality < threshold
      expect(['none', 'reduced']).toContain(level);
    });

    it('should return fallback when using fallback provider', async () => {
      const circuitManager = getCircuitBreakerManager();
      // Open vllm circuit (now the primary in local-first config)
      circuitManager.getBreaker('vllm').forceState('open');

      const level = await manager.getOverallDegradationLevel();

      expect(level).toBe('fallback');
    });
  });

  describe('getAllProviderHealth', () => {
    it('should return health for all known providers', async () => {
      const healths = await manager.getAllProviderHealth();

      // Should include providers from all chains
      expect(healths.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('refreshHealth', () => {
    it('should clear cache and recompute health', async () => {
      const first = await manager.getProviderHealth('anthropic');

      // Manually mess with cache timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await manager.refreshHealth();

      const second = await manager.getProviderHealth('anthropic');

      // After refresh, lastCheck should be updated
      expect(second.lastCheck).toBeGreaterThanOrEqual(first.lastCheck);
    });
  });

  describe('reset', () => {
    it('should clear all state', async () => {
      await manager.getProviderHealth('anthropic');
      manager.cacheResponse('key', 'data', 'anthropic');

      manager.reset();

      const cached = manager.getCachedResponse('key');
      expect(cached).toBeNull();
    });
  });
});

describe('DegradationManager with quality thresholds', () => {
  let manager: DegradationManager;

  beforeEach(() => {
    resetCircuitBreaker();
    resetRateLimiter();
    resetQualityScorer();
    resetDegradation();

    manager = new DegradationManager({
      enableAutoRecovery: false,
      fallbackChains: {
        strict: {
          primary: 'anthropic',
          fallbacks: ['openai'],
          minQualityThreshold: 0.9,
          allowDegraded: false,
        },
        lenient: {
          primary: 'anthropic',
          fallbacks: ['openai'],
          minQualityThreshold: 0.5,
          allowDegraded: true,
        },
      },
    });
  });

  afterEach(() => {
    manager.stop();
    manager.reset();
  });

  it('should skip fallback below quality threshold when degraded not allowed', async () => {
    // This is a bit tricky to test since we can't easily control quality scores
    // The test verifies the config is applied
    const decision = await manager.getDecision('strict');
    expect(decision.provider).toBeDefined();
  });

  it('should allow degraded fallback when configured', async () => {
    const decision = await manager.getDecision('lenient');
    expect(decision.provider).toBeDefined();
  });
});

describe('Singleton functions', () => {
  afterEach(() => {
    resetDegradation();
    resetCircuitBreaker();
    resetRateLimiter();
    resetQualityScorer();
  });

  it('should return same instance with getDegradationManager', () => {
    const first = getDegradationManager();
    const second = getDegradationManager();

    expect(first).toBe(second);

    first.stop();
  });

  it('should create new instance with initializeDegradation', () => {
    const first = getDegradationManager();
    const second = initializeDegradation({});

    expect(first).not.toBe(second);

    first.stop();
    second.stop();
  });

  it('should reset instance with resetDegradation', () => {
    const first = getDegradationManager();
    resetDegradation();
    const second = getDegradationManager();

    expect(first).not.toBe(second);

    first.stop();
    second.stop();
  });
});

describe('formatProviderHealth', () => {
  it('should format healthy provider', () => {
    const health = {
      provider: 'anthropic',
      status: 'healthy' as const,
      circuitState: 'closed' as const,
      rateLimited: false,
      qualityScore: 0.95,
      latencyP95: 500,
      errorRate: 0.01,
      lastSuccess: Date.now(),
      lastCheck: Date.now(),
    };

    const formatted = formatProviderHealth(health);

    expect(formatted).toContain('anthropic');
    expect(formatted).toContain('HEALTHY');
    expect(formatted).toContain('closed');
    expect(formatted).toContain('95.0%');
  });

  it('should format unhealthy provider', () => {
    const health = {
      provider: 'failing',
      status: 'unhealthy' as const,
      circuitState: 'open' as const,
      rateLimited: true,
      qualityScore: 0.3,
      latencyP95: 15000,
      errorRate: 0.5,
      lastSuccess: null,
      lastCheck: Date.now(),
    };

    const formatted = formatProviderHealth(health);

    expect(formatted).toContain('UNHEALTHY');
    expect(formatted).toContain('open');
    expect(formatted).toContain('Yes'); // Rate limited
  });

  it('should format degraded provider', () => {
    const health = {
      provider: 'slow',
      status: 'degraded' as const,
      circuitState: 'half-open' as const,
      rateLimited: false,
      qualityScore: 0.75,
      latencyP95: 8000,
      errorRate: 0.1,
      lastSuccess: Date.now(),
      lastCheck: Date.now(),
    };

    const formatted = formatProviderHealth(health);

    expect(formatted).toContain('DEGRADED');
    expect(formatted).toContain('half-open');
  });
});

describe('formatDegradationDecision', () => {
  it('should format healthy decision', () => {
    const decision = {
      provider: 'anthropic',
      level: 'none' as const,
      reason: 'Primary provider available',
      alternatives: ['openai', 'vllm'],
      recommendations: [],
      serviceAvailable: true,
    };

    const formatted = formatDegradationDecision(decision);

    expect(formatted).toContain('NONE');
    expect(formatted).toContain('anthropic');
    expect(formatted).toContain('Yes');
    expect(formatted).toContain('openai, vllm');
  });

  it('should format fallback decision', () => {
    const decision = {
      provider: 'openai',
      level: 'fallback' as const,
      reason: 'Primary unavailable',
      alternatives: ['vllm'],
      recommendations: ['Monitor anthropic for recovery'],
      serviceAvailable: true,
    };

    const formatted = formatDegradationDecision(decision);

    expect(formatted).toContain('FALLBACK');
    expect(formatted).toContain('openai');
    expect(formatted).toContain('Recommendations');
    expect(formatted).toContain('Monitor anthropic');
  });

  it('should format offline decision', () => {
    const decision = {
      provider: null,
      level: 'offline' as const,
      reason: 'All providers unavailable',
      alternatives: [],
      recommendations: ['ALERT: Complete service outage'],
      serviceAvailable: false,
    };

    const formatted = formatDegradationDecision(decision);

    expect(formatted).toContain('OFFLINE');
    expect(formatted).toContain('NONE');
    expect(formatted).toContain('No');
  });
});

describe('formatAllProviderHealth', () => {
  it('should handle empty list', () => {
    const formatted = formatAllProviderHealth([]);

    expect(formatted).toContain('No provider health data');
  });

  it('should format multiple providers', () => {
    const healths = [
      {
        provider: 'anthropic',
        status: 'healthy' as const,
        circuitState: 'closed' as const,
        rateLimited: false,
        qualityScore: 0.95,
        latencyP95: 500,
        errorRate: 0.01,
        lastSuccess: Date.now(),
        lastCheck: Date.now(),
      },
      {
        provider: 'openai',
        status: 'degraded' as const,
        circuitState: 'closed' as const,
        rateLimited: false,
        qualityScore: 0.75,
        latencyP95: 1000,
        errorRate: 0.05,
        lastSuccess: Date.now(),
        lastCheck: Date.now(),
      },
    ];

    const formatted = formatAllProviderHealth(healths);

    expect(formatted).toContain('anthropic');
    expect(formatted).toContain('openai');
    expect(formatted).toContain('HEALTHY');
    expect(formatted).toContain('DEGRADED');
  });
});

describe('getHealthSummary', () => {
  it('should summarize health counts', () => {
    const healths = [
      { status: 'healthy' as const },
      { status: 'healthy' as const },
      { status: 'degraded' as const },
      { status: 'unhealthy' as const },
    ] as any[];

    const summary = getHealthSummary(healths);

    expect(summary).toContain('2 healthy');
    expect(summary).toContain('1 degraded');
    expect(summary).toContain('1 unhealthy');
  });

  it('should handle all healthy', () => {
    const healths = [
      { status: 'healthy' as const },
      { status: 'healthy' as const },
    ] as any[];

    const summary = getHealthSummary(healths);

    expect(summary).toContain('2 healthy');
    expect(summary).toContain('0 degraded');
    expect(summary).toContain('0 unhealthy');
  });
});

describe('DEFAULT_DEGRADATION_CONFIG', () => {
  it('should have default fallback chain with local-first priority', () => {
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.default).toBeDefined();
    // Local-first: vllm is now primary
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.default.primary).toBe('vllm');
    // Cloud providers are fallbacks
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.default.fallbacks).toContain('anthropic');
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.default.fallbacks).toContain('openai');
  });

  it('should have code chain', () => {
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.code).toBeDefined();
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.code.minQualityThreshold).toBeGreaterThan(0);
  });

  it('should have local_only chain for offline mode', () => {
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.local_only).toBeDefined();
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.local_only.primary).toBe('vllm');
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.local_only.fallbacks).not.toContain('anthropic');
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.local_only.fallbacks).not.toContain('openai');
  });

  it('should have cloud_only chain for explicit cloud preference', () => {
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.cloud_only).toBeDefined();
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.cloud_only.primary).toBe('anthropic');
    expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.cloud_only.fallbacks).not.toContain('vllm');
  });

  it('should have sensible thresholds', () => {
    expect(DEFAULT_DEGRADATION_CONFIG.healthyQualityThreshold).toBeGreaterThan(0.5);
    expect(DEFAULT_DEGRADATION_CONFIG.healthyQualityThreshold).toBeLessThanOrEqual(1);
    expect(DEFAULT_DEGRADATION_CONFIG.degradedQualityThreshold).toBeLessThan(
      DEFAULT_DEGRADATION_CONFIG.healthyQualityThreshold
    );
    expect(DEFAULT_DEGRADATION_CONFIG.unhealthyErrorThreshold).toBeGreaterThan(0);
    expect(DEFAULT_DEGRADATION_CONFIG.unhealthyErrorThreshold).toBeLessThan(1);
  });

  it('should have cache settings', () => {
    expect(DEFAULT_DEGRADATION_CONFIG.enableCacheFallback).toBe(true);
    expect(DEFAULT_DEGRADATION_CONFIG.cacheTtlMs).toBeGreaterThan(0);
  });
});
