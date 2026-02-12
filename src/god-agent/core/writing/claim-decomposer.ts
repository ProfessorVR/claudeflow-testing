/**
 * Claim Decomposer (Phase B: Comprehensive Claim Validation System)
 *
 * Breaks composite claims into independently verifiable atomic units.
 * Preserves context during decomposition (decontextualization).
 * Supports dynamic decomposition with confidence-based stopping.
 *
 * Based on research from:
 * - AFEV (Atomic Fact Extraction & Verification)
 * - DnDScore (Decomposition and Decontextualization)
 *
 * @module claim-decomposer
 */

import Anthropic from '@anthropic-ai/sdk';

import { type DetectedClaim } from './claim-detector.js';
import {
  type ClaimProfile,
  StructureType,
  createDefaultProfile,
} from './claim-profile.js';
import {
  MultiAxisClaimClassifier,
  type ClassificationContext,
} from './claim-classifier.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Resolution status for coreference resolution
 */
export type ResolutionStatus = 'resolved' | 'needs_disambiguation' | 'failed';

/**
 * Resolved referent information
 */
export interface ResolvedReferent {
  /** The original referent token (e.g., "this", "it", "they") */
  originalToken: string;
  /** Position of the token in the text */
  position: number;
  /** The resolved antecedent text */
  resolvedTo: string;
  /** Confidence in the resolution (0-1) */
  confidence: number;
  /** Number of candidate antecedents considered */
  candidateCount: number;
  /** Whether the resolution was ambiguous (multiple candidates) */
  wasAmbiguous: boolean;
}

/**
 * An atomic claim - the smallest independently verifiable unit
 */
export interface AtomicClaim {
  /** Unique identifier */
  id: string;

  /** The atomic claim text */
  text: string;

  /** Decontextualized context (what the claim refers to) */
  context: string;

  /** Parent claim ID */
  parentClaimId: string;

  /** Classification profile (may differ from parent) */
  profile: ClaimProfile;

  /** Whether this atomic claim requires explicit attribution */
  requiresAttribution: boolean;

  /** Path through decomposition tree */
  decompositionPath: string[];

  /** Index in decomposition sequence */
  sequenceIndex: number;

  /** Resolution status for coreference */
  resolutionStatus: ResolutionStatus;

  /** IDs of claims this claim depends on (for dependency graph) */
  dependsOnClaimIds: string[];

  /** Resolved referents (if any coreference resolution was performed) */
  resolvedReferents?: ResolvedReferent[];

  /** Decomposition metadata */
  metadata: {
    /** How this subclaim relates to parent */
    relationToParent: 'premise' | 'conclusion' | 'conjunct' | 'disjunct' | 'antecedent' | 'consequent' | 'component';
    /** Original position in parent claim */
    originalPosition?: number;
    /** Whether context was added during decontextualization */
    contextAdded: boolean;
    /** Whether coreference resolution was applied */
    coreferenceResolved?: boolean;
    /** Original text before coreference resolution */
    originalText?: string;
  };
}

/**
 * Result of decomposing a claim
 */
export interface DecompositionResult {
  /** The original claim */
  original: DetectedClaim;

  /** Atomic subclaims (may be just the original if not composite) */
  atomicClaims: AtomicClaim[];

  /** Strategy used for decomposition */
  decompositionStrategy: DecompositionStrategy;

  /** Whether the confidence threshold was met (for dynamic decomposition) */
  confidenceThresholdMet: boolean;

  /** Number of decomposition iterations */
  iterations: number;

  /** Whether decomposition was needed */
  wasDecomposed: boolean;

  /** Decomposition tree structure */
  tree: DecompositionNode;
}

/**
 * Decomposition strategy types
 */
export type DecompositionStrategy =
  | 'none'           // Claim is already atomic
  | 'parallel'       // Alias for conjunctive
  | 'conjunctive'    // Conjunctive: A and B -> [A, B]
  | 'sequential'     // Alias for inferential
  | 'inferential'    // Inferential: premise + conclusion
  | 'conditional'    // If-then: antecedent + consequent
  | 'disjunctive'    // Either-or: [option1, option2]
  | 'explanatory'    // Because: explanans + explanandum
  | 'llm_semantic';  // LLM-based semantic decomposition

