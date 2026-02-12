---
description: Complete a dissertation section with full context, style injection, and quality validation
---

Complete a dissertation section using the God Agent with full dissertation context, style profile injection, and multi-pass quality validation.

**Section Request:** $ARGUMENTS

## CRITICAL: CORPUS-ONLY CITATION CONSTRAINT (DEFAULT)

**BY DEFAULT, cite ONLY sources from the ingested corpus.** See `.claude/CORPUS-ONLY-CONSTRAINT.md` for the complete list of available sources.

- Do NOT fabricate or hallucinate sources
- Do NOT cite sources not in the corpus unless `--allow-external` is specified
- If a claim requires an unavailable source, reframe using corpus sources or flag for user review

**Available Corpus Sources Include:**
- Aristotle: *De Anima*, *Rhetoric*, *De Motu Animalium*, *De Sensu*, *De Memoria*
- Heidegger: *Being and Time*, *Basic Concepts of Aristotelian Philosophy*
- Frede, Nussbaum, O'Gorman, Gonzalez, Hawhee, Gross, White, Caston, Bowin, Papachristou, Rickert

## Overview

This command orchestrates the complete section-writing workflow:
1. Builds dissertation context from prior chapters (thesis, threads, glossary, forward references)
2. Injects the active style profile for voice consistency
3. Suggests relevant sources from the corpus **[CORPUS-ONLY BY DEFAULT]**
4. Generates the section content **[USING ONLY CORPUS SOURCES]**
5. Runs the Quality Gauntlet (argument coherence, citations, style, accuracy)
6. Iteratively revises until publication-ready quality is achieved

## NEW: Enhanced Quality Features (god-write Integration)

The command now includes 6 advanced features from the god-write pipeline:

1. **Human Verification Support** - Interactive review prompts between iterations
2. **User Satisfaction Tracking** - Post-completion rating and feedback collection
3. **Feedback Learning Integration** - Paragraph-level corrections feed back into style learning
4. **Provenance Ledger** - Track claim-source relationships for academic integrity
5. **Comprehensive Testing** - 30+ tests covering all workflows
6. **Enhanced Error Recovery** - Checkpoint/resume capability with exponential backoff

### Enabling Quality Features

All features are **opt-in** via command-line flags:

```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --interactive \                    # Enable human verification
  --enable-satisfaction \             # Enable satisfaction tracking
  --enable-feedback \                 # Enable feedback learning
  --enable-provenance \               # Enable provenance tracking
  --json
```

## Tiered Context System

For large dissertations (>30k tokens of accumulated context), the command supports **tiered context management** to optimize token usage while preserving essential information.

### The Three Tiers

| Tier | Name | Purpose | Token Budget |
|------|------|---------|--------------|
| **1** | Hot | Current section context, active arguments, immediate terms | ~50k tokens |
| **2** | Warm | Compressed chapter summaries, thesis statements, critical terms | ~20k tokens |
| **3** | Cold | On-demand RAG retrieval via AgentDB semantic search | Variable |

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIERED CONTEXT FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Full Dissertation        ──────►   Tier 2 (Warm)    ──────►   Tier 1  │
│   (All chapters)                     Compressed                  (Hot)   │
│                                      Summaries                 Promoted  │
│                                                               for current│
│                                                                section   │
│                     ▲                                                    │
│                     │                                                    │
│              Tier 3 (Cold)                                               │
│         AgentDB Vector Store                                             │
│       Semantic search on-demand                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### When to Use Tiered Context

Use the `--tiered` flag when:
- Your dissertation has 3+ completed chapters
- Accumulated context exceeds ~30k tokens
- You're experiencing context window limits
- You want optimized semantic retrieval for citations

**Decision Tree:**
```
Is accumulated context > 30k tokens?
├── YES → Use --tiered flag
│         └── Large dissertation? Use --token-budget 80000
│         └── Medium dissertation? Use default (60000)
└── NO  → Use standard context (no --tiered flag)
```

## Step 1: Parse Section Request

Parse the user's request to extract:
- **Chapter number** (required): Which chapter this section belongs to (1-indexed)
- **Section name/topic** (required): What the section should cover
- **Approximate length** (optional): Word count target (default: 2000-3000 words)
- **Special requirements** (optional): Any specific constraints or focus areas

Example requests:
- `Chapter 3, Section 2.1: Phantasia in De Anima III`
- `Chapter 5 conclusion: Synthesize the threefold role of imagination`
- `Chapter 2 literature review: Compare ancient and modern interpretations`

## Step 2: Initialize Section Completion

Run the section completion orchestrator CLI:

