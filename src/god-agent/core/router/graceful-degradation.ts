/**
 * Graceful Degradation Strategies
 *
 * Phase 7.3: Production Hardening - Graceful Degradation
 *
 * Implements:
 * - Provider fallback chains
 * - Quality-aware degradation
 * - Cached response fallback
 * - Reduced functionality modes
 * - Health-based provider selection
 */

import { CircuitBreakerManager, getCircuitBreakerManager, CircuitBreakerStatus } from './circuit-breaker.js';
import { RateLimiterManager, getRateLimiterManager, RateLimitStatus } from './rate-limiter.js';
import { getQualityScorer } from './quality-scorer.js';
import { ModelQualityStats } from './router-types.js';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Provider health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Degradation level
 */
export type DegradationLevel =
  | 'none'          // Full functionality
  | 'reduced'       // Some features disabled
  | 'fallback'      // Using fallback provider
  | 'cached'        // Using cached responses
  | 'offline';      // No service available

/**
 * Provider health info
 */
export interface ProviderHealth {
  /** Provider identifier */
  provider: string;
  /** Current health status */
  status: HealthStatus;
  /** Circuit breaker state */
  circuitState: 'closed' | 'open' | 'half-open';
  /** Whether rate limited */
  rateLimited: boolean;
  /** Quality score (0-1) */
  qualityScore: number;
  /** Latency percentile (p95) in ms */
  latencyP95: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Last successful request timestamp */
  lastSuccess: number | null;
  /** Last check timestamp */
  lastCheck: number;
}

/**
 * Fallback chain configuration
 */
export interface FallbackChain {
  /** Primary provider */
  primary: string;
  /** Ordered list of fallback providers */
  fallbacks: string[];
  /** Minimum quality threshold for fallbacks */
  minQualityThreshold?: number;
  /** Whether to allow degraded functionality */
  allowDegraded?: boolean;
  /** Whether to use cached responses as last resort */
  allowCached?: boolean;
}

/**
 * Degradation decision
 */
export interface DegradationDecision {
  /** Selected provider */
  provider: string | null;
  /** Current degradation level */
  level: DegradationLevel;
  /** Reason for degradation */
  reason: string;
  /** Available alternatives */
  alternatives: string[];
  /** Recommended actions */
  recommendations: string[];
  /** Whether service is available at all */
  serviceAvailable: boolean;
}

/**
 * Degradation strategy configuration
 */
export interface DegradationConfig {
  /** Fallback chains by use case */
  fallbackChains: Record<string, FallbackChain>;
  /** Quality threshold for "healthy" status */
  healthyQualityThreshold: number;
  /** Quality threshold for "degraded" status */
  degradedQualityThreshold: number;
  /** Error rate threshold for "unhealthy" status */
  unhealthyErrorThreshold: number;
  /** Latency threshold for degradation (ms) */
  latencyThreshold: number;
  /** Enable cached response fallback */
  enableCacheFallback: boolean;
  /** Cache TTL in milliseconds */
  cacheTtlMs: number;
  /** Enable automatic recovery */
  enableAutoRecovery: boolean;
  /** Recovery check interval (ms) */
  recoveryCheckIntervalMs: number;
}

/**
 * Cached response entry
 */
export interface CachedResponse {
  /** Cache key */
  key: string;
  /** Cached response data */
  data: unknown;
  /** Provider that generated response */
  provider: string;
  /** Timestamp of caching */
  timestamp: number;
  /** TTL in milliseconds */
  ttlMs: number;
  /** Quality score of original response */
  qualityScore?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default degradation configuration
 */
export const DEFAULT_DEGRADATION_CONFIG: DegradationConfig = {
  fallbackChains: {
    default: {
      primary: 'anthropic',
      fallbacks: ['openai', 'vllm', 'ollama'],
      minQualityThreshold: 0.7,
      allowDegraded: true,
      allowCached: true,
    },
    code: {
      primary: 'anthropic',
      fallbacks: ['openai', 'vllm'],
      minQualityThreshold: 0.8,
      allowDegraded: true,
      allowCached: false,
    },
    creative: {
      primary: 'anthropic',
      fallbacks: ['openai'],
      minQualityThreshold: 0.75,
      allowDegraded: false,
      allowCached: true,
    },
    local: {
      primary: 'vllm',
      fallbacks: ['ollama'],
      minQualityThreshold: 0.6,
      allowDegraded: true,
      allowCached: true,
    },
  },
  healthyQualityThreshold: 0.85,
  degradedQualityThreshold: 0.7,
  unhealthyErrorThreshold: 0.3,
  latencyThreshold: 10000,
  enableCacheFallback: true,
  cacheTtlMs: 3600000, // 1 hour
  enableAutoRecovery: true,
  recoveryCheckIntervalMs: 30000,
};

// ═══════════════════════════════════════════════════════════════════════════
// DEGRADATION MANAGER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Manages graceful degradation strategies
 */
export class DegradationManager {
  private readonly config: DegradationConfig;
  private readonly circuitBreakerManager: CircuitBreakerManager;
  private readonly rateLimiterManager: RateLimiterManager;

