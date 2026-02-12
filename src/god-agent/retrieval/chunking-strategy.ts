/**
 * SemanticChunker - Intelligent document chunking for RAG
 *
 * Research shows optimal chunk sizes are 200-500 words for retrieval quality.
 * This module implements semantic-aware chunking that:
 * - Respects paragraph boundaries
 * - Maintains semantic coherence
 * - Targets 350-word chunks (optimal for embeddings)
 * - Supports overlap for context continuity
 *
 * Part of Phase A Quality Enhancement implementation.
 * Expected improvement: 30%+ retrieval quality
 */

import { ContextChunk } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface Chunk {
  /** Unique chunk identifier */
  id: string;

  /** Chunk text content */
  content: string;

  /** Word count */
  wordCount: number;

  /** Start position in original document */
  startOffset: number;

  /** End position in original document */
  endOffset: number;

  /** Metadata about the chunk */
  metadata: {
    /** Document ID */
    docId?: string;
    /** Section header if available */
    section?: string;
    /** Chunk index in sequence */
    chunkIndex: number;
    /** Total chunks in document */
    totalChunks?: number;
    /** Whether this chunk has overlap from previous */
    hasOverlap?: boolean;
    /** Semantic type (paragraph, heading, list, etc.) */
    semanticType?: 'paragraph' | 'heading' | 'list' | 'quote' | 'mixed';
  };
}

export interface ChunkingConfig {
  /** Target chunk size in words (default: 350) */
  targetSize?: number;

  /** Minimum chunk size in words (default: 200) */
  minSize?: number;

  /** Maximum chunk size in words (default: 500) */
  maxSize?: number;

  /** Overlap between chunks in words (default: 50) */
  overlap?: number;

  /** Preserve paragraph boundaries (default: true) */
  preserveParagraphs?: boolean;

  /** Include section headers in chunks (default: true) */
  includeHeaders?: boolean;

  /** Document ID for chunk identification */
  docId?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<ChunkingConfig> = {
  targetSize: 350,
  minSize: 200,
  maxSize: 500,
  overlap: 50,
  preserveParagraphs: true,
  includeHeaders: true,
  docId: 'doc',
};

// ============================================================================
// SemanticChunker Class
// ============================================================================

/**
 * Semantic-aware document chunker for optimal retrieval
 */
export class SemanticChunker {
  private config: Required<ChunkingConfig>;

  constructor(config?: ChunkingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Chunk a document into semantic units
   *
   * @param document - Full document text
   * @returns Array of chunks
   */
  async chunk(document: string): Promise<Chunk[]> {
    if (!document || document.trim().length === 0) {
      return [];
    }

    // Step 1: Split by semantic boundaries (paragraphs and sections)
    const paragraphs = this.splitByParagraphs(document);

    // Step 2: Group paragraphs into optimal-sized chunks
    const chunks = this.groupParagraphs(paragraphs, document);

    // Step 3: Add overlap for context continuity
    const overlappedChunks = this.addOverlap(chunks, document);

    // Step 4: Finalize chunks with metadata
    return this.finalizeChunks(overlappedChunks);
  }

  /**
   * Split document by paragraph boundaries
   */
  private splitByParagraphs(document: string): Array<{ text: string; offset: number; isHeader: boolean }> {
    const paragraphs: Array<{ text: string; offset: number; isHeader: boolean }> = [];
    const lines = document.split(/\n/);

    let currentOffset = 0;
    let currentParagraph: string[] = [];
    let paragraphStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLength = line.length + 1; // +1 for newline

      // Check if this is a header line
      const isHeader = /^#+\s/.test(line.trim());

      // Check if this is an empty line (paragraph boundary)
      const isEmpty = line.trim().length === 0;

      if (isEmpty || isHeader) {
        // Finalize current paragraph if exists
        if (currentParagraph.length > 0) {
          const text = currentParagraph.join('\n').trim();
          if (text.length > 0) {
            paragraphs.push({
              text,
              offset: paragraphStart,
              isHeader: false,
            });
          }
          currentParagraph = [];
        }

        // Add header as separate paragraph
        if (isHeader && line.trim().length > 0) {
          paragraphs.push({
            text: line.trim(),
            offset: currentOffset,
            isHeader: true,
          });
        }

        paragraphStart = currentOffset + lineLength;
      } else {
        if (currentParagraph.length === 0) {
          paragraphStart = currentOffset;
        }
        currentParagraph.push(line);
      }

      currentOffset += lineLength;
    }

    // Add final paragraph
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n').trim();
      if (text.length > 0) {
        paragraphs.push({
          text,
          offset: paragraphStart,
          isHeader: false,
        });
      }
    }

