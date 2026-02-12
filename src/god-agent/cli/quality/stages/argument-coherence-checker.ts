/**
 * ArgumentCoherenceChecker - Quality stage for evaluating argument coherence
 *
 * Checks for:
 * - Logical flow between paragraphs
 * - Claim-evidence-warrant structure completeness
 * - Unsupported claims
 * - Contradictory statements
 * - Argument thread continuity
 *
 * Uses pattern matching and heuristics - no external AI calls.
 */

import {
  BaseQualityStage,
  type QualityStageResult,
  type QualityIssue,
  type QualityEvaluationContext,
  countIssuesBySeverity,
} from '../quality-stage.js';
import {
  ClaimStrengthAnalyzer,
  type ParagraphAnalysis as ClaimParagraphAnalysis,
} from '../helpers/claim-strength-analyzer.js';
import type { PhilosophicalConceptTracker } from '../helpers/philosophical-concept-tracker.js';

// ============================================================================
// Pattern Constants
// ============================================================================

// Claim indicator patterns
const CLAIM_PATTERNS = [
  /\b(i\s+argue\s+that)\b/i,
  /\b(we\s+argue\s+that)\b/i,
  /\b(this\s+(paper|study|research|dissertation|thesis)\s+(argues?|contends?|proposes?|demonstrates?)\s+that)\b/i,
  /\b(my\s+(argument|thesis|contention|claim)\s+is\s+that)\b/i,
  /\b(the\s+(central|main|key|primary)\s+(argument|thesis|claim))\b/i,
  /\b(it\s+is\s+(argued|claimed|contended)\s+that)\b/i,
  /\b(this\s+suggests\s+that)\b/i,
  /\b(the\s+evidence\s+(indicates?|suggests?|demonstrates?)\s+that)\b/i,
  /\b(i\s+contend\s+that)\b/i,
  /\b(it\s+can\s+be\s+(argued|claimed|concluded)\s+that)\b/i,
  /\b(the\s+findings?\s+(show|demonstrate|indicate|reveal|suggest)\s+that)\b/i,
  /\b(this\s+(demonstrates?|shows?|proves?|establishes?)\s+that)\b/i,
];

// Evidence indicator patterns
const EVIDENCE_PATTERNS = [
  /\b(evidence\s+for\s+this)\b/i,
  /\b(this\s+is\s+(supported|demonstrated|shown)\s+by)\b/i,
  /\b(support\s+for\s+this\s+(claim|argument|position))\b/i,
  /\b(empirical\s+(evidence|data|findings?))\b/i,
  /\b(the\s+(data|evidence|findings?|results?)\s+(show|demonstrate|indicate|reveal|suggest))\b/i,
  /\b(research\s+(has\s+)?(shown|demonstrated|found|revealed)\s+that)\b/i,
  /\b(studies\s+(have\s+)?(shown|demonstrated|found|indicated)\s+that)\b/i,
  /\b(as\s+(demonstrated|shown|evidenced)\s+by)\b/i,
  /\b(for\s+(example|instance))\b/i,
  /\b(consider\s+(the\s+)?case\s+of)\b/i,
  /\b(a\s+(notable|clear|good|prime)\s+example)\b/i,
  /\b(to\s+illustrate)\b/i,
  /\b(according\s+to)\b/i,
  /\b(\(\s*\d{4}\s*\))/,  // Citation year pattern
  /\b(\w+\s+et\s+al\.)/i,  // et al. citation
];

// Warrant/reasoning patterns (connecting evidence to claims)
const WARRANT_PATTERNS = [
  /\b(because)\b/i,
  /\b(since)\b/i,
  /\b(given\s+that)\b/i,
  /\b(due\s+to)\b/i,
  /\b(therefore)\b/i,
  /\b(thus)\b/i,
  /\b(hence)\b/i,
  /\b(consequently)\b/i,
  /\b(as\s+a\s+result)\b/i,
  /\b(it\s+follows\s+that)\b/i,
  /\b(this\s+(implies?|means?|suggests?)\s+that)\b/i,
  /\b(the\s+implication\s+(is|of\s+this))\b/i,
  /\b(in\s+other\s+words)\b/i,
];

// Transition patterns for logical flow
const TRANSITION_PATTERNS = {
  additive: [
    /\b(furthermore)\b/i,
    /\b(moreover)\b/i,
    /\b(additionally)\b/i,
    /\b(in\s+addition)\b/i,
    /\b(also)\b/i,
    /\b(similarly)\b/i,
    /\b(likewise)\b/i,
  ],
  contrastive: [
    /\b(however)\b/i,
    /\b(nevertheless)\b/i,
    /\b(nonetheless)\b/i,
    /\b(on\s+the\s+other\s+hand)\b/i,
    /\b(in\s+contrast)\b/i,
    /\b(conversely)\b/i,
    /\b(although)\b/i,
    /\b(despite)\b/i,
    /\b(yet)\b/i,
    /\b(but)\b/i,
  ],
  causal: [
    /\b(therefore)\b/i,
    /\b(thus)\b/i,
    /\b(hence)\b/i,
    /\b(consequently)\b/i,
    /\b(as\s+a\s+result)\b/i,
    /\b(because)\b/i,
    /\b(since)\b/i,
  ],
  sequential: [
    /\b(first(ly)?)\b/i,
    /\b(second(ly)?)\b/i,
    /\b(third(ly)?)\b/i,
    /\b(finally)\b/i,
    /\b(next)\b/i,
    /\b(then)\b/i,
    /\b(subsequently)\b/i,
    /\b(following\s+this)\b/i,
  ],
  exemplifying: [
    /\b(for\s+(example|instance))\b/i,
    /\b(specifically)\b/i,
    /\b(in\s+particular)\b/i,
    /\b(to\s+illustrate)\b/i,
    /\b(namely)\b/i,
  ],
  summarizing: [
    /\b(in\s+summary)\b/i,
    /\b(to\s+summarize)\b/i,
    /\b(in\s+conclusion)\b/i,
    /\b(overall)\b/i,
    /\b(in\s+short)\b/i,
    /\b(to\s+sum\s+up)\b/i,
  ],
};

