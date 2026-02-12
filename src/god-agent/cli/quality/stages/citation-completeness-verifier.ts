/**
 * CitationCompletenessVerifier - Quality stage for evaluating citation quality
 *
 * Checks for:
 * - Claims that need citations but don't have them
 * - Citation format consistency
 * - Reference list completeness
 * - Quote accuracy markers
 * - Over-reliance on single sources
 * - Corpus-based citation verification (connects to rhetorical_ontology)
 *
 * Uses pattern matching and heuristics - no external AI calls.
 * Corpus integration added per phd-pipeline-improvement-proposal.md
 */

import {
  BaseQualityStage,
  type QualityStageResult,
  type QualityIssue,
  type QualityEvaluationContext,
  countIssuesBySeverity,
} from '../quality-stage.js';
import {
  CorpusCitationConnector,
  getCorpusCitationConnector,
  type CorpusSuggestion,
  type CitationVerificationResult,
} from '../corpus-citation-connector.js';
import { CitationRefiner } from '../helpers/citation-refiner.js';
import {
  SourceVerificationLayer,
  getSourceVerificationLayer,
  type ExtractedCitation,
  type VerificationSummary,
  type AcquisitionSuggestion,
} from '../source-verification-layer.js';

// ============================================================================
// Pattern Constants
// ============================================================================

// Patterns indicating statements that typically need citations
const NEEDS_CITATION_PATTERNS = [
  // Statistical claims
  /\b\d+(\.\d+)?%?\s+(of|percent)\b/i,
  /\b(statistics|data|survey|poll|study|research)\s+(shows?|indicates?|reveals?|suggests?|found)\b/i,
  /\b(according\s+to)\s+(recent\s+)?(research|studies|data)\b/i,
  /\b(millions?|billions?|thousands?)\s+of\s+(people|users|consumers|participants)\b/i,

  // Historical claims
  /\b(in\s+\d{4}|during\s+the\s+\d{4}s?)\b/i,
  /\b(historically|traditionally|originally)\b/i,
  /\b(was\s+(first\s+)?(discovered|invented|developed|introduced|proposed)\s+(by|in))\b/i,

  // Attribution claims
  /\b(\w+)\s+(argued?|claimed?|stated?|proposed?|suggested?|contended?|maintained?|asserted?)\s+that\b/i,
  /\b(as\s+)?\w+\s+(et\s+al\.?\s+)?(noted?|observed?|pointed\s+out|showed?|demonstrated?)\b/i,
  /\b(the\s+)?(theory|concept|model|framework|approach|method)\s+(developed|proposed|introduced)\s+by\b/i,

  // Factual claims requiring verification
  /\b(is\s+(known|believed|considered|regarded|understood)\s+(to\s+be|as))\b/i,
  /\b(has\s+been\s+(shown|demonstrated|proven|established)\s+(to|that))\b/i,
  /\b(evidence\s+(suggests|indicates|shows)\s+that)\b/i,
  /\b(the\s+(standard|accepted|common|dominant)\s+(view|understanding|interpretation))\b/i,

  // Definitions from external sources
  /\b(is\s+defined\s+as)\b/i,
  /\b(refers?\s+to)\b/i,
  /\b(the\s+(term|concept|notion|idea)\s+of)\b/i,
];

// Patterns indicating claims that likely don't need citations (author's own analysis)
const NO_CITATION_NEEDED_PATTERNS = [
  /\b(i\s+(argue|contend|propose|suggest|believe|think|maintain|claim)\s+that)\b/i,
  /\b(my\s+(argument|thesis|claim|position|view)\s+is\s+that)\b/i,
  /\b(this\s+(paper|dissertation|thesis|study|research)\s+(argues?|proposes?|contends?|suggests?))\b/i,
  /\b(in\s+this\s+(section|chapter|analysis))\b/i,
  /\b(as\s+(i|we)\s+(have\s+)?(shown|demonstrated|argued|discussed))\b/i,
  /\b(the\s+(preceding|following|above|below)\s+(analysis|discussion|argument))\b/i,
];

