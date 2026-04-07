/**
 * Model Router — Unified LLM Orchestration Layer
 *
 * Centralizes LLM backend management for the ICP pipeline.
 * Handles:
 *   - Backend fallback (Anthropic → vLLM → error)
 *   - Retry logic with exponential backoff
 *   - Structured JSON parsing and validation
 *   - Cost-tier routing (low → vLLM-first, high → Anthropic-first)
 *   - Backend health detection
 *
 * @module model-router
 */

import OpenAI from 'openai';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface ModelRouterConfig {
  /** Anthropic API key (reads from ANTHROPIC_API_KEY env if not provided) */
  anthropicApiKey?: string;
  /** vLLM base URL (default: http://localhost:8002/v1) */
  vllmBaseUrl?: string;
  /** vLLM model name (default: Qwen/Qwen2.5-Coder-32B-Instruct-AWQ) */
  vllmModel?: string;
  /** Anthropic model (default: claude-sonnet-4-5-20250929) */
  anthropicModel?: string;
  /** Max retries per backend (default: 2) */
  maxRetries?: number;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
}

const DEFAULT_CONFIG: Required<ModelRouterConfig> = {
  anthropicApiKey: '',
  vllmBaseUrl: 'http://localhost:8002/v1',
  vllmModel: 'Qwen/Qwen2.5-Coder-32B-Instruct-AWQ',
  anthropicModel: 'claude-sonnet-4-5-20250929',
  maxRetries: 2,
  timeoutMs: 120000,
};

// =============================================================================
// REQUEST / RESPONSE
// =============================================================================

export type BackendType = 'anthropic' | 'vllm';

export interface LLMRequest {
  /** System prompt */
  systemPrompt: string;
  /** User prompt */
  userPrompt: string;
  /** Max tokens to generate (default: 4000) */
  maxTokens?: number;
  /** Temperature (default: 0.3 for structured, 0.7 for prose) */
  temperature?: number;
  /** Request structured JSON output */
  jsonMode?: boolean;
  /** Force a specific backend (overrides fallback chain) */
  forceBackend?: BackendType;
  /** Cost tier: 'low' routes to vLLM first; 'high' allows Anthropic as primary */
  costTier?: 'low' | 'high';
}

export interface LLMResponse {
  /** Generated content */
  content: string;
  /** Model used */
  model: string;
  /** Backend that produced the response */
  backend: BackendType;
  /** Token usage */
  usage: { inputTokens: number; outputTokens: number };
}

// =============================================================================
// MODEL ROUTER
// =============================================================================

