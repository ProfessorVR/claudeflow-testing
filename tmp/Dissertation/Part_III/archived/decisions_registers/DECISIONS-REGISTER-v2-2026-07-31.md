> # ⛔ SUPERSEDED — DO NOT USE
>
> **This document is archived history. It is NOT the current state and must not be
> read as instructions, quoted for numbers, or used to boot a session.**
>
> **Superseded by:** `DECISIONS-REGISTER-v3-2026-08-04.md`
> **Archived:** 2026-08-04 · **Reason:** predates D-09/D-10 and findings N-08 to N-10
>
> Retained only for rollback and audit. If you are an agent selecting a document to
> work from, STOP and use the superseded-by file above.

---

# DECISIONS REGISTER — Laboratory Boredom section (v2, 2026-07-31, end of session)

Supersedes `DECISIONS-REGISTER-v1-2026-07-31.md`. Complete and standalone.
Version chain: supersede with `-v3-`, never edit in place.

---

## 1. RULED — analysis scope and channel status

| # | Ruling |
|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed by the headset; inputs unknown. Appendix only. **Now evidenced:** flat against self-report (rho −0.09 boredom, +0.11 engagement, both n.s.). |
| R-02 | **Heart rate and HRV removed entirely.** Measurement failed for some participants owing to facial/head structure. Appendix only. **Now evidenced:** rho +0.09 / +0.04, both n.s. |
| R-03 | **IMU head motion — DEFERRED.** Not read this pass. Revisit after drafting. |
| R-04 | **Video-derived head pose — DEFERRED**, alongside the IMU. |
| R-05 | **Load-bearing channels:** pupil, eye openness/closure, gaze, and the 7-item self-report. EEG reported as a full negative. |
| R-06 | **Equal focus on all three films.** The clinical-centred framing was an IRB/publication necessity, not a dissertation constraint. |
| R-07 | **Survey administered per episode**, in the break immediately after each film. |
| R-08 | **Boring stimulus** = a 17-minute section of a **1989 Microsoft Word tutorial**. Task-structured instructional content, not visually empty filler. |
| R-09 | **S04's `minutes until bored` on the boring film is VOID** — she did not know the item allowed 0 or not-applicable. Reclassified *never became bored*. Applied in `config.VOID_SURVEY_ANSWERS`. |
| R-10 | **R2-03's split session dates**: ignore, do not report. |
| R-11 | **Overlay videos** in scope as corroborating material for later analysis, not as the foundation of any claim. |

## 2. RULED — data and method

| # | Ruling |
|---|---|
| D-01 | **Round 2 read from `_Crop` exclusively.** Raises `MissingCropError` if an original lacks a crop. Non-wear trimming retired. |
| D-02 | **`t_rel_s` is the session clock.** Retires the D4 timestamp-repair wrapper. |
| D-03 | **Streams identified by filename**, not column count. Closes the cognitive-load/HRV ambiguity permanently. |
| D-04 | **Gate re-baselined.** Round-1-only checks unchanged and bit-identical; the two pooled checks carry `rebaseline=True` and report without aborting. |
| D-05 | **Both Round 2 windows analysed**: `full` and `r1matched` (120 s off each end). `full` is primary. |
| D-06 | **Composite A = pupil + eye openness** (primary). **Composite B = A + gaze** (v3, within-round only). |
| D-07 | **Version discipline.** Documents chain `-v1-`, `-v2-`, `-v3-`; prior versions never edited. v1 analysis tree frozen. |
| D-08 | **CropEvents.json is metadata, not a data source.** |

## 3. ESTABLISHED — findings about the instrument

| # | Finding |
|---|---|
| F-01 | **Round 1 recorded in Unreal, Round 2 in Unity.** Round 1: X = forward, Y = horizontal, Z = vertical (up +). Round 2: Z = forward, X = horizontal, Y = vertical. Confirmed by `eyetrackdatamapping_V3.m` (Das 2023), which plots Y horizontal, Z vertical, and scatters (Y,Z) on a 16:9 screen. |
| F-02 | **The published gaze feature uses a FIXED FORWARD reference** — `1 − X`, i.e. 1 − cos θ, then a 5-point median filter. The 2026 reimplementation substituted each file's own median, which removes sustained posture by construction. |
| F-03 | **Both rounds record gaze EYE-IN-HEAD, not head pose.** Round 2 `cgaze` never exceeds 38.8° and has zero samples beyond 50°; Round 1 sits in the same envelope. The overlay confirms it: the head rolls ~90° and pitches far down while the gaze marker stays near frame centre. |
| F-04 | **Head movement is where disengagement is visible and it is unmeasured this pass.** The section must NOT claim the boring film produced stillness. |
| F-05 | **Round 1's window is the middle ~13.6 min** of the 17-minute film (~2 min cut inside each 30 s instructed closure as a sync guard). Round 2's crop is essentially the whole film. |
| F-06 | **Round 2 openness is binary at source** — {0,1} only across 3.4 M per-eye samples. |
| F-07 | **Round 1 blink sentinel is the vector (−1, +1, −1)** — Y's sentinel is positive. |
| F-08 | **The film started on "open your eyes" and stopped on "close your eyes."** The instructed closures ARE the stimulus boundaries, so the crop window is the stimulus interval minus 5 s / 2 s guards. |

