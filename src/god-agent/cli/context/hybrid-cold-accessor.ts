/**
 * HybridColdContextAccessor - Combines BM25 + Semantic Search with RRF Fusion
 *
 * Implements the ColdContextAccessor interface using hybrid retrieval that combines:
 * - BM25 sparse keyword search for exact term matching
 * - Semantic dense vector search for conceptual similarity
 * - RRF (Reciprocal Rank Fusion) for score-agnostic result merging
 *
 * Architecture:
 * =============
 * This is an adapter pattern that wraps both BM25Index and AgentDBColdContextAccessor,
 * presenting a unified ColdContextAccessor interface to the TieredContextManager.
 *
 * Features:
 * - Mode switching: hybrid, semantic-only, bm25-only
 * - Auto-builds BM25 index from AgentDB chunks
 * - Performance metrics tracking
 * - Graceful degradation if BM25 fails
 *
 * Usage:
 * ======
 * ```typescript
 * const accessor = new HybridColdContextAccessor({
 *   agentDbConfig: {
 *     persistencePath: '.agentdb/dissertation-chunks.bin',
 *   },
 *   bm25Config: {
 *     persistencePath: '.agentdb/bm25-index.json',
 *   },
 *   initialMode: 'hybrid',
 * });
 *
 * await accessor.initialize();
 *
 * // Search using hybrid mode
 * const results = await accessor.search('phantasia aristotle', 5);
 *
 * // Switch modes at runtime
 * accessor.setMode('semantic-only');
 * ```
 *
 * @module hybrid-cold-accessor
 */

import {
  AgentDBColdContextAccessor,
  type AgentDBColdAccessorConfig,
} from './agentdb-cold-accessor.js';
import type { ColdContextAccessor, RetrievedChunk } from './tiered-context-manager.js';
import {
  HybridRetriever,
  createHybridRetriever,
  type HybridRetrieverConfig,
  type HybridResult,
  type RetrievalStats as HybridRetrievalStats,
} from '../retrieval/hybrid-retriever.js';
import type { BM25Document } from '../retrieval/bm25-index.js';
import type { RRFConfig } from '../retrieval/fusion.js';
import {
  CrossEncoderReranker,
  createCrossEncoderReranker,
  type CrossEncoderRerankerConfig,
  type RerankCandidate,
  type RerankingStats,
} from '../retrieval/cross-encoder-reranker.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Retrieval mode for the hybrid accessor
 */
export type RetrievalMode = 'hybrid' | 'semantic-only' | 'bm25-only';

/**
 * Configuration for HybridColdContextAccessor
 */
export interface HybridColdAccessorConfig {
  /** Base AgentDB configuration */
  agentDbConfig: AgentDBColdAccessorConfig;

  /** BM25 index configuration */
  bm25Config?: {
    /** Persistence path for BM25 index */
    persistencePath?: string;
    /** BM25 k1 parameter (term frequency saturation) */
    k1?: number;
    /** BM25 b parameter (length normalization) */
    b?: number;
    /** Minimum term length to index */
    minTermLength?: number;
  };

  /** RRF fusion configuration */
  rrfConfig?: RRFConfig;

  /** Initial retrieval mode (default: 'hybrid') */
  initialMode?: RetrievalMode;

  /** Enable performance metrics tracking (default: true) */
  enableMetrics?: boolean;

  /** Enable verbose logging (default: false) */
  verbose?: boolean;

  /** Enable Phase 2 cross-encoder re-ranking (default: false) */
  enableReranking?: boolean;

  /** Cross-encoder re-ranker configuration */
  rerankConfig?: CrossEncoderRerankerConfig;
}

/**
 * Retrieval statistics
 */
