/**
 * Universal Validation Module
 *
 * Provides a unified interface for validating content against:
 * - Local corpus (ChromaDB knowledge_chunks)
 * - Web search results
 * - Mixed/hybrid sources
 *
 * Key Features:
 * - Universal evidence source abstraction
 * - Multi-mode validation (corpus_only, web_only, hybrid)
 * - Provenance tracking for all claims
 * - Inline validation during generation
 * - LLM tool integration for evidence lookup
 *
 * @module core/universal-validation
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Source types
  SourceType,
  TrustLevel,
  ValidationStrictness,
  ValidationMode,

  // Evidence structures
  ProvenanceEntry,
  EvidenceMetadata,
  EvidenceChunk,

  // Query types
  EvidenceQueryOptions,
  EvidenceQueryResult,
  EvidenceStoreStats,

  // Configuration types
  WebTrustPolicy,
  UniversalValidationConfig,

  // Result types
  IssueSeverity,
  IssueCategory,
  ValidationIssue,
  ClaimValidationResult,
  CitationValidationResult,
  QuotationValidationResult,
  UniversalValidationResult,

  // Tool types
  EvidenceLookupRequest,
  EvidenceLookupResult,

  // Provenance types
  TrackedClaim,
  ProvenanceReport,
} from './types.js';

// =============================================================================
// Constants & Defaults
// =============================================================================

export {
  STRICTNESS_THRESHOLDS,
  DEFAULT_TRUST_LEVELS,
  DEFAULT_WEB_TRUST_POLICY,
  DEFAULT_VALIDATION_CONFIG,
} from './types.js';

// =============================================================================
// Type Guards & Utilities
// =============================================================================

export {
  isCorpusSource,
  isWebSource,
  isVerifiedTrust,
  getThresholds,
  getTrustLevelForSource,
} from './types.js';

// =============================================================================
// Interface Exports
// =============================================================================

export type {
  // Core interfaces
  IUniversalEvidenceStore,
  IUniversalValidationLayer,
  IEvidenceLookupTool,
  IProvenanceLedger,
  IWebEvidenceProvider,

  // Orchestrator interfaces
  GenerationUnit,
  ValidatedUnit,
  InlineGenerationResult,
  IInlineValidationOrchestrator,

  // Utility interfaces
  IAgentPromptInjector,

  // Factory types
  EvidenceStoreFactory,
  ValidationLayerFactory,
  ProvenanceLedgerFactory,
  WebEvidenceProviderFactory,
} from './interfaces.js';

// =============================================================================
// Backward Compatibility
// =============================================================================

// Re-export ContextChunk as alias for EvidenceChunk
// This maintains compatibility with existing code using ContextChunk
import type { EvidenceChunk } from './types.js';

/**
 * @deprecated Use EvidenceChunk instead
 */
export type ContextChunk = EvidenceChunk;

// =============================================================================
// Future Implementation Placeholders
// =============================================================================

// These will be implemented in subsequent phases:
//
// Phase 1:
// export { UniversalEvidenceStore } from './universal-evidence-store.js';
// export { UniversalValidationLayer } from './universal-validation-layer.js';
//
// Phase 2:
// export { EvidenceLookupTool, getValidationTools } from './validation-tools.js';
// export { buildValidationPrompt } from './agent-prompt-injector.js';
//
// Phase 3:
// export { WebEvidenceProvider } from './web-evidence-provider.js';
// export { ProvenanceLedger } from './provenance-ledger.js';
