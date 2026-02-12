/**
 * Type definitions for Smart Retrieval Layer
 *
 * Phase 1 of RAG Integration - Core retrieval types
 */

export interface ContextChunk {
  /** Unique chunk identifier */
  chunkId: string;

  /** Document identifier */
  docId: string;

  /** Chunk content (text) */
  content: string;

  /** Metadata about the source */
  metadata: {
    author: string;
    title: string;
    year: number;
    page_start: number;
    page_end: number;
    collection: string;
    /** Pre-cleaning raw text (only present if cleaning changed the text) */
    raw_content?: string;
    /** Cleaning pipeline version (e.g. "clean_v1") */
    cleaning_version?: string;
    /** SHA-256 hash of raw (pre-cleaning) text */
    raw_sha256?: string;
    /** SHA-256 hash of cleaned text */
    clean_sha256?: string;
    /** pdftotext version used for extraction */
    pdftotext_version?: string;
    [key: string]: any;
  };

  /** Relevance score (0-1) */
  relevanceScore: number;

  /** Optional embedding vector */
  embedding?: number[];
}

export interface RetrievalOptions {
  /** Filter by collection names (e.g., ['theory', 'empirical']) */
  collections?: string[];

  /** Maximum number of chunks to retrieve (default: 10) */
  maxChunks?: number;

  /** Minimum similarity score threshold (default: 0.7) */
  minRelevance?: number;

  /** Include N pages before/after matched chunk (default: 0) */
  pageContext?: number;

  /** Boost diversity to avoid redundant results (default: true) */
  diversityBoost?: boolean;

  /** Use cross-encoder re-ranking for better results (default: true) */
  rerank?: boolean;
}

export interface HybridSearchWeights {
  /** Weight for semantic (vector) search (0-1) */
  semantic: number;

  /** Weight for keyword (BM25) search (0-1) */
  keyword: number;
}

export interface CrossReference {
  /** Concept being cross-referenced */
  concept: string;

  /** Source chunk */
  sourceChunk: ContextChunk;

  /** Target chunk from another document */
  targetChunk: ContextChunk;

  /** Similarity score between chunks (0-1) */
  similarity: number;

  /** Relationship type */
  relationship: 'agrees' | 'contradicts' | 'extends' | 'cites' | 'related';

  /** Generated synthesis prompt */
  synthesisPrompt?: string;
}

export interface RetrievalStats {
  /** Total query time (ms) */
  queryTimeMs: number;

  /** Number of chunks searched */
  chunksSearched: number;

  /** Number of chunks returned */
  chunksReturned: number;

  /** Whether cache was used */
  cacheHit: boolean;

  /** Re-ranking time if applied (ms) */
  rerankTimeMs?: number;
}

export interface CacheEntry<T> {
  /** Cached data */
  data: T;

  /** Timestamp when cached */
  timestamp: number;

  /** Access count */
  accessCount: number;

  /** Last access timestamp */
  lastAccess: number;
}

export interface SmartRetrievalConfig {
  /** AgentDB connection settings */
  agentdb?: {
    host?: string;
    port?: number;
    apiKey?: string;
  };

  /** ChromaDB connection settings */
  chromadb?: {
    host?: string;
    port?: number;
    /** Collection ID (UUID) for knowledge_chunks */
    collectionId?: string;
    /** Collection name for knowledge_chunks */
    collectionName?: string;
  };

  /** Embedding API connection settings */
  embeddingApi?: {
    host?: string;
    port?: number;
  };

  /** Cache configuration */
  cache?: {
    enabled?: boolean;
    maxSize?: number;
    ttlMs?: number;
  };

  /** Performance tuning */
  performance?: {
    parallelQueries?: number;
    queryTimeout?: number;
  };
}

export type RetrievalDirection = 'before' | 'after' | 'both';

export interface RelatedChunksOptions {
  /** Direction to expand from anchor chunk */
  direction: RetrievalDirection;

  /** Number of chunks to retrieve in each direction */
  count: number;

  /** Include metadata enrichment */
  enrichMetadata?: boolean;
}
