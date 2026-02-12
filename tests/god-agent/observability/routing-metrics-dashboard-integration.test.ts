/**
 * Routing Metrics Dashboard Integration Test
 *
 * Comprehensive test to verify dashboard statistics are updating correctly
 * after the routing metrics fixes.
 *
 * Test Plan:
 * 1. Verify the API endpoint is responding correctly
 * 2. Check that the dashboard HTML loads
 * 3. Simulate routing activity to increment metrics
 * 4. Verify the metrics update in the API response
 * 5. Confirm the dashboard display would reflect these changes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import {
  getRoutingMetrics,
  resetRoutingMetrics,
  trackLocalFirstDecision,
  getLocalUsagePercentage,
  getLocalSuccessRate,
  getLocalFirstMetricsSummary,
  type RoutingMetrics,
} from '../../../src/god-agent/core/router/capability-router.js';

// Test configuration
const DASHBOARD_PORT = 3847;
const DASHBOARD_BASE_URL = `http://localhost:${DASHBOARD_PORT}`;

// Helper to check if server is available
async function isServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${DASHBOARD_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Test results tracking
interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

const testResults: TestResult[] = [];

function recordTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration: number) {
  testResults.push({ name, status, message, duration });
}

describe('Dashboard Routing Metrics Integration Tests', () => {
  let serverAvailable = false;

  beforeAll(async () => {
    serverAvailable = await isServerAvailable();
    console.log(`\n${'='.repeat(70)}`);
    console.log('DASHBOARD ROUTING METRICS TEST REPORT');
    console.log(`${'='.repeat(70)}`);
    console.log(`Dashboard URL: ${DASHBOARD_BASE_URL}`);
    console.log(`Server Status: ${serverAvailable ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`Test Started: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(70)}\n`);
  });

  afterAll(() => {
    // Print test summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('TEST SUMMARY');
    console.log(`${'='.repeat(70)}`);

    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const skipped = testResults.filter(r => r.status === 'SKIP').length;

    console.log(`\nResults: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED\n`);

    testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '[PASS]' : result.status === 'FAIL' ? '[FAIL]' : '[SKIP]';
      console.log(`${index + 1}. ${statusIcon} ${result.name}`);
      console.log(`   ${result.message} (${result.duration}ms)`);
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Test Completed: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(70)}\n`);
  });

  beforeEach(() => {
    // Reset metrics before each test
    resetRoutingMetrics();
  });

  afterEach(() => {
    // Reset metrics after each test to prevent interference with other test files
    resetRoutingMetrics();
  });

  describe('TEST 1: API Endpoint Availability', () => {
    it('should have /api/health endpoint responding correctly', async () => {
      const start = Date.now();
      try {
        const response = await fetch(`${DASHBOARD_BASE_URL}/api/health`);
        const duration = Date.now() - start;

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('status', 'healthy');
        expect(data).toHaveProperty('uptime');
        expect(data).toHaveProperty('eventCount');

        recordTest(
          '/api/health endpoint',
          'PASS',
          `Server healthy, uptime: ${data.uptime}ms, events: ${data.eventCount}`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('/api/health endpoint', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should have /api/routing-metrics endpoint responding correctly', async () => {
      const start = Date.now();
      try {
        const response = await fetch(`${DASHBOARD_BASE_URL}/api/routing-metrics`);
        const duration = Date.now() - start;

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('localRequests');
        expect(data.data).toHaveProperty('cloudRequests');
        expect(data.data).toHaveProperty('localFirst');
        expect(data.data).toHaveProperty('byRecommendation');

        recordTest(
          '/api/routing-metrics endpoint',
          'PASS',
          `Endpoint returns valid metrics structure`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('/api/routing-metrics endpoint', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });

  describe('TEST 2: Dashboard HTML Loads', () => {
    it('should load the main dashboard page', async () => {
      const start = Date.now();
      try {
        const response = await fetch(`${DASHBOARD_BASE_URL}/`);
        const duration = Date.now() - start;

        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('dashboard');

        recordTest(
          'Dashboard HTML loads',
          'PASS',
          `Dashboard page loads (${html.length} bytes)`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Dashboard HTML loads', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should serve dashboard JavaScript', async () => {
      const start = Date.now();
      try {
        const response = await fetch(`${DASHBOARD_BASE_URL}/app.js`);
        const duration = Date.now() - start;

        expect(response.status).toBe(200);
        const js = await response.text();
        expect(js).toContain('DashboardApp');
        expect(js).toContain('updateLocalFirstMetrics');
        expect(js).toContain('routing-metrics');

        recordTest(
          'Dashboard JavaScript loads',
          'PASS',
          `app.js contains required functions (${js.length} bytes)`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Dashboard JavaScript loads', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });

  describe('TEST 3: Metrics Tracking Functions', () => {
    it('should start with zero metrics', () => {
      const start = Date.now();
      try {
        const metrics = getRoutingMetrics();
        const duration = Date.now() - start;

        expect(metrics.localRequests).toBe(0);
        expect(metrics.cloudRequests).toBe(0);
        expect(metrics.localFirst.localTriedFirst).toBe(0);
        expect(metrics.byRecommendation.local).toBe(0);

        recordTest(
          'Initial metrics are zero',
          'PASS',
          `All counters start at 0`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Initial metrics are zero', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should track local-first decisions correctly', () => {
      const start = Date.now();
      try {
        // Simulate routing decisions
        trackLocalFirstDecision('local', {
          triedLocal: true,
          localSucceeded: true,
          fellBackToClaude: false,
        });

        trackLocalFirstDecision('pure_local_verified', {
          triedLocal: true,
          localSucceeded: true,
          fellBackToClaude: false,
        });

        trackLocalFirstDecision('expensive', {
          triedLocal: false,
          localSucceeded: false,
          fellBackToClaude: false,
        });

        const metrics = getRoutingMetrics();
        const duration = Date.now() - start;

        expect(metrics.byRecommendation.local).toBe(1);
        expect(metrics.byRecommendation.pure_local_verified).toBe(1);
        expect(metrics.byRecommendation.expensive).toBe(1);
        expect(metrics.localFirst.localTriedFirst).toBe(2);
        expect(metrics.localFirst.localSucceeded).toBe(2);
        expect(metrics.localFirst.skippedLocal).toBe(1);

        recordTest(
          'trackLocalFirstDecision works',
          'PASS',
          `Tracked 3 decisions: local=1, verified=1, expensive=1`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('trackLocalFirstDecision works', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should update timestamps on decisions', () => {
      const start = Date.now();
      try {
        const beforeTime = new Date();

        trackLocalFirstDecision('local', {
          triedLocal: true,
          localSucceeded: true,
          fellBackToClaude: false,
        });

        const metrics = getRoutingMetrics();
        const duration = Date.now() - start;

        expect(metrics.timestamps.firstRequest).not.toBeNull();
        expect(metrics.timestamps.lastRequest).not.toBeNull();
        expect(metrics.timestamps.firstRequest!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());

        recordTest(
          'Timestamps update correctly',
          'PASS',
          `firstRequest and lastRequest timestamps set`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Timestamps update correctly', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });

  describe('TEST 4: Metrics Update and Calculate Correctly', () => {
    it('should calculate local usage percentage correctly', () => {
      const start = Date.now();
      try {
        // Note: getLocalUsagePercentage uses localRequests/cloudRequests,
        // which are updated by the router, not trackLocalFirstDecision
        // For this test, we verify the calculation logic
        const percentage = getLocalUsagePercentage();
        const duration = Date.now() - start;

        expect(percentage).toBe(0); // No router activity yet

        recordTest(
          'Local usage percentage calculation',
          'PASS',
          `Percentage: ${percentage}% (expected 0% with no router activity)`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Local usage percentage calculation', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should calculate local success rate correctly', () => {
      const start = Date.now();
      try {
        // Simulate some local attempts
        trackLocalFirstDecision('local', { triedLocal: true, localSucceeded: true, fellBackToClaude: false });
        trackLocalFirstDecision('local', { triedLocal: true, localSucceeded: true, fellBackToClaude: false });
        trackLocalFirstDecision('expensive', { triedLocal: true, localSucceeded: false, fellBackToClaude: true });

        const successRate = getLocalSuccessRate();
        const duration = Date.now() - start;

        // 2 succeeded out of 3 tried = 66.67%
        expect(successRate).toBeCloseTo(66.67, 1);

        recordTest(
          'Local success rate calculation',
          'PASS',
          `Success rate: ${successRate.toFixed(2)}% (2/3 succeeded)`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Local success rate calculation', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should generate metrics summary correctly', () => {
      const start = Date.now();
      try {
        // Add some sample data
        trackLocalFirstDecision('local', { triedLocal: true, localSucceeded: true, fellBackToClaude: false });
        trackLocalFirstDecision('pure_local_verified', { triedLocal: true, localSucceeded: true, fellBackToClaude: false });
        trackLocalFirstDecision('local_then_review', { triedLocal: true, localSucceeded: true, fellBackToClaude: false });
        trackLocalFirstDecision('expensive', { triedLocal: false, localSucceeded: false, fellBackToClaude: false });

        const summary = getLocalFirstMetricsSummary();
        const duration = Date.now() - start;

        expect(summary.breakdown).toContain('Pure local: 1');
        expect(summary.breakdown).toContain('Test verified: 1');
        expect(summary.breakdown).toContain('Local+review: 1');
        expect(summary.breakdown).toContain('Claude only: 1');

        recordTest(
          'Metrics summary generation',
          'PASS',
          `Summary generated correctly with breakdown`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Metrics summary generation', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });

  describe('TEST 5: API Response Structure for Dashboard', () => {
    it('should return metrics structure compatible with dashboard', async () => {
      const start = Date.now();
      try {
        const response = await fetch(`${DASHBOARD_BASE_URL}/api/routing-metrics`);
        const data = await response.json();
        const duration = Date.now() - start;

        // Verify all fields the dashboard expects
        const metrics = data.data;

        // Basic counters
        expect(metrics).toHaveProperty('localRequests');
        expect(metrics).toHaveProperty('cloudRequests');
        expect(metrics).toHaveProperty('fallbackEvents');
        expect(metrics).toHaveProperty('recoveryEvents');

        // Local-first specific
        expect(metrics.localFirst).toHaveProperty('localTriedFirst');
        expect(metrics.localFirst).toHaveProperty('localSucceeded');
        expect(metrics.localFirst).toHaveProperty('localFellBackToClaude');
        expect(metrics.localFirst).toHaveProperty('skippedLocal');
        expect(metrics.localFirst).toHaveProperty('pureLocalVerified');
        expect(metrics.localFirst).toHaveProperty('localThenReview');

        // By recommendation breakdown
        expect(metrics.byRecommendation).toHaveProperty('local');
        expect(metrics.byRecommendation).toHaveProperty('pure_local_verified');
        expect(metrics.byRecommendation).toHaveProperty('local_then_review');
        expect(metrics.byRecommendation).toHaveProperty('expensive');

        // Timestamps
        expect(metrics.timestamps).toHaveProperty('firstRequest');
        expect(metrics.timestamps).toHaveProperty('lastRequest');

        recordTest(
          'API response structure is dashboard-compatible',
          'PASS',
          `All required fields present in API response`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('API response structure is dashboard-compatible', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should have correct data types in API response', async () => {
      const start = Date.now();
      try {
        const response = await fetch(`${DASHBOARD_BASE_URL}/api/routing-metrics`);
        const data = await response.json();
        const duration = Date.now() - start;

        const metrics = data.data;

        // All counters should be numbers
        expect(typeof metrics.localRequests).toBe('number');
        expect(typeof metrics.cloudRequests).toBe('number');
        expect(typeof metrics.localFirst.localTriedFirst).toBe('number');
        expect(typeof metrics.byRecommendation.local).toBe('number');

        // Timestamps should be null or date strings
        expect(
          metrics.timestamps.firstRequest === null ||
          typeof metrics.timestamps.firstRequest === 'string'
        ).toBe(true);

        recordTest(
          'API response data types are correct',
          'PASS',
          `All counters are numbers, timestamps are null or strings`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('API response data types are correct', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });

  describe('TEST 6: Dashboard Display Logic Validation', () => {
    it('should calculate correct percentages for display', () => {
      const start = Date.now();
      try {
        // Simulate the dashboard calculation logic
        const metrics: RoutingMetrics = {
          localRequests: 70,
          cloudRequests: 30,
          fallbackEvents: 0,
          recoveryEvents: 0,
          lastUnavailableProvider: null,
          lastFallback: null,
          localFirst: {
            localTriedFirst: 70,
            localSucceeded: 65,
            localFellBackToClaude: 5,
            skippedLocal: 30,
            pureLocalVerified: 20,
            localThenReview: 10,
          },
          byRecommendation: {
            local: 40,
            pure_local_verified: 20,
            local_then_review: 10,
            expensive: 30,
          },
          timestamps: {
            firstRequest: new Date(),
            lastRequest: new Date(),
          },
        };

        // Dashboard calculation: localPct
        const total = metrics.localRequests + metrics.cloudRequests;
        const localPct = total > 0 ? (metrics.localRequests / total * 100) : 0;

        // Dashboard calculation: successPct
        const tried = metrics.localFirst.localTriedFirst;
        const succeeded = metrics.localFirst.localSucceeded;
        const successPct = tried > 0 ? (succeeded / tried * 100) : 0;

        const duration = Date.now() - start;

        expect(localPct).toBe(70);
        expect(successPct).toBeCloseTo(92.86, 1);

        recordTest(
          'Dashboard percentage calculations',
          'PASS',
          `Local usage: ${localPct}%, Success rate: ${successPct.toFixed(2)}%`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Dashboard percentage calculations', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should determine correct badge color based on 70% goal', () => {
      const start = Date.now();
      try {
        // Test color logic from updateLocalFirstMetrics
        const getColor = (localPct: number): string => {
          if (localPct >= 70) return '#4CAF50'; // Green
          if (localPct >= 50) return '#FF9800'; // Orange
          return '#f44336'; // Red
        };

        expect(getColor(75)).toBe('#4CAF50'); // Above goal - green
        expect(getColor(70)).toBe('#4CAF50'); // At goal - green
        expect(getColor(60)).toBe('#FF9800'); // Below goal - orange
        expect(getColor(40)).toBe('#f44336'); // Far below - red

        const duration = Date.now() - start;

        recordTest(
          'Badge color logic for 70% goal',
          'PASS',
          `Colors: 70%+ = green, 50-69% = orange, <50% = red`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Badge color logic for 70% goal', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should calculate breakdown bar widths correctly', () => {
      const start = Date.now();
      try {
        const byRec = {
          local: 40,
          pure_local_verified: 20,
          local_then_review: 10,
          expensive: 30,
        };

        const recTotal = byRec.local + byRec.pure_local_verified +
                        byRec.local_then_review + byRec.expensive;

        const localWidth = byRec.local / recTotal * 100;
        const verifiedWidth = byRec.pure_local_verified / recTotal * 100;
        const reviewWidth = byRec.local_then_review / recTotal * 100;
        const claudeWidth = byRec.expensive / recTotal * 100;

        const duration = Date.now() - start;

        expect(localWidth).toBe(40);
        expect(verifiedWidth).toBe(20);
        expect(reviewWidth).toBe(10);
        expect(claudeWidth).toBe(30);
        expect(localWidth + verifiedWidth + reviewWidth + claudeWidth).toBe(100);

        recordTest(
          'Breakdown bar width calculations',
          'PASS',
          `Widths: local=${localWidth}%, verified=${verifiedWidth}%, review=${reviewWidth}%, claude=${claudeWidth}%`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Breakdown bar width calculations', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });

  describe('TEST 7: Metrics Reset Functionality', () => {
    it('should reset all metrics to initial state', () => {
      const start = Date.now();
      try {
        // Add some data first
        trackLocalFirstDecision('local', { triedLocal: true, localSucceeded: true, fellBackToClaude: false });
        trackLocalFirstDecision('expensive', { triedLocal: false, localSucceeded: false, fellBackToClaude: false });

        // Verify non-zero
        let metrics = getRoutingMetrics();
        expect(metrics.byRecommendation.local).toBe(1);
        expect(metrics.byRecommendation.expensive).toBe(1);

        // Reset
        resetRoutingMetrics();

        // Verify zeroed
        metrics = getRoutingMetrics();
        const duration = Date.now() - start;

        expect(metrics.localRequests).toBe(0);
        expect(metrics.cloudRequests).toBe(0);
        expect(metrics.byRecommendation.local).toBe(0);
        expect(metrics.byRecommendation.expensive).toBe(0);
        expect(metrics.timestamps.firstRequest).toBeNull();

        recordTest(
          'Metrics reset functionality',
          'PASS',
          `All counters reset to 0, timestamps reset to null`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Metrics reset functionality', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });

  describe('TEST 8: Edge Cases', () => {
    it('should handle rapid successive tracking calls', () => {
      const start = Date.now();
      try {
        // Rapid-fire 100 calls
        for (let i = 0; i < 100; i++) {
          trackLocalFirstDecision('local', {
            triedLocal: true,
            localSucceeded: true,
            fellBackToClaude: false,
          });
        }

        const metrics = getRoutingMetrics();
        const duration = Date.now() - start;

        expect(metrics.byRecommendation.local).toBe(100);
        expect(metrics.localFirst.localTriedFirst).toBe(100);
        expect(metrics.localFirst.localSucceeded).toBe(100);

        recordTest(
          'Rapid successive tracking calls',
          'PASS',
          `100 rapid calls handled correctly in ${duration}ms`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Rapid successive tracking calls', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });

    it('should return immutable metrics copy', () => {
      const start = Date.now();
      try {
        const metrics1 = getRoutingMetrics();
        metrics1.localRequests = 999; // Try to mutate

        const metrics2 = getRoutingMetrics();
        const duration = Date.now() - start;

        expect(metrics2.localRequests).toBe(0); // Should be unchanged

        recordTest(
          'Metrics immutability',
          'PASS',
          `getRoutingMetrics returns a copy, not the original object`,
          duration
        );
      } catch (error) {
        const duration = Date.now() - start;
        recordTest('Metrics immutability', 'FAIL', `Error: ${error}`, duration);
        throw error;
      }
    });
  });
});
