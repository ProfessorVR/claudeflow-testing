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

import {
  getProviderFactory,
  listAllModelIds,
  getModelInfo,
  getConfiguredProviders,
  isVLLMConfigured,
  getVLLMStatus,
  listVLLMModels,
} from './providers/index.js';
import { getCostTracker, formatCostString } from './cost-tracker.js';
import { getQualityScorer } from './quality-scorer.js';
import { getBudgetEnforcer } from './budget-enforcer.js';
import { getCapabilityRouter } from './capability-router.js';
import { getReviewQueue } from './review-queue.js';
import {
  getOutcomeTracker,
  formatPatternStats,
  formatTrackerStats,
} from './outcome-tracker.js';
import {
  getRoutingOptimizer,
  formatReport,
  formatSuggestion,
  formatSummary,
} from './routing-optimizer.js';
import type { ProviderType, TaskType, Complexity } from './router-types.js';
import type { RouteRecommendation } from './risk-classifier.js';

// ===== SESSION STATE =====

/**
 * Forced routing mode for the session
 */
export type ForcedRoutingMode = 'auto' | 'local' | 'claude';

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
  /** Forced routing mode */
  forcedRoutingMode: ForcedRoutingMode;
  /** Last response ID for rating */
  lastResponseId: string | null;
}

