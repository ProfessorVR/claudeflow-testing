/**
 * Segment Interface - Interface contracts for composition
 *
 * This module defines the interface contracts that segments publish.
 * Each segment declares what it requires (input assumptions) and what
 * it provides (output contributions), enabling interface-based composition.
 *
 * @module segment-interface
 */

import type { ToulminClaim } from '../sir/claim-map.js';
import type { ConceptEntry } from '../sir/concept-ledger.js';

/**
 * Segment interface contract
 */
export interface SegmentInterface {
  /** Segment identifier */
  id: string;

  /** Segment location */
  location: SegmentLocation;

  /** Input assumptions (what this segment requires) */
  inputAssumptions: SegmentInputAssumptions;

  /** Output contributions (what this segment provides) */
  outputContributions: SegmentOutputContributions;

  /** Open tensions (intentionally unresolved) */
  openTensions: OpenTension[];

  /** Interface metadata */
  metadata: InterfaceMetadata;
}

/**
 * Segment location
 */
export interface SegmentLocation {
  /** Section ID (e.g., "2.3") */
  sectionId: string;

  /** Subsection ID (optional) */
  subsectionId?: string;

  /** Paragraph range */
  paragraphRange: {
    start: number;
    end: number;
  };
}

/**
 * Segment input assumptions - what segment requires
 */
export interface SegmentInputAssumptions {
  /** Required claims (must be established before this segment) */
  requiredClaims: ClaimReference[];

  /** Required concepts (must be defined before this segment) */
  requiredConcepts: ConceptReference[];

  /** Required threads (narrative threads that must be active) */
  requiredThreads: ThreadReference[];

  /** Required knowledge (background knowledge assumed) */
  requiredKnowledge: KnowledgeReference[];

  /** Dependency strength (how critical each dependency is) */
  dependencyStrength: Map<string, DependencyStrength>;
}

/**
 * Segment output contributions - what segment provides
 */
export interface SegmentOutputContributions {
  /** Claims established (new claims this segment establishes) */
  claimsEstablished: ClaimContribution[];

  /** Concepts introduced (new concepts this segment defines) */
  conceptsIntroduced: ConceptContribution[];

  /** Threads advanced (narrative threads this segment advances) */
  threadsAdvanced: ThreadContribution[];

  /** Knowledge added (new knowledge this segment adds) */
  knowledgeAdded: KnowledgeContribution[];

  /** Contribution strength (how strong each contribution is) */
  contributionStrength: Map<string, ContributionStrength>;
}

/**
 * Claim reference
 */
export interface ClaimReference {
  /** Claim ID */
  id: string;

  /** Claim statement */
  statement: string;

  /** Why this claim is required */
  reason: string;

  /** Is this a hard or soft dependency? */
  isHardDependency: boolean;
}

/**
 * Concept reference
 */
export interface ConceptReference {
  /** Concept term */
  term: string;

  /** Required definition */
  requiredDefinition: string;

  /** Why this concept is required */
  reason: string;

  /** Is this a hard or soft dependency? */
  isHardDependency: boolean;
}

/**
 * Thread reference
 */
export interface ThreadReference {
  /** Thread ID */
  id: string;

  /** Thread name */
  name: string;

  /** Required thread state */
  requiredState: string;

  /** Why this thread is required */
  reason: string;

  /** Is this a hard or soft dependency? */
  isHardDependency: boolean;
}

/**
 * Knowledge reference
 */
export interface KnowledgeReference {
  /** Knowledge ID */
  id: string;

  /** Knowledge description */
  description: string;

  /** Source (where reader should have this knowledge from) */
  source: string;

  /** Is this a hard or soft dependency? */
  isHardDependency: boolean;
}

/**
 * Claim contribution
 */
export interface ClaimContribution {
  /** Claim being established */
  claim: ToulminClaim;

  /** How strongly this segment establishes the claim */
  establishmentStrength: number; // 0-1

  /** Whether claim is fully or partially established */
  isFullyEstablished: boolean;
}

/**
 * Concept contribution
 */
export interface ConceptContribution {
  /** Concept being introduced */
  concept: ConceptEntry;

  /** How clearly this segment defines the concept */
  definitionClarity: number; // 0-1

  /** Whether definition is formal or informal */
  isFormalDefinition: boolean;
}

/**
 * Thread contribution
 */
export interface ThreadContribution {
  /** Thread ID */
  id: string;

  /** Thread name */
  name: string;

  /** How this segment advances the thread */
  advancement: string;

  /** New thread state after this segment */
  newState: string;

  /** Whether thread is completed or ongoing */
  isCompleted: boolean;
}

/**
 * Knowledge contribution
 */
export interface KnowledgeContribution {
  /** Knowledge ID */
  id: string;

  /** Knowledge description */
  description: string;

  /** How this knowledge was established */
  establishment: string;

  /** Whether this is essential or supplementary */
  isEssential: boolean;
}

/**
 * Open tension - intentionally unresolved
 */
export interface OpenTension {
  /** Tension ID */
  id: string;

  /** Tension description */
  description: string;

  /** Why this tension is left open */
  reason: string;

  /** When/how this tension will be resolved */
  resolution: TensionResolution;

  /** Tension type */
  type: 'conceptual' | 'empirical' | 'methodological' | 'theoretical';
}

/**
 * Tension resolution plan
 */
export interface TensionResolution {
  /** Where tension will be resolved */
  location: 'later-in-section' | 'later-section' | 'future-work' | 'inherent';

  /** Specific section where resolution occurs (if known) */
  resolutionSectionId?: string;

  /** How tension will be resolved */
  resolutionStrategy?: string;
}

/**
 * Dependency strength
 */
