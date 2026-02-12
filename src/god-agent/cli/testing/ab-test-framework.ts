/**
 * A/B Test Framework - PHASE-5-001
 *
 * Enables empirical validation of pipeline changes through controlled experiments.
 *
 * Features:
 * - Test configuration with treatment/control configs
 * - Deterministic random assignment based on session ID hash
 * - Metric recording and statistical analysis
 * - Welch's t-test for significance testing
 * - Cohen's d effect size calculation
 *
 * Usage:
 * ```typescript
 * import { createABTestFramework } from './testing/ab-test-framework.js';
 *
 * const framework = createABTestFramework();
 *
 * // Register a test
 * framework.registerTest({
 *   testId: 'style-injection-v2',
 *   name: 'Style Injection V2',
 *   description: 'Test new style injection approach',
 *   treatmentConfig: { styleInjection: 'v2' },
 *   controlConfig: { styleInjection: 'v1' },
 *   treatmentRatio: 0.5,
 *   successMetrics: ['quality_score', 'latency_ms'],
 *   minSampleSize: 30,
 * });
 *
 * // Get assignment for a session
 * const assignment = framework.getAssignment(sessionId, 'style-injection-v2');
 * const config = framework.getConfigForSession(sessionId, 'style-injection-v2');
 *
 * // Record metrics
 * framework.recordMetric(sessionId, 'style-injection-v2', 'quality_score', 0.85);
 *
 * // Get results
 * const results = framework.getResults('style-injection-v2');
 * console.log(formatABTestResult(results));
 * ```
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Configuration for an A/B test
 */
export interface ABTestConfig {
  /** Unique identifier for the test */
  testId: string;

  /** Human-readable name */
  name: string;

  /** Description of what is being tested */
  description: string;

  /** Configuration to use for treatment group */
  treatmentConfig: Record<string, unknown>;

  /** Configuration to use for control group */
  controlConfig: Record<string, unknown>;

  /** Ratio of sessions assigned to treatment (0-1, default 0.5) */
  treatmentRatio: number;

  /** List of metric names to track for this test */
  successMetrics: string[];

  /** Minimum sample size per group before analysis is valid */
  minSampleSize: number;

  /** Optional start date for the test */
  startDate?: string;

  /** Optional end date for the test */
  endDate?: string;

  /** Optional function to exclude certain sessions from the test */
  excludeCriteria?: (sessionId: string) => boolean;
}

/**
 * A single metric value recorded for a session
 */
export interface ABTestMetricValue {
  /** Session ID that generated this metric */
  sessionId: string;

  /** The metric value */
  value: number;

  /** When the metric was recorded */
  timestamp: string;

  /** Which group this session was assigned to */
  assignment: 'treatment' | 'control';
}

/**
 * Statistical analysis for a single metric
 */
export interface ABTestMetricStats {
  /** Treatment group statistics */
  treatment: {
    mean: number;
    stdDev: number;
    count: number;
    values: number[];
  };

  /** Control group statistics */
  control: {
    mean: number;
    stdDev: number;
    count: number;
    values: number[];
  };

  /** P-value from Welch's t-test */
  pValue: number;

  /** Whether the difference is statistically significant (p < 0.05) */
  significantDifference: boolean;

  /** Cohen's d effect size */
  effectSize: number;
}

/**
 * Overall results for an A/B test
 */
export interface ABTestResult {
  /** Test identifier */
  testId: string;

  /** Test name */
  testName: string;

  /** Test status */
  status: 'running' | 'completed' | 'insufficient_data';

  /** Number of sessions in treatment group */
  treatmentSessions: number;

  /** Number of sessions in control group */
  controlSessions: number;

  /** Analysis results for each metric */
  metrics: Record<string, ABTestMetricStats>;

  /** Overall winner determination */
  winner: 'treatment' | 'control' | 'inconclusive';

  /** Human-readable recommendation */
  recommendation: string;

  /** When this analysis was performed */
  analysisTimestamp: string;
}

/**
 * Events emitted by the A/B test framework
 */
export interface ABTestEvent {
  /** Event type */
  type: 'test_registered' | 'session_assigned' | 'metric_recorded' | 'test_analyzed';

  /** Test ID this event relates to */
  testId: string;

  /** When the event occurred */
  timestamp: string;

  /** Additional event data */
  data: Record<string, unknown>;
}

// ============================================================================
// A/B Test Framework Class
// ============================================================================

/**
 * A/B Test Framework
 *
 * Manages A/B tests for empirical validation of pipeline changes.
 * Provides deterministic assignment, metric tracking, and statistical analysis.
 */