// Contradiction indicator patterns
const CONTRADICTION_PATTERNS = [
  { pattern: /\b(always)\b/i, opposite: /\b(never)\b/i },
  { pattern: /\b(all)\b/i, opposite: /\b(none|no)\b/i },
  { pattern: /\b(must)\b/i, opposite: /\b(cannot|must\s+not)\b/i },
  { pattern: /\b(is\s+true)\b/i, opposite: /\b(is\s+(false|not\s+true))\b/i },
  { pattern: /\b(increase[sd]?)\b/i, opposite: /\b(decrease[sd]?)\b/i },
  { pattern: /\b(positive)\b/i, opposite: /\b(negative)\b/i },
  { pattern: /\b(support[s]?)\b/i, opposite: /\b((refute|contradict)[s]?)\b/i },
];

// ============================================================================
// Philosophical Argument Patterns (MEDIUM #4)
// ============================================================================

/**
 * Patterns for detecting philosophical argument structures
 * Based on standard forms: syllogistic, dialectical, phenomenological, hermeneutic
 */

// Syllogistic/deductive patterns (major premise, minor premise, conclusion)
const SYLLOGISTIC_PATTERNS = {
  majorPremise: [
    /\b(all|every|any)\s+\w+\s+(is|are|have|has)\b/i,
    /\b(no|none)\s+\w+\s+(is|are|can)\b/i,
    /\b(if.+then)\b/i,
    /\b(whenever.+necessarily)\b/i,
    /\b(by\s+definition)\b/i,
    /\b(it\s+is\s+(essential|necessary)\s+that)\b/i,
    /\b(qua)\b/i,  // Aristotelian technical term
  ],
  minorPremise: [
    /\b(this|the|a|an)\s+\w+\s+(is|are|have|has)\s+(such|a)\b/i,
    /\b(in\s+this\s+case)\b/i,
    /\b(here,?\s+we\s+(find|see|have))\b/i,
    /\b(consider)\b/i,
    /\b(take\s+(the\s+)?case\s+of)\b/i,
  ],
  conclusion: [
    /\b(therefore,?\s+this)\b/i,
    /\b(it\s+follows\s+that)\b/i,
    /\b(we\s+must\s+conclude)\b/i,
    /\b(this\s+entails)\b/i,
    /\b(necessarily,?\s+(then|this))\b/i,
    /\b(q\.e\.d\.?)\b/i,
  ],
};

// Dialectical patterns (thesis, antithesis, synthesis)
const DIALECTICAL_PATTERNS = {
  thesis: [
    /\b(the\s+(standard|traditional|received|common)\s+(view|position|account))\b/i,
    /\b(one\s+(might|could|would)\s+(think|argue|hold))\b/i,
    /\b(it\s+is\s+(often|commonly|generally)\s+(held|thought|believed))\b/i,
    /\b(the\s+(\w+)\s+position\s+(holds|maintains|states))\b/i,
    /\b(initially,?\s+it\s+(appears?|seems?))\b/i,
  ],
  antithesis: [
    /\b(however,?\s+(this|the)\s+(view|position|account))\b/i,
    /\b(against\s+this)\b/i,
    /\b(the\s+objection\s+(is|runs|goes))\b/i,
    /\b(critics?\s+(have\s+)?(argued?|pointed|noted|objected))\b/i,
    /\b(one\s+(might|could)\s+object\s+that)\b/i,
    /\b(but\s+this\s+(overlooks?|ignores?|fails?\s+to))\b/i,
    /\b(pace\s+\w+)\b/i,  // philosophical "contrary to"
  ],
  synthesis: [
    /\b(what\s+emerges\s+from\s+this)\b/i,
    /\b(a\s+(more\s+)?(adequate|nuanced|comprehensive)\s+(account|view|position))\b/i,
    /\b(we\s+can\s+(now\s+)?see\s+that)\b/i,
    /\b(the\s+(resolution|reconciliation)\s+(lies|comes))\b/i,
    /\b(synthesizing\s+these\s+(views|positions))\b/i,
    /\b(a\s+via\s+media)\b/i,
  ],
};

// Comparative/contrastive patterns indicating intentional comparison (not contradiction)
const COMPARATIVE_PATTERNS = [
  /\b(while\s+(\w+\s+)?(argues?|claims?|holds?|maintains?)[^,]+,\s*(\w+\s+)?(argues?|claims?|holds?|maintains?))\b/i,
  /\b(whereas\s+\w+)\b/i,
  /\b(in\s+contrast\s+to\s+\w+)\b/i,
  /\b(by\s+contrast)\b/i,
  /\b(unlike\s+\w+)\b/i,
  /\b(differs?\s+from\s+\w+\s+in\s+that)\b/i,
  /\b(\w+['']?s\s+(view|account|position|analysis)\s+(differs?|contrasts?))\b/i,
  /\b(on\s+the\s+one\s+hand[\s\S]+on\s+the\s+other\s+hand)\b/i,
  /\b(for\s+\w+.+(however|but|yet|whereas)\s+for\s+\w+)\b/i,
];

// Synthesis/bridging patterns indicating resolution of apparent tensions
const SYNTHESIS_PATTERNS = [
  /\b((this|the)\s+(apparent\s+)?(tension|contradiction|conflict)\s+(resolves?|dissolves?|disappears?))\b/i,
  /\b(yet\s+(this|these|the)\s+(\w+\s+)?(can\s+be\s+)?(reconciled?|integrated?|synthesized?))\b/i,
  /\b(nevertheless)\b/i,
  /\b(despite\s+(this|these)\s+(apparent\s+)?(differences?|tensions?))\b/i,
  /\b(what\s+emerges)\b/i,
  /\b(the\s+deeper\s+(unity|convergence|integration))\b/i,
  /\b(bridge[s]?\s+the\s+gap\s+between)\b/i,
  /\b(mediates?\s+between)\b/i,
];