    return paragraphs;
  }

  /**
   * Group paragraphs into optimal-sized chunks
   */
  private groupParagraphs(
    paragraphs: Array<{ text: string; offset: number; isHeader: boolean }>,
    document: string
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;
    let chunkStartOffset = paragraphs[0]?.offset ?? 0;
    let currentSection = '';
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const paraWordCount = this.countWords(para.text);

      // Track current section
      if (para.isHeader && this.config.includeHeaders) {
        currentSection = para.text.replace(/^#+\s*/, '');
      }

      // If adding this paragraph exceeds max, finalize current chunk
      if (currentWordCount + paraWordCount > this.config.maxSize && currentChunk.length > 0) {
        const content = currentChunk.join('\n\n');
        const endOffset = chunkStartOffset + content.length;

        chunks.push({
          id: `${this.config.docId}_chunk_${chunkIndex}`,
          content,
          wordCount: currentWordCount,
          startOffset: chunkStartOffset,
          endOffset,
          metadata: {
            docId: this.config.docId,
            section: currentSection,
            chunkIndex,
            semanticType: this.detectSemanticType(content),
          },
        });

        chunkIndex++;
        currentChunk = [para.text];
        currentWordCount = paraWordCount;
        chunkStartOffset = para.offset;
      } else {
        currentChunk.push(para.text);
        currentWordCount += paraWordCount;
      }

      // If we've reached target size and at a good boundary, finalize
      if (currentWordCount >= this.config.targetSize && this.isGoodBreakpoint(paragraphs, i)) {
        const content = currentChunk.join('\n\n');
        const endOffset = chunkStartOffset + content.length;

        chunks.push({
          id: `${this.config.docId}_chunk_${chunkIndex}`,
          content,
          wordCount: currentWordCount,
          startOffset: chunkStartOffset,
          endOffset,
          metadata: {
            docId: this.config.docId,
            section: currentSection,
            chunkIndex,
            semanticType: this.detectSemanticType(content),
          },
        });

        chunkIndex++;
        currentChunk = [];
        currentWordCount = 0;
        chunkStartOffset = paragraphs[i + 1]?.offset ?? (para.offset + para.text.length);
      }
    }

    // Add remaining content as final chunk
    if (currentChunk.length > 0) {
      const content = currentChunk.join('\n\n');

      // Only add if it meets minimum size or is the only content
      if (currentWordCount >= this.config.minSize || chunks.length === 0) {
        chunks.push({
          id: `${this.config.docId}_chunk_${chunkIndex}`,
          content,
          wordCount: currentWordCount,
          startOffset: chunkStartOffset,
          endOffset: chunkStartOffset + content.length,
          metadata: {
            docId: this.config.docId,
            section: currentSection,
            chunkIndex,
            semanticType: this.detectSemanticType(content),
          },
        });
      } else if (chunks.length > 0) {
        // Merge small remainder with previous chunk
        const lastChunk = chunks[chunks.length - 1];
        lastChunk.content += '\n\n' + content;
        lastChunk.wordCount += currentWordCount;
        lastChunk.endOffset = chunkStartOffset + content.length;
      }
    }

    return chunks;
  }

  /**
   * Add overlap between chunks for context continuity
   */
  private addOverlap(chunks: Chunk[], document: string): Chunk[] {
    if (this.config.overlap === 0 || chunks.length <= 1) {
      return chunks;
    }

    return chunks.map((chunk, i) => {
      if (i === 0) {
        return chunk;
      }

      const prevChunk = chunks[i - 1];
      const prevWords = prevChunk.content.split(/\s+/);

      // Get overlap words from previous chunk
      const overlapWords = prevWords.slice(-this.config.overlap);
      const overlapText = overlapWords.join(' ');

      // Prepend overlap to current chunk
      return {
        ...chunk,
        content: `[...] ${overlapText}\n\n${chunk.content}`,
        wordCount: chunk.wordCount + overlapWords.length,
        metadata: {
          ...chunk.metadata,
          hasOverlap: true,
        },
      };
    });
  }

