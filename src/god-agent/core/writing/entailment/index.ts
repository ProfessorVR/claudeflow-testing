/**
 * Typed Entailment Relations Module
 *
 * This module provides typed entailment relations for scholarly writing,
 * replacing scalar entailment with relation typing that distinguishes:
 *
 * - textual: near-quotation with high lexical overlap
 * - paraphrastic: same content, different wording
 * - conceptual: same concept, different vocabulary/framework
 * - inferential: conclusion drawn from explicit premises
 * - analogical: cross-framework or cross-domain mapping
 * - evaluative: value judgment requiring argumentative support
 *
 * @module entailment
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export {
  // Entailment relation types
  type EntailmentRelationType,
  EntailmentRelationTypeEnum,

  // Main interfaces
  type EntailmentRelation,
  type EntailmentEvidence,
  type EntailmentMarker,
  type EntailmentProfile,
  type RelationMetrics,
  type SourceMetadata,
  type TextPosition,
  type MarkerType,

  // Classification types
  type EntailmentClassificationContext,
  type EntailmentClassificationResult,
  type ClassificationMetadata,
  type ContextChunk,
  type ChunkMetadata,

  // Primary metrics
  PRIMARY_METRICS,

  // Type guards
  isEntailmentRelationType,
  isEntailmentRelation,
  isEntailmentEvidence,
  isSourceMetadata,

  // Factory functions
  createDefaultEntailmentRelation,
  createEntailmentRelation,
  createDefaultEntailmentProfile,
  createEntailmentMarker,
} from './entailment-types.js';

// =============================================================================
// REQUIREMENTS
// =============================================================================

export {
  // Requirement types
  type EntailmentValidationRequirements,
  type MarkerRequirement,
  type EvidenceRequirement,

  // Requirements by type
  ENTAILMENT_REQUIREMENTS,

  // Threshold utilities
  getPrimaryThreshold,
  meetsThreshold,
  getRequiredMarkers,
  getEvidenceRequirements,
  getAdditionalRules,

  // Validation
  type RequirementValidationResult,
  type MarkerValidationResult,
  type EvidenceValidationResult,
  validateAgainstRequirements,

  // Threshold adjustment
  type ThresholdAdjustment,
  THRESHOLD_ADJUSTMENTS,
  getAdjustedThreshold,
} from './entailment-requirements.js';

// =============================================================================
// CLASSIFIER
// =============================================================================

export {
  // Classifier
  EntailmentClassifier,

  // Options
  type EntailmentClassifierOptions,
} from './entailment-classifier.js';

// =============================================================================
// CLAIM PROFILE INTEGRATION
// =============================================================================

export {
  // Extended profile
  type ClaimEntailmentProfile,
  isClaimEntailmentProfile,
  extendWithEntailment,

  // Profile-entailment mappings
  type ProfileEntailmentMapping,
  type ExpectationStrength,
  PROFILE_ENTAILMENT_EXPECTATIONS,

  // Expectation checking
  type ExpectationCheckResult,
  getExpectedEntailmentTypes,
  checkEntailmentExpectations,
  getProfileEntailmentMismatches,

  // Composite analysis
  type CompositeAnalysisResult,
  analyzeComposite,
} from './claim-entailment-profile.js';

// =============================================================================
// VALIDATION RULES
// =============================================================================

export {
  // Rule types
  type EntailmentRuleCategory,
  type EntailmentValidationRule,

  // Rule creation
  createEntailmentValidationRules,

  // Rule access
  getEntailmentRules,
  getRulesByCategory,
  getRulesForEntailmentType,

  // Rule application
  applyEntailmentRules,
  getMatchingEntailmentRules,

  // Rule validation
  type EntailmentRuleValidationResult,
  validateWithEntailmentRules,
} from './entailment-rules.js';
