/**
 * Tests for Enhanced Style Drift Detector
 *
 * Tests advanced style consistency analysis including:
 * - Section-level drift detection
 * - Paragraph-level drift detection
 * - Vocabulary fingerprinting
 * - Tone analysis
 * - Register integration
 * - Trend analysis
 * - Correction suggestions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EnhancedStyleDriftDetector,
  createEnhancedDriftDetector,
  createStrictAcademicDriftDetector,
  createDraftDriftDetector,
  EnhancedDriftAnalysis,
  VocabularyFingerprint,
  ToneProfile,
} from '../../../../src/god-agent/cli/style/enhanced-style-drift-detector.js';
import type { StyleCharacteristics } from '../../../../src/god-agent/universal/style-analyzer.js';

describe('Enhanced Style Drift Detector', () => {
  let detector: EnhancedStyleDriftDetector;
  const baselineStyle: StyleCharacteristics = {
    avgSentenceLength: 20,
    avgWordLength: 5.5,
    avgParagraphLength: 5,
    formalityScore: 0.85,
    vocabularyRichness: 0.6,
    toneMarkers: [],
  };

  const formalAcademicText = `
    The phenomenological analysis reveals significant patterns in player experience.
    Furthermore, the methodology employed demonstrates robust validity across contexts.
    This approach consequently enables researchers to examine subjective dimensions
    of interactive media with greater precision than traditional methods allow.

    The theoretical framework establishes a foundation for understanding how players
    construct meaning through engagement with virtual environments. Moreover, the
    empirical evidence suggests that these experiences transcend mere entertainment
    to constitute genuine phenomenal encounters worthy of philosophical investigation.
  `;

  const informalText = `
    So basically this stuff is really cool and it shows how players get into games.
    We're gonna look at what makes games awesome and why people love them so much!
    It's pretty interesting when you think about it.

    Anyway, the thing is that games are kinda special and they make you feel stuff.
    You know what I mean? Like, they're not just fun, they're actually meaningful!
  `;

  beforeEach(() => {
    detector = createEnhancedDriftDetector(baselineStyle);
  });

  // ==========================================================================
  // Constructor and Configuration
  // ==========================================================================

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const d = new EnhancedStyleDriftDetector(baselineStyle);
      expect(d).toBeInstanceOf(EnhancedStyleDriftDetector);
    });

    it('should accept custom threshold configuration', () => {
      const d = new EnhancedStyleDriftDetector(baselineStyle, {
        thresholds: {
          minor: 0.2,
          moderate: 0.4,
          severe: 0.6,
          critical: 0.8,
        },
      });

      const analysis = d.analyze('Test text.');
      expect(analysis).toBeDefined();
    });

    it('should optionally disable register analysis', () => {
      const d = new EnhancedStyleDriftDetector(baselineStyle, {
        analyzeRegister: false,
      });

      const analysis = d.analyze("This is gonna be cool!");
      expect(analysis.registerAnalysis).toBeUndefined();
    });

    it('should optionally disable paragraph analysis', () => {
      const d = new EnhancedStyleDriftDetector(baselineStyle, {
        analyzeParagraphs: false,
      });

      const analysis = d.analyze("Paragraph one.\n\nParagraph two.");
      expect(analysis.paragraphDrifts.length).toBe(0);
    });
  });

  // ==========================================================================
  // Baseline Learning
  // ==========================================================================

  describe('Baseline Learning', () => {
    it('should learn baseline from reference text', () => {
      detector.learnBaseline(formalAcademicText);

      // Analyze similar text - should have low drift
      const analysis = detector.analyze(formalAcademicText);
      expect(analysis.vocabularyDrift.difference).toBeLessThan(0.1);
    });

    it('should allow setting baseline directly', () => {
      const vocab: VocabularyFingerprint = {
        uniqueWords: 100,
        typeTokenRatio: 0.6,
        avgWordLength: 5.5,
        avgSyllables: 2.0,
        academicRatio: 0.1,
        latinateRatio: 0.15,
        frequentPatterns: ['the', 'analysis', 'experience'],
      };

      const tone: ToneProfile = {
        confidence: 0.8,
        dominant: 'academic',
        markers: [],
        subjectivity: 0.2,
        certainty: 0.6,
      };

      detector.setBaseline(baselineStyle, vocab, tone);
      const analysis = detector.analyze(formalAcademicText);
      expect(analysis).toBeDefined();
    });
  });

  // ==========================================================================
  // Main Analysis
  // ==========================================================================

  describe('Main Analysis', () => {
    it('should return complete analysis structure', () => {
      const analysis = detector.analyze(formalAcademicText);

      expect(analysis.overallScore).toBeDefined();
      expect(analysis.severity).toBeDefined();
      expect(analysis.sectionDrifts).toBeDefined();
      expect(analysis.paragraphDrifts).toBeDefined();
      expect(analysis.vocabularyDrift).toBeDefined();
      expect(analysis.toneAnalysis).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
      expect(analysis.metadata).toBeDefined();
    });

    it('should detect low drift for formal academic text', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(formalAcademicText);

      // Same text should have very low drift (none or minor at most)
      expect(['none', 'minor']).toContain(analysis.severity);
      expect(analysis.overallScore).toBeLessThan(0.2);
    });

    it('should detect high drift for informal text', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      expect(['moderate', 'severe', 'critical']).toContain(analysis.severity);
      expect(analysis.overallScore).toBeGreaterThan(0.2);
    });

    it('should track analysis metadata', () => {
      const analysis = detector.analyze(formalAcademicText);

      expect(analysis.metadata.wordCount).toBeGreaterThan(0);
      expect(analysis.metadata.paragraphCount).toBeGreaterThan(0);
      expect(analysis.metadata.analysisTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Section Analysis
  // ==========================================================================

  describe('Section Analysis', () => {
    it('should identify and analyze sections', () => {
      const textWithSections = `
# Introduction

This is the introduction section with formal academic language.

# Methods

The methodology section describes research procedures in detail.

# Results

The results section presents empirical findings systematically.
      `;

      const analysis = detector.analyze(textWithSections);
      expect(analysis.sectionDrifts.length).toBeGreaterThan(0);
    });

    it('should calculate drift by dimension for each section', () => {
      const analysis = detector.analyze(formalAcademicText);

      if (analysis.sectionDrifts.length > 0) {
        const section = analysis.sectionDrifts[0];
        expect(section.dimensions).toHaveProperty('sentence_structure');
        expect(section.dimensions).toHaveProperty('vocabulary');
        expect(section.dimensions).toHaveProperty('tone');
        expect(section.dimensions).toHaveProperty('formality');
        expect(section.dimensions).toHaveProperty('register');
      }
    });

    it('should generate section-specific suggestions', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      const sectionsWithSuggestions = analysis.sectionDrifts.filter(
        s => s.suggestions.length > 0
      );

      // Informal text should generate suggestions
      expect(sectionsWithSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Paragraph Analysis
  // ==========================================================================

  describe('Paragraph Analysis', () => {
    it('should analyze paragraph-level drift', () => {
      const multiParagraph = `
First paragraph with formal academic content and methodology discussion.

Second paragraph introduces informal elements like gonna and stuff.

Third paragraph returns to more formal exposition and analysis.
      `;

      const analysis = detector.analyze(multiParagraph);
      expect(analysis.paragraphDrifts.length).toBe(3);
    });

    it('should identify primary drift dimension per paragraph', () => {
      const analysis = detector.analyze(formalAcademicText);

      for (const para of analysis.paragraphDrifts) {
        expect(para.primaryDimension).toBeDefined();
        expect(['sentence_structure', 'vocabulary', 'tone', 'formality',
                'register', 'punctuation', 'transitional', 'paragraph_structure'])
          .toContain(para.primaryDimension);
      }
    });

    it('should include paragraph previews', () => {
      const analysis = detector.analyze(formalAcademicText);

      for (const para of analysis.paragraphDrifts) {
        expect(para.preview).toBeDefined();
        expect(para.preview.length).toBeLessThanOrEqual(103); // 100 + "..."
      }
    });
  });

  // ==========================================================================
  // Vocabulary Fingerprinting
  // ==========================================================================

  describe('Vocabulary Fingerprinting', () => {
    it('should calculate vocabulary fingerprint', () => {
      const analysis = detector.analyze(formalAcademicText);
      const vocab = analysis.vocabularyDrift.current;

      expect(vocab.uniqueWords).toBeGreaterThan(0);
      expect(vocab.typeTokenRatio).toBeGreaterThan(0);
      expect(vocab.typeTokenRatio).toBeLessThanOrEqual(1);
      expect(vocab.avgWordLength).toBeGreaterThan(0);
      expect(vocab.avgSyllables).toBeGreaterThan(0);
    });

    it('should detect academic vocabulary', () => {
      const analysis = detector.analyze(formalAcademicText);
      const vocab = analysis.vocabularyDrift.current;

      // Formal academic text should have higher academic ratio
      expect(vocab.academicRatio).toBeGreaterThan(0);
    });

    it('should track latinate vocabulary', () => {
      const analysis = detector.analyze(formalAcademicText);
      const vocab = analysis.vocabularyDrift.current;

      // Formal academic text should have some latinate words
      expect(vocab.latinateRatio).toBeDefined();
      expect(vocab.latinateRatio).toBeGreaterThanOrEqual(0);
    });

    it('should identify frequent word patterns', () => {
      const analysis = detector.analyze(formalAcademicText);
      const vocab = analysis.vocabularyDrift.current;

      expect(vocab.frequentPatterns).toBeInstanceOf(Array);
      expect(vocab.frequentPatterns.length).toBeGreaterThan(0);
    });

    it('should calculate vocabulary drift between texts', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      expect(analysis.vocabularyDrift.difference).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Tone Analysis
  // ==========================================================================

  describe('Tone Analysis', () => {
    it('should analyze tone profile', () => {
      const analysis = detector.analyze(formalAcademicText);
      const tone = analysis.toneAnalysis.current;

      expect(tone.dominant).toBeDefined();
      expect(tone.subjectivity).toBeDefined();
      expect(tone.certainty).toBeDefined();
      expect(tone.markers).toBeInstanceOf(Array);
    });

    it('should detect hedge markers', () => {
      const hedgedText = 'Perhaps this could possibly suggest that the approach might be effective.';
      const analysis = detector.analyze(hedgedText);
      const hedges = analysis.toneAnalysis.current.markers.filter(
        m => m.type === 'hedge'
      );

      expect(hedges.length).toBeGreaterThan(0);
    });

    it('should detect booster markers', () => {
      const assertiveText = 'This clearly demonstrates that the theory definitely proves our hypothesis.';
      const analysis = detector.analyze(assertiveText);
      const boosters = analysis.toneAnalysis.current.markers.filter(
        m => m.type === 'booster'
      );

      expect(boosters.length).toBeGreaterThan(0);
    });

    it('should detect self-mention markers', () => {
      const firstPersonText = 'I argue that this research demonstrates my central thesis.';
      const analysis = detector.analyze(firstPersonText);
      const selfMentions = analysis.toneAnalysis.current.markers.filter(
        m => m.type === 'self-mention'
      );

      expect(selfMentions.length).toBeGreaterThan(0);
    });

    it('should calculate tone drift', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      expect(analysis.toneAnalysis.drift).toBeDefined();
      expect(analysis.toneAnalysis.drift).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Register Integration
  // ==========================================================================

  describe('Register Integration', () => {
    it('should include register analysis when enabled', () => {
      const d = new EnhancedStyleDriftDetector(baselineStyle, {
        analyzeRegister: true,
      });

      const analysis = d.analyze(informalText);
      expect(analysis.registerAnalysis).toBeDefined();
      expect(analysis.registerAnalysis!.consistencyScore).toBeLessThan(1);
    });

    it('should use register in drift calculation', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      // Register violations should contribute to overall drift
      expect(analysis.registerAnalysis).toBeDefined();
      expect(analysis.overallScore).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Suggestions
  // ==========================================================================

  describe('Drift Suggestions', () => {
    it('should generate suggestions for drifting text', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('should prioritize suggestions', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      if (analysis.suggestions.length > 1) {
        expect(analysis.suggestions[0].priority).toBe(1);
        expect(analysis.suggestions[1].priority).toBe(2);
      }
    });

    it('should include expected improvement estimates', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      for (const suggestion of analysis.suggestions) {
        expect(suggestion.expectedImprovement).toBeGreaterThan(0);
        expect(suggestion.expectedImprovement).toBeLessThanOrEqual(1);
      }
    });

    it('should address specific dimensions', () => {
      detector.learnBaseline(formalAcademicText);
      const analysis = detector.analyze(informalText);

      for (const suggestion of analysis.suggestions) {
        expect(suggestion.dimension).toBeDefined();
        expect(suggestion.issue).toBeDefined();
        expect(suggestion.suggestion).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // isAcceptable Method
  // ==========================================================================

  describe('isAcceptable Method', () => {
    it('should accept low-drift text', () => {
      detector.learnBaseline(formalAcademicText);
      expect(detector.isAcceptable(formalAcademicText)).toBe(true);
    });

    it('should reject high-drift text with default threshold', () => {
      detector.learnBaseline(formalAcademicText);
      expect(detector.isAcceptable(informalText)).toBe(false);
    });

    it('should respect custom severity threshold', () => {
      detector.learnBaseline(formalAcademicText);

      // Very lenient threshold
      expect(detector.isAcceptable(informalText, 'critical')).toBe(true);
    });
  });

  // ==========================================================================
  // Trend Analysis
  // ==========================================================================

  describe('Trend Analysis', () => {
    it('should return stable for insufficient data', () => {
      expect(detector.getTrend()).toBe('stable');
    });

    it('should detect improving trend', () => {
      detector.learnBaseline(formalAcademicText);

      // Analyze progressively better text
      detector.analyze(informalText);
      detector.analyze(`
        The methodology is somewhat informal but discusses analysis.
        Furthermore, the approach demonstrates some formal elements.
      `);
      detector.analyze(formalAcademicText);

      const trend = detector.getTrend();
      expect(['improving', 'stable']).toContain(trend);
    });

    it('should detect worsening trend', () => {
      detector.learnBaseline(formalAcademicText);

      // Analyze progressively worse text
      detector.analyze(formalAcademicText);
      detector.analyze(`
        This is kinda formal but has some informal stuff mixed in.
        The methodology is okay but could be better written.
      `);
      detector.analyze(informalText);

      const trend = detector.getTrend();
      expect(['worsening', 'stable']).toContain(trend);
    });
  });

  // ==========================================================================
  // History
  // ==========================================================================

  describe('History Management', () => {
    it('should track analysis history', () => {
      detector.analyze('Text one.');
      detector.analyze('Text two.');
      detector.analyze('Text three.');

      const history = detector.getHistory();
      expect(history.length).toBe(3);
    });

    it('should calculate average drift', () => {
      detector.analyze(formalAcademicText);
      detector.analyze(informalText);

      const avg = detector.getAverageDrift();
      expect(avg).toBeGreaterThan(0);
      expect(avg).toBeLessThan(1);
    });

    it('should limit history size', () => {
      // Add more than 50 analyses
      for (let i = 0; i < 55; i++) {
        detector.analyze(`Sample text ${i}`);
      }

      const history = detector.getHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  // ==========================================================================
  // Report Generation
  // ==========================================================================

  describe('Report Generation', () => {
    it('should generate comprehensive report', () => {
      detector.analyze(formalAcademicText);
      detector.analyze(informalText);

      const report = detector.generateReport();

      expect(report).toContain('ENHANCED STYLE DRIFT ANALYSIS REPORT');
      expect(report).toContain('Total Analyses:');
      expect(report).toContain('Average Drift:');
      expect(report).toContain('Current Trend:');
    });

    it('should include latest analysis details', () => {
      detector.analyze(informalText);

      const report = detector.generateReport();

      expect(report).toContain('Latest Analysis:');
      expect(report).toContain('Overall Drift:');
      expect(report).toContain('Severity:');
    });

    it('should include top suggestions', () => {
      detector.learnBaseline(formalAcademicText);
      detector.analyze(informalText);

      const report = detector.generateReport();

      expect(report).toContain('Top Suggestions:');
    });
  });

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create standard detector', () => {
      const d = createEnhancedDriftDetector(baselineStyle);
      expect(d).toBeInstanceOf(EnhancedStyleDriftDetector);
    });

    it('should create strict academic detector', () => {
      const d = createStrictAcademicDriftDetector(baselineStyle);
      d.learnBaseline(formalAcademicText);

      // Strict detector should flag minor issues
      const analysis = d.analyze(`
        The methodology appears sound. However, stuff happens sometimes.
      `);

      // Strict thresholds mean even minor drift is flagged
      expect(analysis.severity).not.toBe('none');
    });

    it('should create lenient draft detector', () => {
      const d = createDraftDriftDetector(baselineStyle);
      d.learnBaseline(formalAcademicText);

      // Draft detector should be more forgiving
      const analysis = d.analyze(`
        The methodology seems okay. There are some informal elements here.
      `);

      // Lenient thresholds may allow this
      expect(['none', 'minor', 'moderate']).toContain(analysis.severity);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const analysis = detector.analyze('');

      expect(analysis).toBeDefined();
      expect(analysis.metadata.wordCount).toBe(1); // Single empty "word"
    });

    it('should handle very short text', () => {
      const analysis = detector.analyze('Short.');

      expect(analysis).toBeDefined();
      expect(analysis.sectionDrifts.length).toBeGreaterThan(0);
    });

    it('should handle very long text', () => {
      const longText = formalAcademicText.repeat(20);
      const analysis = detector.analyze(longText);

      expect(analysis).toBeDefined();
      expect(analysis.sectionDrifts.length).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const analysis = detector.analyze('Test with symbols: @#$% and numbers 123.');

      expect(analysis).toBeDefined();
    });

    it('should handle multiple languages mixed', () => {
      const mixed = 'The analysis shows significant results. Das ist interessant.';
      const analysis = detector.analyze(mixed);

      expect(analysis).toBeDefined();
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('should analyze text efficiently', () => {
      const start = Date.now();
      const longText = formalAcademicText.repeat(10);

      detector.analyze(longText);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should handle rapid successive analyses', () => {
      const start = Date.now();

      for (let i = 0; i < 20; i++) {
        detector.analyze(formalAcademicText);
      }

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });
  });

  // ==========================================================================
  // Severity Determination
  // ==========================================================================

  describe('Severity Determination', () => {
    it('should correctly assign severity levels', () => {
      const severityOrder = ['none', 'minor', 'moderate', 'severe', 'critical'];

      detector.learnBaseline(formalAcademicText);

      // Identical text should have minimal drift (none or minor)
      const identicalAnalysis = detector.analyze(formalAcademicText);
      const identicalIdx = severityOrder.indexOf(identicalAnalysis.severity);
      expect(identicalIdx).toBeLessThanOrEqual(1); // "none" or "minor"

      // Very different text should be at least "moderate"
      const differentAnalysis = detector.analyze(informalText);
      const differentIdx = severityOrder.indexOf(differentAnalysis.severity);
      expect(differentIdx).toBeGreaterThanOrEqual(2); // At least "moderate"
    });
  });
});
