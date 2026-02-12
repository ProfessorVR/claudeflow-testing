/**
 * Tests for CitationRefiner (Phase 2 Enhancement #1)
 *
 * Validates:
 * - Author term introduction detection
 * - First use vs. repeated use tracking
 * - External quote detection
 * - Technical vocabulary classification
 * - False positive reduction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CitationRefiner } from '../../../../src/god-agent/cli/quality/helpers/citation-refiner.js';

describe('CitationRefiner', () => {
  let refiner: CitationRefiner;

  beforeEach(() => {
    refiner = new CitationRefiner();
  });

  describe('Author Introduction Detection', () => {
    it('should detect "I term this" pattern', () => {
      const text =
        'I term this phenomenon "temporal punctuality" and will explore its implications.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms).toContain('temporal punctuality');
      expect(refiner.isAuthorOwnTerm(text, 'temporal punctuality')).toBe(true);
    });

    it('should detect "I call" pattern', () => {
      const text =
        'I call this concept phantasmatic vivification, referring to the way virtual reality animates imagination.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms).toContain('phantasmatic vivification');
    });

    it('should detect "this dissertation introduces" pattern', () => {
      const text =
        'This dissertation introduces the concept of "rhetorical mood" as a bridge between mood and persuasion.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms).toContain('rhetorical mood');
    });

    it('should detect "what I call" pattern', () => {
      const text =
        'What I call the "hermeneutic circle of presence" describes how VR users interpret virtual environments.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms).toContain('hermeneutic circle of presence');
    });

    it('should detect "by X, I mean" pattern', () => {
      const text =
        'By temporal synchronization, I mean the alignment of subjective time with narrative progression.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms.length).toBeGreaterThan(0);
    });

    it('should detect "hereafter referred to as" pattern', () => {
      const text =
        'This phenomenon (hereafter referred to as "experiential synthesis") characterizes VR immersion.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms).toContain('experiential synthesis');
    });

    it('should detect "I coin the term" pattern', () => {
      const text =
        'I coin the term "veridissimilitude" to capture the tension between realism and fantasy in VR.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms).toContain('veridissimilitude');
    });

    it('should handle terms without quotes', () => {
      const text =
        'I term this characteristic temporal punctuality, following Heidegger\'s analysis of ecstatic time.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms.length).toBeGreaterThan(0);
    });
  });

  describe('First Use vs. Repeated Use Tracking', () => {
    it('should track first use location', () => {
      const text = 'I introduce the concept of "temporal unification" here.';
      refiner.analyzeTermIntroductions(text, 0, 1);

      const recommendation = refiner.checkTermCitation(
        'temporal unification',
        text,
        0,
        1
      );

      expect(recommendation).toBeNull(); // First use, no citation needed
    });

    it('should not flag repeated use of author term', () => {
      const intro = 'I call this "temporal punctuality" and define it as...';
      refiner.analyzeTermIntroductions(intro, 0, 1);

      const laterUse = 'This temporal punctuality manifests in VR experiences.';
      const recommendation = refiner.checkTermCitation(
        'temporal punctuality',
        laterUse,
        5,
        1
      );

      expect(recommendation).toBeNull(); // Repeated use, no citation needed
    });

    it('should track multiple term introductions', () => {
      const text1 = 'I term this "concept A" for the first mechanism.';
      const text2 = 'I call this "concept B" for the second mechanism.';

      refiner.analyzeTermIntroductions(text1, 0, 1);
      refiner.analyzeTermIntroductions(text2, 1, 1);

      const stats = refiner.getStats();
      expect(stats.authorTermsCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('External Quote Detection', () => {
    it('should flag "according to" patterns', () => {
      const text = 'According to Heidegger, Dasein is being-in-the-world.';
      const recommendation = refiner.checkTermCitation(
        'being-in-the-world',
        text,
        0,
        1
      );

      expect(recommendation).not.toBeNull();
      expect(recommendation?.shouldFlag).toBe(true);
    });

    it('should flag "as X argues" patterns', () => {
      const text = 'As Aristotle argues, phantasia mediates between perception and thought.';
      const recommendation = refiner.checkTermCitation('phantasia', text, 0, 1);

      expect(recommendation).not.toBeNull();
      expect(recommendation?.shouldFlag).toBe(true);
    });

    it('should flag long quotes without citations', () => {
      const text =
        '"Virtual reality creates an immersive experience that fundamentally transforms human perception."';
      const recommendation = refiner.checkTermCitation(
        'immersive experience',
        text,
        0,
        1
      );

      expect(recommendation).not.toBeNull();
      expect(recommendation?.shouldFlag).toBe(true);
    });

    it('should not flag author\'s own analysis', () => {
      const text =
        'I argue that phantasia serves as the temporal unifier in Aristotelian psychology.';
      const recommendation = refiner.checkTermCitation('phantasia', text, 0, 1);

      expect(recommendation).toBeNull(); // Author's own claim
    });

    it('should not flag "this dissertation" contexts', () => {
      const text =
        'This dissertation proposes that rhetorical mood operates through phantasia.';
      const recommendation = refiner.checkTermCitation(
        'rhetorical mood',
        text,
        0,
        1
      );

      expect(recommendation).toBeNull(); // Author's work
    });
  });

  describe('Technical Vocabulary Classification', () => {
    it('should recognize hyphenated terms as technical', () => {
      const term = 'being-in-the-world';
      expect(refiner['isTechnicalTerm'](term)).toBe(true);
    });

    it('should recognize compound terms as technical', () => {
      const term = 'temporal unification';
      expect(refiner['isTechnicalTerm'](term)).toBe(true);
    });

    it('should not flag technical terms in non-strict mode', () => {
      const refinerNonStrict = new CitationRefiner({ strictMode: false });
      const text = 'The concept of temporal-punctuality is central here.';

      const recommendation = refinerNonStrict.checkTermCitation(
        'temporal-punctuality',
        text,
        0,
        1
      );

      expect(recommendation).toBeNull(); // Non-strict mode allows technical terms
    });

    it('should flag technical terms in strict mode', () => {
      const refinerStrict = new CitationRefiner({ strictMode: true });
      const text = 'The concept of temporal-punctuality is central here.';

      const recommendation = refinerStrict.checkTermCitation(
        'temporal-punctuality',
        text,
        0,
        1
      );

      expect(recommendation).not.toBeNull();
      expect(recommendation?.severity).toBe('minor');
    });
  });

  describe('Issue Refinement', () => {
    it('should filter out author\'s coined term', () => {
      const intro = 'I introduce the term "veridissimilitude" to describe...';
      refiner.analyzeTermIntroductions(intro, 0, 1);

      const issue = {
        contextSnippet: 'The veridissimilitude of VR experiences...',
        description: 'Technical term needs citation',
      };

      const refined = refiner.refineIssue(issue, {
        chapterId: 1,
        paragraphIndex: 2,
        fullParagraph: 'The veridissimilitude of VR experiences creates...',
      });

      expect(refined).toBeNull(); // Should filter out
    });

    it('should not filter external quote', () => {
      const issue = {
        contextSnippet: 'According to Smith (2020), immersion requires...',
        description: 'Claim needs citation',
      };

      const refined = refiner.refineIssue(issue, {
        chapterId: 1,
        paragraphIndex: 0,
        fullParagraph: 'According to Smith (2020), immersion requires presence.',
      });

      expect(refined).not.toBeNull();
      expect(refined?.shouldFlag).toBe(true);
    });

    it('should handle missing context gracefully', () => {
      const issue = {
        description: 'Some issue',
      };

      const refined = refiner.refineIssue(issue, {
        chapterId: 1,
        paragraphIndex: 0,
        fullParagraph: 'Some text',
      });

      expect(refined).not.toBeNull(); // Shouldn't crash
    });
  });

  describe('State Management', () => {
    it('should reset state correctly', () => {
      refiner.analyzeTermIntroductions('I call this "term A"', 0, 1);
      refiner.analyzeTermIntroductions('I call this "term B"', 1, 1);

      let stats = refiner.getStats();
      expect(stats.authorTermsCount).toBeGreaterThan(0);

      refiner.reset();

      stats = refiner.getStats();
      expect(stats.authorTermsCount).toBe(0);
      expect(stats.trackedTermsCount).toBe(0);
    });

    it('should provide accurate statistics', () => {
      refiner.analyzeTermIntroductions('I term this "concept A"', 0, 1);
      refiner.analyzeTermIntroductions('I call this "concept B"', 1, 1);
      refiner.analyzeTermIntroductions('I introduce "concept C"', 2, 1);

      const stats = refiner.getStats();

      expect(stats.authorTermsCount).toBeGreaterThanOrEqual(3);
      expect(stats.authorTerms.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const terms = refiner.analyzeTermIntroductions('', 0, 1);
      expect(terms).toEqual([]);
    });

    it('should handle text with no terms', () => {
      const text = 'This is just regular text without any special terms.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);
      expect(terms).toEqual([]);
    });

    it('should handle multiple quotes in one paragraph', () => {
      const text =
        'I introduce "term A" and "term B" as distinct concepts that interact.';
      const terms = refiner.analyzeTermIntroductions(text, 0, 1);

      expect(terms.length).toBeGreaterThanOrEqual(1);
    });

    it('should normalize term capitalization', () => {
      const text1 = 'I call this "Temporal Punctuality"';
      const text2 = 'temporal punctuality';

      refiner.analyzeTermIntroductions(text1, 0, 1);
      const recommendation = refiner.checkTermCitation(text2, text2, 1, 1);

      expect(recommendation).toBeNull(); // Should recognize as same term
    });
  });
});
