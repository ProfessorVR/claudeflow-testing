/**
 * Consistency Auditor - Detects term drift and definition changes
 *
 * This is a READ-ONLY reviewer that detects issues without generating content.
 * It identifies term drift, definition changes, and synonym violations.
 *
 * @module consistency-auditor
 */

import type { ClaimMap } from '../sir/claim-map.js';
import type { ConceptLedger, ConceptEntry, DriftDetection } from '../sir/concept-ledger.js';

/**
 * Consistency audit result
 */
export interface ConsistencyAuditResult {
  /** Whether audit passed */
  passed: boolean;

  /** Overall consistency score (0-1) */
  score: number;

  /** Issues detected */
  issues: ConsistencyIssue[];

  /** Audit metadata */
  metadata: ConsistencyAuditMetadata;
}

/**
 * Consistency issue detected
 */
export interface ConsistencyIssue {
  /** Issue type */
  type: 'term-drift' | 'definition-change' | 'synonym-violation';

  /** Term with issue */
  term: string;

  /** Locations where issue occurs */
  locations: {
    original: { sectionId: string; paragraphIndex: number };
    drift: { sectionId: string; paragraphIndex: number };
  };

  /** Original usage context */
  originalUsage: string;

  /** Drifted usage context */
  driftedUsage: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Recommendation for fix */
  recommendation: string;

  /** Detailed analysis */
  analysis: string;
}

/**
 * Audit metadata
 */
export interface ConsistencyAuditMetadata {
  /** Terms audited */
  termsAudited: number;

  /** Drift instances detected */
  driftInstancesDetected: number;

  /** Critical issues */
  criticalIssues: number;

  /** Major issues */
  majorIssues: number;

  /** Minor issues */
  minorIssues: number;

  /** Overall consistency rate */
  overallConsistencyRate: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * ConsistencyAuditor - READ-ONLY reviewer for term drift
 */
export class ConsistencyAuditor {
  constructor(private conceptLedger: ConceptLedger) {}

  /**
   * Audit for term drift across document
   *
   * This is a READ-ONLY operation - it does not modify content,
   * only detects and reports issues.
   */
  async audit(claimMap: ClaimMap): Promise<ConsistencyAuditResult> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];

    // Audit each concept for drift
    for (const [term, entry] of this.conceptLedger.concepts) {
      // Detect meaning drift
      const drifts = this.detectMeaningDrift(entry);
      issues.push(...drifts);

      // Detect synonym violations
      const synonymViolations = this.detectSynonymViolations(entry);
      issues.push(...synonymViolations);

      // Detect definition changes
      const definitionChanges = this.detectDefinitionChanges(entry);
      issues.push(...definitionChanges);
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(issues, Date.now() - startTime);

    // Calculate score
    const score = this.calculateConsistencyScore(issues, metadata);

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
   * Detect meaning drift for a concept
   */
  private detectMeaningDrift(entry: ConceptEntry): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Use existing drift detections from concept ledger
    for (const drift of entry.driftDetections) {
      issues.push({
        type: 'term-drift',
        term: entry.term,
        locations: {
          original: entry.introducedAt,
          drift: drift.location
        },
        originalUsage: entry.definition,
        driftedUsage: drift.driftedMeaning,
        severity: drift.severity,
        recommendation: drift.suggestedFix,
        analysis: this.analyzeDrift(entry.definition, drift)
      });
    }

    return issues;
  }

  /**
   * Analyze drift in detail
   */
  private analyzeDrift(definition: string, drift: DriftDetection): string {
    const analysis: string[] = [];

    // Identify drift type
    analysis.push(`Issue: ${drift.issue}`);

    // Check for category mismatch
    if (this.isCategoryMismatch(definition, drift.driftedMeaning)) {
      analysis.push('Category mismatch detected (e.g., faculty → medium, process → object)');
    }

    // Check for scope shift
    if (this.isScopeShift(definition, drift.driftedMeaning)) {
      analysis.push('Scope shift detected (term used more broadly or narrowly)');
    }

    // Provide specific examples
    analysis.push(`Original: "${drift.originalMeaning}"`);
    analysis.push(`Drifted: "${drift.driftedMeaning}"`);
    analysis.push(`Context: ${drift.context.substring(0, 100)}...`);

    return analysis.join('\n');
  }

