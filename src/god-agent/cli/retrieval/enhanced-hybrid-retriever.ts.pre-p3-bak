/**
 * Enhanced Hybrid Retriever - Query Expansion + Multi-Query RRF Fusion
 *
 * Phase H Enhancement (Task #9) - Extends base HybridRetriever with:
 * 1. Query Expansion - Generate 3-5 query variations
 * 2. Multi-Query RRF Fusion - Fuse results from all variations
 * 3. Cross-Encoder Reranking - Optional final reranking
 * 4. Semantic Query Understanding - Academic terminology expansion
 *
 * Performance Target: 15%+ MRR improvement over base hybrid retriever
 *
 * @module enhanced-hybrid-retriever
 */

import { HybridRetriever, HybridResult, HybridRetrieverConfig, RetrievalStats } from './hybrid-retriever.js';
import { RerankingCache, CacheStats } from './reranking-cache.js';
import type { ColdContextAccessor } from '../context/tiered-context-manager.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Query expansion strategy
 */
export type QueryExpansionStrategy =
  | 'synonym'        // Replace words with synonyms
  | 'phrase'         // Generate phrase variations
  | 'academic'       // Expand with academic terminology
  | 'conceptual'     // Add conceptual context
  | 'all';           // Combine all strategies

/**
 * Expanded query with metadata
 */
export interface ExpandedQuery {
  /** The expanded query text */
  text: string;
  /** Strategy used to generate this variation */
  strategy: QueryExpansionStrategy;
  /** Confidence/weight for this variation (0-1) */
  weight: number;
  /** Whether this is the original query */
  isOriginal: boolean;
}

/**
 * Query expansion result
 */
export interface QueryExpansionResult {
  /** Original query */
  original: string;
  /** All expanded queries (including original) */
  expanded: ExpandedQuery[];
  /** Expansion statistics */
  stats: {
    totalVariations: number;
    strategiesUsed: QueryExpansionStrategy[];
    expansionTimeMs: number;
  };
}

/**
 * Enhanced retrieval result with multi-query provenance
 */
export interface EnhancedHybridResult extends HybridResult {
  /** Which query variations found this result */
  foundByQueries: string[];
  /** Number of query variations that found this result */
  queryOverlap: number;
  /** Cross-encoder score (if reranking enabled) */
  crossEncoderScore?: number;
}

/**
 * Enhanced retrieval statistics
 */
export interface EnhancedRetrievalStats extends RetrievalStats {
  /** Number of query variations used */
  queryVariations: number;
  /** Average results per query variation */
  avgResultsPerQuery: number;
  /** Query expansion time in ms */
  expansionTimeMs: number;
  /** Reranking time in ms (if applicable) */
  rerankingTimeMs?: number;
  /** Cache hit rate */
  cacheHitRate?: number;
}

/**
 * Enhanced hybrid retriever configuration
 */
export interface EnhancedHybridRetrieverConfig extends HybridRetrieverConfig {
  /** Query expansion settings */
  queryExpansion?: {
    /** Whether to enable query expansion (default: true) */
    enabled?: boolean;
    /** Maximum number of expanded queries (default: 5) */
    maxVariations?: number;
    /** Strategies to use (default: ['synonym', 'phrase', 'academic']) */
    strategies?: QueryExpansionStrategy[];
    /** Minimum weight for expanded queries (default: 0.5) */
    minWeight?: number;
  };

  /** Cross-encoder reranking settings */
  reranking?: {
    /** Whether to enable cross-encoder reranking (default: false) */
    enabled?: boolean;
    /** Number of candidates to rerank (default: 20) */
    rerankTopK?: number;
    /** Reranking model endpoint (if using remote model) */
    modelEndpoint?: string;
  };

  /** Cache settings */
  cache?: {
    /** Whether to enable caching (default: true) */
    enabled?: boolean;
    /** Maximum cache entries (default: 10000) */
    capacity?: number;
  };
}

