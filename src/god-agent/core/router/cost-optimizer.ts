/**
 * Cost Optimizer
 *
 * Implements Phase 6.3: Cost Optimization Suggestions
 *
 * Provides:
 * - Cost-quality analysis per model per task type
 * - Pareto frontier calculation
 * - Dominated model identification
 * - Switch recommendations with ROI
 * - Projected savings calculation
 */

import type {
  TaskType,
  Complexity,
  ProviderType,
} from './router-types.js';
import { CostTracker, getCostTracker } from './cost-tracker.js';
import { QualityScorer, getQualityScorer } from './quality-scorer.js';

// ===== TYPES =====

/**
 * Cost-quality data point for a model
 */
export interface ModelCostQuality {
  /** Model ID */
  model: string;
  /** Provider type */
  provider: ProviderType;
  /** Task type */
  taskType: TaskType;
  /** Complexity level */
  complexity?: Complexity;
  /** Average cost per request in USD */
  avgCost: number;
  /** Average quality score (0-1) */
  avgQuality: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Number of samples */
  sampleCount: number;
  /** Average response time in ms */
  avgLatency: number;
  /** Cost per quality point (lower is better) */
  costEfficiency: number;
}

/**
 * A point on the Pareto frontier
 */
export interface ParetoPoint extends ModelCostQuality {
  /** Whether this point is on the Pareto frontier */
  isPareto: boolean;
  /** Models dominated by this one */
  dominates: string[];
}

/**
 * Recommendation for switching models
 */
export interface SwitchRecommendation {
  /** Unique ID */
  id: string;
  /** Priority (P0 = highest) */
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  /** Task type this applies to */
  taskType: TaskType;
  /** Complexity (optional) */
  complexity?: Complexity;
  /** Current model being used */
  fromModel: string;
  /** Recommended model to switch to */
  toModel: string;
  /** Reason for recommendation */
  reason: string;
  /** Expected monthly cost savings */
  monthlySavings: number;
  /** Quality impact (positive = improvement) */
  qualityImpact: number;
  /** Latency impact (negative = faster) */
  latencyImpact: number;
  /** Confidence in recommendation (0-1) */
  confidence: number;
  /** ROI percentage */
  roi: number;
  /** Supporting statistics */
  stats: {
    fromCost: number;
    toCost: number;
    fromQuality: number;
    toQuality: number;
    sampleCount: number;
  };
}

/**
 * Pareto analysis results
 */
export interface ParetoAnalysis {
  /** All models analyzed */
  allModels: ParetoPoint[];
  /** Models on the Pareto frontier */
  paretoFrontier: ParetoPoint[];
  /** Dominated models */
  dominatedModels: ParetoPoint[];
  /** Best value model (highest quality/cost ratio) */
  bestValue: ParetoPoint | null;
  /** Highest quality model */
  highestQuality: ParetoPoint | null;
  /** Lowest cost model */
  lowestCost: ParetoPoint | null;
}

/**
 * Cost optimization report
 */
export interface CostOptimizationReport {
  /** Report generation timestamp */
  timestamp: Date;
  /** Time period analyzed */
  periodDays: number;
  /** Total current monthly cost */
  currentMonthlyCost: number;
  /** Projected monthly cost after optimizations */
  projectedMonthlyCost: number;
  /** Total potential savings */
  totalPotentialSavings: number;
  /** All recommendations */
  recommendations: SwitchRecommendation[];
  /** Pareto analysis by task type */
  paretoByTaskType: Map<TaskType, ParetoAnalysis>;
  /** Summary statistics */
  summary: {
    totalModels: number;
    paretoModels: number;
    dominatedModels: number;
    recommendationCount: number;
    avgRoi: number;
  };
}

/**
 * Configuration for the cost optimizer
 */
