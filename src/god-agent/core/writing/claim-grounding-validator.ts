/**
 * Claim Grounding Validator (Phase 8: Paraphrase Grounding Verification)
 *
 * Ensures that all paraphrased claims attributed to authors are actually
 * grounded in the corpus content for that author. This catches fabricated
 * attributions where the author is valid but the claim is not.
 *
 * Example issue this solves:
 * - Generated: "Rickert suggests that phantasia discloses..."
 * - Rickert IS in corpus (passes Phase 4)
 * - But Rickert's corpus text doesn't discuss phantasia
 * - Result: Fabricated attribution detected and flagged
 */

import type { CorpusSource } from './writing-generator.js';
import type { ContextChunk } from './corpus-constraint-builder.js';

/**
 * Extracted attributed claim from text
 */
export interface ExtractedClaim {
  /** The full sentence/phrase containing the attribution */
  fullText: string;
  /** The author being cited */
  author: string;
  /** The claim being attributed to the author */
  claimContent: string;
  /** Position in content (character index) */
  position: number;
  /** Line number in content */
  line: number;
  /** Type of attribution */
  attributionType: 'suggests' | 'argues' | 'claims' | 'notes' | 'observes' | 'states' | 'contends' | 'maintains' | 'proposes' | 'develops' | 'other';
}

/**
 * Result of validating a single claim's grounding
 */
export interface ClaimGroundingResult {
  /** The extracted claim */
  claim: ExtractedClaim;
  /** Whether the claim is grounded in corpus */
  isGrounded: boolean;
  /** Best matching corpus chunk if found */
  bestMatch?: {
    chunk: ContextChunk;
    relevanceScore: number;
    matchingText: string;
  };
  /** Reason if not grounded */
  reason?: string;
  /** Suggested corpus-grounded alternative */
  suggestedAlternative?: string;
  /** Keywords from the claim */
  claimKeywords: string[];
  /** Keywords found in author's corpus */
  authorCorpusKeywords: string[];
  /** Topic overlap score (0-1) */
  topicOverlapScore: number;
}

/**
 * Full validation result for all claims
 */
export interface ClaimGroundingValidationResult {
  /** All grounded claims */
  grounded: ClaimGroundingResult[];
  /** All ungrounded claims (fabricated attributions) */
  ungrounded: ClaimGroundingResult[];
  /** Claims where author has no corpus chunks */
  noCorpusContent: ClaimGroundingResult[];
  /** Grounding rate (grounded / total) */
  groundingRate: number;
  /** Total claims found */
  totalClaims: number;
  /** Summary */
  summary: string;
}

/**
 * Options for claim grounding validation
 */
export interface ClaimGroundingOptions {
  /** Minimum topic overlap score to consider grounded (default: 0.3) */
  minTopicOverlap?: number;
  /** Minimum keyword match ratio (default: 0.2) */
  minKeywordMatch?: number;
  /** Whether to generate suggested alternatives (default: true) */
  suggestAlternatives?: boolean;
  /** Maximum character distance for attribution context (default: 500) */
  attributionContextRadius?: number;
}

const DEFAULT_OPTIONS: Required<ClaimGroundingOptions> = {
  minTopicOverlap: 0.3,
  minKeywordMatch: 0.2,
  suggestAlternatives: true,
  attributionContextRadius: 500,
};

/**
 * Attribution verbs and phrases to detect
 */
const ATTRIBUTION_PATTERNS = [
  // Direct attribution verbs
  /(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?)\s+(?<verb>suggests?|argues?|claims?|notes?|observes?|states?|contends?|maintains?|proposes?|develops?|explains?|shows?|demonstrates?|indicates?|asserts?|emphasizes?|highlights?|points?\s+out|describes?|discusses?|explores?|examines?|considers?|posits?)\s+that\s+(?<claim>[^.]+\.)/gi,
  // According to pattern
  /according\s+to\s+(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?),?\s+(?<claim>[^.]+\.)/gi,
  // For author pattern
  /for\s+(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?),?\s+(?<claim>[^.]+\.)/gi,
  // As author verb pattern
  /as\s+(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?)\s+(?<verb>notes?|observes?|shows?|demonstrates?|argues?),?\s+(?<claim>[^.]+\.)/gi,
  // Author's concept/term/analysis pattern
  /(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?)'s\s+(?:concept|notion|analysis|theory|account|view|argument|claim|thesis|position)\s+(?:of|that|about)\s+(?<claim>[^.]+\.)/gi,
  // Developing themes pattern (matches the Rickert case)
  /(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?),?\s+(?<verb>developing|building\s+on|extending|drawing\s+on)\s+(?:these|those|such)?\s*(?:themes?|ideas?|concepts?)?,?\s+(?<claim>[^.]+\.)/gi,
];

/**
 * Stopwords to filter from keyword extraction
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
  'their', 'he', 'she', 'his', 'her', 'we', 'our', 'you', 'your', 'i', 'my', 'me',
  'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'if',
  'then', 'than', 'so', 'just', 'also', 'only', 'even', 'more', 'most', 'such',
  'not', 'no', 'nor', 'both', 'each', 'all', 'any', 'some', 'every', 'other',
]);

/**
 * Claim Grounding Validator
 *
 * Validates that paraphrased claims attributed to authors are actually
 * grounded in the corpus content for that author.
 */
