/**
 * Typed Entailment Relations - Validation Rules
 *
 * This module defines validation rules based on entailment types,
 * integrating with the existing ValidationRuleEngine infrastructure.
 *
 * @module entailment-rules
 */

import { ClaimProfile, ComposedValidationRequirements } from '../claim-profile.js';
import { ClaimEntailmentProfile, isClaimEntailmentProfile } from './claim-entailment-profile.js';
import { EntailmentRelationType } from './entailment-types.js';
import { ENTAILMENT_REQUIREMENTS } from './entailment-requirements.js';

// =============================================================================
// VALIDATION RULE TYPES
// =============================================================================

/**
 * Rule category for organization
 */
export type EntailmentRuleCategory =
  | 'textual'
  | 'paraphrastic'
  | 'conceptual'
  | 'inferential'
  | 'analogical'
  | 'evaluative'
  | 'composite';

/**
 * Entailment-specific validation rule
 */
export interface EntailmentValidationRule {
  /** Unique rule identifier */
  id: string;

  /** Human-readable description */
  description: string;

  /** Rule category */
  category: EntailmentRuleCategory;

  /** Condition for rule application */
  condition: (profile: ClaimProfile | ClaimEntailmentProfile) => boolean;

  /** Apply rule to modify requirements */
  apply: (requirements: ComposedValidationRequirements) => void;

  /** Rationale for this rule */
  rationale: string;

  /** Priority (higher = applied later, can override) */
  priority: number;
}

// =============================================================================
// ENTAILMENT VALIDATION RULES
// =============================================================================

/**
 * Create all entailment-based validation rules
 */
