/**
 * vLLM Provider Implementation
 *
 * Provides integration with local vLLM server for fast, cost-free inference.
 * Supports OpenAI-compatible API format.
 */

import {
  BaseLLMProvider,
  CompletionRequest,
  CompletionResponse,
  ProviderStatus,
} from './base-provider.js';

/**
 * vLLM provider configuration
 */
export interface VLLMProviderConfig {
  /** Base URL for vLLM server (default: http://localhost:8000) */
  baseUrl?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Default model name (default: from vLLM server) */
  defaultModel?: string;

  /** API key if vLLM server requires authentication */
  apiKey?: string;
}

/**
 * vLLM Provider - Local inference with vLLM
 */
export class VLLMProvider extends BaseLLMProvider {
  readonly name = 'vllm';

  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly defaultModelName: string;

  constructor(config: VLLMProviderConfig = {}) {
    super(config);
    this.baseUrl = config.baseUrl ?? process.env.VLLM_BASE_URL ?? 'http://localhost:8000';
    this.timeout = config.timeout ?? 30000;
    this.defaultModelName = config.defaultModel ?? 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ';
  }

  /**
   * Check if vLLM server is healthy
   */
  async checkHealth(): Promise<ProviderStatus> {
    try {
      const { latencyMs } = await this.measureLatency(async () => {
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
      });

      return {
        provider: this.name,
        available: true,
        lastCheck: new Date(),
        responseTimeMs: latencyMs,
      };
    } catch (error) {
      return {
        provider: this.name,
        available: false,
        error: error instanceof Error ? error.message : String(error),
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Generate completion using vLLM
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const model = request.model ?? this.defaultModelName;

      const { result, latencyMs } = await this.measureLatency(async () => {
        const response = await fetch(`${this.baseUrl}/v1/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model,
            prompt: request.prompt,
            max_tokens: request.maxTokens ?? 2048,
            temperature: request.temperature ?? 0.7,
            top_p: request.topP ?? 0.95,
            stop: request.stop,
          }),
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `vLLM request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        return response.json();
      });

      // Parse vLLM response (OpenAI-compatible format)
      const text = result.choices?.[0]?.text ?? '';
      const usage = result.usage;

      return {
        text,
        success: true,
        provider: this.name,
        model,
        latencyMs,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens ?? 0,
              completionTokens: usage.completion_tokens ?? 0,
              totalTokens: usage.total_tokens ?? 0,
            }
          : undefined,
        metadata: {
          finishReason: result.choices?.[0]?.finish_reason,
        },
      };
    } catch (error) {
      return this.handleError(error, this.name);
    }
  }

  getDefaultModel(): string {
    return this.defaultModelName;
  }

  supportsStreaming(): boolean {
    return true;
  }
}

/**
 * Create a vLLM provider with environment-based configuration
 */
export function createVLLMProvider(config?: VLLMProviderConfig): VLLMProvider {
  return new VLLMProvider(config);
}
