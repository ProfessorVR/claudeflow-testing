/**
 * Feedback Loop A/B Test - PHASE-5-002
 *
 * A/B test configuration to compare pipeline with feedback loop enabled vs disabled.
 * This test validates that the feedback system actually improves output quality.
 *
 * Treatment: Feedback loop enabled (current behavior)
 * Control: Feedback loop disabled (baseline)
 *
 * Success Metrics:
 * - user_satisfaction: Average user satisfaction rating (1-5)
 * - sounds_like_me: Average "sounds like me" rating (1-5)
 * - revision_count: Number of revision iterations needed
 * - quality_score: Average Quality Gauntlet score (0-1)
 * - would_use_as_is: Percentage of chapters users would use as-is
 * - chapter_duration_ms: Time to generate chapter
 */

import {
  ABTestConfig,
  ABTestFramework,
  ABTestResult,
  formatABTestResult,
} from '../ab-test-framework.js';

// ============================================================================
// Constants
// ============================================================================

/** Unique identifier for the feedback loop test */
export const FEEDBACK_LOOP_TEST_ID = 'feedback-loop-effectiveness';

/** Human-readable name for the feedback loop test */
export const FEEDBACK_LOOP_TEST_NAME = 'Feedback Loop Effectiveness';

// ============================================================================
// Test Configuration
// ============================================================================

/**
 * Configuration for the feedback loop A/B test
 *
 * This test compares:
 * - Treatment: Full feedback loop enabled (contrastive learning, cross-session, drift detection)
 * - Control: Feedback loop disabled (baseline behavior)
 */
export const feedbackLoopTestConfig: ABTestConfig = {
  testId: FEEDBACK_LOOP_TEST_ID,
  name: FEEDBACK_LOOP_TEST_NAME,
  description:
    'Compares pipeline with feedback loop enabled vs disabled to validate that feedback learning improves output quality.',

  // Treatment: Feedback loop enabled with all features
  treatmentConfig: {
    feedbackLoopEnabled: true,
    contrastiveLearningEnabled: true,
    crossSessionLearningEnabled: true,
    styleDriftDetectionEnabled: true,
  },

  // Control: Feedback loop disabled (baseline)
  controlConfig: {
    feedbackLoopEnabled: false,
    contrastiveLearningEnabled: false,
    crossSessionLearningEnabled: false,
    styleDriftDetectionEnabled: false,
  },

  // 50/50 split for balanced comparison
  treatmentRatio: 0.5,

  // Metrics to track for this test
  successMetrics: [
    'user_satisfaction', // 1-5 quality satisfaction rating
    'sounds_like_me', // 1-5 "sounds like me" rating
    'revision_count', // Number of revisions needed
    'quality_score', // 0-1 Quality Gauntlet score
    'would_use_as_is', // 0 or 1 (boolean as number)
    'chapter_duration_ms', // Time to generate chapter
  ],

  // Minimum 20 sessions per condition (40 total) for statistical power
  minSampleSize: 20,

  // Test dates (optional - can be set when starting the test)
  startDate: undefined,
  endDate: undefined,
};

// ============================================================================
// Feedback Loop Test Manager
// ============================================================================

/**
 * Feedback Loop Test Manager
 *
 * Provides convenience methods for managing the feedback loop A/B test.
 * Wraps the ABTestFramework with type-safe methods specific to this test.
 */
export class FeedbackLoopTestManager {
  private readonly framework: ABTestFramework;
  private testRegistered: boolean = false;

  /**
   * Create a new FeedbackLoopTestManager
   * @param framework - The ABTestFramework instance to use
   */
  constructor(framework: ABTestFramework) {
    this.framework = framework;
  }

  /**
   * Get the underlying ABTestFramework instance
   */
  getFramework(): ABTestFramework {
    return this.framework;
  }

  /**
   * Check if the test has been registered
   */
  isRegistered(): boolean {
    return this.testRegistered;
  }

  /**
   * Register the feedback loop test with the framework
   *
   * This method is idempotent - calling it multiple times has no effect.
   */
  registerTest(): void {
    if (this.testRegistered) {
      return;
    }

    this.framework.registerTest({
      ...feedbackLoopTestConfig,
      startDate: new Date().toISOString(),
    });
    this.testRegistered = true;
  }

