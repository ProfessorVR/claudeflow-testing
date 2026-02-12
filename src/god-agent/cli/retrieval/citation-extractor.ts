/**
 * Citation Extractor - Parse citations from documents
 *
 * Part of Phase 4: Citation Graph Integration
 *
 * Features:
 * - Extract inline citations (Author, Year) style
 * - Parse reference sections
 * - Identify DOIs and URLs
 * - Handle multiple citation formats
 * - Extract metadata from citation text
 *
 * @module citation-extractor
 */

import { CitationNode, CitationEdge, generateCitationId } from './citation-graph.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Raw citation extracted from text
 */
export interface ExtractedCitation {
  /** Raw citation text */
  raw: string;
  /** Parsed author(s) */
  authors?: string[];
  /** Parsed year */
  year?: number;
  /** Parsed title (if available) */
  title?: string;
  /** DOI (if found) */
  doi?: string;
  /** URL (if found) */
  url?: string;
  /** Location in source document */
  location?: {
    lineNumber?: number;
    context?: string;
  };
  /** Citation format detected */
  format?: 'apa' | 'mla' | 'chicago' | 'harvard' | 'inline' | 'unknown';
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Reference list entry
 */
export interface ReferenceEntry {
  /** Entry number (if numbered) */
  number?: number;
  /** Full reference text */
  text: string;
  /** Parsed components */
  authors?: string[];
  year?: number;
  title?: string;
  source?: string; // Journal, book, etc.
  doi?: string;
  url?: string;
}

/**
 * Extraction result for a document
 */
export interface CitationExtractionResult {
  /** Source document ID */
  documentId: string;
  /** Inline citations found */
  inlineCitations: ExtractedCitation[];
  /** Reference list entries */
  references: ReferenceEntry[];
  /** Extracted citation nodes (for graph) */
  citationNodes: CitationNode[];
  /** Extracted citation edges (for graph) */
  citationEdges: CitationEdge[];
  /** Extraction statistics */
  stats: {
    inlineCount: number;
    referenceCount: number;
    matchedCount: number;
    unmatchedCount: number;
  };
}

/**
 * Extractor configuration
 */
export interface CitationExtractorConfig {
  /** Minimum confidence threshold (default: 0.5) */
  minConfidence?: number;
  /** Extract inline citations (default: true) */
  extractInline?: boolean;
  /** Extract reference section (default: true) */
  extractReferences?: boolean;
  /** Try to match inline citations to references (default: true) */
  matchCitations?: boolean;
}

// ============================================================================
// Citation Patterns
// ============================================================================

/**
 * Regular expressions for citation patterns
 */
const CITATION_PATTERNS = {
  // (Author, Year) - APA style
  apa: /\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|&\s+[A-Z][a-z]+))?),?\s*(\d{4})\)/g,

  // (Author Year) - Harvard style
  harvard: /\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|&\s+[A-Z][a-z]+))?)?\s+(\d{4})\)/g,

  // Author (Year) - narrative citation
  narrative: /([A-Z][a-z]+(?:\s+(?:et\s+al\.?|&\s+[A-Z][a-z]+))?)\s*\((\d{4})\)/g,

  // [Number] style citations
  numbered: /\[(\d+(?:,\s*\d+)*)\]/g,

  // DOI pattern
  doi: /(?:https?:\/\/)?(?:dx\.)?doi\.org\/([^\s\)]+)|doi:\s*([^\s\)]+)/gi,

  // Year pattern (4 digits)
  year: /\b(19|20)\d{2}\b/g,

  // Author pattern (capitalized name)
  author: /\b([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)\b/g,
};

/**
 * Reference section indicators
 */
const REFERENCE_HEADERS = [
  'references',
  'bibliography',
  'works cited',
  'literature cited',
  'citations',
  'sources',
];

// ============================================================================
// Citation Extractor Implementation
// ============================================================================

/**
 * Extract citations from document text
 */
export class CitationExtractor {
  private config: Required<CitationExtractorConfig>;

  constructor(config: CitationExtractorConfig = {}) {
    this.config = {
      minConfidence: config.minConfidence ?? 0.5,
      extractInline: config.extractInline ?? true,
      extractReferences: config.extractReferences ?? true,
      matchCitations: config.matchCitations ?? true,
    };
  }

