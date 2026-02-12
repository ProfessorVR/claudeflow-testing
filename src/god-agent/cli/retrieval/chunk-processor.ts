/**
 * Chunk Processor - Document Chunking Pipeline Integration
 *
 * Provides batch processing and re-chunking capabilities for document corpora.
 * Integrates SemanticChunker with storage backends (AgentDB, file system, etc.).
 *
 * Features:
 * - Batch document processing
 * - Progress tracking
 * - Re-chunking existing documents
 * - Backward compatibility with old chunks
 * - Error handling and retry logic
 *
 * @module chunk-processor
 */

import {
  SemanticChunker,
  ChunkerConfig,
  DocumentMetadata,
  Chunk,
  createSemanticChunker,
} from './semantic-chunker.js';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for ChunkProcessor
 */
export interface ChunkProcessorConfig {
  /** Chunker configuration */
  chunkerConfig?: ChunkerConfig;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Batch size for processing multiple documents */
  batchSize?: number;
}

/**
 * Input document for processing
 */
export interface ProcessingDocument {
  /** Document content */
  content: string;
  /** Document metadata */
  metadata: DocumentMetadata;
}

/**
 * Result of processing a single document
 */
export interface ProcessingResult {
  /** Document ID that was processed */
  documentId: string;
  /** Number of chunks created */
  chunkCount: number;
  /** Generated chunks */
  chunks: Chunk[];
  /** Processing success status */
  success: boolean;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Batch processing statistics
 */
export interface BatchStats {
  /** Total documents processed */
  documentsProcessed: number;
  /** Total chunks created */
  totalChunks: number;
  /** Number of successful documents */
  successCount: number;
  /** Number of failed documents */
  failureCount: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Average chunks per document */
  avgChunksPerDoc: number;
}

/**
 * Progress callback for batch processing
 */
export type ProgressCallback = (
  current: number,
  total: number,
  documentId: string
) => void;

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<ChunkProcessorConfig> = {
  chunkerConfig: {
    targetSize: 1000,
    minSize: 600,
    maxSize: 1400,
    overlapSize: 200,
  },
  verbose: false,
  batchSize: 10,
};

// ============================================================================
// ChunkProcessor Implementation
// ============================================================================

/**
 * Document chunking pipeline processor
 *
 * Handles batch processing of documents with the SemanticChunker,
 * providing progress tracking, error handling, and statistics.
 *
 * @example
 * ```typescript
 * const processor = new ChunkProcessor({
 *   chunkerConfig: { targetSize: 1000 },
 *   verbose: true
 * });
 *
 * const documents = [
 *   { content: text1, metadata: meta1 },
 *   { content: text2, metadata: meta2 }
 * ];
 *
 * const results = await processor.processBatch(documents, (current, total) => {
 *   console.log(`Processing ${current}/${total}`);
 * });
 * ```
 */
export class ChunkProcessor {
  private readonly config: Required<ChunkProcessorConfig>;
  private readonly chunker: SemanticChunker;

  /**
   * Create a new ChunkProcessor
   *
   * @param config - Processor configuration
   */
  constructor(config: ChunkProcessorConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      chunkerConfig: {
        ...DEFAULT_CONFIG.chunkerConfig,
        ...config.chunkerConfig,
      },
    };

    this.chunker = createSemanticChunker(this.config.chunkerConfig);
  }