/**
 * Node in decomposition tree
 */
export interface DecompositionNode {
  /** Claim text at this node */
  text: string;
  /** Whether this is a leaf (atomic) */
  isLeaf: boolean;
  /** Strategy used to decompose this node */
  strategy: DecompositionStrategy;
  /** Child nodes (if not leaf) */
  children: DecompositionNode[];
}

/**
 * Options for the decomposer
 */
export interface DecomposerOptions {
  /** Maximum decomposition depth (default: 3) */
  maxDepth?: number;

  /** Confidence threshold for dynamic decomposition (default: 0.8) */
  confidenceThreshold?: number;

  /** Enable LLM-based semantic decomposition (default: false) */
  enableLLMDecomposition?: boolean;

  /** Anthropic API key (required if enableLLMDecomposition is true) */
  apiKey?: string;

  /** Model for LLM decomposition (default: claude-3-haiku) */
  model?: string;

  /** Enable debug logging */
  debug?: boolean;

  /** Minimum claim length to consider for decomposition (default: 50) */
  minClaimLength?: number;
}

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULT_OPTIONS: Required<Omit<DecomposerOptions, 'apiKey'>> & { apiKey?: string } = {
  maxDepth: 3,
  confidenceThreshold: 0.8,
  enableLLMDecomposition: false,
  apiKey: undefined,
  model: 'claude-3-haiku-20240307',
  debug: false,
  minClaimLength: 50,
};

// =============================================================================
// COREFERENCE RESOLUTION PATTERNS
// =============================================================================

/**
 * Referential blocklist - tokens that indicate unresolved coreference
 */
const REFERENTIAL_BLOCKLIST = [
  'this',
  'it',
  'such',
  'these',
  'those',
  'former',
  'latter',
] as const;

/**
 * Discourse phrases that need resolution
 */
const DISCOURSE_PHRASES = [
  'this view',
  'this account',
  'this argument',
  'this position',
  'this reading',
  'this interpretation',
  'this analysis',
  'this approach',
  'this conceptualization',
  'this understanding',
  'this formulation',
  'this notion',
  'this concept',
  'this distinction',
  'this observation',
  'this passage',
  'this claim',
  'this classification',
] as const;

/**
 * Dependency markers that indicate the claim depends on context
 */
const DEPENDENCY_MARKERS = [
  // Demonstratives
  'this',
  'these',
  'those',
  // Anaphoric adverbs
  'therefore',
  'thus',
  'hence',
  'consequently',
  'accordingly',
  // Continuative pronouns
  'such',
  // Discourse nouns (partial - checked via DISCOURSE_PHRASES)
] as const;

/**
 * Pronouns that may need resolution
 */
const PRONOUNS_NEEDING_RESOLUTION = [
  'he',
  'she',
  'they',
  'it',
  'his',
  'her',
  'their',
  'its',
  'him',
  'them',
  'whose',
] as const;

// =============================================================================
// DECOMPOSITION PATTERNS
// =============================================================================

/**
 * Patterns for detecting decomposable structures
 */
const DECOMPOSITION_PATTERNS = {
  // Conjunctive: "Both X and Y...", "X and Y both..."
  conjunctive: [
    /(?:Both\s+)?(?<part1>.+?)\s+and\s+(?<part2>.+?)\s+(?:both\s+)?(?<predicate>function|serve|operate|are|is|work)/i,
    /(?<part1>.+?),?\s+and\s+(?:also\s+)?(?<part2>.+)/i,
  ],

  // Disjunctive: "Either X or Y...", "X or Y..."
  disjunctive: [
    /(?:Either\s+)?(?<part1>.+?)\s+or\s+(?<part2>.+)/i,
  ],

  // Conditional: "If X, then Y", "Y if X"
  conditional: [
    /[Ii]f\s+(?<antecedent>.+?),?\s+then\s+(?<consequent>.+)/i,
    /(?<consequent>.+?)\s+(?:only\s+)?if\s+(?<antecedent>.+)/i,
  ],

  // Inferential: "X, therefore Y", "X, thus Y"
  inferential: [
    /(?<premise>.+?),?\s+(?:therefore|thus|hence|consequently|so)\s+(?<conclusion>.+)/i,
    /(?:Since|Because|Given\s+that)\s+(?<premise>.+?),?\s+(?<conclusion>.+)/i,
  ],

  // Explanatory: "X because Y", "X explains Y"
  explanatory: [
    /(?<explanandum>.+?)\s+because\s+(?<explanans>.+)/i,
    /(?<explanans>.+?)\s+(?:explains?|accounts?\s+for)\s+(?:why\s+)?(?<explanandum>.+)/i,
  ],
};

