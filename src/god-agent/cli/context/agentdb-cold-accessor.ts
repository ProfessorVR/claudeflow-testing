/**
 * AgentDBColdContextAccessor - Vector Database-backed Cold Storage for Tiered Context
 *
 * Implements the ColdContextAccessor interface using the god-agent VectorDB
 * for true semantic search capabilities. This replaces the InMemoryColdContextAccessor
 * for production use cases requiring scalable, persistent semantic retrieval.
 *
 * Architecture:
 * =============
 * - Uses VectorDB (HNSW-backed) for vector storage and k-NN search
 * - Uses EmbeddingProxy to generate 1536D embeddings via localhost:8000
 * - Stores metadata (chapter, section, citation info) in a separate Map
 * - Chunks large content before embedding for better retrieval granularity
 *
 * Collections:
 * ============
 * All data is stored in a single VectorDB instance with metadata tracking:
 * - Dissertation chunks (chapters/sections) with source attribution
 * - Citations stored separately for direct lookup
 *
 * Usage:
 * ======
 * ```typescript
 * const accessor = new AgentDBColdContextAccessor({
 *   persistencePath: '.agentdb/dissertation-chunks.bin',
 * });
 *
 * await accessor.initialize();
 *
 * // Index dissertation content
 * await accessor.addChapterContent(1, chapterText);
 * await accessor.addSectionContent(2, 'Literature Review', sectionText);
 * await accessor.addCitation('smith2020', 'Smith, J. (2020). Example. Journal.');
 *
 * // Search semantically
 * const results = await accessor.search('phenomenology of perception', 5);
 *
 * // Clean up
 * await accessor.close();
 * ```
 *
 * @module agentdb-cold-accessor
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { VectorDB } from '../../core/vector-db/vector-db.js';
import { EmbeddingProxy } from '../../core/ucm/desc/embedding-proxy.js';
import { VECTOR_DIM } from '../../core/validation/constants.js';
import type { ColdContextAccessor, RetrievedChunk } from './tiered-context-manager.js';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for AgentDBColdContextAccessor
 */
export interface AgentDBColdAccessorConfig {
  /** Path for vector persistence (default: '.agentdb/dissertation-chunks.bin') */
  persistencePath?: string;
  /** Maximum characters per chunk (default: 1500) */
  maxChunkSize?: number;
  /** Overlap between chunks in characters (default: 200) */
  chunkOverlap?: number;
  /** Embedding service base URL (default: 'http://localhost:8000') */
  embeddingServiceUrl?: string;
  /** Auto-save vectors after modifications (default: true) */
  autoSave?: boolean;
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
}

/**
 * Internal metadata for stored chunks
 */
interface ChunkMetadata {
  /** Unique chunk ID (same as vector ID) */
  id: string;
  /** Source type: 'chapter', 'section', or 'citation' */
  type: 'chapter' | 'section' | 'citation';
  /** Chapter number (for chapters and sections) */
  chapterNum?: number;
  /** Section name (for sections) */
  sectionName?: string;
  /** Citation source ID (for citations) */
  sourceId?: string;
  /** The actual text content */
  content: string;
  /** Chunk index within the source (for multi-chunk sources) */
  chunkIndex: number;
  /** Total chunks for this source */
  totalChunks: number;
  /** Timestamp when added */
  addedAt: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<AgentDBColdAccessorConfig> = {
  persistencePath: '.agentdb/dissertation-chunks.bin',
  maxChunkSize: 1500,
  chunkOverlap: 200,
  embeddingServiceUrl: 'http://localhost:8000',
  autoSave: true,
  verbose: false,
};

// ============================================================================
// AgentDBColdContextAccessor Class
// ============================================================================

/**
 * AgentDBColdContextAccessor - Production-grade semantic search for cold context
 *
 * This class provides semantic search over dissertation content using:
 * - VectorDB with HNSW indexing for fast k-NN search
 * - EmbeddingProxy for 1536D embedding generation
 * - Chunking strategy for large documents
 *
 * Implements the ColdContextAccessor interface for integration with
 * TieredContextManager.
 */
export class AgentDBColdContextAccessor implements ColdContextAccessor {
  private readonly config: Required<AgentDBColdAccessorConfig>;
  private vectorDb: VectorDB | null = null;
  private embeddingProxy: EmbeddingProxy | null = null;
  private metadata: Map<string, ChunkMetadata> = new Map();
  private citations: Map<string, string> = new Map();
  private sectionIndex: Map<string, string[]> = new Map(); // sectionKey -> chunkIds
  private initialized: boolean = false;
  private embeddingAvailable: boolean = false;

