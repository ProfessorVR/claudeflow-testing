/**
 * Error Recovery Service
 * TIER-1.2 - Production Hardening
 *
 * Provides centralized error handling with:
 * - Retry logic with exponential backoff
 * - Circuit breaker for external dependencies
 * - Fallback handling for graceful degradation
 * - Error classification and recovery strategies
 *
 * @module god-agent/core/resilience/error-recovery
 */

import { createServiceLogger } from '../observability/logger.js';

// Service logger
const log = createServiceLogger('error-recovery');

// ==================== Types ====================

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Jitter factor 0-1 to add randomness (default: 0.1) */
  jitter?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Failure threshold to open circuit (default: 5) */
  failureThreshold?: number;
  /** Success threshold to close circuit (default: 2) */
  successThreshold?: number;
  /** Time in ms before attempting to close circuit (default: 30000) */
  resetTimeoutMs?: number;
  /** Callback when circuit opens */
  onOpen?: () => void;
  /** Callback when circuit closes */
  onClose?: () => void;
  /** Callback when circuit is half-open */
  onHalfOpen?: () => void;
}

/**
 * Fallback configuration options
 */
export interface FallbackOptions<T> {
  /** Fallback value or function to generate it */
  fallback: T | (() => T) | (() => Promise<T>);
  /** Whether to log the original error (default: true) */
  logError?: boolean;
  /** Callback when fallback is used */
  onFallback?: (error: Error) => void;
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * Error classification for recovery strategy
 */
export enum ErrorClass {
  TRANSIENT = 'transient',     // Network, timeout - retryable
  PERMANENT = 'permanent',      // Auth, validation - not retryable
  RESOURCE = 'resource',        // Rate limit, capacity - backoff
  UNKNOWN = 'unknown',          // Unclassified
}

// ==================== Error Classification ====================

/**
 * Classify an error for recovery strategy
 */
export function classifyError(error: Error): ErrorClass {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Transient errors (retryable)
  if (
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('socket hang up') ||
    message.includes('network') ||
    message.includes('temporarily unavailable') ||
    name.includes('timeout')
  ) {
    return ErrorClass.TRANSIENT;
  }

  // Resource errors (backoff and retry)
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    message.includes('capacity') ||
    message.includes('overloaded')
  ) {
    return ErrorClass.RESOURCE;
  }

  // Permanent errors (don't retry)
  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('invalid') ||
    message.includes('not found') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('404')
  ) {
    return ErrorClass.PERMANENT;
  }

  return ErrorClass.UNKNOWN;
}

/**
 * Default retry predicate based on error classification
 */
export function isRetryableError(error: Error): boolean {
  const errorClass = classifyError(error);
  return errorClass === ErrorClass.TRANSIENT || errorClass === ErrorClass.RESOURCE;
}

// ==================== Retry Logic ====================

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: 0.1,
  isRetryable: isRetryableError,
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>
): number {
  const baseDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(baseDelay, options.maxDelayMs);

  // Add jitter
  const jitterRange = cappedDelay * options.jitter;
  const jitter = (Math.random() - 0.5) * 2 * jitterRange;

  return Math.max(0, cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Promise with the function result
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt >= opts.maxAttempts || !opts.isRetryable(lastError)) {
        throw lastError;
      }

      // Calculate delay and wait
      const delayMs = calculateDelay(attempt, opts);

      log.warn('Retry attempt scheduled', {
        attempt,
        maxAttempts: opts.maxAttempts,
        delayMs: Math.round(delayMs),
        error: lastError.message,
      });

      opts.onRetry(attempt, lastError, delayMs);
      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

// ==================== Circuit Breaker ====================

/**
 * Default circuit breaker options
 */
const DEFAULT_CB_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30000,
  onOpen: () => {},
  onClose: () => {},
  onHalfOpen: () => {},
};

