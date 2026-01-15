/**
 * Analytics Engine
 *
 * Implements Phase 6.4: Performance Analytics Dashboard
 *
 * Provides:
 * - Unified data aggregation from all trackers
 * - Dashboard-ready metrics and summaries
 * - Trend analysis and comparisons
 * - Model performance ranking
 */

import type { TaskType, ProviderType } from '../router-types.js';
import type {
  TimePeriod,
  DashboardData,
  DashboardSummary,
  ModelMetrics,
  TaskTypeMetrics,
  ModelComparison,
  QualityTrends,
  CostAnalytics,
  RequestVolume,
  MetricSeries,
  MetricPoint,
  AggregatedMetric,
  AnalyticsQuery,
  AnalyticsResult,
  AnalyticsAlert,
  AlertConfig,
} from './types.js';
import {
  MetricsStore,
  getMetricsStore,
  getBucketKey,
  type MetricsStoreConfig,
} from './metrics-store.js';
import { getOutcomeTracker } from '../outcome-tracker.js';
import { getCostTracker } from '../cost-tracker.js';
import { getQualityScorer } from '../quality-scorer.js';

// ===== CONFIGURATION =====

/**
 * Analytics engine configuration
 */
export interface AnalyticsEngineConfig {
  /** Metrics store configuration */
  metricsConfig?: MetricsStoreConfig;
  /** Default analysis period in days */
  defaultPeriodDays?: number;
  /** Alert configurations */
  alerts?: AlertConfig[];
  /** Enable caching */
  enableCaching?: boolean;
  /** Cache TTL in seconds */
  cacheTtlSeconds?: number;
}

const DEFAULT_CONFIG: Required<AnalyticsEngineConfig> = {
  metricsConfig: {},
  defaultPeriodDays: 30,
  alerts: [],
  enableCaching: true,
  cacheTtlSeconds: 60,
};

// ===== ANALYTICS ENGINE =====

/**
 * Main analytics engine for aggregating and analyzing router data
 */
export class AnalyticsEngine {
  private readonly config: Required<AnalyticsEngineConfig>;
  private readonly metricsStore: MetricsStore;
  private readonly cache: Map<string, { data: unknown; expiresAt: Date }> = new Map();
  private readonly firedAlerts: Map<string, Date> = new Map();

  constructor(config: AnalyticsEngineConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metricsStore = getMetricsStore(this.config.metricsConfig);
  }

  // ===== DATA COLLECTION =====

  /**
   * Collect metrics from all trackers and store them
   * Call this periodically to update the metrics store
   */
  collectMetrics(): void {
    const now = new Date();
    const outcomeTracker = getOutcomeTracker();
    const costTracker = getCostTracker();
    const qualityScorer = getQualityScorer();

    // Collect outcome tracker stats
    const trackerStats = outcomeTracker.getStats();
    this.metricsStore.record('total_outcomes', trackerStats.totalOutcomes, { timestamp: now });
    this.metricsStore.record('success_rate', trackerStats.overallSuccessRate, { timestamp: now });
    this.metricsStore.record('total_cost_tracked', trackerStats.totalCost, { timestamp: now });

    // Collect cost stats
    const costStats = costTracker.getStats();
    this.metricsStore.record('total_cost', costStats.totalCost, { timestamp: now });
    this.metricsStore.record('total_tokens', costStats.totalTokens, { timestamp: now });
    this.metricsStore.record('request_count', costStats.requestCount, { timestamp: now });

    // Record per-model costs
    for (const [model, cost] of Object.entries(costStats.byModel)) {
      this.metricsStore.record('cost_by_model', cost, {
        timestamp: now,
        model,
      });
    }

    // Record per-task-type costs
    for (const [taskType, cost] of Object.entries(costStats.byTaskType)) {
      this.metricsStore.record('cost_by_task', cost, {
        timestamp: now,
        taskType: taskType as TaskType,
      });
    }

    // Collect quality metrics per model
    const models = this.getModelsFromScorer(qualityScorer);
    for (const model of models) {
      const stats = qualityScorer.getModelStats(model);
      if (stats) {
        // Calculate quality from acceptance and test pass rates
        const quality = this.calculateQualityFromStats(stats);
        this.metricsStore.record('quality_score', quality, {
          timestamp: now,
          model,
        });
        this.metricsStore.record('acceptance_rate', stats.acceptanceRate, {
          timestamp: now,
          model,
        });
        if (stats.testPassRate !== null) {
          this.metricsStore.record('test_pass_rate', stats.testPassRate, {
            timestamp: now,
            model,
          });
        }
      }
    }
  }

