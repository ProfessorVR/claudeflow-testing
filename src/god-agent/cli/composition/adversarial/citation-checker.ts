/**
 * Citation Adequacy Checker - Validates citation practices
 *
 * This is a READ-ONLY reviewer that validates every claim has:
 * (a) direct citation, (b) interpretation frame, or (c) speculative flag
 *
 * @module citation-checker
 */

import type { ClaimMap, ToulminClaim, CitationAnchor } from '../sir/claim-map.js';

/**
 * Citation check result
 */
export interface CitationCheckResult {
  /** Whether check passed */
  passed: boolean;

  /** Overall citation adequacy score (0-1) */
  score: number;

  /** Issues detected */
  issues: CitationIssue[];

  /** Check metadata */
  metadata: CitationCheckMetadata;
}

/**
 * Citation issue detected
 */
export interface CitationIssue {
  /** Issue type */
  type: 'missing-citation' | 'weak-citation' | 'misframed-interpretation' | 'unsupported-speculation';

  /** Claim ID with issue */
  claimId: string;

  /** Claim statement */
  claim: string;

  /** Existing citations (if any) */
  existingCitations: CitationAnchor[];

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Recommendation for fix */
  recommendation: string;

  /** Detailed analysis */
  analysis: CitationAnalysis;
}

/**
 * Detailed citation analysis
 */
export interface CitationAnalysis {
  /** Claim type */
  claimType: 'factual' | 'interpretive' | 'speculative';

  /** Citation count */
  citationCount: number;

  /** Has interpretation frame */
  hasInterpretationFrame: boolean;

  /** Has speculative flag */
  hasSpeculativeFlag: boolean;

  /** Citation quality (0-1) */
  citationQuality: number;

  /** Specific issues */
  specificIssues: string[];
}

/**
 * Check metadata
 */
export interface CitationCheckMetadata {
  /** Claims checked */
  claimsChecked: number;

  /** Factual claims */
  factualClaims: number;

  /** Interpretive claims */
  interpretiveClaims: number;

  /** Speculative claims */
  speculativeClaims: number;

  /** Missing citations */
  missingCitations: number;

  /** Weak citations */
  weakCitations: number;

  /** Misframed interpretations */
  misframedInterpretations: number;

  /** Critical issues */
  criticalIssues: number;

  /** Major issues */
  majorIssues: number;

  /** Minor issues */
  minorIssues: number;

