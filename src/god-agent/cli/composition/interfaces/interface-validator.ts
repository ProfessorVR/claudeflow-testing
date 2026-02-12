/**
 * Interface Validator - Validates interface contracts
 *
 * This module validates that segment interfaces meet their contracts.
 * It checks that all input assumptions are satisfied and that output
 * contributions are properly specified.
 *
 * @module interface-validator
 */

import type {
  SegmentInterface,
  InterfaceMismatch,
  MismatchAnalysis
} from './segment-interface.js';

/**
 * Validation result
 */
export interface InterfaceValidationResult {
  /** Whether validation passed */
  passed: boolean;

  /** Overall satisfaction score (0-1) */
  satisfactionScore: number;

  /** Mismatches detected */
  mismatches: InterfaceMismatch[];

  /** Validation metadata */
  metadata: ValidationMetadata;
}

/**
 * Validation metadata
 */
export interface ValidationMetadata {
  /** Segments validated */
  segmentsValidated: number;

  /** Total dependencies checked */
  totalDependenciesChecked: number;

  /** Satisfied dependencies */
  satisfiedDependencies: number;

  /** Unsatisfied dependencies */
  unsatisfiedDependencies: number;

  /** Critical mismatches */
  criticalMismatches: number;

  /** Major mismatches */
  majorMismatches: number;

  /** Minor mismatches */
  minorMismatches: number;

