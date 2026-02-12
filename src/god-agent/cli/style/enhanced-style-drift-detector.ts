/**
 * Enhanced Style Drift Detector - Advanced Style Consistency Analysis
 *
 * Phase J Enhancement (Task #11) - Builds on base StyleDriftDetector with:
 * 1. Section-level drift detection
 * 2. Paragraph-level drift detection
 * 3. Sophisticated tone analysis
 * 4. Vocabulary fingerprinting
 * 5. Drift correction suggestions
 * 6. Rolling window analysis
 * 7. Register integration
 *
 * @module enhanced-style-drift-detector
 */

import type { StyleCharacteristics } from '../../universal/style-analyzer.js';
import { RegisterEnforcer, RegisterAnalysis } from './register-enforcer.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Drift severity levels
 */
export type DriftSeverity = 'none' | 'minor' | 'moderate' | 'severe' | 'critical';

/**
 * Drift dimension being measured
 */
export type DriftDimension =
  | 'sentence_structure'
  | 'vocabulary'
  | 'tone'
  | 'formality'
  | 'paragraph_structure'
  | 'register'
  | 'punctuation'
  | 'transitional';

/**
 * Section drift measurement
 */
export interface SectionDrift {
  /** Section identifier */
  sectionId: string;
  /** Start position in text */
  startPos: number;
  /** End position in text */
  endPos: number;
  /** Overall drift from baseline */
  driftScore: number;
  /** Drift by dimension */
  dimensions: Record<DriftDimension, number>;
  /** Severity level */
  severity: DriftSeverity;
  /** Specific suggestions */
  suggestions: string[];
}

/**
 * Paragraph drift measurement
 */
export interface ParagraphDrift {
  /** Paragraph index (0-based) */
  index: number;
  /** Paragraph text (truncated for display) */
  preview: string;
  /** Drift from baseline */
  driftScore: number;
  /** Most significant drift dimension */
  primaryDimension: DriftDimension;
  /** Severity */
  severity: DriftSeverity;
}

/**
 * Vocabulary fingerprint
 */
export interface VocabularyFingerprint {
  /** Unique words count */
  uniqueWords: number;
  /** Type-token ratio (vocabulary richness) */
  typeTokenRatio: number;
  /** Average word length */
  avgWordLength: number;
  /** Syllable complexity estimate */
  avgSyllables: number;
  /** Academic vocabulary ratio */
  academicRatio: number;
  /** Latinate vs Germanic ratio */
  latinateRatio: number;
  /** Most frequent word patterns */
  frequentPatterns: string[];
}

/**
 * Tone profile
 */
export interface ToneProfile {
  /** Confidence level (0-1) */
  confidence: number;
  /** Dominant tone */
  dominant: 'academic' | 'conversational' | 'technical' | 'persuasive' | 'neutral';
  /** Tone markers found */
  markers: ToneMarker[];
  /** Subjectivity score (0=objective, 1=subjective) */
  subjectivity: number;
  /** Certainty level (0=hedged, 1=assertive) */
  certainty: number;
}

/**
 * Tone marker
 */
export interface ToneMarker {
  /** Marker text */
  text: string;
  /** Marker type */
  type: 'hedge' | 'booster' | 'evaluative' | 'stance' | 'self-mention';
  /** Position in text */
  position: number;
}

/**
 * Enhanced drift analysis result
 */
export interface EnhancedDriftAnalysis {
  /** Overall drift score (0-1) */
  overallScore: number;
  /** Severity assessment */
  severity: DriftSeverity;
  /** Section-level drift */
  sectionDrifts: SectionDrift[];
  /** Paragraph-level drift */
  paragraphDrifts: ParagraphDrift[];
  /** Vocabulary fingerprint comparison */
  vocabularyDrift: {
    current: VocabularyFingerprint;
    baseline: VocabularyFingerprint;
    difference: number;
  };
  /** Tone analysis */
  toneAnalysis: {
    current: ToneProfile;
    baseline: ToneProfile;
    drift: number;
  };
  /** Register analysis */
  registerAnalysis?: RegisterAnalysis;
  /** Correction suggestions */
  suggestions: DriftSuggestion[];
  /** Analysis metadata */
  metadata: {
    wordCount: number;
    paragraphCount: number;
    sectionCount: number;
    analysisTimeMs: number;
  };
}

