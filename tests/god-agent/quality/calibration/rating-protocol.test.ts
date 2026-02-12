/**
 * Rating Protocol Tests
 * PHASE-1-001 - Human Rating Protocol Validation
 *
 * Tests for:
 * - Rating score validation
 * - Rating submission validation
 * - Rater qualification checks
 * - Scale conversion utilities
 * - Criteria retrieval
 */

import { describe, it, expect } from 'vitest';
import {
  isValidRatingScore,
  validateRatingSubmission,
  meetsMinimumQualifications,
  humanToGauntletScale,
  gauntletToHumanScale,
  getRatingCriteria,
  calculateAverageScore,
  RATING_ANCHORS,
  ARGUMENT_COHERENCE_CRITERIA,
  CITATION_COMPLETENESS_CRITERIA,
  STYLE_CONSISTENCY_CRITERIA,
  FACTUAL_ACCURACY_CRITERIA,
  type RatingScore,
  type RatingSubmission,
  type RaterQualifications,
  type HumanRatingDimensions,
} from '../../../../src/god-agent/cli/quality/calibration/rating-protocol.js';

describe('Rating Protocol', () => {
  // Helper to create valid ratings
  const createValidRatings = (overrides: Partial<HumanRatingDimensions> = {}): HumanRatingDimensions => ({
    argumentCoherence: { score: 4, confidence: 'high', notes: 'Good structure' },
    citationCompleteness: { score: 3, confidence: 'medium' },
    styleConsistency: { score: 4, confidence: 'high' },
    factualAccuracy: { score: 5, confidence: 'high' },
    overallQuality: { score: 4, wouldPublish: true },
    ...overrides,
  });

  // Helper to create valid submission
  const createValidSubmission = (overrides: Partial<RatingSubmission> = {}): RatingSubmission => ({
    submissionId: 'sub_001',
    raterId: 'rater_001',
    chapterId: 1,
    sessionId: 'session_001',
    ratings: createValidRatings(),
    metadata: {
      timeSpentMinutes: 25,
      isRerating: false,
    },
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  describe('isValidRatingScore', () => {
    it('should accept valid scores 1-5', () => {
      expect(isValidRatingScore(1)).toBe(true);
      expect(isValidRatingScore(2)).toBe(true);
      expect(isValidRatingScore(3)).toBe(true);
      expect(isValidRatingScore(4)).toBe(true);
      expect(isValidRatingScore(5)).toBe(true);
    });

    it('should reject scores outside 1-5 range', () => {
      expect(isValidRatingScore(0)).toBe(false);
      expect(isValidRatingScore(6)).toBe(false);
      expect(isValidRatingScore(-1)).toBe(false);
      expect(isValidRatingScore(100)).toBe(false);
    });

    it('should reject non-integer values', () => {
      expect(isValidRatingScore(1.5)).toBe(false);
      expect(isValidRatingScore(3.7)).toBe(false);
      expect(isValidRatingScore(NaN)).toBe(false);
    });
  });

  describe('validateRatingSubmission', () => {
    it('should validate a complete, valid submission', () => {
      const submission = createValidSubmission();
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require raterId', () => {
      const submission = createValidSubmission();
      delete (submission as any).raterId;
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('raterId is required');
    });

    it('should require valid chapterId (1-7)', () => {
      const submission = createValidSubmission({ chapterId: 0 });
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('chapterId must be between 1 and 7');

      const submission2 = createValidSubmission({ chapterId: 8 });
      const result2 = validateRatingSubmission(submission2);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('chapterId must be between 1 and 7');
    });

    it('should require sessionId', () => {
      const submission = createValidSubmission();
      delete (submission as any).sessionId;
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('sessionId is required');
    });

    it('should require all rating dimensions', () => {
      const submission = createValidSubmission();
      (submission.ratings as any).argumentCoherence = undefined;
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('argumentCoherence rating is required');
    });

    it('should validate rating scores are 1-5', () => {
      const submission = createValidSubmission();
      (submission.ratings.argumentCoherence.score as any) = 6;
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('argumentCoherence score must be between 1 and 5');
    });

    it('should require timeSpentMinutes >= 1', () => {
      const submission = createValidSubmission();
      submission.metadata.timeSpentMinutes = 0;
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeSpentMinutes must be at least 1');
    });

    it('should accumulate multiple errors', () => {
      const submission: Partial<RatingSubmission> = {};
      const result = validateRatingSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('meetsMinimumQualifications', () => {
    const validQualifications: RaterQualifications = {
      highestDegree: 'PhD',
      fieldOfStudy: 'Computer Science',
      yearsExperience: 5,
      hasPublications: true,
      expertiseAreas: ['AI', 'ML'],
    };

    it('should accept PhD holders with sufficient experience', () => {
      const result = meetsMinimumQualifications(validQualifications);
      expect(result.meets).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should accept ABD status', () => {
      const quals = { ...validQualifications, highestDegree: 'ABD' as const };
      const result = meetsMinimumQualifications(quals);
      expect(result.meets).toBe(true);
    });

    it('should reject Masters without PhD/ABD', () => {
      const quals = { ...validQualifications, highestDegree: 'Masters' as const };
      const result = meetsMinimumQualifications(quals);
      expect(result.meets).toBe(false);
      expect(result.issues).toContain('Rater must hold a PhD or be ABD');
    });

    it('should reject < 3 years experience', () => {
      const quals = { ...validQualifications, yearsExperience: 2 };
      const result = meetsMinimumQualifications(quals);
      expect(result.meets).toBe(false);
      expect(result.issues).toContain('Rater must have at least 3 years of academic writing evaluation experience');
    });

    it('should accumulate multiple issues', () => {
      const quals: RaterQualifications = {
        highestDegree: 'Other',
        fieldOfStudy: 'Test',
        yearsExperience: 1,
        hasPublications: false,
        expertiseAreas: [],
      };
      const result = meetsMinimumQualifications(quals);
      expect(result.meets).toBe(false);
      expect(result.issues.length).toBe(2);
    });
  });

  describe('humanToGauntletScale', () => {
    it('should map 1 to 0', () => {
      expect(humanToGauntletScale(1)).toBe(0);
    });

    it('should map 3 to 0.5', () => {
      expect(humanToGauntletScale(3)).toBe(0.5);
    });

    it('should map 5 to 1', () => {
      expect(humanToGauntletScale(5)).toBe(1);
    });

    it('should map 2 to 0.25', () => {
      expect(humanToGauntletScale(2)).toBe(0.25);
    });

    it('should map 4 to 0.75', () => {
      expect(humanToGauntletScale(4)).toBe(0.75);
    });
  });

  describe('gauntletToHumanScale', () => {
    it('should map 0 to 1', () => {
      expect(gauntletToHumanScale(0)).toBe(1);
    });

    it('should map 0.5 to 3', () => {
      expect(gauntletToHumanScale(0.5)).toBe(3);
    });

    it('should map 1 to 5', () => {
      expect(gauntletToHumanScale(1)).toBe(5);
    });

    it('should be inverse of humanToGauntletScale', () => {
      const scores: RatingScore[] = [1, 2, 3, 4, 5];
      for (const score of scores) {
        const gauntlet = humanToGauntletScale(score);
        const backToHuman = gauntletToHumanScale(gauntlet);
        expect(backToHuman).toBe(score);
      }
    });
  });

  describe('getRatingCriteria', () => {
    it('should return argument coherence criteria', () => {
      const criteria = getRatingCriteria('argumentCoherence', 5);
      expect(criteria).toEqual(ARGUMENT_COHERENCE_CRITERIA[5]);
      expect(criteria).toContain('Compelling, nuanced thesis');
    });

    it('should return citation completeness criteria', () => {
      const criteria = getRatingCriteria('citationCompleteness', 1);
      expect(criteria).toEqual(CITATION_COMPLETENESS_CRITERIA[1]);
      expect(criteria).toContain('Missing citations for major claims');
    });

    it('should return style consistency criteria', () => {
      const criteria = getRatingCriteria('styleConsistency', 3);
      expect(criteria).toEqual(STYLE_CONSISTENCY_CRITERIA[3]);
      expect(criteria).toContain('Generally consistent tone');
    });

    it('should return factual accuracy criteria', () => {
      const criteria = getRatingCriteria('factualAccuracy', 4);
      expect(criteria).toEqual(FACTUAL_ACCURACY_CRITERIA[4]);
      expect(criteria).toContain('Factually accurate throughout');
    });
  });

  describe('calculateAverageScore', () => {
    it('should calculate correct average of dimension scores', () => {
      const ratings = createValidRatings({
        argumentCoherence: { score: 4, confidence: 'high' },
        citationCompleteness: { score: 3, confidence: 'medium' },
        styleConsistency: { score: 4, confidence: 'high' },
        factualAccuracy: { score: 5, confidence: 'high' },
        overallQuality: { score: 4, wouldPublish: true }, // Excluded from average
      });

      // Average: (4 + 3 + 4 + 5) / 4 = 4
      expect(calculateAverageScore(ratings)).toBe(4);
    });

    it('should handle all same scores', () => {
      const ratings = createValidRatings({
        argumentCoherence: { score: 3, confidence: 'medium' },
        citationCompleteness: { score: 3, confidence: 'medium' },
        styleConsistency: { score: 3, confidence: 'medium' },
        factualAccuracy: { score: 3, confidence: 'medium' },
        overallQuality: { score: 3, wouldPublish: false },
      });

      expect(calculateAverageScore(ratings)).toBe(3);
    });

    it('should exclude overallQuality from calculation', () => {
      const ratings = createValidRatings({
        argumentCoherence: { score: 4, confidence: 'high' },
        citationCompleteness: { score: 4, confidence: 'medium' },
        styleConsistency: { score: 4, confidence: 'high' },
        factualAccuracy: { score: 4, confidence: 'high' },
        overallQuality: { score: 1, wouldPublish: false }, // This is excluded
      });

      expect(calculateAverageScore(ratings)).toBe(4);
    });
  });

  describe('Rating Anchors and Criteria', () => {
    it('should have anchors for all 5 scores', () => {
      expect(Object.keys(RATING_ANCHORS)).toHaveLength(5);
      expect(RATING_ANCHORS[1]).toContain('Very Poor');
      expect(RATING_ANCHORS[5]).toContain('Excellent');
    });

    it('should have argument coherence criteria for all scores', () => {
      for (let score = 1; score <= 5; score++) {
        expect(ARGUMENT_COHERENCE_CRITERIA[score as RatingScore]).toBeDefined();
        expect(ARGUMENT_COHERENCE_CRITERIA[score as RatingScore].length).toBeGreaterThan(0);
      }
    });

    it('should have citation completeness criteria for all scores', () => {
      for (let score = 1; score <= 5; score++) {
        expect(CITATION_COMPLETENESS_CRITERIA[score as RatingScore]).toBeDefined();
        expect(CITATION_COMPLETENESS_CRITERIA[score as RatingScore].length).toBeGreaterThan(0);
      }
    });

    it('should have style consistency criteria for all scores', () => {
      for (let score = 1; score <= 5; score++) {
        expect(STYLE_CONSISTENCY_CRITERIA[score as RatingScore]).toBeDefined();
        expect(STYLE_CONSISTENCY_CRITERIA[score as RatingScore].length).toBeGreaterThan(0);
      }
    });

    it('should have factual accuracy criteria for all scores', () => {
      for (let score = 1; score <= 5; score++) {
        expect(FACTUAL_ACCURACY_CRITERIA[score as RatingScore]).toBeDefined();
        expect(FACTUAL_ACCURACY_CRITERIA[score as RatingScore].length).toBeGreaterThan(0);
      }
    });
  });
});
