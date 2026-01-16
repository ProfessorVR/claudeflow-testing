/**
 * Claude (Anthropic) Provider Implementation
 *
 * Provides integration with Anthropic's Claude API for high-quality inference.
 * Uses the official Anthropic SDK.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  BaseLLMProvider,
  CompletionRequest,
  CompletionResponse,
  ProviderStatus,
} from './base-provider.js';

/**
 * Claude provider configuration
 */
export interface ClaudeProviderConfig {
  /** Anthropic API key (default: from ANTHROPIC_API_KEY env var) */
  apiKey?: string;

  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;

  /** Default model (default: claude-sonnet-4-5-20250929) */
  defaultModel?: string;

  /** Max tokens for completion (default: 4096) */
  maxTokens?: number;
}

/**
 * Claude Provider - High-quality inference with Anthropic Claude
 */
export class ClaudeProvider extends BaseLLMProvider {
  readonly name = 'claude';

  private readonly client: Anthropic;
  private readonly timeout: number;
  private readonly defaultModelName: string;
  private readonly maxTokensDefault: number;

  constructor(config: ClaudeProviderConfig = {}) {
    super(config);

    const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for ClaudeProvider');
    }

    this.client = new Anthropic({ apiKey });
    this.timeout = config.timeout ?? 60000;
    this.defaultModelName = config.defaultModel ?? 'claude-sonnet-4-5-20250929';
    this.maxTokensDefault = config.maxTokens ?? 4096;
  }

  /**
   * Check if Claude API is healthy
   */
  async checkHealth(): Promise<ProviderStatus> {
    try {
      const { latencyMs } = await this.measureLatency(async () => {
        // Simple health check: try to create a minimal message
        await this.client.messages.create({
          model: this.defaultModelName,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        });
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
   * Generate completion using Claude
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const model = request.model ?? this.defaultModelName;

      const { result, latencyMs } = await this.measureLatency(async () => {
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
          {
            role: 'user',
            content: request.prompt,
          },
        ];

        return await this.client.messages.create({
          model,
          max_tokens: request.maxTokens ?? this.maxTokensDefault,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP,
          stop_sequences: request.stop,
          system: request.systemMessage,
          messages,
        });
      });

      // Extract text from Claude response
      const textContent = result.content.find((block) => block.type === 'text');
      const text = textContent?.type === 'text' ? textContent.text : '';

      return {
        text,
        success: true,
        provider: this.name,
        model,
        latencyMs,
        usage: {
          promptTokens: result.usage.input_tokens,
          completionTokens: result.usage.output_tokens,
          totalTokens: result.usage.input_tokens + result.usage.output_tokens,
        },
        metadata: {
          id: result.id,
          stopReason: result.stop_reason,
          stopSequence: result.stop_sequence,
        },
      };
    } catch (error) {
      // Check if it's a quota/rate limit error
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('quota') || message.includes('rate limit')) {
          return {
            text: '',
            success: false,
            error: 'QUOTA_EXCEEDED: ' + error.message,
            provider: this.name,
            latencyMs: 0,
            metadata: {
              quotaExceeded: true,
            },
          };
        }
      }

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
 * Create a Claude provider with environment-based configuration
 */
export function createClaudeProvider(config?: ClaudeProviderConfig): ClaudeProvider {
  return new ClaudeProvider(config);
}
