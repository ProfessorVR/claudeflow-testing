/**
 * Compositional Validation Rule Engine
 *
 * This module implements a rule engine that maps claim profiles to
 * validation requirements using compositional logic. Rules can match
 * on individual axes or combinations of axes.
 *
 * @module validation-rule-engine
 */

import {
  type ClaimProfile,
  type ComposedValidationRequirements,
  type RiskLevel,
  AttributionType,
  AttributionQualifier,
  AssertionType,
  StructureType,
  ModalityType,
  EpistemicForceType,
} from './claim-profile.js';

// =============================================================================
// VALIDATION RULE INTERFACE
// =============================================================================

/**
 * A validation rule that can match claim profiles and modify requirements.
 */
export interface ValidationRule {
  /** Unique identifier for the rule */
  id: string;

  /** Human-readable description */
  description: string;

  /** Function that checks if this rule applies to a claim profile */
  condition: (profile: ClaimProfile) => boolean;

  /** Function that modifies requirements when rule applies */
  apply: (requirements: ComposedValidationRequirements) => void;

  /** Human-readable rationale for why this rule applies */
  rationale: string;

  /** Priority (higher = applied later, can override earlier rules) */
  priority: number;

  /** Category for grouping rules */
  category: RuleCategory;
}

/**
 * Categories of validation rules
 */
export type RuleCategory =
  | 'attribution'
  | 'assertion'
  | 'structure'
  | 'modality'
  | 'epistemicForce'
  | 'composite';

// =============================================================================
// VALIDATION RULE ENGINE
// =============================================================================

/**
 * Compositional validation rule engine.
 * Maps claim profiles to validation requirements using logical composition.
 */
export class ValidationRuleEngine {
  private rules: ValidationRule[];

