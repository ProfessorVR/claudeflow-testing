# Lanham Prose Analysis — Improvement Plan v2

**Date:** 2026-04-17 (revised from v1 2026-04-16)
**Status:** PROPOSAL — No code changes until reviewed
**Branch:** `writing-pipeline-v2` (commit `50f87f36`)
**Revision basis:** v1 plan + detailed review feedback incorporating axis-level arbitration, score/label separation, genre-stratified calibration, failure-bucket tests, register composite architecture, ensemble periodic, and conditional subordination evidence weighting.

---

## Executive Summary

This plan fixes the Lanham prose analysis module's three confirmed Tier 2 bugs, then systematically raises heuristic quality through POS tagger integration, curated word lists, and new metrics — all gated by axis-level arbitration that prevents any "upgrade" from degrading whole-system quality.

**Key architectural changes from v1:**

1. **Tier 2 as axis-wise ensemble:** Tier 2 is no longer treated as a monolithic upgrade. It becomes an **axis-wise ensemble of heuristics, POS-based features, and calibrated thresholds** where each deep analysis path must independently earn its right to override Tier 1, validated per-axis and per-genre before activation.

2. **POS as enabling backbone, not conceptual center:** Phase B adds a POS backbone to unlock high-impact mechanistic repairs on parataxis, periodicity, and register. POS tagging is the hard prerequisite for three specific fixes (B3/B4/B5) but is not the conceptual center of Tier 2. Voice and opacity remain primarily limited by heuristic design and calibration volume, not by missing tags — POS does not eliminate the need for Phase D/E feature design and Phase F LLM calibration.

### Current State

| Axis | Agreement | Monotonicity | Target | Gap |
|------|-----------|-------------|--------|-----|
| nounVerb | 42.5% | 0.590 | 0.85 | -0.260 |
| register | 47.5% | 0.574 | 0.85 | -0.276 |
| voice | 15.0% | 0.372 | 0.75 | -0.378 |
| parataxis | 45.0% | 0.372 | 0.70 | -0.328 |
| periodic | 45.0% | 0.349 | 0.65 | -0.301 |
| opacity | 32.5% | 0.193 | 0.70 | -0.507 |

---

## Phase A: Bug Fixes + Axis-Level Arbitration (No New Dependencies)

### A1: Fix Tier 2 Register Label Derivation

**Problem:** Tier 2's `deriveLabels()` uses `latinateGermanicRatio` against genre thresholds. Observed lgr range 0.000–0.216, genre `general` threshold `lowToMiddle=0.25` → all 40 passages labeled "low."

**Fix:** Replace Tier 2's register label path with Tier 1's `registerMarkednessScore`-based approach:
```
if (rms >= 0.62) → high
else if (rms <= 0.38) → low
else → middle
```

**File:** `advanced-lanham-analyzer.ts:843-874`
**Validation:** Re-run comparison; verify Tier 2 register agreement recovers to ≥47.5% (matching Tier 1).

### A2: Reduce Parataxis Inflation

**Fix:** In Tier 2 parataxis detection, apply a graded evidence ladder for subordination weighting:

- **High-confidence cues (1.0x weight):** Explicit subordinating conjunction (SUBORDINATING_CONJ set) or POS-confirmed relative pronoun (WDT/IN tag on "that/which/who/whom")
- **Low-confidence cues (0.3x weight):** Participial patterns (-ing/-ed at clause boundaries without POS confirmation)
- **Nesting depth bonus:** Reduced from +0.15 to +0.08, and **conditional on the sentence already containing at least one high-confidence subordination cue.** This prevents the bonus from amplifying false positives while still allowing it to fire on genuinely hypotactic sentences driven by a single strong subordinate structure (e.g., one "if" clause with deep nesting in Holmes).

The graded ladder avoids the failure mode of a rigid "≥2 explicit subordinators" gate, which would undercount genuinely hypotactic prose with only one reliable subordinate clause.

**File:** `advanced-lanham-analyzer.ts:410-415, 447`

### A3: Opacity Reweighting — Staged Calibration

