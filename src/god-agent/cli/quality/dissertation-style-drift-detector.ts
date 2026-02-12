/**
 * Dissertation Style Drift Detector - PHASE-7-001
 *
 * Analyzes style consistency across all chapters of a dissertation.
 * Detects drift patterns and provides recommendations for maintaining consistency.
 *
 * Part of the PhD Pipeline quality assurance system.
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

/**
 * Style fingerprint for a chapter
 */
export interface ChapterStyleFingerprint {
  chapterId: number;
  chapterTitle?: string;

  // Lexical features
  averageSentenceLength: number;
  vocabularyRichness: number; // Type-token ratio
  formalityScore: number; // 0-1 scale

  // Structural features
  paragraphDensity: number; // Sentences per paragraph
  headingFrequency: number; // Headings per 1000 words
  listUsage: number; // Lists per 1000 words

  // Citation style
  citationDensity: number; // Citations per 1000 words
  citationStyle: 'parenthetical' | 'narrative' | 'mixed';

  // Voice/tone
  activeVoiceRatio: number; // 0-1
  firstPersonUsage: number; // Occurrences per 1000 words

  // Technical density
  technicalTermDensity: number;

  // Raw text stats
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;

  // Timestamp
  analyzedAt: string;
}

/**
 * Similarity comparison between two chapters
 */
export interface ChapterSimilarity {
  chapter1Id: number;
  chapter2Id: number;
  overallSimilarity: number; // 0-1
  featureSimilarities: Record<string, number>; // Per-feature similarity
}

/**
 * Outlier chapter detection
 */
export interface OutlierChapter {
  chapterId: number;
  chapterTitle?: string;
  deviationScore: number; // How much it deviates (0-1, higher = more deviation)
  deviationAreas: string[]; // Which features deviate most
  recommendations: string[]; // How to fix
}

/**
 * Drift trend analysis
 */
export interface DriftTrend {
  direction: 'improving' | 'stable' | 'degrading';
  magnitude: number; // 0-1
  pattern: 'gradual' | 'sudden' | 'oscillating' | 'none';
  description: string;
}

/**
 * Full dissertation drift analysis
 */
export interface DissertationDriftAnalysis {
  analysisId: string;
  analyzedAt: string;
  chapterCount: number;

  // Overall metrics
  overallConsistency: number; // 0-1
  consistencyGrade: 'excellent' | 'good' | 'acceptable' | 'poor';

  // Per-chapter fingerprints
  fingerprints: ChapterStyleFingerprint[];

  // Pairwise similarity matrix
  similarityMatrix: ChapterSimilarity[];

  // Outlier detection
  outlierChapters: OutlierChapter[];

  // Trend analysis
  driftTrend: DriftTrend;

  // Recommendations
  recommendations: string[];
}

/**
 * New chapter drift check result
 */
export interface NewChapterDriftCheck {
  chapterId: number;
  wouldCauseDrift: boolean;
  deviationScore: number;
  similarityToExisting: number; // Average similarity to existing chapters
  deviationAreas: string[];
  recommendations: string[];
}

/**
 * Drift detector event
 */
export interface DriftDetectorEvent {
  type:
    | 'analysis_complete'
    | 'drift_detected'
    | 'outlier_found'
    | 'new_chapter_checked';
  timestamp: string;
  data: Record<string, unknown>;
}

// =============================================================================
// Pattern Constants
// =============================================================================

// Citation patterns
const PARENTHETICAL_CITATION_PATTERN =
  /\([A-Z][a-zA-Z'-]+(?:\s+(?:&|and)\s+[A-Z][a-zA-Z'-]+)*,?\s*\d{4}[a-z]?(?:,\s*p{1,2}\.\s*\d+(?:-\d+)?)?\)/g;
const NARRATIVE_CITATION_PATTERN =
  /[A-Z][a-zA-Z'-]+(?:\s+(?:&|and)\s+[A-Z][a-zA-Z'-]+)*\s+\(\d{4}[a-z]?(?:,\s*p{1,2}\.\s*\d+(?:-\d+)?)?\)/g;

// First person patterns
const FIRST_PERSON_SINGULAR = /\b(I|me|my|mine|myself)\b/gi;
const FIRST_PERSON_PLURAL = /\b(we|us|our|ours|ourselves)\b/gi;

// Passive voice indicators
const PASSIVE_INDICATORS = [
  /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
  /\b(is|are|was|were|been|being)\s+\w+en\b/gi,
  /\b(it\s+(is|was)\s+(shown|found|demonstrated|argued|believed|thought|said|known|suggested|reported|observed|noted|considered))\b/gi,
];

// Informal language patterns (to measure formality)
const INFORMAL_PATTERNS = [
  /\b(gonna|wanna|gotta|kinda|sorta)\b/gi,
  /\b(awesome|cool|stuff|thing|things|guy|guys)\b/gi,
  /\b(basically|literally|actually|really|very|totally|definitely)\b/gi,
  /\b(a\s+lot|lots\s+of|bunch\s+of)\b/gi,
  /\b(ok|okay|alright)\b/gi,
  /\b(etc\.?)\b/gi,
  /\b(don't|won't|can't|isn't|aren't|wasn't|weren't|doesn't|didn't|haven't|hasn't|hadn't)\b/gi,
];

// Formal academic patterns
const FORMAL_PATTERNS = [
  /\b(furthermore|moreover|nevertheless|nonetheless)\b/gi,
  /\b(consequently|subsequently|accordingly)\b/gi,
  /\b(notwithstanding|heretofore|wherein|whereby)\b/gi,
  /\b(it\s+is\s+(argued|contended|posited|hypothesized)\s+that)\b/gi,
  /\b(this\s+(study|research|paper|analysis|investigation))\b/gi,
];

