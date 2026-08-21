import { describe, it, expect } from 'vitest';
import {
  buildRollingContextSectionPrompt,
  type RollingContextSectionPromptOptions,
  type RollingContextCitationTracker,
} from '../../../src/god-agent/universal/gold-standard-prompt-builder.js';

// ============================================================================
// Test fixtures
// ============================================================================

function makeChunk(author: string, title: string, content: string, relevance = 0.5, page = 1) {
  return {
    id: `chunk-${Math.random().toString(36).slice(2, 8)}`,
    content,
    relevanceScore: relevance,
    metadata: {
      author,
      title,
      year: 2020,
      page_start: page,
      page_end: page + 1,
      chunk_id: `chunk-${Math.random().toString(36).slice(2, 8)}`,
    },
  };
}

const sampleChunks = [
  makeChunk('Aristotle', 'Physics', 'Motion is the actuality of potentiality.', 0.8, 17),
  makeChunk('Aristotle', 'De Anima', 'The soul never thinks without a phantasma.', 0.75, 431),
  makeChunk('Burke, Kenneth', 'A Grammar of Motives', 'Dialectical development requires substance.', 0.6, 126),
];

const globalOutline = ['Kinesis as Ground', 'Resonant Motion', 'Antichesis', 'Conclusion'];

function makeTracker(overrides: Partial<RollingContextCitationTracker> = {}): RollingContextCitationTracker {
  return {
    authorsCitedSoFar: [],
    authorsNotYetCited: ['aristotle', 'burke, kenneth'],
    authorCitationCounts: {},
    totalCitationCount: 0,
    totalQuotationCount: 0,
    ...overrides,
  };
}

function makeOptions(overrides: Partial<RollingContextSectionPromptOptions> = {}): RollingContextSectionPromptOptions {
  return {
    topic: 'The Dual Trace: Resonant Motion and Antichesis',
    globalOutline,
    currentSectionIndex: 0,
    currentSectionHeading: 'Kinesis as Ground',
    sectionWordTarget: '600-800',
    chunks: sampleChunks,
    knowledgeUnits: ['- [ku_1] Kinesis presupposes chronos'],
    structuralEdges: ['- kinesis PRESUPPOSES chronos'],
    stylePrompt: 'Write with long sentences and formal tone.',
    preventionPlan: undefined,
    priorSectionsText: '',
    citationTracker: makeTracker(),
    isConclusion: false,
    nextSectionHeading: 'Resonant Motion',
    ...overrides,
  };
}

// ============================================================================
// buildRollingContextSectionPrompt
// ============================================================================

