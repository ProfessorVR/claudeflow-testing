/**
 * Claim Map - Toulmin structure for each claim
 *
 * This module provides data structures for representing arguments using
 * Toulmin's model of argumentation. Each claim is tracked with its grounds,
 * warrant, backing, qualification, and rebuttal.
 *
 * @module claim-map
 */

/**
 * ToulminClaim - Represents a single claim with full Toulmin structure
 */
export interface ToulminClaim {
  /** Unique claim ID (e.g., "C1", "C2.3") */
  id: string;

  /** The claim statement (thesis/conclusion) */
  claim: string;

  /** Evidence/data supporting the claim (REQUIRED) */
  grounds: string[];

  /** Reasoning connecting grounds to claim (REQUIRED) */
  warrant: string;

  /** Support for the warrant (optional but valuable) */
  backing?: string;

  /** Degree of certainty (optional, e.g., "probably", "most") */
  qualification?: string;

  /** Counterarguments addressed (optional) */
  rebuttal?: string;

  /** Warrant generality score (0-1, target ≥0.7) */
  warrantGenerality: number;

  /** Completeness score (0-1, C+D+W=70%, B+Q+R=30%) */
  completenessScore: number;

  /** Source citations anchoring this claim */
  citations: CitationAnchor[];

  /** Location metadata */
  location: ClaimLocation;

  /** Quality metrics */
  quality: ClaimQuality;
}

/**
 * Citation anchor with full provenance
 */
export interface CitationAnchor {
  /** Citation key (e.g., "Heidegger1962:172") */
  key: string;

  /** Author(s) */
  author: string;

  /** Year of publication */
  year: number;

  /** Page number or paragraph reference */
  locator?: string;

  /** Full citation text */
  fullCitation: string;

  /** Whether this is primary vs secondary support */
  isPrimary: boolean;
}

/**
 * Claim location in document
 */
export interface ClaimLocation {
  /** Section identifier (e.g., "1", "2.3") */
  sectionId: string;

  /** Subsection identifier (optional) */
  subsectionId?: string;

  /** Paragraph index within subsection */
  paragraphIndex: number;

  /** Sentence index within paragraph (optional) */
  sentenceIndex?: number;
}

/**
 * Claim quality metrics
 */
export interface ClaimQuality {
  /** Toulmin completeness (C+D+W required, B+Q+R optional) */
  toulminCompleteness: number; // 0-1

  /** Warrant quality (generality, specificity) */
  warrantQuality: number; // 0-1

  /** Evidence strength (number and quality of grounds) */
  evidenceStrength: number; // 0-1

  /** Counter-argument handling (has rebuttal for controversial claims) */
  counterArgumentHandling: number; // 0-1

  /** Overall claim score (weighted average) */
  overallScore: number; // 0-1
}

/**
 * ClaimMap - Collection of all claims with relationships
 */
export interface ClaimMap {
  /** All claims in document */
  claims: ToulminClaim[];

  /** Claim dependency graph (claim C3 depends on C1, C2) */
  dependencies: Map<string, string[]>;

  /** Claim hierarchy (parent-child relationships) */
  hierarchy: ClaimHierarchy;

  /** Metadata about the claim map */
  metadata: ClaimMapMetadata;
}

/**
 * Claim hierarchy organizing claims by document structure
 */
export interface ClaimHierarchy {
  /** Top-level thesis claim */
  thesis: ToulminClaim;

  /** Supporting claims organized by section */
  sections: ClaimSection[];
}

/**
 * Section containing claims
 */
export interface ClaimSection {
  /** Section identifier */
  sectionId: string;

  /** Section title */
  title: string;

  /** Claims in this section */
  claims: ToulminClaim[];

  /** Subsections (recursive structure) */
  subsections?: ClaimHierarchy[];

  /** Section-level claim (what this section establishes) */
  sectionClaim?: ToulminClaim;
}

/**
 * Metadata about the claim map
 */
export interface ClaimMapMetadata {
  /** Total number of claims */
  totalClaims: number;

  /** Claims with complete Toulmin structure (C+D+W) */
  completeClaims: number;

  /** Claims with rebuttals */
  claimsWithRebuttals: number;

  /** Average warrant generality */
  averageWarrantGenerality: number;

  /** Average completeness score */
  averageCompletenessScore: number;

  /** Average overall quality */
  averageQuality: number;

