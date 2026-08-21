/**
 * Tests for Prompt Builder Engine
 *
 * Covers:
 * - All three strictness presets (strict, moderate, permissive)
 * - Source injection (primary, secondary, none)
 * - Manual vs auto sections
 * - Validation appendix inclusion/exclusion
 * - Quality Gauntlet inclusion/exclusion
 * - Output format variations
 * - Edge cases (empty prompt, no sources, single section)
 * - Default config creation
 * - Preset application
 * - Default section generation
 */

import { describe, it, expect } from 'vitest';
import {
  buildPrompt,
  createDefaultConfig,
  applyStrictnessPreset,
  generateDefaultSections,
  STRICTNESS_PRESETS,
} from '../../../../src/god-agent/core/composition/prompt-builder-engine.js';
import type {
  PromptBuilderConfig,
  PromptBuilderSection,
} from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeConfig(overrides: Partial<PromptBuilderConfig> = {}): PromptBuilderConfig {
  return {
    prompt: 'Analyze the role of phantasia in Aristotle\'s De Anima.',
    wordCount: '2000',
    draftCategory: 'section',
    primarySources: [],
    secondarySources: [],
    searchAll: true,
    strictness: {
      quotation: 'strict',
      citation: 'strict',
      unsupported_claims: 'strict',
    },
    includeValidationAppendix: true,
    includeQualityGauntlet: true,
    outputFormat: 'tex',
    ...overrides,
  };
}

function makeSections(): PromptBuilderSection[] {
  return [
    {
      title: 'Aristotle on Motion',
      instructions: ['Focus on Physics III (definition of motion).'],
      citationsRequired: true,
      minQuotations: 1,
    },
    {
      title: 'Aristotle on Time',
      instructions: [
        'Focus on Physics IV (time as number/measure of motion).',
        'Clearly articulate the dependence relation between motion and time.',
      ],
      citationsRequired: true,
      minQuotations: 0,
    },
    {
      title: 'Conclusion',
      instructions: ['Summarize without introducing new unsupported claims.'],
      citationsRequired: false,
      minQuotations: 0,
    },
  ];
}

// =============================================================================
// BASIC OUTPUT STRUCTURE
// =============================================================================

