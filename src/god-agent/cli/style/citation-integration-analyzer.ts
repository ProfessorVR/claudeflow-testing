/**
 * CitationIntegrationAnalyzer - Analyzes how users integrate citations in academic writing
 * Detects patterns for author-prominent vs information-prominent citations,
 * quotation handling, and multi-source synthesis
 */

/**
 * Patterns for introducing citations
 */
export interface CitationIntroductionPatterns {
  /** Author-prominent patterns: "Smith (2020) argues..." */
  authorProminent: string[];
  /** Information-prominent patterns: "Studies show that... (Smith, 2020)" */
  informationProminent: string[];
  /** Quotation introducers: "As Smith notes, '...'" */
  quotationIntroducers: string[];
  /** Ratio of author-prominent to total citations (0-1) */
  authorProminentRatio: number;
}

/**
 * Quotation handling style
 */
export interface QuotationStyle {
  /** Preference for embedded (inline) vs block quotations */
  embeddedVsBlock: 'embedded' | 'block' | 'mixed';
  /** Average length of quoted text in words */
  avgQuoteLength: number;
  /** Uses quote sandwich pattern (intro-quote-analysis) */
  quoteSandwichUsage: boolean;
  /** Average length of post-quote analysis in words */
  postQuoteAnalysisLength: number;
  /** Common verbs used before quotes */
  quoteVerbs: string[];
  /** Confidence score for detection (0-1) */
  confidence: number;
}

/**
 * Multi-source synthesis patterns
 */
export interface SynthesisPatterns {
  /** Integration of multiple sources: "While Smith (2020) and Jones (2019) agree..." */
  multiSourceIntegration: string[];
  /** Contrastive citation patterns: "Unlike Smith, Jones contends..." */
  contrastivePatterns: string[];
  /** Ratio of synthesis citations to serial citations (0-1) */
  synthesisRatio: number;
  /** Common synthesis phrases */
  synthesisConnectors: string[];
  /** Confidence score for detection (0-1) */
  confidence: number;
}

/**
 * Complete citation integration style profile
 */
export interface CitationIntegrationStyle {
  /** How citations are introduced */
  introductionPatterns: CitationIntroductionPatterns;
  /** How quotations are handled */
  quotationStyle: QuotationStyle;
  /** How multiple sources are synthesized */
  synthesisPatterns: SynthesisPatterns;
  /** Detected citation format */
  detectedFormat: 'apa' | 'chicago' | 'mla' | 'harvard' | 'ieee' | 'unknown';
  /** Total citations analyzed */
  citationsAnalyzed: number;
  /** Overall confidence in analysis (0-1) */
  overallConfidence: number;
}

