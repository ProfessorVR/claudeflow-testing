> # ⛔ SUPERSEDED — DO NOT USE
>
> **This document is archived history. It is NOT the current state and must not be
> read as instructions, quoted for numbers, or used to boot a session.**
>
> **Superseded by:** `ANALYSIS-VERSION-DIFF-v1-v4-2026-08-04.md`
> **Archived:** 2026-08-04 · **Reason:** covers only v1-v3; its criterion p-values are the uncorrected analytic ones
>
> Retained only for rollback and audit. If you are an agent selecting a document to
> work from, STOP and use the superseded-by file above.

---

# Analysis version chain — what changed and what moved (2026-07-31)

Three complete, independently runnable trees. v1 is frozen; nothing in it was edited.

| version | tree | what it is |
|---|---|---|
| **v1** | `boredom-analysis-2026-07-30/` | the original N=12 analysis, **frozen** |
| **v2** | `boredom-analysis-v2-2026-07-31/` | re-cropped Round 2 + the channel rulings + two windows + criterion tests |
| **v3** | `boredom-analysis-v3-2026-07-31/` | v2 + gaze rebuilt in degrees against fixed forward + composite B |

Each carries 65 figures, its own `FINDINGS.md`, `METHODS.md`, `QC-REPORT.md`,
`EXCLUSIONS.log`, `RUN-MANIFEST.json`, `SOURCES.md`, `RECONCILIATION.md`.

---

## 1. The continuity proof

Round 1 is untouched across all three versions, and the gate proves it rather than
asserting it. The two Round-1-only locked checks return **bit-identical** in v2 and
v3:

| check | v1 | v2 | v3 |
|---|---|---|---|
| Round 1 pupil | 8/8, F p=0.0302, W p=0.0078, rb −1.000 | identical | identical |
| Round 1 eye-closure | 7/8, F p=0.0076, W p=0.0156, rb −0.944 | identical | identical |

So every number that moved, moved because of the re-crop or a ruling — not drift.

## 2. What the re-crop did to the two pooled checks

Gate 1 still runs the pre-crop Round 2 parser and Gate 2 runs the crops, so the
difference between them isolates the effect of the re-crop exactly.

| pooled check | pre-crop (Gate 1) | re-cropped (Gate 2) | verdict |
|---|---|---|---|
| **eye-closure** | 11/12, F p=0.0004, W p=0.0010, rb −0.974 | **11/12, F p=0.0004, W p=0.0010, rb −0.974** | **unmoved** |
| **pupil** | 10/12, F p=0.0458, W p=0.0093, rb −0.821 | 10/12, F p=**0.0970**, W p=**0.0049**, rb **−0.872** | omnibus weaker, pairwise stronger |

The headline eye-closure result is completely insensitive to the window. Pupil's
pairwise contrast improved and its omnibus weakened.

## 3. Holm survivors

v3 computes 99 physiological contrasts; 9 survive Holm.

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

The last two are new in v3 and are the first gaze result in this study ever to
survive correction.

## 4. Criterion validity — the test that had never been run

Each instrument scored against what the participants themselves said, on
within-subject z of both sides, Spearman, 36 episodes.

| channel | vs boredom | p | vs engagement | p |
|---|---|---|---|---|
| **gaze deviation median** (per-file baseline) | **+0.524** | **0.0011** | **−0.527** | **0.0009** |
| **eye openness** | **−0.460** | **0.0048** | **+0.416** | **0.0115** |
| **gaze degrees off centre** (v3, fixed forward) | **+0.359** | **0.0317** | **−0.391** | **0.0183** |
| % time beyond 10° off centre (v3) | +0.324 | 0.0536 | −0.334 | 0.0465 |
| pupil dilation | −0.172 | 0.316 | +0.036 | 0.836 |
| gaze deviation variance | −0.114 | 0.507 | +0.106 | 0.538 |
| excursion rate >10°/min (v3) | −0.082 | 0.633 | +0.184 | 0.282 |
| cognitive load *(appendix)* | −0.092 | 0.594 | +0.107 | 0.533 |
| HR *(appendix)* | +0.088 | 0.622 | +0.036 | 0.839 |

