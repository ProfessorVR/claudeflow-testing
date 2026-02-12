/**
 * Staged Composition System
 *
 * This module provides the complete staged composition pipeline for
 * generating high-quality academic writing with rigorous argument structure.
 *
 * Key Components:
 * - SIR (Structured Intermediate Representations): Claim maps, concept ledgers, dependency graphs
 * - Generators: Extract SIR from text
 * - Adversarial Reviewers: Consistency, scope, counter-argument, citation checking
 * - Interface-Based Composition: Segment interface contracts, validation, reconciliation
 * - Micro-Meso-Macro Passes: Three-level orchestration pipeline
 * - Synthesis: Integration with god-write, SIR-to-prose rendering, composition orchestration
 *
 * @module composition
 */

// Export SIR (Structured Intermediate Representations)
export * from './sir/index.js';

// Export Generators
export * from './generators/index.js';

// Export Adversarial Reviewers
export * from './adversarial/index.js';

// Export Interface-Based Composition
export * from './interfaces/index.js';

// Export Micro-Meso-Macro Passes
export * from './passes/index.js';

// Export Synthesis (Integration with god-write)
export * from './synthesis/index.js';

// Export Citation Enhancer (Phase A/B Enhancement)
export {
  CitationEnhancer,
  createDefaultEnhancer,
  createStrictEnhancer,
  createDraftEnhancer,
  type CorpusResult,
  type UncitedClaim,
  type CitationSuggestion,
  type EnhancementResult,
  type CitationEnhancerConfig,
} from './citation-enhancer.js';

// Export Prose Sanitizer (Phase A Enhancement)
export {
  ProseSanitizer,
  type SanitizationResult,
  type ArtifactViolation,
} from './prose-sanitizer.js';

// Export Citation Counter (Phase A Enhancement)
export {
  CitationCounter,
  type CitationStats,
  type SectionStats,
} from './citation-counter.js';

// Export Thematic Synthesizer (Phase C Enhancement)
export {
  ThematicSynthesizer,
  createDefaultSynthesizer,
  createStrictSynthesizer,
  createExploratorySynthesizer,
  type ExtractedTheme,
  type ThemeCitation,
  type ThemeCluster,
  type ThemeRelationship,
  type MetaTheme,
  type ThematicFramework,
  type SynthesisResult,
  type ThematicSynthesizerConfig,
  type CorpusEvidence,
  type PatternAnalysisInput,
} from './thematic-synthesizer.js';

/**
 * Composition System Metadata
 */
export const COMPOSITION_VERSION = '1.1.0';
export const COMPOSITION_PHASE = 'Phase C: Thematic Synthesis - COMPLETE';

/**
 * System Status
 */
export const SYSTEM_STATUS = {
  phase1: 'complete',  // SIR data structures ✓
  phase2: 'complete',  // Adversarial reviewers ✓
  phase3: 'complete',  // Interface-based composition ✓
  phase4: 'complete',  // Micro-meso-macro orchestration ✓
  phase5: 'complete'   // Integration with god-write ✓
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  claimMapGeneration: true,
  conceptLedgerBuilding: true,
  dependencyGraphBuilding: true,
  toulminValidation: true,
  driftDetection: true,
  dependencyTracking: true,
  adversarialReview: true,        // Phase 2 ✓
  interfaceReconciliation: true,  // Phase 3 ✓
  stagedOrchestration: true,      // Phase 4 ✓
  godWriteIntegration: true,      // Phase 5 ✓
  sirToProseRendering: true,      // Phase 5 ✓
  compositionOrchestration: true  // Phase 5 ✓
} as const;
