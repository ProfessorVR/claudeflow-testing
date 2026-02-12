/**
 * Counter-Argument Tester - Generates objections and tests rebuttals
 *
 * This is a READ-ONLY reviewer that generates strongest possible objections
 * to claims and tests whether rebuttals adequately address them.
 *
 * @module counter-argument-tester
 */

import type { ClaimMap, ToulminClaim } from '../sir/claim-map.js';

/**
 * Counter-argument test result
 */
export interface CounterArgumentTestResult {
  /** Whether test passed */
  passed: boolean;

  /** Overall counter-argument handling score (0-1) */
  score: number;

  /** Issues detected */
  issues: CounterArgumentIssue[];

  /** Test metadata */
  metadata: CounterArgumentTestMetadata;
}

/**
 * Counter-argument issue detected
 */
export interface CounterArgumentIssue {
  /** Issue type */
  type: 'missing-rebuttal' | 'weak-rebuttal' | 'unaddressed-objection';

  /** Claim ID with issue */
  claimId: string;

  /** Claim statement */
  claim: string;

  /** Generated objection */
  generatedObjection: string;

  /** Existing rebuttal (if any) */
  existingRebuttal?: string;

  /** Severity */
  severity: 'critical' | 'major' | 'minor';

  /** Recommendation for fix */
  recommendation: string;

  /** Detailed analysis */
  analysis: ObjectionAnalysis;
}

/**
 * Detailed objection analysis
 */
export interface ObjectionAnalysis {
  /** Objection type */
  objectionType: 'empirical' | 'logical' | 'methodological' | 'conceptual';

  /** Claim controversy level (0-1) */
  controversyLevel: number;

  /** Rebuttal adequacy (0-1) */
  rebuttalAdequacy: number;

  /** Objection strength (0-1) */
  objectionStrength: number;

  /** Specific weaknesses */
  specificWeaknesses: string[];
}

/**
 * Test metadata
 */
export interface CounterArgumentTestMetadata {
  /** Claims tested */
  claimsTested: number;

  /** Controversial claims */
  controversialClaims: number;

  /** Missing rebuttals */
  missingRebuttals: number;

  /** Weak rebuttals */
  weakRebuttals: number;

  /** Unaddressed objections */
  unaddressedObjections: number;

  /** Critical issues */
  criticalIssues: number;

  /** Major issues */
  majorIssues: number;

  /** Minor issues */
  minorIssues: number;

