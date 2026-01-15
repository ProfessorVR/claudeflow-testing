/**
 * Resilience Module
 * TIER-1.2 - Production Hardening
 *
 * Exports error recovery utilities:
 * - withRetry: Retry with exponential backoff
 * - CircuitBreaker: Protect external dependencies
 * - withFallback: Graceful degradation
 * - withResilience: Combined pattern
 *
 * @module god-agent/core/resilience
 */

export {
  // Types
  type RetryOptions,
  type CircuitBreakerOptions,
  type FallbackOptions,
  CircuitState,
  ErrorClass,

  // Error classification
  classifyError,
  isRetryableError,

  // Retry logic
  withRetry,

  // Circuit breaker
  CircuitBreaker,
  getCircuitBreaker,
  getAllCircuitBreakerStats,
  resetAllCircuitBreakers,

  // Fallback
  withFallback,

  // Combined patterns
  withRetryAndCircuitBreaker,
  withResilience,

  // Pre-configured instances
  embeddingCircuitBreaker,
  externalApiCircuitBreaker,
  databaseCircuitBreaker,
} from './error-recovery.js';
