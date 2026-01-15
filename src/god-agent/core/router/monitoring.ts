/**
 * Monitoring and Alerting System
 *
 * Phase 7.4: Production Hardening - Monitoring and Alerting
 *
 * Implements:
 * - Centralized metrics collection
 * - Alert definitions and thresholds
 * - Alert channels (logging, events)
 * - Health check endpoints
 * - Real-time monitoring dashboard
 */

import { EventEmitter } from 'events';
import { getCircuitBreakerManager, CircuitBreakerStatus } from './circuit-breaker.js';
import { getRateLimiterManager, RateLimitStatus } from './rate-limiter.js';
import { getDegradationManager, ProviderHealth, DegradationLevel } from './graceful-degradation.js';
import { getCostTracker } from './cost-tracker.js';
import { getQualityScorer } from './quality-scorer.js';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

/**
 * Alert category
 */
export type AlertCategory =
  | 'circuit_breaker'
  | 'rate_limit'
  | 'quality'
  | 'latency'
  | 'error_rate'
  | 'cost'
  | 'degradation'
  | 'availability';

/**
 * Alert state
 */
export type AlertState = 'firing' | 'resolved' | 'acknowledged';

/**
 * Alert definition
 */
export interface AlertDefinition {
  /** Unique alert ID */
  id: string;
  /** Alert name */
  name: string;
  /** Alert category */
  category: AlertCategory;
  /** Alert severity */
  severity: AlertSeverity;
  /** Description of the alert */
  description: string;
  /** Threshold value that triggers the alert */
  threshold: number;
  /** Duration in ms that condition must persist */
  durationMs: number;
  /** Whether alert is enabled */
  enabled: boolean;
}

/**
 * Fired alert instance
 */
export interface Alert {
  /** Unique instance ID */
  instanceId: string;
  /** Alert definition ID */
  definitionId: string;
  /** Alert severity */
  severity: AlertSeverity;
  /** Alert category */
  category: AlertCategory;
  /** Alert message */
  message: string;
  /** Current state */
  state: AlertState;
  /** When alert first fired */
  firedAt: number;
  /** When alert was last updated */
  updatedAt: number;
  /** When alert was resolved (if resolved) */
  resolvedAt: number | null;
  /** Additional context data */
  context: Record<string, unknown>;
  /** Number of times alert has fired */
  occurrences: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Timestamp of check */
  timestamp: number;
  /** Provider health statuses */
  providers: Record<string, {
    status: 'up' | 'degraded' | 'down';
    circuitState: 'closed' | 'open' | 'half-open';
    rateLimited: boolean;
    qualityScore: number;
    latencyMs: number;
  }>;
  /** Active alerts count by severity */
  alertCounts: Record<AlertSeverity, number>;
  /** Current degradation level */
  degradationLevel: DegradationLevel;
  /** Uptime in seconds */
  uptimeSeconds: number;
}

/**
 * Metric point
 */
export interface MonitoringMetric {
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Timestamp */
  timestamp: number;
  /** Tags */
  tags: Record<string, string>;
}

/**
 * Monitoring event types
 */
export type MonitoringEventType =
  | 'alert_fired'
  | 'alert_resolved'
  | 'alert_acknowledged'
  | 'health_check'
  | 'metric_recorded'
  | 'threshold_exceeded';

/**
 * Monitoring event
 */
