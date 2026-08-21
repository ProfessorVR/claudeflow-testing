# Lanham Improvement Plan — Final Calibration Report (Phases A-F)

**Date:** 2026-04-17
**Branch:** `writing-pipeline-v2`
**Gold Set:** 40 authoritative passages from Lanham's *Analyzing Prose*
**Expansion Corpus:** 217 passages from Project Gutenberg (209 successfully labeled by Claude Sonnet 4.6)

---

## Summary of Improvements

| Axis | Original Mono | Final Mono | Δ Mono | Original Agree | Final Agree | Δ Agree |
|------|-------------|-----------|--------|---------------|------------|---------|
| **nounVerb** | 0.590 | **0.732** | **+0.142** | 42.5% | **60.0%** | **+17.5%** |
| **voice** | 0.372 | 0.372 | +0.000 | 15.0% | **57.5%** | **+42.5%** |
| **register** | 0.574 | **0.673** | **+0.099** | 47.5% | 47.5% | +0.0% |
| **periodic** | 0.349 | **0.479** (T2) | **+0.130** | 45.0% | 45.0% | +0.0% |
| parataxis | 0.372 | 0.372 | +0.000 | 45.0% | 45.0% | +0.0% |
| opacity | 0.193 | 0.192 | -0.001 | 32.5% | 32.5% | +0.0% |

**Score quality (monotonicity):** 3 axes improved substantially (nounVerb +0.142, periodic +0.130, register +0.099). 3 axes unchanged.

**Label quality (agreement):** 2 axes improved dramatically via threshold calibration (voice +42.5%, nounVerb +17.5%). The voice improvement is the single largest gain across all phases — the old thresholds (0.30/0.70) were miscalibrated for actual voice score distributions.

---

## What Each Phase Contributed

### Phase A: Bug Fixes + Infrastructure
- **A1:** Fixed Tier 2 register catastrophic bug (40/40 mislabeled → 0 label diffs)
- **A2:** Graded subordination evidence ladder (14→6 parataxis label diffs between tiers)
- **A4:** Axis-level arbitration with shadow mode in controller
- **A5-A7:** Score/label separation, genre-stratified calibration, 6 failure-bucket tests

### Phase B: POS Backbone
- **B1:** en-pos POS tagger integrated (96.43% Penn Treebank accuracy)
- **B2:** POS-enhanced verb detection → nounVerb monotonicity +0.142
- **B3:** "that" disambiguation → Tier 2 demonstrative-that density 0.1176→0.0000
- **B4:** Finite verb detection for periodic analysis
- **B5:** Heylighen-Dewaele F-score → register monotonicity +0.099

### Phase C: Register Composite (Infrastructure Only)
- AWL word list (570 families), syllable counter, 7-signal composite architecture
- **Weights not adopted** — composite degraded register from 0.673 to 0.567
- Infrastructure retained for future calibration with larger dataset

### Phase D: Voice + Opacity Enhancement (Infrastructure Only)
- Sentence length entropy, consecutive contrast, terminal shortness
- Opacity deviation-from-norm with Z-score normalization
- Suspension marker detection
- **Weights not adopted** — voice degraded from 0.372 to 0.313
- Infrastructure retained for future calibration

### Phase E: Periodic Ensemble
- Left-branching index (POS-informed verb position)
- Conservative clause splitter (no list-comma splitting)
- Ensemble combination → T2 periodic monotonicity 0.390→0.479

### Phase F: LLM Calibration
- 217 passages collected from Project Gutenberg across 12 genres
- Claude Sonnet 4.6 labeled all passages on 6 axes
- F1 gate: Claude strongest on voice (5/5) and register (4/5)
- F2.5 ablation: Low anchoring on 4/6 axes; high anchoring on parataxis (29%) and opacity (21%)
- F4 trust: voice FULL, register FULL, nounVerb PARTIAL; parataxis/periodic/opacity EXCLUDED
- **F5 threshold calibration:** Voice thresholds shifted 0.30/0.70→0.10/0.31, improving agreement from 15%→57.5%. NounVerb thresholds shifted 0.35/0.65→0.58/0.85, improving agreement from 42.5%→60.0%.

