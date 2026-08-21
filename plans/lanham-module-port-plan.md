# Lanham Module Port — Implementation Plan

**Date:** 2026-04-15 (revised 2026-04-15)
**Source:** `/home/dalton/projects/god-agent-v2/` (branch: main)
**Target:** `/home/dalton/projects/claudeflow-testing/` (branch: writing-pipeline-v2)
**Analysis report:** `god-agent-v2/tmp/lanham-module-analysis-report.md`

---

## Executive Summary

Port the Lanham prose analysis subsystem (Richard A. Lanham's *Analyzing Prose* framework) from god-agent-v2 into claudeflow-testing. The module is a two-tier computational analysis system (heuristic + deep) with 7 analytical axes, genre-specific policy, pipeline integration for drift detection/revision guidance, a conversational agent, calibration suite, and CLI test harness.

**Total source files:** 10 implementation + 3 test/data + 1 enrichment script
**Total lines:** ~4,600 (implementation) + ~590 (tests) + ~160 (data/scripts)
**Current Lanham presence in target:** Zero — no types, no files, no references

---

## Design Decisions (from review)

Five architectural decisions refined after review of the initial plan:

1. **Orchestrator extraction:** All Lanham pipeline logic lives in a dedicated `lanham-style-controller.ts` facade — the orchestrator calls typed methods (`computeLanhamDrift()`, `maybeRegenerateWithLanham()`, `buildLanhamRevisionGuidance()`), never imports the analyzer or agent directly. This keeps the 3,714-line orchestrator as a coordinator, not a style-engine kitchen sink.

2. **Retrieval trigger: explicit signals only.** No regex fallback on topic strings. Collection inclusion requires either (a) `LanhamStyleTarget` on the task, or (b) profile has `lanhamMetrics` with `lanhamMode` set to `'on'` or `'auto'`. This prevents false-positive Lanham chunk inclusion on non-academic tasks.

3. **Tier 2 is opt-in, default off.** Tier 2 code is ported and compiling but the `lanham-style-controller` defaults to `analyzerTier: 'heuristic'`. The flip to `'deep'` or `'auto'` happens only after `lanham-calibration.test.ts` passes in this repo.

4. **Single prompt insertion point per concern.** `generateStylePrompt()` in `style-analyzer.ts` handles *descriptive* axis information (labels + explanations), omitting register and voice when a `LanhamStyleTarget` is present. `buildLanhamStyleBlock()` in the gold-standard builder handles *prescriptive* instructions (AT/THROUGH mode, register target, voice target, tacit budget). No overlap.

5. **Config validation gate (Phase 1.5).** After Tier 1 unit tests are ported, a dedicated gate verifies import resolution, Vitest config pickup, and type compatibility in the target repo before any pipeline integration work begins.

---

## Inventory: What Must Be Ported

### New Files (direct port from god-agent-v2)

| # | Source File | Lines | Target Path | Priority |
|---|-------------|-------|-------------|----------|
| 1 | `cli/style/lanham-analyzer-interface.ts` | 18 | Same relative path | P0 |
| 2 | `cli/style/lanham-prose-analyzer.ts` | 848 | Same relative path | P0 |
| 3 | `cli/style/lanham-style-policy.ts` | 102 | Same relative path | P0 |
| 4 | `cli/style/advanced-lanham-analyzer.ts` | 1,113 | Same relative path | P1 |
| 5 | `agents/lanham-prose-analyst.ts` | 588 | Same relative path | P1 |
| 6 | `cli/lanham-write-test.ts` | 511 | Same relative path | P2 |
| 7 | `cli/style/lanham-prose-analyzer.test.ts` | 136 | `tests/god-agent/cli/style/` | P0 |
| 8 | `tests/calibration/lanham-calibration.test.ts` | 506 | Same relative path | P1 |
| 9 | `tests/calibration/lanham-gold-set.jsonl` | 25 | Same relative path | P1 |
| 10 | `tests/integration/lanham-pipeline-smoke.test.ts` | 59 | Same relative path | P2 |
| 11 | `god-learn/analysis-trajectories.jsonl` | 19 | Same relative path | P1 |
| 12 | `scripts/enrich-style-lanham.mjs` | 138 | Same relative path | P2 |
| **13** | **(new) `universal/lanham-style-controller.ts`** | **~180** | **New file** | **P0** |

### Files Requiring Modification (in target codebase)

| # | File | Change | Lines Affected |
|---|------|--------|----------------|
| M1 | `universal/style-analyzer.ts` | Add `LanhamProseMetrics` interface + descriptive-only Lanham block in `generateStylePrompt()` (omit register/voice when `LanhamStyleTarget` present) + `mergeLanhamMetrics()` | ~70 new at :53, ~15 at :859+, ~30 merge |
| M2 | `universal/stages/stage-types.ts` | Add `LanhamStyleTarget` interface before `RetrievalResult` | ~25 new at :92 |
| M3 | `universal/stages/index.ts` | Export `LanhamStyleTarget` | 1 line |
| M4 | `universal/stages/retrieval-stage.ts` | Add `lanhamStyleTarget`, `hasLanhamMetrics` options; explicit-signal-only trigger (no regex fallback) | ~25 lines |
| M5 | `universal/gold-standard-prompt-builder.ts` | Import `LanhamStyleTarget`, add `buildLanhamStyleBlock()` (prescriptive only: AT/THROUGH, register, voice, tacit budget), inject at [2b] and [2d] | ~80 new lines |
| M6 | `universal/write-pipeline-orchestrator.ts` | Import `lanham-style-controller` facade; ~30 lines of call-sites (not inline logic) | ~30 lines |
| M7 | `cli/style/index.ts` | Export Lanham modules | ~10 lines |
| M8 | `universal/style-profile.ts` or equivalent | Add `lanhamMetrics?: LanhamProseMetrics` to stored profile type | 1 line |

---

## Dependency Graph

```
Phase 0: Types & Interface
  ├── M1: LanhamProseMetrics in style-analyzer.ts
  ├── M2: LanhamStyleTarget in stage-types.ts
  └── #1: lanham-analyzer-interface.ts
           │
Phase 1: Core Analyzers (depends on Phase 0)
  ├── #3: lanham-style-policy.ts
  ├── #2: lanham-prose-analyzer.ts (imports interface + policy + metrics type)
  ├── #7: lanham-prose-analyzer.test.ts
  └── M7: cli/style/index.ts exports
           │
Phase 1.5: Target Repo Validation Gate (depends on Phase 1)
  └── Verify imports, Vitest config, type compatibility in claudeflow-testing
           │
Phase 2: Pipeline Integration (depends on Phase 1.5)
  ├── #13: lanham-style-controller.ts (NEW — facade module)
  ├── M3: stages/index.ts export
  ├── M4: retrieval-stage.ts — explicit-signal collection trigger
  ├── M5: gold-standard-prompt-builder.ts — prescriptive buildLanhamStyleBlock()
  ├── M1+: style-analyzer.ts — descriptive generateStylePrompt() block (dedup-aware)
  ├── M6: write-pipeline-orchestrator.ts — ~30 lines of facade call-sites
  └── M8: style profile schema extension
           │
Phase 3: Advanced Analyzer (depends on Phase 1, opt-in default-off)
  ├── #4: advanced-lanham-analyzer.ts (with 3 bug fixes)
  ├── Shared utility extraction (lanham-shared.ts)
  └── Controller updated: analyzerTier config, default 'heuristic'
           │
Phase 4: Agent & Calibration (depends on Phases 1-2)
  ├── #5: lanham-prose-analyst.ts (4-mode agent)
  ├── #11: analysis-trajectories.jsonl (trajectory data)
  ├── #8: lanham-calibration.test.ts
  └── #9: lanham-gold-set.jsonl (25 gold passages)
           │
Phase 5: CLI & Enrichment (depends on Phases 1-4)
  ├── #6: lanham-write-test.ts (8-stage CLI harness)
  ├── #10: lanham-pipeline-smoke.test.ts
  └── #12: enrich-style-lanham.mjs
           │
Phase 6: Validation & Bug Fixes
  └── Address remaining known issues from analysis report
```

---

## Phase 0: Types & Interface

**Goal:** Establish the type contract that all subsequent phases depend on.

### Task 0.1 — Add `LanhamProseMetrics` to `style-analyzer.ts`

**File:** `src/god-agent/universal/style-analyzer.ts`
**Insert at:** Line 53 (after `ToneMetrics`, before `RegionalSettings`)
**Source:** `god-agent-v2/src/god-agent/universal/style-analyzer.ts:54–119`

Port the full `LanhamProseMetrics` interface (60 lines) verbatim. This includes:
- 15 continuous numeric fields
- `tacitPatterns` nested object (7 count/density fields)
- `labels` object (7 categorical string unions)
- `explanations` object (7 axis strings)
- `analysisDepth` enum
- `confidenceByAxis` object (7 confidence levels)

Also add `lanhamMetrics?: LanhamProseMetrics` to the `StyleCharacteristics` interface (at ~line 110, after `transitionPatterns`).

**Verification:** `tsc --noEmit` passes. No runtime changes.

### Task 0.2 — Add `LanhamStyleTarget` to `stage-types.ts`

**File:** `src/god-agent/universal/stages/stage-types.ts`
**Insert at:** Line 92 (after `recordWarning`, before `RetrievalResult`)
**Source:** `god-agent-v2/src/god-agent/universal/stages/stage-types.ts:93–118`

Port the `LanhamStyleTarget` interface (16 lines):
- `atThroughMode`: 4 literal union values
- `genre`: 6 genre types
- `voiceTarget`: 3 levels
- Optional: `registerTarget`, `allowRegisterPlay`, `tacitPersuasionLevel`, `emphasisAxes`

### Task 0.3 — Create `lanham-analyzer-interface.ts`

**File (new):** `src/god-agent/cli/style/lanham-analyzer-interface.ts`
**Source:** `god-agent-v2/src/god-agent/cli/style/lanham-analyzer-interface.ts` (18 lines)

Port verbatim. Fix the inaccurate comment (analysis report issue #7): change "uses dependency parsing + LLM" to "uses POS heuristics + phonemic analysis."

---

## Phase 1: Core Analyzers

**Goal:** Working Tier 1 heuristic analyzer with genre-specific policy.

### Task 1.1 — Port `lanham-style-policy.ts`

**File (new):** `src/god-agent/cli/style/lanham-style-policy.ts`
**Source:** `god-agent-v2/src/god-agent/cli/style/lanham-style-policy.ts` (102 lines)

Port verbatim. Contains:
- `GenreThresholds` type with per-axis band boundaries and `nounStyleOverride` thresholds
- `GENRE_THRESHOLDS` record (6 genres: academic, legal, narrative, journalistic, technical, general)
- `GENRE_DEFAULTS` record (behavioral guidance: registerTarget, allowRegisterPlay, tacitPersuasionLevel)

**No modifications needed** — the policy is static configuration with stable thresholds.

### Task 1.2 — Port `lanham-prose-analyzer.ts` (Tier 1)

**File (new):** `src/god-agent/cli/style/lanham-prose-analyzer.ts`
**Source:** `god-agent-v2/src/god-agent/cli/style/lanham-prose-analyzer.ts` (848 lines)

Port verbatim. Key components:
- Word lists and pattern banks (lines 12–112)
- Tokenizer + sentence splitter (lines 116–134)
- 7 axis analysis methods (lines 263–652)
- Label derivation with genre-specific thresholds (lines 656–749)
- `fullAnalysis()` orchestrator (lines 200–260)

**Import adjustments required:**
- `LanhamProseMetrics` import path: `../../universal/style-analyzer.js`
- `ILanhamAnalyzer` import path: `./lanham-analyzer-interface.js`
- `GenreThresholds` / `GENRE_THRESHOLDS` import path: `./lanham-style-policy.js`

**No functional changes** — the Tier 1 analyzer is self-contained (regex + counting, no external deps).

### Task 1.3 — Port unit tests

**File (new):** `tests/god-agent/cli/style/lanham-prose-analyzer.test.ts`
**Source:** `god-agent-v2/src/god-agent/cli/style/lanham-prose-analyzer.test.ts` (136 lines)

Port and update import paths. Run with `vitest run tests/god-agent/cli/style/lanham-prose-analyzer.test.ts`.

### Task 1.4 — Export from `cli/style/index.ts`

**File:** `src/god-agent/cli/style/index.ts`
**Add exports for:**
- `LanhamProseAnalyzer` from `./lanham-prose-analyzer.js`
- `ILanhamAnalyzer` from `./lanham-analyzer-interface.js`
- `GenreThresholds`, `GENRE_THRESHOLDS`, `GENRE_DEFAULTS` from `./lanham-style-policy.js`

**Verification:** `vitest run` on unit tests passes. `tsc --noEmit` clean.

---

## Phase 1.5: Target Repo Validation Gate

**Goal:** Confirm the ported Phase 0–1 code works correctly in claudeflow-testing's build environment before touching any pipeline files.

### Gate checks (all must pass before Phase 2):

1. **Import resolution:** `tsc --noEmit` clean — verifies `.js` extension imports, `tsconfig` path mappings, and module resolution all work
2. **Vitest pickup:** `vitest run tests/god-agent/cli/style/lanham-prose-analyzer.test.ts` — confirms the test file is discovered by Vitest's include patterns and the test runner can import the source modules
3. **Type compatibility:** No ambient conflicts between new `LanhamProseMetrics` and existing `StyleCharacteristics` — both live in `style-analyzer.ts` and must co-export cleanly
4. **Analyzer smoke test:** Instantiate `LanhamProseAnalyzer('academic')`, call `fullAnalysis()` on a known paragraph, verify the result satisfies the `LanhamProseMetrics` interface shape (all fields present, labels are valid union members)

**If any gate fails:** Fix before proceeding. Common causes: different `tsconfig` `moduleResolution`, Vitest `include` globs not matching `tests/god-agent/cli/style/`, or conflicting re-exports.

---

## Phase 2: Pipeline Integration

**Goal:** Wire Lanham analysis into the write pipeline via a typed facade — style prompt injection, drift detection, revision guidance, and paragraph-boundary regeneration.

### Task 2.1 — Create `lanham-style-controller.ts` (facade)

**File (new):** `src/god-agent/universal/lanham-style-controller.ts`
**Lines:** ~180

This is the central Lanham pipeline module. The orchestrator calls this; it never imports the analyzer or agent directly.

```typescript
export interface LanhamControllerConfig {
  analyzerTier: 'heuristic' | 'deep' | 'auto';  // default: 'heuristic'
  genre: LanhamStyleTarget['genre'];
  targetMetrics?: LanhamProseMetrics;
  lanhamStyleTarget?: LanhamStyleTarget;
}

export class LanhamStyleController {
  constructor(config: LanhamControllerConfig);

  /** Run full analysis on generated text, return metrics */
  analyze(text: string): Promise<LanhamProseMetrics>;

  /** Compare generated metrics against target, return tiered drift advisory (or null) */
  computeLanhamDrift(
    generated: LanhamProseMetrics,
    target: LanhamProseMetrics | undefined
  ): string | null;

  /** Run drift analysis + conditional regen. Returns original or regenerated content. */
  maybeRegenerateWithLanham(
    sectionContent: string,
    regenerateFn: (advisory: string) => Promise<string>
  ): Promise<{
    content: string;
    regenerated: boolean;
    metrics: LanhamProseMetrics;
    triggeredAxes: string[];
    firmGuidanceAdvisory: string | null;
  }>;

  /** Invoke LanhamProseAnalyst in 'revise' mode, return formatted guidance block (or null) */
  buildLanhamRevisionGuidance(text: string): Promise<string | null>;
}
```

Internal implementation:
- `computeLanhamDrift()` contains the tiered enforcement logic (hard: nounVerb/register, firm: voice, soft: excluded)
- `maybeRegenerateWithLanham()` orchestrates: analyze → drift check → regen if hard constraints violated → re-analyze
- `buildLanhamRevisionGuidance()` wraps `LanhamProseAnalyst` in try/catch, non-fatal
- `analyzerTier` selects Tier 1 by default; `'auto'` uses Tier 2 only for low-confidence axes (future, after Phase 3 validation)

### Task 2.2 — Retrieval stage: explicit-signal collection trigger

**File:** `src/god-agent/universal/stages/retrieval-stage.ts`
**Source reference:** `god-agent-v2/src/god-agent/universal/stages/retrieval-stage.ts:74–123`

Add to `RetrievalStageOptions`:
```typescript
lanhamStyleTarget?: import('./stage-types.js').LanhamStyleTarget;
hasLanhamMetrics?: boolean;
```

Add `shouldIncludeTextualAnalysis()` function (~15 lines) that returns true when:
1. `LanhamStyleTarget` is present on the task, **OR**
2. Profile has `lanhamMetrics` and `lanhamMode` is `'on'` or `'auto'`

**No regex fallback.** No topic-string matching. Explicit signals only.

Wire into collection resolution so `textual_analysis` (or `v2_knowledge_chunks`) is included when triggered.

### Task 2.3 — Gold standard prompt builder: prescriptive Lanham block

**File:** `src/god-agent/universal/gold-standard-prompt-builder.ts`
**Source reference:** `god-agent-v2/src/god-agent/universal/gold-standard-prompt-builder.ts:164–230`

This is the **sole prescriptive** Lanham insertion point. It owns behavioral instructions.

1. Import `LanhamStyleTarget` from `./stages/stage-types.js`
2. Add `lanhamStyleTarget?: LanhamStyleTarget` to `GoldStandardPromptOptions`
3. Add `lanhamRevisionGuidance?: string` to prompt options
4. Port `buildLanhamStyleBlock()` function (~60 lines) — constructs:
   - AT/THROUGH mode instruction (4 cases)
   - Register target + voice target
   - Tacit persuasion budget
5. Inject at prompt section [2b] (after style prompt, before grounding rules)
6. Inject revision guidance at [2d] when present

### Task 2.4 — Style analyzer: descriptive-only Lanham block (dedup-aware)

**File:** `src/god-agent/universal/style-analyzer.ts`
**Source reference:** `god-agent-v2/src/god-agent/universal/style-analyzer.ts:859–869`

In `generateStylePrompt()`, add a block that checks for `style.lanhamMetrics` and appends `## PROSE STYLE DIMENSIONS (Lanham Framework)` with axis labels and explanations.

**Deduplication rule:** When a `LanhamStyleTarget` is present (passed as an optional parameter), the descriptive block **omits register and voice** labels/explanations — those are handled prescriptively by `buildLanhamStyleBlock()` in the gold-standard builder. Remaining axes (nounVerb, parataxis, periodicRunning, opacity, tacitPatterns) stay in the descriptive block because the builder doesn't cover them.

Also port `mergeLanhamMetrics()` (~30 lines) for length-weighted merging of multi-sample Lanham metrics.

### Task 2.5 — Write pipeline orchestrator: facade call-sites

**File:** `src/god-agent/universal/write-pipeline-orchestrator.ts`
**Source reference:** `god-agent-v2/src/god-agent/universal/write-pipeline-orchestrator.ts:1299–1559`

The orchestrator gets **~30 lines of call-sites**, not ~250 lines of inline logic:

**2.5a — Imports** (top of file):
```typescript
import type { LanhamStyleTarget } from './stages/stage-types.js';
import { LanhamStyleController, type LanhamControllerConfig } from './lanham-style-controller.js';
```

**2.5b — Controller instantiation** (in the multi-section generation setup):
```typescript
const lanhamController = lanhamStyleTarget
  ? new LanhamStyleController({
      analyzerTier: 'heuristic',
      genre: lanhamStyleTarget.genre,
      targetMetrics: targetLanhamMetrics,
      lanhamStyleTarget,
    })
  : null;
```

**2.5c — Post-section call-sites** (in the section loop, after each draft):
```typescript
// Lanham drift analysis + conditional regen
if (lanhamController && !isConclusion) {
  const result = await lanhamController.maybeRegenerateWithLanham(
    sectionContent,
    (advisory) => regenerateSection(sectionContent, advisory)
  );
  sectionContent = result.content;
  if (result.firmGuidanceAdvisory) {
    pendingDriftAdvisory = result.firmGuidanceAdvisory;
  }
  // Revision guidance for next section
  const guidance = await lanhamController.buildLanhamRevisionGuidance(sectionContent);
  pendingLanhamRevisionGuidance = guidance;
}
```

**2.5d — Pass-through to prompt options:**
```typescript
lanhamStyleTarget,
lanhamRevisionGuidance: pendingLanhamRevisionGuidance || undefined,
```

### Task 2.6 — Stages index export

**File:** `src/god-agent/universal/stages/index.ts`
**Add:** `LanhamStyleTarget` to the type export list.

### Task 2.7 — Style profile schema extension

**File:** `src/god-agent/universal/style-profile.ts` (or wherever `StoredStyleProfile` is defined)
**Add:** `lanhamMetrics?: LanhamProseMetrics` field to the stored profile interface.

**Verification:** Full `tsc --noEmit`. Manual test: run `/god-write` with `--lanham-mode on` and verify the prompt contains the Lanham style block. Run `/god-write` *without* `--lanham-mode` and verify output is identical to pre-port (no Lanham code paths fire).

---

## Phase 3: Advanced Analyzer (Tier 2) — Opt-In, Default Off

**Goal:** Port Tier 2 code with bug fixes. Keep it compiling and testable but not active in production flows until calibration passes.

### Task 3.1 — Port `advanced-lanham-analyzer.ts`

**File (new):** `src/god-agent/cli/style/advanced-lanham-analyzer.ts`
**Source:** `god-agent-v2/src/god-agent/cli/style/advanced-lanham-analyzer.ts` (1,113 lines)

Port with the following **bug fixes from the analysis report** applied during port:

**Bug fix #1 — Tier 2 register labels (report issue #1):**
Lines 947–960: Replace hardcoded register boundaries (`lgr < 0.25` / `lgr >= 0.35`) with genre-specific `t.register.lowToMiddle` / `t.register.middleToHigh` from the policy file, matching Tier 1 behavior.

**Bug fix #2 — Missing nounStyleOverride (report issue #2):**
Line 932: Add `nounStyleOverride` logic from Tier 1 (lines 712–722) to Tier 2's `deriveLabels()`. When all three signals (nominalizationDensity, beVerbRatio, prepositionalPhraseDensity) exceed genre-specific thresholds, override "balanced" → "predominantly noun-style".

**Bug fix #3 — Double tacit pattern computation (report issue #3):**
Cache the result of `detectTacitPatterns(text)` from `fullAnalysis()` line 317 and reuse it in `analyzeOpacityTransparency()` line 661 instead of computing twice.

### Task 3.2 — Export from `cli/style/index.ts`

Add `AdvancedLanhamAnalyzer` export.

### Task 3.3 — Shared utility extraction (design concern #5)

Extract ~450 duplicated lines into `lanham-shared.ts`:
- `tokenize()`, `splitSentences()`, `clamp()`, `getContentWords()`, `roughStem()`
- Word lists: `COMMON_VERBS`, `COORDINATING_CONJ`, `SUBORDINATING_CONJ`, `META_LINGUISTIC_MARKERS`
- Pattern detection loops: alliteration, polyptoton, anaphora, isocolon, climax

Both Tier 1 and Tier 2 import from the shared module.

### Task 3.4 — Controller update for tier selection

Update `LanhamStyleController.analyze()` to respect `analyzerTier`:
- `'heuristic'` (default): uses `LanhamProseAnalyzer` (Tier 1)
- `'deep'`: uses `AdvancedLanhamAnalyzer` (Tier 2)
- `'auto'`: uses Tier 1, then upgrades low-confidence axes (periodic/running, parataxis) with Tier 2

**The default remains `'heuristic'` until Phase 4 calibration passes in this repo.**

### Tier 2 activation criteria

Tier 2 becomes eligible for `'auto'` or `'deep'` default only when ALL of:
1. `lanham-calibration.test.ts` passes in claudeflow-testing
2. Tier 2 register labels match Tier 1 for academic genre input (bug fix #1 verified)
3. `nounStyleOverride` fires correctly in Tier 2 (bug fix #2 verified)
4. Tacit patterns computed exactly once per analysis (bug fix #3 verified)

---

## Phase 4: Agent & Calibration

**Goal:** Port the conversational agent and calibration infrastructure.

### Task 4.1 — Port `lanham-prose-analyst.ts`

**File (new):** `src/god-agent/agents/lanham-prose-analyst.ts`
**Source:** `god-agent-v2/src/god-agent/agents/lanham-prose-analyst.ts` (588 lines)

Four modes: describe, revise, critique, teach.

**Import adjustments:**
- `LanhamProseMetrics` from `../universal/style-analyzer.js`
- `LanhamStyleTarget` from `../universal/stages/stage-types.js`
- `LanhamProseAnalyzer` from `../cli/style/lanham-prose-analyzer.js`

**Dependency:** Requires `analysis-trajectories.jsonl` (Task 4.2) for trajectory selection.

### Task 4.2 — Port trajectory data

**File (new):** `god-learn/analysis-trajectories.jsonl`
**Source:** `god-agent-v2/god-learn/analysis-trajectories.jsonl` (19 lines)

Copy verbatim. These are worked-example trajectories from Lanham's "Two Lemon Squeezers" and other analyses.

### Task 4.3 — Port calibration suite

**File (new):** `tests/calibration/lanham-calibration.test.ts` (506 lines)
**File (new):** `tests/calibration/lanham-gold-set.jsonl` (25 lines)

The calibration test computes per-axis Spearman rank monotonicity across 25 gold-labeled passages. Enforcement tiers:
- Hard constraint (nounVerb, register): monotonicity >= 0.85
- Firm guidance (voice): >= 0.75
- Soft observation (parataxis, opacity): >= 0.70
- Informational (periodicRunning): >= 0.65 (report only)

**Verification:** `vitest run tests/calibration/lanham-calibration.test.ts` — all monotonicity targets met. If Tier 2 is present, run calibration for both tiers and compare.

---

## Phase 5: CLI & Enrichment

**Goal:** End-to-end test harness and profile enrichment tooling.

### Task 5.1 — Port `lanham-write-test.ts`

**File (new):** `src/god-agent/cli/lanham-write-test.ts`
**Source:** `god-agent-v2/src/god-agent/cli/lanham-write-test.ts` (511 lines)

8-stage pipeline validation: pre-flight → retrieval → style check → generation → analysis → drift → artifacts.

**Fix during port (report issue #14):** Replace hardcoded `claude-sonnet-4-20250514` in Stage 5 prefetched mode with a configurable model parameter or environment default.

### Task 5.2 — Port smoke test

**File (new):** `tests/integration/lanham-pipeline-smoke.test.ts`
**Source:** `god-agent-v2/tests/integration/lanham-pipeline-smoke.test.ts` (59 lines)

5 assertions: ChromaDB heartbeat, embedding reachability, collection resolution, retrieval >0 chunks, profile has lanhamMetrics.

### Task 5.3 — Port enrichment script

**File (new):** `scripts/enrich-style-lanham.mjs`
**Source:** `god-agent-v2/scripts/enrich-style-lanham.mjs` (138 lines)

**Fix during port (report issue #6):** Replace hardcoded `'academic'` genre (line 79) with genre read from profile metadata: `profile.metadata.genre || 'academic'`.

**Verification:** Run `node scripts/enrich-style-lanham.mjs` against the active profile (`dalton-academic-mkn82c3v`). Verify `lanhamMetrics` appears in `.agentdb/universal/style-profiles.json`.

---

## Phase 6: Known Issue Remediation

Address remaining issues from the analysis report, prioritized by impact.

### 6.1 — Bugs (applied during port)

| Issue | Severity | Phase Applied |
|-------|----------|---------------|
| Tier 2 register hardcoded boundaries | BUG | Phase 3 (Task 3.1) |
| Tier 2 missing nounStyleOverride | BUG | Phase 3 (Task 3.1) |
| Tier 2 double tacit computation | BUG | Phase 3 (Task 3.1) |

### 6.2 — Design concerns (address post-port)

| Issue | Priority | Action |
|-------|----------|--------|
| Sentence splitter abbreviation/decimal fragility | MEDIUM | Add abbreviation exemption list (`Dr.`, `Mr.`, `U.S.`, `e.g.`, `i.e.`, decimal pattern) to `splitSentences()` in shared utils |
| Code duplication (~450 lines) | MEDIUM | Phase 3 Task 3.3 (shared utility extraction) |
| Enrichment hardcodes 'academic' genre | LOW | Phase 5 Task 5.3 (fix during port) |
| Interface comment inaccuracy | LOW | Phase 0 Task 0.3 (fix during port) |

### 6.3 — Accepted limitations (no action needed)

| Issue | Status |
|-------|--------|
| Opacity heuristic misses conceptual self-reference | Documented, correctly scoped as soft/informational |
| Periodic/running axis coarse | Correctly scoped as informational (no enforcement) |
| `isNominalization()` overcounts | Compensated by monotonicity calibration |
| POS tagger defaults to 'N' | Known bias, acceptable for current chiasmus detection |

---

## Integration Risk Assessment

### Low Risk
- **Type additions** (Phase 0): Purely additive interfaces — no existing code affected
- **Policy file** (Phase 1): Static config, self-contained
- **Tier 1 analyzer** (Phase 1): Self-contained, no external deps beyond regex/string
- **Trajectory data** (Phase 4): Data file, no code coupling
- **Facade module** (Phase 2): New file, no existing code modified

### Medium Risk
- **Retrieval stage modification** (Phase 2): Adding collection trigger logic. Risk: incorrect trigger could include irrelevant Lanham chunks. Mitigation: explicit signals only — no regex fallback, no topic-string guessing.
- **Gold standard prompt builder** (Phase 2): Inserting new prompt sections. Risk: prompt bloat. Mitigation: Lanham block only injected when `lanhamStyleTarget` present; prescriptive-only content (no axis duplication).
- **Enrichment script** (Phase 5): Writes to profile storage. Risk: corrupt profile. Mitigation: validate output against `LanhamProseMetrics` type before write.

### Lower Risk (revised from "Higher")
- **Write pipeline orchestrator** (Phase 2, Task 2.5): Now ~30 lines of facade call-sites instead of ~250 lines of inline logic. All Lanham logic lives in `lanham-style-controller.ts`. The orchestrator's only new responsibility is instantiating the controller and calling three methods. Risk: the regeneration callback closure. Mitigation: test with and without `lanhamStyleTarget` to verify no-op behavior when Lanham is off.

### Pre-Port Validation
Before starting Phase 2, verify the target orchestrator (`write-pipeline-orchestrator.ts`, 3,714 lines) against the source orchestrator (4,248 lines) to identify **non-Lanham divergences**. The 534-line gap is partially Lanham (~250 lines) but may include other v2 improvements that should be reconciled or excluded.

---

## File-Level Diff Estimate

| Category | New Files | Modified Files | New Lines | Modified Lines |
|----------|-----------|----------------|-----------|----------------|
| Phase 0: Types | 1 | 2 | 18 | ~90 |
| Phase 1: Analyzers | 2 + 1 test | 1 | ~1,086 | ~10 |
| Phase 1.5: Gate | 0 | 0 | 0 | 0 (verification only) |
| Phase 2: Pipeline | 1 (controller) | 5 | ~180 | ~160 |
| Phase 3: Advanced | 2 (analyzer + shared) | 1 | ~1,113 + ~450 shared | ~5 |
| Phase 4: Agent + Cal | 2 + 2 data | 0 | ~1,113 | 0 |
| Phase 5: CLI | 1 + 1 test + 1 script | 0 | ~708 | 0 |
| **Total** | **~14** | **~9** | **~4,668** | **~265** |

---

## Verification Checkpoints

After each phase, the following must pass before proceeding:

| Phase | Checkpoint |
|-------|------------|
| 0 | `tsc --noEmit` clean |
| 1 | `vitest run tests/god-agent/cli/style/lanham-prose-analyzer.test.ts` passes |
| 1.5 | Import resolution, Vitest config, type compat, analyzer smoke test — all green |
| 2 | Existing pipeline tests pass (`vitest run tests/god-agent/universal/`). Manual: `/god-write` without `--lanham-mode` identical to pre-port. Manual: `/god-write` with `--lanham-mode on` shows Lanham prompt block. |
| 3 | Tier 2 register labels match Tier 1 for academic genre. Tacit patterns computed once (assertion). Default analyzer remains Tier 1. |
| 4 | `vitest run tests/calibration/lanham-calibration.test.ts` — all monotonicity targets met |
| 5 | `node scripts/enrich-style-lanham.mjs` enriches active profile. `lanham-write-test --prefetched --topic "test"` completes 8 stages. |
| 6 | Full `vitest run` green. `tsc --noEmit` clean. |

---

## Recommended Execution Order

1. **Phase 0 + Phase 1** together (foundation) — types, interface, Tier 1 analyzer, policy, unit tests
2. **Phase 1.5** (validation gate) — confirm everything works in target repo before touching pipeline
3. **Phase 2** (pipeline integration) — the critical path; do task-by-task with test runs between each
4. **Phase 3** (advanced analyzer) — opt-in, default off; can be deferred if time-constrained
5. **Phase 4** (agent + calibration) — calibration is important for confidence; agent is needed for revision guidance
6. **Phase 5** (CLI + enrichment) — needed before the module is "production ready"
7. **Phase 6** (bug fixes) — integrated into Phases 3/5 where possible

**Minimum viable port:** Phases 0 + 1 + 1.5 + 2 = working Lanham analysis in the write pipeline with drift detection via facade controller. ~1,284 new lines + ~260 modified lines across ~9 files.
