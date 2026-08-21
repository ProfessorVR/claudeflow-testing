/** @deprecated Test-only / experimental module. Do not import in production. */

/**
 * User Satisfaction Tracking - Collect and analyze satisfaction ratings
 *
 * This module tracks user satisfaction for god-write outputs, enabling:
 * - Post-generation satisfaction ratings
 * - Trajectory metadata updates with scores
 * - Learning feedback integration
 * - Satisfaction trend analysis
 *
 * Reference: src/god-agent/cli/session-manager.ts (lines 100-150)
 *
 * Integration Points:
 * - UniversalAgent.write() - Collect ratings after generation
 * - TrajectoryBridge - Update trajectory with satisfaction data
 * - SonaEngine - Feed satisfaction into learning system
 *
 * Usage:
 * ```typescript
 * const tracker = new SatisfactionTracker(trajectoryBridge);
 * await tracker.collectRating(trajectoryId, writeResult);
 * const stats = tracker.getStatistics();
 * ```
 */

import * as readline from 'readline';
import type { TrajectoryBridge } from '../universal/trajectory-bridge.js';
import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';

const logger = createComponentLogger('SatisfactionTracker', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Satisfaction rating (0-1 scale)
 */
export type SatisfactionScore = number;

/**
 * User satisfaction rating for a write operation
 */
export interface SatisfactionRating {
  /** Trajectory ID */
  trajectoryId: string;

  /** Overall satisfaction score (0-1) */
  overallScore: SatisfactionScore;

  /** Style match score (0-1) - how well it matches expected style */
  styleMatchScore?: SatisfactionScore;

  /** Quality satisfaction (0-1) - content quality */
  qualityScore?: SatisfactionScore;

  /** Usefulness score (0-1) - practical utility */
  usefulnessScore?: SatisfactionScore;

  /** Would user use this as-is without edits */
  wouldUseAsIs: boolean;

  /** Free-text feedback */
  feedback?: string;

  /** Timestamp */
  timestamp: string;
}

/**
 * Satisfaction statistics over time
 */
export interface SatisfactionStatistics {
  /** Total ratings collected */
  totalRatings: number;

  /** Average overall score */
  avgOverallScore: number;

  /** Average style match score */
  avgStyleMatchScore: number;

  /** Average quality score */
  avgQualityScore: number;

  /** Average usefulness score */
  avgUsefulnessScore: number;

  /** Percentage that would be used as-is */
  useAsIsPercentage: number;

  /** Ratings by trajectory ID */
  ratingsByTrajectory: Map<string, SatisfactionRating>;

  /** Recent ratings (last 10) */
  recentRatings: SatisfactionRating[];
}

/**
 * Options for satisfaction collection
 */
export interface SatisfactionOptions {
  /** Enable interactive prompts (default: true) */
  enabled?: boolean;

  /** Collect detailed scores (style, quality, usefulness) or just overall */
  collectDetailedScores?: boolean;

  /** Prompt timeout in milliseconds (default: 30000 = 30s) */
  promptTimeout?: number;

  /** Auto-submit default rating on timeout (default: undefined = skip) */
  timeoutDefaultRating?: SatisfactionScore;
}

// ============================================================================
// Satisfaction Tracker Class
// ============================================================================

/**
 * Tracks user satisfaction ratings for write operations
 */
export class SatisfactionTracker {
  private ratings: Map<string, SatisfactionRating> = new Map();
  private options: Required<SatisfactionOptions>;

  constructor(
    private trajectoryBridge?: TrajectoryBridge,
    options: SatisfactionOptions = {}
  ) {
    this.options = {
      enabled: options.enabled ?? true,
      collectDetailedScores: options.collectDetailedScores ?? true,
      promptTimeout: options.promptTimeout ?? 30000,
      timeoutDefaultRating: options.timeoutDefaultRating ?? 0,
    };
  }

  /**
   * Update satisfaction tracking options
   */
  updateOptions(options: Partial<SatisfactionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Collect satisfaction rating from user
   *
   * @param trajectoryId - Trajectory ID for this write operation
   * @param content - Generated content to rate
   * @returns Collected satisfaction rating or undefined if skipped
   */
  async collectRating(
    trajectoryId: string,
    content: string
  ): Promise<SatisfactionRating | undefined> {
    if (!this.options.enabled) {
      return undefined;
    }

    // Display content preview
    this.displayContentPreview(content);

    // Collect ratings
    const overallScore = await this.promptForScore(
      'Overall satisfaction (0-10)',
      this.options.promptTimeout
    );

    if (overallScore === undefined) {
      logger.log(LogLevel.INFO, 'Satisfaction rating skipped');
      return undefined;
    }

    const rating: SatisfactionRating = {
      trajectoryId,
      overallScore: overallScore / 10, // Convert to 0-1 scale
      wouldUseAsIs: false,
      timestamp: new Date().toISOString(),
    };

    // Collect detailed scores if enabled
    if (this.options.collectDetailedScores) {
      const styleMatch = await this.promptForScore(
        'Style match (0-10)',
        this.options.promptTimeout
      );
      if (styleMatch !== undefined) {
        rating.styleMatchScore = styleMatch / 10;
      }

      const quality = await this.promptForScore(
        'Content quality (0-10)',
        this.options.promptTimeout
      );
      if (quality !== undefined) {
        rating.qualityScore = quality / 10;
      }

      const usefulness = await this.promptForScore(
        'Usefulness (0-10)',
        this.options.promptTimeout
      );
      if (usefulness !== undefined) {
        rating.usefulnessScore = usefulness / 10;
      }
    }

    // Ask if would use as-is
    rating.wouldUseAsIs = await this.promptForBoolean(
      'Would you use this as-is without edits?'
    );

    // Collect feedback
    rating.feedback = await this.promptForFeedback();

    // Store rating
    this.ratings.set(trajectoryId, rating);

    // Update trajectory metadata
    await this.updateTrajectory(rating);

    // Log satisfaction
    logger.log(
      LogLevel.INFO,
      `Satisfaction rating collected: ${(rating.overallScore * 100).toFixed(1)}% (trajectory: ${trajectoryId})`
    );

    return rating;
  }

  /**
   * Get satisfaction rating for a trajectory
   */
  getRating(trajectoryId: string): SatisfactionRating | undefined {
    return this.ratings.get(trajectoryId);
  }

  /**
   * Get all satisfaction ratings
   */
  getAllRatings(): SatisfactionRating[] {
    return Array.from(this.ratings.values());
  }

  /**
   * Get satisfaction statistics
   */
  getStatistics(): SatisfactionStatistics {
    const ratings = this.getAllRatings();

    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        avgOverallScore: 0,
        avgStyleMatchScore: 0,
        avgQualityScore: 0,
        avgUsefulnessScore: 0,
        useAsIsPercentage: 0,
        ratingsByTrajectory: new Map(),
        recentRatings: [],
      };
    }

    const overallSum = ratings.reduce((sum, r) => sum + r.overallScore, 0);
    const styleSum = ratings
      .filter(r => r.styleMatchScore !== undefined)
      .reduce((sum, r) => sum + (r.styleMatchScore ?? 0), 0);
    const qualitySum = ratings
      .filter(r => r.qualityScore !== undefined)
      .reduce((sum, r) => sum + (r.qualityScore ?? 0), 0);
    const usefulnessSum = ratings
      .filter(r => r.usefulnessScore !== undefined)
      .reduce((sum, r) => sum + (r.usefulnessScore ?? 0), 0);
    const useAsIsCount = ratings.filter(r => r.wouldUseAsIs).length;

    const styleCount = ratings.filter(r => r.styleMatchScore !== undefined).length;
    const qualityCount = ratings.filter(r => r.qualityScore !== undefined).length;
    const usefulnessCount = ratings.filter(r => r.usefulnessScore !== undefined).length;

    return {
      totalRatings: ratings.length,
      avgOverallScore: overallSum / ratings.length,
      avgStyleMatchScore: styleCount > 0 ? styleSum / styleCount : 0,
      avgQualityScore: qualityCount > 0 ? qualitySum / qualityCount : 0,
      avgUsefulnessScore: usefulnessCount > 0 ? usefulnessSum / usefulnessCount : 0,
      useAsIsPercentage: (useAsIsCount / ratings.length) * 100,
      ratingsByTrajectory: new Map(this.ratings),
      recentRatings: ratings.slice(-10),
    };
  }

  /**
   * Display satisfaction statistics
   */
  displayStatistics(): void {
    const stats = this.getStatistics();

    if (stats.totalRatings === 0) {
      console.log('\nNo satisfaction ratings collected yet.');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('USER SATISFACTION STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Ratings: ${stats.totalRatings}`);
    console.log(`Average Overall Satisfaction: ${(stats.avgOverallScore * 100).toFixed(1)}%`);
    console.log(`Average Style Match: ${(stats.avgStyleMatchScore * 100).toFixed(1)}%`);
    console.log(`Average Quality: ${(stats.avgQualityScore * 100).toFixed(1)}%`);
    console.log(`Average Usefulness: ${(stats.avgUsefulnessScore * 100).toFixed(1)}%`);
    console.log(`Would Use As-Is: ${stats.useAsIsPercentage.toFixed(1)}%`);

    if (stats.recentRatings.length > 0) {
      console.log('\nRecent Ratings:');
      for (const rating of stats.recentRatings.slice(-5)) {
        console.log(`  ${rating.timestamp}: ${(rating.overallScore * 100).toFixed(1)}%`);
        if (rating.feedback) {
          console.log(`    Feedback: ${rating.feedback.slice(0, 100)}...`);
        }
      }
    }

    console.log('='.repeat(80) + '\n');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Display content preview for rating
   */
  private displayContentPreview(content: string): void {
    console.log('\n' + '='.repeat(80));
    console.log('CONTENT GENERATED - PLEASE RATE');
    console.log('='.repeat(80));
    console.log(content.slice(0, 500));
    if (content.length > 500) {
      console.log('...(truncated)...');
    }
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Prompt user for a numeric score
   */
  private async promptForScore(
    prompt: string,
    timeout: number
  ): Promise<number | undefined> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        rl.close();
      };

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          logger.log(LogLevel.INFO, `Prompt timeout for: ${prompt}`);
          resolve(this.options.timeoutDefaultRating ? this.options.timeoutDefaultRating * 10 : undefined);
        }, timeout);
      }

      rl.question(`${prompt}: `, (answer) => {
        cleanup();

        const score = parseInt(answer.trim(), 10);
        if (isNaN(score) || score < 0 || score > 10) {
          console.log('Invalid score (must be 0-10), using default');
          resolve(this.options.timeoutDefaultRating ? this.options.timeoutDefaultRating * 10 : undefined);
        } else {
          resolve(score);
        }
      });
    });
  }

  /**
   * Prompt user for yes/no
   */
  private async promptForBoolean(prompt: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${prompt} (y/n): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase().trim() === 'y');
      });
    });
  }

  /**
   * Prompt user for free-text feedback
   */
  private async promptForFeedback(): Promise<string | undefined> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question('Any additional feedback (optional): ', (feedback) => {
        rl.close();
        const trimmed = feedback.trim();
        resolve(trimmed.length > 0 ? trimmed : undefined);
      });
    });
  }

  /**
   * Update trajectory with satisfaction rating
   */
  private async updateTrajectory(rating: SatisfactionRating): Promise<void> {
    if (!this.trajectoryBridge) {
      return;
    }

    try {
      await this.trajectoryBridge.storeMetadata(rating.trajectoryId, {
        satisfactionRating: {
          overallScore: rating.overallScore,
          styleMatchScore: rating.styleMatchScore,
          qualityScore: rating.qualityScore,
          usefulnessScore: rating.usefulnessScore,
          wouldUseAsIs: rating.wouldUseAsIs,
          feedback: rating.feedback,
          timestamp: rating.timestamp,
        },
      });

      logger.log(LogLevel.DEBUG, `Updated trajectory ${rating.trajectoryId} with satisfaction data`);
    } catch (error) {
      logger.log(LogLevel.ERROR, `Failed to update trajectory: ${error}`);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a satisfaction tracker
 */
export function createSatisfactionTracker(
  trajectoryBridge?: TrajectoryBridge,
  options?: SatisfactionOptions
): SatisfactionTracker {
  return new SatisfactionTracker(trajectoryBridge, options);
}

/**
 * Create a non-interactive satisfaction tracker (disabled)
 */
export function createNonInteractiveSatisfactionTracker(
  trajectoryBridge?: TrajectoryBridge
): SatisfactionTracker {
  return new SatisfactionTracker(trajectoryBridge, { enabled: false });
}
