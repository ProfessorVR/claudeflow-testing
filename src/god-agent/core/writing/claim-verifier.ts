/**
 * Claim Verifier (Phase C: Comprehensive Claim Validation System)
 *
 * Verifies claims against corpus evidence with four-class verdicts.
 * Integrates with EntailmentClassifier for typed entailment relations.
 * Supports hybrid evidence retrieval (dense + sparse).
 *
 * Four-Class Verification System:
 * - SUPPORTED: Claim fully supported by corpus evidence
 * - PARTIALLY_SUPPORTED: Some aspects supported, others not
 * - UNSUPPORTED: No evidence found (may be fabricated)
 * - CONTRADICTED: Corpus evidence contradicts claim
 * - UNCERTAIN: Insufficient evidence to determine
 *
 * @module claim-verifier
 */

import { type DetectedClaim } from './claim-detector.js';
import { type AtomicClaim, ClaimDecomposer } from './claim-decomposer.js';
import { type ContextChunk } from './corpus-constraint-builder.js';
import { type CorpusSource } from './writing-generator.js';
import {
  EntailmentClassifier,
  type EntailmentRelation,
  EntailmentRelationTypeEnum,
} from './entailment/index.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Verification verdict types
 *
 * IMPORTANT: BLOCKED is distinct from UNSUPPORTED:
 * - BLOCKED: "Couldn't form stable proposition" (semantic failure)
 *   - Does NOT count against support rate
 *   - Does NOT trigger corpus search
 *   - User feedback: "Fix upstream referent"
 *
 * - UNSUPPORTED: "We tried, found nothing" (epistemic failure)
 *   - Counts against support rate
 *   - Corpus search was performed
 *   - User feedback: "Add a citation"
 */
export type VerificationVerdict =
  | 'SUPPORTED'           // Claim fully supported by corpus evidence
  | 'PARTIALLY_SUPPORTED' // Some aspects supported, others not
  | 'UNSUPPORTED'         // No evidence found (may be fabricated)
  | 'CONTRADICTED'        // Corpus evidence contradicts claim
  | 'UNCERTAIN'           // Insufficient evidence to determine
  | 'BLOCKED';            // Couldn't form stable proposition due to unresolved referent

/**
 * Result of verifying a single claim
 */
export interface VerificationResult {
  /** The verdict */
  verdict: VerificationVerdict;

  /** Confidence in the verdict (0-1) */
  confidence: number;

  /** Evidence matches found */
  evidence: EvidenceMatch[];

  /** Entailment relation with best evidence */
  entailment?: EntailmentRelation;

  /** Human-readable reasoning for the verdict */
  reasoning: string;

  /** Suggestions for fixing unsupported/contradicted claims */
  suggestions?: string[];

  /** Metrics about the verification process */
  metrics: VerificationMetrics;

  /** For BLOCKED verdicts: the specific reason and upstream claim ID to fix */
  blockedReason?: {
    /** Why the claim was blocked */
    reason: 'unresolved_referent' | 'failed_dependency' | 'ambiguous_referent';
    /** The unresolved token or dependency that caused the block */
    unresolvedToken?: string;
    /** ID of upstream claim that needs to be fixed first */
    upstreamClaimId?: string;
    /** Human-readable instructions for fixing */
    fixInstructions: string;
  };

  /** Whether corpus search was skipped (for BLOCKED verdicts) */
  corpusSearchSkipped?: boolean;
}

/**
 * Evidence match from corpus
 */
export interface EvidenceMatch {
  /** The corpus chunk */
  chunk: ContextChunk;

  /** Semantic relevance score (0-1) */
  relevanceScore: number;

  /** Entailment score (0-1) */
  entailmentScore: number;

  /** How this evidence relates to the claim */
  matchType: 'supports' | 'partially_supports' | 'contradicts' | 'irrelevant';

  /** Key overlapping terms */
  overlappingTerms: string[];

  /** Snippet of matching text */
  matchingSnippet: string;
}

