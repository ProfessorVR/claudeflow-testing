/**
 * CCV Tier 1 Gate - Inline Claim Detection and Citation Enforcement
 *
 * Runs ClaimDetector (Phase A) + ValidationRuleEngine + ClaimDecomposer (Phase B)
 * at generation time to enforce missing-citation requirements.
 *
 * Does NOT run ClaimVerifier (Phase C) -- that is deferred to Tier 2 (Quality Gauntlet).
 *
 * Rev 2 Design Features:
 * - Attribution-type-aware author matching (Critique A)
 * - Requirements + assertion gate replacing commitment filter (Critique B)
 * - Cross-tier artifact persistence (Critique E)
 *
 * @module ccv-tier1-gate
 */

import { ClaimDetector, type DetectedClaim, type DetectionContext } from './claim-detector.js';
import { ClaimDecomposer, type DecompositionResult } from './claim-decomposer.js';
import { ValidationRuleEngine } from './validation-rule-engine.js';
import {
  type RiskLevel,
  type ComposedValidationRequirements,
  AttributionType,
  AssertionType,
  EpistemicForceType,
  StructureType,
} from './claim-profile.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Configuration for the CCV Tier 1 inline gate
 */
export interface CcvTier1Config {
  /** Enable/disable Tier 1 entirely (feature flag) */
  enabled: boolean;

  /** Minimum claim confidence to enforce (default: 0.5) */
  minClaimConfidence: number;

  /** Maximum claims to process per paragraph (circuit breaker) */
  maxClaimsPerParagraph: number;

  /** Enable decomposition for composite claims (default: true) */
  enableDecomposition: boolean;

  /** Strictness level maps to enforcement behavior */
  strictness: 'strict' | 'moderate' | 'lenient';

  /** Risk threshold: only enforce on claims at or above this level */
  riskThreshold: RiskLevel;

  /** Whether to fail the paragraph on ANY mandatory-citation miss */
  failOnMissingMandatoryCitation: boolean;

  /** Whether to include recommended-citation misses in feedback */
  includeRecommendedInFeedback: boolean;

  /** Whether to track claims across paragraphs for attribution inheritance */
  trackCrossParaClaims: boolean;
}

/**
 * Context for Tier 1 detection
 */
export interface Tier1DetectionContext {
  knownAuthors?: string[];
  previousClaims?: DetectedClaim[];
  paragraphIndex?: number;
  currentTopic?: string;
  sectionTitle?: string;
}

/**
 * A single Tier 1 issue
 */
export interface Tier1Issue {
  severity: 'critical' | 'major' | 'minor';
  category: 'missing-citation' | 'weak-attribution' | 'composite-gap' | 'anonymous-authority';
  claimText: string;
  claimId: string;
  riskLevel: RiskLevel;
  citationRequirement: 'mandatory' | 'recommended' | 'optional';
  applicableRules: string[];
  rationale: string;
  suggestedAction: string;
  /** For composite claims, the sub-claim details */
  subClaimIssues?: Array<{
    subClaimText: string;
    citationRequired: boolean;
    hasCitation: boolean;
  }>;
}

/**
 * Result of Tier 1 evaluation
 */
export interface Tier1EvaluationResult {
  /** Whether the paragraph passed Tier 1 checks */
  passed: boolean;

  /** Detected claims */
  claims: DetectedClaim[];

  /** Decomposition results for composite claims */
  decompositions: Map<string, DecompositionResult>;

  /** Issues found */
  issues: Tier1Issue[];

  /** Formatted feedback for regeneration */
  feedback: string;

  /** Summary statistics */
  stats: {
    totalClaims: number;
    claimsRequiringCitation: number;
    claimsMissingCitation: number;
    compositeClaimsDecomposed: number;
    claimsByRisk: Record<RiskLevel, number>;
  };

  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Tier 1 artifacts for cross-tier reuse (Critique E)
 */
export interface Tier1Artifacts {
  /** Detected claims with full profiles and requirements */
  claims: DetectedClaim[];

  /** Decomposition results (only for composite claims that were decomposed) */
  decompositions: Map<string, DecompositionResult>;

  /** Paragraph index (for ordering) */
  paragraphIndex: number;

  /** Detector version hash (for cache invalidation) */
  detectorVersion: string;

