/**
 * HybridRetriever - Enhanced retrieval with Reciprocal Rank Fusion (RRF)
 *
 * Implements advanced hybrid search combining:
 * - Semantic (vector) search
 * - BM25 keyword search
 * - Reciprocal Rank Fusion for optimal result merging
 * - Optional cross-encoder re-ranking
 *
 * Research shows RRF outperforms simple weighted averaging by 20%+ MRR.
 *
 * Part of Phase A Quality Enhancement implementation.
 * Expected improvement: 20%+ MRR improvement over baseline
 */

import { ContextChunk, RetrievalOptions, RetrievalStats } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface HybridRetrievalOptions extends RetrievalOptions {
  /** Use RRF fusion instead of weighted averaging (default: true) */
  useRRF?: boolean;

  /** RRF k parameter (default: 60, as recommended in research) */
  rrfK?: number;

  /** Number of results to fetch from each retriever before fusion (default: topK * 2) */
  prefetchMultiplier?: number;

  /** Weight for semantic results when not using RRF (default: 0.6) */
  semanticWeight?: number;

  /** Weight for BM25 results when not using RRF (default: 0.4) */
  bm25Weight?: number;

  /** Enable query expansion (default: false) */
  queryExpansion?: boolean;
}

export interface FusedResult extends ContextChunk {
  /** RRF score used for ranking */
  rrfScore?: number;

  /** Individual scores from each retriever */
  sourceScores?: {
    semantic?: number;
    bm25?: number;
    rerank?: number;
  };

  /** Rank in each retriever's results */
  sourceRanks?: {
    semantic?: number;
    bm25?: number;
  };
}

export interface HybridRetrievalStats extends RetrievalStats {
  /** Results from semantic search before fusion */
  semanticResults: number;

  /** Results from BM25 search before fusion */
  bm25Results: number;

  /** Final fused results */
  fusedResults: number;

  /** Whether RRF was used */
  usedRRF: boolean;

  /** Query expansion variants used */
  queryVariants?: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_RRF_K = 60; // Recommended in RRF research
const DEFAULT_PREFETCH_MULTIPLIER = 2;
const DEFAULT_SEMANTIC_WEIGHT = 0.6;
const DEFAULT_BM25_WEIGHT = 0.4;

// ============================================================================
// HybridRetriever Class
// ============================================================================

/**
 * Advanced hybrid retriever combining semantic and keyword search with RRF
 */
export class HybridRetriever {
  private semanticSearchFn: (query: string, topK: number) => Promise<ContextChunk[]>;
  private bm25SearchFn: (query: string, topK: number) => Promise<ContextChunk[]>;
  private crossEncoderFn?: (query: string, chunks: ContextChunk[], topK: number) => Promise<ContextChunk[]>;

  /**
   * Create a HybridRetriever
   *
   * @param semanticSearch - Function to perform semantic/vector search
   * @param bm25Search - Function to perform BM25 keyword search
   * @param crossEncoder - Optional function for cross-encoder re-ranking
   */
  constructor(
    semanticSearch: (query: string, topK: number) => Promise<ContextChunk[]>,
    bm25Search: (query: string, topK: number) => Promise<ContextChunk[]>,
    crossEncoder?: (query: string, chunks: ContextChunk[], topK: number) => Promise<ContextChunk[]>
  ) {
    this.semanticSearchFn = semanticSearch;
    this.bm25SearchFn = bm25Search;
    this.crossEncoderFn = crossEncoder;
  }

  /**
   * Retrieve results using hybrid search with RRF
   *
   * @param query - Search query
   * @param topK - Number of results to return (default: 20)
   * @param options - Additional retrieval options
   * @returns Fused and ranked results
   */
  async retrieve(
    query: string,
    topK: number = 20,
    options: HybridRetrievalOptions = {}
  ): Promise<{ results: FusedResult[]; stats: HybridRetrievalStats }> {
    const startTime = Date.now();

    const useRRF = options.useRRF ?? true;
    const rrfK = options.rrfK ?? DEFAULT_RRF_K;
    const prefetchMultiplier = options.prefetchMultiplier ?? DEFAULT_PREFETCH_MULTIPLIER;
    const prefetchCount = topK * prefetchMultiplier;

    // Step 1: Expand query if enabled
    const queries = options.queryExpansion
      ? this.expandQuery(query)
      : [query];

    // Step 2: Run semantic and BM25 searches in parallel
    const [semanticResults, bm25Results] = await Promise.all([
      this.runSemanticSearch(queries, prefetchCount),
      this.runBM25Search(queries, prefetchCount),
    ]);

    // Step 3: Fuse results
    let fused: FusedResult[];
    if (useRRF) {
      fused = this.fuseWithRRF(semanticResults, bm25Results, rrfK);
    } else {
      fused = this.fuseWithWeights(
        semanticResults,
        bm25Results,
        options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT,
        options.bm25Weight ?? DEFAULT_BM25_WEIGHT
      );
    }

    // Step 4: Cross-encoder re-ranking if available
    let reranked = fused;
    let rerankTimeMs: number | undefined;
    if (this.crossEncoderFn && options.rerank !== false) {
      const rerankStart = Date.now();
      reranked = await this.crossEncoderRerank(query, fused, topK);
      rerankTimeMs = Date.now() - rerankStart;
    }

    // Step 5: Take top K results
    const results = reranked.slice(0, topK);

    const stats: HybridRetrievalStats = {
      queryTimeMs: Date.now() - startTime,
      chunksSearched: semanticResults.length + bm25Results.length,
      chunksReturned: results.length,
      cacheHit: false,
      rerankTimeMs,
      semanticResults: semanticResults.length,
      bm25Results: bm25Results.length,
      fusedResults: fused.length,
      usedRRF: useRRF,
      queryVariants: queries.length > 1 ? queries : undefined,
    };

    return { results, stats };
  }

