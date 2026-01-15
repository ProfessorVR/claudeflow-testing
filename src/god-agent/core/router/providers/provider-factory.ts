/**
 * LLM Provider Factory
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Manages LLM provider instances with:
 * - Factory pattern for provider creation
 * - Fallback chain when primary unavailable
 * - Provider health checking and caching
 * - Configuration-driven provider initialization
 */

import type {
  ILLMProvider,
  ProviderType,
  TaskClassification,
  RouterConfig,
  ModelCapability,
} from '../router-types.js';
import { ProviderUnavailableError } from '../router-types.js';
import {
  AnthropicProvider,
  createAnthropicProvider,
  isAnthropicConfigured,
  type AnthropicModelKey,
  ANTHROPIC_MODELS,
} from './anthropic-provider.js';
import {
  OpenAIProvider,
  createOpenAIProvider,
  isOpenAIConfigured,
  type OpenAIModelKey,
  OPENAI_MODELS,
} from './openai-provider.js';
import {
  OllamaProvider,
  createOllamaProvider,
  isOllamaConfigured,
  type OllamaModelKey,
  OLLAMA_MODELS,
} from './ollama-provider.js';
import {
  VLLMProvider,
  createVLLMProvider,
  isVLLMConfigured,
  isVLLMEnvConfigured,
  type VLLMModelKey,
  VLLM_MODELS,
} from './vllm-provider.js';

// ===== PROVIDER REGISTRY =====

/**
 * Registry of all available providers by ID
 */
interface ProviderRegistry {
  providers: Map<string, ILLMProvider>;
  healthStatus: Map<string, boolean>;
  lastHealthCheck: Map<string, number>;
}

// ===== FACTORY CONFIGURATION =====

/**
 * Configuration for the provider factory
 */
export interface ProviderFactoryConfig {
  /** Router configuration with model definitions */
  routerConfig?: RouterConfig;
  /** Health check interval in ms (default: 60000) */
  healthCheckInterval?: number;
  /** Cache health status for this duration (default: 30000) */
  healthCacheDuration?: number;
  /** Auto-initialize providers on factory creation */
  autoInitialize?: boolean;
  /** Provider-specific configurations */
  anthropic?: {
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
  };
  openai?: {
    apiKey?: string;
    baseUrl?: string;
    organization?: string;
    timeout?: number;
  };
  ollama?: {
    baseUrl?: string;
    timeout?: number;
  };
  vllm?: {
    baseUrl?: string;
    timeout?: number;
    apiKey?: string;
  };
}

// ===== PROVIDER FACTORY =====

/**
 * Factory for creating and managing LLM providers
 */
export class LLMProviderFactory {
  private readonly registry: ProviderRegistry = {
    providers: new Map(),
    healthStatus: new Map(),
    lastHealthCheck: new Map(),
  };

  private readonly config: Required<ProviderFactoryConfig>;
  private initialized = false;

  constructor(config: ProviderFactoryConfig = {}) {
    this.config = {
      routerConfig: config.routerConfig ?? { models: {}, routingRules: [] },
      healthCheckInterval: config.healthCheckInterval ?? 60000,
      healthCacheDuration: config.healthCacheDuration ?? 30000,
      autoInitialize: config.autoInitialize ?? false,
      anthropic: config.anthropic ?? {},
      openai: config.openai ?? {},
      ollama: config.ollama ?? {},
      vllm: config.vllm ?? {},
    };

    if (this.config.autoInitialize) {
      this.initializeDefaultProviders().catch(console.error);
    }
  }