// =============================================================================
// CLAIM DECOMPOSER CLASS
// =============================================================================

/**
 * Claim Decomposer for breaking composite claims into atomic units
 */
export class ClaimDecomposer {
  private options: Required<Omit<DecomposerOptions, 'apiKey'>> & { apiKey?: string };
  private anthropic?: Anthropic;
  private classifier: MultiAxisClaimClassifier;
  private atomicIdCounter: number = 0;

  constructor(options: DecomposerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.classifier = new MultiAxisClaimClassifier();

    if (this.options.enableLLMDecomposition && this.options.apiKey) {
      this.anthropic = new Anthropic({ apiKey: this.options.apiKey });
    }
  }

  /**
   * Decompose a claim into atomic subclaims
   */
  async decompose(claim: DetectedClaim): Promise<DecompositionResult> {
    // Check if decomposition is needed
    if (!this.shouldDecompose(claim)) {
      return this.createAtomicResult(claim);
    }

    // Try pattern-based decomposition first
    const patternResult = await this.patternDecompose(claim);
    if (patternResult.wasDecomposed) {
      return patternResult;
    }

    // Fall back to LLM decomposition if enabled
    if (this.options.enableLLMDecomposition && this.anthropic) {
      return this.llmDecompose(claim);
    }

    // No decomposition possible
    return this.createAtomicResult(claim);
  }

  /**
   * Dynamic decomposition with confidence-based stopping
   */
  async dynamicDecompose(
    claim: DetectedClaim,
    verifyConfidence: (atomic: AtomicClaim) => Promise<number>
  ): Promise<DecompositionResult> {
    let currentResult = await this.decompose(claim);
    let iteration = 0;

    while (iteration < this.options.maxDepth) {
      iteration++;

      // Check confidence for each atomic claim
      const confidences = await Promise.all(
        currentResult.atomicClaims.map(verifyConfidence)
      );

      // If all claims meet threshold, we're done
      const allMeetThreshold = confidences.every(
        (c) => c >= this.options.confidenceThreshold
      );

      if (allMeetThreshold) {
        return {
          ...currentResult,
          confidenceThresholdMet: true,
          iterations: iteration,
        };
      }

      // Find claims below threshold and try to decompose further
      const needsFurtherDecomposition = currentResult.atomicClaims.filter(
        (_, i) => confidences[i] < this.options.confidenceThreshold
      );

      if (needsFurtherDecomposition.length === 0) {
        break;
      }

      // Try to decompose low-confidence claims
      let anyDecomposed = false;
      const newAtomicClaims: AtomicClaim[] = [];

      for (const atomic of currentResult.atomicClaims) {
        const confidence = confidences[currentResult.atomicClaims.indexOf(atomic)];

        if (confidence < this.options.confidenceThreshold) {
          // Convert atomic claim to detected claim for re-decomposition
          const asDetected: DetectedClaim = {
            id: atomic.id,
            text: atomic.text,
            position: claim.position,
            profile: atomic.profile,
            riskLevel: claim.riskLevel,
            validationRequirements: claim.validationRequirements,
            commitment: claim.commitment,
            context: {
              surrounding: atomic.context,
              previousSentences: [],
            },
          };

          const subResult = await this.decompose(asDetected);
          if (subResult.wasDecomposed) {
            anyDecomposed = true;
            newAtomicClaims.push(...subResult.atomicClaims);
          } else {
            newAtomicClaims.push(atomic);
          }
        } else {
          newAtomicClaims.push(atomic);
        }
      }

      if (!anyDecomposed) {
        break;
      }

      currentResult = {
        ...currentResult,
        atomicClaims: newAtomicClaims,
        iterations: iteration,
      };
    }

    return {
      ...currentResult,
      confidenceThresholdMet: false,
      iterations: iteration,
    };
  }

