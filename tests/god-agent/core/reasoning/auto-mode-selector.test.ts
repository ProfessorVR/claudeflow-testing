/**
 * TIER-2.4 Auto Mode Selector Tests
 *
 * Tests for:
 * - ML-based mode selection
 * - Learning from outcomes
 * - Threshold auto-tuning
 * - Pattern-based prediction
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AutoModeSelector,
  getAutoModeSelector,
  resetAutoModeSelector,
  IAutoModeSelectorConfig,
  IModeOutcome,
} from '../../../../src/god-agent/core/reasoning/index.js';
import { ReasoningMode } from '../../../../src/god-agent/core/reasoning/reasoning-types.js';
import { AdvancedReasoningMode } from '../../../../src/god-agent/core/reasoning/advanced-reasoning-types.js';

describe('TIER-2.4: Auto Mode Selector', () => {
  let selector: AutoModeSelector;

  beforeEach(async () => {
    resetAutoModeSelector();
    selector = new AutoModeSelector();
    await selector.initialize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Basic Functionality ====================

  describe('selectMode()', () => {
    it('should select a mode for basic queries', async () => {
      const result = await selector.selectMode({
        query: 'Write a function to calculate fibonacci numbers',
      });

      expect(result.mode).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeDefined();
    });

    it('should respect explicit mode override', async () => {
      const result = await selector.selectMode({
        query: 'Some query',
        type: ReasoningMode.CAUSAL_INFERENCE,
      });

      expect(result.mode).toBe(ReasoningMode.CAUSAL_INFERENCE);
      expect(result.confidence).toBe(1.0);
    });

    it('should provide all scores in result', async () => {
      const result = await selector.selectMode({
        query: 'Why does the server crash when processing large files?',
      });

      expect(result.allScores).toBeDefined();
      expect(result.allScores.patternMatch).toBeDefined();
      expect(result.allScores.causalInference).toBeDefined();
      expect(result.allScores.contextual).toBeDefined();
    });

    it('should handle causal queries', async () => {
      const result = await selector.selectMode({
        query: 'Why does the database timeout occur after heavy load?',
      });

      // Should favor causal or abductive modes
      expect([
        ReasoningMode.CAUSAL_INFERENCE,
        AdvancedReasoningMode.ABDUCTIVE,
        ReasoningMode.HYBRID,
      ]).toContain(result.mode);
    });

    it('should handle pattern-like queries', async () => {
      const result = await selector.selectMode({
        query: 'Write a unit test for the UserService class',
      });

      // Should favor pattern match or decomposition
      expect([
        ReasoningMode.PATTERN_MATCH,
        AdvancedReasoningMode.DECOMPOSITION,
        ReasoningMode.HYBRID,
      ]).toContain(result.mode);
    });
  });

  // ==================== Learning from Outcomes ====================

  describe('recordOutcome()', () => {
    it('should record outcomes', async () => {
      const outcome: IModeOutcome = {
        query: 'Write a function to sort an array',
        selectedMode: ReasoningMode.PATTERN_MATCH,
        quality: 0.9,
        timestamp: Date.now(),
      };

      selector.recordOutcome(outcome);

      const stats = selector.getStats();
      expect(stats.totalSelections).toBeGreaterThan(0);
    });

    it('should update quality statistics', async () => {
      // Record multiple outcomes
      for (let i = 0; i < 5; i++) {
        selector.recordOutcome({
          query: `Query ${i}`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.8,
          timestamp: Date.now(),
        });
      }

      const stats = selector.getStats();
      expect(stats.qualityByMode[ReasoningMode.PATTERN_MATCH]).toBeGreaterThan(0);
    });

    it('should track selection counts by mode', async () => {
      selector.recordOutcome({
        query: 'Query 1',
        selectedMode: ReasoningMode.PATTERN_MATCH,
        quality: 0.8,
        timestamp: Date.now(),
      });

      selector.recordOutcome({
        query: 'Query 2',
        selectedMode: ReasoningMode.CAUSAL_INFERENCE,
        quality: 0.7,
        timestamp: Date.now(),
      });

      const stats = selector.getStats();
      expect(stats.selectionsByMode[ReasoningMode.PATTERN_MATCH]).toBe(1);
      expect(stats.selectionsByMode[ReasoningMode.CAUSAL_INFERENCE]).toBe(1);
    });
  });

  // ==================== Learning Enhancement ====================

  describe('learning enhancement', () => {
    it('should learn from positive outcomes', async () => {
      const customSelector = new AutoModeSelector({
        minSamplesForLearning: 5,
        learningRate: 0.2,
        boostFactor: 0.5,
      });
      await customSelector.initialize();

      // Record enough samples to enable learning
      for (let i = 0; i < 10; i++) {
        customSelector.recordOutcome({
          query: 'Write a function to process data',
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.9,
          timestamp: Date.now(),
        });
      }

      // Query similar pattern - should boost pattern match
      const result = await customSelector.selectMode({
        query: 'Write a function to handle input',
      });

      // Confidence should include learned boost
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toContain('ML-enhanced');
    });

    it('should learn from negative outcomes', async () => {
      const customSelector = new AutoModeSelector({
        minSamplesForLearning: 5,
        learningRate: 0.2,
      });
      await customSelector.initialize();

      // Record poor outcomes for a mode
      for (let i = 0; i < 10; i++) {
        customSelector.recordOutcome({
          query: 'Debug the memory leak',
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.2,
          timestamp: Date.now(),
        });
      }

      // The mode should have lower average quality
      const stats = customSelector.getStats();
      expect(stats.qualityByMode[ReasoningMode.PATTERN_MATCH]).toBeLessThan(0.5);
    });

    it('should not apply learning before minimum samples', async () => {
      const customSelector = new AutoModeSelector({
        minSamplesForLearning: 100,
      });
      await customSelector.initialize();

      // Record only a few samples
      for (let i = 0; i < 5; i++) {
        customSelector.recordOutcome({
          query: 'Test query',
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.9,
          timestamp: Date.now(),
        });
      }

      // Should use base heuristics (no ML-enhanced note)
      const result = await customSelector.selectMode({
        query: 'Test query similar',
      });

      expect(result.reasoning).not.toContain('ML-enhanced');
    });
  });

  // ==================== Weight Management ====================

  describe('weight management', () => {
    it('should export learned weights', async () => {
      for (let i = 0; i < 10; i++) {
        selector.recordOutcome({
          query: `Query ${i}`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.8,
          timestamp: Date.now(),
        });
      }

      const weights = selector.exportWeights();
      expect(weights.length).toBeGreaterThan(0);
      expect(weights[0]).toHaveProperty('mode');
      expect(weights[0]).toHaveProperty('patternKey');
      expect(weights[0]).toHaveProperty('weight');
    });

    it('should import learned weights', async () => {
      const weights = [
        {
          mode: ReasoningMode.PATTERN_MATCH as any,
          patternKey: 'code:short',
          weight: 0.5,
          updateCount: 10,
          averageQuality: 0.85,
          lastUpdated: Date.now(),
        },
      ];

      selector.importWeights(weights);

      const stats = selector.getStats();
      expect(stats.totalWeights).toBe(1);
    });

    it('should prune old patterns when limit exceeded', async () => {
      const smallSelector = new AutoModeSelector({
        maxPatterns: 10,
        minSamplesForLearning: 1,
      });
      await smallSelector.initialize();

      // Record many different patterns
      for (let i = 0; i < 20; i++) {
        smallSelector.recordOutcome({
          query: `Unique query number ${i} with different content`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.8,
          timestamp: Date.now() + i,
        });
      }

      const stats = smallSelector.getStats();
      expect(stats.totalWeights).toBeLessThanOrEqual(10);
    });
  });

  // ==================== Statistics ====================

  describe('getStats()', () => {
    it('should return initial empty stats', () => {
      const stats = selector.getStats();

      expect(stats.totalSelections).toBe(0);
      expect(stats.learningRate).toBeGreaterThan(0);
      expect(stats.boostFactor).toBeGreaterThan(0);
    });

    it('should calculate auto mode usage rate', async () => {
      // Record some successful outcomes
      for (let i = 0; i < 10; i++) {
        selector.recordOutcome({
          query: `Query ${i}`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: i < 7 ? 0.9 : 0.3, // 70% high quality
          timestamp: Date.now(),
        });
      }

      const stats = selector.getStats();
      expect(stats.autoModeUsageRate).toBeGreaterThan(0);
    });

    it('should track last updated timestamp', () => {
      const stats = selector.getStats();
      expect(stats.lastUpdated).toBeLessThanOrEqual(Date.now());
      expect(stats.lastUpdated).toBeGreaterThan(Date.now() - 1000);
    });
  });

  // ==================== Reset ====================

  describe('reset()', () => {
    it('should clear all learned weights', async () => {
      for (let i = 0; i < 10; i++) {
        selector.recordOutcome({
          query: `Query ${i}`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.8,
          timestamp: Date.now(),
        });
      }

      selector.reset();

      const stats = selector.getStats();
      expect(stats.totalWeights).toBe(0);
    });

    it('should reset selection counts', async () => {
      selector.recordOutcome({
        query: 'Query',
        selectedMode: ReasoningMode.PATTERN_MATCH,
        quality: 0.8,
        timestamp: Date.now(),
      });

      selector.reset();

      const stats = selector.getStats();
      expect(stats.selectionsByMode[ReasoningMode.PATTERN_MATCH]).toBe(0);
    });
  });

  // ==================== Singleton Pattern ====================

  describe('singleton pattern', () => {
    it('should return same instance with getAutoModeSelector', () => {
      const instance1 = getAutoModeSelector();
      const instance2 = getAutoModeSelector();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', async () => {
      const instance1 = getAutoModeSelector();

      instance1.recordOutcome({
        query: 'Test',
        selectedMode: ReasoningMode.PATTERN_MATCH,
        quality: 0.8,
        timestamp: Date.now(),
      });

      resetAutoModeSelector();

      const instance2 = getAutoModeSelector();
      const stats = instance2.getStats();

      // New instance should have fresh stats
      expect(stats.totalWeights).toBe(0);
    });

    it('should respect config on first creation', async () => {
      resetAutoModeSelector();

      const config: IAutoModeSelectorConfig = {
        learningRate: 0.5,
        boostFactor: 0.8,
      };

      const instance = getAutoModeSelector(config);
      await instance.initialize();

      const stats = instance.getStats();
      expect(stats.learningRate).toBe(0.5);
      expect(stats.boostFactor).toBe(0.8);
    });
  });

  // ==================== Configuration ====================

  describe('configuration', () => {
    it('should use default config when not provided', async () => {
      const stats = selector.getStats();
      expect(stats.learningRate).toBe(0.1); // Default
      expect(stats.boostFactor).toBe(0.3); // Default
    });

    it('should allow custom learning rate', async () => {
      const customSelector = new AutoModeSelector({
        learningRate: 0.5,
      });

      const stats = customSelector.getStats();
      expect(stats.learningRate).toBe(0.5);
    });

    it('should allow custom boost factor', async () => {
      const customSelector = new AutoModeSelector({
        boostFactor: 0.8,
      });

      const stats = customSelector.getStats();
      expect(stats.boostFactor).toBe(0.8);
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('should handle empty query', async () => {
      const result = await selector.selectMode({
        query: '',
      });

      expect(result.mode).toBeDefined();
    });

    it('should handle very long query', async () => {
      const longQuery = 'x'.repeat(10000);
      const result = await selector.selectMode({
        query: longQuery,
      });

      expect(result.mode).toBeDefined();
    });

    it('should handle special characters in query', async () => {
      const result = await selector.selectMode({
        query: '!@#$%^&*() <script>alert("xss")</script>',
      });

      expect(result.mode).toBeDefined();
    });

    it('should handle outcome with zero quality', async () => {
      selector.recordOutcome({
        query: 'Test',
        selectedMode: ReasoningMode.PATTERN_MATCH,
        quality: 0,
        timestamp: Date.now(),
      });

      const stats = selector.getStats();
      expect(stats.totalWeights).toBeGreaterThan(0);
    });

    it('should handle outcome with max quality', async () => {
      selector.recordOutcome({
        query: 'Test',
        selectedMode: ReasoningMode.PATTERN_MATCH,
        quality: 1.0,
        timestamp: Date.now(),
      });

      const stats = selector.getStats();
      expect(stats.totalWeights).toBeGreaterThan(0);
    });
  });

  // ==================== Integration ====================

  describe('integration scenarios', () => {
    it('should improve selection over training cycle', async () => {
      const trainableSelector = new AutoModeSelector({
        minSamplesForLearning: 5,
        learningRate: 0.3,
        boostFactor: 0.5,
      });
      await trainableSelector.initialize();

      // Simulate training cycle with consistent positive outcomes for causal queries
      for (let i = 0; i < 20; i++) {
        trainableSelector.recordOutcome({
          query: 'Why does the system fail under load?',
          selectedMode: ReasoningMode.CAUSAL_INFERENCE,
          quality: 0.95,
          timestamp: Date.now() + i,
        });
      }

      // Now test similar query
      const result = await trainableSelector.selectMode({
        query: 'Why does the application crash during peak usage?',
      });

      // Should have reasonable causal inference score
      expect(result.allScores.causalInference).toBeGreaterThanOrEqual(0.3);
    });

    it('should handle mixed quality outcomes', async () => {
      const mixedSelector = new AutoModeSelector({
        minSamplesForLearning: 10,
      });
      await mixedSelector.initialize();

      // Record mixed outcomes
      for (let i = 0; i < 15; i++) {
        mixedSelector.recordOutcome({
          query: `Test query ${i}`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: i % 3 === 0 ? 0.9 : 0.4, // Mix of good and bad
          timestamp: Date.now() + i,
        });
      }

      const stats = mixedSelector.getStats();
      const avgQuality = stats.qualityByMode[ReasoningMode.PATTERN_MATCH];

      // Should have moderate average
      expect(avgQuality).toBeGreaterThan(0.3);
      expect(avgQuality).toBeLessThan(0.8);
    });

    it('should support all advanced reasoning modes', async () => {
      const advancedModes = [
        AdvancedReasoningMode.ANALOGICAL,
        AdvancedReasoningMode.ABDUCTIVE,
        AdvancedReasoningMode.COUNTERFACTUAL,
        AdvancedReasoningMode.DECOMPOSITION,
        AdvancedReasoningMode.ADVERSARIAL,
        AdvancedReasoningMode.TEMPORAL,
        AdvancedReasoningMode.CONSTRAINT_BASED,
        AdvancedReasoningMode.FIRST_PRINCIPLES,
      ];

      for (const mode of advancedModes) {
        selector.recordOutcome({
          query: `Query for ${mode}`,
          selectedMode: mode,
          quality: 0.8,
          timestamp: Date.now(),
        });
      }

      const stats = selector.getStats();

      for (const mode of advancedModes) {
        expect(stats.selectionsByMode[mode]).toBe(1);
      }
    });
  });

  // ==================== Performance ====================

  describe('performance', () => {
    it('should select mode within 50ms', async () => {
      const start = performance.now();
      await selector.selectMode({
        query: 'Write a function to process user data',
      });
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
    });

    it('should handle many outcomes efficiently', async () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        selector.recordOutcome({
          query: `Query number ${i}`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.8,
          timestamp: Date.now() + i,
        });
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should get stats quickly', async () => {
      // Add some data first
      for (let i = 0; i < 100; i++) {
        selector.recordOutcome({
          query: `Query ${i}`,
          selectedMode: ReasoningMode.PATTERN_MATCH,
          quality: 0.8,
          timestamp: Date.now(),
        });
      }

      const start = performance.now();
      selector.getStats();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });
});
