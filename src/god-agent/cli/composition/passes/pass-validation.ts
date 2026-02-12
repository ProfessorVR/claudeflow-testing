/**
 * Pass Validation - Validates outputs from micro, meso, and macro passes
 *
 * This validator ensures each pass meets its quality thresholds:
 * - Micro: Toulmin completeness ≥0.85
 * - Meso: Coherence ≥0.90, duplication ≤0.10, consistency ≥0.95
 * - Macro: Significance ≥0.85, stakes ≥0.85, architectonics ≥0.90
 *
 * @module pass-validation
 */

import type { MicroPassResult } from './micro-pass.js';
import type { MesoPassResult } from './meso-pass.js';
import type { MacroPassResult } from './macro-pass.js';

/**
 * Pass validation result
 */
export interface PassValidationResult {
  /** Whether validation passed */
  passed: boolean;

  /** Overall validation score */
  score: number;

  /** Validation issues detected */
  issues: PassValidationIssue[];

  /** Validation metadata */
  metadata: PassValidationMetadata;

  /** Detailed validation report */
  report: string;
}

/**
 * Validation issue
 */
export interface PassValidationIssue {
  /** Issue severity */
  severity: 'critical' | 'major' | 'minor';

  /** Issue type */
  type: string;

  /** Issue description */
  description: string;

  /** Location (pass type) */
  location: 'micro' | 'meso' | 'macro';

  /** Specific component affected */
  component: string;

  /** Suggested fix */
  suggestedFix: string;

  /** Threshold violated (if applicable) */
  thresholdViolation?: {
    metric: string;
    actual: number;
    required: number;
  };
}

/**
 * Pass validation metadata
 */
export interface PassValidationMetadata {
  /** Critical issues count */
  criticalIssues: number;

  /** Major issues count */
  majorIssues: number;

  /** Minor issues count */
  minorIssues: number;

  /** Total issues count */
  totalIssues: number;

  /** Issues by pass type */
  issuesByPass: {
    micro: number;
    meso: number;
    macro: number;
  };

  /** Validation time (ms) */
  validationTime: number;
}

/**
 * PassValidation - Validates outputs from all passes
 */
export class PassValidation {
  /**
   * Validate micro pass result
   */
  async validateMicro(result: MicroPassResult): Promise<PassValidationResult> {
    const startTime = Date.now();
    const issues: PassValidationIssue[] = [];

    // Validate Toulmin completeness (≥0.85)
    if (result.metadata.averageToulminCompleteness < 0.85) {
      issues.push({
        severity: 'critical',
        type: 'toulmin-completeness-below-threshold',
        description: `Average Toulmin completeness is ${(result.metadata.averageToulminCompleteness * 100).toFixed(1)}%, below required 85%`,
        location: 'micro',
        component: 'claim-map',
        suggestedFix: 'Add missing warrants, backing, or rebuttals to claims',
        thresholdViolation: {
          metric: 'averageToulminCompleteness',
          actual: result.metadata.averageToulminCompleteness,
          required: 0.85
        }
      });
    }

    // Validate warrant generality (target 0.6-0.8)
    if (result.metadata.averageWarrantGenerality < 0.6) {
      issues.push({
        severity: 'major',
        type: 'warrant-too-general',
        description: `Average warrant generality is ${(result.metadata.averageWarrantGenerality * 100).toFixed(1)}%, below target 60%`,
        location: 'micro',
        component: 'warrants',
        suggestedFix: 'Make warrants more specific to their claims while maintaining generality'
      });
    } else if (result.metadata.averageWarrantGenerality > 0.8) {
      issues.push({
        severity: 'major',
        type: 'warrant-too-specific',
        description: `Average warrant generality is ${(result.metadata.averageWarrantGenerality * 100).toFixed(1)}%, above target 80%`,
        location: 'micro',
        component: 'warrants',
        suggestedFix: 'Make warrants more general to avoid restating claims'
      });
    }

    // Validate claim map structure
    if (result.claimMap.claims.length === 0) {
      issues.push({
        severity: 'critical',
        type: 'no-claims-generated',
        description: 'No claims were generated in this micro pass',
        location: 'micro',
        component: 'claim-map',
        suggestedFix: 'Ensure target claims are provided in specification'
      });
    }

    // Validate citation coverage
    if (result.metadata.citationCount === 0) {
      issues.push({
        severity: 'major',
        type: 'no-citations',
        description: 'No citations present in claim map',
        location: 'micro',
        component: 'citations',
        suggestedFix: 'Add citations to support grounds (evidence)'
      });
    }

    // Validate concept ledger
    if (result.conceptLedger.concepts.size === 0) {
      issues.push({
        severity: 'minor',
        type: 'no-concepts-introduced',
        description: 'No concepts introduced in this subsection',
        location: 'micro',
        component: 'concept-ledger',
        suggestedFix: 'Verify if subsection should introduce technical terms'
      });
    }

    // Calculate metadata
    const metadata = this.calculateValidationMetadata(issues, Date.now() - startTime);

    // Determine pass/fail
    const score = this.calculateValidationScore(issues);
    const passed = score >= 0.85 && metadata.criticalIssues === 0;

    // Generate report
    const report = this.generateMicroReport(result, issues, score, passed);

    return {
      passed,
      score,
      issues,
      metadata,
      report
    };
  }

