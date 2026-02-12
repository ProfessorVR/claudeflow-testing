/**
 * Calibration Analyzer - Statistical analysis for gauntlet-human calibration
 *
 * Computes Pearson correlations, regression coefficients, and calibration
 * functions to validate and calibrate Quality Gauntlet scores against
 * human expert ratings.
 *
 * Part of PHASE-1-005: Compute Calibration Coefficients
 * Implementation Plan Reference: phd-pipeline-implementation-plan.md
 */

import type { CalibrationPair } from './rating-store.js';
import { humanToGauntletScale, gauntletToHumanScale } from './rating-protocol.js';

// ============================================================================
// Calibration Result Types
// ============================================================================

/**
 * Result of calibration analysis for a single dimension
 */
export interface CalibrationResult {
  /** Dimension being calibrated */
  dimension: string;

  /** Pearson correlation coefficient (-1 to 1) */
  pearsonR: number;

  /** P-value for the correlation */
  pValue: number;

  /** Sample size (number of chapters) */
  sampleSize: number;

  /** Linear regression slope */
  regressionSlope: number;

  /** Linear regression intercept */
  regressionIntercept: number;

  /** 95% confidence interval for correlation */
  confidenceInterval95: [number, number];

  /** R-squared (coefficient of determination) */
  rSquared: number;

  /** Mean Absolute Error */
  mae: number;

  /** Root Mean Square Error */
  rmse: number;

  /** Whether this dimension meets the r >= 0.50 target */
  meetsTarget: boolean;

  /** Interpretation of the correlation strength */
  interpretation: 'negligible' | 'weak' | 'moderate' | 'strong' | 'very_strong';
}

/**
 * Threshold adjustment recommendation
 */
export interface ThresholdAdjustment {
  /** Quality dimension */
  dimension: string;

  /** Original gauntlet threshold (0-1) */
  oldThreshold: number;

  /** Recommended new threshold */
  newThreshold: number;

  /** Rationale for the adjustment */
  rationale: string;

  /** Confidence in this recommendation */
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Complete calibration report
 */
export interface CalibrationReport {
  /** Overall calibration result (average across dimensions) */
  overall: CalibrationResult;

  /** Results for each quality dimension */
  byDimension: Record<string, CalibrationResult>;

  /** Summary recommendations */
  recommendations: string[];

  /** Threshold adjustments */
  thresholdAdjustments: ThresholdAdjustment[];

  /** Whether the gauntlet meets overall calibration targets */
  passesCalibration: boolean;

  /** Dimensions that fail calibration */
  failingDimensions: string[];

  /** Analysis metadata */
  metadata: {
    totalChapters: number;
    totalRatings: number;
    averageRatersPerChapter: number;
    analysisTimestamp: string;
    targetCorrelation: number;
  };
}

// ============================================================================
// Statistical Utility Functions
// ============================================================================

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - m, 2));
  return Math.sqrt(mean(squaredDiffs));
}

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculate p-value for Pearson correlation using t-distribution approximation
 */
function correlationPValue(r: number, n: number): number {
  if (n < 3) return 1;

  // t-statistic for correlation
  const t = r * Math.sqrt((n - 2) / (1 - r * r));

  // Two-tailed p-value approximation using normal distribution
  // This is a simplified approximation; for exact values use t-distribution
  const absT = Math.abs(t);
  const p = Math.exp(-0.717 * absT - 0.416 * absT * absT);

  return Math.min(1, 2 * p);
}

/**
 * Calculate 95% confidence interval for correlation using Fisher's z transformation
 */
function correlationCI95(r: number, n: number): [number, number] {
  if (n < 4) return [-1, 1];

  // Fisher's z transformation
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);

  // 95% CI in z space
  const zLow = z - 1.96 * se;
  const zHigh = z + 1.96 * se;

  // Transform back to r space
  const rLow = (Math.exp(2 * zLow) - 1) / (Math.exp(2 * zLow) + 1);
  const rHigh = (Math.exp(2 * zHigh) - 1) / (Math.exp(2 * zHigh) + 1);

  return [Math.max(-1, rLow), Math.min(1, rHigh)];
}

/**
 * Calculate linear regression coefficients
 */
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0 };
  }

  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

/**
 * Calculate Mean Absolute Error
 */
function calculateMAE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;
  const errors = actual.map((a, i) => Math.abs(a - predicted[i]));
  return mean(errors);
}

/**
 * Calculate Root Mean Square Error
 */
function calculateRMSE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;
  const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
  return Math.sqrt(mean(squaredErrors));
}

/**
 * Interpret correlation strength
 */
