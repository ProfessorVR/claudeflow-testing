/**
 * Prompt Templates for god-complete-section Testing
 *
 * This module provides 8 different prompt variation templates for testing
 * which prompt structure works best with local vLLM models.
 *
 * Variations test:
 * - Instruction density (verbose vs concise)
 * - Example provision (with/without samples)
 * - Tone (formal vs conversational)
 * - Constraint explicitness
 * - Scaffolding approach
 */

import type { CorpusSuggestion } from '../quality/corpus-citation-connector.js';

export type PromptStyle =
  | 'baseline'
  | 'concise'
  | 'example-driven'
  | 'conversational'
  | 'constraint-heavy'
  | 'minimal'
  | 'question-based'
  | 'iterative'
  | 'iterative-v2'
  | 'iterative-v2.1'
  | 'iterative-v2.2';

export interface PromptParams {
  chapter: number;
  section: string;
  targetWords: number;
  dissertationContext: string;
  stylePrompt: string;
  corpusSuggestions: CorpusSuggestion[];
}

/**
 * Build prompt using selected style template
 */
export function buildPromptWithStyle(
  style: PromptStyle,
  params: PromptParams
): string {
  switch (style) {
    case 'baseline':
      return buildBaselinePrompt(params);
    case 'concise':
      return buildConcisePrompt(params);
    case 'example-driven':
      return buildExampleDrivenPrompt(params);
    case 'conversational':
      return buildConversationalPrompt(params);
    case 'constraint-heavy':
      return buildConstraintHeavyPrompt(params);
    case 'minimal':
      return buildMinimalPrompt(params);
    case 'question-based':
      return buildQuestionBasedPrompt(params);
    case 'iterative':
      return buildIterativePrompt(params);
    case 'iterative-v2':
      return buildIterativeV2Prompt(params);
    case 'iterative-v2.1':
      return buildIterativeV2_1Prompt(params);
    case 'iterative-v2.2':
      return buildIterativeV2_2Prompt(params);
    default:
      return buildBaselinePrompt(params);
  }
}

/**
 * Variation 1: Baseline (current system)
 * - Standard academic instructions
 * - Comprehensive context
 * - Explicit requirements
 */
function buildBaselinePrompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt, corpusSuggestions } = params;
  const sections: string[] = [];

  sections.push('# SECTION WRITING TASK');
  sections.push('');
  sections.push(`**Chapter:** ${chapter}`);
  sections.push(`**Section:** ${section}`);
  sections.push(`**Target Length:** ${targetWords} words`);
  sections.push('');

  if (dissertationContext) {
    sections.push(dissertationContext);
    sections.push('');
  }

  if (stylePrompt) {
    sections.push('# STYLE REQUIREMENTS');
    sections.push('');
    sections.push(stylePrompt);
    sections.push('');
  }

  if (corpusSuggestions.length > 0) {
    sections.push('# SUGGESTED SOURCES FROM CORPUS');
    sections.push('');
    sections.push('The following sources from the project corpus are relevant to this section:');
    sections.push('');

    for (const suggestion of corpusSuggestions.slice(0, 5)) {
      sections.push(`## ${suggestion.author}${suggestion.year ? ` (${suggestion.year})` : ''}`);
      sections.push(`**Title:** ${suggestion.title}`);
      sections.push(`**Relevance Score:** ${Math.round(suggestion.relevanceScore * 100)}%`);
      sections.push('');

      if (suggestion.relevantChunks.length > 0) {
        sections.push('**Relevant excerpts:**');
        for (const chunk of suggestion.relevantChunks.slice(0, 2)) {
          const excerpt = chunk.content.substring(0, 300).trim();
          sections.push(`> ${excerpt}...`);
          if (chunk.metadata.pageStart) {
            sections.push(`> (p. ${chunk.metadata.pageStart}${chunk.metadata.pageEnd ? `-${chunk.metadata.pageEnd}` : ''})`);
          }
          sections.push('');
        }
      }
      sections.push('');
    }
  }

  sections.push('# WRITING INSTRUCTIONS');
  sections.push('');
  sections.push('1. Write a scholarly section that advances the dissertation argument');
  sections.push('2. Integrate sources using proper academic citation (APA format)');
  sections.push('3. Maintain consistency with prior chapters (see context above)');
  sections.push('4. Follow the style profile strictly for voice and tone');
  sections.push('5. Define any new technical terms clearly');
  sections.push('6. Connect to the main thesis and relevant sub-theses');
  sections.push('7. Use transitions that link to prior and following sections');
  sections.push('');
  sections.push('Output the complete section content only, without meta-commentary.');

  return sections.join('\n');
}

