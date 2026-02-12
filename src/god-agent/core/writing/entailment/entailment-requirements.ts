/**
 * Typed Entailment Relations - Validation Requirements
 *
 * This module defines the validation requirements specific to each
 * entailment type. Different types of claim-evidence relationships
 * require different validation strategies and thresholds.
 *
 * @module entailment-requirements
 */

import { EntailmentRelationType, MarkerType } from './entailment-types.js';

// =============================================================================
// VALIDATION REQUIREMENTS
// =============================================================================

/**
 * Validation requirements specific to each entailment type
 */
export interface EntailmentValidationRequirements {
  /** The entailment type */
  type: EntailmentRelationType;

  /** Human-readable description */
  description: string;

  /** Minimum threshold for primary metric (0-1) */
  primaryThreshold: number;

  /** Required markers for this relation type */
  requiredMarkers: MarkerRequirement[];

  /** Evidence requirements */
  evidenceRequirements: EvidenceRequirement;

  /** Additional validation rules to apply */
  additionalRules: string[];
}

/**
 * Requirements for specific markers
 */
export interface MarkerRequirement {
  /** Type of marker required */
  markerType: MarkerType;

  /** Minimum count of this marker type */
  minCount?: number;

  /** Minimum strength for markers of this type */
  minStrength?: number;

  /** Whether this marker is required or optional */
  required: boolean;
}

/**
 * Evidence requirements for validation
 */
export interface EvidenceRequirement {
  /** Minimum number of supporting sources */
  minSources: number;

  /** Whether exact quote is required */
  exactQuoteRequired: boolean;

  /** Whether page number is required */
  pageNumberRequired: boolean;

  /** Whether scholarly secondary support is needed */
  scholarlySupport: 'required' | 'recommended' | 'optional';

  /** Additional evidence constraints */
  constraints?: string[];
}

// =============================================================================
// DEFAULT REQUIREMENTS BY TYPE
// =============================================================================

/**
 * Default validation requirements for each entailment type
 *
 * These represent the standard thresholds and requirements for
 * scholarly writing. They can be overridden for specific use cases.
 */
export const ENTAILMENT_REQUIREMENTS: Record<
  EntailmentRelationType,
  EntailmentValidationRequirements
