/**
 * Prompt Builder Engine — generates structured, validation-ready academic prompts.
 *
 * Converts a user's research question + source selections + strictness config
 * into a fully structured prompt matching the `motion and time prompt.tex` format.
 *
 * Four sections assembled in order:
 *   1. Critical Rules
 *   2. Topic
 *   3. Required Structure
 *   4. Final Instruction
 *
 * Note: Validation Appendix and Quality Gauntlet were removed because the
 * god-write pipeline handles these automatically. Asking the LLM to self-validate
 * wastes tokens on unreliable self-assessment.
 *
 * @module prompt-builder-engine
 */

/** Strictness level for prompt builder rules */
export type StrictnessLevel = 'strict' | 'moderate' | 'permissive';

/** Configuration for building a structured prompt */
export interface PromptBuilderConfig {
  prompt: string;
  wordCount?: string;
  draftCategory?: string;
  primarySources?: Array<{ author: string; title: string }>;
  secondarySources: Array<{ author: string; title: string }>;
  searchAll?: boolean;
  strictness: {
    quotation: StrictnessLevel;
    citation: StrictnessLevel;
    unsupported_claims: StrictnessLevel;
  };
  includeValidationAppendix?: boolean;
  includeQualityGauntlet?: boolean;
  outputFormat?: string;
  sections?: PromptBuilderSection[];
  structureSections?: string[];
  corpusFolder?: string;
}

/** A single section of the built prompt */
export interface PromptBuilderSection {
  title: string;
  instructions: string[];
  citationsRequired: boolean;
  minQuotations: number;
  name?: string;
  content?: string;
}

/** Result from the prompt builder */
export interface PromptBuilderResult {
  prompt: string;
  sections: PromptBuilderSection[];
  strictness: PromptBuilderConfig['strictness'];
  metadata: {
    wordCount?: string;
    draftCategory?: string;
    primarySourceCount: number;
    secondarySourceCount: number;
    sectionCount: number;
    outputFormat?: string;
  };
  fullPrompt?: string;
  tokenEstimate?: number;
}

// =============================================================================
// STRICTNESS PRESETS
// =============================================================================

export interface StrictnessPreset {
  quotation: StrictnessLevel;
  citation: StrictnessLevel;
  unsupported_claims: StrictnessLevel;
  includeValidationAppendix: boolean;
  includeQualityGauntlet: boolean;
}

export const STRICTNESS_PRESETS: Record<string, StrictnessPreset> = {
  strict: {
    quotation: 'strict',
    citation: 'strict',
    unsupported_claims: 'strict',
    includeValidationAppendix: true,
    includeQualityGauntlet: true,
  },
  moderate: {
    quotation: 'moderate',
    citation: 'moderate',
    unsupported_claims: 'moderate',
    includeValidationAppendix: true,
    includeQualityGauntlet: false,
  },
  permissive: {
    quotation: 'permissive',
    citation: 'permissive',
    unsupported_claims: 'permissive',
    includeValidationAppendix: false,
    includeQualityGauntlet: false,
  },
};

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export function createDefaultConfig(prompt: string): PromptBuilderConfig {
  return {
    prompt,
    wordCount: '2000',
    draftCategory: 'section',
    primarySources: [],
    secondarySources: [],
    searchAll: true,
    strictness: { ...STRICTNESS_PRESETS.strict },
    includeValidationAppendix: true,
    includeQualityGauntlet: true,
    outputFormat: 'tex',
  };
}

// =============================================================================
// SECTION 1: CRITICAL RULES
// =============================================================================

