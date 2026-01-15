/**
 * vLLM LLM Provider
 *
 * Implements TIER-2.1: Intelligent Model Router - Phase 5
 *
 * Provides local model integration via vLLM's OpenAI-compatible API:
 * - Qwen 2.5 Coder 32B (primary local coding model)
 * - DeepSeek Coder V2 (alternative)
 * - Custom models loaded into vLLM
 *
 * Zero-cost local inference with high performance on RTX 5090 (32GB VRAM).
 * Uses OpenAI SDK for API compatibility.
 */

import OpenAI from 'openai';
import {
  BaseLLMProvider,
} from '../llm-provider.js';
import type {
  ProviderType,
  ModelCapability,
  Complexity,
  CompletionOptions,
  LLMResponse,
  TokenUsage,
} from '../router-types.js';

// ===== MODEL DEFINITIONS =====

/**
 * Available vLLM models with their configurations
 */
export const VLLM_MODELS = {
  // Primary: Qwen 2.5 Coder 32B
  'qwen2.5-coder-32b': {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    displayName: 'Qwen 2.5 Coder 32B',
    capabilities: ['code', 'debug', 'refactor', 'test', 'writing'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 0.0,  // Local = free
    outputCostPer1M: 0.0,
    maxTokens: 32768,
    contextWindow: 131072,
  },

  // DeepSeek Coder V2
  'deepseek-coder-v2': {
    id: 'deepseek-ai/DeepSeek-Coder-V2-Instruct',
    displayName: 'DeepSeek Coder V2',
    capabilities: ['code', 'debug', 'refactor'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 16384,
    contextWindow: 128000,
  },

  // DeepSeek V3 (if loaded)
  'deepseek-v3': {
    id: 'deepseek-ai/DeepSeek-V3',
    displayName: 'DeepSeek V3',
    capabilities: ['code', 'reasoning', 'writing', 'debug', 'refactor'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 32768,
    contextWindow: 128000,
  },

  // Codestral 22B
  'codestral-22b': {
    id: 'mistralai/Codestral-22B-v0.1',
    displayName: 'Codestral 22B',
    capabilities: ['code', 'debug', 'refactor'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 32768,
    contextWindow: 32768,
  },
} as const;

export type VLLMModelKey = keyof typeof VLLM_MODELS;

// ===== PROVIDER CONFIGURATION =====

/**
 * Configuration for VLLMProvider
 */
export interface VLLMProviderConfig {
  /** Model key from VLLM_MODELS */
  modelKey?: VLLMModelKey;
  /** Custom model ID override (for models not in VLLM_MODELS) */
  modelId?: string;
  /** Base URL for vLLM API (default: http://localhost:8000) */
  baseUrl?: string;
  /** Request timeout in ms (default: 120000 - local can be slower) */
  timeout?: number;
  /** Maximum retries */
  maxRetries?: number;
  /** API key (usually not needed for local vLLM) */
  apiKey?: string;
}

// ===== VLLM PROVIDER =====

/**
 * vLLM provider implementation using OpenAI-compatible API
 */
export class VLLMProvider extends BaseLLMProvider {
  readonly id: string;
  readonly provider: ProviderType = 'vllm';
  readonly model: string;
  readonly capabilities: ModelCapability[];
  readonly maxComplexity: Complexity;
  protected readonly inputCostPer1M: number;
  protected readonly outputCostPer1M: number;

  private readonly client: OpenAI;
  private readonly modelConfig: typeof VLLM_MODELS[VLLMModelKey] | null;
  private readonly maxTokensLimit: number;
  private readonly baseUrl: string;

  constructor(config: VLLMProviderConfig = {}) {
    super();

    const modelKey = config.modelKey ?? 'qwen2.5-coder-32b';
    this.modelConfig = VLLM_MODELS[modelKey] ?? null;

    this.id = modelKey;
    this.model = config.modelId ?? this.modelConfig?.id ?? modelKey;
    this.capabilities = this.modelConfig?.capabilities ? [...this.modelConfig.capabilities] : ['code'];
    this.maxComplexity = this.modelConfig?.maxComplexity ?? 'medium';
    this.inputCostPer1M = this.modelConfig?.inputCostPer1M ?? 0.0;
    this.outputCostPer1M = this.modelConfig?.outputCostPer1M ?? 0.0;
    this.maxTokensLimit = this.modelConfig?.maxTokens ?? 16384;
    this.timeout = config.timeout ?? 120000; // Local models can be slower
    this.baseUrl = config.baseUrl ?? process.env.VLLM_BASE_URL ?? 'http://localhost:8000';

    // Initialize OpenAI client pointing to vLLM server
    this.client = new OpenAI({
      apiKey: config.apiKey ?? process.env.VLLM_API_KEY ?? 'not-needed',
      baseURL: `${this.baseUrl}/v1`,
      timeout: this.timeout,
      maxRetries: config.maxRetries ?? 2,
    });
  }

  /**
   * Complete a prompt using vLLM
   */
  protected async doComplete(
    prompt: string,
    options: Required<CompletionOptions>
  ): Promise<LLMResponse> {
    const maxTokens = Math.min(options.maxTokens, this.maxTokensLimit);

    // Build messages array
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    // Make API request via OpenAI-compatible endpoint
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature: options.temperature,
      stop: options.stopSequences.length > 0 ? options.stopSequences : undefined,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content ?? '';

    const usage: TokenUsage = {
      inputTokens: response.usage?.prompt_tokens ?? this.estimateTokens(prompt),
      outputTokens: response.usage?.completion_tokens ?? this.estimateTokens(content),
      totalTokens: response.usage?.total_tokens ?? 0,
    };

    return this.createResponse(content, usage, {
      truncated: choice?.finish_reason === 'length',
      stopReason: this.mapFinishReason(choice?.finish_reason),
    });
  }

  /**
   * Stream completion from vLLM
   */
  async *stream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncIterable<string> {
    const mergedOptions = this.mergeOptions(options);
    const maxTokens = Math.min(mergedOptions.maxTokens, this.maxTokensLimit);

    // Build messages array
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (mergedOptions.systemPrompt) {
      messages.push({ role: 'system', content: mergedOptions.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature: mergedOptions.temperature,
      stop: mergedOptions.stopSequences.length > 0 ? mergedOptions.stopSequences : undefined,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }

  /**
   * Test connection to vLLM server
   */
  async testConnection(): Promise<boolean> {
    try {
      // Check if vLLM server is responding
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        // Try v1/models endpoint as fallback
        const modelsResponse = await fetch(`${this.baseUrl}/v1/models`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        return modelsResponse.ok;
      }

      return true;
    } catch (error) {
      console.error('vLLM connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if vLLM server is running and the model is loaded
   */
  async isModelLoaded(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return false;

      const data = await response.json() as { data: Array<{ id: string }> };
      const loadedModels = data.data?.map(m => m.id) ?? [];

      // Check if our model is loaded
      return loadedModels.some(m =>
        m === this.model ||
        m.includes(this.model) ||
        this.model.includes(m)
      );
    } catch {
      return false;
    }
  }

  /**
   * Get list of models loaded in vLLM
   */
  async getLoadedModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return [];

      const data = await response.json() as { data: Array<{ id: string }> };
      return data.data?.map(m => m.id) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Get vLLM server metrics (if available)
   */
  async getServerMetrics(): Promise<{
    running: boolean;
    gpuMemoryUsed?: number;
    requestsInProgress?: number;
  }> {
    try {
      // Try to get metrics from vLLM's metrics endpoint
      const response = await fetch(`${this.baseUrl}/metrics`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        // Just check if server is running
        const healthCheck = await this.testConnection();
        return { running: healthCheck };
      }

      // Parse Prometheus-format metrics
      const text = await response.text();
      const gpuMatch = text.match(/vllm:gpu_memory_used_bytes\s+(\d+)/);
      const requestsMatch = text.match(/vllm:requests_in_progress\s+(\d+)/);

      return {
        running: true,
        gpuMemoryUsed: gpuMatch ? parseInt(gpuMatch[1]) : undefined,
        requestsInProgress: requestsMatch ? parseInt(requestsMatch[1]) : undefined,
      };
    } catch {
      return { running: false };
    }
  }

  /**
   * Map finish reason to our format
   */
  private mapFinishReason(
    reason: string | null | undefined
  ): LLMResponse['stopReason'] {
    switch (reason) {
      case 'length':
        return 'max_tokens';
      case 'stop':
        return 'stop_sequence';
      default:
        return 'end_turn';
    }
  }

  /**
   * Get model display name
   */
  getDisplayName(): string {
    return this.modelConfig?.displayName ?? this.model;
  }

  /**
   * Get context window size
   */
  getContextWindow(): number {
    return this.modelConfig?.contextWindow ?? 32768;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create a vLLM provider for a specific model
 */
export function createVLLMProvider(
  modelKey: VLLMModelKey = 'qwen2.5-coder-32b',
  config: Omit<VLLMProviderConfig, 'modelKey'> = {}
): VLLMProvider {
  return new VLLMProvider({ ...config, modelKey });
}

/**
 * Create providers for all available vLLM models
 */
export function createAllVLLMProviders(
  config: Omit<VLLMProviderConfig, 'modelKey'> = {}
): Map<string, VLLMProvider> {
  const providers = new Map<string, VLLMProvider>();

  for (const modelKey of Object.keys(VLLM_MODELS) as VLLMModelKey[]) {
    providers.set(modelKey, createVLLMProvider(modelKey, config));
  }

  return providers;
}

/**
 * Check if vLLM server is configured and running
 */
export async function isVLLMConfigured(): Promise<boolean> {
  const baseUrl = process.env.VLLM_BASE_URL ?? 'http://localhost:8000';

  try {
    // Check if vLLM server responds
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if vLLM server is running (synchronous check for env var)
 */
export function isVLLMEnvConfigured(): boolean {
  return !!process.env.VLLM_BASE_URL || !!process.env.VLLM_ENABLED;
}

/**
 * List available vLLM model configurations
 */
export function listVLLMModels(): Array<{
  key: string;
  id: string;
  displayName: string;
  maxComplexity: Complexity;
}> {
  return Object.entries(VLLM_MODELS).map(([key, config]) => ({
    key,
    id: config.id,
    displayName: config.displayName,
    maxComplexity: config.maxComplexity,
  }));
}

/**
 * Get the best local model for code tasks
 */
export function getBestLocalCodeModel(): VLLMModelKey {
  return 'qwen2.5-coder-32b';
}

/**
 * Get vLLM server status
 */
export async function getVLLMStatus(): Promise<{
  running: boolean;
  baseUrl: string;
  loadedModels: string[];
  metrics?: {
    gpuMemoryUsed?: number;
    requestsInProgress?: number;
  };
}> {
  const baseUrl = process.env.VLLM_BASE_URL ?? 'http://localhost:8000';
  const provider = new VLLMProvider({ baseUrl });

  const running = await provider.testConnection();
  const loadedModels = running ? await provider.getLoadedModels() : [];
  const metricsData = running ? await provider.getServerMetrics() : undefined;

  return {
    running,
    baseUrl,
    loadedModels,
    metrics: metricsData ? {
      gpuMemoryUsed: metricsData.gpuMemoryUsed,
      requestsInProgress: metricsData.requestsInProgress,
    } : undefined,
  };
}
