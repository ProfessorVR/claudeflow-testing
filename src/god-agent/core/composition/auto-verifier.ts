/**
 * Auto-Verifier — Two-Stage Calibration Verification
 *
 * Stage A: Deterministic structural checks (text-primary)
 *   - Exact substring match in clean_text (or normalized)
 *   - Anchors do NOT cause Stage A failure (they feed Stage B)
 *
 * Stage B: Multi-signal confidence score (auto_confidence: 0-1)
 *   - Weighted signals: exactness, ocr_risk, quote_length, authority,
 *     canonical_overlap (from session snapshot), anchor_confidence
 *
 * Gating: no quotation enters downstream unless verified.
 * stale_verified does NOT pass the gate.
 *
 * @module auto-verifier
 */

import type {
  QuoteSpan,
  VerificationStatus,
  StageAResult,
  StageBSignals,
  StageBWeights,
  AutoVerificationResult,
  CanonicalRegistrySnapshot,
  NormalizationPolicy,
} from './icp-types.js';
import {
  VERIFIED_STATUSES,
  DEFAULT_STAGE_B_WEIGHTS,
  DEFAULT_NORMALIZATION_POLICY,
} from './icp-types.js';
import { normalizeText } from './quote-span-staleness.js';
import type { ModelRouter } from './model-router.js';

// =============================================================================
// OCR REPAIR PROMPT
// =============================================================================

const OCR_REPAIR_SYSTEM_PROMPT = `Fix OCR errors in academic text.

RULES:
- Only fix character-level recognition errors (e.g., "19B4" -> "1984", "tlie" -> "the", broken ligatures like "ﬁ" -> "fi")
- Do NOT add information not present in the 'Text to repair'
- Do NOT change the meaning to better fit the context
- Use 'Context before' and 'Context after' ONLY to disambiguate character recognition (e.g., '1' vs 'l', 'rn' vs 'm')
- Do NOT rephrase, summarize, or expand the text
- If the text appears correct, return it unchanged
- Return the corrected text only, no explanation`;

function buildOCRRepairPrompt(
  text: string,
  contextBefore: string,
  contextAfter: string,
): string {
  return [
    `Context before: ${contextBefore}`,
    '',
    `Text to repair: ${text}`,
    '',
    `Context after: ${contextAfter}`,
  ].join('\n');
}

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface AutoVerifierConfig {
  /** Confidence threshold for auto_verified (default: 0.85) */
  autoVerifyThreshold?: number;
  /** Confidence threshold for flagged (below this → auto_rejected) (default: 0.50) */
  flaggedThreshold?: number;
  /** Stage B weights */
  weights?: StageBWeights;
  /** Normalization policy */
  normalizationPolicy?: NormalizationPolicy;
  /** ModelRouter for OCR repair (optional — skips repair if not provided) */
  ocrRepairRouter?: ModelRouter;
  /** OCR risk threshold above which repair is attempted (default: 0.2) */
  ocrRepairThreshold?: number;
}

/** Resolved config with defaults applied (ocrRepairRouter remains optional) */
interface ResolvedAutoVerifierConfig {
  autoVerifyThreshold: number;
  flaggedThreshold: number;
  weights: StageBWeights;
  normalizationPolicy: NormalizationPolicy;
  ocrRepairRouter?: ModelRouter;
  ocrRepairThreshold: number;
}

const DEFAULT_CONFIG: ResolvedAutoVerifierConfig = {
  autoVerifyThreshold: 0.85,
  flaggedThreshold: 0.50,
  weights: DEFAULT_STAGE_B_WEIGHTS,
  normalizationPolicy: DEFAULT_NORMALIZATION_POLICY,
  ocrRepairThreshold: 0.2,
};

// =============================================================================
// AUTO-VERIFIER
// =============================================================================

export class AutoVerifier {
  private readonly config: ResolvedAutoVerifierConfig;