**Rationale:** Tacit pattern density correlates more strongly with Lanham's opacity judgments than the other signals (his most opaque passages have dense rhetorical figures; his most transparent have zero). However, opacity is the weakest axis (0.193 monotonicity) and is acknowledged as a reader-response proxy — so a hard reweight risks overfitting to rhetorical-figure density before we have stronger cross-genre validation.

**Approach:** Test multiple blends side by side rather than committing to a single new weighting:

| Blend | Base Opacity | Tacit Patterns | Alliteration | Polyptoton |
|-------|-------------|---------------|-------------|-----------|
| Current (baseline) | 0.50 | 0.25 | 0.15 | 0.10 |
| Moderate tacit boost | 0.40 | 0.35 | 0.15 | 0.10 |
| Aggressive tacit boost | 0.30 | 0.45 | 0.15 | 0.10 |

**Unlock rule:** The new blend is adopted only if it improves both overall and per-genre monotonicity without worsening any failure-bucket results. If no blend clearly wins, keep the current weights and defer opacity improvements to Phase D (deviation-from-norm) and Phase F (LLM calibration).

**File:** `lanham-prose-analyzer.ts:74` (change deferred until calibration validates a blend)

### A4: Formalize Axis-Level Arbitration in the Controller

**This is a new task not in v1.** Add an override safety layer to `LanhamStyleController`:

```typescript
interface AxisOverridePolicy {
  /** Tier 2 may override Tier 1 for this axis */
  allowOverride: boolean;
  /** Minimum calibrated monotonicity advantage Tier 2 must demonstrate */
  minMonotonicityAdvantage: number;
  /** If set, Tier 2 override is gated behind this confidence threshold */
  confidenceGate?: number;
}

const AXIS_OVERRIDE_POLICY: Record<string, AxisOverridePolicy> = {
  nounVerb:           { allowOverride: false, minMonotonicityAdvantage: 0 },
  parataxisHypotaxis: { allowOverride: false, minMonotonicityAdvantage: 0.05 },
  periodicRunning:    { allowOverride: 'shadow', minMonotonicityAdvantage: 0 },  // shadow mode: compute + log, don't override
  voice:              { allowOverride: false, minMonotonicityAdvantage: 0 },
  primaryRegister:    { allowOverride: false, minMonotonicityAdvantage: 0 },     // blocked until new model validated
  opacity:            { allowOverride: false, minMonotonicityAdvantage: 0 },
};

// PERIODIC/RUNNING — SHADOW MODE:
// The comparison report shows Tier 2 improves aggregate periodic agreement
// (+20%), but the +0.041 monotonicity advantage is within noise range for
// 40 passages and Tier 2 still has a strong running-style bias (10/21
// disagreements produce ratio=1.000). Rather than unlocking immediately:
//   - Shadow mode: Tier 2 periodic scores are computed and logged alongside
//     Tier 1 scores, but Tier 1 labels are used for production output.
//   - Promotion: After post-Phase-B or post-Phase-E recalibration confirms
//     the gain is real (overall + per-genre + no periodic failure-bucket
//     regressions), shadow mode is upgraded to full override.
//
// UNLOCK CRITERIA (all axes):
// With only 40 authoritative passages and genre groups as small as 1-3,
// a single aggregate monotonicity margin is unreliable. An axis override
// is promoted from shadow/blocked to active only when Tier 2 demonstrates
// repeated wins across:
//   1. Overall aggregate agreement AND monotonicity
//   2. Per-genre slices where n >= 3 (hard gate)
//   3. Per-genre slices where n < 3 (manual-review watchlist, not binding)
//   4. Failure-bucket stability (no new regressions in named test cases)
```

**Behavior:** In `fullAnalysis()`, Tier 2 runs all its deep paths but the controller **selectively merges** results per axis according to the policy. Only `periodicRunning` is initially unlocked for Tier 2 override. Other axes unlock only after per-axis, per-genre calibration demonstrates improvement.

This formalizes the architectural principle: Tier 2 is an **axis-wise ensemble of heuristics, POS-based features, and calibrated thresholds** — not a monolithic "deep" replacement. Each axis earns its override independently.

**File:** `lanham-style-controller.ts` (new method: `mergeWithPolicy()`)

### A5: Separate Score and Label Benchmarking

