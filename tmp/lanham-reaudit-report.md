# Lanham Module Re-Audit Report

**Date:** 2026-04-16
**Branch:** writing-pipeline-v2
**Auditor:** Claude Opus 4.6 (automated)

---

## Test Results

### Test 1: TypeScript Compilation (Lanham-related files)
**Result: PASS** -- Zero type errors for any Lanham-related files (`npx tsc --noEmit` filtered output was empty).

### Test 2: Lanham Prose Analyzer Unit Tests
**Result: PASS** -- 13/13 tests passed (8ms).
Includes edge cases: empty string, single word, no sentence boundaries, numbers-only.

### Test 3: Lanham Calibration Tests
**Result: 22 PASSED / 3 FAILED** (known pre-existing calibration gaps -- unchanged from prior audit)
- `register` monotonicity: 0.894 -- PASS
- `voice` monotonicity: 0.777 -- PASS
- `nounVerb` monotonicity: 0.663 -- FAIL (target: 0.85)
- `parataxisHypotaxis` monotonicity: 0.469 -- FAIL (target: 0.70)
- `opacity` monotonicity: 0.089 -- FAIL (target: 0.70)
- `periodicRunning` monotonicity: 0.603 -- informational, below 0.65 target

These are the same 3 soft/hard calibration failures documented previously. No regression.

### Test 4: Lanham Pipeline Smoke Tests
**Result: PASS** -- 5/5 tests passed (155ms). SmartRetrievalLayer integration confirmed working.

---

## Finding-by-Finding Verification

### CRITICAL

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| C-01 | `NOMINALIZATION_THRESHOLDS` values in 0.06-0.10 range | **RESOLVED** | `prose-analysis-validator.ts` lines 38-45: academic=0.08, legal=0.10, technical=0.09, narrative=0.06, journalistic=0.07, general=0.07. All within 0.06-0.10 range. |
| C-02 | `shouldIncludeTextualAnalysis()` must be CALLED inside `runRetrievalStage()` | **RESOLVED** | `retrieval-stage.ts` line 188: `if (shouldIncludeTextualAnalysis(options))` -- called inside `runRetrievalStage()` at line 107, within the whitelist-mode retrieval block. Function defined at line 87, invoked at line 188. |

### HIGH

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| H-01 | `lanham-style-controller.ts` constructor handles 'auto' tier | **RESOLVED** | Line 102: `if (tier === 'deep' \|\| (tier === 'auto' && (config.genre === 'academic' \|\| config.genre === 'legal')))` -- auto is explicitly handled; non-academic/legal auto falls through to heuristic at line 104 (else branch). No unhandled case. |
| H-02 | `lanham-prose-analyst.ts` tacitTotal uses integer counts only | **RESOLVED** | Line 97: `const tacitTotal = metrics.tacitPatterns.anaphoraCount + metrics.tacitPatterns.chiasmusCount + metrics.tacitPatterns.antithesisCount + metrics.tacitPatterns.isocolonCount + metrics.tacitPatterns.climaxPatternCount;` -- all integer counts, no density values mixed in. Also line 344 (critique mode): same pattern. |
| H-03 | `PERSONALITY_MARKERS` never/always/forever regex narrowed | **RESOLVED** | `lanham-shared.ts` line 129: `/\b(never\|always\|forever)\b\s+\b(shall\|will\|must\|can\|cannot\|again\|forget)\b/gi` -- requires a following modal/specific word. Not a bare match on never/always/forever. |
| H-04 | `as LanhamProseMetrics` cast has safety comment | **RESOLVED** | `lanham-prose-analyzer.ts` lines 55-57: `// Cast is safe: labels, explanations, analysisDepth, and confidenceByAxis // are set in the lines immediately below before the object is returned.` followed by `} as LanhamProseMetrics;` |
| H-05 | `NOM_EXCLUSIONS` set exists in `isNominalization()` | **RESOLVED** | `lanham-shared.ts` lines 165-172: `const NOM_EXCLUSIONS = new Set([...])` with 32 entries (question, fortune, nature, culture, etc.). Used at line 177: `if (NOM_EXCLUSIONS.has(w)) return false;` |

