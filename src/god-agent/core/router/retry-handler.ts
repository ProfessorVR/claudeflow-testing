/**
 * Retry Handler with Exponential Backoff
 *
 * Phase 7.1: Production Hardening - Retry Logic
 *
 * Implements:
 * - Exponential backoff with jitter
 * - Configurable retry strategies
 * - Error classification for retry decisions
 * - Retry budget tracking
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Error categories for retry decision
 */
export type RetryableErrorType =
  | 'rate_limit'      // 429 - Rate limited
  | 'server_error'    // 5xx - Server errors
  | 'timeout'         // Request timeout
  | 'network'         // Network connectivity
  | 'overloaded'      // 529 - Overloaded
  | 'unavailable'     // Service unavailable
  | 'transient';      // Other transient errors

/**
 * Non-retryable error types
 */
export type NonRetryableErrorType =
  | 'invalid_request'  // 400 - Bad request
  | 'unauthorized'     // 401 - Auth failure
  | 'forbidden'        // 403 - Permission denied
  | 'not_found'        // 404 - Resource not found
  | 'validation'       // Input validation error
  | 'content_filter'   // Content blocked
  | 'quota_exceeded'   // Hard quota limit
  | 'unknown';         // Unknown error

export type ErrorType = RetryableErrorType | NonRetryableErrorType;

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier: number;
  /** Jitter factor (0-1, default: 0.1) */
  jitterFactor: number;
  /** Timeout for each attempt in milliseconds */
  attemptTimeoutMs: number;
  /** Total timeout for all attempts in milliseconds */
  totalTimeoutMs: number;
  /** Error types to retry (default: all retryable) */
  retryableErrors?: RetryableErrorType[];
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result if successful */
  result?: T;
  /** The final error if failed */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent in milliseconds */
  totalTimeMs: number;
  /** Whether retries were exhausted */
  retriesExhausted: boolean;
  /** Whether timeout was reached */
  timedOut: boolean;
}

/**
 * Retry attempt metadata
 */
export interface RetryAttempt {
  /** Attempt number (1-based) */
  attempt: number;
  /** Error from this attempt */
  error: Error;
  /** Error type classification */
  errorType: ErrorType;
  /** Delay before next retry (ms) */
  delayMs: number;
  /** Timestamp of attempt */
  timestamp: number;
}

/**
 * Retry budget for tracking retry usage
 */
export interface RetryBudget {
  /** Total retries allowed per window */
  maxRetries: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Current retry count */
  currentRetries: number;
  /** Window start time */
  windowStart: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  attemptTimeoutMs: 30000,
  totalTimeoutMs: 120000,
  retryableErrors: ['rate_limit', 'server_error', 'timeout', 'network', 'overloaded', 'unavailable', 'transient'],
  onRetry: () => {}, // No-op default
};

/**
 * Retry configuration presets
 */
