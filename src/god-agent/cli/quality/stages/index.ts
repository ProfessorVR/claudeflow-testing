/**
 * Quality Stage Implementations
 *
 * Exports all quality stage implementations for the multi-pass quality gauntlet.
 *
 * Stage Order (7 total):
 * 0. CitationVerifier - Hallucination detection (Phase B)
 * 1. ToulminEnforcer - Argument structure validation (Phase D)
 * 2. ArgumentCoherenceChecker - Logical flow
 * 3. CitationCompletenessVerifier - Missing citations
 * 4. CitationDensityChecker - PhD-level density
 * 5. StyleConsistencyValidator - Tone/voice
 * 6. FactualAccuracyAuditor - Internal consistency
 */

// Stage 0: Hallucination Detection (Phase B)
export {
  CitationVerifier,
  createDefaultVerifier,
  createStrictVerifier,
  createDraftVerifier,
  type CorpusVerificationResult,
  type ExtractedCitation,
  type CitationVerification,
  type CorpusSearchFn,
  type CitationVerifierConfig,
} from './citation-verifier.js';

// Stage 1: Toulmin Argument Enforcement (Phase D)
export {
  ToulminEnforcer,
  createDefaultToulminEnforcer,
  createStrictToulminEnforcer,
  createLenientToulminEnforcer,
  type ToulminEnforcerConfig,
  type ExtractedArgument,
  type ToulminMetrics,
} from './toulmin-enforcer.js';

// Stage 2-6: Existing stages
export { ArgumentCoherenceChecker } from './argument-coherence-checker.js';
export { CitationCompletenessVerifier } from './citation-completeness-verifier.js';
export { CitationDensityChecker } from './citation-density-checker.js';
export { StyleConsistencyValidator } from './style-consistency-validator.js';
export { FactualAccuracyAuditor } from './factual-accuracy-auditor.js';

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
} from './philosophical-coherence-checker.js';

// Stage 8: CCV Phase C Claim Verification
export {
  ClaimVerificationStage,
  createClaimVerificationStage,
  createStrictClaimVerificationStage,
  createDraftClaimVerificationStage,
  type ClaimVerificationStageConfig,
  type ClaimVerificationMetrics,
} from './claim-verification-stage.js';
