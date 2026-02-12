/**
 * Feedback Metrics - PHASE-6-001
 *
 * Instrumentation for measuring feedback loop effectiveness.
 * Tracks pattern application rates, correction reduction, and user satisfaction correlation.
 *
 * Integrates with the A/B testing framework from Phase 5 for controlled experiments
 * on feedback component configurations.
 *
 * @module feedback-metrics
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

/**
 * Feedback component identifiers
 */
export type FeedbackComponent =
  | 'contrastive_learner'
  | 'cross_session_learner'
  | 'style_drift_detector'
  | 'feedback_integration';

/**
 * Pattern application event
 */
export interface PatternApplicationEvent {
  /** Unique event ID */
  id: string;

  /** Which component applied the pattern */
  component: FeedbackComponent;

  /** Pattern identifier */
  patternId: string;

  /** Session this occurred in */
  sessionId: string;

  /** Chapter context */
  chapterId: number;

  /** When the pattern was applied */
  timestamp: string;

  /** Quality score context */
  context: {
    /** Quality score before pattern applied */
    beforeScore?: number;
    /** Quality score after pattern applied */
    afterScore?: number;
    /** Improvement: afterScore - beforeScore */
    improvement?: number;
  };
}

/**
 * Correction event (user feedback that triggers learning)
 */
export interface CorrectionEvent {
  /** Unique event ID */
  id: string;

  /** Session this occurred in */
  sessionId: string;

  /** Chapter context */
  chapterId: number;

  /** Type of correction */
  correctionType: 'style' | 'content' | 'structure' | 'citation' | 'other';

  /** Severity of the correction */
  severity: 'minor' | 'moderate' | 'major';

  /** When the correction was recorded */
  timestamp: string;

  /** Optional: Which component could have prevented this */
  relatedComponent?: FeedbackComponent;
}

/**
 * User satisfaction record
 */
export interface SatisfactionRecord {
  /** Session this occurred in */
  sessionId: string;

  /** Chapter context */
  chapterId: number;

  /** Satisfaction score (1-5 scale) */
  score: number;

  /** When recorded */
  timestamp: string;
}

/**
 * Quality change record for before/after analysis
 */
export interface QualityChangeRecord {
  /** Session this occurred in */
  sessionId: string;

  /** Chapter context */
  chapterId: number;

  /** Score before feedback processing */
  beforeScore: number;

  /** Score after feedback processing */
  afterScore: number;

  /** Related component */
  component?: FeedbackComponent;

  /** When recorded */
  timestamp: string;
}

/**
 * Component effectiveness metrics
 */
export interface ComponentEffectiveness {
  /** Component being measured */
  component: FeedbackComponent;

  /** Total patterns applied by this component */
  patternsApplied: number;

  /** Percentage of applications that improved quality */
  patternSuccessRate: number;

  /** Mean quality improvement when pattern applied */
  averageImprovement: number;

  /** Percentage reduction in corrections over time */
  correctionReduction: number;

  /** Pearson correlation with user satisfaction */
  satisfactionCorrelation: number;
}

/**
 * ROI analysis for feedback components
 */
export interface FeedbackROI {
  /** Estimated tokens/compute for learning */
  learningCost: number;

  /** Quality improvement value (normalized 0-1) */
  qualityBenefit: number;

  /** Net benefit (qualityBenefit - normalized learningCost) */
  netBenefit: number;

  /** Recommendation based on ROI */
  recommendation: 'keep' | 'improve' | 'disable';

  /** Reasoning for recommendation */
  reasoning: string;
}

/**
 * Full effectiveness report
 */
export interface FeedbackEffectivenessReport {
  /** Unique report identifier */
  reportId: string;

  /** When report was generated */
  generatedAt: string;

  /** Start of analysis period */
  periodStart: string;

  /** End of analysis period */
  periodEnd: string;

  // Overall metrics
  /** Total patterns applied across all components */
  totalPatternsApplied: number;

  /** Total corrections recorded */
  totalCorrections: number;