export type DependencyStrength = 'required' | 'strongly-preferred' | 'preferred' | 'optional';

/**
 * Contribution strength
 */
export type ContributionStrength = 'full' | 'substantial' | 'partial' | 'minor';

/**
 * Interface metadata
 */
export interface InterfaceMetadata {
  /** Number of input dependencies */
  inputDependencyCount: number;

  /** Number of output contributions */
  outputContributionCount: number;

  /** Number of hard dependencies */
  hardDependencyCount: number;

  /** Number of soft dependencies */
  softDependencyCount: number;

  /** Number of open tensions */
  openTensionCount: number;

  /** Interface completeness (0-1) */
  interfaceCompleteness: number;

  /** Interface quality (0-1) */
  interfaceQuality: number;
}

/**
 * Interface mismatch
 */
export interface InterfaceMismatch {
  /** Mismatch ID */
  id: string;

  /** Mismatch type */
  type: 'missing-prerequisite' | 'unused-output' | 'conflicting-definition' | 'broken-thread';

  /** Segment with mismatch */
  segmentId: string;

  /** Required item (claim, concept, thread, knowledge) */
  requiredItem: string;

  /** Providing segment (if any) */
  providingSegmentId?: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Recommendation for fix */
  recommendation: string;

  /** Detailed analysis */
  analysis: MismatchAnalysis;
}

/**
 * Mismatch analysis
 */
export interface MismatchAnalysis {
  /** What is missing or conflicting */
  issue: string;

  /** Why this is a problem */
  impact: string;

  /** Possible solutions */
  possibleSolutions: string[];

  /** Estimated fix difficulty */
  fixDifficulty: 'easy' | 'moderate' | 'hard';
}

/**
 * Calculate interface completeness
 */
export function calculateInterfaceCompleteness(segment: SegmentInterface): number {
  let score = 0;

  // Has input assumptions
  if (segment.inputAssumptions.requiredClaims.length > 0 ||
      segment.inputAssumptions.requiredConcepts.length > 0 ||
      segment.inputAssumptions.requiredThreads.length > 0) {
    score += 0.3;
  }

  // Has output contributions
  if (segment.outputContributions.claimsEstablished.length > 0 ||
      segment.outputContributions.conceptsIntroduced.length > 0 ||
      segment.outputContributions.threadsAdvanced.length > 0) {
    score += 0.3;
  }

  // Has dependency strength annotations
  if (segment.inputAssumptions.dependencyStrength.size > 0) {
    score += 0.2;
  }

  // Has contribution strength annotations
  if (segment.outputContributions.contributionStrength.size > 0) {
    score += 0.2;
  }

  return Math.min(1.0, score);
}

/**
 * Calculate interface quality
 */
export function calculateInterfaceQuality(segment: SegmentInterface): number {
  let score = 0;

  // Input assumptions are specific
  const inputSpecificity = segment.inputAssumptions.requiredClaims.every(c => c.statement.length > 20) &&
                           segment.inputAssumptions.requiredConcepts.every(c => c.requiredDefinition.length > 20);
  if (inputSpecificity) {
    score += 0.3;
  }

  // Output contributions are specific
  const outputSpecificity = segment.outputContributions.claimsEstablished.every(c => c.claim.claim.length > 20) &&
                            segment.outputContributions.conceptsIntroduced.every(c => c.concept.definition.length > 20);
  if (outputSpecificity) {
    score += 0.3;
  }

  // Open tensions are documented
  if (segment.openTensions.length > 0 &&
      segment.openTensions.every(t => t.resolution.resolutionStrategy)) {
    score += 0.2;
  }

  // All dependencies have reasons
  const allHaveReasons = segment.inputAssumptions.requiredClaims.every(c => c.reason.length > 0) &&
                         segment.inputAssumptions.requiredConcepts.every(c => c.reason.length > 0);
  if (allHaveReasons) {
    score += 0.2;
  }

  return Math.min(1.0, score);
}

/**
 * Validate segment interface
 */
export function validateSegmentInterface(segment: SegmentInterface): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Must have at least one input or output
  if (segment.inputAssumptions.requiredClaims.length === 0 &&
      segment.inputAssumptions.requiredConcepts.length === 0 &&
      segment.outputContributions.claimsEstablished.length === 0 &&
      segment.outputContributions.conceptsIntroduced.length === 0) {
    issues.push('Segment has no inputs or outputs');
  }

  // All input claims must have statements
  for (const claim of segment.inputAssumptions.requiredClaims) {
    if (!claim.statement || claim.statement.length === 0) {
      issues.push(`Required claim ${claim.id} has no statement`);
    }
  }

  // All input concepts must have definitions
  for (const concept of segment.inputAssumptions.requiredConcepts) {
    if (!concept.requiredDefinition || concept.requiredDefinition.length === 0) {
      issues.push(`Required concept ${concept.term} has no definition`);
    }
  }

  // All output claims must be valid Toulmin claims
  for (const contrib of segment.outputContributions.claimsEstablished) {
    if (!contrib.claim.claim || contrib.claim.claim.length === 0) {
      issues.push(`Established claim has no statement`);
    }
    if (!contrib.claim.grounds || contrib.claim.grounds.length === 0) {
      issues.push(`Established claim has no grounds`);
    }
  }

  // All output concepts must have definitions
  for (const contrib of segment.outputContributions.conceptsIntroduced) {
    if (!contrib.concept.definition || contrib.concept.definition.length === 0) {
      issues.push(`Introduced concept ${contrib.concept.term} has no definition`);
    }
  }

  // All open tensions must have resolution plans
  for (const tension of segment.openTensions) {
    if (!tension.resolution.location) {
      issues.push(`Open tension ${tension.id} has no resolution plan`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
