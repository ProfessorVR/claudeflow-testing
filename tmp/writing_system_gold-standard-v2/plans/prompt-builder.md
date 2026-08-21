# Prompt Builder — Plan

Status: DRAFT
Created: 2026-02-17
Last Updated: 2026-02-17

---

## Overview

A new feature for the dashboard and CLI that converts a user's research question
plus source selections into a fully structured, validation-ready prompt — matching
the format of `motion and time prompt.tex`. The generated prompt includes Critical
Rules, Topic, Required Structure, Validation Transparency Requirement, and Final
Instruction sections, with configurable strictness levels for quotation fidelity,
citation verification, and claim validation.

The key insight: the `motion and time prompt.tex` format produces better results
from god-write than the ICP pipeline because it gives the LLM a single holistic
document-level contract. The Prompt Builder automates creating these contracts so
users don't have to hand-craft them.

---

## 1. Architecture

### Data Flow

```
User Input (dashboard or CLI)
  ├── Research prompt (free text)
  ├── Source selections (corpus folder, primary/secondary sources)
  ├── Configuration (strictness, word count, draft category, style)
  └── Section structure (auto-generated or user-defined)
        │
        ▼
  Prompt Template Engine
  ├── Injects Critical Rules (configurable strictness)
  ├── Builds Topic section from user prompt
  ├── Generates Required Structure (sections from prompt analysis)
  ├── Adds Validation Transparency Requirement
  └── Appends Final Instruction
        │
        ▼
  Structured Prompt (.tex / .md / clipboard)
  └── Ready for god-write --execute or manual use
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PromptBuilderEngine` | `src/god-agent/core/composition/prompt-builder-engine.ts` | Template engine: takes config, produces structured prompt |
| `PromptBuilderConfig` | `src/god-agent/core/composition/icp-types.ts` | Type definitions for builder config |
| CLI command | `scripts/build-prompt.ts` | `npx tsx scripts/build-prompt.ts` runner |
| Dashboard panel | `src/god-agent/observability/dashboard/icp-panel.js` | New "Prompt Builder" tab in dashboard nav |
| API route | `src/god-agent/observability/icp-api-routes.ts` | `POST /api/icp/build-prompt` endpoint |

---

## 2. Type Definitions

Add to `icp-types.ts`:

```typescript
// ── Prompt Builder Types ──

export type StrictnessLevel = 'strict' | 'moderate' | 'permissive';

export interface PromptBuilderConfig {
  /** The user's research prompt / question (free text) */
  prompt: string;

  /** Target word count (e.g., "2000" or "1000-2000") */
  wordCount: string;

  /** Draft category */
  draftCategory: 'section' | 'chapter' | 'paper' | 'essay' | 'article' | 'report';

  /** Corpus folder to scope sources */
  corpusFolder?: string;

  /** Primary sources — will appear in Critical Rules as required quotation sources */
  primarySources: Array<{ author: string; title: string }>;

  /** Secondary sources — will appear as interpretive context */
  secondarySources: Array<{ author: string; title: string }>;

  /** Whether to also allow non-specified corpus sources */
  searchAll: boolean;

  /** Style profile ID */
  styleProfileId?: string;

  /** Strictness levels */
  strictness: {
    /** How strictly quotations must match corpus text */
    quotation: StrictnessLevel;
    /** How strictly every claim must have a citation */
    citation: StrictnessLevel;
    /** How strictly unsupported claims are handled */
    unsupported_claims: StrictnessLevel;
  };

  /** Optional: user-defined section structure (overrides auto-generation) */
  sections?: PromptSection[];

  /** Whether to include the Validation Appendix requirement */
  includeValidationAppendix: boolean;

  /** Whether to include the Quality Gauntlet instruction */
  includeQualityGauntlet: boolean;

  /** Output format */
  outputFormat: 'tex' | 'md' | 'text';
}

export interface PromptSection {
  /** Section title (e.g., "Aristotle on Motion") */
  title: string;
  /** Subsection instructions */
  instructions: string[];
  /** Whether citations are mandatory in this section */
  citationsRequired: boolean;
  /** Minimum quotations expected (0 = no minimum) */
  minQuotations: number;
}

export interface PromptBuilderResult {
  /** The generated structured prompt text */
  prompt: string;
  /** Sections that were auto-generated (for user review) */
  sections: PromptSection[];
  /** Strictness configuration used */
  strictness: PromptBuilderConfig['strictness'];
  /** Metadata about the generation */
  metadata: {
    wordCount: string;
    draftCategory: string;
    primarySourceCount: number;
    secondarySourceCount: number;
    sectionCount: number;
    outputFormat: string;
  };
}
```

