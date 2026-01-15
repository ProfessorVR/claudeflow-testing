/**
 * Quality Scorer
 *
 * Implements TIER-2.1: Intelligent Model Router - Quality Tracking Layer
 *
 * Provides:
 * - Per-response quality tracking
 * - Model quality statistics
 * - Adaptive routing recommendations
 * - Quality-based model ranking
 */

import { randomUUID } from 'crypto';
import type {
  ProviderType,
  TaskType,
  Complexity,
  QualityScore,
  ModelQualityStats,
  RouterEvent,
  RouterEventHandler,
  RouterEventType,
} from './router-types.js';

// ===== QUALITY SCORER CONFIGURATION =====

/**
 * Configuration for quality scorer
 */
export interface QualityScorerConfig {
  /** Whether quality scoring is enabled */
  enabled: boolean;
  /** Minimum samples required for statistics */
  minSamplesForStats: number;
  /** Maximum scores to keep in memory */
  maxScores: number;
  /** Weight for user rating in composite score */
  ratingWeight: number;
  /** Weight for acceptance rate in composite score */
  acceptanceWeight: number;
  /** Weight for test pass rate in composite score */
  testPassWeight: number;
  /** Weight for response time (inverse) in composite score */
  responseTimeWeight: number;
}

const DEFAULT_CONFIG: Required<QualityScorerConfig> = {
  enabled: true,
  minSamplesForStats: 5,
  maxScores: 10000,
  ratingWeight: 0.3,
  acceptanceWeight: 0.3,
  testPassWeight: 0.25,
  responseTimeWeight: 0.15,
};

// ===== QUALITY INPUT =====

/**
 * Input for recording a quality score
 */
export interface QualityScoreInput {
  /** Model used */
  model: string;
  /** Provider type */
  provider: ProviderType;
  /** Task type */
  taskType: TaskType;
  /** Task complexity */
  complexity: Complexity;
  /** Response time in ms */
  responseTime: number;
  /** Tokens used */
  tokensUsed: number;
  /** User rating (optional) */
  userRating?: 1 | 2 | 3 | 4 | 5;
  /** Whether user accepted the response */
  userAccepted?: boolean;
  /** Whether user reverted the changes */
  userReverted?: boolean;
  /** Whether tests pass (for code tasks) */
  testsPass?: boolean;
  /** Number of lint errors introduced */
  lintErrors?: number;
  /** Build success status */
  buildSuccess?: boolean;
}

// ===== QUALITY SCORER =====

/**
 * Quality scorer for tracking model response quality
 */
export class QualityScorer {
  private readonly config: Required<QualityScorerConfig>;
  private scores: QualityScore[] = [];
  private eventHandlers: Map<RouterEventType, RouterEventHandler[]> = new Map();