  /**
   * Check if a claim should be decomposed
   */
  private shouldDecompose(claim: DetectedClaim): boolean {
    // Too short to decompose
    if (claim.text.length < this.options.minClaimLength) {
      return false;
    }

    // Check structure type
    const compositeTypes: StructureType[] = [
      StructureType.CONJUNCTIVE,
      StructureType.DISJUNCTIVE,
      StructureType.CONDITIONAL,
      StructureType.INFERENTIAL,
      StructureType.EXPLANATORY,
      StructureType.SEQUENTIAL,
      StructureType.PARALLEL,
    ];

    if (compositeTypes.includes(claim.profile.structure.type)) {
      return true;
    }

    // Check for structural indicators
    const hasConnectives = claim.profile.structure.connectives.length > 0;
    const hasMultipleAtomics = claim.profile.structure.atomicClaimCount > 1;

    return hasConnectives || hasMultipleAtomics;
  }

  /**
   * Pattern-based decomposition
   */
  private async patternDecompose(claim: DetectedClaim): Promise<DecompositionResult> {
    // Try each pattern category
    for (const [strategyName, patterns] of Object.entries(DECOMPOSITION_PATTERNS)) {
      for (const pattern of patterns) {
        const match = pattern.exec(claim.text);
        if (match?.groups) {
          const strategy = strategyName as DecompositionStrategy;
          const atomicClaims = await this.extractAtomicClaims(
            claim,
            match.groups,
            strategy
          );

          if (atomicClaims.length > 1) {
            return {
              original: claim,
              atomicClaims,
              decompositionStrategy: strategy,
              confidenceThresholdMet: false,
              iterations: 1,
              wasDecomposed: true,
              tree: this.buildTree(claim.text, strategy, atomicClaims),
            };
          }
        }
      }
    }

    // No pattern matched
    return this.createAtomicResult(claim);
  }

  /**
   * Extract atomic claims from pattern match
   */
  private async extractAtomicClaims(
    parent: DetectedClaim,
    groups: Record<string, string>,
    strategy: DecompositionStrategy
  ): Promise<AtomicClaim[]> {
    const atomicClaims: AtomicClaim[] = [];
    const baseContext = this.buildDecontextualizedContext(parent);

    switch (strategy) {
      case 'parallel':
      case 'conjunctive': {
        const part1 = groups.part1?.trim();
        const part2 = groups.part2?.trim();
        const predicate = groups.predicate?.trim() || '';

        if (part1) {
          const claim1 = await this.createAtomicClaim(
            `${part1} ${predicate}`.trim(),
            parent,
            baseContext,
            'conjunct',
            0,
            atomicClaims
          );
          atomicClaims.push(claim1);
        }
        if (part2) {
          const claim2 = await this.createAtomicClaim(
            `${part2} ${predicate}`.trim(),
            parent,
            baseContext,
            'conjunct',
            1,
            atomicClaims
          );
          atomicClaims.push(claim2);
        }
        break;
      }

      case 'disjunctive': {
        const option1 = groups.part1?.trim();
        const option2 = groups.part2?.trim();

        if (option1) {
          const claim1 = await this.createAtomicClaim(option1, parent, baseContext, 'disjunct', 0, atomicClaims);
          atomicClaims.push(claim1);
        }
        if (option2) {
          const claim2 = await this.createAtomicClaim(option2, parent, baseContext, 'disjunct', 1, atomicClaims);
          atomicClaims.push(claim2);
        }
        break;
      }

      case 'conditional': {
        const antecedent = groups.antecedent?.trim();
        const consequent = groups.consequent?.trim();

        if (antecedent) {
          const claim1 = await this.createAtomicClaim(
            antecedent,
            parent,
            baseContext,
            'antecedent',
            0,
            atomicClaims
          );
          atomicClaims.push(claim1);
        }
        if (consequent) {
          const claim2 = await this.createAtomicClaim(
            consequent,
            parent,
            `Given that ${antecedent}, ` + baseContext,
            'consequent',
            1,
            atomicClaims
          );
          atomicClaims.push(claim2);
        }
        break;
      }

      case 'sequential':
      case 'inferential': {
        const premise = groups.premise?.trim();
        const conclusion = groups.conclusion?.trim();

        if (premise) {
          const claim1 = await this.createAtomicClaim(premise, parent, baseContext, 'premise', 0, atomicClaims);
          atomicClaims.push(claim1);
        }
        if (conclusion) {
          const claim2 = await this.createAtomicClaim(
            conclusion,
            parent,
            `From ${premise}, ` + baseContext,
            'conclusion',
            1,
            atomicClaims
          );
          atomicClaims.push(claim2);
        }
        break;
      }

      case 'explanatory': {
        const explanans = groups.explanans?.trim();
        const explanandum = groups.explanandum?.trim();

        if (explanandum) {
          const claim1 = await this.createAtomicClaim(
            explanandum,
            parent,
            baseContext,
            'component',
            0,
            atomicClaims
          );
          atomicClaims.push(claim1);
        }
        if (explanans) {
          const claim2 = await this.createAtomicClaim(
            explanans,
            parent,
            `As explanation for ${explanandum}, ` + baseContext,
            'component',
            1,
            atomicClaims
          );
          atomicClaims.push(claim2);
        }
        break;
      }
    }

    return atomicClaims;
  }