---

## 3. Prompt Template Engine

### File: `src/god-agent/core/composition/prompt-builder-engine.ts`

The engine assembles five sections in order, each controlled by the config:

### Section 1: Critical Rules

Maps strictness levels to specific rules:

| Rule | `strict` | `moderate` | `permissive` |
|------|----------|------------|--------------|
| Corpus-only sourcing | Mandatory (ONLY local corpus) | Mandatory (prefer corpus, note when external) | Preferred (corpus first, external allowed) |
| `citation_lookup` required | Before every cite | Before first cite per source | Not required |
| Every claim cited | All factual/historical/interpretive | All factual/historical | Only direct claims |
| Verbatim quotation | Exact match from corpus required | Close match acceptable | Paraphrase with citation OK |
| Unsupported claims | Weaken or omit | Weaken and note limitation | Include with hedge language |
| Invented citations | Zero tolerance | Zero tolerance | Zero tolerance (always) |

### Section 2: Topic

Direct insertion of the user's prompt. The engine wraps it in numbered instruction
format matching the `.tex` reference structure.

If primary sources are specified, the engine adds explicit instructions like:
```
2. Additionally, explicitly engage [Author]'s [Work], including several
   verbatim quotations from that work, if relevant to [topic].
```

### Section 3: Required Structure

Two modes:

**Auto-generate** (default): The engine calls the LLM (via ModelRouter, Anthropic)
to decompose the prompt into 4-8 logical sections, each with:
- Section title
- Focus instructions (1-3 bullet points)
- Whether citations are mandatory
- Expected quotation sources

**User-defined**: If `config.sections` is provided, the engine formats them
directly without an LLM call.

The output matches the `.tex` format:
```
Required Structure
Generate approximately 2,000 words, organized into the following units:
    1. [Section Title]
        1.a. [Focus instruction]
        1.b. [Citation requirement]
    2. [Section Title]
        ...
```

### Section 4: Validation Transparency Requirement

Included when `config.includeValidationAppendix === true` (default for `strict`
and `moderate` strictness). Contains the exact structure from the reference prompt:

1. **Claim Map** — claim text, claim type, citation required, citations used
2. **Quotation Ledger** — quoted text, author, work, page/reference
3. **Citation Ledger** — full list of all citations
4. **Validation Summary** — counts for claims, citations, quotations, retries

### Section 5: Final Instruction

Includes:
- Stress-test framing (strict/moderate only)
- Failure-over-fabrication instruction
- Output format specification (Markdown)
- Quality Gauntlet results section (if `includeQualityGauntlet`)
- Claim inventory and quote inventory sections

### Strictness Presets

Three presets that set all config values coherently:

| Preset | quotation | citation | unsupported_claims | appendix | gauntlet |
|--------|-----------|----------|-------------------|----------|----------|
| `strict` | strict | strict | strict | yes | yes |
| `moderate` | moderate | moderate | moderate | yes | no |
| `permissive` | permissive | permissive | permissive | no | no |

Users can also mix-and-match individual strictness levels.

---

## 4. Dashboard UI

### New Tab: "Prompt Builder"

