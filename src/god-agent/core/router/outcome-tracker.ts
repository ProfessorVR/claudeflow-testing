/**
 * Outcome Tracker
 *
 * Implements TIER-2.1: Intelligent Model Router - Phase 5.4
 *
 * Tracks routing outcomes for learning and optimization:
 * - Records routing decisions and their results
 * - Tracks success rates by task pattern
 * - Monitors Claude rewrite percentages
 * - Detects patterns that need escalation
 */

import type { RiskAssessment, RouteRecommendation } from './risk-classifier.js';

// ===== TYPES =====

/**
 * Which model was used for routing
 */
export type RoutedTo = 'local' | 'claude' | 'local_then_review';

/**
 * Outcome status
 */
export type OutcomeStatus = 'success' | 'failure' | 'partial' | 'reverted';

/**
 * A recorded routing outcome
 */
export interface RoutingOutcome {
  /** Unique outcome ID */
  id: string;
  /** When the routing occurred */
  timestamp: Date;
  /** Task pattern hash for grouping similar tasks */
  taskPattern: string;
  /** Original prompt (truncated for storage) */
  promptSummary: string;
  /** Risk assessment that led to routing */
  riskAssessment: RiskAssessment;
  /** Where the task was routed */
  routedTo: RoutedTo;
  /** Actual model used */
  actualModel: string;

  // Outcome metrics
  /** Overall outcome status */
  status: OutcomeStatus;
  /** Whether tests passed (null if no tests) */
  testsPassed: boolean | null;
  /** Whether Claude significantly rewrote local output */
  claudeRewrote: boolean;
  /** Percentage of output that was changed (0-1) */
  rewritePercentage: number;
  /** Whether user reverted the changes */
  userReverted: boolean;
  /** Number of iterations needed */
  iterations: number;

  // Cost tracking
  /** Tokens used by local model */
  localTokens: number;
  /** Tokens used by Claude */
  claudeTokens: number;
  /** Total cost in dollars */
  totalCost: number;

  // Timing
  /** Total execution time in ms */
  executionTimeMs: number;
}

/**
 * Summary statistics for a task pattern
 */
export interface PatternStats {
  /** Task pattern hash */
  pattern: string;
  /** Total outcomes recorded */
  totalOutcomes: number;
  /** Number of successful outcomes */
  successCount: number;
  /** Number of failed outcomes */
  failureCount: number;
  /** Number of reverted outcomes */
  revertCount: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average rewrite percentage */
  avgRewritePercentage: number;
  /** Average cost per outcome */
  avgCost: number;
  /** Average execution time */
  avgExecutionTimeMs: number;
  /** Last outcome timestamp */
  lastOutcome: Date;
  /** Current recommended route */
  recommendedRoute: RouteRecommendation;
}

/**
 * Overall tracker statistics
 */
export interface TrackerStats {
  /** Total outcomes recorded */
  totalOutcomes: number;
  /** Outcomes by route */
  outcomesByRoute: Record<RoutedTo, number>;
  /** Overall success rate */
  overallSuccessRate: number;
  /** Total cost tracked */
  totalCost: number;
  /** Number of unique patterns */
  uniquePatterns: number;
  /** Patterns needing escalation */
  escalationCandidates: number;
  /** Oldest outcome timestamp */
  oldestOutcome: Date | null;
  /** Newest outcome timestamp */
  newestOutcome: Date | null;
}

/**
 * Options for recording an outcome
 */
export interface RecordOutcomeInput {
  /** Task pattern (will be hashed if not already) */
  taskPattern: string;
  /** Original prompt */
  prompt: string;
  /** Risk assessment */
  riskAssessment: RiskAssessment;
  /** Where routed */
  routedTo: RoutedTo;
  /** Model used */
  actualModel: string;
  /** Outcome status */
  status: OutcomeStatus;
  /** Test result */
  testsPassed?: boolean | null;
  /** Whether Claude rewrote */
  claudeRewrote?: boolean;
  /** Rewrite percentage */
  rewritePercentage?: number;
  /** Whether reverted */
  userReverted?: boolean;
  /** Iterations */
  iterations?: number;
  /** Local tokens */
  localTokens?: number;
  /** Claude tokens */
  claudeTokens?: number;
  /** Total cost */
  totalCost?: number;
  /** Execution time */
  executionTimeMs?: number;
}

/**
 * Query options for retrieving outcomes
 */
