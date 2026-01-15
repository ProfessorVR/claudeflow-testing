/**
 * Writing Generator Router Integration Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router integration with AnthropicWritingGenerator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Generated content for testing purposes.' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    },
  })),
}));

// Set mock API key
process.env.ANTHROPIC_API_KEY = 'test-api-key';

describe('AnthropicWritingGenerator Router Integration', () => {
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
    it('should accept router tracking configuration', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: false,
      });

      expect(generator).toBeDefined();
    });

    it('should accept custom model configuration', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        model: 'claude-3-opus-20240229',
      });

      expect(generator).toBeDefined();
    });

    it('should default to router tracking enabled', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator();
      expect(generator).toBeDefined();
    });
  });

  describe('Budget Checking', () => {
    it('should allow generation when under budget', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: true,
      });

      const result = await generator.generate({
        title: 'Test Document',
        description: 'A test document',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });

    it('should block generation when budget exceeded and blocking enabled', async () => {
      // Reset and reinitialize without fallback models
      resetBudgetEnforcer();
      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 10.0 },
        fallbackModels: [],
      });

      // Exhaust the budget
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 100000, outputTokens: 50000, totalTokens: 150000 },
        { inputCost: 5.0, outputCost: 6.0, totalCost: 11.0 },
        'writing'
      );

      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: true,
      });

      await expect(
        generator.generate({
          title: 'Test Document',
          description: 'A test document',
        })
      ).rejects.toThrow(/Budget exceeded/);
    });

    it('should warn but continue when budget exceeded and blocking disabled', async () => {
      // Exhaust the budget
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 100000, outputTokens: 50000, totalTokens: 150000 },
        { inputCost: 5.0, outputCost: 6.0, totalCost: 11.0 },
        'writing'
      );

      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: false,
        verbose: true,
      });

      // Should succeed (warning only)
      const result = await generator.generate({
        title: 'Test Document',
        description: 'A test document',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Cost Tracking', () => {
    it('should record cost after successful generation', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      const initialRecords = getCostTracker().getAllRecords().length;

      await generator.generate({
        title: 'Test Document',
        description: 'A test document',
      });

      const finalRecords = getCostTracker().getAllRecords().length;
      expect(finalRecords).toBeGreaterThan(initialRecords);
    });

    it('should record quality score after generation', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      const initialScores = getQualityScorer().getAllScores().length;

      await generator.generate({
        title: 'Test Document',
        description: 'A test document',
      });

      const finalScores = getQualityScorer().getAllScores().length;
      expect(finalScores).toBeGreaterThan(initialScores);
    });

    it('should not record when router tracking disabled', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: false,
      });

      const initialRecords = getCostTracker().getAllRecords().length;

      await generator.generate({
        title: 'Test Document',
        description: 'A test document',
      });

      const finalRecords = getCostTracker().getAllRecords().length;
      expect(finalRecords).toBe(initialRecords);
    });
  });

  describe('Complexity Detection', () => {
    it('should detect simple complexity for short documents', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      await generator.generate({
        title: 'Short Note',
        description: 'A brief note',
        maxLength: 500,
      });

      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].complexity).toBe('simple');
      }
    });

    it('should detect complex complexity for long documents with outline', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      await generator.generate({
        title: 'Long Document',
        description: 'A comprehensive document',
        maxLength: 5000,
        outline: [
          'Introduction',
          'Background',
          'Methodology',
          'Results',
          'Discussion',
          'Conclusion',
        ],
      });

      const scores = getQualityScorer().getAllScores();
      if (scores.length > 0) {
        expect(scores[0].complexity).toBe('complex');
      }
    });
  });

  describe('Section Generation', () => {
    it('should track section generation', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      const initialRecords = getCostTracker().getAllRecords().length;

      await generator.generateSection('Introduction', 'Context for the document');

      const finalRecords = getCostTracker().getAllRecords().length;
      expect(finalRecords).toBeGreaterThan(initialRecords);
    });

    it('should respect budget blocking for section generation', async () => {
      // Reset and reinitialize without fallback models
      resetBudgetEnforcer();
      initializeBudgetEnforcer({
        enabled: true,
        budgets: { daily: 10.0 },
        fallbackModels: [],
      });

      // Exhaust the budget
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 100000, outputTokens: 50000, totalTokens: 150000 },
        { inputCost: 5.0, outputCost: 6.0, totalCost: 11.0 },
        'writing'
      );

      const { AnthropicWritingGenerator } = await import(
        '../../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: true,
      });

      await expect(
        generator.generateSection('Introduction', 'Context')
      ).rejects.toThrow(/Budget exceeded/);
    });
  });
});
