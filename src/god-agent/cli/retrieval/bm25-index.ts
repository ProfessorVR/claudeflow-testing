/**
 * BM25 Index - Sparse/Keyword-based Retrieval
 *
 * Implements BM25 (Best Matching 25) ranking function for keyword-based search.
 * BM25 is a probabilistic retrieval function that ranks documents based on term
 * frequency (TF) and inverse document frequency (IDF).
 *
 * Formula:
 * BM25(D,Q) = Σ IDF(qi) * (f(qi,D) * (k1 + 1)) / (f(qi,D) + k1 * (1 - b + b * |D| / avgdl))
 *
 * Where:
 * - D = document
 * - Q = query
 * - qi = query term i
 * - f(qi,D) = frequency of qi in D
 * - |D| = length of document D
 * - avgdl = average document length
 * - k1 = term frequency saturation parameter (default: 1.5)
 * - b = length normalization parameter (default: 0.75)
 *
 * @module bm25-index
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

/**
 * Document in the BM25 index
 */
export interface BM25Document {
  /** Unique document ID */
  id: string;
  /** Document text content */
  content: string;
  /** Source metadata */
  source: string;
}

/**
 * BM25 search result
 */
export interface BM25Result {
  /** Document ID */
  id: string;
  /** BM25 relevance score */
  score: number;
  /** Document content */
  content: string;
  /** Document source */
  source: string;
}

/**
 * BM25 index configuration
 */
export interface BM25Config {
  /** Term frequency saturation parameter (default: 1.5) */
  k1?: number;
  /** Length normalization parameter (default: 0.75) */
  b?: number;
  /** Minimum term length to index (default: 2) */
  minTermLength?: number;
  /** Path to persist index (optional) */
  persistencePath?: string;
}

/**
 * Internal document representation
 */
interface IndexedDocument {
  id: string;
  content: string;
  source: string;
  length: number;
  termFreqs: Map<string, number>;
}

/**
 * Persisted index structure
 */
interface PersistedIndex {
  documents: Array<{
    id: string;
    content: string;
    source: string;
    length: number;
    termFreqs: Record<string, number>;
  }>;
  docFreqs: Record<string, number>;
  avgDocLength: number;
  totalDocs: number;
  config: Required<BM25Config>;
  version: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<BM25Config> = {
  k1: 1.5,
  b: 0.75,
  minTermLength: 2,
  persistencePath: '.agentdb/bm25-index.json',
};

const INDEX_VERSION = '1.0.0';

// Stopwords (common words to ignore)
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
  'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how',
]);

// ============================================================================
// BM25Index Class
// ============================================================================

/**
 * BM25 Index - Sparse keyword-based retrieval
 *
 * Provides BM25 ranking for keyword search across document corpus.
 * Complements semantic search by finding exact term matches.
 */
export class BM25Index {
  private config: Required<BM25Config>;
  private documents: Map<string, IndexedDocument> = new Map();
  private docFreqs: Map<string, number> = new Map(); // term -> number of docs containing term
  private avgDocLength: number = 0;
  private initialized: boolean = false;

  /**
   * Create a new BM25 index
   *
   * @param config - Configuration options
   */
  constructor(config: BM25Config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Initialize the index
   *
   * Attempts to load existing index from disk if persistence path is set.
   *
   * @returns True if initialization succeeded
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    // Try to load existing index
    if (this.config.persistencePath) {
      const loaded = await this.load();
      if (loaded) {
        this.initialized = true;
        return true;
      }
    }

    this.initialized = true;
    return true;
  }

  /**
   * Check if the index is initialized
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalDocuments: number;
    totalTerms: number;
    avgDocLength: number;
  } {
    return {
      totalDocuments: this.documents.size,
      totalTerms: this.docFreqs.size,
      avgDocLength: this.avgDocLength,
    };
  }

  // ==========================================================================
  // Indexing Methods
  // ==========================================================================

  /**
   * Index a batch of documents
   *
   * @param documents - Documents to index
   */
  async indexDocuments(documents: BM25Document[]): Promise<void> {
    this.ensureInitialized();

    for (const doc of documents) {
      this.indexDocument(doc);
    }

    // Recalculate statistics
    this.updateStatistics();

    // Auto-save if persistence is enabled
    if (this.config.persistencePath) {
      await this.save();
    }
  }