/**
 * Variation 2: Concise
 * - Minimal scaffolding
 * - Direct imperatives
 * - Reduced context
 */
function buildConcisePrompt(params: PromptParams): string {
  const { chapter, section, targetWords, stylePrompt } = params;

  return `Write Chapter ${chapter}, Section: "${section}" (${targetWords} words).

${stylePrompt}

Requirements: Academic rigor, APA citations, doctoral-level argumentation.

Output section content only.`;
}

/**
 * Variation 3: Example-driven
 * - Includes 500-word sample
 * - Shows desired structure
 * - "Write more like this" approach
 */
function buildExampleDrivenPrompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt } = params;

  const exampleSection = `The phenomenological investigation of temporal experience reveals phantasia as the indispensable mechanism through which past, present, and future cohere within a unified experiential manifold. Aristotle's account in *De Anima* III.3 positions phantasia as neither purely sensory nor purely intellectual, but rather as the mediating capacity that preserves sensory impressions beyond their immediate presence (428a1-5). This preservation function proves crucial for Heidegger's later analysis of Dasein's temporal structure, though the connection remains underexplored in contemporary scholarship.

When Heidegger describes Dasein's being-ahead-of-itself (Sich-vorweg-sein) in *Being and Time*, he implicitly invokes a phantasmatic retention analogous to Aristotle's account. The anticipatory structure of care (Sorge) requires that Dasein maintain present access to both what-has-been (Gewesenheit) and what-is-to-come (Zukunft), a feat impossible without some mechanism of temporal synthesis (BT §65, 325-328). Phantasia, understood as the soul's capacity to hold images (*phantasmata*) of absent objects, provides precisely this mechanism.`;

  return `Write Chapter ${chapter}, Section: "${section}" (${targetWords} words).

${dissertationContext}

${stylePrompt}

EXAMPLE OF TARGET STYLE AND STRUCTURE:
${exampleSection}

Write your section following this example's depth, citation style, and argumentative rigor.

Output complete section only.`;
}

/**
 * Variation 4: Conversational
 * - Natural language framing
 * - "You are a philosopher" setup
 * - Less formal constraints
 */
function buildConversationalPrompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt } = params;

  return `You're writing a doctoral dissertation on phantasia and temporal experience. You've just finished Chapter ${chapter-1}, and now you need to write the section on "${section}" for Chapter ${chapter}.

Here's what you know so far:
${dissertationContext}

Your voice and style:
${stylePrompt}

Write approximately ${targetWords} words. Make sure to:
- Build on what you've already established
- Use rigorous academic citations (APA format)
- Define technical terms clearly
- Connect this section to your broader argument

Write the section now:`;
}

/**
 * Variation 5: Constraint-heavy
 * - Explicit dos/don'ts
 * - Detailed requirements
 * - Quality criteria spelled out
 */
function buildConstraintHeavyPrompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt, corpusSuggestions } = params;

  const sources = corpusSuggestions.slice(0, 3).map(s => `${s.author} (${s.year})`).join(', ');

  return `# DISSERTATION SECTION GENERATION

**Chapter:** ${chapter}
**Section:** "${section}"
**Target:** ${targetWords} words (±10%)

${dissertationContext}

${stylePrompt}

## REQUIRED SOURCES
Cite: ${sources || 'Primary texts as appropriate'}

## CONSTRAINTS

**MUST DO:**
- Use doctoral-level philosophical argumentation
- Cite every major claim (APA format)
- Define all technical terms on first use
- Connect to dissertation thesis explicitly
- Maintain conceptual consistency with prior chapters
- Use proper paragraph structure (150-250 words each)
- Provide textual evidence for interpretive claims
- Use transition sentences between paragraphs

**MUST NOT:**
- Introduce undefined jargon
- Make unsupported assertions
- Deviate from established terminology
- Include meta-commentary ("In this section, I will...")
- Use informal language or contractions
- Exceed ${targetWords + 250} words

## OUTPUT FORMAT
Provide only the section content. No title, no meta-discussion.`;
}

/**
 * Variation 6: Minimal
 * - Bare-bones prompt
 * - Trust model intelligence
 * - Maximum freedom
 */
function buildMinimalPrompt(params: PromptParams): string {
  const { chapter, section, targetWords } = params;

  return `Chapter ${chapter}: ${section} (${targetWords} words, doctoral philosophy, APA citations)`;
}

/**
 * Variation 7: Question-based
 * - Frames task as answering questions
 * - Guides structure via questions
 * - More directive scaffolding
 */
function buildQuestionBasedPrompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt } = params;

  return `Write a ${targetWords}-word section for Chapter ${chapter}: "${section}"

${dissertationContext}

${stylePrompt}

Structure your section by answering these questions:

1. What is the central philosophical problem this section addresses?
2. How does phantasia function in the context described?
3. What textual evidence supports this interpretation?
4. How does this connect to the broader dissertation argument?
5. What are the implications for understanding temporal experience?

Use APA citations. Write in continuous prose, not Q&A format.`;
}

/**
 * Variation 8: Iterative
 * - Two-stage approach
 * - Outline then expansion
 * - Structured development
 */
function buildIterativePrompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt } = params;

  return `STAGE 1: Create a detailed outline for Chapter ${chapter}, Section "${section}"

${dissertationContext}

Outline format:
I. Opening thesis
II. Main argument points (3-4)
III. Supporting evidence for each
IV. Conclusion/transition

---

STAGE 2: Expand outline into ${targetWords}-word section

${stylePrompt}

Requirements:
- Doctoral-level argumentation
- APA citations
- Rigorous textual analysis
- Clear conceptual progression

Write the complete section:`;
}

/**
 * Variation 9: Iterative V2 (Improved)
 * - Dialectical problem-solution structure
 * - Anti-repetition instructions
 * - Multi-source citation requirements
 * - Word allocation guidance
 * - Coined term handling
 * - Quality markers for expansion
 *
 * Improvements based on vLLM vs Opus comparison:
 * - vLLM had redundant outline/expansion (fixed with anti-repetition rules)
 * - vLLM had weak citation depth (fixed with multi-source requirements)
 * - vLLM lacked argumentative arc (fixed with dialectical structure)
 * - Opus penalized for quoted coined terms (fixed with terminology rules)
 */
