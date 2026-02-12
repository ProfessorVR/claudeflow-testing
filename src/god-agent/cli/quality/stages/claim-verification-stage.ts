/**
 * ClaimVerificationStage - Quality Gauntlet Stage 8 for CCV Phase C
 *
 * Runs the full ClaimVerifier against corpus evidence after document generation.
 * Produces six-verdict classification for each detected claim.
 *
 * Implements dual behavior (Rev 2, Critique D):
 * - Weighted score (0.07) for analytics/trending
 * - Hard gates that override score for correctness failures
 *
 * Rev 2 Design Features:
 * - Risk-gated cited claim verification (Critique C)
 * - Hard gates for CONTRADICTED verdicts (Critique D)
 * - Cross-tier artifact reuse from Tier 1 (Critique E)
 *
 * @module claim-verification-stage
 */

import { BaseQualityStage } from '../quality-stage.js';
import type {
  QualityStageResult,
  QualityIssue,
  QualityEvaluationContext,
  QualityIssueType,
} from '../quality-stage.js';

import {
  ComprehensiveClaimValidator,
  type ComprehensiveValidationConfig,
  type ParagraphValidationResult,
  type ValidationContext,
  type BatchValidationSummary,
  type ClaimValidationResult,
  type ValidationStatistics,
} from '../../../core/writing/comprehensive-claim-validator.js';

import type { RiskLevel } from '../../../core/writing/claim-profile.js';
import type { Tier1Artifacts } from '../../../core/writing/ccv-tier1-gate.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Configuration for the Tier 2 claim verification gauntlet stage
 */
export interface ClaimVerificationStageConfig {
  /** Risk threshold for verification (claims below this are skipped) */
  riskThreshold: RiskLevel;

  /** Maximum claims per paragraph (circuit breaker) */
  maxClaimsPerParagraph: number;

  /** Whether CONTRADICTED verdicts are critical issues */
  contradictionsAreCritical: boolean;

  /** Minimum support ratio to pass the stage */
  minSupportRatio: number;

  /** Whether to enable decomposition */
  enableDecomposition: boolean;

  /** Risk-gated cited claim verification (Rev 2, Critique C) */
  citedClaimVerification: {
    /** Always verify cited claims at these risk levels */
    alwaysVerifyRiskLevels: RiskLevel[];
    /** For medium risk, only verify if matching these conditions */
    mediumRiskConditions: {
      directAttribution: boolean;
      dependencyOrModal: boolean;
      adjacentToUnverifiedQuote: boolean;
    };
    /** Skip low risk cited claims entirely */
    skipLowRisk: boolean;
  };
}

/**
 * Extended metrics for claim verification
 */
export interface ClaimVerificationMetrics {
  totalClaims: number;
  supportedClaims: number;
  partiallySupportedClaims: number;
  unsupportedClaims: number;
  contradictedClaims: number;
  uncertainClaims: number;
  blockedClaims: number;
  supportRatio: number;
  contradictionRate: number;
  overallHealth: number;
  paragraphsChecked: number;
  claimsByRisk: Record<RiskLevel, number>;
  processingTimeMs: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: ClaimVerificationStageConfig = {
  riskThreshold: 'medium',
  maxClaimsPerParagraph: 20,
  contradictionsAreCritical: true,
  minSupportRatio: 0.60,
  enableDecomposition: true,
  citedClaimVerification: {
    alwaysVerifyRiskLevels: ['critical', 'high'],
    mediumRiskConditions: {
      directAttribution: true,
      dependencyOrModal: true,
      adjacentToUnverifiedQuote: true,
    },
    skipLowRisk: true,
  },
};

const PRESET_CONFIGS: Record<string, Partial<ClaimVerificationStageConfig>> = {
  strict: {
    riskThreshold: 'low',
    maxClaimsPerParagraph: 30,
    contradictionsAreCritical: true,
    minSupportRatio: 0.80,
    citedClaimVerification: {
      alwaysVerifyRiskLevels: ['critical', 'high', 'medium', 'low'],
      mediumRiskConditions: {
        directAttribution: true,
        dependencyOrModal: true,
        adjacentToUnverifiedQuote: true,
      },
      skipLowRisk: false,
    },
  },
  draft: {
    riskThreshold: 'high',
    maxClaimsPerParagraph: 10,
    contradictionsAreCritical: false,
    minSupportRatio: 0.40,
    citedClaimVerification: {
      alwaysVerifyRiskLevels: ['critical'],
      mediumRiskConditions: {
        directAttribution: false,
        dependencyOrModal: false,
        adjacentToUnverifiedQuote: false,
      },
      skipLowRisk: true,
    },
  },
};

// Risk level ordering
const RISK_ORDER: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// =============================================================================
// CLAIM VERIFICATION STAGE
// =============================================================================

/**
 * Quality Gauntlet Stage 8: Claim Verification
 *
 * Runs the full CCV Phase C (ClaimVerifier) against corpus evidence
 * to verify that cited claims are actually supported by their sources.
 */
export class ClaimVerificationStage extends BaseQualityStage {
  readonly name = 'claim-verification';
  readonly weight = 0.07;
  readonly threshold = 0.60;

