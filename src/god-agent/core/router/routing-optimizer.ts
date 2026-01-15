/**
 * Routing Optimizer
 *
 * Implements TIER-2.1: Intelligent Model Router - Phase 5.4
 *
 * Learns from routing outcomes to optimize future decisions:
 * - Analyzes pattern success rates
 * - Suggests routing rule changes
 * - Implements adaptive escalation
 * - Provides optimization recommendations
 */

import type { RouteRecommendation } from './risk-classifier.js';
import {
  OutcomeTracker,
  getOutcomeTracker,
  type PatternStats,
  type TrackerStats,
  type RoutingOutcome,
} from './outcome-tracker.js';

// ===== TYPES =====

/**
 * Suggestion priority
 */
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Type of routing rule change
 */
export type RuleChangeType =
  | 'escalate_to_claude'
  | 'add_review'
  | 'allow_local'
  | 'adjust_threshold'
  | 'add_pattern_rule';

/**
 * A suggested routing rule change
 */
export interface RoutingRuleSuggestion {
  /** Unique suggestion ID */
  id: string;
  /** Suggestion priority */
  priority: SuggestionPriority;
  /** Type of change */
  changeType: RuleChangeType;
  /** Task pattern this applies to */
  pattern: string;
  /** Current route for this pattern */
  currentRoute: RouteRecommendation;
  /** Suggested route */
  suggestedRoute: RouteRecommendation;
  /** Reason for suggestion */
  reason: string;
  /** Statistics backing this suggestion */
  stats: PatternStats;
  /** Expected improvement */
  expectedImprovement: string;
  /** Confidence in suggestion (0-1) */
  confidence: number;
}

/**
 * Optimization report
 */
export interface OptimizationReport {
  /** Report generation timestamp */
  timestamp: Date;
  /** Overall tracker stats */
  trackerStats: TrackerStats;
  /** Patterns performing well with local */
  wellPerformingPatterns: PatternStats[];
  /** Patterns needing escalation */
  poorPerformingPatterns: PatternStats[];
  /** Suggested rule changes */
  suggestions: RoutingRuleSuggestion[];
  /** Cost analysis */
  costAnalysis: CostAnalysis;
  /** Quality analysis */
  qualityAnalysis: QualityAnalysis;
}

/**
 * Cost analysis results
 */
export interface CostAnalysis {
  /** Total cost tracked */
  totalCost: number;
  /** Cost by route */
  costByRoute: Record<RouteRecommendation, number>;
  /** Average cost per outcome */
  avgCostPerOutcome: number;
  /** Potential savings with optimization */
  potentialSavings: number;
  /** Cost trend (positive = increasing) */
  costTrend: number;
}

/**
 * Quality analysis results
 */
export interface QualityAnalysis {
  /** Overall success rate */
  overallSuccessRate: number;
  /** Success rate by route */
  successRateByRoute: Record<RouteRecommendation, number>;
  /** Revert rate */
  revertRate: number;
  /** Average rewrite percentage */
  avgRewritePercentage: number;
  /** Quality trend (positive = improving) */
  qualityTrend: number;
}

/**
 * Configuration for the optimizer
 */
export interface RoutingOptimizerConfig {
  /** Outcome tracker instance */
  tracker?: OutcomeTracker;
  /** Minimum outcomes before suggesting changes */
  minOutcomesForSuggestion?: number;
  /** Success rate threshold for "well performing" */
  wellPerformingThreshold?: number;
  /** Success rate threshold for "poor performing" */
  poorPerformingThreshold?: number;
  /** Rewrite threshold for adding review */
  reviewRewriteThreshold?: number;
  /** Confidence threshold for suggestions */
  confidenceThreshold?: number;
  /** Maximum suggestions per report */
  maxSuggestions?: number;
}

// ===== ROUTING OPTIMIZER =====

/**
 * Analyzes outcomes and suggests routing optimizations
 */
