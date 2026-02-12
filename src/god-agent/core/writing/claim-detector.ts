/**
 * Claim Detector (Phase A: Comprehensive Claim Validation System)
 *
 * Extracts all claims from generated text with multi-axis classification.
 * Works on a per-paragraph basis to support inline validation.
 *
 * Key Responsibilities:
 * - Sentence segmentation with context windows
 * - Pattern-based claim extraction across 6 categories
 * - Attribution resolution (anaphoric references)
 * - Risk level assignment via ValidationRuleEngine
 *
 * @module claim-detector
 */

import {
  type ClaimProfile,
  type ComposedValidationRequirements,
  type RiskLevel,
  AttributionType,
} from './claim-profile.js';

import {
  MultiAxisClaimClassifier,
  type ClassificationContext,
} from './claim-classifier.js';

import {
  ValidationRuleEngine,
  computeRiskLevel,
} from './validation-rule-engine.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Commitment type - who bears epistemic responsibility for the claim
 */
export type CommitmentType = 'source' | 'essay' | 'consensus' | 'unknown';

/**
 * Retrieval attribution - used for corpus search, separate from commitment
 */
export interface RetrievalAttribution {
  /** The attributed author/source for retrieval purposes */
  author?: string;
  /** Confidence in the attribution (0-1), decays with distance */
  confidence: number;
  /** Whether this attribution was inherited from a previous claim */
  inherited: boolean;
  /** Distance from the original attribution (in claims) */
  distanceFromSource: number;
  /** Flags indicating special conditions */
  flags?: ('weak_inheritance' | 'topic_shifted' | 'paragraph_boundary' | 'weak_due_to_block')[];
}

/**
 * A detected claim with full classification and validation requirements
 */
export interface DetectedClaim {
  /** Unique identifier for this claim */
  id: string;

  /** The claim text */
  text: string;

  /** Position in the source content */
  position: {
    line: number;
    char: number;
    sentenceIndex: number;
    /** Paragraph index in document (0-indexed) */
    paragraphIndex: number;
  };

  /** Multi-axis classification profile */
  profile: ClaimProfile;

  /** Computed risk level */
  riskLevel: RiskLevel;

  /** Validation requirements derived from profile */
  validationRequirements: ComposedValidationRequirements;

  /** For composite claims: decomposed subclaims */
  subclaims?: DetectedClaim[];

  /** Commitment - who bears epistemic responsibility */
  commitment: CommitmentType;

  /** Retrieval attribution - used for corpus search (separate from commitment) */
  retrievalAttribution?: RetrievalAttribution;

  /** Context information */
  context: {
    /** Surrounding text for context */
    surrounding: string;
    /** Inherited attribution from previous claims (legacy, use retrievalAttribution) */
    inheritedAttribution?: string;
    /** Previous sentences in paragraph */
    previousSentences: string[];
  };

  /** Raw pattern match information (for debugging) */
  matchInfo?: {
    category: ClaimCategory;
    patternId: string;
    groups: Record<string, string>;
  };
}

/**
 * Context for claim detection
 */
export interface DetectionContext {
  /** Known authors in the corpus */
  knownAuthors?: string[];

  /** Previous claims (for attribution inheritance) */
  previousClaims?: DetectedClaim[];

  /** Current section/topic */
  currentTopic?: string;

  /** Paragraph index in document */
  paragraphIndex?: number;
}

/**
 * Options for the claim detector
 */
export interface ClaimDetectorOptions {
  /** Minimum confidence threshold for classification (default: 0.5) */
  minConfidence?: number;

  /** Context window size in characters (default: 200) */
  contextWindowSize?: number;

  /** Enable debug logging */
  debug?: boolean;

  /** Risk levels to always detect (default: all) */
  detectRiskLevels?: RiskLevel[];

  /** Maximum claims per paragraph (circuit breaker, default: 50) */
  maxClaimsPerParagraph?: number;
}

/**
 * Segmented sentence with context
 */
export interface SentenceContext {
  /** The sentence text */
  text: string;

  /** Line number (1-indexed) */
  lineNumber: number;

  /** Character position in content */
  startPosition: number;

  /** Sentence index (0-indexed) */
  sentenceIndex: number;

  /** Paragraph index (0-indexed) */
  paragraphIndex: number;