/**
 * Cross-encoder scoring function signature
 */
export type CrossEncoderFn = (query: string, documents: string[]) => Promise<number[]>;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EXPANSION_CONFIG = {
  enabled: true,
  maxVariations: 5,
  strategies: ['synonym', 'phrase', 'academic'] as QueryExpansionStrategy[],
  minWeight: 0.5,
};

const DEFAULT_RERANKING_CONFIG = {
  enabled: false,
  rerankTopK: 20,
};

const DEFAULT_CACHE_CONFIG = {
  enabled: true,
  capacity: 10000,
};

// Academic domain synonyms and expansions
const ACADEMIC_EXPANSIONS: Record<string, string[]> = {
  // Game studies terminology
  'video game': ['digital game', 'interactive game', 'computer game', 'ludic system'],
  'player': ['user', 'participant', 'agent', 'interactor', 'gamer'],
  'gameplay': ['ludic activity', 'game mechanics', 'interactive experience', 'play session'],
  'immersion': ['presence', 'engagement', 'absorption', 'flow state', 'transportation'],
  'narrative': ['story', 'diegesis', 'plot', 'storytelling', 'narration'],

  // Phenomenology terminology
  'experience': ['phenomenal experience', 'lived experience', 'Erlebnis', 'consciousness'],
  'perception': ['apperception', 'sensory awareness', 'phenomenal perception'],
  'imagination': ['phantasia', 'imaginative consciousness', 'mental imagery', 'fancy'],
  'consciousness': ['awareness', 'phenomenal awareness', 'intentionality'],
  'embodiment': ['corporeality', 'bodily experience', 'flesh', 'lived body'],

  // Philosophy terminology
  'aesthetic': ['esthetic', 'artistic', 'sensory', 'perceptual'],
  'ontology': ['being', 'existence', 'metaphysics'],
  'epistemology': ['knowledge', 'cognition', 'understanding'],
  'phenomenology': ['phenomenological analysis', 'descriptive psychology'],

  // General academic
  'analysis': ['examination', 'investigation', 'study', 'inquiry'],
  'theory': ['framework', 'model', 'conceptualization', 'paradigm'],
  'methodology': ['method', 'approach', 'technique', 'procedure'],
  'literature': ['scholarship', 'research', 'studies', 'corpus'],
};

// Phrase variations patterns
const PHRASE_PATTERNS: Array<{ pattern: RegExp; variations: (match: string) => string[] }> = [
  {
    pattern: /the (\w+) of (\w+)/i,
    variations: (match) => {
      const [, noun1, noun2] = match.match(/the (\w+) of (\w+)/i) || [];
      return [
        `${noun1} in ${noun2}`,
        `${noun2}'s ${noun1}`,
        `${noun1} and ${noun2}`,
      ];
    },
  },
  {
    pattern: /(\w+) and (\w+)/i,
    variations: (match) => {
      const [, word1, word2] = match.match(/(\w+) and (\w+)/i) || [];
      return [
        `${word1} with ${word2}`,
        `${word2} and ${word1}`,
        `${word1}, ${word2}`,
      ];
    },
  },
  {
    pattern: /how (\w+)/i,
    variations: (match) => {
      const [, word] = match.match(/how (\w+)/i) || [];
      return [
        `the way ${word}`,
        `${word} mechanism`,
        `${word} process`,
      ];
    },
  },
];

// ============================================================================
// EnhancedHybridRetriever Class
// ============================================================================

/**
 * Enhanced Hybrid Retriever with Query Expansion and Multi-Query Fusion
 */
export class EnhancedHybridRetriever {
  private baseRetriever: HybridRetriever;
  private cache: RerankingCache | null = null;
  private crossEncoderFn: CrossEncoderFn | null = null;
  private config: {
    queryExpansion: Required<NonNullable<EnhancedHybridRetrieverConfig['queryExpansion']>>;
    reranking: Required<NonNullable<EnhancedHybridRetrieverConfig['reranking']>>;
    cache: Required<NonNullable<EnhancedHybridRetrieverConfig['cache']>>;
  };
  private initialized = false;