  /** Dependency satisfaction rate */
  dependencySatisfactionRate: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * InterfaceValidator - Validates segment interfaces
 */
export class InterfaceValidator {
  /**
   * Validate interfaces for all segments
   */
  async validate(segments: SegmentInterface[]): Promise<InterfaceValidationResult> {
    const startTime = Date.now();
    const mismatches: InterfaceMismatch[] = [];

    // Build output index (what each segment provides)
    const outputIndex = this.buildOutputIndex(segments);

    // Validate each segment's inputs
    for (const segment of segments) {
      // Check required claims
      for (const requiredClaim of segment.inputAssumptions.requiredClaims) {
        const mismatch = this.validateClaimDependency(
          segment,
          requiredClaim,
          outputIndex,
          segments
        );
        if (mismatch) {
          mismatches.push(mismatch);
        }
      }

      // Check required concepts
      for (const requiredConcept of segment.inputAssumptions.requiredConcepts) {
        const mismatch = this.validateConceptDependency(
          segment,
          requiredConcept,
          outputIndex,
          segments
        );
        if (mismatch) {
          mismatches.push(mismatch);
        }
      }

      // Check required threads
      for (const requiredThread of segment.inputAssumptions.requiredThreads) {
        const mismatch = this.validateThreadDependency(
          segment,
          requiredThread,
          outputIndex,
          segments
        );
        if (mismatch) {
          mismatches.push(mismatch);
        }
      }

      // Check for unused outputs
      const unusedOutputs = this.findUnusedOutputs(segment, segments);
      mismatches.push(...unusedOutputs);
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(
      mismatches,
      segments.length,
      Date.now() - startTime
    );

    // Calculate satisfaction score
    const satisfactionScore = this.calculateSatisfactionScore(mismatches, metadata);

    // Determine pass/fail (threshold: 0.90)
    const passed = satisfactionScore >= 0.90 && metadata.criticalMismatches === 0;

    return {
      passed,
      satisfactionScore,
      mismatches,
      metadata
    };
  }

  /**
   * Build index of what each segment provides
   */
  private buildOutputIndex(segments: SegmentInterface[]): OutputIndex {
    const index: OutputIndex = {
      claimProviders: new Map(),
      conceptProviders: new Map(),
      threadProviders: new Map()
    };

    for (const segment of segments) {
      // Index claims
      for (const claim of segment.outputContributions.claimsEstablished) {
        if (!index.claimProviders.has(claim.claim.id)) {
          index.claimProviders.set(claim.claim.id, []);
        }
        index.claimProviders.get(claim.claim.id)!.push({
          segmentId: segment.id,
          location: segment.location,
          strength: claim.establishmentStrength
        });
      }

      // Index concepts
      for (const concept of segment.outputContributions.conceptsIntroduced) {
        if (!index.conceptProviders.has(concept.concept.term)) {
          index.conceptProviders.set(concept.concept.term, []);
        }
        index.conceptProviders.get(concept.concept.term)!.push({
          segmentId: segment.id,
          location: segment.location,
          clarity: concept.definitionClarity
        });
      }

      // Index threads
      for (const thread of segment.outputContributions.threadsAdvanced) {
        if (!index.threadProviders.has(thread.id)) {
          index.threadProviders.set(thread.id, []);
        }
        index.threadProviders.get(thread.id)!.push({
          segmentId: segment.id,
          location: segment.location,
          state: thread.newState
        });
      }
    }

    return index;
  }

  /**
   * Validate claim dependency
   */
  private validateClaimDependency(
    segment: SegmentInterface,
    requiredClaim: any,
    outputIndex: OutputIndex,
    segments: SegmentInterface[]
  ): InterfaceMismatch | null {
    // Check if any segment provides this claim
    const providers = outputIndex.claimProviders.get(requiredClaim.id);

    if (!providers || providers.length === 0) {
      // No provider found
      return {
        id: `mismatch-${segment.id}-claim-${requiredClaim.id}`,
        type: 'missing-prerequisite',
        segmentId: segment.id,
        requiredItem: requiredClaim.statement,
        severity: requiredClaim.isHardDependency ? 'critical' : 'major',
        recommendation: `Add segment that establishes claim: "${requiredClaim.statement}"`,
        analysis: {
          issue: `Required claim not established`,
          impact: `Segment ${segment.id} cannot proceed without this claim`,
          possibleSolutions: [
            'Add new segment before this one to establish the claim',
            'Move claim establishment to earlier segment',
            'Remove dependency if not actually needed'
          ],
          fixDifficulty: 'moderate'
        }
      };
    }

    // Check if provider comes before consumer
    const provider = providers[0];
    if (!this.segmentComesBeforeF(provider.location, segment.location)) {
      // Forward reference detected
      return {
        id: `mismatch-${segment.id}-claim-${requiredClaim.id}-forward`,
        type: 'missing-prerequisite',
        segmentId: segment.id,
        requiredItem: requiredClaim.statement,
        providingSegmentId: provider.segmentId,
        severity: 'critical',
        recommendation: `Reorder segments: ${provider.segmentId} must come before ${segment.id}`,
        analysis: {
          issue: `Forward reference: segment depends on claim from later segment`,
          impact: `Logical flow is broken - readers encounter dependency before it's established`,
          possibleSolutions: [
            `Move ${provider.segmentId} before ${segment.id}`,
            'Split claim establishment to establish partial claim earlier'
          ],
          fixDifficulty: 'hard'
        }
      };
    }

    return null;
  }

  /**
   * Validate concept dependency
   */
  private validateConceptDependency(
    segment: SegmentInterface,
    requiredConcept: any,
    outputIndex: OutputIndex,
    segments: SegmentInterface[]
  ): InterfaceMismatch | null {
    // Check if any segment provides this concept
    const providers = outputIndex.conceptProviders.get(requiredConcept.term);

    if (!providers || providers.length === 0) {
      // No provider found
      return {
        id: `mismatch-${segment.id}-concept-${requiredConcept.term}`,
        type: 'missing-prerequisite',
        segmentId: segment.id,
        requiredItem: requiredConcept.term,
        severity: requiredConcept.isHardDependency ? 'critical' : 'major',
        recommendation: `Add segment that defines concept: "${requiredConcept.term}"`,
        analysis: {
          issue: `Required concept not defined`,
          impact: `Readers will encounter undefined term`,
          possibleSolutions: [
            `Add definition of "${requiredConcept.term}" before first use`,
            'Move definition to earlier segment',
            'Add footnote definition if minor concept'
          ],
          fixDifficulty: 'easy'
        }
      };
    }

    // Check if provider comes before consumer
    const provider = providers[0];
    if (!this.segmentComesBeforeF(provider.location, segment.location)) {
      // Forward reference detected
      return {
        id: `mismatch-${segment.id}-concept-${requiredConcept.term}-forward`,
        type: 'missing-prerequisite',
        segmentId: segment.id,
        requiredItem: requiredConcept.term,
        providingSegmentId: provider.segmentId,
        severity: 'critical',
        recommendation: `Reorder segments: ${provider.segmentId} must come before ${segment.id}`,
        analysis: {
          issue: `Forward reference: segment uses concept defined later`,
          impact: `Readers encounter undefined term`,
          possibleSolutions: [
            `Move ${provider.segmentId} before ${segment.id}`,
            'Add early definition with full definition later'
          ],
          fixDifficulty: 'moderate'
        }
      };
    }

    return null;
  }

  /**
   * Validate thread dependency
   */
  private validateThreadDependency(
    segment: SegmentInterface,
    requiredThread: any,
    outputIndex: OutputIndex,
    segments: SegmentInterface[]
  ): InterfaceMismatch | null {
    // Check if any segment provides this thread
    const providers = outputIndex.threadProviders.get(requiredThread.id);

    if (!providers || providers.length === 0) {
      // No provider found
      return {
        id: `mismatch-${segment.id}-thread-${requiredThread.id}`,
        type: 'broken-thread',
        segmentId: segment.id,
        requiredItem: requiredThread.name,
        severity: 'major',
        recommendation: `Establish thread "${requiredThread.name}" before this segment`,
        analysis: {
          issue: `Required thread not established`,
          impact: `Narrative thread is broken`,
          possibleSolutions: [
            'Add segment to establish thread',
            'Remove thread dependency if not needed'
          ],
          fixDifficulty: 'moderate'
        }
      };
    }

    return null;
  }

  /**
   * Find unused outputs
   */
  private findUnusedOutputs(
    segment: SegmentInterface,
    segments: SegmentInterface[]
  ): InterfaceMismatch[] {
    const mismatches: InterfaceMismatch[] = [];

    // Check if any claims are used
    for (const claim of segment.outputContributions.claimsEstablished) {
      const isUsed = segments.some(s =>
        s.id !== segment.id &&
        s.inputAssumptions.requiredClaims.some(c => c.id === claim.claim.id)
      );

      if (!isUsed) {
        mismatches.push({
          id: `unused-${segment.id}-claim-${claim.claim.id}`,
          type: 'unused-output',
          segmentId: segment.id,
          requiredItem: claim.claim.claim,
          severity: 'minor',
          recommendation: `Either use this claim in a later segment or remove it`,
          analysis: {
            issue: `Claim established but never used`,
            impact: `Unnecessary content that doesn't advance argument`,
            possibleSolutions: [
              'Add segment that uses this claim',
              'Remove claim if not needed'
            ],
            fixDifficulty: 'easy'
          }
        });
      }
    }

    return mismatches;
  }

  /**
   * Check if segment A comes before segment B
   */
  private segmentComesBeforeF(locationA: any, locationB: any): boolean {
    // Compare section IDs
    const sectionA = this.parseSectionId(locationA.sectionId);
    const sectionB = this.parseSectionId(locationB.sectionId);

    for (let i = 0; i < Math.max(sectionA.length, sectionB.length); i++) {
      const a = sectionA[i] || 0;
      const b = sectionB[i] || 0;
      if (a < b) return true;
      if (a > b) return false;
    }

    // Same section, compare paragraph ranges
    return locationA.paragraphRange.end <= locationB.paragraphRange.start;
  }

  /**
   * Parse section ID into array of numbers
   */
  private parseSectionId(sectionId: string): number[] {
    return sectionId.split('.').map(s => parseInt(s, 10));
  }

  /**
   * Calculate validation metadata
   */
  private calculateMetadata(
    mismatches: InterfaceMismatch[],
    segmentCount: number,
    processingTime: number
  ): ValidationMetadata {
    const criticalMismatches = mismatches.filter(m => m.severity === 'critical').length;
    const majorMismatches = mismatches.filter(m => m.severity === 'major').length;
    const minorMismatches = mismatches.filter(m => m.severity === 'minor').length;

    const totalDependenciesChecked = segmentCount * 10; // Estimate
    const unsatisfiedDependencies = mismatches.filter(m =>
      m.type === 'missing-prerequisite' || m.type === 'broken-thread'
    ).length;
    const satisfiedDependencies = totalDependenciesChecked - unsatisfiedDependencies;

    const dependencySatisfactionRate = totalDependenciesChecked > 0
      ? satisfiedDependencies / totalDependenciesChecked
      : 1.0;

    return {
      segmentsValidated: segmentCount,
      totalDependenciesChecked,
      satisfiedDependencies,
      unsatisfiedDependencies,
      criticalMismatches,
      majorMismatches,
      minorMismatches,
      dependencySatisfactionRate,
      processingTime
    };
  }

  /**
   * Calculate satisfaction score
   */
  private calculateSatisfactionScore(
    mismatches: InterfaceMismatch[],
    metadata: ValidationMetadata
  ): number {
    const penalty = (
      metadata.criticalMismatches * 0.30 +
      metadata.majorMismatches * 0.15 +
      metadata.minorMismatches * 0.05
    );

    return Math.max(0, 1.0 - penalty);
  }

  /**
   * Get detailed report
   */
  getDetailedReport(result: InterfaceValidationResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('INTERFACE VALIDATION REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    // Summary
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Satisfaction Score: ${(result.satisfactionScore * 100).toFixed(1)}% (threshold: 90%)`);
    lines.push('');

    // Metadata
    lines.push('VALIDATION METADATA:');
    lines.push(`  Segments validated: ${result.metadata.segmentsValidated}`);
    lines.push(`  Total dependencies checked: ${result.metadata.totalDependenciesChecked}`);
    lines.push(`  Satisfied dependencies: ${result.metadata.satisfiedDependencies}`);
    lines.push(`  Unsatisfied dependencies: ${result.metadata.unsatisfiedDependencies}`);
    lines.push(`  Dependency satisfaction rate: ${(result.metadata.dependencySatisfactionRate * 100).toFixed(1)}%`);
    lines.push(`  Critical mismatches: ${result.metadata.criticalMismatches}`);
    lines.push(`  Major mismatches: ${result.metadata.majorMismatches}`);
    lines.push(`  Minor mismatches: ${result.metadata.minorMismatches}`);
    lines.push(`  Processing time: ${result.metadata.processingTime}ms`);
    lines.push('');

    // Mismatches
    if (result.mismatches.length > 0) {
      lines.push('MISMATCHES DETECTED:');
      lines.push('');

      for (const mismatch of result.mismatches) {
        const icon = mismatch.severity === 'critical' ? '🔴' :
                     mismatch.severity === 'major' ? '🟠' : '🟡';
        lines.push(`${icon} [${mismatch.severity.toUpperCase()}] ${mismatch.type}: ${mismatch.segmentId}`);
        lines.push(`   Required: ${mismatch.requiredItem}`);
        if (mismatch.providingSegmentId) {
          lines.push(`   Provider: ${mismatch.providingSegmentId}`);
        }
        lines.push(`   Recommendation: ${mismatch.recommendation}`);
        lines.push(`   Analysis: ${mismatch.analysis.issue}`);
        lines.push(`   Impact: ${mismatch.analysis.impact}`);
        lines.push('');
      }
    } else {
      lines.push('✅ All interfaces valid!');
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}

/**
 * Output index
 */
interface OutputIndex {
  claimProviders: Map<string, ProviderInfo[]>;
  conceptProviders: Map<string, ProviderInfo[]>;
  threadProviders: Map<string, ThreadProviderInfo[]>;
}

interface ProviderInfo {
  segmentId: string;
  location: any;
  strength?: number;
  clarity?: number;
}

interface ThreadProviderInfo {
  segmentId: string;
  location: any;
  state: string;
}