export interface RetrievalStatistics {
  /** Total searches performed */
  totalSearches: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Percentage of searches using hybrid mode */
  hybridUsagePercent: number;
  /** BM25 index coverage (documents indexed) */
  bm25Coverage: number;
  /** Semantic index coverage (chunks indexed) */
  semanticCoverage: number;
  /** BM25 index size (number of documents) */
  bm25IndexSize: number;
  /** AgentDB chunk count */
  agentdbChunkCount: number;
  /** Current retrieval mode */
  currentMode: RetrievalMode;
  /** Whether re-ranking is enabled */
  rerankingEnabled: boolean;
  /** Re-ranking statistics (if enabled) */
  rerankingStats?: RerankingStats;
}

/**
 * Internal search record for metrics
 */
interface SearchRecord {
  timestamp: number;
  mode: RetrievalMode;
  query: string;
  resultCount: number;
  latencyMs: number;
}

// ============================================================================
// HybridColdContextAccessor Class
// ============================================================================

/**
 * HybridColdContextAccessor - Production-grade hybrid retrieval
 *
 * Combines BM25 sparse search with semantic dense search using RRF fusion.
 * Implements the ColdContextAccessor interface for seamless integration
 * with TieredContextManager.
 */
export class HybridColdContextAccessor implements ColdContextAccessor {
  private readonly config: Required<Omit<HybridColdAccessorConfig, 'bm25Config' | 'rrfConfig' | 'rerankConfig'>>;
  private readonly bm25Config: HybridColdAccessorConfig['bm25Config'];
  private readonly rrfConfig: RRFConfig;
  private readonly rerankConfig: CrossEncoderRerankerConfig | undefined;
  private semanticAccessor: AgentDBColdContextAccessor;
  private hybridRetriever: HybridRetriever | null = null;
  private reranker: CrossEncoderReranker | null = null;
  private mode: RetrievalMode;
  private initialized: boolean = false;
  private searchHistory: SearchRecord[] = [];

  /**
   * Create a new HybridColdContextAccessor
   *
   * @param config - Configuration options
   */
  constructor(config: HybridColdAccessorConfig) {
    this.config = {
      agentDbConfig: config.agentDbConfig,
      initialMode: config.initialMode ?? 'hybrid',
      enableMetrics: config.enableMetrics ?? true,
      verbose: config.verbose ?? false,
      enableReranking: config.enableReranking ?? false,
    };
    this.bm25Config = config.bm25Config;
    this.rrfConfig = config.rrfConfig ?? {};
    this.rerankConfig = config.rerankConfig;
    this.mode = this.config.initialMode;

    // Create semantic accessor
    this.semanticAccessor = new AgentDBColdContextAccessor(config.agentDbConfig);
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Initialize the hybrid accessor
   *
   * Sets up both semantic and BM25 systems.
   *
   * @returns True if initialization succeeded
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    this.log('info', 'Initializing HybridColdContextAccessor...', { mode: this.mode });

    try {
      // Initialize semantic accessor first
      await this.semanticAccessor.initialize();
      this.log('info', 'Semantic accessor initialized', {
        stats: this.semanticAccessor.getStats(),
      });

      // Create and initialize hybrid retriever
      const hybridConfig: HybridRetrieverConfig = {
        bm25Config: this.bm25Config,
        rrfConfig: this.rrfConfig,
      };

      this.hybridRetriever = createHybridRetriever(hybridConfig);
      await this.hybridRetriever.initialize(this.semanticAccessor);

      this.log('info', 'Hybrid retriever initialized', {
        stats: this.hybridRetriever.getStats(),
      });

      // Initialize re-ranker if enabled
      if (this.config.enableReranking) {
        this.reranker = createCrossEncoderReranker(this.rerankConfig);
        await this.reranker.initialize();

        this.log('info', 'Cross-encoder re-ranker initialized', {
          stats: this.reranker.getStats(),
        });
      }

      this.initialized = true;
      return true;
    } catch (error) {
      this.log('error', 'Failed to initialize', { error: String(error) });
      throw error;
    }
  }