export class RoutingOptimizer {
  private readonly config: Required<RoutingOptimizerConfig>;
  private readonly tracker: OutcomeTracker;
  private suggestionCounter = 0;

  constructor(config: RoutingOptimizerConfig = {}) {
    this.tracker = config.tracker ?? getOutcomeTracker();
    this.config = {
      tracker: this.tracker,
      minOutcomesForSuggestion: config.minOutcomesForSuggestion ?? 10,
      wellPerformingThreshold: config.wellPerformingThreshold ?? 0.85,
      poorPerformingThreshold: config.poorPerformingThreshold ?? 0.7,
      reviewRewriteThreshold: config.reviewRewriteThreshold ?? 0.3,
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      maxSuggestions: config.maxSuggestions ?? 10,
    };
  }

  /**
   * Get recommended route for a pattern based on historical data
   */
  getRecommendedRoute(pattern: string): RouteRecommendation | null {
    const stats = this.tracker.getPatternStats(pattern);
    if (!stats) return null;
    return stats.recommendedRoute;
  }

  /**
   * Check if pattern should use local model
   */
  canUseLocal(pattern: string): boolean {
    const stats = this.tracker.getPatternStats(pattern);
    if (!stats) return true; // Default to allowing local for new patterns

    return (
      stats.successRate >= this.config.poorPerformingThreshold &&
      stats.avgRewritePercentage < this.config.reviewRewriteThreshold
    );
  }

  /**
   * Check if pattern needs Claude review
   */
  needsReview(pattern: string): boolean {
    const stats = this.tracker.getPatternStats(pattern);
    if (!stats) return false;

    return (
      stats.avgRewritePercentage >= this.config.reviewRewriteThreshold &&
      stats.successRate >= this.config.poorPerformingThreshold
    );
  }

  /**
   * Check if pattern should always use Claude
   */
  requiresClaude(pattern: string): boolean {
    const stats = this.tracker.getPatternStats(pattern);
    if (!stats) return false;

    return stats.successRate < this.config.poorPerformingThreshold;
  }

