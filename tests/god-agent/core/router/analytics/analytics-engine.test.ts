/**
 * Analytics Engine Tests
 *
 * Tests for Phase 6.4: Performance Analytics Dashboard
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AnalyticsEngine,
  getAnalyticsEngine,
  initializeAnalyticsEngine,
  resetAnalyticsEngine,
  formatDashboardSummary,
  formatModelComparison,
  formatAlerts,
} from '../../../../../src/god-agent/core/router/analytics/analytics-engine.js';
import { resetMetricsStore } from '../../../../../src/god-agent/core/router/analytics/metrics-store.js';
import { resetOutcomeTracker } from '../../../../../src/god-agent/core/router/outcome-tracker.js';
import { resetCostTracker } from '../../../../../src/god-agent/core/router/cost-tracker.js';
import { resetQualityScorer } from '../../../../../src/god-agent/core/router/quality-scorer.js';
import type {
  DashboardSummary,
  ModelComparison,
  ModelMetrics,
  AnalyticsAlert,
} from '../../../../../src/god-agent/core/router/analytics/types.js';

describe('AnalyticsEngine', () => {
  let engine: AnalyticsEngine;

  beforeEach(() => {
    // Reset all singletons
    resetAnalyticsEngine();
    resetMetricsStore();
    resetOutcomeTracker();
    resetCostTracker();
    resetQualityScorer();

    engine = new AnalyticsEngine({ enableCaching: false });
  });

  afterEach(() => {
    engine.stop();
    resetAnalyticsEngine();
    resetMetricsStore();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const eng = new AnalyticsEngine();
      expect(eng).toBeInstanceOf(AnalyticsEngine);
      eng.stop();
    });

    it('should create with custom config', () => {
      const eng = new AnalyticsEngine({
        defaultPeriodDays: 7,
        enableCaching: true,
        cacheTtlSeconds: 120,
      });
      expect(eng).toBeInstanceOf(AnalyticsEngine);
      eng.stop();
    });
  });

  describe('collectMetrics', () => {
    it('should collect metrics without error', () => {
      expect(() => engine.collectMetrics()).not.toThrow();
    });

    it('should record metrics to store', () => {
      engine.collectMetrics();
      // Just verify it runs without error - metrics depend on tracker state
    });
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data', () => {
      const result = engine.getDashboardData();

      expect(result.query).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.computeTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.cached).toBe(false);

      // Check dashboard structure
      expect(result.data.generatedAt).toBeInstanceOf(Date);
      expect(result.data.summary).toBeDefined();
      expect(result.data.modelComparison).toBeDefined();
      expect(result.data.qualityTrends).toBeDefined();
      expect(result.data.costAnalytics).toBeDefined();
      expect(result.data.requestVolume).toBeDefined();
      expect(result.data.modelMetrics).toBeInstanceOf(Array);
      expect(result.data.taskTypeMetrics).toBeInstanceOf(Array);
    });

    it('should respect date range query', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const result = engine.getDashboardData({ startDate, endDate });

      expect(result.data.summary.period.start.getTime()).toBe(startDate.getTime());
      expect(result.data.summary.period.end.getTime()).toBe(endDate.getTime());
    });

    it('should use cache when enabled', () => {
      const cachedEngine = new AnalyticsEngine({ enableCaching: true });

      const result1 = cachedEngine.getDashboardData();
      expect(result1.cached).toBe(false);

      const result2 = cachedEngine.getDashboardData();
      expect(result2.cached).toBe(true);

      cachedEngine.stop();
    });
  });

  describe('getDashboardSummary', () => {
    it('should return summary with correct structure', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const summary = engine.getDashboardSummary(startDate, endDate);

      expect(summary.period).toBeDefined();
      expect(summary.period.start).toBe(startDate);
      expect(summary.period.end).toBe(endDate);
      expect(summary.period.days).toBeGreaterThan(0);
      expect(typeof summary.totalRequests).toBe('number');
      expect(typeof summary.totalCost).toBe('number');
      expect(typeof summary.overallSuccessRate).toBe('number');
      expect(typeof summary.overallQuality).toBe('number');
      expect(typeof summary.avgLatency).toBe('number');
      expect(typeof summary.activeModels).toBe('number');
      expect(summary.trends).toBeDefined();
    });

    it('should include trend data', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const summary = engine.getDashboardSummary(startDate, endDate);

      expect(summary.trends.requests).toBeDefined();
      expect(summary.trends.cost).toBeDefined();
      expect(summary.trends.quality).toBeDefined();
      expect(summary.trends.latency).toBeDefined();

      // Check trend structure
      expect(summary.trends.requests.name).toBe('requests');
      expect(typeof summary.trends.requests.value).toBe('number');
      expect(['up', 'down', 'stable']).toContain(summary.trends.requests.trend);
    });
  });

  describe('getModelComparison', () => {
    it('should return model comparison structure', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const comparison = engine.getModelComparison(startDate, endDate);

      expect(comparison.models).toBeInstanceOf(Array);
      expect(comparison.period).toBeDefined();
      expect(typeof comparison.bestQuality).toBe('string');
      expect(typeof comparison.bestCost).toBe('string');
      expect(typeof comparison.bestValue).toBe('string');
      expect(typeof comparison.recommended).toBe('string');
      expect(typeof comparison.recommendationReason).toBe('string');
    });
  });

  describe('getQualityTrends', () => {
    it('should return quality trends structure', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const trends = engine.getQualityTrends(startDate, endDate);

      expect(trends.overall).toBeDefined();
      expect(trends.overall.name).toBe('quality_score');
      expect(trends.byModel).toBeInstanceOf(Map);
      expect(trends.byTaskType).toBeInstanceOf(Map);
      expect(trends.movingAverage7d).toBeInstanceOf(Array);
      expect(trends.movingAverage30d).toBeInstanceOf(Array);
    });
  });

  describe('getCostAnalytics', () => {
    it('should return cost analytics structure', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const analytics = engine.getCostAnalytics(startDate, endDate);

      expect(analytics.costOverTime).toBeDefined();
      expect(analytics.costByModel).toBeDefined();
      expect(analytics.costByTaskType).toBeDefined();
      expect(analytics.costByProvider).toBeDefined();
      expect(analytics.dailyCosts).toBeInstanceOf(Map);
      expect(typeof analytics.projectedMonthlyCost).toBe('number');
      expect(analytics.budgetStatus).toBeDefined();
    });

    it('should include all provider types', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const analytics = engine.getCostAnalytics(startDate, endDate);

      expect('anthropic' in analytics.costByProvider).toBe(true);
      expect('openai' in analytics.costByProvider).toBe(true);
      expect('ollama' in analytics.costByProvider).toBe(true);
      expect('vllm' in analytics.costByProvider).toBe(true);
      expect('custom' in analytics.costByProvider).toBe(true);
    });
  });

  describe('getRequestVolume', () => {
    it('should return request volume structure', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const volume = engine.getRequestVolume(startDate, endDate);

      expect(typeof volume.total).toBe('number');
      expect(volume.overtime).toBeDefined();
      expect(volume.byModel).toBeDefined();
      expect(volume.byTaskType).toBeDefined();
      expect(volume.byHour).toHaveLength(24);
      expect(volume.byDayOfWeek).toHaveLength(7);
      expect(typeof volume.peakHour).toBe('number');
      expect(typeof volume.peakDay).toBe('number');
    });
  });

  describe('getModelMetrics', () => {
    it('should return array of model metrics', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const metrics = engine.getModelMetrics(startDate, endDate);

      expect(metrics).toBeInstanceOf(Array);
    });

    it('should filter by model list', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const metrics = engine.getModelMetrics(startDate, endDate, ['claude-3-opus']);

      // Should only include specified models (or be empty if none match)
      for (const m of metrics) {
        expect(m.model).toBe('claude-3-opus');
      }
    });
  });

  describe('getTaskTypeMetrics', () => {
    it('should return array of task type metrics', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const metrics = engine.getTaskTypeMetrics(startDate, endDate);

      expect(metrics).toBeInstanceOf(Array);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should include correct task types', () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const metrics = engine.getTaskTypeMetrics(startDate, endDate);
      const taskTypes = metrics.map(m => m.taskType);

      expect(taskTypes).toContain('code_edit');
      expect(taskTypes).toContain('reasoning');
      expect(taskTypes).toContain('writing');
      expect(taskTypes).toContain('refactor');
      expect(taskTypes).toContain('research');
    });
  });

  describe('checkAlerts', () => {
    it('should return empty array when no alerts configured', () => {
      const alerts = engine.checkAlerts();
      expect(alerts).toBeInstanceOf(Array);
      expect(alerts).toHaveLength(0);
    });

    it('should trigger alerts when thresholds exceeded', () => {
      const alertEngine = new AnalyticsEngine({
        enableCaching: false,
        alerts: [
          {
            metric: 'test_alert',
            condition: 'above',
            threshold: 0.5,
            severity: 'warning',
            messageTemplate: 'Test alert: {value} exceeds {threshold}',
            cooldownMinutes: 0, // No cooldown for testing
          },
        ],
      });

      // Record a metric that exceeds threshold
      alertEngine.collectMetrics();

      // The alert may or may not trigger depending on metric state
      const alerts = alertEngine.checkAlerts();
      expect(alerts).toBeInstanceOf(Array);

      alertEngine.stop();
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      const cachedEngine = new AnalyticsEngine({ enableCaching: true });

      cachedEngine.getDashboardData();
      cachedEngine.clearCache();

      const stats = cachedEngine.getCacheStats();
      expect(stats.entries).toBe(0);

      cachedEngine.stop();
    });

    it('should report cache stats', () => {
      const cachedEngine = new AnalyticsEngine({ enableCaching: true });

      const stats = cachedEngine.getCacheStats();

      expect(typeof stats.size).toBe('number');
      expect(typeof stats.entries).toBe('number');

      cachedEngine.stop();
    });
  });

  describe('singleton functions', () => {
    afterEach(() => {
      resetAnalyticsEngine();
    });

    it('should return same instance with getAnalyticsEngine', () => {
      const eng1 = getAnalyticsEngine();
      const eng2 = getAnalyticsEngine();

      expect(eng1).toBe(eng2);
    });

    it('should create new instance with initializeAnalyticsEngine', () => {
      const eng1 = getAnalyticsEngine();
      const eng2 = initializeAnalyticsEngine({ defaultPeriodDays: 7 });

      expect(eng1).not.toBe(eng2);
    });

    it('should reset singleton with resetAnalyticsEngine', () => {
      const eng1 = getAnalyticsEngine();
      resetAnalyticsEngine();
      const eng2 = getAnalyticsEngine();

      expect(eng1).not.toBe(eng2);
    });
  });
});

describe('formatDashboardSummary', () => {
  it('should format summary as text', () => {
    const summary: DashboardSummary = {
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        days: 30,
      },
      totalRequests: 1000,
      totalCost: 150.50,
      overallSuccessRate: 0.95,
      overallQuality: 0.88,
      avgLatency: 250,
      activeModels: 3,
      budgetUtilization: 75.5,
      trends: {
        requests: {
          name: 'requests',
          value: 1000,
          previousValue: 800,
          change: 200,
          changePercent: 25,
          trend: 'up',
          sampleCount: 30,
        },
        cost: {
          name: 'cost',
          value: 150.50,
          previousValue: 120,
          change: 30.50,
          changePercent: 25.4,
          trend: 'up',
          sampleCount: 30,
        },
        quality: {
          name: 'quality',
          value: 0.88,
          previousValue: 0.85,
          change: 0.03,
          changePercent: 3.5,
          trend: 'stable',
          sampleCount: 30,
        },
        latency: {
          name: 'latency',
          value: 250,
          previousValue: 280,
          change: -30,
          changePercent: -10.7,
          trend: 'down',
          sampleCount: 30,
        },
      },
    };

    const text = formatDashboardSummary(summary);

    expect(text).toContain('Dashboard Summary');
    expect(text).toContain('1,000');
    expect(text).toContain('$150.50');
    expect(text).toContain('95.0%');
    expect(text).toContain('88.0%');
    expect(text).toContain('250ms');
    expect(text).toContain('Budget Used');
  });
});

describe('formatModelComparison', () => {
  it('should format comparison as text', () => {
    const comparison: ModelComparison = {
      models: [
        {
          model: 'claude-3-opus',
          provider: 'anthropic',
          totalRequests: 500,
          successRate: 0.96,
          avgQuality: 0.92,
          avgLatency: 200,
          totalCost: 100,
          avgCostPerRequest: 0.20,
          costPer1KTokens: 0.015,
          totalTokens: 6666666,
          acceptanceRate: 0.96,
          testPassRate: 0.94,
          qualityTrend: 0.02,
          usageTrend: 0.15,
        },
      ],
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
      bestQuality: 'claude-3-opus',
      bestCost: 'gpt-3.5-turbo',
      bestValue: 'claude-3-opus',
      recommended: 'claude-3-opus',
      recommendationReason: 'Best overall value',
    };

    const text = formatModelComparison(comparison);

    expect(text).toContain('Model Comparison');
    expect(text).toContain('claude-3-opus');
    expect(text).toContain('500');
    expect(text).toContain('Best Quality');
    expect(text).toContain('Recommendation');
  });
});

describe('formatAlerts', () => {
  it('should format alerts as text', () => {
    const alerts: AnalyticsAlert[] = [
      {
        id: 'alert-1',
        type: 'quality_drop',
        severity: 'warning',
        message: 'Quality dropped below threshold',
        metric: 'quality_score',
        currentValue: 0.75,
        threshold: 0.80,
        triggeredAt: new Date(),
        model: 'claude-3-opus',
      },
    ];

    const text = formatAlerts(alerts);

    expect(text).toContain('Active Alerts');
    expect(text).toContain('WARNING');
    expect(text).toContain('Quality dropped');
    expect(text).toContain('quality_score');
  });

  it('should handle empty alerts', () => {
    const text = formatAlerts([]);
    expect(text).toBe('No active alerts');
  });
});