  /**
   * Close the accessor and clean up resources
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('info', 'Closing HybridColdContextAccessor...');

    try {
      await this.semanticAccessor.close();
    } catch (error) {
      this.log('warn', 'Error closing semantic accessor', { error: String(error) });
    }

    if (this.reranker) {
      try {
        await this.reranker.close();
      } catch (error) {
        this.log('warn', 'Error closing re-ranker', { error: String(error) });
      }
    }

    this.hybridRetriever = null;
    this.reranker = null;
    this.initialized = false;

    this.log('info', 'HybridColdContextAccessor closed');
  }

  /**
   * Check if the accessor is initialized and ready
   */
  isReady(): boolean {
    return this.initialized && this.hybridRetriever !== null;
  }

  // ==========================================================================
  // ColdContextAccessor Interface Implementation
  // ==========================================================================

  /**
   * Search with configurable retrieval mode
   *
   * Routes to the appropriate search method based on the current mode.
   *
   * @param query - Search query text
   * @param topK - Number of results to return (default: 5)
   * @returns Array of retrieved chunks sorted by relevance
   */
  async search(query: string, topK: number = 5): Promise<RetrievedChunk[]> {
    this.ensureInitialized();

    if (!query || query.trim().length === 0) {
      return [];
    }

    const startTime = Date.now();

    try {
      let results: RetrievedChunk[];

      switch (this.mode) {
        case 'hybrid':
          results = await this.hybridSearch(query, topK);
          break;
        case 'semantic-only':
          results = await this.semanticSearch(query, topK);
          break;
        case 'bm25-only':
          results = await this.bm25Search(query, topK);
          break;
        default:
          // Fallback to hybrid
          results = await this.hybridSearch(query, topK);
      }

      const latencyMs = Date.now() - startTime;

      // Track metrics
      if (this.config.enableMetrics) {
        this.recordSearch(query, results.length, latencyMs);
      }

      return results;
    } catch (error) {
      this.log('error', 'Search failed', { query, error: String(error) });
      // Fallback to semantic-only on error
      return this.semanticSearch(query, topK);
    }
  }

  /**
   * Get a citation by source ID
   *
   * Delegates to the semantic accessor.
   *
   * @param sourceId - Citation identifier
   * @returns Citation text or null if not found
   */
  async getCitation(sourceId: string): Promise<string | null> {
    this.ensureInitialized();
    return this.semanticAccessor.getCitation(sourceId);
  }

  /**
   * Get full section content by chapter and section name
   *
   * Delegates to the semantic accessor.
   *
   * @param chapterNum - Chapter number
   * @param sectionName - Section name
   * @returns Full section content or null if not found
   */
  async getFullSection(chapterNum: number, sectionName: string): Promise<string | null> {
    this.ensureInitialized();
    return this.semanticAccessor.getFullSection(chapterNum, sectionName);
  }

  // ==========================================================================
  // Mode Switching
  // ==========================================================================

  /**
   * Switch retrieval mode at runtime
   *
   * @param mode - New retrieval mode
   */
  setMode(mode: RetrievalMode): void {
    if (this.mode === mode) {
      return;
    }

    this.mode = mode;
    this.log('info', `Switched to ${mode} mode`);
  }

  /**
   * Get current retrieval mode
   */
  getMode(): RetrievalMode {
    return this.mode;
  }

  // ==========================================================================
  // Statistics and Metrics
  // ==========================================================================

  /**
   * Get retrieval statistics
   *
   * @returns Current statistics
   */
  getStats(): RetrievalStatistics {
    const semanticStats = this.semanticAccessor.getStats();
    const hybridStats = this.hybridRetriever?.getStats();

    const totalSearches = this.searchHistory.length;
    const hybridSearches = this.searchHistory.filter(s => s.mode === 'hybrid').length;
    const avgLatency =
      totalSearches > 0
        ? this.searchHistory.reduce((sum, s) => sum + s.latencyMs, 0) / totalSearches
        : 0;

    return {
      totalSearches,
      avgLatencyMs: avgLatency,
      hybridUsagePercent: totalSearches > 0 ? (hybridSearches / totalSearches) * 100 : 0,
      bm25Coverage: hybridStats?.bm25.totalDocuments ?? 0,
      semanticCoverage: semanticStats.totalChunks,
      bm25IndexSize: hybridStats?.bm25.totalDocuments ?? 0,
      agentdbChunkCount: semanticStats.totalChunks,
      currentMode: this.mode,
      rerankingEnabled: this.config.enableReranking,
      rerankingStats: this.reranker?.getStats(),
    };
  }