export interface CostOptimizerConfig {
  /** Cost tracker instance */
  costTracker?: CostTracker;
  /** Quality scorer instance */
  qualityScorer?: QualityScorer;
  /** Minimum samples for recommendations */
  minSamplesForRecommendation?: number;
  /** Minimum monthly savings for P0 recommendation */
  p0SavingsThreshold?: number;
  /** Minimum quality threshold for recommendations */
  minQualityThreshold?: number;
  /** Maximum quality loss tolerance */
  maxQualityLossTolerance?: number;
  /** Average requests per month for projections */
  avgRequestsPerMonth?: number;
  /** Enable dominated model detection */
  detectDominatedModels?: boolean;
}

const DEFAULT_CONFIG: Required<CostOptimizerConfig> = {
  costTracker: undefined as any, // Will be set in constructor
  qualityScorer: undefined as any, // Will be set in constructor
  minSamplesForRecommendation: 10,
  p0SavingsThreshold: 50, // $50/month for P0
  minQualityThreshold: 0.7,
  maxQualityLossTolerance: 0.05, // 5% quality loss max
  avgRequestsPerMonth: 1000,
  detectDominatedModels: true,
};

// ===== COST OPTIMIZER =====

/**
 * Analyzes costs and recommends optimizations
 */
export class CostOptimizer {
  private readonly config: Required<CostOptimizerConfig>;
  private readonly costTracker: CostTracker;
  private readonly qualityScorer: QualityScorer;
  private recommendationCounter = 0;

