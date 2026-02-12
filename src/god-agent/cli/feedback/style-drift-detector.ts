/**
 * StyleDriftDetector - Detects when generated text deviates from the user's style profile
 * Analyzes text for style drift and provides suggestions for correction
 */

import type { DeepStyleCharacteristics } from '../style/deep-style-analyzer.js';
import type { ParagraphFeedback } from './paragraph-feedback-capture.js';

/**
 * Areas where style drift can occur
 */
export type DriftArea =
  | 'sentence_length'
  | 'vocabulary'
  | 'tone'
  | 'hedging'
  | 'citation_style'
  | 'paragraph_structure'
  | 'rhetorical_moves';

/**
 * Alert levels for style drift
 */
export type AlertLevel = 'none' | 'minor' | 'moderate' | 'significant';

/**
 * A detected area of style drift
 */
export interface DriftedArea {
  area: DriftArea;
  driftMagnitude: number;  // 0-1, how much drift
  expected: string;        // What the profile says
  actual: string;          // What was generated
  suggestion: string;      // How to fix
}

/**
 * Complete drift analysis for a piece of text
 */
export interface DriftAnalysis {
  overallDriftScore: number;  // 0-1, higher = more drift
  driftedAreas: DriftedArea[];
  alertLevel: AlertLevel;
  shouldAlert: boolean;
}

/**
 * Analysis of a single paragraph's drift
 */
export interface ParagraphDriftAnalysis {
  index: number;
  analysis: DriftAnalysis;
}

/**
 * Analysis of an entire chapter's drift
 */
export interface ChapterDriftAnalysis {
  overallDrift: number;
  paragraphDrifts: ParagraphDriftAnalysis[];
  worstDriftParagraphs: number[];
}

/**
 * StyleDriftDetector class for detecting deviations from user's style profile
 */
export class StyleDriftDetector {
  private styleProfile: DeepStyleCharacteristics;
  private driftThreshold: number = 0.3;
  private alertThreshold: number = 0.5;

  // Cached analysis patterns from profile
  private expectedSentenceLength: { min: number; max: number; avg: number };
  private expectedHedgingLevel: 'low' | 'moderate' | 'high';
  private expectedTone: 'formal' | 'moderate' | 'casual';

  constructor(styleProfile: DeepStyleCharacteristics) {
    this.styleProfile = styleProfile;
    this.expectedSentenceLength = this.extractExpectedSentenceLength();
    this.expectedHedgingLevel = this.extractExpectedHedgingLevel();
    this.expectedTone = this.extractExpectedTone();
  }

  /**
   * Analyze a paragraph for style drift
   */
  analyzeParagraph(paragraphText: string): DriftAnalysis {
    const driftedAreas: DriftedArea[] = [];
    let totalDrift = 0;
    let driftCount = 0;

    // Check sentence length drift
    const sentenceLengthDrift = this.checkSentenceLengthDrift(paragraphText);
    if (sentenceLengthDrift) {
      driftedAreas.push(sentenceLengthDrift);
      totalDrift += sentenceLengthDrift.driftMagnitude;
      driftCount++;
    }

    // Check vocabulary drift
    const vocabularyDrift = this.checkVocabularyDrift(paragraphText);
    if (vocabularyDrift) {
      driftedAreas.push(vocabularyDrift);
      totalDrift += vocabularyDrift.driftMagnitude;
      driftCount++;
    }

    // Check tone drift
    const toneDrift = this.checkToneDrift(paragraphText);
    if (toneDrift) {
      driftedAreas.push(toneDrift);
      totalDrift += toneDrift.driftMagnitude;
      driftCount++;
    }

    // Check hedging drift
    const hedgingDrift = this.checkHedgingDrift(paragraphText);
    if (hedgingDrift) {
      driftedAreas.push(hedgingDrift);
      totalDrift += hedgingDrift.driftMagnitude;
      driftCount++;
    }

    // Check citation style drift
    const citationDrift = this.checkCitationStyleDrift(paragraphText);
    if (citationDrift) {
      driftedAreas.push(citationDrift);
      totalDrift += citationDrift.driftMagnitude;
      driftCount++;
    }

    // Check paragraph structure drift
    const structureDrift = this.checkParagraphStructureDrift(paragraphText);
    if (structureDrift) {
      driftedAreas.push(structureDrift);
      totalDrift += structureDrift.driftMagnitude;
      driftCount++;
    }

    // Check rhetorical moves drift
    const rhetoricalDrift = this.checkRhetoricalMovesDrift(paragraphText);
    if (rhetoricalDrift) {
      driftedAreas.push(rhetoricalDrift);
      totalDrift += rhetoricalDrift.driftMagnitude;
      driftCount++;
    }

    // Calculate overall drift score
    const overallDriftScore = driftCount > 0 ? totalDrift / driftCount : 0;

    // Determine alert level
    const alertLevel = this.determineAlertLevel(overallDriftScore);
    const shouldAlert = overallDriftScore >= this.alertThreshold;

    return {
      overallDriftScore,
      driftedAreas,
      alertLevel,
      shouldAlert,
    };
  }

