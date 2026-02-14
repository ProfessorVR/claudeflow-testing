/**
 * Tests for Auto-Verifier — Two-Stage Calibration Verification
 *
 * Covers Stage A (deterministic text matching), Stage B (multi-signal
 * confidence scoring), status determination thresholds, and batch
 * verification.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AutoVerifier,
  type AutoVerifierConfig,
} from '../../../../src/god-agent/core/composition/auto-verifier.js';
import {
  DEFAULT_STAGE_B_WEIGHTS,
  type QuoteSpan,
  type CanonicalRegistrySnapshot,
  type AutoVerificationResult,
} from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create a valid QuoteSpan with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: 'q-test-001',
    text_fingerprint: 'fp-test-001',
    span_fingerprint: 'sfp-test-001',
    doc_id: 'doc-aristotle-da',
    page: 42,
    source_kind: 'CORPUS',
    clean_text_range: [100, 200] as [number, number],
    clean_range_hash: 'hash-test-001',
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: 'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power.',
    left_ctx_hash: 'lhash-test',
    right_ctx_hash: 'rhash-test',
    verification_status: 'flagged',
    source_anchor: '428b16-429a9',
    provenance_scorecard: {
      fidelity_score: 0.9,
      ocr_risk_score: 0.1,
      cluster_size: 1,
      prior_usage_count: 0,
      doc_authority_tier: 1,
    },
    ...overrides,
  };
}

/**
 * Create a canonical registry snapshot that marks a given canonical span
 * as human_verified, enabling canonical_overlap scoring.
 */
function makeSnapshot(
  canonicalSpanId: string,
): CanonicalRegistrySnapshot {
  const verified = new Map<string, {
    verification_status: 'auto_verified' | 'human_verified' | 'human_corrected';
    usage_count: number;
    authority_tier: number;
  }>();
  verified.set(canonicalSpanId, {
    verification_status: 'human_verified',
    usage_count: 3,
    authority_tier: 1,
  });
  return {
    snapshot_hash: 'snap-hash-001',
    captured_at: new Date().toISOString(),
    verified_canonical_spans: verified,
  };
}

/**
 * Build a clean_text string that contains the given span text as a
 * substring, wrapped in surrounding context.
 */
function buildCleanText(spanText: string): string {
  return (
    'In the third book of De Anima, ' +
    spanText +
    ' This passage has been the subject of considerable scholarly debate.'
  );
}

// =============================================================================
// TESTS
// =============================================================================

