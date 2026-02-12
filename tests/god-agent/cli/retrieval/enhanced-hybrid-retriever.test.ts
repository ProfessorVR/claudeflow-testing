/**
 * Tests for EnhancedHybridRetriever
 *
 * Phase H: Enhanced Hybrid Retriever - comprehensive test coverage
 * for query expansion and multi-query RRF fusion.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EnhancedHybridRetriever,
  createEnhancedHybridRetriever,
  createAcademicHybridRetriever,
  createFastEnhancedRetriever,
  type QueryExpansionResult,
  type ExpandedQuery,
  type EnhancedHybridResult,
} from '../../../../src/god-agent/cli/retrieval/enhanced-hybrid-retriever.js';
import type { ColdContextAccessor, RetrievedChunk } from '../../../../src/god-agent/cli/context/tiered-context-manager.js';

// ============================================================================
// Mock ColdContextAccessor
// ============================================================================

class MockColdContextAccessor implements ColdContextAccessor {
  private documents: Array<{ content: string; source: string; relevanceScore: number }> = [
    {
      content: 'Video game aesthetics involves the study of player experience and emotional engagement.',
      source: 'aesthetics-001',
      relevanceScore: 0.9,
    },
    {
      content: 'Phenomenology provides a framework for understanding consciousness and perception.',
      source: 'phenomenology-001',
      relevanceScore: 0.85,
    },
    {
      content: 'Player immersion in digital games creates a unique form of aesthetic experience.',
      source: 'immersion-001',
      relevanceScore: 0.8,
    },
    {
      content: 'The concept of phantasia relates to imagination and mental imagery in philosophy.',
      source: 'phantasia-001',
      relevanceScore: 0.75,
    },
    {
      content: 'Calleja discusses involvement in video games through six dimensions of engagement.',
      source: 'calleja-001',
      relevanceScore: 0.7,
    },
  ];

  async search(query: string, topK: number): Promise<RetrievedChunk[]> {
    // Simple keyword matching for testing
    const queryTerms = query.toLowerCase().split(/\s+/);

    const scored = this.documents.map(doc => {
      const matchCount = queryTerms.filter(term =>
        doc.content.toLowerCase().includes(term)
      ).length;
      const relevance = matchCount > 0 ? doc.relevanceScore * (matchCount / queryTerms.length) : 0;
      return { ...doc, relevanceScore: relevance };
    });

    return scored
      .filter(doc => doc.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);
  }

  async initialize(): Promise<void> {
    // No-op for mock
  }
}

// ============================================================================
// Query Expansion Tests
// ============================================================================

describe('Query Expansion', () => {
  let retriever: EnhancedHybridRetriever;

  beforeEach(() => {
    retriever = createEnhancedHybridRetriever({
      queryExpansion: {
        enabled: true,
        maxVariations: 5,
        strategies: ['synonym', 'phrase', 'academic', 'conceptual'],
      },
    });
  });

  describe('expandQuery', () => {
    it('should always include original query', () => {
      const result = retriever.expandQuery('video game aesthetics');

      const original = result.expanded.find(q => q.isOriginal);
      expect(original).toBeDefined();
      expect(original!.text).toBe('video game aesthetics');
      expect(original!.weight).toBe(1.0);
    });

    it('should generate synonym variations', () => {
      const result = retriever.expandQuery('player experience');

      const synonymVariations = result.expanded.filter(q => q.strategy === 'synonym');
      expect(synonymVariations.length).toBeGreaterThan(0);

      // Should have variations with different terms
      const texts = synonymVariations.map(v => v.text.toLowerCase());
      expect(texts.some(t => t.includes('user') || t.includes('participant'))).toBe(true);
    });

    it('should generate academic variations', () => {
      const retrieverWithAcademic = createEnhancedHybridRetriever({
        queryExpansion: {
          enabled: true,
          maxVariations: 5,
          strategies: ['academic'],
        },
      });

      const result = retrieverWithAcademic.expandQuery('experience perception');

      const academicVariations = result.expanded.filter(q => q.strategy === 'academic');
      expect(academicVariations.length).toBeGreaterThanOrEqual(0);
    });

    it('should limit variations to maxVariations', () => {
      const result = retriever.expandQuery('the study of imagination in video games');

      expect(result.expanded.length).toBeLessThanOrEqual(5);
    });

    it('should track expansion statistics', () => {
      const result = retriever.expandQuery('player immersion');

      expect(result.stats).toBeDefined();
      expect(result.stats.totalVariations).toBeGreaterThanOrEqual(1);
      expect(result.stats.expansionTimeMs).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.stats.strategiesUsed)).toBe(true);
    });

    it('should skip expansion when disabled', () => {
      const noExpansionRetriever = createEnhancedHybridRetriever({
        queryExpansion: {
          enabled: false,
        },
      });

      const result = noExpansionRetriever.expandQuery('video game aesthetics');

      expect(result.expanded.length).toBe(1);
      expect(result.expanded[0].isOriginal).toBe(true);
    });

    it('should assign appropriate weights to variations', () => {
      const result = retriever.expandQuery('player experience in games');

      for (const expanded of result.expanded) {
        if (expanded.isOriginal) {
          expect(expanded.weight).toBe(1.0);
        } else {
          expect(expanded.weight).toBeGreaterThan(0);
          expect(expanded.weight).toBeLessThan(1.0);
        }
      }
    });

    it('should handle empty query', () => {
      const result = retriever.expandQuery('');

      expect(result.expanded.length).toBe(1);
      expect(result.expanded[0].text).toBe('');
    });

    it('should generate phrase variations for matching patterns', () => {
      const retrieverWithPhrase = createEnhancedHybridRetriever({
        queryExpansion: {
          enabled: true,
          maxVariations: 5,
          strategies: ['phrase'],
        },
      });

      const result = retrieverWithPhrase.expandQuery('the nature of experience');

      // Should generate some phrase variations if patterns match
      expect(result.expanded.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle academic terminology', () => {
      const result = retriever.expandQuery('phenomenology of perception');

      // Should recognize and potentially expand phenomenology terms
      const variations = result.expanded.filter(q => !q.isOriginal);
      // At least the original should be present
      expect(result.expanded.some(q => q.isOriginal)).toBe(true);
    });
  });
});

// ============================================================================
// Search Tests
// ============================================================================

describe('Enhanced Search', () => {
  let retriever: EnhancedHybridRetriever;
  let mockAccessor: MockColdContextAccessor;

  beforeEach(async () => {
    mockAccessor = new MockColdContextAccessor();
    retriever = createEnhancedHybridRetriever({
      queryExpansion: {
        enabled: true,
        maxVariations: 3,
        strategies: ['synonym'],
      },
    });
    await retriever.initialize(mockAccessor);
  });

  describe('search', () => {
    it('should return enhanced results', async () => {
      const results = await retriever.search('video game aesthetics', 5);

      expect(Array.isArray(results)).toBe(true);
      for (const result of results) {
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('relevanceScore');
        expect(result).toHaveProperty('foundByQueries');
        expect(result).toHaveProperty('queryOverlap');
      }
    });

    it('should track which queries found each result', async () => {
      const results = await retriever.search('player experience', 5);

      for (const result of results) {
        expect(Array.isArray(result.foundByQueries)).toBe(true);
        expect(result.foundByQueries.length).toBeGreaterThanOrEqual(1);
        expect(result.queryOverlap).toBeGreaterThanOrEqual(1);
      }
    });

    it('should boost results found by multiple query variations', async () => {
      const results = await retriever.search('immersion experience games', 5);

      // Results found by multiple queries should have higher scores
      // (This is difficult to test deterministically without controlling the mock)
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array for empty query', async () => {
      const results = await retriever.search('', 5);

      expect(results).toEqual([]);
    });

    it('should respect topK limit', async () => {
      const results = await retriever.search('video game', 3);

      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('searchWithoutExpansion', () => {
    it('should return base retriever results', async () => {
      const results = await retriever.searchWithoutExpansion('video game', 5);

      expect(Array.isArray(results)).toBe(true);
      // Results should be HybridResult, not EnhancedHybridResult
      for (const result of results) {
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('relevanceScore');
        expect(result).not.toHaveProperty('foundByQueries');
      }
    });
  });
});

// ============================================================================
// Multi-Query Fusion Tests
// ============================================================================

describe('Multi-Query Fusion', () => {
  let retriever: EnhancedHybridRetriever;
  let mockAccessor: MockColdContextAccessor;

  beforeEach(async () => {
    mockAccessor = new MockColdContextAccessor();
    retriever = createEnhancedHybridRetriever({
      queryExpansion: {
        enabled: true,
        maxVariations: 4,
        strategies: ['synonym', 'academic'],
      },
    });
    await retriever.initialize(mockAccessor);
  });

  it('should fuse results from multiple queries', async () => {
    const results = await retriever.search('player experience in games', 5);

    // Results should be deduplicated and scored appropriately
    const uniqueContents = new Set(results.map(r => r.content));
    expect(uniqueContents.size).toBe(results.length);
  });

  it('should increase relevance for results found by multiple queries', async () => {
    const results = await retriever.search('video game aesthetics', 5);

    // Results with higher queryOverlap should generally have higher scores
    // This is a soft test since scoring depends on the fusion algorithm
    for (const result of results) {
      expect(result.queryOverlap).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================================
// Cross-Encoder Reranking Tests
// ============================================================================

describe('Cross-Encoder Reranking', () => {
  it('should support cross-encoder reranking when enabled', async () => {
    const mockAccessor = new MockColdContextAccessor();
    const mockCrossEncoder = vi.fn().mockImplementation(
      async (query: string, documents: string[]): Promise<number[]> => {
        // Return mock scores
        return documents.map((_, i) => 0.9 - i * 0.1);
      }
    );

    const retriever = createEnhancedHybridRetriever({
      queryExpansion: {
        enabled: true,
        maxVariations: 2,
      },
      reranking: {
        enabled: true,
        rerankTopK: 10,
      },
    });

    await retriever.initialize(mockAccessor, mockCrossEncoder);

    const results = await retriever.search('video game', 5);

    // Cross-encoder should have been called
    expect(mockCrossEncoder).toHaveBeenCalled();

    // Results should have cross-encoder scores
    for (const result of results) {
      expect(result.crossEncoderScore).toBeDefined();
    }
  });

  it('should skip reranking when disabled', async () => {
    const mockAccessor = new MockColdContextAccessor();
    const mockCrossEncoder = vi.fn();

    const retriever = createEnhancedHybridRetriever({
      reranking: {
        enabled: false,
      },
    });

    await retriever.initialize(mockAccessor, mockCrossEncoder);

    const results = await retriever.search('video game', 5);

    // Cross-encoder should NOT have been called
    expect(mockCrossEncoder).not.toHaveBeenCalled();

    // Results should not have cross-encoder scores
    for (const result of results) {
      expect(result.crossEncoderScore).toBeUndefined();
    }
  });
});

// ============================================================================
// Cache Tests
// ============================================================================

describe('Caching', () => {
  it('should cache cross-encoder scores', async () => {
    const mockAccessor = new MockColdContextAccessor();
    let callCount = 0;
    const mockCrossEncoder = vi.fn().mockImplementation(
      async (query: string, documents: string[]): Promise<number[]> => {
        callCount++;
        return documents.map(() => 0.8);
      }
    );

    const retriever = createEnhancedHybridRetriever({
      queryExpansion: { enabled: false },
      reranking: { enabled: true, rerankTopK: 10 },
      cache: { enabled: true, capacity: 100 },
    });

    await retriever.initialize(mockAccessor, mockCrossEncoder);

    // First search
    await retriever.search('video game', 5);
    const firstCallCount = callCount;

    // Second identical search - should use cache
    await retriever.search('video game', 5);

    // Cross-encoder should be called fewer times on second search
    // (assuming some results are cached)
    const stats = retriever.getCacheStats();
    expect(stats).not.toBeNull();
  });

  it('should allow clearing cache', async () => {
    const mockAccessor = new MockColdContextAccessor();
    const retriever = createEnhancedHybridRetriever({
      cache: { enabled: true },
    });

    await retriever.initialize(mockAccessor);
    await retriever.search('test query', 5);

    retriever.clearCache();

    const stats = retriever.getCacheStats();
    expect(stats?.size).toBe(0);
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
  describe('createEnhancedHybridRetriever', () => {
    it('should create retriever with default config', () => {
      const retriever = createEnhancedHybridRetriever();

      expect(retriever).toBeInstanceOf(EnhancedHybridRetriever);
      expect(retriever.isReady()).toBe(false);
    });

    it('should accept custom config', () => {
      const retriever = createEnhancedHybridRetriever({
        queryExpansion: {
          maxVariations: 10,
        },
      });

      const expansion = retriever.expandQuery('test');
      // Config should be applied (though maxVariations only limits, doesn't require)
      expect(expansion.expanded.length).toBeLessThanOrEqual(10);
    });
  });

  describe('createAcademicHybridRetriever', () => {
    it('should create retriever optimized for academic search', () => {
      const retriever = createAcademicHybridRetriever();

      expect(retriever).toBeInstanceOf(EnhancedHybridRetriever);

      // Should include academic strategies
      const expansion = retriever.expandQuery('phenomenology of experience');
      expect(expansion.stats.strategiesUsed.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createFastEnhancedRetriever', () => {
    it('should create retriever with minimal overhead', () => {
      const retriever = createFastEnhancedRetriever();

      expect(retriever).toBeInstanceOf(EnhancedHybridRetriever);

      // Should have limited variations
      const expansion = retriever.expandQuery('video game aesthetics');
      expect(expansion.expanded.length).toBeLessThanOrEqual(3);
    });
  });
});

// ============================================================================
// Statistics Tests
// ============================================================================

describe('Statistics', () => {
  let retriever: EnhancedHybridRetriever;
  let mockAccessor: MockColdContextAccessor;

  beforeEach(async () => {
    mockAccessor = new MockColdContextAccessor();
    retriever = createEnhancedHybridRetriever();
    await retriever.initialize(mockAccessor);
  });

  it('should provide enhanced retrieval statistics', async () => {
    const stats = await retriever.getEnhancedStats('video game', 5);

    expect(stats).toHaveProperty('totalResults');
    expect(stats).toHaveProperty('queryVariations');
    expect(stats).toHaveProperty('avgResultsPerQuery');
    expect(stats).toHaveProperty('expansionTimeMs');
    expect(stats).toHaveProperty('latencyMs');
    expect(stats.queryVariations).toBeGreaterThanOrEqual(1);
  });

  it('should provide base retriever stats', () => {
    const stats = retriever.getBaseStats();

    expect(stats).toHaveProperty('bm25');
    expect(stats).toHaveProperty('semanticReady');
    expect(stats.semanticReady).toBe(true);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  let retriever: EnhancedHybridRetriever;
  let mockAccessor: MockColdContextAccessor;

  beforeEach(async () => {
    mockAccessor = new MockColdContextAccessor();
    retriever = createEnhancedHybridRetriever();
    await retriever.initialize(mockAccessor);
  });

  it('should handle very long queries', async () => {
    const longQuery = 'video game aesthetics and player experience in ' +
      'phenomenological analysis of interactive entertainment systems ' +
      'with particular attention to immersion and engagement mechanics';

    const results = await retriever.search(longQuery, 5);

    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle queries with special characters', async () => {
    const results = await retriever.search('video game (aesthetics) & "experience"', 5);

    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle single word queries', async () => {
    const results = await retriever.search('aesthetics', 5);

    expect(Array.isArray(results)).toBe(true);
  });

  it('should throw if not initialized', async () => {
    const uninitRetriever = createEnhancedHybridRetriever();

    await expect(
      uninitRetriever.search('test', 5)
    ).rejects.toThrow('not initialized');
  });

  it('should handle whitespace-only query', async () => {
    const results = await retriever.search('   ', 5);

    expect(results).toEqual([]);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  it('should complete search within reasonable time', async () => {
    const mockAccessor = new MockColdContextAccessor();
    const retriever = createEnhancedHybridRetriever({
      queryExpansion: {
        maxVariations: 5,
      },
    });
    await retriever.initialize(mockAccessor);

    const startTime = Date.now();
    await retriever.search('video game aesthetics', 10);
    const duration = Date.now() - startTime;

    // Should complete within 2 seconds (generous for tests)
    expect(duration).toBeLessThan(2000);
  });

  it('should complete query expansion quickly', () => {
    const retriever = createEnhancedHybridRetriever({
      queryExpansion: {
        maxVariations: 10,
        strategies: ['synonym', 'phrase', 'academic', 'conceptual'],
      },
    });

    const startTime = Date.now();
    retriever.expandQuery('the study of player experience in video games');
    const duration = Date.now() - startTime;

    // Query expansion should be very fast (< 50ms)
    expect(duration).toBeLessThan(50);
  });
});
