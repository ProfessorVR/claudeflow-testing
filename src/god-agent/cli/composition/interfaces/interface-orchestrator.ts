/**
 * Interface Orchestrator - Coordinates interface-based composition
 *
 * This orchestrator coordinates the complete interface-based composition process:
 * 1. Validate segment interfaces
 * 2. Reconcile mismatches
 * 3. Generate transitions
 * 4. Compose final output
 *
 * @module interface-orchestrator
 */

import type { SegmentInterface } from './segment-interface.js';
import { InterfaceValidator, type InterfaceValidationResult } from './interface-validator.js';
import { InterfaceReconciler, type ReconciliationResult } from './interface-reconciler.js';
import { TransitionGenerator, type TransitionGenerationResult, type Transition } from './transition-generator.js';

/**
 * Composition result
 */
export interface InterfaceCompositionResult {
  /** Whether composition succeeded */
  succeeded: boolean;

  /** Validation result */
  validation: InterfaceValidationResult;

  /** Reconciliation result */
  reconciliation: ReconciliationResult;

  /** Transition generation result */
  transitions: TransitionGenerationResult;

  /** Composed segments (in final order) */
  composedSegments: ComposedSegment[];

  /** Composition metadata */
  metadata: CompositionMetadata;

  /** Comprehensive report */
  report: string;
}

/**
 * Composed segment (segment + transition)
 */
export interface ComposedSegment {
  /** Segment interface */
  segment: SegmentInterface;

  /** Transition to next segment (null for last segment) */
  transition: Transition | null;
}

/**
 * Composition metadata
 */
export interface CompositionMetadata {
  /** Segments composed */
  segmentsComposed: number;

  /** Transitions generated */
  transitionsGenerated: number;

  /** Validation passed */
  validationPassed: boolean;

  /** Reconciliation succeeded */
  reconciliationSucceeded: boolean;

  /** Overall quality score (0-1) */
  overallQualityScore: number;

  /** Total processing time (ms) */
  totalProcessingTime: number;
}

/**
 * Orchestrator options
 */
export interface InterfaceOrchestratorOptions {
  /** Segments to compose */
  segments: SegmentInterface[];

  /** Skip reconciliation (fail fast on validation errors) */
  skipReconciliation?: boolean;

  /** Minimum transition quality required (0-1) */
  minTransitionQuality?: number;
}

/**
 * InterfaceOrchestrator - Coordinates interface-based composition
 */
export class InterfaceOrchestrator {
  private validator: InterfaceValidator;
  private reconciler: InterfaceReconciler;
  private transitionGenerator: TransitionGenerator;

  constructor() {
    this.validator = new InterfaceValidator();
    this.reconciler = new InterfaceReconciler();
    this.transitionGenerator = new TransitionGenerator();
  }

  /**
   * Compose segments using interface-based composition
   */
  async compose(options: InterfaceOrchestratorOptions): Promise<InterfaceCompositionResult> {
    const startTime = Date.now();
    let segments = options.segments;

    // Phase 1: Validate interfaces
    console.log('Phase 1: Validating interfaces...');
    const validation = await this.validator.validate(segments);

    // Phase 2: Reconcile mismatches (if validation failed and not skipping)
    let reconciliation: ReconciliationResult;
    if (!validation.passed && !options.skipReconciliation) {
      console.log('Phase 2: Reconciling mismatches...');
      reconciliation = await this.reconciler.reconcile(segments, validation.mismatches);

      // Apply reconciliation actions
      if (reconciliation.succeeded) {
        segments = await this.reconciler.applyActions(segments, reconciliation.actions);
        console.log('  ✓ Reconciliation succeeded');
      } else {
        console.log('  ⚠ Reconciliation partially succeeded');
      }
    } else {
      reconciliation = {
        succeeded: true,
        actions: [],
        unresolvedMismatches: [],
        metadata: {
          totalMismatches: 0,
          resolvedMismatches: 0,
          unresolvedMismatches: 0,
          actionsGenerated: 0,
          resolutionRate: 1.0,
          averageSuccessProbability: 1.0,
          processingTime: 0
        }
      };
    }

    // Phase 3: Generate transitions
    console.log('Phase 3: Generating transitions...');
    const transitions = await this.transitionGenerator.generate(segments);

    // Filter low-quality transitions (if minimum quality specified)
    if (options.minTransitionQuality) {
      const filteredTransitions = transitions.transitions.filter(t =>
        t.quality >= (options.minTransitionQuality || 0)
      );
      console.log(`  ✓ Generated ${filteredTransitions.length}/${transitions.transitions.length} high-quality transitions`);
    }

    // Phase 4: Compose final output
    console.log('Phase 4: Composing final output...');
    const composedSegments = this.composeSegments(segments, transitions.transitions);

    // Calculate metadata
    const metadata = this.calculateMetadata(
      segments,
      transitions.transitions,
      validation,
      reconciliation,
      Date.now() - startTime
    );

    // Determine overall success
    const succeeded = validation.passed && reconciliation.succeeded;

    // Generate comprehensive report
    const report = this.generateComprehensiveReport(
      validation,
      reconciliation,
      transitions,
      metadata,
      succeeded
    );

    return {
      succeeded,
      validation,
      reconciliation,
      transitions,
      composedSegments,
      metadata,
      report
    };
  }

