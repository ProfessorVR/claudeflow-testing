/**
 * Tests for Retrieval Orchestrator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RetrievalOrchestrator,
  createRetrievalOrchestrator,
  DEFAULT_ORCHESTRATOR_CONFIG,
  type LLMClient,
  type LLMResponse,
  type GenerateOptions,
} from '../../../../../src/god-agent/cli/dissertation/tools/retrieval-orchestrator.js';
import type { TieredContext } from '../../../../../src/god-agent/cli/context/tiered-context-manager.js';

// Mock LLM client
class MockLLMClient implements LLMClient {
  private responses: LLMResponse[];
  private callCount: number = 0;

  constructor(responses: LLMResponse[]) {
    this.responses = responses;
  }

  async generate(
    prompt: string,
    options: GenerateOptions
  ): Promise<LLMResponse> {
    const response = this.responses[this.callCount] || this.responses[this.responses.length - 1];
    this.callCount++;
    return response;
  }

  getCallCount(): number {
    return this.callCount;
  }
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
    tier3ColdAccessor: {
      search: vi.fn().mockResolvedValue([
        {
          content: 'Test content from Tier 3',
          source: 'Chapter 1, Section 1',
          relevanceScore: 0.9,
        },
      ]),
      getCitation: vi.fn().mockResolvedValue(
        'Author (Year). Title. Publisher.'
      ),
      getFullSection: vi.fn().mockResolvedValue('Full section content...'),
    },
  };
}

describe('RetrievalOrchestrator', () => {
  let orchestrator: RetrievalOrchestrator;
  let mockContext: TieredContext;

  beforeEach(() => {
    mockContext = createMockTieredContext();
    orchestrator = new RetrievalOrchestrator(mockContext);
  });

  describe('constructor', () => {
    it('should create orchestrator with default config', () => {
      const orch = new RetrievalOrchestrator(mockContext);
      expect(orch).toBeInstanceOf(RetrievalOrchestrator);
    });

    it('should accept custom config', () => {
      const orch = new RetrievalOrchestrator(mockContext, {
        maxRetrievalRounds: 3,
        maxContextTokens: 100000,
      });
      expect(orch).toBeInstanceOf(RetrievalOrchestrator);
    });
  });

  describe('generateWithRetrieval - no tools', () => {
    it('should generate without retrieval when no tool calls', async () => {
      const llmClient = new MockLLMClient([
        {
          content: 'This is the generated content.',
          stopReason: 'end_turn',
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await orchestrator.generateWithRetrieval(
        'Test prompt',
        llmClient
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe('This is the generated content.');
      expect(result.retrievalRounds).toBe(0);
      expect(result.totalRetrievalTokens).toBe(0);
      expect(result.executedTools).toHaveLength(0);
    });
  });

  describe('generateWithRetrieval - with tools', () => {
    it('should execute tool calls and continue generation', async () => {
      const llmClient = new MockLLMClient([
        // First response: request tool
        {
          content: 'I need to search for information.',
          toolCalls: [
            {
              id: 'call_1',
              name: 'searchDissertation',
              arguments: { query: 'test query' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 100, outputTokens: 20 },
        },
        // Second response: final content
        {
          content: 'Based on the search results, here is my answer.',
          stopReason: 'end_turn',
          usage: { inputTokens: 150, outputTokens: 30 },
        },
      ]);

      const result = await orchestrator.generateWithRetrieval(
        'Test prompt',
        llmClient
      );

      expect(result.success).toBe(true);
      expect(result.retrievalRounds).toBe(1);
      expect(result.executedTools.length).toBeGreaterThan(0);
      expect(result.totalRetrievalTokens).toBeGreaterThan(0);
    });

    it('should handle multiple retrieval rounds', async () => {
      const llmClient = new MockLLMClient([
        // Round 1: first tool call
        {
          content: 'Need info 1',
          toolCalls: [
            {
              id: 'call_1',
              name: 'searchDissertation',
              arguments: { query: 'query 1' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 100, outputTokens: 10 },
        },
        // Round 2: second tool call
        {
          content: 'Need info 2',
          toolCalls: [
            {
              id: 'call_2',
              name: 'getCitation',
              arguments: { sourceId: 'test-source' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 120, outputTokens: 10 },
        },
        // Final: done
        {
          content: 'Final answer with all info.',
          stopReason: 'end_turn',
          usage: { inputTokens: 150, outputTokens: 20 },
        },
      ]);

      const result = await orchestrator.generateWithRetrieval(
        'Test prompt',
        llmClient
      );

      expect(result.success).toBe(true);
      expect(result.retrievalRounds).toBe(2);
      expect(result.executedTools.length).toBe(2);
    });

    it('should stop at max retrieval rounds', async () => {
      const llmClient = new MockLLMClient([
        // Always request more tools
        {
          content: 'Need more info',
          toolCalls: [
            {
              id: 'call_x',
              name: 'searchDissertation',
              arguments: { query: 'test' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 100, outputTokens: 10 },
        },
      ]);

      const orch = new RetrievalOrchestrator(mockContext, {
        maxRetrievalRounds: 3,
      });

      const result = await orch.generateWithRetrieval('Test prompt', llmClient);

      expect(result.success).toBe(true);
      expect(result.retrievalRounds).toBe(3); // Should stop at max
    });
  });

  describe('token budget management', () => {
    it('should respect max retrieval rounds even with budget', async () => {
      const llmClient = new MockLLMClient([
        {
          content: 'Need info',
          toolCalls: [
            {
              id: 'call_1',
              name: 'searchDissertation',
              arguments: { query: 'test' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 100, outputTokens: 10 },
        },
      ]);

      const orch = new RetrievalOrchestrator(mockContext, {
        maxRetrievalRounds: 3, // Limit rounds
        maxContextTokens: 500000, // Large budget
      });

      const result = await orch.generateWithRetrieval('Test prompt', llmClient);

      expect(result.success).toBe(true);
      // Should stop at maxRetrievalRounds
      expect(result.retrievalRounds).toBeLessThanOrEqual(3);
    });
  });

  describe('error handling', () => {
    it('should handle LLM client errors gracefully', async () => {
      const failingClient: LLMClient = {
        generate: vi.fn().mockRejectedValue(new Error('API error')),
      };

      const result = await orchestrator.generateWithRetrieval(
        'Test prompt',
        failingClient
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('API error');
      expect(result.content).toBe('');
    });
  });

  describe('statistics', () => {
    it('should track orchestration statistics', async () => {
      const llmClient = new MockLLMClient([
        {
          content: 'Need info',
          toolCalls: [
            {
              id: 'call_1',
              name: 'searchDissertation',
              arguments: { query: 'test' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 100, outputTokens: 10 },
        },
        {
          content: 'Final answer',
          stopReason: 'end_turn',
          usage: { inputTokens: 120, outputTokens: 20 },
        },
      ]);

      await orchestrator.generateWithRetrieval('Test prompt', llmClient);

      const stats = orchestrator.getStats();

      expect(stats.retrievalRounds).toBe(1);
      expect(stats.executedTools).toBe(1);
      expect(stats.totalRetrievalTokens).toBeGreaterThan(0);
      expect(stats.toolExecutionStats.totalExecutions).toBe(1);
    });

    it('should calculate average tokens per round', async () => {
      const llmClient = new MockLLMClient([
        {
          content: 'Need info',
          toolCalls: [
            {
              id: 'call_1',
              name: 'searchDissertation',
              arguments: { query: 'test' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 100, outputTokens: 10 },
        },
        {
          content: 'Final',
          stopReason: 'end_turn',
          usage: { inputTokens: 120, outputTokens: 10 },
        },
      ]);

      await orchestrator.generateWithRetrieval('Test prompt', llmClient);

      const stats = orchestrator.getStats();
      expect(stats.averageTokensPerRound).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset orchestrator state', async () => {
      const llmClient = new MockLLMClient([
        {
          content: 'Need info',
          toolCalls: [
            {
              id: 'call_1',
              name: 'searchDissertation',
              arguments: { query: 'test' },
            },
          ],
          stopReason: 'tool_calls',
          usage: { inputTokens: 100, outputTokens: 10 },
        },
        {
          content: 'Done',
          stopReason: 'end_turn',
          usage: { inputTokens: 120, outputTokens: 10 },
        },
      ]);

      await orchestrator.generateWithRetrieval('Test prompt', llmClient);

      orchestrator.reset();

      const stats = orchestrator.getStats();
      expect(stats.retrievalRounds).toBe(0);
      expect(stats.executedTools).toBe(0);
      expect(stats.totalRetrievalTokens).toBe(0);
    });
  });

  describe('createRetrievalOrchestrator factory', () => {
    it('should create orchestrator with default config', () => {
      const orch = createRetrievalOrchestrator(mockContext);
      expect(orch).toBeInstanceOf(RetrievalOrchestrator);
    });

    it('should create orchestrator with custom config', () => {
      const orch = createRetrievalOrchestrator(mockContext, {
        maxRetrievalRounds: 2,
      });
      expect(orch).toBeInstanceOf(RetrievalOrchestrator);
    });
  });
});

describe('DEFAULT_ORCHESTRATOR_CONFIG', () => {
  it('should have reasonable default values', () => {
    expect(DEFAULT_ORCHESTRATOR_CONFIG.maxRetrievalRounds).toBe(5);
    expect(DEFAULT_ORCHESTRATOR_CONFIG.maxContextTokens).toBe(180000);
    expect(DEFAULT_ORCHESTRATOR_CONFIG.maxOutputTokens).toBe(4000);
    expect(DEFAULT_ORCHESTRATOR_CONFIG.tokenBufferForGeneration).toBe(20000);
  });
});