  /** Surrounding context */
  context: string;

  /** Previous sentences */
  previousSentences: string[];
}

/**
 * Claim categories for pattern matching
 */
export type ClaimCategory =
  | 'attributional'
  | 'ontological'
  | 'structural'
  | 'temporal'
  | 'comparative'
  | 'metadiscursive';

// =============================================================================
// ATTRIBUTION INHERITANCE CONSTANTS
// =============================================================================

/**
 * Topic shift markers that reset attribution inheritance
 */
const TOPIC_SHIFT_MARKERS = [
  'however',
  'in contrast',
  'conversely',
  'on the other hand',
  'unlike',
  'whereas',
  'but',
  'yet',
  'nevertheless',
  'nonetheless',
  'on the contrary',
  'alternatively',
  'instead',
  'rather',
] as const;

/**
 * Distance decay parameters
 * Formula: confidence = baseConfidence * e^(-DECAY_RATE * distance)
 */
const ATTRIBUTION_DECAY_RATE = 0.5;
const ATTRIBUTION_CONFIDENCE_THRESHOLD = 0.3;

/**
 * Jaccard similarity threshold for topic drift detection
 */
const TOPIC_SIMILARITY_THRESHOLD = 0.15;

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

/**
 * Attribution patterns - who is making the claim?
 */
const ATTRIBUTIONAL_PATTERNS: Record<string, RegExp[]> = {
  directAttribution: [
    /(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?)\s+(?<verb>argues?|claims?|states?|maintains?|holds?|contends?|asserts?)\s+that\s+(?<claim>.+)/gi,
    /According\s+to\s+(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.?)?),?\s+(?<claim>.+)/gi,
    /[Aa]s\s+(?<author>[A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?)\s+(?<verb>notes?|observes?|points?\s+out|remarks?),?\s+(?<claim>.+)/gi,
  ],

  qualifiedDirect: [
    /(?<author>[A-Z][a-z]+)\s+(?<qualifier>explicitly|directly|clearly|unambiguously)\s+(?<verb>claims?|argues?|states?)\s+that\s+(?<claim>.+)/gi,
  ],

  demonstrative: [
    /[Aa]s\s+(?<author>[A-Z][a-z]+)\s+(?<verb>demonstrates?|shows?|proves?|establishes?),?\s+(?<claim>.+)/gi,
    /(?<author>[A-Z][a-z]+)\s+(?<verb>demonstrates?|shows?|proves?|establishes?)\s+that\s+(?<claim>.+)/gi,
  ],

  interpretive: [
    /(?<author>[A-Z][a-z]+)\s+(?<hedge>can\s+be\s+read\s+as|might\s+be\s+understood\s+as|could\s+be\s+seen\s+as)\s+(?<verb>suggesting?|implying?|indicating?)\s+(?<claim>.+)/gi,
    /(?<author>[A-Z][a-z]+)'s\s+(?:view|position|analysis)\s+(?<verb>suggests?|implies?|indicates?)\s+(?<claim>.+)/gi,
  ],

  scholarlyConsensus: [
    /(?:Scholars|Commentators|Interpreters|Researchers)\s+(?:generally|widely|largely|typically)\s+(?<verb>agree|hold|maintain|accept)\s+that\s+(?<claim>.+)/gi,
    /(?:The|A)\s+(?:scholarly|academic|critical)\s+consensus\s+(?:is|holds|maintains)\s+that\s+(?<claim>.+)/gi,
  ],

  scholarlyDispute: [
    /(?:Some|Certain)\s+(?:scholars|commentators)\s+(?<verb>argue|claim|maintain)\s+(?<claim1>.+?),?\s+(?:while|whereas|but)\s+(?:others?)\s+(?<verb2>argue|claim|maintain)\s+(?<claim2>.+)/gi,
    /(?:There\s+is\s+)?(?:debate|disagreement|controversy)\s+(?:about|over|regarding)\s+(?<claim>.+)/gi,
  ],

  proxyAttribution: [
    /According\s+to\s+(?:the\s+)?(?<tradition>tradition|standard\s+reading|received\s+view|conventional\s+interpretation),?\s+(?<claim>.+)/gi,
    /(?:The\s+)?(?<tradition>traditional|standard|orthodox)\s+(?:reading|interpretation|view)\s+(?:holds|is|maintains)\s+that\s+(?<claim>.+)/gi,
  ],

  anonymousAuthority: [
    /It\s+is\s+(?:widely|generally|commonly|often)\s+(?:held|believed|accepted|assumed|thought)\s+that\s+(?<claim>.+)/gi,
    /(?:Many|Most)\s+(?:believe|hold|accept|assume)\s+that\s+(?<claim>.+)/gi,
  ],
};

