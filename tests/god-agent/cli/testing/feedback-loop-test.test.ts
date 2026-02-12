/**
 * Tests for Feedback Loop A/B Test - PHASE-5-002
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from '../../../../src/god-agent/cli/testing/tests/feedback-loop-test.js';
import {
  ABTestFramework,
  createABTestFramework,
  type ABTestResult,
} from '../../../../src/god-agent/cli/testing/ab-test-framework.js';

describe('PHASE-5-002: Feedback Loop A/B Test', () => {
  let framework: ABTestFramework;
  let manager: FeedbackLoopTestManager;

  beforeEach(() => {
    framework = createABTestFramework();
    manager = new FeedbackLoopTestManager(framework);
  });

  // ==========================================================================
  // Constants and Configuration
  // ==========================================================================

  describe('Test Configuration', () => {
    it('should have correct test ID', () => {
      expect(FEEDBACK_LOOP_TEST_ID).toBe('feedback-loop-effectiveness');
    });

    it('should have correct test name', () => {
      expect(FEEDBACK_LOOP_TEST_NAME).toBe('Feedback Loop Effectiveness');
    });

    it('should have valid treatment config', () => {
      expect(feedbackLoopTestConfig.treatmentConfig).toEqual({
        feedbackLoopEnabled: true,
        contrastiveLearningEnabled: true,
        crossSessionLearningEnabled: true,
        styleDriftDetectionEnabled: true,
      });
    });

    it('should have valid control config', () => {
      expect(feedbackLoopTestConfig.controlConfig).toEqual({
        feedbackLoopEnabled: false,
        contrastiveLearningEnabled: false,
        crossSessionLearningEnabled: false,
        styleDriftDetectionEnabled: false,
      });
    });

    it('should have 50/50 treatment ratio', () => {
      expect(feedbackLoopTestConfig.treatmentRatio).toBe(0.5);
    });

    it('should have all required success metrics', () => {
      expect(feedbackLoopTestConfig.successMetrics).toContain('user_satisfaction');
      expect(feedbackLoopTestConfig.successMetrics).toContain('sounds_like_me');
      expect(feedbackLoopTestConfig.successMetrics).toContain('revision_count');
      expect(feedbackLoopTestConfig.successMetrics).toContain('quality_score');
      expect(feedbackLoopTestConfig.successMetrics).toContain('would_use_as_is');
      expect(feedbackLoopTestConfig.successMetrics).toContain('chapter_duration_ms');
    });

    it('should have minimum sample size of 20', () => {
      expect(feedbackLoopTestConfig.minSampleSize).toBe(20);
    });

    it('should have meaningful description', () => {
      expect(feedbackLoopTestConfig.description).toContain('feedback loop');
      expect(feedbackLoopTestConfig.description.length).toBeGreaterThan(20);
    });
  });

  // ==========================================================================
  // Manager Registration
  // ==========================================================================

  describe('Manager Registration', () => {
    it('should not be registered initially', () => {
      expect(manager.isRegistered()).toBe(false);
    });

    it('should register test with framework', () => {
      manager.registerTest();

      expect(manager.isRegistered()).toBe(true);
      expect(framework.hasTest(FEEDBACK_LOOP_TEST_ID)).toBe(true);
    });

    it('should be idempotent - multiple registrations have no effect', () => {
      manager.registerTest();
      manager.registerTest();
      manager.registerTest();

      expect(manager.isRegistered()).toBe(true);
      expect(framework.listTests().length).toBe(1);
    });

    it('should auto-register when getting assignment', () => {
      expect(manager.isRegistered()).toBe(false);

      manager.shouldEnableFeedback('session-1');

      expect(manager.isRegistered()).toBe(true);
    });

    it('should set start date on registration', () => {
      manager.registerTest();

      const test = framework.getTest(FEEDBACK_LOOP_TEST_ID);
      expect(test?.startDate).toBeDefined();
      expect(new Date(test!.startDate!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should expose underlying framework', () => {
      expect(manager.getFramework()).toBe(framework);
    });
  });

  // ==========================================================================
  // Assignment
  // ==========================================================================

  describe('Assignment', () => {
    it('should return consistent assignment for same session', () => {
      const assignment1 = manager.shouldEnableFeedback('session-abc');
      const assignment2 = manager.shouldEnableFeedback('session-abc');

      expect(assignment1).toBe(assignment2);
    });

    it('should return boolean for shouldEnableFeedback', () => {
      const result = manager.shouldEnableFeedback('session-1');

      expect(typeof result).toBe('boolean');
    });

    it('should return treatment or control for getAssignment', () => {
      const assignment = manager.getAssignment('session-1');

      expect(['treatment', 'control']).toContain(assignment);
    });

    it('should correlate shouldEnableFeedback with assignment', () => {
      const sessionId = 'correlation-test';
      const shouldEnable = manager.shouldEnableFeedback(sessionId);
      const assignment = manager.getAssignment(sessionId);

      expect(shouldEnable).toBe(assignment === 'treatment');
    });

    it('should return correct config for treatment', () => {
      // Find a treatment session
      let sessionId = '';
      for (let i = 0; i < 100; i++) {
        const testId = `treatment-find-${i}`;
        if (manager.shouldEnableFeedback(testId)) {
          sessionId = testId;
          break;
        }
      }

      const config = manager.getSessionConfig(sessionId);

      expect(config.feedbackLoopEnabled).toBe(true);
      expect(config.contrastiveLearningEnabled).toBe(true);
    });

    it('should return correct config for control', () => {
      // Find a control session
      let sessionId = '';
      for (let i = 0; i < 100; i++) {
        const testId = `control-find-${i}`;
        if (!manager.shouldEnableFeedback(testId)) {
          sessionId = testId;
          break;
        }
      }

      const config = manager.getSessionConfig(sessionId);

      expect(config.feedbackLoopEnabled).toBe(false);
      expect(config.contrastiveLearningEnabled).toBe(false);
    });

    it('should distribute sessions roughly 50/50', () => {
      let treatmentCount = 0;
      const totalSessions = 200;

      for (let i = 0; i < totalSessions; i++) {
        if (manager.shouldEnableFeedback(`distribution-${i}`)) {
          treatmentCount++;
        }
      }

      const ratio = treatmentCount / totalSessions;
      // Allow 15% tolerance around 50%
      expect(ratio).toBeGreaterThan(0.35);
      expect(ratio).toBeLessThan(0.65);
    });
  });

  // ==========================================================================
  // Metric Recording
  // ==========================================================================

  describe('Metric Recording', () => {
    describe('User Satisfaction', () => {
      it('should record valid ratings', () => {
        manager.recordUserSatisfaction('session-1', 5);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        const values = metrics?.get('user_satisfaction');

        expect(values).toHaveLength(1);
        expect(values?.[0].value).toBe(5);
      });

      it('should accept all valid ratings 1-5', () => {
        const ratings: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

        ratings.forEach((rating, index) => {
          manager.recordUserSatisfaction(`session-${index}`, rating);
        });

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('user_satisfaction')?.length).toBe(5);
      });
    });

    describe('Sounds Like Me', () => {
      it('should record valid ratings', () => {
        manager.recordSoundsLikeMe('session-1', 4);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        const values = metrics?.get('sounds_like_me');

        expect(values).toHaveLength(1);
        expect(values?.[0].value).toBe(4);
      });
    });

    describe('Revision Count', () => {
      it('should record valid counts', () => {
        manager.recordRevisionCount('session-1', 3);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        const values = metrics?.get('revision_count');

        expect(values).toHaveLength(1);
        expect(values?.[0].value).toBe(3);
      });

      it('should accept zero revisions', () => {
        manager.recordRevisionCount('session-1', 0);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('revision_count')?.[0].value).toBe(0);
      });

      it('should reject negative counts', () => {
        expect(() => manager.recordRevisionCount('session-1', -1)).toThrow(
          'Revision count must be non-negative'
        );
      });
    });

    describe('Quality Score', () => {
      it('should record valid scores', () => {
        manager.recordQualityScore('session-1', 0.85);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        const values = metrics?.get('quality_score');

        expect(values).toHaveLength(1);
        expect(values?.[0].value).toBe(0.85);
      });

      it('should accept boundary values', () => {
        manager.recordQualityScore('session-1', 0);
        manager.recordQualityScore('session-2', 1);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('quality_score')?.length).toBe(2);
      });

      it('should reject scores below 0', () => {
        expect(() => manager.recordQualityScore('session-1', -0.1)).toThrow(
          'Quality score must be between 0 and 1'
        );
      });

      it('should reject scores above 1', () => {
        expect(() => manager.recordQualityScore('session-1', 1.1)).toThrow(
          'Quality score must be between 0 and 1'
        );
      });
    });

    describe('Would Use As Is', () => {
      it('should record true as 1', () => {
        manager.recordWouldUseAsIs('session-1', true);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('would_use_as_is')?.[0].value).toBe(1);
      });

      it('should record false as 0', () => {
        manager.recordWouldUseAsIs('session-1', false);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('would_use_as_is')?.[0].value).toBe(0);
      });
    });

    describe('Chapter Duration', () => {
      it('should record valid durations', () => {
        manager.recordChapterDuration('session-1', 5000);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('chapter_duration_ms')?.[0].value).toBe(5000);
      });

      it('should accept zero duration', () => {
        manager.recordChapterDuration('session-1', 0);

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('chapter_duration_ms')?.[0].value).toBe(0);
      });

      it('should reject negative durations', () => {
        expect(() => manager.recordChapterDuration('session-1', -100)).toThrow(
          'Duration must be non-negative'
        );
      });
    });

    describe('Satisfaction Rating (Batch)', () => {
      it('should record all satisfaction metrics at once', () => {
        manager.recordSatisfactionRating('session-1', {
          soundsLikeMeScore: 4,
          qualitySatisfactionScore: 5,
          wouldUseAsIs: true,
        });

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('sounds_like_me')?.[0].value).toBe(4);
        expect(metrics?.get('user_satisfaction')?.[0].value).toBe(5);
        expect(metrics?.get('would_use_as_is')?.[0].value).toBe(1);
      });
    });

    describe('Chapter Metrics (Batch)', () => {
      it('should record all chapter metrics at once', () => {
        manager.recordChapterMetrics('session-1', {
          qualityScore: 0.9,
          revisionCount: 2,
          durationMs: 10000,
        });

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('quality_score')?.[0].value).toBe(0.9);
        expect(metrics?.get('revision_count')?.[0].value).toBe(2);
        expect(metrics?.get('chapter_duration_ms')?.[0].value).toBe(10000);
      });

      it('should optionally record user rating', () => {
        manager.recordChapterMetrics('session-1', {
          qualityScore: 0.9,
          revisionCount: 2,
          durationMs: 10000,
          userRating: {
            soundsLikeMeScore: 5,
            qualitySatisfactionScore: 4,
            wouldUseAsIs: true,
          },
        });

        const metrics = framework.getMetrics(FEEDBACK_LOOP_TEST_ID);
        expect(metrics?.get('sounds_like_me')?.[0].value).toBe(5);
        expect(metrics?.get('user_satisfaction')?.[0].value).toBe(4);
        expect(metrics?.get('would_use_as_is')?.[0].value).toBe(1);
      });
    });
  });

  // ==========================================================================
  // Progress Tracking
  // ==========================================================================

  describe('Progress Tracking', () => {
    it('should start with zero sessions', () => {
      manager.registerTest();
      const counts = manager.getSessionCounts();

      expect(counts.treatment).toBe(0);
      expect(counts.control).toBe(0);
    });

    it('should track session counts correctly', () => {
      for (let i = 0; i < 30; i++) {
        manager.getAssignment(`session-${i}`);
      }

      const counts = manager.getSessionCounts();
      expect(counts.treatment + counts.control).toBe(30);
    });

    it('should not reach minimum sample size initially', () => {
      manager.registerTest();

      expect(manager.hasReachedMinSampleSize()).toBe(false);
    });

    it('should reach minimum sample size with enough sessions', () => {
      // Find enough sessions for each group
      let treatmentCount = 0;
      let controlCount = 0;
      let i = 0;

      while (treatmentCount < 20 || controlCount < 20) {
        const assignment = manager.getAssignment(`min-sample-${i}`);
        if (assignment === 'treatment') treatmentCount++;
        else controlCount++;
        i++;
      }

      expect(manager.hasReachedMinSampleSize()).toBe(true);
    });

    it('should calculate progress correctly', () => {
      // Add some sessions and verify progress calculation
      // We'll add sessions and check the actual counts match expected progress
      for (let i = 0; i < 15; i++) {
        manager.getAssignment(`progress-${i}`);
      }

      const counts = manager.getSessionCounts();
      const progress = manager.getProgress();
      const minSize = feedbackLoopTestConfig.minSampleSize; // 20

      // Verify progress calculation matches actual counts
      const expectedTreatmentProgress = Math.min(1, counts.treatment / minSize);
      const expectedControlProgress = Math.min(1, counts.control / minSize);
      const expectedOverallProgress = (expectedTreatmentProgress + expectedControlProgress) / 2;

      expect(progress.treatmentProgress).toBeCloseTo(expectedTreatmentProgress, 5);
      expect(progress.controlProgress).toBeCloseTo(expectedControlProgress, 5);
      expect(progress.overallProgress).toBeCloseTo(expectedOverallProgress, 5);
      expect(progress.sessionsNeeded).toBeGreaterThan(0);

      // Total sessions should match what we added
      expect(counts.treatment + counts.control).toBe(15);
    });

    it('should cap progress at 100%', () => {
      // Add more than minimum sessions
      let treatmentCount = 0;
      let controlCount = 0;
      let i = 0;

      while (treatmentCount < 30 || controlCount < 30) {
        const assignment = manager.getAssignment(`overflow-${i}`);
        if (assignment === 'treatment') treatmentCount++;
        else controlCount++;
        i++;
      }

      const progress = manager.getProgress();

      expect(progress.treatmentProgress).toBe(1);
      expect(progress.controlProgress).toBe(1);
      expect(progress.overallProgress).toBe(1);
      expect(progress.sessionsNeeded).toBe(0);
    });

    it('should generate progress summary', () => {
      manager.registerTest();
      const summary = manager.getProgressSummary();

      expect(summary).toContain('Feedback Loop A/B Test Progress');
      expect(summary).toContain('Treatment Group');
      expect(summary).toContain('Control Group');
      expect(summary).toContain('Overall Progress');
      expect(summary).toContain('Status');
    });
  });

  // ==========================================================================
  // Results
  // ==========================================================================

  describe('Results', () => {
    it('should get results from framework', () => {
      manager.registerTest();
      const results = manager.getResults();

      expect(results.testId).toBe(FEEDBACK_LOOP_TEST_ID);
      expect(results.testName).toBe(FEEDBACK_LOOP_TEST_NAME);
    });

    it('should format results for display', () => {
      manager.registerTest();
      const formatted = manager.getFormattedResults();

      expect(formatted).toContain('A/B Test Results');
      expect(formatted).toContain(FEEDBACK_LOOP_TEST_NAME);
    });

    it('should show insufficient_data when sample is too small', () => {
      manager.registerTest();
      const results = manager.getResults();

      expect(results.status).toBe('insufficient_data');
    });
  });

  // ==========================================================================
  // Factory Function
  // ==========================================================================

  describe('Factory Function', () => {
    it('should create manager with new framework', () => {
      const testManager = createFeedbackLoopTestManager();

      expect(testManager).toBeInstanceOf(FeedbackLoopTestManager);
      expect(testManager.getFramework()).toBeInstanceOf(ABTestFramework);
    });

    it('should create manager with existing framework', () => {
      const existingFramework = createABTestFramework();
      const testManager = createFeedbackLoopTestManager(existingFramework);

      expect(testManager.getFramework()).toBe(existingFramework);
    });

    it('should create independent instances', () => {
      const manager1 = createFeedbackLoopTestManager();
      const manager2 = createFeedbackLoopTestManager();

      manager1.registerTest();

      expect(manager1.isRegistered()).toBe(true);
      expect(manager2.isRegistered()).toBe(false);
    });
  });

  // ==========================================================================
  // Expected Outcomes
  // ==========================================================================

  describe('Expected Outcomes', () => {
    it('should have all expected outcome definitions', () => {
      const metrics = expectedOutcomes.map((o) => o.metric);

      expect(metrics).toContain('user_satisfaction');
      expect(metrics).toContain('sounds_like_me');
      expect(metrics).toContain('revision_count');
      expect(metrics).toContain('quality_score');
      expect(metrics).toContain('would_use_as_is');
      expect(metrics).toContain('chapter_duration_ms');
    });

    it('should expect treatment_higher for satisfaction metrics', () => {
      const userSat = expectedOutcomes.find((o) => o.metric === 'user_satisfaction');
      const soundsLike = expectedOutcomes.find((o) => o.metric === 'sounds_like_me');

      expect(userSat?.expectedDirection).toBe('treatment_higher');
      expect(soundsLike?.expectedDirection).toBe('treatment_higher');
    });

    it('should expect treatment_lower for revision count', () => {
      const revisions = expectedOutcomes.find((o) => o.metric === 'revision_count');

      expect(revisions?.expectedDirection).toBe('treatment_lower');
    });

    it('should expect no_difference for duration', () => {
      const duration = expectedOutcomes.find(
        (o) => o.metric === 'chapter_duration_ms'
      );

      expect(duration?.expectedDirection).toBe('no_difference');
    });

    it('should have meaningful hypotheses', () => {
      for (const outcome of expectedOutcomes) {
        expect(outcome.hypothesis.length).toBeGreaterThan(10);
      }
    });

    it('should have valid effect sizes', () => {
      for (const outcome of expectedOutcomes) {
        expect(outcome.minEffectSize).toBeGreaterThanOrEqual(0);
        expect(outcome.minEffectSize).toBeLessThanOrEqual(1);
      }
    });
  });

  // ==========================================================================
  // Expectation Analysis
  // ==========================================================================

  describe('Expectation Analysis', () => {
    /**
     * Helper to create mock results with specific metric values
     */
    function createMockResults(
      metricOverrides: Record<
        string,
        {
          treatmentMean: number;
          controlMean: number;
          significant: boolean;
          effectSize: number;
        }
      >
    ): ABTestResult {
      const metrics: ABTestResult['metrics'] = {};

      for (const [name, values] of Object.entries(metricOverrides)) {
        metrics[name] = {
          treatment: {
            mean: values.treatmentMean,
            stdDev: 0.1,
            count: 20,
            values: [],
          },
          control: {
            mean: values.controlMean,
            stdDev: 0.1,
            count: 20,
            values: [],
          },
          pValue: values.significant ? 0.01 : 0.5,
          significantDifference: values.significant,
          effectSize: values.effectSize,
        };
      }

      return {
        testId: FEEDBACK_LOOP_TEST_ID,
        testName: FEEDBACK_LOOP_TEST_NAME,
        status: 'completed',
        treatmentSessions: 20,
        controlSessions: 20,
        metrics,
        winner: 'inconclusive',
        recommendation: '',
        analysisTimestamp: new Date().toISOString(),
      };
    }

    it('should analyze results against expectations', () => {
      const results = createMockResults({
        user_satisfaction: {
          treatmentMean: 4.5,
          controlMean: 3.5,
          significant: true,
          effectSize: 0.5,
        },
      });

      const analysis = analyzeAgainstExpectations(results);

      expect(analysis.length).toBe(1);
      expect(analysis[0].metric).toBe('user_satisfaction');
      expect(analysis[0].actual.direction).toBe('treatment_higher');
      expect(analysis[0].meetsExpectation).toBe(true);
    });

    it('should detect when treatment is lower', () => {
      const results = createMockResults({
        revision_count: {
          treatmentMean: 1,
          controlMean: 3,
          significant: true,
          effectSize: -0.5,
        },
      });

      const analysis = analyzeAgainstExpectations(results);

      expect(analysis[0].actual.direction).toBe('treatment_lower');
      expect(analysis[0].meetsExpectation).toBe(true);
    });

    it('should detect no significant difference', () => {
      const results = createMockResults({
        chapter_duration_ms: {
          treatmentMean: 5000,
          controlMean: 5100,
          significant: false,
          effectSize: 0.1,
        },
      });

      const analysis = analyzeAgainstExpectations(results);

      expect(analysis[0].actual.direction).toBe('no_difference');
      expect(analysis[0].meetsExpectation).toBe(true); // Expected no_difference
    });

    it('should fail when direction is wrong', () => {
      const results = createMockResults({
        user_satisfaction: {
          treatmentMean: 3.0,
          controlMean: 4.5,
          significant: true,
          effectSize: -0.5,
        },
      });

      const analysis = analyzeAgainstExpectations(results);

      expect(analysis[0].actual.direction).toBe('treatment_lower');
      expect(analysis[0].meetsExpectation).toBe(false); // Expected treatment_higher
    });

    it('should fail when effect size is too small', () => {
      const results = createMockResults({
        sounds_like_me: {
          treatmentMean: 4.1,
          controlMean: 4.0,
          significant: true,
          effectSize: 0.1, // Too small (min is 0.4)
        },
      });

      const analysis = analyzeAgainstExpectations(results);

      expect(analysis[0].meetsExpectation).toBe(false);
    });

    it('should handle missing metrics gracefully', () => {
      const results = createMockResults({});

      const analysis = analyzeAgainstExpectations(results);

      expect(analysis).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Formatted Analysis
  // ==========================================================================

  describe('Formatted Analysis', () => {
    function createMockResults(): ABTestResult {
      const metrics: ABTestResult['metrics'] = {
        user_satisfaction: {
          treatment: { mean: 4.5, stdDev: 0.5, count: 20, values: [] },
          control: { mean: 3.5, stdDev: 0.5, count: 20, values: [] },
          pValue: 0.01,
          significantDifference: true,
          effectSize: 0.5,
        },
        sounds_like_me: {
          treatment: { mean: 4.2, stdDev: 0.4, count: 20, values: [] },
          control: { mean: 3.6, stdDev: 0.4, count: 20, values: [] },
          pValue: 0.02,
          significantDifference: true,
          effectSize: 0.4,
        },
        revision_count: {
          treatment: { mean: 1.5, stdDev: 0.8, count: 20, values: [] },
          control: { mean: 2.8, stdDev: 0.8, count: 20, values: [] },
          pValue: 0.01,
          significantDifference: true,
          effectSize: -0.4,
        },
        quality_score: {
          treatment: { mean: 0.85, stdDev: 0.1, count: 20, values: [] },
          control: { mean: 0.75, stdDev: 0.1, count: 20, values: [] },
          pValue: 0.03,
          significantDifference: true,
          effectSize: 0.3,
        },
        would_use_as_is: {
          treatment: { mean: 0.8, stdDev: 0.2, count: 20, values: [] },
          control: { mean: 0.5, stdDev: 0.2, count: 20, values: [] },
          pValue: 0.01,
          significantDifference: true,
          effectSize: 0.5,
        },
        chapter_duration_ms: {
          treatment: { mean: 5500, stdDev: 1000, count: 20, values: [] },
          control: { mean: 5000, stdDev: 1000, count: 20, values: [] },
          pValue: 0.2,
          significantDifference: false,
          effectSize: 0.1,
        },
      };

      return {
        testId: FEEDBACK_LOOP_TEST_ID,
        testName: FEEDBACK_LOOP_TEST_NAME,
        status: 'completed',
        treatmentSessions: 20,
        controlSessions: 20,
        metrics,
        winner: 'treatment',
        recommendation: '',
        analysisTimestamp: new Date().toISOString(),
      };
    }

    it('should format analysis with header', () => {
      const results = createMockResults();
      const formatted = formatExpectationAnalysis(results);

      expect(formatted).toContain('Feedback Loop A/B Test: Expectation Analysis');
    });

    it('should show pass/fail status for each metric', () => {
      const results = createMockResults();
      const formatted = formatExpectationAnalysis(results);

      expect(formatted).toContain('[PASS]');
      expect(formatted).toContain('user_satisfaction');
    });

    it('should show expected and actual values', () => {
      const results = createMockResults();
      const formatted = formatExpectationAnalysis(results);

      expect(formatted).toContain('Expected:');
      expect(formatted).toContain('Actual:');
    });

    it('should show hypothesis for each metric', () => {
      const results = createMockResults();
      const formatted = formatExpectationAnalysis(results);

      expect(formatted).toContain('Hypothesis:');
    });

    it('should include summary', () => {
      const results = createMockResults();
      const formatted = formatExpectationAnalysis(results);

      expect(formatted).toContain('Summary');
      expect(formatted).toContain('metrics meet expectations');
    });

    it('should include recommendation', () => {
      const results = createMockResults();
      const formatted = formatExpectationAnalysis(results);

      expect(formatted).toContain('Recommendation:');
    });
  });

  // ==========================================================================
  // Expectation Summary
  // ==========================================================================

  describe('Expectation Summary', () => {
    function createMockResults(passRate: number): ABTestResult {
      const outcomes = expectedOutcomes.slice(0, 5); // Use first 5 outcomes
      const passCount = Math.round(passRate * outcomes.length);

      const metrics: ABTestResult['metrics'] = {};
      outcomes.forEach((outcome, index) => {
        const shouldPass = index < passCount;

        // Create metric that passes or fails based on shouldPass
        let treatmentMean = 0.5;
        let controlMean = 0.5;
        let effectSize = 0;

        if (shouldPass) {
          if (outcome.expectedDirection === 'treatment_higher') {
            treatmentMean = 0.9;
            controlMean = 0.5;
            effectSize = outcome.minEffectSize + 0.1;
          } else if (outcome.expectedDirection === 'treatment_lower') {
            treatmentMean = 0.3;
            controlMean = 0.7;
            effectSize = -(outcome.minEffectSize + 0.1);
          }
        } else {
          // Reverse the expected direction
          if (outcome.expectedDirection === 'treatment_higher') {
            treatmentMean = 0.3;
            controlMean = 0.7;
            effectSize = -0.5;
          } else if (outcome.expectedDirection === 'treatment_lower') {
            treatmentMean = 0.9;
            controlMean = 0.5;
            effectSize = 0.5;
          }
        }

        metrics[outcome.metric] = {
          treatment: { mean: treatmentMean, stdDev: 0.1, count: 20, values: [] },
          control: { mean: controlMean, stdDev: 0.1, count: 20, values: [] },
          pValue: shouldPass && outcome.expectedDirection !== 'no_difference' ? 0.01 : 0.5,
          significantDifference:
            shouldPass && outcome.expectedDirection !== 'no_difference',
          effectSize,
        };
      });

      return {
        testId: FEEDBACK_LOOP_TEST_ID,
        testName: FEEDBACK_LOOP_TEST_NAME,
        status: 'completed',
        treatmentSessions: 20,
        controlSessions: 20,
        metrics,
        winner: 'inconclusive',
        recommendation: '',
        analysisTimestamp: new Date().toISOString(),
      };
    }

    it('should calculate pass rate correctly', () => {
      const results = createMockResults(0.8);
      const summary = getExpectationSummary(results);

      expect(summary.passRate).toBeGreaterThanOrEqual(0.6);
      expect(summary.passed + summary.failed).toBe(summary.total);
    });

    it('should recommend deploy for high pass rate', () => {
      const results = createMockResults(1.0);
      const summary = getExpectationSummary(results);

      expect(summary.recommendation).toBe('deploy');
    });

    it('should recommend investigate for medium pass rate', () => {
      const results = createMockResults(0.6);
      const summary = getExpectationSummary(results);

      expect(summary.recommendation).toBe('investigate');
    });

    it('should recommend improve for low pass rate', () => {
      const results = createMockResults(0.2);
      const summary = getExpectationSummary(results);

      expect(summary.recommendation).toBe('improve');
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration', () => {
    it('should handle complete test lifecycle', () => {
      // 1. Create manager
      const testManager = createFeedbackLoopTestManager();

      // 2. Register test
      testManager.registerTest();
      expect(testManager.isRegistered()).toBe(true);

      // 3. Simulate sessions
      const treatmentSessions: string[] = [];
      const controlSessions: string[] = [];

      for (let i = 0; treatmentSessions.length < 25 || controlSessions.length < 25; i++) {
        const sessionId = `lifecycle-${i}`;
        const assignment = testManager.getAssignment(sessionId);

        if (assignment === 'treatment' && treatmentSessions.length < 25) {
          treatmentSessions.push(sessionId);

          // Treatment sessions get better metrics
          testManager.recordChapterMetrics(sessionId, {
            qualityScore: 0.85 + Math.random() * 0.1,
            revisionCount: Math.floor(Math.random() * 2),
            durationMs: 5000 + Math.random() * 1000,
            userRating: {
              soundsLikeMeScore: (Math.floor(Math.random() * 2) + 4) as 4 | 5,
              qualitySatisfactionScore: (Math.floor(Math.random() * 2) + 4) as 4 | 5,
              wouldUseAsIs: Math.random() > 0.2,
            },
          });
        } else if (assignment === 'control' && controlSessions.length < 25) {
          controlSessions.push(sessionId);

          // Control sessions get baseline metrics
          testManager.recordChapterMetrics(sessionId, {
            qualityScore: 0.65 + Math.random() * 0.1,
            revisionCount: Math.floor(Math.random() * 3) + 1,
            durationMs: 5000 + Math.random() * 1000,
            userRating: {
              soundsLikeMeScore: (Math.floor(Math.random() * 2) + 3) as 3 | 4,
              qualitySatisfactionScore: (Math.floor(Math.random() * 2) + 3) as 3 | 4,
              wouldUseAsIs: Math.random() > 0.5,
            },
          });
        }
      }

      // 4. Check progress
      expect(testManager.hasReachedMinSampleSize()).toBe(true);

      // 5. Get results
      const results = testManager.getResults();
      expect(results.status).toBe('completed');
      expect(results.treatmentSessions).toBeGreaterThanOrEqual(20);
      expect(results.controlSessions).toBeGreaterThanOrEqual(20);

      // 6. Analyze against expectations
      const analysis = analyzeAgainstExpectations(results);
      expect(analysis.length).toBeGreaterThan(0);

      // 7. Get summary
      const summary = getExpectationSummary(results);
      expect(summary.total).toBeGreaterThan(0);

      // 8. Format results
      const formatted = testManager.getFormattedResults();
      expect(formatted.length).toBeGreaterThan(0);

      const formattedAnalysis = formatExpectationAnalysis(results);
      expect(formattedAnalysis.length).toBeGreaterThan(0);
    });

    it('should work with shared framework', () => {
      // Create shared framework
      const sharedFramework = createABTestFramework();

      // Create multiple managers sharing the framework
      const manager1 = new FeedbackLoopTestManager(sharedFramework);
      const manager2 = new FeedbackLoopTestManager(sharedFramework);

      // Register via first manager
      manager1.registerTest();

      // Second manager should see the test
      expect(sharedFramework.hasTest(FEEDBACK_LOOP_TEST_ID)).toBe(true);

      // Both managers should work with same test
      const assignment1 = manager1.getAssignment('shared-session');
      const assignment2 = manager2.getAssignment('shared-session');

      expect(assignment1).toBe(assignment2);
    });
  });
});
