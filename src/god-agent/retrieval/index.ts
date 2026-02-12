/**
 * Smart Retrieval Layer - Main exports
 *
 * Phase 1 of RAG Integration
 * Phase A: Semantic Chunking Strategy
 */

export { SmartRetrievalLayer } from './smart-retrieval-layer.js';
export type {
  ContextChunk,
  RetrievalOptions,
  HybridSearchWeights,
  CrossReference,
  RetrievalStats,
  CacheEntry,
  SmartRetrievalConfig,
  RetrievalDirection,
  RelatedChunksOptions,
} from './types.js';

// Semantic chunking (Phase A enhancement)
export {
  SemanticChunker,
  createDefaultChunker,
  createAcademicChunker,
  createTechnicalChunker,
  type Chunk,
  type ChunkingConfig,
} from './chunking-strategy.js';

// Hybrid retrieval with RRF (Phase A enhancement)
export {
  HybridRetriever,
  createMockHybridRetriever,
  reciprocalRankFusion,
  type HybridRetrievalOptions,
  type FusedResult,
  type HybridRetrievalStats,
} from './hybrid-retriever.js';
