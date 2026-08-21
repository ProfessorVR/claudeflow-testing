# Lanham Tier 1 vs Tier 2 — Comprehensive Comparison Report

**Date:** 2026-04-16
**Gold Set:** 40 authoritative passages from Lanham's *Analyzing Prose* (all 9 chapters)
**Analyzers:** LanhamProseAnalyzer (Tier 1, heuristic) vs AdvancedLanhamAnalyzer (Tier 2, deep)

---

## Executive Summary

Tier 2 **improves one axis, degrades two, and leaves three unchanged**. The net effect is that Tier 2 is currently worse than Tier 1 as a whole system. The one genuine improvement (periodicRunning: +20% agreement) comes at a catastrophic cost to register labeling (-32.5% agreement) due to a systematic bug in Tier 2's `deriveLabels()` register logic.

| Verdict | Axis | Delta |
|---------|------|-------|
| **T2 WINS** | periodicRunning | +20.0% agreement, +0.041 monotonicity |
| **T1 WINS** | parataxisHypotaxis | -5.0% agreement, -0.125 monotonicity |
| **T1 WINS** | primaryRegister | -32.5% agreement (catastrophic Tier 2 bug) |
| TIE | nounVerb | Identical (Tier 2 delegates to Tier 1) |
| TIE | voice | Identical (Tier 2 delegates to Tier 1) |
| TIE | opacity | Identical (Tier 2 delegates to Tier 1) |

---

## 1. Per-Axis Aggregate Metrics

| Axis | T1 Agreement | T2 Agreement | T1 Monotonicity | T2 Monotonicity | Label Diffs | Avg Score Delta |
|------|-------------|-------------|-----------------|-----------------|-------------|-----------------|
| nounVerb | 42.5% | 42.5% | 0.590 | 0.590 | 0 | 0.0000 |
| parataxisHypotaxis | **45.0%** | 40.0% | **0.372** | 0.247 | 14 | 0.1123 |
| periodicRunning | 45.0% | **65.0%** | 0.349 | **0.390** | 21 | 0.3124 |
| voice | 15.0% | 15.0% | 0.372 | 0.372 | 0 | 0.0000 |
| primaryRegister | **47.5%** | 15.0% | 0.574 | 0.574 | 40 | 0.0000 |
| opacity | 32.5% | 32.5% | 0.193 | 0.193 | 0 | 0.0000 |

---

## 2. Axis-by-Axis Analysis

### 2.1 nounVerb — TIE (Tier 2 delegates to Tier 1)

Zero differences. Tier 2's `analyzeNounVerbAxis()` is a direct pass-through to Tier 1. Scores identical to 15 decimal places. This is by design — noun/verb analysis is already high-confidence in Tier 1.

### 2.2 parataxisHypotaxis — TIER 1 WINS

**Agreement:** T1 45.0% vs T2 40.0% (-5.0%)
**Monotonicity:** T1 0.372 vs T2 0.247 (-0.125)
**Label disagreements:** 14 entries

Tier 2's deep parataxis analysis produces **systematically higher scores** (avg delta +0.112, consistently T2 higher). This pushes many genuinely paratactic passages into the "mixed" band:

| Pattern | Count | Examples |
|---------|-------|---------|
| T2 correct, T1 wrong | 5 | Miller, Brougham, Darbyshire, Eisenhower press, Churchill Trinity |
| T1 correct, T2 wrong | 7 | Dickens, Bacon Marriage, Declaration grievances, Swinburne, Herr, Flanner, Cage |
| Both wrong | 2 | Drummond, Lichtenstein |

**Root cause:** Tier 2 adds relative clause detection, participial phrase counting, and nesting depth bonus. These all increase the hypotaxis score. For genuinely paratactic passages (Hemingway, Malory, Marx, Cage), the implicit subordination detection overcounts — relative pronouns like "that" in paratactic prose trigger false subordination signals.

**Worst case:** Lichtenstein T1=0.543, T2=0.290 — a -0.253 delta that flips the label from "mixed" to "predominantly paratactic" when the gold is "predominantly hypotactic."

### 2.3 periodicRunning — TIER 2 WINS (Significant)

**Agreement:** T1 45.0% vs T2 65.0% (+20.0%)
**Monotonicity:** T1 0.349 vs T2 0.390 (+0.041)
**Label disagreements:** 21 entries (14 where T2 is correct, 6 where T1 is correct)

This is Tier 2's genuine strength. The clause-level suspension analysis correctly identifies more running-style passages that Tier 1 misclassifies as periodic or mixed:

**T2 correct wins (14):** Burns, Woolf, Dean, Malory, Sterne, Bible, Eisenhower press, Declaration grievances, Swinburne, Bradley, Herr, Marx, Hennesy, Geology

**BUT:** Tier 2 has a strong running-style bias — it labels nearly everything as "predominantly running." The avg score delta is 0.312 with max 1.000 (several passages go from T1=0.000 to T2=1.000). This means Tier 2's clause-level analysis finds the main verb in the first clause almost always, pushing the running ratio to 1.0.

**T1 correct losses (6):** Federal Register (genuine periodic), Declaration (genuine periodic), Housman (mixed), Churchill Trinity (genuine periodic), Dickens (mixed), James (mixed)

**Systematic bias:** Tier 2's `analyzePeriodicRunning()` struggles with genuine periodic sentences because its clause splitter (commas, semicolons, colons, dashes) fragments periodic suspensions prematurely. A sentence like "If X, if Y, if Z, then W" gets split at every comma — the "then W" clause contains the main verb, but it's clause 4 of 4 (index 3), which gives suspensionRatio = 0.75 → periodic. However, simpler periodic sentences with fewer comma-separated elements get scored as running.