  /**
   * Extract all citations from a document
   */
  extract(
    text: string,
    documentId: string,
    documentTitle?: string
  ): CitationExtractionResult {
    const inlineCitations: ExtractedCitation[] = [];
    const references: ReferenceEntry[] = [];

    // Extract inline citations
    if (this.config.extractInline) {
      inlineCitations.push(...this.extractInlineCitations(text));
    }

    // Extract reference section
    if (this.config.extractReferences) {
      references.push(...this.extractReferenceSection(text));
    }

    // Match inline citations to references
    let matchedCount = 0;
    let unmatchedCount = 0;
    if (this.config.matchCitations && references.length > 0) {
      for (const citation of inlineCitations) {
        const matched = this.matchToReference(citation, references);
        if (matched) {
          matchedCount++;
          // Enrich citation with reference data
          citation.title = matched.title;
          citation.doi = matched.doi;
          citation.url = matched.url;
        } else {
          unmatchedCount++;
        }
      }
    } else {
      unmatchedCount = inlineCitations.length;
    }

    // Convert to graph nodes and edges
    const { nodes, edges } = this.toGraphElements(
      documentId,
      documentTitle || 'Unknown Document',
      inlineCitations,
      references
    );

    return {
      documentId,
      inlineCitations,
      references,
      citationNodes: nodes,
      citationEdges: edges,
      stats: {
        inlineCount: inlineCitations.length,
        referenceCount: references.length,
        matchedCount,
        unmatchedCount,
      },
    };
  }

  /**
   * Extract inline citations from text
   */
  private extractInlineCitations(text: string): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const seen = new Set<string>();

    // APA style: (Author, Year) or (Author & Author, Year)
    const apaMatches = text.matchAll(CITATION_PATTERNS.apa);
    for (const match of apaMatches) {
      const raw = match[0];
      if (seen.has(raw)) continue;
      seen.add(raw);

      const authorStr = match[1].trim();
      const year = parseInt(match[2], 10);
      const authors = this.parseAuthorString(authorStr);

      citations.push({
        raw,
        authors,
        year,
        format: 'apa',
        confidence: 0.9,
        location: this.getContext(text, match.index || 0),
      });
    }

    // Narrative style: Author (Year)
    const narrativeMatches = text.matchAll(CITATION_PATTERNS.narrative);
    for (const match of narrativeMatches) {
      const raw = match[0];
      if (seen.has(raw)) continue;
      seen.add(raw);

      const authorStr = match[1].trim();
      const year = parseInt(match[2], 10);
      const authors = this.parseAuthorString(authorStr);

      citations.push({
        raw,
        authors,
        year,
        format: 'harvard',
        confidence: 0.85,
        location: this.getContext(text, match.index || 0),
      });
    }

