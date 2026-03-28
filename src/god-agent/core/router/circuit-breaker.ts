/**
 * Circuit Breaker for LLM Providers
 *
 * Phase 7.2: Production Hardening - Circuit Breakers
 *
 * Implements:
 * - Three-state circuit breaker (closed, open, half-open)
 * - Failure threshold tracking
 * - Automatic recovery with half-open probing
 * - Per-provider circuit state
 * - Event emission for monitoring
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Circuit breaker states
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes in half-open to close circuit */
  successThreshold: number;
  /** Time in milliseconds before trying half-open */
  resetTimeoutMs: number;
  /** Time window for counting failures (ms) */
  failureWindowMs: number;
  /** Timeout for individual requests (ms) */
  requestTimeoutMs: number;
  /** Enable half-open state (vs immediate close after timeout) */
  enableHalfOpen: boolean;
  /** Maximum consecutive successes needed to fully close */
  halfOpenMaxAttempts: number;
  /** Minimum requests before failure rate is considered */
  minimumRequests: number;
  /** Failure rate threshold (0-1) to open circuit */
  failureRateThreshold: number;
}

/**
 * Circuit breaker status
 */
export interface CircuitBreakerStatus {
  /** Provider/model identifier */
  identifier: string;
  /** Current state */
  state: CircuitState;
  /** Failures in current window */
  failures: number;
  /** Successes in current window */
  successes: number;
  /** Total requests in window */
  totalRequests: number;
  /** Current failure rate */
  failureRate: number;
  /** Time until reset attempt (ms, if open) */
  nextAttemptMs: number | null;
  /** Last failure timestamp */
  lastFailure: number | null;
  /** Last success timestamp */
  lastSuccess: number | null;
  /** Time since circuit opened (ms, if open) */
  openDuration: number | null;
  /** Consecutive successes in half-open */
  halfOpenSuccesses: number;
}

/**
 * Circuit breaker event types
 */
export type CircuitEventType =
  | 'state_change'
  | 'failure'
  | 'success'
  | 'request_rejected'
  | 'half_open_attempt'
  | 'recovery';

/**
 * Circuit breaker event
 */
export interface CircuitEvent {
  type: CircuitEventType;
  identifier: string;
  timestamp: number;
  previousState?: CircuitState;
  newState?: CircuitState;
  error?: Error;
  failureRate?: number;
}

/**
 * Result of a circuit breaker execution
 */
export interface CircuitBreakerResult<T> {
  /** Whether the execution was allowed */
  allowed: boolean;
  /** Result if successful */
  result?: T;
  /** Error if failed */
  error?: Error;
  /** Current circuit state */
  state: CircuitState;
  /** Whether circuit state changed */
  stateChanged: boolean;
}

/**
 * Request tracking entry
 */