export class ClaimGroundingValidator {
  private corpusSources: CorpusSource[];
  private corpusChunks: ContextChunk[];
  private options: Required<ClaimGroundingOptions>;
  private authorChunksMap: Map<string, ContextChunk[]>;

  constructor(
    corpusSources: CorpusSource[],
    corpusChunks: ContextChunk[],
    options: ClaimGroundingOptions = {}
  ) {
    this.corpusSources = corpusSources;
    this.corpusChunks = corpusChunks;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Build author -> chunks map for efficient lookup
    this.authorChunksMap = this.buildAuthorChunksMap();
  }

  /**
   * Build a map of author names to their corpus chunks
   */
  private buildAuthorChunksMap(): Map<string, ContextChunk[]> {
    const map = new Map<string, ContextChunk[]>();

    for (const chunk of this.corpusChunks) {
      const author = chunk.metadata?.author;
      if (!author) continue;

      // Normalize author name (last name only for matching)
      const normalizedAuthor = this.normalizeAuthorName(author);

      if (!map.has(normalizedAuthor)) {
        map.set(normalizedAuthor, []);
      }
      map.get(normalizedAuthor)!.push(chunk);
    }

    return map;
  }

  /**
   * Normalize author name for matching
   */
  private normalizeAuthorName(name: string): string {
    // Handle "Last, First" format
    if (name.includes(',')) {
      return name.split(',')[0].trim().toLowerCase();
    }
    // Handle "First Last" format - take last word
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Validate all claims in content
   */
  async validate(content: string): Promise<ClaimGroundingValidationResult> {
    const claims = this.extractClaims(content);
    const results: ClaimGroundingResult[] = [];

    for (const claim of claims) {
      const result = await this.validateClaim(claim);
      results.push(result);
    }

    const grounded = results.filter(r => r.isGrounded);
    const ungrounded = results.filter(r => !r.isGrounded && r.reason !== 'No corpus content for author');
    const noCorpusContent = results.filter(r => r.reason === 'No corpus content for author');

    const groundingRate = claims.length > 0 ? grounded.length / claims.length : 1;

    return {
      grounded,
      ungrounded,
      noCorpusContent,
      groundingRate,
      totalClaims: claims.length,
      summary: this.generateSummary(grounded.length, ungrounded.length, noCorpusContent.length),
    };
  }

  /**
   * Extract all attributed claims from content
   */
  private extractClaims(content: string): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];
    const lines = content.split('\n');
    let charOffset = 0;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const pattern of ATTRIBUTION_PATTERNS) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const author = match.groups?.author || '';
          const claimContent = match.groups?.claim || '';
          const verb = match.groups?.verb || 'other';

          if (author && claimContent) {
            claims.push({
              fullText: match[0],
              author: author.trim(),
              claimContent: claimContent.trim(),
              position: charOffset + match.index,
              line: lineNum + 1,
              attributionType: this.categorizeVerb(verb),
            });
          }
        }
      }

      charOffset += line.length + 1; // +1 for newline
    }

    return claims;
  }

  /**
   * Categorize attribution verb
   */
  private categorizeVerb(verb: string): ExtractedClaim['attributionType'] {
    const normalized = verb.toLowerCase().trim();

    if (/suggests?/.test(normalized)) return 'suggests';
    if (/argues?/.test(normalized)) return 'argues';
    if (/claims?/.test(normalized)) return 'claims';
    if (/notes?/.test(normalized)) return 'notes';
    if (/observes?/.test(normalized)) return 'observes';
    if (/states?/.test(normalized)) return 'states';
    if (/contends?/.test(normalized)) return 'contends';
    if (/maintains?/.test(normalized)) return 'maintains';
    if (/proposes?/.test(normalized)) return 'proposes';
    if (/develops?|developing/.test(normalized)) return 'develops';

    return 'other';
  }

  /**
   * Validate a single claim against corpus
   */
  private async validateClaim(claim: ExtractedClaim): Promise<ClaimGroundingResult> {
    const normalizedAuthor = this.normalizeAuthorName(claim.author);
    const authorChunks = this.authorChunksMap.get(normalizedAuthor);

    // Check if author has any corpus content
    if (!authorChunks || authorChunks.length === 0) {
      return {
        claim,
        isGrounded: false,
        reason: 'No corpus content for author',
        claimKeywords: this.extractKeywords(claim.claimContent),
        authorCorpusKeywords: [],
        topicOverlapScore: 0,
      };
    }

    // Extract keywords from the claim
    const claimKeywords = this.extractKeywords(claim.claimContent);

    // Search for matching content in author's chunks
    let bestMatch: ClaimGroundingResult['bestMatch'] | undefined;
    let bestScore = 0;
    const allAuthorKeywords = new Set<string>();

    for (const chunk of authorChunks) {
      const chunkKeywords = this.extractKeywords(chunk.content);
      chunkKeywords.forEach(kw => allAuthorKeywords.add(kw));

      const overlapScore = this.calculateKeywordOverlap(claimKeywords, chunkKeywords);
      const semanticScore = this.calculateSemanticSimilarity(claim.claimContent, chunk.content);
      const combinedScore = (overlapScore * 0.4) + (semanticScore * 0.6);

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestMatch = {
          chunk,
          relevanceScore: combinedScore,
          matchingText: this.extractRelevantSnippet(chunk.content, claimKeywords),
        };
      }
    }

    const isGrounded = bestScore >= this.options.minTopicOverlap;

    return {
      claim,
      isGrounded,
      bestMatch: bestMatch && bestScore >= this.options.minTopicOverlap ? bestMatch : undefined,
      reason: isGrounded ? undefined : `Claim topic not found in ${claim.author}'s corpus content`,
      suggestedAlternative: !isGrounded && this.options.suggestAlternatives
        ? this.generateAlternative(claim, authorChunks)
        : undefined,
      claimKeywords,
      authorCorpusKeywords: Array.from(allAuthorKeywords).slice(0, 20),
      topicOverlapScore: bestScore,
    };
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOPWORDS.has(word));

    // Also extract compound terms (2-3 word phrases)
    const compounds: string[] = [];
    const tokens = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < tokens.length - 1; i++) {
      if (!STOPWORDS.has(tokens[i]) && !STOPWORDS.has(tokens[i + 1])) {
        compounds.push(`${tokens[i]} ${tokens[i + 1]}`);
      }
    }

    return [...new Set([...words, ...compounds])];
  }

  /**
   * Calculate keyword overlap between claim and chunk
   */
  private calculateKeywordOverlap(claimKeywords: string[], chunkKeywords: string[]): number {
    if (claimKeywords.length === 0) return 0;

    const chunkKeywordSet = new Set(chunkKeywords);
    let matches = 0;

    for (const keyword of claimKeywords) {
      if (chunkKeywordSet.has(keyword)) {
        matches++;
      }
      // Also check for partial matches (keyword contained in chunk keyword)
      for (const chunkKw of chunkKeywords) {
        if (chunkKw.includes(keyword) || keyword.includes(chunkKw)) {
          matches += 0.5;
          break;
        }
      }
    }

    return Math.min(1, matches / claimKeywords.length);
  }

  /**
   * Calculate semantic similarity (simple implementation)
   * Could be enhanced with embeddings in the future
   */
  private calculateSemanticSimilarity(claimText: string, chunkText: string): number {
    const claimWords = new Set(claimText.toLowerCase().split(/\s+/).filter(w => !STOPWORDS.has(w)));
    const chunkWords = new Set(chunkText.toLowerCase().split(/\s+/).filter(w => !STOPWORDS.has(w)));

    let intersection = 0;
    for (const word of claimWords) {
      if (chunkWords.has(word)) {
        intersection++;
      }
    }

    const union = claimWords.size + chunkWords.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Extract relevant snippet from chunk that matches keywords
   */
  private extractRelevantSnippet(chunkText: string, keywords: string[]): string {
    const sentences = chunkText.split(/[.!?]+/);
    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      const sentenceKeywords = this.extractKeywords(sentence);
      const score = this.calculateKeywordOverlap(keywords, sentenceKeywords);
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence.trim();
      }
    }

    return bestSentence.length > 200
      ? bestSentence.substring(0, 200) + '...'
      : bestSentence;
  }

  /**
   * Generate alternative claim suggestion based on actual corpus content
   */
  private generateAlternative(claim: ExtractedClaim, authorChunks: ContextChunk[]): string {
    // Find what the author actually discusses
    const topics = new Set<string>();

    for (const chunk of authorChunks) {
      const keywords = this.extractKeywords(chunk.content);
      keywords.slice(0, 5).forEach(kw => topics.add(kw));
    }

    const topTopics = Array.from(topics).slice(0, 5).join(', ');

    return `Consider reframing: ${claim.author}'s corpus content discusses: ${topTopics}. ` +
           `The current claim about "${claim.claimContent.substring(0, 50)}..." may not be grounded.`;
  }

  /**
   * Generate summary of validation results
   */
  private generateSummary(
    groundedCount: number,
    ungroundedCount: number,
    noCorpusCount: number
  ): string {
    const totalCount = groundedCount + ungroundedCount + noCorpusCount;

    if (totalCount === 0) {
      return 'No attributed claims found in content.';
    }

    if (groundedCount === totalCount) {
      return `All ${groundedCount} attributed claim(s) are grounded in corpus sources.`;
    }

    const parts: string[] = [];

    if (groundedCount > 0) {
      parts.push(`${groundedCount} grounded`);
    }

    if (ungroundedCount > 0) {
      parts.push(`${ungroundedCount} ungrounded (FABRICATED ATTRIBUTIONS)`);
    }

    if (noCorpusCount > 0) {
      parts.push(`${noCorpusCount} authors without corpus content`);
    }

    return `Claim grounding: ${parts.join(', ')} out of ${totalCount} total.`;
  }
}
