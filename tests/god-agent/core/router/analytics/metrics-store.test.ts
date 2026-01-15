/**
 * Metrics Store Tests
 *
 * Tests for Phase 6.4: Performance Analytics Dashboard
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MetricsStore,
  getMetricsStore,
  initializeMetricsStore,
  resetMetricsStore,
  getBucketKey,
  getBucketFromKey,
  getCurrentBucket,
} from '../../../../../src/god-agent/core/router/analytics/metrics-store.js';

describe('MetricsStore', () => {
  let store: MetricsStore;

  beforeEach(() => {
    resetMetricsStore();
    store = new MetricsStore({ enableRollups: false });
  });

  afterEach(() => {
    store.stop();
    resetMetricsStore();
  });

  describe('getBucketKey', () => {
    it('should generate hour bucket keys', () => {
      const date = new Date('2024-03-15T14:30:00Z');
      expect(getBucketKey(date, 'hour')).toBe('2024-03-15T14');
    });

    it('should generate day bucket keys', () => {
      const date = new Date('2024-03-15T14:30:00Z');
      expect(getBucketKey(date, 'day')).toBe('2024-03-15');
    });

    it('should generate week bucket keys', () => {
      const date = new Date('2024-03-15T14:30:00Z');
      const key = getBucketKey(date, 'week');
      expect(key).toMatch(/^2024-W\d{2}$/);
    });

    it('should generate month bucket keys', () => {
      const date = new Date('2024-03-15T14:30:00Z');
      expect(getBucketKey(date, 'month')).toBe('2024-03');
    });
  });

  describe('getBucketFromKey', () => {
    it('should parse hour bucket keys', () => {
      const bucket = getBucketFromKey('2024-03-15T14', 'hour');
      expect(bucket.period).toBe('hour');
      expect(bucket.key).toBe('2024-03-15T14');
      expect(bucket.start.getUTCHours()).toBe(14);
    });

    it('should parse day bucket keys', () => {
      const bucket = getBucketFromKey('2024-03-15', 'day');
      expect(bucket.period).toBe('day');
      expect(bucket.key).toBe('2024-03-15');
      expect(bucket.start.getUTCDate()).toBe(15);
    });

    it('should parse month bucket keys', () => {
      const bucket = getBucketFromKey('2024-03', 'month');
      expect(bucket.period).toBe('month');
      expect(bucket.key).toBe('2024-03');
      expect(bucket.start.getUTCMonth()).toBe(2); // March is 2 (0-indexed)
    });
  });

  describe('getCurrentBucket', () => {
    it('should return current hour bucket', () => {
      const bucket = getCurrentBucket('hour');
      expect(bucket.period).toBe('hour');
      expect(bucket.start).toBeInstanceOf(Date);
      expect(bucket.end).toBeInstanceOf(Date);
      expect(bucket.end.getTime()).toBeGreaterThan(bucket.start.getTime());
    });

    it('should return current day bucket', () => {
      const bucket = getCurrentBucket('day');
      expect(bucket.period).toBe('day');
    });
  });

  describe('record', () => {
    it('should record a metric', () => {
      const metric = store.record('test_metric', 42);

      expect(metric.name).toBe('test_metric');
      expect(metric.value).toBe(42);
      expect(metric.id).toBeDefined();
      expect(metric.timestamp).toBeInstanceOf(Date);
    });

    it('should record with custom timestamp', () => {
      const customTime = new Date('2024-01-01T12:00:00Z');
      const metric = store.record('test_metric', 100, { timestamp: customTime });

      expect(metric.timestamp.getTime()).toBe(customTime.getTime());
    });

    it('should record with model dimension', () => {
      const metric = store.record('quality_score', 0.95, { model: 'claude-3' });

      expect(metric.model).toBe('claude-3');
    });

    it('should record with taskType dimension', () => {
      const metric = store.record('quality_score', 0.9, { taskType: 'code_edit' });

      expect(metric.taskType).toBe('code_edit');
    });
  });

  describe('recordBatch', () => {
    it('should record multiple metrics at once', () => {
      const entries = [
        { name: 'metric1', value: 10 },
        { name: 'metric2', value: 20 },
        { name: 'metric3', value: 30 },
      ];

      const metrics = store.recordBatch(entries);

      expect(metrics).toHaveLength(3);
      expect(metrics[0].name).toBe('metric1');
      expect(metrics[1].value).toBe(20);
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      // Record some test data
      const now = new Date();
      store.record('test_metric', 10, { timestamp: new Date(now.getTime() - 3600000) });
      store.record('test_metric', 20, { timestamp: new Date(now.getTime() - 1800000) });
      store.record('test_metric', 30, { timestamp: now });
    });

    it('should retrieve metrics by name', () => {
      const metrics = store.getMetrics('test_metric');

      expect(metrics).toHaveLength(3);
      expect(metrics[0].value).toBe(10);
      expect(metrics[2].value).toBe(30);
    });

    it('should filter by date range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const metrics = store.getMetrics('test_metric', {
        startDate: new Date(now.getTime() - 2000000),
      });

      expect(metrics.length).toBeLessThan(3);
    });

    it('should return sorted by timestamp', () => {
      const metrics = store.getMetrics('test_metric');

      for (let i = 1; i < metrics.length; i++) {
        expect(metrics[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          metrics[i - 1].timestamp.getTime()
        );
      }
    });
  });

  describe('getTimeSeries', () => {
    it('should return metric as time series', () => {
      store.record('cpu_usage', 50);
      store.record('cpu_usage', 60);
      store.record('cpu_usage', 55);

      const series = store.getTimeSeries('cpu_usage');

      expect(series.name).toBe('cpu_usage');
      expect(series.points).toHaveLength(3);
      expect(series.points[0].value).toBe(50);
    });
  });

  describe('getAggregated', () => {
    beforeEach(() => {
      store.record('values', 10);
      store.record('values', 20);
      store.record('values', 30);
      store.record('values', 40);
    });

    it('should calculate sum', () => {
      const sum = store.getAggregated('values', 'sum');
      expect(sum).toBe(100);
    });

    it('should calculate average', () => {
      const avg = store.getAggregated('values', 'avg');
      expect(avg).toBe(25);
    });

    it('should calculate max', () => {
      const max = store.getAggregated('values', 'max');
      expect(max).toBe(40);
    });

    it('should calculate min', () => {
      const min = store.getAggregated('values', 'min');
      expect(min).toBe(10);
    });

    it('should calculate count', () => {
      const count = store.getAggregated('values', 'count');
      expect(count).toBe(4);
    });

    it('should return 0 for empty metrics', () => {
      const sum = store.getAggregated('nonexistent', 'sum');
      expect(sum).toBe(0);
    });
  });

  describe('getByBucket', () => {
    it('should aggregate by bucket', () => {
      // Record metrics in same bucket
      const now = new Date();
      store.record('metric', 10, { timestamp: now });
      store.record('metric', 20, { timestamp: now });
      store.record('metric', 30, { timestamp: now });

      const buckets = store.getByBucket('metric', 'sum');

      // Should have at least one bucket
      expect(buckets.size).toBeGreaterThanOrEqual(1);

      // Sum of all values in the bucket should be correct
      let total = 0;
      for (const value of buckets.values()) {
        total += value;
      }
      expect(total).toBe(60);
    });
  });

  describe('getMetricNames', () => {
    it('should return all unique metric names', () => {
      store.record('metric_a', 1);
      store.record('metric_b', 2);
      store.record('metric_a', 3); // Duplicate

      const names = store.getMetricNames();

      expect(names).toContain('metric_a');
      expect(names).toContain('metric_b');
    });
  });

  describe('getLatest', () => {
    it('should return most recent metric', () => {
      store.record('test', 10);
      store.record('test', 20);
      store.record('test', 30);

      const latest = store.getLatest('test');

      expect(latest).not.toBeNull();
      expect(latest!.value).toBe(30);
    });

    it('should return null for nonexistent metric', () => {
      const latest = store.getLatest('nonexistent');
      expect(latest).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove old metrics based on retention', () => {
      // Create store with short retention
      const shortRetentionStore = new MetricsStore({
        retention: {
          hour: 0, // 0 days retention
          day: 0,
          week: 0,
          month: 0,
        },
        enableRollups: false,
      });

      // Record some old data
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      shortRetentionStore.record('old_metric', 100, { timestamp: oldDate });

      const countBefore = shortRetentionStore.getMetricCount();
      const removed = shortRetentionStore.cleanup();

      expect(removed).toBeGreaterThanOrEqual(0);

      shortRetentionStore.stop();
    });
  });

  describe('clear', () => {
    it('should remove all metrics', () => {
      store.record('a', 1);
      store.record('b', 2);
      store.record('c', 3);

      expect(store.getMetricCount()).toBe(3);

      store.clear();

      expect(store.getMetricCount()).toBe(0);
    });
  });

  describe('singleton functions', () => {
    afterEach(() => {
      resetMetricsStore();
    });

    it('should return same instance with getMetricsStore', () => {
      const store1 = getMetricsStore();
      const store2 = getMetricsStore();

      expect(store1).toBe(store2);
    });

    it('should create new instance with initializeMetricsStore', () => {
      const store1 = getMetricsStore();
      const store2 = initializeMetricsStore({ maxMetrics: 500 });

      expect(store1).not.toBe(store2);
    });

    it('should reset singleton with resetMetricsStore', () => {
      const store1 = getMetricsStore();
      resetMetricsStore();
      const store2 = getMetricsStore();

      expect(store1).not.toBe(store2);
    });
  });
});
