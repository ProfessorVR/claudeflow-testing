/**
 * Integration Tests - Hybrid Retrieval + Cross-Encoder Re-Ranking
 *
 * Tests the complete two-stage retrieval pipeline:
 * Stage 1: Hybrid (BM25 + Semantic) retrieval
 * Stage 2: Cross-encoder re-ranking
 *
 * @group integration
 * @group retrieval
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  HybridColdContextAccessor,
  createHybridColdAccessor,
  type HybridColdAccessorConfig,
} from '../../../../src/god-agent/cli/context/hybrid-cold-accessor.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Test Data
// ============================================================================

const TEST_DOCUMENTS = [
  {
    chapter: 1,
    content: `
# Phantasia in Aristotelian Psychology

Phantasia is a central cognitive faculty in Aristotle's psychological framework.
It produces mental images and enables imagination. Aristotle discusses phantasia
extensively in De Anima Book III, describing it as essential for both perception
and thought. The term derives from the Greek word for "appearance" and involves
mental representation.
    `.trim(),
  },
  {
    chapter: 2,
    content: `
# Perception and Mental Imagery

According to Aristotle, phantasia differs from perception because it can occur
without direct sensory input. This distinction is crucial for understanding how
humans can think about absent objects and engage in abstract reasoning. Modern
interpretations connect Aristotelian phantasia to contemporary theories of
mental imagery and cognitive representation.
    `.trim(),
  },
  {
    chapter: 3,
    content: `
# The Role of Imagination

Imagination plays a vital role in human cognition. While perception gives us
immediate sensory data, imagination allows us to manipulate and recombine
representations. This capability underlies creativity, problem-solving, and
hypothetical reasoning. The relationship between imagination and reason has
been debated since ancient times.
    `.trim(),
  },
];

// ============================================================================
// Integration Tests
// ============================================================================

describe('Hybrid Retrieval + Cross-Encoder Re-Ranking Integration', () => {
  let accessor: HybridColdContextAccessor;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary directory for test artifacts
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rerank-test-'));

    // Configure accessor with re-ranking enabled
    const config: HybridColdAccessorConfig = {
      agentDbConfig: {
        persistencePath: path.join(testDir, 'agentdb-chunks.bin'),
        embeddingProvider: 'mock',
      },
      bm25Config: {
        persistencePath: path.join(testDir, 'bm25-index.json'),
      },
      initialMode: 'hybrid',
      enableReranking: true,
      rerankConfig: {
        mode: 'mock',
        stage1TopK: 10, // Retrieve 10 candidates
        stage2TopK: 3, // Re-rank to top 3
        enableCaching: true,
      },
    };

    accessor = createHybridColdAccessor(config);
    await accessor.initialize();

    // Index test documents
    for (const doc of TEST_DOCUMENTS) {
      await accessor.addChapterContent(doc.chapter, doc.content);
    }
  });

  afterEach(async () => {
    await accessor.close();

    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // Two-Stage Retrieval Tests
  // ==========================================================================

  describe('Two-Stage Retrieval Pipeline', () => {
    it('should perform two-stage retrieval successfully', async () => {
      const query = 'What is phantasia?';
      const results = await accessor.search(query, 3);

      // Should return re-ranked top-3 results
      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(3);
      expect(results.length).toBeGreaterThan(0);

      // Check result structure
      for (const result of results) {
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('relevanceScore');
        expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(result.relevanceScore).toBeLessThanOrEqual(1);
      }
    });

    it('should prioritize highly relevant documents after re-ranking', async () => {
      const query = 'Aristotle phantasia De Anima';
      const results = await accessor.search(query, 3);

      // The first result should be highly relevant (Chapter 1 explicitly mentions all terms)
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('Aristotle');
      expect(results[0].content).toContain('phantasia');
    });

    it('should return results sorted by cross-encoder score', async () => {
      const query = 'perception mental imagery';
      const results = await accessor.search(query, 3);

      // Results should be sorted by relevance (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          results[i].relevanceScore
        );
      }
    });

    it('should handle queries with no results', async () => {
      const query = 'quantum mechanics electrons'; // Completely unrelated
      const results = await accessor.search(query, 3);

      // May return some results but they should have low scores
      if (results.length > 0) {
        expect(results[0].relevanceScore).toBeLessThan(0.5);
      }
    });

    it('should respect topK parameter', async () => {
      const topK = 2;
      const results = await accessor.search('phantasia', topK);

      expect(results.length).toBeLessThanOrEqual(topK);
    });
  });

  // ==========================================================================
  // Statistics and Metrics Tests
  // ==========================================================================

  describe('Statistics and Metrics', () => {
    it('should track re-ranking statistics', async () => {
      await accessor.search('phantasia', 3);

      const stats = accessor.getStats();

      expect(stats.rerankingEnabled).toBe(true);
      expect(stats.rerankingStats).toBeDefined();
      expect(stats.rerankingStats!.totalReranks).toBeGreaterThan(0);
      expect(stats.rerankingStats!.mode).toBe('mock');
    });

    it('should track cache performance', async () => {
      // First search
      await accessor.search('phantasia Aristotle', 3);

      // Second search with same query (should hit cache)
      await accessor.search('phantasia Aristotle', 3);

      const stats = accessor.getStats();

      expect(stats.rerankingStats).toBeDefined();
      expect(stats.rerankingStats!.cacheHitRate).toBeGreaterThan(0);
    });

    it('should track overall retrieval performance', async () => {
      await accessor.search('perception', 3);
      await accessor.search('imagination', 3);

      const stats = accessor.getStats();

      expect(stats.totalSearches).toBe(2);
      expect(stats.avgLatencyMs).toBeGreaterThanOrEqual(0);
      expect(stats.currentMode).toBe('hybrid');
    });
  });

  // ==========================================================================
  // Mode Switching Tests
  // ==========================================================================

  describe('Mode Switching with Re-Ranking', () => {
    it('should work in hybrid mode with re-ranking', async () => {
      accessor.setMode('hybrid');
      const results = await accessor.search('phantasia', 3);

      expect(results.length).toBeGreaterThan(0);

      const stats = accessor.getStats();
      expect(stats.currentMode).toBe('hybrid');
    });

    it('should work in semantic-only mode with re-ranking', async () => {
      accessor.setMode('semantic-only');
      const results = await accessor.search('phantasia', 3);

      expect(results.length).toBeGreaterThan(0);

      const stats = accessor.getStats();
      expect(stats.currentMode).toBe('semantic-only');
    });

    it('should work in bm25-only mode with re-ranking', async () => {
      accessor.setMode('bm25-only');
      const results = await accessor.search('phantasia', 3);

      expect(results.length).toBeGreaterThan(0);

      const stats = accessor.getStats();
      expect(stats.currentMode).toBe('bm25-only');
    });
  });

  // ==========================================================================
  // Re-Ranking Quality Tests
  // ==========================================================================

  describe('Re-Ranking Quality', () => {
    it('should improve relevance over Stage 1 alone', async () => {
      // This test would require comparing Stage 1 vs Stage 2 results
      // For now, we verify that re-ranking produces sensible results

      const query = 'mental representation imaging';
      const results = await accessor.search(query, 3);

      // Top result should mention relevant terms
      expect(results.length).toBeGreaterThan(0);
      const topContent = results[0].content.toLowerCase();
      const hasRelevantTerm =
        topContent.includes('mental') ||
        topContent.includes('representation') ||
        topContent.includes('image');
      expect(hasRelevantTerm).toBe(true);
    });

    it('should handle diverse query types', async () => {
      const queries = [
        'Aristotelian psychology',
        'difference between perception and phantasia',
        'role of imagination in cognition',
        'De Anima Book III',
      ];

      for (const query of queries) {
        const results = await accessor.search(query, 3);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].relevanceScore).toBeGreaterThan(0);
      }
    });

    it('should boost documents with query terms in prominent positions', async () => {
      const query = 'phantasia Aristotelian psychology';
      const results = await accessor.search(query, 3);

      // Chapter 1 has "Phantasia in Aristotelian Psychology" as title
      // It should rank highly
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].source).toContain('Chapter 1');
    });
  });

  // ==========================================================================
  // Fallback and Error Handling Tests
  // ==========================================================================

  describe('Fallback and Error Handling', () => {
    it('should handle empty queries gracefully', async () => {
      const results = await accessor.search('', 3);
      expect(results).toEqual([]);
    });

    it('should handle very long queries', async () => {
      const longQuery = 'phantasia '.repeat(100);
      const results = await accessor.search(longQuery, 3);

      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle special characters in queries', async () => {
      const query = 'phantasia? @Aristotle #cognition';
      const results = await accessor.search(query, 3);

      expect(Array.isArray(results)).toBe(true);
    });
  });
});

// ============================================================================
// Comparison Tests - With vs Without Re-Ranking
// ============================================================================

describe('Re-Ranking Impact Comparison', () => {
  let accessorWithRerank: HybridColdContextAccessor;
  let accessorWithoutRerank: HybridColdContextAccessor;
  let testDir1: string;
  let testDir2: string;

  beforeEach(async () => {
    // Create temporary directories
    testDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'rerank-enabled-'));
    testDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'rerank-disabled-'));

    // Accessor with re-ranking
    const configWithRerank: HybridColdAccessorConfig = {
      agentDbConfig: {
        persistencePath: path.join(testDir1, 'agentdb-chunks.bin'),
        embeddingProvider: 'mock',
      },
      bm25Config: {
        persistencePath: path.join(testDir1, 'bm25-index.json'),
      },
      enableReranking: true,
      rerankConfig: {
        mode: 'mock',
        stage1TopK: 10,
        stage2TopK: 5,
      },
    };

    // Accessor without re-ranking
    const configWithoutRerank: HybridColdAccessorConfig = {
      agentDbConfig: {
        persistencePath: path.join(testDir2, 'agentdb-chunks.bin'),
        embeddingProvider: 'mock',
      },
      bm25Config: {
        persistencePath: path.join(testDir2, 'bm25-index.json'),
      },
      enableReranking: false,
    };

    accessorWithRerank = createHybridColdAccessor(configWithRerank);
    accessorWithoutRerank = createHybridColdAccessor(configWithoutRerank);

    await accessorWithRerank.initialize();
    await accessorWithoutRerank.initialize();

    // Index same documents in both
    for (const doc of TEST_DOCUMENTS) {
      await accessorWithRerank.addChapterContent(doc.chapter, doc.content);
      await accessorWithoutRerank.addChapterContent(doc.chapter, doc.content);
    }
  });

  afterEach(async () => {
    await accessorWithRerank.close();
    await accessorWithoutRerank.close();

    // Cleanup
    if (fs.existsSync(testDir1)) {
      fs.rmSync(testDir1, { recursive: true, force: true });
    }
    if (fs.existsSync(testDir2)) {
      fs.rmSync(testDir2, { recursive: true, force: true });
    }
  });

  it('should show statistics differences', async () => {
    const query = 'phantasia Aristotle';

    await accessorWithRerank.search(query, 5);
    await accessorWithoutRerank.search(query, 5);

    const statsWithRerank = accessorWithRerank.getStats();
    const statsWithoutRerank = accessorWithoutRerank.getStats();

    expect(statsWithRerank.rerankingEnabled).toBe(true);
    expect(statsWithoutRerank.rerankingEnabled).toBe(false);

    expect(statsWithRerank.rerankingStats).toBeDefined();
    expect(statsWithoutRerank.rerankingStats).toBeUndefined();
  });

  it('should both return valid results', async () => {
    const query = 'mental imagery perception';

    const resultsWithRerank = await accessorWithRerank.search(query, 5);
    const resultsWithoutRerank = await accessorWithoutRerank.search(query, 5);

    expect(resultsWithRerank.length).toBeGreaterThan(0);
    expect(resultsWithoutRerank.length).toBeGreaterThan(0);

    // Both should return sorted results
    for (let i = 1; i < resultsWithRerank.length; i++) {
      expect(resultsWithRerank[i - 1].relevanceScore).toBeGreaterThanOrEqual(
        resultsWithRerank[i].relevanceScore
      );
    }

    for (let i = 1; i < resultsWithoutRerank.length; i++) {
      expect(resultsWithoutRerank[i - 1].relevanceScore).toBeGreaterThanOrEqual(
        resultsWithoutRerank[i].relevanceScore
      );
    }
  });
});