**New task.** The calibration test suite must evaluate two independent quality dimensions:

1. **Score quality:** Spearman rank monotonicity of continuous scores against gold ordinals (existing)
2. **Label quality:** Categorical agreement of derived labels against gold labels (existing but not enforced separately)

Add assertions that when score quality passes but label quality fails, the issue is in `deriveLabels()` — not in the underlying analysis. This prevents future register-type bugs from hiding behind passing monotonicity.

**File:** `tests/calibration/lanham-calibration.test.ts` (add dedicated label-quality test block)

### A6: Genre-Stratified Calibration

**New task.** Extend the calibration suite to report results both overall and per genre group. The 12 genre groups already defined in the test file must each produce their own agreement/monotonicity row.

**Enforcement tiers by sample size:**
- **Genre groups with n ≥ 3** (Political=6, Literary Fiction=5, Academic=4, Legal=3, Narrative Nonfiction=3): Hard gate — future improvements must not degrade agreement or monotonicity on these groups.
- **Genre groups with n < 3** (Literary Criticism=1, Journalism=1, Polemical=2, Religious=1, Textbook=1, Military=1, Personal Correspondence=1): Watchlist — results are reported and manually reviewed but are NOT binding calibration gates. With 1-2 passages, noise dominates signal.

This prevents useful changes from being blocked by single-passage genre noise while still surfacing genre-specific problems for manual review.

**File:** `tests/calibration/lanham-calibration.test.ts` (add per-genre reporting; hard-gate only n≥3 groups)

### A7: Failure-Bucket Regression Tests

**New task.** Create named test cases for each identified failure pattern:

| Bucket | Test Content | Expected Behavior |
|--------|-------------|-------------------|
| `demonstrative-that` | "That book sat on that shelf for that entire year." | "that" NOT counted as subordination |
| `list-commas` | "He bought apples, oranges, bananas, and grapes." | Commas NOT treated as clause boundaries |
| `participial-false-positive` | "The completed report was filed." | "completed" NOT counted as participial subordination |
| `passive-not-periodic` | "The data was analyzed by the team." | Passive voice NOT misidentified as periodic suspension |
| `polysyndetic-parataxis` | "And he ran and he jumped and he fell." | Counted as paratactic, not mixed |
| `genuine-periodic` | "If you have been in line, if you have watched the enemy..." | Main verb detected late, scored periodic |

**File:** New `tests/calibration/lanham-failure-buckets.test.ts`

