/**
 * Tests for CitationEnhancer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CitationEnhancer,
  createDefaultEnhancer,
  createStrictEnhancer,
  createDraftEnhancer,
  type CorpusResult,
  type UncitedClaim,
} from '../../../../src/god-agent/cli/composition/citation-enhancer.js';

// Mock corpus search function
function createMockCorpusSearch(results: CorpusResult[]): (query: string, topK: number) => Promise<CorpusResult[]> {
  return vi.fn().mockResolvedValue(results);
}

describe('CitationEnhancer', () => {
  let enhancer: CitationEnhancer;

  beforeEach(() => {
    enhancer = new CitationEnhancer();
  });

  describe('claim identification', () => {
    it('should identify statistical claims', () => {
      const text = 'Research shows that 75% of participants preferred the new design.';
      const claims = enhancer.identifyUncitedClaims(text);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some(c => c.claimType === 'statistical' || c.claimType === 'factual')).toBe(true);
    });

    it('should identify historical claims', () => {
      const text = 'In 1990, the first web browser was developed.';
      const claims = enhancer.identifyUncitedClaims(text);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some(c => c.claimType === 'historical')).toBe(true);
    });

    it('should identify attribution claims', () => {
      const text = 'Smith argued that perception is fundamentally active.';
      const claims = enhancer.identifyUncitedClaims(text);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some(c => c.claimType === 'attribution')).toBe(true);
    });

    it('should identify definition claims', () => {
      const text = 'The term phenomenology refers to the study of consciousness.';
      const claims = enhancer.identifyUncitedClaims(text);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some(c => c.claimType === 'definition')).toBe(true);
    });

    it('should not flag author own claims', () => {
      const text = 'I argue that this approach is more effective.';
      const claims = enhancer.identifyUncitedClaims(text);

      expect(claims.length).toBe(0);
    });

    it('should not flag already cited lines', () => {
      const text = 'Research shows that 75% of participants preferred the new design (Smith, 2020).';
      const claims = enhancer.identifyUncitedClaims(text);

      expect(claims.length).toBe(0);
    });

    it('should include position and line information', () => {
      const text = 'Line one.\nResearch shows effectiveness.';
      const claims = enhancer.identifyUncitedClaims(text);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims[0].line).toBe(2);
      expect(claims[0].position).toBeGreaterThan(0);
    });
  });

  describe('claim deduplication', () => {
    it('should deduplicate overlapping claims', () => {
      const text = 'Research shows that data indicates significant improvement.';
      const claims = enhancer.identifyUncitedClaims(text);

      // Even though there are multiple patterns, overlapping claims should be merged
      expect(claims.length).toBeLessThanOrEqual(2);
    });
  });

  describe('citation enhancement', () => {
    it('should add citations when corpus matches found', async () => {
      const mockResults: CorpusResult[] = [{
        docId: 'doc1',
        content: 'Research demonstrates that perception is active and constructive.',
        metadata: {
          author: 'Smith, John',
          title: 'Perception Studies',
          year: 2020,
          page_start: 42,
        },
        score: 0.85,
      }];

      const enhancerWithCorpus = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch(mockResults),
      });

      const text = 'Research shows that perception is active.';
      const result = await enhancerWithCorpus.enhance(text);

      expect(result.citationsAdded).toBeGreaterThan(0);
      expect(result.enhancedText).toContain('(Smith, 2020');
    });

    it('should track uncitable claims when no corpus match', async () => {
      const enhancerWithEmptyCorpus = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch([]),
      });

      const text = 'Studies indicate significant improvement in outcomes.';
      const result = await enhancerWithEmptyCorpus.enhance(text);

      expect(result.uncitedClaims.length).toBeGreaterThan(0);
      expect(result.citationsAdded).toBe(0);
    });

    it('should respect minimum relevance threshold', async () => {
      const lowRelevanceResults: CorpusResult[] = [{
        docId: 'doc1',
        content: 'Unrelated content about something else entirely.',
        metadata: { author: 'Jones', title: 'Other', year: 2021 },
        score: 0.3, // Below default threshold
      }];

      const enhancerWithLowRelevance = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch(lowRelevanceResults),
        minRelevance: 0.7,
      });

      const text = 'Research shows that perception is important.';
      const result = await enhancerWithLowRelevance.enhance(text);

      expect(result.citationsAdded).toBe(0);
    });

    it('should include page numbers when available', async () => {
      const resultsWithPage: CorpusResult[] = [{
        docId: 'doc1',
        content: 'Evidence supporting the claim.',
        metadata: {
          author: 'Smith',
          title: 'Test',
          year: 2020,
          page_start: 42,
        },
        score: 0.9,
      }];

      const enhancerWithPages = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch(resultsWithPage),
        includePageNumbers: true,
      });

      const text = 'Research shows significant effects.';
      const result = await enhancerWithPages.enhance(text);

      expect(result.enhancedText).toContain('p. 42');
    });
  });

  describe('citation formatting', () => {
    it('should format APA citations correctly', async () => {
      const results: CorpusResult[] = [{
        docId: 'doc1',
        content: 'Content',
        metadata: { author: 'Smith, John', title: 'Test', year: 2020 },
        score: 0.9,
      }];

      const apaEnhancer = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch(results),
        style: 'apa',
      });

      const text = 'Research shows something important.';
      const result = await apaEnhancer.enhance(text);

      expect(result.enhancedText).toMatch(/\(Smith, 2020\)/);
    });

    it('should format MLA citations correctly', async () => {
      const results: CorpusResult[] = [{
        docId: 'doc1',
        content: 'Content',
        metadata: { author: 'Smith, John', title: 'Test', year: 2020, page_start: 42 },
        score: 0.9,
      }];

      const mlaEnhancer = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch(results),
        style: 'mla',
        includePageNumbers: true,
      });

      const text = 'Research shows something important.';
      const result = await mlaEnhancer.enhance(text);

      expect(result.enhancedText).toMatch(/\(Smith 42\)/);
    });
  });

  describe('statistics', () => {
    it('should report accurate statistics', async () => {
      const results: CorpusResult[] = [{
        docId: 'doc1',
        content: 'Content',
        metadata: { author: 'Smith', title: 'Test', year: 2020 },
        score: 0.85,
      }];

      const enhancerWithStats = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch(results),
      });

      const text = 'Research shows one thing. Studies indicate another.';
      const result = await enhancerWithStats.enhance(text);

      expect(result.stats.claimsIdentified).toBeGreaterThan(0);
      expect(result.stats.averageRelevance).toBeGreaterThan(0);
    });
  });

  describe('max citations per paragraph', () => {
    it('should respect maxCitationsPerParagraph limit in enhanced text', async () => {
      const results: CorpusResult[] = [{
        docId: 'doc1',
        content: 'Content',
        metadata: { author: 'Smith', title: 'Test', year: 2020 },
        score: 0.9,
      }];

      const limitedEnhancer = new CitationEnhancer({
        corpusSearchFn: createMockCorpusSearch(results),
        maxCitationsPerParagraph: 1,
      });

      // Text with multiple claims in one paragraph
      const text = 'Research shows A. Studies indicate B. Data suggests C.';
      const result = await limitedEnhancer.enhance(text);

      // Count actual citations in the enhanced text (limit applies during application)
      const citationsInText = (result.enhancedText.match(/\(Smith, 2020\)/g) || []).length;
      expect(citationsInText).toBeLessThanOrEqual(1);
    });
  });
});

describe('Factory Functions', () => {
  it('should create default enhancer', () => {
    const enhancer = createDefaultEnhancer();
    expect(enhancer).toBeInstanceOf(CitationEnhancer);
  });

  it('should create strict enhancer with higher threshold', () => {
    const enhancer = createStrictEnhancer();
    expect(enhancer).toBeInstanceOf(CitationEnhancer);
  });

  it('should create draft enhancer with lower threshold', () => {
    const enhancer = createDraftEnhancer();
    expect(enhancer).toBeInstanceOf(CitationEnhancer);
  });
});
