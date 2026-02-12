/**
 * Typed Entailment Relations - Classifier
 *
 * Pattern-based classification of entailment relations between claims
 * and evidence. Uses regex patterns, lexical analysis, and heuristics
 * to determine the type of inferential relationship.
 *
 * @module entailment-classifier
 */

import {
  EntailmentRelationType,
  EntailmentRelation,
  EntailmentMarker,
  MarkerType,
  RelationMetrics,
  SourceMetadata,
  EntailmentClassificationContext,
  ContextChunk,
  EntailmentClassificationResult,
  ClassificationMetadata,
  createEntailmentRelation,
  createEntailmentMarker,
} from './entailment-types.js';
import { ENTAILMENT_REQUIREMENTS, meetsThreshold } from './entailment-requirements.js';

// =============================================================================
// CLASSIFIER OPTIONS
// =============================================================================

/**
 * Options for entailment classification
 */
export interface EntailmentClassifierOptions {
  /** Minimum confidence to accept classification (default: 0.4) */
  minConfidence?: number;

  /** Enable multi-relation detection (default: true) */
  detectMultipleRelations?: boolean;

  /** Use embedding-based similarity (default: false) */
  useEmbeddings?: boolean;

  /** Custom marker patterns by type */
  customPatterns?: Map<EntailmentRelationType, RegExp[]>;

  /** Stopwords to exclude from analysis */
  stopwords?: Set<string>;

  /** Minimum term length for analysis (default: 3) */
  minTermLength?: number;
}

/**
 * Default classifier options
 */
const DEFAULT_OPTIONS: Required<EntailmentClassifierOptions> = {
  minConfidence: 0.4,
  detectMultipleRelations: true,
  useEmbeddings: false,
  customPatterns: new Map(),
  stopwords: new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'this', 'that', 'these',
    'those', 'it', 'its', 'they', 'them', 'their', 'he', 'she', 'his', 'her',
    'who', 'which', 'what', 'when', 'where', 'how', 'why', 'can', 'not',
  ]),
  minTermLength: 3,
};

// =============================================================================
// ENTAILMENT CLASSIFIER
// =============================================================================

/**
 * Entailment Classifier
 *
 * Classifies the entailment relation between a claim and evidence.
 * Supports pattern-based classification for 6 relation types.
 */
export class EntailmentClassifier {
  private options: Required<EntailmentClassifierOptions>;
  private patterns: Map<EntailmentRelationType, RegExp[]>;

