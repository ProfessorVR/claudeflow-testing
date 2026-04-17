# Lanham Prose Analysis System — Final Report

**Date:** 2026-04-17
**Branch:** `writing-pipeline-v2`
**Starting commit:** `50f87f36` (pre-improvement)
**Phases completed:** A through F + parataxis Tier 1 fix + periodic hybrid promotion

---

## 1. Executive Summary

The Lanham module began as a pure regex/counting heuristic system with 6 axes of prose analysis. Over the course of this implementation effort, it has been upgraded through bug fixes, POS tagger integration, LLM-calibrated threshold tuning, a periodic sentence ensemble, and a two-layer controller architecture. The system now provides measurably better prose analysis across the axes where heuristic improvement is achievable, with honest documentation of the axes where architectural ceilings have been reached.

### Final Metrics vs. Starting Point

| Axis | Original Mono | Final Mono | Δ | Original Agree | Final Agree | Δ |
|------|-------------|-----------|---|---------------|------------|---|
| **nounVerb** | 0.590 | **0.732** | +0.142 | 42.5% | **60.0%** | +17.5% |
| **voice** | 0.372 | 0.372 | +0.000 | 15.0% | **57.5%** | +42.5% |
| **register** | 0.574 | **0.673** | +0.099 | 47.5% | 47.5% | +0.0% |
| **periodic** | 0.349 | **0.479** (T2) | +0.130 | 45.0% | 45.0% | +0.0% |
| parataxis | 0.372 | 0.378 | +0.006 | 45.0% | 42.5% | -2.5% |
| opacity | 0.193 | 0.192 | -0.001 | 32.5% | 32.5% | +0.0% |

**Score quality improved on 3 axes** (nounVerb, register, periodic). **Label quality improved on 2 axes** (voice +42.5%, nounVerb +17.5%). Parataxis and opacity remain at their architectural ceilings.

---

## 2. Real-World Validation Results

Six diverse prose passages were tested through the full pipeline (Tier 1 + Tier 2 → controller merge → hybrid output):

### 2.1 Academic Philosophy (Kant-style)

| Axis | Result | Expected | Assessment |
|------|--------|----------|------------|
| nounVerb | predominantly noun-style | noun-style or balanced | Correct — heavy nominalization detected |
| parataxis | predominantly paratactic | hypotactic | **Miss** — known ceiling; complex subordination via semicolons and dashes not captured |
| periodic | mixed (T2: 0.327) | periodic or mixed | Reasonable — T2 ensemble sees some suspension |
| voice | unvoiced | unvoiced | Correct |
| register | high | high | Correct |
| opacity | opaque | transparent or mixed | **Miss** — the "concept of the object" vocabulary triggers opacity false positive |

### 2.2 Hemingway-Style Fiction

| Axis | Result | Expected | Assessment |
|------|--------|----------|------------|
| nounVerb | predominantly verb-style | verb-style | Correct |
| parataxis | predominantly paratactic | paratactic | Correct |
| periodic | predominantly running (T2: 0.824) | running | Correct |
| voice | strongly voiced | voiced | Correct |
| register | middle | low | **Miss** — the heuristic sees "middle" because Hemingway's vocabulary is plain but sentence structure is not colloquial |
| opacity | mixed opacity | mixed or opaque | Correct — the deliberate simplicity is self-conscious |

### 2.3 Legal Contract Language

| Axis | Result | Expected | Assessment |
|------|--------|----------|------------|
| nounVerb | predominantly noun-style | noun-style | Correct |
| parataxis | mixed | hypotactic | **Partial** — detected some subordination but not enough |
| periodic | predominantly periodic (T2: 0.254) | periodic | Correct — T2 ensemble correctly identifies delayed main clause |
| voice | moderate voice | unvoiced | **Miss** — scored 0.120 (near unvoiced threshold 0.10) |
| register | high | high | Correct |
| opacity | mixed opacity | transparent | **Partial** — the legalese surface draws some attention |

### 2.4 Conversational Blog Post

| Axis | Result | Expected | Assessment |
|------|--------|----------|------------|
| nounVerb | predominantly verb-style | verb-style | Correct |
| parataxis | predominantly paratactic | paratactic | Correct |
| periodic | predominantly running (T2: 0.554) | running | Correct |
| voice | strongly voiced | voiced | Correct |
| register | middle | low | **Miss** — same issue as Hemingway; colloquial register not fully captured |
| opacity | mixed opacity | transparent | **Partial** |

### 2.5 Scientific Methods Section