### Standard Context Mode (Default)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter [chapter_number] \
  --section "[section_name]" \
  --length [target_words] \
  --json
```

### Tiered Context Mode (For Large Documents)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter [chapter_number] \
  --section "[section_name]" \
  --length [target_words] \
  --tiered \
  --token-budget 60000 \
  --json
```

**All Available Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--tiered` | Enable tiered context compression | `false` |
| `--token-budget <n>` | Maximum tokens for context (with tiered) | `60000` |
| `--use-agentdb` | Use AgentDB for cold tier semantic search | `false` |
| **Phase 4: Multi-Source Retrieval Options** | | |
| `--use-multi-source` | Enable multi-source corpus retrieval | `false` |
| `--corpus-collections <list>` | Collections to query (comma-separated) | `notes,theory,empirical` |
| `--chunks-per-collection <n>` | Chunks to retrieve per collection | `10` |
| `--corpus-min-relevance <n>` | Minimum relevance threshold (0-1) | `0.75` |
| `--load-chapter-context` | Load existing chapter goals/structure | `false` |
| `--enable-coherence-check` | Check terminology consistency | `false` |
| **Quality Enhancement Options** | | |
| `--interactive` | Enable human verification between iterations | `false` |
| `--auto-accept-after <n>` | Auto-accept after N iterations | `never` |
| `--enable-satisfaction` | Enable satisfaction tracking | `false` |
| `--enable-feedback` | Enable feedback learning | `false` |
| `--enable-provenance` | Enable provenance ledger | `false` |
| **Endnote Generation Options** | | |
| `--enable-endnotes` | Generate endnotes with supporting quotations | `false` |
| `--max-quotations-per-endnote <n>` | Max supporting quotations per endnote | `3` |
| `--min-endnote-relevance <n>` | Minimum relevance threshold (0-1) | `0.65` |
| **Source Verification Options** | | |
| `--verify-sources` | Verify all citations exist in corpus after generation | `false` |
| `--acquire-missing` | Automatically download open access missing sources | `false` |
| `--download-dir <path>` | Directory for downloaded sources | `./corpus/downloads` |

This will:
1. Load dissertation context from `src/god-agent/cli/context/`
2. Build chapter-specific context using:
   - **Standard**: `DissertationContextManager.buildContextForChapter()`
   - **Tiered**: `DissertationContextManager.buildTieredContextForChapter()`
3. Load active style profile and deep style characteristics
4. Query corpus for relevant source suggestions (or use semantic search with `--tiered`)

## Step 3: Review Pre-Generation Context

The CLI outputs JSON with the assembled context:

### Standard Context Output
```json
{
  "chapter": 3,
  "section": "Phantasia in De Anima III",
  "dissertationContext": {
    "title": "...",
    "mainThesis": "...",
    "priorChapterSummaries": [...],
    "activeThreads": [...],
    "forwardPromises": [...],
    "relevantGlossaryTerms": [...]
  },
  "styleProfile": {
    "id": "dalton-academic-...",
    "characteristics": {...},
    "deepStylePrompt": "..."
  },
  "corpusSuggestions": [
    {"author": "Aristotle", "title": "On The Soul", "relevantChunks": [...]},
    ...
  ],
  "generationPrompt": "...",
  "success": true
}
```

### Tiered Context Output (with `--tiered`)
```json
{
  "chapter": 3,
  "section": "Phantasia in De Anima III",
  "tieredMode": true,
  "tokenBudget": 60000,
  "contextStats": {
    "tier1HotTokens": 2500,
    "tier2WarmTokens": 8500,
    "tier3ColdAvailable": true,
    "totalTokens": 11000,
    "compressionRatio": 0.18
  },
  "dissertationContext": "# DISSERTATION CONTEXT (Tiered Compression)...",
  "tier1Hot": {
    "currentSection": "Phantasia in De Anima III",
    "relevantArguments": [...],
    "immediateTerms": {...}
  },
  "tier2Warm": {
    "chapterSummaries": {...},
    "thesisStatements": [...],
    "criticalTerms": {...}
  },
  "tier3ColdAccessor": {
    "type": "AgentDB",
    "totalChunks": 245,
    "embeddingAvailable": true
  },
  "styleProfile": {...},
  "generationPrompt": "...",
  "success": true
}
```

**If context is incomplete**, the CLI will warn about:
- Missing prior chapter summaries
- Undefined thesis or sub-theses
- Unresolved forward references promised for this chapter

## Step 3.5: Optional - Interactive Verification Setup

If using `--interactive` mode, the system will prompt you between revision iterations:

### Human Verification Workflow

```
=============================================================================
QUALITY REVIEW REQUIRED
=============================================================================
Iteration: 1/3
Current Score: 73.5%
Target Threshold: 85.0%
Improvement: +5.2%