  /**
   * Initialize all default providers based on available API keys
   */
  async initializeDefaultProviders(): Promise<void> {
    if (this.initialized) return;

    // Initialize Anthropic providers if configured
    if (isAnthropicConfigured() || this.config.anthropic?.apiKey) {
      await this.initializeAnthropicProviders();
    }

    // Initialize OpenAI providers if configured
    if (isOpenAIConfigured() || this.config.openai?.apiKey) {
      await this.initializeOpenAIProviders();
    }

    // Initialize Ollama providers if running
    if (await isOllamaConfigured()) {
      await this.initializeOllamaProviders();
    }

    // Initialize vLLM providers if running
    if (isVLLMEnvConfigured() || await isVLLMConfigured()) {
      await this.initializeVLLMProviders();
    }

    this.initialized = true;
  }

  /**
   * Initialize all Anthropic providers
   */
  private async initializeAnthropicProviders(): Promise<void> {
    for (const modelKey of Object.keys(ANTHROPIC_MODELS) as AnthropicModelKey[]) {
      const provider = createAnthropicProvider(modelKey, {
        apiKey: this.config.anthropic?.apiKey,
        baseUrl: this.config.anthropic?.baseUrl,
        timeout: this.config.anthropic?.timeout,
      });
      this.registerProvider(provider);
    }
  }

  /**
   * Initialize all OpenAI providers
   */
  private async initializeOpenAIProviders(): Promise<void> {
    for (const modelKey of Object.keys(OPENAI_MODELS) as OpenAIModelKey[]) {
      const provider = createOpenAIProvider(modelKey, {
        apiKey: this.config.openai?.apiKey,
        baseUrl: this.config.openai?.baseUrl,
        organization: this.config.openai?.organization,
        timeout: this.config.openai?.timeout,
      });
      this.registerProvider(provider);
    }
  }

  /**
   * Initialize all Ollama providers
   */
  private async initializeOllamaProviders(): Promise<void> {
    for (const modelKey of Object.keys(OLLAMA_MODELS) as OllamaModelKey[]) {
      const provider = createOllamaProvider(modelKey, {
        baseUrl: this.config.ollama?.baseUrl,
        timeout: this.config.ollama?.timeout,
      });
      this.registerProvider(provider);
    }
  }

  /**
   * Initialize all vLLM providers
   */
  private async initializeVLLMProviders(): Promise<void> {
    for (const modelKey of Object.keys(VLLM_MODELS) as VLLMModelKey[]) {
      const provider = createVLLMProvider(modelKey, {
        baseUrl: this.config.vllm?.baseUrl,
        timeout: this.config.vllm?.timeout,
        apiKey: this.config.vllm?.apiKey,
      });
      this.registerProvider(provider);
    }
  }

  /**
   * Register a provider in the factory
   */
  registerProvider(provider: ILLMProvider): void {
    this.registry.providers.set(provider.id, provider);
    // Initialize health status as unknown (null treated as unchecked)
    this.registry.healthStatus.set(provider.id, true);
    this.registry.lastHealthCheck.set(provider.id, 0);
  }

  /**
   * Unregister a provider from the factory
   */
  unregisterProvider(providerId: string): boolean {
    const deleted = this.registry.providers.delete(providerId);
    this.registry.healthStatus.delete(providerId);
    this.registry.lastHealthCheck.delete(providerId);
    return deleted;
  }

  /**
   * Get a provider by ID
   */
  getProvider(providerId: string): ILLMProvider | undefined {
    return this.registry.providers.get(providerId);
  }