  /**
   * Check for category mismatch
   */
  private isCategoryMismatch(original: string, drifted: string): boolean {
    const categoryPairs = [
      ['faculty', 'medium'],
      ['process', 'object'],
      ['state', 'action'],
      ['attribute', 'substance'],
      ['function', 'entity']
    ];

    for (const [cat1, cat2] of categoryPairs) {
      const originalHas1 = original.toLowerCase().includes(cat1);
      const driftedHas2 = drifted.toLowerCase().includes(cat2);
      const originalHas2 = original.toLowerCase().includes(cat2);
      const driftedHas1 = drifted.toLowerCase().includes(cat1);

      if ((originalHas1 && driftedHas2) || (originalHas2 && driftedHas1)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for scope shift
   */
  private isScopeShift(original: string, drifted: string): boolean {
    const broadeningMarkers = ['all', 'every', 'any', 'general', 'universal'];
    const narrowingMarkers = ['specific', 'particular', 'certain', 'individual'];

    const originalBroad = broadeningMarkers.some(m => original.toLowerCase().includes(m));
    const driftedBroad = broadeningMarkers.some(m => drifted.toLowerCase().includes(m));
    const originalNarrow = narrowingMarkers.some(m => original.toLowerCase().includes(m));
    const driftedNarrow = narrowingMarkers.some(m => drifted.toLowerCase().includes(m));

    return (originalBroad && driftedNarrow) || (originalNarrow && driftedBroad);
  }

  /**
   * Detect synonym violations
   */
  private detectSynonymViolations(entry: ConceptEntry): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Check each usage for disallowed synonyms
    for (const usage of entry.usages) {
      for (const disallowedSynonym of entry.constraints.disallowedSynonyms) {
        if (usage.context.toLowerCase().includes(disallowedSynonym.toLowerCase())) {
          issues.push({
            type: 'synonym-violation',
            term: entry.term,
            locations: {
              original: entry.introducedAt,
              drift: usage.location
            },
            originalUsage: entry.term,
            driftedUsage: disallowedSynonym,
            severity: 'major',
            recommendation: `Replace "${disallowedSynonym}" with "${entry.term}"`,
            analysis: `Disallowed synonym "${disallowedSynonym}" used instead of canonical term "${entry.term}". Context: ${usage.context.substring(0, 100)}...`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect definition changes
   */
  private detectDefinitionChanges(entry: ConceptEntry): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Check for redefinitions in usages
    for (const usage of entry.usages) {
      if (this.looksLikeRedefinition(usage.context)) {
        // Check if redefinition matches original
        if (!this.definitionsMatch(entry.definition, usage.meaning)) {
          issues.push({
            type: 'definition-change',
            term: entry.term,
            locations: {
              original: entry.introducedAt,
              drift: usage.location
            },
            originalUsage: entry.definition,
            driftedUsage: usage.meaning,
            severity: 'critical',
            recommendation: `Align redefinition with original or introduce new term`,
            analysis: `Term redefined inconsistently.\nOriginal definition: "${entry.definition}"\nNew definition: "${usage.meaning}"`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check if context looks like a redefinition
   */
  private looksLikeRedefinition(context: string): boolean {
    const redefinitionMarkers = [
      /is\s+defined\s+as/i,
      /:\s+[A-Z]/,  // Colon followed by capital letter
      /means?\s+/i,
      /refers?\s+to/i,
      /can\s+be\s+understood\s+as/i
    ];

    return redefinitionMarkers.some(pattern => pattern.test(context));
  }

  /**
   * Check if two definitions match
   */
  private definitionsMatch(def1: string, def2: string): boolean {
    // Extract key terms
    const terms1 = new Set(
      def1.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    );
    const terms2 = new Set(
      def2.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    );

    // Calculate overlap
    const overlap = [...terms1].filter(t => terms2.has(t)).length;
    const minSize = Math.min(terms1.size, terms2.size);

    // Require 60% overlap for match
    return minSize > 0 && (overlap / minSize) >= 0.6;
  }

  /**
   * Calculate audit metadata
   */
  private calculateMetadata(
    issues: ConsistencyIssue[],
    processingTime: number
  ): ConsistencyAuditMetadata {
    const termsAudited = this.conceptLedger.concepts.size;
    const driftInstancesDetected = issues.filter(i => i.type === 'term-drift').length;

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    // Calculate overall consistency rate
    const totalUsages = [...this.conceptLedger.concepts.values()]
      .reduce((sum, entry) => sum + entry.usages.length, 0);
    const issueCount = issues.length;
    const overallConsistencyRate = totalUsages > 0
      ? 1.0 - (issueCount / totalUsages)
      : 1.0;

    return {
      termsAudited,
      driftInstancesDetected,
      criticalIssues,
      majorIssues,
      minorIssues,
      overallConsistencyRate,
      processingTime
    };
  }

  /**
   * Calculate consistency score
   *
   * Formula: 1.0 - penalties
   * Critical issues: -0.20 each
   * Major issues: -0.10 each
   * Minor issues: -0.05 each
   */
  private calculateConsistencyScore(
    issues: ConsistencyIssue[],
    metadata: ConsistencyAuditMetadata
  ): number {
    const penalty = (
      metadata.criticalIssues * 0.20 +
      metadata.majorIssues * 0.10 +
      metadata.minorIssues * 0.05
    );

    return Math.max(0, 1.0 - penalty);
  }

  /**
   * Get detailed report
   */
  getDetailedReport(result: ConsistencyAuditResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('CONSISTENCY AUDIT REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    // Summary
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Score: ${(result.score * 100).toFixed(1)}% (threshold: 85%)`);
    lines.push('');

    // Metadata
    lines.push('AUDIT METADATA:');
    lines.push(`  Terms audited: ${result.metadata.termsAudited}`);
    lines.push(`  Drift instances detected: ${result.metadata.driftInstancesDetected}`);
    lines.push(`  Critical issues: ${result.metadata.criticalIssues}`);
    lines.push(`  Major issues: ${result.metadata.majorIssues}`);
    lines.push(`  Minor issues: ${result.metadata.minorIssues}`);
    lines.push(`  Overall consistency rate: ${(result.metadata.overallConsistencyRate * 100).toFixed(1)}%`);
    lines.push(`  Processing time: ${result.metadata.processingTime}ms`);
    lines.push('');

    // Issues
    if (result.issues.length > 0) {
      lines.push('ISSUES DETECTED:');
      lines.push('');

      for (const issue of result.issues) {
        const icon = issue.severity === 'critical' ? '🔴' :
                     issue.severity === 'major' ? '🟠' : '🟡';
        lines.push(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.term}`);
        lines.push(`   Original: ${issue.originalUsage}`);
        lines.push(`   Drifted: ${issue.driftedUsage}`);
        lines.push(`   Recommendation: ${issue.recommendation}`);
        lines.push(`   Analysis:`);
        issue.analysis.split('\n').forEach(line => {
          lines.push(`     ${line}`);
        });
        lines.push('');
      }
    } else {
      lines.push('✅ No consistency issues detected!');
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}
