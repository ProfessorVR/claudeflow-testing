/**
 * Base Provider Interface for LLM Providers
 *
 * This abstraction allows the CapabilityRouter to invoke different LLM providers
 * (vLLM, Claude, OpenAI, etc.) through a unified interface.
 */

/**
 * Completion request parameters
 */
export interface CompletionRequest {
  /** The prompt to send to the model */
  prompt: string;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature for sampling (0.0-1.0) */
  temperature?: number;

  /** Top-p sampling threshold */
  topP?: number;

  /** Stop sequences */
  stop?: string[];

  /** System message (if supported) */
  systemMessage?: string;

  /** Model identifier (provider-specific) */
  model?: string;

  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Completion response
 */
export interface CompletionResponse {
  /** Generated text */
  text: string;

  /** Whether the request succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Token usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Model that was used */
  model?: string;

  /** Provider that handled the request */
  provider: string;

  /** Response latency in milliseconds */
  latencyMs: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Provider health status
 */
export interface ProviderStatus {
  /** Provider name */
  provider: string;

  /** Whether the provider is available */
  available: boolean;

  /** Error message if unavailable */
  error?: string;

  /** Last check timestamp */
  lastCheck: Date;

  /** Response time in milliseconds */
  responseTimeMs?: number;
}

/**
 * Base interface for LLM providers
 */
export interface ILLMProvider {
  /**
   * Provider name (e.g., 'vllm', 'claude', 'openai')
   */
  readonly name: string;

  /**
   * Check if the provider is available and healthy
   */
  checkHealth(): Promise<ProviderStatus>;

  /**
   * Generate a completion
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Get the default model for this provider
   */
  getDefaultModel(): string;

  /**
   * Check if this provider supports streaming
   */
  supportsStreaming(): boolean;
}

/**
 * Abstract base class for LLM providers with common functionality
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  abstract readonly name: string;

  constructor(
    protected readonly config: {
      baseUrl?: string;
      apiKey?: string;
      timeout?: number;
      defaultModel?: string;
    } = {}
  ) {}

  /**
   * Measure execution time of an async operation
   */
  protected async measureLatency<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; latencyMs: number }> {
    const start = Date.now();
    const result = await operation();
    const latencyMs = Date.now() - start;
    return { result, latencyMs };
  }

  /**
   * Handle common errors and convert to CompletionResponse
   */
  protected handleError(error: unknown, provider: string): CompletionResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      text: '',
      success: false,
      error: errorMessage,
      provider,
      latencyMs: 0,
    };
  }

  abstract checkHealth(): Promise<ProviderStatus>;
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;
  abstract getDefaultModel(): string;

  supportsStreaming(): boolean {
    return false;
  }
}