  /**
   * Get a provider, throwing if not found
   */
  getProviderOrThrow(providerId: string): ILLMProvider {
    const provider = this.registry.providers.get(providerId);
    if (!provider) {
      throw new ProviderUnavailableError(
        providerId,
        `Provider '${providerId}' not found`
      );
    }
    return provider;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ILLMProvider[] {
    return Array.from(this.registry.providers.values());
  }

  /**
   * Get all provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.registry.providers.keys());
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: ProviderType): ILLMProvider[] {
    return this.getAllProviders().filter(p => p.provider === type);
  }

  /**
   * Get providers that support a capability
   */
  getProvidersByCapability(capability: ModelCapability): ILLMProvider[] {
    return this.getAllProviders().filter(p =>
      p.capabilities.includes(capability)
    );
  }

  /**
   * Check if a provider is healthy (with caching)
   */
  async isProviderHealthy(providerId: string): Promise<boolean> {
    const provider = this.registry.providers.get(providerId);
    if (!provider) return false;

    const lastCheck = this.registry.lastHealthCheck.get(providerId) ?? 0;
    const now = Date.now();

    // Return cached result if within cache duration
    if (now - lastCheck < this.config.healthCacheDuration) {
      return this.registry.healthStatus.get(providerId) ?? false;
    }

    // Perform health check
    try {
      const healthy = await provider.isAvailable();
      this.registry.healthStatus.set(providerId, healthy);
      this.registry.lastHealthCheck.set(providerId, now);
      return healthy;
    } catch {
      this.registry.healthStatus.set(providerId, false);
      this.registry.lastHealthCheck.set(providerId, now);
      return false;
    }
  }

  /**
   * Get all healthy providers
   */
  async getHealthyProviders(): Promise<ILLMProvider[]> {
    const providers = this.getAllProviders();
    const healthChecks = await Promise.all(
      providers.map(async p => ({
        provider: p,
        healthy: await this.isProviderHealthy(p.id),
      }))
    );

    return healthChecks
      .filter(({ healthy }) => healthy)
      .map(({ provider }) => provider);
  }

  /**
   * Test connectivity for a provider
   */
  async testProvider(providerId: string): Promise<boolean> {
    const provider = this.registry.providers.get(providerId);
    if (!provider) return false;

    try {
      const available = await provider.isAvailable();
      this.registry.healthStatus.set(providerId, available);
      this.registry.lastHealthCheck.set(providerId, Date.now());
      return available;
    } catch {
      this.registry.healthStatus.set(providerId, false);
      this.registry.lastHealthCheck.set(providerId, Date.now());
      return false;
    }
  }

  /**
   * Test all providers and return status
   */
  async testAllProviders(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [id] of this.registry.providers) {
      const healthy = await this.testProvider(id);
      results.set(id, healthy);
    }

    return results;
  }

  /**
   * Get fallback chain for a task classification
   */
  getFallbackChain(
    task: TaskClassification,
    preferredProviders?: string[]
  ): string[] {
    const chain: string[] = [];
    const seen = new Set<string>();

    // Add preferred providers first
    if (preferredProviders) {
      for (const id of preferredProviders) {
        if (this.registry.providers.has(id) && !seen.has(id)) {
          chain.push(id);
          seen.add(id);
        }
      }
    }

    // Map task type to capability
    const capability = this.mapTaskTypeToCapability(task.type);

    // Get all providers sorted by suitability
    const candidates = this.getAllProviders()
      .filter(p => !seen.has(p.id))
      .filter(p => p.capabilities.includes(capability))
      .filter(p => this.isComplexitySufficient(p.maxComplexity, task.complexity))
      .sort((a, b) => {
        // Sort by complexity match (prefer exact matches)
        const aExact = a.maxComplexity === task.complexity ? 1 : 0;
        const bExact = b.maxComplexity === task.complexity ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Then by cost (prefer cheaper for simple tasks)
        if (task.complexity === 'simple') {
          const aCost = a.getCost(1000, 1000).totalCost;
          const bCost = b.getCost(1000, 1000).totalCost;
          return aCost - bCost;
        }

        // For complex tasks, prefer more capable (higher cost usually = more capable)
        const aCost = a.getCost(1000, 1000).totalCost;
        const bCost = b.getCost(1000, 1000).totalCost;
        return bCost - aCost;
      });

    for (const provider of candidates) {
      chain.push(provider.id);
      seen.add(provider.id);
    }

    return chain;
  }