export interface OutcomeQuery {
  /** Filter by pattern */
  pattern?: string;
  /** Filter by route */
  routedTo?: RoutedTo;
  /** Filter by status */
  status?: OutcomeStatus;
  /** Filter by date range */
  since?: Date;
  /** Filter by date range */
  until?: Date;
  /** Maximum results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Configuration for outcome tracker
 */
export interface OutcomeTrackerConfig {
  /** Maximum outcomes to store in memory */
  maxOutcomes?: number;
  /** Maximum age for outcomes (ms) */
  maxAge?: number;
  /** Minimum outcomes before calculating stats */
  minOutcomesForStats?: number;
  /** Success rate threshold for escalation */
  escalationThreshold?: number;
  /** Rewrite percentage threshold for escalation */
  rewriteThreshold?: number;
  /** Whether to persist outcomes */
  persist?: boolean;
  /** Storage path for persistence */
  storagePath?: string;
}

// ===== OUTCOME TRACKER =====

/**
 * Tracks and analyzes routing outcomes
 */
export class OutcomeTracker {
  private readonly config: Required<OutcomeTrackerConfig>;
  private outcomes: RoutingOutcome[] = [];
  private patternCache: Map<string, PatternStats> = new Map();
  private idCounter = 0;

  constructor(config: OutcomeTrackerConfig = {}) {
    this.config = {
      maxOutcomes: config.maxOutcomes ?? 10000,
      maxAge: config.maxAge ?? 30 * 24 * 60 * 60 * 1000, // 30 days
      minOutcomesForStats: config.minOutcomesForStats ?? 5,
      escalationThreshold: config.escalationThreshold ?? 0.7,
      rewriteThreshold: config.rewriteThreshold ?? 0.5,
      persist: config.persist ?? false,
      storagePath: config.storagePath ?? '.god-agent/outcomes.json',
    };
  }

  /**
   * Record a new routing outcome
   */
  record(input: RecordOutcomeInput): RoutingOutcome {
    const outcome: RoutingOutcome = {
      id: this.generateId(),
      timestamp: new Date(),
      taskPattern: this.normalizePattern(input.taskPattern),
      promptSummary: this.truncatePrompt(input.prompt),
      riskAssessment: input.riskAssessment,
      routedTo: input.routedTo,
      actualModel: input.actualModel,
      status: input.status,
      testsPassed: input.testsPassed ?? null,
      claudeRewrote: input.claudeRewrote ?? false,
      rewritePercentage: input.rewritePercentage ?? 0,
      userReverted: input.userReverted ?? false,
      iterations: input.iterations ?? 1,
      localTokens: input.localTokens ?? 0,
      claudeTokens: input.claudeTokens ?? 0,
      totalCost: input.totalCost ?? 0,
      executionTimeMs: input.executionTimeMs ?? 0,
    };

    this.outcomes.push(outcome);
    this.invalidatePatternCache(outcome.taskPattern);
    this.pruneOldOutcomes();

    return outcome;
  }

  /**
   * Mark an outcome as reverted by user
   */
  markReverted(outcomeId: string): boolean {
    const outcome = this.outcomes.find((o) => o.id === outcomeId);
    if (!outcome) return false;

    outcome.userReverted = true;
    outcome.status = 'reverted';
    this.invalidatePatternCache(outcome.taskPattern);
    return true;
  }

  /**
   * Get an outcome by ID
   */
  getOutcome(id: string): RoutingOutcome | undefined {
    return this.outcomes.find((o) => o.id === id);
  }

