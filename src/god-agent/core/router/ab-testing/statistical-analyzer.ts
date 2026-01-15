/**
 * Statistical Analyzer for A/B Testing
 *
 * Implements Phase 6.2: A/B Testing Between Models
 *
 * Provides:
 * - T-test for comparing means
 * - Mann-Whitney U test for non-parametric comparison
 * - Chi-square test for success rate comparison
 * - Effect size calculations (Cohen's d)
 * - Confidence interval calculations
 * - Power analysis
 */

import type {
  PairedOutcome,
  StatisticalResults,
  ExperimentResults,
  MetricComparison,
  Winner,
  AnalysisOptions,
} from './types.js';

// ===== CONSTANTS =====

/** Standard normal distribution critical values */
const Z_SCORES: Record<number, number> = {
  0.90: 1.645,
  0.95: 1.96,
  0.99: 2.576,
};

/** T-distribution critical values (approximate for large samples) */
const T_CRITICAL = 1.96; // For 95% confidence, df > 30

// ===== STATISTICAL ANALYZER =====

/**
 * Analyzer for A/B test results
 */
export class StatisticalAnalyzer {
  private readonly defaultSignificance: number;
  private readonly minSampleSize: number;

  constructor(options: { significanceLevel?: number; minSampleSize?: number } = {}) {
    this.defaultSignificance = options.significanceLevel ?? 0.05;
    this.minSampleSize = options.minSampleSize ?? 5;
  }

  /**
   * Perform full statistical analysis on paired outcomes
   */
  analyze(
    experimentId: string,
    outcomes: PairedOutcome[],
    options: AnalysisOptions = {}
  ): ExperimentResults {
    const significanceLevel = options.significanceLevel ?? this.defaultSignificance;

    if (outcomes.length < this.minSampleSize) {
      return this.createInconclusiveResult(experimentId, outcomes, 'Insufficient samples');
    }

    // Extract quality scores
    const qualityA = outcomes.map(o => this.calculateQualityScore(o.modelAResult));
    const qualityB = outcomes.map(o => this.calculateQualityScore(o.modelBResult));

    // Calculate statistics
    const statistics = this.calculateStatistics(qualityA, qualityB, significanceLevel);

    // Calculate metric comparisons
    const qualityComparison = this.compareMetric('Quality Score', qualityA, qualityB, significanceLevel);
    const latencyComparison = this.compareMetric(
      'Latency (ms)',
      outcomes.map(o => o.modelAResult.latencyMs),
      outcomes.map(o => o.modelBResult.latencyMs),
      significanceLevel,
      true // Lower is better
    );
    const costComparison = this.compareMetric(
      'Cost (USD)',
      outcomes.map(o => o.modelAResult.cost),
      outcomes.map(o => o.modelBResult.cost),
      significanceLevel,
      true // Lower is better
    );
    const successRateComparison = this.compareSuccessRates(
      outcomes.map(o => o.modelAResult.success),
      outcomes.map(o => o.modelBResult.success),
      significanceLevel
    );

    // Determine winner
    const winner = this.determineWinner(statistics, qualityComparison, significanceLevel);

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      winner,
      statistics,
      qualityComparison,
      costComparison
    );