  constructor(config: AutoVerifierConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Verify a single QuoteSpan against its document's clean_text.
   *
   * If an ocrRepairRouter is configured and the span has high OCR risk,
   * attempts repair before Stage A. Original text is preserved in `span.text`;
   * repaired text is stored in `span.repaired_text`.
   *
   * @param span - The quote span to verify
   * @param cleanText - The document's clean_text
   * @param snapshot - Session-frozen canonical registry for deterministic scoring
   * @returns AutoVerificationResult with recommended status
   */
  async verify(
    span: QuoteSpan,
    cleanText: string,
    snapshot?: CanonicalRegistrySnapshot,
  ): Promise<AutoVerificationResult> {
    // OCR Repair step: if span has high OCR risk and router is available,
    // attempt character-level repair before verification
    const verifyText = await this.maybeRepairOCR(span, cleanText);

    // Stage A: deterministic structural checks (uses repaired text if available)
    const stageA = this.runStageA(verifyText, span, cleanText);

    // Stage B: multi-signal confidence score
    const stageBSignals = this.computeStageBSignals(span, cleanText, stageA, snapshot);
    const autoConfidence = this.computeAutoConfidence(stageBSignals);

    // Determine recommended status
    const recommendedStatus = this.determineStatus(stageA, autoConfidence);

    const reasoning = this.buildReasoning(stageA, stageBSignals, autoConfidence, recommendedStatus);

    return {
      stage_a: stageA,
      stage_b_signals: stageBSignals,
      auto_confidence: autoConfidence,
      recommended_status: recommendedStatus,
      reasoning,
    };
  }

  /**
   * Batch verify multiple spans for the same document.
   */
  async verifyBatch(
    spans: QuoteSpan[],
    cleanText: string,
    snapshot?: CanonicalRegistrySnapshot,
  ): Promise<Map<string, AutoVerificationResult>> {
    const results = new Map<string, AutoVerificationResult>();
    for (const span of spans) {
      results.set(span.quote_id, await this.verify(span, cleanText, snapshot));
    }
    return results;
  }

  /**
   * Apply verification results to spans, updating their status.
   */
  applyResults(
    spans: QuoteSpan[],
    results: Map<string, AutoVerificationResult>,
  ): void {
    for (const span of spans) {
      const result = results.get(span.quote_id);
      if (result) {
        span.verification_status = result.recommended_status;
        span.auto_confidence = result.auto_confidence;
      }
    }
  }

  // ===========================================================================
  // STAGE A — DETERMINISTIC STRUCTURAL CHECKS
  // ===========================================================================

  /**
   * Stage A: text-primary structural check.
   * Pass if exact/normalized substring match succeeds.
   * Anchors do NOT cause Stage A failure.
   *
   * @param quoteText - Text to match (repaired_text if available, else span.text)
   * @param span - The quote span (for metadata)
   * @param cleanText - The document's clean_text
   */
  private runStageA(quoteText: string, span: QuoteSpan, cleanText: string): StageAResult {
    const policy = this.config.normalizationPolicy;

    // Try exact match first
    if (cleanText.includes(quoteText)) {
      return {
        passed: true,
        match_type: 'exact',
        text_found_in_clean: true,
      };
    }

    // Try normalized match
    const normalizedQuote = normalizeText(quoteText, policy);
    const normalizedClean = normalizeText(cleanText, policy);

    if (normalizedClean.includes(normalizedQuote)) {
      return {
        passed: true,
        match_type: 'normalized',
        text_found_in_clean: true,
      };
    }

    // Try approximate match (allow minor differences)
    const approxResult = this.approximateMatch(quoteText, cleanText, policy);
    if (approxResult) {
      return {
        passed: true,
        match_type: 'approximate',
        text_found_in_clean: true,
      };
    }

    return {
      passed: false,
      match_type: 'none',
      text_found_in_clean: false,
    };
  }

  /**
   * Approximate matching: check if quote appears with minor edits.
   * Uses sliding window + Levenshtein-lite (character-level edit ratio).
   */
  private approximateMatch(
    quoteText: string,
    cleanText: string,
    policy: NormalizationPolicy,
  ): boolean {
    const normalized = normalizeText(quoteText, policy);
    const normalizedClean = normalizeText(cleanText, policy);

    if (normalized.length < 10) return false;

    // Sliding window: search for best match
    const windowSize = normalized.length;
    const maxEditRatio = 0.1; // Allow 10% character differences

    for (let i = 0; i <= normalizedClean.length - windowSize + 5; i++) {
      const window = normalizedClean.slice(i, i + windowSize);
      const editRatio = this.charEditRatio(normalized, window);
      if (editRatio <= maxEditRatio) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple character edit ratio (proportion of mismatches).
   */
  private charEditRatio(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 0;

    let mismatches = Math.abs(a.length - b.length);
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] !== b[i]) mismatches++;
    }

    return mismatches / maxLen;
  }

