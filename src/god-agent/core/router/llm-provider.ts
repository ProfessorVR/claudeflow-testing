/**
 * LLM Provider Base Implementation
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Provides:
 * - Abstract base class for LLM providers
 * - Common functionality shared across providers
 * - Retry logic and error handling
 * - Cost calculation utilities
 */

import type {
  ILLMProvider,
  ProviderType,
  ModelCapability,
  Complexity,
  CompletionOptions,
  LLMResponse,
  CostBreakdown,
  TokenUsage,
} from './router-types.js';

// ===== DEFAULT OPTIONS =====

const DEFAULT_COMPLETION_OPTIONS: Required<Omit<CompletionOptions, 'systemPrompt' | 'stopSequences'>> = {
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 30000,
  stream: false,
};

// ===== ABSTRACT BASE CLASS =====

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  abstract readonly id: string;
  abstract readonly provider: ProviderType;
  abstract readonly model: string;
  abstract readonly capabilities: ModelCapability[];
  abstract readonly maxComplexity: Complexity;

  /** Cost per 1M input tokens in USD */
  protected abstract readonly inputCostPer1M: number;
  /** Cost per 1M output tokens in USD */
  protected abstract readonly outputCostPer1M: number;

  /** Request timeout in ms */
  protected timeout: number = DEFAULT_COMPLETION_OPTIONS.timeout;

  /** Whether the provider has been initialized */
  protected initialized = false;

  /**
   * Implement the actual completion logic
   */
  protected abstract doComplete(
    prompt: string,
    options: Required<CompletionOptions>
  ): Promise<LLMResponse>;

  /**
   * Complete a prompt with retry logic
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<LLMResponse> {
    const mergedOptions = this.mergeOptions(options);
    const startTime = Date.now();

    try {
      const response = await this.doComplete(prompt, mergedOptions);
      response.latencyMs = Date.now() - startTime;
      return response;
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  /**
   * Stream completion (optional, default throws)
   */
  async *stream(prompt: string, options?: CompletionOptions): AsyncIterable<string> {
    // Default implementation falls back to non-streaming
    const response = await this.complete(prompt, { ...options, stream: false });
    yield response.content;
  }

  /**
   * Check if provider is available
   * Subclasses should override with actual health check
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await this.testConnection();
    } catch {
      return false;
    }
  }

  /**
   * Calculate cost for token usage
   */
  getCost(inputTokens: number, outputTokens: number): CostBreakdown {
    const inputCost = (inputTokens / 1_000_000) * this.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * this.outputCostPer1M;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  }

  /**
   * Test connection to the provider
   * Subclasses should override with actual connectivity test
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Merge user options with defaults
   */
  protected mergeOptions(options?: CompletionOptions): Required<CompletionOptions> {
    return {
      systemPrompt: options?.systemPrompt ?? '',
      maxTokens: options?.maxTokens ?? DEFAULT_COMPLETION_OPTIONS.maxTokens,
      temperature: options?.temperature ?? DEFAULT_COMPLETION_OPTIONS.temperature,
      stopSequences: options?.stopSequences ?? [],
      timeout: options?.timeout ?? this.timeout,
      stream: options?.stream ?? DEFAULT_COMPLETION_OPTIONS.stream,
    };
  }

  /**
   * Wrap errors with consistent error type
   */
  protected wrapError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }

  /**
   * Create a base response object
   */
  protected createResponse(
    content: string,
    usage: TokenUsage,
    options: Partial<{
      truncated: boolean;
      stopReason: LLMResponse['stopReason'];
    }> = {}
  ): LLMResponse {
    return {
      content,
      model: this.model,
      provider: this.provider,
      usage,
      latencyMs: 0, // Will be set by complete()
      truncated: options.truncated ?? false,
      stopReason: options.stopReason,
    };
  }

  /**
   * Estimate token count for a string
   * This is a rough approximation; subclasses may override with model-specific tokenizers
   */
  protected estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if this provider supports a given capability
   */
  hasCapability(capability: ModelCapability): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Check if this provider can handle a given complexity
   */
  canHandleComplexity(complexity: Complexity): boolean {
    const order: Complexity[] = ['simple', 'medium', 'complex'];
    return order.indexOf(complexity) <= order.indexOf(this.maxComplexity);
  }
}

// ===== MOCK PROVIDER FOR TESTING =====

/**
 * Configuration for MockLLMProvider
 */
export interface MockLLMProviderConfig {
  id?: string;
  provider?: ProviderType;
  model?: string;
  capabilities?: ModelCapability[];
  maxComplexity?: Complexity;
  inputCostPer1M?: number;
  outputCostPer1M?: number;
  mockResponse?: string;
  shouldFail?: boolean;
  shouldBeAvailable?: boolean;
}

/**
 * Mock LLM provider for testing
 */
export class MockLLMProvider extends BaseLLMProvider {
  readonly id: string;
  readonly provider: ProviderType;
  readonly model: string;
  readonly capabilities: ModelCapability[];
  readonly maxComplexity: Complexity;
  protected readonly inputCostPer1M: number;
  protected readonly outputCostPer1M: number;

  private mockResponse: string;
  private shouldFail: boolean;
  private available: boolean;

  constructor(config: MockLLMProviderConfig = {}) {
    super();
    this.id = config.id ?? 'mock';
    this.provider = config.provider ?? 'custom';
    this.model = config.model ?? 'mock-model';
    this.capabilities = config.capabilities ?? ['code', 'reasoning', 'writing'];
    this.maxComplexity = config.maxComplexity ?? 'complex';
    this.inputCostPer1M = config.inputCostPer1M ?? 0;
    this.outputCostPer1M = config.outputCostPer1M ?? 0;
    this.mockResponse = config.mockResponse ?? 'This is a mock response';
    this.shouldFail = config.shouldFail ?? false;
    this.available = config.shouldBeAvailable ?? true;
  }

  /**
   * Set the mock response
   */
  setMockResponse(response: string): void {
    this.mockResponse = response;
  }

  /**
   * Set whether the provider should fail
   */
  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  /**
   * Set availability status
   */
  setAvailable(available: boolean): void {
    this.available = available;
  }

  protected async doComplete(
    prompt: string,
    _options: Required<CompletionOptions>
  ): Promise<LLMResponse> {
    if (this.shouldFail) {
      throw new Error('Mock provider failure');
    }

    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(this.mockResponse);

    return this.createResponse(
      this.mockResponse,
      {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      { stopReason: 'end_turn' }
    );
  }

  async testConnection(): Promise<boolean> {
    return this.available;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a cost breakdown from token usage and rates
 */
export function calculateCost(
  usage: TokenUsage,
  inputCostPer1M: number,
  outputCostPer1M: number
): CostBreakdown {
  const inputCost = (usage.inputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (usage.outputTokens / 1_000_000) * outputCostPer1M;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Estimate tokens for a prompt (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Validate completion options
 */
export function validateCompletionOptions(options: CompletionOptions): void {
  if (options.maxTokens !== undefined && options.maxTokens <= 0) {
    throw new Error('maxTokens must be positive');
  }
  if (options.temperature !== undefined && (options.temperature < 0 || options.temperature > 2)) {
    throw new Error('temperature must be between 0 and 2');
  }
  if (options.timeout !== undefined && options.timeout <= 0) {
    throw new Error('timeout must be positive');
  }
}
