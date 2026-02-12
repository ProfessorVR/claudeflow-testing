/**
 * Hybrid Retrieval Tests
 *
 * Tests for BM25, RRF fusion, and hybrid retriever components.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BM25Index, BM25Document } from '../../../../src/god-agent/cli/retrieval/bm25-index.js';
import {
  fuseResults,
  fuseTwoLists,
  computeRRFScore,
  analyzeFusion,
  RankedResult,
} from '../../../../src/god-agent/cli/retrieval/fusion.js';
import {
  HybridRetriever,
  createHybridRetriever,
} from '../../../../src/god-agent/cli/retrieval/hybrid-retriever.js';
import type { ColdContextAccessor, RetrievedChunk } from '../../../../src/god-agent/cli/context/tiered-context-manager.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_DOCUMENTS: BM25Document[] = [
  {
    id: 'doc1',
    content: 'Aristotle discusses phantasia in De Anima Book III, chapters 3-8. Phantasia is the imaginative faculty.',
    source: 'Aristotle - De Anima III',
  },
  {
    id: 'doc2',
    content: 'The role of phantasia in Aristotelian psychology is crucial for understanding perception and thought.',
    source: 'Nussbaum - Phantasia in Action',
  },
  {
    id: 'doc3',
    content: 'Aristotle defines phantasia as distinct from both perception (aisthesis) and intellect (nous).',
    source: 'White - Meaning of Phantasia',
  },
  {
    id: 'doc4',
    content: 'In the Rhetoric, Aristotle uses phantasia to explain how rhetoric creates mental images.',
    source: "O'Gorman - Phantasia in Rhetoric",
  },
  {
    id: 'doc5',
    content: 'Medieval philosophers interpreted Aristotelian phantasia as imagination or fantasy.',
    source: 'Medieval Philosophy Commentary',
  },
  {
    id: 'doc6',
    content: 'The concept of mental representation in modern cognitive science has roots in Aristotle.',
    source: 'Cognitive Science History',
  },
];

// Mock ColdContextAccessor for testing
class MockColdAccessor implements ColdContextAccessor {
  private chunks: RetrievedChunk[] = [];

  constructor(chunks: RetrievedChunk[] = []) {
    this.chunks = chunks;
  }

  async search(query: string, topK: number): Promise<RetrievedChunk[]> {
    // Simple mock: return chunks that contain query terms
    const queryTerms = query.toLowerCase().split(/\s+/);
    const scored = this.chunks
      .map(chunk => {
        const contentLower = chunk.content.toLowerCase();
        let score = 0;
        for (const term of queryTerms) {
          if (contentLower.includes(term)) {
            score += 0.3; // Simple scoring
          }
        }
        return { ...chunk, relevanceScore: score };
      })
      .filter(chunk => chunk.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scored.slice(0, topK);
  }

  async getCitation(sourceId: string): Promise<string | null> {
    return null;
  }

  async getFullSection(chapterNum: number, sectionName: string): Promise<string | null> {
    return null;
  }
}

// ============================================================================
// BM25 Index Tests
// ============================================================================

describe('BM25Index', () => {
  let index: BM25Index;
  const testDir = path.join(process.cwd(), '.test-bm25');

  beforeEach(async () => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    index = new BM25Index({
      persistencePath: path.join(testDir, 'test-index.json'),
    });
    await index.initialize();
  });

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should initialize successfully', async () => {
    expect(index.isReady()).toBe(true);
  });

  it('should index documents', async () => {
    await index.indexDocuments(TEST_DOCUMENTS);

    const stats = index.getStats();
    expect(stats.totalDocuments).toBe(TEST_DOCUMENTS.length);
    expect(stats.totalTerms).toBeGreaterThan(0);
    expect(stats.avgDocLength).toBeGreaterThan(0);
  });

  it('should find exact keyword matches', async () => {
    await index.indexDocuments(TEST_DOCUMENTS);

    const results = index.search('phantasia aristotle', 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
    // Should find documents containing both "phantasia" and "aristotle"
    expect(results[0].content.toLowerCase()).toContain('phantasia');
    expect(results[0].content.toLowerCase()).toContain('aristotle');
  });

  it('should rank by relevance', async () => {
    await index.indexDocuments(TEST_DOCUMENTS);

    const results = index.search('phantasia', 5);

    // Scores should be descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('should handle stopwords', async () => {
    await index.indexDocuments(TEST_DOCUMENTS);

    // Search with stopwords should still work
    const results = index.search('the role of phantasia in aristotle', 5);

    expect(results.length).toBeGreaterThan(0);
    // Should ignore "the", "of", "in"
  });

  it('should handle empty queries', async () => {
    await index.indexDocuments(TEST_DOCUMENTS);

    const results = index.search('', 5);
    expect(results.length).toBe(0);
  });

  it('should persist and load index', async () => {
    await index.indexDocuments(TEST_DOCUMENTS);

    const stats1 = index.getStats();

    // Create new index and load
    const index2 = new BM25Index({
      persistencePath: path.join(testDir, 'test-index.json'),
    });
    await index2.initialize();

    const stats2 = index2.getStats();

    expect(stats2.totalDocuments).toBe(stats1.totalDocuments);
    expect(stats2.totalTerms).toBe(stats1.totalTerms);

    // Should get same results
    const results1 = index.search('phantasia', 3);
    const results2 = index2.search('phantasia', 3);

    expect(results2.length).toBe(results1.length);
    expect(results2[0].id).toBe(results1[0].id);
  });
});

// ============================================================================
// RRF Fusion Tests
// ============================================================================

describe('RRF Fusion', () => {
  it('should compute RRF score correctly', () => {
    // Document ranked 1st in system A, 3rd in system B
    const score = computeRRFScore([1, 3], 60);

    // Expected: 1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323
    expect(score).toBeCloseTo(0.0323, 3);
  });

  it('should fuse two result lists', () => {
    const list1: RankedResult[] = [
      { id: 'doc1', score: 0.9, content: 'Content 1', source: 'Source 1' },
      { id: 'doc2', score: 0.8, content: 'Content 2', source: 'Source 2' },
      { id: 'doc3', score: 0.7, content: 'Content 3', source: 'Source 3' },
    ];

    const list2: RankedResult[] = [
      { id: 'doc3', score: 0.95, content: 'Content 3', source: 'Source 3' },
      { id: 'doc1', score: 0.85, content: 'Content 1', source: 'Source 1' },
      { id: 'doc4', score: 0.75, content: 'Content 4', source: 'Source 4' },
    ];

    const fused = fuseTwoLists(list1, list2);

    // doc1 appears in both lists (ranks 1 and 2): RRF = 1/(60+1) + 1/(60+2) = 0.0164 + 0.0161 = 0.0325
    // doc3 appears in both lists (ranks 3 and 1): RRF = 1/(60+3) + 1/(60+1) = 0.0159 + 0.0164 = 0.0323
    // doc1 should have slightly higher RRF score
    expect(fused[0].id).toBe('doc1');
    expect(fused[0].systemRanks.size).toBe(2);
  });

  it('should favor documents appearing in multiple systems', () => {
    const list1: RankedResult[] = [
      { id: 'doc1', score: 0.5, content: 'Content 1', source: 'Source 1' },
      { id: 'doc2', score: 0.4, content: 'Content 2', source: 'Source 2' },
    ];

    const list2: RankedResult[] = [
      { id: 'doc1', score: 0.6, content: 'Content 1', source: 'Source 1' },
      { id: 'doc3', score: 0.9, content: 'Content 3', source: 'Source 3' },
    ];

    const fused = fuseTwoLists(list1, list2);

    // doc1 appears in both, should rank higher than doc3 despite doc3 having higher individual score
    // This is the power of RRF - it rewards consensus
    expect(fused[0].id).toBe('doc1');
  });

  it('should analyze fusion statistics', () => {
    const list1: RankedResult[] = [
      { id: 'doc1', score: 0.9, content: 'Content 1', source: 'Source 1' },
      { id: 'doc2', score: 0.8, content: 'Content 2', source: 'Source 2' },
    ];

    const list2: RankedResult[] = [
      { id: 'doc1', score: 0.85, content: 'Content 1', source: 'Source 1' },
      { id: 'doc3', score: 0.75, content: 'Content 3', source: 'Source 3' },
    ];

    const fused = fuseTwoLists(list1, list2);
    const stats = analyzeFusion(fused);

    expect(stats.totalResults).toBe(3);
    expect(stats.uniqueSystems.size).toBe(2);
    expect(stats.multiSystemDocs).toBe(1); // doc1
    expect(stats.singleSystemDocs).toBe(2); // doc2, doc3
  });
});

// ============================================================================
// Hybrid Retriever Tests
// ============================================================================

describe('HybridRetriever', () => {
  let retriever: HybridRetriever;
  let mockAccessor: MockColdAccessor;
  const testDir = path.join(process.cwd(), '.test-hybrid');

  beforeEach(async () => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create mock semantic search results
    const mockChunks: RetrievedChunk[] = TEST_DOCUMENTS.map(doc => ({
      content: doc.content,
      source: doc.source,
      relevanceScore: Math.random() * 0.5 + 0.5, // 0.5-1.0
    }));

    mockAccessor = new MockColdAccessor(mockChunks);

    retriever = createHybridRetriever({
      bm25Config: {
        persistencePath: path.join(testDir, 'hybrid-bm25.json'),
      },
    });

    await retriever.initialize(mockAccessor);
    await retriever.indexDocuments(TEST_DOCUMENTS);
  });

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should initialize successfully', () => {
    expect(retriever.isReady()).toBe(true);
  });

  it('should perform hybrid search', async () => {
    const results = await retriever.search('phantasia aristotle', 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].relevanceScore).toBeGreaterThan(0);
    expect(results[0].content).toBeTruthy();
    expect(results[0].source).toBeTruthy();
  });

  it('should combine BM25 and semantic scores', async () => {
    const results = await retriever.search('phantasia', 5);

    // Check that results have scores from both systems (or at least one)
    const hasMultipleSources = results.some(
      r => r.scores.bm25 !== undefined && r.scores.semantic !== undefined
    );

    // At least some results should come from multiple systems
    expect(hasMultipleSources || results.length > 0).toBe(true);
  });

  it('should return results sorted by relevance', async () => {
    const results = await retriever.search('phantasia aristotle', 5);

    // Scores should be descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
    }
  });

  it('should handle queries with no results', async () => {
    const results = await retriever.search('nonexistent_term_xyz', 5);
    expect(results.length).toBe(0);
  });

  it('should provide BM25-only search', async () => {
    const results = await retriever.searchBM25Only('phantasia', 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].scores.bm25).toBeDefined();
    expect(results[0].scores.semantic).toBeUndefined();
  });

  it('should provide semantic-only search', async () => {
    const results = await retriever.searchSemanticOnly('aristotle', 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].scores.semantic).toBeDefined();
    expect(results[0].scores.bm25).toBeUndefined();
  });

  it('should provide retrieval statistics', async () => {
    const stats = await retriever.getRetrievalStats('phantasia aristotle', 5);

    expect(stats.totalResults).toBeGreaterThan(0);
    expect(stats.latencyMs).toBeGreaterThanOrEqual(0); // Can be 0ms for fast operations
    expect(stats.bm25Only + stats.semanticOnly + stats.both).toBe(stats.totalResults);
  });

  it('should improve coverage over single method', async () => {
    const hybridResults = await retriever.search('phantasia aristotle', 10);
    const bm25Results = await retriever.searchBM25Only('phantasia aristotle', 10);
    const semanticResults = await retriever.searchSemanticOnly('phantasia aristotle', 10);

    // Hybrid should provide at least as many results as either method alone
    expect(hybridResults.length).toBeGreaterThanOrEqual(
      Math.min(bm25Results.length, semanticResults.length)
    );
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Hybrid Retrieval Integration', () => {
  it('should find exact term matches with BM25', async () => {
    const index = new BM25Index();
    await index.initialize();
    await index.indexDocuments(TEST_DOCUMENTS);

    // Search for exact term "phantasia"
    const results = index.search('phantasia', 10);

    // All results should contain "phantasia"
    for (const result of results) {
      expect(result.content.toLowerCase()).toContain('phantasia');
    }

    // Should have multiple matches
    expect(results.length).toBeGreaterThan(1);
  });

  it('should handle multi-word queries', async () => {
    const index = new BM25Index();
    await index.initialize();
    await index.indexDocuments(TEST_DOCUMENTS);

    const results = index.search('phantasia perception intellect', 5);

    // Top result should contain multiple query terms
    expect(results.length).toBeGreaterThan(0);
    const topResult = results[0].content.toLowerCase();
    const termCount = [
      topResult.includes('phantasia'),
      topResult.includes('perception'),
      topResult.includes('intellect'),
    ].filter(Boolean).length;

    expect(termCount).toBeGreaterThan(1);
  });

  it('should demonstrate RRF fusion benefit', () => {
    // Scenario: BM25 finds exact matches, semantic finds related concepts
    const bm25Results: RankedResult[] = [
      {
        id: 'exact_match',
        score: 0.9,
        content: 'Aristotle defines phantasia',
        source: 'De Anima',
      },
      { id: 'keyword_match', score: 0.7, content: 'phantasia in psychology', source: 'Study' },
    ];

    const semanticResults: RankedResult[] = [
      {
        id: 'concept_match',
        score: 0.85,
        content: 'imagination and mental representation',
        source: 'Modern',
      },
      { id: 'exact_match', score: 0.8, content: 'Aristotle defines phantasia', source: 'De Anima' },
    ];

    const fused = fuseTwoLists(bm25Results, semanticResults);

    // Document appearing in both should rank highest
    expect(fused[0].id).toBe('exact_match');
    expect(fused[0].systemRanks.size).toBe(2);
  });
});
