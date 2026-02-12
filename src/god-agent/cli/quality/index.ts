/**
 * Quality Module - Multi-Pass Quality Gauntlet for PhD Pipeline
 *
 * This module provides comprehensive quality assurance for dissertation chapters,
 * including iterative refinement until publication-ready quality is achieved.
 *
 * 7-Stage Quality Gauntlet:
 * 0. CitationVerifier (0.10) - Hallucination detection (Phase B)
 * 1. ToulminEnforcer (0.15) - Argument structure validation (Phase D)
 * 2. ArgumentCoherenceChecker (0.18) - Logical flow and argument structure
 * 3. CitationCompletenessVerifier (0.17) - Citation coverage and format
 * 4. CitationDensityChecker (0.12) - PhD-level citation density
 * 5. StyleConsistencyValidator (0.15) - Tone, style, consistency
 * 6. FactualAccuracyAuditor (0.13) - Internal consistency and accuracy
 *
 * Additional Components:
 * - QualityGauntlet: Orchestrates all 7 stages for comprehensive evaluation
 * - RevisionOrchestrator: Manages iterative refinement loop
 * - ProvenanceLedger: Tracks claim-source relationships
 * - DissertationStyleDriftDetector: Analyzes cross-chapter style consistency (PHASE-7-001)
 *
 * Usage:
 * ```typescript
 * import {
 *   QualityGauntlet,
 *   RevisionOrchestrator,
 *   ProvenanceLedger,
 *   createDefaultGauntlet,
 *   createDefaultOrchestrator,
 * } from './quality/index.js';
 *
 * // Create gauntlet and orchestrator
 * const gauntlet = createDefaultGauntlet();
 * const orchestrator = createDefaultOrchestrator(gauntlet);
 *
 * // Run quality evaluation
 * const result = await gauntlet.runGauntlet(chapterText, chapterId);
 *
 * // If revision needed, use orchestrator
 * if (result.revisionRequired) {
 *   const refinementResult = await orchestrator.refineUntilQuality(
 *     chapterText,
 *     chapterId,
 *     async (request) => {
 *       // Call writing agent with revision prompt
 *       return reviseWithAgent(request);
 *     }
 *   );
 * }
 *
 * // Track provenance
 * const ledger = new ProvenanceLedger();
 * ledger.addEntry({
 *   claimText: 'Studies show...',
 *   chapterId: 1,
 *   paragraphIndex: 5,
 *   sourceType: 'local_ku',
 *   sourceId: 'ku_001',
 *   sourceReference: 'Smith (2023)',
 *   confidence: 0.9,
 *   verified: false,
 * });
 * ```
 */

// ============================================================================
// Quality Stage Base Types
// ============================================================================

export {
  // Types
  type QualityIssue,
  type QualityIssueType,
  type QualityIssueSeverity,
  type IssueLocation,
  type QualityStageResult,
  type QualityStage,
  type QualityEvaluationContext,

  // Base class
  BaseQualityStage,

  // Helper functions
  sortIssuesBySeverity,
  filterIssuesBySeverity,
  filterIssuesByType,
  getAutoFixableIssues,
  countIssuesBySeverity,
} from './quality-stage.js';

// ============================================================================
// Enhanced Types with Location Tracking (Priority 2)
// ============================================================================

export {
  // Enhanced location types
  type IssueLocation as EnhancedIssueLocation,
  type EnhancedQualityIssue,
  type EnhancedQualityStageResult,
  type EnhancedQualityReport,
  type IssueLocationIndex,
  type ParagraphInfo,

  // Utility functions
  parseContentIntoParagraphs,
  findLocationForMatch,
  findAllMatchLocations,
  buildIssueLocationIndex,

  // Report generation
  generateLocationReport,
  generateLocationSummary,

  // Conversion utilities
  enhanceStageResult,
} from './enhanced-types.js';

// ============================================================================
// Quality Stage Implementations
// ============================================================================

export { ArgumentCoherenceChecker } from './stages/argument-coherence-checker.js';
export { CitationCompletenessVerifier } from './stages/citation-completeness-verifier.js';
export { StyleConsistencyValidator } from './stages/style-consistency-validator.js';
export { FactualAccuracyAuditor } from './stages/factual-accuracy-auditor.js';

// Philosophical coherence (extends ArgumentCoherenceChecker)
export {
  PhilosophicalCoherenceChecker,
  createDefaultPhilosophicalChecker,
  createStrictPhilosophicalChecker,
  createDraftPhilosophicalChecker,
  type TermDefinition,
  type PhenomenologicalVocabulary,
  type ArgumentThread,
  type PhilosophicalCoherenceConfig,
} from './stages/philosophical-coherence-checker.js';

