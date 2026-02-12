/**
 * Typed Entailment Relations - ClaimProfile Integration
 *
 * This module extends the existing ClaimProfile system with entailment
 * information, enabling compositional reasoning about both claim
 * characteristics and evidence relationships.
 *
 * @module claim-entailment-profile
 */

import {
  ClaimProfile,
  AttributionType,
  AttributionQualifier,
  AssertionType,
  StructureType,
  ModalityType,
  EpistemicForceType,
} from '../claim-profile.js';
import {
  EntailmentRelationType,
  EntailmentRelation,
  EntailmentProfile,
  createDefaultEntailmentProfile,
} from './entailment-types.js';

// =============================================================================
// EXTENDED PROFILE TYPE
// =============================================================================

/**
 * Extended claim profile that includes entailment information
 *
 * This interface extends the base ClaimProfile with entailment data,
 * enabling compositional validation rules that consider both claim
 * characteristics and evidence relationships.
 */
export interface ClaimEntailmentProfile extends ClaimProfile {
  /** Detected entailment relations for this claim */
  entailment: EntailmentProfile;
}

/**
 * Type guard for ClaimEntailmentProfile
 */
export function isClaimEntailmentProfile(value: unknown): value is ClaimEntailmentProfile {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    'attribution' in obj &&
    'assertion' in obj &&
    'structure' in obj &&
    'modality' in obj &&
    'epistemicForce' in obj &&
    'entailment' in obj
  );
}

/**
 * Create a ClaimEntailmentProfile from a ClaimProfile
 */
export function extendWithEntailment(
  profile: ClaimProfile,
  entailment?: EntailmentProfile
): ClaimEntailmentProfile {
  return {
    ...profile,
    entailment: entailment || createDefaultEntailmentProfile(),
  };
}

// =============================================================================
// PROFILE-ENTAILMENT MAPPINGS
// =============================================================================

/**
 * Strength of entailment expectation
 */
export type ExpectationStrength = 'required' | 'recommended' | 'optional';

/**
 * Mapping from ClaimProfile conditions to expected entailment types
 */
export interface ProfileEntailmentMapping {
  /** Human-readable identifier */
  id: string;

  /** Description of this mapping */
  description: string;

  /** Condition that must be true for this mapping to apply */
  condition: (profile: ClaimProfile) => boolean;

  /** Expected entailment types when condition is true */
  expectedTypes: EntailmentRelationType[];

  /** How strongly the entailment type is expected */
  strength: ExpectationStrength;

  /** Priority for conflict resolution (higher = higher priority) */
  priority: number;
}

/**
 * Profile-to-entailment expectation mappings
 *
 * These mappings define what entailment types are expected based on
 * the characteristics of a claim. They enable validation rules to
 * check for appropriate claim-evidence relationships.
 */
