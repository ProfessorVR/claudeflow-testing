/**
 * Semantic Chunker - Context-Aware Document Chunking
 *
 * Implements intelligent document segmentation that:
 * - Preserves paragraph boundaries
 * - Respects section headers
 * - Creates overlapping windows
 * - Maintains document structure
 * - Tracks rich metadata
 *
 * Unlike fixed-size chunking, semantic chunking creates coherent segments
 * that respect natural document boundaries, improving retrieval quality.
 *
 * @module semantic-chunker
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for SemanticChunker
 */
export interface ChunkerConfig {
  /** Target chunk size in characters (default: 1000) */
  targetSize?: number;
  /** Minimum chunk size in characters (default: 600) */
  minSize?: number;
  /** Maximum chunk size in characters (default: 1400) */
  maxSize?: number;
  /** Overlap size between chunks in characters (default: 200) */
  overlapSize?: number;
}

/**
 * Document metadata for chunking
 */
export interface DocumentMetadata {
  /** Unique document identifier */
  documentId: string;
  /** Source file path or name */
  sourceFile: string;
  /** Document author (optional) */
  author?: string;
  /** Document title (optional) */
  title?: string;
  /** Publication year (optional) */
  year?: number;
}

/**
 * Output chunk with content and metadata
 */
export interface Chunk {
  /** Unique chunk identifier */
  id: string;
  /** Chunk text content */
  content: string;
  /** Rich metadata about the chunk */
  metadata: ChunkMetadata;
}

/**
 * Metadata attached to each chunk
 */
export interface ChunkMetadata extends DocumentMetadata {
  /** Index of this chunk in the document */
  chunkIndex: number;
  /** Total number of chunks in the document */
  totalChunks: number;
  /** Start character position in original document */
  startChar: number;
  /** End character position in original document */
  endChar: number;
  /** Whether this chunk has overlap from previous chunk */
  hasOverlap: boolean;
  /** Section header this chunk belongs to (if any) */
  sectionHeader?: string;
  /** Number of sentences in this chunk */
  sentenceCount: number;
}

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Represents a paragraph in the document
 */
interface Paragraph {
  /** Paragraph text */
  text: string;
  /** Start character position */
  startChar: number;
  /** End character position */
  endChar: number;
  /** Number of sentences in paragraph */
  sentenceCount: number;
}

/**
 * Group of paragraphs forming a chunk
 */
interface ChunkGroup {
  /** Combined content of paragraphs */
  content: string;
  /** Start character position */
  startChar: number;
  /** End character position */
  endChar: number;
  /** Paragraphs in this group */
  paragraphs: Paragraph[];
  /** Whether this chunk has overlap */
  hasOverlap: boolean;
  /** Section header (if any) */
  sectionHeader?: string;
  /** Number of sentences */
  sentenceCount: number;
}

/**
 * Detected document structure
 */
interface DocumentStructure {
  /** All sections in the document */
  sections: Section[];
}

/**
 * Section in the document
 */
interface Section {
  /** Header level (1-6 for markdown) */
  level: number;
  /** Section title */
  title: string;
  /** Start line number */
  startLine: number;
  /** End line number */
  endLine: number;
  /** Start character position */
  startChar: number;
  /** End character position */
  endChar: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<ChunkerConfig> = {
  targetSize: 1000,
  minSize: 600,
  maxSize: 1400,
  overlapSize: 200,
};

// ============================================================================
// SemanticChunker Implementation
// ============================================================================

/**
 * Context-aware semantic document chunker
 *
 * Strategies:
 * 1. Paragraph preservation - Split on double newlines
 * 2. Section header detection - Identify markdown headers
 * 3. Sentence boundary detection - Split at sentence boundaries
 * 4. Overlapping windows - Create context bridges between chunks
 *
 * @example
 * ```typescript
 * const chunker = new SemanticChunker({
 *   targetSize: 1000,
 *   minSize: 600,
 *   maxSize: 1400,
 *   overlapSize: 200
 * });
 *
 * const chunks = chunker.chunk(documentText, {
 *   documentId: 'aristotle-de-anima',
 *   sourceFile: 'aristotle-de-anima.pdf',
 *   author: 'Aristotle',
 *   title: 'De Anima'
 * });
 * ```
 */
export class SemanticChunker {
  private readonly targetSize: number;
  private readonly minSize: number;
  private readonly maxSize: number;
  private readonly overlapSize: number;

  /**
   * Create a new SemanticChunker
   *
   * @param config - Chunker configuration options
   */
  constructor(config: ChunkerConfig = {}) {
    this.targetSize = config.targetSize ?? DEFAULT_CONFIG.targetSize;
    this.minSize = config.minSize ?? DEFAULT_CONFIG.minSize;
    this.maxSize = config.maxSize ?? DEFAULT_CONFIG.maxSize;
    this.overlapSize = config.overlapSize ?? DEFAULT_CONFIG.overlapSize;

    // Validate configuration
    if (this.minSize > this.targetSize) {
      throw new Error('minSize cannot be greater than targetSize');
    }
    if (this.targetSize > this.maxSize) {
      throw new Error('targetSize cannot be greater than maxSize');
    }
    if (this.overlapSize >= this.minSize) {
      throw new Error('overlapSize must be less than minSize');
    }
  }

