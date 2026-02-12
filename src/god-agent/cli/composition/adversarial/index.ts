/**
 * Adversarial Reviewer Module
 *
 * This module provides READ-ONLY adversarial reviewers that validate
 * structured intermediate representations (SIR) before prose generation.
 *
 * All reviewers are READ-ONLY - they detect issues but do not modify content.
 *
 * @module adversarial
 */

// Consistency Auditor
export {
  ConsistencyAuditor,
  type ConsistencyAuditResult,
  type ConsistencyIssue,
  type ConsistencyAuditMetadata
} from './consistency-auditor.js';

// Scope Police
export {
  ScopePoliceReviewer,
  type ScopeAuditResult,
  type ScopeIssue,
  type ScopeAnalysis,
  type ScopeAuditMetadata
} from './scope-police.js';

// Counter-Argument Tester
export {
  CounterArgumentTester,
  type CounterArgumentTestResult,
  type CounterArgumentIssue,
  type ObjectionAnalysis,
  type CounterArgumentTestMetadata
} from './counter-argument-tester.js';

// Citation Checker
export {
  CitationAdequacyChecker,
  type CitationCheckResult,
  type CitationIssue,
  type CitationAnalysis,
  type CitationCheckMetadata
} from './citation-checker.js';

// Adversarial Orchestrator
export {
  AdversarialOrchestrator,
  type AdversarialReviewResult,
  type AdversarialReviewMetadata,
  type AdversarialOrchestratorOptions
} from './adversarial-orchestrator.js';

/**
 * Module metadata
 */
export const ADVERSARIAL_MODULE_METADATA = {
  version: '1.0.0',
  phase: 2,
  description: 'READ-ONLY adversarial reviewers for SIR validation',
  reviewers: {
    consistency: {
      name: 'ConsistencyAuditor',
      purpose: 'Term drift detection',
      threshold: 0.85,
      detects: ['term-drift', 'definition-change', 'synonym-violation']
    },
    scope: {
      name: 'ScopePoliceReviewer',
      purpose: 'Overclaiming detection',
      threshold: 0.80,
      detects: ['overclaiming', 'unsupported-leap', 'missing-qualification']
    },
    counterArgument: {
      name: 'CounterArgumentTester',
      purpose: 'Objection generation and rebuttal testing',
      threshold: 0.75,
      detects: ['missing-rebuttal', 'weak-rebuttal', 'unaddressed-objection']
    },
    citation: {
      name: 'CitationAdequacyChecker',
      purpose: 'Citation validation',
      threshold: 0.85,
      detects: ['missing-citation', 'weak-citation', 'misframed-interpretation', 'unsupported-speculation']
    }
  },
  orchestrator: {
    name: 'AdversarialOrchestrator',
    purpose: 'Coordinate all reviewers',
    overallThreshold: 0.80,
    requiresMinPassingReviewers: 3
  }
};

/**
 * Feature flags for adversarial reviewers
 */
export const ADVERSARIAL_FEATURES = {
  consistencyAudit: true,          // ✅ Phase 2
  scopePolicing: true,             // ✅ Phase 2
  counterArgumentTesting: true,    // ✅ Phase 2
  citationChecking: true,          // ✅ Phase 2
  adversarialOrchestration: true   // ✅ Phase 2
};
