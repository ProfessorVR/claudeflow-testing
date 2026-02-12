/**
 * Regression guard tests for QuotationFidelityValidator.normalizeForLayout (clean_v1).
 *
 * These tests lock the TS normalization behavior at specific inputs
 * that exercise multiple steps (dehyphenation, whitespace collapse,
 * newline joining). A paired Python test exists in:
 *
 *   scripts/ingest/test_clean_regression.py
 *
 * Both implementations must produce identical output for the same input.
 * Any drift indicates the TS normalizeForLayout and Python clean_corpus_text
 * are diverging, which will cause false-negative fidelity scores.
 */

import { describe, it, expect } from 'vitest';
import { QuotationFidelityValidator } from '../../../../src/god-agent/core/writing/quotation-fidelity-validator.js';

const normalize = QuotationFidelityValidator.normalizeForLayout;

describe('normalizeForLayout regression guards', () => {
  it('multi-step: dehyphenation + whitespace collapse + newline joining', () => {
    // Fixture exercises three steps in sequence:
    //   1. Dehyphenation: environ-\nment → environment
    //   2. Newline joining: compresses\nof → compresses of
    //   3. Whitespace collapse: multiple spaces → single space
    //
    // Locks ordering: dehyphenation MUST fire before whitespace collapse
    // and newline joining.
    const raw = 'environ-\nment   compresses\nof the soul';
    const expected = 'environment compresses of the soul';
    expect(normalize(raw)).toBe(expected);
  });

  it('known-prefix dehyphenation keeps the hyphen', () => {
    // non-\nBeing → non-Being (NOT nonBeing)
    const raw = 'non-\nBeing is discussed';
    const result = normalize(raw);
    expect(result).toContain('non-Being');
    expect(result).not.toContain('-\n');
  });

  it('NBSP is converted to ASCII space', () => {
    const raw = 'the\u00a0soul\u00a0moves';
    const result = normalize(raw);
    expect(result).not.toContain('\u00a0');
    expect(result).toContain('the soul moves');
  });

  it('standalone locator lines are stripped', () => {
    const raw = 'First line\n  403b  \nSecond line';
    const result = normalize(raw);
    expect(result).not.toContain('403b');
    expect(result).toContain('First line');
    expect(result).toContain('Second line');
  });

  it('colon guard prevents joining', () => {
    // Lines ending with colon should NOT be joined to the next line
    const raw = 'The following:\nfirst item';
    const result = normalize(raw);
    // "following:first" should NOT appear (no join across colon)
    expect(result).not.toContain('following:first');
  });

  it('bullet guard prevents joining', () => {
    const raw = 'Introduction\n1. First point\n2. Second point';
    const result = normalize(raw);
    expect(result).toContain('1. First point');
    expect(result).toContain('2. Second point');
  });

  it('idempotence: normalizing twice produces same output', () => {
    const raw = 'environ-\nment   compresses\nof the soul';
    const once = normalize(raw);
    const twice = normalize(once);
    expect(once).toBe(twice);
  });
});