  constructor(options?: EntailmentClassifierOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.patterns = this.initializePatterns();
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Classify entailment relation between claim and evidence
   */
  async classify(
    context: EntailmentClassificationContext
  ): Promise<EntailmentClassificationResult> {
    const startTime = Date.now();
    const relations: EntailmentRelation[] = [];
    let patternsMatched = 0;

    for (const chunk of context.evidenceChunks) {
      // Try each relation type
      const results = await Promise.all([
        this.checkTextualEntailment(context.claimText, chunk),
        this.checkParaphrasticEntailment(context.claimText, chunk),
        this.checkConceptualEntailment(context.claimText, chunk, context.terminologyMap),
        this.checkInferentialEntailment(context.claimText, chunk),
      ]);

      for (const result of results) {
        if (result.confidence >= this.options.minConfidence) {
          relations.push(result);
          patternsMatched += result.evidence.markers.length;
          if (!this.options.detectMultipleRelations) break;
        }
      }
    }

    // Check for analogical (requires multiple chunks)
    if (context.evidenceChunks.length >= 2) {
      const analogicalResult = await this.checkAnalogicalEntailment(
        context.claimText,
        context.evidenceChunks
      );
      if (analogicalResult.confidence >= this.options.minConfidence) {
        relations.push(analogicalResult);
        patternsMatched += analogicalResult.evidence.markers.length;
      }
    }

    // Check for evaluative
    const evaluativeResult = await this.checkEvaluativeEntailment(
      context.claimText,
      context.evidenceChunks,
      context.discourseContext
    );
    if (evaluativeResult.confidence >= this.options.minConfidence) {
      relations.push(evaluativeResult);
      patternsMatched += evaluativeResult.evidence.markers.length;
    }

    // Sort by confidence
    relations.sort((a, b) => b.confidence - a.confidence);

    const endTime = Date.now();

    return {
      relations,
      primary: relations.length > 0 ? relations[0] : null,
      metadata: {
        classificationTimeMs: endTime - startTime,
        chunksProcessed: context.evidenceChunks.length,
        patternsMatched,
        usedEmbeddings: this.options.useEmbeddings,
      },
    };
  }

  /**
   * Classify a single claim-evidence pair
   */
  async classifySingle(
    claim: string,
    evidence: string,
    metadata?: Partial<SourceMetadata>
  ): Promise<EntailmentRelation[]> {
    const result = await this.classify({
      claimText: claim,
      evidenceChunks: [
        {
          id: 'single',
          content: evidence,
          metadata: metadata as ContextChunk['metadata'],
        },
      ],
    });
    return result.relations;
  }

  /**
   * Get the best (highest confidence) relation for a claim-evidence pair
   */
  async getBestRelation(
    claim: string,
    evidence: string,
    metadata?: Partial<SourceMetadata>
  ): Promise<EntailmentRelation | null> {
    const result = await this.classify({
      claimText: claim,
      evidenceChunks: [
        {
          id: 'single',
          content: evidence,
          metadata: metadata as ContextChunk['metadata'],
        },
      ],
    });
    return result.primary;
  }

  // ===========================================================================
  // PATTERN INITIALIZATION
  // ===========================================================================

  /**
   * Initialize classification patterns
   */
  private initializePatterns(): Map<EntailmentRelationType, RegExp[]> {
    const patterns = new Map<EntailmentRelationType, RegExp[]>();

    // Textual entailment indicators (quotation markers)
    patterns.set('textual', [
      /[""]([^""]+)[""]/g, // Quoted text (curly quotes)
      /['']([^'']+)[']/g, // Single quoted
      /"([^"]+)"/g, // Quoted text (straight quotes)
      /as\s+(?:he|she|they|it)\s+(?:writes?|says?|states?|puts?\s+it)/gi,
      /in\s+(?:his|her|their)\s+(?:own\s+)?words/gi,
      /verbatim/gi,
      /exactly\s+(?:as|what)/gi,
      /(?:the\s+)?(?:exact|precise)\s+(?:words?|phrase|formulation)/gi,
      /to\s+quote/gi,
    ]);

    // Paraphrastic indicators
    patterns.set('paraphrastic', [
      /in\s+other\s+words/gi,
      /put\s+(?:another\s+way|differently|simply)/gi,
      /what\s+(?:this|he|she|they?|it)\s+means\s+(?:is|by)/gi,
      /to\s+paraphrase/gi,
      /essentially/gi,
      /(?:the\s+)?(?:basic|core|central|main)\s+(?:idea|point|claim|argument)\s+is/gi,
      /that\s+is\s+to\s+say/gi,
      /in\s+(?:brief|short|essence|summary)/gi,
      /(?:roughly|approximately)\s+speaking/gi,
    ]);

    // Conceptual mapping indicators
    patterns.set('conceptual', [
      /(?:corresponds?|parallels?|maps?\s+(?:to|onto))/gi,
      /what\s+(?:\w+)\s+calls?\s+['"]?(\w+)['"]?/gi,
      /in\s+(?:\w+)'s\s+(?:terms?|vocabulary|framework|language)/gi,
      /(?:equivalent|analogous|akin)\s+to/gi,
      /(?:the\s+)?(?:same|similar)\s+(?:concept|notion|idea)\s+(?:as)?/gi,
      /(?:can\s+be\s+)?(?:understood|translated|rendered)\s+as/gi,
      /(?:amounts?\s+to|comes?\s+down\s+to)/gi,
      /(?:what\s+)?(?:\w+)\s+(?:would\s+call|terms?|refers?\s+to\s+as)/gi,
    ]);

    // Inferential indicators
    patterns.set('inferential', [
      /(?:therefore|thus|hence|consequently|accordingly)/gi,
      /it\s+follows\s+(?:that|from)/gi,
      /(?:we\s+can\s+)?(?:conclude|infer|deduce|derive)/gi,
      /(?:this|which)\s+(?:implies?|entails?|suggests?|shows?)/gi,
      /from\s+(?:this|which)\s+(?:it\s+)?follows/gi,
      /(?:given|since|because)\s+.{5,50}(?:therefore|thus|so)/gi,
      /(?:this|the)\s+(?:argument|reasoning|logic)\s+(?:shows?|demonstrates?)/gi,
      /(?:it\s+)?(?:must|can)\s+be\s+(?:concluded|inferred)/gi,
      /(?:on\s+this\s+basis|from\s+this|taking\s+this)/gi,
    ]);

    // Analogical indicators
    patterns.set('analogical', [
      /(?:just\s+as|in\s+the\s+same\s+way\s+(?:that|as))/gi,
      /(?:like|unlike)\s+(?:[A-Z][a-z]+),?\s+(?:[A-Z][a-z]+)/gi,
      /(?:the\s+)?analogy\s+(?:between|with)/gi,
      /(?:similarly|correspondingly|likewise)/gi,
      /(?:echoes?|mirrors?|parallels?|resonates?\s+with)/gi,
      /(?:can\s+be\s+)?(?:compared|likened)\s+to/gi,
      /(?:draws?\s+a\s+)?(?:parallel|comparison)\s+(?:between|with)/gi,
      /(?:anticipates?|prefigures?|foreshadows?)/gi,
    ]);

    // Evaluative indicators
    patterns.set('evaluative', [
      /(?:successfully|effectively|adequately|properly|correctly|rightly)/gi,
      /(?:fails?\s+to|inadequately|improperly|incorrectly|wrongly)/gi,
      /(?:is|are)\s+(?:right|wrong|correct|incorrect|mistaken|accurate|inaccurate)/gi,
      /(?:best|better|worse|worst|superior|inferior)\s+(?:than)?/gi,
      /(?:convincing|compelling|persuasive|weak|strong|flawed)/gi,
      /(?:should|ought|must)\s+be\s+(?:understood|read|interpreted|seen)/gi,
      /(?:problematic|questionable|dubious|sound|valid|invalid)/gi,
      /(?:most|least)\s+(?:plausible|convincing|adequate)/gi,
    ]);

    // Merge custom patterns
    for (const [type, customPatterns] of this.options.customPatterns) {
      const existing = patterns.get(type) || [];
      patterns.set(type, [...existing, ...customPatterns]);
    }

    return patterns;
  }

  // ===========================================================================
  // TYPE-SPECIFIC CLASSIFICATION
  // ===========================================================================

  /**
   * Check for textual entailment (near-quotation)
   */
  private async checkTextualEntailment(
    claim: string,
    evidence: ContextChunk
  ): Promise<EntailmentRelation> {
    const markers: EntailmentMarker[] = [];
    const patterns = this.patterns.get('textual') || [];

    // Check for quotation patterns in claim
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(claim);
      if (match) {
        markers.push(
          createEntailmentMarker('lexical', match[0], 0.9, {
            claim: { start: match.index, end: match.index + match[0].length },
          })
        );
      }
    }

    // Calculate lexical overlap
    const lexicalOverlap = this.calculateLexicalOverlap(claim, evidence.content);

    // Find longest common substring
    const lcs = this.findLongestCommonSubstring(claim, evidence.content);
    if (lcs.length > 20) {
      markers.push(createEntailmentMarker('lexical', lcs, Math.min(1, lcs.length / 50)));
    }

    const confidence = this.computeTextualConfidence(markers, lexicalOverlap);

    return createEntailmentRelation({
      type: 'textual',
      confidence,
      evidence: {
        sourceText: evidence.content,
        sourceMetadata: this.extractMetadata(evidence),
        markers,
        metrics: { lexicalOverlap, longestCommonSubstring: lcs.length },
      },
    });
  }