  constructor(config: EnhancedHybridRetrieverConfig = {}) {
    this.baseRetriever = new HybridRetriever(config);

    this.config = {
      queryExpansion: {
        ...DEFAULT_EXPANSION_CONFIG,
        ...config.queryExpansion,
      },
      reranking: {
        ...DEFAULT_RERANKING_CONFIG,
        ...config.reranking,
      },
      cache: {
        ...DEFAULT_CACHE_CONFIG,
        ...config.cache,
      },
    };

    if (this.config.cache.enabled) {
      this.cache = new RerankingCache({ capacity: this.config.cache.capacity });
    }
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Initialize the enhanced retriever
   */
  async initialize(
    coldAccessor: ColdContextAccessor,
    crossEncoderFn?: CrossEncoderFn
  ): Promise<void> {
    if (this.initialized) return;

    await this.baseRetriever.initialize(coldAccessor);
    this.crossEncoderFn = crossEncoderFn || null;
    this.initialized = true;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.initialized && this.baseRetriever.isReady();
  }

  /**
   * Set cross-encoder function for reranking
   */
  setCrossEncoder(fn: CrossEncoderFn): void {
    this.crossEncoderFn = fn;
  }

  // ==========================================================================
  // Query Expansion
  // ==========================================================================

  /**
   * Expand a query into multiple variations
   */
  expandQuery(query: string): QueryExpansionResult {
    const startTime = Date.now();
    const expanded: ExpandedQuery[] = [];
    const strategiesUsed: QueryExpansionStrategy[] = [];

    // Always include original query with highest weight
    expanded.push({
      text: query,
      strategy: 'all',
      weight: 1.0,
      isOriginal: true,
    });

    // Skip expansion for empty queries or when expansion is disabled
    if (!this.config.queryExpansion.enabled || !query || query.trim().length === 0) {
      return {
        original: query,
        expanded,
        stats: {
          totalVariations: 1,
          strategiesUsed: [],
          expansionTimeMs: Date.now() - startTime,
        },
      };
    }

    const strategies = this.config.queryExpansion.strategies;
    const maxVariations = this.config.queryExpansion.maxVariations;

    // Apply each strategy
    if (strategies.includes('synonym') || strategies.includes('all')) {
      const synonymVariations = this.generateSynonymVariations(query);
      expanded.push(...synonymVariations);
      if (synonymVariations.length > 0) strategiesUsed.push('synonym');
    }

    if (strategies.includes('phrase') || strategies.includes('all')) {
      const phraseVariations = this.generatePhraseVariations(query);
      expanded.push(...phraseVariations);
      if (phraseVariations.length > 0) strategiesUsed.push('phrase');
    }

    if (strategies.includes('academic') || strategies.includes('all')) {
      const academicVariations = this.generateAcademicVariations(query);
      expanded.push(...academicVariations);
      if (academicVariations.length > 0) strategiesUsed.push('academic');
    }

    if (strategies.includes('conceptual') || strategies.includes('all')) {
      const conceptualVariations = this.generateConceptualVariations(query);
      expanded.push(...conceptualVariations);
      if (conceptualVariations.length > 0) strategiesUsed.push('conceptual');
    }

    // Limit to max variations (keeping highest weights)
    expanded.sort((a, b) => b.weight - a.weight);
    const limited = expanded.slice(0, maxVariations);

    return {
      original: query,
      expanded: limited,
      stats: {
        totalVariations: limited.length,
        strategiesUsed,
        expansionTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Generate synonym-based variations
   */
  private generateSynonymVariations(query: string): ExpandedQuery[] {
    const variations: ExpandedQuery[] = [];
    const words = query.toLowerCase().split(/\s+/);
    const usedVariations = new Set<string>();

    for (const [term, synonyms] of Object.entries(ACADEMIC_EXPANSIONS)) {
      if (query.toLowerCase().includes(term)) {
        for (const synonym of synonyms.slice(0, 2)) {
          const variation = query.replace(new RegExp(term, 'gi'), synonym);
          if (!usedVariations.has(variation.toLowerCase()) && variation !== query) {
            usedVariations.add(variation.toLowerCase());
            variations.push({
              text: variation,
              strategy: 'synonym',
              weight: 0.8,
              isOriginal: false,
            });
          }
        }
      }
    }

    return variations;
  }

  /**
   * Generate phrase-based variations
   */
  private generatePhraseVariations(query: string): ExpandedQuery[] {
    const variations: ExpandedQuery[] = [];
    const usedVariations = new Set<string>();

    for (const { pattern, variations: getVariations } of PHRASE_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        const phraseVariations = getVariations(match[0]);
        for (const pv of phraseVariations.slice(0, 1)) {
          const variation = query.replace(pattern, pv);
          if (!usedVariations.has(variation.toLowerCase()) && variation !== query) {
            usedVariations.add(variation.toLowerCase());
            variations.push({
              text: variation,
              strategy: 'phrase',
              weight: 0.7,
              isOriginal: false,
            });
          }
        }
      }
    }

    return variations;
  }

  /**
   * Generate academic terminology variations
   */
  private generateAcademicVariations(query: string): ExpandedQuery[] {
    const variations: ExpandedQuery[] = [];

    // Add "in games" / "in video games" context if not present
    if (!query.toLowerCase().includes('game')) {
      variations.push({
        text: `${query} in video games`,
        strategy: 'academic',
        weight: 0.6,
        isOriginal: false,
      });
    }

    // Add "theory" or "theoretical framework" if discussing concepts
    const conceptualTerms = ['experience', 'perception', 'consciousness', 'imagination', 'aesthetic'];
    for (const term of conceptualTerms) {
      if (query.toLowerCase().includes(term) && !query.toLowerCase().includes('theory')) {
        variations.push({
          text: `${term} theory ${query.replace(new RegExp(term, 'gi'), '')}`.trim(),
          strategy: 'academic',
          weight: 0.6,
          isOriginal: false,
        });
        break;
      }
    }

    return variations;
  }

  /**
   * Generate conceptual variations
   */
  private generateConceptualVariations(query: string): ExpandedQuery[] {
    const variations: ExpandedQuery[] = [];

    // Extract key concepts and create focused queries
    const keyTerms = this.extractKeyTerms(query);
    if (keyTerms.length >= 2) {
      // Create a query focusing on relationship between terms
      variations.push({
        text: `relationship between ${keyTerms[0]} and ${keyTerms[1]}`,
        strategy: 'conceptual',
        weight: 0.65,
        isOriginal: false,
      });
    }

    return variations;
  }

  /**
   * Extract key terms from query
   */
  private extractKeyTerms(query: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    ]);

    const words = query.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 3 && !stopWords.has(w));
  }