export interface MonitoringEvent {
  /** Event type */
  type: MonitoringEventType;
  /** Timestamp */
  timestamp: number;
  /** Event data */
  data: Record<string, unknown>;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  /** Enable monitoring */
  enabled: boolean;
  /** Health check interval in ms */
  healthCheckIntervalMs: number;
  /** Metric collection interval in ms */
  metricCollectionIntervalMs: number;
  /** Alert definitions */
  alerts: AlertDefinition[];
  /** Max alerts to keep in history */
  maxAlertHistory: number;
  /** Max metrics to keep in memory */
  maxMetricHistory: number;
  /** Alert cooldown in ms (prevent alert storms) */
  alertCooldownMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default alert definitions
 */
export const DEFAULT_ALERT_DEFINITIONS: AlertDefinition[] = [
  {
    id: 'circuit_open',
    name: 'Circuit Breaker Open',
    category: 'circuit_breaker',
    severity: 'critical',
    description: 'A provider circuit breaker has opened due to failures',
    threshold: 1,
    durationMs: 0,
    enabled: true,
  },
  {
    id: 'high_error_rate',
    name: 'High Error Rate',
    category: 'error_rate',
    severity: 'warning',
    description: 'Error rate exceeds threshold',
    threshold: 0.1, // 10%
    durationMs: 60000,
    enabled: true,
  },
  {
    id: 'critical_error_rate',
    name: 'Critical Error Rate',
    category: 'error_rate',
    severity: 'critical',
    description: 'Error rate is critically high',
    threshold: 0.3, // 30%
    durationMs: 30000,
    enabled: true,
  },
  {
    id: 'rate_limit_reached',
    name: 'Rate Limit Reached',
    category: 'rate_limit',
    severity: 'warning',
    description: 'Provider rate limit has been reached',
    threshold: 1,
    durationMs: 0,
    enabled: true,
  },
  {
    id: 'quality_degraded',
    name: 'Quality Degraded',
    category: 'quality',
    severity: 'warning',
    description: 'Response quality has degraded below threshold',
    threshold: 0.7, // 70%
    durationMs: 300000, // 5 min
    enabled: true,
  },
  {
    id: 'high_latency',
    name: 'High Latency',
    category: 'latency',
    severity: 'warning',
    description: 'Response latency exceeds threshold',
    threshold: 10000, // 10 seconds
    durationMs: 60000,
    enabled: true,
  },
  {
    id: 'budget_warning',
    name: 'Budget Warning',
    category: 'cost',
    severity: 'warning',
    description: 'Approaching budget limit',
    threshold: 0.8, // 80%
    durationMs: 0,
    enabled: true,
  },
  {
    id: 'budget_exceeded',
    name: 'Budget Exceeded',
    category: 'cost',
    severity: 'critical',
    description: 'Budget limit has been exceeded',
    threshold: 1.0, // 100%
    durationMs: 0,
    enabled: true,
  },
  {
    id: 'all_providers_down',
    name: 'All Providers Unavailable',
    category: 'availability',
    severity: 'emergency',
    description: 'No providers are available',
    threshold: 1,
    durationMs: 0,
    enabled: true,
  },
  {
    id: 'degradation_fallback',
    name: 'Service Degraded to Fallback',
    category: 'degradation',
    severity: 'warning',
    description: 'Service is operating in fallback mode',
    threshold: 1,
    durationMs: 0,
    enabled: true,
  },
];

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  healthCheckIntervalMs: 30000, // 30 seconds
  metricCollectionIntervalMs: 10000, // 10 seconds
  alerts: DEFAULT_ALERT_DEFINITIONS,
  maxAlertHistory: 1000,
  maxMetricHistory: 10000,
  alertCooldownMs: 300000, // 5 minutes
};

// ═══════════════════════════════════════════════════════════════════════════
// MONITORING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Centralized monitoring system
 */
export class MonitoringSystem extends EventEmitter {
  private readonly config: MonitoringConfig;
  private readonly startTime: number;

  // Alert tracking
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private alertCooldowns: Map<string, number> = new Map();

  // Metrics
  private metrics: MonitoringMetric[] = [];

  // Timers
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private metricCollectionTimer: NodeJS.Timeout | null = null;

  // Condition tracking for duration-based alerts
  private conditionTracking: Map<string, number> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.startTime = Date.now();

    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (!this.config.enabled) return;

    // Start health check timer
    this.healthCheckTimer = setInterval(
      () => this.runHealthCheck(),
      this.config.healthCheckIntervalMs
    );

    // Start metric collection timer
    this.metricCollectionTimer = setInterval(
      () => this.collectMetrics(),
      this.config.metricCollectionIntervalMs
    );

