/**
 * Endnote Generator - Generate scholarly endnotes with supporting quotations
 *
 * Generates endnotes after each citation containing additional quotations
 * from the corpus that support the same claim. Integrates with provenance
 * ledger for tracking.
 *
 * @module endnote-generator
 */

import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../../core/observability/index.js';
import type { ProvenanceLedger, ProvenanceEntry } from './provenance-ledger.js';

const logger = createComponentLogger('EndnoteGenerator', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * A supporting quotation from the corpus
 */
export interface SupportingQuotation {
  /** Unique ID */
  id: string;

  /** The quotation text */
  text: string;

  /** Source author */
  author: string;

  /** Source title */
  title: string;

  /** Year of publication */
  year?: number;

  /** Page number or location */
  pageRef?: string;

  /** Relevance score to the original claim (0-1) */
  relevance: number;

  /** Source document ID in corpus */
  sourceDocId?: string;

  /** Chunk ID if from RAG retrieval */
  chunkId?: string;
}

/**
 * An endnote with supporting quotations
 */
export interface Endnote {
  /** Endnote number (1-indexed) */
  number: number;

  /** The original claim text being supported */
  claimText: string;

  /** Location in the document */
  location: {
    paragraphIndex: number;
    sentenceIndex?: number;
    charOffset: number;
  };

  /** The primary citation used in the text */
  primaryCitation: {
    author: string;
    title: string;
    year?: number;
    pageRef?: string;
    quotation?: string;
  };

  /** Additional supporting quotations */
  supportingQuotations: SupportingQuotation[];

  /** Provenance entry ID (links to provenance ledger) */
  provenanceId?: string;

  /** Timestamp */
  createdAt: string;
}

/**
 * Configuration for endnote generation
 */
export interface EndnoteGeneratorConfig {
  /** Maximum supporting quotations per endnote */
  maxQuotationsPerEndnote: number;

  /** Minimum relevance threshold for inclusion */
  minRelevanceThreshold: number;

  /** Whether to include quotations from same source */
  includeSameSource: boolean;

  /** Whether to include quotations from different sources */
  includeDifferentSources: boolean;

  /** Maximum quotation length (chars) */
  maxQuotationLength: number;

  /** Endnote format style */
  formatStyle: 'numeric' | 'alphabetic' | 'author-year';

  /** Whether to generate inline markers */
  generateInlineMarkers: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_ENDNOTE_CONFIG: EndnoteGeneratorConfig = {
  maxQuotationsPerEndnote: 3,
  minRelevanceThreshold: 0.65,
  includeSameSource: true,
  includeDifferentSources: true,
  maxQuotationLength: 500,
  formatStyle: 'numeric',
  generateInlineMarkers: true,
};

/**
 * Corpus chunk for retrieval
 */
export interface CorpusChunk {
  id: string;
  text: string;
  metadata: {
    author?: string;
    title?: string;
    year?: number;
    pageRef?: string;
    docId?: string;
  };
  score?: number;
}

/**
 * Corpus search function type
 */
export type CorpusSearchFn = (query: string, limit: number) => Promise<CorpusChunk[]>;

/**
 * Result of endnote generation
 */
export interface EndnoteGenerationResult {
  /** Generated endnotes */
  endnotes: Endnote[];

  /** Modified content with endnote markers */
  contentWithMarkers: string;

  /** Formatted endnotes section */
  endnotesSection: string;

  /** Statistics */
  stats: {
    totalEndnotes: number;
    totalSupportingQuotations: number;
    averageQuotationsPerEndnote: number;
    sourcesUsed: string[];
  };
}

// ============================================================================
// Endnote Generator Class
// ============================================================================

/**
 * Generates scholarly endnotes with supporting quotations
 */
export class EndnoteGenerator {
  private config: EndnoteGeneratorConfig;
  private endnotes: Map<number, Endnote> = new Map();
  private nextEndnoteNumber: number = 1;

  constructor(config: Partial<EndnoteGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_ENDNOTE_CONFIG, ...config };
  }

  /**
   * Generate endnotes for a document with citations
   *
   * @param content - The document content with citations
   * @param corpusSearch - Function to search corpus for supporting quotations
   * @param provenanceLedger - Optional provenance ledger for tracking
   */
  async generateEndnotes(
    content: string,
    corpusSearch: CorpusSearchFn,
    provenanceLedger?: ProvenanceLedger
  ): Promise<EndnoteGenerationResult> {
    logger.info('Starting endnote generation');

    // Step 1: Extract all citations from the content
    const citations = this.extractCitations(content);
    logger.info(`Found ${citations.length} citations to process`);

    // Step 2: Generate endnotes for each citation
    const endnotes: Endnote[] = [];

    for (const citation of citations) {
      const endnote = await this.generateEndnoteForCitation(
        citation,
        corpusSearch,
        provenanceLedger
      );

      if (endnote) {
        endnotes.push(endnote);
        this.endnotes.set(endnote.number, endnote);
      }
    }

    // Step 3: Insert markers into content
    const contentWithMarkers = this.insertEndnoteMarkers(content, endnotes);

    // Step 4: Format endnotes section
    const endnotesSection = this.formatEndnotesSection(endnotes);

    // Step 5: Calculate statistics
    const stats = this.calculateStats(endnotes);

    logger.info(`Generated ${endnotes.length} endnotes with ${stats.totalSupportingQuotations} supporting quotations`);

    return {
      endnotes,
      contentWithMarkers,
      endnotesSection,
      stats,
    };
  }

  /**
   * Extract citations from content
   */
  private extractCitations(content: string): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];

    // Pattern 1: Hybrid citations (Author, *Title* page) - e.g., (Aristotle, *De Anima* 403a 23-24)
    const hybridAuthorTitlePattern = /\(([A-Z][a-zA-Z]+),\s*\*([^*]+)\*\s+([^)]+)\)/g;

    // Pattern 2: Inline citations like (Author, Year, p. XX) or (Author Year)
    const inlineCitationPattern = /\(([A-Z][a-zA-Z]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z]+)?),?\s*(\d{4})?(?:,?\s*p\.?\s*(\d+(?:-\d+)?))?\)/g;

    // Pattern 3: Citations with "Author (Year)" format
    const authorYearPattern = /([A-Z][a-zA-Z]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z]+)?)\s+\((\d{4})\)/g;

    // Pattern 4: Direct quotations with markdown citations (e.g., "quote" (*De Anima* 427b 15-21))
    // This pattern specifically matches quotations followed by parentheses containing markdown italics
    const quotationWithMarkdownPattern = /"([^"]+)"\s*\(\*([^*]+)\*\s+([^)]+)\)/g;

    // Pattern 5: Direct quotations with inline citations (e.g., "quote" (Author, Year, p. XX))
    const quotationWithInlinePattern = /"([^"]+)"\s*\(([A-Z][^)]+)\)/g;

    // Pattern 6: Markdown italic citations like *De Anima* 427b 15-21 (standalone)
    const markdownCitationPattern = /\*([^*]+)\*\s+(\d+[a-z]?\s*\d*-?\d*)/g;

    let match: RegExpExecArray | null;

    // Extract hybrid citations first (Author, *Title* page) - highest priority
    while ((match = hybridAuthorTitlePattern.exec(content)) !== null) {
      const endPosition = match.index + match[0].length;
      citations.push({
        fullMatch: match[0],
        author: match[1],
        title: match[2],
        pageRef: match[3],
        citationText: `${match[1]}, *${match[2]}* ${match[3]}`,
        position: endPosition,
        startPosition: match.index,
        type: 'inline', // Treat as inline since it's in parentheses
      });
    }

    // Extract inline citations
    while ((match = inlineCitationPattern.exec(content)) !== null) {
      const matchIndex = match.index;
      const endPosition = matchIndex + match[0].length;

      // Skip if this overlaps with a hybrid citation (which was already extracted)
      if (!citations.some(c => Math.abs(c.position - endPosition) < 5)) {
        citations.push({
          fullMatch: match[0],
          author: match[1],
          year: match[2] ? parseInt(match[2]) : undefined,
          pageRef: match[3],
          position: endPosition,
          startPosition: matchIndex,
          type: 'inline',
        });
      }
    }

    // Extract author-year citations
    while ((match = authorYearPattern.exec(content)) !== null) {
      const matchIndex = match.index;
      const endPosition = matchIndex + match[0].length;

      // Avoid duplicates with other patterns
      if (!citations.some(c => Math.abs(c.position - endPosition) < 5)) {
        citations.push({
          fullMatch: match[0],
          author: match[1],
          year: parseInt(match[2]),
          position: endPosition,
          startPosition: matchIndex,
          type: 'author-year',
        });
      }
    }

    // Extract quotations with markdown citations (e.g., "quote" (*De Anima* 427b 15-21))
    while ((match = quotationWithMarkdownPattern.exec(content)) !== null) {
      const endPosition = match.index + match[0].length;
      const startPosition = match.index;
      citations.push({
        fullMatch: match[0],
        quotation: match[1],
        citationText: `*${match[2]}* ${match[3]}`, // Reconstruct markdown citation
        title: match[2],
        pageRef: match[3],
        position: endPosition,
        startPosition: startPosition, // Track start position for overlap detection
        type: 'quotation',
      });
    }

    // Extract quotations with inline citations (e.g., "quote" (Author, Year, p. XX))
    while ((match = quotationWithInlinePattern.exec(content)) !== null) {
      const endPosition = match.index + match[0].length;

      // Only add if not already matched by markdown pattern
      if (!citations.some(c => Math.abs(c.position - endPosition) < 5)) {
        citations.push({
          fullMatch: match[0],
          quotation: match[1],
          citationText: match[2],
          position: endPosition,
          type: 'quotation',
        });
      }
    }

    // Extract markdown citations (Aristotle works, etc.)
    while ((match = markdownCitationPattern.exec(content)) !== null) {
      citations.push({
        fullMatch: match[0],
        title: match[1],
        pageRef: match[2],
        position: match.index,
        type: 'markdown',
      });
    }

    // Sort quotations first (by position), then other types
    // This ensures that when we deduplicate, quotations (which contain more context)
    // are added to uniqueCitations first, and standalone markdown citations inside them are skipped
    citations.sort((a, b) => {
      // Prioritize quotations over everything else
      const typeOrder = { quotation: 0, inline: 1, 'author-year': 2, markdown: 3 };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      if (typeDiff !== 0) return typeDiff;

      // Within same type, sort by position
      return a.position - b.position;
    });

    // Remove duplicates - skip standalone markdown citations that are part of quotations
    // Quotations with markdown citations already include the markdown part in their match
    const uniqueCitations: ExtractedCitation[] = [];
    for (let i = 0; i < citations.length; i++) {
      const current = citations[i];

      // Check if this citation is redundant with any already-added citation
      const isRedundant = uniqueCitations.some(c => {
        // If positions are very close (within 5 chars), they're likely the same citation
        if (Math.abs(c.position - current.position) < 5) return true;

        // Special case: standalone markdown inside a quotation or inline citation
        if (current.type === 'markdown' && c.startPosition !== undefined &&
            (c.type === 'quotation' || c.type === 'inline')) {
          // If the markdown citation falls within the range of the parent citation,
          // it's already captured by that citation
          const parentStart = c.startPosition;
          const parentEnd = c.position;
          const markdownPos = current.position;

          if (markdownPos >= parentStart && markdownPos < parentEnd) {
            return true; // Skip this markdown citation
          }
        }

        return false;
      });

      if (!isRedundant) {
        uniqueCitations.push(current);
      }
    }

    return uniqueCitations;
  }

  /**
   * Generate endnote for a single citation
   */
  private async generateEndnoteForCitation(
    citation: ExtractedCitation,
    corpusSearch: CorpusSearchFn,
    provenanceLedger?: ProvenanceLedger
  ): Promise<Endnote | null> {
    // Build search query from citation
    const searchQuery = this.buildSearchQuery(citation);

    if (!searchQuery) {
      return null;
    }

    // Search corpus for supporting quotations
    const chunks = await corpusSearch(
      searchQuery,
      this.config.maxQuotationsPerEndnote * 3 // Get more to filter
    );

    // Filter and rank quotations
    const supportingQuotations = this.filterAndRankQuotations(
      chunks,
      citation,
      searchQuery
    );

    if (supportingQuotations.length === 0 && !this.config.includeSameSource) {
      return null;
    }

    // Get surrounding context for claim text
    const claimText = this.getClaimContext(citation);

    // Create endnote
    const endnote: Endnote = {
      number: this.nextEndnoteNumber++,
      claimText,
      location: {
        paragraphIndex: 0, // Will be calculated from position
        charOffset: citation.position,
      },
      primaryCitation: {
        author: citation.author || 'Unknown',
        title: citation.title || '',
        year: citation.year,
        pageRef: citation.pageRef,
        quotation: citation.quotation,
      },
      supportingQuotations,
      createdAt: new Date().toISOString(),
    };

    // Track in provenance ledger if available
    if (provenanceLedger) {
      const provenanceId = await this.trackInProvenance(endnote, provenanceLedger);
      endnote.provenanceId = provenanceId;
    }

    return endnote;
  }

  /**
   * Build search query from citation
   */
  private buildSearchQuery(citation: ExtractedCitation): string {
    const parts: string[] = [];

    if (citation.quotation) {
      // Use key terms from quotation
      const keyTerms = citation.quotation
        .split(/\s+/)
        .filter(word => word.length > 4)
        .slice(0, 5);
      parts.push(...keyTerms);
    }

    if (citation.author) {
      parts.push(citation.author);
    }

    if (citation.title) {
      parts.push(citation.title);
    }

    if (citation.citationText) {
      parts.push(citation.citationText);
    }

    return parts.join(' ');
  }

  /**
   * Filter and rank quotations by relevance
   */
  private filterAndRankQuotations(
    chunks: CorpusChunk[],
    citation: ExtractedCitation,
    searchQuery: string
  ): SupportingQuotation[] {
    const quotations: SupportingQuotation[] = [];

    for (const chunk of chunks) {
      // Skip if same as primary citation and not including same source
      if (!this.config.includeSameSource) {
        if (chunk.metadata.author === citation.author &&
            chunk.metadata.title === citation.title) {
          continue;
        }
      }

      // Calculate relevance
      const relevance = chunk.score || this.calculateRelevance(chunk.text, searchQuery);

      if (relevance < this.config.minRelevanceThreshold) {
        continue;
      }

      // Extract best quotation from chunk
      const quotationText = this.extractBestQuotation(chunk.text, searchQuery);

      if (!quotationText || quotationText.length < 20) {
        continue;
      }

      quotations.push({
        id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: quotationText,
        author: chunk.metadata.author || 'Unknown',
        title: chunk.metadata.title || 'Unknown',
        year: chunk.metadata.year,
        pageRef: chunk.metadata.pageRef,
        relevance,
        sourceDocId: chunk.metadata.docId,
        chunkId: chunk.id,
      });
    }

    // Sort by relevance and limit
    return quotations
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, this.config.maxQuotationsPerEndnote);
  }

  /**
   * Calculate relevance score between chunk and query
   */
  private calculateRelevance(chunkText: string, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const chunkLower = chunkText.toLowerCase();

    let matchCount = 0;
    for (const term of queryTerms) {
      if (chunkLower.includes(term)) {
        matchCount++;
      }
    }

    return queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
  }

  /**
   * Extract best quotation from chunk text
   */
  private extractBestQuotation(chunkText: string, query: string): string {
    // Split into sentences
    const sentences = chunkText.split(/(?<=[.!?])\s+/);

    // Find most relevant sentence(s)
    const queryTerms = query.toLowerCase().split(/\s+/);

    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (sentenceLower.includes(term)) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }

    // Truncate if too long
    if (bestSentence.length > this.config.maxQuotationLength) {
      bestSentence = bestSentence.substring(0, this.config.maxQuotationLength - 3) + '...';
    }

    return bestSentence.trim();
  }

  /**
   * Get claim context around citation
   */
  private getClaimContext(citation: ExtractedCitation): string {
    if (citation.quotation) {
      return citation.quotation;
    }
    return citation.fullMatch;
  }

  /**
   * Insert endnote markers into content
   */
  private insertEndnoteMarkers(content: string, endnotes: Endnote[]): string {
    if (!this.config.generateInlineMarkers) {
      return content;
    }

    // Sort endnotes by position (descending) to insert from end
    const sortedEndnotes = [...endnotes].sort(
      (a, b) => b.location.charOffset - a.location.charOffset
    );

    let modifiedContent = content;

    for (const endnote of sortedEndnotes) {
      const marker = this.formatMarker(endnote.number);
      const position = endnote.location.charOffset;

      // The position is already at the end of the citation for quotations
      // Just insert the marker directly at this position
      modifiedContent =
        modifiedContent.substring(0, position) +
        marker +
        modifiedContent.substring(position);
    }

    return modifiedContent;
  }

  /**
   * Format endnote marker
   */
  private formatMarker(number: number): string {
    switch (this.config.formatStyle) {
      case 'numeric':
        return `[${number}]`;
      case 'alphabetic':
        return `[${String.fromCharCode(96 + number)}]`;
      case 'author-year':
        return `[${number}]`;
      default:
        return `[${number}]`;
    }
  }

  /**
   * Format the endnotes section
   */
  private formatEndnotesSection(endnotes: Endnote[]): string {
    if (endnotes.length === 0) {
      return '';
    }

    const lines: string[] = [
      '',
      '---',
      '',
      '## Endnotes',
      '',
    ];

    for (const endnote of endnotes) {
      lines.push(`**[${endnote.number}]** Supporting quotations for: "${this.truncate(endnote.claimText, 80)}"`);
      lines.push('');

      if (endnote.supportingQuotations.length === 0) {
        lines.push('- *No additional supporting quotations found in corpus*');
      } else {
        for (const sq of endnote.supportingQuotations) {
          const citation = this.formatCitation(sq);
          lines.push(`- "${sq.text}" ${citation}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format a citation for a supporting quotation
   */
  private formatCitation(sq: SupportingQuotation): string {
    const parts: string[] = [];

    // Author
    parts.push(`(${sq.author}`);

    // Year
    if (sq.year) {
      parts.push(`, ${sq.year}`);
    }

    // Close author-year part
    parts.push(')');

    // Title in italics
    if (sq.title) {
      parts.push(`, *${sq.title}*`);
    }

    // Page reference
    if (sq.pageRef) {
      parts.push(`, p. ${sq.pageRef}`);
    }

    return parts.join('');
  }

  /**
   * Truncate text to specified length
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Track endnote in provenance ledger
   */
  private async trackInProvenance(
    endnote: Endnote,
    ledger: ProvenanceLedger
  ): Promise<string> {
    const entry = {
      chapterId: 0, // Will be set by caller
      paragraphIndex: endnote.location.paragraphIndex,
      claimText: endnote.claimText,
      sourceType: 'local_chunk' as const,
      sourceId: endnote.primaryCitation.author,
      sourceReference: `${endnote.primaryCitation.author} (${endnote.primaryCitation.year || 'n.d.'})${endnote.primaryCitation.pageRef ? `, p. ${endnote.primaryCitation.pageRef}` : ''}`,
      sourceTitle: endnote.primaryCitation.title,
      confidence: 0.9,
      verified: true,
      endnote: {
        number: endnote.number,
        supportingQuotations: endnote.supportingQuotations.map(sq => ({
          text: sq.text,
          source: `${sq.author} (${sq.year || 'n.d.'})`,
          relevance: sq.relevance,
        })),
        included: true,
        generatedAt: new Date().toISOString(),
      },
    };

    return ledger.addEntry(entry);
  }

  /**
   * Calculate statistics
   */
  private calculateStats(endnotes: Endnote[]): EndnoteGenerationResult['stats'] {
    const totalSupportingQuotations = endnotes.reduce(
      (sum, en) => sum + en.supportingQuotations.length,
      0
    );

    const sourcesUsed = new Set<string>();
    for (const en of endnotes) {
      sourcesUsed.add(en.primaryCitation.author);
      for (const sq of en.supportingQuotations) {
        sourcesUsed.add(sq.author);
      }
    }

    return {
      totalEndnotes: endnotes.length,
      totalSupportingQuotations,
      averageQuotationsPerEndnote: endnotes.length > 0
        ? totalSupportingQuotations / endnotes.length
        : 0,
      sourcesUsed: Array.from(sourcesUsed),
    };
  }

  /**
   * Get all generated endnotes
   */
  getAllEndnotes(): Endnote[] {
    return Array.from(this.endnotes.values());
  }

  /**
   * Get endnote by number
   */
  getEndnote(number: number): Endnote | undefined {
    return this.endnotes.get(number);
  }

  /**
   * Clear all endnotes
   */
  clear(): void {
    this.endnotes.clear();
    this.nextEndnoteNumber = 1;
  }
}

// ============================================================================
// Helper Types
// ============================================================================

interface ExtractedCitation {
  fullMatch: string;
  author?: string;
  title?: string;
  year?: number;
  pageRef?: string;
  quotation?: string;
  citationText?: string;
  position: number; // End position of the match
  startPosition?: number; // Start position of the match (for overlap detection)
  type: 'inline' | 'author-year' | 'quotation' | 'markdown';
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new endnote generator
 */
export function createEndnoteGenerator(
  config?: Partial<EndnoteGeneratorConfig>
): EndnoteGenerator {
  return new EndnoteGenerator(config);
}

/**
 * Generate endnotes for content
 */
export async function generateEndnotes(
  content: string,
  corpusSearch: CorpusSearchFn,
  options?: {
    config?: Partial<EndnoteGeneratorConfig>;
    provenanceLedger?: ProvenanceLedger;
  }
): Promise<EndnoteGenerationResult> {
  const generator = new EndnoteGenerator(options?.config);
  return generator.generateEndnotes(
    content,
    corpusSearch,
    options?.provenanceLedger
  );
}
