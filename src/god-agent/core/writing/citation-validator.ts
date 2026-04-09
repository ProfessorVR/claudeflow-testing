/**
 * Citation Validator (Phase 2: Pre-Generation Citation Validation)
 *
 * Validates all citations in generated content BEFORE output.
 * This is critical for catching hallucinations before they reach the user.
 */

import type { CorpusSource, CorpusConstraint } from './writing-generator.js';
import { buildCorpusConstraint, type ContextChunk } from './corpus-constraint-builder.js';

/**
 * Extracted citation from text
 */
export interface ExtractedCitation {
  /** Raw citation text as found */
  raw: string;
  /** Normalized author name */
  author?: string;
  /** Year if found */
  year?: number;
  /** Page number if found */
  page?: number;
  /** Title if found (from MLA-style citations with quoted or italic titles) */
  title?: string;
  /** Position in text (character index) */
  position: number;
  /** Line number in text */
  line: number;
}

/**
 * Result of validating a single citation
 */
export interface CitationValidation {
  /** The extracted citation */
  citation: ExtractedCitation;
  /** Whether the citation is valid (exists in corpus) */
  valid: boolean;
  /** Matched corpus source if valid */
  matchedSource?: CorpusSource;
  /** Reason if invalid */
  reason?: string;
  /** Warning (e.g., missing page number) - citation is valid but has issues */
  warning?: string;
  /** Whether this citation is missing a page number */
  missingPageNumber?: boolean;
  /** Suggested replacement if available */
  suggestion?: {
    source: CorpusSource;
    formatted: string;
  };
}

/**
 * Full validation result for content
 */
export interface ValidationResult {
  /** All valid citations */
  valid: CitationValidation[];
  /** All hallucinated citations */
  hallucinated: CitationValidation[];
  /** Citations missing page numbers (subset of valid) */
  missingPageNumbers: CitationValidation[];
  /** Pass rate (valid / total) */
  passRate: number;
  /** Total citations found */
  totalCitations: number;
  /** Summary of issues */
  summary: string;
}

/**
 * Options for citation validation
 */
export interface ValidationOptions {
  /** Whether to suggest replacements for hallucinated citations */
  suggestReplacements?: boolean;
  /** Maximum suggestions to generate */
  maxSuggestions?: number;
  /** Placeholder text for unreplaceable citations */
  placeholder?: string;
  /** Whether to require page numbers (default: true for academic) */
  requirePageNumbers?: boolean;
}

/**
 * Citation Validator
 *
 * Validates citations in generated content against corpus sources.
 * Can also correct hallucinated citations by replacing them with
 * corpus-verified alternatives or placeholders.
 */
export class CitationValidator {
  private sources: Map<string, CorpusSource>;
  private authorIndex: Map<string, CorpusSource[]>;
  private authorTitlesIndex: Map<string, Set<string>>;

  constructor(constraint: CorpusConstraint) {
    this.sources = new Map();
    this.authorIndex = new Map();
    this.authorTitlesIndex = new Map();

    // Index sources for fast lookup
    for (const source of constraint.sources) {
      const key = this.makeKey(source.author, source.year);
      this.sources.set(key, source);

      // Also index by author name (normalized)
      const authorKey = this.normalizeAuthor(source.author);
      if (!this.authorIndex.has(authorKey)) {
        this.authorIndex.set(authorKey, []);
      }
      this.authorIndex.get(authorKey)!.push(source);

      // Build author→titles index for title validation (H-06)
      if (!this.authorTitlesIndex.has(authorKey)) {
        this.authorTitlesIndex.set(authorKey, new Set());
      }
      if (source.title) {
        this.authorTitlesIndex.get(authorKey)!.add(this.normalizeTitle(source.title));
      }
    }
  }

  /** Normalize title for fuzzy matching: lowercase, strip punctuation */
  private normalizeTitle(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  }