  // Response cache
  private responseCache: Map<string, CachedResponse> = new Map();

  // Provider health cache
  private healthCache: Map<string, ProviderHealth> = new Map();
  private lastHealthCheck: number = 0;
  private readonly healthCacheTtlMs = 5000; // 5 seconds

  // Recovery timer
  private recoveryTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<DegradationConfig> = {}) {
    this.config = { ...DEFAULT_DEGRADATION_CONFIG, ...config };
    this.circuitBreakerManager = getCircuitBreakerManager();
    this.rateLimiterManager = getRateLimiterManager();

    if (this.config.enableAutoRecovery) {
      this.startRecoveryMonitor();
    }
  }

  /**
   * Get degradation decision for a request
   */
  async getDecision(useCase: string = 'default'): Promise<DegradationDecision> {
    const chain = this.config.fallbackChains[useCase] || this.config.fallbackChains.default;

    // Get health of all providers in chain
    const providerHealths = await this.getChainHealth(chain);

    // Try primary first
    const primaryHealth = providerHealths.find(h => h.provider === chain.primary);
    if (primaryHealth && this.isProviderAvailable(primaryHealth)) {
      return {
        provider: chain.primary,
        level: this.getProviderDegradationLevel(primaryHealth),
        reason: 'Primary provider available',
        alternatives: chain.fallbacks.filter(f =>
          providerHealths.find(h => h.provider === f && this.isProviderAvailable(h))
        ),
        recommendations: this.getRecommendations(primaryHealth),
        serviceAvailable: true,
      };
    }

    // Try fallbacks in order
    for (const fallback of chain.fallbacks) {
      const health = providerHealths.find(h => h.provider === fallback);
      if (health && this.isProviderAvailable(health)) {
        // Check quality threshold
        if (chain.minQualityThreshold && health.qualityScore < chain.minQualityThreshold) {
          if (!chain.allowDegraded) continue;
        }

        return {
          provider: fallback,
          level: 'fallback',
          reason: `Primary provider unavailable, using fallback: ${fallback}`,
          alternatives: chain.fallbacks.slice(chain.fallbacks.indexOf(fallback) + 1),
          recommendations: [
            `Monitor ${chain.primary} for recovery`,
            ...this.getRecommendations(health),
          ],
          serviceAvailable: true,
        };
      }
    }

    // No providers available - try cache
    if (chain.allowCached && this.config.enableCacheFallback) {
      return {
        provider: null,
        level: 'cached',
        reason: 'All providers unavailable, using cached responses if available',
        alternatives: [],
        recommendations: [
          'Check provider status',
          'Review circuit breaker states',
          'Consider manual intervention',
        ],
        serviceAvailable: true,
      };
    }

    // Complete outage
    return {
      provider: null,
      level: 'offline',
      reason: 'All providers unavailable and caching disabled',
      alternatives: [],
      recommendations: [
        'ALERT: Complete service outage',
        'Check all provider connectivity',
        'Review recent deployments for issues',
        'Consider enabling cache fallback',
      ],
      serviceAvailable: false,
    };
  }

  /**
   * Select best available provider
   */
  async selectProvider(
    useCase: string = 'default',
    preferLocal: boolean = false
  ): Promise<string | null> {
    const decision = await this.getDecision(useCase);

    if (preferLocal && decision.provider) {
      // Check if a local provider is available
      const localHealth = await this.getProviderHealth('vllm');
      if (this.isProviderAvailable(localHealth)) {
        return 'vllm';
      }

      const ollamaHealth = await this.getProviderHealth('ollama');
      if (this.isProviderAvailable(ollamaHealth)) {
        return 'ollama';
      }
    }

    return decision.provider;
  }

