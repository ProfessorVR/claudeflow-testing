/**
 * Router CLI Commands
 *
 * Implements TIER-2.1: Intelligent Model Router - CLI Layer
 *
 * Provides CLI commands for:
 * - Model management (list, test, use)
 * - Routing info and optimization
 * - Cost management and budgets
 * - Quality tracking and ratings
 */

import { getProviderFactory, listAllModelIds, getModelInfo, getConfiguredProviders } from './providers/index.js';
import { getCostTracker, formatCostString } from './cost-tracker.js';
import { getQualityScorer } from './quality-scorer.js';
import { getBudgetEnforcer } from './budget-enforcer.js';
import { getCapabilityRouter } from './capability-router.js';
import { getReviewQueue } from './review-queue.js';
import type { ProviderType, TaskType, Complexity } from './router-types.js';

// ===== SESSION STATE =====

/**
 * Session-level routing preferences
 */
interface SessionRoutingState {
  /** Force use of a specific model */
  forcedModel: string | null;
  /** Preferred provider */
  preferredProvider: ProviderType | null;
  /** Use auto-routing */
  autoRouting: boolean;
  /** Last response ID for rating */
  lastResponseId: string | null;
}

let sessionState: SessionRoutingState = {
  forcedModel: null,
  preferredProvider: null,
  autoRouting: true,
  lastResponseId: null,
};

/**
 * Get current session state
 */
export function getSessionState(): Readonly<SessionRoutingState> {
  return { ...sessionState };
}

/**
 * Reset session state
 */
export function resetSessionState(): void {
  sessionState = {
    forcedModel: null,
    preferredProvider: null,
    autoRouting: true,
    lastResponseId: null,
  };
}

/**
 * Set the last response ID for rating
 */
export function setLastResponseId(id: string): void {
  sessionState.lastResponseId = id;
}

// ===== MODEL COMMANDS =====

/**
 * List available models
 */
export async function listModels(): Promise<string> {
  const lines: string[] = [
    '=== Available Models ===',
    '',
  ];

  try {
    const factory = getProviderFactory();
    const modelIds = listAllModelIds();

    if (modelIds.length === 0) {
      lines.push('No models configured.');
      lines.push('');
      lines.push('Configure models in ~/.god-agent/router-config.yaml');
      return lines.join('\n');
    }

    // Group by provider
    const byProvider: Record<string, string[]> = {};

    for (const modelId of modelIds) {
      const info = getModelInfo(modelId);
      if (info) {
        const providerKey = info.provider;
        if (!byProvider[providerKey]) {
          byProvider[providerKey] = [];
        }
        byProvider[providerKey].push(modelId);
      }
    }

    for (const [provider, models] of Object.entries(byProvider)) {
      lines.push(`--- ${provider.toUpperCase()} ---`);

      for (const modelId of models) {
        const info = getModelInfo(modelId);
        if (info) {
          const status = await testModelConnection(modelId) ? '✓' : '✗';
          const cost = info.costPer1M.input > 0
            ? `$${info.costPer1M.input}/$${info.costPer1M.output} per 1M tokens`
            : 'Free (local)';
          lines.push(`  ${status} ${modelId}`);
          lines.push(`      Capabilities: ${info.capabilities.join(', ')}`);
          lines.push(`      Max Complexity: ${info.maxComplexity}`);
          lines.push(`      Cost: ${cost}`);
        }
      }
      lines.push('');
    }

    // Show session state
    lines.push('--- Session ---');
    if (sessionState.forcedModel) {
      lines.push(`  Forced Model: ${sessionState.forcedModel}`);
    } else if (sessionState.autoRouting) {
      lines.push('  Mode: Auto-routing');
    }

  } catch (error) {
    lines.push(`Error listing models: ${error}`);
  }

  return lines.join('\n');
}

/**
 * Test connection to a model or provider
 */
export async function testModelConnection(modelId: string): Promise<boolean> {
  try {
    const factory = getProviderFactory();
    const provider = await factory.getProvider(modelId);
    if (!provider) {
      return false;
    }
    return await provider.testConnection();
  } catch {
    return false;
  }
}

