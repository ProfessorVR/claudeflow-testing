/**
 * Interface Reconciler - Resolves interface mismatches
 *
 * This module resolves mismatches between segment interfaces by
 * suggesting concrete fixes (reordering, adding segments, modifying interfaces).
 *
 * @module interface-reconciler
 */

import type {
  SegmentInterface,
  InterfaceMismatch
} from './segment-interface.js';

/**
 * Reconciliation result
 */
export interface ReconciliationResult {
  /** Whether reconciliation succeeded */
  succeeded: boolean;

  /** Reconciliation actions taken */
  actions: ReconciliationAction[];

  /** Remaining unresolved mismatches */
  unresolvedMismatches: InterfaceMismatch[];

  /** Reconciliation metadata */
  metadata: ReconciliationMetadata;
}

/**
 * Reconciliation action
 */
export interface ReconciliationAction {
  /** Action ID */
  id: string;

  /** Action type */
  type: 'reorder-segments' | 'add-segment' | 'modify-interface' | 'split-segment' | 'merge-segments';

  /** Mismatch being addressed */
  mismatchId: string;

  /** Action description */
  description: string;

  /** Specific changes */
  changes: ActionChange[];

  /** Success probability (0-1) */
  successProbability: number;

  /** Implementation difficulty */
  difficulty: 'easy' | 'moderate' | 'hard';
}

/**
 * Action change
 */
export interface ActionChange {
  /** Change type */
  type: 'move' | 'add' | 'modify' | 'delete';

  /** What is being changed */
  target: string;

  /** Old value (for modify) */
  oldValue?: string;

  /** New value (for add, modify) */
  newValue?: string;

  /** Rationale */
  rationale: string;
}

/**
 * Reconciliation metadata
 */
export interface ReconciliationMetadata {
  /** Total mismatches */
  totalMismatches: number;

  /** Resolved mismatches */
  resolvedMismatches: number;

  /** Unresolved mismatches */
  unresolvedMismatches: number;

  /** Actions generated */
  actionsGenerated: number;

  /** Resolution rate */
  resolutionRate: number;

  /** Average success probability */
  averageSuccessProbability: number;

  /** Processing time (ms) */
  processingTime: number;
}

/**
 * InterfaceReconciler - Resolves interface mismatches
 */