  /** Overall success rate across all components */
  overallSuccessRate: number;

  /** Overall correlation with user satisfaction */
  overallSatisfactionCorrelation: number;

  // Per-component breakdown
  /** Effectiveness metrics for each component */
  byComponent: Record<FeedbackComponent, ComponentEffectiveness>;

  // ROI analysis
  /** Return on investment analysis */
  roi: FeedbackROI;

  // Recommendations
  /** Human-readable recommendations for improvement */
  recommendations: string[];
}

/**
 * Metrics event emitted by the collector
 */
export interface MetricsEvent {
  /** Event type */
  type:
    | 'pattern_applied'
    | 'correction_recorded'
    | 'satisfaction_recorded'
    | 'quality_change_recorded'
    | 'report_generated';

  /** When the event occurred */
  timestamp: string;

  /** Event-specific data */
  data: Record<string, unknown>;
}

/**
 * Time window specification for trend analysis
 */
export interface TimeWindow {
  /** Number of data points to include */
  windowSize: number;

  /** Step size between windows (for rolling calculations) */
  stepSize: number;
}

// =============================================================================
// FeedbackMetricsCollector Class
// =============================================================================

/**
 * FeedbackMetricsCollector - Instruments feedback components for effectiveness measurement
 *
 * This class collects metrics from all feedback components and provides:
 * - Pattern application tracking with before/after quality scores
 * - Correction event recording with severity classification
 * - User satisfaction correlation analysis
 * - Effectiveness reports with ROI analysis
 * - Integration points for A/B testing framework
 *
 * @example
 * ```typescript
 * const collector = createFeedbackMetricsCollector();
 *
 * // Track pattern application
 * collector.recordPatternApplication({
 *   component: 'contrastive_learner',
 *   patternId: 'pattern-001',
 *   sessionId: 'session-123',
 *   chapterId: 1,
 *   context: { beforeScore: 0.7, afterScore: 0.85, improvement: 0.15 }
 * });
 *
 * // Track corrections
 * collector.recordCorrection({
 *   sessionId: 'session-123',
 *   chapterId: 1,
 *   correctionType: 'style',
 *   severity: 'minor'
 * });
 *
 * // Generate effectiveness report
 * const report = collector.generateReport();
 * console.log(formatEffectivenessReport(report));
 * ```
 */
export class FeedbackMetricsCollector extends EventEmitter {
  private patternApplications: PatternApplicationEvent[] = [];
  private corrections: CorrectionEvent[] = [];
  private satisfactionScores: SatisfactionRecord[] = [];
  private qualityChanges: QualityChangeRecord[] = [];

  // Configuration
  private readonly maxEventsPerCategory: number = 10000;
  private readonly roiTokenCostPerPattern: number = 100; // Estimated tokens per pattern learning
  private readonly qualityBenefitMultiplier: number = 1000; // Converts quality improvement to comparable units

  constructor() {
    super();
  }

  // ===========================================================================
  // Recording Methods
  // ===========================================================================

  /**
   * Record a pattern application event
   * @param event - Pattern application details (timestamp is auto-generated)
   */
  recordPatternApplication(
    event: Omit<PatternApplicationEvent, 'timestamp' | 'id'>
  ): void {
    const fullEvent: PatternApplicationEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    this.patternApplications.push(fullEvent);
    this.trimIfNeeded('patternApplications');

    this.emit('metrics_event', {
      type: 'pattern_applied',
      timestamp: fullEvent.timestamp,
      data: {
        component: event.component,
        patternId: event.patternId,
        sessionId: event.sessionId,
        improvement: event.context.improvement,
      },
    } as MetricsEvent);
  }

  /**
   * Record a correction event (user feedback)
   * @param event - Correction details (timestamp is auto-generated)
   */
  recordCorrection(event: Omit<CorrectionEvent, 'timestamp' | 'id'>): void {
    const fullEvent: CorrectionEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    this.corrections.push(fullEvent);
    this.trimIfNeeded('corrections');

    this.emit('metrics_event', {
      type: 'correction_recorded',
      timestamp: fullEvent.timestamp,
      data: {
        sessionId: event.sessionId,
        chapterId: event.chapterId,
        correctionType: event.correctionType,
        severity: event.severity,
      },
    } as MetricsEvent);
  }

