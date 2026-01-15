/**
 * Analytics Types
 *
 * Implements Phase 6.4: Performance Analytics Dashboard
 *
 * Provides type definitions for:
 * - Time-series metrics
 * - Aggregated statistics
 * - Dashboard data structures
 * - Trend analysis
 */

import type { TaskType, Complexity, ProviderType } from '../router-types.js';

// ===== TIME PERIODS =====

/**
 * Time period for aggregation
 */
export type TimePeriod = 'hour' | 'day' | 'week' | 'month';

/**
 * Time bucket for time-series data
 */
export interface TimeBucket {
  /** Start of the bucket */
  start: Date;
  /** End of the bucket */
  end: Date;
  /** Period type */
  period: TimePeriod;
  /** Bucket key (e.g., "2024-01-15" for day) */
  key: string;
}

// ===== METRICS =====

/**
 * Single metric data point
 */
export interface MetricPoint {
  /** Timestamp */
  timestamp: Date;
  /** Metric value */
  value: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Time-series of a metric
 */
export interface MetricSeries {
  /** Metric name */
  name: string;
  /** Data points */
  points: MetricPoint[];
  /** Aggregation period */
  period: TimePeriod;
  /** Model (if model-specific) */
  model?: string;
  /** Task type (if task-specific) */
  taskType?: TaskType;
}

/**
 * Aggregated metric value
 */
export interface AggregatedMetric {
  /** Metric name */
  name: string;
  /** Current value */
  value: number;
  /** Previous period value */
  previousValue: number;
  /** Change from previous period */
  change: number;
  /** Percentage change */
  changePercent: number;
  /** Trend direction */
  trend: 'up' | 'down' | 'stable';
  /** Sample count */
  sampleCount: number;
}

// ===== MODEL METRICS =====

/**
 * Metrics for a specific model
 */
export interface ModelMetrics {
  /** Model ID */
  model: string;
  /** Provider type */
  provider: ProviderType;
  /** Total requests */
  totalRequests: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average quality score (0-1) */
  avgQuality: number;
  /** Average latency in ms */
  avgLatency: number;
  /** Total cost */
  totalCost: number;
  /** Cost per request */
  avgCostPerRequest: number;
  /** Cost per 1K tokens */
  costPer1KTokens: number;
  /** Total tokens used */
  totalTokens: number;
  /** Acceptance rate */
  acceptanceRate: number;
  /** Test pass rate */
  testPassRate: number;
  /** Quality trend over period */
  qualityTrend: number;
  /** Usage trend over period */
  usageTrend: number;
}

/**
 * Task type metrics
 */
export interface TaskTypeMetrics {
  /** Task type */
  taskType: TaskType;
  /** Total requests */
  totalRequests: number;
  /** Success rate */
  successRate: number;
  /** Average quality */
  avgQuality: number;
  /** Average latency */
  avgLatency: number;
  /** Total cost */
  totalCost: number;
  /** Most used model */
  primaryModel: string;
  /** Model distribution */
  modelDistribution: Record<string, number>;
}

// ===== DASHBOARD DATA =====

/**
 * Summary metrics for dashboard header
 */
export interface DashboardSummary {
  /** Time period covered */
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  /** Total requests in period */
  totalRequests: number;
  /** Total cost in period */
  totalCost: number;
  /** Overall success rate */
  overallSuccessRate: number;
  /** Overall quality score */
  overallQuality: number;
  /** Average latency */
  avgLatency: number;
  /** Active models count */
  activeModels: number;
  /** Budget utilization (if budget set) */
  budgetUtilization?: number;
  /** Key trends */
  trends: {
    requests: AggregatedMetric;
    cost: AggregatedMetric;
    quality: AggregatedMetric;
    latency: AggregatedMetric;
  };
}

/**
 * Model comparison data
 */
export interface ModelComparison {
  /** Models being compared */
  models: ModelMetrics[];
  /** Comparison period */
  period: {
    start: Date;
    end: Date;
  };
  /** Best performer by quality */
  bestQuality: string;
  /** Best performer by cost */
  bestCost: string;
  /** Best value (quality/cost) */
  bestValue: string;
  /** Recommended model */
  recommended: string;
  /** Recommendation reason */
  recommendationReason: string;
}

/**
 * Quality trends data
 */
export interface QualityTrends {
  /** Overall quality over time */
  overall: MetricSeries;
  /** Quality by model */
  byModel: Map<string, MetricSeries>;
  /** Quality by task type */
  byTaskType: Map<TaskType, MetricSeries>;
  /** 7-day moving average */
  movingAverage7d: number[];
  /** 30-day moving average */
  movingAverage30d: number[];
}

/**
 * Cost analysis data
 */
export interface CostAnalytics {
  /** Total cost over time */
  costOverTime: MetricSeries;
  /** Cost by model */
  costByModel: Record<string, number>;
  /** Cost by task type */
  costByTaskType: Record<TaskType, number>;
  /** Cost by provider */
  costByProvider: Record<ProviderType, number>;
  /** Daily cost breakdown */
  dailyCosts: Map<string, number>;
  /** Projected monthly cost */
  projectedMonthlyCost: number;
  /** Budget status */
  budgetStatus: {
    daily: { used: number; limit?: number; percent?: number };
    weekly: { used: number; limit?: number; percent?: number };
    monthly: { used: number; limit?: number; percent?: number };
  };
}

/**
 * Request volume data
 */
export interface RequestVolume {
  /** Total requests */
  total: number;
  /** Requests over time */
  overtime: MetricSeries;
  /** Requests by model */
  byModel: Record<string, number>;
  /** Requests by task type */
  byTaskType: Record<TaskType, number>;
  /** Requests by hour of day */
  byHour: number[];
  /** Requests by day of week */
  byDayOfWeek: number[];
  /** Peak hour */
  peakHour: number;
  /** Peak day */
  peakDay: number;
}

/**
 * Complete dashboard data
 */
export interface DashboardData {
  /** Generation timestamp */
  generatedAt: Date;
  /** Summary metrics */
  summary: DashboardSummary;
  /** Model comparison */
  modelComparison: ModelComparison;
  /** Quality trends */
  qualityTrends: QualityTrends;
  /** Cost analytics */
  costAnalytics: CostAnalytics;
  /** Request volume */
  requestVolume: RequestVolume;
  /** Model-specific metrics */
  modelMetrics: ModelMetrics[];
  /** Task type metrics */
  taskTypeMetrics: TaskTypeMetrics[];
}

// ===== QUERY TYPES =====

/**
 * Query options for analytics
 */
export interface AnalyticsQuery {
  /** Start date */
  startDate?: Date;
  /** End date */
  endDate?: Date;
  /** Time period for aggregation */
  period?: TimePeriod;
  /** Filter by model */
  models?: string[];
  /** Filter by task type */
  taskTypes?: TaskType[];
  /** Filter by provider */
  providers?: ProviderType[];
  /** Include trends */
  includeTrends?: boolean;
  /** Include time series */
  includeTimeSeries?: boolean;
}

/**
 * Analytics result with metadata
 */
export interface AnalyticsResult<T> {
  /** Query parameters used */
  query: AnalyticsQuery;
  /** Result data */
  data: T;
  /** Computation time in ms */
  computeTimeMs: number;
  /** Cache status */
  cached: boolean;
}

// ===== STORED METRICS =====

/**
 * Stored metric record
 */
export interface StoredMetric {
  /** Unique ID */
  id: string;
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Timestamp */
  timestamp: Date;
  /** Time bucket key */
  bucketKey: string;
  /** Period type */
  period: TimePeriod;
  /** Model (if applicable) */
  model?: string;
  /** Task type (if applicable) */
  taskType?: TaskType;
  /** Additional dimensions */
  dimensions?: Record<string, string>;
}

/**
 * Rollup configuration
 */
export interface RollupConfig {
  /** Source period */
  sourcePeriod: TimePeriod;
  /** Target period */
  targetPeriod: TimePeriod;
  /** Aggregation function */
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
  /** Retention in days */
  retention: number;
}

// ===== ALERTS =====

/**
 * Analytics alert
 */
export interface AnalyticsAlert {
  /** Alert ID */
  id: string;
  /** Alert type */
  type: 'quality_drop' | 'cost_spike' | 'latency_increase' | 'error_rate' | 'budget';
  /** Severity */
  severity: 'info' | 'warning' | 'critical';
  /** Alert message */
  message: string;
  /** Metric that triggered */
  metric: string;
  /** Current value */
  currentValue: number;
  /** Threshold value */
  threshold: number;
  /** Triggered at */
  triggeredAt: Date;
  /** Model (if applicable) */
  model?: string;
  /** Task type (if applicable) */
  taskType?: TaskType;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Metric to monitor */
  metric: string;
  /** Condition */
  condition: 'above' | 'below' | 'change';
  /** Threshold value */
  threshold: number;
  /** Severity */
  severity: 'info' | 'warning' | 'critical';
  /** Message template */
  messageTemplate: string;
  /** Cooldown in minutes */
  cooldownMinutes: number;
}