  // ==========================================================================
  // Search Methods
  // ==========================================================================

  /**
   * Enhanced search with query expansion and multi-query fusion
   */
  async search(query: string, topK: number = 5): Promise<EnhancedHybridResult[]> {
    this.ensureInitialized();

    if (!query || query.trim().length === 0) {
      return [];
    }

    const startTime = Date.now();

    // Expand query
    const expansion = this.expandQuery(query);

    // Search with all query variations in parallel
    const searchPromises = expansion.expanded.map(async (eq) => {
      const results = await this.baseRetriever.search(eq.text, topK * 2);
      return { query: eq, results };
    });

    const allSearchResults = await Promise.all(searchPromises);

    // Fuse results from all queries
    const fusedResults = this.fuseMultiQueryResults(allSearchResults, topK * 2);

    // Optional: Rerank with cross-encoder
    let finalResults = fusedResults;
    let rerankingTimeMs: number | undefined;

    if (this.config.reranking.enabled && this.crossEncoderFn) {
      const rerankStart = Date.now();
      finalResults = await this.rerankWithCrossEncoder(
        query,
        fusedResults.slice(0, this.config.reranking.rerankTopK)
      );
      rerankingTimeMs = Date.now() - rerankStart;
    }

    return finalResults.slice(0, topK);
  }