export class InterfaceReconciler {
  /**
   * Reconcile mismatches
   */
  async reconcile(
    segments: SegmentInterface[],
    mismatches: InterfaceMismatch[]
  ): Promise<ReconciliationResult> {
    const startTime = Date.now();
    const actions: ReconciliationAction[] = [];
    const unresolvedMismatches: InterfaceMismatch[] = [];

    // Sort mismatches by severity (critical first)
    const sortedMismatches = this.sortMismatchesBySeverity(mismatches);

    for (const mismatch of sortedMismatches) {
      // Generate reconciliation action
      const action = this.generateReconciliationAction(mismatch, segments);

      if (action) {
        actions.push(action);
      } else {
        // Could not reconcile
        unresolvedMismatches.push(mismatch);
      }
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(
      mismatches,
      actions,
      unresolvedMismatches,
      Date.now() - startTime
    );

    // Determine success (≥85% resolution rate)
    const succeeded = metadata.resolutionRate >= 0.85;

    return {
      succeeded,
      actions,
      unresolvedMismatches,
      metadata
    };
  }

  /**
   * Sort mismatches by severity
   */
  private sortMismatchesBySeverity(mismatches: InterfaceMismatch[]): InterfaceMismatch[] {
    const severityOrder = { critical: 0, major: 1, minor: 2 };
    return [...mismatches].sort((a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * Generate reconciliation action for mismatch
   */
  private generateReconciliationAction(
    mismatch: InterfaceMismatch,
    segments: SegmentInterface[]
  ): ReconciliationAction | null {
    switch (mismatch.type) {
      case 'missing-prerequisite':
        return this.reconcileMissingPrerequisite(mismatch, segments);
      case 'unused-output':
        return this.reconcileUnusedOutput(mismatch, segments);
      case 'conflicting-definition':
        return this.reconcileConflictingDefinition(mismatch, segments);
      case 'broken-thread':
        return this.reconcileBrokenThread(mismatch, segments);
      default:
        return null;
    }
  }

  /**
   * Reconcile missing prerequisite
   */
  private reconcileMissingPrerequisite(
    mismatch: InterfaceMismatch,
    segments: SegmentInterface[]
  ): ReconciliationAction | null {
    // Strategy 1: Reorder segments if provider exists
    if (mismatch.providingSegmentId) {
      return this.createReorderAction(mismatch, segments);
    }

    // Strategy 2: Add new segment to provide prerequisite
    return this.createAddSegmentAction(mismatch, segments);
  }

  /**
   * Create reorder action
   */
  private createReorderAction(
    mismatch: InterfaceMismatch,
    segments: SegmentInterface[]
  ): ReconciliationAction {
    const provider = segments.find(s => s.id === mismatch.providingSegmentId);
    const consumer = segments.find(s => s.id === mismatch.segmentId);

    if (!provider || !consumer) {
      throw new Error('Provider or consumer not found');
    }

    return {
      id: `reorder-${mismatch.id}`,
      type: 'reorder-segments',
      mismatchId: mismatch.id,
      description: `Reorder ${provider.id} to come before ${consumer.id}`,
      changes: [
        {
          type: 'move',
          target: provider.id,
          rationale: `Provider ${provider.id} must come before consumer ${consumer.id}`,
          newValue: `Move to before ${consumer.location.sectionId}.${consumer.location.paragraphRange.start}`
        }
      ],
      successProbability: 0.9,
      difficulty: this.estimateReorderDifficulty(provider, consumer, segments)
    };
  }

  /**
   * Create add segment action
   */
  private createAddSegmentAction(
    mismatch: InterfaceMismatch,
    segments: SegmentInterface[]
  ): ReconciliationAction {
    const consumer = segments.find(s => s.id === mismatch.segmentId);

    if (!consumer) {
      throw new Error('Consumer not found');
    }

    return {
      id: `add-segment-${mismatch.id}`,
      type: 'add-segment',
      mismatchId: mismatch.id,
      description: `Add new segment to establish: ${mismatch.requiredItem}`,
      changes: [
        {
          type: 'add',
          target: 'new-segment',
          newValue: `Segment establishing "${mismatch.requiredItem}"`,
          rationale: `Consumer ${consumer.id} requires this prerequisite`
        },
        {
          type: 'add',
          target: 'location',
          newValue: `Before ${consumer.location.sectionId}`,
          rationale: 'Must come before consumer'
        }
      ],
      successProbability: 0.7,
      difficulty: 'moderate'
    };
  }

  /**
   * Reconcile unused output
   */
  private reconcileUnusedOutput(
    mismatch: InterfaceMismatch,
    segments: SegmentInterface[]
  ): ReconciliationAction {
    const segment = segments.find(s => s.id === mismatch.segmentId);

    if (!segment) {
      throw new Error('Segment not found');
    }

    return {
      id: `remove-unused-${mismatch.id}`,
      type: 'modify-interface',
      mismatchId: mismatch.id,
      description: `Remove unused output from ${segment.id}`,
      changes: [
        {
          type: 'delete',
          target: mismatch.requiredItem,
          rationale: 'Output is never used by any segment'
        }
      ],
      successProbability: 0.95,
      difficulty: 'easy'
    };
  }

  /**
   * Reconcile conflicting definition
   */
  private reconcileConflictingDefinition(
    mismatch: InterfaceMismatch,
    segments: SegmentInterface[]
  ): ReconciliationAction {
    const segment = segments.find(s => s.id === mismatch.segmentId);

    if (!segment) {
      throw new Error('Segment not found');
    }

    return {
      id: `resolve-conflict-${mismatch.id}`,
      type: 'modify-interface',
      mismatchId: mismatch.id,
      description: `Align conflicting definition in ${segment.id}`,
      changes: [
        {
          type: 'modify',
          target: mismatch.requiredItem,
          oldValue: 'Conflicting definition',
          newValue: 'Aligned definition',
          rationale: 'Ensure consistent definition across segments'
        }
      ],
      successProbability: 0.8,
      difficulty: 'moderate'
    };
  }

  /**
   * Reconcile broken thread
   */
  private reconcileBrokenThread(
    mismatch: InterfaceMismatch,
    segments: SegmentInterface[]
  ): ReconciliationAction {
    const segment = segments.find(s => s.id === mismatch.segmentId);

    if (!segment) {
      throw new Error('Segment not found');
    }

    return {
      id: `establish-thread-${mismatch.id}`,
      type: 'add-segment',
      mismatchId: mismatch.id,
      description: `Add segment to establish thread: ${mismatch.requiredItem}`,
      changes: [
        {
          type: 'add',
          target: 'thread-segment',
          newValue: `Segment establishing thread "${mismatch.requiredItem}"`,
          rationale: `Consumer ${segment.id} requires this thread`
        }
      ],
      successProbability: 0.75,
      difficulty: 'moderate'
    };
  }

  /**
   * Estimate reorder difficulty
   */
  private estimateReorderDifficulty(
    provider: SegmentInterface,
    consumer: SegmentInterface,
    segments: SegmentInterface[]
  ): 'easy' | 'moderate' | 'hard' {
    // Easy if same section
    if (provider.location.sectionId === consumer.location.sectionId) {
      return 'easy';
    }

    // Hard if provider has many dependencies
    const providerDeps = provider.inputAssumptions.requiredClaims.length +
                         provider.inputAssumptions.requiredConcepts.length;
    if (providerDeps > 5) {
      return 'hard';
    }

    return 'moderate';
  }

  /**
   * Calculate reconciliation metadata
   */
  private calculateMetadata(
    mismatches: InterfaceMismatch[],
    actions: ReconciliationAction[],
    unresolvedMismatches: InterfaceMismatch[],
    processingTime: number
  ): ReconciliationMetadata {
    const totalMismatches = mismatches.length;
    const resolvedMismatches = actions.length;
    const unresolvedCount = unresolvedMismatches.length;

    const resolutionRate = totalMismatches > 0
      ? resolvedMismatches / totalMismatches
      : 1.0;

    const averageSuccessProbability = actions.length > 0
      ? actions.reduce((sum, a) => sum + a.successProbability, 0) / actions.length
      : 0;

    return {
      totalMismatches,
      resolvedMismatches,
      unresolvedMismatches: unresolvedCount,
      actionsGenerated: actions.length,
      resolutionRate,
      averageSuccessProbability,
      processingTime
    };
  }

  /**
   * Get detailed report
   */
  getDetailedReport(result: ReconciliationResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('INTERFACE RECONCILIATION REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    // Summary
    lines.push(`Status: ${result.succeeded ? '✅ SUCCEEDED' : '⚠️ PARTIAL SUCCESS'}`);
    lines.push(`Resolution Rate: ${(result.metadata.resolutionRate * 100).toFixed(1)}% (threshold: 85%)`);
    lines.push('');

    // Metadata
    lines.push('RECONCILIATION METADATA:');
    lines.push(`  Total mismatches: ${result.metadata.totalMismatches}`);
    lines.push(`  Resolved mismatches: ${result.metadata.resolvedMismatches}`);
    lines.push(`  Unresolved mismatches: ${result.metadata.unresolvedMismatches}`);
    lines.push(`  Actions generated: ${result.metadata.actionsGenerated}`);
    lines.push(`  Average success probability: ${(result.metadata.averageSuccessProbability * 100).toFixed(1)}%`);
    lines.push(`  Processing time: ${result.metadata.processingTime}ms`);
    lines.push('');

    // Actions
    if (result.actions.length > 0) {
      lines.push('RECONCILIATION ACTIONS:');
      lines.push('');

      for (const action of result.actions) {
        const difficultyIcon = action.difficulty === 'easy' ? '🟢' :
                               action.difficulty === 'moderate' ? '🟡' : '🔴';
        lines.push(`${difficultyIcon} [${action.difficulty.toUpperCase()}] ${action.type}`);
        lines.push(`   Description: ${action.description}`);
        lines.push(`   Success probability: ${(action.successProbability * 100).toFixed(0)}%`);
        lines.push(`   Changes:`);
        action.changes.forEach(change => {
          lines.push(`     - ${change.type.toUpperCase()}: ${change.target}`);
          lines.push(`       Rationale: ${change.rationale}`);
        });
        lines.push('');
      }
    }

    // Unresolved
    if (result.unresolvedMismatches.length > 0) {
      lines.push('UNRESOLVED MISMATCHES:');
      lines.push('');

      for (const mismatch of result.unresolvedMismatches) {
        lines.push(`⚠️ ${mismatch.type}: ${mismatch.segmentId}`);
        lines.push(`   Required: ${mismatch.requiredItem}`);
        lines.push(`   Recommendation: ${mismatch.recommendation}`);
        lines.push('');
      }
    } else {
      lines.push('✅ All mismatches resolved!');
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }

  /**
   * Apply reconciliation actions
   */
  async applyActions(
    segments: SegmentInterface[],
    actions: ReconciliationAction[]
  ): Promise<SegmentInterface[]> {
    let modifiedSegments = [...segments];

    for (const action of actions) {
      switch (action.type) {
        case 'reorder-segments':
          modifiedSegments = this.applyReorder(modifiedSegments, action);
          break;
        case 'add-segment':
          // Would need to generate actual segment - placeholder
          break;
        case 'modify-interface':
          modifiedSegments = this.applyModification(modifiedSegments, action);
          break;
        default:
          // Skip unknown action types
          break;
      }
    }

    return modifiedSegments;
  }

  /**
   * Apply reorder action
   */
  private applyReorder(
    segments: SegmentInterface[],
    action: ReconciliationAction
  ): SegmentInterface[] {
    // Extract segment ID from action description
    // This is a simplified implementation
    return segments;
  }

  /**
   * Apply modification action
   */
  private applyModification(
    segments: SegmentInterface[],
    action: ReconciliationAction
  ): SegmentInterface[] {
    // Modify segment interfaces based on action
    // This is a simplified implementation
    return segments;
  }
}
