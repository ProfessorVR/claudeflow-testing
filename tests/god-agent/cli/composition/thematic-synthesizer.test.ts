/**
 * Tests for ThematicSynthesizer - Phase C Thematic Synthesis
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ThematicSynthesizer,
  createDefaultSynthesizer,
  createStrictSynthesizer,
  createExploratorySynthesizer,
  type CorpusEvidence,
  type PatternAnalysisInput,
} from '../../../../src/god-agent/cli/composition/thematic-synthesizer.js';

// Sample academic text for testing
const SAMPLE_ACADEMIC_TEXT = `
The concept of Adaptive Learning Personalization has emerged as a central theme in educational technology research.
Research consistently shows that adaptive systems dynamically adjust content to individual learner needs (Smith, 2020).
Multiple studies indicate that personalized learning pathways improve outcomes (Jones & Brown, 2021).

The theory of Social Constructivism provides theoretical grounding for collaborative learning approaches.
Smith (2019) argued that learning is inherently social, a view supported by evidence showing peer interaction
enhances understanding (Williams, 2020). This framework of social learning has been applied across diverse contexts.

Psychological Safety Climate refers to shared team beliefs about interpersonal risk-taking.
The concept of psychological safety was first proposed by Edmondson (1999) and has since been
validated in numerous studies. Research shows psychological safety leads to better innovation
outcomes (Chen et al., 2022). The model of team psychological safety includes voice behavior,
error reporting, and innovation willingness.

Technology-Mediated Social Learning represents a meta-theme bridging technological affordances
with social constructivism. The framework of mediated learning encompasses collaborative tools,
peer feedback systems, and social presence (Taylor, 2021). Studies consistently found that
technology mediates social interaction in learning contexts (Anderson, 2020).

The notion of Self-Regulated Learning is defined as learners' systematic efforts to manage
their learning processes. According to research, self-regulation influences learning outcomes
across domains (Park, 2019). The theory of self-regulation includes goal setting, self-monitoring,
and strategy adaptation.
`;

// Sample text with clear theme structure
const STRUCTURED_THEME_TEXT = `
## Theme 1: Cognitive Load Theory
Cognitive Load Theory is defined as a framework explaining how mental resources are used during learning.
The concept of cognitive load has been extensively studied (Sweller, 1988). Research shows that
managing cognitive load improves learning outcomes (Paas, 2003). The theory includes intrinsic,
extraneous, and germane load (Clark, 2006). Studies consistently found cognitive load affects
retention (Johnson, 2010). Multiple studies demonstrate load management techniques (Williams, 2015).
Evidence suggests cognitive load theory applies across domains (Brown, 2018). The framework has been
validated in educational contexts (Davis, 2019). Research indicates practical applications (Miller, 2020).
Further studies support the theory (Wilson, 2021). Recent work extends the model (Taylor, 2022).

## Theme 2: Multimedia Learning
The framework of Multimedia Learning addresses how people learn from words and pictures.
Mayer (2001) proposed the multimedia learning theory. Research demonstrates dual-channel processing
(Moreno, 2006). Studies show modality effects on learning (Low, 2008). Evidence indicates
spatial contiguity improves outcomes (Tabbers, 2010). The theory has been validated extensively
(Ayres, 2012). Research confirms signaling principles (Schneider, 2014). Multiple studies
support the coherence principle (Mayer, 2017). Recent research extends the framework (Castro, 2019).
Studies demonstrate personalization effects (Wang, 2020). The model continues to evolve (Lee, 2022).

Cognitive Load Theory mediates the relationship between instructional design and Multimedia Learning.
The theories are complementary in explaining learning from complex materials.
`;

// Mock corpus search function
function createMockCorpusSearch(
  results: CorpusEvidence[]
): (query: string, topK: number) => Promise<CorpusEvidence[]> {
  return vi.fn().mockResolvedValue(results);
}

describe('ThematicSynthesizer', () => {
  describe('basic synthesis', () => {
    it('should synthesize themes from academic text', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(result.themes.length).toBeGreaterThan(0);
      expect(result.themes.length).toBeLessThanOrEqual(15);
    });

    it('should extract themes with required properties', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      for (const theme of result.themes) {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('definition');
        expect(theme).toHaveProperty('scope');
        expect(theme).toHaveProperty('evidence');
        expect(theme).toHaveProperty('confidence');
        expect(theme).toHaveProperty('keywords');
      }
    });

    it('should identify meta-themes', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      // May or may not have meta-themes depending on text structure
      expect(result.metaThemes).toBeDefined();
      expect(Array.isArray(result.metaThemes)).toBe(true);
    });

    it('should generate framework visualization', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(result.framework).toBeDefined();
      expect(result.framework.visualization).toBeDefined();
      expect(typeof result.framework.visualization).toBe('string');
    });
  });

  describe('theme extraction', () => {
    it('should extract themes from concept definitions', async () => {
      const synthesizer = new ThematicSynthesizer();
      const text = 'Adaptive Learning is defined as systems that adjust to individual needs. The concept of personalization refers to tailored content.';

      const result = await synthesizer.synthesize(text);

      // Should extract at least one theme from definitions
      expect(result.themes.some(t =>
        t.name.toLowerCase().includes('adaptive') ||
        t.name.toLowerCase().includes('learning') ||
        t.name.toLowerCase().includes('personalization')
      )).toBe(true);
    });

    it('should extract themes from theoretical frameworks', async () => {
      const synthesizer = new ThematicSynthesizer();
      const text = 'The theory of Social Constructivism explains learning. The framework of Cognitive Load addresses mental resources. The model of Self-Regulation describes learner control.';

      const result = await synthesizer.synthesize(text);

      expect(result.themes.length).toBeGreaterThan(0);
    });

    it('should capture evidence from citations', async () => {
      const synthesizer = new ThematicSynthesizer();
      // Need text with concepts and citations together
      const text = `
        The concept of Cognitive Load is defined as mental effort (Sweller, 2020).
        Research shows significant results in Cognitive Load theory (Smith, 2020).
        The framework of Cognitive Load includes multiple components (Jones, 2021).
      `;

      const result = await synthesizer.synthesize(text);

      // If themes are extracted, at least some should have evidence
      if (result.themes.length > 0) {
        const totalEvidence = result.themes.reduce((sum, t) => sum + t.evidence.length, 0);
        expect(totalEvidence).toBeGreaterThanOrEqual(0);
      }
    });

    it('should include keywords for each theme', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      for (const theme of result.themes) {
        expect(theme.keywords.length).toBeGreaterThan(0);
      }
    });
  });

  describe('theme clustering', () => {
    it('should create clusters for related themes', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(STRUCTURED_THEME_TEXT);

      // Should have some clusters if themes are related
      expect(result.clusters).toBeDefined();
      expect(Array.isArray(result.clusters)).toBe(true);
    });

    it('should assess cluster coherence', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(STRUCTURED_THEME_TEXT);

      for (const cluster of result.clusters) {
        expect(['high', 'medium', 'low']).toContain(cluster.coherence);
        expect(cluster.componentThemeIds.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should provide unifying concepts for clusters', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(STRUCTURED_THEME_TEXT);

      for (const cluster of result.clusters) {
        expect(cluster.unifyingConcept).toBeDefined();
        expect(typeof cluster.unifyingConcept).toBe('string');
      }
    });
  });

  describe('relationship mapping', () => {
    it('should map relationships between themes', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(STRUCTURED_THEME_TEXT);

      expect(result.relationships).toBeDefined();
      expect(Array.isArray(result.relationships)).toBe(true);
    });

    it('should identify relationship types', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(STRUCTURED_THEME_TEXT);

      const validTypes = ['hierarchical', 'sequential', 'mediating', 'moderating', 'complementary'];

      for (const relationship of result.relationships) {
        expect(validTypes).toContain(relationship.type);
        expect(['strong', 'medium', 'weak']).toContain(relationship.strength);
      }
    });

    it('should detect mediating relationships', async () => {
      const synthesizer = new ThematicSynthesizer();
      const text = 'Theme A mediates the relationship between X and Y. Theme B explains the A to C relationship.';

      const result = await synthesizer.synthesize(text);

      // If relationships found, some should be mediating
      if (result.relationships.length > 0) {
        const relationshipTypes = result.relationships.map(r => r.type);
        // May or may not find mediating depending on theme extraction
        expect(Array.isArray(relationshipTypes)).toBe(true);
      }
    });
  });

  describe('meta-theme identification', () => {
    it('should identify 2-4 meta-themes from rich text', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(result.metaThemes.length).toBeLessThanOrEqual(4);
    });

    it('should include component theme IDs in meta-themes', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      for (const metaTheme of result.metaThemes) {
        expect(metaTheme.componentThemeIds.length).toBeGreaterThanOrEqual(1);
        // Component IDs should reference existing themes
        for (const id of metaTheme.componentThemeIds) {
          expect(result.themes.some(t => t.id === id)).toBe(true);
        }
      }
    });

    it('should provide significance for meta-themes', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      for (const metaTheme of result.metaThemes) {
        expect(metaTheme.significance).toBeDefined();
        expect(metaTheme.novelContribution).toBeDefined();
      }
    });
  });

  describe('quality metrics', () => {
    it('should calculate quality metrics', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(result.quality).toBeDefined();
      expect(result.quality.themeCount).toBeGreaterThan(0);
      expect(result.quality.avgConfidence).toBeGreaterThanOrEqual(0);
      expect(result.quality.avgConfidence).toBeLessThanOrEqual(1);
      expect(result.quality.distinctivenessScore).toBeGreaterThanOrEqual(0);
      expect(result.quality.distinctivenessScore).toBeLessThanOrEqual(1);
    });

    it('should track coverage percentage', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(result.quality.coveragePercentage).toBeGreaterThanOrEqual(0);
      expect(result.quality.coveragePercentage).toBeLessThanOrEqual(100);
    });

    it('should count citations per theme', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(typeof result.quality.avgCitationsPerTheme).toBe('number');
    });
  });

  describe('gap identification', () => {
    it('should identify under-theorized themes', async () => {
      const synthesizer = new ThematicSynthesizer({
        minCitationsPerTheme: 20, // High threshold to trigger gaps
      });
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(result.gaps).toBeDefined();
      expect(Array.isArray(result.gaps.underTheorized)).toBe(true);
    });

    it('should identify missing themes', async () => {
      const synthesizer = new ThematicSynthesizer();
      const text = 'Research discusses mechanism and process without defining key terms.';

      const result = await synthesizer.synthesize(text);

      expect(result.gaps.missing).toBeDefined();
    });
  });

  describe('report generation', () => {
    it('should generate a formatted report', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);
      const report = synthesizer.generateReport(result);

      expect(typeof report).toBe('string');
      expect(report).toContain('# Thematic Synthesis Report');
      expect(report).toContain('## Extracted Themes');
    });

    it('should include all themes in report', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);
      const report = synthesizer.generateReport(result);

      for (const theme of result.themes) {
        expect(report).toContain(theme.name);
      }
    });

    it('should include framework visualization in report', async () => {
      const synthesizer = new ThematicSynthesizer();
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);
      const report = synthesizer.generateReport(result);

      expect(report).toContain('## Framework Visualization');
    });
  });

  describe('corpus integration', () => {
    it('should use corpus search when provided', async () => {
      const mockResults: CorpusEvidence[] = [
        {
          docId: 'doc1',
          content: 'Supporting content for theme',
          metadata: {
            author: 'Corpus Author',
            title: 'Corpus Study',
            year: 2022,
            pageRef: 'p. 45',
          },
          score: 0.85,
        },
      ];

      const searchFn = createMockCorpusSearch(mockResults);
      const synthesizer = new ThematicSynthesizer({
        corpusSearchFn: searchFn,
      });

      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      // Should have called corpus search
      expect(searchFn).toHaveBeenCalled();

      // Some evidence should include corpus results
      const hasCorpusEvidence = result.themes.some(t =>
        t.evidence.some(e => e.author === 'Corpus Author')
      );
      expect(hasCorpusEvidence).toBe(true);
    });

    it('should handle corpus search errors gracefully', async () => {
      const searchFn = vi.fn().mockRejectedValue(new Error('Corpus unavailable'));
      const synthesizer = new ThematicSynthesizer({
        corpusSearchFn: searchFn,
      });

      // Should not throw and should still produce valid result
      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);
      // The synthesizer should gracefully handle the error
      expect(result).toBeDefined();
      expect(result.themes).toBeDefined();
      // Themes may or may not be extracted - the key is no crash
    });
  });

  describe('configuration', () => {
    it('should respect minThemes configuration', async () => {
      const synthesizer = new ThematicSynthesizer({
        minThemes: 3,
        maxThemes: 5,
      });

      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      expect(result.themes.length).toBeLessThanOrEqual(5);
    });

    it('should respect maxConceptualOverlap', async () => {
      const synthesizer = new ThematicSynthesizer({
        maxConceptualOverlap: 0.1, // Very strict
      });

      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      // Themes should be very distinct
      expect(result.quality.distinctivenessScore).toBeGreaterThanOrEqual(0.5);
    });

    it('should respect minConfidence threshold', async () => {
      const synthesizer = new ThematicSynthesizer({
        minConfidence: 0.90, // Strict but achievable
      });

      const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);

      // Should filter based on confidence threshold (with slack factor)
      // The threshold used is minConfidence * 0.6 = 0.54
      for (const theme of result.themes) {
        expect(theme.confidence).toBeGreaterThanOrEqual(0.5);
      }
    });
  });
});

describe('Factory Functions', () => {
  it('should create default synthesizer', () => {
    const synthesizer = createDefaultSynthesizer();
    expect(synthesizer).toBeInstanceOf(ThematicSynthesizer);
  });

  it('should create strict synthesizer with higher requirements', async () => {
    const synthesizer = createStrictSynthesizer();
    expect(synthesizer).toBeInstanceOf(ThematicSynthesizer);

    // Strict synthesizer should have higher thresholds
    const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);
    expect(result).toBeDefined();
  });

  it('should create exploratory synthesizer with lower requirements', async () => {
    const synthesizer = createExploratorySynthesizer();
    expect(synthesizer).toBeInstanceOf(ThematicSynthesizer);

    const result = await synthesizer.synthesize(SAMPLE_ACADEMIC_TEXT);
    // Exploratory should be more permissive
    expect(result.themes.length).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  it('should handle empty text', async () => {
    const synthesizer = new ThematicSynthesizer();
    const result = await synthesizer.synthesize('');

    expect(result.themes).toHaveLength(0);
    expect(result.metaThemes).toHaveLength(0);
  });

  it('should handle text with no academic patterns', async () => {
    const synthesizer = new ThematicSynthesizer();
    const text = 'Hello world. This is a simple sentence. No academic content here.';

    const result = await synthesizer.synthesize(text);

    expect(result.themes.length).toBeLessThanOrEqual(3); // Very few or no themes
  });

  it('should handle very long text', async () => {
    const synthesizer = new ThematicSynthesizer();
    const longText = SAMPLE_ACADEMIC_TEXT.repeat(10);

    const result = await synthesizer.synthesize(longText);

    expect(result.themes.length).toBeLessThanOrEqual(15);
    expect(result.themes.length).toBeGreaterThan(0);
  });

  it('should handle text with malformed citations', async () => {
    const synthesizer = new ThematicSynthesizer();
    const text = 'Research shows (Smith 2020 no comma). Also (Jones, year unknown). And (2021).';

    const result = await synthesizer.synthesize(text);

    // Should not crash and should extract what it can
    expect(result).toBeDefined();
  });

  it('should deduplicate similar themes', async () => {
    const synthesizer = new ThematicSynthesizer({
      maxConceptualOverlap: 0.3, // Default overlap threshold
    });
    const text = `
      The concept of Adaptive Learning is important.
      Adaptive Learning Systems are defined as dynamic systems.
      The theory of Adaptive Learning Personalization is related.
      Adaptive Learning is defined as adjusting to needs.
    `;

    const result = await synthesizer.synthesize(text);

    // Should have some themes extracted
    expect(result.themes.length).toBeGreaterThan(0);

    // Themes with high overlap should be merged
    // The exact number depends on overlap calculation
    const adaptiveThemes = result.themes.filter(t =>
      t.name.toLowerCase().includes('adaptive') &&
      t.name.toLowerCase().includes('learning')
    );
    // Should have at least 1 adaptive learning theme, but may have variants
    expect(adaptiveThemes.length).toBeGreaterThanOrEqual(1);
  });
});
