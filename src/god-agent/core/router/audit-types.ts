/**
 * Audit System Types
 *
 * Implements TIER-2.1: Intelligent Model Router - Audit Layer
 *
 * Defines types for:
 * - Audit entries for non-Claude model changes
 * - Review queue management
 * - File modification tracking
 * - Review status workflow
 */

import type { TaskType, Complexity, ProviderType } from './router-types.js';

// ===== REVIEW STATUS =====

/**
 * Status of an audit entry in the review workflow
 */
export type ReviewStatus =
  | 'pending'      // Awaiting review
  | 'in_review'    // Currently being reviewed
  | 'approved'     // Approved, no changes needed
  | 'rejected'     // Rejected, changes should be reverted
  | 'fixed'        // Issues fixed by Claude
  | 'skipped';     // Skipped review (user override)

/**
 * Priority level for review queue
 */
export type ReviewPriority = 'low' | 'medium' | 'high' | 'critical';

// ===== FILE MODIFICATION =====

/**
 * Represents a file modification made by a non-Claude model
 */
export interface FileModification {
  /** Absolute path to the file */
  filePath: string;
  /** Type of modification */
  modificationType: 'created' | 'modified' | 'deleted' | 'renamed';
  /** Original file path (for renames) */
  originalPath?: string;
  /** Lines added */
  linesAdded: number;
  /** Lines removed */
  linesRemoved: number;
  /** Git diff for this file */
  diff: string;
  /** File content before change (if modified/deleted) */
  beforeContent?: string;
  /** File content after change (if created/modified) */
  afterContent?: string;
}

// ===== AUDIT ENTRY =====

/**
 * Complete audit entry for a non-Claude model operation
 */
export interface AuditEntry {
  /** Unique identifier */
  id: string;
  /** When the operation occurred */
  timestamp: Date;
  /** Session ID for grouping related entries */
  sessionId: string;

  // Task Classification
  /** Type of task performed */
  taskType: TaskType;
  /** Complexity of the task */
  complexity: Complexity;
  /** Risk level assessed */
  riskLevel: 'low' | 'medium' | 'high';

  // Model Information
  /** Provider that performed the operation */
  provider: ProviderType;
  /** Specific model used */
  modelId: string;
  /** Model display name */
  modelName: string;

  // Request Context
  /** Original user prompt */
  originalPrompt: string;
  /** System prompt used (if any) */
  systemPrompt?: string;
  /** Why this model was selected */
  routingReason: string;
  /** Fallback chain that was available */
  fallbackChain: string[];
  /** Whether this was a manual override */
  wasOverride: boolean;

  // Response
  /** Model's response */
  response: string;
  /** Token usage */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Cost of the operation */
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
  /** Response latency in ms */
  latencyMs: number;

  // File Changes
  /** Files modified by this operation */
  filesModified: FileModification[];
  /** Summary of all changes */
  diffSummary: string;
  /** Full unified diff */
  fullDiff: string;
  /** Git commit hash (if committed) */
  commitHash?: string;

  // Review Status
  /** Current review status */
  reviewStatus: ReviewStatus;
  /** Review priority */
  priority: ReviewPriority;
  /** Who reviewed (if reviewed) */
  reviewedBy?: string;
  /** When reviewed */
  reviewedAt?: Date;
  /** Review notes */
  reviewNotes?: string;
  /** Issues found during review */
  issuesFound?: string[];
  /** Fix applied (if fixed) */
  fixApplied?: string;

  // Metadata
  /** Tags for categorization */
  tags: string[];
  /** Parent entry ID (for related operations) */
  parentEntryId?: string;
  /** Child entry IDs */
  childEntryIds: string[];
}

// ===== REVIEW QUEUE =====

/**
 * Summary statistics for the review queue
 */
export interface ReviewQueueStats {
  /** Total entries in queue */
  totalEntries: number;
  /** Entries by status */
  byStatus: Record<ReviewStatus, number>;
  /** Entries by priority */
  byPriority: Record<ReviewPriority, number>;
  /** Entries by provider */
  byProvider: Record<string, number>;
  /** Total files modified */
  totalFilesModified: number;
  /** Total lines changed */
  totalLinesChanged: number;
  /** Oldest pending entry */
  oldestPending?: Date;
  /** Most recent entry */
  mostRecent?: Date;
}

/**
 * Filter options for querying audit entries
 */
