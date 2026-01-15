/**
 * Metrics Store
 *
 * Implements Phase 6.4: Performance Analytics Dashboard
 *
 * Provides:
 * - Time-series metric storage
 * - Aggregation and rollup
 * - Efficient querying by time range
 * - Automatic cleanup of old data
 */

import { randomUUID } from 'crypto';
import type {
  TimePeriod,
  TimeBucket,
  StoredMetric,
  RollupConfig,
  MetricSeries,
  MetricPoint,
} from './types.js';
import type { TaskType } from '../router-types.js';

// ===== CONFIGURATION =====

/**
 * Metrics store configuration
 */
export interface MetricsStoreConfig {
  /** Maximum metrics to keep */
  maxMetrics?: number;
  /** Retention period in days for each granularity */
  retention?: {
    hour: number;
    day: number;
    week: number;
    month: number;
  };
  /** Enable automatic rollups */
  enableRollups?: boolean;
  /** Rollup interval in minutes */
  rollupIntervalMinutes?: number;
}

const DEFAULT_CONFIG: Required<MetricsStoreConfig> = {
  maxMetrics: 100000,
  retention: {
    hour: 7,    // Keep hourly data for 7 days
    day: 90,    // Keep daily data for 90 days
    week: 365,  // Keep weekly data for 1 year
    month: 730, // Keep monthly data for 2 years
  },
  enableRollups: true,
  rollupIntervalMinutes: 60,
};

// ===== TIME BUCKET HELPERS =====

/**
 * Get bucket key for a timestamp
 */
