/**
 * Tests for Context Health Monitor - PHASE-4-001
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContextHealthMonitor,
  createContextHealthMonitor,
  createClaudeContextMonitor,
  createSmallContextMonitor,
  createDebugContextMonitor,
  type ContextHealthEvent,
} from '../../../../src/god-agent/cli/context/context-health-monitor.js';

describe('PHASE-4-001: Context Health Monitor', () => {
  let monitor: ContextHealthMonitor;

  beforeEach(() => {
    monitor = createContextHealthMonitor({
      maxTokens: 1000,  // Small for testing
      charsPerToken: 4,
    });
  });

  // ==========================================================================
  // Basic Token Tracking
  // ==========================================================================

  describe('Token Tracking', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'a'.repeat(100);  // 100 chars = ~25 tokens
      const tokens = monitor.trackContent(text, 'test');
      expect(tokens).toBe(25);
    });

    it('should track cumulative tokens', () => {
      monitor.trackContent('a'.repeat(100), 'source1');  // 25 tokens
      monitor.trackContent('b'.repeat(200), 'source2');  // 50 tokens

      const health = monitor.getHealth();
      expect(health.currentTokens).toBe(75);
    });

    it('should track tokens by source', () => {
      monitor.trackContent('a'.repeat(100), 'agent-a');
      monitor.trackContent('b'.repeat(200), 'agent-b');
      monitor.trackContent('c'.repeat(100), 'agent-a');  // Same source

      const health = monitor.getHealth();
      expect(health.tokensBySource['agent-a']).toBe(50);  // 25 + 25
      expect(health.tokensBySource['agent-b']).toBe(50);
    });

    it('should track agent execution input/output', () => {
      const input = { query: 'test query' };
      const output = { result: 'test result' };

      const tokens = monitor.trackAgentExecution('my-agent', input, output);

      expect(tokens).toBeGreaterThan(0);
      const health = monitor.getHealth();
      expect(health.tokensBySource['my-agent:input']).toBeDefined();
      expect(health.tokensBySource['my-agent:output']).toBeDefined();
    });
  });

  // ==========================================================================
  // Health Status
  // ==========================================================================

  describe('Health Status', () => {
    it('should start in healthy state', () => {
      const health = monitor.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.currentTokens).toBe(0);
      expect(health.utilization).toBe(0);
    });

    it('should report healthy when under 60% utilization', () => {
      // 1000 tokens max, 60% = 600 tokens = 2400 chars
      monitor.trackContent('a'.repeat(2000), 'test');  // 500 tokens = 50%

      const health = monitor.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.utilization).toBe(50);
    });

    it('should report warning when 60-80% utilization', () => {
      // 1000 tokens max, add 700 tokens = 70%
      monitor.trackContent('a'.repeat(2800), 'test');

      const health = monitor.getHealth();
      expect(health.status).toBe('warning');
      expect(health.utilization).toBe(70);
      expect(health.recommendation).toContain('Consider summarization');
    });

    it('should report critical when over 80% utilization', () => {
      // 1000 tokens max, add 900 tokens = 90%
      monitor.trackContent('a'.repeat(3600), 'test');

      const health = monitor.getHealth();
      expect(health.status).toBe('critical');
      expect(health.utilization).toBe(90);
      expect(health.recommendation).toContain('Immediate summarization required');
    });

    it('should correctly identify when summarization is needed', () => {
      expect(monitor.needsSummarization()).toBe(false);

      // Add content to hit 85%
      monitor.trackContent('a'.repeat(3400), 'test');
      expect(monitor.needsSummarization()).toBe(true);
    });

    it('should report remaining capacity', () => {
      monitor.trackContent('a'.repeat(400), 'test');  // 100 tokens

      expect(monitor.getRemainingCapacity()).toBe(900);
    });
  });

  // ==========================================================================
  // Events
  // ==========================================================================

  describe('Events', () => {
    it('should emit content_added event', () => {
      const handler = vi.fn();
      monitor.on('content_added', handler);

      monitor.trackContent('test content', 'source');

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as ContextHealthEvent;
      expect(event.type).toBe('content_added');
      expect(event.source).toBe('source');
      expect(event.tokensAdded).toBeGreaterThan(0);
    });

    it('should emit status_change when crossing thresholds', () => {
      const statusHandler = vi.fn();
      const thresholdHandler = vi.fn();
      monitor.on('status_change', statusHandler);
      monitor.on('threshold_crossed', thresholdHandler);

      // Go from healthy to warning (60%)
      monitor.trackContent('a'.repeat(2400), 'test');  // 600 tokens = 60%

      expect(statusHandler).toHaveBeenCalledTimes(1);
      expect(thresholdHandler).toHaveBeenCalledTimes(1);

      const event = statusHandler.mock.calls[0][0] as ContextHealthEvent;
      expect(event.previousStatus).toBe('healthy');
      expect(event.currentStatus).toBe('warning');
    });

    it('should emit reset event', () => {
      const handler = vi.fn();
      monitor.on('reset', handler);

      monitor.trackContent('a'.repeat(2400), 'test');
      monitor.reset();

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as ContextHealthEvent;
      expect(event.type).toBe('reset');
      expect(event.currentStatus).toBe('healthy');
    });
  });

  // ==========================================================================
  // Reset
  // ==========================================================================

  describe('Reset', () => {
    it('should reset all tracking', () => {
      monitor.trackContent('a'.repeat(1000), 'test');

      monitor.reset();

      const health = monitor.getHealth();
      expect(health.currentTokens).toBe(0);
      expect(health.utilization).toBe(0);
      expect(health.status).toBe('healthy');
      expect(Object.keys(health.tokensBySource)).toHaveLength(0);
    });

    it('should reset with preserved content', () => {
      monitor.trackContent('a'.repeat(1000), 'test');

      const summary = 'Summary text here';  // ~5 tokens
      monitor.resetWithPreserved(summary, 'phase-summary');

      const health = monitor.getHealth();
      expect(health.currentTokens).toBeGreaterThan(0);
      expect(health.tokensBySource['phase-summary']).toBeDefined();
      expect(health.tokensBySource['test']).toBeUndefined();
    });
  });

  // ==========================================================================
  // Content Breakdown
  // ==========================================================================

  describe('Content Breakdown', () => {
    it('should return breakdown sorted by tokens', () => {
      monitor.trackContent('a'.repeat(400), 'small');
      monitor.trackContent('b'.repeat(800), 'medium');
      monitor.trackContent('c'.repeat(1200), 'large');

      const breakdown = monitor.getContentBreakdown();

      expect(breakdown[0].source).toBe('large');
      expect(breakdown[1].source).toBe('medium');
      expect(breakdown[2].source).toBe('small');
    });

    it('should return largest consumers limited', () => {
      for (let i = 0; i < 20; i++) {
        monitor.trackContent('test', `source-${i}`);
      }

      const largest = monitor.getLargestConsumers(5);
      expect(largest).toHaveLength(5);
    });

    it('should calculate percentages correctly', () => {
      monitor.trackContent('a'.repeat(400), 'half');
      monitor.trackContent('b'.repeat(400), 'other-half');

      const breakdown = monitor.getContentBreakdown();

      expect(breakdown[0].percentage).toBeCloseTo(50, 1);
      expect(breakdown[1].percentage).toBeCloseTo(50, 1);
    });
  });

  // ==========================================================================
  // Formatting
  // ==========================================================================

  describe('Formatting', () => {
    it('should format status for display', () => {
      monitor.trackContent('a'.repeat(2400), 'test');

      const formatted = monitor.formatStatus();

      expect(formatted).toContain('WARNING');
      expect(formatted).toContain('Utilization');
      expect(formatted).toContain('60.0%');
    });

    it('should generate detailed report', () => {
      monitor.trackContent('a'.repeat(1000), 'agent-1');
      monitor.trackContent('b'.repeat(500), 'agent-2');

      const report = monitor.getDetailedReport();

      expect(report).toContain('Context Health Report');
      expect(report).toContain('Content Breakdown');
      expect(report).toContain('agent-1');
      expect(report).toContain('agent-2');
    });
  });

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create default monitor', () => {
      const mon = createContextHealthMonitor();
      const health = mon.getHealth();
      expect(health.maxTokens).toBe(200000);
    });

    it('should create Claude monitor with 200K context', () => {
      const mon = createClaudeContextMonitor();
      const health = mon.getHealth();
      expect(health.maxTokens).toBe(200000);
    });

    it('should create small context monitor', () => {
      const mon = createSmallContextMonitor(8000);
      const health = mon.getHealth();
      expect(health.maxTokens).toBe(8000);
    });

    it('should create debug monitor', () => {
      const mon = createDebugContextMonitor();
      // Debug mode stores content internally
      expect(mon).toBeInstanceOf(ContextHealthMonitor);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const tokens = monitor.trackContent('', 'empty');
      expect(tokens).toBe(0);
    });

    it('should handle very large content', () => {
      const largeContent = 'a'.repeat(100000);  // 25000 tokens
      const tokens = monitor.trackContent(largeContent, 'large');
      expect(tokens).toBe(25000);
    });

    it('should handle special characters', () => {
      const special = '🔥💻🚀'.repeat(100);
      const tokens = monitor.trackContent(special, 'emoji');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle JSON objects in trackAgentExecution', () => {
      const complexInput = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      const tokens = monitor.trackAgentExecution('agent', complexInput);
      expect(tokens).toBeGreaterThan(0);
    });

    it('should not go negative on remaining capacity', () => {
      // Add more than max tokens
      monitor.trackContent('a'.repeat(5000), 'overflow');  // 1250 tokens > 1000 max

      expect(monitor.getRemainingCapacity()).toBe(0);
    });
  });

  // ==========================================================================
  // Custom Configuration
  // ==========================================================================

  describe('Custom Configuration', () => {
    it('should respect custom thresholds', () => {
      const customMonitor = createContextHealthMonitor({
        maxTokens: 1000,
        warningThreshold: 30,
        criticalThreshold: 50,
        charsPerToken: 4,
      });

      // 35% should be warning with custom threshold
      customMonitor.trackContent('a'.repeat(1400), 'test');  // 350 tokens = 35%

      expect(customMonitor.getHealth().status).toBe('warning');
    });

    it('should respect custom chars per token', () => {
      const customMonitor = createContextHealthMonitor({
        maxTokens: 1000,
        charsPerToken: 2,  // More tokens per character
      });

      const tokens = customMonitor.trackContent('a'.repeat(100), 'test');
      expect(tokens).toBe(50);  // 100 / 2 = 50
    });
  });
});