export const PROFILE_ENTAILMENT_EXPECTATIONS: ProfileEntailmentMapping[] = [
  // ===========================================================================
  // ATTRIBUTION-BASED EXPECTATIONS
  // ===========================================================================
  {
    id: 'DIRECT_EXPLICIT_TEXTUAL',
    description: 'Direct attribution with explicit qualifier expects textual entailment',
    condition: (p: ClaimProfile) =>
      p.attribution.type === AttributionType.DIRECT &&
      p.attribution.qualifier === AttributionQualifier.EXPLICIT,
    expectedTypes: ['textual'],
    strength: 'required',
    priority: 50,
  },
  {
    id: 'DIRECT_DEMONSTRATIVE_TEXTUAL',
    description: 'Demonstrative attribution expects textual or paraphrastic entailment',
    condition: (p: ClaimProfile) =>
      p.attribution.type === AttributionType.DIRECT &&
      p.attribution.qualifier === AttributionQualifier.DEMONSTRATIVE,
    expectedTypes: ['textual', 'paraphrastic'],
    strength: 'required',
    priority: 45,
  },
  {
    id: 'DIRECT_UNQUALIFIED',
    description: 'Direct attribution without qualifier expects textual or paraphrastic',
    condition: (p: ClaimProfile) =>
      p.attribution.type === AttributionType.DIRECT &&
      p.attribution.qualifier === undefined,
    expectedTypes: ['textual', 'paraphrastic'],
    strength: 'required',
    priority: 40,
  },
  {
    id: 'INTERPRETIVE_CONCEPTUAL',
    description: 'Interpretive attribution expects conceptual or paraphrastic entailment',
    condition: (p: ClaimProfile) => p.attribution.type === AttributionType.INTERPRETIVE,
    expectedTypes: ['conceptual', 'paraphrastic'],
    strength: 'recommended',
    priority: 35,
  },
  {
    id: 'CONSENSUS_CONCEPTUAL',
    description: 'Consensus attribution typically uses conceptual entailment',
    condition: (p: ClaimProfile) => p.attribution.type === AttributionType.CONSENSUS,
    expectedTypes: ['conceptual', 'paraphrastic'],
    strength: 'recommended',
    priority: 30,
  },

  // ===========================================================================
  // ASSERTION-BASED EXPECTATIONS
  // ===========================================================================
  {
    id: 'DEFINITIONAL_TEXTUAL',
    description: 'Definitional assertions expect textual or paraphrastic entailment',
    condition: (p: ClaimProfile) => p.assertion.type === AssertionType.DEFINITIONAL,
    expectedTypes: ['textual', 'paraphrastic'],
    strength: 'required',
    priority: 45,
  },
  {
    id: 'COMPARATIVE_ANALOGICAL',
    description: 'Comparative assertions may use analogical entailment',
    condition: (p: ClaimProfile) =>
      p.assertion.type === AssertionType.COMPARATIVE ||
      p.assertion.type === AssertionType.CONTRASTIVE,
    expectedTypes: ['analogical', 'conceptual'],
    strength: 'recommended',
    priority: 35,
  },
  {
    id: 'ALIGNMENT_ANALOGICAL',
    description: 'Alignment assertions require analogical entailment',
    condition: (p: ClaimProfile) => p.assertion.type === AssertionType.ALIGNMENT,
    expectedTypes: ['analogical'],
    strength: 'required',
    priority: 50,
  },
  {
    id: 'GENEALOGICAL_ANALOGICAL',
    description: 'Genealogical assertions typically use analogical entailment',
    condition: (p: ClaimProfile) => p.assertion.type === AssertionType.GENEALOGICAL,
    expectedTypes: ['analogical', 'conceptual'],
    strength: 'recommended',
    priority: 35,
  },

  // ===========================================================================
  // STRUCTURE-BASED EXPECTATIONS
  // ===========================================================================
  {
    id: 'INFERENTIAL_STRUCTURE',
    description: 'Inferential structure expects inferential entailment',
    condition: (p: ClaimProfile) => p.structure.type === StructureType.INFERENTIAL,
    expectedTypes: ['inferential'],
    strength: 'required',
    priority: 50,
  },
  {
    id: 'EXPLANATORY_INFERENTIAL',
    description: 'Explanatory structure typically uses inferential entailment',
    condition: (p: ClaimProfile) => p.structure.type === StructureType.EXPLANATORY,
    expectedTypes: ['inferential', 'conceptual'],
    strength: 'recommended',
    priority: 40,
  },

  // ===========================================================================
  // MODALITY-BASED EXPECTATIONS
  // ===========================================================================
  {
    id: 'SPECULATIVE_REDUCED',
    description: 'Speculative modality reduces entailment requirements',
    condition: (p: ClaimProfile) =>
      p.modality.type === ModalityType.SPECULATIVE ||
      p.modality.type === ModalityType.HYPOTHETICAL,
    expectedTypes: ['conceptual', 'inferential'],
    strength: 'optional',
    priority: 20,
  },
  {
    id: 'INTERPRETED_CONCEPTUAL',
    description: 'Interpreted modality suggests conceptual entailment',
    condition: (p: ClaimProfile) => p.modality.type === ModalityType.INTERPRETED,
    expectedTypes: ['conceptual', 'paraphrastic'],
    strength: 'recommended',
    priority: 30,
  },

  // ===========================================================================
  // EPISTEMIC FORCE-BASED EXPECTATIONS
  // ===========================================================================
  {
    id: 'EVALUATIVE_FORCE',
    description: 'Evaluative epistemic force expects evaluative entailment',
    condition: (p: ClaimProfile) => p.epistemicForce.type === EpistemicForceType.EVALUATIVE,
    expectedTypes: ['evaluative'],
    strength: 'recommended',
    priority: 40,
  },
  {
    id: 'NORMATIVE_EVALUATIVE',
    description: 'Normative epistemic force may use evaluative entailment',
    condition: (p: ClaimProfile) => p.epistemicForce.type === EpistemicForceType.NORMATIVE,
    expectedTypes: ['evaluative', 'inferential'],
    strength: 'recommended',
    priority: 35,
  },
  {
    id: 'EXPLANATORY_FORCE_INFERENTIAL',
    description: 'Explanatory epistemic force expects inferential entailment',
    condition: (p: ClaimProfile) => p.epistemicForce.type === EpistemicForceType.EXPLANATORY,
    expectedTypes: ['inferential', 'conceptual'],
    strength: 'recommended',
    priority: 35,
  },
];

