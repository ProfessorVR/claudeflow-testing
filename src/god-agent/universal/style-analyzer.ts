/**
 * StyleAnalyzer - Extracts writing characteristics from text samples
 * Used to learn and replicate writing styles for the God Agent
 */

import { SpellingTransformer, SpellingRule } from './spelling-transformer.js';
import { GrammarRule, GrammarTransformer } from './grammar-transformer.js';
import { createComponentLogger } from '../core/observability/logger.js';

const logger = createComponentLogger('StyleAnalyzer');

// Deep style fingerprinting imports
import type { RhetoricalMovePatterns } from '../cli/style/rhetorical-move-extractor.js';
import type { CitationIntegrationStyle } from '../cli/style/citation-integration-analyzer.js';
import type { ArgumentPatterns } from '../cli/style/argument-pattern-extractor.js';
import type { TransitionPatterns } from '../cli/style/transition-pattern-mapper.js';

export interface SentenceMetrics {
  averageLength: number;
  lengthVariance: number;
  shortSentenceRatio: number;  // < 10 words
  mediumSentenceRatio: number; // 10-25 words
  longSentenceRatio: number;   // > 25 words
  complexSentenceRatio: number; // Contains semicolons, colons, or multiple clauses
}

export interface VocabularyMetrics {
  uniqueWordRatio: number;      // Type-token ratio
  averageWordLength: number;
  academicWordRatio: number;    // Formal/academic vocabulary
  technicalTermDensity: number;
  latinateWordRatio: number;    // Words with Latin/Greek roots
  contractionUsage: number;     // Frequency of contractions
}

export interface StructureMetrics {
  paragraphLengthAvg: number;
  transitionWordDensity: number;
  passiveVoiceRatio: number;
  firstPersonUsage: number;
  thirdPersonUsage: number;
  questionFrequency: number;
  listUsage: number;
}

export interface ToneMetrics {
  formalityScore: number;       // 0-1, higher = more formal
  objectivityScore: number;     // 0-1, higher = more objective
  hedgingFrequency: number;     // "may", "might", "possibly", etc.
  assertivenessScore: number;   // Confident vs tentative language
  emotionalTone: number;        // 0-1, higher = more emotional
}

/**
 * Lanham Prose Analysis Metrics
 * Non-evaluative descriptive dimensions from Richard A. Lanham's "Analyzing Prose" (2003)
 */
export interface LanhamProseMetrics {
  // --- Continuous numeric values (internal scoring) ---
  nounVerbRatio: number;                    // 0=pure noun, 1=pure verb
  nominalizationDensity: number;            // per 100 words
  prepositionalPhraseDensity: number;       // per sentence
  beVerbRatio: number;                      // is/are/was/were as % of all verbs
  parataxisHypotaxisRatio: number;          // 0=pure parataxis, 1=pure hypotaxis
  coordinatingConjunctionDensity: number;
  subordinatingConjunctionDensity: number;
  periodicRunningRatio: number;             // 0=pure periodic, 1=pure running
  preMainVerbClauseCount: number;
  voiceScore: number;                       // 0=unvoiced, 1=strongly voiced
  dynamicRange: number;                     // variance in rhythm
  latinateGermanicRatio: number;            // primary lexical cue for register
  registerMarkednessScore: number;          // 0=unmarked (middle), 1=strongly marked
  opacityScore: number;                     // 0=transparent, 1=opaque
  selfConsciousnessScore: number;
  tacitPatterns: {
    alliterationDensity: number;
    polyptotonDensity: number;
    chiasmusCount: number;
    antithesisCount: number;
    anaphoraCount: number;
    isocolonCount: number;
    climaxPatternCount: number;
  };

  // --- Categorical labels ---
  labels: {
    nounVerb: 'predominantly noun-style' | 'balanced' | 'predominantly verb-style';
    parataxisHypotaxis: 'predominantly paratactic' | 'mixed' | 'predominantly hypotactic';
    periodicRunning: 'predominantly periodic' | 'mixed' | 'predominantly running';
    voice: 'unvoiced' | 'moderate voice' | 'strongly voiced';
    primaryRegister: 'high' | 'middle' | 'low' | 'mixed';
    registerMixed: boolean;
    opacity: 'transparent' | 'mixed opacity' | 'opaque';
  };

  // --- Explanation strings ---
  explanations: {
    nounVerb: string;
    parataxisHypotaxis: string;
    periodicRunning: string;
    voice: string;
    register: string;
    opacity: string;
    tacitPatterns: string;
  };

  // --- Confidence markers ---
  analysisDepth: 'heuristic' | 'deep' | 'hybrid';
  confidenceByAxis: {
    nounVerb: 'high' | 'medium' | 'low';
    parataxisHypotaxis: 'high' | 'medium' | 'low';
    periodicRunning: 'high' | 'medium' | 'low';
    voice: 'high' | 'medium' | 'low';
    register: 'high' | 'medium' | 'low';
    opacity: 'high' | 'medium' | 'low';
    tacitPatterns: 'high' | 'medium' | 'low';
  };
}

/**
 * Regional language settings for style profiles
 * Implements [REQ-STYLE-001]: Language variant configuration
 */
export interface RegionalSettings {
  /** Language variant: 'en-US', 'en-GB', or 'auto' for detection */
  languageVariant: 'en-US' | 'en-GB' | 'auto';
  /** Spelling transformation rules for this variant */
  spellingRules: SpellingRule[];
  /** Grammar transformation rules (Phase 2) */
  grammarRules: GrammarRule[];
  /** Date format preference */
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  /** Primary quotation mark style */
  primaryQuoteMark: '"' | "'";
  /** Confidence score if auto-detected (0-1) */
  detectedConfidence?: number;
}

export interface StyleCharacteristics {
  sentences: SentenceMetrics;
  vocabulary: VocabularyMetrics;
  structure: StructureMetrics;
  tone: ToneMetrics;
  samplePhrases: string[];      // Characteristic phrases/expressions
  commonTransitions: string[];  // Frequently used transition words
  openingPatterns: string[];    // How paragraphs/sections typically start
  citationStyle: string;        // Detected citation format
  /**
   * Regional language settings (UK vs US English)
   * Optional - undefined for legacy profiles (backward compatibility)
   * Implements [REQ-STYLE-001, REQ-STYLE-007]
   */
  regional?: RegionalSettings;