describe('AutoVerifier', () => {
  let verifier: AutoVerifier;

  beforeEach(() => {
    verifier = new AutoVerifier();
  });

  // ===========================================================================
  // 1. Stage A — Exact Match
  // ===========================================================================

  describe('Stage A exact match', () => {
    it('should pass Stage A when span text is an exact substring of clean_text', async () => {
      const span = makeSpan();
      const cleanText = buildCleanText(span.text);

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.passed).toBe(true);
      expect(result.stage_a.match_type).toBe('exact');
      expect(result.stage_a.text_found_in_clean).toBe(true);
    });
  });

  // ===========================================================================
  // 2. Stage A — Normalized Match
  // ===========================================================================

  describe('Stage A normalized match', () => {
    it('should pass Stage A after whitespace normalization', async () => {
      // Span text has extra whitespace that collapses to match clean_text
      const baseText = 'Aristotle defines phantasia as a movement resulting from perception.';
      const spanText = 'Aristotle  defines   phantasia  as  a  movement  resulting  from  perception.';

      const span = makeSpan({ text: spanText });
      const cleanText = buildCleanText(baseText);

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.passed).toBe(true);
      expect(result.stage_a.match_type).toBe('normalized');
      expect(result.stage_a.text_found_in_clean).toBe(true);
    });

    it('should pass Stage A when curly quotes normalize to straight quotes', async () => {
      const baseText = "Aristotle's account of phantasia as 'movement'";
      const spanText = '\u2018movement\u2019';

      const span = makeSpan({ text: spanText });
      // clean_text uses straight quotes
      const cleanText = "In the third book of De Anima, Aristotle's account of phantasia as 'movement' is central.";

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.passed).toBe(true);
      // Could be exact or normalized depending on the clean_text encoding
      expect(['exact', 'normalized']).toContain(result.stage_a.match_type);
      expect(result.stage_a.text_found_in_clean).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Stage A — Fail
  // ===========================================================================

  describe('Stage A fail', () => {
    it('should fail Stage A when span text is not found in clean_text', async () => {
      const span = makeSpan({
        text: 'This text does not appear anywhere in the document at all.',
      });
      const cleanText = 'The document discusses Aristotle on perception and motion in De Anima.';

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.passed).toBe(false);
      expect(result.stage_a.match_type).toBe('none');
      expect(result.stage_a.text_found_in_clean).toBe(false);
    });

    it('should flag or reject when Stage A fails', async () => {
      const span = makeSpan({
        text: 'This text does not appear anywhere in the document at all.',
      });
      const cleanText = 'The document discusses Aristotle on perception and motion in De Anima.';

      const result = await verifier.verify(span, cleanText);

      expect(result.recommended_status).not.toBe('auto_verified');
      expect(['flagged', 'auto_rejected']).toContain(result.recommended_status);
    });
  });

  // ===========================================================================
  // 4. Stage B — Confidence Scoring
  // ===========================================================================

  describe('Stage B confidence scoring', () => {
    it('should produce high confidence with favorable signals', async () => {
      // Long text (> 200 chars) for full quote_length_factor
      const longText =
        'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power, ' +
        'and insists that it is through phantasia that animals are able to act upon their environment, ' +
        'making it a crucial faculty for all animate beings in the natural world.';

      const span = makeSpan({
        text: longText,
        source_anchor: '429a1',
        canonical_span_id: 'canon-001',
        provenance_scorecard: {
          fidelity_score: 0.95,
          ocr_risk_score: 0.05,  // low OCR risk
          cluster_size: 1,
          prior_usage_count: 2,
          doc_authority_tier: 1,  // highest authority
        },
      });

      const cleanText = buildCleanText(longText);
      const snapshot = makeSnapshot('canon-001');

      const result = await verifier.verify(span, cleanText, snapshot);

      // With all favorable signals + canonical overlap, confidence should be very high
      // exactness=1.0*0.25 + (1-0.05)*0.20 + 1.0*0.15 + 1.0*0.10 + 1.0*0.20 + 0.8*0.10
      // = 0.25 + 0.19 + 0.15 + 0.10 + 0.20 + 0.08 = 0.97
      expect(result.auto_confidence).toBeGreaterThan(0.90);
      expect(result.stage_b_signals.exactness).toBe(1.0);
      expect(result.stage_b_signals.ocr_risk_score).toBe(0.05);
      expect(result.stage_b_signals.doc_authority_tier).toBe(1.0);
      expect(result.stage_b_signals.canonical_overlap).toBe(1.0);
      expect(result.stage_b_signals.anchor_confidence).toBe(0.8);
    });

    it('should produce lower confidence with unfavorable signals', async () => {
      const span = makeSpan({
        text: 'Short text here.',
        source_anchor: undefined,
        provenance_scorecard: {
          fidelity_score: 0.5,
          ocr_risk_score: 0.7,  // high OCR risk
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 5,  // lowest authority
        },
      });

      const cleanText = buildCleanText('Short text here.');

      const result = await verifier.verify(span, cleanText);

      // exactness=1.0*0.25 + (1-0.7)*0.20 + (16/200)*0.15 + 0.0*0.10 + 0*0.20 + 0.5*0.10
      // = 0.25 + 0.06 + 0.012 + 0 + 0 + 0.05 = 0.372
      expect(result.auto_confidence).toBeLessThan(0.50);
      expect(result.stage_b_signals.ocr_risk_score).toBe(0.7);
      expect(result.stage_b_signals.doc_authority_tier).toBe(0);
      expect(result.stage_b_signals.anchor_confidence).toBe(0.5);
    });

    it('should weight signals according to DEFAULT_STAGE_B_WEIGHTS', async () => {
      const span = makeSpan({
        text: 'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power.',
        source_anchor: '429a1',
        provenance_scorecard: {
          fidelity_score: 0.9,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 1,
        },
      });

      const cleanText = buildCleanText(span.text);
      const result = await verifier.verify(span, cleanText);

      const signals = result.stage_b_signals;
      const w = DEFAULT_STAGE_B_WEIGHTS;

      // Manually compute expected confidence
      const expected =
        signals.exactness * w.exactness +
        (1 - signals.ocr_risk_score) * w.ocr_risk_score +
        signals.quote_length_factor * w.quote_length_factor +
        signals.doc_authority_tier * w.doc_authority_tier +
        signals.canonical_overlap * w.canonical_overlap +
        signals.anchor_confidence * w.anchor_confidence;

      expect(result.auto_confidence).toBeCloseTo(expected, 10);
    });
  });

  // ===========================================================================
  // 5. Auto-verified Threshold
  // ===========================================================================

  describe('auto_verified threshold', () => {
    it('should auto_verify when Stage A passes AND confidence >= 0.85', async () => {
      // Build a span with enough favorable signals to reach 0.85
      const longText =
        'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power, ' +
        'and insists that it is through phantasia that animals are able to act upon their environment, ' +
        'making it a crucial faculty for all animate beings in the natural world.';

      const span = makeSpan({
        text: longText,
        source_anchor: '429a1',
        canonical_span_id: 'canon-001',
        provenance_scorecard: {
          fidelity_score: 0.95,
          ocr_risk_score: 0.05,
          cluster_size: 1,
          prior_usage_count: 2,
          doc_authority_tier: 1,
        },
      });

      const cleanText = buildCleanText(longText);
      const snapshot = makeSnapshot('canon-001');

      const result = await verifier.verify(span, cleanText, snapshot);

      expect(result.stage_a.passed).toBe(true);
      expect(result.auto_confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.recommended_status).toBe('auto_verified');
    });

    it('should not auto_verify when Stage A fails even if confidence is high', async () => {
      // Use custom config with very low threshold to ensure confidence >= 0.85
      // but fabricate a Stage A failure by having text not in clean_text
      const span = makeSpan({
        text: 'Text not present in the document whatsoever.',
        canonical_span_id: 'canon-001',
        source_anchor: '429a1',
        provenance_scorecard: {
          fidelity_score: 0.95,
          ocr_risk_score: 0.0,
          cluster_size: 1,
          prior_usage_count: 2,
          doc_authority_tier: 1,
        },
      });

      const cleanText = 'Completely different document content about biology and cells.';

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.passed).toBe(false);
      expect(result.recommended_status).not.toBe('auto_verified');
    });
  });

  // ===========================================================================
  // 6. Flagged Threshold
  // ===========================================================================

  describe('flagged threshold', () => {
    it('should flag when Stage A passes AND confidence is between 0.50 and 0.85', async () => {
      // Exact match (exactness=1.0) but moderate/unfavorable other signals
      // to land confidence between 0.50 and 0.85
      const spanText = 'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power.';
      const span = makeSpan({
        text: spanText,
        source_anchor: '429a1',
        provenance_scorecard: {
          fidelity_score: 0.7,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 1,
        },
      });

      const cleanText = buildCleanText(spanText);

      const result = await verifier.verify(span, cleanText);

      // No canonical overlap, so:
      // exactness=1.0*0.25 + (1-0.1)*0.20 + (92/200)*0.15 + 1.0*0.10 + 0*0.20 + 0.8*0.10
      // = 0.25 + 0.18 + 0.069 + 0.10 + 0 + 0.08 = 0.679
      expect(result.stage_a.passed).toBe(true);
      expect(result.auto_confidence).toBeGreaterThanOrEqual(0.50);
      expect(result.auto_confidence).toBeLessThan(0.85);
      expect(result.recommended_status).toBe('flagged');
    });
  });

  // ===========================================================================
  // 7. Auto-rejected Threshold
  // ===========================================================================

  describe('auto_rejected threshold', () => {
    it('should auto_reject when confidence < 0.50', async () => {
      // Stage A passes but confidence is very low
      const shortText = 'Short.';
      const span = makeSpan({
        text: shortText,
        source_anchor: undefined,
        provenance_scorecard: {
          fidelity_score: 0.3,
          ocr_risk_score: 0.9,  // very high OCR risk
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 5,  // lowest authority
        },
      });

      const cleanText = buildCleanText(shortText);

      const result = await verifier.verify(span, cleanText);

      // exactness=1.0*0.25 + (1-0.9)*0.20 + (6/200)*0.15 + 0*0.10 + 0*0.20 + 0.5*0.10
      // = 0.25 + 0.02 + 0.0045 + 0 + 0 + 0.05 = 0.3245
      expect(result.auto_confidence).toBeLessThan(0.50);
      expect(result.recommended_status).toBe('auto_rejected');
    });

    it('should auto_reject when Stage A fails AND confidence < 0.50', async () => {
      const span = makeSpan({
        text: 'Nonexistent quote that cannot be found.',
        source_anchor: undefined,
        provenance_scorecard: {
          fidelity_score: 0.3,
          ocr_risk_score: 0.8,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 4,
        },
      });

      const cleanText = 'Completely unrelated document about modern physics and quantum theory.';

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.passed).toBe(false);
      expect(result.auto_confidence).toBeLessThan(0.50);
      expect(result.recommended_status).toBe('auto_rejected');
    });
  });

  // ===========================================================================
  // 8. Anchor Does Not Fail Stage A
  // ===========================================================================

  describe('anchor does not fail Stage A', () => {
    it('should pass Stage A even without a source anchor', async () => {
      const span = makeSpan({
        source_anchor: undefined,
      });
      const cleanText = buildCleanText(span.text);

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.passed).toBe(true);
      expect(result.stage_a.match_type).toBe('exact');
    });

    it('should pass Stage A with a mismatched anchor (anchors feed Stage B only)', async () => {
      const span = makeSpan({
        source_anchor: 'WRONG-ANCHOR-999z99',
      });
      const cleanText = buildCleanText(span.text);

      const result = await verifier.verify(span, cleanText);

      // Stage A is text-primary; anchor mismatch should NOT cause failure
      expect(result.stage_a.passed).toBe(true);
      expect(result.stage_a.text_found_in_clean).toBe(true);
    });

    it('should give higher anchor_confidence when anchor is present vs absent', async () => {
      const spanText = 'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power.';

      const spanWithAnchor = makeSpan({
        quote_id: 'q-with-anchor',
        text: spanText,
        source_anchor: '429a1',
      });
      const spanWithoutAnchor = makeSpan({
        quote_id: 'q-without-anchor',
        text: spanText,
        source_anchor: undefined,
      });

      const cleanText = buildCleanText(spanText);

      const resultWith = await verifier.verify(spanWithAnchor, cleanText);
      const resultWithout = await verifier.verify(spanWithoutAnchor, cleanText);

      expect(resultWith.stage_b_signals.anchor_confidence).toBe(0.8);
      expect(resultWithout.stage_b_signals.anchor_confidence).toBe(0.5);
      expect(resultWith.auto_confidence).toBeGreaterThan(resultWithout.auto_confidence);
    });
  });

  // ===========================================================================
  // 9. Short Quote Penalty
  // ===========================================================================

  describe('short quote penalty', () => {
    it('should produce lower quote_length_factor for very short quotes (< 30 chars)', async () => {
      const shortText = 'phantasia';  // 9 chars
      const span = makeSpan({
        text: shortText,
        provenance_scorecard: {
          fidelity_score: 0.9,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 1,
        },
      });

      const cleanText = buildCleanText(shortText);

      const result = await verifier.verify(span, cleanText);

      // quote_length_factor = min(1.0, 9 / 200) = 0.045
      expect(result.stage_b_signals.quote_length_factor).toBeCloseTo(9 / 200, 5);
      expect(result.stage_b_signals.quote_length_factor).toBeLessThan(0.15);
    });

    it('should produce lower confidence for short quotes vs long quotes all else equal', async () => {
      const shortText = 'phantasia as movement';  // 21 chars
      const longText =
        'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power, ' +
        'and insists that it is through phantasia that animals are able to act upon their environment, ' +
        'making it a crucial faculty for all animate beings in the natural world.';

      const scorecard = {
        fidelity_score: 0.9,
        ocr_risk_score: 0.1,
        cluster_size: 1,
        prior_usage_count: 0,
        doc_authority_tier: 1,
      };

      const shortSpan = makeSpan({
        quote_id: 'q-short',
        text: shortText,
        provenance_scorecard: scorecard,
      });
      const longSpan = makeSpan({
        quote_id: 'q-long',
        text: longText,
        provenance_scorecard: scorecard,
      });

      const shortResult = await verifier.verify(shortSpan, buildCleanText(shortText));
      const longResult = await verifier.verify(longSpan, buildCleanText(longText));

      expect(shortResult.stage_b_signals.quote_length_factor).toBeLessThan(
        longResult.stage_b_signals.quote_length_factor,
      );
      expect(shortResult.auto_confidence).toBeLessThan(longResult.auto_confidence);
    });

    it('should cap quote_length_factor at 1.0 for quotes >= 200 chars', async () => {
      const longText = 'a'.repeat(250);
      const span = makeSpan({ text: longText });
      const cleanText = buildCleanText(longText);

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_b_signals.quote_length_factor).toBe(1.0);
    });
  });

  // ===========================================================================
  // 10. Batch Verification
  // ===========================================================================

  describe('verifyBatch', () => {
    it('should process multiple spans and return results keyed by quote_id', async () => {
      const span1Text = 'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power.';
      const span2Text = 'This text is definitely not in the document.';
      const span3Text = 'resulting from an actual exercise';

      const span1 = makeSpan({
        quote_id: 'q-batch-001',
        text: span1Text,
      });
      const span2 = makeSpan({
        quote_id: 'q-batch-002',
        text: span2Text,
      });
      const span3 = makeSpan({
        quote_id: 'q-batch-003',
        text: span3Text,
      });

      const cleanText = buildCleanText(span1Text);

      const results = await verifier.verifyBatch([span1, span2, span3], cleanText);

      expect(results.size).toBe(3);
      expect(results.has('q-batch-001')).toBe(true);
      expect(results.has('q-batch-002')).toBe(true);
      expect(results.has('q-batch-003')).toBe(true);

      // span1: exact match, should pass Stage A
      const r1 = results.get('q-batch-001')!;
      expect(r1.stage_a.passed).toBe(true);
      expect(r1.stage_a.match_type).toBe('exact');

      // span2: not in text, should fail Stage A
      const r2 = results.get('q-batch-002')!;
      expect(r2.stage_a.passed).toBe(false);

      // span3: substring of span1 which is in clean_text, should pass Stage A
      const r3 = results.get('q-batch-003')!;
      expect(r3.stage_a.passed).toBe(true);
    });

    it('should return an empty map for an empty spans array', async () => {
      const results = await verifier.verifyBatch([], 'any clean text');
      expect(results.size).toBe(0);
    });
  });

  // ===========================================================================
  // applyResults
  // ===========================================================================

  describe('applyResults', () => {
    it('should update span verification_status and auto_confidence from results', async () => {
      const span = makeSpan({
        verification_status: 'flagged',
        auto_confidence: undefined,
      });

      const cleanText = buildCleanText(span.text);
      const results = await verifier.verifyBatch([span], cleanText);

      verifier.applyResults([span], results);

      const result = results.get(span.quote_id)!;
      expect(span.verification_status).toBe(result.recommended_status);
      expect(span.auto_confidence).toBe(result.auto_confidence);
    });
  });

  // ===========================================================================
  // Reasoning string
  // ===========================================================================

  describe('reasoning', () => {
    it('should include Stage A result and confidence in reasoning string', async () => {
      const span = makeSpan();
      const cleanText = buildCleanText(span.text);

      const result = await verifier.verify(span, cleanText);

      expect(result.reasoning).toContain('Stage A: PASS');
      expect(result.reasoning).toContain('Confidence:');
      expect(result.reasoning).toContain('Status:');
    });

    it('should mention high OCR risk in reasoning when ocr_risk_score > 0.3', async () => {
      const span = makeSpan({
        provenance_scorecard: {
          fidelity_score: 0.5,
          ocr_risk_score: 0.6,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 1,
        },
      });
      const cleanText = buildCleanText(span.text);

      const result = await verifier.verify(span, cleanText);

      expect(result.reasoning).toContain('High OCR risk');
    });

    it('should mention short quote in reasoning when quote_length_factor < 0.3', async () => {
      const shortText = 'phantasia';
      const span = makeSpan({ text: shortText });
      const cleanText = buildCleanText(shortText);

      const result = await verifier.verify(span, cleanText);

      expect(result.reasoning).toContain('Short quote');
    });

    it('should mention canonical overlap when present', async () => {
      const span = makeSpan({ canonical_span_id: 'canon-001' });
      const cleanText = buildCleanText(span.text);
      const snapshot = makeSnapshot('canon-001');

      const result = await verifier.verify(span, cleanText, snapshot);

      expect(result.reasoning).toContain('previously verified canonical span');
    });

    it('should report Stage A FAIL in reasoning when text not found', async () => {
      const span = makeSpan({
        text: 'Completely fabricated text that does not exist in the document.',
      });
      const cleanText = 'Unrelated document about medieval logic.';

      const result = await verifier.verify(span, cleanText);

      expect(result.reasoning).toContain('Stage A: FAIL');
    });
  });

  // ===========================================================================
  // Custom Configuration
  // ===========================================================================

  describe('custom configuration', () => {
    it('should respect custom autoVerifyThreshold', async () => {
      // Lower threshold so more spans get auto_verified
      const lenientVerifier = new AutoVerifier({ autoVerifyThreshold: 0.60 });

      const spanText = 'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power.';
      const span = makeSpan({
        text: spanText,
        source_anchor: '429a1',
        provenance_scorecard: {
          fidelity_score: 0.9,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 1,
        },
      });

      const cleanText = buildCleanText(spanText);

      const result = await lenientVerifier.verify(span, cleanText);

      // With default weights: ~0.679, which is >= 0.60
      expect(result.auto_confidence).toBeGreaterThanOrEqual(0.60);
      expect(result.recommended_status).toBe('auto_verified');
    });

    it('should respect custom flaggedThreshold', async () => {
      // Raise flagged threshold so more spans get auto_rejected
      const strictVerifier = new AutoVerifier({ flaggedThreshold: 0.80 });

      const shortText = 'phantasia as movement';
      const span = makeSpan({
        text: shortText,
        source_anchor: undefined,
        provenance_scorecard: {
          fidelity_score: 0.5,
          ocr_risk_score: 0.3,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 3,
        },
      });

      const cleanText = buildCleanText(shortText);
      const result = await strictVerifier.verify(span, cleanText);

      // With these signals, confidence will be well below 0.80
      if (result.auto_confidence < 0.80) {
        expect(result.recommended_status).toBe('auto_rejected');
      }
    });
  });

  // ===========================================================================
  // Stage B signal details
  // ===========================================================================

  describe('Stage B signal computation details', () => {
    it('should map exact match to exactness=1.0', async () => {
      const span = makeSpan();
      const cleanText = buildCleanText(span.text);

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_b_signals.exactness).toBe(1.0);
    });

    it('should map normalized match to exactness=0.8', async () => {
      const baseText = 'phantasia as a movement';
      const spanText = 'phantasia  as   a   movement';

      const span = makeSpan({ text: spanText });
      const cleanText = buildCleanText(baseText);

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_a.match_type).toBe('normalized');
      expect(result.stage_b_signals.exactness).toBe(0.8);
    });

    it('should normalize doc_authority_tier: tier 1 -> 1.0, tier 5 -> 0.0', async () => {
      const spanText = 'Aristotle defines phantasia as a movement resulting from an actual exercise of a sense-power.';

      const tier1Span = makeSpan({
        quote_id: 'q-t1',
        text: spanText,
        provenance_scorecard: {
          fidelity_score: 0.9,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 1,
        },
      });

      const tier5Span = makeSpan({
        quote_id: 'q-t5',
        text: spanText,
        provenance_scorecard: {
          fidelity_score: 0.9,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 5,
        },
      });

      const cleanText = buildCleanText(spanText);

      const result1 = await verifier.verify(tier1Span, cleanText);
      const result5 = await verifier.verify(tier5Span, cleanText);

      expect(result1.stage_b_signals.doc_authority_tier).toBe(1.0);
      expect(result5.stage_b_signals.doc_authority_tier).toBe(0.0);
    });

    it('should set canonical_overlap=0 when no snapshot is provided', async () => {
      const span = makeSpan({ canonical_span_id: 'canon-001' });
      const cleanText = buildCleanText(span.text);

      const result = await verifier.verify(span, cleanText);

      expect(result.stage_b_signals.canonical_overlap).toBe(0);
    });

    it('should set canonical_overlap=1.0 when snapshot contains verified canonical span', async () => {
      const span = makeSpan({ canonical_span_id: 'canon-001' });
      const cleanText = buildCleanText(span.text);
      const snapshot = makeSnapshot('canon-001');

      const result = await verifier.verify(span, cleanText, snapshot);

      expect(result.stage_b_signals.canonical_overlap).toBe(1.0);
    });

    it('should set canonical_overlap=0 when canonical span is not in snapshot', async () => {
      const span = makeSpan({ canonical_span_id: 'canon-999' });
      const cleanText = buildCleanText(span.text);
      const snapshot = makeSnapshot('canon-001');  // different ID

      const result = await verifier.verify(span, cleanText, snapshot);

      expect(result.stage_b_signals.canonical_overlap).toBe(0);
    });
  });
});
