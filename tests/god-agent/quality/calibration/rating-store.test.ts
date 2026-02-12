/**
 * Rating Store Tests
 * PHASE-1-002 - Rating Collection Infrastructure
 *
 * Tests for:
 * - SQLite store initialization
 * - Rating storage and retrieval
 * - Rater registration and management
 * - Chapter management
 * - Calibration pair generation
 * - Inter-rater reliability calculation
 * - Data export
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  SQLiteRatingStore,
  createRatingStore,
  type ChapterForRating,
  type IRatingStore,
} from '../../../../src/god-agent/cli/quality/calibration/rating-store.js';
import type {
  RatingSubmission,
  RaterProfile,
  HumanRatingDimensions,
} from '../../../../src/god-agent/cli/quality/calibration/rating-protocol.js';

describe('SQLiteRatingStore', () => {
  const testDbPath = join(process.cwd(), 'tests', 'tmp', 'test-calibration.db');
  let store: SQLiteRatingStore;

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
    submissionId: `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

  // Helper to create valid rater profile input
  const createRaterInput = (email: string = `test${Date.now()}@example.com`) => ({
    name: 'Test Rater',
    email,
    qualifications: {
      highestDegree: 'PhD' as const,
      fieldOfStudy: 'Computer Science',
      yearsExperience: 5,
      hasPublications: true,
      expertiseAreas: ['AI', 'ML'],
    },
    isActive: true,
    onboardingCompletedAt: new Date().toISOString(),
    calibrationScores: [],
  });

  // Helper to create valid chapter input
  const createChapterInput = (chapterId: number = 1, sessionId: string = 'session_001') => ({
    chapterId,
    sessionId,
    title: `Chapter ${chapterId}: Test Title`,
    wordCount: 5000,
    gauntletScores: {
      argumentCoherence: 0.85,
      citationCompleteness: 0.78,
      styleConsistency: 0.90,
      factualAccuracy: 0.82,
      overall: 0.84,
    },
    gauntletPassed: true,
  });

  beforeEach(() => {
    // Ensure test directory exists
    const testDir = join(process.cwd(), 'tests', 'tmp');
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    // Remove existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    store = new SQLiteRatingStore(testDbPath);
  });

  afterEach(() => {
    store.close();

    // Clean up test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    it('should create database with correct schema', () => {
      expect(existsSync(testDbPath)).toBe(true);
    });

    it('should create factory function that returns store', () => {
      const factoryStore = createRatingStore(testDbPath + '.factory');
      expect(factoryStore).toBeInstanceOf(SQLiteRatingStore);
      factoryStore.close();
      unlinkSync(testDbPath + '.factory');
    });
  });

  describe('Rater Management', () => {
    it('should register a new rater', () => {
      const raterId = store.registerRater(createRaterInput());
      expect(raterId).toBeDefined();
      expect(typeof raterId).toBe('string');
      expect(raterId.length).toBeGreaterThan(0);
    });

    it('should retrieve registered rater', () => {
      const input = createRaterInput();
      const raterId = store.registerRater(input);

      const rater = store.getRater(raterId);
      expect(rater).not.toBeNull();
      expect(rater?.name).toBe(input.name);
      expect(rater?.email).toBe(input.email);
      expect(rater?.qualifications.highestDegree).toBe('PhD');
    });

    it('should return null for non-existent rater', () => {
      const rater = store.getRater('non_existent_id');
      expect(rater).toBeNull();
    });

    it('should list active raters', () => {
      store.registerRater(createRaterInput('rater1@test.com'));
      store.registerRater(createRaterInput('rater2@test.com'));

      const raters = store.listActiveRaters();
      expect(raters.length).toBe(2);
    });

    it('should not list inactive raters', () => {
      store.registerRater(createRaterInput('active@test.com'));
      store.registerRater({ ...createRaterInput('inactive@test.com'), isActive: false });

      const raters = store.listActiveRaters();
      expect(raters.length).toBe(1);
    });
  });

  describe('Chapter Management', () => {
    it('should add chapter for rating', () => {
      store.addChapterForRating(createChapterInput());

      const chapters = store.getChaptersForRating();
      expect(chapters.length).toBe(1);
      expect(chapters[0].chapterId).toBe(1);
    });

    it('should retrieve chapter with correct gauntlet scores', () => {
      const input = createChapterInput();
      store.addChapterForRating(input);

      const chapters = store.getChaptersForRating();
      expect(chapters[0].gauntletScores.argumentCoherence).toBe(input.gauntletScores.argumentCoherence);
      expect(chapters[0].gauntletScores.overall).toBe(input.gauntletScores.overall);
    });

    it('should filter chapters by rater (exclude already rated)', () => {
      const raterId = store.registerRater(createRaterInput());
      store.addChapterForRating(createChapterInput(1, 'session_001'));
      store.addChapterForRating(createChapterInput(2, 'session_001'));

      // Rate chapter 1
      store.storeRating(createValidSubmission({
        raterId,
        chapterId: 1,
        sessionId: 'session_001',
      }));

      // Should only return unrated chapter 2
      const chapters = store.getChaptersForRating(raterId);
      expect(chapters.length).toBe(1);
      expect(chapters[0].chapterId).toBe(2);
    });
  });

  describe('Rating Storage', () => {
    let defaultRaterId: string;

    beforeEach(() => {
      // Set up chapter and rater for rating tests
      defaultRaterId = store.registerRater(createRaterInput());
      store.addChapterForRating(createChapterInput());
    });

    it('should store a rating submission', () => {
      const submission = createValidSubmission({ raterId: defaultRaterId });
      const submissionId = store.storeRating(submission);

      expect(submissionId).toBeDefined();
      expect(typeof submissionId).toBe('string');
    });

    it('should retrieve ratings for a chapter', () => {
      const submission = createValidSubmission({ raterId: defaultRaterId });
      store.storeRating(submission);

      const ratings = store.getRatingsForChapter(1, 'session_001');
      expect(ratings.length).toBe(1);
      expect(ratings[0].ratings.argumentCoherence.score).toBe(4);
    });

    it('should retrieve ratings by rater', () => {
      const raterId = store.registerRater(createRaterInput('unique@test.com'));
      const submission = createValidSubmission({ raterId });
      store.storeRating(submission);

      const ratings = store.getRatingsByRater(raterId);
      expect(ratings.length).toBe(1);
      expect(ratings[0].chapterId).toBe(1);
    });

    it('should preserve all rating dimensions', () => {
      const submission = createValidSubmission({
        raterId: defaultRaterId,
        ratings: {
          argumentCoherence: { score: 5, confidence: 'high', notes: 'Excellent' },
          citationCompleteness: { score: 4, confidence: 'medium' },
          styleConsistency: { score: 3, confidence: 'low', notes: 'Needs work' },
          factualAccuracy: { score: 2, confidence: 'high' },
          overallQuality: { score: 4, wouldPublish: false, notes: 'Revisions needed' },
        },
      });
      store.storeRating(submission);

      const ratings = store.getRatingsForChapter(1, 'session_001');
      const retrieved = ratings[0];

      expect(retrieved.ratings.argumentCoherence.score).toBe(5);
      expect(retrieved.ratings.argumentCoherence.confidence).toBe('high');
      expect(retrieved.ratings.argumentCoherence.notes).toBe('Excellent');
      expect(retrieved.ratings.citationCompleteness.score).toBe(4);
      expect(retrieved.ratings.styleConsistency.notes).toBe('Needs work');
      expect(retrieved.ratings.overallQuality.wouldPublish).toBe(false);
    });

    it('should preserve metadata', () => {
      const submission = createValidSubmission({
        raterId: defaultRaterId,
        metadata: {
          timeSpentMinutes: 45,
          isRerating: true,
          technicalIssues: 'Page load slow',
          environment: 'Office',
        },
      });
      store.storeRating(submission);

      const ratings = store.getRatingsForChapter(1, 'session_001');
      const retrieved = ratings[0];

      expect(retrieved.metadata.timeSpentMinutes).toBe(45);
      expect(retrieved.metadata.isRerating).toBe(true);
      expect(retrieved.metadata.technicalIssues).toBe('Page load slow');
      expect(retrieved.metadata.environment).toBe('Office');
    });
  });

  describe('Calibration Pairs', () => {
    it('should generate calibration pairs for rated chapters', () => {
      // Add chapter with gauntlet scores
      store.addChapterForRating(createChapterInput());

      // Add rating
      const raterId = store.registerRater(createRaterInput());
      store.storeRating(createValidSubmission({ raterId }));

      const pairs = store.getCalibrationPairs();
      expect(pairs.length).toBe(1);
      expect(pairs[0].gauntletScores.argumentCoherence).toBe(0.85);
      expect(pairs[0].humanRatings.argumentCoherence).toBe(4);
      expect(pairs[0].raterCount).toBe(1);
    });

    it('should average ratings from multiple raters', () => {
      store.addChapterForRating(createChapterInput());

      // First rater
      const rater1 = store.registerRater(createRaterInput('rater1@test.com'));
      store.storeRating(createValidSubmission({
        raterId: rater1,
        ratings: {
          ...createValidRatings(),
          argumentCoherence: { score: 4, confidence: 'high' },
        },
      }));

      // Second rater
      const rater2 = store.registerRater(createRaterInput('rater2@test.com'));
      store.storeRating(createValidSubmission({
        raterId: rater2,
        ratings: {
          ...createValidRatings(),
          argumentCoherence: { score: 2, confidence: 'high' },
        },
      }));

      const pairs = store.getCalibrationPairs();
      expect(pairs.length).toBe(1);
      // Average of 4 and 2 = 3
      expect(pairs[0].humanRatings.argumentCoherence).toBe(3);
      expect(pairs[0].raterCount).toBe(2);
    });

    it('should include standard deviation for multiple raters', () => {
      store.addChapterForRating(createChapterInput());

      const rater1 = store.registerRater(createRaterInput('rater1@test.com'));
      store.storeRating(createValidSubmission({
        raterId: rater1,
        ratings: {
          ...createValidRatings(),
          overallQuality: { score: 5, wouldPublish: true },
        },
      }));

      const rater2 = store.registerRater(createRaterInput('rater2@test.com'));
      store.storeRating(createValidSubmission({
        raterId: rater2,
        ratings: {
          ...createValidRatings(),
          overallQuality: { score: 3, wouldPublish: false },
        },
      }));

      const pairs = store.getCalibrationPairs();
      // Should have non-zero std dev when scores differ
      expect(pairs[0].ratingStdDev.overall).toBeGreaterThan(0);
    });

    it('should return empty array when no rated chapters', () => {
      const pairs = store.getCalibrationPairs();
      expect(pairs).toEqual([]);
    });
  });

  describe('Inter-Rater Reliability', () => {
    it('should return zero metrics when no multi-rated chapters', () => {
      const metrics = store.getInterRaterReliability();

      expect(metrics.multiRatedChapters).toBe(0);
      expect(metrics.percentAgreement).toBe(0);
      expect(metrics.percentAgreementWithin1).toBe(0);
    });

    it('should calculate percent agreement for multi-rated chapters', () => {
      store.addChapterForRating(createChapterInput());

      const rater1 = store.registerRater(createRaterInput('rater1@test.com'));
      const rater2 = store.registerRater(createRaterInput('rater2@test.com'));

      // Same overall scores = 100% agreement
      store.storeRating(createValidSubmission({
        raterId: rater1,
        ratings: { ...createValidRatings(), overallQuality: { score: 4, wouldPublish: true } },
      }));
      store.storeRating(createValidSubmission({
        raterId: rater2,
        ratings: { ...createValidRatings(), overallQuality: { score: 4, wouldPublish: true } },
      }));

      const metrics = store.getInterRaterReliability();
      expect(metrics.multiRatedChapters).toBe(1);
      expect(metrics.percentAgreement).toBe(1); // Perfect agreement
    });

    it('should calculate within-1 agreement', () => {
      store.addChapterForRating(createChapterInput());

      const rater1 = store.registerRater(createRaterInput('rater1@test.com'));
      const rater2 = store.registerRater(createRaterInput('rater2@test.com'));

      // Scores differ by 1
      store.storeRating(createValidSubmission({
        raterId: rater1,
        ratings: { ...createValidRatings(), overallQuality: { score: 4, wouldPublish: true } },
      }));
      store.storeRating(createValidSubmission({
        raterId: rater2,
        ratings: { ...createValidRatings(), overallQuality: { score: 3, wouldPublish: false } },
      }));

      const metrics = store.getInterRaterReliability();
      expect(metrics.percentAgreement).toBe(0); // Not exact match
      expect(metrics.percentAgreementWithin1).toBe(1); // Within 1 point
    });
  });

  describe('Data Export', () => {
    it('should export all data for analysis', () => {
      // Set up data
      const raterId = store.registerRater(createRaterInput());
      store.addChapterForRating(createChapterInput());
      store.storeRating(createValidSubmission({ raterId }));

      const exported = store.exportForAnalysis();

      expect(exported.ratings.length).toBe(1);
      expect(exported.chapters.length).toBe(1);
      expect(exported.raters.length).toBe(1);
      expect(exported.pairs.length).toBe(1);
    });

    it('should include all chapter details in export', () => {
      store.addChapterForRating(createChapterInput());
      const exported = store.exportForAnalysis();

      expect(exported.chapters[0].title).toContain('Chapter 1');
      expect(exported.chapters[0].wordCount).toBe(5000);
      expect(exported.chapters[0].gauntletPassed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple chapters in same session', () => {
      store.addChapterForRating(createChapterInput(1, 'session_001'));
      store.addChapterForRating(createChapterInput(2, 'session_001'));
      store.addChapterForRating(createChapterInput(3, 'session_001'));

      const chapters = store.getChaptersForRating();
      expect(chapters.length).toBe(3);
    });

    it('should handle same chapter ID in different sessions', () => {
      store.addChapterForRating(createChapterInput(1, 'session_001'));
      store.addChapterForRating(createChapterInput(1, 'session_002'));

      const chapters = store.getChaptersForRating();
      expect(chapters.length).toBe(2);
    });

    it('should handle empty notes gracefully', () => {
      store.addChapterForRating(createChapterInput());
      const raterId = store.registerRater(createRaterInput());

      const submission = createValidSubmission({
        raterId,
        ratings: {
          argumentCoherence: { score: 4, confidence: 'high' }, // No notes
          citationCompleteness: { score: 3, confidence: 'medium' },
          styleConsistency: { score: 4, confidence: 'high' },
          factualAccuracy: { score: 5, confidence: 'high' },
          overallQuality: { score: 4, wouldPublish: true },
        },
      });

      store.storeRating(submission);
      const ratings = store.getRatingsForChapter(1, 'session_001');

      expect(ratings[0].ratings.argumentCoherence.notes).toBeUndefined();
    });
  });
});
