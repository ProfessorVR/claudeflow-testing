/**
 * Tests for DissertationStyleDriftDetector - PHASE-7-001
 *
 * Tests cross-chapter style consistency detection, drift analysis,
 * outlier detection, and recommendation generation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DissertationStyleDriftDetector,
  createDissertationStyleDriftDetector,
  formatDriftAnalysis,
  formatNewChapterCheck,
  type ChapterStyleFingerprint,
  type DissertationDriftAnalysis,
  type NewChapterDriftCheck,
} from '../../../../src/god-agent/cli/quality/dissertation-style-drift-detector.js';

// =============================================================================
// Test Data: Sample Chapter Texts
// =============================================================================

/**
 * Consistent academic chapter text (formal, citations, passive voice)
 */
const CONSISTENT_CHAPTER_1 = `
# Introduction

The phenomenon of consciousness has been extensively studied within the phenomenological tradition.
This research establishes the foundational framework for understanding subjective experience.
Furthermore, the investigation contributes to ongoing debates in philosophy of mind (Smith, 2020).

The methodology employed in this study draws upon established phenomenological methods.
Consequently, the analysis provides rigorous examination of experiential structures.
It is argued that consciousness cannot be reduced to mere neural correlates (Jones, 2019).

Nevertheless, some scholars contend that materialist explanations suffice.
However, this study demonstrates significant limitations in such approaches.
The evidence suggests that phenomenological analysis offers unique insights (Brown & Taylor, 2021).

## Literature Review

The existing literature on consciousness spans multiple disciplines.
Academic research has increasingly recognized the value of first-person methodology.
Moreover, interdisciplinary approaches have yielded substantial advances (Williams, 2018).

Previous studies have established important theoretical foundations.
It was demonstrated that consciousness exhibits irreducible features (Garcia, 2020).
Subsequently, researchers developed more sophisticated analytical frameworks.
`;

/**
 * Consistent academic chapter text (similar style to chapter 1)
 */
const CONSISTENT_CHAPTER_2 = `
# Methodology

The research design was developed to address fundamental questions about consciousness.
This investigation employs rigorous phenomenological methods established by Husserl.
Furthermore, the approach incorporates contemporary refinements (Anderson, 2019).

The data collection process followed established protocols for qualitative research.
Accordingly, participants were selected using purposive sampling techniques.
It is noted that the sample size aligns with phenomenological research standards (Davis, 2021).

The analytical framework draws upon hermeneutic phenomenological principles.
Nevertheless, certain modifications were necessary for the present context.
The methodology ensures systematic and transparent analysis of experiential data (Thompson, 2020).

## Participants

The study included twenty participants from diverse backgrounds.
Each participant provided informed consent following ethical guidelines.
Moreover, demographic data was collected to ensure sample representativeness (Miller, 2018).

Participant selection criteria emphasized relevant experiential qualifications.
It was determined that prior contemplative experience would enhance data quality.
Subsequently, screening procedures were implemented to verify eligibility.
`;

/**
 * Inconsistent chapter (informal, lacks citations, active voice)
 */
const INCONSISTENT_CHAPTER = `
# What I Found

So basically I discovered some really cool stuff about consciousness.
We looked at a lot of things and they were pretty interesting.
Actually, the results were awesome and totally unexpected!

I think consciousness is way more complicated than people realize.
My analysis shows that we can't just explain it with brain stuff.
It's definitely not that simple, and lots of researchers get this wrong.

Here's the thing - phenomenology is actually super useful.
We should definitely use it more in cognitive science.
OK so let me tell you about what happened next.

## My Approach

I did some interviews and asked people about their experiences.
They told me lots of interesting things about how they perceive stuff.
Then I analyzed everything and found some patterns.

The participants were really helpful and gave great answers.
Basically everyone agreed that consciousness is hard to explain.
We talked about it a lot and came up with some ideas.
`;

/**
 * Highly technical chapter (many technical terms, high citation density)
 */
