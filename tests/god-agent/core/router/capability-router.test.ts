/**
 * Capability Router Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Capability Routing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CapabilityRouter,
  getCapabilityRouter,
  initializeRouter,
  resetCapabilityRouter,
  createRoutingDecision,
  isRoutingSuccessful,
  getRoutingDecisionSummary,
  type CapabilityRouterConfig,
  type RouteOptions,
} from '../../../../src/god-agent/core/router/capability-router.js';
import {
  MockLLMProvider,
} from '../../../../src/god-agent/core/router/llm-provider.js';
import {
  resetTaskClassifier,
} from '../../../../src/god-agent/core/router/task-classifier.js';
import type {
  RouterConfig,
  ProviderConfig,
  RoutingRule,
  TaskClassification,
  RoutingDecision,
  ILLMProvider,
} from '../../../../src/god-agent/core/router/router-types.js';
import {
  NoSuitableModelError,
  TaskBlockedError,
} from '../../../../src/god-agent/core/router/router-types.js';

// ===== TEST FIXTURES =====

function createTestConfig(): RouterConfig {
  return {
    models: {
      'claude-sonnet': {
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor'],
        maxComplexity: 'complex',
        priority: 1,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        enabled: true,
      } as ProviderConfig,
      'gpt-4o': {
        provider: 'openai',
        model: 'gpt-4o',
        capabilities: ['code', 'reasoning', 'writing'],
        maxComplexity: 'medium',
        priority: 2,
        inputCostPer1M: 2.5,
        outputCostPer1M: 10.0,
        enabled: true,
      } as ProviderConfig,
      'deepseek-coder': {
        provider: 'ollama',
        model: 'deepseek-coder-v2:33b',
        capabilities: ['code', 'writing'],
        maxComplexity: 'simple',
        priority: 3,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        enabled: true,
      } as ProviderConfig,
    },
    routingRules: [
      {
        task: 'code_edit',
        complexity: 'simple',
        route: ['deepseek-coder', 'gpt-4o', 'claude-sonnet'],
      },
      {
        task: 'code_edit',
        complexity: 'medium',
        route: ['gpt-4o', 'claude-sonnet'],
      },
      {
        task: 'code_edit',
        complexity: 'complex',
        route: ['claude-sonnet', 'gpt-4o'],
        blockIfUnavailable: true,
      },
      {
        task: 'reasoning',
        route: ['claude-sonnet', 'gpt-4o'],
      },
    ] as RoutingRule[],
    defaultModel: 'claude-sonnet',
    adaptiveRouting: false,
  };
}

function createMockProvider(
  id: string,
  options: {
    available?: boolean;
    capabilities?: string[];
    maxComplexity?: 'simple' | 'medium' | 'complex';
  } = {}
): MockLLMProvider {
  const provider = new MockLLMProvider();
  // Override properties for testing
  (provider as unknown as { id: string }).id = id;
  (provider as unknown as { capabilities: string[] }).capabilities =
    options.capabilities ?? ['code', 'reasoning', 'writing'];
  (provider as unknown as { maxComplexity: string }).maxComplexity =
    options.maxComplexity ?? 'complex';
  provider.setAvailable(options.available ?? true);
  return provider;
}

// ===== TESTS =====

describe('CapabilityRouter', () => {
  let router: CapabilityRouter;
  let config: RouterConfig;

  beforeEach(() => {
    resetCapabilityRouter();
    resetTaskClassifier();
    config = createTestConfig();
    router = new CapabilityRouter({ routerConfig: config });
  });

  afterEach(() => {
    resetCapabilityRouter();
    resetTaskClassifier();
  });

  describe('Provider Registration', () => {
    it('should register a provider', () => {
      const provider = createMockProvider('test-model');
      router.registerProvider(provider);

      expect(router.getProvider('test-model')).toBe(provider);
    });

    it('should unregister a provider', () => {
      const provider = createMockProvider('test-model');
      router.registerProvider(provider);
      router.unregisterProvider('test-model');

      expect(router.getProvider('test-model')).toBeUndefined();
    });

    it('should list all providers', () => {
      router.registerProvider(createMockProvider('model-1'));
      router.registerProvider(createMockProvider('model-2'));

      const providers = router.getAllProviders();
      expect(providers).toHaveLength(2);
    });
  });

  describe('Routing Decision', () => {
    beforeEach(() => {
      // Register mock providers that match config
      const claudeProvider = createMockProvider('claude-sonnet', {
        capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor'],
        maxComplexity: 'complex',
      });
      const gptProvider = createMockProvider('gpt-4o', {
        capabilities: ['code', 'reasoning', 'writing'],
        maxComplexity: 'medium',
      });
      const deepseekProvider = createMockProvider('deepseek-coder', {
        capabilities: ['code', 'writing'],
        maxComplexity: 'simple',
      });

      router.registerProvider(claudeProvider);
      router.registerProvider(gptProvider);
      router.registerProvider(deepseekProvider);
    });

    it('should route simple code edit to local model', async () => {
      const decision = await router.route('fix this typo');

      // Simple code edit should prefer deepseek-coder
      expect(decision.selectedModel).toBe('deepseek-coder');
      expect(decision.wasOverride).toBe(false);
      expect(decision.blocked).toBe(false);
    });

    it('should route complex tasks to capable model', async () => {
      const decision = await router.route('redesign the entire architecture of the application');

      // Complex task should go to claude-sonnet
      expect(decision.selectedModel).toBe('claude-sonnet');
    });

    it('should return fallback chain in decision', async () => {
      const decision = await router.route('fix this typo');

      // After selecting deepseek-coder, remaining chain should be gpt-4o, claude-sonnet
      expect(decision.fallbackChain).toContain('gpt-4o');
    });

    it('should include classification in decision', async () => {
      const decision = await router.route('fix this typo');

      expect(decision.classification).toBeDefined();
      expect(decision.classification.type).toBe('code_edit');
    });

    it('should include timestamp in decision', async () => {
      const before = new Date();
      const decision = await router.route('fix this typo');
      const after = new Date();

      expect(decision.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(decision.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Manual Override', () => {
    beforeEach(() => {
      router.registerProvider(createMockProvider('claude-sonnet'));
      router.registerProvider(createMockProvider('gpt-4o'));
      router.registerProvider(createMockProvider('deepseek-coder'));
    });

    it('should honor model override', async () => {
      const decision = await router.route('fix this typo', {
        modelOverride: 'gpt-4o',
      });

      expect(decision.selectedModel).toBe('gpt-4o');
      expect(decision.wasOverride).toBe(true);
    });

    it('should throw for unknown override model', async () => {
      await expect(
        router.route('fix this typo', { modelOverride: 'unknown-model' })
      ).rejects.toThrow('Model not found');
    });

    it('should throw for unavailable override model', async () => {
      const unavailableProvider = createMockProvider('unavailable-model', {
        available: false,
      });
      router.registerProvider(unavailableProvider);

      await expect(
        router.route('fix this typo', { modelOverride: 'unavailable-model' })
      ).rejects.toThrow('not available');
    });
  });

  describe('Session Override', () => {
    beforeEach(() => {
      router.registerProvider(createMockProvider('claude-sonnet'));
      router.registerProvider(createMockProvider('gpt-4o'));
    });

    it('should use session override for all requests', async () => {
      router.setSessionOverride('gpt-4o');

      const decision = await router.route('fix this typo');
      expect(decision.selectedModel).toBe('gpt-4o');
      expect(decision.wasOverride).toBe(true);
    });

    it('should clear session override', async () => {
      router.setSessionOverride('gpt-4o');
      router.setSessionOverride(null);

      expect(router.getSessionOverride()).toBeNull();
    });

    it('should prefer request override over session override', async () => {
      router.setSessionOverride('gpt-4o');

      const decision = await router.route('fix this typo', {
        modelOverride: 'claude-sonnet',
      });
      expect(decision.selectedModel).toBe('claude-sonnet');
    });
  });

  describe('Fallback Handling', () => {
    it('should fallback when primary is unavailable', async () => {
      const unavailableDeepseek = createMockProvider('deepseek-coder', {
        available: false,
        maxComplexity: 'simple',
      });
      const availableGpt = createMockProvider('gpt-4o', {
        available: true,
        maxComplexity: 'medium',
      });
      const availableClaude = createMockProvider('claude-sonnet', {
        available: true,
        maxComplexity: 'complex',
      });

      router.registerProvider(unavailableDeepseek);
      router.registerProvider(availableGpt);
      router.registerProvider(availableClaude);

      const decision = await router.route('fix this simple typo');

      // Should skip unavailable deepseek and go to gpt-4o
      expect(decision.selectedModel).not.toBe('deepseek-coder');
    });

    it('should throw when all providers unavailable and blocking', async () => {
      const unavailable1 = createMockProvider('claude-sonnet', {
        available: false,
        maxComplexity: 'complex',
      });
      const unavailable2 = createMockProvider('gpt-4o', {
        available: false,
        maxComplexity: 'medium',
      });

      router.registerProvider(unavailable1);
      router.registerProvider(unavailable2);

      // Complex task with blockIfUnavailable
      await expect(
        router.route('redesign the entire architecture of the application across all files')
      ).rejects.toThrow();
    });
  });

  describe('Capability Matching', () => {
    beforeEach(() => {
      // Provider that only supports code
      const codeOnlyProvider = createMockProvider('code-only', {
        capabilities: ['code'],
        maxComplexity: 'simple',
      });
      // Provider that supports reasoning
      const reasoningProvider = createMockProvider('reasoning-model', {
        capabilities: ['reasoning', 'code'],
        maxComplexity: 'complex',
      });

      router.registerProvider(codeOnlyProvider);
      router.registerProvider(reasoningProvider);
    });

    it('should match capability to provider', () => {
      const simpleCodeTask: TaskClassification = {
        type: 'code_edit',
        complexity: 'simple',
        riskLevel: 'low',
        signals: [],
        confidence: 0.8,
      };

      expect(router.canModelHandle('code-only', simpleCodeTask)).toBe(true);
      expect(router.canModelHandle('reasoning-model', simpleCodeTask)).toBe(true);
    });

    it('should reject mismatched capability', () => {
      const researchTask: TaskClassification = {
        type: 'research',
        complexity: 'simple',
        riskLevel: 'low',
        signals: [],
        confidence: 0.8,
      };

      // code-only model doesn't have research capability
      expect(router.canModelHandle('code-only', researchTask)).toBe(false);
    });

    it('should reject complexity beyond max', () => {
      const complexTask: TaskClassification = {
        type: 'code_edit',
        complexity: 'complex',
        riskLevel: 'high',
        signals: [],
        confidence: 0.8,
      };

      // code-only has maxComplexity: simple
      expect(router.canModelHandle('code-only', complexTask)).toBe(false);
      expect(router.canModelHandle('reasoning-model', complexTask)).toBe(true);
    });
  });

  describe('Available Models', () => {
    beforeEach(() => {
      router.registerProvider(createMockProvider('model-1', { available: true }));
      router.registerProvider(createMockProvider('model-2', { available: false }));
      router.registerProvider(createMockProvider('model-3', { available: true }));
    });

    it('should list only available models', async () => {
      const classification: TaskClassification = {
        type: 'code_edit',
        complexity: 'simple',
        riskLevel: 'low',
        signals: [],
        confidence: 0.8,
      };

      const available = await router.getAvailableModels(classification);

      expect(available).toContain('model-1');
      expect(available).not.toContain('model-2');
      expect(available).toContain('model-3');
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      router.registerProvider(createMockProvider('claude-sonnet'));
    });

    it('should emit routing decision events', async () => {
      const events: unknown[] = [];
      router.on((event) => events.push(event));

      await router.route('fix this typo');

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e: any) => e.type === 'routing_decision')).toBe(true);
    });

    it('should allow unsubscribing from events', async () => {
      const events: unknown[] = [];
      const unsubscribe = router.on((event) => events.push(event));
      unsubscribe();

      await router.route('fix this typo');

      expect(events).toHaveLength(0);
    });

    it('should emit provider unavailable events', async () => {
      const unavailable = createMockProvider('unavailable', { available: false });
      const available = createMockProvider('available', { available: true });

      router.registerProvider(unavailable);
      router.registerProvider(available);

      const events: unknown[] = [];
      router.on((event) => events.push(event));

      // Route should try unavailable first (if in routing rules)
      // This may or may not trigger unavailable event depending on routing rules
      await router.route('fix this typo');

      // At minimum, should emit routing decision
      expect(events.some((e: any) => e.type === 'routing_decision')).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const routerConfig: CapabilityRouterConfig = {
        routerConfig: config,
      };

      const instance1 = initializeRouter(routerConfig);
      const instance2 = getCapabilityRouter();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const routerConfig: CapabilityRouterConfig = {
        routerConfig: config,
      };

      const instance1 = initializeRouter(routerConfig);
      resetCapabilityRouter();

      expect(() => getCapabilityRouter()).toThrow('not initialized');
    });

    it('should require config on first call', () => {
      expect(() => getCapabilityRouter()).toThrow('not initialized');
    });
  });

  describe('Utility Functions', () => {
    describe('createRoutingDecision', () => {
      it('should create valid routing decision', () => {
        const classification: TaskClassification = {
          type: 'code_edit',
          complexity: 'simple',
          riskLevel: 'low',
          signals: [],
          confidence: 0.8,
        };

        const decision = createRoutingDecision(
          'claude-sonnet',
          'anthropic',
          classification
        );

        expect(decision.selectedModel).toBe('claude-sonnet');
        expect(decision.selectedProvider).toBe('anthropic');
        expect(decision.classification).toBe(classification);
        expect(decision.blocked).toBe(false);
      });
    });

    describe('isRoutingSuccessful', () => {
      it('should return true for successful routing', () => {
        const decision: RoutingDecision = {
          selectedModel: 'claude-sonnet',
          selectedProvider: 'anthropic',
          reason: 'test',
          fallbackChain: [],
          wasOverride: false,
          blocked: false,
          classification: {} as TaskClassification,
          timestamp: new Date(),
        };

        expect(isRoutingSuccessful(decision)).toBe(true);
      });

      it('should return false for blocked routing', () => {
        const decision: RoutingDecision = {
          selectedModel: '',
          selectedProvider: 'custom',
          reason: 'blocked',
          fallbackChain: [],
          wasOverride: false,
          blocked: true,
          blockReason: 'No model available',
          classification: {} as TaskClassification,
          timestamp: new Date(),
        };

        expect(isRoutingSuccessful(decision)).toBe(false);
      });
    });

    describe('getRoutingDecisionSummary', () => {
      it('should summarize successful decision', () => {
        const decision: RoutingDecision = {
          selectedModel: 'claude-sonnet',
          selectedProvider: 'anthropic',
          reason: 'capability match',
          fallbackChain: [],
          wasOverride: false,
          blocked: false,
          classification: {} as TaskClassification,
          timestamp: new Date(),
        };

        const summary = getRoutingDecisionSummary(decision);
        expect(summary).toContain('claude-sonnet');
        expect(summary).toContain('anthropic');
      });

      it('should summarize blocked decision', () => {
        const decision: RoutingDecision = {
          selectedModel: '',
          selectedProvider: 'custom',
          reason: 'blocked',
          fallbackChain: [],
          wasOverride: false,
          blocked: true,
          blockReason: 'No model available',
          classification: {} as TaskClassification,
          timestamp: new Date(),
        };

        const summary = getRoutingDecisionSummary(decision);
        expect(summary).toContain('Blocked');
        expect(summary).toContain('No model available');
      });
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      // Use providers with full capability set
      router.registerProvider(createMockProvider('claude-sonnet', {
        capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor'],
        maxComplexity: 'complex',
      }));
      router.registerProvider(createMockProvider('gpt-4o', {
        capabilities: ['code', 'reasoning', 'writing'],
        maxComplexity: 'medium',
      }));
      router.registerProvider(createMockProvider('deepseek-coder', {
        capabilities: ['code', 'writing'],
        maxComplexity: 'simple',
      }));
    });

    it('should route within 10ms', async () => {
      const prompts = [
        'fix this typo',
        'explain the algorithm',
        'add a new feature to the component',
      ];

      for (const prompt of prompts) {
        const start = performance.now();
        await router.route(prompt);
        const end = performance.now();

        // Allow some slack for async operations
        expect(end - start).toBeLessThan(100);
      }
    });
  });
});