export class ABTestFramework extends EventEmitter {
  private tests: Map<string, ABTestConfig> = new Map();
  private assignments: Map<string, Map<string, 'treatment' | 'control'>> = new Map();
  private metrics: Map<string, Map<string, ABTestMetricValue[]>> = new Map();

  constructor() {
    super();
  }

  // ==========================================================================
  // Test Registration
  // ==========================================================================

  /**
   * Register a new A/B test
   * @param config - Test configuration
   * @throws Error if config is invalid
   */
  registerTest(config: ABTestConfig): void {
    // Validate config
    if (config.treatmentRatio < 0 || config.treatmentRatio > 1) {
      throw new Error('Treatment ratio must be between 0 and 1');
    }
    if (config.minSampleSize < 1) {
      throw new Error('Minimum sample size must be at least 1');
    }
    if (config.successMetrics.length === 0) {
      throw new Error('At least one success metric must be defined');
    }
    if (!config.testId || config.testId.trim() === '') {
      throw new Error('Test ID must not be empty');
    }

    this.tests.set(config.testId, config);
    this.assignments.set(config.testId, new Map());
    this.metrics.set(config.testId, new Map());

    this.emit('test_registered', {
      type: 'test_registered',
      testId: config.testId,
      timestamp: new Date().toISOString(),
      data: { name: config.name, treatmentRatio: config.treatmentRatio },
    } as ABTestEvent);
  }

  /**
   * List all registered tests
   */
  listTests(): ABTestConfig[] {
    return Array.from(this.tests.values());
  }

  /**
   * Get a specific test configuration
   * @param testId - Test identifier
   */
  getTest(testId: string): ABTestConfig | undefined {
    return this.tests.get(testId);
  }

  /**
   * Check if a test exists
   * @param testId - Test identifier
   */
  hasTest(testId: string): boolean {
    return this.tests.has(testId);
  }

  // ==========================================================================
  // Assignment
  // ==========================================================================

  /**
   * Get or assign treatment/control for a session
   *
   * Assignment is deterministic based on session ID hash, ensuring
   * the same session always gets the same assignment.
   *
   * @param sessionId - Session identifier
   * @param testId - Test identifier
   * @returns 'treatment' or 'control'
   * @throws Error if test is not found
   */
  getAssignment(sessionId: string, testId: string): 'treatment' | 'control' {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const testAssignments = this.assignments.get(testId)!;

    // Return existing assignment if present
    if (testAssignments.has(sessionId)) {
      return testAssignments.get(sessionId)!;
    }

    // Check exclusion criteria
    if (test.excludeCriteria && test.excludeCriteria(sessionId)) {
      // Excluded sessions default to control
      testAssignments.set(sessionId, 'control');
      return 'control';
    }

    // Deterministic assignment based on session ID hash
    const assignment = this.computeAssignment(sessionId, testId, test.treatmentRatio);
    testAssignments.set(sessionId, assignment);

    this.emit('session_assigned', {
      type: 'session_assigned',
      testId,
      timestamp: new Date().toISOString(),
      data: { sessionId, assignment },
    } as ABTestEvent);

    return assignment;
  }

