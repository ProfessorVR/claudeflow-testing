/**
 * ValidationStage — Phase 3 of the v2 pipeline.
 *
 * Responsibilities:
 * - Prose sanitization (pre and post enforcement)
 * - Quality gauntlet (scoring only, revisions disabled)
 * - Citation enforcement (auto-correct hallucinated citations)
 * - Non-corpus author scrubbing
 * - Staged composition (if applicable)
 * - Post-generation heading structure fix
 * - Endnote generation
 * - Source verification
 * - Multi-step diagnostics computation
 *
 * This stage delegates to the orchestrator's existing methods.
 */

import type { ValidationResult } from './stage-types.js';
import type { RetrievalResult, DraftingResult, PipelineContext } from './stage-types.js';

// The actual implementation lives in write-pipeline-orchestrator.ts
// as runValidationStage() — a method that groups the existing validation
// logic into a single callable unit returning ValidationResult.
// See Step 3 wiring in write().

export type ValidationStageFn = (
  topic: string,
  options: Record<string, any>,
  retrievalResult: RetrievalResult,
  draftingResult: DraftingResult,
  ctx: PipelineContext
) => Promise<ValidationResult>;