// Phenomenological patterns (description, analysis, interpretation)
const PHENOMENOLOGICAL_PATTERNS = {
  description: [
    /\b(the\s+phenomenon\s+of)\b/i,
    /\b(as\s+it\s+(appears?|presents?\s+itself|shows?\s+itself))\b/i,
    /\b(in\s+the\s+(lived|immediate)\s+experience)\b/i,
    /\b(we\s+(encounter|experience|find))\b/i,
    /\b(what\s+(appears?|presents?\s+itself|manifests?))\b/i,
    /\b(Dasein|being-in-the-world|Zuhandenheit|Vorhandenheit)\b/i,
  ],
  eidetic: [
    /\b(the\s+essence\s+of)\b/i,
    /\b(essential(ly)?|eidos)\b/i,
    /\b(what\s+makes?\s+.+\s+what\s+it\s+is)\b/i,
    /\b(qua|as\s+such)\b/i,
    /\b(the\s+structure\s+(of|underlying))\b/i,
    /\b(constitutive\s+of)\b/i,
  ],
  interpretation: [
    /\b(this\s+(reveals?|discloses?|shows?))\b/i,
    /\b(the\s+(meaning|significance)\s+of\s+this)\b/i,
    /\b(we\s+can\s+(now\s+)?understand)\b/i,
    /\b(what\s+is\s+at\s+stake\s+(here|in))\b/i,
    /\b(the\s+hermeneutic\s+(significance|import))\b/i,
  ],
};

// Textual/exegetical patterns (common in history of philosophy)
const EXEGETICAL_PATTERNS = {
  textualClaim: [
    /\b(in\s+(the|his|her)\s+(\w+)\s*[,;]?\s*\w+\s+(writes?|states?|argues?|claims?))\b/i,
    /\b(at\s+\d+\w?\d*-?\d*\w?\d*)\b/i,  // Stephanus/Bekker numbers
    /\b(\w+\s+\d+[a-z]?\d*-?\d*[a-z]?\d*)\b/i,  // Reference style like "EN 1140a20"
    /\b(the\s+passage\s+(at|from|in))\b/i,
    /\b(this\s+(passage|text|line)\s+(shows?|indicates?|suggests?))\b/i,
  ],
  interpretiveClaim: [
    /\b(this\s+should\s+be\s+(read|understood|interpreted)\s+as)\b/i,
    /\b(the\s+(best|correct|proper)\s+(reading|interpretation)\s+of)\b/i,
    /\b(what\s+\w+\s+(means|intends)\s+(here|by\s+this))\b/i,
    /\b(we\s+should\s+(not\s+)?(take|read|understand)\s+this\s+to\s+mean)\b/i,
    /\b(contra\s+\w+['']?s?\s+(reading|interpretation))\b/i,
  ],
  evidenceFromText: [
    /\b(the\s+Greek\s+(term|word|phrase))\b/i,
    /\b(the\s+original\s+(has|reads|says))\b/i,
    /\b((cf\.|compare)\s+\w+\s+\d+)\b/i,
    /\b(parallel\s+(passage|text)\s+(at|in))\b/i,
    /\b(this\s+is\s+(confirmed|supported)\s+by)\b/i,
  ],
};

// Greek/Latin philosophical terms that mark technical claims
const PHILOSOPHICAL_TECHNICAL_TERMS = [
  // Greek terms
  /\b(phantasia|aisth[ēe]sis|pathos|logos|nous|psych[ēe]|eidos|ousia|energ[ei]a|dynamis)\b/i,
  /\b(arche|telos|physis|techne|episteme|doxa|aletheia)\b/i,
  /\b(h[ēe]don[ēe]|eudaimonia|aret[ēe]|phronesis|sophia)\b/i,
  // Heideggerian terms
  /\b(Dasein|Sein|Seiendes|Zuhandenheit|Vorhandenheit|Befindlichkeit|Stimmung)\b/i,
  /\b(Sorge|Angst|Geworfenheit|Entwurf|Lichtung)\b/i,
  // Latin terms
  /\b(a\s+priori|a\s+posteriori|per\s+se|qua|sui\s+generis)\b/i,
  /\b(prima\s+facie|ceteris\s+paribus|mutatis\s+mutandis)\b/i,
];

// ============================================================================
// Argument Block Interface
// ============================================================================

interface ArgumentBlock {
  type: 'claim' | 'evidence' | 'warrant' | 'counterargument' | 'rebuttal';
  text: string;
  paragraphIndex: number;
  sentenceIndex: number;
  confidence: number;
}

interface ParagraphAnalysis {
  index: number;
  text: string;
  sentences: string[];
  hasClaim: boolean;
  hasEvidence: boolean;
  hasWarrant: boolean;
  hasTransition: boolean;
  transitionTypes: string[];
  argumentBlocks: ArgumentBlock[];
  // Philosophical argument extensions (MEDIUM #4)
  philosophicalPatterns: {
    hasSyllogisticComponent: boolean;
    syllogisticType?: 'majorPremise' | 'minorPremise' | 'conclusion';
    hasDialecticalComponent: boolean;
    dialecticalType?: 'thesis' | 'antithesis' | 'synthesis';
    hasPhenomenologicalComponent: boolean;
    phenomenologicalType?: 'description' | 'eidetic' | 'interpretation';
    hasExegeticalComponent: boolean;
    exegeticalType?: 'textualClaim' | 'interpretiveClaim' | 'evidenceFromText';
    hasTechnicalTerms: boolean;
    technicalTerms: string[];
  };
}

// ============================================================================
// ArgumentCoherenceChecker Class
// ============================================================================

/**
 * Quality stage that evaluates argument coherence and logical flow
 */
export class ArgumentCoherenceChecker extends BaseQualityStage {
  readonly name = 'argument-coherence';
  readonly weight = 0.18; // Adjusted for 7-stage gauntlet
  readonly threshold = 0.75;