  /** Average rebuttal adequacy */
  averageRebuttalAdequacy: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * CounterArgumentTester - READ-ONLY reviewer for objection generation
 */
export class CounterArgumentTester {
  /**
   * Test counter-argument handling in claim map
   *
   * This is a READ-ONLY operation - it does not modify content,
   * only generates objections and tests rebuttals.
   */
  async test(claimMap: ClaimMap): Promise<CounterArgumentTestResult> {
    const startTime = Date.now();
    const issues: CounterArgumentIssue[] = [];

    for (const claim of claimMap.claims) {
      // Check if claim is controversial
      const controversyLevel = this.assessControversyLevel(claim);

      // Generate strongest objection
      const objection = this.generateStrongestObjection(claim);

      // Test rebuttal
      const rebuttalIssue = this.testRebuttal(claim, objection, controversyLevel);
      if (rebuttalIssue) {
        issues.push(rebuttalIssue);
      }
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(issues, claimMap.claims.length, Date.now() - startTime);

    // Calculate score
    const score = this.calculateCounterArgumentScore(issues, metadata);

    // Determine pass/fail (threshold: 0.75)
    const passed = score >= 0.75 && metadata.criticalIssues === 0;

    return {
      passed,
      score,
      issues,
      metadata
    };
  }

  /**
   * Assess controversy level of claim
   */
  private assessControversyLevel(claim: ToulminClaim): number {
    let controversyScore = 0;

    // Factor 1: Claim strength (stronger claims more controversial)
    const claimLower = claim.claim.toLowerCase();
    if (/\b(all|always|never|every|none|must|cannot)\b/.test(claimLower)) {
      controversyScore += 0.3; // Universal claims
    } else if (/\b(proves?|demonstrates?|establishes?)\b/.test(claimLower)) {
      controversyScore += 0.2; // Strong claims
    }

    // Factor 2: Causal/normative claims more controversial
    if (/\b(causes?|leads? to|results? in|should|ought|must)\b/.test(claimLower)) {
      controversyScore += 0.2;
    }

    // Factor 3: Evidence strength (weak evidence → more controversial)
    const evidenceCount = claim.grounds.length;
    if (evidenceCount < 2) {
      controversyScore += 0.2;
    } else if (evidenceCount < 3) {
      controversyScore += 0.1;
    }

    // Factor 4: Lack of qualification (unqualified claims more controversial)
    if (!claim.qualification && controversyScore > 0.3) {
      controversyScore += 0.2;
    }

    return Math.min(1.0, controversyScore);
  }

  /**
   * Generate strongest possible objection to claim
   */
  private generateStrongestObjection(claim: ToulminClaim): string {
    const objectionType = this.identifyObjectionType(claim);

    switch (objectionType) {
      case 'empirical':
        return this.generateEmpiricalObjection(claim);
      case 'logical':
        return this.generateLogicalObjection(claim);
      case 'methodological':
        return this.generateMethodologicalObjection(claim);
      case 'conceptual':
        return this.generateConceptualObjection(claim);
      default:
        return this.generateGenericObjection(claim);
    }
  }

  /**
   * Identify most effective objection type
   */
  private identifyObjectionType(claim: ToulminClaim): 'empirical' | 'logical' | 'methodological' | 'conceptual' {
    const claimLower = claim.claim.toLowerCase();

    // Empirical objections for factual claims
    if (/\b(data|evidence|study|research|shows?|demonstrates?)\b/.test(claimLower)) {
      return 'empirical';
    }

    // Logical objections for reasoning claims
    if (/\b(therefore|thus|hence|implies?|follows?)\b/.test(claimLower)) {
      return 'logical';
    }

    // Methodological objections for process claims
    if (/\b(method|approach|procedure|analysis|measured?)\b/.test(claimLower)) {
      return 'methodological';
    }

    // Conceptual objections for definitional claims
    if (/\b(is|are|defined|means?|refers? to|concept)\b/.test(claimLower)) {
      return 'conceptual';
    }

    return 'logical';
  }

  /**
   * Generate empirical objection
   */
  private generateEmpiricalObjection(claim: ToulminClaim): string {
    const objections: string[] = [];

    // Check sample size
    if (this.hasLimitedSample(claim)) {
      objections.push('The evidence is based on a limited sample that may not generalize to the broader population.');
    }

    // Check alternative explanations
    objections.push('Alternative explanations for the observed pattern have not been ruled out.');

    // Check confounding variables
    if (this.hasCausalLanguage(claim.claim)) {
      objections.push('The causal relationship may be confounded by unmeasured variables.');
    }

    // Check replication
    if (claim.grounds.length < 3) {
      objections.push('The findings have not been independently replicated across multiple studies.');
    }

    return objections[0] || 'The empirical evidence is insufficient to support this claim.';
  }

  /**
   * Generate logical objection
   */
  private generateLogicalObjection(claim: ToulminClaim): string {
    const objections: string[] = [];

    // Check for logical leaps
    if (claim.warrantGenerality < 0.6) {
      objections.push('The logical connection between evidence and claim requires additional intermediate steps.');
    }

    // Check for affirming the consequent
    if (/\b(if|when).*then\b/.test(claim.claim.toLowerCase())) {
      objections.push('The argument may commit the fallacy of affirming the consequent.');
    }

    // Check for false dichotomy
    if (/\b(either|only|must be)\b/.test(claim.claim.toLowerCase())) {
      objections.push('The claim presents a false dichotomy, ignoring other plausible alternatives.');
    }

    return objections[0] || 'The logical inference from evidence to claim is not valid.';
  }

  /**
   * Generate methodological objection
   */
  private generateMethodologicalObjection(claim: ToulminClaim): string {
    return 'The methodological approach used to generate this evidence may introduce systematic bias.';
  }

  /**
   * Generate conceptual objection
   */
  private generateConceptualObjection(claim: ToulminClaim): string {
    return 'The key concepts in this claim are not clearly defined, leading to ambiguity in interpretation.';
  }

  /**
   * Generate generic objection
   */
  private generateGenericObjection(claim: ToulminClaim): string {
    return 'This claim requires stronger justification given the strength of the assertion.';
  }

  /**
   * Test if rebuttal adequately addresses objection
   */
  private testRebuttal(
    claim: ToulminClaim,
    objection: string,
    controversyLevel: number
  ): CounterArgumentIssue | null {
    // If claim is not controversial, rebuttal not required
    if (controversyLevel < 0.3) {
      return null;
    }

    // Check if rebuttal exists
    if (!claim.rebuttal) {
      return {
        type: 'missing-rebuttal',
        claimId: claim.id,
        claim: claim.claim,
        generatedObjection: objection,
        severity: controversyLevel >= 0.7 ? 'critical' : controversyLevel >= 0.5 ? 'major' : 'minor',
        recommendation: `Add rebuttal addressing: "${objection}"`,
        analysis: {
          objectionType: this.identifyObjectionType(claim),
          controversyLevel,
          rebuttalAdequacy: 0,
          objectionStrength: this.assessObjectionStrength(objection, claim),
          specificWeaknesses: ['No rebuttal provided']
        }
      };
    }

    // Assess rebuttal adequacy
    const rebuttalAdequacy = this.assessRebuttalAdequacy(claim.rebuttal, objection, claim);

    // If rebuttal is weak
    if (rebuttalAdequacy < 0.6) {
      const weaknesses = this.identifyRebuttalWeaknesses(claim.rebuttal, objection);

      return {
        type: 'weak-rebuttal',
        claimId: claim.id,
        claim: claim.claim,
        generatedObjection: objection,
        existingRebuttal: claim.rebuttal,
        severity: rebuttalAdequacy < 0.3 ? 'critical' : rebuttalAdequacy < 0.5 ? 'major' : 'minor',
        recommendation: `Strengthen rebuttal by addressing: ${weaknesses.join(', ')}`,
        analysis: {
          objectionType: this.identifyObjectionType(claim),
          controversyLevel,
          rebuttalAdequacy,
          objectionStrength: this.assessObjectionStrength(objection, claim),
          specificWeaknesses: weaknesses
        }
      };
    }

    // If objection not addressed
    if (!this.objectionsOverlap(claim.rebuttal, objection)) {
      return {
        type: 'unaddressed-objection',
        claimId: claim.id,
        claim: claim.claim,
        generatedObjection: objection,
        existingRebuttal: claim.rebuttal,
        severity: 'major',
        recommendation: `Revise rebuttal to specifically address: "${objection}"`,
        analysis: {
          objectionType: this.identifyObjectionType(claim),
          controversyLevel,
          rebuttalAdequacy,
          objectionStrength: this.assessObjectionStrength(objection, claim),
          specificWeaknesses: ['Rebuttal does not address generated objection']
        }
      };
    }

    return null;
  }

  /**
   * Assess rebuttal adequacy
   */
  private assessRebuttalAdequacy(rebuttal: string, objection: string, claim: ToulminClaim): number {
    let adequacy = 0;

    // Factor 1: Length (longer rebuttals more thorough)
    if (rebuttal.length >= 100) adequacy += 0.2;
    else if (rebuttal.length >= 50) adequacy += 0.1;

    // Factor 2: Specificity (addresses specific objection)
    if (this.objectionsOverlap(rebuttal, objection)) {
      adequacy += 0.3;
    }

    // Factor 3: Evidence (provides counter-evidence)
    if (/\b(however|evidence|data|study|research)\b/i.test(rebuttal)) {
      adequacy += 0.2;
    }

    // Factor 4: Acknowledgment (acknowledges limitation)
    if (/\b(acknowledge|although|while|despite)\b/i.test(rebuttal)) {
      adequacy += 0.15;
    }

    // Factor 5: Alternative explanation
    if (/\b(alternatively|instead|rather)\b/i.test(rebuttal)) {
      adequacy += 0.15;
    }

    return Math.min(1.0, adequacy);
  }

  /**
   * Assess objection strength
   */
  private assessObjectionStrength(objection: string, claim: ToulminClaim): number {
    let strength = 0.5; // Base strength

    // Stronger if claim has weak evidence
    if (claim.grounds.length < 2) {
      strength += 0.2;
    }

    // Stronger if claim lacks qualification
    if (!claim.qualification) {
      strength += 0.15;
    }

    // Stronger if objection is specific
    if (objection.length > 100) {
      strength += 0.15;
    }

    return Math.min(1.0, strength);
  }

  /**
   * Identify rebuttal weaknesses
   */
  private identifyRebuttalWeaknesses(rebuttal: string, objection: string): string[] {
    const weaknesses: string[] = [];

    if (rebuttal.length < 50) {
      weaknesses.push('Rebuttal too brief');
    }

    if (!this.objectionsOverlap(rebuttal, objection)) {
      weaknesses.push('Does not address specific objection');
    }

    if (!/\b(evidence|data|study|research)\b/i.test(rebuttal)) {
      weaknesses.push('Lacks supporting evidence');
    }

    if (!/\b(acknowledge|although|while)\b/i.test(rebuttal)) {
      weaknesses.push('Does not acknowledge limitation');
    }

    return weaknesses.length > 0 ? weaknesses : ['General weakness'];
  }

  /**
   * Check if rebuttal and objection overlap
   */
  private objectionsOverlap(rebuttal: string, objection: string): boolean {
    const rebuttalWords = new Set(
      rebuttal.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    );
    const objectionWords = objection.toLowerCase().split(/\s+/).filter(w => w.length > 4);

    const overlap = objectionWords.filter(w => rebuttalWords.has(w)).length;
    return overlap >= objectionWords.length * 0.3;
  }

  /**
   * Check if claim has limited sample
   */
  private hasLimitedSample(claim: ToulminClaim): boolean {
    const text = claim.grounds.join(' ');
    return /\b(case study|single|one|pilot)\b/i.test(text);
  }

  /**
   * Check if claim uses causal language
   */
  private hasCausalLanguage(text: string): boolean {
    return /\b(causes?|leads? to|results? in|due to|because of)\b/i.test(text);
  }

  /**
   * Calculate test metadata
   */
  private calculateMetadata(
    issues: CounterArgumentIssue[],
    totalClaims: number,
    processingTime: number
  ): CounterArgumentTestMetadata {
    const controversialClaims = new Set(issues.map(i => i.claimId)).size;
    const missingRebuttals = issues.filter(i => i.type === 'missing-rebuttal').length;
    const weakRebuttals = issues.filter(i => i.type === 'weak-rebuttal').length;
    const unaddressedObjections = issues.filter(i => i.type === 'unaddressed-objection').length;

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    const averageRebuttalAdequacy = issues.length > 0
      ? issues.reduce((sum, i) => sum + i.analysis.rebuttalAdequacy, 0) / issues.length
      : 1.0;

    return {
      claimsTested: totalClaims,
      controversialClaims,
      missingRebuttals,
      weakRebuttals,
      unaddressedObjections,
      criticalIssues,
      majorIssues,
      minorIssues,
      averageRebuttalAdequacy,
      processingTime
    };
  }

  /**
   * Calculate counter-argument score
   *
   * Formula: 1.0 - penalties
   * Critical issues: -0.20 each
   * Major issues: -0.10 each
   * Minor issues: -0.05 each
   */
  private calculateCounterArgumentScore(
    issues: CounterArgumentIssue[],
    metadata: CounterArgumentTestMetadata
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
  getDetailedReport(result: CounterArgumentTestResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('COUNTER-ARGUMENT TESTING REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    // Summary
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Score: ${(result.score * 100).toFixed(1)}% (threshold: 75%)`);
    lines.push('');

    // Metadata
    lines.push('TEST METADATA:');
    lines.push(`  Claims tested: ${result.metadata.claimsTested}`);
    lines.push(`  Controversial claims: ${result.metadata.controversialClaims}`);
    lines.push(`  Missing rebuttals: ${result.metadata.missingRebuttals}`);
    lines.push(`  Weak rebuttals: ${result.metadata.weakRebuttals}`);
    lines.push(`  Unaddressed objections: ${result.metadata.unaddressedObjections}`);
    lines.push(`  Critical issues: ${result.metadata.criticalIssues}`);
    lines.push(`  Major issues: ${result.metadata.majorIssues}`);
    lines.push(`  Minor issues: ${result.metadata.minorIssues}`);
    lines.push(`  Average rebuttal adequacy: ${(result.metadata.averageRebuttalAdequacy * 100).toFixed(1)}%`);
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
        lines.push(`   Generated Objection: ${issue.generatedObjection}`);
        if (issue.existingRebuttal) {
          lines.push(`   Existing Rebuttal: ${issue.existingRebuttal}`);
        }
        lines.push(`   Recommendation: ${issue.recommendation}`);
        lines.push(`   Analysis:`);
        lines.push(`     Objection type: ${issue.analysis.objectionType}`);
        lines.push(`     Controversy level: ${(issue.analysis.controversyLevel * 100).toFixed(0)}%`);
        lines.push(`     Rebuttal adequacy: ${(issue.analysis.rebuttalAdequacy * 100).toFixed(0)}%`);
        lines.push(`     Objection strength: ${(issue.analysis.objectionStrength * 100).toFixed(0)}%`);
        if (issue.analysis.specificWeaknesses.length > 0) {
          lines.push(`     Specific weaknesses:`);
          issue.analysis.specificWeaknesses.forEach(w => {
            lines.push(`       - ${w}`);
          });
        }
        lines.push('');
      }
    } else {
      lines.push('✅ All controversial claims have adequate rebuttals!');
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}