function buildCriticalRules(config: PromptBuilderConfig): string {
  const { strictness } = config;
  const lines: string[] = [];

  lines.push('Critical Rules (must be followed)');

  // Rule 1: Corpus sourcing
  const sourcingRules: Record<StrictnessLevel, string> = {
    strict: 'Use ONLY the local corpus.',
    moderate: 'Prefer the local corpus. Note when external sources are used.',
    permissive: 'Use the local corpus as the primary source. External sources are allowed when corpus evidence is insufficient.',
  };
  lines.push(`    1. ${sourcingRules[strictness.quotation]}`);
  lines.push('        1.a. Do not cite or quote any source that is not present in the local ChromaDB corpus.');

  // Rule 2: Citation verification (pipeline handles this automatically via --inline-enable-citation-lookup)
  const lookupRules: Record<StrictnessLevel, string> = {
    strict: 'Every citation must reference a source present in the local corpus. The pipeline will verify all citations automatically.',
    moderate: 'Citations should reference sources present in the local corpus. The pipeline will verify citations automatically.',
    permissive: 'Prefer citations to sources present in the local corpus when possible.',
  };
  lines.push(`    2. ${lookupRules[strictness.citation]}`);

  // Rule 3: Citation mandate
  const citationRules: Record<StrictnessLevel, string> = {
    strict: 'Every factual, historical, or interpretive claim that requires support must be cited.',
    moderate: 'Every factual or historical claim must be cited. Interpretive claims should be cited where possible.',
    permissive: 'Direct factual claims must be cited. Interpretive claims may stand with appropriate hedging.',
  };
  lines.push(`    3. ${citationRules[strictness.citation]}`);

  // Rule 4: Verbatim quotation
  const quotationRules: Record<StrictnessLevel, string> = {
    strict: 'Quoted material must be copied VERBATIM from the corpus.',
    moderate: 'Quoted material should closely match the corpus text. Minor OCR discrepancies are acceptable.',
    permissive: 'Quotations should be faithful to the source. Paraphrasing with citation is acceptable.',
  };
  lines.push(`    4. ${quotationRules[strictness.quotation]}`);
  if (strictness.quotation === 'strict' || strictness.quotation === 'moderate') {
    lines.push('        4.a. If you cannot find an exact quotation, paraphrase WITHOUT quotation marks and cite the source.');
  }

  // Rule 5: No invented citations (always zero tolerance)
  lines.push('    5. Do not invent citations, page numbers, or quotations.');

  // Rule 6: Unsupported claims
  const unsupportedRules: Record<StrictnessLevel, string[]> = {
    strict: [
      'If a claim cannot be supported by the corpus, either:',
      '        6.a. weaken it (qualify it as interpretive/speculative), or',
      '        6.b. omit it entirely.',
    ],
    moderate: [
      'If a claim cannot be supported by the corpus, either:',
      '        6.a. weaken it (qualify it as interpretive/speculative),',
      '        6.b. note the limitation explicitly, or',
      '        6.c. omit it.',
    ],
    permissive: [
      'If a claim cannot be supported by the corpus:',
      '        6.a. use appropriate hedge language (e.g., "it may be argued that..."), and',
      '        6.b. proceed with the argument.',
    ],
  };
  lines.push(`    6. ${unsupportedRules[strictness.unsupported_claims][0]}`);
  for (let i = 1; i < unsupportedRules[strictness.unsupported_claims].length; i++) {
    lines.push(unsupportedRules[strictness.unsupported_claims][i]);
  }

  return lines.join('\n');
}

// =============================================================================
// SECTION 2: TOPIC
// =============================================================================

function buildTopicSection(config: PromptBuilderConfig): string {
  const lines: string[] = [];

  lines.push('Topic');

  // Split the user's prompt into sentences and format as numbered instructions
  const promptSentences = config.prompt
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (promptSentences.length === 1) {
    lines.push(`    1. ${promptSentences[0]}`);
  } else {
    // Group into a single numbered item with sub-items
    lines.push(`    1. ${promptSentences[0]}`);
    for (let i = 1; i < promptSentences.length; i++) {
      const subLabel = String.fromCharCode(96 + i); // a, b, c, ...
      lines.push(`        1.${subLabel}. ${promptSentences[i]}`);
    }
  }

  // Add explicit instructions for secondary sources
  if (config.secondarySources.length > 0) {
    const nextNum = 2;
    for (let i = 0; i < config.secondarySources.length; i++) {
      const src = config.secondarySources[i];
      const num = nextNum + i;
      lines.push(
        `    ${num}. Additionally, explicitly engage ${src.author}'s ${src.title}, ` +
        `including several verbatim quotations from that work, if relevant to the topic.`
      );
    }
  }

  return lines.join('\n');
}

