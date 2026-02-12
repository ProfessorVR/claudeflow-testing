/**
 * Context Health Monitor - PHASE-4-001
 *
 * Monitors context window usage and alerts when approaching limits.
 * Tracks token counts per agent and cumulative context across the pipeline.
 *
 * Health Status Thresholds:
 * - Healthy: <60% utilization
 * - Warning: 60-80% utilization
 * - Critical: >80% utilization
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Health status levels
 */
export type ContextHealthStatus = 'healthy' | 'warning' | 'critical';

/**
 * Current context health state
 */
export interface ContextHealth {
  /** Estimated tokens in current context */
  readonly currentTokens: number;

  /** Maximum context window size */
  readonly maxTokens: number;

  /** Utilization percentage (0-100) */
  readonly utilization: number;

  /** Health status based on utilization */
  readonly status: ContextHealthStatus;

  /** Recommended action if not healthy */
  readonly recommendation?: string;

  /** Tokens by source for debugging */
  readonly tokensBySource: Record<string, number>;

  /** Timestamp of last update */
  readonly lastUpdated: string;
}

/**
 * Content tracking entry
 */
interface TrackedContent {
  source: string;
  tokens: number;
  timestamp: number;
  content?: string; // Optional - only stored if debug mode
}

/**
 * Context health event data
 */
export interface ContextHealthEvent {
  type: 'status_change' | 'threshold_crossed' | 'content_added' | 'reset';
  previousStatus?: ContextHealthStatus;
  currentStatus: ContextHealthStatus;
  health: ContextHealth;
  source?: string;
  tokensAdded?: number;
}

/**
 * Context health monitor configuration
 */
export interface ContextHealthMonitorConfig {
  /** Maximum tokens in context window (default: 200000 for Claude) */
  maxTokens?: number;

  /** Warning threshold percentage (default: 60) */
  warningThreshold?: number;

  /** Critical threshold percentage (default: 80) */
  criticalThreshold?: number;

  /** Store content for debugging (default: false) */
  debugMode?: boolean;

  /** Average characters per token for estimation (default: 4) */
  charsPerToken?: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<ContextHealthMonitorConfig> = {
  maxTokens: 200000,  // Claude's context window
  warningThreshold: 60,
  criticalThreshold: 80,
  debugMode: false,
  charsPerToken: 4,  // Rough estimate for English text
};

// ============================================================================
// Context Health Monitor Class
// ============================================================================

/**
 * Context Health Monitor
 *
 * Tracks context window usage and provides health status.
 * Emits events when health status changes or thresholds are crossed.
 */
export class ContextHealthMonitor extends EventEmitter {
  private readonly config: Required<ContextHealthMonitorConfig>;
  private trackedContent: TrackedContent[] = [];
  private totalTokens: number = 0;
  private tokensBySource: Record<string, number> = {};
  private currentStatus: ContextHealthStatus = 'healthy';