  /**
   * Check for paraphrastic entailment
   */
  private async checkParaphrasticEntailment(
    claim: string,
    evidence: ContextChunk
  ): Promise<EntailmentRelation> {
    const markers: EntailmentMarker[] = [];
    const patterns = this.patterns.get('paraphrastic') || [];

    // Check for paraphrase indicators
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(claim);
      if (match) {
        markers.push(
          createEntailmentMarker('rhetorical', match[0], 0.8, {
            claim: { start: match.index, end: match.index + match[0].length },
          })
        );
      }
    }

    // Calculate semantic similarity
    const semanticSimilarity = this.calculateSemanticSimilarity(claim, evidence.content);

    // Check for preserved content
    const contentPreservation = this.checkContentPreservation(claim, evidence.content);

    const confidence = this.computeParaphrasticConfidence(
      markers,
      semanticSimilarity,
      contentPreservation
    );

    return createEntailmentRelation({
      type: 'paraphrastic',
      confidence,
      evidence: {
        sourceText: evidence.content,
        sourceMetadata: this.extractMetadata(evidence),
        markers,
        metrics: { semanticSimilarity, contentPreservation },
      },
    });
  }

  /**
   * Check for conceptual entailment
   */
  private async checkConceptualEntailment(
    claim: string,
    evidence: ContextChunk,
    terminologyMap?: Map<string, string[]>
  ): Promise<EntailmentRelation> {
    const markers: EntailmentMarker[] = [];
    const patterns = this.patterns.get('conceptual') || [];

    // Check for conceptual mapping patterns
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(claim);
      if (match) {
        markers.push(
          createEntailmentMarker('semantic', match[0], 0.7, {
            claim: { start: match.index, end: match.index + match[0].length },
          })
        );
      }
    }

    // Check terminology alignment
    const termAlignment = terminologyMap
      ? this.checkTerminologyAlignment(claim, evidence.content, terminologyMap)
      : this.inferTerminologyAlignment(claim, evidence.content);

    if (termAlignment > 0.5) {
      markers.push(createEntailmentMarker('semantic', 'terminology_aligned', termAlignment));
    }

    const confidence = this.computeConceptualConfidence(markers, termAlignment);

    return createEntailmentRelation({
      type: 'conceptual',
      confidence,
      evidence: {
        sourceText: evidence.content,
        sourceMetadata: this.extractMetadata(evidence),
        markers,
        metrics: { termAlignment },
      },
    });
  }

  /**
   * Check for inferential entailment
   */
  private async checkInferentialEntailment(
    claim: string,
    evidence: ContextChunk
  ): Promise<EntailmentRelation> {
    const markers: EntailmentMarker[] = [];
    const patterns = this.patterns.get('inferential') || [];

    // Check for inference markers in claim
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(claim);
      if (match) {
        markers.push(
          createEntailmentMarker('logical', match[0], 0.85, {
            claim: { start: match.index, end: match.index + match[0].length },
          })
        );
      }
    }

    // Check premise coverage
    const premiseCoverage = this.checkPremiseCoverage(claim, evidence.content);

    // Check inference validity
    const inferenceValid = this.checkInferenceStructure(claim);

    if (inferenceValid) {
      markers.push(createEntailmentMarker('logical', 'valid_inference_structure', 0.8));
    }

    const confidence = this.computeInferentialConfidence(markers, premiseCoverage, inferenceValid);

    return createEntailmentRelation({
      type: 'inferential',
      confidence,
      evidence: {
        sourceText: evidence.content,
        sourceMetadata: this.extractMetadata(evidence),
        markers,
        metrics: { premiseCoverage },
      },
    });
  }

  /**
   * Check for analogical entailment
   */
  private async checkAnalogicalEntailment(
    claim: string,
    evidenceChunks: ContextChunk[]
  ): Promise<EntailmentRelation> {
    const markers: EntailmentMarker[] = [];
    const patterns = this.patterns.get('analogical') || [];

    // Check for analogy markers
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(claim);
      if (match) {
        markers.push(
          createEntailmentMarker('rhetorical', match[0], 0.75, {
            claim: { start: match.index, end: match.index + match[0].length },
          })
        );
      }
    }

    // Check for explicit bridge text
    const bridgeExplicitness = this.checkBridgeText(claim, evidenceChunks);

    if (bridgeExplicitness > 0.5) {
      markers.push(createEntailmentMarker('rhetorical', 'bridge_text_present', bridgeExplicitness));
    }

    const confidence = this.computeAnalogicalConfidence(markers, bridgeExplicitness);

    // Combine evidence from multiple chunks
    const combinedEvidence = evidenceChunks.map((c) => c.content).join('\n---\n');

    return createEntailmentRelation({
      type: 'analogical',
      confidence,
      evidence: {
        sourceText: combinedEvidence,
        sourceMetadata: this.extractMetadata(evidenceChunks[0]),
        markers,
        metrics: { bridgeExplicitness },
      },
    });
  }

  /**
   * Check for evaluative entailment
   */
  private async checkEvaluativeEntailment(
    claim: string,
    evidenceChunks: ContextChunk[],
    discourseContext?: string
  ): Promise<EntailmentRelation> {
    const markers: EntailmentMarker[] = [];
    const patterns = this.patterns.get('evaluative') || [];

    // Check for evaluative language
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(claim);
      if (match) {
        markers.push(
          createEntailmentMarker('rhetorical', match[0], 0.7, {
            claim: { start: match.index, end: match.index + match[0].length },
          })
        );
      }
    }

    // Check for argument presence
    const combinedText = discourseContext ? `${discourseContext}\n${claim}` : claim;
    const argumentPresence = this.checkArgumentPresence(combinedText);

    if (argumentPresence > 0.5) {
      markers.push(
        createEntailmentMarker('rhetorical', 'argument_structure_present', argumentPresence)
      );
    }

    const confidence = this.computeEvaluativeConfidence(markers, argumentPresence);

    const combinedEvidence = evidenceChunks.map((c) => c.content).join('\n---\n');

    return createEntailmentRelation({
      type: 'evaluative',
      confidence,
      evidence: {
        sourceText: combinedEvidence,
        sourceMetadata:
          evidenceChunks.length > 0
            ? this.extractMetadata(evidenceChunks[0])
            : { author: 'unknown' },
        markers,
        metrics: { argumentPresence },
      },
    });
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= this.options.minTermLength);
  }

  /**
   * Extract key terms (remove stopwords)
   */
  private extractKeyTerms(text: string): string[] {
    return this.tokenize(text).filter((t) => !this.options.stopwords.has(t));
  }

  /**
   * Calculate lexical overlap (Jaccard similarity)
   */
  private calculateLexicalOverlap(text1: string, text2: string): number {
    const words1 = new Set(this.tokenize(text1));
    const words2 = new Set(this.tokenize(text2));

    let intersection = 0;
    for (const word of words1) {
      if (words2.has(word)) intersection++;
    }

    const union = words1.size + words2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Calculate semantic similarity (weighted term overlap)
   */
  private calculateSemanticSimilarity(text1: string, text2: string): number {
    const tokens1 = this.extractKeyTerms(text1);
    const tokens2 = this.extractKeyTerms(text2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    // Weight by term importance (IDF-like weighting)
    const allTokens = [...tokens1, ...tokens2];
    const termFreq = new Map<string, number>();
    for (const token of allTokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }

    let weightedOverlap = 0;
    let totalWeight = 0;

    for (const token of new Set(tokens1)) {
      const weight = 1 / (termFreq.get(token) || 1);
      totalWeight += weight;
      if (tokens2.includes(token)) {
        weightedOverlap += weight;
      }
    }

    return totalWeight > 0 ? weightedOverlap / totalWeight : 0;
  }

  /**
   * Find longest common substring
   */
  private findLongestCommonSubstring(text1: string, text2: string): string {
    const m = text1.length;
    const n = text2.length;

    if (m === 0 || n === 0) return '';

    // Check substrings of text1 in text2 (starting from longer)
    for (let len = Math.min(m, n, 100); len >= 10; len--) {
      for (let i = 0; i <= m - len; i++) {
        const substr = text1.substring(i, i + len);
        if (text2.includes(substr)) {
          return substr;
        }
      }
    }

    return '';
  }

  /**
   * Check content preservation (key terms present)
   */
  private checkContentPreservation(claim: string, evidence: string): number {
    const evidenceTerms = this.extractKeyTerms(evidence);
    const claimTerms = new Set(this.tokenize(claim));

    if (evidenceTerms.length === 0) return 0;

    let preserved = 0;
    for (const term of evidenceTerms) {
      if (claimTerms.has(term)) preserved++;
    }

    return preserved / evidenceTerms.length;
  }

  /**
   * Check terminology alignment with explicit map
   */
  private checkTerminologyAlignment(
    claim: string,
    evidence: string,
    terminologyMap: Map<string, string[]>
  ): number {
    let alignedCount = 0;
    let totalChecked = 0;

    const claimLower = claim.toLowerCase();
    const evidenceLower = evidence.toLowerCase();

    for (const [term, equivalents] of terminologyMap) {
      const termInClaim = claimLower.includes(term.toLowerCase());
      const equivalentInEvidence = equivalents.some((eq) =>
        evidenceLower.includes(eq.toLowerCase())
      );

      if (termInClaim || equivalentInEvidence) {
        totalChecked++;
        if (termInClaim && equivalentInEvidence) {
          alignedCount++;
        }
      }
    }

    return totalChecked > 0 ? alignedCount / totalChecked : 0;
  }

  /**
   * Infer terminology alignment without explicit map
   */
  private inferTerminologyAlignment(claim: string, evidence: string): number {
    const claimTerms = this.extractKeyTerms(claim);
    const evidenceTerms = this.extractKeyTerms(evidence);

    return this.calculateSemanticSimilarity(claimTerms.join(' '), evidenceTerms.join(' '));
  }

  /**
   * Check premise coverage in evidence
   */
  private checkPremiseCoverage(claim: string, evidence: string): number {
    // Extract what looks like premises from the claim
    const premisePatterns = [
      /(?:since|because|given\s+that|as)\s+([^,]+)/gi,
      /(?:from|based\s+on)\s+([^,]+)/gi,
    ];

    const premises: string[] = [];
    for (const pattern of premisePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(claim)) !== null) {
        premises.push(match[1]);
      }
    }

    if (premises.length === 0) return 0.5; // No explicit premises detected

    // Check if premises are found in evidence
    let foundCount = 0;
    for (const premise of premises) {
      const premiseTerms = this.tokenize(premise);
      const evidenceTerms = this.tokenize(evidence);
      const overlap = premiseTerms.filter((t) => evidenceTerms.includes(t)).length;
      if (overlap / premiseTerms.length > 0.5) {
        foundCount++;
      }
    }

    return foundCount / premises.length;
  }

  /**
   * Check for valid inference structure
   */
  private checkInferenceStructure(claim: string): boolean {
    const hasConclusion = /(?:therefore|thus|hence|consequently|it\s+follows)/i.test(claim);
    const hasPremise = /(?:since|because|given|from|as\s+we)/i.test(claim);

    return hasConclusion || hasPremise;
  }

  /**
   * Check for explicit bridge text
   */
  private checkBridgeText(claim: string, evidenceChunks: ContextChunk[]): number {
    const bridgePatterns = [
      /(?:just\s+as|similarly|in\s+the\s+same\s+way)/gi,
      /(?:the\s+)?analogy\s+(?:between|with)/gi,
      /(?:corresponds?|parallels?)\s+(?:to|with)/gi,
    ];

    let bridgeCount = 0;
    for (const pattern of bridgePatterns) {
      if (pattern.test(claim)) bridgeCount++;
    }

    // Check if both sides of comparison are mentioned
    if (evidenceChunks.length >= 2) {
      const authors = evidenceChunks.map((c) => c.metadata?.author).filter(Boolean);
      const uniqueAuthors = new Set(authors);
      if (uniqueAuthors.size >= 2) {
        bridgeCount += 0.5;
      }
    }

    return Math.min(1, bridgeCount / 3);
  }

  /**
   * Check for argument presence
   */
  private checkArgumentPresence(text: string): number {
    const criteriaPatterns = [/(?:criteria|standard|measure|benchmark)/gi, /(?:because|since|for\s+this\s+reason)/gi];

    const judgmentPatterns = [
      /(?:successfully|effectively|fails?\s+to)/gi,
      /(?:is|are)\s+(?:right|wrong|correct|mistaken)/gi,
    ];

    const reasoningPatterns = [
      /(?:this\s+is\s+because|the\s+reason\s+is)/gi,
      /(?:given\s+that|considering)/gi,
    ];

    let score = 0;

    for (const pattern of criteriaPatterns) {
      if (pattern.test(text)) score += 0.3;
    }
    for (const pattern of judgmentPatterns) {
      if (pattern.test(text)) score += 0.4;
    }
    for (const pattern of reasoningPatterns) {
      if (pattern.test(text)) score += 0.3;
    }

    return Math.min(1, score);
  }

  /**
   * Extract metadata from chunk
   */
  private extractMetadata(chunk: ContextChunk): SourceMetadata {
    return {
      author: chunk.metadata?.author || 'unknown',
      work: chunk.metadata?.work,
      year: chunk.metadata?.year,
      page: chunk.metadata?.page,
      section: chunk.metadata?.section,
      chunkId: chunk.id,
    };
  }

  // ===========================================================================
  // CONFIDENCE COMPUTATION
  // ===========================================================================

  private computeTextualConfidence(markers: EntailmentMarker[], lexicalOverlap: number): number {
    const markerScore =
      markers.reduce((sum, m) => sum + m.strength, 0) / Math.max(1, markers.length);

    // Textual entailment requires high lexical overlap
    if (lexicalOverlap < 0.5) return lexicalOverlap * 0.5;

    return markerScore * 0.3 + lexicalOverlap * 0.7;
  }

  private computeParaphrasticConfidence(
    markers: EntailmentMarker[],
    semanticSimilarity: number,
    contentPreservation: number
  ): number {
    const markerScore =
      markers.reduce((sum, m) => sum + m.strength, 0) / Math.max(1, markers.length);

    return markerScore * 0.2 + semanticSimilarity * 0.4 + contentPreservation * 0.4;
  }

  private computeConceptualConfidence(
    markers: EntailmentMarker[],
    termAlignment: number
  ): number {
    const markerScore =
      markers.reduce((sum, m) => sum + m.strength, 0) / Math.max(1, markers.length);

    return markerScore * 0.4 + termAlignment * 0.6;
  }

  private computeInferentialConfidence(
    markers: EntailmentMarker[],
    premiseCoverage: number,
    inferenceValid: boolean
  ): number {
    const markerScore =
      markers.reduce((sum, m) => sum + m.strength, 0) / Math.max(1, markers.length);

    const validityBonus = inferenceValid ? 0.2 : 0;

    return markerScore * 0.3 + premiseCoverage * 0.5 + validityBonus;
  }

  private computeAnalogicalConfidence(
    markers: EntailmentMarker[],
    bridgeExplicitness: number
  ): number {
    const markerScore =
      markers.reduce((sum, m) => sum + m.strength, 0) / Math.max(1, markers.length);

    return markerScore * 0.4 + bridgeExplicitness * 0.6;
  }

  private computeEvaluativeConfidence(
    markers: EntailmentMarker[],
    argumentPresence: number
  ): number {
    const markerScore =
      markers.reduce((sum, m) => sum + m.strength, 0) / Math.max(1, markers.length);

    return markerScore * 0.4 + argumentPresence * 0.6;
  }
}
