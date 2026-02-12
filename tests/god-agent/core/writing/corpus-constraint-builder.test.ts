/**
 * Tests for Corpus Constraint Builder (Phase 1: Hallucination Prevention)
 */

import { describe, it, expect } from 'vitest';
import {
  buildCorpusConstraint,
  loadCorpusManifest,
  validateCitation,
  type ContextChunk,
} from '../../../../src/god-agent/core/writing/corpus-constraint-builder.js';

describe('Corpus Constraint Builder', () => {
  describe('buildCorpusConstraint', () => {
    it('should build constraint from corpus chunks', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Phantasia is discussed in De Anima...',
          relevanceScore: 0.85,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'The Cognitive Role of Phantasia in Aristotle',
            page_start: 260,
            page_end: 280,
            docId: 'frede-1992',
          },
        },
        {
          content: 'Aristotle defines imagination...',
          relevanceScore: 0.9,
          metadata: {
            author: 'Caston, Victor',
            year: 1996,
            title: 'Why Aristotle Needs Imagination',
            page_start: 41,
            page_end: 60,
            docId: 'caston-1996',
          },
        },
      ];

      const constraint = buildCorpusConstraint(chunks);

      expect(constraint.sources.length).toBe(2);
      expect(constraint.enforcement).toBe('strict');
      expect(constraint.sources[0].citationKey).toContain('Caston');
      expect(constraint.sources[1].citationKey).toContain('Frede');
    });

    it('should merge page ranges from same source', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'First part of Frede...',
          relevanceScore: 0.8,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'The Cognitive Role of Phantasia',
            page_start: 260,
            page_end: 270,
            docId: 'frede-1992',
          },
        },
        {
          content: 'Second part of Frede...',
          relevanceScore: 0.75,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'The Cognitive Role of Phantasia',
            page_start: 275,
            page_end: 290,
            docId: 'frede-1992',
          },
        },
      ];

      const constraint = buildCorpusConstraint(chunks);

      expect(constraint.sources.length).toBe(1);
      expect(constraint.sources[0].author).toBe('Frede, Dorothea');
      // Should merge adjacent page ranges
      expect(constraint.sources[0].pages).toContain('260');
      expect(constraint.sources[0].pages).toContain('290');
    });

    it('should filter by minimum relevance', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'High relevance...',
          relevanceScore: 0.85,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'Phantasia Article',
            page_start: 260,
          },
        },
        {
          content: 'Low relevance...',
          relevanceScore: 0.3,
          metadata: {
            author: 'Smith, John',
            year: 2020,
            title: 'Some Other Article',
            page_start: 10,
          },
        },
      ];

      const constraint = buildCorpusConstraint(chunks, { minRelevance: 0.5 });

      expect(constraint.sources.length).toBe(1);
      expect(constraint.sources[0].author).toBe('Frede, Dorothea');
    });

    it('should include additional manual sources', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Chunk content...',
          relevanceScore: 0.8,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'Phantasia Article',
          },
        },
      ];

      const constraint = buildCorpusConstraint(chunks, {
        additionalSources: [
          {
            author: 'Nussbaum, Martha',
            year: 1978,
            title: 'The Role of Phantasia',
            citationKey: 'Nussbaum 1978',
          },
        ],
      });

      expect(constraint.sources.length).toBe(2);
      expect(constraint.sources.some(s => s.author === 'Nussbaum, Martha')).toBe(true);
    });

    it('should skip chunks without author/year', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Valid chunk...',
          relevanceScore: 0.8,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'Valid Article',
          },
        },
        {
          content: 'Invalid chunk without author...',
          relevanceScore: 0.9,
          metadata: {
            title: 'No Author',
            page_start: 10,
          },
        },
      ];

      const constraint = buildCorpusConstraint(chunks);

      expect(constraint.sources.length).toBe(1);
      expect(constraint.sources[0].author).toBe('Frede, Dorothea');
    });

    it('should set enforcement level correctly', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Content...',
          relevanceScore: 0.8,
          metadata: { author: 'Test', year: 2020, title: 'Test' },
        },
      ];

      const strictConstraint = buildCorpusConstraint(chunks, { enforcement: 'strict' });
      expect(strictConstraint.enforcement).toBe('strict');

      const warnConstraint = buildCorpusConstraint(chunks, { enforcement: 'warn' });
      expect(warnConstraint.enforcement).toBe('warn');
    });
  });

  describe('loadCorpusManifest', () => {
    it('should read real manifest.jsonl and return corpus sources', async () => {
      const sources = await loadCorpusManifest();

      // Real manifest has 48 entries with ~30 unique authors
      expect(sources.length).toBeGreaterThan(20);

      // Should include sources from the real manifest
      expect(sources.some(s => s.author === 'Aristotle')).toBe(true);
      expect(sources.some(s => s.author?.includes('Frede'))).toBe(true);

      // Should have citation keys
      expect(sources.every(s => s.citationKey)).toBe(true);

      // Should have docId from manifest entries
      expect(sources.some(s => s.docId)).toBe(true);
    });

    it('should filter by collection', async () => {
      const allSources = await loadCorpusManifest();
      const filteredSources = await loadCorpusManifest({ collections: ['rhetorical_ontology'] });

      // Filtered should be a subset
      expect(filteredSources.length).toBeLessThan(allSources.length);
      expect(filteredSources.length).toBeGreaterThan(0);

      // Should NOT contain metaphysics-only authors like Barnes, Kim, Horgan
      const filteredAuthors = filteredSources.map(s => s.author);
      expect(filteredAuthors.some(a => a?.includes('Barnes'))).toBe(false);
      expect(filteredAuthors.some(a => a?.includes('Kim'))).toBe(false);
    });

    it('should return empty array for non-existent manifest', async () => {
      const sources = await loadCorpusManifest({ manifestPath: '/non/existent/path.jsonl' });
      expect(sources).toEqual([]);
    });

    it('should deduplicate entries with same author+year+title', async () => {
      const sources = await loadCorpusManifest();
      const keys = sources.map(s => `${s.author}_${s.year}_${s.title}`);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe('corpus-only whitelist regression (Fix 26)', () => {
    it('whitelist should contain ONLY authors from retrieved chunks when additionalSources is empty', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Phantasia discussion...',
          relevanceScore: 0.85,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'The Cognitive Role of Phantasia in Aristotle',
            page_start: 260,
            page_end: 280,
          },
        },
        {
          content: 'Imagination in Aristotle...',
          relevanceScore: 0.9,
          metadata: {
            author: 'Caston, Victor',
            year: 1996,
            title: 'Why Aristotle Needs Imagination',
            page_start: 41,
            page_end: 60,
          },
        },
      ];

      // This is exactly what corpus-only mode does: additionalSources = []
      const constraint = buildCorpusConstraint(chunks, {
        enforcement: 'strict',
        additionalSources: [],
      });

      // Whitelist should be EXACTLY the retrieved chunk authors
      expect(constraint.sources.length).toBe(2);
      const authors = constraint.sources.map(s => s.author);
      expect(authors).toContain('Frede, Dorothea');
      expect(authors).toContain('Caston, Victor');

      // Must NOT contain any manifest-only authors
      expect(authors.some(a => a.includes('Aristotle'))).toBe(false);
      expect(authors.some(a => a.includes('Heidegger'))).toBe(false);
      expect(authors.some(a => a.includes('Bowin'))).toBe(false);
      expect(authors.some(a => a.includes('Nussbaum'))).toBe(false);
      expect(authors.some(a => a.includes('Rickert'))).toBe(false);
      expect(authors.some(a => a.includes('Gross'))).toBe(false);
    });
  });

  describe('validateCitation', () => {
    const testSources = [
      { author: 'Frede, Dorothea', year: 1992, title: 'The Cognitive Role', citationKey: 'Frede 1992' },
      { author: 'Caston, Victor', year: 1996, title: 'Why Aristotle Needs Imagination', citationKey: 'Caston 1996' },
      { author: 'Nussbaum, Martha', year: 1978, title: 'The Role of Phantasia', citationKey: 'Nussbaum 1978' },
    ];

    it('should validate correct author-year citation', () => {
      const result = validateCitation('Frede 1992', testSources);
      expect(result.valid).toBe(true);
      expect(result.matchedSource?.author).toBe('Frede, Dorothea');
    });

    it('should validate citation with page number', () => {
      const result = validateCitation('Frede, 285', testSources);
      expect(result.valid).toBe(true);
      expect(result.matchedSource?.author).toBe('Frede, Dorothea');
    });

    it('should validate parenthetical citation', () => {
      const result = validateCitation('(Caston 1996)', testSources);
      expect(result.valid).toBe(true);
      expect(result.matchedSource?.year).toBe(1996);
    });

    it('should reject hallucinated citation', () => {
      const result = validateCitation('Smith 2023', testSources);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No corpus source found');
    });

    it('should reject wrong year for correct author', () => {
      const result = validateCitation('Frede 2010', testSources);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No corpus source found');
    });

    it('should handle case-insensitive matching', () => {
      const result = validateCitation('FREDE 1992', testSources);
      expect(result.valid).toBe(true);
    });
  });
});
