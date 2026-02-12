/**
 * Multi-Axis Claim Classification System
 *
 * This module defines a comprehensive type system for classifying claims
 * across 5 orthogonal axes. Each axis captures a distinct facet of a claim,
 * enabling compositional validation rules.
 *
 * @module claim-profile
 */

// =============================================================================
// MAIN CLAIM PROFILE INTERFACE
// =============================================================================

/**
 * Multi-axis claim profile that captures orthogonal facets of a claim.
 * Each axis can be classified independently and contributes to
 * compositional validation rules.
 */
export interface ClaimProfile {
  /** Who bears epistemic responsibility for this claim? */
  attribution: AttributionAxis;

  /** What kind of assertion is being made? */
  assertion: AssertionAxis;

  /** What is the logical structure of the claim? */
  structure: StructureAxis;

  /** What is the epistemic stance toward the claim? */
  modality: ModalityAxis;

  /** What is the normative force of the claim? */
  epistemicForce: EpistemicForceAxis;

  /** Confidence scores for each axis classification (0-1) */
  confidence: AxisConfidenceScores;
}

/**
 * Confidence scores for each axis classification
 */
export interface AxisConfidenceScores {
  attribution: number;
  assertion: number;
  structure: number;
  modality: number;
  epistemicForce: number;
}

// =============================================================================
// AXIS 1: ATTRIBUTION
// =============================================================================

/**
 * Attribution Axis: Who is responsible for the claim?
 *
 * This axis governs source anchoring and determines who bears
 * epistemic responsibility for a claim.
 */
export interface AttributionAxis {
  /** Primary attribution type */
  type: AttributionType;

  /** Explicit author(s) if attributed */
  authors?: string[];

  /** Attribution strength modifier */
  qualifier?: AttributionQualifier;

  /** Whether attribution is inherited from context */
  inherited: boolean;

  /** Source of inheritance if applicable */
  inheritedFrom?: string;
}

/**
 * Types of attribution - who is making the claim?
 */
export enum AttributionType {
  /** Claim explicitly attributed to named author: "Aristotle argues that..." */
  DIRECT = 'direct',

  /** Attributed but with hedging: "Aristotle can be read as suggesting..." */
  INTERPRETIVE = 'interpretive',

  /** Attributed to scholarly consensus: "Scholars generally agree..." */
  CONSENSUS = 'consensus',

  /** Attributed to disputed scholarly position: "Some argue X, others Y..." */
  DISPUTED = 'disputed',

  /** Attributed to tradition/standard view: "According to the tradition..." */
  PROXY = 'proxy',

  /** Vague attribution without specific source: "It is widely held..." */
  ANONYMOUS = 'anonymous',

  /** Author's own claim (dissertation author) */
  AUTHORIAL = 'authorial',

  /** Attribution inherited from surrounding context */
  INHERITED = 'inherited',

  /** No attribution - unattributed assertion */
  NONE = 'none',
}

/**
 * Qualifiers that modify attribution strength
 */
export enum AttributionQualifier {
  /** "explicitly claims" - strong commitment to exact wording */
  EXPLICIT = 'explicit',

  /** "clearly argues" - strong interpretive commitment */
  CLEAR = 'clear',

  /** "suggests" - moderate commitment */
  SUGGESTS = 'suggests',

  /** "might be read as" - weak/hedged commitment */
  HEDGED = 'hedged',

  /** "demonstrates" - requires argument structure */
  DEMONSTRATIVE = 'demonstrative',

  /** No qualifier */
  NONE = 'none',
}

// =============================================================================
// AXIS 2: ASSERTION
// =============================================================================

/**
 * Assertion Axis: What kind of assertion is this?
 *
 * This axis captures the semantic category of what is being claimed,
 * which determines what kind of evidence is appropriate.
 */
export interface AssertionAxis {
  /** Primary assertion type */
  type: AssertionType;

  /** Secondary assertion types (claims often have multiple) */
  secondary: AssertionType[];

  /** Specific terms being defined/related if applicable */
  terms?: string[];

  /** Relation type if relational assertion */
  relation?: RelationType;
}

/**
 * Types of assertions - what is being claimed?
 */
export enum AssertionType {
  // === Ontological/Definitional ===
  /** "X is defined as..." - explicit definition */
  DEFINITIONAL = 'definitional',

  /** "X functions to..." - functional characterization */
  FUNCTIONAL = 'functional',

  /** "X is not Y" - negative definition */
  NEGATIVE = 'negative',

  /** "X relates to Y by..." - relational claim */
  RELATIONAL = 'relational',

  /** "X can/cannot exist without Y" - modal claim */
  MODAL = 'modal',

  /** "X is necessary/sufficient for Y" - dependency claim */
  DEPENDENCY = 'dependency',

  // === Factual/Descriptive ===
  /** Straightforward factual claim about what is the case */
  FACTUAL = 'factual',

  /** Claim about historical sequence or development */
  HISTORICAL = 'historical',

  /** Claim about textual content or interpretation */
  TEXTUAL = 'textual',

  // === Comparative ===
  /** "X is like/unlike Y" - comparison */
  COMPARATIVE = 'comparative',