  /**
   * Finalize chunks with total count metadata
   */
  private finalizeChunks(chunks: Chunk[]): Chunk[] {
    const totalChunks = chunks.length;

    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        totalChunks,
      },
    }));
  }

  /**
   * Check if this is a good point to break chunks
   */
  private isGoodBreakpoint(
    paragraphs: Array<{ text: string; offset: number; isHeader: boolean }>,
    index: number
  ): boolean {
    // Good breakpoints:
    // 1. Before a header
    // 2. After a paragraph ending with period/question/exclamation
    // 3. Before a list or quote

    const nextPara = paragraphs[index + 1];
    if (!nextPara) return true;

    // Before a header is always good
    if (nextPara.isHeader) return true;

    // Check if next paragraph starts a new semantic unit
    if (/^[\-\*\d]\.?\s/.test(nextPara.text)) return true; // List item
    if (/^>/.test(nextPara.text)) return true; // Quote

    // Current paragraph ends a thought
    const currentPara = paragraphs[index];
    if (/[.!?]["']?\s*$/.test(currentPara.text)) return true;

    return false;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Detect the semantic type of content
   */
  private detectSemanticType(content: string): 'paragraph' | 'heading' | 'list' | 'quote' | 'mixed' {
    const hasHeading = /^#+\s/m.test(content);
    const hasList = /^[\-\*\d]\.?\s/m.test(content);
    const hasQuote = /^>/m.test(content);
    const hasParagraph = content.split('\n').some(line =>
      line.trim().length > 50 && !/^[#\-\*\d>]/.test(line.trim())
    );

    const types = [hasHeading, hasList, hasQuote, hasParagraph].filter(Boolean).length;

    if (types > 1) return 'mixed';
    if (hasHeading) return 'heading';
    if (hasList) return 'list';
    if (hasQuote) return 'quote';
    return 'paragraph';
  }

  /**
   * Convert chunks to ContextChunk format for retrieval layer
   */
  toContextChunks(
    chunks: Chunk[],
    documentMetadata: { author: string; title: string; year: number; collection: string }
  ): ContextChunk[] {
    return chunks.map(chunk => ({
      chunkId: chunk.id,
      docId: chunk.metadata.docId || this.config.docId,
      content: chunk.content,
      metadata: {
        author: documentMetadata.author,
        title: documentMetadata.title,
        year: documentMetadata.year,
        page_start: 0, // Would need page mapping
        page_end: 0,
        collection: documentMetadata.collection,
        section: chunk.metadata.section,
        chunkIndex: chunk.metadata.chunkIndex,
        wordCount: chunk.wordCount,
      },
      relevanceScore: 0, // Set during retrieval
    }));
  }

  /**
   * Get statistics about chunking
   */
  getChunkingStats(chunks: Chunk[]): {
    totalChunks: number;
    avgWordCount: number;
    minWordCount: number;
    maxWordCount: number;
    totalWords: number;
  } {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        avgWordCount: 0,
        minWordCount: 0,
        maxWordCount: 0,
        totalWords: 0,
      };
    }

    const wordCounts = chunks.map(c => c.wordCount);
    const totalWords = wordCounts.reduce((a, b) => a + b, 0);

    return {
      totalChunks: chunks.length,
      avgWordCount: totalWords / chunks.length,
      minWordCount: Math.min(...wordCounts),
      maxWordCount: Math.max(...wordCounts),
      totalWords,
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a semantic chunker with default configuration
 */
export function createDefaultChunker(docId?: string): SemanticChunker {
  return new SemanticChunker({ docId });
}

/**
 * Create a chunker optimized for academic papers
 */
export function createAcademicChunker(docId?: string): SemanticChunker {
  return new SemanticChunker({
    targetSize: 400,
    minSize: 250,
    maxSize: 600,
    overlap: 75,
    preserveParagraphs: true,
    includeHeaders: true,
    docId,
  });
}

/**
 * Create a chunker for dense technical content
 */
export function createTechnicalChunker(docId?: string): SemanticChunker {
  return new SemanticChunker({
    targetSize: 300,
    minSize: 150,
    maxSize: 400,
    overlap: 50,
    preserveParagraphs: true,
    includeHeaders: true,
    docId,
  });
}