  constructor(config: ContextHealthMonitorConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Add content to tracked context
   * @param content - The text content to track
   * @param source - Identifier for the content source (e.g., agent name)
   * @returns Token count for this content
   */
  trackContent(content: string, source: string): number {
    const tokens = this.estimateTokens(content);

    const entry: TrackedContent = {
      source,
      tokens,
      timestamp: Date.now(),
    };

    if (this.config.debugMode) {
      entry.content = content;
    }

    this.trackedContent.push(entry);
    this.totalTokens += tokens;
    this.tokensBySource[source] = (this.tokensBySource[source] ?? 0) + tokens;

    // Check for status change
    const previousStatus = this.currentStatus;
    this.currentStatus = this.calculateStatus();

    // Emit events
    const health = this.getHealth();

    this.emit('content_added', {
      type: 'content_added',
      previousStatus,
      currentStatus: this.currentStatus,
      health,
      source,
      tokensAdded: tokens,
    } as ContextHealthEvent);

    if (previousStatus !== this.currentStatus) {
      this.emit('status_change', {
        type: 'status_change',
        previousStatus,
        currentStatus: this.currentStatus,
        health,
        source,
      } as ContextHealthEvent);

      this.emit('threshold_crossed', {
        type: 'threshold_crossed',
        previousStatus,
        currentStatus: this.currentStatus,
        health,
      } as ContextHealthEvent);
    }

    return tokens;
  }

  /**
   * Track agent input/output
   * @param agentKey - The agent identifier
   * @param input - Agent input object (will be JSON stringified)
   * @param output - Agent output (optional, track when completed)
   * @returns Total tokens tracked for this agent call
   */
  trackAgentExecution(
    agentKey: string,
    input: unknown,
    output?: unknown
  ): number {
    let totalTracked = 0;

    // Track input
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    totalTracked += this.trackContent(inputStr, `${agentKey}:input`);

    // Track output if provided
    if (output !== undefined) {
      const outputStr = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
      totalTracked += this.trackContent(outputStr, `${agentKey}:output`);
    }

    return totalTracked;
  }

  /**
   * Get current health status
   */
  getHealth(): ContextHealth {
    const utilization = (this.totalTokens / this.config.maxTokens) * 100;
    const status = this.calculateStatus();

    return {
      currentTokens: this.totalTokens,
      maxTokens: this.config.maxTokens,
      utilization: Math.round(utilization * 100) / 100,
      status,
      recommendation: this.getRecommendation(status, utilization),
      tokensBySource: { ...this.tokensBySource },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Check if summarization is needed
   */
  needsSummarization(): boolean {
    const utilization = (this.totalTokens / this.config.maxTokens) * 100;
    return utilization >= this.config.criticalThreshold;
  }

  /**
   * Check if context is in warning state
   */
  isWarning(): boolean {
    return this.currentStatus === 'warning';
  }

  /**
   * Check if context is in critical state
   */
  isCritical(): boolean {
    return this.currentStatus === 'critical';
  }

  /**
   * Get remaining token capacity
   */
  getRemainingCapacity(): number {
    return Math.max(0, this.config.maxTokens - this.totalTokens);
  }

  /**
   * Get content breakdown by source
   */
  getContentBreakdown(): Array<{
    source: string;
    tokens: number;
    percentage: number;
  }> {
    return Object.entries(this.tokensBySource)
      .map(([source, tokens]) => ({
        source,
        tokens,
        percentage: Math.round((tokens / this.totalTokens) * 10000) / 100,
      }))
      .sort((a, b) => b.tokens - a.tokens);
  }

  /**
   * Get the largest content consumers
   * @param limit - Maximum number of entries to return
   */
  getLargestConsumers(limit: number = 10): Array<{
    source: string;
    tokens: number;
    percentage: number;
  }> {
    return this.getContentBreakdown().slice(0, limit);
  }

  /**
   * Reset context tracking (e.g., after summarization)
   */
  reset(): void {
    const previousStatus = this.currentStatus;

    this.trackedContent = [];
    this.totalTokens = 0;
    this.tokensBySource = {};
    this.currentStatus = 'healthy';

    const health = this.getHealth();

    this.emit('reset', {
      type: 'reset',
      previousStatus,
      currentStatus: 'healthy',
      health,
    } as ContextHealthEvent);
  }

  /**
   * Reset tracking but keep some content (e.g., summarized context)
   * @param preservedContent - Content to keep after reset
   * @param source - Source identifier for preserved content
   */
  resetWithPreserved(preservedContent: string, source: string = 'summary'): void {
    this.reset();
    this.trackContent(preservedContent, source);
  }

  /**
   * Get estimated tokens for a string
   * @param text - Text to estimate
   */
  estimateTokens(text: string): number {
    // Simple estimation: characters / 4
    // More accurate would be to use a tokenizer, but this is fast and good enough
    return Math.ceil(text.length / this.config.charsPerToken);
  }

  /**
   * Format health status for logging/display
   */
  formatStatus(): string {
    const health = this.getHealth();
    const lines: string[] = [
      `Context Health: ${health.status.toUpperCase()}`,
      `  Tokens: ${health.currentTokens.toLocaleString()} / ${health.maxTokens.toLocaleString()}`,
      `  Utilization: ${health.utilization.toFixed(1)}%`,
      `  Remaining: ${this.getRemainingCapacity().toLocaleString()} tokens`,
    ];

    if (health.recommendation) {
      lines.push(`  Recommendation: ${health.recommendation}`);
    }

    return lines.join('\n');
  }

  /**
   * Get detailed status report
   */
  getDetailedReport(): string {
    const health = this.getHealth();
    const breakdown = this.getContentBreakdown();

    const lines: string[] = [
      '=== Context Health Report ===',
      '',
      this.formatStatus(),
      '',
      '--- Content Breakdown ---',
    ];

    for (const entry of breakdown.slice(0, 15)) {
      lines.push(`  ${entry.source}: ${entry.tokens.toLocaleString()} tokens (${entry.percentage.toFixed(1)}%)`);
    }

    if (breakdown.length > 15) {
      lines.push(`  ... and ${breakdown.length - 15} more sources`);
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private calculateStatus(): ContextHealthStatus {
    const utilization = (this.totalTokens / this.config.maxTokens) * 100;

    if (utilization >= this.config.criticalThreshold) {
      return 'critical';
    } else if (utilization >= this.config.warningThreshold) {
      return 'warning';
    }
    return 'healthy';
  }

  private getRecommendation(
    status: ContextHealthStatus,
    utilization: number
  ): string | undefined {
    switch (status) {
      case 'critical':
        return `Context at ${utilization.toFixed(0)}% capacity. Immediate summarization required to prevent context overflow.`;
      case 'warning':
        return `Context at ${utilization.toFixed(0)}% capacity. Consider summarization at next phase boundary.`;
      default:
        return undefined;
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a context health monitor with default settings
 */
export function createContextHealthMonitor(
  config?: ContextHealthMonitorConfig
): ContextHealthMonitor {
  return new ContextHealthMonitor(config);
}

/**
 * Create a monitor for Claude's 200K context window
 */
export function createClaudeContextMonitor(): ContextHealthMonitor {
  return new ContextHealthMonitor({
    maxTokens: 200000,
    warningThreshold: 60,
    criticalThreshold: 80,
  });
}

/**
 * Create a monitor for smaller context windows (e.g., GPT-4 8K)
 */
export function createSmallContextMonitor(maxTokens: number = 8000): ContextHealthMonitor {
  return new ContextHealthMonitor({
    maxTokens,
    warningThreshold: 50,
    criticalThreshold: 70,
  });
}

/**
 * Create a debug-enabled monitor that stores content
 */
export function createDebugContextMonitor(
  config?: Omit<ContextHealthMonitorConfig, 'debugMode'>
): ContextHealthMonitor {
  return new ContextHealthMonitor({
    ...config,
    debugMode: true,
  });
}