  /** "X rejects what Y accepts" - contrastive */
  CONTRASTIVE = 'contrastive',

  /** "X echoes/anticipates Y" - alignment claim */
  ALIGNMENT = 'alignment',

  /** "X develops from Y" - genealogical claim */
  GENEALOGICAL = 'genealogical',

  // === Evaluative ===
  /** "X successfully achieves..." - evaluative */
  EVALUATIVE = 'evaluative',

  /** "X is central/crucial to..." - significance claim */
  SIGNIFICANCE = 'significance',

  /** "This has been overlooked..." - novelty claim */
  NOVELTY = 'novelty',

  // === Meta-Discursive ===
  /** "This chapter argues..." - scope claim */
  SCOPE = 'scope',

  /** "The following analysis will..." - methodological */
  METHODOLOGICAL = 'methodological',
}

/**
 * Types of relations for relational assertions
 */
export enum RelationType {
  /** X mediates between A and B */
  MEDIATES = 'mediates',

  /** X depends on Y */
  DEPENDS_ON = 'depends_on',

  /** X enables Y */
  ENABLES = 'enables',

  /** X precedes Y */
  PRECEDES = 'precedes',

  /** X is part of Y */
  PART_OF = 'part_of',

  /** X is instance of Y */
  INSTANCE_OF = 'instance_of',

  /** X contrasts with Y */
  CONTRASTS = 'contrasts',

  /** X parallels Y */
  PARALLELS = 'parallels',
}

// =============================================================================
// AXIS 3: STRUCTURE
// =============================================================================

/**
 * Structure Axis: What is the logical form of the claim?
 *
 * This axis determines how complex claims should be decomposed
 * and how validation should propagate through logical structure.
 */
export interface StructureAxis {
  /** Primary structural type */
  type: StructureType;

  /** Logical connectives present */
  connectives: LogicalConnective[];

  /** Number of atomic subclaims if composite */
  atomicClaimCount: number;

  /** Inference type if inferential */
  inferenceType?: InferenceType;

  /** Premise IDs if this is a conclusion */
  premiseIds?: string[];
}

/**
 * Types of logical structure
 */
export enum StructureType {
  /** Single, indivisible proposition */
  ATOMIC = 'atomic',

  /** Multiple claims joined by 'and' */
  CONJUNCTIVE = 'conjunctive',

  /** Alternative claims joined by 'or' */
  DISJUNCTIVE = 'disjunctive',

  /** If-then structure */
  CONDITIONAL = 'conditional',

  /** Derived from premises (therefore, thus, hence) */
  INFERENTIAL = 'inferential',

  /** Causal explanation (because, explains why) */
  EXPLANATORY = 'explanatory',

  /** Multiple parallel claims about different subjects */
  PARALLEL = 'parallel',

  /** Temporal sequence of claims */
  SEQUENTIAL = 'sequential',
}

/**
 * Logical connectives that can appear in claims
 */
export enum LogicalConnective {
  AND = 'and',
  OR = 'or',
  IF_THEN = 'if_then',
  THEREFORE = 'therefore',
  BECAUSE = 'because',
  WHILE = 'while',
  WHEREAS = 'whereas',
  BOTH = 'both',
  NEITHER = 'neither',
  EITHER = 'either',
}

/**
 * Types of inference for inferential claims
 */
export enum InferenceType {
  /** Logically necessary conclusion */
  DEDUCTIVE = 'deductive',

  /** Probable conclusion */
  INDUCTIVE = 'inductive',

  /** Best explanation */
  ABDUCTIVE = 'abductive',

  /** From general to specific */
  INSTANTIATION = 'instantiation',

  /** From specific to general */
  GENERALIZATION = 'generalization',
}

// =============================================================================
// AXIS 4: MODALITY
// =============================================================================

/**
 * Modality Axis: What is the epistemic stance toward the claim?
 *
 * This axis captures how confidently/tentatively the claim is presented,
 * which affects validation stringency.
 */
export interface ModalityAxis {
  /** Primary modality type */
  type: ModalityType;

  /** Hedging markers present */
  hedges: HedgeMarker[];

  /** Commitment level (0-1, 1 = full commitment) */
  commitmentLevel: number;

  /** Whether claim is presented as author's own view or reported */
  perspective: 'endorsed' | 'reported' | 'hypothetical';
}

/**
 * Types of epistemic modality
 */
export enum ModalityType {
  /** Stated as fact: "X is the case" */
  ASSERTED = 'asserted',

  /** Presented as interpretation: "X can be read as..." */
  INTERPRETED = 'interpreted',

  /** Tentatively proposed: "X might be..." */
  SPECULATIVE = 'speculative',

  /** Conditional/counterfactual: "If X were the case..." */
  HYPOTHETICAL = 'hypothetical',

  /** Conceded point: "While X is true..." */
  CONCESSIVE = 'concessive',

  /** Questioned: "Whether X is the case..." */
  INTERROGATIVE = 'interrogative',

  /** Denied: "X is not the case" */
  NEGATED = 'negated',
}

/**
 * Hedging markers that modify commitment
 */