// Citation format patterns
const CITATION_PATTERNS = {
  // APA style: (Author, 2020) or Author (2020)
  // Extended to handle: (Author, 1962/2020) for translated works, (Author, 2020, p. 42), (Author, 2020, pp. 42-50)
  apaParenthetical: /\([\w\s,&]+,?\s*\d{4}(?:\/\d{4})?[a-z]?(?:,\s*p+\.\s*\d+(?:[-–]\d+)?)?\)/g,
  apaInText: /\b[\w]+(?:\s+(?:and|&)\s+[\w]+)*\s*\(\d{4}(?:\/\d{4})?[a-z]?\)/g,

  // Harvard style: (Author 2020) or Author (2020)
  harvardParenthetical: /\([\w\s&]+\s+\d{4}[a-z]?\)/g,

  // MLA style: (Author 123) - page number
  // Updated to support: apostrophes in names, markdown italics, Bekker numbers (403a), multiple pages
  mlaParenthetical: /\([\w\s']+\s+\d+[a-z]?(?:[-–,]\s*\d+[a-z]?)?\)/g,

  // MLA style: (Author, "Article Title" 123) or (Author, "Title" 123-456)
  mlaArticleTitle: /\([A-Z][\w'\-]+(?:\s+[A-Z][\w'\-]+)*,\s+"[^"]+"\s+\d+(?:[-–]\d+)?\)/g,

  // Classical/Aristotelian citations: (Aristotle, *Work* 123a), (Aristotle, De Anima 429a1), (Heidegger, GA 18 207)
  classicalCitation: /\((?:Aristotle|Heidegger|Plato)[,\s]+[\w\s*]+\s+\d+[a-z]?\d*(?:[-–]\d+[a-z]?\d*)?\)/g,

  // Title-page format: (Author, *Italicized Title*, p. 123) or (Author, *Title*, pp. 123-456)
  titlePageItalic: /\([A-Z][\w'\-]+(?:\s+[A-Z][\w'\-]+)*,\s+\*[^*]+\*,\s+pp?\.\s*\d+(?:[-–]\d+)?\)/g,

  // Title-page format: (Author, "Quoted Title," p. 123) or (Author, "Title," pp. 123-456)
  titlePageQuoted: /\([A-Z][\w'\-]+(?:\s+[A-Z][\w'\-]+)*,\s+"[^"]+,?"\s*,?\s*pp?\.\s*\d+(?:[-–]\d+)?\)/g,

  // OED and dictionary citations: (OED, *entry, n.*)
  dictionaryCitation: /\(OED[,\s]+\*?[\w\s,\.]+\*?\)/g,

  // Chicago footnote style: superscript numbers
  chicagoFootnote: /[.!?]["']?\d+|\[\d+\]/g,

  // IEEE style: [1], [2-5]
  ieeeStyle: /\[\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*\]/g,

  // Generic year reference
  yearReference: /\(\d{4}[a-z]?\)/g,

  // et al. pattern
  etAl: /[\w]+\s+et\s+al\.?\s*\(?\d{4}\)?/gi,

  // Generic parenthetical with author name and number (fallback)
  genericAuthorPage: /\([A-Z][\w']+(?:\s+\d+[a-z]?)+\)/g,

  // Quoted in / cited in pattern: (Author X; qtd. in Author Y)
  quotedIn: /\([^)]+;\s*qtd\.?\s*in\s+[A-Z][\w']+\s+\d+\)/g,

  // Direct quotes (should have citations)
  // Minimum 50 chars and must start with capital letter to indicate actual sentence quotations
  // This avoids matching spurious text between unrelated quote marks
  directQuote: /"[A-Z][^"]{48,}"/g,
};

// Reference section patterns
const REFERENCE_SECTION_PATTERNS = [
  /^#+\s*references?\s*$/im,
  /^#+\s*bibliography\s*$/im,
  /^#+\s*works?\s+cited\s*$/im,
  /^#+\s*sources?\s*$/im,
  /^references?\s*$/im,
];

// ============================================================================
// Citation Types
// ============================================================================

interface DetectedCitation {
  text: string;
  format: string;
  paragraphIndex: number;
  position: number;
  year?: number;
  authors?: string;
}

interface CitationStats {
  totalCitations: number;
  citationsByFormat: Record<string, number>;
  citationsByParagraph: number[];
  uniqueSources: Set<string>;
  yearRange: { min: number; max: number };
}

// ============================================================================
// CitationCompletenessVerifier Class
// ============================================================================

/**
 * Quality stage that evaluates citation completeness and consistency
 */
export class CitationCompletenessVerifier extends BaseQualityStage {
  readonly name = 'citation-completeness';
  readonly weight = 0.17; // Adjusted for 7-stage gauntlet
  readonly threshold = 0.80;

  /** Corpus connector for citation verification against rhetorical_ontology */
  private corpusConnector: CorpusCitationConnector | null = null;

  /** Source verification layer for checking citations against corpus */
  private sourceVerifier: SourceVerificationLayer | null = null;

  /** Whether corpus verification is enabled */
  private corpusVerificationEnabled = true;

  /** Whether source verification is enabled (checks if sources exist in corpus) */
  private sourceVerificationEnabled = false;

  /** Last source verification summary (for reporting) */
  private lastVerificationSummary: VerificationSummary | null = null;

  /**
   * Enable or disable corpus-based verification
   */
  setCorpusVerification(enabled: boolean): void {
    this.corpusVerificationEnabled = enabled;
  }

  /**
   * Enable or disable source verification (checks if sources exist in corpus)
   */
  setSourceVerification(enabled: boolean): void {
    this.sourceVerificationEnabled = enabled;
  }

  /**
   * Get the last source verification summary
   */
  getLastVerificationSummary(): VerificationSummary | null {
    return this.lastVerificationSummary;
  }

  /**
   * Get the corpus connector (lazy initialization)
   */
  private getCorpusConnector(): CorpusCitationConnector {
    if (!this.corpusConnector) {
      this.corpusConnector = getCorpusCitationConnector();
    }
    return this.corpusConnector;
  }

  /**
   * Get the source verifier (lazy initialization)
   */
  private getSourceVerifier(): SourceVerificationLayer {
    if (!this.sourceVerifier) {
      this.sourceVerifier = getSourceVerificationLayer();
    }
    return this.sourceVerifier;
  }

  /**
   * Evaluate chapter text for citation completeness
   */
  async evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const startTime = Date.now();
    const issues: QualityIssue[] = [];
    const metrics: Record<string, number> = {};
    const suggestions: string[] = [];

    // Extract paragraphs and citations
    const paragraphs = this.extractParagraphs(chapterText);
    const citations = this.extractAllCitations(chapterText, paragraphs);
    const stats = this.calculateCitationStats(citations, paragraphs);

    metrics['totalCitations'] = stats.totalCitations;
    metrics['uniqueSources'] = stats.uniqueSources.size;
    metrics['paragraphCount'] = paragraphs.length;
    metrics['citationsPerParagraph'] = paragraphs.length > 0
      ? stats.totalCitations / paragraphs.length
      : 0;

    // Phase 2: Initialize citation refiner
    const refiner = new CitationRefiner({
      enableCitationDatabase: false,
      strictMode: false,
    });

    // Phase 2: Pre-analyze for term introductions
    for (let i = 0; i < paragraphs.length; i++) {
      refiner.analyzeTermIntroductions(paragraphs[i], i, chapterId);
    }

    // Check for claims needing citations
    const rawCitationIssues = this.findMissingCitations(
      paragraphs,
      citations,
      chapterId
    );

    // Phase 2: Refine citation issues to filter out author's terms
    const refinedCitationIssues = rawCitationIssues.filter(issue => {
      if (!issue.contextSnippet) return true;

      const recommendation = refiner.refineIssue(
        { contextSnippet: issue.contextSnippet, description: issue.description },
        {
          chapterId,
          paragraphIndex: issue.location.paragraphIndex || 0,
          fullParagraph: paragraphs[issue.location.paragraphIndex || 0] || '',
        }
      );

      return recommendation?.shouldFlag ?? true;
    });

    issues.push(...refinedCitationIssues);

    // Phase 2: Track refiner metrics
    const refinerStats = refiner.getStats();
    metrics['authorTermsDetected'] = refinerStats.authorTermsCount;
    metrics['citationIssuesFiltered'] = rawCitationIssues.length - refinedCitationIssues.length;

    // Check citation format consistency
    const formatIssues = this.checkFormatConsistency(
      citations,
      stats,
      chapterId
    );
    issues.push(...formatIssues);

    // Check for over-reliance on single sources
    const overRelianceIssues = this.checkSourceDiversity(
      citations,
      stats,
      chapterId
    );
    issues.push(...overRelianceIssues);

    // Check direct quotes have citations
    const quoteIssues = this.checkQuoteCitations(
      paragraphs,
      citations,
      chapterId
    );
    issues.push(...quoteIssues);

    // Check citation coverage across paragraphs
    const coverageIssues = this.checkCitationCoverage(
      paragraphs,
      stats,
      chapterId
    );
    issues.push(...coverageIssues);

    // Check for citation age (very old or future dates)
    const ageIssues = this.checkCitationAge(citations, chapterId);
    issues.push(...ageIssues);

    // Calculate format distribution metrics
    for (const [format, count] of Object.entries(stats.citationsByFormat)) {
      metrics[`format_${format}`] = count;
    }

    // Generate suggestions
    if (metrics['citationsPerParagraph'] < 0.5) {
      suggestions.push(
        'Consider adding more citations to support your claims. ' +
        'Academic writing typically has 1-2 citations per paragraph on average.'
      );
    }

    if (stats.uniqueSources.size < 5) {
      suggestions.push(
        'Expand your source base. Drawing from more diverse sources ' +
        'strengthens your arguments and demonstrates thorough research.'
      );
    }

    const dominantFormat = this.findDominantFormat(stats);
    if (dominantFormat && stats.citationsByFormat[dominantFormat] < stats.totalCitations * 0.7) {
      suggestions.push(
        `Standardize citation format. Most citations use ${dominantFormat} style, ` +
        'but there are inconsistencies. Use a consistent format throughout.'
      );
    }

    // Corpus-based source suggestions (async, non-blocking)
    if (this.corpusVerificationEnabled && refinedCitationIssues.length > 0) {
      try {
        const corpusSuggestions = await this.suggestSourcesFromCorpus(
          chapterText,
          citations.map(c => c.text)
        );

        if (corpusSuggestions.length > 0) {
          metrics['corpusSuggestionsFound'] = corpusSuggestions.length;
          suggestions.push(
            `Found ${corpusSuggestions.length} relevant sources in rhetorical_ontology corpus: ` +
            corpusSuggestions
              .slice(0, 3)
              .map(s => `${s.author} (${s.year || 'n.d.'})`)
              .join(', ')
          );
        }
      } catch {
        // Corpus verification is optional - don't fail evaluation
        metrics['corpusVerificationSkipped'] = 1;
      }
    }

    // Source verification: check if cited sources exist in corpus
    if (this.sourceVerificationEnabled && stats.totalCitations > 0) {
      try {
        const sourceVerifier = this.getSourceVerifier();
        const extractedCitations = sourceVerifier.extractCitations(chapterText);
        const verificationSummary = await sourceVerifier.verifyCitationsAgainstCorpus(extractedCitations);

        // Store for reporting
        this.lastVerificationSummary = verificationSummary;

        // Track metrics
        metrics['sourcesVerified'] = verificationSummary.totalCitations;
        metrics['sourcesInCorpus'] = verificationSummary.foundInCorpus;
        metrics['sourcesMissing'] = verificationSummary.missingFromCorpus;

        // Add issues for missing sources
        if (verificationSummary.missingFromCorpus > 0) {
          let issueIndex = 0;
          for (const missingSource of verificationSummary.missingSources) {
            const severity = missingSource.type === 'open_access' ? 'minor' : 'major';
            issues.push({
              id: this.generateIssueId('missing-source', issueIndex++),
              type: 'citation',
              severity,
              location: { chapterId },
              description: `Source not in corpus: ${missingSource.author} - ${missingSource.title}`,
              suggestion: missingSource.type === 'open_access'
                ? `Open access available: ${missingSource.urls.openAccess?.[0] || 'search online'}`
                : `Paywalled source - purchase or library access needed`,
              autoFixable: false,
              contextSnippet: missingSource.notes || undefined,
            });
          }

          // Add summary suggestion
          suggestions.push(
            `${verificationSummary.missingFromCorpus} cited sources are missing from corpus. ` +
            `${verificationSummary.missingSources.filter(s => s.type === 'open_access').length} are open access and can be downloaded.`
          );
        }
      } catch (error) {
        // Source verification is optional - don't fail evaluation
        metrics['sourceVerificationSkipped'] = 1;
      }
    }

    // Calculate score
    const { critical, major, minor } = countIssuesBySeverity(issues);
    const totalElements = paragraphs.length + stats.totalCitations;
    const score = this.calculateScore(critical, major, minor, totalElements);

    const passed = score >= this.threshold;

    return {
      stageName: this.name,
      passed,
      score,
      issues,
      metrics,
      suggestions,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Check if an issue can be auto-fixed
   */
  canAutoFix(issue: QualityIssue): boolean {
    // Format inconsistencies are potentially auto-fixable
    return issue.autoFixable && issue.type === 'citation';
  }

  /**
   * Auto-fix citation format issues
   */
  autoFix(text: string, issue: QualityIssue): string {
    if (!this.canAutoFix(issue)) {
      return text;
    }

    // Citation format standardization would need more context
    // to safely auto-fix, so we return unchanged for now
    return text;
  }

  // ============================================================================
  // Private Analysis Methods
  // ============================================================================

  /**
   * Extract all citations from text
   */
  private extractAllCitations(
    text: string,
    paragraphs: string[]
  ): DetectedCitation[] {
    const citations: DetectedCitation[] = [];

    // Find position of each paragraph in original text
    const paragraphPositions: number[] = [];
    let searchPos = 0;
    for (const para of paragraphs) {
      const pos = text.indexOf(para, searchPos);
      paragraphPositions.push(pos);
      searchPos = pos + para.length;
    }

    // Check each citation pattern
    for (const [format, pattern] of Object.entries(CITATION_PATTERNS)) {
      if (format === 'directQuote') continue; // Skip quote pattern

      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const position = match.index;

        // Find which paragraph this citation is in
        let paragraphIndex = -1;
        for (let i = paragraphPositions.length - 1; i >= 0; i--) {
          if (position >= paragraphPositions[i]) {
            paragraphIndex = i;
            break;
          }
        }

        // Extract year if present
        const yearMatch = match[0].match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

        // Extract author if present
        const authorMatch = match[0].match(/^([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)*)/);
        const authors = authorMatch ? authorMatch[1] : undefined;

        citations.push({
          text: match[0],
          format,
          paragraphIndex,
          position,
          year,
          authors,
        });
      }
    }

    return citations;
  }

  /**
   * Calculate statistics about citations
   */
  private calculateCitationStats(
    citations: DetectedCitation[],
    paragraphs: string[]
  ): CitationStats {
    const citationsByFormat: Record<string, number> = {};
    const citationsByParagraph: number[] = new Array(paragraphs.length).fill(0);
    const uniqueSources = new Set<string>();
    let minYear = Infinity;
    let maxYear = -Infinity;

    for (const citation of citations) {
      // Count by format
      citationsByFormat[citation.format] = (citationsByFormat[citation.format] || 0) + 1;

      // Count by paragraph
      if (citation.paragraphIndex >= 0 && citation.paragraphIndex < paragraphs.length) {
        citationsByParagraph[citation.paragraphIndex]++;
      }

      // Track unique sources (by text)
      uniqueSources.add(citation.text.toLowerCase());

      // Track year range
      if (citation.year) {
        minYear = Math.min(minYear, citation.year);
        maxYear = Math.max(maxYear, citation.year);
      }
    }

    return {
      totalCitations: citations.length,
      citationsByFormat,
      citationsByParagraph,
      uniqueSources,
      yearRange: {
        min: minYear === Infinity ? 0 : minYear,
        max: maxYear === -Infinity ? 0 : maxYear,
      },
    };
  }

  /**
   * Find claims that need citations but don't have them
   */
  private findMissingCitations(
    paragraphs: string[],
    citations: DetectedCitation[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Create a map of paragraph indices that have citations
    const paragraphsWithCitations = new Set(
      citations.map(c => c.paragraphIndex).filter(i => i >= 0)
    );

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];
      const sentences = this.extractSentences(paragraph);

      for (const sentence of sentences) {
        // Check if sentence needs citation
        const needsCitation = NEEDS_CITATION_PATTERNS.some(p => p.test(sentence));
        const isAuthorClaim = NO_CITATION_NEEDED_PATTERNS.some(p => p.test(sentence));

        if (needsCitation && !isAuthorClaim) {
          // Check if this paragraph has any citations
          if (!paragraphsWithCitations.has(pIndex)) {
            // Check surrounding context (maybe citation is in adjacent sentence)
            const paragraphHasAnyCitation = citations.some(
              c => c.paragraphIndex === pIndex
            );

            if (!paragraphHasAnyCitation) {
              // Determine severity based on claim type
              const isStatistical = /\b\d+(\.\d+)?%?|millions?|billions?|thousands?/i.test(sentence);
              const isHistorical = /\b(in\s+\d{4}|was\s+(first\s+)?(discovered|invented|developed))/i.test(sentence);

              const severity = isStatistical || isHistorical ? 'major' : 'minor';

              issues.push({
                id: this.generateIssueId('citation', issueIndex++),
                type: 'citation',
                severity,
                location: {
                  chapterId,
                  paragraphIndex: pIndex,
                },
                description: 'Claim appears to need citation but none found in paragraph',
                suggestion: 'Add a citation to support this claim or rephrase as your own analysis',
                autoFixable: false,
                contextSnippet: sentence.substring(0, 150),
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check citation format consistency
   */
  private checkFormatConsistency(
    citations: DetectedCitation[],
    stats: CitationStats,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    if (citations.length < 3) {
      // Not enough citations to check consistency
      return issues;
    }

    // Find dominant format
    const dominantFormat = this.findDominantFormat(stats);
    if (!dominantFormat) return issues;

    // Check for citations not in dominant format
    const inconsistentCitations = citations.filter(
      c => c.format !== dominantFormat
    );

    // Only flag if there's significant inconsistency
    const inconsistencyRatio = inconsistentCitations.length / citations.length;

    if (inconsistencyRatio > 0.2 && inconsistencyRatio < 0.8) {
      // Mixed formats
      issues.push({
        id: this.generateIssueId('citation', issueIndex++),
        type: 'citation',
        severity: 'major',
        location: {
          chapterId,
        },
        description: `Mixed citation formats detected: ${Object.keys(stats.citationsByFormat).join(', ')}`,
        suggestion: `Standardize all citations to ${dominantFormat} format for consistency`,
        autoFixable: false,
      });
    }

    // Flag individual inconsistent citations if there are few
    if (inconsistentCitations.length <= 3 && inconsistencyRatio < 0.3) {
      for (const citation of inconsistentCitations) {
        issues.push({
          id: this.generateIssueId('citation', issueIndex++),
          type: 'citation',
          severity: 'minor',
          location: {
            chapterId,
            paragraphIndex: citation.paragraphIndex,
          },
          description: `Citation "${citation.text}" uses ${citation.format} format instead of dominant ${dominantFormat}`,
          suggestion: 'Convert this citation to match the dominant format',
          autoFixable: true,
          contextSnippet: citation.text,
        });
      }
    }

    return issues;
  }

  /**
   * Check for over-reliance on single sources
   */
  private checkSourceDiversity(
    citations: DetectedCitation[],
    stats: CitationStats,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    if (stats.totalCitations < 5) {
      return issues; // Not enough citations to analyze
    }

    // Count occurrences of each source
    const sourceCounts = new Map<string, number>();
    for (const citation of citations) {
      const key = citation.text.toLowerCase();
      sourceCounts.set(key, (sourceCounts.get(key) || 0) + 1);
    }

    // Find over-used sources
    for (const [source, count] of sourceCounts) {
      const ratio = count / stats.totalCitations;

      if (ratio > 0.3 && count > 3) {
        // Over 30% of citations from one source
        issues.push({
          id: this.generateIssueId('citation', issueIndex++),
          type: 'citation',
          severity: 'major',
          location: {
            chapterId,
          },
          description: `Over-reliance on single source: "${source}" appears ${count} times (${(ratio * 100).toFixed(0)}% of citations)`,
          suggestion: 'Diversify sources to strengthen your argument and show broader research',
          autoFixable: false,
        });
      } else if (ratio > 0.2 && count > 2) {
        issues.push({
          id: this.generateIssueId('citation', issueIndex++),
          type: 'citation',
          severity: 'minor',
          location: {
            chapterId,
          },
          description: `Frequent use of source: "${source}" appears ${count} times`,
          suggestion: 'Consider adding additional supporting sources',
          autoFixable: false,
        });
      }
    }

    // Check if too few unique sources overall
    if (stats.uniqueSources.size < stats.totalCitations * 0.3 && stats.totalCitations > 5) {
      issues.push({
        id: this.generateIssueId('citation', issueIndex++),
        type: 'citation',
        severity: 'minor',
        location: {
          chapterId,
        },
        description: `Low source diversity: ${stats.uniqueSources.size} unique sources for ${stats.totalCitations} citations`,
        suggestion: 'Incorporate additional sources to demonstrate thorough literature review',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check that direct quotes have citations
   */
  private checkQuoteCitations(
    paragraphs: string[],
    citations: DetectedCitation[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];

      // Find direct quotes
      const quoteMatches = paragraph.matchAll(CITATION_PATTERNS.directQuote);

      for (const match of quoteMatches) {
        const quote = match[0];
        const quotePosition = match.index || 0;

        // Check if there's a citation near this quote (within 200 characters after)
        // Extended from 100 to handle sentences with multiple quotes before the citation
        const nearbyText = paragraph.substring(quotePosition, quotePosition + quote.length + 200);

        // Check for any citation pattern near the quote
        // IMPORTANT: Reset lastIndex for global regex patterns to avoid false negatives
        const hasCitation = Object.values(CITATION_PATTERNS)
          .filter((_, i) => Object.keys(CITATION_PATTERNS)[i] !== 'directQuote')
          .some(pattern => {
            pattern.lastIndex = 0;
            return pattern.test(nearbyText);
          });

        if (!hasCitation) {
          issues.push({
            id: this.generateIssueId('citation', issueIndex++),
            type: 'citation',
            severity: 'critical',
            location: {
              chapterId,
              paragraphIndex: pIndex,
            },
            description: 'Direct quote without citation',
            suggestion: 'Add a citation immediately after this quote, including page number if available',
            autoFixable: false,
            contextSnippet: quote.substring(0, 100),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check citation coverage across paragraphs
   */
  private checkCitationCoverage(
    paragraphs: string[],
    stats: CitationStats,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Find runs of paragraphs without citations
    let runStart = -1;
    let runLength = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const hasCitation = stats.citationsByParagraph[i] > 0;

      // Skip short paragraphs (likely transitions or section headers)
      const isSubstantialParagraph = paragraphs[i].length > 200;

      if (!hasCitation && isSubstantialParagraph) {
        if (runStart === -1) {
          runStart = i;
          runLength = 1;
        } else {
          runLength++;
        }
      } else {
        if (runLength >= 3) {
          issues.push({
            id: this.generateIssueId('citation', issueIndex++),
            type: 'citation',
            severity: 'major',
            location: {
              chapterId,
              paragraphIndex: runStart,
            },
            description: `${runLength} consecutive paragraphs without citations (paragraphs ${runStart + 1}-${runStart + runLength})`,
            suggestion: 'Add supporting citations in this section to strengthen your arguments',
            autoFixable: false,
          });
        }
        runStart = -1;
        runLength = 0;
      }
    }

    // Check final run
    if (runLength >= 3) {
      issues.push({
        id: this.generateIssueId('citation', issueIndex++),
        type: 'citation',
        severity: 'major',
        location: {
          chapterId,
          paragraphIndex: runStart,
        },
        description: `${runLength} consecutive paragraphs without citations at end of chapter`,
        suggestion: 'Add supporting citations in this section',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check citation age (flag very old or suspicious dates)
   */
  private checkCitationAge(
    citations: DetectedCitation[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const currentYear = new Date().getFullYear();

    const citationsWithYears = citations.filter(c => c.year);

    // Check for future dates (likely errors)
    const futureCitations = citationsWithYears.filter(
      c => c.year! > currentYear
    );

    for (const citation of futureCitations) {
      issues.push({
        id: this.generateIssueId('citation', issueIndex++),
        type: 'citation',
        severity: 'critical',
        location: {
          chapterId,
          paragraphIndex: citation.paragraphIndex,
        },
        description: `Citation has future date: ${citation.year}`,
        suggestion: 'Verify and correct the citation year',
        autoFixable: false,
        contextSnippet: citation.text,
      });
    }

    // Check if all citations are very old (might indicate outdated research)
    if (citationsWithYears.length >= 5) {
      const averageYear =
        citationsWithYears.reduce((sum, c) => sum + c.year!, 0) /
        citationsWithYears.length;

      if (currentYear - averageYear > 20) {
        issues.push({
          id: this.generateIssueId('citation', issueIndex++),
          type: 'citation',
          severity: 'minor',
          location: {
            chapterId,
          },
          description: `Citations average over 20 years old (average year: ${Math.round(averageYear)})`,
          suggestion:
            'Consider incorporating more recent scholarship unless discussing historical works',
          autoFixable: false,
        });
      }

      // Check if no recent citations
      const recentCitations = citationsWithYears.filter(
        c => currentYear - c.year! <= 5
      );

      if (recentCitations.length === 0 && citationsWithYears.length >= 10) {
        issues.push({
          id: this.generateIssueId('citation', issueIndex++),
          type: 'citation',
          severity: 'minor',
          location: {
            chapterId,
          },
          description: 'No citations from the past 5 years',
          suggestion:
            'Include recent scholarship to show awareness of current developments in the field',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Find the dominant citation format
   */
  private findDominantFormat(stats: CitationStats): string | null {
    let maxCount = 0;
    let dominant: string | null = null;

    for (const [format, count] of Object.entries(stats.citationsByFormat)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = format;
      }
    }

    return dominant;
  }

  // ============================================================================
  // Corpus Integration Methods
  // ============================================================================

  /**
   * Suggest relevant sources from the corpus based on chapter content
   */
  private async suggestSourcesFromCorpus(
    chapterText: string,
    existingCitations: string[]
  ): Promise<CorpusSuggestion[]> {
    const connector = this.getCorpusConnector();

    // Extract key topics from chapter (simplified - could use NLP)
    const topicWords = this.extractKeyTopics(chapterText);
    const searchQuery = topicWords.join(' ');

    return connector.suggestSourcesForTopic(searchQuery, existingCitations);
  }

  /**
   * Verify a citation against the corpus
   * Returns verification result with matched chunks and confidence
   */
  async verifyCitationAgainstCorpus(
    citationText: string,
    surroundingContext: string
  ): Promise<CitationVerificationResult> {
    if (!this.corpusVerificationEnabled) {
      return {
        isValid: false,
        confidence: 0,
        matchedChunks: [],
        issues: ['Corpus verification disabled'],
      };
    }

    const connector = this.getCorpusConnector();
    return connector.verifyCitation(citationText, surroundingContext);
  }

  /**
   * Get corpus statistics for reporting
   */
  getCorpusStats(): { totalDocuments: number; totalChunks: number; authors: string[] } | null {
    if (!this.corpusVerificationEnabled) {
      return null;
    }

    try {
      const connector = this.getCorpusConnector();
      return connector.getCorpusStats();
    } catch {
      return null;
    }
  }

  /**
   * Extract key topics from text for corpus search
   * Simple extraction - could be enhanced with NLP
   */
  private extractKeyTopics(text: string): string[] {
    // Common philosophical/academic terms to look for
    const keyTermPatterns = [
      /\b(phantasia|imagination|perception|sensation|soul|mind)\b/gi,
      /\b(aristotle|heidegger|plato|phenomenolog\w+)\b/gi,
      /\b(rhetoric\w*|persuasi\w+|discourse)\b/gi,
      /\b(virtual\s+reality|vr|immersion|presence)\b/gi,
      /\b(being|existence|ontolog\w+|metaphysic\w+)\b/gi,
    ];

    const topics = new Set<string>();

    for (const pattern of keyTermPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          topics.add(match.toLowerCase());
        }
      }
    }

    // Add first few substantive words from title-like sentences
    const sentences = text.split(/[.!?]+/).slice(0, 5);
    for (const sentence of sentences) {
      const words = sentence
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 5 && !this.isStopWord(w));

      for (const word of words.slice(0, 3)) {
        topics.add(word);
      }
    }

    return Array.from(topics).slice(0, 10);
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'about', 'after', 'again', 'against', 'before', 'being', 'between',
      'could', 'during', 'having', 'itself', 'other', 'should', 'their',
      'there', 'these', 'those', 'through', 'under', 'which', 'while',
      'within', 'without', 'would', 'however', 'therefore', 'although',
    ]);
    return stopWords.has(word);
  }
}
