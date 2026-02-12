/**
 * Scope Police Reviewer - Detects overclaiming beyond evidence
 *
 * This is a READ-ONLY reviewer that detects when claims exceed what
 * the evidence warrants. It identifies overclaiming, unsupported leaps,
 * and missing qualifications.
 *
 * @module scope-police
 */

import type { ClaimMap, ToulminClaim } from '../sir/claim-map.js';

/**
 * Scope audit result
 */
export interface ScopeAuditResult {
  /** Whether audit passed */
  passed: boolean;

  /** Overall scope score (0-1) */
  score: number;

  /** Issues detected */
  issues: ScopeIssue[];

  /** Audit metadata */
  metadata: ScopeAuditMetadata;
}

/**
 * Scope issue detected
 */
export interface ScopeIssue {
  /** Issue type */
  type: 'overclaiming' | 'unsupported-leap' | 'missing-qualification';

  /** Claim ID with issue */
  claimId: string;

  /** Claim statement */
  claim: string;

  /** Grounds (evidence) */
  grounds: string[];

  /** Issue description */
  issue: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Recommendation for fix */
  recommendation: string;

  /** Detailed analysis */
  analysis: ScopeAnalysis;
}

/**
 * Detailed scope analysis
 */
export interface ScopeAnalysis {
  /** Claim strength (universal, strong, moderate, weak) */
  claimStrength: 'universal' | 'strong' | 'moderate' | 'weak';

  /** Evidence strength (0-1) */
  evidenceStrength: number;

  /** Warrant generality (0-1) */
  warrantGenerality: number;

  /** Overreach score (0-1, higher = more overreach) */
  overreachScore: number;

  /** Specific issues */
  specificIssues: string[];
}

/**
 * Audit metadata
 */
export interface ScopeAuditMetadata {
  /** Claims audited */
  claimsAudited: number;

  /** Overclaiming instances */
  overclaimingInstances: number;

  /** Unsupported leaps */
  unsupportedLeaps: number;

  /** Missing qualifications */
  missingQualifications: number;

  /** Critical issues */
  criticalIssues: number;

  /** Major issues */
  majorIssues: number;

  /** Minor issues */
  minorIssues: number;

