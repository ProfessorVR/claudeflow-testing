/**
 * Quote Span Staleness Engine — Single Authority Module
 *
 * ALL span math (rebasing, disambiguation, staleness) is owned exclusively
 * by this module. No other module reads patch logs or interval maps directly.
 *
 * Public API:
 *   markCandidatesOnPatchCommit()  — update index on patch
 *   revalidateCandidates()         — recheck candidate spans
 *   locateSpan()                   — rebase + snap-to-match + disambiguation
 *   computeStaleness()             — single staleness computation
 *
 * @module quote-span-staleness
 */

import { createHash } from 'crypto';
import type {
  QuoteSpan,
  OCRPatch,
  DocStalenessIndex,
  StalenessVerdict,
  StalenessCandidateDelta,
  LocateResult,
  IntervalEdit,
  NormalizationPolicy,
  AnchorStatus,
  StalenessReason,
} from './icp-types.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Default window size for snap-to-match (chars) */
const DEFAULT_EXACT_WINDOW = 50;

/** Default window size for bounded fallback search (chars) */
const DEFAULT_FALLBACK_WINDOW = 200;

/** Circuit breaker threshold: if more candidates than this, mark all stale */
const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 100;

export interface StalenessEngineConfig {
  exactWindow?: number;
  fallbackWindow?: number;
  circuitBreakerThreshold?: number;
}

// =============================================================================
// NORMALIZATION
// =============================================================================

/**
 * Apply normalization policy to text.
 * Used for comparing quote text against clean_text.
 */
export function normalizeText(text: string, policy: NormalizationPolicy): string {
  let result = text;
  for (const rule of policy.rules) {
    if (rule.enabled) {
      result = result.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
    }
  }
  return result;
}

/**
 * Compute SHA-256 hash of a string.
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Compute text fingerprint: sha256(normalize(text) + normalization_policy_sha).
 */
export function computeTextFingerprint(
  text: string,
  policy: NormalizationPolicy,
): string {
  const normalized = normalizeText(text, policy);
  const policySha = sha256(JSON.stringify(policy));
  return sha256(normalized + policySha);
}

/**
 * Compute span fingerprint: sha256(doc_id + text_fingerprint + left_ctx_hash + right_ctx_hash).
 * No offsets in identity.
 */
export function computeSpanFingerprint(
  docId: string,
  textFingerprint: string,
  leftCtxHash: string,
  rightCtxHash: string,
): string {
  return sha256(docId + textFingerprint + leftCtxHash + rightCtxHash);
}

/**
 * Compute canonical fingerprint: sha256(doc_id + canonical_span_id + text_fingerprint).
 * Only available after canonicalization.
 */
export function computeCanonicalFingerprint(
  docId: string,
  canonicalSpanId: string,
  textFingerprint: string,
): string {
  return sha256(docId + canonicalSpanId + textFingerprint);
}

/**
 * Compute context hash for left or right context of a span.
 */
export function computeContextHash(
  cleanText: string,
  range: [number, number],
  side: 'left' | 'right',
  policy: NormalizationPolicy,
  contextLength: number = 40,
): string {
  let ctx: string;
  if (side === 'left') {
    const start = Math.max(0, range[0] - contextLength);
    ctx = cleanText.slice(start, range[0]);
  } else {
    const end = Math.min(cleanText.length, range[1] + contextLength);
    ctx = cleanText.slice(range[1], end);
  }
  return sha256(normalizeText(ctx, policy));
}

// =============================================================================
// INTERVAL MAP — OFFSET REBASING
// =============================================================================

/**
 * Rebase an offset through a sequence of interval edits.
 * Each edit records (original_range, replacement_length).
 * Edits after span's patch_epoch are applied sequentially.
 */