  /**
   * Get whether feedback should be enabled for a session
   *
   * @param sessionId - The session identifier
   * @returns true if the session is assigned to treatment (feedback enabled)
   */
  shouldEnableFeedback(sessionId: string): boolean {
    this.ensureRegistered();
    const assignment = this.framework.getAssignment(
      sessionId,
      FEEDBACK_LOOP_TEST_ID
    );
    return assignment === 'treatment';
  }

  /**
   * Get the full config for a session
   *
   * @param sessionId - The session identifier
   * @returns The configuration object for this session's assignment
   */
  getSessionConfig(sessionId: string): Record<string, unknown> {
    this.ensureRegistered();
    return this.framework.getConfigForSession(sessionId, FEEDBACK_LOOP_TEST_ID);
  }

  /**
   * Get the assignment for a session
   *
   * @param sessionId - The session identifier
   * @returns 'treatment' or 'control'
   */
  getAssignment(sessionId: string): 'treatment' | 'control' {
    this.ensureRegistered();
    return this.framework.getAssignment(sessionId, FEEDBACK_LOOP_TEST_ID);
  }

  // ==========================================================================
  // Metric Recording Methods
  // ==========================================================================

  /**
   * Record user satisfaction rating from session
   *
   * @param sessionId - The session identifier
   * @param rating - Quality satisfaction rating (1-5)
   */
  recordUserSatisfaction(sessionId: string, rating: 1 | 2 | 3 | 4 | 5): void {
    this.ensureRegistered();
    this.framework.recordMetric(
      sessionId,
      FEEDBACK_LOOP_TEST_ID,
      'user_satisfaction',
      rating
    );
  }

  /**
   * Record "sounds like me" rating from session
   *
   * @param sessionId - The session identifier
   * @param rating - "Sounds like me" rating (1-5)
   */
  recordSoundsLikeMe(sessionId: string, rating: 1 | 2 | 3 | 4 | 5): void {
    this.ensureRegistered();
    this.framework.recordMetric(
      sessionId,
      FEEDBACK_LOOP_TEST_ID,
      'sounds_like_me',
      rating
    );
  }

  /**
   * Record revision count for a chapter
   *
   * @param sessionId - The session identifier
   * @param count - Number of revisions needed (0+)
   */
  recordRevisionCount(sessionId: string, count: number): void {
    this.ensureRegistered();
    if (count < 0) {
      throw new Error('Revision count must be non-negative');
    }
    this.framework.recordMetric(
      sessionId,
      FEEDBACK_LOOP_TEST_ID,
      'revision_count',
      count
    );
  }

  /**
   * Record quality score from Quality Gauntlet
   *
   * @param sessionId - The session identifier
   * @param score - Quality score (0-1)
   */
  recordQualityScore(sessionId: string, score: number): void {
    this.ensureRegistered();
    if (score < 0 || score > 1) {
      throw new Error('Quality score must be between 0 and 1');
    }
    this.framework.recordMetric(
      sessionId,
      FEEDBACK_LOOP_TEST_ID,
      'quality_score',
      score
    );
  }

  /**
   * Record whether user would use chapter as-is
   *
   * @param sessionId - The session identifier
   * @param wouldUse - Whether user would use the chapter as-is
   */
  recordWouldUseAsIs(sessionId: string, wouldUse: boolean): void {
    this.ensureRegistered();
    this.framework.recordMetric(
      sessionId,
      FEEDBACK_LOOP_TEST_ID,
      'would_use_as_is',
      wouldUse ? 1 : 0
    );
  }

  /**
   * Record chapter generation duration
   *
   * @param sessionId - The session identifier
   * @param durationMs - Duration in milliseconds
   */
  recordChapterDuration(sessionId: string, durationMs: number): void {
    this.ensureRegistered();
    if (durationMs < 0) {
      throw new Error('Duration must be non-negative');
    }
    this.framework.recordMetric(
      sessionId,
      FEEDBACK_LOOP_TEST_ID,
      'chapter_duration_ms',
      durationMs
    );
  }

