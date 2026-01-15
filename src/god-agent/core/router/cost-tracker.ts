/**
 * Cost Tracker
 *
 * Implements TIER-2.1: Intelligent Model Router - Cost Tracking Layer
 *
 * Provides:
 * - Per-request cost tracking
 * - Aggregated cost statistics
 * - Budget monitoring and alerts
 * - Cost history and reporting
 */

import { randomUUID } from 'crypto';
import type {
  ProviderType,
  TaskType,
  TokenUsage,
  CostBreakdown,
  CostRecord,
  CostStats,
  CostTrackingConfig,
  BudgetLimits,
  AlertConfig,
  RouterEvent,
  RouterEventHandler,
  RouterEventType,
} from './router-types.js';

// ===== COST TRACKER CONFIGURATION =====

/**
 * Extended configuration for cost tracker
 */
export interface CostTrackerConfig extends CostTrackingConfig {
  /** Maximum records to keep in memory */
  maxRecords?: number;
  /** Auto-archive records older than this (days) */
  archiveAfterDays?: number;
  /** Storage path for persistence */
  storagePath?: string;
}

const DEFAULT_CONFIG: Required<CostTrackerConfig> = {
  enabled: true,
  budgets: {},
  alerts: [],
  maxRecords: 10000,
  archiveAfterDays: 90,
  storagePath: '.god-agent/costs',
};

// ===== PERIOD HELPERS =====

/**
 * Get the start of the current day (UTC)
 */
function getDayStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the start of the current week (Sunday, UTC)
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

/**
 * Get the start of the current month (UTC)
 */
function getMonthStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(1);
  return d;
}

// ===== COST TRACKER =====

/**
 * Cost tracker for monitoring LLM spending
 */
export class CostTracker {
  private readonly config: Required<CostTrackerConfig>;
  private records: CostRecord[] = [];
  private eventHandlers: Map<RouterEventType, RouterEventHandler[]> = new Map();

