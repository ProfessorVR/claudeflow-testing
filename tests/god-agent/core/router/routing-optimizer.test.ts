/**
 * Tests for Routing Optimizer
 *
 * Tests the learning and optimization system:
 * - Route recommendations
 * - Rule suggestions
 * - Optimization reports
 * - Cost/quality analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RoutingOptimizer,
  getRoutingOptimizer,
  resetRoutingOptimizer,
  initializeRoutingOptimizer,
  getOptimizedRoute,
  getOptimizationSuggestions,
  formatSuggestion,
  formatReport,
  formatSummary,
  type RoutingRuleSuggestion,
} from '../../../../src/god-agent/core/router/routing-optimizer.js';
import {
  OutcomeTracker,
  resetOutcomeTracker,
  type RecordOutcomeInput,
} from '../../../../src/god-agent/core/router/outcome-tracker.js';
import type { RiskAssessment } from '../../../../src/god-agent/core/router/risk-classifier.js';

// ===== HELPERS =====

function createMockRiskAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    riskLevel: 'low',
    feedbackSpeed: 'fast',
    reversibility: 'easy',
    verificationMethod: 'tests',
    recommendedRoute: 'local',
    reason: 'Test assessment',
    confidence: 0.9,
    signals: [],
    ...overrides,
  };
}

function createOutcomeInput(overrides: Partial<RecordOutcomeInput> = {}): RecordOutcomeInput {
  return {
    taskPattern: 'test-pattern',
    prompt: 'Test prompt',
    riskAssessment: createMockRiskAssessment(),
    routedTo: 'local',
    actualModel: 'qwen-coder',
    status: 'success',
    testsPassed: true,
    ...overrides,
  };
}

function createTrackerWithData(): OutcomeTracker {
  const tracker = new OutcomeTracker({ minOutcomesForStats: 3 });

  // Good pattern - 90% success
  for (let i = 0; i < 10; i++) {
    tracker.record(createOutcomeInput({
      taskPattern: 'good-pattern',
      status: i < 9 ? 'success' : 'failure',
    }));
  }

  // Bad pattern - 40% success
  for (let i = 0; i < 10; i++) {
    tracker.record(createOutcomeInput({
      taskPattern: 'bad-pattern',
      status: i < 4 ? 'success' : 'failure',
    }));
  }

  // Rewrite pattern - good success but high rewrite
  for (let i = 0; i < 10; i++) {
    tracker.record(createOutcomeInput({
      taskPattern: 'rewrite-pattern',
      status: 'success',
      rewritePercentage: 0.5,
    }));
  }

  return tracker;
}

// ===== TESTS =====

describe('RoutingOptimizer', () => {
  beforeEach(() => {
    resetRoutingOptimizer();
    resetOutcomeTracker();
  });

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const optimizer = new RoutingOptimizer();
      expect(optimizer).toBeDefined();
    });

    it('should create with custom tracker', () => {
      const tracker = new OutcomeTracker();
      const optimizer = new RoutingOptimizer({ tracker });
      expect(optimizer).toBeDefined();
    });

    it('should create with custom thresholds', () => {
      const optimizer = new RoutingOptimizer({
        wellPerformingThreshold: 0.9,
        poorPerformingThreshold: 0.6,
      });
      expect(optimizer).toBeDefined();
    });
  });

  describe('Route Recommendations', () => {
    it('should return null for unknown pattern', () => {
      const tracker = new OutcomeTracker();
      const optimizer = new RoutingOptimizer({ tracker });

      const route = optimizer.getRecommendedRoute('unknown-pattern');
      expect(route).toBeNull();
    });

    it('should recommend local for well-performing pattern', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        wellPerformingThreshold: 0.85,
      });

      const route = optimizer.getRecommendedRoute('good-pattern');
      expect(route).toBe('local');
    });

    it('should recommend claude for poorly-performing pattern', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        poorPerformingThreshold: 0.7,
      });

      const route = optimizer.getRecommendedRoute('bad-pattern');
      expect(route).toBe('expensive');
    });
  });

  describe('Local/Claude Checks', () => {
    it('canUseLocal should return true for good patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });

      expect(optimizer.canUseLocal('good-pattern')).toBe(true);
    });

    it('canUseLocal should return false for bad patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });

      expect(optimizer.canUseLocal('bad-pattern')).toBe(false);
    });

    it('canUseLocal should return true for unknown patterns', () => {
      const tracker = new OutcomeTracker();
      const optimizer = new RoutingOptimizer({ tracker });

      expect(optimizer.canUseLocal('unknown')).toBe(true);
    });

    it('needsReview should return true for high rewrite patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        reviewRewriteThreshold: 0.3,
      });

      expect(optimizer.needsReview('rewrite-pattern')).toBe(true);
    });

    it('requiresClaude should return true for failing patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });

      expect(optimizer.requiresClaude('bad-pattern')).toBe(true);
    });
  });

  describe('Rule Suggestions', () => {
    it('should suggest escalation for poor patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        minOutcomesForSuggestion: 5,
        poorPerformingThreshold: 0.7,
        confidenceThreshold: 0.1, // Low threshold for test data
      });

      const suggestions = optimizer.suggestRuleChanges();
      const escalateSuggestion = suggestions.find(
        (s) => s.changeType === 'escalate_to_claude'
      );

      expect(escalateSuggestion).toBeDefined();
      expect(escalateSuggestion?.suggestedRoute).toBe('expensive');
    });

    it('should suggest review for high rewrite patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        minOutcomesForSuggestion: 5,
        reviewRewriteThreshold: 0.3,
        confidenceThreshold: 0.1, // Low threshold for test data
      });

      const suggestions = optimizer.suggestRuleChanges();
      const reviewSuggestion = suggestions.find(
        (s) => s.changeType === 'add_review'
      );

      expect(reviewSuggestion).toBeDefined();
      expect(reviewSuggestion?.suggestedRoute).toBe('local_then_review');
    });

    it('should sort suggestions by priority', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        minOutcomesForSuggestion: 5,
        confidenceThreshold: 0.1, // Low threshold for test data
      });

      const suggestions = optimizer.suggestRuleChanges();
      if (suggestions.length > 1) {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < suggestions.length; i++) {
          expect(priorityOrder[suggestions[i - 1].priority])
            .toBeLessThanOrEqual(priorityOrder[suggestions[i].priority]);
        }
      }
    });

    it('should limit number of suggestions', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        minOutcomesForSuggestion: 5,
        maxSuggestions: 2,
        confidenceThreshold: 0.1, // Low threshold for test data
      });

      const suggestions = optimizer.suggestRuleChanges();
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Pattern Analysis', () => {
    it('should identify well-performing patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        wellPerformingThreshold: 0.85,
      });

      const wellPerforming = optimizer.getWellPerformingPatterns();
      expect(wellPerforming.length).toBeGreaterThanOrEqual(1);
      expect(wellPerforming[0].successRate).toBeGreaterThanOrEqual(0.85);
    });

    it('should identify poor-performing patterns', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({
        tracker,
        poorPerformingThreshold: 0.7,
      });

      const poorPerforming = optimizer.getPoorPerformingPatterns();
      expect(poorPerforming.length).toBeGreaterThanOrEqual(1);
      expect(poorPerforming[0].successRate).toBeLessThan(0.7);
    });
  });

  describe('Optimization Report', () => {
    it('should generate complete report', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });

      const report = optimizer.generateReport();

      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.trackerStats).toBeDefined();
      expect(report.wellPerformingPatterns).toBeDefined();
      expect(report.poorPerformingPatterns).toBeDefined();
      expect(report.suggestions).toBeDefined();
      expect(report.costAnalysis).toBeDefined();
      expect(report.qualityAnalysis).toBeDefined();
    });

    it('should include cost analysis', () => {
      const tracker = new OutcomeTracker({ minOutcomesForStats: 2 });
      tracker.record(createOutcomeInput({ totalCost: 0.01 }));
      tracker.record(createOutcomeInput({ totalCost: 0.02 }));

      const optimizer = new RoutingOptimizer({ tracker });
      const report = optimizer.generateReport();

      expect(report.costAnalysis.totalCost).toBeCloseTo(0.03, 2);
      expect(report.costAnalysis.avgCostPerOutcome).toBeCloseTo(0.015, 3);
    });

    it('should include quality analysis', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });

      const report = optimizer.generateReport();

      expect(report.qualityAnalysis.overallSuccessRate).toBeDefined();
      expect(report.qualityAnalysis.revertRate).toBeDefined();
      expect(report.qualityAnalysis.avgRewritePercentage).toBeDefined();
    });
  });

  describe('Escalation Report', () => {
    it('should generate escalation report', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });

      const report = optimizer.getEscalationReport();

      expect(report.candidates).toBeDefined();
      expect(report.totalPatterns).toBeGreaterThan(0);
      expect(report.escalationRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Summary', () => {
    it('should generate summary', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });

      const summary = optimizer.getSummary();

      expect(summary.totalPatterns).toBeGreaterThan(0);
      expect(summary.wellPerforming).toBeDefined();
      expect(summary.needsReview).toBeDefined();
      expect(summary.needsEscalation).toBeDefined();
      expect(summary.suggestions).toBeDefined();
    });
  });
});

describe('Singleton Functions', () => {
  beforeEach(() => {
    resetRoutingOptimizer();
    resetOutcomeTracker();
  });

  it('getRoutingOptimizer should return same instance', () => {
    const optimizer1 = getRoutingOptimizer();
    const optimizer2 = getRoutingOptimizer();
    expect(optimizer1).toBe(optimizer2);
  });

  it('getRoutingOptimizer with config should create new instance', () => {
    const optimizer1 = getRoutingOptimizer();
    const optimizer2 = getRoutingOptimizer({ wellPerformingThreshold: 0.9 });
    expect(optimizer1).not.toBe(optimizer2);
  });

  it('initializeRoutingOptimizer should create configured instance', () => {
    const optimizer = initializeRoutingOptimizer({ wellPerformingThreshold: 0.9 });
    expect(optimizer).toBeDefined();
    expect(getRoutingOptimizer()).toBe(optimizer);
  });

  it('resetRoutingOptimizer should clear instance', () => {
    const optimizer1 = getRoutingOptimizer();
    resetRoutingOptimizer();
    const optimizer2 = getRoutingOptimizer();
    expect(optimizer1).not.toBe(optimizer2);
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    resetRoutingOptimizer();
    resetOutcomeTracker();
  });

  describe('getOptimizedRoute', () => {
    it('should get route using singleton', () => {
      const tracker = createTrackerWithData();
      getRoutingOptimizer({ tracker });

      const route = getOptimizedRoute('good-pattern');
      expect(route).toBe('local');
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should get suggestions using singleton', () => {
      const tracker = createTrackerWithData();
      getRoutingOptimizer({ tracker, minOutcomesForSuggestion: 5 });

      const suggestions = getOptimizationSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('formatSuggestion', () => {
    it('should format escalation suggestion', () => {
      const suggestion: RoutingRuleSuggestion = {
        id: 'test-1',
        priority: 'high',
        changeType: 'escalate_to_claude',
        pattern: 'bad-pattern',
        currentRoute: 'local',
        suggestedRoute: 'expensive',
        reason: 'Low success rate: 40%',
        stats: {
          pattern: 'bad-pattern',
          totalOutcomes: 10,
          successCount: 4,
          failureCount: 6,
          revertCount: 0,
          successRate: 0.4,
          avgRewritePercentage: 0,
          avgCost: 0.01,
          avgExecutionTimeMs: 500,
          lastOutcome: new Date(),
          recommendedRoute: 'expensive',
        },
        expectedImprovement: 'Higher success rate',
        confidence: 0.85,
      };

      const formatted = formatSuggestion(suggestion);
      expect(formatted).toContain('Local');
      expect(formatted).toContain('Claude');
      expect(formatted).toContain('85%');
    });

    it('should show priority icon', () => {
      const suggestion: RoutingRuleSuggestion = {
        id: 'test-2',
        priority: 'critical',
        changeType: 'escalate_to_claude',
        pattern: 'test',
        currentRoute: 'local',
        suggestedRoute: 'expensive',
        reason: 'Test',
        stats: {
          pattern: 'test',
          totalOutcomes: 10,
          successCount: 2,
          failureCount: 8,
          revertCount: 0,
          successRate: 0.2,
          avgRewritePercentage: 0,
          avgCost: 0,
          avgExecutionTimeMs: 0,
          lastOutcome: new Date(),
          recommendedRoute: 'expensive',
        },
        expectedImprovement: 'Test',
        confidence: 0.9,
      };

      const formatted = formatSuggestion(suggestion);
      expect(formatted).toMatch(/[🔴🟠🟡🟢]/);
    });
  });

  describe('formatReport', () => {
    it('should format optimization report', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });
      const report = optimizer.generateReport();

      const formatted = formatReport(report);

      expect(formatted).toContain('Routing Optimization Report');
      expect(formatted).toContain('Overview');
      expect(formatted).toContain('Quality');
      expect(formatted).toContain('Costs');
      expect(formatted).toContain('Suggestions');
    });
  });

  describe('formatSummary', () => {
    it('should format summary', () => {
      const tracker = createTrackerWithData();
      const optimizer = new RoutingOptimizer({ tracker });
      const summary = optimizer.getSummary();

      const formatted = formatSummary(summary);

      expect(formatted).toContain('Patterns');
      expect(formatted).toContain('Well Performing');
      expect(formatted).toContain('Needs Escalation');
    });
  });
});
