# SuperPrompt Optimization Research: Constrained Academic Text Generation

**Date**: 2026-02-16
**Scope**: Prompt engineering techniques for improving the ICP (Interactive Composition Pipeline) SuperPrompt system
**Target Files**: `constrained-generator.ts`, `llm-generation-provider.ts`, `icp-panel.js`

---

## Executive Summary

This document synthesizes research across 8 technique domains to address 5 known problems in our SuperPrompt-based academic paragraph generation system. The findings are drawn from 30+ sources including peer-reviewed papers, Anthropic's official documentation, empirical benchmark studies, and practitioner reports from 2024-2026.

### Top 5 Findings (Priority-Ranked)

1. **Switch from word count to sentence count with countdown markers** — A 2025 arxiv paper (2508.13805) demonstrates that externalizing a countdown into the prompt achieves 95%+ length compliance vs. <30% with naive word-count prompts. This directly solves Problem #1.

2. **Restructure enrichments using XML tags with constraint consolidation** — Anthropic's own documentation confirms Claude models are specifically trained to parse XML-tagged prompt sections. Moving from 8 flat enrichment sections to a hierarchically tagged structure with constraint consolidation addresses Problem #2 (constraint dropping) and Problem #3 (redundant user prompt).

3. **Replace numerical scores with categorical labels in binding emphasis** — Research on LLM attention dilution shows that numerical percentages (e.g., "85%") occupy attention bandwidth without providing actionable guidance. Categorical labels ("high emphasis", "low emphasis") with behavioral instructions are more reliably followed. This solves Problem #4.

4. **Add a negative-example ban list using positive framing** — The "Pink Elephant Problem" research shows that "do not" instructions paradoxically increase the forbidden behavior. Instead, Anthropic's own system prompt models the solution: describe desired behavior in third-person declarative statements. A curated ban list of AI-isms combined with a style exemplar addresses Problem #5.

5. **Place critical constraints at both the beginning and end of the system prompt** — The "Lost in the Middle" effect (Liu et al., Stanford/UC Berkeley) combined with recency bias research confirms that LLMs attend most strongly to the first and last positions. Repeating the 3-4 most critical constraints at the prompt's end is a zero-cost improvement for constraint adherence.

---

## 1. Structured Prompting Techniques for Constrained Generation

### 1.1 Technique: XML Tag Structuring

**Description**: Using XML tags (`<instructions>`, `<context>`, `<constraints>`, etc.) to delineate prompt sections, giving the LLM clear parsing boundaries between instructions, data, and constraints.

**Evidence of Effectiveness**:
- Anthropic's official documentation states: "XML tags can be a game-changer. They help Claude parse your prompts more accurately, leading to higher-quality outputs." Claude models are specifically trained to recognize XML structure.
- The financial report example in Anthropic's docs shows that XML-tagged prompts produce dramatically more structured, on-target output vs. untagged equivalents.
- Anthropic recommends nesting tags for hierarchical content: `<outer><inner></inner></outer>`.
- A 2025 study in *Frontiers in Artificial Intelligence* confirmed that structured prompt formatting (including XML) improves accuracy and reduces token waste.

**How It Maps to Our SuperPrompt**:
Currently, `buildParagraphPrompt()` in `constrained-generator.ts` assembles the system prompt as a flat string with markdown headers (`## THESIS AND SCOPE`). The 8 enrichment sections are joined with `\n\n` separators, making it difficult for Claude to distinguish instruction hierarchy from data context.

**Implementation Recommendation**:
Wrap each enrichment section in semantic XML tags instead of markdown headers. Use a top-level `<superprompt>` container with nested sections:

```xml
<superprompt>
  <role>You are generating a single academic paragraph.</role>
  <style_requirements>...</style_requirements>
  <thesis_scope>...</thesis_scope>
  <facet_context>...</facet_context>
  <stress_advisories>...</stress_advisories>
  <toulmin_structure>...</toulmin_structure>
  <evidence>
    <atoms>...</atoms>
    <approved_quotes>...</approved_quotes>
    <available_sources>...</available_sources>
  </evidence>
  <discourse_state>...</discourse_state>
  <constraints priority="critical">...</constraints>
</superprompt>
```

