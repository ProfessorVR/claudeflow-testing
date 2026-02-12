/**
 * Quotation Fidelity Validator (Phase 7: Verbatim Quotation Enforcement)
 *
 * Ensures that all direct quotations in generated content match
 * the corpus source text verbatim. This prevents paraphrastic
 * misquotation where the citation is correct but the quoted
 * text is not an exact match.
 *
 * Example issue this solves:
 * - Citation: (Aristotle, De Anima, 427b14-16) ✓
 * - Quoted text: "phantasia is different from both perception and thought"
 * - Corpus text: "Phantasia is different from both perception and discursive thinking"
 * - Result: Non-verbatim quotation detected and flagged
 */

import type { CorpusSource } from './writing-generator.js';
import type { ContextChunk } from './corpus-constraint-builder.js';

/**
 * Extracted quotation from text
 */
export interface ExtractedQuotation {
  /** The quoted text as it appears in the document */
  text: string;
  /** Position in content (character index) */
  position: number;
  /** Line number in content */
  line: number;
  /** Length of the quotation */
  length: number;
  /** Associated citation if found nearby */
  associatedCitation?: {
    author?: string;
    year?: number;
    pageRef?: string;
  };
}

/**
 * Match classification for dual-threshold fidelity scoring.
 *
 * - verbatim:   raw similarity >= 0.95 (exact match)
 * - normalized:  normalized similarity >= 0.95 AND raw >= 0.80 (layout artifact tolerance)
 * - borderline:  normalized similarity >= 0.90 AND raw >= 0.75 (WARN tier)
 * - fail:        below all thresholds
 */
export type FidelityMatchType = 'verbatim' | 'normalized' | 'borderline' | 'fail';

/**
 * Result of validating a single quotation's fidelity
 */
export interface QuotationFidelityResult {
  /** The extracted quotation */
  quotation: ExtractedQuotation;
  /** Whether the quotation is verbatim (matchType === 'verbatim' or 'normalized') */
  isVerbatim: boolean;
  /** Raw similarity score (0-1) — before layout normalization */
  similarityScore: number;
  /** Normalized similarity score (0-1) — after layout normalization */
  normalizedSimilarityScore?: number;
  /** Fidelity classification */
  matchType: FidelityMatchType;
  /** Matched corpus source if found */
  matchedSource?: CorpusSource;
  /** The actual corpus text if found */
  corpusText?: string;
  /** Reason if not verbatim */
  reason?: string;
  /** Suggested correction */
  suggestedCorrection?: string;
}

/**
 * Full validation result for all quotations
 */
export interface QuotationFidelityValidationResult {
  /** All verbatim quotations (matchType: verbatim or normalized) */
  verbatim: QuotationFidelityResult[];
  /** All non-verbatim quotations (matchType: fail, with a matched source) */
  nonVerbatim: QuotationFidelityResult[];
  /** Quotations with no matching corpus source */
  unmatched: QuotationFidelityResult[];
  /** Borderline quotations (matchType: borderline) — WARN tier */
  borderline: QuotationFidelityResult[];
  /** Fidelity rate (verbatim / total) */
  fidelityRate: number;
  /** Total quotations found */
  totalQuotations: number;
  /** Count of exact matches (raw similarity >= 0.95, no normalization needed) */
  verbatimMatchCount: number;
  /** Count of matches that required layout normalization (norm >= 0.95, raw < 0.95) */
  normalizedMatchCount: number;
  /** Count of borderline matches (norm >= 0.90, raw >= 0.75) */
  borderlineCount: number;
  /** Count of failed matches (below all thresholds or unmatched) */
  failCount: number;
  /** % verbatim — higher = cleaner corpus */
  verbatimRate: number;
  /** % normalized-only — higher = more OCR artifacts */
  normalizedRate: number;
  /** % borderline — early warning for corpus degradation */
  borderlineRate: number;
  /** Summary */
  summary: string;
}

/**
 * Options for quotation fidelity validation
 */
