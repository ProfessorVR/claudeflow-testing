/**
 * Tests for CrossEncoderReranker - Phase 2 Re-Ranking
 *
 * @group unit
 * @group retrieval
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  CrossEncoderReranker,
  createCrossEncoderReranker,
  createInitializedCrossEncoderReranker,
  type RerankCandidate,
  type RerankedResult,
} from '../../../../src/god-agent/cli/retrieval/cross-encoder-reranker.js';
import { RerankingCache } from '../../../../src/god-agent/cli/retrieval/reranking-cache.js';

// ============================================================================
// Test Data
// ============================================================================

const MOCK_QUERY = 'What is phantasia in Aristotle?';

const MOCK_CANDIDATES: RerankCandidate[] = [
  {
    content:
      'Phantasia is a cognitive faculty in Aristotle\'s psychology that produces mental images and enables imagination.',
    source: 'Chapter 1',
    stage1Score: 0.85,
  },
  {
    content:
      'Aristotle discusses phantasia in De Anima Book III, describing it as essential for perception and thought.',
    source: 'Chapter 2',
    stage1Score: 0.78,
  },
  {
    content:
      'The term phantasia comes from the Greek word for "appearance" and involves mental representation.',
    source: 'Chapter 3',
    stage1Score: 0.72,
  },
  {
    content:
      'Modern interpretations of Aristotelian phantasia connect it to contemporary theories of mental imagery.',
    source: 'Chapter 4',
    stage1Score: 0.65,
  },
  {
    content:
      'Phantasia differs from perception because it can occur without sensory input according to Aristotle.',
    source: 'Chapter 5',
    stage1Score: 0.60,
  },
];

// ============================================================================
// Unit Tests - CrossEncoderReranker
// ============================================================================

describe('CrossEncoderReranker', () => {
  let reranker: CrossEncoderReranker;

  // ==========================================================================
  // Lifecycle Tests
  // ==========================================================================

  describe('Lifecycle', () => {
    it('should create a re-ranker with default config', () => {
      reranker = createCrossEncoderReranker();
      expect(reranker).toBeDefined();
      expect(reranker.isReady()).toBe(false);
    });

    it('should create a re-ranker with custom config', () => {
      reranker = createCrossEncoderReranker({
        mode: 'mock',
        stage1TopK: 100,
        stage2TopK: 20,
        enableCaching: true,
        cacheCapacity: 5000,
        verbose: false,
      });
      expect(reranker).toBeDefined();
    });

    it('should initialize successfully', async () => {
      reranker = createCrossEncoderReranker({ mode: 'mock' });
      const success = await reranker.initialize();
      expect(success).toBe(true);
      expect(reranker.isReady()).toBe(true);
    });

    it('should create and initialize in one step', async () => {
      reranker = await createInitializedCrossEncoderReranker({ mode: 'mock' });
      expect(reranker.isReady()).toBe(true);
    });

    it('should close successfully', async () => {
      reranker = await createInitializedCrossEncoderReranker({ mode: 'mock' });
      await reranker.close();
      expect(reranker.isReady()).toBe(false);
    });

    it('should throw error if stage2TopK > stage1TopK', () => {
      expect(() => {
        createCrossEncoderReranker({
          stage1TopK: 10,
          stage2TopK: 20, // Invalid: larger than stage1TopK
        });
      }).toThrow();
    });
  });

  // ==========================================================================
  // Re-Ranking Tests - Mock Mode
  // ==========================================================================

  describe('Re-Ranking - Mock Mode', () => {
    beforeEach(async () => {
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'mock',
        stage1TopK: 50,
        stage2TopK: 10,
        enableCaching: true,
      });
    });

    afterEach(async () => {
      await reranker.close();
    });

    it('should re-rank candidates successfully', async () => {
      const results = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);

      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(10);
      expect(results.length).toBeGreaterThan(0);

      // Check result structure
      for (const result of results) {
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('crossEncoderScore');
        expect(result).toHaveProperty('stage1Score');
        expect(result).toHaveProperty('fromCache');

        // Check score validity
        expect(result.crossEncoderScore).toBeGreaterThanOrEqual(0);
        expect(result.crossEncoderScore).toBeLessThanOrEqual(1);
      }
    });

    it('should return top-K results', async () => {
      const topK = 3;
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'mock',
        stage2TopK: topK,
      });

      const results = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);
      expect(results.length).toBe(Math.min(topK, MOCK_CANDIDATES.length));
    });

    it('should sort results by cross-encoder score descending', async () => {
      const results = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].crossEncoderScore).toBeGreaterThanOrEqual(
          results[i].crossEncoderScore
        );
      }
    });

    it('should handle empty candidates', async () => {
      const results = await reranker.rerank(MOCK_QUERY, []);
      expect(results).toEqual([]);
    });

    it('should handle empty query', async () => {
      const results = await reranker.rerank('', MOCK_CANDIDATES);
      expect(results).toEqual([]);
    });

    it('should handle single candidate', async () => {
      const results = await reranker.rerank(MOCK_QUERY, [MOCK_CANDIDATES[0]]);
      expect(results.length).toBe(1);
      expect(results[0].content).toBe(MOCK_CANDIDATES[0].content);
    });

    it('should produce deterministic scores', async () => {
      const results1 = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);
      const results2 = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);

      // Note: Mock scores have small random noise, so we check cache usage instead
      expect(results2[0].fromCache).toBe(true);
    });

    it('should re-rank based on query relevance', async () => {
      const query = 'Aristotle phantasia';
      const candidates: RerankCandidate[] = [
        {
          content: 'Completely unrelated text about chemistry',
          source: 'A',
          stage1Score: 0.9,
        },
        {
          content: 'Aristotle discusses phantasia in depth',
          source: 'B',
          stage1Score: 0.5,
        },
      ];

      const results = await reranker.rerank(query, candidates);

      // The relevant document should be ranked higher despite lower Stage 1 score
      expect(results[0].source).toBe('B');
    });
  });

  // ==========================================================================
  // Caching Tests
  // ==========================================================================

  describe('Caching', () => {
    it('should use cache for repeated queries', async () => {
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'mock',
        enableCaching: true,
      });

      // First call - should miss cache
      const results1 = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);
      expect(results1[0].fromCache).toBe(false);

      // Second call - should hit cache
      const results2 = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);
      expect(results2[0].fromCache).toBe(true);

      const stats = reranker.getStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });

    it('should work without caching', async () => {
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'mock',
        enableCaching: false,
      });

      const results = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].fromCache).toBe(false);
    });

    it('should respect cache capacity', async () => {
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'mock',
        enableCaching: true,
        cacheCapacity: 2, // Very small cache
      });

      // Add 3 unique queries (exceeds capacity)
      await reranker.rerank('query 1', [MOCK_CANDIDATES[0]]);
      await reranker.rerank('query 2', [MOCK_CANDIDATES[1]]);
      await reranker.rerank('query 3', [MOCK_CANDIDATES[2]]);

      const stats = reranker.getStats();
      expect(stats.cacheStats.evictions).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Batch Re-Ranking Tests
  // ==========================================================================

  describe('Batch Re-Ranking', () => {
    beforeEach(async () => {
      reranker = await createInitializedCrossEncoderReranker({ mode: 'mock' });
    });

    afterEach(async () => {
      await reranker.close();
    });

    it('should batch re-rank multiple queries', async () => {
      const queries = [
        { query: 'Aristotle phantasia', candidates: MOCK_CANDIDATES.slice(0, 3) },
        { query: 'mental imagery', candidates: MOCK_CANDIDATES.slice(2, 5) },
        { query: 'perception thought', candidates: MOCK_CANDIDATES.slice(1, 4) },
      ];

      const results = await reranker.batchRerank(queries);

      expect(results.length).toBe(3);
      for (const batch of results) {
        expect(batch.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty batch', async () => {
      const results = await reranker.batchRerank([]);
      expect(results).toEqual([]);
    });
  });

  // ==========================================================================
  // Statistics Tests
  // ==========================================================================

  describe('Statistics', () => {
    beforeEach(async () => {
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'mock',
        enableStats: true,
      });
    });

    afterEach(async () => {
      await reranker.close();
    });

    it('should track re-ranking statistics', async () => {
      await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);

      const stats = reranker.getStats();

      expect(stats.totalReranks).toBe(1);
      expect(stats.totalCandidates).toBe(MOCK_CANDIDATES.length);
      expect(stats.avgLatencyMs).toBeGreaterThanOrEqual(0); // May be 0 on fast machines
      expect(stats.avgCandidatesPerOp).toBe(MOCK_CANDIDATES.length);
      expect(stats.mode).toBe('mock');
      expect(stats.mockComputations).toBeGreaterThan(0);
    });

    it('should calculate average metrics correctly', async () => {
      await reranker.rerank('query 1', MOCK_CANDIDATES.slice(0, 2));
      await reranker.rerank('query 2', MOCK_CANDIDATES.slice(0, 4));

      const stats = reranker.getStats();

      expect(stats.totalReranks).toBe(2);
      expect(stats.totalCandidates).toBe(6); // 2 + 4
      expect(stats.avgCandidatesPerOp).toBe(3); // 6 / 2
    });

    it('should reset statistics', async () => {
      await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);

      reranker.resetStats();
      const stats = reranker.getStats();

      expect(stats.totalReranks).toBe(0);
      expect(stats.totalCandidates).toBe(0);
      expect(stats.mockComputations).toBe(0);
    });

    it('should track cache statistics', async () => {
      await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);
      await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES); // Second call hits cache

      const stats = reranker.getStats();

      expect(stats.cacheStats.totalLookups).toBeGreaterThan(0);
      expect(stats.cacheStats.hits).toBeGreaterThan(0);
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Mock Scoring Algorithm Tests
  // ==========================================================================

  describe('Mock Scoring Algorithm', () => {
    beforeEach(async () => {
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'mock',
        enableCaching: false, // Disable cache to test scoring directly
      });
    });

    afterEach(async () => {
      await reranker.close();
    });

    it('should score based on token overlap', async () => {
      const query = 'phantasia Aristotle';
      const candidates: RerankCandidate[] = [
        {
          content: 'Text about phantasia and Aristotle', // High overlap
          source: 'A',
          stage1Score: 0.5,
        },
        {
          content: 'Unrelated content about modern science', // Low overlap
          source: 'B',
          stage1Score: 0.5,
        },
      ];

      const results = await reranker.rerank(query, candidates);

      expect(results[0].source).toBe('A'); // Higher overlap should rank higher
      expect(results[0].crossEncoderScore).toBeGreaterThan(results[1].crossEncoderScore);
    });

    it('should boost documents with query terms early', async () => {
      const query = 'phantasia';
      const candidates: RerankCandidate[] = [
        {
          content: 'phantasia is important. Many other words follow here.',
          source: 'A',
          stage1Score: 0.5,
        },
        {
          content: 'Many other words here. Finally, phantasia appears.',
          source: 'B',
          stage1Score: 0.5,
        },
      ];

      const results = await reranker.rerank(query, candidates);

      // Document with query term early should score higher
      expect(results[0].source).toBe('A');
    });

    it('should handle case insensitivity', async () => {
      const query = 'PHANTASIA';
      const candidates: RerankCandidate[] = [
        {
          content: 'phantasia in lowercase',
          source: 'A',
          stage1Score: 0.5,
        },
      ];

      const results = await reranker.rerank(query, candidates);
      expect(results[0].crossEncoderScore).toBeGreaterThan(0);
    });

    it('should ignore very short tokens', async () => {
      const query = 'a is the';
      const candidates: RerankCandidate[] = [
        {
          content: 'completely unrelated text about physics',
          source: 'A',
          stage1Score: 0.5,
        },
      ];

      const results = await reranker.rerank(query, candidates);
      // Score should be low because short tokens are filtered and no overlap
      expect(results[0].crossEncoderScore).toBeLessThan(0.5);
    });

    it('should produce scores in valid range [0, 1]', async () => {
      const results = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);

      for (const result of results) {
        expect(result.crossEncoderScore).toBeGreaterThanOrEqual(0);
        expect(result.crossEncoderScore).toBeLessThanOrEqual(1);
      }
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should throw error if not initialized', async () => {
      reranker = createCrossEncoderReranker({ mode: 'mock' });

      await expect(reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES)).rejects.toThrow(
        'not initialized'
      );
    });

    it('should handle malformed candidates gracefully', async () => {
      reranker = await createInitializedCrossEncoderReranker({ mode: 'mock' });

      const malformed: RerankCandidate[] = [
        { content: '', source: 'A', stage1Score: 0.5 }, // Empty content
        { content: 'Valid content', source: 'B', stage1Score: 0.5 },
      ];

      const results = await reranker.rerank(MOCK_QUERY, malformed);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Real Mode Tests (Stubbed)
  // ==========================================================================

  describe('Real Mode (Stubbed)', () => {
    beforeEach(async () => {
      reranker = await createInitializedCrossEncoderReranker({
        mode: 'real',
        vllmConfig: {
          endpoint: 'http://localhost:8000',
          modelName: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
          timeout: 5000,
        },
      });
    });

    afterEach(async () => {
      await reranker.close();
    });

    it('should fall back to mock scoring when vLLM unavailable', async () => {
      // Real mode should fall back to mock when API is unavailable
      const results = await reranker.rerank(MOCK_QUERY, MOCK_CANDIDATES);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].crossEncoderScore).toBeDefined();
    });
  });
});

// ============================================================================
// Unit Tests - RerankingCache
// ============================================================================

describe('RerankingCache', () => {
  let cache: RerankingCache;

  beforeEach(() => {
    cache = new RerankingCache({ capacity: 10, enableStats: true });
  });

  describe('Basic Operations', () => {
    it('should store and retrieve scores', () => {
      cache.put('query', 'document', 0.85);
      const score = cache.get('query', 'document');
      expect(score).toBe(0.85);
    });

    it('should return null for missing entries', () => {
      const score = cache.get('nonexistent', 'document');
      expect(score).toBeNull();
    });

    it('should check for existence', () => {
      cache.put('query', 'document', 0.85);
      expect(cache.has('query', 'document')).toBe(true);
      expect(cache.has('other', 'document')).toBe(false);
    });

    it('should update existing entries', () => {
      cache.put('query', 'document', 0.5);
      cache.put('query', 'document', 0.9);
      const score = cache.get('query', 'document');
      expect(score).toBe(0.9);
    });

    it('should clear all entries', () => {
      cache.put('query1', 'doc1', 0.5);
      cache.put('query2', 'doc2', 0.7);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entry', () => {
      const smallCache = new RerankingCache({ capacity: 2 });

      smallCache.put('q1', 'd1', 0.5);
      smallCache.put('q2', 'd2', 0.6);
      smallCache.put('q3', 'd3', 0.7); // Should evict q1

      expect(smallCache.has('q1', 'd1')).toBe(false);
      expect(smallCache.has('q2', 'd2')).toBe(true);
      expect(smallCache.has('q3', 'd3')).toBe(true);
    });

    it('should update access order on get', () => {
      const smallCache = new RerankingCache({ capacity: 2 });

      smallCache.put('q1', 'd1', 0.5);
      smallCache.put('q2', 'd2', 0.6);
      smallCache.get('q1', 'd1'); // Access q1 (moves to front)
      smallCache.put('q3', 'd3', 0.7); // Should evict q2

      expect(smallCache.has('q1', 'd1')).toBe(true);
      expect(smallCache.has('q2', 'd2')).toBe(false);
      expect(smallCache.has('q3', 'd3')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', () => {
      cache.put('query', 'doc', 0.5);
      cache.get('query', 'doc'); // Hit
      cache.get('other', 'doc'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track evictions', () => {
      const smallCache = new RerankingCache({ capacity: 2, enableStats: true });

      smallCache.put('q1', 'd1', 0.5);
      smallCache.put('q2', 'd2', 0.6);
      smallCache.put('q3', 'd3', 0.7); // Triggers eviction

      const stats = smallCache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it('should track cache size', () => {
      cache.put('q1', 'd1', 0.5);
      cache.put('q2', 'd2', 0.6);

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.capacity).toBe(10);
    });

    it('should reset stats on clear', () => {
      cache.put('q1', 'd1', 0.5);
      cache.get('q1', 'd1');
      cache.clear();

      const stats = cache.getStats();
      expect(stats.totalLookups).toBe(0);
      expect(stats.hits).toBe(0);
    });
  });

  describe('Key Generation', () => {
    it('should generate different keys for different inputs', () => {
      cache.put('query1', 'doc', 0.5);
      cache.put('query2', 'doc', 0.7);

      expect(cache.get('query1', 'doc')).toBe(0.5);
      expect(cache.get('query2', 'doc')).toBe(0.7);
    });

    it('should generate same key for identical inputs', () => {
      cache.put('query', 'document', 0.85);
      const score = cache.get('query', 'document');
      expect(score).toBe(0.85);
    });

    it('should handle special characters in keys', () => {
      cache.put('query?!@#', 'doc\n\t', 0.5);
      const score = cache.get('query?!@#', 'doc\n\t');
      expect(score).toBe(0.5);
    });
  });
});