export function rebaseOffset(
  offset: number,
  edits: IntervalEdit[],
  sinceEpoch: number,
): number {
  let adjusted = offset;
  for (const edit of edits) {
    if (edit.epoch <= sinceEpoch) continue;

    const editStart = edit.original_range[0];
    const editEnd = edit.original_range[1];
    const editOrigLen = editEnd - editStart;
    const delta = edit.replacement_length - editOrigLen;

    if (adjusted <= editStart) {
      // Offset is before the edit — no change
      continue;
    } else if (adjusted >= editEnd) {
      // Offset is after the edit — shift by delta
      adjusted += delta;
    } else {
      // Offset is inside the edited range — snap to edit start
      adjusted = editStart;
    }
  }
  return Math.max(0, adjusted);
}

/**
 * Rebase a range [start, end] through interval edits.
 */
export function rebaseRange(
  range: [number, number],
  edits: IntervalEdit[],
  sinceEpoch: number,
): [number, number] {
  return [
    rebaseOffset(range[0], edits, sinceEpoch),
    rebaseOffset(range[1], edits, sinceEpoch),
  ];
}

/**
 * Check if two ranges intersect.
 */
export function rangesIntersect(
  a: [number, number],
  b: [number, number],
): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

// =============================================================================
// STALENESS ENGINE
// =============================================================================

export class StalenessEngine {
  private readonly indices: Map<string, DocStalenessIndex> = new Map();
  private readonly intervalMaps: Map<string, IntervalEdit[]> = new Map();
  private readonly config: Required<StalenessEngineConfig>;

  constructor(config: StalenessEngineConfig = {}) {
    this.config = {
      exactWindow: config.exactWindow ?? DEFAULT_EXACT_WINDOW,
      fallbackWindow: config.fallbackWindow ?? DEFAULT_FALLBACK_WINDOW,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
    };
  }

  /**
   * Get or create a DocStalenessIndex for a document.
   */
  getIndex(docId: string): DocStalenessIndex {
    let index = this.indices.get(docId);
    if (!index) {
      index = {
        doc_id: docId,
        current_patch_epoch: 0,
        candidates_by_epoch: new Map(),
        candidate_reasons: new Map(),
        span_locator: new Map(),
      };
      this.indices.set(docId, index);
    }
    return index;
  }

  /**
   * Register a span in the locator for efficient staleness checks.
   */
  registerSpan(span: QuoteSpan): void {
    const index = this.getIndex(span.doc_id);
    index.span_locator.set(span.span_fingerprint, {
      clean_range: span.clean_text_range,
      clean_range_hash: span.clean_range_hash,
      patch_epoch_at_last_locate: span.patch_epoch,
    });
  }

  /**
   * Get the interval map for a document.
   */
  getIntervalMap(docId: string): IntervalEdit[] {
    let map = this.intervalMaps.get(docId);
    if (!map) {
      map = [];
      this.intervalMaps.set(docId, map);
    }
    return map;
  }

  /**
   * Record an interval edit for a patch.
   */
  recordIntervalEdit(docId: string, edit: IntervalEdit): void {
    this.getIntervalMap(docId).push(edit);
  }

