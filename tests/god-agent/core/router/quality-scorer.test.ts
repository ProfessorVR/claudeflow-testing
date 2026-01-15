/**
 * Quality Scorer Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Quality Tracking Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  QualityScorer,
  getQualityScorer,
  initializeQualityScorer,
  resetQualityScorer,
} from '../../../../src/god-agent/core/router/quality-scorer.js';
import type { QualityScoreInput } from '../../../../src/god-agent/core/router/quality-scorer.js';

// Helper to create a quality score input
function createScoreInput(overrides: Partial<QualityScoreInput> = {}): QualityScoreInput {
  return {
    model: 'gpt-4o',
    provider: 'openai',
    taskType: 'code_edit',
    complexity: 'medium',
    responseTime: 2000,
    tokensUsed: 1500,
    userAccepted: true,
    userReverted: false,
    ...overrides,
  };
}

describe('QualityScorer', () => {
  let scorer: QualityScorer;

  beforeEach(() => {
    resetQualityScorer();
    scorer = new QualityScorer({ enabled: true, minSamplesForStats: 3 });
  });

  afterEach(() => {
    resetQualityScorer();
  });

  describe('Configuration', () => {
    it('should report enabled status', () => {
      expect(scorer.isEnabled()).toBe(true);

      const disabled = new QualityScorer({ enabled: false });
      expect(disabled.isEnabled()).toBe(false);
    });

    it('should get min samples for stats', () => {
      expect(scorer.getMinSamplesForStats()).toBe(3);
    });
  });

  describe('Recording', () => {
    it('should record quality score', () => {
      const score = scorer.recordScore(createScoreInput());

      expect(score.id).toBeDefined();
      expect(score.model).toBe('gpt-4o');
      expect(score.provider).toBe('openai');
      expect(score.userAccepted).toBe(true);
    });

    it('should record with user rating', () => {
      const score = scorer.recordScore(createScoreInput({ userRating: 4 }));

      expect(score.userRating).toBe(4);
    });

    it('should record with test results', () => {
      const score = scorer.recordScore(createScoreInput({
        testsPass: true,
        lintErrors: 0,
        buildSuccess: true,
      }));

      expect(score.testsPass).toBe(true);
      expect(score.lintErrors).toBe(0);
      expect(score.buildSuccess).toBe(true);
    });

    it('should retrieve score by ID', () => {
      const score = scorer.recordScore(createScoreInput());

      const retrieved = scorer.getScore(score.id);
      expect(retrieved).toEqual(score);
    });

    it('should update score', () => {
      const score = scorer.recordScore(createScoreInput());

      const updated = scorer.updateScore(score.id, {
        userRating: 5,
        testsPass: true,
      });

      expect(updated?.userRating).toBe(5);
      expect(updated?.testsPass).toBe(true);
    });

    it('should return null when updating non-existent score', () => {
      const result = scorer.updateScore('non-existent', { userRating: 5 });
      expect(result).toBeNull();
    });

    it('should get all scores', () => {
      scorer.recordScore(createScoreInput());
      scorer.recordScore(createScoreInput({ model: 'claude' }));

      expect(scorer.getAllScores()).toHaveLength(2);
    });

    it('should get scores for model', () => {
      scorer.recordScore(createScoreInput({ model: 'gpt-4o' }));
      scorer.recordScore(createScoreInput({ model: 'gpt-4o' }));
      scorer.recordScore(createScoreInput({ model: 'claude' }));

      expect(scorer.getScoresForModel('gpt-4o')).toHaveLength(2);
    });

    it('should get recent scores', () => {
      for (let i = 0; i < 10; i++) {
        scorer.recordScore(createScoreInput({ model: `model-${i}` }));
      }

      expect(scorer.getRecentScores(5)).toHaveLength(5);
    });

    it('should clear all scores', () => {
      scorer.recordScore(createScoreInput());
      scorer.clear();

      expect(scorer.getAllScores()).toHaveLength(0);
    });

    it('should trim old scores when over limit', () => {
      const smallScorer = new QualityScorer({ maxScores: 3 });

      for (let i = 0; i < 5; i++) {
        smallScorer.recordScore(createScoreInput({ model: `model-${i}` }));
      }

      expect(smallScorer.getAllScores()).toHaveLength(3);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Create enough samples for stats
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', userRating: 4, userAccepted: true }));
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', userRating: 5, userAccepted: true }));
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', userRating: 3, userAccepted: false, userReverted: true }));
    });

    it('should return null for insufficient samples', () => {
      const stats = scorer.getModelStats('claude');
      expect(stats).toBeNull();
    });

    it('should calculate average rating', () => {
      const stats = scorer.getModelStats('gpt-4o');

      expect(stats).not.toBeNull();
      expect(stats?.averageRating).toBe(4);
    });

    it('should calculate acceptance rate', () => {
      const stats = scorer.getModelStats('gpt-4o');

      expect(stats?.acceptanceRate).toBeCloseTo(0.667, 2);
    });

    it('should calculate revert rate', () => {
      const stats = scorer.getModelStats('gpt-4o');

      expect(stats?.revertRate).toBeCloseTo(0.333, 2);
    });

    it('should calculate test pass rate', () => {
      scorer.updateScore(scorer.getAllScores()[0].id, { testsPass: true });
      scorer.updateScore(scorer.getAllScores()[1].id, { testsPass: true });
      scorer.updateScore(scorer.getAllScores()[2].id, { testsPass: false });

      const stats = scorer.getModelStats('gpt-4o');
      expect(stats?.testPassRate).toBeCloseTo(0.667, 2);
    });

    it('should calculate average response time', () => {
      const stats = scorer.getModelStats('gpt-4o');

      expect(stats?.averageResponseTime).toBe(2000);
    });

    it('should include sample count', () => {
      const stats = scorer.getModelStats('gpt-4o');

      expect(stats?.sampleCount).toBe(3);
    });

    it('should get all model stats', () => {
      scorer.recordScore(createScoreInput({ model: 'claude' }));
      scorer.recordScore(createScoreInput({ model: 'claude' }));
      scorer.recordScore(createScoreInput({ model: 'claude' }));

      const allStats = scorer.getAllModelStats();
      expect(allStats.size).toBe(2);
      expect(allStats.has('gpt-4o')).toBe(true);
      expect(allStats.has('claude')).toBe(true);
    });

    it('should calculate stats by task type', () => {
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', taskType: 'reasoning', userRating: 5 }));
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', taskType: 'reasoning', userRating: 5 }));
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', taskType: 'reasoning', userRating: 5 }));

      const stats = scorer.getModelStats('gpt-4o');
      expect(stats?.byTaskType['reasoning']).toBeDefined();
      expect(stats?.byTaskType['reasoning'].sampleCount).toBe(3);
    });

    it('should calculate stats by complexity', () => {
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', complexity: 'complex', userRating: 2 }));
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', complexity: 'complex', userRating: 3 }));
      scorer.recordScore(createScoreInput({ model: 'gpt-4o', complexity: 'complex', userRating: 2 }));

      const stats = scorer.getModelStats('gpt-4o');
      expect(stats?.byComplexity['complex']).toBeDefined();
      expect(stats?.byComplexity['complex'].sampleCount).toBe(3);
    });
  });

  describe('Ranking and Recommendations', () => {
    beforeEach(() => {
      // gpt-4o with good scores
      for (let i = 0; i < 5; i++) {
        scorer.recordScore(createScoreInput({
          model: 'gpt-4o',
          userRating: 5,
          userAccepted: true,
          responseTime: 1000,
        }));
      }

      // claude with medium scores
      for (let i = 0; i < 5; i++) {
        scorer.recordScore(createScoreInput({
          model: 'claude',
          provider: 'anthropic',
          userRating: 3,
          userAccepted: true,
          responseTime: 2000,
        }));
      }

      // deepseek with lower scores
      for (let i = 0; i < 5; i++) {
        scorer.recordScore(createScoreInput({
          model: 'deepseek',
          provider: 'ollama',
          userRating: 2,
          userAccepted: false,
          responseTime: 3000,
        }));
      }
    });

    it('should rank models by quality', () => {
      const ranked = scorer.getRankedModels();

      expect(ranked[0]).toBe('gpt-4o');
      expect(ranked[1]).toBe('claude');
      expect(ranked[2]).toBe('deepseek');
    });

    it('should recommend model for task', () => {
      const recommended = scorer.getRecommendedModel('code_edit', 'medium');
      expect(recommended).toBe('gpt-4o');
    });

    it('should return null when no models available', () => {
      const emptyScorer = new QualityScorer();
      const recommended = emptyScorer.getRecommendedModel('code_edit', 'medium');
      expect(recommended).toBeNull();
    });

    it('should check if model is performing well', () => {
      expect(scorer.isModelPerformingWell('gpt-4o', 0.5)).toBe(true);
      expect(scorer.isModelPerformingWell('deepseek', 0.5)).toBe(false);
    });

    it('should identify underperforming models', () => {
      const underperforming = scorer.getUnderperformingModels(0.5);

      expect(underperforming).toContain('deepseek');
      expect(underperforming).not.toContain('gpt-4o');
    });
  });

  describe('Composite Score', () => {
    it('should calculate composite score', () => {
      for (let i = 0; i < 5; i++) {
        scorer.recordScore(createScoreInput({
          model: 'test-model',
          userRating: 5,
          userAccepted: true,
          testsPass: true,
          responseTime: 1000,
        }));
      }

      const stats = scorer.getModelStats('test-model');
      expect(stats).not.toBeNull();

      const composite = scorer.calculateCompositeScore(stats!);
      expect(composite).toBeGreaterThan(0);
      expect(composite).toBeLessThanOrEqual(1);
    });

    it('should penalize poor complexity performance', () => {
      for (let i = 0; i < 5; i++) {
        scorer.recordScore(createScoreInput({
          model: 'weak-model',
          complexity: 'complex',
          userRating: 2,
          userAccepted: false,
          responseTime: 5000,
        }));
      }

      const stats = scorer.getModelStats('weak-model');
      const composite = scorer.calculateCompositeScore(stats!, 'code_edit', 'complex');

      expect(composite).toBeLessThan(0.5);
    });
  });

  describe('Events', () => {
    it('should emit quality_recorded event', () => {
      const handler = vi.fn();
      scorer.on('quality_recorded', handler);

      scorer.recordScore(createScoreInput());

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('quality_recorded');
    });

    it('should remove event handler', () => {
      const handler = vi.fn();
      scorer.on('quality_recorded', handler);
      scorer.off('quality_recorded', handler);

      scorer.recordScore(createScoreInput());

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Reporting', () => {
    it('should format report when no data', () => {
      const report = scorer.formatReport();
      expect(report).toContain('Quality Report');
      expect(report).toContain('No model statistics available');
    });

    it('should format report with data', () => {
      for (let i = 0; i < 5; i++) {
        scorer.recordScore(createScoreInput({ userRating: 4 }));
      }

      const report = scorer.formatReport();
      expect(report).toContain('gpt-4o');
      expect(report).toContain('Average Rating');
      expect(report).toContain('Acceptance Rate');
    });
  });

  describe('Export/Import', () => {
    it('should export to JSON', () => {
      scorer.recordScore(createScoreInput());

      const json = scorer.exportToJson();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].model).toBe('gpt-4o');
    });

    it('should import from JSON', () => {
      scorer.recordScore(createScoreInput());
      const json = scorer.exportToJson();

      scorer.clear();
      const imported = scorer.importFromJson(json);

      expect(imported).toBe(1);
      expect(scorer.getAllScores()).toHaveLength(1);
    });
  });
});

describe('Singleton Pattern', () => {
  beforeEach(() => {
    resetQualityScorer();
  });

  afterEach(() => {
    resetQualityScorer();
  });

  it('should return same instance', () => {
    const scorer1 = getQualityScorer();
    const scorer2 = getQualityScorer();
    expect(scorer1).toBe(scorer2);
  });

  it('should reset singleton', () => {
    const scorer1 = getQualityScorer();
    resetQualityScorer();
    const scorer2 = getQualityScorer();
    expect(scorer1).not.toBe(scorer2);
  });

  it('should initialize with config', () => {
    const scorer = initializeQualityScorer({ minSamplesForStats: 10 });
    expect(scorer.getMinSamplesForStats()).toBe(10);
  });
});
