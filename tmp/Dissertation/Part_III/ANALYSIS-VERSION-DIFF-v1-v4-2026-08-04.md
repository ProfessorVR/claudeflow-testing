# Analysis version chain — what changed and what moved (v1 → v4, 2026-08-04)

Supersedes `archived/version_diffs/ANALYSIS-VERSION-DIFF-v1-v2-v3-2026-07-31.md`. Four complete, independently
runnable trees. v1 is frozen; nothing in it was edited.

| version | tree | what it is |
|---|---|---|
| **v1** | `archived/analysis_trees/boredom-analysis-2026-07-30/` | the original N=12 analysis, **FROZEN** |
| **v2** | `archived/analysis_trees/boredom-analysis-v2-2026-07-31/` | re-cropped Round 2 + channel rulings + two windows + criterion tests |
| **v3** | `archived/analysis_trees/boredom-analysis-v3-2026-07-31/` | v2 + gaze rebuilt in degrees against fixed forward + composite B + 6 new figures |
| **v4** | `boredom-analysis-v4-2026-08-04/` | **CURRENT.** v3 + criterion p-values corrected to permutation + Pearson alongside + generated appendix |

| | tables | figures | artefacts |
|---|---|---|---|
| v1 | 23 | 65 | 7 |
| v2 | 25 | 65 | 7 |
| v3 | 27 | 71 | 7 |
| **v4** | **27** | **72** | **8** (adds `APPENDIX-CRITERION-VALIDITY.md`) |

---

## 1. The continuity proof

Round 1 is untouched across all four versions, and the gate proves it. The two Round-1-only
locked checks return **bit-identical** in v2, v3 and v4:

| check | v1 | v2–v4 |
|---|---|---|
| Round 1 pupil | 8/8, F p=0.0302, W p=0.0078, rb −1.000 | identical |
| Round 1 eye-closure | 7/8, F p=0.0076, W p=0.0156, rb −0.944 | identical |

Every number that moved, moved because of the re-crop, a ruling, or the statistical correction.

## 2. What the re-crop did (v1 → v2)

Gate 1 runs the pre-crop parser and Gate 2 the crops, so the difference isolates the re-crop.

| pooled check | pre-crop | re-cropped | verdict |
|---|---|---|---|
| **eye-closure** | 11/12, F 0.0004, W 0.0010, rb −0.974 | **identical** | unmoved |
| **pupil** | 10/12, F 0.0458, W 0.0093, rb −0.821 | 10/12, F **0.0970**, W **0.0049**, rb **−0.872** | omnibus weaker, pairwise stronger |

The headline eye-closure result is completely insensitive to the window.

## 3. Holm survivors (v4, 99 physiological contrasts)

| surface | scope | pair | n | Holm p | rb | direction |
|---|---|---|---|---|---|---|
| eye openness | POOLED N=12 | BORvINT | 12 | 0.0015 | −1.000 | 12/12 |
| eye openness | POOLED N=12 | BORvCLC | 12 | 0.0020 | −0.974 | 11/12 |
| pupil dilation | POOLED N=12 | BORvCLC | 12 | 0.0146 | −0.872 | 10/12 |
| eye openness | R1-unified | BORvINT | 8 | 0.0234 | −1.000 | 8/8 |
| pupil dilation | R1-unified / R1-asis | BORvCLC | 8 | 0.0234 | −1.000 | 8/8 |
| eye openness | R1-unified | BORvCLC | 8 | 0.0313 | −0.944 | 7/8 |
| **excursions >10° per min** | **R1 fixed-forward** | **BORvCLC** | 8 | **0.0469** | −0.889 | 7/8 |
| **excursions >10° per min** | **R1 fixed-forward** | **BORvINT** | 8 | **0.0469** | −0.944 | 7/8 |

The last two are new in v3 and are the first gaze result in this study ever to survive
correction.

## 4. Criterion validity — CORRECTED IN v4

The test the study's own logic required and nobody had run. Each instrument scored against
what participants themselves reported: within-subject z on both sides, 36 paired episodes
from 12 participants.

**v3 reported analytic p-values. Those were wrong** — the 36 points are 12 participants
contributing 3 films each, and within-subject centring makes the dependence structural, so
the analytic p assumes an independence the design does not have. v4 reports a **within-subject
permutation p** (20,000 shuffles of the film labels inside each participant, fixed seed per
test). The analytic value is retained beside it.

