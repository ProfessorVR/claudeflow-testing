/**
 * Error Recovery - Enhanced error handling for section orchestration
 *
 * Provides:
 * - Checkpoint/resume capability
 * - Retry logic with exponential backoff
 * - Intermediate state saving
 * - Graceful degradation
 * - Error aggregation and reporting
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { SectionContext } from './section-orchestrator.js';
import type { GauntletResult } from '../quality/quality-gauntlet.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Checkpoint state for section orchestration
 */
export interface SectionCheckpoint {
  /** Checkpoint ID */
  id: string;
  /** Chapter number */
  chapter: number;
  /** Section name */
  section: string;
  /** Current iteration */
  iteration: number;
  /** Current content */
  currentContent: string;
  /** Section context */
  context: SectionContext;
  /** Latest gauntlet result */
  gauntletResult?: GauntletResult;
  /** Timestamp */
  timestamp: string;
  /** Session ID */
  sessionId: string;
}

/**
 * Error record for logging and analysis
 */
export interface ErrorRecord {
  /** Error timestamp */
  timestamp: string;
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Operation context */
  context: string;
  /** Attempt number */
  attempt: number;
  /** Whether error was recovered */
  recovered: boolean;
}

/**
 * Recovery options
 */
export interface RecoveryOptions {
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Base delay for exponential backoff (ms) */
  baseDelay?: number;
  /** Maximum delay cap (ms) */
  maxDelay?: number;
  /** Enable checkpoint saving */
  enableCheckpoints?: boolean;
}

// ============================================================================
// Error Recovery Manager
// ============================================================================

/**
 * Manages error recovery and checkpointing for section orchestration
 */
export class ErrorRecoveryManager {
  private projectRoot: string;
  private checkpointDir: string;
  private errorLog: ErrorRecord[] = [];
  private options: Required<RecoveryOptions>;

