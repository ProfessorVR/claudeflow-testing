/**
 * Tests for Citation Budget System (Phase 5: Citation Budget)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCitationBudget,
  calculateBudgetFromSources,
  suggestWordCount,
  assessContentLength,
  quickBudgetCheck,
} from '../../../../src/god-agent/core/writing/citation-budget.js';
import type { ContextChunk } from '../../../../src/god-agent/core/writing/corpus-constraint-builder.js';
import type { CorpusSource } from '../../../../src/god-agent/core/writing/writing-generator.js';

describe('Citation Budget System', () => {
  const createChunks = (count: number, sameSource = false): ContextChunk[] => {
    return Array.from({ length: count }, (_, i) => ({
      content: `Content from source ${sameSource ? 0 : i}`,
      relevanceScore: 0.8 + (i * 0.01),
      metadata: {
        author: sameSource ? 'Test, Author' : `Author${i}, Name`,
        year: 2020 + (sameSource ? 0 : i),
        title: `Article ${sameSource ? 0 : i}`,
        page_start: 100 + (i * 10),
        page_end: 110 + (i * 10),
      },
    }));
  };

  describe('calculateCitationBudget', () => {
    it('should calculate sufficient budget for adequate corpus', () => {
      // 10 unique sources * 2.5 citations/source = 25 citations
      // For 3000 words at 0.67 density = 20 citations needed
      const chunks = createChunks(10);

      const result = calculateCitationBudget(chunks, {
        targetWords: 3000,
        documentType: 'paper',
      });

      expect(result.sufficient).toBe(true);
      expect(result.deficit).toBe(0);
      expect(result.warning).toBeNull();
      expect(result.maxSupportableCitations).toBeGreaterThan(result.expectedCitations);
    });

    it('should detect deficit for insufficient corpus', () => {
      // 2 unique sources * 2.5 = 5 citations
      // For 3000 words at 0.67 = 20 citations needed
      const chunks = createChunks(2);

      const result = calculateCitationBudget(chunks, {
        targetWords: 3000,
        documentType: 'paper',
      });

      expect(result.sufficient).toBe(false);
      expect(result.deficit).toBeGreaterThan(0);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('deficit');
    });

    it('should merge chunks from same source', () => {
      // All 5 chunks from same source = 1 unique source * 2.5 = 2.5 citations
      const chunks = createChunks(5, true);

      const result = calculateCitationBudget(chunks, {
        targetWords: 1000,
        documentType: 'paper',
      });

      expect(result.breakdown.uniqueSources).toBe(1);
      expect(result.maxSupportableCitations).toBe(2); // floor(1 * 2.5)
    });

    it('should use document type densities', () => {
      const chunks = createChunks(10);

      const dissertationResult = calculateCitationBudget(chunks, {
        targetWords: 3000,
        documentType: 'dissertation',
      });

      const essayResult = calculateCitationBudget(chunks, {
        targetWords: 3000,
        documentType: 'essay',
      });

      // Dissertation has higher density (0.8) than essay (0.5)
      expect(dissertationResult.expectedCitations).toBeGreaterThan(essayResult.expectedCitations);
    });

    it('should provide recommendations when deficit exists', () => {
      const chunks = createChunks(2);

      const result = calculateCitationBudget(chunks, {
        targetWords: 3000,
        documentType: 'paper',
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('Retrieve'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('Reduce'))).toBe(true);
    });

    it('should handle empty chunks array', () => {
      const result = calculateCitationBudget([], {
        targetWords: 1000,
        documentType: 'paper',
      });

      expect(result.breakdown.uniqueSources).toBe(0);
      expect(result.maxSupportableCitations).toBe(0);
    });

    it('should include breakdown information', () => {
      const chunks = createChunks(5);

      const result = calculateCitationBudget(chunks, {
        targetWords: 2000,
        documentType: 'paper',
      });

      expect(result.breakdown.targetWords).toBe(2000);
      expect(result.breakdown.citationDensity).toBe(0.67);
      expect(result.breakdown.uniqueSources).toBe(5);
      expect(result.breakdown.citationsPerSource).toBe(2.5);
    });
  });

  describe('calculateBudgetFromSources', () => {
    it('should calculate budget from corpus sources array', () => {
      const sources: CorpusSource[] = [
        { author: 'Frede, Dorothea', year: 1992, title: 'Article 1', citationKey: 'Frede 1992' },
        { author: 'Caston, Victor', year: 1996, title: 'Article 2', citationKey: 'Caston 1996' },
        { author: 'Nussbaum, Martha', year: 1978, title: 'Article 3', citationKey: 'Nussbaum 1978' },
      ];

      const result = calculateBudgetFromSources(sources, {
        targetWords: 1000,
        documentType: 'paper',
      });

      expect(result.maxSupportableCitations).toBe(7); // 3 * 2.5 = 7.5, floor = 7
      expect(result.breakdown.uniqueSources).toBe(3);
    });

    it('should detect deficit from sources', () => {
      const sources: CorpusSource[] = [
        { author: 'Test, Author', year: 2020, title: 'Single Source', citationKey: 'Test 2020' },
      ];

      const result = calculateBudgetFromSources(sources, {
        targetWords: 3000,
        documentType: 'dissertation',
      });

      expect(result.sufficient).toBe(false);
      expect(result.warning).toContain('1 sources available');
    });
  });

  describe('suggestWordCount', () => {
    it('should suggest word count range for corpus', () => {
      const chunks = createChunks(10); // 10 unique sources

      const result = suggestWordCount(chunks, 'paper');

      expect(result.citationsSupported).toBe(25); // 10 * 2.5
      expect(result.optimal).toBeGreaterThan(result.minimum);
      expect(result.maximum).toBeGreaterThan(result.optimal);
    });

    it('should adjust for document type', () => {
      const chunks = createChunks(10);

      const dissertationResult = suggestWordCount(chunks, 'dissertation');
      const essayResult = suggestWordCount(chunks, 'essay');

      // Higher density means lower word count for same citations
      expect(dissertationResult.optimal).toBeLessThan(essayResult.optimal);
    });

    it('should handle empty corpus', () => {
      const result = suggestWordCount([], 'paper');

      expect(result.citationsSupported).toBe(0);
      expect(result.optimal).toBe(0);
    });
  });

  describe('assessContentLength', () => {
    it('should assess content as optimal', () => {
      const chunks = createChunks(10);
      // Optimal for 10 sources at paper density is ~3700 words
      const content = Array(3500).fill('word').join(' ');

      const result = assessContentLength(content, chunks, 'paper');

      expect(result.assessment).toBe('optimal');
      expect(result.recommendation).toBeNull();
    });

    it('should detect under-length content', () => {
      const chunks = createChunks(10);
      const content = Array(100).fill('word').join(' '); // Very short

      const result = assessContentLength(content, chunks, 'paper');

      expect(result.assessment).toBe('under');
      expect(result.recommendation).toContain('expanding');
    });

    it('should detect over-length content', () => {
      const chunks = createChunks(2); // Only 2 sources
      const content = Array(5000).fill('word').join(' '); // Too long for 2 sources

      const result = assessContentLength(content, chunks, 'paper');

      expect(result.assessment).toBe('over');
      expect(result.recommendation).toContain('Reduce');
    });

    it('should count words correctly', () => {
      const chunks = createChunks(10);
      const content = 'one two three four five';

      const result = assessContentLength(content, chunks, 'paper');

      expect(result.wordCount).toBe(5);
    });
  });

  describe('quickBudgetCheck', () => {
    it('should pass for adequate corpus', () => {
      // 20 chunks * 0.6 = 12 unique sources * 2.5 = 30 citations
      // 3000 words at 0.67 = 20 citations needed
      const result = quickBudgetCheck(3000, 20, 'paper');

      expect(result.passed).toBe(true);
      expect(result.warning).toBeNull();
      expect(result.deficit).toBe(0);
    });

    it('should fail for inadequate corpus', () => {
      // 5 chunks * 0.6 = 3 unique sources * 2.5 = 7 citations
      // 3000 words at 0.67 = 20 citations needed
      const result = quickBudgetCheck(3000, 5, 'paper');

      expect(result.passed).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.deficit).toBeGreaterThan(0);
    });

    it('should use document type density', () => {
      // Same corpus, different document types
      const dissertationResult = quickBudgetCheck(2000, 10, 'dissertation');
      const reportResult = quickBudgetCheck(2000, 10, 'report');

      // Dissertation requires more citations
      expect(dissertationResult.deficit).toBeGreaterThanOrEqual(reportResult.deficit);
    });

    it('should provide warning message with deficit info', () => {
      const result = quickBudgetCheck(5000, 3, 'paper');

      expect(result.warning).toContain('more citations');
      expect(result.warning).toContain('sources');
    });
  });
});