export interface AuditFilter {
  /** Filter by status */
  status?: ReviewStatus | ReviewStatus[];
  /** Filter by priority */
  priority?: ReviewPriority | ReviewPriority[];
  /** Filter by provider */
  provider?: ProviderType | ProviderType[];
  /** Filter by model */
  modelId?: string | string[];
  /** Filter by task type */
  taskType?: TaskType | TaskType[];
  /** Filter by date range */
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  /** Filter by session */
  sessionId?: string;
  /** Filter by tags */
  tags?: string[];
  /** Search in prompt/response */
  searchText?: string;
  /** Filter by file path pattern */
  filePattern?: string;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort field */
  sortBy?: 'timestamp' | 'priority' | 'status' | 'provider';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result of a review action
 */
export interface ReviewResult {
  /** Entry that was reviewed */
  entryId: string;
  /** New status after review */
  newStatus: ReviewStatus;
  /** Who performed the review */
  reviewer: string;
  /** When the review occurred */
  reviewedAt: Date;
  /** Notes from the review */
  notes?: string;
  /** Issues found */
  issues?: string[];
  /** Whether rollback was performed */
  rolledBack: boolean;
  /** Whether fix was applied */
  fixApplied: boolean;
  /** Error if review failed */
  error?: string;
}

// ===== AUDIT EVENTS =====

/**
 * Events emitted by the audit system
 */
export type AuditEventType =
  | 'entry_created'
  | 'entry_updated'
  | 'review_started'
  | 'review_completed'
  | 'rollback_performed'
  | 'fix_applied'
  | 'queue_threshold_reached';

/**
 * Audit system event
 */
export interface AuditEvent {
  type: AuditEventType;
  timestamp: Date;
  entryId?: string;
  data: Record<string, unknown>;
}

/**
 * Handler for audit events
 */
export type AuditEventHandler = (event: AuditEvent) => void | Promise<void>;

// ===== CONFIGURATION =====

/**
 * Configuration for the audit system
 */
export interface AuditConfig {
  /** Enable audit logging */
  enabled: boolean;
  /** Storage backend */
  storage: 'memory' | 'file' | 'sqlite';
  /** Path for file/sqlite storage */
  storagePath?: string;
  /** Auto-archive entries older than this (days) */
  archiveAfterDays?: number;
  /** Maximum entries to keep in memory */
  maxMemoryEntries?: number;
  /** Alert thresholds */
  alerts?: {
    /** Alert when pending count exceeds this */
    pendingThreshold?: number;
    /** Alert when high priority count exceeds this */
    highPriorityThreshold?: number;
    /** Alert on any critical priority entry */
    alertOnCritical?: boolean;
  };
  /** Providers to always audit */
  alwaysAudit?: ProviderType[];
  /** Providers to never audit */
  neverAudit?: ProviderType[];
  /** Skip audit for these task types */
  skipTaskTypes?: TaskType[];
}

// ===== ROLLBACK =====

/**
 * Rollback options for reverting changes
 */
export interface RollbackOptions {
  /** Entry to rollback */
  entryId: string;
  /** Create backup before rollback */
  createBackup?: boolean;
  /** Only rollback specific files */
  onlyFiles?: string[];
  /** Dry run (don't actually rollback) */
  dryRun?: boolean;
  /** Reason for rollback */
  reason?: string;
}

/**
 * Result of a rollback operation
 */
export interface RollbackResult {
  /** Whether rollback succeeded */
  success: boolean;
  /** Files that were rolled back */
  filesRolledBack: string[];
  /** Files that failed to rollback */
  filesFailed: string[];
  /** Backup created (if any) */
  backupPath?: string;
  /** Error message (if failed) */
  error?: string;
  /** Warnings during rollback */
  warnings: string[];
}

// ===== UTILITY TYPES =====

/**
 * Create audit entry input (before ID/timestamp assigned)
 */
export type CreateAuditEntryInput = Omit<
  AuditEntry,
  'id' | 'timestamp' | 'reviewStatus' | 'priority' | 'childEntryIds'
> & {
  reviewStatus?: ReviewStatus;
  priority?: ReviewPriority;
};

/**
 * Update audit entry input
 */
export type UpdateAuditEntryInput = Partial<
  Pick<
    AuditEntry,
    | 'reviewStatus'
    | 'priority'
    | 'reviewedBy'
    | 'reviewedAt'
    | 'reviewNotes'
    | 'issuesFound'
    | 'fixApplied'
    | 'tags'
    | 'commitHash'
  >
>;

/**
 * Audit entry summary (for listing)
 */
export interface AuditEntrySummary {
  id: string;
  timestamp: Date;
  provider: ProviderType;
  modelName: string;
  taskType: TaskType;
  complexity: Complexity;
  filesCount: number;
  linesChanged: number;
  reviewStatus: ReviewStatus;
  priority: ReviewPriority;
  promptPreview: string;
}