export interface QuotationFidelityOptions {
  /** Minimum similarity score to consider verbatim (default: 0.95) */
  minSimilarity?: number;
  /** Maximum character distance to search for associated citation (default: 200) */
  citationSearchRadius?: number;
  /** Whether to ignore case differences (default: true) */
  ignoreCase?: boolean;
  /** Whether to ignore punctuation differences (default: false) */
  ignorePunctuation?: boolean;
  /** Whether to suggest corrections for non-verbatim quotations (default: true) */
  suggestCorrections?: boolean;
  /**
   * Normalization mode for fidelity scoring.
   * - 'strict': raw similarity only (no layout normalization)
   * - 'layout-normalized': dual-threshold with layout normalization (default)
   */
  normalizationMode?: 'strict' | 'layout-normalized';
}

const DEFAULT_OPTIONS: Required<QuotationFidelityOptions> = {
  minSimilarity: 0.95,
  citationSearchRadius: 200,
  ignoreCase: true,
  ignorePunctuation: false,
  suggestCorrections: true,
  normalizationMode: 'layout-normalized',
};

/**
 * Quotation Fidelity Validator
 *
 * Validates that direct quotations in generated content match
 * corpus sources verbatim.
 */
export class QuotationFidelityValidator {
  private corpusSources: CorpusSource[];
  private corpusChunks: ContextChunk[];
  private options: Required<QuotationFidelityOptions>;

  constructor(
    corpusSources: CorpusSource[],
    corpusChunks: ContextChunk[],
    options: QuotationFidelityOptions = {}
  ) {
    this.corpusSources = corpusSources;
    this.corpusChunks = corpusChunks;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Layout-aware text normalization for pdftotext artifacts.
   *
   * Mirrors the Python `clean_corpus_text()` pipeline:
   *   1. Remove standalone locator lines (page numbers, Bekker refs)
   *   2. Standard dehyphenation: [A-Za-z]-\n[a-z] → join
   *   3. Known-prefix dehyphenation: (non|anti|...)-\n[A-Z] → keep hyphen
   *   4. Join mid-sentence line breaks (same guards as Python)
   *   5. NBSP → space, collapse whitespace runs
   */
  static normalizeForLayout(text: string): string {
    let t = text;

    // Step 1: Remove standalone locator lines
    t = t
      .split('\n')
      .filter(ln => !/^[ \t]*(?:\d{1,4}|[0-9]{2,4}[ab][0-9]*|—\s*\d+\s*—)[ \t]*$/.test(ln))
      .join('\n');

    // Step 2a: Standard dehyphenation
    t = t.replace(/([A-Za-z])-\n([a-z])/g, '$1$2');

    // Step 2b: Known-prefix dehyphenation
    const prefixes = '(?:non|anti|pre|post|self|sub|super|inter|intra|extra|meta|proto|quasi|semi|ultra)';
    t = t.replace(new RegExp(`(${prefixes})-\\n([A-Z])`, 'g'), '$1-$2');

    // Step 3: Join mid-sentence line breaks (with guards)
    const bulletRe = /^(?:\d+[.)]\s|[•\-*]\s+)/;
    const quoteChars = new Set(['"', "'", '\u201C', '\u2018', '\u2019', '\u201D', '\u201E']);
    const lines = t.split('\n');
    const joined: string[] = [];

    for (const line of lines) {
      if (joined.length === 0) {
        joined.push(line);
        continue;
      }

      const prev = joined[joined.length - 1];
      const stripped = line.trimStart();

      // Guard: previous line ends with colon
      if (prev.trimEnd().endsWith(':')) {
        joined.push(line);
        continue;
      }
      // Guard: bullet/list item
      if (bulletRe.test(stripped)) {
        joined.push(line);
        continue;
      }
      // Guard: opening quote mark
      if (stripped.length > 0 && quoteChars.has(stripped[0])) {
        joined.push(line);
        continue;
      }
      // Guard: blank line
      if (!stripped) {
        joined.push(line);
        continue;
      }
      // Guard: previous blank
      if (!prev.trim()) {
        joined.push(line);
        continue;
      }

      // Join
      joined[joined.length - 1] = prev.trimEnd() + ' ' + stripped;
    }

    t = joined.join('\n');

    // Step 4: NBSP → space, collapse horizontal whitespace
    t = t.replace(/\u00a0/g, ' ').replace(/[ \t]{2,}/g, ' ');

    return t.trim();
  }