/**
 * Test all models for a provider
 */
export async function testProvider(providerType: string): Promise<string> {
  const lines: string[] = [
    `=== Testing ${providerType} Provider ===`,
    '',
  ];

  try {
    const modelIds = listAllModelIds().filter(id => {
      const info = getModelInfo(id);
      return info?.provider === providerType;
    });

    if (modelIds.length === 0) {
      return `No models found for provider: ${providerType}`;
    }

    for (const modelId of modelIds) {
      const success = await testModelConnection(modelId);
      lines.push(`  ${success ? '✓' : '✗'} ${modelId}`);
    }

  } catch (error) {
    lines.push(`Error testing provider: ${error}`);
  }

  return lines.join('\n');
}

/**
 * Set session to use a specific model
 */
export function useModel(modelId: string): string {
  if (modelId === 'auto') {
    sessionState.forcedModel = null;
    sessionState.autoRouting = true;
    return 'Switched to auto-routing mode.';
  }

  if (modelId === 'local') {
    // Find first local model
    const localModels = listAllModelIds().filter(id => {
      const info = getModelInfo(id);
      return info?.provider === 'ollama';
    });

    if (localModels.length === 0) {
      return 'No local models available. Install Ollama and pull a model.';
    }

    sessionState.forcedModel = localModels[0];
    sessionState.autoRouting = false;
    return `Using local model: ${localModels[0]}`;
  }

  // Check if model exists
  const info = getModelInfo(modelId);
  if (!info) {
    return `Model not found: ${modelId}. Use 'god models' to list available models.`;
  }

  sessionState.forcedModel = modelId;
  sessionState.autoRouting = false;
  return `Using model: ${modelId}`;
}

// ===== ROUTING COMMANDS =====

/**
 * Show current routing status
 */
export async function showRoutingStatus(): Promise<string> {
  const lines: string[] = [
    '=== Routing Status ===',
    '',
  ];

  // Session state
  lines.push('--- Session ---');
  if (sessionState.forcedModel) {
    lines.push(`  Mode: Manual (${sessionState.forcedModel})`);
  } else {
    lines.push('  Mode: Auto-routing');
  }

  // Configured providers
  lines.push('');
  lines.push('--- Configured Providers ---');
  try {
    const providers = await getConfiguredProviders();
    for (const provider of providers) {
      lines.push(`  ${provider}: Active`);
    }
  } catch {
    lines.push('  (Unable to fetch provider status)');
  }

  // Budget status
  const enforcer = getBudgetEnforcer();
  const remaining = enforcer.getRemainingBudget();

  lines.push('');
  lines.push('--- Budget Status ---');
  if (remaining.daily !== null) {
    lines.push(`  Daily Remaining: ${formatCostString(remaining.daily)}`);
  }
  if (remaining.weekly !== null) {
    lines.push(`  Weekly Remaining: ${formatCostString(remaining.weekly)}`);
  }
  if (remaining.monthly !== null) {
    lines.push(`  Monthly Remaining: ${formatCostString(remaining.monthly)}`);
  }

  // Fallback models
  const fallbacks = enforcer.getFallbackModels();
  if (fallbacks.length > 0) {
    lines.push('');
    lines.push('--- Fallback Chain ---');
    fallbacks.forEach((model, i) => {
      lines.push(`  ${i + 1}. ${model}`);
    });
  }

  return lines.join('\n');
}

/**
 * Suggest routing optimizations based on quality data
 */