// =============================================================================
// SECTION 3: REQUIRED STRUCTURE
// =============================================================================

function buildRequiredStructure(config: PromptBuilderConfig): string {
  const lines: string[] = [];
  const sections = config.sections || [];

  if (sections.length === 0) {
    lines.push('Required Structure');
    lines.push(`Generate a cohesive ${config.draftCategory}.`);
    return lines.join('\n');
  }

  lines.push('Required Structure');
  lines.push('Organize the text into the following units:');

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const num = i + 1;
    lines.push(`    ${num}. ${sec.title}`);

    for (let j = 0; j < sec.instructions.length; j++) {
      const subLabel = String.fromCharCode(97 + j); // a, b, c, ...
      lines.push(`        ${num}.${subLabel}. ${sec.instructions[j]}`);
    }

    if (sec.citationsRequired) {
      const subLabel = String.fromCharCode(97 + sec.instructions.length);
      lines.push(`        ${num}.${subLabel}. Citations are mandatory for claims in this section.`);
    }

    if (sec.minQuotations > 0) {
      const subLabel = String.fromCharCode(97 + sec.instructions.length + (sec.citationsRequired ? 1 : 0));
      lines.push(
        `        ${num}.${subLabel}. Include at least ${sec.minQuotations} verbatim ` +
        `quotation${sec.minQuotations > 1 ? 's' : ''} if supported by the corpus.`
      );
    }
  }

  return lines.join('\n');
}

// =============================================================================
// SECTION 4: VALIDATION TRANSPARENCY REQUIREMENT
// (Removed — the god-write pipeline handles validation, citation enforcement,
// and quality gauntlet checks automatically. Asking the LLM to self-validate
// wastes tokens on unreliable self-assessment.)
// =============================================================================

// =============================================================================
// SECTION 5: FINAL INSTRUCTION
// =============================================================================

function buildFinalInstruction(config: PromptBuilderConfig): string {
  const lines: string[] = [];
  const isStrict = config.strictness.quotation === 'strict' ||
                   config.strictness.citation === 'strict';

  lines.push('Final Instruction');

  let num = 1;
  if (isStrict) {
    lines.push(`    ${num}. If a paragraph cannot be supported by the corpus, it is preferable to produce a weaker claim or a placeholder rather than include unsupported content.`);
    num++;
  }

  lines.push(`    ${num}. Focus entirely on producing the best possible scholarly prose. Citation verification, quality assessment, and validation are handled automatically by the pipeline.`);
  num++;

  lines.push(`    ${num}. Present the output as the generated text only. Do not include self-assessment, claim inventories, or quality reports — the pipeline produces these independently.`);
  num++;

  lines.push(`    ${num}. Introduce each quotation with a signal phrase, provide the quotation in quotation marks, and follow with analysis. Do not drop quotations without commentary.`);
  num++;

  lines.push(`    ${num}. Maintain philosophical sophistication and argumentative depth. The goal is dissertation-grade analysis, not summary.`);

  return lines.join('\n');
}

// =============================================================================
// PREAMBLE
// =============================================================================

function buildPreamble(config: PromptBuilderConfig): string {
  const categoryLabel = config.draftCategory === 'section' ? 'a scholarly, dissertation-grade academic text'
    : config.draftCategory === 'chapter' ? 'a scholarly, dissertation-grade chapter'
    : config.draftCategory === 'paper' ? 'a scholarly academic paper'
    : config.draftCategory === 'essay' ? 'a scholarly academic essay'
    : config.draftCategory === 'article' ? 'a scholarly academic article'
    : config.draftCategory === 'report' ? 'a scholarly academic report'
    : 'a scholarly academic text';

  return `You are generating ${categoryLabel} under strict validation constraints.`;
}

// =============================================================================
// MAIN BUILD FUNCTION
// =============================================================================