  /**
   * Classify a quotation match using dual-threshold scoring.
   *
   * Thresholds:
   *   verbatim:   rawSim >= 0.95
   *   normalized:  normSim >= 0.95 AND rawSim >= 0.80
   *   borderline:  normSim >= 0.90 AND rawSim >= 0.75
   *   fail:        below all
   */
  private classifyMatch(rawSimilarity: number, normalizedSimilarity: number): FidelityMatchType {
    if (rawSimilarity >= 0.95) return 'verbatim';
    if (normalizedSimilarity >= 0.95 && rawSimilarity >= 0.80) return 'normalized';
    if (normalizedSimilarity >= 0.90 && rawSimilarity >= 0.75) return 'borderline';
    return 'fail';
  }

  /**
   * Validate all quotations in content
   */
  async validate(content: string): Promise<QuotationFidelityValidationResult> {
    const quotations = this.extractQuotations(content);
    const results: QuotationFidelityResult[] = [];

    for (const quotation of quotations) {
      const result = await this.validateQuotation(quotation, content);
      results.push(result);
    }

    const verbatim = results.filter(r => r.isVerbatim);
    const borderline = results.filter(r => r.matchType === 'borderline');
    const nonVerbatim = results.filter(r => !r.isVerbatim && r.matchType !== 'borderline' && r.matchedSource);
    const unmatched = results.filter(r => !r.matchedSource);

    // Split verbatim into exact (raw >= 0.95) vs layout-normalized (needed cleaning to match)
    const verbatimMatchCount = results.filter(r => r.matchType === 'verbatim').length;
    const normalizedMatchCount = results.filter(r => r.matchType === 'normalized').length;

    const borderlineCount = borderline.length;
    const failCount = nonVerbatim.length + unmatched.length;

    const fidelityRate = quotations.length > 0 ? verbatim.length / quotations.length : 1;
    const verbatimRate = quotations.length > 0 ? verbatimMatchCount / quotations.length : 1;
    const normalizedRate = quotations.length > 0 ? normalizedMatchCount / quotations.length : 0;
    const borderlineRate = quotations.length > 0 ? borderlineCount / quotations.length : 0;

    return {
      verbatim,
      nonVerbatim,
      unmatched,
      borderline,
      fidelityRate,
      totalQuotations: quotations.length,
      verbatimMatchCount,
      normalizedMatchCount,
      borderlineCount,
      failCount,
      verbatimRate,
      normalizedRate,
      borderlineRate,
      summary: this.generateSummary(verbatimMatchCount, normalizedMatchCount, nonVerbatim.length, unmatched.length, borderlineCount),
    };
  }

  /**
   * Extract all quotations from content
   */
  private extractQuotations(content: string): ExtractedQuotation[] {
    const quotations: ExtractedQuotation[] = [];
    const lines = content.split('\n');
    let charOffset = 0;

    // Pattern to match text within quotation marks
    // Supports: "text", \u201Ctext\u201D, «text»
    // EXCLUDES single quotes/apostrophes to prevent possessive forms
    // (e.g., "Aristotle's") from being extracted as quotations
    const quotationPattern = /["\u201C\u201E«]([^"\u201D\u201E»]{10,}?)["\u201D\u201E»]/g;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      quotationPattern.lastIndex = 0;
      let match;

      while ((match = quotationPattern.exec(line)) !== null) {
        const text = match[1];
        const position = charOffset + match.index;

        // Find associated citation (search within radius)
        const associatedCitation = this.findAssociatedCitation(content, position);

        quotations.push({
          text,
          position,
          line: lineNum + 1,
          length: match[0].length,
          associatedCitation,
        });
      }

      charOffset += line.length + 1; // +1 for newline
    }