  /** Timestamp of detection */
  detectedAt: number;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: CcvTier1Config = {
  enabled: true,
  minClaimConfidence: 0.5,
  maxClaimsPerParagraph: 30,
  enableDecomposition: true,
  strictness: 'moderate',
  riskThreshold: 'medium',
  failOnMissingMandatoryCitation: true,
  includeRecommendedInFeedback: false,
  trackCrossParaClaims: true,
};

const STRICTNESS_PRESETS: Record<string, Partial<CcvTier1Config>> = {
  strict: {
    riskThreshold: 'low',
    failOnMissingMandatoryCitation: true,
    includeRecommendedInFeedback: true,
    enableDecomposition: true,
  },
  moderate: {
    riskThreshold: 'medium',
    failOnMissingMandatoryCitation: true,
    includeRecommendedInFeedback: false,
    enableDecomposition: true,
  },
  lenient: {
    riskThreshold: 'high',
    failOnMissingMandatoryCitation: false,
    includeRecommendedInFeedback: false,
    enableDecomposition: false,
  },
};

// Risk level ordering for threshold comparison
const RISK_ORDER: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// =============================================================================
// CCV TIER 1 GATE CLASS
// =============================================================================

/**
 * CCV Tier 1 Gate
 *
 * Inline claim detection and citation enforcement gate.
 * Runs between paragraph generation (Step 1) and citation validation (Step 2).
 */
export class CcvTier1Gate {
  private detector: ClaimDetector;
  private decomposer: ClaimDecomposer;
  private ruleEngine: ValidationRuleEngine;
  private config: CcvTier1Config;

  constructor(config?: Partial<CcvTier1Config>) {
    const preset = STRICTNESS_PRESETS[config?.strictness ?? 'moderate'] ?? {};
    this.config = { ...DEFAULT_CONFIG, ...preset, ...config };
    this.detector = new ClaimDetector();
    this.decomposer = new ClaimDecomposer();
    this.ruleEngine = new ValidationRuleEngine();
  }

  /**
   * Evaluate a paragraph for claim detection and citation enforcement
   */
  async evaluate(
    content: string,
    citations: Array<{ author: string; year?: number }>,
    context?: Tier1DetectionContext
  ): Promise<Tier1EvaluationResult> {
    const startTime = Date.now();

    if (!this.config.enabled) {
      return this.createPassResult(startTime);
    }

    // Phase A: Detect claims
    const detectionContext: DetectionContext = {
      previousClaims: context?.previousClaims ?? [],
      paragraphIndex: context?.paragraphIndex ?? 0,
      currentTopic: context?.currentTopic,
    };

    const claims_raw = await this.detector.detectClaims(content, detectionContext);
    let claims = claims_raw;

    // Apply circuit breaker
    if (claims.length > this.config.maxClaimsPerParagraph) {
      claims = claims.slice(0, this.config.maxClaimsPerParagraph);
    }

    // Filter by risk threshold
    claims = claims.filter(
      c => RISK_ORDER[c.riskLevel] >= RISK_ORDER[this.config.riskThreshold]
    );

    const issues: Tier1Issue[] = [];
    const decompositions = new Map<string, DecompositionResult>();
    let claimsRequiringCitation = 0;
    let claimsMissingCitation = 0;
    let compositeClaimsDecomposed = 0;
    const claimsByRisk: Record<RiskLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const claim of claims) {
      claimsByRisk[claim.riskLevel] = (claimsByRisk[claim.riskLevel] || 0) + 1;

      // Determine enforcement level (Rev 2, Critique B)
      const enforcement = shouldEnforceCitation(claim, this.config.strictness);

      if (enforcement === 'skip') continue;

      claimsRequiringCitation++;

      // Check citations present (Rev 2, Critique A - attribution-type-aware)
      const citationResult = enforceCitationRequirements(claim, citations);

      if (!citationResult.passed) {
        claimsMissingCitation++;

        // Check if composite and decomposition enabled
        if (this.config.enableDecomposition && isCompositeClaim(claim)) {
          const decomposition = await this.decomposer.decompose(claim);
          decompositions.set(claim.id, decomposition);
          compositeClaimsDecomposed++;

          // Build sub-claim issue details
          const subClaimIssues = decomposition.atomicClaims.map(sub => ({
            subClaimText: sub.text,
            citationRequired: sub.requiresAttribution,
            hasCitation: citations.length > 0,
          }));

          issues.push({
            ...citationResult.issue!,
            category: 'composite-gap',
            subClaimIssues,
          });
        } else {
          issues.push(citationResult.issue!);
        }
      } else if (citationResult.issue && citationResult.issue.severity === 'minor') {
        // Pass with warning (e.g., INTERPRETIVE claim with citation but no primary source)
        if (this.config.includeRecommendedInFeedback || enforcement === 'mandatory') {
          issues.push(citationResult.issue);
        }
      }
    }

    // Determine pass/fail
    const mandatoryIssues = issues.filter(
      i => i.citationRequirement === 'mandatory' && i.severity !== 'minor'
    );
    const passed = this.config.failOnMissingMandatoryCitation
      ? mandatoryIssues.length === 0
      : true;

    const feedback = this.formatFeedback(issues);

