/**
 * RetrievalStage — Phase 1 of the v2 pipeline.
 *
 * Responsibilities:
 * - Multi-query semantic retrieval
 * - Primary-author-aware supplementation
 * - Source diversity enforcement
 * - Chunk trimming and attention reordering
 * - Coverage validation
 * - Knowledge unit loading
 * - Style profile loading
 * - CorpusConstraint building
 * - Per-section constraint derivation
 * - (Multi-step) v1 generation + investigateV1 + prevention plan
 *
 * This stage delegates to the orchestrator's existing private methods,
 * preserving exact behavior while establishing the stage boundary.
 */

import type { WritePipelineOrchestrator } from '../write-pipeline-orchestrator.js';
import type { RetrievalResult } from './stage-types.js';
import type { PipelineContext } from './stage-types.js';
import { recordDegraded, recordWarning } from './stage-types.js';

/**
 * Run the retrieval stage.
 *
 * This function encapsulates all retrieval logic from write():
 * lines ~1705-2198 of the legacy orchestrator.
 *
 * Because the orchestrator's methods are private, the v2 path
 * calls this stage from within write() where `this` is available.
 * This is the transitional architecture — future steps will
 * extract methods to be directly callable.
 */
export type RetrievalStageFn = (
  orchestrator: WritePipelineOrchestrator,
  topic: string,
  options: Record<string, any>,
  ctx: PipelineContext
) => Promise<RetrievalResult>;

// The actual implementation lives in write-pipeline-orchestrator.ts
// as runRetrievalStage() — a method that groups the existing retrieval
// logic into a single callable unit returning RetrievalResult.
// See Step 3 wiring in write().
