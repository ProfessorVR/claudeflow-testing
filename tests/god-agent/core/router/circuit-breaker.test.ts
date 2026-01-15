/**
 * Circuit Breaker Tests
 *
 * Tests for Phase 7.2: Production Hardening - Circuit Breakers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerManager,
  getCircuitBreakerManager,
  initializeCircuitBreaker,
  resetCircuitBreaker,
  formatCircuitStatus,
  formatAllCircuitStatus,
  getCircuitHealthSummary,
  DEFAULT_CIRCUIT_CONFIG,
  CIRCUIT_PRESETS,
} from '../../../../src/god-agent/core/router/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-provider', {
      failureThreshold: 3,
      successThreshold: 2,
      resetTimeoutMs: 100,
      failureWindowMs: 1000,
      minimumRequests: 2,
      failureRateThreshold: 0.5,
    });
  });

  afterEach(() => {
    breaker.reset();
  });

  describe('initial state', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe('closed');
      expect(breaker.isClosed()).toBe(true);
      expect(breaker.isOpen()).toBe(false);
    });

    it('should allow requests when closed', () => {
      expect(breaker.allowRequest()).toBe(true);
    });
  });

  describe('execute', () => {
    it('should return success on successful operation', async () => {
      const result = await breaker.execute(async () => 'success');

      expect(result.allowed).toBe(true);
      expect(result.result).toBe('success');
      expect(result.state).toBe('closed');
    });

    it('should return error on failed operation', async () => {
      const result = await breaker.execute(async () => {
        throw new Error('Operation failed');
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Operation failed');
    });

    it('should reject requests when open', async () => {
      // Force open state
      breaker.forceState('open');

      const result = await breaker.execute(async () => 'success');

      expect(result.allowed).toBe(false);
      expect(result.state).toBe('open');
    });
  });

  describe('state transitions', () => {
    it('should open after failure threshold', async () => {
      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      }

      expect(breaker.getState()).toBe('open');
    });

    it('should transition to half-open after reset timeout', async () => {
      breaker.forceState('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Try a request - should transition to half-open
      expect(breaker.allowRequest()).toBe(true);
      expect(breaker.getState()).toBe('half-open');
    });

    it('should close after successes in half-open', async () => {
      breaker.forceState('half-open');

      // Succeed twice
      await breaker.execute(async () => 'ok');
      await breaker.execute(async () => 'ok');

      expect(breaker.getState()).toBe('closed');
    });

    it('should reopen on failure in half-open', async () => {
      breaker.forceState('half-open');

      await breaker.execute(async () => {
        throw new Error('fail');
      });

      expect(breaker.getState()).toBe('open');
    });
  });

  describe('failure rate', () => {
    it('should open when failure rate exceeds threshold', async () => {
      // 2 failures, 1 success = 66% failure rate
      await breaker.execute(async () => { throw new Error('fail'); });
      await breaker.execute(async () => { throw new Error('fail'); });
      await breaker.execute(async () => 'ok');

      // With 50% threshold and min 2 requests, should be open
      expect(breaker.getState()).toBe('open');
    });
  });

  describe('getStatus', () => {
    it('should return correct status', async () => {
      // 2 successes, 1 failure = 33% failure rate (below 50% threshold)
      await breaker.execute(async () => 'ok');
      await breaker.execute(async () => 'ok');
      await breaker.execute(async () => { throw new Error('fail'); });

      const status = breaker.getStatus();

      expect(status.identifier).toBe('test-provider');
      expect(status.state).toBe('closed');
      expect(status.successes).toBe(2);
      expect(status.failures).toBe(1);
      expect(status.totalRequests).toBe(3);
      expect(status.failureRate).toBeCloseTo(0.333, 2);
    });
  });

  describe('events', () => {
    it('should emit state_change on transition', async () => {
      const handler = vi.fn();
      breaker.on('state_change', handler);

      breaker.forceState('open');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'state_change',
          previousState: 'closed',
          newState: 'open',
        })
      );
    });

    it('should emit failure events', async () => {
      const handler = vi.fn();
      breaker.on('failure', handler);

      await breaker.execute(async () => { throw new Error('fail'); });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit success events', async () => {
      const handler = vi.fn();
      breaker.on('success', handler);

      await breaker.execute(async () => 'ok');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit request_rejected when open', async () => {
      const handler = vi.fn();
      breaker.on('request_rejected', handler);

      breaker.forceState('open');
      await breaker.execute(async () => 'ok');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('forceState', () => {
    it('should force to open state', () => {
      breaker.forceState('open');

      expect(breaker.getState()).toBe('open');
      expect(breaker.isOpen()).toBe(true);
    });

    it('should force to half-open state', () => {
      breaker.forceState('half-open');

      expect(breaker.getState()).toBe('half-open');
    });

    it('should force to closed state', () => {
      breaker.forceState('open');
      breaker.forceState('closed');

      expect(breaker.getState()).toBe('closed');
      expect(breaker.isClosed()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', async () => {
      await breaker.execute(async () => { throw new Error('fail'); });
      await breaker.execute(async () => { throw new Error('fail'); });
      await breaker.execute(async () => { throw new Error('fail'); });

      expect(breaker.getState()).toBe('open');

      breaker.reset();

      expect(breaker.getState()).toBe('closed');
      expect(breaker.getStatus().totalRequests).toBe(0);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    resetCircuitBreaker();
    manager = new CircuitBreakerManager();
  });

  afterEach(() => {
    manager.resetAll();
  });

  describe('getBreaker', () => {
    it('should create breaker for new provider', () => {
      const breaker = manager.getBreaker('anthropic');

      expect(breaker).toBeDefined();
      expect(breaker.getStatus().identifier).toBe('anthropic');
    });

    it('should return same breaker for same provider', () => {
      const first = manager.getBreaker('anthropic');
      const second = manager.getBreaker('anthropic');

      expect(first).toBe(second);
    });
  });

  describe('execute', () => {
    it('should delegate to correct breaker', async () => {
      const result = await manager.execute('anthropic', async () => 'success');

      expect(result.allowed).toBe(true);
      expect(result.result).toBe('success');
    });
  });

  describe('allowRequest', () => {
    it('should return true for unknown provider', () => {
      expect(manager.allowRequest('new-provider')).toBe(true);
    });

    it('should return false for open circuit', async () => {
      const breaker = manager.getBreaker('failing');
      breaker.forceState('open');

      expect(manager.allowRequest('failing')).toBe(false);
    });
  });

  describe('getAllStatus', () => {
    it('should return status for all breakers', async () => {
      await manager.execute('provider-1', async () => 'ok');
      await manager.execute('provider-2', async () => 'ok');

      const statuses = manager.getAllStatus();

      expect(statuses.length).toBe(2);
    });
  });

  describe('getOpenCircuits', () => {
    it('should return providers with open circuits', () => {
      const breaker1 = manager.getBreaker('healthy');
      const breaker2 = manager.getBreaker('failing');
      breaker2.forceState('open');

      const open = manager.getOpenCircuits();

      expect(open).toContain('failing');
      expect(open).not.toContain('healthy');
    });
  });

  describe('getHealthyProviders', () => {
    it('should return providers with closed circuits', () => {
      const breaker1 = manager.getBreaker('healthy');
      const breaker2 = manager.getBreaker('failing');
      breaker2.forceState('open');

      const healthy = manager.getHealthyProviders();

      expect(healthy).toContain('healthy');
      expect(healthy).not.toContain('failing');
    });
  });

  describe('resetProvider', () => {
    it('should reset specific provider', () => {
      const breaker = manager.getBreaker('provider');
      breaker.forceState('open');

      manager.resetProvider('provider');

      expect(breaker.getState()).toBe('closed');
    });
  });
});

describe('CircuitBreakerManager with config', () => {
  it('should apply provider-specific config', async () => {
    const manager = new CircuitBreakerManager({
      providerConfigs: {
        strict: { failureThreshold: 2, minimumRequests: 1 },
      },
    });

    const breaker = manager.getBreaker('strict');

    // Two failures should open with threshold of 2
    await manager.execute('strict', async () => { throw new Error('fail'); });
    await manager.execute('strict', async () => { throw new Error('fail'); });

    expect(breaker.getState()).toBe('open');
  });

  it('should call event handler', async () => {
    const onEvent = vi.fn();
    const manager = new CircuitBreakerManager({ onEvent });

    await manager.execute('provider', async () => 'ok');

    expect(onEvent).toHaveBeenCalled();
  });
});

describe('Singleton functions', () => {
  afterEach(() => {
    resetCircuitBreaker();
  });

  it('should return same instance with getCircuitBreakerManager', () => {
    const first = getCircuitBreakerManager();
    const second = getCircuitBreakerManager();

    expect(first).toBe(second);
  });

  it('should create new instance with initializeCircuitBreaker', () => {
    const first = getCircuitBreakerManager();
    const second = initializeCircuitBreaker({});

    expect(first).not.toBe(second);
  });
});

describe('formatCircuitStatus', () => {
  it('should format closed circuit', () => {
    const status = {
      identifier: 'test',
      state: 'closed' as const,
      failures: 1,
      successes: 10,
      totalRequests: 11,
      failureRate: 0.09,
      nextAttemptMs: null,
      lastFailure: null,
      lastSuccess: Date.now(),
      openDuration: null,
      halfOpenSuccesses: 0,
    };

    const formatted = formatCircuitStatus(status);

    expect(formatted).toContain('test');
    expect(formatted).toContain('CLOSED');
    expect(formatted).toContain('🟢');
  });

  it('should format open circuit', () => {
    const status = {
      identifier: 'failing',
      state: 'open' as const,
      failures: 5,
      successes: 0,
      totalRequests: 5,
      failureRate: 1.0,
      nextAttemptMs: 25000,
      lastFailure: Date.now(),
      lastSuccess: null,
      openDuration: 5000,
      halfOpenSuccesses: 0,
    };

    const formatted = formatCircuitStatus(status);

    expect(formatted).toContain('OPEN');
    expect(formatted).toContain('🔴');
    expect(formatted).toContain('Next Attempt');
  });

  it('should format half-open circuit', () => {
    const status = {
      identifier: 'recovering',
      state: 'half-open' as const,
      failures: 3,
      successes: 1,
      totalRequests: 4,
      failureRate: 0.75,
      nextAttemptMs: null,
      lastFailure: Date.now() - 1000,
      lastSuccess: Date.now(),
      openDuration: 30000,
      halfOpenSuccesses: 1,
    };

    const formatted = formatCircuitStatus(status);

    expect(formatted).toContain('HALF-OPEN');
    expect(formatted).toContain('🟡');
    expect(formatted).toContain('Half-Open Successes');
  });
});

describe('formatAllCircuitStatus', () => {
  it('should handle empty list', () => {
    const formatted = formatAllCircuitStatus([]);
    expect(formatted).toContain('No circuit breakers');
  });

  it('should format multiple circuits', () => {
    const statuses = [
      {
        identifier: 'a',
        state: 'closed' as const,
        failures: 0,
        successes: 10,
        totalRequests: 10,
        failureRate: 0,
        nextAttemptMs: null,
        lastFailure: null,
        lastSuccess: Date.now(),
        openDuration: null,
        halfOpenSuccesses: 0,
      },
      {
        identifier: 'b',
        state: 'open' as const,
        failures: 5,
        successes: 0,
        totalRequests: 5,
        failureRate: 1.0,
        nextAttemptMs: 10000,
        lastFailure: Date.now(),
        lastSuccess: null,
        openDuration: 5000,
        halfOpenSuccesses: 0,
      },
    ];

    const formatted = formatAllCircuitStatus(statuses);

    expect(formatted).toContain('a');
    expect(formatted).toContain('b');
  });
});

describe('getCircuitHealthSummary', () => {
  it('should summarize circuit health', () => {
    const statuses = [
      { state: 'closed' as const },
      { state: 'closed' as const },
      { state: 'open' as const },
      { state: 'half-open' as const },
    ] as any[];

    const summary = getCircuitHealthSummary(statuses);

    expect(summary).toContain('🟢 2 healthy');
    expect(summary).toContain('🔴 1 open');
    expect(summary).toContain('🟡 1 recovering');
  });
});

describe('DEFAULT_CIRCUIT_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_CIRCUIT_CONFIG.failureThreshold).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.successThreshold).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.resetTimeoutMs).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.failureRateThreshold).toBeGreaterThan(0);
    expect(DEFAULT_CIRCUIT_CONFIG.failureRateThreshold).toBeLessThanOrEqual(1);
  });
});

describe('CIRCUIT_PRESETS', () => {
  it('should have sensitive preset', () => {
    expect(CIRCUIT_PRESETS.sensitive).toBeDefined();
    expect(CIRCUIT_PRESETS.sensitive.failureThreshold).toBeLessThan(
      DEFAULT_CIRCUIT_CONFIG.failureThreshold
    );
  });

  it('should have aggressive preset', () => {
    expect(CIRCUIT_PRESETS.aggressive).toBeDefined();
    expect(CIRCUIT_PRESETS.aggressive.failureThreshold).toBeGreaterThan(
      DEFAULT_CIRCUIT_CONFIG.failureThreshold
    );
  });

  it('should have local preset', () => {
    expect(CIRCUIT_PRESETS.local).toBeDefined();
  });
});