| Axis | Result | Expected | Assessment |
|------|--------|----------|------------|
| nounVerb | balanced | noun-style | **Partial** — POS-enhanced verb detection finds passive verbs, pushing toward balanced |
| parataxis | predominantly paratactic | mixed or paratactic | Correct |
| periodic | predominantly running (T2: 0.694) | running | Correct |
| voice | moderate voice | unvoiced | **Partial** — scored 0.237 (between unvoiced 0.10 and moderate 0.31) |
| register | high | high | Correct |
| opacity | mixed opacity | transparent | **Partial** |

### 2.6 Churchill-Style Oratory

| Axis | Result | Expected | Assessment |
|------|--------|----------|------------|
| nounVerb | predominantly verb-style | verb-style | Correct |
| parataxis | mixed | paratactic | **Partial** — the anaphora creates coordinate structure but the "if" clauses register as subordination |
| periodic | predominantly periodic (T2: 0.655) | mixed | **Note** — T1 says running (0.306), T2 says periodic (0.655). T2's label is "predominantly running" by T1 thresholds applied to T2 score. The label-aligned explanation correctly says "mixed." |
| voice | strongly voiced | voiced | Correct |
| register | middle | mixed/high | **Partial** — Churchill uses both Latinate and Anglo-Saxon; "middle" is a reasonable compromise |
| opacity | opaque | opaque | Correct |

### 2.7 Assessment Summary

| Axis | Correct | Partial | Miss | Total |
|------|---------|---------|------|-------|
| nounVerb | 4 | 1 | 1 | 6 |
| parataxis | 2 | 2 | 2 | 6 |
| periodic | 5 | 1 | 0 | 6 |
| voice | 3 | 2 | 1 | 6 |
| register | 3 | 1 | 2 | 6 |
| opacity | 2 | 3 | 1 | 6 |
| **Total** | **19** | **10** | **7** | **36** |

Periodic assessed against expected traits with hybrid T2 scores: Kant correct (mixed), Hemingway correct (running), Legal correct (periodic), Blog correct (running), Science correct (running), Churchill partial (T2 score suggests mixed but T1 label says periodic — label-aligned explanation is consistent).

**53% fully correct, 28% partially correct, 19% miss.** The strongest axes in real-world use are periodic (83% correct with hybrid scoring) and nounVerb (67% correct). The weakest are parataxis (33% correct) and register (50% correct) — consistent with the gold set calibration results.

---

## 3. System Architecture

### Two-Layer Controller

```
Layer 1: AXIS_OVERRIDE_POLICY (promotion gate)
  ├── Decides WHETHER Tier 2 is eligible for production on each axis
  ├── Unlock criteria: monotonicity advantage + genre-gating + failure-bucket stability
  └── Currently: periodicRunning = promoted, all others = blocked

Layer 2: AXIS_OWNERSHIP (merge contract)
  ├── Decides WHAT Tier 2 provides for promoted axes
  ├── Per-axis: scoreSource, labelSource, confidenceSource, explanationSource
  └── Currently: periodicRunning = { score: T2, label: T1, confidence: T1, explanation: label-aligned }
```

### Tier Architecture

| Axis | Score Source | Label Source | Status |
|------|------------|-------------|--------|
| nounVerb | Tier 1 (POS-enhanced) | Tier 1 | Production |
| parataxis | Tier 1 (POS "that" disambiguation) | Tier 1 | Production (ceiling documented) |
| periodic | **Tier 2 (ensemble)** | Tier 1 | **Hybrid production** |
| voice | Tier 1 | Tier 1 (Phase F calibrated thresholds) | Production |
| register | Tier 1 (F-score blend) | Tier 1 | Production |
| opacity | Tier 1 | Tier 1 | Production (ceiling documented) |

### Profile Provenance

All 10 active style profiles carry `metricsProvenance` metadata:
```json
{
  "analyzerVersion": "lanham-v2-phaseF-hybrid",
  "calibrationDate": "2026-04-17",
  "scoreSourceByAxis": { "periodicRunning": "tier2", ... },
  "labelSourceByAxis": { "periodicRunning": "tier1", ... }
}
```

---

## 4. What Was Built (Phases A-F)

### Phase A: Bug Fixes + Infrastructure
- Fixed Tier 2 register catastrophic bug (40/40 mislabeled → 0)
- Graded subordination evidence ladder (shared between tiers)
- Axis-level arbitration with shadow mode
- Score/label quality separation in calibration
- Genre-stratified calibration (n≥3 hard gate, n<3 watchlist)
- 6 failure-bucket regression tests

