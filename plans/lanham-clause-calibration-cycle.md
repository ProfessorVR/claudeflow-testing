# Clause Feature Calibration Cycle — Targeted Plan

**Date:** 2026-04-17
**Status:** PROPOSAL — awaiting review
**Prerequisite:** Clause parser implemented and stable (all 25 tests pass, production unchanged)
**Estimated effort:** 3-4 hours
**Scope:** Targeted calibration of clause-derived features against existing axes. No new infrastructure. No production changes without validated gain.

---

## 1. What This Does

A focused calibration cycle to answer two questions:

1. **Periodic:** Which clause-derived signals help and which hurt? The naive 5-signal ensemble (0.25/0.20/0.30/0.15/0.10) degraded monotonicity by -0.040 — but that doesn't mean all clause signals are bad. matrixDelayMean alone may improve periodic while preMainSubordinateRate introduces noise, or vice versa.

2. **Parataxis:** Is the clause-derived parataxis score underdesigned, not the parser itself? The current `computeParataxisFromClauses()` uses rate aggregates that may duplicate Tier 1's POS evidence rather than supplementing it. A hybrid structural score (Tier 1 ladder + modest clause-depth supplement) may outperform either alone.

**What this is NOT:** This is not a Phase F-scale LLM calibration exercise. It uses only the existing 40-passage gold set with systematic ablation and hybrid scoring experiments. It does not reach for a dependency parser or a larger corpus.

---

## 2. Periodic: Single-Signal Ablation

### Method

Test each clause-derived signal individually as a replacement for one existing ensemble signal, then as an addition. All tests against the 40-passage gold set.

### Preprocessing: Signal Normalization

Before comparing weights, normalize all periodic signals onto a comparable scale on the 40-passage gold set. The clause parser report showed that naive combination at hand-picked weights degraded performance — this may be a scaling artifact rather than evidence that the features themselves are weak.

**Method:** For each of the 5 signals (leftBranchRunning, suspRunning, clauseRunning, clausePreMainRunning, shortSentSignal), compute min/max across the 40 passages, then apply min-max normalization to [0, 1]. Also compute rank-normalized versions. Run all experiments on BOTH raw and normalized signals and compare — if normalization changes the winner, the original failure was scaling, not signal quality.

### Experiments: Ablation + Leave-One-Out

**Leave-one-in** (does each signal help alone?):

| Experiment | Signals Included | Question |
|-----------|-----------------|----------|
| **Baseline** | leftBranch + susp + sentLen (0.45/0.30/0.25) | 0.479 mono |
| **A: matrixDelay solo** | matrixDelay (1.0) | Standalone clause signal quality |
| **B: preMainSubord solo** | preMainSubord (1.0) | Standalone pre-main signal quality |

**Leave-one-out** (does removing a legacy signal reveal clause signal value?):

| Experiment | Signals Removed | Signals Added | Question |
|-----------|----------------|---------------|----------|
| **C: drop leftBranch, add matrixDelay** | -leftBranch | +matrixDelay | Are they correlated? Does one replace the other? |
| **D: drop susp, add matrixDelay** | -susp | +matrixDelay | Does matrixDelay compensate for suspension markers? |
| **E: drop sentLen, add preMainSubord** | -sentLen | +preMainSubord | Does preMainSubord capture the same short-sentence signal? |

**Combination variants** (if individual signals show promise):

| Experiment | Composition | Question |
|-----------|-------------|----------|
| **F: matrixDelay + baseline, no preMain** | leftBranch 0.25, susp 0.25, matrixDelay 0.35, sentLen 0.15 | Best single-clause-signal addition |
| **G: matrixDelay replaces leftBranch** | matrixDelay 0.45, susp 0.30, sentLen 0.25 | Clean replacement |
| **H: both clause, low weight** | leftBranch 0.30, susp 0.20, matrixDelay 0.20, preMainSubord 0.10, sentLen 0.20 | Reduced clause weight |

Run on both raw and min-max-normalized signal versions = 2x the experiment count.

### Decision Rule

- If any experiment exceeds baseline by ≥0.02 on raw OR normalized signals: candidate for adoption
- Must also pass genre n≥3 non-degradation (≤0.05) and failure-bucket stability
- If matrixDelay helps but preMainSubord hurts: drop preMainSubord, keep matrixDelay
- If normalization changes the winner: the original failure was scaling. Use normalization as a **diagnostic lens** to confirm the feature has value, but only ship raw or a frozen versioned transform whose parameters are stored with analyzer provenance metadata. Do NOT deploy min-max/rank normalization fitted on 40 passages — that risks overfitting the normalization itself
- If no experiment improves under either scaling: keep baseline, document that clause features don't add orthogonal periodic information at this sample size