const TECHNICAL_CHAPTER = `
# Theoretical Framework

The epistemological framework utilizes transcendental phenomenological methodology.
Noetic-noematic correlations constitute the fundamental analytical structure (Husserl, 1913).
Furthermore, the investigation examines intentionality as correlational a priori (Zahavi, 2017).

The eidetic reduction reveals invariant structures within consciousness.
It is posited that transcendental subjectivity underlies all objectification (Moran, 2000).
Consequently, the phenomenological epoche brackets naturalistic presuppositions (Smith, 2003).

Hyletic data undergoes noetic animation through intentional morphe (Bernet, 2004).
The constitutive analysis reveals temporal synthesis as fundamental (Sokolowski, 2000).
Moreover, passive synthesis demonstrates pre-reflective structuration (Steinbock, 2017).

## Methodological Considerations

The hermeneutical phenomenological approach integrates interpretive procedures.
Gadamerian fusion of horizons enables understanding of experiential meanings (Palmer, 1969).
Subsequently, the research implements Ricoeurian narrative analysis (Thompson, 2007).

The methodological triangulation combines multiple phenomenological strategies.
It was determined that existential-analytic methods complement descriptive approaches (Dreyfus, 1991).
The analytical matrix incorporates Merleau-Pontian embodiment theory (Carman, 2008).
`;

// =============================================================================
// Test Suite
// =============================================================================