  // ==========================================================================
  // BM25 Index Building
  // ==========================================================================

  /**
   * Build BM25 index from AgentDB chunks
   *
   * Iterates all chunks from the semantic accessor and indexes them in BM25.
   * This is called automatically on initialization if the BM25 index is empty.
   *
   * @returns Number of documents indexed
   */
  async buildBM25IndexFromAgentDB(): Promise<number> {
    this.ensureInitialized();

    this.log('info', 'Building BM25 index from AgentDB...');

    const semanticStats = this.semanticAccessor.getStats();
    if (semanticStats.totalChunks === 0) {
      this.log('warn', 'No chunks in AgentDB to index');
      return 0;
    }

    // Extract all documents from AgentDB metadata
    const documents: BM25Document[] = [];

    // Use semantic search with empty query to get all chunks
    // This is a workaround since AgentDB doesn't expose direct metadata access
    // In production, we'd add a getAllChunks() method to AgentDBColdContextAccessor
    const allChunks = await this.semanticAccessor.search('', Math.max(1000, semanticStats.totalChunks * 2));

    for (const chunk of allChunks) {
      documents.push({
        id: `${chunk.source}:${chunk.content.substring(0, 50)}`,
        content: chunk.content,
        source: chunk.source,
      });
    }

    // Index in BM25
    await this.hybridRetriever!.indexDocuments(documents);

    this.log('info', 'BM25 index built', { documentCount: documents.length });
    return documents.length;
  }

  // ==========================================================================
  // Content Ingestion Methods
  // ==========================================================================

  /**
   * Add chapter content to both semantic and BM25 indexes
   *
   * @param chapterNum - Chapter number
   * @param content - Full chapter text
   * @returns Number of chunks created
   */
  async addChapterContent(chapterNum: number, content: string): Promise<number> {
    this.ensureInitialized();

    // Add to semantic accessor
    const chunks = await this.semanticAccessor.addChapterContent(chapterNum, content);

    // Add to BM25 index (single document per chapter)
    await this.hybridRetriever!.indexDocuments([
      {
        id: `chapter-${chapterNum}`,
        content,
        source: `Chapter ${chapterNum}`,
      },
    ]);

    return chunks;
  }

  /**
   * Add section content to both semantic and BM25 indexes
   *
   * @param chapterNum - Chapter number
   * @param sectionName - Section name
   * @param content - Full section text
   * @returns Number of chunks created
   */
  async addSectionContent(
    chapterNum: number,
    sectionName: string,
    content: string
  ): Promise<number> {
    this.ensureInitialized();

    // Add to semantic accessor
    const chunks = await this.semanticAccessor.addSectionContent(chapterNum, sectionName, content);

    // Add to BM25 index
    await this.hybridRetriever!.indexDocuments([
      {
        id: `section-${chapterNum}-${sectionName}`,
        content,
        source: `Chapter ${chapterNum}, ${sectionName}`,
      },
    ]);

    return chunks;
  }

  /**
   * Add citation to both semantic and BM25 indexes
   *
   * @param sourceId - Citation identifier
   * @param citation - Full citation text
   */
  async addCitation(sourceId: string, citation: string): Promise<void> {
    this.ensureInitialized();

    // Add to semantic accessor
    await this.semanticAccessor.addCitation(sourceId, citation);

    // Add to BM25 index
    await this.hybridRetriever!.indexDocuments([
      {
        id: `citation-${sourceId}`,
        content: citation,
        source: `Citation: ${sourceId}`,
      },
    ]);
  }

