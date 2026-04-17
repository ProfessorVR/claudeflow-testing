# Lanham Prose Analysis — Revised Targets and Next Steps

**Date:** 2026-04-17
**Based on:** Phases A-F complete results

---

## Revised Targets

The original aspirational targets have been revised to reflect demonstrated ceilings within the current architecture:

| Axis | Original Target | Final Result (Mono / Agree) | Revised Target | Rationale |
|------|----------------|---------------------------|----------------|-----------|
| nounVerb | 0.85 | 0.732 / 60.0% | **0.80 mono / 65% agree** | POS verb detection active; threshold tuning and nounStyleOverride calibration remain |
| voice | 0.75 | 0.372 / 57.5% | **0.55 mono / 65% agree** | Threshold calibration recovered label quality; monotonicity ceiling is the heuristic's inability to measure authorial intention |
| register | 0.85 | 0.673 / 47.5% | **0.78 mono / 55% agree** | F-score blend active; composite weights (AWL, syllable, etc.) need human-validated corpus |
| periodic | 0.65 | 0.479 (T2) / 45.0% | **0.62 mono** | Ensemble active in shadow mode; score promotion justified, label promotion pending |
| parataxis | 0.70 | 0.378 / 42.5% | **0.45 mono** (documented ceiling) | POS "that" fix applied to both tiers; ceiling is clause-structure underpowered |
| opacity | 0.70 | 0.192 / 32.5% | **0.35 mono** (documented ceiling) | Reader-response axis; heuristic ceiling confirmed by both regex and LLM failure |

---

## Stall Diagnosis

### Parataxis (0.372→0.378 / 45%→42.5% — partially solved)

**Phase F failure mode:** Expansion labels excluded (trust weight 0.0) due to F1 gate 1/5 and 29% prompt anchoring. Claude systematically overclassifies as hypotactic.

**Post-F fix applied:** POS "that" disambiguation ported to Tier 1 (same approach as Tier 2 B3). Graded evidence ladder now shared between both tiers via `assessSubordinationEvidence()`. Demonstrative-that failure-bucket test now passes cleanly for both tiers.

**Result:** Monotonicity +0.006, agreement -2.5% (1 passage shifted, within noise). The fix is mechanistically correct but most gold passages don't have enough demonstrative "that" tokens for the fix to materially shift scores.

**Status: Partially solved, documented ceiling.** Parataxis at ~0.38 monotonicity is the architectural ceiling under the current approach. The axis is mechanistically sound on known failure modes (that-disambiguation, list commas, participial false positives) but underpowered on global clause structure. Further improvement requires either genuine clause-level parsing or a substantially larger human-annotated calibration corpus.

**Controller treatment:** Soft/informational enforcement only. Useful for relative directional guidance ("this passage is more hypotactic than your profile baseline") but not as a hard regeneration trigger.

### Opacity (unchanged: 0.192 / 32.5%)

**Failure mode:** Phase F expansion labels excluded (trust weight 0.0) due to 21% prompt anchoring. Deviation-from-norm metric (D4) tested but had no measurable effect.

**Root cause:** The AT/THROUGH distinction is fundamentally a reader-response phenomenon. Neither regex counting, POS tagging, deviation-from-norm, nor LLM-as-judge can reliably operationalize "does this prose make you notice the language?" The 0.70 target was aspirational and is now formally revised to 0.35.

**What opacity 0.35 means in practice:** The heuristic can detect extreme opacity (Swinburne's doublet chains, Churchill's dense alliteration) and extreme transparency (Federal Register, Pittsburgh textbook). It cannot reliably distinguish "mixed opacity" from either pole. This is an accepted limitation.

**Controller treatment:** Soft/informational enforcement only. Use opacity primarily for relative comparisons ("this passage is more self-conscious than your profile baseline"), not for hard classification or drift enforcement. Same treatment as parataxis — both are directionally useful but not automation-safe.

---

## Periodic Shadow Mode Decision

**Data:**
- T2 monotonicity: 0.479 (+0.130 over T1's 0.349) — **strong ranking improvement**
- T2 label agreement: 42.5% (-2.5% vs T1's 45.0%) — **slightly worse labels**
- Per-entry wins: T2 wins 7, T1 wins 8, both wrong 7 — **tied on labels**

**Recommendation:** Hybrid promotion.
- **Promote T2 periodic scores** for continuous output (periodicRunningRatio). The +0.130 monotonicity gain means T2's ranking is substantially better for drift detection and regression monitoring.
- **Keep T1 periodic labels** for categorical output until the ensemble weights are confirmed with a larger calibration corpus. T1 and T2 are tied on labels, so there's no reason to switch yet.

This gives the system better continuous scoring while avoiding categorical regressions.

---

## Highest-Leverage Next Steps (Ordered)

1. **Apply POS "that" disambiguation to Tier 1 parataxis** — targeted fix, should improve Tier 1 parataxis by ~5-10% agreement (mechanistic, no calibration needed)

2. **Promote periodic T2 scores to production** (hybrid: T2 scores, T1 labels) — cleanest remaining win, already validated

3. **Collect human-annotated calibration corpus** (50-100 passages) — the Phase C/D infrastructure (AWL, syllable, entropy, deviation-from-norm) needs proper weights that LLM labels couldn't provide. Human annotation on voice and register would enable composite weight optimization.

4. **Formally document opacity ceiling** in the implementation guide and style policy — stop treating 0.70 as a target; use 0.35 as the realistic ceiling

---

## Infrastructure Available for Future Work

All of these functions are implemented, tested, and available but not currently weighted into scoring:

- `AWL_WORDS` — Academic Word List (570 families)
- `countSyllables()` — heuristic syllable counter
- `sentenceLengthEntropy()` — voice: Shannon entropy over quantized sentence lengths
- `consecutiveLengthContrast()` — voice: pairwise length contrast
- `terminalShortness()` — voice: short final sentences
- `opacityDeviationFromNorm()` — opacity: Z-score normalized distance from transparent norm
- `suspensionMarkerDensity()` — periodic: conditional/participial/correlative opener detection

These become productive once proper weights are calibrated against human-annotated data.
