/**
 * Human Rating Protocol for Quality Gauntlet Calibration
 *
 * This module defines the rating dimensions, scales, and protocols
 * for human raters to evaluate PhD chapter quality. The dimensions
 * directly map to the Quality Gauntlet stages to enable correlation
 * analysis and calibration.
 *
 * Part of PHASE-1-001: Design Human Rating Protocol
 * Implementation Plan Reference: phd-pipeline-implementation-plan.md
 */

// ============================================================================
// Rating Scale Definitions
// ============================================================================

/**
 * Standard 5-point Likert scale for all rating dimensions
 */
export type RatingScore = 1 | 2 | 3 | 4 | 5;

/**
 * Confidence level for a rating
 */
export type RatingConfidence = 'low' | 'medium' | 'high';

/**
 * Anchor text definitions for the 5-point scale
 */
export const RATING_ANCHORS: Record<RatingScore, string> = {
  1: 'Very Poor - Significant issues, needs complete rewrite',
  2: 'Poor - Major issues, substantial revision needed',
  3: 'Acceptable - Some issues, minor revisions needed',
  4: 'Good - Few issues, meets academic standards',
  5: 'Excellent - No significant issues, publication ready',
};

// ============================================================================
// Dimension-Specific Rating Criteria
// ============================================================================

/**
 * Argument Coherence Rating
 * Maps to: ArgumentCoherenceChecker stage in quality gauntlet
 */
export interface ArgumentCoherenceRating {
  /** Overall score for argument coherence (1-5) */
  score: RatingScore;

  /** Rater's confidence in this assessment */
  confidence: RatingConfidence;

  /** Optional notes explaining the rating */
  notes?: string;
}

/**
 * Detailed criteria for Argument Coherence scores
 */
export const ARGUMENT_COHERENCE_CRITERIA: Record<RatingScore, string[]> = {
  1: [
    'No clear thesis or central argument',
    'Claims unsupported by evidence',
    'Logical fallacies throughout',
    'No coherent structure',
  ],
  2: [
    'Weak or unclear thesis',
    'Some claims lack support',
    'Several logical gaps',
    'Structure difficult to follow',
  ],
  3: [
    'Thesis present but could be stronger',
    'Most claims have some support',
    'Minor logical issues',
    'Structure generally clear',
  ],
  4: [
    'Clear, well-articulated thesis',
    'Claims well-supported with evidence',
    'Sound logical reasoning',
    'Clear, effective structure',
  ],
  5: [
    'Compelling, nuanced thesis',
    'All claims strongly supported',
    'Flawless logical flow',
    'Exemplary structure and organization',
  ],
};

/**
 * Citation Completeness Rating
 * Maps to: CitationCompletenessVerifier stage in quality gauntlet
 */
export interface CitationCompletenessRating {
  /** Overall score for citation completeness (1-5) */
  score: RatingScore;

  /** Rater's confidence in this assessment */
  confidence: RatingConfidence;

  /** Optional notes explaining the rating */
  notes?: string;
}

/**
 * Detailed criteria for Citation Completeness scores
 */
export const CITATION_COMPLETENESS_CRITERIA: Record<RatingScore, string[]> = {
  1: [
    'Missing citations for major claims',
    'Frequent uncited quotations',
    'Incorrect citation format',
    'No reference list or severely incomplete',
  ],
  2: [
    'Several uncited claims',
    'Some formatting inconsistencies',
    'Reference list has gaps',
    'Citation-reference mismatches',
  ],
  3: [
    'Most claims properly cited',
    'Minor formatting issues',
    'Reference list mostly complete',
    'Few citation gaps',
  ],
  4: [
    'All significant claims cited',
    'Consistent citation format',
    'Complete reference list',
    'Appropriate source diversity',
  ],
  5: [
    'Exemplary citation practices',
    'Perfect formatting throughout',
    'Comprehensive, high-quality sources',
    'Excellent source integration',
  ],
};

/**
 * Style Consistency Rating
 * Maps to: StyleConsistencyValidator stage in quality gauntlet
 */
export interface StyleConsistencyRating {
  /** Overall score for style consistency (1-5) */
  score: RatingScore;

  /** Rater's confidence in this assessment */
  confidence: RatingConfidence;

  /** Optional notes explaining the rating */
  notes?: string;
}

/**
 * Detailed criteria for Style Consistency scores
 */