// CCV Claim Verification Stage (Stage 8)
export {
  ClaimVerificationStage,
  createClaimVerificationStage,
  createStrictClaimVerificationStage,
  createDraftClaimVerificationStage,
  type ClaimVerificationStageConfig,
  type ClaimVerificationMetrics,
} from './stages/claim-verification-stage.js';

// ============================================================================
// Corpus Citation Connector (rhetorical_ontology integration)
// ============================================================================

export {
  CorpusCitationConnector,
  getCorpusCitationConnector,
  type CorpusChunk,
  type ChunkMetadata,
  type CitationVerificationResult,
  type CorpusSuggestion,
} from './corpus-citation-connector.js';

// ============================================================================
// Quality Gauntlet
// ============================================================================

export {
  QualityGauntlet,
  type GauntletResult,
  type GauntletConfig,

  // Factory functions
  createDefaultGauntlet,
  createStrictGauntlet,
  createDraftGauntlet,
  createFocusedGauntlet,

  // Enhanced reporting (Priority 2)
  generateEnhancedReport,
  runEnhancedGauntlet,
  formatEnhancedReport,
} from './quality-gauntlet.js';

// ============================================================================
// Revision Orchestrator (Phase F Enhancement)
// ============================================================================

/**
 * RevisionOrchestrator handles iterative refinement until quality thresholds are met.
 *
 * Phase F Enhancements:
 * - Toulmin-specific revision guidance generation
 * - Specialized guidance for warrant, backing, claim, grounds issues
 * - Multi-issue type specialized guidance (argument, citation, style, factual)
 * - Integration with 7-stage quality gauntlet
 * - Interactive review callbacks for human-in-the-loop refinement
 */
export {
  RevisionOrchestrator,
  type RevisionRequest,
  type RevisionResult,
  type RefinementResult,
  type RevisionOrchestratorConfig,
  // Interactive revision loop types (HIGH-IMPACT #3)
  type InteractiveReviewDecision,
  type InteractiveReviewContext,

  // Factory functions
  createDefaultOrchestrator,
  createStrictOrchestrator,
  createFastOrchestrator,
  createInteractiveOrchestrator,
} from './revision-orchestrator.js';

// ============================================================================
// Provenance Ledger
// ============================================================================

export {
  ProvenanceLedger,
  type ProvenanceEntry,
  type ProvenanceSourceType,
  type SourceUtilization,
  type ProvenanceValidation,
  type DetectedClaim,

  // Factory functions
  createProvenanceLedger,
  loadProvenanceLedger,
} from './provenance-ledger.js';

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Run a complete quality check on chapter text
 *
 * @param chapterText - Full text of the chapter
 * @param chapterId - Chapter number (1-indexed)
 * @param context - Optional evaluation context
 * @returns Gauntlet result with all quality metrics
 */
export async function checkChapterQuality(
  chapterText: string,
  chapterId: number,
  context?: QualityEvaluationContext
): Promise<GauntletResult> {
  const gauntlet = createDefaultGauntlet();
  return gauntlet.runGauntlet(chapterText, chapterId, context);
}

/**
 * Run quality check and refine until passing
 *
 * @param chapterText - Initial chapter text
 * @param chapterId - Chapter number
 * @param revisionCallback - Callback to perform revision
 * @param context - Optional evaluation context
 * @returns Refinement result with final text
 */
export async function refineChapterQuality(
  chapterText: string,
  chapterId: number,
  revisionCallback: (request: RevisionRequest) => Promise<string>,
  context?: QualityEvaluationContext
): Promise<RefinementResult> {
  const gauntlet = createDefaultGauntlet();
  const orchestrator = createDefaultOrchestrator(gauntlet);

  return orchestrator.refineUntilQuality(
    chapterText,
    chapterId,
    revisionCallback,
    context
  );
}

/**
 * Quick quality score without full gauntlet
 *
 * @param chapterText - Chapter text to evaluate
 * @param chapterId - Chapter number
 * @returns Simple quality score (0-1)
 */
export async function getQuickQualityScore(
  chapterText: string,
  chapterId: number
): Promise<number> {
  const gauntlet = createDraftGauntlet();
  const result = await gauntlet.runGauntlet(chapterText, chapterId);
  return result.overallScore;
}

// Import types for convenience function
import type { GauntletResult } from './quality-gauntlet.js';
import type { RefinementResult, RevisionRequest } from './revision-orchestrator.js';
import type { QualityEvaluationContext } from './quality-stage.js';
import { createDefaultGauntlet, createDraftGauntlet } from './quality-gauntlet.js';
import { createDefaultOrchestrator } from './revision-orchestrator.js';

// ============================================================================
// Dissertation Style Drift Detector (PHASE-7-001)
// ============================================================================