/**
 * Drift correction suggestion
 */
export interface DriftSuggestion {
  /** Suggestion priority (1=highest) */
  priority: number;
  /** Dimension this addresses */
  dimension: DriftDimension;
  /** Description of the issue */
  issue: string;
  /** Suggested correction */
  suggestion: string;
  /** Expected impact on drift score */
  expectedImprovement: number;
}

/**
 * Enhanced detector configuration
 */
export interface EnhancedDriftDetectorConfig {
  /** Drift thresholds */
  thresholds?: {
    minor?: number;
    moderate?: number;
    severe?: number;
    critical?: number;
  };
  /** Enable register analysis */
  analyzeRegister?: boolean;
  /** Rolling window size for trend analysis */
  windowSize?: number;
  /** Minimum section size (characters) */
  minSectionSize?: number;
  /** Enable paragraph-level analysis */
  analyzeParagraphs?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<EnhancedDriftDetectorConfig> = {
  thresholds: {
    minor: 0.1,
    moderate: 0.25,
    severe: 0.40,
    critical: 0.60,
  },
  analyzeRegister: true,
  windowSize: 5,
  minSectionSize: 500,
  analyzeParagraphs: true,
};

// Academic vocabulary markers (Coxhead's Academic Word List samples)
const ACADEMIC_MARKERS = new Set([
  'analysis', 'approach', 'area', 'assessment', 'assume', 'authority',
  'available', 'benefit', 'concept', 'consistent', 'constitutional',
  'context', 'contract', 'create', 'data', 'definition', 'derived',
  'distribution', 'economic', 'environment', 'established', 'estimate',
  'evidence', 'export', 'factors', 'financial', 'formula', 'function',
  'identified', 'income', 'indicate', 'individual', 'interpretation',
  'involved', 'issues', 'labour', 'legal', 'legislation', 'major',
  'method', 'occur', 'percent', 'period', 'policy', 'principle',
  'procedure', 'process', 'required', 'research', 'response', 'role',
  'section', 'sector', 'significant', 'similar', 'source', 'specific',
  'structure', 'theory', 'variables', 'constitute', 'demonstrate',
  'furthermore', 'however', 'moreover', 'therefore', 'consequently',
  'methodology', 'paradigm', 'hypothesis', 'framework', 'empirical',
  'qualitative', 'quantitative', 'phenomenological', 'ontological',
  'epistemological', 'hermeneutic', 'dialectical', 'correlational',
]);

// Tone markers
const HEDGE_MARKERS = [
  'perhaps', 'possibly', 'probably', 'might', 'may', 'could', 'seem',
  'appear', 'suggest', 'indicate', 'tend', 'somewhat', 'relatively',
  'approximately', 'generally', 'typically', 'often', 'usually',
  'arguably', 'potentially', 'presumably', 'apparently',
];

const BOOSTER_MARKERS = [
  'clearly', 'obviously', 'certainly', 'definitely', 'undoubtedly',
  'always', 'never', 'must', 'prove', 'demonstrate', 'show', 'establish',
  'confirm', 'ensure', 'guarantee', 'inevitably', 'undeniably',
];

const SELF_MENTION_MARKERS = [
  'I', 'me', 'my', 'we', 'our', 'us', 'the author', 'this study',
  'this research', 'this paper', 'this dissertation', 'this thesis',
];

// Latinate suffixes (indicate more formal/academic vocabulary)
const LATINATE_SUFFIXES = [
  'tion', 'sion', 'ment', 'ity', 'ance', 'ence', 'ous', 'ive',
  'able', 'ible', 'al', 'ical', 'ology', 'ism', 'ist',
];

// ============================================================================
// EnhancedStyleDriftDetector Class
// ============================================================================

/**
 * Enhanced Style Drift Detector with section and paragraph analysis
 */
export class EnhancedStyleDriftDetector {
  private baselineStyle: StyleCharacteristics;
  private baselineVocab: VocabularyFingerprint | null = null;
  private baselineTone: ToneProfile | null = null;
  private config: Required<EnhancedDriftDetectorConfig>;
  private registerEnforcer: RegisterEnforcer | null = null;
  private history: EnhancedDriftAnalysis[] = [];

