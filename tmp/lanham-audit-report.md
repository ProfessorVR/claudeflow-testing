# Lanham Module Comprehensive Quality Audit

**Date**: 2026-04-16
**Auditor**: Claude Opus 4.6 (automated)
**Scope**: All Lanham-related files in claudeflow-testing (35 files, ~4,800 lines)

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2     |
| HIGH     | 5     |
| MEDIUM   | 8     |
| LOW      | 7     |
| **Total** | **22** |

Zero TypeScript compilation errors. Unit tests: 9/9 pass. Calibration tests: 22/25 pass (3 known failing on nounVerb, parataxis, opacity monotonicity). Smoke tests: 5/5 pass. No stale v2/agentdb-v2/drifting-inventing-map references found.

---

## Test Results

### TypeScript Compilation
```
npx tsc --noEmit | grep lanham... -> NO ERRORS
```
All Lanham-related files compile cleanly. No type errors.

### Unit Tests (lanham-prose-analyzer.test.ts)
```
9/9 PASS (8ms)
```
All tests pass: noun-heavy, verb-driven, paratactic, transparent, tacit persuasion, voice, confidence markers, explanation strings, label derivation.

### Calibration Tests (lanham-calibration.test.ts)
```
22/25 PASS, 3 FAIL
```
- FAIL: nounVerb monotonicity 0.679 (target 0.85) -- hard constraint axis
- FAIL: parataxisHypotaxis monotonicity 0.469 (target 0.70) -- soft observation
- FAIL: opacity monotonicity 0.089 (target 0.70) -- soft observation
- PASS: register 0.894, voice 0.777, periodicRunning 0.603 (informational)

### Integration Smoke Tests (lanham-pipeline-smoke.test.ts)
```
5/5 PASS (317ms)
```
Full pipeline integration with ChromaDB retrieval working.

---

## Detailed Findings

### CRITICAL

| ID | File | Line | Description | Recommended Fix |
|----|------|------|-------------|-----------------|
| C-01 | `cli/quality/stages/prose-analysis-validator.ts` | 36-42, 105-106 | **Nominalization threshold effectively unreachable.** `NOMINALIZATION_THRESHOLDS` for academic is `0.40` (40%), but `nominalizationDensity` from the analyzer reports per-100-words (e.g., 8.5 = 8.5%). After normalization (`/100` at line 105), the value becomes ~0.085, which will NEVER exceed 0.40. The entire nominalization overload detection is dead logic -- it will never fire for any real text. | Change thresholds to match the normalized scale: academic `0.08`, legal `0.10`, technical `0.09`, narrative `0.06`, journalistic `0.07`, general `0.07`. OR remove the `/100` normalization and compare raw density against thresholds scaled to per-100-words (e.g., academic threshold = 8.0). |
| C-02 | `universal/stages/retrieval-stage.ts` | 87-93 | **`shouldIncludeTextualAnalysis()` is defined but NEVER called.** The function exists (lines 87-93) to gate textual analysis collection inclusion based on `lanhamStyleTarget` or `hasLanhamMetrics`, but no code in the retrieval stage or anywhere else invokes it. The Lanham-gated retrieval enhancement is completely inert. | Wire `shouldIncludeTextualAnalysis(options)` into `runRetrievalStage()` to conditionally include `lanham_prose` domain collections in the retrieval query set. |

### HIGH

