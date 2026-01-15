/**
 * Convergence Tracker
 * TIER-2.3 - Learning System Convergence
 *
 * Provides convergence metrics for the learning system:
 * - Learning curve tracking (loss over time)
 * - Convergence speed calculation
 * - Plateau detection
 * - Adaptive learning rate recommendations
 * - Fisher matrix management
 *
 * @module god-agent/core/learning/convergence-tracker
 */

import { createServiceLogger } from '../observability/logger.js';

// Service logger
const log = createServiceLogger('convergence-tracker');

// ==================== Types ====================

/**
 * Convergence metrics
 */
export interface IConvergenceMetrics {
  /** Learning curve - loss values over time */
  learningCurve: number[];
  /** Quality curve - quality scores over time */
  qualityCurve: number[];
  /** Convergence speed - steps to reach 90% of final quality */
  convergenceSpeed: number;
  /** Whether a plateau has been detected */
  plateauDetected: boolean;
  /** Length of current plateau (number of samples) */
  plateauLength: number;
  /** Recommended action based on current state */
  recommendedAction: ConvergenceAction;
  /** Current effective learning rate */
  effectiveLearningRate: number;
  /** Suggested learning rate adjustment */
  suggestedLearningRate: number;
  /** Moving average of recent quality scores */
  movingAverage: number;
  /** Variance of recent quality scores */
  variance: number;
  /** Trend direction: improving, stable, or degrading */
  trend: ConvergenceTrend;
  /** Total samples processed */
  totalSamples: number;
  /** Last update timestamp */
  lastUpdated: number;
}

/**
 * Convergence action recommendations
 */
export type ConvergenceAction = 'continue' | 'pause' | 'reset' | 'reduce_lr' | 'increase_lr';

/**
 * Convergence trend
 */
export type ConvergenceTrend = 'improving' | 'stable' | 'degrading';

/**
 * Fisher matrix entry
 */
export interface IFisherEntry {
  /** Route/pattern identifier */
  key: string;
  /** Fisher information value */
  value: number;
  /** Last update timestamp */
  lastUpdated: number;
  /** Update count */
  updateCount: number;
}

/**
 * Fisher matrix statistics
 */
export interface IFisherStats {
  /** Total entries */
  totalEntries: number;
  /** Maximum entries allowed */
  maxEntries: number;
  /** Entries pruned */
  entriesPruned: number;
  /** Average Fisher value */
  averageValue: number;
  /** Median Fisher value */
  medianValue: number;
  /** Total memory usage estimate (bytes) */
  memoryUsage: number;
}

/**
 * Convergence tracker configuration
 */
export interface IConvergenceConfig {
  /** Window size for moving average (default: 50) */
  windowSize?: number;
  /** Plateau detection threshold (default: 0.01) */
  plateauThreshold?: number;
  /** Minimum samples before plateau detection (default: 100) */
  minSamplesForPlateau?: number;
  /** Maximum Fisher entries before pruning (default: 10000) */
  maxFisherEntries?: number;
  /** Fisher decay rate (default: 0.999) */
  fisherDecayRate?: number;
  /** Initial learning rate (default: 0.01) */
  initialLearningRate?: number;
  /** Minimum learning rate (default: 0.0001) */
  minLearningRate?: number;
  /** Maximum learning rate (default: 0.1) */
  maxLearningRate?: number;
}

// ==================== Default Configuration ====================

const DEFAULT_CONFIG: Required<IConvergenceConfig> = {
  windowSize: 50,
  plateauThreshold: 0.01,
  minSamplesForPlateau: 100,
  maxFisherEntries: 10000,
  fisherDecayRate: 0.999,
  initialLearningRate: 0.01,
  minLearningRate: 0.0001,
  maxLearningRate: 0.1,
};

// ==================== Convergence Tracker ====================

/**
 * Tracks learning convergence and provides recommendations
 */
export class ConvergenceTracker {
  private config: Required<IConvergenceConfig>;
  private learningCurve: number[] = [];
  private qualityCurve: number[] = [];
  private fisherMatrix: Map<string, IFisherEntry> = new Map();
  private currentLearningRate: number;
  private plateauStartIndex: number = -1;
  private entriesPruned: number = 0;

  constructor(config: IConvergenceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentLearningRate = this.config.initialLearningRate;
  }

  /**
   * Record a new quality sample
   */
  recordSample(quality: number, loss?: number): void {
    this.qualityCurve.push(quality);
    if (loss !== undefined) {
      this.learningCurve.push(loss);
    }

    // Detect plateau
    this.updatePlateauDetection();

    // Adjust learning rate if needed
    this.adjustLearningRate();

    log.debug('Sample recorded', {
      quality,
      loss,
      totalSamples: this.qualityCurve.length,
      plateauDetected: this.isPlateauDetected(),
    });
  }