  /**
   * Evaluate chapter text for argument coherence
   * Phase 2: Enhanced with PhilosophicalConceptTracker
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

    // Extract and analyze paragraphs
    const paragraphs = this.extractParagraphs(chapterText);
    const paragraphAnalyses = paragraphs.map((p, i) => this.analyzeParagraph(p, i));

    metrics['paragraphCount'] = paragraphs.length;

    // Check for claim-evidence-warrant structure
    const structureIssues = this.checkArgumentStructure(
      paragraphAnalyses,
      chapterId
    );
    issues.push(...structureIssues);

    // Check for unsupported claims
    const unsupportedIssues = this.findUnsupportedClaims(
      paragraphAnalyses,
      chapterId
    );
    issues.push(...unsupportedIssues);

    // Check logical flow between paragraphs
    const flowIssues = this.checkLogicalFlow(paragraphAnalyses, chapterId);
    issues.push(...flowIssues);

    // Check for contradictions
    const contradictionIssues = this.findContradictions(
      paragraphAnalyses,
      chapterId
    );
    issues.push(...contradictionIssues);

    // Check argument thread continuity
    const continuityIssues = this.checkArgumentContinuity(
      paragraphAnalyses,
      chapterId
    );
    issues.push(...continuityIssues);

    // Check philosophical argument patterns (MEDIUM #4)
    const philosophicalIssues = this.checkPhilosophicalPatterns(
      paragraphAnalyses,
      chapterId
    );
    issues.push(...philosophicalIssues);

    // Phase 2: Check concept usage if concept tracker available
    if (context?.conceptTracker) {
      const conceptIssues = this.checkConceptUsage(
        paragraphAnalyses,
        chapterId,
        context.conceptTracker as PhilosophicalConceptTracker
      );
      issues.push(...conceptIssues);
    }

    // Calculate metrics
    const claimCount = paragraphAnalyses.filter(p => p.hasClaim).length;
    const evidenceCount = paragraphAnalyses.filter(p => p.hasEvidence).length;
    const warrantCount = paragraphAnalyses.filter(p => p.hasWarrant).length;
    const transitionCount = paragraphAnalyses.filter(p => p.hasTransition).length;

    metrics['claimCount'] = claimCount;
    metrics['evidenceCount'] = evidenceCount;
    metrics['warrantCount'] = warrantCount;
    metrics['transitionCount'] = transitionCount;
    metrics['claimToEvidenceRatio'] = claimCount > 0 ? evidenceCount / claimCount : 0;
    metrics['transitionCoverage'] = paragraphs.length > 1
      ? transitionCount / (paragraphs.length - 1)
      : 1;

    // Calculate philosophical pattern metrics (MEDIUM #4)
    const syllogisticCount = paragraphAnalyses.filter(p => p.philosophicalPatterns.hasSyllogisticComponent).length;
    const dialecticalCount = paragraphAnalyses.filter(p => p.philosophicalPatterns.hasDialecticalComponent).length;
    const phenomenologicalCount = paragraphAnalyses.filter(p => p.philosophicalPatterns.hasPhenomenologicalComponent).length;
    const exegeticalCount = paragraphAnalyses.filter(p => p.philosophicalPatterns.hasExegeticalComponent).length;
    const technicalTermCount = paragraphAnalyses.filter(p => p.philosophicalPatterns.hasTechnicalTerms).length;

    metrics['syllogisticPatterns'] = syllogisticCount;
    metrics['dialecticalPatterns'] = dialecticalCount;
    metrics['phenomenologicalPatterns'] = phenomenologicalCount;
    metrics['exegeticalPatterns'] = exegeticalCount;
    metrics['paragraphsWithTechnicalTerms'] = technicalTermCount;

    // Collect all unique technical terms
    const allTechnicalTerms = new Set<string>();
    for (const analysis of paragraphAnalyses) {
      for (const term of analysis.philosophicalPatterns.technicalTerms) {
        allTechnicalTerms.add(term);
      }
    }
    metrics['uniqueTechnicalTerms'] = allTechnicalTerms.size;

    // Generate suggestions based on analysis
    if (metrics['claimToEvidenceRatio'] < 0.5) {
      suggestions.push(
        'Consider adding more evidence to support your claims. ' +
        'Aim for at least one piece of evidence per claim.'
      );
    }

    if (metrics['transitionCoverage'] < 0.3) {
      suggestions.push(
        'Many paragraphs lack clear transitions. ' +
        'Add transitional phrases to improve logical flow between ideas.'
      );
    }

    if (warrantCount < claimCount * 0.3) {
      suggestions.push(
        'Consider adding more explicit reasoning that connects your evidence to your claims. ' +
        'Use phrases like "this demonstrates that" or "therefore" to strengthen arguments.'
      );
    }

    // Calculate score
    const { critical, major, minor } = countIssuesBySeverity(issues);
    const totalElements = paragraphs.length + claimCount + evidenceCount;
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
    // Only minor transition issues are auto-fixable
    return issue.autoFixable && issue.type === 'coherence' && issue.severity === 'minor';
  }

  /**
   * Auto-fix minor coherence issues (add basic transitions)
   */
  autoFix(text: string, issue: QualityIssue): string {
    if (!this.canAutoFix(issue)) {
      return text;
    }

    // For missing transitions, we can suggest but not auto-fix
    // as it requires understanding the semantic relationship
    return text;
  }

  // ============================================================================
  // Private Analysis Methods
  // ============================================================================

  /**
   * Analyze a single paragraph for argument components
   */
  private analyzeParagraph(text: string, index: number): ParagraphAnalysis {
    const sentences = this.extractSentences(text);
    const argumentBlocks: ArgumentBlock[] = [];

    let hasClaim = false;
    let hasEvidence = false;
    let hasWarrant = false;
    let hasTransition = false;
    const transitionTypes: string[] = [];

    // Check first sentence for transitions
    if (sentences.length > 0) {
      const firstSentence = sentences[0];
      for (const [type, patterns] of Object.entries(TRANSITION_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(firstSentence)) {
            hasTransition = true;
            if (!transitionTypes.includes(type)) {
              transitionTypes.push(type);
            }
            break;
          }
        }
      }
    }

    // Analyze each sentence
    sentences.forEach((sentence, sentenceIndex) => {
      // Check for claims
      for (const pattern of CLAIM_PATTERNS) {
        if (pattern.test(sentence)) {
          hasClaim = true;
          argumentBlocks.push({
            type: 'claim',
            text: sentence,
            paragraphIndex: index,
            sentenceIndex,
            confidence: 0.7,
          });
          break;
        }
      }

      // Check for evidence
      for (const pattern of EVIDENCE_PATTERNS) {
        if (pattern.test(sentence)) {
          hasEvidence = true;
          argumentBlocks.push({
            type: 'evidence',
            text: sentence,
            paragraphIndex: index,
            sentenceIndex,
            confidence: 0.7,
          });
          break;
        }
      }

      // Check for warrants
      for (const pattern of WARRANT_PATTERNS) {
        if (pattern.test(sentence)) {
          hasWarrant = true;
          argumentBlocks.push({
            type: 'warrant',
            text: sentence,
            paragraphIndex: index,
            sentenceIndex,
            confidence: 0.6,
          });
          break;
        }
      }
    });

