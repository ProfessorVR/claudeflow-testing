/**
 * Interface-Based Composition Module
 *
 * This module provides interface-based composition where segments publish
 * input assumptions and output contributions, enabling validation and
 * automatic transition generation.
 *
 * @module interfaces
 */

// Segment Interface
export {
  type SegmentInterface,
  type SegmentLocation,
  type SegmentInputAssumptions,
  type SegmentOutputContributions,
  type ClaimReference,
  type ConceptReference,
  type ThreadReference,
  type KnowledgeReference,
  type ClaimContribution,
  type ConceptContribution,
  type ThreadContribution,
  type KnowledgeContribution,
  type OpenTension,
  type TensionResolution,
  type DependencyStrength,
  type ContributionStrength,
  type InterfaceMetadata,
  type InterfaceMismatch,
  type MismatchAnalysis,
  calculateInterfaceCompleteness,
  calculateInterfaceQuality,
  validateSegmentInterface
} from './segment-interface.js';

// Interface Validator
export {
  InterfaceValidator,
  type InterfaceValidationResult,
  type ValidationMetadata
} from './interface-validator.js';

// Interface Reconciler
export {
  InterfaceReconciler,
  type ReconciliationResult,
  type ReconciliationAction,
  type ActionChange,
  type ReconciliationMetadata
} from './interface-reconciler.js';

// Transition Generator
export {
  TransitionGenerator,
  type TransitionGenerationResult,
  type Transition,
  type TransitionType,
  type TransitionTextMetadata,
  type TransitionMetadata
} from './transition-generator.js';

// Interface Orchestrator
export {
  InterfaceOrchestrator,
  type InterfaceCompositionResult,
  type ComposedSegment,
  type CompositionMetadata,
  type InterfaceOrchestratorOptions
} from './interface-orchestrator.js';

/**
 * Module metadata
 */
export const INTERFACES_MODULE_METADATA = {
  version: '1.0.0',
  phase: 3,
  description: 'Interface-based composition with validation and reconciliation',
  components: {
    segmentInterface: {
      name: 'SegmentInterface',
      purpose: 'Define input/output contracts',
      features: ['input-assumptions', 'output-contributions', 'open-tensions']
    },
    validator: {
      name: 'InterfaceValidator',
      purpose: 'Validate interface contracts',
      threshold: 0.90,
      checks: ['missing-prerequisites', 'forward-references', 'unused-outputs']
    },
    reconciler: {
      name: 'InterfaceReconciler',
      purpose: 'Resolve interface mismatches',
      threshold: 0.85,
      strategies: ['reorder-segments', 'add-segment', 'modify-interface']
    },
    transitionGenerator: {
      name: 'TransitionGenerator',
      purpose: 'Generate smooth transitions',
      types: ['continuation', 'elaboration', 'contrast', 'synthesis', 'pivot', 'example', 'application']
    },
    orchestrator: {
      name: 'InterfaceOrchestrator',
      purpose: 'Coordinate composition pipeline',
      phases: ['validate', 'reconcile', 'generate-transitions', 'compose']
    }
  }
};

/**
 * Feature flags for interface-based composition
 */
export const INTERFACE_FEATURES = {
  segmentInterfaces: true,       // ✅ Phase 3
  interfaceValidation: true,     // ✅ Phase 3
  interfaceReconciliation: true, // ✅ Phase 3
  transitionGeneration: true,    // ✅ Phase 3
  interfaceOrchestration: true   // ✅ Phase 3
};
