# Clause Parser — Final Status and Findings

**Date:** 2026-04-17
**Status:** Implementation complete. One production change adopted. Two candidates rejected after calibration.

---

## Adopted: matrixDelay replaces leftBranch in periodic ensemble

**Periodic T2 mono: 0.349 (original) → 0.479 (Phase E ensemble) → 0.512 (clause matrixDelay)**

The clause parser's two-pass matrix resolution produces `matrixDelayMean` — the average position of the matrix clause's head verb relative to sentence length. This replaced the POS-only `leftBranchRunning` signal in the 3-signal periodic ensemble.

- Correlation between leftBranch and matrixDelay: 0.29 (low — genuinely different measurements)
- Ablation experiment C/G validated: matrixDelay 0.45 + suspension 0.30 + sentLen 0.25 → 0.512 mono
- Recalibration gate passed: no regression >0.02, no failure-bucket failures
- Production labels unchanged (Tier 1 label source)

## Rejected: proportion delay > 0.6 aggregator

**Overall mono: 0.577 (+0.065 over current 0.512) — but failed legal genre gate.**

The proportion of sentences with matrixDelay > 0.6 was the strongest single-aggregator result. However, genre-stratified validation revealed:

| Genre | n | Mono |
|-------|---|------|
| Political | 8 | 0.881 |
| Academic | 7 | 0.652 |
| Polemical | 3 | 0.625 |
| Narrative Nonfiction | 4 | 0.400 |
| Literary Fiction | 6 | 0.057 |
| **Legal** | **4** | **-0.300** |

Legal prose regression (-0.300) violates the genre n≥3 non-degradation gate (max -0.05). The cause: legal passages have uniformly moderate delays that never cross 0.6, making them all score 0.000 on the proportion metric — losing all ranking discrimination.

**Status:** Informative diagnostic result, not adopted. Documents that sentence-thresholding helps political and polemical prose while failing legal prose.

## Rejected: clause signals in periodic ensemble (naive blend)

The initial integration (matrixDelay 0.30 + preMainSubord 0.15 added to the 3-signal ensemble) degraded T2 periodic mono from 0.479 to 0.439 (-0.040). Reverted to the replacement approach (matrixDelay replaces leftBranch) which outperformed the additive blend.

**Ablation findings:**
- preMainSubord solo: 0.593 mono — looks strong but produces extreme 0/1 scores (binary overfitting)
- preMainSubord ↔ matrixDelay correlation: 0.75 — highly redundant
- One stable clause signal (matrixDelay) is better than two correlated ones

## Shadow: parataxis clause features

Best parataxis experiment: corrective depth `T1 + (depth-0.5)*0.30` at 0.405 mono (+0.027 from baseline 0.378). Below the +0.05 promotion gate.

**Status:** Parataxis clause features remain in Tier 2 shadow mode. Tier 1 (POS + graded evidence ladder) stays as production score source.

## Known Limitations

### Mean aggregation dilution

matrixDelayMean averages sentence-level delays across the passage. Multi-sentence passages with a mix of periodic and running sentences produce a diluted mean that underestimates the passage's periodic character. The passage-level audit identified 6 passages where this occurs:

- Brougham: 4 sentences, all delays 0.03-0.06 despite being Lanham's definitive periodic exemplar
- Gettysburg: 7 sentences, delays range 0.04-0.45, mean 0.205
- Federal Register: 2 sentences, delays 0.31/0.11, mean 0.211
- Churchill: 9 sentences, one hits 0.50, mean 0.212

**Root cause for Brougham:** The parser finds matrix verbs early in every sentence because Brougham's periodic style uses deeply embedded qualification within each sentence rather than delaying the main predication to the sentence end. The clause parser correctly identifies clause boundaries but the two-pass resolver assigns matrix status to an early finite verb that is syntactically available despite being rhetorically subordinate to the overall suspension.

This is a representational limitation, not a parser bug. Fixing it would require either dependency parsing (to see that the early verb is embedded in a conditional/concessive frame) or a passage-level periodic heuristic that detects Brougham-style "exploded period" patterns.

### Legal prose sensitivity

The proportion > 0.6 aggregator failed on legal prose because legal periodic sentences have moderate, uniform delays (0.1-0.3) rather than the high delays (>0.6) typical of literary or political periodic prose. Any future aggregator that uses sentence-level thresholding must be validated against legal genre specifically.

---

## Infrastructure Status

| Component | File | Status |
|-----------|------|--------|
| Clause types | `lanham-clause-types.ts` | Stable |
| Clause parser | `lanham-clause-parser.ts` | Stable, 3ms/passage |
| Clause features | `lanham-clause-features.ts` | Stable, hasClauseData guard |
| en-pos backend | `lanham-shared.ts` | Stable |
| Clause-view dev tool | `scripts/lanham-clause-view.ts` | Working |
| Performance benchmark | `scripts/lanham-clause-bench.ts` | 3.4ms mean, <100ms budget |
| Periodic ablation | `scripts/lanham-calibration/periodic-ablation.ts` | Complete |
| Parataxis hybrid | `scripts/lanham-calibration/parataxis-hybrid.ts` | Complete |
| Aggregation test | `tmp/periodic-aggregation-test.ts` | Complete |
| Failure-bucket tests | 16 (6 original + 6 clause + 4 edge case) | All pass |