  /**
   * Get health status for a provider
   */
  async getProviderHealth(provider: string): Promise<ProviderHealth> {
    // Check cache
    const cached = this.healthCache.get(provider);
    if (cached && Date.now() - cached.lastCheck < this.healthCacheTtlMs) {
      return cached;
    }

    // Get fresh health info
    const health = await this.computeProviderHealth(provider);
    this.healthCache.set(provider, health);

    return health;
  }

  /**
   * Get health for all providers in a chain
   */
  async getChainHealth(chain: FallbackChain): Promise<ProviderHealth[]> {
    const providers = [chain.primary, ...chain.fallbacks];
    const healths = await Promise.all(
      providers.map(p => this.getProviderHealth(p))
    );
    return healths;
  }

  /**
   * Cache a response for fallback
   */
  cacheResponse(
    key: string,
    data: unknown,
    provider: string,
    qualityScore?: number
  ): void {
    this.responseCache.set(key, {
      key,
      data,
      provider,
      timestamp: Date.now(),
      ttlMs: this.config.cacheTtlMs,
      qualityScore,
    });

    // Cleanup old entries
    this.cleanupCache();
  }

  /**
   * Get cached response
   */
  getCachedResponse(key: string): CachedResponse | null {
    const cached = this.responseCache.get(key);
    if (!cached) return null;

    // Check TTL
    if (Date.now() - cached.timestamp > cached.ttlMs) {
      this.responseCache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Get current degradation level across all providers
   */
  async getOverallDegradationLevel(): Promise<DegradationLevel> {
    const decision = await this.getDecision('default');
    return decision.level;
  }

  /**
   * Get all provider health statuses
   */
  async getAllProviderHealth(): Promise<ProviderHealth[]> {
    const providers = new Set<string>();

    // Collect all known providers from fallback chains
    for (const chain of Object.values(this.config.fallbackChains)) {
      providers.add(chain.primary);
      chain.fallbacks.forEach(f => providers.add(f));
    }

    return Promise.all(
      Array.from(providers).map(p => this.getProviderHealth(p))
    );
  }

  /**
   * Force refresh health status for all providers
   */
  async refreshHealth(): Promise<void> {
    this.healthCache.clear();
    await this.getAllProviderHealth();
  }

  /**
   * Stop the degradation manager
   */
  stop(): void {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.stop();
    this.responseCache.clear();
    this.healthCache.clear();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private async computeProviderHealth(provider: string): Promise<ProviderHealth> {
    // Get circuit breaker status
    const breaker = this.circuitBreakerManager.getBreaker(provider);
    const circuitStatus = breaker.getStatus();

    // Get rate limiter status
    const rateLimiter = this.rateLimiterManager.getLimiter(provider);
    const rateLimitStatus = rateLimiter.getStatus();

    // Get quality stats
    const qualityScorer = getQualityScorer();
    let qualityStats: ModelQualityStats | null = null;
    try {
      qualityStats = qualityScorer.getModelStats(provider);
    } catch {
      // Provider may not have stats yet
    }

    // Compute health status
    const health: ProviderHealth = {
      provider,
      status: 'unknown',
      circuitState: circuitStatus.state,
      rateLimited: rateLimitStatus.isLimited,
      qualityScore: qualityStats?.acceptanceRate ?? 0.5,
      latencyP95: qualityStats?.averageResponseTime ?? 0,
      errorRate: circuitStatus.failureRate,
      lastSuccess: circuitStatus.lastSuccess,
      lastCheck: Date.now(),
    };

    // Determine status
    if (circuitStatus.state === 'open') {
      health.status = 'unhealthy';
    } else if (
      rateLimitStatus.isLimited ||
      health.errorRate > this.config.unhealthyErrorThreshold
    ) {
      health.status = 'unhealthy';
    } else if (
      health.qualityScore < this.config.degradedQualityThreshold ||
      health.latencyP95 > this.config.latencyThreshold
    ) {
      health.status = 'degraded';
    } else if (health.qualityScore >= this.config.healthyQualityThreshold) {
      health.status = 'healthy';
    } else {
      health.status = 'degraded';
    }

    return health;
  }

  private isProviderAvailable(health: ProviderHealth): boolean {
    return (
      health.circuitState !== 'open' &&
      !health.rateLimited &&
      health.status !== 'unhealthy'
    );
  }

  private getProviderDegradationLevel(health: ProviderHealth): DegradationLevel {
    if (health.status === 'healthy') return 'none';
    if (health.status === 'degraded') return 'reduced';
    return 'fallback';
  }

  private getRecommendations(health: ProviderHealth): string[] {
    const recommendations: string[] = [];

    if (health.status === 'degraded') {
      recommendations.push(`Quality below threshold for ${health.provider}`);
    }

    if (health.latencyP95 > this.config.latencyThreshold * 0.8) {
      recommendations.push(`High latency on ${health.provider}: ${health.latencyP95}ms`);
    }

    if (health.errorRate > 0.1) {
      recommendations.push(`Elevated error rate on ${health.provider}: ${(health.errorRate * 100).toFixed(1)}%`);
    }

    return recommendations;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.responseCache) {
      if (now - entry.timestamp > entry.ttlMs) {
        this.responseCache.delete(key);
      }
    }
  }

  private startRecoveryMonitor(): void {
    this.recoveryTimer = setInterval(() => {
      this.refreshHealth().catch(() => {
        // Ignore errors in background refresh
      });
    }, this.config.recoveryCheckIntervalMs);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let degradationManager: DegradationManager | null = null;

/**
 * Get the singleton degradation manager
 */
export function getDegradationManager(
  config?: Partial<DegradationConfig>
): DegradationManager {
  if (!degradationManager) {
    degradationManager = new DegradationManager(config);
  }
  return degradationManager;
}

/**
 * Initialize degradation manager with config
 */
export function initializeDegradation(
  config: Partial<DegradationConfig>
): DegradationManager {
  degradationManager?.stop();
  degradationManager = new DegradationManager(config);
  return degradationManager;
}

/**
 * Reset the singleton
 */
export function resetDegradation(): void {
  degradationManager?.stop();
  degradationManager?.reset();
  degradationManager = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get health status emoji
 */
function getHealthEmoji(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return '🟢';
    case 'degraded':
      return '🟡';
    case 'unhealthy':
      return '🔴';
    case 'unknown':
      return '⚪';
  }
}

/**
 * Get degradation level emoji
 */
function getDegradationEmoji(level: DegradationLevel): string {
  switch (level) {
    case 'none':
      return '✅';
    case 'reduced':
      return '⚠️';
    case 'fallback':
      return '🔄';
    case 'cached':
      return '📦';
    case 'offline':
      return '🔴';
  }
}

/**
 * Format provider health for display
 */
export function formatProviderHealth(health: ProviderHealth): string {
  const emoji = getHealthEmoji(health.status);
  const lines: string[] = [
    `${emoji} ${health.provider}: ${health.status.toUpperCase()}`,
    `  Circuit: ${health.circuitState}`,
    `  Rate Limited: ${health.rateLimited ? 'Yes' : 'No'}`,
    `  Quality: ${(health.qualityScore * 100).toFixed(1)}%`,
    `  Latency P95: ${health.latencyP95}ms`,
    `  Error Rate: ${(health.errorRate * 100).toFixed(1)}%`,
  ];

  return lines.join('\n');
}

/**
 * Format degradation decision for display
 */
export function formatDegradationDecision(decision: DegradationDecision): string {
  const emoji = getDegradationEmoji(decision.level);
  const lines: string[] = [
    `=== Degradation Status ===`,
    '',
    `${emoji} Level: ${decision.level.toUpperCase()}`,
    `Provider: ${decision.provider || 'NONE'}`,
    `Reason: ${decision.reason}`,
    `Service Available: ${decision.serviceAvailable ? 'Yes' : 'No'}`,
  ];

  if (decision.alternatives.length > 0) {
    lines.push(`Alternatives: ${decision.alternatives.join(', ')}`);
  }

  if (decision.recommendations.length > 0) {
    lines.push('', 'Recommendations:');
    decision.recommendations.forEach(r => lines.push(`  - ${r}`));
  }

  return lines.join('\n');
}

/**
 * Format all provider health
 */
export function formatAllProviderHealth(healths: ProviderHealth[]): string {
  if (healths.length === 0) {
    return 'No provider health data available.';
  }

  return healths.map(formatProviderHealth).join('\n\n');
}

/**
 * Get health summary
 */
export function getHealthSummary(healths: ProviderHealth[]): string {
  const healthy = healths.filter(h => h.status === 'healthy').length;
  const degraded = healths.filter(h => h.status === 'degraded').length;
  const unhealthy = healths.filter(h => h.status === 'unhealthy').length;

  return `Providers: 🟢 ${healthy} healthy | 🟡 ${degraded} degraded | 🔴 ${unhealthy} unhealthy`;
}
