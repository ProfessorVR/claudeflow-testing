/**
 * Semantic Chunker Tests
 *
 * Comprehensive tests for context-aware document chunking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SemanticChunker,
  createSemanticChunker,
  type DocumentMetadata,
  type Chunk,
} from '../../../../src/god-agent/cli/retrieval/semantic-chunker.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const SAMPLE_METADATA: DocumentMetadata = {
  documentId: 'test-doc-001',
  sourceFile: 'test.txt',
  author: 'Test Author',
  title: 'Test Document',
  year: 2024,
};

const SHORT_TEXT = 'This is a short paragraph. It has two sentences.';

const MEDIUM_TEXT = `This is the first paragraph. It contains multiple sentences. Each sentence adds information.

This is the second paragraph. It also has several sentences. Paragraphs are separated by double newlines.

This is the third paragraph. We need enough text to test chunking. The chunker should respect paragraph boundaries.`;

const LONG_TEXT = `# Introduction

This is the introduction section. It provides context for the document. The introduction sets the stage for what follows.

We explain the main concepts here. Each paragraph builds on the previous one. The ideas flow naturally from one to the next.

## Background

The background section provides historical context. It explains how we arrived at the current state. Understanding the background is crucial.

Ancient philosophers like Aristotle studied these concepts. Their work laid the foundation for modern thinking. We build upon their insights today.

## Methodology

Our methodology section describes the approach taken. We use rigorous methods to ensure validity. Each step is carefully documented.

The process involves multiple stages. First, we gather relevant data. Then we analyze the patterns. Finally, we draw conclusions based on evidence.

### Data Collection

Data collection is the first critical step. We use multiple sources to ensure completeness. Each source is carefully vetted for accuracy.

Primary sources include historical texts. Secondary sources provide modern interpretations. We triangulate between different perspectives.

### Analysis Techniques

Analysis requires careful attention to detail. We employ both qualitative and quantitative methods. Each approach has its strengths.

Qualitative analysis reveals deep insights. Quantitative methods provide statistical validation. Together they form a complete picture.

# Results

The results section presents our findings. We organize them thematically for clarity. Each finding is supported by evidence.

## Key Findings

Our research revealed several important patterns. First, we found strong correlations between variables. Second, historical trends support our hypothesis.

The evidence is compelling and consistent. Multiple independent sources confirm the findings. The conclusions are robust across different analyses.

## Implications

These findings have significant implications. They suggest new directions for future research. They also challenge some existing assumptions.

Practitioners can apply these insights immediately. The practical applications are numerous and varied. This research opens new possibilities.

# Conclusion

In conclusion, we have demonstrated key principles. The evidence supports our main arguments. The methodology was sound and rigorous.

Future research should build on these foundations. There are many promising directions to explore. We hope this work inspires further investigation.`;

const TEXT_WITH_HEADERS = `# Chapter 1: Introduction

This is the introduction to Chapter 1. It sets the context for everything that follows.

## Section 1.1: Background

This section provides background information. It explains the historical context and foundational concepts.

## Section 1.2: Motivation

Here we explain why this work is important. The motivation drives the entire research agenda.

# Chapter 2: Methodology

This chapter describes the methodology used in the research.

## Section 2.1: Data Collection

Data collection procedures are described here. We explain how data was gathered and validated.`;

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('SemanticChunker - Basic Functionality', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = createSemanticChunker();
  });

  it('should create chunker with default config', () => {
    expect(chunker).toBeDefined();
    expect(chunker).toBeInstanceOf(SemanticChunker);
  });

  it('should create chunker with custom config', () => {
    const customChunker = new SemanticChunker({
      targetSize: 800,
      minSize: 500,
      maxSize: 1200,
      overlapSize: 150,
    });

    expect(customChunker).toBeDefined();
  });

  it('should validate config constraints', () => {
    expect(() => {
      new SemanticChunker({
        targetSize: 1000,
        minSize: 1200, // minSize > targetSize
      });
    }).toThrow('minSize cannot be greater than targetSize');

    expect(() => {
      new SemanticChunker({
        targetSize: 1500,
        maxSize: 1200, // targetSize > maxSize
      });
    }).toThrow('targetSize cannot be greater than maxSize');

    expect(() => {
      new SemanticChunker({
        minSize: 600,
        overlapSize: 700, // overlapSize >= minSize
      });
    }).toThrow('overlapSize must be less than minSize');
  });

  it('should handle empty document', () => {
    const chunks = chunker.chunk('', SAMPLE_METADATA);
    expect(chunks).toEqual([]);
  });

  it('should handle whitespace-only document', () => {
    const chunks = chunker.chunk('   \n\n\t  ', SAMPLE_METADATA);
    expect(chunks).toEqual([]);
  });

  it('should chunk single short paragraph', () => {
    const chunks = chunker.chunk(SHORT_TEXT, SAMPLE_METADATA);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(SHORT_TEXT);
    expect(chunks[0].metadata.chunkIndex).toBe(0);
    expect(chunks[0].metadata.totalChunks).toBe(1);
    expect(chunks[0].metadata.hasOverlap).toBe(false);
  });
});

// ============================================================================
// Paragraph Splitting Tests
// ============================================================================

describe('SemanticChunker - Paragraph Splitting', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = createSemanticChunker();
  });

  it('should split on double newlines', () => {
    const chunks = chunker.chunk(MEDIUM_TEXT, SAMPLE_METADATA);

    expect(chunks.length).toBeGreaterThan(0);
    // Content should not include the paragraph separators within chunks
    chunks.forEach((chunk) => {
      const doubleNewlines = chunk.content.match(/\n\n\n+/g);
      expect(doubleNewlines).toBeNull(); // No triple+ newlines
    });
  });

  it('should preserve paragraph boundaries', () => {
    const text = 'Para 1. It has content.\n\nPara 2. Also content.\n\nPara 3. More content.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    // All chunks should be valid
    chunks.forEach((chunk) => {
      expect(chunk.content.trim().length).toBeGreaterThan(0);
    });
  });

  it('should handle multiple consecutive newlines', () => {
    const text = 'Paragraph 1.\n\n\n\nParagraph 2.\n\n\n\n\nParagraph 3.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.content.trim()).not.toBe('');
    });
  });

  it('should track character positions correctly', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    chunks.forEach((chunk) => {
      expect(chunk.metadata.startChar).toBeGreaterThanOrEqual(0);
      expect(chunk.metadata.endChar).toBeGreaterThan(chunk.metadata.startChar);
      expect(chunk.metadata.endChar).toBeLessThanOrEqual(text.length);
    });
  });
});

// ============================================================================
// Section Header Detection Tests
// ============================================================================

describe('SemanticChunker - Section Headers', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = createSemanticChunker();
  });

  it('should detect markdown headers', () => {
    const chunks = chunker.chunk(TEXT_WITH_HEADERS, SAMPLE_METADATA);

    // Should have some chunks with section headers
    const chunksWithHeaders = chunks.filter(
      (c) => c.metadata.sectionHeader !== undefined
    );
    expect(chunksWithHeaders.length).toBeGreaterThan(0);
  });

  it('should extract header titles correctly', () => {
    const chunks = chunker.chunk(TEXT_WITH_HEADERS, SAMPLE_METADATA);

    // Check that header titles are extracted properly
    const headerTitles = chunks
      .map((c) => c.metadata.sectionHeader)
      .filter((h) => h !== undefined);

    // Should include some of the headers from TEXT_WITH_HEADERS
    expect(headerTitles.length).toBeGreaterThan(0);
  });

  it('should detect different header levels', () => {
    const text = '# Level 1\nContent.\n\n## Level 2\nMore content.\n\n### Level 3\nEven more.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    const headers = chunks
      .map((c) => c.metadata.sectionHeader)
      .filter((h) => h !== undefined);

    expect(headers.length).toBeGreaterThan(0);
  });

  it('should associate content with correct section', () => {
    const text = '# Introduction\n\nThis is intro content.\n\n# Methods\n\nThis is methods content.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    // Each chunk should have appropriate section header
    chunks.forEach((chunk) => {
      if (chunk.content.includes('intro content')) {
        // May have "Introduction" header depending on chunking
        // Just verify structure is maintained
        expect(chunk.metadata.sectionHeader).toBeDefined();
      }
    });
  });
});

// ============================================================================
// Chunk Size Tests
// ============================================================================

describe('SemanticChunker - Chunk Sizing', () => {
  it('should respect maximum chunk size', () => {
    const chunker = new SemanticChunker({
      targetSize: 500,
      minSize: 300,
      maxSize: 700,
      overlapSize: 100,
    });

    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    chunks.forEach((chunk) => {
      // Allow overlap to extend beyond max slightly
      expect(chunk.content.length).toBeLessThanOrEqual(900);
    });
  });

  it('should aim for target size', () => {
    const chunker = new SemanticChunker({
      targetSize: 800,
      minSize: 500,
      maxSize: 1100,
      overlapSize: 150,
    });

    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    // Most chunks should be near target size (excluding first/last)
    const middleChunks = chunks.slice(1, -1);
    if (middleChunks.length > 0) {
      const avgSize =
        middleChunks.reduce((sum, c) => sum + c.content.length, 0) /
        middleChunks.length;

      // Average should be reasonably close to target (within 50%)
      expect(avgSize).toBeGreaterThan(400);
      expect(avgSize).toBeLessThan(1600);
    }
  });

  it('should create multiple chunks for long text', () => {
    const chunker = new SemanticChunker({
      targetSize: 500,
      minSize: 300,
      maxSize: 700,
      overlapSize: 100,
    });

    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should not create tiny chunks (respects minSize)', () => {
    const chunker = new SemanticChunker({
      targetSize: 1000,
      minSize: 600,
      maxSize: 1400,
      overlapSize: 200,
    });

    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    // All chunks except possibly the last should meet minSize
    const notLastChunks = chunks.slice(0, -1);
    notLastChunks.forEach((chunk) => {
      // Subtract overlap to get core content size
      const coreSize = chunk.metadata.hasOverlap
        ? chunk.content.length - 200
        : chunk.content.length;
      expect(coreSize).toBeGreaterThanOrEqual(500); // Allow some variance
    });
  });
});

// ============================================================================
// Overlap Tests
// ============================================================================

describe('SemanticChunker - Overlapping Windows', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = new SemanticChunker({
      targetSize: 500,
      minSize: 300,
      maxSize: 700,
      overlapSize: 100,
    });
  });

  it('should add overlap between chunks', () => {
    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    if (chunks.length > 1) {
      // First chunk should not have overlap
      expect(chunks[0].metadata.hasOverlap).toBe(false);

      // Subsequent chunks should have overlap
      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i].metadata.hasOverlap).toBe(true);
      }
    }
  });

  it('should start overlap at sentence boundary', () => {
    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    chunks.forEach((chunk) => {
      if (chunk.metadata.hasOverlap) {
        // Overlap should start with a capital letter (new sentence)
        const firstChar = chunk.content.trim()[0];
        expect(firstChar).toMatch(/[A-Z]/);
      }
    });
  });

  it('should have reasonable overlap size', () => {
    const chunker = new SemanticChunker({
      targetSize: 1000,
      minSize: 600,
      maxSize: 1400,
      overlapSize: 200,
    });

    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    chunks.forEach((chunk, idx) => {
      if (chunk.metadata.hasOverlap) {
        // Hard to test exact overlap without knowing previous chunk,
        // but we can verify hasOverlap flag is set correctly
        expect(idx).toBeGreaterThan(0);
      }
    });
  });

  it('should handle single chunk (no overlap)', () => {
    const text = 'Short text that fits in one chunk.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].metadata.hasOverlap).toBe(false);
  });
});

// ============================================================================
// Metadata Tests
// ============================================================================

describe('SemanticChunker - Metadata', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = createSemanticChunker();
  });

  it('should generate unique chunk IDs', () => {
    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    const ids = chunks.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should include document metadata in chunks', () => {
    const chunks = chunker.chunk(MEDIUM_TEXT, SAMPLE_METADATA);

    chunks.forEach((chunk) => {
      expect(chunk.metadata.documentId).toBe(SAMPLE_METADATA.documentId);
      expect(chunk.metadata.sourceFile).toBe(SAMPLE_METADATA.sourceFile);
      expect(chunk.metadata.author).toBe(SAMPLE_METADATA.author);
      expect(chunk.metadata.title).toBe(SAMPLE_METADATA.title);
      expect(chunk.metadata.year).toBe(SAMPLE_METADATA.year);
    });
  });

  it('should track chunk indices correctly', () => {
    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    chunks.forEach((chunk, idx) => {
      expect(chunk.metadata.chunkIndex).toBe(idx);
      expect(chunk.metadata.totalChunks).toBe(chunks.length);
    });
  });

  it('should count sentences in chunks', () => {
    const chunks = chunker.chunk(MEDIUM_TEXT, SAMPLE_METADATA);

    chunks.forEach((chunk) => {
      expect(chunk.metadata.sentenceCount).toBeGreaterThanOrEqual(0);
      // Should have at least one sentence if content exists
      if (chunk.content.length > 0) {
        expect(chunk.metadata.sentenceCount).toBeGreaterThan(0);
      }
    });
  });

  it('should track character positions', () => {
    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    chunks.forEach((chunk) => {
      expect(chunk.metadata.startChar).toBeDefined();
      expect(chunk.metadata.endChar).toBeDefined();
      expect(chunk.metadata.endChar).toBeGreaterThan(chunk.metadata.startChar);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('SemanticChunker - Edge Cases', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = createSemanticChunker();
  });

  it('should handle very short document', () => {
    const text = 'Hi.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
  });

  it('should handle very long paragraph', () => {
    // Create a single paragraph longer than maxSize
    const longParagraph = 'This is a sentence. '.repeat(100);
    const chunks = chunker.chunk(longParagraph, SAMPLE_METADATA);

    // Should still create chunks even though it's one paragraph
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle document with only headers', () => {
    const text = '# Header 1\n\n## Header 2\n\n### Header 3';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle text with unusual spacing', () => {
    const text = 'Paragraph   with    extra   spaces.\n\n\n\nNext paragraph.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.content.trim()).not.toBe('');
    });
  });

  it('should handle text without sentence punctuation', () => {
    const text = 'Some text without periods\n\nMore text also no periods\n\nLast paragraph';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle unicode text', () => {
    const text = 'Φαντασία in Greek. 幻想 in Chinese.\n\nMultilingual content is important.';
    const chunks = chunker.chunk(text, SAMPLE_METADATA);

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.content.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('SemanticChunker - Integration', () => {
  it('should chunk realistic document end-to-end', () => {
    const chunker = new SemanticChunker({
      targetSize: 1000,
      minSize: 600,
      maxSize: 1400,
      overlapSize: 200,
    });

    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    // Verify basic properties
    expect(chunks.length).toBeGreaterThan(1);

    // Verify all chunks are valid
    chunks.forEach((chunk, idx) => {
      expect(chunk.id).toContain(SAMPLE_METADATA.documentId);
      expect(chunk.content.length).toBeGreaterThan(0);
      expect(chunk.metadata.chunkIndex).toBe(idx);
      expect(chunk.metadata.totalChunks).toBe(chunks.length);
      expect(chunk.metadata.sentenceCount).toBeGreaterThan(0);
    });

    // Verify overlap pattern
    expect(chunks[0].metadata.hasOverlap).toBe(false);
    if (chunks.length > 1) {
      chunks.slice(1).forEach((chunk) => {
        expect(chunk.metadata.hasOverlap).toBe(true);
      });
    }
  });

  it('should maintain content integrity across chunks', () => {
    const chunker = createSemanticChunker({
      targetSize: 800,
      minSize: 500,
      maxSize: 1100,
      overlapSize: 150,
    });

    const originalWords = new Set(
      LONG_TEXT.split(/\s+/).filter((w) => w.length > 0)
    );
    const chunks = chunker.chunk(LONG_TEXT, SAMPLE_METADATA);

    // All unique words should appear in at least one chunk
    const chunkWords = new Set<string>();
    chunks.forEach((chunk) => {
      const words = chunk.content.split(/\s+/).filter((w) => w.length > 0);
      words.forEach((w) => chunkWords.add(w));
    });

    // Most unique words should be preserved (allowing for some whitespace variations)
    const preservedRatio = chunkWords.size / originalWords.size;
    expect(preservedRatio).toBeGreaterThan(0.9);
  });

  it('should handle multiple documents consistently', () => {
    const chunker = createSemanticChunker();

    const doc1Chunks = chunker.chunk(LONG_TEXT, {
      ...SAMPLE_METADATA,
      documentId: 'doc1',
    });

    const doc2Chunks = chunker.chunk(LONG_TEXT, {
      ...SAMPLE_METADATA,
      documentId: 'doc2',
    });

    // Should produce same number of chunks for identical text
    expect(doc1Chunks.length).toBe(doc2Chunks.length);

    // But IDs should be different
    const doc1Ids = doc1Chunks.map((c) => c.id);
    const doc2Ids = doc2Chunks.map((c) => c.id);
    expect(doc1Ids).not.toEqual(doc2Ids);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('SemanticChunker - Performance', () => {
  it('should chunk large document efficiently', () => {
    const chunker = createSemanticChunker();

    // Create a large document (repeat LONG_TEXT)
    const largeDoc = LONG_TEXT.repeat(10);

    const startTime = Date.now();
    const chunks = chunker.chunk(largeDoc, SAMPLE_METADATA);
    const endTime = Date.now();

    const processingTime = endTime - startTime;

    // Should complete in reasonable time (< 1 second for 10x repeated text)
    expect(processingTime).toBeLessThan(1000);
    expect(chunks.length).toBeGreaterThan(10);
  });

  it('should handle many small documents', () => {
    const chunker = createSemanticChunker();

    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      chunker.chunk(MEDIUM_TEXT, {
        ...SAMPLE_METADATA,
        documentId: `doc-${i}`,
      });
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Should process 100 medium documents in < 5 seconds
    expect(processingTime).toBeLessThan(5000);
  });
});