  constructor() {
    this.rules = this.initializeRules();
    // Sort by priority (lower first, so higher priority rules apply last and can override)
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Compute validation requirements for a claim profile.
   * Rules are applied in priority order, with later rules able to
   * override or augment earlier ones.
   */
  computeRequirements(profile: ClaimProfile): ComposedValidationRequirements {
    // Initialize with defaults
    const requirements: ComposedValidationRequirements = {
      citationRequired: 'optional',
      exactGroundingRequired: false,
      justificationRequired: false,
      multiSourceRequired: false,
      scholarlySupport: 'optional',
      argumentStructureRequired: false,
      applicableRules: [],
      rationale: '',
    };

    const rationales: string[] = [];

    // Apply each rule that matches
    for (const rule of this.rules) {
      if (rule.condition(profile)) {
        rule.apply(requirements);
        requirements.applicableRules.push(rule.id);
        rationales.push(rule.rationale);
      }
    }

    requirements.rationale = rationales.join('; ');
    return requirements;
  }

  /**
   * Get all rules that would apply to a profile (for debugging/explanation)
   */
  getMatchingRules(profile: ClaimProfile): ValidationRule[] {
    return this.rules.filter((rule) => rule.condition(profile));
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: RuleCategory): ValidationRule[] {
    return this.rules.filter((rule) => rule.category === category);
  }

  /**
   * Add a custom rule to the engine
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all rule IDs
   */
  getRuleIds(): string[] {
    return this.rules.map((r) => r.id);
  }

  /**
   * Initialize the default rule set
   */
  private initializeRules(): ValidationRule[] {
    return [
      // =======================================================================
      // ATTRIBUTION-BASED RULES (Priority 10-30)
      // =======================================================================
      {
        id: 'ATTR_DIRECT_CITATION',
        description: 'Direct attribution requires citation',
        condition: (p) => p.attribution.type === AttributionType.DIRECT,
        apply: (r) => {
          r.citationRequired = 'mandatory';
        },
        rationale: 'Direct attribution requires citation to ground the attributed claim',
        priority: 10,
        category: 'attribution',
      },
      {
        id: 'ATTR_EXPLICIT_GROUNDING',
        description: 'Explicit attribution requires exact textual grounding',
        condition: (p) =>
          p.attribution.type === AttributionType.DIRECT &&
          p.attribution.qualifier === AttributionQualifier.EXPLICIT,
        apply: (r) => {
          r.exactGroundingRequired = true;
        },
        rationale: 'Explicit attribution ("explicitly claims") requires exact textual grounding',
        priority: 15,
        category: 'attribution',
      },
      {
        id: 'ATTR_DEMONSTRATIVE_ARGUMENT',
        description: 'Demonstrative attribution requires argument structure',
        condition: (p) => p.attribution.qualifier === AttributionQualifier.DEMONSTRATIVE,
        apply: (r) => {
          r.argumentStructureRequired = true;
          r.citationRequired = 'mandatory';
        },
        rationale:
          'Demonstrative attribution ("demonstrates") requires argument structure verification',
        priority: 15,
        category: 'attribution',
      },
      {
        id: 'ATTR_INTERPRETIVE_JUSTIFICATION',
        description: 'Interpretive attribution requires justification',
        condition: (p) => p.attribution.type === AttributionType.INTERPRETIVE,
        apply: (r) => {
          r.citationRequired = 'recommended';
          r.justificationRequired = true;
          r.scholarlySupport = 'recommended';
        },
        rationale: 'Interpretive attribution allows optional citation but requires justification',
        priority: 10,
        category: 'attribution',
      },
      {
        id: 'ATTR_CONSENSUS_MULTISOURCE',
        description: 'Scholarly consensus requires multiple sources',
        condition: (p) => p.attribution.type === AttributionType.CONSENSUS,
        apply: (r) => {
          r.multiSourceRequired = true;
          r.minSourceCount = 3;
          r.citationRequired = 'mandatory';
        },
        rationale: 'Scholarly consensus claims require multiple independent sources (>=3)',
        priority: 20,
        category: 'attribution',
      },
      {
        id: 'ATTR_DISPUTED_PAIRED',
        description: 'Scholarly dispute requires paired sources',
        condition: (p) => p.attribution.type === AttributionType.DISPUTED,
        apply: (r) => {
          r.multiSourceRequired = true;
          r.minSourceCount = 2;
          r.citationRequired = 'mandatory';
        },
        rationale: 'Scholarly dispute claims require at least two opposed sources',
        priority: 20,
        category: 'attribution',
      },
      {
        id: 'ATTR_PROXY_TRADITION',
        description: 'Proxy attribution requires tradition definition',
        condition: (p) => p.attribution.type === AttributionType.PROXY,
        apply: (r) => {
          r.citationRequired = 'recommended';
          r.scholarlySupport = 'recommended';
        },
        rationale: 'Proxy attribution should reference established scholarly characterization',
        priority: 10,
        category: 'attribution',
      },
      {
        id: 'ATTR_ANONYMOUS_INVALID',
        description: 'Anonymous authority MUST be resolved',
        condition: (p) => p.attribution.type === AttributionType.ANONYMOUS,
        apply: (r) => {
          r.citationRequired = 'mandatory';
          r.multiSourceRequired = true;
          r.minSourceCount = 3;
          // This effectively makes validation fail without specific sources
        },
        rationale: 'Anonymous authority claims MUST be resolved to specific sources',
        priority: 100, // Highest priority - cannot be overridden
        category: 'attribution',
      },
      {
        id: 'ATTR_AUTHORIAL_MINIMAL',
        description: 'Authorial claims have minimal citation requirements',
        condition: (p) => p.attribution.type === AttributionType.AUTHORIAL,
        apply: (r) => {
          if (r.citationRequired === 'mandatory') {
            r.citationRequired = 'optional';
          }
        },
        rationale: "Author's own claims don't require external citation",
        priority: 5,
        category: 'attribution',
      },

      // =======================================================================
      // ASSERTION-BASED RULES (Priority 15-25)
      // =======================================================================
      {
        id: 'ASSERT_DEFINITIONAL_EXACT',
        description: 'Definitional claims require exact grounding',
        condition: (p) => p.assertion.type === AssertionType.DEFINITIONAL,
        apply: (r) => {
          r.exactGroundingRequired = true;
          r.citationRequired = 'mandatory';
        },
        rationale: 'Definitional claims require exact textual grounding',
        priority: 15,
        category: 'assertion',
      },
      {
        id: 'ASSERT_FUNCTIONAL_CITATION',
        description: 'Functional claims require citation',
        condition: (p) => p.assertion.type === AssertionType.FUNCTIONAL,
        apply: (r) => {
          r.citationRequired = 'mandatory';
        },
        rationale: 'Functional characterizations require textual support',
        priority: 12,
        category: 'assertion',
      },
      {
        id: 'ASSERT_MODAL_STRICT',
        description: 'Modal claims require explicit corpus support',
        condition: (p) => p.assertion.type === AssertionType.MODAL,
        apply: (r) => {
          r.exactGroundingRequired = true;
          r.citationRequired = 'mandatory';
        },
        rationale: 'Modal claims (can/cannot) require explicit corpus support',
        priority: 20,
        category: 'assertion',
      },
      {
        id: 'ASSERT_DEPENDENCY_STRICT',
        description: 'Dependency claims require strict verification',
        condition: (p) => p.assertion.type === AssertionType.DEPENDENCY,
        apply: (r) => {
          r.exactGroundingRequired = true;
          r.citationRequired = 'mandatory';
          r.argumentStructureRequired = true;
        },
        rationale: 'Dependency claims (necessary/sufficient) require strict verification',
        priority: 25,
        category: 'assertion',
      },
      {
        id: 'ASSERT_COMPARATIVE_PAIRED',
        description: 'Comparative claims require both sides grounded',
        condition: (p) =>
          p.assertion.type === AssertionType.COMPARATIVE ||
          p.assertion.type === AssertionType.CONTRASTIVE,
        apply: (r) => {
          r.multiSourceRequired = true;
          r.minSourceCount = Math.max(r.minSourceCount || 0, 2);
        },
        rationale: 'Comparative claims require grounding for both sides',
        priority: 15,
        category: 'assertion',
      },
      {
        id: 'ASSERT_ALIGNMENT_SCHOLARLY',
        description: 'Alignment claims need scholarly support',
        condition: (p) => p.assertion.type === AssertionType.ALIGNMENT,
        apply: (r) => {
          r.scholarlySupport = 'required';
          r.citationRequired = 'mandatory';
        },
        rationale: 'Alignment claims between thinkers require scholarly bridging',
        priority: 18,
        category: 'assertion',
      },
      {
        id: 'ASSERT_GENEALOGICAL_HISTORICAL',
        description: 'Genealogical claims need historical evidence',
        condition: (p) => p.assertion.type === AssertionType.GENEALOGICAL,
        apply: (r) => {
          r.scholarlySupport = 'required';
          r.citationRequired = 'mandatory';
        },
        rationale: 'Genealogical claims require historical/scholarly evidence',
        priority: 18,
        category: 'assertion',
      },
      {
        id: 'ASSERT_NOVELTY_SURVEY',
        description: 'Novelty claims require literature survey',
        condition: (p) => p.assertion.type === AssertionType.NOVELTY,
        apply: (r) => {
          r.scholarlySupport = 'required';
          r.multiSourceRequired = true;
          r.minSourceCount = Math.max(r.minSourceCount || 0, 3);
        },
        rationale: 'Novelty claims require literature survey evidence',
        priority: 20,
        category: 'assertion',
      },
      {
        id: 'ASSERT_EVALUATIVE_JUSTIFICATION',
        description: 'Evaluative claims require justification',
        condition: (p) => p.assertion.type === AssertionType.EVALUATIVE,
        apply: (r) => {
          r.justificationRequired = true;
        },
        rationale: 'Evaluative claims require justification',
        priority: 10,
        category: 'assertion',
      },
      {
        id: 'ASSERT_SIGNIFICANCE_SUPPORT',
        description: 'Significance claims need supporting argument',
        condition: (p) => p.assertion.type === AssertionType.SIGNIFICANCE,
        apply: (r) => {
          r.justificationRequired = true;
          r.citationRequired = 'recommended';
        },
        rationale: 'Significance claims need supporting argument or evidence',
        priority: 12,
        category: 'assertion',
      },
      {
        id: 'ASSERT_SCOPE_INTERNAL',
        description: 'Scope claims need internal consistency',
        condition: (p) => p.assertion.type === AssertionType.SCOPE,
        apply: (r) => {
          // Scope claims just need internal consistency, not external citation
          if (r.citationRequired === 'mandatory') {
            r.citationRequired = 'optional';
          }
        },
        rationale: 'Scope claims only require internal consistency',
        priority: 5,
        category: 'assertion',
      },

      // =======================================================================
      // STRUCTURE-BASED RULES (Priority 15-20)
      // =======================================================================
      {
        id: 'STRUCT_INFERENTIAL_PREMISES',
        description: 'Inferential claims require validated premises',
        condition: (p) => p.structure.type === StructureType.INFERENTIAL,
        apply: (r) => {
          r.argumentStructureRequired = true;
        },
        rationale: 'Inferential claims require validated premises',
        priority: 15,
        category: 'structure',
      },
      {
        id: 'STRUCT_CONDITIONAL_BOTH',
        description: 'Conditional claims need antecedent and consequent validated',
        condition: (p) => p.structure.type === StructureType.CONDITIONAL,
        apply: (r) => {
          r.argumentStructureRequired = true;
        },
        rationale: 'Conditional claims require validation of both antecedent and consequent',
        priority: 15,
        category: 'structure',
      },
      {
        id: 'STRUCT_EXPLANATORY_CAUSAL',
        description: 'Explanatory claims require causal support',
        condition: (p) => p.structure.type === StructureType.EXPLANATORY,
        apply: (r) => {
          r.argumentStructureRequired = true;
          r.justificationRequired = true;
        },
        rationale: 'Explanatory claims require causal link verification',
        priority: 15,
        category: 'structure',
      },

      // =======================================================================
      // MODALITY-BASED RULES (Priority 5-10, lower so they can be overridden)
      // =======================================================================
      {
        id: 'MODAL_SPECULATIVE_LENIENT',
        description: 'Speculative claims have reduced requirements',
        condition: (p) => p.modality.type === ModalityType.SPECULATIVE,
        apply: (r) => {
          // Speculative claims have reduced requirements
          if (r.citationRequired === 'mandatory') {
            r.citationRequired = 'recommended';
          }
          r.exactGroundingRequired = false;
        },
        rationale: 'Speculative claims have reduced validation requirements',
        priority: 5, // Low priority - can be overridden
        category: 'modality',
      },
      {
        id: 'MODAL_HYPOTHETICAL_MINIMAL',
        description: 'Hypothetical claims have minimal requirements',
        condition: (p) => p.modality.type === ModalityType.HYPOTHETICAL,
        apply: (r) => {
          if (r.citationRequired === 'mandatory') {
            r.citationRequired = 'optional';
          }
          r.exactGroundingRequired = false;
        },
        rationale: 'Hypothetical claims have minimal validation requirements',
        priority: 5,
        category: 'modality',
      },
      {
        id: 'MODAL_INTERPRETED_JUSTIFICATION',
        description: 'Interpreted claims need justification',
        condition: (p) => p.modality.type === ModalityType.INTERPRETED,
        apply: (r) => {
          r.justificationRequired = true;
          if (r.citationRequired === 'mandatory') {
            r.citationRequired = 'recommended';
          }
        },
        rationale: 'Interpreted claims require justification of the interpretation',
        priority: 8,
        category: 'modality',
      },
      {
        id: 'MODAL_LOW_COMMITMENT_LENIENT',
        description: 'Low commitment claims have reduced requirements',
        condition: (p) => p.modality.commitmentLevel < 0.5,
        apply: (r) => {
          // Very hedged claims get some leniency
          if (r.exactGroundingRequired && r.citationRequired !== 'mandatory') {
            r.exactGroundingRequired = false;
          }
        },
        rationale: 'Low commitment claims have reduced exactness requirements',
        priority: 3,
        category: 'modality',
      },

      // =======================================================================
      // EPISTEMIC FORCE RULES (Priority 10-15)
      // =======================================================================
      {
        id: 'FORCE_EVALUATIVE_JUSTIFICATION',
        description: 'Evaluative force requires justification',
        condition: (p) => p.epistemicForce.type === EpistemicForceType.EVALUATIVE,
        apply: (r) => {
          r.justificationRequired = true;
        },
        rationale: 'Evaluative force requires justification',
        priority: 10,
        category: 'epistemicForce',
      },
      {
        id: 'FORCE_NORMATIVE_STRONG',
        description: 'Normative force requires strong support',
        condition: (p) => p.epistemicForce.type === EpistemicForceType.NORMATIVE,
        apply: (r) => {
          r.justificationRequired = true;
          r.argumentStructureRequired = true;
        },
        rationale: 'Normative claims require strong argumentative support',
        priority: 15,
        category: 'epistemicForce',
      },
      {
        id: 'FORCE_CRITICAL_EVIDENCE',
        description: 'Critical force requires evidence',
        condition: (p) => p.epistemicForce.type === EpistemicForceType.CRITICAL,
        apply: (r) => {
          r.justificationRequired = true;
          r.citationRequired = 'recommended';
        },
        rationale: 'Critical claims should be supported by evidence',
        priority: 12,
        category: 'epistemicForce',
      },
      {
        id: 'FORCE_HIGH_NORMATIVE_STRENGTH',
        description: 'High normative strength needs strong support',
        condition: (p) => p.epistemicForce.normativeStrength > 0.7,
        apply: (r) => {
          r.justificationRequired = true;
          if (r.citationRequired === 'optional') {
            r.citationRequired = 'recommended';
          }
        },
        rationale: 'High normative strength requires strong supporting argument',
        priority: 12,
        category: 'epistemicForce',
      },

      // =======================================================================
      // COMPOSITE RULES (Priority 20-35, applied last)
      // =======================================================================
      {
        id: 'COMPOSITE_INTERP_EVAL',
        description: 'Interpretive + Evaluative: justification required',
        condition: (p) =>
          p.attribution.type === AttributionType.INTERPRETIVE &&
          p.epistemicForce.type === EpistemicForceType.EVALUATIVE,
        apply: (r) => {
          r.citationRequired = 'optional';
          r.justificationRequired = true;
          r.scholarlySupport = 'recommended';
        },
        rationale: 'Interpretive + Evaluative: citation optional but justification required',
        priority: 25,
        category: 'composite',
      },
      {
        id: 'COMPOSITE_DIRECT_DEFINITIONAL',
        description: 'Direct + Definitional: exact grounding required',
        condition: (p) =>
          p.attribution.type === AttributionType.DIRECT &&
          p.assertion.type === AssertionType.DEFINITIONAL,
        apply: (r) => {
          r.exactGroundingRequired = true;
          r.citationRequired = 'mandatory';
        },
        rationale: 'Direct + Definitional: exact textual grounding required',
        priority: 30,
        category: 'composite',
      },
      {
        id: 'COMPOSITE_ENTAILED_EVALUATIVE',
        description: 'Inferential + Evaluative: argument structure and justification',
        condition: (p) =>
          p.structure.type === StructureType.INFERENTIAL &&
          p.epistemicForce.type === EpistemicForceType.EVALUATIVE,
        apply: (r) => {
          r.argumentStructureRequired = true;
          r.justificationRequired = true;
        },
        rationale: 'Inferential + Evaluative: argument structure and justification required',
        priority: 25,
        category: 'composite',
      },
      {
        id: 'COMPOSITE_SPECULATIVE_INTERPRETIVE',
        description: 'Speculative + Interpretive: minimal requirements',
        condition: (p) =>
          p.modality.type === ModalityType.SPECULATIVE &&
          p.attribution.type === AttributionType.INTERPRETIVE,
        apply: (r) => {
          r.citationRequired = 'optional';
          r.justificationRequired = true;
          r.exactGroundingRequired = false;
        },
        rationale: 'Speculative + Interpretive: minimal citation requirements',
        priority: 20,
        category: 'composite',
      },
      {
        id: 'COMPOSITE_DIRECT_MODAL',
        description: 'Direct + Modal: strict requirements',
        condition: (p) =>
          p.attribution.type === AttributionType.DIRECT &&
          p.assertion.type === AssertionType.MODAL,
        apply: (r) => {
          r.exactGroundingRequired = true;
          r.citationRequired = 'mandatory';
        },
        rationale: 'Direct + Modal: strict verification required for attributed modal claims',
        priority: 30,
        category: 'composite',
      },
      {
        id: 'COMPOSITE_CONSENSUS_EVALUATIVE',
        description: 'Consensus + Evaluative: multi-source with justification',
        condition: (p) =>
          p.attribution.type === AttributionType.CONSENSUS &&
          p.epistemicForce.type === EpistemicForceType.EVALUATIVE,
        apply: (r) => {
          r.multiSourceRequired = true;
          r.minSourceCount = Math.max(r.minSourceCount || 0, 3);
          r.justificationRequired = true;
        },
        rationale:
          'Consensus + Evaluative: requires multiple sources and justification for evaluation',
        priority: 25,
        category: 'composite',
      },
      {
        id: 'COMPOSITE_COMPARATIVE_INFERENTIAL',
        description: 'Comparative + Inferential: both sides plus argument structure',
        condition: (p) =>
          (p.assertion.type === AssertionType.COMPARATIVE ||
            p.assertion.type === AssertionType.CONTRASTIVE) &&
          p.structure.type === StructureType.INFERENTIAL,
        apply: (r) => {
          r.multiSourceRequired = true;
          r.minSourceCount = Math.max(r.minSourceCount || 0, 2);
          r.argumentStructureRequired = true;
        },
        rationale: 'Comparative + Inferential: requires paired sources and argument validation',
        priority: 28,
        category: 'composite',
      },
      {
        id: 'COMPOSITE_AUTHORIAL_NORMATIVE',
        description: 'Authorial + Normative: needs strong argument',
        condition: (p) =>
          p.attribution.type === AttributionType.AUTHORIAL &&
          p.epistemicForce.type === EpistemicForceType.NORMATIVE,
        apply: (r) => {
          r.argumentStructureRequired = true;
          r.justificationRequired = true;
          // But citation not required since it's the author's own normative claim
        },
        rationale: "Author's own normative claims need argumentative support, not citation",
        priority: 22,
        category: 'composite',
      },
    ];
  }
}

// =============================================================================
// RISK LEVEL COMPUTATION
// =============================================================================

/**
 * Compute risk level from a claim profile.
 * Risk indicates how likely validation failure could lead to academic issues.
 */
export function computeRiskLevel(profile: ClaimProfile): RiskLevel {
  let riskScore = 0;

  // Attribution risks
  switch (profile.attribution.type) {
    case AttributionType.ANONYMOUS:
      riskScore += 4; // Critical - anonymous authority is high risk
      break;
    case AttributionType.CONSENSUS:
    case AttributionType.DISPUTED:
      riskScore += 2; // High - needs multiple sources
      break;
    case AttributionType.DIRECT:
      if (profile.attribution.qualifier === AttributionQualifier.EXPLICIT) {
        riskScore += 2; // Higher risk for explicit claims
      } else if (profile.attribution.qualifier === AttributionQualifier.DEMONSTRATIVE) {
        riskScore += 2; // Higher risk for demonstrative
      } else {
        riskScore += 1;
      }
      break;
    case AttributionType.INTERPRETIVE:
    case AttributionType.PROXY:
      riskScore += 1;
      break;
    default:
      break;
  }

  // Assertion risks
  switch (profile.assertion.type) {
    case AssertionType.MODAL:
    case AssertionType.DEPENDENCY:
      riskScore += 2; // Critical - strong metaphysical claims
      break;
    case AssertionType.DEFINITIONAL:
    case AssertionType.NOVELTY:
      riskScore += 2; // High - fundamental claims
      break;
    case AssertionType.COMPARATIVE:
    case AssertionType.CONTRASTIVE:
    case AssertionType.GENEALOGICAL:
    case AssertionType.ALIGNMENT:
      riskScore += 1.5;
      break;
    case AssertionType.EVALUATIVE:
    case AssertionType.SIGNIFICANCE:
      riskScore += 1;
      break;
    default:
      break;
  }

  // Structure risks
  switch (profile.structure.type) {
    case StructureType.INFERENTIAL:
      riskScore += 1; // Conclusions need valid premises
      break;
    case StructureType.CONDITIONAL:
      riskScore += 0.5;
      break;
    default:
      break;
  }

  // Modality adjustments (can reduce risk)
  switch (profile.modality.type) {
    case ModalityType.SPECULATIVE:
    case ModalityType.HYPOTHETICAL:
      riskScore -= 1; // Hedging reduces risk
      break;
    case ModalityType.INTERPRETED:
      riskScore -= 0.5;
      break;
    default:
      break;
  }

  // Commitment level adjustment
  if (profile.modality.commitmentLevel < 0.5) {
    riskScore -= 0.5;
  }

  // Epistemic force adjustments
  if (
    profile.epistemicForce.type === EpistemicForceType.EVALUATIVE ||
    profile.epistemicForce.type === EpistemicForceType.NORMATIVE
  ) {
    riskScore += 0.5;
  }

  // Convert score to risk level
  if (riskScore >= 4) return 'critical';
  if (riskScore >= 2.5) return 'high';
  if (riskScore >= 1) return 'medium';
  return 'low';
}

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

/**
 * Result of validating a claim against requirements
 */
export interface ValidationResult {
  /** Whether the claim meets all requirements */
  isValid: boolean;

