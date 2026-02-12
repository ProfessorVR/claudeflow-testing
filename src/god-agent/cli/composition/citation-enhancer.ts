/**
 * CitationEnhancer - Automatically adds citations to uncited claims
 *
 * PhD-level academic writing requires every claim to be substantiated.
 * This module:
 * - Identifies uncited claims in academic text
 * - Searches corpus for supporting evidence
 * - Injects properly formatted APA citations
 * - Tracks citation provenance for verification
 *
 * Part of Phase B Citation Verification implementation.
 * Target: 15+ citations per section, 0% hallucinated citations
 */

import { createComponentLogger, type StructuredLogger } from '../../core/observability/logger.js';

// ============================================================================
// Types
// ============================================================================

export interface UncitedClaim {
  /** The claim text that needs citation */
  text: string;

  /** Position in original document */
  position: number;

  /** Line number */
  line: number;

  /** Type of claim */
  claimType: 'factual' | 'statistical' | 'historical' | 'attribution' | 'definition';

  /** Confidence that this needs citation (0-1) */
  confidence: number;
}

export interface CitationSuggestion {
  /** The claim being cited */
  claim: UncitedClaim;

  /** Suggested citation in APA format */
  citation: string;

  /** Source details */
  source: {
    author: string;
    year: number;
    title: string;
    page?: number;
    docId?: string;
  };

  /** Relevance score (0-1) */
  relevance: number;

  /** Supporting quote from source */
  supportingQuote?: string;
}

export interface EnhancementResult {
  /** Enhanced text with citations added */
  enhancedText: string;

  /** Number of citations added */
  citationsAdded: number;

  /** Details of each enhancement */
  enhancements: CitationSuggestion[];

  /** Claims that couldn't be cited (no matching sources) */
  uncitedClaims: UncitedClaim[];

  /** Statistics */
  stats: {
    claimsIdentified: number;
    claimsCited: number;
    claimsUncitable: number;
    averageRelevance: number;
  };
}

export interface CitationEnhancerConfig {
  /** Minimum relevance score to accept a citation (default: 0.7) */
  minRelevance?: number;

  /** Maximum citations to add per paragraph (default: 5) */
  maxCitationsPerParagraph?: number;

  /** Whether to add page numbers when available (default: true) */
  includePageNumbers?: boolean;

  /** Citation style (default: 'apa') */
  style?: 'apa' | 'mla' | 'chicago';

  /** Corpus search function */
  corpusSearchFn?: (query: string, topK: number) => Promise<CorpusResult[]>;
}

export interface CorpusResult {
  /** Document ID */
  docId: string;

  /** Content/text */
  content: string;

  /** Metadata */
  metadata: {
    author: string;
    title: string;
    year: number;
    page_start?: number;
    page_end?: number;
  };

  /** Relevance score */
  score: number;
}

// ============================================================================
// Patterns for Claim Detection
// ============================================================================

// Claims that typically need citations
const CLAIM_PATTERNS: Array<{ pattern: RegExp; type: UncitedClaim['claimType']; confidence: number }> = [
  // Statistical claims
  { pattern: /\b\d+(\.\d+)?%?\s+(of|percent)\s+\w+/gi, type: 'statistical', confidence: 0.95 },
  { pattern: /\b(research|studies|data|surveys?)\s+(shows?|indicates?|reveals?|suggests?|demonstrates?)/gi, type: 'factual', confidence: 0.9 },
  { pattern: /\b(according\s+to)\s+(recent\s+)?(research|studies|data)/gi, type: 'factual', confidence: 0.95 },

  // Historical claims
  { pattern: /\b(in\s+\d{4}|during\s+the\s+\d{4}s?|historically)/gi, type: 'historical', confidence: 0.85 },
  { pattern: /\b(was\s+(first\s+)?(discovered|invented|developed|introduced|proposed))/gi, type: 'historical', confidence: 0.9 },

  // Attribution claims
  { pattern: /\b(\w+)\s+(argued?|claimed?|stated?|proposed?|suggested?|contended?)\s+that/gi, type: 'attribution', confidence: 0.85 },
  { pattern: /\b(the\s+)?(theory|concept|model|framework)\s+(of|developed|proposed)\s+by/gi, type: 'attribution', confidence: 0.9 },

  // Definition claims
  { pattern: /\b(is\s+defined\s+as|refers?\s+to|means?)\b/gi, type: 'definition', confidence: 0.8 },
  { pattern: /\b(the\s+term|the\s+concept|the\s+notion)\s+of/gi, type: 'definition', confidence: 0.75 },

  // Factual assertions
  { pattern: /\b(has\s+been\s+(shown|demonstrated|proven|established))\b/gi, type: 'factual', confidence: 0.9 },
  { pattern: /\b(evidence\s+(suggests|indicates|shows))\b/gi, type: 'factual', confidence: 0.95 },
];