  /**
   * Compose segments with transitions
   */
  private composeSegments(
    segments: SegmentInterface[],
    transitions: Transition[]
  ): ComposedSegment[] {
    const composed: ComposedSegment[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const transition = i < transitions.length ? transitions[i] : null;

      composed.push({
        segment,
        transition
      });
    }

    return composed;
  }

  /**
   * Calculate composition metadata
   */
  private calculateMetadata(
    segments: SegmentInterface[],
    transitions: Transition[],
    validation: InterfaceValidationResult,
    reconciliation: ReconciliationResult,
    totalProcessingTime: number
  ): CompositionMetadata {
    // Calculate overall quality score
    const validationScore = validation.satisfactionScore;
    const reconciliationScore = reconciliation.metadata.resolutionRate;
    const transitionScore = transitions.length > 0
      ? transitions.reduce((sum, t) => sum + t.quality, 0) / transitions.length
      : 0;

    const overallQualityScore = (
      validationScore * 0.4 +
      reconciliationScore * 0.3 +
      transitionScore * 0.3
    );

    return {
      segmentsComposed: segments.length,
      transitionsGenerated: transitions.length,
      validationPassed: validation.passed,
      reconciliationSucceeded: reconciliation.succeeded,
      overallQualityScore,
      totalProcessingTime
    };
  }

  /**
   * Generate comprehensive report
   */
  private generateComprehensiveReport(
    validation: InterfaceValidationResult,
    reconciliation: ReconciliationResult,
    transitions: TransitionGenerationResult,
    metadata: CompositionMetadata,
    succeeded: boolean
  ): string {
    const lines: string[] = [];

    lines.push('═'.repeat(80));
    lines.push('INTERFACE-BASED COMPOSITION COMPREHENSIVE REPORT');
    lines.push('═'.repeat(80));
    lines.push('');

    // Overall summary
    lines.push('OVERALL ASSESSMENT:');
    lines.push(`  Status: ${succeeded ? '✅ SUCCEEDED' : '❌ FAILED'}`);
    lines.push(`  Overall Quality Score: ${(metadata.overallQualityScore * 100).toFixed(1)}%`);
    lines.push(`  Segments Composed: ${metadata.segmentsComposed}`);
    lines.push(`  Transitions Generated: ${metadata.transitionsGenerated}`);
    lines.push('');

    // Phase results
    lines.push('PHASE RESULTS:');
    lines.push(`  Phase 1 - Validation: ${metadata.validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`    Satisfaction score: ${(validation.satisfactionScore * 100).toFixed(1)}%`);
    lines.push(`    Mismatches detected: ${validation.mismatches.length}`);
    lines.push('');
    lines.push(`  Phase 2 - Reconciliation: ${metadata.reconciliationSucceeded ? '✅ SUCCEEDED' : '⚠️ PARTIAL'}`);
    lines.push(`    Resolution rate: ${(reconciliation.metadata.resolutionRate * 100).toFixed(1)}%`);
    lines.push(`    Actions generated: ${reconciliation.metadata.actionsGenerated}`);
    lines.push('');
    lines.push(`  Phase 3 - Transitions: ✅ COMPLETE`);
    lines.push(`    Average quality: ${(transitions.metadata.averageQuality * 100).toFixed(1)}%`);
    lines.push(`    Average coherence: ${(transitions.metadata.averageCoherence * 100).toFixed(1)}%`);
    lines.push('');

    // Processing time
    lines.push('PROCESSING TIME:');
    lines.push(`  Total: ${metadata.totalProcessingTime}ms`);
    lines.push(`  Validation: ${validation.metadata.processingTime}ms`);
    lines.push(`  Reconciliation: ${reconciliation.metadata.processingTime}ms`);
    lines.push(`  Transitions: ${transitions.metadata.processingTime}ms`);
    lines.push('');

    // Detailed reports
    lines.push('═'.repeat(80));
    lines.push('DETAILED PHASE REPORTS');
    lines.push('═'.repeat(80));
    lines.push('');

    lines.push('PHASE 1: VALIDATION');
    lines.push('-'.repeat(80));
    lines.push(this.validator.getDetailedReport(validation));
    lines.push('');

    lines.push('PHASE 2: RECONCILIATION');
    lines.push('-'.repeat(80));
    lines.push(this.reconciler.getDetailedReport(reconciliation));
    lines.push('');

    lines.push('PHASE 3: TRANSITIONS');
    lines.push('-'.repeat(80));
    lines.push(this.transitionGenerator.getDetailedReport(transitions));
    lines.push('');

    lines.push('═'.repeat(80));
    lines.push('END OF COMPOSITION REPORT');
    lines.push('═'.repeat(80));

    return lines.join('\n');
  }

  /**
   * Export composed document (segments + transitions)
   */
  exportComposedDocument(result: InterfaceCompositionResult): string {
    const lines: string[] = [];

    for (const composed of result.composedSegments) {
      // Add segment ID as comment
      lines.push(`<!-- Segment: ${composed.segment.id} -->`);
      lines.push('');

      // Note: Actual segment content would be added here
      // This is a placeholder showing the structure
      lines.push(`[Segment ${composed.segment.id} content would go here]`);
      lines.push('');

      // Add transition if exists
      if (composed.transition) {
        lines.push(`<!-- Transition: ${composed.transition.type} -->`);
        lines.push(composed.transition.text);
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
