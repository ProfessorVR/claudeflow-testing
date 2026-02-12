/**
 * Retrieval Module - Hybrid BM25 + Semantic Search
 *
 * Main entry point for the retrieval enhancement system.
 *
 * @module retrieval
 */

// Export BM25 components
export {
  BM25Index,
  BM25Document,
  BM25Result,
  BM25Config,
  createBM25Index,
  createInitializedBM25Index,
} from './bm25-index.js';

// Export fusion components
export {
  RankedResult,
  FusedResult,
  RRFConfig,
  fuseResults,
  fuseTwoLists,
  computeRRFScore,
  normalizeRRFScores,
  topKResults,
  analyzeFusion,
  fusedToRanked,
  fusedArrayToRanked,
  formatFusionResults,
} from './fusion.js';

// Export hybrid retriever
export {
  HybridRetriever,
  HybridRetrieverConfig,
  HybridResult,
  RetrievalStats,
  createHybridRetriever,
  createInitializedHybridRetriever,
} from './hybrid-retriever.js';

// Export re-ranking cache
export {
  RerankingCache,
  CachedScore,
  CacheStats,
  RerankingCacheConfig,
  createRerankingCache,
} from './reranking-cache.js';

// Export cross-encoder re-ranker
export {
  CrossEncoderReranker,
  CrossEncoderMode,
  RerankCandidate,
  RerankedResult,
  RerankingStats,
  CrossEncoderRerankerConfig,
  createCrossEncoderReranker,
  createInitializedCrossEncoderReranker,
} from './cross-encoder-reranker.js';

// Export semantic chunker
export {
  SemanticChunker,
  ChunkerConfig,
  DocumentMetadata,
  Chunk,
  ChunkMetadata,
  createSemanticChunker,
} from './semantic-chunker.js';

// Export chunk processor
export {
  ChunkProcessor,
  ChunkProcessorConfig,
  ProcessingDocument,
  ProcessingResult,
  BatchStats,
  ProgressCallback,
  createChunkProcessor,
  extractChunks,
  filterSuccessful,
  filterFailed,
  groupChunksByDocument,
} from './chunk-processor.js';

// Export citation graph (Phase 4)
export {
  CitationGraph,
  CitationNode,
  CitationEdge,
  RelatedDocument,
  CitationGraphStats,
  PageRankConfig,
  CitationGraphJSON,
  createCitationGraph,
  generateCitationId,
} from './citation-graph.js';

// Export citation extractor (Phase 4)
export {
  CitationExtractor,
  ExtractedCitation,
  ReferenceEntry,
  CitationExtractionResult,
  CitationExtractorConfig,
  createCitationExtractor,
} from './citation-extractor.js';

// Export citation expander (Phase 4)
export {
  CitationExpander,
  ExpandableResult,
  ExpandedResult,
  CitationExpanderConfig,
  ExpansionStats,
  createCitationExpander,
} from './citation-expander.js';