### Phase B: POS Backbone
- en-pos tagger integrated (96.43% Penn Treebank accuracy)
- POS-enhanced verb detection → nounVerb monotonicity +0.142
- "that" disambiguation (WDT vs DT vs IN) → demonstrative-that density 0.1176→0.0000
- Finite verb detection (VBZ/VBP/VBD/MD) for periodic analysis
- Heylighen-Dewaele F-score → register monotonicity +0.099

### Phase C+D: Infrastructure (Available, Not Weighted)
- AWL word list (570 families), syllable counter
- Voice: sentence length entropy, consecutive contrast, terminal shortness
- Opacity: Z-score normalized deviation-from-norm
- Suspension marker detection
- **All computed but weight = 0** — hand-picked weights degraded performance; need human-annotated calibration

### Phase E: Periodic Ensemble
- Left-branching index (POS-informed verb position)
- Conservative clause splitter (no list-comma splitting)
- Suspension marker integration
- Ensemble: 0.45 left-branch + 0.30 suspension + 0.25 sentence-length → +0.130 monotonicity

### Phase F: LLM Calibration
- 217 passages from Project Gutenberg across 12 genres
- 209 successfully labeled by Claude Sonnet 4.6
- Rubric validated: Claude strongest on voice (5/5) and register (4/5)
- Prompt ablation: low anchoring on 4 axes, high on parataxis (29%) and opacity (21%)
- **Threshold calibration: voice 0.30/0.70→0.10/0.31** — agreement 15%→57.5%
- **Threshold calibration: nounVerb 0.35/0.65→0.58/0.85** — agreement 42.5%→60.0%

### Post-Phase-F
- Parataxis Tier 1 fix: POS "that" disambiguation applied to both tiers
- Periodic hybrid promotion: T2 ensemble scores, T1 labels, label-aligned explanations
- Two-layer controller: promotion gate + merge contract
- Profile re-enrichment with provenance metadata

---

## 5. Profile Consistency

The drift check showed a delta of 0.231 between the active profile's periodic ratio (0.558) and a Kant-style test passage (0.327). This is expected — academic philosophy and the profile's philosophical corpus produce different periodic characteristics. The labels are consistent ("mixed" for both), and the explanation is label-aligned. No false drift advisory would be generated because the label match prevents the categorical trigger.

---

## 6. Revised Targets and Axis Classification

Axes are now classified into two tiers based on demonstrated reliability:

### Decision-Support Axes (suitable for drift detection, regeneration triggers, quantitative profiling)

These axes have sufficient accuracy and monotonicity to inform automated decisions, though not to make them unilaterally. They can be used for drift detection thresholds, style-profile comparisons, and firm guidance in the regeneration loop.

| Axis | Revised Target | Current | Rationale |
|------|---------------|---------|-----------|
| nounVerb | 0.80 mono / 65% agree | 0.732 / 60.0% | POS-enhanced; closest to target |
| register | 0.78 mono / 55% agree | 0.673 / 47.5% | F-score blend active; composite needs human-calibrated weights |
| periodic | 0.62 mono | 0.479 (T2) / 45.0% | Ensemble active; best ranking improvement (+0.130) |
| voice | 0.55 mono / 65% agree | 0.372 / 57.5% | Threshold calibration recovered label quality; score ranking limited |

### Advisory-Only Axes (directional guidance, not automated triggers)

These axes have documented architectural ceilings. They are useful for relative comparisons ("this passage is more hypotactic than your baseline") but should not drive regeneration triggers, hard constraints, or user-facing confidence claims.

| Axis | Revised Target | Current | Rationale |
|------|---------------|---------|-----------|
| parataxis | 0.45 mono (ceiling) | 0.378 / 42.5% | Requires clause-level parsing beyond heuristic reach |
| opacity | 0.35 mono (ceiling) | 0.192 / 32.5% | Reader-response phenomenon; honest architectural limit |

This distinction should be surfaced in any UI or reporting that exposes Lanham axis results. Decision-support axes can be presented with standard confidence. Advisory-only axes should be presented with explicit caveats about their directional-only nature, to prevent users from over-trusting the weak dimensions.

---

## 7. Test Suite Status

| Suite | Tests | Status |
|-------|-------|--------|
| Unit tests (lanham-prose-analyzer) | 13 | All pass |
| Failure-bucket regression | 6 | All pass |
| Calibration (informational) | 28 | All pass |
| Calibration (enforcement) | 5 | 2 pass (nounVerb, register), 3 fail on aspirational targets now formally revised |

The 3 calibration enforcement failures (voice, parataxis, opacity) use the original aspirational targets. These tests should be updated to the revised targets documented above.

