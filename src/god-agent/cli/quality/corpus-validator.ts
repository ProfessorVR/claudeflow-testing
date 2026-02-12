/**
 * CorpusValidator - Validates that all citations exist in the ingested corpus
 *
 * This is a CRITICAL component that enforces corpus-only citations by default.
 * All citations must be verified against the corpus before section completion.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Corpus Source Types
// ============================================================================

/**
 * Represents a source document in the corpus from manifest
 */
export interface CorpusSource {
  docId: string;
  author: string;
  title: string;
  year: number | null;
  collection: string;
  chunks: number;
}

/**
 * Location of a citation within content
 */
export interface CitationLocation {
  lineNumber: number;
  charStart: number;
  charEnd: number;
  excerpt: string;
}

/**
 * Validation result for a single citation
 */
export interface CitationValidationResult {
  /** Original citation text */
  citation: string;
  /** Parsed author name */
  extractedAuthor: string;
  /** Parsed year */
  extractedYear: string | null;
  /** Parsed title (if available) */
  extractedTitle: string | null;
  /** Whether found in corpus */
  foundInCorpus: boolean;
  /** The matching source if found */
  matchedSource: CorpusSource | null;
  /** Similar sources for fuzzy matching suggestions */
  similarSources: CorpusSource[];
  /** Match confidence (0-1) */
  confidence: number;
  /** Location in the content */
  location: CitationLocation;
}

/**
 * Overall validation report
 */
export interface CorpusValidationReport {
  totalCitations: number;
  validCitations: number;
  invalidCitations: number;
  /** Coverage rate (0-1) */
  coverageRate: number;
  valid: CitationValidationResult[];
  invalid: CitationValidationResult[];
  /** Helpful suggestions for fixing */
  suggestions: string[];
  /** Whether to allow section completion */
  canProceed: boolean;
}

// ============================================================================
// Citation Patterns
// ============================================================================

/**
 * Citation patterns for extraction
 * Supports MLA, APA, Bekker notation (Aristotle), and Heidegger GA notation
 */
const CITATION_PATTERNS = {
  // MLA: (Author 123) or (Author 123-125)
  mla: /\(([A-Z][a-zA-Z'-]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z'-]+)?)\s+(\d+(?:-\d+)?)\)/g,

  // APA: (Author, 2020) or (Author & Author, 2020)
  apa: /\(([A-Z][a-zA-Z'-]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z'-]+)?),?\s*(\d{4})\)/g,

  // Author (Year) format
  authorYear: /([A-Z][a-zA-Z'-]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z'-]+)?)\s+\((\d{4})\)/g,

  // Aristotle Bekker notation: (*De Anima* 427b15) or (De Anima 427b15-21)
  bekker: /\(\*?([A-Za-z\s]+)\*?\s+(\d+[ab]\d+(?:-\d+)?)\)/g,

  // Heidegger GA notation: (GA 18, 207) or (*Being and Time* 173)
  heidegger: /\((?:GA\s+\d+,?\s*)?(?:\*[^*]+\*\s+)?(\d+)\)/g,
};

// ============================================================================
// CorpusValidator Class
// ============================================================================

/**
 * Validates that all citations in content exist in the ingested corpus
 */
export class CorpusValidator {
  private corpusSources: CorpusSource[] = [];
  private manifestPath: string;
  private initialized: boolean = false;

  constructor(manifestPath?: string) {
    this.manifestPath =
      manifestPath || join(process.cwd(), 'scripts/ingest/manifest.jsonl');
  }