export function createEntailmentValidationRules(): EntailmentValidationRule[] {
  return [
    // =========================================================================
    // TEXTUAL ENTAILMENT RULES
    // =========================================================================
    {
      id: 'ENTAIL_TEXTUAL_EXACT_QUOTE',
      description: 'Textual entailment requires exact quote match',
      category: 'textual',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'textual',
      apply: (r) => {
        r.exactGroundingRequired = true;
        r.citationRequired = 'mandatory';
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAIL_TEXTUAL_EXACT_QUOTE');
      },
      rationale: 'Textual entailment (near-quotation) requires exact textual grounding',
      priority: 35,
    },
    {
      id: 'ENTAIL_TEXTUAL_PAGE_REQUIRED',
      description: 'Textual entailment requires page number',
      category: 'textual',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'textual',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('PAGE_NUMBER_REQUIRED');
      },
      rationale: 'Direct quotations must include page numbers for verification',
      priority: 36,
    },
    {
      id: 'ENTAIL_TEXTUAL_QUOTATION_MARKS',
      description: 'Textual entailment should use quotation marks',
      category: 'textual',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'textual',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('QUOTATION_MARKS_EXPECTED');
      },
      rationale: 'Near-quotations should be properly marked with quotation marks',
      priority: 34,
    },

    // =========================================================================
    // PARAPHRASTIC ENTAILMENT RULES
    // =========================================================================
    {
      id: 'ENTAIL_PARAPHRASTIC_SEMANTIC',
      description: 'Paraphrastic entailment requires semantic match',
      category: 'paraphrastic',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'paraphrastic',
      apply: (r) => {
        r.citationRequired = 'mandatory';
        r.exactGroundingRequired = false;
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAIL_PARAPHRASTIC_SEMANTIC');
      },
      rationale: 'Paraphrases must preserve meaning without requiring exact wording',
      priority: 30,
    },
    {
      id: 'ENTAIL_PARAPHRASTIC_NO_DISTORTION',
      description: 'Paraphrastic entailment must not distort meaning',
      category: 'paraphrastic',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'paraphrastic',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('NO_MEANING_DISTORTION');
      },
      rationale: 'Paraphrases should accurately represent the source content',
      priority: 31,
    },

    // =========================================================================
    // CONCEPTUAL ENTAILMENT RULES
    // =========================================================================
    {
      id: 'ENTAIL_CONCEPTUAL_TERMINOLOGY',
      description: 'Conceptual entailment requires terminology alignment',
      category: 'conceptual',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'conceptual',
      apply: (r) => {
        r.citationRequired = 'recommended';
        r.scholarlySupport = 'recommended';
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAIL_CONCEPTUAL_TERMINOLOGY', 'TERMINOLOGY_MAPPING_REQUIRED');
      },
      rationale: 'Conceptual mappings should have scholarly support for terminology translation',
      priority: 25,
    },
    {
      id: 'ENTAIL_CONCEPTUAL_FRAMEWORK',
      description: 'Conceptual entailment should maintain framework consistency',
      category: 'conceptual',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'conceptual',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('FRAMEWORK_CONSISTENCY_REQUIRED');
      },
      rationale: 'Cross-framework conceptual mappings must be internally consistent',
      priority: 26,
    },

    // =========================================================================
    // INFERENTIAL ENTAILMENT RULES
    // =========================================================================
    {
      id: 'ENTAIL_INFERENTIAL_PREMISES',
      description: 'Inferential entailment requires explicit premises',
      category: 'inferential',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'inferential',
      apply: (r) => {
        r.argumentStructureRequired = true;
        r.citationRequired = 'mandatory';
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAIL_INFERENTIAL_PREMISES', 'PREMISES_MUST_BE_GROUNDED');
      },
      rationale: 'Inferences must have explicitly grounded premises',
      priority: 40,
    },
    {
      id: 'ENTAIL_INFERENTIAL_NO_HIDDEN',
      description: 'Inferential entailment must not rely on hidden premises',
      category: 'inferential',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'inferential',
      apply: (r) => {
        r.justificationRequired = true;
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('NO_HIDDEN_PREMISES');
      },
      rationale: 'All premises supporting an inference must be made explicit',
      priority: 41,
    },
    {
      id: 'ENTAIL_INFERENTIAL_VALID',
      description: 'Inferential entailment must use valid logical form',
      category: 'inferential',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'inferential',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('INFERENCE_VALID');
      },
      rationale: 'Inferences must follow valid logical patterns',
      priority: 42,
    },

    // =========================================================================
    // ANALOGICAL ENTAILMENT RULES
    // =========================================================================
    {
      id: 'ENTAIL_ANALOGICAL_BRIDGE',
      description: 'Analogical entailment requires explicit bridge',
      category: 'analogical',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'analogical',
      apply: (r) => {
        r.multiSourceRequired = true;
        r.minSourceCount = Math.max(r.minSourceCount || 0, 2);
        r.scholarlySupport = 'required';
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAIL_ANALOGICAL_BRIDGE', 'BRIDGE_TEXT_REQUIRED');
      },
      rationale: 'Analogical claims require explicit bridging between frameworks',
      priority: 38,
    },
    {
      id: 'ENTAIL_ANALOGICAL_DISANALOGY',
      description: 'Analogical entailment should acknowledge limits',
      category: 'analogical',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'analogical',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('DISANALOGY_ACKNOWLEDGMENT_RECOMMENDED');
      },
      rationale: 'Strong analogical arguments acknowledge where the analogy breaks down',
      priority: 28,
    },
    {
      id: 'ENTAIL_ANALOGICAL_MULTI_SOURCE',
      description: 'Analogical entailment needs evidence from both sides',
      category: 'analogical',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'analogical',
      apply: (r) => {
        r.multiSourceRequired = true;
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('BOTH_ANALOGS_GROUNDED');
      },
      rationale: 'Both sides of an analogy must be grounded in evidence',
      priority: 39,
    },

    // =========================================================================
    // EVALUATIVE ENTAILMENT RULES
    // =========================================================================
    {
      id: 'ENTAIL_EVALUATIVE_ARGUMENT',
      description: 'Evaluative entailment requires argument presence',
      category: 'evaluative',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'evaluative',
      apply: (r) => {
        r.justificationRequired = true;
        r.argumentStructureRequired = true;
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAIL_EVALUATIVE_ARGUMENT', 'EVALUATION_CRITERIA_EXPLICIT');
      },
      rationale: 'Evaluative claims require explicit criteria and argumentative support',
      priority: 32,
    },
    {
      id: 'ENTAIL_EVALUATIVE_NOT_TEXT',
      description: 'Evaluative claims cannot rely on textual entailment alone',
      category: 'evaluative',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.entailment?.primary?.type === 'evaluative' &&
        p.epistemicForce.type === 'evaluative',
      apply: (r) => {
        r.exactGroundingRequired = false;
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ARGUMENT_NOT_QUOTATION');
      },
      rationale: 'Value judgments require argument, not just citation',
      priority: 45,
    },
    {
      id: 'ENTAIL_EVALUATIVE_CRITERIA',
      description: 'Evaluative entailment should make criteria explicit',
      category: 'evaluative',
      condition: (p) =>
        isClaimEntailmentProfile(p) && p.entailment?.primary?.type === 'evaluative',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('EVALUATION_CRITERIA_REQUIRED');
      },
      rationale: 'Evaluations must specify criteria by which they judge',
      priority: 33,
    },

    // =========================================================================
    // COMPOSITE RULES: CLAIM PROFILE + ENTAILMENT TYPE
    // =========================================================================
    {
      id: 'COMPOSITE_DIRECT_TEXTUAL_EXPLICIT',
      description: 'Direct + Explicit + Textual: highest standard',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.attribution.type === 'direct' &&
        p.attribution.qualifier === 'explicit' &&
        p.entailment?.primary?.type === 'textual',
      apply: (r) => {
        r.exactGroundingRequired = true;
        r.citationRequired = 'mandatory';
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push(
          'COMPOSITE_DIRECT_TEXTUAL_EXPLICIT',
          'QUOTATION_MARKS_REQUIRED',
          'VERBATIM_MATCH_REQUIRED'
        );
      },
      rationale: 'Explicit direct attribution with textual entailment requires verbatim quotation',
      priority: 50,
    },
    {
      id: 'COMPOSITE_INTERPRETIVE_CONCEPTUAL',
      description: 'Interpretive + Conceptual: terminology bridge needed',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.attribution.type === 'interpretive' &&
        p.entailment?.primary?.type === 'conceptual',
      apply: (r) => {
        r.justificationRequired = true;
        r.scholarlySupport = 'recommended';
        r.citationRequired = 'optional';
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('COMPOSITE_INTERPRETIVE_CONCEPTUAL', 'INTERPRETATION_JUSTIFIED');
      },
      rationale: 'Interpretive conceptual mappings need justified terminology translation',
      priority: 35,
    },
    {
      id: 'COMPOSITE_ALIGNMENT_MISMATCH',
      description: 'Alignment assertion requires analogical entailment',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.assertion.type === 'alignment' &&
        p.entailment?.primary?.type !== 'analogical',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAILMENT_TYPE_MISMATCH_WARNING');
        r.scholarlySupport = 'required';
      },
      rationale: 'Alignment claims typically require analogical bridging between thinkers',
      priority: 42,
    },
    {
      id: 'COMPOSITE_INFERENTIAL_STRUCTURE_MATCH',
      description: 'Inferential structure should have inferential entailment',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.structure.type === 'inferential' &&
        p.entailment?.primary?.type !== 'inferential',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('ENTAILMENT_TYPE_MISMATCH_WARNING');
      },
      rationale: 'Inferential claim structure should be supported by inferential entailment',
      priority: 40,
    },
    {
      id: 'COMPOSITE_SPECULATIVE_INFERENTIAL',
      description: 'Speculative + Inferential: reduced requirements',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.modality.type === 'speculative' &&
        p.entailment?.primary?.type === 'inferential',
      apply: (r) => {
        // Speculative inferences have reduced validation burden
        // Priority 55 ensures this runs AFTER ENTAIL_INFERENTIAL_PREMISES (priority 40)
        if (r.citationRequired === 'mandatory') {
          r.citationRequired = 'recommended';
        }
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('COMPOSITE_SPECULATIVE_INFERENTIAL', 'SPECULATIVE_INFERENCE_LENIENT');
      },
      rationale: 'Speculative inferences have reduced validation requirements',
      priority: 55,
    },
    {
      id: 'COMPOSITE_HYPOTHETICAL_REDUCED',
      description: 'Hypothetical modality reduces entailment strictness',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.modality.type === 'hypothetical',
      apply: (r) => {
        // Hypothetical claims are exploratory
        if (r.citationRequired === 'mandatory') {
          r.citationRequired = 'recommended';
        }
        r.exactGroundingRequired = false;
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('HYPOTHETICAL_REDUCED_REQUIREMENTS');
      },
      rationale: 'Hypothetical claims are exploratory and have reduced requirements',
      priority: 18,
    },
    {
      id: 'COMPOSITE_DEFINITIONAL_TEXTUAL_REQUIRED',
      description: 'Definitional claims should use textual or paraphrastic entailment',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.assertion.type === 'definitional' &&
        p.entailment?.primary?.type !== 'textual' &&
        p.entailment?.primary?.type !== 'paraphrastic',
      apply: (r) => {
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('DEFINITION_ENTAILMENT_MISMATCH');
        r.scholarlySupport = 'recommended';
      },
      rationale: 'Definitions should be directly grounded in source texts',
      priority: 38,
    },
    {
      id: 'COMPOSITE_EVALUATIVE_EPISTEMIC_ARGUMENT',
      description: 'Evaluative epistemic force with evaluative entailment: argument required',
      category: 'composite',
      condition: (p) =>
        isClaimEntailmentProfile(p) &&
        p.epistemicForce.type === 'evaluative' &&
        p.entailment?.primary?.type === 'evaluative',
      apply: (r) => {
        r.argumentStructureRequired = true;
        r.justificationRequired = true;
        if (!r.applicableRules) r.applicableRules = [];
        r.applicableRules.push('FULL_ARGUMENT_REQUIRED', 'CRITERIA_AND_REASONING_REQUIRED');
      },
      rationale: 'Double evaluative (force + entailment) requires full argumentative support',
      priority: 48,
    },
  ];
}