> = {
  // ===========================================================================
  // TEXTUAL ENTAILMENT
  // Near-quotation requiring high lexical overlap
  // ===========================================================================
  textual: {
    type: 'textual',
    description:
      'Near-quotation: claim closely matches source text with high lexical overlap',
    primaryThreshold: 0.85, // High lexical overlap required
    requiredMarkers: [
      {
        markerType: 'lexical',
        minStrength: 0.8,
        required: true,
      },
    ],
    evidenceRequirements: {
      minSources: 1,
      exactQuoteRequired: true,
      pageNumberRequired: true,
      scholarlySupport: 'optional',
      constraints: ['QUOTE_MARKS_PRESENT', 'VERBATIM_MATCH'],
    },
    additionalRules: [
      'EXACT_QUOTE_MATCH',
      'QUOTATION_MARKS_PRESENT',
      'PAGE_NUMBER_REQUIRED',
      'NO_ELLIPSIS_ABUSE',
    ],
  },

  // ===========================================================================
  // PARAPHRASTIC ENTAILMENT
  // Same content with different wording
  // ===========================================================================
  paraphrastic: {
    type: 'paraphrastic',
    description: 'Same content expressed with different wording while preserving meaning',
    primaryThreshold: 0.7, // Semantic similarity threshold
    requiredMarkers: [
      {
        markerType: 'semantic',
        minStrength: 0.7,
        required: true,
      },
    ],
    evidenceRequirements: {
      minSources: 1,
      exactQuoteRequired: false,
      pageNumberRequired: true,
      scholarlySupport: 'optional',
      constraints: ['CONTENT_PRESERVED', 'MEANING_EQUIVALENT'],
    },
    additionalRules: [
      'CONTENT_PRESERVATION',
      'NO_MEANING_DRIFT',
      'CITATION_REQUIRED',
      'ACCURATE_REPRESENTATION',
    ],
  },

  // ===========================================================================
  // CONCEPTUAL ENTAILMENT
  // Same concept across different vocabularies/frameworks
  // ===========================================================================
  conceptual: {
    type: 'conceptual',
    description:
      'Same concept expressed using different vocabulary or theoretical framework',
    primaryThreshold: 0.6, // Term alignment threshold
    requiredMarkers: [
      {
        markerType: 'semantic',
        minStrength: 0.5,
        required: true,
      },
      {
        markerType: 'lexical',
        minCount: 2,
        required: false, // Optional but helpful
      },
    ],
    evidenceRequirements: {
      minSources: 1,
      exactQuoteRequired: false,
      pageNumberRequired: false,
      scholarlySupport: 'recommended',
      constraints: ['TERMINOLOGY_ALIGNED', 'FRAMEWORK_CONSISTENT'],
    },
    additionalRules: [
      'TERMINOLOGY_MAPPING',
      'FRAMEWORK_CONSISTENCY',
      'SCHOLARLY_SUPPORT_RECOMMENDED',
      'EXPLICIT_TRANSLATION',
    ],
  },

  // ===========================================================================
  // INFERENTIAL ENTAILMENT
  // Conclusion drawn from explicit premises
  // ===========================================================================
  inferential: {
    type: 'inferential',
    description: 'Conclusion drawn from explicitly stated and grounded premises',
    primaryThreshold: 0.8, // Premise coverage threshold
    requiredMarkers: [
      {
        markerType: 'logical',
        minStrength: 0.7,
        required: true,
      },
    ],
    evidenceRequirements: {
      minSources: 1,
      exactQuoteRequired: false,
      pageNumberRequired: true,
      scholarlySupport: 'recommended',
      constraints: ['PREMISES_GROUNDED', 'VALID_INFERENCE'],
    },
    additionalRules: [
      'PREMISES_EXPLICIT',
      'INFERENCE_VALID',
      'NO_HIDDEN_PREMISES',
      'CONCLUSION_FOLLOWS',
      'LOGICAL_MARKERS_PRESENT',
    ],
  },

  // ===========================================================================
  // ANALOGICAL ENTAILMENT
  // Cross-framework or cross-domain mapping
  // ===========================================================================
  analogical: {
    type: 'analogical',
    description:
      'Cross-framework mapping requiring explicit bridging between domains or thinkers',
    primaryThreshold: 0.5, // Bridge explicitness threshold (lower because harder)
    requiredMarkers: [
      {
        markerType: 'rhetorical',
        minStrength: 0.6,
        required: true,
      },
    ],
    evidenceRequirements: {
      minSources: 2, // Need both sides of analogy
      exactQuoteRequired: false,
      pageNumberRequired: false,
      scholarlySupport: 'required', // Scholarly support crucial for analogies
      constraints: ['BOTH_SIDES_GROUNDED', 'BRIDGE_EXPLICIT'],
    },
    additionalRules: [
      'BRIDGE_TEXT_PRESENT',
      'MAPPING_EXPLICIT',
      'DISANALOGY_ACKNOWLEDGED',
      'MULTI_SOURCE_REQUIRED',
      'SCHOLARLY_PRECEDENT',
    ],
  },

  // ===========================================================================
  // EVALUATIVE ENTAILMENT
  // Value judgment requiring argumentative support
  // ===========================================================================
  evaluative: {
    type: 'evaluative',
    description:
      'Value judgment or assessment requiring argumentative justification, not just citation',
    primaryThreshold: 0.6, // Argument presence threshold
    requiredMarkers: [
      {
        markerType: 'rhetorical',
        minStrength: 0.5,
        required: true,
      },
    ],
    evidenceRequirements: {
      minSources: 1,
      exactQuoteRequired: false,
      pageNumberRequired: false,
      scholarlySupport: 'recommended',
      constraints: ['ARGUMENT_PRESENT', 'CRITERIA_EXPLICIT'],
    },
    additionalRules: [
      'ARGUMENT_STRUCTURE_PRESENT',
      'CRITERIA_EXPLICIT',
      'JUDGMENT_JUSTIFIED',
      'NOT_MERE_ASSERTION',
      'EVALUATION_GROUNDED',
    ],
  },
};

// =============================================================================
// THRESHOLD UTILITIES
// =============================================================================

/**
 * Get the primary threshold for an entailment type
 */
export function getPrimaryThreshold(type: EntailmentRelationType): number {
  return ENTAILMENT_REQUIREMENTS[type].primaryThreshold;
}

/**
 * Check if a confidence score meets the threshold for a type
 */
