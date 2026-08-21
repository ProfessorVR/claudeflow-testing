import { describe, it, expect } from 'vitest';
import {
  buildGoldStandardPrompt,
  buildGoldStandardChunkBlock,
  assignSourcesToSections,
  type GoldStandardPromptOptions,
} from '../../../src/god-agent/universal/gold-standard-prompt-builder.js';
import { stripBareApaParentheticals } from '../../../src/god-agent/universal/author-scrubber.js';

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
  makeChunk('Heidegger, Martin', 'Being and Time', 'Dasein is always already in a world.', 0.55, 78),
  makeChunk('Rickert, Thomas', 'Ambient Rhetoric', 'Rhetoric operates at the ambient level.', 0.45, 309),
];

const baseOptions: GoldStandardPromptOptions = {
  topic: 'The Dual Trace: Resonant Motion and Antichesis',
  subsections: ['Kinesis as Ground', 'Resonant Motion', 'Antichesis', 'Conclusion'],
  chunks: sampleChunks,
  knowledgeUnits: ['- [ku_1] Kinesis presupposes chronos'],
  structuralEdges: ['- kinesis PRESUPPOSES chronos (phantasia)'],
  stylePrompt: 'Write with long sentences and formal tone.',
  wordTarget: '3,000-3,500',
};

// ============================================================================
// buildGoldStandardPrompt
// ============================================================================

describe('buildGoldStandardPrompt', () => {
  it('should produce a non-empty prompt string', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(1000);
  });

  it('should include MLA citation rules', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('MLA-influenced');
    expect(prompt).toContain('(Author, *Title*, p. X)');
  });

  it('should include APA prevention rules', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('NEVER use APA-style');
    expect(prompt).toContain('(Author Year)');
  });

  it('should include role framing with word target', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('3,000-3,500 words');
    expect(prompt).toContain('academic writing agent');
  });

  it('should inject style profile with enrichment', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('## STYLE PROFILE');
    expect(prompt).toContain('long sentences and formal tone');
    // Should auto-add paragraph structure
    expect(prompt).toContain('140+ words per paragraph');
    // Should auto-add citation style
    expect(prompt).toContain('Citation Style');
    // Should auto-add characteristic features
    expect(prompt).toContain('em-dashes');
  });

  it('should not duplicate enrichment if already present', () => {
    const opts = {
      ...baseOptions,
      stylePrompt: 'Paragraph length: 200 words. Citation Style: MLA. Characteristic features: em-dashes.',
    };
    const prompt = buildGoldStandardPrompt(opts);
    // Should NOT add the defaults since the keywords are already present
    const paragraphMatches = prompt.match(/140\+ words per paragraph/g);
    expect(paragraphMatches).toBeNull();
  });

  it('should include section titles with word targets', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('1. Kinesis as Ground');
    expect(prompt).toContain('2. Resonant Motion');
    expect(prompt).toContain('3. Antichesis');
    expect(prompt).toContain('4. Conclusion');
    expect(prompt).toContain('words per section');
  });

  it('should include grounding rules', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('ONLY quote and cite from the corpus chunks below');
    expect(prompt).toContain('NEVER introduce any author names');
  });

  it('should include source diversity requirements', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('Source Diversity');
    expect(prompt).toContain('MUST cite from at least');
    expect(prompt).toContain('Available sources');
  });

  it('should include corpus chunks', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('CORPUS CHUNKS');
    expect(prompt).toContain('Motion is the actuality of potentiality');
    expect(prompt).toContain('Source Index');
  });

  it('should include knowledge units', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('KNOWLEDGE UNITS');
    expect(prompt).toContain('Kinesis presupposes chronos');
  });

  it('should include structural edges', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('STRUCTURAL RELATIONSHIPS');
    expect(prompt).toContain('kinesis PRESUPPOSES chronos');
  });

  it('should include validation appendix format', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('Claim Map');
    expect(prompt).toContain('Quotation Ledger');
    expect(prompt).toContain('Citation Ledger');
  });

  it('should include prevention plan when provided', () => {
    const opts = {
      ...baseOptions,
      preventionPlan: {
        blacklistedAuthors: ['Modrak', 'Roark'],
        strengthenedConstraints: ['Do not cite secondary scholars without chunk evidence'],
        underCitedSources: ['Rickert'],
        overCitedSources: ['Aristotle'],
      },
    };
    const prompt = buildGoldStandardPrompt(opts);
    expect(prompt).toContain('BLACKLISTED AUTHORS');
    expect(prompt).toContain('Modrak');
    expect(prompt).toContain('ADDITIONAL CONSTRAINTS FROM V1 INVESTIGATION');
  });

  it('should include primary-text priority rules', () => {
    const prompt = buildGoldStandardPrompt(baseOptions);
    expect(prompt).toContain('Primary-Text Priority');
    expect(prompt).toContain('DIRECT ENGAGEMENT with primary texts');
  });

  it('should work with empty subsections', () => {
    const opts = { ...baseOptions, subsections: [] };
    const prompt = buildGoldStandardPrompt(opts);
    expect(prompt).toBeTruthy();
    expect(prompt).toContain('The Dual Trace');
  });

  it('should work with empty chunks', () => {
    const opts = { ...baseOptions, chunks: [] };
    const prompt = buildGoldStandardPrompt(opts);
    expect(prompt).toBeTruthy();
    // Should still have constraints but no chunk block
    expect(prompt).not.toContain('CORPUS CHUNKS');
  });

  it('should work with no style prompt', () => {
    const opts = { ...baseOptions, stylePrompt: '' };
    const prompt = buildGoldStandardPrompt(opts);
    expect(prompt).toBeTruthy();
    expect(prompt).not.toContain('## STYLE PROFILE');
  });
});

