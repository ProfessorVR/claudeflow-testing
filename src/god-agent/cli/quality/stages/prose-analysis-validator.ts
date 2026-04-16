/**
 * ProseAnalysisValidator - Quality stage for Lanham-framework prose analysis
 *
 * Evaluates prose quality through the Lanham lens (distinct from style consistency).
 * All thresholds are parameterized by genre -- no universal norms.
 * This honors Lanham's decorum principle: what counts as "good" prose
 * depends on the rhetorical situation.
 *
 * Trust tiers:
 *   Hard constraint  (noun/verb, register)     -> real issues, score penalties
 *   Firm guidance    (voice)                    -> moderate warnings on extreme deviation
 *   Soft observation (parataxis, opacity, tacit)-> diagnostics only, no penalties
 *   Informational    (periodic/running)         -> report only, never drive automation
 *
 * Weight: 0.05, Threshold: 0.70
 */

import {
  BaseQualityStage,
  type QualityStageResult,
  type QualityIssue,
  type QualityEvaluationContext,
  type QualityIssueSeverity,
  countIssuesBySeverity,
} from '../quality-stage.js';
import { LanhamProseAnalyzer } from '../../style/lanham-prose-analyzer.js';
import type { LanhamProseMetrics } from '../../../universal/style-analyzer.js';
import { GENRE_THRESHOLDS, GENRE_DEFAULTS, type Genre } from '../../style/lanham-style-policy.js';
import { NOMINALIZATION_SUFFIXES, LATINATE_SUFFIXES, FORMAL_MARKERS } from '../../style/lanham-shared.js';

// ============================================================================
// Genre-specific thresholds
// ============================================================================

/** Maximum nominalization density (per 100 words) before flagging.
 *  Values are on the same scale as the analyzer output (e.g., 0.08 = 8 per 100 words
 *  after the /100 normalization at the comparison site). */
const NOMINALIZATION_THRESHOLDS: Record<Genre, number> = {
  academic:     0.08,
  legal:        0.10,
  technical:    0.09,
  narrative:    0.06,
  journalistic: 0.07,
  general:      0.07,
};

/**
 * Minimum coefficient of variation for sentence lengths.
 * Below this, the prose is flagged as monotonous ("da da dum" rhythm).
 */
const SENTENCE_VARIANCE_THRESHOLDS: Record<Genre, number> = {
  academic:     0.20,
  legal:        0.15,
  technical:    0.15,
  narrative:    0.30,
  journalistic: 0.25,
  general:      0.22,
};

// ============================================================================
// ProseAnalysisValidator Class
// ============================================================================

export class ProseAnalysisValidator extends BaseQualityStage {
  readonly name = 'prose-analysis';
  readonly weight = 0.05;
  readonly threshold = 0.70;

  /**
   * Evaluate chapter text for Lanham-framework prose quality issues.
   */
  async evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const startTime = Date.now();
    const issues: QualityIssue[] = [];
    const metrics: Record<string, number> = {};
    const suggestions: string[] = [];
    const diagnostics: string[] = [];

    // Determine genre
    const genre: Genre = (context?.genre as Genre) || 'academic';
    const analyzer = new LanhamProseAnalyzer(genre);
    const analysis = await analyzer.fullAnalysis(chapterText);
    const thresholds = GENRE_THRESHOLDS[genre];
    const genreDefaults = GENRE_DEFAULTS[genre];

    // Store key metrics
    metrics['nounVerbRatio'] = analysis.nounVerbRatio;
    metrics['nominalizationDensity'] = analysis.nominalizationDensity;
    metrics['voiceScore'] = analysis.voiceScore;
    metrics['dynamicRange'] = analysis.dynamicRange;
    metrics['registerMarkednessScore'] = analysis.registerMarkednessScore;
    metrics['latinateGermanicRatio'] = analysis.latinateGermanicRatio;
    metrics['opacityScore'] = analysis.opacityScore;
    metrics['parataxisHypotaxisRatio'] = analysis.parataxisHypotaxisRatio;
    metrics['periodicRunningRatio'] = analysis.periodicRunningRatio;