// Technical term patterns (capitalized terms, acronyms, specialized vocabulary)
const TECHNICAL_TERM_PATTERNS = [
  /\b[A-Z]{2,}\b/g, // Acronyms
  /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g, // CamelCase terms
  /\b\w+ology\b/gi, // -ology terms
  /\b\w+ization\b/gi, // -ization terms
  /\b\w+ism\b/gi, // -ism terms
];

// Heading patterns
const HEADING_PATTERNS = [
  /^#+\s+.+$/gm, // Markdown headings
  /^[A-Z][^.!?]*:$/gm, // Title case headings with colon
  /^\d+\.(\d+\.)*\s+.+$/gm, // Numbered sections
];

// List patterns
const LIST_PATTERNS = [
  /^[-*+]\s+.+$/gm, // Unordered lists
  /^\d+\.\s+.+$/gm, // Ordered lists
];

// =============================================================================
// Feature Configuration
// =============================================================================

/**
 * Feature weights for similarity calculation
 */
const FEATURE_WEIGHTS: Record<string, number> = {
  averageSentenceLength: 0.12,
  vocabularyRichness: 0.10,
  formalityScore: 0.15,
  paragraphDensity: 0.08,
  headingFrequency: 0.05,
  listUsage: 0.03,
  citationDensity: 0.10,
  citationStyle: 0.08,
  activeVoiceRatio: 0.12,
  firstPersonUsage: 0.07,
  technicalTermDensity: 0.10,
};

/**
 * Feature names for readable output
 */
const FEATURE_NAMES: Record<string, string> = {
  averageSentenceLength: 'Sentence Length',
  vocabularyRichness: 'Vocabulary Richness',
  formalityScore: 'Formality',
  paragraphDensity: 'Paragraph Density',
  headingFrequency: 'Heading Frequency',
  listUsage: 'List Usage',
  citationDensity: 'Citation Density',
  citationStyle: 'Citation Style',
  activeVoiceRatio: 'Active Voice',
  firstPersonUsage: 'First Person Usage',
  technicalTermDensity: 'Technical Terminology',
};

// =============================================================================
// DissertationStyleDriftDetector Class
// =============================================================================

/**
 * Analyzes style consistency across all chapters of a dissertation.
 * Detects drift patterns and provides recommendations for maintaining consistency.
 */
export class DissertationStyleDriftDetector extends EventEmitter {
  private readonly deviationThreshold: number;
  private readonly alertThreshold: number;

  /**
   * Create a new drift detector
   * @param config - Optional configuration
   */
  constructor(config?: { deviationThreshold?: number; alertThreshold?: number }) {
    super();
    this.deviationThreshold = config?.deviationThreshold ?? 0.3;
    this.alertThreshold = config?.alertThreshold ?? 0.4;
  }

