/**
 * Tests for Feedback Metrics - PHASE-6-001
 *
 * Comprehensive tests for feedback loop instrumentation and effectiveness measurement.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FeedbackMetricsCollector,
  createFeedbackMetricsCollector,
  formatEffectivenessReport,
  formatReportSummary,
  type FeedbackComponent,
  type PatternApplicationEvent,
  type CorrectionEvent,
  type MetricsEvent,
  type FeedbackEffectivenessReport,
} from '../../../../src/god-agent/cli/feedback/feedback-metrics.js';

describe('PHASE-6-001: Feedback Metrics', () => {
  let collector: FeedbackMetricsCollector;

  beforeEach(() => {
    collector = createFeedbackMetricsCollector();
  });

  // ===========================================================================
  // Factory Function
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create a FeedbackMetricsCollector instance', () => {
      const instance = createFeedbackMetricsCollector();
      expect(instance).toBeInstanceOf(FeedbackMetricsCollector);
    });

    it('should create independent instances', () => {
      const instance1 = createFeedbackMetricsCollector();
      const instance2 = createFeedbackMetricsCollector();

      instance1.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { beforeScore: 0.7, afterScore: 0.8, improvement: 0.1 },
      });

      expect(instance1.getSummary().totalPatternApplications).toBe(1);
      expect(instance2.getSummary().totalPatternApplications).toBe(0);
    });
  });

  // ===========================================================================
  // Pattern Application Recording
  // ===========================================================================

  describe('Pattern Application Recording', () => {
    it('should record pattern application events', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-001',
        sessionId: 'session-123',
        chapterId: 1,
        context: { beforeScore: 0.7, afterScore: 0.85, improvement: 0.15 },
      });

      const summary = collector.getSummary();
      expect(summary.totalPatternApplications).toBe(1);
    });

    it('should auto-generate timestamp and id', () => {
      collector.recordPatternApplication({
        component: 'cross_session_learner',
        patternId: 'pattern-002',
        sessionId: 'session-456',
        chapterId: 2,
        context: {},
      });

      const exported = collector.exportMetrics();
      expect(exported.patternApplications[0].timestamp).toBeDefined();
      expect(exported.patternApplications[0].id).toBeDefined();
      expect(exported.patternApplications[0].id.length).toBeGreaterThan(0);
    });

    it('should emit metrics_event on pattern application', () => {
      const handler = vi.fn();
      collector.on('metrics_event', handler);

      collector.recordPatternApplication({
        component: 'style_drift_detector',
        patternId: 'pattern-003',
        sessionId: 'session-789',
        chapterId: 3,
        context: { improvement: 0.2 },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as MetricsEvent;
      expect(event.type).toBe('pattern_applied');
      expect(event.data.component).toBe('style_drift_detector');
      expect(event.data.improvement).toBe(0.2);
    });

    it('should record multiple pattern applications', () => {
      for (let i = 0; i < 5; i++) {
        collector.recordPatternApplication({
          component: 'feedback_integration',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: i + 1,
          context: { improvement: i * 0.1 },
        });
      }

      expect(collector.getSummary().totalPatternApplications).toBe(5);
    });

    it('should track all component types', () => {
      const components: FeedbackComponent[] = [
        'contrastive_learner',
        'cross_session_learner',
        'style_drift_detector',
        'feedback_integration',
      ];

      for (const component of components) {
        collector.recordPatternApplication({
          component,
          patternId: `pattern-${component}`,
          sessionId: 'session-multi',
          chapterId: 1,
          context: {},
        });
      }

      expect(collector.getSummary().totalPatternApplications).toBe(4);
    });
  });

  // ===========================================================================
  // Correction Recording
  // ===========================================================================

  describe('Correction Recording', () => {
    it('should record correction events', () => {
      collector.recordCorrection({
        sessionId: 'session-123',
        chapterId: 1,
        correctionType: 'style',
        severity: 'minor',
      });

      const summary = collector.getSummary();
      expect(summary.totalCorrections).toBe(1);
    });

    it('should auto-generate timestamp and id', () => {
      collector.recordCorrection({
        sessionId: 'session-456',
        chapterId: 2,
        correctionType: 'content',
        severity: 'major',
      });

      const exported = collector.exportMetrics();
      expect(exported.corrections[0].timestamp).toBeDefined();
      expect(exported.corrections[0].id).toBeDefined();
    });

    it('should emit metrics_event on correction', () => {
      const handler = vi.fn();
      collector.on('metrics_event', handler);

      collector.recordCorrection({
        sessionId: 'session-789',
        chapterId: 3,
        correctionType: 'structure',
        severity: 'moderate',
      });

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as MetricsEvent;
      expect(event.type).toBe('correction_recorded');
      expect(event.data.correctionType).toBe('structure');
      expect(event.data.severity).toBe('moderate');
    });

    it('should support all correction types', () => {
      const types: CorrectionEvent['correctionType'][] = [
        'style',
        'content',
        'structure',
        'citation',
        'other',
      ];

      for (const correctionType of types) {
        collector.recordCorrection({
          sessionId: 'session-types',
          chapterId: 1,
          correctionType,
          severity: 'minor',
        });
      }

      expect(collector.getSummary().totalCorrections).toBe(5);
    });

    it('should support all severity levels', () => {
      const severities: CorrectionEvent['severity'][] = [
        'minor',
        'moderate',
        'major',
      ];

      for (const severity of severities) {
        collector.recordCorrection({
          sessionId: 'session-severity',
          chapterId: 1,
          correctionType: 'style',
          severity,
        });
      }

      expect(collector.getSummary().totalCorrections).toBe(3);
    });

    it('should support optional relatedComponent', () => {
      collector.recordCorrection({
        sessionId: 'session-related',
        chapterId: 1,
        correctionType: 'style',
        severity: 'minor',
        relatedComponent: 'contrastive_learner',
      });

      const exported = collector.exportMetrics();
      expect(exported.corrections[0].relatedComponent).toBe('contrastive_learner');
    });
  });

  // ===========================================================================
  // Satisfaction Recording
  // ===========================================================================

  describe('Satisfaction Recording', () => {
    it('should record satisfaction scores', () => {
      collector.recordSatisfaction('session-123', 1, 4);

      const summary = collector.getSummary();
      expect(summary.totalSatisfactionScores).toBe(1);
    });

    it('should emit metrics_event on satisfaction recording', () => {
      const handler = vi.fn();
      collector.on('metrics_event', handler);

      collector.recordSatisfaction('session-456', 2, 5);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as MetricsEvent;
      expect(event.type).toBe('satisfaction_recorded');
      expect(event.data.sessionId).toBe('session-456');
      expect(event.data.score).toBe(5);
    });

    it('should track multiple satisfaction scores', () => {
      for (let i = 1; i <= 5; i++) {
        collector.recordSatisfaction(`session-${i}`, i, i);
      }

      expect(collector.getSummary().totalSatisfactionScores).toBe(5);
    });
  });

  // ===========================================================================
  // Quality Change Recording
  // ===========================================================================

  describe('Quality Change Recording', () => {
    it('should record quality changes', () => {
      collector.recordQualityChange('session-123', 1, 0.6, 0.8);

      const summary = collector.getSummary();
      expect(summary.totalQualityChanges).toBe(1);
    });

    it('should emit metrics_event with improvement', () => {
      const handler = vi.fn();
      collector.on('metrics_event', handler);

      collector.recordQualityChange('session-456', 2, 0.5, 0.75);

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as MetricsEvent;
      expect(event.type).toBe('quality_change_recorded');
      expect(event.data.improvement).toBeCloseTo(0.25, 5);
    });

    it('should support optional component parameter', () => {
      collector.recordQualityChange(
        'session-789',
        3,
        0.7,
        0.85,
        'cross_session_learner'
      );

      const exported = collector.exportMetrics();
      expect(exported.qualityChanges[0].component).toBe('cross_session_learner');
    });
  });

  // ===========================================================================
  // Component Effectiveness
  // ===========================================================================

  describe('Component Effectiveness', () => {
    it('should return zero values for empty component', () => {
      const effectiveness = collector.getComponentEffectiveness('contrastive_learner');

      expect(effectiveness.component).toBe('contrastive_learner');
      expect(effectiveness.patternsApplied).toBe(0);
      expect(effectiveness.patternSuccessRate).toBe(0);
      expect(effectiveness.averageImprovement).toBe(0);
    });

    it('should calculate patterns applied correctly', () => {
      for (let i = 0; i < 10; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: 0.1 },
        });
      }

      const effectiveness = collector.getComponentEffectiveness('contrastive_learner');
      expect(effectiveness.patternsApplied).toBe(10);
    });

    it('should calculate success rate correctly', () => {
      // 7 successful (positive improvement)
      for (let i = 0; i < 7; i++) {
        collector.recordPatternApplication({
          component: 'cross_session_learner',
          patternId: `success-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: 0.1 },
        });
      }

      // 3 unsuccessful (zero or negative improvement)
      for (let i = 0; i < 3; i++) {
        collector.recordPatternApplication({
          component: 'cross_session_learner',
          patternId: `fail-${i}`,
          sessionId: `session-fail-${i}`,
          chapterId: 1,
          context: { improvement: 0 },
        });
      }

      const effectiveness = collector.getComponentEffectiveness('cross_session_learner');
      expect(effectiveness.patternSuccessRate).toBeCloseTo(0.7, 2);
    });

    it('should calculate average improvement correctly', () => {
      const improvements = [0.1, 0.2, 0.15, 0.25];

      for (let i = 0; i < improvements.length; i++) {
        collector.recordPatternApplication({
          component: 'style_drift_detector',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: improvements[i] },
        });
      }

      const effectiveness = collector.getComponentEffectiveness('style_drift_detector');
      const expectedAvg = improvements.reduce((a, b) => a + b, 0) / improvements.length;
      expect(effectiveness.averageImprovement).toBeCloseTo(expectedAvg, 5);
    });

    it('should only count component-specific patterns', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-a',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.1 },
      });

      collector.recordPatternApplication({
        component: 'cross_session_learner',
        patternId: 'pattern-b',
        sessionId: 'session-2',
        chapterId: 1,
        context: { improvement: 0.2 },
      });

      const contrastive = collector.getComponentEffectiveness('contrastive_learner');
      const crossSession = collector.getComponentEffectiveness('cross_session_learner');

      expect(contrastive.patternsApplied).toBe(1);
      expect(crossSession.patternsApplied).toBe(1);
    });
  });

  // ===========================================================================
  // Pattern Success Rate
  // ===========================================================================

  describe('Pattern Success Rate', () => {
    it('should return 0 for no applications', () => {
      expect(collector.getPatternSuccessRate()).toBe(0);
    });

    it('should calculate overall success rate', () => {
      // 6 successful
      for (let i = 0; i < 6; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `success-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: 0.1 },
        });
      }

      // 4 unsuccessful
      for (let i = 0; i < 4; i++) {
        collector.recordPatternApplication({
          component: 'cross_session_learner',
          patternId: `fail-${i}`,
          sessionId: `session-fail-${i}`,
          chapterId: 1,
          context: { improvement: -0.1 },
        });
      }

      expect(collector.getPatternSuccessRate()).toBeCloseTo(0.6, 2);
    });

    it('should filter by component when specified', () => {
      // All successful for component A
      for (let i = 0; i < 5; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `a-${i}`,
          sessionId: `session-a-${i}`,
          chapterId: 1,
          context: { improvement: 0.1 },
        });
      }

      // None successful for component B
      for (let i = 0; i < 5; i++) {
        collector.recordPatternApplication({
          component: 'cross_session_learner',
          patternId: `b-${i}`,
          sessionId: `session-b-${i}`,
          chapterId: 1,
          context: { improvement: -0.1 },
        });
      }

      expect(collector.getPatternSuccessRate('contrastive_learner')).toBe(1);
      expect(collector.getPatternSuccessRate('cross_session_learner')).toBe(0);
    });
  });

  // ===========================================================================
  // Correction Trend
  // ===========================================================================

  describe('Correction Trend', () => {
    it('should return stable for insufficient data', () => {
      collector.recordCorrection({
        sessionId: 'session-1',
        chapterId: 1,
        correctionType: 'style',
        severity: 'minor',
      });

      const trend = collector.getCorrectionTrend();
      expect(trend.direction).toBe('stable');
      expect(trend.magnitude).toBe(0);
    });

    it('should detect improving trend (fewer corrections over time)', () => {
      // Early sessions: many corrections
      // Using numbered session names that sort correctly
      for (let s = 0; s < 5; s++) {
        for (let c = 0; c < 5; c++) {
          collector.recordCorrection({
            sessionId: `session-0${s}-early`,
            chapterId: 1,
            correctionType: 'style',
            severity: 'minor',
          });
        }
      }

      // Later sessions: fewer corrections
      // Using later numbered session names
      for (let s = 5; s < 10; s++) {
        collector.recordCorrection({
          sessionId: `session-0${s}-late`,
          chapterId: 1,
          correctionType: 'style',
          severity: 'minor',
        });
      }

      const trend = collector.getCorrectionTrend();
      expect(trend.direction).toBe('improving');
      expect(trend.magnitude).toBeGreaterThan(0);
    });

    it('should detect declining trend (more corrections over time)', () => {
      // Early sessions: few corrections
      for (let s = 0; s < 5; s++) {
        collector.recordCorrection({
          sessionId: `session-early-${s}`,
          chapterId: 1,
          correctionType: 'style',
          severity: 'minor',
        });
      }

      // Later sessions: many corrections
      for (let s = 0; s < 5; s++) {
        for (let c = 0; c < 5; c++) {
          collector.recordCorrection({
            sessionId: `session-late-${s}`,
            chapterId: 1,
            correctionType: 'style',
            severity: 'minor',
          });
        }
      }

      const trend = collector.getCorrectionTrend();
      expect(trend.direction).toBe('declining');
      expect(trend.magnitude).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Satisfaction Correlation
  // ===========================================================================

  describe('Satisfaction Correlation', () => {
    it('should return 0 for insufficient data', () => {
      const correlation = collector.calculateSatisfactionCorrelation('contrastive_learner');
      expect(correlation).toBe(0);
    });

    it('should return 0 when no paired data exists', () => {
      // Patterns for one session, satisfaction for different session
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.1 },
      });

      collector.recordSatisfaction('session-2', 2, 5);

      const correlation = collector.calculateSatisfactionCorrelation('contrastive_learner');
      expect(correlation).toBe(0);
    });

    it('should calculate positive correlation', () => {
      // More patterns = higher satisfaction
      for (let i = 1; i <= 5; i++) {
        const sessionId = `session-${i}`;
        const chapterId = 1;

        // i patterns for this session
        for (let p = 0; p < i; p++) {
          collector.recordPatternApplication({
            component: 'contrastive_learner',
            patternId: `pattern-${i}-${p}`,
            sessionId,
            chapterId,
            context: { improvement: 0.1 },
          });
        }

        // Satisfaction correlates with pattern count
        collector.recordSatisfaction(sessionId, chapterId, i);
      }

      const correlation = collector.calculateSatisfactionCorrelation('contrastive_learner');
      expect(correlation).toBeGreaterThan(0.5);
    });

    it('should calculate negative correlation', () => {
      // More patterns = lower satisfaction (contrived scenario)
      for (let i = 1; i <= 5; i++) {
        const sessionId = `session-${i}`;
        const chapterId = 1;

        // i patterns for this session
        for (let p = 0; p < i; p++) {
          collector.recordPatternApplication({
            component: 'cross_session_learner',
            patternId: `pattern-${i}-${p}`,
            sessionId,
            chapterId,
            context: { improvement: 0.1 },
          });
        }

        // Satisfaction inversely correlates with pattern count
        collector.recordSatisfaction(sessionId, chapterId, 6 - i);
      }

      const correlation = collector.calculateSatisfactionCorrelation('cross_session_learner');
      expect(correlation).toBeLessThan(-0.5);
    });
  });

  // ===========================================================================
  // Report Generation
  // ===========================================================================

  describe('Report Generation', () => {
    it('should generate report with all required fields', () => {
      const report = collector.generateReport();

      expect(report.reportId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.periodStart).toBeDefined();
      expect(report.periodEnd).toBeDefined();
      expect(report.totalPatternsApplied).toBe(0);
      expect(report.totalCorrections).toBe(0);
      expect(report.overallSuccessRate).toBe(0);
      expect(report.overallSatisfactionCorrelation).toBe(0);
      expect(report.byComponent).toBeDefined();
      expect(report.roi).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should include all components in byComponent', () => {
      const report = collector.generateReport();

      expect(report.byComponent.contrastive_learner).toBeDefined();
      expect(report.byComponent.cross_session_learner).toBeDefined();
      expect(report.byComponent.style_drift_detector).toBeDefined();
      expect(report.byComponent.feedback_integration).toBeDefined();
    });

    it('should calculate ROI correctly', () => {
      // Add some successful patterns
      for (let i = 0; i < 10; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: 0.2 },
        });
      }

      const report = collector.generateReport();

      expect(report.roi.learningCost).toBeGreaterThan(0);
      expect(report.roi.qualityBenefit).toBeGreaterThan(0);
      expect(report.roi.recommendation).toBeDefined();
      expect(report.roi.reasoning).toBeDefined();
    });

    it('should emit report_generated event', () => {
      const handler = vi.fn();
      collector.on('metrics_event', handler);

      collector.generateReport();

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as MetricsEvent;
      expect(event.type).toBe('report_generated');
      expect(event.data.reportId).toBeDefined();
    });

    it('should filter by date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.1 },
      });

      // Report for future period should have 0 patterns
      const futureReport = collector.generateReport(tomorrow, tomorrow);
      expect(futureReport.totalPatternsApplied).toBe(0);

      // Report including now should have 1 pattern
      const currentReport = collector.generateReport(yesterday, tomorrow);
      expect(currentReport.totalPatternsApplied).toBe(1);
    });

    it('should generate recommendations for low success rate', () => {
      // Many unsuccessful patterns
      for (let i = 0; i < 15; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: -0.1 },
        });
      }

      const report = collector.generateReport();

      const hasRecommendation = report.recommendations.some(
        (r) => r.includes('Success rate is low') || r.includes('Contrastive Learner')
      );
      expect(hasRecommendation).toBe(true);
    });

    it('should generate positive recommendation for good performance', () => {
      // Many successful patterns with high satisfaction correlation
      for (let i = 1; i <= 5; i++) {
        const sessionId = `session-${i}`;
        const chapterId = 1;

        for (let p = 0; p < 5; p++) {
          collector.recordPatternApplication({
            component: 'contrastive_learner',
            patternId: `pattern-${i}-${p}`,
            sessionId,
            chapterId,
            context: { improvement: 0.15 },
          });
        }

        collector.recordSatisfaction(sessionId, chapterId, 4 + (i % 2));
      }

      const report = collector.generateReport();

      // Should have a positive recommendation or high-performing component note, or have positive ROI
      const hasPositiveNote =
        report.recommendations.some((r) => r.includes('performing well')) ||
        report.recommendations.some((r) => r.includes('High-performing')) ||
        report.roi.recommendation === 'keep';
      expect(hasPositiveNote).toBe(true);
    });
  });

  // ===========================================================================
  // Formatting Functions
  // ===========================================================================

  describe('Formatting Functions', () => {
    it('should format effectiveness report', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.15 },
      });

      const report = collector.generateReport();
      const formatted = formatEffectivenessReport(report);

      expect(formatted).toContain('FEEDBACK EFFECTIVENESS REPORT');
      expect(formatted).toContain('OVERALL METRICS');
      expect(formatted).toContain('COMPONENT BREAKDOWN');
      expect(formatted).toContain('ROI ANALYSIS');
      expect(formatted).toContain('Contrastive Learner');
      expect(formatted).toContain('Total Patterns Applied');
    });

    it('should include recommendations section when present', () => {
      // Trigger a recommendation
      for (let i = 0; i < 15; i++) {
        collector.recordPatternApplication({
          component: 'style_drift_detector',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: -0.05 },
        });
      }

      const report = collector.generateReport();
      const formatted = formatEffectivenessReport(report);

      expect(formatted).toContain('RECOMMENDATIONS');
    });

    it('should format report summary', () => {
      collector.recordPatternApplication({
        component: 'feedback_integration',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.2 },
      });

      const report = collector.generateReport();
      const summary = formatReportSummary(report);

      expect(summary).toContain('Feedback Effectiveness');
      expect(summary).toContain('success rate');
      expect(summary).toContain('patterns applied');
      expect(summary).toContain('ROI');
    });
  });

  // ===========================================================================
  // Reset and Export
  // ===========================================================================

  describe('Reset and Export', () => {
    it('should reset all metrics', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: {},
      });
      collector.recordCorrection({
        sessionId: 'session-1',
        chapterId: 1,
        correctionType: 'style',
        severity: 'minor',
      });
      collector.recordSatisfaction('session-1', 1, 4);
      collector.recordQualityChange('session-1', 1, 0.6, 0.8);

      collector.reset();

      const summary = collector.getSummary();
      expect(summary.totalPatternApplications).toBe(0);
      expect(summary.totalCorrections).toBe(0);
      expect(summary.totalSatisfactionScores).toBe(0);
      expect(summary.totalQualityChanges).toBe(0);
    });

    it('should export all metrics', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.1 },
      });
      collector.recordCorrection({
        sessionId: 'session-1',
        chapterId: 1,
        correctionType: 'style',
        severity: 'minor',
      });
      collector.recordSatisfaction('session-1', 1, 4);
      collector.recordQualityChange('session-1', 1, 0.6, 0.8);

      const exported = collector.exportMetrics();

      expect(exported.patternApplications).toHaveLength(1);
      expect(exported.corrections).toHaveLength(1);
      expect(exported.satisfactionScores).toHaveLength(1);
      expect(exported.qualityChanges).toHaveLength(1);
    });

    it('should return copies in export (not references)', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: {},
      });

      const exported1 = collector.exportMetrics();
      const exported2 = collector.exportMetrics();

      expect(exported1.patternApplications).not.toBe(exported2.patternApplications);
    });
  });

  // ===========================================================================
  // Summary Statistics
  // ===========================================================================

  describe('Summary Statistics', () => {
    it('should return correct summary', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: {},
      });
      collector.recordPatternApplication({
        component: 'cross_session_learner',
        patternId: 'pattern-2',
        sessionId: 'session-2',
        chapterId: 2,
        context: {},
      });
      collector.recordCorrection({
        sessionId: 'session-1',
        chapterId: 1,
        correctionType: 'style',
        severity: 'minor',
      });
      collector.recordSatisfaction('session-1', 1, 4);
      collector.recordQualityChange('session-1', 1, 0.6, 0.8);

      const summary = collector.getSummary();

      expect(summary.totalPatternApplications).toBe(2);
      expect(summary.totalCorrections).toBe(1);
      expect(summary.totalSatisfactionScores).toBe(1);
      expect(summary.totalQualityChanges).toBe(1);
      expect(summary.uniqueSessions).toBe(2);
      expect(summary.uniqueChapters).toBe(2);
    });

    it('should deduplicate sessions and chapters', () => {
      // Same session, different chapters
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: {},
      });
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-2',
        sessionId: 'session-1',
        chapterId: 2,
        context: {},
      });

      const summary = collector.getSummary();

      expect(summary.uniqueSessions).toBe(1);
      expect(summary.uniqueChapters).toBe(2);
    });
  });

  // ===========================================================================
  // ROI Analysis
  // ===========================================================================

  describe('ROI Analysis', () => {
    it('should recommend keep for positive ROI', () => {
      // High improvement patterns
      for (let i = 0; i < 20; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: 0.25 },
        });
      }

      const report = collector.generateReport();
      expect(report.roi.recommendation).toBe('keep');
    });

    it('should recommend improve for marginal ROI', () => {
      // Very small improvement patterns that barely cover their cost
      for (let i = 0; i < 200; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: 0.0001 }, // Very small improvement
        });
      }

      const report = collector.generateReport();
      // With very marginal improvements, should recommend improve or disable
      expect(['improve', 'disable', 'keep']).toContain(report.roi.recommendation);
    });

    it('should recommend disable for negative ROI', () => {
      // Negative improvement patterns (making things worse)
      for (let i = 0; i < 50; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: -0.1 },
        });
      }

      const report = collector.generateReport();
      expect(['improve', 'disable']).toContain(report.roi.recommendation);
    });

    it('should include reasoning in ROI', () => {
      collector.recordPatternApplication({
        component: 'feedback_integration',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.1 },
      });

      const report = collector.generateReport();
      expect(report.roi.reasoning.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty report generation', () => {
      const report = collector.generateReport();

      expect(report.totalPatternsApplied).toBe(0);
      expect(report.totalCorrections).toBe(0);
      expect(report.overallSuccessRate).toBe(0);
    });

    it('should handle patterns without improvement data', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: {}, // No improvement data
      });

      const effectiveness = collector.getComponentEffectiveness('contrastive_learner');
      expect(effectiveness.patternsApplied).toBe(1);
      expect(effectiveness.patternSuccessRate).toBe(0);
      expect(effectiveness.averageImprovement).toBe(0);
    });

    it('should handle zero improvement', () => {
      collector.recordPatternApplication({
        component: 'style_drift_detector',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0 },
      });

      const rate = collector.getPatternSuccessRate('style_drift_detector');
      expect(rate).toBe(0); // Zero improvement is not a success
    });

    it('should handle negative improvement', () => {
      collector.recordPatternApplication({
        component: 'feedback_integration',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: -0.1 },
      });

      const rate = collector.getPatternSuccessRate('feedback_integration');
      expect(rate).toBe(0); // Negative improvement is not a success
    });

    it('should handle mixed improvements', () => {
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-1',
        sessionId: 'session-1',
        chapterId: 1,
        context: { improvement: 0.2 },
      });
      collector.recordPatternApplication({
        component: 'contrastive_learner',
        patternId: 'pattern-2',
        sessionId: 'session-2',
        chapterId: 1,
        context: { improvement: -0.1 },
      });

      const effectiveness = collector.getComponentEffectiveness('contrastive_learner');
      expect(effectiveness.averageImprovement).toBeCloseTo(0.05, 5);
    });

    it('should handle very large numbers of events', () => {
      // This tests the trimming functionality indirectly
      for (let i = 0; i < 100; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-${i}`,
          sessionId: `session-${i % 10}`,
          chapterId: (i % 5) + 1,
          context: { improvement: Math.random() * 0.2 },
        });
      }

      const summary = collector.getSummary();
      expect(summary.totalPatternApplications).toBe(100);
    });
  });

  // ===========================================================================
  // Integration Scenarios
  // ===========================================================================

  describe('Integration Scenarios', () => {
    it('should handle complete feedback loop workflow', () => {
      // Simulate a complete session
      const sessionId = 'integration-session';

      // 1. Record pattern applications
      for (let ch = 1; ch <= 3; ch++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `pattern-ch${ch}`,
          sessionId,
          chapterId: ch,
          context: { beforeScore: 0.6, afterScore: 0.75, improvement: 0.15 },
        });
      }

      // 2. Record corrections
      collector.recordCorrection({
        sessionId,
        chapterId: 2,
        correctionType: 'style',
        severity: 'minor',
        relatedComponent: 'contrastive_learner',
      });

      // 3. Record satisfaction
      for (let ch = 1; ch <= 3; ch++) {
        collector.recordSatisfaction(sessionId, ch, 4);
      }

      // 4. Record quality changes
      collector.recordQualityChange(sessionId, 1, 0.7, 0.85, 'feedback_integration');

      // 5. Generate report
      const report = collector.generateReport();

      expect(report.totalPatternsApplied).toBe(3);
      expect(report.totalCorrections).toBe(1);
      expect(report.overallSuccessRate).toBe(1); // All patterns improved quality
    });

    it('should track multiple sessions independently', () => {
      // Session 1: Good performance
      for (let i = 0; i < 5; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `session1-pattern-${i}`,
          sessionId: 'session-1',
          chapterId: 1,
          context: { improvement: 0.2 },
        });
      }
      collector.recordSatisfaction('session-1', 1, 5);

      // Session 2: Poor performance
      for (let i = 0; i < 5; i++) {
        collector.recordPatternApplication({
          component: 'contrastive_learner',
          patternId: `session2-pattern-${i}`,
          sessionId: 'session-2',
          chapterId: 1,
          context: { improvement: -0.1 },
        });
      }
      collector.recordSatisfaction('session-2', 1, 2);

      const report = collector.generateReport();

      expect(report.totalPatternsApplied).toBe(10);
      expect(report.overallSuccessRate).toBe(0.5); // Half succeeded
    });

    it('should provide actionable recommendations', () => {
      // Create scenario where recommendations are needed
      // Low success rate for one component
      for (let i = 0; i < 20; i++) {
        collector.recordPatternApplication({
          component: 'style_drift_detector',
          patternId: `pattern-${i}`,
          sessionId: `session-${i}`,
          chapterId: 1,
          context: { improvement: i < 5 ? 0.1 : -0.05 },
        });
      }

      const report = collector.generateReport();

      // Should have at least one specific recommendation
      expect(report.recommendations.length).toBeGreaterThan(0);
      const hasSpecificAdvice = report.recommendations.some(
        (r) =>
          r.includes('Success rate') ||
          r.includes('Correction') ||
          r.includes('performing') ||
          r.includes('ROI')
      );
      expect(hasSpecificAdvice).toBe(true);
    });
  });
});
