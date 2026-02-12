/**
 * CitationRefiner - Distinguishes author's terms from external quotes
 *
 * Phase 2 Enhancement #1:
 * - Detects authorial term introductions ("I term this...", "This dissertation introduces...")
 * - Tracks first use vs. repeated use
 * - Distinguishes author's technical vocabulary from external quotes
 * - Reduces false positives in citation checking
 *
 * Target: Reduce citation false positives from ~19 to <10
 */

// ============================================================================
// Types
// ============================================================================

export interface Location {
  chapterId: number;
  paragraphIndex: number;
  lineNumber?: number;
}

export interface TermInfo {
  firstLocation: Location;
  isAuthoredTerm: boolean;
  needsCitation: boolean;
  introductionContext?: string;
}

export interface IssueRecommendation {
  shouldFlag: boolean;
  severity: 'critical' | 'major' | 'minor';
  reason: string;
  suggestion: string;
}

export interface CitationRefinerConfig {
  enableCitationDatabase: boolean;
  citationDatabasePath?: string;
  strictMode: boolean; // Flag more conservatively in strict mode
}

// ============================================================================
// Pattern Constants
// ============================================================================

/**
 * Patterns indicating author is introducing their own terminology
 */
const AUTHOR_INTRODUCTION_PATTERNS = [
  /\b(i\s+(term|call|label|designate)\s+(this|these))\b/i,
  /\b(i\s+(define|introduce|propose)\s+(?:the\s+)?(?:concept|notion|idea|term)?\s*(?:of\s+)?[""']?[a-z][a-z\s-]+[""']?)/i,
  /\b(this\s+(dissertation|thesis|paper)\s+(introduces?|defines?)\s+([""']?\w+[""']?))\b/i,
  /\b(what\s+i\s+(will\s+)?(call|term|label))\b/i,
  /\b(let\s+us\s+(call|term|designate))\b/i,
  /\b(by\s+[a-z][a-z\s-]+,?\s+i\s+mean)\b/i,
  /\b(hereafter\s+(referred\s+to\s+as|termed|called))\b/i,
  /\b(i\s+coin\s+the\s+term)\b/i,
  /\b(my\s+term\s+for\s+this)\b/i,
  /\b(the\s+term\s+i\s+use)\b/i,
];

/**
 * Patterns indicating external quote or claim requiring citation
 */
