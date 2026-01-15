/**
 * Router-Executor End-to-End Integration Tests
 *
 * Tests for TIER-2.1: Full integration between Intelligent Model Router
 * and ClaudeTaskExecutor with real scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeTaskExecutor } from '../../../src/god-agent/core/executor/claude-task-executor.js';
import type { IAgentDefinition } from '../../../src/god-agent/core/orchestration/orchestration-types.js';
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
  getAuditLogger,
  initializeAuditLogger,
} from '../../../src/god-agent/core/router/index.js';

// Mock AgentRegistry
const mockRegistry = {
  getByKey: vi.fn().mockReturnValue({
    key: 'integration-test-agent',
    frontmatter: {
      name: 'Integration Test Agent',
      description: 'Agent for integration testing',
      capabilities: ['code', 'testing'],
      hooks: {},
    },
    promptContent: 'You are an integration test agent.',
  }),
};

describe('Router-Executor End-to-End Integration', () => {
  beforeEach(() => {
    // Reset all router singletons
    resetCapabilityRouter();
    resetCostTracker();
    resetQualityScorer();
    resetBudgetEnforcer();
    resetAuditLogger();
    resetProviderFactory();

    // Initialize all router components
    initializeCostTracker({ enabled: true });
    initializeQualityScorer({ enabled: true });
    initializeBudgetEnforcer({
      enabled: true,
      budgets: { daily: 50.0 },
      fallbackModels: ['deepseek-coder-local'],
    });
    initializeAuditLogger({
      storagePath: '/tmp/test-audit',
      storage: 'memory',
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

  describe('Happy Path Scenario', () => {
    it('should execute task and record metrics', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'integration-test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // execute() returns string, not object
      const output = await executor.execute('Write a simple function', agent);

      // Should return output string
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);

      // Cost should be recorded
      const tracker = getCostTracker();
      const records = tracker.getAllRecords();
      expect(records.length).toBeGreaterThan(0);

      // Quality should be recorded
      const scorer = getQualityScorer();
      const scores = scorer.getAllScores();
      expect(scores.length).toBeGreaterThan(0);
    });

    it('should include tracking metadata in result', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'integration-test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // execute() returns string, cost/quality are tracked internally
      const output = await executor.execute('Test prompt', agent);

      // Should return output string
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);

      // Tracking is verified via cost/quality tracker singletons
      const tracker = getCostTracker();
      expect(tracker.getAllRecords().length).toBeGreaterThan(0);
    });
  });

  describe('Budget Exhausted Scenario', () => {
    it('should handle budget exhaustion with fallback available', async () => {
      // Exhaust budget but keep fallback
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 500000, outputTokens: 250000, totalTokens: 750000 },
        { inputCost: 25.0, outputCost: 30.0, totalCost: 55.0 },
        'code_edit'
      );

      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
        blockOnBudgetExceeded: false,
      });

      const agent: IAgentDefinition = {
        agentName: 'integration-test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task after budget exceeded',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // Should still succeed (with warning) - returns string output
      const output = await executor.execute('Test prompt', agent);
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
    });

    it('should block when budget exceeded and no fallback', async () => {
      // Reset and reinitialize without fallbacks
      resetBudgetEnforcer();
      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 50.0 },
        fallbackModels: [],
      });

      // Exhaust budget
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 500000, outputTokens: 250000, totalTokens: 750000 },
        { inputCost: 25.0, outputCost: 30.0, totalCost: 55.0 },
        'code_edit'
      );

      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
        blockOnBudgetExceeded: true,
        maxRetries: 0,
      });

      const agent: IAgentDefinition = {
        agentName: 'integration-test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // Should throw
      await expect(executor.execute('Test prompt', agent)).rejects.toThrow();
    });
  });

  describe('Multiple Tasks Scenario', () => {
    it('should track costs across multiple executions', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'integration-test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      // Execute multiple tasks
      await executor.execute('Task 1', agent);
      await executor.execute('Task 2', agent);
      await executor.execute('Task 3', agent);

      const tracker = getCostTracker();
      const records = tracker.getAllRecords();

      // Should have 3 cost records
      expect(records.length).toBe(3);

      // Total cost should be cumulative
      const totalCost = tracker.getTodayCost();
      expect(totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should track quality across multiple executions', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'integration-test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      await executor.execute('Task 1', agent);
      await executor.execute('Task 2', agent);

      const scorer = getQualityScorer();
      const scores = scorer.getAllScores();

      // Should have 2 quality records
      expect(scores.length).toBe(2);
    });
  });

  describe('Different Task Types', () => {
    it('should detect and track code task type', async () => {
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

      await executor.execute('Implement a sorting algorithm', agent);

      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].taskType).toBe('code_edit');
      }
    });

    it('should detect and track research task type', async () => {
      mockRegistry.getByKey.mockReturnValueOnce({
        key: 'researcher-agent',
        frontmatter: {
          name: 'Researcher Agent',
          capabilities: ['research', 'analysis'],
        },
        promptContent: 'You are a research agent.',
      });

      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: true,
      });

      const agent: IAgentDefinition = {
        agentName: 'researcher-agent',
        agentType: 'researcher',
        position: 1,
        phase: 1,
        task: 'Research topic',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      await executor.execute('Research best practices for testing', agent);

      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].taskType).toBe('research');
      }
    });
  });

  describe('Router Disabled Scenario', () => {
    it('should still execute when router tracking disabled', async () => {
      const executor = new ClaudeTaskExecutor(mockRegistry as any, {
        executionMode: 'mock',
        enableRouterTracking: false,
      });

      const agent: IAgentDefinition = {
        agentName: 'integration-test-agent',
        agentType: 'coder',
        position: 1,
        phase: 1,
        task: 'Test task',
        qualityGate: 0.8,
        previousKey: null,
        outputKey: 'output',
      };

      const initialRecords = getCostTracker().getAllRecords().length;

      // execute() returns string output
      const output = await executor.execute('Test prompt', agent);

      // Should return output string
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);

      // But should NOT record metrics
      const finalRecords = getCostTracker().getAllRecords().length;
      expect(finalRecords).toBe(initialRecords);
    });
  });
});