  /**
   * Get the config to use based on session assignment
   * @param sessionId - Session identifier
   * @param testId - Test identifier
   * @returns The appropriate config for this session
   * @throws Error if test is not found
   */
  getConfigForSession(sessionId: string, testId: string): Record<string, unknown> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const assignment = this.getAssignment(sessionId, testId);
    return assignment === 'treatment' ? test.treatmentConfig : test.controlConfig;
  }

  /**
   * Get session counts for a test
   * @param testId - Test identifier
   */
  getSessionCounts(testId: string): { treatment: number; control: number } {
    const testAssignments = this.assignments.get(testId);
    if (!testAssignments) {
      return { treatment: 0, control: 0 };
    }

    let treatment = 0;
    let control = 0;
    for (const assignment of Array.from(testAssignments.values())) {
      if (assignment === 'treatment') treatment++;
      else control++;
    }

    return { treatment, control };
  }

  // ==========================================================================
  // Metric Recording
  // ==========================================================================

  /**
   * Record a metric value for a session
   * @param sessionId - Session identifier
   * @param testId - Test identifier
   * @param metricName - Name of the metric
   * @param value - Metric value
   * @throws Error if test or metric is not found
   */
  recordMetric(
    sessionId: string,
    testId: string,
    metricName: string,
    value: number
  ): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (!test.successMetrics.includes(metricName)) {
      throw new Error(`Metric ${metricName} not defined for test ${testId}`);
    }

    const assignment = this.getAssignment(sessionId, testId);
    const testMetrics = this.metrics.get(testId)!;

    if (!testMetrics.has(metricName)) {
      testMetrics.set(metricName, []);
    }

    const metricRecord: ABTestMetricValue = {
      sessionId,
      value,
      timestamp: new Date().toISOString(),
      assignment,
    };

    testMetrics.get(metricName)!.push(metricRecord);

    this.emit('metric_recorded', {
      type: 'metric_recorded',
      testId,
      timestamp: new Date().toISOString(),
      data: { sessionId, metricName, value, assignment },
    } as ABTestEvent);
  }

  /**
   * Get all recorded metrics for a test
   * @param testId - Test identifier
   */
  getMetrics(testId: string): Map<string, ABTestMetricValue[]> | undefined {
    return this.metrics.get(testId);
  }

  // ==========================================================================
  // Analysis
  // ==========================================================================

  /**
   * Analyze test results and determine winner
   * @param testId - Test identifier
   * @returns Test results with statistical analysis
   * @throws Error if test is not found
   */
  getResults(testId: string): ABTestResult {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const testAssignments = this.assignments.get(testId)!;
    const testMetrics = this.metrics.get(testId)!;

    // Count sessions
    let treatmentSessions = 0;
    let controlSessions = 0;
    for (const assignment of Array.from(testAssignments.values())) {
      if (assignment === 'treatment') treatmentSessions++;
      else controlSessions++;
    }

    // Check sample size
    const meetsMinSample =
      treatmentSessions >= test.minSampleSize &&
      controlSessions >= test.minSampleSize;

    const status: ABTestResult['status'] = meetsMinSample
      ? 'completed'
      : 'insufficient_data';

    // Analyze each metric
    const metricsAnalysis: Record<string, ABTestMetricStats> = {};
    let treatmentWins = 0;
    let controlWins = 0;

    for (const metricName of test.successMetrics) {
      const values = testMetrics.get(metricName) || [];
      const treatmentValues = values
        .filter((v) => v.assignment === 'treatment')
        .map((v) => v.value);
      const controlValues = values
        .filter((v) => v.assignment === 'control')
        .map((v) => v.value);

      const stats = this.calculateMetricStats(treatmentValues, controlValues);
      metricsAnalysis[metricName] = stats;

      // Count wins (treatment should have higher mean for positive metrics)
      if (stats.significantDifference) {
        if (stats.treatment.mean > stats.control.mean) treatmentWins++;
        else controlWins++;
      }
    }

    // Determine winner
    let winner: ABTestResult['winner'];
    let recommendation: string;

    if (status === 'insufficient_data') {
      winner = 'inconclusive';
      const neededTreatment = Math.max(0, test.minSampleSize - treatmentSessions);
      const neededControl = Math.max(0, test.minSampleSize - controlSessions);
      const totalNeeded = neededTreatment + neededControl;
      recommendation = `Need ${totalNeeded} more sessions to reach minimum sample size (${neededTreatment} treatment, ${neededControl} control).`;
    } else if (treatmentWins > controlWins) {
      winner = 'treatment';
      recommendation = `Treatment outperforms control on ${treatmentWins} of ${test.successMetrics.length} metrics with statistical significance. Consider adopting the treatment configuration.`;
    } else if (controlWins > treatmentWins) {
      winner = 'control';
      recommendation = `Control outperforms treatment on ${controlWins} of ${test.successMetrics.length} metrics. Consider keeping current behavior.`;
    } else {
      winner = 'inconclusive';
      recommendation = `No statistically significant difference detected between treatment and control. Consider extending the test or re-evaluating the hypothesis.`;
    }

    const result: ABTestResult = {
      testId,
      testName: test.name,
      status,
      treatmentSessions,
      controlSessions,
      metrics: metricsAnalysis,
      winner,
      recommendation,
      analysisTimestamp: new Date().toISOString(),
    };

    this.emit('test_analyzed', {
      type: 'test_analyzed',
      testId,
      timestamp: new Date().toISOString(),
      data: { winner, treatmentSessions, controlSessions },
    } as ABTestEvent);

    return result;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Compute deterministic assignment based on session ID hash
   */
  private computeAssignment(
    sessionId: string,
    testId: string,
    treatmentRatio: number
  ): 'treatment' | 'control' {
    const hash = createHash('sha256')
      .update(`${testId}:${sessionId}`)
      .digest('hex');

    // Convert first 8 hex chars to a number between 0 and 1
    const hashNum = parseInt(hash.slice(0, 8), 16) / 0xffffffff;

    return hashNum < treatmentRatio ? 'treatment' : 'control';
  }

  /**
   * Calculate statistical metrics for treatment vs control
   */
  private calculateMetricStats(
    treatment: number[],
    control: number[]
  ): ABTestMetricStats {
    const treatmentStats = this.calcDescriptiveStats(treatment);
    const controlStats = this.calcDescriptiveStats(control);

    // Welch's t-test for unequal variances
    const pValue = this.welchTTest(treatment, control);

    // Need at least 5 samples per group for meaningful significance
    const significantDifference =
      pValue < 0.05 && treatment.length >= 5 && control.length >= 5;

    // Cohen's d effect size
    const effectSize = this.cohensD(
      treatmentStats.mean,
      treatmentStats.stdDev,
      treatment.length,
      controlStats.mean,
      controlStats.stdDev,
      control.length
    );

    return {
      treatment: {
        mean: treatmentStats.mean,
        stdDev: treatmentStats.stdDev,
        count: treatment.length,
        values: treatment,
      },
      control: {
        mean: controlStats.mean,
        stdDev: controlStats.stdDev,
        count: control.length,
        values: control,
      },
      pValue,
      significantDifference,
      effectSize,
    };
  }

  /**
   * Calculate mean and standard deviation
   */
  private calcDescriptiveStats(values: number[]): {
    mean: number;
    stdDev: number;
  } {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0 };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    if (values.length === 1) {
      return { mean, stdDev: 0 };
    }

    // Sample standard deviation (n-1)
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  /**
   * Welch's t-test for two samples with potentially unequal variances
   */
  private welchTTest(a: number[], b: number[]): number {
    if (a.length < 2 || b.length < 2) {
      return 1; // Not enough data
    }

    const meanA = a.reduce((x, y) => x + y, 0) / a.length;
    const meanB = b.reduce((x, y) => x + y, 0) / b.length;

    const varA =
      a.reduce((sum, v) => sum + (v - meanA) ** 2, 0) / (a.length - 1);
    const varB =
      b.reduce((sum, v) => sum + (v - meanB) ** 2, 0) / (b.length - 1);

    const se = Math.sqrt(varA / a.length + varB / b.length);
    if (se === 0) return 1;

    const t = Math.abs(meanA - meanB) / se;

    // Welch-Satterthwaite degrees of freedom
    const dfNum = (varA / a.length + varB / b.length) ** 2;
    const dfDenom =
      (varA / a.length) ** 2 / (a.length - 1) +
      (varB / b.length) ** 2 / (b.length - 1);
    const df = dfNum / dfDenom;

    // Two-tailed p-value using t-distribution approximation
    return 2 * this.tDistributionCDF(-t, df);
  }

  /**
   * Calculate Cohen's d effect size using pooled standard deviation
   */
  private cohensD(
    meanA: number,
    stdA: number,
    nA: number,
    meanB: number,
    stdB: number,
    nB: number
  ): number {
    if (nA <= 1 || nB <= 1) {
      return 0;
    }

    // Pooled standard deviation
    const pooledStd = Math.sqrt(
      ((stdA ** 2) * (nA - 1) + (stdB ** 2) * (nB - 1)) / (nA + nB - 2)
    );

    if (pooledStd === 0) {
      return 0;
    }

    return (meanA - meanB) / pooledStd;
  }

  /**
   * Approximate CDF of t-distribution using normal approximation for large df
   * and a more accurate approximation for small df
   */
  private tDistributionCDF(t: number, df: number): number {
    if (df <= 0) return 0.5;

    // For large degrees of freedom, use normal approximation
    if (df > 100) {
      return this.normalCDF(t);
    }

    // Approximation using incomplete beta function relationship
    // P(T < t) = 1 - 0.5 * I(df/(df+t^2), df/2, 1/2)
    // We use a simpler approximation for moderate df
    const x = df / (df + t * t);
    const beta = this.incompleteBeta(x, df / 2, 0.5);
    return t > 0 ? 1 - 0.5 * beta : 0.5 * beta;
  }

  /**
   * Approximate incomplete beta function using continued fraction
   */
  private incompleteBeta(x: number, a: number, b: number): number {
    if (x === 0) return 0;
    if (x === 1) return 1;

    // Use regularized incomplete beta approximation
    // This is a simplified version suitable for t-test p-value calculation
    const bt =
      Math.exp(
        this.lnGamma(a + b) -
          this.lnGamma(a) -
          this.lnGamma(b) +
          a * Math.log(x) +
          b * Math.log(1 - x)
      );

    if (x < (a + 1) / (a + b + 2)) {
      return (bt * this.betaCF(x, a, b)) / a;
    } else {
      return 1 - (bt * this.betaCF(1 - x, b, a)) / b;
    }
  }

  /**
   * Continued fraction for incomplete beta
   */
  private betaCF(x: number, a: number, b: number): number {
    const maxIterations = 100;
    const epsilon = 1e-10;

    let c = 1;
    let d = 1 - ((a + b) * x) / (a + 1);
    if (Math.abs(d) < epsilon) d = epsilon;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIterations; m++) {
      const m2 = 2 * m;

      // Even step
      let num = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
      d = 1 + num * d;
      if (Math.abs(d) < epsilon) d = epsilon;
      c = 1 + num / c;
      if (Math.abs(c) < epsilon) c = epsilon;
      d = 1 / d;
      h *= d * c;

      // Odd step
      num = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
      d = 1 + num * d;
      if (Math.abs(d) < epsilon) d = epsilon;
      c = 1 + num / c;
      if (Math.abs(c) < epsilon) c = epsilon;
      d = 1 / d;
      const delta = d * c;
      h *= delta;

      if (Math.abs(delta - 1) < epsilon) break;
    }

    return h;
  }

  /**
   * Log gamma function approximation (Lanczos)
   */
  private lnGamma(z: number): number {
    const g = 7;
    const c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];

    if (z < 0.5) {
      return (
        Math.log(Math.PI / Math.sin(Math.PI * z)) - this.lnGamma(1 - z)
      );
    }

    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
      x += c[i] / (z + i);
    }

    const t = z + g + 0.5;
    return (
      0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
    );
  }

  /**
   * Standard normal CDF approximation
   */
  private normalCDF(x: number): number {
    // Approximation of standard normal CDF using error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new A/B test framework instance
 */
export function createABTestFramework(): ABTestFramework {
  return new ABTestFramework();
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format test results for human-readable display
 * @param result - Test results to format
 */
export function formatABTestResult(result: ABTestResult): string {
  const lines: string[] = [
    `=== A/B Test Results: ${result.testName} ===`,
    '',
    `Test ID: ${result.testId}`,
    `Status: ${result.status}`,
    `Sessions: ${result.treatmentSessions} treatment, ${result.controlSessions} control`,
    '',
    '--- Metrics ---',
  ];

  for (const [name, stats] of Object.entries(result.metrics)) {
    lines.push(`${name}:`);
    lines.push(
      `  Treatment: mean=${stats.treatment.mean.toFixed(3)}, stdDev=${stats.treatment.stdDev.toFixed(3)}, n=${stats.treatment.count}`
    );
    lines.push(
      `  Control: mean=${stats.control.mean.toFixed(3)}, stdDev=${stats.control.stdDev.toFixed(3)}, n=${stats.control.count}`
    );
    lines.push(
      `  p-value: ${stats.pValue.toFixed(4)}${stats.significantDifference ? ' *' : ''}`
    );
    lines.push(`  Effect size (Cohen's d): ${stats.effectSize.toFixed(3)}`);
    lines.push(
      `  Interpretation: ${interpretEffectSize(stats.effectSize)}${stats.significantDifference ? ' (statistically significant)' : ''}`
    );
    lines.push('');
  }

  lines.push('--- Conclusion ---');
  lines.push(`Winner: ${result.winner}`);
  lines.push(`Recommendation: ${result.recommendation}`);
  lines.push('');
  lines.push(`Analysis timestamp: ${result.analysisTimestamp}`);

  return lines.join('\n');
}

/**
 * Interpret Cohen's d effect size
 */
function interpretEffectSize(d: number): string {
  const absD = Math.abs(d);
  if (absD < 0.2) return 'negligible effect';
  if (absD < 0.5) return 'small effect';
  if (absD < 0.8) return 'medium effect';
  return 'large effect';
}

/**
 * Format a summary of all registered tests
 * @param framework - The A/B test framework
 */
export function formatTestSummary(framework: ABTestFramework): string {
  const tests = framework.listTests();

  if (tests.length === 0) {
    return 'No A/B tests registered.';
  }

  const lines: string[] = ['=== A/B Test Summary ===', ''];

  for (const test of tests) {
    const counts = framework.getSessionCounts(test.testId);
    const totalSessions = counts.treatment + counts.control;
    const targetSessions = test.minSampleSize * 2;
    const progress = Math.min(100, (totalSessions / targetSessions) * 100);

    lines.push(`${test.name} (${test.testId})`);
    lines.push(`  ${test.description}`);
    lines.push(
      `  Sessions: ${counts.treatment}T / ${counts.control}C (${progress.toFixed(0)}% of target)`
    );
    lines.push(`  Metrics: ${test.successMetrics.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}