### Implementation

A single script (`scripts/lanham-calibration/periodic-ablation.ts`) that:
1. Loads the 40 gold passages
2. Computes all 5 intermediate signals per passage (expose from Tier 2 as diagnostic object)
3. Normalizes signals (min-max and rank)
4. For each experiment variant × 2 normalizations: recomputes ensemble, reports monotonicity
5. Reports sorted results with best variant highlighted

This requires exposing intermediate periodic signals from the Tier 2 method. The cleanest approach: extract signal computation into a helper function that returns all 5 values, then let the ensemble combiner and the ablation script both consume it.

---

## 3. Parataxis: Hybrid Structural Score

### Diagnosis

The current `computeParataxisFromClauses()` produces a standalone score from clause rates and depth aggregates. It returned 0.306 monotonicity — worse than Tier 1's 0.378. But this doesn't mean clause data is useless for parataxis. The rates may be duplicating signals Tier 1 already captures (explicit conjunctions, POS-confirmed relatives) while missing the orthogonal information (true nesting depth, coordination group structure).

### Approach: Tier 1 + Clause Supplement

Instead of replacing Tier 1's parataxis with clause-derived parataxis, **supplement** Tier 1 with clause-specific signals that add genuinely new information:

```typescript
// Hybrid parataxis: Tier 1 base + clause depth supplement
hybridParataxis = clamp(
  tier1ParataxisRatio * baseWeight +
  clauseDepthSignal * depthWeight +
  coordinationGroupSignal * coordWeight
)
```