export enum HedgeMarker {
  /** "might", "may", "could" */
  POSSIBILITY = 'possibility',

  /** "probably", "likely" */
  PROBABILITY = 'probability',

  /** "seems", "appears" */
  APPEARANCE = 'appearance',

  /** "arguably", "perhaps" */
  ARGUABILITY = 'arguability',

  /** "in some sense", "to some extent" */
  QUALIFICATION = 'qualification',

  /** "I suggest", "I argue" */
  PERSONAL = 'personal',

  /** "can be read as", "might be understood as" */
  INTERPRETIVE = 'interpretive',
}

// =============================================================================
// AXIS 5: EPISTEMIC FORCE
// =============================================================================

/**
 * Epistemic Force Axis: What is the normative force of the claim?
 *
 * This axis distinguishes between describing what is, evaluating
 * what is good/bad, and prescribing what should be.
 */
export interface EpistemicForceAxis {
  /** Primary force type */
  type: EpistemicForceType;

  /** Evaluative terms present */
  evaluativeTerms: string[];

  /** Strength of normative language (0-1) */
  normativeStrength: number;
}

/**
 * Types of epistemic force
 */
export enum EpistemicForceType {
  /** Describing what is the case: "X is Y" */
  DESCRIPTIVE = 'descriptive',

  /** Evaluating quality/value: "X successfully achieves..." */
  EVALUATIVE = 'evaluative',

  /** Prescribing what should be: "X should be understood as..." */
  NORMATIVE = 'normative',

  /** Explaining why/how: "X accounts for Y because..." */
  EXPLANATORY = 'explanatory',

  /** Questioning/challenging: "This raises the question of..." */
  CRITICAL = 'critical',
}

// =============================================================================
// VALIDATION REQUIREMENTS (Output of Rule Engine)
// =============================================================================

/**
 * Validation requirements computed from claim profile composition.
 * This is the key output of the compositional rule engine.
 */
export interface ComposedValidationRequirements {
  /** Citation requirement level */
  citationRequired: 'mandatory' | 'recommended' | 'optional';

  /** Whether exact textual grounding is needed */
  exactGroundingRequired: boolean;

  /** Whether justification/reasoning is required */
  justificationRequired: boolean;

  /** Whether multiple sources are needed */
  multiSourceRequired: boolean;

  /** Minimum number of sources if multiSourceRequired */
  minSourceCount?: number;

  /** Whether scholarly support is needed */
  scholarlySupport: 'required' | 'recommended' | 'optional';

  /** Whether argument structure must be verified */
  argumentStructureRequired: boolean;

  /** Specific validation rules that apply */
  applicableRules: string[];

  /** Explanation of why these requirements apply */
  rationale: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Risk level computed from profile composition
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Default profile factory for creating empty profiles
 */
export function createDefaultProfile(): ClaimProfile {
  return {
    attribution: {
      type: AttributionType.NONE,
      inherited: false,
    },
    assertion: {
      type: AssertionType.FACTUAL,
      secondary: [],
    },
    structure: {
      type: StructureType.ATOMIC,
      connectives: [],
      atomicClaimCount: 1,
    },
    modality: {
      type: ModalityType.ASSERTED,
      hedges: [],
      commitmentLevel: 1,
      perspective: 'endorsed',
    },
    epistemicForce: {
      type: EpistemicForceType.DESCRIPTIVE,
      evaluativeTerms: [],
      normativeStrength: 0,
    },
    confidence: {
      attribution: 0.5,
      assertion: 0.5,
      structure: 0.5,
      modality: 0.5,
      epistemicForce: 0.5,
    },
  };
}

/**
 * Partial profile for creating test profiles or migrations
 */
export type PartialClaimProfile = {
  attribution?: Partial<AttributionAxis>;
  assertion?: Partial<AssertionAxis>;
  structure?: Partial<StructureAxis>;
  modality?: Partial<ModalityAxis>;
  epistemicForce?: Partial<EpistemicForceAxis>;
  confidence?: Partial<AxisConfidenceScores>;
};

/**
 * Merge a partial profile with defaults
 */
export function mergeWithDefaults(partial: PartialClaimProfile): ClaimProfile {
  const defaults = createDefaultProfile();

  return {
    attribution: {
      ...defaults.attribution,
      ...partial.attribution,
    },
    assertion: {
      ...defaults.assertion,
      ...partial.assertion,
      secondary: partial.assertion?.secondary ?? defaults.assertion.secondary,
    },
    structure: {
      ...defaults.structure,
      ...partial.structure,
      connectives: partial.structure?.connectives ?? defaults.structure.connectives,
    },
    modality: {
      ...defaults.modality,
      ...partial.modality,
      hedges: partial.modality?.hedges ?? defaults.modality.hedges,
    },
    epistemicForce: {
      ...defaults.epistemicForce,
      ...partial.epistemicForce,
      evaluativeTerms:
        partial.epistemicForce?.evaluativeTerms ?? defaults.epistemicForce.evaluativeTerms,
    },
    confidence: {
      ...defaults.confidence,
      ...partial.confidence,
    },
  };
}
