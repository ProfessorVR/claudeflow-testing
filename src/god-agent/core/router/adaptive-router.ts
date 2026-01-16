/**
 * Adaptive Router
 *
 * Implements Phase 6.1: Adaptive Routing Based on Quality History
 *
 * Provides:
 * - Quality-weighted model selection
 * - Historical success rate tracking
 * - Time-decayed outcome weighting
 * - Automatic model ranking updates
 * - Integration with OutcomeTracker and QualityScorer
 */

import { randomUUID } from 'crypto';
import type {
  TaskType,
  Complexity,
  RiskLevel,
  RoutingDecision,
  TaskClassification,
  ProviderType,
  RouterEvent,
  RouterEventHandler,
} from './router-types.js';
import {
  CapabilityRouter,
  type CapabilityRouterConfig,
  type RouteOptions,
} from './capability-router.js';
import { getQualityScorer, type QualityScorer } from './quality-scorer.js';
import { getOutcomeTracker, type OutcomeTracker } from './outcome-tracker.js';

// ===== CONFIGURATION =====

/**
 * Configuration for adaptive routing
 */
export interface AdaptiveRouterConfig extends CapabilityRouterConfig {
  /** Enable adaptive routing */
  enabled?: boolean;
  /** Time decay factor (0-1, higher = faster decay) */
  timeDecayFactor?: number;
  /** Window size for recent outcomes (number of outcomes to consider) */
  historyWindow?: number;
  /** Minimum outcomes before using adaptive routing */
  minOutcomesForAdaptive?: number;
  /** Quality weight in routing (0-1, rest goes to default priority) */
  qualityWeight?: number;
  /** Success rate threshold below which to avoid a model */
  successRateThreshold?: number;
  /** Enable automatic learning from outcomes */
  autoLearn?: boolean;
}

const DEFAULT_ADAPTIVE_CONFIG = {
  enabled: true,
  timeDecayFactor: 0.1,
  historyWindow: 100,
  minOutcomesForAdaptive: 2,
  qualityWeight: 0.6,
  successRateThreshold: 0.5,
  autoLearn: true,
};

// ===== MODEL SCORE =====

/**
 * Detailed score breakdown for a model
 */
export interface ModelScore {
  /** Model ID */
  model: string;
  /** Provider type */
  provider: ProviderType;
  /** Composite quality score (0-1) */
  qualityScore: number;
  /** Historical success rate (0-1) */
  successRate: number;
  /** Time-decayed quality score (0-1) */
  decayedScore: number;
  /** Number of outcomes considered */
  outcomeCount: number;
  /** Time since last outcome (ms) */
  timeSinceLastOutcome: number | null;
  /** Whether this model has enough data */
  hasEnoughData: boolean;
  /** Score components for debugging */
  components: {
    rating: number;
    acceptance: number;
    tests: number;
    responseTime: number;
    decay: number;
  };
}

/**
 * Ranked model selection for adaptive routing
 */
export interface AdaptiveRanking {
  /** Ranked models (best first) */
  rankedModels: ModelScore[];
  /** Selected model */
  selected: string;
  /** Selection reason */
  reason: string;
  /** Whether adaptive routing was used */
  adaptiveUsed: boolean;
  /** Ranking timestamp */
  timestamp: Date;
}

// ===== ADAPTIVE ROUTER =====

/**
 * Adaptive router that learns from historical quality data
 */
export class AdaptiveRouter {
  private readonly baseRouter: CapabilityRouter;
  private readonly qualityScorer: QualityScorer;
  private readonly outcomeTracker: OutcomeTracker;
  private readonly config: Required<typeof DEFAULT_ADAPTIVE_CONFIG>;
  private readonly eventHandlers: Set<RouterEventHandler> = new Set();

  /** Cache for model scores (refreshed on each routing decision) */
  private modelScoreCache: Map<string, ModelScore> = new Map();
  private lastCacheRefresh: Date = new Date(0);

  constructor(
    config: AdaptiveRouterConfig,
    qualityScorer?: QualityScorer,
    outcomeTracker?: OutcomeTracker
  ) {
    this.baseRouter = new CapabilityRouter(config);
    this.qualityScorer = qualityScorer ?? getQualityScorer();
    this.outcomeTracker = outcomeTracker ?? getOutcomeTracker();

    this.config = {
      enabled: config.enabled ?? DEFAULT_ADAPTIVE_CONFIG.enabled,
      timeDecayFactor: config.timeDecayFactor ?? DEFAULT_ADAPTIVE_CONFIG.timeDecayFactor,
      historyWindow: config.historyWindow ?? DEFAULT_ADAPTIVE_CONFIG.historyWindow,
      minOutcomesForAdaptive: config.minOutcomesForAdaptive ?? DEFAULT_ADAPTIVE_CONFIG.minOutcomesForAdaptive,
      qualityWeight: config.qualityWeight ?? DEFAULT_ADAPTIVE_CONFIG.qualityWeight,
      successRateThreshold: config.successRateThreshold ?? DEFAULT_ADAPTIVE_CONFIG.successRateThreshold,
      autoLearn: config.autoLearn ?? DEFAULT_ADAPTIVE_CONFIG.autoLearn,
    };

    // Wire up auto-learning if enabled
    if (this.config.autoLearn) {
      this.setupAutoLearning();
    }
  }

