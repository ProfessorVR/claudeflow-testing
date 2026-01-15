/**
 * Audit Logger
 *
 * Implements TIER-2.1: Intelligent Model Router - Audit Layer
 *
 * Provides:
 * - Logging of all non-Claude model operations
 * - File modification tracking with diffs
 * - Priority assignment based on risk
 * - Event emission for monitoring
 * - Storage backends (memory, file, sqlite)
 */

import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { dirname, join } from 'path';
import type {
  AuditEntry,
  AuditEntrySummary,
  AuditConfig,
  AuditFilter,
  AuditEvent,
  AuditEventHandler,
  AuditEventType,
  CreateAuditEntryInput,
  UpdateAuditEntryInput,
  FileModification,
  ReviewStatus,
  ReviewPriority,
  ReviewQueueStats,
} from './audit-types.js';
import type { ProviderType, TaskType, Complexity } from './router-types.js';

// ===== DEFAULT CONFIGURATION =====

const DEFAULT_CONFIG: Required<AuditConfig> = {
  enabled: true,
  storage: 'memory',
  storagePath: '.god-agent/audit',
  archiveAfterDays: 30,
  maxMemoryEntries: 1000,
  alerts: {
    pendingThreshold: 50,
    highPriorityThreshold: 10,
    alertOnCritical: true,
  },
  alwaysAudit: [],
  neverAudit: ['anthropic'], // Don't audit Claude operations
  skipTaskTypes: [],
};

// ===== AUDIT LOGGER =====

/**
 * Audit logger for tracking non-Claude model operations
 */
export class AuditLogger {
  private readonly config: Required<AuditConfig>;
  private readonly entries: Map<string, AuditEntry> = new Map();
  private readonly eventHandlers: Map<AuditEventType, Set<AuditEventHandler>> = new Map();
  private currentSessionId: string;
  private initialized = false;

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentSessionId = randomUUID();