const EXTERNAL_QUOTE_PATTERNS = [
  /\b(according\s+to\s+\w+)\b/i,
  /\b(as\s+\w+\s+(argues?|claims?|states?|notes?))\b/i,
  /\b(\w+\s+(writes?|observes?)\s+that)\b/i,
  /[""]([^""]{20,})[""](?!\s+\()/i, // Long quote without immediate citation
  /\b(in\s+\w+['']s\s+(words|terms|view))\b/i,
  /\b(\w+\s+et\s+al\.\s+(argue|claim|show))\b/i,
  /\b(the\s+(standard|received|common)\s+(view|account|interpretation))\b/i,
];

/**
 * Patterns for technical vocabulary that might be author's synthesis
 */
const TECHNICAL_TERM_PATTERNS = [
  // Compound terms (likely author's synthesis)
  /\b([a-z]+-[a-z]+)\b/i,

  // Hyphenated philosophical terms
  /\b([a-z]+-[a-z]+-[a-z]+)\b/i,

  // Terms in scare quotes (signaling special usage)
  /["']([^"']{1,30})["']/,

  // Capitalized mid-sentence (technical proper nouns)
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/,
];

// ============================================================================
// CitationRefiner Class
// ============================================================================

/**
 * Refines citation checking to distinguish author's original terms
 * from external material requiring citation
 */
export class CitationRefiner {
  private authorTerms: Set<string> = new Set();
  private firstUsePositions: Map<string, Location> = new Map();
  private termRegistry: Map<string, TermInfo> = new Map();
  private config: CitationRefinerConfig;

  constructor(config?: Partial<CitationRefinerConfig>) {
    this.config = {
      enableCitationDatabase: false,
      strictMode: false,
      ...config,
    };
  }

  /**
   * Analyze paragraph for authorial term introductions
   * @returns Array of terms introduced by the author
   */
  analyzeTermIntroductions(
    paragraph: string,
    paragraphIndex: number,
    chapterId: number = 1
  ): string[] {
    const introducedTerms: string[] = [];

    // Check each author introduction pattern
    for (const pattern of AUTHOR_INTRODUCTION_PATTERNS) {
      const matches = paragraph.matchAll(new RegExp(pattern.source, 'gi'));

      for (const match of matches) {
        // Extract the term being introduced
        const term = this.extractTermFromMatch(match[0], paragraph);

        if (term && term.length > 2) {
          const normalizedTerm = term.toLowerCase().trim();

          // Record as author's term
          this.authorTerms.add(normalizedTerm);
          introducedTerms.push(normalizedTerm);

          // Track in registry
          const location: Location = { chapterId, paragraphIndex };
          if (!this.termRegistry.has(normalizedTerm)) {
            this.termRegistry.set(normalizedTerm, {
              firstLocation: location,
              isAuthoredTerm: true,
              needsCitation: false,
              introductionContext: match[0].substring(0, 100),
            });
          }

          this.firstUsePositions.set(normalizedTerm, location);
        }
      }
    }

    return introducedTerms;
  }

  /**
   * Extract the term being introduced from a matched pattern
   */
  private extractTermFromMatch(matchText: string, fullContext: string): string | null {
    // Strategy: Look for the term AFTER the introduction pattern in the full context

    // Extract context window once for all checks
    const contextAroundMatch = this.extractContextWindow(fullContext, matchText, 150);

    // 1. Try to extract term in quotes first (most reliable)
    const quotedPatterns = [
      /[""]([^""]{2,50})[""]/, // Standard quotes
      /['']([^'']{2,50})['']/, // Single quotes
      /["']([^"']{2,50})["']/, // Mixed quotes
    ];

    for (const pattern of quotedPatterns) {
      const quotedMatch = contextAroundMatch.match(pattern);
      if (quotedMatch && quotedMatch[1].length > 2) {
        // Verify it's not a full sentence (starts with capital, ends with punctuation)
        const term = quotedMatch[1].trim();
        if (!/^[A-Z].*[.!?]$/.test(term)) {
          return term;
        }
      }
    }

    // 2. Extract after "I introduce/define X as" pattern
    const introduceMatch = fullContext.match(/\b(?:introduce|define|propose)\s+(?:the\s+)?(?:concept\s+of\s+)?([""']?)([a-z][a-z\s-]+)\1\s+as\b/i);
    if (introduceMatch && fullContext.includes(matchText)) {
      return this.cleanExtractedTerm(introduceMatch[2]);
    }

    // 2b. Extract quoted terms after "I introduce/define/propose" (no "as")
    const introduceQuotedMatch = contextAroundMatch.match(/\b(?:i\s+)?(?:introduce|define|propose)\s+(?:the\s+)?(?:concept\s+of\s+)?[""]([^""]{2,50})[""]/ );
    if (introduceQuotedMatch) {
      return this.cleanExtractedTerm(introduceQuotedMatch[1]);
    }

    // 3. Extract after "I term/call this X" pattern - look AFTER "this/these"
    const termAfterThisPattern = /\b(?:i\s+)?(?:term|call|label|designate)\s+(?:this|these)\s+([""']?)([a-z][a-z\s-]+)\1/i;
    const termAfterThisMatch = contextAroundMatch.match(termAfterThisPattern);
    if (termAfterThisMatch) {
      return this.cleanExtractedTerm(termAfterThisMatch[2]);
    }

    // 4. Extract after "what I call/term X" pattern
    const whatICallMatch = contextAroundMatch.match(/\bwhat\s+i\s+(?:call|term)\s+(?:the\s+)?([""']?)([a-z][a-z\s-]+)\1/i);
    if (whatICallMatch) {
      return this.cleanExtractedTerm(whatICallMatch[2]);
    }

    // 5. Extract after "by X, I mean" pattern
    const byXIMeanMatch = contextAroundMatch.match(/\bby\s+([""']?)([a-z][a-z\s-]+)\1,?\s+i\s+mean\b/i);
    if (byXIMeanMatch) {
      return this.cleanExtractedTerm(byXIMeanMatch[2]);
    }

    // 6. Extract after "hereafter referred to as/termed/called X" pattern
    const hereafterMatch = contextAroundMatch.match(/\bhereafter\s+(?:referred\s+to\s+as|termed|called)\s+([""']?)([a-z][a-z\s-]+)\1/i);
    if (hereafterMatch) {
      return this.cleanExtractedTerm(hereafterMatch[2]);
    }

    // 7. Extract after "I coin the term X" pattern
    const coinTermMatch = contextAroundMatch.match(/\bi\s+coin\s+the\s+term\s+([""']?)([a-z][a-z\s-]+)\1/i);
    if (coinTermMatch) {
      return this.cleanExtractedTerm(coinTermMatch[2]);
    }

    // 8. Look for hyphenated technical terms
    const hyphenatedMatch = contextAroundMatch.match(/\b([a-z]+-[a-z]+(?:-[a-z]+)?)\b/i);
    if (hyphenatedMatch) {
      return hyphenatedMatch[1];
    }

    return null;
  }

  /**
   * Extract context window around a match
   */
  private extractContextWindow(text: string, match: string, windowSize: number): string {
    const matchIndex = text.indexOf(match);
    if (matchIndex === -1) return text.substring(0, windowSize * 2);

    const start = Math.max(0, matchIndex - windowSize / 2);
    const end = Math.min(text.length, matchIndex + match.length + windowSize);
    return text.substring(start, end);
  }

  /**
   * Clean extracted term by removing articles, limiting length, etc.
   */
  private cleanExtractedTerm(term: string): string {
    // Trim whitespace
    let cleaned = term.trim();

    // Remove leading articles and common descriptive words
    cleaned = cleaned.replace(/^(?:a|an|the|this|these|that|those)\s+/i, '');
    cleaned = cleaned.replace(/^(?:concept|notion|idea|term|phenomenon)\s+(?:of\s+)?/i, '');

    // Split into words
    const words = cleaned.split(/\s+/);

    // Filter out very common words that shouldn't be part of technical terms
    const stopWords = new Set(['a', 'an', 'the', 'of', 'to', 'for', 'in', 'on', 'at', 'and', 'or']);

    // Take 1-5 words (technical terms are typically 1-4 words, allow 5 for compounds)
    const filtered = words.filter((w, idx) => {
      // Keep first word even if it's common
      if (idx === 0) return true;
      // Filter out stop words in middle positions
      return !stopWords.has(w.toLowerCase());
    }).slice(0, 5);

    // Rejoin and return
    return filtered.join(' ').trim();
  }

  /**
   * Track usage of a term at a specific location
   */
  trackTermUsage(
    term: string,
    location: Location,
    context: string
  ): void {
    const normalizedTerm = term.toLowerCase().trim();

    if (!this.firstUsePositions.has(normalizedTerm)) {
      this.firstUsePositions.set(normalizedTerm, location);
    }

    // Update registry if not already tracked
    if (!this.termRegistry.has(normalizedTerm)) {
      this.termRegistry.set(normalizedTerm, {
        firstLocation: location,
        isAuthoredTerm: this.isAuthorOwnTerm(context, term),
        needsCitation: !this.isAuthorOwnTerm(context, term),
      });
    }
  }

  /**
   * Check if a term needs citation in the given context
   * @returns null if no citation needed, IssueRecommendation if citation needed
   */
  checkTermCitation(
    term: string,
    context: string,
    paragraphIndex: number,
    chapterId: number = 1
  ): IssueRecommendation | null {
    const normalizedTerm = term.toLowerCase().trim();

    // First check if the term is being introduced in this very context
    // This handles cases where we check citation before the term is formally registered
    const isBeingIntroducedHere = this.isAuthorOwnTerm(context, term);
    if (isBeingIntroducedHere) {
      return null;
    }

    // Check if this is an author's term (already registered)
    if (this.authorTerms.has(normalizedTerm)) {
      // First use might need explanation, but not citation
      const termInfo = this.termRegistry.get(normalizedTerm);
      if (termInfo && termInfo.firstLocation.paragraphIndex === paragraphIndex) {
        // First introduction - no citation needed
        return null;
      }

      // Repeated use - definitely no citation needed
      return null;
    }

    // Check if context suggests this is author's own analysis
    if (this.isAuthorOwnAnalysis(context)) {
      return null;
    }

    // Check if context has external quote markers
    if (this.hasExternalQuoteMarkers(context)) {
      return {
        shouldFlag: true,
        severity: 'major',
        reason: 'External quote or claim detected without citation',
        suggestion: 'Add citation to support this claim from external source',
      };
    }

    // Check if this is a technical term (might be author's synthesis)
    if (this.isTechnicalTerm(term)) {
      // In strict mode, flag technical terms more conservatively
      if (this.config.strictMode) {
        return {
          shouldFlag: true,
          severity: 'minor',
          reason: 'Technical term without clear attribution',
          suggestion: 'Consider defining this term or adding citation if from external source',
        };
      }

      // In non-strict mode, don't flag technical terms
      return null;
    }

    // Default: flag for citation
    return {
      shouldFlag: true,
      severity: 'minor',
      reason: 'Claim may need citation',
      suggestion: 'Add citation if this claim is from external source, or rephrase as your own analysis',
    };
  }

  /**
   * Check if context suggests author's own analysis vs. external quote
   */
  isAuthorOwnAnalysis(context: string): boolean {
    const authorAnalysisPatterns = [
      /\b(i\s+(argue|contend|propose|suggest|believe|maintain|claim)\s+that)\b/i,
      /\b(my\s+(argument|thesis|claim|position|view))\b/i,
      /\b(this\s+(paper|dissertation|thesis)\s+(argues?|proposes?|shows?))\b/i,
      /\b(as\s+(i|we)\s+(have\s+)?(shown|argued|demonstrated))\b/i,
      /\b(in\s+this\s+(section|chapter|analysis))\b/i,
      /\b(the\s+(preceding|following)\s+(analysis|discussion))\b/i,
    ];

    return authorAnalysisPatterns.some(pattern => pattern.test(context));
  }

  /**
   * Check if context has markers indicating external quote or claim
   */
  private hasExternalQuoteMarkers(context: string): boolean {
    return EXTERNAL_QUOTE_PATTERNS.some(pattern => pattern.test(context));
  }

  /**
   * Check if term appears to be technical vocabulary
   */
  private isTechnicalTerm(term: string): boolean {
    // Check for hyphenated terms
    if (/-/.test(term)) {
      return true;
    }

    // Check for terms in quotes in the original context
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const quotedPattern = new RegExp(`["']${escapedTerm}["']`, 'i');
    if (quotedPattern.test(term)) {
      return true;
    }

    // Check for compound terms
    const words = term.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      return true;
    }

    return false;
  }

  /**
   * Check if a term was introduced by the author
   */
  isAuthorOwnTerm(context: string, term: string): boolean {
    const normalizedTerm = term.toLowerCase().trim();

    // Check registry first
    if (this.authorTerms.has(normalizedTerm)) {
      return true;
    }

    // Check if context has author introduction markers
    for (const pattern of AUTHOR_INTRODUCTION_PATTERNS) {
      if (pattern.test(context)) {
        const extractedTerm = this.extractTermFromMatch(context, context);
        if (extractedTerm && extractedTerm.toLowerCase().includes(normalizedTerm)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Refine a quality issue from citation checker
   * @returns Refined issue or null if should be filtered out
   */
  refineIssue(
    issue: { contextSnippet?: string; description: string },
    context: {
      chapterId: number;
      paragraphIndex: number;
      fullParagraph: string;
    }
  ): IssueRecommendation | null {
    if (!issue.contextSnippet) {
      // Can't refine without context
      return {
        shouldFlag: true,
        severity: 'minor',
        reason: issue.description,
        suggestion: 'Review if citation is needed',
      };
    }

    // Extract potential term from context
    const potentialTerms = this.extractPotentialTerms(issue.contextSnippet);

    for (const term of potentialTerms) {
      const normalizedTerm = term.toLowerCase().trim();

      // Check if this is an author's term
      if (this.authorTerms.has(normalizedTerm)) {
        // This is author's term - filter out the issue
        return null;
      }

      // Check if this term was introduced in this paragraph
      const introduced = this.analyzeTermIntroductions(
        context.fullParagraph,
        context.paragraphIndex,
        context.chapterId
      );

      if (introduced.includes(normalizedTerm)) {
        // Just introduced - don't flag
        return null;
      }
    }

    // Check overall context
    return this.checkTermCitation(
      issue.contextSnippet,
      context.fullParagraph,
      context.paragraphIndex,
      context.chapterId
    );
  }

  /**
   * Extract potential terms from a text snippet
   */
  private extractPotentialTerms(text: string): string[] {
    const terms: string[] = [];

    // Extract quoted terms
    const quotedMatches = text.matchAll(/["']([^"']{1,40})["']/g);
    for (const match of quotedMatches) {
      terms.push(match[1]);
    }

    // Extract hyphenated terms
    const hyphenatedMatches = text.matchAll(/\b([a-z]+-[a-z]+(?:-[a-z]+)?)\b/gi);
    for (const match of hyphenatedMatches) {
      terms.push(match[1]);
    }

    // Extract compound terms (2-4 words)
    const compoundMatches = text.matchAll(/\b([a-z]+(?:\s+[a-z]+){1,3})\b/gi);
    for (const match of compoundMatches) {
      const term = match[1];
      // Filter out very common phrases
      if (!this.isCommonPhrase(term)) {
        terms.push(term);
      }
    }

    // Also check all words against known author terms
    // This catches single-word technical terms like "veridissimilitude"
    const words = text.match(/\b[a-z]{4,}\b/gi); // Words 4+ letters
    if (words) {
      for (const word of words) {
        const normalized = word.toLowerCase().trim();
        if (this.authorTerms.has(normalized)) {
          terms.push(normalized);
        }
      }
    }

    return terms;
  }

  /**
   * Check if phrase is too common to be a technical term
   */
  private isCommonPhrase(phrase: string): boolean {
    const commonPhrases = new Set([
      'in this', 'of the', 'to the', 'for the', 'that is',
      'it is', 'there is', 'as well', 'in order', 'can be',
    ]);

    return commonPhrases.has(phrase.toLowerCase());
  }

  /**
   * Reset state for new chapter analysis
   */
  reset(): void {
    this.authorTerms.clear();
    this.firstUsePositions.clear();
    this.termRegistry.clear();
  }

  /**
   * Get statistics about tracked terms
   */
  getStats(): {
    authorTermsCount: number;
    trackedTermsCount: number;
    authorTerms: string[];
  } {
    return {
      authorTermsCount: this.authorTerms.size,
      trackedTermsCount: this.termRegistry.size,
      authorTerms: Array.from(this.authorTerms),
    };
  }
}