  /**
   * Create a new AgentDBColdContextAccessor
   *
   * @param config - Configuration options
   */
  constructor(config: AgentDBColdAccessorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Initialize the accessor
   *
   * Sets up the VectorDB and EmbeddingProxy. Must be called before any
   * other operations.
   *
   * @returns True if initialization succeeded
   * @throws Error if VectorDB initialization fails
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    this.log('info', 'Initializing AgentDBColdContextAccessor...');

    try {
      // Initialize VectorDB
      this.vectorDb = new VectorDB({
        dimension: VECTOR_DIM,
        persistencePath: this.config.persistencePath,
        autoSave: this.config.autoSave,
        verbose: this.config.verbose,
      });

      await this.vectorDb.initialize();
      this.log('info', 'VectorDB initialized', {
        backend: this.vectorDb.getBackendInfo()?.type,
      });

      // Initialize EmbeddingProxy
      this.embeddingProxy = new EmbeddingProxy({
        baseUrl: this.config.embeddingServiceUrl,
      });

      // Check embedding service availability
      this.embeddingAvailable = await this.embeddingProxy.isAvailable();
      if (!this.embeddingAvailable) {
        this.log('warn', 'Embedding service not available - semantic search will be limited');
      } else {
        this.log('info', 'Embedding service available');
      }

      // Try to load existing data
      const loaded = await this.vectorDb.load();
      if (loaded) {
        this.log('info', 'Loaded existing vector data');
      }

      // Load metadata if exists
      await this.loadMetadata();

      this.initialized = true;
      return true;
    } catch (error) {
      this.log('error', 'Failed to initialize', { error: String(error) });
      throw error;
    }
  }

  /**
   * Close the accessor and clean up resources
   *
   * Saves any pending changes and releases resources.
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('info', 'Closing AgentDBColdContextAccessor...');

    try {
      // Save vectors if auto-save is disabled
      if (this.vectorDb && !this.config.autoSave) {
        await this.vectorDb.save();
      }
      // Always save metadata on close
      await this.saveMetadata();
    } catch (error) {
      this.log('warn', 'Error saving on close', { error: String(error) });
    }

    this.vectorDb = null;
    this.embeddingProxy = null;
    this.initialized = false;
    this.embeddingAvailable = false;

    this.log('info', 'AgentDBColdContextAccessor closed');
  }

  /**
   * Check if the accessor is initialized and ready
   */
  isReady(): boolean {
    return this.initialized && this.vectorDb !== null;
  }

  /**
   * Check if embedding service is available
   */
  isEmbeddingAvailable(): boolean {
    return this.embeddingAvailable;
  }

  // ==========================================================================
  // ColdContextAccessor Interface Implementation
  // ==========================================================================