    return {
      experimentId,
      analyzedAt: new Date(),
      winner,
      recommendation,
      confidence: statistics.isSignificant ? 1 - statistics.tTestPValue : 0.5,
      statistics,
      qualityComparison,
      latencyComparison,
      costComparison,
      successRateComparison,
      pairedOutcomes: outcomes,
    };
  }

  /**
   * Perform interim analysis (may not be conclusive)
   */
  interimAnalysis(
    experimentId: string,
    outcomes: PairedOutcome[],
    options: AnalysisOptions = {}
  ): ExperimentResults {
    return this.analyze(experimentId, outcomes, { ...options, includeInterim: true });
  }

  /**
   * Check if experiment has reached statistical significance
   */
  hasReachedSignificance(
    outcomes: PairedOutcome[],
    significanceLevel: number = this.defaultSignificance
  ): boolean {
    if (outcomes.length < this.minSampleSize) {
      return false;
    }

    const qualityA = outcomes.map(o => this.calculateQualityScore(o.modelAResult));
    const qualityB = outcomes.map(o => this.calculateQualityScore(o.modelBResult));

    const pValue = this.tTest(qualityA, qualityB);
    return pValue < significanceLevel;
  }

  /**
   * Estimate required sample size for given effect size
   */
  estimateSampleSize(
    effectSize: number,
    power: number = 0.8,
    significanceLevel: number = 0.05
  ): number {
    // Using simplified formula for two-sample t-test
    // n = 2 * ((z_alpha + z_beta) / effectSize)^2
    const zAlpha = this.getZScore(1 - significanceLevel / 2);
    const zBeta = this.getZScore(power);

    const n = 2 * Math.pow((zAlpha + zBeta) / effectSize, 2);
    return Math.ceil(n);
  }

  // ===== PRIVATE: STATISTICAL CALCULATIONS =====

  /**
   * Calculate full statistics
   */
  private calculateStatistics(
    valuesA: number[],
    valuesB: number[],
    significanceLevel: number
  ): StatisticalResults {
    const nA = valuesA.length;
    const nB = valuesB.length;

    // Descriptive statistics
    const meanA = this.mean(valuesA);
    const meanB = this.mean(valuesB);
    const stdA = this.standardDeviation(valuesA);
    const stdB = this.standardDeviation(valuesB);

    // Effect size
    const meanDifference = meanA - meanB;
    const pooledStd = this.pooledStandardDeviation(valuesA, valuesB);
    const cohensD = pooledStd > 0 ? meanDifference / pooledStd : 0;

    // Statistical tests
    const tTestPValue = this.tTest(valuesA, valuesB);
    const mannWhitneyPValue = this.mannWhitneyU(valuesA, valuesB);

    // Success rates for chi-square
    const successesA = valuesA.filter(v => v >= 0.5).length;
    const successesB = valuesB.filter(v => v >= 0.5).length;
    const chiSquarePValue = this.chiSquareTest(successesA, nA, successesB, nB);

    // Confidence interval for mean difference
    const se = Math.sqrt((stdA * stdA) / nA + (stdB * stdB) / nB);
    const margin = T_CRITICAL * se;
    const confidenceInterval: [number, number] = [
      meanDifference - margin,
      meanDifference + margin,
    ];

    // Significance determination
    const isSignificant = tTestPValue < significanceLevel;

    // Achieved power (post-hoc)
    const achievedPower = this.calculatePower(nA, nB, cohensD, significanceLevel);

    return {
      nA,
      nB,
      meanQualityA: meanA,
      meanQualityB: meanB,
      stdQualityA: stdA,
      stdQualityB: stdB,
      successRateA: successesA / nA,
      successRateB: successesB / nB,
      meanDifference,
      cohensD,
      tTestPValue,
      mannWhitneyPValue,
      chiSquarePValue,
      confidenceInterval,
      isSignificant,
      confidenceLevel: 1 - significanceLevel,
      achievedPower,
    };
  }

  /**
   * Two-sample t-test (Welch's t-test)
   */
  private tTest(valuesA: number[], valuesB: number[]): number {
    const nA = valuesA.length;
    const nB = valuesB.length;

    if (nA < 2 || nB < 2) return 1;

    const meanA = this.mean(valuesA);
    const meanB = this.mean(valuesB);
    const varA = this.variance(valuesA);
    const varB = this.variance(valuesB);

    const se = Math.sqrt(varA / nA + varB / nB);
    if (se === 0) return meanA === meanB ? 1 : 0;

    const t = (meanA - meanB) / se;

    // Degrees of freedom (Welch-Satterthwaite)
    const df = Math.pow(varA / nA + varB / nB, 2) /
      (Math.pow(varA / nA, 2) / (nA - 1) + Math.pow(varB / nB, 2) / (nB - 1));

    return this.tDistributionPValue(Math.abs(t), df);
  }

  /**
   * Mann-Whitney U test (non-parametric)
   */
  private mannWhitneyU(valuesA: number[], valuesB: number[]): number {
    const nA = valuesA.length;
    const nB = valuesB.length;

    if (nA < 2 || nB < 2) return 1;

    // Combine and rank
    const combined = [
      ...valuesA.map(v => ({ value: v, group: 'A' })),
      ...valuesB.map(v => ({ value: v, group: 'B' })),
    ].sort((a, b) => a.value - b.value);

    // Assign ranks (with ties)
    const ranks = this.assignRanks(combined.map(c => c.value));

    // Sum of ranks for group A
    let rankSumA = 0;
    let idx = 0;
    for (const item of combined) {
      if (item.group === 'A') {
        rankSumA += ranks[idx];
      }
      idx++;
    }

    // U statistic
    const U = rankSumA - (nA * (nA + 1)) / 2;

    // Normal approximation for large samples
    const mu = (nA * nB) / 2;
    const sigma = Math.sqrt((nA * nB * (nA + nB + 1)) / 12);

    if (sigma === 0) return 1;

    const z = (U - mu) / sigma;
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }

  /**
   * Chi-square test for success rates
   */
  private chiSquareTest(
    successesA: number,
    totalA: number,
    successesB: number,
    totalB: number
  ): number {
    const failuresA = totalA - successesA;
    const failuresB = totalB - successesB;

    const total = totalA + totalB;
    const totalSuccesses = successesA + successesB;
    const totalFailures = failuresA + failuresB;

    // Expected values
    const expectedSuccessA = (totalA * totalSuccesses) / total;
    const expectedFailureA = (totalA * totalFailures) / total;
    const expectedSuccessB = (totalB * totalSuccesses) / total;
    const expectedFailureB = (totalB * totalFailures) / total;

    // Chi-square statistic
    let chiSquare = 0;
    if (expectedSuccessA > 0) {
      chiSquare += Math.pow(successesA - expectedSuccessA, 2) / expectedSuccessA;
    }
    if (expectedFailureA > 0) {
      chiSquare += Math.pow(failuresA - expectedFailureA, 2) / expectedFailureA;
    }
    if (expectedSuccessB > 0) {
      chiSquare += Math.pow(successesB - expectedSuccessB, 2) / expectedSuccessB;
    }
    if (expectedFailureB > 0) {
      chiSquare += Math.pow(failuresB - expectedFailureB, 2) / expectedFailureB;
    }

    // P-value from chi-square distribution (df=1)
    return this.chiSquarePValue(chiSquare, 1);
  }

  // ===== PRIVATE: METRIC COMPARISON =====

  /**
   * Compare a metric between two groups
   */
  private compareMetric(
    name: string,
    valuesA: number[],
    valuesB: number[],
    significanceLevel: number,
    lowerIsBetter: boolean = false
  ): MetricComparison {
    const meanA = this.mean(valuesA);
    const meanB = this.mean(valuesB);
    const difference = meanA - meanB;
    const percentDifference = meanB !== 0 ? ((meanA - meanB) / Math.abs(meanB)) * 100 : 0;

    const pValue = this.tTest(valuesA, valuesB);
    const isSignificant = pValue < significanceLevel;

    let better: 'model_a' | 'model_b' | 'tie';
    if (!isSignificant) {
      better = 'tie';
    } else if (lowerIsBetter) {
      better = meanA < meanB ? 'model_a' : 'model_b';
    } else {
      better = meanA > meanB ? 'model_a' : 'model_b';
    }

    return {
      metric: name,
      valueA: meanA,
      valueB: meanB,
      difference,
      percentDifference,
      better,
      isSignificant,
    };
  }

  /**
   * Compare success rates
   */
  private compareSuccessRates(
    successA: boolean[],
    successB: boolean[],
    significanceLevel: number
  ): MetricComparison {
    const rateA = successA.filter(Boolean).length / successA.length;
    const rateB = successB.filter(Boolean).length / successB.length;
    const difference = rateA - rateB;
    const percentDifference = rateB !== 0 ? ((rateA - rateB) / rateB) * 100 : 0;

    const pValue = this.chiSquareTest(
      successA.filter(Boolean).length,
      successA.length,
      successB.filter(Boolean).length,
      successB.length
    );
    const isSignificant = pValue < significanceLevel;

    let better: 'model_a' | 'model_b' | 'tie';
    if (!isSignificant) {
      better = 'tie';
    } else {
      better = rateA > rateB ? 'model_a' : 'model_b';
    }

    return {
      metric: 'Success Rate',
      valueA: rateA,
      valueB: rateB,
      difference,
      percentDifference,
      better,
      isSignificant,
    };
  }

  // ===== PRIVATE: HELPER FUNCTIONS =====

  /**
   * Calculate quality score from model outcome
   */
  private calculateQualityScore(outcome: {
    success: boolean;
    userRating?: number;
    userAccepted?: boolean;
    testsPass?: boolean;
  }): number {
    let score = 0;
    let weights = 0;

    // Base success (weight 0.3)
    if (outcome.success) {
      score += 0.3;
    }
    weights += 0.3;

    // User rating (weight 0.3)
    if (outcome.userRating !== undefined) {
      score += ((outcome.userRating - 1) / 4) * 0.3;
      weights += 0.3;
    }

    // User accepted (weight 0.25)
    if (outcome.userAccepted !== undefined) {
      if (outcome.userAccepted) score += 0.25;
      weights += 0.25;
    }

    // Tests pass (weight 0.15)
    if (outcome.testsPass !== undefined) {
      if (outcome.testsPass) score += 0.15;
      weights += 0.15;
    }

    return weights > 0 ? score / weights : 0;
  }

  /**
   * Determine overall winner
   */
  private determineWinner(
    stats: StatisticalResults,
    qualityComparison: MetricComparison,
    significanceLevel: number
  ): Winner {
    if (!stats.isSignificant) {
      // Not significant - check sample size
      if (stats.nA + stats.nB < this.minSampleSize * 2) {
        return 'inconclusive';
      }
      return 'tie';
    }

    return qualityComparison.better === 'model_a' ? 'model_a' : 'model_b';
  }

  /**
   * Generate recommendation text
   */
  private generateRecommendation(
    winner: Winner,
    stats: StatisticalResults,
    qualityComparison: MetricComparison,
    costComparison: MetricComparison
  ): string {
    if (winner === 'inconclusive') {
      return `Insufficient data for conclusive results. Need at least ${this.minSampleSize * 2} samples.`;
    }

    if (winner === 'tie') {
      if (costComparison.isSignificant && costComparison.better !== 'tie') {
        const cheaperModel = costComparison.better === 'model_a' ? 'Model A' : 'Model B';
        const savings = Math.abs(costComparison.percentDifference).toFixed(1);
        return `Quality is equivalent. Consider using ${cheaperModel} for ${savings}% cost savings.`;
      }
      return 'No significant difference between models. Either can be used.';
    }

    const winnerLabel = winner === 'model_a' ? 'Model A' : 'Model B';
    const qualityDiff = Math.abs(qualityComparison.percentDifference).toFixed(1);
    const effectSize = this.interpretEffectSize(stats.cohensD);

    let recommendation = `${winnerLabel} shows ${qualityDiff}% better quality with ${effectSize} effect size.`;

    if (costComparison.isSignificant) {
      const costDiff = Math.abs(costComparison.percentDifference).toFixed(1);
      if (costComparison.better === winner) {
        recommendation += ` Also ${costDiff}% cheaper.`;
      } else {
        recommendation += ` However, it's ${costDiff}% more expensive.`;
      }
    }

    return recommendation;
  }

  /**
   * Interpret Cohen's d effect size
   */
  private interpretEffectSize(d: number): string {
    const absD = Math.abs(d);
    if (absD < 0.2) return 'negligible';
    if (absD < 0.5) return 'small';
    if (absD < 0.8) return 'medium';
    return 'large';
  }

  /**
   * Create inconclusive result
   */
  private createInconclusiveResult(
    experimentId: string,
    outcomes: PairedOutcome[],
    reason: string
  ): ExperimentResults {
    const emptyStats: StatisticalResults = {
      nA: outcomes.length,
      nB: outcomes.length,
      meanQualityA: 0,
      meanQualityB: 0,
      stdQualityA: 0,
      stdQualityB: 0,
      successRateA: 0,
      successRateB: 0,
      meanDifference: 0,
      cohensD: 0,
      tTestPValue: 1,
      mannWhitneyPValue: 1,
      chiSquarePValue: 1,
      confidenceInterval: [0, 0],
      isSignificant: false,
      confidenceLevel: 0.95,
      achievedPower: 0,
    };

    const emptyComparison: MetricComparison = {
      metric: '',
      valueA: 0,
      valueB: 0,
      difference: 0,
      percentDifference: 0,
      better: 'tie',
      isSignificant: false,
    };

    return {
      experimentId,
      analyzedAt: new Date(),
      winner: 'inconclusive',
      recommendation: reason,
      confidence: 0,
      statistics: emptyStats,
      qualityComparison: { ...emptyComparison, metric: 'Quality' },
      latencyComparison: { ...emptyComparison, metric: 'Latency' },
      costComparison: { ...emptyComparison, metric: 'Cost' },
      successRateComparison: { ...emptyComparison, metric: 'Success Rate' },
      pairedOutcomes: outcomes,
    };
  }

  // ===== PRIVATE: MATHEMATICAL UTILITIES =====

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private variance(values: number[]): number {
    if (values.length < 2) return 0;
    const m = this.mean(values);
    return values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  }

  private standardDeviation(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  private pooledStandardDeviation(valuesA: number[], valuesB: number[]): number {
    const nA = valuesA.length;
    const nB = valuesB.length;
    if (nA + nB < 4) return 0;

    const varA = this.variance(valuesA);
    const varB = this.variance(valuesB);

    return Math.sqrt(((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2));
  }

  private assignRanks(values: number[]): number[] {
    const indexed = values.map((v, i) => ({ value: v, index: i }));
    indexed.sort((a, b) => a.value - b.value);

    const ranks = new Array(values.length);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j < indexed.length && indexed[j].value === indexed[i].value) {
        j++;
      }
      const avgRank = (i + j + 1) / 2; // Average rank for ties
      for (let k = i; k < j; k++) {
        ranks[indexed[k].index] = avgRank;
      }
      i = j;
    }
    return ranks;
  }

  private getZScore(confidence: number): number {
    // Approximate inverse normal CDF
    // Using Beasley-Springer-Moro algorithm approximation
    const p = confidence;
    const a = [
      -3.969683028665376e+01, 2.209460984245205e+02,
      -2.759285104469687e+02, 1.383577518672690e+02,
      -3.066479806614716e+01, 2.506628277459239e+00,
    ];
    const b = [
      -5.447609879822406e+01, 1.615858368580409e+02,
      -1.556989798598866e+02, 6.680131188771972e+01,
      -1.328068155288572e+01,
    ];
    const c = [
      -7.784894002430293e-03, -3.223964580411365e-01,
      -2.400758277161838e+00, -2.549732539343734e+00,
      4.374664141464968e+00, 2.938163982698783e+00,
    ];
    const d = [
      7.784695709041462e-03, 3.224671290700398e-01,
      2.445134137142996e+00, 3.754408661907416e+00,
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (
        ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
      );
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return (
        -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    }
  }

  private normalCDF(z: number): number {
    // Approximation of standard normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  private tDistributionPValue(t: number, df: number): number {
    // Approximation for large df using normal distribution
    if (df > 30) {
      return 2 * (1 - this.normalCDF(t));
    }

    // Beta function approximation for small df
    const x = df / (df + t * t);
    return this.regularizedIncompleteBeta(df / 2, 0.5, x);
  }

  private chiSquarePValue(chiSquare: number, df: number): number {
    // Approximation using Wilson-Hilferty transformation
    if (chiSquare <= 0) return 1;

    const z = Math.pow(chiSquare / df, 1 / 3) - (1 - 2 / (9 * df));
    const denom = Math.sqrt(2 / (9 * df));
    if (denom === 0) return 1;

    return 1 - this.normalCDF(z / denom);
  }

  private regularizedIncompleteBeta(a: number, b: number, x: number): number {
    // Simple approximation for beta function
    // For more accuracy, would need a proper implementation
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Use continued fraction approximation
    const bt = Math.exp(
      a * Math.log(x) + b * Math.log(1 - x) -
      Math.log(a) - this.logBeta(a, b)
    );

    if (x < (a + 1) / (a + b + 2)) {
      return bt * this.betaCF(a, b, x) / a;
    } else {
      return 1 - bt * this.betaCF(b, a, 1 - x) / b;
    }
  }

  private logBeta(a: number, b: number): number {
    return this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b);
  }

  private logGamma(x: number): number {
    // Stirling's approximation
    if (x <= 0) return 0;
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x);
  }

  private betaCF(a: number, b: number, x: number): number {
    const maxIterations = 100;
    const eps = 3e-7;

    let am = 1, bm = 1, az = 1;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let bz = 1 - qab * x / qap;

    for (let m = 1; m <= maxIterations; m++) {
      const em = m;
      const tem = em + em;
      let d = em * (b - m) * x / ((qam + tem) * (a + tem));
      const ap = az + d * am;
      const bp = bz + d * bm;
      d = -(a + em) * (qab + em) * x / ((a + tem) * (qap + tem));
      const app = ap + d * az;
      const bpp = bp + d * bz;
      const aOld = az;
      am = ap / bpp;
      bm = bp / bpp;
      az = app / bpp;
      bz = 1;
      if (Math.abs(az - aOld) < eps * Math.abs(az)) {
        return az;
      }
    }
    return az;
  }

  private calculatePower(nA: number, nB: number, effectSize: number, alpha: number): number {
    // Post-hoc power analysis
    const n = 2 * nA * nB / (nA + nB); // Harmonic mean
    const se = 1 / Math.sqrt(n / 2);
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = Math.abs(effectSize) / se - zAlpha;
    return this.normalCDF(zBeta);
  }
}

