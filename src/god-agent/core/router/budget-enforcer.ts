/**
 * Budget Enforcer
 *
 * Implements TIER-2.1: Intelligent Model Router - Budget Enforcement Layer
 *
 * Provides:
 * - Budget limit enforcement
 * - Pre-request cost estimation
 * - Fallback model selection on budget limits
 * - Alert and action triggers
 */

import {
  CostTracker,
  getCostTracker,
} from './cost-tracker.js';
import type {
  BudgetLimits,
  AlertConfig,
  ProviderType,
  TaskType,
  CostBreakdown,
  RouterEvent,
  RouterEventHandler,
  RouterEventType,
} from './router-types.js';
import { BudgetExceededError } from './router-types.js';

// ===== BUDGET ENFORCER CONFIGURATION =====

/**
 * Configuration for budget enforcer
 */
export interface BudgetEnforcerConfig {
  /** Whether budget enforcement is enabled */
  enabled: boolean;
  /** Budget limits */
  budgets: BudgetLimits;
  /** Alert configuration */
  alerts: AlertConfig[];
  /** Models to use when budget is exceeded (in order of preference) */
  fallbackModels: string[];
  /** Whether to block requests when budget is exceeded and no fallback available */
  blockOnBudgetExceeded: boolean;
  /** Grace period in seconds after budget exceeded before blocking */
  gracePercentage: number;
}

const DEFAULT_CONFIG: Required<BudgetEnforcerConfig> = {
  enabled: true,
  budgets: {},
  alerts: [],
  fallbackModels: [],
  blockOnBudgetExceeded: true,
  gracePercentage: 5, // Allow 5% over budget as grace
};

// ===== ENFORCEMENT RESULT =====

/**
 * Result of a budget enforcement check
 */
export interface EnforcementResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Reason if blocked */
  reason?: string;
  /** Suggested fallback model if original blocked */
  fallbackModel?: string;
  /** Whether using a fallback */
  usingFallback: boolean;
  /** Current budget status */
  budgetStatus: {
    period: 'daily' | 'weekly' | 'monthly';
    used: number;
    limit: number;
    percentage: number;
  } | null;
  /** Warnings if any */
  warnings: string[];
}

/**
 * Pre-request check result
 */
export interface PreRequestCheck {
  /** Whether the request can proceed */
  canProceed: boolean;
  /** Estimated cost of the request */
  estimatedCost: number;
  /** Model to use (may differ from requested if fallback) */
  modelToUse: string;
  /** Whether this is a fallback model */
  isFallback: boolean;
  /** Warnings about budget status */
  warnings: string[];
  /** Block reason if cannot proceed */
  blockReason?: string;
}

// ===== BUDGET ENFORCER =====

/**
 * Budget enforcer for controlling LLM spending
 */
export class BudgetEnforcer {
  private readonly config: Required<BudgetEnforcerConfig>;
  private readonly costTracker: CostTracker;
  private eventHandlers: Map<RouterEventType, RouterEventHandler[]> = new Map();

  constructor(
    config: Partial<BudgetEnforcerConfig> = {},
    costTracker?: CostTracker
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.costTracker = costTracker ?? getCostTracker();

    // Sync budgets with cost tracker
    if (this.config.budgets) {
      this.costTracker.setBudgets(this.config.budgets);
    }
    if (this.config.alerts) {
      this.costTracker.setAlerts(this.config.alerts);
    }
  }

  // ===== CONFIGURATION =====

  /**
   * Check if budget enforcement is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current budget limits
   */
  getBudgets(): BudgetLimits {
    return { ...this.config.budgets };
  }

  /**
   * Update budget limits
   */
  setBudgets(budgets: Partial<BudgetLimits>): void {
    this.config.budgets = { ...this.config.budgets, ...budgets };
    this.costTracker.setBudgets(this.config.budgets);
  }

  /**
   * Get fallback models
   */
  getFallbackModels(): string[] {
    return [...this.config.fallbackModels];
  }

  /**
   * Set fallback models
   */
  setFallbackModels(models: string[]): void {
    this.config.fallbackModels = [...models];
  }

  // ===== ENFORCEMENT =====

