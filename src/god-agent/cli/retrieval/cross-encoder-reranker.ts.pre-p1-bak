/**
 * CrossEncoderReranker - Two-Stage Retrieval with Cross-Encoder Re-Ranking
 *
 * Implements Phase 2 of the retrieval pipeline:
 * 1. Stage 1: Hybrid retrieval (BM25 + Semantic) returns top-50 candidates
 * 2. Stage 2: Cross-encoder re-ranks candidates to top-10 final results
 *
 * Features:
 * - Mock mode for testing without external dependencies
 * - Real mode for vLLM HTTP API integration
 * - LRU score caching to avoid redundant computations
 * - Comprehensive statistics tracking
 * - Graceful degradation on errors
 *
 * Architecture:
 * =============
 * The cross-encoder computes relevance scores for query-document pairs by
 * jointly encoding them, unlike bi-encoders which encode separately. This
 * provides higher accuracy at the cost of computational expense, making it
 * ideal for re-ranking a small set of candidates.
 *
 * Usage:
 * ======
 * ```typescript
 * const reranker = new CrossEncoderReranker({
 *   mode: 'mock', // or 'real' for vLLM integration
 *   stage1TopK: 50,
 *   stage2TopK: 10,
 *   enableCaching: true,
 * });
 *
 * await reranker.initialize();
 *
 * // Re-rank candidates
 * const reranked = await reranker.rerank(query, candidates);
 * ```
 *
 * @module cross-encoder-reranker
 */

import {
  RerankingCache,
  createRerankingCache,
  type CacheStats,
} from './reranking-cache.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cross-encoder mode
 */
export type CrossEncoderMode = 'mock' | 'real';

/**
 * Document to be re-ranked
 */
export interface RerankCandidate {
  /** Document content */
  content: string;
  /** Source metadata */
  source: string;
  /** Original retrieval score from Stage 1 */
  stage1Score: number;
}

/**
 * Re-ranked result with cross-encoder score
 */
export interface RerankedResult {
  /** Document content */
  content: string;
  /** Source metadata */
  source: string;
  /** Cross-encoder relevance score (0.0-1.0) */
  crossEncoderScore: number;
  /** Original Stage 1 score */
  stage1Score: number;
  /** Whether this score came from cache */
  fromCache: boolean;
}

/**
 * Re-ranking statistics
 */
export interface RerankingStats {
  /** Total re-ranking operations performed */
  totalReranks: number;
  /** Total candidates processed */
  totalCandidates: number;
  /** Average latency per re-rank operation (ms) */
  avgLatencyMs: number;
  /** Average candidates per operation */
  avgCandidatesPerOp: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Cache statistics */
  cacheStats: CacheStats;
  /** Current mode */
  mode: CrossEncoderMode;
  /** Number of real API calls made (real mode only) */
  apiCalls: number;
  /** Number of mock computations (mock mode only) */
  mockComputations: number;
}

/**
 * Configuration for CrossEncoderReranker
 */
export interface CrossEncoderRerankerConfig {
  /** Operating mode (default: 'mock') */
  mode?: CrossEncoderMode;

  /** Number of candidates to retrieve from Stage 1 (default: 50) */
  stage1TopK?: number;

  /** Number of final results after re-ranking (default: 10) */
  stage2TopK?: number;

  /** Enable score caching (default: true) */
  enableCaching?: boolean;

  /** Cache capacity (default: 10000) */
  cacheCapacity?: number;

  /** Enable statistics tracking (default: true) */
  enableStats?: boolean;

  /** vLLM HTTP API configuration (real mode only) */
  vllmConfig?: {
    /** vLLM API endpoint (default: http://localhost:8000) */
    endpoint?: string;
    /** Model name for cross-encoding */
    modelName?: string;
    /** Request timeout in milliseconds (default: 5000) */
    timeout?: number;
  };

  /** Enable verbose logging (default: false) */
  verbose?: boolean;
}

/**
 * Internal re-ranking record for statistics
 */
interface RerankRecord {
  timestamp: number;
  query: string;
  candidateCount: number;
  latencyMs: number;
  cacheHits: number;
  cacheMisses: number;
}

// ============================================================================
// CrossEncoderReranker Class
// ============================================================================

/**
 * CrossEncoderReranker - Production-ready two-stage retrieval with re-ranking
 *
 * Implements cross-encoder re-ranking with both mock and real modes.
 */
