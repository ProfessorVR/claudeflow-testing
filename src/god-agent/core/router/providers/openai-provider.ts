/**
 * OpenAI LLM Provider
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Provides OpenAI model integration:
 * - GPT-5.2 (gpt-5.2-2025-01)
 * - GPT-5 (gpt-5-2024-12)
 * - GPT-4o (gpt-4o-2024-11-20)
 * - GPT-4o Mini (gpt-4o-mini-2024-07-18)
 * - o3 (o3-2025-01)
 * - o1 (o1-2024-12-17)
 * - o1-mini (o1-mini-2024-09-12)
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
 * Available OpenAI models with their configurations
 */
export const OPENAI_MODELS = {
  // GPT-5 Series (Latest)
  'gpt-5.2': {
    id: 'gpt-5.2-2025-01',
    displayName: 'GPT-5.2',
    capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 5.0,
    outputCostPer1M: 20.0,
    maxTokens: 32768,
    contextWindow: 256000,
    supportsSystemPrompt: true,
  },
  'gpt-5': {
    id: 'gpt-5-2024-12',
    displayName: 'GPT-5',
    capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 4.0,
    outputCostPer1M: 16.0,
    maxTokens: 32768,
    contextWindow: 200000,
    supportsSystemPrompt: true,
  },

  // GPT-4o Series
  'gpt-4o': {
    id: 'gpt-4o-2024-11-20',
    displayName: 'GPT-4o',
    capabilities: ['code', 'reasoning', 'writing', 'refactor'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    maxTokens: 16384,
    contextWindow: 128000,
    supportsSystemPrompt: true,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini-2024-07-18',
    displayName: 'GPT-4o Mini',
    capabilities: ['code', 'writing'] as ModelCapability[],
    maxComplexity: 'simple' as Complexity,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    maxTokens: 16384,
    contextWindow: 128000,
    supportsSystemPrompt: true,
  },

  // o-Series (Reasoning Models)
  'o3': {
    id: 'o3-2025-01',
    displayName: 'o3',
    capabilities: ['reasoning', 'code', 'research'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 20.0,
    outputCostPer1M: 80.0,
    maxTokens: 100000,
    contextWindow: 200000,
    supportsSystemPrompt: false, // o-series uses different API
    isReasoningModel: true,
  },
  'o1': {
    id: 'o1-2024-12-17',
    displayName: 'o1',
    capabilities: ['reasoning', 'code'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 15.0,
    outputCostPer1M: 60.0,
    maxTokens: 100000,
    contextWindow: 200000,
    supportsSystemPrompt: false,
    isReasoningModel: true,
  },
  'o1-mini': {
    id: 'o1-mini-2024-09-12',
    displayName: 'o1-mini',
    capabilities: ['reasoning', 'code'] as ModelCapability[],
    maxComplexity: 'medium' as Complexity,
    inputCostPer1M: 3.0,
    outputCostPer1M: 12.0,
    maxTokens: 65536,
    contextWindow: 128000,
    supportsSystemPrompt: false,
    isReasoningModel: true,
  },
} as const;

export type OpenAIModelKey = keyof typeof OPENAI_MODELS;

// ===== PROVIDER CONFIGURATION =====

/**
 * Configuration for OpenAIProvider
 */
export interface OpenAIProviderConfig {
  /** Model key from OPENAI_MODELS */
  modelKey?: OpenAIModelKey;
  /** Custom model ID override */
  modelId?: string;
  /** API key (defaults to OPENAI_API_KEY env var) */
  apiKey?: string;
  /** Base URL for API */
  baseUrl?: string;
  /** Organization ID */
  organization?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Maximum retries */
  maxRetries?: number;
}

// ===== OPENAI PROVIDER =====

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseLLMProvider {
  readonly id: string;
  readonly provider: ProviderType = 'openai';
  readonly model: string;
  readonly capabilities: ModelCapability[];
  readonly maxComplexity: Complexity;
  protected readonly inputCostPer1M: number;
  protected readonly outputCostPer1M: number;

  private readonly client: OpenAI;
  private readonly modelConfig: typeof OPENAI_MODELS[OpenAIModelKey];
  private readonly maxTokensLimit: number;
  private readonly isReasoningModel: boolean;
  private readonly supportsSystemPrompt: boolean;

  constructor(config: OpenAIProviderConfig = {}) {
    super();

    const modelKey = config.modelKey ?? 'gpt-4o';
    this.modelConfig = OPENAI_MODELS[modelKey];

    this.id = modelKey;
    this.model = config.modelId ?? this.modelConfig.id;
    this.capabilities = [...this.modelConfig.capabilities];
    this.maxComplexity = this.modelConfig.maxComplexity;
    this.inputCostPer1M = this.modelConfig.inputCostPer1M;
    this.outputCostPer1M = this.modelConfig.outputCostPer1M;
    this.maxTokensLimit = this.modelConfig.maxTokens;
    this.isReasoningModel = 'isReasoningModel' in this.modelConfig && this.modelConfig.isReasoningModel === true;
    this.supportsSystemPrompt = this.modelConfig.supportsSystemPrompt;
    this.timeout = config.timeout ?? 60000;

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: config.baseUrl,
      organization: config.organization,
      timeout: this.timeout,
      maxRetries: config.maxRetries ?? 2,
    });
  }

  /**
   * Complete a prompt using OpenAI
   */
  protected async doComplete(
    prompt: string,
    options: Required<CompletionOptions>
  ): Promise<LLMResponse> {
    const maxTokens = Math.min(options.maxTokens, this.maxTokensLimit);

    // Build messages array
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    // Add system message if supported and provided
    if (this.supportsSystemPrompt && options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    // For reasoning models, incorporate system prompt into user message
    if (!this.supportsSystemPrompt && options.systemPrompt) {
      messages.push({
        role: 'user',
        content: `${options.systemPrompt}\n\n${prompt}`,
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    // Make API request
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_completion_tokens: maxTokens,
      temperature: this.isReasoningModel ? undefined : options.temperature, // Reasoning models don't use temperature
      stop: options.stopSequences.length > 0 ? options.stopSequences : undefined,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content ?? '';

    const usage: TokenUsage = {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };

    return this.createResponse(content, usage, {
      truncated: choice?.finish_reason === 'length',
      stopReason: this.mapFinishReason(choice?.finish_reason),
    });
  }

  /**
   * Stream completion from OpenAI
   */
  async *stream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncIterable<string> {
    const mergedOptions = this.mergeOptions(options);
    const maxTokens = Math.min(mergedOptions.maxTokens, this.maxTokensLimit);

    // Build messages array
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (this.supportsSystemPrompt && mergedOptions.systemPrompt) {
      messages.push({ role: 'system', content: mergedOptions.systemPrompt });
    }

    if (!this.supportsSystemPrompt && mergedOptions.systemPrompt) {
      messages.push({
        role: 'user',
        content: `${mergedOptions.systemPrompt}\n\n${prompt}`,
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_completion_tokens: maxTokens,
      temperature: this.isReasoningModel ? undefined : mergedOptions.temperature,
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
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Make a minimal request to verify connectivity
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_completion_tokens: 10,
      });
      return response.choices.length > 0;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Map OpenAI finish reason to our format
   */
  private mapFinishReason(
    reason: string | null | undefined
  ): LLMResponse['stopReason'] {
    switch (reason) {
      case 'length':
        return 'max_tokens';
      case 'stop':
        return 'stop_sequence';
      case 'end_turn':
        return 'end_turn';
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
   * Check if this is a reasoning model (o-series)
   */
  isReasoningModelType(): boolean {
    return this.isReasoningModel;
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create an OpenAI provider for a specific model
 */
export function createOpenAIProvider(
  modelKey: OpenAIModelKey = 'gpt-4o',
  config: Omit<OpenAIProviderConfig, 'modelKey'> = {}
): OpenAIProvider {
  return new OpenAIProvider({ ...config, modelKey });
}

/**
 * Create providers for all available OpenAI models
 */
export function createAllOpenAIProviders(
  config: Omit<OpenAIProviderConfig, 'modelKey'> = {}
): Map<string, OpenAIProvider> {
  const providers = new Map<string, OpenAIProvider>();

  for (const modelKey of Object.keys(OPENAI_MODELS) as OpenAIModelKey[]) {
    providers.set(modelKey, createOpenAIProvider(modelKey, config));
  }

  return providers;
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * List available OpenAI models
 */
export function listOpenAIModels(): Array<{
  key: string;
  id: string;
  displayName: string;
  maxComplexity: Complexity;
  isReasoningModel: boolean;
}> {
  return Object.entries(OPENAI_MODELS).map(([key, config]) => ({
    key,
    id: config.id,
    displayName: config.displayName,
    maxComplexity: config.maxComplexity,
    isReasoningModel: 'isReasoningModel' in config && config.isReasoningModel === true,
  }));
}

/**
 * Get the best model for reasoning tasks
 */
export function getBestReasoningModel(): OpenAIModelKey {
  return 'o3';
}

/**
 * Get the best model for code tasks
 */
export function getBestCodeModel(): OpenAIModelKey {
  return 'gpt-5.2';
}

/**
 * Get the most cost-effective model
 */
export function getCostEffectiveModel(): OpenAIModelKey {
  return 'gpt-4o-mini';
}