export function meetsThreshold(type: EntailmentRelationType, confidence: number): boolean {
  return confidence >= ENTAILMENT_REQUIREMENTS[type].primaryThreshold;
}

/**
 * Get all required markers for an entailment type
 */
export function getRequiredMarkers(type: EntailmentRelationType): MarkerRequirement[] {
  return ENTAILMENT_REQUIREMENTS[type].requiredMarkers.filter((m) => m.required);
}

/**
 * Get the evidence requirements for an entailment type
 */
export function getEvidenceRequirements(type: EntailmentRelationType): EvidenceRequirement {
  return ENTAILMENT_REQUIREMENTS[type].evidenceRequirements;
}

/**
 * Get the additional rules for an entailment type
 */
export function getAdditionalRules(type: EntailmentRelationType): string[] {
  return ENTAILMENT_REQUIREMENTS[type].additionalRules;
}

// =============================================================================
// REQUIREMENT VALIDATION
// =============================================================================

/**
 * Result of validating against entailment requirements
 */
export interface RequirementValidationResult {
  /** Whether all requirements are met */
  passed: boolean;

  /** The entailment type being validated */
  type: EntailmentRelationType;

  /** Primary metric score */
  primaryScore: number;

  /** Whether primary threshold is met */
  primaryThresholdMet: boolean;

  /** Marker validation results */
  markerResults: MarkerValidationResult[];

  /** Evidence validation results */
  evidenceResult: EvidenceValidationResult;

  /** Rules that were checked */
  rulesChecked: string[];

  /** Rules that failed */
  rulesFailed: string[];

  /** Human-readable summary */
  summary: string;
}

/**
 * Result of validating a marker requirement
 */
export interface MarkerValidationResult {
  /** The marker requirement */
  requirement: MarkerRequirement;

  /** Whether the requirement is satisfied */
  satisfied: boolean;

  /** Actual count found */
  actualCount: number;

  /** Maximum strength found */
  maxStrength: number;
}

/**
 * Result of validating evidence requirements
 */
export interface EvidenceValidationResult {
  /** Whether all evidence requirements are met */
  satisfied: boolean;

  /** Actual source count */
  sourceCount: number;

  /** Whether exact quote requirement is met */
  exactQuoteMet: boolean;

  /** Whether page number requirement is met */
  pageNumberMet: boolean;

  /** Scholarly support status */
  scholarlySupport: 'present' | 'absent' | 'not_required';

  /** Constraint violations */
  constraintViolations: string[];
}

/**
 * Validate an entailment relation against its type's requirements
 */