function buildIterativeV2Prompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt, corpusSuggestions } = params;

  // Calculate word distribution
  const outlineWords = 300;
  const expansionWords = targetWords - outlineWords;
  const openingWords = Math.round(expansionWords * 0.15);
  const bodyWords = Math.round(expansionWords * 0.70);
  const conclusionWords = Math.round(expansionWords * 0.15);
  const pointWords = Math.round(bodyWords / 4);

  // Extract suggested sources for citation guidance
  const suggestedSources = corpusSuggestions.slice(0, 3).map(s =>
    `${s.author}${s.year ? ` (${s.year})` : ''}`
  ).join(', ');

  return `# DISSERTATION SECTION: Chapter ${chapter} - "${section}"

## STAGE 1: DIALECTICAL OUTLINE (~${outlineWords} words)

${dissertationContext}

Create a structured outline following the PROBLEM-SOLUTION ARC:

### A. The Problem/Gap
What tension, omission, or explanatory gap does this section address?
- Central claim (1 sentence)
- Why existing accounts are insufficient
- Key textual evidence identifying the gap (author, work, section/page)

### B. The Resource
What philosophical tradition, text, or concept provides tools for addressing this gap?
- Central claim (1 sentence)
- How this resource relates to the problem
- Key textual evidence (author, work, section/page)

### C. The Synthesis
What new concept, interpretation, or bridge emerges from combining A and B?
- Central claim (1 sentence)
- How this synthesis resolves the tension
- Phenomenological grounding (what this looks like experientially)

### D. The Application
How does this synthesis illuminate the dissertation's broader thesis?
- Central claim (1 sentence)
- Implications for understanding temporal experience
- Transition to next section (specific preview)

---

## STAGE 2: FULL EXPANSION (~${expansionWords} words)

${stylePrompt}

### WORD ALLOCATION
- Opening (thesis + framing): ~${openingWords} words
- Body sections A-D: ~${pointWords} words each
- Conclusion (transition): ~${conclusionWords} words
- TOTAL: ${targetWords} words (±10%)

### EXPANSION RULES (CRITICAL)
1. Stage 2 must develop NEW argumentation - do not copy Stage 1 text
2. Use outline points as topic sentences, then elaborate with new analysis
3. Each paragraph should contain substantive content not in the outline
4. The outline is a skeleton; the expansion adds flesh and argument

### CITATION REQUIREMENTS
- Cite at least 3 distinct sources (not just one author repeatedly)
- Include page/section numbers for all direct quotes: (Author, Year, p. XX)
- Include section references for interpretive claims: (De Anima III.3, 428a)
- Suggested sources: ${suggestedSources || 'Primary texts appropriate to section topic'}

### TERMINOLOGY RULES
- Introduce new/coined terms in *italics*: *phantasmatic retention*
- Do NOT use quotation marks for your own coined terms (triggers citation checker)
- Provide clear definition on first use
- Subsequent uses need no special formatting

### QUALITY MARKERS (Each expanded section must include)
1. Phenomenological description - what the experience is like
2. Textual grounding - specific passage analysis with page numbers
3. Philosophical significance - why this matters for the argument
4. Connection to thesis - explicit link to broader dissertation argument

---

## OUTPUT

Provide BOTH stages:
1. First, the complete dialectical outline (A-D structure)
2. Then, the full expanded section (continuous prose, ~${expansionWords} words)

Begin:`;
}

/**
 * Variation 9.1: Iterative V2.1 (Refined)
 * - All V2 improvements preserved
 * - Fixed meta-content output (explicit STOP boundary)
 * - Fixed citation placement (immediate post-quote format)
 * - Fixed word allocation (ranges not targets)
 * - Fixed source editions (canonical translations)
 * - Improved local vLLM compatibility
 *
 * Changes from V2:
 * - <TASK> wrapper + <STOP> boundary prevents "Review and Feedback" output
 * - Minimum word floor instead of exact targets prevents truncation
 * - Explicit citation placement: "quoted text" (Author, Year, p. XX)
 * - Canonical editions: Heidegger 1962, Bekker numbers for Aristotle
 * - Clearer output structure with explicit headers
 * - Streamlined rules to reduce over-interpretation
 */
