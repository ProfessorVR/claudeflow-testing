# Parataxis Tier 1 Fix — Implementation Plan

**Date:** 2026-04-17
**Status:** PROPOSAL — awaiting review
**Prerequisite:** Phases A-F complete
**Estimated effort:** 1-2 hours
**Scope:** Single targeted fix + validation. No new dependencies.

---

## Problem

Tier 1's parataxis detection at `lanham-prose-analyzer.ts:162-237` uses a regex-based `relativeClausePattern` that matches all "that + word" sequences as relative clauses without distinguishing demonstrative "that" (DT) from subordinating "that" (WDT/IN). Phase B3 fixed this in Tier 2 using POS tags, dropping Tier 2's demonstrative-that density from 0.1176 to 0.0000 on the failure-bucket test passage. But Tier 1 still uses the old regex, keeping its parataxis monotonicity stuck at 0.372.

The fix is to apply the same POS-based "that" filtering to Tier 1, using the shared `assessSubordinationEvidence()` helper and `tagPOS()` / `isThatSubordinator()` utilities that are already in `lanham-shared.ts`.

---

## What Changes

### 1. Rewrite Tier 1 relative clause detection

**File:** `src/god-agent/cli/style/lanham-prose-analyzer.ts`
**Method:** `analyzeParataxisHypotaxis()` (lines ~162-237)

**Current code** (approximately lines 177-184):
```typescript
// "that/which/who/whom" followed by a verb pattern = subordinate clause
const relativeClausePattern = /\b(that|which|who|whom|whose|where|whereby)\b\s+\w+/gi;
const relativeMatches = text.match(relativeClausePattern) || [];
const implicitSubordCount = relativeMatches.length;
```

**Replace with** POS-aware word-by-word detection (same approach as Tier 2 B3):
```typescript
// POS-aware relative clause detection: disambiguate "that"
let implicitSubordCount = 0;
for (const sent of sentences) {
  const sentRawWords = sent.split(/\s+/).filter(w => w.length > 0);
  const sentPOS = tagPOS(sentRawWords);
  const sentWords = sentRawWords.map(w => w.toLowerCase().replace(/[^a-z']/g, ''));

  for (let i = 0; i < sentWords.length - 1; i++) {
    const w = sentWords[i];
    // Check relative pronouns: which, who, whom, whose, where, whereby always count
    if (['which', 'who', 'whom', 'whose', 'where', 'whereby'].includes(w)) {
      const lookahead = sentWords.slice(i + 1, i + 4);
      const hasVerb = lookahead.some(lw => isVerb(lw) || posVerbSet?.has(lw));
      if (hasVerb) implicitSubordCount++;
    }
    // "that" requires POS disambiguation
    else if (w === 'that') {
      const posTag = sentPOS[i]?.tag || 'DT';
      if (!isThatSubordinator(posTag)) continue; // skip demonstrative "that"
      const lookahead = sentWords.slice(i + 1, i + 4);
      const hasVerb = lookahead.some(lw => isVerb(lw) || posVerbSet?.has(lw));
      if (hasVerb) implicitSubordCount++;
    }
  }
}
```

This requires adding `tagPOS` and `isThatSubordinator` to the existing imports from `lanham-shared.js` (they are already imported for B2/B5 but verify they are in the import list for this file).

### 2. Apply graded evidence ladder to Tier 1

Currently Tier 1 treats all subordination evidence equally. After the POS fix, align Tier 1 with the canonical `assessSubordinationEvidence()` helper:

**Current code** (approximately lines 206-211):
```typescript
const effectiveSubord = subordCount + implicitSubordCount * 0.7;
const hypotaxisBoost = clamp(ppNestingDensity / 0.5) * 0.15;
```