// =============================================================================
// EXPECTATION UTILITIES
// =============================================================================

/**
 * Result of checking entailment expectations
 */
export interface ExpectationCheckResult {
  /** Whether expectations are met */
  met: boolean;

  /** Matching mappings */
  matchingMappings: ProfileEntailmentMapping[];

  /** Expected types based on profile */
  expectedTypes: EntailmentRelationType[];

  /** Actual entailment type */
  actualType: EntailmentRelationType | null;

  /** Whether actual type matches any expected type */
  typeMatches: boolean;

  /** Strength of the strongest unmet expectation */
  unmetStrength: ExpectationStrength | null;

  /** Human-readable explanation */
  explanation: string;
}

/**
 * Get expected entailment types for a claim profile
 */
export function getExpectedEntailmentTypes(
  profile: ClaimProfile
): {
  types: EntailmentRelationType[];
  strength: ExpectationStrength;
  mappings: ProfileEntailmentMapping[];
} {
  const matchingMappings = PROFILE_ENTAILMENT_EXPECTATIONS.filter((m) =>
    m.condition(profile)
  ).sort((a, b) => b.priority - a.priority);

  if (matchingMappings.length === 0) {
    return {
      types: ['textual', 'paraphrastic', 'conceptual', 'inferential', 'analogical', 'evaluative'],
      strength: 'optional',
      mappings: [],
    };
  }

  // Collect expected types from highest priority mappings
  const types = new Set<EntailmentRelationType>();
  let strength: ExpectationStrength = 'optional';

  for (const mapping of matchingMappings) {
    for (const type of mapping.expectedTypes) {
      types.add(type);
    }
    // Use strongest strength
    if (mapping.strength === 'required') {
      strength = 'required';
    } else if (mapping.strength === 'recommended' && strength !== 'required') {
      strength = 'recommended';
    }
  }

  return {
    types: Array.from(types),
    strength,
    mappings: matchingMappings,
  };
}

/**
 * Check if an entailment relation meets expectations for a profile
 */
export function checkEntailmentExpectations(
  profile: ClaimProfile,
  entailment: EntailmentRelation | null
): ExpectationCheckResult {
  const { types: expectedTypes, strength, mappings } = getExpectedEntailmentTypes(profile);

  const actualType = entailment?.type || null;
  const typeMatches = actualType !== null && expectedTypes.includes(actualType);

  let met = true;
  let unmetStrength: ExpectationStrength | null = null;

  if (!typeMatches) {
    if (strength === 'required') {
      met = false;
      unmetStrength = 'required';
    } else if (strength === 'recommended') {
      // Recommended but not met - still passes but with warning
      unmetStrength = 'recommended';
    }
  }

  let explanation: string;
  if (met && typeMatches) {
    explanation = `Entailment type '${actualType}' matches expected types for this claim profile`;
  } else if (met && !typeMatches) {
    explanation = actualType
      ? `Entailment type '${actualType}' differs from expected (${expectedTypes.join(', ')}), but not required`
      : `No entailment detected; expected types (${expectedTypes.join(', ')}) are ${strength}`;
  } else {
    explanation = actualType
      ? `Entailment type '${actualType}' does not match required types (${expectedTypes.join(', ')})`
      : `No entailment detected but ${strength} types expected: ${expectedTypes.join(', ')}`;
  }

  return {
    met,
    matchingMappings: mappings,
    expectedTypes,
    actualType,
    typeMatches,
    unmetStrength,
    explanation,
  };
}

/**
 * Get mismatches between profile and entailment
 */