---

## Key Findings

### 1. The biggest win was threshold calibration, not weight optimization
Voice agreement improved 42.5 percentage points by shifting label boundaries, with zero change to the underlying scores. The continuous voice scoring was always reasonable — the labels were wrong because the thresholds were miscalibrated for the actual score distribution.

### 2. Claude-as-judge is strongest on the axes where heuristics are weakest
Voice (5/5 F1 gate) and register (4/5) are Claude's strengths. These are also the axes where the heuristic approach has the widest gaps to target. This is the ideal complementarity for a Tier 3 system.

### 3. Structural axes resist both heuristic and LLM improvement
Parataxis (1/5 F1 gate, 29% anchoring) and periodicRunning (2/5 F1 gate) are unreliable for both the regex heuristics and Claude labeling. These axes likely require genuine syntactic parsing or human expert annotation.

### 4. Infrastructure outpaced calibration data
Phases C and D built substantial infrastructure (AWL, syllable counter, voice entropy, opacity deviation-from-norm) that degraded performance with hand-picked weights. These signals are available for future optimization but require a larger, human-validated calibration corpus to tune properly.

---

## Infrastructure Delivered

| Component | File | Status |
|-----------|------|--------|
| POS tagger (en-pos) | `lanham-shared.ts` | **Active** — used by B2-B5 |
| tagPOS(), isFiniteVerbTag(), isVerbTag(), isThatSubordinator() | `lanham-shared.ts` | **Active** |
| assessSubordinationEvidence() | `lanham-shared.ts` | **Active** — graded evidence ladder |
| computeFScore() (Heylighen-Dewaele) | `lanham-prose-analyzer.ts` | **Active** — 30% blend in register |
| AWL word list (570 families) | `data/academic-word-list.ts` | Available, not weighted |
| countSyllables() | `lanham-shared.ts` | Available, not weighted |
| sentenceLengthEntropy() | `lanham-shared.ts` | Available, not weighted |
| consecutiveLengthContrast() | `lanham-shared.ts` | Available, not weighted |
| terminalShortness() | `lanham-shared.ts` | Available, not weighted |
| opacityDeviationFromNorm() | `lanham-shared.ts` | Available, not weighted |
| suspensionMarkerDensity() | `lanham-shared.ts` | Available, not weighted |
| splitClausesConservative() | `lanham-shared.ts` | **Active** — used by periodic ensemble |
| Axis-level arbitration (AxisOverridePolicy) | `lanham-style-controller.ts` | **Active** — shadow mode for periodic |
| Score/label quality separation | `lanham-calibration.test.ts` | **Active** |
| Genre-stratified calibration (n≥3 hard gate) | `lanham-calibration.test.ts` | **Active** |
| 6 failure-bucket regression tests | `lanham-failure-buckets.test.ts` | **Active** |
| Periodic ensemble (left-branch + suspension + conservative splitter) | `advanced-lanham-analyzer.ts` | **Active** (shadow mode) |
| Calibrated thresholds (voice, nounVerb) | `lanham-style-policy.ts` | **Active** |

---

## What Remains

1. **Parataxis and opacity** need either genuine syntactic parsing or human expert calibration — neither heuristics nor LLM-as-judge are reliable
2. **Phase C/D composite weights** need a larger human-validated corpus (not LLM labels) to optimize
3. **Periodic shadow mode** should be promoted to active after the ensemble weights are confirmed with more data
4. **Register composite** should replace the current 70/30 F-score blend once weights are properly calibrated
5. **Voice and opacity targets** (0.75 and 0.70) may need revision — these are reader-response axes that may have a fundamental ceiling around 0.50-0.60 even with perfect calibration

---

## Test Suite Status

- 19/19 tests passing (13 unit + 6 failure-bucket)
- Backups at `.backups/lanham-phase-f-20260417-085622/`