  /** Average overreach score */
  averageOverreachScore: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * ScopePoliceReviewer - READ-ONLY reviewer for overclaiming
 */
export class ScopePoliceReviewer {
  /**
   * Review claim map for overclaiming
   *
   * This is a READ-ONLY operation - it does not modify content,
   * only detects and reports issues.
   */
  async review(claimMap: ClaimMap): Promise<ScopeAuditResult> {
    const startTime = Date.now();
    const issues: ScopeIssue[] = [];

    for (const claim of claimMap.claims) {
      // Check for overclaiming
      const overclaimIssue = this.checkOverclaiming(claim);
      if (overclaimIssue) {
        issues.push(overclaimIssue);
      }

      // Check for unsupported leaps
      const unsupportedLeapIssue = this.checkUnsupportedLeap(claim);
      if (unsupportedLeapIssue) {
        issues.push(unsupportedLeapIssue);
      }

      // Check for missing qualifications
      const qualificationIssue = this.checkMissingQualification(claim);
      if (qualificationIssue) {
        issues.push(qualificationIssue);
      }
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(issues, claimMap.claims.length, Date.now() - startTime);

    // Calculate score
    const score = this.calculateScopeScore(issues, metadata);

    // Determine pass/fail (threshold: 0.80)
    const passed = score >= 0.80 && metadata.criticalIssues === 0;

    return {
      passed,
      score,
      issues,
      metadata
    };
  }

  /**
   * Check if claim overclaims beyond evidence
   */
  private checkOverclaiming(claim: ToulminClaim): ScopeIssue | null {
    const analysis = this.analyzeScope(claim);

    // Overclaiming criteria:
    // 1. Universal claim without sufficient evidence
    // 2. Strong claim with weak evidence
    // 3. Overreach score > 0.7

    if (analysis.overreachScore > 0.7) {
      return {
        type: 'overclaiming',
        claimId: claim.id,
        claim: claim.claim,
        grounds: claim.grounds,
        issue: `Claim generalizes beyond evidence provided (overreach: ${(analysis.overreachScore * 100).toFixed(0)}%)`,
        severity: this.determineSeverity(analysis.overreachScore),
        recommendation: this.generateOverclaimingRecommendation(claim, analysis),
        analysis
      };
    }

    return null;
  }

  /**
   * Check for unsupported logical leaps
   */
  private checkUnsupportedLeap(claim: ToulminClaim): ScopeIssue | null {
    const analysis = this.analyzeScope(claim);

    // Unsupported leap criteria:
    // Warrant too general (> 0.95) suggesting weak connection

    if (claim.warrantGenerality > 0.95) {
      analysis.specificIssues.push('Warrant too general - weak connection to claim');

      return {
        type: 'unsupported-leap',
        claimId: claim.id,
        claim: claim.claim,
        grounds: claim.grounds,
        issue: 'Logical leap from grounds to claim needs intermediate step',
        severity: 'major',
        recommendation: 'Strengthen warrant or add intermediate claim',
        analysis
      };
    }

    return null;
  }

  /**
   * Check if strong claim lacks qualification
   */
  private checkMissingQualification(claim: ToulminClaim): ScopeIssue | null {
    const analysis = this.analyzeScope(claim);

    // Missing qualification criteria:
    // Strong or universal claim without hedging

    if ((analysis.claimStrength === 'universal' || analysis.claimStrength === 'strong') &&
        !claim.qualification) {
      analysis.specificIssues.push('Strong claim without appropriate hedging');

      return {
        type: 'missing-qualification',
        claimId: claim.id,
        claim: claim.claim,
        grounds: claim.grounds,
        issue: 'Strong claim without appropriate qualification',
        severity: 'minor',
        recommendation: 'Add qualification (e.g., "probably", "most", "typically", "generally")',
        analysis
      };
    }

    return null;
  }

  /**
   * Analyze scope of claim
   */
  private analyzeScope(claim: ToulminClaim): ScopeAnalysis {
    const claimStrength = this.assessClaimStrength(claim.claim);
    const evidenceStrength = this.assessEvidenceStrength(claim.grounds);
    const warrantGenerality = claim.warrantGenerality;

    // Calculate overreach: claim strength vs evidence strength
    const strengthDifference = this.claimStrengthToNumber(claimStrength) - evidenceStrength;
    const overreachScore = Math.max(0, Math.min(1, strengthDifference));

    const specificIssues: string[] = [];

    // Identify specific issues
    if (claimStrength === 'universal' && evidenceStrength < 0.8) {
      specificIssues.push('Universal claim ("all", "always", "never") requires very strong evidence');
    }

    if (claimStrength === 'strong' && evidenceStrength < 0.6) {
      specificIssues.push('Strong claim requires substantial evidence');
    }

    if (claim.grounds.length < 2) {
      specificIssues.push('Insufficient evidence - multiple sources recommended');
    }

    if (warrantGenerality > 0.90) {
      specificIssues.push('Warrant may be too general to support specific claim');
    }

    return {
      claimStrength,
      evidenceStrength,
      warrantGenerality,
      overreachScore,
      specificIssues
    };
  }

  /**
   * Assess claim strength
   */
  private assessClaimStrength(claim: string): 'universal' | 'strong' | 'moderate' | 'weak' {
    const claimLower = claim.toLowerCase();

    // Universal quantifiers
    if (/\b(all|always|never|every|none|must|will|cannot)\b/.test(claimLower)) {
      return 'universal';
    }

    // Strong verbs
    if (/\b(proves?|demonstrates?|establishes?|shows?|is|are)\b/.test(claimLower)) {
      return 'strong';
    }

    // Moderate hedging
    if (/\b(suggests?|indicates?|implies?|tends?\s+to|often|usually)\b/.test(claimLower)) {
      return 'moderate';
    }

    // Weak hedging
    return 'weak';
  }

  /**
   * Assess evidence strength
   */
  private assessEvidenceStrength(grounds: string[]): number {
    if (!grounds || grounds.length === 0) return 0;

    // Quantity score (0.4 weight)
    const quantityScore = Math.min(1.0, grounds.length / 4);

    // Quality score (0.6 weight)
    // Based on: presence of citations, length/detail, specificity
    let qualityScore = 0;
    for (const ground of grounds) {
      let groundQuality = 0;

      // Has citation
      if (/\([^)]+\d{4}[^)]*\)/.test(ground)) {
        groundQuality += 0.3;
      }

      // Detailed (≥100 chars)
      if (ground.length >= 100) {
        groundQuality += 0.3;
      }

      // Specific (contains numbers, names, or technical terms)
      if (/\d+|[A-Z][a-z]+\s+[A-Z][a-z]+/.test(ground)) {
        groundQuality += 0.2;
      }

      // From authoritative source
      if (/\b(study|research|evidence|data|experiment)\b/i.test(ground)) {
        groundQuality += 0.2;
      }

      qualityScore += Math.min(1.0, groundQuality);
    }
    qualityScore = qualityScore / grounds.length;

    return (quantityScore * 0.4) + (qualityScore * 0.6);
  }

  /**
   * Convert claim strength to number
   */
  private claimStrengthToNumber(strength: 'universal' | 'strong' | 'moderate' | 'weak'): number {
    switch (strength) {
      case 'universal': return 1.0;
      case 'strong': return 0.7;
      case 'moderate': return 0.5;
      case 'weak': return 0.3;
    }
  }