Issues Found:
  Critical: 2
  Major: 5
  Minor: 3

  ArgumentCoherenceChecker:
    - [major] Claim at paragraph 3 lacks supporting evidence
    - [major] Transition between arguments 2-3 is abrupt
    ...

Content Preview (first 500 chars):
This chapter examines Aristotle's concept of phantasia...

Actions:
  [c]ontinue  - Continue with automatic revision
  [a]ccept    - Accept current version (stop revisions)
  [g]uidance  - Provide custom guidance for revision
  [s]kip      - Skip specific issues
  [q]uit      - Abort revision process
  [d]isable   - Continue and disable future prompts

Your choice:
```

**Benefits:**
- Review quality issues before automatic revision
- Provide targeted guidance for specific problems
- Accept partial quality when good enough
- Skip non-critical issues
- Learn from user decisions over time

## Step 4: Generate Section Content

**CRITICAL**: Spawn a Task() subagent with the full generation prompt.

```
Task("academic-writer", "[generationPrompt from JSON]")
```

The prompt includes:
- Full dissertation context (thesis, prior chapters, threads)
- Style profile injection (voice, patterns, citation style)
- Corpus source suggestions with relevant excerpts
- Section-specific requirements
- Quality expectations

## Step 5: Run Quality Gauntlet

After generation, validate the section:

```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts validate \
  --chapter [chapter_number] \
  --content "[path_to_generated_content or inline]" \
  --json
```

The Quality Gauntlet runs 4 stages:
1. **ArgumentCoherenceChecker**: Logical flow, claim support, thesis alignment
2. **CitationCompletenessVerifier**: Citation coverage, format, corpus validation
3. **StyleConsistencyValidator**: Tone, voice, style profile adherence
4. **FactualAccuracyAuditor**: Internal consistency, term usage

## Step 6: Handle Quality Results

The validation returns:
```json
{
  "passed": false,
  "overallScore": 0.72,
  "revisionRequired": true,
  "criticalIssues": [...],
  "revisionGuidance": "...",
  "summary": {
    "totalIssues": 5,
    "criticalCount": 1,
    "majorCount": 2,
    "minorCount": 2
  }
}
```

### If `passed: true` (score >= 0.85):
Present the final section to the user with:
- Quality score
- Any minor suggestions for optional polish
- Corpus sources used
- Updated context (new threads, terms, etc.)

### If `passed: false` (revision needed):

**Interactive Revision Mode** (Recommended):
The revision loop supports interactive user review between iterations. At each step, you can:

1. **Review Issues**: Present the issues to the user clearly organized by severity
2. **Get User Input**: Ask if they want to:
   - Continue with automatic revision
   - Make manual edits to the text
   - Skip certain issues (mark as acceptable)
   - Add specific guidance for the revision
   - Accept the current version as-is

3. **Execute Revision**: If continuing, spawn a revision Task():
```
Task("academic-writer", "[revision prompt with specific issues + user guidance]")
```

4. **Iterate**: Re-validate and repeat (up to 5 iterations in interactive mode)

**Automatic Revision Mode** (for simpler cases):
1. Parse `revisionGuidance` and `criticalIssues`
2. Spawn a revision Task():
```
Task("academic-writer", "[revision prompt with specific issues]")
```
3. Re-run validation (max 3 iterations)
4. If still failing after 3 iterations, present partial result with remaining issues

**Interactive Review Decision Options**:
- `continue: true` - Proceed with next revision iteration
- `continue: false` - Stop and accept current version
- `modifiedText: "..."` - User's manual edits to apply
- `skipIssues: ["id1", "id2"]` - Issues to ignore
- `additionalGuidance: "..."` - Extra instructions for revision

## Step 7: Update Dissertation Context

After successful completion:

```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts update-context \
  --chapter [chapter_number] \
  --section "[section_name]" \
  --content "[final_content]" \
  --json
```

This:
- Adds chapter summary for future chapters
- Records new argument threads
- Adds defined terms to glossary
- Fulfills any forward references
- Saves updated context to disk

## Step 7.5: Optional Post-Completion Quality Features

### A. Satisfaction Rating (if `--enable-satisfaction`)

After a section is completed, collect user satisfaction ratings:

```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts rate \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --overall 8 \
  --style 9 \
  --quality 8 \
  --would-use true \
  --feedback "Strong argument structure, could use more examples" \
  --json
```

### B. Feedback Learning (if `--enable-feedback`)

Capture paragraph-level corrections for continuous improvement:

```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts feedback \
  --chapter 3 \
  --section "Phantasia" \
  --content ./output.md \
  --correction-file ./corrections.json \
  --json