  constructor(config: CostOptimizerConfig = {}) {
    this.costTracker = config.costTracker ?? getCostTracker();
    this.qualityScorer = config.qualityScorer ?? getQualityScorer();
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      costTracker: this.costTracker,
      qualityScorer: this.qualityScorer,
    };
  }

  // ===== COST-QUALITY ANALYSIS =====

  /**
   * Get cost-quality data for all models
   */
  getCostQualityData(taskType?: TaskType): ModelCostQuality[] {
    const costRecords = this.costTracker.getAllRecords();
    const qualityScores = this.qualityScorer.getAllScores();

    // Group by model and task type
    const dataByKey = new Map<string, {
      costs: number[];
      qualities: number[];
      latencies: number[];
      successes: number[];
      model: string;
      provider: ProviderType;
      taskType: TaskType;
    }>();

    // Process cost records
    for (const record of costRecords) {
      if (taskType && record.taskType !== taskType) continue;

      const key = `${record.model}:${record.taskType}`;
      const data = dataByKey.get(key) ?? {
        costs: [],
        qualities: [],
        latencies: [],
        successes: [],
        model: record.model,
        provider: record.provider,
        taskType: record.taskType,
      };

      data.costs.push(record.cost.totalCost);
      dataByKey.set(key, data);
    }

    // Process quality scores
    for (const score of qualityScores) {
      if (taskType && score.taskType !== taskType) continue;

      const key = `${score.model}:${score.taskType}`;
      const data = dataByKey.get(key);
      if (!data) continue;

      // Calculate quality from individual score
      const quality = this.calculateQualityFromScore(score);
      data.qualities.push(quality);
      data.latencies.push(score.responseTime);
      data.successes.push(score.userAccepted ? 1 : 0);
    }

    // Convert to ModelCostQuality
    const results: ModelCostQuality[] = [];
    for (const data of dataByKey.values()) {
      if (data.costs.length === 0) continue;

      const avgCost = this.mean(data.costs);
      const avgQuality = data.qualities.length > 0 ? this.mean(data.qualities) : 0.5;
      const avgLatency = data.latencies.length > 0 ? this.mean(data.latencies) : 0;
      const successRate = data.successes.length > 0 ? this.mean(data.successes) : 0.5;

      results.push({
        model: data.model,
        provider: data.provider,
        taskType: data.taskType,
        avgCost,
        avgQuality,
        successRate,
        sampleCount: data.costs.length,
        avgLatency,
        costEfficiency: avgQuality > 0 ? avgCost / avgQuality : Infinity,
      });
    }

    return results;
  }

  /**
   * Get cost-quality data grouped by model
   */
  getCostQualityByModel(): Map<string, ModelCostQuality[]> {
    const allData = this.getCostQualityData();
    const byModel = new Map<string, ModelCostQuality[]>();

    for (const data of allData) {
      const existing = byModel.get(data.model) ?? [];
      existing.push(data);
      byModel.set(data.model, existing);
    }

    return byModel;
  }

  // ===== PARETO ANALYSIS =====

  /**
   * Calculate Pareto frontier for a task type
   */
  calculateParetoFrontier(taskType: TaskType): ParetoAnalysis {
    const allData = this.getCostQualityData(taskType);

    if (allData.length === 0) {
      return {
        allModels: [],
        paretoFrontier: [],
        dominatedModels: [],
        bestValue: null,
        highestQuality: null,
        lowestCost: null,
      };
    }

    // Sort by cost (ascending)
    const sorted = [...allData].sort((a, b) => a.avgCost - b.avgCost);

    // Find Pareto frontier
    const paretoPoints: ParetoPoint[] = [];
    const dominatedPoints: ParetoPoint[] = [];

    for (const point of sorted) {
      const paretoPoint: ParetoPoint = {
        ...point,
        isPareto: false,
        dominates: [],
      };

      // Check if this point is dominated by any Pareto point
      let isDominated = false;
      for (const pareto of paretoPoints) {
        if (pareto.avgCost <= point.avgCost && pareto.avgQuality >= point.avgQuality) {
          if (pareto.avgCost < point.avgCost || pareto.avgQuality > point.avgQuality) {
            isDominated = true;
            pareto.dominates.push(point.model);
            break;
          }
        }
      }

      if (!isDominated) {
        paretoPoint.isPareto = true;

        // Remove points from Pareto that this point dominates
        for (let i = paretoPoints.length - 1; i >= 0; i--) {
          const existing = paretoPoints[i];
          if (point.avgCost <= existing.avgCost && point.avgQuality >= existing.avgQuality) {
            if (point.avgCost < existing.avgCost || point.avgQuality > existing.avgQuality) {
              paretoPoint.dominates.push(existing.model);
              existing.isPareto = false;
              paretoPoints.splice(i, 1);
              dominatedPoints.push(existing);
            }
          }
        }

        paretoPoints.push(paretoPoint);
      } else {
        dominatedPoints.push(paretoPoint);
      }
    }

    // Find special points
    const bestValue = paretoPoints.length > 0
      ? paretoPoints.reduce((best, p) =>
          p.costEfficiency < best.costEfficiency ? p : best
        )
      : null;

    const highestQuality = paretoPoints.length > 0
      ? paretoPoints.reduce((best, p) =>
          p.avgQuality > best.avgQuality ? p : best
        )
      : null;

    const lowestCost = paretoPoints.length > 0
      ? paretoPoints.reduce((best, p) =>
          p.avgCost < best.avgCost ? p : best
        )
      : null;

    return {
      allModels: [...paretoPoints, ...dominatedPoints],
      paretoFrontier: paretoPoints,
      dominatedModels: dominatedPoints,
      bestValue,
      highestQuality,
      lowestCost,
    };
  }

  /**
   * Get all Pareto analyses by task type
   */
  getAllParetoAnalyses(): Map<TaskType, ParetoAnalysis> {
    const allData = this.getCostQualityData();
    const taskTypes = new Set(allData.map(d => d.taskType));
    const analyses = new Map<TaskType, ParetoAnalysis>();

    for (const taskType of taskTypes) {
      analyses.set(taskType, this.calculateParetoFrontier(taskType));
    }

    return analyses;
  }

  // ===== RECOMMENDATIONS =====

  /**
   * Generate switch recommendations
   */
  generateRecommendations(): SwitchRecommendation[] {
    const recommendations: SwitchRecommendation[] = [];
    const paretoAnalyses = this.getAllParetoAnalyses();

    for (const [taskType, analysis] of paretoAnalyses) {
      // Check dominated models for potential switches
      for (const dominated of analysis.dominatedModels) {
        if (dominated.sampleCount < this.config.minSamplesForRecommendation) {
          continue;
        }

        // Find best replacement from Pareto frontier
        const replacement = this.findBestReplacement(dominated, analysis.paretoFrontier);
        if (!replacement) continue;

        const recommendation = this.createRecommendation(
          taskType,
          dominated,
          replacement
        );

        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Also check for lateral moves (same quality, lower cost)
      for (const model of analysis.paretoFrontier) {
        if (model.sampleCount < this.config.minSamplesForRecommendation) {
          continue;
        }

        // Look for cheaper options with similar quality
        for (const other of analysis.paretoFrontier) {
          if (other.model === model.model) continue;
          if (other.avgCost >= model.avgCost) continue;

          const qualityDiff = model.avgQuality - other.avgQuality;
          if (qualityDiff <= this.config.maxQualityLossTolerance) {
            const lateralRec = this.createRecommendation(taskType, model, other);
            if (lateralRec) {
              recommendations.push(lateralRec);
            }
          }
        }
      }
    }

    // Sort by priority and savings
    return recommendations.sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.monthlySavings - a.monthlySavings;
    });
  }

  /**
   * Find best replacement model from Pareto frontier
   */
  private findBestReplacement(
    dominated: ParetoPoint,
    paretoFrontier: ParetoPoint[]
  ): ParetoPoint | null {
    // Filter to models with acceptable quality
    const candidates = paretoFrontier.filter(
      p => p.avgQuality >= dominated.avgQuality - this.config.maxQualityLossTolerance
    );

    if (candidates.length === 0) return null;

    // Find the one with best cost savings
    return candidates.reduce((best, p) =>
      (dominated.avgCost - p.avgCost) > (dominated.avgCost - best.avgCost) ? p : best
    );
  }

  /**
   * Create a recommendation
   */
  private createRecommendation(
    taskType: TaskType,
    from: ModelCostQuality,
    to: ModelCostQuality
  ): SwitchRecommendation | null {
    const costDiff = from.avgCost - to.avgCost;
    if (costDiff <= 0) return null; // No savings

    const monthlySavings = costDiff * this.config.avgRequestsPerMonth;
    const qualityImpact = to.avgQuality - from.avgQuality;
    const latencyImpact = to.avgLatency - from.avgLatency;

    // Skip if quality drop is too large
    if (qualityImpact < -this.config.maxQualityLossTolerance) {
      return null;
    }

    // Calculate confidence based on sample sizes
    const minSamples = Math.min(from.sampleCount, to.sampleCount);
    const confidence = Math.min(1, minSamples / 50);

    // Calculate ROI
    const roi = costDiff > 0 ? ((costDiff / from.avgCost) * 100) : 0;

    // Determine priority
    let priority: SwitchRecommendation['priority'];
    if (monthlySavings >= this.config.p0SavingsThreshold && qualityImpact >= 0) {
      priority = 'P0';
    } else if (monthlySavings >= this.config.p0SavingsThreshold * 0.5) {
      priority = 'P1';
    } else if (monthlySavings >= this.config.p0SavingsThreshold * 0.1) {
      priority = 'P2';
    } else {
      priority = 'P3';
    }

    // Generate reason
    let reason: string;
    if (qualityImpact > 0) {
      reason = `${to.model} is both cheaper and higher quality for ${taskType}`;
    } else if (qualityImpact >= -0.01) {
      reason = `${to.model} is cheaper with equivalent quality for ${taskType}`;
    } else {
      reason = `${to.model} is cheaper with slightly lower quality for ${taskType}`;
    }

    this.recommendationCounter++;

    return {
      id: `rec-${Date.now()}-${this.recommendationCounter}`,
      priority,
      taskType,
      fromModel: from.model,
      toModel: to.model,
      reason,
      monthlySavings,
      qualityImpact,
      latencyImpact,
      confidence,
      roi,
      stats: {
        fromCost: from.avgCost,
        toCost: to.avgCost,
        fromQuality: from.avgQuality,
        toQuality: to.avgQuality,
        sampleCount: Math.min(from.sampleCount, to.sampleCount),
      },
    };
  }

  // ===== REPORTS =====

  /**
   * Generate full optimization report
   */
  generateReport(periodDays: number = 30): CostOptimizationReport {
    const recommendations = this.generateRecommendations();
    const paretoByTaskType = this.getAllParetoAnalyses();

    // Calculate current costs
    const costRecords = this.costTracker.getAllRecords();
    const totalCost = costRecords.reduce((sum, r) => sum + r.cost.totalCost, 0);
    const daysInData = this.getDaysInData(costRecords);
    const currentMonthlyCost = daysInData > 0 ? (totalCost / daysInData) * 30 : 0;

    // Calculate projected savings
    const totalPotentialSavings = recommendations.reduce(
      (sum, r) => sum + r.monthlySavings,
      0
    );
    const projectedMonthlyCost = Math.max(0, currentMonthlyCost - totalPotentialSavings);

    // Summary stats
    let totalModels = 0;
    let paretoModels = 0;
    let dominatedModels = 0;

    for (const analysis of paretoByTaskType.values()) {
      totalModels += analysis.allModels.length;
      paretoModels += analysis.paretoFrontier.length;
      dominatedModels += analysis.dominatedModels.length;
    }

    const avgRoi = recommendations.length > 0
      ? recommendations.reduce((sum, r) => sum + r.roi, 0) / recommendations.length
      : 0;

    return {
      timestamp: new Date(),
      periodDays,
      currentMonthlyCost,
      projectedMonthlyCost,
      totalPotentialSavings,
      recommendations,
      paretoByTaskType,
      summary: {
        totalModels,
        paretoModels,
        dominatedModels,
        recommendationCount: recommendations.length,
        avgRoi,
      },
    };
  }

  /**
   * Get quick recommendations summary
   */
  getQuickSummary(): {
    topRecommendations: SwitchRecommendation[];
    totalMonthlySavings: number;
    dominatedModelCount: number;
  } {
    const recommendations = this.generateRecommendations();
    const topRecommendations = recommendations.slice(0, 5);
    const totalMonthlySavings = recommendations.reduce(
      (sum, r) => sum + r.monthlySavings,
      0
    );

    const paretoAnalyses = this.getAllParetoAnalyses();
    let dominatedModelCount = 0;
    for (const analysis of paretoAnalyses.values()) {
      dominatedModelCount += analysis.dominatedModels.length;
    }

    return {
      topRecommendations,
      totalMonthlySavings,
      dominatedModelCount,
    };
  }

  // ===== UTILITIES =====

  /**
   * Calculate quality from a single score record
   */
  private calculateQualityFromScore(score: {
    userRating: 1 | 2 | 3 | 4 | 5 | null;
    userAccepted: boolean;
    testsPass?: boolean | null;
  }): number {
    let qualityScore = 0;
    let weights = 0;

    // User rating (weight 0.4)
    if (score.userRating !== null) {
      qualityScore += ((score.userRating - 1) / 4) * 0.4;
      weights += 0.4;
    }

    // User acceptance (weight 0.35)
    qualityScore += (score.userAccepted ? 1 : 0) * 0.35;
    weights += 0.35;

    // Tests pass (weight 0.25)
    if (score.testsPass !== undefined && score.testsPass !== null) {
      qualityScore += (score.testsPass ? 1 : 0) * 0.25;
      weights += 0.25;
    }

    return weights > 0 ? qualityScore / weights : 0.5;
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private getDaysInData(records: { timestamp: Date }[]): number {
    if (records.length === 0) return 0;
    const sorted = [...records].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const first = sorted[0].timestamp.getTime();
    const last = sorted[sorted.length - 1].timestamp.getTime();
    return Math.max(1, (last - first) / (1000 * 60 * 60 * 24));
  }
}

