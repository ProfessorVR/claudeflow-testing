/**
 * Adversarial Orchestrator - Coordinates all adversarial reviewers
 *
 * This orchestrator runs all adversarial reviewers (consistency, scope, counter-argument,
 * citation) and aggregates their results into a comprehensive quality assessment.
 *
 * @module adversarial-orchestrator
 */

import type { ClaimMap } from '../sir/claim-map.js';
import type { ConceptLedger } from '../sir/concept-ledger.js';

import { ConsistencyAuditor, type ConsistencyAuditResult } from './consistency-auditor.js';
import { ScopePoliceReviewer, type ScopeAuditResult } from './scope-police.js';
import { CounterArgumentTester, type CounterArgumentTestResult } from './counter-argument-tester.js';
import { CitationAdequacyChecker, type CitationCheckResult } from './citation-checker.js';

/**
 * Adversarial review result
 */
export interface AdversarialReviewResult {
  /** Overall pass/fail */
  passed: boolean;

  /** Overall quality score (0-1) */
  overallScore: number;

  /** Individual reviewer results */
  reviewerResults: {
    consistency: ConsistencyAuditResult;
    scope: ScopeAuditResult;
    counterArgument: CounterArgumentTestResult;
    citation: CitationCheckResult;
  };

  /** Aggregated metadata */
  metadata: AdversarialReviewMetadata;

  /** Comprehensive report */
  report: string;
}

/**
 * Aggregated metadata
 */
export interface AdversarialReviewMetadata {
  /** Total reviewers run */
  reviewersRun: number;

  /** Reviewers passed */
  reviewersPassed: number;

  /** Reviewers failed */
  reviewersFailed: number;

  /** Total issues detected */
  totalIssues: number;

  /** Critical issues */
  criticalIssues: number;

  /** Major issues */
  majorIssues: number;

  /** Minor issues */
  minorIssues: number;

  /** Individual scores */
  scores: {
    consistency: number;
    scope: number;
    counterArgument: number;
    citation: number;
  };

  /** Total processing time (ms) */
  totalProcessingTime: number;
}

/**
 * Orchestrator options
 */
export interface AdversarialOrchestratorOptions {
  /** Claim map to review */
  claimMap: ClaimMap;

  /** Concept ledger (for consistency auditor) */
  conceptLedger: ConceptLedger;

  /** Weight for consistency score (default: 0.25) */
  consistencyWeight?: number;

  /** Weight for scope score (default: 0.25) */
  scopeWeight?: number;

  /** Weight for counter-argument score (default: 0.25) */
  counterArgumentWeight?: number;

  /** Weight for citation score (default: 0.25) */
  citationWeight?: number;
}

/**
 * AdversarialOrchestrator - Coordinates all adversarial reviewers
 */
export class AdversarialOrchestrator {
  private consistencyAuditor: ConsistencyAuditor;
  private scopePolice: ScopePoliceReviewer;
  private counterArgumentTester: CounterArgumentTester;
  private citationChecker: CitationAdequacyChecker;

  private weights: {
    consistency: number;
    scope: number;
    counterArgument: number;
    citation: number;
  };

  constructor(conceptLedger: ConceptLedger, weights?: Partial<AdversarialOrchestratorOptions>) {
    this.consistencyAuditor = new ConsistencyAuditor(conceptLedger);
    this.scopePolice = new ScopePoliceReviewer();
    this.counterArgumentTester = new CounterArgumentTester();
    this.citationChecker = new CitationAdequacyChecker();

    // Default weights: equal (0.25 each)
    this.weights = {
      consistency: weights?.consistencyWeight ?? 0.25,
      scope: weights?.scopeWeight ?? 0.25,
      counterArgument: weights?.counterArgumentWeight ?? 0.25,
      citation: weights?.citationWeight ?? 0.25
    };

    // Normalize weights to sum to 1.0
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (sum !== 1.0) {
      this.weights.consistency /= sum;
      this.weights.scope /= sum;
      this.weights.counterArgument /= sum;
      this.weights.citation /= sum;
    }
  }

