/**
 * Ollama LLM Provider
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Provides local model integration via Ollama:
 * - DeepSeek Coder V2 (deepseek-coder-v2:33b)
 * - DeepSeek V3 (deepseek-v3:latest)
 * - Qwen 2.5 Coder (qwen2.5-coder:32b)
 * - CodeLlama (codellama:34b)
 * - Llama 3.3 (llama3.3:70b)
 *
 * Zero-cost local inference with configurable base URL.
 */

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
 * Available Ollama models with their configurations
 */
export const OLLAMA_MODELS = {
  // DeepSeek Series
  'deepseek-coder-v2': {
    id: 'deepseek-coder-v2:33b',
    displayName: 'DeepSeek Coder V2 33B',
    capabilities: ['code', 'debug', 'refactor'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 16384,
    contextWindow: 128000,
  },
  'deepseek-v3': {
    id: 'deepseek-v3:latest',
    displayName: 'DeepSeek V3',
    capabilities: ['code', 'reasoning', 'writing', 'debug', 'refactor'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 32768,
    contextWindow: 128000,
  },

  // Qwen Series
  'qwen2.5-coder': {
    id: 'qwen2.5-coder:32b',
    displayName: 'Qwen 2.5 Coder 32B',
    capabilities: ['code', 'debug', 'refactor', 'test'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 16384,
    contextWindow: 131072,
  },
  'qwen2.5': {
    id: 'qwen2.5:72b',
    displayName: 'Qwen 2.5 72B',
    capabilities: ['code', 'reasoning', 'writing', 'research'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 32768,
    contextWindow: 131072,
  },

  // CodeLlama Series
  'codellama': {
    id: 'codellama:34b',
    displayName: 'CodeLlama 34B',
    capabilities: ['code', 'debug'] as ModelCapability[],
    maxComplexity: 'simple' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 8192,
    contextWindow: 16384,
  },

  // Llama 3 Series
  'llama3.3': {
    id: 'llama3.3:70b',
    displayName: 'Llama 3.3 70B',
    capabilities: ['code', 'reasoning', 'writing', 'research'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 16384,
    contextWindow: 131072,
  },
  'llama3.2': {
    id: 'llama3.2:3b',
    displayName: 'Llama 3.2 3B',
    capabilities: ['code', 'writing'] as ModelCapability[],
    maxComplexity: 'simple' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 4096,
    contextWindow: 131072,
  },

  // Mistral Series
  'mistral': {
    id: 'mistral:7b',
    displayName: 'Mistral 7B',
    capabilities: ['code', 'writing'] as ModelCapability[],
    maxComplexity: 'simple' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 8192,
    contextWindow: 32768,
  },
  'mixtral': {
    id: 'mixtral:8x7b',
    displayName: 'Mixtral 8x7B',
    capabilities: ['code', 'reasoning', 'writing'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    maxTokens: 16384,
    contextWindow: 32768,
  },
} as const;

export type OllamaModelKey = keyof typeof OLLAMA_MODELS;

// ===== OLLAMA API TYPES =====

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    num_predict?: number;
    temperature?: number;
    stop?: string[];
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface OllamaListResponse {
  models: Array<{
    name: string;
    model: string;
    modified_at: string;
    size: number;
  }>;
}

// ===== PROVIDER CONFIGURATION =====

/**
 * Configuration for OllamaProvider
 */
export interface OllamaProviderConfig {
  /** Model key from OLLAMA_MODELS */
  modelKey?: OllamaModelKey;
  /** Custom model ID override */
  modelId?: string;
  /** Base URL for Ollama API (default: http://localhost:11434) */
  baseUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Maximum retries */
  maxRetries?: number;
}

// ===== OLLAMA PROVIDER =====

/**
 * Ollama local model provider implementation
 */
export class OllamaProvider extends BaseLLMProvider {
  readonly id: string;
  readonly provider: ProviderType = 'ollama';
  readonly model: string;
  readonly capabilities: ModelCapability[];
  readonly maxComplexity: Complexity;
  protected readonly inputCostPer1M: number;
  protected readonly outputCostPer1M: number;

  private readonly baseUrl: string;
  private readonly modelConfig: typeof OLLAMA_MODELS[OllamaModelKey];
  private readonly maxTokensLimit: number;
  private readonly maxRetries: number;

  constructor(config: OllamaProviderConfig = {}) {
    super();

    const modelKey = config.modelKey ?? 'deepseek-coder-v2';
    this.modelConfig = OLLAMA_MODELS[modelKey];

    this.id = modelKey;
    this.model = config.modelId ?? this.modelConfig.id;
    this.capabilities = [...this.modelConfig.capabilities];
    this.maxComplexity = this.modelConfig.maxComplexity;
    this.inputCostPer1M = this.modelConfig.inputCostPer1M;
    this.outputCostPer1M = this.modelConfig.outputCostPer1M;
    this.maxTokensLimit = this.modelConfig.maxTokens;
    this.timeout = config.timeout ?? 120000; // Local models can be slower
    this.maxRetries = config.maxRetries ?? 2;

    // Ollama base URL
    this.baseUrl = config.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  }

  /**
   * Complete a prompt using Ollama
   */
  protected async doComplete(
    prompt: string,
    options: Required<CompletionOptions>
  ): Promise<LLMResponse> {
    const maxTokens = Math.min(options.maxTokens, this.maxTokensLimit);

    // Build messages array
    const messages: OllamaChatMessage[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const requestBody: OllamaChatRequest = {
      model: this.model,
      messages,
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: options.temperature,
        stop: options.stopSequences.length > 0 ? options.stopSequences : undefined,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/api/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          },
          this.timeout
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as OllamaChatResponse;

        const content = data.message?.content ?? '';

        // Estimate tokens (Ollama provides some metrics)
        const usage: TokenUsage = {
          inputTokens: data.prompt_eval_count ?? this.estimateTokens(prompt),
          outputTokens: data.eval_count ?? this.estimateTokens(content),
          totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
        };

        return this.createResponse(content, usage, {
          truncated: data.done_reason === 'length',
          stopReason: this.mapDoneReason(data.done_reason),
        });
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError ?? new Error('Ollama request failed');
  }

  /**
   * Stream completion from Ollama
   */
  async *stream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncIterable<string> {
    const mergedOptions = this.mergeOptions(options);
    const maxTokens = Math.min(mergedOptions.maxTokens, this.maxTokensLimit);

    const messages: OllamaChatMessage[] = [];

    if (mergedOptions.systemPrompt) {
      messages.push({ role: 'system', content: mergedOptions.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const requestBody: OllamaChatRequest = {
      model: this.model,
      messages,
      stream: true,
      options: {
        num_predict: maxTokens,
        temperature: mergedOptions.temperature,
        stop: mergedOptions.stopSequences.length > 0 ? mergedOptions.stopSequences : undefined,
      },
    };

    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (Ollama sends newline-delimited JSON)
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line) as OllamaStreamChunk;
              if (chunk.message?.content) {
                yield chunk.message.content;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Test connection to Ollama
   */
  async testConnection(): Promise<boolean> {
    try {
      // Check if Ollama is running
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: 'GET' },
        5000
      );

      if (!response.ok) {
        return false;
      }

      // Check if our model is available
      const data = await response.json() as OllamaListResponse;
      const availableModels = data.models?.map(m => m.name) ?? [];

      // Check for exact match or prefix match (model:tag format)
      const modelAvailable = availableModels.some(
        m => m === this.model || m.startsWith(this.model.split(':')[0])
      );

      return modelAvailable;
    } catch (error) {
      console.error('Ollama connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if Ollama service is running
   */
  async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: 'GET' },
        3000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List models available in Ollama
   */
  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: 'GET' },
        5000
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as OllamaListResponse;
      return data.models?.map(m => m.name) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Pull a model if not available
   */
  async pullModel(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: this.model }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Estimate token count (rough approximation)
   * Overrides base class method with same implementation
   */
  protected override estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Map Ollama done reason to our format
   */
  private mapDoneReason(
    reason: string | undefined
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
    return this.modelConfig.displayName;
  }

  /**
   * Get context window size
   */
  getContextWindow(): number {
    return this.modelConfig.contextWindow;
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
 * Create an Ollama provider for a specific model
 */
export function createOllamaProvider(
  modelKey: OllamaModelKey = 'deepseek-coder-v2',
  config: Omit<OllamaProviderConfig, 'modelKey'> = {}
): OllamaProvider {
  return new OllamaProvider({ ...config, modelKey });
}

/**
 * Create providers for all available Ollama models
 */
export function createAllOllamaProviders(
  config: Omit<OllamaProviderConfig, 'modelKey'> = {}
): Map<string, OllamaProvider> {
  const providers = new Map<string, OllamaProvider>();

  for (const modelKey of Object.keys(OLLAMA_MODELS) as OllamaModelKey[]) {
    providers.set(modelKey, createOllamaProvider(modelKey, config));
  }

  return providers;
}

/**
 * Check if Ollama is configured and running
 */
export async function isOllamaConfigured(): Promise<boolean> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

  try {
    const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available Ollama model configurations
 */
export function listOllamaModels(): Array<{
  key: string;
  id: string;
  displayName: string;
  maxComplexity: Complexity;
}> {
  return Object.entries(OLLAMA_MODELS).map(([key, config]) => ({
    key,
    id: config.id,
    displayName: config.displayName,
    maxComplexity: config.maxComplexity,
  }));
}

/**
 * Get the best local model for code tasks
 */
export function getBestLocalCodeModel(): OllamaModelKey {
  return 'deepseek-v3';
}

/**
 * Get the most efficient local model
 */
export function getEfficientLocalModel(): OllamaModelKey {
  return 'llama3.2';
}

/**
 * Check if a model is pulled in Ollama
 */
export async function isModelPulled(
  modelId: string,
  baseUrl?: string
): Promise<boolean> {
  const url = baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

  try {
    const response = await fetch(`${url}/api/tags`, { method: 'GET' });
    if (!response.ok) return false;

    const data = await response.json() as OllamaListResponse;
    const availableModels = data.models?.map(m => m.name) ?? [];

    return availableModels.some(
      m => m === modelId || m.startsWith(modelId.split(':')[0])
    );
  } catch {
    return false;
  }
}