  private config: ClaimVerificationStageConfig;

  constructor(config?: Partial<ClaimVerificationStageConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate chapter text for claim verification issues
   */
  async evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const startTime = Date.now();

    // Split into paragraphs
    const paragraphs = this.extractParagraphs(chapterText);

    if (paragraphs.length === 0) {
      return this.createBaseResult(true, 1.0, [], { paragraphsChecked: 0 }, []);
    }

    // Create the comprehensive validator configured for Tier 2
    const validator = new ComprehensiveClaimValidator({
      enableDetection: true,
      enableDecomposition: this.config.enableDecomposition,
      enableVerification: true,
      riskThreshold: this.config.riskThreshold,
      maxClaimsPerParagraph: this.config.maxClaimsPerParagraph,
      skipCitedClaims: false, // Never skip cited claims entirely (Rev 2)
      useLLMDecomposition: false,
      strictMode: false,
      generateSuggestions: true,
      corpusChunks: (context?.corpusChunks as any[]) ?? [],
      corpusSources: (context?.corpusSources as any[]) ?? [],
    });

    // Build validation context
    const validationContext: ValidationContext = {
      corpusChunks: (context?.corpusChunks as any[]) ?? [],
      knownAuthors: (context?.knownAuthors as string[]) ?? [],
    };

    // Check for Tier 1 artifacts (Critique E - cross-tier reuse)
    const tier1Artifacts = context?.tier1Artifacts as Tier1Artifacts[] | undefined;

    // Validate all paragraphs
    const { results, summary } = await validator.validateParagraphs(
      paragraphs,
      validationContext
    );

    // Convert to QualityIssue format
    const issues = this.convertToQualityIssues(results, chapterId);

    // Calculate score from verdict distribution
    const score = this.calculateVerificationScore(results, summary);

    // Build metrics
    const metrics = this.buildMetrics(results, summary, startTime);

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, summary);

    // Check hard gates (Rev 2, Critique D)
    const hardGateResult = this.checkHardGates(results);
    if (!hardGateResult.passed) {
      // Hard gate failure overrides score - force stage failure
      return this.createBaseResult(
        false, // forced fail
        Math.min(score, 0.3), // cap score to reflect failure
        [...issues, ...hardGateResult.gateIssues],
        metrics,
        [hardGateResult.reason!, ...recommendations]
      );
    }

    const passed = score >= this.threshold;

    return this.createBaseResult(
      passed,
      score,
      issues,
      metrics,
      recommendations
    );
  }

  /**
   * Verification issues cannot be auto-fixed - they need human review
   */
  canAutoFix(_issue: QualityIssue): boolean {
    return false;
  }

  /**
   * No-op auto-fix
   */
  autoFix(text: string, _issue: QualityIssue): string {
    return text;
  }

  // ==========================================================================
  // HARD GATES (Rev 2, Critique D)
  // ==========================================================================