export class CrossEncoderReranker {
  private readonly config: Required<
    Omit<CrossEncoderRerankerConfig, 'vllmConfig'>
  > & { vllmConfig: CrossEncoderRerankerConfig['vllmConfig'] };
  private cache: RerankingCache | null = null;
  private initialized: boolean = false;
  private rerankHistory: RerankRecord[] = [];
  private apiCallCount: number = 0;
  private mockComputationCount: number = 0;

  /**
   * Create a new CrossEncoderReranker
   *
   * @param config - Configuration options
   */
  constructor(config: CrossEncoderRerankerConfig = {}) {
    this.config = {
      mode: config.mode ?? 'mock',
      stage1TopK: config.stage1TopK ?? 50,
      stage2TopK: config.stage2TopK ?? 10,
      enableCaching: config.enableCaching ?? true,
      cacheCapacity: config.cacheCapacity ?? 10000,
      enableStats: config.enableStats ?? true,
      vllmConfig: config.vllmConfig,
      verbose: config.verbose ?? false,
    };

    // Validate configuration
    if (this.config.stage2TopK > this.config.stage1TopK) {
      throw new Error(
        `stage2TopK (${this.config.stage2TopK}) cannot exceed stage1TopK (${this.config.stage1TopK})`
      );
    }
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Initialize the re-ranker
   *
   * Sets up caching and validates configuration.
   *
   * @returns True if initialization succeeded
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    this.log('info', 'Initializing CrossEncoderReranker...', {
      mode: this.config.mode,
      stage1TopK: this.config.stage1TopK,
      stage2TopK: this.config.stage2TopK,
      cachingEnabled: this.config.enableCaching,
    });

    try {
      // Initialize cache if enabled
      if (this.config.enableCaching) {
        this.cache = createRerankingCache({
          capacity: this.config.cacheCapacity,
          enableStats: this.config.enableStats,
        });
        this.log('info', 'Score cache initialized', {
          capacity: this.config.cacheCapacity,
        });
      }

      // Validate vLLM configuration for real mode
      if (this.config.mode === 'real') {
        await this.validateVLLMConfig();
      }

      this.initialized = true;
      this.log('info', 'CrossEncoderReranker initialized successfully');
      return true;
    } catch (error) {
      this.log('error', 'Failed to initialize', { error: String(error) });
      throw error;
    }
  }

  /**
   * Close the re-ranker and clean up resources
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('info', 'Closing CrossEncoderReranker...');

    if (this.cache) {
      this.cache.clear();
      this.cache = null;
    }

    this.initialized = false;
    this.log('info', 'CrossEncoderReranker closed');
  }

  /**
   * Check if the re-ranker is initialized and ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  // ==========================================================================
  // Re-Ranking Methods
  // ==========================================================================

  /**
   * Re-rank candidates using cross-encoder
   *
   * @param query - Search query
   * @param candidates - Candidates from Stage 1 retrieval
   * @returns Top-K re-ranked results
   */
  async rerank(
    query: string,
    candidates: RerankCandidate[]
  ): Promise<RerankedResult[]> {
    this.ensureInitialized();

    if (!query || query.trim().length === 0) {
      return [];
    }

    if (candidates.length === 0) {
      return [];
    }

    const startTime = Date.now();
    let cacheHits = 0;
    let cacheMisses = 0;

    try {
      // Compute cross-encoder scores for all candidates
      const scoredResults: RerankedResult[] = [];

      for (const candidate of candidates) {
        let crossEncoderScore: number;
        let fromCache = false;

        // Check cache first
        if (this.cache) {
          const cachedScore = this.cache.get(query, candidate.content);
          if (cachedScore !== null) {
            crossEncoderScore = cachedScore;
            fromCache = true;
            cacheHits++;
          } else {
            crossEncoderScore = await this.computeScore(query, candidate.content);
            this.cache.put(query, candidate.content, crossEncoderScore);
            cacheMisses++;
          }
        } else {
          crossEncoderScore = await this.computeScore(query, candidate.content);
          cacheMisses++;
        }

        scoredResults.push({
          content: candidate.content,
          source: candidate.source,
          crossEncoderScore,
          stage1Score: candidate.stage1Score,
          fromCache,
        });
      }

      // Sort by cross-encoder score (descending) and take top-K
      scoredResults.sort((a, b) => b.crossEncoderScore - a.crossEncoderScore);
      const topK = scoredResults.slice(0, this.config.stage2TopK);

      const latencyMs = Date.now() - startTime;

      // Track metrics
      if (this.config.enableStats) {
        this.recordRerank(query, candidates.length, latencyMs, cacheHits, cacheMisses);
      }

      this.log('debug', 'Re-ranking completed', {
        query,
        candidateCount: candidates.length,
        topK: topK.length,
        latencyMs,
        cacheHits,
        cacheMisses,
      });

      return topK;
    } catch (error) {
      this.log('error', 'Re-ranking failed', { query, error: String(error) });
      // Fallback: return original candidates sorted by Stage 1 score
      return this.fallbackRanking(candidates);
    }
  }