/**
 * Circuit breaker for protecting external dependencies
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: Required<CircuitBreakerOptions>;
  private readonly name: string;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = { ...DEFAULT_CB_OPTIONS, ...options };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    // Check if we should transition from OPEN to HALF_OPEN
    if (
      this.state === CircuitState.OPEN &&
      Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs
    ) {
      this.transitionTo(CircuitState.HALF_OPEN);
    }
    return this.state;
  }

  /**
   * Execute a function through the circuit breaker
   *
   * @param fn - Async function to execute
   * @returns Promise with the function result
   * @throws Error if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === CircuitState.OPEN) {
      const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
      error.name = 'CircuitBreakerOpenError';
      throw error;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record a successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed execution
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediate transition back to OPEN on any failure in half-open
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    log.info('Circuit breaker state transition', {
      name: this.name,
      from: oldState,
      to: newState,
      failureCount: this.failureCount,
      successCount: this.successCount,
    });

    // Reset counters on state change
    if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
      this.options.onHalfOpen();
    } else if (newState === CircuitState.OPEN) {
      this.options.onOpen();
    } else if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.options.onClose();
    }
  }

  /**
   * Force reset the circuit breaker to closed state
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): {
    name: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// ==================== Fallback ====================

/**
 * Execute a function with fallback on error
 *
 * @param fn - Async function to execute
 * @param options - Fallback configuration
 * @returns Promise with function result or fallback value
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  options: FallbackOptions<T>
): Promise<T> {
  const { fallback, logError = true, onFallback } = options;

  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (logError) {
      log.warn('Using fallback due to error', {
        error: err.message,
        errorClass: classifyError(err),
      });
    }

    if (onFallback) {
      onFallback(err);
    }

    // Resolve fallback value
    if (typeof fallback === 'function') {
      return await (fallback as () => T | Promise<T>)();
    }
    return fallback;
  }
}

// ==================== Combined Patterns ====================

/**
 * Execute with retry and circuit breaker protection
 *
 * @param fn - Async function to execute
 * @param circuitBreaker - Circuit breaker instance
 * @param retryOptions - Retry configuration
 * @returns Promise with the function result
 */
export async function withRetryAndCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return withRetry(
    () => circuitBreaker.execute(fn),
    retryOptions
  );
}

/**
 * Execute with full resilience: retry, circuit breaker, and fallback
 *
 * @param fn - Async function to execute
 * @param options - Combined options
 * @returns Promise with function result or fallback
 */
export async function withResilience<T>(
  fn: () => Promise<T>,
  options: {
    circuitBreaker?: CircuitBreaker;
    retry?: RetryOptions;
    fallback?: FallbackOptions<T>;
  }
): Promise<T> {
  const { circuitBreaker, retry, fallback } = options;

  // Build the execution chain
  let executor: () => Promise<T> = fn;

  // Wrap with circuit breaker if provided
  if (circuitBreaker) {
    const originalExecutor = executor;
    executor = () => circuitBreaker.execute(originalExecutor);
  }

  // Wrap with retry if provided
  if (retry) {
    const originalExecutor = executor;
    executor = () => withRetry(originalExecutor, retry);
  }

  // Wrap with fallback if provided
  if (fallback) {
    return withFallback(executor, fallback);
  }

  return executor();
}

// ==================== Error Recovery Service ====================

/**
 * Global circuit breakers registry
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker by name
 */
export function getCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions
): CircuitBreaker {
  let cb = circuitBreakers.get(name);
  if (!cb) {
    cb = new CircuitBreaker(name, options);
    circuitBreakers.set(name, cb);
  }
  return cb;
}

/**
 * Get all circuit breaker statistics
 */
export function getAllCircuitBreakerStats(): ReturnType<CircuitBreaker['getStats']>[] {
  return Array.from(circuitBreakers.values()).map(cb => cb.getStats());
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  for (const cb of circuitBreakers.values()) {
    cb.reset();
  }
  log.info('All circuit breakers reset');
}

// ==================== Pre-configured Instances ====================

/**
 * Circuit breaker for embedding service
 */
export const embeddingCircuitBreaker = getCircuitBreaker('embedding', {
  failureThreshold: 3,
  successThreshold: 2,
  resetTimeoutMs: 60000, // 1 minute
  onOpen: () => log.warn('Embedding circuit breaker OPENED - service degraded'),
  onClose: () => log.info('Embedding circuit breaker CLOSED - service restored'),
});

/**
 * Circuit breaker for external API calls
 */
export const externalApiCircuitBreaker = getCircuitBreaker('external-api', {
  failureThreshold: 5,
  successThreshold: 3,
  resetTimeoutMs: 30000,
});

/**
 * Circuit breaker for database operations
 */
export const databaseCircuitBreaker = getCircuitBreaker('database', {
  failureThreshold: 10,
  successThreshold: 5,
  resetTimeoutMs: 15000,
});