  constructor(config: Partial<CostTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===== CONFIGURATION =====

  /**
   * Check if cost tracking is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current budget configuration
   */
  getBudgets(): BudgetLimits {
    return { ...this.config.budgets };
  }

  /**
   * Update budget configuration
   */
  setBudgets(budgets: Partial<BudgetLimits>): void {
    this.config.budgets = { ...this.config.budgets, ...budgets };
  }

  /**
   * Get alert configuration
   */
  getAlerts(): AlertConfig[] {
    return [...(this.config.alerts ?? [])];
  }

  /**
   * Set alert configuration
   */
  setAlerts(alerts: AlertConfig[]): void {
    this.config.alerts = [...alerts];
  }

  // ===== RECORDING =====

  /**
   * Record a cost entry
   */
  recordCost(
    model: string,
    provider: ProviderType,
    usage: TokenUsage,
    cost: CostBreakdown,
    taskType: TaskType
  ): CostRecord {
    const record: CostRecord = {
      id: randomUUID(),
      timestamp: new Date(),
      model,
      provider,
      usage,
      cost,
      taskType,
    };

    this.records.push(record);

    // Trim old records if over limit
    if (this.records.length > this.config.maxRecords) {
      this.records = this.records.slice(-this.config.maxRecords);
    }

    // Check budget and emit alerts
    this.checkBudgetAlerts();

    return record;
  }

  /**
   * Get a specific record by ID
   */
  getRecord(id: string): CostRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  /**
   * Get all records
   */
  getAllRecords(): CostRecord[] {
    return [...this.records];
  }

  /**
   * Get records within a date range
   */
  getRecordsInRange(start: Date, end: Date): CostRecord[] {
    return this.records.filter(
      r => r.timestamp >= start && r.timestamp <= end
    );
  }

  /**
   * Get records for a specific model
   */
  getRecordsForModel(model: string): CostRecord[] {
    return this.records.filter(r => r.model === model);
  }

  /**
   * Get records for a specific provider
   */
  getRecordsForProvider(provider: ProviderType): CostRecord[] {
    return this.records.filter(r => r.provider === provider);
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.records = [];
  }

  // ===== STATISTICS =====

  /**
   * Get cost statistics for a period
   */
  getStats(periodStart?: Date, periodEnd?: Date): CostStats {
    const now = new Date();
    const start = periodStart ?? getMonthStart();
    const end = periodEnd ?? now;

    const recordsInPeriod = this.getRecordsInRange(start, end);

    // Calculate totals
    let totalCost = 0;
    let totalTokens = 0;
    const byModel: Record<string, number> = {};
    const byTaskType: Record<TaskType, number> = {} as Record<TaskType, number>;

    for (const record of recordsInPeriod) {
      totalCost += record.cost.totalCost;
      totalTokens += record.usage.totalTokens;

      byModel[record.model] = (byModel[record.model] ?? 0) + record.cost.totalCost;
      byTaskType[record.taskType] = (byTaskType[record.taskType] ?? 0) + record.cost.totalCost;
    }

    // Calculate budget status
    const budgetStatus = this.getBudgetStatus();

    return {
      periodStart: start,
      periodEnd: end,
      totalCost,
      byModel,
      byTaskType,
      totalTokens,
      requestCount: recordsInPeriod.length,
      budgetStatus,
    };
  }

  /**
   * Get today's cost
   */
  getTodayCost(): number {
    const start = getDayStart();
    const records = this.getRecordsInRange(start, new Date());
    return records.reduce((sum, r) => sum + r.cost.totalCost, 0);
  }

  /**
   * Get this week's cost
   */
  getWeekCost(): number {
    const start = getWeekStart();
    const records = this.getRecordsInRange(start, new Date());
    return records.reduce((sum, r) => sum + r.cost.totalCost, 0);
  }

  /**
   * Get this month's cost
   */
  getMonthCost(): number {
    const start = getMonthStart();
    const records = this.getRecordsInRange(start, new Date());
    return records.reduce((sum, r) => sum + r.cost.totalCost, 0);
  }

  /**
   * Get budget status for all periods
   */
  getBudgetStatus(): CostStats['budgetStatus'] {
    const budgets = this.config.budgets ?? {};

    const daily = this.getTodayCost();
    const weekly = this.getWeekCost();
    const monthly = this.getMonthCost();

    return {
      daily: {
        used: daily,
        limit: budgets.daily,
        percentage: budgets.daily ? (daily / budgets.daily) * 100 : undefined,
      },
      weekly: {
        used: weekly,
        limit: budgets.weekly,
        percentage: budgets.weekly ? (weekly / budgets.weekly) * 100 : undefined,
      },
      monthly: {
        used: monthly,
        limit: budgets.monthly,
        percentage: budgets.monthly ? (monthly / budgets.monthly) * 100 : undefined,
      },
    };
  }

  /**
   * Check if any budget is exceeded
   */
  isBudgetExceeded(): { exceeded: boolean; period?: 'daily' | 'weekly' | 'monthly' } {
    const budgets = this.config.budgets ?? {};

    if (budgets.daily && this.getTodayCost() >= budgets.daily) {
      return { exceeded: true, period: 'daily' };
    }
    if (budgets.weekly && this.getWeekCost() >= budgets.weekly) {
      return { exceeded: true, period: 'weekly' };
    }
    if (budgets.monthly && this.getMonthCost() >= budgets.monthly) {
      return { exceeded: true, period: 'monthly' };
    }

    return { exceeded: false };
  }

  /**
   * Get the remaining budget for a period
   */
  getRemainingBudget(period: 'daily' | 'weekly' | 'monthly'): number | null {
    const budgets = this.config.budgets ?? {};
    const limit = budgets[period];
    if (!limit) return null;

    let used: number;
    switch (period) {
      case 'daily':
        used = this.getTodayCost();
        break;
      case 'weekly':
        used = this.getWeekCost();
        break;
      case 'monthly':
        used = this.getMonthCost();
        break;
    }

    return Math.max(0, limit - used);
  }

  // ===== ALERTS =====

  /**
   * Check budget alerts and emit events
   */
  private checkBudgetAlerts(): void {
    const alerts = this.config.alerts ?? [];
    const budgetStatus = this.getBudgetStatus();

    for (const alert of alerts) {
      // Check each period
      for (const period of ['daily', 'weekly', 'monthly'] as const) {
        const status = budgetStatus[period];
        if (status.percentage !== undefined && status.percentage >= alert.at) {
          this.emitEvent({
            type: status.percentage >= 100 ? 'budget_exceeded' : 'budget_warning',
            timestamp: new Date(),
            data: {
              period,
              percentage: status.percentage,
              used: status.used,
              limit: status.limit,
              action: alert.action,
            },
          });
        }
      }
    }
  }

  /**
   * Get triggered alerts for current state
   */
  getTriggeredAlerts(): Array<{
    alert: AlertConfig;
    period: 'daily' | 'weekly' | 'monthly';
    percentage: number;
  }> {
    const alerts = this.config.alerts ?? [];
    const budgetStatus = this.getBudgetStatus();
    const triggered: Array<{
      alert: AlertConfig;
      period: 'daily' | 'weekly' | 'monthly';
      percentage: number;
    }> = [];

    for (const alert of alerts) {
      for (const period of ['daily', 'weekly', 'monthly'] as const) {
        const status = budgetStatus[period];
        if (status.percentage !== undefined && status.percentage >= alert.at) {
          triggered.push({ alert, period, percentage: status.percentage });
        }
      }
    }

    return triggered;
  }

  // ===== EVENTS =====

  /**
   * Register an event handler
   */
  on(event: RouterEventType, handler: RouterEventHandler): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  /**
   * Remove an event handler
   */
  off(event: RouterEventType, handler: RouterEventHandler): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  private emitEvent(event: RouterEvent): void {
    const handlers = this.eventHandlers.get(event.type) ?? [];
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  // ===== REPORTING =====

  /**
   * Get cost summary by model
   */
  getCostByModel(periodStart?: Date, periodEnd?: Date): Map<string, number> {
    const start = periodStart ?? getMonthStart();
    const end = periodEnd ?? new Date();
    const records = this.getRecordsInRange(start, end);

    const byModel = new Map<string, number>();
    for (const record of records) {
      const current = byModel.get(record.model) ?? 0;
      byModel.set(record.model, current + record.cost.totalCost);
    }

    return byModel;
  }

  /**
   * Get cost summary by provider
   */
  getCostByProvider(periodStart?: Date, periodEnd?: Date): Map<ProviderType, number> {
    const start = periodStart ?? getMonthStart();
    const end = periodEnd ?? new Date();
    const records = this.getRecordsInRange(start, end);

    const byProvider = new Map<ProviderType, number>();
    for (const record of records) {
      const current = byProvider.get(record.provider) ?? 0;
      byProvider.set(record.provider, current + record.cost.totalCost);
    }

    return byProvider;
  }

  /**
   * Get cost summary by task type
   */
  getCostByTaskType(periodStart?: Date, periodEnd?: Date): Map<TaskType, number> {
    const start = periodStart ?? getMonthStart();
    const end = periodEnd ?? new Date();
    const records = this.getRecordsInRange(start, end);

    const byTaskType = new Map<TaskType, number>();
    for (const record of records) {
      const current = byTaskType.get(record.taskType) ?? 0;
      byTaskType.set(record.taskType, current + record.cost.totalCost);
    }

    return byTaskType;
  }

  /**
   * Get daily cost breakdown for a period
   */
  getDailyCosts(days: number = 30): Map<string, number> {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    const records = this.getRecordsInRange(start, now);
    const dailyCosts = new Map<string, number>();

    for (const record of records) {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      const current = dailyCosts.get(dateKey) ?? 0;
      dailyCosts.set(dateKey, current + record.cost.totalCost);
    }

    return dailyCosts;
  }

  /**
   * Format costs as a report string
   */
  formatReport(): string {
    const stats = this.getStats();
    const budgetStatus = this.getBudgetStatus();

    const lines = [
      '=== Cost Report ===',
      '',
      `Period: ${stats.periodStart.toISOString().split('T')[0]} to ${stats.periodEnd.toISOString().split('T')[0]}`,
      `Total Cost: $${stats.totalCost.toFixed(4)}`,
      `Total Requests: ${stats.requestCount}`,
      `Total Tokens: ${stats.totalTokens.toLocaleString()}`,
      '',
      '--- Budget Status ---',
      `Daily:   $${budgetStatus.daily.used.toFixed(4)}${budgetStatus.daily.limit ? ` / $${budgetStatus.daily.limit.toFixed(2)} (${budgetStatus.daily.percentage?.toFixed(1)}%)` : ''}`,
      `Weekly:  $${budgetStatus.weekly.used.toFixed(4)}${budgetStatus.weekly.limit ? ` / $${budgetStatus.weekly.limit.toFixed(2)} (${budgetStatus.weekly.percentage?.toFixed(1)}%)` : ''}`,
      `Monthly: $${budgetStatus.monthly.used.toFixed(4)}${budgetStatus.monthly.limit ? ` / $${budgetStatus.monthly.limit.toFixed(2)} (${budgetStatus.monthly.percentage?.toFixed(1)}%)` : ''}`,
      '',
      '--- Cost by Model ---',
    ];

    for (const [model, cost] of Object.entries(stats.byModel)) {
      lines.push(`  ${model}: $${cost.toFixed(4)}`);
    }

    lines.push('');
    lines.push('--- Cost by Task Type ---');
    for (const [taskType, cost] of Object.entries(stats.byTaskType)) {
      lines.push(`  ${taskType}: $${cost.toFixed(4)}`);
    }

    return lines.join('\n');
  }

  // ===== EXPORT/IMPORT =====

  /**
   * Export records to JSON
   */
  exportToJson(): string {
    return JSON.stringify(this.records, null, 2);
  }

  /**
   * Import records from JSON
   */
  importFromJson(json: string): number {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) {
      throw new Error('Invalid JSON format: expected array');
    }

    let imported = 0;
    for (const item of data) {
      if (item.id && item.timestamp && item.model && item.cost) {
        // Ensure timestamp is a Date
        item.timestamp = new Date(item.timestamp);
        this.records.push(item as CostRecord);
        imported++;
      }
    }

    return imported;
  }
}

// ===== SINGLETON INSTANCE =====

let trackerInstance: CostTracker | null = null;

/**
 * Get the singleton cost tracker instance
 */
export function getCostTracker(config?: Partial<CostTrackerConfig>): CostTracker {
  if (!trackerInstance) {
    trackerInstance = new CostTracker(config);
  }
  return trackerInstance;
}

/**
 * Initialize the cost tracker with config
 */
export function initializeCostTracker(config: Partial<CostTrackerConfig>): CostTracker {
  trackerInstance = new CostTracker(config);
  return trackerInstance;
}

/**
 * Reset the cost tracker singleton
 */
export function resetCostTracker(): void {
  trackerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format cost as currency string
 */
export function formatCostString(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Calculate estimated monthly cost based on daily average
 */
export function estimateMonthlyFromDaily(dailyCost: number): number {
  return dailyCost * 30;
}

/**
 * Calculate cost per request average
 */
export function calculateAverageCostPerRequest(totalCost: number, requestCount: number): number {
  if (requestCount === 0) return 0;
  return totalCost / requestCount;
}
