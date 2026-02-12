/**
 * StyleConsistencyValidator - Quality stage for evaluating style consistency
 *
 * Checks for:
 * - Tone consistency
 * - Vocabulary level consistency
 * - Sentence structure variation
 * - Paragraph length variation
 * - Section transition quality
 * - Deviation from style profile
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

// ============================================================================
// Pattern Constants
// ============================================================================

// Informal language patterns (should be minimized in academic writing)
const INFORMAL_PATTERNS = [
  /\b(gonna|wanna|gotta|kinda|sorta)\b/i,
  /\b(awesome|cool|stuff|thing|things|guy|guys)\b/i,
  /\b(basically|literally|actually|really|very|totally|definitely)\b/i,
  /\b(a\s+lot|lots\s+of|bunch\s+of)\b/i,
  /\b(ok|okay|alright)\b/i,
  /\b(etc\.?)\b/i,  // Overused in informal writing
  /\b(don't|won't|can't|isn't|aren't|wasn't|weren't|doesn't|didn't|haven't|hasn't|hadn't)\b/i, // Contractions
  /!+/,  // Exclamation marks (except in quotes)
];

// Formal academic phrases
const FORMAL_PATTERNS = [
  /\b(furthermore|moreover|nevertheless|nonetheless)\b/i,
  /\b(consequently|subsequently|accordingly)\b/i,
  /\b(notwithstanding|heretofore|wherein|whereby)\b/i,
  /\b(it\s+is\s+(argued|contended|posited|hypothesized)\s+that)\b/i,
  /\b(this\s+(study|research|paper|analysis|investigation))\b/i,
];

// First person usage patterns
const FIRST_PERSON_PATTERNS = {
  singular: /\b(I|me|my|mine|myself)\b/g,
  plural: /\b(we|us|our|ours|ourselves)\b/g,
};

// Passive voice indicators
const PASSIVE_INDICATORS = [
  /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
  /\b(is|are|was|were|been|being)\s+\w+en\b/gi,
  /\b(it\s+(is|was)\s+(shown|found|demonstrated|argued|believed|thought|said|known|suggested|reported|observed|noted|considered))\b/gi,
];

// Hedging language patterns
const HEDGING_PATTERNS = [
  /\b(perhaps|maybe|possibly|probably|likely|unlikely)\b/i,
  /\b(might|may|could|would|should)\b/i,
  /\b(it\s+(seems?|appears?)\s+(that|to))\b/i,
  /\b(to\s+some\s+(extent|degree))\b/i,
  /\b(in\s+some\s+(cases|instances|ways))\b/i,
  /\b(tends?\s+to)\b/i,
  /\b(suggests?|indicates?|implies?)\b/i,
];

// Assertive language patterns
const ASSERTIVE_PATTERNS = [
  /\b(clearly|obviously|certainly|undoubtedly|definitely)\b/i,
  /\b(must|always|never|every|none|all)\b/i,
  /\b(proves?|demonstrates?|establishes?|confirms?)\b/i,
  /\b(there\s+is\s+no\s+(doubt|question))\b/i,
  /\b(it\s+is\s+(clear|evident|obvious)\s+that)\b/i,
];

// Section header patterns
const SECTION_HEADER_PATTERNS = [
  /^#+\s+.+$/gm,
  /^[A-Z][^.!?]*:$/gm,
  /^\d+\.(\d+\.)*\s+.+$/gm,
];

// ============================================================================
// Style Metrics Interface
// ============================================================================

interface StyleMetrics {
  // Sentence metrics
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  shortSentenceRatio: number;  // < 10 words
  longSentenceRatio: number;   // > 30 words

  // Paragraph metrics
  avgParagraphLength: number;
  paragraphLengthVariance: number;

  // Vocabulary metrics
  avgWordLength: number;
  uniqueWordRatio: number;
  academicWordRatio: number;

  // Tone metrics
  formalityScore: number;  // 0-1
  hedgingRatio: number;
  assertiveRatio: number;
  firstPersonUsage: number;
  passiveVoiceRatio: number;

  // Structure metrics
  hasConsistentHeaders: boolean;
  transitionDensity: number;
}

interface StyleProfile {
  expectedFormalityScore?: number;
  expectedSentenceLength?: { min: number; max: number };
  expectedParagraphLength?: { min: number; max: number };
  allowFirstPerson?: boolean;
  allowContractions?: boolean;
  preferredTone?: 'hedging' | 'assertive' | 'balanced';
}

// ============================================================================
// StyleConsistencyValidator Class
// ============================================================================

/**
 * Quality stage that evaluates style consistency and appropriateness
 */