    // Run initial checks
    this.runHealthCheck();
    this.collectMetrics();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    if (this.metricCollectionTimer) {
      clearInterval(this.metricCollectionTimer);
      this.metricCollectionTimer = null;
    }
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.stop();
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.alertCooldowns.clear();
    this.metrics = [];
    this.conditionTracking.clear();
  }

  /**
   * Run a health check
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    const degradationManager = getDegradationManager();
    const providerHealths = await degradationManager.getAllProviderHealth();

    // Build provider status map
    const providers: HealthCheckResult['providers'] = {};
    for (const health of providerHealths) {
      providers[health.provider] = {
        status: health.status === 'healthy' ? 'up' :
          health.status === 'degraded' ? 'degraded' : 'down',
        circuitState: health.circuitState,
        rateLimited: health.rateLimited,
        qualityScore: health.qualityScore,
        latencyMs: health.latencyP95,
      };
    }

    // Count alerts by severity
    const alertCounts: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
      emergency: 0,
    };
    for (const alert of this.activeAlerts.values()) {
      if (alert.state === 'firing') {
        alertCounts[alert.severity]++;
      }
    }

    // Get degradation level
    const degradationLevel = await degradationManager.getOverallDegradationLevel();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (alertCounts.emergency > 0 || alertCounts.critical > 0) {
      status = 'unhealthy';
    } else if (alertCounts.warning > 0 || degradationLevel !== 'none') {
      status = 'degraded';
    }

    const result: HealthCheckResult = {
      status,
      timestamp: Date.now(),
      providers,
      alertCounts,
      degradationLevel,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };

    // Check for alerts
    await this.checkAlerts(providerHealths, degradationLevel);

    this.emit('health_check', { type: 'health_check', timestamp: Date.now(), data: result });

    return result;
  }

  /**
   * Collect metrics
   */
  async collectMetrics(): Promise<void> {
    const timestamp = Date.now();

    // Circuit breaker metrics
    const circuitManager = getCircuitBreakerManager();
    const circuitStatuses = circuitManager.getAllStatus();
    for (const status of circuitStatuses) {
      this.recordMetric({
        name: 'circuit_breaker_state',
        value: status.state === 'closed' ? 0 : status.state === 'half-open' ? 1 : 2,
        timestamp,
        tags: { provider: status.identifier },
      });
      this.recordMetric({
        name: 'circuit_breaker_failures',
        value: status.failures,
        timestamp,
        tags: { provider: status.identifier },
      });
      this.recordMetric({
        name: 'circuit_breaker_failure_rate',
        value: status.failureRate,
        timestamp,
        tags: { provider: status.identifier },
      });
    }

    // Rate limiter metrics
    const rateLimiterManager = getRateLimiterManager();
    const rateLimitStatuses = rateLimiterManager.getAllStatus();
    for (const status of rateLimitStatuses) {
      this.recordMetric({
        name: 'rate_limit_requests',
        value: status.currentRequests,
        timestamp,
        tags: { provider: status.identifier },
      });
      this.recordMetric({
        name: 'rate_limit_utilization',
        value: status.currentRequests / status.maxRequests,
        timestamp,
        tags: { provider: status.identifier },
      });
    }

    // Cost metrics
    try {
      const costTracker = getCostTracker();
      const costStats = costTracker.getStats();
      this.recordMetric({
        name: 'total_cost',
        value: costStats.totalCost,
        timestamp,
        tags: {},
      });
      this.recordMetric({
        name: 'request_count',
        value: costStats.requestCount,
        timestamp,
        tags: {},
      });
    } catch {
      // Cost tracker may not be initialized
    }

    // Quality metrics
    try {
      const qualityScorer = getQualityScorer();
      const allModelStats = qualityScorer.getAllModelStats();

      // Compute overall quality from all models
      let totalSamples = 0;
      let weightedAcceptance = 0;
      for (const stats of allModelStats.values()) {
        totalSamples += stats.sampleCount;
        weightedAcceptance += stats.acceptanceRate * stats.sampleCount;
      }

      const overallAcceptanceRate = totalSamples > 0 ? weightedAcceptance / totalSamples : 0;

      this.recordMetric({
        name: 'overall_quality',
        value: overallAcceptanceRate,
        timestamp,
        tags: {},
      });
      this.recordMetric({
        name: 'overall_acceptance_rate',
        value: overallAcceptanceRate,
        timestamp,
        tags: {},
      });
    } catch {
      // Quality scorer may not be initialized
    }

    this.emit('metric_recorded', { type: 'metric_recorded', timestamp, data: { count: this.metrics.length } });
  }

  /**
   * Record a metric point
   */
  recordMetric(metric: MonitoringMetric): void {
    this.metrics.push(metric);

    // Trim old metrics
    while (this.metrics.length > this.config.maxMetricHistory) {
      this.metrics.shift();
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, since?: number): MonitoringMetric[] {
    return this.metrics.filter(m =>
      m.name === name && (!since || m.timestamp >= since)
    );
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => a.state === 'firing');
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(instanceId: string): boolean {
    const alert = this.activeAlerts.get(instanceId);
    if (!alert || alert.state !== 'firing') {
      return false;
    }

    alert.state = 'acknowledged';
    alert.updatedAt = Date.now();

    this.emit('alert_acknowledged', {
      type: 'alert_acknowledged',
      timestamp: Date.now(),
      data: { alert },
    });

    return true;
  }

  /**
   * Manually fire an alert
   */
  fireAlert(
    definitionId: string,
    message: string,
    context: Record<string, unknown> = {}
  ): Alert | null {
    const definition = this.config.alerts.find(a => a.id === definitionId);
    if (!definition || !definition.enabled) {
      return null;
    }

    return this.createAlert(definition, message, context);
  }

  /**
   * Get monitoring stats
   */
  getStats(): {
    activeAlerts: number;
    totalAlertsFired: number;
    metricsCollected: number;
    uptimeSeconds: number;
    lastHealthCheck: number | null;
  } {
    return {
      activeAlerts: this.getActiveAlerts().length,
      totalAlertsFired: this.alertHistory.length,
      metricsCollected: this.metrics.length,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      lastHealthCheck: this.metrics.length > 0 ?
        this.metrics[this.metrics.length - 1].timestamp : null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private async checkAlerts(
    providerHealths: ProviderHealth[],
    degradationLevel: DegradationLevel
  ): Promise<void> {
    const now = Date.now();

    for (const definition of this.config.alerts) {
      if (!definition.enabled) continue;

      let conditionMet = false;
      let message = '';
      let context: Record<string, unknown> = {};

      switch (definition.category) {
        case 'circuit_breaker': {
          const openCircuits = providerHealths.filter(
            h => h.circuitState === 'open'
          );
          conditionMet = openCircuits.length >= definition.threshold;
          if (conditionMet) {
            message = `Circuit breakers open: ${openCircuits.map(h => h.provider).join(', ')}`;
            context = { providers: openCircuits.map(h => h.provider) };
          }
          break;
        }

        case 'rate_limit': {
          const rateLimited = providerHealths.filter(h => h.rateLimited);
          conditionMet = rateLimited.length >= definition.threshold;
          if (conditionMet) {
            message = `Rate limited: ${rateLimited.map(h => h.provider).join(', ')}`;
            context = { providers: rateLimited.map(h => h.provider) };
          }
          break;
        }

        case 'quality': {
          const lowQuality = providerHealths.filter(
            h => h.qualityScore < definition.threshold
          );
          conditionMet = lowQuality.length > 0;
          if (conditionMet) {
            message = `Quality degraded: ${lowQuality.map(h => `${h.provider}:${(h.qualityScore * 100).toFixed(0)}%`).join(', ')}`;
            context = { providers: lowQuality.map(h => ({ provider: h.provider, quality: h.qualityScore })) };
          }
          break;
        }

        case 'latency': {
          const highLatency = providerHealths.filter(
            h => h.latencyP95 > definition.threshold
          );
          conditionMet = highLatency.length > 0;
          if (conditionMet) {
            message = `High latency: ${highLatency.map(h => `${h.provider}:${h.latencyP95}ms`).join(', ')}`;
            context = { providers: highLatency.map(h => ({ provider: h.provider, latency: h.latencyP95 })) };
          }
          break;
        }

        case 'error_rate': {
          const highErrorRate = providerHealths.filter(
            h => h.errorRate > definition.threshold
          );
          conditionMet = highErrorRate.length > 0;
          if (conditionMet) {
            message = `High error rate: ${highErrorRate.map(h => `${h.provider}:${(h.errorRate * 100).toFixed(1)}%`).join(', ')}`;
            context = { providers: highErrorRate.map(h => ({ provider: h.provider, errorRate: h.errorRate })) };
          }
          break;
        }

        case 'availability': {
          const unavailable = providerHealths.filter(
            h => h.status === 'unhealthy'
          );
          conditionMet = unavailable.length === providerHealths.length &&
            providerHealths.length > 0;
          if (conditionMet) {
            message = 'All providers are unavailable';
            context = { providers: providerHealths.map(h => h.provider) };
          }
          break;
        }

        case 'degradation': {
          conditionMet = degradationLevel === 'fallback' ||
            degradationLevel === 'cached' ||
            degradationLevel === 'offline';
          if (conditionMet) {
            message = `Service degraded: ${degradationLevel}`;
            context = { level: degradationLevel };
          }
          break;
        }

        case 'cost': {
          // Cost alerts are handled separately via budget tracking
          break;
        }
      }

      // Handle duration-based alerts
      if (definition.durationMs > 0) {
        if (conditionMet) {
          const startTime = this.conditionTracking.get(definition.id);
          if (!startTime) {
            this.conditionTracking.set(definition.id, now);
            continue;
          }
          if (now - startTime < definition.durationMs) {
            continue;
          }
        } else {
          this.conditionTracking.delete(definition.id);
          this.resolveAlertByDefinition(definition.id);
          continue;
        }
      }

      // Fire or resolve alert
      if (conditionMet) {
        this.maybeFireAlert(definition, message, context);
      } else {
        this.resolveAlertByDefinition(definition.id);
      }
    }
  }

  private maybeFireAlert(
    definition: AlertDefinition,
    message: string,
    context: Record<string, unknown>
  ): void {
    // Check cooldown
    const lastFired = this.alertCooldowns.get(definition.id);
    if (lastFired && Date.now() - lastFired < this.config.alertCooldownMs) {
      // Update existing alert occurrence count
      const existingAlert = this.findActiveAlertByDefinition(definition.id);
      if (existingAlert) {
        existingAlert.occurrences++;
        existingAlert.updatedAt = Date.now();
      }
      return;
    }

    this.createAlert(definition, message, context);
  }

  private createAlert(
    definition: AlertDefinition,
    message: string,
    context: Record<string, unknown>
  ): Alert {
    const now = Date.now();
    const instanceId = `${definition.id}-${now}`;

    const alert: Alert = {
      instanceId,
      definitionId: definition.id,
      severity: definition.severity,
      category: definition.category,
      message,
      state: 'firing',
      firedAt: now,
      updatedAt: now,
      resolvedAt: null,
      context,
      occurrences: 1,
    };

    this.activeAlerts.set(instanceId, alert);
    this.alertHistory.push(alert);
    this.alertCooldowns.set(definition.id, now);

    // Trim history
    while (this.alertHistory.length > this.config.maxAlertHistory) {
      this.alertHistory.shift();
    }

    this.emit('alert_fired', {
      type: 'alert_fired',
      timestamp: now,
      data: { alert },
    });

    return alert;
  }

  private resolveAlertByDefinition(definitionId: string): void {
    const alert = this.findActiveAlertByDefinition(definitionId);
    if (alert && alert.state === 'firing') {
      alert.state = 'resolved';
      alert.resolvedAt = Date.now();
      alert.updatedAt = Date.now();

      this.emit('alert_resolved', {
        type: 'alert_resolved',
        timestamp: Date.now(),
        data: { alert },
      });
    }
  }

  private findActiveAlertByDefinition(definitionId: string): Alert | null {
    for (const alert of this.activeAlerts.values()) {
      if (alert.definitionId === definitionId && alert.state === 'firing') {
        return alert;
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

let monitoringSystem: MonitoringSystem | null = null;

/**
 * Get the singleton monitoring system
 */
export function getMonitoringSystem(
  config?: Partial<MonitoringConfig>
): MonitoringSystem {
  if (!monitoringSystem) {
    monitoringSystem = new MonitoringSystem(config);
  }
  return monitoringSystem;
}

/**
 * Initialize monitoring system with config
 */
export function initializeMonitoring(
  config: Partial<MonitoringConfig>
): MonitoringSystem {
  monitoringSystem?.stop();
  monitoringSystem = new MonitoringSystem(config);
  return monitoringSystem;
}

/**
 * Reset the singleton
 */
export function resetMonitoring(): void {
  monitoringSystem?.stop();
  monitoringSystem?.reset();
  monitoringSystem = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get severity emoji
 */
function getSeverityEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case 'info':
      return 'info';
    case 'warning':
      return '!';
    case 'critical':
      return '!!';
    case 'emergency':
      return '!!!';
  }
}

/**
 * Format an alert for display
 */
export function formatAlert(alert: Alert): string {
  const emoji = getSeverityEmoji(alert.severity);
  const state = alert.state.toUpperCase();
  const time = new Date(alert.firedAt).toISOString();

  return [
    `[${emoji}] ${alert.severity.toUpperCase()} - ${alert.message}`,
    `  State: ${state} | Category: ${alert.category}`,
    `  Fired: ${time}${alert.occurrences > 1 ? ` (${alert.occurrences}x)` : ''}`,
  ].join('\n');
}

/**
 * Format multiple alerts
 */
export function formatMonitoringAlerts(alerts: Alert[]): string {
  if (alerts.length === 0) {
    return 'No active alerts.';
  }

  return [
    `=== Active Alerts (${alerts.length}) ===`,
    '',
    ...alerts.map(formatAlert),
  ].join('\n');
}

/**
 * Format health check result
 */
export function formatHealthCheck(result: HealthCheckResult): string {
  const statusEmoji = result.status === 'healthy' ? '[OK]' :
    result.status === 'degraded' ? '[WARN]' : '[FAIL]';

  const lines: string[] = [
    `=== Health Check ===`,
    '',
    `${statusEmoji} Overall: ${result.status.toUpperCase()}`,
    `Degradation: ${result.degradationLevel}`,
    `Uptime: ${formatUptime(result.uptimeSeconds)}`,
    '',
    'Providers:',
  ];

  for (const [provider, status] of Object.entries(result.providers)) {
    const providerEmoji = status.status === 'up' ? '[+]' :
      status.status === 'degraded' ? '[~]' : '[-]';
    lines.push(`  ${providerEmoji} ${provider}: ${status.status} (circuit: ${status.circuitState}, quality: ${(status.qualityScore * 100).toFixed(0)}%)`);
  }

  lines.push('', 'Alerts:');
  lines.push(`  Emergency: ${result.alertCounts.emergency}`);
  lines.push(`  Critical: ${result.alertCounts.critical}`);
  lines.push(`  Warning: ${result.alertCounts.warning}`);
  lines.push(`  Info: ${result.alertCounts.info}`);

  return lines.join('\n');
}

/**
 * Format uptime in human-readable form
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Get alert summary
 */
export function getAlertSummary(alerts: Alert[]): string {
  const bySeverity: Record<AlertSeverity, number> = {
    emergency: 0,
    critical: 0,
    warning: 0,
    info: 0,
  };

  for (const alert of alerts) {
    if (alert.state === 'firing') {
      bySeverity[alert.severity]++;
    }
  }

  const parts: string[] = [];
  if (bySeverity.emergency > 0) parts.push(`!!! ${bySeverity.emergency} emergency`);
  if (bySeverity.critical > 0) parts.push(`!! ${bySeverity.critical} critical`);
  if (bySeverity.warning > 0) parts.push(`! ${bySeverity.warning} warning`);
  if (bySeverity.info > 0) parts.push(`i ${bySeverity.info} info`);

  if (parts.length === 0) {
    return 'No active alerts';
  }

  return parts.join(' | ');
}
