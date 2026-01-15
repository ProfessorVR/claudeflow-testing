/**
 * Experiment Manager Tests
 *
 * Tests for Phase 6.2: A/B Testing Experiment Management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExperimentManager,
  getExperimentManager,
  initializeExperimentManager,
  resetExperimentManager,
  createQuickTest,
  formatExperimentStatus,
  formatExperimentSummary,
} from '../../../../../src/god-agent/core/router/ab-testing/experiment-manager.js';
import { resetStatisticalAnalyzer } from '../../../../../src/god-agent/core/router/ab-testing/statistical-analyzer.js';
import type {
  CreateExperimentInput,
  ModelOutcome,
} from '../../../../../src/god-agent/core/router/ab-testing/types.js';

// Helper to create model outcome
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

describe('ExperimentManager', () => {
  let manager: ExperimentManager;

  beforeEach(() => {
    resetExperimentManager();
    resetStatisticalAnalyzer();
    manager = new ExperimentManager();
  });

  afterEach(() => {
    resetExperimentManager();
    resetStatisticalAnalyzer();
  });

  describe('Initialization', () => {
    it('should create manager with default config', () => {
      expect(manager).toBeDefined();
    });

    it('should accept custom config', () => {
      const customManager = new ExperimentManager({
        maxExperiments: 50,
        autoComplete: false,
      });
      expect(customManager).toBeDefined();
    });

    it('should use singleton pattern', () => {
      resetExperimentManager();
      const instance1 = getExperimentManager();
      const instance2 = getExperimentManager();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with config', () => {
      resetExperimentManager();
      const instance = initializeExperimentManager({ maxExperiments: 10 });
      expect(instance).toBeDefined();
    });
  });

  describe('Experiment Creation', () => {
    it('should create experiment with required fields', () => {
      const input: CreateExperimentInput = {
        name: 'Test Experiment',
        modelA: 'claude-opus',
        modelB: 'local-awq',
      };

      const state = manager.createExperiment(input);

      expect(state.config.name).toBe('Test Experiment');
      expect(state.config.modelA).toBe('claude-opus');
      expect(state.config.modelB).toBe('local-awq');
      expect(state.status).toBe('draft');
    });

    it('should create experiment with optional fields', () => {
      const input: CreateExperimentInput = {
        name: 'Full Test',
        modelA: 'model-a',
        modelB: 'model-b',
        description: 'A detailed description',
        taskTypes: ['code_edit', 'code_write'],
        complexities: ['medium', 'complex'],
        samplingRate: 50,
        minSamplesPerModel: 100,
        maxSamples: 500,
        significanceLevel: 0.01,
        tags: ['test', 'production'],
      };

      const state = manager.createExperiment(input);

      expect(state.config.description).toBe('A detailed description');
      expect(state.config.taskTypes).toContain('code_edit');
      expect(state.config.samplingRate).toBe(50);
      expect(state.config.minSamplesPerModel).toBe(100);
      expect(state.config.significanceLevel).toBe(0.01);
    });

    it('should assign unique ID', () => {
      const exp1 = manager.createExperiment({
        name: 'Exp 1',
        modelA: 'a',
        modelB: 'b',
      });
      const exp2 = manager.createExperiment({
        name: 'Exp 2',
        modelA: 'a',
        modelB: 'b',
      });

      expect(exp1.config.id).not.toBe(exp2.config.id);
    });

    it('should use createQuickTest helper', () => {
      resetExperimentManager();
      const state = createQuickTest('Quick Test', 'model-a', 'model-b', 100);

      expect(state.config.name).toBe('Quick Test');
      expect(state.config.maxSamples).toBe(100);
    });
  });

  describe('Experiment Lifecycle', () => {
    let experimentId: string;

    beforeEach(() => {
      const state = manager.createExperiment({
        name: 'Lifecycle Test',
        modelA: 'model-a',
        modelB: 'model-b',
      });
      experimentId = state.config.id;
    });

    it('should start experiment from draft', () => {
      const state = manager.startExperiment(experimentId);

      expect(state.status).toBe('running');
      expect(state.config.startedAt).toBeDefined();
    });

    it('should pause running experiment', () => {
      manager.startExperiment(experimentId);
      const state = manager.pauseExperiment(experimentId);

      expect(state.status).toBe('paused');
    });

    it('should resume paused experiment', () => {
      manager.startExperiment(experimentId);
      manager.pauseExperiment(experimentId);
      const state = manager.resumeExperiment(experimentId);

      expect(state.status).toBe('running');
    });

    it('should cancel experiment', () => {
      manager.startExperiment(experimentId);
      const state = manager.cancelExperiment(experimentId, 'Test cancellation');

      expect(state.status).toBe('cancelled');
      expect(state.lastError).toBe('Test cancellation');
    });

    it('should complete experiment', () => {
      manager.startExperiment(experimentId);

      // Add some outcomes
      for (let i = 0; i < 10; i++) {
        manager.recordOutcome(
          experimentId,
          'Test prompt',
          'code_edit',
          'medium',
          createModelOutcome({ model: 'model-a', success: true }),
          createModelOutcome({ model: 'model-b', success: i < 5 })
        );
      }

      const results = manager.completeExperiment(experimentId);

      expect(results).toBeDefined();
      expect(results.experimentId).toBe(experimentId);
      const state = manager.getExperimentState(experimentId);
      expect(state?.status).toBe('completed');
    });

    it('should delete experiment', () => {
      const deleted = manager.deleteExperiment(experimentId);
      expect(deleted).toBe(true);
      expect(manager.getExperiment(experimentId)).toBeNull();
    });

    it('should throw error for invalid state transitions', () => {
      // Can't pause draft
      expect(() => manager.pauseExperiment(experimentId)).toThrow();

      // Can't cancel completed
      manager.startExperiment(experimentId);
      manager.completeExperiment(experimentId);
      expect(() => manager.cancelExperiment(experimentId)).toThrow();
    });

    it('should throw error for non-existent experiment', () => {
      expect(() => manager.startExperiment('non-existent')).toThrow();
    });
  });

  describe('Task Assignment', () => {
    let experimentId: string;

    beforeEach(() => {
      const state = manager.createExperiment({
        name: 'Assignment Test',
        modelA: 'model-a',
        modelB: 'model-b',
        taskTypes: ['code_edit'],
        complexities: ['medium'],
        samplingRate: 100,
      });
      experimentId = state.config.id;
      manager.startExperiment(experimentId);
    });

    it('should include matching tasks', () => {
      const shouldInclude = manager.shouldIncludeTask(
        experimentId,
        'code_edit',
        'medium'
      );
      expect(shouldInclude).toBe(true);
    });

    it('should exclude non-matching task types', () => {
      const shouldInclude = manager.shouldIncludeTask(
        experimentId,
        'code_write',
        'medium'
      );
      expect(shouldInclude).toBe(false);
    });

    it('should exclude non-matching complexity', () => {
      const shouldInclude = manager.shouldIncludeTask(
        experimentId,
        'code_edit',
        'complex'
      );
      expect(shouldInclude).toBe(false);
    });

    it('should not include tasks for non-running experiments', () => {
      manager.pauseExperiment(experimentId);
      const shouldInclude = manager.shouldIncludeTask(
        experimentId,
        'code_edit',
        'medium'
      );
      expect(shouldInclude).toBe(false);
    });

    it('should assign models randomly', () => {
      const assignments = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const assignment = manager.assignModel(experimentId);
        if (assignment) assignments.add(assignment);
      }
      // Should have both model_a and model_b assignments
      expect(assignments.has('model_a')).toBe(true);
      expect(assignments.has('model_b')).toBe(true);
    });

    it('should get model ID for assignment', () => {
      const modelA = manager.getModelId(experimentId, 'model_a');
      const modelB = manager.getModelId(experimentId, 'model_b');

      expect(modelA).toBe('model-a');
      expect(modelB).toBe('model-b');
    });

    it('should respect sampling rate', () => {
      // Create experiment with low sampling rate
      const lowSampleState = manager.createExperiment({
        name: 'Low Sample',
        modelA: 'a',
        modelB: 'b',
        samplingRate: 10, // 10% sampling
      });
      manager.startExperiment(lowSampleState.config.id);

      let included = 0;
      for (let i = 0; i < 1000; i++) {
        if (manager.shouldIncludeTask(lowSampleState.config.id, 'code_edit', 'medium')) {
          included++;
        }
      }

      // Should be roughly 10% (with some variance)
      expect(included).toBeGreaterThan(50);
      expect(included).toBeLessThan(200);
    });
  });

  describe('Outcome Recording', () => {
    let experimentId: string;

    beforeEach(() => {
      const state = manager.createExperiment({
        name: 'Outcome Test',
        modelA: 'model-a',
        modelB: 'model-b',
      });
      experimentId = state.config.id;
      manager.startExperiment(experimentId);
    });

    it('should record paired outcome', () => {
      const outcome = manager.recordOutcome(
        experimentId,
        'Test prompt',
        'code_edit',
        'medium',
        createModelOutcome({ model: 'model-a', success: true, userRating: 5 }),
        createModelOutcome({ model: 'model-b', success: false, userRating: 2 })
      );

      expect(outcome.id).toBeDefined();
      expect(outcome.experimentId).toBe(experimentId);
      expect(outcome.taskType).toBe('code_edit');
    });

    it('should determine winner correctly', () => {
      const outcome = manager.recordOutcome(
        experimentId,
        'Test',
        'code_edit',
        'medium',
        createModelOutcome({ success: true, userRating: 5, userAccepted: true }),
        createModelOutcome({ success: false, userRating: 1, userAccepted: false })
      );

      expect(outcome.winner).toBe('model_a');
    });

    it('should calculate deltas', () => {
      const outcome = manager.recordOutcome(
        experimentId,
        'Test',
        'code_edit',
        'medium',
        createModelOutcome({ latencyMs: 500, cost: 0.01 }),
        createModelOutcome({ latencyMs: 1000, cost: 0.05 })
      );

      expect(outcome.latencyDelta).toBe(-500);
      expect(outcome.costDelta).toBeCloseTo(-0.04);
    });

    it('should update sample counters', () => {
      const stateBefore = manager.getExperimentState(experimentId);
      expect(stateBefore?.modelASamples).toBe(0);
      expect(stateBefore?.modelBSamples).toBe(0);

      manager.recordOutcome(
        experimentId,
        'Test',
        'code_edit',
        'medium',
        createModelOutcome(),
        createModelOutcome()
      );

      const stateAfter = manager.getExperimentState(experimentId);
      expect(stateAfter?.modelASamples).toBe(1);
      expect(stateAfter?.modelBSamples).toBe(1);
    });

    it('should record single outcome', () => {
      manager.recordSingleOutcome(
        experimentId,
        'model_a',
        'Test',
        'code_edit',
        'medium',
        createModelOutcome()
      );

      const state = manager.getExperimentState(experimentId);
      expect(state?.modelASamples).toBe(1);
      expect(state?.modelBSamples).toBe(0);
    });

    it('should retrieve outcomes', () => {
      for (let i = 0; i < 5; i++) {
        manager.recordOutcome(
          experimentId,
          `Test ${i}`,
          'code_edit',
          'medium',
          createModelOutcome(),
          createModelOutcome()
        );
      }

      const outcomes = manager.getOutcomes(experimentId);
      expect(outcomes).toHaveLength(5);
    });
  });

  describe('Queries', () => {
    beforeEach(() => {
      // Create multiple experiments
      for (let i = 0; i < 5; i++) {
        const state = manager.createExperiment({
          name: `Exp ${i}`,
          modelA: 'model-a',
          modelB: 'model-b',
          tags: i % 2 === 0 ? ['even'] : ['odd'],
        });
        if (i < 3) {
          manager.startExperiment(state.config.id);
        }
        if (i === 0) {
          manager.completeExperiment(state.config.id);
        }
      }
    });

    it('should get all experiments', () => {
      const all = manager.getAllExperiments();
      expect(all).toHaveLength(5);
    });

    it('should query by status', () => {
      const running = manager.queryExperiments({ status: ['running'] });
      expect(running).toHaveLength(2);
    });

    it('should query by tags', () => {
      const even = manager.queryExperiments({ tags: ['even'] });
      expect(even).toHaveLength(3);
    });

    it('should get running experiments', () => {
      const running = manager.getRunningExperiments();
      expect(running).toHaveLength(2);
    });

    it('should paginate results', () => {
      const page1 = manager.queryExperiments({ limit: 2, offset: 0 });
      const page2 = manager.queryExperiments({ limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });
  });

  describe('Results and Summaries', () => {
    let experimentId: string;

    beforeEach(() => {
      const state = manager.createExperiment({
        name: 'Summary Test',
        modelA: 'model-a',
        modelB: 'model-b',
        maxSamples: 20,
      });
      experimentId = state.config.id;
      manager.startExperiment(experimentId);

      // Add outcomes
      for (let i = 0; i < 10; i++) {
        manager.recordOutcome(
          experimentId,
          `Prompt ${i}`,
          'code_edit',
          'medium',
          createModelOutcome({ success: true, userRating: 4 }),
          createModelOutcome({ success: i % 2 === 0, userRating: 3 })
        );
      }
    });

    it('should get results for running experiment', () => {
      const results = manager.getResults(experimentId);

      expect(results).toBeDefined();
      expect(results?.experimentId).toBe(experimentId);
    });

    it('should get experiment summary', () => {
      const summary = manager.getSummary(experimentId);

      expect(summary).toBeDefined();
      expect(summary?.name).toBe('Summary Test');
      expect(summary?.totalSamples).toBe(20);
      expect(summary?.progress).toBeGreaterThan(0);
    });

    it('should get all summaries', () => {
      const summaries = manager.getAllSummaries();
      expect(summaries.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent experiment', () => {
      expect(manager.getResults('non-existent')).toBeNull();
      expect(manager.getSummary('non-existent')).toBeNull();
    });
  });

  describe('Events', () => {
    it('should emit experiment created event', () => {
      const events: any[] = [];
      manager.on((event) => events.push(event));

      manager.createExperiment({
        name: 'Event Test',
        modelA: 'a',
        modelB: 'b',
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('experiment_created');
    });

    it('should emit lifecycle events', () => {
      const events: any[] = [];
      manager.on((event) => events.push(event));

      const state = manager.createExperiment({
        name: 'Event Test',
        modelA: 'a',
        modelB: 'b',
      });

      manager.startExperiment(state.config.id);
      manager.pauseExperiment(state.config.id);
      manager.resumeExperiment(state.config.id);
      manager.completeExperiment(state.config.id);

      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain('experiment_created');
      expect(eventTypes).toContain('experiment_started');
      expect(eventTypes).toContain('experiment_paused');
      expect(eventTypes).toContain('experiment_completed');
    });

    it('should emit sample recorded event', () => {
      const events: any[] = [];
      manager.on((event) => events.push(event));

      const state = manager.createExperiment({
        name: 'Event Test',
        modelA: 'a',
        modelB: 'b',
      });
      manager.startExperiment(state.config.id);

      manager.recordOutcome(
        state.config.id,
        'Test',
        'code_edit',
        'medium',
        createModelOutcome(),
        createModelOutcome()
      );

      const sampleEvents = events.filter((e) => e.type === 'sample_recorded');
      expect(sampleEvents).toHaveLength(1);
    });

    it('should unsubscribe from events', () => {
      const events: any[] = [];
      const unsubscribe = manager.on((event) => events.push(event));

      manager.createExperiment({ name: 'Test 1', modelA: 'a', modelB: 'b' });
      expect(events).toHaveLength(1);

      unsubscribe();

      manager.createExperiment({ name: 'Test 2', modelA: 'a', modelB: 'b' });
      expect(events).toHaveLength(1); // No new events
    });
  });

  describe('Auto-Completion', () => {
    it('should auto-complete when max samples reached', () => {
      const manager = new ExperimentManager({ autoComplete: true });
      const state = manager.createExperiment({
        name: 'Auto Complete Test',
        modelA: 'a',
        modelB: 'b',
        maxSamples: 5,
      });
      manager.startExperiment(state.config.id);

      for (let i = 0; i < 5; i++) {
        manager.recordOutcome(
          state.config.id,
          `Test ${i}`,
          'code_edit',
          'medium',
          createModelOutcome(),
          createModelOutcome()
        );
      }

      const finalState = manager.getExperimentState(state.config.id);
      expect(finalState?.status).toBe('completed');
    });

    it('should not auto-complete when disabled', () => {
      const manager = new ExperimentManager({ autoComplete: false });
      const state = manager.createExperiment({
        name: 'No Auto Complete',
        modelA: 'a',
        modelB: 'b',
        maxSamples: 5,
      });
      manager.startExperiment(state.config.id);

      for (let i = 0; i < 5; i++) {
        manager.recordOutcome(
          state.config.id,
          `Test ${i}`,
          'code_edit',
          'medium',
          createModelOutcome(),
          createModelOutcome()
        );
      }

      const finalState = manager.getExperimentState(state.config.id);
      expect(finalState?.status).toBe('running');
    });
  });

  describe('Formatting', () => {
    it('should format experiment status', () => {
      const state = manager.createExperiment({
        name: 'Format Test',
        modelA: 'claude',
        modelB: 'local',
      });

      const formatted = formatExperimentStatus(state);

      expect(formatted).toContain('Format Test');
      expect(formatted).toContain('claude');
      expect(formatted).toContain('local');
      expect(formatted).toContain('draft');
    });

    it('should format experiment summary', () => {
      const state = manager.createExperiment({
        name: 'Summary Format',
        modelA: 'model-a',
        modelB: 'model-b',
      });
      manager.startExperiment(state.config.id);

      const summary = manager.getSummary(state.config.id);
      const formatted = formatExperimentSummary(summary!);

      expect(formatted).toContain('Summary Format');
      expect(formatted).toContain('running');
      expect(formatted).toContain('model-a');
      expect(formatted).toContain('model-b');
    });
  });
});