  /**
   * Index a single document
   *
   * @param document - Document to index
   */
  private indexDocument(document: BM25Document): void {
    // Tokenize and compute term frequencies
    const tokens = this.tokenize(document.content);
    const termFreqs = new Map<string, number>();

    for (const token of tokens) {
      if (this.shouldIndexTerm(token)) {
        termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
      }
    }

    // Create indexed document
    const indexedDoc: IndexedDocument = {
      id: document.id,
      content: document.content,
      source: document.source,
      length: tokens.length,
      termFreqs,
    };

    // Remove old document if exists (for reindexing)
    const oldDoc = this.documents.get(document.id);
    if (oldDoc) {
      this.removeDocumentFromDocFreqs(oldDoc);
    }

    // Add document
    this.documents.set(document.id, indexedDoc);

    // Update document frequencies
    for (const term of termFreqs.keys()) {
      this.docFreqs.set(term, (this.docFreqs.get(term) || 0) + 1);
    }
  }

  /**
   * Remove document from document frequency counts
   */
  private removeDocumentFromDocFreqs(doc: IndexedDocument): void {
    for (const term of doc.termFreqs.keys()) {
      const count = this.docFreqs.get(term) || 0;
      if (count <= 1) {
        this.docFreqs.delete(term);
      } else {
        this.docFreqs.set(term, count - 1);
      }
    }
  }

  /**
   * Update index statistics
   */
  private updateStatistics(): void {
    // Calculate average document length
    let totalLength = 0;
    for (const doc of this.documents.values()) {
      totalLength += doc.length;
    }
    this.avgDocLength = this.documents.size > 0 ? totalLength / this.documents.size : 0;
  }

  /**
   * Clear the index
   */
  async clear(): Promise<void> {
    this.documents.clear();
    this.docFreqs.clear();
    this.avgDocLength = 0;

    if (this.config.persistencePath) {
      await this.save();
    }
  }

  // ==========================================================================
  // Search Methods
  // ==========================================================================

  /**
   * Search the index using BM25
   *
   * @param query - Search query text
   * @param topK - Number of results to return (default: 5)
   * @returns Array of BM25 results sorted by relevance
   */
  search(query: string, topK: number = 5): BM25Result[] {
    this.ensureInitialized();

    if (!query || query.trim().length === 0) {
      return [];
    }

    // Tokenize query
    const queryTerms = this.tokenize(query).filter(term => this.shouldIndexTerm(term));

    if (queryTerms.length === 0) {
      return [];
    }

    // Score all documents
    const scores: Array<{ id: string; score: number }> = [];

    for (const doc of this.documents.values()) {
      const score = this.computeBM25Score(queryTerms, doc);
      if (score > 0) {
        scores.push({ id: doc.id, score });
      }
    }

    // Sort by score and return top K
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map(({ id, score }) => {
      const doc = this.documents.get(id)!;
      return {
        id: doc.id,
        score,
        content: doc.content,
        source: doc.source,
      };
    });
  }