  /**
   * Get unique models from quality scorer
   */
  private getModelsFromScorer(qualityScorer: ReturnType<typeof getQualityScorer>): string[] {
    const scores = qualityScorer.getAllScores();
    const models = new Set<string>();
    for (const score of scores) {
      models.add(score.model);
    }
    return Array.from(models);
  }

  /**
   * Calculate quality score from model stats
   */
  private calculateQualityFromStats(stats: {
    acceptanceRate: number;
    testPassRate: number | null;
    averageRating: number | null;
  }): number {
    let quality = 0;
    let weights = 0;

    // Acceptance rate is always available
    quality += stats.acceptanceRate * 0.4;
    weights += 0.4;

    // Test pass rate if available
    if (stats.testPassRate !== null) {
      quality += stats.testPassRate * 0.35;
      weights += 0.35;
    }

    // Average rating if available (normalize from 1-5 to 0-1)
    if (stats.averageRating !== null) {
      quality += ((stats.averageRating - 1) / 4) * 0.25;
      weights += 0.25;
    }

    return weights > 0 ? quality / weights : 0;
  }

  // ===== DASHBOARD DATA =====

  /**
   * Generate complete dashboard data
   */
  getDashboardData(query: AnalyticsQuery = {}): AnalyticsResult<DashboardData> {
    const startTime = Date.now();
    const cacheKey = `dashboard:${JSON.stringify(query)}`;

    // Check cache
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > new Date()) {
        return {
          query,
          data: cached.data as DashboardData,
          computeTimeMs: Date.now() - startTime,
          cached: true,
        };
      }
    }

    // Calculate time range
    const endDate = query.endDate ?? new Date();
    const startDate = query.startDate ?? new Date(
      endDate.getTime() - this.config.defaultPeriodDays * 24 * 60 * 60 * 1000
    );

    // Build dashboard data
    const data: DashboardData = {
      generatedAt: new Date(),
      summary: this.getDashboardSummary(startDate, endDate),
      modelComparison: this.getModelComparison(startDate, endDate, query.models),
      qualityTrends: this.getQualityTrends(startDate, endDate, query.period ?? 'day'),
      costAnalytics: this.getCostAnalytics(startDate, endDate),
      requestVolume: this.getRequestVolume(startDate, endDate),
      modelMetrics: this.getModelMetrics(startDate, endDate, query.models),
      taskTypeMetrics: this.getTaskTypeMetrics(startDate, endDate, query.taskTypes),
    };

    // Cache result
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, {
        data,
        expiresAt: new Date(Date.now() + this.config.cacheTtlSeconds * 1000),
      });
    }

    return {
      query,
      data,
      computeTimeMs: Date.now() - startTime,
      cached: false,
    };
  }

  /**
   * Get dashboard summary metrics
   */
  getDashboardSummary(startDate: Date, endDate: Date): DashboardSummary {
    const outcomeTracker = getOutcomeTracker();
    const costTracker = getCostTracker();
    const qualityScorer = getQualityScorer();

    const stats = outcomeTracker.getStats();
    const costStats = costTracker.getStats(startDate, endDate);

    // Calculate trends (compare to previous period)
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevCostStats = costTracker.getStats(prevStartDate, prevEndDate);

    // Get all models' average quality
    let totalQuality = 0;
    let qualityCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    const activeModels = new Set<string>();

    // Get all pattern stats for detailed metrics
    const allPatternStats = outcomeTracker.getAllPatternStats();
    for (const patternStats of allPatternStats) {
      if (patternStats.avgExecutionTimeMs > 0) {
        totalLatency += patternStats.avgExecutionTimeMs;
        latencyCount++;
      }
    }

    // Get quality from quality scorer
    const models = this.getModelsFromScorer(qualityScorer);
    for (const model of models) {
      activeModels.add(model);
      const modelStats = qualityScorer.getModelStats(model);
      if (modelStats) {
        totalQuality += this.calculateQualityFromStats(modelStats);
        qualityCount++;
      }
    }

    const avgQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;
    const avgLatency = latencyCount > 0 ? totalLatency / latencyCount : 0;

    return {
      period: {
        start: startDate,
        end: endDate,
        days: periodDays,
      },
      totalRequests: costStats.requestCount,
      totalCost: costStats.totalCost,
      overallSuccessRate: stats.overallSuccessRate,
      overallQuality: avgQuality,
      avgLatency,
      activeModels: activeModels.size,
      budgetUtilization: costStats.budgetStatus.monthly.percentage,
      trends: {
        requests: this.calculateTrend('requests', costStats.requestCount, prevCostStats.requestCount),
        cost: this.calculateTrend('cost', costStats.totalCost, prevCostStats.totalCost),
        quality: this.calculateTrend('quality', avgQuality, avgQuality), // Would need historical quality data
        latency: this.calculateTrend('latency', avgLatency, avgLatency), // Would need historical latency data
      },
    };
  }

  /**
   * Get model comparison data
   */
  getModelComparison(
    startDate: Date,
    endDate: Date,
    models?: string[]
  ): ModelComparison {
    const modelMetrics = this.getModelMetrics(startDate, endDate, models);

    // Find best performers
    let bestQuality = '';
    let bestQualityScore = -1;
    let bestCost = '';
    let bestCostValue = Infinity;
    let bestValue = '';
    let bestValueScore = -1;

    for (const metrics of modelMetrics) {
      if (metrics.avgQuality > bestQualityScore) {
        bestQualityScore = metrics.avgQuality;
        bestQuality = metrics.model;
      }
      if (metrics.avgCostPerRequest < bestCostValue && metrics.avgCostPerRequest > 0) {
        bestCostValue = metrics.avgCostPerRequest;
        bestCost = metrics.model;
      }

      // Value = quality / cost (normalized)
      const valueScore = metrics.avgCostPerRequest > 0
        ? metrics.avgQuality / metrics.avgCostPerRequest
        : 0;
      if (valueScore > bestValueScore) {
        bestValueScore = valueScore;
        bestValue = metrics.model;
      }
    }

    // Determine recommendation
    let recommended = bestValue || bestQuality || bestCost || '';
    let recommendationReason = 'Best overall value (quality/cost ratio)';

    // If one model has significantly higher quality, recommend it
    for (const metrics of modelMetrics) {
      if (metrics.model !== recommended && metrics.avgQuality > 0.9 && bestQualityScore < 0.9) {
        recommended = metrics.model;
        recommendationReason = 'High quality score (>90%)';
        break;
      }
    }

    return {
      models: modelMetrics,
      period: { start: startDate, end: endDate },
      bestQuality,
      bestCost,
      bestValue,
      recommended,
      recommendationReason,
    };
  }

  /**
   * Get quality trends over time
   */
  getQualityTrends(
    startDate: Date,
    endDate: Date,
    period: TimePeriod = 'day'
  ): QualityTrends {
    const qualityScorer = getQualityScorer();

    // Get overall quality trend
    const overallSeries = this.metricsStore.getTimeSeries('quality_score', {
      startDate,
      endDate,
      period,
    });

    // Get by-model quality trends
    const byModel = new Map<string, MetricSeries>();
    const models = this.getModelsFromScorer(qualityScorer);
    for (const model of models) {
      const series = this.metricsStore.getTimeSeries('quality_score', {
        startDate,
        endDate,
        period,
        model,
      });
      if (series.points.length > 0) {
        byModel.set(model, series);
      }
    }

    // Calculate by task type
    const byTaskType = new Map<TaskType, MetricSeries>();
    const taskTypes: TaskType[] = ['code_edit', 'reasoning', 'writing', 'refactor', 'research'];
    for (const taskType of taskTypes) {
      const series = this.metricsStore.getTimeSeries('quality_score', {
        startDate,
        endDate,
        period,
        taskType,
      });
      if (series.points.length > 0) {
        byTaskType.set(taskType, series);
      }
    }

    // Calculate moving averages
    const values = overallSeries.points.map(p => p.value);
    const movingAverage7d = this.calculateMovingAverage(values, 7);
    const movingAverage30d = this.calculateMovingAverage(values, 30);

    return {
      overall: overallSeries,
      byModel,
      byTaskType,
      movingAverage7d,
      movingAverage30d,
    };
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics(startDate: Date, endDate: Date): CostAnalytics {
    const costTracker = getCostTracker();
    const costStats = costTracker.getStats(startDate, endDate);

    // Get cost over time
    const costOverTime = this.metricsStore.getTimeSeries('total_cost', {
      startDate,
      endDate,
      period: 'day',
    });

    // Get cost by provider
    const costByProvider: Record<ProviderType, number> = {
      anthropic: 0,
      openai: 0,
      ollama: 0,
      vllm: 0,
      custom: 0,
    };

    // Calculate from cost records
    const records = costTracker.getRecordsInRange(startDate, endDate);
    for (const record of records) {
      if (record.provider in costByProvider) {
        costByProvider[record.provider] += record.cost.totalCost;
      }
    }

    // Calculate daily costs
    const dailyCosts = new Map<string, number>();
    for (const point of costOverTime.points) {
      const key = getBucketKey(point.timestamp, 'day');
      dailyCosts.set(key, (dailyCosts.get(key) ?? 0) + point.value);
    }

    // Project monthly cost
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const dailyRate = periodDays > 0 ? costStats.totalCost / periodDays : 0;
    const projectedMonthlyCost = dailyRate * 30;

    return {
      costOverTime,
      costByModel: costStats.byModel,
      costByTaskType: costStats.byTaskType,
      costByProvider,
      dailyCosts,
      projectedMonthlyCost,
      budgetStatus: {
        daily: costStats.budgetStatus.daily,
        weekly: costStats.budgetStatus.weekly,
        monthly: costStats.budgetStatus.monthly,
      },
    };
  }

  /**
   * Get request volume metrics
   */
  getRequestVolume(startDate: Date, endDate: Date): RequestVolume {
    const costTracker = getCostTracker();
    const costStats = costTracker.getStats(startDate, endDate);

    // Get requests over time
    const overtime = this.metricsStore.getTimeSeries('request_count', {
      startDate,
      endDate,
      period: 'day',
    });

    // Initialize hourly and daily arrays
    const byHour = new Array(24).fill(0);
    const byDayOfWeek = new Array(7).fill(0);

    // Calculate from records
    const records = costTracker.getRecordsInRange(startDate, endDate);
    for (const record of records) {
      const hour = record.timestamp.getUTCHours();
      const day = record.timestamp.getUTCDay();
      byHour[hour]++;
      byDayOfWeek[day]++;
    }

    // Find peak hour and day
    const peakHour = byHour.indexOf(Math.max(...byHour));
    const peakDay = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));

    return {
      total: costStats.requestCount,
      overtime,
      byModel: Object.fromEntries(
        Object.entries(costStats.byModel).map(([model, cost]) => {
          // Estimate request count from cost (rough approximation)
          const avgCostPerRequest = costStats.requestCount > 0
            ? costStats.totalCost / costStats.requestCount
            : 0.01;
          return [model, avgCostPerRequest > 0 ? Math.round(cost / avgCostPerRequest) : 0];
        })
      ),
      byTaskType: Object.fromEntries(
        Object.entries(costStats.byTaskType).map(([taskType, cost]) => {
          const avgCostPerRequest = costStats.requestCount > 0
            ? costStats.totalCost / costStats.requestCount
            : 0.01;
          return [taskType, avgCostPerRequest > 0 ? Math.round(cost / avgCostPerRequest) : 0];
        })
      ) as Record<TaskType, number>,
      byHour,
      byDayOfWeek,
      peakHour,
      peakDay,
    };
  }

  /**
   * Get metrics for each model
   */
  getModelMetrics(
    startDate: Date,
    endDate: Date,
    filterModels?: string[]
  ): ModelMetrics[] {
    const qualityScorer = getQualityScorer();
    const costTracker = getCostTracker();
    const costStats = costTracker.getStats(startDate, endDate);

    const results: ModelMetrics[] = [];
    const models = filterModels ?? this.getModelsFromScorer(qualityScorer);
    const allRecords = costTracker.getRecordsInRange(startDate, endDate);

    for (const model of models) {
      const qualityStats = qualityScorer.getModelStats(model);
      const modelCost = costStats.byModel[model] ?? 0;

      // Calculate request count for this model
      const modelRecords = allRecords.filter(r => r.model === model);
      const totalRequests = modelRecords.length;
      const totalTokens = modelRecords.reduce((sum, r) => sum + r.usage.totalTokens, 0);

      // Determine provider type (simplified)
      let provider: ProviderType = 'custom';
      if (model.includes('claude') || model.includes('anthropic')) {
        provider = 'anthropic';
      } else if (model.includes('gpt') || model.includes('openai')) {
        provider = 'openai';
      } else if (model.includes('ollama')) {
        provider = 'ollama';
      } else if (model.includes('awq') || model.includes('vllm')) {
        provider = 'vllm';
      }

      // Calculate trends
      const halfPeriod = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);

      const recentRecords = modelRecords.filter(r => r.timestamp >= halfPeriod);
      const olderRecords = modelRecords.filter(r => r.timestamp < halfPeriod);

      const usageTrend = olderRecords.length > 0
        ? (recentRecords.length - olderRecords.length) / olderRecords.length
        : recentRecords.length > 0 ? 1 : 0;

      const avgQuality = qualityStats ? this.calculateQualityFromStats(qualityStats) : 0;

      results.push({
        model,
        provider,
        totalRequests,
        successRate: qualityStats?.acceptanceRate ?? 0,
        avgQuality,
        avgLatency: 0, // Would need to track latency per model
        totalCost: modelCost,
        avgCostPerRequest: totalRequests > 0 ? modelCost / totalRequests : 0,
        costPer1KTokens: totalTokens > 0 ? (modelCost / totalTokens) * 1000 : 0,
        totalTokens,
        acceptanceRate: qualityStats?.acceptanceRate ?? 0,
        testPassRate: qualityStats?.testPassRate ?? 0,
        qualityTrend: 0, // Would need historical quality data
        usageTrend,
      });
    }

    return results;
  }

  /**
   * Get metrics for each task type
   */
  getTaskTypeMetrics(
    startDate: Date,
    endDate: Date,
    filterTaskTypes?: TaskType[]
  ): TaskTypeMetrics[] {
    const costTracker = getCostTracker();
    const qualityScorer = getQualityScorer();
    const costStats = costTracker.getStats(startDate, endDate);

    const results: TaskTypeMetrics[] = [];
    const taskTypes: TaskType[] = filterTaskTypes ?? ['code_edit', 'reasoning', 'writing', 'refactor', 'research'];
    const allRecords = costTracker.getRecordsInRange(startDate, endDate);
    const allScores = qualityScorer.getAllScores();

    for (const taskType of taskTypes) {
      const taskCost = costStats.byTaskType[taskType] ?? 0;

      // Get records for this task type
      const taskRecords = allRecords.filter(r => r.taskType === taskType);
      const totalRequests = taskRecords.length;

      // Model distribution
      const modelDistribution: Record<string, number> = {};
      for (const record of taskRecords) {
        modelDistribution[record.model] = (modelDistribution[record.model] ?? 0) + 1;
      }

      // Find primary model
      let primaryModel = '';
      let maxCount = 0;
      for (const [model, count] of Object.entries(modelDistribution)) {
        if (count > maxCount) {
          maxCount = count;
          primaryModel = model;
        }
      }

      // Calculate average quality for this task type
      const taskScores = allScores.filter(s => s.taskType === taskType);
      const avgQuality = taskScores.length > 0
        ? taskScores.reduce((sum, s) => sum + (s.userAccepted ? 1 : 0), 0) / taskScores.length
        : 0;

      // Calculate average latency
      const avgLatency = 0; // Would need latency tracking per task type

      // Success rate based on acceptance
      const successRate = taskScores.length > 0
        ? taskScores.filter(s => s.userAccepted).length / taskScores.length
        : 0;

      results.push({
        taskType,
        totalRequests,
        successRate,
        avgQuality,
        avgLatency,
        totalCost: taskCost,
        primaryModel,
        modelDistribution,
      });
    }

    return results;
  }

  // ===== ALERTS =====

  /**
   * Check for alert conditions and return any triggered alerts
   */
  checkAlerts(): AnalyticsAlert[] {
    const alerts: AnalyticsAlert[] = [];
    const now = new Date();

    for (const config of this.config.alerts) {
      // Check cooldown
      const lastFired = this.firedAlerts.get(config.metric);
      if (lastFired) {
        const cooldownMs = config.cooldownMinutes * 60 * 1000;
        if (now.getTime() - lastFired.getTime() < cooldownMs) {
          continue;
        }
      }

      // Get current metric value
      const latest = this.metricsStore.getLatest(config.metric);
      if (!latest) continue;

      let triggered = false;
      switch (config.condition) {
        case 'above':
          triggered = latest.value > config.threshold;
          break;
        case 'below':
          triggered = latest.value < config.threshold;
          break;
        case 'change': {
          // Check if change from previous exceeds threshold
          const series = this.metricsStore.getTimeSeries(config.metric, {
            period: 'hour',
          });
          if (series.points.length >= 2) {
            const prev = series.points[series.points.length - 2].value;
            const change = Math.abs(latest.value - prev) / (prev || 1);
            triggered = change > config.threshold;
          }
          break;
        }
      }

      if (triggered) {
        const alertId = `${config.metric}-${now.getTime()}`;
        this.firedAlerts.set(config.metric, now);

        // Determine alert type
        let alertType: AnalyticsAlert['type'] = 'quality_drop';
        if (config.metric.includes('cost')) alertType = 'cost_spike';
        if (config.metric.includes('latency')) alertType = 'latency_increase';
        if (config.metric.includes('error') || config.metric.includes('failure')) alertType = 'error_rate';
        if (config.metric.includes('budget')) alertType = 'budget';

        alerts.push({
          id: alertId,
          type: alertType,
          severity: config.severity,
          message: config.messageTemplate
            .replace('{value}', latest.value.toFixed(3))
            .replace('{threshold}', config.threshold.toString()),
          metric: config.metric,
          currentValue: latest.value,
          threshold: config.threshold,
          triggeredAt: now,
          model: latest.model,
          taskType: latest.taskType,
        });
      }
    }

    return alerts;
  }

  // ===== UTILITIES =====

  /**
   * Calculate trend metric
   */
  private calculateTrend(name: string, current: number, previous: number): AggregatedMetric {
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) trend = 'up';
    else if (changePercent < -5) trend = 'down';

    return {
      name,
      value: current,
      previousValue: previous,
      change,
      changePercent,
      trend,
      sampleCount: 1, // Simplified
    };
  }

  /**
   * Calculate moving average
   */
  private calculateMovingAverage(values: number[], window: number): number[] {
    if (values.length === 0) return [];

    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const windowValues = values.slice(start, i + 1);
      const avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
      result.push(avg);
    }
    return result;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: JSON.stringify([...this.cache.entries()]).length,
      entries: this.cache.size,
    };
  }

  /**
   * Stop the analytics engine
   */
  stop(): void {
    this.metricsStore.stop();
    this.cache.clear();
  }
}

