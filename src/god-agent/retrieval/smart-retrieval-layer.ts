/**
 * Smart Retrieval Layer
 *
 * Phase 1 of RAG Integration - Intelligent corpus retrieval
 *
 * Core Functions:
 * - retrieveContext(): Semantic search for relevant chunks
 * - hybridSearch(): Combine semantic + keyword matching
 * - getRelatedChunks(): Expand context with surrounding chunks
 * - findCrossReferences(): Cross-document concept analysis
 *
 * Features:
 * - LRU query caching (1000 queries)
 * - Parallel retrieval (5 concurrent)
 * - Re-ranking with cross-encoder
 * - Diversity boosting
 */

import {
  ContextChunk,
  RetrievalOptions,
  HybridSearchWeights,
  CrossReference,
  RetrievalStats,
  CacheEntry,
  SmartRetrievalConfig,
  RetrievalDirection,
  RelatedChunksOptions,
  Logger,
  stderrLogger,
} from './types.js';

export class SmartRetrievalLayer {
  private config: SmartRetrievalConfig;
  private cache: Map<string, CacheEntry<ContextChunk[]>>;
  private readonly DEFAULT_MAX_CHUNKS = 10;
  private readonly DEFAULT_MIN_RELEVANCE = 0.35;
  private readonly CACHE_MAX_SIZE = 1000;
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  // Default endpoints
  private readonly EMBEDDING_API_URL: string;
  private readonly CHROMADB_URL: string;
  private COLLECTION_ID: string;
  private collectionResolved = false;
  private readonly logger: Logger;

  constructor(config: SmartRetrievalConfig = {}) {
    this.logger = config.logger || stderrLogger;

    this.config = {
      cache: {
        enabled: true,
        maxSize: this.CACHE_MAX_SIZE,
        ttlMs: this.CACHE_TTL_MS,
        ...config.cache,
      },
      performance: {
        parallelQueries: 5,
        queryTimeout: 30000,
        ...config.performance,
      },
      chromadb: {
        host: 'localhost',
        port: 8001,
        collectionName: 'knowledge_chunks',
        ...config.chromadb,
      },
      embeddingApi: {
        host: 'localhost',
        port: 8000,
        ...config.embeddingApi,
      },
      ...config,
    };

    // Build endpoint URLs
    const embHost = this.config.embeddingApi?.host || 'localhost';
    const embPort = this.config.embeddingApi?.port || 8000;
    this.EMBEDDING_API_URL = `http://${embHost}:${embPort}`;

    const chromaHost = this.config.chromadb?.host || 'localhost';
    const chromaPort = this.config.chromadb?.port || 8001;
    this.CHROMADB_URL = `http://${chromaHost}:${chromaPort}`;

    // Start with configured ID (if any); will be resolved by name on first use
    this.COLLECTION_ID = this.config.chromadb?.collectionId || '';

    this.cache = new Map();
  }

  /**
   * Resolve collection ID by name via ChromaDB API.
   * If a UUID is also configured, verifies it matches the name-resolved UUID.
   * Called lazily on first retrieval operation.
   */
  private async resolveCollectionId(): Promise<void> {
    if (this.collectionResolved) return;

    const collectionName = this.config.chromadb?.collectionName || 'knowledge_chunks';
    const configuredId = this.config.chromadb?.collectionId;

    try {
      const listUrl = `${this.CHROMADB_URL}/api/v2/tenants/default_tenant/databases/default_database/collections`;
      const resp = await fetch(listUrl);

      if (!resp.ok) {
        if (configuredId) {
          this.logger.warn(`ChromaDB collection list failed (${resp.status}), using configured UUID: ${configuredId}`);
          this.COLLECTION_ID = configuredId;
          this.collectionResolved = true;
          return;
        }
        throw new Error(`ChromaDB collection list failed: ${resp.status}`);
      }

      const collections: Array<{ id: string; name: string }> = await resp.json();
      const match = collections.find(c => c.name === collectionName);

      if (!match) {
        if (configuredId) {
          this.logger.warn(`Collection "${collectionName}" not found by name, using configured UUID: ${configuredId}`);
          this.COLLECTION_ID = configuredId;
          this.collectionResolved = true;
          return;
        }
        throw new Error(`Collection "${collectionName}" not found and no UUID configured`);
      }

      // Name resolved successfully
      if (configuredId && configuredId !== match.id) {
        throw new Error(
          `Collection name "${collectionName}" resolved to UUID ${match.id}, but config specifies UUID ${configuredId} — update config or verify corpus`
        );
      }

      this.COLLECTION_ID = match.id;
      this.logger.info(`ChromaDB collection "${collectionName}" resolved to ${match.id}`);
      this.collectionResolved = true;
    } catch (error) {
      if (configuredId) {
        this.logger.warn(`Collection resolution failed (${error}), using configured UUID: ${configuredId}`);
        this.COLLECTION_ID = configuredId;
        this.collectionResolved = true;
        return;
      }
      throw error;
    }
  }

