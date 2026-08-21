# Subsection-Mode for /god-write — Design & Implementation Plan

**Status:** Awaiting user approval before any execution
**Date:** 2026-05-25
**Branch:** `writing-pipeline-v2` (HEAD `54c2ba1fec70775e57274fa3eeb9b42f1da8a4b8`)
**Companion docs:**
- Memory: [[analysis-upgrade-subsection-mode-integration]] — post-promotion verification path
- Failed experiment evidence: `tmp/Dissertation/Working tex versions/persubsection-runs/failures/`
- Existing reference outputs: `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionB.tex` (rolling-context, working)

---

## Problem statement

The per-subsection §1.5 generation experiment (workflow at `tmp/Concluding_Section_Prompt-PerSubsection/00-MASTER-WORKFLOW.md`) failed during Phase 1 because `/god-write`'s "gold-standard" pipeline mode is structurally configured for full-document generation (3,000–3,500 words, multi-section, Markdown-with-Validation-Appendix) rather than focused subsection generation (400–1,500 words, single-block, LaTeX). Two attempts on subsection 1 produced off-topic Markdown content with phantom quotations and zero mentions of the asked-for topic (A_4 at *praxis*).

Root causes are three independent code-level mismatches:

1. **`--word-target` is parsed but dropped** at `write-pipeline-orchestrator.ts:2035`. The flag value never reaches the prompt builder; a `--length`-derived target wins.
2. **Hardcoded v1 diagnostic thresholds** at `retrieval-utils.ts:228-234, 245-247`. The 2,500-word minimum and "target: 3,000-3,500" message are string literals, irrespective of caller intent.
3. **Mandatory Markdown structure injection** at `gold-standard-prompt-builder.ts:646-655`. The "MANDATORY" `## N. Title` directive overrides any LaTeX request from the user prompt; combined with the delta's own `##` markdown headers, the pipeline interprets meta-prompt structure as content scaffold.

The rolling-context mode (which produced the working versionA/B) bypasses all three issues by using a separate code path keyed off `rollingContextSectionWords: 700` in `gold-standard-config.ts:45`. That mode is the right tool for whole-section sequential generation but cannot be invoked for a single standalone subsection.

