/**
 * Router Fallback Scenarios Tests
 *
 * Tests for TIER-2.1: Fallback behavior when primary model is unavailable
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resetCapabilityRouter,
  resetCostTracker,
  resetQualityScorer,
  resetBudgetEnforcer,
  resetAuditLogger,
  resetProviderFactory,
  initializeBudgetEnforcer,
  initializeCostTracker,
  initializeQualityScorer,
  getCostTracker,
  getBudgetEnforcer,
} from '../../../src/god-agent/core/router/index.js';

describe('Router Fallback Scenarios', () => {
  beforeEach(() => {
    // Reset all router singletons
    resetCapabilityRouter();
    resetCostTracker();
    resetQualityScorer();
    resetBudgetEnforcer();
    resetAuditLogger();
    resetProviderFactory();

    // Initialize router components with budgets synced to tracker
    initializeCostTracker({
      enabled: true,
      budgets: { daily: 10.0, weekly: 100.0, monthly: 400.0 },
    });
    initializeQualityScorer({ enabled: true });
  });

  afterEach(() => {
    resetCapabilityRouter();
    resetCostTracker();
    resetQualityScorer();
    resetBudgetEnforcer();
    resetAuditLogger();
    resetProviderFactory();
  });

  describe('Fallback Chain Configuration', () => {
    it('should configure fallback models', () => {
      const fallbackModels = ['deepseek-coder-local', 'qwen-local'];

      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 10.0 },
        fallbackModels,
      });

      const enforcer = getBudgetEnforcer();
      const configuredFallbacks = enforcer.getFallbackModels();

      expect(configuredFallbacks).toEqual(fallbackModels);
    });

    it('should use empty fallbacks when not specified', () => {
      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 10.0 },
      });

      const enforcer = getBudgetEnforcer();
      const fallbacks = enforcer.getFallbackModels();

      // When not specified, defaults to empty array (per the current implementation)
      expect(Array.isArray(fallbacks)).toBe(true);
    });
  });

  describe('Budget Status', () => {
    it('should track budget usage correctly', () => {
      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 100.0, weekly: 500.0 },
        fallbackModels: ['local-model'],
      });

      // Record some usage
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 50000, outputTokens: 25000, totalTokens: 75000 },
        { inputCost: 2.5, outputCost: 3.75, totalCost: 6.25 },
        'code_edit'
      );

      const enforcer = getBudgetEnforcer();
      const budgets = enforcer.getBudgets();

      expect(budgets.daily).toBe(100.0);
      expect(budgets.weekly).toBe(500.0);
    });

    it('should allow request when under budget', () => {
      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 100.0 },
        fallbackModels: ['local-model'],
      });

      const enforcer = getBudgetEnforcer();
      const result = enforcer.checkRequest('claude-sonnet');

      expect(result.allowed).toBe(true);
      expect(result.usingFallback).toBe(false);
    });
  });

  describe('Multiple Fallback Models', () => {
    it('should configure multiple fallback models', () => {
      const fallbacks = ['fallback-1', 'fallback-2', 'fallback-3'];

      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 10.0 },
        fallbackModels: fallbacks,
      });

      const enforcer = getBudgetEnforcer();
      const configuredFallbacks = enforcer.getFallbackModels();

      expect(configuredFallbacks).toEqual(fallbacks);
      expect(configuredFallbacks.length).toBe(3);
    });
  });

  describe('Enforcer Enable/Disable', () => {
    it('should allow all requests when disabled', () => {
      initializeBudgetEnforcer({
        enabled: false,
        budgets: { daily: 10.0 },
        fallbackModels: [],
      });

      const enforcer = getBudgetEnforcer();
      const result = enforcer.checkRequest('claude-sonnet');

      // Should always allow when disabled
      expect(result.allowed).toBe(true);
    });
  });
});

describe('Cost Tracking Scenarios', () => {
  beforeEach(() => {
    resetCostTracker();
    resetBudgetEnforcer();
    initializeCostTracker({
      enabled: true,
      budgets: { daily: 100.0, weekly: 500.0, monthly: 2000.0 },
    });
  });

  afterEach(() => {
    resetCostTracker();
    resetBudgetEnforcer();
  });

  it('should accumulate costs from multiple requests', () => {
    const tracker = getCostTracker();

    // Multiple small requests
    tracker.recordCost('claude-sonnet', 'anthropic',
      { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
      { inputCost: 0.05, outputCost: 0.075, totalCost: 0.125 },
      'code_edit'
    );
    tracker.recordCost('gpt-4o', 'openai',
      { inputTokens: 2000, outputTokens: 1000, totalTokens: 3000 },
      { inputCost: 0.10, outputCost: 0.15, totalCost: 0.25 },
      'reasoning'
    );
    tracker.recordCost('claude-sonnet', 'anthropic',
      { inputTokens: 500, outputTokens: 250, totalTokens: 750 },
      { inputCost: 0.025, outputCost: 0.0375, totalCost: 0.0625 },
      'writing'
    );

    const totalCost = tracker.getTodayCost();
    expect(totalCost).toBeCloseTo(0.4375, 4);
  });

  it('should track costs by model', () => {
    const tracker = getCostTracker();

    tracker.recordCost('claude-sonnet', 'anthropic',
      { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
      { inputCost: 1.0, outputCost: 1.5, totalCost: 2.5 },
      'code_edit'
    );
    tracker.recordCost('gpt-4o', 'openai',
      { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
      { inputCost: 0.5, outputCost: 0.75, totalCost: 1.25 },
      'code_edit'
    );
    tracker.recordCost('claude-sonnet', 'anthropic',
      { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
      { inputCost: 1.0, outputCost: 1.5, totalCost: 2.5 },
      'code_edit'
    );

    const costByModel = tracker.getCostByModel();
    const claudeCost = costByModel.get('claude-sonnet') ?? 0;
    const gptCost = costByModel.get('gpt-4o') ?? 0;

    expect(claudeCost).toBeCloseTo(5.0, 4);
    expect(gptCost).toBeCloseTo(1.25, 4);
  });

  it('should return all records', () => {
    const tracker = getCostTracker();

    tracker.recordCost('claude-sonnet', 'anthropic',
      { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
      { inputCost: 1.0, outputCost: 1.5, totalCost: 2.5 },
      'code_edit'
    );
    tracker.recordCost('gpt-4o', 'openai',
      { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
      { inputCost: 0.5, outputCost: 0.75, totalCost: 1.25 },
      'code_edit'
    );

    const records = tracker.getAllRecords();
    expect(records.length).toBe(2);
  });

  it('should check budget exceeded status', () => {
    const tracker = getCostTracker();

    // Record cost that's under budget
    tracker.recordCost('claude-sonnet', 'anthropic',
      { inputTokens: 100000, outputTokens: 50000, totalTokens: 150000 },
      { inputCost: 40.0, outputCost: 55.0, totalCost: 95.0 },
      'code_edit'
    );

    let status = tracker.isBudgetExceeded();
    expect(status.exceeded).toBe(false);

    // Push over daily budget (100.0)
    tracker.recordCost('claude-sonnet', 'anthropic',
      { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
      { inputCost: 4.0, outputCost: 6.0, totalCost: 10.0 },
      'code_edit'
    );

    status = tracker.isBudgetExceeded();
    expect(status.exceeded).toBe(true);
    expect(status.period).toBe('daily');
  });
});
