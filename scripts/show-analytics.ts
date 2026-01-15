#!/usr/bin/env npx tsx
/**
 * Show Analytics Dashboard
 * Usage: npx tsx scripts/show-analytics.ts
 */

import {
  AnalyticsEngine,
  formatDashboardSummary,
  formatModelComparison,
  resetMetricsStore,
  resetAnalyticsEngine
} from '../src/god-agent/core/router/analytics/index.js';
import { resetOutcomeTracker } from '../src/god-agent/core/router/outcome-tracker.js';
import { resetCostTracker, getCostTracker } from '../src/god-agent/core/router/cost-tracker.js';
import { resetQualityScorer, getQualityScorer } from '../src/god-agent/core/router/quality-scorer.js';

// Reset for clean state
resetAnalyticsEngine();
resetMetricsStore();
resetOutcomeTracker();
resetCostTracker();
resetQualityScorer();

// Simulate some data
const costTracker = getCostTracker();
const qualityScorer = getQualityScorer();

// Record some sample cost data
costTracker.recordCost('claude-3-opus', 'anthropic',
  { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
  { inputCost: 0.015, outputCost: 0.075, totalCost: 0.09 },
  'code_edit'
);
costTracker.recordCost('claude-3-sonnet', 'anthropic',
  { inputTokens: 2000, outputTokens: 1000, totalTokens: 3000 },
  { inputCost: 0.006, outputCost: 0.018, totalCost: 0.024 },
  'reasoning'
);
costTracker.recordCost('awq-32b', 'vllm',
  { inputTokens: 5000, outputTokens: 2000, totalTokens: 7000 },
  { inputCost: 0.0, outputCost: 0.0, totalCost: 0.0 },
  'code_edit'
);

// Record quality scores (need 3+ per model for stats)
for (let i = 0; i < 5; i++) {
  qualityScorer.recordScore({
    model: 'claude-3-opus',
    provider: 'anthropic',
    taskType: 'code_edit',
    complexity: 'high',
    responseTime: 2500 + Math.random() * 500,
    tokensUsed: 1500,
    userAccepted: true,
    userReverted: false,
    userRating: 5,
    testsPass: true,
  });
  qualityScorer.recordScore({
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    taskType: 'reasoning',
    complexity: 'medium',
    responseTime: 1200 + Math.random() * 300,
    tokensUsed: 3000,
    userAccepted: true,
    userReverted: false,
    userRating: 4,
    testsPass: true,
  });
  qualityScorer.recordScore({
    model: 'awq-32b',
    provider: 'vllm',
    taskType: 'code_edit',
    complexity: 'medium',
    responseTime: 800 + Math.random() * 200,
    tokensUsed: 7000,
    userAccepted: i < 4, // 80% acceptance
    userReverted: false,
    userRating: (i < 4 ? 4 : 2) as 1 | 2 | 3 | 4 | 5,
    testsPass: i < 4,
  });
}

// Create engine and collect metrics
const engine = new AnalyticsEngine({ enableCaching: false });
engine.collectMetrics();

// Get dashboard data
const endDate = new Date();
const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

console.log(formatDashboardSummary(engine.getDashboardSummary(startDate, endDate)));
console.log();
console.log(formatModelComparison(engine.getModelComparison(startDate, endDate)));

engine.stop();