  /**
   * Search without query expansion (for comparison)
   */
  async searchWithoutExpansion(query: string, topK: number = 5): Promise<HybridResult[]> {
    this.ensureInitialized();
    return this.baseRetriever.search(query, topK);
  }

  /**
   * Get enhanced retrieval statistics
   */
  async getEnhancedStats(query: string, topK: number = 5): Promise<EnhancedRetrievalStats> {
    const startTime = Date.now();

    // Get base stats
    const baseStats = await this.baseRetriever.getRetrievalStats(query, topK);

    // Get expansion info
    const expansion = this.expandQuery(query);

    // Search all variations
    const allResults: HybridResult[] = [];
    for (const eq of expansion.expanded) {
      const results = await this.baseRetriever.search(eq.text, topK);
      allResults.push(...results);
    }

    const totalTime = Date.now() - startTime;

    return {
      ...baseStats,
      queryVariations: expansion.expanded.length,
      avgResultsPerQuery: allResults.length / expansion.expanded.length,
      expansionTimeMs: expansion.stats.expansionTimeMs,
      latencyMs: totalTime,
      cacheHitRate: this.cache?.getStats().hitRate,
    };
  }

  // ==========================================================================
  // Multi-Query Fusion
  // ==========================================================================

  /**
   * Fuse results from multiple query variations
   */
  private fuseMultiQueryResults(
    searchResults: Array<{ query: ExpandedQuery; results: HybridResult[] }>,
    topK: number
  ): EnhancedHybridResult[] {
    // Build a map of content -> aggregated result
    const resultMap = new Map<string, {
      result: HybridResult;
      queries: string[];
      weightedScoreSum: number;
      totalWeight: number;
    }>();

    for (const { query, results } of searchResults) {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const key = this.getResultKey(result);

        if (resultMap.has(key)) {
          const existing = resultMap.get(key)!;
          existing.queries.push(query.text);
          existing.weightedScoreSum += result.relevanceScore * query.weight;
          existing.totalWeight += query.weight;
        } else {
          resultMap.set(key, {
            result,
            queries: [query.text],
            weightedScoreSum: result.relevanceScore * query.weight,
            totalWeight: query.weight,
          });
        }
      }
    }

    // Convert to enhanced results with multi-query scoring
    const enhancedResults: EnhancedHybridResult[] = [];

    for (const [, data] of resultMap) {
      const avgWeightedScore = data.weightedScoreSum / data.totalWeight;

      // Boost score based on query overlap (more queries = more relevant)
      const overlapBoost = 1 + (data.queries.length - 1) * 0.1;
      const boostedScore = Math.min(1, avgWeightedScore * overlapBoost);

      enhancedResults.push({
        ...data.result,
        relevanceScore: boostedScore,
        foundByQueries: data.queries,
        queryOverlap: data.queries.length,
      });
    }

