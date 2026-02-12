/**
 * DeepStyleAnalyzer - Integrates all style extractors for comprehensive analysis
 * Combines rhetorical moves, citation integration, argument patterns, and transitions
 */

import { RhetoricalMoveExtractor, type RhetoricalMovePatterns } from './rhetorical-move-extractor.js';
import { CitationIntegrationAnalyzer, type CitationIntegrationStyle } from './citation-integration-analyzer.js';
import { ArgumentPatternExtractor, type ArgumentPatterns } from './argument-pattern-extractor.js';
import { TransitionPatternMapper, type TransitionPatterns } from './transition-pattern-mapper.js';
import { PhenomenologicalMarkerExtractor, type PhenomenologicalMarkerPatterns } from './phenomenological-marker-extractor.js';

/**
 * Comprehensive deep style characteristics combining all extractors
 */
export interface DeepStyleCharacteristics {
  /** CARS model rhetorical patterns */
  rhetoricalMoves: RhetoricalMovePatterns;
  /** Citation integration style */
  citationIntegration: CitationIntegrationStyle;
  /** Argument structure patterns */
  argumentPatterns: ArgumentPatterns;
  /** Transition patterns at all levels */
  transitionPatterns: TransitionPatterns;
  /** Phenomenological discourse patterns (philosophical vocabulary) */
  phenomenologicalMarkers?: PhenomenologicalMarkerPatterns;
  /** Overall confidence in deep analysis (0-1) */
  overallConfidence: number;
  /** Analysis metadata */
  metadata: {
    textLength: number;
    analysisTimestamp: number;
    extractorsUsed: string[];
  };
}

/**
 * Integrated deep style analyzer combining all extraction modules
 */
export class DeepStyleAnalyzer {
  private rhetoricalExtractor: RhetoricalMoveExtractor;
  private citationAnalyzer: CitationIntegrationAnalyzer;
  private argumentExtractor: ArgumentPatternExtractor;
  private transitionMapper: TransitionPatternMapper;
  private phenomenologicalExtractor: PhenomenologicalMarkerExtractor;
  private enablePhenomenological: boolean;

  constructor(options?: { enablePhenomenological?: boolean }) {
    this.rhetoricalExtractor = new RhetoricalMoveExtractor();
    this.citationAnalyzer = new CitationIntegrationAnalyzer();
    this.argumentExtractor = new ArgumentPatternExtractor();
    this.transitionMapper = new TransitionPatternMapper();
    this.phenomenologicalExtractor = new PhenomenologicalMarkerExtractor();
    this.enablePhenomenological = options?.enablePhenomenological ?? true;
  }

  /**
   * Perform deep style analysis on text
   * @param text - Academic text to analyze
   * @returns Comprehensive deep style characteristics
   */
  analyzeText(text: string): DeepStyleCharacteristics {
    const startTime = Date.now();

    // Run all extractors
    const rhetoricalMoves = this.rhetoricalExtractor.extractFromText(text);
    const citationIntegration = this.citationAnalyzer.analyzeText(text);
    const argumentPatterns = this.argumentExtractor.extractFromText(text);
    const transitionPatterns = this.transitionMapper.extractFromText(text);

    // Run phenomenological extractor if enabled
    const phenomenologicalMarkers = this.enablePhenomenological
      ? this.phenomenologicalExtractor.extractFromText(text)
      : undefined;

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      rhetoricalMoves,
      citationIntegration,
      argumentPatterns,
      transitionPatterns,
      phenomenologicalMarkers
    );

    const extractorsUsed = [
      'RhetoricalMoveExtractor',
      'CitationIntegrationAnalyzer',
      'ArgumentPatternExtractor',
      'TransitionPatternMapper',
    ];
    if (this.enablePhenomenological) {
      extractorsUsed.push('PhenomenologicalMarkerExtractor');
    }

