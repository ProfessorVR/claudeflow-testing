/**
 * Calibration Module - Human Rating Calibration for Quality Gauntlet
 *
 * This module provides infrastructure for calibrating the Quality Gauntlet's
 * automated scores against expert human ratings. The calibration process
 * validates that gauntlet scores correlate with human judgment and provides
 * coefficients for score adjustment.
 *
 * Key Components:
 * - rating-protocol.ts: Rating dimensions, scales, and validation
 * - rating-store.ts: SQLite-backed storage for ratings
 * - calibration-analyzer.ts: Statistical analysis and calibration
 *
 * Implementation Plan Reference: phd-pipeline-implementation-plan.md
 * Phase: PHASE-1 (Human Calibration Study)
 */

// Export rating protocol types and utilities
export {
  // Types
  type RatingScore,
  type RatingConfidence,
  type ArgumentCoherenceRating,
  type CitationCompletenessRating,
  type StyleConsistencyRating,
  type FactualAccuracyRating,
  type OverallQualityRating,
  type HumanRatingDimensions,
  type RatingSessionMetadata,
  type RatingSubmission,
  type RaterQualifications,
  type RaterProfile,

  // Constants
  RATING_ANCHORS,
  ARGUMENT_COHERENCE_CRITERIA,
  CITATION_COMPLETENESS_CRITERIA,
  STYLE_CONSISTENCY_CRITERIA,
  FACTUAL_ACCURACY_CRITERIA,

  // Validation functions
  isValidRatingScore,
  validateRatingSubmission,
  meetsMinimumQualifications,

  // Utility functions
  humanToGauntletScale,
  gauntletToHumanScale,
  getRatingCriteria,
  calculateAverageScore,
} from './rating-protocol.js';

// Export rating store types and classes
export {
  // Types
  type CalibrationPair,
  type InterRaterMetrics,
  type ChapterForRating,
  type IRatingStore,

  // Classes
  SQLiteRatingStore,

  // Factory
  createRatingStore,
} from './rating-store.js';

// Export calibration analyzer types and classes
export {
  // Types
  type CalibrationResult,
  type ThresholdAdjustment,
  type CalibrationReport,

  // Classes
  CalibrationAnalyzer,

  // Factory
  createCalibrationAnalyzer,
} from './calibration-analyzer.js';