## 4. NEW FINDINGS from the v2/v3 runs

| # | Finding |
|---|---|
| N-01 | **Criterion validity — never run before.** Gaze deviation is the best single predictor of self-report (rho +0.52 boredom, −0.53 engagement). Eye openness second (−0.46 / +0.42). **Pupil does not track self-report at all** (p=0.32) though it separates the films powerfully. Two different questions; keep them apart. |
| N-02 | **Amplitude and frequency point opposite ways.** Amplitude (how far off centre) is higher on the boring film and tracks self-report. Frequency (departures >10°/min) is *lower* on the boring film, 7/8, **Holm p=0.047** — the first gaze result to survive correction. Fewer, longer departures when bored; frequent short repositioning when engaged. Matches the author's zombie-stare vs engaged-focus account. |
| N-03 | **The re-crop left eye openness completely unmoved** (11/12, F p=0.0004, W p=0.0010, rb −0.974). Pupil's omnibus weakened (0.046→0.097), pairwise strengthened (0.0093→0.0049). |
| N-04 | **Openness is window-invariant; pupil is cleaner on the matched window** (pooled F 0.097 → 0.017, 10/12 → 11/12). |
| N-05 | **Composite A is cleaner than B on the keystone.** Clinical: A gives 8 divergent / 4 both-engaged / 0 both-bored / 0 inverse; B gives 7/3/1/1. |
| N-06 | **Divergence concentrates on the clinical film** — 8/12, against 0 on boring. Safe form: *the eyes place clinical with interesting and away from boring; the survey places it nearer boring.* |
| N-07 | **Against prediction:** the per-file-median baseline correlates with self-report *better* than the restored fixed-forward one (0.52 vs 0.36). Both computed and labelled. |

## 5. DEFERRED

| # | Item | Condition |
|---|---|---|
| X-01 | IMU head motion | after drafting, if time permits |
| X-02 | Video head pose (panel tracking, panel-visibility fraction) | as above |
| X-03 | Further gaze-baseline sensitivity | v4 if needed |

## 6. OPEN — awaiting the author

| # | Question |
|---|---|
| O-01 | **The EEG framing.** Author's account (cross-validation completed against self-report, then dropped for scaling) vs the current "too noisy" ruling. Does the N=8 non-replication get told alongside? |
| O-02 | **Naming the openness surface.** One term, one definition. Round 1's is a validity proxy, Round 2's a vendor channel. |
| O-03 | **The two ASEE works-cited entries** and the co-author/participant surname overlap. |
| O-04 | **Within-episode time course** and **viewing order** — computed, never reported. Run them? |
| O-05 | **Per-participant matrix as an appendix**, all three films. |
| O-06 | **How much of P1/P2 to re-present** vs cite. |
| O-07 | **Prior exposure** as analytic variable or footnote. |
| O-08 | **How much statistical apparatus** the rendered prose carries. |
| O-09 | **Section length and module weighting.** |
| O-10 | **The boring film's exact title/source** for the works cited. |
| O-11 | Accept as a stated limit that Round 1 measures the eye only. |
| O-12 | **NEW: which gaze baseline is primary** — per-file median (better criterion validity) or fixed forward (faithful to the published definition). Both computed. |
| O-13 | **NEW: how to present the two-questions distinction** — stimulus separation vs agreement with self-report — since pupil and gaze rank oppositely on them. |

## 7. STANDING — unchanged

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted; no name in any output, log, figure, caption or filename.
Verification-gated: quotes char-exact before entering prose; index entries first, then PDFs; backups before touching approved files; **nothing committed without explicit sign-off**.
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never "prove".
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for channels that do not; anything n<6 labelled descriptive.
Category caution: episodic structural grammar only, never a *Grundstimmung* claim. No learning-outcome claims.