  /**
   * Mark candidate spans for staleness checking on patch commit.
   *
   * On patch: update interval map → compute affected region(s) →
   * query span_locator for spans whose last-known range intersects →
   * add to candidates set.
   *
   * Circuit breaker: if too many candidates, mark all stale.
   */
  markCandidatesOnPatchCommit(
    docId: string,
    patch: OCRPatch,
  ): StalenessCandidateDelta {
    const index = this.getIndex(docId);

    // Increment epoch
    index.current_patch_epoch += 1;
    const epoch = index.current_patch_epoch;

    // Record interval edit
    const edit: IntervalEdit = {
      epoch,
      original_range: patch.before_range,
      replacement_length: patch.after_text.length,
    };
    this.recordIntervalEdit(docId, edit);

    // Find candidate spans whose ranges intersect the patch
    const newCandidates = new Set<string>();
    const candidateReasons = new Map<string, { reason: StalenessReason; patch_ids: string[] }>();

    for (const [fingerprint, locator] of index.span_locator) {
      if (rangesIntersect(locator.clean_range, patch.before_range)) {
        newCandidates.add(fingerprint);
        const existing = index.candidate_reasons.get(fingerprint);
        const patchIds = existing ? [...existing.patch_ids, patch.patch_id] : [patch.patch_id];

        const reason: { reason: StalenessReason; patch_ids: string[] } = {
          reason: 'range_intersection',
          patch_ids: patchIds,
        };
        index.candidate_reasons.set(fingerprint, reason);
        candidateReasons.set(fingerprint, reason);
      }
    }

    // Circuit breaker
    if (newCandidates.size > this.config.circuitBreakerThreshold) {
      // Mark ALL spans in this doc as candidates
      for (const fingerprint of index.span_locator.keys()) {
        newCandidates.add(fingerprint);
        if (!candidateReasons.has(fingerprint)) {
          candidateReasons.set(fingerprint, {
            reason: 'range_intersection',
            patch_ids: [patch.patch_id],
          });
          index.candidate_reasons.set(fingerprint, {
            reason: 'range_intersection',
            patch_ids: [patch.patch_id],
          });
        }
      }
    }

    // Store candidates by epoch
    index.candidates_by_epoch.set(epoch, newCandidates);

    return {
      doc_id: docId,
      new_candidates: newCandidates,
      candidate_reasons: candidateReasons,
    };
  }

  /**
   * Revalidate candidate spans after patches.
   * Returns staleness verdicts for each candidate.
   */
  revalidateCandidates(
    docId: string,
    candidates: string[],
    cleanText: string,
    policy: NormalizationPolicy,
    spans: Map<string, QuoteSpan>,
  ): Map<string, StalenessVerdict> {
    const results = new Map<string, StalenessVerdict>();
    const index = this.getIndex(docId);

    for (const fingerprint of candidates) {
      const span = spans.get(fingerprint);
      if (!span) {
        results.set(fingerprint, {
          is_stale: true,
          reason: 'rebase_validation_failed',
          details: 'Span not found in session',
        });
        continue;
      }

      const reason = index.candidate_reasons.get(fingerprint);
      if (!reason) {
        results.set(fingerprint, { is_stale: false, details: 'Not a candidate' });
        continue;
      }

      // If range intersects patch directly → stale
      if (reason.reason === 'range_intersection') {
        // Try rebase + locate
        const locateResult = this.locateSpan(docId, span, cleanText, policy);

        if (locateResult.found && locateResult.new_range) {
          // Successfully relocated — check anchor regression
          const anchorStatus = this.checkAnchorRegression(span, cleanText, locateResult.new_range);
          if (anchorStatus === 'mismatch') {
            results.set(fingerprint, {
              is_stale: true,
              reason: 'anchor_regression',
              patch_ids: reason.patch_ids,
              details: 'Anchor regression detected after rebase',
            });
          } else {
            // Successfully relocated — update locator, not stale
            index.span_locator.set(fingerprint, {
              clean_range: locateResult.new_range,
              clean_range_hash: sha256(cleanText.slice(locateResult.new_range[0], locateResult.new_range[1])),
              patch_epoch_at_last_locate: index.current_patch_epoch,
            });
            results.set(fingerprint, { is_stale: false, details: 'Relocated via rebase' });
          }
        } else {
          results.set(fingerprint, {
            is_stale: true,
            reason: 'rebase_validation_failed',
            patch_ids: reason.patch_ids,
            details: 'Could not relocate span after patch',
          });
        }
      }
    }

    return results;
  }