export function validateAgainstRequirements(
  relation: {
    type: EntailmentRelationType;
    confidence: number;
    evidence: {
      markers: Array<{ type: MarkerType; strength: number }>;
      sourceMetadata: { page?: number | string };
    };
  },
  sourceCount: number = 1,
  hasScholarlySupport: boolean = false,
  hasExactQuote: boolean = false
): RequirementValidationResult {
  const requirements = ENTAILMENT_REQUIREMENTS[relation.type];

  // Validate primary threshold
  const primaryThresholdMet = relation.confidence >= requirements.primaryThreshold;

  // Validate markers
  const markerResults: MarkerValidationResult[] = requirements.requiredMarkers.map((req) => {
    const matchingMarkers = relation.evidence.markers.filter((m) => m.type === req.markerType);
    const actualCount = matchingMarkers.length;
    const maxStrength = Math.max(0, ...matchingMarkers.map((m) => m.strength));

    const countMet = req.minCount === undefined || actualCount >= req.minCount;
    const strengthMet = req.minStrength === undefined || maxStrength >= req.minStrength;

    return {
      requirement: req,
      satisfied: !req.required || (countMet && strengthMet),
      actualCount,
      maxStrength,
    };
  });

  // Validate evidence requirements
  const evidenceReq = requirements.evidenceRequirements;
  const pageNumberMet = !evidenceReq.pageNumberRequired || relation.evidence.sourceMetadata.page != null;
  const exactQuoteMet = !evidenceReq.exactQuoteRequired || hasExactQuote;
  const sourceCountMet = sourceCount >= evidenceReq.minSources;

  let scholarlySupportStatus: 'present' | 'absent' | 'not_required';
  let scholarlySatisfied: boolean;
  if (evidenceReq.scholarlySupport === 'required') {
    scholarlySupportStatus = hasScholarlySupport ? 'present' : 'absent';
    scholarlySatisfied = hasScholarlySupport;
  } else if (evidenceReq.scholarlySupport === 'recommended') {
    scholarlySupportStatus = hasScholarlySupport ? 'present' : 'absent';
    scholarlySatisfied = true; // Recommended, not required
  } else {
    scholarlySupportStatus = 'not_required';
    scholarlySatisfied = true;
  }

  const evidenceResult: EvidenceValidationResult = {
    satisfied: pageNumberMet && exactQuoteMet && sourceCountMet && scholarlySatisfied,
    sourceCount,
    exactQuoteMet,
    pageNumberMet,
    scholarlySupport: scholarlySupportStatus,
    constraintViolations: [],
  };

  // Check rules
  const rulesFailed: string[] = [];
  if (!primaryThresholdMet) {
    rulesFailed.push('PRIMARY_THRESHOLD_NOT_MET');
  }
  if (!pageNumberMet) {
    rulesFailed.push('PAGE_NUMBER_REQUIRED');
  }
  if (!exactQuoteMet) {
    rulesFailed.push('EXACT_QUOTE_REQUIRED');
  }
  if (!sourceCountMet) {
    rulesFailed.push('INSUFFICIENT_SOURCES');
  }
  if (evidenceReq.scholarlySupport === 'required' && !hasScholarlySupport) {
    rulesFailed.push('SCHOLARLY_SUPPORT_REQUIRED');
  }

  const allMarkersSatisfied = markerResults.every((r) => r.satisfied);
  if (!allMarkersSatisfied) {
    rulesFailed.push('MARKER_REQUIREMENTS_NOT_MET');
  }

  const passed =
    primaryThresholdMet && allMarkersSatisfied && evidenceResult.satisfied && rulesFailed.length === 0;

  // Generate summary
  const summary = passed
    ? `${relation.type} entailment requirements satisfied (confidence: ${relation.confidence.toFixed(2)})`
    : `${relation.type} entailment requirements NOT satisfied: ${rulesFailed.join(', ')}`;

  return {
    passed,
    type: relation.type,
    primaryScore: relation.confidence,
    primaryThresholdMet,
    markerResults,
    evidenceResult,
    rulesChecked: requirements.additionalRules,
    rulesFailed,
    summary,
  };
}

// =============================================================================
// THRESHOLD ADJUSTMENT
// =============================================================================

/**
 * Adjusted thresholds for different contexts
 */
export interface ThresholdAdjustment {
  /** Multiplier for primary threshold (1.0 = no change) */
  primaryMultiplier: number;

  /** Reason for adjustment */
  reason: string;
}

/**
 * Context-based threshold adjustments
 */
export const THRESHOLD_ADJUSTMENTS: Record<string, ThresholdAdjustment> = {
  // Speculative claims get lower thresholds
  speculative: {
    primaryMultiplier: 0.8,
    reason: 'Speculative claims have reduced validation burden',
  },

  // Hypothetical claims get lower thresholds
  hypothetical: {
    primaryMultiplier: 0.75,
    reason: 'Hypothetical claims are exploratory',
  },

  // Direct attribution with explicit qualifier gets higher thresholds
  explicitAttribution: {
    primaryMultiplier: 1.1,
    reason: 'Explicit attribution claims require stronger evidence',
  },

  // Definitional claims need precise evidence
  definitional: {
    primaryMultiplier: 1.05,
    reason: 'Definitions must be accurately represented',
  },

  // Dissertation/formal context
  formal: {
    primaryMultiplier: 1.0,
    reason: 'Standard academic requirements',
  },

  // Draft/exploratory context
  draft: {
    primaryMultiplier: 0.85,
    reason: 'Draft content has relaxed requirements',
  },
};

/**
 * Get adjusted threshold for a type given context
 */
export function getAdjustedThreshold(
  type: EntailmentRelationType,
  adjustmentKey?: string
): number {
  const baseThreshold = ENTAILMENT_REQUIREMENTS[type].primaryThreshold;

  if (!adjustmentKey || !THRESHOLD_ADJUSTMENTS[adjustmentKey]) {
    return baseThreshold;
  }

  const adjusted = baseThreshold * THRESHOLD_ADJUSTMENTS[adjustmentKey].primaryMultiplier;

  // Clamp to valid range
  return Math.max(0.3, Math.min(0.99, adjusted));
}