export const STYLE_CONSISTENCY_CRITERIA: Record<RatingScore, string[]> = {
  1: [
    'Wildly inconsistent tone/voice',
    'Inappropriate academic register',
    'Frequent style shifts',
    'Does not sound like the author',
  ],
  2: [
    'Noticeable tone inconsistencies',
    'Some informal language',
    'Occasional style shifts',
    'Partially matches author voice',
  ],
  3: [
    'Generally consistent tone',
    'Appropriate academic style',
    'Minor inconsistencies',
    'Reasonably matches author voice',
  ],
  4: [
    'Consistent, professional tone',
    'Strong academic style',
    'Rare inconsistencies',
    'Clearly matches author voice',
  ],
  5: [
    'Perfectly consistent voice',
    'Exemplary academic style',
    'Seamless throughout',
    'Indistinguishable from author',
  ],
};

/**
 * Factual Accuracy Rating
 * Maps to: FactualAccuracyAuditor stage in quality gauntlet
 */
export interface FactualAccuracyRating {
  /** Overall score for factual accuracy (1-5) */
  score: RatingScore;

  /** Rater's confidence in this assessment */
  confidence: RatingConfidence;

  /** Optional notes explaining the rating */
  notes?: string;
}

/**
 * Detailed criteria for Factual Accuracy scores
 */
export const FACTUAL_ACCURACY_CRITERIA: Record<RatingScore, string[]> = {
  1: [
    'Multiple factual errors',
    'Misrepresented sources',
    'Contradictory statements',
    'Unverifiable claims presented as fact',
  ],
  2: [
    'Several factual inaccuracies',
    'Some source misrepresentation',
    'Minor contradictions',
    'Some unverifiable claims',
  ],
  3: [
    'Few factual issues',
    'Sources generally represented well',
    'No major contradictions',
    'Most claims verifiable',
  ],
  4: [
    'Factually accurate throughout',
    'Sources accurately represented',
    'Internally consistent',
    'All claims verifiable',
  ],
  5: [
    'Impeccable factual accuracy',
    'Perfect source representation',
    'Completely consistent',
    'Thoroughly verifiable',
  ],
};

/**
 * Overall Quality Rating
 * Holistic assessment across all dimensions
 */
export interface OverallQualityRating {
  /** Overall quality score (1-5) */
  score: RatingScore;

  /** Would you recommend this chapter for publication? */
  wouldPublish: boolean;

  /** Optional notes explaining the overall assessment */
  notes?: string;
}

// ============================================================================
// Complete Rating Submission Types
// ============================================================================

/**
 * Complete set of human rating dimensions for a chapter
 * Maps 1:1 to Quality Gauntlet stages for calibration
 */
export interface HumanRatingDimensions {
  /** Argument coherence: logical flow, claim support, warrant strength */
  argumentCoherence: ArgumentCoherenceRating;

  /** Citation completeness: source coverage, attribution accuracy */
  citationCompleteness: CitationCompletenessRating;

  /** Style consistency: tone, formality, voice alignment */
  styleConsistency: StyleConsistencyRating;

  /** Factual accuracy: correctness, consistency, verifiability */
  factualAccuracy: FactualAccuracyRating;

  /** Overall quality assessment */
  overallQuality: OverallQualityRating;
}

/**
 * Metadata about the rating session
 */
export interface RatingSessionMetadata {
  /** Time spent on this rating (minutes) */
  timeSpentMinutes: number;

  /** Was this a re-rating of a previously rated chapter? */
  isRerating: boolean;

  /** Any technical difficulties during rating */
  technicalIssues?: string;

  /** Rating environment (office, home, etc.) */
  environment?: string;
}

/**
 * Complete rating submission from a human rater
 */
export interface RatingSubmission {
  /** Unique ID for this submission */
  submissionId: string;

  /** ID of the rater who submitted this rating */
  raterId: string;

  /** Chapter number being rated (1-7) */
  chapterId: number;

  /** Session ID the chapter belongs to */
  sessionId: string;

  /** Complete ratings across all dimensions */
  ratings: HumanRatingDimensions;

  /** Session metadata */
  metadata: RatingSessionMetadata;

  /** When the rating was submitted */
  timestamp: string;
}

// ============================================================================
// Rater Information Types
// ============================================================================

/**
 * Qualifications required for expert raters
 */
export interface RaterQualifications {
  /** Highest degree held */
  highestDegree: 'PhD' | 'ABD' | 'Masters' | 'Other';

  /** Field of study */
  fieldOfStudy: string;

  /** Years of experience in academic writing evaluation */
  yearsExperience: number;

