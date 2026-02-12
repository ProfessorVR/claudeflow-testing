/**
 * Dissertation Module Index
 *
 * Exports all dissertation-specific features for the PhD Pipeline:
 * - Progress tracking with milestones and chapter management
 * - Committee simulation for defense preparation
 * - Defense preparation materials generation
 * - Institutional compliance validation
 */

// ============================================================================
// Progress Tracker
// ============================================================================

export {
  DissertationProgressTracker,
  type DissertationMilestone,
  type DissertationProgress,
  type DissertationConfig,
  type MilestoneType,
  type MilestoneStatus,
  type ChapterStatus,
  type ChapterInfo
} from './progress-tracker.js';

// ============================================================================
// Committee Simulator
// ============================================================================

export {
  CommitteeSimulator,
  type CommitteeMember,
  type CommitteeQuestion,
  type CommitteeReview,
  type CommitteeRole,
  type QuestionStyle,
  type QuestionCategory,
  type QuestionDifficulty,
  type ReviewAssessment,
  type MemberFeedback
} from './committee-simulator.js';

// ============================================================================
// Defense Preparation
// ============================================================================

export {
  DefensePreparationGenerator,
  exportDefensePreparation,
  type DefensePreparation,
  type DefenseConfig,
  type Slide,
  type SlideDeck,
  type QuestionResponseStrategy,
  type ResponseStrategy
} from './defense-preparation.js';

// ============================================================================
// Institutional Compliance
// ============================================================================

export {
  InstitutionalComplianceChecker,
  createComplianceChecker,
  createCustomComplianceChecker,
  INSTITUTION_TEMPLATES,
  type InstitutionalRequirements,
  type FormattingRequirements,
  type StructureRequirements,
  type LimitRequirements,
  type MarginConfig,
  type ComplianceReport,
  type ComplianceIssue,
  type ChecklistItem,
  type UpcomingDeadline,
  type DegreeType,
  type CitationStyle,
  type PageNumberPosition,
  type IssueType,
  type IssueSeverity,
  type ChecklistStatus
} from './institutional-compliance.js';

// ============================================================================
// Section Orchestrator (HIGH-IMPACT #2 from improvement proposal)
// ============================================================================

export {
  SectionOrchestrator,
  type SectionCompletionConfig,
  type SectionContext,
  type SectionCompletionResult,
} from './section-orchestrator.js';

// ============================================================================
// Error Recovery (NEW from god-write integration)
// ============================================================================

export {
  ErrorRecoveryManager,
  createErrorRecoveryManager,
  createAggressiveRecoveryManager,
  createConservativeRecoveryManager,
  type SectionCheckpoint,
  type ErrorRecord,
  type RecoveryOptions,
} from './error-recovery.js';

// ============================================================================
// Dissertation Routing (LOWER-PRIORITY from improvement proposal)
// ============================================================================

export {
  DissertationRouter,
  DissertationTaskType,
  DISSERTATION_TO_BASE_TASK,
  DEFAULT_DISSERTATION_ROUTING_RULES,
  DEFAULT_DISSERTATION_ROUTING_CONFIG,
  createDissertationRouter,
  createStrictDissertationRouter,
  createDraftDissertationRouter,
  type DissertationRoutingRule,
  type DissertationRoutingConfig,
  type DissertationComplexity,
  type DissertationRisk,
} from './dissertation-routing.js';

// ============================================================================
// Dissertation Learning Session (LOWER-PRIORITY from improvement proposal)
// ============================================================================

export {
  DissertationLearningSession,
  createDissertationLearningSession,
  createStrictLearningSession,
  createDraftLearningSession,
  type DissertationLearningSessionConfig,
  type ChapterState,
  type SectionState,
  type SessionMetrics,
  type SessionEvent,
  type SessionPersistence,
} from './dissertation-learning-session.js';

// ============================================================================
// Dissertation Corpus Manager (in_progress/finalized folder management)
// ============================================================================

export {
  DissertationCorpusManager,
  getDissertationCorpusManager,
  createDissertationCorpusManager,
  DEFAULT_CORPUS_CONFIG,
  type SectionStatus,
  type ContentType,
  type DissertationContentMetadata,
  type FinalizationCheckResult,
  type DissertationCorpusConfig,
  type CorpusStats,
  type MoveResult,
} from './dissertation-corpus-manager.js';

// ============================================================================
// Convenience Factory Functions
// ============================================================================

import { DissertationProgressTracker } from './progress-tracker.js';
import { CommitteeSimulator } from './committee-simulator.js';
import { DefensePreparationGenerator } from './defense-preparation.js';
import { InstitutionalComplianceChecker } from './institutional-compliance.js';
import { DissertationCorpusManager as CorpusManager } from './dissertation-corpus-manager.js';

/**
 * Create a complete dissertation management suite for a session
 * @param sessionId - Pipeline session ID
 * @param baseDir - Base directory for storage
 */
export function createDissertationSuite(
  sessionId?: string,
  baseDir?: string
): {
  progressTracker: DissertationProgressTracker;
  committeeSimulator: CommitteeSimulator;
  defensePrep: DefensePreparationGenerator;
  corpusManager: CorpusManager;
} {
  const progressTracker = new DissertationProgressTracker(sessionId, baseDir);
  const committeeSimulator = new CommitteeSimulator();
  const defensePrep = new DefensePreparationGenerator(committeeSimulator);
  const corpusManager = new CorpusManager(baseDir);

  return {
    progressTracker,
    committeeSimulator,
    defensePrep,
    corpusManager
  };
}

/**
 * Create a complete dissertation management suite with compliance checking
 * @param sessionId - Pipeline session ID
 * @param institutionName - Institution template name
 * @param baseDir - Base directory for storage
 */
export function createDissertationSuiteWithCompliance(
  sessionId?: string,
  institutionName: string = 'generic-us-doctoral',
  baseDir?: string
): {
  progressTracker: DissertationProgressTracker;
  committeeSimulator: CommitteeSimulator;
  defensePrep: DefensePreparationGenerator;
  complianceChecker: InstitutionalComplianceChecker;
  corpusManager: CorpusManager;
} {
  const suite = createDissertationSuite(sessionId, baseDir);
  const requirements = InstitutionalComplianceChecker.loadInstitution(institutionName);
  const complianceChecker = new InstitutionalComplianceChecker(requirements);

  return {
    ...suite,
    complianceChecker
  };
}

// ============================================================================
// Default Export
// ============================================================================

import { SectionOrchestrator } from './section-orchestrator.js';
import { DissertationRouter, createDissertationRouter } from './dissertation-routing.js';
import { DissertationLearningSession, createDissertationLearningSession } from './dissertation-learning-session.js';
import { DissertationCorpusManager, getDissertationCorpusManager, createDissertationCorpusManager } from './dissertation-corpus-manager.js';

export default {
  DissertationProgressTracker,
  CommitteeSimulator,
  DefensePreparationGenerator,
  InstitutionalComplianceChecker,
  SectionOrchestrator,
  DissertationRouter,
  DissertationLearningSession,
  DissertationCorpusManager,
  createDissertationSuite,
  createDissertationSuiteWithCompliance,
  createDissertationRouter,
  createDissertationLearningSession,
  getDissertationCorpusManager,
  createDissertationCorpusManager,
};