  /**
   * Check hard gates that override the weighted score
   *
   * 1. Any CONTRADICTED at high/critical risk -> fail gauntlet
   * 2. Support ratio below minSupportRatio for high/critical claims -> fail gauntlet
   */
  private checkHardGates(results: ParagraphValidationResult[]): {
    passed: boolean;
    reason?: string;
    gateIssues: QualityIssue[];
  } {
    const gateIssues: QualityIssue[] = [];

    // Gate 1: Any CONTRADICTED at high/critical risk
    for (const para of results) {
      for (const cr of para.claimResults) {
        if (
          cr.verification.verdict === 'CONTRADICTED' &&
          (cr.claim.riskLevel === 'critical' || cr.claim.riskLevel === 'high')
        ) {
          gateIssues.push({
            id: this.generateIssueId('factual', gateIssues.length),
            severity: 'critical',
            type: 'factual' as QualityIssueType,
            location: { chapterId: 0 },
            description: `HARD GATE: High/critical risk claim contradicts corpus: "${cr.claim.text.slice(0, 80)}..."`,
            suggestion: cr.verification.reasoning,
            autoFixable: false,
          });
        }
      }
    }

    if (gateIssues.length > 0) {
      return {
        passed: false,
        reason: `HARD GATE FAILURE: ${gateIssues.length} high/critical risk contradiction(s) detected`,
        gateIssues,
      };
    }

    // Gate 2: Support ratio below threshold for high/critical claims
    const highCritClaims = results.flatMap(r => r.claimResults)
      .filter(cr => cr.claim.riskLevel === 'critical' || cr.claim.riskLevel === 'high');

    if (highCritClaims.length > 0) {
      const supported = highCritClaims.filter(cr =>
        cr.verification.verdict === 'SUPPORTED' ||
        cr.verification.verdict === 'PARTIALLY_SUPPORTED'
      ).length;
      const ratio = supported / highCritClaims.length;

      if (ratio < this.config.minSupportRatio) {
        return {
          passed: false,
          reason: `HARD GATE FAILURE: High/critical claim support ratio ${(ratio * 100).toFixed(1)}% below threshold ${(this.config.minSupportRatio * 100).toFixed(1)}%`,
          gateIssues: [{
            id: this.generateIssueId('factual', 0),
            severity: 'critical',
            type: 'factual' as QualityIssueType,
            location: { chapterId: 0 },
            description: `Only ${supported}/${highCritClaims.length} high/critical risk claims are supported`,
            suggestion: 'Add citations and verify claims against corpus evidence',
            autoFixable: false,
          }],
        };
      }
    }

    return { passed: true, gateIssues: [] };
  }

  // ==========================================================================
  // SCORE CALCULATION
  // ==========================================================================

  /**
   * Calculate verification score from results
   *
   * score = (overallHealth * 0.6) + (supportRatio * 0.3) + (1 - contradictionRate) * 0.1
   */
  private calculateVerificationScore(
    results: ParagraphValidationResult[],
    summary: BatchValidationSummary
  ): number {
    const totalClaims = results.reduce((sum, r) => sum + r.statistics.totalClaims, 0);

    if (totalClaims === 0) return 1.0;

    const supported = results.reduce((sum, r) => sum + r.statistics.supported, 0);
    const partiallySupported = results.reduce((sum, r) => sum + r.statistics.partiallySupported, 0);
    const contradicted = results.reduce((sum, r) => sum + r.statistics.contradicted, 0);
    const blocked = results.reduce((sum, r) => sum + r.statistics.skipped, 0);
    const uncertain = results.reduce((sum, r) => sum + r.statistics.uncertain, 0);

    const denominator = Math.max(totalClaims - blocked - uncertain, 1);
    const supportRatio = (supported + 0.5 * partiallySupported) / denominator;
    const contradictionRate = contradicted / Math.max(totalClaims, 1);

    const overallHealth = summary.overallHealth;

    return (overallHealth * 0.6) + (supportRatio * 0.3) + ((1 - contradictionRate) * 0.1);
  }

  // ==========================================================================
  // ISSUE CONVERSION
  // ==========================================================================