    return {
      passed,
      claims: claims_raw, // Return ALL detected claims (not just filtered)
      decompositions,
      issues,
      feedback,
      stats: {
        totalClaims: claims_raw.length,
        claimsRequiringCitation,
        claimsMissingCitation,
        compositeClaimsDecomposed,
        claimsByRisk,
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Format feedback for the regeneration loop
   */
  formatFeedback(issues: Tier1Issue[]): string {
    if (issues.length === 0) return '';

    const actionableIssues = issues.filter(i => i.severity !== 'minor');
    if (actionableIssues.length === 0) return '';

    const lines: string[] = [];
    lines.push('## CLAIM VALIDATION ERRORS - Missing Citations Detected');
    lines.push('');
    lines.push(`Your content contains ${actionableIssues.length} claim(s) that require citations but lack them.`);
    lines.push('');
    lines.push('### Claims Requiring Action:');
    lines.push('');

    for (let i = 0; i < actionableIssues.length; i++) {
      const issue = actionableIssues[i];
      const truncatedText = issue.claimText.length > 80
        ? issue.claimText.slice(0, 80) + '...'
        : issue.claimText;

      const severityLabel = issue.severity === 'critical' ? 'CRITICAL'
        : issue.severity === 'major' ? 'MAJOR' : 'MINOR';

      if (issue.subClaimIssues && issue.subClaimIssues.length > 0) {
        const needingCitation = issue.subClaimIssues.filter(s => s.citationRequired && !s.hasCitation);
        lines.push(`${i + 1}. **[COMPOSITE - ${needingCitation.length} sub-claims need citation]** "${truncatedText}"`);
        for (let j = 0; j < issue.subClaimIssues.length; j++) {
          const sub = issue.subClaimIssues[j];
          const status = sub.citationRequired && !sub.hasCitation ? 'NEEDS CITATION' : 'OK';
          lines.push(`   ${String.fromCharCode(97 + j)}. "${sub.subClaimText.slice(0, 60)}" - ${status}`);
        }
      } else {
        lines.push(`${i + 1}. **[${severityLabel}]** "${truncatedText}"`);
        lines.push(`   - Risk level: ${issue.riskLevel}`);
        lines.push(`   - Citation required: ${issue.citationRequirement}`);
        lines.push(`   - Action: ${issue.suggestedAction}`);
      }
      lines.push('');
    }

    lines.push('### Instructions:');
    lines.push('1. Use the citation_lookup tool to find evidence for each flagged claim');
    lines.push('2. Add explicit citations (author-prominent format preferred)');
    lines.push('3. If no corpus evidence exists, rephrase as your own interpretive claim');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Create Tier 1 artifacts for cross-tier reuse
   */
  createArtifacts(
    result: Tier1EvaluationResult,
    paragraphIndex: number
  ): Tier1Artifacts {
    return {
      claims: result.claims,
      decompositions: result.decompositions,
      paragraphIndex,
      detectorVersion: '1.0.0', // ClaimDetector doesn't expose VERSION; use constant
      detectedAt: Date.now(),
    };
  }

  private createPassResult(startTime: number): Tier1EvaluationResult {
    return {
      passed: true,
      claims: [],
      decompositions: new Map(),
      issues: [],
      feedback: '',
      stats: {
        totalClaims: 0,
        claimsRequiringCitation: 0,
        claimsMissingCitation: 0,
        compositeClaimsDecomposed: 0,
        claimsByRisk: { critical: 0, high: 0, medium: 0, low: 0 },
      },
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// =============================================================================
// ENFORCEMENT FUNCTIONS
// =============================================================================

/**
 * Determine whether to enforce citation for a claim (Rev 2, Critique B)
 *
 * Uses (validationRequirements + assertion axis + epistemic force) as the gate,
 * NOT commitment alone.
 */
export function shouldEnforceCitation(
  claim: DetectedClaim,
  strictness: 'strict' | 'moderate' | 'lenient'
): 'mandatory' | 'recommended' | 'skip' {
  const req = claim.validationRequirements;
  const assertion = claim.profile.assertion.type;
  const epistemic = claim.profile.epistemicForce.type;

  // Rule 1: ValidationRuleEngine says mandatory -> always enforce
  if (req.citationRequired === 'mandatory') return 'mandatory';

  // Rule 2: Factual/historical/textual essay claims with strong epistemic commitment
  const factualTypes: AssertionType[] = [
    AssertionType.FACTUAL, AssertionType.HISTORICAL, AssertionType.TEXTUAL,
    AssertionType.DEPENDENCY, AssertionType.MODAL,
  ];
  const strongEpistemic: EpistemicForceType[] = [
    EpistemicForceType.DESCRIPTIVE,
  ];
  if (factualTypes.includes(assertion) && strongEpistemic.includes(epistemic)) {
    return strictness === 'strict' ? 'mandatory' : 'recommended';
  }

  // Rule 3: ValidationRuleEngine says recommended -> follow through
  if (req.citationRequired === 'recommended') return 'recommended';

  // Rule 4: Everything else -> skip
  return 'skip';
}

/**
 * Enforce citation requirements with attribution-type-aware matching (Rev 2, Critique A)
 *
 * In academic writing, "Aristotle argues X" is commonly supported by citing
 * an interpreter (Caston, Frede) rather than a primary source. Hard-failing on
 * author mismatch would create false positives. Instead, we enforce author match
 * ONLY for DIRECT + high-confidence attributions.
 */
export function enforceCitationRequirements(
  claim: DetectedClaim,
  paragraphCitations: Array<{ author: string; year?: number }>
): { passed: boolean; issue?: Tier1Issue } {
  const req = claim.validationRequirements;

  // No enforcement needed
  if (req.citationRequired === 'optional') {
    return { passed: true };
  }

  const hasAnyCitation = paragraphCitations.length > 0;
  const attrType = claim.profile.attribution.type;

  // Determine whether to enforce author-specific match or just citation presence
  const requireAuthorMatch = (
    attrType === AttributionType.DIRECT &&
    claim.commitment === 'source' &&
    (claim.retrievalAttribution?.confidence ?? 0) >= 0.8
  );

  // Check author-specific citation match
  const hasAuthorCitation = claim.profile.attribution.authors?.some(author =>
    paragraphCitations.some(c =>
      c.author.toLowerCase().includes(author.toLowerCase())
    )
  ) ?? false;

  if (req.citationRequired === 'mandatory') {
    if (requireAuthorMatch && !hasAuthorCitation) {
      // DIRECT attribution with high confidence: require author-matched citation
      return {
        passed: false,
        issue: {
          severity: claim.riskLevel === 'critical' ? 'critical' : 'major',
          category: 'missing-citation',
          claimText: claim.text,
          claimId: claim.id,
          riskLevel: claim.riskLevel,
          citationRequirement: 'mandatory',
          applicableRules: req.applicableRules,
          rationale: req.rationale,
          suggestedAction: `Add citation from ${claim.profile.attribution.authors?.[0] ?? 'the attributed author'}'s corpus (direct attribution requires author-matched citation)`,
        },
      };
    } else if (!requireAuthorMatch && !hasAnyCitation) {
      // INTERPRETIVE/PROXY/CONSENSUS: require ANY citation present
      return {
        passed: false,
        issue: {
          severity: claim.riskLevel === 'critical' ? 'critical' : 'major',
          category: 'missing-citation',
          claimText: claim.text,
          claimId: claim.id,
          riskLevel: claim.riskLevel,
          citationRequirement: 'mandatory',
          applicableRules: req.applicableRules,
          rationale: req.rationale,
          suggestedAction: 'Add citation from corpus to support this claim',
        },
      };
    } else if (!requireAuthorMatch && hasAnyCitation && !hasAuthorCitation) {
      // Citation present but no primary source citation for attributed author: pass with warning
      return {
        passed: true,
        issue: {
          severity: 'minor',
          category: 'weak-attribution',
          claimText: claim.text,
          claimId: claim.id,
          riskLevel: claim.riskLevel,
          citationRequirement: 'mandatory',
          applicableRules: req.applicableRules,
          rationale: 'Citation present but no primary source citation for attributed author',
          suggestedAction: `Consider adding a primary source citation from ${claim.profile.attribution.authors?.[0] ?? 'the attributed author'}`,
        },
      };
    }
  }

  if (req.citationRequired === 'recommended' && !hasAnyCitation) {
    return {
      passed: true, // recommended = warning, not failure
      issue: {
        severity: 'minor',
        category: 'missing-citation',
        claimText: claim.text,
        claimId: claim.id,
        riskLevel: claim.riskLevel,
        citationRequirement: 'recommended',
        applicableRules: req.applicableRules,
        rationale: req.rationale,
        suggestedAction: 'Consider adding a citation to strengthen this claim',
      },
    };
  }

  return { passed: true };
}

/**
 * Check if a claim is composite (should be decomposed)
 */
export function isCompositeClaim(claim: DetectedClaim): boolean {
  const compositeTypes: string[] = [
    StructureType.CONJUNCTIVE, StructureType.DISJUNCTIVE,
    StructureType.CONDITIONAL, StructureType.INFERENTIAL,
    StructureType.EXPLANATORY, StructureType.PARALLEL,
  ];
  return compositeTypes.includes(claim.profile.structure.type) ||
    claim.profile.structure.atomicClaimCount > 1;
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a CcvTier1Gate with optional configuration
 */
export function createCcvTier1Gate(config?: Partial<CcvTier1Config>): CcvTier1Gate {
  return new CcvTier1Gate(config);
}