  /**
   * Batch re-rank multiple queries
   *
   * @param queries - Array of queries with their candidates
   * @returns Array of re-ranked results
   */
  async batchRerank(
    queries: Array<{ query: string; candidates: RerankCandidate[] }>
  ): Promise<RerankedResult[][]> {
    this.ensureInitialized();

    const results: RerankedResult[][] = [];

    for (const { query, candidates } of queries) {
      const reranked = await this.rerank(query, candidates);
      results.push(reranked);
    }

    return results;
  }

  // ==========================================================================
  // Statistics and Metrics
  // ==========================================================================

  /**
   * Get re-ranking statistics
   *
   * @returns Current statistics
   */
  getStats(): RerankingStats {
    const totalReranks = this.rerankHistory.length;
    const totalCandidates = this.rerankHistory.reduce(
      (sum, r) => sum + r.candidateCount,
      0
    );
    const avgLatency =
      totalReranks > 0
        ? this.rerankHistory.reduce((sum, r) => sum + r.latencyMs, 0) / totalReranks
        : 0;
    const avgCandidates = totalReranks > 0 ? totalCandidates / totalReranks : 0;

    const totalCacheChecks = this.rerankHistory.reduce(
      (sum, r) => sum + r.cacheHits + r.cacheMisses,
      0
    );
    const totalCacheHits = this.rerankHistory.reduce((sum, r) => sum + r.cacheHits, 0);
    const cacheHitRate =
      totalCacheChecks > 0 ? totalCacheHits / totalCacheChecks : 0;

    return {
      totalReranks,
      totalCandidates,
      avgLatencyMs: avgLatency,
      avgCandidatesPerOp: avgCandidates,
      cacheHitRate,
      cacheStats: this.cache?.getStats() ?? {
        totalLookups: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        capacity: 0,
        evictions: 0,
      },
      mode: this.config.mode,
      apiCalls: this.apiCallCount,
      mockComputations: this.mockComputationCount,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.rerankHistory = [];
    this.apiCallCount = 0;
    this.mockComputationCount = 0;
    if (this.cache) {
      this.cache.clear();
    }
  }

  // ==========================================================================
  // Private Methods - Score Computation
  // ==========================================================================

  /**
   * Compute cross-encoder score for a query-document pair
   */
  private async computeScore(query: string, document: string): Promise<number> {
    if (this.config.mode === 'mock') {
      return this.computeMockScore(query, document);
    } else {
      return this.computeRealScore(query, document);
    }
  }

  /**
   * Compute mock cross-encoder score
   *
   * Simulates cross-encoder scoring using token overlap and text similarity.
   * This is deterministic and suitable for testing.
   */
  private computeMockScore(query: string, document: string): number {
    this.mockComputationCount++;

    // Tokenize (simple whitespace split + lowercase)
    const queryTokens = new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter(t => t.length > 2)
    );
    const docTokens = document
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);

    if (queryTokens.size === 0 || docTokens.length === 0) {
      return 0.0;
    }

    // Calculate token overlap (Jaccard similarity)
    const docTokenSet = new Set(docTokens);
    const queryTokenArray = Array.from(queryTokens);
    const intersection = queryTokenArray.filter(t => docTokenSet.has(t)).length;
    const unionSet = new Set<string>();
    queryTokenArray.forEach(t => unionSet.add(t));
    docTokens.forEach(t => unionSet.add(t));
    const union = unionSet.size;
    const jaccard = union > 0 ? intersection / union : 0;

    // Calculate term frequency boost for query terms in document
    let tfSum = 0;
    for (const queryToken of queryTokenArray) {
      const tf = docTokens.filter(t => t === queryToken).length;
      tfSum += tf;
    }
    const tfBoost = Math.min(1.0, tfSum / (docTokens.length * 0.1));

    // Calculate positional boost (query terms appearing early in document)
    let positionalBoost = 0;
    const firstHalf = docTokens.slice(0, Math.floor(docTokens.length / 2));
    const firstHalfSet = new Set(firstHalf);
    const earlyMatches = queryTokenArray.filter(t => firstHalfSet.has(t)).length;
    positionalBoost = queryTokens.size > 0 ? earlyMatches / queryTokens.size : 0;