  /**
   * Validate all citations in content
   */
  async validate(content: string, options: ValidationOptions = {}): Promise<ValidationResult> {
    // Default to requiring page numbers for academic citations
    const requirePageNumbers = options.requirePageNumbers ?? true;

    const citations = this.extractCitations(content);
    const validations: CitationValidation[] = [];

    for (const citation of citations) {
      const validation = this.validateSingleCitation(citation, { ...options, requirePageNumbers });
      validations.push(validation);
    }

    const valid = validations.filter(v => v.valid);
    const hallucinated = validations.filter(v => !v.valid);
    const missingPageNumbers = validations.filter(v => v.valid && v.missingPageNumber);

    const passRate = citations.length > 0 ? valid.length / citations.length : 1;

    return {
      valid,
      hallucinated,
      missingPageNumbers,
      passRate,
      totalCitations: citations.length,
      summary: this.generateSummary(valid.length, hallucinated.length, hallucinated, missingPageNumbers),
    };
  }

  /**
   * Correct hallucinated citations in content
   *
   * @param content - Content with potential hallucinations
   * @param options - Validation options
   * @returns Corrected content with hallucinations replaced
   */
  async correct(content: string, options: ValidationOptions = {}): Promise<{
    corrected: string;
    corrections: number;
    validation: ValidationResult;
  }> {
    const validation = await this.validate(content, { ...options, suggestReplacements: true });
    let corrected = content;
    let corrections = 0;

    // Sort hallucinated citations by position (descending) to replace from end
    // This preserves position indices for earlier citations
    const sortedHallucinations = [...validation.hallucinated].sort(
      (a, b) => b.citation.position - a.citation.position
    );

    for (const h of sortedHallucinations) {
      // Fix 22: Use ?? (nullish coalescing) instead of || so empty string placeholder works
      // Previously '' || '[CITATION NEEDED]' evaluated to '[CITATION NEEDED]' because '' is falsy
      const replacement = h.suggestion?.formatted ?? options.placeholder ?? '[CITATION NEEDED]';

      // Replace the citation in content
      const before = corrected.substring(0, h.citation.position);
      const after = corrected.substring(h.citation.position + h.citation.raw.length);
      corrected = before + replacement + after;
      corrections++;
    }

    return {
      corrected,
      corrections,
      validation,
    };
  }

  /**
   * Extract all citations from text
   */
  extractCitations(text: string): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const lines = text.split('\n');
    let charOffset = 0;