  /**
   * Process a single document into chunks
   *
   * @param document - Document to process
   * @returns Processing result with chunks
   */
  processDocument(document: ProcessingDocument): ProcessingResult {
    try {
      const chunks = this.chunker.chunk(document.content, document.metadata);

      return {
        documentId: document.metadata.documentId,
        chunkCount: chunks.length,
        chunks,
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (this.config.verbose) {
        console.error(
          `Failed to process document ${document.metadata.documentId}:`,
          errorMessage
        );
      }

      return {
        documentId: document.metadata.documentId,
        chunkCount: 0,
        chunks: [],
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process multiple documents in batch
   *
   * Processes documents with progress tracking and error handling.
   * Failed documents are logged but don't stop the batch.
   *
   * @param documents - Array of documents to process
   * @param onProgress - Optional progress callback
   * @returns Array of processing results
   */
  async processBatch(
    documents: ProcessingDocument[],
    onProgress?: ProgressCallback
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, documents.length, doc.metadata.documentId);
      }

      // Process document
      const result = this.processDocument(doc);
      results.push(result);

      // Log if verbose
      if (this.config.verbose) {
        if (result.success) {
          console.log(
            `✓ ${doc.metadata.documentId}: ${result.chunkCount} chunks`
          );
        } else {
          console.error(`✗ ${doc.metadata.documentId}: ${result.error}`);
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;

    // Log summary if verbose
    if (this.config.verbose) {
      const stats = this.computeStats(results, processingTimeMs);
      this.logStats(stats);
    }

    return results;
  }

  /**
   * Re-chunk existing documents with new chunking parameters
   *
   * Useful for upgrading from fixed-size to semantic chunking.
   *
   * @param documents - Documents to re-chunk
   * @param onProgress - Optional progress callback
   * @returns Array of processing results
   */
  async rechunk(
    documents: ProcessingDocument[],
    onProgress?: ProgressCallback
  ): Promise<ProcessingResult[]> {
    if (this.config.verbose) {
      console.log(`Re-chunking ${documents.length} documents...`);
    }

    return this.processBatch(documents, onProgress);
  }

  /**
   * Process documents in streaming fashion (one at a time)
   *
   * Memory-efficient for large corpora.
   *
   * @param documents - Documents to process
   * @param onChunk - Callback for each generated chunk
   * @param onProgress - Optional progress callback
   */
  async processStream(
    documents: ProcessingDocument[],
    onChunk: (chunk: Chunk, documentId: string) => void | Promise<void>,
    onProgress?: ProgressCallback
  ): Promise<BatchStats> {
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;
    let totalChunks = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, documents.length, doc.metadata.documentId);
      }

      try {
        const chunks = this.chunker.chunk(doc.content, doc.metadata);
        totalChunks += chunks.length;
        successCount++;

        // Stream chunks to callback
        for (const chunk of chunks) {
          await onChunk(chunk, doc.metadata.documentId);
        }

        if (this.config.verbose) {
          console.log(
            `✓ ${doc.metadata.documentId}: ${chunks.length} chunks`
          );
        }
      } catch (error) {
        failureCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (this.config.verbose) {
          console.error(
            `✗ ${doc.metadata.documentId}: ${errorMessage}`
          );
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;

    const stats: BatchStats = {
      documentsProcessed: documents.length,
      totalChunks,
      successCount,
      failureCount,
      processingTimeMs,
      avgChunksPerDoc: successCount > 0 ? totalChunks / successCount : 0,
    };

    if (this.config.verbose) {
      this.logStats(stats);
    }

    return stats;
  }

  /**
   * Get current chunker configuration
   *
   * @returns Chunker configuration
   */
  getConfig(): ChunkerConfig {
    return { ...this.config.chunkerConfig };
  }

  /**
   * Compute batch processing statistics
   *
   * @param results - Processing results
   * @param processingTimeMs - Total processing time
   * @returns Batch statistics
   */
  private computeStats(
    results: ProcessingResult[],
    processingTimeMs: number
  ): BatchStats {
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunkCount, 0);

    return {
      documentsProcessed: results.length,
      totalChunks,
      successCount,
      failureCount,
      processingTimeMs,
      avgChunksPerDoc: successCount > 0 ? totalChunks / successCount : 0,
    };
  }

  /**
   * Log batch statistics to console
   *
   * @param stats - Statistics to log
   */
  private logStats(stats: BatchStats): void {
    console.log('\n=== Batch Processing Stats ===');
    console.log(`Documents Processed: ${stats.documentsProcessed}`);
    console.log(`  ✓ Success: ${stats.successCount}`);
    console.log(`  ✗ Failure: ${stats.failureCount}`);
    console.log(`Total Chunks: ${stats.totalChunks}`);
    console.log(`Avg Chunks/Doc: ${stats.avgChunksPerDoc.toFixed(2)}`);
    console.log(
      `Processing Time: ${(stats.processingTimeMs / 1000).toFixed(2)}s`
    );
    console.log(
      `Docs/Second: ${(
        (stats.documentsProcessed / stats.processingTimeMs) *
        1000
      ).toFixed(2)}`
    );
    console.log('==============================\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a ChunkProcessor with default configuration
 *
 * @param config - Optional processor configuration
 * @returns New ChunkProcessor instance
 */
export function createChunkProcessor(
  config?: ChunkProcessorConfig
): ChunkProcessor {
  return new ChunkProcessor(config);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract all chunks from processing results
 *
 * @param results - Array of processing results
 * @returns Flat array of all chunks
 */
export function extractChunks(results: ProcessingResult[]): Chunk[] {
  return results.flatMap((r) => r.chunks);
}

/**
 * Filter successful processing results
 *
 * @param results - Array of processing results
 * @returns Array of successful results
 */
export function filterSuccessful(
  results: ProcessingResult[]
): ProcessingResult[] {
  return results.filter((r) => r.success);
}

/**
 * Filter failed processing results
 *
 * @param results - Array of processing results
 * @returns Array of failed results
 */
export function filterFailed(results: ProcessingResult[]): ProcessingResult[] {
  return results.filter((r) => !r.success);
}

/**
 * Group chunks by document ID
 *
 * @param chunks - Array of chunks
 * @returns Map of documentId to chunks
 */
export function groupChunksByDocument(chunks: Chunk[]): Map<string, Chunk[]> {
  const groups = new Map<string, Chunk[]>();

  for (const chunk of chunks) {
    const docId = chunk.metadata.documentId;
    if (!groups.has(docId)) {
      groups.set(docId, []);
    }
    groups.get(docId)!.push(chunk);
  }

  return groups;
}