  /**
   * Record user satisfaction score for correlation analysis
   * @param sessionId - Session identifier
   * @param chapterId - Chapter number
   * @param score - Satisfaction score (typically 1-5)
   */
  recordSatisfaction(
    sessionId: string,
    chapterId: number,
    score: number
  ): void {
    const record: SatisfactionRecord = {
      sessionId,
      chapterId,
      score,
      timestamp: new Date().toISOString(),
    };

    this.satisfactionScores.push(record);
    this.trimIfNeeded('satisfactionScores');

    this.emit('metrics_event', {
      type: 'satisfaction_recorded',
      timestamp: record.timestamp,
      data: { sessionId, chapterId, score },
    } as MetricsEvent);
  }

  /**
   * Record quality score change before/after feedback processing
   * @param sessionId - Session identifier
   * @param chapterId - Chapter number
   * @param beforeScore - Quality score before processing
   * @param afterScore - Quality score after processing
   * @param component - Optional component that caused the change
   */
  recordQualityChange(
    sessionId: string,
    chapterId: number,
    beforeScore: number,
    afterScore: number,
    component?: FeedbackComponent
  ): void {
    const record: QualityChangeRecord = {
      sessionId,
      chapterId,
      beforeScore,
      afterScore,
      component,
      timestamp: new Date().toISOString(),
    };

    this.qualityChanges.push(record);
    this.trimIfNeeded('qualityChanges');

    this.emit('metrics_event', {
      type: 'quality_change_recorded',
      timestamp: record.timestamp,
      data: {
        sessionId,
        chapterId,
        beforeScore,
        afterScore,
        improvement: afterScore - beforeScore,
        component,
      },
    } as MetricsEvent);
  }

  // ===========================================================================
  // Analysis Methods
  // ===========================================================================

  /**
   * Get effectiveness metrics for a specific component
   * @param component - Component to analyze
   * @returns Effectiveness metrics for the component
   */
  getComponentEffectiveness(component: FeedbackComponent): ComponentEffectiveness {
    const componentApplications = this.patternApplications.filter(
      (p) => p.component === component
    );

    const patternsApplied = componentApplications.length;

    // Calculate success rate (applications that improved quality)
    const successfulApplications = componentApplications.filter(
      (p) => p.context.improvement !== undefined && p.context.improvement > 0
    );
    const patternSuccessRate =
      patternsApplied > 0 ? successfulApplications.length / patternsApplied : 0;

    // Calculate average improvement
    const improvements = componentApplications
      .filter((p) => p.context.improvement !== undefined)
      .map((p) => p.context.improvement!);
    const averageImprovement =
      improvements.length > 0
        ? improvements.reduce((a, b) => a + b, 0) / improvements.length
        : 0;

    // Calculate correction reduction trend
    const correctionReduction = this.calculateCorrectionReduction(component);

    // Calculate satisfaction correlation
    const satisfactionCorrelation =
      this.calculateSatisfactionCorrelation(component);

    return {
      component,
      patternsApplied,
      patternSuccessRate,
      averageImprovement,
      correctionReduction,
      satisfactionCorrelation,
    };
  }