export function getBucketKey(date: Date, period: TimePeriod): string {
  const d = new Date(date);

  switch (period) {
    case 'hour':
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}`;
    case 'day':
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    case 'week': {
      // Get ISO week
      const jan1 = new Date(d.getUTCFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((days + jan1.getUTCDay() + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }
    case 'month':
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
}

/**
 * Get time bucket from key
 */
export function getBucketFromKey(key: string, period: TimePeriod): TimeBucket {
  let start: Date;
  let end: Date;

  switch (period) {
    case 'hour': {
      const [datePart, hour] = key.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      start = new Date(Date.UTC(year, month - 1, day, parseInt(hour), 0, 0, 0));
      end = new Date(start.getTime() + 60 * 60 * 1000);
      break;
    }
    case 'day': {
      const [year, month, day] = key.split('-').map(Number);
      start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      break;
    }
    case 'week': {
      const [year, weekPart] = key.split('-W');
      const weekNum = parseInt(weekPart);
      const jan1 = new Date(Date.UTC(parseInt(year), 0, 1));
      const daysToAdd = (weekNum - 1) * 7 - jan1.getUTCDay();
      start = new Date(jan1.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case 'month': {
      const [year, month] = key.split('-').map(Number);
      start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      break;
    }
  }

  return { start, end, period, key };
}

/**
 * Get the current bucket for a period
 */
export function getCurrentBucket(period: TimePeriod): TimeBucket {
  const now = new Date();
  const key = getBucketKey(now, period);
  return getBucketFromKey(key, period);
}

// ===== METRICS STORE =====

/**
 * In-memory metrics store with time-series support
 */
export class MetricsStore {
  private readonly config: Required<MetricsStoreConfig>;
  private metrics: Map<string, StoredMetric[]> = new Map();
  private rollupTimer?: ReturnType<typeof setInterval>;

  constructor(config: MetricsStoreConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.enableRollups) {
      this.startRollupTimer();
    }
  }

  // ===== RECORDING =====

  /**
   * Record a metric value
   */
  record(
    name: string,
    value: number,
    options: {
      timestamp?: Date;
      period?: TimePeriod;
      model?: string;
      taskType?: TaskType;
      dimensions?: Record<string, string>;
    } = {}
  ): StoredMetric {
    const timestamp = options.timestamp ?? new Date();
    const period = options.period ?? 'hour';
    const bucketKey = getBucketKey(timestamp, period);

    const metric: StoredMetric = {
      id: randomUUID(),
      name,
      value,
      timestamp,
      bucketKey,
      period,
      model: options.model,
      taskType: options.taskType,
      dimensions: options.dimensions,
    };

    const key = this.getStorageKey(name, period, options.model, options.taskType);
    const existing = this.metrics.get(key) ?? [];
    existing.push(metric);
    this.metrics.set(key, existing);

    // Trim if over limit
    if (existing.length > this.config.maxMetrics / 100) {
      this.metrics.set(key, existing.slice(-Math.floor(this.config.maxMetrics / 100)));
    }

    return metric;
  }

  /**
   * Record multiple metrics at once
   */
  recordBatch(
    entries: Array<{
      name: string;
      value: number;
      timestamp?: Date;
      model?: string;
      taskType?: TaskType;
    }>,
    period: TimePeriod = 'hour'
  ): StoredMetric[] {
    return entries.map(entry =>
      this.record(entry.name, entry.value, {
        timestamp: entry.timestamp,
        period,
        model: entry.model,
        taskType: entry.taskType,
      })
    );
  }

  // ===== QUERYING =====

  /**
   * Get metrics by name and time range
   */
  getMetrics(
    name: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      period?: TimePeriod;
      model?: string;
      taskType?: TaskType;
    } = {}
  ): StoredMetric[] {
    const period = options.period ?? 'hour';
    const key = this.getStorageKey(name, period, options.model, options.taskType);
    const stored = this.metrics.get(key) ?? [];

    let filtered = stored;

    if (options.startDate) {
      filtered = filtered.filter(m => m.timestamp >= options.startDate!);
    }

    if (options.endDate) {
      filtered = filtered.filter(m => m.timestamp <= options.endDate!);
    }

    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get metric as time series
   */
  getTimeSeries(
    name: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      period?: TimePeriod;
      model?: string;
      taskType?: TaskType;
    } = {}
  ): MetricSeries {
    const metrics = this.getMetrics(name, options);
    const period = options.period ?? 'hour';

    const points: MetricPoint[] = metrics.map(m => ({
      timestamp: m.timestamp,
      value: m.value,
    }));

    return {
      name,
      points,
      period,
      model: options.model,
      taskType: options.taskType,
    };
  }

  /**
   * Get aggregated metric for a time range
   */
  getAggregated(
    name: string,
    aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count',
    options: {
      startDate?: Date;
      endDate?: Date;
      period?: TimePeriod;
      model?: string;
      taskType?: TaskType;
    } = {}
  ): number {
    const metrics = this.getMetrics(name, options);

    if (metrics.length === 0) return 0;

    const values = metrics.map(m => m.value);

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'count':
        return values.length;
    }
  }

  /**
   * Get metrics grouped by bucket
   */
  getByBucket(
    name: string,
    aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count',
    options: {
      startDate?: Date;
      endDate?: Date;
      period?: TimePeriod;
      model?: string;
      taskType?: TaskType;
    } = {}
  ): Map<string, number> {
    const metrics = this.getMetrics(name, options);
    const buckets = new Map<string, number[]>();

    for (const metric of metrics) {
      const values = buckets.get(metric.bucketKey) ?? [];
      values.push(metric.value);
      buckets.set(metric.bucketKey, values);
    }

    const result = new Map<string, number>();
    for (const [key, values] of buckets) {
      switch (aggregation) {
        case 'sum':
          result.set(key, values.reduce((a, b) => a + b, 0));
          break;
        case 'avg':
          result.set(key, values.reduce((a, b) => a + b, 0) / values.length);
          break;
        case 'max':
          result.set(key, Math.max(...values));
          break;
        case 'min':
          result.set(key, Math.min(...values));
          break;
        case 'count':
          result.set(key, values.length);
          break;
      }
    }

    return result;
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    const names = new Set<string>();
    for (const key of this.metrics.keys()) {
      const [name] = key.split(':');
      names.add(name);
    }
    return Array.from(names);
  }

  /**
   * Get latest value for a metric
   */
  getLatest(
    name: string,
    options: {
      model?: string;
      taskType?: TaskType;
    } = {}
  ): StoredMetric | null {
    // Check each period starting with finest granularity
    for (const period of ['hour', 'day', 'week', 'month'] as TimePeriod[]) {
      const key = this.getStorageKey(name, period, options.model, options.taskType);
      const stored = this.metrics.get(key);
      if (stored && stored.length > 0) {
        return stored[stored.length - 1];
      }
    }
    return null;
  }

  // ===== ROLLUPS =====

  /**
   * Perform rollup from one period to another
   */
  rollup(config: RollupConfig): number {
    let processed = 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1); // Only rollup data older than 1 day

    for (const [key, metrics] of this.metrics) {
      if (!key.includes(`:${config.sourcePeriod}:`)) continue;

      const toRollup = metrics.filter(m => m.timestamp < cutoff);
      if (toRollup.length === 0) continue;

      // Group by target bucket
      const buckets = new Map<string, number[]>();
      for (const metric of toRollup) {
        const targetKey = getBucketKey(metric.timestamp, config.targetPeriod);
        const values = buckets.get(targetKey) ?? [];
        values.push(metric.value);
        buckets.set(targetKey, values);
      }

      // Create rolled up metrics
      const [name] = key.split(':');
      for (const [bucketKey, values] of buckets) {
        let value: number;
        switch (config.aggregation) {
          case 'sum':
            value = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            value = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'max':
            value = Math.max(...values);
            break;
          case 'min':
            value = Math.min(...values);
            break;
          case 'count':
            value = values.length;
            break;
        }

        const bucket = getBucketFromKey(bucketKey, config.targetPeriod);
        this.record(name, value, {
          timestamp: bucket.start,
          period: config.targetPeriod,
        });
        processed++;
      }
    }

    return processed;
  }

  /**
   * Run all standard rollups
   */
  runRollups(): void {
    // Hour -> Day
    this.rollup({
      sourcePeriod: 'hour',
      targetPeriod: 'day',
      aggregation: 'avg',
      retention: this.config.retention.hour,
    });

    // Day -> Week
    this.rollup({
      sourcePeriod: 'day',
      targetPeriod: 'week',
      aggregation: 'avg',
      retention: this.config.retention.day,
    });

    // Week -> Month
    this.rollup({
      sourcePeriod: 'week',
      targetPeriod: 'month',
      aggregation: 'avg',
      retention: this.config.retention.week,
    });
  }

  // ===== CLEANUP =====

  /**
   * Remove old metrics based on retention settings
   */
  cleanup(): number {
    let removed = 0;
    const now = new Date();

    for (const [key, metrics] of this.metrics) {
      const period = this.getPeriodFromKey(key);
      if (!period) continue;

      const retentionDays = this.config.retention[period];
      const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

      const filtered = metrics.filter(m => m.timestamp >= cutoff);
      const removedCount = metrics.length - filtered.length;

      if (removedCount > 0) {
        this.metrics.set(key, filtered);
        removed += removedCount;
      }
    }

    return removed;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Get total metric count
   */
  getMetricCount(): number {
    let count = 0;
    for (const metrics of this.metrics.values()) {
      count += metrics.length;
    }
    return count;
  }

  // ===== LIFECYCLE =====

  /**
   * Stop the store and cleanup
   */
  stop(): void {
    if (this.rollupTimer) {
      clearInterval(this.rollupTimer);
      this.rollupTimer = undefined;
    }
  }

  // ===== PRIVATE =====

  private getStorageKey(
    name: string,
    period: TimePeriod,
    model?: string,
    taskType?: TaskType
  ): string {
    const parts = [name, period];
    if (model) parts.push(`model:${model}`);
    if (taskType) parts.push(`task:${taskType}`);
    return parts.join(':');
  }

  private getPeriodFromKey(key: string): TimePeriod | null {
    for (const period of ['hour', 'day', 'week', 'month'] as TimePeriod[]) {
      if (key.includes(`:${period}`)) {
        return period;
      }
    }
    return null;
  }

  private startRollupTimer(): void {
    this.rollupTimer = setInterval(
      () => {
        this.runRollups();
        this.cleanup();
      },
      this.config.rollupIntervalMinutes * 60 * 1000
    );
  }
}

// ===== SINGLETON =====

let storeInstance: MetricsStore | null = null;

/**
 * Get or create the singleton MetricsStore
 */
export function getMetricsStore(config?: MetricsStoreConfig): MetricsStore {
  if (!storeInstance) {
    storeInstance = new MetricsStore(config);
  }
  return storeInstance;
}

/**
 * Initialize the metrics store
 */
export function initializeMetricsStore(config: MetricsStoreConfig): MetricsStore {
  if (storeInstance) {
    storeInstance.stop();
  }
  storeInstance = new MetricsStore(config);
  return storeInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetMetricsStore(): void {
  if (storeInstance) {
    storeInstance.stop();
    storeInstance = null;
  }
}