  /** Has published peer-reviewed work */
  hasPublications: boolean;

  /** Specific areas of expertise */
  expertiseAreas: string[];
}

/**
 * Registered rater profile
 */
export interface RaterProfile {
  /** Unique rater ID */
  raterId: string;

  /** Rater's name (for internal tracking) */
  name: string;

  /** Email for communication */
  email: string;

  /** Qualifications */
  qualifications: RaterQualifications;

  /** Date onboarding was completed */
  onboardingCompletedAt?: string;

  /** Calibration exercise scores */
  calibrationScores?: {
    exerciseId: string;
    score: number;
    completedAt: string;
  }[];

  /** Is this rater currently active */
  isActive: boolean;

  /** Total ratings completed */
  totalRatingsCompleted: number;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate that a rating score is within valid range
 */
export function isValidRatingScore(score: number): score is RatingScore {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

/**
 * Validate that all required fields in a rating submission are present
 */
export function validateRatingSubmission(submission: Partial<RatingSubmission>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!submission.raterId) {
    errors.push('raterId is required');
  }

  if (!submission.chapterId || submission.chapterId < 1 || submission.chapterId > 7) {
    errors.push('chapterId must be between 1 and 7');
  }

  if (!submission.sessionId) {
    errors.push('sessionId is required');
  }

  if (!submission.ratings) {
    errors.push('ratings are required');
  } else {
    // Validate each dimension
    const dimensions = ['argumentCoherence', 'citationCompleteness', 'styleConsistency', 'factualAccuracy', 'overallQuality'] as const;

    for (const dim of dimensions) {
      const rating = submission.ratings[dim];
      if (!rating) {
        errors.push(`${dim} rating is required`);
      } else if (!isValidRatingScore(rating.score)) {
        errors.push(`${dim} score must be between 1 and 5`);
      }
    }
  }

  if (!submission.metadata?.timeSpentMinutes || submission.metadata.timeSpentMinutes < 1) {
    errors.push('timeSpentMinutes must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a rater meets minimum qualifications
 */
export function meetsMinimumQualifications(qualifications: RaterQualifications): {
  meets: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Must have PhD or be ABD
  if (qualifications.highestDegree !== 'PhD' && qualifications.highestDegree !== 'ABD') {
    issues.push('Rater must hold a PhD or be ABD');
  }

  // Must have at least 3 years experience
  if (qualifications.yearsExperience < 3) {
    issues.push('Rater must have at least 3 years of academic writing evaluation experience');
  }

  return {
    meets: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a human rating (1-5) to gauntlet scale (0-1)
 */
export function humanToGauntletScale(humanScore: RatingScore): number {
  // Map 1-5 to 0-1: (score - 1) / 4
  return (humanScore - 1) / 4;
}

/**
 * Convert a gauntlet score (0-1) to human scale (1-5)
 */
export function gauntletToHumanScale(gauntletScore: number): number {
  // Map 0-1 to 1-5: score * 4 + 1
  return gauntletScore * 4 + 1;
}

/**
 * Get the criteria text for a specific dimension and score
 */
export function getRatingCriteria(
  dimension: 'argumentCoherence' | 'citationCompleteness' | 'styleConsistency' | 'factualAccuracy',
  score: RatingScore
): string[] {
  const criteriaMap = {
    argumentCoherence: ARGUMENT_COHERENCE_CRITERIA,
    citationCompleteness: CITATION_COMPLETENESS_CRITERIA,
    styleConsistency: STYLE_CONSISTENCY_CRITERIA,
    factualAccuracy: FACTUAL_ACCURACY_CRITERIA,
  };

  return criteriaMap[dimension][score];
}

/**
 * Calculate average score across all dimensions (excluding overall)
 */
export function calculateAverageScore(ratings: HumanRatingDimensions): number {
  const scores = [
    ratings.argumentCoherence.score,
    ratings.citationCompleteness.score,
    ratings.styleConsistency.score,
    ratings.factualAccuracy.score,
  ];

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export default {
  RATING_ANCHORS,
  ARGUMENT_COHERENCE_CRITERIA,
  CITATION_COMPLETENESS_CRITERIA,
  STYLE_CONSISTENCY_CRITERIA,
  FACTUAL_ACCURACY_CRITERIA,
  isValidRatingScore,
  validateRatingSubmission,
  meetsMinimumQualifications,
  humanToGauntletScale,
  gauntletToHumanScale,
  getRatingCriteria,
  calculateAverageScore,
};