let sessionState: SessionRoutingState = {
  forcedModel: null,
  preferredProvider: null,
  autoRouting: true,
  forcedRoutingMode: 'auto',
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
    forcedRoutingMode: 'auto',
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
    sessionState.forcedRoutingMode = 'auto';
    return 'Switched to auto-routing mode (risk-based routing enabled).';
  }

  if (modelId === 'local') {
    // Find first local model (prefer vLLM, fallback to Ollama)
    const vllmModels = listAllModelIds().filter(id => {
      const info = getModelInfo(id);
      return info?.provider === 'vllm';
    });

    if (vllmModels.length > 0) {
      sessionState.forcedModel = vllmModels[0];
      sessionState.autoRouting = false;
      sessionState.forcedRoutingMode = 'local';
      return `Using local vLLM model: ${vllmModels[0]}`;
    }

    const ollamaModels = listAllModelIds().filter(id => {
      const info = getModelInfo(id);
      return info?.provider === 'ollama';
    });

    if (ollamaModels.length === 0) {
      return 'No local models available. Start vLLM server or install Ollama.';
    }

    sessionState.forcedModel = ollamaModels[0];
    sessionState.autoRouting = false;
    sessionState.forcedRoutingMode = 'local';
    return `Using local Ollama model: ${ollamaModels[0]}`;
  }

  if (modelId === 'claude') {
    // Find first Claude model
    const claudeModels = listAllModelIds().filter(id => {
      const info = getModelInfo(id);
      return info?.provider === 'anthropic';
    });

    if (claudeModels.length === 0) {
      return 'No Claude models available. Configure ANTHROPIC_API_KEY.';
    }

    sessionState.forcedModel = claudeModels[0];
    sessionState.autoRouting = false;
    sessionState.forcedRoutingMode = 'claude';
    return `Using Claude model: ${claudeModels[0]}`;
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

// ===== VLLM COMMANDS =====

/**
 * Check vLLM server status
 */
export async function showVLLMStatus(): Promise<string> {
  const lines: string[] = [
    '=== vLLM Server Status ===',
    '',
  ];

  // Check if configured
  const configured = await isVLLMConfigured();
  lines.push(`Configured: ${configured ? 'Yes' : 'No'}`);

  if (!configured) {
    lines.push('');
    lines.push('vLLM is not configured. Set VLLM_BASE_URL or configure in router-config.yaml.');
    lines.push('');
    lines.push('Example:');
    lines.push('  export VLLM_BASE_URL=http://localhost:8000');
    lines.push('');
    lines.push('Or start vLLM server with:');
    lines.push('  vllm serve Qwen/Qwen2.5-Coder-32B-Instruct --port 8000');
    return lines.join('\n');
  }

  try {
    const status = await getVLLMStatus();

    lines.push(`Server: ${status.running ? '✓ Online' : '✗ Offline'}`);
    lines.push(`Base URL: ${status.baseUrl}`);

    if (status.running) {
      lines.push(`Models Loaded: ${status.loadedModels.length}`);

      if (status.metrics) {
        if (status.metrics.gpuMemoryUsed !== undefined) {
          lines.push(`GPU Memory: ${(status.metrics.gpuMemoryUsed / 1024 / 1024 / 1024).toFixed(1)} GB`);
        }
        if (status.metrics.requestsInProgress !== undefined) {
          lines.push(`Requests In Progress: ${status.metrics.requestsInProgress}`);
        }
      }

      if (status.loadedModels.length > 0) {
        lines.push('');
        lines.push('--- Loaded Models ---');
        for (const model of status.loadedModels) {
          lines.push(`  • ${model}`);
        }
      }
    } else {
      lines.push('');
      lines.push('Error: Unable to connect to vLLM server');
      lines.push('');
      lines.push('Troubleshooting:');
      lines.push('  1. Ensure vLLM server is running');
      lines.push('  2. Check VLLM_BASE_URL is correct');
      lines.push('  3. Verify firewall allows connections');
    }
  } catch (error) {
    lines.push('');
    lines.push(`Error checking status: ${error}`);
  }

  return lines.join('\n');
}

/**
 * List vLLM models
 */
export async function showVLLMModels(): Promise<string> {
  const lines: string[] = [
    '=== vLLM Models ===',
    '',
  ];

  const configured = await isVLLMConfigured();
  if (!configured) {
    lines.push('vLLM is not configured.');
    return lines.join('\n');
  }

  try {
    const models = await listVLLMModels();

    if (models.length === 0) {
      lines.push('No models loaded in vLLM server.');
      lines.push('');
      lines.push('Load a model with:');
      lines.push('  vllm serve <model-name> --port 8000');
      return lines.join('\n');
    }

    lines.push('--- Available Models ---');
    for (const model of models) {
      const info = getModelInfo(`vllm:${model}`);
      if (info) {
        lines.push(`  ${model}`);
        lines.push(`    Capabilities: ${info.capabilities.join(', ')}`);
        lines.push(`    Context Window: ${info.contextWindow}`);
      } else {
        lines.push(`  ${model} (custom)`);
      }
    }
  } catch (error) {
    lines.push(`Error listing models: ${error}`);
  }

  return lines.join('\n');
}

/**
 * Test vLLM connectivity
 */
export async function testVLLM(): Promise<string> {
  const lines: string[] = [
    '=== vLLM Connection Test ===',
    '',
  ];

  const configured = await isVLLMConfigured();
  if (!configured) {
    lines.push('✗ vLLM is not configured.');
    return lines.join('\n');
  }

  try {
    const status = await getVLLMStatus();

    if (status.running) {
      lines.push('✓ vLLM server is reachable');
      lines.push(`✓ Base URL: ${status.baseUrl}`);
      lines.push(`✓ Models available: ${status.loadedModels.length}`);

      // Try a simple completion if models are available
      if (status.loadedModels.length > 0) {
        const factory = getProviderFactory();
        const modelId = `vllm:${status.loadedModels[0]}`;
        const provider = await factory.getProvider(modelId);

        if (provider) {
          const testResult = await provider.testConnection();
          lines.push(`✓ Test completion: ${testResult ? 'Success' : 'Failed'}`);
        }
      }

      lines.push('');
      lines.push('vLLM is ready for use!');
      lines.push(`Use 'god use local' to force local model usage.`);
    } else {
      lines.push('✗ vLLM server is not responding');
      lines.push('  Error: Connection failed');
    }
  } catch (error) {
    lines.push(`✗ Connection failed: ${error}`);
  }

  return lines.join('\n');
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

/**
 * Show routing statistics from outcome tracking
 */
export function showRoutingStats(): string {
  const tracker = getOutcomeTracker();
  const stats = tracker.getStats();

  const lines: string[] = [
    '=== Routing Statistics ===',
    '',
    formatTrackerStats(stats),
    '',
  ];

  // Add optimizer summary
  const optimizer = getRoutingOptimizer({ tracker });
  const summary = optimizer.getSummary();

  lines.push('--- Patterns Summary ---');
  lines.push(formatSummary(summary));

  return lines.join('\n');
}

/**
 * Show pattern success rates
 */
export function showRoutingPatterns(limit: number = 20): string {
  const tracker = getOutcomeTracker();
  const patterns = tracker.getAllPatternStats();

  if (patterns.length === 0) {
    return 'No routing patterns recorded yet.\nPatterns will appear as tasks are processed.';
  }

  const lines: string[] = [
    '=== Routing Patterns ===',
    '',
    `Total Patterns: ${patterns.length}`,
    '',
    '--- Pattern Success Rates ---',
  ];

  // Sort by total outcomes (most used first)
  const sorted = [...patterns].sort((a, b) => b.totalOutcomes - a.totalOutcomes);

  for (const pattern of sorted.slice(0, limit)) {
    const successPct = Math.round(pattern.successRate * 100);
    const rewritePct = Math.round(pattern.avgRewritePercentage * 100);
    const route = pattern.recommendedRoute;

    const statusIcon =
      successPct >= 85 ? '✓' :
      successPct >= 70 ? '~' : '✗';

    lines.push(`  ${statusIcon} ${pattern.pattern}`);
    lines.push(`      Outcomes: ${pattern.totalOutcomes} | Success: ${successPct}% | Rewrite: ${rewritePct}% | Route: ${route}`);
  }

  if (patterns.length > limit) {
    lines.push('');
    lines.push(`  ... and ${patterns.length - limit} more patterns`);
  }

  return lines.join('\n');
}

/**
 * Show escalation candidates
 */
export function showRoutingEscalations(): string {
  const tracker = getOutcomeTracker();
  const optimizer = getRoutingOptimizer({ tracker });
  const report = optimizer.getEscalationReport();

  const lines: string[] = [
    '=== Escalation Candidates ===',
    '',
    `Total Patterns: ${report.totalPatterns}`,
    `Escalation Rate: ${Math.round(report.escalationRate * 100)}%`,
    '',
  ];

  if (report.candidates.length === 0) {
    lines.push('No patterns currently need escalation.');
    lines.push('');
    lines.push('Patterns are escalated when:');
    lines.push('  • Success rate < 70%');
    lines.push('  • High revert rate');
    lines.push('  • Frequent Claude rewrites > 50%');
    return lines.join('\n');
  }

  lines.push('--- Patterns to Escalate ---');
  for (const pattern of report.candidates) {
    const successPct = Math.round(pattern.successRate * 100);
    lines.push(`  ✗ ${pattern.pattern}`);
    lines.push(`      Success: ${successPct}% | Failures: ${pattern.failureCount}/${pattern.totalOutcomes}`);
    lines.push(`      Recommendation: Always use Claude for this pattern`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get optimization suggestions from the routing optimizer
 */
export function showRoutingSuggestions(): string {
  const tracker = getOutcomeTracker();
  const optimizer = getRoutingOptimizer({ tracker });
  const suggestions = optimizer.suggestRuleChanges();

  if (suggestions.length === 0) {
    return [
      '=== Routing Suggestions ===',
      '',
      'No suggestions at this time.',
      '',
      'Suggestions appear when:',
      '  • Patterns have low success rates (< 70%)',
      '  • High rewrite rates indicate need for review (> 30%)',
      '  • Well-performing Claude patterns could use local models',
      '',
      'Record more outcomes to generate suggestions.',
    ].join('\n');
  }

  const lines: string[] = [
    '=== Routing Suggestions ===',
    '',
    `${suggestions.length} suggestion(s) based on outcome analysis:`,
    '',
  ];

  for (const suggestion of suggestions) {
    lines.push(formatSuggestion(suggestion));
    lines.push(`    Pattern: ${suggestion.pattern}`);
    lines.push(`    Reason: ${suggestion.reason}`);
    lines.push(`    Expected: ${suggestion.expectedImprovement}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate full optimization report
 */
export function showRoutingReport(): string {
  const tracker = getOutcomeTracker();
  const optimizer = getRoutingOptimizer({ tracker });
  const report = optimizer.generateReport();

  return formatReport(report);
}

/**
 * Get the current forced routing mode
 */
export function getForcedRoutingMode(): ForcedRoutingMode {
  return sessionState.forcedRoutingMode;
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
        return 'Usage: god use <model|local|claude|auto>';
      }
      return useModel(args[0]);

    // vLLM commands
    case 'vllm':
      switch (args[0]) {
        case 'status':
          return await showVLLMStatus();
        case 'models':
          return await showVLLMModels();
        case 'test':
          return await testVLLM();
        default:
          return 'Usage: god vllm <status|models|test>';
      }

    // Routing commands
    case 'routing':
      switch (args[0]) {
        case 'stats':
          return showRoutingStats();
        case 'patterns':
          const patternLimit = args[1] ? parseInt(args[1], 10) : 20;
          return showRoutingPatterns(patternLimit);
        case 'escalations':
          return showRoutingEscalations();
        case 'suggest':
          return showRoutingSuggestions();
        case 'report':
          return showRoutingReport();
        case 'optimize':
          return suggestOptimizations();
        default:
          return await showRoutingStatus();
      }

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
      return [
        `Unknown command: ${command}`,
        '',
        'Available commands:',
        '  models [test <provider>]  - List or test models',
        '  use <model|local|claude|auto>  - Set model to use',
        '  vllm <status|models|test>  - vLLM server management',
        '  routing [stats|patterns|escalations|suggest|report]  - Routing insights',
        '  costs [--detailed]  - Show cost summary',
        '  budget <set|clear> <period> [amount]  - Budget management',
        '  rate <1-5>  - Rate last response',
        '  quality [model]  - Show quality stats',
        '  review [stats|limit]  - Show pending reviews',
      ].join('\n');
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