Add a `promptbuilder` tab to the ICP dashboard nav bar (between "Prompt" and
"Facets"). The tab mirrors the ICP prompt tab's source selection but adds
strictness controls and a live prompt preview.

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Research Prompt                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [textarea - same as ICP prompt tab]                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─── Source Settings ─────────────────────────────────────┐│
│  │ Corpus Folder:  [dropdown]                               ││
│  │ Primary:        [checklist - loaded from corpus-sources] ││
│  │ Secondary:      [checklist - loaded from corpus-sources] ││
│  │ Search All:     [checkbox]                               ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─── Generation Settings ─────────────────────────────────┐│
│  │ Draft Category:  [dropdown]   Word Count: [dropdown]     ││
│  │ Style Profile:   [dropdown]   Output Format: [dropdown]  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─── Strictness ──────────────────────────────────────────┐│
│  │ Preset:           [strict ▼]                             ││
│  │ Quotation:        [strict | moderate | permissive]       ││
│  │ Citation:         [strict | moderate | permissive]       ││
│  │ Unsupported:      [strict | moderate | permissive]       ││
│  │ ☑ Validation Appendix   ☑ Quality Gauntlet              ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─── Sections (auto or manual) ──────────────────────────┐ │
│  │ ☑ Auto-generate from prompt                             │ │
│  │ — OR —                                                   │ │
│  │ + Add Section  [title] [instructions] [citations req]   │ │
│  │   1. "Aristotle on Motion" | Focus on Physics III | ☑   │ │
│  │   2. "Aristotle on Time"   | Focus on Physics IV  | ☑   │ │
│  │   [drag to reorder]                                     │ │
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [Generate Prompt]  [Copy to Clipboard]  [Download .tex]     │
│                                                              │
│  ┌─── Preview ─────────────────────────────────────────────┐│
│  │ (live rendered prompt preview, read-only)                ││
│  │ ...                                                      ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### Source Selection (duplicated from ICP prompt tab)

Reuse the exact same pattern from `icpLoadCorpusSources()`:
- Corpus folder dropdown → triggers source checklist load via `/api/icp/corpus-sources/<folder>`
- Primary sources checklist (author + work)
- Secondary sources checklist (author + work)
- "Search all remaining sources" toggle

#### Strictness Controls

- Preset dropdown: `strict` / `moderate` / `permissive` / `custom`
- When preset is selected, all three sliders update together
- When any individual slider changes, preset switches to `custom`
- Checkboxes for Validation Appendix and Quality Gauntlet

#### Section Editor

- Default: "Auto-generate from prompt" checkbox is on
- When off, reveals a manual section editor with:
  - Add/remove section buttons
  - Per-section: title (text), instructions (textarea), citations required (checkbox), min quotations (number)
  - Drag-to-reorder support

#### Preview Pane

- Renders the generated prompt in real-time as the user configures settings
- Uses `<pre>` or syntax-highlighted view
- Updates on every config change (debounced 500ms)

#### Actions

- **Generate Prompt**: Calls `POST /api/icp/build-prompt` and shows result in preview
- **Copy to Clipboard**: Copies the generated prompt text
- **Download .tex**: Downloads as `.tex` file
- **Run with god-write**: Opens a confirm dialog, then runs god-write with the generated prompt

---

## 5. CLI Command

### `scripts/build-prompt.ts`

Usage:
```bash
npx tsx scripts/build-prompt.ts \
  --prompt "Analyze Aristotle's understanding of motion and time..." \
  --corpus-folder rhetorical_ontology \
  --primary "Aristotle:Physics" "Aristotle:De Anima" \
  --secondary "Heidegger:Basic Concepts of Aristotelian Philosophy" \
  --strictness strict \
  --word-count 2000 \
  --category section \
  --output prompt.tex
```

Flags:
| Flag | Description | Default |
|------|-------------|---------|
| `--prompt` | Research question (required) | — |
| `--corpus-folder` | Corpus folder | all |
| `--primary` | Primary sources (`Author:Title` pairs) | [] |
| `--secondary` | Secondary sources (`Author:Title` pairs) | [] |
| `--strictness` | Preset: `strict` / `moderate` / `permissive` | `strict` |
| `--word-count` | Target word count | `2000` |
| `--category` | Draft category | `section` |
| `--sections` | JSON file with manual section definitions | auto |
| `--no-appendix` | Skip Validation Appendix | false |
| `--no-gauntlet` | Skip Quality Gauntlet | false |
| `--format` | Output format: `tex` / `md` / `text` | `tex` |
| `--output` | Output file path | stdout |
| `--execute` | Immediately run god-write with the generated prompt | false |

When `--execute` is set, the CLI:
1. Generates the structured prompt
2. Passes it directly to `SectionOrchestrator.generateSection()` with the style profile
3. Outputs the generated prose (same as `/god-write --execute`)

---

## 6. API Endpoint

### `POST /api/icp/build-prompt`

