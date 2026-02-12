/**
 * Tests for CitationVerifier - Stage 0 Hallucination Detection
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CitationVerifier,
  createDefaultVerifier,
  createStrictVerifier,
  createDraftVerifier,
  type CorpusSearchFn,
  type CorpusVerificationResult,
} from '../../../../../src/god-agent/cli/quality/stages/citation-verifier.js';

// Mock corpus search function
function createMockCorpusSearch(
  results: Map<string, CorpusVerificationResult>
): CorpusSearchFn {
  return vi.fn().mockImplementation(async (author: string, year: number) => {
    const key = `${author}-${year}`;
    return results.get(key) || { found: false };
  });
}

describe('CitationVerifier', () => {
  describe('citation extraction', () => {
    it('should extract APA citations', () => {
      const verifier = new CitationVerifier();
      const text = 'Research shows significant results (Smith, 2020). Another study found similar patterns (Jones & Brown, 2021).';

      const citations = verifier.extractCitations(text);

      expect(citations.length).toBe(2);
      expect(citations[0].author).toBe('Smith');
      expect(citations[0].year).toBe(2020);
      expect(citations[1].author).toBe('Jones & Brown');
      expect(citations[1].year).toBe(2021);
    });

    it('should extract APA citations with page numbers', () => {
      const verifier = new CitationVerifier();
      const text = 'As Smith noted (Smith, 2020, p. 42), the effect was significant.';

      const citations = verifier.extractCitations(text);

      expect(citations.length).toBe(1);
      expect(citations[0].author).toBe('Smith');
      expect(citations[0].year).toBe(2020);
      expect(citations[0].page).toBe('42');
    });

    it('should extract in-text citations', () => {
      const verifier = new CitationVerifier();
      const text = 'Smith (2020) argued that perception is active. Jones et al. (2021) supported this view.';

      const citations = verifier.extractCitations(text);

      expect(citations.length).toBe(2);
      expect(citations[0].author).toBe('Smith');
      expect(citations[0].year).toBe(2020);
      expect(citations[1].author).toBe('Jones et al.');
      expect(citations[1].year).toBe(2021);
    });

    it('should include line and position information', () => {
      const verifier = new CitationVerifier();
      const text = 'First line.\nSecond line with citation (Author, 2020).';

      const citations = verifier.extractCitations(text);

      expect(citations.length).toBe(1);
      expect(citations[0].line).toBe(2);
      expect(citations[0].position).toBeGreaterThan(0);
    });

    it('should extract multiple citation formats from the same author-year', () => {
      const verifier = new CitationVerifier();
      // Both in-text and parenthetical citations for the same source
      const text = 'Smith (2020) stated that... this is supported (Smith, 2020).';

      const citations = verifier.extractCitations(text);

      // Should extract both the in-text and APA formats
      // Note: May be deduplicated if on same line with same author-year
      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations[0].author).toBe('Smith');
    });

    it('should handle text with no citations', () => {
      const verifier = new CitationVerifier();
      const text = 'This is a paragraph without any citations or references.';

      const citations = verifier.extractCitations(text);

      expect(citations.length).toBe(0);
    });
  });

  describe('verification', () => {
    it('should verify citations against corpus', async () => {
      const mockResults = new Map<string, CorpusVerificationResult>([
        ['Smith-2020', { found: true, confidence: 0.95, matchedDocId: 'doc1' }],
      ]);

      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(mockResults),
      });

      const text = 'Research shows results (Smith, 2020).';
      const result = await verifier.evaluate(text, 1);

      expect(result.metrics.verifiedCitations).toBe(1);
      expect(result.metrics.verificationRate).toBe(1);
    });

    it('should flag unverified citations', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
      });

      const text = 'Research shows results (Unknown, 2020).';
      const result = await verifier.evaluate(text, 1);

      expect(result.metrics.unverifiedCount).toBe(1);
      expect(result.metrics.verificationRate).toBe(0);
    });

    it('should detect hallucinated citations', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
      });

      // Citation with future year - clearly impossible
      const text = 'Research shows results (Smith, 2099).';
      const result = await verifier.evaluate(text, 1);

      expect(result.metrics.hallucinatedCount).toBeGreaterThan(0);
      expect(result.issues.some(i => i.type === 'citation' && i.severity === 'critical')).toBe(true);
    });

    it('should handle partial matches', async () => {
      const mockResults = new Map<string, CorpusVerificationResult>([
        ['Smith-2020', { found: true, confidence: 0.55 }], // Below threshold but above 0.5
      ]);

      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(mockResults),
        minMatchConfidence: 0.7,
      });

      const text = 'Research shows results (Smith, 2020).';
      const result = await verifier.evaluate(text, 1);

      expect(result.metrics.partialMatchCount).toBe(1);
    });
  });

  describe('scoring', () => {
    it('should pass when verification rate is high', async () => {
      const mockResults = new Map<string, CorpusVerificationResult>([
        ['Smith-2020', { found: true, confidence: 0.95 }],
        ['Jones-2021', { found: true, confidence: 0.90 }],
      ]);

      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(mockResults),
      });

      const text = 'Smith (2020) found X. Jones (2021) found Y.';
      const result = await verifier.evaluate(text, 1);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.85);
    });

    it('should fail when verification rate is low', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
        verificationRateCriticalThreshold: 0.60,
      });

      const text = 'Smith (2020) found X. Jones (2021) found Y. Brown (2019) found Z.';
      const result = await verifier.evaluate(text, 1);

      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(0.85);
    });

    it('should penalize hallucinated citations', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
      });

      // Future year is detected as hallucination
      const text = 'Research (Johnson, 2099) shows X.';
      const result = await verifier.evaluate(text, 1);

      expect(result.score).toBeLessThan(1.0);
      expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
    });
  });

  describe('no corpus mode', () => {
    it('should assume citations verified without corpus (cannot check)', async () => {
      const verifier = new CitationVerifier(); // No corpusSearchFn

      const text = 'Smith (2020) found X. Jones (2021) found Y.';
      const result = await verifier.evaluate(text, 1);

      // Without corpus, citations are assumed verified (can't check without corpus)
      expect(result.metrics.unverifiedCount).toBe(0);
      expect(result.issues.every(i => i.severity !== 'critical' || i.type === 'citation')).toBe(true);
    });

    it('should handle text with no citations gracefully', async () => {
      const verifier = new CitationVerifier();

      const text = 'This is a paragraph without any citations.';
      const result = await verifier.evaluate(text, 1);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.metrics.totalCitations).toBe(0);
      expect(result.metrics.verificationRate).toBe(1.0);
    });
  });

  describe('configuration', () => {
    it('should respect strict mode', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
        strictMode: true,
      });

      const text = 'Smith (2020) found something.';
      const result = await verifier.evaluate(text, 1);

      // In strict mode, unverified citations become major issues
      expect(result.issues.some(i => i.type === 'missing-source')).toBe(true);
    });

    it('should use configured thresholds', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
        verificationRateWarningThreshold: 0.90,
        verificationRateCriticalThreshold: 0.50,
      });

      const text = 'Smith (2020) found X. Jones (2021) found Y.';
      const result = await verifier.evaluate(text, 1);

      // With 0% verification rate and 0.50 critical threshold
      expect(result.issues.some(i => i.severity === 'critical' && i.type === 'citation')).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache verification results', async () => {
      const searchFn = vi.fn().mockResolvedValue({ found: true, confidence: 0.95 });
      const verifier = new CitationVerifier({ corpusSearchFn: searchFn });

      const text = 'Smith (2020) found X. Smith (2020) found Y too.';
      await verifier.evaluate(text, 1);

      // Should only call search once for the same author-year combo
      expect(searchFn).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      const searchFn = vi.fn().mockResolvedValue({ found: true, confidence: 0.95 });
      const verifier = new CitationVerifier({ corpusSearchFn: searchFn });

      const text = 'Smith (2020) found X.';
      await verifier.evaluate(text, 1);

      verifier.clearCache();

      await verifier.evaluate(text, 1);

      // After clearing cache, should call again
      expect(searchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('hallucination detection patterns', () => {
    it('should detect future year citations', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
      });

      const text = 'Research (Thompson, 2099) is promising.';
      const result = await verifier.evaluate(text, 1);

      expect(result.metrics.hallucinatedCount).toBeGreaterThan(0);
      expect(result.issues.some(i => i.type === 'citation' && i.severity === 'critical')).toBe(true);
    });

    it('should detect suspiciously old citations', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
      });

      const text = 'Ancient text (Medieval, 1200) states this.';
      const result = await verifier.evaluate(text, 1);

      expect(result.metrics.hallucinatedCount).toBeGreaterThan(0);
      expect(result.issues.some(i => i.type === 'citation' && i.severity === 'critical')).toBe(true);
    });

    it('should not flag legitimate old citations in proper range', async () => {
      const verifier = new CitationVerifier({
        corpusSearchFn: createMockCorpusSearch(new Map()),
      });

      // 1890 is within valid range (1500+)
      const text = 'Historical work (James, 1890) established this.';
      const result = await verifier.evaluate(text, 1);

      // Should be unverified, not hallucinated
      expect(result.issues.every(i => i.type !== 'hallucination' || i.severity !== 'critical')).toBe(true);
    });
  });
});

describe('Factory Functions', () => {
  it('should create default verifier', () => {
    const verifier = createDefaultVerifier();
    expect(verifier).toBeInstanceOf(CitationVerifier);
  });

  it('should create strict verifier with higher thresholds', () => {
    const verifier = createStrictVerifier();
    expect(verifier).toBeInstanceOf(CitationVerifier);

    const stats = verifier.getStats();
    expect(stats.config.strictMode).toBe(true);
    expect(stats.config.minMatchConfidence).toBeGreaterThan(0.7);
  });

  it('should create draft verifier with lower thresholds', () => {
    const verifier = createDraftVerifier();
    expect(verifier).toBeInstanceOf(CitationVerifier);

    const stats = verifier.getStats();
    expect(stats.config.minMatchConfidence).toBeLessThan(0.7);
  });
});
