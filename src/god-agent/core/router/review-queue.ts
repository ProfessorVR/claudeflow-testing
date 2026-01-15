/**
 * Review Queue
 *
 * Implements TIER-2.1: Intelligent Model Router - Review Layer
 *
 * Provides:
 * - Queue management for pending reviews
 * - Review workflow (approve/reject/fix)
 * - Rollback capabilities
 * - Claude-based review and fixing
 * - Batch review operations
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import {
  AuditLogger,
  getAuditLogger,
  formatAuditEntry,
} from './audit-logger.js';
import type {
  AuditEntry,
  AuditEntrySummary,
  AuditFilter,
  ReviewStatus,
  ReviewPriority,
  ReviewResult,
  ReviewQueueStats,
  RollbackOptions,
  RollbackResult,
  UpdateAuditEntryInput,
} from './audit-types.js';

// ===== REVIEW QUEUE CONFIGURATION =====

/**
 * Configuration for the review queue
 */
export interface ReviewQueueConfig {
  /** Working directory for git operations */
  workingDirectory?: string;
  /** Backup directory for rollbacks */
  backupDirectory?: string;
  /** Auto-approve low-priority entries after this many days */
  autoApproveAfterDays?: number;
  /** Max entries to show in list */
  defaultListLimit?: number;
  /** Enable git operations */
  enableGitOperations?: boolean;
}

const DEFAULT_CONFIG: Required<ReviewQueueConfig> = {
  workingDirectory: process.cwd(),
  backupDirectory: '.god-agent/backups',
  autoApproveAfterDays: 0, // Disabled by default
  defaultListLimit: 20,
  enableGitOperations: true,
};

// ===== REVIEW QUEUE =====

/**
 * Review queue for managing non-Claude model changes
 */
export class ReviewQueue {
  private readonly config: Required<ReviewQueueConfig>;
  private readonly logger: AuditLogger;