/**
 * Metrics from verification process
 */
export interface VerificationMetrics {
  /** Number of chunks searched */
  chunksSearched: number;

  /** Number of potential matches found */
  potentialMatches: number;

  /** Time taken in milliseconds */
  timeTakenMs: number;

  /** Author constraint applied */
  authorConstrained: boolean;
}

/**
 * Result of verifying a composite claim (with decomposition)
 */
export interface CompositeVerificationResult {
  /** Original claim */
  original: DetectedClaim;

  /** Verification of each atomic subclaim */
  atomicResults: Array<{
    atomic: AtomicClaim;
    result: VerificationResult;
  }>;

  /** Aggregated verdict */
  aggregatedVerdict: VerificationVerdict;

  /** Overall confidence */
  overallConfidence: number;

  /** Combined reasoning */
  combinedReasoning: string;

  /** Whether decomposition was used */
  wasDecomposed: boolean;
}

/**
 * Corpus retriever interface
 */
export interface CorpusRetriever {
  /** Search corpus with query */
  search(query: string, options?: RetrievalOptions): Promise<ContextChunk[]>;
}

/**
 * Retrieval options
 */
export interface RetrievalOptions {
  /** Maximum results to return */
  topK?: number;
  /** Filter by author */
  author?: string;
  /** Minimum relevance threshold */
  minRelevance?: number;
  /** Use hybrid retrieval (dense + sparse) */
  hybrid?: boolean;
}

/**
 * Verifier options
 */
export interface VerifierOptions {
  /** Thresholds for verdict assignment */
  thresholds?: {
    /** Minimum score for SUPPORTED (default: 0.85) */
    supported?: number;
    /** Minimum score for PARTIALLY_SUPPORTED (default: 0.5) */
    partiallySupported?: number;
    /** Score below which is UNSUPPORTED (default: 0.3) */
    unsupported?: number;
    /** Contradiction detection threshold (default: 0.7) */
    contradiction?: number;
  };

  /** Maximum evidence chunks to consider (default: 10) */
  maxEvidence?: number;

  /** Enable decomposition for composite claims (default: true) */
  enableDecomposition?: boolean;

  /** Decomposer options */
  decomposerOptions?: {
    maxDepth?: number;
    enableLLMDecomposition?: boolean;
    apiKey?: string;
  };

  /** Enable debug logging */
  debug?: boolean;

  /** Use hybrid retrieval (default: true) */
  useHybridRetrieval?: boolean;
}

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULT_OPTIONS: Required<Omit<VerifierOptions, 'decomposerOptions'>> & {
  decomposerOptions?: VerifierOptions['decomposerOptions'];
} = {
  thresholds: {
    supported: 0.85,
    partiallySupported: 0.5,
    unsupported: 0.3,
    contradiction: 0.7,
  },
  maxEvidence: 10,
  enableDecomposition: true,
  decomposerOptions: undefined,
  debug: false,
  useHybridRetrieval: true,
};

// =============================================================================
// STOPWORDS FOR KEYWORD EXTRACTION
// =============================================================================

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

// =============================================================================
// CLAIM VERIFIER CLASS
// =============================================================================

/**
 * Claim Verifier for verifying claims against corpus evidence
 */
export class ClaimVerifier {
  private retriever: CorpusRetriever;
  private entailmentClassifier: EntailmentClassifier;
  private decomposer?: ClaimDecomposer;
  private corpusChunks: ContextChunk[];
  private corpusSources: CorpusSource[];
  private options: typeof DEFAULT_OPTIONS;

  constructor(
    retriever: CorpusRetriever,
    corpusChunks: ContextChunk[],
    corpusSources: CorpusSource[],
    options: VerifierOptions = {}
  ) {
    this.retriever = retriever;
    this.corpusChunks = corpusChunks;
    this.corpusSources = corpusSources;
    this.entailmentClassifier = new EntailmentClassifier();
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      thresholds: { ...DEFAULT_OPTIONS.thresholds, ...options.thresholds },
    };