  // ===== ROUTING =====

  /**
   * Route a task using adaptive quality-based selection
   */
  async route(prompt: string, options?: RouteOptions): Promise<RoutingDecision> {
    // If adaptive routing is disabled or there's a manual override, use base router
    if (!this.config.enabled || options?.modelOverride) {
      return this.baseRouter.route(prompt, options);
    }

    // Get classification for adaptive ranking
    const providers = this.baseRouter.getAllProviders();
    if (providers.length === 0) {
      return this.baseRouter.route(prompt, options);
    }

    // Get the base routing decision first
    const baseDecision = await this.baseRouter.route(prompt, options);

    // Calculate adaptive ranking
    const ranking = this.getAdaptiveRanking(
      baseDecision.classification.type,
      baseDecision.classification.complexity
    );

    // If no adaptive data, use base decision
    if (!ranking.adaptiveUsed) {
      return baseDecision;
    }

    // If adaptive routing suggests a different model, update the decision
    if (ranking.selected !== baseDecision.selectedModel) {
      const selectedProvider = providers.find(p => p.id === ranking.selected);

      if (selectedProvider) {
        const adaptiveDecision: RoutingDecision = {
          ...baseDecision,
          selectedModel: ranking.selected,
          selectedProvider: selectedProvider.provider,
          reason: `${ranking.reason} (adaptive routing, quality: ${this.getModelScore(ranking.selected)?.qualityScore.toFixed(2) ?? 'N/A'})`,
          fallbackChain: ranking.rankedModels
            .filter(m => m.model !== ranking.selected)
            .map(m => m.model),
        };

        this.emit({
          type: 'routing_decision',
          timestamp: new Date(),
          data: {
            decision: adaptiveDecision,
            adaptiveRanking: ranking,
            originalSelection: baseDecision.selectedModel,
          },
        });

        return adaptiveDecision;
      }
    }

    return baseDecision;
  }

  /**
   * Get adaptive model ranking for a task type and complexity
   */
  getAdaptiveRanking(taskType: TaskType, complexity: Complexity): AdaptiveRanking {
    this.refreshModelScores(taskType, complexity);

    const scores = Array.from(this.modelScoreCache.values())
      .filter(s => s.hasEnoughData)
      .sort((a, b) => b.decayedScore - a.decayedScore);

    // Check if we have enough data for adaptive routing
    const modelsWithData = scores.filter(s => s.outcomeCount >= this.config.minOutcomesForAdaptive);

    if (modelsWithData.length === 0) {
      return {
        rankedModels: scores,
        selected: scores[0]?.model ?? '',
        reason: 'Insufficient data for adaptive routing',
        adaptiveUsed: false,
        timestamp: new Date(),
      };
    }

    // Filter out models below success threshold
    const viableModels = modelsWithData.filter(
      s => s.successRate >= this.config.successRateThreshold
    );

    if (viableModels.length === 0) {
      // All models are below threshold - use best available
      const best = modelsWithData[0];
      return {
        rankedModels: modelsWithData,
        selected: best.model,
        reason: `Best available model (all below ${this.config.successRateThreshold * 100}% threshold)`,
        adaptiveUsed: true,
        timestamp: new Date(),
      };
    }

    const selected = viableModels[0];
    return {
      rankedModels: viableModels,
      selected: selected.model,
      reason: `Highest quality score (${(selected.decayedScore * 100).toFixed(1)}%)`,
      adaptiveUsed: true,
      timestamp: new Date(),
    };
  }

  /**
   * Get the current score for a specific model
   */
  getModelScore(modelId: string): ModelScore | undefined {
    return this.modelScoreCache.get(modelId);
  }

  /**
   * Get all model scores
   */
  getAllModelScores(): ModelScore[] {
    return Array.from(this.modelScoreCache.values());
  }

  /**
   * Get ranked models for display
   */
  getRankedModelsForTask(taskType: TaskType, complexity: Complexity): string[] {
    const ranking = this.getAdaptiveRanking(taskType, complexity);
    return ranking.rankedModels.map(m => m.model);
  }

  // ===== LEARNING =====

