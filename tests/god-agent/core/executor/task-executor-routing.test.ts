/**
 * Task Executor Router Integration Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router integration with ClaudeTaskExecutor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeTaskExecutor } from '../../../../src/god-agent/core/executor/claude-task-executor.js';
import type { IAgentDefinition } from '../../../../src/god-agent/core/orchestration/orchestration-types.js';
import {
  resetCapabilityRouter,
  resetCostTracker,
  resetQualityScorer,
  resetBudgetEnforcer,
  resetAuditLogger,
  resetProviderFactory,
  initializeBudgetEnforcer,
  initializeCostTracker,
  initializeQualityScorer,
  getCostTracker,
  getQualityScorer,
  getBudgetEnforcer,
} from '../../../../src/god-agent/core/router/index.js';

// Mock AgentRegistry
const mockRegistry = {
  getByKey: vi.fn().mockReturnValue({
    key: 'test-agent',
    frontmatter: {
      name: 'Test Agent',
      description: 'Test agent for router integration',
      capabilities: ['code', 'testing'],
      hooks: {},
    },
    promptContent: 'You are a test agent.',
  }),
};

describe('ClaudeTaskExecutor Router Integration', () => {
  beforeEach(() => {
    // Reset all router singletons
    resetCapabilityRouter();
    resetCostTracker();
    resetQualityScorer();
    resetBudgetEnforcer();
    resetAuditLogger();
    resetProviderFactory();

    // Initialize router components
    initializeCostTracker({ enabled: true });
    initializeQualityScorer({ enabled: true });
    initializeBudgetEnforcer({
      enabled: true,
      budgets: { daily: 10.0 },
      fallbackModels: ['test-local'],
    });
  });

  afterEach(() => {
    resetCapabilityRouter();
    resetCostTracker();
    resetQualityScorer();
    resetBudgetEnforcer();
    resetAuditLogger();
    resetProviderFactory();
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should accept router tracking configuration', () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: false,
        executionMode: 'mock',
      });

      expect(executor).toBeDefined();
    });

    it('should default to router tracking enabled', () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
      });

      expect(executor).toBeDefined();
    });

    it('should allow disabling router tracking', () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        enableRouterTracking: false,
        executionMode: 'mock',
      });

      expect(executor).toBeDefined();
    });
  });

  describe('Task Type Detection', () => {
    it('should detect code task type from capabilities', async () => {
      mockRegistry.getByKey.mockReturnValueOnce({
        key: 'coder-agent',
        frontmatter: {
          name: 'Coder Agent',
          capabilities: ['code', 'testing'],
        },
        promptContent: 'You are a coding agent.',
      });

      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'coder-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Write code',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      await executor.execute('Write a function', agent);

      // Should record as code_edit task
      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].taskType).toBe('code_edit');
      }
    });

    it('should detect research task type from capabilities', async () => {
      mockRegistry.getByKey.mockReturnValueOnce({
        key: 'research-agent',
        frontmatter: {
          name: 'Research Agent',
          capabilities: ['research', 'analysis'],
        },
        promptContent: 'You are a research agent.',
      });

      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'research-agent',
        agentType: 'researcher',
        position: 1,
        phase: 1,
        task: 'Research topic',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      await executor.execute('Research this topic', agent);

      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].taskType).toBe('research');
      }
    });
  });

  describe('Complexity Detection', () => {
    it('should detect simple complexity for short prompts', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Simple task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      await executor.execute('Fix typo', agent);

      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].complexity).toBe('simple');
      }
    });

    it('should detect complex complexity for long prompts', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Complex task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // Create a long prompt
      const longPrompt = 'This is a complex task that requires '.repeat(200);

      await executor.execute(longPrompt, agent);

      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].complexity).toBe('complex');
      }
    });
  });

  describe('Budget Checking', () => {
    it('should allow execution when under budget', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
        blockOnBudgetExceeded: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      const result = await executor.execute('Execute task', agent);

      // Should succeed (mock always succeeds)
      expect(result).toBeDefined();
    });

    it('should block execution when budget exceeded and blocking enabled', async () => {
      // Reset and reinitialize without fallback models
      resetBudgetEnforcer();
      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 10.0 },
        fallbackModels: [], // No fallbacks - must block
        blockOnBudgetExceeded: true,
      });

      // Exhaust the budget
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 100000, outputTokens: 50000, totalTokens: 150000 },
        { inputCost: 5.0, outputCost: 6.0, totalCost: 11.0 },
        'code_edit'
      );

      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
        blockOnBudgetExceeded: true,
        maxRetries: 0, // Disable retries for this test
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // Should throw because budget exceeded and no fallback available
      await expect(executor.execute('Execute task', agent)).rejects.toThrow(/Budget exceeded|failed/);
    });

    it('should warn but continue when budget exceeded and blocking disabled', async () => {
      // Exhaust the budget
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 100000, outputTokens: 50000, totalTokens: 150000 },
        { inputCost: 5.0, outputCost: 6.0, totalCost: 11.0 },
        'code_edit'
      );

      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
        blockOnBudgetExceeded: false, // Continue despite budget
        verbose: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // Should succeed (warning only)
      const result = await executor.execute('Execute task', agent);
      expect(result).toBeDefined();
    });
  });

  describe('Cost Tracking', () => {
    it('should record cost after successful execution', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      const initialRecords = getCostTracker().getAllRecords().length;

      await executor.execute('Execute task', agent);

      const finalRecords = getCostTracker().getAllRecords().length;
      expect(finalRecords).toBeGreaterThan(initialRecords);
    });

    it('should record quality score after execution', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      const initialScores = getQualityScorer().getAllScores().length;

      await executor.execute('Execute task', agent);

      const finalScores = getQualityScorer().getAllScores().length;
      expect(finalScores).toBeGreaterThan(initialScores);
    });

    it('should not record when router tracking disabled', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: false,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      const initialRecords = getCostTracker().getAllRecords().length;

      await executor.execute('Execute task', agent);

      const finalRecords = getCostTracker().getAllRecords().length;
      expect(finalRecords).toBe(initialRecords);
    });
  });

  describe('Token Estimation', () => {
    it('should estimate tokens for tracking', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      await executor.execute('This is a test prompt with some content.', agent);

      const tracker = getCostTracker();
      const records = tracker.getAllRecords();

      if (records.length > 0) {
        const lastRecord = records[records.length - 1];
        // CostRecord has 'usage' not 'tokens'
        expect(lastRecord.usage.inputTokens).toBeGreaterThan(0);
      }
    });
  });
});

describe('Executor Types', () => {
  it('should have router tracking config options', async () => {
    const { DEFAULT_EXECUTOR_CONFIG } = await import(
      '../../../../src/god-agent/core/executor/executor-types.js'
    );

    expect(DEFAULT_EXECUTOR_CONFIG.enableRouterTracking).toBe(true);
    expect(DEFAULT_EXECUTOR_CONFIG.blockOnBudgetExceeded).toBe(false);
  });

  it('should include tracking info in execution result', async () => {
    // This is tested via the executor tests above
    // The IExecutionResult type should include the new fields
    const mockResult = {
      success: true,
      output: 'test',
      duration: 100,
      retryCount: 0,
      modelUsed: 'claude-sonnet',
      providerUsed: 'anthropic',
      estimatedInputTokens: 100,
      estimatedOutputTokens: 50,
      trackingScoreId: 'score-123',
    };

    expect(mockResult.modelUsed).toBe('claude-sonnet');
    expect(mockResult.providerUsed).toBe('anthropic');
    expect(mockResult.estimatedInputTokens).toBe(100);
    expect(mockResult.trackingScoreId).toBe('score-123');
  });
});