    let issueIndex = 0;

    // ── Hard constraint: Nominalization overload ─────────────────────────
    const nomThreshold = NOMINALIZATION_THRESHOLDS[genre];
    // nominalizationDensity is per 100 words; threshold is a ratio (0.40 = 40%)
    // The analyzer reports density as a raw percentage-like number (e.g., 3.5 = 3.5 per 100 words)
    // We normalize: treat threshold as percentage points per 100 words
    const nomDensityNormalized = analysis.nominalizationDensity / 100;
    if (nomDensityNormalized > nomThreshold) {
      const paragraphs = this.extractParagraphs(chapterText);
      const heavyParagraphs = this.findNominalizationHeavyParagraphs(
        paragraphs, nomThreshold
      );

      for (const hp of heavyParagraphs.slice(0, 5)) {
        issues.push({
          id: this.generateIssueId('prose-analysis', issueIndex++),
          type: 'prose-analysis',
          severity: nomDensityNormalized > nomThreshold * 1.5 ? 'major' : 'minor',
          location: {
            chapterId,
            paragraphIndex: hp.index,
          },
          description: `Nominalization overload: ${(hp.density * 100).toFixed(1)}% of words are nominalizations (genre threshold: ${(nomThreshold * 100).toFixed(0)}%). Lanham calls this "Official Style" -- the action is buried in abstract nouns.`,
          suggestion: `Unpack nominalizations into active verbs. For example, convert "the implementation of the analysis" to "we analyzed" or "analyzing". Target: below ${(nomThreshold * 100).toFixed(0)}% nominalization density for ${genre} prose.`,
          autoFixable: false,
          contextSnippet: hp.snippet,
        });
      }

      // Also add a chapter-level summary if overall density is high
      if (heavyParagraphs.length === 0) {
        issues.push({
          id: this.generateIssueId('prose-analysis', issueIndex++),
          type: 'prose-analysis',
          severity: nomDensityNormalized > nomThreshold * 1.5 ? 'major' : 'minor',
          location: { chapterId },
          description: `Chapter-wide nominalization density (${analysis.nominalizationDensity.toFixed(1)} per 100 words) exceeds ${genre} genre threshold. ${analysis.explanations.nounVerb}`,
          suggestion: `Convert noun phrases back to verb constructions. Replace "the utilization of" with "using", "the establishment of" with "establishing", etc.`,
          autoFixable: false,
        });
      }
    }

    // ── Firm guidance: Monotonous sentence length ────────────────────────
    const varianceThreshold = SENTENCE_VARIANCE_THRESHOLDS[genre];
    if (analysis.dynamicRange < varianceThreshold) {
      const sentences = this.extractSentences(chapterText);
      if (sentences.length > 10) {
        // Find the most monotonous section
        const monotoneSection = this.findMonotonousSection(sentences, varianceThreshold);

        issues.push({
          id: this.generateIssueId('prose-analysis', issueIndex++),
          type: 'prose-analysis',
          severity: analysis.dynamicRange < varianceThreshold * 0.5 ? 'major' : 'minor',
          location: {
            chapterId,
            ...(monotoneSection?.paragraphIndex !== undefined
              ? { paragraphIndex: monotoneSection.paragraphIndex }
              : {}),
          },
          description: `Monotonous sentence rhythm: dynamic range ${analysis.dynamicRange.toFixed(2)} falls below ${genre} threshold ${varianceThreshold.toFixed(2)}. Lanham's "da da dum" -- sentences march in lockstep without rhythmic variation.`,
          suggestion: `Vary sentence lengths deliberately: follow a long, subordinated sentence with a short, punchy one. Alternate between periodic (suspense-building) and running (direct) structures. ${analysis.explanations.voice}`,
          autoFixable: false,
          contextSnippet: monotoneSection?.snippet,
        });
      }
    }

    // ── Hard constraint: Register inconsistency within text ──────────────
    const registerTarget = genreDefaults.registerTarget;
    const registerIssues = this.checkMidParagraphRegisterShifts(
      chapterText, chapterId, analysis, registerTarget, genre
    );
    issues.push(...registerIssues);
    issueIndex += registerIssues.length;