  /**
   * Chunk document into semantically coherent segments
   *
   * Algorithm:
   * 1. Detect document structure (sections, headers)
   * 2. Split into paragraphs (on double newlines)
   * 3. Group paragraphs until target size reached
   * 4. Add overlapping windows between chunks
   * 5. Attach rich metadata to each chunk
   *
   * @param document - Document text to chunk
   * @param metadata - Document metadata
   * @returns Array of chunks with metadata
   */
  chunk(document: string, metadata: DocumentMetadata): Chunk[] {
    // Handle empty documents
    if (!document || document.trim().length === 0) {
      return [];
    }

    // Step 1: Detect document structure
    const structure = this.detectStructure(document);

    // Step 2: Split into paragraphs
    const paragraphs = this.splitParagraphs(document);

    // Handle very short documents
    if (paragraphs.length === 0) {
      return [];
    }

    // Step 3: Group paragraphs into chunks
    const chunkGroups = this.groupParagraphs(paragraphs, structure);

    // Step 4: Add overlap between chunks
    const overlappedChunks = this.addOverlap(chunkGroups);

    // Step 5: Add metadata and create final chunks
    return overlappedChunks.map((chunk, idx) => ({
      id: `${metadata.documentId}_chunk_${idx}`,
      content: chunk.content,
      metadata: {
        ...metadata,
        chunkIndex: idx,
        totalChunks: overlappedChunks.length,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        hasOverlap: chunk.hasOverlap,
        sectionHeader: chunk.sectionHeader,
        sentenceCount: chunk.sentenceCount,
      },
    }));
  }

  /**
   * Detect document structure (sections, subsections)
   *
   * Identifies markdown headers and their positions for context tracking.
   *
   * @param document - Document text
   * @returns Document structure with sections
   */
  private detectStructure(document: string): DocumentStructure {
    const sections: Section[] = [];
    const lines = document.split('\n');

    let currentSection: Section | null = null;
    let charPosition = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for markdown header (# Header, ## Header, etc.)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();

        // Close previous section
        if (currentSection) {
          currentSection.endLine = i - 1;
          currentSection.endChar = charPosition - 1;
        }

        // Create new section
        const section: Section = {
          level,
          title,
          startLine: i,
          endLine: -1, // Will be filled later
          startChar: charPosition,
          endChar: -1, // Will be filled later
        };

        sections.push(section);
        currentSection = section;
      }

      charPosition += line.length + 1; // +1 for newline
    }

    // Close final section
    if (currentSection) {
      currentSection.endLine = lines.length - 1;
      currentSection.endChar = charPosition - 1;
    }

    return { sections };
  }

  /**
   * Split document into paragraphs
   *
   * Splits on double newlines (\n\n+) while preserving character positions.
   *
   * @param document - Document text
   * @returns Array of paragraphs with metadata
   */
  private splitParagraphs(document: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Split on double newlines (or more)
    const parts = document.split(/\n\n+/);

    let currentPos = 0;

    for (const part of parts) {
      const trimmed = part.trim();

      // Skip empty paragraphs
      if (trimmed.length === 0) {
        // Advance position (account for the separator that was removed)
        const separatorMatch = document.substring(currentPos).match(/\n\n+/);
        if (separatorMatch) {
          currentPos += part.length + separatorMatch[0].length;
        } else {
          currentPos += part.length;
        }
        continue;
      }

      // Find actual start position of trimmed text in original document
      const startChar = document.indexOf(trimmed, currentPos);
      const endChar = startChar + trimmed.length;

      paragraphs.push({
        text: trimmed,
        startChar,
        endChar,
        sentenceCount: this.countSentences(trimmed),
      });

      // Move past this paragraph and its separator
      currentPos = endChar;
    }

    return paragraphs;
  }

  /**
   * Group paragraphs into chunks
   *
   * Algorithm:
   * - Start with empty chunk
   * - Add paragraphs until target size reached
   * - Don't exceed max size
   * - Don't create chunks smaller than min size (unless it's the last chunk)
   * - Track section headers for each chunk
   *
   * @param paragraphs - Array of paragraphs
   * @param structure - Document structure
   * @returns Array of chunk groups
   */
  private groupParagraphs(
    paragraphs: Paragraph[],
    structure: DocumentStructure
  ): ChunkGroup[] {
    const chunks: ChunkGroup[] = [];
    let currentChunk: ChunkGroup | null = null;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];

      // Initialize first chunk
      if (!currentChunk) {
        currentChunk = {
          content: para.text,
          startChar: para.startChar,
          endChar: para.endChar,
          paragraphs: [para],
          hasOverlap: false,
          sentenceCount: para.sentenceCount,
        };

        // Check for section header
        const sectionHeader = this.findSectionHeader(para, structure);
        if (sectionHeader) {
          currentChunk.sectionHeader = sectionHeader;
        }

        continue;
      }