  /**
   * Semantic search across the dissertation content
   *
   * Uses vector similarity search to find relevant chunks.
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

    // If embedding service is unavailable, fall back to keyword search
    if (!this.embeddingAvailable || !this.embeddingProxy) {
      return this.keywordSearch(query, topK);
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingProxy.embed(query);

      // Search VectorDB
      const results = await this.vectorDb!.search(queryEmbedding, topK * 2); // Get extra for deduplication

      // Convert to RetrievedChunk format
      const chunks: RetrievedChunk[] = [];
      const seenSources = new Set<string>();

      for (const result of results) {
        const meta = this.metadata.get(result.id);
        if (!meta) continue;

        // Build source string
        const source = this.buildSourceString(meta);

        // Skip duplicates from same source (multiple chunks)
        if (seenSources.has(source) && chunks.length >= topK) {
          continue;
        }
        seenSources.add(source);

        chunks.push({
          content: meta.content,
          source,
          relevanceScore: result.similarity,
        });

        if (chunks.length >= topK) {
          break;
        }
      }

      return chunks;
    } catch (error) {
      this.log('warn', 'Semantic search failed, falling back to keyword search', {
        error: String(error),
      });
      return this.keywordSearch(query, topK);
    }
  }

  /**
   * Get a citation by source ID
   *
   * @param sourceId - Citation identifier
   * @returns Citation text or null if not found
   */
  async getCitation(sourceId: string): Promise<string | null> {
    return this.citations.get(sourceId) ?? null;
  }

  /**
   * Get full section content by chapter and section name
   *
   * @param chapterNum - Chapter number
   * @param sectionName - Section name
   * @returns Full section content or null if not found
   */
  async getFullSection(chapterNum: number, sectionName: string): Promise<string | null> {
    const sectionKey = `${chapterNum}:${sectionName}`;
    const chunkIds = this.sectionIndex.get(sectionKey);

    if (!chunkIds || chunkIds.length === 0) {
      return null;
    }

    // Reconstruct full content from chunks
    const chunks = chunkIds
      .map(id => this.metadata.get(id))
      .filter((m): m is ChunkMetadata => m !== undefined)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);

    if (chunks.length === 0) {
      return null;
    }

    // For single chunk, return as-is
    if (chunks.length === 1) {
      return chunks[0].content;
    }

    // For multiple chunks, remove overlap and concatenate
    let fullContent = chunks[0].content;
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      // Skip the overlap portion
      const overlapRemoved = chunk.content.substring(this.config.chunkOverlap);
      fullContent += overlapRemoved;
    }