| ID | File | Line | Description | Recommended Fix |
|----|------|------|-------------|-----------------|
| H-01 | `universal/lanham-style-controller.ts` | 21, 100-103 | **`auto` analyzer tier silently falls through to `heuristic`.** The `LanhamControllerConfig.analyzerTier` type declares `'heuristic' | 'deep' | 'auto'`, but the constructor only checks `=== 'deep'`. Passing `'auto'` gives heuristic with no indication. This violates least-surprise. | Add an `auto` branch that selects tier based on text length or genre (e.g., `auto` = `deep` for texts > 2000 words, `heuristic` otherwise). At minimum, log a message when `auto` resolves. |
| H-02 | `agents/lanham-prose-analyst.ts` | 97 | **Type-incoherent tacit pattern sum.** `tacitTotal = anaphoraCount + chiasmusCount + alliterationDensity` mixes absolute counts (integers) with per-sentence density (float 0-1). The threshold `> 3` is calibrated for counts but `alliterationDensity` contributes at most ~1.0 to the sum, making the comparison semantically meaningless. | Use only counts: `tacitTotal = tp.anaphoraCount + tp.chiasmusCount + tp.antithesisCount + tp.isocolonCount + tp.climaxPatternCount` (all integers). Remove `alliterationDensity` from the sum. |
| H-03 | `cli/style/lanham-shared.ts` | 121 | **Overly broad PERSONALITY_MARKERS inflate voiceScore.** `/\b(never\|always\|forever)\b/gi` matches extremely common words in all registers. Technical manuals ("never exceed 100V"), legal texts ("shall always comply"), and academic prose ("never implies") all trigger this marker, falsely inflating voiceScore. | Remove or narrow this regex. Replace with context-aware patterns like `/\b(never|always|forever)\b.*\b(shall|must|will)\b/gi` or remove entirely -- the remaining markers are sufficient. |
| H-04 | `cli/style/lanham-prose-analyzer.ts` | 55 | **Unsafe `as LanhamProseMetrics` cast on incomplete object.** The spread of partial results at lines 47-54 produces an object missing `labels`, `explanations`, `analysisDepth`, and `confidenceByAxis`. The `as LanhamProseMetrics` cast at line 55 suppresses TypeScript's ability to catch downstream access errors. | Build the object incrementally: set `labels`, `explanations`, `analysisDepth`, and `confidenceByAxis` before casting, or use a builder pattern that returns the complete type only after all fields are populated. |
| H-05 | `calibration/lanham-calibration.test.ts` | 389, 455, 477 | **3 calibration tests failing (nounVerb, parataxis, opacity monotonicity).** nounVerb monotonicity is 0.679 vs target 0.85 (hard constraint). This indicates the nounVerb axis does not reliably rank texts from noun-heavy to verb-driven -- a fundamental calibration failure for a hard-constraint axis. | Investigate the gold-set entries causing ranking inversions. Likely fixes: adjust `nounVerbRatio` formula weights (line 134), refine nominalization detection to exclude false positives (e.g., "question" ends in "-tion" but is not a nominalization of a verb), or add negative-signal filtering. |

### MEDIUM

| ID | File | Line | Description | Recommended Fix |
|----|------|------|-------------|-----------------|
| M-01 | `universal/lanham-style-controller.ts` | 96, 105 | **Dead stored field: `this.lanhamStyleTarget` is assigned but never read.** The `lanhamStyleTarget` is stored on the controller at line 105 but no method ever accesses `this.lanhamStyleTarget`. | Remove the field, or use it in `computeLanhamDrift` / `maybeRegenerateWithLanham` for genre-aware drift thresholds. |
| M-02 | `cli/style/advanced-lanham-analyzer.ts` | 467-612 | **`analyzeOpacityTransparency` is dead code in AdvancedLanhamAnalyzer.** The `fullAnalysis()` method explicitly delegates opacity to the Tier 1 baseline (line 219 comment) and never calls `this.analyzeOpacityTransparency()`. The method exists (467-612, 145 lines) solely to satisfy the ILanhamAnalyzer interface but is never invoked through the normal code path. | Mark with `// @internal -- only called via interface, not by fullAnalysis()` comment, or make it `protected` and document that it is interface-contract code. Consider removing it if the interface is the only caller pattern. |
| M-03 | `cli/quality/stages/prose-analysis-validator.ts` | 242, 389-398 | **Duplicated constants from lanham-shared.ts.** `NOMINALIZATION_SUFFIXES` (line 242), `LATINATE_SUFFIXES` (line 389), and `FORMAL_MARKERS` (line 393) are re-declared locally instead of imported from `lanham-shared.ts`. This creates a maintenance trap: if shared constants are updated, the validator's local copies remain stale. | Import from `lanham-shared.ts`: `import { NOMINALIZATION_SUFFIXES, LATINATE_SUFFIXES, FORMAL_MARKERS } from '../../style/lanham-shared.js';` |
| M-04 | `cli/style/lanham-shared.ts` | 136-142 | **`splitSentences` is fragile with pipe characters and abbreviations.** The function uses `|` as a sentence delimiter after replacement. Text containing literal `|` characters (tables, LaTeX, logical OR) will produce incorrect splits. Abbreviations like "Dr." or "e.g." followed by a space also trigger false splits. | Use a more robust sentence splitter, or at minimum escape existing `|` characters before the replacement: `text.replace(/\|/g, '<<PIPE>>').replace(...)...replace(/<<PIPE>>/g, '|')`. |
| M-05 | `cli/style/lanham-shared.ts` | 90-100, 103-110 | **Global-flag regex constants are safe now but fragile.** `META_LINGUISTIC_MARKERS`, `OPACITY_CONTENT_MARKERS`, and `PERSONALITY_MARKERS` all use `/gi` flags and are module-level constants. Currently used only with `.match()` (safe), but if any future code uses `.test()` or `.exec()`, the `lastIndex` state will persist between calls causing intermittent bugs. | Either: (a) remove the `g` flag and count matches via `matchAll`, or (b) add a `// WARNING: these regexes have the /g flag -- only use with .match(), never .test() or .exec()` comment. |
| M-06 | `cli/style/advanced-lanham-analyzer.ts` | 826-827 | **Inline type literal for threshold parameter in `deriveLabels`.** The method signature uses a 7-line inline type literal instead of referencing `LanhamThresholdConfig` from `lanham-style-policy.ts`. This duplicates the shape and will silently diverge if the policy config changes. | Replace inline type with `LanhamThresholdConfig` import. |
| M-07 | `agents/lanham-prose-analyst.ts` | 502-505 | **Mechanical "This matters." insertion in fullRewrite.** When `dynamicRange < 0.3` and the longest sentence exceeds 25 words, the code inserts the literal string `"This matters."` as a short declarative sentence. This is mechanical and will appear in generated prose as an incoherent non-sequitur. | Remove the hard-coded insertion. Instead, flag the location for the LLM to revise: return a revision instruction rather than literal text injection. |
| M-08 | `agents/lanham-prose-analyst.ts` | 173-177 | **Naive de-nominalization produces ungrammatical forms.** `"implementation" -> "implementating"`, `"assessment" -> "assessting"`. The suffix removal `noun.slice(0, -4) + 'ting'` for `-tion` words doesn't handle morphological irregularities. | Use a lookup table for common de-nominalizations: `{implementation: "implementing", assessment: "assessing", establishment: "establishing"}`. Fall back to the heuristic only for unknown words. |