// ===== SINGLETON =====

let engineInstance: AnalyticsEngine | null = null;

/**
 * Get or create the singleton AnalyticsEngine
 */
export function getAnalyticsEngine(config?: AnalyticsEngineConfig): AnalyticsEngine {
  if (!engineInstance) {
    engineInstance = new AnalyticsEngine(config);
  }
  return engineInstance;
}

/**
 * Initialize the analytics engine
 */
export function initializeAnalyticsEngine(config: AnalyticsEngineConfig): AnalyticsEngine {
  if (engineInstance) {
    engineInstance.stop();
  }
  engineInstance = new AnalyticsEngine(config);
  return engineInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetAnalyticsEngine(): void {
  if (engineInstance) {
    engineInstance.stop();
    engineInstance = null;
  }
}

// ===== FORMATTERS =====

/**
 * Format dashboard summary as text
 */
export function formatDashboardSummary(summary: DashboardSummary): string {
  const lines = [
    '=== Dashboard Summary ===',
    '',
    `Period: ${summary.period.start.toISOString().split('T')[0]} to ${summary.period.end.toISOString().split('T')[0]} (${summary.period.days} days)`,
    '',
    '--- Overview ---',
    `Total Requests: ${summary.totalRequests.toLocaleString()}`,
    `Total Cost: $${summary.totalCost.toFixed(2)}`,
    `Success Rate: ${(summary.overallSuccessRate * 100).toFixed(1)}%`,
    `Quality Score: ${(summary.overallQuality * 100).toFixed(1)}%`,
    `Avg Latency: ${summary.avgLatency.toFixed(0)}ms`,
    `Active Models: ${summary.activeModels}`,
  ];

  if (summary.budgetUtilization !== undefined) {
    lines.push(`Budget Used: ${summary.budgetUtilization.toFixed(1)}%`);
  }

  lines.push('', '--- Trends (vs previous period) ---');
  for (const [key, trend] of Object.entries(summary.trends)) {
    const arrow = trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→';
    lines.push(`${key}: ${trend.value.toFixed(2)} ${arrow} (${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%)`);
  }

  return lines.join('\n');
}

/**
 * Format model comparison as text
 */
export function formatModelComparison(comparison: ModelComparison): string {
  const lines = [
    '=== Model Comparison ===',
    '',
    `Period: ${comparison.period.start.toISOString().split('T')[0]} to ${comparison.period.end.toISOString().split('T')[0]}`,
    '',
  ];

  // Model table
  lines.push('Model                  | Requests | Quality | Success | Cost/Req | Cost/1K Tokens');
  lines.push('-'.repeat(85));

  for (const m of comparison.models) {
    const name = m.model.padEnd(22).substring(0, 22);
    const requests = m.totalRequests.toString().padStart(8);
    const quality = `${(m.avgQuality * 100).toFixed(1)}%`.padStart(7);
    const success = `${(m.successRate * 100).toFixed(1)}%`.padStart(7);
    const costReq = `$${m.avgCostPerRequest.toFixed(4)}`.padStart(8);
    const cost1K = `$${m.costPer1KTokens.toFixed(4)}`.padStart(14);
    lines.push(`${name} | ${requests} | ${quality} | ${success} | ${costReq} | ${cost1K}`);
  }

  lines.push('', '--- Winners ---');
  lines.push(`Best Quality: ${comparison.bestQuality}`);
  lines.push(`Best Cost: ${comparison.bestCost}`);
  lines.push(`Best Value: ${comparison.bestValue}`);
  lines.push('', `Recommendation: ${comparison.recommended}`);
  lines.push(`Reason: ${comparison.recommendationReason}`);

  return lines.join('\n');
}

/**
 * Format alerts as text
 */
export function formatAlerts(alerts: AnalyticsAlert[]): string {
  if (alerts.length === 0) {
    return 'No active alerts';
  }

  const lines = ['=== Active Alerts ===', ''];

  for (const alert of alerts) {
    const icon = alert.severity === 'critical' ? '🚨' :
                 alert.severity === 'warning' ? '⚠️' : 'ℹ️';
    lines.push(`${icon} [${alert.severity.toUpperCase()}] ${alert.message}`);
    lines.push(`   Metric: ${alert.metric} = ${alert.currentValue.toFixed(3)} (threshold: ${alert.threshold})`);
    lines.push(`   Time: ${alert.triggeredAt.toISOString()}`);
    if (alert.model) lines.push(`   Model: ${alert.model}`);
    if (alert.taskType) lines.push(`   Task: ${alert.taskType}`);
    lines.push('');
  }

  return lines.join('\n');
}