### MEDIUM

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| M-01 | `lanhamStyleTarget` used in correction prompt | **RESOLVED** | `lanham-style-controller.ts` lines 238-240: `if (this.lanhamStyleTarget) { correctionLines.push(\`Genre context: ${this.lanhamStyleTarget.genre}. AT/THROUGH mode: ${this.lanhamStyleTarget.atThroughMode}.\`); }` |
| M-02 | `analyzeOpacityTransparency` has JSDoc noting it's dead code | **RESOLVED** | `advanced-lanham-analyzer.ts` lines 469-473: JSDoc states `Deep opacity analysis -- NOT called by fullAnalysis() (opacity is delegated to Tier 1 because the deep 4-signal composite produces worse monotonicity than the simpler heuristic). Retained for interface compliance and potential future use.` |
| M-03 | `prose-analysis-validator.ts` imports shared constants | **RESOLVED** | Line 29: `import { NOMINALIZATION_SUFFIXES, LATINATE_SUFFIXES, FORMAL_MARKERS } from '../../style/lanham-shared.js';` |
| M-04 | `splitSentences` escapes pipe characters | **RESOLVED** | `lanham-shared.ts` line 146: `.replace(/\|/g, '<<PIPE>>')` before splitting on pipes, then line 149: `.map(s => s.replace(/<<PIPE>>/g, '\|').trim())` to restore them. |
| M-05 | Regex `/g` flag warnings present | **RESOLVED** | `lanham-shared.ts` lines 89-90 (above META_LINGUISTIC_MARKERS), lines 105-106 (above OPACITY_CONTENT_MARKERS), lines 118-119 (above PERSONALITY_MARKERS): `// WARNING: These regexes use the /g flag. Only use with .match() or .matchAll(). // Never use with .test() or .exec() -- the lastIndex state persists between calls.` |
| M-06 | `deriveLabels` uses `LanhamThresholdConfig` type | **RESOLVED** | `lanham-prose-analyzer.ts` line 537: `private deriveLabels(m: Partial<LanhamProseMetrics>, t: LanhamThresholdConfig)`. Also `advanced-lanham-analyzer.ts` line 833: same signature. |
| M-07 | No literal "This matters." string in `lanham-prose-analyst.ts` | **RESOLVED** | Grep for `"This matters."` returned no matches in the file. |
| M-08 | `DENOMINALIZATIONS` lookup table exists in `lanham-prose-analyst.ts` | **RESOLVED** | Lines 166-182: `const DENOMINALIZATIONS: Record<string, string> = { 'implementation': 'implementing', 'assessment': 'assessing', ... }` with 29 entries. Used at line 191: `let verb = DENOMINALIZATIONS[nounLower];` with heuristic fallback at lines 193-199. |

### LOW

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| L-01 | No 'gi' flag on already-lowercased text | **RESOLVED** | `lanham-prose-analyzer.ts` line 163: the only `/gi` usage is `relativeClausePattern` which operates on the original `text` variable (not lowercased). This is correct -- the `i` flag is needed because `text` preserves case. All shared regex patterns in `lanham-shared.ts` use `/gi` and are applied via `.match()` on original text. |
| L-02 | `regenerationConfig` in constructor config | **RESOLVED** | `lanham-style-controller.ts` line 26: `regenerationConfig?: RegenerationConfig;` in `LanhamControllerConfig`. Line 109: `this.regenConfig = config.regenerationConfig ?? DEFAULT_REGEN_CONFIG;` |
| L-03 | Sync comment above `GENRE_DEFAULTS` | **RESOLVED** | `lanham-style-policy.ts` lines 32-33: `// NOTE: registerTarget values must stay consistent with GENRE_THRESHOLDS.register boundaries. // If register boundaries are updated, verify these defaults still make sense.` |
| L-04 | Edge case tests exist | **RESOLVED** | `lanham-prose-analyzer.test.ts` lines 117-138: Four edge case tests: empty string, single word, no sentence boundaries, numbers only. All pass. |
| L-05 | `NOM_EXCLUSIONS` set exists | **RESOLVED** | Same as H-05. `lanham-shared.ts` lines 165-172. |
| L-06 | `VALID_GENRES` validation in `enrich-style-lanham.mjs` | **RESOLVED** | Line 78: `const VALID_GENRES = ['academic', 'legal', 'narrative', 'journalistic', 'technical', 'general'];` Line 79: `const genre = VALID_GENRES.includes(profile.metadata?.genre) ? profile.metadata.genre : 'academic';` |
| L-07 | `PRONOUNS` does not contain that/this/these/those | **RESOLVED** | `advanced-lanham-analyzer.ts` line 155-156: Comment explicitly states `'that', 'this', 'these', 'those' removed -- they overlap with DETERMINERS, which is checked first in heuristicPOS(). Keeping them here would be dead code.` The `PRONOUNS` set on line 156 does not contain any of those four words. |

---

## New Issues Scan

### Stale References
- **agentdb-v2**: No references found in `src/god-agent/` -- CLEAN
- **god-agent-v2**: No references found in `src/` -- CLEAN
- **drifting-inventing-map**: No references found in `src/god-agent/` -- CLEAN

### New Type Errors
- Zero Lanham-related TypeScript errors -- CLEAN

### Dead Code / Integration Gaps
- `AdvancedLanhamAnalyzer.analyzeOpacityTransparency()` is dead code (not called by `fullAnalysis()`), but is properly documented as such (see M-02). Retained for interface compliance. **Acceptable.**
- No new dead code or integration gaps found.

### Calibration Regression Check
The 3 failing calibration axes (nounVerb 0.663, parataxisHypotaxis 0.469, opacity 0.089) are unchanged from the prior audit. These are known tuning items documented in the backlog (Task #42, Task #43). No regression.

---

## Summary

| Category | Total | Resolved | Open |
|----------|-------|----------|------|
| CRITICAL | 2 | 2 | 0 |
| HIGH | 5 | 5 | 0 |
| MEDIUM | 8 | 8 | 0 |
| LOW | 7 | 7 | 0 |
| **Total** | **22** | **22** | **0** |

**All 22 previously-identified findings are RESOLVED.**

No new issues found in the Lanham module. The 3 calibration test failures are pre-existing known items (nounVerb, parataxisHypotaxis, opacity monotonicity) and are not related to any code defect -- they reflect inherent limitations of heuristic analysis on those axes that require future tuning work.