// ============================================================================
// assignSourcesToSections
// ============================================================================

describe('assignSourcesToSections', () => {
  it('should assign sources based on term overlap', () => {
    const result = assignSourcesToSections(
      ['Motion and Physics', 'Rhetoric and Persuasion'],
      sampleChunks
    );
    expect(result.size).toBeGreaterThan(0);
    // Section about motion should map to Aristotle's Physics
    const motionSources = result.get(0);
    expect(motionSources).toBeDefined();
    expect(motionSources!.some(s => s.includes('Aristotle'))).toBe(true);
  });

  it('should return empty map for empty chunks', () => {
    const result = assignSourcesToSections(['Section 1'], []);
    expect(result.size).toBe(0);
  });

  it('should limit to 3 sources per section', () => {
    const manyChunks = Array.from({ length: 20 }, (_, i) =>
      makeChunk(`Author${i}`, `Title${i}`, 'motion kinesis time', 0.5 + i * 0.01)
    );
    const result = assignSourcesToSections(['Motion and Time'], manyChunks);
    const sources = result.get(0);
    if (sources) {
      expect(sources.length).toBeLessThanOrEqual(3);
    }
  });
});

// ============================================================================
// buildGoldStandardChunkBlock
// ============================================================================

describe('buildGoldStandardChunkBlock', () => {
  it('should produce a formatted chunk block', () => {
    const block = buildGoldStandardChunkBlock(sampleChunks);
    expect(block).toContain('CORPUS CHUNKS');
    expect(block).toContain('Source Index');
    expect(block).toContain('CHUNK 1');
  });

  it('should group chunks by source', () => {
    const block = buildGoldStandardChunkBlock(sampleChunks);
    expect(block).toContain('SOURCE: Aristotle, *Physics*');
    expect(block).toContain('SOURCE: Burke, Kenneth, *A Grammar of Motives*');
  });

  it('should include page references', () => {
    const block = buildGoldStandardChunkBlock(sampleChunks);
    expect(block).toContain('pp. 17-18');
  });

  it('should handle empty chunks', () => {
    const block = buildGoldStandardChunkBlock([]);
    expect(block).toContain('Total corpus chunks provided: 0');
  });
});

// ============================================================================
// stripBareApaParentheticals
// ============================================================================

describe('stripBareApaParentheticals', () => {
  it('should strip (Author Year)', () => {
    const result = stripBareApaParentheticals('Some text (Hawhee 2011) more text.');
    expect(result.strippedCount).toBe(1);
    expect(result.content).not.toContain('Hawhee 2011');
    expect(result.content).toContain('Some text');
    expect(result.content).toContain('more text.');
  });

  it('should strip (Author, Year)', () => {
    const result = stripBareApaParentheticals('Some text (Burke, 2015) more text.');
    expect(result.strippedCount).toBe(1);
    expect(result.stripped[0]).toContain('Burke');
  });

  it('should strip (Author Year)[ref] with endnote marker', () => {
    const result = stripBareApaParentheticals('Some text (Hawhee 2011)[13] more text.');
    expect(result.strippedCount).toBe(1);
    expect(result.content).not.toContain('[13]');
  });

  it('should strip (Author Year, p. X)', () => {
    const result = stripBareApaParentheticals('Some text (Author 2020, p. 45) more text.');
    expect(result.strippedCount).toBe(1);
  });

  it('should NOT strip MLA citations with title (contains *)', () => {
    const result = stripBareApaParentheticals('Some text (Aristotle, *Physics*, p. 17) more text.');
    expect(result.strippedCount).toBe(0);
    expect(result.content).toContain('Aristotle, *Physics*, p. 17');
  });

  it('should NOT strip MLA citations with quoted title', () => {
    const result = stripBareApaParentheticals('Some text (Burke, "A Grammar," p. 5) more text.');
    expect(result.strippedCount).toBe(0);
  });

  it('should strip multiple APA citations in one text', () => {
    const text = 'First (Hawhee 2011) and second (Burke 2015) citation.';
    const result = stripBareApaParentheticals(text);
    expect(result.strippedCount).toBe(2);
  });

  it('should clean up double spaces after removal', () => {
    const result = stripBareApaParentheticals('Word (Hawhee 2011) next.');
    expect(result.content).not.toContain('  ');
  });

  it('should handle text with no APA citations', () => {
    const text = 'Clean text without any citations at all.';
    const result = stripBareApaParentheticals(text);
    expect(result.strippedCount).toBe(0);
    expect(result.content).toBe(text);
  });

  it('should handle et al. citations', () => {
    const result = stripBareApaParentheticals('Some text (Smith et al. 2020) more.');
    expect(result.strippedCount).toBe(1);
  });
});
