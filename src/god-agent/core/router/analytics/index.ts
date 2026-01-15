/**
 * Analytics Module
 *
 * Phase 6.4: Performance Analytics Dashboard
 *
 * Provides comprehensive analytics for the router:
 * - Time-series metric storage
 * - Dashboard data aggregation
 * - Model comparison and trends
 * - Cost and quality analytics
 * - Alert monitoring
 */

// Types
export * from './types.js';

// Metrics Store
export {
  MetricsStore,
  getMetricsStore,
  initializeMetricsStore,
  resetMetricsStore,
  getBucketKey,
  getBucketFromKey,
  getCurrentBucket,
  type MetricsStoreConfig,
} from './metrics-store.js';

// Analytics Engine
export {
  AnalyticsEngine,
  getAnalyticsEngine,
  initializeAnalyticsEngine,
  resetAnalyticsEngine,
  formatDashboardSummary,
  formatModelComparison,
  formatAlerts,
  type AnalyticsEngineConfig,
} from './analytics-engine.js';