```

### C. View Quality Statistics

```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts stats \
  --show-satisfaction \
  --show-feedback \
  --json
```

## Step 8: Present Final Output

Present to the user:
- **Final section content** (formatted markdown)
- **Quality score** and stage breakdown
- **Sources used** from corpus
- **Context updates** (new threads, terms, etc.)
- **Suggestions** for connecting to subsequent sections
- **Optional**: Satisfaction rating summary (if enabled)
- **Optional**: Provenance report (if enabled)

---

## Example Usage

### Standard Mode (Small Dissertations)
User: `/god-complete-section Chapter 3, Section 2: Aristotle's account of phantasia in De Anima III.3`

This command will:
1. Load context from Chapters 1-2 (if available)
2. Inject the `dalton-academic-*` style profile
3. Query corpus for Aristotle, De Anima, phantasia sources
4. Generate a scholarly section on phantasia
5. Validate against quality gauntlet
6. Revise if needed until passing
7. Update context for Chapter 4+

### Tiered Mode (Large Dissertations)
User: `/god-complete-section Chapter 5, Section 3.1: The Role of Phantasia in Practical Reasoning --tiered --token-budget 80000`

This command will:
1. Build tiered context with Hot/Warm/Cold compression
2. Load Tier 1 (Hot) context specific to this section
3. Include compressed Tier 2 (Warm) summaries from Chapters 1-4
4. Initialize Tier 3 (Cold) AgentDB for semantic retrieval
5. Inject style profile within token budget
6. Generate section with access to full dissertation via retrieval
7. Validate and revise with tiered context awareness
8. Update context and persist to AgentDB cold storage

---

## CLI Direct Examples

### Prepare with Standard Context
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --length 3000 \
  --json
```

### Prepare with Tiered Context
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 5 \
  --section "Practical Reasoning" \
  --length 3500 \
  --tiered \
  --token-budget 60000 \
  --json
```

### Prepare with AgentDB Cold Storage
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 5 \
  --section "Practical Reasoning" \
  --tiered \
  --use-agentdb \
  --token-budget 80000 \
  --json
```

### Check if Tiered Context is Recommended
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts stats --check-tiered
```

### With Interactive Verification (NEW)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --interactive \
  --auto-accept-after 3 \
  --json
```

### With All Quality Features Enabled (NEW)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --interactive \
  --enable-satisfaction \
  --enable-feedback \
  --enable-provenance \
  --tiered \
  --use-agentdb \
  --json
```

### With Phase 4 Multi-Source Retrieval (NEW)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --use-multi-source \
  --corpus-collections "notes,theory,empirical" \
  --chunks-per-collection 10 \
  --load-chapter-context \
  --enable-coherence-check \
  --json
```

### Complete Phase 4 Example (Multi-Source + Tiered + Quality)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --use-multi-source \
  --corpus-collections "notes,theory,empirical" \
  --chunks-per-collection 15 \
  --corpus-min-relevance 0.80 \
  --load-chapter-context \
  --enable-coherence-check \
  --tiered \
  --use-agentdb \
  --interactive \
  --enable-provenance \
  --json
```

### With Source Verification and Acquisition (NEW)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts complete \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --use-multi-source \
  --verify-sources \
  --acquire-missing \
  --download-dir "./corpus/downloads" \
  --json
```

This will:
1. Generate the section content
2. Verify all citations exist in the corpus
3. Download open access missing sources automatically
4. Provide links for paywalled sources
5. Generate a SOURCE_ACQUISITION_REPORT.md with details

### Capture Feedback After Completion (NEW)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts feedback \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --content ./output.md \
  --correction-file ./corrections.json \
  --sounds-like-me true \
  --json
```

### Rate Section Satisfaction (NEW)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts rate \
  --chapter 3 \
  --section "Phantasia in De Anima III" \
  --overall 8 \
  --style 9 \
  --quality 8 \
  --would-use true \
  --feedback "Excellent argument flow" \
  --json
```

### View Quality Statistics (NEW)
```bash
npx tsx src/god-agent/cli/dissertation/section-orchestrator.ts stats \
  --show-satisfaction \
  --show-feedback \
  --check-tiered \
  --json
```

---

**Integration Notes:**
- Requires `DissertationContextManager` from `src/god-agent/cli/context/`
- Uses `StyleInjector` with active style profile
- Leverages `CorpusCitationConnector` for source suggestions (standard mode)
- Uses `TieredContextManager` with AgentDB for semantic retrieval (tiered mode)
- Runs `QualityGauntlet` from `src/god-agent/cli/quality/`