  constructor(
    baselineStyle: StyleCharacteristics,
    config: EnhancedDriftDetectorConfig = {}
  ) {
    this.baselineStyle = baselineStyle;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: {
        ...DEFAULT_CONFIG.thresholds,
        ...config.thresholds,
      },
    };

    if (this.config.analyzeRegister) {
      this.registerEnforcer = new RegisterEnforcer();
    }
  }

  // ==========================================================================
  // Baseline Learning
  // ==========================================================================

  /**
   * Learn baseline from reference text
   */
  learnBaseline(referenceText: string): void {
    this.baselineVocab = this.buildVocabularyFingerprint(referenceText);
    this.baselineTone = this.analyzeTone(referenceText);
  }

  /**
   * Set baseline characteristics directly
   */
  setBaseline(
    style: StyleCharacteristics,
    vocab?: VocabularyFingerprint,
    tone?: ToneProfile
  ): void {
    this.baselineStyle = style;
    if (vocab) this.baselineVocab = vocab;
    if (tone) this.baselineTone = tone;
  }

  // ==========================================================================
  // Main Analysis
  // ==========================================================================

  /**
   * Analyze text for style drift
   */
  analyze(text: string): EnhancedDriftAnalysis {
    const startTime = Date.now();

    // Build current profiles
    const currentVocab = this.buildVocabularyFingerprint(text);
    const currentTone = this.analyzeTone(text);

    // Use baseline or create default
    const baselineVocab = this.baselineVocab || this.buildVocabularyFingerprint(text);
    const baselineTone = this.baselineTone || currentTone;

    // Analyze sections
    const sections = this.identifySections(text);
    const sectionDrifts = sections.map((section, i) =>
      this.analyzeSectionDrift(section, i, text)
    );

    // Analyze paragraphs
    const paragraphDrifts = this.config.analyzeParagraphs
      ? this.analyzeParagraphDrifts(text)
      : [];

    // Calculate vocabulary drift
    const vocabDrift = this.calculateVocabularyDrift(currentVocab, baselineVocab);

    // Calculate tone drift
    const toneDrift = this.calculateToneDrift(currentTone, baselineTone);

    // Register analysis
    const registerAnalysis = this.registerEnforcer
      ? this.registerEnforcer.analyze(text)
      : undefined;

    // Calculate overall drift
    const overallScore = this.calculateOverallDrift(
      sectionDrifts,
      vocabDrift,
      toneDrift,
      registerAnalysis
    );

    // Determine severity
    const severity = this.determineSeverity(overallScore);

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      sectionDrifts,
      vocabDrift,
      toneDrift,
      registerAnalysis
    );

    const analysis: EnhancedDriftAnalysis = {
      overallScore,
      severity,
      sectionDrifts,
      paragraphDrifts,
      vocabularyDrift: {
        current: currentVocab,
        baseline: baselineVocab,
        difference: vocabDrift,
      },
      toneAnalysis: {
        current: currentTone,
        baseline: baselineTone,
        drift: toneDrift,
      },
      registerAnalysis,
      suggestions,
      metadata: {
        wordCount: text.split(/\s+/).length,
        paragraphCount: text.split(/\n\n+/).filter(p => p.trim()).length,
        sectionCount: sections.length,
        analysisTimeMs: Date.now() - startTime,
      },
    };

    // Add to history
    this.history.push(analysis);
    if (this.history.length > 50) {
      this.history.shift();
    }

