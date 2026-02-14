/**
 * Tests for Quote Span Staleness Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StalenessEngine,
  normalizeText,
  sha256,
  computeTextFingerprint,
  computeSpanFingerprint,
  computeContextHash,
  rebaseOffset,
  rebaseRange,
  rangesIntersect,
} from '../../../../src/god-agent/core/composition/quote-span-staleness.js';
import {
  DEFAULT_NORMALIZATION_POLICY,
  type QuoteSpan,
  type OCRPatch,
  type IntervalEdit,
} from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: 'q1',
    text_fingerprint: 'fp1',
    span_fingerprint: 'sfp1',
    doc_id: 'doc1',
    page: 1,
    source_kind: 'CORPUS',
    clean_text_range: [100, 200] as [number, number],
    clean_range_hash: 'hash1',
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: 'Aristotle defines phantasia as a movement.',
    left_ctx_hash: 'lhash',
    right_ctx_hash: 'rhash',
    verification_status: 'auto_verified',
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

function makePatch(overrides: Partial<OCRPatch> = {}): OCRPatch {
  return {
    patch_id: 'p1',
    doc_id: 'doc1',
    page: 1,
    before_range: [50, 55] as [number, number],
    after_range: [50, 53] as [number, number],
    before_hash: 'bh1',
    after_hash: 'ah1',
    before_text: 'ﬁrst',
    after_text: 'first',
    reason_tag: 'ligature',
    timestamp: new Date().toISOString(),
    author: 'user',
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('Quote Span Staleness Engine', () => {

  describe('normalizeText', () => {
    it('should collapse whitespace', () => {
      const result = normalizeText('hello   world', DEFAULT_NORMALIZATION_POLICY);
      expect(result).toBe('hello world');
    });

    it('should normalize curly quotes', () => {
      const result = normalizeText('\u2018hello\u2019', DEFAULT_NORMALIZATION_POLICY);
      expect(result).toBe("'hello'");
    });

    it('should trim', () => {
      const result = normalizeText('  hello  ', DEFAULT_NORMALIZATION_POLICY);
      expect(result).toBe('hello');
    });
  });

  describe('sha256', () => {
    it('should produce consistent hashes', () => {
      const h1 = sha256('test');
      const h2 = sha256('test');
      expect(h1).toBe(h2);
    });

    it('should produce different hashes for different inputs', () => {
      const h1 = sha256('test1');
      const h2 = sha256('test2');
      expect(h1).not.toBe(h2);
    });
  });

  describe('computeTextFingerprint', () => {
    it('should be deterministic with same policy', () => {
      const fp1 = computeTextFingerprint('hello world', DEFAULT_NORMALIZATION_POLICY);
      const fp2 = computeTextFingerprint('hello world', DEFAULT_NORMALIZATION_POLICY);
      expect(fp1).toBe(fp2);
    });

    it('should normalize before hashing', () => {
      const fp1 = computeTextFingerprint('hello  world', DEFAULT_NORMALIZATION_POLICY);
      const fp2 = computeTextFingerprint('hello world', DEFAULT_NORMALIZATION_POLICY);
      expect(fp1).toBe(fp2);
    });
  });

  describe('computeSpanFingerprint', () => {
    it('should not include offsets', () => {
      // Two spans with same text but different positions should have same fingerprint
      // if doc_id, text_fingerprint, and context hashes match
      const fp1 = computeSpanFingerprint('doc1', 'tfp1', 'lhash', 'rhash');
      const fp2 = computeSpanFingerprint('doc1', 'tfp1', 'lhash', 'rhash');
      expect(fp1).toBe(fp2);
    });

    it('should differ when doc_id differs', () => {
      const fp1 = computeSpanFingerprint('doc1', 'tfp1', 'lhash', 'rhash');
      const fp2 = computeSpanFingerprint('doc2', 'tfp1', 'lhash', 'rhash');
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('rangesIntersect', () => {
    it('should detect overlapping ranges', () => {
      expect(rangesIntersect([0, 10], [5, 15])).toBe(true);
      expect(rangesIntersect([5, 15], [0, 10])).toBe(true);
    });

    it('should detect non-overlapping ranges', () => {
      expect(rangesIntersect([0, 10], [10, 20])).toBe(false);
      expect(rangesIntersect([0, 10], [15, 20])).toBe(false);
    });

    it('should detect containment', () => {
      expect(rangesIntersect([0, 20], [5, 15])).toBe(true);
      expect(rangesIntersect([5, 15], [0, 20])).toBe(true);
    });
  });

  describe('rebaseOffset', () => {
    it('should not change offset before edit', () => {
      const edits: IntervalEdit[] = [
        { epoch: 1, original_range: [100, 110], replacement_length: 8 },
      ];
      expect(rebaseOffset(50, edits, 0)).toBe(50);
    });

    it('should shift offset after edit', () => {
      const edits: IntervalEdit[] = [
        { epoch: 1, original_range: [100, 110], replacement_length: 8 },
      ];
      // Edit removed 2 chars (10 → 8), so offset 200 shifts by -2
      expect(rebaseOffset(200, edits, 0)).toBe(198);
    });

    it('should snap offset inside edit to edit start', () => {
      const edits: IntervalEdit[] = [
        { epoch: 1, original_range: [100, 110], replacement_length: 8 },
      ];
      expect(rebaseOffset(105, edits, 0)).toBe(100);
    });

    it('should skip edits at or before sinceEpoch', () => {
      const edits: IntervalEdit[] = [
        { epoch: 1, original_range: [100, 110], replacement_length: 8 },
      ];
      // Since epoch 1, should skip this edit
      expect(rebaseOffset(200, edits, 1)).toBe(200);
    });
  });

  describe('StalenessEngine', () => {
    let engine: StalenessEngine;

    beforeEach(() => {
      engine = new StalenessEngine();
    });

    describe('registerSpan', () => {
      it('should register span in locator', () => {
        const span = makeSpan();
        engine.registerSpan(span);

        const index = engine.getIndex('doc1');
        expect(index.span_locator.has('sfp1')).toBe(true);
      });
    });

    describe('markCandidatesOnPatchCommit', () => {
      it('should mark intersecting spans as candidates', () => {
        const span = makeSpan({ clean_text_range: [100, 200] });
        engine.registerSpan(span);

        const patch = makePatch({ before_range: [150, 160] });
        const delta = engine.markCandidatesOnPatchCommit('doc1', patch);

        expect(delta.new_candidates.has('sfp1')).toBe(true);
      });

      it('should not mark non-intersecting spans', () => {
        const span = makeSpan({ clean_text_range: [100, 200] });
        engine.registerSpan(span);

        const patch = makePatch({ before_range: [50, 55] });
        const delta = engine.markCandidatesOnPatchCommit('doc1', patch);

        expect(delta.new_candidates.has('sfp1')).toBe(false);
      });

      it('should increment patch epoch', () => {
        const patch = makePatch();
        engine.markCandidatesOnPatchCommit('doc1', patch);

        const index = engine.getIndex('doc1');
        expect(index.current_patch_epoch).toBe(1);
      });
    });

    describe('computeStaleness', () => {
      it('should not be stale when no patches exist', () => {
        const span = makeSpan();
        const cleanText = 'x'.repeat(300);

        const verdict = engine.computeStaleness(
          span,
          cleanText,
          DEFAULT_NORMALIZATION_POLICY,
        );

        expect(verdict.is_stale).toBe(false);
      });

      it('should be stale when range intersects patch', () => {
        const span = makeSpan({ clean_text_range: [100, 200], patch_epoch: 0 });
        engine.registerSpan(span);

        // Apply a patch that intersects the span
        const patch = makePatch({ before_range: [150, 160] });
        engine.markCandidatesOnPatchCommit('doc1', patch);

        const cleanText = 'x'.repeat(300);
        const verdict = engine.computeStaleness(
          span,
          cleanText,
          DEFAULT_NORMALIZATION_POLICY,
        );

        expect(verdict.is_stale).toBe(true);
        expect(verdict.reason).toBe('range_intersection');
      });
    });

    describe('locateSpan', () => {
      it('should find span at exact rebased position', () => {
        const text = 'Aristotle defines phantasia as a movement.';
        const fullText = 'Prefix text. ' + text + ' Suffix text.';
        const start = fullText.indexOf(text);

        const span = makeSpan({
          clean_text_range: [start, start + text.length],
          text,
          patch_epoch: 0,
        });

        const result = engine.locateSpan(
          'doc1',
          span,
          fullText,
          DEFAULT_NORMALIZATION_POLICY,
        );

        expect(result.found).toBe(true);
      });
    });

    describe('circuit breaker', () => {
      it('should mark all spans stale when threshold exceeded', () => {
        const lowThresholdEngine = new StalenessEngine({ circuitBreakerThreshold: 2 });

        // Register 3 spans all overlapping the patch range
        for (let i = 0; i < 3; i++) {
          lowThresholdEngine.registerSpan(
            makeSpan({
              span_fingerprint: `sfp${i}`,
              clean_text_range: [100, 200],
            }),
          );
        }

        const patch = makePatch({ before_range: [100, 200] });
        const delta = lowThresholdEngine.markCandidatesOnPatchCommit('doc1', patch);

        // All 3 should be candidates (circuit breaker)
        expect(delta.new_candidates.size).toBe(3);
      });
    });
  });

  describe('Fingerprint stability', () => {
    it('should produce identical span_fingerprint for identical extractions', () => {
      // Test 12g: same text → same span_fingerprint, different quote_id
      const fp1 = computeSpanFingerprint('doc1', 'tfp', 'lh', 'rh');
      const fp2 = computeSpanFingerprint('doc1', 'tfp', 'lh', 'rh');
      expect(fp1).toBe(fp2);
    });

    it('should change span_fingerprint when normalization policy changes', () => {
      // Test 12g: different normalization → different fingerprint
      const policy1 = DEFAULT_NORMALIZATION_POLICY;
      const policy2 = { ...DEFAULT_NORMALIZATION_POLICY, version: '2.0.0' };

      const tfp1 = computeTextFingerprint('hello', policy1);
      const tfp2 = computeTextFingerprint('hello', policy2);

      // Different policy SHA → different text fingerprint
      expect(tfp1).not.toBe(tfp2);
    });
  });
});