export class StyleConsistencyValidator extends BaseQualityStage {
  readonly name = 'style-consistency';
  readonly weight = 0.15; // Adjusted for 7-stage gauntlet
  readonly threshold = 0.70;

  // Default academic style expectations
  private defaultProfile: StyleProfile = {
    expectedFormalityScore: 0.7,
    expectedSentenceLength: { min: 15, max: 25 },
    expectedParagraphLength: { min: 100, max: 300 },
    allowFirstPerson: true,  // Modern academic writing often allows this
    allowContractions: false,
    preferredTone: 'balanced',
  };

  /**
   * Evaluate chapter text for style consistency
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

    // Get style profile from context or use default
    const styleProfile = this.extractStyleProfile(context);

    // Calculate comprehensive style metrics
    const styleMetrics = this.calculateStyleMetrics(chapterText);

    // Store metrics
    metrics['avgSentenceLength'] = styleMetrics.avgSentenceLength;
    metrics['sentenceLengthVariance'] = styleMetrics.sentenceLengthVariance;
    metrics['avgParagraphLength'] = styleMetrics.avgParagraphLength;
    metrics['formalityScore'] = styleMetrics.formalityScore;
    metrics['hedgingRatio'] = styleMetrics.hedgingRatio;
    metrics['assertiveRatio'] = styleMetrics.assertiveRatio;
    metrics['firstPersonUsage'] = styleMetrics.firstPersonUsage;
    metrics['passiveVoiceRatio'] = styleMetrics.passiveVoiceRatio;
    metrics['uniqueWordRatio'] = styleMetrics.uniqueWordRatio;

    // Check tone consistency
    const toneIssues = this.checkToneConsistency(
      chapterText,
      styleMetrics,
      styleProfile,
      chapterId
    );
    issues.push(...toneIssues);

    // Check informal language
    const informalIssues = this.checkInformalLanguage(
      chapterText,
      styleProfile,
      chapterId
    );
    issues.push(...informalIssues);

    // Check sentence structure variation
    const sentenceIssues = this.checkSentenceVariation(
      chapterText,
      styleMetrics,
      styleProfile,
      chapterId
    );
    issues.push(...sentenceIssues);

    // Check paragraph structure
    const paragraphIssues = this.checkParagraphStructure(
      chapterText,
      styleMetrics,
      styleProfile,
      chapterId
    );
    issues.push(...paragraphIssues);

    // Check first person usage consistency
    const personIssues = this.checkFirstPersonUsage(
      chapterText,
      styleMetrics,
      styleProfile,
      chapterId
    );
    issues.push(...personIssues);

    // Check vocabulary consistency
    const vocabIssues = this.checkVocabularyConsistency(
      chapterText,
      styleMetrics,
      chapterId
    );
    issues.push(...vocabIssues);

    // Check section transitions
    const transitionIssues = this.checkSectionTransitions(
      chapterText,
      chapterId
    );
    issues.push(...transitionIssues);

    // Generate suggestions based on analysis
    this.generateSuggestions(styleMetrics, styleProfile, suggestions);

    // Calculate score
    const { critical, major, minor } = countIssuesBySeverity(issues);
    const paragraphs = this.extractParagraphs(chapterText);
    const sentences = this.extractSentences(chapterText);
    const totalElements = paragraphs.length + sentences.length;
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
    // Some style issues like contractions can be auto-fixed
    return (
      issue.autoFixable &&
      issue.type === 'style' &&
      issue.description.includes('contraction')
    );
  }

  /**
   * Auto-fix style issues
   */
  autoFix(text: string, issue: QualityIssue): string {
    if (!this.canAutoFix(issue)) {
      return text;
    }

    // Expand common contractions
    const contractionMap: Record<string, string> = {
      "don't": 'do not',
      "won't": 'will not',
      "can't": 'cannot',
      "isn't": 'is not',
      "aren't": 'are not',
      "wasn't": 'was not',
      "weren't": 'were not',
      "doesn't": 'does not',
      "didn't": 'did not',
      "haven't": 'have not',
      "hasn't": 'has not',
      "hadn't": 'had not',
      "couldn't": 'could not',
      "wouldn't": 'would not',
      "shouldn't": 'should not',
      "it's": 'it is',
      "that's": 'that is',
      "there's": 'there is',
      "here's": 'here is',
      "what's": 'what is',
      "who's": 'who is',
      "let's": 'let us',
      "I'm": 'I am',
      "you're": 'you are',
      "we're": 'we are',
      "they're": 'they are',
      "I've": 'I have',
      "you've": 'you have',
      "we've": 'we have',
      "they've": 'they have',
      "I'll": 'I will',
      "you'll": 'you will',
      "we'll": 'we will',
      "they'll": 'they will',
      "I'd": 'I would',
      "you'd": 'you would',
      "we'd": 'we would',
      "they'd": 'they would',
    };

    let result = text;
    for (const [contraction, expansion] of Object.entries(contractionMap)) {
      const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
      result = result.replace(regex, expansion);
    }

    return result;
  }

