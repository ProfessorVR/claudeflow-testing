/**
 * ICP Session Events — Event Emitter + Helpers
 *
 * Provides typed event creation helpers for the ICP pipeline.
 * Events are append-only audit trail entries — state is authoritative.
 *
 * @module icp-session-events
 */

import type {
  ICPSession,
  ICPSessionEvent,
  ICPEventAction,
  ICPEventActor,
  ICPEventSeverity,
  ICPEventCategory,
} from './icp-types.js';
import { emitSessionEvent } from './icp-types.js';

// =============================================================================
// EVENT FACTORY HELPERS
// =============================================================================

/**
 * Create and emit a retrieval event.
 */
export function emitRetrievalEvent(
  session: ICPSession,
  facetId: string,
  spanCount: number,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'retrieve',
    payload_summary: `Retrieved ${spanCount} spans for facet ${facetId}`,
    affected_ids: [facetId],
    severity: 'info',
    user_visible: true,
    category: 'evidence',
  });
}

/**
 * Create and emit a verification event.
 */
export function emitVerificationEvent(
  session: ICPSession,
  quoteId: string,
  newStatus: string,
  actor: ICPEventActor = 'system',
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor,
    action: 'verify',
    payload_summary: `Quote ${quoteId} → ${newStatus}`,
    affected_ids: [quoteId],
    severity: 'info',
    user_visible: true,
    category: 'verification',
  });
}

/**
 * Create and emit a patch event.
 */
export function emitPatchEvent(
  session: ICPSession,
  patchId: string,
  docId: string,
  impactedSpans: string[],
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'user',
    action: 'patch',
    payload_summary: `OCR patch ${patchId} on doc ${docId}, ${impactedSpans.length} spans affected`,
    affected_ids: [patchId, docId, ...impactedSpans],
    severity: impactedSpans.length > 0 ? 'warn' : 'info',
    user_visible: true,
    category: 'staleness',
  });
}

/**
 * Create and emit a binding event.
 */
export function emitBindingEvent(
  session: ICPSession,
  bindingId: string,
  atomIds: string[],
  quoteIds: string[],
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'bind',
    payload_summary: `Binding ${bindingId}: ${atomIds.length} atoms ↔ ${quoteIds.length} quotes`,
    affected_ids: [bindingId, ...atomIds, ...quoteIds],
    severity: 'info',
    user_visible: false,
    category: 'evidence',
  });
}

/**
 * Create and emit a prune event.
 */
export function emitPruneEvent(
  session: ICPSession,
  prunedQuoteIds: string[],
  reason: string,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'prune',
    payload_summary: `Pruned ${prunedQuoteIds.length} quotes: ${reason}`,
    affected_ids: prunedQuoteIds,
    severity: 'info',
    user_visible: true,
    category: 'evidence',
  });
}

/**
 * Create and emit a stress test event.
 */
export function emitStressTestEvent(
  session: ICPSession,
  tested: number,
  passed: number,
  failed: number,
  demoted: number,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'stress_test',
    payload_summary: `Stress test: ${tested} tested, ${passed} passed, ${failed} failed, ${demoted} demoted`,
    affected_ids: [],
    severity: failed > 0 ? 'warn' : 'info',
    user_visible: true,
    category: 'evidence',
  });
}

/**
 * Create and emit a plan validation event.
 */
export function emitPlanValidateEvent(
  session: ICPSession,
  valid: boolean,
  errors: string[],
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'plan_validate',
    payload_summary: valid
      ? 'Paragraph plan validated successfully'
      : `Plan validation failed: ${errors.join('; ')}`,
    affected_ids: [],
    severity: valid ? 'info' : 'block',
    user_visible: true,
    category: 'generation',
  });
}

/**
 * Create and emit a generation event.
 */
export function emitGenerationEvent(
  session: ICPSession,
  paragraphId: string,
  driftFlagCount: number,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'llm',
    action: 'generate',
    payload_summary: `Generated paragraph ${paragraphId}, ${driftFlagCount} drift flags`,
    affected_ids: [paragraphId],
    severity: driftFlagCount > 0 ? 'warn' : 'info',
    user_visible: true,
    category: 'generation',
  });
}

/**
 * Create and emit a drift flag event.
 */
export function emitDriftFlagEvent(
  session: ICPSession,
  sentenceId: string,
  verdict: string,
  proposition: string,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'drift_flag',
    payload_summary: `${verdict}: "${proposition.slice(0, 80)}"`,
    affected_ids: [sentenceId],
    severity: verdict === 'BLOCK' ? 'block' : 'warn',
    user_visible: true,
    category: 'generation',
  });
}

/**
 * Create and emit an atom migration event.
 */
export function emitAtomMigrationEvent(
  session: ICPSession,
  oldAtomId: string,
  newAtomId: string,
  type: string,
  auto: boolean,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: auto ? 'system' : 'user',
    action: auto ? 'atom_auto_migrate' : 'atom_migrate',
    payload_summary: `${type}: ${oldAtomId} → ${newAtomId}`,
    affected_ids: [oldAtomId, newAtomId],
    severity: 'info',
    user_visible: true,
    category: 'evidence',
  });
}

/**
 * Create and emit a polish normalization event.
 */
export function emitPolishNormalizationEvent(
  session: ICPSession,
  quoteId: string,
  beforeText: string,
  afterText: string,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'polish_normalize',
    payload_summary: `Quote ${quoteId} normalized during polish`,
    affected_ids: [quoteId],
    severity: 'debug',
    user_visible: false,
    category: 'generation',
  });
}

/**
 * Create and emit a justified relaxation event.
 */
export function emitJustifiedRelaxationEvent(
  session: ICPSession,
  facetId: string,
  previousStrictness: string,
  newStrictness: string,
  rationale: string,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'user',
    action: 'justified_relaxation',
    payload_summary: `Facet ${facetId}: ${previousStrictness} → ${newStrictness}. Rationale: ${rationale.slice(0, 100)}`,
    affected_ids: [facetId],
    severity: 'warn',
    user_visible: true,
    category: 'policy',
  });
}

/**
 * Create and emit a review failure event.
 */
export function emitReviewFailEvent(
  session: ICPSession,
  failureType: string,
  description: string,
  affectedIds: string[],
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'review_fail',
    payload_summary: `${failureType}: ${description}`,
    affected_ids: affectedIds,
    severity: 'block',
    user_visible: true,
    category: 'generation',
  });
}

/**
 * Create and emit an export event.
 */
export function emitExportEvent(
  session: ICPSession,
  runId: string,
  format: string,
): void {
  emitSessionEvent(session, {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'export',
    payload_summary: `Exported run ${runId} as ${format}`,
    affected_ids: [runId],
    severity: 'info',
    user_visible: true,
    category: 'export',
  });
}