**Phase A estimated effort:** 3-4 hours (expanded from v1's 1-2 hours to include A4-A7).

---

## Phase B: POS Backbone for Mechanistic Repairs

Phase B adds a POS backbone to unlock high-impact mechanistic repairs on parataxis, periodicity, and register. POS tagging is the best next enabling layer — a hard prerequisite for three specific fixes (B3/B4/B5) that target the axes with the most mechanistic (non-subjective) failure modes. Without it, those fixes are blocked and the only remaining levers are weight tuning and word lists.

**Expectation calibration:** Even with POS fully integrated, voice and opacity remain primarily limited by heuristic design and calibration volume. POS does not solve clause attachment ambiguity, rhetorical voice detection, or reader-response opacity measurement. Those problems require the feature design work in Phases D/E and the calibration expansion in Phase F.

### B1: Add POS Tagger Dependency

**Package:** `en-pos` (96.43% Penn Treebank accuracy, pure JS, MIT) or `wink-pos-tagger` (93.2%, 525K tokens/sec).

**Integration point:** New function in `lanham-shared.ts`:
```typescript
export function tagPOS(text: string): Array<{ word: string; tag: string }>;
```

All downstream consumers call this shared function.

### B2: Replace `isVerb()` / `COMMON_VERBS` with POS Tags

Replace the static `COMMON_VERBS` set (55 base forms + inflections) with POS-tagged verb identification. Tags VB/VBD/VBG/VBN/VBP/VBZ identify verbs; MD identifies modals.

**Impact:** Better verb counting for nounVerb axis. Eliminates false verb matches for words that are ambiguously noun/verb ("run", "set", "lead").

### B3: Disambiguate "that" in Parataxis Detection

With POS tags:
- **WDT** (wh-determiner): relative clause → count as subordination
- **DT** (determiner): demonstrative → do NOT count
- **IN** (subordinating conjunction): complement clause → count as subordination

This is the single highest-impact fix for parataxis accuracy.

**Evidence weighting:** Uses the **same graded evidence ladder defined in A2** (canonical rule, shared helper):
- High-confidence cues (1.0x): Explicit subordinating conjunction OR POS-confirmed WDT/IN
- Low-confidence cues (0.3x): Participial patterns
- Nesting bonus (+0.08): Conditional on ≥1 high-confidence cue in the sentence

Phase B upgrades the A2 implementation by replacing heuristic "that" classification with POS-confirmed tags, but the gating logic remains identical. One shared helper (`assessSubordinationEvidence()` in `lanham-shared.ts`) is used by both the Phase A heuristic path and the Phase B POS-aware path.

### B4: Use POS-Tagged Finite Verbs for Periodic Detection

Replace `COMMON_VERBS.has(w)` in the main-verb finder with POS-tag check for finite verbs (VBZ, VBP, VBD, MD — excluding VBG and VBN which are participles, not finite).

This prevents the algorithm from identifying "having" (VBG) or "ordered" (VBN) as the main verb in periodic suspensions like "Having often found... ordered simply to wait... he began..."

### B5: Implement Heylighen-Dewaele F-Score for Register

```
F = 50 * ((freq_noun + freq_adj + freq_prep + freq_article
         - freq_pronoun - freq_verb - freq_adverb - freq_interjection) / N + 1)
```

Range: 0 (informal) to 100 (formal). Computed directly from POS tag frequencies.

**Integration:** F-score becomes **one feature** in the register composite (see Phase C), not a standalone replacement. `latinateGermanicRatio` is demoted from primary signal to one of several features.

### B6: Re-Run Calibration (Gate)

After B1-B5, run full calibration suite:
- Overall agreement + monotonicity per axis
- Per-genre stratified results
- Failure-bucket regression tests
- Score quality AND label quality separately

**Gate:** No further phases proceed until Phase B results are documented and reviewed.

**Phase B estimated effort:** 4-6 hours.

---

## Phase C: Register Composite Architecture + Word Lists

### C1: Register as Multi-Feature Composite

**Key architectural change from v1:** `latinateGermanicRatio` is demoted from semantic center to one signal among several. The new register composite:

```typescript
registerScore = weighted_combination(
  fScore:               0.30,   // Heylighen-Dewaele (from B5)
  awlDensity:           0.20,   // Academic Word List presence
  polysyllabicRatio:    0.15,   // 3+ syllable words / total
  contractionRate:      0.10,   // contractions / total words (negative signal)
  avgSentenceLength:    0.10,   // longer = more formal
  latinateGermanicRatio:0.10,   // suffix-based (demoted from primary)
  formalMarkerDensity:  0.05,   // furthermore, moreover, etc.
)
```

The weights are initial estimates. Actual values to be calibrated after implementation.

### C2: Embed Coxhead Academic Word List

570 word families from the AWL as a JSON lookup table (~15KB). AWL density = AWL word count / total content words.

**Source:** `eapfoundation.com/vocab/academic/awllists/`

### C3: Embed GSL/NGSL Core List

~2,000 word families from the General Service List. Words appearing ONLY in the GSL (not in AWL) signal low register.

### C4: Heuristic Syllable Counter

Vowel-cluster method (~85% accuracy):
1. Count vowel groups (a, e, i, o, u, y)
2. Subtract 1 for silent final -e
3. Subtract 1 for common diphthongs (-tion, -tious, -cious, -sion)
4. Add 1 for -le/-les after consonant
5. Minimum 1

Optionally upgrade to `cmu-pronouncing-dictionary` for 98% accuracy + stress pattern data (useful for Phase D voice work). This adds ~3MB but is a pure JSON lookup.

### C5: Re-Run Calibration (Gate)

Same protocol as B6. Register monotonicity target: ≥0.700.

**Phase C estimated effort:** 3-4 hours.

---

## Phase D: Voice + Opacity Enhancement

### D1: Sentence Length Entropy (Voice)

Shannon entropy over quantized sentence lengths:
```
Bins: [1-5, 6-10, 11-15, 16-20, 21-30, 31-50, 51+]
H = -Σ(p_i × log₂(p_i))
```
High entropy = varied rhythm = voiced. Normalize to [0, 1] by dividing by log₂(number of bins).

### D2: Consecutive Length Contrast (Voice)

```
For each adjacent pair (s_i, s_{i+1}):
  contrast = |len(s_i) - len(s_{i+1})| / max(len(s_i), len(s_{i+1}))
Average across passage.
```

### D3: Terminal Shortness Detection (Voice)

Check if final 1-2 sentences are < 50% of passage mean length. Binary signal, weighted at 0.05-0.10 in voice composite.

### D4: Deviation-from-Norm Opacity Profile

Build a "transparent norm" from the gold set's transparent passages (Federal Register, Pittsburgh, Darbyshire, Lichtenstein). Compute per-feature statistics across these passages for:
- Sentence length distribution (mean, std)
- Word length distribution (mean, std)
- Punctuation density (mean, std)
- Function word frequency (mean, std)

**Feature normalization (required):** Before computing distance, Z-score normalize each feature: `z_i = (x_i - mean_i) / std_i`, where mean and std are computed across the full gold set (not just the transparent norm passages). Z-score normalization is preferred over min-max [0,1] because it handles outliers more gracefully — important given the gold set's range from Hemingway's fragments to Holmes's 200-word periodic sentences. Without normalization, the distance metric would be dominated by whichever feature has the largest absolute range (sentence length variance spans 0–200 while punctuation density spans 0–0.15).

For any new passage, compute Z-score normalized Euclidean distance from the transparent norm centroid. Passages far from the norm (in either direction — extreme simplicity or extreme complexity) score higher on opacity.

### D5: Suspension Marker List (Periodic, Pre-Ensemble)

Regex patterns for common periodic openings:
- Conditional: `^(If|When|Should|Were|Had|Provided that|Unless)\b`
- Participial: `^[A-Z][a-z]+(ing|ed)\b.*,`
- Fronted prepositions: 2+ prepositions before first finite verb
- Correlative: `not only...but also`, `neither...nor`, `whether...or`

These feed into the ensemble periodic scorer (Phase E).

**Phase D estimated effort:** 4-5 hours.

---

## Phase E: Periodic Sentence Ensemble

**Architectural change from v1:** Instead of a single main-verb-position heuristic, build an ensemble of separately calibrated components.

### E1: Left-Branching Index

Using POS-tagged finite verbs (from B4), compute:
```
leftBranchIndex = mainVerbWordPosition / totalSentenceWords
```
Values < 0.33 = running. Values > 0.67 = periodic.

### E2: Conservative Clause Splitter

Replace the current aggressive splitter (splits at every comma, semicolon, colon, dash) with a conservative version that only splits at:
- Semicolons and colons (always clause boundaries)
- Commas followed by coordinating conjunctions (and, but, or, so, yet)
- Commas preceded by a complete clause (has a finite verb before the comma)

List commas ("apples, oranges, and bananas") are NOT treated as clause boundaries.

### E3: Suspension Marker Score

From D5's regex list, compute suspension marker density per sentence. This is an independent periodic signal that does not depend on main-verb detection.

### E4: Ensemble Combination

**Initial weight estimates:**
```typescript
periodicRunningScore = weighted_combination(
  leftBranchIndex:       0.40,   // POS-informed verb position
  suspensionMarkers:     0.30,   // regex-based structural signals
  clauseSplitRatio:      0.20,   // conservative clause splitter result
  sentenceLengthSignal:  0.10,   // short sentences bias running
)
```

Each component is calibrated independently against the gold set to verify it has positive monotonicity on its own before inclusion.

**Weight validation (required):** The initial estimates above are a starting point, not final weights. Before finalizing, test at minimum three weight distributions against the gold set:

| Variant | leftBranch | suspension | clauseSplit | sentLength |
|---------|-----------|-----------|------------|-----------|
| Initial | 0.40 | 0.30 | 0.20 | 0.10 |
| Suspension-heavy | 0.25 | 0.45 | 0.20 | 0.10 |
| Verb-position-heavy | 0.50 | 0.20 | 0.20 | 0.10 |

Select the distribution that produces the best monotonicity on the gold set. This is a small grid search (same data, different coefficients, compare results) that costs almost no extra effort but protects against the initial guesses being correct by coincidence.

### E5: Re-Run Calibration (Gate)

Full protocol. Periodic monotonicity target: ≥0.550. Must validate with best-performing weight distribution from E4.

**Phase E estimated effort:** 4-6 hours. Depends on Phase B.

---

## Phase F: LLM Calibration Expansion (Tier 3)

### F1: Design Claude Rubric

Lanham-specific rubric per axis, including:
- Direct quotes from *Analyzing Prose* grounding each axis
- 3-4 labeled examples from the authoritative gold set as few-shot calibration
- **Structured output format:** Request categorical label, confidence score (0-1), and a justification field per axis — but do NOT rely on chain-of-thought-style reasoning traces as a design dependency. The justification field is for auditability and inter-source validation (F4), not for influencing the label itself. This keeps the calibration pipeline auditable without making opaque reasoning part of the system.

### F2: Curate 200-500 Diverse Prose Passages

Public domain sources spanning:
- Academic (humanities, social science, hard science)
- Legal (statutes, opinions, contracts)
- Literary (fiction, poetry, essay)
- Journalistic (news, opinion, features)
- Political (speeches, legislation, propaganda)
- Technical (manuals, documentation)
- Conversational (letters, transcripts, social media)

### F3: Run Claude-as-Judge

Batch API processing. Cost estimation: ~200-500 passages x ~2K tokens/passage x ~500 tokens/response = ~1.5M input + ~250K output tokens.

### F4: Inter-Source Validation

**New from review feedback.** Before trusting model labels for optimization:
1. Compare model-labeled distribution to authoritative gold set distribution per axis
2. Sample 20-30 passages for human review; compute model-human agreement **per axis**
3. Flag systematic biases (e.g., LLM verbosity bias → inflated voice scores)
4. Apply the 80% agreement threshold **per-axis**, not globally:
   - **≥80% agreement on an axis:** Full expansion set used for that axis in weight optimization
   - **76-79% agreement on an axis (borderline):** Expansion set included at 50% weight-factor for that axis — model labels contribute but do not dominate the optimization signal
   - **<76% agreement on an axis:** Expansion set excluded for that axis; optimization uses only the 40 authoritative gold passages

This prevents strong model-human agreement on five axes from being blocked by one borderline axis, while still down-weighting the signal from axes where the model is less reliable.

### F5: Cross-Validated Threshold Optimization

Using the validated expansion set:
- Split 80/20 train/test (stratified by genre)
- Optimize heuristic weights to maximize monotonicity on train set
- Validate on test set
- Final validation on the 40-passage authoritative set (hard holdout — never in training)

### F6: Document and Review

Publish full results before any production deployment.

**Phase F estimated effort:** 8-12 hours + API costs.

---

## Revised Execution Order

```
Phase A (3-4 hours) — sub-sequenced for safety:

  A-first (infrastructure + register fix):
    A1: Fix Tier 2 register labels
    A4: Formalize axis-level arbitration ← NEW, critical
    A5: Separate score/label benchmarking ← NEW
    A6: Genre-stratified calibration ← NEW
    A7: Failure-bucket regression tests ← NEW
    │
    ├── GATE: Re-run comparison with new test infrastructure.
    │         Verify register recovers, no other regressions.
    │
  A-second (parataxis fix):
    A2: Reduce parataxis inflation (graded evidence ladder)
    │
    ├── GATE: Re-run calibration. Verify parataxis improves
    │         overall + per-genre without new failure buckets.
    │
  A-third (opacity — cautious, staged):
    A3: Test opacity blend candidates against calibration suite.
         Unlock new blend ONLY if validated. Otherwise defer to Phase D.
  │
  ├── GATE: Full re-run. Document Phase A baselines.
  │
Phase B (4-6 hours)
  B1: Add POS tagger
  B2: Replace isVerb with POS tags
  B3: "That" disambiguation
  B4: Finite verb detection for periodic
  B5: Heylighen-Dewaele F-score
  B6: Re-run calibration (overall + per-genre + failure buckets)
  │
  ├── GATE: Document new baselines. Review before proceeding.
  │
Phase C (3-4 hours)
  C1: Register composite architecture
  C2: Embed AWL
  C3: Embed GSL/NGSL
  C4: Syllable counter
  C5: Re-run calibration
  │
Phase D (4-5 hours) — can overlap with C
  D1-D3: Voice metrics
  D4: Opacity norm profile
  D5: Suspension markers
  │
Phase E (4-6 hours) — depends on B
  E1-E4: Periodic ensemble
  E5: Re-run calibration
  │
  ├── GATE: Full calibration. Document results. Review.
  │
Phase F (8-12 hours) — only if targets not met
  F1-F6: LLM calibration expansion with inter-source validation
```

---

## Changes from v1

| Item | v1 | v2 | Reason |
|------|----|----|--------|
| Axis-level arbitration | Mentioned in recommendations | Phase A4 (required before Phase B) | Prevents Tier 2 from degrading whole-system quality during repair |
| Score/label separation | Not addressed | Phase A5 (new calibration requirement) | Register bug proved identical scores can yield catastrophic labels |
| Genre-stratified calibration | Not addressed | Phase A6: hard-gate groups with n≥3, watchlist groups with n<3 (not binding gates) | `general` genre masked behavior; hard enforcement on 1-passage groups would block useful changes on noise |
| Failure-bucket tests | Not addressed | Phase A7 (new regression suite) | Mechanistic failure modes need mechanistic tests |
| POS tagger framing | "Single keystone" | "POS backbone for mechanistic repairs" — hard prerequisite for B3/B4/B5 but not conceptual center of Tier 2; voice/opacity remain design+calibration problems post-POS | Infrastructure dependency, not a solution |
| Register architecture | lgr as primary signal | Composite: F-score + AWL + polysyllabic + lgr (demoted) + others | lgr too weak and threshold-sensitive to be primary |
| Parataxis weighting | "Reduce weights" | Graded evidence ladder: high-confidence cues at 1.0x, low-confidence at 0.3x, nesting bonus conditional on ≥1 high-confidence cue. **Single canonical rule** via shared helper used by both A2 heuristic and B3 POS-aware paths (spec consistency fix) | Avoids false-positive amplification, false-negative undercounting, AND conflicting rules between phases |
| Periodic architecture | Sequential improvements | Explicit ensemble with separately calibrated components | Periodicity is clustered, not single-rule detectable |
| LLM calibration | Use Claude with chain-of-thought, keep gold set as holdout | Structured justification + confidence fields (no CoT dependency); inter-source validation with **per-axis 80% threshold** (borderline 76-79% at 50% weight, <76% excluded) | Keeps calibration auditable; prevents one borderline axis from blocking five strong ones |
| Opacity reweighting | Hard reweight to base 0.30 / tacit 0.45 in one step | Staged calibration: test 3 blends, unlock only if validated overall + per-genre + failure-bucket | Prevents overfitting on weakest axis before cross-genre validation |
| Opacity D4 normalization | Euclidean distance (implicit scaling) | Z-score normalized Euclidean distance (explicit requirement); stats computed over full gold set | Features have different natural ranges; without normalization, sentence length would dominate |
| Periodic ensemble weights | Fixed initial estimates, "calibrate independently" | Initial estimates as starting point for 3-variant grid search; select best distribution before finalizing | Protects against initial guesses being correct by coincidence; trivial cost |
| Axis unlock criteria | Single aggregate monotonicity margin | Shadow mode first, then promotion after repeated wins across overall, per-genre (n≥3 hard, n<3 watchlist), and failure-bucket stability. periodicRunning starts in shadow mode despite +0.041 aggregate advantage | 40-passage sample too small for reliable small-margin comparisons; periodic still has running-bias (10/21 cases at ratio=1.0) |
| Phase A scope | 1-2 hours, 4 tasks | 3-4 hours, 7 tasks, sub-sequenced (infra+register → parataxis → cautious opacity) | Expanded infrastructure; staged opacity prevents premature commitment |