  /**
   * Record all satisfaction metrics from a user rating
   *
   * Convenience method to record multiple related metrics at once.
   *
   * @param sessionId - The session identifier
   * @param rating - Object containing all satisfaction ratings
   */
  recordSatisfactionRating(
    sessionId: string,
    rating: {
      soundsLikeMeScore: 1 | 2 | 3 | 4 | 5;
      qualitySatisfactionScore: 1 | 2 | 3 | 4 | 5;
      wouldUseAsIs: boolean;
    }
  ): void {
    this.recordSoundsLikeMe(sessionId, rating.soundsLikeMeScore);
    this.recordUserSatisfaction(sessionId, rating.qualitySatisfactionScore);
    this.recordWouldUseAsIs(sessionId, rating.wouldUseAsIs);
  }

  /**
   * Record complete chapter metrics
   *
   * Convenience method to record all metrics for a chapter generation.
   *
   * @param sessionId - The session identifier
   * @param metrics - Object containing all chapter metrics
   */
  recordChapterMetrics(
    sessionId: string,
    metrics: {
      qualityScore: number;
      revisionCount: number;
      durationMs: number;
      userRating?: {
        soundsLikeMeScore: 1 | 2 | 3 | 4 | 5;
        qualitySatisfactionScore: 1 | 2 | 3 | 4 | 5;
        wouldUseAsIs: boolean;
      };
    }
  ): void {
    this.recordQualityScore(sessionId, metrics.qualityScore);
    this.recordRevisionCount(sessionId, metrics.revisionCount);
    this.recordChapterDuration(sessionId, metrics.durationMs);

    if (metrics.userRating) {
      this.recordSatisfactionRating(sessionId, metrics.userRating);
    }
  }

  // ==========================================================================
  // Results and Analysis
  // ==========================================================================

  /**
   * Get current test results
   *
   * @returns The ABTestResult for this test
   */
  getResults(): ABTestResult {
    this.ensureRegistered();
    return this.framework.getResults(FEEDBACK_LOOP_TEST_ID);
  }

  /**
   * Get formatted results for display
   *
   * @returns Human-readable formatted results
   */
  getFormattedResults(): string {
    const results = this.getResults();
    return formatABTestResult(results);
  }

  /**
   * Get session counts
   *
   * @returns Object with treatment and control session counts
   */
  getSessionCounts(): { treatment: number; control: number } {
    this.ensureRegistered();
    return this.framework.getSessionCounts(FEEDBACK_LOOP_TEST_ID);
  }

  /**
   * Check if test has reached minimum sample size
   *
   * @returns true if both groups have reached the minimum sample size
   */
  hasReachedMinSampleSize(): boolean {
    const counts = this.getSessionCounts();
    return (
      counts.treatment >= feedbackLoopTestConfig.minSampleSize &&
      counts.control >= feedbackLoopTestConfig.minSampleSize
    );
  }

  /**
   * Get progress toward minimum sample size
   *
   * @returns Progress information including percentages and sessions needed
   */
  getProgress(): {
    treatmentProgress: number;
    controlProgress: number;
    overallProgress: number;
    sessionsNeeded: number;
  } {
    const counts = this.getSessionCounts();
    const minSize = feedbackLoopTestConfig.minSampleSize;

    const treatmentProgress = Math.min(1, counts.treatment / minSize);
    const controlProgress = Math.min(1, counts.control / minSize);
    const overallProgress = (treatmentProgress + controlProgress) / 2;

    const treatmentNeeded = Math.max(0, minSize - counts.treatment);
    const controlNeeded = Math.max(0, minSize - counts.control);

    return {
      treatmentProgress,
      controlProgress,
      overallProgress,
      sessionsNeeded: treatmentNeeded + controlNeeded,
    };
  }