describe('buildRollingContextSectionPrompt', () => {
  it('should produce a non-empty prompt string', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions());
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(500);
  });

  it('should include the global outline with CURRENT marker', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({ currentSectionIndex: 1 }));
    expect(prompt).toContain('← CURRENT');
    expect(prompt).toContain('2. Resonant Motion ← CURRENT');
  });

  it('should include the section word target', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions());
    expect(prompt).toContain('600-800');
  });

  it('should include corpus chunks via chunk block', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions());
    expect(prompt).toContain('CORPUS CHUNKS');
    expect(prompt).toContain('Aristotle');
    expect(prompt).toContain('Motion is the actuality');
  });

  it('should include knowledge units', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions());
    expect(prompt).toContain('KNOWLEDGE UNITS');
    expect(prompt).toContain('Kinesis presupposes chronos');
  });

  it('should include structural edges', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions());
    expect(prompt).toContain('STRUCTURAL RELATIONSHIPS');
    expect(prompt).toContain('kinesis PRESUPPOSES chronos');
  });

  it('should include prior sections context when provided', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      currentSectionIndex: 2,
      priorSectionsText: '## Kinesis as Ground\n\nSome prior text here about kinesis.',
    }));
    expect(prompt).toContain('WHAT YOU HAVE WRITTEN SO FAR');
    expect(prompt).toContain('Some prior text here about kinesis');
  });

  it('should include citation tracker with not-yet-cited authors', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      citationTracker: makeTracker({
        authorsCitedSoFar: ['aristotle'],
        authorsNotYetCited: ['burke, kenneth'],
        totalCitationCount: 3,
        totalQuotationCount: 1,
      }),
    }));
    expect(prompt).toContain('CITATION STATUS');
    expect(prompt).toContain('aristotle');
    expect(prompt).toContain('burke, kenneth');
    expect(prompt).toContain('NOT YET CITED');
  });

  it('should include trailing hook for non-conclusion sections', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      nextSectionHeading: 'Resonant Motion',
    }));
    expect(prompt).toContain('TRANSITION REQUIREMENT');
    expect(prompt).toContain('Resonant Motion');
    expect(prompt).toContain('forward-looking transitional sentence');
  });

  it('should NOT include trailing hook for conclusion', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      currentSectionIndex: 3,
      currentSectionHeading: 'Conclusion',
      isConclusion: true,
      nextSectionHeading: undefined,
    }));
    expect(prompt).not.toContain('TRANSITION REQUIREMENT');
    expect(prompt).toContain('Synthesize');
  });

  it('should include prevention plan constraints when present', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      preventionPlan: {
        blacklistedAuthors: ['Hawhee'],
        strengthenedConstraints: ['Do not invent secondary sources'],
        underCitedSources: ['Burke'],
        overCitedSources: [],
      },
    }));
    expect(prompt).toContain('BLACKLISTED AUTHORS');
    expect(prompt).toContain('Hawhee');
    expect(prompt).toContain('CONSTRAINTS FROM V1 INVESTIGATION');
    expect(prompt).toContain('Do not invent secondary sources');
  });

  it('should use hybrid context for conclusion (summaries + full text)', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      currentSectionIndex: 3,
      currentSectionHeading: 'Conclusion',
      isConclusion: true,
      priorSectionsText: '## Antichesis\n\nFull text of antichesis section.',
      priorSectionSummaries: [
        'Section 1 establishes kinesis as the ground of Aristotelian motion theory.',
        'Section 2 develops the concept of resonant motion through Burke and Heidegger.',
      ],
    }));
    expect(prompt).toContain('Section Summaries');
    expect(prompt).toContain('Section 1 establishes kinesis');
    expect(prompt).toContain('Section 2 develops the concept');
    expect(prompt).toContain('Recent Sections');
    expect(prompt).toContain('Full text of antichesis section');
  });

  it('should include section-specific constraint when provided', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      sectionConstraint: 'Cite Aristotle at least 2 times in this section',
    }));
    expect(prompt).toContain('SECTION-SPECIFIC CONSTRAINT');
    expect(prompt).toContain('Cite Aristotle at least 2 times');
  });

  it('should include style profile with enrichment', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions({
      stylePrompt: 'Write with long sentences.',
    }));
    expect(prompt).toContain('STYLE PROFILE');
    expect(prompt).toContain('MLA-influenced');
    // Should have enrichment since base prompt lacks these
    expect(prompt).toContain('Paragraph length');
    expect(prompt).toContain('Characteristic features');
  });

  it('should produce a prompt with reasonable size', () => {
    const prompt = buildRollingContextSectionPrompt(makeOptions());
    // Should be much smaller than the gold standard whole-doc prompt
    expect(prompt.length).toBeLessThan(20000);
    expect(prompt.length).toBeGreaterThan(2000);
  });
});

// ============================================================================
// Rolling context config
// ============================================================================

describe('GOLD_STANDARD_CONFIG rolling context entries', () => {
  it('should have rolling context config values', async () => {
    const { GOLD_STANDARD_CONFIG } = await import('../../../src/god-agent/universal/gold-standard-config.js');
    expect(GOLD_STANDARD_CONFIG.rollingContextWindowSize).toBe(2);
    expect(GOLD_STANDARD_CONFIG.rollingContextSectionWords).toBe(700);
    expect(GOLD_STANDARD_CONFIG.rollingContextConclusionWords).toBe(200);
    expect(GOLD_STANDARD_CONFIG.rollingContextMaxTokens).toBe(2048);
    expect(GOLD_STANDARD_CONFIG.rollingContextSharedPoolSize).toBe(5);
    expect(GOLD_STANDARD_CONFIG.rollingContextMaxChunksPerSection).toBe(10);
    expect(GOLD_STANDARD_CONFIG.rollingContextUseSummaries).toBe(true);
    expect(GOLD_STANDARD_CONFIG.rollingContextSharedPoolMaxCitations).toBe(3);
  });
});