    return fullContent;
  }

  // ==========================================================================
  // Content Ingestion Methods
  // ==========================================================================

  /**
   * Add chapter content to cold storage
   *
   * Chunks the content and stores embeddings for semantic search.
   *
   * @param chapterNum - Chapter number
   * @param content - Full chapter text
   * @returns Number of chunks created
   */
  async addChapterContent(chapterNum: number, content: string): Promise<number> {
    this.ensureInitialized();

    if (!content || content.trim().length === 0) {
      return 0;
    }

    const chunks = this.chunkText(content);
    const chunkIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const id = randomUUID();

      // Store metadata
      const meta: ChunkMetadata = {
        id,
        type: 'chapter',
        chapterNum,
        content: chunk,
        chunkIndex: i,
        totalChunks: chunks.length,
        addedAt: Date.now(),
      };
      this.metadata.set(id, meta);
      chunkIds.push(id);

      // Generate and store embedding
      await this.storeEmbedding(id, chunk);
    }

    // Index for section lookup
    const sectionKey = `${chapterNum}:__chapter__`;
    this.sectionIndex.set(sectionKey, chunkIds);

    // Auto-save metadata
    if (this.config.autoSave) {
      await this.saveMetadata();
    }

    this.log('debug', `Added chapter ${chapterNum}`, { chunks: chunks.length });
    return chunks.length;
  }

  /**
   * Add section content to cold storage
   *
   * @param chapterNum - Chapter number containing the section
   * @param sectionName - Section name/title
   * @param content - Full section text
   * @returns Number of chunks created
   */
  async addSectionContent(
    chapterNum: number,
    sectionName: string,
    content: string
  ): Promise<number> {
    this.ensureInitialized();

    if (!content || content.trim().length === 0) {
      return 0;
    }

    const chunks = this.chunkText(content);
    const chunkIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const id = randomUUID();

      // Store metadata
      const meta: ChunkMetadata = {
        id,
        type: 'section',
        chapterNum,
        sectionName,
        content: chunk,
        chunkIndex: i,
        totalChunks: chunks.length,
        addedAt: Date.now(),
      };
      this.metadata.set(id, meta);
      chunkIds.push(id);

      // Generate and store embedding
      await this.storeEmbedding(id, chunk);
    }

    // Index for section lookup
    const sectionKey = `${chapterNum}:${sectionName}`;
    this.sectionIndex.set(sectionKey, chunkIds);

    // Auto-save metadata
    if (this.config.autoSave) {
      await this.saveMetadata();
    }

    this.log('debug', `Added section ${chapterNum}:${sectionName}`, { chunks: chunks.length });
    return chunks.length;
  }

  /**
   * Add a citation to cold storage
   *
   * Citations are stored separately for direct lookup and also
   * indexed for semantic search.
   *
   * @param sourceId - Citation identifier (e.g., "smith2020")
   * @param citation - Full citation text
   */
  async addCitation(sourceId: string, citation: string): Promise<void> {
    this.ensureInitialized();

    if (!citation || citation.trim().length === 0) {
      return;
    }

    // Store in direct lookup map
    this.citations.set(sourceId, citation);

    // Also store in vector DB for semantic search
    const id = randomUUID();
    const meta: ChunkMetadata = {
      id,
      type: 'citation',
      sourceId,
      content: citation,
      chunkIndex: 0,
      totalChunks: 1,
      addedAt: Date.now(),
    };
    this.metadata.set(id, meta);

    // Generate and store embedding
    await this.storeEmbedding(id, citation);

    // Auto-save metadata
    if (this.config.autoSave) {
      await this.saveMetadata();
    }

    this.log('debug', `Added citation ${sourceId}`);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get statistics about stored content
   */
  getStats(): {
    totalChunks: number;
    chapters: number;
    sections: number;
    citations: number;
    embeddingAvailable: boolean;
  } {
    let chapters = 0;
    let sections = 0;
    const citationCount = this.citations.size;

    for (const key of Array.from(this.sectionIndex.keys())) {
      if (key.endsWith(':__chapter__')) {
        chapters++;
      } else {
        sections++;
      }
    }

    return {
      totalChunks: this.metadata.size,
      chapters,
      sections,
      citations: citationCount,
      embeddingAvailable: this.embeddingAvailable,
    };
  }

  /**
   * Clear all stored content
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    await this.vectorDb!.clear();
    this.metadata.clear();
    this.citations.clear();
    this.sectionIndex.clear();

    this.log('info', 'Cleared all content');
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Get the path for metadata persistence
   */
  private getMetadataPath(): string {
    // Store metadata alongside the vector file with .meta.json suffix
    return this.config.persistencePath.replace(/\.bin$/, '') + '.meta.json';
  }

  /**
   * Save metadata to disk
   */
  private async saveMetadata(): Promise<void> {
    const metadataPath = this.getMetadataPath();
    const data = {
      metadata: Object.fromEntries(this.metadata),
      citations: Object.fromEntries(this.citations),
      sectionIndex: Object.fromEntries(this.sectionIndex),
      savedAt: Date.now(),
    };

    try {
      // Ensure directory exists
      const dir = path.dirname(metadataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
      this.log('debug', 'Saved metadata', { path: metadataPath, chunks: this.metadata.size });
    } catch (error) {
      this.log('warn', 'Failed to save metadata', { error: String(error) });
    }
  }

  /**
   * Load metadata from disk
   */
  private async loadMetadata(): Promise<void> {
    const metadataPath = this.getMetadataPath();

    if (!fs.existsSync(metadataPath)) {
      this.log('debug', 'No existing metadata file found');
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

      // Restore metadata map
      this.metadata = new Map(Object.entries(data.metadata || {}));
      this.citations = new Map(Object.entries(data.citations || {}));
      this.sectionIndex = new Map(
        Object.entries(data.sectionIndex || {}).map(([k, v]) => [k, v as string[]])
      );

      this.log('info', 'Loaded metadata', {
        chunks: this.metadata.size,
        citations: this.citations.size,
        sections: this.sectionIndex.size,
      });
    } catch (error) {
      this.log('warn', 'Failed to load metadata', { error: String(error) });
    }
  }

  /**
   * Ensure the accessor is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.vectorDb) {
      throw new Error('AgentDBColdContextAccessor not initialized. Call initialize() first.');
    }
  }

  /**
   * Store an embedding in VectorDB
   */
  private async storeEmbedding(id: string, text: string): Promise<void> {
    if (!this.embeddingAvailable || !this.embeddingProxy) {
      return;
    }

    try {
      const embedding = await this.embeddingProxy.embed(text);
      await this.vectorDb!.insertWithId(id, embedding);
    } catch (error) {
      this.log('warn', 'Failed to store embedding', { id, error: String(error) });
      // Don't throw - metadata is still stored for keyword fallback
    }
  }

  /**
   * Chunk text into smaller pieces for embedding
   */
  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    const { maxChunkSize, chunkOverlap } = this.config;

    if (text.length <= maxChunkSize) {
      return [text];
    }

    let start = 0;
    while (start < text.length) {
      let end = start + maxChunkSize;

      // Try to break at a sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > start + maxChunkSize / 2) {
          end = breakPoint + 1;
        }
      }

      chunks.push(text.substring(start, Math.min(end, text.length)));
      start = end - chunkOverlap;

      // Prevent infinite loop
      if (start >= text.length - chunkOverlap) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Build a source string for a chunk
   */
  private buildSourceString(meta: ChunkMetadata): string {
    switch (meta.type) {
      case 'chapter':
        return `Chapter ${meta.chapterNum}`;
      case 'section':
        return `Chapter ${meta.chapterNum}, ${meta.sectionName}`;
      case 'citation':
        return `Citation: ${meta.sourceId}`;
      default:
        return 'Unknown source';
    }
  }

  /**
   * Keyword-based fallback search when embedding service is unavailable
   */
  private keywordSearch(query: string, topK: number): RetrievedChunk[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const results: Array<{ meta: ChunkMetadata; score: number }> = [];

    for (const meta of Array.from(this.metadata.values())) {
      const contentLower = meta.content.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (contentLower.includes(term)) {
          score += 1;
          // Boost for exact phrase match
          if (contentLower.includes(query.toLowerCase())) {
            score += 2;
          }
        }
      }

      if (score > 0) {
        results.push({ meta, score: score / queryTerms.length });
      }
    }

    // Sort by score and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => ({
        content: r.meta.content,
        source: this.buildSourceString(r.meta),
        relevanceScore: r.score,
      }));
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
      component: 'AgentDBColdContextAccessor',
      message,
      ...context,
    };

    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else if (this.config.verbose) {
      console.log(JSON.stringify(entry));
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an AgentDBColdContextAccessor with default configuration
 *
 * Note: You must call initialize() before using the accessor.
 *
 * @param config - Optional configuration overrides
 * @returns Uninitialized accessor
 */
export function createAgentDBColdAccessor(
  config?: AgentDBColdAccessorConfig
): AgentDBColdContextAccessor {
  return new AgentDBColdContextAccessor(config);
}

/**
 * Create and initialize an AgentDBColdContextAccessor
 *
 * Convenience function that creates and initializes in one step.
 *
 * @param config - Optional configuration overrides
 * @returns Initialized accessor ready for use
 */
export async function createInitializedAgentDBColdAccessor(
  config?: AgentDBColdAccessorConfig
): Promise<AgentDBColdContextAccessor> {
  const accessor = new AgentDBColdContextAccessor(config);
  await accessor.initialize();
  return accessor;
}