  constructor(config: Partial<ReviewQueueConfig> = {}, logger?: AuditLogger) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger ?? getAuditLogger();
  }

  // ===== QUEUE OPERATIONS =====

  /**
   * Get queue statistics
   */
  getStats(): ReviewQueueStats {
    return this.logger.getQueueStats();
  }

  /**
   * Get pending review count
   */
  getPendingCount(): number {
    return this.logger.getPendingCount();
  }

  /**
   * List entries in the queue
   */
  list(filter: AuditFilter = {}): AuditEntrySummary[] {
    const mergedFilter: AuditFilter = {
      limit: this.config.defaultListLimit,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      ...filter,
    };

    return this.logger.getEntrySummaries(mergedFilter);
  }

  /**
   * List pending entries
   */
  listPending(limit?: number): AuditEntrySummary[] {
    return this.list({
      status: 'pending',
      limit: limit ?? this.config.defaultListLimit,
      sortBy: 'priority',
      sortOrder: 'desc',
    });
  }

  /**
   * List entries by priority
   */
  listByPriority(priority: ReviewPriority, limit?: number): AuditEntrySummary[] {
    return this.list({
      priority,
      status: 'pending',
      limit: limit ?? this.config.defaultListLimit,
    });
  }

  /**
   * Get entries needing immediate attention
   */
  getUrgent(): AuditEntry[] {
    return this.logger.getEntriesNeedingAttention();
  }

  /**
   * Get a specific entry with full details
   */
  getEntry(entryId: string): AuditEntry | undefined {
    return this.logger.getEntry(entryId);
  }

  /**
   * Get the diff for an entry
   */
  getDiff(entryId: string): string | null {
    const entry = this.logger.getEntry(entryId);
    if (!entry) return null;
    return entry.fullDiff;
  }

  // ===== REVIEW ACTIONS =====

  /**
   * Start reviewing an entry
   */
  async startReview(entryId: string, reviewer: string): Promise<ReviewResult> {
    const entry = this.logger.getEntry(entryId);
    if (!entry) {
      return {
        entryId,
        newStatus: 'pending',
        reviewer,
        reviewedAt: new Date(),
        rolledBack: false,
        fixApplied: false,
        error: `Entry ${entryId} not found`,
      };
    }

    await this.logger.updateEntry(entryId, {
      reviewStatus: 'in_review',
      reviewedBy: reviewer,
    });

    return {
      entryId,
      newStatus: 'in_review',
      reviewer,
      reviewedAt: new Date(),
      rolledBack: false,
      fixApplied: false,
    };
  }

  /**
   * Approve an entry
   */
  async approve(
    entryId: string,
    reviewer: string,
    notes?: string
  ): Promise<ReviewResult> {
    const entry = this.logger.getEntry(entryId);
    if (!entry) {
      return {
        entryId,
        newStatus: 'pending',
        reviewer,
        reviewedAt: new Date(),
        rolledBack: false,
        fixApplied: false,
        error: `Entry ${entryId} not found`,
      };
    }

    const reviewedAt = new Date();

    await this.logger.updateEntry(entryId, {
      reviewStatus: 'approved',
      reviewedBy: reviewer,
      reviewedAt,
      reviewNotes: notes,
    });

    return {
      entryId,
      newStatus: 'approved',
      reviewer,
      reviewedAt,
      notes,
      rolledBack: false,
      fixApplied: false,
    };
  }

  /**
   * Reject an entry and optionally rollback
   */
  async reject(
    entryId: string,
    reviewer: string,
    options: {
      notes?: string;
      issues?: string[];
      rollback?: boolean;
    } = {}
  ): Promise<ReviewResult> {
    const entry = this.logger.getEntry(entryId);
    if (!entry) {
      return {
        entryId,
        newStatus: 'pending',
        reviewer,
        reviewedAt: new Date(),
        rolledBack: false,
        fixApplied: false,
        error: `Entry ${entryId} not found`,
      };
    }

    const reviewedAt = new Date();
    let rolledBack = false;
    let rollbackError: string | undefined;

    // Perform rollback if requested
    if (options.rollback) {
      const rollbackResult = await this.rollback({
        entryId,
        createBackup: true,
        reason: options.notes ?? 'Rejected during review',
      });

      rolledBack = rollbackResult.success;
      if (!rollbackResult.success) {
        rollbackError = rollbackResult.error;
      }
    }

    await this.logger.updateEntry(entryId, {
      reviewStatus: 'rejected',
      reviewedBy: reviewer,
      reviewedAt,
      reviewNotes: options.notes,
      issuesFound: options.issues,
    });

    return {
      entryId,
      newStatus: 'rejected',
      reviewer,
      reviewedAt,
      notes: options.notes,
      issues: options.issues,
      rolledBack,
      fixApplied: false,
      error: rollbackError,
    };
  }

  /**
   * Mark entry as fixed (after Claude fixed issues)
   */
  async markFixed(
    entryId: string,
    reviewer: string,
    fixDescription: string
  ): Promise<ReviewResult> {
    const entry = this.logger.getEntry(entryId);
    if (!entry) {
      return {
        entryId,
        newStatus: 'pending',
        reviewer,
        reviewedAt: new Date(),
        rolledBack: false,
        fixApplied: false,
        error: `Entry ${entryId} not found`,
      };
    }

    const reviewedAt = new Date();

    await this.logger.updateEntry(entryId, {
      reviewStatus: 'fixed',
      reviewedBy: reviewer,
      reviewedAt,
      fixApplied: fixDescription,
    });

    return {
      entryId,
      newStatus: 'fixed',
      reviewer,
      reviewedAt,
      rolledBack: false,
      fixApplied: true,
    };
  }

  /**
   * Skip review for an entry
   */
  async skip(
    entryId: string,
    reviewer: string,
    reason?: string
  ): Promise<ReviewResult> {
    const entry = this.logger.getEntry(entryId);
    if (!entry) {
      return {
        entryId,
        newStatus: 'pending',
        reviewer,
        reviewedAt: new Date(),
        rolledBack: false,
        fixApplied: false,
        error: `Entry ${entryId} not found`,
      };
    }

    const reviewedAt = new Date();

    await this.logger.updateEntry(entryId, {
      reviewStatus: 'skipped',
      reviewedBy: reviewer,
      reviewedAt,
      reviewNotes: reason ?? 'Skipped by user',
    });

    return {
      entryId,
      newStatus: 'skipped',
      reviewer,
      reviewedAt,
      notes: reason,
      rolledBack: false,
      fixApplied: false,
    };
  }

  /**
   * Update entry priority
   */
  async updatePriority(
    entryId: string,
    priority: ReviewPriority
  ): Promise<boolean> {
    const result = await this.logger.updateEntry(entryId, { priority });
    return result !== null;
  }

  /**
   * Add tags to an entry
   */
  async addTags(entryId: string, tags: string[]): Promise<boolean> {
    const entry = this.logger.getEntry(entryId);
    if (!entry) return false;

    const newTags = [...new Set([...entry.tags, ...tags])];
    const result = await this.logger.updateEntry(entryId, { tags: newTags });
    return result !== null;
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Approve multiple entries
   */
  async batchApprove(
    entryIds: string[],
    reviewer: string,
    notes?: string
  ): Promise<Map<string, ReviewResult>> {
    const results = new Map<string, ReviewResult>();

    for (const entryId of entryIds) {
      const result = await this.approve(entryId, reviewer, notes);
      results.set(entryId, result);
    }

    return results;
  }

  /**
   * Skip multiple entries
   */
  async batchSkip(
    entryIds: string[],
    reviewer: string,
    reason?: string
  ): Promise<Map<string, ReviewResult>> {
    const results = new Map<string, ReviewResult>();

    for (const entryId of entryIds) {
      const result = await this.skip(entryId, reviewer, reason);
      results.set(entryId, result);
    }

    return results;
  }

  /**
   * Auto-approve old low-priority entries
   */
  async autoApproveOld(): Promise<number> {
    if (!this.config.autoApproveAfterDays) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.autoApproveAfterDays);

    const oldEntries = this.logger.queryEntries({
      status: 'pending',
      priority: 'low',
      dateRange: { end: cutoffDate },
    });

    for (const entry of oldEntries) {
      await this.approve(entry.id, 'auto', 'Auto-approved due to age');
    }

    return oldEntries.length;
  }

  // ===== ROLLBACK OPERATIONS =====

  /**
   * Rollback changes from an entry
   */
  async rollback(options: RollbackOptions): Promise<RollbackResult> {
    const entry = this.logger.getEntry(options.entryId);
    if (!entry) {
      return {
        success: false,
        filesRolledBack: [],
        filesFailed: [],
        error: `Entry ${options.entryId} not found`,
        warnings: [],
      };
    }

    if (!this.config.enableGitOperations) {
      return {
        success: false,
        filesRolledBack: [],
        filesFailed: [],
        error: 'Git operations are disabled',
        warnings: [],
      };
    }

    const warnings: string[] = [];
    const filesRolledBack: string[] = [];
    const filesFailed: string[] = [];
    let backupPath: string | undefined;

    // Create backup if requested
    if (options.createBackup && !options.dryRun) {
      const backup = await this.createBackup(entry);
      backupPath = backup ?? undefined;
      if (!backupPath) {
        warnings.push('Failed to create backup, proceeding anyway');
      }
    }

    // Filter files if specific files requested
    let filesToRollback = entry.filesModified;
    if (options.onlyFiles) {
      filesToRollback = filesToRollback.filter(f =>
        options.onlyFiles!.includes(f.filePath)
      );
    }

    // Perform rollback for each file
    for (const file of filesToRollback) {
      try {
        if (options.dryRun) {
          filesRolledBack.push(file.filePath);
          continue;
        }

        if (file.modificationType === 'created') {
          // Delete created file
          await this.gitCheckout(file.filePath, 'HEAD~1');
        } else if (file.modificationType === 'deleted') {
          // Restore deleted file
          await this.gitCheckout(file.filePath, 'HEAD~1');
        } else if (file.modificationType === 'modified') {
          // Restore previous version
          if (file.beforeContent) {
            writeFileSync(file.filePath, file.beforeContent);
          } else {
            await this.gitCheckout(file.filePath, 'HEAD~1');
          }
        } else if (file.modificationType === 'renamed' && file.originalPath) {
          // Restore original path
          await this.gitMove(file.filePath, file.originalPath);
        }

        filesRolledBack.push(file.filePath);
      } catch (error) {
        filesFailed.push(file.filePath);
        warnings.push(`Failed to rollback ${file.filePath}: ${error}`);
      }
    }

    const success = filesFailed.length === 0 && filesRolledBack.length > 0;

    return {
      success,
      filesRolledBack,
      filesFailed,
      backupPath,
      warnings,
      error: success ? undefined : 'Some files failed to rollback',
    };
  }

  /**
   * Create a backup before rollback
   */
  private async createBackup(entry: AuditEntry): Promise<string | null> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = join(
        this.config.backupDirectory,
        `rollback-${entry.id.slice(0, 8)}-${timestamp}`
      );

      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
      }

      // Copy current versions of files
      for (const file of entry.filesModified) {
        if (existsSync(file.filePath)) {
          const destPath = join(backupDir, file.filePath);
          const destDir = dirname(destPath);
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          const content = readFileSync(file.filePath);
          writeFileSync(destPath, content);
        }
      }

      // Save entry metadata
      writeFileSync(
        join(backupDir, 'entry.json'),
        JSON.stringify(entry, null, 2)
      );

      return backupDir;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * Git checkout a file to a specific revision
   */
  private async gitCheckout(filePath: string, revision: string): Promise<void> {
    execSync(`git checkout ${revision} -- "${filePath}"`, {
      cwd: this.config.workingDirectory,
      encoding: 'utf-8',
    });
  }

  /**
   * Git move a file
   */
  private async gitMove(from: string, to: string): Promise<void> {
    execSync(`git mv "${from}" "${to}"`, {
      cwd: this.config.workingDirectory,
      encoding: 'utf-8',
    });
  }

  // ===== DISPLAY HELPERS =====

  /**
   * Format entry for display
   */
  formatEntry(entryId: string): string | null {
    const entry = this.logger.getEntry(entryId);
    if (!entry) return null;
    return formatAuditEntry(entry);
  }

  /**
   * Format queue summary for display
   */
  formatQueueSummary(): string {
    const stats = this.getStats();
    const lines = [
      '=== Review Queue Summary ===',
      '',
      `Total Entries: ${stats.totalEntries}`,
      `Pending: ${stats.byStatus.pending}`,
      `In Review: ${stats.byStatus.in_review}`,
      `Approved: ${stats.byStatus.approved}`,
      `Rejected: ${stats.byStatus.rejected}`,
      `Fixed: ${stats.byStatus.fixed}`,
      `Skipped: ${stats.byStatus.skipped}`,
      '',
      'By Priority:',
      `  Critical: ${stats.byPriority.critical}`,
      `  High: ${stats.byPriority.high}`,
      `  Medium: ${stats.byPriority.medium}`,
      `  Low: ${stats.byPriority.low}`,
      '',
      `Files Modified: ${stats.totalFilesModified}`,
      `Lines Changed: ${stats.totalLinesChanged}`,
    ];

    if (stats.oldestPending) {
      lines.push(`Oldest Pending: ${stats.oldestPending.toISOString()}`);
    }

    return lines.join('\n');
  }

  /**
   * Format pending list for display
   */
  formatPendingList(limit?: number): string {
    const pending = this.listPending(limit);

    if (pending.length === 0) {
      return 'No pending reviews.';
    }

    const lines = [
      '=== Pending Reviews ===',
      '',
      'ID        | Priority | Model           | Task      | Files | Prompt Preview',
      '----------|----------|-----------------|-----------|-------|---------------',
    ];

    for (const entry of pending) {
      const id = entry.id.slice(0, 8);
      const priority = entry.priority.padEnd(8);
      const model = entry.modelName.slice(0, 15).padEnd(15);
      const task = entry.taskType.slice(0, 9).padEnd(9);
      const files = String(entry.filesCount).padStart(5);
      const prompt = entry.promptPreview.slice(0, 40);

      lines.push(`${id} | ${priority} | ${model} | ${task} | ${files} | ${prompt}`);
    }

    return lines.join('\n');
  }
}