  // Deep style fingerprinting (Phase 1 enhancement)
  /**
   * CARS model rhetorical move patterns
   * Optional - only present when deep analysis is performed
   */
  rhetoricalMoves?: RhetoricalMovePatterns;
  /**
   * Citation integration style analysis
   * Optional - only present when deep analysis is performed
   */
  citationIntegration?: CitationIntegrationStyle;
  /**
   * Argument structure patterns
   * Optional - only present when deep analysis is performed
   */
  argumentPatterns?: ArgumentPatterns;
  /**
   * Section, paragraph, and chapter transition patterns
   * Optional - only present when deep analysis is performed
   */
  transitionPatterns?: TransitionPatterns;

  /**
   * Lanham prose analysis metrics (7-axis framework)
   * Optional - present when Lanham enrichment has been performed
   */
  lanhamMetrics?: LanhamProseMetrics;
}

// Academic/formal vocabulary indicators
const ACADEMIC_WORDS = new Set([
  'analysis', 'approach', 'assessment', 'assume', 'authority', 'available',
  'benefit', 'concept', 'consistent', 'constitutional', 'context', 'contract',
  'create', 'data', 'definition', 'derived', 'distribution', 'economic',
  'environment', 'established', 'estimate', 'evidence', 'export', 'factors',
  'financial', 'formula', 'function', 'identified', 'income', 'indicate',
  'individual', 'interpretation', 'involved', 'issues', 'labour', 'legal',
  'legislation', 'major', 'method', 'occur', 'percent', 'period', 'policy',
  'principle', 'procedure', 'process', 'required', 'research', 'response',
  'role', 'section', 'sector', 'significant', 'similar', 'source', 'specific',
  'structure', 'theory', 'variables', 'furthermore', 'moreover', 'therefore',
  'consequently', 'nevertheless', 'notwithstanding', 'methodology', 'paradigm',
  'hypothesis', 'empirical', 'qualitative', 'quantitative', 'correlation',
  'causation', 'phenomenon', 'framework', 'conceptualize', 'synthesize',
  'facilitate', 'implement', 'demonstrate', 'illustrate', 'substantiate'
]);

// Transition words for academic writing
const TRANSITION_WORDS = new Set([
  'however', 'therefore', 'furthermore', 'moreover', 'consequently',
  'nevertheless', 'additionally', 'subsequently', 'alternatively',
  'conversely', 'similarly', 'accordingly', 'hence', 'thus', 'indeed',
  'notably', 'specifically', 'particularly', 'significantly', 'importantly',
  'firstly', 'secondly', 'finally', 'ultimately', 'meanwhile', 'nonetheless'
]);

// Hedging words (tentative language)
const HEDGING_WORDS = new Set([
  'may', 'might', 'could', 'would', 'possibly', 'perhaps', 'probably',
  'likely', 'unlikely', 'appear', 'seem', 'suggest', 'indicate', 'tend',
  'generally', 'typically', 'often', 'sometimes', 'usually', 'relatively',
  'somewhat', 'approximately', 'roughly', 'arguably', 'potentially'
]);

// Passive voice indicators
const PASSIVE_INDICATORS = [
  /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
  /\b(is|are|was|were|been|being)\s+\w+en\b/gi,
];

export class StyleAnalyzer {
  /**
   * Analyze a text sample and extract style characteristics
   */
  analyze(text: string): StyleCharacteristics {
    const sentences = this.extractSentences(text);
    const words = this.extractWords(text);
    const paragraphs = this.extractParagraphs(text);

    return {
      sentences: this.analyzeSentences(sentences),
      vocabulary: this.analyzeVocabulary(words, text),
      structure: this.analyzeStructure(paragraphs, sentences, text),
      tone: this.analyzeTone(words, sentences, text),
      samplePhrases: this.extractCharacteristicPhrases(text),
      commonTransitions: this.extractTransitions(text),
      openingPatterns: this.extractOpeningPatterns(paragraphs),
      citationStyle: this.detectCitationStyle(text),
    };
  }

  /**
   * Merge multiple style analyses into a composite profile
   */
  mergeAnalyses(analyses: StyleCharacteristics[]): StyleCharacteristics {
    if (analyses.length === 0) {
      throw new Error('Cannot merge empty analyses array');
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // Average numeric metrics
    const merged: StyleCharacteristics = {
      sentences: this.averageSentenceMetrics(analyses.map(a => a.sentences)),
      vocabulary: this.averageVocabularyMetrics(analyses.map(a => a.vocabulary)),
      structure: this.averageStructureMetrics(analyses.map(a => a.structure)),
      tone: this.averageToneMetrics(analyses.map(a => a.tone)),
      samplePhrases: this.mergeArrays(analyses.map(a => a.samplePhrases), 20),
      commonTransitions: this.mergeArrays(analyses.map(a => a.commonTransitions), 15),
      openingPatterns: this.mergeArrays(analyses.map(a => a.openingPatterns), 10),
      citationStyle: this.mostCommon(analyses.map(a => a.citationStyle)),
    };

    return merged;
  }

  /**
   * Analyze text and detect regional language variant
   * @param text - Text to analyze
   * @param preferredVariant - Preferred variant or 'auto' for detection
   * @returns StyleCharacteristics with regional settings
   * Implements [REQ-STYLE-001, REQ-STYLE-006]
   */
  analyzeWithRegional(text: string, preferredVariant: 'en-US' | 'en-GB' | 'auto' = 'auto'): StyleCharacteristics {
    const baseAnalysis = this.analyze(text);

    const transformer = new SpellingTransformer('en-GB');
    const detection = transformer.detectVariant(text);

    let languageVariant: 'en-US' | 'en-GB' | 'auto';
    let confidence: number | undefined;
    let effectiveVariant: 'en-US' | 'en-GB';

    if (preferredVariant !== 'auto') {
      languageVariant = preferredVariant;
      effectiveVariant = preferredVariant;
    } else {
      languageVariant = detection.variant === 'mixed' ? 'en-US' : detection.variant;
      effectiveVariant = detection.variant === 'mixed' ? 'en-US' : detection.variant;
      confidence = detection.confidence;
    }

    const regional: RegionalSettings = {
      languageVariant,
      spellingRules: SpellingTransformer.getSpellingRules(effectiveVariant),
      grammarRules: GrammarTransformer.getGrammarRules(effectiveVariant),
      dateFormat: effectiveVariant === 'en-GB' ? 'DD/MM/YYYY' : 'MM/DD/YYYY',
      primaryQuoteMark: effectiveVariant === 'en-GB' ? "'" : '"',
      detectedConfidence: confidence,
    };

    return {
      ...baseAnalysis,
      regional,
    };
  }

  /**
   * Perform deep style analysis including rhetorical, citation, argument, and transition patterns
   * @param text - Text to analyze
   * @param preferredVariant - Preferred language variant or 'auto' for detection
   * @returns StyleCharacteristics with all deep patterns
   */
  async analyzeDeep(
    text: string,
    preferredVariant: 'en-US' | 'en-GB' | 'auto' = 'auto',
    options?: { lanhamMode?: 'auto' | 'on' | 'off'; lanhamTier?: 'heuristic' | 'advanced' },
  ): Promise<StyleCharacteristics> {
    // Start with regional analysis
    const baseAnalysis = this.analyzeWithRegional(text, preferredVariant);

    // Dynamically import deep style extractors to avoid circular dependencies
    let result: StyleCharacteristics;
    try {
      const { DeepStyleAnalyzer } = await import('../cli/style/deep-style-analyzer.js');
      const deepAnalyzer = new DeepStyleAnalyzer();
      const deepCharacteristics = deepAnalyzer.analyzeText(text);

      result = {
        ...baseAnalysis,
        rhetoricalMoves: deepCharacteristics.rhetoricalMoves,
        citationIntegration: deepCharacteristics.citationIntegration,
        argumentPatterns: deepCharacteristics.argumentPatterns,
        transitionPatterns: deepCharacteristics.transitionPatterns,
      };
    } catch (error) {
      // If deep analysis fails, return base analysis
      logger.warn('Deep style analysis failed, using base analysis', { error: String(error) });
      result = baseAnalysis;
    }

    // Lanham prose analysis (conditionally based on mode)
    const lanhamMode = options?.lanhamMode ?? 'auto';
    const shouldRunLanham = lanhamMode === 'on' ||
      (lanhamMode === 'auto' && this.shouldAutoLanham(text));

    if (shouldRunLanham) {
      try {
        const tier = options?.lanhamTier ?? 'heuristic';
        if (tier === 'advanced') {
          const { AdvancedLanhamAnalyzer } = await import('../cli/style/advanced-lanham-analyzer.js');
          const analyzer = new AdvancedLanhamAnalyzer();
          result.lanhamMetrics = await analyzer.fullAnalysis(text);
        } else {
          const { LanhamProseAnalyzer } = await import('../cli/style/lanham-prose-analyzer.js');
          const analyzer = new LanhamProseAnalyzer();
          result.lanhamMetrics = await analyzer.fullAnalysis(text);
        }
      } catch (error) {
        logger.warn('Lanham prose analysis failed', { error: String(error) });
      }
    }

    return result;
  }

  /**
   * Determine whether to auto-enable Lanham analysis based on text characteristics.
   * Criteria: sufficient length (>500 words) and sentence-driven prose (not note-like).
   */
  private shouldAutoLanham(text: string): boolean {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length < 500) return false;
    const sentences = (text.match(/[.!?]+/g) || []).length;
    const sentenceRatio = sentences / (words.length / 50);
    return sentenceRatio >= 0.5;
  }