    if (this.config.storage !== 'memory') {
      this.ensureStorageDirectory();
    }
  }

  /**
   * Initialize the audit logger
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.storage === 'file') {
      await this.loadFromFile();
    }

    this.initialized = true;
  }

  /**
   * Check if a provider should be audited
   */
  shouldAudit(provider: ProviderType, taskType?: TaskType): boolean {
    if (!this.config.enabled) return false;

    // Check never audit list
    if (this.config.neverAudit.includes(provider)) return false;

    // Check always audit list
    if (this.config.alwaysAudit.includes(provider)) return true;

    // Check skip task types
    if (taskType && this.config.skipTaskTypes.includes(taskType)) return false;

    // Default: audit non-Anthropic providers
    return provider !== 'anthropic';
  }

  /**
   * Create a new audit entry
   */
  async createEntry(input: CreateAuditEntryInput): Promise<AuditEntry> {
    const entry: AuditEntry = {
      ...input,
      id: randomUUID(),
      timestamp: new Date(),
      reviewStatus: input.reviewStatus ?? 'pending',
      priority: input.priority ?? this.calculatePriority(input),
      childEntryIds: [],
    };

    // Store entry
    this.entries.set(entry.id, entry);

    // Enforce memory limit
    if (this.config.storage === 'memory' && this.entries.size > this.config.maxMemoryEntries) {
      this.pruneOldEntries();
    }

    // Persist if using file storage
    if (this.config.storage === 'file') {
      await this.persistEntry(entry);
    }

    // Emit event
    await this.emit('entry_created', { entryId: entry.id, entry });

    // Check alert thresholds
    await this.checkAlertThresholds();

    return entry;
  }

  /**
   * Update an existing audit entry
   */
  async updateEntry(entryId: string, updates: UpdateAuditEntryInput): Promise<AuditEntry | null> {
    const entry = this.entries.get(entryId);
    if (!entry) return null;

    const updatedEntry: AuditEntry = {
      ...entry,
      ...updates,
    };

    this.entries.set(entryId, updatedEntry);

    if (this.config.storage === 'file') {
      await this.persistEntry(updatedEntry);
    }

    await this.emit('entry_updated', { entryId, updates });

    return updatedEntry;
  }

  /**
   * Get an entry by ID
   */
  getEntry(entryId: string): AuditEntry | undefined {
    return this.entries.get(entryId);
  }

  /**
   * Query entries with filters
   */
  queryEntries(filter: AuditFilter = {}): AuditEntry[] {
    let results = Array.from(this.entries.values());

    // Apply filters
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      results = results.filter(e => statuses.includes(e.reviewStatus));
    }

    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      results = results.filter(e => priorities.includes(e.priority));
    }

    if (filter.provider) {
      const providers = Array.isArray(filter.provider) ? filter.provider : [filter.provider];
      results = results.filter(e => providers.includes(e.provider));
    }

    if (filter.modelId) {
      const models = Array.isArray(filter.modelId) ? filter.modelId : [filter.modelId];
      results = results.filter(e => models.includes(e.modelId));
    }

    if (filter.taskType) {
      const types = Array.isArray(filter.taskType) ? filter.taskType : [filter.taskType];
      results = results.filter(e => types.includes(e.taskType));
    }

    if (filter.dateRange) {
      if (filter.dateRange.start) {
        results = results.filter(e => e.timestamp >= filter.dateRange!.start!);
      }
      if (filter.dateRange.end) {
        results = results.filter(e => e.timestamp <= filter.dateRange!.end!);
      }
    }

    if (filter.sessionId) {
      results = results.filter(e => e.sessionId === filter.sessionId);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(e =>
        filter.tags!.some(tag => e.tags.includes(tag))
      );
    }

    if (filter.searchText) {
      const search = filter.searchText.toLowerCase();
      results = results.filter(e =>
        e.originalPrompt.toLowerCase().includes(search) ||
        e.response.toLowerCase().includes(search)
      );
    }

    if (filter.filePattern) {
      const pattern = new RegExp(filter.filePattern);
      results = results.filter(e =>
        e.filesModified.some(f => pattern.test(f.filePath))
      );
    }

    // Sort
    const sortField = filter.sortBy ?? 'timestamp';
    const sortOrder = filter.sortOrder ?? 'desc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = a.reviewStatus.localeCompare(b.reviewStatus);
          break;
        case 'provider':
          comparison = a.provider.localeCompare(b.provider);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    if (filter.offset) {
      results = results.slice(filter.offset);
    }
    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  /**
   * Get entry summaries for listing
   */
  getEntrySummaries(filter: AuditFilter = {}): AuditEntrySummary[] {
    return this.queryEntries(filter).map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      provider: e.provider,
      modelName: e.modelName,
      taskType: e.taskType,
      complexity: e.complexity,
      filesCount: e.filesModified.length,
      linesChanged: e.filesModified.reduce(
        (sum, f) => sum + f.linesAdded + f.linesRemoved,
        0
      ),
      reviewStatus: e.reviewStatus,
      priority: e.priority,
      promptPreview: e.originalPrompt.slice(0, 100) + (e.originalPrompt.length > 100 ? '...' : ''),
    }));
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): ReviewQueueStats {
    const entries = Array.from(this.entries.values());

    const byStatus: Record<ReviewStatus, number> = {
      pending: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      fixed: 0,
      skipped: 0,
    };

    const byPriority: Record<ReviewPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byProvider: Record<string, number> = {};

    let totalFilesModified = 0;
    let totalLinesChanged = 0;
    let oldestPending: Date | undefined;
    let mostRecent: Date | undefined;

    for (const entry of entries) {
      byStatus[entry.reviewStatus]++;
      byPriority[entry.priority]++;
      byProvider[entry.provider] = (byProvider[entry.provider] ?? 0) + 1;

      totalFilesModified += entry.filesModified.length;
      totalLinesChanged += entry.filesModified.reduce(
        (sum, f) => sum + f.linesAdded + f.linesRemoved,
        0
      );

      if (entry.reviewStatus === 'pending') {
        if (!oldestPending || entry.timestamp < oldestPending) {
          oldestPending = entry.timestamp;
        }
      }

      if (!mostRecent || entry.timestamp > mostRecent) {
        mostRecent = entry.timestamp;
      }
    }

    return {
      totalEntries: entries.length,
      byStatus,
      byPriority,
      byProvider,
      totalFilesModified,
      totalLinesChanged,
      oldestPending,
      mostRecent,
    };
  }

  /**
   * Get pending entries count
   */
  getPendingCount(): number {
    return this.queryEntries({ status: 'pending' }).length;
  }

  /**
   * Get entries needing attention (pending + high/critical priority)
   */
  getEntriesNeedingAttention(): AuditEntry[] {
    return this.queryEntries({
      status: 'pending',
      priority: ['high', 'critical'],
      sortBy: 'priority',
      sortOrder: 'desc',
    });
  }

  /**
   * Set the current session ID
   */
  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Register an event handler
   */
  on(event: AuditEventType, handler: AuditEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove an event handler
   */
  off(event: AuditEventType, handler: AuditEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Export entries to JSON
   */
  exportToJson(): string {
    const entries = Array.from(this.entries.values());
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Import entries from JSON
   */
  importFromJson(json: string): number {
    const entries = JSON.parse(json) as AuditEntry[];
    let imported = 0;

    for (const entry of entries) {
      // Convert date strings back to Date objects
      entry.timestamp = new Date(entry.timestamp);
      if (entry.reviewedAt) {
        entry.reviewedAt = new Date(entry.reviewedAt);
      }

      this.entries.set(entry.id, entry);
      imported++;
    }

    return imported;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Calculate priority based on entry characteristics
   */
  private calculatePriority(input: CreateAuditEntryInput): ReviewPriority {
    let score = 0;

    // Risk level contributes most
    if (input.riskLevel === 'high') score += 30;
    else if (input.riskLevel === 'medium') score += 15;

    // Complexity
    if (input.complexity === 'complex') score += 20;
    else if (input.complexity === 'medium') score += 10;

    // Number of files
    const fileCount = input.filesModified.length;
    if (fileCount >= 10) score += 25;
    else if (fileCount >= 5) score += 15;
    else if (fileCount >= 3) score += 10;

    // Lines changed
    const linesChanged = input.filesModified.reduce(
      (sum, f) => sum + f.linesAdded + f.linesRemoved,
      0
    );
    if (linesChanged >= 500) score += 20;
    else if (linesChanged >= 200) score += 10;
    else if (linesChanged >= 50) score += 5;

    // Task type
    if (input.taskType === 'refactor') score += 10;
    else if (input.taskType === 'code_edit') score += 5;

    // Convert score to priority
    if (score >= 60) return 'critical';
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  /**
   * Emit an event to handlers
   */
  private async emit(type: AuditEventType, data: Record<string, unknown>): Promise<void> {
    const event: AuditEvent = {
      type,
      timestamp: new Date(),
      entryId: data.entryId as string | undefined,
      data,
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Audit event handler error for ${type}:`, error);
        }
      }
    }
  }

  /**
   * Check alert thresholds and emit if exceeded
   */
  private async checkAlertThresholds(): Promise<void> {
    if (!this.config.alerts) return;

    const stats = this.getQueueStats();

    if (
      this.config.alerts.pendingThreshold &&
      stats.byStatus.pending >= this.config.alerts.pendingThreshold
    ) {
      await this.emit('queue_threshold_reached', {
        type: 'pending',
        count: stats.byStatus.pending,
        threshold: this.config.alerts.pendingThreshold,
      });
    }

    if (
      this.config.alerts.highPriorityThreshold &&
      stats.byPriority.high + stats.byPriority.critical >= this.config.alerts.highPriorityThreshold
    ) {
      await this.emit('queue_threshold_reached', {
        type: 'high_priority',
        count: stats.byPriority.high + stats.byPriority.critical,
        threshold: this.config.alerts.highPriorityThreshold,
      });
    }

    if (this.config.alerts.alertOnCritical && stats.byPriority.critical > 0) {
      const criticalEntries = this.queryEntries({ priority: 'critical', status: 'pending' });
      await this.emit('queue_threshold_reached', {
        type: 'critical',
        count: stats.byPriority.critical,
        entries: criticalEntries.map(e => e.id),
      });
    }
  }

  /**
   * Prune old entries to stay within memory limit
   */
  private pruneOldEntries(): void {
    const entries = Array.from(this.entries.entries())
      .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime());

    // Keep only the most recent entries up to limit
    const toKeep = entries.slice(0, this.config.maxMemoryEntries);
    this.entries.clear();
    for (const [id, entry] of toKeep) {
      this.entries.set(id, entry);
    }
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDirectory(): void {
    if (this.config.storagePath && !existsSync(this.config.storagePath)) {
      mkdirSync(this.config.storagePath, { recursive: true });
    }
  }

  /**
   * Get file path for an entry
   */
  private getEntryFilePath(entryId: string): string {
    return join(this.config.storagePath!, `${entryId}.json`);
  }

  /**
   * Get index file path
   */
  private getIndexFilePath(): string {
    return join(this.config.storagePath!, 'index.json');
  }

  /**
   * Persist entry to file
   */
  private async persistEntry(entry: AuditEntry): Promise<void> {
    const filePath = this.getEntryFilePath(entry.id);
    const dir = dirname(filePath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, JSON.stringify(entry, null, 2));

    // Update index
    await this.updateIndex(entry.id);
  }

  /**
   * Update the index file
   */
  private async updateIndex(entryId: string): Promise<void> {
    const indexPath = this.getIndexFilePath();
    let index: string[] = [];

    if (existsSync(indexPath)) {
      try {
        index = JSON.parse(readFileSync(indexPath, 'utf-8'));
      } catch {
        index = [];
      }
    }

    if (!index.includes(entryId)) {
      index.push(entryId);
      writeFileSync(indexPath, JSON.stringify(index, null, 2));
    }
  }

  /**
   * Load entries from file storage
   */
  private async loadFromFile(): Promise<void> {
    const indexPath = this.getIndexFilePath();

    if (!existsSync(indexPath)) return;

    try {
      const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as string[];

      for (const entryId of index) {
        const filePath = this.getEntryFilePath(entryId);
        if (existsSync(filePath)) {
          try {
            const entry = JSON.parse(readFileSync(filePath, 'utf-8')) as AuditEntry;
            entry.timestamp = new Date(entry.timestamp);
            if (entry.reviewedAt) {
              entry.reviewedAt = new Date(entry.reviewedAt);
            }
            this.entries.set(entry.id, entry);
          } catch (error) {
            console.error(`Failed to load audit entry ${entryId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load audit index:', error);
    }
  }
}

// ===== SINGLETON INSTANCE =====

let loggerInstance: AuditLogger | null = null;

/**
 * Get the singleton audit logger instance
 */
export function getAuditLogger(config?: Partial<AuditConfig>): AuditLogger {
  if (!loggerInstance) {
    loggerInstance = new AuditLogger(config);
  }
  return loggerInstance;
}

/**
 * Initialize the audit logger
 */
export async function initializeAuditLogger(config?: Partial<AuditConfig>): Promise<AuditLogger> {
  if (loggerInstance) {
    loggerInstance.clear();
  }
  loggerInstance = new AuditLogger(config);
  await loggerInstance.initialize();
  return loggerInstance;
}

/**
 * Reset the audit logger singleton
 */
export function resetAuditLogger(): void {
  if (loggerInstance) {
    loggerInstance.clear();
  }
  loggerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a file modification record from git diff
 */
export function createFileModification(
  filePath: string,
  diff: string,
  type: FileModification['modificationType'] = 'modified'
): FileModification {
  // Count lines added/removed from diff
  const lines = diff.split('\n');
  let linesAdded = 0;
  let linesRemoved = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      linesAdded++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      linesRemoved++;
    }
  }

  return {
    filePath,
    modificationType: type,
    linesAdded,
    linesRemoved,
    diff,
  };
}

/**
 * Generate a diff summary from file modifications
 */
export function generateDiffSummary(files: FileModification[]): string {
  const totalAdded = files.reduce((sum, f) => sum + f.linesAdded, 0);
  const totalRemoved = files.reduce((sum, f) => sum + f.linesRemoved, 0);

  const lines = [
    `${files.length} file(s) changed, ${totalAdded} insertion(s)(+), ${totalRemoved} deletion(s)(-)`,
    '',
    ...files.map(f => {
      const changeIndicator =
        f.modificationType === 'created' ? '[NEW]' :
        f.modificationType === 'deleted' ? '[DEL]' :
        f.modificationType === 'renamed' ? '[REN]' : '[MOD]';
      return `  ${changeIndicator} ${f.filePath} (+${f.linesAdded}, -${f.linesRemoved})`;
    }),
  ];

  return lines.join('\n');
}

/**
 * Generate full diff from file modifications
 */
export function generateFullDiff(files: FileModification[]): string {
  return files.map(f => f.diff).join('\n\n');
}

/**
 * Format audit entry for display
 */
export function formatAuditEntry(entry: AuditEntry): string {
  const lines = [
    `ID: ${entry.id}`,
    `Time: ${entry.timestamp.toISOString()}`,
    `Model: ${entry.modelName} (${entry.provider})`,
    `Task: ${entry.taskType} (${entry.complexity})`,
    `Risk: ${entry.riskLevel}`,
    `Status: ${entry.reviewStatus} (${entry.priority} priority)`,
    `Files: ${entry.filesModified.length}`,
    `Cost: $${entry.cost.totalCost.toFixed(4)}`,
    ``,
    `Prompt: ${entry.originalPrompt.slice(0, 200)}${entry.originalPrompt.length > 200 ? '...' : ''}`,
    ``,
    entry.diffSummary,
  ];

  return lines.join('\n');
}