  /** Validation status */
  validationStatus: ValidationStatus;
}

/**
 * Validation status for claim map
 */
export interface ValidationStatus {
  /** Whether validation passed */
  passed: boolean;

  /** Overall validation score (0-1) */
  score: number;

  /** Validation issues found */
  issues: ValidationIssue[];
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** Issue type */
  type: 'missing-warrant' | 'missing-grounds' | 'weak-warrant' |
        'insufficient-evidence' | 'missing-rebuttal' | 'duplicate-claim';

  /** Claim ID with issue */
  claimId: string;

  /** Description of issue */
  description: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Suggested fix */
  suggestedFix: string;
}

/**
 * Calculate Toulmin completeness score
 *
 * Formula: C+D+W required (70%), B+Q+R optional (30%)
 *
 * @param claim - The Toulmin claim to score
 * @returns Completeness score (0-1)
 */
export function calculateToulminCompleteness(claim: Partial<ToulminClaim>): number {
  let score = 0;

  // Required components (70% total)
  if (claim.claim) score += 0.233; // 23.3%
  if (claim.grounds && claim.grounds.length > 0) score += 0.233; // 23.3%
  if (claim.warrant) score += 0.234; // 23.4%

  // Optional components (30% total)
  if (claim.backing) score += 0.10; // 10%
  if (claim.qualification) score += 0.10; // 10%
  if (claim.rebuttal) score += 0.10; // 10%

  return Math.min(1.0, score);
}

/**
 * Calculate warrant generality score
 *
 * Warrants should be "slightly more general" than claims.
 * Too specific: just restates the claim
 * Too general: doesn't connect to the specific claim
 *
 * @param claim - The claim statement
 * @param warrant - The warrant statement
 * @returns Generality score (0-1), target 0.6-0.8
 */
export function calculateWarrantGenerality(claim: string, warrant: string): number {
  // Simple heuristic: compare abstraction level via word overlap and length

  const claimWords = new Set(claim.toLowerCase().split(/\s+/));
  const warrantWords = new Set(warrant.toLowerCase().split(/\s+/));

  // Calculate word overlap
  const overlap = [...claimWords].filter(w => warrantWords.has(w)).length;
  const overlapRatio = overlap / claimWords.size;

  // Ideal: 30-50% overlap (warrant is related but more general)
  // Too high overlap = warrant too specific
  // Too low overlap = warrant too general/disconnected

  let generalityScore: number;

  if (overlapRatio > 0.7) {
    // Too specific (restates claim)
    generalityScore = 0.3;
  } else if (overlapRatio < 0.2) {
    // Too general (disconnected)
    generalityScore = 0.4;
  } else {
    // Good generality (30-70% overlap)
    // Map 0.2-0.7 to 0.6-1.0
    generalityScore = 0.6 + ((overlapRatio - 0.2) / 0.5) * 0.4;
  }

  return Math.min(1.0, Math.max(0, generalityScore));
}

/**
 * Calculate evidence strength based on grounds
 *
 * @param grounds - Array of evidence statements
 * @returns Evidence strength score (0-1)
 */
export function calculateEvidenceStrength(grounds: string[]): number {
  if (!grounds || grounds.length === 0) return 0;

  // Base score from quantity (1-4+ pieces of evidence)
  const quantityScore = Math.min(1.0, grounds.length / 4);

  // Quality score from length/detail (heuristic: longer = more detailed)
  const avgLength = grounds.reduce((sum, g) => sum + g.length, 0) / grounds.length;
  const qualityScore = Math.min(1.0, avgLength / 200); // 200 chars = good detail

  // Weighted combination (quantity 40%, quality 60%)
  return (quantityScore * 0.4) + (qualityScore * 0.6);
}

/**
 * Assess counter-argument handling
 *
 * @param claim - The claim statement
 * @param rebuttal - The rebuttal (if present)
 * @returns Counter-argument handling score (0-1)
 */
export function assessCounterArgumentHandling(
  claim: string,
  rebuttal?: string
): number {
  // Determine if claim is controversial (needs rebuttal)
  const isControversial = /\b(should|must|ought|always|never|only)\b/i.test(claim);

  if (!isControversial) {
    // Non-controversial claims don't need rebuttals
    return rebuttal ? 1.0 : 0.8;
  }

  if (!rebuttal) {
    // Controversial claim without rebuttal
    return 0.3;
  }

  // Controversial claim with rebuttal - assess quality
  // Good rebuttals acknowledge objection and respond
  const acknowledgesObjection = /\b(critics?|object|however|although|granted)\b/i.test(rebuttal);
  const providesResponse = rebuttal.length > 50; // Substantial response

  if (acknowledgesObjection && providesResponse) {
    return 1.0;
  } else if (acknowledgesObjection || providesResponse) {
    return 0.7;
  } else {
    return 0.5;
  }
}