  /**
   * Retrieve relevant context chunks from corpus
   *
   * @param query - Natural language search query
   * @param options - Retrieval configuration
   * @returns Array of context chunks with metadata
   */
  async retrieveContext(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<ContextChunk[]> {
    const startTime = Date.now();

    // Build retrieval options with defaults
    const opts: Required<RetrievalOptions> = {
      collections: options.collections || [],
      maxChunks: options.maxChunks || this.DEFAULT_MAX_CHUNKS,
      minRelevance: options.minRelevance ?? this.DEFAULT_MIN_RELEVANCE,
      pageContext: options.pageContext || 0,
      diversityBoost: options.diversityBoost ?? true,
      rerank: options.rerank ?? true,
      whereFilter: options.whereFilter || {},
    };

    // Check cache
    const cacheKey = this.buildCacheKey('retrieve', query, opts);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Ensure collection ID is resolved
      await this.resolveCollectionId();

      // Step 1: Semantic search via AgentDB/ChromaDB
      const rawResults = await this.semanticSearch(query, opts);
      this.logger.info(`[SmartRetrievalLayer] Step 1 raw results: ${rawResults.length}, minRelevance: ${opts.minRelevance}`);
      if (rawResults.length > 0) {
        const scores = rawResults.map(c => c.relevanceScore);
        this.logger.info(`[SmartRetrievalLayer] Score range: ${Math.min(...scores).toFixed(4)} to ${Math.max(...scores).toFixed(4)}`);
      }

      // Step 2: Filter by relevance threshold
      const filtered = rawResults.filter(
        (chunk) => chunk.relevanceScore >= opts.minRelevance
      );
      this.logger.info(`[SmartRetrievalLayer] Step 2 after relevance filter: ${filtered.length}`);

      // Step 3: Diversity boosting (avoid redundant chunks)
      const diverse = opts.diversityBoost
        ? this.boostDiversity(filtered)
        : filtered;
      this.logger.info(`[SmartRetrievalLayer] Step 3 after diversity boost: ${diverse.length}`);

      // Step 4: Re-ranking with cross-encoder (if enabled)
      const reranked = opts.rerank
        ? await this.rerankResults(query, diverse)
        : diverse;
      this.logger.info(`[SmartRetrievalLayer] Step 4 after rerank: ${reranked.length}`);

      // Step 5: Limit to max chunks
      const limited = reranked.slice(0, opts.maxChunks);
      this.logger.info(`[SmartRetrievalLayer] Step 5 after limit (${opts.maxChunks}): ${limited.length}`);

      // Step 6: Expand with page context if requested
      const expanded =
        opts.pageContext > 0
          ? await this.expandPageContext(limited, opts.pageContext)
          : limited;

      // Cache results
      this.setCache(cacheKey, expanded);

      return expanded;
    } catch (error) {
      this.logger.error('SmartRetrievalLayer.retrieveContext error:', error);
      return [];
    }
  }

  /**
   * Hybrid search combining semantic and keyword matching
   *
   * @param semanticQuery - Natural language query for semantic search
   * @param keywords - Exact keywords to match
   * @param weights - Balance between semantic and keyword (default: 0.7/0.3)
   * @returns Weighted and merged results
   */
  async hybridSearch(
    semanticQuery: string,
    keywords: string[],
    weights: HybridSearchWeights = { semantic: 0.7, keyword: 0.3 }
  ): Promise<ContextChunk[]> {
    // Validate weights sum to 1.0
    const sum = weights.semantic + weights.keyword;
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error(
        `Weights must sum to 1.0 (got ${sum}). Use {semantic: 0.7, keyword: 0.3}`
      );
    }

    const cacheKey = this.buildCacheKey(
      'hybrid',
      `${semanticQuery}|${keywords.join(',')}`,
      weights
    );
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Ensure collection ID is resolved
      await this.resolveCollectionId();