  /**
   * LLM-based semantic decomposition
   */
  private async llmDecompose(claim: DetectedClaim): Promise<DecompositionResult> {
    if (!this.anthropic) {
      return this.createAtomicResult(claim);
    }

    const prompt = `Break down this claim into atomic propositions. Each proposition should:
1. Assert exactly one fact
2. Be independently verifiable
3. Include necessary context from the original claim

Original claim: "${claim.text}"

Context: ${claim.context.surrounding}

Output as JSON array:
[
  {
    "text": "atomic proposition text",
    "context": "decontextualized context",
    "requiresAttribution": true/false,
    "relationToParent": "premise|conclusion|conjunct|disjunct|component"
  }
]

If the claim is already atomic, return an array with just the original claim.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.options.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return this.createAtomicResult(claim);
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.createAtomicResult(claim);
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        text: string;
        context: string;
        requiresAttribution: boolean;
        relationToParent: string;
      }>;

      if (parsed.length <= 1) {
        return this.createAtomicResult(claim);
      }

      const atomicClaims: AtomicClaim[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        atomicClaims.push(
          await this.createAtomicClaim(
            item.text,
            claim,
            item.context,
            item.relationToParent as AtomicClaim['metadata']['relationToParent'],
            i
          )
        );
      }

      return {
        original: claim,
        atomicClaims,
        decompositionStrategy: 'llm_semantic',
        confidenceThresholdMet: false,
        iterations: 1,
        wasDecomposed: true,
        tree: this.buildTree(claim.text, 'llm_semantic', atomicClaims),
      };
    } catch (error) {
      if (this.options.debug) {
        console.error('[ClaimDecomposer] LLM decomposition failed:', error);
      }
      return this.createAtomicResult(claim);
    }
  }

  /**
   * Create an atomic claim with coreference resolution
   */
  private async createAtomicClaim(
    text: string,
    parent: DetectedClaim,
    context: string,
    relationToParent: AtomicClaim['metadata']['relationToParent'],
    sequenceIndex: number,
    previousClaims: AtomicClaim[] = []
  ): Promise<AtomicClaim> {
    // Perform coreference resolution
    const {
      resolvedText,
      resolutionStatus,
      resolvedReferents,
      wasResolved
    } = this.resolveCoreferents(text, context, parent.context.previousSentences);

    // Classify the atomic claim (use resolved text)
    const classificationContext: ClassificationContext = {
      surroundingText: context,
      knownAuthors: parent.profile.attribution.authors,
    };

    const profile = await this.classifier.classify(resolvedText, classificationContext);

    // Determine if attribution is required
    const requiresAttribution =
      profile.assertion.type !== 'factual' &&
      profile.attribution.type === 'none' &&
      !parent.profile.attribution.authors?.length;

    // Build dependency chain - depends on any previous claims that were referenced
    const dependsOnClaimIds: string[] = [];
    if (sequenceIndex > 0 && previousClaims.length > 0) {
      // Check if this claim has dependency markers pointing to previous claims
      const hasDependencyMarkers = this.detectDependencyMarkers(text);
      if (hasDependencyMarkers.length > 0) {
        // Depends on the immediately preceding claim
        dependsOnClaimIds.push(previousClaims[previousClaims.length - 1].id);
      }
    }

    return {
      id: this.generateAtomicId(),
      text: resolvedText,
      context,
      parentClaimId: parent.id,
      profile,
      requiresAttribution,
      decompositionPath: [parent.id, this.generateAtomicId()],
      sequenceIndex,
      resolutionStatus,
      dependsOnClaimIds,
      resolvedReferents: resolvedReferents.length > 0 ? resolvedReferents : undefined,
      metadata: {
        relationToParent,
        contextAdded: context !== parent.context.surrounding,
        coreferenceResolved: wasResolved,
        originalText: wasResolved ? text : undefined,
      },
    };
  }

  // =============================================================================
  // COREFERENCE RESOLUTION METHODS
  // =============================================================================

  /**
   * Resolve coreferents in claim text using context
   */
  private resolveCoreferents(
    text: string,
    context: string,
    previousSentences: string[] = []
  ): {
    resolvedText: string;
    resolutionStatus: ResolutionStatus;
    resolvedReferents: ResolvedReferent[];
    wasResolved: boolean;
  } {
    const resolvedReferents: ResolvedReferent[] = [];
    let resolvedText = text;
    let wasResolved = false;

    // Check for discourse phrases first (more specific)
    for (const phrase of DISCOURSE_PHRASES) {
      const phraseRegex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const match = phraseRegex.exec(text);
      if (match) {
        const antecedent = this.findAntecedent(phrase, context, previousSentences);
        if (antecedent) {
          resolvedText = resolvedText.replace(phraseRegex, antecedent.resolved);
          resolvedReferents.push({
            originalToken: phrase,
            position: match.index,
            resolvedTo: antecedent.resolved,
            confidence: antecedent.confidence,
            candidateCount: antecedent.candidateCount,
            wasAmbiguous: antecedent.candidateCount > 1,
          });
          wasResolved = true;
        }
      }
    }

    // Check for standalone referential tokens (not part of discourse phrases)
    for (const token of REFERENTIAL_BLOCKLIST) {
      // Match only standalone tokens (sentence start or after space, before space or punctuation)
      const tokenRegex = new RegExp(`(?:^|\\s)(${token})(?=\\s|[,;:.!?]|$)`, 'gi');
      let match;
      while ((match = tokenRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const actualToken = match[1];
        // Skip if already resolved as part of a discourse phrase
        if (resolvedReferents.some(r => r.originalToken.includes(actualToken))) {
          continue;
        }

        const antecedent = this.findAntecedent(actualToken, context, previousSentences);
        if (antecedent) {
          // Only replace if confidence is high enough
          if (antecedent.confidence >= 0.6) {
            resolvedText = resolvedText.replace(
              fullMatch,
              fullMatch.replace(actualToken, antecedent.resolved)
            );
            wasResolved = true;
          }
          resolvedReferents.push({
            originalToken: actualToken,
            position: match.index,
            resolvedTo: antecedent.resolved,
            confidence: antecedent.confidence,
            candidateCount: antecedent.candidateCount,
            wasAmbiguous: antecedent.candidateCount > 1,
          });
        }
      }
    }

    // Determine resolution status
    let resolutionStatus: ResolutionStatus = 'resolved';

    // Check if any unresolved referents remain
    const unresolvedCount = this.countUnresolvedReferents(resolvedText);
    if (unresolvedCount > 0) {
      // Check if we have ambiguous cases
      const hasAmbiguous = resolvedReferents.some(r => r.wasAmbiguous);
      resolutionStatus = hasAmbiguous ? 'needs_disambiguation' : 'failed';
    } else if (resolvedReferents.some(r => r.confidence < 0.6)) {
      resolutionStatus = 'needs_disambiguation';
    }

    return {
      resolvedText,
      resolutionStatus,
      resolvedReferents,
      wasResolved,
    };
  }

  /**
   * Find antecedent for a referent token
   */
  private findAntecedent(
    token: string,
    context: string,
    previousSentences: string[]
  ): { resolved: string; confidence: number; candidateCount: number } | null {
    const candidates: Array<{ text: string; score: number }> = [];

    // Build combined context from previous sentences
    const combinedContext = [...previousSentences, context].join(' ');

    // Extract noun phrases as potential antecedents
    const nounPhrasePatterns = [
      // Names with possessive context (e.g., "Aristotle's view")
      /([A-Z][a-z]+(?:'s)?(?:\s+\w+)?(?:\s+(?:view|account|argument|position|analysis|theory|concept|notion|claim)))/g,
      // Greek/technical terms
      /((?:φαντασία|αἴσθησις|κίνησις|χρόνος|ψυχή|νοῦς|phantasia|aisthesis|kinesis|chronos))/gi,
      // Common philosophical noun phrases
      /(?:the\s+)?((?:soul|perception|motion|time|imagination|memory|deliberation|now|before|after)(?:\s+\w+)?)/gi,
      // Author names
      /(?:^|\s)([A-Z][a-z]+)(?=\s+(?:argues?|claims?|states?|maintains?|holds?|contends?|observes?|notes?))/g,
    ];

    for (const pattern of nounPhrasePatterns) {
      let match;
      while ((match = pattern.exec(combinedContext)) !== null) {
        const candidate = match[1].trim();
        if (candidate.length > 2 && candidate.length < 100) {
          // Score based on recency (later = higher score)
          const recencyScore = match.index / combinedContext.length;
          // Boost score for named entities and technical terms
          const entityBoost = /^[A-Z]/.test(candidate) ? 0.2 : 0;
          const technicalBoost = /[αβγδεζηθικλμνξοπρστυφχψω]|phantasia|aisthesis/i.test(candidate) ? 0.15 : 0;

          candidates.push({
            text: candidate,
            score: recencyScore + entityBoost + technicalBoost,
          });
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by score (descending)
    candidates.sort((a, b) => b.score - a.score);

    // Calculate confidence based on candidate distribution
    const topScore = candidates[0].score;
    const secondScore = candidates.length > 1 ? candidates[1].score : 0;
    const scoreDiff = topScore - secondScore;

    // Confidence is higher if there's a clear winner
    const confidence = Math.min(1, 0.5 + scoreDiff * 0.5 + (1 / candidates.length) * 0.3);

    return {
      resolved: candidates[0].text,
      confidence,
      candidateCount: candidates.length,
    };
  }

  /**
   * Detect dependency markers in text
   */
  private detectDependencyMarkers(text: string): string[] {
    const markers: string[] = [];
    const textLower = text.toLowerCase();

    for (const marker of DEPENDENCY_MARKERS) {
      const markerRegex = new RegExp(`\\b${marker}\\b`, 'i');
      if (markerRegex.test(textLower)) {
        markers.push(marker);
      }
    }

    return markers;
  }

  /**
   * Count unresolved referents in text
   */
  private countUnresolvedReferents(text: string): number {
    let count = 0;
    const textLower = text.toLowerCase();

    // Check blocklist tokens
    for (const token of REFERENTIAL_BLOCKLIST) {
      const tokenRegex = new RegExp(`(?:^|\\s)${token}(?=\\s|[,;:.!?]|$)`, 'gi');
      const matches = textLower.match(tokenRegex);
      if (matches) {
        count += matches.length;
      }
    }

    // Check discourse phrases
    for (const phrase of DISCOURSE_PHRASES) {
      if (textLower.includes(phrase)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Check if a claim has unresolved referents (public API)
   */
  hasUnresolvedReferents(text: string): boolean {
    return this.countUnresolvedReferents(text) > 0;
  }

  /**
   * Get all unresolved referent tokens in text (public API)
   */
  getUnresolvedReferents(text: string): string[] {
    const unresolved: string[] = [];
    const textLower = text.toLowerCase();

    // Check blocklist tokens
    for (const token of REFERENTIAL_BLOCKLIST) {
      const tokenRegex = new RegExp(`(?:^|\\s)(${token})(?=\\s|[,;:.!?]|$)`, 'gi');
      const matches = text.match(tokenRegex);
      if (matches) {
        unresolved.push(...matches.map(m => m.trim()));
      }
    }

    // Check discourse phrases
    for (const phrase of DISCOURSE_PHRASES) {
      if (textLower.includes(phrase)) {
        unresolved.push(phrase);
      }
    }

    return [...new Set(unresolved)];
  }

  /**
   * Build decontextualized context for atomic claims
   */
  private buildDecontextualizedContext(claim: DetectedClaim): string {
    const parts: string[] = [];

    // Add attribution context if available
    if (claim.profile.attribution.authors?.length) {
      parts.push(`According to ${claim.profile.attribution.authors[0]}`);
    }

    // Add inherited attribution
    if (claim.context.inheritedAttribution) {
      parts.push(`(in the context of ${claim.context.inheritedAttribution}'s argument)`);
    }

    // Add surrounding context snippet
    if (claim.context.surrounding) {
      const snippet = claim.context.surrounding.slice(0, 100);
      parts.push(`Context: "${snippet}..."`);
    }

    return parts.join('; ');
  }