  /**
   * Compute BM25 score for a document given query terms
   *
   * BM25 formula:
   * BM25(D,Q) = Σ IDF(qi) * (f(qi,D) * (k1 + 1)) / (f(qi,D) + k1 * (1 - b + b * |D| / avgdl))
   */
  private computeBM25Score(queryTerms: string[], doc: IndexedDocument): number {
    const { k1, b } = this.config;
    let score = 0;

    for (const term of queryTerms) {
      // Get term frequency in document
      const tf = doc.termFreqs.get(term) || 0;
      if (tf === 0) continue;

      // Compute IDF
      const idf = this.computeIDF(term);

      // Compute BM25 component for this term
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (doc.length / this.avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * Compute Inverse Document Frequency (IDF)
   *
   * IDF(qi) = log((N - df(qi) + 0.5) / (df(qi) + 0.5))
   *
   * Where:
   * - N = total number of documents
   * - df(qi) = number of documents containing term qi
   */
  private computeIDF(term: string): number {
    const N = this.documents.size;
    const df = this.docFreqs.get(term) || 0;

    // Add smoothing to avoid log(0)
    return Math.log((N - df + 0.5) / (df + 0.5) + 1);
  }

  // ==========================================================================
  // Tokenization Methods
  // ==========================================================================

  /**
   * Tokenize text into terms
   *
   * @param text - Text to tokenize
   * @returns Array of normalized terms
   */
  private tokenize(text: string): string[] {
    // Convert to lowercase and split on non-alphanumeric characters
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(token => token.length > 0);
  }

  /**
   * Check if a term should be indexed
   *
   * @param term - Term to check
   * @returns True if term should be indexed
   */
  private shouldIndexTerm(term: string): boolean {
    return (
      term.length >= this.config.minTermLength &&
      !STOPWORDS.has(term) &&
      !/^\d+$/.test(term) // Ignore pure numbers
    );
  }

  // ==========================================================================
  // Persistence Methods
  // ==========================================================================

  /**
   * Save index to disk
   */
  async save(): Promise<void> {
    if (!this.config.persistencePath) {
      return;
    }

    const data: PersistedIndex = {
      documents: Array.from(this.documents.values()).map(doc => ({
        id: doc.id,
        content: doc.content,
        source: doc.source,
        length: doc.length,
        termFreqs: Object.fromEntries(doc.termFreqs),
      })),
      docFreqs: Object.fromEntries(this.docFreqs),
      avgDocLength: this.avgDocLength,
      totalDocs: this.documents.size,
      config: this.config,
      version: INDEX_VERSION,
    };

    try {
      // Ensure directory exists
      const dir = path.dirname(this.config.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.config.persistencePath, JSON.stringify(data, null, 2));
      console.log(`[BM25Index] Saved index to ${this.config.persistencePath}`);
    } catch (error) {
      console.error(`[BM25Index] Failed to save index:`, error);
      throw error;
    }
  }

  /**
   * Load index from disk
   *
   * @returns True if index was loaded successfully
   */
  async load(): Promise<boolean> {
    if (!this.config.persistencePath) {
      return false;
    }

    if (!fs.existsSync(this.config.persistencePath)) {
      console.log(`[BM25Index] No existing index found at ${this.config.persistencePath}`);
      return false;
    }

    try {
      const data: PersistedIndex = JSON.parse(
        fs.readFileSync(this.config.persistencePath, 'utf-8')
      );

      // Validate version
      if (data.version !== INDEX_VERSION) {
        console.warn(
          `[BM25Index] Index version mismatch (expected ${INDEX_VERSION}, got ${data.version}). Rebuilding index.`
        );
        return false;
      }

      // Restore documents
      this.documents.clear();
      for (const doc of data.documents) {
        this.documents.set(doc.id, {
          id: doc.id,
          content: doc.content,
          source: doc.source,
          length: doc.length,
          termFreqs: new Map(Object.entries(doc.termFreqs)),
        });
      }

      // Restore document frequencies
      this.docFreqs = new Map(Object.entries(data.docFreqs).map(([k, v]) => [k, v as number]));
      this.avgDocLength = data.avgDocLength;

      console.log(
        `[BM25Index] Loaded index from ${this.config.persistencePath} (${this.documents.size} docs, ${this.docFreqs.size} terms)`
      );
      return true;
    } catch (error) {
      console.error(`[BM25Index] Failed to load index:`, error);
      return false;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Ensure the index is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('BM25Index not initialized. Call initialize() first.');
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a BM25 index with default configuration
 *
 * @param config - Optional configuration overrides
 * @returns Uninitialized BM25 index
 */
export function createBM25Index(config?: BM25Config): BM25Index {
  return new BM25Index(config);
}

/**
 * Create and initialize a BM25 index
 *
 * @param config - Optional configuration overrides
 * @returns Initialized BM25 index ready for use
 */
export async function createInitializedBM25Index(config?: BM25Config): Promise<BM25Index> {
  const index = new BM25Index(config);
  await index.initialize();
  return index;
}