    // ── Soft observation: diagnostics only (no score penalties) ──────────
    // Parataxis/Hypotaxis
    if (analysis.labels.parataxisHypotaxis !== 'mixed') {
      diagnostics.push(
        `Parataxis/Hypotaxis: ${analysis.labels.parataxisHypotaxis}. ${analysis.explanations.parataxisHypotaxis}`
      );
    }

    // Opacity
    if (analysis.labels.opacity !== 'mixed opacity') {
      diagnostics.push(
        `Opacity: ${analysis.labels.opacity}. ${analysis.explanations.opacity}`
      );
    }

    // Tacit patterns
    if (analysis.explanations.tacitPatterns) {
      diagnostics.push(
        `Tacit patterns: ${analysis.explanations.tacitPatterns}`
      );
    }

    // ── Informational: report only ──────────────────────────────────────
    // Periodic/Running -- never drives automation
    if (analysis.explanations.periodicRunning) {
      diagnostics.push(
        `Sentence architecture (informational): ${analysis.labels.periodicRunning}. ${analysis.explanations.periodicRunning}`
      );
    }

    // Add diagnostics as suggestions (they appear in output but do not penalize)
    if (diagnostics.length > 0) {
      suggestions.push('--- Lanham Diagnostics (soft observation / informational) ---');
      suggestions.push(...diagnostics);
    }

    // Calculate score from hard-constraint and firm-guidance issues only
    const { critical, major, minor } = countIssuesBySeverity(issues);
    const paragraphs = this.extractParagraphs(chapterText);
    const totalElements = Math.max(paragraphs.length, 1);
    const score = this.calculateScore(critical, major, minor, totalElements);

    const passed = score >= this.threshold;

