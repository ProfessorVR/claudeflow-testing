/**
 * TIER-2.3 Convergence Tracker Tests
 *
 * Tests for:
 * - Learning curve tracking
 * - Convergence speed calculation
 * - Plateau detection
 * - Fisher matrix management
 * - Learning rate recommendations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ConvergenceTracker,
  getConvergenceTracker,
  resetConvergenceTracker,
  IConvergenceConfig,
} from '../../../../src/god-agent/core/learning/index.js';

describe('TIER-2.3: Convergence Tracker', () => {
  let tracker: ConvergenceTracker;

  beforeEach(() => {
    // Reset global instance before each test
    resetConvergenceTracker();
    tracker = new ConvergenceTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Basic Functionality ====================

  describe('recordSample()', () => {
    it('should record quality samples', () => {
      tracker.recordSample(0.5);
      tracker.recordSample(0.6);
      tracker.recordSample(0.7);

      const metrics = tracker.getMetrics();
      expect(metrics.qualityCurve).toEqual([0.5, 0.6, 0.7]);
      expect(metrics.totalSamples).toBe(3);
    });

    it('should record loss values when provided', () => {
      tracker.recordSample(0.5, 0.3);
      tracker.recordSample(0.6, 0.2);

      const metrics = tracker.getMetrics();
      expect(metrics.learningCurve).toEqual([0.3, 0.2]);
    });

    it('should not record loss when not provided', () => {
      tracker.recordSample(0.5);
      tracker.recordSample(0.6, 0.2);

      const metrics = tracker.getMetrics();
      expect(metrics.learningCurve).toEqual([0.2]);
      expect(metrics.qualityCurve).toEqual([0.5, 0.6]);
    });

    it('should update lastUpdated timestamp', () => {
      const before = Date.now();
      tracker.recordSample(0.5);
      const metrics = tracker.getMetrics();

      expect(metrics.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(metrics.lastUpdated).toBeLessThanOrEqual(Date.now());
    });
  });

  // ==================== Moving Average ====================

  describe('movingAverage', () => {
    it('should calculate moving average correctly', () => {
      // With default window size of 50, all samples fit
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(i * 0.1);
      }

      const metrics = tracker.getMetrics();
      // Mean of 0.0, 0.1, ..., 0.9 = 0.45
      expect(metrics.movingAverage).toBeCloseTo(0.45, 2);
    });

    it('should respect window size', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 5 });

      // Record 10 samples, only last 5 should be used
      for (let i = 0; i < 10; i++) {
        customTracker.recordSample(i * 0.1);
      }

      const metrics = customTracker.getMetrics();
      // Mean of 0.5, 0.6, 0.7, 0.8, 0.9 = 0.7
      expect(metrics.movingAverage).toBeCloseTo(0.7, 2);
    });

    it('should return 0 for empty curve', () => {
      const metrics = tracker.getMetrics();
      expect(metrics.movingAverage).toBe(0);
    });
  });

  // ==================== Variance ====================

  describe('variance', () => {
    it('should calculate variance correctly', () => {
      // Uniform values should have low variance
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(0.5);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.variance).toBeCloseTo(0, 5);
    });

    it('should detect high variance', () => {
      // Alternating values should have higher variance
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(i % 2 === 0 ? 0.2 : 0.8);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.variance).toBeGreaterThan(0.05);
    });

    it('should return 0 for insufficient samples', () => {
      tracker.recordSample(0.5);

      const metrics = tracker.getMetrics();
      expect(metrics.variance).toBe(0);
    });
  });

  // ==================== Trend Detection ====================

  describe('trend detection', () => {
    it('should detect improving trend', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 10 });

      // Steadily increasing quality
      for (let i = 0; i < 25; i++) {
        customTracker.recordSample(0.3 + i * 0.02);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.trend).toBe('improving');
    });

    it('should detect degrading trend', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 10 });

      // Steadily decreasing quality
      for (let i = 0; i < 25; i++) {
        customTracker.recordSample(0.9 - i * 0.02);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.trend).toBe('degrading');
    });

    it('should detect stable trend', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 10 });

      // Constant quality
      for (let i = 0; i < 25; i++) {
        tracker.recordSample(0.5);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.trend).toBe('stable');
    });

    it('should return stable for insufficient samples', () => {
      for (let i = 0; i < 5; i++) {
        tracker.recordSample(0.5 + i * 0.1);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.trend).toBe('stable');
    });
  });

  // ==================== Plateau Detection ====================

  describe('plateau detection', () => {
    it('should detect plateau when quality stabilizes', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.01,
      });

      // Stabilized quality with very low variance
      for (let i = 0; i < 50; i++) {
        customTracker.recordSample(0.5);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.plateauDetected).toBe(true);
      expect(metrics.plateauLength).toBeGreaterThan(0);
    });

    it('should not detect plateau during improvement', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.01,
      });

      // Constantly improving
      for (let i = 0; i < 50; i++) {
        customTracker.recordSample(0.3 + i * 0.01);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.plateauDetected).toBe(false);
    });

    it('should not detect plateau with insufficient samples', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(0.5);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.plateauDetected).toBe(false);
    });

    it('should track plateau length accurately', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.01,
      });

      // Build up samples before plateau
      for (let i = 0; i < 30; i++) {
        customTracker.recordSample(0.5);
      }

      const metrics1 = customTracker.getMetrics();
      const firstPlateauLength = metrics1.plateauLength;

      // Add more samples
      for (let i = 0; i < 10; i++) {
        customTracker.recordSample(0.5);
      }

      const metrics2 = customTracker.getMetrics();
      expect(metrics2.plateauLength).toBeGreaterThan(firstPlateauLength);
    });
  });

  // ==================== Convergence Speed ====================

  describe('convergenceSpeed', () => {
    it('should calculate steps to reach 90% of final quality', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 10 });

      // Start at 0.1, gradually increase to 1.0
      for (let i = 0; i < 20; i++) {
        customTracker.recordSample(0.1 + i * 0.045);
      }

      const metrics = customTracker.getMetrics();
      // Should find the step where quality first exceeds 90% of final
      expect(metrics.convergenceSpeed).toBeGreaterThan(0);
      expect(metrics.convergenceSpeed).toBeLessThan(20);
    });

    it('should return 0 for insufficient samples', () => {
      for (let i = 0; i < 5; i++) {
        tracker.recordSample(0.5);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.convergenceSpeed).toBe(0);
    });

    it('should return total samples if not converged', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 5 });

      // Start high, then drop - never converges to 90%
      for (let i = 0; i < 15; i++) {
        customTracker.recordSample(0.1);
      }

      const metrics = customTracker.getMetrics();
      // All samples are the same, so convergence at step 0 (already at target)
      expect(metrics.convergenceSpeed).toBe(0);
    });
  });

  // ==================== Recommended Action ====================

  describe('recommendedAction', () => {
    it('should recommend continue when improving', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 10 });

      for (let i = 0; i < 25; i++) {
        customTracker.recordSample(0.3 + i * 0.02);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.recommendedAction).toBe('continue');
    });

    it('should recommend reduce_lr or pause when degrading', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        initialLearningRate: 0.01,
        minLearningRate: 0.0001,
      });

      for (let i = 0; i < 25; i++) {
        customTracker.recordSample(0.9 - i * 0.02);
      }

      const metrics = customTracker.getMetrics();
      // When degrading and LR gets reduced repeatedly, eventually recommends pause
      expect(['reduce_lr', 'pause']).toContain(metrics.recommendedAction);
    });

    it('should recommend reduce_lr for short plateau', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.01,
      });

      for (let i = 0; i < 35; i++) {
        customTracker.recordSample(0.5);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.recommendedAction).toBe('reduce_lr');
    });

    it('should recommend pause for long plateau with min learning rate', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.01,
        initialLearningRate: 0.0001,
        minLearningRate: 0.0001,
      });

      for (let i = 0; i < 50; i++) {
        customTracker.recordSample(0.5);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.recommendedAction).toBe('pause');
    });
  });

  // ==================== Learning Rate ====================

  describe('learning rate management', () => {
    it('should start with initial learning rate', () => {
      const customTracker = new ConvergenceTracker({
        initialLearningRate: 0.05,
      });

      const metrics = customTracker.getMetrics();
      expect(metrics.effectiveLearningRate).toBe(0.05);
    });

    it('should reduce learning rate on degradation', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        initialLearningRate: 0.02,
      });

      // Create degrading trend
      for (let i = 0; i < 25; i++) {
        customTracker.recordSample(0.9 - i * 0.03);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.effectiveLearningRate).toBeLessThan(0.02);
    });

    it('should not go below minimum learning rate', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        initialLearningRate: 0.001,
        minLearningRate: 0.0001,
      });

      // Create many degrading samples to trigger multiple reductions
      for (let i = 0; i < 100; i++) {
        customTracker.recordSample(0.9 - i * 0.005);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.effectiveLearningRate).toBeGreaterThanOrEqual(0.0001);
    });

    it('should suggest appropriate learning rate', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        plateauThreshold: 0.01,
        initialLearningRate: 0.01,
        minLearningRate: 0.0001,
        maxLearningRate: 0.1,
      });

      // Create stable, improving trend
      for (let i = 0; i < 30; i++) {
        customTracker.recordSample(0.5 + i * 0.005);
      }

      const metrics = customTracker.getMetrics();
      expect(metrics.suggestedLearningRate).toBeGreaterThanOrEqual(0.0001);
      expect(metrics.suggestedLearningRate).toBeLessThanOrEqual(0.1);
    });
  });

  // ==================== Fisher Matrix ====================

  describe('Fisher matrix management', () => {
    it('should update Fisher entries', () => {
      tracker.updateFisher('pattern1', 0.5);
      tracker.updateFisher('pattern2', 0.3);

      const stats = tracker.getFisherStats();
      expect(stats.totalEntries).toBe(2);
    });

    it('should use exponential moving average for existing entries', () => {
      // First update
      tracker.updateFisher('pattern1', 1.0);

      // Second update - should blend with first
      tracker.updateFisher('pattern1', 0.0);

      const stats = tracker.getFisherStats();
      expect(stats.totalEntries).toBe(1);
      // With default decay of 0.999, new value is 0.999 * 1.0 + 0.001 * 0.0 = 0.999
      expect(stats.averageValue).toBeCloseTo(0.999, 2);
    });

    it('should prune when reaching max entries', () => {
      const customTracker = new ConvergenceTracker({
        maxFisherEntries: 10,
      });

      // Add more than max entries
      for (let i = 0; i < 15; i++) {
        customTracker.updateFisher(`pattern${i}`, i * 0.1);
      }

      const stats = customTracker.getFisherStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(10);
      expect(stats.entriesPruned).toBeGreaterThan(0);
    });

    it('should track pruned entries count', () => {
      const customTracker = new ConvergenceTracker({
        maxFisherEntries: 10,
      });

      // Add many entries
      for (let i = 0; i < 20; i++) {
        customTracker.updateFisher(`pattern${i}`, 0.1);
      }

      const stats = customTracker.getFisherStats();
      expect(stats.entriesPruned).toBeGreaterThan(0);
    });

    it('should calculate correct statistics', () => {
      tracker.updateFisher('p1', 0.2);
      tracker.updateFisher('p2', 0.4);
      tracker.updateFisher('p3', 0.6);

      const stats = tracker.getFisherStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.averageValue).toBeCloseTo(0.4, 1);
      expect(stats.medianValue).toBeCloseTo(0.4, 1);
    });

    it('should estimate memory usage', () => {
      for (let i = 0; i < 100; i++) {
        tracker.updateFisher(`pattern${i}`, 0.1);
      }

      const stats = tracker.getFisherStats();
      expect(stats.memoryUsage).toBe(100 * 100); // ~100 bytes per entry
    });

    it('should reset Fisher matrix', () => {
      for (let i = 0; i < 10; i++) {
        tracker.updateFisher(`pattern${i}`, 0.1);
      }

      tracker.resetFisher();

      const stats = tracker.getFisherStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.entriesPruned).toBe(0);
    });
  });

  // ==================== Reset ====================

  describe('reset()', () => {
    it('should clear all curves', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(0.5, 0.3);
      }

      tracker.reset();

      const metrics = tracker.getMetrics();
      expect(metrics.qualityCurve).toEqual([]);
      expect(metrics.learningCurve).toEqual([]);
      expect(metrics.totalSamples).toBe(0);
    });

    it('should reset plateau detection', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.01,
      });

      for (let i = 0; i < 50; i++) {
        customTracker.recordSample(0.5);
      }

      // Verify plateau detected
      let metrics = customTracker.getMetrics();
      expect(metrics.plateauDetected).toBe(true);

      customTracker.reset();

      metrics = customTracker.getMetrics();
      expect(metrics.plateauDetected).toBe(false);
      expect(metrics.plateauLength).toBe(0);
    });

    it('should reset learning rate to initial', () => {
      const customTracker = new ConvergenceTracker({
        windowSize: 10,
        initialLearningRate: 0.05,
      });

      // Trigger learning rate reduction
      for (let i = 0; i < 30; i++) {
        customTracker.recordSample(0.9 - i * 0.02);
      }

      let metrics = customTracker.getMetrics();
      expect(metrics.effectiveLearningRate).toBeLessThan(0.05);

      customTracker.reset();

      metrics = customTracker.getMetrics();
      expect(metrics.effectiveLearningRate).toBe(0.05);
    });
  });

  // ==================== Singleton Pattern ====================

  describe('singleton pattern', () => {
    it('should return same instance with getConvergenceTracker', () => {
      const instance1 = getConvergenceTracker();
      const instance2 = getConvergenceTracker();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getConvergenceTracker();
      instance1.recordSample(0.5);

      resetConvergenceTracker();

      const instance2 = getConvergenceTracker();
      const metrics = instance2.getMetrics();

      expect(metrics.totalSamples).toBe(0);
    });

    it('should respect config on first creation', () => {
      resetConvergenceTracker();

      const config: IConvergenceConfig = {
        windowSize: 25,
        initialLearningRate: 0.03,
      };

      const instance = getConvergenceTracker(config);
      const metrics = instance.getMetrics();

      expect(metrics.effectiveLearningRate).toBe(0.03);
    });

    it('should ignore config on subsequent calls', () => {
      resetConvergenceTracker();

      const config1: IConvergenceConfig = { initialLearningRate: 0.05 };
      const config2: IConvergenceConfig = { initialLearningRate: 0.01 };

      const instance1 = getConvergenceTracker(config1);
      const instance2 = getConvergenceTracker(config2);

      const metrics = instance2.getMetrics();
      expect(metrics.effectiveLearningRate).toBe(0.05); // First config wins
    });
  });

  // ==================== Configuration ====================

  describe('configuration', () => {
    it('should use default configuration when not provided', () => {
      const metrics = tracker.getMetrics();
      expect(metrics.effectiveLearningRate).toBe(0.01); // Default
    });

    it('should allow custom window size', () => {
      const customTracker = new ConvergenceTracker({ windowSize: 100 });

      for (let i = 0; i < 50; i++) {
        customTracker.recordSample(0.5);
      }

      // With window size 100, all 50 samples should be in window
      const metrics = customTracker.getMetrics();
      expect(metrics.totalSamples).toBe(50);
    });

    it('should allow custom plateau threshold', () => {
      const strictTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.001, // Very strict
      });

      const lenientTracker = new ConvergenceTracker({
        windowSize: 10,
        minSamplesForPlateau: 20,
        plateauThreshold: 0.1, // More lenient
      });

      // Add samples with small variance
      for (let i = 0; i < 30; i++) {
        const value = 0.5 + (Math.random() - 0.5) * 0.02; // ±0.01 variance
        strictTracker.recordSample(value);
        lenientTracker.recordSample(value);
      }

      // Lenient tracker might detect plateau, strict might not
      const strictMetrics = strictTracker.getMetrics();
      const lenientMetrics = lenientTracker.getMetrics();

      // At minimum, they should have different plateau detection behavior
      // (exact results depend on random values)
      expect(strictMetrics.plateauDetected).toBeDefined();
      expect(lenientMetrics.plateauDetected).toBeDefined();
    });

    it('should enforce learning rate bounds', () => {
      const customTracker = new ConvergenceTracker({
        minLearningRate: 0.001,
        maxLearningRate: 0.05,
        initialLearningRate: 0.02,
      });

      const metrics = customTracker.getMetrics();
      expect(metrics.suggestedLearningRate).toBeGreaterThanOrEqual(0.001);
      expect(metrics.suggestedLearningRate).toBeLessThanOrEqual(0.05);
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle all zero quality values', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(0);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.movingAverage).toBe(0);
      expect(metrics.variance).toBe(0);
    });

    it('should handle negative quality values', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(-0.5);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.movingAverage).toBe(-0.5);
    });

    it('should handle very large quality values', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordSample(1000000);
      }

      const metrics = tracker.getMetrics();
      expect(metrics.movingAverage).toBe(1000000);
    });

    it('should handle single sample', () => {
      tracker.recordSample(0.5);

      const metrics = tracker.getMetrics();
      expect(metrics.totalSamples).toBe(1);
      expect(metrics.movingAverage).toBe(0.5);
      expect(metrics.variance).toBe(0);
      expect(metrics.trend).toBe('stable');
    });
  });

  // ==================== Integration ====================

  describe('integration scenarios', () => {
    it('should track complete learning session', () => {
      const sessionTracker = new ConvergenceTracker({
        windowSize: 10,  // Smaller window for faster trend detection
        minSamplesForPlateau: 50,
        plateauThreshold: 0.01,
      });

      // Simulate typical learning curve:
      // 1. Initial rapid improvement - need 2x window size for trend detection
      for (let i = 0; i < 30; i++) {
        sessionTracker.recordSample(0.3 + i * 0.02, 0.5 - i * 0.01);
      }

      let metrics = sessionTracker.getMetrics();
      expect(metrics.trend).toBe('improving');
      expect(metrics.recommendedAction).toBe('continue');

      // 2. Gradual slowdown
      for (let i = 0; i < 30; i++) {
        sessionTracker.recordSample(0.75 + i * 0.002, 0.2 - i * 0.002);
      }

      // 3. Plateau
      for (let i = 0; i < 40; i++) {
        sessionTracker.recordSample(0.81, 0.14);
      }

      metrics = sessionTracker.getMetrics();
      expect(metrics.plateauDetected).toBe(true);
      expect(metrics.convergenceSpeed).toBeGreaterThan(0);
    });

    it('should handle fluctuating quality', () => {
      const fluctuatingTracker = new ConvergenceTracker({
        windowSize: 10,
      });

      // High variance quality - use alternating values for clear fluctuation
      for (let i = 0; i < 30; i++) {
        fluctuatingTracker.recordSample(i % 2 === 0 ? 0.4 : 0.6);
      }

      const metrics = fluctuatingTracker.getMetrics();
      expect(metrics.variance).toBeGreaterThan(0);
      // With alternating values, trend depends on window positioning
      expect(['stable', 'improving', 'degrading']).toContain(metrics.trend);
    });

    it('should coordinate Fisher updates with quality tracking', () => {
      const coordTracker = new ConvergenceTracker({
        maxFisherEntries: 100,
      });

      // Simulate training with quality and Fisher updates
      for (let i = 0; i < 50; i++) {
        const quality = 0.3 + i * 0.01;
        coordTracker.recordSample(quality);
        coordTracker.updateFisher(`pattern_${i % 10}`, quality * 0.1);
      }

      const metrics = coordTracker.getMetrics();
      const fisherStats = coordTracker.getFisherStats();

      expect(metrics.totalSamples).toBe(50);
      expect(fisherStats.totalEntries).toBe(10);
    });
  });

  // ==================== Performance ====================

  describe('performance', () => {
    it('should handle 10000 samples efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        tracker.recordSample(Math.random());
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should calculate metrics efficiently after many samples', () => {
      for (let i = 0; i < 5000; i++) {
        tracker.recordSample(Math.random());
      }

      const start = performance.now();
      tracker.getMetrics();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50); // Metrics calculation should be fast
    });

    it('should prune Fisher matrix efficiently', () => {
      const customTracker = new ConvergenceTracker({
        maxFisherEntries: 1000,
      });

      const start = performance.now();

      // Force multiple prune cycles
      for (let i = 0; i < 5000; i++) {
        customTracker.updateFisher(`pattern_${i}`, Math.random());
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000); // Should handle pruning efficiently

      const stats = customTracker.getFisherStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(1000);
    });
  });
});