describe('PromptBuilderEngine', () => {
  describe('buildPrompt - basic structure', () => {
    it('should return a PromptBuilderResult with all fields', () => {
      const config = makeConfig();
      const result = buildPrompt(config);

      expect(result).toHaveProperty('prompt');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('strictness');
      expect(result).toHaveProperty('metadata');
      expect(typeof result.prompt).toBe('string');
      expect(result.prompt.length).toBeGreaterThan(0);
    });

    it('should include the preamble', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).toContain('You are generating');
      expect(result.prompt).toContain('validation constraints');
    });

    it('should include Critical Rules section', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).toContain('Critical Rules (must be followed)');
    });

    it('should include Topic section', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).toContain('Topic');
      expect(result.prompt).toContain('Analyze the role of phantasia');
    });

    it('should include Required Structure section', () => {
      const result = buildPrompt(makeConfig({ sections: makeSections() }));
      expect(result.prompt).toContain('Required Structure');
      expect(result.prompt).toContain('Aristotle on Motion');
    });

    it('should not include Validation Appendix (pipeline handles validation)', () => {
      const result = buildPrompt(makeConfig({ includeValidationAppendix: true }));
      expect(result.prompt).not.toContain('Validation Transparency Requirement');
      expect(result.prompt).not.toContain('Claim Map');
      expect(result.prompt).not.toContain('Quotation Ledger');
    });

    it('should include Final Instruction section', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).toContain('Final Instruction');
    });
  });

  // ===========================================================================
  // STRICTNESS PRESETS
  // ===========================================================================

  describe('buildPrompt - strict preset', () => {
    it('should enforce ONLY local corpus rule', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' } }));
      expect(result.prompt).toContain('Use ONLY the local corpus');
    });

    it('should state pipeline verifies citations automatically (strict)', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' } }));
      expect(result.prompt).toContain('Every citation must reference a source present in the local corpus');
      expect(result.prompt).toContain('pipeline will verify all citations automatically');
    });

    it('should require verbatim quotation from corpus', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' } }));
      expect(result.prompt).toContain('Quoted material must be copied VERBATIM');
    });

    it('should include paraphrase fallback rule', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' } }));
      expect(result.prompt).toContain('paraphrase WITHOUT quotation marks');
    });

    it('should require weakening or omitting unsupported claims', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' } }));
      expect(result.prompt).toContain('weaken it');
      expect(result.prompt).toContain('omit it entirely');
    });

    it('should include placeholder-over-unsupported instruction in Final Instruction', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' } }));
      expect(result.prompt).toContain('preferable to produce a weaker claim or a placeholder');
    });
  });

  describe('buildPrompt - moderate preset', () => {
    it('should prefer corpus with external note', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'moderate', citation: 'moderate', unsupported_claims: 'moderate' } }));
      expect(result.prompt).toContain('Prefer the local corpus');
    });

    it('should state pipeline verifies citations automatically (moderate)', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'moderate', citation: 'moderate', unsupported_claims: 'moderate' } }));
      expect(result.prompt).toContain('Citations should reference sources present in the local corpus');
      expect(result.prompt).toContain('pipeline will verify citations automatically');
    });

    it('should accept close match for quotations', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'moderate', citation: 'moderate', unsupported_claims: 'moderate' } }));
      expect(result.prompt).toContain('closely match the corpus text');
    });

    it('should allow noting limitations for unsupported claims', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'moderate', citation: 'moderate', unsupported_claims: 'moderate' } }));
      expect(result.prompt).toContain('note the limitation explicitly');
    });
  });

  describe('buildPrompt - permissive preset', () => {
    it('should allow external sources when corpus insufficient', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'permissive', citation: 'permissive', unsupported_claims: 'permissive' } }));
      expect(result.prompt).toContain('External sources are allowed');
    });

    it('should prefer corpus citations when possible (permissive)', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'permissive', citation: 'permissive', unsupported_claims: 'permissive' } }));
      expect(result.prompt).toContain('Prefer citations to sources present in the local corpus when possible');
    });

    it('should accept paraphrasing with citation', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'permissive', citation: 'permissive', unsupported_claims: 'permissive' } }));
      expect(result.prompt).toContain('Paraphrasing with citation is acceptable');
    });

    it('should not include paraphrase fallback sub-rule', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'permissive', citation: 'permissive', unsupported_claims: 'permissive' } }));
      expect(result.prompt).not.toContain('paraphrase WITHOUT quotation marks');
    });

    it('should allow hedge language for unsupported claims', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'permissive', citation: 'permissive', unsupported_claims: 'permissive' } }));
      expect(result.prompt).toContain('hedge language');
    });

    it('should not include placeholder instruction for permissive', () => {
      const config = makeConfig({
        strictness: { quotation: 'permissive', citation: 'permissive', unsupported_claims: 'permissive' },
      });
      const result = buildPrompt(config);
      expect(result.prompt).not.toContain('preferable to produce a weaker claim or a placeholder');
    });
  });

  // ===========================================================================
  // ZERO TOLERANCE (always)
  // ===========================================================================

  describe('buildPrompt - invariant rules', () => {
    it('should always include zero tolerance for invented citations (strict)', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' } }));
      expect(result.prompt).toContain('Do not invent citations');
    });

    it('should always include zero tolerance for invented citations (permissive)', () => {
      const result = buildPrompt(makeConfig({ strictness: { quotation: 'permissive', citation: 'permissive', unsupported_claims: 'permissive' } }));
      expect(result.prompt).toContain('Do not invent citations');
    });

    it('should always include corpus-only source restriction', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).toContain('Do not cite or quote any source that is not present in the local ChromaDB corpus');
    });
  });

  // ===========================================================================
  // SOURCE INJECTION
  // ===========================================================================

  describe('buildPrompt - source injection', () => {
    it('should include secondary source engagement instruction', () => {
      const config = makeConfig({
        secondarySources: [{ author: 'Heidegger', title: 'Basic Concepts of Aristotelian Philosophy' }],
      });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('Heidegger');
      expect(result.prompt).toContain('Basic Concepts of Aristotelian Philosophy');
      expect(result.prompt).toContain('verbatim quotations from that work');
    });

    it('should include multiple secondary sources', () => {
      const config = makeConfig({
        secondarySources: [
          { author: 'Heidegger', title: 'Being and Time' },
          { author: 'Derrida', title: 'Of Grammatology' },
        ],
      });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('Heidegger');
      expect(result.prompt).toContain('Derrida');
    });

    it('should not include secondary source section when none specified', () => {
      const config = makeConfig({ secondarySources: [] });
      const result = buildPrompt(config);
      expect(result.prompt).not.toContain('Additionally, explicitly engage');
    });

    it('should report primary/secondary source counts in metadata', () => {
      const config = makeConfig({
        primarySources: [
          { author: 'Aristotle', title: 'Physics' },
          { author: 'Aristotle', title: 'De Anima' },
        ],
        secondarySources: [{ author: 'Heidegger', title: 'Basic Concepts' }],
      });
      const result = buildPrompt(config);
      expect(result.metadata.primarySourceCount).toBe(2);
      expect(result.metadata.secondarySourceCount).toBe(1);
    });
  });

  // ===========================================================================
  // SECTIONS
  // ===========================================================================

  describe('buildPrompt - sections', () => {
    it('should format manual sections with numbered structure', () => {
      const config = makeConfig({ sections: makeSections() });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('1. Aristotle on Motion');
      expect(result.prompt).toContain('2. Aristotle on Time');
      expect(result.prompt).toContain('3. Conclusion');
    });

    it('should include sub-instructions', () => {
      const config = makeConfig({ sections: makeSections() });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('Focus on Physics III');
      expect(result.prompt).toContain('Focus on Physics IV');
    });

    it('should include citation-mandatory note for sections that require it', () => {
      const config = makeConfig({ sections: makeSections() });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('Citations are mandatory');
    });

    it('should include min quotations instruction', () => {
      const config = makeConfig({ sections: makeSections() });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('at least 1 verbatim quotation');
    });

    it('should handle no sections gracefully', () => {
      const config = makeConfig({ sections: undefined });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('Generate a cohesive section');
    });

    it('should return sections in result', () => {
      const sections = makeSections();
      const config = makeConfig({ sections });
      const result = buildPrompt(config);
      expect(result.sections).toEqual(sections);
      expect(result.metadata.sectionCount).toBe(3);
    });

    it('should return empty sections array when none provided', () => {
      const config = makeConfig();
      const result = buildPrompt(config);
      expect(result.sections).toEqual([]);
      expect(result.metadata.sectionCount).toBe(0);
    });
  });

  // ===========================================================================
  // QUALITY GAUNTLET
  // ===========================================================================

  describe('buildPrompt - pipeline-managed validation (removed from prompt)', () => {
    it('should not include Quality Gauntlet in prompt (pipeline handles it)', () => {
      const result = buildPrompt(makeConfig({ includeQualityGauntlet: true }));
      expect(result.prompt).not.toContain('Quality Gauntlet Results');
    });

    it('should not include Claim inventory in prompt (pipeline handles it)', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).not.toContain('Claim inventory');
    });

    it('should not include Quote inventory in prompt (pipeline handles it)', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).not.toContain('Quote inventory');
    });

    it('should instruct LLM to focus on scholarly prose, not self-assessment', () => {
      const result = buildPrompt(makeConfig());
      expect(result.prompt).toContain('Focus entirely on producing the best possible scholarly prose');
      expect(result.prompt).toContain('Do not include self-assessment');
    });
  });

  // ===========================================================================
  // DRAFT CATEGORY
  // ===========================================================================

  describe('buildPrompt - draft categories', () => {
    it('should label section drafts correctly', () => {
      const result = buildPrompt(makeConfig({ draftCategory: 'section' }));
      expect(result.prompt).toContain('dissertation-grade academic text');
    });

    it('should label chapter drafts correctly', () => {
      const result = buildPrompt(makeConfig({ draftCategory: 'chapter' }));
      expect(result.prompt).toContain('dissertation-grade chapter');
    });

    it('should label paper drafts correctly', () => {
      const result = buildPrompt(makeConfig({ draftCategory: 'paper' }));
      expect(result.prompt).toContain('scholarly academic paper');
    });

    it('should label essay drafts correctly', () => {
      const result = buildPrompt(makeConfig({ draftCategory: 'essay' }));
      expect(result.prompt).toContain('scholarly academic essay');
    });

    it('should label article drafts correctly', () => {
      const result = buildPrompt(makeConfig({ draftCategory: 'article' }));
      expect(result.prompt).toContain('scholarly academic article');
    });

    it('should label report drafts correctly', () => {
      const result = buildPrompt(makeConfig({ draftCategory: 'report' }));
      expect(result.prompt).toContain('scholarly academic report');
    });

    it('should report draft category in metadata', () => {
      const result = buildPrompt(makeConfig({ draftCategory: 'chapter' }));
      expect(result.metadata.draftCategory).toBe('chapter');
    });
  });

  // ===========================================================================
  // WORD COUNT
  // ===========================================================================

  describe('buildPrompt - word count (controlled by --length flag, not prompt)', () => {
    it('should not embed word count in Required Structure', () => {
      const config = makeConfig({ wordCount: '4000-8000', sections: makeSections() });
      const result = buildPrompt(config);
      expect(result.prompt).not.toContain('approximately 4000-8000 words');
      expect(result.prompt).toContain('Organize the text into the following units');
    });

    it('should still report word count in metadata for reference', () => {
      const result = buildPrompt(makeConfig({ wordCount: '1000-2000' }));
      expect(result.metadata.wordCount).toBe('1000-2000');
    });
  });

  // ===========================================================================
  // MIXED STRICTNESS
  // ===========================================================================

  describe('buildPrompt - mixed strictness', () => {
    it('should support strict quotation + permissive citation', () => {
      const config = makeConfig({
        strictness: { quotation: 'strict', citation: 'permissive', unsupported_claims: 'moderate' },
      });
      const result = buildPrompt(config);
      // Strict quotation rule
      expect(result.prompt).toContain('VERBATIM');
      // Permissive citation rule
      expect(result.prompt).toContain('Prefer citations to sources present in the local corpus when possible');
      // Moderate unsupported claims
      expect(result.prompt).toContain('note the limitation explicitly');
    });

    it('should include placeholder instruction if any dimension is strict', () => {
      const config = makeConfig({
        strictness: { quotation: 'strict', citation: 'permissive', unsupported_claims: 'permissive' },
      });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('preferable to produce a weaker claim or a placeholder');
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('buildPrompt - edge cases', () => {
    it('should handle a single-sentence prompt', () => {
      const config = makeConfig({ prompt: 'What is phantasia?' });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('What is phantasia?');
    });

    it('should handle a multi-sentence prompt', () => {
      const config = makeConfig({
        prompt: 'Analyze Aristotle on motion. Discuss time. Explore perception.',
      });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('Analyze Aristotle on motion.');
      expect(result.prompt).toContain('Discuss time.');
      expect(result.prompt).toContain('Explore perception.');
    });

    it('should handle empty sections array', () => {
      const config = makeConfig({ sections: [] });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('Generate a cohesive section');
      expect(result.sections).toEqual([]);
    });

    it('should handle section with no instructions', () => {
      const config = makeConfig({
        sections: [{
          title: 'Empty Section',
          instructions: [],
          citationsRequired: false,
          minQuotations: 0,
        }],
      });
      const result = buildPrompt(config);
      expect(result.prompt).toContain('1. Empty Section');
    });
  });

  // ===========================================================================
  // createDefaultConfig
  // ===========================================================================

  describe('createDefaultConfig', () => {
    it('should create a valid config with strict defaults', () => {
      const config = createDefaultConfig('Test prompt');
      expect(config.prompt).toBe('Test prompt');
      expect(config.wordCount).toBe('2000');
      expect(config.draftCategory).toBe('section');
      expect(config.strictness.quotation).toBe('strict');
      expect(config.strictness.citation).toBe('strict');
      expect(config.strictness.unsupported_claims).toBe('strict');
      expect(config.includeValidationAppendix).toBe(true);
      expect(config.includeQualityGauntlet).toBe(true);
      expect(config.primarySources).toEqual([]);
      expect(config.secondarySources).toEqual([]);
      expect(config.searchAll).toBe(true);
    });

    it('should produce a valid prompt', () => {
      const config = createDefaultConfig('Analyze phantasia');
      const result = buildPrompt(config);
      expect(result.prompt.length).toBeGreaterThan(100);
      expect(result.prompt).toContain('Analyze phantasia');
    });
  });

  // ===========================================================================
  // applyStrictnessPreset
  // ===========================================================================

  describe('applyStrictnessPreset', () => {
    it('should apply strict preset', () => {
      const config = makeConfig();
      const updated = applyStrictnessPreset(config, 'strict');
      expect(updated.strictness.quotation).toBe('strict');
      expect(updated.includeValidationAppendix).toBe(true);
      expect(updated.includeQualityGauntlet).toBe(true);
    });

    it('should apply moderate preset', () => {
      const config = makeConfig();
      const updated = applyStrictnessPreset(config, 'moderate');
      expect(updated.strictness.quotation).toBe('moderate');
      expect(updated.strictness.citation).toBe('moderate');
      expect(updated.includeValidationAppendix).toBe(true);
      expect(updated.includeQualityGauntlet).toBe(false);
    });

    it('should apply permissive preset', () => {
      const config = makeConfig();
      const updated = applyStrictnessPreset(config, 'permissive');
      expect(updated.strictness.quotation).toBe('permissive');
      expect(updated.includeValidationAppendix).toBe(false);
      expect(updated.includeQualityGauntlet).toBe(false);
    });

    it('should preserve other config fields', () => {
      const config = makeConfig({
        prompt: 'Custom prompt',
        primarySources: [{ author: 'Aristotle', title: 'Physics' }],
      });
      const updated = applyStrictnessPreset(config, 'permissive');
      expect(updated.prompt).toBe('Custom prompt');
      expect(updated.primarySources).toEqual([{ author: 'Aristotle', title: 'Physics' }]);
    });

    it('should return unchanged config for unknown preset', () => {
      const config = makeConfig();
      const updated = applyStrictnessPreset(config, 'nonexistent' as any);
      expect(updated).toEqual(config);
    });
  });

  // ===========================================================================
  // generateDefaultSections
  // ===========================================================================

  describe('generateDefaultSections', () => {
    it('should generate 3 sections for a section draft', () => {
      const sections = generateDefaultSections('test', 'section');
      expect(sections.length).toBe(3);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[1].title).toBe('Main Argument');
      expect(sections[2].title).toBe('Conclusion');
    });

    it('should generate 5 sections for a chapter draft', () => {
      const sections = generateDefaultSections('test', 'chapter');
      expect(sections.length).toBe(5);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[1].title).toBe('Literature and Context');
      expect(sections[2].title).toBe('Analysis');
      expect(sections[3].title).toBe('Discussion');
      expect(sections[4].title).toBe('Conclusion');
    });

    it('should generate 5 sections for a paper draft', () => {
      const sections = generateDefaultSections('test', 'paper');
      expect(sections.length).toBe(5);
    });

    it('should set citationsRequired appropriately', () => {
      const sections = generateDefaultSections('test', 'chapter');
      // Introduction: no citations required
      expect(sections[0].citationsRequired).toBe(false);
      // Analysis: citations required
      expect(sections[2].citationsRequired).toBe(true);
      // Conclusion: no citations required
      expect(sections[4].citationsRequired).toBe(false);
    });

    it('should set minQuotations for analysis sections', () => {
      const sections = generateDefaultSections('test', 'chapter');
      expect(sections[2].minQuotations).toBe(3); // Analysis
      expect(sections[1].minQuotations).toBe(2); // Literature
    });
  });

  // ===========================================================================
  // STRICTNESS_PRESETS
  // ===========================================================================

  describe('STRICTNESS_PRESETS', () => {
    it('should have three presets', () => {
      expect(Object.keys(STRICTNESS_PRESETS)).toEqual(['strict', 'moderate', 'permissive']);
    });

    it('strict preset should enable both appendix and gauntlet', () => {
      expect(STRICTNESS_PRESETS.strict.includeValidationAppendix).toBe(true);
      expect(STRICTNESS_PRESETS.strict.includeQualityGauntlet).toBe(true);
    });

    it('moderate preset should enable appendix but not gauntlet', () => {
      expect(STRICTNESS_PRESETS.moderate.includeValidationAppendix).toBe(true);
      expect(STRICTNESS_PRESETS.moderate.includeQualityGauntlet).toBe(false);
    });

    it('permissive preset should disable both', () => {
      expect(STRICTNESS_PRESETS.permissive.includeValidationAppendix).toBe(false);
      expect(STRICTNESS_PRESETS.permissive.includeQualityGauntlet).toBe(false);
    });
  });

  // ===========================================================================
  // FULL INTEGRATION: MOTION AND TIME STYLE PROMPT
  // ===========================================================================

  describe('buildPrompt - integration test (motion and time style)', () => {
    it('should produce a prompt structurally similar to motion and time prompt.tex', () => {
      const config = makeConfig({
        prompt: "Articulate Aristotle's understanding of motion (kinesis), time (chronos), " +
                "the relationship between motion and time, and how aisthesis and phantasia " +
                "function within Aristotle's temporal framework.",
        wordCount: '2000',
        draftCategory: 'section',
        primarySources: [
          { author: 'Aristotle', title: 'Physics' },
          { author: 'Aristotle', title: 'De Anima' },
        ],
        secondarySources: [
          { author: 'Heidegger', title: 'Basic Concepts of Aristotelian Philosophy' },
        ],
        strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' },
        includeValidationAppendix: true,
        includeQualityGauntlet: true,
        sections: [
          {
            title: 'Aristotle on Motion',
            instructions: ['Focus on Physics III (definition of motion).', 'Include textually grounded claims and verbatim quotations.'],
            citationsRequired: true,
            minQuotations: 1,
          },
          {
            title: 'Aristotle on Time',
            instructions: ['Focus on Physics IV (time as number/measure of motion).', 'Clearly articulate the dependence relation between motion and time.', 'Citations are mandatory for definitional and dependency claims.'],
            citationsRequired: true,
            minQuotations: 0,
          },
          {
            title: 'The Relation Between Motion and Time',
            instructions: ['Explain how time depends on motion and number.', 'Inferential and conceptual claims must still be grounded in corpus sources.'],
            citationsRequired: true,
            minQuotations: 0,
          },
          {
            title: 'Aisthesis and Temporal Awareness',
            instructions: ["Explain perception's role in discriminating the 'now.'", 'Support claims with Aristotle where available.'],
            citationsRequired: true,
            minQuotations: 0,
          },
          {
            title: 'Phantasia and Temporal Unification',
            instructions: ['Explain how phantasia enables retention, anticipation, or continuity across time.', "Use citations for claims about Aristotle's psychological architecture."],
            citationsRequired: true,
            minQuotations: 0,
          },
          {
            title: "Heidegger's Interpretation of Aristotle",
            instructions: ["Engage Heidegger's reading of Aristotle on motion, time, and perception."],
            citationsRequired: true,
            minQuotations: 3,
          },
          {
            title: 'Conclusion',
            instructions: ['Summarize without introducing new unsupported claims.', 'Prefer synthesis over new factual assertions.'],
            citationsRequired: false,
            minQuotations: 0,
          },
        ],
      });

      const result = buildPrompt(config);

      // Check all 4 main sections are present (Validation Appendix removed — pipeline handles it)
      expect(result.prompt).toContain('Critical Rules (must be followed)');
      expect(result.prompt).toContain('Topic');
      expect(result.prompt).toContain('Required Structure');
      expect(result.prompt).not.toContain('Validation Transparency Requirement');
      expect(result.prompt).toContain('Final Instruction');

      // Check all 7 content sections
      expect(result.prompt).toContain('1. Aristotle on Motion');
      expect(result.prompt).toContain('2. Aristotle on Time');
      expect(result.prompt).toContain('3. The Relation Between Motion and Time');
      expect(result.prompt).toContain('4. Aisthesis and Temporal Awareness');
      expect(result.prompt).toContain('5. Phantasia and Temporal Unification');
      expect(result.prompt).toContain("6. Heidegger's Interpretation");
      expect(result.prompt).toContain('7. Conclusion');

      // Check source injection
      expect(result.prompt).toContain('Heidegger');
      expect(result.prompt).toContain('Basic Concepts of Aristotelian Philosophy');

      // Check Heidegger section has min 3 quotations
      expect(result.prompt).toContain('at least 3 verbatim quotations');

      // Check metadata
      expect(result.metadata.sectionCount).toBe(7);
      expect(result.metadata.primarySourceCount).toBe(2);
      expect(result.metadata.secondarySourceCount).toBe(1);
      expect(result.metadata.wordCount).toBe('2000');
    });
  });
});