  /** Average citation quality */
  averageCitationQuality: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * CitationAdequacyChecker - READ-ONLY reviewer for citations
 */
export class CitationAdequacyChecker {
  /**
   * Check citation adequacy in claim map
   *
   * This is a READ-ONLY operation - it does not modify content,
   * only validates citation practices.
   */
  async check(claimMap: ClaimMap): Promise<CitationCheckResult> {
    const startTime = Date.now();
    const issues: CitationIssue[] = [];

    for (const claim of claimMap.claims) {
      // Classify claim type
      const claimType = this.classifyClaimType(claim);

      // Check citation adequacy
      const citationIssue = this.checkCitationAdequacy(claim, claimType);
      if (citationIssue) {
        issues.push(citationIssue);
      }
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(issues, claimMap.claims.length, Date.now() - startTime);

    // Calculate score
    const score = this.calculateCitationScore(issues, metadata);

    // Determine pass/fail (threshold: 0.85)
    const passed = score >= 0.85 && metadata.criticalIssues === 0;

    return {
      passed,
      score,
      issues,
      metadata
    };
  }

  /**
   * Classify claim type
   */
  private classifyClaimType(claim: ToulminClaim): 'factual' | 'interpretive' | 'speculative' {
    const claimLower = claim.claim.toLowerCase();

    // Speculative markers
    const speculativeMarkers = /\b(may|might|could|possibly|perhaps|arguably|likely)\b/;
    if (speculativeMarkers.test(claimLower)) {
      return 'speculative';
    }

    // Interpretive markers
    const interpretiveMarkers = /\b(suggests?|indicates?|implies?|can be (read|understood|interpreted) as)\b/;
    if (interpretiveMarkers.test(claimLower)) {
      return 'interpretive';
    }

    // Factual (default)
    return 'factual';
  }

  /**
   * Check citation adequacy for claim
   */
  private checkCitationAdequacy(
    claim: ToulminClaim,
    claimType: 'factual' | 'interpretive' | 'speculative'
  ): CitationIssue | null {
    const hasInterpretationFrame = this.hasInterpretationFrame(claim.claim);
    const hasSpeculativeFlag = this.hasSpeculativeFlag(claim.claim);
    const citationCount = claim.citations.length;
    const citationQuality = this.assessCitationQuality(claim.citations);

    const specificIssues: string[] = [];

    // Rule 1: Factual claims MUST have direct citation
    if (claimType === 'factual' && citationCount === 0) {
      return {
        type: 'missing-citation',
        claimId: claim.id,
        claim: claim.claim,
        existingCitations: claim.citations,
        severity: 'critical',
        recommendation: 'Add direct citation to support factual claim',
        analysis: {
          claimType,
          citationCount,
          hasInterpretationFrame,
          hasSpeculativeFlag,
          citationQuality,
          specificIssues: ['Factual claim without citation']
        }
      };
    }

    // Rule 2: Factual claims should have quality citations
    if (claimType === 'factual' && citationQuality < 0.5) {
      specificIssues.push('Citation quality is low');

      return {
        type: 'weak-citation',
        claimId: claim.id,
        claim: claim.claim,
        existingCitations: claim.citations,
        severity: 'major',
        recommendation: 'Improve citation quality (add page numbers, ensure proper format)',
        analysis: {
          claimType,
          citationCount,
          hasInterpretationFrame,
          hasSpeculativeFlag,
          citationQuality,
          specificIssues
        }
      };
    }

    // Rule 3: Interpretive claims MUST be framed as interpretation
    if (claimType === 'interpretive' && !hasInterpretationFrame) {
      specificIssues.push('Interpretive claim not framed as interpretation');

      return {
        type: 'misframed-interpretation',
        claimId: claim.id,
        claim: claim.claim,
        existingCitations: claim.citations,
        severity: 'major',
        recommendation: 'Frame as interpretation (e.g., "This suggests...", "This can be read as...")',
        analysis: {
          claimType,
          citationCount,
          hasInterpretationFrame,
          hasSpeculativeFlag,
          citationQuality,
          specificIssues
        }
      };
    }

    // Rule 4: Speculative claims MUST be flagged as speculative
    if (claimType === 'speculative' && !hasSpeculativeFlag) {
      specificIssues.push('Speculative claim not flagged as speculation');

      return {
        type: 'unsupported-speculation',
        claimId: claim.id,
        claim: claim.claim,
        existingCitations: claim.citations,
        severity: 'minor',
        recommendation: 'Add speculative flag (e.g., "may", "possibly", "arguably")',
        analysis: {
          claimType,
          citationCount,
          hasInterpretationFrame,
          hasSpeculativeFlag,
          citationQuality,
          specificIssues
        }
      };
    }

    // Rule 5: Interpretive claims should have citation support
    if (claimType === 'interpretive' && citationCount === 0) {
      specificIssues.push('Interpretive claim without supporting citation');

      return {
        type: 'weak-citation',
        claimId: claim.id,
        claim: claim.claim,
        existingCitations: claim.citations,
        severity: 'minor',
        recommendation: 'Add citation to text being interpreted',
        analysis: {
          claimType,
          citationCount,
          hasInterpretationFrame,
          hasSpeculativeFlag,
          citationQuality,
          specificIssues
        }
      };
    }

    return null;
  }

  /**
   * Check if claim has interpretation frame
   */
  private hasInterpretationFrame(claim: string): boolean {
    const frameMarkers = [
      /\b(suggests?|indicates?|implies?)\b/i,
      /\b(can be (read|understood|interpreted) as)\b/i,
      /\b(appears to|seems to)\b/i,
      /\b(reading|interpretation|understanding)\b/i
    ];

    return frameMarkers.some(marker => marker.test(claim));
  }

  /**
   * Check if claim has speculative flag
   */
  private hasSpeculativeFlag(claim: string): boolean {
    const speculativeMarkers = [
      /\b(may|might|could|possibly|perhaps)\b/i,
      /\b(arguably|potentially|likely)\b/i,
      /\b(it is possible that|one possibility is)\b/i
    ];

    return speculativeMarkers.some(marker => marker.test(claim));
  }

  /**
   * Assess citation quality
   */
  private assessCitationQuality(citations: CitationAnchor[]): number {
    if (citations.length === 0) return 0;

    let qualitySum = 0;

    for (const citation of citations) {
      let quality = 0.3; // Base quality for having a citation

      // Has locator (page/paragraph number)
      if (citation.locator) {
        quality += 0.5;
      }

      // Has proper author-year format
      if (this.hasProperFormat(citation)) {
        quality += 0.2;
      }

      qualitySum += Math.min(1.0, quality);
    }

    return qualitySum / citations.length;
  }

  /**
   * Check if citation has proper format
   */
  private hasProperFormat(citation: CitationAnchor): boolean {
    // Check for author and year
    return citation.author.length > 0 && citation.year >= 1900;
  }

  /**
   * Calculate check metadata
   */
  private calculateMetadata(
    issues: CitationIssue[],
    totalClaims: number,
    processingTime: number
  ): CitationCheckMetadata {
    const factualClaims = issues.filter(i => i.analysis.claimType === 'factual').length;
    const interpretiveClaims = issues.filter(i => i.analysis.claimType === 'interpretive').length;
    const speculativeClaims = issues.filter(i => i.analysis.claimType === 'speculative').length;

    const missingCitations = issues.filter(i => i.type === 'missing-citation').length;
    const weakCitations = issues.filter(i => i.type === 'weak-citation').length;
    const misframedInterpretations = issues.filter(i => i.type === 'misframed-interpretation').length;

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    const averageCitationQuality = issues.length > 0
      ? issues.reduce((sum, i) => sum + i.analysis.citationQuality, 0) / issues.length
      : 1.0;

    return {
      claimsChecked: totalClaims,
      factualClaims,
      interpretiveClaims,
      speculativeClaims,
      missingCitations,
      weakCitations,
      misframedInterpretations,
      criticalIssues,
      majorIssues,
      minorIssues,
      averageCitationQuality,
      processingTime
    };
  }

  /**
   * Calculate citation score
   *
   * Formula: 1.0 - penalties
   * Critical issues: -0.25 each
   * Major issues: -0.10 each
   * Minor issues: -0.03 each
   */
  private calculateCitationScore(
    issues: CitationIssue[],
    metadata: CitationCheckMetadata
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
  getDetailedReport(result: CitationCheckResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('CITATION ADEQUACY CHECK REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    // Summary
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Score: ${(result.score * 100).toFixed(1)}% (threshold: 85%)`);
    lines.push('');

    // Metadata
    lines.push('CHECK METADATA:');
    lines.push(`  Claims checked: ${result.metadata.claimsChecked}`);
    lines.push(`  Factual claims: ${result.metadata.factualClaims}`);
    lines.push(`  Interpretive claims: ${result.metadata.interpretiveClaims}`);
    lines.push(`  Speculative claims: ${result.metadata.speculativeClaims}`);
    lines.push(`  Missing citations: ${result.metadata.missingCitations}`);
    lines.push(`  Weak citations: ${result.metadata.weakCitations}`);
    lines.push(`  Misframed interpretations: ${result.metadata.misframedInterpretations}`);
    lines.push(`  Critical issues: ${result.metadata.criticalIssues}`);
    lines.push(`  Major issues: ${result.metadata.majorIssues}`);
    lines.push(`  Minor issues: ${result.metadata.minorIssues}`);
    lines.push(`  Average citation quality: ${(result.metadata.averageCitationQuality * 100).toFixed(1)}%`);
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
        lines.push(`   Recommendation: ${issue.recommendation}`);
        lines.push(`   Analysis:`);
        lines.push(`     Claim type: ${issue.analysis.claimType}`);
        lines.push(`     Citation count: ${issue.analysis.citationCount}`);
        lines.push(`     Has interpretation frame: ${issue.analysis.hasInterpretationFrame ? 'Yes' : 'No'}`);
        lines.push(`     Has speculative flag: ${issue.analysis.hasSpeculativeFlag ? 'Yes' : 'No'}`);
        lines.push(`     Citation quality: ${(issue.analysis.citationQuality * 100).toFixed(0)}%`);
        if (issue.analysis.specificIssues.length > 0) {
          lines.push(`     Specific issues:`);
          issue.analysis.specificIssues.forEach(si => {
            lines.push(`       - ${si}`);
          });
        }
        lines.push('');
      }
    } else {
      lines.push('✅ All citations are adequate!');
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}