export {
  // Types
  type ChapterStyleFingerprint,
  type ChapterSimilarity,
  type OutlierChapter,
  type DriftTrend,
  type DissertationDriftAnalysis,
  type NewChapterDriftCheck,
  type DriftDetectorEvent,

  // Class
  DissertationStyleDriftDetector,

  // Factory function
  createDissertationStyleDriftDetector,

  // Formatting functions
  formatDriftAnalysis,
  formatNewChapterCheck,
} from './dissertation-style-drift-detector.js';

// ============================================================================
// Calibration Module (Human Rating Validation)
// ============================================================================

export {
  // Rating Protocol Types
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

  // Rating Protocol Constants
  RATING_ANCHORS,
  ARGUMENT_COHERENCE_CRITERIA,
  CITATION_COMPLETENESS_CRITERIA,
  STYLE_CONSISTENCY_CRITERIA,
  FACTUAL_ACCURACY_CRITERIA,

  // Rating Protocol Functions
  isValidRatingScore,
  validateRatingSubmission,
  meetsMinimumQualifications,
  humanToGauntletScale,
  gauntletToHumanScale,
  getRatingCriteria,
  calculateAverageScore,

  // Rating Store Types
  type CalibrationPair,
  type InterRaterMetrics,
  type ChapterForRating,
  type IRatingStore,

  // Rating Store Classes
  SQLiteRatingStore,
  createRatingStore,

  // Calibration Analyzer Types
  type CalibrationResult,
  type ThresholdAdjustment,
  type CalibrationReport,

  // Calibration Analyzer Classes
  CalibrationAnalyzer,
  createCalibrationAnalyzer,
} from './calibration/index.js';

// ============================================================================
// Endnote Generator (Supporting Quotations)
// ============================================================================

export {
  EndnoteGenerator,
  createEndnoteGenerator,
  generateEndnotes,
  type Endnote,
  type SupportingQuotation,
  type EndnoteGeneratorConfig,
  type EndnoteGenerationResult,
  type CorpusSearchFn,
  DEFAULT_ENDNOTE_CONFIG,
} from './endnote-generator.js';

// ============================================================================
// Source Verification Layer (Corpus Citation Verification)
// ============================================================================

export {
  SourceVerificationLayer,
  createSourceVerificationLayer,
  getSourceVerificationLayer,
  type ExtractedCitation,
  type SourceAvailability,
  type AcquisitionSuggestion,
  type SourceVerificationResult,
  type VerificationSummary,
} from './source-verification-layer.js';

// ============================================================================
// Missing Source Acquisition Layer
// ============================================================================

export {
  MissingSourceAcquisitionLayer,
  createMissingSourceAcquisitionLayer,
  getMissingSourceAcquisitionLayer,
  type AcquisitionResult,
  type AcquisitionConfig,
} from './missing-source-acquisition.js';

// ============================================================================
// Open Access Searcher
// ============================================================================

export {
  OpenAccessSearcher,
  createOpenAccessSearcher,
  getOpenAccessSearcher,
  type OpenAccessResult,
  type SearchConfig,
} from './open-access-searcher.js';

// ============================================================================
// Corpus Validator (Priority 1 - Mandatory Corpus Verification)
// ============================================================================

export {
  // Core validator
  CorpusValidator,
  corpusValidator,
  createCorpusValidator,

  // Types
  type CorpusSource,
  type CorpusValidationReport,
  type CitationValidationResult,
  type CitationLocation,
} from './corpus-validator.js';

// ============================================================================
// Corpus Integration (Quality Gauntlet Pre-Stage)
// ============================================================================

export {
  // Stage runner
  runCorpusValidationStage,
  runCorpusPreStage,

  // Types
  type CorpusValidationStageResult,
  type CorpusPreStageOptions,

  // Error class
  CorpusValidationError,

  // Utility functions
  hasCitations,
  getCitationCount,
  getAvailableCorpusSources,
  generateCorpusSummaryMarkdown,
  searchCorpusByAuthor,
  searchCorpusByTitle,
} from './corpus-integration.js';

// ============================================================================
// RQ Tracker (Priority 3 - Research Question Coverage Matrix)
// ============================================================================

export {
  // Core tracker
  RQTracker,
  rqTracker,

  // Types
  type ResearchQuestion,
  type RQAddress,
  type RQCoverage,
  type RQCoverageReport,
} from './rq-tracker.js';

// ============================================================================
// Continuity Checker (Priority 5 - Chapter Continuity Validation)
// ============================================================================

export {
  // Core checker
  ContinuityChecker,
  continuityChecker,

  // Types
  type ChapterDefinition,
  type ChapterReference,
  type ForwardPromise,
  type TermDefinition as ContinuityTermDefinition, // Aliased to avoid conflict with PhilosophicalCoherenceChecker.TermDefinition
  type ContinuityIssue,
  type ContinuityValidationResult,
} from './continuity-checker.js';