**Sources**:
- [Anthropic: Use XML tags to structure your prompts](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)
- [Frontiers: Enhancing structured data generation with GPT-4o](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2025.1558938/full)
- [Mastering Claude Prompts: XML vs. Markdown](https://algorithmunmasked.com/2025/05/14/mastering-claude-prompts-xml-vs-markdown-formatting-for-optimal-results/)

### 1.2 Technique: System Prompt vs. User Prompt Separation

**Description**: Placing static behavioral constraints (role, style, rules) in the system prompt and dynamic task-specific content (atoms, thesis snippet, positional instruction) in the user prompt.

**Evidence of Effectiveness**:
- Hamel Husain's authoritative guide recommends: "Put static instructions and role definitions in the system prompt. Put dynamic content, examples, and task-specific details in the user prompt."
- Anthropic confirms Claude 4.x models are "more responsive to the system prompt than previous models."
- Anuj Sadani's empirical study shows that separating system/user prompts "reduces ambiguity and conflicting instructions" and "makes it easier for teams to iterate and improve prompts."

**How It Maps to Our SuperPrompt**:
Currently, `buildUserPrompt()` re-states the atom descriptions that already appear in the system prompt (Problem #3: redundancy). The user prompt says `Write an academic paragraph addressing: [atom descriptions]` while the system prompt already has the full `ATOMS TO COVER` section with the same information.

**Implementation Recommendation**:
- **System prompt**: All structural constraints (style, citations, approved quotes, atoms, enrichments, discourse state). This is the "constitution" that governs every generation call.
- **User prompt**: Only the generation trigger with positional context: `Generate paragraph 3 of 7. This is a body paragraph in the development phase. Advance the thesis by covering atoms A1-A3.` No atom descriptions (already in system prompt).
- This reduces the user prompt from ~200 tokens to ~40 tokens, freeing attention for the constraint-heavy system prompt.

**Sources**:
- [Hamel Husain: What should go in system vs. user prompt?](https://hamel.dev/blog/posts/evals-faq/what-should-go-in-the-system-prompt-vs-the-user-prompt.html)
- [System Prompts vs. User Prompts: The Missing Manual](https://medium.com/@frenzur007/system-prompts-vs-user-prompts-the-missing-manual-for-controlling-llms-53034f0c75ac)
- [PromptHub: System Messages vs. User Messages](https://www.prompthub.us/blog/the-difference-between-system-messages-and-user-messages-in-prompt-engineering)

---

## 2. Chain-of-Thought / Scratchpad for Multi-Constraint Tasks

### 2.1 Technique: Extended Thinking for Pre-Generation Planning

**Description**: Anthropic's Extended Thinking feature lets Claude generate internal reasoning (a "scratchpad") before producing the final output. For constrained generation, this means Claude can plan sentence structure, verify constraint coverage, and map atoms to sentences before writing prose.

**Evidence of Effectiveness**:
- Anthropic's documentation states: "Extended thinking is about what Claude does before it starts generating a response -- Claude deeply considers and iterates on its plan before taking action."
- The "Think Tool" blog post from Anthropic Engineering distinguishes between pre-generation planning (extended thinking) and mid-generation reflection (think tool), both of which are relevant to our pipeline.
- Interleaved thinking (beta: `interleaved-thinking-2025-05-14`) allows multiple thinking blocks within a single turn, enabling Claude to reason between constraint evaluation steps.

**How It Maps to Our SuperPrompt**:
Our pipeline generates paragraphs with `temperature: 0.7` and `maxTokens: 2000` via `ModelRouter.call()`. There is no extended thinking budget allocated. Given that our prompts contain 8 enrichment sections with complex constraints (Toulmin structure, stress advisories, binding emphasis), Claude would benefit from internal planning before committing to prose.

**Implementation Recommendation**:
Enable extended thinking with a modest budget (2000-4000 tokens) for paragraph generation calls. This allows Claude to:
1. Mentally map which atoms to cover in which sentences
2. Check if approved quotes fit the argument flow
3. Plan hedging language for stress-advised atoms
4. Verify citation availability before committing

In `llm-generation-provider.ts`, modify the `generateParagraph` call:

```typescript
const response = await this.router.call({
  systemPrompt,
  userPrompt: prompt,
  maxTokens: 2000,
  temperature: 0.7,
  costTier: 'high',
  thinking: { type: 'enabled', budget_tokens: 3000 },
});
```

**Caveat**: Extended thinking increases latency and cost. Since we generate paragraphs sequentially, this adds ~3-5 seconds per paragraph. For a 7-paragraph section, that is ~20-35 seconds additional latency. The trade-off is worthwhile if it reduces retry loops from inline validation failures.

**Sources**:
- [Anthropic: Building with Extended Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Anthropic Engineering: Claude Think Tool](https://www.anthropic.com/engineering/claude-think-tool)
- [Extended Thinking Tips](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips)
- [Wei et al.: Chain-of-Thought Prompting Elicits Reasoning in LLMs](https://arxiv.org/pdf/2201.11903)

### 2.2 Technique: Embedded Scratchpad with XML Tags

**Description**: Even without the extended thinking API feature, you can instruct Claude to use a `<scratchpad>` or `<thinking>` section before producing the final `<output>`. This forces explicit constraint verification.

**Evidence of Effectiveness**:
- Anthropic's prompt engineering tutorial recommends combining XML tags with chain-of-thought: "`<thinking>`, `<answer>` creates super-structured, high-performance prompts."
- The Unite.AI Scratchpad Technique article confirms that structured thinking prompts "enable language models to decompose complex problems into manageable parts."
- This technique trades output tokens for constraint adherence: the scratchpad uses ~200-500 tokens but dramatically reduces downstream validation failures.

**How It Maps to Our SuperPrompt**:
Our `maxInlineRetries` is set to 2. If we can reduce first-pass failures through pre-generation planning, we save 1-2 LLM calls per paragraph. At our `costTier: 'high'` (Anthropic Claude), each retry is expensive.

**Implementation Recommendation**:
Add a scratchpad instruction to the system prompt, requesting Claude to emit a brief planning block before the paragraph:

```
Before writing, output a brief planning block in <plan> tags:
<plan>
- Sentence count: [N sentences]
- Atom coverage: [which atom in which sentence]
- Quotes to integrate: [which quote, where]
- Hedging needed: [which atoms need qualification]
</plan>

Then write the paragraph. Do not include the plan tags in the final paragraph.
```

Post-process to strip the `<plan>` block before passing to the sanitizer.

**Sources**:
- [Unite.AI: Scratchpad Technique](https://www.unite.ai/scratchpad-technique-structured-thinking-with-ai/)
- [Prompt Engineering Guide: Chain of Thought](https://www.promptingguide.ai/techniques/cot)

---

## 3. Length Control in LLM Generation

### 3.1 Technique: Sentence Count Instead of Word Count

**Description**: Replacing word-count constraints with sentence-count constraints, which LLMs follow more reliably because sentences are discrete, countable units that align with the model's natural text segmentation.

**Evidence of Effectiveness**:
- A 2025 paper "Precise Length Control in Large Language Models" (arxiv 2412.11937) demonstrates that sentence-level control is fundamentally more tractable because LLMs process text as tokens, not words. Sentences are structural units the model already tracks through punctuation patterns.
- The APXML guide confirms: "For lists or points, asking for a specific number is effective." Sentence counts function similarly to numbered list items.
- Exafluence Inc.'s Medium article demonstrates that LLMs struggle with word counting because "tokens are units of text that may represent a whole word, part of a word, or even just punctuation."

**How It Maps to Our SuperPrompt**:
Currently, `constrained-generator.ts` uses `wordBudget: { min: number; max: number }` and injects `WORD LIMIT (MANDATORY): Write exactly ${wordBudget.min}-${wordBudget.max} words`. This is Problem #1: word count constraints are routinely ignored. The `buildUserPrompt()` also appends `(${wordBudget.min}-${wordBudget.max} words)`.

**Implementation Recommendation**:
Replace word budget with sentence budget throughout:

1. In `constrained-generator.ts`, change `wordBudget` parameters to `sentenceBudget: { min: number; max: number }`.
2. Change the prompt instruction to: `Write exactly ${sentenceBudget.min} to ${sentenceBudget.max} sentences.`
3. Update `perParagraphBudget()` to compute sentences instead of words: academic sentences average ~25-35 words, so a 200-word paragraph is ~6-8 sentences.
4. Add post-generation validation: count sentences in output and flag violations.

### 3.2 Technique: Countdown Markers for Exact Length

**Description**: Embedding visible countdown markers in the prompt that externalize the counting task. The LLM's job reduces to pattern completion rather than internal counting.

**Evidence of Effectiveness**:
- The paper "Prompt-Based One-Shot Exact Length-Controlled Generation with LLMs" (arxiv 2508.13805, August 2025) demonstrates that countdown prompts achieve **95%+ strict length compliance** on MT-Bench-LI with GPT-4.1, up from **<30% with naive prompts**. This is the most dramatic improvement of any technique surveyed.
- The approach "surpasses the popular draft-then-revise baseline" while "judged answer quality is preserved."
- The underlying mechanism: "counting is hard for transformers because self-attention lacks an explicit accumulator. Instead of pushing the model to learn an internal counter, externalize the counter."

**How It Maps to Our SuperPrompt**:
For our paragraph generation, we can adapt this technique to sentence counting. Instead of asking for "6-8 sentences," we can provide a countdown framework.

**Implementation Recommendation**:
Add to the system prompt:

```
LENGTH CONTROL: Write exactly 7 sentences.
After each sentence, mentally note which sentence number you just completed.
Format: Write all 7 sentences as a single flowing paragraph (no numbering in output).
Sentence 1: Opening/topic sentence.
Sentences 2-5: Body sentences covering assigned atoms.
Sentence 6: Evidence integration or qualification.
Sentence 7: Closing/transition sentence.
```

This gives Claude a structural framework that doubles as a countdown. The sentence roles also reinforce paragraph structure.

### 3.3 Technique: "At Most" Ceiling Phrasing

**Description**: Using "at most N sentences" rather than "exactly N" or "N-M sentences."

**Evidence of Effectiveness**:
- Empirical testing reported by Yew Jin's prompt engineering guide shows that "at most X words" consistently outperforms "exactly X words" and "X-Y words" as a constraint. Models from Anthropic, Google, and OpenAI "consistently stayed under the specified limit" with "at most" phrasing, while exact counts "overshoot by 10-15%."

**Implementation Recommendation**:
Use "at most" for the upper bound: `Write at most 8 sentences, aiming for 6-7.`

**Sources**:
- [Prompt-Based One-Shot Exact Length-Controlled Generation (arxiv 2508.13805)](https://arxiv.org/abs/2508.13805)
- [Precise Length Control in Large Language Models (arxiv 2412.11937)](https://arxiv.org/html/2412.11937v1)
- [Can LLMs Track Their Output Length? (arxiv 2601.01768)](https://arxiv.org/html/2601.01768)
- [APXML: Control LLM Output Length and Format](https://apxml.com/courses/intro-large-language-models/chapter-3-communicating-with-llms-prompts/controlling-output-length-format)
- [Yew Jin: Master Length Control in LLMs](https://yewjin.com/blog/2024/llm-tutorial-2/)
- [Exafluence: Solving a Word-Counting Challenge](https://medium.com/@marketing_21061/guiding-llms-through-prompt-engineering-solving-a-word-counting-challenge-e4baf1323958)

---

## 4. Negative Prompting / Ban Lists for AI-ism Prevention

### 4.1 Technique: Positive-Framed Style Exemplar

**Description**: Instead of listing forbidden words ("do not use 'delve'"), describe the desired style through positive behavioral statements and provide a short exemplar of ideal prose.

**Evidence of Effectiveness**:
- The "Pink Elephant Problem" research demonstrates that negative instructions ("Do not use 'delve'") paradoxically increase the likelihood of the forbidden behavior. This is analogous to Ironic Process Theory: "trying to suppress a specific thought makes it more likely to surface."
- Anthropic's own system prompt models this approach: it uses "descriptive statements to define its persona, rather than direct negative commands" and "third-person language, which differs from normal negative instructions."
- Zack Witten (Anthropic senior prompt engineer): negative prompting "should be used sparingly and with a light touch."

**How It Maps to Our SuperPrompt**:
Our current style prompt in the system prompt says things like "Do NOT cite sources not listed below. Do NOT fabricate page numbers." These are necessary safety constraints. However, the style block itself can be reframed.

**Implementation Recommendation**:
Replace the ban list approach with a two-part strategy:

**Part A: Style Exemplar (positive framing)**
Add a 2-3 sentence exemplar of ideal prose to the style block:

```xml
<style_exemplar>
The following represents the target prose style:
"Thus, Aristotle's account of phantasia suggests that the capacity for mental imagery
serves not merely as a repository of sensory impressions but as an active faculty
that mediates between perception and intellection (Aristotle, De Anima, 429a1-4).
Indeed, this formulation complicates the conventional reading of imagination as
passive reception, positioning it instead as a constitutive element of rational
thought."
</style_exemplar>
```

**Part B: Vocabulary Constraints (declarative, not prohibitive)**
Instead of "Do NOT use 'delve', 'crucial', 'landscape'", use:

```xml
<vocabulary_guidance>
This writer's vocabulary is precise and domain-specific. The writer favors:
- Specific philosophical terms over generic intensifiers
- "examines" over "delves into"
- "essential" or "constitutive" over "crucial" or "pivotal"
- "domain" or "field" over "landscape" or "realm"
- "analysis" over "exploration" or "journey"
- "complex" or "multifaceted" over "nuanced" (when used as filler)
The writer does not use: delve, crucial, landscape, pivotal, realm, holistic,
synergy, intricate, multifaceted, unveil, underscore, foster, leverage, tapestry,
embark, beacon, cornerstone, paradigm shift.
</vocabulary_guidance>
```

Note: The final sentence uses a short declarative ban list as a backstop. This is acceptable because it follows positive framing and because the ban list is short (< 20 items). Research shows short, specific ban lists are effective; long ones cause attention dilution.

### 4.2 Technique: Logit Bias for Token-Level Suppression

**Description**: Using the `logit_bias` API parameter to suppress specific tokens at the decoding level, providing a hard guarantee against specific words.

**Evidence of Effectiveness**:
- OpenAI's documentation confirms that `logit_bias` values of -100 "completely remove a token from consideration."
- Practitioners report success suppressing "delve" with negative bias values.

**How It Maps to Our SuperPrompt**:
The Anthropic API does not support `logit_bias` as of 2026. This technique is not directly applicable to our Claude-based pipeline. However, it is worth noting for future API feature parity or if we add an OpenAI fallback.

**Implementation Recommendation**:
Not implementable with current Anthropic API. Rely on prompt-based vocabulary guidance (4.1) and post-generation sanitization via `ProseSanitizer`.

Consider adding a `vocabularyViolation` check to `ProseSanitizer` that flags AI-isms in generated text, triggering a retry if violations exceed a threshold.

**Sources**:
- [The Pink Elephant Problem: Why "Don't Do That" Fails with LLMs](https://eval.16x.engineer/blog/the-pink-elephant-negative-instructions-llms-effectiveness-analysis)
- [Hey Arnoux: Words to Avoid When Using AI](https://www.heyarnoux.com/p/a-long-list-of-terms-and-words-to-avoid-when-using-llms)
- [Jodie Cook: How to Write Without Sounding Like ChatGPT](https://www.jodiecook.com/ban-list/)
- [Blake Stockton: Red Flag Words](https://www.blakestockton.com/red-flag-words/)
- [OpenAI: Using logit bias](https://help.openai.com/en/articles/5247780-using-logit-bias-to-alter-token-probability-with-the-openai-api)

---

## 5. Prompt Hierarchy and Attention Management

### 5.1 Technique: Constraint Consolidation and Tiering

**Description**: Reducing the total number of distinct constraint sections and organizing them into a priority hierarchy (MUST / SHOULD / MAY) to combat attention dilution.

**Evidence of Effectiveness**:
- Unite.AI's research on instruction skipping: "Too many constraints can overwhelm the model, causing it to ignore some. Focus on the most important ones."
- Chroma's "Context Rot" study (2025) found that across 18 SOTA models, "model reliability decreases significantly with longer inputs, even on simple tasks." Performance degrades as context length and distractor count increase.
- A 2025 paper found that "even with 100% perfect retrieval of relevant information, performance degrades 13.9% to 85% as input length increases."

**How It Maps to Our SuperPrompt**:
Our system prompt with all 8 enrichments can exceed 2000 tokens. This is the core of Problem #2: too many constraints get dropped when stacked. The 8 enrichment sections (thesis/scope, facet context, stress advisories, Toulmin structure, binding quality, quote context, paragraph function, argument trajectory) each add constraints, and the LLM's attention budget is finite.

**Implementation Recommendation**:
Consolidate the 8 enrichment sections into 3 tiers:

**Tier 1: MUST (always present, ~400 tokens)**
- Constraints block (citation rules, approved sources, approved quotes)
- Atoms to cover
- Length control (sentence count)
- Vocabulary guidance

**Tier 2: SHOULD (contextually present, ~300 tokens)**
- Thesis/scope (1-2 sentences, not a full block)
- Paragraph function + argument trajectory (merged into a single "POSITION" block)
- Stress advisories (only for atoms that actually need hedging)

**Tier 3: MAY (enrichment data, placed early in prompt, ~200 tokens)**
- Facet context (brief)
- Toulmin structure (condensed)
- Binding quality (categorical labels only, no percentages)
- Quote context windows

Place Tier 1 at the END of the system prompt (recency bias). Place Tier 3 at the BEGINNING (long documents go first per Anthropic's guidance). Place Tier 2 in between.

### 5.2 Technique: Primacy-Recency Sandwich

**Description**: Placing the most critical constraints at both the beginning AND end of the prompt to exploit both primacy and recency attention biases.

**Evidence of Effectiveness**:
- Liu et al., "Lost in the Middle" (Stanford/UC Berkeley, ACL 2024): "Performance is often highest when relevant information occurs at the beginning or end of the input context, and significantly degrades when models must access relevant information in the middle."
- Multiple practitioner guides confirm: "Put your main goal at the start and the end to fight recency bias."
- Instructions at the end of prompts "receive higher priority" due to recency bias in autoregressive generation.

**How It Maps to Our SuperPrompt**:
Currently, our constraints block is in the middle of the system prompt (after style requirements, before atoms/quotes). The most critical constraints (citation accuracy, word limit, no hallucination) can get lost.

**Implementation Recommendation**:
Add a `<critical_constraints>` block as the LAST section of the system prompt that repeats the top 3-4 rules:

```xml
<critical_constraints>
FINAL REMINDERS (highest priority):
1. Write at most 8 sentences.
2. Only cite sources listed in <available_sources>.
3. Use every approved quote at least once.
4. Match the style exemplar in <style_exemplar>.
</critical_constraints>
```

This adds ~50 tokens but provides disproportionate value for constraint adherence.

**Sources**:
- [Liu et al.: Lost in the Middle (ACL 2024)](https://aclanthology.org/2024.tacl-1.9/)
- [Chroma Research: Context Rot](https://research.trychroma.com/context-rot)
- [Ask-Y: Attention Dilution](https://ask-y.ai/blog/learn-about-llm/attention-dilution/)
- [diffray: Context Dilution](https://diffray.ai/blog/context-dilution/)
- [Unite.AI: Why LLMs Skip Instructions](https://www.unite.ai/why-large-language-models-skip-instructions-and-how-to-address-the-issue/)
- [Medium: Instruction Placement Matters](https://medium.com/@lars.chr.wiik/llm-instruction-placement-in-prompts-it-matters-a-lot-3b57580756ee)
- [Visual Studio Magazine: Putting the Prompt Last](https://visualstudiomagazine.com/articles/2023/06/27/complex-prompting.aspx)

---

## 6. Role-Based and Persona Prompting for Academic Writing

### 6.1 Technique: Specific Expert Persona (Not Generic)

**Description**: Assigning the LLM a specific expert persona that matches the writing task, using domain-specific language rather than a generic "helpful assistant" role.

**Evidence of Effectiveness**:
- PromptHub's meta-analysis: "Persona prompting is effective on open-ended tasks like creative writing" but "probably won't help much on accuracy-based tasks, especially for newer models."
- A Vanderbilt University study found that "across studies evaluating multiple LLMs on diverse task suites, expert personas typically yield positive or at least non-deleterious changes in accuracy."
- Critical caveat: "Inclusion of irrelevant persona cues often results in substantial accuracy degradation -- up to 30 percentage points."
- LearnPrompting.org: "Prompting an LLM to respond as a domain expert provides clear frameworks that guide knowledge access, tone, and detail level."

**How It Maps to Our SuperPrompt**:
Our current role statement is minimal: "You are generating a single academic paragraph." This is task-oriented rather than persona-oriented. For academic writing, a more specific persona could improve tone and vocabulary consistency.

**Implementation Recommendation**:
Replace the generic role with a specific but concise persona:

```xml
<role>
You are an academic writer specializing in philosophy and rhetoric.
Your prose is formal, evidence-driven, and precisely cited.
You write in the style profile described in <style_requirements>.
</role>
```

Keep the persona to 2-3 sentences. Do NOT add irrelevant biographical details or overly specific credentials, as these degrade performance per the Vanderbilt study.

**Important**: For Claude 4.x, Anthropic warns against "aggressive language" in role definitions. Replace "CRITICAL: You MUST" with "Use this approach when..." to avoid overtriggering.

**Sources**:
- [PromptHub: Does Adding Personas Really Make a Difference?](https://www.prompthub.us/blog/role-prompting-does-adding-personas-to-your-prompts-really-make-a-difference)
- [Vanderbilt: Evaluating Persona Prompting for QA Tasks](https://www.dre.vanderbilt.edu/~schmidt/PDF/Evaluating_Personified_Expert_Effectiveness_Conference.pdf)
- [LearnPrompting: Role Prompting](https://learnprompting.org/docs/advanced/zero_shot/role_prompting)
- [When "A Helpful Assistant" Is Not Really Helpful (arxiv 2311.10054)](https://arxiv.org/html/2311.10054v3)

---

## 7. Output Formatting and Structured Output

### 7.1 Technique: XML-Tagged Output for Post-Processing

**Description**: Requesting Claude to emit its output in XML-tagged sections to enable reliable extraction and validation.

**Evidence of Effectiveness**:
- Anthropic docs: "Having Claude use XML tags in its output makes it easier to extract specific parts of its response by post-processing."
- Anthropic's structured outputs API provides schema validation for JSON, but for prose output, XML tags are more natural since the content itself is not structured data.

**How It Maps to Our SuperPrompt**:
Currently, in `strict` atoms mode, we ask Claude to prefix each sentence with `[supports: atom_id1, atom_id2]`. This is a custom format that requires regex parsing in `parseInlineConstraintTokens()`. XML tags would be more robust.

**Implementation Recommendation**:
For strict mode, replace inline constraint tokens with XML-wrapped sentences:

```xml
<!-- Instead of: [supports: atom_1, atom_3] Sentence text here. -->
<sentence atoms="atom_1,atom_3">Sentence text here.</sentence>
```

This is easier to parse (standard XML parsing vs. regex), less likely to leak into final output, and consistent with the XML prompt structure.

For non-strict modes, request the paragraph in a `<paragraph>` tag to prevent preamble:

```xml
Output only the paragraph text inside <paragraph> tags:
<paragraph>Your paragraph here.</paragraph>
```

### 7.2 Technique: Prefill Deprecation and Alternatives

**Description**: Anthropic's prefill technique (pre-populating the assistant's response) was previously recommended for format control but is deprecated for Claude Opus 4.6.

**Evidence of Effectiveness**:
- Anthropic docs: "Prefilled responses on the last assistant turn are deprecated starting with Claude Opus 4.6."
- Alternative: Use structured outputs (JSON schema) for structured data, or XML output tags for prose.

**How It Maps to Our SuperPrompt**:
We do not currently use prefill, so no migration is needed. However, this confirms that XML output tags are the correct approach for Claude 4.x.

**Sources**:
- [Anthropic: Use XML tags to structure your prompts](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)
- [Anthropic: Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic: Prefill Deprecation](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prefill-claudes-response)

---

## 8. Iterative Refinement / Self-Critique Prompting

### 8.1 Technique: Single-Call Self-Review

**Description**: Adding a self-review instruction to the prompt so Claude checks its own output against constraints before finalizing, within a single API call.

**Evidence of Effectiveness**:
- Madaan et al., "Self-Refine" (NeurIPS 2023): "Outputs generated with Self-Refine are preferred by humans and automatic metrics, improving by ~20% absolute on average."
- A 2025 *npj AI* paper confirms self-reflection "enhances large language models towards substantial academic response."
- Google Research (2025): "Self-refinement cut code errors by 30% in benchmarks."
- DSPy's programmatic prompt optimization "raised accuracy from 46.2% to 64.0%."

**How It Maps to Our SuperPrompt**:
We already have an external validation loop via `ICPInlineValidator` with `maxInlineRetries: 2`. However, the validator runs AFTER generation, requiring a full re-generation on failure. A self-review within the generation call could catch issues before the output is committed.

**Implementation Recommendation**:
Add a lightweight self-check instruction to the system prompt:

```xml
<self_check>
After writing the paragraph, verify:
- Does every sentence advance the thesis or support an assigned atom?
- Are all approved quotes used with correct citations?
- Is the sentence count within the specified range?
- Does the vocabulary match the style exemplar (no generic intensifiers)?
If any check fails, revise the paragraph before outputting.
</self_check>
```

This leverages Claude's extended thinking capabilities to self-correct within a single call, potentially reducing inline validation failures and avoiding expensive retry loops.

**Important Caveat**: Self-review adds ~200-400 output tokens. Combined with extended thinking (Section 2.1), total token usage per paragraph increases from ~2000 to ~4500. Monitor cost impact.

### 8.2 Technique: Multi-Call Refinement with Targeted Feedback

**Description**: The existing `ICPInlineValidator` retry loop, but improved with more specific feedback prompts.

**Evidence of Effectiveness**:
- The Self-Refine paper shows that feedback must be "actionable, covering both localization of the problem and instruction to improve." Generic feedback like "try again" is ineffective.

**How It Maps to Our SuperPrompt**:
Currently, the retry prompt in `generateFromSuperPrompt()` appends `PREVIOUS ATTEMPT ISSUES:\n${validation.suggestedRetryFeedback}`. The quality of `suggestedRetryFeedback` determines retry effectiveness.

**Implementation Recommendation**:
Structure retry feedback as targeted corrections:

```
REVISION REQUIRED:
- Citation error: Sentence 3 cites "Heidegger (2009)" but this source is not in <available_sources>. Remove this citation or replace with an approved source.
- Atom coverage gap: Atom [atom_3] ("phantasia mediates perception") is not addressed in any sentence. Add a sentence covering this atom.
- Length violation: Output has 11 sentences, maximum is 8. Remove the 3 least essential sentences.
```

This specificity enables targeted revision rather than full re-generation.

**Sources**:
- [Madaan et al.: Self-Refine (NeurIPS 2023, arxiv 2303.17651)](https://arxiv.org/abs/2303.17651)
- [npj AI: Self-reflection enhances LLMs](https://www.nature.com/articles/s44387-025-00045-3)
- [LearnPrompting: Self-Refine](https://learnprompting.org/docs/advanced/self_criticism/self_refine)
- [Introduction to Self-Criticism Prompting](https://learnprompting.org/docs/advanced/self_criticism/introduction)

---

## 9. Claude 4.x Specific Considerations

### 9.1 Literal Instruction Following

Claude 4.x models follow instructions literally. If the prompt says "suggest changes," Claude will suggest, not implement. This is critical for our SuperPrompt because vague instructions like "Write an academic paragraph addressing..." may result in Claude merely addressing rather than fully developing the atoms.

**Recommendation**: Be extremely explicit: "Write a complete academic paragraph of 6-8 sentences that fully develops each assigned atom with evidence and citations."

### 9.2 System Prompt Overtriggering

Claude Opus 4.5/4.6 is "more responsive to the system prompt than previous models." Our current system prompt uses strong language like "WORD LIMIT (MANDATORY)" and "Do NOT exceed." With Claude 4.x, this aggressive language may cause over-compliance (e.g., extremely short paragraphs to stay safe on word count).

**Recommendation**: Dial back aggressive language. Replace "MANDATORY" with clear but natural phrasing. Replace "Do NOT exceed X words under any circumstances" with "Write at most 8 sentences, aiming for 6-7."

### 9.3 "Think" Word Sensitivity

When extended thinking is disabled, Claude Opus 4.5 is "particularly sensitive to the word 'think' and its variants." Using "think" in the prompt may trigger unexpected behavior.

**Recommendation**: Replace "think about" with "consider," "evaluate," or "assess" in all prompt text. The self-check section should say "verify" rather than "think about whether."

**Sources**:
- [Anthropic: Claude 4 Prompting Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [DreamHost: We Tested 25 Practices (These 5 Worked)](https://www.dreamhost.com/blog/claude-prompt-engineering/)

---

## 10. Priority-Ranked Implementation Plan

### Phase 1: Low-Risk, High-Impact (implement immediately)

| Priority | Change | File | Effort | Impact |
|----------|--------|------|--------|--------|
| P1 | Replace word budget with sentence budget | `constrained-generator.ts` lines 161-210, 684-686, 801 | Medium | Fixes Problem #1 |
| P2 | Add `<critical_constraints>` sandwich at end of system prompt | `constrained-generator.ts` `buildParagraphPrompt()` line 779 | Low | Fixes Problem #2 partially |
| P3 | Replace numerical binding scores with categorical labels | `constrained-generator.ts` `buildBindingQualityEnrichment()` line 1459 | Low | Fixes Problem #4 |
| P4 | De-duplicate user prompt (remove atom descriptions already in system prompt) | `constrained-generator.ts` `buildUserPrompt()` lines 787-803 | Low | Fixes Problem #3 |
| P5 | Add vocabulary guidance block (positive framing + short ban list) | `constrained-generator.ts` `buildParagraphPrompt()` | Low | Fixes Problem #5 |

### Phase 2: Structural Refactoring (1-2 day effort)

| Priority | Change | File | Effort | Impact |
|----------|--------|------|--------|--------|
| P6 | Wrap all prompt sections in XML tags | `constrained-generator.ts` all `build*Enrichment()` methods | Medium | Fixes Problem #2 |
| P7 | Consolidate 8 enrichments into 3 tiers | `constrained-generator.ts` `assembleEnrichedSystemPrompt()` | Medium | Fixes Problem #2 |
| P8 | Merge paragraph_function + argument_trajectory into single POSITION block | `constrained-generator.ts` lines 1543-1683 | Low | Reduces enrichment count |
| P9 | Add style exemplar to system prompt | `constrained-generator.ts` `buildParagraphPrompt()` | Low | Fixes Problem #5 |
| P10 | Replace `[supports: ...]` tokens with XML sentence tags | `constrained-generator.ts` `parseInlineConstraintTokens()` | Medium | Improves parsing reliability |

### Phase 3: Advanced Techniques (requires testing)

| Priority | Change | File | Effort | Impact |
|----------|--------|------|--------|--------|
| P11 | Enable extended thinking for paragraph generation | `llm-generation-provider.ts` `generateParagraph()` | Low (code), High (cost) | Reduces retry rate |
| P12 | Add `<self_check>` instruction to system prompt | `constrained-generator.ts` | Low | Reduces inline validation failures |
| P13 | Add `<plan>` scratchpad instruction | `constrained-generator.ts` | Medium | Improves atom coverage |
| P14 | Improve retry feedback specificity | `constrained-generator.ts` `generateFromSuperPrompt()` | Medium | Improves retry success rate |
| P15 | Add AI-ism detection to ProseSanitizer | `prose-sanitizer.ts` | Medium | Catches remaining AI-isms |

### Phase 4: Dashboard Visibility

| Priority | Change | File | Effort | Impact |
|----------|--------|------|--------|--------|
| P16 | Display enrichment tier breakdown in SuperPrompt panel | `icp-panel.js` SuperPrompt panel | Medium | Debugging visibility |
| P17 | Show sentence count vs. budget in generation results | `icp-panel.js` Planner panel | Low | Debugging visibility |
| P18 | Add AI-ism detection report to Quality panel | `icp-panel.js` Quality panel | Medium | Quality monitoring |

---

## 11. Revised SuperPrompt Template

### BEFORE (Current Implementation)

```
You are generating a single academic paragraph.

WORD LIMIT (MANDATORY): Write exactly 150-200 words. Do NOT exceed 200 words under any circumstances.

STYLE REQUIREMENTS:
[style prompt text]

## THESIS AND SCOPE
Thesis: [thesis]
Scope: [scope]
Audience: [audience]
Keep all claims within this scope.

## FACET CONTEXT
Facet: [name] ([role])
Description: [description]
Research Questions: [questions]

## STRESS ADVISORIES
- Atom [atom_1] "claim text": Present cautiously; Hedge with "may"

## TOULMIN STRUCTURE
- Atom [atom_1]:
  Warrant: [warrant]
  Backing: [backing]

## BINDING EMPHASIS
- Atom [atom_1] + Quote [q_1]: high emphasis (85%) -- Feature prominently

## QUOTE CONTEXT
- Quote [q_1]:
  Before: "...context before"
  Core: "quote text"
  After: "context after..."

## PARAGRAPH FUNCTION
Position: body (3/7)
This is paragraph 3 of 7. Develop the argument.

## ARGUMENT TRAJECTORY
Rhetorical Goal: establish the central argument with direct evidence
Section Trajectory: Development phase

CONSTRAINTS:
- Only use quotation marks for approved quotes provided below.
- Only cite sources that are explicitly provided in AVAILABLE SOURCES or APPROVED QUOTES.
- Do not introduce claims not covered by the atom plan below.

CITATION REQUIREMENTS:
[citation instructions]

ATOMS TO COVER:
- [atom_1] Claim text (assertive, constitutive)
- [atom_2] Claim text (evidential, relational)

AVAILABLE SOURCES:
- Author (Year, p. XX) -- Full citation

APPROVED QUOTES:
- "quote text" -- cite as: (Author, Year, p. XX)

PREVIOUS PARAGRAPH ENDED WITH:
  "last sentence"
AVOID THESE TRANSITIONS: however, thus, moreover
```

**User Prompt**:
```
Write an academic paragraph (150-200 words) addressing: Claim text 1; Claim text 2
```

### AFTER (Revised Template)

```xml
<role>
You are an academic writer specializing in philosophy and rhetoric.
Your prose is formal, evidence-driven, and precisely cited.
</role>

<context>
  <thesis>Aristotle's account of phantasia reveals imagination as constitutive of rational thought.</thesis>
  <scope>Aristotle's De Anima, Books II-III, with reference to contemporary phenomenology.</scope>
  <position>Body paragraph (3 of 7), development phase -- build the core argument with evidence.</position>
  <rhetorical_goal>Establish the central argument with direct evidence.</rhetorical_goal>
</context>

<evidence>
  <atoms>
    <atom id="atom_1">Phantasia mediates between perception and intellection (assertive, constitutive)</atom>
    <atom id="atom_2">The phantasma retains sensory form without matter (evidential, relational)</atom>
  </atoms>

  <approved_quotes>
    <quote id="q_1" cite="Aristotle, De Anima, 429a1-4">the soul never thinks without a phantasma</quote>
    <quote id="q_2" cite="Frede, 1992, p. 283">phantasia is not mere appearance but a capacity for representation</quote>
  </approved_quotes>

  <available_sources>
    <source>Aristotle (350 BCE) -- De Anima, trans. Hicks</source>
    <source>Frede, D. (1992) -- "The Cognitive Role of Phantasia in Aristotle"</source>
  </available_sources>
</evidence>

<enrichment>
  <stress_advisories>
    <advisory atom="atom_2" action="hedge">Warrant is weak. Present cautiously with "suggests" or "arguably."</advisory>
  </stress_advisories>

  <toulmin atom="atom_1">
    <warrant>Phantasia is described as a motion arising from active perception (De Anima 429a1).</warrant>
    <backing>Aristotle distinguishes phantasia from both perception and belief at 428a-b.</backing>
  </toulmin>

  <binding_quality>
    <binding atom="atom_1" quote="q_1" emphasis="high">Feature prominently with direct quotation.</binding>
    <binding atom="atom_2" quote="q_2" emphasis="medium">Use for paraphrase support.</binding>
  </binding_quality>

  <quote_context quote="q_1">
    <before>...having established that thinking is either a form of imagination or at least requires it, Aristotle concludes that</before>
    <after>for images serve as perceptions to the thinking soul...</after>
  </quote_context>
</enrichment>

<style_requirements>
  Sentence style: Average 31 words, 51% long sentences, complex structures.
  Passive voice: ~20% of sentences.
  Transitions: Use "thus", "specifically", "indeed", "accordingly", "hence".
  Citation integration: Author-prominent (e.g., "As Aristotle observes...", "Frede argues that...").
  Quote verbs: observes, argues, suggests, states, maintains, notes.
  Tone: Formal, objective, cautious claims with hedging.
</style_requirements>

<style_exemplar>
"Thus, Aristotle's account of phantasia suggests that the capacity for mental imagery
serves not merely as a repository of sensory impressions but as an active faculty
that mediates between perception and intellection (Aristotle, De Anima, 429a1-4).
Indeed, this formulation complicates the conventional reading of imagination as
passive reception, positioning it instead as a constitutive element of rational thought."
</style_exemplar>

<vocabulary_guidance>
This writer favors precise philosophical terms over generic intensifiers:
- "examines" over "delves into"
- "essential" or "constitutive" over "crucial" or "pivotal"
- "domain" over "landscape" or "realm"
The writer does not use: delve, crucial, landscape, pivotal, realm, holistic,
synergy, intricate, unveil, underscore, foster, leverage, tapestry, embark, beacon.
</vocabulary_guidance>

<discourse_state>
  <previous_tail>The preceding paragraph concluded by establishing the distinction between aisthesis and phantasia in De Anima III.3.</previous_tail>
  <avoid_transitions>however, moreover, furthermore</avoid_transitions>
</discourse_state>

<constraints>
  <citation_rules>
    Every claim derived from a source MUST include a parenthetical citation: (Author, Year, p. XX).
    For signal phrases: As Heidegger argues, "..." (Heidegger, 2009, p. 45).
    Only cite sources listed in <available_sources>.
  </citation_rules>

  <length_control>Write at most 8 sentences, aiming for 6-7. Structure:
    Sentence 1: Topic sentence connecting to previous paragraph.
    Sentences 2-5: Develop atoms with evidence and citations.
    Sentence 6-7: Qualification or synthesis.
    Final sentence: Transition toward the next paragraph's topic.
  </length_control>

  <content_rules>
    Only use quotation marks for quotes listed in <approved_quotes>.
    Cover every atom listed in <atoms>.
    Do not introduce claims not covered by the atoms.
  </content_rules>
</constraints>

<self_check>
Before finalizing, verify:
1. Every atom in <atoms> is addressed by at least one sentence.
2. Every quote in <approved_quotes> is used with correct citation.
3. Sentence count is within the range specified in <length_control>.
4. No sources are cited that are not listed in <available_sources>.
5. Vocabulary matches <style_exemplar> -- no generic intensifiers.
If any check fails, revise before outputting.
</self_check>

<critical_reminders>
HIGHEST PRIORITY:
1. Write at most 8 sentences.
2. Only cite sources from <available_sources>.
3. Use every approved quote with its exact citation.
4. Match the prose style in <style_exemplar>.
</critical_reminders>
```

**User Prompt** (revised -- minimal, non-redundant):
```
Generate paragraph 3 of 7. Advance the thesis by developing atoms atom_1 and atom_2 with the approved evidence. This is a body paragraph in the development phase.
```

### Key Differences Summary

| Aspect | Before | After | Problem Addressed |
|--------|--------|-------|-------------------|
| Structure | Flat markdown headers | Hierarchical XML tags | #2 (constraint dropping) |
| Length control | Word count range | Sentence count + "at most" + structure guide | #1 (ignored word count) |
| Binding emphasis | Numerical percentages (85%) | Categorical labels (high/medium/low) | #4 (confusing numbers) |
| User prompt | Re-states all atom descriptions | Minimal trigger with paragraph position | #3 (redundancy) |
| AI-ism prevention | None | Style exemplar + vocabulary guidance + ban list | #5 (cliches) |
| Constraint placement | Middle of prompt | Repeated at end via `<critical_reminders>` | #2 (constraint dropping) |
| Self-review | External only (inline validator) | Internal + external | #2 (constraint dropping) |
| Persona | "You are generating..." (task) | "You are an academic writer..." (persona) | #5 (tone) |
| Enrichment count | 8 separate sections | 3 tiers, consolidated | #2 (attention dilution) |

---

## Appendix A: AI-ism Ban List

Words and phrases to include in `<vocabulary_guidance>` based on aggregated research:

**Tier 1 (worst offenders -- GPT/Claude signature words)**:
delve, tapestry, landscape, beacon, pivotal, crucial, nuanced (as filler), intricate, holistic, synergy, multifaceted, embark, unveil, underscore, foster, leverage, cornerstone, paramount, realm, interplay

**Tier 2 (overused academic fillers)**:
it is important to note, it is worth noting, in the realm of, plays a crucial role, is a testament to, shed light on, pave the way, at the heart of, serves as a catalyst, a myriad of, the intricacies of

**Tier 3 (structural cliches)**:
"It's not about X, it's about Y", "While X is important, Y is even more crucial", "In today's rapidly evolving", "In conclusion", "All in all", "has garnered significant attention"

**Recommended replacements** (for the style profile):
- delve into -> examine, analyze, investigate
- crucial -> essential, constitutive, indispensable
- landscape -> domain, field, area
- nuanced -> complex, qualified, differentiated
- holistic -> comprehensive, integrated, unified
- leverage -> employ, use, draw on
- underscore -> emphasize, demonstrate, reveal
- foster -> cultivate, develop, promote
- pivotal -> central, decisive, formative
- beacon -> model, example, exemplar

## Appendix B: Estimated Token Budget Comparison

| Component | Before (tokens) | After (tokens) | Delta |
|-----------|----------------|----------------|-------|
| Role | ~15 | ~35 | +20 |
| Context (thesis/scope/position) | ~200 (2 sections) | ~120 (1 consolidated section) | -80 |
| Evidence (atoms/quotes/sources) | ~350 | ~350 | 0 |
| Enrichments (stress/toulmin/binding/quote) | ~500 (4 sections) | ~350 (1 consolidated section) | -150 |
| Style | ~200 | ~300 (+ exemplar + vocab) | +100 |
| Discourse state | ~100 | ~80 | -20 |
| Constraints | ~250 | ~200 (restructured) | -50 |
| Self-check | 0 | ~100 | +100 |
| Critical reminders | 0 | ~60 | +60 |
| **TOTAL SYSTEM PROMPT** | **~1615** | **~1595** | **-20** |
| User prompt | ~200 | ~40 | **-160** |
| **TOTAL INPUT** | **~1815** | **~1635** | **-180** |

Net result: the revised template is ~10% smaller while adding self-check, vocabulary guidance, style exemplar, and critical reminders. The savings come from de-duplicating the user prompt and consolidating enrichment sections.