  /** Overall confidence in the validation */
  confidence: number;

  /** Which requirements were met */
  metRequirements: string[];

  /** Which requirements were not met */
  unmetRequirements: string[];

  /** Suggestions for fixing unmet requirements */
  suggestions: string[];

  /** The computed risk level */
  riskLevel: RiskLevel;
}

/**
 * Generate validation suggestions based on unmet requirements
 */
export function generateSuggestions(
  requirements: ComposedValidationRequirements,
  unmetRequirements: string[]
): string[] {
  const suggestions: string[] = [];

  if (unmetRequirements.includes('citation')) {
    suggestions.push('Add a citation to support this claim');
  }

  if (unmetRequirements.includes('exactGrounding')) {
    suggestions.push('Provide exact textual evidence or quote from the source');
  }

  if (unmetRequirements.includes('justification')) {
    suggestions.push('Add justification or reasoning for this claim');
  }

  if (unmetRequirements.includes('multiSource')) {
    const count = requirements.minSourceCount || 2;
    suggestions.push(`Provide at least ${count} independent sources to support this claim`);
  }

  if (unmetRequirements.includes('scholarlySupport')) {
    suggestions.push('Add scholarly secondary source support');
  }

  if (unmetRequirements.includes('argumentStructure')) {
    suggestions.push('Ensure the premises supporting this conclusion are validated');
  }

  return suggestions;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ValidationRuleEngine as default };
