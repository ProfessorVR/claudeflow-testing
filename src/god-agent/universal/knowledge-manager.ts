/**
 * KnowledgeManager - Knowledge storage, retrieval, chunking, and reconstruction
 *
 * Extracted from UniversalAgent (Tranche E-05, SEAM-2).
 * Handles TASK-CHUNK operations, backward compatibility, and domain expertise tracking.
 */

import type { QueryResult } from '../core/god-agent.js';
import type { KnowledgeChunker, ChunkingResult, KnowledgeChunk } from './knowledge-chunker.js';
import type { KnowledgeEntry } from './universal-agent.js';
import type { InteractionStore } from './interaction-store.js';

/**
 * Extended pattern type that includes metadata (runtime extension to QueryResult.patterns)
 */
export type PatternWithMetadata = {
  id: string;
  content: unknown;
  similarity: number;
  confidence: number;
  provenance?: unknown;
  causalContext?: unknown;
  metadata?: Record<string, unknown>;
};

/**
 * Dependencies injected into KnowledgeManager
 */
export interface KnowledgeManagerDeps {
  agent: {
    store: (data: { content: unknown; embedding: Float32Array; metadata?: Record<string, unknown> }, opts?: Record<string, unknown>) => Promise<unknown>;
    query: (embedding: Float32Array, opts: { k: number; minSimilarity: number; includeProvenance?: boolean }) => Promise<QueryResult>;
  };
  knowledgeChunker: KnowledgeChunker;
  interactionStore: InteractionStore;
  domainExpertise: Map<string, number>;
  embed: (text: string) => Promise<Float32Array>;
  generateId: () => string;
  log: (message: string) => void;
  ensureInitialized: () => Promise<void>;
}

export class KnowledgeManager {
  constructor(private deps: KnowledgeManagerDeps) {}