  /**
   * Determine severity based on overreach score
   */
  private determineSeverity(overreachScore: number): 'critical' | 'major' | 'minor' {
    if (overreachScore >= 0.8) return 'critical';
    if (overreachScore >= 0.6) return 'major';
    return 'minor';
  }

  /**
   * Generate recommendation for overclaiming
   */
  private generateOverclaimingRecommendation(
    claim: ToulminClaim,
    analysis: ScopeAnalysis
  ): string {
    const recommendations: string[] = [];

    if (analysis.claimStrength === 'universal' || analysis.claimStrength === 'strong') {
      recommendations.push('Add qualification to weaken claim strength');
    }

    if (analysis.evidenceStrength < 0.5) {
      recommendations.push('Provide additional evidence to support claim');
    }

    if (claim.grounds.length < 3) {
      recommendations.push(`Add ${3 - claim.grounds.length} more piece(s) of evidence`);
    }

    if (!claim.backing) {
      recommendations.push('Add backing to support warrant');
    }

    return recommendations.join('; OR ');
  }

  /**
   * Calculate audit metadata
   */
  private calculateMetadata(
    issues: ScopeIssue[],
    totalClaims: number,
    processingTime: number
  ): ScopeAuditMetadata {
    const overclaimingInstances = issues.filter(i => i.type === 'overclaiming').length;
    const unsupportedLeaps = issues.filter(i => i.type === 'unsupported-leap').length;
    const missingQualifications = issues.filter(i => i.type === 'missing-qualification').length;

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    const averageOverreachScore = issues.length > 0
      ? issues.reduce((sum, i) => sum + i.analysis.overreachScore, 0) / issues.length
      : 0;

    return {
      claimsAudited: totalClaims,
      overclaimingInstances,
      unsupportedLeaps,
      missingQualifications,
      criticalIssues,
      majorIssues,
      minorIssues,
      averageOverreachScore,
      processingTime
    };
  }

  /**
   * Calculate scope score
   *
   * Formula: 1.0 - penalties
   * Critical issues: -0.25 each
   * Major issues: -0.10 each
   * Minor issues: -0.03 each
   */
  private calculateScopeScore(
    issues: ScopeIssue[],
    metadata: ScopeAuditMetadata
  ): number {
    const penalty = (
      metadata.criticalIssues * 0.25 +
      metadata.majorIssues * 0.10 +
      metadata.minorIssues * 0.03
    );

    return Math.max(0, 1.0 - penalty);
  }

  /**
   * Get detailed report
   */
  getDetailedReport(result: ScopeAuditResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('SCOPE POLICING AUDIT REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    // Summary
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Score: ${(result.score * 100).toFixed(1)}% (threshold: 80%)`);
    lines.push('');

    // Metadata
    lines.push('AUDIT METADATA:');
    lines.push(`  Claims audited: ${result.metadata.claimsAudited}`);
    lines.push(`  Overclaiming instances: ${result.metadata.overclaimingInstances}`);
    lines.push(`  Unsupported leaps: ${result.metadata.unsupportedLeaps}`);
    lines.push(`  Missing qualifications: ${result.metadata.missingQualifications}`);
    lines.push(`  Critical issues: ${result.metadata.criticalIssues}`);
    lines.push(`  Major issues: ${result.metadata.majorIssues}`);
    lines.push(`  Minor issues: ${result.metadata.minorIssues}`);
    lines.push(`  Average overreach score: ${(result.metadata.averageOverreachScore * 100).toFixed(1)}%`);
    lines.push(`  Processing time: ${result.metadata.processingTime}ms`);
    lines.push('');

    // Issues
    if (result.issues.length > 0) {
      lines.push('ISSUES DETECTED:');
      lines.push('');

      for (const issue of result.issues) {
        const icon = issue.severity === 'critical' ? '🔴' :
                     issue.severity === 'major' ? '🟠' : '🟡';
        lines.push(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.claimId}`);
        lines.push(`   Claim: ${issue.claim}`);
        lines.push(`   Issue: ${issue.issue}`);
        lines.push(`   Recommendation: ${issue.recommendation}`);
        lines.push(`   Analysis:`);
        lines.push(`     Claim strength: ${issue.analysis.claimStrength}`);
        lines.push(`     Evidence strength: ${(issue.analysis.evidenceStrength * 100).toFixed(0)}%`);
        lines.push(`     Warrant generality: ${(issue.analysis.warrantGenerality * 100).toFixed(0)}%`);
        lines.push(`     Overreach score: ${(issue.analysis.overreachScore * 100).toFixed(0)}%`);
        if (issue.analysis.specificIssues.length > 0) {
          lines.push(`     Specific issues:`);
          issue.analysis.specificIssues.forEach(si => {
            lines.push(`       - ${si}`);
          });
        }
        lines.push('');
      }
    } else {
      lines.push('✅ No scope violations detected!');
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}
