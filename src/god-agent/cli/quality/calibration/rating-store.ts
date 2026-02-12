/**
 * Rating Store - SQLite-backed storage for human ratings
 *
 * Provides persistent storage for human ratings, enabling:
 * - Rating submission and retrieval
 * - Calibration pair generation (gauntlet + human)
 * - Inter-rater reliability calculation
 * - Export for statistical analysis
 *
 * Part of PHASE-1-002: Build Rating Collection Infrastructure
 * Implementation Plan Reference: phd-pipeline-implementation-plan.md
 */

import * as Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type {
  RatingSubmission,
  RaterProfile,
  HumanRatingDimensions,
  RatingSessionMetadata,
  RaterQualifications,
} from './rating-protocol.js';

// ============================================================================
// Calibration Pair Types
// ============================================================================

/**
 * Paired data for calibration analysis
 * Contains both gauntlet scores and human ratings for the same chapter
 */
export interface CalibrationPair {
  /** Chapter identifier */
  chapterId: number;

  /** Session the chapter belongs to */
  sessionId: string;

  /** Gauntlet scores (0-1 scale) */
  gauntletScores: {
    argumentCoherence: number;
    citationCompleteness: number;
    styleConsistency: number;
    factualAccuracy: number;
    overall: number;
  };

  /** Human ratings (1-5 scale, averaged across raters) */
  humanRatings: {
    argumentCoherence: number;
    citationCompleteness: number;
    styleConsistency: number;
    factualAccuracy: number;
    overall: number;
  };

  /** Number of raters who rated this chapter */
  raterCount: number;

  /** Standard deviation of ratings (for reliability assessment) */
  ratingStdDev: {
    argumentCoherence: number;
    citationCompleteness: number;
    styleConsistency: number;
    factualAccuracy: number;
    overall: number;
  };
}

/**
 * Inter-rater reliability metrics
 */
export interface InterRaterMetrics {
  /** Krippendorff's alpha (overall) */
  krippendorffAlpha: number;

  /** Intraclass Correlation Coefficient */
  icc: number;

  /** Cohen's kappa (pairwise average) */
  cohenKappa: number;

  /** Percentage agreement (exact match) */
  percentAgreement: number;

  /** Percentage agreement within 1 point */
  percentAgreementWithin1: number;

  /** Number of chapters with multiple raters */
  multiRatedChapters: number;

  /** Total ratings included in analysis */
  totalRatings: number;
}

/**
 * Chapter for rating (with gauntlet scores)
 */
export interface ChapterForRating {
  chapterId: number;
  sessionId: string;
  title: string;
  wordCount: number;
  gauntletScores: {
    argumentCoherence: number;
    citationCompleteness: number;
    styleConsistency: number;
    factualAccuracy: number;
    overall: number;
  };
  gauntletPassed: boolean;
  addedAt: string;
}

// ============================================================================
// Rating Store Interface
// ============================================================================

export interface IRatingStore {
  /** Store a new rating submission */
  storeRating(submission: RatingSubmission): string;

  /** Get all ratings for a chapter */
  getRatingsForChapter(chapterId: number, sessionId: string): RatingSubmission[];

  /** Get all ratings by a specific rater */
  getRatingsByRater(raterId: string): RatingSubmission[];

  /** Get paired data for calibration (gauntlet + human) */
  getCalibrationPairs(): CalibrationPair[];

  /** Calculate inter-rater reliability */
  getInterRaterReliability(): InterRaterMetrics;

  /** Register a new rater */
  registerRater(profile: Omit<RaterProfile, 'raterId' | 'totalRatingsCompleted'>): string;

  /** Get rater profile */
  getRater(raterId: string): RaterProfile | null;

  /** List all active raters */
  listActiveRaters(): RaterProfile[];

  /** Add a chapter for rating (with gauntlet scores) */
  addChapterForRating(chapter: Omit<ChapterForRating, 'addedAt'>): void;

  /** Get chapters available for rating */
  getChaptersForRating(raterId?: string): ChapterForRating[];

  /** Export all data for external analysis */
  exportForAnalysis(): {
    ratings: RatingSubmission[];
    chapters: ChapterForRating[];
    raters: RaterProfile[];
    pairs: CalibrationPair[];
  };

  /** Close the database connection */
  close(): void;
}

// ============================================================================
// SQLite Implementation
// ============================================================================

export class SQLiteRatingStore implements IRatingStore {
  private db: Database.Database;

