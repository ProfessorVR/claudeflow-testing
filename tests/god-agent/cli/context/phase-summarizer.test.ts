/**
 * Tests for Phase Summarizer - PHASE-4-002
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PhaseSummarizer,
  createPhaseSummarizer,
  createAggressiveSummarizer,
  createDetailedSummarizer,
  type SummarizationEvent,
} from '../../../../src/god-agent/cli/context/phase-summarizer.js';
import {
  ContextHealthMonitor,
  createContextHealthMonitor,
} from '../../../../src/god-agent/cli/context/context-health-monitor.js';

describe('PHASE-4-002: Phase Summarizer', () => {
  let summarizer: PhaseSummarizer;

  beforeEach(() => {
    summarizer = createPhaseSummarizer();
  });

  // ==========================================================================
  // Basic Summarization
  // ==========================================================================

  describe('Basic Summarization', () => {
    it('should summarize phase outputs', async () => {
      const outputs = new Map<string, unknown>([
        ['step-back-analyzer', {
          high_level_framing: 'This dissertation explores...',
          key_questions: ['Q1', 'Q2', 'Q3'],
          success_criteria: 'Clear methodology and findings',
        }],
        ['literature-mapper', {
          sources_found: 150,
          key_themes: ['Theme A', 'Theme B'],
          raw_data: 'lots of verbose data...',
        }],
      ]);

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.phaseId).toBe(1);
      expect(summary.summary).toBeDefined();
      expect(summary.summary.length).toBeGreaterThan(0);
      expect(summary.agentsSummarized).toContain('step-back-analyzer');
      expect(summary.agentsSummarized).toContain('literature-mapper');
    });

    it('should achieve compression', async () => {
      const largeOutput = {
        detailed_analysis: 'a'.repeat(10000),
        key_findings: 'Important finding',
        verbose_log: 'b'.repeat(20000),
      };

      const outputs = new Map<string, unknown>([
        ['large-agent', largeOutput],
      ]);

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.compressionRatio).toBeGreaterThan(1);
      expect(summary.compressedTokens).toBeLessThan(summary.originalTokens);
    });

    it('should preserve key artifacts', async () => {
      const outputs = new Map<string, unknown>([
        ['agent-1', {
          high_level_framing: 'The research framework...',
          key_questions: ['How does X affect Y?'],
          intermediate_data: 'not important',
        }],
      ]);

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.artifacts['agent-1.high_level_framing']).toBeDefined();
      expect(summary.artifacts['agent-1.key_questions']).toBeDefined();
    });

    it('should extract key decisions', async () => {
      const outputs = new Map<string, unknown>([
        ['decision-agent', {
          decision: 'Use qualitative methodology',
          recommendations: ['Focus on interviews', 'Include case studies'],
        }],
      ]);

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.keyDecisions.length).toBeGreaterThan(0);
      expect(summary.keyDecisions.some(d => d.includes('qualitative'))).toBe(true);
    });

    it('should respect max summary length', async () => {
      const outputs = new Map<string, unknown>([
        ['verbose-agent', {
          high_level_framing: 'x'.repeat(20000),
        }],
      ]);

      const customSummarizer = createPhaseSummarizer({
        maxSummaryLength: 1000,
      });

      const summary = await customSummarizer.summarize(1, outputs);

      expect(summary.summary.length).toBeLessThanOrEqual(1003); // 1000 + "..."
    });
  });

  // ==========================================================================
  // Phase-Specific Summarization
  // ==========================================================================

  describe('Phase-Specific Summarization', () => {
    it('should use phase 1 hints for foundation phase', async () => {
      const outputs = new Map<string, unknown>([
        ['agent', {
          high_level_framing: 'Framework content',
          research_gaps: ['Gap 1', 'Gap 2'],
          debug_info: 'should be discarded',
        }],
      ]);

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.summary).toContain('high_level_framing');
      // debug_info should be less prominent in summary
    });

    it('should use phase 4 hints for writing phase', async () => {
      const outputs = new Map<string, unknown>([
        ['writer', {
          chapter_content: 'Chapter text here...',
          key_arguments: ['Arg 1', 'Arg 2'],
          drafts: 'many drafts...',
        }],
      ]);

      const summary = await summarizer.summarize(4, outputs);

      expect(summary.summary).toContain('chapter_content');
    });

    it('should handle unknown phase gracefully', async () => {
      const outputs = new Map<string, unknown>([
        ['agent', { data: 'test' }],
      ]);

      const summary = await summarizer.summarize(99, outputs);

      expect(summary.phaseId).toBe(99);
      expect(summary.summary).toBeDefined();
    });
  });

  // ==========================================================================
  // Context Building
  // ==========================================================================

  describe('Context Building', () => {
    it('should build context from previous summaries', async () => {
      const previousSummaries = [
        {
          phaseId: 1,
          summary: 'Phase 1 established the framework...',
          keyDecisions: ['Decision A'],
          artifacts: { 'agent.key': 'value' },
          originalTokens: 1000,
          compressedTokens: 100,
          compressionRatio: 10,
          timestamp: new Date().toISOString(),
          agentsSummarized: ['agent'],
        },
      ];

      const currentInputs = { chapter: 2, task: 'Write introduction' };

      const context = summarizer.buildPhaseContext(previousSummaries, currentInputs);

      expect(context).toContain('Previous Phase Summaries');
      expect(context).toContain('Phase 1 Summary');
      expect(context).toContain('Phase 1 established');
      expect(context).toContain('Decision A');
      expect(context).toContain('Current Phase Inputs');
      expect(context).toContain('Write introduction');
    });

    it('should handle empty previous summaries', async () => {
      const context = summarizer.buildPhaseContext([], { task: 'start' });

      expect(context).toContain('Current Phase Inputs');
      expect(context).not.toContain('Previous Phase Summaries');
    });

    it('should limit artifact size in context', async () => {
      const previousSummaries = [
        {
          phaseId: 1,
          summary: 'Summary',
          keyDecisions: [],
          artifacts: {
            'agent.high_level_framing': 'x'.repeat(1000),
          },
          originalTokens: 1000,
          compressedTokens: 100,
          compressionRatio: 10,
          timestamp: new Date().toISOString(),
          agentsSummarized: ['agent'],
        },
      ];

      const context = summarizer.buildPhaseContext(previousSummaries, {});

      // Should truncate large artifacts
      expect(context.length).toBeLessThan(2000);
    });
  });

  // ==========================================================================
  // Events
  // ==========================================================================

  describe('Events', () => {
    it('should emit phase_summarized event', async () => {
      const handler = vi.fn();
      summarizer.on('phase_summarized', handler);

      const outputs = new Map<string, unknown>([
        ['agent', { data: 'test content here' }],
      ]);

      await summarizer.summarize(1, outputs);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as SummarizationEvent;
      expect(event.type).toBe('phase_summarized');
      expect(event.phaseId).toBe(1);
      expect(event.originalTokens).toBeGreaterThan(0);
      expect(event.compressionRatio).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Context Health Integration
  // ==========================================================================

  describe('Context Health Integration', () => {
    it('should recommend compression based on health', () => {
      const monitor = createContextHealthMonitor({
        maxTokens: 1000,
        charsPerToken: 4,
      });

      const summarizerWithMonitor = createPhaseSummarizer({}, monitor);

      // Healthy state
      expect(summarizerWithMonitor.getRecommendedCompression()).toBe(5);

      // Add content to hit warning
      monitor.trackContent('a'.repeat(2400), 'test'); // 60%
      expect(summarizerWithMonitor.getRecommendedCompression()).toBe(10);

      // Add more to hit critical
      monitor.trackContent('b'.repeat(800), 'more'); // 80%+
      expect(summarizerWithMonitor.getRecommendedCompression()).toBe(15);
    });

    it('should work without context monitor', () => {
      const summarizerNoMonitor = createPhaseSummarizer({ targetCompression: 8 });
      expect(summarizerNoMonitor.getRecommendedCompression()).toBe(8);
    });
  });

  // ==========================================================================
  // Formatting
  // ==========================================================================

  describe('Formatting', () => {
    it('should format summary for display', async () => {
      const outputs = new Map<string, unknown>([
        ['agent', {
          finding: 'Important result',
          decision: 'Proceed with plan A',
        }],
      ]);

      const summary = await summarizer.summarize(1, outputs);
      const formatted = summarizer.formatSummary(summary);

      expect(formatted).toContain('Phase 1 Summary');
      expect(formatted).toContain('Compression');
      expect(formatted).toContain('Agents');
      expect(formatted).toContain('Summary');
    });
  });

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create default summarizer', () => {
      const s = createPhaseSummarizer();
      expect(s).toBeInstanceOf(PhaseSummarizer);
    });

    it('should create aggressive summarizer', () => {
      const s = createAggressiveSummarizer();
      // Aggressive has higher compression target
      expect(s.getRecommendedCompression()).toBeGreaterThanOrEqual(5);
    });

    it('should create detailed summarizer', () => {
      const s = createDetailedSummarizer();
      // Detailed has lower compression target
      expect(s.getRecommendedCompression()).toBeLessThanOrEqual(10);
    });
  });

  // ==========================================================================
  // Custom Summarization Function
  // ==========================================================================

  describe('Custom Summarization', () => {
    it('should use custom summarize function when provided', async () => {
      const customFn = vi.fn().mockResolvedValue('Custom summary result');

      const customSummarizer = createPhaseSummarizer({
        summarizeFn: customFn,
      });

      const outputs = new Map<string, unknown>([
        ['agent', { data: 'test' }],
      ]);

      const summary = await customSummarizer.summarize(1, outputs);

      expect(customFn).toHaveBeenCalled();
      expect(summary.summary).toBe('Custom summary result');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty outputs', async () => {
      const outputs = new Map<string, unknown>();

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.agentsSummarized).toHaveLength(0);
      expect(summary.compressionRatio).toBeGreaterThan(0);
    });

    it('should handle non-object outputs', async () => {
      const outputs = new Map<string, unknown>([
        ['string-agent', 'just a string'],
        ['number-agent', 42],
        ['null-agent', null],
      ]);

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.summary).toBeDefined();
    });

    it('should handle deeply nested outputs', async () => {
      const outputs = new Map<string, unknown>([
        ['nested-agent', {
          level1: {
            level2: {
              level3: {
                data: 'deep value',
              },
            },
          },
        }],
      ]);

      const summary = await summarizer.summarize(1, outputs);

      expect(summary.summary).toBeDefined();
    });
  });
});