  /**
   * Run semantic search across query variants
   */
  private async runSemanticSearch(queries: string[], topK: number): Promise<ContextChunk[]> {
    if (queries.length === 1) {
      return this.semanticSearchFn(queries[0], topK);
    }

    // Run all query variants and merge
    const results = await Promise.all(
      queries.map(q => this.semanticSearchFn(q, Math.ceil(topK / queries.length)))
    );

    // Deduplicate by chunkId
    const seen = new Set<string>();
    const merged: ContextChunk[] = [];

    for (const resultSet of results) {
      for (const chunk of resultSet) {
        if (!seen.has(chunk.chunkId)) {
          seen.add(chunk.chunkId);
          merged.push(chunk);
        }
      }
    }

    return merged;
  }

  /**
   * Run BM25 search across query variants
   */
  private async runBM25Search(queries: string[], topK: number): Promise<ContextChunk[]> {
    if (queries.length === 1) {
      return this.bm25SearchFn(queries[0], topK);
    }

    // Run all query variants and merge
    const results = await Promise.all(
      queries.map(q => this.bm25SearchFn(q, Math.ceil(topK / queries.length)))
    );

    // Deduplicate by chunkId
    const seen = new Set<string>();
    const merged: ContextChunk[] = [];

    for (const resultSet of results) {
      for (const chunk of resultSet) {
        if (!seen.has(chunk.chunkId)) {
          seen.add(chunk.chunkId);
          merged.push(chunk);
        }
      }
    }

    return merged;
  }

  /**
   * Fuse results using Reciprocal Rank Fusion (RRF)
   *
   * RRF score = sum(1 / (k + rank)) for each retriever
   *
   * Research shows k=60 works well across diverse datasets.
   */
  private fuseWithRRF(
    semanticResults: ContextChunk[],
    bm25Results: ContextChunk[],
    k: number
  ): FusedResult[] {
    const scores = new Map<string, {
      chunk: ContextChunk;
      rrfScore: number;
      semanticRank?: number;
      bm25Rank?: number;
      semanticScore?: number;
      bm25Score?: number;
    }>();

    // Score semantic results
    for (let rank = 0; rank < semanticResults.length; rank++) {
      const chunk = semanticResults[rank];
      const rrfContribution = 1 / (k + rank + 1);

      const existing = scores.get(chunk.chunkId);
      if (existing) {
        existing.rrfScore += rrfContribution;
        existing.semanticRank = rank + 1;
        existing.semanticScore = chunk.relevanceScore;
      } else {
        scores.set(chunk.chunkId, {
          chunk,
          rrfScore: rrfContribution,
          semanticRank: rank + 1,
          semanticScore: chunk.relevanceScore,
        });
      }
    }

    // Score BM25 results
    for (let rank = 0; rank < bm25Results.length; rank++) {
      const chunk = bm25Results[rank];
      const rrfContribution = 1 / (k + rank + 1);

      const existing = scores.get(chunk.chunkId);
      if (existing) {
        existing.rrfScore += rrfContribution;
        existing.bm25Rank = rank + 1;
        existing.bm25Score = chunk.relevanceScore;
      } else {
        scores.set(chunk.chunkId, {
          chunk,
          rrfScore: rrfContribution,
          bm25Rank: rank + 1,
          bm25Score: chunk.relevanceScore,
        });
      }
    }

    // Convert to array and sort by RRF score
    const fused: FusedResult[] = Array.from(scores.values())
      .map(({ chunk, rrfScore, semanticRank, bm25Rank, semanticScore, bm25Score }) => ({
        ...chunk,
        rrfScore,
        relevanceScore: rrfScore, // Use RRF score as relevance
        sourceScores: {
          semantic: semanticScore,
          bm25: bm25Score,
        },
        sourceRanks: {
          semantic: semanticRank,
          bm25: bm25Rank,
        },
      }))
      .sort((a, b) => (b.rrfScore ?? 0) - (a.rrfScore ?? 0));

    return fused;
  }

