/**
 * SourceVerificationLayer - Verify citations against the corpus
 *
 * This module verifies that all citations in generated content exist in the
 * corpus (rhetorical_ontology). It provides:
 * - Citation extraction from content
 * - Corpus presence verification
 * - Acquisition suggestions for missing sources
 *
 * Integrates with the QualityGauntlet to ensure all sources are available.
 */

import { CorpusCitationConnector, getCorpusCitationConnector } from './corpus-citation-connector.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

/**
 * Extracted citation from content
 */
export interface ExtractedCitation {
  /** Original citation text as it appears in content */
  text: string;
  /** Extracted author name(s) */
  author: string;
  /** Extracted title (if available) */
  title?: string;
  /** Extracted year (if available) */
  year?: number;
  /** Location in content (paragraph index) */
  paragraphIndex: number;
  /** Character position in paragraph */
  position: number;
  /** Citation format detected */
  format: 'apa' | 'harvard' | 'chicago' | 'mla' | 'endnote' | 'unknown';
  /** Endnote number if applicable */
  endnoteNumber?: number;
}

/**
 * Availability classification for sources
 */
export type SourceAvailability = 'open_access' | 'paywalled' | 'unknown' | 'in_corpus';

/**
 * Acquisition suggestion for a missing source
 */
export interface AcquisitionSuggestion {
  /** Source identifier (author + title) */
  source: string;
  /** Author name */
  author: string;
  /** Title of work */
  title: string;
  /** Publication year */
  year?: number;
  /** Availability classification */
  type: SourceAvailability;
  /** URLs for accessing the source */
  urls: {
    /** Open access download links */
    openAccess?: string[];
    /** Purchase links */
    purchase?: string[];
    /** Library access URL */
    library?: string;
    /** DOI link */
    doi?: string;
  };
  /** Digital Object Identifier */
  doi?: string;
  /** ISBN for books */
  isbn?: string;
  /** Publisher */
  publisher?: string;
  /** Notes about availability */
  notes?: string;
}

/**
 * Result of verifying a single citation
 */
export interface SourceVerificationResult {
  /** The original extracted citation */
  citation: ExtractedCitation;
  /** Whether the source exists in the corpus */
  inCorpus: boolean;
  /** Path to source in corpus (if found) */
  corpusPath?: string;
  /** Match confidence (0-1) */
  confidence: number;
  /** Acquisition suggestion if not in corpus */
  suggestedAcquisition?: AcquisitionSuggestion;
  /** Matched corpus chunks (if found) */
  matchedChunks?: Array<{
    id: string;
    content: string;
    similarity: number;
  }>;
}

/**
 * Aggregated verification results
 */
export interface VerificationSummary {
  /** Total citations verified */
  totalCitations: number;
  /** Citations found in corpus */
  foundInCorpus: number;
  /** Citations missing from corpus */
  missingFromCorpus: number;
  /** Unique sources missing */
  uniqueMissingSources: number;
  /** Detailed results per citation */
  results: SourceVerificationResult[];
  /** Deduplicated missing sources with acquisition suggestions */
  missingSources: AcquisitionSuggestion[];
  /** Verification timestamp */
  verifiedAt: Date;
}

// ============================================================================
// Citation Extraction Patterns
// ============================================================================

const CITATION_PATTERNS = {
  // APA style: (Author, 2020) or Author (2020)
  apaParenthetical: /\(([A-Z][a-zA-Z]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z]+)?(?:\s+et\s+al\.?)?),?\s*(\d{4}[a-z]?)\)/g,
  apaInText: /([A-Z][a-zA-Z]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z]+)?(?:\s+et\s+al\.?)?)\s*\((\d{4}[a-z]?)\)/g,

  // Harvard style: (Author 2020)
  harvardParenthetical: /\(([A-Z][a-zA-Z]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z]+)?)\s+(\d{4}[a-z]?)\)/g,

  // Chicago endnote style: superscript or bracketed numbers
  chicagoEndnote: /\[(\d+)\]|(?<![0-9])(\d{1,3})(?=[\.\,\;\s])/g,

  // Endnote section pattern: numbered endnotes at end of document
  endnoteSection: /^(\d+)\.\s+(.+?)(?:\s*\((\d{4})\))?[,\.]?\s*(?:"([^"]+)")?/gm,

  // Author-year in sentence: "According to Smith (2020)..."
  inSentence: /(?:According to|As|Following)\s+([A-Z][a-zA-Z]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z]+)?)\s*\((\d{4})\)/gi,

  // Direct author reference: "Aristotle argues..." or "Heidegger claims..."
  namedAuthor: /\b(Aristotle|Plato|Heidegger|Husserl|Merleau-Ponty|Sartre|Nietzsche|Kant|Hegel|Descartes|Spinoza)\b/g,
};