### 2.4 voice — TIE (Tier 2 delegates to Tier 1)

Zero differences. Tier 2 delegates voice analysis entirely to Tier 1. Voice at 15% agreement is the worst-performing axis for both tiers — this axis fundamentally requires understanding authorial intention, not measurable surface features.

### 2.5 primaryRegister — TIER 1 WINS (Tier 2 has catastrophic bug)

**Agreement:** T1 47.5% vs T2 15.0% (-32.5%)
**Monotonicity:** Both 0.574 (identical continuous scores)
**Label disagreements:** 40/40 — EVERY SINGLE ENTRY disagrees

**This is a bug, not an analysis difference.** Tier 2 labels every single passage as "low" register. The continuous `registerMarkednessScore` values are identical between tiers (scores delegate to Tier 1), but Tier 2's `deriveLabels()` has a different register labeling path that uses `lgr` (latinateGermanicRatio) against `t.register.lowToMiddle` / `t.register.middleToHigh` thresholds, combined with `rms` (registerMarkednessScore).

**Root cause:** In Tier 2's `deriveLabels()` (lines 843-874), when `rms < 0.25` (which is true for most passages since registerMarkednessScore rarely exceeds 0.25), the code routes through:
```
if (lgr >= regBands.middleToHigh) → high
else if (lgr >= regBands.lowToMiddle) → middle
else → low
```

The issue is that for the `general` genre (which is what both analyzers are constructed with in the comparison script), `regBands.lowToMiddle = 0.25` and `regBands.middleToHigh = 0.45`. Most passages have `latinateGermanicRatio` below 0.25, so they all fall into "low."

Meanwhile, Tier 1's `deriveLabels()` (lines 688-698) uses `registerMarkednessScore` directly:
```
if (rms >= 0.62) → high
else if (rms <= 0.38) → low
else → middle
```

This is a fundamentally different labeling strategy — Tier 1 uses the composite directional score, Tier 2 uses raw Latinate ratio against genre boundaries. The Tier 2 path was meant to be more nuanced but the thresholds are wrong for the `general` genre.

### 2.6 opacity — TIE (Tier 2 delegates to Tier 1)

Zero differences. The implementation guide notes this was intentional: "Opacity is delegated to Tier 1 (baseline) — the deep 4-signal composite produces worse discrimination than Tier 1's simpler meta-linguistic heuristic." The `fullAnalysis()` method in Tier 2 explicitly keeps baseline opacity.

---

## 3. Delegated vs. Overridden Axes Summary

| Axis | Tier 2 Behavior | Result |
|------|----------------|--------|
| nounVerb | **Delegated** (pass-through) | Identical |
| voice | **Delegated** (pass-through) | Identical |
| opacity | **Delegated** (kept from baseline) | Identical |
| register scores | **Delegated** (kept from baseline) | Scores identical |
| register labels | **Overridden** (different deriveLabels) | CATASTROPHIC BUG |
| parataxisHypotaxis | **Overridden** (deep analysis) | T1 wins by 5% agreement |
| periodicRunning | **Overridden** (deep analysis) | T2 wins by 20% agreement |

---

## 4. Score Delta Analysis

### Axes with zero delta (delegated)
- nounVerb: 0.0000 avg, 0.0000 max
- voice: 0.0000 avg, 0.0000 max
- opacity: 0.0000 avg, 0.0000 max
- primaryRegister: 0.0000 avg, 0.0000 max (scores identical, only labels differ)

### parataxisHypotaxis (14 label disagreements)
- Avg |delta|: 0.1123
- Max |delta|: 0.2696 (Drummond: T1=0.116, T2=0.385)
- Tier 2 systematically scores higher (more hypotactic) due to implicit subordination detection
- 5 cases where this helps, 7 cases where it hurts, 2 cases both wrong

### periodicRunning (21 label disagreements)
- Avg |delta|: 0.3124
- Max |delta|: 1.000 (Sterne, Federal Register, Herr — T1=0.000, T2=1.000)
- Tier 2 has extreme running bias — scores jump from near-0 to 1.0
- 14 cases where this helps, 6 cases where it hurts, 1 case both wrong

---

## 5. Recommendations

### Immediate (bug fix)
1. **Fix Tier 2 register labeling.** The `deriveLabels()` register logic in `advanced-lanham-analyzer.ts` must use the same `registerMarkednessScore`-based strategy as Tier 1, or the genre thresholds need recalibration. Currently every passage gets "low" register, which is clearly wrong.

### Short-term (calibration)
2. **Tune Tier 2 parataxis thresholds.** The implicit subordination detection (relative clauses, participial phrases, nesting depth) overcounts. Either weight these signals lower or add a denominator correction for passage length.

3. **Fix Tier 2 periodicRunning running bias.** The clause splitter fragments periodic sentences too aggressively. The main-verb-finding heuristic defaults to the first clause too often when subordinate/relative clause detection fails to match.

### Medium-term (architecture)
4. **Consider a hybrid approach:** Use Tier 2 only for periodicRunning (where it clearly helps) and Tier 1 for everything else. The current "auto" mode in the controller could implement this selective upgrade.

5. **Genre-aware testing:** Both tiers were run with `genre='general'`. The Tier 2 register bug may not manifest with `genre='academic'` (different thresholds). Re-run with per-entry genre matching for a more accurate picture.