  /**
   * Load corpus sources from manifest
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!existsSync(this.manifestPath)) {
      console.warn(
        `[CorpusValidator] Manifest not found at ${this.manifestPath}`
      );
      this.initialized = true;
      return;
    }

    const content = readFileSync(this.manifestPath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    const seen = new Set<string>();

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.status === 'ok' && entry.meta) {
          const key = `${entry.meta.author_raw}-${entry.meta.title_raw}`;
          if (!seen.has(key)) {
            seen.add(key);
            this.corpusSources.push({
              docId: entry.doc_id,
              author: entry.meta.author_raw || 'Unknown',
              title: entry.meta.title_raw || 'Unknown',
              year: entry.meta.year || null,
              collection: entry.collection,
              chunks: entry.chunks || 0,
            });
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    console.log(
      `[CorpusValidator] Loaded ${this.corpusSources.length} corpus sources`
    );
    this.initialized = true;
  }

  /**
   * Extract all citations from content
   */
  extractCitations(content: string): Array<{
    citation: string;
    author: string;
    year: string | null;
    lineNumber: number;
    charStart: number;
    charEnd: number;
  }> {
    const citations: Array<{
      citation: string;
      author: string;
      year: string | null;
      lineNumber: number;
      charStart: number;
      charEnd: number;
    }> = [];

    // Track seen citations to avoid duplicates from overlapping patterns
    const seenCitations = new Set<string>();

    const lines = content.split('\n');
    let charOffset = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // Try each citation pattern
      for (const [patternName, pattern] of Object.entries(CITATION_PATTERNS)) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;

        while ((match = regex.exec(line)) !== null) {
          const citation = match[0];

          // Create unique key for deduplication
          const citKey = `${lineIdx}:${match.index}:${citation}`;
          if (seenCitations.has(citKey)) continue;
          seenCitations.add(citKey);

          let author = '';
          let year: string | null = null;

          if (patternName === 'bekker') {
            // For Bekker notation, author is "Aristotle"
            author = 'Aristotle';
            year = null;
          } else if (patternName === 'heidegger') {
            author = 'Heidegger';
            year = null;
          } else {
            author = match[1] || '';
            year = match[2] || null;
          }

          citations.push({
            citation,
            author: author.trim(),
            year,
            lineNumber: lineIdx + 1,
            charStart: charOffset + match.index,
            charEnd: charOffset + match.index + citation.length,
          });
        }
      }