/**
 * Build a structured academic prompt from the given configuration.
 *
 * Assembles four sections in order:
 *   1. Critical Rules (configurable strictness)
 *   2. Topic (from user prompt)
 *   3. Required Structure (sections)
 *   4. Final Instruction
 */
export function buildPrompt(config: PromptBuilderConfig): PromptBuilderResult {
  const parts: string[] = [];

  // Preamble
  parts.push(buildPreamble(config));
  parts.push('');

  // Section 1: Critical Rules
  parts.push(buildCriticalRules(config));
  parts.push('');

  // Section 2: Topic
  parts.push(buildTopicSection(config));
  parts.push('');

  // Section 3: Required Structure
  parts.push(buildRequiredStructure(config));
  parts.push('');

  // Section 4: Validation Transparency Requirement — removed (pipeline handles validation)

  // Section 5: Final Instruction
  parts.push(buildFinalInstruction(config));

  const prompt = parts.join('\n');
  const sections = config.sections || [];

  return {
    prompt,
    sections,
    strictness: config.strictness,
    metadata: {
      wordCount: config.wordCount,
      draftCategory: config.draftCategory,
      primarySourceCount: config.primarySources?.length ?? 0,
      secondarySourceCount: config.secondarySources.length,
      sectionCount: sections.length,
      outputFormat: config.outputFormat,
    },
  };
}

/**
 * Apply a strictness preset to a config, returning a new config.
 */
export function applyStrictnessPreset(
  config: PromptBuilderConfig,
  preset: keyof typeof STRICTNESS_PRESETS,
): PromptBuilderConfig {
  const p = STRICTNESS_PRESETS[preset];
  if (!p) return config;
  return {
    ...config,
    strictness: {
      quotation: p.quotation,
      citation: p.citation,
      unsupported_claims: p.unsupported_claims,
    },
    includeValidationAppendix: p.includeValidationAppendix,
    includeQualityGauntlet: p.includeQualityGauntlet,
  };
}

/**
 * Generate default sections from a prompt using simple heuristic decomposition.
 * For LLM-powered decomposition, use the ICP PromptDecomposer instead.
 */
export function generateDefaultSections(prompt: string, draftCategory: string): PromptBuilderSection[] {
  // Simple heuristic: create Introduction, Main Body, and Conclusion
  const sections: PromptBuilderSection[] = [];

  if (draftCategory === 'chapter' || draftCategory === 'paper') {
    sections.push({
      title: 'Introduction',
      instructions: ['Introduce the central question and scope of the analysis.', 'Provide necessary background context.'],
      citationsRequired: false,
      minQuotations: 0,
    });
    sections.push({
      title: 'Literature and Context',
      instructions: ['Survey existing scholarly work relevant to the topic.', 'Identify key debates and positions.'],
      citationsRequired: true,
      minQuotations: 2,
    });
    sections.push({
      title: 'Analysis',
      instructions: ['Present the central argument with textually grounded claims.', 'Support claims with verbatim quotations where possible.'],
      citationsRequired: true,
      minQuotations: 3,
    });
    sections.push({
      title: 'Discussion',
      instructions: ['Interpret findings in relation to the broader scholarly context.', 'Address potential counterarguments.'],
      citationsRequired: true,
      minQuotations: 1,
    });
    sections.push({
      title: 'Conclusion',
      instructions: ['Summarize without introducing new unsupported claims.', 'Prefer synthesis over new factual assertions.'],
      citationsRequired: false,
      minQuotations: 0,
    });
  } else {
    // section / essay / article / report
    sections.push({
      title: 'Introduction',
      instructions: ['Introduce the central question and scope.'],
      citationsRequired: false,
      minQuotations: 0,
    });
    sections.push({
      title: 'Main Argument',
      instructions: ['Present the central argument with textually grounded claims.', 'Support claims with verbatim quotations where possible.'],
      citationsRequired: true,
      minQuotations: 2,
    });
    sections.push({
      title: 'Conclusion',
      instructions: ['Summarize without introducing new unsupported claims.', 'Prefer synthesis over new factual assertions.'],
      citationsRequired: false,
      minQuotations: 0,
    });
  }

  return sections;
}