function interpretCorrelation(r: number): CalibrationResult['interpretation'] {
  const absR = Math.abs(r);
  if (absR < 0.1) return 'negligible';
  if (absR < 0.3) return 'weak';
  if (absR < 0.5) return 'moderate';
  if (absR < 0.7) return 'strong';
  return 'very_strong';
}

// ============================================================================
// Calibration Analyzer Class
// ============================================================================

export class CalibrationAnalyzer {
  /** Target correlation for passing calibration */
  private targetCorrelation: number;

  constructor(targetCorrelation: number = 0.50) {
    this.targetCorrelation = targetCorrelation;
  }

  /**
   * Analyze calibration pairs and produce a complete report
   */
  analyze(pairs: CalibrationPair[]): CalibrationReport {
    if (pairs.length === 0) {
      return this.emptyReport();
    }

    const dimensions = [
      'argumentCoherence',
      'citationCompleteness',
      'styleConsistency',
      'factualAccuracy',
      'overall',
    ] as const;

    const byDimension: Record<string, CalibrationResult> = {};
    const failingDimensions: string[] = [];

    for (const dim of dimensions) {
      const result = this.analyzeDimension(pairs, dim);
      byDimension[dim] = result;

      if (!result.meetsTarget && dim !== 'overall') {
        failingDimensions.push(dim);
      }
    }

    // Calculate overall metrics (average of dimension correlations)
    const dimensionResults = dimensions.slice(0, -1).map(d => byDimension[d]);
    const avgR = mean(dimensionResults.map(r => r.pearsonR));
    const avgRSquared = mean(dimensionResults.map(r => r.rSquared));

    const overall: CalibrationResult = {
      dimension: 'average',
      pearsonR: avgR,
      pValue: mean(dimensionResults.map(r => r.pValue)),
      sampleSize: pairs.length,
      regressionSlope: mean(dimensionResults.map(r => r.regressionSlope)),
      regressionIntercept: mean(dimensionResults.map(r => r.regressionIntercept)),
      confidenceInterval95: [
        mean(dimensionResults.map(r => r.confidenceInterval95[0])),
        mean(dimensionResults.map(r => r.confidenceInterval95[1])),
      ],
      rSquared: avgRSquared,
      mae: mean(dimensionResults.map(r => r.mae)),
      rmse: mean(dimensionResults.map(r => r.rmse)),
      meetsTarget: avgR >= this.targetCorrelation,
      interpretation: interpretCorrelation(avgR),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(byDimension, failingDimensions);

    // Calculate threshold adjustments
    const thresholdAdjustments = this.calculateThresholdAdjustments(pairs, byDimension);

    // Calculate average raters per chapter
    const avgRatersPerChapter = mean(pairs.map(p => p.raterCount));

    return {
      overall,
      byDimension,
      recommendations,
      thresholdAdjustments,
      passesCalibration: overall.meetsTarget && failingDimensions.length === 0,
      failingDimensions,
      metadata: {
        totalChapters: pairs.length,
        totalRatings: pairs.reduce((sum, p) => sum + p.raterCount, 0),
        averageRatersPerChapter: avgRatersPerChapter,
        analysisTimestamp: new Date().toISOString(),
        targetCorrelation: this.targetCorrelation,
      },
    };
  }

  /**
   * Analyze a single dimension
   */
  private analyzeDimension(
    pairs: CalibrationPair[],
    dimension: keyof CalibrationPair['gauntletScores']
  ): CalibrationResult {
    // Extract scores for this dimension
    const gauntletScores = pairs.map(p => p.gauntletScores[dimension]);
    // Convert human ratings (1-5) to gauntlet scale (0-1) for comparison
    const humanScores = pairs.map(p => humanToGauntletScale(p.humanRatings[dimension] as 1|2|3|4|5));

    const n = pairs.length;
    const r = pearsonCorrelation(gauntletScores, humanScores);
    const pValue = correlationPValue(r, n);
    const ci = correlationCI95(r, n);
    const { slope, intercept } = linearRegression(gauntletScores, humanScores);

    // Calculate predicted values for error metrics
    const predicted = gauntletScores.map(g => slope * g + intercept);
    const mae = calculateMAE(humanScores, predicted);
    const rmse = calculateRMSE(humanScores, predicted);

    return {
      dimension,
      pearsonR: r,
      pValue,
      sampleSize: n,
      regressionSlope: slope,
      regressionIntercept: intercept,
      confidenceInterval95: ci,
      rSquared: r * r,
      mae,
      rmse,
      meetsTarget: r >= this.targetCorrelation,
      interpretation: interpretCorrelation(r),
    };
  }

  /**
   * Generate recommendations based on calibration results
   */
  private generateRecommendations(
    byDimension: Record<string, CalibrationResult>,
    failingDimensions: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Overall assessment
    if (failingDimensions.length === 0) {
      recommendations.push(
        'All dimensions meet the calibration target (r >= 0.50). The Quality Gauntlet scores are reasonably correlated with human judgment.'
      );
    } else {
      recommendations.push(
        `${failingDimensions.length} dimension(s) fail to meet the calibration target: ${failingDimensions.join(', ')}. These dimensions require investigation and potential adjustment.`
      );
    }

    // Dimension-specific recommendations
    for (const [dim, result] of Object.entries(byDimension)) {
      if (dim === 'overall') continue;

      if (result.interpretation === 'negligible' || result.interpretation === 'weak') {
        recommendations.push(
          `${dim}: ${result.interpretation} correlation (r=${result.pearsonR.toFixed(3)}). Consider revising the automated scoring criteria or weighting.`
        );
      } else if (result.rSquared < 0.25) {
        recommendations.push(
          `${dim}: Low R² (${result.rSquared.toFixed(3)}) indicates high variance. Consider additional features or human rater training.`
        );
      }
    }

    // Sample size recommendations
    const avgN = Object.values(byDimension)[0].sampleSize;
    if (avgN < 30) {
      recommendations.push(
        `Sample size (n=${avgN}) is small. Collect ratings for at least 30 more chapters to improve statistical power.`
      );
    }

    return recommendations;
  }

  /**
   * Calculate threshold adjustments based on calibration
   */
  private calculateThresholdAdjustments(
    pairs: CalibrationPair[],
    byDimension: Record<string, CalibrationResult>
  ): ThresholdAdjustment[] {
    const adjustments: ThresholdAdjustment[] = [];

    // Current default threshold is 0.80 (80%)
    const currentThreshold = 0.80;

    // Human "acceptable" threshold is 3/5 = 0.5 on gauntlet scale
    const humanAcceptableThreshold = humanToGauntletScale(3);

    for (const [dim, result] of Object.entries(byDimension)) {
      if (dim === 'overall') continue;

      // Use regression to find what gauntlet score corresponds to "acceptable" human rating
      if (result.regressionSlope !== 0) {
        // Solve: humanAcceptableThreshold = slope * gauntletThreshold + intercept
        // gauntletThreshold = (humanAcceptableThreshold - intercept) / slope
        const calibratedThreshold = (humanAcceptableThreshold - result.regressionIntercept) / result.regressionSlope;

        // Only adjust if significantly different from current
        if (Math.abs(calibratedThreshold - currentThreshold) > 0.05) {
          const newThreshold = Math.max(0.5, Math.min(0.95, calibratedThreshold));

          adjustments.push({
            dimension: dim,
            oldThreshold: currentThreshold,
            newThreshold: Math.round(newThreshold * 100) / 100,
            rationale: `Based on regression (r=${result.pearsonR.toFixed(2)}), a gauntlet score of ${newThreshold.toFixed(2)} corresponds to "acceptable" human rating.`,
            confidence: result.meetsTarget ? 'high' : 'medium',
          });
        }
      }
    }

    return adjustments;
  }

  /**
   * Apply calibration to transform a raw gauntlet score
   */
  calibrate(rawScore: number, dimension: string, calibrationResult: CalibrationResult): number {
    // Apply regression transformation
    const calibrated = calibrationResult.regressionSlope * rawScore + calibrationResult.regressionIntercept;

    // Clamp to valid range
    return Math.max(0, Math.min(1, calibrated));
  }

  /**
   * Return empty report when no data available
   */
  private emptyReport(): CalibrationReport {
    return {
      overall: {
        dimension: 'average',
        pearsonR: 0,
        pValue: 1,
        sampleSize: 0,
        regressionSlope: 0,
        regressionIntercept: 0,
        confidenceInterval95: [-1, 1],
        rSquared: 0,
        mae: 0,
        rmse: 0,
        meetsTarget: false,
        interpretation: 'negligible',
      },
      byDimension: {},
      recommendations: ['No calibration data available. Add chapters and collect human ratings.'],
      thresholdAdjustments: [],
      passesCalibration: false,
      failingDimensions: [],
      metadata: {
        totalChapters: 0,
        totalRatings: 0,
        averageRatersPerChapter: 0,
        analysisTimestamp: new Date().toISOString(),
        targetCorrelation: this.targetCorrelation,
      },
    };
  }
}

// Export singleton factory
export function createCalibrationAnalyzer(targetCorrelation?: number): CalibrationAnalyzer {
  return new CalibrationAnalyzer(targetCorrelation);
}
