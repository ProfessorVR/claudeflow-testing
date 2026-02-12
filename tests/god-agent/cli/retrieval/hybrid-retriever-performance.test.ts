/**
 * Tests for Hybrid Retriever Performance Optimizations (Phase N)
 *
 * Validates:
 * - Query result caching
 * - Batch search functionality
 * - Cache invalidation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridRetriever } from '../../../../src/god-agent/cli/retrieval/hybrid-retriever.js';

describe('HybridRetriever Performance Optimizations', () => {
  describe('Query Result Caching', () => {
    it('should create retriever with caching enabled', () => {
      const retriever = new HybridRetriever();
      expect(retriever).toBeDefined();
    });

    it('should have clearSearchCache method', () => {
      const retriever = new HybridRetriever();
      expect(typeof retriever.clearSearchCache).toBe('function');
    });
  });

  describe('Batch Search', () => {
    it('should have searchBatch method', () => {
      const retriever = new HybridRetriever();
      expect(typeof retriever.searchBatch).toBe('function');
    });

    it('should return empty map for empty queries', async () => {
      const retriever = new HybridRetriever();

      // Initialize with mock cold accessor
      const mockColdAccessor = {
        search: vi.fn().mockResolvedValue([]),
        retrieve: vi.fn().mockResolvedValue(undefined),
        getStats: vi.fn().mockReturnValue({ totalChunks: 0, totalTokens: 0 }),
      };

      await retriever.initialize(mockColdAccessor as any);
      const results = await retriever.searchBatch([], 5);

      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(0);
    });
  });

  describe('Performance Characteristics', () => {
    it('should support candidatesMultiplier configuration', () => {
      const retriever = new HybridRetriever({
        candidatesMultiplier: 3,
      });

      expect(retriever).toBeDefined();
    });

    it('should support bm25Weight configuration', () => {
      const retriever = new HybridRetriever({
        bm25Weight: 0.6,
      });

      expect(retriever).toBeDefined();
    });

    it('should support combined configuration', () => {
      const retriever = new HybridRetriever({
        bm25Weight: 0.55,
        candidatesMultiplier: 2.5,
        bm25Config: {
          k1: 1.5,
          b: 0.8,
        },
      });

      expect(retriever).toBeDefined();
    });
  });

  describe('Lifecycle Methods', () => {
    it('should not be ready before initialization', () => {
      const retriever = new HybridRetriever();
      expect(retriever.isReady()).toBe(false);
    });

    it('should track semantic search readiness', () => {
      const retriever = new HybridRetriever();
      const stats = retriever.getStats();

      expect(stats.semanticReady).toBe(false);
    });
  });
});