  /**
   * Validate meso pass result
   */
  async validateMeso(result: MesoPassResult): Promise<PassValidationResult> {
    const startTime = Date.now();
    const issues: PassValidationIssue[] = [];

    // Validate coherence (≥0.90)
    if (result.metadata.coherenceScore < 0.90) {
      issues.push({
        severity: 'critical',
        type: 'coherence-below-threshold',
        description: `Coherence score is ${(result.metadata.coherenceScore * 100).toFixed(1)}%, below required 90%`,
        location: 'meso',
        component: 'transitions',
        suggestedFix: 'Improve transitions between subsections',
        thresholdViolation: {
          metric: 'coherenceScore',
          actual: result.metadata.coherenceScore,
          required: 0.90
        }
      });
    }

    // Validate duplication rate (≤0.10)
    if (result.metadata.duplicationRate > 0.10) {
      issues.push({
        severity: 'critical',
        type: 'duplication-above-threshold',
        description: `Duplication rate is ${(result.metadata.duplicationRate * 100).toFixed(1)}%, above maximum 10%`,
        location: 'meso',
        component: 'claim-deduplication',
        suggestedFix: 'Review and remove additional duplicate claims',
        thresholdViolation: {
          metric: 'duplicationRate',
          actual: result.metadata.duplicationRate,
          required: 0.10
        }
      });
    }

    // Validate term consistency (≥0.95)
    if (result.metadata.termConsistencyRate < 0.95) {
      issues.push({
        severity: 'critical',
        type: 'term-consistency-below-threshold',
        description: `Term consistency is ${(result.metadata.termConsistencyRate * 100).toFixed(1)}%, below required 95%`,
        location: 'meso',
        component: 'concept-ledger',
        suggestedFix: 'Align term usage to canonical definitions',
        thresholdViolation: {
          metric: 'termConsistencyRate',
          actual: result.metadata.termConsistencyRate,
          required: 0.95
        }
      });
    }

    // Validate subsection integration
    if (result.metadata.subsectionsIntegrated < 2) {
      issues.push({
        severity: 'major',
        type: 'insufficient-subsections',
        description: `Only ${result.metadata.subsectionsIntegrated} subsection(s) integrated`,
        location: 'meso',
        component: 'integration',
        suggestedFix: 'Sections should integrate at least 2 subsections'
      });
    }

    // Validate transitions
    if (result.transitions.length === 0 && result.metadata.subsectionsIntegrated > 1) {
      issues.push({
        severity: 'major',
        type: 'no-transitions',
        description: 'No transitions generated between subsections',
        location: 'meso',
        component: 'transitions',
        suggestedFix: 'Generate transitions to connect subsections'
      });
    }

    // Validate integration actions
    if (result.integrationActions.length === 0) {
      issues.push({
        severity: 'minor',
        type: 'no-integration-actions',
        description: 'No integration actions were taken',
        location: 'meso',
        component: 'integration',
        suggestedFix: 'Verify if subsections require no integration work'
      });
    }

    // Calculate metadata
    const metadata = this.calculateValidationMetadata(issues, Date.now() - startTime);

    // Determine pass/fail
    const score = this.calculateValidationScore(issues);
    const passed = score >= 0.85 && metadata.criticalIssues === 0;

    // Generate report
    const report = this.generateMesoReport(result, issues, score, passed);

    return {
      passed,
      score,
      issues,
      metadata,
      report
    };
  }