    return {
      stageName: this.name,
      passed,
      score,
      issues,
      metrics,
      suggestions,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  // ============================================================================
  // Private Analysis Methods
  // ============================================================================

  /**
   * Find paragraphs with high nominalization density
   */
  private findNominalizationHeavyParagraphs(
    paragraphs: string[],
    threshold: number
  ): Array<{ index: number; density: number; snippet: string }> {
    const results: Array<{ index: number; density: number; snippet: string }> = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const words = paragraphs[i]
        .toLowerCase()
        .replace(/[^\w\s'-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);

      if (words.length < 20) continue; // skip very short paragraphs

      let nomCount = 0;
      for (const w of words) {
        if (w.length >= 6 && NOMINALIZATION_SUFFIXES.some(s => w.endsWith(s))) {
          nomCount++;
        }
      }

      const density = nomCount / words.length;
      if (density > threshold) {
        results.push({
          index: i,
          density,
          snippet: paragraphs[i].substring(0, 120) + (paragraphs[i].length > 120 ? '...' : ''),
        });
      }
    }

    // Sort by density descending
    results.sort((a, b) => b.density - a.density);
    return results;
  }

  /**
   * Find the most monotonous contiguous section of sentences
   */
  private findMonotonousSection(
    sentences: string[],
    threshold: number
  ): { paragraphIndex?: number; snippet?: string } | undefined {
    if (sentences.length < 6) return undefined;

    const windowSize = 6;
    let worstVariance = Infinity;
    let worstStart = 0;

    for (let i = 0; i <= sentences.length - windowSize; i++) {
      const lengths = sentences.slice(i, i + windowSize).map(s => s.split(/\s+/).length);
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const cv = mean > 0
        ? Math.sqrt(lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length) / mean
        : 0;

      if (cv < worstVariance) {
        worstVariance = cv;
        worstStart = i;
      }
    }

    if (worstVariance >= threshold) return undefined;

    const snippet = sentences.slice(worstStart, worstStart + 3)
      .map(s => s.substring(0, 60) + (s.length > 60 ? '...' : ''))
      .join(' | ');

    return { snippet };
  }

  /**
   * Check for mid-paragraph register shifts that violate the declared register target.
   * A paragraph whose first half reads as one register and second half as another
   * signals an inconsistency that Lanham would flag as decorum violation.
   */
  private checkMidParagraphRegisterShifts(
    text: string,
    chapterId: number,
    _analysis: LanhamProseMetrics,
    registerTarget: string,
    genre: Genre
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const paragraphs = this.extractParagraphs(text);

    // Only check paragraphs long enough to have meaningful register shifts
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const words = para.split(/\s+/);
      if (words.length < 40) continue;

      const midpoint = Math.floor(words.length / 2);
      const firstHalf = words.slice(0, midpoint).join(' ');
      const secondHalf = words.slice(midpoint).join(' ');

      const firstRegister = this.estimateLocalRegister(firstHalf);
      const secondRegister = this.estimateLocalRegister(secondHalf);

      // Flag if registers differ AND the shift moves away from target
      if (firstRegister !== secondRegister) {
        // Mixed register is allowed in narrative genre
        if (genre === 'narrative') continue;

        // Only flag if one half matches target and the other diverges
        const firstMatchesTarget = firstRegister === registerTarget || registerTarget === 'mixed';
        const secondMatchesTarget = secondRegister === registerTarget || registerTarget === 'mixed';

        if (firstMatchesTarget && !secondMatchesTarget) {
          issues.push({
            id: this.generateIssueId('prose-analysis', issueIndex++),
            type: 'prose-analysis',
            severity: 'minor',
            location: {
              chapterId,
              paragraphIndex: i,
            },
            description: `Mid-paragraph register shift: starts as '${firstRegister}' register, drifts to '${secondRegister}' in the second half. Target register: '${registerTarget}'.`,
            suggestion: `Maintain consistent ${registerTarget} register throughout the paragraph. If the shift is intentional rhetorical play, consider splitting into separate paragraphs to make the transition explicit.`,
            autoFixable: false,
            contextSnippet: secondHalf.substring(0, 100) + (secondHalf.length > 100 ? '...' : ''),
          });
        } else if (!firstMatchesTarget && secondMatchesTarget) {
          issues.push({
            id: this.generateIssueId('prose-analysis', issueIndex++),
            type: 'prose-analysis',
            severity: 'minor',
            location: {
              chapterId,
              paragraphIndex: i,
            },
            description: `Mid-paragraph register shift: starts as '${firstRegister}' register (off-target), corrects to '${secondRegister}' in the second half.`,
            suggestion: `Revise the opening of this paragraph to match the '${registerTarget}' register from the start.`,
            autoFixable: false,
            contextSnippet: firstHalf.substring(0, 100) + (firstHalf.length > 100 ? '...' : ''),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Quick local register estimate for a text fragment.
   * Returns 'high', 'middle', or 'low'.
   */
  private estimateLocalRegister(text: string): 'high' | 'middle' | 'low' {
    const words = text.toLowerCase().replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 'middle';

    let latinateCount = 0;
    let shortGermanicCount = 0;
    let formalCount = 0;
    const contractions = (text.match(/\b\w+'\w+\b/g) || []).length;

    for (const w of words) {
      if (w.length >= 5 && LATINATE_SUFFIXES.some(s => w.endsWith(s))) {
        latinateCount++;
      } else if (w.length <= 5 && w.length >= 2) {
        shortGermanicCount++;
      }
      if (FORMAL_MARKERS.has(w)) formalCount++;
    }

    const latinateRatio = (latinateCount + shortGermanicCount) > 0
      ? latinateCount / (latinateCount + shortGermanicCount)
      : 0.5;
    const contractionRate = contractions / words.length;
    const formalDensity = formalCount / words.length;

    // High register: high Latinate, formal markers, no contractions
    if (latinateRatio > 0.40 && contractionRate < 0.005 && formalDensity > 0.005) {
      return 'high';
    }
    // Low register: lots of contractions, short words dominate
    if (contractionRate > 0.02 || (latinateRatio < 0.20 && formalDensity < 0.002)) {
      return 'low';
    }
    return 'middle';
  }
}
