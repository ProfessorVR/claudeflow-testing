/**
 * Testing Module - A/B Testing Infrastructure
 *
 * PHASE-5: A/B Testing Infrastructure for Empirical Validation
 *
 * This module provides infrastructure for running controlled experiments
 * on pipeline configurations to validate changes empirically.
 *
 * Components:
 * - ABTestFramework: Core framework for managing A/B tests
 * - Deterministic session assignment via SHA-256 hashing
 * - Metric recording and statistical analysis (Welch's t-test, Cohen's d)
 * - Result formatting for human-readable output
 *
 * Usage:
 * ```typescript
 * import {
 *   createABTestFramework,
 *   formatABTestResult,
 *   type ABTestConfig,
 * } from './testing/index.js';
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
 * // Get assignment and config for a session
 * const assignment = framework.getAssignment(sessionId, 'style-injection-v2');
 * const config = framework.getConfigForSession(sessionId, 'style-injection-v2');
 *
 * // Record metrics after execution
 * framework.recordMetric(sessionId, 'style-injection-v2', 'quality_score', 0.85);
 *
 * // Analyze results
 * const results = framework.getResults('style-injection-v2');
 * console.log(formatABTestResult(results));
 * ```
 */

// A/B Test Framework (PHASE-5-001)
export {
  ABTestFramework,
  createABTestFramework,
  formatABTestResult,
  formatTestSummary,
  type ABTestConfig,
  type ABTestResult,
  type ABTestMetricStats,
  type ABTestMetricValue,
  type ABTestEvent,
} from './ab-test-framework.js';

// Feedback Loop A/B Test (PHASE-5-002)
export {
  FEEDBACK_LOOP_TEST_ID,
  FEEDBACK_LOOP_TEST_NAME,
  feedbackLoopTestConfig,
  FeedbackLoopTestManager,
  createFeedbackLoopTestManager,
  expectedOutcomes,
  analyzeAgainstExpectations,
  formatExpectationAnalysis,
  getExpectationSummary,
  type ExpectedOutcome,
  type ExpectationAnalysisResult,
} from './tests/feedback-loop-test.js';