/**
 * Ontological/definitional patterns - what is something?
 */
const ONTOLOGICAL_PATTERNS: Record<string, RegExp[]> = {
  explicitDefinition: [
    /(?<term>[A-Za-z]+)\s+(?:is|are)\s+(?:defined|understood|conceived)\s+as\s+(?<definition>.+)/gi,
    /(?:The\s+)?(?:concept|notion|term)\s+(?:of\s+)?['"]?(?<term>\w+)['"]?\s+(?:refers|denotes|means|signifies)\s+(?<definition>.+)/gi,
  ],

  functionalDefinition: [
    /(?<term>[A-Za-z]+)\s+(?:functions?|serves?|operates?|works?)\s+(?:to|as|by)\s+(?<function>.+)/gi,
    /(?:The\s+)?(?:function|role|purpose)\s+of\s+(?<term>\w+)\s+is\s+(?<function>.+)/gi,
  ],

  negativeDefinition: [
    /(?<term>[A-Za-z]+)\s+is\s+not\s+(?<negation>[A-Za-z]+)/gi,
    /(?<term>[A-Za-z]+)\s+(?:differs?|is\s+distinct)\s+from\s+(?<contrast>.+)/gi,
  ],

  relationalOntology: [
    /(?<term>[A-Za-z]+)\s+(?:mediates?|bridges?|connects?|links?)\s+(?:between\s+)?(?<relatum1>.+?)\s+and\s+(?<relatum2>.+)/gi,
    /(?<term>[A-Za-z]+)\s+(?:lies?|stands?|operates?)\s+between\s+(?<relatum1>.+?)\s+and\s+(?<relatum2>.+)/gi,
  ],

  modalOntology: [
    /(?<term>[A-Za-z]+)\s+(?<modal>can|could|may|might|must|cannot|need\s+not)\s+(?:exist|occur|operate|function)\s+(?<condition>.+)/gi,
  ],

  dependencyClaim: [
    /(?<dependent>\w+)\s+(?<modal>cannot|could\s+not|is\s+impossible)\s+(?:occur|exist|happen)\s+without\s+(?<dependency>\w+)/gi,
    /(?<dependency>\w+)\s+is\s+(?:necessary|required|essential)\s+for\s+(?<dependent>\w+)/gi,
  ],
};

/**
 * Structural/logical patterns - how things relate
 */
const STRUCTURAL_PATTERNS: Record<string, RegExp[]> = {
  composite: [
    /(?:Both\s+)?(?<term1>.+?)\s+and\s+(?<term2>.+?)\s+(?<predicate>function|serve|operate|work)\s+as\s+(?<common>.+)/gi,
  ],

  conjunctive: [
    /(?<premise1>.+?)\s+and\s+(?<premise2>.+?),?\s+(?:therefore|thus|hence|consequently)\s+(?<conclusion>.+)/gi,
  ],

  disjunctive: [
    /(?:Either\s+)?(?<option1>.+?)\s+or\s+(?<option2>.+?)\s+(?<predicate>explains?|accounts?\s+for|describes?)\s+(?<explanandum>.+)/gi,
  ],

  conditional: [
    /[Ii]f\s+(?<antecedent>.+?),?\s+then\s+(?<consequent>.+)/gi,
    /(?<consequent>.+?)\s+(?:only\s+)?if\s+(?<antecedent>.+)/gi,
  ],

  inferential: [
    /(?:Therefore|Thus|Hence|Consequently|It\s+follows\s+that|We\s+can\s+conclude\s+that),?\s+(?<conclusion>.+)/gi,
  ],

  explanatory: [
    /This\s+(?:explains?|accounts?\s+for|clarifies?)\s+(?:why|how)\s+(?<explanandum>.+)/gi,
    /(?<explanans>.+?)\s+(?:explains?|accounts?\s+for)\s+(?<explanandum>.+)/gi,
  ],
};

/**
 * Temporal/rhetorical patterns
 */
const TEMPORAL_PATTERNS: Record<string, RegExp[]> = {
  temporalSequencing: [
    /(?:First|Initially)\s+(?<step1>.+?),?\s+(?:then|next|subsequently|afterwards)\s+(?<step2>.+)/gi,
    /(?<step1>.+?)\s+(?:precedes|comes\s+before|is\s+prior\s+to)\s+(?<step2>.+)/gi,
  ],

  diachronic: [
    /(?:Over\s+time|Throughout|Across\s+(?:his|her|their)\s+(?:work|corpus|career)),?\s+(?<author>[A-Z][a-z]+)\s+(?<verb>shifts?|develops?|changes?|evolves?|moves?)\s+(?<change>.+)/gi,
  ],

  rhetoricalFunction: [
    /(?:This|The)\s+(?:concept|notion|idea|term)\s+(?<verb>prepares?|primes?|orients?|disposes?)\s+(?:the\s+)?(?:audience|reader|listener)\s+(?<effect>.+)/gi,
  ],

  methodological: [
    /(?<author>[A-Z][a-z]+)\s+(?:proceeds|begins|starts)\s+by\s+(?:first\s+)?(?<method>.+)/gi,
  ],
};

/**
 * Comparative patterns
 */
const COMPARATIVE_PATTERNS: Record<string, RegExp[]> = {
  directComparison: [
    /[Uu]nlike\s+(?<author1>[A-Z][a-z]+),?\s+(?:who\s+)?(?<position1>.+?),?\s+(?<author2>[A-Z][a-z]+)\s+(?<position2>.+)/gi,
    /[Ww]hereas\s+(?<author1>[A-Z][a-z]+)\s+(?<position1>.+?),?\s+(?<author2>[A-Z][a-z]+)\s+(?<position2>.+)/gi,
  ],

  asymmetricContrast: [
    /(?<author1>[A-Z][a-z]+)\s+(?<verb>rejects?|denies?|dismisses?|challenges?)\s+(?:what\s+)?(?<author2>[A-Z][a-z]+)\s+(?:assumes?|accepts?|takes\s+for\s+granted)/gi,
  ],

  alignment: [
    /(?<author1>[A-Z][a-z]+)\s+(?<verb>echoes?|mirrors?|parallels?|resonates?\s+with|anticipates?)\s+(?<author2>[A-Z][a-z]+)(?:'s)?\s+(?<aspect>.+)/gi,
  ],

  genealogical: [
    /(?:This|The)\s+(?:view|position|argument|reading)\s+(?<verb>develops?|derives?|emerges?|grows?)\s+from\s+(?<origin>.+)/gi,
  ],
};

/**
 * Meta-discursive patterns
 */
const METADISCURSIVE_PATTERNS: Record<string, RegExp[]> = {
  scopeClaim: [
    /(?:This|The\s+present)\s+(?:chapter|section|paper|essay|dissertation)\s+(?<verb>argues?|claims?|contends?|maintains?|shows?|demonstrates?)\s+that\s+(?<claim>.+)/gi,
  ],

  noveltyClaim: [
    /(?:This|The\s+present)\s+(?:reading|interpretation|analysis|approach)\s+(?:has\s+been|remains?)\s+(?<status>overlooked|neglected|underappreciated|unexplored)/gi,
    /(?:No\s+)?(?:scholar|commentator|interpreter)\s+has\s+(?:yet\s+)?(?<verb>noted|observed|addressed|considered)\s+(?<claim>.+)/gi,
  ],

  significanceClaim: [
    /(?:This|It)\s+is\s+(?<importance>crucial|essential|vital|central|fundamental|key)\s+(?:for|to)\s+understanding\s+(?<topic>.+)/gi,
  ],

  emphasisClaim: [
    /(?<importance>Central|Fundamental|Essential|Key|Crucial)\s+to\s+(?<author>[A-Z][a-z]+)'s\s+(?:view|account|analysis|argument)\s+(?<claim>.+)/gi,
  ],
};

/**
 * All patterns by category
 */
const ALL_PATTERNS: Record<ClaimCategory, Record<string, RegExp[]>> = {
  attributional: ATTRIBUTIONAL_PATTERNS,
  ontological: ONTOLOGICAL_PATTERNS,
  structural: STRUCTURAL_PATTERNS,
  temporal: TEMPORAL_PATTERNS,
  comparative: COMPARATIVE_PATTERNS,
  metadiscursive: METADISCURSIVE_PATTERNS,
};

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULT_OPTIONS: Required<ClaimDetectorOptions> = {
  minConfidence: 0.5,
  contextWindowSize: 200,
  debug: false,
  detectRiskLevels: ['critical', 'high', 'medium', 'low'],
  maxClaimsPerParagraph: 50,
};

// =============================================================================
// CLAIM DETECTOR CLASS
// =============================================================================

/**
 * Claim Detector for extracting and classifying claims from text
 */
export class ClaimDetector {
  private classifier: MultiAxisClaimClassifier;
  private ruleEngine: ValidationRuleEngine;
  private options: Required<ClaimDetectorOptions>;
  private claimIdCounter: number = 0;

  constructor(options: ClaimDetectorOptions = {}) {
    this.classifier = new MultiAxisClaimClassifier();
    this.ruleEngine = new ValidationRuleEngine();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Detect all claims in content
   */
  async detectClaims(
    content: string,
    context: DetectionContext = {}
  ): Promise<DetectedClaim[]> {
    const claims: DetectedClaim[] = [];
    const sentences = this.segmentSentences(content);

    // Track attribution state for inheritance
    let currentAttribution: {
      author: string;
      paragraphIndex: number;
      sentenceIndex: number;
      baseConfidence: number;
    } | null = null;

    for (const sentence of sentences) {
      // Stage 1: Pattern-based detection
      const patternMatches = this.applyPatterns(sentence);

      // Stage 2: Classify each match
      for (const match of patternMatches) {
        // Build classification context
        const classificationContext: ClassificationContext = {
          surroundingText: sentence.context,
          previousClaims: claims.map((c) => ({
            profile: c.profile,
            text: c.text,
          })),
          knownAuthors: context.knownAuthors,
          currentTopic: context.currentTopic,
        };

        // Classify claim
        const profile = await this.classifier.classify(
          match.text,
          classificationContext
        );

        // Skip low confidence classifications
        const avgConfidence = this.classifier.getOverallConfidence(profile);
        if (avgConfidence < this.options.minConfidence) {
          continue;
        }

        // Compute validation requirements
        const validationRequirements = this.ruleEngine.computeRequirements(profile);

        // Compute risk level
        const riskLevel = computeRiskLevel(profile);

        // Skip if risk level not in detection list
        if (!this.options.detectRiskLevels.includes(riskLevel)) {
          continue;
        }

        // Determine commitment type (who bears epistemic responsibility)
        const commitment = this.determineCommitment(profile, match.text);

        // Handle attribution - either direct or inherited
        let retrievalAttribution: RetrievalAttribution | undefined;
        let inheritedAttribution: string | undefined;

        // Check for direct attribution in this claim
        if (profile.attribution.authors?.length) {
          // New explicit attribution - update tracking
          currentAttribution = {
            author: profile.attribution.authors[0],
            paragraphIndex: sentence.paragraphIndex,
            sentenceIndex: sentence.sentenceIndex,
            baseConfidence: 1.0,
          };

          retrievalAttribution = {
            author: profile.attribution.authors[0],
            confidence: 1.0,
            inherited: false,
            distanceFromSource: 0,
          };
        } else if (currentAttribution) {
          // Consider inheriting attribution from previous claim
          const inheritanceResult = this.calculateInheritedAttribution(
            currentAttribution,
            sentence,
            claims.length > 0 ? claims[claims.length - 1] : undefined,
            match.text
          );

          if (inheritanceResult) {
            retrievalAttribution = inheritanceResult;
            inheritedAttribution = inheritanceResult.author;
          } else {
            // Attribution inheritance blocked - reset tracking
            currentAttribution = null;
          }
        }

        // Create detected claim with new fields
        const claim: DetectedClaim = {
          id: this.generateClaimId(),
          text: match.text,
          position: {
            line: sentence.lineNumber,
            char: match.position,
            sentenceIndex: sentence.sentenceIndex,
            paragraphIndex: sentence.paragraphIndex,
          },
          profile,
          riskLevel,
          validationRequirements,
          commitment,
          retrievalAttribution,
          context: {
            surrounding: sentence.context,
            inheritedAttribution, // Keep for backwards compatibility
            previousSentences: sentence.previousSentences,
          },
          matchInfo: {
            category: match.category,
            patternId: match.patternId,
            groups: match.groups,
          },
        };

        claims.push(claim);

        // Circuit breaker
        if (claims.length >= this.options.maxClaimsPerParagraph) {
          if (this.options.debug) {
            console.warn(
              `[ClaimDetector] Hit max claims limit (${this.options.maxClaimsPerParagraph})`
            );
          }
          break;
        }
      }
    }

    // Stage 3: Resolve attributions across all claims (enhanced)
    return this.resolveAttributions(claims, context);
  }

  /**
   * Determine commitment type (who bears epistemic responsibility)
   */
  private determineCommitment(profile: ClaimProfile, text: string): CommitmentType {
    // Direct attribution = source commitment
    if (profile.attribution.type === AttributionType.DIRECT) {
      return 'source';
    }

    // Scholarly consensus
    if (profile.attribution.type === AttributionType.CONSENSUS) {
      return 'consensus';
    }

    // Metadiscursive claims (essay voice)
    if (text.toLowerCase().includes('this chapter') ||
        text.toLowerCase().includes('this essay') ||
        text.toLowerCase().includes('this paper') ||
        text.toLowerCase().includes('i argue') ||
        text.toLowerCase().includes('we argue')) {
      return 'essay';
    }

    // Anonymous authority or no attribution = essay takes responsibility
    if (profile.attribution.type === AttributionType.ANONYMOUS ||
        profile.attribution.type === AttributionType.NONE) {
      return 'essay';
    }

    // Inherited/proxy attributions - still essay commitment unless explicitly sourced
    return 'essay';
  }

  /**
   * Calculate inherited attribution with paragraph boundaries, distance decay, and topic drift
   */
  private calculateInheritedAttribution(
    source: {
      author: string;
      paragraphIndex: number;
      sentenceIndex: number;
      baseConfidence: number;
    },
    currentSentence: SentenceContext,
    previousClaim: DetectedClaim | undefined,
    currentText: string
  ): RetrievalAttribution | null {
    const flags: RetrievalAttribution['flags'] = [];

    // HARD STOP: Paragraph boundary check
    if (currentSentence.paragraphIndex !== source.paragraphIndex) {
      if (this.options.debug) {
        console.log(`[ClaimDetector] Attribution blocked by paragraph boundary (${source.paragraphIndex} -> ${currentSentence.paragraphIndex})`);
      }
      return null; // Attribution does NOT inherit across paragraphs
    }

    // Check for topic shift markers
    if (this.hasTopicShiftMarker(currentText)) {
      if (this.options.debug) {
        console.log(`[ClaimDetector] Attribution reset by topic shift marker`);
      }
      return null;
    }

    // Calculate distance from source
    const distance = currentSentence.sentenceIndex - source.sentenceIndex;

    // Calculate decayed confidence: e^(-0.5 * distance)
    const decayedConfidence = source.baseConfidence * Math.exp(-ATTRIBUTION_DECAY_RATE * distance);

    // Check if below threshold
    if (decayedConfidence < ATTRIBUTION_CONFIDENCE_THRESHOLD) {
      flags.push('weak_inheritance');

      if (this.options.debug) {
        console.log(`[ClaimDetector] Weak inheritance: confidence ${decayedConfidence.toFixed(3)} < threshold ${ATTRIBUTION_CONFIDENCE_THRESHOLD}`);
      }
    }

    // Check for topic drift via Jaccard similarity
    if (previousClaim) {
      const similarity = this.calculateTopicSimilarity(previousClaim.text, currentText);
      if (similarity < TOPIC_SIMILARITY_THRESHOLD) {
        flags.push('topic_shifted');

        if (this.options.debug) {
          console.log(`[ClaimDetector] Topic drift detected: Jaccard similarity ${similarity.toFixed(3)} < threshold ${TOPIC_SIMILARITY_THRESHOLD}`);
        }

        // Topic drift resets attribution
        return null;
      }
    }

    return {
      author: source.author,
      confidence: decayedConfidence,
      inherited: true,
      distanceFromSource: distance,
      flags: flags.length > 0 ? flags : undefined,
    };
  }

  /**
   * Check if text contains topic shift markers
   */
  private hasTopicShiftMarker(text: string): boolean {
    const textLower = text.toLowerCase();
    return TOPIC_SHIFT_MARKERS.some(marker =>
      new RegExp(`\\b${marker}\\b`, 'i').test(textLower)
    );
  }

  /**
   * Calculate Jaccard similarity between two texts (for topic drift detection)
   */
  private calculateTopicSimilarity(text1: string, text2: string): number {
    const words1 = new Set(
      text1.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
    const words2 = new Set(
      text2.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );

    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    // Jaccard: |intersection| / |union|
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Segment content into sentences with context
   */
  private segmentSentences(content: string): SentenceContext[] {
    const sentences: SentenceContext[] = [];

    // Split into paragraphs first (double newline or single newline with blank line)
    const paragraphs = content.split(/\n\s*\n/);

    let charOffset = 0;
    let sentenceIndex = 0;
    let paragraphIndex = 0;
    const previousSentences: string[] = [];

    for (const paragraph of paragraphs) {
      const lines = paragraph.split('\n');
      let paragraphHasSentences = false;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];

        // Split line into sentences (basic segmentation)
        // Handles common abbreviations and edge cases
        const sentenceRegex = /[^.!?]*[.!?]+(?:\s|$)|[^.!?]+$/g;
        let match;

        while ((match = sentenceRegex.exec(line)) !== null) {
          const sentenceText = match[0].trim();
          if (!sentenceText) continue;

          paragraphHasSentences = true;

          // Build context window
          const contextStart = Math.max(0, charOffset + match.index - this.options.contextWindowSize);
          const contextEnd = Math.min(
            content.length,
            charOffset + match.index + sentenceText.length + this.options.contextWindowSize
          );
          const context = content.slice(contextStart, contextEnd);

          sentences.push({
            text: sentenceText,
            lineNumber: sentenceIndex + 1, // Simplified line tracking
            startPosition: charOffset + match.index,
            sentenceIndex,
            paragraphIndex,
            context,
            previousSentences: [...previousSentences.slice(-3)], // Last 3 sentences
          });

          previousSentences.push(sentenceText);
          sentenceIndex++;
        }

        charOffset += line.length + 1; // +1 for newline
      }

      // Only increment paragraph index if we found sentences
      if (paragraphHasSentences) {
        paragraphIndex++;
      }

      // Account for paragraph separator
      charOffset += 1;
    }

    return sentences;
  }

  /**
   * Apply all pattern categories to a sentence
   */
  private applyPatterns(sentence: SentenceContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const [category, categoryPatterns] of Object.entries(ALL_PATTERNS) as [
      ClaimCategory,
      Record<string, RegExp[]>
    ][]) {
      for (const [patternId, regexes] of Object.entries(categoryPatterns)) {
        for (const regex of regexes) {
          // Reset regex state
          regex.lastIndex = 0;

          const match = regex.exec(sentence.text);
          if (match) {
            matches.push({
              text: match[0],
              category,
              patternId,
              groups: match.groups || {},
              position: sentence.startPosition + (match.index || 0),
            });
          }
        }
      }
    }

    return matches;
  }

  /**
   * Resolve anaphoric references and inherited attributions (enhanced)
   *
   * This method now works with the commitment/retrievalAttribution separation:
   * - Commitment: who bears epistemic responsibility (never degrades to 'source' on block)
   * - RetrievalAttribution: used for corpus search (can be inherited but weakened)
   */
  private resolveAttributions(
    claims: DetectedClaim[],
    context: DetectionContext
  ): DetectedClaim[] {
    const authorStack: string[] = [];
    let lastParagraphIndex = -1;

    // Pre-populate with context's previous claims
    if (context.previousClaims) {
      for (const prev of context.previousClaims) {
        if (prev.profile.attribution.authors?.length) {
          authorStack.push(prev.profile.attribution.authors[0]);
        }
      }
    }

    return claims.map((claim, index) => {
      // Track explicit authors
      if (claim.profile.attribution.authors?.length) {
        authorStack.push(claim.profile.attribution.authors[0]);
      }

      // Check for paragraph boundary - reset attribution stack
      if (claim.position.paragraphIndex !== lastParagraphIndex) {
        // Don't clear the stack, but mark that we crossed a boundary
        // The calculateInheritedAttribution already handles this
        lastParagraphIndex = claim.position.paragraphIndex;
      }

      // Resolve "this view" / "this argument" references (proxy attribution)
      if (
        claim.profile.attribution.type === AttributionType.PROXY &&
        !claim.profile.attribution.authors?.length &&
        authorStack.length > 0
      ) {
        // For proxy attributions, update the profile but commitment stays 'essay'
        // because the essay author is using the source's view, not directly quoting
        const lastAuthor = authorStack[authorStack.length - 1];

        return {
          ...claim,
          commitment: 'essay' as CommitmentType, // Essay author bears responsibility for interpretation
          profile: {
            ...claim.profile,
            attribution: {
              ...claim.profile.attribution,
              type: AttributionType.INHERITED,
              authors: [lastAuthor],
              inherited: true,
              inheritedFrom: lastAuthor,
            },
          },
          retrievalAttribution: claim.retrievalAttribution ?? {
            author: lastAuthor,
            confidence: 0.5, // Lower confidence for proxy attribution
            inherited: true,
            distanceFromSource: 1, // Treated as distance 1 since it's indirect
            flags: ['weak_inheritance'],
          },
          context: {
            ...claim.context,
            inheritedAttribution: lastAuthor,
          },
        };
      }

      // Check for anonymous authority (critical risk)
      if (claim.profile.attribution.type === AttributionType.ANONYMOUS) {
        // Mark as critical risk requiring resolution
        // Commitment is 'essay' since anonymous authority = essay takes responsibility
        return {
          ...claim,
          commitment: 'essay' as CommitmentType,
          riskLevel: 'critical' as RiskLevel,
          validationRequirements: {
            ...claim.validationRequirements,
            citationRequired: 'mandatory' as const,
            multiSourceRequired: true,
            rationale:
              claim.validationRequirements.rationale +
              '; Anonymous authority claims must be resolved to specific sources',
          },
        };
      }

      return claim;
    });
  }

  /**
   * Calculate inheritance confidence using exponential decay (public API for testing)
   */
  calculateInheritanceConfidence(distance: number): number {
    return Math.exp(-ATTRIBUTION_DECAY_RATE * distance);
  }

  /**
   * Get topic similarity between two texts (public API for testing)
   */
  getTopicSimilarity(text1: string, text2: string): number {
    return this.calculateTopicSimilarity(text1, text2);
  }

  /**
   * Check if text has topic shift marker (public API for testing)
   */
  checkTopicShiftMarker(text: string): boolean {
    return this.hasTopicShiftMarker(text);
  }

  /**
   * Generate unique claim ID
   */
  private generateClaimId(): string {
    return `claim_${Date.now()}_${++this.claimIdCounter}`;
  }

  /**
   * Get detection statistics
   */
  getStatistics(claims: DetectedClaim[]): DetectionStatistics {
    const byCategory: Record<ClaimCategory, number> = {
      attributional: 0,
      ontological: 0,
      structural: 0,
      temporal: 0,
      comparative: 0,
      metadiscursive: 0,
    };

    const byRisk: Record<RiskLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const claim of claims) {
      if (claim.matchInfo) {
        byCategory[claim.matchInfo.category]++;
      }
      byRisk[claim.riskLevel]++;
    }

    return {
      totalClaims: claims.length,
      byCategory,
      byRisk,
      averageConfidence:
        claims.length > 0
          ? claims.reduce(
              (sum, c) => sum + this.classifier.getOverallConfidence(c.profile),
              0
            ) / claims.length
          : 0,
    };
  }
}

// =============================================================================
// HELPER TYPES
// =============================================================================

interface PatternMatch {
  text: string;
  category: ClaimCategory;
  patternId: string;
  groups: Record<string, string>;
  position: number;
}

export interface DetectionStatistics {
  totalClaims: number;
  byCategory: Record<ClaimCategory, number>;
  byRisk: Record<RiskLevel, number>;
  averageConfidence: number;
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new ClaimDetector instance
 */
export function createClaimDetector(
  options?: ClaimDetectorOptions
): ClaimDetector {
  return new ClaimDetector(options);
}
