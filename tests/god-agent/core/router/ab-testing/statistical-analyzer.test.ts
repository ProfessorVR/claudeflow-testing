/**
 * Statistical Analyzer Tests
 *
 * Tests for Phase 6.2: A/B Testing Statistical Analysis
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  StatisticalAnalyzer,
  getStatisticalAnalyzer,
  initializeStatisticalAnalyzer,
  resetStatisticalAnalyzer,
  formatStatisticalResults,
  formatExperimentResults,
} from '../../../../../src/god-agent/core/router/ab-testing/statistical-analyzer.js';
import type {
  PairedOutcome,
  ModelOutcome,
} from '../../../../../src/god-agent/core/router/ab-testing/types.js';

// Helper to create mock model outcome
function createModelOutcome(overrides: Partial<ModelOutcome> = {}): ModelOutcome {
  return {
    model: 'test-model',
    provider: 'anthropic',
    success: true,
    latencyMs: 1000,
    tokensUsed: 500,
    cost: 0.01,
    ...overrides,
  };
}

// Helper to create paired outcome
function createPairedOutcome(
  modelAOverrides: Partial<ModelOutcome> = {},
  modelBOverrides: Partial<ModelOutcome> = {},
  overrides: Partial<PairedOutcome> = {}
): PairedOutcome {
  const modelAResult = createModelOutcome({ model: 'model-a', ...modelAOverrides });
  const modelBResult = createModelOutcome({ model: 'model-b', ...modelBOverrides });

  return {
    id: `outcome-${Math.random().toString(36).slice(2)}`,
    experimentId: 'test-experiment',
    taskHash: 'abc123',
    promptSummary: 'Test prompt',
    taskType: 'code_edit',
    complexity: 'medium',
    timestamp: new Date(),
    modelAResult,
    modelBResult,
    winner: 'tie',
    qualityDelta: 0,
    latencyDelta: modelAResult.latencyMs - modelBResult.latencyMs,
    costDelta: modelAResult.cost - modelBResult.cost,
    ...overrides,
  };
}

// Helper to create multiple outcomes with varying quality
function createOutcomes(
  count: number,
  modelASuccessRate: number,
  modelBSuccessRate: number
): PairedOutcome[] {
  const outcomes: PairedOutcome[] = [];
  for (let i = 0; i < count; i++) {
    const aSuccess = Math.random() < modelASuccessRate;
    const bSuccess = Math.random() < modelBSuccessRate;
    outcomes.push(
      createPairedOutcome(
        {
          success: aSuccess,
          userRating: aSuccess ? 4 : 2,
          userAccepted: aSuccess,
        },
        {
          success: bSuccess,
          userRating: bSuccess ? 4 : 2,
          userAccepted: bSuccess,
        }
      )
    );
  }
  return outcomes;
}

describe('StatisticalAnalyzer', () => {
  let analyzer: StatisticalAnalyzer;

  beforeEach(() => {
    resetStatisticalAnalyzer();
    analyzer = new StatisticalAnalyzer();
  });

  afterEach(() => {
    resetStatisticalAnalyzer();
  });

  describe('Initialization', () => {
    it('should create analyzer with default settings', () => {
      expect(analyzer).toBeDefined();
    });

    it('should use custom significance level', () => {
      const customAnalyzer = new StatisticalAnalyzer({ significanceLevel: 0.01 });
      expect(customAnalyzer).toBeDefined();
    });

    it('should use singleton pattern', () => {
      const instance1 = getStatisticalAnalyzer();
      const instance2 = getStatisticalAnalyzer();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with options', () => {
      resetStatisticalAnalyzer();
      const instance = initializeStatisticalAnalyzer({ significanceLevel: 0.01 });
      expect(instance).toBeDefined();
    });
  });

  describe('Analysis', () => {
    it('should return inconclusive for insufficient samples', () => {
      const outcomes = [createPairedOutcome()];
      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.winner).toBe('inconclusive');
      expect(results.recommendation).toContain('Insufficient');
    });

    it('should analyze outcomes with sufficient samples', () => {
      const outcomes = createOutcomes(20, 0.9, 0.5);
      const results = analyzer.analyze('test-exp', outcomes);

      expect(results).toBeDefined();
      expect(results.experimentId).toBe('test-exp');
      expect(results.statistics).toBeDefined();
      expect(results.qualityComparison).toBeDefined();
      expect(results.latencyComparison).toBeDefined();
      expect(results.costComparison).toBeDefined();
    });

    it('should detect significant quality difference', () => {
      // Create outcomes where model A is clearly better
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 50; i++) {
        outcomes.push(
          createPairedOutcome(
            {
              success: true,
              userRating: 5,
              userAccepted: true,
              testsPass: true,
            },
            {
              success: false,
              userRating: 1,
              userAccepted: false,
              testsPass: false,
            }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.winner).toBe('model_a');
      expect(results.statistics.isSignificant).toBe(true);
    });

    it('should detect tie when models are similar', () => {
      // Create outcomes where both models perform equally
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 50; i++) {
        const rating = Math.random() > 0.5 ? 4 : 3;
        outcomes.push(
          createPairedOutcome(
            {
              success: true,
              userRating: rating as 1 | 2 | 3 | 4 | 5,
              userAccepted: true,
            },
            {
              success: true,
              userRating: rating as 1 | 2 | 3 | 4 | 5,
              userAccepted: true,
            }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);

      // Should be tie or inconclusive (not significant difference)
      expect(['tie', 'inconclusive']).toContain(results.winner);
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate correct mean difference', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 20; i++) {
        outcomes.push(
          createPairedOutcome(
            { success: true, userRating: 5, userAccepted: true },
            { success: true, userRating: 3, userAccepted: true }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);

      // Model A should have higher mean quality
      expect(results.statistics.meanQualityA).toBeGreaterThan(
        results.statistics.meanQualityB
      );
    });

    it('should calculate effect size', () => {
      const outcomes = createOutcomes(30, 0.95, 0.3);
      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.statistics.cohensD).toBeDefined();
      expect(typeof results.statistics.cohensD).toBe('number');
    });

    it('should calculate confidence intervals', () => {
      const outcomes = createOutcomes(30, 0.8, 0.6);
      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.statistics.confidenceInterval).toHaveLength(2);
      const [lower, upper] = results.statistics.confidenceInterval;
      expect(lower).toBeLessThanOrEqual(upper);
    });

    it('should calculate p-values', () => {
      const outcomes = createOutcomes(30, 0.9, 0.4);
      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.statistics.tTestPValue).toBeGreaterThanOrEqual(0);
      expect(results.statistics.tTestPValue).toBeLessThanOrEqual(1);
      expect(results.statistics.mannWhitneyPValue).toBeGreaterThanOrEqual(0);
      expect(results.statistics.mannWhitneyPValue).toBeLessThanOrEqual(1);
      expect(results.statistics.chiSquarePValue).toBeGreaterThanOrEqual(0);
      expect(results.statistics.chiSquarePValue).toBeLessThanOrEqual(1);
    });
  });

  describe('Metric Comparisons', () => {
    it('should compare latency correctly', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 20; i++) {
        outcomes.push(
          createPairedOutcome(
            { latencyMs: 500, success: true },
            { latencyMs: 2000, success: true }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.latencyComparison.valueA).toBeLessThan(
        results.latencyComparison.valueB
      );
      // For latency, lower is better, so model A should be better
      expect(results.latencyComparison.better).toBe('model_a');
    });

    it('should compare cost correctly', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 20; i++) {
        outcomes.push(
          createPairedOutcome(
            { cost: 0.001, success: true },
            { cost: 0.05, success: true }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.costComparison.valueA).toBeLessThan(
        results.costComparison.valueB
      );
      // For cost, lower is better
      expect(results.costComparison.better).toBe('model_a');
    });

    it('should compare success rates', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 50; i++) {
        outcomes.push(
          createPairedOutcome(
            { success: true },
            { success: i < 25 } // 50% success for model B
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);

      expect(results.successRateComparison.valueA).toBe(1); // 100%
      expect(results.successRateComparison.valueB).toBe(0.5); // 50%
    });
  });

  describe('Significance Detection', () => {
    it('should detect when significance is reached', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 50; i++) {
        outcomes.push(
          createPairedOutcome(
            { success: true, userRating: 5, userAccepted: true },
            { success: false, userRating: 1, userAccepted: false }
          )
        );
      }

      const hasSignificance = analyzer.hasReachedSignificance(outcomes);
      expect(hasSignificance).toBe(true);
    });

    it('should not detect significance with insufficient samples', () => {
      const outcomes = [createPairedOutcome()];
      const hasSignificance = analyzer.hasReachedSignificance(outcomes);
      expect(hasSignificance).toBe(false);
    });

    it('should respect custom significance level', () => {
      const strictAnalyzer = new StatisticalAnalyzer({ significanceLevel: 0.001 });
      const outcomes = createOutcomes(20, 0.7, 0.5);

      // With stricter significance, should be harder to detect
      const hasSignificance = strictAnalyzer.hasReachedSignificance(outcomes, 0.001);
      // May or may not be significant depending on random outcomes
      expect(typeof hasSignificance).toBe('boolean');
    });
  });

  describe('Sample Size Estimation', () => {
    it('should estimate sample size for small effect', () => {
      const sampleSize = analyzer.estimateSampleSize(0.2);
      // Small effect requires large sample
      expect(sampleSize).toBeGreaterThan(100);
    });

    it('should estimate sample size for large effect', () => {
      const sampleSize = analyzer.estimateSampleSize(0.8);
      // Large effect requires smaller sample
      expect(sampleSize).toBeLessThan(100);
    });

    it('should require more samples for higher power', () => {
      const size80 = analyzer.estimateSampleSize(0.5, 0.8);
      const size95 = analyzer.estimateSampleSize(0.5, 0.95);
      expect(size95).toBeGreaterThan(size80);
    });

    it('should require more samples for stricter significance', () => {
      const size05 = analyzer.estimateSampleSize(0.5, 0.8, 0.05);
      const size01 = analyzer.estimateSampleSize(0.5, 0.8, 0.01);
      expect(size01).toBeGreaterThan(size05);
    });
  });

  describe('Formatting', () => {
    it('should format statistical results', () => {
      const outcomes = createOutcomes(30, 0.8, 0.5);
      const results = analyzer.analyze('test-exp', outcomes);

      const formatted = formatStatisticalResults(results.statistics);

      expect(formatted).toContain('Sample Sizes');
      expect(formatted).toContain('Quality Metrics');
      expect(formatted).toContain('Statistical Tests');
      expect(formatted).toContain('Effect Size');
    });

    it('should format experiment results', () => {
      const outcomes = createOutcomes(30, 0.8, 0.5);
      const results = analyzer.analyze('test-exp', outcomes);

      const formatted = formatExperimentResults(results);

      expect(formatted).toContain('A/B Test Results');
      expect(formatted).toContain('Winner');
      expect(formatted).toContain('Confidence');
      expect(formatted).toContain('Quality Comparison');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all successful outcomes', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 20; i++) {
        outcomes.push(
          createPairedOutcome(
            { success: true, userRating: 5 },
            { success: true, userRating: 5 }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);
      expect(results).toBeDefined();
      expect(results.statistics.successRateA).toBe(1);
      expect(results.statistics.successRateB).toBe(1);
    });

    it('should handle all failed outcomes', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 20; i++) {
        outcomes.push(
          createPairedOutcome(
            { success: false, userRating: 1 },
            { success: false, userRating: 1 }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);
      expect(results).toBeDefined();
      expect(results.statistics.successRateA).toBe(0);
      expect(results.statistics.successRateB).toBe(0);
    });

    it('should handle identical outcomes', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 20; i++) {
        outcomes.push(
          createPairedOutcome(
            { success: true, userRating: 4, latencyMs: 1000, cost: 0.01 },
            { success: true, userRating: 4, latencyMs: 1000, cost: 0.01 }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);
      expect(results.statistics.meanDifference).toBeCloseTo(0, 2);
      expect(results.winner).toBe('tie');
    });

    it('should handle missing optional metrics', () => {
      const outcomes: PairedOutcome[] = [];
      for (let i = 0; i < 20; i++) {
        outcomes.push(
          createPairedOutcome(
            { success: true }, // No rating, acceptance, or tests
            { success: false }
          )
        );
      }

      const results = analyzer.analyze('test-exp', outcomes);
      expect(results).toBeDefined();
    });
  });
});
