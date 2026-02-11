/**
 * Writing Generation Module (SPEC-WRT-001)
 *
 * LLM-based writing generation with style profile support.
 * Includes hallucination prevention system (Phases 1-5).
 */

export type {
  IWriteRequest,
  IWriteResult,
  IWritingGenerator,
  CorpusSource,
  CorpusConstraint,
} from './writing-generator.js';

export { AnthropicWritingGenerator } from './anthropic-writing-generator.js';

// Phase 1: Corpus constraint builder for hallucination prevention
export {
  buildCorpusConstraint,
  loadCorpusManifest,
  validateCitation,
  type ContextChunk,
  type ContextChunk as CorpusContextChunk, // Deprecated alias
  type CorpusConstraintOptions,
  type LoadManifestOptions,
} from './corpus-constraint-builder.js';

// Phase 2: Pre-generation citation validation
export {
  CitationValidator,
  createValidatorFromChunks,
  type ExtractedCitation,
  type CitationValidation,
  type ValidationResult,
  type ValidationOptions,
} from './citation-validator.js';

// Phase 4: Active citation enforcement
export {
  CitationEnforcer,
  createEnforcerFromChunks,
  type EnforcementAction,
  type EnforcementResult,
  type EnforcementConfig,
} from './citation-enforcer.js';

// Phase 5: Citation budget system
export {
  calculateCitationBudget,
  calculateBudgetFromSources,
  suggestWordCount,
  assessContentLength,
  quickBudgetCheck,
  type CitationBudgetResult,
  type CitationBudgetOptions,
  type BudgetCheckResult,
} from './citation-budget.js';

// Phase 7: Quotation fidelity validation (verbatim checking)
export {
  QuotationFidelityValidator,
  type ExtractedQuotation,
  type QuotationFidelityResult,
  type QuotationFidelityValidationResult,
  type QuotationFidelityOptions,
  type FidelityMatchType,
} from './quotation-fidelity-validator.js';

// Phase 7b: Translation detection (translation mismatch checking)
export {
  detectTranslationMismatch,
  getTranslationVariations,
  getOriginalTerm,
  areTranslationEquivalents,
  TRANSLATION_MARKERS,
  type TranslationMismatch,
} from './translation-detector.js';


// Phase 8: Claim grounding validation (paraphrase verification)
export {
  ClaimGroundingValidator,
  type ExtractedClaim,
  type ClaimGroundingResult,
  type ClaimGroundingValidationResult,
  type ClaimGroundingOptions,
} from './claim-grounding-validator.js';

// =============================================================================
// Phase 9: Multi-Axis Claim Classification System
// =============================================================================

// Core type definitions for multi-axis claim profiles
export {
  type ClaimProfile,
  type AttributionAxis,
  type AssertionAxis,
  type StructureAxis,
  type ModalityAxis,
  type EpistemicForceAxis,
  type AxisConfidenceScores,
  type ComposedValidationRequirements,
  type RiskLevel,
  type PartialClaimProfile,
  AttributionType,
  AttributionQualifier,
  AssertionType,
  RelationType,
  StructureType,
  LogicalConnective,
  InferenceType,
  ModalityType,
  HedgeMarker,
  EpistemicForceType,
  createDefaultProfile,
  mergeWithDefaults,
} from './claim-profile.js';

// Multi-axis claim classifier
export {
  MultiAxisClaimClassifier,
  AttributionAxisClassifier,
  AssertionAxisClassifier,
  StructureAxisClassifier,
  ModalityAxisClassifier,
  EpistemicForceAxisClassifier,
  type ClassificationContext,
  type ClassifierOptions,
} from './claim-classifier.js';

// Compositional validation rule engine
export {
  ValidationRuleEngine,
  computeRiskLevel,
  generateSuggestions,
  type ValidationRule,
  type RuleCategory,
  type ValidationResult as RuleValidationResult,
} from './validation-rule-engine.js';


// =============================================================================
// Phase 10: Typed Entailment Relations
// =============================================================================

// Re-export entire entailment module
export * from './entailment/index.js';

// =============================================================================
// Phase 11: Inline Citation Enforcement (Hallucination Prevention During Generation)
// =============================================================================

// Citation lookup tool for LLM tool-use during generation
export {
  CitationLookupTool,
  createCitationLookupTool,
  type CitationLookupRequest,
  type CitationLookupResult,
  type ValidCorpusCitation,
  type CorpusQuote,
  type CorpusRetriever,
} from './citation-lookup-tool.js';

// Inline claim validator for paragraph-level validation gates
export {
  InlineClaimValidator,
  createInlineClaimValidator,
  type GeneratedUnit,
  type InlineValidationConfig,
  type InlineValidationResult,
  type ValidationIssue,
} from './inline-claim-validator.js';

// Inline validation orchestrator for chunked generation with validation gates
export {
  InlineValidationOrchestrator,
  createInlineValidationOrchestrator,
  type GenerateFn,
  type GenerationUnit,
  type ValidatedUnit,
  type InlineGenerationConfig,
  type InlineGenerationResult,
} from './inline-validation-orchestrator.js';


// =============================================================================
// Phase 12: Comprehensive Claim Validation System
// =============================================================================

// Claim detector for extracting and classifying claims
export {
  ClaimDetector,
  createClaimDetector,
  type DetectedClaim,
  type DetectionContext,
  type ClaimDetectorOptions,
  type DetectionStatistics,
} from './claim-detector.js';

// Claim decomposer for breaking composite claims into atomic units
export {
  ClaimDecomposer,
  createClaimDecomposer,
  type AtomicClaim,
  type DecompositionResult,
  type DecompositionNode,
  type DecomposerOptions,
} from './claim-decomposer.js';

// Claim verifier for four-class verification against corpus
export {
  ClaimVerifier,
  createClaimVerifier,
  type VerificationResult,
  type EvidenceMatch,
  type CompositeVerificationResult,
  type VerifierOptions,
  type VerificationVerdict,
} from './claim-verifier.js';

// Comprehensive claim validator orchestrator
export {
  ComprehensiveClaimValidator,
  createComprehensiveValidator,
  createStrictAcademicValidator,
  createDraftValidator,
  createQuickValidator,
  type ComprehensiveValidationConfig,
  type ClaimValidationResult,
  type ParagraphValidationResult,
  type ParagraphVerdict,
  type ValidationStatistics,
  type ValidationIssue as ComprehensiveValidationIssue,
  type ValidationContext,
  type BatchValidationSummary,
  type LLMClient,
} from './comprehensive-claim-validator.js';


// =============================================================================
// Phase 13: CCV Tier 1 Inline Gate (Claim Detection + Citation Enforcement)
// =============================================================================

export {
  CcvTier1Gate,
  createCcvTier1Gate,
  shouldEnforceCitation,
  enforceCitationRequirements,
  isCompositeClaim,
  type CcvTier1Config,
  type Tier1DetectionContext,
  type Tier1Issue,
  type Tier1EvaluationResult,
  type Tier1Artifacts,
} from './ccv-tier1-gate.js';