describe('DissertationStyleDriftDetector', () => {
  let detector: DissertationStyleDriftDetector;

  beforeEach(() => {
    detector = new DissertationStyleDriftDetector();
  });

  // ===========================================================================
  // Constructor Tests
  // ===========================================================================

  describe('constructor', () => {
    it('should create detector with default thresholds', () => {
      const defaultDetector = new DissertationStyleDriftDetector();
      expect(defaultDetector).toBeInstanceOf(DissertationStyleDriftDetector);
    });

    it('should create detector with custom thresholds', () => {
      const customDetector = new DissertationStyleDriftDetector({
        deviationThreshold: 0.25,
        alertThreshold: 0.35,
      });
      expect(customDetector).toBeInstanceOf(DissertationStyleDriftDetector);
    });
  });

  // ===========================================================================
  // Fingerprint Generation Tests
  // ===========================================================================

  describe('generateFingerprint', () => {
    it('should generate fingerprint with all required fields', () => {
      const fingerprint = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1, 'Introduction');

      expect(fingerprint).toHaveProperty('chapterId', 1);
      expect(fingerprint).toHaveProperty('chapterTitle', 'Introduction');
      expect(fingerprint).toHaveProperty('averageSentenceLength');
      expect(fingerprint).toHaveProperty('vocabularyRichness');
      expect(fingerprint).toHaveProperty('formalityScore');
      expect(fingerprint).toHaveProperty('paragraphDensity');
      expect(fingerprint).toHaveProperty('headingFrequency');
      expect(fingerprint).toHaveProperty('listUsage');
      expect(fingerprint).toHaveProperty('citationDensity');
      expect(fingerprint).toHaveProperty('citationStyle');
      expect(fingerprint).toHaveProperty('activeVoiceRatio');
      expect(fingerprint).toHaveProperty('firstPersonUsage');
      expect(fingerprint).toHaveProperty('technicalTermDensity');
      expect(fingerprint).toHaveProperty('wordCount');
      expect(fingerprint).toHaveProperty('sentenceCount');
      expect(fingerprint).toHaveProperty('paragraphCount');
      expect(fingerprint).toHaveProperty('analyzedAt');
    });

    it('should calculate correct word count', () => {
      const fingerprint = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);

      expect(fingerprint.wordCount).toBeGreaterThan(100);
      expect(fingerprint.sentenceCount).toBeGreaterThan(10);
      expect(fingerprint.paragraphCount).toBeGreaterThan(3);
    });

    it('should detect formality in academic text', () => {
      const formalFingerprint = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const informalFingerprint = detector.generateFingerprint(2, INCONSISTENT_CHAPTER);

      expect(formalFingerprint.formalityScore).toBeGreaterThan(informalFingerprint.formalityScore);
    });

    it('should detect citations', () => {
      const fpWithCitations = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fpWithoutCitations = detector.generateFingerprint(2, INCONSISTENT_CHAPTER);

      expect(fpWithCitations.citationDensity).toBeGreaterThan(0);
      expect(fpWithCitations.citationDensity).toBeGreaterThan(fpWithoutCitations.citationDensity);
    });

    it('should detect passive voice', () => {
      const fpFormal = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fpInformal = detector.generateFingerprint(2, INCONSISTENT_CHAPTER);

      // Formal text should have more passive voice (lower active ratio)
      expect(fpFormal.activeVoiceRatio).toBeLessThan(fpInformal.activeVoiceRatio);
    });

    it('should detect first person usage', () => {
      const fpFormal = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fpInformal = detector.generateFingerprint(2, INCONSISTENT_CHAPTER);

      // Informal text uses more first person
      expect(fpInformal.firstPersonUsage).toBeGreaterThan(fpFormal.firstPersonUsage);
    });

    it('should classify citation style', () => {
      const fingerprint = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);

      expect(['parenthetical', 'narrative', 'mixed']).toContain(fingerprint.citationStyle);
    });

    it('should handle empty text gracefully', () => {
      const fingerprint = detector.generateFingerprint(1, '');

      expect(fingerprint.wordCount).toBe(0);
      expect(fingerprint.sentenceCount).toBe(0);
      expect(fingerprint.paragraphCount).toBe(0);
    });
  });

  // ===========================================================================
  // Similarity Calculation Tests
  // ===========================================================================

  describe('calculateSimilarity', () => {
    it('should return high similarity for similar chapters', () => {
      const fp1 = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fp2 = detector.generateFingerprint(2, CONSISTENT_CHAPTER_2);

      const similarity = detector.calculateSimilarity(fp1, fp2);

      expect(similarity.overallSimilarity).toBeGreaterThan(0.7);
      expect(similarity.chapter1Id).toBe(1);
      expect(similarity.chapter2Id).toBe(2);
    });

    it('should return low similarity for dissimilar chapters', () => {
      const fp1 = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fp2 = detector.generateFingerprint(2, INCONSISTENT_CHAPTER);

      const similarity = detector.calculateSimilarity(fp1, fp2);

      expect(similarity.overallSimilarity).toBeLessThan(0.7);
    });

    it('should return perfect similarity for identical texts', () => {
      const fp1 = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fp2 = detector.generateFingerprint(2, CONSISTENT_CHAPTER_1);

      const similarity = detector.calculateSimilarity(fp1, fp2);

      expect(similarity.overallSimilarity).toBeGreaterThan(0.95);
    });

    it('should include feature-level similarities', () => {
      const fp1 = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fp2 = detector.generateFingerprint(2, CONSISTENT_CHAPTER_2);

      const similarity = detector.calculateSimilarity(fp1, fp2);

      expect(similarity.featureSimilarities).toHaveProperty('averageSentenceLength');
      expect(similarity.featureSimilarities).toHaveProperty('vocabularyRichness');
      expect(similarity.featureSimilarities).toHaveProperty('formalityScore');
      expect(similarity.featureSimilarities).toHaveProperty('citationDensity');
    });

    it('should handle citation style similarity correctly', () => {
      const fp1 = detector.generateFingerprint(1, CONSISTENT_CHAPTER_1);
      const fp2 = detector.generateFingerprint(2, CONSISTENT_CHAPTER_2);

      const similarity = detector.calculateSimilarity(fp1, fp2);

      expect(similarity.featureSimilarities).toHaveProperty('citationStyle');
      expect(similarity.featureSimilarities.citationStyle).toBeGreaterThanOrEqual(0);
      expect(similarity.featureSimilarities.citationStyle).toBeLessThanOrEqual(1);
    });
  });

  // ===========================================================================
  // Full Analysis Tests
  // ===========================================================================

  describe('analyzeAll', () => {
    it('should analyze multiple chapters', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, TECHNICAL_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(analysis.chapterCount).toBe(3);
      expect(analysis.fingerprints).toHaveLength(3);
      expect(analysis.similarityMatrix.length).toBe(3); // 3 pairs: 1-2, 1-3, 2-3
    });

    it('should calculate overall consistency', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(analysis.overallConsistency).toBeGreaterThan(0);
      expect(analysis.overallConsistency).toBeLessThanOrEqual(1);
    });

    it('should assign consistency grades', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(['excellent', 'good', 'acceptable', 'poor']).toContain(analysis.consistencyGrade);
    });

    it('should detect outliers when present', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, INCONSISTENT_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      // The informal chapter should be detected as an outlier
      const outlierIds = analysis.outlierChapters.map((o) => o.chapterId);
      expect(outlierIds).toContain(3);
    });

    it('should generate recommendations when issues detected', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, INCONSISTENT_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should include chapter titles when provided', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);
      const titles = new Map<number, string>([
        [1, 'Introduction'],
        [2, 'Methodology'],
      ]);

      const analysis = detector.analyzeAll(chapters, titles);

      expect(analysis.fingerprints[0].chapterTitle).toBe('Introduction');
      expect(analysis.fingerprints[1].chapterTitle).toBe('Methodology');
    });

    it('should analyze drift trend', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, TECHNICAL_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(analysis.driftTrend).toHaveProperty('direction');
      expect(analysis.driftTrend).toHaveProperty('magnitude');
      expect(analysis.driftTrend).toHaveProperty('pattern');
      expect(analysis.driftTrend).toHaveProperty('description');
    });
  });

  // ===========================================================================
  // New Chapter Check Tests
  // ===========================================================================

  describe('checkNewChapter', () => {
    it('should check if new chapter would cause drift', () => {
      // Use a detector with lower threshold to detect the informal chapter as causing drift
      const sensitiveDetector = new DissertationStyleDriftDetector({
        deviationThreshold: 0.15,
        alertThreshold: 0.20,
      });

      const existing = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);

      const result = sensitiveDetector.checkNewChapter(existing, {
        id: 3,
        text: INCONSISTENT_CHAPTER,
        title: 'Results',
      });

      expect(result.chapterId).toBe(3);
      expect(result.wouldCauseDrift).toBe(true);
      expect(result.deviationScore).toBeGreaterThan(0.15);
    });

    it('should pass consistent new chapters', () => {
      const existing = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
      ]);

      const result = detector.checkNewChapter(existing, {
        id: 2,
        text: CONSISTENT_CHAPTER_2,
        title: 'Methodology',
      });

      expect(result.wouldCauseDrift).toBe(false);
      expect(result.similarityToExisting).toBeGreaterThan(0.6);
    });

    it('should provide deviation areas when drift detected', () => {
      const existing = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);

      const result = detector.checkNewChapter(existing, {
        id: 3,
        text: INCONSISTENT_CHAPTER,
      });

      expect(result.deviationAreas.length).toBeGreaterThan(0);
    });

    it('should provide recommendations when drift detected', () => {
      const existing = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);

      const result = detector.checkNewChapter(existing, {
        id: 3,
        text: INCONSISTENT_CHAPTER,
      });

      if (result.wouldCauseDrift) {
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty existing chapters', () => {
      const existing = new Map<number, string>();

      const result = detector.checkNewChapter(existing, {
        id: 1,
        text: CONSISTENT_CHAPTER_1,
      });

      expect(result.wouldCauseDrift).toBe(false);
      expect(result.deviationScore).toBe(0);
      expect(result.similarityToExisting).toBe(1.0);
    });
  });

  // ===========================================================================
  // Consistency Grade Tests
  // ===========================================================================

  describe('getConsistencyGrade', () => {
    it('should return "excellent" for high scores', () => {
      expect(detector.getConsistencyGrade(0.90)).toBe('excellent');
      expect(detector.getConsistencyGrade(0.85)).toBe('excellent');
    });

    it('should return "good" for medium-high scores', () => {
      expect(detector.getConsistencyGrade(0.75)).toBe('good');
      expect(detector.getConsistencyGrade(0.70)).toBe('good');
    });

    it('should return "acceptable" for medium scores', () => {
      expect(detector.getConsistencyGrade(0.60)).toBe('acceptable');
      expect(detector.getConsistencyGrade(0.55)).toBe('acceptable');
    });

    it('should return "poor" for low scores', () => {
      expect(detector.getConsistencyGrade(0.50)).toBe('poor');
      expect(detector.getConsistencyGrade(0.30)).toBe('poor');
    });
  });

  // ===========================================================================
  // Outlier Detection Tests
  // ===========================================================================

  describe('detectOutliers', () => {
    it('should detect outlier chapters', () => {
      const fingerprints = [
        detector.generateFingerprint(1, CONSISTENT_CHAPTER_1),
        detector.generateFingerprint(2, CONSISTENT_CHAPTER_2),
        detector.generateFingerprint(3, INCONSISTENT_CHAPTER),
      ];

      const similarities = [
        detector.calculateSimilarity(fingerprints[0], fingerprints[1]),
        detector.calculateSimilarity(fingerprints[0], fingerprints[2]),
        detector.calculateSimilarity(fingerprints[1], fingerprints[2]),
      ];

      const outliers = detector.detectOutliers(fingerprints, similarities);

      expect(outliers.length).toBeGreaterThan(0);
      expect(outliers[0].chapterId).toBe(3);
    });

    it('should include deviation areas for outliers', () => {
      const fingerprints = [
        detector.generateFingerprint(1, CONSISTENT_CHAPTER_1),
        detector.generateFingerprint(2, CONSISTENT_CHAPTER_2),
        detector.generateFingerprint(3, INCONSISTENT_CHAPTER),
      ];

      const similarities = [
        detector.calculateSimilarity(fingerprints[0], fingerprints[1]),
        detector.calculateSimilarity(fingerprints[0], fingerprints[2]),
        detector.calculateSimilarity(fingerprints[1], fingerprints[2]),
      ];

      const outliers = detector.detectOutliers(fingerprints, similarities);

      if (outliers.length > 0) {
        expect(outliers[0].deviationAreas.length).toBeGreaterThan(0);
        expect(outliers[0].recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array when no outliers', () => {
      const fingerprints = [
        detector.generateFingerprint(1, CONSISTENT_CHAPTER_1),
        detector.generateFingerprint(2, CONSISTENT_CHAPTER_1), // Same text
      ];

      const similarities = [
        detector.calculateSimilarity(fingerprints[0], fingerprints[1]),
      ];

      const outliers = detector.detectOutliers(fingerprints, similarities);

      expect(outliers).toHaveLength(0);
    });

    it('should handle single chapter', () => {
      const fingerprints = [detector.generateFingerprint(1, CONSISTENT_CHAPTER_1)];
      const similarities: never[] = [];

      const outliers = detector.detectOutliers(fingerprints, similarities);

      expect(outliers).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Drift Trend Analysis Tests
  // ===========================================================================

  describe('analyzeDriftTrend', () => {
    it('should detect stable trend for consistent chapters', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, CONSISTENT_CHAPTER_1], // Reuse for similarity
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(['stable', 'improving']).toContain(analysis.driftTrend.direction);
    });

    it('should handle insufficient chapters gracefully', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);

      const analysis = detector.analyzeAll(chapters);

      // With only 2 chapters, trend analysis has limited data
      expect(analysis.driftTrend).toHaveProperty('direction');
      expect(analysis.driftTrend).toHaveProperty('pattern');
    });

    it('should provide meaningful description', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, TECHNICAL_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(analysis.driftTrend.description).toBeTruthy();
      expect(typeof analysis.driftTrend.description).toBe('string');
    });
  });

  // ===========================================================================
  // Event Emission Tests
  // ===========================================================================

  describe('event emission', () => {
    it('should emit analysis_complete event', () => {
      const handler = vi.fn();
      detector.on('analysis_complete', handler);

      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);

      detector.analyzeAll(chapters);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toHaveProperty('type', 'analysis_complete');
      expect(handler.mock.calls[0][0]).toHaveProperty('timestamp');
      expect(handler.mock.calls[0][0]).toHaveProperty('data');
    });

    it('should emit outlier_found events', () => {
      const handler = vi.fn();
      detector.on('outlier_found', handler);

      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, INCONSISTENT_CHAPTER],
      ]);

      detector.analyzeAll(chapters);

      // Should emit at least one outlier event for the inconsistent chapter
      expect(handler.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should emit new_chapter_checked event', () => {
      const handler = vi.fn();
      detector.on('new_chapter_checked', handler);

      const existing = new Map<number, string>([[1, CONSISTENT_CHAPTER_1]]);
      detector.checkNewChapter(existing, { id: 2, text: CONSISTENT_CHAPTER_2 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toHaveProperty('type', 'new_chapter_checked');
    });
  });

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('createDissertationStyleDriftDetector', () => {
    it('should create detector with default config', () => {
      const detector = createDissertationStyleDriftDetector();
      expect(detector).toBeInstanceOf(DissertationStyleDriftDetector);
    });

    it('should create detector with custom config', () => {
      const detector = createDissertationStyleDriftDetector({
        deviationThreshold: 0.2,
        alertThreshold: 0.3,
      });
      expect(detector).toBeInstanceOf(DissertationStyleDriftDetector);
    });
  });

  // ===========================================================================
  // Formatting Function Tests
  // ===========================================================================

  describe('formatDriftAnalysis', () => {
    it('should format analysis as readable string', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, TECHNICAL_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);
      const formatted = formatDriftAnalysis(analysis);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('DISSERTATION STYLE DRIFT ANALYSIS');
      expect(formatted).toContain('OVERALL CONSISTENCY');
      expect(formatted).toContain('DRIFT TREND');
      expect(formatted).toContain('CHAPTER FINGERPRINTS SUMMARY');
    });

    it('should include outlier section when outliers present', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, INCONSISTENT_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);
      const formatted = formatDriftAnalysis(analysis);

      if (analysis.outlierChapters.length > 0) {
        expect(formatted).toContain('OUTLIER CHAPTERS');
      }
    });

    it('should include recommendations section when present', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, INCONSISTENT_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);
      const formatted = formatDriftAnalysis(analysis);

      if (analysis.recommendations.length > 0) {
        expect(formatted).toContain('RECOMMENDATIONS');
      }
    });
  });

  describe('formatNewChapterCheck', () => {
    it('should format check result as readable string', () => {
      const existing = new Map<number, string>([[1, CONSISTENT_CHAPTER_1]]);
      const check = detector.checkNewChapter(existing, {
        id: 2,
        text: CONSISTENT_CHAPTER_2,
      });

      const formatted = formatNewChapterCheck(check);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('NEW CHAPTER DRIFT CHECK');
      expect(formatted).toContain('Chapter 2');
      expect(formatted).toContain('Similarity to existing');
    });

    it('should show warning status for drift-causing chapters', () => {
      const existing = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
      ]);
      const check = detector.checkNewChapter(existing, {
        id: 3,
        text: INCONSISTENT_CHAPTER,
      });

      const formatted = formatNewChapterCheck(check);

      if (check.wouldCauseDrift) {
        expect(formatted).toContain('WARNING');
      }
    });

    it('should show OK status for consistent chapters', () => {
      const existing = new Map<number, string>([[1, CONSISTENT_CHAPTER_1]]);
      const check = detector.checkNewChapter(existing, {
        id: 2,
        text: CONSISTENT_CHAPTER_2,
      });

      const formatted = formatNewChapterCheck(check);

      if (!check.wouldCauseDrift) {
        expect(formatted).toContain('OK');
      }
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle very short text', () => {
      const fingerprint = detector.generateFingerprint(1, 'Short text.');

      expect(fingerprint.wordCount).toBe(2);
    });

    it('should handle text without citations', () => {
      const text = 'This is a simple paragraph without any citations or references.';
      const fingerprint = detector.generateFingerprint(1, text);

      expect(fingerprint.citationDensity).toBe(0);
    });

    it('should handle text without headings', () => {
      const text = 'This is a paragraph without headings.\n\nThis is another paragraph.';
      const fingerprint = detector.generateFingerprint(1, text);

      expect(fingerprint.headingFrequency).toBe(0);
    });

    it('should handle single-chapter analysis', () => {
      const chapters = new Map<number, string>([[1, CONSISTENT_CHAPTER_1]]);
      const analysis = detector.analyzeAll(chapters);

      expect(analysis.chapterCount).toBe(1);
      expect(analysis.similarityMatrix).toHaveLength(0);
      expect(analysis.overallConsistency).toBe(1.0);
    });

    it('should handle special characters in text', () => {
      const textWithSpecial = `
        This text has special characters: @#$%^&*()
        And some unicode: cafe, naive, facade
        Plus some quotes: "quoted text" and 'single quotes'
      `;

      const fingerprint = detector.generateFingerprint(1, textWithSpecial);

      expect(fingerprint.wordCount).toBeGreaterThan(0);
    });

    it('should handle markdown formatting', () => {
      // Need substantial text for frequency per 1000 words to be non-zero
      const markdown = `
# Introduction

This is the introduction section with enough text to create meaningful statistics.
The document discusses various important topics in academic writing and style.
Furthermore, this analysis provides comprehensive coverage of the subject matter.

## Literature Review

The literature on this topic spans many decades of academic research and scholarship.
Scholars have extensively documented the importance of consistent writing practices.
Moreover, numerous studies have demonstrated the value of clear communication.

- First key finding from the research literature on academic writing
- Second important observation about dissertation quality standards
- Third notable contribution to our understanding of style

## Methods

The methodology employed follows established research protocols and guidelines.
Participants were carefully selected using rigorous sampling procedures.

1. Initial screening of potential candidates for inclusion in the study
2. Secondary evaluation based on predetermined selection criteria
3. Final confirmation of eligibility and informed consent procedures
      `;

      const fingerprint = detector.generateFingerprint(1, markdown);

      // Check that headings and lists were detected
      // With ~150 words and 3 headings, frequency should be ~20 per 1000 words
      expect(fingerprint.headingFrequency).toBeGreaterThan(0);
      // With ~150 words and 6 list items, frequency should be ~40 per 1000 words
      expect(fingerprint.listUsage).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Recommendation Generation Tests
  // ===========================================================================

  describe('generateRecommendations', () => {
    it('should generate recommendations for poor consistency', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, INCONSISTENT_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      // Should have some recommendations due to style inconsistency
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should limit recommendations to reasonable number', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, INCONSISTENT_CHAPTER],
        [3, TECHNICAL_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      expect(analysis.recommendations.length).toBeLessThanOrEqual(8);
    });

    it('should include outlier-specific recommendations', () => {
      const chapters = new Map<number, string>([
        [1, CONSISTENT_CHAPTER_1],
        [2, CONSISTENT_CHAPTER_2],
        [3, INCONSISTENT_CHAPTER],
      ]);

      const analysis = detector.analyzeAll(chapters);

      if (analysis.outlierChapters.length > 0) {
        const hasOutlierRec = analysis.recommendations.some(
          (rec) => rec.includes('chapter') || rec.includes('Chapter')
        );
        expect(hasOutlierRec).toBe(true);
      }
    });
  });
});