  /**
   * Clear all content from both indexes
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    await this.semanticAccessor.clear();
    await this.hybridRetriever!.clear();

    this.searchHistory = [];
    this.log('info', 'Cleared all content');
  }

  // ==========================================================================
  // Private Search Methods
  // ==========================================================================

  /**
   * Hybrid search: BM25 + Semantic with RRF fusion
   *
   * If re-ranking is enabled, this implements two-stage retrieval:
   * 1. Stage 1: Retrieve top-N candidates via hybrid search
   * 2. Stage 2: Re-rank to top-K using cross-encoder
   */
  private async hybridSearch(query: string, topK: number): Promise<RetrievedChunk[]> {
    // Determine Stage 1 top-K
    const stage1TopK = this.config.enableReranking && this.reranker
      ? Math.max(topK, this.rerankConfig?.stage1TopK ?? 50)
      : topK;

    // Stage 1: Hybrid retrieval
    const hybridResults = await this.hybridRetriever!.search(query, stage1TopK);

    // Stage 2: Re-rank if enabled
    if (this.config.enableReranking && this.reranker && hybridResults.length > 0) {
      const candidates: RerankCandidate[] = hybridResults.map(r => ({
        content: r.content,
        source: r.source,
        stage1Score: r.relevanceScore,
      }));

      const reranked = await this.reranker.rerank(query, candidates);

      // Return topK results (re-ranker may return more than requested)
      return reranked.slice(0, topK).map(r => ({
        content: r.content,
        source: r.source,
        relevanceScore: r.crossEncoderScore,
      }));
    }

    // No re-ranking: return Stage 1 results
    return hybridResults.map(result => ({
      content: result.content,
      source: result.source,
      relevanceScore: result.relevanceScore,
    }));
  }

  /**
   * Semantic-only search
   */
  private async semanticSearch(query: string, topK: number): Promise<RetrievedChunk[]> {
    return this.semanticAccessor.search(query, topK);
  }

  /**
   * BM25-only search
   */
  private async bm25Search(query: string, topK: number): Promise<RetrievedChunk[]> {
    const bm25Results = await this.hybridRetriever!.searchBM25Only(query, topK);

    return bm25Results.map(result => ({
      content: result.content,
      source: result.source,
      relevanceScore: result.relevanceScore,
    }));
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Record a search for metrics tracking
   */
  private recordSearch(query: string, resultCount: number, latencyMs: number): void {
    this.searchHistory.push({
      timestamp: Date.now(),
      mode: this.mode,
      query,
      resultCount,
      latencyMs,
    });

    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }

    if (this.config.verbose) {
      this.log('debug', 'Search completed', {
        query,
        mode: this.mode,
        resultCount,
        latencyMs,
      });
    }
  }

  /**
   * Ensure the accessor is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.hybridRetriever) {
      throw new Error('HybridColdContextAccessor not initialized. Call initialize() first.');
    }
  }

  /**
   * Log helper
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (level === 'debug' && !this.config.verbose) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      component: 'HybridColdContextAccessor',
      message,
      ...context,
    };

    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else if (this.config.verbose || level === 'info') {
      console.log(JSON.stringify(entry));
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a HybridColdContextAccessor with default configuration
 *
 * Note: You must call initialize() before using the accessor.
 *
 * @param config - Configuration options
 * @returns Uninitialized accessor
 */
export function createHybridColdAccessor(
  config: HybridColdAccessorConfig
): HybridColdContextAccessor {
  return new HybridColdContextAccessor(config);
}

/**
 * Create and initialize a HybridColdContextAccessor
 *
 * Convenience function that creates and initializes in one step.
 *
 * @param config - Configuration options
 * @returns Initialized accessor ready for use
 */
export async function createInitializedHybridColdAccessor(
  config: HybridColdAccessorConfig
): Promise<HybridColdContextAccessor> {
  const accessor = new HybridColdContextAccessor(config);
  await accessor.initialize();
  return accessor;
}