  /**
   * Perform deep style analysis on multiple text samples
   * @param texts - Array of text samples
   * @param preferredVariant - Preferred language variant
   * @returns Merged StyleCharacteristics with all deep patterns
   */
  async analyzeDeepMultiple(
    texts: string[],
    preferredVariant: 'en-US' | 'en-GB' | 'auto' = 'auto',
    options?: { lanhamMode?: 'auto' | 'on' | 'off'; lanhamTier?: 'heuristic' | 'advanced' },
  ): Promise<StyleCharacteristics> {
    if (texts.length === 0) {
      throw new Error('No text samples provided for analysis');
    }

    // Analyze each text
    const validTexts = texts.filter(t => t && t.length > 100);
    const analyses = await Promise.all(
      validTexts.map(t => this.analyzeDeep(t, preferredVariant, options))
    );

    if (analyses.length === 0) {
      throw new Error('No valid text samples for analysis');
    }

    const textLengths = validTexts.map(t => t.split(/\s+/).filter(w => w.length > 0).length);

    // Merge analyses
    return this.mergeAnalysesDeep(analyses, textLengths);
  }

  /**
   * Merge analyses including deep patterns
   */
  private mergeAnalysesDeep(analyses: StyleCharacteristics[], textLengths?: number[]): StyleCharacteristics {
    // Start with base merge
    const merged = this.mergeAnalyses(analyses);

    // Merge deep patterns if present
    const rhetoricalMoves = analyses.filter(a => a.rhetoricalMoves).map(a => a.rhetoricalMoves!);
    const citationIntegration = analyses.filter(a => a.citationIntegration).map(a => a.citationIntegration!);
    const argumentPatterns = analyses.filter(a => a.argumentPatterns).map(a => a.argumentPatterns!);
    const transitionPatterns = analyses.filter(a => a.transitionPatterns).map(a => a.transitionPatterns!);

    if (rhetoricalMoves.length > 0 || citationIntegration.length > 0 ||
        argumentPatterns.length > 0 || transitionPatterns.length > 0) {
      // Dynamically merge deep patterns
      merged.rhetoricalMoves = rhetoricalMoves.length > 0 ? this.mergeRhetoricalMoves(rhetoricalMoves) : undefined;
      merged.citationIntegration = citationIntegration.length > 0 ? this.mergeCitationIntegration(citationIntegration) : undefined;
      merged.argumentPatterns = argumentPatterns.length > 0 ? this.mergeArgumentPatterns(argumentPatterns) : undefined;
      merged.transitionPatterns = transitionPatterns.length > 0 ? this.mergeTransitionPatterns(transitionPatterns) : undefined;
    }

    // Merge Lanham metrics if present (length-weighted)
    const lanhamEntries = analyses
      .map((a, i) => a.lanhamMetrics ? { metrics: a.lanhamMetrics, wordCount: textLengths?.[i] ?? 1 } : null)
      .filter((e): e is { metrics: LanhamProseMetrics; wordCount: number } => e !== null);

    if (lanhamEntries.length > 0) {
      merged.lanhamMetrics = StyleAnalyzer.mergeLanhamMetrics(lanhamEntries);
    }

    return merged;
  }