// =============================================================================
// RULE ENGINE INTEGRATION
// =============================================================================

/**
 * Get all entailment rules as a flat array
 */
export function getEntailmentRules(): EntailmentValidationRule[] {
  return createEntailmentValidationRules();
}

/**
 * Get rules by category
 */
export function getRulesByCategory(
  category: EntailmentRuleCategory
): EntailmentValidationRule[] {
  return createEntailmentValidationRules().filter((r) => r.category === category);
}

/**
 * Get rules applicable to a specific entailment type
 */
export function getRulesForEntailmentType(
  type: EntailmentRelationType
): EntailmentValidationRule[] {
  const rules = createEntailmentValidationRules();
  return rules.filter(
    (r) =>
      r.category === type ||
      r.category === 'composite'
  );
}

/**
 * Apply entailment rules to compute requirements
 */
export function applyEntailmentRules(
  profile: ClaimProfile | ClaimEntailmentProfile,
  baseRequirements: ComposedValidationRequirements
): ComposedValidationRequirements {
  const requirements = { ...baseRequirements };
  if (!requirements.applicableRules) {
    requirements.applicableRules = [];
  }

  const rules = createEntailmentValidationRules()
    .filter((rule) => rule.condition(profile))
    .sort((a, b) => a.priority - b.priority);

  for (const rule of rules) {
    rule.apply(requirements);
  }

  return requirements;
}

