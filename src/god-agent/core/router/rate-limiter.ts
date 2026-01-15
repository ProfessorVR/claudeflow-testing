/**
 * Rate Limiter for LLM Providers
 *
 * Phase 7.1: Production Hardening - Rate Limiting
 *
 * Implements:
 * - Token bucket algorithm for rate limiting
 * - Per-provider and per-model limits
 * - Sliding window for request counting
 * - Queue management for burst handling
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rate limit configuration for a provider or model
 */
export interface RateLimitConfig {
  /** Maximum requests per time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum tokens per minute (optional, for token-based limits) */
  maxTokensPerMinute?: number;
  /** Maximum concurrent requests */
  maxConcurrent?: number;
  /** Enable request queuing when limit reached */
  enableQueue?: boolean;
  /** Maximum queue size */
  maxQueueSize?: number;
  /** Queue timeout in milliseconds */
  queueTimeoutMs?: number;
}

/**
 * Rate limit status for monitoring
 */
export interface RateLimitStatus {
  /** Provider/model identifier */
  identifier: string;
  /** Current request count in window */
  currentRequests: number;
  /** Maximum requests allowed */
  maxRequests: number;
  /** Tokens used in current minute */
  tokensUsed: number;
  /** Maximum tokens per minute */
  maxTokensPerMinute: number;
  /** Current concurrent requests */
  concurrentRequests: number;
  /** Maximum concurrent requests */
  maxConcurrent: number;
  /** Requests currently queued */
  queuedRequests: number;
  /** Time until window resets (ms) */
  resetInMs: number;
  /** Whether currently rate limited */
  isLimited: boolean;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean;
  /** If not allowed, retry after this many ms */
  retryAfterMs?: number;
  /** If queued, position in queue */
  queuePosition?: number;
  /** Current limit status */
  status: RateLimitStatus;
}

/**
 * Queued request entry
 */
interface QueuedRequest {
  id: string;
  resolve: (result: RateLimitResult) => void;
  reject: (error: Error) => void;
  timestamp: number;
  estimatedTokens?: number;
}

/**
 * Request window entry
 */