  /**
   * Store knowledge for future use with automatic chunking
   * Implements: REQ-CHUNK-001 (chunking), REQ-CHUNK-006 (token limit validation)
   */
  async storeKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'quality' | 'usageCount' | 'lastUsed' | 'createdAt'>): Promise<string> {
    const id = this.deps.generateId();
    const now = Date.now();

    // TASK-CHUNK-003: Chunk content for OpenAI token limit compliance
    const contentType = this.deps.knowledgeChunker.detectContentType(entry.content);
    const chunkingResult: ChunkingResult = await this.deps.knowledgeChunker.chunkForStorage(
      entry.content,
      id,
      { domain: entry.domain, type: entry.type || entry.category || 'unknown', tags: entry.tags },
      { contentType }
    );

    // REQ-CHUNK-006: Warn about very large content
    if (chunkingResult.totalTokensEstimate > 100000) {
      this.deps.log(`WARNING: Large content (${chunkingResult.totalTokensEstimate} tokens) may have reduced retrieval quality`);
    }

    if (chunkingResult.wasChunked) {
      this.deps.log(`TASK-CHUNK-003: Chunked content into ${chunkingResult.chunks.length} chunks (${chunkingResult.totalTokensEstimate} estimated tokens)`);
    }

    const knowledge: KnowledgeEntry = {
      ...entry,
      id,
      quality: 0.5,
      usageCount: 0,
      lastUsed: now,
      createdAt: now,
    };

    // Store each chunk separately with its own embedding for semantic search
    for (const chunk of chunkingResult.chunks) {
      const chunkEmbedding = await this.deps.embed(chunk.text);

      await this.deps.agent.store({
        content: {
          ...knowledge,
          chunkText: chunk.text,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          startOffset: chunk.metadata.startOffset,
          endOffset: chunk.metadata.endOffset,
          isChunked: chunkingResult.wasChunked,
        },
        embedding: chunkEmbedding,
        metadata: {
          type: entry.type,
          domain: entry.domain,
          tags: entry.tags,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          parentId: id,
          estimatedTokens: chunk.metadata.estimatedTokens,
        }
      }, {
        trackProvenance: true,
        namespace: `knowledge.${entry.domain}`,
      });
    }

    // Store parent entry in interaction store for quick metadata access
    this.deps.interactionStore.addKnowledge(knowledge);

    // Track domain expertise
    const domainCount = (this.deps.domainExpertise.get(entry.domain) ?? 0) + 1;
    this.deps.domainExpertise.set(entry.domain, domainCount);

    this.deps.log(`Stored knowledge: ${id} (${entry.domain}/${entry.type}) - ${chunkingResult.chunks.length} chunk(s)`);
    return id;
  }

  /**
   * Retrieve relevant knowledge
   */
  async retrieveRelevant(
    query: string,
    _mode: string,
    k: number = 10
  ): Promise<Array<QueryResult['patterns'][0] & { content: unknown }>> {
    const embedding = await this.deps.embed(query);

    const results = await this.deps.agent.query(embedding, {
      k,
      minSimilarity: 0.3,
      includeProvenance: true,
    });

    // Update usage stats for retrieved patterns
    for (const pattern of results.patterns) {
      await this.updateUsageStats(pattern.id);
    }

    return results.patterns;
  }

  /**
   * Check if a knowledge entry is chunked
   * Implements: TASK-CHUNK-010 (backward compatibility)
   */
  isChunkedEntry(entry: Record<string, unknown>): boolean {
    if (entry.isChunked === true || entry.is_chunked === true) {
      return true;
    }

    const chunkCount = entry.chunk_count ?? entry.chunkCount ?? entry.totalChunks;
    if (typeof chunkCount === 'number' && chunkCount > 1) {
      return true;
    }

    return false;
  }

  /**
   * Retrieve knowledge by ID with backward compatibility for chunked/non-chunked entries
   * Implements: TASK-CHUNK-010
   */
  async retrieveKnowledge(id: string): Promise<KnowledgeEntry | null> {
    const allKnowledge = this.deps.interactionStore.getKnowledge();
    const cachedEntry = allKnowledge.find(k => k.id === id);
    if (cachedEntry) {
      this.deps.log(`TASK-CHUNK-010: Retrieved from cache: ${id}`);
      return cachedEntry;
    }

    const dummyEmbedding = new Float32Array(384);
    const results = await this.deps.agent.query(dummyEmbedding, {
      k: 100,
      minSimilarity: 0,
      includeProvenance: true,
    });

    const matchingEntries = (results.patterns as PatternWithMetadata[]).filter(p => {
      const content = p.content as Record<string, unknown>;
      return content.id === id || p.metadata?.parentId === id;
    });

    if (matchingEntries.length === 0) {
      this.deps.log(`TASK-CHUNK-010: Knowledge not found: ${id}`);
      return null;
    }

    const firstEntry = matchingEntries[0];
    const entryContent = firstEntry.content as Record<string, unknown>;

    if (!this.isChunkedEntry(entryContent)) {
      this.deps.log(`TASK-CHUNK-010: Retrieved non-chunked entry: ${id}`);
      return this.contentToKnowledgeEntry(entryContent);
    }

    this.deps.log(`TASK-CHUNK-010: Reconstructing chunked entry: ${id}`);
    return this.reconstructChunkedKnowledge(id, matchingEntries);
  }

  /**
   * Reconstruct full content from chunked knowledge entries
   */
  private async reconstructChunkedKnowledge(
    parentId: string,
    chunks: PatternWithMetadata[]
  ): Promise<KnowledgeEntry | null> {
    const sortedChunks = chunks.sort((a, b) => {
      const aContent = a.content as Record<string, unknown>;
      const bContent = b.content as Record<string, unknown>;
      const aIndex = (aContent.chunkIndex ?? a.metadata?.chunkIndex ?? 0) as number;
      const bIndex = (bContent.chunkIndex ?? b.metadata?.chunkIndex ?? 0) as number;
      return aIndex - bIndex;
    });

    const expectedTotal = (sortedChunks[0].content as Record<string, unknown>).totalChunks ??
                           sortedChunks[0].metadata?.totalChunks;

    if (typeof expectedTotal !== 'number') {
      this.deps.log(`TASK-CHUNK-010: WARNING - Missing totalChunks for ${parentId}, using chunk count`);
    }

    const knowledgeChunks: KnowledgeChunk[] = sortedChunks.map((chunk, idx) => {
      const content = chunk.content as Record<string, unknown>;
      const metadata = chunk.metadata as Record<string, unknown>;

      return {
        text: (content.chunkText ?? content.content ?? '') as string,
        metadata: {
          parentId,
          chunkIndex: (content.chunkIndex ?? metadata?.chunkIndex ?? idx) as number,
          totalChunks: (content.totalChunks ?? metadata?.totalChunks ?? sortedChunks.length) as number,
          startOffset: (content.startOffset ?? metadata?.startOffset ?? 0) as number,
          endOffset: (content.endOffset ?? metadata?.endOffset ?? 0) as number,
          domain: (content.domain ?? metadata?.domain ?? 'unknown') as string,
          type: (content.type ?? metadata?.type ?? 'unknown') as string,
          tags: (content.tags ?? metadata?.tags ?? []) as string[],
          estimatedTokens: (metadata?.estimatedTokens ?? 0) as number,
        }
      };
    });

    if (!this.deps.knowledgeChunker.canReconstruct(knowledgeChunks)) {
      this.deps.log(`TASK-CHUNK-010: ERROR - Cannot reconstruct chunks for ${parentId}, missing chunks`);
      const firstContent = sortedChunks[0].content as Record<string, unknown>;
      return this.contentToKnowledgeEntry({
        ...firstContent,
        content: firstContent.chunkText ?? firstContent.content,
      });
    }

    const reconstructedContent = this.deps.knowledgeChunker.reconstructContent(knowledgeChunks);
    const firstContent = sortedChunks[0].content as Record<string, unknown>;
    const firstMetadata = sortedChunks[0].metadata as Record<string, unknown>;

    this.deps.log(`TASK-CHUNK-010: Reconstructed ${knowledgeChunks.length} chunks (${reconstructedContent.length} chars) for ${parentId}`);

    return {
      id: parentId,
      content: reconstructedContent,
      type: (firstContent.type ?? firstMetadata?.type ?? 'pattern') as KnowledgeEntry['type'],
      domain: (firstContent.domain ?? firstMetadata?.domain ?? 'unknown') as string,
      tags: (firstContent.tags ?? firstMetadata?.tags ?? []) as string[],
      quality: (firstContent.quality ?? 0.5) as number,
      usageCount: (firstContent.usageCount ?? 0) as number,
      lastUsed: (firstContent.lastUsed ?? Date.now()) as number,
      createdAt: (firstContent.createdAt ?? Date.now()) as number,
      source: firstContent.source as string | undefined,
    };
  }

  /**
   * Convert raw content object to KnowledgeEntry
   */
  contentToKnowledgeEntry(content: Record<string, unknown>): KnowledgeEntry {
    return {
      id: content.id as string,
      content: (content.content ?? content.chunkText ?? '') as string,
      type: (content.type ?? 'pattern') as KnowledgeEntry['type'],
      domain: (content.domain ?? 'unknown') as string,
      tags: (content.tags ?? []) as string[],
      quality: (content.quality ?? 0.5) as number,
      usageCount: (content.usageCount ?? 0) as number,
      lastUsed: (content.lastUsed ?? Date.now()) as number,
      createdAt: (content.createdAt ?? Date.now()) as number,
      source: content.source as string | undefined,
    };
  }

  /**
   * Get all chunks for a knowledge entry by parentId
   * Implements: TASK-CHUNK-004
   */
  async getKnowledgeChunks(knowledgeId: string): Promise<KnowledgeChunk[]> {
    await this.deps.ensureInitialized();

    this.deps.log(`TASK-CHUNK-004: Retrieving chunks for knowledge ID: ${knowledgeId}`);

    const dummyEmbedding = new Float32Array(384);
    const results = await this.deps.agent.query(dummyEmbedding, {
      k: 100,
      minSimilarity: 0,
      includeProvenance: true,
    });

    const patternsWithMeta = results.patterns as PatternWithMetadata[];
    const matchingChunks: PatternWithMetadata[] = patternsWithMeta.filter(p => {
      const content = p.content as Record<string, unknown>;
      return p.metadata?.parentId === knowledgeId || content.id === knowledgeId;
    });

    if (matchingChunks.length === 0) {
      this.deps.log(`TASK-CHUNK-004: No chunks found for knowledge ID: ${knowledgeId}`);
      return [];
    }

    const knowledgeChunks: KnowledgeChunk[] = matchingChunks.map((chunk) => {
      const content = chunk.content as Record<string, unknown>;
      const metadata = chunk.metadata ?? {};

      return {
        text: (content.chunkText ?? content.content ?? '') as string,
        metadata: {
          parentId: knowledgeId,
          chunkIndex: (content.chunkIndex ?? metadata?.chunkIndex ?? 0) as number,
          totalChunks: (content.totalChunks ?? metadata?.totalChunks ?? matchingChunks.length) as number,
          startOffset: (content.startOffset ?? metadata?.startOffset ?? 0) as number,
          endOffset: (content.endOffset ?? metadata?.endOffset ?? 0) as number,
          domain: (content.domain ?? metadata?.domain ?? 'unknown') as string,
          type: (content.type ?? metadata?.type ?? 'unknown') as string,
          tags: (content.tags ?? metadata?.tags ?? []) as string[],
          estimatedTokens: (metadata?.estimatedTokens ?? 0) as number,
        }
      };
    });

    knowledgeChunks.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);

    this.deps.log(`TASK-CHUNK-004: Retrieved ${knowledgeChunks.length} chunks for ${knowledgeId}`);
    return knowledgeChunks;
  }

  /**
   * Reconstruct full content from knowledge chunks
   * Implements: TASK-CHUNK-004
   */
  async reconstructKnowledge(knowledgeId: string): Promise<string> {
    await this.deps.ensureInitialized();

    this.deps.log(`TASK-CHUNK-004: Reconstructing knowledge ID: ${knowledgeId}`);

    const chunks = await this.getKnowledgeChunks(knowledgeId);

    if (chunks.length === 0) {
      this.deps.log(`TASK-CHUNK-004: No chunks found for reconstruction: ${knowledgeId}`);
      return '';
    }

    if (chunks.length === 1) {
      this.deps.log(`TASK-CHUNK-004: Single chunk, returning directly: ${knowledgeId}`);
      return chunks[0].text;
    }

    if (!this.deps.knowledgeChunker.canReconstruct(chunks)) {
      const missing = this.findMissingChunkIndices(chunks);
      throw new Error(`TASK-CHUNK-004: Cannot reconstruct ${knowledgeId} - missing chunks at indices: ${missing.join(', ')}`);
    }

    const reconstructedContent = this.deps.knowledgeChunker.reconstructContent(chunks);

    this.deps.log(`TASK-CHUNK-004: Reconstructed ${chunks.length} chunks into ${reconstructedContent.length} characters for ${knowledgeId}`);
    return reconstructedContent;
  }

  /**
   * Query knowledge base with automatic chunk handling
   * Implements: TASK-CHUNK-004
   */
  async queryKnowledge(
    query: string,
    options: { k?: number; minSimilarity?: number; domain?: string } = {}
  ): Promise<KnowledgeEntry[]> {
    await this.deps.ensureInitialized();

    const { k = 10, minSimilarity = 0.3, domain } = options;

    this.deps.log(`TASK-CHUNK-004: Querying knowledge with: "${query.substring(0, 50)}..."`);

    const embedding = await this.deps.embed(query);

    const results = await this.deps.agent.query(embedding, {
      k: k * 3,
      minSimilarity,
      includeProvenance: true,
    });

    let patterns = results.patterns as PatternWithMetadata[];
    if (domain) {
      patterns = patterns.filter(p => {
        const content = p.content as Record<string, unknown>;
        return content.domain === domain || p.metadata?.domain === domain;
      });
    }

    // Group by parentId to deduplicate chunked entries
    const parentIdMap = new Map<string, {
      patterns: PatternWithMetadata[];
      maxSimilarity: number;
    }>();

    for (const pattern of patterns) {
      const content = pattern.content as Record<string, unknown>;
      const parentId = (pattern.metadata?.parentId ?? content.id) as string;

      const existing = parentIdMap.get(parentId);
      if (existing) {
        existing.patterns.push(pattern);
        existing.maxSimilarity = Math.max(existing.maxSimilarity, pattern.similarity);
      } else {
        parentIdMap.set(parentId, {
          patterns: [pattern],
          maxSimilarity: pattern.similarity,
        });
      }
    }

    const sortedEntries = Array.from(parentIdMap.entries())
      .sort((a, b) => b[1].maxSimilarity - a[1].maxSimilarity)
      .slice(0, k);

    const knowledgeEntries: KnowledgeEntry[] = [];

    for (const [parentId, { patterns: entryPatterns }] of sortedEntries) {
      const firstPattern = entryPatterns[0];
      const content = firstPattern.content as Record<string, unknown>;

      if (this.isChunkedEntry(content)) {
        try {
          const reconstructed = await this.reconstructKnowledge(parentId);
          knowledgeEntries.push({
            id: parentId,
            content: reconstructed,
            type: (content.type ?? 'pattern') as KnowledgeEntry['type'],
            domain: (content.domain ?? 'unknown') as string,
            tags: (content.tags ?? []) as string[],
            quality: (content.quality ?? 0.5) as number,
            usageCount: (content.usageCount ?? 0) as number,
            lastUsed: (content.lastUsed ?? Date.now()) as number,
            createdAt: (content.createdAt ?? Date.now()) as number,
            source: content.source as string | undefined,
          });
        } catch (error) {
          this.deps.log(`TASK-CHUNK-004: Reconstruction failed for ${parentId}, using chunk text: ${error}`);
          knowledgeEntries.push(this.contentToKnowledgeEntry(content));
        }
      } else {
        knowledgeEntries.push(this.contentToKnowledgeEntry(content));
      }
    }

    this.deps.log(`TASK-CHUNK-004: Query returned ${knowledgeEntries.length} knowledge entries (from ${patterns.length} raw results)`);
    return knowledgeEntries;
  }

  /**
   * Find missing chunk indices for error reporting
   */
  findMissingChunkIndices(chunks: KnowledgeChunk[]): number[] {
    if (chunks.length === 0) return [];

    const expectedTotal = chunks[0].metadata.totalChunks;
    const presentIndices = new Set(chunks.map(c => c.metadata.chunkIndex));
    const missing: number[] = [];

    for (let i = 0; i < expectedTotal; i++) {
      if (!presentIndices.has(i)) {
        missing.push(i);
      }
    }

    return missing;
  }

  /**
   * Maybe store a pattern if it's high quality (dedup check)
   */
  async maybeStorePattern(entry: Omit<KnowledgeEntry, 'id' | 'quality' | 'usageCount' | 'lastUsed' | 'createdAt'>): Promise<string | null> {
    const embedding = await this.deps.embed(entry.content);
    const existing = await this.deps.agent.query(embedding, { k: 1, minSimilarity: 0.9 });

    if (existing.patterns.length > 0) {
      await this.updateUsageStats(existing.patterns[0].id);
      return null;
    }

    return this.storeKnowledge(entry);
  }

  /**
   * Update usage stats for a pattern
   */
  async updateUsageStats(patternId: string): Promise<void> {
    this.deps.log(`Pattern accessed: ${patternId}`);
  }

  // =========================================================================
  // JSONL Read-Through Adapter (Sprint 2 Task 7)
  // See docs/research/ku-reasoning-edge-system-analysis.md §7.8
  // Bridges the JSONL-backed KU store (god-learn/knowledge.jsonl) with
  // the in-memory KnowledgeManager so both systems share the same data.
  // =========================================================================

  /** KUs loaded from JSONL backing store */
  private jsonlKUs: Array<{ id: string; claim: string; domain: string; source: string; confidence: number }> = [];
  private jsonlLoaded = false;

  /**
   * Load KUs from the canonical JSONL file into memory.
   * Called lazily on first query that benefits from JSONL data.
   */
  async loadFromJSONL(jsonlPath?: string): Promise<number> {
    const fs = await import('fs');
    const path = await import('path');
    const kuPath = jsonlPath ?? path.join(process.cwd(), 'god-learn', 'knowledge.jsonl');

    if (!fs.existsSync(kuPath)) {
      this.deps.log(`JSONL adapter: No knowledge.jsonl found at ${kuPath}`);
      return 0;
    }

    const lines = fs.readFileSync(kuPath, 'utf-8').split('\n').filter(Boolean);
    this.jsonlKUs = [];

    const confidenceMap: Record<string, number> = { high: 0.9, medium: 0.6, low: 0.3 };
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj && obj.id && obj.claim) {
          const rawConf = obj.confidence;
          const confidence = typeof rawConf === 'number' ? rawConf
            : typeof rawConf === 'string' ? (confidenceMap[rawConf.toLowerCase()] ?? 0.5)
            : 0.5;
          this.jsonlKUs.push({
            id: obj.id,
            claim: obj.claim,
            domain: obj.domain || 'unknown',
            source: obj.source || (obj.sources?.[0]?.author) || 'corpus',
            confidence,
          });
        }
      } catch {
        // skip malformed lines
      }
    }

    this.jsonlLoaded = true;
    this.deps.log(`JSONL adapter: Loaded ${this.jsonlKUs.length} KUs from ${kuPath}`);
    return this.jsonlKUs.length;
  }

  /**
   * Get all KUs from the JSONL backing store.
   * Loads lazily on first call.
   */
  async getJSONLKnowledgeUnits(): Promise<Array<{ id: string; claim: string; domain: string; source: string; confidence: number }>> {
    if (!this.jsonlLoaded) {
      await this.loadFromJSONL();
    }
    return [...this.jsonlKUs];
  }

  /**
   * Flush a new knowledge entry to the JSONL backing store.
   * Called after storeKnowledge() to keep both systems in sync.
   */
  async flushToJSONL(entry: { id: string; claim: string; domain: string; source?: string; confidence?: number }, jsonlPath?: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const kuPath = jsonlPath ?? path.join(process.cwd(), 'god-learn', 'knowledge.jsonl');

    const jsonlEntry = {
      id: entry.id,
      claim: entry.claim,
      domain: entry.domain,
      sources: [{ chunk_id: null, doc_id: null, pages: [], author: entry.source || 'unknown' }],
      confidence: entry.confidence ?? 0.5,
      created_from_query: 'knowledge_manager_sync',
    };

    fs.appendFileSync(kuPath, JSON.stringify(jsonlEntry) + '\n', 'utf-8');
    this.deps.log(`JSONL adapter: Flushed KU ${entry.id} to ${kuPath}`);

    // Also update in-memory cache
    this.jsonlKUs.push({
      id: entry.id,
      claim: entry.claim,
      domain: entry.domain,
      source: entry.source || 'unknown',
      confidence: entry.confidence ?? 0.5,
    });
  }
}
