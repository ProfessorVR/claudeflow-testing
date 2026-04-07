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
import * as path from 'path';

/**
 * Render a quote-level highlight on a PDF page using highlight-page.py.
 * Uses the ICP 6-strategy text search cascade (dehyphenation, Unicode normalization,
 * sentence chunking, overlapping phrase windows, progressive snippets, start/end windows).
 * Scans ±2 adjacent pages automatically. Falls back to chunk-level bboxes (light blue)
 * when all text strategies fail. Single subprocess call per citation.
 */
async function renderBboxOverlayAsync(
  pathRel: string,
  quoteText: string,
  targetPage: number,
  fallbackBboxPages?: Array<{ page: number; coords: number[] }>
): Promise<string | null> {
  if (!targetPage || !pathRel || !quoteText) return null;

  const fs = await import('fs');
  const pdfPath = path.resolve('corpus', pathRel);
  const outDir = path.resolve('tmp', 'citation-renders');
  const safeName = pathRel.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
  const outPath = path.join(outDir, `${safeName}_p${targetPage}.png`);

  try {
    await fs.promises.mkdir(outDir, { recursive: true });

    const { execFile } = await import('child_process');
    const { promisify: pfy } = await import('util');
    const execFileAsync = pfy(execFile);

    const args = [
      'scripts/pdf/highlight-page.py',
      pdfPath,
      String(targetPage),
      outPath,
      quoteText,
      '150',
    ];

    if (fallbackBboxPages?.length) {
      args.push('--fallback-bboxes', JSON.stringify(fallbackBboxPages));
    }

    const { stdout } = await execFileAsync('python3', args, { timeout: 15000 });

    // Parse stdout for adjacent page correction
    const pageMatch = stdout.match(/FOUND_ON_PAGE:(\d+)/);
    const actualPage = pageMatch ? parseInt(pageMatch[1], 10) : targetPage;

    // Rename if highlight-page rendered an adjacent page
    if (actualPage !== targetPage && fs.existsSync(outPath)) {
      const correctedPath = path.join(outDir, `${safeName}_p${actualPage}.png`);
      fs.renameSync(outPath, correctedPath);
      return correctedPath;
    }

    // Only return path if highlights were drawn
    const matchType = stdout.includes('MATCH_TYPE:text') ? 'text'
      : stdout.includes('MATCH_TYPE:bbox-fallback') ? 'bbox-fallback'
      : 'none';

    if (matchType === 'none') {
      try { fs.unlinkSync(outPath); } catch { /* ignore */ }
      return null;
    }

    return fs.existsSync(outPath) ? outPath : null;
  } catch {
    return null;
  }
}

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

  /** Full untruncated chunk text (for bbox rendering — not displayed) */
  fullChunkText?: string;

  /** Whether this quotation has visual provenance (bbox coordinates) */
  hasBboxes?: boolean;

  /** Bounding box page coordinates (parsed from JSON) */
  bboxPages?: Array<{ page: number; coords: number[] }>;

  /** Relative path to source PDF (for bbox rendering) */
  pathRel?: string;

  /** Path to rendered bbox overlay PNG */
  visualRefPath?: string;
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
    /** Whether this citation has visual provenance */
    hasBboxes?: boolean;
    /** Bounding box page coordinates */
    bboxPages?: Array<{ page: number; coords: number[] }>;
    /** Relative path to source PDF */
    pathRel?: string;
    /** Path to rendered bbox overlay PNG */
    visualRefPath?: string;
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

  /** Whether to render bbox overlay images for visual provenance (default: false) */
  renderBboxOverlays?: boolean;
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
    /** Whether this chunk has bounding box coordinates (v7 pipeline) */
    has_bboxes?: boolean;
    /** Extraction method: 'marker+bbox', 'pymupdf+bbox', etc. */
    source_method?: string;
    /** JSON string of bounding box coordinates per page */
    bboxes?: string;
    /** Relative path to source PDF */
    path_rel?: string;
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
/** Known source from corpus constraint, used for deterministic author resolution. */
export interface KnownSource {
  author: string;
  title: string;
}