// ============================================================================
// Known Sources Database (for acquisition suggestions)
// ============================================================================

const KNOWN_SOURCES: Record<string, Partial<AcquisitionSuggestion>> = {
  'aristotle_nicomachean_ethics': {
    author: 'Aristotle',
    title: 'Nicomachean Ethics',
    type: 'open_access',
    urls: {
      openAccess: [
        'https://www.gutenberg.org/ebooks/8438',
        'http://classics.mit.edu/Aristotle/nicomachaen.html',
        'https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.01.0054',
      ],
    },
    notes: 'Public domain, multiple free translations available',
  },
  'aristotle_de_anima': {
    author: 'Aristotle',
    title: 'De Anima (On the Soul)',
    type: 'open_access',
    urls: {
      openAccess: [
        'http://classics.mit.edu/Aristotle/soul.html',
        'https://www.gutenberg.org/ebooks/57433',
      ],
    },
    notes: 'Public domain',
  },
  'aristotle_rhetoric': {
    author: 'Aristotle',
    title: 'Rhetoric',
    type: 'open_access',
    urls: {
      openAccess: [
        'http://classics.mit.edu/Aristotle/rhetoric.html',
        'https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.01.0060',
      ],
    },
    notes: 'Public domain',
  },
  'fortenbaugh_aristotle_emotion': {
    author: 'Fortenbaugh, William W.',
    title: 'Aristotle on Emotion: A Contribution to Philosophical Psychology, Rhetoric, Poetics, Politics, and Ethics',
    year: 2002,
    type: 'paywalled',
    publisher: 'Duckworth',
    isbn: '0715631675',
    urls: {
      purchase: [
        'https://www.amazon.com/Aristotle-Emotion-William-W-Fortenbaugh/dp/0715631675',
      ],
      library: 'https://archive.org/details/aristotleonemoti0000fort',
    },
    notes: 'Second edition 2002. Internet Archive has controlled digital lending.',
  },
  'dow_passions_persuasion': {
    author: 'Dow, Jamie',
    title: 'Passions and Persuasion in Aristotle\'s Rhetoric',
    year: 2015,
    type: 'paywalled',
    publisher: 'Oxford University Press',
    isbn: '9780198716266',
    urls: {
      purchase: [
        'https://global.oup.com/academic/product/passions-and-persuasion-in-aristotles-rhetoric-9780198716266',
        'https://www.amazon.com/Passions-Persuasion-Aristotles-Rhetoric-Aristotle/dp/0198716265',
      ],
      library: 'https://eprints.whiterose.ac.uk/74762/',
    },
    notes: 'May be available via ResearchGate request to author',
  },
  'moss_akrasia_perceptual': {
    author: 'Moss, Jessica',
    title: 'Akrasia and Perceptual Illusion',
    year: 2009,
    type: 'open_access',
    urls: {
      openAccess: [
        'https://pgrim.org/philosophersannual/29articles/mossakrasia.pdf',
      ],
      doi: 'https://doi.org/10.1515/AGPH.2009.06',
    },
    doi: '10.1515/AGPH.2009.06',
    notes: 'Archiv für Geschichte der Philosophie 91(2):119-156. Selected for Philosopher\'s Annual 2009.',
  },
  'elpidorou_affectivity_heidegger': {
    author: 'Elpidorou, Andreas & Freeman, Lauren',
    title: 'Affectivity in Heidegger I: Moods and Emotions in Being and Time',
    year: 2015,
    type: 'paywalled',
    publisher: 'Wiley (Philosophy Compass)',
    doi: '10.1111/phc3.12236',
    urls: {
      doi: 'https://doi.org/10.1111/phc3.12236',
      purchase: [
        'https://compass.onlinelibrary.wiley.com/doi/abs/10.1111/phc3.12236',
      ],
    },
    notes: 'May be available via ResearchGate request to author',
  },
  'heidegger_being_time': {
    author: 'Heidegger, Martin',
    title: 'Being and Time',
    year: 1927,
    type: 'paywalled',
    urls: {
      purchase: [
        'https://www.amazon.com/Being-Time-Martin-Heidegger/dp/0061575593',
      ],
    },
    notes: 'Multiple translations available. Macquarrie & Robinson translation most common.',
  },
};

