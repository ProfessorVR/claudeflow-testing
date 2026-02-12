/**
 * Tests for HybridRetriever with Reciprocal Rank Fusion
 */

import { describe, it, expect, vi } from 'vitest';
import {
  HybridRetriever,
  createMockHybridRetriever,
  reciprocalRankFusion,
} from '../../../src/god-agent/retrieval/hybrid-retriever.js';
import type { ContextChunk } from '../../../src/god-agent/retrieval/types.js';

// Helper to create test chunks
function createTestChunks(prefix: string, count: number, startScore: number = 1): ContextChunk[] {
  return Array(count).fill(null).map((_, i) => ({
    chunkId: `${prefix}_${i}`,
    docId: `doc_${i}`,
    content: `${prefix} content ${i + 1}`,
    metadata: {
      author: 'Test Author',
      title: 'Test Title',
      year: 2024,
      page_start: i + 1,
      page_end: i + 1,
      collection: 'test',
    },
    relevanceScore: startScore - (i * 0.1),
  }));
}

describe('HybridRetriever', () => {
  describe('basic retrieval', () => {
    it('should return fused results from both retrievers', async () => {
      const semanticResults = createTestChunks('semantic', 5);
      const bm25Results = createTestChunks('bm25', 5);

      const retriever = new HybridRetriever(
        async () => semanticResults,
        async () => bm25Results
      );

      const { results, stats } = await retriever.retrieve('test query', 10);

      expect(results.length).toBeGreaterThan(0);
      expect(stats.semanticResults).toBe(5);
      expect(stats.bm25Results).toBe(5);
      expect(stats.usedRRF).toBe(true);
    });

    it('should call search functions with correct parameters', async () => {
      const semanticFn = vi.fn().mockResolvedValue([]);
      const bm25Fn = vi.fn().mockResolvedValue([]);

      const retriever = new HybridRetriever(semanticFn, bm25Fn);

      await retriever.retrieve('test query', 10);

      expect(semanticFn).toHaveBeenCalledWith('test query', 20); // topK * prefetch multiplier
      expect(bm25Fn).toHaveBeenCalledWith('test query', 20);
    });
  });

  describe('RRF fusion', () => {
    it('should rank items found in both retrievers higher', async () => {
      // Create overlapping results (chunk_0 is in both)
      const semanticResults: ContextChunk[] = [
        { chunkId: 'common', docId: 'doc1', content: 'Common result', metadata: { author: 'A', title: 'T', year: 2024, page_start: 1, page_end: 1, collection: 'test' }, relevanceScore: 0.9 },
        { chunkId: 'semantic_only', docId: 'doc2', content: 'Semantic only', metadata: { author: 'A', title: 'T', year: 2024, page_start: 1, page_end: 1, collection: 'test' }, relevanceScore: 0.8 },
      ];

      const bm25Results: ContextChunk[] = [
        { chunkId: 'common', docId: 'doc1', content: 'Common result', metadata: { author: 'A', title: 'T', year: 2024, page_start: 1, page_end: 1, collection: 'test' }, relevanceScore: 0.9 },
        { chunkId: 'bm25_only', docId: 'doc3', content: 'BM25 only', metadata: { author: 'A', title: 'T', year: 2024, page_start: 1, page_end: 1, collection: 'test' }, relevanceScore: 0.8 },
      ];

      const retriever = new HybridRetriever(
        async () => semanticResults,
        async () => bm25Results
      );

      const { results } = await retriever.retrieve('test', 10);

      // Common result should be ranked highest due to RRF
      expect(results[0].chunkId).toBe('common');
      expect(results[0].rrfScore).toBeDefined();
      expect(results[0].rrfScore!).toBeGreaterThan(results[1].rrfScore!);
    });

    it('should track source ranks', async () => {
      const semanticResults = createTestChunks('chunk', 3);
      const bm25Results = createTestChunks('chunk', 3); // Same IDs

      const retriever = new HybridRetriever(
        async () => semanticResults,
        async () => bm25Results
      );

      const { results } = await retriever.retrieve('test', 10);

      // First result should have source ranks from both
      expect(results[0].sourceRanks?.semantic).toBeDefined();
      expect(results[0].sourceRanks?.bm25).toBeDefined();
    });
  });

  describe('weighted fusion', () => {
    it('should use weighted averaging when RRF is disabled', async () => {
      const semanticResults = createTestChunks('semantic', 5);
      const bm25Results = createTestChunks('bm25', 5);

      const retriever = new HybridRetriever(
        async () => semanticResults,
        async () => bm25Results
      );

      const { results, stats } = await retriever.retrieve('test', 10, { useRRF: false });

      expect(stats.usedRRF).toBe(false);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('cross-encoder re-ranking', () => {
    it('should apply cross-encoder when provided', async () => {
      const semanticResults = createTestChunks('chunk', 3);
      const bm25Results = createTestChunks('chunk', 3);

      // Cross-encoder reverses the order
      const crossEncoderFn = vi.fn().mockImplementation(async (_query, chunks) => {
        return [...chunks].reverse();
      });

      const retriever = new HybridRetriever(
        async () => semanticResults,
        async () => bm25Results,
        crossEncoderFn
      );

      const { results, stats } = await retriever.retrieve('test', 3);

      expect(crossEncoderFn).toHaveBeenCalled();
      expect(stats.rerankTimeMs).toBeDefined();
    });

    it('should skip cross-encoder when rerank is false', async () => {
      const semanticResults = createTestChunks('chunk', 3);
      const bm25Results = createTestChunks('chunk', 3);

      const crossEncoderFn = vi.fn().mockResolvedValue([]);

      const retriever = new HybridRetriever(
        async () => semanticResults,
        async () => bm25Results,
        crossEncoderFn
      );

      await retriever.retrieve('test', 3, { rerank: false });

      expect(crossEncoderFn).not.toHaveBeenCalled();
    });
  });

  describe('query expansion', () => {
    it('should expand query when enabled', async () => {
      const semanticFn = vi.fn().mockResolvedValue([]);
      const bm25Fn = vi.fn().mockResolvedValue([]);

      const retriever = new HybridRetriever(semanticFn, bm25Fn);

      const { stats } = await retriever.retrieve('the quick brown fox jumps', 10, {
        queryExpansion: true,
      });

      // Should have query variants tracked
      expect(stats.queryVariants?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('stats reporting', () => {
    it('should report comprehensive statistics', async () => {
      const semanticResults = createTestChunks('semantic', 5);
      const bm25Results = createTestChunks('bm25', 5);

      const retriever = new HybridRetriever(
        async () => semanticResults,
        async () => bm25Results
      );

      const { stats } = await retriever.retrieve('test', 10);

      expect(stats.queryTimeMs).toBeGreaterThanOrEqual(0);
      expect(stats.semanticResults).toBe(5);
      expect(stats.bm25Results).toBe(5);
      expect(stats.fusedResults).toBeGreaterThan(0);
      expect(stats.usedRRF).toBe(true);
    });
  });
});

describe('createMockHybridRetriever', () => {
  it('should create a working mock retriever', async () => {
    const retriever = createMockHybridRetriever();

    const { results, stats } = await retriever.retrieve('test', 10);

    expect(results.length).toBeGreaterThan(0);
    expect(stats.semanticResults).toBeGreaterThan(0);
    expect(stats.bm25Results).toBeGreaterThan(0);
  });
});

describe('reciprocalRankFusion', () => {
  it('should fuse multiple result sets', () => {
    const set1 = [
      { id: 'a', score: 0.9 },
      { id: 'b', score: 0.8 },
      { id: 'c', score: 0.7 },
    ];

    const set2 = [
      { id: 'b', score: 0.9 },
      { id: 'd', score: 0.8 },
      { id: 'a', score: 0.7 },
    ];

    const fused = reciprocalRankFusion([set1, set2]);

    // Items in both sets should rank higher
    const topIds = fused.slice(0, 2).map(r => r.id);
    expect(topIds).toContain('a');
    expect(topIds).toContain('b');

    // All items should have RRF scores
    fused.forEach(item => {
      expect(item.rrfScore).toBeGreaterThan(0);
    });
  });

  it('should handle empty result sets', () => {
    const fused = reciprocalRankFusion([[], []]);
    expect(fused).toEqual([]);
  });

  it('should handle single result set', () => {
    const set1 = [
      { id: 'a', score: 0.9 },
      { id: 'b', score: 0.8 },
    ];

    const fused = reciprocalRankFusion([set1]);

    expect(fused.length).toBe(2);
    expect(fused[0].id).toBe('a'); // Higher rank = higher RRF
    expect(fused[0].rrfScore).toBeGreaterThan(fused[1].rrfScore);
  });

  it('should use custom k parameter', () => {
    const set1 = [{ id: 'a', score: 1 }];
    const set2 = [{ id: 'a', score: 1 }];

    // With k=1, RRF score = 1/(1+1) + 1/(1+1) = 1
    const fusedK1 = reciprocalRankFusion([set1, set2], 1);
    expect(fusedK1[0].rrfScore).toBeCloseTo(1.0, 1);

    // With k=60, RRF score = 1/(60+1) + 1/(60+1) ≈ 0.033
    const fusedK60 = reciprocalRankFusion([set1, set2], 60);
    expect(fusedK60[0].rrfScore).toBeLessThan(0.05);
  });
});
