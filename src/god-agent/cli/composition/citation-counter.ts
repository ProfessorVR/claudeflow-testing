import { createComponentLogger, type StructuredLogger } from '../../core/observability/logger.js';

export interface CitationStats {
  total: number;
  density: number;  // citations per 1000 words
  sections: SectionStats[];
  meetsThreshold: boolean;
}

export interface SectionStats {
  name: string;
  citations: number;
  wordCount: number;
  density: number;
  meetsThreshold: boolean;
  deficit?: number;
}

/**
 * CitationCounter - Analyzes citation density in academic writing
 *
 * Thresholds scale based on document length:
 * - Short docs (<3000 words): 1+ citation per section
 * - Medium docs (3000-5000 words): 8+ citations per section
 * - Long docs (5000+ words): 15+ citations per section
 *
 * Target: 80%+ citations from Tier 1/2 sources
 */
export class CitationCounter {
  private readonly logger: StructuredLogger = createComponentLogger('CitationCounter');

  /**
   * Get citation threshold based on document word count
   */
  private getMinCitationsPerSection(totalWordCount: number): number {
    if (totalWordCount < 3000) return 1;   // Short documents
    if (totalWordCount < 5000) return 8;   // Medium documents
    return 15;                              // PhD dissertation chapters
  }

  // Author name fragment: handles O'Gorman, al-Farabi, McDowell, etc.
  // Used as building block in citation patterns below.
  // JS note: stored as source strings, compiled into RegExp in constructor.
  private static readonly A = "[A-Z][a-z'\\-]+(?:[A-Z][a-z]+)?"; // single author name token
  private static readonly AU = `${CitationCounter.A}(?:\\s+${CitationCounter.A})*`; // multi-word author