// ============================================================================
// SourceVerificationLayer Class
// ============================================================================

/**
 * Verifies citations against the corpus and suggests acquisition for missing sources
 */
export class SourceVerificationLayer {
  private corpusConnector: CorpusCitationConnector | null = null;
  private corpusDir: string;
  private verbose: boolean;

  constructor(options: {
    corpusDir?: string;
    verbose?: boolean;
  } = {}) {
    this.corpusDir = options.corpusDir || process.cwd() + '/corpus';
    this.verbose = options.verbose ?? false;
  }

  /**
   * Get or initialize the corpus connector
   */
  private getCorpusConnector(): CorpusCitationConnector {
    if (!this.corpusConnector) {
      this.corpusConnector = getCorpusCitationConnector();
    }
    return this.corpusConnector;
  }

  /**
   * Extract all citations from content
   */
  extractCitations(content: string): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const paragraphs = content.split(/\n\n+/);

    // Check for endnotes section
    const endnoteSection = this.extractEndnoteSection(content);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];

      // Extract APA parenthetical
      this.extractWithPattern(
        paragraph,
        CITATION_PATTERNS.apaParenthetical,
        pIndex,
        'apa',
        citations,
        (match) => ({ author: match[1], year: parseInt(match[2], 10) })
      );

      // Extract APA in-text
      this.extractWithPattern(
        paragraph,
        CITATION_PATTERNS.apaInText,
        pIndex,
        'apa',
        citations,
        (match) => ({ author: match[1], year: parseInt(match[2], 10) })
      );

      // Extract Harvard
      this.extractWithPattern(
        paragraph,
        CITATION_PATTERNS.harvardParenthetical,
        pIndex,
        'harvard',
        citations,
        (match) => ({ author: match[1], year: parseInt(match[2], 10) })
      );

      // Extract endnote references [1], [2], etc.
      const endnoteRegex = /\[(\d+)\]/g;
      let endnoteMatch;
      while ((endnoteMatch = endnoteRegex.exec(paragraph)) !== null) {
        const noteNum = parseInt(endnoteMatch[1], 10);
        const endnoteInfo = endnoteSection.get(noteNum);

        if (endnoteInfo) {
          citations.push({
            text: endnoteMatch[0],
            author: endnoteInfo.author,
            title: endnoteInfo.title,
            year: endnoteInfo.year,
            paragraphIndex: pIndex,
            position: endnoteMatch.index || 0,
            format: 'endnote',
            endnoteNumber: noteNum,
          });
        }
      }

      // Extract named authors (Aristotle, Heidegger, etc.)
      const namedRegex = new RegExp(CITATION_PATTERNS.namedAuthor.source, CITATION_PATTERNS.namedAuthor.flags);
      let namedMatch;
      while ((namedMatch = namedRegex.exec(paragraph)) !== null) {
        // Check if already captured
        const alreadyCaptured = citations.some(
          c => c.paragraphIndex === pIndex &&
               Math.abs(c.position - (namedMatch!.index || 0)) < 30 &&
               c.author.includes(namedMatch![1])
        );

        if (!alreadyCaptured) {
          citations.push({
            text: namedMatch[0],
            author: namedMatch[1],
            paragraphIndex: pIndex,
            position: namedMatch.index || 0,
            format: 'unknown',
          });
        }
      }
    }

    return this.deduplicateCitations(citations);
  }

  /**
   * Extract endnote section from content
   */
  private extractEndnoteSection(content: string): Map<number, { author: string; title?: string; year?: number }> {
    const endnotes = new Map<number, { author: string; title?: string; year?: number }>();

    // Find endnotes section
    const endnoteSectionMatch = content.match(/(?:^|\n)(?:#+\s*)?(?:End\s*)?[Nn]otes?\s*(?:\n|$)([\s\S]*?)(?=\n#|\n\*\*|$)/m);

    if (endnoteSectionMatch) {
      const section = endnoteSectionMatch[1];
      const lines = section.split('\n');

      for (const line of lines) {
        // Pattern: "1. Author, Title (Year)" or "1. Author (Year), Title"
        const match = line.match(/^(\d+)\.\s+(.+?)(?:\s*\((\d{4})\))?(?:[,\.]\s*(?:"([^"]+)"|([^,\n]+)))?/);

        if (match) {
          const noteNum = parseInt(match[1], 10);
          const authorOrTitle = match[2].trim();
          const year = match[3] ? parseInt(match[3], 10) : undefined;
          const quotedTitle = match[4];
          const plainTitle = match[5]?.trim();

          // Parse author from the beginning
          const authorMatch = authorOrTitle.match(/^([A-Z][a-zA-Z]+(?:,?\s+[A-Z]\.?)*(?:\s+(?:and|&)\s+[A-Z][a-zA-Z]+(?:,?\s+[A-Z]\.?)*)?)/);

          endnotes.set(noteNum, {
            author: authorMatch ? authorMatch[1] : authorOrTitle,
            title: quotedTitle || plainTitle,
            year,
          });
        }
      }
    }

    return endnotes;
  }

  /**
   * Helper to extract citations with a specific pattern
   */
  private extractWithPattern(
    text: string,
    pattern: RegExp,
    paragraphIndex: number,
    format: ExtractedCitation['format'],
    citations: ExtractedCitation[],
    extractor: (match: RegExpMatchArray) => { author: string; year?: number; title?: string }
  ): void {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const extracted = extractor(match);
      citations.push({
        text: match[0],
        author: extracted.author,
        title: extracted.title,
        year: extracted.year,
        paragraphIndex,
        position: match.index || 0,
        format,
      });
    }
  }

  /**
   * Deduplicate citations by author/year
   */
  private deduplicateCitations(citations: ExtractedCitation[]): ExtractedCitation[] {
    const seen = new Set<string>();
    const unique: ExtractedCitation[] = [];

    for (const citation of citations) {
      const key = `${citation.author.toLowerCase()}_${citation.year || 'no-year'}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(citation);
      }
    }

    return unique;
  }

  /**
   * Verify all citations against the corpus
   */
  async verifyCitationsAgainstCorpus(
    citations: ExtractedCitation[]
  ): Promise<VerificationSummary> {
    const results: SourceVerificationResult[] = [];
    const missingSourcesMap = new Map<string, AcquisitionSuggestion>();

    for (const citation of citations) {
      const result = await this.verifySingleCitation(citation);
      results.push(result);

      if (!result.inCorpus && result.suggestedAcquisition) {
        const key = `${result.suggestedAcquisition.author}_${result.suggestedAcquisition.title}`.toLowerCase();
        if (!missingSourcesMap.has(key)) {
          missingSourcesMap.set(key, result.suggestedAcquisition);
        }
      }
    }

    const foundInCorpus = results.filter(r => r.inCorpus).length;

    return {
      totalCitations: citations.length,
      foundInCorpus,
      missingFromCorpus: citations.length - foundInCorpus,
      uniqueMissingSources: missingSourcesMap.size,
      results,
      missingSources: Array.from(missingSourcesMap.values()),
      verifiedAt: new Date(),
    };
  }

  /**
   * Verify a single citation
   */
  private async verifySingleCitation(
    citation: ExtractedCitation
  ): Promise<SourceVerificationResult> {
    const inCorpus = await this.checkCorpusForSource(
      citation.author,
      citation.title,
      citation.year
    );

    if (inCorpus.found) {
      return {
        citation,
        inCorpus: true,
        corpusPath: inCorpus.path,
        confidence: inCorpus.confidence,
        matchedChunks: inCorpus.matchedChunks,
      };
    }

    // Source not in corpus - suggest acquisition
    const suggestion = this.generateAcquisitionSuggestion(citation);

    return {
      citation,
      inCorpus: false,
      confidence: 0,
      suggestedAcquisition: suggestion,
    };
  }

  /**
   * Check if a source exists in the corpus
   */
  async checkCorpusForSource(
    author: string,
    title?: string,
    year?: number
  ): Promise<{
    found: boolean;
    path?: string;
    confidence: number;
    matchedChunks?: Array<{ id: string; content: string; similarity: number }>;
  }> {
    // First check file system directly
    const fsResult = this.checkCorpusFilesystem(author, title);
    if (fsResult.found) {
      return fsResult;
    }

    // Then check via corpus connector (semantic search)
    try {
      const connector = this.getCorpusConnector();
      const searchQuery = [author, title, year].filter(Boolean).join(' ');

      const verifyResult = await connector.verifyCitation(searchQuery, '');

      if (verifyResult.isValid && verifyResult.confidence > 0.7) {
        return {
          found: true,
          confidence: verifyResult.confidence,
          matchedChunks: verifyResult.matchedChunks.map(c => ({
            id: c.chunkId,
            content: c.content.substring(0, 200),
            similarity: c.similarity || 0,
          })),
        };
      }
    } catch {
      // Corpus connector not available - only filesystem check
      if (this.verbose) {
        console.warn('Corpus connector not available for semantic search');
      }
    }

    return { found: false, confidence: 0 };
  }

  /**
   * Check corpus filesystem for source
   */
  private checkCorpusFilesystem(
    author: string,
    title?: string
  ): { found: boolean; path?: string; confidence: number } {
    const authorLower = author.toLowerCase();
    const titleLower = title?.toLowerCase() || '';

    // Check various corpus directories
    const searchDirs = [
      this.corpusDir,
      path.join(this.corpusDir, 'downloads'),
      path.join(this.corpusDir, 'theory'),
      path.join(this.corpusDir, 'empirical'),
      path.join(this.corpusDir, 'notes'),
    ];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fileLower = file.toLowerCase();

          // Check if filename contains author name
          if (fileLower.includes(authorLower.split(',')[0].split(' ')[0])) {
            // If title provided, check for that too
            if (title) {
              const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
              const matchingWords = titleWords.filter(w => fileLower.includes(w));
              if (matchingWords.length >= 2 || matchingWords.length >= titleWords.length * 0.5) {
                return {
                  found: true,
                  path: path.join(dir, file),
                  confidence: 0.9,
                };
              }
            } else {
              return {
                found: true,
                path: path.join(dir, file),
                confidence: 0.7,
              };
            }
          }
        }
      } catch {
        continue;
      }
    }

    return { found: false, confidence: 0 };
  }

  /**
   * Generate acquisition suggestion for a citation
   */
  private generateAcquisitionSuggestion(citation: ExtractedCitation): AcquisitionSuggestion {
    // Check known sources database
    const knownKey = this.findKnownSourceKey(citation.author, citation.title);

    if (knownKey && KNOWN_SOURCES[knownKey]) {
      const known = KNOWN_SOURCES[knownKey];
      return {
        source: `${known.author} - ${known.title}`,
        author: known.author || citation.author,
        title: known.title || citation.title || 'Unknown',
        year: known.year || citation.year,
        type: known.type || 'unknown',
        urls: known.urls || {},
        doi: known.doi,
        isbn: known.isbn,
        publisher: known.publisher,
        notes: known.notes,
      };
    }

    // Generate generic suggestion
    return {
      source: `${citation.author}${citation.title ? ' - ' + citation.title : ''}`,
      author: citation.author,
      title: citation.title || 'Unknown Title',
      year: citation.year,
      type: 'unknown',
      urls: {
        library: 'Check your university library',
      },
      notes: 'Source not found in known databases. Manual search required.',
    };
  }

  /**
   * Find matching key in known sources
   */
  private findKnownSourceKey(author: string, title?: string): string | null {
    const authorLower = author.toLowerCase();
    const titleLower = title?.toLowerCase() || '';

    for (const [key, source] of Object.entries(KNOWN_SOURCES)) {
      const sourceAuthorLower = source.author?.toLowerCase() || '';
      const sourceTitleLower = source.title?.toLowerCase() || '';

      // Check author match
      const authorMatch = authorLower.includes(sourceAuthorLower.split(',')[0].split(' ')[0]) ||
                         sourceAuthorLower.includes(authorLower.split(',')[0].split(' ')[0]);

      if (authorMatch) {
        // If we have title, check for title match too
        if (title && sourceTitleLower) {
          const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
          const matchCount = titleWords.filter(w => sourceTitleLower.includes(w)).length;
          if (matchCount >= 2 || matchCount >= titleWords.length * 0.4) {
            return key;
          }
        } else if (!title) {
          // No title, just return based on author (might be wrong)
          return key;
        }
      }
    }

    return null;
  }

  /**
   * Generate a summary report of verification results
   */
  generateReport(summary: VerificationSummary): string {
    const lines: string[] = [
      '# Source Verification Report',
      '',
      `**Generated:** ${summary.verifiedAt.toISOString()}`,
      '',
      '## Summary',
      '',
      `- **Total Citations:** ${summary.totalCitations}`,
      `- **Found in Corpus:** ${summary.foundInCorpus}`,
      `- **Missing from Corpus:** ${summary.missingFromCorpus}`,
      `- **Unique Missing Sources:** ${summary.uniqueMissingSources}`,
      '',
    ];

    if (summary.missingSources.length > 0) {
      lines.push('## Missing Sources', '');

      for (const source of summary.missingSources) {
        lines.push(`### ${source.author} - ${source.title}`);
        if (source.year) lines.push(`**Year:** ${source.year}`);
        lines.push(`**Availability:** ${source.type}`);

        if (source.urls.openAccess?.length) {
          lines.push('**Open Access:**');
          for (const url of source.urls.openAccess) {
            lines.push(`- ${url}`);
          }
        }

        if (source.urls.purchase?.length) {
          lines.push('**Purchase:**');
          for (const url of source.urls.purchase) {
            lines.push(`- ${url}`);
          }
        }

        if (source.urls.library) {
          lines.push(`**Library:** ${source.urls.library}`);
        }

        if (source.doi) {
          lines.push(`**DOI:** ${source.doi}`);
        }

        if (source.notes) {
          lines.push(`**Notes:** ${source.notes}`);
        }

        lines.push('');
      }
    }

    if (summary.foundInCorpus > 0) {
      lines.push('## Sources Found in Corpus', '');
      const found = summary.results.filter(r => r.inCorpus);
      for (const result of found) {
        lines.push(`- **${result.citation.author}** (${result.citation.year || 'n.d.'})`);
        if (result.corpusPath) {
          lines.push(`  - Path: \`${result.corpusPath}\``);
        }
        lines.push(`  - Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a source verification layer with default settings
 */
export function createSourceVerificationLayer(options?: {
  corpusDir?: string;
  verbose?: boolean;
}): SourceVerificationLayer {
  return new SourceVerificationLayer(options);
}

/**
 * Get singleton instance
 */
let _instance: SourceVerificationLayer | null = null;

export function getSourceVerificationLayer(): SourceVerificationLayer {
  if (!_instance) {
    _instance = new SourceVerificationLayer();
  }
  return _instance;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Source Verification Layer

Usage:
  npx tsx source-verification-layer.ts --input <file> [options]

Options:
  --input <file>     Input file to verify (markdown, text, or PDF path)
  --corpus <dir>     Corpus directory (default: ./corpus)
  --output <file>    Output report file (default: stdout)
  --json             Output as JSON
  --verbose          Verbose logging
  --help, -h         Show this help
`);
    process.exit(0);
  }

  const inputIndex = args.indexOf('--input');
  const corpusIndex = args.indexOf('--corpus');
  const outputIndex = args.indexOf('--output');
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');

  if (inputIndex === -1 || !args[inputIndex + 1]) {
    console.error('Error: --input file required');
    process.exit(1);
  }

  const inputFile = args[inputIndex + 1];
  const corpusDir = corpusIndex !== -1 ? args[corpusIndex + 1] : undefined;
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : undefined;

  // Read input file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  let content: string;
  if (inputFile.endsWith('.pdf')) {
    console.error('PDF parsing not implemented in this CLI. Use text or markdown input.');
    process.exit(1);
  } else {
    content = fs.readFileSync(inputFile, 'utf-8');
  }

  // Create verifier and run
  const verifier = new SourceVerificationLayer({ corpusDir, verbose });
  const citations = verifier.extractCitations(content);

  if (verbose) {
    console.log(`Extracted ${citations.length} citations`);
  }

  const summary = await verifier.verifyCitationsAgainstCorpus(citations);

  // Output
  if (jsonOutput) {
    const output = JSON.stringify(summary, null, 2);
    if (outputFile) {
      fs.writeFileSync(outputFile, output);
    } else {
      console.log(output);
    }
  } else {
    const report = verifier.generateReport(summary);
    if (outputFile) {
      fs.writeFileSync(outputFile, report);
    } else {
      console.log(report);
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
