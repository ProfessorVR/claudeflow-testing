/**
 * Writing pipeline stages — v2 decomposition.
 *
 * Stages: RetrievalStage → DraftingStage → ValidationStage
 */

export type {
  PipelineVersion,
  PipelineEvent,
  PipelineContext,
  PipelineHealth,
  RetrievalResult,
  DraftingResult,
  ValidationResult,
} from './stage-types.js';

export {
  getPipelineVersion,
  computePipelineHealth,
  createPipelineContext,
  recordHardFailure,
  recordDegraded,
  recordWarning,
} from './stage-types.js';

export { deduplicateChunks, estimateTokenBudget } from './pipeline-utils.js';

export {
  runRetrievalStage,
  type RetrievalStageDeps,
  type RetrievalStageOptions,
} from './retrieval-stage.js';
