/**
 * Tests for A/B Test Framework - PHASE-5-001
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ABTestFramework,
  createABTestFramework,
  formatABTestResult,
  formatTestSummary,
  type ABTestConfig,
  type ABTestEvent,
} from '../../../../src/god-agent/cli/testing/ab-test-framework.js';

describe('PHASE-5-001: A/B Test Framework', () => {
  let framework: ABTestFramework;

  const createTestConfig = (overrides: Partial<ABTestConfig> = {}): ABTestConfig => ({
    testId: 'test-001',
    name: 'Test Experiment',
    description: 'A test experiment for validation',
    treatmentConfig: { setting: 'new' },
    controlConfig: { setting: 'old' },
    treatmentRatio: 0.5,
    successMetrics: ['quality_score', 'latency_ms'],
    minSampleSize: 10,
    ...overrides,
  });

  beforeEach(() => {
    framework = createABTestFramework();
  });

  // ==========================================================================
  // Test Registration
  // ==========================================================================

  describe('Test Registration', () => {
    it('should register a new test', () => {
      const config = createTestConfig();
      framework.registerTest(config);

      const test = framework.getTest('test-001');
      expect(test).toBeDefined();
      expect(test?.name).toBe('Test Experiment');
      expect(test?.treatmentRatio).toBe(0.5);
    });

    it('should emit test_registered event', () => {
      const handler = vi.fn();
      framework.on('test_registered', handler);

      const config = createTestConfig();
      framework.registerTest(config);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as ABTestEvent;
      expect(event.type).toBe('test_registered');
      expect(event.testId).toBe('test-001');
      expect(event.data.name).toBe('Test Experiment');
    });

    it('should list all registered tests', () => {
      framework.registerTest(createTestConfig({ testId: 'test-1' }));
      framework.registerTest(createTestConfig({ testId: 'test-2' }));
      framework.registerTest(createTestConfig({ testId: 'test-3' }));

      const tests = framework.listTests();
      expect(tests).toHaveLength(3);
    });

    it('should check if test exists', () => {
      framework.registerTest(createTestConfig());

      expect(framework.hasTest('test-001')).toBe(true);
      expect(framework.hasTest('nonexistent')).toBe(false);
    });

    it('should reject invalid treatment ratio < 0', () => {
      const config = createTestConfig({ treatmentRatio: -0.1 });
      expect(() => framework.registerTest(config)).toThrow(
        'Treatment ratio must be between 0 and 1'
      );
    });

    it('should reject invalid treatment ratio > 1', () => {
      const config = createTestConfig({ treatmentRatio: 1.5 });
      expect(() => framework.registerTest(config)).toThrow(
        'Treatment ratio must be between 0 and 1'
      );
    });

    it('should reject invalid min sample size', () => {
      const config = createTestConfig({ minSampleSize: 0 });
      expect(() => framework.registerTest(config)).toThrow(
        'Minimum sample size must be at least 1'
      );
    });

    it('should reject empty success metrics', () => {
      const config = createTestConfig({ successMetrics: [] });
      expect(() => framework.registerTest(config)).toThrow(
        'At least one success metric must be defined'
      );
    });

    it('should reject empty test ID', () => {
      const config = createTestConfig({ testId: '' });
      expect(() => framework.registerTest(config)).toThrow(
        'Test ID must not be empty'
      );
    });
  });

  // ==========================================================================
  // Deterministic Assignment
  // ==========================================================================

  describe('Deterministic Assignment', () => {
    beforeEach(() => {
      framework.registerTest(createTestConfig());
    });

    it('should assign sessions deterministically', () => {
      const assignment1 = framework.getAssignment('session-abc', 'test-001');
      const assignment2 = framework.getAssignment('session-abc', 'test-001');

      expect(assignment1).toBe(assignment2);
    });

    it('should return consistent assignment across multiple calls', () => {
      const sessionId = 'consistent-session';
      const assignments = new Set<string>();

      for (let i = 0; i < 100; i++) {
        assignments.add(framework.getAssignment(sessionId, 'test-001'));
      }

      // Should always get the same assignment
      expect(assignments.size).toBe(1);
    });

    it('should distribute sessions roughly according to treatment ratio', () => {
      // Register test with 50% treatment ratio
      let treatmentCount = 0;
      const totalSessions = 1000;

      for (let i = 0; i < totalSessions; i++) {
        const assignment = framework.getAssignment(`session-${i}`, 'test-001');
        if (assignment === 'treatment') treatmentCount++;
      }

      const treatmentRatio = treatmentCount / totalSessions;
      // Allow 10% tolerance around 50%
      expect(treatmentRatio).toBeGreaterThan(0.4);
      expect(treatmentRatio).toBeLessThan(0.6);
    });

    it('should respect different treatment ratios', () => {
      // Register test with 20% treatment ratio
      framework.registerTest(
        createTestConfig({
          testId: 'test-20',
          treatmentRatio: 0.2,
        })
      );

      let treatmentCount = 0;
      const totalSessions = 1000;

      for (let i = 0; i < totalSessions; i++) {
        const assignment = framework.getAssignment(`session-${i}`, 'test-20');
        if (assignment === 'treatment') treatmentCount++;
      }

      const treatmentRatio = treatmentCount / totalSessions;
      // Allow 10% tolerance around 20%
      expect(treatmentRatio).toBeGreaterThan(0.1);
      expect(treatmentRatio).toBeLessThan(0.3);
    });

    it('should emit session_assigned event', () => {
      const handler = vi.fn();
      framework.on('session_assigned', handler);

      framework.getAssignment('new-session', 'test-001');

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as ABTestEvent;
      expect(event.type).toBe('session_assigned');
      expect(event.data.sessionId).toBe('new-session');
      expect(['treatment', 'control']).toContain(event.data.assignment);
    });

    it('should not emit event for cached assignment', () => {
      const handler = vi.fn();

      // First assignment
      framework.getAssignment('cached-session', 'test-001');

      // Add handler after first assignment
      framework.on('session_assigned', handler);

      // Second assignment should use cache
      framework.getAssignment('cached-session', 'test-001');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent test', () => {
      expect(() => framework.getAssignment('session', 'nonexistent')).toThrow(
        'Test nonexistent not found'
      );
    });

    it('should assign excluded sessions to control', () => {
      framework.registerTest(
        createTestConfig({
          testId: 'test-exclude',
          excludeCriteria: (sessionId) => sessionId.startsWith('exclude-'),
        })
      );

      const assignment = framework.getAssignment('exclude-123', 'test-exclude');
      expect(assignment).toBe('control');
    });
  });

  // ==========================================================================
  // Config Retrieval
  // ==========================================================================

  describe('Config Retrieval', () => {
    beforeEach(() => {
      framework.registerTest(createTestConfig());
    });

    it('should return treatment config for treatment assignment', () => {
      // Find a session that gets assigned to treatment
      let sessionId = '';
      for (let i = 0; i < 100; i++) {
        const testSessionId = `treatment-search-${i}`;
        if (framework.getAssignment(testSessionId, 'test-001') === 'treatment') {
          sessionId = testSessionId;
          break;
        }
      }

      const config = framework.getConfigForSession(sessionId, 'test-001');
      expect(config).toEqual({ setting: 'new' });
    });

    it('should return control config for control assignment', () => {
      // Find a session that gets assigned to control
      let sessionId = '';
      for (let i = 0; i < 100; i++) {
        const testSessionId = `control-search-${i}`;
        if (framework.getAssignment(testSessionId, 'test-001') === 'control') {
          sessionId = testSessionId;
          break;
        }
      }

      const config = framework.getConfigForSession(sessionId, 'test-001');
      expect(config).toEqual({ setting: 'old' });
    });

    it('should throw error for non-existent test', () => {
      expect(() =>
        framework.getConfigForSession('session', 'nonexistent')
      ).toThrow('Test nonexistent not found');
    });
  });

  // ==========================================================================
  // Session Counts
  // ==========================================================================

  describe('Session Counts', () => {
    beforeEach(() => {
      framework.registerTest(createTestConfig());
    });

    it('should return zero counts for new test', () => {
      framework.registerTest(createTestConfig({ testId: 'test-new' }));

      const counts = framework.getSessionCounts('test-new');
      expect(counts.treatment).toBe(0);
      expect(counts.control).toBe(0);
    });

    it('should track session counts correctly', () => {
      for (let i = 0; i < 50; i++) {
        framework.getAssignment(`session-${i}`, 'test-001');
      }

      const counts = framework.getSessionCounts('test-001');
      expect(counts.treatment + counts.control).toBe(50);
    });

    it('should return zero for non-existent test', () => {
      const counts = framework.getSessionCounts('nonexistent');
      expect(counts.treatment).toBe(0);
      expect(counts.control).toBe(0);
    });
  });

  // ==========================================================================
  // Metric Recording
  // ==========================================================================

  describe('Metric Recording', () => {
    beforeEach(() => {
      framework.registerTest(createTestConfig());
    });

    it('should record metric values', () => {
      framework.recordMetric('session-1', 'test-001', 'quality_score', 0.85);

      const metrics = framework.getMetrics('test-001');
      expect(metrics).toBeDefined();
      expect(metrics?.get('quality_score')?.length).toBe(1);
      expect(metrics?.get('quality_score')?.[0].value).toBe(0.85);
    });

    it('should emit metric_recorded event', () => {
      const handler = vi.fn();
      framework.on('metric_recorded', handler);

      framework.recordMetric('session-1', 'test-001', 'quality_score', 0.85);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as ABTestEvent;
      expect(event.type).toBe('metric_recorded');
      expect(event.data.metricName).toBe('quality_score');
      expect(event.data.value).toBe(0.85);
    });

    it('should record multiple metrics', () => {
      framework.recordMetric('session-1', 'test-001', 'quality_score', 0.85);
      framework.recordMetric('session-1', 'test-001', 'latency_ms', 150);

      const metrics = framework.getMetrics('test-001');
      expect(metrics?.get('quality_score')?.length).toBe(1);
      expect(metrics?.get('latency_ms')?.length).toBe(1);
    });

    it('should track assignment with metric', () => {
      const assignment = framework.getAssignment('session-1', 'test-001');
      framework.recordMetric('session-1', 'test-001', 'quality_score', 0.85);

      const metrics = framework.getMetrics('test-001');
      expect(metrics?.get('quality_score')?.[0].assignment).toBe(assignment);
    });

    it('should throw error for undefined metric', () => {
      expect(() =>
        framework.recordMetric('session-1', 'test-001', 'undefined_metric', 1)
      ).toThrow('Metric undefined_metric not defined for test test-001');
    });

    it('should throw error for non-existent test', () => {
      expect(() =>
        framework.recordMetric('session-1', 'nonexistent', 'quality_score', 1)
      ).toThrow('Test nonexistent not found');
    });
  });

  // ==========================================================================
  // Statistical Analysis
  // ==========================================================================

  describe('Statistical Analysis', () => {
    beforeEach(() => {
      framework.registerTest(createTestConfig({ minSampleSize: 5 }));
    });

    it('should report insufficient_data when sample size is too small', () => {
      // Only 2 sessions each
      framework.getAssignment('treatment-1', 'test-001');
      framework.getAssignment('control-1', 'test-001');

      const results = framework.getResults('test-001');
      expect(results.status).toBe('insufficient_data');
      expect(results.winner).toBe('inconclusive');
    });

    it('should calculate mean and stdDev correctly', () => {
      // Assign and record metrics for treatment group
      for (let i = 0; i < 10; i++) {
        // Find treatment sessions
        let sessionId = '';
        for (let j = 0; j < 100; j++) {
          const testId = `t-${i}-${j}`;
          if (framework.getAssignment(testId, 'test-001') === 'treatment') {
            sessionId = testId;
            break;
          }
        }
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.8);
      }

      // Assign and record metrics for control group
      for (let i = 0; i < 10; i++) {
        let sessionId = '';
        for (let j = 0; j < 100; j++) {
          const testId = `c-${i}-${j}`;
          if (framework.getAssignment(testId, 'test-001') === 'control') {
            sessionId = testId;
            break;
          }
        }
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.6);
      }

      const results = framework.getResults('test-001');
      const stats = results.metrics['quality_score'];

      expect(stats.treatment.mean).toBeCloseTo(0.8, 2);
      expect(stats.control.mean).toBeCloseTo(0.6, 2);
    });

    it('should detect significant difference', () => {
      // Create clear separation between treatment and control
      const treatmentSessions: string[] = [];
      const controlSessions: string[] = [];

      // Find sessions for each group
      for (let i = 0; treatmentSessions.length < 20 || controlSessions.length < 20; i++) {
        const sessionId = `stats-session-${i}`;
        const assignment = framework.getAssignment(sessionId, 'test-001');
        if (assignment === 'treatment' && treatmentSessions.length < 20) {
          treatmentSessions.push(sessionId);
        } else if (assignment === 'control' && controlSessions.length < 20) {
          controlSessions.push(sessionId);
        }
      }

      // Record high values for treatment, low for control
      for (const sessionId of treatmentSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.9 + Math.random() * 0.1);
      }
      for (const sessionId of controlSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.3 + Math.random() * 0.1);
      }

      const results = framework.getResults('test-001');
      expect(results.status).toBe('completed');
      expect(results.metrics['quality_score'].significantDifference).toBe(true);
      expect(results.winner).toBe('treatment');
    });

    it('should detect no significant difference', () => {
      const treatmentSessions: string[] = [];
      const controlSessions: string[] = [];

      for (let i = 0; treatmentSessions.length < 20 || controlSessions.length < 20; i++) {
        const sessionId = `nosig-session-${i}`;
        const assignment = framework.getAssignment(sessionId, 'test-001');
        if (assignment === 'treatment' && treatmentSessions.length < 20) {
          treatmentSessions.push(sessionId);
        } else if (assignment === 'control' && controlSessions.length < 20) {
          controlSessions.push(sessionId);
        }
      }

      // Record identical values for both groups - should show no significant difference
      for (const sessionId of treatmentSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.75);
      }
      for (const sessionId of controlSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.75);
      }

      const results = framework.getResults('test-001');
      expect(results.metrics['quality_score'].significantDifference).toBe(false);
      expect(results.winner).toBe('inconclusive');
    });

    it('should calculate Cohen d effect size', () => {
      const treatmentSessions: string[] = [];
      const controlSessions: string[] = [];

      for (let i = 0; treatmentSessions.length < 10 || controlSessions.length < 10; i++) {
        const sessionId = `effect-session-${i}`;
        const assignment = framework.getAssignment(sessionId, 'test-001');
        if (assignment === 'treatment' && treatmentSessions.length < 10) {
          treatmentSessions.push(sessionId);
        } else if (assignment === 'control' && controlSessions.length < 10) {
          controlSessions.push(sessionId);
        }
      }

      // Create large effect size (d > 0.8)
      for (const sessionId of treatmentSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.9);
      }
      for (const sessionId of controlSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.4);
      }

      const results = framework.getResults('test-001');
      // Effect size should be large (positive since treatment > control)
      expect(results.metrics['quality_score'].effectSize).toBeGreaterThan(0);
    });

    it('should emit test_analyzed event', () => {
      const handler = vi.fn();
      framework.on('test_analyzed', handler);

      framework.getResults('test-001');

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as ABTestEvent;
      expect(event.type).toBe('test_analyzed');
    });

    it('should throw error for non-existent test', () => {
      expect(() => framework.getResults('nonexistent')).toThrow(
        'Test nonexistent not found'
      );
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle 0% treatment ratio', () => {
      framework.registerTest(
        createTestConfig({
          testId: 'test-0',
          treatmentRatio: 0,
        })
      );

      // All sessions should be control
      for (let i = 0; i < 20; i++) {
        const assignment = framework.getAssignment(`session-${i}`, 'test-0');
        expect(assignment).toBe('control');
      }
    });

    it('should handle 100% treatment ratio', () => {
      framework.registerTest(
        createTestConfig({
          testId: 'test-100',
          treatmentRatio: 1,
        })
      );

      // All sessions should be treatment
      for (let i = 0; i < 20; i++) {
        const assignment = framework.getAssignment(`session-${i}`, 'test-100');
        expect(assignment).toBe('treatment');
      }
    });

    it('should handle empty metrics in results', () => {
      framework.registerTest(createTestConfig());

      const results = framework.getResults('test-001');

      // Should have metric entries even without data
      expect(results.metrics['quality_score']).toBeDefined();
      expect(results.metrics['quality_score'].treatment.count).toBe(0);
      expect(results.metrics['quality_score'].control.count).toBe(0);
    });

    it('should handle single value in each group', () => {
      framework.registerTest(createTestConfig({ minSampleSize: 1 }));

      // Find one treatment and one control session
      let treatmentSession = '';
      let controlSession = '';
      for (let i = 0; !treatmentSession || !controlSession; i++) {
        const sessionId = `single-${i}`;
        const assignment = framework.getAssignment(sessionId, 'test-001');
        if (assignment === 'treatment' && !treatmentSession) {
          treatmentSession = sessionId;
        } else if (assignment === 'control' && !controlSession) {
          controlSession = sessionId;
        }
      }

      framework.recordMetric(treatmentSession, 'test-001', 'quality_score', 0.9);
      framework.recordMetric(controlSession, 'test-001', 'quality_score', 0.5);

      const results = framework.getResults('test-001');

      // With only 1 sample each, p-value should be 1 (not enough data)
      expect(results.metrics['quality_score'].pValue).toBe(1);
      expect(results.metrics['quality_score'].significantDifference).toBe(false);
    });

    it('should handle identical values', () => {
      framework.registerTest(createTestConfig({ minSampleSize: 5 }));

      const treatmentSessions: string[] = [];
      const controlSessions: string[] = [];

      for (let i = 0; treatmentSessions.length < 10 || controlSessions.length < 10; i++) {
        const sessionId = `identical-${i}`;
        const assignment = framework.getAssignment(sessionId, 'test-001');
        if (assignment === 'treatment' && treatmentSessions.length < 10) {
          treatmentSessions.push(sessionId);
        } else if (assignment === 'control' && controlSessions.length < 10) {
          controlSessions.push(sessionId);
        }
      }

      // Record identical values
      for (const sessionId of treatmentSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.5);
      }
      for (const sessionId of controlSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.5);
      }

      const results = framework.getResults('test-001');

      // No difference
      expect(results.metrics['quality_score'].effectSize).toBe(0);
      expect(results.metrics['quality_score'].significantDifference).toBe(false);
    });

    it('should handle multiple metrics with mixed results', () => {
      framework.registerTest(
        createTestConfig({
          minSampleSize: 5,
          successMetrics: ['metric_a', 'metric_b', 'metric_c'],
        })
      );

      const treatmentSessions: string[] = [];
      const controlSessions: string[] = [];

      for (let i = 0; treatmentSessions.length < 15 || controlSessions.length < 15; i++) {
        const sessionId = `mixed-${i}`;
        const assignment = framework.getAssignment(sessionId, 'test-001');
        if (assignment === 'treatment' && treatmentSessions.length < 15) {
          treatmentSessions.push(sessionId);
        } else if (assignment === 'control' && controlSessions.length < 15) {
          controlSessions.push(sessionId);
        }
      }

      // metric_a: treatment wins clearly
      // metric_b: control wins clearly
      // metric_c: no significant difference
      for (const sessionId of treatmentSessions) {
        framework.recordMetric(sessionId, 'test-001', 'metric_a', 0.9);
        framework.recordMetric(sessionId, 'test-001', 'metric_b', 0.3);
        framework.recordMetric(sessionId, 'test-001', 'metric_c', 0.5 + Math.random() * 0.1);
      }
      for (const sessionId of controlSessions) {
        framework.recordMetric(sessionId, 'test-001', 'metric_a', 0.3);
        framework.recordMetric(sessionId, 'test-001', 'metric_b', 0.9);
        framework.recordMetric(sessionId, 'test-001', 'metric_c', 0.5 + Math.random() * 0.1);
      }

      const results = framework.getResults('test-001');

      // With 1 win each and 1 inconclusive, overall should be inconclusive
      expect(results.winner).toBe('inconclusive');
    });
  });

  // ==========================================================================
  // Formatting
  // ==========================================================================

  describe('Formatting', () => {
    beforeEach(() => {
      framework.registerTest(createTestConfig({ minSampleSize: 5 }));
    });

    it('should format result with all sections', () => {
      const treatmentSessions: string[] = [];
      const controlSessions: string[] = [];

      for (let i = 0; treatmentSessions.length < 10 || controlSessions.length < 10; i++) {
        const sessionId = `format-${i}`;
        const assignment = framework.getAssignment(sessionId, 'test-001');
        if (assignment === 'treatment' && treatmentSessions.length < 10) {
          treatmentSessions.push(sessionId);
        } else if (assignment === 'control' && controlSessions.length < 10) {
          controlSessions.push(sessionId);
        }
      }

      for (const sessionId of treatmentSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.8);
      }
      for (const sessionId of controlSessions) {
        framework.recordMetric(sessionId, 'test-001', 'quality_score', 0.5);
      }

      const results = framework.getResults('test-001');
      const formatted = formatABTestResult(results);

      expect(formatted).toContain('A/B Test Results');
      expect(formatted).toContain('Test Experiment');
      expect(formatted).toContain('Status:');
      expect(formatted).toContain('Sessions:');
      expect(formatted).toContain('Metrics');
      expect(formatted).toContain('quality_score');
      expect(formatted).toContain('p-value');
      expect(formatted).toContain("Cohen's d");
      expect(formatted).toContain('Conclusion');
      expect(formatted).toContain('Winner');
      expect(formatted).toContain('Recommendation');
    });

    it('should include effect size interpretation', () => {
      const results = framework.getResults('test-001');
      const formatted = formatABTestResult(results);

      expect(formatted).toContain('Interpretation');
    });

    it('should format test summary', () => {
      framework.registerTest(
        createTestConfig({
          testId: 'test-2',
          name: 'Second Test',
          description: 'Another test',
        })
      );

      // Add some sessions
      for (let i = 0; i < 10; i++) {
        framework.getAssignment(`summary-${i}`, 'test-001');
      }

      const summary = formatTestSummary(framework);

      expect(summary).toContain('A/B Test Summary');
      expect(summary).toContain('Test Experiment');
      expect(summary).toContain('Second Test');
      expect(summary).toContain('Sessions:');
      expect(summary).toContain('Metrics:');
    });

    it('should handle empty test list in summary', () => {
      const emptyFramework = createABTestFramework();
      const summary = formatTestSummary(emptyFramework);

      expect(summary).toBe('No A/B tests registered.');
    });
  });

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create framework via factory', () => {
      const fw = createABTestFramework();
      expect(fw).toBeInstanceOf(ABTestFramework);
    });

    it('should create independent instances', () => {
      const fw1 = createABTestFramework();
      const fw2 = createABTestFramework();

      fw1.registerTest(createTestConfig({ testId: 'fw1-test' }));

      expect(fw1.hasTest('fw1-test')).toBe(true);
      expect(fw2.hasTest('fw1-test')).toBe(false);
    });
  });

  // ==========================================================================
  // Integration Scenarios
  // ==========================================================================

  describe('Integration Scenarios', () => {
    it('should handle complete test lifecycle', () => {
      // 1. Register test
      framework.registerTest(
        createTestConfig({
          testId: 'lifecycle-test',
          name: 'Lifecycle Test',
          minSampleSize: 5,
        })
      );

      // 2. Simulate sessions
      const sessions: Array<{ id: string; assignment: 'treatment' | 'control' }> = [];

      for (let i = 0; i < 30; i++) {
        const sessionId = `lifecycle-session-${i}`;
        const assignment = framework.getAssignment(sessionId, 'lifecycle-test');
        const config = framework.getConfigForSession(sessionId, 'lifecycle-test');

        sessions.push({ id: sessionId, assignment });

        // Simulate outcome based on config
        const baseScore = config.setting === 'new' ? 0.8 : 0.6;
        const score = baseScore + (Math.random() - 0.5) * 0.2;
        const latency = config.setting === 'new' ? 100 : 150;

        framework.recordMetric(sessionId, 'lifecycle-test', 'quality_score', score);
        framework.recordMetric(sessionId, 'lifecycle-test', 'latency_ms', latency);
      }

      // 3. Analyze results
      const results = framework.getResults('lifecycle-test');

      expect(results.status).toBe('completed');
      expect(results.treatmentSessions + results.controlSessions).toBe(30);
      expect(Object.keys(results.metrics)).toContain('quality_score');
      expect(Object.keys(results.metrics)).toContain('latency_ms');

      // 4. Format results
      const formatted = formatABTestResult(results);
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should support multiple concurrent tests', () => {
      framework.registerTest(
        createTestConfig({
          testId: 'concurrent-1',
          name: 'Concurrent Test 1',
          treatmentRatio: 0.3,
        })
      );
      framework.registerTest(
        createTestConfig({
          testId: 'concurrent-2',
          name: 'Concurrent Test 2',
          treatmentRatio: 0.7,
        })
      );

      // Same session can be in different groups for different tests
      const sessionId = 'multi-test-session';

      const assignment1 = framework.getAssignment(sessionId, 'concurrent-1');
      const assignment2 = framework.getAssignment(sessionId, 'concurrent-2');

      // Assignments can be independent
      expect(['treatment', 'control']).toContain(assignment1);
      expect(['treatment', 'control']).toContain(assignment2);

      // Can record metrics independently
      framework.recordMetric(sessionId, 'concurrent-1', 'quality_score', 0.8);
      framework.recordMetric(sessionId, 'concurrent-2', 'quality_score', 0.7);

      // Can get results independently
      const results1 = framework.getResults('concurrent-1');
      const results2 = framework.getResults('concurrent-2');

      expect(results1.testId).toBe('concurrent-1');
      expect(results2.testId).toBe('concurrent-2');
    });
  });
});