  // ============================================================================
  // Private Analysis Methods
  // ============================================================================

  /**
   * Extract style profile from context
   */
  private extractStyleProfile(context?: QualityEvaluationContext): StyleProfile {
    if (!context?.styleProfile) {
      return this.defaultProfile;
    }

    // Merge provided profile with defaults
    return {
      ...this.defaultProfile,
      ...(context.styleProfile as StyleProfile),
    };
  }

  /**
   * Calculate comprehensive style metrics
   */
  private calculateStyleMetrics(text: string): StyleMetrics {
    const paragraphs = this.extractParagraphs(text);
    const sentences = this.extractSentences(text);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    // Sentence metrics
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgSentenceLength = this.average(sentenceLengths);
    const sentenceLengthVariance = this.variance(sentenceLengths);
    const shortSentenceRatio = sentenceLengths.filter(l => l < 10).length / sentenceLengths.length;
    const longSentenceRatio = sentenceLengths.filter(l => l > 30).length / sentenceLengths.length;

    // Paragraph metrics
    const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
    const avgParagraphLength = this.average(paragraphLengths);
    const paragraphLengthVariance = this.variance(paragraphLengths);

    // Vocabulary metrics
    const wordLengths = words.map(w => w.replace(/[^a-zA-Z]/g, '').length);
    const avgWordLength = this.average(wordLengths);
    const uniqueWordRatio = uniqueWords.size / words.length;
    const academicWordRatio = this.calculateAcademicWordRatio(words);

    // Tone metrics
    const formalityScore = this.calculateFormalityScore(text);
    const hedgingRatio = this.calculatePatternRatio(text, HEDGING_PATTERNS);
    const assertiveRatio = this.calculatePatternRatio(text, ASSERTIVE_PATTERNS);
    const firstPersonUsage = this.countFirstPerson(text) / sentences.length;
    const passiveVoiceRatio = this.calculatePatternRatio(text, PASSIVE_INDICATORS);

    // Structure metrics
    const hasConsistentHeaders = this.checkHeaderConsistency(text);
    const transitionDensity = this.calculateTransitionDensity(paragraphs);

    return {
      avgSentenceLength,
      sentenceLengthVariance,
      shortSentenceRatio,
      longSentenceRatio,
      avgParagraphLength,
      paragraphLengthVariance,
      avgWordLength,
      uniqueWordRatio,
      academicWordRatio,
      formalityScore,
      hedgingRatio,
      assertiveRatio,
      firstPersonUsage,
      passiveVoiceRatio,
      hasConsistentHeaders,
      transitionDensity,
    };
  }