    // Sort by boosted score
    enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return enhancedResults.slice(0, topK);
  }

  /**
   * Generate a unique key for a result
   */
  private getResultKey(result: HybridResult): string {
    return `${result.source}:${result.content.substring(0, 100)}`;
  }

  // ==========================================================================
  // Cross-Encoder Reranking
  // ==========================================================================

  /**
   * Rerank results using cross-encoder
   */
  private async rerankWithCrossEncoder(
    query: string,
    results: EnhancedHybridResult[]
  ): Promise<EnhancedHybridResult[]> {
    if (!this.crossEncoderFn || results.length === 0) {
      return results;
    }

    // Filter out results with no content
    const validResults = results.filter(r => r.content && r.content.length > 0);
    if (validResults.length === 0) {
      return results;
    }

    // Check cache first
    const cachedResults: EnhancedHybridResult[] = [];
    const uncachedResults: EnhancedHybridResult[] = [];
    const uncachedIndices: number[] = [];

    for (let i = 0; i < validResults.length; i++) {
      const result = validResults[i];
      const cachedScore = this.cache?.get(query, result.content);

      if (cachedScore !== null && cachedScore !== undefined) {
        cachedResults.push({
          ...result,
          crossEncoderScore: cachedScore,
          relevanceScore: cachedScore, // Use cross-encoder score as primary
        });
      } else {
        uncachedResults.push(result);
        uncachedIndices.push(i);
      }
    }

    // Score uncached results
    if (uncachedResults.length > 0) {
      const documents = uncachedResults.map(r => r.content);
      const scores = await this.crossEncoderFn(query, documents);

      for (let i = 0; i < uncachedResults.length; i++) {
        const result = uncachedResults[i];
        const score = scores[i];

        // Cache the score
        this.cache?.put(query, result.content, score);

        cachedResults.push({
          ...result,
          crossEncoderScore: score,
          relevanceScore: score,
        });
      }
    }

    // Sort by cross-encoder score
    cachedResults.sort((a, b) => (b.crossEncoderScore || 0) - (a.crossEncoderScore || 0));

    return cachedResults;
  }


  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats | null {
    return this.cache?.getStats() || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache?.clear();
  }

  /**
   * Get base retriever stats
   */
  getBaseStats(): ReturnType<HybridRetriever['getStats']> {
    return this.baseRetriever.getStats();
  }

  /**
   * Index documents in the base retriever
   */
  async indexDocuments(documents: Array<{ id: string; content: string; source: string }>): Promise<void> {
    await this.baseRetriever.indexDocuments(documents);
  }

  /**
   * Ensure initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('EnhancedHybridRetriever not initialized. Call initialize() first.');
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an enhanced hybrid retriever with default settings
 */
export function createEnhancedHybridRetriever(
  config?: EnhancedHybridRetrieverConfig
): EnhancedHybridRetriever {
  return new EnhancedHybridRetriever(config);
}

/**
 * Create an enhanced hybrid retriever optimized for academic search
 */
export function createAcademicHybridRetriever(): EnhancedHybridRetriever {
  return new EnhancedHybridRetriever({
    queryExpansion: {
      enabled: true,
      maxVariations: 5,
      strategies: ['synonym', 'academic', 'conceptual'],
      minWeight: 0.5,
    },
    reranking: {
      enabled: false, // Enable when cross-encoder is available
      rerankTopK: 20,
    },
    bm25Weight: 0.4, // Slightly favor semantic for academic content
    candidatesMultiplier: 3,
  });
}

/**
 * Create a fast enhanced hybrid retriever (fewer variations, no reranking)
 */
export function createFastEnhancedRetriever(): EnhancedHybridRetriever {
  return new EnhancedHybridRetriever({
    queryExpansion: {
      enabled: true,
      maxVariations: 3,
      strategies: ['synonym'],
      minWeight: 0.6,
    },
    reranking: {
      enabled: false,
    },
    candidatesMultiplier: 2,
  });
}

/**
 * Create and initialize an enhanced hybrid retriever
 */
export async function createInitializedEnhancedRetriever(
  coldAccessor: ColdContextAccessor,
  config?: EnhancedHybridRetrieverConfig,
  crossEncoderFn?: CrossEncoderFn
): Promise<EnhancedHybridRetriever> {
  const retriever = new EnhancedHybridRetriever(config);
  await retriever.initialize(coldAccessor, crossEncoderFn);
  return retriever;
}