This plan adds a **third pipeline mode** — `--subsection-mode` — that:
- Reuses the multi-step v1→investigate→v2 quality cycle, citation enforcement, prose sanitization, corpus retrieval, style profile, and corpus/index enrichment of the existing gold-standard mode (everything that works)
- Adds a parallel branch for word-target derivation, prompt construction, and diagnostic thresholds (everything that's broken for subsection scale)
- Leaves the existing gold-standard and rolling-context modes untouched in behavior

---

## Guiding principles

1. **Backup precedes any change.** Phase 0 produces a complete restorable snapshot before any source file is touched.
2. **Additive only.** New flag (`--subsection-mode`), new prompt-builder function (`buildSubsectionPrompt`), new config block (`SUBSECTION_DEFAULTS`), new optional parameters on existing diagnostic functions. Existing code paths are guarded by `if (options.subsectionMode)` branches; the default (no flag) path is unchanged.
3. **One change per commit.** Each phase is its own commit. If any phase breaks regression tests, revert that single commit.
4. **Regression test before subsection test.** Existing gold-standard output (without `--subsection-mode`) must produce byte-identical output to the pre-change baseline before subsection-mode is tested.
5. **Smoke test before bulk run.** Subsection 1 must pass acceptance criteria (LaTeX output, on-topic content, ±15% word target, v2 revision fires, ≤1 phantom quote) before subsections 2–9 are attempted.
6. **Whitelist mode is a sibling, not a replacement.** Subsection-mode wraps within whitelist-mode (Opus + curated corpus + no inline validation) — both flags together produce the intended behavior.

---

## Phase 0 — Comprehensive backup (must be first; no source files touched until complete)

**Deliverable:** `backups/subsection-mode-pre-impl-YYYYMMDD-HHMMSS/` with all files we may modify, all reference outputs we'll regression-test against, full git state, and a one-command restoration script.

### What gets backed up

| Layer | Path | Why | Approx size |
|---|---|---|---|
| **TypeScript files to be modified** | | | |
| | `src/god-agent/universal/cli.ts` | Flag parsing additions (lines ~1487, ~1500) | 97 KB |
| | `src/god-agent/universal/write-pipeline-orchestrator.ts` | wordTarget branch (line 2035), prompt-builder call site, diagnostic threshold passing, logging additions | 180+ KB |
| | `src/god-agent/universal/gold-standard-prompt-builder.ts` | New `buildSubsectionPrompt()` function (no existing-function changes) | 90+ KB |
| | `src/god-agent/universal/gold-standard-config.ts` | New `SUBSECTION_DEFAULTS` block | 2 KB |
| | `src/god-agent/core/composition/retrieval-utils.ts` | Optional `subsectionThresholds` parameter on diagnostic function | 30+ KB |
| | `src/god-agent/universal/stages/retrieval-stage.ts` | Logging hooks for corpus/index contributions | 60+ KB |
| | `src/god-agent/universal/corpus-index-provider.ts` | Logging hooks if needed for `result.corpusIndexContributions` | 25 KB |
| | `src/god-agent/shared/cross-author-utils.ts` | Logging hooks if needed for `result.injectedBridges` | unknown |
| **Pre-existing in-tree backups (preserve as historical record)** | | | |
| | `src/god-agent/universal/write-pipeline-orchestrator.ts.pre-retrieval-fix-bak` | Prior fix point | n/a |
| | `src/god-agent/universal/write-pipeline-orchestrator.ts.pre-p3-bak` | Prior fix point | n/a |
| | `src/god-agent/universal/write-pipeline-orchestrator.ts.bak-pre-rolling-context-patch` | Prior fix point | n/a |
| | `src/god-agent/universal/write-pipeline-orchestrator.ts.pre-p1-fix-bak` | Prior fix point | n/a |
| | `src/god-agent/universal/write-pipeline-orchestrator.ts.git-version` | Prior git baseline | n/a |
| | `src/god-agent/core/writing/inline-validation-orchestrator.ts.pre-p1-fix-bak` | Inline validation fix history | n/a |
| **Reference outputs (regression baselines)** | | | |
| | `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionB.tex` | Canonical working rolling-context output; must remain reproducible after changes | 73 KB |
| | `tmp/Dissertation/Working tex versions/persubsection-runs/failures/01-A4-attempt1-prelude-first.tex` + `.log` | Phase-1 failure evidence for comparison against subsection-mode output | 83 KB + 1.8 MB |
| | `tmp/Dissertation/Working tex versions/persubsection-runs/01-A4.tex` (delta-first failure) + `logs/01-A4.log` | Phase-1 failure evidence (delta-first) | same |
| **Golden test outputs (NEW — captured during Phase 0)** | | | |
| | `backups/.../golden-tests/01-gold-standard-baseline.json` | A pre-change full run of an existing gold-standard CLI invocation, captured for byte-comparison post-change | ~80 KB |
| | `backups/.../golden-tests/02-rolling-context-baseline.json` | Pre-change rolling-context invocation (matches versionB config) for regression test | ~80 KB |
| **Git state** | | | |
| | `backups/.../GIT_HEAD.txt` | `git rev-parse HEAD` output (54c2ba1fec70775e57274fa3eeb9b42f1da8a4b8) | trivial |
| | `backups/.../GIT_BRANCH.txt` | `git rev-parse --abbrev-ref HEAD` (`writing-pipeline-v2`) | trivial |
| | `backups/.../GIT_STATUS.txt` | `git status --porcelain` output (captures all dirty files) | trivial |
| | `backups/.../GIT_DIFF_STAGED.patch` + `GIT_DIFF_UNSTAGED.patch` | Full diffs of any pre-existing in-progress changes | trivial |
| | Local lightweight tag `pre-subsection-mode-YYYYMMDD` | One-command `git reset --hard pre-subsection-mode-YYYYMMDD` to restore | trivial |
| **Run-state snapshot** | | | |
| | `backups/.../service-status.txt` | Output of `./scripts/god-launch status` (which services were running) | trivial |
| | `backups/.../compiled-index-sha.txt` | `sha256sum corpus/index/compiled-index.json` (so we can detect corpus drift) | trivial |
| **Restoration script** | | | |
| | `backups/.../RESTORE.sh` | Executable shell script that: stops services, copies all TypeScript files back, runs `git reset --hard <tag>`, restarts services | trivial |
| | `backups/.../MANIFEST.md` | Human-readable inventory: what was backed up, why, total size, restoration command, validation steps | trivial |

### Phase 0 execution steps

```
1. Create timestamped backup root: backups/subsection-mode-pre-impl-$(date +%Y%m%d-%H%M%S)/
2. mkdir subdirs: typescript-files/, pre-existing-bak-files/, reference-outputs/, golden-tests/, git-state/
3. Copy all listed TypeScript files preserving relative paths (cp --parents)
4. Copy pre-existing .bak files (preserve git-version + all pre-* files)
5. Copy reference outputs (versionB + 2 failure attempts)
6. Capture git state: HEAD, branch, status, diffs
7. Create local lightweight tag: git tag pre-subsection-mode-YYYYMMDD
8. Run pre-change golden tests:
   a. golden-test 1: `npx tsx src/god-agent/universal/cli.ts write "<a known small gold-standard prompt>" --execute --json --multi-step --whitelist --corpus-chunk-count 30 --corpus-min-relevance 0.60 --enable-endnotes --style academic --format paper --length medium --max-revisions 1` → save full JSON
   b. golden-test 2: `npx tsx src/god-agent/universal/cli.ts write "<reproduction of versionB prompt subset>" --execute --json --multi-step --whitelist --rolling-context ...` → save full JSON
9. Capture service status + compiled-index SHA
10. Write RESTORE.sh with executable bit
11. Write MANIFEST.md with everything inventoried
12. Verify backup completeness: file count + cumulative size + readability of RESTORE.sh
```

### Phase 0 acceptance criteria (gate)

- [ ] `backups/subsection-mode-pre-impl-*/` exists and contains all listed paths
- [ ] `MANIFEST.md` lists every backed-up artifact with size, source path, restoration path
- [ ] `RESTORE.sh` is executable and dry-run-tested (run it with `--dry-run` flag if implemented; otherwise read-aloud the commands to confirm they're correct)
- [ ] Local git tag `pre-subsection-mode-YYYYMMDD` exists (`git tag --list` shows it)
- [ ] Golden test 1 + 2 outputs are saved as JSON in `golden-tests/`
- [ ] Total backup size > 500 KB (sanity check that we didn't accidentally skip files)
- [ ] User reviews MANIFEST.md and approves before any source file is modified

**This phase does not modify any source file. It only reads and copies.**

---

## Phase 1 — Configuration additions (`gold-standard-config.ts`)

**Deliverable:** A new `SUBSECTION_DEFAULTS` constant in `gold-standard-config.ts` that holds subsection-scale defaults.

### Change

Append to `gold-standard-config.ts` after the existing `GOLD_STANDARD_CONFIG` block:

```typescript
/**
 * SubsectionDefaults — Defaults for subsection-mode generation.
 *
 * Subsection-mode targets single-block LaTeX output at 400-1500 words,
 * unlike GOLD_STANDARD_CONFIG which targets 3000-3500 word multi-section
 * full-document output.
 */
export const SUBSECTION_DEFAULTS = Object.freeze({
  /** Minimum acceptable word count as fraction of wordTarget. */
  totalMinRatio: 0.85,

  /** Section-words minimum as fraction of wordTarget
   *  (subsections are single-block, so this is effectively a floor on the whole output). */
  minSectionRatio: 0.5,

  /** Default verbatim-quotation target as fraction of wordTarget (1 quotation per ~350 words). */
  quotationsPerWords: 350,

  /** Max output tokens for subsection generation (Opus, lower than gold standard's 16K). */
  subsectionMaxTokens: 4096,

  /** Default min relevance for corpus chunks in subsection-mode (slightly stricter than gold). */
  minRelevanceFloor: 0.45,
});

export type SubsectionDefaults = typeof SUBSECTION_DEFAULTS;
```

### Acceptance criteria

- [ ] File compiles (`npx tsc --noEmit`)
- [ ] `SUBSECTION_DEFAULTS` exported and frozen
- [ ] No changes to existing `GOLD_STANDARD_CONFIG`

### Rollback

If this phase breaks compilation: `cp backups/.../typescript-files/src/god-agent/universal/gold-standard-config.ts src/god-agent/universal/gold-standard-config.ts`.

---

## Phase 2 — CLI flag parsing (`cli.ts`)

**Deliverable:** Three new CLI flags parsed and passed through to `agent.write()`.

### New flags

- `--subsection-mode` (boolean) — activates the parallel branch
- `--subsection-heading "..."` (string, optional) — exact `\subsubsection*{...}` heading content; if omitted, the model extracts from the prompt
- `--subsection-quotations N` (integer, optional) — explicit verbatim quotation target; if omitted, derives from `floor(wordTarget / SUBSECTION_DEFAULTS.quotationsPerWords)`

### Change

In `cli.ts` near line 1487 (where `wordTarget` is parsed):

```typescript
const subsectionMode = getFlag(flags, 'subsection-mode') === true;
const subsectionHeading = getFlag(flags, 'subsection-heading') as string | undefined;
const subsectionQuotations = (() => {
  const raw = getFlag(flags, 'subsection-quotations') as string | undefined;
  return raw !== undefined ? parseInt(raw) : undefined;
})();
```

In the `agent.write(...)` options object at line ~1501:

```typescript
subsectionMode,
subsectionHeading,
subsectionQuotations,
```

### Validation guards

If `subsectionMode === true` AND `wordTarget === undefined`:
```typescript
console.error('--subsection-mode requires --word-target N (e.g., --word-target 700)');
process.exit(1);
```

If `subsectionMode === true` AND `length` is one of `['comprehensive', 'long']`:
```typescript
console.warn('--length is ignored in --subsection-mode; using --word-target value instead');
```

### Acceptance criteria

- [ ] `npx tsx src/god-agent/universal/cli.ts write --help` (or similar) shows the new flags
- [ ] Passing `--subsection-mode` without `--word-target` exits with error
- [ ] Passing `--subsection-mode --word-target 700 --length medium` logs the warning and proceeds
- [ ] No existing invocation (without `--subsection-mode`) is affected
- [ ] Existing gold-standard golden-test 1 from Phase 0 reproduces byte-identical

### Rollback

`cp backups/.../typescript-files/src/god-agent/universal/cli.ts src/god-agent/universal/cli.ts`

---

## Phase 3 — Orchestrator branching (`write-pipeline-orchestrator.ts`)

**Deliverable:** The orchestrator routes to subsection-mode logic when the flag is on, while leaving non-subsection-mode behavior bit-identical.

### Type addition (near line 216)

```typescript
interface WriteOptions {
  // ... existing fields ...
  subsectionMode?: boolean;
  subsectionHeading?: string;
  subsectionQuotations?: number;
}
```

### Word-target branch (replace line 2035)

```typescript
// BEFORE:
const wordTarget = length === 'comprehensive' || (!length && options.whitelistMode) ? '3,000-3,500' :
              length === 'long' ? '2,000-2,500' :
              length === 'medium' ? '1,500-2,000' : '800-1,000';

// AFTER:
const wordTarget = options.subsectionMode && options.wordTarget
  ? options.wordTarget  // e.g., '700' or '400-700'
  : (length === 'comprehensive' || (!length && options.whitelistMode) ? '3,000-3,500' :
     length === 'long' ? '2,000-2,500' :
     length === 'medium' ? '1,500-2,000' : '800-1,000');
```

This is the **single most important behavioral change**. Existing path (no `subsectionMode`) is unchanged.

### Prompt-builder branch (in the `if (options.multiStep)` block around line 2040)

Both v1 and v2 prompt-building calls need to branch:

```typescript
// BEFORE: this.buildGoldStandardPrompt({ topic, subsections, chunks, ..., wordTarget });
// AFTER:
const promptBuilder = options.subsectionMode
  ? this.buildSubsectionPrompt.bind(this)
  : this.buildGoldStandardPrompt.bind(this);

const v1Prompt = promptBuilder({
  topic,
  subsections,
  chunks: corpusChunks,
  knowledgeUnits: knowledgeUnitLines,
  structuralEdges: structuralEdgeLines,
  ontologyNodes: ontologyLines,
  crossPipelineHooks: hookLines,
  tensionEdges: tensionLines,
  stylePrompt: '',
  wordTarget,
  subsectionHeading: options.subsectionHeading,
  subsectionQuotations: options.subsectionQuotations,
});
```

Same for the v2 prompt build (line ~2200 area) and the fallback single-shot build (line ~2070).

### Diagnostic threshold propagation (around line 2090, where v1 diagnostics fire)

When subsection-mode is on, compute and pass thresholds:

```typescript
const subsectionThresholds = options.subsectionMode ? {
  totalMin: Math.floor(parseInt(wordTarget.replace(/,/g, '').split('-')[0]) * SUBSECTION_DEFAULTS.totalMinRatio),
  totalTargetMsg: `~${wordTarget}`,
  minSectionWords: Math.floor(parseInt(wordTarget.replace(/,/g, '').split('-')[0]) * SUBSECTION_DEFAULTS.minSectionRatio),
  expansionMsg: `~${wordTarget} words for this subsection`,
} : undefined;

// Pass to the diagnostic function (Phase 5 modifies retrieval-utils.ts to accept this)
const v1Diagnostics = computeV1Diagnostics(v1Content, ..., { subsectionThresholds });
```

### Inline validation skip (line 2549) — verify already correct

Whitelist mode hard-disables inline validation at line 2536, and subsection-mode runs with whitelist. No change needed; just confirm in regression test that subsection-mode runs do not invoke inline validation.

### Corpus coverage check (line 2494) — relax for subsection-mode

```typescript
// BEFORE: if (dataSourceMode === 'corpus' && !options.whitelistMode) { ... }
// AFTER:  if (dataSourceMode === 'corpus' && !options.whitelistMode && !options.subsectionMode) { ... }
```

### Logging additions (NEW)

After the corpus index is loaded (around line 2007-2015) and after the mandatory theoretical synthesis bridge is selected (gold-standard-prompt-builder.ts:704-720, but the bridge selection actually happens via `getActiveBridges` called inside `buildGoldStandardPrompt`), capture the contributions for inclusion in the JSON output.

Two new fields on the orchestrator's return:

```typescript
// In the prompt-builder return, surface what was injected:
const promptBuildResult = promptBuilder({...});  // now returns { prompt, injectedBridges, corpusIndexContributions }

// In the orchestrator's return value (the `result.*` object the CLI serializes):
result.injectedBridges = promptBuildResult.injectedBridges;  // [{ id, sourceConcept, targetConcept, ... }]
result.corpusIndexContributions = promptBuildResult.corpusIndexContributions;  // { ontologyNodes: [...], hooks: [...], tensions: [...], queryExpansions: [...] }
```

This requires `buildGoldStandardPrompt` and `buildSubsectionPrompt` to return a richer object instead of a bare string. Refactor `buildGoldStandardPrompt` minimally to return `{ prompt, injectedBridges, corpusIndexContributions }` — this is a **shape-changing modification** to an existing function. **Backward compat:** for existing callers that destructure `prompt`, leave them as `const { prompt } = builder.buildGoldStandardPrompt(...)`. For old call sites that assigned the result to a string variable, those need updating.

**Alternative if shape-change is too risky for Phase 3:** thread the logging through a separate `this.lastInjectedBridges` mutable field on the orchestrator instance, written by `getActiveBridges`-callers and read after the build. Less clean but zero risk to existing callers.

I recommend the **shape-change approach** since both subsection-mode and gold-standard-mode benefit from the visibility, and the call-site count is small (3-4 callers of `buildGoldStandardPrompt`). The shape change is a contained refactor with clear regression test.

### Acceptance criteria

- [ ] Existing gold-standard golden-test 1 reproduces byte-identical (regression check)
- [ ] Existing rolling-context golden-test 2 reproduces byte-identical (regression check)
- [ ] A `--subsection-mode --word-target 700` invocation routes through the new branch (verify via log: `[orchestrator] subsection-mode active, wordTarget=700`)
- [ ] No subsection-mode invocation invokes inline validation (verify via log)
- [ ] New `result.injectedBridges` and `result.corpusIndexContributions` fields appear in JSON output for BOTH subsection-mode and gold-standard runs

### Rollback

`cp backups/.../typescript-files/src/god-agent/universal/write-pipeline-orchestrator.ts src/god-agent/universal/write-pipeline-orchestrator.ts` AND `git reset --hard pre-subsection-mode-YYYYMMDD`

---

## Phase 4 — New prompt builder (`gold-standard-prompt-builder.ts`)

**Deliverable:** A new `buildSubsectionPrompt(options)` function that produces a subsection-appropriate prompt.

### Function signature

```typescript
buildSubsectionPrompt(options: {
  topic: string;
  subsections: string[];
  chunks: ContextChunk[];
  knowledgeUnits: string[];
  structuralEdges: string[];
  ontologyNodes: string[];
  crossPipelineHooks: string[];
  tensionEdges: string[];
  stylePrompt: string;
  wordTarget: string;
  subsectionHeading?: string;
  subsectionQuotations?: number;
}): { prompt: string; injectedBridges: BridgeInfo[]; corpusIndexContributions: IndexContributions }
```

### Prompt structure (replaces the gold-standard Structure + Length blocks)

```
### Output Format (MANDATORY — LaTeX)

- Produce LaTeX output, NOT Markdown. Use \subsubsection*{...} for the heading (not ##).
- Use \textit{...} for italics, never *X* markdown italics.
- Use \textbf{...} for bold, never **X** markdown bold.
- Use \autocite[locus]{key} or footnote citations per dissertation convention.
- Block quotes use \begin{adjustwidth}{0.5in}{0in}...\end{adjustwidth}.
- Do NOT include LaTeX preamble (\documentclass, \usepackage, \begin{document}). Produce only the subsection body content.
- Do NOT include a Conclusion section, a Validation Appendix, or any wrapper structure beyond the single \subsubsection*{...} block.

### Subsection Heading

${options.subsectionHeading ?? '(infer from the topic; render as \\subsubsection*{...} with appropriate title and italicized Greek terms)'}

### Length (MANDATORY — READ CAREFULLY)

- Target: ${options.wordTarget} words of LaTeX body text.
- Acceptable range: ${minWords}-${maxWords} words (±15%).
- This is a SINGLE-BLOCK subsection. Do NOT produce multiple subsections, multiple sections, or section headings beyond the one specified above.
- Do NOT extend to the gold-standard 3,000+ word range. This is intentionally focused.

### Quotation density

- Aim for approximately ${options.subsectionQuotations ?? derivedDefault} verbatim quotation(s) from the corpus chunks.
- Each quotation must appear VERBATIM in a corpus chunk; do not paraphrase and present as quotation.
- Citation format: \autocite[<locus>]{<key>} for inline; block-quotes use adjustwidth environment with attribution after.
```

The rest of the prompt sections (source hierarchy, corpus chunks, knowledge units, structural edges, ontology nodes, mandatory theoretical synthesis bridge, citation rules, primary-text priority, style profile) **reuse the existing helper functions** from gold-standard-prompt-builder.ts:

- `buildGoldStandardChunkBlock(chunks)` — unchanged
- `buildSourceIndex(chunks)` — unchanged
- Mandatory theoretical synthesis bridge logic (currently inline at line 698-720) — extract to helper `buildMandatoryBridgeBlock(topic)` so both prompt builders can call it
- Structural edges block — extract to helper `buildStructuralEdgesBlock(edges)`
- Ontology nodes block — extract to helper `buildOntologyNodesBlock(nodes)`

### Refactoring of shared helpers

Before `buildSubsectionPrompt` lands, extract shared blocks from `buildGoldStandardPrompt` into module-level helpers. This is **mechanical refactoring with zero behavior change** — both before and after, `buildGoldStandardPrompt` produces identical output. Verify via the golden test from Phase 0.

### Returning structured output (instead of string)

Both `buildGoldStandardPrompt` and `buildSubsectionPrompt` return `{ prompt, injectedBridges, corpusIndexContributions }` (per Phase 3 alignment). The `injectedBridges` field captures the result of `getActiveBridges(topicWords)`; `corpusIndexContributions` captures the ontology nodes, hooks, tensions, and query expansions used during prompt construction.

### Acceptance criteria

- [ ] `buildGoldStandardPrompt` produces byte-identical prompt before and after refactor (verified via golden-test 1 reproduction)
- [ ] `buildSubsectionPrompt` exists and is exported
- [ ] A unit-test (or smoke run) invoking `buildSubsectionPrompt` with realistic inputs produces a prompt with: (a) `\subsubsection*{` header directive, (b) `Target: 700 words` length directive, (c) no `Validation Appendix` references, (d) no `Conclusion section` references, (e) corpus chunks block, (f) source index, (g) bridges/ontology/tensions blocks present
- [ ] `injectedBridges` and `corpusIndexContributions` fields are populated in both builders' returns

### Rollback

`cp backups/.../typescript-files/src/god-agent/universal/gold-standard-prompt-builder.ts src/god-agent/universal/gold-standard-prompt-builder.ts`

---

## Phase 5 — Diagnostic parameterization (`retrieval-utils.ts`)

**Deliverable:** The v1 diagnostic function accepts optional subsection-aware thresholds.

### Change

Locate the function containing the hardcoded `if (wordCount < 2500) {...}` at line 228 (likely `computeV1Diagnostics` or similar). Add optional parameter:

```typescript
function computeV1Diagnostics(
  content: string,
  citations: ...,
  chunkAuthorSet: ...,
  config?: {
    subsectionThresholds?: {
      totalMin: number;          // e.g., 595 for wordTarget 700
      totalTargetMsg: string;    // e.g., "~700"
      minSectionWords: number;   // e.g., 350 for wordTarget 700
      expansionMsg: string;      // e.g., "~700 words for this subsection"
    };
  }
): DiagnosticResult { ... }
```

Replace the hardcoded usages:

```typescript
// Section word check (line 218)
const minSection = config?.subsectionThresholds?.minSectionWords ?? GOLD_STANDARD_CONFIG.minSectionWords;
if (section.words < minSection) {
  issues.push({
    type: 'short-section',
    severity: 'major',
    detail: `Section "${section.heading}" has only ${section.words} words (minimum: ${minSection})`,
  });
}

// Overall word count check (line 228)
const totalMin = config?.subsectionThresholds?.totalMin ?? 2500;
const totalTargetMsg = config?.subsectionThresholds?.totalTargetMsg ?? '3,000-3,500';
if (wordCount < totalMin) {
  issues.push({
    type: 'insufficient-word-count',
    severity: 'major',
    detail: `Main text is only ${wordCount} words (target: ${totalTargetMsg})`,
  });
}

// Expansion prevention plan (line 246)
const expansionMsg = config?.subsectionThresholds?.expansionMsg ?? '3,000 words of main text';
if (issues.some(i => i.type === 'insufficient-word-count')) {
  strengthened.push(`Write AT LEAST ${expansionMsg}. Current v1 was only ${wordCount} words.`);
}
```

Existing callers (gold-standard mode) pass no `config` → defaults to original hardcoded values → byte-identical behavior.

### Acceptance criteria

- [ ] Existing gold-standard golden-test 1 reproduces byte-identical diagnostic output
- [ ] A subsection-mode call passes `subsectionThresholds: { totalMin: 595, totalTargetMsg: '~700', ... }` and the resulting diagnostic uses 595 and "~700" in messages
- [ ] No regression in phantom-quotation detection, under-cited-source detection, citation enforcement (those are independent of these thresholds)

### Rollback

`cp backups/.../typescript-files/src/god-agent/core/composition/retrieval-utils.ts src/god-agent/core/composition/retrieval-utils.ts`

---

## Phase 6 — Logging additions (corpus/index contributions + bridge injections)

**Deliverable:** Every `/god-write` run (subsection-mode or otherwise) surfaces what corpus/index contributed and which bridges were injected, via two new fields in `result.*`.

### Mechanism

This was scoped into Phase 3 (orchestrator) and Phase 4 (prompt builder) as a shape change to the prompt-builder return. Phase 6 verifies the wiring is complete and the JSON output exposes the new fields cleanly.

### Schema

```typescript
interface InjectedBridge {
  id: string;
  sourceAuthor: string;
  sourceConcept: string;
  targetAuthor: string;
  targetConcept: string;
  bridgeText: string;
  injectedAt: 'mandatory-theoretical-synthesis' | 'cross-pipeline-hook' | ...;
}

interface CorpusIndexContributions {
  ontologyNodesUsed: Array<{ name: string; greek?: string; centralityTier?: string }>;
  hooksInjected: Array<{ id: string; title?: string; tag?: string }>;
  tensionEdgesUsed: Array<{ id?: string; nodeA: string; nodeB: string; relation?: string }>;
  queryExpansions: Array<{ originalQuery: string; expandedTerms: string[] }>;
}
```

In the JSON output:

```json
{
  "command": "write",
  "result": {
    "content": "...",
    "injectedBridges": [...],
    "corpusIndexContributions": {...},
    ...
  }
}
```

### Strict mode (optional, deferred)

The `--corpus-index-priority strict` flag (from prior conversation) is **deferred to a v2 follow-up**. It's not needed for the §1.5 experiment. If user wants it in v1, add: at end of retrieval stage, if `options.corpusIndexPriority === 'strict'` AND `corpusIndexContributions.ontologyNodesUsed.length === 0` AND `corpusIndexContributions.queryExpansions.length === 0`, throw with message "Corpus index made no contribution to this run; topic may be out of index coverage."

### Acceptance criteria

- [ ] `result.injectedBridges` field exists in every `--json` output
- [ ] `result.corpusIndexContributions` field exists with all four sub-fields
- [ ] When 0 bridges are injected (topic doesn't match any), the field is `[]` not undefined
- [ ] Logging line in stderr/log file: `[corpus-index] Contributed N ontology nodes, M hooks, K tensions, J query-expansions to this run`
- [ ] Logging line in stderr/log file: `[bridges] Injected N cross-author bridges: [id1, id2, ...]`

### Rollback

Same as Phases 3 + 4 (this is wiring on top of those phases, no separate files).

---

## Phase 7 — Smoke test (subsection 1 only)

**Deliverable:** A single subsection-mode invocation against `tmp/Concluding_Section_Prompt-PerSubsection/01-A4-Convergence.md` produces an on-topic LaTeX subsection meeting acceptance criteria.

### Invocation

```bash
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/01-A4-Convergence.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 700 \
  --subsection-heading "A_4 in the Chain: The Convergence at \\textit{Praxis}" \
  --subsection-quotations 1 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/01-A4-subsection-mode.tex \
  2> tmp/Dissertation/Working\ tex\ versions/persubsection-runs/logs/01-A4-subsection-mode.log
```

Note the absence of: `--length`, `--enable-endnotes`, `_SHARED-PRELUDE.md` concatenation. The delta file alone is the prompt. `--subsection-heading` makes the LaTeX heading explicit. `--subsection-quotations 1` matches the delta's "single inline quotation" guidance.

### Acceptance criteria

- [ ] Output `result.content` starts with `\subsubsection*{A_4 in the Chain:` (LaTeX, not Markdown `##`)
- [ ] `result.content` contains the term "A_4", "praxis", and "De Motu Animalium" — confirms on-topic
- [ ] `result.content` contains the quoted phrase "the organic parts are suitably prepared by the affections" (DMA 7, 702a17-19 — the asked-for quote)
- [ ] `result.bodyWordCount` is within 595–805 (±15% of 700)
- [ ] `result.revisionIterations >= 1` — confirms v2 fired
- [ ] `result.multiStepDiagnostics.v1Diagnostics.issues` contains NO `phantom-quotation` of severity `critical`
- [ ] `result.multiStepDiagnostics.v1Diagnostics.issues` contains NO `insufficient-word-count` with hardcoded "3,000-3,500" message; if present at all, message references "~700"
- [ ] `result.injectedBridges` is populated (non-empty if topic matches any bridges)
- [ ] `result.corpusIndexContributions.ontologyNodesUsed` is non-empty (topic touches A_4, *praxis*, *phantasia*, etc., all of which should be in the index)
- [ ] `result.endnotes.generated === false` (endnotes off by default in subsection-mode)
- [ ] Output does NOT contain the Validation Appendix block

### What to do if smoke test fails

If any acceptance criterion fails, **stop**. Do not proceed to Phase 8. Diagnose:

- If off-topic: prompt builder needs further refinement (e.g., explicit `<USER PROMPT>` delimiter, system prompt vs user prompt split)
- If Markdown still: the MANDATORY LaTeX directive isn't strong enough; consider model-level system prompt override
- If word target wildly off: word-target plumbing has a bug; trace through Phase 3 changes
- If phantom quotations: subsection-mode needs the same strict citation enforcement as gold-standard (verify it's not being skipped)
- If revisionIterations=0: v1→investigate→v2 cycle isn't firing for subsection-mode; check Phase 3 branching

---

## Phase 8 — Regression validation (existing modes still work)

**Deliverable:** Both Phase 0 golden tests reproduce byte-identical output after all changes.

### Execution

```bash
# Re-run golden test 1 (gold-standard mode):
<exact same command from Phase 0 step 8a>
diff <new-output.json> backups/.../golden-tests/01-gold-standard-baseline.json

# Re-run golden test 2 (rolling-context mode):
<exact same command from Phase 0 step 8b>
diff <new-output.json> backups/.../golden-tests/02-rolling-context-baseline.json
```

### Acceptance criteria

- [ ] Golden test 1: diff is empty OR only the new `result.injectedBridges` and `result.corpusIndexContributions` fields are present (those are the intentional additions; everything else byte-identical)
- [ ] Golden test 2: same as above

### What to do if regression test fails

Roll back to backup tag (`git reset --hard pre-subsection-mode-YYYYMMDD` + restore files from `backups/.../typescript-files/`). Diagnose the diff: identify which change in Phases 1-6 caused the divergence. Re-attempt that single phase with a tighter fix.

---

## Phase 9 — Full Phase-1 rerun + coherence pass

**Deliverable:** All 9 per-subsection runs from `tmp/Concluding_Section_Prompt-PerSubsection/` succeed, followed by the coherence pass to produce `1.5 - A4 - Three Types of Action-v2-versionC.tex`.

### Execution

Rerun the 9 invocations from `tmp/Concluding_Section_Prompt-PerSubsection/00-MASTER-WORKFLOW.md` §2, modified to use subsection-mode flags:

```bash
# Per-subsection template:
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/<NN-delta>.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target <N> \
  --subsection-heading "<heading>" \
  --subsection-quotations <N> \
  --corpus-chunk-count <30 or 40> --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > <output>.tex 2> <log>.log
```

Per-subsection parameters:

| # | Word target | Quotations | Chunks | Heading |
|---|---|---|---|---|
| 1 | 700 | 1 | 30 | `A_4 in the Chain: The Convergence at \textit{Praxis}` |
| 2 | 900 | 1 | 30 | `\textit{Phantasia} at the Heart of Every Action` |
| 3 | 600 | 1 | 30 | `The Three-Factor Schema, the Three Entry Points` |
| 4 | 1300 | 2 | 40 | `Three Types of Action` |
| 5 | 700 | 1 | 30 | `The Content-Conditional Doxa-Gate` |
| 6 | 900 | 2 | 30 | `\textit{Hexis} Bivalence: \textit{Techn\=e}-Hexis and \textit{Praxis}-Hexis` |
| 7 | 700 | 1 | 30 | `The \textit{Pathetic} Loop: Synchronic Pass and Diachronic Sedimentation` |
| 8 | 700 | 1 | 30 | `Synthesis: Emotion as the Affective Architecture of Being-in-the-World` |
| 9 | 400 | 0 | 20 | `Development Note` (rendered as `\subsection*{Development Note}` since this one is `\subsection*`, not `\subsubsection*`) |

Note: subsection 9 requires `--subsection-heading-level subsection` (or equivalent flag) since it uses `\subsection*` instead of `\subsubsection*`. If that flag isn't worth adding, post-edit the output file in the coherence pass.

### Coherence pass

Triggered with "Run the coherence pass on the per-subsection §1.5 outputs." Executes Steps 1-4 from `00-MASTER-WORKFLOW.md` §3:

1. Inventory and concatenate 9 outputs
2. Diagnose 15 coherence categories
3. Apply fixes via Edit
4. Produce `1.5 - A4 - Three Types of Action-v2-versionC.tex` + report

### Acceptance criteria

- [ ] All 9 subsections produce on-topic LaTeX output meeting Phase 7's criteria scaled to each subsection
- [ ] Coherence pass produces versionC.tex that is suitable for A/B/C comparison against versionA and versionB
- [ ] Coherence-pass report documents per-subsection word counts, citation density, terminology compliance, transition quality

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Helper extraction in Phase 4 introduces byte-different gold-standard output | Medium | Phase 8 regression test catches this; Phase 4 acceptance criteria require byte-identical reproduction |
| Phase 3 shape change to prompt-builder return breaks an unknown caller | Low-Medium | Grep for all callers of `buildGoldStandardPrompt` before Phase 3; update each call site explicitly; full project compile required after Phase 3 |
| Subsection-mode word target gets through but model still generates 3000+ words | Medium | The prompt itself (Phase 4) reinforces the target; v1 diagnostic (Phase 5) flags overshoot; v2 doesn't re-expand because prevention plan no longer says "AT LEAST 3,000 words" |
| Subsection-mode produces Markdown despite LaTeX directive | Medium | Phase 4 prompt builder includes explicit "DO NOT use Markdown" with examples of WRONG (`## heading`) vs RIGHT (`\subsubsection*{...}`); if still fails, escalate to system-prompt-level override |
| Coherence pass can't merge per-subsection endnotes (since they're off) | Low | Subsection-mode disables endnotes by default per Item 5 decision; the coherence pass handles citation merging without endnotes |
| Bridge injection logging adds latency or breaks JSON output | Low | Logging is synchronous and small; JSON output adds two fields totaling < 5 KB typically |
| Analysis-upgrade promotion happens during this work, changing the bridge schema | Low | Memory note [[analysis-upgrade-subsection-mode-integration]] tracks this; subsection-mode design accommodates schema evolution because it just passes through whatever `getActiveBridges` returns |

---

## Out of scope (deferred to v2)

- `--corpus-index-priority strict` flag (Phase 6 noted; deferred unless requested)
- `--subsection-heading-level {subsection,subsubsection,paragraph}` flag (only needed for Development Note edge case in Phase 9)
- Interactive AskUserQuestion when console-orchestrating subsection runs (I'll do this manually per-run rather than wiring into the CLI itself)
- Adapting subsection-mode for non-dissertation contexts (e.g., journal-article subsections, blog-post sections) — design is general enough but not validated
- Analysis-upgrade promotion (separate work stream per [[analysis-upgrade-subsection-mode-integration]])

---

## Files this plan produces

| Path | Phase | Purpose |
|---|---|---|
| `backups/subsection-mode-pre-impl-YYYYMMDD-HHMMSS/` | 0 | Full restorable snapshot |
| `backups/.../golden-tests/01-gold-standard-baseline.json` | 0 | Pre-change golden output |
| `backups/.../golden-tests/02-rolling-context-baseline.json` | 0 | Pre-change golden output |
| `backups/.../MANIFEST.md` | 0 | Backup inventory |
| `backups/.../RESTORE.sh` | 0 | One-command restoration |
| Modified `gold-standard-config.ts` | 1 | `SUBSECTION_DEFAULTS` added |
| Modified `cli.ts` | 2 | Three new flags parsed |
| Modified `write-pipeline-orchestrator.ts` | 3 | Subsection-mode branching + logging hooks |
| Modified `gold-standard-prompt-builder.ts` | 4 | New `buildSubsectionPrompt` function + shared-helper extraction + structured return |
| Modified `retrieval-utils.ts` | 5 | Parameterized diagnostic thresholds |
| `tmp/Dissertation/Working tex versions/persubsection-runs/01-A4-subsection-mode.tex` | 7 | Smoke test output |
| `tmp/Dissertation/Working tex versions/persubsection-runs/0[1-9]-*.tex` | 9 | Full per-subsection outputs |
| `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC.tex` | 9 | Final coherence-pass output |
| `tmp/Dissertation/Working tex versions/1.5-coherence-pass-report-versionC.md` | 9 | Coherence-pass audit report |

---

## Approval gates

- [ ] **Gate A:** User reviews this plan doc, approves or requests changes
- [ ] **Gate B (after Phase 0):** User reviews `MANIFEST.md`, confirms backup is complete, authorizes Phase 1
- [ ] **Gate C (after Phase 7 smoke test):** User reviews smoke-test output `01-A4-subsection-mode.tex` and acceptance criteria checklist, authorizes Phase 8-9
- [ ] **Gate D (after Phase 9 coherence pass):** User reviews `versionC.tex` and accepts/rejects/iterates

No phase begins until the preceding gate is cleared.

---

## Estimated effort

- Phase 0: 30-45 min (mostly mechanical copy + golden-test runs)
- Phases 1-2: 30 min combined (config + CLI parsing, low complexity)
- Phase 3: 1.5-2.5 hr (orchestrator branching + return-shape refactor; the largest risk)
- Phase 4: 1-1.5 hr (new prompt builder + shared helper extraction; bounded)
- Phase 5: 30-45 min (single function parameterization)
- Phase 6: 30 min (verification + JSON output check; wiring is in Phases 3-4)
- Phase 7: 30 min (one CLI invocation + criteria check)
- Phase 8: 15 min (two diffs)
- Phase 9: 1-2 hr generation + 1-1.5 hr coherence pass

**Total: ~7-10 hours of focused work**, with three approval gates breaking it into manageable chunks.