  /**
   * Run all adversarial reviewers
   */
  async review(claimMap: ClaimMap): Promise<AdversarialReviewResult> {
    const startTime = Date.now();

    // Run all reviewers in parallel
    const [consistency, scope, counterArgument, citation] = await Promise.all([
      this.consistencyAuditor.audit(claimMap),
      this.scopePolice.review(claimMap),
      this.counterArgumentTester.test(claimMap),
      this.citationChecker.check(claimMap)
    ]);

    const reviewerResults = {
      consistency,
      scope,
      counterArgument,
      citation
    };

    // Calculate overall score
    const overallScore = this.calculateOverallScore(reviewerResults);

    // Aggregate metadata
    const metadata = this.aggregateMetadata(reviewerResults, Date.now() - startTime);

    // Determine overall pass/fail
    const passed = this.determineOverallPass(reviewerResults, overallScore);

    // Generate comprehensive report
    const report = this.generateComprehensiveReport(reviewerResults, overallScore, passed, metadata);

    return {
      passed,
      overallScore,
      reviewerResults,
      metadata,
      report
    };
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(results: {
    consistency: ConsistencyAuditResult;
    scope: ScopeAuditResult;
    counterArgument: CounterArgumentTestResult;
    citation: CitationCheckResult;
  }): number {
    return (
      results.consistency.score * this.weights.consistency +
      results.scope.score * this.weights.scope +
      results.counterArgument.score * this.weights.counterArgument +
      results.citation.score * this.weights.citation
    );
  }

  /**
   * Aggregate metadata from all reviewers
   */
  private aggregateMetadata(
    results: {
      consistency: ConsistencyAuditResult;
      scope: ScopeAuditResult;
      counterArgument: CounterArgumentTestResult;
      citation: CitationCheckResult;
    },
    totalProcessingTime: number
  ): AdversarialReviewMetadata {
    const reviewersRun = 4;
    const reviewersPassed = [
      results.consistency.passed,
      results.scope.passed,
      results.counterArgument.passed,
      results.citation.passed
    ].filter(p => p).length;
    const reviewersFailed = reviewersRun - reviewersPassed;

    const totalIssues =
      results.consistency.issues.length +
      results.scope.issues.length +
      results.counterArgument.issues.length +
      results.citation.issues.length;

    const criticalIssues =
      results.consistency.metadata.criticalIssues +
      results.scope.metadata.criticalIssues +
      results.counterArgument.metadata.criticalIssues +
      results.citation.metadata.criticalIssues;

    const majorIssues =
      results.consistency.metadata.majorIssues +
      results.scope.metadata.majorIssues +
      results.counterArgument.metadata.majorIssues +
      results.citation.metadata.majorIssues;

    const minorIssues =
      results.consistency.metadata.minorIssues +
      results.scope.metadata.minorIssues +
      results.counterArgument.metadata.minorIssues +
      results.citation.metadata.minorIssues;

    return {
      reviewersRun,
      reviewersPassed,
      reviewersFailed,
      totalIssues,
      criticalIssues,
      majorIssues,
      minorIssues,
      scores: {
        consistency: results.consistency.score,
        scope: results.scope.score,
        counterArgument: results.counterArgument.score,
        citation: results.citation.score
      },
      totalProcessingTime
    };
  }

  /**
   * Determine overall pass/fail
   *
   * Passes if:
   * 1. Overall score >= 0.80
   * 2. No critical issues
   * 3. At least 3 of 4 reviewers passed
   */
  private determineOverallPass(
    results: {
      consistency: ConsistencyAuditResult;
      scope: ScopeAuditResult;
      counterArgument: CounterArgumentTestResult;
      citation: CitationCheckResult;
    },
    overallScore: number
  ): boolean {
    const noCriticalIssues = [
      results.consistency.metadata.criticalIssues,
      results.scope.metadata.criticalIssues,
      results.counterArgument.metadata.criticalIssues,
      results.citation.metadata.criticalIssues
    ].every(count => count === 0);

    const passingReviewers = [
      results.consistency.passed,
      results.scope.passed,
      results.counterArgument.passed,
      results.citation.passed
    ].filter(p => p).length;

    return overallScore >= 0.80 && noCriticalIssues && passingReviewers >= 3;
  }

  /**
   * Generate comprehensive report
   */
  private generateComprehensiveReport(
    results: {
      consistency: ConsistencyAuditResult;
      scope: ScopeAuditResult;
      counterArgument: CounterArgumentTestResult;
      citation: CitationCheckResult;
    },
    overallScore: number,
    passed: boolean,
    metadata: AdversarialReviewMetadata
  ): string {
    const lines: string[] = [];

    lines.push('═'.repeat(80));
    lines.push('ADVERSARIAL REVIEW COMPREHENSIVE REPORT');
    lines.push('═'.repeat(80));
    lines.push('');

    // Overall summary
    lines.push('OVERALL ASSESSMENT:');
    lines.push(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`  Overall Score: ${(overallScore * 100).toFixed(1)}% (threshold: 80%)`);
    lines.push(`  Reviewers Passed: ${metadata.reviewersPassed}/${metadata.reviewersRun}`);
    lines.push('');

    // Aggregate metrics
    lines.push('AGGREGATE METRICS:');
    lines.push(`  Total Issues: ${metadata.totalIssues}`);
    lines.push(`  Critical Issues: ${metadata.criticalIssues}`);
    lines.push(`  Major Issues: ${metadata.majorIssues}`);
    lines.push(`  Minor Issues: ${metadata.minorIssues}`);
    lines.push(`  Total Processing Time: ${metadata.totalProcessingTime}ms`);
    lines.push('');

    // Individual reviewer scores
    lines.push('INDIVIDUAL REVIEWER SCORES:');
    lines.push(`  Consistency Auditor: ${(metadata.scores.consistency * 100).toFixed(1)}% (weight: ${(this.weights.consistency * 100).toFixed(0)}%)`);
    lines.push(`  Scope Police: ${(metadata.scores.scope * 100).toFixed(1)}% (weight: ${(this.weights.scope * 100).toFixed(0)}%)`);
    lines.push(`  Counter-Argument Tester: ${(metadata.scores.counterArgument * 100).toFixed(1)}% (weight: ${(this.weights.counterArgument * 100).toFixed(0)}%)`);
    lines.push(`  Citation Checker: ${(metadata.scores.citation * 100).toFixed(1)}% (weight: ${(this.weights.citation * 100).toFixed(0)}%)`);
    lines.push('');

    // Individual reviewer results
    lines.push('═'.repeat(80));
    lines.push('DETAILED REVIEWER REPORTS');
    lines.push('═'.repeat(80));
    lines.push('');

    // Consistency Auditor
    lines.push('1. CONSISTENCY AUDITOR');
    lines.push('-'.repeat(80));
    lines.push(this.consistencyAuditor.getDetailedReport(results.consistency));
    lines.push('');

    // Scope Police
    lines.push('2. SCOPE POLICE');
    lines.push('-'.repeat(80));
    lines.push(this.scopePolice.getDetailedReport(results.scope));
    lines.push('');

    // Counter-Argument Tester
    lines.push('3. COUNTER-ARGUMENT TESTER');
    lines.push('-'.repeat(80));
    lines.push(this.counterArgumentTester.getDetailedReport(results.counterArgument));
    lines.push('');

    // Citation Checker
    lines.push('4. CITATION CHECKER');
    lines.push('-'.repeat(80));
    lines.push(this.citationChecker.getDetailedReport(results.citation));
    lines.push('');

    lines.push('═'.repeat(80));
    lines.push('END OF ADVERSARIAL REVIEW REPORT');
    lines.push('═'.repeat(80));

    return lines.join('\n');
  }

  /**
   * Get summary of critical issues
   */
  getSummaryOfCriticalIssues(result: AdversarialReviewResult): string[] {
    const summary: string[] = [];

    // Consistency critical issues
    for (const issue of result.reviewerResults.consistency.issues) {
      if (issue.severity === 'critical') {
        summary.push(`[CONSISTENCY] ${issue.term}: ${issue.type}`);
      }
    }

    // Scope critical issues
    for (const issue of result.reviewerResults.scope.issues) {
      if (issue.severity === 'critical') {
        summary.push(`[SCOPE] ${issue.claimId}: ${issue.type}`);
      }
    }

    // Counter-argument critical issues
    for (const issue of result.reviewerResults.counterArgument.issues) {
      if (issue.severity === 'critical') {
        summary.push(`[COUNTER-ARGUMENT] ${issue.claimId}: ${issue.type}`);
      }
    }

    // Citation critical issues
    for (const issue of result.reviewerResults.citation.issues) {
      if (issue.severity === 'critical') {
        summary.push(`[CITATION] ${issue.claimId}: ${issue.type}`);
      }
    }

    return summary;
  }
}