      // Check if adding this paragraph would exceed max size
      const wouldExceed =
        currentChunk.content.length + 2 + para.text.length > this.maxSize; // +2 for \n\n

      // Check if current chunk meets minimum size
      const meetsMinimum = currentChunk.content.length >= this.minSize;

      if (wouldExceed && meetsMinimum) {
        // Finalize current chunk
        chunks.push(currentChunk);

        // Start new chunk with this paragraph
        currentChunk = {
          content: para.text,
          startChar: para.startChar,
          endChar: para.endChar,
          paragraphs: [para],
          hasOverlap: false,
          sentenceCount: para.sentenceCount,
        };

        // Check for section header
        const sectionHeader = this.findSectionHeader(para, structure);
        if (sectionHeader) {
          currentChunk.sectionHeader = sectionHeader;
        }
      } else {
        // Add paragraph to current chunk
        currentChunk.content += '\n\n' + para.text;
        currentChunk.endChar = para.endChar;
        currentChunk.paragraphs.push(para);
        currentChunk.sentenceCount += para.sentenceCount;

        // Update section header if this paragraph is a header
        const sectionHeader = this.findSectionHeader(para, structure);
        if (sectionHeader && !currentChunk.sectionHeader) {
          currentChunk.sectionHeader = sectionHeader;
        }
      }
    }

    // Add final chunk if non-empty
    if (currentChunk && currentChunk.content.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Add overlapping windows between chunks
   *
   * Creates context bridges by prepending text from the previous chunk
   * to the current chunk. Overlap starts at sentence boundaries.
   *
   * @param chunks - Array of chunk groups
   * @returns Array of chunks with overlap
   */
  private addOverlap(chunks: ChunkGroup[]): ChunkGroup[] {
    if (chunks.length <= 1) {
      return chunks;
    }

    const overlapped: ChunkGroup[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = { ...chunks[i] };

      // Add overlap from previous chunk (if exists)
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const overlapText = this.extractOverlap(
          prevChunk.content,
          this.overlapSize
        );

        if (overlapText.length > 0) {
          chunk.content = overlapText + '\n\n' + chunk.content;
          chunk.hasOverlap = true;
        }
      }

      overlapped.push(chunk);
    }

    return overlapped;
  }

  /**
   * Extract last N characters from text at sentence boundary
   *
   * Finds the last sentence boundary within the overlap window
   * to avoid breaking sentences mid-way.
   *
   * @param text - Source text
   * @param size - Target overlap size
   * @returns Overlap text starting at sentence boundary
   */
  private extractOverlap(text: string, size: number): string {
    if (text.length <= size) {
      return text;
    }

    // Get last N characters
    const start = text.length - size;
    const excerpt = text.substring(start);

    // Find first sentence boundary (. ! ? followed by space and capital letter)
    const sentenceMatch = excerpt.match(/[.!?]\s+(?=[A-Z])/);
    if (sentenceMatch && sentenceMatch.index !== undefined) {
      // Start after the punctuation and space
      return excerpt.substring(sentenceMatch.index + 2);
    }

    // Fallback: find any sentence-ending punctuation
    const punctMatch = excerpt.match(/[.!?]\s+/);
    if (punctMatch && punctMatch.index !== undefined) {
      return excerpt.substring(punctMatch.index + 2);
    }

    // No sentence boundary found, return as is
    return excerpt;
  }

  /**
   * Count sentences in text
   *
   * Uses simple heuristic: count sentence-ending punctuation marks.
   *
   * @param text - Text to analyze
   * @returns Number of sentences
   */
  private countSentences(text: string): number {
    const sentences = text.match(/[.!?]+/g);
    return sentences ? sentences.length : 0;
  }

  /**
   * Find section header for a paragraph
   *
   * Checks if the paragraph itself is a header, or finds the nearest
   * section header before this paragraph's position.
   *
   * @param para - Paragraph to check
   * @param structure - Document structure
   * @returns Section header title or undefined
   */
  private findSectionHeader(
    para: Paragraph,
    structure: DocumentStructure
  ): string | undefined {
    // Check if paragraph itself is a header
    const headerMatch = para.text.match(/^#{1,6}\s+(.+)$/);
    if (headerMatch) {
      return headerMatch[1].trim();
    }

    // Find the section this paragraph belongs to
    // Look for the last section that starts before this paragraph
    let currentSection: Section | undefined;
    for (const section of structure.sections) {
      if (section.startChar <= para.startChar) {
        currentSection = section;
      } else {
        break;
      }
    }

    return currentSection?.title;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a SemanticChunker with default configuration
 *
 * @param config - Optional chunker configuration
 * @returns New SemanticChunker instance
 */
export function createSemanticChunker(config?: ChunkerConfig): SemanticChunker {
  return new SemanticChunker(config);
}