  /**
   * Check tone consistency throughout the chapter
   */
  private checkToneConsistency(
    text: string,
    metrics: StyleMetrics,
    profile: StyleProfile,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check hedging vs assertive balance
    const toneBalance = metrics.hedgingRatio - metrics.assertiveRatio;

    if (profile.preferredTone === 'balanced') {
      if (Math.abs(toneBalance) > 0.3) {
        const dominantTone = toneBalance > 0 ? 'hedging' : 'assertive';
        issues.push({
          id: this.generateIssueId('style', issueIndex++),
          type: 'style',
          severity: 'minor',
          location: { chapterId },
          description: `Tone is heavily ${dominantTone}. Consider a more balanced approach.`,
          suggestion:
            dominantTone === 'hedging'
              ? 'Add more confident assertions where evidence supports them'
              : 'Add appropriate qualifiers to avoid over-claiming',
          autoFixable: false,
        });
      }
    }

    // Check for tone shifts within chapter (analyze by section)
    const sections = text.split(/^#+\s+.+$/gm).filter(s => s.trim().length > 200);
    if (sections.length >= 2) {
      const sectionFormalities = sections.map(s => this.calculateFormalityScore(s));
      const formalityVariance = this.variance(sectionFormalities);

      if (formalityVariance > 0.15) {
        issues.push({
          id: this.generateIssueId('style', issueIndex++),
          type: 'style',
          severity: 'major',
          location: { chapterId },
          description: 'Significant tone variation between sections',
          suggestion: 'Review sections for consistent formality level throughout the chapter',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Check for informal language
   */
  private checkInformalLanguage(
    text: string,
    profile: StyleProfile,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const paragraphs = this.extractParagraphs(text);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];

      for (const pattern of INFORMAL_PATTERNS) {
        const matches = paragraph.match(pattern);
        if (matches) {
          // Check if it's a contraction
          const isContraction = /n't|'s|'ll|'d|'ve|'re|'m\b/i.test(matches[0]);

          if (isContraction && profile.allowContractions) {
            continue;
          }

          // Determine severity
          const severity = isContraction ? 'minor' : 'major';

          issues.push({
            id: this.generateIssueId('style', issueIndex++),
            type: 'style',
            severity,
            location: {
              chapterId,
              paragraphIndex: pIndex,
            },
            description: `Informal language detected: "${matches[0]}"`,
            suggestion: isContraction
              ? `Expand contraction to formal form (e.g., "${matches[0]}" -> "${this.expandContraction(matches[0])}")`
              : 'Replace with more formal academic language',
            autoFixable: isContraction,
            contextSnippet: this.createContextSnippet(
              paragraph,
              paragraph.indexOf(matches[0]),
              40
            ),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check sentence structure variation
   */
  private checkSentenceVariation(
    text: string,
    metrics: StyleMetrics,
    profile: StyleProfile,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const sentences = this.extractSentences(text);

    // Check for too many short sentences in a row
    let shortRun = 0;
    let runStart = 0;

    for (let i = 0; i < sentences.length; i++) {
      const wordCount = sentences[i].split(/\s+/).length;

      if (wordCount < 10) {
        if (shortRun === 0) runStart = i;
        shortRun++;
      } else {
        if (shortRun >= 4) {
          issues.push({
            id: this.generateIssueId('style', issueIndex++),
            type: 'style',
            severity: 'minor',
            location: { chapterId },
            description: `${shortRun} consecutive short sentences (choppy style)`,
            suggestion: 'Combine some sentences or add transitions for better flow',
            autoFixable: false,
          });
        }
        shortRun = 0;
      }
    }

    // Check for too many long sentences
    let longRun = 0;
    for (let i = 0; i < sentences.length; i++) {
      const wordCount = sentences[i].split(/\s+/).length;

      if (wordCount > 35) {
        if (longRun === 0) runStart = i;
        longRun++;
      } else {
        if (longRun >= 3) {
          issues.push({
            id: this.generateIssueId('style', issueIndex++),
            type: 'style',
            severity: 'minor',
            location: { chapterId },
            description: `${longRun} consecutive very long sentences`,
            suggestion: 'Consider breaking some sentences for readability',
            autoFixable: false,
          });
        }
        longRun = 0;
      }
    }

    // Check for very long individual sentences
    for (let i = 0; i < sentences.length; i++) {
      const wordCount = sentences[i].split(/\s+/).length;
      if (wordCount > 50) {
        issues.push({
          id: this.generateIssueId('style', issueIndex++),
          type: 'style',
          severity: 'minor',
          location: { chapterId },
          description: `Extremely long sentence (${wordCount} words)`,
          suggestion: 'Consider breaking this sentence for clarity',
          autoFixable: false,
          contextSnippet: sentences[i].substring(0, 100) + '...',
        });
      }
    }

    // Check for low variance (monotonous)
    if (metrics.sentenceLengthVariance < 20 && sentences.length > 10) {
      issues.push({
        id: this.generateIssueId('style', issueIndex++),
        type: 'style',
        severity: 'minor',
        location: { chapterId },
        description: 'Low sentence length variation (monotonous rhythm)',
        suggestion: 'Vary sentence lengths for more engaging prose',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check paragraph structure
   */
  private checkParagraphStructure(
    text: string,
    metrics: StyleMetrics,
    profile: StyleProfile,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const paragraphs = this.extractParagraphs(text);

    for (let i = 0; i < paragraphs.length; i++) {
      const wordCount = paragraphs[i].split(/\s+/).length;

      // Check for very short paragraphs (might be orphaned sentences)
      if (wordCount < 30 && wordCount > 5) {
        // Not a header but very short
        const isHeader = SECTION_HEADER_PATTERNS.some(p => p.test(paragraphs[i]));
        if (!isHeader) {
          issues.push({
            id: this.generateIssueId('structure', issueIndex++),
            type: 'structure',
            severity: 'minor',
            location: {
              chapterId,
              paragraphIndex: i,
            },
            description: `Very short paragraph (${wordCount} words)`,
            suggestion: 'Consider expanding or combining with adjacent paragraph',
            autoFixable: false,
          });
        }
      }

      // Check for very long paragraphs
      if (wordCount > 400) {
        issues.push({
          id: this.generateIssueId('structure', issueIndex++),
          type: 'structure',
          severity: 'minor',
          location: {
            chapterId,
            paragraphIndex: i,
          },
          description: `Very long paragraph (${wordCount} words)`,
          suggestion: 'Consider breaking into smaller, focused paragraphs',
          autoFixable: false,
        });
      }
    }

    // Check for high paragraph length variance
    if (metrics.paragraphLengthVariance > 15000 && paragraphs.length > 5) {
      issues.push({
        id: this.generateIssueId('structure', issueIndex++),
        type: 'structure',
        severity: 'minor',
        location: { chapterId },
        description: 'High variation in paragraph lengths',
        suggestion: 'Aim for more consistent paragraph lengths for better readability',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check first person usage consistency
   */
  private checkFirstPersonUsage(
    text: string,
    metrics: StyleMetrics,
    profile: StyleProfile,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    const singularMatches = text.match(FIRST_PERSON_PATTERNS.singular) || [];
    const pluralMatches = text.match(FIRST_PERSON_PATTERNS.plural) || [];

    // Check for mixed I/we usage (inconsistent voice)
    if (singularMatches.length > 0 && pluralMatches.length > 0) {
      const ratio = singularMatches.length / (singularMatches.length + pluralMatches.length);

      // If both are used significantly
      if (ratio > 0.3 && ratio < 0.7) {
        issues.push({
          id: this.generateIssueId('style', issueIndex++),
          type: 'style',
          severity: 'minor',
          location: { chapterId },
          description: 'Mixed use of "I" and "we" - inconsistent narrative voice',
          suggestion:
            'Choose either first person singular or plural consistently ' +
            '(singular is common for single-author dissertations)',
          autoFixable: false,
        });
      }
    }

    // Check if first person is avoided entirely (might be too passive)
    const sentences = this.extractSentences(text);
    if (
      metrics.firstPersonUsage < 0.02 &&
      metrics.passiveVoiceRatio > 0.4 &&
      sentences.length > 20
    ) {
      issues.push({
        id: this.generateIssueId('style', issueIndex++),
        type: 'style',
        severity: 'minor',
        location: { chapterId },
        description: 'Heavy passive voice with no first person usage',
        suggestion:
          'Consider using some first person ("I argue" instead of "it is argued") ' +
          'for clarity and ownership of arguments',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check vocabulary consistency
   */
  private checkVocabularyConsistency(
    text: string,
    metrics: StyleMetrics,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check for low vocabulary diversity
    if (metrics.uniqueWordRatio < 0.3 && this.wordCount(text) > 500) {
      issues.push({
        id: this.generateIssueId('style', issueIndex++),
        type: 'style',
        severity: 'minor',
        location: { chapterId },
        description: 'Low vocabulary diversity (repetitive word usage)',
        suggestion: 'Use synonyms and varied expressions to avoid repetition',
        autoFixable: false,
      });
    }

    // Check for word overuse
    const wordCounts = this.countWordFrequency(text);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;

    // Exclude common stopwords and check for overused content words
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'we', 'our',
      'has', 'have', 'had', 'be', 'being', 'which', 'who', 'what', 'where',
      'when', 'how', 'if', 'then', 'than', 'can', 'will', 'would', 'should',
      'not', 'no', 'so', 'such', 'more', 'also', 'only', 'about', 'into',
    ]);

    for (const [word, count] of wordCounts) {
      if (stopwords.has(word) || word.length < 4) continue;

      const frequency = count / totalWords;
      if (frequency > 0.02 && count > 10) {
        issues.push({
          id: this.generateIssueId('style', issueIndex++),
          type: 'style',
          severity: 'minor',
          location: { chapterId },
          description: `Word "${word}" used ${count} times (${(frequency * 100).toFixed(1)}% of text)`,
          suggestion: 'Consider using synonyms or rephrasing to reduce repetition',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Check section transitions
   */
  private checkSectionTransitions(
    text: string,
    chapterId: number
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Find section boundaries
    const sectionMatches = text.matchAll(/^(#+)\s+(.+)$/gm);
    const sections: Array<{ level: number; title: string; position: number }> = [];

    for (const match of sectionMatches) {
      sections.push({
        level: match[1].length,
        title: match[2],
        position: match.index!,
      });
    }

    // Check for section level jumps (e.g., ## to ####)
    for (let i = 1; i < sections.length; i++) {
      const prevLevel = sections[i - 1].level;
      const currLevel = sections[i].level;

      if (currLevel > prevLevel + 1) {
        issues.push({
          id: this.generateIssueId('structure', issueIndex++),
          type: 'structure',
          severity: 'minor',
          location: { chapterId },
          description: `Section level jump from ${prevLevel} to ${currLevel} at "${sections[i].title}"`,
          suggestion: 'Maintain consistent section hierarchy without skipping levels',
          autoFixable: false,
        });
      }
    }

    // Check for content immediately after headers (no transition paragraph)
    // This is a heuristic - we check if the first sentence after a header has transition words

    return issues;
  }

  /**
   * Generate suggestions based on style analysis
   */
  private generateSuggestions(
    metrics: StyleMetrics,
    profile: StyleProfile,
    suggestions: string[]
  ): void {
    if (metrics.formalityScore < 0.6) {
      suggestions.push(
        'Increase formality by reducing informal expressions and contractions.'
      );
    }

    if (metrics.passiveVoiceRatio > 0.5) {
      suggestions.push(
        'Consider using more active voice constructions for clearer, more direct writing.'
      );
    }

    if (metrics.avgSentenceLength > 30) {
      suggestions.push(
        'Your sentences average over 30 words. Consider breaking some into shorter sentences.'
      );
    }

    if (metrics.avgSentenceLength < 12) {
      suggestions.push(
        'Your sentences are quite short on average. Consider combining some for better flow.'
      );
    }

    if (metrics.uniqueWordRatio < 0.35) {
      suggestions.push(
        'Expand vocabulary variety by using synonyms and alternative expressions.'
      );
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.average(values);
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  }

  private calculateFormalityScore(text: string): number {
    const informalCount = INFORMAL_PATTERNS.reduce(
      (count, pattern) => count + (text.match(pattern) || []).length,
      0
    );

    const formalCount = FORMAL_PATTERNS.reduce(
      (count, pattern) => count + (text.match(pattern) || []).length,
      0
    );

    const total = informalCount + formalCount;
    if (total === 0) return 0.7; // Default to moderately formal

    return formalCount / total;
  }

  private calculatePatternRatio(text: string, patterns: RegExp[]): number {
    const sentences = this.extractSentences(text);
    if (sentences.length === 0) return 0;

    let matchCount = 0;
    for (const sentence of sentences) {
      if (patterns.some(p => p.test(sentence))) {
        matchCount++;
      }
    }

    return matchCount / sentences.length;
  }

  private countFirstPerson(text: string): number {
    const singularMatches = text.match(FIRST_PERSON_PATTERNS.singular) || [];
    const pluralMatches = text.match(FIRST_PERSON_PATTERNS.plural) || [];
    return singularMatches.length + pluralMatches.length;
  }

  private calculateAcademicWordRatio(words: string[]): number {
    // Academic word list (subset of AWL)
    const academicWords = new Set([
      'analyze', 'analysis', 'approach', 'area', 'assess', 'assume', 'authority',
      'available', 'benefit', 'concept', 'consist', 'constitute', 'context',
      'contract', 'create', 'data', 'define', 'derive', 'distribute', 'economy',
      'environment', 'establish', 'estimate', 'evident', 'export', 'factor',
      'finance', 'formula', 'function', 'identify', 'income', 'indicate',
      'individual', 'interpret', 'involve', 'issue', 'labor', 'legal', 'legislate',
      'major', 'method', 'occur', 'percent', 'period', 'policy', 'principle',
      'proceed', 'process', 'require', 'research', 'respond', 'role', 'section',
      'sector', 'significant', 'similar', 'source', 'specific', 'structure',
      'theory', 'vary', 'hypothesis', 'methodology', 'paradigm', 'framework',
      'criterion', 'phenomenon', 'empirical', 'qualitative', 'quantitative',
    ]);

    let academicCount = 0;
    for (const word of words) {
      const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
      if (academicWords.has(normalized)) {
        academicCount++;
      }
    }

    return words.length > 0 ? academicCount / words.length : 0;
  }

  private checkHeaderConsistency(text: string): boolean {
    const headers = text.match(/^#+\s+.+$/gm) || [];
    if (headers.length < 2) return true;

    // Check if all headers at same level have similar format
    const levelFormats = new Map<number, Set<string>>();

    for (const header of headers) {
      const level = (header.match(/^#+/) || [''])[0].length;
      const format = this.detectHeaderFormat(header);

      if (!levelFormats.has(level)) {
        levelFormats.set(level, new Set());
      }
      levelFormats.get(level)!.add(format);
    }

    // Consistent if each level has only one format
    for (const formats of levelFormats.values()) {
      if (formats.size > 1) return false;
    }

    return true;
  }

  private detectHeaderFormat(header: string): string {
    const text = header.replace(/^#+\s*/, '');
    if (/^\d+\./.test(text)) return 'numbered';
    if (/^[A-Z][a-z]/.test(text)) return 'sentence-case';
    if (/^[A-Z][A-Z]/.test(text)) return 'uppercase';
    return 'mixed';
  }

  private calculateTransitionDensity(paragraphs: string[]): number {
    if (paragraphs.length < 2) return 1;

    const transitionPatterns = [
      /^(furthermore|moreover|additionally|in\s+addition)/i,
      /^(however|nevertheless|nonetheless|on\s+the\s+other\s+hand)/i,
      /^(therefore|thus|consequently|as\s+a\s+result)/i,
      /^(first(ly)?|second(ly)?|third(ly)?|finally|next)/i,
      /^(for\s+(example|instance)|specifically)/i,
      /^(in\s+(summary|conclusion)|overall)/i,
    ];

    let transitionCount = 0;
    for (let i = 1; i < paragraphs.length; i++) {
      const firstSentence = this.extractSentences(paragraphs[i])[0] || '';
      if (transitionPatterns.some(p => p.test(firstSentence))) {
        transitionCount++;
      }
    }

    return transitionCount / (paragraphs.length - 1);
  }

  private countWordFrequency(text: string): Map<string, number> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);

    const counts = new Map<string, number>();
    for (const word of words) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }

    return counts;
  }

  private expandContraction(contraction: string): string {
    const expansions: Record<string, string> = {
      "don't": 'do not',
      "won't": 'will not',
      "can't": 'cannot',
      "isn't": 'is not',
      "aren't": 'are not',
      "wasn't": 'was not',
      "weren't": 'were not',
      "doesn't": 'does not',
      "didn't": 'did not',
      "haven't": 'have not',
      "hasn't": 'has not',
      "hadn't": 'had not',
    };

    return expansions[contraction.toLowerCase()] || contraction;
  }
}