function buildIterativeV2_1Prompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt, corpusSuggestions } = params;

  // Calculate word minimums (floors, not ceilings)
  const outlineWords = 300;
  const expansionMinWords = Math.round((targetWords - outlineWords) * 0.9);

  // Extract suggested sources for citation guidance
  const suggestedSources = corpusSuggestions.slice(0, 3).map(s =>
    `${s.author}${s.year ? ` (${s.year})` : ''}`
  ).join(', ');

  return `# DISSERTATION SECTION: Chapter ${chapter} - "${section}"

<TASK>
Generate a doctoral dissertation section in TWO stages. Output ONLY the content specified below. Do NOT include meta-commentary, review requests, feedback solicitations, or any text outside the two stages.
</TASK>

---

## STAGE 1: DIALECTICAL OUTLINE (~${outlineWords} words)

${dissertationContext}

Create a structured outline following the PROBLEM-SOLUTION ARC:

### A. The Problem/Gap
- Central claim (1 sentence)
- Why existing accounts are insufficient
- Key textual evidence (author, work, section/page)

### B. The Resource
- Central claim (1 sentence)
- How this resource addresses the problem
- Key textual evidence (author, work, section/page)

### C. The Synthesis
- Central claim (1 sentence)
- How this resolves the tension
- Phenomenological grounding (experiential description)

### D. The Application
- Central claim (1 sentence)
- Implications for temporal experience
- Transition to next section

---

## STAGE 2: FULL EXPANSION (minimum ${expansionMinWords} words)

${stylePrompt}

### LENGTH GUIDANCE
Write a complete, substantive section of at least ${expansionMinWords} words. Prioritize argumentative depth over arbitrary word limits. Each body section (A-D) should receive thorough development with multiple paragraphs.

### EXPANSION RULES
1. Stage 2 develops NEW argumentation - do not copy Stage 1 verbatim
2. Use outline points as topic sentences, then elaborate with extended analysis
3. The outline is a skeleton; the expansion adds argumentation, evidence, and phenomenological description

### CITATION FORMAT (CRITICAL)
- Use APA parenthetical format: (Author, Year, p. XX)
- Place citations IMMEDIATELY after quotes with one space: "quoted text" (Author, Year, p. 175)
- For interpretive claims use work references: (De Anima III.3, 428a) or (BT §65, 325)
- Cite at least 3 distinct sources across the section

### STANDARD EDITIONS (Use These)
- Heidegger: (Heidegger, 1962) for Being and Time (Macquarrie/Robinson translation)
- Aristotle: Use Bekker numbers, e.g., (De Anima 428a1-5)
- Husserl: (Husserl, 1991) for On the Phenomenology of the Consciousness of Internal Time
- Suggested additional sources: ${suggestedSources || 'Primary texts appropriate to topic'}

### TERMINOLOGY
- Introduce coined terms in *italics* on first use: *phantasmatic retention*
- Do NOT use quotation marks for your own coined terms
- Provide clear definition on first use

### QUALITY REQUIREMENTS
Each expanded section should include:
1. Phenomenological description - what the experience is like
2. Textual grounding - specific passage analysis with citations
3. Philosophical significance - why this matters
4. Connection to thesis - link to dissertation argument

---

## OUTPUT FORMAT

Provide BOTH stages in this exact structure:

**STAGE 1: OUTLINE**
[Your dialectical outline A-D here]

**STAGE 2: EXPANDED SECTION**
[Your continuous prose section here, minimum ${expansionMinWords} words]

<STOP>
END your response after Stage 2. Do NOT add Review, Feedback, Summary, or any other sections.
</STOP>`;
}

/**
 * Variation 9.2: Iterative V2.2 (Final Refinement)
 * - Fixes V2.1 issues: outline citation format, word count enforcement
 * - Removed STOP tag (may cause premature termination)
 * - Explicit paragraph requirements
 * - Paraphrased citations in outline (avoids quote detection)
 * - Stronger length enforcement with paragraph counting
 *
 * Changes from V2.1:
 * - Outline citations use paraphrase format (no quoted text with citations)
 * - Removed <STOP> tag that may truncate generation
 * - Added explicit paragraph count requirements (12-16 paragraphs)
 * - Changed from "minimum X words" to "MUST write X+ words"
 * - Added paragraph-level guidance for each section
 */
