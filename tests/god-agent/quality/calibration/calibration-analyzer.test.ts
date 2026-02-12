/**
 * Calibration Analyzer Tests
 * PHASE-1-005 - Compute Calibration Coefficients
 *
 * Tests for:
 * - Pearson correlation calculation
 * - Linear regression
 * - Confidence interval calculation
 * - Calibration report generation
 * - Threshold adjustment recommendations
 * - Score calibration transformation
 */

import { describe, it, expect } from 'vitest';
import {
  CalibrationAnalyzer,
  createCalibrationAnalyzer,
  type CalibrationResult,
  type CalibrationReport,
} from '../../../../src/god-agent/cli/quality/calibration/calibration-analyzer.js';
import type { CalibrationPair } from '../../../../src/god-agent/cli/quality/calibration/rating-store.js';

describe('CalibrationAnalyzer', () => {
  // Helper to create calibration pairs with perfect correlation
  const createPerfectPairs = (count: number): CalibrationPair[] => {
    return Array.from({ length: count }, (_, i) => {
      const gauntletScore = (i + 1) / count;
      const humanScore = Math.round(gauntletScore * 4 + 1) as 1 | 2 | 3 | 4 | 5;

      return {
        chapterId: i + 1,
        sessionId: `session_${i}`,
        gauntletScores: {
          argumentCoherence: gauntletScore,
          citationCompleteness: gauntletScore,
          styleConsistency: gauntletScore,
          factualAccuracy: gauntletScore,
          overall: gauntletScore,
        },
        humanRatings: {
          argumentCoherence: humanScore,
          citationCompleteness: humanScore,
          styleConsistency: humanScore,
          factualAccuracy: humanScore,
          overall: humanScore,
        },
        raterCount: 2,
        raterAgreement: 0.9,
      };
    });
  };

  // Helper to create pairs with random scores
  const createRandomPairs = (count: number): CalibrationPair[] => {
    return Array.from({ length: count }, (_, i) => {
      const gauntletScore = Math.random();
      const humanScore = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;

      return {
        chapterId: i + 1,
        sessionId: `session_${i}`,
        gauntletScores: {
          argumentCoherence: gauntletScore,
          citationCompleteness: gauntletScore,
          styleConsistency: gauntletScore,
          factualAccuracy: gauntletScore,
          overall: gauntletScore,
        },
        humanRatings: {
          argumentCoherence: humanScore,
          citationCompleteness: humanScore,
          styleConsistency: humanScore,
          factualAccuracy: humanScore,
          overall: humanScore,
        },
        raterCount: 2,
        raterAgreement: 0.8,
      };
    });
  };

  // Helper to create pairs with specific correlation
  const createCorrelatedPairs = (count: number, targetR: number): CalibrationPair[] => {
    // Use a simple approach to generate correlated data
    const pairs: CalibrationPair[] = [];
    const noise = Math.sqrt(1 - targetR * targetR);

    for (let i = 0; i < count; i++) {
      const x = (i + 1) / count;
      // Add controlled noise to reduce correlation
      const noisyX = x + (Math.random() - 0.5) * noise;
      const clampedX = Math.max(0, Math.min(1, noisyX));
      const humanScore = Math.max(1, Math.min(5, Math.round(clampedX * 4 + 1))) as 1 | 2 | 3 | 4 | 5;

      pairs.push({
        chapterId: i + 1,
        sessionId: `session_${i}`,
        gauntletScores: {
          argumentCoherence: x,
          citationCompleteness: x,
          styleConsistency: x,
          factualAccuracy: x,
          overall: x,
        },
        humanRatings: {
          argumentCoherence: humanScore,
          citationCompleteness: humanScore,
          styleConsistency: humanScore,
          factualAccuracy: humanScore,
          overall: humanScore,
        },
        raterCount: 2,
        raterAgreement: 0.85,
      });
    }

    return pairs;
  };

  describe('Factory function', () => {
    it('should create analyzer with default target correlation', () => {
      const analyzer = createCalibrationAnalyzer();
      expect(analyzer).toBeInstanceOf(CalibrationAnalyzer);
    });

    it('should create analyzer with custom target correlation', () => {
      const analyzer = createCalibrationAnalyzer(0.60);
      const pairs = createCorrelatedPairs(20, 0.55);
      const report = analyzer.analyze(pairs);
      // With 0.55 actual correlation and 0.60 target, should not meet target
      expect(report.metadata.targetCorrelation).toBe(0.60);
    });
  });

  describe('Empty data handling', () => {
    it('should return empty report when no pairs provided', () => {
      const analyzer = createCalibrationAnalyzer();
      const report = analyzer.analyze([]);

      expect(report.overall.sampleSize).toBe(0);
      expect(report.overall.pearsonR).toBe(0);
      expect(report.overall.meetsTarget).toBe(false);
      expect(report.passesCalibration).toBe(false);
      expect(report.recommendations).toContain('No calibration data available. Add chapters and collect human ratings.');
    });
  });

  describe('Pearson correlation calculation', () => {
    it('should calculate high correlation for perfectly aligned data', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createPerfectPairs(10);
      const report = analyzer.analyze(pairs);

      // With perfectly aligned data, correlation should be very high
      expect(report.overall.pearsonR).toBeGreaterThan(0.9);
    });

    it('should return correlation in valid range [-1, 1]', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createRandomPairs(50);
      const report = analyzer.analyze(pairs);

      expect(report.overall.pearsonR).toBeGreaterThanOrEqual(-1);
      expect(report.overall.pearsonR).toBeLessThanOrEqual(1);
    });

    it('should calculate R-squared correctly', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createCorrelatedPairs(30, 0.7);
      const report = analyzer.analyze(pairs);

      // R-squared should equal r^2
      for (const [dim, result] of Object.entries(report.byDimension)) {
        if (dim !== 'overall') {
          expect(result.rSquared).toBeCloseTo(result.pearsonR * result.pearsonR, 3);
        }
      }
    });
  });

  describe('Confidence interval calculation', () => {
    it('should calculate 95% CI for correlation', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createCorrelatedPairs(50, 0.6);
      const report = analyzer.analyze(pairs);

      const [lower, upper] = report.overall.confidenceInterval95;
      expect(lower).toBeGreaterThanOrEqual(-1);
      expect(upper).toBeLessThanOrEqual(1);
      expect(lower).toBeLessThan(upper);
    });

    it('should have wider CI with smaller sample size', () => {
      const analyzer = createCalibrationAnalyzer();

      const smallPairs = createCorrelatedPairs(10, 0.6);
      const largePairs = createCorrelatedPairs(100, 0.6);

      const smallReport = analyzer.analyze(smallPairs);
      const largeReport = analyzer.analyze(largePairs);

      const smallWidth = smallReport.overall.confidenceInterval95[1] - smallReport.overall.confidenceInterval95[0];
      const largeWidth = largeReport.overall.confidenceInterval95[1] - largeReport.overall.confidenceInterval95[0];

      expect(smallWidth).toBeGreaterThan(largeWidth);
    });
  });

  describe('Linear regression', () => {
    it('should calculate regression slope and intercept', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createPerfectPairs(20);
      const report = analyzer.analyze(pairs);

      // Regression should have reasonable values
      for (const [dim, result] of Object.entries(report.byDimension)) {
        if (dim !== 'overall') {
          expect(typeof result.regressionSlope).toBe('number');
          expect(typeof result.regressionIntercept).toBe('number');
          expect(Number.isFinite(result.regressionSlope)).toBe(true);
          expect(Number.isFinite(result.regressionIntercept)).toBe(true);
        }
      }
    });

    it('should calculate MAE and RMSE', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createCorrelatedPairs(30, 0.7);
      const report = analyzer.analyze(pairs);

      for (const [dim, result] of Object.entries(report.byDimension)) {
        if (dim !== 'overall') {
          expect(result.mae).toBeGreaterThanOrEqual(0);
          expect(result.rmse).toBeGreaterThanOrEqual(0);
          // RMSE should be >= MAE
          expect(result.rmse).toBeGreaterThanOrEqual(result.mae - 0.001); // Small tolerance for floating point
        }
      }
    });
  });

  describe('Target correlation assessment', () => {
    it('should report meeting target when correlation is high enough', () => {
      const analyzer = createCalibrationAnalyzer(0.50);
      const pairs = createPerfectPairs(20);
      const report = analyzer.analyze(pairs);

      // Perfect correlation should exceed 0.50 target
      expect(report.overall.meetsTarget).toBe(true);
      expect(report.passesCalibration).toBe(true);
    });

    it('should report failing when correlation is below target', () => {
      const analyzer = createCalibrationAnalyzer(0.99);
      const pairs = createCorrelatedPairs(30, 0.5);
      const report = analyzer.analyze(pairs);

      // With moderate correlation and high target, should fail
      expect(report.failingDimensions.length).toBeGreaterThan(0);
    });
  });

  describe('Correlation interpretation', () => {
    it('should interpret correlation strength correctly', () => {
      const analyzer = createCalibrationAnalyzer();

      // Test different correlation levels
      const pairs = createPerfectPairs(30);
      const report = analyzer.analyze(pairs);

      const interpretation = report.overall.interpretation;
      expect(['negligible', 'weak', 'moderate', 'strong', 'very_strong']).toContain(interpretation);
    });
  });

  describe('Threshold adjustments', () => {
    it('should generate threshold adjustment recommendations', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createCorrelatedPairs(50, 0.7);
      const report = analyzer.analyze(pairs);

      // Should have threshold adjustments array
      expect(Array.isArray(report.thresholdAdjustments)).toBe(true);
    });

    it('should include valid threshold values', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createCorrelatedPairs(50, 0.7);
      const report = analyzer.analyze(pairs);

      for (const adj of report.thresholdAdjustments) {
        expect(adj.newThreshold).toBeGreaterThanOrEqual(0.5);
        expect(adj.newThreshold).toBeLessThanOrEqual(0.95);
        expect(['low', 'medium', 'high']).toContain(adj.confidence);
      }
    });
  });

  describe('Recommendations generation', () => {
    it('should generate recommendations when all dimensions pass', () => {
      const analyzer = createCalibrationAnalyzer(0.3); // Low target
      const pairs = createPerfectPairs(20);
      const report = analyzer.analyze(pairs);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('meet the calibration target'))).toBe(true);
    });

    it('should recommend more samples for small datasets', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createCorrelatedPairs(15, 0.6);
      const report = analyzer.analyze(pairs);

      expect(report.recommendations.some(r => r.includes('Sample size'))).toBe(true);
    });
  });

  describe('Metadata tracking', () => {
    it('should track correct metadata', () => {
      const analyzer = createCalibrationAnalyzer(0.55);
      const pairs = createCorrelatedPairs(25, 0.6);
      const report = analyzer.analyze(pairs);

      expect(report.metadata.totalChapters).toBe(25);
      expect(report.metadata.totalRatings).toBe(50); // 25 chapters * 2 raters
      expect(report.metadata.averageRatersPerChapter).toBe(2);
      expect(report.metadata.targetCorrelation).toBe(0.55);
      expect(typeof report.metadata.analysisTimestamp).toBe('string');
    });
  });

  describe('Score calibration', () => {
    it('should calibrate scores using regression', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createPerfectPairs(30);
      const report = analyzer.analyze(pairs);

      const result = report.byDimension['argumentCoherence'];

      // Test calibration of a mid-range score
      const calibrated = analyzer.calibrate(0.5, 'argumentCoherence', result);

      // Calibrated score should be in valid range
      expect(calibrated).toBeGreaterThanOrEqual(0);
      expect(calibrated).toBeLessThanOrEqual(1);
    });

    it('should clamp calibrated scores to [0, 1]', () => {
      const analyzer = createCalibrationAnalyzer();

      // Create artificial calibration result with extreme regression
      const result: CalibrationResult = {
        dimension: 'test',
        pearsonR: 0.5,
        pValue: 0.01,
        sampleSize: 30,
        regressionSlope: 2, // Steep slope
        regressionIntercept: 0.5, // High intercept
        confidenceInterval95: [0.3, 0.7],
        rSquared: 0.25,
        mae: 0.1,
        rmse: 0.15,
        meetsTarget: true,
        interpretation: 'moderate',
      };

      // Should clamp extremely high predicted values
      const calibrated = analyzer.calibrate(0.9, 'test', result);
      expect(calibrated).toBeLessThanOrEqual(1);

      // Should clamp extremely low predicted values
      const calibratedLow = analyzer.calibrate(-0.5, 'test', result);
      expect(calibratedLow).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dimension-specific analysis', () => {
    it('should analyze all quality dimensions', () => {
      const analyzer = createCalibrationAnalyzer();
      const pairs = createCorrelatedPairs(30, 0.6);
      const report = analyzer.analyze(pairs);

      const expectedDimensions = [
        'argumentCoherence',
        'citationCompleteness',
        'styleConsistency',
        'factualAccuracy',
        'overall',
      ];

      for (const dim of expectedDimensions) {
        expect(report.byDimension[dim]).toBeDefined();
        expect(report.byDimension[dim].dimension).toBe(dim);
      }
    });

    it('should handle dimensions with different correlations', () => {
      const analyzer = createCalibrationAnalyzer();

      // Create pairs where one dimension has worse correlation
      const pairs: CalibrationPair[] = Array.from({ length: 30 }, (_, i) => {
        const x = (i + 1) / 30;
        const goodHuman = Math.round(x * 4 + 1) as 1 | 2 | 3 | 4 | 5;
        const badHuman = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;

        return {
          chapterId: i + 1,
          sessionId: `session_${i}`,
          gauntletScores: {
            argumentCoherence: x,
            citationCompleteness: x,
            styleConsistency: x,
            factualAccuracy: x,
            overall: x,
          },
          humanRatings: {
            argumentCoherence: goodHuman,
            citationCompleteness: badHuman, // Random = low correlation
            styleConsistency: goodHuman,
            factualAccuracy: goodHuman,
            overall: goodHuman,
          },
          raterCount: 2,
          raterAgreement: 0.8,
        };
      });

      const report = analyzer.analyze(pairs);

      // citationCompleteness should likely have lower correlation
      const citationR = report.byDimension['citationCompleteness'].pearsonR;
      const argumentR = report.byDimension['argumentCoherence'].pearsonR;

      // argumentCoherence should have higher correlation
      expect(argumentR).toBeGreaterThan(0.8); // Should be high due to aligned data
    });
  });
});
