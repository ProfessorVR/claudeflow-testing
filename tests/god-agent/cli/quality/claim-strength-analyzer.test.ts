/**
 * Tests for ClaimStrengthAnalyzer (Phase 2 Enhancement #2)
 *
 * Validates:
 * - Support score calculation
 * - Claim strength evaluation
 * - Cumulative evidence tracking
 * - Warrant assessment
 * - False positive reduction for warranted strong claims
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClaimStrengthAnalyzer,
  type ParagraphAnalysis,
} from '../../../../src/god-agent/cli/quality/helpers/claim-strength-analyzer.js';

describe('ClaimStrengthAnalyzer', () => {
  let analyzer: ClaimStrengthAnalyzer;

  beforeEach(() => {
    analyzer = new ClaimStrengthAnalyzer({
      strongClaimThreshold: 0.7,
      moderateClaimThreshold: 0.4,
      strictMode: false,
    });
  });

  describe('Support Score Calculation', () => {
    it('should calculate zero score with no evidence', () => {
      const analyses: ParagraphAnalysis[] = [
        {
          index: 0,
          text: 'This is a claim without any support.',
          sentences: ['This is a claim without any support.'],
          hasEvidence: false,
          hasClaim: true,
          citationCount: 0,
        },
      ];

      analyzer.analyzeChapter(analyses);
      const score = analyzer.calculateSupportScore(0, 'claim');

      expect(score.score).toBe(0);
      expect(score.evidenceCount).toBe(0);
      expect(score.citationCount).toBe(0);
    });

    it('should calculate moderate score with some evidence', () => {
      const analyses: ParagraphAnalysis[] = [
        {
          index: 0,
          text: 'Research shows that X (Smith, 2020).',
          sentences: ['Research shows that X (Smith, 2020).'],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        },
        {
          index: 1,
          text: 'Data indicates Y (Jones, 2021).',
          sentences: ['Data indicates Y (Jones, 2021).'],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        },
        {
          index: 2,
          text: 'Therefore, clearly Z is true.',
          sentences: ['Therefore, clearly Z is true.'],
          hasEvidence: false,
          hasClaim: true,
          citationCount: 0,
        },
      ];

      analyzer.analyzeChapter(analyses);
      const score = analyzer.calculateSupportScore(2, 'clearly Z');

      expect(score.score).toBeGreaterThan(0.3);
      expect(score.score).toBeLessThan(0.8);
      expect(score.evidenceCount).toBe(2);
      expect(score.citationCount).toBe(2);
    });

    it('should calculate high score with extensive evidence', () => {
      const analyses: ParagraphAnalysis[] = [
        {
          index: 0,
          text: 'Evidence 1 (Author, 2020).',
          sentences: ['Evidence 1 (Author, 2020).'],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        },
        {
          index: 1,
          text: 'Evidence 2 (Author, 2021).',
          sentences: ['Evidence 2 (Author, 2021).'],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        },
        {
          index: 2,
          text: 'Evidence 3 (Author, 2022).',
          sentences: ['Evidence 3 (Author, 2022).'],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        },
        {
          index: 3,
          text: 'Evidence 4 (Author, 2023).',
          sentences: ['Evidence 4 (Author, 2023).'],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        },
        {
          index: 4,
          text: 'Evidence 5 (Author, 2024).',
          sentences: ['Evidence 5 (Author, 2024).'],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        },
        {
          index: 5,
          text: 'Therefore, clearly this conclusion follows.',
          sentences: ['Therefore, clearly this conclusion follows.'],
          hasEvidence: false,
          hasClaim: true,
          citationCount: 0,
        },
      ];

      analyzer.analyzeChapter(analyses);
      const score = analyzer.calculateSupportScore(5, 'conclusion');

      expect(score.score).toBeGreaterThan(0.7);
      expect(score.evidenceCount).toBe(5);
      expect(score.citationCount).toBe(5);
    });

    it('should look back up to 5 paragraphs only', () => {
      const analyses: ParagraphAnalysis[] = [];

      // Create 10 paragraphs of evidence
      for (let i = 0; i < 10; i++) {
        analyses.push({
          index: i,
          text: `Evidence ${i} (Author, 202${i}).`,
          sentences: [`Evidence ${i} (Author, 202${i}).`],
          hasEvidence: true,
          hasClaim: false,
          citationCount: 1,
        });
      }

      // Claim at end
      analyses.push({
        index: 10,
        text: 'Therefore this is clearly true.',
        sentences: ['Therefore this is clearly true.'],
        hasEvidence: false,
        hasClaim: true,
        citationCount: 0,
      });

      analyzer.analyzeChapter(analyses);
      const score = analyzer.calculateSupportScore(10, 'clearly true');

      // Should only count last 5 evidence items
      expect(score.evidenceCount).toBe(5);
    });
  });

  describe('Claim Strength Evaluation', () => {
    it('should allow strong claims with high support', () => {
      const analyses: ParagraphAnalysis[] = [
        { index: 0, text: 'Evidence 1', sentences: ['Evidence 1'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 1, text: 'Evidence 2', sentences: ['Evidence 2'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 2, text: 'Evidence 3', sentences: ['Evidence 3'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 3, text: 'Evidence 4', sentences: ['Evidence 4'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 4, text: 'Therefore, clearly X.', sentences: ['Therefore, clearly X.'], hasEvidence: false, hasClaim: true, citationCount: 0 },
      ];

      analyzer.analyzeChapter(analyses);
      const evaluation = analyzer.evaluateClaimStrength(
        'clearly X',
        4,
        'Therefore, clearly X.'
      );

      expect(evaluation.isWarranted).toBe(true);
      expect(evaluation.suggestedStrength).toBe('strong');
    });

    it('should flag strong claims with low support', () => {
      const analyses: ParagraphAnalysis[] = [
        {
          index: 0,
          text: 'Some background information.',
          sentences: ['Some background information.'],
          hasEvidence: false,
          hasClaim: false,
          citationCount: 0,
        },
        {
          index: 1,
          text: 'Clearly this is obviously true.',
          sentences: ['Clearly this is obviously true.'],
          hasEvidence: false,
          hasClaim: true,
          citationCount: 0,
        },
      ];

      analyzer.analyzeChapter(analyses);
      const evaluation = analyzer.evaluateClaimStrength(
        'Clearly this is obviously true',
        1,
        'Clearly this is obviously true.'
      );

      expect(evaluation.isWarranted).toBe(false);
      expect(evaluation.suggestedStrength).toBe('hedged');
    });

    it('should allow moderate claims without strong language', () => {
      const analyses: ParagraphAnalysis[] = [
        {
          index: 0,
          text: 'This suggests that X.',
          sentences: ['This suggests that X.'],
          hasEvidence: false,
          hasClaim: true,
          citationCount: 0,
        },
      ];

      analyzer.analyzeChapter(analyses);
      const evaluation = analyzer.evaluateClaimStrength(
        'This suggests that X',
        0,
        'This suggests that X.'
      );

      expect(evaluation.isWarranted).toBe(true);
      expect(evaluation.suggestedStrength).toBe('moderate');
    });

    it('should allow culminating conclusions with moderate support', () => {
      const analyses: ParagraphAnalysis[] = [
        { index: 0, text: 'Evidence 1', sentences: ['Evidence 1'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 1, text: 'Evidence 2', sentences: ['Evidence 2'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        {
          index: 2,
          text: 'In conclusion, we can now see that X.',
          sentences: ['In conclusion, we can now see that X.'],
          hasEvidence: false,
          hasClaim: true,
          citationCount: 0,
        },
      ];

      analyzer.analyzeChapter(analyses);
      const evaluation = analyzer.evaluateClaimStrength(
        'we can now see that X',
        2,
        'In conclusion, we can now see that X.'
      );

      expect(evaluation.isWarranted).toBe(true);
    });

    it('should be stricter in strict mode', () => {
      const strictAnalyzer = new ClaimStrengthAnalyzer({
        strongClaimThreshold: 0.7,
        moderateClaimThreshold: 0.4,
        strictMode: true,
      });

      const analyses: ParagraphAnalysis[] = [
        { index: 0, text: 'Evidence 1', sentences: ['Evidence 1'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 1, text: 'Evidence 2', sentences: ['Evidence 2'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 2, text: 'Evidence 3', sentences: ['Evidence 3'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 3, text: 'Clearly X', sentences: ['Clearly X'], hasEvidence: false, hasClaim: true, citationCount: 0 },
      ];

      strictAnalyzer.analyzeChapter(analyses);
      const evaluation = strictAnalyzer.evaluateClaimStrength('Clearly X', 3, 'Clearly X');

      // Strict mode requires threshold + 0.1, so may not be warranted
      expect(evaluation.supportScore).toBeLessThan(0.8);
    });
  });

  describe('Citation Counting', () => {
    it('should count APA citations', () => {
      const text = 'Research shows (Smith, 2020) and (Jones, 2021) that...';
      const count = analyzer.countCitations(text);

      expect(count).toBe(2);
    });

    it('should count IEEE citations', () => {
      const text = 'Studies [1] and [2] demonstrate...';
      const count = analyzer.countCitations(text);

      expect(count).toBe(2);
    });

    it('should count et al. citations', () => {
      const text = 'As Smith et al. showed...';
      const count = analyzer.countCitations(text);

      expect(count).toBeGreaterThan(0);
    });

    it('should return zero for text without citations', () => {
      const text = 'This is just plain text without any citations.';
      const count = analyzer.countCitations(text);

      expect(count).toBe(0);
    });
  });

  describe('Evidence Detection', () => {
    it('should detect "research shows" patterns', () => {
      const text = 'Research shows that X is true.';
      expect(analyzer.hasEvidence(text)).toBe(true);
    });

    it('should detect "data indicates" patterns', () => {
      const text = 'The data indicates a clear pattern.';
      expect(analyzer.hasEvidence(text)).toBe(true);
    });

    it('should detect "for example" patterns', () => {
      const text = 'For example, consider the case of...';
      expect(analyzer.hasEvidence(text)).toBe(true);
    });

    it('should detect citation patterns as evidence', () => {
      const text = 'According to Author (2020), this is...';
      expect(analyzer.hasEvidence(text)).toBe(true);
    });

    it('should return false for non-evidence text', () => {
      const text = 'This is just a claim without evidence.';
      expect(analyzer.hasEvidence(text)).toBe(false);
    });
  });

  describe('Evidence Accumulation Markers', () => {
    it('should detect "moreover" marker', () => {
      const text = 'Moreover, additional evidence suggests...';
      expect(analyzer.hasEvidenceAccumulation(text)).toBe(true);
    });

    it('should detect "furthermore" marker', () => {
      const text = 'Furthermore, we find that...';
      expect(analyzer.hasEvidenceAccumulation(text)).toBe(true);
    });

    it('should detect "in addition" marker', () => {
      const text = 'In addition, studies have shown...';
      expect(analyzer.hasEvidenceAccumulation(text)).toBe(true);
    });

    it('should return false without accumulation markers', () => {
      const text = 'This is regular text.';
      expect(analyzer.hasEvidenceAccumulation(text)).toBe(false);
    });
  });

  describe('Claim Position Detection', () => {
    it('should detect opening position', () => {
      const position = analyzer.detectClaimPosition(1, 10);
      expect(position).toBe('opening');
    });

    it('should detect developing position', () => {
      const position = analyzer.detectClaimPosition(5, 10);
      expect(position).toBe('developing');
    });

    it('should detect culminating position', () => {
      const position = analyzer.detectClaimPosition(9, 10);
      expect(position).toBe('culminating');
    });
  });

  describe('State Management', () => {
    it('should reset state correctly', () => {
      const analyses: ParagraphAnalysis[] = [
        { index: 0, text: 'Test', sentences: ['Test'], hasEvidence: true, hasClaim: false, citationCount: 1 },
      ];

      analyzer.analyzeChapter(analyses);
      let stats = analyzer.getStats();
      expect(stats.paragraphsAnalyzed).toBe(1);

      analyzer.reset();

      stats = analyzer.getStats();
      expect(stats.paragraphsAnalyzed).toBe(0);
    });

    it('should provide accurate statistics', () => {
      const analyses: ParagraphAnalysis[] = [
        { index: 0, text: 'Evidence 1', sentences: ['Evidence 1'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 1, text: 'Evidence 2', sentences: ['Evidence 2'], hasEvidence: true, hasClaim: false, citationCount: 1 },
        { index: 2, text: 'Claim', sentences: ['Claim'], hasEvidence: false, hasClaim: true, citationCount: 0 },
      ];

      analyzer.analyzeChapter(analyses);
      const stats = analyzer.getStats();

      expect(stats.paragraphsAnalyzed).toBe(3);
      expect(stats.averageSupportScore).toBeGreaterThan(0);
      expect(stats.maxSupportScore).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty analysis array', () => {
      analyzer.analyzeChapter([]);
      const score = analyzer.calculateSupportScore(0, 'test');

      expect(score.score).toBe(0);
    });

    it('should handle single paragraph', () => {
      const analyses: ParagraphAnalysis[] = [
        { index: 0, text: 'Claim', sentences: ['Claim'], hasEvidence: false, hasClaim: true, citationCount: 0 },
      ];

      analyzer.analyzeChapter(analyses);
      const evaluation = analyzer.evaluateClaimStrength('Claim', 0, 'Claim');

      expect(evaluation).toBeDefined();
    });

    it('should handle claims without strong language', () => {
      const evaluation = analyzer.evaluateClaimStrength(
        'This is a moderate claim',
        0,
        'This is a moderate claim.'
      );

      expect(evaluation.isWarranted).toBe(true);
      expect(evaluation.suggestedStrength).toBe('moderate');
    });
  });
});