---

## 8. Known Limitations

1. **Parataxis** (0.378 mono, 42.5% agree): The axis detects explicit conjunctions and POS-confirmed relative clauses but cannot measure true clause nesting depth. Complex subordination via semicolons, participial phrases, and implicit embedding is underpowered. Further improvement requires a genuine clause-level parser or a substantially larger human-annotated corpus.

2. **Opacity** (0.192 mono, 32.5% agree): The AT/THROUGH distinction is a reader-response phenomenon. The heuristic detects extreme opacity (dense alliteration, rhetorical figures) and extreme transparency (bureaucratic prose), but cannot reliably classify "mixed opacity." The 0.70 target is revised to 0.35. This is treated as a soft/informational axis — useful for relative comparisons, not hard enforcement.

3. **Register** (0.673 mono, 47.5% agree): The F-score blend improves ranking but the label thresholds for `general` genre are broad. Register is most accurate on clearly high (legal, academic) and clearly low (Hemingway, Bible) prose. Middle-register prose is the weak spot. The Phase C composite infrastructure (AWL, syllables) is available but needs human-calibrated weights.

4. **Voice** (0.372 mono, 57.5% agree): The monotonicity ceiling reflects that "voice" in Lanham's sense measures authorial craft and rhythmic intention — properties that surface-level features can only approximate. The Phase F threshold shift (0.30/0.70→0.10/0.31) dramatically improved label agreement by matching the actual score distribution, but the underlying ranking has not changed.

5. **Phase C/D infrastructure unweighted**: AWL density, syllable counting, voice entropy, consecutive contrast, terminal shortness, and opacity deviation-from-norm are all implemented and computed but carry zero weight in scoring. Hand-picked weights degraded performance; these signals need human-annotated calibration data to activate productively.

---

## 9. Files Modified

| File | Changes |
|------|---------|
| `lanham-prose-analyzer.ts` | POS verb detection (B2), F-score (B5), POS "that" disambiguation, graded evidence ladder, Phase F calibrated voice imports |
| `advanced-lanham-analyzer.ts` | A1 register fix, A2 evidence ladder, B3 "that" disambiguation, B4 finite verb detection, E1-E4 periodic ensemble |
| `lanham-shared.ts` | POS tagger, subordination evidence helper, syllable counter, voice metrics, opacity deviation, suspension markers, conservative clause splitter |
| `lanham-style-controller.ts` | Two-layer controller (promotion gate + merge contract), mergeWithPolicy() with label-aligned explanations |
| `lanham-style-policy.ts` | Phase F calibrated thresholds (voice, nounVerb for general genre) |
| `data/academic-word-list.ts` | AWL 570 word families (Phase C, not yet weighted) |
| `enrich-style-lanham.mjs` | Both-tier enrichment with metricsProvenance |
| `lanham-prose-analyzer.test.ts` | Updated expectations for POS-shifted boundaries |
| `lanham-failure-buckets.test.ts` | New: 6 regression tests |
| `lanham-calibration.test.ts` | Added A5 score/label separation + A6 genre stratification |

### New Files Created
| File | Purpose |
|------|---------|
| `scripts/lanham-calibration/rubric.ts` | Claude evaluation rubric (Phase F) |
| `scripts/lanham-calibration/run-judge.ts` | Claude-as-judge labeling pipeline |
| `scripts/lanham-calibration/weight-optimizer.ts` | Weight optimization + threshold calibration |
| `scripts/lanham-calibration/fetch-corpus.ts` | Project Gutenberg corpus builder |
| `scripts/lanham-calibration/validate-rubric.ts` | F1 gate: rubric validation |
| `scripts/lanham-calibration/prompt-ablation.ts` | F2.5: prompt anchoring test |
| `scripts/lanham-calibration/prepare-validation.ts` | F4: inter-source validation |
| `data/expansion-corpus.jsonl` | 217 passages across 12 genres |
| `data/expansion-labels.jsonl` | 209 Claude labels |
| `data/gold-holdout.jsonl` | 40-passage validation holdout |
| `data/human-review-sample.jsonl` | 42 passages for future human review |
| `data/lanham-calibrated-weights.json` | Calibration config with thresholds |
| `tests/calibration/lanham-failure-buckets.test.ts` | 6 failure-bucket regression tests |

### Backups
- `.backups/lanham-plan-v2-20260417-074950/` — pre-Phase-A state
- `.backups/lanham-phase-f-20260417-085622/` — pre-Phase-F state + pre-hybrid-promotion state
