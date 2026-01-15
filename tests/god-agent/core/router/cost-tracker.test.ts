/**
 * Cost Tracker Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Cost Tracking Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CostTracker,
  getCostTracker,
  initializeCostTracker,
  resetCostTracker,
  formatCostString,
  estimateMonthlyFromDaily,
  calculateAverageCostPerRequest,
} from '../../../../src/god-agent/core/router/cost-tracker.js';
import type { TokenUsage, CostBreakdown, TaskType } from '../../../../src/god-agent/core/router/router-types.js';

// Helper to create token usage
function createTokenUsage(input: number, output: number): TokenUsage {
  return { inputTokens: input, outputTokens: output, totalTokens: input + output };
}

// Helper to create cost breakdown
function createCostBreakdown(input: number, output: number): CostBreakdown {
  return { inputCost: input, outputCost: output, totalCost: input + output };
}

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    resetCostTracker();
    tracker = new CostTracker({ enabled: true });
  });

  afterEach(() => {
    resetCostTracker();
  });

  describe('Configuration', () => {
    it('should report enabled status', () => {
      expect(tracker.isEnabled()).toBe(true);

      const disabled = new CostTracker({ enabled: false });
      expect(disabled.isEnabled()).toBe(false);
    });

    it('should get and set budgets', () => {
      tracker.setBudgets({ daily: 10, weekly: 50 });
      const budgets = tracker.getBudgets();

      expect(budgets.daily).toBe(10);
      expect(budgets.weekly).toBe(50);
    });

    it('should get and set alerts', () => {
      tracker.setAlerts([
        { at: 80, action: 'warn' },
        { at: 100, action: 'fallback_to_local' },
      ]);
      const alerts = tracker.getAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts[0].at).toBe(80);
    });
  });

  describe('Recording', () => {
    it('should record cost entry', () => {
      const record = tracker.recordCost(
        'gpt-4o',
        'openai',
        createTokenUsage(1000, 500),
        createCostBreakdown(0.01, 0.02),
        'code_edit'
      );

      expect(record.id).toBeDefined();
      expect(record.model).toBe('gpt-4o');
      expect(record.provider).toBe('openai');
      expect(record.cost.totalCost).toBe(0.03);
    });

    it('should retrieve record by ID', () => {
      const record = tracker.recordCost(
        'gpt-4o',
        'openai',
        createTokenUsage(1000, 500),
        createCostBreakdown(0.01, 0.02),
        'code_edit'
      );

      const retrieved = tracker.getRecord(record.id);
      expect(retrieved).toEqual(record);
    });

    it('should get all records', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.001, 0.002), 'code_edit');
      tracker.recordCost('claude', 'anthropic', createTokenUsage(200, 100), createCostBreakdown(0.002, 0.004), 'reasoning');

      const all = tracker.getAllRecords();
      expect(all).toHaveLength(2);
    });

    it('should get records for model', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.001, 0.002), 'code_edit');
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(200, 100), createCostBreakdown(0.002, 0.004), 'reasoning');
      tracker.recordCost('claude', 'anthropic', createTokenUsage(150, 75), createCostBreakdown(0.0015, 0.003), 'writing');

      const gpt4Records = tracker.getRecordsForModel('gpt-4o');
      expect(gpt4Records).toHaveLength(2);
    });

    it('should get records for provider', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.001, 0.002), 'code_edit');
      tracker.recordCost('deepseek', 'ollama', createTokenUsage(200, 100), createCostBreakdown(0, 0), 'code_edit');

      const openaiRecords = tracker.getRecordsForProvider('openai');
      expect(openaiRecords).toHaveLength(1);
    });

    it('should clear all records', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.001, 0.002), 'code_edit');
      tracker.clear();

      expect(tracker.getAllRecords()).toHaveLength(0);
    });

    it('should trim old records when over limit', () => {
      const smallTracker = new CostTracker({ maxRecords: 3 });

      for (let i = 0; i < 5; i++) {
        smallTracker.recordCost(`model-${i}`, 'openai', createTokenUsage(100, 50), createCostBreakdown(0.001, 0.002), 'code_edit');
      }

      expect(smallTracker.getAllRecords()).toHaveLength(3);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(1000, 500), createCostBreakdown(0.01, 0.02), 'code_edit');
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(2000, 1000), createCostBreakdown(0.02, 0.04), 'reasoning');
      tracker.recordCost('claude', 'anthropic', createTokenUsage(1500, 750), createCostBreakdown(0.015, 0.03), 'writing');
    });

    it('should calculate total cost', () => {
      const stats = tracker.getStats();
      expect(stats.totalCost).toBeCloseTo(0.135, 6);
    });

    it('should count requests', () => {
      const stats = tracker.getStats();
      expect(stats.requestCount).toBe(3);
    });

    it('should calculate total tokens', () => {
      const stats = tracker.getStats();
      expect(stats.totalTokens).toBe(6750);
    });

    it('should break down by model', () => {
      const stats = tracker.getStats();
      expect(stats.byModel['gpt-4o']).toBeCloseTo(0.09, 6);
      expect(stats.byModel['claude']).toBeCloseTo(0.045, 6);
    });

    it('should break down by task type', () => {
      const stats = tracker.getStats();
      expect(stats.byTaskType['code_edit']).toBeCloseTo(0.03, 6);
      expect(stats.byTaskType['reasoning']).toBeCloseTo(0.06, 6);
      expect(stats.byTaskType['writing']).toBeCloseTo(0.045, 6);
    });

    it('should get today cost', () => {
      const todayCost = tracker.getTodayCost();
      expect(todayCost).toBeCloseTo(0.135, 6);
    });

    it('should get week cost', () => {
      const weekCost = tracker.getWeekCost();
      expect(weekCost).toBeCloseTo(0.135, 6);
    });

    it('should get month cost', () => {
      const monthCost = tracker.getMonthCost();
      expect(monthCost).toBeCloseTo(0.135, 6);
    });
  });

  describe('Budget Status', () => {
    it('should calculate budget percentages', () => {
      tracker.setBudgets({ daily: 1.0, weekly: 5.0, monthly: 20.0 });
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(1000, 500), createCostBreakdown(0.1, 0.2), 'code_edit');

      const status = tracker.getBudgetStatus();

      expect(status.daily.used).toBeCloseTo(0.3, 6);
      expect(status.daily.percentage).toBeCloseTo(30, 1);
      expect(status.weekly.percentage).toBeCloseTo(6, 1);
      expect(status.monthly.percentage).toBeCloseTo(1.5, 1);
    });

    it('should detect budget exceeded', () => {
      tracker.setBudgets({ daily: 0.1 });
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(1000, 500), createCostBreakdown(0.05, 0.06), 'code_edit');

      const result = tracker.isBudgetExceeded();
      expect(result.exceeded).toBe(true);
      expect(result.period).toBe('daily');
    });

    it('should not report exceeded when under budget', () => {
      tracker.setBudgets({ daily: 10.0 });
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.001, 0.002), 'code_edit');

      const result = tracker.isBudgetExceeded();
      expect(result.exceeded).toBe(false);
    });

    it('should get remaining budget', () => {
      tracker.setBudgets({ daily: 1.0 });
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.1, 0.2), 'code_edit');

      const remaining = tracker.getRemainingBudget('daily');
      expect(remaining).toBeCloseTo(0.7, 6);
    });

    it('should return null for unset budget', () => {
      const remaining = tracker.getRemainingBudget('daily');
      expect(remaining).toBeNull();
    });
  });

  describe('Reporting', () => {
    it('should get cost by model', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.01, 0.02), 'code_edit');
      tracker.recordCost('claude', 'anthropic', createTokenUsage(200, 100), createCostBreakdown(0.02, 0.04), 'reasoning');

      const byModel = tracker.getCostByModel();
      expect(byModel.get('gpt-4o')).toBeCloseTo(0.03, 6);
      expect(byModel.get('claude')).toBeCloseTo(0.06, 6);
    });

    it('should get cost by provider', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.01, 0.02), 'code_edit');
      tracker.recordCost('deepseek', 'ollama', createTokenUsage(200, 100), createCostBreakdown(0, 0), 'code_edit');

      const byProvider = tracker.getCostByProvider();
      expect(byProvider.get('openai')).toBeCloseTo(0.03, 6);
      expect(byProvider.get('ollama')).toBe(0);
    });

    it('should get cost by task type', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.01, 0.02), 'code_edit');
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(200, 100), createCostBreakdown(0.02, 0.04), 'reasoning');

      const byTaskType = tracker.getCostByTaskType();
      expect(byTaskType.get('code_edit')).toBeCloseTo(0.03, 6);
      expect(byTaskType.get('reasoning')).toBeCloseTo(0.06, 6);
    });

    it('should get daily costs breakdown', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.01, 0.02), 'code_edit');

      const dailyCosts = tracker.getDailyCosts(7);
      expect(dailyCosts.size).toBeGreaterThanOrEqual(1);
    });

    it('should format report', () => {
      tracker.setBudgets({ daily: 10.0 });
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.01, 0.02), 'code_edit');

      const report = tracker.formatReport();
      expect(report).toContain('Cost Report');
      expect(report).toContain('Total Cost');
      expect(report).toContain('gpt-4o');
    });
  });

  describe('Events', () => {
    it('should emit budget warning event', () => {
      const handler = vi.fn();
      tracker.on('budget_warning', handler);
      tracker.setBudgets({ daily: 0.10 });
      tracker.setAlerts([{ at: 80, action: 'warn' }]);

      // Record cost that's 85% of daily budget (triggers warning but not exceeded)
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.04, 0.045), 'code_edit');

      expect(handler).toHaveBeenCalled();
    });

    it('should emit budget exceeded event', () => {
      const handler = vi.fn();
      tracker.on('budget_exceeded', handler);
      tracker.setBudgets({ daily: 0.02 });
      tracker.setAlerts([{ at: 100, action: 'block' }]);

      // Record cost that exceeds daily budget
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.02, 0.03), 'code_edit');

      expect(handler).toHaveBeenCalled();
    });

    it('should remove event handler', () => {
      const handler = vi.fn();
      tracker.on('budget_warning', handler);
      tracker.off('budget_warning', handler);
      tracker.setBudgets({ daily: 0.01 });
      tracker.setAlerts([{ at: 80, action: 'warn' }]);

      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.02, 0.03), 'code_edit');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Export/Import', () => {
    it('should export to JSON', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.01, 0.02), 'code_edit');

      const json = tracker.exportToJson();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].model).toBe('gpt-4o');
    });

    it('should import from JSON', () => {
      tracker.recordCost('gpt-4o', 'openai', createTokenUsage(100, 50), createCostBreakdown(0.01, 0.02), 'code_edit');
      const json = tracker.exportToJson();

      tracker.clear();
      const imported = tracker.importFromJson(json);

      expect(imported).toBe(1);
      expect(tracker.getAllRecords()).toHaveLength(1);
    });
  });
});

describe('Singleton Pattern', () => {
  beforeEach(() => {
    resetCostTracker();
  });

  afterEach(() => {
    resetCostTracker();
  });

  it('should return same instance', () => {
    const tracker1 = getCostTracker();
    const tracker2 = getCostTracker();
    expect(tracker1).toBe(tracker2);
  });

  it('should reset singleton', () => {
    const tracker1 = getCostTracker();
    resetCostTracker();
    const tracker2 = getCostTracker();
    expect(tracker1).not.toBe(tracker2);
  });

  it('should initialize with config', () => {
    const tracker = initializeCostTracker({ enabled: true, budgets: { daily: 5.0 } });
    expect(tracker.getBudgets().daily).toBe(5.0);
  });
});

describe('Utility Functions', () => {
  describe('formatCostString', () => {
    it('should format small costs with 4 decimals', () => {
      expect(formatCostString(0.0001)).toBe('$0.0001');
    });

    it('should format medium costs with 3 decimals', () => {
      expect(formatCostString(0.123)).toBe('$0.123');
    });

    it('should format large costs with 2 decimals', () => {
      expect(formatCostString(12.345)).toBe('$12.35');
    });
  });

  describe('estimateMonthlyFromDaily', () => {
    it('should multiply daily by 30', () => {
      expect(estimateMonthlyFromDaily(1)).toBe(30);
      expect(estimateMonthlyFromDaily(0.5)).toBe(15);
    });
  });

  describe('calculateAverageCostPerRequest', () => {
    it('should calculate average', () => {
      expect(calculateAverageCostPerRequest(10, 5)).toBe(2);
    });

    it('should handle zero requests', () => {
      expect(calculateAverageCostPerRequest(10, 0)).toBe(0);
    });
  });
});