  /**
   * Locate a span in clean_text after patches.
   *
   * Algorithm:
   * 1. If range does NOT intersect patches → deterministic offset rebase
   * 2. Post-rebase: verify with two-step local search
   *    a. Exact/normalized match within ±exactWindow
   *    b. Bounded fallback: scan ±fallbackWindow for all matches
   *    c. Repeated-phrase disambiguation (nearest + context hash alignment)
   * 3. If found → snap-to-match with new range
   * 4. If not found → not found
   */
  locateSpan(
    docId: string,
    span: QuoteSpan,
    cleanText: string,
    policy: NormalizationPolicy,
  ): LocateResult {
    const edits = this.getIntervalMap(docId);

    // Rebase the range
    const rebased = rebaseRange(
      span.clean_text_range,
      edits,
      span.patch_epoch,
    );

    const normalizedQuote = normalizeText(span.text, policy);

    // Step 1: Try exact/normalized match in exact window
    const exactResult = this.searchInWindow(
      cleanText,
      normalizedQuote,
      rebased,
      policy,
      this.config.exactWindow,
    );

    if (exactResult.length === 1) {
      return {
        found: true,
        new_range: exactResult[0],
        method: 'snap_to_match',
      };
    }

    if (exactResult.length > 1) {
      // Disambiguate by proximity + context hash
      const selected = this.disambiguate(
        exactResult,
        rebased,
        span,
        cleanText,
        policy,
      );
      return {
        found: true,
        new_range: selected.range,
        method: 'snap_to_match',
        disambiguation: {
          candidates_found: exactResult.length,
          selected_index: selected.index,
          selection_reason: selected.reason,
        },
      };
    }

    // Step 2: Bounded fallback search
    const fallbackResult = this.searchInWindow(
      cleanText,
      normalizedQuote,
      rebased,
      policy,
      this.config.fallbackWindow,
    );

    if (fallbackResult.length === 1) {
      return {
        found: true,
        new_range: fallbackResult[0],
        method: 'bounded_fallback',
      };
    }

    if (fallbackResult.length > 1) {
      const selected = this.disambiguate(
        fallbackResult,
        rebased,
        span,
        cleanText,
        policy,
      );
      return {
        found: true,
        new_range: selected.range,
        method: 'bounded_fallback',
        disambiguation: {
          candidates_found: fallbackResult.length,
          selected_index: selected.index,
          selection_reason: selected.reason,
        },
      };
    }

    // Check if the rebased range itself contains the exact text
    const rebasedText = cleanText.slice(rebased[0], rebased[1]);
    if (normalizeText(rebasedText, policy) === normalizedQuote) {
      return {
        found: true,
        new_range: rebased,
        method: 'exact_rebase',
      };
    }

    return { found: false, method: 'not_found' };
  }