    // Analyze philosophical argument patterns (MEDIUM #4)
    const philosophicalPatterns = this.analyzePhilosophicalPatterns(text);

    return {
      index,
      text,
      sentences,
      hasClaim,
      hasEvidence,
      hasWarrant,
      hasTransition,
      transitionTypes,
      argumentBlocks,
      philosophicalPatterns,
    };
  }

  /**
   * Analyze philosophical argument patterns in text (MEDIUM #4)
   */
  private analyzePhilosophicalPatterns(text: string): ParagraphAnalysis['philosophicalPatterns'] {
    // Syllogistic patterns
    let hasSyllogisticComponent = false;
    let syllogisticType: 'majorPremise' | 'minorPremise' | 'conclusion' | undefined;

    for (const [type, patterns] of Object.entries(SYLLOGISTIC_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          hasSyllogisticComponent = true;
          syllogisticType = type as 'majorPremise' | 'minorPremise' | 'conclusion';
          break;
        }
      }
      if (hasSyllogisticComponent) break;
    }

    // Dialectical patterns
    let hasDialecticalComponent = false;
    let dialecticalType: 'thesis' | 'antithesis' | 'synthesis' | undefined;

    for (const [type, patterns] of Object.entries(DIALECTICAL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          hasDialecticalComponent = true;
          dialecticalType = type as 'thesis' | 'antithesis' | 'synthesis';
          break;
        }
      }
      if (hasDialecticalComponent) break;
    }

    // Phenomenological patterns
    let hasPhenomenologicalComponent = false;
    let phenomenologicalType: 'description' | 'eidetic' | 'interpretation' | undefined;

    for (const [type, patterns] of Object.entries(PHENOMENOLOGICAL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          hasPhenomenologicalComponent = true;
          phenomenologicalType = type as 'description' | 'eidetic' | 'interpretation';
          break;
        }
      }
      if (hasPhenomenologicalComponent) break;
    }

    // Exegetical patterns
    let hasExegeticalComponent = false;
    let exegeticalType: 'textualClaim' | 'interpretiveClaim' | 'evidenceFromText' | undefined;

    for (const [type, patterns] of Object.entries(EXEGETICAL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          hasExegeticalComponent = true;
          exegeticalType = type as 'textualClaim' | 'interpretiveClaim' | 'evidenceFromText';
          break;
        }
      }
      if (hasExegeticalComponent) break;
    }

    // Technical terms
    const technicalTerms: string[] = [];
    let hasTechnicalTerms = false;

    for (const pattern of PHILOSOPHICAL_TECHNICAL_TERMS) {
      const matches = text.match(pattern);
      if (matches) {
        hasTechnicalTerms = true;
        for (const match of matches) {
          if (!technicalTerms.includes(match.toLowerCase())) {
            technicalTerms.push(match.toLowerCase());
          }
        }
      }
    }

    return {
      hasSyllogisticComponent,
      syllogisticType,
      hasDialecticalComponent,
      dialecticalType,
      hasPhenomenologicalComponent,
      phenomenologicalType,
      hasExegeticalComponent,
      exegeticalType,
      hasTechnicalTerms,
      technicalTerms,
    };
  }

  /**
   * Check for complete claim-evidence-warrant structures
   */
  private checkArgumentStructure(
    analyses: ParagraphAnalysis[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Find paragraphs with claims but no evidence
    for (const analysis of analyses) {
      if (analysis.hasClaim && !analysis.hasEvidence) {
        // Check if next paragraph has evidence
        const nextIndex = analysis.index + 1;
        const nextAnalysis = analyses.find(a => a.index === nextIndex);

        if (!nextAnalysis || !nextAnalysis.hasEvidence) {
          issues.push({
            id: this.generateIssueId('argument', issueIndex++),
            type: 'argument',
            severity: 'major',
            location: {
              chapterId,
              paragraphIndex: analysis.index,
            },
            description: 'Claim without supporting evidence in this or following paragraph',
            suggestion: 'Add evidence (data, citations, examples) to support this claim',
            autoFixable: false,
            contextSnippet: analysis.text.substring(0, 150),
          });
        }
      }

      // Check for evidence without clear connection to a claim
      if (analysis.hasEvidence && !analysis.hasClaim && !analysis.hasWarrant) {
        // Check previous paragraph for claim
        const prevIndex = analysis.index - 1;
        const prevAnalysis = analyses.find(a => a.index === prevIndex);

        if (!prevAnalysis || !prevAnalysis.hasClaim) {
          issues.push({
            id: this.generateIssueId('argument', issueIndex++),
            type: 'argument',
            severity: 'minor',
            location: {
              chapterId,
              paragraphIndex: analysis.index,
            },
            description: 'Evidence presented without clear connection to a claim',
            suggestion: 'Add explicit reasoning connecting this evidence to your argument',
            autoFixable: false,
            contextSnippet: analysis.text.substring(0, 150),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Find claims that lack support
   * Phase 2: Enhanced with ClaimStrengthAnalyzer
   */
  private findUnsupportedClaims(
    analyses: ParagraphAnalysis[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Phase 2: Initialize claim strength analyzer
    const strengthAnalyzer = new ClaimStrengthAnalyzer({
      strongClaimThreshold: 0.7,
      moderateClaimThreshold: 0.4,
      strictMode: false,
    });

    // Phase 2: Convert ParagraphAnalysis to ClaimParagraphAnalysis format
    const claimAnalyses: ClaimParagraphAnalysis[] = analyses.map(a => ({
      index: a.index,
      text: a.text,
      sentences: a.sentences,
      hasEvidence: a.hasEvidence,
      hasClaim: a.hasClaim,
      citationCount: strengthAnalyzer.countCitations(a.text),
    }));

    // Phase 2: Analyze chapter for argument buildup
    strengthAnalyzer.analyzeChapter(claimAnalyses);

    // Strong claim patterns that especially need support
    const strongClaimPatterns = [
      /\b(clearly)\b/i,
      /\b(obviously)\b/i,
      /\b(undoubtedly)\b/i,
      /\b(certainly)\b/i,
      /\b(it\s+is\s+(clear|evident|obvious)\s+that)\b/i,
      /\b(there\s+is\s+no\s+doubt)\b/i,
      /\b(always)\b/i,
      /\b(never)\b/i,
      /\b(all)\b/i,
      /\b(none)\b/i,
    ];

    for (const analysis of analyses) {
      for (const sentence of analysis.sentences) {
        // Check if sentence has strong claim language
        const hasStrongClaim = strongClaimPatterns.some(p => p.test(sentence));

        if (hasStrongClaim) {
          // Phase 2: Evaluate claim strength with context
          const evaluation = strengthAnalyzer.evaluateClaimStrength(
            sentence,
            analysis.index,
            analysis.text
          );

          // Only flag if not warranted
          if (!evaluation.isWarranted) {
            issues.push({
              id: this.generateIssueId('argument', issueIndex++),
              type: 'argument',
              severity: evaluation.supportScore < 0.3 ? 'major' : 'minor',
              location: {
                chapterId,
                paragraphIndex: analysis.index,
              },
              description: `Strong claim without adequate support (support score: ${evaluation.supportScore.toFixed(2)})`,
              suggestion: evaluation.recommendation ||
                'Provide more evidence or soften language (e.g., "suggests" instead of "clearly shows")',
              autoFixable: false,
              contextSnippet: sentence.substring(0, 150),
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check logical flow between paragraphs
   */
  private checkLogicalFlow(
    analyses: ParagraphAnalysis[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Skip first paragraph as it doesn't need a transition
    for (let i = 1; i < analyses.length; i++) {
      const current = analyses[i];
      const previous = analyses[i - 1];

      // Check for missing transitions in substantial paragraphs
      if (current.text.length > 200 && !current.hasTransition) {
        // More severe if there's a topic shift
        const severity = this.detectTopicShift(previous, current) ? 'major' : 'minor';

        issues.push({
          id: this.generateIssueId('coherence', issueIndex++),
          type: 'coherence',
          severity,
          location: {
            chapterId,
            paragraphIndex: current.index,
          },
          description: 'Paragraph lacks transitional phrase connecting to previous content',
          suggestion:
            'Add a transitional phrase at the beginning of this paragraph ' +
            '(e.g., "Furthermore," "In contrast," "Building on this,")',
          autoFixable: severity === 'minor',
          contextSnippet: current.sentences[0]?.substring(0, 100),
        });
      }

      // Check for inappropriate transition types
      if (current.hasTransition && current.transitionTypes.length > 0) {
        const transitionType = current.transitionTypes[0];

        // Contrastive transition after supporting evidence might be inappropriate
        if (transitionType === 'contrastive' && previous.hasEvidence && !previous.hasClaim) {
          // This might be intentional counterargument - just note as minor
          issues.push({
            id: this.generateIssueId('coherence', issueIndex++),
            type: 'coherence',
            severity: 'minor',
            location: {
              chapterId,
              paragraphIndex: current.index,
            },
            description: 'Contrastive transition after evidence paragraph - verify this is intentional',
            suggestion:
              'Ensure the contrastive relationship is clear to the reader',
            autoFixable: false,
            contextSnippet: current.sentences[0]?.substring(0, 100),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Find potential contradictions within the chapter
   * Enhanced to handle dialectical philosophical writing
   */
  private findContradictions(
    analyses: ParagraphAnalysis[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Build a map of key assertions with enhanced context
    const assertions: Array<{
      paragraphIndex: number;
      sentence: string;
      pattern: RegExp;
      opposite: RegExp;
      fullParagraph: string;
      philosopherMentioned?: string;
    }> = [];

    // Pattern to extract philosopher names from sentences
    const philosopherPattern = /\b([A-Z][a-z]+)['']?s\s+(view|account|position|analysis|argument|claim)/;

    for (const analysis of analyses) {
      for (const sentence of analysis.sentences) {
        for (const { pattern, opposite } of CONTRADICTION_PATTERNS) {
          if (pattern.test(sentence)) {
            // Extract any philosopher mentioned in the sentence
            const philosopherMatch = sentence.match(philosopherPattern);
            const philosopher = philosopherMatch ? philosopherMatch[1] : undefined;

            assertions.push({
              paragraphIndex: analysis.index,
              sentence,
              pattern,
              opposite,
              fullParagraph: analysis.text,
              philosopherMentioned: philosopher,
            });
          }
        }
      }
    }

    // Check for contradictions with contextual analysis
    for (const assertion of assertions) {
      for (const analysis of analyses) {
        // Don't compare with same paragraph
        if (analysis.index === assertion.paragraphIndex) continue;

        for (const sentence of analysis.sentences) {
          if (assertion.opposite.test(sentence)) {
            // Potential contradiction found - apply contextual filters

            // 1. Check if it's a comparative/contrastive structure
            const isComparative = this.isComparativeContext(
              assertion.sentence,
              sentence,
              assertion.fullParagraph,
              analysis.text
            );

            // 2. Check if different philosophers are being discussed
            const philosopherMatch = sentence.match(philosopherPattern);
            const currentPhilosopher = philosopherMatch ? philosopherMatch[1] : undefined;
            const isDifferentPhilosopher =
              assertion.philosopherMentioned &&
              currentPhilosopher &&
              assertion.philosopherMentioned !== currentPhilosopher;

            // 3. Check if paragraphs are separated (different argument threads)
            const paragraphGap = Math.abs(analysis.index - assertion.paragraphIndex);

            // 4. Check for synthesis/bridging language
            const hasSynthesis = this.hasSynthesisMarkers(analysis.text);

            // 5. Check dialectical patterns
            const isDialectical =
              analysis.philosophicalPatterns.hasDialecticalComponent ||
              assertion.philosopherMentioned !== undefined;

            // Only flag as critical if it's likely a genuine contradiction
            const isLikelyContradiction =
              !isComparative &&
              !isDifferentPhilosopher &&
              !hasSynthesis &&
              paragraphGap <= 2 &&
              !isDialectical;

            if (isLikelyContradiction) {
              // Still flag but with reduced severity
              issues.push({
                id: this.generateIssueId('argument', issueIndex++),
                type: 'argument',
                severity: 'major',  // Reduced from 'critical'
                location: {
                  chapterId,
                  paragraphIndex: analysis.index,
                },
                description: `Potential contradiction with statement in paragraph ${assertion.paragraphIndex + 1}`,
                suggestion:
                  'Review these statements for consistency. If intentional (e.g., presenting ' +
                  'different viewpoints), clarify the relationship between them.',
                autoFixable: false,
                contextSnippet: `P${assertion.paragraphIndex + 1}: "${assertion.sentence.substring(0, 80)}..." vs P${analysis.index + 1}: "${sentence.substring(0, 80)}..."`,
              });
            } else if (isComparative || isDifferentPhilosopher) {
              // Legitimate dialectical comparison - only flag as info if no clear markers
              const hasExplicitMarkers =
                COMPARATIVE_PATTERNS.some(p => p.test(sentence)) ||
                COMPARATIVE_PATTERNS.some(p => p.test(assertion.sentence));

              if (!hasExplicitMarkers && !hasSynthesis) {
                issues.push({
                  id: this.generateIssueId('coherence', issueIndex++),
                  type: 'coherence',
                  severity: 'minor',
                  location: {
                    chapterId,
                    paragraphIndex: analysis.index,
                  },
                  description: 'Contrasting viewpoints could be more explicitly marked',
                  suggestion:
                    'Consider adding comparative markers (e.g., "While Aristotle argues X, Heidegger claims Y") ' +
                    'to make the dialectical structure clearer.',
                  autoFixable: false,
                  contextSnippet: `P${assertion.paragraphIndex + 1} vs P${analysis.index + 1}`,
                });
              }
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check if sentences appear in a comparative/contrastive context
   */
  private isComparativeContext(
    sentence1: string,
    sentence2: string,
    paragraph1: string,
    paragraph2: string
  ): boolean {
    // Check if either sentence contains comparative markers
    for (const pattern of COMPARATIVE_PATTERNS) {
      if (pattern.test(sentence1) || pattern.test(sentence2)) {
        return true;
      }
    }

    // Check if paragraphs contain comparative language
    for (const pattern of COMPARATIVE_PATTERNS) {
      if (pattern.test(paragraph1) || pattern.test(paragraph2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if text contains synthesis/bridging markers
   */
  private hasSynthesisMarkers(text: string): boolean {
    return SYNTHESIS_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Check for argument thread continuity
   */
  private checkArgumentContinuity(
    analyses: ParagraphAnalysis[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Find paragraphs that introduce key terms or concepts
    const keyTermParagraphs = new Map<string, number>();
    const keyTermPattern = /\b(defined?\s+as|refers?\s+to|means?|is\s+understood\s+as)\s+["']?([^"'.]+)["']?/gi;

    for (const analysis of analyses) {
      let match;
      while ((match = keyTermPattern.exec(analysis.text)) !== null) {
        const term = match[2].trim().toLowerCase();
        if (term.length > 3 && !keyTermParagraphs.has(term)) {
          keyTermParagraphs.set(term, analysis.index);
        }
      }
    }

    // Check that introduced terms are used again
    for (const [term, introIndex] of keyTermParagraphs) {
      let usedLater = false;

      for (const analysis of analyses) {
        if (analysis.index > introIndex) {
          const termPattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (termPattern.test(analysis.text)) {
            usedLater = true;
            break;
          }
        }
      }

      if (!usedLater && introIndex < analyses.length - 2) {
        issues.push({
          id: this.generateIssueId('coherence', issueIndex++),
          type: 'coherence',
          severity: 'minor',
          location: {
            chapterId,
            paragraphIndex: introIndex,
          },
          description: `Key term "${term}" is defined but not used in subsequent paragraphs`,
          suggestion:
            'Either use this term in later arguments or reconsider if the definition is necessary',
          autoFixable: false,
        });
      }
    }

    // Check for long gaps between related argument components
    let lastClaimIndex = -1;

    for (const analysis of analyses) {
      if (analysis.hasClaim) {
        if (lastClaimIndex !== -1) {
          const gap = analysis.index - lastClaimIndex;
          if (gap > 4) {
            // More than 4 paragraphs between claims
            issues.push({
              id: this.generateIssueId('structure', issueIndex++),
              type: 'structure',
              severity: 'minor',
              location: {
                chapterId,
                paragraphIndex: analysis.index,
              },
              description: `Long gap (${gap} paragraphs) between argument claims`,
              suggestion:
                'Consider adding signposting or intermediate claims to maintain argument momentum',
              autoFixable: false,
            });
          }
        }
        lastClaimIndex = analysis.index;
      }
    }

    return issues;
  }

  /**
   * Check for philosophical argument pattern issues (MEDIUM #4)
   * Validates syllogistic, dialectical, phenomenological, and exegetical patterns
   */
  private checkPhilosophicalPatterns(
    analyses: ParagraphAnalysis[],
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check for incomplete syllogistic arguments
    const syllogisticParagraphs = analyses.filter(p => p.philosophicalPatterns.hasSyllogisticComponent);
    if (syllogisticParagraphs.length > 0) {
      // Check if we have premises without conclusions
      const hasMajorPremise = syllogisticParagraphs.some(p => p.philosophicalPatterns.syllogisticType === 'majorPremise');
      const hasMinorPremise = syllogisticParagraphs.some(p => p.philosophicalPatterns.syllogisticType === 'minorPremise');
      const hasConclusion = syllogisticParagraphs.some(p => p.philosophicalPatterns.syllogisticType === 'conclusion');

      if ((hasMajorPremise || hasMinorPremise) && !hasConclusion) {
        issues.push({
          id: this.generateIssueId('argument', issueIndex++),
          type: 'argument',
          severity: 'major',
          location: { chapterId },
          description: 'Syllogistic argument detected with premises but no explicit conclusion',
          suggestion: 'Add an explicit conclusion using phrases like "therefore" or "it follows that"',
          autoFixable: false,
        });
      }
    }

    // Check for incomplete dialectical patterns
    const dialecticalParagraphs = analyses.filter(p => p.philosophicalPatterns.hasDialecticalComponent);
    if (dialecticalParagraphs.length > 0) {
      const hasThesis = dialecticalParagraphs.some(p => p.philosophicalPatterns.dialecticalType === 'thesis');
      const hasAntithesis = dialecticalParagraphs.some(p => p.philosophicalPatterns.dialecticalType === 'antithesis');
      const hasSynthesis = dialecticalParagraphs.some(p => p.philosophicalPatterns.dialecticalType === 'synthesis');

      // Thesis without antithesis or synthesis
      if (hasThesis && !hasAntithesis && !hasSynthesis) {
        issues.push({
          id: this.generateIssueId('argument', issueIndex++),
          type: 'argument',
          severity: 'minor',
          location: { chapterId },
          description: 'Standard position presented without critical engagement',
          suggestion: 'Consider adding objections (antithesis) or your own position (synthesis)',
          autoFixable: false,
        });
      }

      // Antithesis without resolution
      if (hasAntithesis && !hasSynthesis) {
        issues.push({
          id: this.generateIssueId('argument', issueIndex++),
          type: 'argument',
          severity: 'minor',
          location: { chapterId },
          description: 'Objection or antithesis presented without resolution',
          suggestion: 'Add synthesis or clarify how you respond to the objection',
          autoFixable: false,
        });
      }
    }

    // Check for exegetical claims without textual evidence
    for (const analysis of analyses) {
      const { philosophicalPatterns } = analysis;

      if (philosophicalPatterns.exegeticalType === 'interpretiveClaim') {
        // Check if there's textual evidence nearby
        const prevAnalysis = analyses.find(a => a.index === analysis.index - 1);
        const nextAnalysis = analyses.find(a => a.index === analysis.index + 1);

        const hasTextualEvidence =
          analysis.philosophicalPatterns.exegeticalType === 'evidenceFromText' ||
          analysis.philosophicalPatterns.exegeticalType === 'textualClaim' ||
          (prevAnalysis?.philosophicalPatterns.exegeticalType === 'textualClaim') ||
          (nextAnalysis?.philosophicalPatterns.exegeticalType === 'evidenceFromText');

        if (!hasTextualEvidence) {
          issues.push({
            id: this.generateIssueId('argument', issueIndex++),
            type: 'argument',
            severity: 'major',
            location: {
              chapterId,
              paragraphIndex: analysis.index,
            },
            description: 'Interpretive claim made without supporting textual evidence',
            suggestion: 'Add specific textual references (quotes, page numbers, Bekker/Stephanus numbers)',
            autoFixable: false,
            contextSnippet: analysis.text.substring(0, 150),
          });
        }
      }
    }

    // Check for technical term usage without definition
    const introducedTerms = new Set<string>();
    const definedTerms = new Set<string>();

    for (const analysis of analyses) {
      // Check if paragraph defines terms
      const defPattern = /\b(\w+)\s+(?:means?|refers?\s+to|is\s+defined\s+as|denotes?)\b/gi;
      let match;
      while ((match = defPattern.exec(analysis.text)) !== null) {
        definedTerms.add(match[1].toLowerCase());
      }

      // Track technical terms used
      for (const term of analysis.philosophicalPatterns.technicalTerms) {
        introducedTerms.add(term);
      }
    }

    // Find technical terms used without definition (only flag if multiple uses)
    const undefinedTerms = Array.from(introducedTerms).filter(term => !definedTerms.has(term));
    if (undefinedTerms.length > 3) {
      issues.push({
        id: this.generateIssueId('argument', issueIndex++),
        type: 'argument',
        severity: 'minor',
        location: { chapterId },
        description: `Multiple technical terms used without explicit definition: ${undefinedTerms.slice(0, 5).join(', ')}`,
        suggestion: 'Consider defining key technical terms on first use or in a glossary',
        autoFixable: false,
      });
    }

    // Check phenomenological descriptions without interpretation
    const phenomenologicalParagraphs = analyses.filter(p => p.philosophicalPatterns.hasPhenomenologicalComponent);
    if (phenomenologicalParagraphs.length > 0) {
      const hasDescription = phenomenologicalParagraphs.some(p => p.philosophicalPatterns.phenomenologicalType === 'description');
      const hasInterpretation = phenomenologicalParagraphs.some(p => p.philosophicalPatterns.phenomenologicalType === 'interpretation');

      if (hasDescription && !hasInterpretation) {
        issues.push({
          id: this.generateIssueId('argument', issueIndex++),
          type: 'argument',
          severity: 'minor',
          location: { chapterId },
          description: 'Phenomenological description without interpretive analysis',
          suggestion: 'Add interpretation explaining the significance of the described phenomena',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Check concept usage for adequate groundwork (Phase 2)
   */
  private checkConceptUsage(
    analyses: ParagraphAnalysis[],
    chapterId: number,
    conceptTracker: PhilosophicalConceptTracker
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Extract concepts from each paragraph and check groundwork
    for (const analysis of analyses) {
      // Get technical terms from philosophical patterns
      const technicalTerms = analysis.philosophicalPatterns.technicalTerms;

      for (const term of technicalTerms) {
        // Check if concept has adequate groundwork
        const groundwork = conceptTracker.checkConceptGroundwork(term, chapterId);

        if (!groundwork.hasAdequateGroundwork && groundwork.severity !== 'none') {
          issues.push({
            id: this.generateIssueId('coherence', issueIndex++),
            type: 'coherence',
            severity: groundwork.severity,
            location: {
              chapterId,
              paragraphIndex: analysis.index,
            },
            description: `Concept "${term}" used without adequate groundwork: ${groundwork.missingElements.join(', ')}`,
            suggestion: groundwork.recommendations.join(' '),
            autoFixable: false,
            contextSnippet: analysis.text.substring(0, 150),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect if there's a significant topic shift between paragraphs
   */
  private detectTopicShift(
    previous: ParagraphAnalysis,
    current: ParagraphAnalysis
  ): boolean {
    // Extract content words from both paragraphs
    const prevWords = this.extractContentWords(previous.text);
    const currWords = this.extractContentWords(current.text);

    // Calculate overlap
    const intersection = new Set([...prevWords].filter(x => currWords.has(x)));
    const union = new Set([...prevWords, ...currWords]);

    const overlap = union.size > 0 ? intersection.size / union.size : 0;

    // Low overlap suggests topic shift
    return overlap < 0.15;
  }

  /**
   * Extract content words (nouns, verbs, adjectives) from text
   */
  private extractContentWords(text: string): Set<string> {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'we', 'our',
      'has', 'have', 'had', 'can', 'could', 'will', 'would', 'should', 'may',
      'might', 'must', 'shall', 'be', 'being', 'do', 'does', 'did', 'done',
      'which', 'who', 'whom', 'whose', 'what', 'where', 'when', 'why', 'how',
      'if', 'then', 'than', 'so', 'very', 'just', 'also', 'such', 'only',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w));

    return new Set(words);
  }
}