// Author-prominent citation patterns
const AUTHOR_PROMINENT_PATTERNS = [
  // APA style: Author (Year)
  /([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)\s*\(\d{4}\)\s+(argues?|claims?|contends?|suggests?|states?|notes?|observes?|asserts?|maintains?|demonstrates?|shows?|explains?|describes?|proposes?|concludes?|finds?|reports?|indicates?)/gi,
  // MLA style: Author verbs
  /([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)\s+(argues?|claims?|contends?|suggests?|states?|notes?|observes?|asserts?|maintains?|demonstrates?|shows?|explains?|describes?|proposes?|concludes?|finds?|reports?|indicates?)/gi,
  // According to Author
  /according\s+to\s+([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)/gi,
  // As Author notes/argues
  /as\s+([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)\s+(notes?|argues?|observes?|states?|points?\s+out|explains?|suggests?)/gi,
  // For Author
  /for\s+([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)\s*\(\d{4}\)/gi,
  // In Author's view
  /in\s+([A-Z][a-z]+(?:'s)?)\s+(view|analysis|assessment|interpretation|account|terms)/gi,
];

// Information-prominent citation patterns (citation at end of sentence/clause)
const INFO_PROMINENT_PATTERNS = [
  // Parenthetical at end: (Author, Year)
  /[^(]+\(([A-Z][a-z]+(?:\s+(?:and|&|et\s+al\.?)\s+[A-Z][a-z]+)?),?\s*\d{4}\)\.?$/gm,
  // Numbered citations: [1], [1,2]
  /[^[]+\[[\d,\s-]+\]\.?$/gm,
  // Footnote markers: ^1, ¹
  /[^^]+[\^¹²³⁴⁵⁶⁷⁸⁹⁰]+\.?$/gm,
  // Studies/Research show pattern
  /(studies?|research|evidence|findings?|data)\s+(show|indicate|suggest|demonstrate|reveal|confirm)/gi,
];

// Quotation introducer patterns
const QUOTE_INTRODUCER_PATTERNS = [
  /as\s+[A-Z][a-z]+\s+(writes?|states?|notes?|observes?|remarks?|puts?\s+it|explains?),?\s*['"]/gi,
  /in\s+the\s+words\s+of\s+[A-Z][a-z]+,?\s*['"]/gi,
  /[A-Z][a-z]+\s+(writes?|states?|notes?|observes?|remarks?|explains?|argues?)(?:\s+that)?,?\s*['"]/gi,
  /according\s+to\s+[A-Z][a-z]+,?\s*['"]/gi,
  /[A-Z][a-z]+\s*\(\d{4}\)\s+(writes?|states?|notes?|observes?),?\s*['"]/gi,
];

// Multi-source synthesis patterns
const SYNTHESIS_PATTERNS = [
  // Multiple authors agreeing
  /(both|several|many|numerous)\s+(scholars?|researchers?|authors?|studies?)\s+(agree|concur|share)/gi,
  // Explicit comparison
  /while\s+[A-Z][a-z]+\s*(?:\(\d{4}\))?\s+(?:and\s+)?[A-Z][a-z]+/gi,
  // Building on multiple sources
  /(building\s+on|drawing\s+from|synthesizing|combining)\s+(?:the\s+)?(?:work|research|findings?)\s+of/gi,
  // Like/Unlike comparisons
  /(like|unlike|similar\s+to|in\s+contrast\s+to)\s+[A-Z][a-z]+/gi,
];

// Contrastive citation patterns
const CONTRASTIVE_PATTERNS = [
  /unlike\s+[A-Z][a-z]+,?\s+[A-Z][a-z]+\s+(contends?|argues?|suggests?|maintains?)/gi,
  /in\s+contrast\s+to\s+[A-Z][a-z]+,?\s+[A-Z][a-z]+/gi,
  /while\s+[A-Z][a-z]+\s+(argues?|claims?|suggests?),?\s+[A-Z][a-z]+\s+(contends?|maintains?)/gi,
  /[A-Z][a-z]+\s+disagrees?\s+with\s+[A-Z][a-z]+/gi,
  /contrary\s+to\s+[A-Z][a-z]+(?:'s)?\s+(claim|argument|position)/gi,
  /however,?\s+[A-Z][a-z]+\s+(argues?|contends?|suggests?)/gi,
];

// Synthesis connector words
const SYNTHESIS_CONNECTORS = [
  'similarly', 'likewise', 'in the same vein', 'along these lines',
  'in contrast', 'conversely', 'on the other hand', 'by contrast',
  'together', 'collectively', 'taken together', 'as a whole',
  'building on', 'extending', 'complementing', 'in conjunction with',
];

// Common quote verbs
const QUOTE_VERBS = [
  'writes', 'states', 'notes', 'observes', 'remarks', 'argues', 'claims',
  'contends', 'suggests', 'maintains', 'asserts', 'explains', 'describes',
  'points out', 'puts it', 'emphasizes', 'highlights', 'stresses',
];

/**
 * Analyzes citation integration patterns in academic text
 */
export class CitationIntegrationAnalyzer {
  /**
   * Analyze citation integration style from text
   * @param text - Academic text to analyze
   * @returns Citation integration style profile
   */
  analyzeText(text: string): CitationIntegrationStyle {
    if (!text || text.length < 100) {
      return this.createEmptyStyle();
    }

    const introductionPatterns = this.analyzeIntroductionPatterns(text);
    const quotationStyle = this.analyzeQuotationStyle(text);
    const synthesisPatterns = this.analyzeSynthesisPatterns(text);
    const detectedFormat = this.detectCitationStyle(text);

    const citationsAnalyzed = this.countCitations(text);
    const overallConfidence = this.calculateOverallConfidence(
      introductionPatterns,
      quotationStyle,
      synthesisPatterns,
      citationsAnalyzed
    );

    return {
      introductionPatterns,
      quotationStyle,
      synthesisPatterns,
      detectedFormat,
      citationsAnalyzed,
      overallConfidence,
    };
  }

  /**
   * Detect the citation style format used in text
   * @param text - Text to analyze
   * @returns Detected citation format
   */
  detectCitationStyle(text: string): 'apa' | 'chicago' | 'mla' | 'harvard' | 'ieee' | 'unknown' {
    const patterns = {
      // APA: (Author, Year) or Author (Year)
      apa: /\([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?,\s*\d{4}[a-z]?\)|[A-Z][a-z]+\s*\(\d{4}[a-z]?\)/g,
      // Chicago: Footnote numbers or (Author Year)
      chicago: /\^\d+|\[\d+\]|[A-Z][a-z]+\s+\d{4},\s*\d+/g,
      // MLA: (Author page)
      mla: /\([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?\s+\d{1,4}\)/g,
      // Harvard: Similar to APA but with different punctuation
      harvard: /\([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?\s+\d{4}(?::\s*\d+)?\)/g,
      // IEEE: [number]
      ieee: /\[\d+\](?:\s*,\s*\[\d+\])*/g,
    };

    const counts: Record<string, number> = {};
    for (const [style, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      counts[style] = matches ? matches.length : 0;
    }

    // Find the style with the most matches
    type CitationFormat = 'apa' | 'chicago' | 'mla' | 'harvard' | 'ieee' | 'unknown';
    let maxStyle: CitationFormat = 'unknown';
    let maxCount = 2; // Minimum threshold

    for (const [style, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxStyle = style as CitationFormat;
      }
    }

    // APA and Harvard are similar, differentiate by common patterns
    // Harvard detection might catch APA citations, so if they're close, prefer APA
    if (maxStyle === 'harvard' as CitationFormat) {
      const apaCount = counts['apa'] ?? 0;
      const harvardCount = counts['harvard'] ?? 0;
      if (apaCount > harvardCount * 0.8) {
        maxStyle = 'apa';
      }
    }

    return maxStyle;
  }

  /**
   * Merge multiple citation style analyses
   * @param styles - Array of citation styles to merge
   * @returns Merged citation style
   */
  mergeStyles(styles: CitationIntegrationStyle[]): CitationIntegrationStyle {
    if (styles.length === 0) {
      return this.createEmptyStyle();
    }

    if (styles.length === 1) {
      return styles[0];
    }

    return {
      introductionPatterns: this.mergeIntroductionPatterns(
        styles.map(s => s.introductionPatterns)
      ),
      quotationStyle: this.mergeQuotationStyles(
        styles.map(s => s.quotationStyle)
      ),
      synthesisPatterns: this.mergeSynthesisPatterns(
        styles.map(s => s.synthesisPatterns)
      ),
      detectedFormat: this.mostCommonFormat(styles.map(s => s.detectedFormat)),
      citationsAnalyzed: styles.reduce((sum, s) => sum + s.citationsAnalyzed, 0),
      overallConfidence: this.average(styles.map(s => s.overallConfidence)),
    };
  }

  /**
   * Generate a prompt section for citation integration style
   * @param style - Citation integration style
   * @returns Formatted prompt string
   */
  generatePromptSection(style: CitationIntegrationStyle): string {
    const parts: string[] = [];

    parts.push('Citation Integration Style:');

    // Citation format
    if (style.detectedFormat !== 'unknown') {
      parts.push(`  - Citation format: ${style.detectedFormat.toUpperCase()}`);
    }

    // Introduction patterns
    if (style.introductionPatterns.authorProminentRatio > 0.6) {
      parts.push('  - Preference: Author-prominent citations (e.g., "Smith (2020) argues...")');
      if (style.introductionPatterns.authorProminent.length > 0) {
        parts.push(`    Examples: ${style.introductionPatterns.authorProminent.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    } else if (style.introductionPatterns.authorProminentRatio < 0.4) {
      parts.push('  - Preference: Information-prominent citations (e.g., "Studies show... (Smith, 2020)")');
      if (style.introductionPatterns.informationProminent.length > 0) {
        parts.push(`    Examples: ${style.introductionPatterns.informationProminent.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    } else {
      parts.push('  - Uses mixed citation integration (both author-prominent and information-prominent)');
    }

    // Quotation style
    if (style.quotationStyle.confidence > 0.3) {
      parts.push(`  - Quotation style: ${style.quotationStyle.embeddedVsBlock}`);
      if (style.quotationStyle.quoteSandwichUsage) {
        parts.push('    Uses quote sandwich pattern (introduction -> quote -> analysis)');
      }
      if (style.quotationStyle.avgQuoteLength > 0) {
        parts.push(`    Average quote length: ~${Math.round(style.quotationStyle.avgQuoteLength)} words`);
      }
      if (style.quotationStyle.quoteVerbs.length > 0) {
        parts.push(`    Common quote verbs: ${style.quotationStyle.quoteVerbs.slice(0, 5).join(', ')}`);
      }
    }

    // Synthesis patterns
    if (style.synthesisPatterns.confidence > 0.3) {
      if (style.synthesisPatterns.synthesisRatio > 0.3) {
        parts.push('  - Frequently synthesizes multiple sources together');
        if (style.synthesisPatterns.multiSourceIntegration.length > 0) {
          parts.push(`    Examples: ${style.synthesisPatterns.multiSourceIntegration.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
        }
      }
      if (style.synthesisPatterns.contrastivePatterns.length > 0) {
        parts.push(`  - Uses contrastive citations: ${style.synthesisPatterns.contrastivePatterns.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (style.synthesisPatterns.synthesisConnectors.length > 0) {
        parts.push(`  - Synthesis connectors: ${style.synthesisPatterns.synthesisConnectors.slice(0, 5).join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  // Private analysis methods

  private analyzeIntroductionPatterns(text: string): CitationIntroductionPatterns {
    const authorProminent: string[] = [];
    const informationProminent: string[] = [];
    const quotationIntroducers: string[] = [];

    // Extract author-prominent citations
    for (const pattern of AUTHOR_PROMINENT_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        const extracted = this.cleanMatch(match[0]);
        if (!authorProminent.includes(extracted) && extracted.length > 5) {
          authorProminent.push(extracted);
        }
      }
    }

    // Extract information-prominent citations
    const sentences = this.extractSentences(text);
    for (const sentence of sentences) {
      for (const pattern of INFO_PROMINENT_PATTERNS) {
        if (pattern.test(sentence)) {
          const intro = sentence.slice(0, 50).trim();
          if (!informationProminent.includes(intro) && intro.length > 10) {
            informationProminent.push(intro);
          }
        }
      }
    }

    // Extract quotation introducers
    for (const pattern of QUOTE_INTRODUCER_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        const extracted = this.cleanMatch(match[0].replace(/['"]/g, ''));
        if (!quotationIntroducers.includes(extracted)) {
          quotationIntroducers.push(extracted);
        }
      }
    }

    const total = authorProminent.length + informationProminent.length;
    const authorProminentRatio = total > 0 ? authorProminent.length / total : 0.5;

    return {
      authorProminent: authorProminent.slice(0, 15),
      informationProminent: informationProminent.slice(0, 15),
      quotationIntroducers: quotationIntroducers.slice(0, 10),
      authorProminentRatio,
    };
  }

  private analyzeQuotationStyle(text: string): QuotationStyle {
    // Find all quotations
    const inlineQuotes = text.match(/["'][^"']{10,100}["']/g) || [];
    const blockQuotes = text.match(/\n\s{4,}["']?[^"'\n]{50,}["']?\n/g) || [];

    const totalQuotes = inlineQuotes.length + blockQuotes.length;

    let embeddedVsBlock: 'embedded' | 'block' | 'mixed' = 'mixed';
    if (totalQuotes > 0) {
      const blockRatio = blockQuotes.length / totalQuotes;
      if (blockRatio > 0.6) {
        embeddedVsBlock = 'block';
      } else if (blockRatio < 0.3) {
        embeddedVsBlock = 'embedded';
      }
    }

    // Calculate average quote length
    const allQuotes = [...inlineQuotes, ...blockQuotes];
    const avgQuoteLength = allQuotes.length > 0
      ? allQuotes.reduce((sum, q) => sum + q.split(/\s+/).length, 0) / allQuotes.length
      : 0;

    // Detect quote sandwich usage (intro-quote-analysis pattern)
    let quoteSandwichCount = 0;
    const quotePattern = /[A-Z][a-z]+\s+(?:writes?|states?|notes?|argues?)[^"']*["'][^"']+["'][^.]*\./g;
    const sandwiches = text.match(quotePattern) || [];
    quoteSandwichCount = sandwiches.length;

    const quoteSandwichUsage = totalQuotes > 0 && quoteSandwichCount / totalQuotes > 0.3;

    // Calculate post-quote analysis length
    const postQuoteMatches: string[] = text.match(/["'][^"']+["']\s*([^.]+\.)/g) || [];
    const postQuoteAnalysisLength = postQuoteMatches.length > 0
      ? postQuoteMatches.reduce((sum, m) => {
          const afterQuote = m.split(/["']/g).pop() || '';
          return sum + afterQuote.split(/\s+/).length;
        }, 0) / postQuoteMatches.length
      : 0;

    // Extract common quote verbs
    const usedVerbs: string[] = [];
    for (const verb of QUOTE_VERBS) {
      const verbPattern = new RegExp(`\\b${verb}\\b`, 'gi');
      if (verbPattern.test(text)) {
        usedVerbs.push(verb);
      }
    }

    const confidence = totalQuotes > 2 ? Math.min(1, totalQuotes / 10) : 0;

    return {
      embeddedVsBlock,
      avgQuoteLength,
      quoteSandwichUsage,
      postQuoteAnalysisLength,
      quoteVerbs: usedVerbs.slice(0, 10),
      confidence,
    };
  }

  private analyzeSynthesisPatterns(text: string): SynthesisPatterns {
    const multiSourceIntegration: string[] = [];
    const contrastivePatterns: string[] = [];

    // Extract multi-source synthesis patterns
    for (const pattern of SYNTHESIS_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        const extracted = this.cleanMatch(match[0]);
        if (!multiSourceIntegration.includes(extracted)) {
          multiSourceIntegration.push(extracted);
        }
      }
    }

    // Extract contrastive patterns
    for (const pattern of CONTRASTIVE_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
      for (const match of matches) {
        const extracted = this.cleanMatch(match[0]);
        if (!contrastivePatterns.includes(extracted)) {
          contrastivePatterns.push(extracted);
        }
      }
    }

    // Extract used synthesis connectors
    const usedConnectors: string[] = [];
    for (const connector of SYNTHESIS_CONNECTORS) {
      const connectorPattern = new RegExp(`\\b${connector}\\b`, 'gi');
      if (connectorPattern.test(text)) {
        usedConnectors.push(connector);
      }
    }

    // Calculate synthesis ratio
    const totalCitations = this.countCitations(text);
    const synthesisCount = multiSourceIntegration.length + contrastivePatterns.length;
    const synthesisRatio = totalCitations > 0 ? Math.min(1, synthesisCount / (totalCitations * 0.3)) : 0;

    const confidence = synthesisCount > 0 ? Math.min(1, synthesisCount / 5) : 0;

    return {
      multiSourceIntegration: multiSourceIntegration.slice(0, 10),
      contrastivePatterns: contrastivePatterns.slice(0, 10),
      synthesisRatio,
      synthesisConnectors: usedConnectors.slice(0, 10),
      confidence,
    };
  }

  private countCitations(text: string): number {
    // Count various citation formats
    const apaPattern = /\([A-Z][a-z]+(?:\s+(?:&|and|et\s+al\.?)\s+[A-Z][a-z]+)?,?\s*\d{4}\)/g;
    const numberedPattern = /\[\d+(?:,\s*\d+)*\]/g;
    const footnotePattern = /\^\d+|[\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079\u2070]/g;

    const apaCitations = (text.match(apaPattern) || []).length;
    const numberedCitations = (text.match(numberedPattern) || []).length;
    const footnoteCitations = (text.match(footnotePattern) || []).length;

    return apaCitations + numberedCitations + footnoteCitations;
  }

  // Helper methods

  private extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 20);
  }

  private cleanMatch(match: string): string {
    return match
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private calculateOverallConfidence(
    intro: CitationIntroductionPatterns,
    quote: QuotationStyle,
    synthesis: SynthesisPatterns,
    citationCount: number
  ): number {
    if (citationCount < 3) return 0;

    const introScore = (intro.authorProminent.length + intro.informationProminent.length) > 3 ? 0.3 : 0.1;
    const quoteScore = quote.confidence * 0.3;
    const synthScore = synthesis.confidence * 0.3;
    const countScore = Math.min(0.1, citationCount / 100);

    return Math.min(1, introScore + quoteScore + synthScore + countScore);
  }

  private mergeIntroductionPatterns(patterns: CitationIntroductionPatterns[]): CitationIntroductionPatterns {
    return {
      authorProminent: this.mergeArrays(patterns.map(p => p.authorProminent), 20),
      informationProminent: this.mergeArrays(patterns.map(p => p.informationProminent), 20),
      quotationIntroducers: this.mergeArrays(patterns.map(p => p.quotationIntroducers), 15),
      authorProminentRatio: this.average(patterns.map(p => p.authorProminentRatio)),
    };
  }

  private mergeQuotationStyles(styles: QuotationStyle[]): QuotationStyle {
    const embedded = styles.filter(s => s.embeddedVsBlock === 'embedded').length;
    const block = styles.filter(s => s.embeddedVsBlock === 'block').length;

    let embeddedVsBlock: 'embedded' | 'block' | 'mixed' = 'mixed';
    if (embedded > block * 2) {
      embeddedVsBlock = 'embedded';
    } else if (block > embedded * 2) {
      embeddedVsBlock = 'block';
    }

    return {
      embeddedVsBlock,
      avgQuoteLength: this.average(styles.map(s => s.avgQuoteLength)),
      quoteSandwichUsage: styles.filter(s => s.quoteSandwichUsage).length > styles.length / 2,
      postQuoteAnalysisLength: this.average(styles.map(s => s.postQuoteAnalysisLength)),
      quoteVerbs: this.mergeArrays(styles.map(s => s.quoteVerbs), 15),
      confidence: this.average(styles.map(s => s.confidence)),
    };
  }

  private mergeSynthesisPatterns(patterns: SynthesisPatterns[]): SynthesisPatterns {
    return {
      multiSourceIntegration: this.mergeArrays(patterns.map(p => p.multiSourceIntegration), 15),
      contrastivePatterns: this.mergeArrays(patterns.map(p => p.contrastivePatterns), 15),
      synthesisRatio: this.average(patterns.map(p => p.synthesisRatio)),
      synthesisConnectors: this.mergeArrays(patterns.map(p => p.synthesisConnectors), 15),
      confidence: this.average(patterns.map(p => p.confidence)),
    };
  }

  private mergeArrays(arrays: string[][], limit: number): string[] {
    const counts = new Map<string, number>();
    for (const arr of arrays) {
      for (const item of arr) {
        counts.set(item, (counts.get(item) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private mostCommonFormat(formats: Array<'apa' | 'chicago' | 'mla' | 'harvard' | 'ieee' | 'unknown'>): 'apa' | 'chicago' | 'mla' | 'harvard' | 'ieee' | 'unknown' {
    const counts = new Map<string, number>();
    for (const format of formats) {
      counts.set(format, (counts.get(format) || 0) + 1);
    }

    let maxFormat = 'unknown';
    let maxCount = 0;
    for (const [format, count] of counts) {
      if (count > maxCount && format !== 'unknown') {
        maxCount = count;
        maxFormat = format;
      }
    }

    return maxFormat as typeof formats[0];
  }

  private createEmptyStyle(): CitationIntegrationStyle {
    return {
      introductionPatterns: {
        authorProminent: [],
        informationProminent: [],
        quotationIntroducers: [],
        authorProminentRatio: 0.5,
      },
      quotationStyle: {
        embeddedVsBlock: 'mixed',
        avgQuoteLength: 0,
        quoteSandwichUsage: false,
        postQuoteAnalysisLength: 0,
        quoteVerbs: [],
        confidence: 0,
      },
      synthesisPatterns: {
        multiSourceIntegration: [],
        contrastivePatterns: [],
        synthesisRatio: 0,
        synthesisConnectors: [],
        confidence: 0,
      },
      detectedFormat: 'unknown',
      citationsAnalyzed: 0,
      overallConfidence: 0,
    };
  }
}