// Patterns indicating author's own claims (don't need external citation)
const OWN_CLAIM_PATTERNS = [
  /\b(i\s+(argue|contend|propose|suggest|believe|maintain)\s+that)/gi,
  /\b(my\s+(argument|thesis|claim|position)\s+is)/gi,
  /\b(this\s+(paper|dissertation|thesis|study)\s+(argues?|proposes?))/gi,
  /\b(as\s+(i|we)\s+(have\s+)?(shown|demonstrated|argued))/gi,
];

// ============================================================================
// CitationEnhancer Class
// ============================================================================

/**
 * Enhances academic text by adding citations to uncited claims
 */
export class CitationEnhancer {
  private readonly logger: StructuredLogger;
  private readonly config: Required<CitationEnhancerConfig>;

  constructor(config: CitationEnhancerConfig = {}) {
    this.logger = createComponentLogger('CitationEnhancer');
    this.config = {
      minRelevance: config.minRelevance ?? 0.7,
      maxCitationsPerParagraph: config.maxCitationsPerParagraph ?? 5,
      includePageNumbers: config.includePageNumbers ?? true,
      style: config.style ?? 'apa',
      corpusSearchFn: config.corpusSearchFn ?? this.defaultCorpusSearch.bind(this),
    };
  }

  /**
   * Enhance text with citations from corpus
   */
  async enhance(text: string): Promise<EnhancementResult> {
    this.logger.info('Starting citation enhancement', { textLength: text.length });

    // Step 1: Identify uncited claims
    const claims = this.identifyUncitedClaims(text);
    this.logger.info('Claims identified', { count: claims.length });

    // Step 2: Find citations for each claim
    const suggestions: CitationSuggestion[] = [];
    const uncitedClaims: UncitedClaim[] = [];

    for (const claim of claims) {
      const suggestion = await this.findCitationForClaim(claim);
      if (suggestion && suggestion.relevance >= this.config.minRelevance) {
        suggestions.push(suggestion);
      } else {
        uncitedClaims.push(claim);
      }
    }

    // Step 3: Apply citations to text
    const enhancedText = this.applyCitations(text, suggestions);

    // Step 4: Calculate statistics
    const avgRelevance = suggestions.length > 0
      ? suggestions.reduce((sum, s) => sum + s.relevance, 0) / suggestions.length
      : 0;

    const result: EnhancementResult = {
      enhancedText,
      citationsAdded: suggestions.length,
      enhancements: suggestions,
      uncitedClaims,
      stats: {
        claimsIdentified: claims.length,
        claimsCited: suggestions.length,
        claimsUncitable: uncitedClaims.length,
        averageRelevance: avgRelevance,
      },
    };

    this.logger.info('Enhancement complete', {
      citationsAdded: result.citationsAdded,
      uncitedClaims: uncitedClaims.length,
    });

    return result;
  }