  /**
   * Check if a request should be allowed
   */
  checkRequest(requestedModel: string, estimatedCost?: CostBreakdown): EnforcementResult {
    if (!this.config.enabled) {
      return {
        allowed: true,
        usingFallback: false,
        budgetStatus: null,
        warnings: [],
      };
    }

    const warnings: string[] = [];
    const budgetStatus = this.costTracker.getBudgetStatus();

    // Check each period
    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const status = budgetStatus[period];
      if (status.limit !== undefined && status.percentage !== undefined) {
        // Calculate effective percentage including grace
        const graceLimit = 100 + this.config.gracePercentage;

        if (status.percentage >= graceLimit) {
          // Hard limit exceeded - block or fallback
          if (this.config.blockOnBudgetExceeded) {
            const fallbackModel = this.getFallbackForBudget();

            if (fallbackModel && fallbackModel !== requestedModel) {
              // Use fallback
              this.emitEvent({
                type: 'fallback_triggered',
                timestamp: new Date(),
                data: {
                  reason: 'budget_exceeded',
                  originalModel: requestedModel,
                  fallbackModel,
                  period,
                  percentage: status.percentage,
                },
              });

              return {
                allowed: true,
                fallbackModel,
                usingFallback: true,
                budgetStatus: {
                  period,
                  used: status.used,
                  limit: status.limit,
                  percentage: status.percentage,
                },
                warnings: [`${period} budget exceeded, using fallback model`],
              };
            }

            // No fallback available - block
            this.emitEvent({
              type: 'budget_exceeded',
              timestamp: new Date(),
              data: {
                period,
                used: status.used,
                limit: status.limit,
                percentage: status.percentage,
              },
            });

            return {
              allowed: false,
              reason: `${period} budget exceeded: $${status.used.toFixed(2)} / $${status.limit.toFixed(2)} (${status.percentage.toFixed(1)}%)`,
              usingFallback: false,
              budgetStatus: {
                period,
                used: status.used,
                limit: status.limit,
                percentage: status.percentage,
              },
              warnings: [],
            };
          }
        } else if (status.percentage >= 100) {
          // Within grace period
          warnings.push(`${period} budget at ${status.percentage.toFixed(1)}% (grace period)`);
        } else if (status.percentage >= 80) {
          // Warning threshold
          warnings.push(`${period} budget at ${status.percentage.toFixed(1)}%`);

          this.emitEvent({
            type: 'budget_warning',
            timestamp: new Date(),
            data: {
              period,
              used: status.used,
              limit: status.limit,
              percentage: status.percentage,
            },
          });
        }
      }
    }