export function suggestOptimizations(): string {
  const lines: string[] = [
    '=== Routing Optimization Suggestions ===',
    '',
  ];

  const scorer = getQualityScorer();
  const allStats = scorer.getAllModelStats();

  if (allStats.size === 0) {
    lines.push('Not enough quality data to make suggestions.');
    lines.push('Use models to build up quality history.');
    return lines.join('\n');
  }

  // Find underperforming models
  const underperforming = scorer.getUnderperformingModels(0.5);
  if (underperforming.length > 0) {
    lines.push('--- Underperforming Models ---');
    for (const model of underperforming) {
      const stats = scorer.getModelStats(model);
      if (stats) {
        lines.push(`  ${model}: ${(stats.acceptanceRate * 100).toFixed(1)}% acceptance rate`);
        lines.push(`    Consider removing from routing rules or restricting to simple tasks`);
      }
    }
    lines.push('');
  }

  // Find best models per task type
  lines.push('--- Best Models by Task Type ---');
  const taskTypes: TaskType[] = ['code_edit', 'reasoning', 'writing', 'refactor'];

  for (const taskType of taskTypes) {
    const recommended = scorer.getRecommendedModel(taskType, 'medium');
    if (recommended) {
      lines.push(`  ${taskType}: ${recommended}`);
    }
  }

  // Cost efficiency
  lines.push('');
  lines.push('--- Cost Efficiency ---');
  const tracker = getCostTracker();
  const byModel = tracker.getCostByModel();

  for (const [model, cost] of byModel) {
    const stats = scorer.getModelStats(model);
    if (stats && stats.sampleCount > 0) {
      const costPerRequest = cost / stats.sampleCount;
      lines.push(`  ${model}: ${formatCostString(costPerRequest)}/request, ${(stats.acceptanceRate * 100).toFixed(1)}% accepted`);
    }
  }

  return lines.join('\n');
}

// ===== COST COMMANDS =====

/**
 * Show cost summary
 */