    return {
      rhetoricalMoves,
      citationIntegration,
      argumentPatterns,
      transitionPatterns,
      phenomenologicalMarkers,
      overallConfidence,
      metadata: {
        textLength: text.length,
        analysisTimestamp: startTime,
        extractorsUsed,
      },
    };
  }

  /**
   * Analyze multiple text samples and merge results
   * @param texts - Array of text samples
   * @returns Merged deep style characteristics
   */
  analyzeMultiple(texts: string[]): DeepStyleCharacteristics {
    if (texts.length === 0) {
      return this.createEmptyCharacteristics();
    }

    const analyses = texts
      .filter(t => t && t.length > 100)
      .map(t => this.analyzeText(t));

    if (analyses.length === 0) {
      return this.createEmptyCharacteristics();
    }

    return this.mergeAnalyses(analyses);
  }

  /**
   * Analyze chapters and merge with chapter-aware weighting
   * @param chapters - Array of chapter texts
   * @returns Merged deep style characteristics
   */
  analyzeChapters(chapters: string[]): DeepStyleCharacteristics {
    if (chapters.length === 0) {
      return this.createEmptyCharacteristics();
    }

    // Analyze each chapter
    const analyses = chapters
      .filter(ch => ch && ch.length > 100)
      .map(ch => this.analyzeText(ch));

    if (analyses.length === 0) {
      return this.createEmptyCharacteristics();
    }

    // Merge with chapter-specific transition analysis
    const merged = this.mergeAnalyses(analyses);

    // Override transition patterns with multi-chapter analysis for better cross-chapter patterns
    merged.transitionPatterns = this.transitionMapper.extractFromMultipleChapters(chapters);

    return merged;
  }

  /**
   * Merge multiple deep style analyses
   * @param analyses - Array of analyses to merge
   * @returns Merged analysis
   */
  mergeAnalyses(analyses: DeepStyleCharacteristics[]): DeepStyleCharacteristics {
    if (analyses.length === 0) {
      return this.createEmptyCharacteristics();
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // Merge phenomenological markers if any analyses have them
    const phenomenologicalAnalyses = analyses
      .map(a => a.phenomenologicalMarkers)
      .filter((p): p is PhenomenologicalMarkerPatterns => p !== undefined);

    const phenomenologicalMarkers = phenomenologicalAnalyses.length > 0
      ? this.phenomenologicalExtractor.mergePatterns(phenomenologicalAnalyses)
      : undefined;

    const extractorsUsed = [
      'RhetoricalMoveExtractor',
      'CitationIntegrationAnalyzer',
      'ArgumentPatternExtractor',
      'TransitionPatternMapper',
    ];
    if (phenomenologicalMarkers) {
      extractorsUsed.push('PhenomenologicalMarkerExtractor');
    }

    return {
      rhetoricalMoves: this.rhetoricalExtractor.mergePatterns(
        analyses.map(a => a.rhetoricalMoves)
      ),
      citationIntegration: this.citationAnalyzer.mergeStyles(
        analyses.map(a => a.citationIntegration)
      ),
      argumentPatterns: this.argumentExtractor.mergePatterns(
        analyses.map(a => a.argumentPatterns)
      ),
      transitionPatterns: this.transitionMapper.mergePatterns(
        analyses.map(a => a.transitionPatterns)
      ),
      phenomenologicalMarkers,
      overallConfidence: this.average(analyses.map(a => a.overallConfidence)),
      metadata: {
        textLength: analyses.reduce((sum, a) => sum + a.metadata.textLength, 0),
        analysisTimestamp: Date.now(),
        extractorsUsed,
      },
    };
  }

  /**
   * Generate a comprehensive style prompt from deep analysis
   * @param characteristics - Deep style characteristics
   * @returns Formatted prompt string for style injection
   */
  generateStylePrompt(characteristics: DeepStyleCharacteristics): string {
    const parts: string[] = [];

    parts.push('## DEEP STYLE PROFILE');
    parts.push(`Analysis confidence: ${Math.round(characteristics.overallConfidence * 100)}%\n`);

    // Rhetorical patterns
    if (characteristics.rhetoricalMoves.overallConfidence > 0.2) {
      parts.push(this.rhetoricalExtractor.generatePromptSection(characteristics.rhetoricalMoves));
      parts.push('');
    }

    // Citation integration
    if (characteristics.citationIntegration.overallConfidence > 0.2) {
      parts.push(this.citationAnalyzer.generatePromptSection(characteristics.citationIntegration));
      parts.push('');
    }

    // Argument patterns
    if (characteristics.argumentPatterns.overallConfidence > 0.2) {
      parts.push(this.argumentExtractor.generatePromptSection(characteristics.argumentPatterns));
      parts.push('');
    }

    // Transition patterns
    if (characteristics.transitionPatterns.overallConfidence > 0.2) {
      parts.push(this.transitionMapper.generatePromptSection(characteristics.transitionPatterns));
      parts.push('');
    }

    // Phenomenological markers (philosophical vocabulary)
    if (characteristics.phenomenologicalMarkers && characteristics.phenomenologicalMarkers.overallConfidence > 0.2) {
      parts.push(this.phenomenologicalExtractor.generatePromptSection(characteristics.phenomenologicalMarkers));
      parts.push('');
    }

    // Summary guidelines
    parts.push(this.generateSummaryGuidelines(characteristics));

    return parts.join('\n');
  }

  /**
   * Generate a concise summary of style guidelines
   */
  private generateSummaryGuidelines(characteristics: DeepStyleCharacteristics): string {
    const guidelines: string[] = [];

    guidelines.push('Summary Style Guidelines:');

    // Rhetorical approach
    if (characteristics.rhetoricalMoves.overallConfidence > 0.3) {
      guidelines.push('- Follow CARS model for introductions (establish territory, identify niche, state purpose)');
    }

    // Citation style
    if (characteristics.citationIntegration.overallConfidence > 0.3) {
      const ratio = characteristics.citationIntegration.introductionPatterns.authorProminentRatio;
      if (ratio > 0.6) {
        guidelines.push('- Use author-prominent citations to integrate sources');
      } else if (ratio < 0.4) {
        guidelines.push('- Use information-prominent citations (cite at end of claims)');
      } else {
        guidelines.push('- Mix author-prominent and information-prominent citations');
      }

      if (characteristics.citationIntegration.quotationStyle.quoteSandwichUsage) {
        guidelines.push('- Use quote sandwich pattern: introduce, quote, analyze');
      }
    }

    // Argument style
    if (characteristics.argumentPatterns.overallConfidence > 0.3) {
      guidelines.push(`- Claim strength: ${characteristics.argumentPatterns.claimStructure.claimStrength}`);

      if (characteristics.argumentPatterns.counterargument.frequency !== 'rare') {
        guidelines.push(`- Address counterarguments ${characteristics.argumentPatterns.counterargument.frequency}ly`);
      }
    }

    // Transition usage
    if (characteristics.transitionPatterns.overallConfidence > 0.3) {
      guidelines.push('- Use varied transition words to connect ideas');
      if (characteristics.transitionPatterns.chapterTransitions.confidence > 0.3) {
        guidelines.push('- Include chapter previews and reviews for cohesion');
      }
    }

    return guidelines.join('\n');
  }

  // Helper methods

  private calculateOverallConfidence(
    rhetorical: RhetoricalMovePatterns,
    citation: CitationIntegrationStyle,
    argument: ArgumentPatterns,
    transition: TransitionPatterns,
    phenomenological?: PhenomenologicalMarkerPatterns
  ): number {
    // Weighted average based on importance for academic writing
    // When phenomenological is present, redistribute weights
    if (phenomenological && phenomenological.overallConfidence > 0.1) {
      const weights = {
        rhetorical: 0.20,
        citation: 0.20,
        argument: 0.25,
        transition: 0.15,
        phenomenological: 0.20,
      };

      return (
        rhetorical.overallConfidence * weights.rhetorical +
        citation.overallConfidence * weights.citation +
        argument.overallConfidence * weights.argument +
        transition.overallConfidence * weights.transition +
        phenomenological.overallConfidence * weights.phenomenological
      );
    }

    // Standard weights without phenomenological
    const weights = {
      rhetorical: 0.25,
      citation: 0.25,
      argument: 0.30,
      transition: 0.20,
    };

    return (
      rhetorical.overallConfidence * weights.rhetorical +
      citation.overallConfidence * weights.citation +
      argument.overallConfidence * weights.argument +
      transition.overallConfidence * weights.transition
    );
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private createEmptyCharacteristics(): DeepStyleCharacteristics {
    return {
      rhetoricalMoves: {
        establishingTerritory: {
          topicIntroducers: [],
          generalClaimPatterns: [],
          fieldPositioning: [],
          confidence: 0,
        },
        establishingNiche: {
          gapIndicators: [],
          questionRaisers: [],
          contrastMarkers: [],
          confidence: 0,
        },
        occupyingNiche: {
          purposeStatements: [],
          methodPreviews: [],
          contributionClaims: [],
          confidence: 0,
        },
        overallConfidence: 0,
        segmentsAnalyzed: 0,
      },
      citationIntegration: {
        introductionPatterns: {
          authorProminent: [],
          informationProminent: [],
          quotationIntroducers: [],
          authorProminentRatio: 0.5,
        },
        quotationStyle: {
          embeddedVsBlock: 'mixed',
          avgQuoteLength: 0,
          quoteSandwichUsage: false,
          postQuoteAnalysisLength: 0,
          quoteVerbs: [],
          confidence: 0,
        },
        synthesisPatterns: {
          multiSourceIntegration: [],
          contrastivePatterns: [],
          synthesisRatio: 0,
          synthesisConnectors: [],
          confidence: 0,
        },
        detectedFormat: 'unknown',
        citationsAnalyzed: 0,
        overallConfidence: 0,
      },
      argumentPatterns: {
        claimStructure: {
          claimMarkers: [],
          hedgingPatterns: [],
          strengthIndicators: [],
          claimStrength: 'moderate',
          confidence: 0,
        },
        evidenceIntegration: {
          evidenceIntroducers: [],
          exampleMarkers: [],
          dataReferences: [],
          evidenceTypes: [],
          confidence: 0,
        },
        warrantConnection: {
          becausePatterns: [],
          thereforePatterns: [],
          implicationMarkers: [],
          reasoningConnectors: [],
          confidence: 0,
        },
        counterargument: {
          objectionIntroducers: [],
          concessionPatterns: [],
          refutationPatterns: [],
          style: 'integrated',
          frequency: 'rare',
          confidence: 0,
        },
        overallConfidence: 0,
        argumentBlocksDetected: 0,
      },
      transitionPatterns: {
        sectionTransitions: {
          openers: [],
          closers: [],
          bridgingPhrases: [],
          avgSectionLength: 0,
          confidence: 0,
        },
        paragraphTransitions: {
          topicSentencePatterns: [],
          connectors: [],
          contrastConnectors: [],
          sequenceMarkers: [],
          causalConnectors: [],
          exampleConnectors: [],
          avgParagraphLength: 0,
          confidence: 0,
        },
        chapterTransitions: {
          chapterOpenings: [],
          chapterClosings: [],
          previewPhrases: [],
          reviewPhrases: [],
          crossReferences: [],
          confidence: 0,
        },
        overallConfidence: 0,
        transitionsDetected: 0,
      },
      overallConfidence: 0,
      metadata: {
        textLength: 0,
        analysisTimestamp: Date.now(),
        extractorsUsed: [],
      },
    };
  }
}