### LOW

| ID | File | Line | Description | Recommended Fix |
|----|------|------|-------------|-----------------|
| L-01 | `cli/style/lanham-prose-analyzer.ts` | 474 | **Redundant `'gi'` flag on regex applied to already-lowercased text.** `textLower = text.toLowerCase()` at line 472, then regex uses `'gi'` flag at line 474. The `i` flag is unnecessary. | Use `'g'` flag only. |
| L-02 | `universal/lanham-style-controller.ts` | 29-39 | **`DEFAULT_REGEN_CONFIG` is never configurable.** The regeneration config is hardcoded and there is no public method to override it. The `regenConfig` field is private with no setter. | Add a `setRegenerationConfig()` method or accept config overrides in the constructor. |
| L-03 | `cli/style/lanham-style-policy.ts` | 32-39 | **`GENRE_DEFAULTS` values could drift from `GENRE_THRESHOLDS`.** Both configure register targets but are maintained independently. If `GENRE_THRESHOLDS` register boundaries are updated, `GENRE_DEFAULTS.registerTarget` must be manually kept in sync. | Add a runtime assertion or derive `GENRE_DEFAULTS.registerTarget` from `GENRE_THRESHOLDS.register` boundaries. |
| L-04 | `tests/god-agent/cli/style/lanham-prose-analyzer.test.ts` | all | **No edge case tests.** The test suite does not test: empty string, single word, text with no sentences (all fragments), text with only numbers, or text with Unicode characters. | Add edge case tests for empty input, single-word input, numbers-only input, and Unicode text. |
| L-05 | `cli/style/lanham-shared.ts` | 57 | **`isNominalization` false positives.** Common words ending in nominalization suffixes but NOT derived from verbs are counted: "question" (not from "quest"), "fortune" (not a nominalization), "adventure", "furniture", "nature", "culture". The minimum length check (`< 6`) helps but doesn't eliminate these. | Add a small exclusion set: `const NOM_EXCLUSIONS = new Set(['question', 'fortune', 'nature', 'culture', 'adventure', 'furniture', 'picture', 'mixture', 'creature', 'structure', 'feature', 'future', 'capture', 'lecture', 'gesture', 'posture', 'moisture']);` |
| L-06 | `scripts/enrich-style-lanham.mjs` | 78 | **No null check on `profile.metadata.genre`.** If `profile.metadata` exists but has no `genre` field, `undefined` is passed as the genre string. The `LanhamProseAnalyzer` constructor receives `undefined` which defaults to `'general'` via the default parameter, so this works -- but `GENRE_DEFAULTS[genreKey]` at line 95 would fail if `genre` were an invalid string. | Add validation: `const genre = VALID_GENRES.includes(profile.metadata?.genre) ? profile.metadata.genre : 'academic';` |
| L-07 | `cli/style/advanced-lanham-analyzer.ts` | 155 | **`PRONOUNS` set includes `'that'`, `'this'`, `'these'`, `'those'` which overlap with `DETERMINERS`.** Words like "that" will be tagged as `DET` (checked first) rather than `PRON`, so the overlap doesn't cause a bug, but the presence of these in both sets is misleading. | Remove overlapping entries from `PRONOUNS` since `DETERMINERS` is checked first in `heuristicPOS`. |

