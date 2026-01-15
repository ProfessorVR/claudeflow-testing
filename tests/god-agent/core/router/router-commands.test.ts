/**
 * Router Commands Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - CLI Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSessionState,
  resetSessionState,
  setLastResponseId,
  useModel,
  showRoutingStatus,
  suggestOptimizations,
  showCosts,
  setBudget,
  clearBudget,
  rateLastResponse,
  showQuality,
  showReviews,
  showReviewStats,
  executeRouterCommand,
  recordCompletedRequest,
  showRoutingStats,
  showRoutingPatterns,
  showRoutingEscalations,
  showRoutingSuggestions,
  showRoutingReport,
  showVLLMStatus,
  showVLLMModels,
  testVLLM,
  getForcedRoutingMode,
} from '../../../../src/god-agent/core/router/router-commands.js';
import { resetCostTracker, getCostTracker } from '../../../../src/god-agent/core/router/cost-tracker.js';
import { resetQualityScorer, getQualityScorer } from '../../../../src/god-agent/core/router/quality-scorer.js';
import { resetBudgetEnforcer, getBudgetEnforcer, initializeBudgetEnforcer } from '../../../../src/god-agent/core/router/budget-enforcer.js';
import { resetAuditLogger } from '../../../../src/god-agent/core/router/audit-logger.js';
import { resetReviewQueue } from '../../../../src/god-agent/core/router/review-queue.js';
import { resetProviderFactory, initializeProviderFactory } from '../../../../src/god-agent/core/router/providers/index.js';
import { resetCapabilityRouter } from '../../../../src/god-agent/core/router/capability-router.js';
import { resetOutcomeTracker } from '../../../../src/god-agent/core/router/outcome-tracker.js';
import { resetRoutingOptimizer } from '../../../../src/god-agent/core/router/routing-optimizer.js';

describe('Router Commands', () => {
  beforeEach(() => {
    // Reset all singletons
    resetSessionState();
    resetCostTracker();
    resetQualityScorer();
    resetBudgetEnforcer();
    resetAuditLogger();
    resetReviewQueue();
    resetProviderFactory();
    resetCapabilityRouter();
    resetOutcomeTracker();
    resetRoutingOptimizer();

    // Initialize with test config
    initializeBudgetEnforcer({
      enabled: true,
      budgets: { daily: 10.0, weekly: 50.0, monthly: 200.0 },
      fallbackModels: ['test-local'],
    });
  });

  afterEach(() => {
    resetSessionState();
    resetCostTracker();
    resetQualityScorer();
    resetBudgetEnforcer();
    resetAuditLogger();
    resetReviewQueue();
    resetProviderFactory();
    resetCapabilityRouter();
    resetOutcomeTracker();
    resetRoutingOptimizer();
  });

  describe('Session State', () => {
    it('should get initial session state', () => {
      const state = getSessionState();

      expect(state.forcedModel).toBeNull();
      expect(state.autoRouting).toBe(true);
      expect(state.lastResponseId).toBeNull();
    });

    it('should reset session state', () => {
      useModel('test-model');
      resetSessionState();

      const state = getSessionState();
      expect(state.forcedModel).toBeNull();
      expect(state.autoRouting).toBe(true);
    });

    it('should set last response ID', () => {
      setLastResponseId('test-id-123');

      const state = getSessionState();
      expect(state.lastResponseId).toBe('test-id-123');
    });
  });

  describe('Use Model', () => {
    it('should switch to auto mode', () => {
      useModel('some-model');
      const result = useModel('auto');

      expect(result).toContain('auto-routing');
      expect(getSessionState().autoRouting).toBe(true);
      expect(getSessionState().forcedModel).toBeNull();
    });

    it('should report model not found', () => {
      const result = useModel('non-existent-model');

      expect(result).toContain('not found');
    });

    it('should report no local models when using local', () => {
      const result = useModel('local');

      expect(result).toContain('local');
    });
  });

  describe('Show Routing Status', () => {
    it('should show auto-routing mode', async () => {
      const status = await showRoutingStatus();

      expect(status).toContain('Routing Status');
      expect(status).toContain('Auto-routing');
    });

    it('should show budget status', async () => {
      const status = await showRoutingStatus();

      expect(status).toContain('Budget Status');
    });
  });

  describe('Suggest Optimizations', () => {
    it('should report insufficient data', () => {
      const suggestions = suggestOptimizations();

      expect(suggestions).toContain('Not enough quality data');
    });

    it('should show suggestions with quality data', () => {
      const scorer = getQualityScorer();

      // Add sample quality data
      for (let i = 0; i < 10; i++) {
        scorer.recordScore({
          model: 'gpt-4o',
          provider: 'openai',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 2000,
          tokensUsed: 1500,
          userRating: 4,
          userAccepted: true,
        });
      }

      const suggestions = suggestOptimizations();

      expect(suggestions).toContain('Optimization Suggestions');
    });
  });

  describe('Cost Commands', () => {
    beforeEach(() => {
      const tracker = getCostTracker();
      tracker.recordCost(
        'gpt-4o',
        'openai',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        { inputCost: 0.01, outputCost: 0.02, totalCost: 0.03 },
        'code_edit'
      );
    });

    it('should show cost summary', () => {
      const costs = showCosts();

      expect(costs).toContain('Cost Summary');
      expect(costs).toContain('Total Spent');
      expect(costs).toContain('Budget Status');
    });

    it('should show detailed costs', () => {
      const costs = showCosts(true);

      expect(costs).toContain('Cost by Model');
      expect(costs).toContain('gpt-4o');
    });

    it('should set budget', () => {
      const result = setBudget('daily', 15.0);

      expect(result).toContain('Daily');
      expect(result).toContain('15');

      const enforcer = getBudgetEnforcer();
      expect(enforcer.getBudgets().daily).toBe(15.0);
    });

    it('should clear budget', () => {
      const result = clearBudget('daily');

      expect(result).toContain('Daily');
      expect(result).toContain('removed');
    });
  });

  describe('Quality Commands', () => {
    it('should report no response to rate', () => {
      const result = rateLastResponse(5);

      expect(result).toContain('No response to rate');
    });

    it('should rate last response', () => {
      // Record a response first
      recordCompletedRequest(
        'gpt-4o',
        'openai',
        'code_edit',
        'medium',
        2000,
        1500,
        1000,
        500,
        0.01,
        0.02,
        true
      );

      const result = rateLastResponse(5);

      expect(result).toContain('Rated');
      expect(result).toContain('5/5');
      expect(result).toContain('Excellent');
    });

    it('should show quality report', () => {
      const report = showQuality();

      expect(report).toContain('Quality Report');
    });
  });

  describe('Review Commands', () => {
    it('should show no pending reviews', () => {
      const reviews = showReviews();

      expect(reviews).toContain('No pending reviews');
    });

    it('should show review stats', () => {
      const stats = showReviewStats();

      expect(stats).toContain('Review Queue Summary');
    });
  });

  describe('Execute Router Command', () => {
    it('should execute routing command', async () => {
      const result = await executeRouterCommand('routing', []);

      expect(result).toContain('Routing Status');
    });

    it('should execute costs command', async () => {
      const result = await executeRouterCommand('costs', []);

      expect(result).toContain('Cost Summary');
    });

    it('should execute costs --detailed command', async () => {
      const result = await executeRouterCommand('costs', ['--detailed']);

      expect(result).toContain('Cost by Model');
    });

    it('should execute budget set command', async () => {
      const result = await executeRouterCommand('budget', ['set', 'daily', '20.00']);

      expect(result).toContain('Daily');
      expect(result).toContain('20');
    });

    it('should execute budget clear command', async () => {
      const result = await executeRouterCommand('budget', ['clear', 'weekly']);

      expect(result).toContain('Weekly');
      expect(result).toContain('removed');
    });

    it('should handle invalid budget command', async () => {
      const result = await executeRouterCommand('budget', []);

      expect(result).toContain('Usage');
    });

    it('should execute rate command', async () => {
      recordCompletedRequest('test', 'openai', 'code_edit', 'medium', 1000, 100, 50, 50, 0.001, 0.001);

      const result = await executeRouterCommand('rate', ['4']);

      expect(result).toContain('Rated');
    });

    it('should handle invalid rating', async () => {
      const result = await executeRouterCommand('rate', ['10']);

      expect(result).toContain('between 1 and 5');
    });

    it('should execute quality command', async () => {
      const result = await executeRouterCommand('quality', []);

      expect(result).toContain('Quality Report');
    });

    it('should execute review command', async () => {
      const result = await executeRouterCommand('review', []);

      expect(result).toContain('pending');
    });

    it('should execute review stats command', async () => {
      const result = await executeRouterCommand('review', ['stats']);

      expect(result).toContain('Review Queue Summary');
    });

    it('should execute use command', async () => {
      const result = await executeRouterCommand('use', ['auto']);

      expect(result).toContain('auto-routing');
    });

    it('should handle missing use argument', async () => {
      const result = await executeRouterCommand('use', []);

      expect(result).toContain('Usage');
    });

    it('should execute routing optimize command', async () => {
      const result = await executeRouterCommand('routing', ['optimize']);

      expect(result).toContain('Optimization');
    });

    it('should handle unknown command', async () => {
      const result = await executeRouterCommand('unknown', []);

      expect(result).toContain('Unknown command');
    });
  });

  describe('Record Completed Request', () => {
    it('should record request and return score ID', () => {
      const scoreId = recordCompletedRequest(
        'gpt-4o',
        'openai',
        'code_edit',
        'medium',
        2000,
        1500,
        1000,
        500,
        0.01,
        0.02,
        true
      );

      expect(scoreId).toBeDefined();
      expect(scoreId.length).toBeGreaterThan(0);
    });

    it('should update cost tracker', () => {
      const tracker = getCostTracker();
      const initialCount = tracker.getAllRecords().length;

      recordCompletedRequest(
        'gpt-4o',
        'openai',
        'code_edit',
        'medium',
        2000,
        1500,
        1000,
        500,
        0.01,
        0.02,
        true
      );

      expect(tracker.getAllRecords().length).toBe(initialCount + 1);
    });

    it('should update quality scorer', () => {
      const scorer = getQualityScorer();
      const initialCount = scorer.getAllScores().length;

      recordCompletedRequest(
        'gpt-4o',
        'openai',
        'code_edit',
        'medium',
        2000,
        1500,
        1000,
        500,
        0.01,
        0.02,
        true
      );

      expect(scorer.getAllScores().length).toBe(initialCount + 1);
    });

    it('should set last response ID', () => {
      const scoreId = recordCompletedRequest(
        'gpt-4o',
        'openai',
        'code_edit',
        'medium',
        2000,
        1500,
        1000,
        500,
        0.01,
        0.02,
        true
      );

      expect(getSessionState().lastResponseId).toBe(scoreId);
    });
  });

  describe('Routing Stats Commands', () => {
    it('should show routing stats', () => {
      const result = showRoutingStats();
      expect(result).toContain('Routing Statistics');
    });

    it('should show routing patterns', () => {
      const result = showRoutingPatterns();
      // With no data, should show appropriate message
      expect(result).toMatch(/Routing Patterns|No routing patterns/);
    });

    it('should show escalation candidates', () => {
      const result = showRoutingEscalations();
      expect(result).toContain('Escalation Candidates');
    });

    it('should show routing suggestions', () => {
      const result = showRoutingSuggestions();
      expect(result).toContain('Routing Suggestions');
    });

    it('should show routing report', () => {
      const result = showRoutingReport();
      expect(result).toContain('Routing Optimization Report');
    });
  });

  describe('vLLM Commands', () => {
    it('should show vLLM status', async () => {
      const result = await showVLLMStatus();
      expect(result).toContain('vLLM Server Status');
    });

    it('should show vLLM models', async () => {
      const result = await showVLLMModels();
      expect(result).toContain('vLLM');
    });

    it('should test vLLM connectivity', async () => {
      const result = await testVLLM();
      expect(result).toContain('vLLM Connection Test');
    });
  });

  describe('Force Routing Mode', () => {
    it('should switch to claude mode', () => {
      // This will fail without configured models, but should handle gracefully
      const result = useModel('claude');
      // Either sets model or reports not available
      expect(result).toMatch(/Claude|No Claude models/);
    });

    it('should get forced routing mode', () => {
      // Default is auto
      expect(getForcedRoutingMode()).toBe('auto');

      // Switch to auto explicitly
      useModel('auto');
      expect(getForcedRoutingMode()).toBe('auto');
    });
  });

  describe('Execute Router Command - New Commands', () => {
    it('should handle vllm status command', async () => {
      const result = await executeRouterCommand('vllm', ['status']);
      expect(result).toContain('vLLM');
    });

    it('should handle vllm models command', async () => {
      const result = await executeRouterCommand('vllm', ['models']);
      expect(result).toContain('vLLM');
    });

    it('should handle vllm test command', async () => {
      const result = await executeRouterCommand('vllm', ['test']);
      expect(result).toContain('vLLM');
    });

    it('should handle vllm without subcommand', async () => {
      const result = await executeRouterCommand('vllm', []);
      expect(result).toContain('Usage');
    });

    it('should handle routing stats command', async () => {
      const result = await executeRouterCommand('routing', ['stats']);
      expect(result).toContain('Routing Statistics');
    });

    it('should handle routing patterns command', async () => {
      const result = await executeRouterCommand('routing', ['patterns']);
      expect(result).toMatch(/Routing Patterns|No routing patterns/);
    });

    it('should handle routing escalations command', async () => {
      const result = await executeRouterCommand('routing', ['escalations']);
      expect(result).toContain('Escalation Candidates');
    });

    it('should handle routing suggest command', async () => {
      const result = await executeRouterCommand('routing', ['suggest']);
      expect(result).toContain('Routing Suggestions');
    });

    it('should handle routing report command', async () => {
      const result = await executeRouterCommand('routing', ['report']);
      expect(result).toContain('Routing Optimization Report');
    });

    it('should handle use local command', async () => {
      const result = await executeRouterCommand('use', ['local']);
      // Either sets model or reports not available
      expect(result).toMatch(/local|No local models/);
    });

    it('should handle use claude command', async () => {
      const result = await executeRouterCommand('use', ['claude']);
      // Either sets model or reports not available
      expect(result).toMatch(/Claude|No Claude models/);
    });

    it('should show improved help for unknown command', async () => {
      const result = await executeRouterCommand('unknown', []);
      expect(result).toContain('Unknown command');
      expect(result).toContain('vllm');
      expect(result).toContain('routing');
    });
  });
});