  /**
   * Merge rhetorical move patterns
   */
  private mergeRhetoricalMoves(patterns: RhetoricalMovePatterns[]): RhetoricalMovePatterns {
    if (patterns.length === 1) return patterns[0];

    return {
      establishingTerritory: {
        topicIntroducers: this.mergeArrays(patterns.map(p => p.establishingTerritory.topicIntroducers), 15),
        generalClaimPatterns: this.mergeArrays(patterns.map(p => p.establishingTerritory.generalClaimPatterns), 15),
        fieldPositioning: this.mergeArrays(patterns.map(p => p.establishingTerritory.fieldPositioning), 10),
        confidence: this.avg(patterns.map(p => p.establishingTerritory.confidence)),
      },
      establishingNiche: {
        gapIndicators: this.mergeArrays(patterns.map(p => p.establishingNiche.gapIndicators), 15),
        questionRaisers: this.mergeArrays(patterns.map(p => p.establishingNiche.questionRaisers), 10),
        contrastMarkers: this.mergeArrays(patterns.map(p => p.establishingNiche.contrastMarkers), 10),
        confidence: this.avg(patterns.map(p => p.establishingNiche.confidence)),
      },
      occupyingNiche: {
        purposeStatements: this.mergeArrays(patterns.map(p => p.occupyingNiche.purposeStatements), 15),
        methodPreviews: this.mergeArrays(patterns.map(p => p.occupyingNiche.methodPreviews), 10),
        contributionClaims: this.mergeArrays(patterns.map(p => p.occupyingNiche.contributionClaims), 10),
        confidence: this.avg(patterns.map(p => p.occupyingNiche.confidence)),
      },
      overallConfidence: this.avg(patterns.map(p => p.overallConfidence)),
      segmentsAnalyzed: patterns.reduce((sum, p) => sum + p.segmentsAnalyzed, 0),
    };
  }

  /**
   * Merge citation integration patterns
   */
  private mergeCitationIntegration(styles: CitationIntegrationStyle[]): CitationIntegrationStyle {
    if (styles.length === 1) return styles[0];

    return {
      introductionPatterns: {
        authorProminent: this.mergeArrays(styles.map(s => s.introductionPatterns.authorProminent), 20),
        informationProminent: this.mergeArrays(styles.map(s => s.introductionPatterns.informationProminent), 20),
        quotationIntroducers: this.mergeArrays(styles.map(s => s.introductionPatterns.quotationIntroducers), 15),
        authorProminentRatio: this.avg(styles.map(s => s.introductionPatterns.authorProminentRatio)),
      },
      quotationStyle: {
        embeddedVsBlock: this.mostCommon(styles.map(s => s.quotationStyle.embeddedVsBlock)) as 'embedded' | 'block' | 'mixed',
        avgQuoteLength: this.avg(styles.map(s => s.quotationStyle.avgQuoteLength)),
        quoteSandwichUsage: styles.filter(s => s.quotationStyle.quoteSandwichUsage).length > styles.length / 2,
        postQuoteAnalysisLength: this.avg(styles.map(s => s.quotationStyle.postQuoteAnalysisLength)),
        quoteVerbs: this.mergeArrays(styles.map(s => s.quotationStyle.quoteVerbs), 15),
        confidence: this.avg(styles.map(s => s.quotationStyle.confidence)),
      },
      synthesisPatterns: {
        multiSourceIntegration: this.mergeArrays(styles.map(s => s.synthesisPatterns.multiSourceIntegration), 15),
        contrastivePatterns: this.mergeArrays(styles.map(s => s.synthesisPatterns.contrastivePatterns), 15),
        synthesisRatio: this.avg(styles.map(s => s.synthesisPatterns.synthesisRatio)),
        synthesisConnectors: this.mergeArrays(styles.map(s => s.synthesisPatterns.synthesisConnectors), 15),
        confidence: this.avg(styles.map(s => s.synthesisPatterns.confidence)),
      },
      detectedFormat: this.mostCommon(styles.map(s => s.detectedFormat)) as 'apa' | 'chicago' | 'mla' | 'harvard' | 'ieee' | 'unknown',
      citationsAnalyzed: styles.reduce((sum, s) => sum + s.citationsAnalyzed, 0),
      overallConfidence: this.avg(styles.map(s => s.overallConfidence)),
    };
  }

  /**
   * Merge argument patterns
   */
  private mergeArgumentPatterns(patterns: ArgumentPatterns[]): ArgumentPatterns {
    if (patterns.length === 1) return patterns[0];

    return {
      claimStructure: {
        claimMarkers: this.mergeArrays(patterns.map(p => p.claimStructure.claimMarkers), 20),
        hedgingPatterns: this.mergeArrays(patterns.map(p => p.claimStructure.hedgingPatterns), 20),
        strengthIndicators: this.mergeArrays(patterns.map(p => p.claimStructure.strengthIndicators), 15),
        claimStrength: this.mostCommon(patterns.map(p => p.claimStructure.claimStrength)) as 'strong' | 'moderate' | 'cautious',
        confidence: this.avg(patterns.map(p => p.claimStructure.confidence)),
      },
      evidenceIntegration: {
        evidenceIntroducers: this.mergeArrays(patterns.map(p => p.evidenceIntegration.evidenceIntroducers), 20),
        exampleMarkers: this.mergeArrays(patterns.map(p => p.evidenceIntegration.exampleMarkers), 15),
        dataReferences: this.mergeArrays(patterns.map(p => p.evidenceIntegration.dataReferences), 15),
        evidenceTypes: this.mergeArrays(patterns.map(p => p.evidenceIntegration.evidenceTypes), 10),
        confidence: this.avg(patterns.map(p => p.evidenceIntegration.confidence)),
      },
      warrantConnection: {
        becausePatterns: this.mergeArrays(patterns.map(p => p.warrantConnection.becausePatterns), 15),
        thereforePatterns: this.mergeArrays(patterns.map(p => p.warrantConnection.thereforePatterns), 15),
        implicationMarkers: this.mergeArrays(patterns.map(p => p.warrantConnection.implicationMarkers), 15),
        reasoningConnectors: this.mergeArrays(patterns.map(p => p.warrantConnection.reasoningConnectors), 15),
        confidence: this.avg(patterns.map(p => p.warrantConnection.confidence)),
      },
      counterargument: {
        objectionIntroducers: this.mergeArrays(patterns.map(p => p.counterargument.objectionIntroducers), 15),
        concessionPatterns: this.mergeArrays(patterns.map(p => p.counterargument.concessionPatterns), 15),
        refutationPatterns: this.mergeArrays(patterns.map(p => p.counterargument.refutationPatterns), 15),
        style: this.mostCommon(patterns.map(p => p.counterargument.style)) as 'before_claim' | 'after_claim' | 'integrated',
        frequency: this.mostCommon(patterns.map(p => p.counterargument.frequency)) as 'frequent' | 'occasional' | 'rare',
        confidence: this.avg(patterns.map(p => p.counterargument.confidence)),
      },
      overallConfidence: this.avg(patterns.map(p => p.overallConfidence)),
      argumentBlocksDetected: patterns.reduce((sum, p) => sum + p.argumentBlocksDetected, 0),
    };
  }

