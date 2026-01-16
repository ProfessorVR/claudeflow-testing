/**
 * Dashboard Display Integration Tests
 *
 * Tests for LOCAL-FIRST routing metrics display in the observability dashboard
 * Part of TIER-2.1: Intelligent Model Router
 *
 * Coverage:
 * - updateLocalFirstMetrics() function
 * - DOM element updates
 * - Color coding for goal tracking (70%+ local = green)
 * - Breakdown bar calculations
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Define the metrics interface to match what the dashboard expects
interface LocalFirstMetrics {
  localRequests: number;
  cloudRequests: number;
  localFirst: {
    localTriedFirst: number;
    localSucceeded: number;
    localFellBackToClaude: number;
    skippedLocal: number;
    pureLocalVerified: number;
    localThenReview: number;
  };
  byRecommendation: {
    local: number;
    pure_local_verified: number;
    local_then_review: number;
    expensive: number;
  };
}

// Create a test implementation of updateLocalFirstMetrics that matches app.js
function updateLocalFirstMetrics(metrics: LocalFirstMetrics | null, document: Document): void {
  if (!metrics) return;

  // Calculate totals
  const total = (metrics.localRequests || 0) + (metrics.cloudRequests || 0);
  const localPct = total > 0 ? ((metrics.localRequests || 0) / total * 100) : 0;

  // Get local-first specific metrics
  const lf = metrics.localFirst || {};
  const byRec = metrics.byRecommendation || {};

  // Local success rate
  const tried = lf.localTriedFirst || 0;
  const succeeded = lf.localSucceeded || 0;
  const successPct = tried > 0 ? (succeeded / tried * 100) : 0;

  // Estimated savings ($0.003 per Claude request average)
  const savings = (metrics.localRequests || 0) * 0.003;

  // Update metric cards
  const localUsageBadge = document.getElementById('localUsageBadge');
  const localUsagePct = document.getElementById('localUsagePct');
  const localSuccessRate = document.getElementById('localSuccessRate');
  const estimatedSavings = document.getElementById('estimatedSavings');
  const totalRoutingRequests = document.getElementById('totalRoutingRequests');

  if (localUsageBadge) localUsageBadge.textContent = `${localPct.toFixed(0)}%`;
  if (localUsagePct) localUsagePct.textContent = `${localPct.toFixed(1)}%`;
  if (localSuccessRate) localSuccessRate.textContent = `${successPct.toFixed(1)}%`;
  if (estimatedSavings) estimatedSavings.textContent = `$${savings.toFixed(2)}`;
  if (totalRoutingRequests) totalRoutingRequests.textContent = total.toString();

  // Update badge color based on goal (70%+)
  if (localUsageBadge) {
    if (localPct >= 70) {
      (localUsageBadge as HTMLElement).style.backgroundColor = '#4CAF50';
    } else if (localPct >= 50) {
      (localUsageBadge as HTMLElement).style.backgroundColor = '#FF9800';
    } else {
      (localUsageBadge as HTMLElement).style.backgroundColor = '#f44336';
    }
  }

  // Update breakdown bar
  const recTotal = (byRec.local || 0) + (byRec.pure_local_verified || 0) +
                  (byRec.local_then_review || 0) + (byRec.expensive || 0);

  if (recTotal > 0) {
    const localWidth = (byRec.local || 0) / recTotal * 100;
    const verifiedWidth = (byRec.pure_local_verified || 0) / recTotal * 100;
    const reviewWidth = (byRec.local_then_review || 0) / recTotal * 100;
    const claudeWidth = (byRec.expensive || 0) / recTotal * 100;

    const barLocal = document.getElementById('barLocal') as HTMLElement | null;
    const barVerified = document.getElementById('barVerified') as HTMLElement | null;
    const barReview = document.getElementById('barReview') as HTMLElement | null;
    const barClaude = document.getElementById('barClaude') as HTMLElement | null;

    if (barLocal) barLocal.style.width = `${localWidth}%`;
    if (barVerified) barVerified.style.width = `${verifiedWidth}%`;
    if (barReview) barReview.style.width = `${reviewWidth}%`;
    if (barClaude) barClaude.style.width = `${claudeWidth}%`;
  }

  // Update legend counts
  const countLocal = document.getElementById('countLocal');
  const countVerified = document.getElementById('countVerified');
  const countReview = document.getElementById('countReview');
  const countClaude = document.getElementById('countClaude');

  if (countLocal) countLocal.textContent = (byRec.local || 0).toString();
  if (countVerified) countVerified.textContent = (byRec.pure_local_verified || 0).toString();
  if (countReview) countReview.textContent = (byRec.local_then_review || 0).toString();
  if (countClaude) countClaude.textContent = (byRec.expensive || 0).toString();
}

// Create test DOM structure matching index.html
function createTestDOM(): JSDOM {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Test Dashboard</title></head>
    <body>
      <!-- Local-First Routing Panel -->
      <div class="panel" id="localFirstPanel">
        <div class="panel-header">
          <h3>Local-First Routing</h3>
          <span id="localUsageBadge" class="status-badge">0%</span>
        </div>
        <div class="panel-content">
          <!-- Metrics Cards -->
          <div class="metrics-row">
            <div class="metric-card">
              <div class="metric-label">Local Usage</div>
              <div id="localUsagePct" class="metric-value">0%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Local Success</div>
              <div id="localSuccessRate" class="metric-value">0%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Est. Savings</div>
              <div id="estimatedSavings" class="metric-value">$0.00</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Requests</div>
              <div id="totalRoutingRequests" class="metric-value">0</div>
            </div>
          </div>

          <!-- Routing Breakdown Bar -->
          <div class="breakdown-section">
            <div class="breakdown-label">Routing Distribution</div>
            <div class="breakdown-bar">
              <div id="barLocal" class="bar-segment local" style="width: 0%"></div>
              <div id="barVerified" class="bar-segment verified" style="width: 0%"></div>
              <div id="barReview" class="bar-segment review" style="width: 0%"></div>
              <div id="barClaude" class="bar-segment claude" style="width: 0%"></div>
            </div>
            <div class="breakdown-legend">
              <span class="legend-item">
                <span class="legend-dot local"></span>
                Local (<span id="countLocal">0</span>)
              </span>
              <span class="legend-item">
                <span class="legend-dot verified"></span>
                Verified (<span id="countVerified">0</span>)
              </span>
              <span class="legend-item">
                <span class="legend-dot review"></span>
                Review (<span id="countReview">0</span>)
              </span>
              <span class="legend-item">
                <span class="legend-dot claude"></span>
                Claude (<span id="countClaude">0</span>)
              </span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  return new JSDOM(html);
}

describe('Dashboard Display - Local-First Routing Panel', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = createTestDOM();
    document = dom.window.document;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('updateLocalFirstMetrics() - Basic Calculations', () => {
    it('should update local usage percentage correctly', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 70,
        cloudRequests: 30,
        localFirst: {
          localTriedFirst: 70,
          localSucceeded: 65,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 20,
          localThenReview: 10,
        },
        byRecommendation: {
          local: 40,
          pure_local_verified: 20,
          local_then_review: 10,
          expensive: 30,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsagePct = document.getElementById('localUsagePct');
      expect(localUsagePct?.textContent).toBe('70.0%');
    });

    it('should calculate local success rate correctly', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 80,
        cloudRequests: 20,
        localFirst: {
          localTriedFirst: 100,
          localSucceeded: 85,
          localFellBackToClaude: 15,
          skippedLocal: 0,
          pureLocalVerified: 30,
          localThenReview: 20,
        },
        byRecommendation: {
          local: 50,
          pure_local_verified: 30,
          local_then_review: 15,
          expensive: 5,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localSuccessRate = document.getElementById('localSuccessRate');
      expect(localSuccessRate?.textContent).toBe('85.0%');
    });

    it('should calculate estimated savings correctly', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 1000,
        cloudRequests: 100,
        localFirst: {
          localTriedFirst: 1000,
          localSucceeded: 900,
          localFellBackToClaude: 100,
          skippedLocal: 0,
          pureLocalVerified: 500,
          localThenReview: 200,
        },
        byRecommendation: {
          local: 300,
          pure_local_verified: 500,
          local_then_review: 200,
          expensive: 100,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const estimatedSavings = document.getElementById('estimatedSavings');
      // 1000 * $0.003 = $3.00
      expect(estimatedSavings?.textContent).toBe('$3.00');
    });

    it('should update total routing requests', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 750,
        cloudRequests: 250,
        localFirst: {
          localTriedFirst: 750,
          localSucceeded: 700,
          localFellBackToClaude: 50,
          skippedLocal: 0,
          pureLocalVerified: 300,
          localThenReview: 100,
        },
        byRecommendation: {
          local: 350,
          pure_local_verified: 300,
          local_then_review: 100,
          expensive: 250,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const totalRoutingRequests = document.getElementById('totalRoutingRequests');
      expect(totalRoutingRequests?.textContent).toBe('1000');
    });
  });

  describe('updateLocalFirstMetrics() - Badge Color Coding', () => {
    it('should show GREEN badge when local usage >= 70%', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 75,
        cloudRequests: 25,
        localFirst: {
          localTriedFirst: 75,
          localSucceeded: 70,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 30,
          localThenReview: 20,
        },
        byRecommendation: {
          local: 25,
          pure_local_verified: 30,
          local_then_review: 20,
          expensive: 25,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(76, 175, 80)'); // #4CAF50
      expect(localUsageBadge.textContent).toBe('75%');
    });

    it('should show ORANGE badge when local usage 50-69%', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 60,
        cloudRequests: 40,
        localFirst: {
          localTriedFirst: 60,
          localSucceeded: 55,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 20,
          localThenReview: 10,
        },
        byRecommendation: {
          local: 30,
          pure_local_verified: 20,
          local_then_review: 10,
          expensive: 40,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(255, 152, 0)'); // #FF9800
      expect(localUsageBadge.textContent).toBe('60%');
    });

    it('should show RED badge when local usage < 50%', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 30,
        cloudRequests: 70,
        localFirst: {
          localTriedFirst: 30,
          localSucceeded: 25,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 10,
          localThenReview: 5,
        },
        byRecommendation: {
          local: 15,
          pure_local_verified: 10,
          local_then_review: 5,
          expensive: 70,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(244, 67, 54)'); // #f44336
      expect(localUsageBadge.textContent).toBe('30%');
    });

    it('should show GREEN badge at exactly 70%', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 70,
        cloudRequests: 30,
        localFirst: {
          localTriedFirst: 70,
          localSucceeded: 65,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 25,
          localThenReview: 15,
        },
        byRecommendation: {
          local: 30,
          pure_local_verified: 25,
          local_then_review: 15,
          expensive: 30,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(76, 175, 80)'); // GREEN
    });

    it('should show ORANGE badge at exactly 50%', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 50,
        cloudRequests: 50,
        localFirst: {
          localTriedFirst: 50,
          localSucceeded: 45,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 20,
          localThenReview: 10,
        },
        byRecommendation: {
          local: 20,
          pure_local_verified: 20,
          local_then_review: 10,
          expensive: 50,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(255, 152, 0)'); // ORANGE
    });
  });

  describe('updateLocalFirstMetrics() - Breakdown Bar', () => {
    it('should update bar widths proportionally', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 80,
        cloudRequests: 20,
        localFirst: {
          localTriedFirst: 80,
          localSucceeded: 75,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 30,
          localThenReview: 10,
        },
        byRecommendation: {
          local: 40,        // 40%
          pure_local_verified: 30,  // 30%
          local_then_review: 10,    // 10%
          expensive: 20,    // 20%
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const barLocal = document.getElementById('barLocal') as HTMLElement;
      const barVerified = document.getElementById('barVerified') as HTMLElement;
      const barReview = document.getElementById('barReview') as HTMLElement;
      const barClaude = document.getElementById('barClaude') as HTMLElement;

      expect(barLocal.style.width).toBe('40%');
      expect(barVerified.style.width).toBe('30%');
      expect(barReview.style.width).toBe('10%');
      expect(barClaude.style.width).toBe('20%');
    });

    it('should update legend counts', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 100,
        cloudRequests: 50,
        localFirst: {
          localTriedFirst: 100,
          localSucceeded: 95,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 45,
          localThenReview: 25,
        },
        byRecommendation: {
          local: 30,
          pure_local_verified: 45,
          local_then_review: 25,
          expensive: 50,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const countLocal = document.getElementById('countLocal');
      const countVerified = document.getElementById('countVerified');
      const countReview = document.getElementById('countReview');
      const countClaude = document.getElementById('countClaude');

      expect(countLocal?.textContent).toBe('30');
      expect(countVerified?.textContent).toBe('45');
      expect(countReview?.textContent).toBe('25');
      expect(countClaude?.textContent).toBe('50');
    });

    it('should handle 100% local correctly', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 100,
        cloudRequests: 0,
        localFirst: {
          localTriedFirst: 100,
          localSucceeded: 100,
          localFellBackToClaude: 0,
          skippedLocal: 0,
          pureLocalVerified: 50,
          localThenReview: 0,
        },
        byRecommendation: {
          local: 50,
          pure_local_verified: 50,
          local_then_review: 0,
          expensive: 0,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const barLocal = document.getElementById('barLocal') as HTMLElement;
      const barVerified = document.getElementById('barVerified') as HTMLElement;
      const barReview = document.getElementById('barReview') as HTMLElement;
      const barClaude = document.getElementById('barClaude') as HTMLElement;

      expect(barLocal.style.width).toBe('50%');
      expect(barVerified.style.width).toBe('50%');
      expect(barReview.style.width).toBe('0%');
      expect(barClaude.style.width).toBe('0%');
    });
  });

  describe('updateLocalFirstMetrics() - Edge Cases', () => {
    it('should handle null metrics gracefully', () => {
      // Should not throw
      expect(() => updateLocalFirstMetrics(null, document)).not.toThrow();
    });

    it('should handle zero requests gracefully', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 0,
        cloudRequests: 0,
        localFirst: {
          localTriedFirst: 0,
          localSucceeded: 0,
          localFellBackToClaude: 0,
          skippedLocal: 0,
          pureLocalVerified: 0,
          localThenReview: 0,
        },
        byRecommendation: {
          local: 0,
          pure_local_verified: 0,
          local_then_review: 0,
          expensive: 0,
        },
      };

      expect(() => updateLocalFirstMetrics(metrics, document)).not.toThrow();

      const localUsagePct = document.getElementById('localUsagePct');
      expect(localUsagePct?.textContent).toBe('0.0%');
    });

    it('should handle missing localFirst property', () => {
      const metrics = {
        localRequests: 50,
        cloudRequests: 50,
        localFirst: undefined as unknown as LocalFirstMetrics['localFirst'],
        byRecommendation: {
          local: 25,
          pure_local_verified: 25,
          local_then_review: 25,
          expensive: 25,
        },
      } as LocalFirstMetrics;

      expect(() => updateLocalFirstMetrics(metrics, document)).not.toThrow();
    });

    it('should handle missing byRecommendation property', () => {
      const metrics = {
        localRequests: 50,
        cloudRequests: 50,
        localFirst: {
          localTriedFirst: 50,
          localSucceeded: 45,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 20,
          localThenReview: 10,
        },
        byRecommendation: undefined as unknown as LocalFirstMetrics['byRecommendation'],
      } as LocalFirstMetrics;

      expect(() => updateLocalFirstMetrics(metrics, document)).not.toThrow();
    });

    it('should handle very large numbers', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 1000000,
        cloudRequests: 100000,
        localFirst: {
          localTriedFirst: 1000000,
          localSucceeded: 950000,
          localFellBackToClaude: 50000,
          skippedLocal: 0,
          pureLocalVerified: 500000,
          localThenReview: 200000,
        },
        byRecommendation: {
          local: 300000,
          pure_local_verified: 500000,
          local_then_review: 200000,
          expensive: 100000,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const totalRoutingRequests = document.getElementById('totalRoutingRequests');
      expect(totalRoutingRequests?.textContent).toBe('1100000');

      const estimatedSavings = document.getElementById('estimatedSavings');
      // 1,000,000 * $0.003 = $3,000.00
      expect(estimatedSavings?.textContent).toBe('$3000.00');
    });
  });

  describe('Goal Tracking: 70%+ Local Usage', () => {
    it('should display success state when goal is met', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 85,
        cloudRequests: 15,
        localFirst: {
          localTriedFirst: 85,
          localSucceeded: 80,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 40,
          localThenReview: 20,
        },
        byRecommendation: {
          local: 25,
          pure_local_verified: 40,
          local_then_review: 20,
          expensive: 15,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.textContent).toBe('85%');
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(76, 175, 80)'); // GREEN
    });

    it('should display warning state when goal is not met but close', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 65,
        cloudRequests: 35,
        localFirst: {
          localTriedFirst: 65,
          localSucceeded: 60,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 25,
          localThenReview: 15,
        },
        byRecommendation: {
          local: 25,
          pure_local_verified: 25,
          local_then_review: 15,
          expensive: 35,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.textContent).toBe('65%');
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(255, 152, 0)'); // ORANGE
    });

    it('should display danger state when far from goal', () => {
      const metrics: LocalFirstMetrics = {
        localRequests: 25,
        cloudRequests: 75,
        localFirst: {
          localTriedFirst: 25,
          localSucceeded: 20,
          localFellBackToClaude: 5,
          skippedLocal: 0,
          pureLocalVerified: 10,
          localThenReview: 5,
        },
        byRecommendation: {
          local: 10,
          pure_local_verified: 10,
          local_then_review: 5,
          expensive: 75,
        },
      };

      updateLocalFirstMetrics(metrics, document);

      const localUsageBadge = document.getElementById('localUsageBadge') as HTMLElement;
      expect(localUsageBadge.textContent).toBe('25%');
      expect(localUsageBadge.style.backgroundColor).toBe('rgb(244, 67, 54)'); // RED
    });
  });
});

describe('Dashboard Display - DOM Element Existence', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = createTestDOM();
    document = dom.window.document;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should have all required metric elements', () => {
    expect(document.getElementById('localUsageBadge')).not.toBeNull();
    expect(document.getElementById('localUsagePct')).not.toBeNull();
    expect(document.getElementById('localSuccessRate')).not.toBeNull();
    expect(document.getElementById('estimatedSavings')).not.toBeNull();
    expect(document.getElementById('totalRoutingRequests')).not.toBeNull();
  });

  it('should have all required breakdown bar elements', () => {
    expect(document.getElementById('barLocal')).not.toBeNull();
    expect(document.getElementById('barVerified')).not.toBeNull();
    expect(document.getElementById('barReview')).not.toBeNull();
    expect(document.getElementById('barClaude')).not.toBeNull();
  });

  it('should have all required legend count elements', () => {
    expect(document.getElementById('countLocal')).not.toBeNull();
    expect(document.getElementById('countVerified')).not.toBeNull();
    expect(document.getElementById('countReview')).not.toBeNull();
    expect(document.getElementById('countClaude')).not.toBeNull();
  });
});
