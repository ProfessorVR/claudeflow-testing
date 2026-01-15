/**
 * Tests for Local-First Executor
 *
 * Tests the local-first execution pipeline with:
 * - Risk-based routing
 * - Local generation with test verification
 * - Claude review and fix loops
 * - Timeline tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LocalFirstExecutor,
  getLocalFirstExecutor,
  resetLocalFirstExecutor,
  initializeLocalFirstExecutor,
  executeLocalFirst,
  summarizeExecution,
  formatTimeline,
  DefaultTestRunner,
  DefaultDiffGenerator,
  type LocalFirstResult,
  type LocalFirstOptions,
  type ExecutorProvider,
  type LocalFirstExecutorConfig,
} from '../../../../src/god-agent/core/router/local-first-executor.js';
import { resetRiskClassifier } from '../../../../src/god-agent/core/router/risk-classifier.js';
import type { LLMResponse, ProviderType } from '../../../../src/god-agent/core/router/router-types.js';

// ===== MOCK PROVIDERS =====

function createMockProvider(
  model: string,
  response: string | ((prompt: string) => string),
  provider: ProviderType = 'anthropic'
): ExecutorProvider {
  return {
    provider,
    model,
    complete: vi.fn().mockImplementation(async (prompt: string): Promise<LLMResponse> => {
      const content = typeof response === 'function' ? response(prompt) : response;
      return {
        content,
        model,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        latencyMs: 100,
      };
    }),
  };
}

function createFailingProvider(error: string): ExecutorProvider {
  return {
    provider: 'anthropic',
    model: 'claude-3-opus',
    complete: vi.fn().mockRejectedValue(new Error(error)),
  };
}

// ===== TESTS =====

describe('LocalFirstExecutor', () => {
  beforeEach(() => {
    resetLocalFirstExecutor();
    resetRiskClassifier();
  });

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const executor = new LocalFirstExecutor();
      expect(executor).toBeDefined();
      expect(executor.hasLocalProvider()).toBe(false);
      expect(executor.hasExpensiveProvider()).toBe(false);
    });

    it('should create with custom configuration', () => {
      const localProvider = createMockProvider('qwen-coder', 'local response', 'vllm');
      const expensiveProvider = createMockProvider('claude-opus', 'claude response');

      const executor = new LocalFirstExecutor({
        localProvider,
        expensiveProvider,
      });

      expect(executor.hasLocalProvider()).toBe(true);
      expect(executor.hasExpensiveProvider()).toBe(true);
    });

    it('should use default options from config', () => {
      const executor = new LocalFirstExecutor({
        defaultOptions: {
          maxIterations: 5,
          runTests: false,
        },
      });
      expect(executor).toBeDefined();
    });
  });

  describe('Risk-Based Routing', () => {
    it('should route high-risk tasks to expensive model', async () => {
      const expensiveProvider = createMockProvider('claude-opus', 'architecture design');
      const executor = new LocalFirstExecutor({ expensiveProvider });

      const result = await executor.execute('Design the system architecture for our API');

      expect(result.generatedBy).toBe('claude');
      expect(result.riskAssessment.recommendedRoute).toBe('expensive');
      expect(result.output).toBe('architecture design');
    });

    it('should route low-risk tasks to local model', async () => {
      const localProvider = createMockProvider('qwen-coder', 'function code', 'vllm');
      const executor = new LocalFirstExecutor({
        localProvider,
        defaultOptions: { runTests: false, requireReview: false },
      });

      const result = await executor.execute('Implement a function to add two numbers');

      expect(result.generatedBy).toBe('local');
      expect(result.riskAssessment.recommendedRoute).toBe('local');
      expect(result.output).toBe('function code');
    });

    it('should fallback to expensive when local unavailable', async () => {
      const expensiveProvider = createMockProvider('claude-opus', 'fallback response');
      const executor = new LocalFirstExecutor({ expensiveProvider });

      const result = await executor.execute('Implement a simple function', {
        forceRoute: 'local',
      });

      expect(result.generatedBy).toBe('claude');
    });

    it('should respect forceRoute option', async () => {
      const expensiveProvider = createMockProvider('claude-opus', 'forced claude');
      const localProvider = createMockProvider('qwen-coder', 'local', 'vllm');
      const executor = new LocalFirstExecutor({
        localProvider,
        expensiveProvider,
        defaultOptions: { runTests: false, requireReview: false },
      });

      const result = await executor.execute('Implement a function', {
        forceRoute: 'expensive',
      });

      expect(result.generatedBy).toBe('claude');
      expect(result.output).toBe('forced claude');
    });
  });

  describe('Local Execution with Tests', () => {
    it('should run tests after local generation', async () => {
      const localProvider = createMockProvider('qwen-coder', 'function code', 'vllm');
      const testRunner = {
        runTests: vi.fn().mockResolvedValue({
          passed: true,
          testsRun: 5,
          testsPassed: 5,
          testsFailed: 0,
          output: 'All tests passed',
          executionTimeMs: 100,
          failedTests: [],
        }),
      };

      const executor = new LocalFirstExecutor({
        localProvider,
        testRunner,
        defaultOptions: { runTests: true, requireReview: false },
      });

      const result = await executor.execute('Implement a function');

      expect(testRunner.runTests).toHaveBeenCalled();
      expect(result.testsPassed).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should attempt Claude fix when tests fail', async () => {
      const localProvider = createMockProvider('qwen-coder', 'buggy code', 'vllm');
      const expensiveProvider = createMockProvider('claude-opus', 'fixed code');
      const testRunner = {
        runTests: vi.fn()
          .mockResolvedValueOnce({
            passed: false,
            testsRun: 5,
            testsPassed: 3,
            testsFailed: 2,
            output: 'Test failed',
            executionTimeMs: 100,
            failedTests: ['test1', 'test2'],
          })
          .mockResolvedValueOnce({
            passed: true,
            testsRun: 5,
            testsPassed: 5,
            testsFailed: 0,
            output: 'All passed',
            executionTimeMs: 100,
            failedTests: [],
          }),
      };

      const executor = new LocalFirstExecutor({
        localProvider,
        expensiveProvider,
        testRunner,
        defaultOptions: { runTests: true, requireReview: false, maxIterations: 2 },
      });

      const result = await executor.execute('Implement a function');

      expect(expensiveProvider.complete).toHaveBeenCalled();
      expect(result.timeline.claudeFix).toBeDefined();
    });
  });

  describe('Claude Review', () => {
    it('should request Claude review for local_then_review route', async () => {
      const localProvider = createMockProvider('qwen-coder', 'generated code', 'vllm');
      const expensiveProvider = createMockProvider('claude-opus', `APPROVED: yes
CONFIDENCE: 0.9
FEEDBACK: Code looks good
ISSUES: none
SUGGESTIONS: none`);

      const executor = new LocalFirstExecutor({
        localProvider,
        expensiveProvider,
        defaultOptions: { runTests: false, requireReview: true },
      });

      // Force local_then_review route
      const result = await executor.execute('Refactor this function for better readability', {
        forceRoute: 'local_then_review',
      });

      expect(result.reviewedBy).toBe('claude');
      expect(result.success).toBe(true);
    });

    it('should retry when Claude review rejects', async () => {
      const localProvider = createMockProvider('qwen-coder', 'initial code', 'vllm');
      let callCount = 0;
      const expensiveProvider = createMockProvider('claude-opus', (prompt) => {
        callCount++;
        if (prompt.includes('reviewing code')) {
          return callCount < 3
            ? `APPROVED: no\nCONFIDENCE: 0.4\nFEEDBACK: Needs improvement\nISSUES: missing error handling\nSUGGESTIONS: add try-catch`
            : `APPROVED: yes\nCONFIDENCE: 0.9\nFEEDBACK: Good\nISSUES: none\nSUGGESTIONS: none`;
        }
        return 'improved code';
      });

      const executor = new LocalFirstExecutor({
        localProvider,
        expensiveProvider,
        defaultOptions: { runTests: false, requireReview: true, maxIterations: 3 },
      });

      const result = await executor.execute('Refactor this function', {
        forceRoute: 'local_then_review',
      });

      expect(result.iterations).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should return error when no providers configured', async () => {
      const executor = new LocalFirstExecutor();
      const result = await executor.execute('Any prompt');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No providers configured');
    });

    it('should handle expensive provider failure gracefully', async () => {
      const expensiveProvider = createFailingProvider('API Error');
      const executor = new LocalFirstExecutor({ expensiveProvider });

      const result = await executor.execute('Design architecture');

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('API Error'))).toBe(true);
    });

    it('should handle local provider failure and continue', async () => {
      const localProvider = createFailingProvider('Local model timeout');
      const expensiveProvider = createMockProvider('claude-opus', 'fallback');
      const executor = new LocalFirstExecutor({
        localProvider,
        expensiveProvider,
        defaultOptions: { runTests: false, requireReview: false },
      });

      const result = await executor.execute('Implement a function');

      expect(result.errors.some(e => e.includes('Local generation failed'))).toBe(true);
    });
  });

  describe('Timeline Tracking', () => {
    it('should track risk assessment time', async () => {
      const expensiveProvider = createMockProvider('claude-opus', 'response');
      const executor = new LocalFirstExecutor({ expensiveProvider });

      const result = await executor.execute('Design architecture');

      expect(result.timeline.riskAssessment).toBeGreaterThanOrEqual(0);
      expect(result.timeline.total).toBeGreaterThanOrEqual(0);
      expect(result.timeline).toHaveProperty('riskAssessment');
      expect(result.timeline).toHaveProperty('total');
    });

    it('should track local generation time', async () => {
      const localProvider = createMockProvider('qwen-coder', 'code', 'vllm');
      const executor = new LocalFirstExecutor({
        localProvider,
        defaultOptions: { runTests: false, requireReview: false },
      });

      const result = await executor.execute('Implement a function');

      expect(result.timeline.localGeneration).toBeGreaterThanOrEqual(0);
    });

    it('should track Claude direct time for high-risk', async () => {
      const expensiveProvider = createMockProvider('claude-opus', 'response');
      const executor = new LocalFirstExecutor({ expensiveProvider });

      const result = await executor.execute('Design the security architecture');

      expect(result.timeline.claudeDirect).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Diff Generation', () => {
    it('should generate diff when original content provided', async () => {
      const localProvider = createMockProvider('qwen-coder', 'new code', 'vllm');
      const executor = new LocalFirstExecutor({
        localProvider,
        defaultOptions: { runTests: false, requireReview: false },
      });

      const result = await executor.execute('Update the function', {
        originalContent: 'old code',
      });

      expect(result.diff).toBeDefined();
      expect(result.diff).toContain('-');
      expect(result.diff).toContain('+');
    });
  });

  describe('Provider Management', () => {
    it('should allow setting providers after construction', () => {
      const executor = new LocalFirstExecutor();
      expect(executor.hasLocalProvider()).toBe(false);

      const localProvider = createMockProvider('qwen-coder', 'code', 'vllm');
      executor.setLocalProvider(localProvider);
      expect(executor.hasLocalProvider()).toBe(true);
    });

    it('should allow setting expensive provider after construction', () => {
      const executor = new LocalFirstExecutor();
      expect(executor.hasExpensiveProvider()).toBe(false);

      const expensiveProvider = createMockProvider('claude-opus', 'response');
      executor.setExpensiveProvider(expensiveProvider);
      expect(executor.hasExpensiveProvider()).toBe(true);
    });
  });
});

describe('DefaultTestRunner', () => {
  it('should return default passing result', async () => {
    const runner = new DefaultTestRunner();
    const result = await runner.runTests();

    expect(result.passed).toBe(true);
    expect(result.testsRun).toBe(0);
    expect(result.output).toBe('No tests configured');
  });
});

describe('DefaultDiffGenerator', () => {
  const generator = new DefaultDiffGenerator();

  it('should handle new content', () => {
    const diff = generator.generateDiff('', 'new content');
    expect(diff).toContain('+++');
    expect(diff).toContain('new content');
  });

  it('should handle removed content', () => {
    const diff = generator.generateDiff('old content', '');
    expect(diff).toContain('---');
    expect(diff).toContain('old content');
  });

  it('should show line-by-line diff', () => {
    const diff = generator.generateDiff('line1\nline2', 'line1\nline3');
    expect(diff).toContain('- line2');
    expect(diff).toContain('+ line3');
  });

  it('should handle identical content', () => {
    const diff = generator.generateDiff('same', 'same');
    expect(diff).toContain('same');
    expect(diff).not.toContain('-');
    expect(diff).not.toContain('+');
  });
});

describe('Singleton Functions', () => {
  beforeEach(() => {
    resetLocalFirstExecutor();
    resetRiskClassifier();
  });

  it('getLocalFirstExecutor should return same instance', () => {
    const executor1 = getLocalFirstExecutor();
    const executor2 = getLocalFirstExecutor();
    expect(executor1).toBe(executor2);
  });

  it('getLocalFirstExecutor with config should create new instance', () => {
    const executor1 = getLocalFirstExecutor();
    const executor2 = getLocalFirstExecutor({ defaultOptions: { maxIterations: 5 } });
    expect(executor1).not.toBe(executor2);
  });

  it('initializeLocalFirstExecutor should create configured instance', () => {
    const executor = initializeLocalFirstExecutor({
      defaultOptions: { maxIterations: 10 },
    });
    expect(executor).toBeDefined();
    expect(getLocalFirstExecutor()).toBe(executor);
  });

  it('resetLocalFirstExecutor should clear instance', () => {
    const executor1 = getLocalFirstExecutor();
    resetLocalFirstExecutor();
    const executor2 = getLocalFirstExecutor();
    expect(executor1).not.toBe(executor2);
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    resetLocalFirstExecutor();
    resetRiskClassifier();
  });

  describe('executeLocalFirst', () => {
    it('should execute with default executor', async () => {
      const expensiveProvider = createMockProvider('claude-opus', 'response');
      const result = await executeLocalFirst('Design architecture', {}, { expensiveProvider });

      expect(result.generatedBy).toBe('claude');
    });
  });

  describe('summarizeExecution', () => {
    it('should format successful Claude execution', () => {
      const result: LocalFirstResult = {
        success: true,
        output: 'code',
        generatedBy: 'claude',
        testsPassed: null,
        iterations: 1,
        riskAssessment: {
          riskLevel: 'high',
          feedbackSpeed: 'slow',
          reversibility: 'difficult',
          verificationMethod: 'manual',
          recommendedRoute: 'expensive',
          reason: 'test',
          confidence: 0.9,
          signals: [],
        },
        timeline: { riskAssessment: 10, claudeDirect: 500, total: 510 },
        errors: [],
      };

      const summary = summarizeExecution(result);
      expect(summary).toContain('Claude (direct)');
      expect(summary).toContain('1 iter');
    });

    it('should format successful local execution with review', () => {
      const result: LocalFirstResult = {
        success: true,
        output: 'code',
        generatedBy: 'local',
        reviewedBy: 'claude',
        testsPassed: true,
        iterations: 1,
        riskAssessment: {
          riskLevel: 'medium',
          feedbackSpeed: 'fast',
          reversibility: 'easy',
          verificationMethod: 'tests',
          recommendedRoute: 'local_then_review',
          reason: 'test',
          confidence: 0.8,
          signals: [],
        },
        timeline: { riskAssessment: 5, localGeneration: 200, claudeReview: 300, total: 505 },
        errors: [],
      };

      const summary = summarizeExecution(result);
      expect(summary).toContain('Local');
      expect(summary).toContain('Claude review');
      expect(summary).toContain('tests passed');
    });

    it('should format failed execution', () => {
      const result: LocalFirstResult = {
        success: false,
        output: '',
        generatedBy: 'local',
        testsPassed: false,
        iterations: 2,
        riskAssessment: {
          riskLevel: 'low',
          feedbackSpeed: 'fast',
          reversibility: 'easy',
          verificationMethod: 'tests',
          recommendedRoute: 'local',
          reason: 'test',
          confidence: 0.9,
          signals: [],
        },
        timeline: { riskAssessment: 5, localGeneration: 400, testExecution: 100, total: 505 },
        errors: ['Test failed'],
      };

      const summary = summarizeExecution(result);
      expect(summary).toContain('tests failed');
    });
  });

  describe('formatTimeline', () => {
    it('should format all timeline components', () => {
      const timeline = {
        riskAssessment: 10,
        localGeneration: 200,
        testExecution: 100,
        claudeReview: 300,
        claudeFix: 150,
        total: 760,
      };

      const formatted = formatTimeline(timeline);
      expect(formatted).toContain('Risk: 10ms');
      expect(formatted).toContain('Local: 200ms');
      expect(formatted).toContain('Tests: 100ms');
      expect(formatted).toContain('Review: 300ms');
      expect(formatted).toContain('Fix: 150ms');
      expect(formatted).toContain('Total: 760ms');
    });

    it('should format Claude direct timeline', () => {
      const timeline = {
        riskAssessment: 5,
        claudeDirect: 500,
        total: 505,
      };

      const formatted = formatTimeline(timeline);
      expect(formatted).toContain('Claude: 500ms');
      expect(formatted).not.toContain('Local');
    });
  });
});
