/**
 * Anthropic LLM Provider
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Provides Claude model integration:
 * - Claude Opus 4.5 (claude-opus-4-5-20251101)
 * - Claude Sonnet 4 (claude-sonnet-4-20250514)
 * - Claude Haiku (claude-3-5-haiku-20241022)
 */

import Anthropic from '@anthropic-ai/sdk';
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
 * Available Anthropic models with their configurations
 */
export const ANTHROPIC_MODELS = {
  'claude-opus-4.5': {
    id: 'claude-opus-4-5-20251101',
    displayName: 'Claude Opus 4.5',
    capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    maxTokens: 32768,
    contextWindow: 200000,
  },
  'claude-sonnet-4': {
    id: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    capabilities: ['code', 'reasoning', 'research', 'writing', 'refactor', 'debug', 'test'] as ModelCapability[],
    maxComplexity: 'complex' as Complexity,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    maxTokens: 16384,
    contextWindow: 200000,
  },
  'claude-haiku': {
    id: 'claude-3-5-haiku-20241022',
    displayName: 'Claude Haiku 3.5',
    capabilities: ['code', 'writing', 'debug'] as ModelCapability[],
    maxComplexity: 'simple' as Complexity,
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    maxTokens: 8192,
    contextWindow: 200000,
  },
} as const;

export type AnthropicModelKey = keyof typeof ANTHROPIC_MODELS;

// ===== PROVIDER CONFIGURATION =====

/**
 * Configuration for AnthropicProvider
 */
export interface AnthropicProviderConfig {
  /** Model key from ANTHROPIC_MODELS */
  modelKey?: AnthropicModelKey;
  /** Custom model ID override */
  modelId?: string;
  /** API key (defaults to ANTHROPIC_API_KEY env var) */
  apiKey?: string;
  /** Base URL for API */
  baseUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Maximum retries */
  maxRetries?: number;
}

// ===== ANTHROPIC PROVIDER =====

/**
 * Anthropic Claude provider implementation
 */
export class AnthropicProvider extends BaseLLMProvider {
  readonly id: string;
  readonly provider: ProviderType = 'anthropic';
  readonly model: string;
  readonly capabilities: ModelCapability[];
  readonly maxComplexity: Complexity;
  protected readonly inputCostPer1M: number;
  protected readonly outputCostPer1M: number;

  private readonly client: Anthropic;
  private readonly modelConfig: typeof ANTHROPIC_MODELS[AnthropicModelKey];
  private readonly maxTokensLimit: number;

  constructor(config: AnthropicProviderConfig = {}) {
    super();

    const modelKey = config.modelKey ?? 'claude-sonnet-4';
    this.modelConfig = ANTHROPIC_MODELS[modelKey];

    this.id = modelKey;
    this.model = config.modelId ?? this.modelConfig.id;
    this.capabilities = [...this.modelConfig.capabilities];
    this.maxComplexity = this.modelConfig.maxComplexity;
    this.inputCostPer1M = this.modelConfig.inputCostPer1M;
    this.outputCostPer1M = this.modelConfig.outputCostPer1M;
    this.maxTokensLimit = this.modelConfig.maxTokens;
    this.timeout = config.timeout ?? 60000;

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
      baseURL: config.baseUrl,
      timeout: this.timeout,
      maxRetries: config.maxRetries ?? 2,
    });
  }

  /**
   * Complete a prompt using Claude
   */
  protected async doComplete(
    prompt: string,
    options: Required<CompletionOptions>
  ): Promise<LLMResponse> {
    const maxTokens = Math.min(options.maxTokens, this.maxTokensLimit);

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: options.systemPrompt || undefined,
      messages,
      temperature: options.temperature,
      stop_sequences: options.stopSequences.length > 0 ? options.stopSequences : undefined,
    });

    // Extract content from response
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    return this.createResponse(content, usage, {
      truncated: response.stop_reason === 'max_tokens',
      stopReason: this.mapStopReason(response.stop_reason),
    });
  }

  /**
   * Stream completion from Claude
   */
  async *stream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncIterable<string> {
    const mergedOptions = this.mergeOptions(options);
    const maxTokens = Math.min(mergedOptions.maxTokens, this.maxTokensLimit);

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ];

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: maxTokens,
      system: mergedOptions.systemPrompt || undefined,
      messages,
      temperature: mergedOptions.temperature,
      stop_sequences: mergedOptions.stopSequences.length > 0 ? mergedOptions.stopSequences : undefined,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          yield delta.text;
        }
      }
    }
  }

  /**
   * Test connection to Anthropic API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Make a minimal request to verify connectivity
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return response.content.length > 0;
    } catch (error) {
      console.error('Anthropic connection test failed:', error);
      return false;
    }
  }

  /**
   * Map Anthropic stop reason to our format
   */
  private mapStopReason(
    reason: string | null
  ): LLMResponse['stopReason'] {
    switch (reason) {
      case 'max_tokens':
        return 'max_tokens';
      case 'stop_sequence':
        return 'stop_sequence';
      case 'end_turn':
        return 'end_turn';
      default:
        return undefined;
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
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create an Anthropic provider for a specific model
 */
export function createAnthropicProvider(
  modelKey: AnthropicModelKey = 'claude-sonnet-4',
  config: Omit<AnthropicProviderConfig, 'modelKey'> = {}
): AnthropicProvider {
  return new AnthropicProvider({ ...config, modelKey });
}

/**
 * Create providers for all available Anthropic models
 */
export function createAllAnthropicProviders(
  config: Omit<AnthropicProviderConfig, 'modelKey'> = {}
): Map<string, AnthropicProvider> {
  const providers = new Map<string, AnthropicProvider>();

  for (const modelKey of Object.keys(ANTHROPIC_MODELS) as AnthropicModelKey[]) {
    providers.set(modelKey, createAnthropicProvider(modelKey, config));
  }

  return providers;
}

/**
 * Check if Anthropic API key is configured
 */
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * List available Anthropic models
 */
export function listAnthropicModels(): Array<{
  key: string;
  id: string;
  displayName: string;
  maxComplexity: Complexity;
}> {
  return Object.entries(ANTHROPIC_MODELS).map(([key, config]) => ({
    key,
    id: config.id,
    displayName: config.displayName,
    maxComplexity: config.maxComplexity,
  }));
}