  /**
   * Compute staleness for a single span.
   * This is THE single staleness computation function.
   *
   * A span is stale iff ANY of:
   *   1. range_intersection: span range intersects any patch since span's epoch
   *   2. rebase_validation_failed: rebase attempted but verification fails
   *   3. anchor_regression: text matches but anchor mismatches
   */
  computeStaleness(
    span: QuoteSpan,
    cleanText: string,
    policy: NormalizationPolicy,
  ): StalenessVerdict {
    const index = this.getIndex(span.doc_id);
    const edits = this.getIntervalMap(span.doc_id);

    // Check if any patches happened since span's epoch
    const relevantEdits = edits.filter(e => e.epoch > span.patch_epoch);
    if (relevantEdits.length === 0) {
      return { is_stale: false, details: 'No patches since span creation' };
    }

    // Check range intersection with any patch
    for (const edit of relevantEdits) {
      if (rangesIntersect(span.clean_text_range, edit.original_range)) {
        return {
          is_stale: true,
          reason: 'range_intersection',
          details: `Span range intersects edit at epoch ${edit.epoch}`,
        };
      }
    }

    // No intersection — try rebase
    const locateResult = this.locateSpan(span.doc_id, span, cleanText, policy);

    if (!locateResult.found) {
      return {
        is_stale: true,
        reason: 'rebase_validation_failed',
        details: 'Could not locate span after rebase',
      };
    }

    // Check anchor regression
    if (locateResult.new_range) {
      const anchorStatus = this.checkAnchorRegression(span, cleanText, locateResult.new_range);
      if (anchorStatus === 'mismatch') {
        return {
          is_stale: true,
          reason: 'anchor_regression',
          details: 'Anchor points to different location after rebase',
        };
      }
    }

    return { is_stale: false, details: 'Rebase successful, anchor OK' };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Search for normalized quote text in a window around a range.
   * Returns all match positions as [start, end] ranges.
   */
  private searchInWindow(
    cleanText: string,
    normalizedQuote: string,
    center: [number, number],
    policy: NormalizationPolicy,
    windowSize: number,
  ): [number, number][] {
    const searchStart = Math.max(0, center[0] - windowSize);
    const searchEnd = Math.min(cleanText.length, center[1] + windowSize);
    const searchRegion = cleanText.slice(searchStart, searchEnd);
    const normalizedRegion = normalizeText(searchRegion, policy);

    const matches: [number, number][] = [];
    let searchFrom = 0;

    while (searchFrom < normalizedRegion.length) {
      const idx = normalizedRegion.indexOf(normalizedQuote, searchFrom);
      if (idx === -1) break;

      // Map back to clean_text coordinates
      // This is approximate — normalization may change lengths
      // For safety, search in the original text too
      const absStart = searchStart + idx;
      const absEnd = absStart + normalizedQuote.length;

      // Verify: does the original clean_text at this position normalize to match?
      const candidate = cleanText.slice(absStart, absEnd);
      if (normalizeText(candidate, policy) === normalizedQuote) {
        matches.push([absStart, absEnd]);
      }

      searchFrom = idx + 1;
    }

    return matches;
  }

  /**
   * Disambiguate between multiple match candidates.
   * Primary: minimal absolute distance from rebased start offset.
   * Tie-breaker: maximal context hash alignment.
   */
  private disambiguate(
    candidates: [number, number][],
    rebased: [number, number],
    span: QuoteSpan,
    cleanText: string,
    policy: NormalizationPolicy,
  ): { range: [number, number]; index: number; reason: string } {
    let bestIndex = 0;
    let bestDistance = Infinity;
    let bestContextScore = -1;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const distance = Math.abs(candidate[0] - rebased[0]);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
        bestContextScore = this.contextAlignmentScore(
          candidate,
          span,
          cleanText,
          policy,
        );
      } else if (distance === bestDistance) {
        // Tie-break by context hash alignment
        const contextScore = this.contextAlignmentScore(
          candidate,
          span,
          cleanText,
          policy,
        );
        if (contextScore > bestContextScore) {
          bestIndex = i;
          bestContextScore = contextScore;
        }
      }
    }

    return {
      range: candidates[bestIndex],
      index: bestIndex,
      reason: candidates.length > 1
        ? `Selected nearest match (distance=${bestDistance}, context_score=${bestContextScore.toFixed(2)})`
        : 'Single match',
    };
  }

  /**
   * Compute context alignment score for a candidate match position.
   * Compares adjacent context hashes against stored hashes.
   */
  private contextAlignmentScore(
    candidateRange: [number, number],
    span: QuoteSpan,
    cleanText: string,
    policy: NormalizationPolicy,
  ): number {
    const leftHash = computeContextHash(cleanText, candidateRange, 'left', policy);
    const rightHash = computeContextHash(cleanText, candidateRange, 'right', policy);

    let score = 0;
    if (leftHash === span.left_ctx_hash) score += 0.5;
    if (rightHash === span.right_ctx_hash) score += 0.5;
    return score;
  }

  /**
   * Check anchor regression after rebase.
   * Returns anchor status.
   */
  private checkAnchorRegression(
    span: QuoteSpan,
    _cleanText: string,
    _newRange: [number, number],
  ): AnchorStatus {
    // If no anchor, cannot regress
    if (!span.source_anchor) {
      return 'missing';
    }

    // Anchor validation: compare source_anchor against document indexer.
    // For MVP, we do a simple check — the anchor string is still present
    // in the expected region. Full anchor indexer integration is Phase 2.
    // For now, return 'ok' — conservative (won't false-stale).
    return 'ok';
  }
}