export class EndnoteGenerator {
  private config: EndnoteGeneratorConfig;
  private endnotes: Map<number, Endnote> = new Map();
  private nextEndnoteNumber: number = 1;
  private knownSources: KnownSource[] = [];

  constructor(config: Partial<EndnoteGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_ENDNOTE_CONFIG, ...config };
  }

  /** Set known corpus sources for deterministic author resolution. */
  setKnownSources(sources: KnownSource[]): void {
    this.knownSources = sources;
  }

  /**
   * Resolve author from known corpus sources by title match.
   * Uses substring matching to handle title variations
   * (e.g., "Being and Time" vs "Being and Time_(1962)_[My Copy]").
   */
  private resolveAuthorFromCorpus(title: string): string | undefined {
    if (!title || this.knownSources.length === 0) return undefined;
    const cleanTitle = title.replace(/\*/g, '').trim().toLowerCase();
    if (cleanTitle.length < 3) return undefined;

    // Exact match first
    const exact = this.knownSources.find(s => s.title.toLowerCase() === cleanTitle);
    if (exact) return exact.author;

    // Substring match: corpus title contains the citation title or vice versa
    const sub = this.knownSources.find(s => {
      const corpusTitle = s.title.toLowerCase();
      return corpusTitle.includes(cleanTitle) || cleanTitle.includes(corpusTitle);
    });
    return sub?.author;
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

    // Step 3b: Render bbox overlays concurrently (if enabled)
    if (this.config.renderBboxOverlays) {
      const renderTasks: Promise<void>[] = [];

      for (const endnote of endnotes) {
        // Primary citation
        const pc = endnote.primaryCitation;
        if (pc.hasBboxes && pc.pathRel && pc.quotation && pc.bboxPages?.length) {
          const pcText = pc.quotation.replace(/\.\.\.$/g, '').trim();
          renderTasks.push(
            renderBboxOverlayAsync(pc.pathRel, pcText, pc.bboxPages[0].page, pc.bboxPages)
              .then(p => { if (p) pc.visualRefPath = p; })
          );
        }
        // Supporting quotations
        for (const sq of endnote.supportingQuotations) {
          if (sq.hasBboxes && sq.pathRel && sq.text && sq.bboxPages?.length) {
            const searchText = sq.text.replace(/\.\.\.$/g, '').trim();
            renderTasks.push(
              renderBboxOverlayAsync(sq.pathRel, searchText, sq.bboxPages[0].page, sq.bboxPages)
                .then(p => { if (p) sq.visualRefPath = p; })
            );
          }
        }
      }

      if (renderTasks.length > 0) {
        logger.info(`Rendering ${renderTasks.length} bbox overlays concurrently...`);
        await Promise.all(renderTasks);
        const rendered = endnotes.filter(e => e.primaryCitation.visualRefPath).length;
        logger.info(`Rendered ${rendered} bbox overlays`);
      }
    }

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
    // The ,? after the closing * handles LLM output like (Heidegger, *Being and Time*, p. 91)
    const hybridAuthorTitlePattern = /\(([A-Z][a-zA-Z]+),\s*\*([^*]+)\*,?\s+([^)]+)\)/g;

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

    // Find bbox data for primary citation from the best matching chunk
    let primaryBboxPages: Array<{ page: number; coords: number[] }> | undefined;
    let primaryHasBboxes = false;
    let primaryPathRel: string | undefined;
    const primaryChunk = chunks.find(c =>
      c.metadata.author === citation.author &&
      c.metadata.has_bboxes
    );
    if (primaryChunk?.metadata.bboxes) {
      try {
        const parsed = JSON.parse(primaryChunk.metadata.bboxes);
        primaryBboxPages = parsed.map((b: any) => ({ page: b.page_num, coords: b.coords }));
        primaryHasBboxes = true;
        primaryPathRel = primaryChunk.metadata.path_rel;
      } catch { /* ignore */ }
    }

    // Create endnote
    const endnote: Endnote = {
      number: this.nextEndnoteNumber++,
      claimText,
      location: {
        paragraphIndex: 0, // Will be calculated from position
        charOffset: citation.position,
      },
      primaryCitation: {
        author: citation.author || this.resolveAuthorFromCorpus(citation.title || '') || 'Unknown',
        title: citation.title || '',
        year: citation.year,
        pageRef: citation.pageRef,
        quotation: citation.quotation,
        hasBboxes: primaryHasBboxes,
        bboxPages: primaryBboxPages,
        pathRel: primaryPathRel,
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

      // Parse bbox coordinates if available
      let bboxPages: Array<{ page: number; coords: number[] }> | undefined;
      if (chunk.metadata.has_bboxes && chunk.metadata.bboxes) {
        try {
          const parsed = JSON.parse(chunk.metadata.bboxes);
          bboxPages = parsed.map((b: any) => ({
            page: b.page_num,
            coords: b.coords,
          }));
        } catch { /* ignore parse errors */ }
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
        fullChunkText: chunk.text,
        hasBboxes: chunk.metadata.has_bboxes ?? false,
        bboxPages,
        pathRel: chunk.metadata.path_rel,
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
   *
   * Fix 75: Filters OCR boilerplate, copyright pages, JSTOR headers,
   * bibliographic entries, and other non-scholarly-prose content.
   */
  private extractBestQuotation(chunkText: string, query: string): string {
    // Split into sentences
    const sentences = chunkText.split(/(?<=[.!?])\s+/);

    // Find most relevant sentence(s), skipping junk
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      // Fix 75: Skip OCR boilerplate and non-prose content
      if (this.isJunkSentence(sentence)) continue;

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
   * Detect junk sentences that shouldn't be used as supporting quotations.
   * Fix 75: Filters OCR artifacts, copyright notices, bibliographic entries, etc.
   */
  private isJunkSentence(sentence: string): boolean {
    const s = sentence.trim();

    // Too short to be useful
    if (s.length < 30) return true;

    // OCR/publishing boilerplate
    const junkPatterns = [
      /This content downloaded from/i,
      /All use subject to/i,
      /https?:\/\/about\.jstor\.org/i,
      /BOLLINGEN SERIES/i,
      /Princeton University Press/i,
      /Copyright ©/i,
      /Library of Congre/i,
      /ISBN[-\s]/i,
      /Printed in the United States/i,
      /acid-free paper/i,
      /\bVOLUME\s+(ONE|TWO|THREE|I|II|III)\b/i,
      /Loeb Classical Library/i,
      /Cambridge University Press/i,
      /Oxford University Press/i,
      /translated by\s+[A-Z]\.\s*[A-Z]/i,  // "translated by A. L. Peck"
      /edited by\s+[A-Z]\.\s/i,
      /W\.\s*Heinemann\s*Ltd/i,
      /Harvard University Press/i,
      /Clarendon Press/i,
      /^[A-Z\s.]+$/, // ALL-CAPS lines (headers)
      /^\d+\s*$/, // Bare page numbers
      /^[A-Z]+\s+[A-Z]+$/,  // "RHETORIC W." etc.
      /DOI:\s*http/i,
      /ISSN\s+\d/i,
      /www\.revistas/i,
      /Commentaria in Aristotelem/i,
    ];

    for (const pattern of junkPatterns) {
      if (pattern.test(s)) return true;
    }

    // Bibliographic entry pattern: "Author. Title, Publisher, Year."
    // (Has multiple commas, ends with year or publisher location)
    if (/^\w+,\s+\w+\.\s+.*\d{4}/.test(s) && s.split(',').length > 3) return true;

    return false;
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
   * Insert endnote markers into content.
   *
   * ARCHITECTURAL NOTE (Fix 61): This method inserts [N] markers at citation
   * positions. During multi-step generation, the LLM may hallucinate identical
   * markers ([1], [2], [EN1], or superscript numbers) in the draft text before
   * this method runs. The caller (WritePipelineOrchestrator) must invoke
   * `stripEndnoteLeaks()` on the content BEFORE passing it to `generateEndnotes()`
   * to ensure that only legitimately inserted markers remain in the final output.
   * If marker format changes (e.g., from [N] to something else), update both
   * `formatMarker()` below and `stripEndnoteLeaks()` in quality-integration.ts.
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
   *
   * Fix 75: Proper MLA-style endnotes. Each endnote lists:
   *   1. The primary source in MLA format
   *   2. Supporting quotations as indented bullets with source citations
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
      '| # | Primary Source | Page(s) | Visual | Supporting Quotations |',
      '|---|--------------|---------|--------|----------------------|',
    ];

    for (const endnote of endnotes) {
      const primary = endnote.primaryCitation;
      const primarySource = primary.title
        ? `${primary.author || 'Unknown'}, *${primary.title}*${primary.year ? ` (${primary.year})` : ''}`
        : primary.author || 'Unknown';
      const pageRef = primary.pageRef || '—';

      // Visual provenance indicator
      let visualCell = '—';
      if (primary.hasBboxes && primary.bboxPages && primary.bboxPages.length > 0) {
        const pageNums = primary.bboxPages.map(b => b.page).join(', ');
        if (primary.visualRefPath) {
          visualCell = `[bbox p.${pageNums}](${primary.visualRefPath})`;
        } else {
          visualCell = `bbox p.${pageNums}`;
        }
      }

      // Build supporting quotations cell
      let sqCell = '—';
      if (endnote.supportingQuotations.length > 0) {
        const sqParts = endnote.supportingQuotations.map(sq => {
          const sqSource = sq.title
            ? `${sq.author}, *${sq.title}*`
            : sq.author;
          const sqPage = sq.pageRef || '';
          // Truncate long quotations for table readability
          const truncText = sq.text.length > 120
            ? sq.text.substring(0, 117) + '...'
            : sq.text;
          const bboxMarker = sq.visualRefPath
            ? ` [bbox](${sq.visualRefPath})`
            : sq.hasBboxes ? ' [bbox]' : '';
          return `"${truncText}" (${sqSource}${sqPage ? ', ' + sqPage : ''}${bboxMarker})`;
        });
        sqCell = sqParts.join(' · ');
      }

      // Escape pipe characters in cell content
      const safePrimary = primarySource.replace(/\|/g, '\\|');
      const safePageRef = pageRef.replace(/\|/g, '\\|');
      const safeVisual = visualCell.replace(/\|/g, '\\|');
      const safeSqCell = sqCell.replace(/\|/g, '\\|');

      lines.push(`| [${endnote.number}] | ${safePrimary} | ${safePageRef} | ${safeVisual} | ${safeSqCell} |`);
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Format a citation in MLA style:
   *   Author. *Title*. Year, p. XX.
   *   or: Author. *Title*. Year.
   */
  private formatMLACitation(author: string, title?: string, year?: number, pageRef?: string): string {
    const parts: string[] = [];

    // Author (last name first if comma-separated, otherwise as-is)
    parts.push(author || 'Unknown');

    // Title in italics
    if (title) {
      parts.push(`. *${title}*`);
    }

    // Year
    if (year) {
      parts.push(`. ${year}`);
    }

    // Page reference
    if (pageRef) {
      parts.push(`, ${pageRef}`);
    }

    parts.push('.');
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
    knownSources?: KnownSource[];
  }
): Promise<EndnoteGenerationResult> {
  const generator = new EndnoteGenerator(options?.config);
  if (options?.knownSources) {
    generator.setKnownSources(options.knownSources);
  }
  return generator.generateEndnotes(
    content,
    corpusSearch,
    options?.provenanceLedger
  );
}
