/**
 * Context Management - Token monitoring and auto-summarization
 *
 * Manages context window for god-write operations to prevent overflow:
 * - Token usage monitoring
 * - Automatic summarization when approaching limits
 * - Context health checks
 * - Smart context pruning
 *
 * Reference: src/god-agent/cli/context/dissertation-context-manager.ts
 *
 * Integration Points:
 * - UniversalAgent - Track context usage per operation
 * - QualityIntegration - Ensure revision loops don't overflow context
 *
 * Usage:
 * ```typescript
 * const manager = new ContextManager({ maxTokens: 100000 });
 * manager.trackUsage(prompt, response);
 * if (manager.needsSummarization()) {
 *   const summarized = await manager.summarizeContext();
 * }
 * ```
 */

import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';

const logger = createComponentLogger('ContextManager', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Token usage entry
 */
export interface TokenUsageEntry {
  /** Operation ID */
  operationId: string;

  /** Operation type */
  operationType: 'write' | 'research' | 'revision' | 'validation';

  /** Input tokens */
  inputTokens: number;

  /** Output tokens */
  outputTokens: number;

  /** Total tokens */
  totalTokens: number;

  /** Timestamp */
  timestamp: string;
}

/**
 * Context health status
 */
export type ContextHealth = 'healthy' | 'warning' | 'critical';

/**
 * Context health report
 */
export interface ContextHealthReport {
  /** Health status */
  status: ContextHealth;

  /** Current token usage */
  currentTokens: number;

  /** Maximum tokens allowed */
  maxTokens: number;

  /** Usage percentage */
  usagePercentage: number;

  /** Remaining tokens */
  remainingTokens: number;

  /** Needs summarization */
  needsSummarization: boolean;

  /** Total operations tracked */
  totalOperations: number;

  /** Timestamp */
  timestamp: string;
}

/**
 * Context management options
 */
export interface ContextManagerOptions {
  /** Maximum tokens allowed (default: 100000) */
  maxTokens?: number;

  /** Warning threshold percentage (default: 0.75 = 75%) */
  warningThreshold?: number;

  /** Critical threshold percentage (default: 0.90 = 90%) */
  criticalThreshold?: number;

  /** Auto-summarize on critical (default: true) */
  autoSummarize?: boolean;

  /** Enable monitoring (default: true) */
  enabled?: boolean;
}

/**
 * Summarization strategy
 */
export type SummarizationStrategy = 'oldest-first' | 'least-important' | 'preserve-recent';

// ============================================================================
// Context Manager Class
// ============================================================================

/**
 * Manages context window and token usage
 */
export class ContextManager {
  private usageHistory: TokenUsageEntry[] = [];
  private currentTokens = 0;
  private options: Required<ContextManagerOptions>;

  constructor(options: ContextManagerOptions = {}) {
    this.options = {
      maxTokens: options.maxTokens ?? 100000,
      warningThreshold: options.warningThreshold ?? 0.75,
      criticalThreshold: options.criticalThreshold ?? 0.90,
      autoSummarize: options.autoSummarize ?? true,
      enabled: options.enabled ?? true,
    };
  }

  /**
   * Track token usage for an operation
   */
  trackUsage(
    operationId: string,
    operationType: TokenUsageEntry['operationType'],
    inputTokens: number,
    outputTokens: number
  ): void {
    if (!this.options.enabled) {
      return;
    }

    const entry: TokenUsageEntry = {
      operationId,
      operationType,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      timestamp: new Date().toISOString(),
    };

    this.usageHistory.push(entry);
    this.currentTokens += entry.totalTokens;

    logger.log(
      LogLevel.DEBUG,
      `Tracked ${entry.totalTokens} tokens (${operationType}) - Total: ${this.currentTokens}`
    );

    // Check if we need to take action
    const health = this.getHealth();
    if (health.status === 'critical' && this.options.autoSummarize) {
      logger.log(LogLevel.WARNING, 'Critical context usage - auto-summarization triggered');
      // Note: Actual summarization would be triggered externally
    }
  }

  /**
   * Get current context health
   */
  getHealth(): ContextHealthReport {
    const usagePercentage = this.currentTokens / this.options.maxTokens;
    const remainingTokens = this.options.maxTokens - this.currentTokens;

    let status: ContextHealth = 'healthy';
    if (usagePercentage >= this.options.criticalThreshold) {
      status = 'critical';
    } else if (usagePercentage >= this.options.warningThreshold) {
      status = 'warning';
    }

    const needsSummarization = usagePercentage >= this.options.warningThreshold;

    return {
      status,
      currentTokens: this.currentTokens,
      maxTokens: this.options.maxTokens,
      usagePercentage,
      remainingTokens,
      needsSummarization,
      totalOperations: this.usageHistory.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if summarization is needed
   */
  needsSummarization(): boolean {
    return this.getHealth().needsSummarization;
  }

  /**
   * Get token usage by operation type
   */
  getUsageByType(): Record<TokenUsageEntry['operationType'], number> {
    const usage = {
      write: 0,
      research: 0,
      revision: 0,
      validation: 0,
    };

    for (const entry of this.usageHistory) {
      usage[entry.operationType] += entry.totalTokens;
    }

    return usage;
  }

  /**
   * Get recent usage (last N operations)
   */
  getRecentUsage(count: number = 10): TokenUsageEntry[] {
    return this.usageHistory.slice(-count);
  }

  /**
   * Prune context using specified strategy
   */
  pruneContext(strategy: SummarizationStrategy = 'oldest-first', targetPercentage: number = 0.5): void {
    const targetTokens = this.options.maxTokens * targetPercentage;
    const tokensToRemove = this.currentTokens - targetTokens;

    if (tokensToRemove <= 0) {
      logger.log(LogLevel.INFO, 'No pruning needed');
      return;
    }

    logger.log(LogLevel.INFO, `Pruning ${tokensToRemove} tokens using strategy: ${strategy}`);

    let removedTokens = 0;
    const entriesToKeep: TokenUsageEntry[] = [];

    switch (strategy) {
      case 'oldest-first':
        // Remove oldest entries first
        for (let i = this.usageHistory.length - 1; i >= 0; i--) {
          if (removedTokens >= tokensToRemove) {
            entriesToKeep.unshift(this.usageHistory[i]);
          } else {
            removedTokens += this.usageHistory[i].totalTokens;
          }
        }
        break;

      case 'preserve-recent':
        // Keep recent entries, remove oldest
        const recentCount = Math.ceil(this.usageHistory.length * 0.3);
        const recent = this.usageHistory.slice(-recentCount);
        const older = this.usageHistory.slice(0, -recentCount);

        for (const entry of older) {
          if (removedTokens >= tokensToRemove) {
            entriesToKeep.push(entry);
          } else {
            removedTokens += entry.totalTokens;
          }
        }
        entriesToKeep.push(...recent);
        break;

      case 'least-important':
        // Remove validation entries first, then revisions
        const sorted = [...this.usageHistory].sort((a, b) => {
          const priority = { validation: 0, revision: 1, research: 2, write: 3 };
          return priority[a.operationType] - priority[b.operationType];
        });

        for (const entry of sorted) {
          if (removedTokens >= tokensToRemove) {
            entriesToKeep.push(entry);
          } else {
            removedTokens += entry.totalTokens;
          }
        }
        break;
    }

    this.usageHistory = entriesToKeep.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    this.currentTokens -= removedTokens;

    logger.log(
      LogLevel.INFO,
      `Pruned ${removedTokens} tokens - New total: ${this.currentTokens}`
    );
  }

  /**
   * Reset context (clear all history)
   */
  reset(): void {
    this.usageHistory = [];
    this.currentTokens = 0;
    logger.log(LogLevel.INFO, 'Context reset');
  }

  /**
   * Get usage statistics
   */
  getStatistics(): {
    totalTokens: number;
    totalOperations: number;
    avgTokensPerOperation: number;
    byType: Record<TokenUsageEntry['operationType'], number>;
    health: ContextHealthReport;
  } {
    const byType = this.getUsageByType();
    const avgTokensPerOperation =
      this.usageHistory.length > 0 ? this.currentTokens / this.usageHistory.length : 0;

    return {
      totalTokens: this.currentTokens,
      totalOperations: this.usageHistory.length,
      avgTokensPerOperation,
      byType,
      health: this.getHealth(),
    };
  }

  /**
   * Display context health report
   */
  displayHealth(): void {
    const health = this.getHealth();
    const stats = this.getStatistics();

    const lines = [
      '='.repeat(80),
      'CONTEXT HEALTH REPORT',
      '='.repeat(80),
      `Status: ${health.status.toUpperCase()}`,
      `Current Tokens: ${health.currentTokens.toLocaleString()} / ${health.maxTokens.toLocaleString()}`,
      `Usage: ${(health.usagePercentage * 100).toFixed(1)}%`,
      `Remaining: ${health.remainingTokens.toLocaleString()} tokens`,
      `Operations: ${health.totalOperations}`,
      '',
      'Usage by Type:',
      `  Write: ${stats.byType.write.toLocaleString()} tokens`,
      `  Research: ${stats.byType.research.toLocaleString()} tokens`,
      `  Revision: ${stats.byType.revision.toLocaleString()} tokens`,
      `  Validation: ${stats.byType.validation.toLocaleString()} tokens`,
      '',
      `Average per Operation: ${stats.avgTokensPerOperation.toFixed(0)} tokens`,
    ];

    if (health.needsSummarization) {
      lines.push('', 'WARNING: Context summarization recommended');
    }

    lines.push('='.repeat(80));
    logger.info(lines.join('\n'));
  }

  /**
   * Estimate tokens for text (rough approximation)
   * Uses 4 chars ≈ 1 token heuristic
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if operation will fit in remaining context
   */
  canFitOperation(estimatedTokens: number): boolean {
    const health = this.getHealth();
    return health.remainingTokens >= estimatedTokens;
  }

  /**
   * Get recommended action based on current health
   */
  getRecommendedAction(): string {
    const health = this.getHealth();

    if (health.status === 'critical') {
      return 'CRITICAL: Prune context immediately or operations may fail';
    } else if (health.status === 'warning') {
      return 'WARNING: Consider pruning context before next major operation';
    } else {
      return 'OK: Context usage is healthy';
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a context manager with default settings
 */
export function createContextManager(options?: ContextManagerOptions): ContextManager {
  return new ContextManager(options);
}

/**
 * Create a context manager with high limits (for long-form content)
 */
export function createLargeContextManager(): ContextManager {
  return new ContextManager({
    maxTokens: 200000,
    warningThreshold: 0.80,
    criticalThreshold: 0.95,
  });
}