interface WindowEntry {
  timestamp: number;
  tokens: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default rate limits by provider
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Anthropic limits (based on tier)
  anthropic: {
    maxRequests: 50,
    windowMs: 60000, // 1 minute
    maxTokensPerMinute: 40000,
    maxConcurrent: 5,
    enableQueue: true,
    maxQueueSize: 100,
    queueTimeoutMs: 30000,
  },
  // OpenAI limits
  openai: {
    maxRequests: 60,
    windowMs: 60000,
    maxTokensPerMinute: 90000,
    maxConcurrent: 10,
    enableQueue: true,
    maxQueueSize: 100,
    queueTimeoutMs: 30000,
  },
  // Local providers (higher limits)
  ollama: {
    maxRequests: 100,
    windowMs: 60000,
    maxTokensPerMinute: 1000000, // Effectively unlimited
    maxConcurrent: 2, // Limited by GPU
    enableQueue: true,
    maxQueueSize: 50,
    queueTimeoutMs: 60000,
  },
  vllm: {
    maxRequests: 100,
    windowMs: 60000,
    maxTokensPerMinute: 1000000,
    maxConcurrent: 4,
    enableQueue: true,
    maxQueueSize: 50,
    queueTimeoutMs: 60000,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Token bucket rate limiter with sliding window
 */
export class RateLimiter {
  private readonly config: Required<RateLimitConfig>;
  private readonly identifier: string;

  // Sliding window for request tracking
  private requestWindow: WindowEntry[] = [];

  // Token tracking for current minute
  private tokenWindow: WindowEntry[] = [];

  // Concurrent request tracking
  private activeRequests: Set<string> = new Set();

  // Request queue
  private queue: QueuedRequest[] = [];
  private queueProcessor: NodeJS.Timeout | null = null;

  constructor(identifier: string, config: Partial<RateLimitConfig> = {}) {
    this.identifier = identifier;

    // Merge with defaults
    const defaultConfig = DEFAULT_RATE_LIMITS[identifier] || DEFAULT_RATE_LIMITS.anthropic;
    this.config = {
      maxRequests: config.maxRequests ?? defaultConfig.maxRequests,
      windowMs: config.windowMs ?? defaultConfig.windowMs,
      maxTokensPerMinute: config.maxTokensPerMinute ?? defaultConfig.maxTokensPerMinute ?? 100000,
      maxConcurrent: config.maxConcurrent ?? defaultConfig.maxConcurrent ?? 10,
      enableQueue: config.enableQueue ?? defaultConfig.enableQueue ?? true,
      maxQueueSize: config.maxQueueSize ?? defaultConfig.maxQueueSize ?? 100,
      queueTimeoutMs: config.queueTimeoutMs ?? defaultConfig.queueTimeoutMs ?? 30000,
    };
  }

  /**
   * Check if a request is allowed and optionally queue it
   */
  async acquire(
    requestId: string,
    estimatedTokens: number = 0
  ): Promise<RateLimitResult> {
    this.cleanupWindows();

    const status = this.getStatus();

    // Check concurrent limit
    if (this.activeRequests.size >= this.config.maxConcurrent) {
      if (this.config.enableQueue) {
        return this.enqueue(requestId, estimatedTokens);
      }
      return {
        allowed: false,
        retryAfterMs: 1000, // Retry in 1 second
        status,
      };
    }

    // Check request rate limit
    if (this.requestWindow.length >= this.config.maxRequests) {
      const oldestRequest = this.requestWindow[0];
      const retryAfterMs = oldestRequest.timestamp + this.config.windowMs - Date.now();

      if (this.config.enableQueue) {
        return this.enqueue(requestId, estimatedTokens);
      }
      return {
        allowed: false,
        retryAfterMs: Math.max(0, retryAfterMs),
        status,
      };
    }

    // Check token rate limit
    const currentTokens = this.tokenWindow.reduce((sum, e) => sum + e.tokens, 0);
    if (currentTokens + estimatedTokens > this.config.maxTokensPerMinute) {
      const oldestToken = this.tokenWindow[0];
      const retryAfterMs = oldestToken ? oldestToken.timestamp + 60000 - Date.now() : 1000;

      if (this.config.enableQueue) {
        return this.enqueue(requestId, estimatedTokens);
      }
      return {
        allowed: false,
        retryAfterMs: Math.max(0, retryAfterMs),
        status,
      };
    }

    // Request allowed - record it
    const now = Date.now();
    this.requestWindow.push({ timestamp: now, tokens: estimatedTokens });
    this.tokenWindow.push({ timestamp: now, tokens: estimatedTokens });
    this.activeRequests.add(requestId);

    return {
      allowed: true,
      status: this.getStatus(),
    };
  }

  /**
   * Release a request slot (call when request completes)
   */
  release(requestId: string, actualTokens?: number): void {
    this.activeRequests.delete(requestId);

    // Update token count if actual differs from estimate
    if (actualTokens !== undefined) {
      const now = Date.now();
      const recentEntry = this.tokenWindow.find(
        e => e.timestamp > now - 1000 // Within last second
      );
      if (recentEntry) {
        recentEntry.tokens = actualTokens;
      }
    }

    // Process queue
    this.processQueue();
  }

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimitStatus {
    this.cleanupWindows();

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const currentRequests = this.requestWindow.filter(e => e.timestamp > windowStart).length;
    const tokensUsed = this.tokenWindow.reduce((sum, e) => sum + e.tokens, 0);

    const oldestRequest = this.requestWindow[0];
    const resetInMs = oldestRequest
      ? Math.max(0, oldestRequest.timestamp + this.config.windowMs - now)
      : 0;

    const isLimited =
      currentRequests >= this.config.maxRequests ||
      this.activeRequests.size >= this.config.maxConcurrent ||
      tokensUsed >= this.config.maxTokensPerMinute;

    return {
      identifier: this.identifier,
      currentRequests,
      maxRequests: this.config.maxRequests,
      tokensUsed,
      maxTokensPerMinute: this.config.maxTokensPerMinute,
      concurrentRequests: this.activeRequests.size,
      maxConcurrent: this.config.maxConcurrent,
      queuedRequests: this.queue.length,
      resetInMs,
      isLimited,
    };
  }

  /**
   * Check if currently rate limited (without acquiring)
   */
  isLimited(): boolean {
    return this.getStatus().isLimited;
  }

  /**
   * Get estimated wait time
   */
  getWaitTime(): number {
    const status = this.getStatus();
    if (!status.isLimited) return 0;
    return status.resetInMs;
  }

  /**
   * Clear all state (for testing)
   */
  reset(): void {
    this.requestWindow = [];
    this.tokenWindow = [];
    this.activeRequests.clear();
    this.queue.forEach(q => q.reject(new Error('Rate limiter reset')));
    this.queue = [];
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }
  }

  /**
   * Stop the rate limiter
   */
  stop(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private cleanupWindows(): void {
    const now = Date.now();
    const windowCutoff = now - this.config.windowMs;
    const tokenCutoff = now - 60000; // 1 minute for tokens

    this.requestWindow = this.requestWindow.filter(e => e.timestamp > windowCutoff);
    this.tokenWindow = this.tokenWindow.filter(e => e.timestamp > tokenCutoff);
  }

  private async enqueue(
    requestId: string,
    estimatedTokens: number
  ): Promise<RateLimitResult> {
    if (this.queue.length >= this.config.maxQueueSize) {
      return {
        allowed: false,
        retryAfterMs: this.getWaitTime(),
        status: this.getStatus(),
      };
    }

    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId,
        resolve,
        reject,
        timestamp: Date.now(),
        estimatedTokens,
      };

      this.queue.push(queuedRequest);

      // Start queue processor if not running
      if (!this.queueProcessor) {
        this.queueProcessor = setInterval(() => this.processQueue(), 100);
      }

      // Set timeout
      setTimeout(() => {
        const index = this.queue.findIndex(q => q.id === requestId);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new Error(`Rate limit queue timeout after ${this.config.queueTimeoutMs}ms`));
        }
      }, this.config.queueTimeoutMs);
    });
  }

  private processQueue(): void {
    if (this.queue.length === 0) {
      if (this.queueProcessor) {
        clearInterval(this.queueProcessor);
        this.queueProcessor = null;
      }
      return;
    }

    // Check if we can process next request
    this.cleanupWindows();

    if (
      this.activeRequests.size < this.config.maxConcurrent &&
      this.requestWindow.length < this.config.maxRequests
    ) {
      const next = this.queue.shift();
      if (next) {
        const now = Date.now();
        this.requestWindow.push({ timestamp: now, tokens: next.estimatedTokens || 0 });
        this.tokenWindow.push({ timestamp: now, tokens: next.estimatedTokens || 0 });
        this.activeRequests.add(next.id);

        next.resolve({
          allowed: true,
          queuePosition: 0,
          status: this.getStatus(),
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER MANAGER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Configuration for the rate limiter manager
 */
export interface RateLimiterManagerConfig {
  /** Default config for unknown providers */
  defaultConfig?: Partial<RateLimitConfig>;
  /** Per-provider configurations */
  providerConfigs?: Record<string, Partial<RateLimitConfig>>;
  /** Enable global rate limiting across all providers */
  enableGlobalLimit?: boolean;
  /** Global requests per minute */
  globalMaxRequests?: number;
  /** Global limiter config overrides */
  globalConfig?: Partial<RateLimitConfig>;
}

/**
 * Manages rate limiters for multiple providers
 */
export class RateLimiterManager {
  private readonly limiters: Map<string, RateLimiter> = new Map();
  private readonly config: Required<RateLimiterManagerConfig>;
  private globalLimiter: RateLimiter | null = null;

  constructor(config: RateLimiterManagerConfig = {}) {
    this.config = {
      defaultConfig: config.defaultConfig || {},
      providerConfigs: config.providerConfigs || {},
      enableGlobalLimit: config.enableGlobalLimit ?? false,
      globalMaxRequests: config.globalMaxRequests ?? 100,
      globalConfig: config.globalConfig || {},
    };

    if (this.config.enableGlobalLimit) {
      this.globalLimiter = new RateLimiter('global', {
        maxRequests: this.config.globalMaxRequests,
        windowMs: 60000,
        maxConcurrent: 50,
        ...this.config.globalConfig,
      });
    }
  }

  /**
   * Get or create a rate limiter for a provider/model
   */
  getLimiter(identifier: string): RateLimiter {
    let limiter = this.limiters.get(identifier);

    if (!limiter) {
      const config = this.config.providerConfigs[identifier] || this.config.defaultConfig;
      limiter = new RateLimiter(identifier, config);
      this.limiters.set(identifier, limiter);
    }

    return limiter;
  }

  /**
   * Acquire a rate limit slot
   */
  async acquire(
    provider: string,
    requestId: string,
    estimatedTokens: number = 0
  ): Promise<RateLimitResult> {
    // Check global limit first
    if (this.globalLimiter) {
      const globalResult = await this.globalLimiter.acquire(`global:${requestId}`, estimatedTokens);
      if (!globalResult.allowed) {
        return globalResult;
      }
    }

    // Check provider-specific limit
    const limiter = this.getLimiter(provider);
    return limiter.acquire(requestId, estimatedTokens);
  }

  /**
   * Release a rate limit slot
   */
  release(provider: string, requestId: string, actualTokens?: number): void {
    const limiter = this.limiters.get(provider);
    if (limiter) {
      limiter.release(requestId, actualTokens);
    }

    if (this.globalLimiter) {
      this.globalLimiter.release(`global:${requestId}`, actualTokens);
    }
  }

  /**
   * Get status for all limiters
   */
  getAllStatus(): RateLimitStatus[] {
    const statuses: RateLimitStatus[] = [];

    if (this.globalLimiter) {
      statuses.push(this.globalLimiter.getStatus());
    }

    for (const limiter of this.limiters.values()) {
      statuses.push(limiter.getStatus());
    }

    return statuses;
  }

  /**
   * Check if any provider is rate limited
   */
  isAnyLimited(): boolean {
    if (this.globalLimiter?.isLimited()) return true;

    for (const limiter of this.limiters.values()) {
      if (limiter.isLimited()) return true;
    }

    return false;
  }

  /**
   * Reset all limiters
   */
  reset(): void {
    this.globalLimiter?.reset();
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
    this.limiters.clear();
  }

  /**
   * Stop all limiters
   */
  stop(): void {
    this.globalLimiter?.stop();
    for (const limiter of this.limiters.values()) {
      limiter.stop();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let rateLimiterManager: RateLimiterManager | null = null;

/**
 * Get the singleton rate limiter manager
 */
export function getRateLimiterManager(
  config?: RateLimiterManagerConfig
): RateLimiterManager {
  if (!rateLimiterManager) {
    rateLimiterManager = new RateLimiterManager(config);
  }
  return rateLimiterManager;
}

/**
 * Initialize rate limiter manager with config
 */
export function initializeRateLimiter(
  config: RateLimiterManagerConfig
): RateLimiterManager {
  rateLimiterManager?.stop();
  rateLimiterManager = new RateLimiterManager(config);
  return rateLimiterManager;
}

/**
 * Reset the singleton
 */
export function resetRateLimiter(): void {
  rateLimiterManager?.stop();
  rateLimiterManager?.reset();
  rateLimiterManager = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format rate limit status for display
 */
export function formatRateLimitStatus(status: RateLimitStatus): string {
  const lines: string[] = [
    `=== Rate Limit: ${status.identifier} ===`,
    '',
    `Requests: ${status.currentRequests}/${status.maxRequests}`,
    `Tokens: ${status.tokensUsed.toLocaleString()}/${status.maxTokensPerMinute.toLocaleString()}`,
    `Concurrent: ${status.concurrentRequests}/${status.maxConcurrent}`,
    `Queued: ${status.queuedRequests}`,
    `Reset in: ${Math.ceil(status.resetInMs / 1000)}s`,
    `Status: ${status.isLimited ? '🔴 LIMITED' : '🟢 OK'}`,
  ];

  return lines.join('\n');
}

/**
 * Format all rate limit statuses
 */
export function formatAllRateLimitStatus(statuses: RateLimitStatus[]): string {
  if (statuses.length === 0) {
    return 'No rate limiters active.';
  }

  return statuses.map(formatRateLimitStatus).join('\n\n');
}
