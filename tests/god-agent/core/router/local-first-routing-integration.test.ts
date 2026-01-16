/**
 * Local-First Routing Integration Tests
 *
 * End-to-end tests for LOCAL-FIRST routing:
 * - Full initialization flow with provider factory
 * - Real routing decisions with fallback handling
 * - Cost tracking across requests
 * - Integration with graceful degradation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CapabilityRouter,
  initializeRouter,
  resetCapabilityRouter,
} from '../../../../src/god-agent/core/router/capability-router.js';
import {
  LLMProviderFactory,
  getProviderFactory,
  resetProviderFactory,
  createVLLMProvider,
  createAnthropicProvider,
  VLLM_MODELS,
} from '../../../../src/god-agent/core/router/providers/index.js';
import {
  loadRouterConfig,
  DEFAULT_MODEL_CONFIGS,
  DEFAULT_ROUTING_RULES,
} from '../../../../src/god-agent/core/router/router-config.js';
import {
  resetTaskClassifier,
} from '../../../../src/god-agent/core/router/task-classifier.js';
import {
  DegradationManager,
  DEFAULT_DEGRADATION_CONFIG,
} from '../../../../src/god-agent/core/router/graceful-degradation.js';
import {
  CostTracker,
  initializeCostTracker,
  resetCostTracker,
  getCostTracker,
} from '../../../../src/god-agent/core/router/cost-tracker.js';
import type { ILLMProvider } from '../../../../src/god-agent/core/router/router-types.js';

// Mock fetch for vLLM health checks
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ===== INTEGRATION TESTS =====

describe('Local-First Routing Integration', () => {
  beforeEach(() => {
    resetCapabilityRouter();
    resetProviderFactory();
    resetTaskClassifier();
    resetCostTracker();
    mockFetch.mockReset();
  });

  afterEach(() => {
    resetCapabilityRouter();
    resetProviderFactory();
    resetTaskClassifier();
    resetCostTracker();
  });

  describe('Full Initialization Flow', () => {
    it('should load router config with local-first defaults', () => {
      const config = loadRouterConfig();

      // Verify local model is configured with priority 0
      expect(config.models['qwen2.5-coder-32b']).toBeDefined();
      expect(config.models['qwen2.5-coder-32b'].priority).toBe(0);

      // Verify cloud models have lower priority
      expect(config.models['claude-sonnet'].priority).toBeGreaterThan(0);
    });

    it('should initialize router with loaded config', () => {
      const config = loadRouterConfig();
      const router = initializeRouter({
        routerConfig: config,
        adaptiveRouting: false,
      });

      expect(router).toBeDefined();
    });

    it('should register providers from factory with router', async () => {
      // Mock vLLM as unavailable (no server running in tests)
      mockFetch.mockResolvedValue({ ok: false });

      const factory = new LLMProviderFactory({
        autoInitialize: false,
      });

      // Manually create a mock vLLM provider
      const vllmProvider = createVLLMProvider('qwen2.5-coder-32b', {
        baseUrl: 'http://localhost:8002',
      });
      factory.registerProvider(vllmProvider);

      const config = loadRouterConfig();
      const router = initializeRouter({
        routerConfig: config,
      });

      // Register providers with router
      for (const provider of factory.getAllProviders()) {
        router.registerProvider(provider);
      }

      expect(router.getAllProviders().length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Routing', () => {
    let router: CapabilityRouter;
    let mockVLLMProvider: ILLMProvider;
    let mockClaudeProvider: ILLMProvider;

    beforeEach(() => {
      const config = loadRouterConfig();
      router = initializeRouter({
        routerConfig: config,
      });

      // Create mock providers
      mockVLLMProvider = createVLLMProvider('qwen2.5-coder-32b', {
        baseUrl: 'http://localhost:8002',
      });
      mockClaudeProvider = {
        id: 'claude-sonnet',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        capabilities: ['code', 'reasoning', 'writing', 'refactor', 'debug', 'test'],
        maxComplexity: 'complex',
        timeout: 60000,
        isAvailable: vi.fn().mockResolvedValue(true),
        complete: vi.fn().mockResolvedValue({
          content: 'mock response',
          usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
          truncated: false,
          stopReason: 'end_turn',
          model: 'claude-sonnet-4',
          timestamp: new Date(),
        }),
        stream: vi.fn(),
        getCost: vi.fn().mockReturnValue({ inputCost: 0.0003, outputCost: 0.00075, totalCost: 0.00105 }),
        estimateTokens: vi.fn().mockReturnValue(100),
      };
    });

    it('should route to local model when available', async () => {
      // Mock vLLM as available
      vi.spyOn(mockVLLMProvider, 'isAvailable').mockResolvedValue(true);
      vi.spyOn(mockClaudeProvider, 'isAvailable').mockResolvedValue(true);

      router.registerProvider(mockVLLMProvider);
      router.registerProvider(mockClaudeProvider);

      const decision = await router.route('Fix this TypeScript bug');

      expect(decision.selectedModel).toBe('qwen2.5-coder-32b');
      expect(decision.selectedProvider).toBe('vllm');
    });

    it('should route to Claude when local unavailable', async () => {
      // Mock vLLM as unavailable
      vi.spyOn(mockVLLMProvider, 'isAvailable').mockResolvedValue(false);
      vi.spyOn(mockClaudeProvider, 'isAvailable').mockResolvedValue(true);

      router.registerProvider(mockVLLMProvider);
      router.registerProvider(mockClaudeProvider);

      const decision = await router.route('Fix this complex bug');

      expect(decision.selectedModel).toBe('claude-sonnet');
      expect(decision.selectedProvider).toBe('anthropic');
    });

    it('should include fallback chain in decision', async () => {
      vi.spyOn(mockVLLMProvider, 'isAvailable').mockResolvedValue(true);
      vi.spyOn(mockClaudeProvider, 'isAvailable').mockResolvedValue(true);

      router.registerProvider(mockVLLMProvider);
      router.registerProvider(mockClaudeProvider);

      const decision = await router.route('Write some code');

      // Fallback chain should include cloud providers
      expect(decision.fallbackChain.length).toBeGreaterThan(0);
    });

    it('should handle multiple fallbacks in order', async () => {
      const mockDeepseekProvider: ILLMProvider = {
        id: 'deepseek-coder',
        provider: 'ollama',
        model: 'deepseek-coder-v2',
        capabilities: ['code', 'writing'],
        maxComplexity: 'simple',
        timeout: 60000,
        isAvailable: vi.fn().mockResolvedValue(true),
        complete: vi.fn(),
        stream: vi.fn(),
        getCost: vi.fn().mockReturnValue({ inputCost: 0, outputCost: 0, totalCost: 0 }),
        estimateTokens: vi.fn().mockReturnValue(100),
      };

      // vLLM unavailable, deepseek available
      vi.spyOn(mockVLLMProvider, 'isAvailable').mockResolvedValue(false);
      vi.spyOn(mockDeepseekProvider, 'isAvailable').mockResolvedValue(true);
      vi.spyOn(mockClaudeProvider, 'isAvailable').mockResolvedValue(true);

      router.registerProvider(mockVLLMProvider);
      router.registerProvider(mockDeepseekProvider);
      router.registerProvider(mockClaudeProvider);

      const decision = await router.route('Write a simple function');

      // Should fallback to deepseek (local) before claude (cloud)
      expect(decision.selectedModel).toBe('deepseek-coder');
      expect(decision.selectedProvider).toBe('ollama');
    });
  });

  describe('Cost Tracking Integration', () => {
    it('should track zero cost for local requests', async () => {
      initializeCostTracker({ enabled: true });

      const vllmProvider = createVLLMProvider('qwen2.5-coder-32b');
      const cost = vllmProvider.getCost(1000, 500);

      expect(cost.totalCost).toBe(0);
    });

    it('should track costs across sessions', () => {
      initializeCostTracker({
        enabled: true,
        budgets: { daily: 10, weekly: 50, monthly: 100 },
      });

      const tracker = getCostTracker();

      // Record a local request (free)
      // recordCost(model, provider, usage, cost, taskType)
      tracker.recordCost(
        'qwen2.5-coder-32b',
        'vllm',
        { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
        { inputCost: 0, outputCost: 0, totalCost: 0 },
        'code_edit'
      );

      const stats = tracker.getStats();
      expect(stats.totalCost).toBe(0);
      expect(stats.requestCount).toBe(1);
    });
  });

  describe('Degradation Integration', () => {
    it('should use degradation manager with local-first config', async () => {
      const manager = new DegradationManager(DEFAULT_DEGRADATION_CONFIG);

      // Default chain should have vllm as primary
      expect(DEFAULT_DEGRADATION_CONFIG.fallbackChains.default.primary).toBe('vllm');
    });

    it('should have local_only chain for offline mode', () => {
      const manager = new DegradationManager(DEFAULT_DEGRADATION_CONFIG);

      const localOnlyChain = DEFAULT_DEGRADATION_CONFIG.fallbackChains.local_only;
      expect(localOnlyChain.primary).toBe('vllm');
      expect(localOnlyChain.fallbacks).not.toContain('anthropic');
    });
  });

  describe('Router Events Integration', () => {
    it('should emit events on routing decisions', async () => {
      const events: any[] = [];
      const config = loadRouterConfig();
      const router = initializeRouter({ routerConfig: config });

      router.on((event) => {
        events.push(event);
      });

      // Use all capabilities including 'test' since classifier may detect it
      const mockProvider: ILLMProvider = {
        id: 'qwen2.5-coder-32b',
        provider: 'vllm',
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
        capabilities: ['code', 'reasoning', 'writing', 'refactor', 'debug', 'test'],
        maxComplexity: 'complex',
        timeout: 120000,
        isAvailable: vi.fn().mockResolvedValue(true),
        complete: vi.fn(),
        stream: vi.fn(),
        getCost: vi.fn().mockReturnValue({ inputCost: 0, outputCost: 0, totalCost: 0 }),
        estimateTokens: vi.fn().mockReturnValue(100),
      };

      router.registerProvider(mockProvider);
      // Use a clearer code-related prompt
      await router.route('Fix this bug in the code');

      // Should have emitted a routing_decision event
      const routingEvents = events.filter(e => e.type === 'routing_decision');
      expect(routingEvents.length).toBeGreaterThan(0);
    });

    it('should emit provider_unavailable when fallback needed', async () => {
      const events: any[] = [];
      const config = loadRouterConfig();
      const router = initializeRouter({ routerConfig: config });

      router.on((event) => {
        events.push(event);
      });

      // vLLM unavailable - use all capabilities
      const mockVLLM: ILLMProvider = {
        id: 'qwen2.5-coder-32b',
        provider: 'vllm',
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
        capabilities: ['code', 'reasoning', 'writing', 'refactor', 'debug', 'test'],
        maxComplexity: 'complex',
        timeout: 120000,
        isAvailable: vi.fn().mockResolvedValue(false),
        complete: vi.fn(),
        stream: vi.fn(),
        getCost: vi.fn().mockReturnValue({ inputCost: 0, outputCost: 0, totalCost: 0 }),
        estimateTokens: vi.fn().mockReturnValue(100),
      };

      const mockClaude: ILLMProvider = {
        id: 'claude-sonnet',
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        capabilities: ['code', 'reasoning', 'writing', 'refactor', 'debug', 'test'],
        maxComplexity: 'complex',
        timeout: 60000,
        isAvailable: vi.fn().mockResolvedValue(true),
        complete: vi.fn(),
        stream: vi.fn(),
        getCost: vi.fn().mockReturnValue({ inputCost: 0.003, outputCost: 0.015, totalCost: 0.018 }),
        estimateTokens: vi.fn().mockReturnValue(100),
      };

      router.registerProvider(mockVLLM);
      router.registerProvider(mockClaude);

      // Use a clearer code-related prompt
      await router.route('Write a function to parse JSON');

      // Should have emitted provider_unavailable for vLLM
      const unavailableEvents = events.filter(e => e.type === 'provider_unavailable');
      expect(unavailableEvents.length).toBeGreaterThan(0);
    });
  });
});

describe('VLLM Provider Configuration', () => {
  it('should have correct model mapping in VLLM_MODELS', () => {
    expect(VLLM_MODELS['qwen2.5-coder-32b']).toBeDefined();
    expect(VLLM_MODELS['qwen2.5-coder-32b'].id).toBe('Qwen/Qwen2.5-Coder-32B-Instruct');
    expect(VLLM_MODELS['qwen2.5-coder-32b'].inputCostPer1M).toBe(0);
    expect(VLLM_MODELS['qwen2.5-coder-32b'].outputCostPer1M).toBe(0);
  });

  it('should create vLLM provider with correct base URL from env', () => {
    const provider = createVLLMProvider('qwen2.5-coder-32b', {
      baseUrl: 'http://localhost:8002',
    });

    expect(provider.id).toBe('qwen2.5-coder-32b');
    expect(provider.provider).toBe('vllm');
    expect(provider.getBaseUrl()).toBe('http://localhost:8002');
  });
});