Three things follow.

**Gaze is the best single predictor of what participants reported**, on both
items, and it is the only channel exceeding |rho| = 0.5. The construct — distance
from a comfortable centred position — is vindicated by the criterion that matters.

**Pupil does not track self-report at all** (p=0.32). It separates the films
strongly and agrees with the person weakly. Those are different questions and the
section must keep them apart.

**Cognitive load and HR are flat against both items**, which is the ruling
evidenced rather than asserted.

## 5. Amplitude and frequency point opposite ways — and both are real

The two components of the construct behave differently, and the split matches the
author's own observational account of zombie stare versus engaged focus.

- **Amplitude** — how far off centre the eye sits — is **higher** on the boring
  film (10/12 vs clinical under fixed forward) and is what tracks self-reported
  boredom.
- **Frequency** — how often the eye departs beyond 10° — is **lower** on the
  boring film, 7/8 against both other films, Holm p=0.047 in Round 1.

Fewer, longer departures on the boring film; more frequent, shorter repositioning
on the engaging ones. A single "gaze variance" number cannot distinguish those,
which is why the published feature was ambiguous.

**Unexpected result, reported against my own prediction:** the per-file-median
baseline correlates with self-report *better* than the restored fixed-forward one
(0.524 against 0.359). The fixed-forward version is the faithful restoration of the
published definition and exposes sustained posture, which the per-file version
removes by construction — but on the criterion test it is the weaker of the two.
Both are computed and labelled; neither is hidden.

## 6. The keystone, all three films, both composites

**Composite A** = pupil + eye openness (primary, after the cognitive-load ruling):

| film | divergent | both engaged | both bored | inverse |
|---|---|---|---|---|
| Boring | 0 | 0 | **9** | 3 |
| **Clinical** | **8** | 4 | 0 | **0** |
| Interesting | 3 | 5 | 2 | 2 |

**Composite B** = A + gaze (v3, within-round only — gaze is not poolable):

| film | divergent | both engaged | both bored | inverse |
|---|---|---|---|---|
| Boring | 0 | 0 | 9 | 3 |
| Clinical | 7 | 3 | 1 | 1 |
| Interesting | 3 | 5 | 2 | 2 |

Composite A is the cleaner instrument on the clinical film: eight divergent, and
**zero** cases in either off-diagonal cell. Adding gaze reintroduces one of each.
The hypothesis that B would be the stronger indicator is not supported for the
keystone, though gaze remains the best single channel against self-report.

Divergence is concentrated on the clinical film — 8 of 12, against 0 on boring.
Stated safely, and immune to the objection that the composite is partly a
boring-detector: **the eyes place the clinical film with the interesting one and
away from the boring one; the survey places it nearer the boring end.**

## 7. Window comparison

| surface | full crop | Round-1-matched |
|---|---|---|
| eye openness, pooled | F p=0.000431, 11/12 and 12/12 | **identical** |
| pupil, pooled | F p=0.0970, 10/12, rb −0.872 | F p=**0.0169**, **11/12**, rb **−0.897** |

Openness is window-invariant. Pupil is **cleaner** on the matched window, which
removes the first and last two minutes — the settling-in and wind-down.

## 8. Everything else that changed

- **S04's void answer** reclassified as never-became-bored. Ten of twelve became
  bored on the boring film, all within five minutes, three inside one minute.
- **Non-wear trimming retired** — the crops exclude headset on/off by construction.
- **IMU not read** — deferred; also removes ~1.3 GB of I/O per run.
- **HR, HRV, cognitive load** out of the analysis, into the appendix.
- **Streams identified by filename**, not column count.
- **`t_rel_s` as the session clock**, retiring the timestamp-repair wrapper.
- **Sensitivity sweep** keeps cognitive load in its space so the appendix can show
  every subset, while the primary composite excludes it.

## 9. Carried forward, unchanged

EEG remains a full negative: 0 of 5 surfaces at Friedman p<0.05, 0 of 15 contrasts
through Holm, concordance 4/8, retention 62.3%. S05's 449.2 s closure and S08's
124.5 s stand. Prior exposure still answers the objection. Nothing is committed.