/**
 * Get matching rules for a profile
 */
export function getMatchingEntailmentRules(
  profile: ClaimProfile | ClaimEntailmentProfile
): EntailmentValidationRule[] {
  return createEntailmentValidationRules()
    .filter((rule) => rule.condition(profile))
    .sort((a, b) => a.priority - b.priority);
}

// =============================================================================
// RULE VALIDATION
// =============================================================================

/**
 * Result of validating against entailment rules
 */
export interface EntailmentRuleValidationResult {
  /** Whether all required rules pass */
  passed: boolean;

  /** Rules that were applied */
  appliedRules: string[];

  /** Rules that generated warnings */
  warnings: string[];

  /** Final requirements after rule application */
  requirements: ComposedValidationRequirements;
}

/**
 * Validate a profile against entailment rules
 */
export function validateWithEntailmentRules(
  profile: ClaimProfile | ClaimEntailmentProfile,
  baseRequirements?: Partial<ComposedValidationRequirements>
): EntailmentRuleValidationResult {
  const requirements: ComposedValidationRequirements = {
    citationRequired: 'optional',
    exactGroundingRequired: false,
    justificationRequired: false,
    multiSourceRequired: false,
    scholarlySupport: 'optional',
    argumentStructureRequired: false,
    applicableRules: [],
    minSourceCount: 1,
    ...baseRequirements,
  };

  const appliedRules: string[] = [];
  const warnings: string[] = [];

  const rules = getMatchingEntailmentRules(profile);

  for (const rule of rules) {
    rule.apply(requirements);
    appliedRules.push(rule.id);

    // Check for warning rules
    if (rule.id.includes('MISMATCH') || rule.id.includes('WARNING')) {
      warnings.push(`${rule.id}: ${rule.description}`);
    }
  }

  return {
    passed: warnings.length === 0,
    appliedRules,
    warnings,
    requirements,
  };
}