Where:
- `tier1ParataxisRatio` is the existing POS-based score (0.378 mono baseline)
- `clauseDepthPenalty` = `clamp(subordinationDepthMean / 2)` — raises hypotaxis pressure when genuine nesting is deep (≥2). This is a **penalty form** (pushes score toward hypotactic) rather than an additive supplement, which is architecturally consistent with the evidence ladder's "high-confidence cues boost subordination" logic.
- `conditionedCoordSignal` = coordination group density **conditioned on low subordinate depth** — only counts as paratactic evidence when subordination depth is ≤1. This prevents rewarding coordination inside hypotactic frames (Holmes's coordinate "if" clauses are coordination inside deep subordination — they should NOT boost parataxis).

```typescript
// Conditioned coordination: only paratactic when depth is shallow
const rawCoordDensity = coordinationGroups.length / sentenceCount;
const conditionedCoord = maxSubordinationDepth <= 1
  ? clamp(rawCoordDensity / 0.5)  // shallow = genuine parataxis
  : clamp(rawCoordDensity / 0.5) * 0.3;  // deep = coordination inside hypotaxis, down-weight
```

### Experiments

**Additive supplements:**

| Experiment | Composition | Question |
|-----------|-------------|----------|
| **Baseline** | Tier 1 only (0.378 mono) | Current production |
| **F: T1 + depth penalty** | T1 * 0.80 + clauseDepthPenalty * 0.20 | Does nesting depth push toward correct hypotactic labels? |
| **G: T1 + conditioned coord** | T1 * 0.80 + conditionedCoord * 0.20 | Does structural coordination help when properly conditioned? |
| **H: T1 + both** | T1 * 0.70 + depthPenalty * 0.15 + condCoord * 0.15 | Combined |

**Corrective forms** (clause features adjust rather than add):

| Experiment | Composition | Question |
|-----------|-------------|----------|
| **I: T1 corrected by depth** | T1 + (depthPenalty - 0.5) * 0.30 | Depth shifts T1 score toward hypotactic when deep, toward paratactic when shallow |
| **J: T1 corrected by both** | T1 + (depthPenalty - 0.5) * 0.20 + (condCoord - 0.5) * 0.15 | Both clause signals correct T1 bidirectionally |

The corrective form is important because Tier 1 may already be close to correct for some passages — a pure additive boost could overcorrect those while fixing others. The (signal - 0.5) centering makes clause features push both directions rather than only adding.

### Decision Rule

Parataxis full promotion gate applies (same as clause-parser plan):
1. Must exceed Tier 1 by ≥0.05 mono (≥0.428)
2. Agreement must not degrade >5% from baseline (≥37.5%)
3. No genre group with n≥3 degrades >0.05 monotonicity
4. All clause-specific failure-bucket tests pass
5. No new failure modes

**Outcomes:**
- If a hybrid experiment passes all 5 criteria: adopt as new Tier 2 parataxis, promote score source
- If experiments show modest improvement (+0.02 to +0.05): stay in shadow, document as promising, revisit with more data
- If no improvement or regression: keep Tier 1, document that clause features don't add orthogonal parataxis information at this sample size and with this feature mapping

---

## 4. Additional Failure Buckets

Before running scoring experiments, add targeted failure buckets that test the clause parser's structural correctness on edge cases relevant to the parataxis and periodic feature mappings:

| Test | Sentence | Expected |
|------|----------|----------|
| **Mixed nesting** | "Although he tried, and although she persisted, the project that they had started together eventually failed." | 3+ clauses, subordinate depth ≥2, matrix is "the project...failed" |
| **Coordinate chain with subordinate insert** | "She spoke, because she felt she must, and then she left." | Coordination between "She spoke" and "she left", subordinate "because she felt she must" nested inside |
| **Appositive** | "The president, who had served two terms, resigned." | Relative clause "who had served" is appositive/relative, not matrix |
| **One-clause simple** | "Dogs barked." | 1 clause, matrix, depth 0, no subordination |

These test the parser's graph correctness on patterns that the feature mapping consumes.

---

## 5. Execution Steps

```
Step 1: Add failure buckets (30 min)
  │     Mixed nesting, coord+subord insert, appositive, one-clause simple
  │
  ├── GATE: All new + existing tests pass
  │
Step 2: Expose + normalize + correlate periodic signals (1 hour)
  │     Extract signal computation into helper function
  │     Compute min-max and rank normalizations on 40-passage set (diagnostic only)
  │     Compute pairwise correlations among all 5 signals (leftBranch, susp,
  │       sentLen, matrixDelay, preMainSubord) to identify redundancy vs added value
  │     If leftBranch ↔ matrixDelay correlation > 0.8: they measure the same thing
  │       and replacement experiments (C, G) are more relevant than addition experiments
  │
Step 3: Run periodic ablation (1.5 hours)
  │     Leave-one-in (A, B): solo clause signal quality
  │     Leave-one-out (C, D, E): does removing legacy reveal clause value?
  │     Combinations (F, G, H): best blend candidates
  │     All experiments × 2 normalizations (raw + min-max)
  │
  ├── GATE: Identify which clause signals help/hurt periodic
  │         Best variant must pass genre n≥3 + failure-bucket checks
  │         Run "largest movers" audit on the 5-10 passages whose scores
  │         change most under the best variant — inspect via clause-view
  │         diagnostics to verify re-rankings are linguistically correct
  │
Step 4: Run parataxis hybrid experiments (1 hour)
  │     Additive (F, G, H): depth penalty + conditioned coord
  │     Corrective (I, J): bidirectional clause adjustments to Tier 1
  │     Both with conditioned coordination (not raw group count)
  │
  ├── GATE: Evaluate against full 5-criterion promotion gate
  │
Step 5: Passage-level disagreement audit (30 min)
  │     For any variant that passes numeric gates:
  │     Identify every gold-set passage whose production LABEL or EXPLANATION
  │     would change under the new weights. Inspect each via clause-view.
  │     If any changed label is linguistically worse, reject the variant
  │     even if aggregate metrics improved.
  │
Step 6: Apply validated changes + comprehensive verification (30 min)
  │     Update ensemble weights if periodic improved
  │     Update AXIS_OWNERSHIP if parataxis passed gate
  │     Store any frozen normalization parameters in provenance metadata
  │     Re-run all 25 tests + calibration + real-world validation
  │
  └── Document results, promotion decisions, and what was learned
```

---

## 6. What This Does NOT Do

- Does not add a dependency parser
- Does not require LLM labeling or a larger corpus
- Does not change production scoring unless an experiment passes the promotion gate
- Does not modify the clause parser itself — only the feature-to-score mapping
- Does not touch voice, register, opacity, or nounVerb

---

## 7. Framing

This is a diagnostic cycle, not a research project. It answers: "given that the clause parser produces correct structural data, what is the best way to map that data into Lanham scores?" The answer may be "matrixDelay is useful for periodic but subordination rates don't add value for parataxis at this sample size" — that's a valid outcome that informs future work without requiring new infrastructure.

The clause parser is successful infrastructure. This cycle determines what that infrastructure can contribute to production under the existing promotion discipline.