  /**
   * Generate full effectiveness report
   * @param periodStart - Optional start of analysis period
   * @param periodEnd - Optional end of analysis period
   * @returns Complete effectiveness report with ROI analysis
   */
  generateReport(periodStart?: Date, periodEnd?: Date): FeedbackEffectivenessReport {
    const now = new Date();
    const start = periodStart ?? this.getEarliestTimestamp();
    const end = periodEnd ?? now;

    // Filter data to period
    const periodApplications = this.filterByPeriod(
      this.patternApplications,
      start,
      end
    );
    const periodCorrections = this.filterByPeriod(this.corrections, start, end);

    // Calculate overall metrics
    const totalPatternsApplied = periodApplications.length;
    const totalCorrections = periodCorrections.length;

    const successfulApplications = periodApplications.filter(
      (p) => p.context.improvement !== undefined && p.context.improvement > 0
    );
    const overallSuccessRate =
      totalPatternsApplied > 0
        ? successfulApplications.length / totalPatternsApplied
        : 0;

    // Calculate overall satisfaction correlation
    const overallSatisfactionCorrelation =
      this.calculateOverallSatisfactionCorrelation();

    // Calculate per-component effectiveness
    const components: FeedbackComponent[] = [
      'contrastive_learner',
      'cross_session_learner',
      'style_drift_detector',
      'feedback_integration',
    ];

    const byComponent = {} as Record<FeedbackComponent, ComponentEffectiveness>;
    for (const component of components) {
      byComponent[component] = this.getComponentEffectiveness(component);
    }

    // Calculate ROI
    const roi = this.calculateROI(byComponent, totalPatternsApplied);

    // Generate recommendations
    const recommendations = this.generateRecommendations(byComponent, roi);

    const report: FeedbackEffectivenessReport = {
      reportId: uuidv4(),
      generatedAt: now.toISOString(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      totalPatternsApplied,
      totalCorrections,
      overallSuccessRate,
      overallSatisfactionCorrelation,
      byComponent,
      roi,
      recommendations,
    };

    this.emit('metrics_event', {
      type: 'report_generated',
      timestamp: report.generatedAt,
      data: {
        reportId: report.reportId,
        totalPatternsApplied,
        overallSuccessRate,
        recommendation: roi.recommendation,
      },
    } as MetricsEvent);

    return report;
  }

  /**
   * Get pattern success rate
   * @param component - Optional component filter
   * @returns Success rate (0-1)
   */
  getPatternSuccessRate(component?: FeedbackComponent): number {
    const applications = component
      ? this.patternApplications.filter((p) => p.component === component)
      : this.patternApplications;

    if (applications.length === 0) return 0;

    const successful = applications.filter(
      (p) => p.context.improvement !== undefined && p.context.improvement > 0
    );

    return successful.length / applications.length;
  }

  /**
   * Get correction trend over time
   * @returns Trend direction and magnitude
   */
  getCorrectionTrend(): {
    direction: 'improving' | 'stable' | 'declining';
    magnitude: number;
  } {
    if (this.corrections.length < 4) {
      return { direction: 'stable', magnitude: 0 };
    }

    // Group corrections by session order
    const sessionOrder = this.getSessionOrder();
    if (sessionOrder.length < 2) {
      return { direction: 'stable', magnitude: 0 };
    }

    // Calculate corrections per session
    const correctionsPerSession: number[] = [];
    for (const sessionId of sessionOrder) {
      const sessionCorrections = this.corrections.filter(
        (c) => c.sessionId === sessionId
      );
      correctionsPerSession.push(sessionCorrections.length);
    }

    // Compare first half to second half
    const midpoint = Math.floor(correctionsPerSession.length / 2);
    const firstHalf = correctionsPerSession.slice(0, midpoint);
    const secondHalf = correctionsPerSession.slice(midpoint);

    const firstHalfAvg = this.average(firstHalf);
    const secondHalfAvg = this.average(secondHalf);

    if (firstHalfAvg === 0 && secondHalfAvg === 0) {
      return { direction: 'stable', magnitude: 0 };
    }

    // Calculate percentage change
    const change =
      firstHalfAvg > 0
        ? (firstHalfAvg - secondHalfAvg) / firstHalfAvg
        : secondHalfAvg > 0
          ? -1
          : 0;

    // Determine direction based on change
    // Positive change means fewer corrections (improving)
    if (change > 0.1) {
      return { direction: 'improving', magnitude: change };
    } else if (change < -0.1) {
      return { direction: 'declining', magnitude: Math.abs(change) };
    } else {
      return { direction: 'stable', magnitude: Math.abs(change) };
    }
  }

  /**
   * Calculate correlation between feedback component usage and satisfaction
   * @param component - Component to analyze
   * @returns Pearson correlation coefficient (-1 to 1)
   */
  calculateSatisfactionCorrelation(component: FeedbackComponent): number {
    // Get unique session+chapter combinations that have both pattern applications and satisfaction
    const componentApplications = this.patternApplications.filter(
      (p) => p.component === component
    );

    if (componentApplications.length < 3 || this.satisfactionScores.length < 3) {
      return 0;
    }

    // Build paired data for correlation
    const pairedData: Array<{ patternCount: number; satisfaction: number }> = [];

    // Group by session-chapter
    const sessionChapterMap = new Map<string, { patterns: number; satisfaction?: number }>();

    for (const app of componentApplications) {
      const key = `${app.sessionId}-${app.chapterId}`;
      const existing = sessionChapterMap.get(key) ?? { patterns: 0 };
      existing.patterns++;
      sessionChapterMap.set(key, existing);
    }

    for (const sat of this.satisfactionScores) {
      const key = `${sat.sessionId}-${sat.chapterId}`;
      const existing = sessionChapterMap.get(key);
      if (existing) {
        existing.satisfaction = sat.score;
      }
    }

    // Extract paired data
    for (const [, data] of sessionChapterMap) {
      if (data.satisfaction !== undefined) {
        pairedData.push({
          patternCount: data.patterns,
          satisfaction: data.satisfaction,
        });
      }
    }

    if (pairedData.length < 3) {
      return 0;
    }

    // Calculate Pearson correlation
    const x = pairedData.map((d) => d.patternCount);
    const y = pairedData.map((d) => d.satisfaction);

    return this.pearsonCorrelation(x, y);
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Reset all collected metrics
   */
  reset(): void {
    this.patternApplications = [];
    this.corrections = [];
    this.satisfactionScores = [];
    this.qualityChanges = [];
  }

  /**
   * Export all metrics for external analysis
   * @returns All collected metrics
   */
  exportMetrics(): {
    patternApplications: PatternApplicationEvent[];
    corrections: CorrectionEvent[];
    satisfactionScores: SatisfactionRecord[];
    qualityChanges: QualityChangeRecord[];
  } {
    return {
      patternApplications: [...this.patternApplications],
      corrections: [...this.corrections],
      satisfactionScores: [...this.satisfactionScores],
      qualityChanges: [...this.qualityChanges],
    };
  }

  /**
   * Get summary statistics
   * @returns Quick summary of collected metrics
   */
  getSummary(): {
    totalPatternApplications: number;
    totalCorrections: number;
    totalSatisfactionScores: number;
    totalQualityChanges: number;
    uniqueSessions: number;
    uniqueChapters: number;
  } {
    const allSessions = new Set([
      ...this.patternApplications.map((p) => p.sessionId),
      ...this.corrections.map((c) => c.sessionId),
      ...this.satisfactionScores.map((s) => s.sessionId),
      ...this.qualityChanges.map((q) => q.sessionId),
    ]);

    const allChapters = new Set([
      ...this.patternApplications.map((p) => p.chapterId),
      ...this.corrections.map((c) => c.chapterId),
      ...this.satisfactionScores.map((s) => s.chapterId),
      ...this.qualityChanges.map((q) => q.chapterId),
    ]);

    return {
      totalPatternApplications: this.patternApplications.length,
      totalCorrections: this.corrections.length,
      totalSatisfactionScores: this.satisfactionScores.length,
      totalQualityChanges: this.qualityChanges.length,
      uniqueSessions: allSessions.size,
      uniqueChapters: allChapters.size,
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  private trimIfNeeded(
    category: 'patternApplications' | 'corrections' | 'satisfactionScores' | 'qualityChanges'
  ): void {
    const array = this[category] as unknown[];
    if (array.length > this.maxEventsPerCategory) {
      // Keep most recent events
      const excess = array.length - this.maxEventsPerCategory;
      array.splice(0, excess);
    }
  }

  private getEarliestTimestamp(): Date {
    const timestamps = [
      ...this.patternApplications.map((p) => new Date(p.timestamp).getTime()),
      ...this.corrections.map((c) => new Date(c.timestamp).getTime()),
      ...this.satisfactionScores.map((s) => new Date(s.timestamp).getTime()),
      ...this.qualityChanges.map((q) => new Date(q.timestamp).getTime()),
    ];

    if (timestamps.length === 0) {
      return new Date();
    }

    return new Date(Math.min(...timestamps));
  }

  private filterByPeriod<T extends { timestamp: string }>(
    items: T[],
    start: Date,
    end: Date
  ): T[] {
    return items.filter((item) => {
      const ts = new Date(item.timestamp);
      return ts >= start && ts <= end;
    });
  }

  private getSessionOrder(): string[] {
    // Build session order based on first appearance timestamp
    const sessionFirstSeen = new Map<string, Date>();

    for (const c of this.corrections) {
      const ts = new Date(c.timestamp);
      const existing = sessionFirstSeen.get(c.sessionId);
      if (!existing || ts < existing) {
        sessionFirstSeen.set(c.sessionId, ts);
      }
    }

    // Sort sessions by first seen time
    return Array.from(sessionFirstSeen.entries())
      .sort((a, b) => a[1].getTime() - b[1].getTime())
      .map(([sessionId]) => sessionId);
  }

  private calculateCorrectionReduction(component: FeedbackComponent): number {
    // Calculate how much corrections have reduced where this component was active
    const componentApplications = this.patternApplications.filter(
      (p) => p.component === component
    );

    if (componentApplications.length < 2 || this.corrections.length < 4) {
      return 0;
    }

    // Sessions where component was used
    const componentSessions = new Set(
      componentApplications.map((p) => p.sessionId)
    );

    // Get sessions in order
    const sessionOrder = this.getSessionOrder();
    const orderedComponentSessions = sessionOrder.filter((s) =>
      componentSessions.has(s)
    );

    if (orderedComponentSessions.length < 2) {
      return 0;
    }

    // Calculate corrections per session for component sessions
    const correctionsPerSession: number[] = [];
    for (const sessionId of orderedComponentSessions) {
      const sessionCorrections = this.corrections.filter(
        (c) => c.sessionId === sessionId
      );
      correctionsPerSession.push(sessionCorrections.length);
    }

    // Compare first half to second half
    const midpoint = Math.floor(correctionsPerSession.length / 2);
    const firstHalf = correctionsPerSession.slice(0, midpoint);
    const secondHalf = correctionsPerSession.slice(midpoint);

    const firstHalfAvg = this.average(firstHalf);
    const secondHalfAvg = this.average(secondHalf);

    if (firstHalfAvg === 0) {
      return 0;
    }

    // Return reduction as a fraction
    return (firstHalfAvg - secondHalfAvg) / firstHalfAvg;
  }

  private calculateOverallSatisfactionCorrelation(): number {
    if (this.patternApplications.length < 3 || this.satisfactionScores.length < 3) {
      return 0;
    }

    // Build paired data: total patterns per session-chapter vs satisfaction
    const sessionChapterMap = new Map<
      string,
      { patterns: number; satisfaction?: number }
    >();

    for (const app of this.patternApplications) {
      const key = `${app.sessionId}-${app.chapterId}`;
      const existing = sessionChapterMap.get(key) ?? { patterns: 0 };
      existing.patterns++;
      sessionChapterMap.set(key, existing);
    }

    for (const sat of this.satisfactionScores) {
      const key = `${sat.sessionId}-${sat.chapterId}`;
      const existing = sessionChapterMap.get(key);
      if (existing) {
        existing.satisfaction = sat.score;
      }
    }

    // Extract paired data
    const pairedData: Array<{ patterns: number; satisfaction: number }> = [];
    for (const [, data] of sessionChapterMap) {
      if (data.satisfaction !== undefined) {
        pairedData.push({
          patterns: data.patterns,
          satisfaction: data.satisfaction,
        });
      }
    }

    if (pairedData.length < 3) {
      return 0;
    }

    const x = pairedData.map((d) => d.patterns);
    const y = pairedData.map((d) => d.satisfaction);

    return this.pearsonCorrelation(x, y);
  }

  private calculateROI(
    byComponent: Record<FeedbackComponent, ComponentEffectiveness>,
    totalPatterns: number
  ): FeedbackROI {
    // Estimate learning cost based on pattern count
    const learningCost = totalPatterns * this.roiTokenCostPerPattern;

    // Calculate quality benefit from average improvements
    let totalImprovement = 0;
    let componentCount = 0;

    for (const effectiveness of Object.values(byComponent)) {
      if (effectiveness.patternsApplied > 0) {
        totalImprovement +=
          effectiveness.averageImprovement * effectiveness.patternsApplied;
        componentCount++;
      }
    }

    const qualityBenefit =
      componentCount > 0
        ? (totalImprovement / componentCount) * this.qualityBenefitMultiplier
        : 0;

    // Normalize learning cost to comparable scale
    const normalizedCost = learningCost / this.qualityBenefitMultiplier;
    const netBenefit = qualityBenefit - normalizedCost;

    // Determine recommendation
    let recommendation: 'keep' | 'improve' | 'disable';
    let reasoning: string;

    if (netBenefit > 0.5) {
      recommendation = 'keep';
      reasoning = `Positive ROI: Quality improvements (${qualityBenefit.toFixed(2)}) outweigh learning costs (${normalizedCost.toFixed(2)})`;
    } else if (netBenefit > -0.2) {
      recommendation = 'improve';
      reasoning = `Marginal ROI: Consider optimizing pattern selection to improve quality gains`;
    } else {
      recommendation = 'disable';
      reasoning = `Negative ROI: Learning costs exceed quality benefits. Consider disabling or restructuring`;
    }

    return {
      learningCost,
      qualityBenefit,
      netBenefit,
      recommendation,
      reasoning,
    };
  }

  private generateRecommendations(
    byComponent: Record<FeedbackComponent, ComponentEffectiveness>,
    roi: FeedbackROI
  ): string[] {
    const recommendations: string[] = [];

    // Overall ROI recommendation
    if (roi.recommendation === 'disable') {
      recommendations.push(
        `Consider reducing feedback loop complexity - current ROI is negative (${roi.netBenefit.toFixed(2)})`
      );
    } else if (roi.recommendation === 'improve') {
      recommendations.push(
        `Optimize pattern selection criteria to improve quality gains`
      );
    }

    // Component-specific recommendations
    for (const [component, effectiveness] of Object.entries(byComponent)) {
      const comp = component as FeedbackComponent;

      if (effectiveness.patternSuccessRate < 0.5 && effectiveness.patternsApplied > 10) {
        recommendations.push(
          `${formatComponentName(comp)}: Success rate is low (${(effectiveness.patternSuccessRate * 100).toFixed(0)}%). Review pattern selection criteria.`
        );
      }

      if (effectiveness.correctionReduction < 0 && effectiveness.patternsApplied > 5) {
        recommendations.push(
          `${formatComponentName(comp)}: Corrections are increasing despite pattern application. Investigate pattern quality.`
        );
      }

      if (
        effectiveness.satisfactionCorrelation < 0 &&
        effectiveness.patternsApplied > 10
      ) {
        recommendations.push(
          `${formatComponentName(comp)}: Negative correlation with satisfaction (r=${effectiveness.satisfactionCorrelation.toFixed(2)}). Review applied patterns.`
        );
      }

      if (
        effectiveness.satisfactionCorrelation > 0.5 &&
        effectiveness.patternSuccessRate > 0.7
      ) {
        recommendations.push(
          `${formatComponentName(comp)}: High-performing component. Consider increasing its weight in the feedback loop.`
        );
      }
    }

    // Add positive recommendations if things are going well
    if (recommendations.length === 0) {
      const avgSuccessRate = this.average(
        Object.values(byComponent).map((e) => e.patternSuccessRate)
      );
      if (avgSuccessRate > 0.7) {
        recommendations.push(
          `Feedback loop is performing well with ${(avgSuccessRate * 100).toFixed(0)}% average success rate`
        );
      }
    }

    return recommendations;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) {
      return 0;
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new FeedbackMetricsCollector instance
 * @returns New collector instance
 */
export function createFeedbackMetricsCollector(): FeedbackMetricsCollector {
  return new FeedbackMetricsCollector();
}

// =============================================================================
// Formatting Functions
// =============================================================================

/**
 * Format component name for display
 * @param component - Component identifier
 * @returns Human-readable component name
 */
function formatComponentName(component: FeedbackComponent): string {
  const names: Record<FeedbackComponent, string> = {
    contrastive_learner: 'Contrastive Learner',
    cross_session_learner: 'Cross-Session Learner',
    style_drift_detector: 'Style Drift Detector',
    feedback_integration: 'Feedback Integration',
  };
  return names[component];
}

/**
 * Format effectiveness report for human-readable display
 * @param report - Report to format
 * @returns Formatted string
 */
export function formatEffectivenessReport(
  report: FeedbackEffectivenessReport
): string {
  const lines: string[] = [
    '='.repeat(60),
    'FEEDBACK EFFECTIVENESS REPORT',
    '='.repeat(60),
    '',
    `Report ID: ${report.reportId}`,
    `Generated: ${report.generatedAt}`,
    `Period: ${report.periodStart} to ${report.periodEnd}`,
    '',
    '-'.repeat(40),
    'OVERALL METRICS',
    '-'.repeat(40),
    '',
    `Total Patterns Applied: ${report.totalPatternsApplied}`,
    `Total Corrections: ${report.totalCorrections}`,
    `Overall Success Rate: ${(report.overallSuccessRate * 100).toFixed(1)}%`,
    `Overall Satisfaction Correlation: ${report.overallSatisfactionCorrelation.toFixed(3)}`,
    '',
    '-'.repeat(40),
    'COMPONENT BREAKDOWN',
    '-'.repeat(40),
  ];

  for (const [component, effectiveness] of Object.entries(report.byComponent)) {
    lines.push('');
    lines.push(`${formatComponentName(component as FeedbackComponent)}:`);
    lines.push(`  Patterns Applied: ${effectiveness.patternsApplied}`);
    lines.push(
      `  Success Rate: ${(effectiveness.patternSuccessRate * 100).toFixed(1)}%`
    );
    lines.push(
      `  Avg Improvement: ${(effectiveness.averageImprovement * 100).toFixed(2)}%`
    );
    lines.push(
      `  Correction Reduction: ${(effectiveness.correctionReduction * 100).toFixed(1)}%`
    );
    lines.push(
      `  Satisfaction Correlation: ${effectiveness.satisfactionCorrelation.toFixed(3)}`
    );
  }

  lines.push('');
  lines.push('-'.repeat(40));
  lines.push('ROI ANALYSIS');
  lines.push('-'.repeat(40));
  lines.push('');
  lines.push(`Learning Cost (tokens): ${report.roi.learningCost.toFixed(0)}`);
  lines.push(`Quality Benefit: ${report.roi.qualityBenefit.toFixed(2)}`);
  lines.push(`Net Benefit: ${report.roi.netBenefit.toFixed(2)}`);
  lines.push(`Recommendation: ${report.roi.recommendation.toUpperCase()}`);
  lines.push(`Reasoning: ${report.roi.reasoning}`);

  if (report.recommendations.length > 0) {
    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(40));
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  lines.push('');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Format a brief summary of the report
 * @param report - Report to summarize
 * @returns One-line summary
 */
export function formatReportSummary(report: FeedbackEffectivenessReport): string {
  return (
    `Feedback Effectiveness: ${(report.overallSuccessRate * 100).toFixed(0)}% success rate, ` +
    `${report.totalPatternsApplied} patterns applied, ` +
    `ROI: ${report.roi.recommendation} (net=${report.roi.netBenefit.toFixed(2)})`
  );
}