  // ===========================================================================
  // STAGE B — MULTI-SIGNAL CONFIDENCE
  // ===========================================================================

  /**
   * Compute Stage B signals.
   * All signals that reference global state use the session snapshot.
   */
  private computeStageBSignals(
    span: QuoteSpan,
    cleanText: string,
    stageA: StageAResult,
    snapshot?: CanonicalRegistrySnapshot,
  ): StageBSignals {
    // Exactness signal
    let exactness: number;
    switch (stageA.match_type) {
      case 'exact': exactness = 1.0; break;
      case 'normalized': exactness = 0.8; break;
      case 'approximate': exactness = 0.5; break;
      default: exactness = 0;
    }

    // OCR risk from scorecard
    const ocrRiskScore = span.provenance_scorecard.ocr_risk_score;

    // Quote length factor — derived, never stored
    const quoteLengthFactor = Math.min(1.0, span.text.length / 200);

    // Authority tier (normalized: tier 1 = 1.0, tier 5 = 0.0)
    const docAuthorityTier = Math.max(
      0,
      1 - (span.provenance_scorecard.doc_authority_tier - 1) / 4,
    );

    // Canonical overlap — from snapshot if available
    let canonicalOverlap = 0;
    if (snapshot && span.canonical_span_id) {
      const canonical = snapshot.verified_canonical_spans.get(span.canonical_span_id);
      if (canonical && VERIFIED_STATUSES.has(canonical.verification_status)) {
        canonicalOverlap = 1.0;
      }
    }

    // Anchor confidence
    let anchorConfidence = 0.5; // neutral if no anchor
    if (span.source_anchor) {
      anchorConfidence = 0.8; // has anchor = good
    }

    return {
      exactness,
      ocr_risk_score: ocrRiskScore,
      quote_length_factor: quoteLengthFactor,
      doc_authority_tier: docAuthorityTier,
      canonical_overlap: canonicalOverlap,
      anchor_confidence: anchorConfidence,
    };
  }

  /**
   * Compute auto_confidence from Stage B signals.
   */
  private computeAutoConfidence(signals: StageBSignals): number {
    const w = this.config.weights;

    return (
      signals.exactness * w.exactness +
      (1 - signals.ocr_risk_score) * w.ocr_risk_score +
      signals.quote_length_factor * w.quote_length_factor +
      signals.doc_authority_tier * w.doc_authority_tier +
      signals.canonical_overlap * w.canonical_overlap +
      signals.anchor_confidence * w.anchor_confidence
    );
  }

  /**
   * Determine verification status from Stage A + confidence.
   */
  private determineStatus(
    stageA: StageAResult,
    autoConfidence: number,
  ): VerificationStatus {
    if (!stageA.passed) {
      // Stage A failed → flagged or auto_rejected based on confidence
      if (autoConfidence < this.config.flaggedThreshold) {
        return 'auto_rejected';
      }
      return 'flagged';
    }

    // Stage A passed — check confidence threshold
    if (autoConfidence >= this.config.autoVerifyThreshold) {
      return 'auto_verified';
    }

    if (autoConfidence >= this.config.flaggedThreshold) {
      return 'flagged';
    }

    return 'auto_rejected';
  }

  // ===========================================================================
  // OCR REPAIR — Repair-then-Verify
  // ===========================================================================