export class ModelRouter {
  private readonly config: Required<ModelRouterConfig>;
  private anthropicAvailable: boolean;
  private vllmClient?: OpenAI;
  private availableBackends: BackendType[] | null = null;
  private backendsCheckedAt: number = 0;
  private static readonly BACKEND_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(config: ModelRouterConfig = {}) {
    // Strip undefined values so they don't overwrite defaults via spread
    const clean = Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined),
    );
    this.config = {
      ...DEFAULT_CONFIG,
      ...clean,
      anthropicApiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
    };

    // Check Anthropic availability (uses native fetch instead of SDK — Fix 27: SDK fails in daemon processes)
    this.anthropicAvailable = this.config.anthropicApiKey.length >= 50;

    // Initialize vLLM client (always — it's local, no key needed)
    this.vllmClient = new OpenAI({
      baseURL: this.config.vllmBaseUrl,
      apiKey: 'dummy-key', // vLLM doesn't require auth
      timeout: 10000, // 10s — fail fast if vLLM is down
    });
  }

  /**
   * Make an LLM call with automatic fallback between backends.
   */
  async call(request: LLMRequest, abortSignal?: AbortSignal): Promise<LLMResponse> {
    const backends = this.resolveBackendOrder(request);
    const errors: string[] = [];

    let lastError: Error | undefined;

    for (const backend of backends) {
      for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        try {
          return await this.callBackend(backend, request, abortSignal);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          errors.push(`${backend}[${attempt}]: ${lastError.message}`);

          // Don't retry on 4xx errors (bad request, auth failure) or abort
          if (this.isNonRetryable(lastError) || lastError.name === 'AbortError') {
            break;
          }

          // Exponential backoff between retries
          if (attempt < this.config.maxRetries) {
            await this.sleep(Math.pow(2, attempt) * 500);
          }
        }
      }
    }

    throw new Error(
      `All backends failed. Errors: ${errors.join(' | ')}`,
    );
  }

  /**
   * Make a structured JSON call with parsing and validation.
   * Handles JSON extraction from LLM output and validates with provided function.
   */
  async callJSON<T>(
    request: LLMRequest,
    validator: (raw: unknown) => T,
    abortSignal?: AbortSignal,
  ): Promise<T> {
    const response = await this.call({
      ...request,
      jsonMode: true,
      temperature: request.temperature ?? 0.3, // Lower temp for structured output
    }, abortSignal);

    // Extract JSON from response (handle markdown code blocks, etc.)
    const jsonStr = this.extractJSON(response.content);

    try {
      const parsed = JSON.parse(jsonStr);
      return validator(parsed);
    } catch (error) {
      throw new Error(
        `JSON parsing/validation failed: ${error instanceof Error ? error.message : String(error)}. ` +
        `Raw content: ${response.content.slice(0, 200)}...`,
      );
    }
  }

  /**
   * Generate text from a single prompt string.
   * Convenience wrapper around call() for the common single-user-message pattern.
   */
  async generateText(
    prompt: string,
    options: { model?: string; maxTokens?: number; timeout?: number; costTier?: 'low' | 'high'; abortSignal?: AbortSignal } = {},
  ): Promise<string> {
    const response = await this.call({
      systemPrompt: '',
      userPrompt: prompt,
      maxTokens: options.maxTokens ?? 4000,
      costTier: options.costTier ?? 'high',
    }, options.abortSignal);
    return response.content;
  }

  /**
   * Detect which backends are available.
   */
  async getAvailableBackends(): Promise<BackendType[]> {
    const now = Date.now();
    if (this.availableBackends && (now - this.backendsCheckedAt) < ModelRouter.BACKEND_CACHE_TTL_MS) {
      return this.availableBackends;
    }

    const backends: BackendType[] = [];

    // Check Anthropic
    if (this.anthropicAvailable) {
      backends.push('anthropic');
    }

    // Check vLLM health
    try {
      const response = await fetch(`${this.config.vllmBaseUrl.replace('/v1', '')}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        backends.push('vllm');
      }
    } catch {
      // Also try /v1/models endpoint as fallback health check
      try {
        const response = await fetch(`${this.config.vllmBaseUrl}/models`, {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          backends.push('vllm');
        }
      } catch {
        // vLLM not available
      }
    }

    this.availableBackends = backends;
    this.backendsCheckedAt = now;
    return backends;
  }

  /**
   * Reset cached backend availability (e.g., after service restart).
   */
  resetBackendCache(): void {
    this.availableBackends = null;
    this.backendsCheckedAt = 0;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Determine backend order based on request configuration.
   */
  private resolveBackendOrder(request: LLMRequest): BackendType[] {
    // Forced backend — no fallback
    if (request.forceBackend) {
      return [request.forceBackend];
    }

    // Cost tier routing
    if (request.costTier === 'low') {
      // vLLM first (free), Anthropic as fallback
      const order: BackendType[] = [];
      if (this.vllmClient) order.push('vllm');
      if (this.anthropicAvailable) order.push('anthropic');
      return order.length > 0 ? order : ['vllm'];
    }

    if (request.costTier === 'high') {
      // Anthropic first (quality), vLLM as fallback
      const order: BackendType[] = [];
      if (this.anthropicAvailable) order.push('anthropic');
      if (this.vllmClient) order.push('vllm');
      return order.length > 0 ? order : ['anthropic'];
    }

    // Default: Anthropic first if available, then vLLM
    const order: BackendType[] = [];
    if (this.anthropicAvailable) order.push('anthropic');
    if (this.vllmClient) order.push('vllm');
    return order.length > 0 ? order : ['anthropic'];
  }

  /**
   * Execute a call against a specific backend.
   */
  private async callBackend(
    backend: BackendType,
    request: LLMRequest,
    abortSignal?: AbortSignal,
  ): Promise<LLMResponse> {
    if (backend === 'anthropic') {
      return this.callAnthropic(request, abortSignal);
    }
    return this.callVLLM(request, abortSignal);
  }

  /**
   * Call Anthropic API via native fetch (Fix 27: @anthropic-ai/sdk fails in daemon processes on WSL2).
   */
  private async callAnthropic(request: LLMRequest, externalSignal?: AbortSignal): Promise<LLMResponse> {
    if (!this.anthropicAvailable) {
      throw new Error('Anthropic not available (missing API key)');
    }

    const timeoutMs = Math.max(this.config.timeoutMs, 120000); // At least 2 minutes for long academic requests
    const signals: AbortSignal[] = [AbortSignal.timeout(timeoutMs)];
    if (externalSignal) signals.push(externalSignal);
    const composedSignal = signals.length > 1 ? AbortSignal.any(signals) : signals[0];
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: composedSignal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.anthropicModel,
        max_tokens: request.maxTokens ?? 4000,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      throw new Error(`Anthropic API error ${response.status}: ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const textContent = data.content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text!)
      .join('\n');

    return {
      content: textContent,
      model: this.config.anthropicModel,
      backend: 'anthropic',
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }

  /**
   * Call vLLM via OpenAI-compatible API.
   */
  private async callVLLM(request: LLMRequest, externalSignal?: AbortSignal): Promise<LLMResponse> {
    if (!this.vllmClient) {
      throw new Error('vLLM client not initialized');
    }

    const requestOptions: Record<string, unknown> = {};
    if (externalSignal) {
      requestOptions.signal = externalSignal;
    }

    const response = await this.vllmClient.chat.completions.create({
      model: this.config.vllmModel,
      max_tokens: request.maxTokens ?? 4000,
      temperature: request.temperature ?? 0.7,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
    }, requestOptions);

    const content = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;

    return {
      content,
      model: this.config.vllmModel,
      backend: 'vllm',
      usage: {
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
      },
    };
  }

  /**
   * Extract JSON from LLM output (handles code blocks, preamble, etc.)
   */
  private extractJSON(content: string): string {
    // Try to find JSON in code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find JSON object/array directly
    const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // Return as-is and let JSON.parse fail with a clear error
    return content.trim();
  }

  /**
   * Determine if an error is non-retryable (e.g., 4xx client errors).
   */
  private isNonRetryable(error: Error): boolean {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('401') ||
      msg.includes('403') ||
      msg.includes('400') ||
      msg.includes('authentication') ||
      msg.includes('unauthorized')
    );
  }

  /**
   * Sleep for a given duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