  /**
   * Validate macro pass result
   */
  async validateMacro(result: MacroPassResult): Promise<PassValidationResult> {
    const startTime = Date.now();
    const issues: PassValidationIssue[] = [];

    // Validate significance score (≥0.85)
    if (result.synthesis.soWhat.significanceScore < 0.85) {
      issues.push({
        severity: 'critical',
        type: 'significance-below-threshold',
        description: `Significance score is ${(result.synthesis.soWhat.significanceScore * 100).toFixed(1)}%, below required 85%`,
        location: 'macro',
        component: 'so-what-analysis',
        suggestedFix: 'Strengthen "so what" analysis to better articulate contribution',
        thresholdViolation: {
          metric: 'significanceScore',
          actual: result.synthesis.soWhat.significanceScore,
          required: 0.85
        }
      });
    }

    // Validate stakes score (≥0.85)
    if (result.synthesis.stakes.stakesScore < 0.85) {
      issues.push({
        severity: 'critical',
        type: 'stakes-below-threshold',
        description: `Stakes score is ${(result.synthesis.stakes.stakesScore * 100).toFixed(1)}%, below required 85%`,
        location: 'macro',
        component: 'stakes-analysis',
        suggestedFix: 'Articulate why this work matters and what is at stake',
        thresholdViolation: {
          metric: 'stakesScore',
          actual: result.synthesis.stakes.stakesScore,
          required: 0.85
        }
      });
    }

    // Validate architectonics score (≥0.90)
    if (result.synthesis.architectonics.structuralCoherence < 0.90) {
      issues.push({
        severity: 'critical',
        type: 'architectonics-below-threshold',
        description: `Structural coherence is ${(result.synthesis.architectonics.structuralCoherence * 100).toFixed(1)}%, below required 90%`,
        location: 'macro',
        component: 'architectonics',
        suggestedFix: 'Improve overall document structure and flow',
        thresholdViolation: {
          metric: 'structuralCoherence',
          actual: result.synthesis.architectonics.structuralCoherence,
          required: 0.90
        }
      });
    }

    // Validate introduction
    if (!result.introduction || result.introduction.content.length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing-introduction',
        description: 'No introduction generated',
        location: 'macro',
        component: 'introduction',
        suggestedFix: 'Generate introduction that frames entire document'
      });
    }

    // Validate conclusion
    if (!result.conclusion || result.conclusion.content.length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing-conclusion',
        description: 'No conclusion generated',
        location: 'macro',
        component: 'conclusion',
        suggestedFix: 'Generate conclusion that synthesizes all sections'
      });
    }

    // Validate body sections
    if (result.bodySections.length === 0) {
      issues.push({
        severity: 'critical',
        type: 'no-body-sections',
        description: 'No body sections present',
        location: 'macro',
        component: 'body',
        suggestedFix: 'Ensure sections are provided for synthesis'
      });
    }

    // Validate synthesized claim map
    if (result.synthesizedClaimMap.claims.length === 0) {
      issues.push({
        severity: 'major',
        type: 'no-synthesized-claims',
        description: 'No claims in synthesized claim map',
        location: 'macro',
        component: 'claim-synthesis',
        suggestedFix: 'Verify claim synthesis process'
      });
    }

    // Calculate metadata
    const metadata = this.calculateValidationMetadata(issues, Date.now() - startTime);

    // Determine pass/fail
    const score = this.calculateValidationScore(issues);
    const passed = score >= 0.85 && metadata.criticalIssues === 0;

    // Generate report
    const report = this.generateMacroReport(result, issues, score, passed);

    return {
      passed,
      score,
      issues,
      metadata,
      report
    };
  }

  /**
   * Calculate validation score
   */
  private calculateValidationScore(issues: PassValidationIssue[]): number {
    if (issues.length === 0) return 1.0;

    // Deduct points based on issue severity
    let deduction = 0;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          deduction += 0.15;
          break;
        case 'major':
          deduction += 0.08;
          break;
        case 'minor':
          deduction += 0.03;
          break;
      }
    }

    return Math.max(0, 1.0 - deduction);
  }

  /**
   * Calculate validation metadata
   */
  private calculateValidationMetadata(
    issues: PassValidationIssue[],
    validationTime: number
  ): PassValidationMetadata {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    const issuesByPass = {
      micro: issues.filter(i => i.location === 'micro').length,
      meso: issues.filter(i => i.location === 'meso').length,
      macro: issues.filter(i => i.location === 'macro').length
    };

    return {
      criticalIssues,
      majorIssues,
      minorIssues,
      totalIssues: issues.length,
      issuesByPass,
      validationTime
    };
  }

  /**
   * Generate micro pass validation report
   */
  private generateMicroReport(
    result: MicroPassResult,
    issues: PassValidationIssue[],
    score: number,
    passed: boolean
  ): string {
    const lines: string[] = [];

    lines.push('─'.repeat(70));
    lines.push('MICRO PASS VALIDATION REPORT');
    lines.push('─'.repeat(70));
    lines.push('');

    // Validation result
    lines.push('VALIDATION RESULT:');
    lines.push(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`  Score: ${(score * 100).toFixed(1)}%`);
    lines.push('');

    // Key metrics
    lines.push('KEY METRICS:');
    lines.push(`  Toulmin completeness: ${(result.metadata.averageToulminCompleteness * 100).toFixed(1)}% (required: ≥85%)`);
    lines.push(`  Warrant generality: ${(result.metadata.averageWarrantGenerality * 100).toFixed(1)}% (target: 60-80%)`);
    lines.push(`  Claims generated: ${result.metadata.claimsGenerated}`);
    lines.push(`  Citations: ${result.metadata.citationCount}`);
    lines.push('');

    // Issues
    if (issues.length > 0) {
      lines.push('VALIDATION ISSUES:');
      lines.push('');

      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🟡' : '🔵';
        lines.push(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}`);
        lines.push(`   ${issue.description}`);
        lines.push(`   Fix: ${issue.suggestedFix}`);
        lines.push('');
      }
    } else {
      lines.push('✅ No validation issues detected');
      lines.push('');
    }

    lines.push('─'.repeat(70));

    return lines.join('\n');
  }

  /**
   * Generate meso pass validation report
   */
  private generateMesoReport(
    result: MesoPassResult,
    issues: PassValidationIssue[],
    score: number,
    passed: boolean
  ): string {
    const lines: string[] = [];

    lines.push('─'.repeat(70));
    lines.push('MESO PASS VALIDATION REPORT');
    lines.push('─'.repeat(70));
    lines.push('');

    // Validation result
    lines.push('VALIDATION RESULT:');
    lines.push(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`  Score: ${(score * 100).toFixed(1)}%`);
    lines.push('');

    // Key metrics
    lines.push('KEY METRICS:');
    lines.push(`  Coherence: ${(result.metadata.coherenceScore * 100).toFixed(1)}% (required: ≥90%)`);
    lines.push(`  Duplication rate: ${(result.metadata.duplicationRate * 100).toFixed(1)}% (max: ≤10%)`);
    lines.push(`  Term consistency: ${(result.metadata.termConsistencyRate * 100).toFixed(1)}% (required: ≥95%)`);
    lines.push(`  Subsections integrated: ${result.metadata.subsectionsIntegrated}`);
    lines.push(`  Transitions added: ${result.metadata.transitionsAdded}`);
    lines.push('');

    // Issues
    if (issues.length > 0) {
      lines.push('VALIDATION ISSUES:');
      lines.push('');

      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🟡' : '🔵';
        lines.push(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}`);
        lines.push(`   ${issue.description}`);
        lines.push(`   Fix: ${issue.suggestedFix}`);
        lines.push('');
      }
    } else {
      lines.push('✅ No validation issues detected');
      lines.push('');
    }

    lines.push('─'.repeat(70));

    return lines.join('\n');
  }

  /**
   * Generate macro pass validation report
   */
  private generateMacroReport(
    result: MacroPassResult,
    issues: PassValidationIssue[],
    score: number,
    passed: boolean
  ): string {
    const lines: string[] = [];

    lines.push('─'.repeat(70));
    lines.push('MACRO PASS VALIDATION REPORT');
    lines.push('─'.repeat(70));
    lines.push('');

    // Validation result
    lines.push('VALIDATION RESULT:');
    lines.push(`  Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`  Score: ${(score * 100).toFixed(1)}%`);
    lines.push('');

    // Key metrics
    lines.push('KEY METRICS:');
    lines.push(`  Significance: ${(result.synthesis.soWhat.significanceScore * 100).toFixed(1)}% (required: ≥85%)`);
    lines.push(`  Stakes: ${(result.synthesis.stakes.stakesScore * 100).toFixed(1)}% (required: ≥85%)`);
    lines.push(`  Architectonics: ${(result.synthesis.architectonics.structuralCoherence * 100).toFixed(1)}% (required: ≥90%)`);
    lines.push(`  Body sections: ${result.bodySections.length}`);
    lines.push(`  Total claims: ${result.synthesizedClaimMap.claims.length}`);
    lines.push('');

    // Issues
    if (issues.length > 0) {
      lines.push('VALIDATION ISSUES:');
      lines.push('');

      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🟡' : '🔵';
        lines.push(`${icon} [${issue.severity.toUpperCase()}] ${issue.type}`);
        lines.push(`   ${issue.description}`);
        lines.push(`   Fix: ${issue.suggestedFix}`);
        lines.push('');
      }
    } else {
      lines.push('✅ No validation issues detected');
      lines.push('');
    }

    lines.push('─'.repeat(70));

    return lines.join('\n');
  }
}