    if (this.options.enableDecomposition) {
      this.decomposer = new ClaimDecomposer(options.decomposerOptions);
    }
  }

  /**
   * Verify a detected claim
   */
  async verify(claim: DetectedClaim | AtomicClaim): Promise<VerificationResult> {
    const startTime = Date.now();

    // FIRST: Check if claim should be BLOCKED (before any corpus search)
    const blockResult = this.checkForBlockedCondition(claim);
    if (blockResult) {
      return {
        verdict: 'BLOCKED',
        confidence: 1.0, // We're certain it's blocked
        evidence: [],
        reasoning: blockResult.reasoning,
        suggestions: [blockResult.fixInstructions],
        blockedReason: {
          reason: blockResult.reason,
          unresolvedToken: blockResult.unresolvedToken,
          upstreamClaimId: blockResult.upstreamClaimId,
          fixInstructions: blockResult.fixInstructions,
        },
        corpusSearchSkipped: true,
        metrics: {
          chunksSearched: 0,
          potentialMatches: 0,
          timeTakenMs: Date.now() - startTime,
          authorConstrained: false,
        },
      };
    }

    // Extract claim text and author constraint
    const claimText = claim.text;
    const authorConstraint = this.extractAuthorConstraint(claim);

    // Retrieve evidence
    const evidence = await this.retrieveEvidence(claimText, authorConstraint);

    // Calculate entailment for each evidence chunk
    const evidenceMatches = await this.calculateEvidenceMatches(claimText, evidence);

    // Sort by relevance
    evidenceMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top evidence
    const topEvidence = evidenceMatches.slice(0, this.options.maxEvidence);

    // Determine verdict
    const { verdict, confidence, reasoning } = this.determineVerdict(
      claimText,
      topEvidence,
      authorConstraint
    );

    // Classify entailment with best evidence
    let entailment: EntailmentRelation | undefined;
    if (topEvidence.length > 0) {
      const bestChunk = topEvidence[0].chunk;
      const classificationResult = await this.entailmentClassifier.classify({
        claimText,
        evidenceChunks: [{
          id: bestChunk.chunkId || 'unknown',
          content: bestChunk.content,
          metadata: bestChunk.metadata,
        }],
      });
      // Get the best relation from the results
      entailment = classificationResult.relations.length > 0
        ? classificationResult.relations[0]
        : undefined;
    }

    // Generate suggestions for problematic verdicts
    const suggestions = this.generateSuggestions(verdict, topEvidence, authorConstraint);

    return {
      verdict,
      confidence,
      evidence: topEvidence,
      entailment,
      reasoning,
      suggestions,
      corpusSearchSkipped: false,
      metrics: {
        chunksSearched: evidence.length,
        potentialMatches: evidenceMatches.filter((e) => e.matchType !== 'irrelevant')
          .length,
        timeTakenMs: Date.now() - startTime,
        authorConstrained: !!authorConstraint,
      },
    };
  }

  /**
   * Check if a claim should be BLOCKED due to unresolved referents or failed dependencies
   */
  private checkForBlockedCondition(claim: DetectedClaim | AtomicClaim): {
    reason: 'unresolved_referent' | 'failed_dependency' | 'ambiguous_referent';
    unresolvedToken?: string;
    upstreamClaimId?: string;
    reasoning: string;
    fixInstructions: string;
  } | null {
    // Check for AtomicClaim with resolution status
    if ('resolutionStatus' in claim) {
      const atomicClaim = claim as AtomicClaim;

      // Check resolution status
      if (atomicClaim.resolutionStatus === 'failed') {
        const unresolvedToken = atomicClaim.resolvedReferents?.[0]?.originalToken;
        return {
          reason: 'unresolved_referent',
          unresolvedToken,
          reasoning: `Claim contains unresolved referent "${unresolvedToken || 'unknown'}" that prevents forming a stable proposition.`,
          fixInstructions: `Replace "${unresolvedToken || 'the referent'}" with an explicit noun phrase. For example, instead of "This view supports X", write "Aristotle's view that φαντασία mediates deliberation supports X".`,
        };
      }

      if (atomicClaim.resolutionStatus === 'needs_disambiguation') {
        const ambiguousToken = atomicClaim.resolvedReferents?.find(r => r.wasAmbiguous)?.originalToken;
        return {
          reason: 'ambiguous_referent',
          unresolvedToken: ambiguousToken,
          reasoning: `Claim contains ambiguous referent "${ambiguousToken || 'unknown'}" with multiple possible antecedents.`,
          fixInstructions: `Clarify which antecedent "${ambiguousToken || 'the referent'}" refers to by using a more specific noun phrase.`,
        };
      }

      // Check for failed dependencies
      if (atomicClaim.dependsOnClaimIds && atomicClaim.dependsOnClaimIds.length > 0) {
        // Note: In a full implementation, we would check if those claims are resolved
        // For now, we track this for future expansion
      }
    }

    // Check for unresolved referent tokens in claim text (fallback detection)
    const unresolvedTokens = this.detectUnresolvedReferents(claim.text);
    if (unresolvedTokens.length > 0) {
      return {
        reason: 'unresolved_referent',
        unresolvedToken: unresolvedTokens[0],
        reasoning: `Claim contains unresolved referent "${unresolvedTokens[0]}" that prevents forming a stable proposition.`,
        fixInstructions: `Replace "${unresolvedTokens[0]}" with an explicit noun phrase to enable verification.`,
      };
    }

    return null;
  }

  /**
   * Detect unresolved referent tokens in text
   */
  private detectUnresolvedReferents(text: string): string[] {
    const unresolved: string[] = [];
    const textLower = text.toLowerCase();

    // Referential blocklist - tokens at sentence start that indicate unresolved coreference
    const sentenceStartBlocklist = ['such', 'these', 'those', 'the former', 'the latter', 'said'];

    // Check if sentence starts with a blocklist token
    for (const token of sentenceStartBlocklist) {
      if (textLower.startsWith(token + ' ') || textLower.startsWith(token + ',')) {
        unresolved.push(token);
      }
    }

    // Check for discourse phrases
    const discoursePatterns = [
      'this position', 'this reading', 'this interpretation',
      'this conceptualization', 'this understanding', 'this formulation',
      'this notion', 'this concept', 'this distinction', 'this observation',
    ];

    for (const phrase of discoursePatterns) {
      if (textLower.includes(phrase)) {
        unresolved.push(phrase);
      }
    }

    return unresolved;
  }

  /**
   * Verify a claim with decomposition
   */
  async verifyWithDecomposition(claim: DetectedClaim): Promise<CompositeVerificationResult> {
    // If decomposition disabled or no decomposer, verify directly
    if (!this.options.enableDecomposition || !this.decomposer) {
      const result = await this.verify(claim);
      return {
        original: claim,
        atomicResults: [
          {
            atomic: {
              id: claim.id,
              text: claim.text,
              context: claim.context.surrounding,
              parentClaimId: claim.id,
              profile: claim.profile,
              requiresAttribution: false,
              decompositionPath: [claim.id],
              sequenceIndex: 0,
              resolutionStatus: 'resolved' as const,
              dependsOnClaimIds: [],
              metadata: {
                relationToParent: 'component',
                contextAdded: false,
              },
            },
            result,
          },
        ],
        aggregatedVerdict: result.verdict,
        overallConfidence: result.confidence,
        combinedReasoning: result.reasoning,
        wasDecomposed: false,
      };
    }

    // Decompose the claim
    const decomposition = await this.decomposer.decompose(claim);

    // Verify each atomic claim
    const atomicResults: CompositeVerificationResult['atomicResults'] = [];
    for (const atomic of decomposition.atomicClaims) {
      const result = await this.verify(atomic);
      atomicResults.push({ atomic, result });
    }

    // Aggregate verdicts
    const { verdict, confidence } = this.aggregateVerdicts(
      atomicResults.map((r) => r.result)
    );

    // Combine reasoning
    const combinedReasoning = this.combineReasoning(atomicResults);

    return {
      original: claim,
      atomicResults,
      aggregatedVerdict: verdict,
      overallConfidence: confidence,
      combinedReasoning,
      wasDecomposed: decomposition.wasDecomposed,
    };
  }

  /**
   * Extract author constraint from claim
   */
  private extractAuthorConstraint(claim: DetectedClaim | AtomicClaim): string | undefined {
    // Check for direct attribution
    if ('profile' in claim && claim.profile.attribution.authors?.length) {
      return claim.profile.attribution.authors[0];
    }

    // Check for inherited attribution in detected claim
    if ('context' in claim && typeof claim.context === 'object' && claim.context !== null) {
      const ctx = claim.context as { inheritedAttribution?: string };
      if (ctx.inheritedAttribution) {
        return ctx.inheritedAttribution;
      }
    }

    return undefined;
  }

  /**
   * Retrieve evidence from corpus
   */
  private async retrieveEvidence(
    query: string,
    authorConstraint?: string
  ): Promise<ContextChunk[]> {
    // If we have a retriever with search capability
    try {
      const results = await this.retriever.search(query, {
        topK: this.options.maxEvidence * 2, // Get more, filter later
        author: authorConstraint,
        hybrid: this.options.useHybridRetrieval,
      });
      return results;
    } catch {
      // Fallback to local search if retriever fails
      return this.localSearch(query, authorConstraint);
    }
  }

  /**
   * Local fallback search using keyword matching
   */
  private localSearch(query: string, authorConstraint?: string): ContextChunk[] {
    const queryKeywords = this.extractKeywords(query);
    const scored: Array<{ chunk: ContextChunk; score: number }> = [];

    for (const chunk of this.corpusChunks) {
      // Filter by author if constrained
      if (authorConstraint) {
        const chunkAuthor = chunk.metadata?.author?.toLowerCase() || '';
        if (!chunkAuthor.includes(authorConstraint.toLowerCase())) {
          continue;
        }
      }

      // Calculate keyword overlap
      const chunkKeywords = this.extractKeywords(chunk.content);
      const overlap = this.calculateKeywordOverlap(queryKeywords, chunkKeywords);

      if (overlap > 0.1) {
        scored.push({ chunk, score: overlap });
      }
    }

    // Sort by score and return top results
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, this.options.maxEvidence * 2).map((s) => s.chunk);
  }

  /**
   * Calculate evidence matches with entailment
   */
  private async calculateEvidenceMatches(
    claimText: string,
    evidence: ContextChunk[]
  ): Promise<EvidenceMatch[]> {
    const matches: EvidenceMatch[] = [];
    const claimKeywords = this.extractKeywords(claimText);

    for (const chunk of evidence) {
      const chunkKeywords = this.extractKeywords(chunk.content);

      // Calculate scores
      const relevanceScore = this.calculateKeywordOverlap(claimKeywords, chunkKeywords);
      const entailmentScore = this.calculateSimpleEntailment(claimText, chunk.content);

      // Determine match type
      const matchType = this.classifyMatchType(relevanceScore, entailmentScore, claimText, chunk.content);

      // Extract overlapping terms
      const overlappingTerms = claimKeywords.filter((kw) =>
        chunkKeywords.some((ckw) => ckw.includes(kw) || kw.includes(ckw))
      );

      // Extract matching snippet
      const matchingSnippet = this.extractMatchingSnippet(chunk.content, claimKeywords);

      matches.push({
        chunk,
        relevanceScore,
        entailmentScore,
        matchType,
        overlappingTerms,
        matchingSnippet,
      });
    }

    return matches;
  }

  /**
   * Determine verdict from evidence
   */
  private determineVerdict(
    claimText: string,
    evidence: EvidenceMatch[],
    authorConstraint?: string
  ): { verdict: VerificationVerdict; confidence: number; reasoning: string } {
    if (evidence.length === 0) {
      return {
        verdict: 'UNSUPPORTED',
        confidence: 0.9,
        reasoning: authorConstraint
          ? `No evidence found in ${authorConstraint}'s corpus for this claim.`
          : 'No relevant evidence found in corpus for this claim.',
      };
    }

    // Check for contradictions first
    const contradictions = evidence.filter((e) => e.matchType === 'contradicts');
    if (contradictions.length > 0) {
      const bestContradiction = contradictions[0];
      return {
        verdict: 'CONTRADICTED',
        confidence: bestContradiction.entailmentScore,
        reasoning: `Corpus evidence contradicts this claim. Found conflicting content: "${bestContradiction.matchingSnippet}"`,
      };
    }

    // Get best supporting evidence
    const supportingEvidence = evidence.filter(
      (e) => e.matchType === 'supports' || e.matchType === 'partially_supports'
    );

    if (supportingEvidence.length === 0) {
      return {
        verdict: 'UNSUPPORTED',
        confidence: 0.7,
        reasoning: `Found ${evidence.length} potential matches, but none provide sufficient support for the claim.`,
      };
    }

    const bestEvidence = supportingEvidence[0];
    const combinedScore = (bestEvidence.relevanceScore + bestEvidence.entailmentScore) / 2;

    if (combinedScore >= this.options.thresholds!.supported!) {
      return {
        verdict: 'SUPPORTED',
        confidence: combinedScore,
        reasoning: `Claim is well-supported by corpus evidence. Best match: "${bestEvidence.matchingSnippet}"`,
      };
    }

    if (combinedScore >= this.options.thresholds!.partiallySupported!) {
      return {
        verdict: 'PARTIALLY_SUPPORTED',
        confidence: combinedScore,
        reasoning: `Claim is partially supported. Some aspects match corpus evidence, but not all claims are directly grounded. Best match: "${bestEvidence.matchingSnippet}"`,
      };
    }

    if (combinedScore >= this.options.thresholds!.unsupported!) {
      return {
        verdict: 'UNCERTAIN',
        confidence: combinedScore,
        reasoning: `Evidence is inconclusive. Found related content but cannot definitively verify the claim.`,
      };
    }

    return {
      verdict: 'UNSUPPORTED',
      confidence: 1 - combinedScore,
      reasoning: `Insufficient evidence to support this claim. Relevance score: ${(combinedScore * 100).toFixed(1)}%`,
    };
  }

  /**
   * Classify match type based on scores
   */
  private classifyMatchType(
    relevanceScore: number,
    entailmentScore: number,
    claimText: string,
    evidenceText: string
  ): EvidenceMatch['matchType'] {
    // Check for contradiction indicators
    const contradictionIndicators = ['not', 'never', 'cannot', 'does not', 'is not', 'unlike'];
    const claimLower = claimText.toLowerCase();
    const evidenceLower = evidenceText.toLowerCase();

    // Simple contradiction detection
    for (const indicator of contradictionIndicators) {
      if (
        (claimLower.includes(indicator) && !evidenceLower.includes(indicator)) ||
        (!claimLower.includes(indicator) && evidenceLower.includes(indicator))
      ) {
        // Check if they're discussing the same topic
        if (relevanceScore > 0.5) {
          return 'contradicts';
        }
      }
    }

    // Classify based on scores
    if (entailmentScore >= 0.8 && relevanceScore >= 0.6) {
      return 'supports';
    }

    if (entailmentScore >= 0.5 || relevanceScore >= 0.4) {
      return 'partially_supports';
    }

    return 'irrelevant';
  }

  /**
   * Calculate simple entailment score
   */
  private calculateSimpleEntailment(claim: string, evidence: string): number {
    const claimWords = new Set(
      claim
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => !STOPWORDS.has(w) && w.length > 2)
    );
    const evidenceWords = new Set(
      evidence
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => !STOPWORDS.has(w) && w.length > 2)
    );

    if (claimWords.size === 0) return 0;

    let matchCount = 0;
    for (const word of claimWords) {
      if (evidenceWords.has(word)) {
        matchCount++;
      }
    }

    // Bonus for exact phrase matches
    const claimPhrases = this.extractPhrases(claim);
    const evidenceLower = evidence.toLowerCase();
    let phraseBonus = 0;
    for (const phrase of claimPhrases) {
      if (evidenceLower.includes(phrase)) {
        phraseBonus += 0.1;
      }
    }

    return Math.min(1, matchCount / claimWords.size + phraseBonus);
  }

  /**
   * Extract key phrases (2-3 word combinations)
   */
  private extractPhrases(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const phrases: string[] = [];

    for (let i = 0; i < words.length - 1; i++) {
      if (!STOPWORDS.has(words[i]) && !STOPWORDS.has(words[i + 1])) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }
    }

    return phrases;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word));
  }

  /**
   * Calculate keyword overlap
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0) return 0;

    const set2 = new Set(keywords2);
    let matches = 0;

    for (const kw of keywords1) {
      if (set2.has(kw)) {
        matches++;
      } else {
        // Partial match bonus
        for (const kw2 of keywords2) {
          if (kw2.includes(kw) || kw.includes(kw2)) {
            matches += 0.5;
            break;
          }
        }
      }
    }

    return Math.min(1, matches / keywords1.length);
  }

  /**
   * Extract matching snippet from evidence
   */
  private extractMatchingSnippet(content: string, keywords: string[]): string {
    const sentences = content.split(/[.!?]+/);
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

    return bestSentence.length > 150
      ? bestSentence.substring(0, 150) + '...'
      : bestSentence;
  }

  /**
   * Generate suggestions for fixing problematic claims
   *
   * IMPORTANT: BLOCKED suggestions are fundamentally different from UNSUPPORTED:
   * - BLOCKED: "Fix upstream referent" (semantic issue)
   * - UNSUPPORTED: "Add a citation" (epistemic issue)
   */
  private generateSuggestions(
    verdict: VerificationVerdict,
    evidence: EvidenceMatch[],
    authorConstraint?: string
  ): string[] | undefined {
    if (verdict === 'SUPPORTED') {
      return undefined;
    }

    const suggestions: string[] = [];

    switch (verdict) {
      case 'BLOCKED':
        // BLOCKED verdicts get their suggestions from blockedReason, but provide fallback
        suggestions.push('Fix the unresolved referent before attempting verification.');
        suggestions.push('Replace demonstrative pronouns (this, that, these, those) with explicit noun phrases.');
        suggestions.push('Example: Instead of "This view supports X", write "Aristotle\'s view that φαντασία mediates deliberation supports X".');
        break;

      case 'UNSUPPORTED':
        if (authorConstraint) {
          suggestions.push(
            `Check if ${authorConstraint}'s corpus actually discusses this topic.`
          );
          suggestions.push(
            `Consider whether another author might be more appropriate for this claim.`
          );
        }
        suggestions.push('Add explicit citation with page/line reference.');
        suggestions.push('Consider rephrasing as your own interpretation rather than attributed claim.');
        break;

      case 'PARTIALLY_SUPPORTED':
        suggestions.push('Strengthen the claim by adding a direct quote from the corpus.');
        suggestions.push('Consider splitting into separate claims, citing what is supported.');
        if (evidence.length > 0) {
          suggestions.push(
            `Best matching content: "${evidence[0].matchingSnippet}" - align claim more closely.`
          );
        }
        break;

      case 'CONTRADICTED':
        suggestions.push('Review the corpus text - your claim may misrepresent the source.');
        if (evidence.length > 0) {
          suggestions.push(
            `Corpus states: "${evidence[0].matchingSnippet}" - revise to match this.`
          );
        }
        suggestions.push('Consider framing as contrast: "Unlike what one might expect..."');
        break;

      case 'UNCERTAIN':
        suggestions.push('Add more specific textual evidence to strengthen the claim.');
        suggestions.push('Consider hedging: "It could be argued that..." or "One reading suggests..."');
        break;
    }

    return suggestions;
  }

  /**
   * Aggregate verdicts from multiple atomic claims
   *
   * IMPORTANT: BLOCKED verdicts are handled specially:
   * - They do NOT count against the support rate
   * - If ANY claim is BLOCKED, the composite verdict is BLOCKED
   *   (because we can't verify a claim with unresolved referents)
   */
  private aggregateVerdicts(results: VerificationResult[]): {
    verdict: VerificationVerdict;
    confidence: number;
  } {
    if (results.length === 0) {
      return { verdict: 'UNCERTAIN', confidence: 0.5 };
    }

    // Count verdicts
    const counts: Record<VerificationVerdict, number> = {
      SUPPORTED: 0,
      PARTIALLY_SUPPORTED: 0,
      UNSUPPORTED: 0,
      CONTRADICTED: 0,
      UNCERTAIN: 0,
      BLOCKED: 0,
    };

    let totalConfidence = 0;
    let nonBlockedCount = 0;

    for (const result of results) {
      counts[result.verdict]++;
      if (result.verdict !== 'BLOCKED') {
        totalConfidence += result.confidence;
        nonBlockedCount++;
      }
    }

    // BLOCKED takes precedence - if any claim is blocked, the whole thing is blocked
    // This is because we can't verify a composite claim if part of it is semantically unstable
    if (counts.BLOCKED > 0) {
      return { verdict: 'BLOCKED', confidence: 1.0 };
    }

    const avgConfidence = nonBlockedCount > 0 ? totalConfidence / nonBlockedCount : 0.5;

    // Any contradiction means the whole claim is problematic
    if (counts.CONTRADICTED > 0) {
      return { verdict: 'CONTRADICTED', confidence: avgConfidence };
    }

    // If any are unsupported, the composite is at best partially supported
    if (counts.UNSUPPORTED > 0) {
      if (counts.SUPPORTED + counts.PARTIALLY_SUPPORTED > 0) {
        return { verdict: 'PARTIALLY_SUPPORTED', confidence: avgConfidence * 0.8 };
      }
      return { verdict: 'UNSUPPORTED', confidence: avgConfidence };
    }

    // All supported
    if (counts.SUPPORTED === results.length) {
      return { verdict: 'SUPPORTED', confidence: avgConfidence };
    }

    // Mix of supported and partially supported
    if (counts.SUPPORTED > 0 || counts.PARTIALLY_SUPPORTED > 0) {
      const supportRatio = counts.SUPPORTED / results.length;
      if (supportRatio >= 0.8) {
        return { verdict: 'SUPPORTED', confidence: avgConfidence * supportRatio };
      }
      return { verdict: 'PARTIALLY_SUPPORTED', confidence: avgConfidence };
    }

    // Default to uncertain
    return { verdict: 'UNCERTAIN', confidence: avgConfidence };
  }

  /**
   * Combine reasoning from multiple atomic results
   */
  private combineReasoning(
    atomicResults: CompositeVerificationResult['atomicResults']
  ): string {
    if (atomicResults.length === 1) {
      return atomicResults[0].result.reasoning;
    }

    const parts: string[] = [];
    parts.push(`Composite claim verified through ${atomicResults.length} atomic subclaims:`);

    for (let i = 0; i < atomicResults.length; i++) {
      const { atomic, result } = atomicResults[i];
      parts.push(
        `  ${i + 1}. [${result.verdict}] "${atomic.text.substring(0, 50)}..." - ${result.reasoning.substring(0, 100)}`
      );
    }

    return parts.join('\n');
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new ClaimVerifier instance
 */
export function createClaimVerifier(
  retriever: CorpusRetriever,
  corpusChunks: ContextChunk[],
  corpusSources: CorpusSource[],
  options?: VerifierOptions
): ClaimVerifier {
  return new ClaimVerifier(retriever, corpusChunks, corpusSources, options);
}