    // ── APA patterns (capture groups: [1]=author, [2]=year, [3]=page?) ──
    const apaPatterns = [
      // (Author Year) or (Author, Year)
      /\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|and\s+[A-Z][a-z]+))?)[,\s]+(\d{4})\)/gi,
      // (Author Year, p. 123) or (Author Year: 123)
      /\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|and\s+[A-Z][a-z]+))?)[,\s]+(\d{4})[,:]\s*(?:p\.?\s*)?(\d+)\)/gi,
      // (Author, 123) - page only
      /\(([A-Z][a-z]+)[,\s]+(\d{1,3})\)/gi,
      // Author (Year)
      /([A-Z][a-z]+(?:\s+(?:et\s+al\.?|and\s+[A-Z][a-z]+))?)\s+\((\d{4})\)/g,
      // In-text: Author (Year, p. 123)
      /([A-Z][a-z]+)\s+\((\d{4})[,:]\s*(?:p\.?\s*)?(\d+)\)/g,
      // (Author, Year/Year) - translated/original year
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*)[,\s]+(\d{4})\/\d{4}(?:[,\s]+pp?\.\s*\d+(?:[-–]\d+)?)?\)/gi,
    ];

    // ── MLA / author-prominent patterns (capture groups: [1]=author, [2]=title if present) ──
    // These match the dalton-academic-mkn82c3v style profile output
    const mlaPatterns = [
      // (Author, "Quoted Title")
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+"([^"]+)"\)/g,
      // (Author, "Quoted Title," p. 123) or (Author, "Title", p. 123)
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+"([^"]+)[,"]?\s+pp?\.\s*\d+(?:[-–]\d+)?\)/g,
      // (Author, *Italic Title*)
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+\*([^*]+)\*\)/g,
      // (Author, *Italic Title*, p. 123) or (Author, *Title*, pp. 123-456)
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+\*([^*]+)\*,\s+pp?\.\s*\d+(?:[-–]\d+)?\)/g,
      // (Author, *Title*, Book/Section/Chapter ref)
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+\*([^*]+)\*,\s+(?:Book|Section|Chapter|Part)\s+[IVXLC\d]+\)/g,
      // (Author et al., "Title") or (Author et al., *Title*)
      /\(([A-Z][a-z']+)\s+et\s+al\.,\s+["*]([^"*]+)["*]\)/g,
      // (Author 123) or (Author 123-456) — MLA page-only (no title)
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*)\s+\d+(?:[-–]\d+)?\)/g,
    ];

    // ── Classical / philosophical patterns (capture group: [1]=author) ──
    const classicalPatterns = [
      // (Aristotle, *Work*, III.3, 428a1-2) — Bekker + book notation
      /\((Aristotle|Plato|Heidegger|Husserl|Kant|Descartes|Aquinas)[,\s]+\*?[\w\s]+\*?[,\s]+[IVXLC]+\.\d+[,\s]+\d+[a-z]?\d*(?:[-–]\d+[a-z]?\d*)?[,\s]*\)/gi,
      // (Aristotle, *Work*, 428a1-2) — Bekker without book
      /\((Aristotle|Plato)[,\s]+\*?[\w\s]+\*?[,\s]+\d+[a-z]\d*(?:[-–]\d+[a-z]?\d*)?[,\s]*\)/gi,
      // (*De Anima*, III.3, 427b27-28) — inline classical
      /\((\*[\w\s]+\*)[,\s]+[IVXLC]+\.\d+[,\s]+\d+[a-z]?\d*(?:[-–]\d+[a-z]?\d*)?[,\s]*\)/gi,
      // (Heidegger, 1927/1962, §30) — section notation with year
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*)[,\s]+\d{4}(?:\/\d{4})?[,\s]+§\d+(?:[-–]\d+)?\)/gi,
      // (Author, *Title*, §30) — section notation without year (MLA-influenced)
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+\*[^*]+\*,\s+§\d+(?:[-–]\d+)?\)/gi,
      // (Heidegger, GA 18, 207) — Gesamtausgabe notation
      /\(([A-Z][a-z']+),\s+GA\s+\d+,\s+\d+\)/gi,
    ];

    // ── Inline signal phrase patterns (capture group: [1]=author) ──
    const signalPhrasePatterns = [
      // "as Author observes/argues/notes/states/maintains/suggests/contends..."
      /\bas\s+([A-Z][a-z']+(?:\s+(?:et\s+al\.|and\s+[A-Z][a-z']+))?)\s+(?:observes?|argues?|notes?|states?|maintains?|suggests?|contends?|claims?|emphasize[sd]?|explains?|demonstrates?|shows?|remarks?|writes?|summarize[sd]?)\b/gi,
      // "Author observes/argues/notes..." — signal phrase WITHOUT "as" prefix
      /\b([A-Z][a-z']+(?:\s+(?:et\s+al\.|and\s+[A-Z][a-z']+))?)\s+(?:observes?|argues?|notes?|states?|maintains?|suggests?|contends?|claims?|emphasize[sd]?|explains?|demonstrates?|shows?|remarks?|writes?|summarize[sd]?)\s+(?:that|how|why|whether|this|the|a|an|against|for|in)\b/gi,
      // "Author (Year) argues..." — signal phrase with year
      /([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*)\s+\((\d{4})\)\s+(?:observes?|argues?|notes?|states?|maintains?|suggests?|contends?|claims?)\b/g,
    ];

    // ── Nested citation patterns (capture group: [1]=author) ──
    const nestedPatterns = [
      // (Author, *Title* 428a, as cited in Author, "Title")
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+\*[^*]+\*\s+\d+[a-z]\d*(?:[-–]\d+[a-z]?\d*)?,\s+as\s+cited\s+in\s+[^)]+\)/gi,
      // (Author, "Title," as cited in Author, "Title")
      /\(([A-Z][a-z']+(?:\s+[A-Z][a-z']+)*),\s+"[^"]+[,"]?\s+as\s+cited\s+in\s+[^)]+\)/gi,
    ];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      // Process APA patterns (have year/page capture groups)
      for (const pattern of apaPatterns) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const raw = match[0];
          const author = match[1];
          const secondPart = match[2];
          const thirdPart = match[3];

          const isYear = secondPart && secondPart.length === 4;
          const year = isYear ? parseInt(secondPart, 10) : undefined;
          const page = thirdPart
            ? parseInt(thirdPart, 10)
            : (!isYear && secondPart ? parseInt(secondPart, 10) : undefined);

          const position = charOffset + match.index;
          const isDuplicate = citations.some(c => c.position === position);

          if (!isDuplicate) {
            citations.push({
              raw,
              author: author?.trim(),
              year,
              page,
              position,
              line: lineNum + 1,
            });
          }
        }
      }

      // Process MLA patterns (author + optional title in group [2])
      for (const pattern of mlaPatterns) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const raw = match[0];
          const author = match[1]?.trim();
          const title = match[2]?.trim() || undefined; // Title from quoted/italic capture group

          const position = charOffset + match.index;
          const isDuplicate = citations.some(c =>
            c.position === position ||
            (position >= c.position && position < c.position + c.raw.length) ||
            (c.position >= position && c.position < position + raw.length)
          );

          if (!isDuplicate) {
            citations.push({
              raw,
              author,
              year: undefined,
              page: undefined,
              title,
              position,
              line: lineNum + 1,
            });
          }
        }
      }

      // Process classical and nested patterns (author-only, no title capture)
      const classicalAndNestedPatterns = [...classicalPatterns, ...nestedPatterns];
      for (const pattern of classicalAndNestedPatterns) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const raw = match[0];
          let author = match[1]?.trim();

          // For classical inline patterns like (*De Anima*, ...), extract work title as-is
          // The author lookup will handle Aristotle/Plato mapping in validateSingleCitation
          if (author?.startsWith('*')) {
            const workAuthorMap: Record<string, string> = {
              'De Anima': 'Aristotle', 'Physics': 'Aristotle', 'Metaphysics': 'Aristotle',
              'Rhetoric': 'Aristotle', 'Poetics': 'Aristotle', 'Nicomachean Ethics': 'Aristotle',
              'Republic': 'Plato', 'Timaeus': 'Plato', 'Phaedrus': 'Plato', 'Sophist': 'Plato',
              'Being and Time': 'Heidegger', 'Sein und Zeit': 'Heidegger',
            };
            const workName = author.replace(/\*/g, '').trim();
            author = workAuthorMap[workName] || author;
          }

          const position = charOffset + match.index;
          const isDuplicate = citations.some(c =>
            c.position === position ||
            (position >= c.position && position < c.position + c.raw.length) ||
            (c.position >= position && c.position < position + raw.length)
          );

          if (!isDuplicate) {
            citations.push({
              raw,
              author,
              year: undefined,
              page: undefined,
              position,
              line: lineNum + 1,
            });
          }
        }
      }

      // Process signal phrase patterns (author from text, optional year)
      for (const pattern of signalPhrasePatterns) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const raw = match[0];
          const author = match[1]?.trim();
          const yearStr = match[2];
          const year = yearStr ? parseInt(yearStr, 10) : undefined;

          const position = charOffset + match.index;
          const isDuplicate = citations.some(c =>
            c.position === position ||
            (position >= c.position && position < c.position + c.raw.length) ||
            (c.position >= position && c.position < position + raw.length)
          );

          if (!isDuplicate) {
            citations.push({
              raw,
              author,
              year,
              page: undefined,
              position,
              line: lineNum + 1,
            });
          }
        }
      }

      charOffset += line.length + 1; // +1 for newline
    }

    // Sort by position and deduplicate overlapping
    citations.sort((a, b) => a.position - b.position);
    return this.deduplicateOverlapping(citations);
  }

  /**
   * Validate a single citation against corpus
   */
  private validateSingleCitation(
    citation: ExtractedCitation,
    options: ValidationOptions
  ): CitationValidation {
    if (!citation.author) {
      return {
        citation,
        valid: false,
        reason: 'Could not extract author from citation',
      };
    }

    const normalizedAuthor = this.normalizeAuthor(citation.author);
    const requirePageNumbers = options.requirePageNumbers ?? true;

    // Check for missing page number (for valid citations)
    const hasMissingPageNumber = requirePageNumbers && !citation.page;

    // Try exact match first (author + year)
    if (citation.year) {
      const exactKey = this.makeKeyFromParts(normalizedAuthor, citation.year);
      const exactMatch = this.findSourceByKey(exactKey);
      if (exactMatch) {
        // H-06: If citation includes a title, verify it belongs to this author
        if (citation.title) {
          const normalizedCitedTitle = this.normalizeTitle(citation.title);
          const validTitles = this.authorTitlesIndex.get(normalizedAuthor);
          if (validTitles && validTitles.size > 0 && !validTitles.has(normalizedCitedTitle)) {
            return {
              citation,
              valid: false,
              reason: `Author "${citation.author}" exists but title "${citation.title}" is not a work by this author in the corpus`,
              suggestion: options.suggestReplacements
                ? { source: exactMatch, formatted: `(${exactMatch.citationKey || `${this.getLastName(exactMatch.author)} ${exactMatch.year}`}, p. [PAGE NEEDED])` }
                : undefined,
            };
          }
        } else {
          // H-06 fallback: title not extracted from citation text.
          // If author has multiple works in corpus, an unverifiable citation
          // is not a valid citation — it could reference any work.
          const validTitles = this.authorTitlesIndex.get(normalizedAuthor);
          if (validTitles && validTitles.size > 1) {
            return {
              citation,
              valid: false,
              reason: `Author "${citation.author}" has ${validTitles.size} works in corpus but citation title could not be extracted — manual review required`,
              suggestion: options.suggestReplacements
                ? { source: exactMatch, formatted: `(${exactMatch.citationKey || `${this.getLastName(exactMatch.author)} ${exactMatch.year}`}, *${exactMatch.title}*, p. [PAGE NEEDED])` }
                : undefined,
            };
          }
        }
        return {
          citation,
          valid: true,
          matchedSource: exactMatch,
          missingPageNumber: hasMissingPageNumber,
          warning: hasMissingPageNumber
            ? `Citation missing page number: (${citation.author} ${citation.year}) should include page reference`
            : undefined,
        };
      }
    }

    // Try author-only match
    const authorSources = this.authorIndex.get(normalizedAuthor);
    if (authorSources && authorSources.length > 0) {
      // If no year in citation, accept author match
      if (!citation.year) {
        // H-06: If citation includes a title, verify it belongs to this author
        if (citation.title) {
          const normalizedCitedTitle = this.normalizeTitle(citation.title);
          const validTitles = this.authorTitlesIndex.get(normalizedAuthor);
          if (validTitles && validTitles.size > 0 && !validTitles.has(normalizedCitedTitle)) {
            return {
              citation,
              valid: false,
              reason: `Author "${citation.author}" exists but title "${citation.title}" is not a work by this author in the corpus`,
              suggestion: options.suggestReplacements
                ? { source: authorSources[0], formatted: `(${authorSources[0].citationKey || `${this.getLastName(authorSources[0].author)} ${authorSources[0].year}`}, p. [PAGE NEEDED])` }
                : undefined,
            };
          }
        } else {
          // H-06 fallback: title not extracted. Multi-work authors require title verification.
          const validTitles = this.authorTitlesIndex.get(normalizedAuthor);
          if (validTitles && validTitles.size > 1) {
            return {
              citation,
              valid: false,
              reason: `Author "${citation.author}" has ${validTitles.size} works in corpus but citation title could not be extracted — manual review required`,
              suggestion: options.suggestReplacements
                ? { source: authorSources[0], formatted: `(${authorSources[0].citationKey || `${this.getLastName(authorSources[0].author)} ${authorSources[0].year}`}, *${authorSources[0].title}*, p. [PAGE NEEDED])` }
                : undefined,
            };
          }
        }
        return {
          citation,
          valid: true,
          matchedSource: authorSources[0],
          missingPageNumber: hasMissingPageNumber,
          warning: hasMissingPageNumber
            ? `Citation missing page number: (${citation.author}) should include year and page reference`
            : undefined,
        };
      }

      // Year mismatch - hallucinated year
      const suggestion = options.suggestReplacements
        ? {
            source: authorSources[0],
            formatted: `(${authorSources[0].citationKey || `${this.getLastName(authorSources[0].author)} ${authorSources[0].year}`}, p. [PAGE NEEDED])`,
          }
        : undefined;

      return {
        citation,
        valid: false,
        reason: `Author "${citation.author}" exists but year ${citation.year} doesn't match corpus (available: ${authorSources.map(s => s.year).join(', ')})`,
        suggestion,
      };
    }

    // No match at all - fully hallucinated
    const suggestion = options.suggestReplacements
      ? this.findBestSuggestion(citation)
      : undefined;

    return {
      citation,
      valid: false,
      reason: `No corpus source found for author "${citation.author}"`,
      suggestion,
    };
  }

  /**
   * Find best suggestion for a hallucinated citation
   */
  private findBestSuggestion(
    citation: ExtractedCitation
  ): { source: CorpusSource; formatted: string } | undefined {
    // Try fuzzy author matching
    const normalizedAuthor = this.normalizeAuthor(citation.author || '');

    for (const [authorKey, sources] of this.authorIndex) {
      // Check if author names are similar (e.g., "Frede" matches "Frede, Dorothea")
      if (authorKey.includes(normalizedAuthor) || normalizedAuthor.includes(authorKey)) {
        const source = sources[0];
        return {
          source,
          formatted: `(${source.citationKey || `${this.getLastName(source.author)} ${source.year}`})`,
        };
      }
    }

    return undefined;
  }

  /**
   * Remove overlapping citations (keep longer matches)
   */
  private deduplicateOverlapping(citations: ExtractedCitation[]): ExtractedCitation[] {
    const result: ExtractedCitation[] = [];

    for (const citation of citations) {
      const overlapping = result.findIndex(
        c =>
          (citation.position >= c.position &&
            citation.position < c.position + c.raw.length) ||
          (c.position >= citation.position &&
            c.position < citation.position + citation.raw.length)
      );

      if (overlapping === -1) {
        result.push(citation);
      } else if (citation.raw.length > result[overlapping].raw.length) {
        // Replace with longer match
        result[overlapping] = citation;
      }
    }

    return result;
  }

  /**
   * Create lookup key from source
   */
  private makeKey(author: string, year: number): string {
    return `${this.normalizeAuthor(author)}_${Math.abs(year)}`;
  }

  /**
   * Create lookup key from parts
   */
  private makeKeyFromParts(normalizedAuthor: string, year: number): string {
    return `${normalizedAuthor}_${Math.abs(year)}`;
  }

  /**
   * Find source by key with fuzzy matching
   */
  private findSourceByKey(key: string): CorpusSource | undefined {
    // Exact match
    if (this.sources.has(key)) {
      return this.sources.get(key);
    }

    // Try with variations
    for (const [sourceKey, source] of this.sources) {
      if (sourceKey.toLowerCase() === key.toLowerCase()) {
        return source;
      }
    }

    return undefined;
  }

  /**
   * Normalize author name for matching
   */
  private normalizeAuthor(author: string): string {
    // Handle "Last, First" format
    if (author.includes(',')) {
      return author.split(',')[0].trim().toLowerCase();
    }
    // Handle "First Last" format - take last word
    const parts = author.trim().split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Get last name from full author name
   */
  private getLastName(author: string): string {
    if (author.includes(',')) {
      return author.split(',')[0].trim();
    }
    const parts = author.trim().split(/\s+/);
    return parts[parts.length - 1];
  }

  /**
   * Generate summary of validation results
   */
  private generateSummary(
    validCount: number,
    hallucinatedCount: number,
    hallucinations: CitationValidation[],
    missingPageNumbers: CitationValidation[] = []
  ): string {
    const parts: string[] = [];

    if (hallucinatedCount === 0 && missingPageNumbers.length === 0) {
      return `All ${validCount} citations verified against corpus with page numbers.`;
    }

    if (hallucinatedCount === 0) {
      parts.push(`All ${validCount} citations verified against corpus.`);
    } else {
      const hallucinatedAuthors = [...new Set(hallucinations.map(h => h.citation.author))];
      parts.push(
        `${hallucinatedCount} hallucinated citation(s) detected out of ${validCount + hallucinatedCount} total. ` +
        `Problematic authors: ${hallucinatedAuthors.join(', ')}`
      );
    }

    if (missingPageNumbers.length > 0) {
      const missingAuthors = [...new Set(missingPageNumbers.map(m => m.citation.author))];
      parts.push(
        `${missingPageNumbers.length} citation(s) missing page numbers: ${missingAuthors.slice(0, 5).join(', ')}` +
        (missingAuthors.length > 5 ? ` and ${missingAuthors.length - 5} more` : '')
      );
    }

    return parts.join(' ');
  }
}

/**
 * Create a validator from corpus chunks
 */
export function createValidatorFromChunks(
  chunks: ContextChunk[],
  additionalSources?: CorpusSource[]
): CitationValidator {
  const constraint = buildCorpusConstraint(chunks, {
    enforcement: 'strict',
    additionalSources,
  });

  return new CitationValidator(constraint);
}