interface RequestEntry {
  timestamp: number;
  success: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: Required<CircuitBreakerConfig> = {
  failureThreshold: 5,
  successThreshold: 3,
  resetTimeoutMs: 30000, // 30 seconds
  failureWindowMs: 60000, // 1 minute
  requestTimeoutMs: 30000, // 30 seconds
  enableHalfOpen: true,
  halfOpenMaxAttempts: 3,
  minimumRequests: 5,
  failureRateThreshold: 0.5, // 50% failure rate
};

/**
 * Circuit breaker configuration presets
 */
export const CIRCUIT_PRESETS: Record<string, Partial<CircuitBreakerConfig>> = {
  /** Sensitive - opens quickly, recovers slowly */
  sensitive: {
    failureThreshold: 3,
    successThreshold: 5,
    resetTimeoutMs: 60000,
    failureRateThreshold: 0.3,
  },
  /** Aggressive - opens slowly, recovers quickly */
  aggressive: {
    failureThreshold: 10,
    successThreshold: 2,
    resetTimeoutMs: 15000,
    failureRateThreshold: 0.7,
  },
  /** Balanced - default behavior */
  balanced: {
    failureThreshold: 5,
    successThreshold: 3,
    resetTimeoutMs: 30000,
    failureRateThreshold: 0.5,
  },
  /** Local provider - more lenient */
  local: {
    failureThreshold: 10,
    successThreshold: 2,
    resetTimeoutMs: 10000,
    failureRateThreshold: 0.8,
    minimumRequests: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker extends EventEmitter {
  private readonly config: Required<CircuitBreakerConfig>;
  private readonly identifier: string;

  private state: CircuitState = 'closed';
  private requestHistory: RequestEntry[] = [];
  private lastStateChange: number = Date.now();
  private openedAt: number | null = null;
  private halfOpenSuccesses: number = 0;
  private halfOpenAttempts: number = 0;

  constructor(identifier: string, config: Partial<CircuitBreakerConfig> = {}) {
    super();
    this.identifier = identifier;
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
  }

  /**
   * Execute an operation through the circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    // Check if circuit allows the request
    if (!this.allowRequest()) {
      this.emit('request_rejected', this.createEvent('request_rejected'));
      return {
        allowed: false,
        error: new Error(`Circuit breaker is ${this.state} for ${this.identifier}`),
        state: this.state,
        stateChanged: false,
      };
    }

    const previousState = this.state;

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(operation);

      // Record success
      this.recordSuccess();

      return {
        allowed: true,
        result,
        state: this.state,
        stateChanged: this.state !== previousState,
      };
    } catch (error) {
      // Record failure
      this.recordFailure(error instanceof Error ? error : new Error(String(error)));

      return {
        allowed: true,
        error: error instanceof Error ? error : new Error(String(error)),
        state: this.state,
        stateChanged: this.state !== previousState,
      };
    }
  }

  /**
   * Check if circuit allows a request (without executing)
   */
  allowRequest(): boolean {
    this.cleanupHistory();

    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        // Check if reset timeout has passed
        if (this.openedAt && Date.now() - this.openedAt >= this.config.resetTimeoutMs) {
          this.transitionTo('half-open');
          return true;
        }
        return false;

      case 'half-open':
        // Allow limited requests in half-open — increment BEFORE returning
        if (this.halfOpenAttempts < this.config.halfOpenMaxAttempts) {
          this.halfOpenAttempts++;
          return true;
        }
        return false;
    }
  }

  /**
   * Manually record a success (for external tracking)
   */
  recordSuccess(): void {
    const now = Date.now();
    this.requestHistory.push({ timestamp: now, success: true });

    this.emit('success', this.createEvent('success'));

    if (this.state === 'half-open') {
      this.halfOpenSuccesses++;

      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.transitionTo('closed');
        this.emit('recovery', this.createEvent('recovery'));
      }
    }
  }

  /**
   * Manually record a failure (for external tracking)
   */
  recordFailure(error?: Error): void {
    const now = Date.now();
    this.requestHistory.push({ timestamp: now, success: false });

    const event = this.createEvent('failure');
    event.error = error;
    this.emit('failure', event);

    if (this.state === 'half-open') {
      // Any failure in half-open reopens the circuit
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      // Check if we should open
      this.checkAndOpen();
    }
  }

  /**
   * Get current status
   */
  getStatus(): CircuitBreakerStatus {
    this.cleanupHistory();

    const successes = this.requestHistory.filter(r => r.success).length;
    const failures = this.requestHistory.filter(r => !r.success).length;
    const total = this.requestHistory.length;
    const failureRate = total > 0 ? failures / total : 0;

    const lastFailureEntry = [...this.requestHistory]
      .reverse()
      .find(r => !r.success);
    const lastSuccessEntry = [...this.requestHistory]
      .reverse()
      .find(r => r.success);

    let nextAttemptMs: number | null = null;
    if (this.state === 'open' && this.openedAt) {
      const elapsed = Date.now() - this.openedAt;
      nextAttemptMs = Math.max(0, this.config.resetTimeoutMs - elapsed);
    }

    return {
      identifier: this.identifier,
      state: this.state,
      failures,
      successes,
      totalRequests: total,
      failureRate,
      nextAttemptMs,
      lastFailure: lastFailureEntry?.timestamp || null,
      lastSuccess: lastSuccessEntry?.timestamp || null,
      openDuration: this.openedAt ? Date.now() - this.openedAt : null,
      halfOpenSuccesses: this.halfOpenSuccesses,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === 'open';
  }

  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === 'closed';
  }

  /**
   * Force circuit to specific state (for testing/recovery)
   */
  forceState(state: CircuitState): void {
    const previousState = this.state;
    this.state = state;
    this.lastStateChange = Date.now();

    if (state === 'open') {
      this.openedAt = Date.now();
    } else if (state === 'closed') {
      this.openedAt = null;
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    } else if (state === 'half-open') {
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    }

    this.emit('state_change', this.createEvent('state_change', previousState, state));
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.requestHistory = [];
    this.lastStateChange = Date.now();
    this.openedAt = null;
    this.halfOpenSuccesses = 0;
    this.halfOpenAttempts = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'half-open') {
      this.emit('half_open_attempt', this.createEvent('half_open_attempt'));
    }

    let timeoutId: NodeJS.Timeout;
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Circuit breaker request timeout')),
            this.config.requestTimeoutMs
          );
        }),
      ]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  private cleanupHistory(): void {
    const cutoff = Date.now() - this.config.failureWindowMs;
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoff);
  }

  private checkAndOpen(): void {
    this.cleanupHistory();

    const total = this.requestHistory.length;
    if (total < this.config.minimumRequests) {
      return; // Not enough data
    }

    const failures = this.requestHistory.filter(r => !r.success).length;
    const failureRate = failures / total;

    // Check failure count threshold
    if (failures >= this.config.failureThreshold) {
      this.transitionTo('open');
      return;
    }

    // Check failure rate threshold
    if (failureRate >= this.config.failureRateThreshold) {
      this.transitionTo('open');
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const previousState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    if (newState === 'open') {
      this.openedAt = Date.now();
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    } else if (newState === 'half-open') {
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    } else if (newState === 'closed') {
      this.openedAt = null;
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    }

    this.emit('state_change', this.createEvent('state_change', previousState, newState));
  }

  private createEvent(
    type: CircuitEventType,
    previousState?: CircuitState,
    newState?: CircuitState
  ): CircuitEvent {
    const event: CircuitEvent = {
      type,
      identifier: this.identifier,
      timestamp: Date.now(),
    };

    if (previousState !== undefined) {
      event.previousState = previousState;
    }
    if (newState !== undefined) {
      event.newState = newState;
    }

    const status = this.getStatus();
    event.failureRate = status.failureRate;

    return event;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER MANAGER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Configuration for circuit breaker manager
 */
export interface CircuitBreakerManagerConfig {
  /** Default config for unknown providers */
  defaultConfig?: Partial<CircuitBreakerConfig>;
  /** Per-provider configurations */
  providerConfigs?: Record<string, Partial<CircuitBreakerConfig>>;
  /** Event handler for circuit events */
  onEvent?: (event: CircuitEvent) => void;
}

/**
 * Manages circuit breakers for multiple providers
 */
export class CircuitBreakerManager {
  private readonly breakers: Map<string, CircuitBreaker> = new Map();
  private readonly config: Required<CircuitBreakerManagerConfig>;

  constructor(config: CircuitBreakerManagerConfig = {}) {
    this.config = {
      defaultConfig: config.defaultConfig || {},
      providerConfigs: config.providerConfigs || {},
      onEvent: config.onEvent || (() => {}),
    };
  }

  /**
   * Get or create a circuit breaker for a provider
   */
  getBreaker(identifier: string): CircuitBreaker {
    let breaker = this.breakers.get(identifier);

    if (!breaker) {
      const config = this.config.providerConfigs[identifier] || this.config.defaultConfig;
      breaker = new CircuitBreaker(identifier, config);

      // Wire up event handling
      breaker.on('state_change', (event: CircuitEvent) => this.config.onEvent(event));
      breaker.on('failure', (event: CircuitEvent) => this.config.onEvent(event));
      breaker.on('success', (event: CircuitEvent) => this.config.onEvent(event));
      breaker.on('request_rejected', (event: CircuitEvent) => this.config.onEvent(event));
      breaker.on('recovery', (event: CircuitEvent) => this.config.onEvent(event));

      this.breakers.set(identifier, breaker);
    }

    return breaker;
  }

  /**
   * Execute through a provider's circuit breaker
   */
  async execute<T>(
    provider: string,
    operation: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    const breaker = this.getBreaker(provider);
    return breaker.execute(operation);
  }

  /**
   * Check if a provider's circuit allows requests
   */
  allowRequest(provider: string): boolean {
    const breaker = this.breakers.get(provider);
    return breaker ? breaker.allowRequest() : true;
  }

  /**
   * Get all breaker statuses
   */
  getAllStatus(): CircuitBreakerStatus[] {
    return Array.from(this.breakers.values()).map(b => b.getStatus());
  }

  /**
   * Get providers with open circuits
   */
  getOpenCircuits(): string[] {
    return Array.from(this.breakers.entries())
      .filter(([_, breaker]) => breaker.isOpen())
      .map(([id]) => id);
  }

  /**
   * Get providers with healthy circuits
   */
  getHealthyProviders(): string[] {
    return Array.from(this.breakers.entries())
      .filter(([_, breaker]) => breaker.isClosed())
      .map(([id]) => id);
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Reset a specific circuit breaker
   */
  resetProvider(provider: string): void {
    const breaker = this.breakers.get(provider);
    if (breaker) {
      breaker.reset();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let circuitBreakerManager: CircuitBreakerManager | null = null;

/**
 * Get the singleton circuit breaker manager
 */
export function getCircuitBreakerManager(
  config?: CircuitBreakerManagerConfig
): CircuitBreakerManager {
  if (!circuitBreakerManager) {
    circuitBreakerManager = new CircuitBreakerManager(config);
  }
  return circuitBreakerManager;
}

/**
 * Initialize circuit breaker manager with config
 */
export function initializeCircuitBreaker(
  config: CircuitBreakerManagerConfig
): CircuitBreakerManager {
  circuitBreakerManager = new CircuitBreakerManager(config);
  return circuitBreakerManager;
}

/**
 * Reset the singleton
 */
export function resetCircuitBreaker(): void {
  circuitBreakerManager?.resetAll();
  circuitBreakerManager = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get state emoji
 */
function getStateEmoji(state: CircuitState): string {
  switch (state) {
    case 'closed':
      return '🟢';
    case 'open':
      return '🔴';
    case 'half-open':
      return '🟡';
  }
}

/**
 * Format circuit breaker status for display
 */
export function formatCircuitStatus(status: CircuitBreakerStatus): string {
  const stateEmoji = getStateEmoji(status.state);
  const lines: string[] = [
    `=== Circuit: ${status.identifier} ===`,
    '',
    `State: ${stateEmoji} ${status.state.toUpperCase()}`,
    `Requests: ${status.totalRequests} (${status.successes} success, ${status.failures} failed)`,
    `Failure Rate: ${(status.failureRate * 100).toFixed(1)}%`,
  ];

  if (status.state === 'open' && status.nextAttemptMs !== null) {
    lines.push(`Next Attempt: ${Math.ceil(status.nextAttemptMs / 1000)}s`);
  }

  if (status.state === 'half-open') {
    lines.push(`Half-Open Successes: ${status.halfOpenSuccesses}`);
  }

  if (status.openDuration !== null) {
    lines.push(`Open Duration: ${Math.ceil(status.openDuration / 1000)}s`);
  }

  return lines.join('\n');
}

/**
 * Format all circuit statuses
 */
export function formatAllCircuitStatus(statuses: CircuitBreakerStatus[]): string {
  if (statuses.length === 0) {
    return 'No circuit breakers active.';
  }

  return statuses.map(formatCircuitStatus).join('\n\n');
}

/**
 * Get circuit health summary
 */
export function getCircuitHealthSummary(statuses: CircuitBreakerStatus[]): string {
  const closed = statuses.filter(s => s.state === 'closed').length;
  const open = statuses.filter(s => s.state === 'open').length;
  const halfOpen = statuses.filter(s => s.state === 'half-open').length;

  return `Circuits: 🟢 ${closed} healthy | 🔴 ${open} open | 🟡 ${halfOpen} recovering`;
}