| channel | vs boredom (rho, perm p) | vs engagement (rho, perm p) |
|---|---|---|
| **gaze deviation median** | **+0.524, 0.0074** | **−0.527, 0.0075** |
| **eye openness** | **−0.460, 0.0212** | **+0.416, 0.0370** |
| gaze deg from centre (v3) | +0.359, 0.0751 | −0.391, 0.0515 |
| % time beyond 10° (v3) | +0.324, 0.1114 | −0.334, 0.0990 |
| pupil dilation | −0.172, 0.4037 | +0.036, 0.8608 |
| gaze deviation variance | −0.114, 0.5675 | +0.106, 0.6073 |
| cognitive load *(appendix)* | −0.092, 0.6516 | +0.107, 0.5954 |
| HR *(appendix)* | +0.088, 0.6774 | +0.036, 0.8647 |

**What moved between v3 and v4.** The coefficients did not — rho is descriptive and does not
depend on the independence assumption, and the ranking of channels is identical. **Three
associations lost significance:**

| test | analytic p (v3) | permutation p (v4) |
|---|---|---|
| gaze deg from centre vs boredom | 0.0317 | **0.0751** |
| gaze deg from centre vs engagement | 0.0183 | **0.0515** |
| % time beyond 10° vs engagement | 0.0465 | **0.0990** |

The four headline associations survive comfortably. The inflation is **not uniform**: roughly
3–8× where associations are strong and barely 1.1× where they are weak, so the distortion was
largest exactly where a reader would lean on it hardest.

**How the error was found.** Not by review — it surfaced while walking the calculation through
step by step in response to a question about how the numbers were produced.

## 5. Spearman against Pearson — the v4 appendix

Both coefficients are now computed for every test, and both receive the permutation
correction.

- **Median |r − rho| = 0.032**, maximum 0.117. The two agree closely, so the monotonic
  relationship is also close to linear and the rank test costs almost nothing in power.
- **On all four load-bearing associations Pearson is the LARGER in magnitude** — +0.574 vs
  +0.524, −0.577 vs −0.460, −0.590 vs −0.527, +0.530 vs +0.416. Reporting Spearman understates
  the association and overstates its probability. That answers a charge of statistic-shopping
  directly.
- **The clustering correction applies to Pearson exactly as to Spearman**, which shows it is a
  property of the design rather than an artefact of ranking.
- One borderline case runs the other way and is reported as such: gaze degrees from centre vs
  engagement, permutation p 0.052 under Spearman and 0.048 under Pearson. Treated as
  non-significant — the conservative reading — with both values printed.

Generated artefact: `APPENDIX-CRITERION-VALIDITY.md`. Figure:
`figures/cross-cutting/criterion-validity-appendix`.

## 6. Amplitude and frequency point opposite ways

- **Amplitude** — how far off centre the eye sits — higher on the boring film, and the
  component that tracks self-report.
- **Frequency** — departures beyond 10° per minute — **lower** on the boring film, 7/8,
  Holm p=0.047.

Fewer, longer departures when bored; frequent short repositioning when engaged. The measurable
form of the zombie-stare versus engaged-focus distinction.

## 7. The keystone, all three films

**Composite A** = pupil + eye openness (primary, after the cognitive-load ruling):

| film | divergent | both engaged | both bored | inverse |
|---|---|---|---|---|
| Boring | 0 | 0 | **9** | 3 |
| **Clinical** | **8** | 4 | 0 | **0** |
| Interesting | 3 | 5 | 2 | 2 |

**Composite B** (adding gaze) gives 7/3/1/1 on clinical — A is the cleaner instrument.

Safe form, immune to the objection that the composite is partly a boring-detector: **the eyes
place the clinical film with the interesting one and away from the boring one; the survey
places it nearer the boring end.**

## 8. Window comparison

| surface | full crop | Round-1-matched |
|---|---|---|
| eye openness, pooled | F p=0.000431, 11/12 and 12/12 | **identical** |
| pupil, pooled | F p=0.0970, 10/12, rb −0.872 | F p=**0.0169**, **11/12**, rb **−0.897** |

Openness is window-invariant. Pupil is cleaner on the matched window.

## 9. Everything else that changed

- **S04's void answer** reclassified as never-became-bored. Ten of twelve became bored on the
  boring film, all within five minutes, three inside one minute.
- **Non-wear trimming retired**; **IMU not read**; **HR, HRV, cognitive load** to the appendix.
- **Streams identified by filename**; **`t_rel_s` as the session clock**.
- **Sensitivity sweep** keeps cognitive load in its space so the appendix shows every subset.
- **Six new figures in v3**, a seventh in v4 (`criterion-validity-appendix`).

## 10. Carried forward, unchanged

EEG remains a full negative: 0 of 5 surfaces at Friedman p<0.05, 0 of 15 contrasts through
Holm, concordance 4/8, retention 62.3%. S05's 449.2 s closure and S08's 124.5 s stand. Prior
exposure still answers the objection. Felt duration dilated in 25/36 episodes with no stimulus
separation. **Nothing is committed.**