      charOffset += line.length + 1; // +1 for newline
    }

    return citations;
  }

  /**
   * Find matching corpus source for a citation
   */
  findMatchingSource(
    author: string,
    year: string | null,
    _title?: string
  ): {
    match: CorpusSource | null;
    similar: CorpusSource[];
    confidence: number;
  } {
    const normalizedAuthor = author.toLowerCase().replace(/[^a-z]/g, '');

    let bestMatch: CorpusSource | null = null;
    let bestConfidence = 0;
    const similar: CorpusSource[] = [];

    for (const source of this.corpusSources) {
      const sourceAuthor = (source.author || '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');
      const sourceLastName = sourceAuthor.split(',')[0] || sourceAuthor;

      // Check author match
      const authorMatch =
        sourceLastName.includes(normalizedAuthor) ||
        normalizedAuthor.includes(sourceLastName);

      if (!authorMatch) continue;

      // Calculate confidence
      let confidence = 0.5; // Base confidence for author match

      // Year match bonus
      if (year && source.year && source.year.toString() === year) {
        confidence += 0.3;
      }

      // Exact author match bonus
      if (sourceLastName === normalizedAuthor) {
        confidence += 0.2;
      }

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = source;
      }

      if (confidence >= 0.5) {
        similar.push(source);
      }
    }

    return {
      match: bestConfidence >= 0.7 ? bestMatch : null,
      similar: similar.slice(0, 3), // Top 3 similar
      confidence: bestConfidence,
    };
  }

  /**
   * Validate all citations in content against corpus
   */
  async validateAllCitations(content: string): Promise<CorpusValidationReport> {
    await this.initialize();

    const citations = this.extractCitations(content);
    const valid: CitationValidationResult[] = [];
    const invalid: CitationValidationResult[] = [];
    const suggestions: string[] = [];

    for (const cit of citations) {
      const { match, similar, confidence } = this.findMatchingSource(
        cit.author,
        cit.year
      );

      const lines = content.split('\n');
      const lineContent = lines[cit.lineNumber - 1] || '';
      const citationIndex = lineContent.indexOf(cit.citation);
      const excerptStart = Math.max(0, citationIndex - 20);
      const excerptEnd = Math.min(
        lineContent.length,
        citationIndex + cit.citation.length + 20
      );
      const excerpt = lineContent.substring(excerptStart, excerptEnd);

      const result: CitationValidationResult = {
        citation: cit.citation,
        extractedAuthor: cit.author,
        extractedYear: cit.year,
        extractedTitle: null,
        foundInCorpus: match !== null,
        matchedSource: match,
        similarSources: similar,
        confidence,
        location: {
          lineNumber: cit.lineNumber,
          charStart: cit.charStart,
          charEnd: cit.charEnd,
          excerpt: excerpt.trim(),
        },
      };

      if (match) {
        valid.push(result);
      } else {
        invalid.push(result);

        // Generate suggestion
        if (similar.length > 0) {
          const suggestion = `Citation "${cit.citation}" not found. Did you mean: ${similar
            .map((s) => `"${s.author} (${s.year || 'n.d.'})" - ${s.title}`)
            .join(' OR ')}?`;
          suggestions.push(suggestion);
        } else {
          suggestions.push(
            `Citation "${cit.citation}" by "${cit.author}" not found in corpus. Please verify the source exists or use --allow-external flag.`
          );
        }
      }
    }

    const coverageRate =
      citations.length > 0 ? valid.length / citations.length : 1;

    return {
      totalCitations: citations.length,
      validCitations: valid.length,
      invalidCitations: invalid.length,
      coverageRate,
      valid,
      invalid,
      suggestions,
      canProceed: invalid.length === 0,
    };
  }

  /**
   * Enforce corpus-only validation - returns enforcement result
   */
  async enforceCorpusOnly(
    content: string,
    options: {
      /** Minimum coverage rate required (default 1.0 = 100%) */
      threshold?: number;
      /** Override to allow external sources */
      allowExternal?: boolean;
    } = {}
  ): Promise<{
    passed: boolean;
    report: CorpusValidationReport;
    errorMessage?: string;
  }> {
    const { threshold = 1.0, allowExternal = false } = options;

    if (allowExternal) {
      return {
        passed: true,
        report: {
          totalCitations: 0,
          validCitations: 0,
          invalidCitations: 0,
          coverageRate: 1,
          valid: [],
          invalid: [],
          suggestions: ['External sources allowed by user flag'],
          canProceed: true,
        },
      };
    }

    const report = await this.validateAllCitations(content);

    if (report.coverageRate >= threshold) {
      return { passed: true, report };
    }

    const errorMessage = [
      `CORPUS VALIDATION FAILED: ${report.invalidCitations} of ${report.totalCitations} citations not found in corpus.`,
      '',
      'Invalid citations:',
      ...report.invalid.map(
        (inv) =>
          `  - Line ${inv.location.lineNumber}: ${inv.citation} (${inv.extractedAuthor})`
      ),
      '',
      'Suggestions:',
      ...report.suggestions,
      '',
      'To proceed with external sources, use --allow-external flag.',
    ].join('\n');

    return {
      passed: false,
      report,
      errorMessage,
    };
  }

  /**
   * Get list of available corpus sources (for agent reference)
   */
  getAvailableSources(): CorpusSource[] {
    return [...this.corpusSources];
  }

  /**
   * Check if validator has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get corpus source count
   */
  getSourceCount(): number {
    return this.corpusSources.length;
  }

  /**
   * Generate markdown summary of corpus
   */
  generateCorpusSummary(): string {
    const byAuthor = new Map<string, CorpusSource[]>();

    for (const source of this.corpusSources) {
      const author = source.author || 'Unknown';
      if (!byAuthor.has(author)) {
        byAuthor.set(author, []);
      }
      byAuthor.get(author)!.push(source);
    }

    const lines = ['# Available Corpus Sources', ''];

    for (const [author, sources] of Array.from(byAuthor.entries()).sort()) {
      lines.push(`## ${author}`);
      for (const source of sources) {
        lines.push(
          `- *${source.title}* (${source.year || 'n.d.'}) [${source.chunks} chunks]`
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Search for sources by author name (partial match)
   */
  searchByAuthor(authorQuery: string): CorpusSource[] {
    const normalized = authorQuery.toLowerCase().replace(/[^a-z]/g, '');

    return this.corpusSources.filter((source) => {
      const sourceAuthor = (source.author || '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');
      return sourceAuthor.includes(normalized);
    });
  }

  /**
   * Search for sources by title (partial match)
   */
  searchByTitle(titleQuery: string): CorpusSource[] {
    const normalized = titleQuery.toLowerCase();

    return this.corpusSources.filter((source) => {
      const sourceTitle = (source.title || '').toLowerCase();
      return sourceTitle.includes(normalized);
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton corpus validator instance
 */
export const corpusValidator = new CorpusValidator();

/**
 * Factory function to create a new validator with custom manifest path
 */
export function createCorpusValidator(manifestPath?: string): CorpusValidator {
  return new CorpusValidator(manifestPath);
}