  /**
   * Query outcomes
   */
  query(options: OutcomeQuery = {}): RoutingOutcome[] {
    let results = [...this.outcomes];

    if (options.pattern) {
      const pattern = this.normalizePattern(options.pattern);
      results = results.filter((o) => o.taskPattern === pattern);
    }

    if (options.routedTo) {
      results = results.filter((o) => o.routedTo === options.routedTo);
    }

    if (options.status) {
      results = results.filter((o) => o.status === options.status);
    }

    if (options.since) {
      results = results.filter((o) => o.timestamp >= options.since!);
    }

    if (options.until) {
      results = results.filter((o) => o.timestamp <= options.until!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? results.length;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get statistics for a specific pattern
   */
  getPatternStats(pattern: string): PatternStats | null {
    const normalizedPattern = this.normalizePattern(pattern);

    // Check cache
    const cached = this.patternCache.get(normalizedPattern);
    if (cached) return cached;

    // Calculate stats
    const outcomes = this.outcomes.filter((o) => o.taskPattern === normalizedPattern);

    if (outcomes.length < this.config.minOutcomesForStats) {
      return null;
    }

    const stats = this.calculatePatternStats(normalizedPattern, outcomes);
    this.patternCache.set(normalizedPattern, stats);
    return stats;
  }

  /**
   * Get all pattern statistics
   */
  getAllPatternStats(): PatternStats[] {
    const patterns = new Set(this.outcomes.map((o) => o.taskPattern));
    const stats: PatternStats[] = [];

    for (const pattern of patterns) {
      const patternStats = this.getPatternStats(pattern);
      if (patternStats) {
        stats.push(patternStats);
      }
    }

    return stats.sort((a, b) => b.totalOutcomes - a.totalOutcomes);
  }

  /**
   * Get overall tracker statistics
   */
  getStats(): TrackerStats {
    const outcomesByRoute: Record<RoutedTo, number> = {
      local: 0,
      claude: 0,
      local_then_review: 0,
    };

    let successCount = 0;
    let totalCost = 0;
    let oldestTimestamp: Date | null = null;
    let newestTimestamp: Date | null = null;

    for (const outcome of this.outcomes) {
      outcomesByRoute[outcome.routedTo]++;
      if (outcome.status === 'success') successCount++;
      totalCost += outcome.totalCost;

      if (!oldestTimestamp || outcome.timestamp < oldestTimestamp) {
        oldestTimestamp = outcome.timestamp;
      }
      if (!newestTimestamp || outcome.timestamp > newestTimestamp) {
        newestTimestamp = outcome.timestamp;
      }
    }

    const patterns = new Set(this.outcomes.map((o) => o.taskPattern));
    const escalationCandidates = this.getEscalationCandidates().length;

    return {
      totalOutcomes: this.outcomes.length,
      outcomesByRoute,
      overallSuccessRate:
        this.outcomes.length > 0 ? successCount / this.outcomes.length : 0,
      totalCost,
      uniquePatterns: patterns.size,
      escalationCandidates,
      oldestOutcome: oldestTimestamp,
      newestOutcome: newestTimestamp,
    };
  }

  /**
   * Get patterns that should be escalated to Claude
   */
  getEscalationCandidates(): PatternStats[] {
    return this.getAllPatternStats().filter((stats) => {
      // Low success rate
      if (stats.successRate < this.config.escalationThreshold) {
        return true;
      }
      // High rewrite percentage
      if (stats.avgRewritePercentage > this.config.rewriteThreshold) {
        return true;
      }
      return false;
    });
  }

  /**
   * Check if a pattern should be escalated
   */
  shouldEscalate(pattern: string): boolean {
    const stats = this.getPatternStats(pattern);
    if (!stats) return false;

    return (
      stats.successRate < this.config.escalationThreshold ||
      stats.avgRewritePercentage > this.config.rewriteThreshold
    );
  }

  /**
   * Get success rate for a pattern
   */
  getSuccessRate(pattern: string): number | null {
    const stats = this.getPatternStats(pattern);
    return stats?.successRate ?? null;
  }

  /**
   * Get recent outcomes
   */
  getRecentOutcomes(limit: number = 10): RoutingOutcome[] {
    return this.query({ limit });
  }

  /**
   * Clear all outcomes
   */
  clear(): void {
    this.outcomes = [];
    this.patternCache.clear();
  }

  /**
   * Get outcome count
   */
  get count(): number {
    return this.outcomes.length;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Generate unique ID
   */
  private generateId(): string {
    this.idCounter++;
    return `outcome-${Date.now()}-${this.idCounter}`;
  }

  /**
   * Normalize pattern for consistent matching
   */
  private normalizePattern(pattern: string): string {
    // If already looks like a hash, return as-is
    if (/^[a-f0-9]{8,}$/i.test(pattern)) {
      return pattern.toLowerCase();
    }

    // Simple hash function for patterns
    let hash = 0;
    const str = pattern.toLowerCase().trim();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Truncate prompt for storage
   */
  private truncatePrompt(prompt: string, maxLength: number = 200): string {
    if (prompt.length <= maxLength) return prompt;
    return prompt.slice(0, maxLength - 3) + '...';
  }

  /**
   * Invalidate pattern cache
   */
  private invalidatePatternCache(pattern: string): void {
    this.patternCache.delete(pattern);
  }

  /**
   * Prune old outcomes
   */
  private pruneOldOutcomes(): void {
    const now = Date.now();
    const maxAge = this.config.maxAge;

    // Remove outcomes older than maxAge
    this.outcomes = this.outcomes.filter(
      (o) => now - o.timestamp.getTime() < maxAge
    );

    // Limit to maxOutcomes
    if (this.outcomes.length > this.config.maxOutcomes) {
      this.outcomes = this.outcomes.slice(-this.config.maxOutcomes);
    }

    // Clear pattern cache as data changed
    this.patternCache.clear();
  }

  /**
   * Calculate statistics for a pattern
   */
  private calculatePatternStats(
    pattern: string,
    outcomes: RoutingOutcome[]
  ): PatternStats {
    let successCount = 0;
    let failureCount = 0;
    let revertCount = 0;
    let totalRewritePercentage = 0;
    let totalCost = 0;
    let totalExecutionTime = 0;
    let lastOutcome = outcomes[0].timestamp;

    for (const outcome of outcomes) {
      if (outcome.status === 'success') successCount++;
      else if (outcome.status === 'failure') failureCount++;
      if (outcome.userReverted) revertCount++;

      totalRewritePercentage += outcome.rewritePercentage;
      totalCost += outcome.totalCost;
      totalExecutionTime += outcome.executionTimeMs;

      if (outcome.timestamp > lastOutcome) {
        lastOutcome = outcome.timestamp;
      }
    }

    const total = outcomes.length;
    const successRate = successCount / total;
    const avgRewritePercentage = totalRewritePercentage / total;

    // Determine recommended route based on stats
    let recommendedRoute: RouteRecommendation = 'local';
    if (successRate < this.config.escalationThreshold) {
      recommendedRoute = 'expensive';
    } else if (avgRewritePercentage > this.config.rewriteThreshold) {
      recommendedRoute = 'local_then_review';
    }

    return {
      pattern,
      totalOutcomes: total,
      successCount,
      failureCount,
      revertCount,
      successRate,
      avgRewritePercentage,
      avgCost: totalCost / total,
      avgExecutionTimeMs: totalExecutionTime / total,
      lastOutcome,
      recommendedRoute,
    };
  }
}

// ===== SINGLETON =====

let trackerInstance: OutcomeTracker | null = null;

/**
 * Get or create the singleton OutcomeTracker instance
 */
export function getOutcomeTracker(config?: OutcomeTrackerConfig): OutcomeTracker {
  if (!trackerInstance || config) {
    trackerInstance = new OutcomeTracker(config);
  }
  return trackerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetOutcomeTracker(): void {
  trackerInstance = null;
}

/**
 * Initialize the tracker with configuration
 */
export function initializeOutcomeTracker(config: OutcomeTrackerConfig): OutcomeTracker {
  trackerInstance = new OutcomeTracker(config);
  return trackerInstance;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Record an outcome using the singleton
 */
export function recordOutcome(input: RecordOutcomeInput): RoutingOutcome {
  return getOutcomeTracker().record(input);
}

/**
 * Check if pattern should be escalated
 */
export function shouldEscalatePattern(pattern: string): boolean {
  return getOutcomeTracker().shouldEscalate(pattern);
}

/**
 * Get success rate for pattern
 */
export function getPatternSuccessRate(pattern: string): number | null {
  return getOutcomeTracker().getSuccessRate(pattern);
}

/**
 * Format outcome for display
 */
export function formatOutcome(outcome: RoutingOutcome): string {
  const status = outcome.status === 'success' ? '✓' : outcome.status === 'failure' ? '✗' : '⟲';
  const route = outcome.routedTo === 'claude' ? 'Claude' : outcome.routedTo === 'local' ? 'Local' : 'Local→Review';
  const cost = outcome.totalCost > 0 ? ` ($${outcome.totalCost.toFixed(4)})` : '';

  return `${status} ${route}: ${outcome.promptSummary.slice(0, 50)}...${cost}`;
}

/**
 * Format pattern stats for display
 */
export function formatPatternStats(stats: PatternStats): string {
  const successPct = Math.round(stats.successRate * 100);
  const rewritePct = Math.round(stats.avgRewritePercentage * 100);
  const route = stats.recommendedRoute === 'expensive' ? 'Claude' :
                stats.recommendedRoute === 'local_then_review' ? 'Local+Review' : 'Local';

  return `Pattern ${stats.pattern}: ${successPct}% success, ${rewritePct}% rewrite avg → ${route} (${stats.totalOutcomes} samples)`;
}

/**
 * Format tracker stats for display
 */
export function formatTrackerStats(stats: TrackerStats): string {
  const lines = [
    `Total Outcomes: ${stats.totalOutcomes}`,
    `Success Rate: ${Math.round(stats.overallSuccessRate * 100)}%`,
    `Unique Patterns: ${stats.uniquePatterns}`,
    `Escalation Candidates: ${stats.escalationCandidates}`,
    `Total Cost: $${stats.totalCost.toFixed(2)}`,
    `Routes: Local=${stats.outcomesByRoute.local}, Claude=${stats.outcomesByRoute.claude}, Review=${stats.outcomesByRoute.local_then_review}`,
  ];
  return lines.join('\n');
}
