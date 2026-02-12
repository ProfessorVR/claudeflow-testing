/**
 * Tests for Context Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContextManager,
  createContextManager,
  createLargeContextManager,
} from '../../../src/god-agent/universal/context-manager.js';

describe('ContextManager', () => {
  let manager: ContextManager;

  beforeEach(() => {
    manager = createContextManager({ maxTokens: 10000 });
  });

  describe('Constructor', () => {
    it('should create manager with default options', () => {
      const m = createContextManager();
      expect(m).toBeInstanceOf(ContextManager);
    });

    it('should create large context manager', () => {
      const m = createLargeContextManager();
      expect(m).toBeInstanceOf(ContextManager);
    });

    it('should accept custom max tokens', () => {
      const m = createContextManager({ maxTokens: 50000 });
      expect(m).toBeInstanceOf(ContextManager);
    });
  });

  describe('trackUsage', () => {
    it('should track token usage', () => {
      manager.trackUsage('op-1', 'write', 1000, 500);
      const health = manager.getHealth();
      expect(health.currentTokens).toBe(1500);
    });

    it('should track multiple operations', () => {
      manager.trackUsage('op-1', 'write', 1000, 500);
      manager.trackUsage('op-2', 'research', 500, 300);
      const health = manager.getHealth();
      expect(health.currentTokens).toBe(2300);
      expect(health.totalOperations).toBe(2);
    });

    it('should not track when disabled', () => {
      const m = createContextManager({ enabled: false });
      m.trackUsage('op-1', 'write', 1000, 500);
      const health = m.getHealth();
      expect(health.currentTokens).toBe(0);
    });
  });

  describe('getHealth', () => {
    it('should report healthy status initially', () => {
      const health = manager.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.currentTokens).toBe(0);
      expect(health.usagePercentage).toBe(0);
      expect(health.needsSummarization).toBe(false);
    });

    it('should report warning status at 75%', () => {
      manager.trackUsage('op-1', 'write', 7500, 0);
      const health = manager.getHealth();
      expect(health.status).toBe('warning');
      expect(health.needsSummarization).toBe(true);
    });

    it('should report critical status at 90%', () => {
      manager.trackUsage('op-1', 'write', 9000, 0);
      const health = manager.getHealth();
      expect(health.status).toBe('critical');
      expect(health.needsSummarization).toBe(true);
    });

    it('should calculate remaining tokens correctly', () => {
      manager.trackUsage('op-1', 'write', 3000, 0);
      const health = manager.getHealth();
      expect(health.remainingTokens).toBe(7000);
    });
  });

  describe('getUsageByType', () => {
    it('should categorize usage by type', () => {
      manager.trackUsage('op-1', 'write', 1000, 500);
      manager.trackUsage('op-2', 'research', 500, 300);
      manager.trackUsage('op-3', 'revision', 200, 100);

      const usage = manager.getUsageByType();
      expect(usage.write).toBe(1500);
      expect(usage.research).toBe(800);
      expect(usage.revision).toBe(300);
      expect(usage.validation).toBe(0);
    });
  });

  describe('pruneContext', () => {
    beforeEach(() => {
      manager.trackUsage('op-1', 'write', 2000, 1000);
      manager.trackUsage('op-2', 'research', 1500, 500);
      manager.trackUsage('op-3', 'validation', 1000, 500);
      manager.trackUsage('op-4', 'revision', 800, 200);
    });

    it('should prune using oldest-first strategy', () => {
      manager.pruneContext('oldest-first', 0.3);
      const health = manager.getHealth();
      expect(health.currentTokens).toBeLessThanOrEqual(3000);
    });

    it('should prune using preserve-recent strategy', () => {
      manager.pruneContext('preserve-recent', 0.3);
      const health = manager.getHealth();
      expect(health.currentTokens).toBeLessThanOrEqual(3000);
    });

    it('should prune using least-important strategy', () => {
      manager.pruneContext('least-important', 0.3);
      const health = manager.getHealth();
      expect(health.currentTokens).toBeLessThanOrEqual(3000);
    });

    it('should not prune when under target', () => {
      const beforeTokens = manager.getHealth().currentTokens;
      manager.pruneContext('oldest-first', 1.0);
      const afterTokens = manager.getHealth().currentTokens;
      expect(afterTokens).toBe(beforeTokens);
    });
  });

  describe('reset', () => {
    it('should clear all history', () => {
      manager.trackUsage('op-1', 'write', 1000, 500);
      manager.reset();
      const health = manager.getHealth();
      expect(health.currentTokens).toBe(0);
      expect(health.totalOperations).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics', () => {
      manager.trackUsage('op-1', 'write', 1000, 500);
      manager.trackUsage('op-2', 'research', 500, 300);

      const stats = manager.getStatistics();
      expect(stats.totalTokens).toBe(2300);
      expect(stats.totalOperations).toBe(2);
      expect(stats.avgTokensPerOperation).toBe(1150);
    });
  });

  describe('canFitOperation', () => {
    it('should check if operation fits', () => {
      expect(manager.canFitOperation(5000)).toBe(true);
      expect(manager.canFitOperation(15000)).toBe(false);

      manager.trackUsage('op-1', 'write', 8000, 0);
      expect(manager.canFitOperation(3000)).toBe(false);
      expect(manager.canFitOperation(1000)).toBe(true);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens from text', () => {
      const text = 'This is a test string with some content.';
      const estimate = ContextManager.estimateTokens(text);
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(text.length);
    });
  });

  describe('getRecommendedAction', () => {
    it('should recommend OK when healthy', () => {
      const action = manager.getRecommendedAction();
      expect(action).toContain('OK');
    });

    it('should recommend warning action', () => {
      manager.trackUsage('op-1', 'write', 7500, 0);
      const action = manager.getRecommendedAction();
      expect(action).toContain('WARNING');
    });

    it('should recommend critical action', () => {
      manager.trackUsage('op-1', 'write', 9000, 0);
      const action = manager.getRecommendedAction();
      expect(action).toContain('CRITICAL');
    });
  });
});