  /**
   * Create result for atomic (non-decomposed) claim
   */
  private createAtomicResult(claim: DetectedClaim): DecompositionResult {
    // Perform coreference resolution on the claim text
    const {
      resolvedText,
      resolutionStatus,
      resolvedReferents,
      wasResolved
    } = this.resolveCoreferents(
      claim.text,
      claim.context.surrounding,
      claim.context.previousSentences
    );

    const atomicClaim: AtomicClaim = {
      id: this.generateAtomicId(),
      text: resolvedText,
      context: claim.context.surrounding,
      parentClaimId: claim.id,
      profile: claim.profile,
      requiresAttribution:
        claim.profile.attribution.type === 'none' &&
        claim.profile.assertion.type !== 'factual',
      decompositionPath: [claim.id],
      sequenceIndex: 0,
      resolutionStatus,
      dependsOnClaimIds: [],
      resolvedReferents: resolvedReferents.length > 0 ? resolvedReferents : undefined,
      metadata: {
        relationToParent: 'component',
        contextAdded: false,
        coreferenceResolved: wasResolved,
        originalText: wasResolved ? claim.text : undefined,
      },
    };

    return {
      original: claim,
      atomicClaims: [atomicClaim],
      decompositionStrategy: 'none',
      confidenceThresholdMet: true,
      iterations: 0,
      wasDecomposed: false,
      tree: {
        text: claim.text,
        isLeaf: true,
        strategy: 'none',
        children: [],
      },
    };
  }

  /**
   * Build decomposition tree
   */
  private buildTree(
    text: string,
    strategy: DecompositionStrategy,
    atomicClaims: AtomicClaim[]
  ): DecompositionNode {
    return {
      text,
      isLeaf: false,
      strategy,
      children: atomicClaims.map((ac) => ({
        text: ac.text,
        isLeaf: true,
        strategy: 'none',
        children: [],
      })),
    };
  }

  /**
   * Generate unique atomic claim ID
   */
  private generateAtomicId(): string {
    return `atomic_${Date.now()}_${++this.atomicIdCounter}`;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new ClaimDecomposer instance
 */
export function createClaimDecomposer(options?: DecomposerOptions): ClaimDecomposer {
  return new ClaimDecomposer(options);
}