// ===== SINGLETON =====

let analyzerInstance: StatisticalAnalyzer | null = null;

/**
 * Get or create the singleton StatisticalAnalyzer
 */
export function getStatisticalAnalyzer(): StatisticalAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new StatisticalAnalyzer();
  }
  return analyzerInstance;
}

/**
 * Initialize the statistical analyzer with options
 */
export function initializeStatisticalAnalyzer(
  options: { significanceLevel?: number; minSampleSize?: number } = {}
): StatisticalAnalyzer {
  analyzerInstance = new StatisticalAnalyzer(options);
  return analyzerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetStatisticalAnalyzer(): void {
  analyzerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format statistical results for display
 */
export function formatStatisticalResults(results: StatisticalResults): string {
  const lines = [
    `Sample Sizes: Model A = ${results.nA}, Model B = ${results.nB}`,
    '',
    'Quality Metrics:',
    `  Model A: ${(results.meanQualityA * 100).toFixed(1)}% \u00B1 ${(results.stdQualityA * 100).toFixed(1)}%`,
    `  Model B: ${(results.meanQualityB * 100).toFixed(1)}% \u00B1 ${(results.stdQualityB * 100).toFixed(1)}%`,
    `  Difference: ${(results.meanDifference * 100).toFixed(2)}%`,
    '',
    'Success Rates:',
    `  Model A: ${(results.successRateA * 100).toFixed(1)}%`,
    `  Model B: ${(results.successRateB * 100).toFixed(1)}%`,
    '',
    'Statistical Tests:',
    `  T-test p-value: ${results.tTestPValue.toFixed(4)}`,
    `  Mann-Whitney p-value: ${results.mannWhitneyPValue.toFixed(4)}`,
    `  Chi-square p-value: ${results.chiSquarePValue.toFixed(4)}`,
    '',
    'Effect Size:',
    `  Cohen's d: ${results.cohensD.toFixed(3)}`,
    `  95% CI: [${results.confidenceInterval[0].toFixed(3)}, ${results.confidenceInterval[1].toFixed(3)}]`,
    '',
    `Significant: ${results.isSignificant ? 'Yes' : 'No'} (${(results.confidenceLevel * 100).toFixed(0)}% confidence)`,
    `Achieved Power: ${(results.achievedPower * 100).toFixed(1)}%`,
  ];
  return lines.join('\n');
}

/**
 * Format experiment results for display
 */
export function formatExperimentResults(results: ExperimentResults): string {
  const lines = [
    `=== A/B Test Results: ${results.experimentId} ===`,
    '',
    `Winner: ${results.winner.toUpperCase()}`,
    `Confidence: ${(results.confidence * 100).toFixed(1)}%`,
    '',
    `Recommendation: ${results.recommendation}`,
    '',
    '--- Quality Comparison ---',
    `Model A: ${(results.qualityComparison.valueA * 100).toFixed(1)}%`,
    `Model B: ${(results.qualityComparison.valueB * 100).toFixed(1)}%`,
    `Better: ${results.qualityComparison.better}`,
    '',
    '--- Latency Comparison ---',
    `Model A: ${results.latencyComparison.valueA.toFixed(0)}ms`,
    `Model B: ${results.latencyComparison.valueB.toFixed(0)}ms`,
    `Better: ${results.latencyComparison.better}`,
    '',
    '--- Cost Comparison ---',
    `Model A: $${results.costComparison.valueA.toFixed(4)}`,
    `Model B: $${results.costComparison.valueB.toFixed(4)}`,
    `Better: ${results.costComparison.better}`,
  ];
  return lines.join('\n');
}