  /**
   * Analyze an entire chapter for style drift
   */
  analyzeChapter(chapterText: string): ChapterDriftAnalysis {
    const paragraphs = this.splitIntoParagraphs(chapterText);
    const paragraphDrifts: ParagraphDriftAnalysis[] = [];
    let totalDrift = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const analysis = this.analyzeParagraph(paragraphs[i]);
      paragraphDrifts.push({ index: i, analysis });
      totalDrift += analysis.overallDriftScore;
    }

    const overallDrift = paragraphs.length > 0
      ? totalDrift / paragraphs.length
      : 0;

    // Find worst drift paragraphs
    const worstDriftParagraphs = paragraphDrifts
      .filter(p => p.analysis.overallDriftScore > this.driftThreshold)
      .sort((a, b) => b.analysis.overallDriftScore - a.analysis.overallDriftScore)
      .slice(0, 5)
      .map(p => p.index);

    return {
      overallDrift,
      paragraphDrifts,
      worstDriftParagraphs,
    };
  }

  /**
   * Check if text matches the expected voice patterns
   */
  matchesVoice(text: string): { matches: boolean; confidence: number } {
    const analysis = this.analyzeParagraph(text);
    const confidence = 1 - analysis.overallDriftScore;
    const matches = analysis.overallDriftScore < this.driftThreshold;

    return { matches, confidence };
  }

  /**
   * Get drift for a specific characteristic
   */
  getCharacteristicDrift(text: string, characteristic: DriftArea): number {
    let drift: DriftedArea | null = null;

    switch (characteristic) {
      case 'sentence_length':
        drift = this.checkSentenceLengthDrift(text);
        break;
      case 'vocabulary':
        drift = this.checkVocabularyDrift(text);
        break;
      case 'tone':
        drift = this.checkToneDrift(text);
        break;
      case 'hedging':
        drift = this.checkHedgingDrift(text);
        break;
      case 'citation_style':
        drift = this.checkCitationStyleDrift(text);
        break;
      case 'paragraph_structure':
        drift = this.checkParagraphStructureDrift(text);
        break;
      case 'rhetorical_moves':
        drift = this.checkRhetoricalMovesDrift(text);
        break;
    }

    return drift?.driftMagnitude ?? 0;
  }

  /**
   * Calibrate drift threshold based on feedback history
   */
  calibrateThreshold(feedback: ParagraphFeedback[]): void {
    if (feedback.length === 0) return;

    // Analyze the feedback patterns
    const soundsLikeMeFeedback = feedback.filter(f => f.soundsLikeMe);
    const doesNotSoundLikeMeFeedback = feedback.filter(f => !f.soundsLikeMe);

    if (soundsLikeMeFeedback.length === 0 || doesNotSoundLikeMeFeedback.length === 0) {
      return; // Need both positive and negative examples
    }

    // Analyze drift for positive examples
    const positiveDrifts = soundsLikeMeFeedback.map(f =>
      this.analyzeParagraph(f.generatedText).overallDriftScore
    );

    // Analyze drift for negative examples
    const negativeDrifts = doesNotSoundLikeMeFeedback.map(f =>
      this.analyzeParagraph(f.generatedText).overallDriftScore
    );

    // Calculate average drifts
    const avgPositiveDrift = positiveDrifts.reduce((a, b) => a + b, 0) / positiveDrifts.length;
    const avgNegativeDrift = negativeDrifts.reduce((a, b) => a + b, 0) / negativeDrifts.length;

    // Set threshold between the two averages
    // Bias toward catching more false positives
    const newThreshold = avgPositiveDrift + (avgNegativeDrift - avgPositiveDrift) * 0.3;

    // Only update if it makes sense
    if (newThreshold > 0.1 && newThreshold < 0.8) {
      this.driftThreshold = newThreshold;
      this.alertThreshold = newThreshold + 0.2;
    }
  }

  /**
   * Update the style profile
   */
  updateProfile(newProfile: DeepStyleCharacteristics): void {
    this.styleProfile = newProfile;
    this.expectedSentenceLength = this.extractExpectedSentenceLength();
    this.expectedHedgingLevel = this.extractExpectedHedgingLevel();
    this.expectedTone = this.extractExpectedTone();
  }

  /**
   * Get current drift threshold
   */
  getDriftThreshold(): number {
    return this.driftThreshold;
  }

  /**
   * Set drift threshold manually
   */
  setDriftThreshold(threshold: number): void {
    this.driftThreshold = Math.max(0.1, Math.min(0.9, threshold));
    this.alertThreshold = Math.min(1, this.driftThreshold + 0.2);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 50); // Only substantial paragraphs
  }

  private extractExpectedSentenceLength(): { min: number; max: number; avg: number } {
    // Extract from paragraph transitions if available
    const avgLength = this.styleProfile.transitionPatterns?.paragraphTransitions?.avgParagraphLength ?? 0;

    if (avgLength > 0) {
      // Estimate sentence count (rough heuristic)
      const avgSentenceLength = avgLength / 5; // Assume ~5 sentences per paragraph
      return {
        min: Math.max(10, avgSentenceLength - 10),
        max: avgSentenceLength + 15,
        avg: avgSentenceLength,
      };
    }

    // Default academic sentence lengths
    return { min: 15, max: 35, avg: 22 };
  }

  private extractExpectedHedgingLevel(): 'low' | 'moderate' | 'high' {
    const claimStrength = this.styleProfile.argumentPatterns?.claimStructure?.claimStrength;
    const hedgingPatterns = this.styleProfile.argumentPatterns?.claimStructure?.hedgingPatterns ?? [];

    if (claimStrength === 'strong' || hedgingPatterns.length < 3) {
      return 'low';
    } else if (claimStrength === 'cautious' || hedgingPatterns.length > 8) {
      return 'high';
    }

    return 'moderate';
  }

  private extractExpectedTone(): 'formal' | 'moderate' | 'casual' {
    // Infer from rhetorical patterns and vocabulary
    const rhetoricalMoves = this.styleProfile.rhetoricalMoves;

    if (!rhetoricalMoves || rhetoricalMoves.overallConfidence < 0.2) {
      return 'formal'; // Default to formal for academic writing
    }

    // Check for formal indicators
    const formalIndicators = [
      ...rhetoricalMoves.establishingTerritory.generalClaimPatterns,
      ...rhetoricalMoves.establishingNiche.gapIndicators,
    ];

    const hasInformalIndicators = formalIndicators.some(
      p => /\b(I think|I believe|basically|kind of|sort of)\b/i.test(p)
    );

    if (hasInformalIndicators) {
      return 'moderate';
    }

    return 'formal';
  }

  private checkSentenceLengthDrift(text: string): DriftedArea | null {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
    if (sentences.length === 0) return null;

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    const expected = this.expectedSentenceLength;
    let driftMagnitude = 0;

    if (avgLength < expected.min) {
      driftMagnitude = (expected.min - avgLength) / expected.min;
    } else if (avgLength > expected.max) {
      driftMagnitude = (avgLength - expected.max) / expected.max;
    }

    driftMagnitude = Math.min(1, driftMagnitude);

    if (driftMagnitude > this.driftThreshold) {
      return {
        area: 'sentence_length',
        driftMagnitude,
        expected: `${expected.min}-${expected.max} words per sentence (avg: ${expected.avg})`,
        actual: `${avgLength.toFixed(1)} words per sentence average`,
        suggestion: avgLength < expected.avg
          ? 'Use longer, more complex sentences'
          : 'Break down into shorter sentences',
      };
    }

    return null;
  }

  private checkVocabularyDrift(text: string): DriftedArea | null {
    // Check for vocabulary patterns that differ from profile
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / words.length;

    // Check for informal vocabulary
    const informalPatterns = /\b(gonna|wanna|gotta|kinda|sorta|yeah|nope|ok|okay|stuff|things|basically)\b/gi;
    const informalCount = (text.match(informalPatterns) ?? []).length;
    const informalRatio = informalCount / words.length;

    // Expected formal academic vocabulary
    const expectedInformalRatio = 0.001; // Very low for academic writing

    let driftMagnitude = 0;

    if (informalRatio > expectedInformalRatio * 10) {
      driftMagnitude = Math.min(1, informalRatio * 100);
    }

    if (driftMagnitude > this.driftThreshold) {
      return {
        area: 'vocabulary',
        driftMagnitude,
        expected: 'Formal academic vocabulary with minimal colloquialisms',
        actual: `Detected ${informalCount} informal terms`,
        suggestion: 'Replace informal vocabulary with formal academic equivalents',
      };
    }

    return null;
  }

  private checkToneDrift(text: string): DriftedArea | null {
    // Detect tone markers
    const formalMarkers = /\b(therefore|thus|hence|consequently|moreover|furthermore|nevertheless|notwithstanding)\b/gi;
    const informalMarkers = /\b(but|so|and|also|just|really|very|pretty|quite)\b/gi;
    const firstPersonMarkers = /\b(I|me|my|we|our|us)\b/g;

    const formalCount = (text.match(formalMarkers) ?? []).length;
    const informalCount = (text.match(informalMarkers) ?? []).length;
    const firstPersonCount = (text.match(firstPersonMarkers) ?? []).length;

    const wordCount = text.split(/\s+/).length;
    const formalRatio = formalCount / wordCount;
    const informalRatio = informalCount / wordCount;
    const firstPersonRatio = firstPersonCount / wordCount;

    let driftMagnitude = 0;
    let actual = '';
    let suggestion = '';

    // Check against expected tone
    if (this.expectedTone === 'formal') {
      if (informalRatio > formalRatio * 2 || firstPersonRatio > 0.02) {
        driftMagnitude = Math.min(1, informalRatio * 10 + firstPersonRatio * 5);
        actual = `Informal ratio: ${(informalRatio * 100).toFixed(1)}%, First-person: ${(firstPersonRatio * 100).toFixed(1)}%`;
        suggestion = 'Use more formal transitions and reduce first-person pronouns';
      }
    }

    if (driftMagnitude > this.driftThreshold) {
      return {
        area: 'tone',
        driftMagnitude,
        expected: `${this.expectedTone} academic tone`,
        actual,
        suggestion,
      };
    }

    return null;
  }

  private checkHedgingDrift(text: string): DriftedArea | null {
    // Check hedging patterns
    const hedgingMarkers = /\b(may|might|could|possibly|perhaps|likely|seems|appears|suggests|indicates|tends|generally|often|usually|somewhat|relatively)\b/gi;
    const strongMarkers = /\b(clearly|obviously|certainly|definitely|undoubtedly|must|always|never|proves|demonstrates)\b/gi;

    const hedgingCount = (text.match(hedgingMarkers) ?? []).length;
    const strongCount = (text.match(strongMarkers) ?? []).length;
    const total = hedgingCount + strongCount;

    if (total === 0) return null;

    const hedgingRatio = hedgingCount / total;

    let expectedRatio: number;
    switch (this.expectedHedgingLevel) {
      case 'low':
        expectedRatio = 0.3;
        break;
      case 'high':
        expectedRatio = 0.7;
        break;
      default:
        expectedRatio = 0.5;
    }

    const driftMagnitude = Math.abs(hedgingRatio - expectedRatio);

    if (driftMagnitude > this.driftThreshold) {
      return {
        area: 'hedging',
        driftMagnitude,
        expected: `${this.expectedHedgingLevel} hedging level (${(expectedRatio * 100).toFixed(0)}% hedged claims)`,
        actual: `${(hedgingRatio * 100).toFixed(0)}% hedged claims`,
        suggestion: hedgingRatio > expectedRatio
          ? 'Use more definitive language and stronger claims'
          : 'Add more hedging language to moderate claims',
      };
    }

    return null;
  }

  private checkCitationStyleDrift(text: string): DriftedArea | null {
    // Check citation patterns
    const authorProminentPattern = /\b[A-Z][a-z]+\s*(?:et al\.?|and\s+[A-Z][a-z]+)?\s*\(\d{4}\)/g;
    const informationProminentPattern = /\([A-Z][a-z]+(?:\s+(?:et al\.?|&\s*[A-Z][a-z]+))?,?\s*\d{4}\)/g;

    const authorProminent = (text.match(authorProminentPattern) ?? []).length;
    const informationProminent = (text.match(informationProminentPattern) ?? []).length;
    const totalCitations = authorProminent + informationProminent;

    if (totalCitations < 2) return null; // Not enough citations to analyze

    const authorProminentRatio = authorProminent / totalCitations;
    const expectedRatio = this.styleProfile.citationIntegration?.introductionPatterns?.authorProminentRatio ?? 0.5;

    const driftMagnitude = Math.abs(authorProminentRatio - expectedRatio);

    if (driftMagnitude > this.driftThreshold) {
      return {
        area: 'citation_style',
        driftMagnitude,
        expected: expectedRatio > 0.6
          ? 'Author-prominent citations (e.g., "Smith (2020) argues...")'
          : expectedRatio < 0.4
            ? 'Information-prominent citations (e.g., "...has been shown (Smith, 2020)")'
            : 'Mixed citation style',
        actual: `${(authorProminentRatio * 100).toFixed(0)}% author-prominent citations`,
        suggestion: authorProminentRatio > expectedRatio
          ? 'Use more information-prominent citations'
          : 'Use more author-prominent citations',
      };
    }

    return null;
  }

  private checkParagraphStructureDrift(text: string): DriftedArea | null {
    // Check for topic sentence patterns
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
    if (sentences.length < 3) return null;

    const firstSentenceRaw = sentences[0];
    const lastSentenceRaw = sentences[sentences.length - 1];
    if (!firstSentenceRaw || !lastSentenceRaw) return null;

    const firstSentence = firstSentenceRaw.trim();
    const hasTopicSentence = this.detectsTopicSentence(firstSentence);

    // Check for concluding/transition patterns in last sentence
    const lastSentence = lastSentenceRaw.trim();
    const hasTransition = this.detectsTransitionConcluder(lastSentence);

    // Expected structure from profile
    const expectedTopicSentence = (this.styleProfile.transitionPatterns?.paragraphTransitions?.topicSentencePatterns?.length ?? 0) > 0;

    let driftMagnitude = 0;
    const issues: string[] = [];

    if (expectedTopicSentence && !hasTopicSentence) {
      driftMagnitude += 0.5;
      issues.push('missing clear topic sentence');
    }

    if (!hasTransition) {
      driftMagnitude += 0.3;
      issues.push('weak paragraph conclusion');
    }

    driftMagnitude = Math.min(1, driftMagnitude);

    if (driftMagnitude > this.driftThreshold) {
      return {
        area: 'paragraph_structure',
        driftMagnitude,
        expected: 'Clear topic sentence with supporting evidence and conclusion',
        actual: `Issues: ${issues.join(', ')}`,
        suggestion: 'Begin with a clear topic sentence and end with a concluding thought',
      };
    }

    return null;
  }

  private checkRhetoricalMovesDrift(text: string): DriftedArea | null {
    // Check for expected rhetorical patterns
    const profile = this.styleProfile.rhetoricalMoves;
    if (!profile || profile.overallConfidence < 0.2) return null;

    // Check for presence of expected patterns
    const expectedPatterns = [
      ...profile.establishingTerritory.topicIntroducers,
      ...profile.establishingNiche.gapIndicators,
      ...profile.occupyingNiche.purposeStatements,
    ];

    if (expectedPatterns.length === 0) return null;

    // Look for pattern matches
    let matchCount = 0;
    for (const pattern of expectedPatterns.slice(0, 10)) {
      // Check first 10 patterns
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        const regex = new RegExp(escapedPattern.replace(/\.\.\./g, '.+'), 'i');
        if (regex.test(text)) {
          matchCount++;
        }
      } catch {
        // Skip invalid regex patterns
      }
    }

    const matchRatio = matchCount / Math.min(10, expectedPatterns.length);
    const driftMagnitude = 1 - matchRatio;

    if (driftMagnitude > this.driftThreshold * 1.5) {
      // Higher threshold for rhetorical moves
      return {
        area: 'rhetorical_moves',
        driftMagnitude,
        expected: 'Use of characteristic rhetorical patterns from profile',
        actual: `Only ${matchCount} expected patterns found`,
        suggestion: 'Incorporate more characteristic phrases and rhetorical structures',
      };
    }

    return null;
  }

  private detectsTopicSentence(sentence: string): boolean {
    // Check for typical topic sentence indicators
    const topicIndicators = [
      /^This\s+(section|chapter|paragraph|paper|study|analysis)/i,
      /^The\s+(main|key|central|primary|first|second)/i,
      /^One\s+(important|key|significant|notable)/i,
      /demonstrates|illustrates|shows|reveals|suggests/i,
      /argument|claim|thesis|point/i,
    ];

    return topicIndicators.some(pattern => pattern.test(sentence));
  }

  private detectsTransitionConcluder(sentence: string): boolean {
    // Check for concluding/transition patterns
    const transitionIndicators = [
      /^(Therefore|Thus|Hence|Consequently|As a result|In conclusion)/i,
      /^(This|These)\s+(finding|result|analysis|conclusion)/i,
      /^(Overall|In summary|To summarize)/i,
      /(next section|following chapter|will explore|will examine)/i,
    ];

    return transitionIndicators.some(pattern => pattern.test(sentence));
  }

  private determineAlertLevel(driftScore: number): AlertLevel {
    if (driftScore < 0.2) return 'none';
    if (driftScore < 0.4) return 'minor';
    if (driftScore < 0.6) return 'moderate';
    return 'significant';
  }
}