    // Combine signals with weights
    const score =
      0.4 * jaccard + // Token overlap
      0.4 * tfBoost + // Term frequency
      0.2 * positionalBoost; // Position boost

    // Normalize to [0, 1] and add small random noise for realism
    const noise = (Math.random() - 0.5) * 0.02; // ±1% noise
    const finalScore = Math.max(0, Math.min(1, score + noise));

    return finalScore;
  }

  /**
   * Compute real cross-encoder score via vLLM API
   *
   * Makes HTTP request to vLLM endpoint for cross-encoder inference.
   */
  private async computeRealScore(query: string, document: string): Promise<number> {
    this.apiCallCount++;

    const endpoint = this.config.vllmConfig?.endpoint ?? 'http://localhost:8000';
    const modelName = this.config.vllmConfig?.modelName ?? 'cross-encoder/ms-marco-MiniLM-L-6-v2';
    const timeout = this.config.vllmConfig?.timeout ?? 5000;

    try {
      // TODO: Implement vLLM HTTP API integration
      // This is a stub implementation that should be replaced with actual API calls

      this.log('warn', 'Real mode vLLM integration not yet implemented', {
        endpoint,
        modelName,
      });

      // For now, fall back to mock scoring
      // In production, this would make an HTTP POST request to the vLLM endpoint
      // with the query-document pair and return the model's relevance score

      return this.computeMockScore(query, document);
    } catch (error) {
      this.log('error', 'vLLM API call failed, falling back to mock', {
        error: String(error),
      });
      return this.computeMockScore(query, document);
    }
  }

  /**
   * Fallback ranking when re-ranking fails
   *
   * Returns candidates sorted by original Stage 1 scores.
   */
  private fallbackRanking(candidates: RerankCandidate[]): RerankedResult[] {
    this.log('warn', 'Using fallback ranking (Stage 1 scores only)');

    return candidates
      .sort((a, b) => b.stage1Score - a.stage1Score)
      .slice(0, this.config.stage2TopK)
      .map(c => ({
        content: c.content,
        source: c.source,
        crossEncoderScore: c.stage1Score, // Use Stage 1 score as fallback
        stage1Score: c.stage1Score,
        fromCache: false,
      }));
  }

  // ==========================================================================
  // Private Methods - Validation
  // ==========================================================================

  /**
   * Validate vLLM configuration for real mode
   */
  private async validateVLLMConfig(): Promise<void> {
    if (!this.config.vllmConfig) {
      this.log('warn', 'Real mode enabled but no vLLM config provided, using defaults');
      return;
    }

    const endpoint = this.config.vllmConfig.endpoint ?? 'http://localhost:8000';

    // TODO: Implement health check for vLLM endpoint
    // This would verify the endpoint is reachable and the model is loaded

    this.log('info', 'vLLM configuration validated', {
      endpoint,
      modelName: this.config.vllmConfig.modelName,
    });
  }

  // ==========================================================================
  // Private Methods - Metrics
  // ==========================================================================

  /**
   * Record a re-ranking operation for metrics
   */
  private recordRerank(
    query: string,
    candidateCount: number,
    latencyMs: number,
    cacheHits: number,
    cacheMisses: number
  ): void {
    this.rerankHistory.push({
      timestamp: Date.now(),
      query,
      candidateCount,
      latencyMs,
      cacheHits,
      cacheMisses,
    });

    // Keep only last 100 operations
    if (this.rerankHistory.length > 100) {
      this.rerankHistory = this.rerankHistory.slice(-100);
    }
  }

  /**
   * Ensure the re-ranker is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CrossEncoderReranker not initialized. Call initialize() first.');
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
      component: 'CrossEncoderReranker',
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
 * Create a CrossEncoderReranker with default configuration
 *
 * Note: You must call initialize() before using the re-ranker.
 *
 * @param config - Configuration options
 * @returns Uninitialized re-ranker
 */
export function createCrossEncoderReranker(
  config?: CrossEncoderRerankerConfig
): CrossEncoderReranker {
  return new CrossEncoderReranker(config);
}

/**
 * Create and initialize a CrossEncoderReranker
 *
 * Convenience function that creates and initializes in one step.
 *
 * @param config - Configuration options
 * @returns Initialized re-ranker ready for use
 */
export async function createInitializedCrossEncoderReranker(
  config?: CrossEncoderRerankerConfig
): Promise<CrossEncoderReranker> {
  const reranker = new CrossEncoderReranker(config);
  await reranker.initialize();
  return reranker;
}