    return quotations;
  }

  /**
   * Find citation associated with a quotation
   */
  private findAssociatedCitation(
    content: string,
    position: number
  ): ExtractedQuotation['associatedCitation'] | undefined {
    const radius = this.options.citationSearchRadius;
    const searchStart = Math.max(0, position - radius);
    const searchEnd = Math.min(content.length, position + radius);
    const searchText = content.substring(searchStart, searchEnd);

    // Pattern to match citations: (Author Year, p. X) or (Author Year: X)
    const citationPattern = /\(([A-Z][a-z]+(?:\s+et\s+al\.?)?)[,\s]+(-?\d{1,4})(?:[,:]?\s*(?:p\.?|pp\.?)\s*([^\)]+))?\)/g;

    let match;
    let closestCitation: ExtractedQuotation['associatedCitation'] | undefined;
    let closestDistance = Infinity;

    while ((match = citationPattern.exec(searchText)) !== null) {
      const citationPos = searchStart + match.index;
      const distance = Math.abs(citationPos - position);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestCitation = {
          author: match[1],
          year: parseInt(match[2], 10),
          pageRef: match[3]?.trim(),
        };
      }
    }

    return closestCitation;
  }

  /**
   * Validate a single quotation against corpus
   */
  private async validateQuotation(
    quotation: ExtractedQuotation,
    fullContent: string
  ): Promise<QuotationFidelityResult> {
    // Try to find corpus source for this quotation
    const matchResult = this.findCorpusMatch(quotation);

    if (!matchResult.source) {
      return {
        quotation,
        isVerbatim: false,
        similarityScore: 0,
        matchType: 'fail',
        reason: 'No matching corpus source found for quotation',
      };
    }

    // Calculate raw similarity
    const rawSimilarity = this.calculateSimilarity(quotation.text, matchResult.corpusText);

    // Calculate normalized similarity (layout-normalized mode)
    let normalizedSimilarity = rawSimilarity;
    if (this.options.normalizationMode === 'layout-normalized') {
      const normalizedQuote = QuotationFidelityValidator.normalizeForLayout(quotation.text);
      const normalizedCorpus = QuotationFidelityValidator.normalizeForLayout(matchResult.corpusText);
      normalizedSimilarity = this.calculateSimilarity(normalizedQuote, normalizedCorpus);
    }

    // Classify using dual-threshold system
    const matchType = this.options.normalizationMode === 'strict'
      ? (rawSimilarity >= this.options.minSimilarity ? 'verbatim' as FidelityMatchType : 'fail' as FidelityMatchType)
      : this.classifyMatch(rawSimilarity, normalizedSimilarity);

    const isVerbatim = matchType === 'verbatim' || matchType === 'normalized';

    const reasonMap: Record<FidelityMatchType, string | undefined> = {
      verbatim: undefined,
      normalized: undefined,
      borderline: `Borderline match (raw=${rawSimilarity.toFixed(3)}, normalized=${normalizedSimilarity.toFixed(3)}) — likely layout artifact, review recommended`,
      fail: 'Quotation does not match corpus text verbatim',
    };

    return {
      quotation,
      isVerbatim,
      similarityScore: rawSimilarity,
      normalizedSimilarityScore: this.options.normalizationMode === 'layout-normalized'
        ? normalizedSimilarity
        : undefined,
      matchType,
      matchedSource: matchResult.source,
      corpusText: matchResult.corpusText,
      reason: reasonMap[matchType],
      suggestedCorrection: isVerbatim || !this.options.suggestCorrections
        ? undefined
        : matchResult.corpusText,
    };
  }

  /**
   * Find matching corpus source and text for a quotation
   */
  private findCorpusMatch(quotation: ExtractedQuotation): {
    source?: CorpusSource;
    corpusText: string;
  } {
    // If we have an associated citation, use it to find the source
    if (quotation.associatedCitation) {
      const { author, year, pageRef } = quotation.associatedCitation;

      // Try to find source by author and year
      const source = this.corpusSources.find(s =>
        this.matchAuthor(s.author, author || '') &&
        (year ? s.year === year : true)
      );

      if (source) {
        // Try to find the exact text in corpus chunks from this source
        const corpusText = this.findTextInCorpusChunks(quotation.text, source, pageRef);
        if (corpusText) {
          return { source, corpusText };
        }
      }
    }

    // Fallback: search all corpus chunks for similar text
    const bestMatch = this.findBestTextMatch(quotation.text);
    return bestMatch;
  }

  /**
   * Find text in corpus chunks from a specific source
   */
  private findTextInCorpusChunks(
    quotedText: string,
    source: CorpusSource,
    pageRef?: string
  ): string | undefined {
    // Find chunks from this source
    const sourceChunks = this.corpusChunks.filter(chunk =>
      chunk.metadata?.author === source.author &&
      chunk.metadata?.title === source.title &&
      (pageRef ? chunk.metadata?.pageRef === pageRef : true)
    );

    // Search for quoted text in these chunks using fast pre-filter
    for (const chunk of sourceChunks) {
      // Fast pre-filter: check if key words from the quote appear in the chunk
      if (!this.hasWordOverlap(quotedText, chunk.content, 0.3)) continue;

      const extractedText = this.extractMostSimilarSubstring(quotedText, chunk.content);
      if (extractedText) {
        return extractedText;
      }
    }

    return undefined;
  }

  /**
   * Find best matching text across all corpus chunks
   */
  private findBestTextMatch(quotedText: string): {
    source?: CorpusSource;
    corpusText: string;
  } {
    let bestMatch: { chunk?: ContextChunk; similarity: number; text: string } = {
      similarity: 0,
      text: '',
    };

    for (const chunk of this.corpusChunks) {
      // Fast pre-filter: skip chunks with low word overlap
      if (!this.hasWordOverlap(quotedText, chunk.content, 0.15)) continue;

      const extractedText = this.extractMostSimilarSubstring(quotedText, chunk.content);
      if (extractedText) {
        const similarity = this.calculateSimilarity(quotedText, extractedText);
        if (similarity > bestMatch.similarity) {
          bestMatch = {
            chunk,
            similarity,
            text: extractedText,
          };
        }
      }
    }

    if (bestMatch.chunk && bestMatch.similarity >= 0.3) {
      // Find source from chunk metadata
      const source = this.corpusSources.find(s =>
        s.author === bestMatch.chunk!.metadata?.author &&
        s.title === bestMatch.chunk!.metadata?.title
      );

      return {
        source,
        corpusText: bestMatch.text,
      };
    }

    return { corpusText: '' };
  }

  /**
   * Extract most similar substring from corpus text
   */
  private extractMostSimilarSubstring(quotedText: string, corpusText: string): string | undefined {
    // Normalize for comparison
    const normalizeForSearch = (text: string) => {
      let normalized = text.trim();
      if (this.options.ignoreCase) {
        normalized = normalized.toLowerCase();
      }
      if (this.options.ignorePunctuation) {
        normalized = normalized.replace(/[.,;:!?'"]/g, '');
      }
      return normalized;
    };

    const normalizedQuoted = normalizeForSearch(quotedText);
    const normalizedCorpus = normalizeForSearch(corpusText);

    // Try to find the quoted text as a substring (fast exact match)
    const index = normalizedCorpus.indexOf(normalizedQuoted);
    if (index !== -1) {
      // Extract the original text (with original casing/punctuation)
      return corpusText.substring(index, index + quotedText.length);
    }

    // Sentence-level search instead of character-level sliding window
    // Split corpus into segments using multiple patterns to handle OCR line breaks
    // OCR'd text often has line breaks mid-sentence, so we rejoin first, then split
    const cleanedCorpus = corpusText.replace(/\n(?![A-Z\n])/g, ' ').replace(/\s+/g, ' ');
    const sentences = cleanedCorpus.split(/(?<=[.!?;:])\s+/);
    let bestSimilarity = 0;
    let bestSubstring = '';

    for (let si = 0; si < sentences.length; si++) {
      // Try individual sentences
      const sentence = sentences[si].trim();
      if (sentence.length < 10) continue;

      const similarity = this.calculateSimilarity(quotedText, sentence);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestSubstring = sentence;
      }

      // Try consecutive sentence pairs (quotes often span sentence boundaries)
      if (si + 1 < sentences.length) {
        const combined = sentence + ' ' + sentences[si + 1].trim();
        const combinedSimilarity = this.calculateSimilarity(quotedText, combined);
        if (combinedSimilarity > bestSimilarity) {
          bestSimilarity = combinedSimilarity;
          bestSubstring = combined;
        }
      }

      // Try 3-sentence windows for longer quotes
      if (si + 2 < sentences.length && quotedText.length > 100) {
        const triple = sentence + ' ' + sentences[si + 1].trim() + ' ' + sentences[si + 2].trim();
        const tripleSimilarity = this.calculateSimilarity(quotedText, triple);
        if (tripleSimilarity > bestSimilarity) {
          bestSimilarity = tripleSimilarity;
          bestSubstring = triple;
        }
      }
    }

    // Return match if above minimum threshold (lowered from 0.8 to 0.4
    // so that quotes get actual similarity scores instead of being "unmatched")
    return bestSimilarity >= 0.4 ? bestSubstring : undefined;
  }

  /**
   * Fast word overlap check for pre-filtering (avoids expensive Levenshtein)
   */
  private hasWordOverlap(text1: string, text2: string, threshold: number): boolean {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2Lower = text2.toLowerCase();

    let matches = 0;
    for (const word of words1) {
      if (words2Lower.includes(word)) {
        matches++;
      }
    }

    return words1.size > 0 && (matches / words1.size) >= threshold;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Normalize strings
    let s1 = str1.trim();
    let s2 = str2.trim();

    if (this.options.ignoreCase) {
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();
    }

    if (this.options.ignorePunctuation) {
      s1 = s1.replace(/[.,;:!?'"]/g, '');
      s2 = s2.replace(/[.,;:!?'"]/g, '');
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 1;

    // Convert distance to similarity (0-1)
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // deletion
            dp[i][j - 1] + 1,    // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Match author names (handles various formats)
   */
  private matchAuthor(corpusAuthor: string, citationAuthor: string): boolean {
    const normalize = (name: string) => name.toLowerCase().trim();

    const corpusNorm = normalize(corpusAuthor);
    const citationNorm = normalize(citationAuthor);

    // Exact match
    if (corpusNorm === citationNorm) return true;

    // Check if citation author is last name only
    const corpusLastName = corpusAuthor.includes(',')
      ? corpusAuthor.split(',')[0].trim().toLowerCase()
      : corpusAuthor.split(/\s+/).pop()?.toLowerCase() || '';

    return corpusLastName === citationNorm;
  }

  /**
   * Generate summary of validation results
   */
  private generateSummary(
    verbatimCount: number,
    normalizedCount: number,
    nonVerbatimCount: number,
    unmatchedCount: number,
    borderlineCount: number = 0
  ): string {
    const totalCount = verbatimCount + normalizedCount + nonVerbatimCount + unmatchedCount + borderlineCount;

    if (totalCount === 0) {
      return 'No quotations found in content.';
    }

    const passCount = verbatimCount + normalizedCount;
    if (passCount === totalCount && normalizedCount === 0) {
      return `All ${verbatimCount} quotation(s) are verbatim from corpus sources.`;
    }

    const parts: string[] = [];

    if (verbatimCount > 0) {
      parts.push(`${verbatimCount} verbatim (${(verbatimCount / totalCount * 100).toFixed(0)}%)`);
    }

    if (normalizedCount > 0) {
      parts.push(`${normalizedCount} normalized-only (${(normalizedCount / totalCount * 100).toFixed(0)}%)`);
    }

    if (borderlineCount > 0) {
      parts.push(`${borderlineCount} borderline (${(borderlineCount / totalCount * 100).toFixed(0)}%, WARN)`);
    }

    if (nonVerbatimCount > 0) {
      parts.push(`${nonVerbatimCount} non-verbatim (paraphrased)`);
    }

    if (unmatchedCount > 0) {
      parts.push(`${unmatchedCount} unmatched`);
    }

    return `Quotation fidelity: ${parts.join(', ')} out of ${totalCount} total.`;
  }
}