function buildIterativeV2_2Prompt(params: PromptParams): string {
  const { chapter, section, targetWords, dissertationContext, stylePrompt, corpusSuggestions } = params;

  // Calculate word requirements
  const outlineWords = 300;
  const expansionWords = targetWords - outlineWords;
  const minParagraphs = 12;
  const maxParagraphs = 16;

  // Extract suggested sources for citation guidance
  const suggestedSources = corpusSuggestions.slice(0, 3).map(s =>
    `${s.author}${s.year ? ` (${s.year})` : ''}`
  ).join(', ');

  return `# DISSERTATION SECTION: Chapter ${chapter} - "${section}"

<TASK>
Generate a doctoral dissertation section in TWO stages. Output ONLY the content specified below. Do NOT include meta-commentary, review requests, feedback solicitations, or additional sections.
</TASK>

---

## STAGE 1: DIALECTICAL OUTLINE (~${outlineWords} words)

${dissertationContext}

Create a structured outline following the PROBLEM-SOLUTION ARC:

### A. The Problem/Gap
- Central claim (1 sentence)
- Why existing accounts are insufficient
- Key textual evidence (paraphrase with citation): Heidegger (1962, p. XX) argues that...

### B. The Resource
- Central claim (1 sentence)
- How this resource addresses the problem
- Key textual evidence (paraphrase with citation): Husserl (1991, p. XX) describes...

### C. The Synthesis
- Central claim (1 sentence)
- How this resolves the tension
- Phenomenological grounding (experiential description)

### D. The Application
- Central claim (1 sentence)
- Implications for temporal experience
- Transition to next section

**IMPORTANT:** In the outline, do NOT use direct quotes. Paraphrase key ideas and cite them.

---

## STAGE 2: FULL EXPANSION (${expansionWords}+ words REQUIRED)

${stylePrompt}

### LENGTH REQUIREMENT (CRITICAL)
You MUST write at least ${expansionWords} words in Stage 2. Structure your expansion with ${minParagraphs}-${maxParagraphs} substantial paragraphs:

- **Opening section:** 2-3 paragraphs introducing the problem (~300-400 words)
- **Section A (Problem/Gap):** 3-4 paragraphs developing the gap (~400-500 words)
- **Section B (Resource):** 3-4 paragraphs explaining the resource (~400-500 words)
- **Section C (Synthesis):** 3-4 paragraphs building the synthesis (~400-500 words)
- **Section D (Application):** 2-3 paragraphs applying insights (~300-400 words)

Each paragraph should be 120-180 words. Count as you write to ensure you reach ${expansionWords}+ words total.

### EXPANSION RULES
1. Stage 2 develops NEW argumentation - do not copy Stage 1 verbatim
2. Use outline points to structure sections, then elaborate extensively
3. Include phenomenological descriptions, textual analysis, and examples
4. Write in continuous flowing prose with clear transitions

### CITATION FORMAT (CRITICAL)
- For direct quotes: Place citation immediately after with one space: "quoted text" (Author, Year, p. 175)
- For paraphrases: Integrate naturally: Heidegger argues that... (1962, p. 320)
- For interpretive claims: Use section references: (De Anima III.3, 428a) or (BT §65)
- Cite at least 3 distinct sources across the section

### STANDARD EDITIONS
- Heidegger: (Heidegger, 1962) for Being and Time
- Aristotle: Use Bekker numbers, e.g., (De Anima 428a1-5)
- Husserl: (Husserl, 1991)
- Additional sources: ${suggestedSources || 'Primary texts as appropriate'}

### TERMINOLOGY
- Introduce coined terms in *italics*: *phantasmatic retention*
- Do NOT use quotation marks for your own coined terms
- Define clearly on first use

### QUALITY REQUIREMENTS
Each section should include:
1. Phenomenological description
2. Textual grounding with citations
3. Philosophical significance
4. Connection to thesis

---

## OUTPUT

Write both stages now:

**STAGE 1: OUTLINE**
[Your outline A-D with paraphrased citations]

**STAGE 2: EXPANDED SECTION**
[Your ${minParagraphs}-${maxParagraphs} paragraph expansion, ${expansionWords}+ words]

Do NOT include any text after Stage 2. End with your conclusion paragraph.`;
}