    // Filter by confidence
    return citations.filter((c) => c.confidence >= this.config.minConfidence);
  }

  /**
   * Extract reference section from text
   */
  private extractReferenceSection(text: string): ReferenceEntry[] {
    const references: ReferenceEntry[] = [];
    const lines = text.split('\n');

    // Find reference section start
    let inReferences = false;
    let refStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (
        REFERENCE_HEADERS.some(
          (h) => line === h || line.startsWith(h + ':') || line.endsWith(h)
        )
      ) {
        inReferences = true;
        refStartIndex = i + 1;
        break;
      }
    }

    if (!inReferences || refStartIndex < 0) {
      return references;
    }

    // Parse reference entries
    let currentEntry = '';
    let entryNumber = 1;

    for (let i = refStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      // Stop at next major section
      if (
        line &&
        /^(appendix|acknowledgements?|notes|chapter|section|part)\b/i.test(
          line
        )
      ) {
        break;
      }

      // Empty line = end of entry
      if (!line) {
        if (currentEntry) {
          const parsed = this.parseReferenceEntry(currentEntry, entryNumber);
          if (parsed) {
            references.push(parsed);
            entryNumber++;
          }
          currentEntry = '';
        }
        continue;
      }

      // New numbered entry
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        if (currentEntry) {
          const parsed = this.parseReferenceEntry(currentEntry, entryNumber);
          if (parsed) {
            references.push(parsed);
            entryNumber++;
          }
        }
        currentEntry = numberedMatch[2];
        continue;
      }

      // Continue previous entry or start new
      if (line.match(/^[A-Z]/) && currentEntry.length > 100) {
        // Likely new entry
        const parsed = this.parseReferenceEntry(currentEntry, entryNumber);
        if (parsed) {
          references.push(parsed);
          entryNumber++;
        }
        currentEntry = line;
      } else {
        // Continue entry
        currentEntry += ' ' + line;
      }
    }

    // Don't forget last entry
    if (currentEntry) {
      const parsed = this.parseReferenceEntry(currentEntry, entryNumber);
      if (parsed) {
        references.push(parsed);
      }
    }

    return references;
  }

  /**
   * Parse a reference entry
   */
  private parseReferenceEntry(
    text: string,
    number?: number
  ): ReferenceEntry | null {
    if (text.length < 20) {
      return null; // Too short
    }

    const entry: ReferenceEntry = {
      number,
      text: text.trim(),
    };

    // Extract year
    const yearMatch = text.match(/\((\d{4})\)/);
    if (yearMatch) {
      entry.year = parseInt(yearMatch[1], 10);
    }

    // Extract DOI
    const doiMatch = text.match(CITATION_PATTERNS.doi);
    if (doiMatch) {
      entry.doi = doiMatch[1] || doiMatch[2];
    }

    // Extract URL
    const urlMatch = text.match(/https?:\/\/[^\s\)]+/);
    if (urlMatch) {
      entry.url = urlMatch[0];
    }

    // Try to extract authors (before year typically)
    if (yearMatch && yearMatch.index) {
      const beforeYear = text.substring(0, yearMatch.index).trim();
      entry.authors = this.parseAuthorString(beforeYear);
    }

    // Try to extract title (usually in quotes or italics, or after year)
    const titleMatch = text.match(
      /[""]([^""]+)[""]|_([^_]+)_|\*([^*]+)\*/
    );
    if (titleMatch) {
      entry.title = titleMatch[1] || titleMatch[2] || titleMatch[3];
    } else if (yearMatch && yearMatch.index) {
      // Title often follows year
      const afterYear = text.substring(
        (yearMatch.index || 0) + yearMatch[0].length + 1
      );
      const periodIndex = afterYear.indexOf('.');
      if (periodIndex > 0 && periodIndex < 200) {
        entry.title = afterYear.substring(0, periodIndex).trim();
      }
    }

    return entry;
  }

  /**
   * Parse author string into array
   */
  private parseAuthorString(str: string): string[] {
    if (!str) return [];

    // Handle "et al."
    const etAlMatch = str.match(/^([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\s+et\s+al\.?$/i);
    if (etAlMatch) {
      return [etAlMatch[1]];
    }

    // Handle "Author & Author" or "Author, Author, & Author"
    const parts = str
      .split(/\s*[,&]\s*/)
      .map((p) => p.trim())
      .filter(
        (p) => p.length > 0 && /^[A-Z]/.test(p) && !/^\d/.test(p)
      );

    return parts;
  }

  /**
   * Get context around a match
   */
  private getContext(
    text: string,
    index: number,
    windowSize: number = 100
  ): ExtractedCitation['location'] {
    const start = Math.max(0, index - windowSize);
    const end = Math.min(text.length, index + windowSize);

    // Find line number
    const beforeMatch = text.substring(0, index);
    const lineNumber = beforeMatch.split('\n').length;

    return {
      lineNumber,
      context: text.substring(start, end).replace(/\n/g, ' ').trim(),
    };
  }

  /**
   * Match an inline citation to a reference entry
   */
  private matchToReference(
    citation: ExtractedCitation,
    references: ReferenceEntry[]
  ): ReferenceEntry | null {
    const { authors, year } = citation;

    for (const ref of references) {
      // Match by year first
      if (year && ref.year && year !== ref.year) {
        continue;
      }

      // Match by author
      if (authors && authors.length > 0 && ref.authors) {
        const citationAuthor = authors[0].toLowerCase();
        const refAuthors = ref.authors.map((a) => a.toLowerCase());
        if (refAuthors.some((a) => a.includes(citationAuthor))) {
          return ref;
        }
      }
    }

    return null;
  }

  /**
   * Convert extractions to graph elements
   */
  private toGraphElements(
    sourceId: string,
    sourceTitle: string,
    citations: ExtractedCitation[],
    references: ReferenceEntry[]
  ): { nodes: CitationNode[]; edges: CitationEdge[] } {
    const nodes: CitationNode[] = [];
    const edges: CitationEdge[] = [];
    const seenIds = new Set<string>();

    // Source document node
    nodes.push({
      id: sourceId,
      title: sourceTitle,
      type: 'paper',
    });
    seenIds.add(sourceId);

    // Create nodes from references (higher quality)
    for (const ref of references) {
      const id = generateCitationId(
        ref.title || ref.text.substring(0, 50),
        ref.authors
      );

      if (!seenIds.has(id)) {
        seenIds.add(id);
        nodes.push({
          id,
          title: ref.title || ref.text.substring(0, 100),
          authors: ref.authors,
          year: ref.year,
          type: 'paper',
          source: ref.url || ref.doi,
        });

        // Create edge (source cites this reference)
        edges.push({
          from: sourceId,
          to: id,
          type: 'direct',
          confidence: 1.0,
        });
      }
    }

    // Create nodes from inline citations (if not already from references)
    for (const citation of citations) {
      const title = citation.title || citation.raw;
      const id = generateCitationId(title, citation.authors);

      if (!seenIds.has(id)) {
        seenIds.add(id);
        nodes.push({
          id,
          title,
          authors: citation.authors,
          year: citation.year,
          type: 'paper',
          source: citation.url || citation.doi,
        });

        // Create edge
        edges.push({
          from: sourceId,
          to: id,
          type: citation.title ? 'direct' : 'inferred',
          confidence: citation.confidence,
          location: citation.location?.context,
        });
      }
    }

    return { nodes, edges };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a citation extractor
 */
export function createCitationExtractor(
  config?: CitationExtractorConfig
): CitationExtractor {
  return new CitationExtractor(config);
}

export default CitationExtractor;
