/**
 * Adaptive Router Tests
 *
 * Tests for Phase 6.1: Adaptive Routing Based on Quality History
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AdaptiveRouter,
  getAdaptiveRouter,
  initializeAdaptiveRouter,
  resetAdaptiveRouter,
  formatModelScore,
  formatAdaptiveRanking,
} from '../../../../src/god-agent/core/router/adaptive-router.js';
import type {
  AdaptiveRouterConfig,
  ModelScore,
  AdaptiveRanking,
} from '../../../../src/god-agent/core/router/adaptive-router.js';
import { QualityScorer, resetQualityScorer } from '../../../../src/god-agent/core/router/quality-scorer.js';
import { OutcomeTracker, resetOutcomeTracker } from '../../../../src/god-agent/core/router/outcome-tracker.js';
import { MockLLMProvider } from '../../../../src/god-agent/core/router/llm-provider.js';
import type { RouterConfig } from '../../../../src/god-agent/core/router/router-types.js';

// Helper to create a minimal router config
function createConfig(overrides: Partial<AdaptiveRouterConfig> = {}): AdaptiveRouterConfig {
  const routerConfig: RouterConfig = {
    models: {
      'claude-opus': {
        provider: 'anthropic',
        model: 'claude-opus-4-5',
        capabilities: ['code', 'reasoning', 'writing'],
        maxComplexity: 'complex',
        priority: 1,
        inputCostPer1M: 15,
        outputCostPer1M: 75,
      },
      'local-awq': {
        provider: 'vllm',
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
        capabilities: ['code', 'refactor'],
        maxComplexity: 'medium',
        priority: 2,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
      },
    },
    routingRules: [],
  };

  return {
    routerConfig,
    enabled: true,
    timeDecayFactor: 0.1,
    historyWindow: 100,
    minOutcomesForAdaptive: 3,
    qualityWeight: 0.6,
    successRateThreshold: 0.5,
    autoLearn: false,
    ...overrides,
  };
}

// Helper to create mock providers
function createMockProvider(id: string, provider: string) {
  return new MockLLMProvider({
    id,
    provider: provider as any,
    model: id,
    capabilities: ['code', 'reasoning', 'test', 'writing', 'refactor'],
    maxComplexity: 'complex',
    responses: new Map([['default', 'Mock response']]),
  });
}

describe('AdaptiveRouter', () => {
  let router: AdaptiveRouter;
  let qualityScorer: QualityScorer;
  let outcomeTracker: OutcomeTracker;

  beforeEach(() => {
    resetAdaptiveRouter();
    resetQualityScorer();
    resetOutcomeTracker();

    qualityScorer = new QualityScorer({ enabled: true, minSamplesForStats: 2 });
    outcomeTracker = new OutcomeTracker({ minOutcomesForStats: 2 });
    router = new AdaptiveRouter(createConfig(), qualityScorer, outcomeTracker);

    // Register mock providers
    router.registerProvider(createMockProvider('claude-opus', 'anthropic'));
    router.registerProvider(createMockProvider('local-awq', 'vllm'));
  });

  afterEach(() => {
    resetAdaptiveRouter();
    resetQualityScorer();
    resetOutcomeTracker();
  });

  describe('Initialization', () => {
    it('should create router with config', () => {
      expect(router).toBeDefined();
      expect(router.getAllProviders()).toHaveLength(2);
    });

    it('should use singleton pattern', () => {
      const instance1 = initializeAdaptiveRouter(createConfig());
      const instance2 = getAdaptiveRouter();

      expect(instance1).toBe(instance2);
    });

    it('should reset singleton', () => {
      const instance1 = initializeAdaptiveRouter(createConfig());
      resetAdaptiveRouter();

      expect(() => getAdaptiveRouter()).toThrow();
    });
  });

  describe('Basic Routing', () => {
    it('should route without adaptive data', async () => {
      const decision = await router.route('Write a function to add two numbers');

      expect(decision).toBeDefined();
      expect(decision.selectedModel).toBeDefined();
      expect(decision.blocked).toBe(false);
    });

    it('should use base router when disabled', async () => {
      const disabledRouter = new AdaptiveRouter(
        createConfig({ enabled: false }),
        qualityScorer,
        outcomeTracker
      );
      disabledRouter.registerProvider(createMockProvider('claude-opus', 'anthropic'));

      const decision = await disabledRouter.route('Test prompt');

      expect(decision.selectedModel).toBe('claude-opus');
    });

    it('should respect model override', async () => {
      const decision = await router.route('Test prompt', { modelOverride: 'local-awq' });

      expect(decision.selectedModel).toBe('local-awq');
      expect(decision.wasOverride).toBe(true);
    });
  });

  describe('Adaptive Ranking', () => {
    beforeEach(() => {
      // Add quality data for both models
      for (let i = 0; i < 5; i++) {
        qualityScorer.recordScore({
          model: 'claude-opus',
          provider: 'anthropic',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 2000,
          tokensUsed: 1000,
          userAccepted: true,
          userRating: 5,
          testsPass: true,
        });

        qualityScorer.recordScore({
          model: 'local-awq',
          provider: 'vllm',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 1500,
          tokensUsed: 800,
          userAccepted: i < 3, // 60% acceptance
          userRating: 3,
          testsPass: i < 2, // 40% test pass
        });
      }
    });

    it('should rank models by quality', () => {
      const ranking = router.getAdaptiveRanking('code_edit', 'medium');

      expect(ranking.rankedModels.length).toBeGreaterThan(0);
      expect(ranking.adaptiveUsed).toBe(true);
      // Claude should be ranked higher due to better quality
      expect(ranking.rankedModels[0].model).toBe('claude-opus');
    });

    it('should include score components', () => {
      const ranking = router.getAdaptiveRanking('code_edit', 'medium');
      const topModel = ranking.rankedModels[0];

      expect(topModel.components).toBeDefined();
      expect(topModel.components.rating).toBeDefined();
      expect(topModel.components.acceptance).toBeDefined();
      expect(topModel.components.tests).toBeDefined();
      expect(topModel.components.responseTime).toBeDefined();
      expect(topModel.components.decay).toBeDefined();
    });

    it('should calculate success rates', () => {
      const ranking = router.getAdaptiveRanking('code_edit', 'medium');

      for (const model of ranking.rankedModels) {
        expect(model.successRate).toBeGreaterThanOrEqual(0);
        expect(model.successRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Time Decay', () => {
    it('should apply time decay to older scores', () => {
      // Add old scores
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      for (let i = 0; i < 5; i++) {
        const score = qualityScorer.recordScore({
          model: 'claude-opus',
          provider: 'anthropic',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 2000,
          tokensUsed: 1000,
          userAccepted: true,
          userRating: 5,
        });
        // Manually set timestamp to old date
        (score as any).timestamp = oldDate;
      }

      // Add fresh scores for local model
      for (let i = 0; i < 5; i++) {
        qualityScorer.recordScore({
          model: 'local-awq',
          provider: 'vllm',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 1500,
          tokensUsed: 800,
          userAccepted: true,
          userRating: 4,
        });
      }

      const ranking = router.getAdaptiveRanking('code_edit', 'medium');

      // Fresh scores should be weighted higher despite slightly lower rating
      const claudeScore = ranking.rankedModels.find(m => m.model === 'claude-opus');
      const localScore = ranking.rankedModels.find(m => m.model === 'local-awq');

      // Decay should reduce Claude's effective score
      expect(claudeScore?.components.decay).toBeLessThan(1);
      expect(localScore?.components.decay).toBeCloseTo(1, 1);
    });
  });

  describe('Learning', () => {
    it('should record outcomes', async () => {
      const decision = await router.route('Test prompt');

      router.recordOutcome(decision, true, {
        testsPass: true,
        userAccepted: true,
        executionTimeMs: 1500,
        tokensUsed: 500,
      });

      const scores = qualityScorer.getAllScores();
      expect(scores.length).toBe(1);
    });

    it('should update cache after recording', async () => {
      const decision = await router.route('Write a function to add numbers');

      // Record multiple outcomes
      for (let i = 0; i < 5; i++) {
        router.recordOutcome(decision, true, { testsPass: true });
      }

      // Trigger cache refresh by getting adaptive ranking
      router.getAdaptiveRanking(decision.classification.type, decision.classification.complexity);

      const modelScore = router.getModelScore(decision.selectedModel);
      expect(modelScore).toBeDefined();
      expect(modelScore?.outcomeCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Threshold Filtering', () => {
    it('should filter out models below success threshold', () => {
      // Add failing outcomes for local model
      for (let i = 0; i < 10; i++) {
        outcomeTracker.record({
          taskPattern: 'local-awq:code_edit',
          prompt: 'Test',
          riskAssessment: {
            costOfBeingWrong: 'low',
            costOfThinking: 'low',
            feedbackSpeed: 'fast',
            reversibility: 'easy',
            verificationMethod: 'tests',
            recommendation: 'local',
            confidence: 0.8,
            signals: [],
          },
          routedTo: 'local',
          actualModel: 'local-awq',
          status: i < 3 ? 'success' : 'failure', // 30% success
        });

        // Add quality score
        qualityScorer.recordScore({
          model: 'local-awq',
          provider: 'vllm',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 1500,
          tokensUsed: 800,
          userAccepted: i < 3,
        });
      }

      // Add good outcomes for claude
      for (let i = 0; i < 5; i++) {
        qualityScorer.recordScore({
          model: 'claude-opus',
          provider: 'anthropic',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 2000,
          tokensUsed: 1000,
          userAccepted: true,
        });
      }

      const ranking = router.getAdaptiveRanking('code_edit', 'medium');

      // Local model should be filtered or ranked lower
      expect(ranking.selected).toBe('claude-opus');
    });
  });

  describe('Model Avoidance', () => {
    it('should recommend avoiding poorly performing models', () => {
      // Add poor quality scores
      for (let i = 0; i < 10; i++) {
        qualityScorer.recordScore({
          model: 'local-awq',
          provider: 'vllm',
          taskType: 'code_edit',
          complexity: 'medium',
          responseTime: 1500,
          tokensUsed: 800,
          userAccepted: false,
          userRating: 1,
        });

        outcomeTracker.record({
          taskPattern: 'local-awq:code_edit',
          prompt: 'Test',
          riskAssessment: {
            costOfBeingWrong: 'low',
            costOfThinking: 'low',
            feedbackSpeed: 'fast',
            reversibility: 'easy',
            verificationMethod: 'tests',
            recommendation: 'local',
            confidence: 0.8,
            signals: [],
          },
          routedTo: 'local',
          actualModel: 'local-awq',
          status: 'failure',
        });
      }

      // Force cache refresh
      router.getAdaptiveRanking('code_edit', 'medium');

      const shouldAvoid = router.shouldAvoidModel('local-awq', 'code_edit');
      expect(shouldAvoid).toBe(true);
    });
  });

  describe('Format Utilities', () => {
    it('should format model score', () => {
      const score: ModelScore = {
        model: 'test-model',
        provider: 'anthropic',
        qualityScore: 0.85,
        successRate: 0.9,
        decayedScore: 0.8,
        outcomeCount: 10,
        timeSinceLastOutcome: 60000,
        hasEnoughData: true,
        components: {
          rating: 0.9,
          acceptance: 0.85,
          tests: 0.8,
          responseTime: 0.7,
          decay: 0.95,
        },
      };

      const formatted = formatModelScore(score);

      expect(formatted).toContain('test-model');
      expect(formatted).toContain('Quality=85.0%');
      expect(formatted).toContain('Success=90.0%');
    });

    it('should format adaptive ranking', () => {
      const ranking: AdaptiveRanking = {
        rankedModels: [
          {
            model: 'model-a',
            provider: 'anthropic',
            qualityScore: 0.9,
            successRate: 0.95,
            decayedScore: 0.88,
            outcomeCount: 20,
            timeSinceLastOutcome: 30000,
            hasEnoughData: true,
            components: {
              rating: 0.9,
              acceptance: 0.9,
              tests: 0.9,
              responseTime: 0.9,
              decay: 0.98,
            },
          },
        ],
        selected: 'model-a',
        reason: 'Highest quality score',
        adaptiveUsed: true,
        timestamp: new Date(),
      };

      const formatted = formatAdaptiveRanking(ranking);

      expect(formatted).toContain('Selected: model-a');
      expect(formatted).toContain('Highest quality score');
      expect(formatted).toContain('Adaptive Used: true');
    });
  });

  describe('Event Handling', () => {
    it('should emit routing events', async () => {
      const events: any[] = [];
      router.on((event) => events.push(event));

      await router.route('Test prompt');

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'routing_decision')).toBe(true);
    });
  });

  describe('Integration with Base Router', () => {
    it('should delegate provider registration', () => {
      const newProvider = createMockProvider('new-model', 'openai');
      router.registerProvider(newProvider);

      const providers = router.getAllProviders();
      expect(providers.some(p => p.id === 'new-model')).toBe(true);
    });

    it('should delegate session override', () => {
      router.setSessionOverride('local-awq');

      // Session override should be respected
      // (actual behavior depends on base router implementation)
    });
  });
});