  /**
   * Get the first available provider from a fallback chain
   */
  async getFirstAvailable(fallbackChain: string[]): Promise<ILLMProvider | null> {
    for (const providerId of fallbackChain) {
      const provider = this.registry.providers.get(providerId);
      if (!provider) continue;

      const healthy = await this.isProviderHealthy(providerId);
      if (healthy) {
        return provider;
      }
    }

    return null;
  }

  /**
   * Map task type to model capability
   */
  private mapTaskTypeToCapability(taskType: string): ModelCapability {
    switch (taskType) {
      case 'code_edit':
        return 'code';
      case 'reasoning':
        return 'reasoning';
      case 'writing':
        return 'writing';
      case 'refactor':
        return 'refactor';
      case 'research':
        return 'research';
      case 'debug':
        return 'debug';
      case 'test':
        return 'test';
      default:
        return 'code';
    }
  }

  /**
   * Check if provider complexity is sufficient for task
   */
  private isComplexitySufficient(
    providerComplexity: string,
    taskComplexity: string
  ): boolean {
    const levels = { simple: 1, medium: 2, complex: 3 };
    const providerLevel = levels[providerComplexity as keyof typeof levels] ?? 0;
    const taskLevel = levels[taskComplexity as keyof typeof levels] ?? 0;
    return providerLevel >= taskLevel;
  }

  /**
   * Get provider statistics
   */
  getStats(): {
    totalProviders: number;
    byType: Record<string, number>;
    healthy: number;
    unhealthy: number;
  } {
    const providers = this.getAllProviders();
    const byType: Record<string, number> = {};

    for (const provider of providers) {
      byType[provider.provider] = (byType[provider.provider] ?? 0) + 1;
    }

    let healthy = 0;
    let unhealthy = 0;

    for (const [, status] of this.registry.healthStatus) {
      if (status) healthy++;
      else unhealthy++;
    }

    return {
      totalProviders: providers.length,
      byType,
      healthy,
      unhealthy,
    };
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.registry.providers.clear();
    this.registry.healthStatus.clear();
    this.registry.lastHealthCheck.clear();
    this.initialized = false;
  }

  /**
   * Invalidate health cache for a provider
   */
  invalidateHealthCache(providerId?: string): void {
    if (providerId) {
      this.registry.lastHealthCheck.set(providerId, 0);
    } else {
      for (const [id] of this.registry.lastHealthCheck) {
        this.registry.lastHealthCheck.set(id, 0);
      }
    }
  }
}

// ===== SINGLETON INSTANCE =====

let factoryInstance: LLMProviderFactory | null = null;

/**
 * Get the singleton provider factory instance
 */
export function getProviderFactory(
  config?: ProviderFactoryConfig
): LLMProviderFactory {
  if (!factoryInstance) {
    factoryInstance = new LLMProviderFactory(config);
  }
  return factoryInstance;
}

/**
 * Initialize the provider factory with configuration
 */
export async function initializeProviderFactory(
  config?: ProviderFactoryConfig
): Promise<LLMProviderFactory> {
  if (factoryInstance) {
    factoryInstance.clear();
  }
  factoryInstance = new LLMProviderFactory(config);
  await factoryInstance.initializeDefaultProviders();
  return factoryInstance;
}

/**
 * Reset the provider factory singleton
 */