  /**
   * Get a human-readable progress summary
   *
   * @returns Formatted progress string
   */
  getProgressSummary(): string {
    const progress = this.getProgress();
    const counts = this.getSessionCounts();
    const minSize = feedbackLoopTestConfig.minSampleSize;

    const lines: string[] = [
      `=== Feedback Loop A/B Test Progress ===`,
      '',
      `Treatment Group: ${counts.treatment}/${minSize} sessions (${(progress.treatmentProgress * 100).toFixed(0)}%)`,
      `Control Group: ${counts.control}/${minSize} sessions (${(progress.controlProgress * 100).toFixed(0)}%)`,
      `Overall Progress: ${(progress.overallProgress * 100).toFixed(0)}%`,
      '',
    ];

    if (this.hasReachedMinSampleSize()) {
      lines.push(
        'Status: Minimum sample size reached. Results are statistically valid.'
      );
    } else {
      lines.push(`Status: Need ${progress.sessionsNeeded} more sessions.`);
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Ensure the test is registered before use
   */
  private ensureRegistered(): void {
    if (!this.testRegistered) {
      this.registerTest();
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a FeedbackLoopTestManager with a new or existing framework
 *
 * @param framework - Optional ABTestFramework instance to use
 * @returns A new FeedbackLoopTestManager instance
 */
export function createFeedbackLoopTestManager(
  framework?: ABTestFramework
): FeedbackLoopTestManager {
  const fw = framework ?? new ABTestFramework();
  return new FeedbackLoopTestManager(fw);
}

// ============================================================================
// Expected Outcomes
// ============================================================================

/**
 * Expected outcome analysis based on implementation plan hypothesis
 */
export interface ExpectedOutcome {
  /** Metric name */
  metric: string;

  /** Hypothesis being tested */
  hypothesis: string;

  /** Expected direction of the difference */
  expectedDirection: 'treatment_higher' | 'treatment_lower' | 'no_difference';

  /** Minimum effect size (Cohen's d) to consider meaningful */
  minEffectSize: number;
}

/**
 * Expected outcomes for each metric based on the implementation plan hypothesis
 */
export const expectedOutcomes: ExpectedOutcome[] = [
  {
    metric: 'user_satisfaction',
    hypothesis:
      'Feedback loop should improve user satisfaction by learning from corrections',
    expectedDirection: 'treatment_higher',
    minEffectSize: 0.3, // Small to medium effect
  },
  {
    metric: 'sounds_like_me',
    hypothesis: 'Style learning should improve voice matching over time',
    expectedDirection: 'treatment_higher',
    minEffectSize: 0.4, // Medium effect expected
  },
  {
    metric: 'revision_count',
    hypothesis: 'Better first outputs should require fewer revisions',
    expectedDirection: 'treatment_lower',
    minEffectSize: 0.3,
  },
  {
    metric: 'quality_score',
    hypothesis: 'Learned patterns should improve objective quality metrics',
    expectedDirection: 'treatment_higher',
    minEffectSize: 0.2, // Small effect acceptable
  },
  {
    metric: 'would_use_as_is',
    hypothesis: 'Better outputs should lead to higher as-is acceptance',
    expectedDirection: 'treatment_higher',
    minEffectSize: 0.3,
  },
  {
    metric: 'chapter_duration_ms',
    hypothesis:
      'Learning overhead may increase duration slightly - acceptable tradeoff',
    expectedDirection: 'no_difference', // Or slight increase is acceptable
    minEffectSize: 0,
  },
];

// ============================================================================
// Expectation Analysis
// ============================================================================

/**
 * Result of analyzing a metric against its expected outcome
 */
export interface ExpectationAnalysisResult {
  /** Metric name */
  metric: string;

  /** The expected outcome definition */
  expected: ExpectedOutcome;

  /** The actual observed result */
  actual: {
    direction: 'treatment_higher' | 'treatment_lower' | 'no_difference';
    effectSize: number;
    significant: boolean;
  };

  /** Whether the actual result meets the expectation */
  meetsExpectation: boolean;
}

/**
 * Analyze results against expected outcomes
 *
 * Compares the actual A/B test results against the hypothesized outcomes
 * to determine if the feedback loop is performing as expected.
 *
 * @param results - The ABTestResult to analyze
 * @returns Array of analysis results for each metric
 */
export function analyzeAgainstExpectations(
  results: ABTestResult
): ExpectationAnalysisResult[] {
  const analysis: ExpectationAnalysisResult[] = [];

  for (const expected of expectedOutcomes) {
    const metricStats = results.metrics[expected.metric];

    if (!metricStats) {
      continue;
    }

    // Determine actual direction
    let actualDirection: 'treatment_higher' | 'treatment_lower' | 'no_difference';
    if (!metricStats.significantDifference) {
      actualDirection = 'no_difference';
    } else if (metricStats.treatment.mean > metricStats.control.mean) {
      actualDirection = 'treatment_higher';
    } else {
      actualDirection = 'treatment_lower';
    }

    // Determine if expectation is met
    // For metrics where we expect no difference, accept any outcome
    // For directional expectations, check direction and effect size
    let meetsExpectation: boolean;
    if (expected.expectedDirection === 'no_difference') {
      // For no_difference expectation, we're okay with any outcome
      meetsExpectation = true;
    } else {
      meetsExpectation =
        expected.expectedDirection === actualDirection &&
        Math.abs(metricStats.effectSize) >= expected.minEffectSize;
    }

    analysis.push({
      metric: expected.metric,
      expected,
      actual: {
        direction: actualDirection,
        effectSize: metricStats.effectSize,
        significant: metricStats.significantDifference,
      },
      meetsExpectation,
    });
  }

  return analysis;
}

/**
 * Format expectation analysis for display
 *
 * Creates a human-readable report comparing actual results to expectations.
 *
 * @param results - The ABTestResult to format
 * @returns Formatted analysis string
 */
export function formatExpectationAnalysis(results: ABTestResult): string {
  const analysis = analyzeAgainstExpectations(results);
  const lines: string[] = [
    '=== Feedback Loop A/B Test: Expectation Analysis ===',
    '',
  ];

  for (const item of analysis) {
    const status = item.meetsExpectation ? '[PASS]' : '[FAIL]';
    lines.push(`${status} ${item.metric}:`);
    lines.push(
      `    Expected: ${item.expected.expectedDirection} (d >= ${item.expected.minEffectSize})`
    );
    lines.push(
      `    Actual: ${item.actual.direction} (d = ${item.actual.effectSize.toFixed(3)}, significant = ${item.actual.significant})`
    );
    lines.push(`    Hypothesis: ${item.expected.hypothesis}`);
    lines.push('');
  }

  const metCount = analysis.filter((a) => a.meetsExpectation).length;
  const totalCount = analysis.length;
  const passRate = totalCount > 0 ? metCount / totalCount : 0;

  lines.push(`--- Summary ---`);
  lines.push(`${metCount}/${totalCount} metrics meet expectations`);
  lines.push('');

  if (passRate >= 0.8) {
    lines.push(
      'Recommendation: Feedback loop is highly effective. Consider full deployment.'
    );
  } else if (passRate >= 0.5) {
    lines.push(
      'Recommendation: Feedback loop shows promise. Investigate underperforming metrics.'
    );
  } else {
    lines.push(
      'Recommendation: Feedback loop needs improvement. Review implementation.'
    );
  }

  return lines.join('\n');
}

/**
 * Get a summary of how many expectations are met
 *
 * @param results - The ABTestResult to analyze
 * @returns Summary object with counts and pass rate
 */
export function getExpectationSummary(results: ABTestResult): {
  passed: number;
  failed: number;
  total: number;
  passRate: number;
  recommendation: 'deploy' | 'investigate' | 'improve';
} {
  const analysis = analyzeAgainstExpectations(results);
  const passed = analysis.filter((a) => a.meetsExpectation).length;
  const failed = analysis.filter((a) => !a.meetsExpectation).length;
  const total = analysis.length;
  const passRate = total > 0 ? passed / total : 0;

  let recommendation: 'deploy' | 'investigate' | 'improve';
  if (passRate >= 0.8) {
    recommendation = 'deploy';
  } else if (passRate >= 0.5) {
    recommendation = 'investigate';
  } else {
    recommendation = 'improve';
  }

  return {
    passed,
    failed,
    total,
    passRate,
    recommendation,
  };
}