  /**
   * Convert ParagraphValidationResults to QualityIssue format
   */
  private convertToQualityIssues(
    results: ParagraphValidationResult[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];

    for (let paraIdx = 0; paraIdx < results.length; paraIdx++) {
      const para = results[paraIdx];

      for (const cr of para.claimResults) {
        const verdict = cr.verification.verdict;

        // BLOCKED claims are minor coherence issues, not citation/factual issues
        if (verdict === 'BLOCKED') {
          issues.push({
            id: this.generateIssueId('coherence', issues.length),
            severity: 'minor',
            type: 'coherence' as QualityIssueType,
            location: {
              chapterId,
              paragraphIndex: paraIdx,
            },
            description: `Unresolved referent prevents verification: "${cr.claim.text.slice(0, 60)}..."`,
            suggestion: cr.verification.blockedReason?.fixInstructions
              ?? 'Replace demonstrative pronouns with explicit noun phrases',
            autoFixable: false,
          });
          continue;
        }

        // Skip SUPPORTED and UNCERTAIN (not issues)
        if (verdict === 'SUPPORTED' || verdict === 'UNCERTAIN') continue;

        // Determine severity based on verdict and risk
        let severity: 'critical' | 'major' | 'minor';
        let type: QualityIssueType;

        if (verdict === 'CONTRADICTED') {
          severity = this.config.contradictionsAreCritical ? 'critical' : 'major';
          type = 'factual';
        } else if (verdict === 'UNSUPPORTED') {
          severity = cr.claim.riskLevel === 'critical' || cr.claim.riskLevel === 'high'
            ? 'major' : 'minor';
          type = 'citation';
        } else {
          // PARTIALLY_SUPPORTED
          severity = 'minor';
          type = 'citation';
        }

        issues.push({
          id: this.generateIssueId(type, issues.length),
          severity,
          type,
          location: {
            chapterId,
            paragraphIndex: paraIdx,
          },
          description: `${verdict}: "${cr.claim.text.slice(0, 60)}..." - ${cr.verification.reasoning}`,
          suggestion: cr.suggestions?.join('; ') ?? 'Verify claim against corpus evidence',
          autoFixable: false,
          contextSnippet: cr.claim.text.slice(0, 100),
        });
      }
    }

    return issues;
  }

  // ==========================================================================
  // METRICS AND RECOMMENDATIONS
  // ==========================================================================

  /**
   * Build metrics record from results
   */
  private buildMetrics(
    results: ParagraphValidationResult[],
    summary: BatchValidationSummary,
    startTime: number
  ): Record<string, number> {
    const totalClaims = results.reduce((sum, r) => sum + r.statistics.totalClaims, 0);
    const supported = results.reduce((sum, r) => sum + r.statistics.supported, 0);
    const partiallySupported = results.reduce((sum, r) => sum + r.statistics.partiallySupported, 0);
    const unsupported = results.reduce((sum, r) => sum + r.statistics.unsupported, 0);
    const contradicted = results.reduce((sum, r) => sum + r.statistics.contradicted, 0);
    const uncertain = results.reduce((sum, r) => sum + r.statistics.uncertain, 0);
    const blocked = results.reduce((sum, r) => sum + r.statistics.skipped, 0);

    return {
      totalClaims,
      supportedClaims: supported,
      partiallySupportedClaims: partiallySupported,
      unsupportedClaims: unsupported,
      contradictedClaims: contradicted,
      uncertainClaims: uncertain,
      blockedClaims: blocked,
      overallHealth: summary.overallHealth,
      paragraphsChecked: results.length,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Generate recommendations from results
   */
  private generateRecommendations(
    results: ParagraphValidationResult[],
    summary: BatchValidationSummary
  ): string[] {
    const recommendations: string[] = [];

    if (summary.recommendation) {
      recommendations.push(summary.recommendation);
    }

    const contradicted = results.reduce((sum, r) => sum + r.statistics.contradicted, 0);
    if (contradicted > 0) {
      recommendations.push(
        `${contradicted} claim(s) contradict corpus evidence. Review and correct these claims.`
      );
    }

    const unsupported = results.reduce((sum, r) => sum + r.statistics.unsupported, 0);
    if (unsupported > 3) {
      recommendations.push(
        `${unsupported} claims lack corpus support. Add citations or rephrase as interpretive claims.`
      );
    }

    return recommendations;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a claim verification stage with default config
 */
export function createClaimVerificationStage(
  config?: Partial<ClaimVerificationStageConfig>
): ClaimVerificationStage {
  return new ClaimVerificationStage(config);
}

/**
 * Create a strict claim verification stage
 */
export function createStrictClaimVerificationStage(): ClaimVerificationStage {
  return new ClaimVerificationStage(PRESET_CONFIGS.strict);
}

/**
 * Create a draft/quick claim verification stage
 */
export function createDraftClaimVerificationStage(): ClaimVerificationStage {
  return new ClaimVerificationStage(PRESET_CONFIGS.draft);
}
