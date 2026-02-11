/** @deprecated Test-only / experimental module. Do not import in production. */

/**
 * Feedback Learning - Paragraph-level feedback collection
 *
 * Enables detailed feedback collection for learning:
 * - Paragraph-level ratings
 * - Specific improvement suggestions
 * - Pattern learning from feedback
 * - Integration with SonaEngine trajectory system
 *
 * Reference: SonaEngine trajectory feedback system
 *
 * Integration Points:
 * - UniversalAgent - Collect feedback after write
 * - TrajectoryBridge - Store feedback in trajectories
 * - SonaEngine - Learn from feedback patterns
 *
 * Usage:
 * ```typescript
 * const learner = new FeedbackLearner(trajectoryBridge);
 * await learner.collectParagraphFeedback(content, trajectoryId);
 * ```
 */

import type { TrajectoryBridge } from '../universal/trajectory-bridge.js';
import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';
import * as readline from 'readline';

const logger = createComponentLogger('FeedbackLearning', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Paragraph feedback
 */
export interface ParagraphFeedback {
  /** Paragraph index */
  paragraphIndex: number;

  /** Paragraph text */
  text: string;

  /** Rating (0-1) */
  rating: number;

  /** Specific issues */
  issues?: string[];

  /** Strengths */
  strengths?: string[];

  /** Improvement suggestions */
  suggestions?: string[];

  /** Tags for categorization */
  tags?: string[];
}

/**
 * Complete feedback for a write operation
 */
export interface WriteFeedback {
  /** Trajectory ID */
  trajectoryId: string;

  /** Overall rating (0-1) */
  overallRating: number;

  /** Paragraph-level feedback */
  paragraphs: ParagraphFeedback[];

  /** General comments */
  generalComments?: string;

  /** What worked well */
  strengths?: string[];

  /** What needs improvement */
  improvements?: string[];

  /** Timestamp */
  timestamp: string;
}

/**
 * Feedback options
 */
export interface FeedbackOptions {
  /** Enable interactive collection (default: true) */
  enabled?: boolean;

  /** Collect detailed paragraph feedback (default: false) */
  collectParagraphFeedback?: boolean;

  /** Prompt timeout (ms) */
  timeout?: number;
}

// ============================================================================
// Feedback Learner Class
// ============================================================================

/**
 * Collects and processes feedback for learning
 */
export class FeedbackLearner {
  private options: Required<FeedbackOptions>;
  private feedbackHistory: Map<string, WriteFeedback> = new Map();

  constructor(
    private trajectoryBridge?: TrajectoryBridge,
    options: FeedbackOptions = {}
  ) {
    this.options = {
      enabled: options.enabled ?? true,
      collectParagraphFeedback: options.collectParagraphFeedback ?? false,
      timeout: options.timeout ?? 60000,
    };
  }

  /**
   * Collect feedback for write operation
   */
  async collectFeedback(
    content: string,
    trajectoryId: string
  ): Promise<WriteFeedback | undefined> {
    if (!this.options.enabled) {
      return undefined;
    }

    console.log('\n' + '='.repeat(80));
    console.log('FEEDBACK COLLECTION');
    console.log('='.repeat(80));

    // Overall rating
    const overallRating = await this.promptForRating('Overall quality (0-10)');
    if (overallRating === undefined) {
      return undefined;
    }

    const feedback: WriteFeedback = {
      trajectoryId,
      overallRating: overallRating / 10,
      paragraphs: [],
      timestamp: new Date().toISOString(),
    };

    // Paragraph-level feedback if enabled
    if (this.options.collectParagraphFeedback) {
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      feedback.paragraphs = await this.collectParagraphFeedback(paragraphs);
    }

    // Strengths and improvements
    feedback.strengths = await this.promptForList('What worked well? (comma-separated)');
    feedback.improvements = await this.promptForList('What needs improvement? (comma-separated)');
    feedback.generalComments = await this.promptForText('General comments (optional)');

    // Store in history
    this.feedbackHistory.set(trajectoryId, feedback);

    // Update trajectory
    await this.updateTrajectory(feedback);

    logger.log(
      LogLevel.INFO,
      `Feedback collected: ${(feedback.overallRating * 100).toFixed(1)}% (${feedback.paragraphs.length} paragraphs)`
    );

    console.log('='.repeat(80) + '\n');

    return feedback;
  }

  /**
   * Collect paragraph-level feedback
   */
  private async collectParagraphFeedback(paragraphs: string[]): Promise<ParagraphFeedback[]> {
    const feedback: ParagraphFeedback[] = [];

    console.log(`\nCollecting feedback for ${paragraphs.length} paragraphs...`);

    for (let i = 0; i < paragraphs.length; i++) {
      console.log(`\nParagraph ${i + 1}:`);
      console.log(paragraphs[i].slice(0, 200) + (paragraphs[i].length > 200 ? '...' : ''));

      const rating = await this.promptForRating(`Rating (0-10, or 's' to skip)`);
      if (rating === undefined) {
        continue;
      }

      const paraFeedback: ParagraphFeedback = {
        paragraphIndex: i,
        text: paragraphs[i],
        rating: rating / 10,
      };

      // Optional detailed feedback
      const issues = await this.promptForList('Issues (optional, comma-separated)');
      if (issues.length > 0) {
        paraFeedback.issues = issues;
      }

      const suggestions = await this.promptForList('Suggestions (optional, comma-separated)');
      if (suggestions.length > 0) {
        paraFeedback.suggestions = suggestions;
      }

      feedback.push(paraFeedback);
    }

    return feedback;
  }

  /**
   * Get feedback for trajectory
   */
  getFeedback(trajectoryId: string): WriteFeedback | undefined {
    return this.feedbackHistory.get(trajectoryId);
  }

  /**
   * Get all feedback
   */
  getAllFeedback(): WriteFeedback[] {
    return Array.from(this.feedbackHistory.values());
  }

  /**
   * Analyze feedback patterns
   */
  analyzeFeedbackPatterns(): {
    avgRating: number;
    commonIssues: Map<string, number>;
    commonStrengths: Map<string, number>;
    totalFeedback: number;
  } {
    const all = this.getAllFeedback();
    if (all.length === 0) {
      return {
        avgRating: 0,
        commonIssues: new Map(),
        commonStrengths: new Map(),
        totalFeedback: 0,
      };
    }

    const avgRating = all.reduce((sum, f) => sum + f.overallRating, 0) / all.length;

    const commonIssues = new Map<string, number>();
    const commonStrengths = new Map<string, number>();

    for (const fb of all) {
      // Count paragraph issues
      for (const para of fb.paragraphs) {
        for (const issue of para.issues || []) {
          commonIssues.set(issue, (commonIssues.get(issue) || 0) + 1);
        }
      }

      // Count general improvements
      for (const imp of fb.improvements || []) {
        commonIssues.set(imp, (commonIssues.get(imp) || 0) + 1);
      }

      // Count strengths
      for (const str of fb.strengths || []) {
        commonStrengths.set(str, (commonStrengths.get(str) || 0) + 1);
      }
    }

    return {
      avgRating,
      commonIssues,
      commonStrengths,
      totalFeedback: all.length,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Prompt for rating
   */
  private async promptForRating(prompt: string): Promise<number | undefined> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${prompt}: `, (answer) => {
        rl.close();

        if (answer.toLowerCase() === 's') {
          resolve(undefined);
          return;
        }

        const rating = parseInt(answer.trim(), 10);
        if (isNaN(rating) || rating < 0 || rating > 10) {
          resolve(undefined);
        } else {
          resolve(rating);
        }
      });
    });
  }

  /**
   * Prompt for text
   */
  private async promptForText(prompt: string): Promise<string | undefined> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${prompt}: `, (answer) => {
        rl.close();
        const trimmed = answer.trim();
        resolve(trimmed.length > 0 ? trimmed : undefined);
      });
    });
  }

  /**
   * Prompt for list
   */
  private async promptForList(prompt: string): Promise<string[]> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${prompt}: `, (answer) => {
        rl.close();
        const items = answer
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        resolve(items);
      });
    });
  }

  /**
   * Update trajectory with feedback
   */
  private async updateTrajectory(feedback: WriteFeedback): Promise<void> {
    if (!this.trajectoryBridge) {
      return;
    }

    try {
      await this.trajectoryBridge.storeMetadata(feedback.trajectoryId, {
        detailedFeedback: {
          overallRating: feedback.overallRating,
          paragraphCount: feedback.paragraphs.length,
          avgParagraphRating:
            feedback.paragraphs.length > 0
              ? feedback.paragraphs.reduce((sum, p) => sum + p.rating, 0) / feedback.paragraphs.length
              : 0,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          generalComments: feedback.generalComments,
          timestamp: feedback.timestamp,
        },
      });

      // Submit to SonaEngine for learning
      await this.trajectoryBridge.submitFeedback(
        feedback.trajectoryId,
        feedback.overallRating,
        { notes: feedback.generalComments }
      );

      logger.log(LogLevel.DEBUG, `Updated trajectory ${feedback.trajectoryId} with feedback`);
    } catch (error) {
      logger.log(LogLevel.ERROR, `Failed to update trajectory: ${error}`);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a feedback learner
 */
export function createFeedbackLearner(
  trajectoryBridge?: TrajectoryBridge,
  options?: FeedbackOptions
): FeedbackLearner {
  return new FeedbackLearner(trajectoryBridge, options);
}
