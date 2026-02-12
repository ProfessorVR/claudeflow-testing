/**
 * Micro-Meso-Macro Pass Orchestration
 *
 * This module exports the complete three-pass composition pipeline:
 * 1. Micro pass - Generate subsection-level claim-chains
 * 2. Meso pass - Integrate subsections into sections
 * 3. Macro pass - Synthesize sections into document
 *
 * @module passes
 */

// Micro pass
export {
  MicroPass,
  type MicroPassSpec,
  type MicroPassResult,
  type MicroPassMetadata,
  type ClaimSpecification
} from './micro-pass.js';

// Meso pass
export {
  MesoPass,
  type MesoPassSpec,
  type MesoPassResult,
  type MesoPassMetadata,
  type IntegrationAction
} from './meso-pass.js';

// Macro pass
export {
  MacroPass,
  type MacroPassSpec,
  type MacroPassResult,
  type MacroPassMetadata,
  type SoWhatAnalysis,
  type StakesAnalysis,
  type ArchitectonicsAnalysis
} from './macro-pass.js';

// Pass orchestrator
export {
  PassOrchestrator,
  type PassOrchestrationSpec,
  type PassOrchestrationResult,
  type OrchestrationMetadata
} from './pass-orchestrator.js';

// Pass validation
export {
  PassValidation,
  type PassValidationResult,
  type PassValidationIssue,
  type PassValidationMetadata
} from './pass-validation.js';

/**
 * Pass module metadata
 */
export const PASSES_METADATA = {
  version: '1.0.0',
  phase: 'Phase 4: Micro-Meso-Macro Orchestration',
  description: 'Three-pass composition pipeline with structured intermediate representation',

  features: {
    microPass: true,
    mesoPass: true,
    macroPass: true,
    orchestration: true,
    validation: true,
    retryLogic: true,
    reworkTracking: true
  },

  thresholds: {
    micro: {
      toulminCompleteness: 0.85,
      warrantGeneralityMin: 0.60,
      warrantGeneralityMax: 0.80
    },
    meso: {
      coherence: 0.90,
      maxDuplication: 0.10,
      termConsistency: 0.95
    },
    macro: {
      significance: 0.85,
      stakes: 0.85,
      architectonics: 0.90
    },
    orchestration: {
      microPassSuccessRate: 0.85,
      mesoPassSuccessRate: 0.85,
      maxReworkRate: 0.10,
      maxRetries: 2
    },
    validation: {
      minScore: 0.85,
      maxCriticalIssues: 0
    }
  }
} as const;