export function resetProviderFactory(): void {
  if (factoryInstance) {
    factoryInstance.clear();
  }
  factoryInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a provider by ID
 */
export function createProviderById(
  providerId: string,
  config?: {
    anthropic?: { apiKey?: string; baseUrl?: string; timeout?: number };
    openai?: { apiKey?: string; baseUrl?: string; organization?: string; timeout?: number };
    ollama?: { baseUrl?: string; timeout?: number };
    vllm?: { baseUrl?: string; timeout?: number; apiKey?: string };
  }
): ILLMProvider | null {
  // Check Anthropic models
  if (providerId in ANTHROPIC_MODELS) {
    return createAnthropicProvider(
      providerId as AnthropicModelKey,
      config?.anthropic
    );
  }

  // Check OpenAI models
  if (providerId in OPENAI_MODELS) {
    return createOpenAIProvider(
      providerId as OpenAIModelKey,
      config?.openai
    );
  }

  // Check Ollama models
  if (providerId in OLLAMA_MODELS) {
    return createOllamaProvider(
      providerId as OllamaModelKey,
      config?.ollama
    );
  }

  // Check vLLM models
  if (providerId in VLLM_MODELS) {
    return createVLLMProvider(
      providerId as VLLMModelKey,
      config?.vllm
    );
  }

  return null;
}

/**
 * Get provider type from ID
 */
export function getProviderType(providerId: string): ProviderType | null {
  if (providerId in ANTHROPIC_MODELS) return 'anthropic';
  if (providerId in OPENAI_MODELS) return 'openai';
  if (providerId in OLLAMA_MODELS) return 'ollama';
  if (providerId in VLLM_MODELS) return 'vllm';
  return null;
}

/**
 * List all available model IDs
 */
export function listAllModelIds(): string[] {
  return [
    ...Object.keys(ANTHROPIC_MODELS),
    ...Object.keys(OPENAI_MODELS),
    ...Object.keys(OLLAMA_MODELS),
    ...Object.keys(VLLM_MODELS),
  ];
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): {
  id: string;
  displayName: string;
  provider: ProviderType;
  capabilities: ModelCapability[];
  maxComplexity: string;
  contextWindow: number;
  costPer1M: { input: number; output: number };
} | null {
  if (modelId in ANTHROPIC_MODELS) {
    const config = ANTHROPIC_MODELS[modelId as AnthropicModelKey];
    return {
      id: config.id,
      displayName: config.displayName,
      provider: 'anthropic',
      capabilities: [...config.capabilities],
      maxComplexity: config.maxComplexity,
      contextWindow: config.contextWindow,
      costPer1M: {
        input: config.inputCostPer1M,
        output: config.outputCostPer1M,
      },
    };
  }

  if (modelId in OPENAI_MODELS) {
    const config = OPENAI_MODELS[modelId as OpenAIModelKey];
    return {
      id: config.id,
      displayName: config.displayName,
      provider: 'openai',
      capabilities: [...config.capabilities],
      maxComplexity: config.maxComplexity,
      contextWindow: config.contextWindow,
      costPer1M: {
        input: config.inputCostPer1M,
        output: config.outputCostPer1M,
      },
    };
  }

  if (modelId in OLLAMA_MODELS) {
    const config = OLLAMA_MODELS[modelId as OllamaModelKey];
    return {
      id: config.id,
      displayName: config.displayName,
      provider: 'ollama',
      capabilities: [...config.capabilities],
      maxComplexity: config.maxComplexity,
      contextWindow: config.contextWindow,
      costPer1M: {
        input: config.inputCostPer1M,
        output: config.outputCostPer1M,
      },
    };
  }

  if (modelId in VLLM_MODELS) {
    const config = VLLM_MODELS[modelId as VLLMModelKey];
    return {
      id: config.id,
      displayName: config.displayName,
      provider: 'vllm',
      capabilities: [...config.capabilities],
      maxComplexity: config.maxComplexity,
      contextWindow: config.contextWindow,
      costPer1M: {
        input: config.inputCostPer1M,
        output: config.outputCostPer1M,
      },
    };
  }

  return null;
}

/**
 * Check which providers are currently configured
 */
export async function getConfiguredProviders(): Promise<ProviderType[]> {
  const configured: ProviderType[] = [];

  if (isAnthropicConfigured()) {
    configured.push('anthropic');
  }

  if (isOpenAIConfigured()) {
    configured.push('openai');
  }

  if (await isOllamaConfigured()) {
    configured.push('ollama');
  }

  if (isVLLMEnvConfigured() || await isVLLMConfigured()) {
    configured.push('vllm');
  }

  return configured;
}