/**
 * Calculate overall claim quality
 *
 * @param claim - The Toulmin claim
 * @returns Overall quality score (0-1)
 */
export function calculateClaimQuality(claim: ToulminClaim): ClaimQuality {
  const toulminCompleteness = claim.completenessScore;
  const warrantQuality = claim.warrantGenerality;
  const evidenceStrength = calculateEvidenceStrength(claim.grounds);
  const counterArgumentHandling = assessCounterArgumentHandling(
    claim.claim,
    claim.rebuttal
  );

  // Weighted average
  const overallScore = (
    toulminCompleteness * 0.30 +
    warrantQuality * 0.25 +
    evidenceStrength * 0.25 +
    counterArgumentHandling * 0.20
  );

  return {
    toulminCompleteness,
    warrantQuality,
    evidenceStrength,
    counterArgumentHandling,
    overallScore
  };
}

/**
 * Validate claim map
 *
 * @param claimMap - The claim map to validate
 * @returns Validation status
 */
export function validateClaimMap(claimMap: ClaimMap): ValidationStatus {
  const issues: ValidationIssue[] = [];

  for (const claim of claimMap.claims) {
    // Check for required components
    if (!claim.warrant) {
      issues.push({
        type: 'missing-warrant',
        claimId: claim.id,
        description: 'Claim lacks warrant (reasoning)',
        severity: 'critical',
        suggestedFix: 'Add warrant explaining why grounds support claim'
      });
    }

    if (!claim.grounds || claim.grounds.length === 0) {
      issues.push({
        type: 'missing-grounds',
        claimId: claim.id,
        description: 'Claim lacks grounds (evidence)',
        severity: 'critical',
        suggestedFix: 'Add evidence/data supporting claim'
      });
    }

    // Check warrant quality
    if (claim.warrant && claim.warrantGenerality < 0.6) {
      issues.push({
        type: 'weak-warrant',
        claimId: claim.id,
        description: 'Warrant too specific or too general',
        severity: 'major',
        suggestedFix: 'Revise warrant to be slightly more general than claim'
      });
    }

    // Check evidence strength
    if (claim.grounds && claim.grounds.length < 2) {
      issues.push({
        type: 'insufficient-evidence',
        claimId: claim.id,
        description: 'Only one piece of evidence provided',
        severity: 'minor',
        suggestedFix: 'Add additional supporting evidence'
      });
    }

    // Check for controversial claims without rebuttals
    const isControversial = /\b(should|must|ought|always|never|only)\b/i.test(claim.claim);
    if (isControversial && !claim.rebuttal) {
      issues.push({
        type: 'missing-rebuttal',
        claimId: claim.id,
        description: 'Controversial claim lacks rebuttal',
        severity: 'major',
        suggestedFix: 'Add rebuttal addressing likely objections'
      });
    }
  }

  // Check for duplicate claims
  const claimTexts = new Map<string, string[]>();
  for (const claim of claimMap.claims) {
    const normalized = claim.claim.toLowerCase().trim();
    if (!claimTexts.has(normalized)) {
      claimTexts.set(normalized, []);
    }
    claimTexts.get(normalized)!.push(claim.id);
  }

  for (const [text, ids] of claimTexts) {
    if (ids.length > 1) {
      issues.push({
        type: 'duplicate-claim',
        claimId: ids.join(', '),
        description: 'Duplicate claim found',
        severity: 'major',
        suggestedFix: `Merge or differentiate claims: ${ids.join(', ')}`
      });
    }
  }

  // Calculate validation score
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const majorIssues = issues.filter(i => i.severity === 'major').length;
  const minorIssues = issues.filter(i => i.severity === 'minor').length;

  const score = Math.max(0, 1.0 - (
    criticalIssues * 0.20 +
    majorIssues * 0.10 +
    minorIssues * 0.05
  ));

  const passed = score >= 0.75 && criticalIssues === 0;

  return {
    passed,
    score,
    issues
  };
}