  constructor(config: Partial<QualityScorerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===== CONFIGURATION =====

  /**
   * Check if quality scoring is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the minimum samples required for statistics
   */
  getMinSamplesForStats(): number {
    return this.config.minSamplesForStats;
  }

  // ===== RECORDING =====

  /**
   * Record a quality score
   */
  recordScore(input: QualityScoreInput): QualityScore {
    const score: QualityScore = {
      id: randomUUID(),
      timestamp: new Date(),
      model: input.model,
      provider: input.provider,
      taskType: input.taskType,
      complexity: input.complexity,
      responseTime: input.responseTime,
      tokensUsed: input.tokensUsed,
      userRating: input.userRating ?? null,
      userAccepted: input.userAccepted ?? true,
      userReverted: input.userReverted ?? false,
      testsPass: input.testsPass ?? null,
      lintErrors: input.lintErrors ?? null,
      buildSuccess: input.buildSuccess ?? null,
    };

    this.scores.push(score);

    // Trim old scores if over limit
    if (this.scores.length > this.config.maxScores) {
      this.scores = this.scores.slice(-this.config.maxScores);
    }

    // Emit event
    this.emitEvent({
      type: 'quality_recorded',
      timestamp: new Date(),
      data: { scoreId: score.id, model: score.model, provider: score.provider },
    });

    return score;
  }

  /**
   * Update a score with additional data (e.g., user rating after the fact)
   */
  updateScore(
    scoreId: string,
    updates: Partial<Pick<QualityScore, 'userRating' | 'userAccepted' | 'userReverted' | 'testsPass' | 'lintErrors' | 'buildSuccess'>>
  ): QualityScore | null {
    const score = this.scores.find(s => s.id === scoreId);
    if (!score) return null;

    if (updates.userRating !== undefined) score.userRating = updates.userRating;
    if (updates.userAccepted !== undefined) score.userAccepted = updates.userAccepted;
    if (updates.userReverted !== undefined) score.userReverted = updates.userReverted;
    if (updates.testsPass !== undefined) score.testsPass = updates.testsPass;
    if (updates.lintErrors !== undefined) score.lintErrors = updates.lintErrors;
    if (updates.buildSuccess !== undefined) score.buildSuccess = updates.buildSuccess;

    return score;
  }

  /**
   * Get a specific score by ID
   */
  getScore(id: string): QualityScore | undefined {
    return this.scores.find(s => s.id === id);
  }

  /**
   * Get all scores
   */
  getAllScores(): QualityScore[] {
    return [...this.scores];
  }

  /**
   * Get scores for a specific model
   */
  getScoresForModel(model: string): QualityScore[] {
    return this.scores.filter(s => s.model === model);
  }

  /**
   * Get recent scores
   */
  getRecentScores(count: number = 100): QualityScore[] {
    return this.scores.slice(-count);
  }

  /**
   * Clear all scores
   */
  clear(): void {
    this.scores = [];
  }

  // ===== STATISTICS =====

  /**
   * Get quality statistics for a model
   */
  getModelStats(model: string): ModelQualityStats | null {
    const modelScores = this.getScoresForModel(model);

    if (modelScores.length < this.config.minSamplesForStats) {
      return null;
    }

    // Get provider from first score
    const provider = modelScores[0].provider;

    // Calculate overall stats
    const ratings = modelScores.filter(s => s.userRating !== null).map(s => s.userRating as number);
    const averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

    const acceptanceRate = modelScores.filter(s => s.userAccepted).length / modelScores.length;
    const revertRate = modelScores.filter(s => s.userReverted).length / modelScores.length;

    const testResults = modelScores.filter(s => s.testsPass !== null);
    const testPassRate = testResults.length > 0
      ? testResults.filter(s => s.testsPass).length / testResults.length
      : null;

    const averageResponseTime = modelScores.reduce((sum, s) => sum + s.responseTime, 0) / modelScores.length;

    // Calculate stats by task type
    const byTaskType: ModelQualityStats['byTaskType'] = {} as ModelQualityStats['byTaskType'];
    const taskTypes: TaskType[] = ['code_edit', 'reasoning', 'writing', 'refactor', 'research', 'debug', 'test', 'unknown'];

    for (const taskType of taskTypes) {
      const taskScores = modelScores.filter(s => s.taskType === taskType);
      if (taskScores.length > 0) {
        const taskRatings = taskScores.filter(s => s.userRating !== null).map(s => s.userRating as number);
        byTaskType[taskType] = {
          sampleCount: taskScores.length,
          averageRating: taskRatings.length > 0
            ? taskRatings.reduce((a, b) => a + b, 0) / taskRatings.length
            : null,
          acceptanceRate: taskScores.filter(s => s.userAccepted).length / taskScores.length,
        };
      }
    }

    // Calculate stats by complexity
    const byComplexity: ModelQualityStats['byComplexity'] = {} as ModelQualityStats['byComplexity'];
    const complexities: Complexity[] = ['simple', 'medium', 'complex'];

    for (const complexity of complexities) {
      const complexityScores = modelScores.filter(s => s.complexity === complexity);
      if (complexityScores.length > 0) {
        const complexityRatings = complexityScores.filter(s => s.userRating !== null).map(s => s.userRating as number);
        byComplexity[complexity] = {
          sampleCount: complexityScores.length,
          averageRating: complexityRatings.length > 0
            ? complexityRatings.reduce((a, b) => a + b, 0) / complexityRatings.length
            : null,
          acceptanceRate: complexityScores.filter(s => s.userAccepted).length / complexityScores.length,
        };
      }
    }

    return {
      model,
      provider,
      sampleCount: modelScores.length,
      averageRating,
      acceptanceRate,
      revertRate,
      testPassRate,
      averageResponseTime,
      byTaskType,
      byComplexity,
    };
  }

  /**
   * Get all model statistics
   */
  getAllModelStats(): Map<string, ModelQualityStats> {
    const models = new Set(this.scores.map(s => s.model));
    const statsMap = new Map<string, ModelQualityStats>();

    for (const model of models) {
      const stats = this.getModelStats(model);
      if (stats) {
        statsMap.set(model, stats);
      }
    }

    return statsMap;
  }

  /**
   * Get ranked models by quality for a specific task type
   */
  getRankedModels(taskType?: TaskType, complexity?: Complexity): string[] {
    const allStats = this.getAllModelStats();
    const modelScores: Array<{ model: string; compositeScore: number }> = [];

    for (const [model, stats] of allStats) {
      const compositeScore = this.calculateCompositeScore(stats, taskType, complexity);
      modelScores.push({ model, compositeScore });
    }

    // Sort by composite score (higher is better)
    modelScores.sort((a, b) => b.compositeScore - a.compositeScore);

    return modelScores.map(m => m.model);
  }

  /**
   * Calculate a composite quality score for a model
   */
  calculateCompositeScore(
    stats: ModelQualityStats,
    taskType?: TaskType,
    complexity?: Complexity
  ): number {
    let ratingScore = 0;
    let acceptanceScore = 0;
    let testScore = 0;
    let responseTimeScore = 0;

    // Get task-specific stats if available
    const taskStats = taskType && stats.byTaskType[taskType];
    const complexityStats = complexity && stats.byComplexity[complexity];

    // Rating score (0-1, normalized from 1-5)
    const rating = taskStats?.averageRating ?? stats.averageRating;
    if (rating !== null) {
      ratingScore = (rating - 1) / 4; // Normalize 1-5 to 0-1
    }

    // Acceptance score (0-1)
    acceptanceScore = taskStats?.acceptanceRate ?? stats.acceptanceRate;

    // Test pass score (0-1)
    if (stats.testPassRate !== null) {
      testScore = stats.testPassRate;
    }

    // Response time score (0-1, inverse - faster is better)
    // Assume 30 seconds is the max reasonable response time
    const maxResponseTime = 30000;
    responseTimeScore = Math.max(0, 1 - (stats.averageResponseTime / maxResponseTime));

    // Apply complexity penalty if stats show weakness at this complexity
    let complexityPenalty = 0;
    if (complexityStats && complexityStats.acceptanceRate < 0.5) {
      complexityPenalty = 0.2;
    }

    // Calculate weighted composite
    const composite =
      (ratingScore * this.config.ratingWeight) +
      (acceptanceScore * this.config.acceptanceWeight) +
      (testScore * this.config.testPassWeight) +
      (responseTimeScore * this.config.responseTimeWeight) -
      complexityPenalty;

    return Math.max(0, Math.min(1, composite));
  }

  /**
   * Get recommended model for a task
   */
  getRecommendedModel(taskType: TaskType, complexity: Complexity): string | null {
    const ranked = this.getRankedModels(taskType, complexity);
    return ranked[0] ?? null;
  }

  /**
   * Check if a model is performing well
   */
  isModelPerformingWell(model: string, threshold: number = 0.6): boolean {
    const stats = this.getModelStats(model);
    if (!stats) return true; // Assume good if not enough data

    const composite = this.calculateCompositeScore(stats);
    return composite >= threshold;
  }

  /**
   * Get models that are underperforming
   */
  getUnderperformingModels(threshold: number = 0.4): string[] {
    const allStats = this.getAllModelStats();
    const underperforming: string[] = [];

    for (const [model, stats] of allStats) {
      const composite = this.calculateCompositeScore(stats);
      if (composite < threshold) {
        underperforming.push(model);
      }
    }

    return underperforming;
  }

  // ===== EVENTS =====

  /**
   * Register an event handler
   */
  on(event: RouterEventType, handler: RouterEventHandler): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  /**
   * Remove an event handler
   */
  off(event: RouterEventType, handler: RouterEventHandler): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  private emitEvent(event: RouterEvent): void {
    const handlers = this.eventHandlers.get(event.type) ?? [];
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  // ===== REPORTING =====

  /**
   * Format quality report as string
   */
  formatReport(): string {
    const allStats = this.getAllModelStats();

    const lines = [
      '=== Quality Report ===',
      '',
      `Total Samples: ${this.scores.length}`,
      '',
    ];

    if (allStats.size === 0) {
      lines.push('No model statistics available (need more samples).');
      return lines.join('\n');
    }

    for (const [model, stats] of allStats) {
      const composite = this.calculateCompositeScore(stats);
      lines.push(`--- ${model} ---`);
      lines.push(`  Provider: ${stats.provider}`);
      lines.push(`  Samples: ${stats.sampleCount}`);
      lines.push(`  Average Rating: ${stats.averageRating?.toFixed(2) ?? 'N/A'}`);
      lines.push(`  Acceptance Rate: ${(stats.acceptanceRate * 100).toFixed(1)}%`);
      lines.push(`  Revert Rate: ${(stats.revertRate * 100).toFixed(1)}%`);
      lines.push(`  Test Pass Rate: ${stats.testPassRate !== null ? (stats.testPassRate * 100).toFixed(1) + '%' : 'N/A'}`);
      lines.push(`  Avg Response Time: ${stats.averageResponseTime.toFixed(0)}ms`);
      lines.push(`  Composite Score: ${(composite * 100).toFixed(1)}%`);
      lines.push('');
    }

    // Rankings
    lines.push('--- Model Rankings ---');
    const ranked = this.getRankedModels();
    ranked.forEach((model, index) => {
      lines.push(`  ${index + 1}. ${model}`);
    });

    return lines.join('\n');
  }

  // ===== EXPORT/IMPORT =====

  /**
   * Export scores to JSON
   */
  exportToJson(): string {
    return JSON.stringify(this.scores, null, 2);
  }

  /**
   * Import scores from JSON
   */
  importFromJson(json: string): number {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) {
      throw new Error('Invalid JSON format: expected array');
    }

    let imported = 0;
    for (const item of data) {
      if (item.id && item.timestamp && item.model) {
        // Ensure timestamp is a Date
        item.timestamp = new Date(item.timestamp);
        this.scores.push(item as QualityScore);
        imported++;
      }
    }

    return imported;
  }
}

// ===== SINGLETON INSTANCE =====

let scorerInstance: QualityScorer | null = null;

/**
 * Get the singleton quality scorer instance
 */
export function getQualityScorer(config?: Partial<QualityScorerConfig>): QualityScorer {
  if (!scorerInstance) {
    scorerInstance = new QualityScorer(config);
  }
  return scorerInstance;
}

/**
 * Initialize the quality scorer with config
 */
export function initializeQualityScorer(config: Partial<QualityScorerConfig>): QualityScorer {
  scorerInstance = new QualityScorer(config);
  return scorerInstance;
}

/**
 * Reset the quality scorer singleton
 */
export function resetQualityScorer(): void {
  scorerInstance = null;
}
