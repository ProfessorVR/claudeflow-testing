/**
 * Type definitions for Smart Retrieval Layer
 *
 * Phase 1 of RAG Integration - Core retrieval types
 */

import { z } from 'zod';

// ============================================================================
// JSONL Schema Validation (Zod)
// Runtime-validated schemas for data crossing the Python→TypeScript boundary.
// These are the single source of truth for KnowledgeUnit and ReasoningEdge shapes.
// ============================================================================

/** Normalize string confidence ("high"/"medium"/"low") to numeric 0-1. */
const confidenceToNumber = z.union([
  z.number(),
  z.string().transform((s) => {
    const map: Record<string, number> = { high: 0.9, medium: 0.6, low: 0.3 };
    return map[s.toLowerCase()] ?? 0.5;
  }),
]).pipe(z.number());

const KnowledgeUnitSourceSchema = z.object({
  author: z.string(),
  title: z.string().optional(),
  path_rel: z.string().optional(),
  pages: z.union([z.string(), z.array(z.number())]).optional(),
  chunk_id: z.string().nullable().optional(),
  has_bboxes: z.boolean().optional(),
  source_method: z.string().optional(),
  bboxes: z.string().optional(),
}).passthrough();

/**
 * Known KU domain values from the current corpus (H-13).
 * Used for warn-on-unknown validation — does NOT reject unknown domains,
 * just logs a warning so new domains are surfaced during ingestion.
 */
export const KNOWN_KU_DOMAINS: readonly string[] = [
  'aristotle',
  'heidegger_bt',
  'rickert',
  'lanham_prose',
] as const;

const KnowledgeUnitSchema = z.object({
  id: z.string(),
  claim: z.string(),
  sources: z.array(KnowledgeUnitSourceSchema).default([]),
  confidence: confidenceToNumber,
  domain: z.string().optional(),
  tags: z.array(z.string()).optional(),
  created_from_query: z.string().optional(),
}).passthrough();

const ReasoningEdgeSchema = z.object({
  id: z.string().optional(),
  reason_id: z.string().optional(),
  source: z.string(),
  relation: z.string(),
  target: z.string(),
  domain: z.string().optional(),
  confidence: confidenceToNumber.optional(),
  pipeline: z.string().optional(),
  units: z.string().optional(),
  chapter: z.string().optional(),
  knowledge_ids: z.array(z.string()).optional(),
  corroboration_score: z.number().optional(),
  generation_epoch: z.number().optional(),
  derivation: z.string().optional(),
  corroboration_method: z.string().optional(),
  status: z.string().optional(),
}).passthrough().transform((e) => ({
  ...e,
  id: e.id ?? e.reason_id ?? '',
}));

/** Parsed, runtime-validated KnowledgeUnit with numeric confidence. */
export type KnowledgeUnit = z.infer<typeof KnowledgeUnitSchema> & {
  /** Lowercase claim words, computed after parse (not from JSONL). */
  _claimWords?: Set<string>;
};

/** Parsed, runtime-validated ReasoningEdge with numeric confidence. */
export type ReasoningEdge = z.infer<typeof ReasoningEdgeSchema>;

/**
 * Parse a single JSONL line into a KnowledgeUnit.
 * Returns null (with stderr warning) if the line fails validation.
 */
export function parseKnowledgeUnit(line: string): KnowledgeUnit | null {
  try {
    const raw = JSON.parse(line);
    const ku = KnowledgeUnitSchema.parse(raw);

    // H-13: Auto-normalize domain (lowercase, trim) and warn on unknown
    if (ku.domain) {
      const normalized = ku.domain.toLowerCase().trim();
      if (normalized !== ku.domain) {
        (ku as any).domain = normalized;
      }
      if (!KNOWN_KU_DOMAINS.includes(normalized)) {
        process.stderr.write(
          `[JSONL] WARNING: KU ${ku.id} has unknown domain "${normalized}". ` +
          `Known domains: ${KNOWN_KU_DOMAINS.join(', ')}. ` +
          `If this is a new domain, consider adding it to KNOWN_KU_DOMAINS in types.ts.\n`
        );
      }
    }

    return ku;
  } catch (e) {
    const id = (() => { try { return JSON.parse(line)?.id ?? '??'; } catch { return '??'; } })();
    process.stderr.write(`[JSONL] KnowledgeUnit validation failed for ${id}: ${e instanceof z.ZodError ? e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : e}\n`);
    return null;
  }
}

/**
 * Parse a single JSONL line into a ReasoningEdge.
 * Returns null (with stderr warning) if the line fails validation.
 */
export function parseReasoningEdge(line: string): ReasoningEdge | null {
  try {
    const raw = JSON.parse(line);
    return ReasoningEdgeSchema.parse(raw);
  } catch (e) {
    const id = (() => { try { return JSON.parse(line)?.id ?? '??'; } catch { return '??'; } })();
    process.stderr.write(`[JSONL] ReasoningEdge validation failed for ${id}: ${e instanceof z.ZodError ? e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : e}\n`);
    return null;
  }
}

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
    /** Whether this chunk has bounding box coordinates (v7 pipeline) */
    has_bboxes?: boolean;
    /** Extraction method: 'marker+bbox', 'pymupdf+bbox', 'pdftotext', etc. */
    source_method?: string;
    /** JSON string of bounding box coordinates per page */
    bboxes?: string;
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

  /** Use cross-encoder re-ranking for better results (default: false — not yet implemented) */
  rerank?: boolean;

  /** ChromaDB where filter for metadata-based filtering (e.g., author) */
  whereFilter?: Record<string, unknown>;

  /** Boost retrieval scores using Knowledge Units and reasoning edges (default: false) */
  boostWithKG?: boolean;

  /** Maximum hops for knowledge graph edge traversal (default: 1, max: 2) */
  maxHops?: number;
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
    /** Collection ID (UUID) for knowledge_chunks — optional, resolved by name if omitted */
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

  /** Logger for structured output (defaults to stderrLogger) */
  logger?: Logger;
}

/**
 * Logger interface for structured logging.
 * Injected into retrieval and pipeline components to replace console.log/console.error.
 */
export interface Logger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

/**
 * Default logger that writes to stderr (safe for JSON-mode stdout).
 */
export const stderrLogger: Logger = {
  info: (...args: unknown[]) => process.stderr.write(`[INFO] ${args.map(String).join(' ')}\n`),
  warn: (...args: unknown[]) => process.stderr.write(`[WARN] ${args.map(String).join(' ')}\n`),
  error: (...args: unknown[]) => process.stderr.write(`[ERROR] ${args.map(String).join(' ')}\n`),
};

export type RetrievalDirection = 'before' | 'after' | 'both';

export interface RelatedChunksOptions {
  /** Direction to expand from anchor chunk */
  direction: RetrievalDirection;

  /** Number of chunks to retrieve in each direction */
  count: number;

  /** Include metadata enrichment */
  enrichMetadata?: boolean;
}