  /**
   * Merge transition patterns
   */
  private mergeTransitionPatterns(patterns: TransitionPatterns[]): TransitionPatterns {
    if (patterns.length === 1) return patterns[0];

    return {
      sectionTransitions: {
        openers: this.mergeArrays(patterns.map(p => p.sectionTransitions.openers), 20),
        closers: this.mergeArrays(patterns.map(p => p.sectionTransitions.closers), 20),
        bridgingPhrases: this.mergeArrays(patterns.map(p => p.sectionTransitions.bridgingPhrases), 15),
        avgSectionLength: this.avg(patterns.map(p => p.sectionTransitions.avgSectionLength)),
        confidence: this.avg(patterns.map(p => p.sectionTransitions.confidence)),
      },
      paragraphTransitions: {
        topicSentencePatterns: this.mergeArrays(patterns.map(p => p.paragraphTransitions.topicSentencePatterns), 25),
        connectors: this.mergeArrays(patterns.map(p => p.paragraphTransitions.connectors), 20),
        contrastConnectors: this.mergeArrays(patterns.map(p => p.paragraphTransitions.contrastConnectors), 20),
        sequenceMarkers: this.mergeArrays(patterns.map(p => p.paragraphTransitions.sequenceMarkers), 20),
        causalConnectors: this.mergeArrays(patterns.map(p => p.paragraphTransitions.causalConnectors), 15),
        exampleConnectors: this.mergeArrays(patterns.map(p => p.paragraphTransitions.exampleConnectors), 15),
        avgParagraphLength: this.avg(patterns.map(p => p.paragraphTransitions.avgParagraphLength)),
        confidence: this.avg(patterns.map(p => p.paragraphTransitions.confidence)),
      },
      chapterTransitions: {
        chapterOpenings: this.mergeArrays(patterns.map(p => p.chapterTransitions.chapterOpenings), 15),
        chapterClosings: this.mergeArrays(patterns.map(p => p.chapterTransitions.chapterClosings), 15),
        previewPhrases: this.mergeArrays(patterns.map(p => p.chapterTransitions.previewPhrases), 15),
        reviewPhrases: this.mergeArrays(patterns.map(p => p.chapterTransitions.reviewPhrases), 15),
        crossReferences: this.mergeArrays(patterns.map(p => p.chapterTransitions.crossReferences), 15),
        confidence: this.avg(patterns.map(p => p.chapterTransitions.confidence)),
      },
      overallConfidence: this.avg(patterns.map(p => p.overallConfidence)),
      transitionsDetected: patterns.reduce((sum, p) => sum + p.transitionsDetected, 0),
    };
  }

