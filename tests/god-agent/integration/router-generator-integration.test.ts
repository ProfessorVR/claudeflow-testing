/**
 * Router-Generator End-to-End Integration Tests
 *
 * Tests for TIER-2.1: Full integration between Intelligent Model Router
 * and AnthropicWritingGenerator with real scenarios
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
  initializeAuditLogger,
  getCostTracker,
  getQualityScorer,
} from '../../../src/god-agent/core/router/index.js';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: `# Test Document

This is a comprehensive test document generated for integration testing purposes.

## Introduction

The introduction provides an overview of the topic at hand.

## Main Content

The main content section contains the bulk of the information.

## Conclusion

The conclusion summarizes the key points discussed above.`
        }],
        usage: { input_tokens: 200, output_tokens: 150 },
      }),
    },
  })),
}));

// Set mock API key
process.env.ANTHROPIC_API_KEY = 'test-api-key';

describe('Router-Generator End-to-End Integration', () => {
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
    it('should generate document and record metrics', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      const result = await generator.generate({
        title: 'Integration Test Document',
        description: 'A test document for integration testing',
        maxLength: 500,
      });

      // Should succeed
      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.wordCount).toBeGreaterThan(0);

      // Cost should be recorded
      const tracker = getCostTracker();
      const records = tracker.getAllRecords();
      expect(records.length).toBeGreaterThan(0);

      // Quality should be recorded
      const scorer = getQualityScorer();
      const scores = scorer.getAllScores();
      expect(scores.length).toBeGreaterThan(0);
    });

    it('should include metadata in result', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      const result = await generator.generate({
        title: 'Test',
        description: 'Test',
      });

      // Metadata should be populated
      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBeTruthy();
      expect(result.metadata.tokensUsed).toBeGreaterThan(0);
      // Latency may be 0 in mock mode
      expect(typeof result.metadata.latencyMs).toBe('number');
    });
  });

  describe('Multiple Documents Scenario', () => {
    it('should track costs across multiple generations', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      // Generate multiple documents
      await generator.generate({ title: 'Doc 1', description: 'First' });
      await generator.generate({ title: 'Doc 2', description: 'Second' });
      await generator.generate({ title: 'Doc 3', description: 'Third' });

      const tracker = getCostTracker();
      const records = tracker.getAllRecords();

      // Should have 3 cost records
      expect(records.length).toBe(3);

      // Total cost should be cumulative
      const totalCost = tracker.getTodayCost();
      expect(totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should track quality scores for each generation', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      await generator.generate({ title: 'Doc 1', description: 'First' });
      await generator.generate({ title: 'Doc 2', description: 'Second' });

      const scorer = getQualityScorer();
      const scores = scorer.getAllScores();

      // Should have 2 quality records
      expect(scores.length).toBe(2);

      // All should be writing type
      expect(scores.every(s => s.taskType === 'writing')).toBe(true);
    });
  });

  describe('Complexity Detection', () => {
    it('should detect simple complexity for short documents', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      await generator.generate({
        title: 'Short Note',
        description: 'A brief note',
        maxLength: 300,
      });

      const scores = getQualityScorer().getAllScores();
      expect(scores.length).toBe(1);
      expect(scores[0].complexity).toBe('simple');
    });

    it('should detect complex complexity for long documents with outline', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      await generator.generate({
        title: 'Comprehensive Report',
        description: 'A detailed report',
        maxLength: 5000,
        outline: [
          'Executive Summary',
          'Introduction',
          'Background',
          'Methodology',
          'Findings',
          'Analysis',
          'Recommendations',
          'Conclusion',
        ],
      });

      const scores = getQualityScorer().getAllScores();
      expect(scores.length).toBe(1);
      expect(scores[0].complexity).toBe('complex');
    });

    it('should detect medium complexity for styled documents', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      await generator.generate({
        title: 'Article',
        description: 'A styled article',
        maxLength: 1500,
        style: 'formal',
      });

      const scores = getQualityScorer().getAllScores();
      expect(scores.length).toBe(1);
      expect(scores[0].complexity).toBe('medium');
    });
  });

  describe('Section Generation', () => {
    it('should track section generation separately', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
      });

      // Generate a section
      const sectionContent = await generator.generateSection(
        'Introduction',
        'This is context for the introduction section'
      );

      expect(sectionContent).toBeTruthy();

      // Cost should be recorded
      const tracker = getCostTracker();
      const records = tracker.getAllRecords();
      expect(records.length).toBe(1);

      // Quality should be recorded as simple
      const scores = getQualityScorer().getAllScores();
      expect(scores.length).toBe(1);
      expect(scores[0].complexity).toBe('simple');
    });
  });

  describe('Budget Exhausted Scenario', () => {
    it('should block generation when budget exceeded and blocking enabled', async () => {
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
        'writing'
      );

      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: true,
      });

      await expect(
        generator.generate({
          title: 'Test',
          description: 'Test',
        })
      ).rejects.toThrow(/Budget exceeded/);
    });

    it('should warn but continue when budget exceeded and blocking disabled', async () => {
      // Exhaust budget
      const tracker = getCostTracker();
      tracker.recordCost(
        'claude-sonnet',
        'anthropic',
        { inputTokens: 500000, outputTokens: 250000, totalTokens: 750000 },
        { inputCost: 25.0, outputCost: 30.0, totalCost: 55.0 },
        'writing'
      );

      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: true,
        blockOnBudgetExceeded: false,
        verbose: true,
      });

      // Should still succeed (with warning)
      const result = await generator.generate({
        title: 'Test',
        description: 'Test',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Router Disabled Scenario', () => {
    it('should still generate when router tracking disabled', async () => {
      const { AnthropicWritingGenerator } = await import(
        '../../../src/god-agent/core/writing/anthropic-writing-generator.js'
      );

      const generator = new AnthropicWritingGenerator(undefined, undefined, {
        enableRouterTracking: false,
      });

      const initialRecords = getCostTracker().getAllRecords().length;

      const result = await generator.generate({
        title: 'Test',
        description: 'Test',
      });

      // Should still succeed
      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();

      // But should NOT record metrics
      const finalRecords = getCostTracker().getAllRecords().length;
      expect(finalRecords).toBe(initialRecords);
    });
  });
});
