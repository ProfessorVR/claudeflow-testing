/**
 * DraftingStage — Phase 2 of the v2 pipeline.
 *
 * Responsibilities:
 * - Build the generation prompt (gold standard or RAG)
 * - v1 generation (if multi-step)
 * - investigateV1 (if multi-step)
 * - Prevention plan building (if multi-step)
 * - Supplemental retrieval for under-cited sources
 * - v2 prompt assembly + generation
 * - Inline validation path (if enabled)
 * - Direct LLM generation path
 *
 * This stage delegates to the orchestrator's existing methods.
 */

import type { DraftingResult } from './stage-types.js';
import type { PipelineContext } from './stage-types.js';

// The actual implementation lives in write-pipeline-orchestrator.ts
// as runDraftingStage() — a method that groups the existing generation
// logic into a single callable unit returning DraftingResult.
// See Step 3 wiring in write().

export type DraftingStageFn = (
  topic: string,
  options: Record<string, any>,
  retrievalResult: import('./stage-types.js').RetrievalResult,
  ctx: PipelineContext
) => Promise<DraftingResult>;