**Replace with:**
```typescript
// Use canonical graded evidence ladder (same as Tier 2 A2/B3)
const evidence = assessSubordinationEvidence(subordCount, implicitSubordCount, 0);
// Tier 1 has no participial phrase detection, so lowConfidenceCount = 0
const effectiveSubord = evidence.weightedTotal;
const hypotaxisBoost = evidence.nestingBonusAllowed
  ? clamp(ppNestingDensity / 0.5) * 0.08  // reduced from 0.15, conditional
  : 0;
```

This requires adding `assessSubordinationEvidence` to the imports (verify it's in the import list).

### 3. Verify imports

The import block at the top of `lanham-prose-analyzer.ts` should include:
```typescript
import {
  tokenize, splitSentences, clamp, isVerb, isNominalization, isLatinate, roughStem, getContentWords,
  tagPOS, isVerbTag, isThatSubordinator, assessSubordinationEvidence,
  BE_VERBS, COMMON_VERBS, ...
} from './lanham-shared.js';
```

`tagPOS` and `isVerbTag` were added in Phase B2. `isThatSubordinator` and `assessSubordinationEvidence` need to be added if not already present.

---

## What Does NOT Change

- Tier 2's parataxis detection (already fixed in B3)
- The `assessSubordinationEvidence()` helper in `lanham-shared.ts` (already canonical)
- Genre thresholds in `lanham-style-policy.ts`
- The calibration test infrastructure (A5-A7)
- Any Phase F expansion data or scripts

---

## Validation

### Gate 1: Failure-bucket regression

Run `npx vitest run tests/calibration/lanham-failure-buckets.test.ts`. The `demonstrative-that` test should now show **both** Tier 1 and Tier 2 with subordinatingConjunctionDensity near 0 (currently only Tier 2 passes this).

### Gate 2: Unit tests

Run `npx vitest run tests/god-agent/cli/style/lanham-prose-analyzer.test.ts`. All 13 tests must pass.

### Gate 3: Calibration comparison

Run the Tier 1 vs Tier 2 comparison script. Check:
- Tier 1 parataxis monotonicity (baseline: 0.372) — expect improvement
- Tier 1 parataxis agreement (baseline: 45.0%) — expect improvement
- No other axis degrades by >0.02 monotonicity
- Parataxis label diffs between tiers should decrease (baseline: 6)

### Gate 4: Genre-stratified check

For genre groups with n≥3 (Political, Literary Fiction, Academic, Legal, Narrative Nonfiction), verify parataxis agreement does not degrade on any group.

---

## Risk Assessment

**Low risk.** This is a targeted mechanistic fix:
- The POS "that" disambiguation is already validated in Tier 2 (B3)
- The shared helper (`assessSubordinationEvidence`) is already canonical
- The change only affects one axis in one method
- The failure-bucket test directly validates the fix
- No new dependencies, no composite weight changes, no threshold changes

**Possible regression:** If the POS tagger misclassifies some "that" tokens in Tier 1's context (different sentence splitting than Tier 2), parataxis might shift in unexpected ways for some passages. The genre-stratified check (Gate 4) catches this.

---

## Execution Steps

1. Back up `lanham-prose-analyzer.ts`
2. Add missing imports (`isThatSubordinator`, `assessSubordinationEvidence`)
3. Replace the `relativeClausePattern` regex block with POS-aware word-by-word detection
4. Replace the `effectiveSubord` / `hypotaxisBoost` lines with graded evidence ladder
5. Run Gate 1 (failure buckets)
6. Run Gate 2 (unit tests)
7. Run Gate 3 (calibration comparison)
8. Run Gate 4 (genre-stratified check)
9. Document results

---

## Expected Outcome

If the fix works as predicted:
- Tier 1 parataxis monotonicity: 0.372 → ~0.42-0.50
- Tier 1 parataxis agreement: 45.0% → ~48-55%
- Tier 1-Tier 2 parataxis label diffs: 6 → ~2-4
- demonstrative-that failure bucket: Tier 1 density drops from 0.2941 to near 0

These are conservative estimates. The actual improvement depends on how many gold-set passages have demonstrative "that" tokens that were inflating Tier 1's subordination counts.