  constructor(projectRoot: string, options: RecoveryOptions = {}) {
    this.projectRoot = projectRoot;
    this.checkpointDir = path.join(projectRoot, '.god-agent', 'checkpoints');
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      baseDelay: options.baseDelay ?? 1000,
      maxDelay: options.maxDelay ?? 30000,
      enableCheckpoints: options.enableCheckpoints ?? true,
    };
  }

  /**
   * Initialize recovery manager
   */
  async initialize(): Promise<void> {
    if (this.options.enableCheckpoints) {
      await fs.mkdir(this.checkpointDir, { recursive: true });
    }
  }

  /**
   * Execute operation with retry logic and error recovery
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    checkpointKey?: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await operation();

        // If we recovered from previous errors, log it
        if (attempt > 1) {
          this.logError({
            timestamp: new Date().toISOString(),
            message: `Operation succeeded after ${attempt} attempts`,
            context,
            attempt,
            recovered: true,
          });
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Log the error
        this.logError({
          timestamp: new Date().toISOString(),
          message: lastError.message,
          stack: lastError.stack,
          context,
          attempt,
          recovered: false,
        });

        // Try to restore from checkpoint if available
        if (checkpointKey && this.options.enableCheckpoints) {
          const checkpoint = await this.loadCheckpoint<T>(checkpointKey);
          if (checkpoint) {
            console.log(`Restored from checkpoint: ${checkpointKey}`);
            return checkpoint;
          }
        }

        // If not the last attempt, wait with exponential backoff
        if (attempt < this.options.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          console.warn(
            `Attempt ${attempt} failed, retrying in ${delay}ms... (${lastError.message})`
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Operation failed after ${this.options.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Save checkpoint for section orchestration
   */
  async saveCheckpoint(checkpoint: SectionCheckpoint): Promise<void> {
    if (!this.options.enableCheckpoints) {
      return;
    }

    const checkpointPath = this.getCheckpointPath(
      checkpoint.chapter,
      checkpoint.section,
      checkpoint.sessionId
    );

    await fs.mkdir(path.dirname(checkpointPath), { recursive: true });
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));

    console.log(`Checkpoint saved: ${checkpointPath}`);
  }

  /**
   * Load checkpoint from disk
   */
  async loadCheckpoint<T>(key: string): Promise<T | null> {
    if (!this.options.enableCheckpoints) {
      return null;
    }

    try {
      const checkpointPath = path.join(this.checkpointDir, `${key}.json`);
      const data = await fs.readFile(checkpointPath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      // Checkpoint doesn't exist or is corrupted
      return null;
    }
  }

  /**
   * Resume from most recent checkpoint for a section
   */
  async resumeFromCheckpoint(
    chapter: number,
    section: string,
    sessionId: string
  ): Promise<SectionCheckpoint | null> {
    if (!this.options.enableCheckpoints) {
      return null;
    }

    try {
      const checkpointPath = this.getCheckpointPath(chapter, section, sessionId);
      const data = await fs.readFile(checkpointPath, 'utf-8');
      const checkpoint = JSON.parse(data) as SectionCheckpoint;

      console.log(`Resumed from checkpoint: ${checkpointPath}`);
      console.log(`  Iteration: ${checkpoint.iteration}`);
      console.log(`  Timestamp: ${checkpoint.timestamp}`);

      return checkpoint;
    } catch (error) {
      return null;
    }
  }

  /**
   * List all checkpoints for a chapter
   */
  async listCheckpoints(chapter: number): Promise<SectionCheckpoint[]> {
    if (!this.options.enableCheckpoints) {
      return [];
    }

    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpoints: SectionCheckpoint[] = [];

      for (const file of files) {
        if (file.startsWith(`ch${chapter}-`) && file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.checkpointDir, file), 'utf-8');
          checkpoints.push(JSON.parse(data));
        }
      }

      // Sort by timestamp (most recent first)
      return checkpoints.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Clean old checkpoints
   */
  async cleanCheckpoints(olderThanDays: number = 7): Promise<number> {
    if (!this.options.enableCheckpoints) {
      return 0;
    }

    try {
      const files = await fs.readdir(this.checkpointDir);
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
      let removed = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.checkpointDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const checkpoint = JSON.parse(data) as SectionCheckpoint;

          if (new Date(checkpoint.timestamp).getTime() < cutoffTime) {
            await fs.unlink(filePath);
            removed++;
          }
        }
      }

      return removed;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    recoveredErrors: number;
    failedErrors: number;
    errorsByContext: Map<string, number>;
    recentErrors: ErrorRecord[];
  } {
    const errorsByContext = new Map<string, number>();

    for (const error of this.errorLog) {
      const count = errorsByContext.get(error.context) || 0;
      errorsByContext.set(error.context, count + 1);
    }

    return {
      totalErrors: this.errorLog.length,
      recoveredErrors: this.errorLog.filter(e => e.recovered).length,
      failedErrors: this.errorLog.filter(e => !e.recovered).length,
      errorsByContext,
      recentErrors: this.errorLog.slice(-10),
    };
  }

  /**
   * Generate error report
   */
  generateErrorReport(): string {
    const stats = this.getErrorStats();
    const lines: string[] = [];

    lines.push('=== ERROR RECOVERY REPORT ===');
    lines.push('');
    lines.push(`Total Errors: ${stats.totalErrors}`);
    lines.push(`Recovered: ${stats.recoveredErrors}`);
    lines.push(`Failed: ${stats.failedErrors}`);
    lines.push(`Recovery Rate: ${stats.totalErrors > 0 ? ((stats.recoveredErrors / stats.totalErrors) * 100).toFixed(1) : 0}%`);
    lines.push('');

    if (stats.errorsByContext.size > 0) {
      lines.push('Errors by Context:');
      for (const [context, count] of stats.errorsByContext.entries()) {
        lines.push(`  ${context}: ${count}`);
      }
      lines.push('');
    }

    if (stats.recentErrors.length > 0) {
      lines.push('Recent Errors:');
      for (const error of stats.recentErrors) {
        lines.push(`  [${error.timestamp}] ${error.context} (attempt ${error.attempt})`);
        lines.push(`    ${error.message}`);
        if (error.recovered) {
          lines.push(`    ✓ Recovered`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Export error log
   */
  async exportErrorLog(outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(this.errorLog, null, 2));
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getCheckpointPath(chapter: number, section: string, sessionId: string): string {
    const safeSectionName = section.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return path.join(
      this.checkpointDir,
      `ch${chapter}-${safeSectionName}-${sessionId}.json`
    );
  }

  private calculateBackoff(attempt: number): number {
    const delay = Math.min(
      this.options.baseDelay * Math.pow(2, attempt - 1),
      this.options.maxDelay
    );
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.round(delay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logError(record: ErrorRecord): void {
    this.errorLog.push(record);

    // Keep log size manageable (last 1000 entries)
    if (this.errorLog.length > 1000) {
      this.errorLog.shift();
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create error recovery manager with default options
 */
export function createErrorRecoveryManager(
  projectRoot: string,
  options?: RecoveryOptions
): ErrorRecoveryManager {
  return new ErrorRecoveryManager(projectRoot, options);
}

/**
 * Create error recovery manager with aggressive retry settings
 */
export function createAggressiveRecoveryManager(
  projectRoot: string
): ErrorRecoveryManager {
  return new ErrorRecoveryManager(projectRoot, {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 15000,
    enableCheckpoints: true,
  });
}

/**
 * Create error recovery manager with conservative settings
 */
export function createConservativeRecoveryManager(
  projectRoot: string
): ErrorRecoveryManager {
  return new ErrorRecoveryManager(projectRoot, {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 10000,
    enableCheckpoints: true,
  });
}
