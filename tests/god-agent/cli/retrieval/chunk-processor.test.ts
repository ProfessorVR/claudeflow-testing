/**
 * Chunk Processor Tests
 *
 * Tests for batch processing and pipeline integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ChunkProcessor,
  createChunkProcessor,
  extractChunks,
  filterSuccessful,
  filterFailed,
  groupChunksByDocument,
  type ProcessingDocument,
  type ProcessingResult,
} from '../../../../src/god-agent/cli/retrieval/chunk-processor.js';
import type { DocumentMetadata } from '../../../../src/god-agent/cli/retrieval/semantic-chunker.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestDocument = (
  id: string,
  content: string
): ProcessingDocument => ({
  content,
  metadata: {
    documentId: id,
    sourceFile: `${id}.txt`,
    author: 'Test Author',
    title: `Document ${id}`,
  },
});

const SHORT_DOC = createTestDocument(
  'short-1',
  'This is a short document. It has minimal content.'
);

const MEDIUM_DOC = createTestDocument(
  'medium-1',
  `# Introduction

This is a medium-length document. It has several paragraphs organized into sections.

## Background

The background provides context. It explains the foundational concepts needed to understand the rest of the document.

## Methods

This section describes the methodology. We explain our approach in detail here.`
);

const LONG_DOC = createTestDocument(
  'long-1',
  `# Chapter 1

This is a long document with multiple chapters and sections. Each section contains substantial content.

## Section 1.1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Section 1.2

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

# Chapter 2

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Section 2.1

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Section 2.2

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.`.repeat(
    3
  )
);

const INVALID_DOC: ProcessingDocument = {
  content: '', // Empty content should still process
  metadata: {
    documentId: 'invalid-1',
    sourceFile: 'invalid.txt',
  },
};

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('ChunkProcessor - Basic Functionality', () => {
  let processor: ChunkProcessor;

  beforeEach(() => {
    processor = createChunkProcessor();
  });

  it('should create processor with default config', () => {
    expect(processor).toBeDefined();
    expect(processor).toBeInstanceOf(ChunkProcessor);
  });

  it('should create processor with custom config', () => {
    const customProcessor = new ChunkProcessor({
      chunkerConfig: {
        targetSize: 800,
        minSize: 500,
        maxSize: 1100,
        overlapSize: 150,
      },
      verbose: false,
      batchSize: 5,
    });

    expect(customProcessor).toBeDefined();
  });

  it('should get current config', () => {
    const config = processor.getConfig();

    expect(config).toBeDefined();
    expect(config.targetSize).toBe(1000);
    expect(config.minSize).toBe(600);
    expect(config.maxSize).toBe(1400);
    expect(config.overlapSize).toBe(200);
  });
});

// ============================================================================
// Single Document Processing Tests
// ============================================================================

describe('ChunkProcessor - Single Document', () => {
  let processor: ChunkProcessor;

  beforeEach(() => {
    processor = createChunkProcessor();
  });

  it('should process short document', () => {
    const result = processor.processDocument(SHORT_DOC);

    expect(result.success).toBe(true);
    expect(result.documentId).toBe(SHORT_DOC.metadata.documentId);
    expect(result.chunkCount).toBeGreaterThan(0);
    expect(result.chunks.length).toBe(result.chunkCount);
    expect(result.error).toBeUndefined();
  });

  it('should process medium document', () => {
    const result = processor.processDocument(MEDIUM_DOC);

    expect(result.success).toBe(true);
    expect(result.documentId).toBe(MEDIUM_DOC.metadata.documentId);
    expect(result.chunkCount).toBeGreaterThan(0);
    expect(result.chunks.length).toBe(result.chunkCount);
  });

  it('should process long document', () => {
    const result = processor.processDocument(LONG_DOC);

    expect(result.success).toBe(true);
    expect(result.documentId).toBe(LONG_DOC.metadata.documentId);
    expect(result.chunkCount).toBeGreaterThan(1); // Should create multiple chunks
    expect(result.chunks.length).toBe(result.chunkCount);
  });

  it('should handle empty document gracefully', () => {
    const result = processor.processDocument(INVALID_DOC);

    expect(result.success).toBe(true); // Empty is valid
    expect(result.documentId).toBe(INVALID_DOC.metadata.documentId);
    expect(result.chunkCount).toBe(0);
    expect(result.chunks).toEqual([]);
  });

  it('should include all chunk metadata', () => {
    const result = processor.processDocument(MEDIUM_DOC);

    result.chunks.forEach((chunk, idx) => {
      expect(chunk.id).toContain(MEDIUM_DOC.metadata.documentId);
      expect(chunk.content).toBeDefined();
      expect(chunk.metadata.documentId).toBe(MEDIUM_DOC.metadata.documentId);
      expect(chunk.metadata.chunkIndex).toBe(idx);
      expect(chunk.metadata.totalChunks).toBe(result.chunkCount);
    });
  });
});

// ============================================================================
// Batch Processing Tests
// ============================================================================

describe('ChunkProcessor - Batch Processing', () => {
  let processor: ChunkProcessor;

  beforeEach(() => {
    processor = createChunkProcessor({ verbose: false });
  });

  it('should process batch of documents', async () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];

    const results = await processor.processBatch(documents);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should call progress callback', async () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];
    const progressCalls: Array<{
      current: number;
      total: number;
      docId: string;
    }> = [];

    await processor.processBatch(documents, (current, total, docId) => {
      progressCalls.push({ current, total, docId });
    });

    expect(progressCalls).toHaveLength(3);
    expect(progressCalls[0]).toEqual({
      current: 1,
      total: 3,
      docId: SHORT_DOC.metadata.documentId,
    });
    expect(progressCalls[2]).toEqual({
      current: 3,
      total: 3,
      docId: LONG_DOC.metadata.documentId,
    });
  });

  it('should handle mixed success/failure batch', async () => {
    const documents = [SHORT_DOC, INVALID_DOC, MEDIUM_DOC];

    const results = await processor.processBatch(documents);

    expect(results).toHaveLength(3);
    // All should succeed (empty doc is valid)
    expect(results.filter((r) => r.success).length).toBeGreaterThanOrEqual(2);
  });

  it('should process empty batch', async () => {
    const results = await processor.processBatch([]);

    expect(results).toEqual([]);
  });

  it('should preserve document order', async () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];

    const results = await processor.processBatch(documents);

    expect(results[0].documentId).toBe(SHORT_DOC.metadata.documentId);
    expect(results[1].documentId).toBe(MEDIUM_DOC.metadata.documentId);
    expect(results[2].documentId).toBe(LONG_DOC.metadata.documentId);
  });
});

// ============================================================================
// Re-chunking Tests
// ============================================================================

describe('ChunkProcessor - Re-chunking', () => {
  let processor: ChunkProcessor;

  beforeEach(() => {
    processor = createChunkProcessor({ verbose: false });
  });

  it('should re-chunk documents', async () => {
    const documents = [MEDIUM_DOC, LONG_DOC];

    const results = await processor.rechunk(documents);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should produce same results as initial chunking', async () => {
    const doc = MEDIUM_DOC;

    const firstResult = processor.processDocument(doc);
    const rechunkResults = await processor.rechunk([doc]);

    expect(rechunkResults[0].chunkCount).toBe(firstResult.chunkCount);
    expect(rechunkResults[0].chunks.length).toBe(firstResult.chunks.length);
  });
});

// ============================================================================
// Stream Processing Tests
// ============================================================================

describe('ChunkProcessor - Stream Processing', () => {
  let processor: ChunkProcessor;

  beforeEach(() => {
    processor = createChunkProcessor({ verbose: false });
  });

  it('should stream chunks with callback', async () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];
    const receivedChunks: Array<{ chunkId: string; docId: string }> = [];

    const stats = await processor.processStream(
      documents,
      (chunk, documentId) => {
        receivedChunks.push({ chunkId: chunk.id, docId: documentId });
      }
    );

    expect(receivedChunks.length).toBeGreaterThan(0);
    expect(stats.documentsProcessed).toBe(3);
    expect(stats.totalChunks).toBe(receivedChunks.length);
    expect(stats.successCount).toBe(3);
    expect(stats.failureCount).toBe(0);
  });

  it('should support async chunk callback', async () => {
    const documents = [SHORT_DOC, MEDIUM_DOC];
    let processedCount = 0;

    const stats = await processor.processStream(
      documents,
      async (chunk, documentId) => {
        // Simulate async processing
        await new Promise((resolve) => setTimeout(resolve, 1));
        processedCount++;
      }
    );

    expect(processedCount).toBe(stats.totalChunks);
  });

  it('should provide accurate stats', async () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];

    const stats = await processor.processStream(documents, () => {});

    expect(stats.documentsProcessed).toBe(3);
    expect(stats.successCount).toBe(3);
    expect(stats.failureCount).toBe(0);
    expect(stats.totalChunks).toBeGreaterThan(3); // LONG_DOC has multiple chunks
    expect(stats.avgChunksPerDoc).toBeGreaterThan(1);
    expect(stats.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should call progress callback during streaming', async () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];
    const progressCalls: number[] = [];

    await processor.processStream(
      documents,
      () => {},
      (current, total) => {
        progressCalls.push(current);
      }
    );

    expect(progressCalls).toEqual([1, 2, 3]);
  });

  it('should handle errors during streaming', async () => {
    const documents = [SHORT_DOC, INVALID_DOC, MEDIUM_DOC];

    const stats = await processor.processStream(documents, () => {});

    // All should succeed (empty doc is valid)
    expect(stats.successCount).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('ChunkProcessor - Utility Functions', () => {
  let processor: ChunkProcessor;

  beforeEach(() => {
    processor = createChunkProcessor({ verbose: false });
  });

  it('should extract all chunks from results', () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];
    const results = documents.map((doc) => processor.processDocument(doc));

    const allChunks = extractChunks(results);

    const expectedTotal = results.reduce((sum, r) => sum + r.chunkCount, 0);
    expect(allChunks).toHaveLength(expectedTotal);
  });

  it('should filter successful results', () => {
    const results: ProcessingResult[] = [
      {
        documentId: 'doc1',
        chunkCount: 5,
        chunks: [],
        success: true,
      },
      {
        documentId: 'doc2',
        chunkCount: 0,
        chunks: [],
        success: false,
        error: 'Failed',
      },
      {
        documentId: 'doc3',
        chunkCount: 3,
        chunks: [],
        success: true,
      },
    ];

    const successful = filterSuccessful(results);

    expect(successful).toHaveLength(2);
    expect(successful.every((r) => r.success)).toBe(true);
  });

  it('should filter failed results', () => {
    const results: ProcessingResult[] = [
      {
        documentId: 'doc1',
        chunkCount: 5,
        chunks: [],
        success: true,
      },
      {
        documentId: 'doc2',
        chunkCount: 0,
        chunks: [],
        success: false,
        error: 'Failed',
      },
      {
        documentId: 'doc3',
        chunkCount: 0,
        chunks: [],
        success: false,
        error: 'Also failed',
      },
    ];

    const failed = filterFailed(results);

    expect(failed).toHaveLength(2);
    expect(failed.every((r) => !r.success)).toBe(true);
  });

  it('should group chunks by document', () => {
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];
    const results = documents.map((doc) => processor.processDocument(doc));
    const allChunks = extractChunks(results);

    const grouped = groupChunksByDocument(allChunks);

    expect(grouped.size).toBe(3);
    expect(grouped.has(SHORT_DOC.metadata.documentId)).toBe(true);
    expect(grouped.has(MEDIUM_DOC.metadata.documentId)).toBe(true);
    expect(grouped.has(LONG_DOC.metadata.documentId)).toBe(true);

    // Verify chunks are grouped correctly
    const shortChunks = grouped.get(SHORT_DOC.metadata.documentId)!;
    expect(shortChunks.every((c) => c.metadata.documentId === SHORT_DOC.metadata.documentId)).toBe(true);
  });
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe('ChunkProcessor - Configuration', () => {
  it('should apply custom chunker config', () => {
    const processor = new ChunkProcessor({
      chunkerConfig: {
        targetSize: 500,
        minSize: 300,
        maxSize: 700,
        overlapSize: 100,
      },
    });

    const result = processor.processDocument(LONG_DOC);

    // With smaller chunks, should create more chunks
    expect(result.chunkCount).toBeGreaterThan(3);
  });

  it('should respect verbose setting', async () => {
    const verboseProcessor = new ChunkProcessor({ verbose: true });
    const quietProcessor = new ChunkProcessor({ verbose: false });

    // Both should work (verbose just adds logging)
    const verboseResult = await verboseProcessor.processBatch([SHORT_DOC]);
    const quietResult = await quietProcessor.processBatch([SHORT_DOC]);

    expect(verboseResult[0].success).toBe(true);
    expect(quietResult[0].success).toBe(true);
  });

  it('should handle different batch sizes', async () => {
    const smallBatchProcessor = new ChunkProcessor({ batchSize: 2 });
    const largeBatchProcessor = new ChunkProcessor({ batchSize: 10 });

    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];

    const smallResults = await smallBatchProcessor.processBatch(documents);
    const largeResults = await largeBatchProcessor.processBatch(documents);

    // Both should process all documents
    expect(smallResults).toHaveLength(3);
    expect(largeResults).toHaveLength(3);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('ChunkProcessor - Performance', () => {
  it('should process many documents efficiently', async () => {
    const processor = createChunkProcessor({ verbose: false });

    // Create 50 documents
    const documents = Array.from({ length: 50 }, (_, i) =>
      createTestDocument(`doc-${i}`, MEDIUM_DOC.content)
    );

    const startTime = Date.now();
    const results = await processor.processBatch(documents);
    const endTime = Date.now();

    const processingTime = endTime - startTime;

    expect(results).toHaveLength(50);
    expect(results.every((r) => r.success)).toBe(true);
    // Should process 50 medium documents in < 5 seconds
    expect(processingTime).toBeLessThan(5000);
  });

  it('should stream large batches efficiently', async () => {
    const processor = createChunkProcessor({ verbose: false });

    // Create 100 documents
    const documents = Array.from({ length: 100 }, (_, i) =>
      createTestDocument(`doc-${i}`, SHORT_DOC.content)
    );

    const startTime = Date.now();
    const stats = await processor.processStream(documents, () => {});
    const endTime = Date.now();

    const processingTime = endTime - startTime;

    expect(stats.documentsProcessed).toBe(100);
    expect(stats.successCount).toBe(100);
    // Should stream 100 short documents in < 3 seconds
    expect(processingTime).toBeLessThan(3000);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('ChunkProcessor - Integration', () => {
  it('should handle realistic workflow', async () => {
    const processor = new ChunkProcessor({
      chunkerConfig: {
        targetSize: 1000,
        minSize: 600,
        maxSize: 1400,
        overlapSize: 200,
      },
      verbose: false,
    });

    // Initial processing
    const documents = [SHORT_DOC, MEDIUM_DOC, LONG_DOC];
    const results = await processor.processBatch(documents);

    expect(results.every((r) => r.success)).toBe(true);

    // Extract and group chunks
    const allChunks = extractChunks(results);
    const grouped = groupChunksByDocument(allChunks);

    expect(grouped.size).toBe(3);

    // Re-chunk with different config
    const newProcessor = new ChunkProcessor({
      chunkerConfig: {
        targetSize: 500,
        minSize: 300,
        maxSize: 700,
        overlapSize: 100,
      },
    });

    const rechunkedResults = await newProcessor.rechunk(documents);

    // Should create more chunks with smaller target
    const newTotalChunks = rechunkedResults.reduce(
      (sum, r) => sum + r.chunkCount,
      0
    );
    expect(newTotalChunks).toBeGreaterThan(allChunks.length);
  });
});
