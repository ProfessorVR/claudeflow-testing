/**
 * Local-First Routing Tests
 *
 * Tests for LOCAL-FIRST routing configuration:
 * - vLLM (local) should have highest priority (0)
 * - Local providers tried before cloud providers
 * - Fallback to cloud when local unavailable
 * - Recovery when local comes back online
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CapabilityRouter,
  initializeRouter,
  resetCapabilityRouter,
  type CapabilityRouterConfig,
} from '../../../../src/god-agent/core/router/capability-router.js';
import {
  MockLLMProvider,
} from '../../../../src/god-agent/core/router/llm-provider.js';
import {
  resetTaskClassifier,
} from '../../../../src/god-agent/core/router/task-classifier.js';
import {
  DEFAULT_MODEL_CONFIGS,
  DEFAULT_ROUTING_RULES,
  loadRouterConfig,
} from '../../../../src/god-agent/core/router/router-config.js';
import {
  DEFAULT_DEGRADATION_CONFIG,
  DegradationManager,
} from '../../../../src/god-agent/core/router/graceful-degradation.js';
import type {
  RouterConfig,
  ProviderConfig,
  RoutingRule,
  ILLMProvider,
} from '../../../../src/god-agent/core/router/router-types.js';

// ===== TEST FIXTURES =====

function createLocalFirstConfig(): RouterConfig {
  return {
    models: {
      'qwen2.5-coder-32b': {
        provider: 'vllm',
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
        capabilities: ['code', 'reasoning', 'writing', 'refactor', 'debug', 'test'],
        maxComplexity: 'complex',
        priority: 0, // Highest priority - LOCAL FIRST
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        timeout: 120000,
        enabled: true,
      } as ProviderConfig,
      'deepseek-coder': {
        provider: 'ollama',
        model: 'deepseek-coder-v2:33b',
        capabilities: ['code', 'writing'],
        maxComplexity: 'simple',
        priority: 1, // Second priority local
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        timeout: 60000,
        enabled: true,
      } as ProviderConfig,
      'claude-sonnet': {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'],
        maxComplexity: 'complex',
        priority: 10, // Fallback only
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        timeout: 60000,
        enabled: true,
      } as ProviderConfig,
      'gpt-4o': {
        provider: 'openai',
        model: 'gpt-4o',
        capabilities: ['code', 'reasoning', 'writing', 'refactor'],
        maxComplexity: 'medium',
        priority: 12,
        inputCostPer1M: 2.5,
        outputCostPer1M: 10.0,
        timeout: 60000,
        enabled: true,
      } as ProviderConfig,
    },
    routingRules: [
      {
        task: 'code_edit',
        complexity: 'simple',
        route: ['qwen2.5-coder-32b', 'deepseek-coder', 'gpt-4o', 'claude-sonnet'],
      },
      {
        task: 'code_edit',
        complexity: 'medium',
        route: ['qwen2.5-coder-32b', 'deepseek-coder', 'gpt-4o', 'claude-sonnet'],
      },
      {
        task: 'code_edit',
        complexity: 'complex',
        route: ['qwen2.5-coder-32b', 'claude-sonnet', 'gpt-4o'],
      },
      {
        task: 'reasoning',
        route: ['qwen2.5-coder-32b', 'claude-sonnet', 'gpt-4o'],
      },
    ] as RoutingRule[],
    defaultModel: 'qwen2.5-coder-32b',
    adaptiveRouting: false,
  };
}

function createMockProvider(
  id: string,
  provider: string,
  capabilities: string[],
  maxComplexity: string,
  available: boolean = true
): ILLMProvider {
  const mock = new MockLLMProvider({
    id,
    provider: provider as any,
    capabilities: capabilities as any[],
    maxComplexity: maxComplexity as any,
  });
  vi.spyOn(mock, 'isAvailable').mockResolvedValue(available);
  return mock;
}

// ===== TESTS =====

describe('Local-First Routing Configuration', () => {
  beforeEach(() => {
    resetCapabilityRouter();
    resetTaskClassifier();
  });

  afterEach(() => {
    resetCapabilityRouter();
    resetTaskClassifier();
  });

  describe('Priority Configuration', () => {
    it('should have vLLM model with highest priority (0)', () => {
      const config = DEFAULT_MODEL_CONFIGS;
      expect(config['qwen2.5-coder-32b']).toBeDefined();
      expect(config['qwen2.5-coder-32b'].priority).toBe(0);
    });

    it('should have cloud models with lower priority (10+)', () => {
      const config = DEFAULT_MODEL_CONFIGS;
      expect(config['claude-sonnet'].priority).toBeGreaterThanOrEqual(10);
      expect(config['gpt-4o'].priority).toBeGreaterThanOrEqual(10);
    });

    it('should have local models with zero cost', () => {
      const config = DEFAULT_MODEL_CONFIGS;
      expect(config['qwen2.5-coder-32b'].inputCostPer1M).toBe(0);
      expect(config['qwen2.5-coder-32b'].outputCostPer1M).toBe(0);
      expect(config['deepseek-coder'].inputCostPer1M).toBe(0);
      expect(config['deepseek-coder'].outputCostPer1M).toBe(0);
    });
  });

  describe('Routing Rules', () => {
    it('should have local model first in all routing rules', () => {
      const rules = DEFAULT_ROUTING_RULES;
      for (const rule of rules) {
        const firstModel = rule.route[0];
        // First model should be either qwen2.5-coder-32b or deepseek-coder (local)
        expect(['qwen2.5-coder-32b', 'deepseek-coder']).toContain(firstModel);
      }
    });

    it('should have cloud models as fallback in routing rules', () => {
      const rules = DEFAULT_ROUTING_RULES;
      const codeEditComplex = rules.find(
        r => r.task === 'code_edit' && r.complexity === 'complex'
      );
      expect(codeEditComplex).toBeDefined();
      expect(codeEditComplex!.route[0]).toBe('qwen2.5-coder-32b');
      expect(codeEditComplex!.route).toContain('claude-sonnet');
    });
  });
});

describe('Local-First Router Selection', () => {
  let router: CapabilityRouter;

  beforeEach(() => {
    resetCapabilityRouter();
    resetTaskClassifier();
    router = initializeRouter({
      routerConfig: createLocalFirstConfig(),
      adaptiveRouting: false,
    });
  });

  afterEach(() => {
    resetCapabilityRouter();
    resetTaskClassifier();
  });

  describe('Provider Priority', () => {
    it('should prefer local vLLM over cloud providers when available', async () => {
      // Register providers - vLLM available
      router.registerProvider(createMockProvider(
        'qwen2.5-coder-32b', 'vllm', ['code', 'reasoning'], 'complex', true
      ));
      router.registerProvider(createMockProvider(
        'claude-sonnet', 'anthropic', ['code', 'reasoning'], 'complex', true
      ));

      const decision = await router.route('Fix this bug in the code');

      expect(decision.selectedModel).toBe('qwen2.5-coder-32b');
      expect(decision.selectedProvider).toBe('vllm');
    });

    it('should return cost=0 for local providers', async () => {
      router.registerProvider(createMockProvider(
        'qwen2.5-coder-32b', 'vllm', ['code', 'reasoning'], 'complex', true
      ));

      const decision = await router.route('Fix this bug');
      const provider = router.getProvider(decision.selectedModel);

      expect(provider).toBeDefined();
      const cost = provider!.getCost(1000, 1000);
      expect(cost.totalCost).toBe(0);
    });

    it('should have anthropic as fallback only', async () => {
      router.registerProvider(createMockProvider(
        'qwen2.5-coder-32b', 'vllm', ['code', 'reasoning'], 'complex', true
      ));
      router.registerProvider(createMockProvider(
        'claude-sonnet', 'anthropic', ['code', 'reasoning'], 'complex', true
      ));

      const decision = await router.route('Write a function');

      // vLLM should be selected, anthropic in fallback chain
      expect(decision.selectedModel).toBe('qwen2.5-coder-32b');
      expect(decision.fallbackChain).toContain('claude-sonnet');
    });
  });

  describe('Fallback Behavior', () => {
    it('should fall back to Claude when local fails', async () => {
      // vLLM unavailable, Claude available
      router.registerProvider(createMockProvider(
        'qwen2.5-coder-32b', 'vllm', ['code', 'reasoning'], 'complex', false
      ));
      router.registerProvider(createMockProvider(
        'deepseek-coder', 'ollama', ['code', 'writing'], 'simple', false
      ));
      router.registerProvider(createMockProvider(
        'claude-sonnet', 'anthropic', ['code', 'reasoning'], 'complex', true
      ));

      const decision = await router.route('Fix this complex bug');

      expect(decision.selectedModel).toBe('claude-sonnet');
      expect(decision.selectedProvider).toBe('anthropic');
    });

    it('should try all local providers before cloud', async () => {
      // qwen unavailable, deepseek available
      router.registerProvider(createMockProvider(
        'qwen2.5-coder-32b', 'vllm', ['code', 'reasoning'], 'complex', false
      ));
      router.registerProvider(createMockProvider(
        'deepseek-coder', 'ollama', ['code', 'writing'], 'simple', true
      ));
      router.registerProvider(createMockProvider(
        'claude-sonnet', 'anthropic', ['code', 'reasoning'], 'complex', true
      ));

      const decision = await router.route('Write a simple function');

      // Should use deepseek (local) instead of claude (cloud)
      expect(decision.selectedModel).toBe('deepseek-coder');
      expect(decision.selectedProvider).toBe('ollama');
    });

    it('should return to local when it recovers', async () => {
      // First route with local unavailable
      const vllmProvider = createMockProvider(
        'qwen2.5-coder-32b', 'vllm', ['code', 'reasoning'], 'complex', false
      );
      router.registerProvider(vllmProvider);
      router.registerProvider(createMockProvider(
        'claude-sonnet', 'anthropic', ['code', 'reasoning'], 'complex', true
      ));

      const decision1 = await router.route('Fix this bug');
      expect(decision1.selectedModel).toBe('claude-sonnet');

      // Simulate local recovery
      vi.spyOn(vllmProvider, 'isAvailable').mockResolvedValue(true);

      const decision2 = await router.route('Fix this bug');
      expect(decision2.selectedModel).toBe('qwen2.5-coder-32b');
    });
  });
});

describe('Graceful Degradation - Local-First', () => {
  describe('Fallback Chain Configuration', () => {
    it('should have vLLM as primary in default chain', () => {
      const defaultChain = DEFAULT_DEGRADATION_CONFIG.fallbackChains.default;
      expect(defaultChain.primary).toBe('vllm');
    });

    it('should have vLLM as primary in code chain', () => {
      const codeChain = DEFAULT_DEGRADATION_CONFIG.fallbackChains.code;
      expect(codeChain.primary).toBe('vllm');
    });

    it('should have cloud providers as fallbacks in default chain', () => {
      const defaultChain = DEFAULT_DEGRADATION_CONFIG.fallbackChains.default;
      expect(defaultChain.fallbacks).toContain('anthropic');
      expect(defaultChain.fallbacks).toContain('openai');
    });

    it('should have local_only chain without cloud fallbacks', () => {
      const localOnlyChain = DEFAULT_DEGRADATION_CONFIG.fallbackChains.local_only;
      expect(localOnlyChain.primary).toBe('vllm');
      expect(localOnlyChain.fallbacks).toContain('ollama');
      expect(localOnlyChain.fallbacks).not.toContain('anthropic');
      expect(localOnlyChain.fallbacks).not.toContain('openai');
    });

    it('should have cloud_only chain for explicit cloud preference', () => {
      const cloudOnlyChain = DEFAULT_DEGRADATION_CONFIG.fallbackChains.cloud_only;
      expect(cloudOnlyChain.primary).toBe('anthropic');
      expect(cloudOnlyChain.fallbacks).not.toContain('vllm');
      expect(cloudOnlyChain.fallbacks).not.toContain('ollama');
    });
  });
});

describe('Cost Tracking Verification', () => {
  it('should track $0 for local requests', async () => {
    resetCapabilityRouter();
    const router = initializeRouter({
      routerConfig: createLocalFirstConfig(),
    });

    router.registerProvider(createMockProvider(
      'qwen2.5-coder-32b', 'vllm', ['code', 'reasoning'], 'complex', true
    ));

    const decision = await router.route('Write code');
    const provider = router.getProvider(decision.selectedModel);

    expect(provider).toBeDefined();
    const cost = provider!.getCost(10000, 5000); // 10k input, 5k output tokens
    expect(cost.inputCost).toBe(0);
    expect(cost.outputCost).toBe(0);
    expect(cost.totalCost).toBe(0);
  });

  it('should track positive cost for cloud requests', async () => {
    resetCapabilityRouter();
    const router = initializeRouter({
      routerConfig: createLocalFirstConfig(),
    });

    // Only register cloud provider
    const claudeProvider = createMockProvider(
      'claude-sonnet', 'anthropic', ['code', 'reasoning'], 'complex', true
    );
    // Override getCost for claude
    vi.spyOn(claudeProvider, 'getCost').mockReturnValue({
      inputCost: 0.03, // $3 per 1M * 10k tokens
      outputCost: 0.075, // $15 per 1M * 5k tokens
      totalCost: 0.105,
    });
    router.registerProvider(claudeProvider);

    const decision = await router.route('Write code');
    const cost = router.getProvider(decision.selectedModel)!.getCost(10000, 5000);

    expect(cost.totalCost).toBeGreaterThan(0);
  });
});
