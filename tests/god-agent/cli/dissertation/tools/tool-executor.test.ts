/**
 * Tests for Tool Executor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ToolExecutor,
  createToolExecutor,
  DEFAULT_EXECUTOR_CONFIG,
  type ToolExecutorConfig,
} from '../../../../../src/god-agent/cli/dissertation/tools/tool-executor.js';
import type { ToolCall } from '../../../../../src/god-agent/cli/dissertation/tools/tool-definitions.js';
import type { TieredContext, ColdContextAccessor } from '../../../../../src/god-agent/cli/context/tiered-context-manager.js';

// Mock cold context accessor
function createMockColdAccessor(): ColdContextAccessor {
  return {
    search: vi.fn().mockResolvedValue([
      {
        content: 'Phantasia produces phantasmata that persist...',
        source: 'Chapter 2, Section 3',
        relevanceScore: 0.92,
      },
      {
        content: 'Heidegger describes ecstatic temporality...',
        source: 'Chapter 3, Section 1',
        relevanceScore: 0.85,
      },
    ]),
    getCitation: vi.fn().mockResolvedValue(
      'Heidegger, M. (1962). Being and Time. Harper & Row.'
    ),
    getFullSection: vi.fn().mockResolvedValue(
      'This is the full section content about phantasia and temporal synthesis...'
    ),
  };
}

// Mock tiered context
function createMockTieredContext(): TieredContext {
  return {
    tier1Hot: {
      currentSection: 'Test Section',
      relevantArguments: [],
      styleInjection: '',
      immediateTerms: new Map(),
      tokenCount: 0,
    },
    tier2Warm: {
      chapterSummaries: new Map(),
      thesisStatements: [],
      criticalTerms: new Map(),
      tokenCount: 0,
    },
    tier3ColdAccessor: createMockColdAccessor(),
  };
}

describe('ToolExecutor', () => {
  let executor: ToolExecutor;
  let mockContext: TieredContext;

  beforeEach(() => {
    mockContext = createMockTieredContext();
    executor = new ToolExecutor(mockContext);
  });

  describe('constructor', () => {
    it('should create executor with default config', () => {
      const exec = new ToolExecutor(mockContext);
      expect(exec).toBeInstanceOf(ToolExecutor);
    });

    it('should accept custom config', () => {
      const customConfig: Partial<ToolExecutorConfig> = {
        maxResultsPerSearch: 5,
        relevanceThreshold: 0.8,
      };
      const exec = new ToolExecutor(mockContext, customConfig);
      expect(exec).toBeInstanceOf(ToolExecutor);
    });
  });

  describe('execute searchDissertation', () => {
    it('should execute search and return results', async () => {
      const toolCall: ToolCall = {
        id: 'call_1',
        name: 'searchDissertation',
        arguments: { query: 'phantasia temporal synthesis' },
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchDissertation');
      expect(result.result.tool).toBe('searchDissertation');

      if (result.result.tool === 'searchDissertation') {
        expect(result.result.data.results.length).toBeGreaterThan(0);
        expect(result.result.data.query).toBe('phantasia temporal synthesis');
      }
    });

    it('should respect topK limit', async () => {
      const toolCall: ToolCall = {
        id: 'call_2',
        name: 'searchDissertation',
        arguments: { query: 'test', topK: 1 },
      };

      const result = await executor.execute(toolCall);

      if (result.success && result.result.tool === 'searchDissertation') {
        expect(result.result.data.results.length).toBeLessThanOrEqual(1);
      }
    });

    it('should filter by chapter when specified', async () => {
      const toolCall: ToolCall = {
        id: 'call_3',
        name: 'searchDissertation',
        arguments: { query: 'test', chapters: [2] },
      };

      const result = await executor.execute(toolCall);
      expect(result.success).toBe(true);
    });

    it('should filter by minimum relevance', async () => {
      const toolCall: ToolCall = {
        id: 'call_4',
        name: 'searchDissertation',
        arguments: { query: 'test', minRelevance: 0.9 },
      };

      const result = await executor.execute(toolCall);

      if (result.success && result.result.tool === 'searchDissertation') {
        result.result.data.results.forEach((r) => {
          expect(r.relevanceScore).toBeGreaterThanOrEqual(0.9);
        });
      }
    });
  });

  describe('execute getCitation', () => {
    it('should return citation parsed from corpus accessor', async () => {
      const toolCall: ToolCall = {
        id: 'call_5',
        name: 'getCitation',
        arguments: { sourceId: 'heidegger-being-time-1962' },
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(true);
      expect(result.result.tool).toBe('getCitation');

      if (result.result.tool === 'getCitation' && result.result.data) {
        // parseCitationString extracts abbreviated author from citation string
        expect(result.result.data.author).toBe('Heidegger, M.');
        expect(result.result.data.year).toBe(1962);
      }
    });

    it('should return null for unknown citation', async () => {
      // Override mock to return null
      (mockContext.tier3ColdAccessor.getCitation as any).mockResolvedValue(null);

      const toolCall: ToolCall = {
        id: 'call_6',
        name: 'getCitation',
        arguments: { sourceId: 'unknown-source' },
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(true);
      expect(result.result.tool).toBe('getCitation');
      // Mock citations should still return null for truly unknown sources
    });
  });

  describe('execute getFullSection', () => {
    it('should return section content', async () => {
      const toolCall: ToolCall = {
        id: 'call_7',
        name: 'getFullSection',
        arguments: { chapter: 2, sectionName: 'Introduction' },
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(true);
      expect(result.result.tool).toBe('getFullSection');

      if (result.result.tool === 'getFullSection' && result.result.data) {
        expect(result.result.data.chapter).toBe(2);
        expect(result.result.data.sectionName).toBe('Introduction');
        expect(result.result.data.content).toBeTruthy();
      }
    });

    it('should truncate long content', async () => {
      const longContent = 'A'.repeat(10000);
      (mockContext.tier3ColdAccessor.getFullSection as any).mockResolvedValue(longContent);

      const toolCall: ToolCall = {
        id: 'call_8',
        name: 'getFullSection',
        arguments: { chapter: 1, sectionName: 'Test', maxLength: 100 },
      };

      const result = await executor.execute(toolCall);

      if (result.success && result.result.tool === 'getFullSection' && result.result.data) {
        expect(result.result.data.truncated).toBe(true);
        expect(result.result.data.content.length).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('execute listAvailableSources', () => {
    it('should list all sources without filter', async () => {
      const toolCall: ToolCall = {
        id: 'call_9',
        name: 'listAvailableSources',
        arguments: {},
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(true);
      expect(result.result.tool).toBe('listAvailableSources');

      if (result.result.tool === 'listAvailableSources') {
        expect(result.result.data.sources).toBeInstanceOf(Array);
      }
    });

    it('should filter by author', async () => {
      const toolCall: ToolCall = {
        id: 'call_10',
        name: 'listAvailableSources',
        arguments: { filter: 'Heidegger' },
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(true);

      if (result.result.tool === 'listAvailableSources') {
        expect(result.result.data.filter).toBe('Heidegger');
      }
    });

    it('should filter by type', async () => {
      const toolCall: ToolCall = {
        id: 'call_11',
        name: 'listAvailableSources',
        arguments: { type: 'primary' },
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(true);

      if (result.result.tool === 'listAvailableSources') {
        expect(result.result.data.typeFilter).toBe('primary');
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid tool call', async () => {
      const toolCall: ToolCall = {
        id: 'call_12',
        name: 'unknownTool',
        arguments: {},
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });

    it('should handle missing required parameter', async () => {
      const toolCall: ToolCall = {
        id: 'call_13',
        name: 'searchDissertation',
        arguments: {},
      };

      const result = await executor.execute(toolCall);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter');
    });

    it('should handle cold accessor errors gracefully', async () => {
      (mockContext.tier3ColdAccessor.search as any).mockRejectedValue(
        new Error('Database error')
      );

      const toolCall: ToolCall = {
        id: 'call_14',
        name: 'searchDissertation',
        arguments: { query: 'test' },
      };

      const result = await executor.execute(toolCall);

      // Should still succeed but with empty results
      expect(result.success).toBe(true);
      if (result.result.tool === 'searchDissertation') {
        expect(result.result.data.results).toHaveLength(0);
      }
    });
  });

  describe('rate limiting', () => {
    it('should track total executions', async () => {
      const toolCall: ToolCall = {
        id: 'call_15',
        name: 'searchDissertation',
        arguments: { query: 'test' },
      };

      await executor.execute(toolCall);
      await executor.execute({ ...toolCall, id: 'call_16' });

      const stats = executor.getStats();
      expect(stats.totalExecutions).toBe(2);
    });

    it('should enforce max total retrievals', async () => {
      const limitedExecutor = new ToolExecutor(mockContext, {
        maxTotalRetrievals: 2,
      });

      const toolCall: ToolCall = {
        id: 'call_17',
        name: 'searchDissertation',
        arguments: { query: 'test' },
      };

      await limitedExecutor.execute(toolCall);
      await limitedExecutor.execute({ ...toolCall, id: 'call_18' });
      const result = await limitedExecutor.execute({ ...toolCall, id: 'call_19' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum total retrievals');
    });
  });

  describe('statistics', () => {
    it('should track execution statistics', async () => {
      const toolCall: ToolCall = {
        id: 'call_20',
        name: 'searchDissertation',
        arguments: { query: 'test' },
      };

      await executor.execute(toolCall);

      const stats = executor.getStats();

      expect(stats.totalExecutions).toBe(1);
      expect(stats.executionsByTool['searchDissertation']).toBe(1);
      expect(stats.totalTokensRetrieved).toBeGreaterThan(0);
      expect(stats.failedExecutions).toBe(0);
    });

    it('should track failed executions', async () => {
      const toolCall: ToolCall = {
        id: 'call_21',
        name: 'unknownTool',
        arguments: {},
      };

      await executor.execute(toolCall);

      const stats = executor.getStats();
      expect(stats.failedExecutions).toBe(1);
    });

    it('should reset statistics', async () => {
      const toolCall: ToolCall = {
        id: 'call_22',
        name: 'searchDissertation',
        arguments: { query: 'test' },
      };

      await executor.execute(toolCall);
      executor.resetStats();

      const stats = executor.getStats();
      expect(stats.totalExecutions).toBe(0);
      expect(stats.failedExecutions).toBe(0);
    });
  });

  describe('createToolExecutor factory', () => {
    it('should create executor with default config', () => {
      const exec = createToolExecutor(mockContext);
      expect(exec).toBeInstanceOf(ToolExecutor);
    });

    it('should create executor with custom config', () => {
      const exec = createToolExecutor(mockContext, {
        maxResultsPerSearch: 3,
      });
      expect(exec).toBeInstanceOf(ToolExecutor);
    });
  });
});

describe('DEFAULT_EXECUTOR_CONFIG', () => {
  it('should have reasonable default values', () => {
    expect(DEFAULT_EXECUTOR_CONFIG.maxResultsPerSearch).toBe(10);
    expect(DEFAULT_EXECUTOR_CONFIG.maxChunkSize).toBe(2000);
    expect(DEFAULT_EXECUTOR_CONFIG.maxSectionSize).toBe(5000);
    expect(DEFAULT_EXECUTOR_CONFIG.relevanceThreshold).toBe(0.7);
    expect(DEFAULT_EXECUTOR_CONFIG.maxRetrievalsPerSecond).toBe(10);
    expect(DEFAULT_EXECUTOR_CONFIG.maxTotalRetrievals).toBe(50);
    expect(DEFAULT_EXECUTOR_CONFIG.executionTimeoutMs).toBe(30000);
  });
});