Request body:
```json
{
  "prompt": "Analyze Aristotle's understanding of motion and time...",
  "corpusFolder": "rhetorical_ontology",
  "primarySources": [{"author": "Aristotle", "title": "Physics"}],
  "secondarySources": [{"author": "Heidegger", "title": "Basic Concepts"}],
  "strictness": { "quotation": "strict", "citation": "strict", "unsupported_claims": "strict" },
  "wordCount": "2000",
  "draftCategory": "section",
  "styleProfileId": "dalton-academic-mkn82c3v",
  "includeValidationAppendix": true,
  "includeQualityGauntlet": true,
  "outputFormat": "tex",
  "sections": null
}
```

Response:
```json
{
  "prompt": "You are generating a scholarly, dissertation-grade academic text...",
  "sections": [
    { "title": "Aristotle on Motion", "instructions": [...], "citationsRequired": true, "minQuotations": 1 }
  ],
  "metadata": {
    "wordCount": "2000",
    "draftCategory": "section",
    "primarySourceCount": 1,
    "secondarySourceCount": 1,
    "sectionCount": 7,
    "outputFormat": "tex"
  }
}
```

If `sections` is null in the request, the engine calls the LLM to auto-generate
sections from the prompt. The auto-generated sections are returned in the response
so the user can review/edit them before re-submitting.

---

## 7. Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/god-agent/core/composition/prompt-builder-engine.ts` | **CREATE** | Template engine (core logic) |
| `src/god-agent/core/composition/icp-types.ts` | MODIFY | Add `PromptBuilderConfig`, `PromptSection`, `PromptBuilderResult`, `StrictnessLevel` types |
| `src/god-agent/observability/icp-api-routes.ts` | MODIFY | Add `POST /api/icp/build-prompt` route |
| `src/god-agent/observability/dashboard/icp-panel.js` | MODIFY | Add "Prompt Builder" tab, `renderPromptBuilderPanel()`, strictness controls, section editor, preview pane |
| `src/god-agent/observability/dashboard/styles.css` | MODIFY | Styles for prompt builder panel |
| `scripts/build-prompt.ts` | **CREATE** | CLI runner script |
| `tests/god-agent/core/composition/prompt-builder-engine.test.ts` | **CREATE** | Unit tests for template engine |

---

## 8. Implementation Order

1. **Types** — Add types to `icp-types.ts`
2. **Engine** — Build `prompt-builder-engine.ts` with template assembly
3. **Tests** — Unit tests for engine (all three strictness presets, auto vs manual sections, source injection)
4. **API** — Wire up `POST /api/icp/build-prompt` in `icp-api-routes.ts`
5. **CLI** — Create `scripts/build-prompt.ts` runner
6. **Dashboard** — Add tab, panel, controls, preview pane
7. **Auto-section generation** — LLM-powered section decomposition (via ModelRouter → Anthropic)

---

## 9. Reference: `motion and time prompt.tex` Structure

The target format that the Prompt Builder should produce:

```
[1] Critical Rules (must be followed)
    1. Corpus-only sourcing
    2. citation_lookup requirement
    3. Citation mandate for claims
    4. Verbatim quotation rule
    5. No invented citations
    6. Unsupported claim handling

[2] Topic
    1. Main research question
    2. Secondary engagement instructions (per primary/secondary sources)

[3] Required Structure
    Generate approximately N words, organized into the following units:
    1. Section 1
        1.a. Focus
        1.b. Citation expectations
    2. Section 2
        ...
    N. Conclusion
        N.a. Synthesis instructions

[4] Validation Transparency Requirement
    After the main text, include a clearly labeled Validation Appendix:
    1. Claim Map
    2. Quotation Ledger
    3. Citation Ledger
    4. Validation Summary

[5] Final Instruction
    1. Stress-test framing
    2. Failure-over-fabrication rule
    3. Output format spec (Markdown)
        3.a. Generated text
        3.b. Quality Gauntlet Results
        3.c. Claim inventory
        3.d. Quote inventory
```

---

## 10. Open Questions

- [ ] Should the auto-section generator use the ICP PromptDecomposer (facets) or a
      separate, simpler decomposition? (The ICP decomposer produces facets for
      evidence retrieval, which is more granular than document sections.)
- [ ] Should the "Run with god-write" button be available in the dashboard, or
      should users copy the prompt and use the CLI? (Dashboard execution requires
      the full god-write pipeline to be callable from the API.)
- [ ] Should the Prompt Builder support saving/loading prompt templates for reuse?
- [ ] Should there be a "diff" view showing what changed between strictness presets?

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-17 | Initial design |