  constructor(dbPath: string = '.god-agent/calibration.db') {
    this.db = new (Database as any).default(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      -- Raters table
      CREATE TABLE IF NOT EXISTS raters (
        rater_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        highest_degree TEXT NOT NULL,
        field_of_study TEXT NOT NULL,
        years_experience INTEGER NOT NULL,
        has_publications INTEGER NOT NULL,
        expertise_areas TEXT NOT NULL,
        onboarding_completed_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Chapters for rating table
      CREATE TABLE IF NOT EXISTS chapters_for_rating (
        chapter_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        gauntlet_argument_coherence REAL NOT NULL,
        gauntlet_citation_completeness REAL NOT NULL,
        gauntlet_style_consistency REAL NOT NULL,
        gauntlet_factual_accuracy REAL NOT NULL,
        gauntlet_overall REAL NOT NULL,
        gauntlet_passed INTEGER NOT NULL,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (chapter_id, session_id)
      );

      -- Ratings table
      CREATE TABLE IF NOT EXISTS ratings (
        submission_id TEXT PRIMARY KEY,
        rater_id TEXT NOT NULL,
        chapter_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        argument_coherence_score INTEGER NOT NULL,
        argument_coherence_confidence TEXT NOT NULL,
        argument_coherence_notes TEXT,
        citation_completeness_score INTEGER NOT NULL,
        citation_completeness_confidence TEXT NOT NULL,
        citation_completeness_notes TEXT,
        style_consistency_score INTEGER NOT NULL,
        style_consistency_confidence TEXT NOT NULL,
        style_consistency_notes TEXT,
        factual_accuracy_score INTEGER NOT NULL,
        factual_accuracy_confidence TEXT NOT NULL,
        factual_accuracy_notes TEXT,
        overall_score INTEGER NOT NULL,
        would_publish INTEGER NOT NULL,
        overall_notes TEXT,
        time_spent_minutes INTEGER NOT NULL,
        is_rerating INTEGER NOT NULL DEFAULT 0,
        technical_issues TEXT,
        environment TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (rater_id) REFERENCES raters(rater_id),
        FOREIGN KEY (chapter_id, session_id) REFERENCES chapters_for_rating(chapter_id, session_id)
      );

      -- Calibration scores (for rater onboarding)
      CREATE TABLE IF NOT EXISTS calibration_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rater_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        score REAL NOT NULL,
        completed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (rater_id) REFERENCES raters(rater_id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_ratings_chapter ON ratings(chapter_id, session_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
      CREATE INDEX IF NOT EXISTS idx_raters_active ON raters(is_active);
    `);
  }

  storeRating(submission: RatingSubmission): string {
    const submissionId = submission.submissionId || uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO ratings (
        submission_id, rater_id, chapter_id, session_id,
        argument_coherence_score, argument_coherence_confidence, argument_coherence_notes,
        citation_completeness_score, citation_completeness_confidence, citation_completeness_notes,
        style_consistency_score, style_consistency_confidence, style_consistency_notes,
        factual_accuracy_score, factual_accuracy_confidence, factual_accuracy_notes,
        overall_score, would_publish, overall_notes,
        time_spent_minutes, is_rerating, technical_issues, environment, timestamp
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      submissionId,
      submission.raterId,
      submission.chapterId,
      submission.sessionId,
      submission.ratings.argumentCoherence.score,
      submission.ratings.argumentCoherence.confidence,
      submission.ratings.argumentCoherence.notes || null,
      submission.ratings.citationCompleteness.score,
      submission.ratings.citationCompleteness.confidence,
      submission.ratings.citationCompleteness.notes || null,
      submission.ratings.styleConsistency.score,
      submission.ratings.styleConsistency.confidence,
      submission.ratings.styleConsistency.notes || null,
      submission.ratings.factualAccuracy.score,
      submission.ratings.factualAccuracy.confidence,
      submission.ratings.factualAccuracy.notes || null,
      submission.ratings.overallQuality.score,
      submission.ratings.overallQuality.wouldPublish ? 1 : 0,
      submission.ratings.overallQuality.notes || null,
      submission.metadata.timeSpentMinutes,
      submission.metadata.isRerating ? 1 : 0,
      submission.metadata.technicalIssues || null,
      submission.metadata.environment || null,
      submission.timestamp
    );

    // Update rater's total ratings count
    this.db.prepare(`
      UPDATE raters SET total_ratings_completed = total_ratings_completed + 1
      WHERE rater_id = ?
    `).run(submission.raterId);

    return submissionId;
  }

  getRatingsForChapter(chapterId: number, sessionId: string): RatingSubmission[] {
    const rows = this.db.prepare(`
      SELECT * FROM ratings
      WHERE chapter_id = ? AND session_id = ?
      ORDER BY timestamp DESC
    `).all(chapterId, sessionId) as any[];

    return rows.map(this.rowToRatingSubmission);
  }

  getRatingsByRater(raterId: string): RatingSubmission[] {
    const rows = this.db.prepare(`
      SELECT * FROM ratings
      WHERE rater_id = ?
      ORDER BY timestamp DESC
    `).all(raterId) as any[];

    return rows.map(this.rowToRatingSubmission);
  }

  getCalibrationPairs(): CalibrationPair[] {
    // Get all chapters with their gauntlet scores and human ratings
    const chapters = this.db.prepare(`
      SELECT
        c.chapter_id,
        c.session_id,
        c.gauntlet_argument_coherence,
        c.gauntlet_citation_completeness,
        c.gauntlet_style_consistency,
        c.gauntlet_factual_accuracy,
        c.gauntlet_overall,
        AVG(r.argument_coherence_score) as avg_argument_coherence,
        AVG(r.citation_completeness_score) as avg_citation_completeness,
        AVG(r.style_consistency_score) as avg_style_consistency,
        AVG(r.factual_accuracy_score) as avg_factual_accuracy,
        AVG(r.overall_score) as avg_overall,
        COUNT(r.submission_id) as rater_count,
        -- Standard deviations
        CASE WHEN COUNT(r.submission_id) > 1
          THEN SQRT(AVG(r.argument_coherence_score * r.argument_coherence_score) - AVG(r.argument_coherence_score) * AVG(r.argument_coherence_score))
          ELSE 0 END as std_argument_coherence,
        CASE WHEN COUNT(r.submission_id) > 1
          THEN SQRT(AVG(r.citation_completeness_score * r.citation_completeness_score) - AVG(r.citation_completeness_score) * AVG(r.citation_completeness_score))
          ELSE 0 END as std_citation_completeness,
        CASE WHEN COUNT(r.submission_id) > 1
          THEN SQRT(AVG(r.style_consistency_score * r.style_consistency_score) - AVG(r.style_consistency_score) * AVG(r.style_consistency_score))
          ELSE 0 END as std_style_consistency,
        CASE WHEN COUNT(r.submission_id) > 1
          THEN SQRT(AVG(r.factual_accuracy_score * r.factual_accuracy_score) - AVG(r.factual_accuracy_score) * AVG(r.factual_accuracy_score))
          ELSE 0 END as std_factual_accuracy,
        CASE WHEN COUNT(r.submission_id) > 1
          THEN SQRT(AVG(r.overall_score * r.overall_score) - AVG(r.overall_score) * AVG(r.overall_score))
          ELSE 0 END as std_overall
      FROM chapters_for_rating c
      INNER JOIN ratings r ON c.chapter_id = r.chapter_id AND c.session_id = r.session_id
      GROUP BY c.chapter_id, c.session_id
      HAVING COUNT(r.submission_id) >= 1
    `).all() as any[];

    return chapters.map(row => ({
      chapterId: row.chapter_id,
      sessionId: row.session_id,
      gauntletScores: {
        argumentCoherence: row.gauntlet_argument_coherence,
        citationCompleteness: row.gauntlet_citation_completeness,
        styleConsistency: row.gauntlet_style_consistency,
        factualAccuracy: row.gauntlet_factual_accuracy,
        overall: row.gauntlet_overall,
      },
      humanRatings: {
        argumentCoherence: row.avg_argument_coherence,
        citationCompleteness: row.avg_citation_completeness,
        styleConsistency: row.avg_style_consistency,
        factualAccuracy: row.avg_factual_accuracy,
        overall: row.avg_overall,
      },
      raterCount: row.rater_count,
      ratingStdDev: {
        argumentCoherence: row.std_argument_coherence || 0,
        citationCompleteness: row.std_citation_completeness || 0,
        styleConsistency: row.std_style_consistency || 0,
        factualAccuracy: row.std_factual_accuracy || 0,
        overall: row.std_overall || 0,
      },
    }));
  }

  getInterRaterReliability(): InterRaterMetrics {
    // Get all chapters with multiple raters
    const multiRated = this.db.prepare(`
      SELECT chapter_id, session_id, COUNT(*) as rater_count
      FROM ratings
      GROUP BY chapter_id, session_id
      HAVING COUNT(*) >= 2
    `).all() as any[];

    if (multiRated.length === 0) {
      return {
        krippendorffAlpha: 0,
        icc: 0,
        cohenKappa: 0,
        percentAgreement: 0,
        percentAgreementWithin1: 0,
        multiRatedChapters: 0,
        totalRatings: 0,
      };
    }

    // Calculate percent agreement
    let exactMatches = 0;
    let within1Matches = 0;
    let totalComparisons = 0;

    for (const chapter of multiRated) {
      const ratings = this.getRatingsForChapter(chapter.chapter_id, chapter.session_id);

      // Compare all pairs
      for (let i = 0; i < ratings.length; i++) {
        for (let j = i + 1; j < ratings.length; j++) {
          const r1 = ratings[i].ratings;
          const r2 = ratings[j].ratings;

          // Check overall score agreement
          if (r1.overallQuality.score === r2.overallQuality.score) {
            exactMatches++;
          }
          if (Math.abs(r1.overallQuality.score - r2.overallQuality.score) <= 1) {
            within1Matches++;
          }
          totalComparisons++;
        }
      }
    }

    const totalRatings = this.db.prepare('SELECT COUNT(*) as count FROM ratings').get() as any;

    // Note: Full Krippendorff's alpha and ICC calculations would require more complex stats
    // For now, we return simplified metrics
    return {
      krippendorffAlpha: 0, // TODO: Implement full calculation
      icc: 0, // TODO: Implement full calculation
      cohenKappa: 0, // TODO: Implement full calculation
      percentAgreement: totalComparisons > 0 ? exactMatches / totalComparisons : 0,
      percentAgreementWithin1: totalComparisons > 0 ? within1Matches / totalComparisons : 0,
      multiRatedChapters: multiRated.length,
      totalRatings: totalRatings.count,
    };
  }

  registerRater(profile: Omit<RaterProfile, 'raterId' | 'totalRatingsCompleted'>): string {
    const raterId = uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO raters (
        rater_id, name, email, highest_degree, field_of_study,
        years_experience, has_publications, expertise_areas,
        onboarding_completed_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      raterId,
      profile.name,
      profile.email,
      profile.qualifications.highestDegree,
      profile.qualifications.fieldOfStudy,
      profile.qualifications.yearsExperience,
      profile.qualifications.hasPublications ? 1 : 0,
      JSON.stringify(profile.qualifications.expertiseAreas),
      profile.onboardingCompletedAt || null,
      profile.isActive ? 1 : 0
    );

    // Add total_ratings_completed column if it doesn't exist
    try {
      this.db.exec('ALTER TABLE raters ADD COLUMN total_ratings_completed INTEGER DEFAULT 0');
    } catch {
      // Column already exists
    }

    return raterId;
  }

  getRater(raterId: string): RaterProfile | null {
    const row = this.db.prepare(`
      SELECT * FROM raters WHERE rater_id = ?
    `).get(raterId) as any;

    if (!row) return null;

    return this.rowToRaterProfile(row);
  }

  listActiveRaters(): RaterProfile[] {
    const rows = this.db.prepare(`
      SELECT * FROM raters WHERE is_active = 1
      ORDER BY name
    `).all() as any[];

    return rows.map(this.rowToRaterProfile);
  }

  addChapterForRating(chapter: Omit<ChapterForRating, 'addedAt'>): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapters_for_rating (
        chapter_id, session_id, title, word_count,
        gauntlet_argument_coherence, gauntlet_citation_completeness,
        gauntlet_style_consistency, gauntlet_factual_accuracy,
        gauntlet_overall, gauntlet_passed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      chapter.chapterId,
      chapter.sessionId,
      chapter.title,
      chapter.wordCount,
      chapter.gauntletScores.argumentCoherence,
      chapter.gauntletScores.citationCompleteness,
      chapter.gauntletScores.styleConsistency,
      chapter.gauntletScores.factualAccuracy,
      chapter.gauntletScores.overall,
      chapter.gauntletPassed ? 1 : 0
    );
  }

  getChaptersForRating(raterId?: string): ChapterForRating[] {
    let query = `
      SELECT c.* FROM chapters_for_rating c
    `;

    if (raterId) {
      // Exclude chapters already rated by this rater
      query += `
        WHERE NOT EXISTS (
          SELECT 1 FROM ratings r
          WHERE r.chapter_id = c.chapter_id
          AND r.session_id = c.session_id
          AND r.rater_id = ?
        )
      `;
    }

    query += ' ORDER BY c.added_at DESC';

    const rows = raterId
      ? (this.db.prepare(query).all(raterId) as any[])
      : (this.db.prepare(query).all() as any[]);

    return rows.map(row => ({
      chapterId: row.chapter_id,
      sessionId: row.session_id,
      title: row.title,
      wordCount: row.word_count,
      gauntletScores: {
        argumentCoherence: row.gauntlet_argument_coherence,
        citationCompleteness: row.gauntlet_citation_completeness,
        styleConsistency: row.gauntlet_style_consistency,
        factualAccuracy: row.gauntlet_factual_accuracy,
        overall: row.gauntlet_overall,
      },
      gauntletPassed: row.gauntlet_passed === 1,
      addedAt: row.added_at,
    }));
  }

  exportForAnalysis(): {
    ratings: RatingSubmission[];
    chapters: ChapterForRating[];
    raters: RaterProfile[];
    pairs: CalibrationPair[];
  } {
    const ratings = this.db.prepare('SELECT * FROM ratings').all() as any[];
    const chapters = this.db.prepare('SELECT * FROM chapters_for_rating').all() as any[];
    const raters = this.db.prepare('SELECT * FROM raters').all() as any[];

    return {
      ratings: ratings.map(this.rowToRatingSubmission),
      chapters: chapters.map(row => ({
        chapterId: row.chapter_id,
        sessionId: row.session_id,
        title: row.title,
        wordCount: row.word_count,
        gauntletScores: {
          argumentCoherence: row.gauntlet_argument_coherence,
          citationCompleteness: row.gauntlet_citation_completeness,
          styleConsistency: row.gauntlet_style_consistency,
          factualAccuracy: row.gauntlet_factual_accuracy,
          overall: row.gauntlet_overall,
        },
        gauntletPassed: row.gauntlet_passed === 1,
        addedAt: row.added_at,
      })),
      raters: raters.map(this.rowToRaterProfile),
      pairs: this.getCalibrationPairs(),
    };
  }

  close(): void {
    this.db.close();
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private rowToRatingSubmission = (row: any): RatingSubmission => ({
    submissionId: row.submission_id,
    raterId: row.rater_id,
    chapterId: row.chapter_id,
    sessionId: row.session_id,
    ratings: {
      argumentCoherence: {
        score: row.argument_coherence_score,
        confidence: row.argument_coherence_confidence,
        notes: row.argument_coherence_notes || undefined,
      },
      citationCompleteness: {
        score: row.citation_completeness_score,
        confidence: row.citation_completeness_confidence,
        notes: row.citation_completeness_notes || undefined,
      },
      styleConsistency: {
        score: row.style_consistency_score,
        confidence: row.style_consistency_confidence,
        notes: row.style_consistency_notes || undefined,
      },
      factualAccuracy: {
        score: row.factual_accuracy_score,
        confidence: row.factual_accuracy_confidence,
        notes: row.factual_accuracy_notes || undefined,
      },
      overallQuality: {
        score: row.overall_score,
        wouldPublish: row.would_publish === 1,
        notes: row.overall_notes || undefined,
      },
    },
    metadata: {
      timeSpentMinutes: row.time_spent_minutes,
      isRerating: row.is_rerating === 1,
      technicalIssues: row.technical_issues || undefined,
      environment: row.environment || undefined,
    },
    timestamp: row.timestamp,
  });

  private rowToRaterProfile = (row: any): RaterProfile => ({
    raterId: row.rater_id,
    name: row.name,
    email: row.email,
    qualifications: {
      highestDegree: row.highest_degree,
      fieldOfStudy: row.field_of_study,
      yearsExperience: row.years_experience,
      hasPublications: row.has_publications === 1,
      expertiseAreas: JSON.parse(row.expertise_areas || '[]'),
    },
    onboardingCompletedAt: row.onboarding_completed_at || undefined,
    isActive: row.is_active === 1,
    totalRatingsCompleted: row.total_ratings_completed || 0,
  });
}

// Export default instance factory
export function createRatingStore(dbPath?: string): IRatingStore {
  return new SQLiteRatingStore(dbPath);
}