  /**
   * Attempt OCR repair if the span has high OCR risk and a repair router is configured.
   * Returns the text to use for Stage A verification (repaired or original).
   *
   * The repair prompt is tightly constrained:
   * - Only fix character-level recognition errors
   * - Do NOT add information not in the original text
   * - Context is provided ONLY for character disambiguation (e.g., '1' vs 'l')
   * - Original text is always preserved in span.text for audit trail
   */
  private async maybeRepairOCR(span: QuoteSpan, cleanText: string): Promise<string> {
    const router = this.config.ocrRepairRouter;
    if (!router) return span.text;

    const ocrRisk = span.provenance_scorecard.ocr_risk_score;
    if (ocrRisk <= (this.config.ocrRepairThreshold ?? 0.2)) return span.text;

    // Already repaired in a previous pass
    if (span.repair_applied && span.repaired_text) return span.repaired_text;

    // Extract surrounding context for character disambiguation
    const [start, end] = span.clean_text_range;
    const contextBefore = cleanText.slice(Math.max(0, start - 120), start).trim();
    const contextAfter = cleanText.slice(end, end + 120).trim();

    try {
      const response = await router.call({
        systemPrompt: OCR_REPAIR_SYSTEM_PROMPT,
        userPrompt: buildOCRRepairPrompt(span.text, contextBefore, contextAfter),
        maxTokens: 500,
        temperature: 0.1, // Near-deterministic for repair
        costTier: 'low',  // vLLM-first — near-zero cost
        forceBackend: 'vllm', // Never use Anthropic for OCR repair
      });

      const repaired = response.content.trim();

      // Safety check: reject if repair changed more than 15% of characters
      // (indicates hallucination rather than character-level fix)
      if (this.repairDivergesTooMuch(span.text, repaired)) {
        return span.text;
      }

      // Store repaired text on span (original text preserved)
      span.repaired_text = repaired;
      span.repair_applied = true;

      return repaired;
    } catch {
      // Repair failure is non-fatal — fall back to original text
      return span.text;
    }
  }

  /**
   * Check if OCR repair diverged too much from original (hallucination guard).
   * Returns true if >15% of characters changed — indicates the LLM added
   * information rather than fixing recognition errors.
   */
  private repairDivergesTooMuch(original: string, repaired: string): boolean {
    if (repaired.length === 0) return true;

    const maxLen = Math.max(original.length, repaired.length);
    if (maxLen === 0) return false;

    // Length divergence check
    const lengthRatio = Math.abs(original.length - repaired.length) / maxLen;
    if (lengthRatio > 0.15) return true;

    // Character-level divergence check
    let mismatches = Math.abs(original.length - repaired.length);
    const minLen = Math.min(original.length, repaired.length);
    for (let i = 0; i < minLen; i++) {
      if (original[i] !== repaired[i]) mismatches++;
    }

    return (mismatches / maxLen) > 0.15;
  }

  // ===========================================================================
  // REASONING
  // ===========================================================================

  /**
   * Build human-readable reasoning string.
   */
  private buildReasoning(
    stageA: StageAResult,
    signals: StageBSignals,
    confidence: number,
    status: VerificationStatus,
  ): string {
    const parts: string[] = [];

    parts.push(`Stage A: ${stageA.passed ? 'PASS' : 'FAIL'} (${stageA.match_type} match)`);
    parts.push(`Confidence: ${(confidence * 100).toFixed(1)}%`);

    if (signals.ocr_risk_score > 0.3) {
      parts.push(`High OCR risk: ${(signals.ocr_risk_score * 100).toFixed(0)}%`);
    }
    if (signals.quote_length_factor < 0.3) {
      parts.push('Short quote (lower confidence)');
    }
    if (signals.canonical_overlap > 0) {
      parts.push('Overlaps previously verified canonical span');
    }

    parts.push(`Status: ${status}`);

    return parts.join('; ');
  }

  /**
   * Build reasoning string with optional repair info.
   */
  buildReasoningWithRepair(
    result: AutoVerificationResult,
    span: QuoteSpan,
  ): string {
    const base = result.reasoning;
    if (span.repair_applied && span.repaired_text) {
      return `OCR repaired (risk: ${(span.provenance_scorecard.ocr_risk_score * 100).toFixed(0)}%); ${base}`;
    }
    return base;
  }
}
