/**
 * Budget Enforcer Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Budget Enforcement Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BudgetEnforcer,
  getBudgetEnforcer,
  initializeBudgetEnforcer,
  resetBudgetEnforcer,
} from '../../../../src/god-agent/core/router/budget-enforcer.js';
import {
  CostTracker,
  resetCostTracker,
} from '../../../../src/god-agent/core/router/cost-tracker.js';
import { BudgetExceededError } from '../../../../src/god-agent/core/router/router-types.js';
import type { CostBreakdown } from '../../../../src/god-agent/core/router/router-types.js';

// Helper to create cost breakdown
function createCostBreakdown(input: number, output: number): CostBreakdown {
  return { inputCost: input, outputCost: output, totalCost: input + output };
}

describe('BudgetEnforcer', () => {
  let enforcer: BudgetEnforcer;
  let tracker: CostTracker;

  beforeEach(() => {
    resetCostTracker();
    resetBudgetEnforcer();
    tracker = new CostTracker({ enabled: true });
    enforcer = new BudgetEnforcer(
      {
        enabled: true,
        budgets: { daily: 1.0, weekly: 5.0, monthly: 20.0 },
        fallbackModels: ['deepseek-local', 'qwen-local'],
        blockOnBudgetExceeded: true,
        gracePercentage: 5,
      },
      tracker
    );
  });

  afterEach(() => {
    resetCostTracker();
    resetBudgetEnforcer();
  });

  describe('Configuration', () => {
    it('should report enabled status', () => {
      expect(enforcer.isEnabled()).toBe(true);

      const disabled = new BudgetEnforcer({ enabled: false }, tracker);
      expect(disabled.isEnabled()).toBe(false);
    });

    it('should get budgets', () => {
      const budgets = enforcer.getBudgets();
      expect(budgets.daily).toBe(1.0);
      expect(budgets.weekly).toBe(5.0);
      expect(budgets.monthly).toBe(20.0);
    });

    it('should set budgets', () => {
      enforcer.setBudgets({ daily: 2.0 });
      expect(enforcer.getBudgets().daily).toBe(2.0);
    });

    it('should get fallback models', () => {
      const fallbacks = enforcer.getFallbackModels();
      expect(fallbacks).toContain('deepseek-local');
      expect(fallbacks).toContain('qwen-local');
    });

    it('should set fallback models', () => {
      enforcer.setFallbackModels(['new-local-model']);
      expect(enforcer.getFallbackModels()).toEqual(['new-local-model']);
    });
  });

  describe('Request Checking', () => {
    it('should allow request when under budget', () => {
      const result = enforcer.checkRequest('gpt-4o');

      expect(result.allowed).toBe(true);
      expect(result.usingFallback).toBe(false);
    });

    it('should allow request when disabled', () => {
      const disabled = new BudgetEnforcer({ enabled: false }, tracker);

      const result = disabled.checkRequest('gpt-4o');
      expect(result.allowed).toBe(true);
    });

    it('should warn when approaching budget limit', () => {
      // Use 85% of daily budget
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        createCostBreakdown(0.4, 0.45),
        'code_edit'
      );

      const result = enforcer.checkRequest('gpt-4o');

      expect(result.allowed).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('85');
    });

    it('should use fallback when budget exceeded', () => {
      // Exceed daily budget
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
        createCostBreakdown(0.5, 0.6),
        'code_edit'
      );

      const result = enforcer.checkRequest('gpt-4o');

      expect(result.allowed).toBe(true);
      expect(result.usingFallback).toBe(true);
      expect(result.fallbackModel).toBeDefined();
    });

    it('should block when budget exceeded and no fallback', () => {
      const noFallback = new BudgetEnforcer(
        {
          enabled: true,
          budgets: { daily: 0.5 },
          fallbackModels: [],
          blockOnBudgetExceeded: true,
          gracePercentage: 5,
        },
        tracker
      );

      // Exceed daily budget
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
        createCostBreakdown(0.3, 0.3),
        'code_edit'
      );

      const result = noFallback.checkRequest('gpt-4o');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeded');
    });

    it('should include budget status when blocked', () => {
      const noFallback = new BudgetEnforcer(
        {
          enabled: true,
          budgets: { daily: 0.5 },
          fallbackModels: [],
          blockOnBudgetExceeded: true,
          gracePercentage: 5,
        },
        tracker
      );

      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
        createCostBreakdown(0.3, 0.3),
        'code_edit'
      );

      const result = noFallback.checkRequest('gpt-4o');

      expect(result.budgetStatus).not.toBeNull();
      expect(result.budgetStatus?.period).toBe('daily');
    });
  });

  describe('Pre-Request Check', () => {
    it('should perform pre-request check', () => {
      const getCost = (input: number, output: number) => createCostBreakdown(input * 0.00001, output * 0.00002);

      const result = enforcer.preRequestCheck('gpt-4o', 1000, 500, getCost);

      expect(result.canProceed).toBe(true);
      expect(result.modelToUse).toBe('gpt-4o');
      expect(result.isFallback).toBe(false);
    });

    it('should switch to fallback in pre-request check', () => {
      // Exceed budget
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
        createCostBreakdown(0.5, 0.6),
        'code_edit'
      );

      const getCost = (input: number, output: number) => createCostBreakdown(0.1, 0.1);

      const result = enforcer.preRequestCheck('gpt-4o', 1000, 500, getCost);

      expect(result.canProceed).toBe(true);
      expect(result.isFallback).toBe(true);
      expect(result.modelToUse).not.toBe('gpt-4o');
    });
  });

  describe('Enforce or Throw', () => {
    it('should not throw when under budget', () => {
      expect(() => enforcer.enforceOrThrow('gpt-4o')).not.toThrow();
    });

    it('should throw BudgetExceededError when budget exceeded', () => {
      const noFallback = new BudgetEnforcer(
        {
          enabled: true,
          budgets: { daily: 0.5 },
          fallbackModels: [],
          blockOnBudgetExceeded: true,
          gracePercentage: 5,
        },
        tracker
      );

      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
        createCostBreakdown(0.3, 0.3),
        'code_edit'
      );

      expect(() => noFallback.enforceOrThrow('gpt-4o')).toThrow(BudgetExceededError);
    });
  });

  describe('Fallback Selection', () => {
    it('should prefer local/ollama models', () => {
      enforcer.setFallbackModels(['gpt-4o-mini', 'ollama-qwen', 'local-deepseek']);

      const fallback = enforcer.getFallbackForBudget();

      // Should pick one with ollama or local in name
      expect(fallback).toMatch(/ollama|local/i);
    });

    it('should return first fallback if no local models', () => {
      enforcer.setFallbackModels(['gpt-4o-mini', 'gpt-3.5-turbo']);

      const fallback = enforcer.getFallbackForBudget();

      expect(fallback).toBe('gpt-4o-mini');
    });

    it('should return null when no fallbacks configured', () => {
      enforcer.setFallbackModels([]);

      const fallback = enforcer.getFallbackForBudget();

      expect(fallback).toBeNull();
    });
  });

  describe('Cost Estimation', () => {
    it('should check if request will exceed budget', () => {
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        createCostBreakdown(0.4, 0.4),
        'code_edit'
      );

      const result = enforcer.willExceedBudget(0.3);

      expect(result.willExceed).toBe(true);
      expect(result.period).toBe('daily');
    });

    it('should not report exceed when under budget', () => {
      const result = enforcer.willExceedBudget(0.1);

      expect(result.willExceed).toBe(false);
    });

    it('should get remaining budget', () => {
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        createCostBreakdown(0.1, 0.2),
        'code_edit'
      );

      const remaining = enforcer.getRemainingBudget();

      expect(remaining.daily).toBeCloseTo(0.7, 2);
      expect(remaining.weekly).toBeCloseTo(4.7, 2);
      expect(remaining.monthly).toBeCloseTo(19.7, 2);
      expect(remaining.lowestRemaining?.period).toBe('daily');
    });

    it('should advise on expensive operations', () => {
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        createCostBreakdown(0.1, 0.1),
        'code_edit'
      );

      // 0.8 remaining daily, 0.4 is 50% of remaining
      expect(enforcer.shouldProceedWithExpensiveOperation(0.4, 0.5)).toBe(true);
      expect(enforcer.shouldProceedWithExpensiveOperation(0.5, 0.5)).toBe(false);
    });
  });

  describe('Events', () => {
    it('should emit budget_warning event', () => {
      const handler = vi.fn();
      enforcer.on('budget_warning', handler);

      // Record 85% of daily budget
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        createCostBreakdown(0.4, 0.45),
        'code_edit'
      );

      enforcer.checkRequest('gpt-4o');

      expect(handler).toHaveBeenCalled();
    });

    it('should emit fallback_triggered event', () => {
      const handler = vi.fn();
      enforcer.on('fallback_triggered', handler);

      // Exceed budget
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
        createCostBreakdown(0.5, 0.6),
        'code_edit'
      );

      enforcer.checkRequest('gpt-4o');

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].data.reason).toBe('budget_exceeded');
    });

    it('should emit budget_exceeded event when blocked', () => {
      const noFallback = new BudgetEnforcer(
        {
          enabled: true,
          budgets: { daily: 0.5 },
          fallbackModels: [],
          blockOnBudgetExceeded: true,
          gracePercentage: 5,
        },
        tracker
      );

      const handler = vi.fn();
      noFallback.on('budget_exceeded', handler);

      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 10000, outputTokens: 5000, totalTokens: 15000 },
        createCostBreakdown(0.3, 0.3),
        'code_edit'
      );

      noFallback.checkRequest('gpt-4o');

      expect(handler).toHaveBeenCalled();
    });

    it('should remove event handler', () => {
      const handler = vi.fn();
      enforcer.on('budget_warning', handler);
      enforcer.off('budget_warning', handler);

      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        createCostBreakdown(0.4, 0.45),
        'code_edit'
      );

      enforcer.checkRequest('gpt-4o');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Reporting', () => {
    it('should generate enforcement summary', () => {
      tracker.recordCost('gpt-4o', 'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        createCostBreakdown(0.1, 0.2),
        'code_edit'
      );

      const summary = enforcer.getEnforcementSummary();

      expect(summary).toContain('Budget Enforcement Summary');
      expect(summary).toContain('Enforcement Enabled: Yes');
      expect(summary).toContain('Daily:');
      expect(summary).toContain('Fallback Models');
    });
  });
});

describe('Singleton Pattern', () => {
  beforeEach(() => {
    resetCostTracker();
    resetBudgetEnforcer();
  });

  afterEach(() => {
    resetCostTracker();
    resetBudgetEnforcer();
  });

  it('should return same instance', () => {
    const enforcer1 = getBudgetEnforcer();
    const enforcer2 = getBudgetEnforcer();
    expect(enforcer1).toBe(enforcer2);
  });

  it('should reset singleton', () => {
    const enforcer1 = getBudgetEnforcer();
    resetBudgetEnforcer();
    const enforcer2 = getBudgetEnforcer();
    expect(enforcer1).not.toBe(enforcer2);
  });

  it('should initialize with config', () => {
    const enforcer = initializeBudgetEnforcer({
      budgets: { daily: 25.0 },
      fallbackModels: ['test-model'],
    });

    expect(enforcer.getBudgets().daily).toBe(25.0);
    expect(enforcer.getFallbackModels()).toContain('test-model');
  });
});