  /**
   * Identify claims in text that need citations
   */
  identifyUncitedClaims(text: string): UncitedClaim[] {
    const claims: UncitedClaim[] = [];
    const lines = text.split('\n');
    let currentPosition = 0;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      // Skip if line already has citations
      if (this.hasCitation(line)) {
        currentPosition += line.length + 1;
        continue;
      }

      // Check each claim pattern
      for (const { pattern, type, confidence } of CLAIM_PATTERNS) {
        // Reset regex
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(line)) !== null) {
          // Check if this is the author's own claim
          if (this.isOwnClaim(line)) {
            continue;
          }

          // Extract claim context (surrounding sentence)
          const claimText = this.extractClaimContext(line, match.index);

          claims.push({
            text: claimText,
            position: currentPosition + match.index,
            line: lineNum + 1,
            claimType: type,
            confidence,
          });
        }
      }

      currentPosition += line.length + 1;
    }

    // Deduplicate overlapping claims
    return this.deduplicateClaims(claims);
  }

  /**
   * Find a citation for a specific claim
   */
  async findCitationForClaim(claim: UncitedClaim): Promise<CitationSuggestion | null> {
    // Search corpus for relevant content
    const results = await this.config.corpusSearchFn(claim.text, 5);

    if (results.length === 0) {
      return null;
    }

    // Find best match
    const bestMatch = results[0];

    if (bestMatch.score < this.config.minRelevance) {
      return null;
    }

    // Format citation based on style
    const citation = this.formatCitation(bestMatch.metadata, this.config.style);

    return {
      claim,
      citation,
      source: {
        author: bestMatch.metadata.author,
        year: bestMatch.metadata.year,
        title: bestMatch.metadata.title,
        page: bestMatch.metadata.page_start,
        docId: bestMatch.docId,
      },
      relevance: bestMatch.score,
      supportingQuote: this.extractSupportingQuote(bestMatch.content, claim.text),
    };
  }

  /**
   * Apply citations to text
   */
  private applyCitations(text: string, suggestions: CitationSuggestion[]): string {
    if (suggestions.length === 0) {
      return text;
    }

    // Sort by position (descending) to avoid offset issues
    const sorted = [...suggestions].sort((a, b) => b.claim.position - a.claim.position);

    let result = text;

    // Group by paragraph to respect maxCitationsPerParagraph
    const paragraphs = text.split(/\n\n+/);
    const citationsPerParagraph = new Map<number, number>();

    for (const suggestion of sorted) {
      // Find which paragraph this claim is in
      let charCount = 0;
      let paragraphIndex = 0;
      for (let i = 0; i < paragraphs.length; i++) {
        if (suggestion.claim.position < charCount + paragraphs[i].length) {
          paragraphIndex = i;
          break;
        }
        charCount += paragraphs[i].length + 2; // +2 for \n\n
      }

      // Check citation limit per paragraph
      const currentCount = citationsPerParagraph.get(paragraphIndex) || 0;
      if (currentCount >= this.config.maxCitationsPerParagraph) {
        continue;
      }

      // Find insertion point (end of sentence containing claim)
      const insertionPoint = this.findInsertionPoint(result, suggestion.claim.position, suggestion.claim.text);

      // Insert citation
      result = result.slice(0, insertionPoint) + ' ' + suggestion.citation + result.slice(insertionPoint);

      citationsPerParagraph.set(paragraphIndex, currentCount + 1);
    }

    return result;
  }

  /**
   * Check if line already has a citation
   */
  private hasCitation(line: string): boolean {
    // APA patterns
    if (/\([A-Z][a-z]+,?\s*\d{4}\)/.test(line)) return true;
    if (/\([A-Z][a-z]+\s+et\s+al\.,?\s*\d{4}\)/.test(line)) return true;

    return false;
  }

  /**
   * Check if this is the author's own claim
   */
  private isOwnClaim(line: string): boolean {
    return OWN_CLAIM_PATTERNS.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });
  }

  /**
   * Extract claim context (surrounding sentence)
   */
  private extractClaimContext(line: string, position: number): string {
    // Find sentence boundaries
    const sentences = line.split(/(?<=[.!?])\s+/);
    let charCount = 0;

    for (const sentence of sentences) {
      if (position >= charCount && position < charCount + sentence.length) {
        return sentence.trim();
      }
      charCount += sentence.length + 1;
    }

    // Fallback: return substring around position
    const start = Math.max(0, position - 50);
    const end = Math.min(line.length, position + 100);
    return line.slice(start, end).trim();
  }

  /**
   * Deduplicate overlapping claims
   */
  private deduplicateClaims(claims: UncitedClaim[]): UncitedClaim[] {
    if (claims.length <= 1) return claims;

    // Sort by position
    const sorted = [...claims].sort((a, b) => a.position - b.position);
    const result: UncitedClaim[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const previous = result[result.length - 1];

      // Check for overlap (within 20 characters)
      if (current.position - previous.position > 20) {
        result.push(current);
      } else if (current.confidence > previous.confidence) {
        // Keep higher confidence claim
        result[result.length - 1] = current;
      }
    }

    return result;
  }

  /**
   * Format citation according to style guide
   */
  private formatCitation(
    metadata: { author: string; year: number; page_start?: number },
    style: 'apa' | 'mla' | 'chicago'
  ): string {
    const { author, year, page_start } = metadata;

    // Extract last name
    const lastName = author.split(/[,\s]+/)[0];

    switch (style) {
      case 'apa':
        if (page_start && this.config.includePageNumbers) {
          return `(${lastName}, ${year}, p. ${page_start})`;
        }
        return `(${lastName}, ${year})`;

      case 'mla':
        if (page_start && this.config.includePageNumbers) {
          return `(${lastName} ${page_start})`;
        }
        return `(${lastName})`;

      case 'chicago':
        if (page_start && this.config.includePageNumbers) {
          return `(${lastName} ${year}, ${page_start})`;
        }
        return `(${lastName} ${year})`;

      default:
        return `(${lastName}, ${year})`;
    }
  }

  /**
   * Find insertion point for citation (end of sentence)
   */
  private findInsertionPoint(text: string, claimPosition: number, claimText: string): number {
    // Find the sentence end after the claim
    const afterClaim = text.slice(claimPosition);
    const sentenceEndMatch = afterClaim.match(/[.!?](?=\s|$)/);

    if (sentenceEndMatch) {
      return claimPosition + sentenceEndMatch.index! + 1;
    }

    // Fallback: end of claim text
    return claimPosition + claimText.length;
  }

  /**
   * Extract a supporting quote from source content
   */
  private extractSupportingQuote(content: string, claimText: string): string | undefined {
    // Extract key terms from claim
    const keyTerms = claimText
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 5);

    if (keyTerms.length === 0) return undefined;

    // Find sentence with most key terms
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);

    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      let score = 0;

      for (const term of keyTerms) {
        if (lowerSentence.includes(term)) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }

    return bestScore > 0 ? bestSentence.slice(0, 200) : undefined;
  }

  /**
   * Default corpus search (returns empty - override with actual implementation)
   */
  private async defaultCorpusSearch(_query: string, _topK: number): Promise<CorpusResult[]> {
    // This is a placeholder - should be replaced with actual corpus search
    this.logger.warn('Using default corpus search (returns empty). Configure corpusSearchFn for actual results.');
    return [];
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a citation enhancer with default configuration
 */
export function createDefaultEnhancer(): CitationEnhancer {
  return new CitationEnhancer();
}

/**
 * Create a citation enhancer with strict requirements
 */
export function createStrictEnhancer(): CitationEnhancer {
  return new CitationEnhancer({
    minRelevance: 0.85,
    maxCitationsPerParagraph: 3,
    includePageNumbers: true,
  });
}

/**
 * Create a citation enhancer for draft content (more lenient)
 */
export function createDraftEnhancer(): CitationEnhancer {
  return new CitationEnhancer({
    minRelevance: 0.6,
    maxCitationsPerParagraph: 8,
    includePageNumbers: false,
  });
}