    return {
      allowed: true,
      usingFallback: false,
      budgetStatus: null,
      warnings,
    };
  }

  /**
   * Check if a request can proceed, accounting for estimated cost
   */
  preRequestCheck(
    requestedModel: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number,
    getCostFn: (input: number, output: number) => CostBreakdown
  ): PreRequestCheck {
    if (!this.config.enabled) {
      return {
        canProceed: true,
        estimatedCost: 0,
        modelToUse: requestedModel,
        isFallback: false,
        warnings: [],
      };
    }

    const estimatedCost = getCostFn(estimatedInputTokens, estimatedOutputTokens);
    const result = this.checkRequest(requestedModel, estimatedCost);

    if (!result.allowed) {
      return {
        canProceed: false,
        estimatedCost: estimatedCost.totalCost,
        modelToUse: requestedModel,
        isFallback: false,
        warnings: result.warnings,
        blockReason: result.reason,
      };
    }

    if (result.usingFallback && result.fallbackModel) {
      return {
        canProceed: true,
        estimatedCost: estimatedCost.totalCost,
        modelToUse: result.fallbackModel,
        isFallback: true,
        warnings: result.warnings,
      };
    }

    return {
      canProceed: true,
      estimatedCost: estimatedCost.totalCost,
      modelToUse: requestedModel,
      isFallback: false,
      warnings: result.warnings,
    };
  }

  /**
   * Check and potentially throw if budget exceeded
   */
  enforceOrThrow(requestedModel: string): void {
    const result = this.checkRequest(requestedModel);

    if (!result.allowed) {
      const period = result.budgetStatus?.period ?? 'unknown';
      const used = result.budgetStatus?.used ?? 0;
      const limit = result.budgetStatus?.limit ?? 0;

      throw new BudgetExceededError(
        period as 'daily' | 'weekly' | 'monthly',
        used,
        limit
      );
    }
  }

  /**
   * Get the best fallback model for budget constraints
   */
  getFallbackForBudget(): string | null {
    // Prefer local/free models first (usually Ollama models)
    for (const model of this.config.fallbackModels) {
      // Simple heuristic: if model contains "local" or "ollama", prefer it
      if (model.toLowerCase().includes('local') || model.toLowerCase().includes('ollama')) {
        return model;
      }
    }

    // Otherwise return first available fallback
    return this.config.fallbackModels[0] ?? null;
  }

  // ===== COST ESTIMATION =====

  /**
   * Estimate if a request will exceed budget
   */
  willExceedBudget(estimatedCost: number): {
    willExceed: boolean;
    period?: 'daily' | 'weekly' | 'monthly';
    currentUsage?: number;
    limit?: number;
  } {
    const budgetStatus = this.costTracker.getBudgetStatus();

    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const status = budgetStatus[period];
      if (status.limit !== undefined) {
        const projectedUsage = status.used + estimatedCost;
        if (projectedUsage > status.limit) {
          return {
            willExceed: true,
            period,
            currentUsage: status.used,
            limit: status.limit,
          };
        }
      }
    }

    return { willExceed: false };
  }

  /**
   * Get remaining budget for expensive operations
   */
  getRemainingBudget(): {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
    lowestRemaining: { period: 'daily' | 'weekly' | 'monthly'; amount: number } | null;
  } {
    const daily = this.costTracker.getRemainingBudget('daily');
    const weekly = this.costTracker.getRemainingBudget('weekly');
    const monthly = this.costTracker.getRemainingBudget('monthly');

    // Find lowest remaining
    const remaining = [
      daily !== null ? { period: 'daily' as const, amount: daily } : null,
      weekly !== null ? { period: 'weekly' as const, amount: weekly } : null,
      monthly !== null ? { period: 'monthly' as const, amount: monthly } : null,
    ].filter(Boolean) as Array<{ period: 'daily' | 'weekly' | 'monthly'; amount: number }>;

    remaining.sort((a, b) => a.amount - b.amount);

    return {
      daily,
      weekly,
      monthly,
      lowestRemaining: remaining[0] ?? null,
    };
  }

  /**
   * Check if an expensive operation should proceed
   */
  shouldProceedWithExpensiveOperation(estimatedCost: number, threshold: number = 0.5): boolean {
    const remaining = this.getRemainingBudget();

    if (remaining.lowestRemaining === null) {
      // No budget limits set
      return true;
    }

    // If the estimated cost is more than the threshold percentage of remaining budget, warn
    return estimatedCost <= (remaining.lowestRemaining.amount * threshold);
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
   * Get enforcement summary
   */
  getEnforcementSummary(): string {
    const budgetStatus = this.costTracker.getBudgetStatus();
    const remaining = this.getRemainingBudget();

    const lines = [
      '=== Budget Enforcement Summary ===',
      '',
      `Enforcement Enabled: ${this.config.enabled ? 'Yes' : 'No'}`,
      `Block on Exceeded: ${this.config.blockOnBudgetExceeded ? 'Yes' : 'No'}`,
      `Grace Percentage: ${this.config.gracePercentage}%`,
      '',
      '--- Current Status ---',
    ];

    for (const period of ['daily', 'weekly', 'monthly'] as const) {
      const status = budgetStatus[period];
      if (status.limit !== undefined) {
        const remainingAmount = remaining[period];
        lines.push(
          `${period.charAt(0).toUpperCase() + period.slice(1)}: ` +
          `$${status.used.toFixed(4)} / $${status.limit.toFixed(2)} ` +
          `(${status.percentage?.toFixed(1)}%) - ` +
          `$${remainingAmount?.toFixed(2) ?? 'N/A'} remaining`
        );
      }
    }

    if (this.config.fallbackModels.length > 0) {
      lines.push('');
      lines.push('--- Fallback Models ---');
      this.config.fallbackModels.forEach((model, i) => {
        lines.push(`  ${i + 1}. ${model}`);
      });
    }

    return lines.join('\n');
  }
}

// ===== SINGLETON INSTANCE =====

let enforcerInstance: BudgetEnforcer | null = null;

/**
 * Get the singleton budget enforcer instance
 */
export function getBudgetEnforcer(
  config?: Partial<BudgetEnforcerConfig>,
  costTracker?: CostTracker
): BudgetEnforcer {
  if (!enforcerInstance) {
    enforcerInstance = new BudgetEnforcer(config, costTracker);
  }
  return enforcerInstance;
}

/**
 * Initialize the budget enforcer with config
 */
export function initializeBudgetEnforcer(
  config: Partial<BudgetEnforcerConfig>,
  costTracker?: CostTracker
): BudgetEnforcer {
  enforcerInstance = new BudgetEnforcer(config, costTracker);
  return enforcerInstance;
}

/**
 * Reset the budget enforcer singleton
 */
export function resetBudgetEnforcer(): void {
  enforcerInstance = null;
}