export function showCosts(detailed: boolean = false): string {
  const tracker = getCostTracker();
  const stats = tracker.getStats();

  const lines: string[] = [
    '=== Cost Summary ===',
    '',
    `Total Spent: ${formatCostString(stats.totalCost)}`,
    `Requests: ${stats.requestCount}`,
    `Tokens Used: ${stats.totalTokens.toLocaleString()}`,
    '',
  ];

  // Budget status
  lines.push('--- Budget Status ---');
  const budget = stats.budgetStatus;

  if (budget.daily.limit) {
    lines.push(`  Daily:   ${formatCostString(budget.daily.used)} / ${formatCostString(budget.daily.limit)} (${budget.daily.percentage?.toFixed(1)}%)`);
  } else {
    lines.push(`  Daily:   ${formatCostString(budget.daily.used)} (no limit)`);
  }

  if (budget.weekly.limit) {
    lines.push(`  Weekly:  ${formatCostString(budget.weekly.used)} / ${formatCostString(budget.weekly.limit)} (${budget.weekly.percentage?.toFixed(1)}%)`);
  } else {
    lines.push(`  Weekly:  ${formatCostString(budget.weekly.used)} (no limit)`);
  }

  if (budget.monthly.limit) {
    lines.push(`  Monthly: ${formatCostString(budget.monthly.used)} / ${formatCostString(budget.monthly.limit)} (${budget.monthly.percentage?.toFixed(1)}%)`);
  } else {
    lines.push(`  Monthly: ${formatCostString(budget.monthly.used)} (no limit)`);
  }

  if (detailed) {
    lines.push('');
    lines.push('--- Cost by Model ---');
    for (const [model, cost] of Object.entries(stats.byModel)) {
      lines.push(`  ${model}: ${formatCostString(cost)}`);
    }

    lines.push('');
    lines.push('--- Cost by Task Type ---');
    for (const [taskType, cost] of Object.entries(stats.byTaskType)) {
      if (cost > 0) {
        lines.push(`  ${taskType}: ${formatCostString(cost)}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Set a budget limit
 */
export function setBudget(period: 'daily' | 'weekly' | 'monthly', amount: number): string {
  const enforcer = getBudgetEnforcer();
  const budgets = enforcer.getBudgets();

  budgets[period] = amount;
  enforcer.setBudgets(budgets);

  return `${period.charAt(0).toUpperCase() + period.slice(1)} budget set to ${formatCostString(amount)}`;
}

/**
 * Clear a budget limit
 */
export function clearBudget(period: 'daily' | 'weekly' | 'monthly'): string {
  const enforcer = getBudgetEnforcer();
  const budgets = enforcer.getBudgets();

  delete budgets[period];
  enforcer.setBudgets(budgets);

  return `${period.charAt(0).toUpperCase() + period.slice(1)} budget limit removed.`;
}

// ===== QUALITY COMMANDS =====

/**
 * Rate the last response
 */
export function rateLastResponse(rating: 1 | 2 | 3 | 4 | 5): string {
  if (!sessionState.lastResponseId) {
    return 'No response to rate. Make a request first.';
  }

  const scorer = getQualityScorer();
  const updated = scorer.updateScore(sessionState.lastResponseId, { userRating: rating });

  if (!updated) {
    return 'Could not find response to rate.';
  }

  const ratingText = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1];
  return `Rated response as ${rating}/5 (${ratingText}). Thank you for your feedback!`;
}

/**
 * Show quality statistics
 */
export function showQuality(): string {
  const scorer = getQualityScorer();
  return scorer.formatReport();
}

/**
 * Show quality for a specific model
 */
export function showModelQuality(modelId: string): string {
  const scorer = getQualityScorer();
  const stats = scorer.getModelStats(modelId);

  if (!stats) {
    return `No quality data for model: ${modelId}. Need at least ${scorer.getMinSamplesForStats()} samples.`;
  }

  const lines: string[] = [
    `=== Quality Stats: ${modelId} ===`,
    '',
    `Provider: ${stats.provider}`,
    `Samples: ${stats.sampleCount}`,
    `Average Rating: ${stats.averageRating?.toFixed(2) ?? 'N/A'}`,
    `Acceptance Rate: ${(stats.acceptanceRate * 100).toFixed(1)}%`,
    `Revert Rate: ${(stats.revertRate * 100).toFixed(1)}%`,
    `Test Pass Rate: ${stats.testPassRate !== null ? (stats.testPassRate * 100).toFixed(1) + '%' : 'N/A'}`,
    `Avg Response Time: ${stats.averageResponseTime.toFixed(0)}ms`,
    '',
    '--- By Task Type ---',
  ];

  for (const [taskType, taskStats] of Object.entries(stats.byTaskType)) {
    lines.push(`  ${taskType}: ${taskStats.sampleCount} samples, ${(taskStats.acceptanceRate * 100).toFixed(1)}% accepted`);
  }

  lines.push('');
  lines.push('--- By Complexity ---');
  for (const [complexity, complexityStats] of Object.entries(stats.byComplexity)) {
    lines.push(`  ${complexity}: ${complexityStats.sampleCount} samples, ${(complexityStats.acceptanceRate * 100).toFixed(1)}% accepted`);
  }

  return lines.join('\n');
}

// ===== REVIEW COMMANDS =====

/**
 * Show pending reviews
 */
export function showReviews(limit?: number): string {
  const queue = getReviewQueue();
  return queue.formatPendingList(limit);
}

/**
 * Show review queue summary
 */
export function showReviewStats(): string {
  const queue = getReviewQueue();
  return queue.formatQueueSummary();
}

// ===== COMMAND PARSER =====

/**
 * Parse and execute a router command
 */
export async function executeRouterCommand(command: string, args: string[]): Promise<string> {
  switch (command) {
    // Model commands
    case 'models':
      if (args[0] === 'test' && args[1]) {
        return await testProvider(args[1]);
      }
      return await listModels();

    case 'use':
      if (!args[0]) {
        return 'Usage: god use <model|local|auto>';
      }
      return useModel(args[0]);

    // Routing commands
    case 'routing':
      if (args[0] === 'optimize') {
        return suggestOptimizations();
      }
      return await showRoutingStatus();

    // Cost commands
    case 'costs':
      return showCosts(args.includes('--detailed'));

    case 'budget':
      if (args[0] === 'set' && args[1] && args[2]) {
        const period = args[1] as 'daily' | 'weekly' | 'monthly';
        const amount = parseFloat(args[2]);
        if (!['daily', 'weekly', 'monthly'].includes(period) || isNaN(amount)) {
          return 'Usage: god budget set <daily|weekly|monthly> <amount>';
        }
        return setBudget(period, amount);
      }
      if (args[0] === 'clear' && args[1]) {
        const period = args[1] as 'daily' | 'weekly' | 'monthly';
        if (!['daily', 'weekly', 'monthly'].includes(period)) {
          return 'Usage: god budget clear <daily|weekly|monthly>';
        }
        return clearBudget(period);
      }
      return 'Usage: god budget set|clear <daily|weekly|monthly> [amount]';

    // Quality commands
    case 'rate':
      if (!args[0]) {
        return 'Usage: god rate <1-5>';
      }
      const rating = parseInt(args[0], 10);
      if (rating < 1 || rating > 5) {
        return 'Rating must be between 1 and 5.';
      }
      return rateLastResponse(rating as 1 | 2 | 3 | 4 | 5);

    case 'quality':
      if (args[0]) {
        return showModelQuality(args[0]);
      }
      return showQuality();

    // Review commands
    case 'review':
      if (args[0] === 'stats') {
        return showReviewStats();
      }
      const limit = args[0] ? parseInt(args[0], 10) : undefined;
      return showReviews(limit);

    default:
      return `Unknown command: ${command}. Available commands: models, use, routing, costs, budget, rate, quality, review`;
  }
}

// ===== ROUTER INTEGRATION =====

/**
 * Get the model to use for a request
 * Checks session state, budget, and routing rules
 */
export async function getModelForRequest(
  taskType: TaskType = 'unknown',
  complexity: Complexity = 'medium'
): Promise<{
  modelId: string;
  provider: ProviderType;
  reason: string;
  isFallback: boolean;
}> {
  // Check if model is forced
  if (sessionState.forcedModel) {
    const info = getModelInfo(sessionState.forcedModel);
    return {
      modelId: sessionState.forcedModel,
      provider: (info?.provider ?? 'custom') as ProviderType,
      reason: 'User-specified model',
      isFallback: false,
    };
  }

  // Check budget enforcement
  const enforcer = getBudgetEnforcer();
  const budgetCheck = enforcer.checkRequest('default');

  if (!budgetCheck.allowed) {
    // Budget exceeded, no fallback
    throw new Error(budgetCheck.reason ?? 'Budget exceeded');
  }

  if (budgetCheck.usingFallback && budgetCheck.fallbackModel) {
    const info = getModelInfo(budgetCheck.fallbackModel);
    return {
      modelId: budgetCheck.fallbackModel,
      provider: (info?.provider ?? 'ollama') as ProviderType,
      reason: 'Budget fallback',
      isFallback: true,
    };
  }

  // Use capability router with a synthetic prompt for classification
  const router = getCapabilityRouter();
  const prompt = `${taskType} task with ${complexity} complexity`;
  const decision = await router.route(prompt);

  return {
    modelId: decision.selectedModel,
    provider: decision.selectedProvider,
    reason: decision.reason,
    isFallback: false,
  };
}

/**
 * Record a completed request for quality and cost tracking
 */
export function recordCompletedRequest(
  modelId: string,
  provider: ProviderType,
  taskType: TaskType,
  complexity: Complexity,
  responseTime: number,
  tokensUsed: number,
  inputTokens: number,
  outputTokens: number,
  inputCost: number,
  outputCost: number,
  accepted: boolean = true
): string {
  // Record cost
  const tracker = getCostTracker();
  tracker.recordCost(
    modelId,
    provider,
    { inputTokens, outputTokens, totalTokens: tokensUsed },
    { inputCost, outputCost, totalCost: inputCost + outputCost },
    taskType
  );

  // Record quality
  const scorer = getQualityScorer();
  const score = scorer.recordScore({
    model: modelId,
    provider,
    taskType,
    complexity,
    responseTime,
    tokensUsed,
    userAccepted: accepted,
  });

  // Store for rating
  sessionState.lastResponseId = score.id;

  return score.id;
}