  /**
   * Get convergence metrics
   */
  getMetrics(): IConvergenceMetrics {
    const totalSamples = this.qualityCurve.length;
    const movingAverage = this.calculateMovingAverage();
    const variance = this.calculateVariance();
    const trend = this.detectTrend();
    const plateauDetected = this.isPlateauDetected();
    const plateauLength = this.getPlateauLength();
    const convergenceSpeed = this.calculateConvergenceSpeed();

    return {
      learningCurve: [...this.learningCurve],
      qualityCurve: [...this.qualityCurve],
      convergenceSpeed,
      plateauDetected,
      plateauLength,
      recommendedAction: this.getRecommendedAction(),
      effectiveLearningRate: this.currentLearningRate,
      suggestedLearningRate: this.calculateSuggestedLearningRate(),
      movingAverage,
      variance,
      trend,
      totalSamples,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Update Fisher information for a key
   */
  updateFisher(key: string, value: number): void {
    const existing = this.fisherMatrix.get(key);

    if (existing) {
      // Exponential moving average update
      existing.value = this.config.fisherDecayRate * existing.value +
                       (1 - this.config.fisherDecayRate) * value;
      existing.lastUpdated = Date.now();
      existing.updateCount++;
    } else {
      // Check if we need to prune
      if (this.fisherMatrix.size >= this.config.maxFisherEntries) {
        this.pruneFisherMatrix();
      }

      this.fisherMatrix.set(key, {
        key,
        value,
        lastUpdated: Date.now(),
        updateCount: 1,
      });
    }
  }

  /**
   * Get Fisher matrix statistics
   */
  getFisherStats(): IFisherStats {
    const entries = Array.from(this.fisherMatrix.values());
    const values = entries.map(e => e.value);

    const averageValue = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;

    const sortedValues = [...values].sort((a, b) => a - b);
    const medianValue = values.length > 0
      ? sortedValues[Math.floor(sortedValues.length / 2)]
      : 0;

    // Rough memory estimate: ~100 bytes per entry
    const memoryUsage = this.fisherMatrix.size * 100;

    return {
      totalEntries: this.fisherMatrix.size,
      maxEntries: this.config.maxFisherEntries,
      entriesPruned: this.entriesPruned,
      averageValue,
      medianValue,
      memoryUsage,
    };
  }

  /**
   * Prune Fisher matrix to stay within limits
   * Removes least important entries (low value + old)
   */
  pruneFisherMatrix(): void {
    if (this.fisherMatrix.size <= this.config.maxFisherEntries * 0.9) {
      return; // Only prune when near limit
    }

    const entries = Array.from(this.fisherMatrix.entries());

    // Score entries: lower is more prunable
    // Score = value * recency_factor
    const now = Date.now();
    const scored = entries.map(([key, entry]) => {
      const recencyFactor = Math.exp(-(now - entry.lastUpdated) / (24 * 60 * 60 * 1000)); // 1 day decay
      const score = entry.value * recencyFactor;
      return { key, score };
    });

    // Sort by score ascending (most prunable first)
    scored.sort((a, b) => a.score - b.score);

    // Prune 10% of entries
    const toPrune = Math.floor(this.config.maxFisherEntries * 0.1);
    for (let i = 0; i < toPrune && i < scored.length; i++) {
      this.fisherMatrix.delete(scored[i].key);
      this.entriesPruned++;
    }

    log.info('Fisher matrix pruned', {
      pruned: toPrune,
      remaining: this.fisherMatrix.size,
      totalPruned: this.entriesPruned,
    });
  }

  /**
   * Reset the convergence tracker
   */
  reset(): void {
    this.learningCurve = [];
    this.qualityCurve = [];
    this.plateauStartIndex = -1;
    this.currentLearningRate = this.config.initialLearningRate;
    log.info('Convergence tracker reset');
  }

  /**
   * Reset only the Fisher matrix
   */
  resetFisher(): void {
    this.fisherMatrix.clear();
    this.entriesPruned = 0;
    log.info('Fisher matrix reset');
  }

  // ==================== Private Methods ====================

  private calculateMovingAverage(): number {
    if (this.qualityCurve.length === 0) return 0;

    const windowStart = Math.max(0, this.qualityCurve.length - this.config.windowSize);
    const window = this.qualityCurve.slice(windowStart);

    return window.reduce((a, b) => a + b, 0) / window.length;
  }

  private calculateVariance(): number {
    if (this.qualityCurve.length < 2) return 0;

    const windowStart = Math.max(0, this.qualityCurve.length - this.config.windowSize);
    const window = this.qualityCurve.slice(windowStart);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;

    const squaredDiffs = window.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / window.length;
  }

  private detectTrend(): ConvergenceTrend {
    if (this.qualityCurve.length < this.config.windowSize * 2) {
      return 'stable';
    }

    const halfWindow = Math.floor(this.config.windowSize / 2);
    const recentStart = this.qualityCurve.length - halfWindow;
    const olderStart = recentStart - halfWindow;

    const recentMean = this.qualityCurve.slice(recentStart).reduce((a, b) => a + b, 0) / halfWindow;
    const olderMean = this.qualityCurve.slice(olderStart, recentStart).reduce((a, b) => a + b, 0) / halfWindow;

    const change = (recentMean - olderMean) / (olderMean || 1);

    if (change > this.config.plateauThreshold) {
      return 'improving';
    } else if (change < -this.config.plateauThreshold) {
      return 'degrading';
    }
    return 'stable';
  }

  private updatePlateauDetection(): void {
    if (this.qualityCurve.length < this.config.minSamplesForPlateau) {
      return;
    }

    const trend = this.detectTrend();
    const variance = this.calculateVariance();

    // Plateau = stable trend + low variance
    const isPlateauing = trend === 'stable' && variance < this.config.plateauThreshold;

    if (isPlateauing) {
      if (this.plateauStartIndex === -1) {
        this.plateauStartIndex = this.qualityCurve.length;
        log.info('Plateau detected', { startIndex: this.plateauStartIndex });
      }
    } else {
      if (this.plateauStartIndex !== -1) {
        log.info('Plateau ended', {
          length: this.qualityCurve.length - this.plateauStartIndex,
        });
      }
      this.plateauStartIndex = -1;
    }
  }

  private isPlateauDetected(): boolean {
    return this.plateauStartIndex !== -1;
  }

  private getPlateauLength(): number {
    if (this.plateauStartIndex === -1) return 0;
    return this.qualityCurve.length - this.plateauStartIndex;
  }

  private calculateConvergenceSpeed(): number {
    if (this.qualityCurve.length < 10) return 0;

    const finalQuality = this.calculateMovingAverage();
    const target = finalQuality * 0.9;

    // Find first index where quality exceeds 90% of final
    for (let i = 0; i < this.qualityCurve.length; i++) {
      // Use rolling average to reduce noise
      const windowEnd = Math.min(i + 5, this.qualityCurve.length);
      const windowAvg = this.qualityCurve.slice(i, windowEnd).reduce((a, b) => a + b, 0) / (windowEnd - i);

      if (windowAvg >= target) {
        return i;
      }
    }

    return this.qualityCurve.length; // Not yet converged
  }

  private getRecommendedAction(): ConvergenceAction {
    const trend = this.detectTrend();
    const plateauDetected = this.isPlateauDetected();
    const plateauLength = this.getPlateauLength();

    // Degrading performance
    if (trend === 'degrading') {
      if (this.currentLearningRate > this.config.minLearningRate * 2) {
        return 'reduce_lr';
      }
      return 'pause';
    }

    // Long plateau
    if (plateauDetected && plateauLength > this.config.windowSize * 2) {
      if (this.currentLearningRate > this.config.minLearningRate) {
        return 'reduce_lr';
      }
      return 'pause';
    }

    // Short plateau - might need LR adjustment
    if (plateauDetected && plateauLength > this.config.windowSize) {
      return 'reduce_lr';
    }

    // Improving well
    if (trend === 'improving') {
      return 'continue';
    }

    // Default: continue
    return 'continue';
  }

  private adjustLearningRate(): void {
    const action = this.getRecommendedAction();

    if (action === 'reduce_lr') {
      this.currentLearningRate = Math.max(
        this.config.minLearningRate,
        this.currentLearningRate * 0.5
      );
    } else if (action === 'increase_lr') {
      this.currentLearningRate = Math.min(
        this.config.maxLearningRate,
        this.currentLearningRate * 1.1
      );
    }
  }

  private calculateSuggestedLearningRate(): number {
    const trend = this.detectTrend();
    const variance = this.calculateVariance();

    // High variance → lower LR
    // Stable/improving → can increase LR
    let suggested = this.currentLearningRate;

    if (variance > this.config.plateauThreshold * 10) {
      suggested *= 0.5;
    } else if (trend === 'improving' && variance < this.config.plateauThreshold) {
      suggested *= 1.2;
    }

    return Math.max(
      this.config.minLearningRate,
      Math.min(this.config.maxLearningRate, suggested)
    );
  }
}

// ==================== Singleton Instance ====================

let convergenceTrackerInstance: ConvergenceTracker | null = null;

/**
 * Get the global convergence tracker instance
 */
export function getConvergenceTracker(config?: IConvergenceConfig): ConvergenceTracker {
  if (!convergenceTrackerInstance) {
    convergenceTrackerInstance = new ConvergenceTracker(config);
  }
  return convergenceTrackerInstance;
}

/**
 * Reset the global convergence tracker instance
 */
export function resetConvergenceTracker(): void {
  if (convergenceTrackerInstance) {
    convergenceTrackerInstance.reset();
    convergenceTrackerInstance = null;
  }
}
