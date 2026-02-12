/**
 * Multi-Axis Claim Classifier
 *
 * This module provides pattern-based classification of claims across
 * 5 orthogonal axes. Each axis is classified independently, enabling
 * compositional validation rules.
 *
 * @module claim-classifier
 */

import {
  type ClaimProfile,
  type AttributionAxis,
  type AssertionAxis,
  type StructureAxis,
  type ModalityAxis,
  type EpistemicForceAxis,
  AttributionType,
  AttributionQualifier,
  AssertionType,
  RelationType,
  StructureType,
  LogicalConnective,
  InferenceType,
  ModalityType,
  HedgeMarker,
  EpistemicForceType,
  createDefaultProfile,
} from './claim-profile.js';

// =============================================================================
// CLASSIFICATION CONTEXT
// =============================================================================

/**
 * Context provided to classifiers for enhanced classification
 */
export interface ClassificationContext {
  /** Surrounding text for context */
  surroundingText: string;

  /** Previous claims in sequence (for inheritance) */
  previousClaims?: Array<{ profile?: ClaimProfile; text: string }>;

  /** Known authors in corpus */
  knownAuthors?: string[];

  /** Current paragraph/section topic */
  currentTopic?: string;
}

/**
 * Options for classifier configuration
 */
export interface ClassifierOptions {
  /** Minimum confidence threshold for pattern matches */
  minConfidence?: number;

  /** Enable debug logging */
  debug?: boolean;

  /** Use LLM fallback for low-confidence classifications */
  useLLMFallback?: boolean;
}

// =============================================================================
// BASE AXIS CLASSIFIER
// =============================================================================

/**
 * Base class for axis classifiers
 */
abstract class AxisClassifier<T> {
  protected patterns: Map<string, RegExp[]>;
  protected options: ClassifierOptions;

  constructor(options?: ClassifierOptions) {
    this.options = options || {};
    this.patterns = this.initializePatterns();
  }

  abstract initializePatterns(): Map<string, RegExp[]>;
  abstract classify(
    claim: string,
    context: ClassificationContext
  ): Promise<T & { confidence: number }>;

  protected matchPatterns(text: string, patterns: RegExp[]): RegExpMatchArray | null {
    for (const pattern of patterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) return match;
    }
    return null;
  }

  protected matchAllPatterns(text: string, patterns: RegExp[]): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) matches.push(match);
    }
    return matches;
  }
}

// =============================================================================
// ATTRIBUTION AXIS CLASSIFIER
// =============================================================================

/**
 * Attribution Axis Classifier
 * Determines who bears epistemic responsibility for a claim.
 */
