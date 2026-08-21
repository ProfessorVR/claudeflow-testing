/** @deprecated Test-only / experimental module. Do not import in production. */

/**
 * Style Drift Detection - Monitor style consistency over time
 *
 * Detects when generated content drifts from the target style profile:
 * - Compare output style against profile
 * - Track drift over multiple writes
 * - Alert when style deviates significantly
 *
 * Reference: src/god-agent/cli/style-injector.ts
 *
 * Integration Points:
 * - UniversalAgent.write() - Check style after generation
 * - StyleProfileManager - Compare against active profile
 *
 * Usage:
 * ```typescript
 * const detector = new StyleDriftDetector(styleProfile);
 * const drift = await detector.detectDrift(content);
 * if (drift.score > 0.3) {
 *   console.log('Style drift detected!');
 * }
 * ```
 */

import type { StyleCharacteristics } from '../universal/style-analyzer.js';
import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';

const logger = createComponentLogger('StyleDriftDetector', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Style drift measurement
 */
export interface StyleDrift {
  /** Overall drift score (0-1, higher = more drift) */
  score: number;

  /** Drift by characteristic */
  characteristics: {
    sentenceLength: number;
    vocabulary: number;
    tone: number;
    formality: number;
    structure: number;
  };

  /** Drift trend (increasing/decreasing/stable) */
  trend: 'increasing' | 'decreasing' | 'stable';

  /** Alert level */
  alertLevel: 'none' | 'minor' | 'moderate' | 'severe';

  /** Timestamp */
  timestamp: string;
}

/**
 * Drift history entry
 */
export interface DriftHistoryEntry {
  /** Content ID */
  contentId: string;

  /** Drift measurement */
  drift: StyleDrift;

  /** Word count */
  wordCount: number;
}

// ============================================================================
// Style Drift Detector Class
// ============================================================================

/**
 * Detects style drift from target profile
 */
export class StyleDriftDetector {
  private driftHistory: DriftHistoryEntry[] = [];
  private readonly targetStyle: StyleCharacteristics;

  // Drift thresholds
  static readonly THRESHOLDS = {
    minor: 0.15,
    moderate: 0.30,
    severe: 0.50,
  };

  constructor(targetStyle: StyleCharacteristics) {
    this.targetStyle = targetStyle;
  }

  /**
   * Detect style drift in content
   */
  async detectDrift(content: string, contentId?: string): Promise<StyleDrift> {
    // Analyze current content style
    const currentStyle = this.analyzeStyle(content);

    // Compare against target
    const characteristics = {
      sentenceLength: this.compareSentenceLength(currentStyle, this.targetStyle),
      vocabulary: this.compareVocabulary(currentStyle, this.targetStyle),
      tone: this.compareTone(currentStyle, this.targetStyle),
      formality: this.compareFormality(currentStyle, this.targetStyle),
      structure: this.compareStructure(currentStyle, this.targetStyle),
    };

    // Calculate overall drift score (weighted average)
    const score =
      characteristics.sentenceLength * 0.2 +
      characteristics.vocabulary * 0.25 +
      characteristics.tone * 0.2 +
      characteristics.formality * 0.2 +
      characteristics.structure * 0.15;

    // Determine alert level
    let alertLevel: StyleDrift['alertLevel'] = 'none';
    if (score >= StyleDriftDetector.THRESHOLDS.severe) {
      alertLevel = 'severe';
    } else if (score >= StyleDriftDetector.THRESHOLDS.moderate) {
      alertLevel = 'moderate';
    } else if (score >= StyleDriftDetector.THRESHOLDS.minor) {
      alertLevel = 'minor';
    }

    // Determine trend
    const trend = this.calculateTrend(score);

    const drift: StyleDrift = {
      score,
      characteristics,
      trend,
      alertLevel,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    if (contentId) {
      this.driftHistory.push({
        contentId,
        drift,
        wordCount: content.split(/\s+/).length,
      });
    }

    logger.log(
      LogLevel.INFO,
      `Style drift: ${(score * 100).toFixed(1)}% (${alertLevel})`
    );

    return drift;
  }

  /**
   * Get drift trend over recent history
   */
  getDriftTrend(window: number = 5): 'increasing' | 'decreasing' | 'stable' {
    if (this.driftHistory.length < 2) {
      return 'stable';
    }

    const recent = this.driftHistory.slice(-window);
    const scores = recent.map(e => e.drift.score);

    // Simple linear regression
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * scores[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 0.02) return 'increasing';
    if (slope < -0.02) return 'decreasing';
    return 'stable';
  }

  /**
   * Get drift history
   */
  getHistory(): DriftHistoryEntry[] {
    return [...this.driftHistory];
  }

  /**
   * Get average drift over history
   */
  getAverageDrift(): number {
    if (this.driftHistory.length === 0) return 0;
    return this.driftHistory.reduce((sum, e) => sum + e.drift.score, 0) / this.driftHistory.length;
  }

  /**
   * Generate drift report
   */
  generateReport(): string {
    const lines = [
      '',
      '='.repeat(80),
      'STYLE DRIFT REPORT',
      '='.repeat(80),
      `Total Measurements: ${this.driftHistory.length}`,
      `Average Drift: ${(this.getAverageDrift() * 100).toFixed(1)}%`,
      `Current Trend: ${this.getDriftTrend()}`,
      '',
    ];

    if (this.driftHistory.length > 0) {
      const recent = this.driftHistory.slice(-5);
      lines.push('Recent Measurements:');
      for (const entry of recent) {
        const { drift } = entry;
        lines.push(`  ${entry.contentId}: ${(drift.score * 100).toFixed(1)}% (${drift.alertLevel})`);
      }
      lines.push('');
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Analyze style characteristics of content
   */
  private analyzeStyle(content: string): StyleCharacteristics {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);

    const avgSentenceLength = words.length / (sentences.length || 1);
    const avgParagraphLength = sentences.length / (paragraphs.length || 1);

    // Simple vocabulary complexity (avg word length)
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Detect formality (presence of contractions, casual words)
    const casualMarkers = content.match(/\b(gonna|wanna|kinda|gotta|isn't|won't|don't|can't)\b/gi);
    const formalityScore = 1 - Math.min((casualMarkers?.length || 0) / words.length * 10, 1);

    return {
      avgSentenceLength,
      avgWordLength,
      avgParagraphLength,
      formalityScore,
      vocabularyRichness: 0.5, // Placeholder
      toneMarkers: [], // Placeholder
    };
  }

  /**
   * Compare sentence length
   */
  private compareSentenceLength(current: StyleCharacteristics, target: StyleCharacteristics): number {
    const diff = Math.abs(current.avgSentenceLength - target.avgSentenceLength);
    const maxExpected = target.avgSentenceLength * 0.5; // 50% deviation
    return Math.min(diff / maxExpected, 1.0);
  }

  /**
   * Compare vocabulary
   */
  private compareVocabulary(current: StyleCharacteristics, target: StyleCharacteristics): number {
    const diff = Math.abs(current.avgWordLength - target.avgWordLength);
    const maxExpected = 2; // 2 chars difference
    return Math.min(diff / maxExpected, 1.0);
  }

  /**
   * Compare tone
   */
  private compareTone(_current: StyleCharacteristics, _target: StyleCharacteristics): number {
    // Simplified: would need more sophisticated tone analysis
    return 0.1;
  }

  /**
   * Compare formality
   */
  private compareFormality(current: StyleCharacteristics, target: StyleCharacteristics): number {
    const diff = Math.abs(current.formalityScore - target.formalityScore);
    return Math.min(diff, 1.0);
  }

  /**
   * Compare structure
   */
  private compareStructure(current: StyleCharacteristics, target: StyleCharacteristics): number {
    const diff = Math.abs(current.avgParagraphLength - target.avgParagraphLength);
    const maxExpected = target.avgParagraphLength * 0.5;
    return Math.min(diff / maxExpected, 1.0);
  }

  /**
   * Calculate trend from current score
   */
  private calculateTrend(currentScore: number): 'increasing' | 'decreasing' | 'stable' {
    if (this.driftHistory.length === 0) {
      return 'stable';
    }

    const lastScore = this.driftHistory[this.driftHistory.length - 1].drift.score;
    const diff = currentScore - lastScore;

    if (diff > 0.05) return 'increasing';
    if (diff < -0.05) return 'decreasing';
    return 'stable';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a style drift detector
 */
export function createStyleDriftDetector(targetStyle: StyleCharacteristics): StyleDriftDetector {
  return new StyleDriftDetector(targetStyle);
}