  /**
   * Generate a style prompt from characteristics
   * Implements [REQ-STYLE-005]
   */
  generateStylePrompt(style: StyleCharacteristics): string {
    const parts: string[] = [];

    // Sentence structure guidance
    parts.push(`Sentence Structure:`);
    parts.push(`- Average sentence length: ${Math.round(style.sentences.averageLength)} words`);
    parts.push(`- Mix sentence lengths: ${Math.round(style.sentences.shortSentenceRatio * 100)}% short, ${Math.round(style.sentences.mediumSentenceRatio * 100)}% medium, ${Math.round(style.sentences.longSentenceRatio * 100)}% long`);
    if (style.sentences.complexSentenceRatio > 0.3) {
      parts.push(`- Use complex sentences with semicolons and multiple clauses`);
    }

    // Vocabulary guidance
    parts.push(`\nVocabulary:`);
    parts.push(`- Formality: ${style.tone.formalityScore > 0.7 ? 'highly formal' : style.tone.formalityScore > 0.4 ? 'moderately formal' : 'conversational'}`);
    if (style.vocabulary.academicWordRatio > 0.1) {
      parts.push(`- Use academic vocabulary naturally`);
    }
    if (style.vocabulary.contractionUsage < 0.01) {
      parts.push(`- Avoid contractions`);
    }

    // Tone guidance
    parts.push(`\nTone:`);
    parts.push(`- Objectivity: ${style.tone.objectivityScore > 0.7 ? 'highly objective, third-person' : 'balanced perspective'}`);
    if (style.tone.hedgingFrequency > 0.02) {
      parts.push(`- Use hedging language appropriately (may, might, suggests, appears)`);
    }
    if (style.structure.passiveVoiceRatio > 0.2) {
      parts.push(`- Use passive voice where appropriate for objectivity`);
    }

    // Transitions
    if (style.commonTransitions.length > 0) {
      parts.push(`\nTransition words to use: ${style.commonTransitions.slice(0, 10).join(', ')}`);
    }

    // Sample phrases
    if (style.samplePhrases.length > 0) {
      parts.push(`\nCharacteristic phrases to emulate:\n${style.samplePhrases.slice(0, 5).map(p => `- "${p}"`).join('\n')}`);
    }

    // Regional language settings
    // Implements [REQ-STYLE-001, REQ-STYLE-007]
    if (style.regional) {
      parts.push(`\nRegional Language Settings:`);

      const variant = style.regional.languageVariant;
      if (variant === 'en-GB' || (variant === 'auto' && style.regional.primaryQuoteMark === "'")) {
        parts.push(`- Use British English spelling conventions`);
        parts.push(`- Examples: colour, organisation, analyse, centre, behaviour`);
        parts.push(`- Use British English grammar conventions:`);
        parts.push(`  - Past participles: got (not gotten), learnt (not learned), burnt (not burned)`);
        parts.push(`  - Prepositions: different from (not different than), towards (not toward)`);
        parts.push(`  - Collective nouns may take plural verbs: "The team are" (context-dependent)`);
        parts.push(`- Date format: ${style.regional.dateFormat}`);
        parts.push(`- Use ${style.regional.primaryQuoteMark === "'" ? 'single' : 'double'} quotation marks as primary`);
      } else if (variant === 'en-US' || (variant === 'auto' && style.regional.primaryQuoteMark === '"')) {
        parts.push(`- Use American English spelling conventions`);
        parts.push(`- Examples: color, organization, analyze, center, behavior`);
        parts.push(`- Use American English grammar conventions:`);
        parts.push(`  - Past participles: gotten, learned, burned`);
        parts.push(`  - Prepositions: different than, toward`);
        parts.push(`  - Collective nouns take singular verbs: "The team is"`);
        parts.push(`- Date format: ${style.regional.dateFormat}`);
        parts.push(`- Use ${style.regional.primaryQuoteMark === '"' ? 'double' : 'single'} quotation marks as primary`);
      }

      if (style.regional.detectedConfidence !== undefined) {
        parts.push(`- Language variant confidence: ${Math.round(style.regional.detectedConfidence * 100)}%`);
      }
    }

    // Deep style fingerprinting (Phase 1 enhancement)
    // Only include if deep analysis was performed
    if (style.rhetoricalMoves || style.citationIntegration || style.argumentPatterns || style.transitionPatterns) {
      parts.push('\n## DEEP STYLE PATTERNS');

      // Rhetorical Moves (CARS Model)
      if (style.rhetoricalMoves && style.rhetoricalMoves.overallConfidence > 0.2) {
        parts.push('\nRhetorical Move Patterns (CARS Model):');

        if (style.rhetoricalMoves.establishingTerritory.confidence > 0.3) {
          const territory = style.rhetoricalMoves.establishingTerritory;
          if (territory.topicIntroducers.length > 0) {
            parts.push(`  - Topic introducers: ${territory.topicIntroducers.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
          }
          if (territory.generalClaimPatterns.length > 0) {
            parts.push(`  - General claims: ${territory.generalClaimPatterns.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
          }
        }

        if (style.rhetoricalMoves.establishingNiche.confidence > 0.3) {
          const niche = style.rhetoricalMoves.establishingNiche;
          if (niche.gapIndicators.length > 0) {
            parts.push(`  - Gap indicators: ${niche.gapIndicators.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
          }
        }

        if (style.rhetoricalMoves.occupyingNiche.confidence > 0.3) {
          const occupy = style.rhetoricalMoves.occupyingNiche;
          if (occupy.purposeStatements.length > 0) {
            parts.push(`  - Purpose statements: ${occupy.purposeStatements.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
          }
        }
      }

      // Citation Integration
      if (style.citationIntegration && style.citationIntegration.overallConfidence > 0.2) {
        parts.push('\nCitation Integration Style:');
        const citation = style.citationIntegration;

        if (citation.detectedFormat !== 'unknown') {
          parts.push(`  - Citation format: ${citation.detectedFormat.toUpperCase()}`);
        }

        const ratio = citation.introductionPatterns.authorProminentRatio;
        if (ratio > 0.6) {
          parts.push('  - Preference: Author-prominent citations (e.g., "Smith (2020) argues...")');
        } else if (ratio < 0.4) {
          parts.push('  - Preference: Information-prominent citations (cite at end)');
        } else {
          parts.push('  - Mixed citation integration style');
        }

        if (citation.quotationStyle.quoteSandwichUsage) {
          parts.push('  - Uses quote sandwich pattern (intro -> quote -> analysis)');
        }

        if (citation.synthesisPatterns.synthesisRatio > 0.3) {
          parts.push('  - Frequently synthesizes multiple sources together');
        }
      }

      // Argument Patterns
      if (style.argumentPatterns && style.argumentPatterns.overallConfidence > 0.2) {
        parts.push('\nArgument Structure:');
        const args = style.argumentPatterns;

        parts.push(`  - Claim strength: ${args.claimStructure.claimStrength}`);

        if (args.claimStructure.hedgingPatterns.length > 0 && args.claimStructure.claimStrength !== 'strong') {
          parts.push(`  - Hedging: ${args.claimStructure.hedgingPatterns.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
        }

        if (args.evidenceIntegration.evidenceIntroducers.length > 0) {
          parts.push(`  - Evidence phrases: ${args.evidenceIntegration.evidenceIntroducers.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
        }

        if (args.counterargument.frequency !== 'rare') {
          parts.push(`  - Counterargument handling: ${args.counterargument.frequency}, ${args.counterargument.style.replace('_', ' ')}`);
        }
      }

      // Transition Patterns
      if (style.transitionPatterns && style.transitionPatterns.overallConfidence > 0.2) {
        parts.push('\nTransition Patterns:');
        const trans = style.transitionPatterns;

        if (trans.paragraphTransitions.connectors.length > 0) {
          parts.push(`  - Additive: ${trans.paragraphTransitions.connectors.slice(0, 4).join(', ')}`);
        }
        if (trans.paragraphTransitions.contrastConnectors.length > 0) {
          parts.push(`  - Contrastive: ${trans.paragraphTransitions.contrastConnectors.slice(0, 4).join(', ')}`);
        }
        if (trans.sectionTransitions.openers.length > 0) {
          parts.push(`  - Section openers: ${trans.sectionTransitions.openers.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
        }
        if (trans.chapterTransitions.previewPhrases.length > 0) {
          parts.push(`  - Chapter previews: ${trans.chapterTransitions.previewPhrases.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
        }
      }
    }

    // Lanham prose dimensions (descriptive only — prescriptive block is in gold-standard-prompt-builder)
    if (style.lanhamMetrics) {
      const lm = style.lanhamMetrics;
      parts.push('\n## PROSE STYLE DIMENSIONS (Lanham Framework)');
      parts.push(`- Noun/Verb: ${lm.labels.nounVerb} — ${lm.explanations.nounVerb}`);
      parts.push(`- Architecture: ${lm.labels.periodicRunning} — ${lm.explanations.periodicRunning}`);
      parts.push(`- Connection: ${lm.labels.parataxisHypotaxis} — ${lm.explanations.parataxisHypotaxis}`);
      parts.push(`- Voice: ${lm.labels.voice} — ${lm.explanations.voice}`);
      parts.push(`- Register: ${lm.labels.primaryRegister}${lm.labels.registerMixed ? ' (mixed)' : ''} — ${lm.explanations.register}`);
      parts.push(`- Opacity: ${lm.labels.opacity} — ${lm.explanations.opacity}`);
      if (lm.explanations.tacitPatterns) parts.push(`- Tacit patterns: ${lm.explanations.tacitPatterns}`);
    }

    return parts.join('\n');
  }

  /**
   * Length-weighted merge of multiple LanhamProseMetrics samples.
   * Used when building a composite profile from multiple text samples.
   */
  static mergeLanhamMetrics(samples: { metrics: LanhamProseMetrics; wordCount: number }[]): LanhamProseMetrics {
    if (samples.length === 0) throw new Error('No samples to merge');
    if (samples.length === 1) return samples[0].metrics;

    const totalWords = samples.reduce((sum, s) => sum + s.wordCount, 0);
    const w = (s: { wordCount: number }) => s.wordCount / totalWords;

    const merged: LanhamProseMetrics = JSON.parse(JSON.stringify(samples[0].metrics));

    // Weighted average of continuous fields
    const numericFields: (keyof LanhamProseMetrics)[] = [
      'nounVerbRatio', 'nominalizationDensity', 'prepositionalPhraseDensity', 'beVerbRatio',
      'parataxisHypotaxisRatio', 'coordinatingConjunctionDensity', 'subordinatingConjunctionDensity',
      'periodicRunningRatio', 'preMainVerbClauseCount', 'voiceScore', 'dynamicRange',
      'latinateGermanicRatio', 'registerMarkednessScore', 'opacityScore', 'selfConsciousnessScore',
    ];
    for (const field of numericFields) {
      let acc = 0;
      for (const s of samples) acc += (s.metrics[field] as number) * w(s);
      (merged as unknown as Record<string, unknown>)[field] = acc;
    }

    // Weighted average of tacit pattern counts
    const tacitFields = Object.keys(merged.tacitPatterns) as (keyof LanhamProseMetrics['tacitPatterns'])[];
    for (const tf of tacitFields) {
      let acc = 0;
      for (const s of samples) acc += s.metrics.tacitPatterns[tf] * w(s);
      merged.tacitPatterns[tf] = acc;
    }

    // Labels and explanations from the heaviest sample (most representative)
    const heaviest = samples.reduce((a, b) => a.wordCount > b.wordCount ? a : b);
    merged.labels = heaviest.metrics.labels;
    merged.explanations = heaviest.metrics.explanations;
    merged.analysisDepth = 'heuristic';
    merged.confidenceByAxis = heaviest.metrics.confidenceByAxis;

    return merged;
  }

  // Private helper methods

  private extractSentences(text: string): string[] {
    // Split on sentence boundaries, handling abbreviations
    return text
      .replace(/([.!?])\s+/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.split(/\s+/).length > 2);
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private extractParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
  }

  private analyzeSentences(sentences: string[]): SentenceMetrics {
    if (sentences.length === 0) {
      return {
        averageLength: 15,
        lengthVariance: 5,
        shortSentenceRatio: 0.33,
        mediumSentenceRatio: 0.34,
        longSentenceRatio: 0.33,
        complexSentenceRatio: 0.2,
      };
    }

    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = Math.sqrt(
      lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length
    );

    const shortCount = lengths.filter(l => l < 10).length;
    const mediumCount = lengths.filter(l => l >= 10 && l <= 25).length;
    const longCount = lengths.filter(l => l > 25).length;

    const complexCount = sentences.filter(s =>
      s.includes(';') || s.includes(':') || (s.match(/,/g) || []).length >= 3
    ).length;

    return {
      averageLength: avgLength,
      lengthVariance: variance,
      shortSentenceRatio: shortCount / sentences.length,
      mediumSentenceRatio: mediumCount / sentences.length,
      longSentenceRatio: longCount / sentences.length,
      complexSentenceRatio: complexCount / sentences.length,
    };
  }

  private analyzeVocabulary(words: string[], text: string): VocabularyMetrics {
    if (words.length === 0) {
      return {
        uniqueWordRatio: 0.5,
        averageWordLength: 5,
        academicWordRatio: 0.1,
        technicalTermDensity: 0.05,
        latinateWordRatio: 0.2,
        contractionUsage: 0,
      };
    }

    const uniqueWords = new Set(words);
    const academicWords = words.filter(w => ACADEMIC_WORDS.has(w));
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

    // Count contractions
    const contractions = (text.match(/\b\w+'\w+\b/g) || []).length;

    // Estimate latinate words (longer words, certain suffixes)
    const latinateSuffixes = ['tion', 'sion', 'ment', 'ity', 'ence', 'ance', 'ous', 'ive'];
    const latinateCount = words.filter(w =>
      latinateSuffixes.some(suffix => w.endsWith(suffix))
    ).length;

    return {
      uniqueWordRatio: uniqueWords.size / words.length,
      averageWordLength: avgWordLength,
      academicWordRatio: academicWords.length / words.length,
      technicalTermDensity: this.estimateTechnicalDensity(words),
      latinateWordRatio: latinateCount / words.length,
      contractionUsage: contractions / words.length,
    };
  }

  private analyzeStructure(paragraphs: string[], sentences: string[], text: string): StructureMetrics {
    const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
    const avgParagraphLength = paragraphLengths.length > 0
      ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length
      : 100;

    const words = text.toLowerCase().split(/\s+/);
    const transitionCount = words.filter(w => TRANSITION_WORDS.has(w)).length;

    // Count passive voice instances
    let passiveCount = 0;
    for (const pattern of PASSIVE_INDICATORS) {
      passiveCount += (text.match(pattern) || []).length;
    }

    // Person usage
    const firstPersonWords = ['i', 'we', 'my', 'our', 'me', 'us'];
    const thirdPersonWords = ['he', 'she', 'they', 'it', 'one', 'the author', 'the study'];

    const firstPersonCount = words.filter(w => firstPersonWords.includes(w)).length;
    const thirdPersonCount = words.filter(w => thirdPersonWords.includes(w)).length;

    // Questions
    const questionCount = (text.match(/\?/g) || []).length;

    // Lists (bullet points, numbered lists)
    const listCount = (text.match(/^[\s]*[-•*\d+\.]/gm) || []).length;

    return {
      paragraphLengthAvg: avgParagraphLength,
      transitionWordDensity: transitionCount / words.length,
      passiveVoiceRatio: passiveCount / sentences.length,
      firstPersonUsage: firstPersonCount / words.length,
      thirdPersonUsage: thirdPersonCount / words.length,
      questionFrequency: questionCount / sentences.length,
      listUsage: listCount / paragraphs.length,
    };
  }

  private analyzeTone(words: string[], sentences: string[], text: string): ToneMetrics {
    // Formality: based on contractions, academic words, sentence complexity
    const contractionRatio = (text.match(/\b\w+'\w+\b/g) || []).length / words.length;
    const academicRatio = words.filter(w => ACADEMIC_WORDS.has(w)).length / words.length;
    const formalityScore = Math.min(1, (1 - contractionRatio * 10) * 0.3 + academicRatio * 3 + 0.3);

    // Objectivity: based on first-person avoidance, hedging, passive voice
    const firstPersonWords = ['i', 'we', 'my', 'our', 'me', 'us'];
    const firstPersonRatio = words.filter(w => firstPersonWords.includes(w)).length / words.length;
    const objectivityScore = Math.min(1, Math.max(0, 1 - firstPersonRatio * 20));

    // Hedging frequency
    const hedgingCount = words.filter(w => HEDGING_WORDS.has(w)).length;
    const hedgingFrequency = hedgingCount / words.length;

    // Assertiveness: inverse of hedging, presence of definitive statements
    const assertiveWords = ['clearly', 'certainly', 'definitely', 'undoubtedly', 'obviously'];
    const assertiveCount = words.filter(w => assertiveWords.includes(w)).length;
    const assertivenessScore = Math.min(1, (assertiveCount / words.length) * 50 + (1 - hedgingFrequency * 10) * 0.5);

    // Emotional tone: exclamation marks, emotional adjectives
    const exclamationCount = (text.match(/!/g) || []).length;
    const emotionalTone = Math.min(1, exclamationCount / sentences.length);

    return {
      formalityScore: Math.max(0, Math.min(1, formalityScore)),
      objectivityScore: Math.max(0, Math.min(1, objectivityScore)),
      hedgingFrequency,
      assertivenessScore: Math.max(0, Math.min(1, assertivenessScore)),
      emotionalTone: Math.max(0, Math.min(1, emotionalTone)),
    };
  }

  private extractCharacteristicPhrases(text: string): string[] {
    // Extract 3-5 word phrases that appear multiple times
    const phrases: Map<string, number> = new Map();
    const words = text.split(/\s+/);

    for (let i = 0; i < words.length - 3; i++) {
      const phrase3 = words.slice(i, i + 3).join(' ').toLowerCase().replace(/[^\w\s]/g, '');
      const phrase4 = words.slice(i, i + 4).join(' ').toLowerCase().replace(/[^\w\s]/g, '');

      if (phrase3.length > 10) {
        phrases.set(phrase3, (phrases.get(phrase3) || 0) + 1);
      }
      if (phrase4.length > 15) {
        phrases.set(phrase4, (phrases.get(phrase4) || 0) + 1);
      }
    }

    // Return phrases that appear at least twice
    return Array.from(phrases.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase);
  }

  private extractTransitions(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const transitionCounts: Map<string, number> = new Map();

    for (const word of words) {
      if (TRANSITION_WORDS.has(word)) {
        transitionCounts.set(word, (transitionCounts.get(word) || 0) + 1);
      }
    }

    return Array.from(transitionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  private extractOpeningPatterns(paragraphs: string[]): string[] {
    const openings: string[] = [];

    for (const para of paragraphs) {
      const firstSentence = para.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 20 && firstSentence.length < 200) {
        // Extract the pattern (first few words)
        const words = firstSentence.trim().split(/\s+/).slice(0, 5);
        if (words.length >= 3) {
          openings.push(words.join(' ').toLowerCase());
        }
      }
    }

    // Count and return most common patterns
    const counts: Map<string, number> = new Map();
    for (const opening of openings) {
      counts.set(opening, (counts.get(opening) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern]) => pattern);
  }

  private detectCitationStyle(text: string): string {
    // APA: (Author, Year)
    if (text.match(/\([A-Z][a-z]+,?\s*\d{4}\)/)) {
      return 'APA';
    }
    // MLA: (Author page)
    if (text.match(/\([A-Z][a-z]+\s+\d+\)/)) {
      return 'MLA';
    }
    // Chicago: footnotes/endnotes with numbers
    if (text.match(/\[\d+\]/) || text.match(/\^\d+/)) {
      return 'Chicago/Numbered';
    }
    // Harvard: similar to APA
    if (text.match(/\([A-Z][a-z]+\s+et\s+al\.?,?\s*\d{4}\)/)) {
      return 'Harvard';
    }
    return 'Unknown';
  }

  private estimateTechnicalDensity(words: string[]): number {
    // Words with numbers, acronyms, or very long words often indicate technical content
    const technicalCount = words.filter(w =>
      /\d/.test(w) ||
      w === w.toUpperCase() && w.length > 2 ||
      w.length > 12
    ).length;
    return technicalCount / words.length;
  }

  private averageSentenceMetrics(metrics: SentenceMetrics[]): SentenceMetrics {
    return {
      averageLength: this.avg(metrics.map(m => m.averageLength)),
      lengthVariance: this.avg(metrics.map(m => m.lengthVariance)),
      shortSentenceRatio: this.avg(metrics.map(m => m.shortSentenceRatio)),
      mediumSentenceRatio: this.avg(metrics.map(m => m.mediumSentenceRatio)),
      longSentenceRatio: this.avg(metrics.map(m => m.longSentenceRatio)),
      complexSentenceRatio: this.avg(metrics.map(m => m.complexSentenceRatio)),
    };
  }

  private averageVocabularyMetrics(metrics: VocabularyMetrics[]): VocabularyMetrics {
    return {
      uniqueWordRatio: this.avg(metrics.map(m => m.uniqueWordRatio)),
      averageWordLength: this.avg(metrics.map(m => m.averageWordLength)),
      academicWordRatio: this.avg(metrics.map(m => m.academicWordRatio)),
      technicalTermDensity: this.avg(metrics.map(m => m.technicalTermDensity)),
      latinateWordRatio: this.avg(metrics.map(m => m.latinateWordRatio)),
      contractionUsage: this.avg(metrics.map(m => m.contractionUsage)),
    };
  }

  private averageStructureMetrics(metrics: StructureMetrics[]): StructureMetrics {
    return {
      paragraphLengthAvg: this.avg(metrics.map(m => m.paragraphLengthAvg)),
      transitionWordDensity: this.avg(metrics.map(m => m.transitionWordDensity)),
      passiveVoiceRatio: this.avg(metrics.map(m => m.passiveVoiceRatio)),
      firstPersonUsage: this.avg(metrics.map(m => m.firstPersonUsage)),
      thirdPersonUsage: this.avg(metrics.map(m => m.thirdPersonUsage)),
      questionFrequency: this.avg(metrics.map(m => m.questionFrequency)),
      listUsage: this.avg(metrics.map(m => m.listUsage)),
    };
  }

  private averageToneMetrics(metrics: ToneMetrics[]): ToneMetrics {
    return {
      formalityScore: this.avg(metrics.map(m => m.formalityScore)),
      objectivityScore: this.avg(metrics.map(m => m.objectivityScore)),
      hedgingFrequency: this.avg(metrics.map(m => m.hedgingFrequency)),
      assertivenessScore: this.avg(metrics.map(m => m.assertivenessScore)),
      emotionalTone: this.avg(metrics.map(m => m.emotionalTone)),
    };
  }

  private avg(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private mergeArrays(arrays: string[][], limit: number): string[] {
    const counts: Map<string, number> = new Map();
    for (const arr of arrays) {
      for (const item of arr) {
        counts.set(item, (counts.get(item) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  private mostCommon(items: string[]): string {
    const counts: Map<string, number> = new Map();
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    let maxCount = 0;
    let mostCommon = items[0];
    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    return mostCommon;
  }
}