  // Citation patterns - APA, MLA, classical, and philosophical styles
  private readonly CITATION_PATTERNS: RegExp[] = (() => {
    const A = CitationCounter.A;   // single name token  e.g. O'Gorman, McDowell
    const AU = CitationCounter.AU; // full author name    e.g. Multiple Authors
    const PG = "pp?\\.[\\s]?\\d+(?:[-–]\\d+)?"; // page ref  e.g. p. 17, pp. 205-206

    return [
      // ── APA ──

      // APA: (Author, 2024)
      new RegExp(`\\(${AU}(?:\\s+&\\s+${AU})?,\\s+\\d{4}\\)`, 'g'),

      // APA: (Author et al., 2024)
      new RegExp(`\\(${A}\\s+et\\s+al\\.,\\s+\\d{4}\\)`, 'g'),

      // APA: (Author, 2024, p. 123) or (Author, 2024, pp. 123-456)
      new RegExp(`\\(${AU}(?:\\s+&\\s+${AU})?,\\s+\\d{4},\\s+${PG}\\)`, 'g'),

      // APA: (Author, 2024, para. 5)
      new RegExp(`\\(${AU}(?:\\s+&\\s+${AU})?,\\s+\\d{4},\\s+para\\.\\s+\\d+\\)`, 'g'),

      // APA with translated/original year: (Author, 1927/1962, p. 176) or (Author, 1962/2020)
      new RegExp(`\\(${AU}(?:\\s+&\\s+${AU})?,\\s+\\d{4}/\\d{4}(?:,\\s+${PG})?\\)`, 'g'),

      // ── MLA ──

      // MLA: (Author 123) or (Author 123-456)
      new RegExp(`\\(${AU}\\s+\\d+(?:[-–]\\d+)?\\)`, 'g'),

      // MLA: (Author, "Article Title" 123)
      new RegExp(`\\(${AU},\\s+"[^"]+"\\s+\\d+(?:[-–]\\d+)?\\)`, 'g'),

      // MLA with et al.: (Author et al. 123)
      new RegExp(`\\(${A}\\s+et\\s+al\\.\\s+\\d+(?:[-–]\\d+)?\\)`, 'g'),

      // ── Title-page format (Author, *Title*, p. X) ──

      // (Author, *Italicized Title*, p. 123) or (Author, *Title*, pp. 123-456)
      new RegExp(`\\(${AU},\\s+\\*[^*]+\\*,\\s+${PG}\\)`, 'g'),

      // (Author, "Quoted Title," p. 123) or (Author, "Title," pp. 123-456)
      new RegExp(`\\(${AU},\\s+"[^"]+,"\\s+${PG}\\)`, 'g'),

      // (Author, "Quoted Title", p. 123) — variant without trailing comma inside quotes
      new RegExp(`\\(${AU},\\s+"[^"]+",\\s+${PG}\\)`, 'g'),

      // ── Classical/Aristotelian ──

      // Classical: (Aristotle, *Work*, III.3, 428a1-2) or (Heidegger, GA 18, 207)
      /\((?:Aristotle|Heidegger|Plato|Kant|Husserl|Descartes|Aquinas)[,\s]+\*?[\w\s]+\*?[,\s]+[IVXLC]+\.\d+[,\s]+\d+[a-z]?\d*(?:[-–]\d+[a-z]?\d*)?\)/g,

      // Classical with just Bekker/Stephanus: (Aristotle, *Work*, 428a1-2)
      /\((?:Aristotle|Plato)[,\s]+\*?[\w\s]+\*?[,\s]+\d+[a-z]\d*(?:[-–]\d+[a-z]?\d*)?\)/g,

      // Classical inline: (*De Anima*, III.3, 427b27-28)
      /\(\*[\w\s]+\*[,\s]+[IVXLC]+\.\d+[,\s]+\d+[a-z]?\d*(?:[-–]\d+[a-z]?\d*)?\)/g,

      // ── Heidegger section notation ──

      // (Heidegger, 1927/1962, §30) or (Author, 2024, §29)
      new RegExp(`\\(${AU}(?:\\s+&\\s+${AU})?,\\s+\\d{4}(?:/\\d{4})?[,\\s]+§\\d+(?:[-–]\\d+)?\\)`, 'g'),

      // ── MLA-influenced author-prominent (title-based, no year/page) ──

      // (Author, "Quoted Title") — e.g. (Frede, "The Cognitive Role of Phantasia in Aristotle")
      new RegExp(`\\(${AU},\\s+"[^"]+"\\)`, 'g'),

      // (Author, *Italic Title*) — e.g. (Aristotle, *Physics*)
      new RegExp(`\\(${AU},\\s+\\*[^*]+\\*\\)`, 'g'),

      // (Author, *Italic Title*, Book/Section/Chapter ref) — e.g. (Aristotle, *Physics*, Book IV)
      new RegExp(`\\(${AU},\\s+\\*[^*]+\\*,\\s+(?:Book|Section|Chapter|Part)\\s+[IVXLC\\d]+\\)`, 'g'),

      // (Author, *Title*, followed by text) — e.g. (Aristotle, *Physics*, Book IV) already caught above
      // (Author, *Title*, section on ...) — e.g. (Heidegger, *Basic Concepts*, section on Physics III)
      new RegExp(`\\(${AU},\\s+\\*[^*]+\\*,\\s+section\\s+on\\s+[^)]+\\)`, 'gi'),

      // (Author et al., *Title*) — e.g. (Gross et al., *Heidegger and Rhetoric*)
      new RegExp(`\\(${A}\\s+et\\s+al\\.,\\s+\\*[^*]+\\*\\)`, 'g'),

      // (Author, *Title* Bekker, as cited in ...) — e.g. (Aristotle, *De Anima* 429a, as cited in Author, "Title")
      new RegExp(`\\(${AU},\\s+\\*[^*]+\\*\\s+\\d+[a-z]\\d*(?:[-–]\\d+[a-z]?\\d*)?,\\s+as\\s+cited\\s+in\\s+[^)]+\\)`, 'gi'),

      // (Author, "Title," as cited in Author, "Title") — nested MLA citation
      new RegExp(`\\(${AU},\\s+"[^"]+,"?\\s+as\\s+cited\\s+in\\s+${AU},\\s+"[^"]+"\\)`, 'gi'),

      // ── Inline author-prominent verbs ──

      // "as Author observes/argues/notes/states/maintains/suggests/contends"
      /\bas\s+[A-Z][a-z']+(?:\s+(?:et\s+al\.|and\s+[A-Z][a-z']+))?\s+(?:observes?|argues?|notes?|states?|maintains?|suggests?|contends?|claims?|emphasize[sd]?|explains?|demonstrates?|shows?|remarks?|writes?|summarize[sd]?)\b/gi,

      // "Author (Year) argues..." — signal phrase with year
      new RegExp(`${AU}\\s+\\(\\d{4}\\)\\s+(?:observes?|argues?|notes?|states?|maintains?|suggests?|contends?|claims?)`, 'g'),
    ];
  })();

  /**
   * Analyze citation density across all sections
   */
  async analyze(content: string): Promise<CitationStats> {
    this.logger.info('Starting citation analysis', {
      contentLength: content.length
    });

    const sections = this.splitIntoSections(content);

    // Calculate total word count first to determine threshold
    const totalWordCount = sections.reduce((sum, s) => sum + this.countWords(s.content), 0);
    const minCitationsPerSection = this.getMinCitationsPerSection(totalWordCount);

    this.logger.info('Using dynamic threshold', {
      totalWordCount,
      minCitationsPerSection
    });

    const sectionStats: SectionStats[] = [];

    for (const section of sections) {
      const citations = this.countCitations(section.content);
      const wordCount = this.countWords(section.content);
      const density = wordCount > 0 ? (citations / wordCount) * 1000 : 0;

      // Skip very short sections (headers, references)
      const sectionNameLower = section.name.toLowerCase();
      const skipThresholdCheck = wordCount < 50 ||
        sectionNameLower === 'references' ||
        sectionNameLower === 'bibliography';

      const meetsThreshold = skipThresholdCheck || citations >= minCitationsPerSection;
      const deficit = meetsThreshold ? 0 : minCitationsPerSection - citations;

      sectionStats.push({
        name: section.name,
        citations,
        wordCount,
        density,
        meetsThreshold,
        deficit
      });

      if (!meetsThreshold && !skipThresholdCheck) {
        this.logger.warn(`Section "${section.name}" below citation threshold`, {
          citations,
          required: minCitationsPerSection,
          deficit
        });
      }
    }

    const total = sectionStats.reduce((sum, s) => sum + s.citations, 0);
    const totalWords = sectionStats.reduce((sum, s) => sum + s.wordCount, 0);
    const overallDensity = totalWords > 0 ? (total / totalWords) * 1000 : 0;
    const meetsThreshold = sectionStats.every(s => s.meetsThreshold);

    this.logger.info('Citation analysis complete', {
      totalCitations: total,
      overallDensity: overallDensity.toFixed(2),
      sectionsAnalyzed: sectionStats.length,
      sectionsMeetingThreshold: sectionStats.filter(s => s.meetsThreshold).length
    });

    return {
      total,
      density: overallDensity,
      sections: sectionStats,
      meetsThreshold
    };
  }

  /**
   * Count citations in content using APA patterns
   */
  private countCitations(content: string): number {
    const allMatches = new Set<string>();

    for (const pattern of this.CITATION_PATTERNS) {
      const matches = content.match(pattern) || [];
      matches.forEach(m => allMatches.add(m));
    }

    return allMatches.size;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    // Remove citations and markdown formatting for accurate word count
    const cleaned = content
      .replace(/\([A-Z][a-zA-Z'\\-]+.*?(?:\d{4}|pp?\.\s*\d+).*?\)/g, '')  // Remove citations (APA/MLA/title-page)
      .replace(/[#*_`\[\]]/g, '')  // Remove markdown
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();

    return cleaned.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Split content into sections by ## headers
   */
  private splitIntoSections(content: string): Array<{ name: string; content: string }> {
    const sections: Array<{ name: string; content: string }> = [];
    const lines = content.split('\n');

    let currentSection = { name: 'Introduction', content: '' };

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection.content.trim().length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          name: line.replace('## ', '').trim(),
          content: ''
        };
      } else {
        currentSection.content += line + '\n';
      }
    }

    // Add final section
    if (currentSection.content.trim().length > 0) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{ name: 'Document', content }];
  }

  /**
   * Get sections below citation threshold
   */
  async getSectionsBelowThreshold(content: string): Promise<SectionStats[]> {
    const stats = await this.analyze(content);
    return stats.sections.filter(s => !s.meetsThreshold);
  }

  /**
   * Generate citation density report
   */
  async generateReport(content: string): Promise<string> {
    const stats = await this.analyze(content);

    let report = '# Citation Density Report\n\n';
    report += `**Total Citations**: ${stats.total}\n`;
    report += `**Overall Density**: ${stats.density.toFixed(2)} per 1000 words\n`;
    report += `**Meets Threshold**: ${stats.meetsThreshold ? '✅ Yes' : '❌ No'}\n\n`;

    report += '## Section Breakdown\n\n';

    for (const section of stats.sections) {
      const status = section.meetsThreshold ? '✅' : '❌';
      report += `### ${status} ${section.name}\n`;
      report += `- Citations: ${section.citations}`;

      if (section.deficit && section.deficit > 0) {
        report += ` (need ${section.deficit} more)`;
      }

      report += `\n`;
      report += `- Word Count: ${section.wordCount}\n`;
      report += `- Density: ${section.density.toFixed(2)} per 1000 words\n\n`;
    }

    return report;
  }
}