// ===== SINGLETON INSTANCE =====

let queueInstance: ReviewQueue | null = null;

/**
 * Get the singleton review queue instance
 */
export function getReviewQueue(
  config?: Partial<ReviewQueueConfig>,
  logger?: AuditLogger
): ReviewQueue {
  if (!queueInstance) {
    queueInstance = new ReviewQueue(config, logger);
  }
  return queueInstance;
}

/**
 * Reset the review queue singleton
 */
export function resetReviewQueue(): void {
  queueInstance = null;
}

// ===== CLI HELPERS =====

/**
 * Parse review command arguments
 */
export interface ReviewCommand {
  action: 'list' | 'show' | 'approve' | 'reject' | 'fix' | 'skip' | 'diff' | 'stats';
  entryId?: string;
  options?: {
    limit?: number;
    priority?: ReviewPriority;
    notes?: string;
    rollback?: boolean;
    all?: boolean;
  };
}

/**
 * Execute a review command
 */
export async function executeReviewCommand(
  cmd: ReviewCommand,
  reviewer: string = 'user'
): Promise<string> {
  const queue = getReviewQueue();

  switch (cmd.action) {
    case 'list':
      return queue.formatPendingList(cmd.options?.limit);

    case 'stats':
      return queue.formatQueueSummary();

    case 'show':
      if (!cmd.entryId) return 'Error: Entry ID required';
      return queue.formatEntry(cmd.entryId) ?? `Entry ${cmd.entryId} not found`;

    case 'diff':
      if (!cmd.entryId) return 'Error: Entry ID required';
      return queue.getDiff(cmd.entryId) ?? `Entry ${cmd.entryId} not found`;

    case 'approve':
      if (!cmd.entryId) return 'Error: Entry ID required';
      const approveResult = await queue.approve(cmd.entryId, reviewer, cmd.options?.notes);
      return approveResult.error ?? `Entry ${cmd.entryId} approved`;

    case 'reject':
      if (!cmd.entryId) return 'Error: Entry ID required';
      const rejectResult = await queue.reject(cmd.entryId, reviewer, {
        notes: cmd.options?.notes,
        rollback: cmd.options?.rollback,
      });
      return rejectResult.error ?? `Entry ${cmd.entryId} rejected${rejectResult.rolledBack ? ' (rolled back)' : ''}`;

    case 'fix':
      if (!cmd.entryId) return 'Error: Entry ID required';
      const fixResult = await queue.markFixed(
        cmd.entryId,
        reviewer,
        cmd.options?.notes ?? 'Fixed'
      );
      return fixResult.error ?? `Entry ${cmd.entryId} marked as fixed`;

    case 'skip':
      if (!cmd.entryId) return 'Error: Entry ID required';
      const skipResult = await queue.skip(cmd.entryId, reviewer, cmd.options?.notes);
      return skipResult.error ?? `Entry ${cmd.entryId} skipped`;

    default:
      return `Unknown action: ${cmd.action}`;
  }
}