export const RETRY_PRESETS: Record<string, Partial<RetryConfig>> = {
  /** Aggressive - quick retries, many attempts */
  aggressive: {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 1.5,
  },
  /** Conservative - slow retries, fewer attempts */
  conservative: {
    maxRetries: 2,
    initialDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 3,
  },
  /** API rate limit - respects rate limit headers */
  rateLimit: {
    maxRetries: 5,
    initialDelayMs: 5000,
    maxDelayMs: 120000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  },
  /** Network - handles network issues */
  network: {
    maxRetries: 4,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: ['network', 'timeout', 'unavailable'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HTTP status code to error type mapping
 */
const HTTP_STATUS_ERROR_MAP: Record<number, ErrorType> = {
  400: 'invalid_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  408: 'timeout',
  429: 'rate_limit',
  500: 'server_error',
  502: 'server_error',
  503: 'unavailable',
  504: 'timeout',
  529: 'overloaded',
};

/**
 * Classify an error for retry decision
 */
export function classifyError(error: unknown): ErrorType {
  if (!error) return 'unknown';

  // Check for HTTP status code
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for specific error patterns
    if (message.includes('rate limit') || message.includes('429')) {
      return 'rate_limit';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
      return 'network';
    }
    if (message.includes('overloaded') || message.includes('529')) {
      return 'overloaded';
    }
    if (message.includes('unavailable') || message.includes('503')) {
      return 'unavailable';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'unauthorized';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'forbidden';
    }
    if (message.includes('content') && message.includes('filter')) {
      return 'content_filter';
    }
    if (message.includes('quota')) {
      return 'quota_exceeded';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    // Check for status property
    const errorWithStatus = error as { status?: number; statusCode?: number };
    const status = errorWithStatus.status || errorWithStatus.statusCode;
    if (status && HTTP_STATUS_ERROR_MAP[status]) {
      return HTTP_STATUS_ERROR_MAP[status];
    }

    // Check for 5xx in message
    if (/\b5\d{2}\b/.test(message)) {
      return 'server_error';
    }
  }

  return 'unknown';
}

/**
 * Check if an error type is retryable
 */
export function isRetryableError(
  errorType: ErrorType,
  retryableErrors: RetryableErrorType[] = DEFAULT_RETRY_CONFIG.retryableErrors
): boolean {
  return (retryableErrors as string[]).includes(errorType);
}

/**
 * Get suggested retry delay from error (e.g., Retry-After header)
 */
export function getSuggestedDelay(error: unknown): number | null {
  if (error instanceof Error) {
    const errorWithHeaders = error as { headers?: Record<string, string> };
    const retryAfter = errorWithHeaders.headers?.['retry-after'];

    if (retryAfter) {
      // Try parsing as seconds
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }

      // Try parsing as date
      const date = new Date(retryAfter);
      if (!isNaN(date.getTime())) {
        return Math.max(0, date.getTime() - Date.now());
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY HANDLER CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retry handler with exponential backoff and jitter
 */
export class RetryHandler {
  private readonly config: Required<RetryConfig>;
  private attempts: RetryAttempt[] = [];

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
      retryableErrors: config.retryableErrors || DEFAULT_RETRY_CONFIG.retryableErrors,
      onRetry: config.onRetry || DEFAULT_RETRY_CONFIG.onRetry,
    };
  }

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    while (attempts < this.config.maxRetries + 1) {
      attempts++;

      // Check total timeout
      const elapsed = Date.now() - startTime;
      if (elapsed >= this.config.totalTimeoutMs) {
        return {
          success: false,
          error: lastError || new Error('Total timeout exceeded'),
          attempts,
          totalTimeMs: elapsed,
          retriesExhausted: false,
          timedOut: true,
        };
      }

      try {
        // Execute with attempt timeout
        const result = await this.executeWithTimeout(operation, this.config.attemptTimeoutMs);

        return {
          success: true,
          result,
          attempts,
          totalTimeMs: Date.now() - startTime,
          retriesExhausted: false,
          timedOut: false,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorType = classifyError(error);

        // Check if error is retryable
        if (!isRetryableError(errorType, this.config.retryableErrors)) {
          return {
            success: false,
            error: lastError,
            attempts,
            totalTimeMs: Date.now() - startTime,
            retriesExhausted: false,
            timedOut: false,
          };
        }

        // Check if we have retries left
        if (attempts >= this.config.maxRetries + 1) {
          return {
            success: false,
            error: lastError,
            attempts,
            totalTimeMs: Date.now() - startTime,
            retriesExhausted: true,
            timedOut: false,
          };
        }

        // Calculate delay
        const delayMs = this.calculateDelay(attempts, error);

        // Record attempt
        this.attempts.push({
          attempt: attempts,
          error: lastError,
          errorType,
          delayMs,
          timestamp: Date.now(),
        });

        // Call retry callback
        if (this.config.onRetry) {
          this.config.onRetry(attempts, lastError, delayMs);
        }

        // Wait before retry
        await this.delay(delayMs);
      }
    }

    return {
      success: false,
      error: lastError || new Error('Unknown error'),
      attempts,
      totalTimeMs: Date.now() - startTime,
      retriesExhausted: true,
      timedOut: false,
    };
  }

  /**
   * Get retry attempts history
   */
  getAttempts(): RetryAttempt[] {
    return [...this.attempts];
  }

  /**
   * Clear attempts history
   */
  clearAttempts(): void {
    this.attempts = [];
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      ),
    ]);
  }

  private calculateDelay(attempt: number, error: unknown): number {
    // Check for suggested delay from error
    const suggestedDelay = getSuggestedDelay(error);
    if (suggestedDelay !== null) {
      return Math.min(suggestedDelay, this.config.maxDelayMs);
    }

    // Calculate exponential backoff
    const exponentialDelay =
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Apply jitter
    const jitter = exponentialDelay * this.config.jitterFactor * (Math.random() * 2 - 1);

    // Clamp to max delay
    return Math.min(exponentialDelay + jitter, this.config.maxDelayMs);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY BUDGET MANAGER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Manages retry budgets to prevent retry storms
 */
export class RetryBudgetManager {
  private budgets: Map<string, RetryBudget> = new Map();
  private readonly defaultBudget: Omit<RetryBudget, 'currentRetries' | 'windowStart'>;

  constructor(config?: { maxRetries?: number; windowMs?: number }) {
    this.defaultBudget = {
      maxRetries: config?.maxRetries ?? 10,
      windowMs: config?.windowMs ?? 60000,
    };
  }

  /**
   * Check if a retry is allowed for an identifier
   */
  canRetry(identifier: string): boolean {
    const budget = this.getBudget(identifier);
    this.cleanupBudget(budget);
    return budget.currentRetries < budget.maxRetries;
  }

  /**
   * Record a retry attempt
   */
  recordRetry(identifier: string): void {
    const budget = this.getBudget(identifier);
    this.cleanupBudget(budget);
    budget.currentRetries++;
  }

  /**
   * Get remaining retries for an identifier
   */
  getRemainingRetries(identifier: string): number {
    const budget = this.getBudget(identifier);
    this.cleanupBudget(budget);
    return Math.max(0, budget.maxRetries - budget.currentRetries);
  }

  /**
   * Get budget status for all identifiers
   */
  getAllBudgets(): Map<string, RetryBudget> {
    // Cleanup all budgets
    for (const budget of this.budgets.values()) {
      this.cleanupBudget(budget);
    }
    return new Map(this.budgets);
  }

  /**
   * Reset a specific budget
   */
  resetBudget(identifier: string): void {
    this.budgets.delete(identifier);
  }

  /**
   * Reset all budgets
   */
  resetAll(): void {
    this.budgets.clear();
  }

  private getBudget(identifier: string): RetryBudget {
    let budget = this.budgets.get(identifier);

    if (!budget) {
      budget = {
        ...this.defaultBudget,
        currentRetries: 0,
        windowStart: Date.now(),
      };
      this.budgets.set(identifier, budget);
    }

    return budget;
  }

  private cleanupBudget(budget: RetryBudget): void {
    const now = Date.now();
    if (now - budget.windowStart >= budget.windowMs) {
      budget.currentRetries = 0;
      budget.windowStart = now;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute an operation with default retry config
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const handler = new RetryHandler(config);
  const result = await handler.execute(operation);

  if (result.success) {
    return result.result as T;
  }

  throw result.error;
}

/**
 * Execute with preset retry configuration
 */
export async function withRetryPreset<T>(
  operation: () => Promise<T>,
  preset: keyof typeof RETRY_PRESETS
): Promise<T> {
  return withRetry(operation, RETRY_PRESETS[preset]);
}

/**
 * Create a retry-wrapped version of a function
 */
export function withRetryWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config?: Partial<RetryConfig>
): T {
  return (async (...args: Parameters<T>) => {
    return withRetry(() => fn(...args), config);
  }) as T;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let retryBudgetManager: RetryBudgetManager | null = null;

/**
 * Get the singleton retry budget manager
 */
export function getRetryBudgetManager(): RetryBudgetManager {
  if (!retryBudgetManager) {
    retryBudgetManager = new RetryBudgetManager();
  }
  return retryBudgetManager;
}

/**
 * Reset the singleton
 */
export function resetRetryBudgetManager(): void {
  retryBudgetManager?.resetAll();
  retryBudgetManager = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format retry result for logging
 */
export function formatRetryResult<T>(result: RetryResult<T>): string {
  const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
  const lines: string[] = [
    `Retry Result: ${status}`,
    `Attempts: ${result.attempts}`,
    `Total Time: ${result.totalTimeMs}ms`,
  ];

  if (result.retriesExhausted) {
    lines.push('⚠️ Retries exhausted');
  }

  if (result.timedOut) {
    lines.push('⏰ Timed out');
  }

  if (result.error) {
    lines.push(`Error: ${result.error.message}`);
  }

  return lines.join('\n');
}