  /**
   * Fuse results using weighted averaging (fallback method)
   */
  private fuseWithWeights(
    semanticResults: ContextChunk[],
    bm25Results: ContextChunk[],
    semanticWeight: number,
    bm25Weight: number
  ): FusedResult[] {
    const scores = new Map<string, {
      chunk: ContextChunk;
      weightedScore: number;
      semanticScore?: number;
      bm25Score?: number;
    }>();

    // Normalize semantic scores to 0-1
    const maxSemantic = Math.max(...semanticResults.map(c => c.relevanceScore), 0.001);

    for (const chunk of semanticResults) {
      const normalizedScore = chunk.relevanceScore / maxSemantic;
      const existing = scores.get(chunk.chunkId);

      if (existing) {
        existing.weightedScore += normalizedScore * semanticWeight;
        existing.semanticScore = normalizedScore;
      } else {
        scores.set(chunk.chunkId, {
          chunk,
          weightedScore: normalizedScore * semanticWeight,
          semanticScore: normalizedScore,
        });
      }
    }

    // Normalize BM25 scores to 0-1
    const maxBM25 = Math.max(...bm25Results.map(c => c.relevanceScore), 0.001);

    for (const chunk of bm25Results) {
      const normalizedScore = chunk.relevanceScore / maxBM25;
      const existing = scores.get(chunk.chunkId);

      if (existing) {
        existing.weightedScore += normalizedScore * bm25Weight;
        existing.bm25Score = normalizedScore;
      } else {
        scores.set(chunk.chunkId, {
          chunk,
          weightedScore: normalizedScore * bm25Weight,
          bm25Score: normalizedScore,
        });
      }
    }

    // Convert to array and sort by weighted score
    const fused: FusedResult[] = Array.from(scores.values())
      .map(({ chunk, weightedScore, semanticScore, bm25Score }) => ({
        ...chunk,
        relevanceScore: weightedScore,
        sourceScores: {
          semantic: semanticScore,
          bm25: bm25Score,
        },
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return fused;
  }

  /**
   * Re-rank using cross-encoder
   */
  private async crossEncoderRerank(
    query: string,
    chunks: FusedResult[],
    topK: number
  ): Promise<FusedResult[]> {
    if (!this.crossEncoderFn) {
      return chunks;
    }

    const reranked = await this.crossEncoderFn(query, chunks, topK);

    // Preserve fusion metadata and add rerank score
    return reranked.map((chunk, rank) => {
      const originalFused = chunks.find(c => c.chunkId === chunk.chunkId);
      return {
        ...chunk,
        rrfScore: originalFused?.rrfScore,
        sourceScores: {
          ...originalFused?.sourceScores,
          rerank: chunk.relevanceScore,
        },
        sourceRanks: originalFused?.sourceRanks,
      };
    });
  }

  /**
   * Expand query into variants for broader retrieval
   *
   * Simple expansion - could be enhanced with LLM-based expansion
   */
  private expandQuery(query: string): string[] {
    const variants = [query];

    // Add variant without stop words
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'in', 'to', 'for']);
    const withoutStopWords = query
      .split(/\s+/)
      .filter(word => !stopWords.has(word.toLowerCase()))
      .join(' ');

    if (withoutStopWords !== query && withoutStopWords.length > 3) {
      variants.push(withoutStopWords);
    }

    // Add variant with key terms only (first 5 significant words)
    const words = query.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()));
    if (words.length > 3) {
      const keyTerms = words.slice(0, 5).join(' ');
      if (keyTerms !== query && !variants.includes(keyTerms)) {
        variants.push(keyTerms);
      }
    }

    return variants.slice(0, 3); // Max 3 variants
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a basic hybrid retriever with mock search functions
 * (useful for testing or when actual search backends aren't available)
 */
export function createMockHybridRetriever(): HybridRetriever {
  return new HybridRetriever(
    async (_query, topK) => {
      // Mock semantic search
      return Array(topK).fill(null).map((_, i) => ({
        chunkId: `semantic_${i}`,
        docId: `doc_${i}`,
        content: `Semantic result ${i + 1}`,
        metadata: { author: 'Test', title: 'Test', year: 2024, page_start: 1, page_end: 1, collection: 'test' },
        relevanceScore: 1 - (i * 0.05),
      }));
    },
    async (_query, topK) => {
      // Mock BM25 search
      return Array(topK).fill(null).map((_, i) => ({
        chunkId: `bm25_${i}`,
        docId: `doc_${i}`,
        content: `BM25 result ${i + 1}`,
        metadata: { author: 'Test', title: 'Test', year: 2024, page_start: 1, page_end: 1, collection: 'test' },
        relevanceScore: 1 - (i * 0.05),
      }));
    }
  );
}

/**
 * Standalone RRF fusion function for use outside HybridRetriever
 */
export function reciprocalRankFusion<T extends { id: string; score?: number }>(
  resultSets: T[][],
  k: number = DEFAULT_RRF_K
): Array<T & { rrfScore: number }> {
  const scores = new Map<string, { item: T; rrfScore: number }>();

  for (const results of resultSets) {
    for (let rank = 0; rank < results.length; rank++) {
      const item = results[rank];
      const rrfContribution = 1 / (k + rank + 1);

      const existing = scores.get(item.id);
      if (existing) {
        existing.rrfScore += rrfContribution;
      } else {
        scores.set(item.id, { item, rrfScore: rrfContribution });
      }
    }
  }

  return Array.from(scores.values())
    .map(({ item, rrfScore }) => ({ ...item, rrfScore }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}