      // Run semantic and keyword searches in parallel
      const [semanticResults, keywordResults] = await Promise.all([
        this.semanticSearch(semanticQuery, {
          maxChunks: 20,
          minRelevance: 0.6,
        }),
        this.keywordSearch(keywords, { maxChunks: 20 }),
      ]);

      // Merge results with weighted scoring
      const merged = this.mergeResults(
        semanticResults,
        keywordResults,
        weights
      );

      // Sort by weighted score and take top results
      merged.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const topResults = merged.slice(0, this.DEFAULT_MAX_CHUNKS);

      this.setCache(cacheKey, topResults);
      return topResults;
    } catch (error) {
      this.logger.error('SmartRetrievalLayer.hybridSearch error:', error);
      return [];
    }
  }

  /**
   * Get chunks immediately before/after a given chunk
   *
   * @param chunkId - ID of anchor chunk
   * @param options - Direction and count configuration
   * @returns Related chunks in document order
   */
  async getRelatedChunks(
    chunkId: string,
    options: RelatedChunksOptions
  ): Promise<ContextChunk[]> {
    const { direction, count } = options;

    try {
      // Get anchor chunk to extract docId and position
      const anchorChunk = await this.getChunkById(chunkId);
      if (!anchorChunk) {
        throw new Error(`Chunk not found: ${chunkId}`);
      }

      // Parse chunk index from chunk ID (format: docId:index)
      const [docId, indexStr] = chunkId.split(':');
      const anchorIndex = parseInt(indexStr, 10);

      // Determine range based on direction
      let startIndex: number;
      let endIndex: number;

      switch (direction) {
        case 'before':
          startIndex = Math.max(0, anchorIndex - count);
          endIndex = anchorIndex - 1;
          break;
        case 'after':
          startIndex = anchorIndex + 1;
          endIndex = anchorIndex + count;
          break;
        case 'both':
          startIndex = Math.max(0, anchorIndex - count);
          endIndex = anchorIndex + count;
          break;
      }

      // Fetch chunks in range
      const related = await this.getChunksByRange(
        docId,
        startIndex,
        endIndex
      );

      return related;
    } catch (error) {
      this.logger.error('SmartRetrievalLayer.getRelatedChunks error:', error);
      return [];
    }
  }

  /**
   * Find how a concept is discussed across multiple documents
   *
   * @param concept - Concept to cross-reference
   * @param sourceDoc - Primary document
   * @param targetDocs - Documents to compare against
   * @returns Cross-reference analysis
   */
  async findCrossReferences(
    concept: string,
    sourceDoc: string,
    targetDocs: string[]
  ): Promise<CrossReference[]> {
    try {
      // Search source document for concept
      const sourceChunks = await this.retrieveContext(concept, {
        collections: [sourceDoc],
        maxChunks: 5,
      });

      if (sourceChunks.length === 0) {
        return [];
      }

      // Search target documents for same concept
      const targetPromises = targetDocs.map((targetDoc) =>
        this.retrieveContext(concept, {
          collections: [targetDoc],
          maxChunks: 5,
        })
      );

      const targetResults = await Promise.all(targetPromises);

      // Build cross-references
      const crossRefs: CrossReference[] = [];

      for (const sourceChunk of sourceChunks) {
        for (const targetChunks of targetResults) {
          for (const targetChunk of targetChunks) {
            const similarity = await this.computeSimilarity(
              sourceChunk,
              targetChunk
            );

            if (similarity >= 0.7) {
              const relationship = this.classifyRelationship(
                sourceChunk,
                targetChunk,
                similarity
              );

              crossRefs.push({
                concept,
                sourceChunk,
                targetChunk,
                similarity,
                relationship,
                synthesisPrompt: this.buildSynthesisPrompt(
                  concept,
                  sourceChunk,
                  targetChunk,
                  relationship
                ),
              });
            }
          }
        }
      }

      // Sort by similarity
      crossRefs.sort((a, b) => b.similarity - a.similarity);

      return crossRefs;
    } catch (error) {
      this.logger.error('SmartRetrievalLayer.findCrossReferences error:', error);
      return [];
    }
  }

  /**
   * Clear the query cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
  } {
    let totalAccesses = 0;
    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
    }

    const hits = Array.from(this.cache.values()).filter(
      (e) => e.accessCount > 1
    ).length;

    return {
      size: this.cache.size,
      maxSize: this.config.cache?.maxSize || this.CACHE_MAX_SIZE,
      hitRate: this.cache.size > 0 ? hits / this.cache.size : 0,
      totalAccesses,
    };
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Perform semantic search via Embedding API + ChromaDB
   *
   * 1. Get query embedding from embedding API (POST /embed)
   * 2. Query ChromaDB knowledge_chunks collection with embedding
   * 3. Parse and return ContextChunks
   */
  private async semanticSearch(
    query: string,
    options: Partial<RetrievalOptions>
  ): Promise<ContextChunk[]> {
    const maxChunks = options.maxChunks || this.DEFAULT_MAX_CHUNKS;

    this.logger.info(
      `[SmartRetrievalLayer] Semantic search: "${query.slice(0, 50)}..." (max: ${maxChunks})`
    );

    try {
      // Step 1: Get embedding from embedding API
      const embeddingResponse = await fetch(`${this.EMBEDDING_API_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: [query] }),
      });

      if (!embeddingResponse.ok) {
        this.logger.error(
          `[SmartRetrievalLayer] Embedding API error: ${embeddingResponse.status}`
        );
        return [];
      }

      const embeddingResult = await embeddingResponse.json();
      const queryEmbedding = embeddingResult.embeddings?.[0];

      if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
        this.logger.error('[SmartRetrievalLayer] Invalid embedding response');
        return [];
      }

      // Step 2: Query ChromaDB knowledge_chunks collection
      const chromaQueryUrl = `${this.CHROMADB_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${this.COLLECTION_ID}/query`;

      const queryBody: Record<string, unknown> = {
        query_embeddings: [queryEmbedding],
        n_results: maxChunks * 2, // Get extra for filtering
        include: ['documents', 'metadatas', 'distances'],
      };
      // Add where filter if provided (e.g., author-targeted queries)
      const whereFilter = options.whereFilter;
      if (whereFilter && Object.keys(whereFilter).length > 0) {
        queryBody.where = whereFilter;
      }

      const chromaResponse = await fetch(chromaQueryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryBody),
      });

      if (!chromaResponse.ok) {
        const errorText = await chromaResponse.text();
        this.logger.error(
          `[SmartRetrievalLayer] ChromaDB query error: ${chromaResponse.status} - ${errorText}`
        );
        return [];
      }

      const chromaResult = await chromaResponse.json();

      // Step 3: Parse results into ContextChunks
      const ids = chromaResult.ids?.[0] || [];
      const documents = chromaResult.documents?.[0] || [];
      const metadatas = chromaResult.metadatas?.[0] || [];
      const distances = chromaResult.distances?.[0] || [];

      const chunks: ContextChunk[] = [];

      for (let i = 0; i < ids.length; i++) {
        const metadata = metadatas[i] || {};
        // Convert L2 distance to cosine similarity for normalized embeddings
        // For unit-norm vectors: cosine_sim = 1 - L2²/2
        const distance = distances[i] || 0;
        const relevanceScore = Math.max(0, 1 - (distance * distance) / 2);

        chunks.push({
          chunkId: ids[i],
          docId: metadata.doc_id || metadata.docId || ids[i],
          content: documents[i] || '',
          metadata: {
            author: metadata.author_raw || metadata.author || 'Unknown',
            title: metadata.title_raw || metadata.title || 'Unknown',
            year: metadata.year || 0,
            page_start: metadata.page_start || 0,
            page_end: metadata.page_end || 0,
            collection: metadata.collection || 'knowledge_chunks',
            doc_id: metadata.doc_id,
            chunk_index: metadata.chunk_index,
            path_rel: metadata.path_rel,
            content_type: metadata.content_type,
          },
          relevanceScore,
        });
      }

      this.logger.info(
        `[SmartRetrievalLayer] Found ${chunks.length} chunks from ChromaDB`
      );

      return chunks;
    } catch (error) {
      this.logger.error('[SmartRetrievalLayer] Semantic search error:', error);
      return [];
    }
  }

  /**
   * Perform keyword search using ChromaDB's full-text search
   */
  private async keywordSearch(
    keywords: string[],
    options: { maxChunks: number }
  ): Promise<ContextChunk[]> {
    this.logger.info(
      `[SmartRetrievalLayer] Keyword search: ${keywords.join(', ')}`
    );

    try {
      // Use ChromaDB's get with where_document for keyword matching
      const chromaGetUrl = `${this.CHROMADB_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${this.COLLECTION_ID}/get`;

      const allChunks: ContextChunk[] = [];
      const seenIds = new Set<string>();

      // Search for each keyword
      for (const keyword of keywords.slice(0, 3)) {
        // Limit to 3 keywords
        if (keyword.length < 3) continue;

        const response = await fetch(chromaGetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            where_document: { $contains: keyword },
            limit: options.maxChunks,
            include: ['documents', 'metadatas'],
          }),
        });

        if (!response.ok) continue;

        const result = await response.json();
        const ids = result.ids || [];
        const documents = result.documents || [];
        const metadatas = result.metadatas || [];

        for (let i = 0; i < ids.length; i++) {
          if (seenIds.has(ids[i])) continue;
          seenIds.add(ids[i]);

          const metadata = metadatas[i] || {};
          const content = (documents[i] || '').toLowerCase();

          // Calculate keyword match score
          const matchCount = keywords.filter(
            (k) => k.length >= 3 && content.includes(k.toLowerCase())
          ).length;
          const relevanceScore = Math.min(1, matchCount / keywords.length);

          allChunks.push({
            chunkId: ids[i],
            docId: metadata.doc_id || metadata.docId || ids[i],
            content: documents[i] || '',
            metadata: {
              author: metadata.author_raw || metadata.author || 'Unknown',
              title: metadata.title_raw || metadata.title || 'Unknown',
              year: metadata.year || 0,
              page_start: metadata.page_start || 0,
              page_end: metadata.page_end || 0,
              collection: metadata.collection || 'knowledge_chunks',
            },
            relevanceScore,
          });
        }
      }

      // Sort by relevance and limit
      allChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

      this.logger.info(
        `[SmartRetrievalLayer] Keyword search found ${allChunks.length} chunks`
      );

      return allChunks.slice(0, options.maxChunks);
    } catch (error) {
      this.logger.error('[SmartRetrievalLayer] Keyword search error:', error);
      return [];
    }
  }

  /**
   * Get single chunk by ID
   */
  private async getChunkById(chunkId: string): Promise<ContextChunk | null> {
    // TODO: Implement AgentDB chunk retrieval by ID
    return null;
  }

  /**
   * Get chunks by document ID and index range
   */
  private async getChunksByRange(
    docId: string,
    startIndex: number,
    endIndex: number
  ): Promise<ContextChunk[]> {
    // TODO: Implement range query
    return [];
  }

  /**
   * Boost diversity to avoid redundant chunks
   */
  private boostDiversity(chunks: ContextChunk[]): ContextChunk[] {
    if (chunks.length <= 1) return chunks;

    // Phase 1: Author-aware selection — prevent any single author from dominating.
    // Cap each author to ~30% of total requested chunks (min 3), then backfill with overflow.
    const authorCounts = new Map<string, number>();
    const maxPerAuthor = Math.max(Math.ceil(chunks.length * 0.3), 3);
    const authorCapped: ContextChunk[] = [];
    const overflow: ContextChunk[] = [];

    for (const chunk of chunks) {
      const author = (chunk.metadata.author || 'unknown').toLowerCase();
      const count = authorCounts.get(author) || 0;
      if (count < maxPerAuthor) {
        authorCapped.push(chunk);
        authorCounts.set(author, count + 1);
      } else {
        overflow.push(chunk);
      }
    }

    // Backfill with overflow if we don't have enough
    const combined = [...authorCapped, ...overflow];

    // Phase 2: Content-similarity deduplication (original logic)
    const diverse: ContextChunk[] = [combined[0]];
    const SIMILARITY_THRESHOLD = 0.85;

    for (let i = 1; i < combined.length; i++) {
      const candidate = combined[i];
      let tooSimilar = false;

      for (const existing of diverse) {
        const similarity = this.simpleSimilarity(
          candidate.content,
          existing.content
        );

        if (similarity > SIMILARITY_THRESHOLD) {
          tooSimilar = true;
          break;
        }
      }

      if (!tooSimilar) {
        diverse.push(candidate);
      }
    }

    return diverse;
  }

  /**
   * Simple text similarity (Jaccard)
   */
  private simpleSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...words1].filter((word) => words2.has(word))
    );
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Re-rank results with cross-encoder
   */
  private async rerankResults(
    query: string,
    chunks: ContextChunk[]
  ): Promise<ContextChunk[]> {
    // TODO: Implement cross-encoder re-ranking
    // For now, return as-is
    return chunks;
  }

  /**
   * Expand context with surrounding pages
   */
  private async expandPageContext(
    chunks: ContextChunk[],
    pageContext: number
  ): Promise<ContextChunk[]> {
    // TODO: Implement page context expansion
    // For now, return as-is
    return chunks;
  }

  /**
   * Merge semantic and keyword results with weighting
   */
  private mergeResults(
    semanticResults: ContextChunk[],
    keywordResults: ContextChunk[],
    weights: HybridSearchWeights
  ): ContextChunk[] {
    const merged = new Map<string, ContextChunk>();

    // Fix 29: When keyword results are empty, return semantic results at full score.
    // Without this fix, semantic scores get multiplied by 0.7 (semantic weight),
    // dropping chunks below minRelevance even though they had good semantic matches.
    if (keywordResults.length === 0) {
      return semanticResults;
    }
    if (semanticResults.length === 0) {
      return keywordResults;
    }

    // Add semantic results with weighted scores
    for (const chunk of semanticResults) {
      const weighted = {
        ...chunk,
        relevanceScore: chunk.relevanceScore * weights.semantic,
      };
      merged.set(chunk.chunkId, weighted);
    }

    // Add/update with keyword results
    for (const chunk of keywordResults) {
      const existing = merged.get(chunk.chunkId);
      if (existing) {
        // Chunk appears in both - combine scores
        existing.relevanceScore += chunk.relevanceScore * weights.keyword;
      } else {
        // New chunk from keyword search
        const weighted = {
          ...chunk,
          relevanceScore: chunk.relevanceScore * weights.keyword,
        };
        merged.set(chunk.chunkId, weighted);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Compute semantic similarity between two chunks
   */
  private async computeSimilarity(
    chunk1: ContextChunk,
    chunk2: ContextChunk
  ): Promise<number> {
    // TODO: Implement embedding-based similarity
    // For now, use simple text similarity
    return this.simpleSimilarity(chunk1.content, chunk2.content);
  }

  /**
   * Classify relationship between chunks
   */
  private classifyRelationship(
    sourceChunk: ContextChunk,
    targetChunk: ContextChunk,
    similarity: number
  ): CrossReference['relationship'] {
    // TODO: Implement smarter classification
    // For now, use simple heuristics

    if (similarity > 0.9) return 'agrees';
    if (similarity > 0.8) return 'extends';
    if (similarity > 0.7) return 'related';

    return 'related';
  }

  /**
   * Build synthesis prompt for cross-reference
   */
  private buildSynthesisPrompt(
    concept: string,
    sourceChunk: ContextChunk,
    targetChunk: ContextChunk,
    relationship: CrossReference['relationship']
  ): string {
    return `Synthesize the following two perspectives on "${concept}":

SOURCE (${sourceChunk.metadata.author}, ${sourceChunk.metadata.year}, p.${sourceChunk.metadata.page_start}):
${sourceChunk.content.slice(0, 500)}...

TARGET (${targetChunk.metadata.author}, ${targetChunk.metadata.year}, p.${targetChunk.metadata.page_start}):
${targetChunk.content.slice(0, 500)}...

These chunks have a "${relationship}" relationship. Synthesize their perspectives into a coherent analysis.`;
  }

  /**
   * Build cache key from query and options
   */
  private buildCacheKey(prefix: string, query: string, options: any): string {
    const optionsStr = JSON.stringify(options);
    return `${prefix}:${query}:${optionsStr}`;
  }

  /**
   * Get from cache (with TTL check)
   */
  private getFromCache(key: string): ContextChunk[] | null {
    if (!this.config.cache?.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    const now = Date.now();
    const ttl = this.config.cache.ttlMs || this.CACHE_TTL_MS;
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccess = now;

    return entry.data;
  }

  /**
   * Set cache (with LRU eviction)
   */
  private setCache(key: string, data: ContextChunk[]): void {
    if (!this.config.cache?.enabled) return;

    const maxSize = this.config.cache.maxSize || this.CACHE_MAX_SIZE;

    // Evict oldest entry if at capacity
    if (this.cache.size >= maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [k, entry] of this.cache.entries()) {
        if (entry.lastAccess < oldestTime) {
          oldestTime = entry.lastAccess;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    // Add new entry
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccess: now,
    });
  }
}
