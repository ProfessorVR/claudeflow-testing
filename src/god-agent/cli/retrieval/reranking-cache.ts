/**
 * RerankingCache - LRU Cache for Cross-Encoder Scores
 *
 * Implements a Least Recently Used (LRU) cache for storing query-document
 * cross-encoder relevance scores to avoid redundant re-ranking computations.
 *
 * Features:
 * - Hash-based key generation for cache lookups
 * - LRU eviction when capacity is reached
 * - Statistics tracking for hit rate monitoring
 * - Thread-safe operations
 *
 * @module reranking-cache
 */

import * as crypto from 'crypto';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cached re-ranking score entry
 */
export interface CachedScore {
  /** Cross-encoder relevance score (0.0-1.0) */
  score: number;
  /** Timestamp when the score was cached */
  timestamp: number;
  /** Number of times this entry has been accessed */
  accessCount: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of cache lookups */
  totalLookups: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Cache hit rate (0.0-1.0) */
  hitRate: number;
  /** Current number of entries in cache */
  size: number;
  /** Maximum cache capacity */
  capacity: number;
  /** Number of evictions due to capacity */
  evictions: number;
}

/**
 * Configuration for RerankingCache
 */
export interface RerankingCacheConfig {
  /** Maximum number of entries (default: 10000) */
  capacity?: number;
  /** Enable statistics tracking (default: true) */
  enableStats?: boolean;
}

// ============================================================================
// LRU Node
// ============================================================================

/**
 * Internal LRU linked list node
 */
class LRUNode {
  constructor(
    public key: string,
    public value: CachedScore,
    public prev: LRUNode | null = null,
    public next: LRUNode | null = null
  ) {}
}

// ============================================================================
// RerankingCache Class
// ============================================================================

/**
 * RerankingCache - LRU cache for cross-encoder scores
 *
 * Uses a hash map + doubly linked list for O(1) lookups and evictions.
 */
export class RerankingCache {
  private readonly capacity: number;
  private readonly enableStats: boolean;
  private cache: Map<string, LRUNode>;
  private head: LRUNode | null = null;
  private tail: LRUNode | null = null;

  // Statistics
  private totalLookups: number = 0;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  /**
   * Create a new RerankingCache
   *
   * @param config - Cache configuration
   */
  constructor(config: RerankingCacheConfig = {}) {
    this.capacity = config.capacity ?? 10000;
    this.enableStats = config.enableStats ?? true;
    this.cache = new Map();
  }

  // ==========================================================================
  // Cache Operations
  // ==========================================================================

  /**
   * Get a cached score for a query-document pair
   *
   * @param query - Search query
   * @param document - Document content
   * @returns Cached score or null if not found
   */
  get(query: string, document: string): number | null {
    if (this.enableStats) {
      this.totalLookups++;
    }

    const key = this.generateKey(query, document);
    const node = this.cache.get(key);

    if (!node) {
      if (this.enableStats) {
        this.misses++;
      }
      return null;
    }

    // Update access count
    node.value.accessCount++;

    // Move to front (most recently used)
    this.moveToFront(node);

    if (this.enableStats) {
      this.hits++;
    }

    return node.value.score;
  }

  /**
   * Store a score for a query-document pair
   *
   * @param query - Search query
   * @param document - Document content
   * @param score - Cross-encoder relevance score
   */
  put(query: string, document: string, score: number): void {
    const key = this.generateKey(query, document);
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing entry
      existingNode.value.score = score;
      existingNode.value.timestamp = Date.now();
      existingNode.value.accessCount++;
      this.moveToFront(existingNode);
      return;
    }

    // Create new entry
    const cachedScore: CachedScore = {
      score,
      timestamp: Date.now(),
      accessCount: 1,
    };

    const newNode = new LRUNode(key, cachedScore);

    // Add to front
    this.cache.set(key, newNode);
    this.addToFront(newNode);

    // Evict if over capacity
    if (this.cache.size > this.capacity) {
      this.evictLRU();
    }
  }

  /**
   * Check if a query-document pair is cached
   *
   * @param query - Search query
   * @param document - Document content
   * @returns True if cached, false otherwise
   */
  has(query: string, document: string): boolean {
    const key = this.generateKey(query, document);
    return this.cache.has(key);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;

    if (this.enableStats) {
      this.totalLookups = 0;
      this.hits = 0;
      this.misses = 0;
      this.evictions = 0;
    }
  }

  /**
   * Get cache statistics
   *
   * @returns Current statistics
   */
  getStats(): CacheStats {
    return {
      totalLookups: this.totalLookups,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.totalLookups > 0 ? this.hits / this.totalLookups : 0,
      size: this.cache.size,
      capacity: this.capacity,
      evictions: this.evictions,
    };
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  // ==========================================================================
  // Private Methods - LRU Operations
  // ==========================================================================

  /**
   * Move a node to the front of the LRU list
   */
  private moveToFront(node: LRUNode): void {
    if (node === this.head) {
      return; // Already at front
    }

    // Remove from current position
    this.removeNode(node);

    // Add to front
    this.addToFront(node);
  }

  /**
   * Add a node to the front of the LRU list
   */
  private addToFront(node: LRUNode): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove a node from the LRU list
   */
  private removeNode(node: LRUNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const evictedKey = this.tail.key;
    this.cache.delete(evictedKey);
    this.removeNode(this.tail);

    if (this.enableStats) {
      this.evictions++;
    }
  }

  // ==========================================================================
  // Private Methods - Key Generation
  // ==========================================================================

  /**
   * Generate a cache key for a query-document pair
   *
   * Uses SHA-256 hash to create a deterministic key from the query and document.
   *
   * @param query - Search query
   * @param document - Document content
   * @returns Cache key hash
   */
  private generateKey(query: string, document: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(query);
    hash.update('\0'); // Separator
    hash.update(document);
    return hash.digest('hex');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new RerankingCache with default configuration
 *
 * @param config - Cache configuration
 * @returns New cache instance
 */
export function createRerankingCache(config?: RerankingCacheConfig): RerankingCache {
  return new RerankingCache(config);
}
