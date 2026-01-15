/**
 * Tests for Outcome Tracker
 *
 * Tests routing outcome tracking with:
 * - Recording outcomes
 * - Pattern statistics
 * - Escalation detection
 * - Query functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  OutcomeTracker,
  getOutcomeTracker,
  resetOutcomeTracker,
  initializeOutcomeTracker,
  recordOutcome,
  shouldEscalatePattern,
  getPatternSuccessRate,
  formatOutcome,
  formatPatternStats,
  formatTrackerStats,
  type RoutingOutcome,
  type RecordOutcomeInput,
  type PatternStats,
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
    taskPattern: 'implement-function',
    prompt: 'Implement a function to add two numbers',
    riskAssessment: createMockRiskAssessment(),
    routedTo: 'local',
    actualModel: 'qwen-coder',
    status: 'success',
    testsPassed: true,
    ...overrides,
  };
}

// ===== TESTS =====

describe('OutcomeTracker', () => {
  beforeEach(() => {
    resetOutcomeTracker();
  });

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const tracker = new OutcomeTracker();
      expect(tracker).toBeDefined();
      expect(tracker.count).toBe(0);
    });

    it('should create with custom configuration', () => {
      const tracker = new OutcomeTracker({
        maxOutcomes: 100,
        escalationThreshold: 0.8,
      });
      expect(tracker).toBeDefined();
    });
  });

  describe('Recording Outcomes', () => {
    it('should record a successful outcome', () => {
      const tracker = new OutcomeTracker();
      const outcome = tracker.record(createOutcomeInput());

      expect(outcome.id).toMatch(/^outcome-/);
      expect(outcome.status).toBe('success');
      expect(outcome.routedTo).toBe('local');
      expect(tracker.count).toBe(1);
    });

    it('should record a failed outcome', () => {
      const tracker = new OutcomeTracker();
      const outcome = tracker.record(createOutcomeInput({
        status: 'failure',
        testsPassed: false,
      }));

      expect(outcome.status).toBe('failure');
      expect(outcome.testsPassed).toBe(false);
    });

    it('should record Claude rewrite information', () => {
      const tracker = new OutcomeTracker();
      const outcome = tracker.record(createOutcomeInput({
        claudeRewrote: true,
        rewritePercentage: 0.6,
      }));

      expect(outcome.claudeRewrote).toBe(true);
      expect(outcome.rewritePercentage).toBe(0.6);
    });

    it('should truncate long prompts', () => {
      const tracker = new OutcomeTracker();
      const longPrompt = 'A'.repeat(500);
      const outcome = tracker.record(createOutcomeInput({ prompt: longPrompt }));

      expect(outcome.promptSummary.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(outcome.promptSummary.endsWith('...')).toBe(true);
    });

    it('should normalize task patterns', () => {
      const tracker = new OutcomeTracker();
      const outcome1 = tracker.record(createOutcomeInput({ taskPattern: 'Test Pattern' }));
      const outcome2 = tracker.record(createOutcomeInput({ taskPattern: 'test pattern' }));

      expect(outcome1.taskPattern).toBe(outcome2.taskPattern);
    });
  });

  describe('Marking Reverted', () => {
    it('should mark outcome as reverted', () => {
      const tracker = new OutcomeTracker();
      const outcome = tracker.record(createOutcomeInput());

      const result = tracker.markReverted(outcome.id);
      expect(result).toBe(true);

      const updated = tracker.getOutcome(outcome.id);
      expect(updated?.userReverted).toBe(true);
      expect(updated?.status).toBe('reverted');
    });

    it('should return false for non-existent outcome', () => {
      const tracker = new OutcomeTracker();
      const result = tracker.markReverted('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Querying Outcomes', () => {
    it('should query all outcomes', () => {
      const tracker = new OutcomeTracker();
      tracker.record(createOutcomeInput());
      tracker.record(createOutcomeInput());
      tracker.record(createOutcomeInput());

      const results = tracker.query();
      expect(results.length).toBe(3);
    });

    it('should filter by pattern', () => {
      const tracker = new OutcomeTracker();
      tracker.record(createOutcomeInput({ taskPattern: 'pattern-a' }));
      tracker.record(createOutcomeInput({ taskPattern: 'pattern-b' }));
      tracker.record(createOutcomeInput({ taskPattern: 'pattern-a' }));

      const results = tracker.query({ pattern: 'pattern-a' });
      expect(results.length).toBe(2);
    });

    it('should filter by route', () => {
      const tracker = new OutcomeTracker();
      tracker.record(createOutcomeInput({ routedTo: 'local' }));
      tracker.record(createOutcomeInput({ routedTo: 'claude' }));
      tracker.record(createOutcomeInput({ routedTo: 'local' }));

      const results = tracker.query({ routedTo: 'local' });
      expect(results.length).toBe(2);
    });

    it('should filter by status', () => {
      const tracker = new OutcomeTracker();
      tracker.record(createOutcomeInput({ status: 'success' }));
      tracker.record(createOutcomeInput({ status: 'failure' }));
      tracker.record(createOutcomeInput({ status: 'success' }));

      const results = tracker.query({ status: 'failure' });
      expect(results.length).toBe(1);
    });

    it('should apply pagination', () => {
      const tracker = new OutcomeTracker();
      for (let i = 0; i < 10; i++) {
        tracker.record(createOutcomeInput());
      }

      const page1 = tracker.query({ limit: 3, offset: 0 });
      const page2 = tracker.query({ limit: 3, offset: 3 });

      expect(page1.length).toBe(3);
      expect(page2.length).toBe(3);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should sort by timestamp descending', () => {
      const tracker = new OutcomeTracker();
      tracker.record(createOutcomeInput());
      tracker.record(createOutcomeInput());
      tracker.record(createOutcomeInput());

      const results = tracker.query();
      expect(results[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        results[1].timestamp.getTime()
      );
    });
  });

  describe('Pattern Statistics', () => {
    it('should calculate pattern stats with enough outcomes', () => {
      const tracker = new OutcomeTracker({ minOutcomesForStats: 3 });

      // Record 5 outcomes for pattern
      for (let i = 0; i < 5; i++) {
        tracker.record(createOutcomeInput({
          taskPattern: 'test-pattern',
          status: i < 4 ? 'success' : 'failure',
        }));
      }

      const stats = tracker.getPatternStats('test-pattern');
      expect(stats).not.toBeNull();
      expect(stats?.totalOutcomes).toBe(5);
      expect(stats?.successCount).toBe(4);
      expect(stats?.failureCount).toBe(1);
      expect(stats?.successRate).toBe(0.8);
    });

    it('should return null for insufficient outcomes', () => {
      const tracker = new OutcomeTracker({ minOutcomesForStats: 5 });

      tracker.record(createOutcomeInput({ taskPattern: 'test-pattern' }));
      tracker.record(createOutcomeInput({ taskPattern: 'test-pattern' }));

      const stats = tracker.getPatternStats('test-pattern');
      expect(stats).toBeNull();
    });

    it('should calculate average rewrite percentage', () => {
      const tracker = new OutcomeTracker({ minOutcomesForStats: 2 });

      tracker.record(createOutcomeInput({
        taskPattern: 'test-pattern',
        rewritePercentage: 0.4,
      }));
      tracker.record(createOutcomeInput({
        taskPattern: 'test-pattern',
        rewritePercentage: 0.6,
      }));

      const stats = tracker.getPatternStats('test-pattern');
      expect(stats?.avgRewritePercentage).toBe(0.5);
    });

    it('should recommend escalation for low success rate', () => {
      const tracker = new OutcomeTracker({
        minOutcomesForStats: 3,
        escalationThreshold: 0.7,
      });

      // 50% success rate
      tracker.record(createOutcomeInput({ taskPattern: 'bad-pattern', status: 'success' }));
      tracker.record(createOutcomeInput({ taskPattern: 'bad-pattern', status: 'failure' }));
      tracker.record(createOutcomeInput({ taskPattern: 'bad-pattern', status: 'success' }));
      tracker.record(createOutcomeInput({ taskPattern: 'bad-pattern', status: 'failure' }));

      const stats = tracker.getPatternStats('bad-pattern');
      expect(stats?.recommendedRoute).toBe('expensive');
    });

    it('should recommend review for high rewrite percentage', () => {
      const tracker = new OutcomeTracker({
        minOutcomesForStats: 2,
        rewriteThreshold: 0.3,
        escalationThreshold: 0.5,
      });

      tracker.record(createOutcomeInput({
        taskPattern: 'rewrite-pattern',
        status: 'success',
        rewritePercentage: 0.5,
      }));
      tracker.record(createOutcomeInput({
        taskPattern: 'rewrite-pattern',
        status: 'success',
        rewritePercentage: 0.6,
      }));

      const stats = tracker.getPatternStats('rewrite-pattern');
      expect(stats?.recommendedRoute).toBe('local_then_review');
    });
  });

  describe('Escalation Detection', () => {
    it('should detect patterns needing escalation', () => {
      const tracker = new OutcomeTracker({
        minOutcomesForStats: 2,
        escalationThreshold: 0.7,
      });

      // Good pattern
      tracker.record(createOutcomeInput({ taskPattern: 'good', status: 'success' }));
      tracker.record(createOutcomeInput({ taskPattern: 'good', status: 'success' }));

      // Bad pattern
      tracker.record(createOutcomeInput({ taskPattern: 'bad', status: 'failure' }));
      tracker.record(createOutcomeInput({ taskPattern: 'bad', status: 'failure' }));

      const candidates = tracker.getEscalationCandidates();
      expect(candidates.length).toBe(1);
      expect(candidates[0].pattern).toBeDefined();
    });

    it('should check if specific pattern should escalate', () => {
      const tracker = new OutcomeTracker({
        minOutcomesForStats: 2,
        escalationThreshold: 0.7,
      });

      tracker.record(createOutcomeInput({ taskPattern: 'bad', status: 'failure' }));
      tracker.record(createOutcomeInput({ taskPattern: 'bad', status: 'failure' }));

      expect(tracker.shouldEscalate('bad')).toBe(true);
    });
  });

  describe('Tracker Statistics', () => {
    it('should calculate overall stats', () => {
      const tracker = new OutcomeTracker();

      tracker.record(createOutcomeInput({ routedTo: 'local', status: 'success', totalCost: 0.01 }));
      tracker.record(createOutcomeInput({ routedTo: 'claude', status: 'success', totalCost: 0.05 }));
      tracker.record(createOutcomeInput({ routedTo: 'local', status: 'failure', totalCost: 0.01 }));

      const stats = tracker.getStats();

      expect(stats.totalOutcomes).toBe(3);
      expect(stats.outcomesByRoute.local).toBe(2);
      expect(stats.outcomesByRoute.claude).toBe(1);
      expect(stats.overallSuccessRate).toBeCloseTo(0.667, 2);
      expect(stats.totalCost).toBeCloseTo(0.07, 2);
    });

    it('should track unique patterns', () => {
      const tracker = new OutcomeTracker();

      tracker.record(createOutcomeInput({ taskPattern: 'pattern-a' }));
      tracker.record(createOutcomeInput({ taskPattern: 'pattern-b' }));
      tracker.record(createOutcomeInput({ taskPattern: 'pattern-a' }));

      const stats = tracker.getStats();
      expect(stats.uniquePatterns).toBe(2);
    });
  });

  describe('Outcome Pruning', () => {
    it('should prune outcomes exceeding max count', () => {
      const tracker = new OutcomeTracker({ maxOutcomes: 5 });

      for (let i = 0; i < 10; i++) {
        tracker.record(createOutcomeInput());
      }

      expect(tracker.count).toBe(5);
    });
  });

  describe('Clear', () => {
    it('should clear all outcomes', () => {
      const tracker = new OutcomeTracker();

      tracker.record(createOutcomeInput());
      tracker.record(createOutcomeInput());
      expect(tracker.count).toBe(2);

      tracker.clear();
      expect(tracker.count).toBe(0);
    });
  });

  describe('Get Recent Outcomes', () => {
    it('should return most recent outcomes', () => {
      const tracker = new OutcomeTracker();

      for (let i = 0; i < 20; i++) {
        tracker.record(createOutcomeInput());
      }

      const recent = tracker.getRecentOutcomes(5);
      expect(recent.length).toBe(5);
    });
  });
});

describe('Singleton Functions', () => {
  beforeEach(() => {
    resetOutcomeTracker();
  });

  it('getOutcomeTracker should return same instance', () => {
    const tracker1 = getOutcomeTracker();
    const tracker2 = getOutcomeTracker();
    expect(tracker1).toBe(tracker2);
  });

  it('getOutcomeTracker with config should create new instance', () => {
    const tracker1 = getOutcomeTracker();
    const tracker2 = getOutcomeTracker({ maxOutcomes: 50 });
    expect(tracker1).not.toBe(tracker2);
  });

  it('initializeOutcomeTracker should create configured instance', () => {
    const tracker = initializeOutcomeTracker({ maxOutcomes: 100 });
    expect(tracker).toBeDefined();
    expect(getOutcomeTracker()).toBe(tracker);
  });

  it('resetOutcomeTracker should clear instance', () => {
    const tracker1 = getOutcomeTracker();
    resetOutcomeTracker();
    const tracker2 = getOutcomeTracker();
    expect(tracker1).not.toBe(tracker2);
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    resetOutcomeTracker();
  });

  describe('recordOutcome', () => {
    it('should record using singleton', () => {
      const outcome = recordOutcome(createOutcomeInput());
      expect(outcome.id).toBeDefined();
      expect(getOutcomeTracker().count).toBe(1);
    });
  });

  describe('shouldEscalatePattern', () => {
    it('should check escalation using singleton', () => {
      const tracker = getOutcomeTracker({ minOutcomesForStats: 2, escalationThreshold: 0.7 });
      tracker.record(createOutcomeInput({ taskPattern: 'bad', status: 'failure' }));
      tracker.record(createOutcomeInput({ taskPattern: 'bad', status: 'failure' }));

      expect(shouldEscalatePattern('bad')).toBe(true);
    });
  });

  describe('getPatternSuccessRate', () => {
    it('should get success rate using singleton', () => {
      const tracker = getOutcomeTracker({ minOutcomesForStats: 2 });
      tracker.record(createOutcomeInput({ taskPattern: 'test', status: 'success' }));
      tracker.record(createOutcomeInput({ taskPattern: 'test', status: 'success' }));

      expect(getPatternSuccessRate('test')).toBe(1.0);
    });

    it('should return null for unknown pattern', () => {
      expect(getPatternSuccessRate('unknown')).toBeNull();
    });
  });

  describe('formatOutcome', () => {
    it('should format successful outcome', () => {
      const outcome: RoutingOutcome = {
        id: 'test-1',
        timestamp: new Date(),
        taskPattern: 'test',
        promptSummary: 'Implement a function to add two numbers',
        riskAssessment: createMockRiskAssessment(),
        routedTo: 'local',
        actualModel: 'qwen-coder',
        status: 'success',
        testsPassed: true,
        claudeRewrote: false,
        rewritePercentage: 0,
        userReverted: false,
        iterations: 1,
        localTokens: 100,
        claudeTokens: 0,
        totalCost: 0,
        executionTimeMs: 500,
      };

      const formatted = formatOutcome(outcome);
      expect(formatted).toContain('Local');
    });

    it('should format outcome with cost', () => {
      const outcome: RoutingOutcome = {
        id: 'test-2',
        timestamp: new Date(),
        taskPattern: 'test',
        promptSummary: 'Design system architecture',
        riskAssessment: createMockRiskAssessment(),
        routedTo: 'claude',
        actualModel: 'claude-opus',
        status: 'success',
        testsPassed: null,
        claudeRewrote: false,
        rewritePercentage: 0,
        userReverted: false,
        iterations: 1,
        localTokens: 0,
        claudeTokens: 500,
        totalCost: 0.05,
        executionTimeMs: 1000,
      };

      const formatted = formatOutcome(outcome);
      expect(formatted).toContain('Claude');
      expect(formatted).toContain('$0.05');
    });
  });

  describe('formatPatternStats', () => {
    it('should format pattern stats', () => {
      const stats: PatternStats = {
        pattern: 'abc12345',
        totalOutcomes: 100,
        successCount: 85,
        failureCount: 15,
        revertCount: 2,
        successRate: 0.85,
        avgRewritePercentage: 0.2,
        avgCost: 0.01,
        avgExecutionTimeMs: 500,
        lastOutcome: new Date(),
        recommendedRoute: 'local',
      };

      const formatted = formatPatternStats(stats);
      expect(formatted).toContain('85%');
      expect(formatted).toContain('20%');
      expect(formatted).toContain('Local');
      expect(formatted).toContain('100 samples');
    });
  });

  describe('formatTrackerStats', () => {
    it('should format tracker stats', () => {
      const tracker = getOutcomeTracker();
      tracker.record(createOutcomeInput({ totalCost: 0.05 }));
      tracker.record(createOutcomeInput({ totalCost: 0.05 }));

      const stats = tracker.getStats();
      const formatted = formatTrackerStats(stats);

      expect(formatted).toContain('Total Outcomes: 2');
      expect(formatted).toContain('$0.10');
    });
  });
});