  /**
   * Record a routing outcome for learning
   */
  recordOutcome(
    decision: RoutingDecision,
    success: boolean,
    metrics?: {
      testsPass?: boolean;
      userAccepted?: boolean;
      rewritePercentage?: number;
      executionTimeMs?: number;
      tokensUsed?: number;
    }
  ): void {
    // Record in quality scorer
    this.qualityScorer.recordScore({
      model: decision.selectedModel,
      provider: decision.selectedProvider,
      taskType: decision.classification.type,
      complexity: decision.classification.complexity,
      responseTime: metrics?.executionTimeMs ?? 0,
      tokensUsed: metrics?.tokensUsed ?? 0,
      testsPass: metrics?.testsPass,
      userAccepted: metrics?.userAccepted ?? success,
    });

    // Record in outcome tracker
    this.outcomeTracker.record({
      taskPattern: this.generateTaskPattern(decision),
      prompt: decision.reason,
      riskAssessment: {
        riskLevel: decision.classification.complexity === 'complex' ? 'high' : 'medium',
        feedbackSpeed: 'fast',
        reversibility: 'easy',
        verificationMethod: 'tests',
        recommendedRoute: decision.selectedProvider === 'anthropic' ? 'expensive' : 'local',
        reason: `Adaptive routing decision for ${decision.classification.type}`,
        confidence: decision.classification.confidence,
        signals: decision.classification.signals,
      },
      routedTo: decision.selectedProvider === 'anthropic' ? 'claude' : 'local',
      actualModel: decision.selectedModel,
      status: success ? 'success' : 'failure',
      testsPassed: metrics?.testsPass ?? null,
      rewritePercentage: metrics?.rewritePercentage ?? 0,
      executionTimeMs: metrics?.executionTimeMs ?? 0,
    });

    // Invalidate cache
    this.lastCacheRefresh = new Date(0);
  }

  /**
   * Check if a model should be avoided for a task
   */
  shouldAvoidModel(modelId: string, taskType: TaskType): boolean {
    const score = this.modelScoreCache.get(modelId);
    if (!score || !score.hasEnoughData) {
      return false;
    }
    return score.successRate < this.config.successRateThreshold;
  }

  // ===== DELEGATION =====

  /**
   * Register a provider (delegates to base router)
   */
  registerProvider(provider: Parameters<CapabilityRouter['registerProvider']>[0]): void {
    this.baseRouter.registerProvider(provider);
  }

  /**
   * Get all providers (delegates to base router)
   */
  getAllProviders(): ReturnType<CapabilityRouter['getAllProviders']> {
    return this.baseRouter.getAllProviders();
  }

  /**
   * Set session override (delegates to base router)
   */
  setSessionOverride(modelId: string | null): void {
    this.baseRouter.setSessionOverride(modelId);
  }

  /**
   * Get available models (delegates to base router)
   */
  async getAvailableModels(classification: TaskClassification): Promise<string[]> {
    return this.baseRouter.getAvailableModels(classification);
  }

  // ===== EVENTS =====

  /**
   * Subscribe to router events
   */
  on(handler: RouterEventHandler): () => void {
    this.eventHandlers.add(handler);
    // Also subscribe to base router events
    const unsubBase = this.baseRouter.on(handler);
    return () => {
      this.eventHandlers.delete(handler);
      unsubBase();
    };
  }

  // ===== PRIVATE =====

  /**
   * Refresh model scores from quality and outcome data
   */
  private refreshModelScores(taskType: TaskType, complexity: Complexity): void {
    const cacheAge = Date.now() - this.lastCacheRefresh.getTime();
    if (cacheAge < 5000) {
      return; // Use cached scores if less than 5 seconds old
    }

    const providers = this.baseRouter.getAllProviders();
    this.modelScoreCache.clear();

    for (const provider of providers) {
      const score = this.calculateModelScore(provider.id, provider.provider, taskType, complexity);
      this.modelScoreCache.set(provider.id, score);
    }

    this.lastCacheRefresh = new Date();
  }