export function getProfileEntailmentMismatches(
  profile: ClaimProfile,
  entailment: EntailmentRelation | null
): string[] {
  const mismatches: string[] = [];
  const { types: expectedTypes, mappings } = getExpectedEntailmentTypes(profile);
  const actualType = entailment?.type || null;

  // Check for type mismatch
  if (actualType && !expectedTypes.includes(actualType)) {
    const requiredMappings = mappings.filter((m) => m.strength === 'required');
    if (requiredMappings.length > 0) {
      mismatches.push(
        `ENTAILMENT_TYPE_MISMATCH: Got '${actualType}', expected one of: ${expectedTypes.join(', ')}`
      );
    }
  }

  // Specific mismatch checks
  if (
    profile.attribution.type === AttributionType.DIRECT &&
    profile.attribution.qualifier === AttributionQualifier.EXPLICIT &&
    actualType !== 'textual'
  ) {
    mismatches.push(
      `EXPLICIT_ATTRIBUTION_REQUIRES_TEXTUAL: Explicit direct attribution should have textual entailment`
    );
  }

  if (
    profile.assertion.type === AssertionType.ALIGNMENT &&
    actualType !== 'analogical'
  ) {
    mismatches.push(
      `ALIGNMENT_REQUIRES_ANALOGICAL: Alignment claims should have analogical entailment`
    );
  }

  if (
    profile.structure.type === StructureType.INFERENTIAL &&
    actualType !== 'inferential'
  ) {
    mismatches.push(
      `INFERENTIAL_STRUCTURE_REQUIRES_INFERENTIAL: Inferential structure should have inferential entailment`
    );
  }

  if (
    profile.epistemicForce.type === EpistemicForceType.EVALUATIVE &&
    actualType === 'textual'
  ) {
    mismatches.push(
      `EVALUATIVE_NOT_TEXTUAL: Evaluative claims require argument, not just quotation`
    );
  }

  return mismatches;
}

// =============================================================================
// COMPOSITE REASONING
// =============================================================================

/**
 * Composite profile-entailment analysis result
 */
export interface CompositeAnalysisResult {
  /** The full extended profile */
  profile: ClaimEntailmentProfile;

  /** Expectation check result */
  expectationCheck: ExpectationCheckResult;

  /** Detected mismatches */
  mismatches: string[];

  /** Risk level based on composite analysis */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  /** Suggested actions */
  suggestions: string[];

  /** Overall validity score (0-1) */
  validityScore: number;
}

/**
 * Perform composite analysis of profile and entailment
 */
export function analyzeComposite(
  profile: ClaimProfile,
  entailment: EntailmentRelation | null
): CompositeAnalysisResult {
  const extendedProfile = extendWithEntailment(profile, entailment ? {
    primary: entailment,
    secondary: [],
    overallStrength: entailment.confidence,
    meetsRequirements: true,
    unmetRequirements: [],
  } : undefined);

  const expectationCheck = checkEntailmentExpectations(profile, entailment);
  const mismatches = getProfileEntailmentMismatches(profile, entailment);

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (!expectationCheck.met) {
    riskLevel = 'critical';
  } else if (mismatches.length > 0) {
    riskLevel = mismatches.length > 2 ? 'high' : 'medium';
  } else if (expectationCheck.unmetStrength === 'recommended') {
    riskLevel = 'medium';
  }

  // Generate suggestions
  const suggestions: string[] = [];

  if (!entailment) {
    suggestions.push('Provide evidence with proper entailment classification');
  }

  if (!expectationCheck.typeMatches && entailment) {
    suggestions.push(
      `Consider using ${expectationCheck.expectedTypes.join(' or ')} entailment for this claim type`
    );
  }

  for (const mismatch of mismatches) {
    if (mismatch.includes('TEXTUAL')) {
      suggestions.push('Use a direct quotation with quotation marks');
    } else if (mismatch.includes('ANALOGICAL')) {
      suggestions.push('Make the cross-framework connection explicit with bridge text');
    } else if (mismatch.includes('INFERENTIAL')) {
      suggestions.push('Ensure premises are explicitly grounded in evidence');
    } else if (mismatch.includes('EVALUATIVE')) {
      suggestions.push('Provide argumentative justification, not just citation');
    }
  }

  // Calculate validity score
  let validityScore = 1.0;

  if (!entailment) {
    validityScore -= 0.4;
  } else {
    validityScore = entailment.confidence;
  }

  if (!expectationCheck.met) {
    validityScore -= 0.3;
  } else if (!expectationCheck.typeMatches) {
    validityScore -= 0.1;
  }

  validityScore -= mismatches.length * 0.1;
  validityScore = Math.max(0, Math.min(1, validityScore));

  return {
    profile: extendedProfile,
    expectationCheck,
    mismatches,
    riskLevel,
    suggestions,
    validityScore,
  };
}
