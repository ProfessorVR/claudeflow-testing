/**
 * Shared Types — cross-layer type definitions for router/ and routing/.
 *
 * See docs/adr/001-router-vs-routing-boundary.md for architectural rationale.
 *
 * core/router/ = "Which LLM backend handles this request?"
 * core/routing/ = "Which agent handles this task?"
 *
 * This module lives in core/router/ (the lower-level layer) so that
 * core/routing/ can depend on it without circular imports.
 *
 * @module core/router/shared-types
 */

// ---------------------------------------------------------------------------
// Task Classification (canonical source: router-types.ts)
// ---------------------------------------------------------------------------

export type {
  TaskType,
  Complexity,
  RiskLevel,
  TaskClassification,
  ClassificationSignals,
} from './router-types.js';

// ---------------------------------------------------------------------------
// Unified Failure Taxonomy
// Merges router/retry-handler.ts error classification with
// routing/failure-classifier.ts failure types.
// ---------------------------------------------------------------------------

/**
 * Unified failure category spanning both routing layers.
 *
 * - ROUTING_FAILURE: Wrong agent selected (routing-level)
 * - AGENT_FAILURE: Agent execution error (routing-level)
 * - PROVIDER_FAILURE: LLM backend error — timeout, rate_limit, auth, etc. (router-level)
 * - TASK_IMPOSSIBLE: Multiple agents fail, user abandons (routing-level)
 * - PARTIAL_SUCCESS: Some pipeline stages completed (both levels)
 */
export type FailureCategory =
  | 'ROUTING_FAILURE'
  | 'AGENT_FAILURE'
  | 'PROVIDER_FAILURE'
  | 'TASK_IMPOSSIBLE'
  | 'PARTIAL_SUCCESS';

/**
 * Unified failure taxonomy combining router and routing failure information.
 */
export interface FailureTaxonomy {
  /** High-level failure category */
  readonly category: FailureCategory;
  /** Which layer originated the failure */
  readonly source: 'router' | 'routing';
  /** Confidence in classification (0-1) */
  readonly confidence: number;
  /** Whether routing weights should be penalized */
  readonly penalizeRouting: boolean;
  /** Whether agent capability scores should be penalized */
  readonly penalizeAgent: boolean;
  /** Recommended recovery action */
  readonly recommendedAction: 'retry_same' | 'retry_different' | 'escalate' | 'abandon';
  /** Human-readable reasoning */
  readonly reasoning: string;
}

// ---------------------------------------------------------------------------
// Outcome Event — allows routing-learner to consume router outcome events
// ---------------------------------------------------------------------------

/**
 * Outcome event emitted by OutcomeTracker (router layer).
 * RoutingLearner (routing layer) can subscribe to these for cross-layer learning.
 */
export interface OutcomeEvent {
  /** Unique outcome ID */
  readonly outcomeId: string;
  /** When the routing occurred */
  readonly timestamp: Date;
  /** Task pattern hash for grouping similar tasks */
  readonly taskPattern: string;
  /** Overall outcome status */
  readonly status: 'success' | 'failure' | 'partial' | 'reverted';
  /** Where the task was routed (model or agent identifier) */
  readonly routedTo: string;
  /** Actual model used */
  readonly actualModel: string;
  /** Failure details (if status is not 'success') */
  readonly failure?: FailureTaxonomy;
}