class AttributionAxisClassifier extends AxisClassifier<AttributionAxis> {
  initializePatterns(): Map<string, RegExp[]> {
    return new Map([
      [
        'direct',
        [
          /(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:argues?|claims?|states?|maintains?|contends?|holds?|asserts?)\s+that/gi,
          /According\s+to\s+(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
          /[Aa]s\s+(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:notes?|observes?|points?\s+out|remarks?)/gi,
          /[Ff]or\s+(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),/gi,
          /(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:view|position|account|analysis|argument|claim)\s+(?:is|that|holds)/gi,
        ],
      ],
      [
        'interpretive',
        [
          /(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:can|could|might|may)\s+be\s+(?:read|understood|interpreted|seen)\s+as/gi,
          /(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:view|position|analysis)\s+(?:suggests?|implies?|indicates?)/gi,
          /(?:One|A)\s+(?:reading|interpretation)\s+of\s+(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
          /(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:seems?\s+to|appears?\s+to)\s+(?:suggest|imply|indicate)/gi,
        ],
      ],
      [
        'demonstrative',
        [
          /[Aa]s\s+(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:demonstrates?|shows?|proves?|establishes?)/gi,
          /(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:demonstrates?|shows?|proves?|establishes?)\s+that/gi,
          /(?<author>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s+(?:demonstration|proof|argument)\s+(?:that|shows)/gi,
        ],
      ],
      [
        'consensus',
        [
          /(?:Scholars|Commentators|Interpreters|Researchers|Critics)\s+(?:generally|widely|largely|typically|commonly)\s+(?:agree|hold|maintain|accept|recognize)/gi,
          /(?:The|A)\s+(?:scholarly|academic|critical)\s+consensus\s+(?:is|holds|maintains)/gi,
          /It\s+is\s+(?:widely|generally|commonly)\s+(?:accepted|recognized|acknowledged|agreed)\s+(?:that|among)/gi,
          /(?:Most|Many)\s+(?:scholars|commentators|interpreters)\s+(?:agree|hold|accept)/gi,
        ],
      ],
      [
        'disputed',
        [
          /(?:Some|Certain)\s+(?:scholars|commentators|interpreters)\s+(?:argue|claim|maintain|hold).+(?:while|whereas|but|however)\s+(?:others?)/gi,
          /(?:There\s+is\s+)?(?:debate|disagreement|controversy|dispute)\s+(?:about|over|regarding|concerning)/gi,
          /(?:Scholars|Commentators)\s+(?:disagree|are\s+divided)\s+(?:about|on|over)/gi,
          /(?:On\s+one\s+hand|Some\s+argue).+(?:on\s+the\s+other|others\s+(?:argue|maintain|claim))/gi,
        ],
      ],
      [
        'anonymous',
        [
          /It\s+is\s+(?:widely|generally|commonly|often|sometimes)\s+(?:held|believed|thought|assumed|supposed)\s+that/gi,
          /(?:Many|Most|Some)\s+(?:believe|hold|accept|assume|think)\s+that/gi,
          /(?:One|We)\s+(?:might|may|could)\s+(?:think|assume|suppose|believe)\s+that/gi,
          /(?:It\s+)?(?:has\s+been|is)\s+(?:said|claimed|suggested|argued)\s+that/gi,
        ],
      ],
      [
        'proxy',
        [
          /According\s+to\s+(?:the\s+)?(?<tradition>tradition|standard\s+(?:reading|view|interpretation)|received\s+view|orthodox\s+(?:reading|view)|conventional\s+(?:reading|interpretation))/gi,
          /(?:The\s+)?(?<tradition>traditional|standard|orthodox|conventional|received)\s+(?:reading|interpretation|view|understanding)\s+(?:holds|is|maintains|suggests)/gi,
          /(?:On\s+the\s+)?(?<tradition>standard|traditional|orthodox)\s+(?:account|reading)/gi,
        ],
      ],
    ]);
  }

  async classify(
    claim: string,
    context: ClassificationContext
  ): Promise<AttributionAxis & { confidence: number }> {
    let type = AttributionType.NONE;
    let authors: string[] = [];
    let qualifier = AttributionQualifier.NONE;
    let confidence = 0.5;
    let inherited = false;
    let inheritedFrom: string | undefined;

    // Check each pattern category in priority order
    // More specific patterns (proxy, disputed, consensus) should be checked before direct
    const patternPriority = [
      'proxy',       // Check proxy first (tradition references)
      'disputed',    // Check disputed before direct (contains "scholars" keywords)
      'consensus',   // Check consensus before direct
      'anonymous',   // Check anonymous before direct
      'demonstrative', // Check demonstrative before generic direct
      'interpretive',
      'direct',      // Generic direct attribution last
    ];

    for (const attrType of patternPriority) {
      const patterns = this.patterns.get(attrType);
      if (!patterns) continue;

      const match = this.matchPatterns(claim, patterns);
      if (match) {
        // Handle demonstrative as DIRECT with qualifier
        if (attrType === 'demonstrative') {
          type = AttributionType.DIRECT;
          qualifier = AttributionQualifier.DEMONSTRATIVE;
        } else {
          type = attrType as AttributionType;
        }
        if (match.groups?.author) {
          authors = [match.groups.author];
        }
        if (match.groups?.tradition) {
          // Store tradition reference
          authors = [match.groups.tradition];
        }
        confidence = 0.85;
        break;
      }
    }

    // Check for qualifiers
    if (/(?:explicitly|directly|clearly|unambiguously)\s+(?:claims?|argues?|states?)/i.test(claim)) {
      qualifier = AttributionQualifier.EXPLICIT;
      confidence = Math.min(confidence + 0.05, 1);
    } else if (/(?:can|could|might|may)\s+be\s+(?:read|understood|interpreted|seen)\s+as/i.test(claim)) {
      qualifier = AttributionQualifier.HEDGED;
    } else if (/(?:demonstrates?|shows?|proves?|establishes?)/i.test(claim)) {
      qualifier = AttributionQualifier.DEMONSTRATIVE;
    } else if (/(?:suggests?|implies?|indicates?)/i.test(claim)) {
      qualifier = AttributionQualifier.SUGGESTS;
    }

    // Check for inheritance from context if no explicit attribution found
    if (type === AttributionType.NONE && context.previousClaims?.length) {
      const recentAttributed = context.previousClaims
        .slice(-3)
        .reverse()
        .find((c) => c.profile?.attribution?.authors?.length);

      if (recentAttributed?.profile?.attribution?.authors) {
        type = AttributionType.INHERITED;
        authors = recentAttributed.profile.attribution.authors;
        inherited = true;
        inheritedFrom = authors[0];
        confidence = 0.6;
      }
    }

    // Check if claim contains known authors
    if (type === AttributionType.NONE && context.knownAuthors?.length) {
      for (const author of context.knownAuthors) {
        if (claim.includes(author)) {
          // Author mentioned but not in attribution pattern - likely implicit reference
          type = AttributionType.INHERITED;
          authors = [author];
          confidence = 0.5;
          break;
        }
      }
    }

    return {
      type,
      authors: authors.length > 0 ? authors : undefined,
      qualifier,
      inherited,
      inheritedFrom,
      confidence,
    };
  }
}

// =============================================================================
// ASSERTION AXIS CLASSIFIER
// =============================================================================

/**
 * Assertion Axis Classifier
 * Determines what kind of assertion is being made.
 */
class AssertionAxisClassifier extends AxisClassifier<AssertionAxis> {
  initializePatterns(): Map<string, RegExp[]> {
    return new Map([
      [
        'definitional',
        [
          /(?<term>[A-Za-z]+)\s+(?:is|are)\s+(?:defined|understood|conceived|characterized)\s+as/gi,
          /(?:The\s+)?(?:concept|notion|term|idea)\s+(?:of\s+)?['"]?(?<term>\w+)['"]?\s+(?:refers?|denotes?|means?|signifies?)/gi,
          /(?:By|What\s+(?:I|we)\s+mean\s+by)\s+['"]?(?<term>\w+)['"]?\s+(?:is|I\s+mean)/gi,
          /(?<term>[A-Za-z]+)\s+(?:consists?\s+(?:of|in)|comprises?|amounts?\s+to)/gi,
        ],
      ],
      [
        'functional',
        [
          /(?<term>[A-Za-z]+)\s+(?:functions?|serves?|operates?|works?|acts?)\s+(?:to|as|by)/gi,
          /(?:The\s+)?(?:function|role|purpose|task)\s+of\s+(?<term>\w+)\s+is/gi,
          /(?<term>[A-Za-z]+)\s+(?:enables?|allows?|permits?|facilitates?)/gi,
          /(?<term>[A-Za-z]+)\s+is\s+(?:responsible\s+for|involved\s+in)/gi,
        ],
      ],
      [
        'negative',
        [
          /(?<term>[A-Za-z]+)\s+is\s+not\s+(?<negation>[A-Za-z]+)/gi,
          /(?<term>[A-Za-z]+)\s+(?:differs?|is\s+distinct|is\s+different)\s+from\s+(?<contrast>[A-Za-z]+)/gi,
          /(?<term>[A-Za-z]+)\s+(?:should\s+not|cannot|must\s+not)\s+be\s+(?:confused|conflated|equated|identified)\s+with/gi,
          /(?:Unlike|Contrary\s+to)\s+(?<contrast>[A-Za-z]+),?\s+(?<term>[A-Za-z]+)/gi,
        ],
      ],
      [
        'relational',
        [
          /(?<term>[A-Za-z]+)\s+(?:mediates?|bridges?|connects?|links?)\s+(?:between\s+)?(?<relatum1>.+?)\s+and\s+(?<relatum2>.+)/gi,
          /(?<term>[A-Za-z]+)\s+(?:lies?|stands?|operates?|exists?)\s+between\s+(?<relatum1>.+?)\s+and\s+(?<relatum2>.+)/gi,
          /(?<term>[A-Za-z]+)\s+(?:relates?|corresponds?)\s+to\s+(?<relatum>[A-Za-z]+)/gi,
          /(?:The\s+)?(?:relationship|connection|link)\s+between\s+(?<relatum1>.+?)\s+and\s+(?<relatum2>.+)/gi,
        ],
      ],
      [
        'modal',
        [
          /(?<term>[A-Za-z]+)\s+(?<modal>can|could|may|might|must|cannot|need\s+not)\s+(?:exist|occur|operate|function|happen)/gi,
          /(?:It\s+is\s+)(?<modal>possible|impossible|necessary|contingent)\s+(?:for|that)\s+(?<term>[A-Za-z]+)/gi,
          /(?<term>[A-Za-z]+)\s+(?<modal>necessarily|possibly|contingently)\s+(?:exists?|occurs?|involves?)/gi,
        ],
      ],
      [
        'dependency',
        [
          /(?<dependent>\w+)\s+(?:cannot|could\s+not|is\s+impossible)\s+(?:occur|exist|happen|function)\s+without\s+(?<dependency>\w+)/gi,
          /(?<dependency>\w+)\s+is\s+(?:necessary|required|essential|indispensable)\s+for\s+(?<dependent>\w+)/gi,
          /(?:Without|In\s+the\s+absence\s+of)\s+(?<dependency>\w+),?\s+(?<dependent>\w+)\s+(?:cannot|could\s+not|would\s+not)/gi,
          /(?<dependent>\w+)\s+(?:depends?|relies?)\s+(?:on|upon)\s+(?<dependency>\w+)/gi,
        ],
      ],
      [
        'comparative',
        [
          /(?:Unlike|Like)\s+(?<comparand1>[A-Z][a-z]+).+(?<comparand2>[A-Z][a-z]+)/gi,
          /(?:Whereas|While)\s+(?<comparand1>[A-Z][a-z]+).+(?<comparand2>[A-Z][a-z]+)/gi,
          /(?<comparand1>[A-Z][a-z]+)\s+(?:is\s+)?(?:similar|analogous|comparable)\s+to\s+(?<comparand2>[A-Z][a-z]+)/gi,
          /(?:Both|Neither)\s+(?<comparand1>[A-Z][a-z]+)\s+(?:and|nor)\s+(?<comparand2>[A-Z][a-z]+)/gi,
        ],
      ],
      [
        'contrastive',
        [
          /(?<author1>[A-Z][a-z]+)\s+(?:rejects?|denies?|dismisses?|challenges?|opposes?)\s+(?:what\s+)?(?<author2>[A-Z][a-z]+)/gi,
          /(?:In\s+contrast|Contrary)\s+to\s+(?<author1>[A-Z][a-z]+)/gi,
          /(?<author1>[A-Z][a-z]+)\s+(?:breaks?|departs?)\s+(?:with|from)\s+(?<author2>[A-Z][a-z]+)/gi,
        ],
      ],
      [
        'alignment',
        [
          /(?<author1>[A-Z][a-z]+)\s+(?:echoes?|mirrors?|parallels?|resonates?\s+with|anticipates?)\s+(?<author2>[A-Z][a-z]+)/gi,
          /(?<author1>[A-Z][a-z]+)'s\s+(?:view|position|account)\s+(?:aligns?|accords?|agrees?)\s+with\s+(?<author2>[A-Z][a-z]+)/gi,
          /(?:The\s+)?(?:similarity|parallel|correspondence)\s+between\s+(?<author1>[A-Z][a-z]+)\s+and\s+(?<author2>[A-Z][a-z]+)/gi,
        ],
      ],
      [
        'genealogical',
        [
          /(?:This|The)\s+(?:view|position|argument|reading|interpretation)\s+(?:develops?|derives?|emerges?|grows?|stems?)\s+from/gi,
          /(?<author1>[A-Z][a-z]+)\s+(?:inherits?|borrows?|draws?\s+(?:on|from)|builds?\s+(?:on|upon))\s+(?<author2>[A-Z][a-z]+)/gi,
          /(?:The\s+)?(?:origin|source|root|foundation)\s+of\s+(?:this|the)\s+(?:view|idea|concept)/gi,
        ],
      ],
      [
        'evaluative',
        [
          /(?:successfully|effectively|adequately|properly|correctly|rightly)\s+(?:resolves?|addresses?|explains?|accounts?\s+for)/gi,
          /(?:fails?\s+to|inadequately|improperly|incorrectly)\s+(?:resolve|address|explain|account\s+for)/gi,
          /(?:is|are)\s+(?:right|wrong|correct|incorrect|mistaken|accurate|inaccurate)/gi,
          /(?:best|better|worse|superior|inferior)\s+(?:explanation|account|reading|interpretation)/gi,
        ],
      ],
      [
        'significance',
        [
          /(?:is|are)\s+(?:crucial|essential|vital|central|fundamental|key|important)\s+(?:for|to)/gi,
          /(?:plays?\s+a\s+)?(?:crucial|essential|vital|central|fundamental|key)\s+role/gi,
          /(?:The\s+)?(?:importance|significance|centrality)\s+of/gi,
        ],
      ],
      [
        'novelty',
        [
          /(?:has\s+been|remains?|is)\s+(?:overlooked|neglected|underappreciated|unexplored|ignored)/gi,
          /(?:No|Few)\s+(?:scholar|commentator|interpreter)s?\s+(?:has|have)\s+(?:yet\s+)?(?:noted|observed|addressed|considered)/gi,
          /(?:This|The\s+present)\s+(?:reading|interpretation|analysis)\s+(?:is\s+)?(?:novel|new|original|unique)/gi,
        ],
      ],
      [
        'scope',
        [
          /(?:This|The\s+present)\s+(?:chapter|section|paper|essay|dissertation|argument)\s+(?:argues?|claims?|contends?|maintains?|shows?|demonstrates?)/gi,
          /(?:I|We)\s+(?:argue|claim|contend|maintain|show|demonstrate)\s+that/gi,
          /(?:The\s+)?(?:aim|goal|purpose|objective)\s+of\s+(?:this|the\s+present)/gi,
        ],
      ],
      [
        'methodological',
        [
          /(?<author>[A-Z][a-z]+)\s+(?:proceeds?|begins?|starts?)\s+by\s+(?:first\s+)?/gi,
          /(?:The\s+)?(?:method|approach|strategy|procedure)\s+(?:employed|used|adopted)/gi,
          /(?:Following|Using|Employing)\s+(?:the\s+)?(?:method|approach)\s+of/gi,
        ],
      ],
    ]);
  }

  async classify(
    claim: string,
    context: ClassificationContext
  ): Promise<AssertionAxis & { confidence: number }> {
    let type = AssertionType.FACTUAL;
    const secondary: AssertionType[] = [];
    let terms: string[] = [];
    let relation: RelationType | undefined;
    let confidence = 0.5;

    // Check all patterns and collect matches
    const matches: Array<{ type: string; match: RegExpMatchArray }> = [];

    for (const [assertType, patterns] of this.patterns) {
      const match = this.matchPatterns(claim, patterns);
      if (match) {
        matches.push({ type: assertType, match });
      }
    }

    // Primary type is the first match; others are secondary
    if (matches.length > 0) {
      type = matches[0].type as AssertionType;
      confidence = 0.8;

      // Collect terms from match groups
      const primaryMatch = matches[0].match;
      if (primaryMatch.groups?.term) {
        terms.push(primaryMatch.groups.term);
      }
      if (primaryMatch.groups?.relatum1) {
        terms.push(primaryMatch.groups.relatum1);
      }
      if (primaryMatch.groups?.relatum2) {
        terms.push(primaryMatch.groups.relatum2);
      }
      if (primaryMatch.groups?.comparand1) {
        terms.push(primaryMatch.groups.comparand1);
      }
      if (primaryMatch.groups?.comparand2) {
        terms.push(primaryMatch.groups.comparand2);
      }

      // Add secondary types
      for (let i = 1; i < matches.length; i++) {
        secondary.push(matches[i].type as AssertionType);
      }

      // Determine relation type for relational assertions
      if (type === AssertionType.RELATIONAL) {
        relation = this.detectRelationType(claim);
      }
    }

    // Clean up terms
    terms = [...new Set(terms.filter((t) => t && t.length > 1))];

    return {
      type,
      secondary,
      terms: terms.length > 0 ? terms : undefined,
      relation,
      confidence,
    };
  }

  private detectRelationType(claim: string): RelationType | undefined {
    if (/mediates?|bridges?/i.test(claim)) return RelationType.MEDIATES;
    if (/depends?\s+on|relies?\s+on/i.test(claim)) return RelationType.DEPENDS_ON;
    if (/enables?|allows?|permits?/i.test(claim)) return RelationType.ENABLES;
    if (/precedes?|comes?\s+before|prior\s+to/i.test(claim)) return RelationType.PRECEDES;
    if (/part\s+of|belongs?\s+to/i.test(claim)) return RelationType.PART_OF;
    if (/instance\s+of|example\s+of/i.test(claim)) return RelationType.INSTANCE_OF;
    if (/contrasts?\s+with|differs?\s+from/i.test(claim)) return RelationType.CONTRASTS;
    if (/parallels?|mirrors?|echoes?/i.test(claim)) return RelationType.PARALLELS;
    return undefined;
  }
}

// =============================================================================
// STRUCTURE AXIS CLASSIFIER
// =============================================================================

/**
 * Structure Axis Classifier
 * Determines the logical structure of a claim.
 */
class StructureAxisClassifier extends AxisClassifier<StructureAxis> {
  initializePatterns(): Map<string, RegExp[]> {
    return new Map([
      [
        'inferential',
        [
          /^(?:Therefore|Thus|Hence|Consequently|Accordingly|It\s+follows\s+that|We\s+can\s+conclude|This\s+shows\s+that)/i,
          /(?:therefore|thus|hence|consequently),?\s+(?:we\s+can\s+)?(?:conclude|infer|see|say)\s+that/i,
          /(?:From\s+this|Given\s+this),?\s+(?:it\s+follows|we\s+can\s+(?:conclude|infer))/i,
        ],
      ],
      [
        'conditional',
        [
          /^[Ii]f\s+.+,?\s+then\s+/,
          /.+\s+(?:only\s+)?if\s+.+/,
          /(?:Were|Should|Had)\s+.+,?\s+(?:then\s+)?/,
          /(?:Unless|Provided\s+that|Assuming\s+that)/i,
        ],
      ],
      [
        'explanatory',
        [
          /(?:This|It|That)\s+(?:explains?|accounts?\s+for|clarifies?)\s+(?:why|how)/i,
          /(?:because|since|for\s+this\s+reason|given\s+that|due\s+to\s+the\s+fact\s+that)/i,
          /(?:The\s+reason\s+(?:why|that|is)|This\s+is\s+(?:because|why|due\s+to))/i,
        ],
      ],
      [
        'conjunctive',
        [
          /(?:Both\s+)?(?:.+?)\s+and\s+(?:.+?)\s+(?:are|function|serve|operate)/i,
          /.+,?\s+and\s+(?:also|furthermore|moreover|in\s+addition)\s+/i,
          /(?:Not\s+only|First).+(?:but\s+also|second)/i,
        ],
      ],
      [
        'disjunctive',
        [
          /(?:Either\s+)?(?:.+?)\s+or\s+(?:.+)/i,
          /(?:alternatively|on\s+the\s+other\s+hand|otherwise)/i,
          /(?:Whether).+(?:or)/i,
        ],
      ],
      [
        'sequential',
        [
          /(?:First|Initially|To\s+begin)\s+.+,?\s+(?:then|next|subsequently|afterwards|second)/i,
          /.+\s+(?:precedes|follows|comes\s+(?:before|after)|leads?\s+to)\s+/i,
          /(?:Before|After|Prior\s+to|Following)/i,
        ],
      ],
      [
        'parallel',
        [
          /(?:Similarly|Likewise|In\s+the\s+same\s+way|Correspondingly)/i,
          /(?:Just\s+as).+(?:so\s+too|similarly)/i,
          /(?:On\s+the\s+one\s+hand).+(?:on\s+the\s+other)/i,
        ],
      ],
    ]);
  }

  async classify(
    claim: string,
    context: ClassificationContext
  ): Promise<StructureAxis & { confidence: number }> {
    let type = StructureType.ATOMIC;
    const connectives: LogicalConnective[] = [];
    let atomicClaimCount = 1;
    let confidence = 0.7;
    let inferenceType: InferenceType | undefined;

    // Check structural patterns
    for (const [structType, patterns] of this.patterns) {
      if (this.matchPatterns(claim, patterns)) {
        type = structType as StructureType;
        confidence = 0.85;
        break;
      }
    }

    // Detect connectives
    if (/\band\b/i.test(claim)) connectives.push(LogicalConnective.AND);
    if (/\bor\b/i.test(claim)) connectives.push(LogicalConnective.OR);
    if (/\bif\b.+\bthen\b/i.test(claim)) connectives.push(LogicalConnective.IF_THEN);
    if (/(?:therefore|thus|hence|consequently)/i.test(claim))
      connectives.push(LogicalConnective.THEREFORE);
    if (/\bbecause\b/i.test(claim)) connectives.push(LogicalConnective.BECAUSE);
    if (/\bwhile\b/i.test(claim)) connectives.push(LogicalConnective.WHILE);
    if (/\bwhereas\b/i.test(claim)) connectives.push(LogicalConnective.WHEREAS);
    if (/\bboth\b/i.test(claim)) connectives.push(LogicalConnective.BOTH);
    if (/\bneither\b/i.test(claim)) connectives.push(LogicalConnective.NEITHER);
    if (/\beither\b/i.test(claim)) connectives.push(LogicalConnective.EITHER);

    // Estimate atomic claim count based on connectives
    if (
      type === StructureType.CONJUNCTIVE ||
      type === StructureType.PARALLEL ||
      type === StructureType.SEQUENTIAL
    ) {
      const andMatches = claim.match(/\band\b/gi) || [];
      const alsoMatches = claim.match(/\b(?:also|furthermore|moreover)\b/gi) || [];
      atomicClaimCount = Math.max(2, andMatches.length + alsoMatches.length + 1);
    } else if (type === StructureType.CONDITIONAL || type === StructureType.EXPLANATORY) {
      atomicClaimCount = 2; // Antecedent + consequent or explanandum + explanans
    } else if (type === StructureType.DISJUNCTIVE) {
      const orMatches = claim.match(/\bor\b/gi) || [];
      atomicClaimCount = Math.max(2, orMatches.length + 1);
    }

    // Determine inference type for inferential claims
    if (type === StructureType.INFERENTIAL) {
      inferenceType = this.detectInferenceType(claim);
    }

    return {
      type,
      connectives,
      atomicClaimCount,
      inferenceType,
      confidence,
    };
  }

  private detectInferenceType(claim: string): InferenceType | undefined {
    if (/must|necessarily|logically\s+follows|entails/i.test(claim)) {
      return InferenceType.DEDUCTIVE;
    }
    if (/likely|probably|suggests|tends\s+to|generally/i.test(claim)) {
      return InferenceType.INDUCTIVE;
    }
    if (/explains|accounts\s+for|best|most\s+plausible/i.test(claim)) {
      return InferenceType.ABDUCTIVE;
    }
    if (/in\s+this\s+case|here|specifically/i.test(claim)) {
      return InferenceType.INSTANTIATION;
    }
    if (/in\s+general|typically|always|universally/i.test(claim)) {
      return InferenceType.GENERALIZATION;
    }
    return InferenceType.DEDUCTIVE; // Default for inferential claims
  }
}

// =============================================================================
// MODALITY AXIS CLASSIFIER
// =============================================================================

/**
 * Modality Axis Classifier
 * Determines the epistemic stance toward a claim.
 */
class ModalityAxisClassifier extends AxisClassifier<ModalityAxis> {
  initializePatterns(): Map<string, RegExp[]> {
    return new Map([
      [
        'speculative',
        [
          /(?:might|may|could|possibly|perhaps|conceivably)\s+(?:be|have|suggest|indicate)/i,
          /(?:It\s+is\s+)?(?:possible|conceivable|plausible)\s+that/i,
          /(?:One|We)\s+(?:might|may|could)\s+(?:speculate|conjecture|hypothesize)/i,
        ],
      ],
      [
        'hypothetical',
        [
          /(?:If|Were|Should|Had)\s+.+(?:would|could|might)/i,
          /(?:Suppose|Imagine|Assuming)\s+(?:that)?/i,
          /(?:In\s+(?:a|the)\s+)?(?:hypothetical|counterfactual)\s+(?:scenario|case)/i,
        ],
      ],
      [
        'interpreted',
        [
          /(?:can|could|might|may)\s+be\s+(?:read|understood|interpreted|seen)\s+as/i,
          /(?:On\s+(?:one|this|my)\s+)?(?:reading|interpretation|understanding)/i,
          /(?:I|We)\s+(?:read|understand|interpret|take)\s+(?:this|it)\s+(?:as|to)/i,
        ],
      ],
      [
        'concessive',
        [
          /(?:While|Although|Though|Even\s+(?:if|though)|Granted\s+that)/i,
          /(?:Admittedly|To\s+be\s+sure|It\s+is\s+true\s+that)/i,
          /(?:Despite|Notwithstanding|In\s+spite\s+of)/i,
        ],
      ],
      [
        'interrogative',
        [
          /(?:Whether|If)\s+.+(?:remains?|is)\s+(?:unclear|uncertain|questionable|open)/i,
          /(?:The\s+question\s+(?:is|remains)|It\s+is\s+(?:unclear|uncertain))\s+whether/i,
          /(?:One\s+(?:may|might)\s+(?:ask|wonder)|This\s+raises\s+the\s+question)/i,
        ],
      ],
      [
        'negated',
        [
          /(?:It\s+is\s+)?(?:not|never|hardly|scarcely)\s+(?:the\s+case\s+that|true\s+that)/i,
          /(?:does?|do|did|is|are|was|were)\s+not\s+/i,
          /(?:fails?\s+to|lacks?|is\s+without|is\s+devoid\s+of)/i,
        ],
      ],
    ]);
  }

  async classify(
    claim: string,
    context: ClassificationContext
  ): Promise<ModalityAxis & { confidence: number }> {
    let type = ModalityType.ASSERTED;
    const hedges: HedgeMarker[] = [];
    let commitmentLevel = 1.0;
    let perspective: 'endorsed' | 'reported' | 'hypothetical' = 'endorsed';
    let confidence = 0.7;

    // Check modality patterns
    for (const [modalType, patterns] of this.patterns) {
      if (this.matchPatterns(claim, patterns)) {
        type = modalType as ModalityType;
        confidence = 0.85;
        break;
      }
    }

    // Detect hedging markers
    if (/\b(?:might|may|could)\b/i.test(claim)) {
      hedges.push(HedgeMarker.POSSIBILITY);
      commitmentLevel -= 0.3;
    }
    if (/\b(?:probably|likely|presumably)\b/i.test(claim)) {
      hedges.push(HedgeMarker.PROBABILITY);
      commitmentLevel -= 0.2;
    }
    if (/\b(?:seems?|appears?)\b/i.test(claim)) {
      hedges.push(HedgeMarker.APPEARANCE);
      commitmentLevel -= 0.25;
    }
    if (/\b(?:arguably|perhaps|possibly)\b/i.test(claim)) {
      hedges.push(HedgeMarker.ARGUABILITY);
      commitmentLevel -= 0.3;
    }
    if (/\b(?:in\s+some\s+sense|to\s+some\s+(?:extent|degree))\b/i.test(claim)) {
      hedges.push(HedgeMarker.QUALIFICATION);
      commitmentLevel -= 0.2;
    }
    if (/\b(?:I\s+(?:suggest|argue|believe|think)|in\s+my\s+view)\b/i.test(claim)) {
      hedges.push(HedgeMarker.PERSONAL);
    }
    if (/(?:can|could|might)\s+be\s+(?:read|understood|interpreted)/i.test(claim)) {
      hedges.push(HedgeMarker.INTERPRETIVE);
      commitmentLevel -= 0.25;
    }

    // Clamp commitment level
    commitmentLevel = Math.max(0.1, Math.min(1.0, commitmentLevel));

    // Determine perspective
    if (type === ModalityType.HYPOTHETICAL) {
      perspective = 'hypothetical';
    } else if (/(?:according\s+to|(?:he|she|they)\s+(?:argue|claim|suggest))/i.test(claim)) {
      perspective = 'reported';
    }

    // Adjust type based on hedges if not already classified
    if (type === ModalityType.ASSERTED && hedges.length > 0) {
      if (hedges.includes(HedgeMarker.INTERPRETIVE)) {
        type = ModalityType.INTERPRETED;
      } else if (commitmentLevel < 0.5) {
        type = ModalityType.SPECULATIVE;
      }
    }

    return {
      type,
      hedges,
      commitmentLevel,
      perspective,
      confidence,
    };
  }
}

// =============================================================================
// EPISTEMIC FORCE AXIS CLASSIFIER
// =============================================================================

/**
 * Epistemic Force Axis Classifier
 * Determines the normative force of a claim.
 */
class EpistemicForceAxisClassifier extends AxisClassifier<EpistemicForceAxis> {
  private evaluativeTerms: string[] = [
    'successfully',
    'effectively',
    'adequately',
    'properly',
    'correctly',
    'rightly',
    'fails',
    'inadequately',
    'improperly',
    'incorrectly',
    'wrongly',
    'mistakenly',
    'best',
    'better',
    'worse',
    'superior',
    'inferior',
    'right',
    'wrong',
    'correct',
    'incorrect',
    'accurate',
    'inaccurate',
    'true',
    'false',
    'valid',
    'invalid',
    'sound',
    'unsound',
    'compelling',
    'unconvincing',
    'persuasive',
    'unpersuasive',
    'insightful',
    'superficial',
    'profound',
    'shallow',
    'significant',
    'trivial',
    'important',
    'unimportant',
    'crucial',
    'essential',
    'vital',
    'fundamental',
    'central',
    'key',
    'major',
    'minor',
  ];

  private normativeTerms: string[] = [
    'should',
    'ought',
    'must',
    'need',
    'required',
    'necessary',
    'obligated',
    'supposed',
  ];

  initializePatterns(): Map<string, RegExp[]> {
    return new Map([
      [
        'evaluative',
        [
          /(?:successfully|effectively|adequately|properly|correctly|rightly)\s+(?:resolves?|addresses?|explains?|accounts?\s+for)/gi,
          /(?:fails?\s+to|inadequately|improperly|incorrectly)\s+(?:resolve|address|explain|account\s+for)/gi,
          /(?:is|are)\s+(?:right|wrong|correct|incorrect|mistaken|accurate|inaccurate)/gi,
          /(?:best|better|worse|superior|inferior)\s+(?:explanation|account|reading|interpretation|analysis)/gi,
          /(?:more|less|most|least)\s+(?:convincing|compelling|plausible|adequate|satisfactory)/gi,
        ],
      ],
      [
        'normative',
        [
          /(?:should|ought\s+to|must|need\s+to)\s+be\s+(?:understood|read|interpreted|seen)/gi,
          /(?:It\s+is\s+)?(?:necessary|essential|important|imperative)\s+(?:to|that)/gi,
          /(?:We|One)\s+(?:should|ought\s+to|must|need\s+to)/gi,
          /(?:requires?|demands?|necessitates?)\s+(?:that|a|an)/gi,
        ],
      ],
      [
        'explanatory',
        [
          /(?:This|That|It)\s+(?:explains?|accounts?\s+for|clarifies?)\s+(?:why|how)/gi,
          /(?:The\s+)?(?:reason|explanation|cause)\s+(?:is|for|why)/gi,
          /(?:because|since|given\s+that|due\s+to)\s+/gi,
        ],
      ],
      [
        'critical',
        [
          /(?:This|It)\s+raises?\s+(?:the\s+)?(?:question|problem|issue|concern)/gi,
          /(?:problematic|questionable|dubious|suspicious|controversial)/gi,
          /(?:challenges?|undermines?|calls?\s+into\s+question)/gi,
        ],
      ],
    ]);
  }

  async classify(
    claim: string,
    context: ClassificationContext
  ): Promise<EpistemicForceAxis & { confidence: number }> {
    let type = EpistemicForceType.DESCRIPTIVE;
    const foundEvaluativeTerms: string[] = [];
    let normativeStrength = 0;
    let confidence = 0.7;

    // Check patterns
    for (const [forceType, patterns] of this.patterns) {
      if (this.matchPatterns(claim, patterns)) {
        type = forceType as EpistemicForceType;
        confidence = 0.85;
        break;
      }
    }

    // Find evaluative terms
    const claimLower = claim.toLowerCase();
    for (const term of this.evaluativeTerms) {
      if (claimLower.includes(term.toLowerCase())) {
        foundEvaluativeTerms.push(term);
      }
    }

    // Calculate normative strength
    let normativeCount = 0;
    for (const term of this.normativeTerms) {
      if (new RegExp(`\\b${term}\\b`, 'i').test(claim)) {
        normativeCount++;
      }
    }
    normativeStrength = Math.min(1.0, normativeCount * 0.25 + foundEvaluativeTerms.length * 0.15);

    // Upgrade type based on findings
    if (type === EpistemicForceType.DESCRIPTIVE) {
      if (foundEvaluativeTerms.length > 0) {
        type = EpistemicForceType.EVALUATIVE;
      } else if (normativeCount > 0) {
        type = EpistemicForceType.NORMATIVE;
      }
    }

    return {
      type,
      evaluativeTerms: foundEvaluativeTerms,
      normativeStrength,
      confidence,
    };
  }
}

// =============================================================================
// MAIN MULTI-AXIS CLASSIFIER
// =============================================================================

/**
 * Multi-axis claim classifier that independently classifies
 * each axis and composes them into a complete profile.
 */
export class MultiAxisClaimClassifier {
  private attributionClassifier: AttributionAxisClassifier;
  private assertionClassifier: AssertionAxisClassifier;
  private structureClassifier: StructureAxisClassifier;
  private modalityClassifier: ModalityAxisClassifier;
  private epistemicForceClassifier: EpistemicForceAxisClassifier;
  private options: ClassifierOptions;

  constructor(options?: ClassifierOptions) {
    this.options = options || {};
    this.attributionClassifier = new AttributionAxisClassifier(options);
    this.assertionClassifier = new AssertionAxisClassifier(options);
    this.structureClassifier = new StructureAxisClassifier(options);
    this.modalityClassifier = new ModalityAxisClassifier(options);
    this.epistemicForceClassifier = new EpistemicForceAxisClassifier(options);
  }

  /**
   * Classify a claim across all axes.
   * Each axis is classified independently, then combined.
   */
  async classify(claim: string, context: ClassificationContext): Promise<ClaimProfile> {
    // Run all classifiers in parallel (independent axes)
    const [attribution, assertion, structure, modality, epistemicForce] = await Promise.all([
      this.attributionClassifier.classify(claim, context),
      this.assertionClassifier.classify(claim, context),
      this.structureClassifier.classify(claim, context),
      this.modalityClassifier.classify(claim, context),
      this.epistemicForceClassifier.classify(claim, context),
    ]);

    return {
      attribution: {
        type: attribution.type,
        authors: attribution.authors,
        qualifier: attribution.qualifier,
        inherited: attribution.inherited,
        inheritedFrom: attribution.inheritedFrom,
      },
      assertion: {
        type: assertion.type,
        secondary: assertion.secondary,
        terms: assertion.terms,
        relation: assertion.relation,
      },
      structure: {
        type: structure.type,
        connectives: structure.connectives,
        atomicClaimCount: structure.atomicClaimCount,
        inferenceType: structure.inferenceType,
      },
      modality: {
        type: modality.type,
        hedges: modality.hedges,
        commitmentLevel: modality.commitmentLevel,
        perspective: modality.perspective,
      },
      epistemicForce: {
        type: epistemicForce.type,
        evaluativeTerms: epistemicForce.evaluativeTerms,
        normativeStrength: epistemicForce.normativeStrength,
      },
      confidence: {
        attribution: attribution.confidence,
        assertion: assertion.confidence,
        structure: structure.confidence,
        modality: modality.confidence,
        epistemicForce: epistemicForce.confidence,
      },
    };
  }

  /**
   * Classify only specific axes (for performance when not all needed)
   */
  async classifyAxes(
    claim: string,
    context: ClassificationContext,
    axes: ('attribution' | 'assertion' | 'structure' | 'modality' | 'epistemicForce')[]
  ): Promise<Partial<ClaimProfile>> {
    const result: Partial<ClaimProfile> = {};
    const promises: Promise<void>[] = [];

    if (axes.includes('attribution')) {
      promises.push(
        this.attributionClassifier.classify(claim, context).then((r) => {
          result.attribution = r;
        })
      );
    }
    if (axes.includes('assertion')) {
      promises.push(
        this.assertionClassifier.classify(claim, context).then((r) => {
          result.assertion = r;
        })
      );
    }
    if (axes.includes('structure')) {
      promises.push(
        this.structureClassifier.classify(claim, context).then((r) => {
          result.structure = r;
        })
      );
    }
    if (axes.includes('modality')) {
      promises.push(
        this.modalityClassifier.classify(claim, context).then((r) => {
          result.modality = r;
        })
      );
    }
    if (axes.includes('epistemicForce')) {
      promises.push(
        this.epistemicForceClassifier.classify(claim, context).then((r) => {
          result.epistemicForce = r;
        })
      );
    }

    await Promise.all(promises);
    return result;
  }

  /**
   * Get average confidence across all axes
   */
  getOverallConfidence(profile: ClaimProfile): number {
    const { confidence } = profile;
    return (
      (confidence.attribution +
        confidence.assertion +
        confidence.structure +
        confidence.modality +
        confidence.epistemicForce) /
      5
    );
  }

  /**
   * Find axes with low confidence that may need LLM augmentation
   */
  findLowConfidenceAxes(profile: ClaimProfile, threshold = 0.7): string[] {
    const axes: string[] = [];
    if (profile.confidence.attribution < threshold) axes.push('attribution');
    if (profile.confidence.assertion < threshold) axes.push('assertion');
    if (profile.confidence.structure < threshold) axes.push('structure');
    if (profile.confidence.modality < threshold) axes.push('modality');
    if (profile.confidence.epistemicForce < threshold) axes.push('epistemicForce');
    return axes;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  AttributionAxisClassifier,
  AssertionAxisClassifier,
  StructureAxisClassifier,
  ModalityAxisClassifier,
  EpistemicForceAxisClassifier,
};
