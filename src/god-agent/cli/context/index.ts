/**
 * Context Management Module for PhD Pipeline
 *
 * This module provides cross-chapter context threading to maintain
 * coherent dissertation narrative across chapters.
 *
 * Components:
 * - ChapterContextAggregator: Extract and aggregate context from chapters
 * - ArgumentThreadTracker: Track arguments across chapters
 * - ForwardReferenceValidator: Validate forward references are fulfilled
 * - DissertationContextManager: Central coordinator for all context tracking
 * - TieredContextManager: Hierarchical context compression for large documents
 *
 * The TieredContextManager implements a three-tier system for handling
 * large dissertation documents that would otherwise exceed context limits:
 * - Tier 1 (Hot): Current section context (~50k tokens)
 * - Tier 2 (Warm): Chapter-level summaries (~20k tokens)
 * - Tier 3 (Cold): On-demand RAG retrieval (variable)
 *
 * Usage:
 * ```typescript
 * import {
 *   DissertationContextManager,
 *   TieredContextManager,
 * } from './context/index.js';
 *
 * // Initialize context manager
 * const contextManager = new DissertationContextManager(
 *   sessionId,
 *   '.phd-sessions/{sessionId}',
 *   'My Dissertation Title'
 * );
 *
 * // After each chapter is written
 * await contextManager.onChapterComplete(1, chapterText, 'Introduction');
 *
 * // For small documents, use full context
 * const context = contextManager.buildContextForChapter(2);
 *
 * // For large documents, use tiered context
 * if (contextManager.shouldUseTieredContext()) {
 *   const tieredContext = await contextManager.buildTieredContextForChapter(2, {
 *     tokenBudget: 60000,
 *     sectionName: 'Literature Review',
 *   });
 * }
 *
 * // After all chapters, validate
 * const report = contextManager.validateDissertationConsistency();
 * ```
 */

// Chapter Context Aggregator
export {
  ChapterContextAggregator,
  type ChapterContext,
} from './chapter-context-aggregator.js';

// Argument Thread Tracker
export {
  ArgumentThreadTracker,
  type ArgumentThread,
  type ValidationResult as ThreadValidationResult,
} from './argument-thread-tracker.js';

// Forward Reference Validator
export {
  ForwardReferenceValidator,
  type ForwardReference,
  type ValidationResult as ReferenceValidationResult,
  type ValidationReport,
} from './forward-reference-validator.js';

// Dissertation Context Manager (main entry point)
export {
  DissertationContextManager,
  type DissertationContext,
  type DissertationValidationReport,
  type SubThesis,
  type GlossaryTerm,
  type ContextBuildOptions,
  type TieredContextBuildOptions,
} from './dissertation-context-manager.js';

// Tiered Context Manager (hierarchical compression for large documents)
export {
  TieredContextManager,
  InMemoryColdContextAccessor,
  createTieredContextManager,
  createClaudeTieredContextManager,
  createSmallContextTieredManager,
  // AgentDB-backed factory functions
  createAgentDBTieredContextManager,
  createClaudeAgentDBTieredContextManager,
  // AgentDB cold accessor
  AgentDBColdContextAccessor,
  type TierConfig,
  type TieredContext,
  type HotContext,
  type WarmContext,
  type ColdContextAccessor,
  type CompressedArgument,
  type CompressedSummary,
  type RetrievedChunk,
  type TieredContextManagerConfig,
  type AgentDBTieredContextManagerConfig,
  type AgentDBColdAccessorConfig,
} from './tiered-context-manager.js';

// AgentDB Cold Context Accessor (standalone exports)
export {
  createAgentDBColdAccessor,
  createInitializedAgentDBColdAccessor,
} from './agentdb-cold-accessor.js';

// Hybrid Cold Context Accessor (Phase 1: BM25 + Semantic Search)
export {
  HybridColdContextAccessor,
  createHybridColdAccessor,
  createInitializedHybridColdAccessor,
  type HybridColdAccessorConfig,
  type RetrievalMode,
  type RetrievalStatistics,
} from './hybrid-cold-accessor.js';

// Context Health Monitor (PHASE-4-001)
export {
  ContextHealthMonitor,
  createContextHealthMonitor,
  createClaudeContextMonitor,
  createSmallContextMonitor,
  createDebugContextMonitor,
  type ContextHealth,
  type ContextHealthStatus,
  type ContextHealthEvent,
  type ContextHealthMonitorConfig,
} from './context-health-monitor.js';

// Phase Summarizer (PHASE-4-002)
export {
  PhaseSummarizer,
  createPhaseSummarizer,
  createAggressiveSummarizer,
  createDetailedSummarizer,
  type PhaseSummary,
  type PhaseSummarizerConfig,
  type PhaseSummarizationHints,
  type SummarizationEvent,
} from './phase-summarizer.js';

// Context Tier Manager (Phase G - 3-Tier Token Management)
export {
  ContextTierManager,
  createContextTierManager,
  createDissertationContextManager as createDissertationTierContextManager,
  createLowMemoryContextManager,
  getContextTierManager,
  resetContextTierManager,
  type ContextTier,
  type ContentPriority,
  type ContentType,
  type ContextItem,
  type TierConfig as ContextTierConfig,
  type ContextTierManagerConfig,
  type TierStats,
  type ContextPack,
  type StoreOptions,
} from './context-tier-manager.js';