  /**
   * Generate routing rule suggestions
   */
  suggestRuleChanges(): RoutingRuleSuggestion[] {
    const allStats = this.tracker.getAllPatternStats();
    const suggestions: RoutingRuleSuggestion[] = [];

    for (const stats of allStats) {
      if (stats.totalOutcomes < this.config.minOutcomesForSuggestion) {
        continue;
      }

      const suggestion = this.analyzePattern(stats);
      if (suggestion && suggestion.confidence >= this.config.confidenceThreshold) {
        suggestions.push(suggestion);
      }

      if (suggestions.length >= this.config.maxSuggestions) {
        break;
      }
    }

    // Sort by priority and confidence
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Get patterns performing well with local routing
   */
  getWellPerformingPatterns(): PatternStats[] {
    return this.tracker.getAllPatternStats().filter(
      (stats) =>
        stats.successRate >= this.config.wellPerformingThreshold &&
        stats.recommendedRoute === 'local'
    );
  }

  /**
   * Get patterns performing poorly
   */
  getPoorPerformingPatterns(): PatternStats[] {
    return this.tracker.getAllPatternStats().filter(
      (stats) => stats.successRate < this.config.poorPerformingThreshold
    );
  }

  /**
   * Generate a full optimization report
   */
  generateReport(): OptimizationReport {
    const trackerStats = this.tracker.getStats();
    const allPatternStats = this.tracker.getAllPatternStats();

    return {
      timestamp: new Date(),
      trackerStats,
      wellPerformingPatterns: this.getWellPerformingPatterns(),
      poorPerformingPatterns: this.getPoorPerformingPatterns(),
      suggestions: this.suggestRuleChanges(),
      costAnalysis: this.analyzeCosts(allPatternStats),
      qualityAnalysis: this.analyzeQuality(allPatternStats),
    };
  }

  /**
   * Get escalation candidates with details
   */
  getEscalationReport(): {
    candidates: PatternStats[];
    totalPatterns: number;
    escalationRate: number;
  } {
    const allStats = this.tracker.getAllPatternStats();
    const candidates = this.tracker.getEscalationCandidates();

    return {
      candidates,
      totalPatterns: allStats.length,
      escalationRate: allStats.length > 0 ? candidates.length / allStats.length : 0,
    };
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalPatterns: number;
    wellPerforming: number;
    needsReview: number;
    needsEscalation: number;
    suggestions: number;
  } {
    const allStats = this.tracker.getAllPatternStats();
    const wellPerforming = allStats.filter(
      (s) => s.successRate >= this.config.wellPerformingThreshold
    ).length;
    const needsReview = allStats.filter(
      (s) =>
        s.avgRewritePercentage >= this.config.reviewRewriteThreshold &&
        s.successRate >= this.config.poorPerformingThreshold
    ).length;
    const needsEscalation = allStats.filter(
      (s) => s.successRate < this.config.poorPerformingThreshold
    ).length;

    return {
      totalPatterns: allStats.length,
      wellPerforming,
      needsReview,
      needsEscalation,
      suggestions: this.suggestRuleChanges().length,
    };
  }

  // ===== PRIVATE METHODS =====

  /**
   * Analyze a pattern and generate suggestion if needed
   */
  private analyzePattern(stats: PatternStats): RoutingRuleSuggestion | null {
    // Pattern is failing frequently - suggest escalation
    if (stats.successRate < this.config.poorPerformingThreshold) {
      return this.createSuggestion({
        priority: stats.successRate < 0.5 ? 'critical' : 'high',
        changeType: 'escalate_to_claude',
        pattern: stats.pattern,
        currentRoute: stats.recommendedRoute,
        suggestedRoute: 'expensive',
        reason: `Low success rate: ${Math.round(stats.successRate * 100)}%`,
        stats,
        expectedImprovement: 'Higher success rate with Claude',
        confidence: this.calculateConfidence(stats, 'escalate'),
      });
    }

    // High rewrite rate but decent success - suggest adding review
    if (
      stats.avgRewritePercentage >= this.config.reviewRewriteThreshold &&
      stats.successRate >= this.config.poorPerformingThreshold &&
      stats.recommendedRoute === 'local'
    ) {
      return this.createSuggestion({
        priority: 'medium',
        changeType: 'add_review',
        pattern: stats.pattern,
        currentRoute: 'local',
        suggestedRoute: 'local_then_review',
        reason: `High rewrite rate: ${Math.round(stats.avgRewritePercentage * 100)}%`,
        stats,
        expectedImprovement: 'Catch issues before user sees them',
        confidence: this.calculateConfidence(stats, 'review'),
      });
    }

    // Pattern was escalated but now performs well - suggest allowing local
    if (
      stats.successRate >= this.config.wellPerformingThreshold &&
      stats.avgRewritePercentage < this.config.reviewRewriteThreshold &&
      stats.recommendedRoute === 'expensive'
    ) {
      return this.createSuggestion({
        priority: 'low',
        changeType: 'allow_local',
        pattern: stats.pattern,
        currentRoute: 'expensive',
        suggestedRoute: 'local',
        reason: `High success rate: ${Math.round(stats.successRate * 100)}%`,
        stats,
        expectedImprovement: 'Reduce costs while maintaining quality',
        confidence: this.calculateConfidence(stats, 'local'),
      });
    }

    return null;
  }

  /**
   * Calculate confidence for a suggestion
   */
  private calculateConfidence(
    stats: PatternStats,
    suggestionType: 'escalate' | 'review' | 'local'
  ): number {
    // Base confidence on sample size
    const sampleConfidence = Math.min(1, stats.totalOutcomes / 50);

    // Adjust based on how clear the signal is
    let signalStrength = 0;
    switch (suggestionType) {
      case 'escalate':
        signalStrength = 1 - stats.successRate;
        break;
      case 'review':
        signalStrength = stats.avgRewritePercentage;
        break;
      case 'local':
        signalStrength = stats.successRate;
        break;
    }

    // Penalize if there's a lot of variance (reverts)
    const revertPenalty = stats.revertCount / stats.totalOutcomes;

    return Math.max(0, Math.min(1, sampleConfidence * signalStrength * (1 - revertPenalty)));
  }

  /**
   * Create a suggestion with generated ID
   */
  private createSuggestion(
    input: Omit<RoutingRuleSuggestion, 'id'>
  ): RoutingRuleSuggestion {
    this.suggestionCounter++;
    return {
      id: `suggestion-${Date.now()}-${this.suggestionCounter}`,
      ...input,
    };
  }

  /**
   * Analyze costs across patterns
   */
  private analyzeCosts(allStats: PatternStats[]): CostAnalysis {
    const costByRoute: Record<RouteRecommendation, number> = {
      local: 0,
      expensive: 0,
      local_then_review: 0,
    };

    let totalCost = 0;
    let totalOutcomes = 0;

    for (const stats of allStats) {
      totalCost += stats.avgCost * stats.totalOutcomes;
      totalOutcomes += stats.totalOutcomes;
      costByRoute[stats.recommendedRoute] += stats.avgCost * stats.totalOutcomes;
    }

    // Estimate potential savings from optimization
    const escalationCandidates = this.getPoorPerformingPatterns();
    const potentialSavings = escalationCandidates.reduce((sum, stats) => {
      // If we escalate, we save the local cost but add Claude cost
      // Net savings would be from avoiding retries
      return sum + stats.avgCost * stats.failureCount * 0.5; // Rough estimate
    }, 0);

    return {
      totalCost,
      costByRoute,
      avgCostPerOutcome: totalOutcomes > 0 ? totalCost / totalOutcomes : 0,
      potentialSavings,
      costTrend: 0, // Would need time-series data to calculate
    };
  }

  /**
   * Analyze quality across patterns
   */
  private analyzeQuality(allStats: PatternStats[]): QualityAnalysis {
    const successRateByRoute: Record<RouteRecommendation, number> = {
      local: 0,
      expensive: 0,
      local_then_review: 0,
    };

    const countByRoute: Record<RouteRecommendation, number> = {
      local: 0,
      expensive: 0,
      local_then_review: 0,
    };

    let totalSuccess = 0;
    let totalOutcomes = 0;
    let totalReverts = 0;
    let totalRewritePercentage = 0;

    for (const stats of allStats) {
      totalSuccess += stats.successCount;
      totalOutcomes += stats.totalOutcomes;
      totalReverts += stats.revertCount;
      totalRewritePercentage += stats.avgRewritePercentage * stats.totalOutcomes;

      countByRoute[stats.recommendedRoute] += stats.totalOutcomes;
      successRateByRoute[stats.recommendedRoute] +=
        stats.successRate * stats.totalOutcomes;
    }

    // Calculate weighted success rates
    for (const route of Object.keys(successRateByRoute) as RouteRecommendation[]) {
      if (countByRoute[route] > 0) {
        successRateByRoute[route] /= countByRoute[route];
      }
    }

    return {
      overallSuccessRate: totalOutcomes > 0 ? totalSuccess / totalOutcomes : 0,
      successRateByRoute,
      revertRate: totalOutcomes > 0 ? totalReverts / totalOutcomes : 0,
      avgRewritePercentage: totalOutcomes > 0 ? totalRewritePercentage / totalOutcomes : 0,
      qualityTrend: 0, // Would need time-series data to calculate
    };
  }
}

// ===== SINGLETON =====

let optimizerInstance: RoutingOptimizer | null = null;

/**
 * Get or create the singleton RoutingOptimizer instance
 */
export function getRoutingOptimizer(
  config?: RoutingOptimizerConfig
): RoutingOptimizer {
  if (!optimizerInstance || config) {
    optimizerInstance = new RoutingOptimizer(config);
  }
  return optimizerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetRoutingOptimizer(): void {
  optimizerInstance = null;
}

/**
 * Initialize the optimizer with configuration
 */
export function initializeRoutingOptimizer(
  config: RoutingOptimizerConfig
): RoutingOptimizer {
  optimizerInstance = new RoutingOptimizer(config);
  return optimizerInstance;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get suggested route for a pattern
 */
export function getOptimizedRoute(pattern: string): RouteRecommendation | null {
  return getRoutingOptimizer().getRecommendedRoute(pattern);
}

/**
 * Get optimization suggestions
 */
export function getOptimizationSuggestions(): RoutingRuleSuggestion[] {
  return getRoutingOptimizer().suggestRuleChanges();
}

/**
 * Format suggestion for display
 */
export function formatSuggestion(suggestion: RoutingRuleSuggestion): string {
  const priorityIcon =
    suggestion.priority === 'critical'
      ? '🔴'
      : suggestion.priority === 'high'
        ? '🟠'
        : suggestion.priority === 'medium'
          ? '🟡'
          : '🟢';

  const confidence = Math.round(suggestion.confidence * 100);
  const currentRoute =
    suggestion.currentRoute === 'expensive'
      ? 'Claude'
      : suggestion.currentRoute === 'local_then_review'
        ? 'Local+Review'
        : 'Local';
  const suggestedRoute =
    suggestion.suggestedRoute === 'expensive'
      ? 'Claude'
      : suggestion.suggestedRoute === 'local_then_review'
        ? 'Local+Review'
        : 'Local';

  return `${priorityIcon} ${currentRoute} → ${suggestedRoute}: ${suggestion.reason} (${confidence}% confidence)`;
}

/**
 * Format optimization report for display
 */
export function formatReport(report: OptimizationReport): string {
  const lines = [
    '=== Routing Optimization Report ===',
    `Generated: ${report.timestamp.toISOString()}`,
    '',
    '--- Overview ---',
    `Total Outcomes: ${report.trackerStats.totalOutcomes}`,
    `Unique Patterns: ${report.trackerStats.uniquePatterns}`,
    `Overall Success Rate: ${Math.round(report.trackerStats.overallSuccessRate * 100)}%`,
    '',
    '--- Quality ---',
    `Success Rate: ${Math.round(report.qualityAnalysis.overallSuccessRate * 100)}%`,
    `Revert Rate: ${Math.round(report.qualityAnalysis.revertRate * 100)}%`,
    `Avg Rewrite: ${Math.round(report.qualityAnalysis.avgRewritePercentage * 100)}%`,
    '',
    '--- Costs ---',
    `Total: $${report.costAnalysis.totalCost.toFixed(2)}`,
    `Avg per Outcome: $${report.costAnalysis.avgCostPerOutcome.toFixed(4)}`,
    `Potential Savings: $${report.costAnalysis.potentialSavings.toFixed(2)}`,
    '',
    `--- Patterns ---`,
    `Well Performing: ${report.wellPerformingPatterns.length}`,
    `Poor Performing: ${report.poorPerformingPatterns.length}`,
    '',
    '--- Suggestions ---',
  ];

  if (report.suggestions.length === 0) {
    lines.push('No suggestions at this time.');
  } else {
    for (const suggestion of report.suggestions) {
      lines.push(formatSuggestion(suggestion));
    }
  }

  return lines.join('\n');
}

/**
 * Format summary for display
 */
export function formatSummary(summary: ReturnType<RoutingOptimizer['getSummary']>): string {
  return [
    `Patterns: ${summary.totalPatterns}`,
    `Well Performing: ${summary.wellPerforming}`,
    `Needs Review: ${summary.needsReview}`,
    `Needs Escalation: ${summary.needsEscalation}`,
    `Active Suggestions: ${summary.suggestions}`,
  ].join(' | ');
}