  /**
   * Calculate detailed score for a model
   */
  private calculateModelScore(
    modelId: string,
    providerType: ProviderType,
    taskType: TaskType,
    complexity: Complexity
  ): ModelScore {
    const qualityStats = this.qualityScorer.getModelStats(modelId);
    const outcomeStats = this.outcomeTracker.getPatternStats(
      this.generatePatternForModelTask(modelId, taskType)
    );

    // Get recent scores for time decay
    const recentScores = this.qualityScorer.getScoresForModel(modelId)
      .filter(s => s.taskType === taskType)
      .slice(-this.config.historyWindow);

    // Calculate components
    let ratingScore = 0.5; // Default neutral
    let acceptanceScore = 0.5;
    let testScore = 0.5;
    let responseTimeScore = 0.5;

    if (qualityStats) {
      // Rating (1-5 normalized to 0-1)
      if (qualityStats.averageRating !== null) {
        ratingScore = (qualityStats.averageRating - 1) / 4;
      }
      acceptanceScore = qualityStats.acceptanceRate;
      if (qualityStats.testPassRate !== null) {
        testScore = qualityStats.testPassRate;
      }
      // Response time (lower is better, cap at 30s)
      responseTimeScore = Math.max(0, 1 - qualityStats.averageResponseTime / 30000);
    }

    // Calculate base quality score
    const baseQuality =
      ratingScore * 0.3 +
      acceptanceScore * 0.3 +
      testScore * 0.25 +
      responseTimeScore * 0.15;

    // Calculate time decay
    const decayFactor = this.calculateTimeDecay(recentScores);

    // Calculate success rate from outcomes
    const successRate = outcomeStats?.successRate ?? 0.5;

    // Combined decayed score
    const decayedScore = baseQuality * decayFactor;

    // Determine time since last outcome
    let timeSinceLastOutcome: number | null = null;
    if (recentScores.length > 0) {
      const lastScore = recentScores[recentScores.length - 1];
      timeSinceLastOutcome = Date.now() - lastScore.timestamp.getTime();
    }

    return {
      model: modelId,
      provider: providerType,
      qualityScore: baseQuality,
      successRate,
      decayedScore,
      outcomeCount: recentScores.length,
      timeSinceLastOutcome,
      hasEnoughData: recentScores.length >= this.config.minOutcomesForAdaptive,
      components: {
        rating: ratingScore,
        acceptance: acceptanceScore,
        tests: testScore,
        responseTime: responseTimeScore,
        decay: decayFactor,
      },
    };
  }

  /**
   * Calculate time decay factor for recent scores
   */
  private calculateTimeDecay(
    scores: Array<{ timestamp: Date }>
  ): number {
    if (scores.length === 0) {
      return 1.0; // No decay if no data
    }

    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      const age = (now - score.timestamp.getTime()) / (24 * 60 * 60 * 1000); // Age in days
      const weight = Math.exp(-this.config.timeDecayFactor * age);
      weightedSum += weight;
      totalWeight += 1;
    }

    // Return average weight (1.0 = no decay, lower = more decay)
    return totalWeight > 0 ? weightedSum / totalWeight : 1.0;
  }

  /**
   * Generate task pattern for outcome tracking
   */
  private generateTaskPattern(decision: RoutingDecision): string {
    return `${decision.classification.type}:${decision.classification.complexity}`;
  }

  /**
   * Generate pattern for model+task combination
   */
  private generatePatternForModelTask(modelId: string, taskType: TaskType): string {
    return `${modelId}:${taskType}`;
  }

  /**
   * Set up automatic learning from routing events
   */
  private setupAutoLearning(): void {
    // Listen for quality events and update cache
    this.qualityScorer.on('quality_recorded', () => {
      this.lastCacheRefresh = new Date(0); // Invalidate cache
    });
  }

  /**
   * Emit a router event
   */
  private emit(event: RouterEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }
}

// ===== SINGLETON =====

let adaptiveRouterInstance: AdaptiveRouter | null = null;

/**
 * Get or create the singleton AdaptiveRouter instance
 */
export function getAdaptiveRouter(config?: AdaptiveRouterConfig): AdaptiveRouter {
  if (!adaptiveRouterInstance && config) {
    adaptiveRouterInstance = new AdaptiveRouter(config);
  }
  if (!adaptiveRouterInstance) {
    throw new Error('AdaptiveRouter not initialized. Call with config first.');
  }
  return adaptiveRouterInstance;
}

/**
 * Initialize the adaptive router with configuration
 */
export function initializeAdaptiveRouter(config: AdaptiveRouterConfig): AdaptiveRouter {
  adaptiveRouterInstance = new AdaptiveRouter(config);
  return adaptiveRouterInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetAdaptiveRouter(): void {
  adaptiveRouterInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format model score for display
 */
export function formatModelScore(score: ModelScore): string {
  const quality = (score.qualityScore * 100).toFixed(1);
  const success = (score.successRate * 100).toFixed(1);
  const decayed = (score.decayedScore * 100).toFixed(1);
  const status = score.hasEnoughData ? '' : ' (insufficient data)';

  return `${score.model}: Quality=${quality}% Success=${success}% Decayed=${decayed}%${status}`;
}

/**
 * Format adaptive ranking for display
 */
export function formatAdaptiveRanking(ranking: AdaptiveRanking): string {
  const lines = [
    `Selected: ${ranking.selected}`,
    `Reason: ${ranking.reason}`,
    `Adaptive Used: ${ranking.adaptiveUsed}`,
    '',
    'Ranked Models:',
    ...ranking.rankedModels.map((m, i) =>
      `  ${i + 1}. ${formatModelScore(m)}`
    ),
  ];
  return lines.join('\n');
}