---

## Dead Code Inventory

| Location | Description | Lines |
|----------|-------------|-------|
| `retrieval-stage.ts:87-93` | `shouldIncludeTextualAnalysis()` -- defined, never called | 7 |
| `lanham-style-controller.ts:96` | `this.lanhamStyleTarget` -- stored, never read | 1 |
| `advanced-lanham-analyzer.ts:467-612` | `analyzeOpacityTransparency()` -- interface contract, never called via fullAnalysis | 145 |
| `lanham-style-controller.ts:29-39` | `DEFAULT_REGEN_CONFIG` -- hardcoded, never overridable | 11 |

**Total dead/unreachable lines**: ~164

---

## Integration Gap Inventory

| Gap | From | To | Description |
|-----|------|----|-------------|
| GAP-01 | `retrieval-stage.ts` | `runRetrievalStage()` | `shouldIncludeTextualAnalysis()` is not wired into the retrieval pipeline. Lanham-gated collection inclusion is completely inert. |
| GAP-02 | `lanham-style-controller.ts` | `write-pipeline-orchestrator.ts` | The `auto` tier is declared in the config type but the orchestrator always passes `'heuristic'` (line 963). No code path ever sends `'auto'` or `'deep'`. |
| GAP-03 | `lanham-style-controller.ts` | `LanhamStyleTarget` | The stored `lanhamStyleTarget` is never used for genre-aware drift thresholds -- `computeLanhamDrift` operates only on label comparison, ignoring the target's genre/voice/register fields. |
| GAP-04 | `prose-analysis-validator.ts` | `lanham-shared.ts` | Duplicated constants create a maintenance gap: changes to shared constants won't propagate to the validator. |
| GAP-05 | `enrich-style-lanham.mjs` | `style/index.ts` | The enrichment script imports from `../src/god-agent/cli/style/index.js` which works only when run from the project root. No path resolution or fallback. |

---

## Consistency Analysis

### Label Derivation
Both `LanhamProseAnalyzer.deriveLabels()` and `AdvancedLanhamAnalyzer.deriveLabels()` implement identical logic including:
- Genre-specific register thresholds from policy
- Signal-based noun-style override
- Markedness-based register classification

**Verdict**: Consistent. The duplication is acceptable given the inline type in the Advanced version (see M-06).

### Opacity Formula
- Tier 1: `metaLing * 0.35 + contentOpacity * 0.40 + sound * 0.25` (3-signal)
- Tier 2 (unused): `selfConsc * 0.5 + tacit * 0.3` gated by `> 0.15` for sound/genre-break amplifier (4-signal)
- Tier 1 `fullAnalysis()` post-processing: `selfConsc * 0.4 + sound * 0.3 + tacitDensity * 0.3` (3-signal, different weights)

**Verdict**: The `fullAnalysis()` post-processing at lines 66-70 OVERWRITES the opacity computed by `analyzeOpacityTransparency()` with a DIFFERENT formula using DIFFERENT weights. This is documented as intentional (tacit pattern incorporation), but the two formulas use inconsistent weight distributions.

### Confidence Markers
- Tier 1: `periodicRunning: 'low'`, `voice: 'medium'`, `opacity: 'medium'`
- Tier 2: `periodicRunning: 'medium'`, `voice: 'medium'`, `opacity: 'medium'`

**Verdict**: Consistent upgrade from Tier 1 to Tier 2 on periodicRunning. All other axes match their tier expectations.

---

## Recommendations (Priority Order)

1. **Fix C-01**: Correct nominalization thresholds in ProseAnalysisValidator immediately -- the entire nominalization detection is currently non-functional.
2. **Wire C-02**: Connect `shouldIncludeTextualAnalysis()` into the retrieval pipeline.
3. **Fix H-02**: Correct the type-incoherent tacit pattern sum in the agent.
4. **Fix H-05**: Investigate nounVerb calibration failures -- this is a hard-constraint axis that should reliably rank texts.
5. **Fix H-01**: Implement proper `auto` tier selection logic.
6. **Import M-03**: Replace duplicated constants with imports from lanham-shared.ts.
7. **Address M-08**: Fix de-nominalization morphology to avoid ungrammatical output.