    return analysis;
  }

  /**
   * Quick check if text is within acceptable drift
   */
  isAcceptable(text: string, maxSeverity: DriftSeverity = 'moderate'): boolean {
    const analysis = this.analyze(text);
    const severityOrder: DriftSeverity[] = ['none', 'minor', 'moderate', 'severe', 'critical'];
    return severityOrder.indexOf(analysis.severity) <= severityOrder.indexOf(maxSeverity);
  }

  /**
   * Get drift trend over history
   */
  getTrend(): 'improving' | 'worsening' | 'stable' {
    if (this.history.length < 2) return 'stable';

    const window = Math.min(this.config.windowSize, this.history.length);
    const recent = this.history.slice(-window);
    const scores = recent.map(a => a.overallScore);

    // Simple linear regression
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * scores[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);

    if (slope < -0.02) return 'improving';
    if (slope > 0.02) return 'worsening';
    return 'stable';
  }

  // ==========================================================================
  // Section Analysis
  // ==========================================================================

  /**
   * Identify logical sections in text
   */
  private identifySections(text: string): string[] {
    // Try to identify sections by headings or double newlines
    const headingPattern = /^#{1,6}\s+.+$/gm;
    const headings = [...text.matchAll(headingPattern)];

    if (headings.length >= 2) {
      // Split by headings
      const sections: string[] = [];
      let lastEnd = 0;

      for (const match of headings) {
        if (match.index! > lastEnd) {
          const section = text.slice(lastEnd, match.index!).trim();
          if (section.length >= this.config.minSectionSize) {
            sections.push(section);
          }
        }
        lastEnd = match.index! + match[0].length;
      }

      // Add final section
      if (lastEnd < text.length) {
        const section = text.slice(lastEnd).trim();
        if (section.length >= this.config.minSectionSize) {
          sections.push(section);
        }
      }

      if (sections.length > 0) return sections;
    }

    // Fallback: split into chunks by paragraphs
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      currentChunk += para + '\n\n';
      if (currentChunk.length >= this.config.minSectionSize) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Analyze drift for a single section
   */
  private analyzeSectionDrift(
    section: string,
    index: number,
    _fullText: string
  ): SectionDrift {
    const currentStyle = this.analyzeStyleSimple(section);

    // Calculate dimension drifts
    const dimensions: Record<DriftDimension, number> = {
      sentence_structure: this.compareSentenceStructure(currentStyle),
      vocabulary: this.compareVocabularySimple(section),
      tone: this.compareToneSimple(section),
      formality: this.compareFormalitySimple(section),
      paragraph_structure: this.compareParagraphStructure(section),
      register: this.registerEnforcer
        ? 1 - this.registerEnforcer.analyze(section).consistencyScore
        : 0,
      punctuation: this.comparePunctuation(section),
      transitional: this.compareTransitionalUsage(section),
    };

    // Calculate overall section drift
    const driftScore = Object.values(dimensions).reduce((sum, v) => sum + v, 0) / 8;
    const severity = this.determineSeverity(driftScore);

    // Generate section-specific suggestions
    const suggestions = this.generateSectionSuggestions(dimensions, severity);

    return {
      sectionId: `section-${index}`,
      startPos: 0, // Would need to track actual positions
      endPos: section.length,
      driftScore,
      dimensions,
      severity,
      suggestions,
    };
  }

  // ==========================================================================
  // Paragraph Analysis
  // ==========================================================================

  /**
   * Analyze paragraph-level drift
   */
  private analyzeParagraphDrifts(text: string): ParagraphDrift[] {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    const drifts: ParagraphDrift[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const dimensions: Record<DriftDimension, number> = {
        sentence_structure: this.compareSentenceStructure(this.analyzeStyleSimple(para)),
        vocabulary: this.compareVocabularySimple(para),
        tone: this.compareToneSimple(para),
        formality: this.compareFormalitySimple(para),
        paragraph_structure: 0, // Not applicable at paragraph level
        register: this.registerEnforcer
          ? 1 - this.registerEnforcer.analyze(para).consistencyScore
          : 0,
        punctuation: this.comparePunctuation(para),
        transitional: this.compareTransitionalUsage(para),
      };

      // Find primary dimension
      const entries = Object.entries(dimensions) as [DriftDimension, number][];
      entries.sort((a, b) => b[1] - a[1]);
      const [primaryDimension, maxDrift] = entries[0];

      const driftScore = Object.values(dimensions).reduce((sum, v) => sum + v, 0) / 7;

      drifts.push({
        index: i,
        preview: para.slice(0, 100) + (para.length > 100 ? '...' : ''),
        driftScore,
        primaryDimension,
        severity: this.determineSeverity(driftScore),
      });
    }

    return drifts;
  }

  // ==========================================================================
  // Vocabulary Fingerprinting
  // ==========================================================================

  /**
   * Build vocabulary fingerprint
   */
  private buildVocabularyFingerprint(text: string): VocabularyFingerprint {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const uniqueWords = new Set(words);

    // Type-token ratio
    const typeTokenRatio = words.length > 0 ? uniqueWords.size / words.length : 0;

    // Average word length
    const avgWordLength = words.length > 0
      ? words.reduce((sum, w) => sum + w.length, 0) / words.length
      : 0;

    // Syllable estimate (simplified)
    const avgSyllables = words.length > 0
      ? words.reduce((sum, w) => sum + this.estimateSyllables(w), 0) / words.length
      : 0;

    // Academic vocabulary ratio
    const academicCount = words.filter(w => ACADEMIC_MARKERS.has(w)).length;
    const academicRatio = words.length > 0 ? academicCount / words.length : 0;

    // Latinate ratio
    const latinateCount = words.filter(w =>
      LATINATE_SUFFIXES.some(s => w.endsWith(s))
    ).length;
    const latinateRatio = words.length > 0 ? latinateCount / words.length : 0;

    // Frequent patterns
    const wordFreq = new Map<string, number>();
    for (const w of words) {
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }
    const sorted = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);
    const frequentPatterns = sorted.slice(0, 10).map(([w]) => w);

    return {
      uniqueWords: uniqueWords.size,
      typeTokenRatio,
      avgWordLength,
      avgSyllables,
      academicRatio,
      latinateRatio,
      frequentPatterns,
    };
  }

  /**
   * Estimate syllables in a word (simplified)
   */
  private estimateSyllables(word: string): number {
    if (word.length <= 3) return 1;
    const vowels = word.match(/[aeiouy]+/gi) || [];
    let count = vowels.length;
    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2) count++;
    return Math.max(1, count);
  }

  /**
   * Calculate vocabulary drift
   */
  private calculateVocabularyDrift(
    current: VocabularyFingerprint,
    baseline: VocabularyFingerprint
  ): number {
    const diffs = [
      Math.abs(current.typeTokenRatio - baseline.typeTokenRatio),
      Math.abs(current.avgWordLength - baseline.avgWordLength) / 10,
      Math.abs(current.avgSyllables - baseline.avgSyllables) / 5,
      Math.abs(current.academicRatio - baseline.academicRatio),
      Math.abs(current.latinateRatio - baseline.latinateRatio),
    ];

    return Math.min(1, diffs.reduce((sum, d) => sum + d, 0) / diffs.length);
  }

  // ==========================================================================
  // Tone Analysis
  // ==========================================================================

  /**
   * Analyze tone profile
   */
  private analyzeTone(text: string): ToneProfile {
    const words = text.toLowerCase();
    const markers: ToneMarker[] = [];

    // Find hedge markers
    for (const hedge of HEDGE_MARKERS) {
      const regex = new RegExp(`\\b${hedge}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        markers.push({
          text: match[0],
          type: 'hedge',
          position: match.index,
        });
      }
    }

    // Find booster markers
    for (const booster of BOOSTER_MARKERS) {
      const regex = new RegExp(`\\b${booster}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        markers.push({
          text: match[0],
          type: 'booster',
          position: match.index,
        });
      }
    }

    // Find self-mention markers
    for (const mention of SELF_MENTION_MARKERS) {
      const regex = new RegExp(`\\b${mention.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        markers.push({
          text: match[0],
          type: 'self-mention',
          position: match.index,
        });
      }
    }

    // Calculate subjectivity (more self-mentions and evaluatives = more subjective)
    const selfMentions = markers.filter(m => m.type === 'self-mention').length;
    const wordCount = text.split(/\s+/).length;
    const subjectivity = Math.min(1, selfMentions / (wordCount / 100));

    // Calculate certainty (more boosters vs hedges = more certain)
    const hedges = markers.filter(m => m.type === 'hedge').length;
    const boosters = markers.filter(m => m.type === 'booster').length;
    const certainty = hedges + boosters > 0
      ? boosters / (hedges + boosters)
      : 0.5;

    // Determine dominant tone
    let dominant: ToneProfile['dominant'] = 'neutral';
    if (ACADEMIC_MARKERS.has(words.slice(0, 100))) {
      dominant = 'academic';
    } else if (subjectivity > 0.3) {
      dominant = 'persuasive';
    } else if (certainty > 0.7) {
      dominant = 'technical';
    }

    return {
      confidence: 0.7,
      dominant,
      markers,
      subjectivity,
      certainty,
    };
  }

  /**
   * Calculate tone drift
   */
  private calculateToneDrift(current: ToneProfile, baseline: ToneProfile): number {
    const subjectivityDiff = Math.abs(current.subjectivity - baseline.subjectivity);
    const certaintyDiff = Math.abs(current.certainty - baseline.certainty);
    const dominantDiff = current.dominant === baseline.dominant ? 0 : 0.3;

    return Math.min(1, (subjectivityDiff + certaintyDiff + dominantDiff) / 3);
  }

  // ==========================================================================
  // Simple Comparison Methods
  // ==========================================================================

  /**
   * Analyze style simply
   */
  private analyzeStyleSimple(text: string): StyleCharacteristics {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = text.split(/\s+/);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

    return {
      avgSentenceLength: words.length / (sentences.length || 1),
      avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1),
      avgParagraphLength: sentences.length / (paragraphs.length || 1),
      formalityScore: this.estimateFormalityScore(text),
      vocabularyRichness: new Set(words.map(w => w.toLowerCase())).size / (words.length || 1),
      toneMarkers: [],
    };
  }

  /**
   * Estimate formality score
   */
  private estimateFormalityScore(text: string): number {
    const informal = text.match(/\b(gonna|wanna|kinda|gotta|don't|can't|won't|isn't)\b/gi);
    const words = text.split(/\s+/).length;
    return 1 - Math.min((informal?.length || 0) / words * 10, 1);
  }

  /**
   * Compare sentence structure
   */
  private compareSentenceStructure(current: StyleCharacteristics): number {
    const diff = Math.abs(current.avgSentenceLength - this.baselineStyle.avgSentenceLength);
    const maxExpected = this.baselineStyle.avgSentenceLength * 0.5;
    return Math.min(diff / maxExpected, 1);
  }

  /**
   * Compare vocabulary simply
   */
  private compareVocabularySimple(text: string): number {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const avgLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
    const diff = Math.abs(avgLength - this.baselineStyle.avgWordLength);
    return Math.min(diff / 2, 1);
  }

  /**
   * Compare tone simply
   */
  private compareToneSimple(text: string): number {
    // Count tone markers
    const hedges = HEDGE_MARKERS.filter(h =>
      new RegExp(`\\b${h}\\b`, 'i').test(text)
    ).length;
    const boosters = BOOSTER_MARKERS.filter(b =>
      new RegExp(`\\b${b}\\b`, 'i').test(text)
    ).length;

    // Simplified comparison against expected balance
    const balance = hedges + boosters > 0 ? hedges / (hedges + boosters) : 0.5;
    return Math.abs(balance - 0.6) * 2; // Expect ~60% hedging in academic writing
  }

  /**
   * Compare formality simply
   */
  private compareFormalitySimple(text: string): number {
    const current = this.estimateFormalityScore(text);
    return Math.abs(current - this.baselineStyle.formalityScore);
  }

  /**
   * Compare paragraph structure
   */
  private compareParagraphStructure(text: string): number {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const avgParagraphLen = sentences.length / (paragraphs.length || 1);

    const diff = Math.abs(avgParagraphLen - this.baselineStyle.avgParagraphLength);
    const maxExpected = this.baselineStyle.avgParagraphLength * 0.5;
    return Math.min(diff / maxExpected, 1);
  }

  /**
   * Compare punctuation patterns
   */
  private comparePunctuation(text: string): number {
    const words = text.split(/\s+/).length;
    const semicolons = (text.match(/;/g) || []).length;
    const colons = (text.match(/:/g) || []).length;
    const dashes = (text.match(/—|-/g) || []).length;

    // Academic writing tends to use more complex punctuation
    const complexPunctRate = (semicolons + colons + dashes) / words;
    const expected = 0.02; // ~2% complex punctuation

    return Math.min(Math.abs(complexPunctRate - expected) / expected, 1);
  }

  /**
   * Compare transitional word usage
   */
  private compareTransitionalUsage(text: string): number {
    const transitions = [
      'however', 'therefore', 'furthermore', 'moreover', 'consequently',
      'nevertheless', 'thus', 'hence', 'accordingly', 'additionally',
      'similarly', 'conversely', 'alternatively', 'specifically',
    ];

    const words = text.split(/\s+/).length;
    const transitionCount = transitions.filter(t =>
      new RegExp(`\\b${t}\\b`, 'i').test(text)
    ).length;

    const transitionRate = transitionCount / (words / 100);
    const expected = 1.5; // ~1.5 transitions per 100 words

    return Math.min(Math.abs(transitionRate - expected) / expected, 1);
  }

  // ==========================================================================
  // Overall Calculations
  // ==========================================================================

  /**
   * Calculate overall drift score
   */
  private calculateOverallDrift(
    sectionDrifts: SectionDrift[],
    vocabDrift: number,
    toneDrift: number,
    registerAnalysis?: RegisterAnalysis
  ): number {
    // Weight different components
    const sectionAvg = sectionDrifts.length > 0
      ? sectionDrifts.reduce((sum, s) => sum + s.driftScore, 0) / sectionDrifts.length
      : 0;

    const registerDrift = registerAnalysis
      ? 1 - registerAnalysis.consistencyScore
      : 0;

    const weights = {
      section: 0.3,
      vocabulary: 0.25,
      tone: 0.2,
      register: 0.25,
    };

    return (
      sectionAvg * weights.section +
      vocabDrift * weights.vocabulary +
      toneDrift * weights.tone +
      registerDrift * weights.register
    );
  }

  /**
   * Determine severity level
   */
  private determineSeverity(score: number): DriftSeverity {
    const t = this.config.thresholds;
    if (score >= t.critical) return 'critical';
    if (score >= t.severe) return 'severe';
    if (score >= t.moderate) return 'moderate';
    if (score >= t.minor) return 'minor';
    return 'none';
  }

  // ==========================================================================
  // Suggestions
  // ==========================================================================

  /**
   * Generate drift correction suggestions
   */
  private generateSuggestions(
    sectionDrifts: SectionDrift[],
    vocabDrift: number,
    toneDrift: number,
    registerAnalysis?: RegisterAnalysis
  ): DriftSuggestion[] {
    const suggestions: DriftSuggestion[] = [];
    let priority = 1;

    // High vocabulary drift
    if (vocabDrift > 0.3) {
      suggestions.push({
        priority: priority++,
        dimension: 'vocabulary',
        issue: 'Vocabulary complexity differs significantly from baseline',
        suggestion: 'Use more consistent word choices matching the established academic level',
        expectedImprovement: vocabDrift * 0.5,
      });
    }

    // High tone drift
    if (toneDrift > 0.3) {
      suggestions.push({
        priority: priority++,
        dimension: 'tone',
        issue: 'Tone varies from baseline (hedging/certainty balance)',
        suggestion: 'Maintain consistent use of hedging language and confidence markers',
        expectedImprovement: toneDrift * 0.4,
      });
    }

    // Register issues
    if (registerAnalysis && registerAnalysis.consistencyScore < 0.8) {
      const topViolationType = Object.entries(registerAnalysis.violationsByType)
        .sort(([, a], [, b]) => b - a)[0];

      if (topViolationType) {
        suggestions.push({
          priority: priority++,
          dimension: 'register',
          issue: `Register violations detected: primarily ${topViolationType[0]}`,
          suggestion: `Address ${topViolationType[0]} issues to maintain formal academic register`,
          expectedImprovement: (1 - registerAnalysis.consistencyScore) * 0.6,
        });
      }
    }

    // Section-specific issues
    const problematicSections = sectionDrifts.filter(s => s.severity !== 'none');
    if (problematicSections.length > 0) {
      const worstSection = problematicSections.sort((a, b) => b.driftScore - a.driftScore)[0];
      const worstDimension = Object.entries(worstSection.dimensions)
        .sort(([, a], [, b]) => b - a)[0];

      suggestions.push({
        priority: priority++,
        dimension: worstDimension[0] as DriftDimension,
        issue: `Section "${worstSection.sectionId}" shows significant drift in ${worstDimension[0]}`,
        suggestion: worstSection.suggestions[0] || 'Review and revise this section for consistency',
        expectedImprovement: worstSection.driftScore * 0.3,
      });
    }

    return suggestions;
  }

  /**
   * Generate section-specific suggestions
   */
  private generateSectionSuggestions(
    dimensions: Record<DriftDimension, number>,
    severity: DriftSeverity
  ): string[] {
    const suggestions: string[] = [];

    if (severity === 'none') return suggestions;

    const sorted = Object.entries(dimensions)
      .sort(([, a], [, b]) => b - a);

    for (const [dim, value] of sorted.slice(0, 2)) {
      if (value > 0.2) {
        switch (dim) {
          case 'sentence_structure':
            suggestions.push('Vary sentence length to match baseline patterns');
            break;
          case 'vocabulary':
            suggestions.push('Use vocabulary consistent with established academic level');
            break;
          case 'tone':
            suggestions.push('Maintain consistent hedging and certainty balance');
            break;
          case 'formality':
            suggestions.push('Ensure formal register is maintained throughout');
            break;
          case 'register':
            suggestions.push('Eliminate informal language and contractions');
            break;
          case 'punctuation':
            suggestions.push('Use punctuation patterns consistent with academic writing');
            break;
          case 'transitional':
            suggestions.push('Include appropriate transitional phrases for coherence');
            break;
        }
      }
    }

    return suggestions;
  }

  // ==========================================================================
  // History and Reporting
  // ==========================================================================

  /**
   * Get analysis history
   */
  getHistory(): EnhancedDriftAnalysis[] {
    return [...this.history];
  }

  /**
   * Get average drift over history
   */
  getAverageDrift(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, a) => sum + a.overallScore, 0) / this.history.length;
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): string {
    const lines: string[] = [
      '',
      '═'.repeat(80),
      'ENHANCED STYLE DRIFT ANALYSIS REPORT',
      '═'.repeat(80),
      '',
      `Total Analyses: ${this.history.length}`,
      `Average Drift: ${(this.getAverageDrift() * 100).toFixed(1)}%`,
      `Current Trend: ${this.getTrend()}`,
      '',
    ];

    if (this.history.length > 0) {
      const latest = this.history[this.history.length - 1];
      lines.push('Latest Analysis:');
      lines.push(`  Overall Drift: ${(latest.overallScore * 100).toFixed(1)}%`);
      lines.push(`  Severity: ${latest.severity}`);
      lines.push(`  Vocabulary Drift: ${(latest.vocabularyDrift.difference * 100).toFixed(1)}%`);
      lines.push(`  Tone Drift: ${(latest.toneAnalysis.drift * 100).toFixed(1)}%`);
      lines.push('');

      if (latest.suggestions.length > 0) {
        lines.push('Top Suggestions:');
        for (const s of latest.suggestions.slice(0, 3)) {
          lines.push(`  ${s.priority}. [${s.dimension}] ${s.suggestion}`);
        }
        lines.push('');
      }
    }

    lines.push('═'.repeat(80));

    return lines.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an enhanced drift detector
 */
export function createEnhancedDriftDetector(
  baselineStyle: StyleCharacteristics,
  config?: EnhancedDriftDetectorConfig
): EnhancedStyleDriftDetector {
  return new EnhancedStyleDriftDetector(baselineStyle, config);
}

/**
 * Create a strict academic drift detector
 */
export function createStrictAcademicDriftDetector(
  baselineStyle: StyleCharacteristics
): EnhancedStyleDriftDetector {
  return new EnhancedStyleDriftDetector(baselineStyle, {
    thresholds: {
      minor: 0.08,
      moderate: 0.18,
      severe: 0.30,
      critical: 0.45,
    },
    analyzeRegister: true,
    analyzeParagraphs: true,
  });
}

/**
 * Create a lenient drift detector for drafts
 */
export function createDraftDriftDetector(
  baselineStyle: StyleCharacteristics
): EnhancedStyleDriftDetector {
  return new EnhancedStyleDriftDetector(baselineStyle, {
    thresholds: {
      minor: 0.15,
      moderate: 0.35,
      severe: 0.55,
      critical: 0.75,
    },
    analyzeRegister: false,
    analyzeParagraphs: false,
  });
}