// ===== SINGLETON =====

let optimizerInstance: CostOptimizer | null = null;

/**
 * Get or create the singleton CostOptimizer
 */
export function getCostOptimizer(config?: CostOptimizerConfig): CostOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new CostOptimizer(config);
  }
  return optimizerInstance;
}

/**
 * Initialize the cost optimizer
 */
export function initializeCostOptimizer(config: CostOptimizerConfig): CostOptimizer {
  optimizerInstance = new CostOptimizer(config);
  return optimizerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetCostOptimizer(): void {
  optimizerInstance = null;
}

// ===== FORMATTING UTILITIES =====

/**
 * Format recommendation for display
 */
export function formatRecommendation(rec: SwitchRecommendation): string {
  const priorityIcon = {
    P0: '\u{1F534}',
    P1: '\u{1F7E0}',
    P2: '\u{1F7E1}',
    P3: '\u{1F7E2}',
  }[rec.priority];

  const qualityIndicator = rec.qualityImpact > 0 ? '\u2191' :
    rec.qualityImpact < -0.01 ? '\u2193' : '\u2194\uFE0F';

  return [
    `${priorityIcon} [${rec.priority}] ${rec.taskType}`,
    `   Switch: ${rec.fromModel} \u2192 ${rec.toModel}`,
    `   Savings: $${rec.monthlySavings.toFixed(2)}/month (${rec.roi.toFixed(1)}% ROI)`,
    `   Quality: ${qualityIndicator} ${(rec.qualityImpact * 100).toFixed(1)}%`,
    `   Reason: ${rec.reason}`,
  ].join('\n');
}

/**
 * Format Pareto analysis for display
 */
export function formatParetoAnalysis(analysis: ParetoAnalysis, taskType: string): string {
  const lines = [
    `=== Pareto Analysis: ${taskType} ===`,
    '',
    `Total Models: ${analysis.allModels.length}`,
    `Pareto Frontier: ${analysis.paretoFrontier.length}`,
    `Dominated: ${analysis.dominatedModels.length}`,
    '',
  ];

  if (analysis.bestValue) {
    lines.push(`Best Value: ${analysis.bestValue.model} ($${analysis.bestValue.avgCost.toFixed(4)}/req, ${(analysis.bestValue.avgQuality * 100).toFixed(1)}% quality)`);
  }
  if (analysis.highestQuality) {
    lines.push(`Highest Quality: ${analysis.highestQuality.model} (${(analysis.highestQuality.avgQuality * 100).toFixed(1)}%)`);
  }
  if (analysis.lowestCost) {
    lines.push(`Lowest Cost: ${analysis.lowestCost.model} ($${analysis.lowestCost.avgCost.toFixed(4)}/req)`);
  }

  if (analysis.paretoFrontier.length > 0) {
    lines.push('');
    lines.push('--- Pareto Frontier ---');
    for (const point of analysis.paretoFrontier) {
      lines.push(`  ${point.model}: $${point.avgCost.toFixed(4)}/req, ${(point.avgQuality * 100).toFixed(1)}% quality`);
    }
  }

  if (analysis.dominatedModels.length > 0) {
    lines.push('');
    lines.push('--- Dominated Models ---');
    for (const point of analysis.dominatedModels) {
      lines.push(`  ${point.model}: $${point.avgCost.toFixed(4)}/req, ${(point.avgQuality * 100).toFixed(1)}% quality`);
    }
  }

  return lines.join('\n');
}

/**
 * Format full optimization report
 */
export function formatOptimizationReport(report: CostOptimizationReport): string {
  const lines = [
    '=== Cost Optimization Report ===',
    `Generated: ${report.timestamp.toISOString()}`,
    `Period: Last ${report.periodDays} days`,
    '',
    '--- Cost Summary ---',
    `Current Monthly Cost: $${report.currentMonthlyCost.toFixed(2)}`,
    `Projected (Optimized): $${report.projectedMonthlyCost.toFixed(2)}`,
    `Potential Savings: $${report.totalPotentialSavings.toFixed(2)}/month`,
    '',
    '--- Model Analysis ---',
    `Total Model/TaskType Combinations: ${report.summary.totalModels}`,
    `On Pareto Frontier: ${report.summary.paretoModels}`,
    `Dominated (Suboptimal): ${report.summary.dominatedModels}`,
    '',
    `--- Recommendations (${report.summary.recommendationCount}) ---`,
  ];

  if (report.recommendations.length === 0) {
    lines.push('No recommendations at this time.');
  } else {
    for (const rec of report.recommendations.slice(0, 10)) {
      lines.push('');
      lines.push(formatRecommendation(rec));
    }

    if (report.recommendations.length > 10) {
      lines.push('');
      lines.push(`... and ${report.recommendations.length - 10} more recommendations`);
    }
  }

  return lines.join('\n');
}