  /**
   * Generate style fingerprint for a chapter
   */
  generateFingerprint(
    chapterId: number,
    chapterText: string,
    title?: string
  ): ChapterStyleFingerprint {
    // Extract basic text elements
    const paragraphs = this.extractParagraphs(chapterText);
    const sentences = this.extractSentences(chapterText);
    const words = this.extractWords(chapterText);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));

    // Calculate word count
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;

    // Lexical features
    const averageSentenceLength = this.calculateAverageSentenceLength(sentences);
    const vocabularyRichness = wordCount > 0 ? uniqueWords.size / wordCount : 0;
    const formalityScore = this.calculateFormalityScore(chapterText);

    // Structural features
    const paragraphDensity = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;
    const headingFrequency = this.calculateHeadingFrequency(chapterText, wordCount);
    const listUsage = this.calculateListUsage(chapterText, wordCount);

    // Citation style
    const { citationDensity, citationStyle } = this.analyzeCitations(
      chapterText,
      wordCount
    );

    // Voice/tone
    const activeVoiceRatio = this.calculateActiveVoiceRatio(sentences);
    const firstPersonUsage = this.calculateFirstPersonUsage(chapterText, wordCount);

    // Technical density
    const technicalTermDensity = this.calculateTechnicalTermDensity(
      chapterText,
      wordCount
    );

    return {
      chapterId,
      chapterTitle: title,
      averageSentenceLength,
      vocabularyRichness,
      formalityScore,
      paragraphDensity,
      headingFrequency,
      listUsage,
      citationDensity,
      citationStyle,
      activeVoiceRatio,
      firstPersonUsage,
      technicalTermDensity,
      wordCount,
      sentenceCount,
      paragraphCount,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate similarity between two fingerprints
   */
  calculateSimilarity(
    fp1: ChapterStyleFingerprint,
    fp2: ChapterStyleFingerprint
  ): ChapterSimilarity {
    const featureSimilarities: Record<string, number> = {};
    let weightedSum = 0;
    let totalWeight = 0;

    // Calculate similarity for each numeric feature
    const numericFeatures: Array<keyof ChapterStyleFingerprint> = [
      'averageSentenceLength',
      'vocabularyRichness',
      'formalityScore',
      'paragraphDensity',
      'headingFrequency',
      'listUsage',
      'citationDensity',
      'activeVoiceRatio',
      'firstPersonUsage',
      'technicalTermDensity',
    ];

    for (const feature of numericFeatures) {
      const v1 = fp1[feature] as number;
      const v2 = fp2[feature] as number;
      const similarity = this.calculateFeatureSimilarity(feature, v1, v2);
      featureSimilarities[feature] = similarity;

      const weight = FEATURE_WEIGHTS[feature] ?? 0.1;
      weightedSum += similarity * weight;
      totalWeight += weight;
    }

    // Calculate citation style similarity (categorical)
    const citationStyleSimilarity =
      fp1.citationStyle === fp2.citationStyle
        ? 1.0
        : fp1.citationStyle === 'mixed' || fp2.citationStyle === 'mixed'
          ? 0.5
          : 0.0;
    featureSimilarities['citationStyle'] = citationStyleSimilarity;
    weightedSum += citationStyleSimilarity * FEATURE_WEIGHTS['citationStyle'];
    totalWeight += FEATURE_WEIGHTS['citationStyle'];

    const overallSimilarity = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      chapter1Id: fp1.chapterId,
      chapter2Id: fp2.chapterId,
      overallSimilarity,
      featureSimilarities,
    };
  }

  /**
   * Analyze style consistency across all chapters
   */
  analyzeAll(
    chapters: Map<number, string>,
    titles?: Map<number, string>
  ): DissertationDriftAnalysis {
    const analysisId = this.generateAnalysisId();
    const analyzedAt = new Date().toISOString();
    const chapterIds = Array.from(chapters.keys()).sort((a, b) => a - b);
    const chapterCount = chapterIds.length;

    // Generate fingerprints for all chapters
    const fingerprints: ChapterStyleFingerprint[] = chapterIds.map((id) =>
      this.generateFingerprint(id, chapters.get(id)!, titles?.get(id))
    );

    // Calculate pairwise similarity matrix
    const similarityMatrix: ChapterSimilarity[] = [];
    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        similarityMatrix.push(
          this.calculateSimilarity(fingerprints[i], fingerprints[j])
        );
      }
    }

    // Calculate overall consistency (average of all pairwise similarities)
    const overallConsistency =
      similarityMatrix.length > 0
        ? similarityMatrix.reduce((sum, s) => sum + s.overallSimilarity, 0) /
          similarityMatrix.length
        : 1.0;

    const consistencyGrade = this.getConsistencyGrade(overallConsistency);

    // Detect outlier chapters
    const outlierChapters = this.detectOutliers(fingerprints, similarityMatrix);

    // Analyze drift trend
    const driftTrend = this.analyzeDriftTrend(similarityMatrix, chapterCount);

    // Generate recommendations
    const analysis: DissertationDriftAnalysis = {
      analysisId,
      analyzedAt,
      chapterCount,
      overallConsistency,
      consistencyGrade,
      fingerprints,
      similarityMatrix,
      outlierChapters,
      driftTrend,
      recommendations: [],
    };

    analysis.recommendations = this.generateRecommendations(analysis);

    // Emit events
    this.emitEvent('analysis_complete', {
      analysisId,
      chapterCount,
      overallConsistency,
      consistencyGrade,
    });

    if (outlierChapters.length > 0) {
      for (const outlier of outlierChapters) {
        this.emitEvent('outlier_found', {
          chapterId: outlier.chapterId,
          deviationScore: outlier.deviationScore,
          deviationAreas: outlier.deviationAreas,
        });
      }
    }

    if (driftTrend.direction === 'degrading' && driftTrend.magnitude > 0.2) {
      this.emitEvent('drift_detected', {
        direction: driftTrend.direction,
        magnitude: driftTrend.magnitude,
        pattern: driftTrend.pattern,
      });
    }

    return analysis;
  }

  /**
   * Check if a new chapter would cause drift
   */
  checkNewChapter(
    existingChapters: Map<number, string>,
    newChapter: { id: number; text: string; title?: string }
  ): NewChapterDriftCheck {
    // Generate fingerprint for new chapter
    const newFingerprint = this.generateFingerprint(
      newChapter.id,
      newChapter.text,
      newChapter.title
    );

    // Generate fingerprints for existing chapters
    const existingFingerprints: ChapterStyleFingerprint[] = [];
    for (const [id, text] of existingChapters) {
      existingFingerprints.push(this.generateFingerprint(id, text));
    }

    if (existingFingerprints.length === 0) {
      // No existing chapters, no drift possible
      return {
        chapterId: newChapter.id,
        wouldCauseDrift: false,
        deviationScore: 0,
        similarityToExisting: 1.0,
        deviationAreas: [],
        recommendations: [],
      };
    }

    // Calculate similarities to all existing chapters
    const similarities = existingFingerprints.map((fp) =>
      this.calculateSimilarity(newFingerprint, fp)
    );

    const averageSimilarity =
      similarities.reduce((sum, s) => sum + s.overallSimilarity, 0) /
      similarities.length;

    const deviationScore = 1 - averageSimilarity;

    // Identify deviation areas (features where similarity is low)
    const deviationAreas = this.identifyDeviationAreas(
      newFingerprint,
      existingFingerprints
    );

    const wouldCauseDrift = deviationScore > this.alertThreshold;

    // Generate recommendations
    const recommendations: string[] = [];
    if (wouldCauseDrift) {
      for (const area of deviationAreas.slice(0, 3)) {
        recommendations.push(
          this.generateFeatureRecommendation(area, newFingerprint, existingFingerprints)
        );
      }
    }

    const result: NewChapterDriftCheck = {
      chapterId: newChapter.id,
      wouldCauseDrift,
      deviationScore,
      similarityToExisting: averageSimilarity,
      deviationAreas,
      recommendations,
    };

    // Emit event
    this.emitEvent('new_chapter_checked', {
      chapterId: newChapter.id,
      wouldCauseDrift,
      deviationScore,
      deviationAreas,
    });

    return result;
  }

  /**
   * Get consistency grade from score
   */
  getConsistencyGrade(score: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (score >= 0.85) return 'excellent';
    if (score >= 0.70) return 'good';
    if (score >= 0.55) return 'acceptable';
    return 'poor';
  }

  /**
   * Detect outlier chapters
   */
  detectOutliers(
    fingerprints: ChapterStyleFingerprint[],
    similarities: ChapterSimilarity[]
  ): OutlierChapter[] {
    if (fingerprints.length < 2) return [];

    const outliers: OutlierChapter[] = [];

    // Calculate average similarity for each chapter to all others
    const chapterAvgSimilarities = new Map<number, number>();
    const chapterSimilarityDetails = new Map<number, ChapterSimilarity[]>();

    for (const fp of fingerprints) {
      const relevantSimilarities = similarities.filter(
        (s) => s.chapter1Id === fp.chapterId || s.chapter2Id === fp.chapterId
      );
      chapterSimilarityDetails.set(fp.chapterId, relevantSimilarities);

      if (relevantSimilarities.length > 0) {
        const avg =
          relevantSimilarities.reduce((sum, s) => sum + s.overallSimilarity, 0) /
          relevantSimilarities.length;
        chapterAvgSimilarities.set(fp.chapterId, avg);
      } else {
        chapterAvgSimilarities.set(fp.chapterId, 1.0);
      }
    }

    // Calculate overall average and standard deviation
    const avgValues = Array.from(chapterAvgSimilarities.values());
    const overallAvg = avgValues.reduce((a, b) => a + b, 0) / avgValues.length;
    const variance =
      avgValues.reduce((sum, v) => sum + Math.pow(v - overallAvg, 2), 0) /
      avgValues.length;
    const stdDev = Math.sqrt(variance);

    // Flag chapters that are more than 1 standard deviation below average
    // or below the deviation threshold
    for (const fp of fingerprints) {
      const avgSimilarity = chapterAvgSimilarities.get(fp.chapterId) ?? 1.0;
      const deviationScore = 1 - avgSimilarity;

      const isOutlier =
        deviationScore > this.deviationThreshold ||
        (stdDev > 0 && avgSimilarity < overallAvg - stdDev);

      if (isOutlier) {
        // Identify which features deviate most
        const deviationAreas = this.identifyDeviationAreasFromSimilarities(
          fp.chapterId,
          chapterSimilarityDetails.get(fp.chapterId) ?? []
        );

        // Generate recommendations
        const recommendations = this.generateOutlierRecommendations(
          fp,
          fingerprints.filter((f) => f.chapterId !== fp.chapterId),
          deviationAreas
        );

        outliers.push({
          chapterId: fp.chapterId,
          chapterTitle: fp.chapterTitle,
          deviationScore,
          deviationAreas,
          recommendations,
        });
      }
    }

    return outliers.sort((a, b) => b.deviationScore - a.deviationScore);
  }

  /**
   * Analyze drift trend across chapter sequence
   */
  analyzeDriftTrend(
    similarities: ChapterSimilarity[],
    chapterCount: number
  ): DriftTrend {
    if (chapterCount < 3 || similarities.length < 2) {
      return {
        direction: 'stable',
        magnitude: 0,
        pattern: 'none',
        description: 'Not enough chapters to analyze drift trend.',
      };
    }

    // Calculate sequential similarities (chapter n to chapter n+1)
    const sequentialSimilarities: number[] = [];
    for (let i = 1; i < chapterCount; i++) {
      const sim = similarities.find(
        (s) =>
          (s.chapter1Id === i && s.chapter2Id === i + 1) ||
          (s.chapter1Id === i + 1 && s.chapter2Id === i)
      );
      if (sim) {
        sequentialSimilarities.push(sim.overallSimilarity);
      }
    }

    if (sequentialSimilarities.length < 2) {
      return {
        direction: 'stable',
        magnitude: 0,
        pattern: 'none',
        description: 'Insufficient sequential similarity data for trend analysis.',
      };
    }

    // Analyze trend
    const trend = this.calculateTrend(sequentialSimilarities);
    const oscillation = this.calculateOscillation(sequentialSimilarities);
    const magnitude = Math.abs(trend);

    // Determine pattern
    let pattern: 'gradual' | 'sudden' | 'oscillating' | 'none';
    if (oscillation > 0.15) {
      pattern = 'oscillating';
    } else if (magnitude > 0.1) {
      // Check for sudden changes
      const maxChange = this.calculateMaxChange(sequentialSimilarities);
      pattern = maxChange > 0.2 ? 'sudden' : 'gradual';
    } else {
      pattern = 'none';
    }

    // Determine direction
    let direction: 'improving' | 'stable' | 'degrading';
    if (trend > 0.05) {
      direction = 'improving';
    } else if (trend < -0.05) {
      direction = 'degrading';
    } else {
      direction = 'stable';
    }

    // Generate description
    const description = this.generateTrendDescription(
      direction,
      pattern,
      magnitude,
      sequentialSimilarities
    );

    return {
      direction,
      magnitude,
      pattern,
      description,
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis: DissertationDriftAnalysis): string[] {
    const recommendations: string[] = [];

    // Overall consistency recommendations
    if (analysis.consistencyGrade === 'poor') {
      recommendations.push(
        'CRITICAL: Overall style consistency is poor. Consider a comprehensive style review of all chapters.'
      );
    } else if (analysis.consistencyGrade === 'acceptable') {
      recommendations.push(
        'Style consistency could be improved. Focus on aligning the outlier chapters identified.'
      );
    }

    // Outlier-specific recommendations
    if (analysis.outlierChapters.length > 0) {
      const outlierIds = analysis.outlierChapters.map((o) => o.chapterId).join(', ');
      recommendations.push(
        `Review chapters ${outlierIds} for style alignment with the rest of the dissertation.`
      );

      // Add top recommendations from outliers
      for (const outlier of analysis.outlierChapters.slice(0, 2)) {
        for (const rec of outlier.recommendations.slice(0, 2)) {
          if (!recommendations.includes(rec)) {
            recommendations.push(rec);
          }
        }
      }
    }

    // Drift trend recommendations
    if (analysis.driftTrend.direction === 'degrading') {
      if (analysis.driftTrend.pattern === 'gradual') {
        recommendations.push(
          'Style consistency has been gradually declining. Review recent chapters for adherence to the established style.'
        );
      } else if (analysis.driftTrend.pattern === 'sudden') {
        recommendations.push(
          'A sudden shift in style was detected. Check if a specific chapter introduced significant style changes.'
        );
      }
    } else if (analysis.driftTrend.pattern === 'oscillating') {
      recommendations.push(
        'Style consistency varies significantly between chapters. Consider establishing and following a style guide.'
      );
    }

    // Feature-specific recommendations based on fingerprint analysis
    if (analysis.fingerprints.length > 1) {
      const avgFeatures = this.calculateAverageFingerprint(analysis.fingerprints);

      // Check for concerning feature averages
      if (avgFeatures.formalityScore < 0.5) {
        recommendations.push(
          'Average formality is lower than expected for academic writing. Consider reducing informal language.'
        );
      }

      if (avgFeatures.citationDensity < 5) {
        recommendations.push(
          'Citation density is relatively low. Ensure claims are adequately supported with references.'
        );
      }

      if (avgFeatures.activeVoiceRatio < 0.3) {
        recommendations.push(
          'Heavy use of passive voice detected. Consider using more active voice for clearer writing.'
        );
      }
    }

    // Limit recommendations
    return recommendations.slice(0, 8);
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Extract paragraphs from text
   */
  private extractParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
  }

  /**
   * Extract words from text
   */
  private extractWords(text: string): string[] {
    return text
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);
  }

  /**
   * Calculate average sentence length
   */
  private calculateAverageSentenceLength(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    return lengths.reduce((a, b) => a + b, 0) / lengths.length;
  }

  /**
   * Calculate formality score (0-1)
   */
  private calculateFormalityScore(text: string): number {
    let informalCount = 0;
    let formalCount = 0;

    for (const pattern of INFORMAL_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) informalCount += matches.length;
    }

    for (const pattern of FORMAL_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) formalCount += matches.length;
    }

    const total = informalCount + formalCount;
    if (total === 0) return 0.7; // Default to moderately formal
    return formalCount / total;
  }

  /**
   * Calculate heading frequency per 1000 words
   */
  private calculateHeadingFrequency(text: string, wordCount: number): number {
    if (wordCount === 0) return 0;
    let headingCount = 0;
    for (const pattern of HEADING_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) headingCount += matches.length;
    }
    return (headingCount / wordCount) * 1000;
  }

  /**
   * Calculate list usage per 1000 words
   */
  private calculateListUsage(text: string, wordCount: number): number {
    if (wordCount === 0) return 0;
    let listCount = 0;
    for (const pattern of LIST_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) listCount += matches.length;
    }
    return (listCount / wordCount) * 1000;
  }

  /**
   * Analyze citation patterns
   */
  private analyzeCitations(
    text: string,
    wordCount: number
  ): {
    citationDensity: number;
    citationStyle: 'parenthetical' | 'narrative' | 'mixed';
  } {
    const parentheticalMatches = text.match(PARENTHETICAL_CITATION_PATTERN) || [];
    const narrativeMatches = text.match(NARRATIVE_CITATION_PATTERN) || [];

    const totalCitations = parentheticalMatches.length + narrativeMatches.length;
    const citationDensity = wordCount > 0 ? (totalCitations / wordCount) * 1000 : 0;

    let citationStyle: 'parenthetical' | 'narrative' | 'mixed';
    if (totalCitations === 0) {
      citationStyle = 'mixed';
    } else {
      const parentheticalRatio = parentheticalMatches.length / totalCitations;
      if (parentheticalRatio > 0.7) {
        citationStyle = 'parenthetical';
      } else if (parentheticalRatio < 0.3) {
        citationStyle = 'narrative';
      } else {
        citationStyle = 'mixed';
      }
    }

    return { citationDensity, citationStyle };
  }

  /**
   * Calculate active voice ratio
   */
  private calculateActiveVoiceRatio(sentences: string[]): number {
    if (sentences.length === 0) return 0.5;

    let passiveCount = 0;
    for (const sentence of sentences) {
      for (const pattern of PASSIVE_INDICATORS) {
        if (pattern.test(sentence)) {
          passiveCount++;
          break;
        }
      }
    }

    return 1 - passiveCount / sentences.length;
  }

  /**
   * Calculate first person usage per 1000 words
   */
  private calculateFirstPersonUsage(text: string, wordCount: number): number {
    if (wordCount === 0) return 0;
    const singularMatches = text.match(FIRST_PERSON_SINGULAR) || [];
    const pluralMatches = text.match(FIRST_PERSON_PLURAL) || [];
    return ((singularMatches.length + pluralMatches.length) / wordCount) * 1000;
  }

  /**
   * Calculate technical term density per 1000 words
   */
  private calculateTechnicalTermDensity(text: string, wordCount: number): number {
    if (wordCount === 0) return 0;
    let technicalCount = 0;
    for (const pattern of TECHNICAL_TERM_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) technicalCount += matches.length;
    }
    return (technicalCount / wordCount) * 1000;
  }

  /**
   * Calculate similarity for a single feature
   */
  private calculateFeatureSimilarity(
    feature: string,
    v1: number,
    v2: number
  ): number {
    // Define expected ranges for normalization
    const ranges: Record<string, { min: number; max: number }> = {
      averageSentenceLength: { min: 10, max: 40 },
      vocabularyRichness: { min: 0.2, max: 0.8 },
      formalityScore: { min: 0, max: 1 },
      paragraphDensity: { min: 1, max: 10 },
      headingFrequency: { min: 0, max: 10 },
      listUsage: { min: 0, max: 20 },
      citationDensity: { min: 0, max: 50 },
      activeVoiceRatio: { min: 0, max: 1 },
      firstPersonUsage: { min: 0, max: 30 },
      technicalTermDensity: { min: 0, max: 50 },
    };

    const range = ranges[feature] ?? { min: 0, max: 1 };
    const rangeSize = range.max - range.min;

    // Normalize values
    const n1 = rangeSize > 0 ? (v1 - range.min) / rangeSize : v1;
    const n2 = rangeSize > 0 ? (v2 - range.min) / rangeSize : v2;

    // Calculate similarity using inverse absolute difference
    const diff = Math.abs(n1 - n2);
    return Math.max(0, 1 - diff);
  }

  /**
   * Identify deviation areas for a new chapter
   */
  private identifyDeviationAreas(
    newFingerprint: ChapterStyleFingerprint,
    existingFingerprints: ChapterStyleFingerprint[]
  ): string[] {
    const featureDeviations: Array<{ feature: string; avgDeviation: number }> = [];

    const numericFeatures: Array<keyof ChapterStyleFingerprint> = [
      'averageSentenceLength',
      'vocabularyRichness',
      'formalityScore',
      'paragraphDensity',
      'headingFrequency',
      'listUsage',
      'citationDensity',
      'activeVoiceRatio',
      'firstPersonUsage',
      'technicalTermDensity',
    ];

    for (const feature of numericFeatures) {
      const newValue = newFingerprint[feature] as number;
      const existingValues = existingFingerprints.map((fp) => fp[feature] as number);
      const existingAvg =
        existingValues.reduce((a, b) => a + b, 0) / existingValues.length;

      const similarity = this.calculateFeatureSimilarity(
        feature,
        newValue,
        existingAvg
      );
      featureDeviations.push({ feature, avgDeviation: 1 - similarity });
    }

    // Sort by deviation and return top features
    return featureDeviations
      .sort((a, b) => b.avgDeviation - a.avgDeviation)
      .filter((f) => f.avgDeviation > 0.2)
      .map((f) => FEATURE_NAMES[f.feature] || f.feature);
  }

  /**
   * Identify deviation areas from similarity matrix
   */
  private identifyDeviationAreasFromSimilarities(
    chapterId: number,
    similarities: ChapterSimilarity[]
  ): string[] {
    if (similarities.length === 0) return [];

    // Average feature similarities across all comparisons
    const featureAvgs: Record<string, number> = {};
    const featureCounts: Record<string, number> = {};

    for (const sim of similarities) {
      for (const [feature, value] of Object.entries(sim.featureSimilarities)) {
        featureAvgs[feature] = (featureAvgs[feature] || 0) + value;
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      }
    }

    // Calculate averages and find lowest
    const featureDeviations: Array<{ feature: string; deviation: number }> = [];
    for (const feature of Object.keys(featureAvgs)) {
      const avg = featureAvgs[feature] / featureCounts[feature];
      featureDeviations.push({ feature, deviation: 1 - avg });
    }

    return featureDeviations
      .sort((a, b) => b.deviation - a.deviation)
      .filter((f) => f.deviation > 0.2)
      .slice(0, 5)
      .map((f) => FEATURE_NAMES[f.feature] || f.feature);
  }

  /**
   * Generate recommendations for an outlier chapter
   */
  private generateOutlierRecommendations(
    outlier: ChapterStyleFingerprint,
    others: ChapterStyleFingerprint[],
    deviationAreas: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Calculate averages for comparison
    const avgFingerprint = this.calculateAverageFingerprint(others);

    for (const area of deviationAreas.slice(0, 3)) {
      const rec = this.generateFeatureRecommendation(area, outlier, others);
      if (rec) recommendations.push(rec);
    }

    return recommendations;
  }

  /**
   * Generate a recommendation for a specific feature
   */
  private generateFeatureRecommendation(
    featureName: string,
    current: ChapterStyleFingerprint,
    others: ChapterStyleFingerprint[]
  ): string {
    const avg = this.calculateAverageFingerprint(others);

    // Reverse lookup feature key from name
    const featureKey = Object.entries(FEATURE_NAMES).find(
      ([_, name]) => name === featureName
    )?.[0] as keyof ChapterStyleFingerprint | undefined;

    if (!featureKey) return '';

    const currentValue = current[featureKey] as number;
    const avgValue = avg[featureKey] as number;

    switch (featureKey) {
      case 'averageSentenceLength':
        if (currentValue > avgValue) {
          return `Chapter ${current.chapterId}: Shorten sentences (current avg: ${currentValue.toFixed(1)} words, target: ~${avgValue.toFixed(1)} words).`;
        } else {
          return `Chapter ${current.chapterId}: Consider longer sentences for consistency (current avg: ${currentValue.toFixed(1)} words, target: ~${avgValue.toFixed(1)} words).`;
        }

      case 'vocabularyRichness':
        if (currentValue > avgValue) {
          return `Chapter ${current.chapterId}: Vocabulary may be too varied. Consider using more consistent terminology.`;
        } else {
          return `Chapter ${current.chapterId}: Expand vocabulary to avoid repetition.`;
        }

      case 'formalityScore':
        if (currentValue < avgValue) {
          return `Chapter ${current.chapterId}: Increase formality by reducing contractions and informal expressions.`;
        } else {
          return `Chapter ${current.chapterId}: Tone may be overly formal compared to other chapters.`;
        }

      case 'paragraphDensity':
        if (currentValue > avgValue) {
          return `Chapter ${current.chapterId}: Consider breaking paragraphs into smaller units.`;
        } else {
          return `Chapter ${current.chapterId}: Paragraphs may be too short. Consider combining related points.`;
        }

      case 'citationDensity':
        if (currentValue < avgValue) {
          return `Chapter ${current.chapterId}: Add more citations to match the density of other chapters.`;
        } else {
          return `Chapter ${current.chapterId}: Citation density is higher than other chapters. Ensure balance.`;
        }

      case 'activeVoiceRatio':
        if (currentValue < avgValue) {
          return `Chapter ${current.chapterId}: Use more active voice constructions.`;
        } else {
          return `Chapter ${current.chapterId}: Consider more passive constructions for consistency.`;
        }

      case 'firstPersonUsage':
        if (currentValue > avgValue) {
          return `Chapter ${current.chapterId}: Reduce first person usage for consistency.`;
        } else {
          return `Chapter ${current.chapterId}: First person usage is lower than other chapters.`;
        }

      case 'technicalTermDensity':
        if (currentValue > avgValue) {
          return `Chapter ${current.chapterId}: Technical term density is high. Define terms or use simpler alternatives.`;
        } else {
          return `Chapter ${current.chapterId}: Consider using more technical vocabulary for consistency.`;
        }

      default:
        return `Chapter ${current.chapterId}: Review ${featureName} for consistency with other chapters.`;
    }
  }

  /**
   * Calculate average fingerprint from multiple fingerprints
   */
  private calculateAverageFingerprint(
    fingerprints: ChapterStyleFingerprint[]
  ): ChapterStyleFingerprint {
    if (fingerprints.length === 0) {
      return this.createEmptyFingerprint(0);
    }

    const numericKeys: Array<keyof ChapterStyleFingerprint> = [
      'averageSentenceLength',
      'vocabularyRichness',
      'formalityScore',
      'paragraphDensity',
      'headingFrequency',
      'listUsage',
      'citationDensity',
      'activeVoiceRatio',
      'firstPersonUsage',
      'technicalTermDensity',
      'wordCount',
      'sentenceCount',
      'paragraphCount',
    ];

    const avg: Record<string, number> = {};
    for (const key of numericKeys) {
      avg[key] =
        fingerprints.reduce((sum, fp) => sum + (fp[key] as number), 0) /
        fingerprints.length;
    }

    // Determine dominant citation style
    const styleCounts = { parenthetical: 0, narrative: 0, mixed: 0 };
    for (const fp of fingerprints) {
      styleCounts[fp.citationStyle]++;
    }
    const dominantStyle = (
      Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0][0]
    ) as 'parenthetical' | 'narrative' | 'mixed';

    return {
      chapterId: 0,
      chapterTitle: 'Average',
      averageSentenceLength: avg['averageSentenceLength'],
      vocabularyRichness: avg['vocabularyRichness'],
      formalityScore: avg['formalityScore'],
      paragraphDensity: avg['paragraphDensity'],
      headingFrequency: avg['headingFrequency'],
      listUsage: avg['listUsage'],
      citationDensity: avg['citationDensity'],
      citationStyle: dominantStyle,
      activeVoiceRatio: avg['activeVoiceRatio'],
      firstPersonUsage: avg['firstPersonUsage'],
      technicalTermDensity: avg['technicalTermDensity'],
      wordCount: avg['wordCount'],
      sentenceCount: avg['sentenceCount'],
      paragraphCount: avg['paragraphCount'],
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Create an empty fingerprint
   */
  private createEmptyFingerprint(chapterId: number): ChapterStyleFingerprint {
    return {
      chapterId,
      averageSentenceLength: 0,
      vocabularyRichness: 0,
      formalityScore: 0,
      paragraphDensity: 0,
      headingFrequency: 0,
      listUsage: 0,
      citationDensity: 0,
      citationStyle: 'mixed',
      activeVoiceRatio: 0.5,
      firstPersonUsage: 0,
      technicalTermDensity: 0,
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate trend in a series of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression slope
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate oscillation (variance) in a series
   */
  private calculateOscillation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate maximum change between adjacent values
   */
  private calculateMaxChange(values: number[]): number {
    if (values.length < 2) return 0;
    let maxChange = 0;
    for (let i = 1; i < values.length; i++) {
      maxChange = Math.max(maxChange, Math.abs(values[i] - values[i - 1]));
    }
    return maxChange;
  }

  /**
   * Generate trend description
   */
  private generateTrendDescription(
    direction: 'improving' | 'stable' | 'degrading',
    pattern: 'gradual' | 'sudden' | 'oscillating' | 'none',
    magnitude: number,
    similarities: number[]
  ): string {
    if (pattern === 'none' && direction === 'stable') {
      return 'Style consistency is stable across chapters.';
    }

    const firstSim = similarities[0];
    const lastSim = similarities[similarities.length - 1];

    let description = '';

    switch (direction) {
      case 'improving':
        description = `Style consistency is improving (from ${(firstSim * 100).toFixed(0)}% to ${(lastSim * 100).toFixed(0)}%).`;
        break;
      case 'degrading':
        description = `Style consistency is declining (from ${(firstSim * 100).toFixed(0)}% to ${(lastSim * 100).toFixed(0)}%).`;
        break;
      case 'stable':
        description = `Style consistency is relatively stable (averaging ${((firstSim + lastSim) * 50).toFixed(0)}%).`;
        break;
    }

    if (pattern === 'sudden') {
      description += ' A sudden style shift was detected.';
    } else if (pattern === 'oscillating') {
      description += ' Style varies significantly between adjacent chapters.';
    }

    return description;
  }

  /**
   * Generate a unique analysis ID
   */
  private generateAnalysisId(): string {
    return `drift_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Emit an event
   */
  private emitEvent(
    type: DriftDetectorEvent['type'],
    data: Record<string, unknown>
  ): void {
    const event: DriftDetectorEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    this.emit(type, event);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a dissertation style drift detector with default configuration
 */
export function createDissertationStyleDriftDetector(config?: {
  deviationThreshold?: number;
  alertThreshold?: number;
}): DissertationStyleDriftDetector {
  return new DissertationStyleDriftDetector(config);
}

// =============================================================================
// Formatting Functions
// =============================================================================

/**
 * Format drift analysis for display
 */
export function formatDriftAnalysis(analysis: DissertationDriftAnalysis): string {
  const lines: string[] = [];

  lines.push('='.repeat(70));
  lines.push('DISSERTATION STYLE DRIFT ANALYSIS');
  lines.push('='.repeat(70));
  lines.push('');
  lines.push(`Analysis ID: ${analysis.analysisId}`);
  lines.push(`Analyzed: ${analysis.analyzedAt}`);
  lines.push(`Chapters: ${analysis.chapterCount}`);
  lines.push('');

  // Overall metrics
  lines.push('-'.repeat(40));
  lines.push('OVERALL CONSISTENCY');
  lines.push('-'.repeat(40));
  lines.push(
    `Score: ${(analysis.overallConsistency * 100).toFixed(1)}% (${analysis.consistencyGrade.toUpperCase()})`
  );
  lines.push('');

  // Drift trend
  lines.push('-'.repeat(40));
  lines.push('DRIFT TREND');
  lines.push('-'.repeat(40));
  lines.push(`Direction: ${analysis.driftTrend.direction}`);
  lines.push(`Pattern: ${analysis.driftTrend.pattern}`);
  lines.push(`Magnitude: ${(analysis.driftTrend.magnitude * 100).toFixed(1)}%`);
  lines.push(`Description: ${analysis.driftTrend.description}`);
  lines.push('');

  // Outlier chapters
  if (analysis.outlierChapters.length > 0) {
    lines.push('-'.repeat(40));
    lines.push('OUTLIER CHAPTERS');
    lines.push('-'.repeat(40));
    for (const outlier of analysis.outlierChapters) {
      lines.push(
        `  Chapter ${outlier.chapterId}${outlier.chapterTitle ? ` (${outlier.chapterTitle})` : ''}`
      );
      lines.push(
        `    Deviation: ${(outlier.deviationScore * 100).toFixed(1)}%`
      );
      lines.push(`    Areas: ${outlier.deviationAreas.join(', ')}`);
      for (const rec of outlier.recommendations.slice(0, 2)) {
        lines.push(`    - ${rec}`);
      }
      lines.push('');
    }
  }

  // Recommendations
  if (analysis.recommendations.length > 0) {
    lines.push('-'.repeat(40));
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(40));
    for (const rec of analysis.recommendations) {
      lines.push(`  * ${rec}`);
    }
    lines.push('');
  }

  // Chapter fingerprints summary
  lines.push('-'.repeat(40));
  lines.push('CHAPTER FINGERPRINTS SUMMARY');
  lines.push('-'.repeat(40));
  lines.push(
    '  Ch# | Words | Sentences | Formality | Citations | Active Voice'
  );
  lines.push('  ' + '-'.repeat(62));
  for (const fp of analysis.fingerprints) {
    lines.push(
      `  ${String(fp.chapterId).padStart(3)} | ${String(fp.wordCount).padStart(5)} | ${String(fp.sentenceCount).padStart(9)} | ${(fp.formalityScore * 100).toFixed(0).padStart(8)}% | ${fp.citationDensity.toFixed(1).padStart(9)} | ${(fp.activeVoiceRatio * 100).toFixed(0).padStart(11)}%`
    );
  }
  lines.push('');

  lines.push('='.repeat(70));

  return lines.join('\n');
}

/**
 * Format new chapter check for display
 */
export function formatNewChapterCheck(check: NewChapterDriftCheck): string {
  const lines: string[] = [];

  lines.push('='.repeat(50));
  lines.push(`NEW CHAPTER DRIFT CHECK - Chapter ${check.chapterId}`);
  lines.push('='.repeat(50));
  lines.push('');

  const status = check.wouldCauseDrift ? 'WARNING: DRIFT DETECTED' : 'OK: CONSISTENT';
  lines.push(`Status: ${status}`);
  lines.push(`Similarity to existing: ${(check.similarityToExisting * 100).toFixed(1)}%`);
  lines.push(`Deviation score: ${(check.deviationScore * 100).toFixed(1)}%`);
  lines.push('');

  if (check.deviationAreas.length > 0) {
    lines.push('Deviation areas:');
    for (const area of check.deviationAreas) {
      lines.push(`  - ${area}`);
    }
    lines.push('');
  }

  if (check.recommendations.length > 0) {
    lines.push('Recommendations:');
    for (const rec of check.recommendations) {
      lines.push(`  * ${rec}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(50));

  return lines.join('\n');
}
