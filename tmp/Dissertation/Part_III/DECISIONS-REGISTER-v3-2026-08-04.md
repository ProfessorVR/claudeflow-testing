# DECISIONS REGISTER — Laboratory Boredom section (v3, 2026-08-04)

Supersedes `archived/decisions_registers/DECISIONS-REGISTER-v2-2026-07-31.md`. Complete and standalone.
Version chain: supersede with `-v4-`, never edit in place.

---

## 1. RULED — analysis scope and channel status

| # | Ruling |
|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed; inputs unknown. Appendix only. **Evidenced:** flat against self-report (rho −0.09 / +0.11, permutation p 0.65 / 0.60). |
| R-02 | **Heart rate and HRV removed entirely.** Measurement failed for some participants owing to facial/head structure. Appendix only. **Evidenced:** rho +0.09 / +0.04, permutation p 0.68 / 0.86. |
| R-03 | **IMU head motion — DEFERRED.** Not read. Revisit after drafting. |
| R-04 | **Video-derived head pose — DEFERRED**, alongside the IMU. |
| R-05 | **Load-bearing channels:** pupil, eye openness/closure, gaze, and the 7-item self-report. EEG reported as a full negative. |
| R-06 | **Equal focus on all three films.** The clinical-centred framing was an IRB/publication necessity. |
| R-07 | **Survey administered per episode**, in the break immediately after each film. |
| R-08 | **Boring stimulus** = a 17-minute section of a **1989 Microsoft Word tutorial**. Task-structured instructional content, not visually empty filler. |
| R-09 | **S04's `minutes until bored` on the boring film is VOID** — she did not know the item allowed 0 or not-applicable. Reclassified *never became bored*. |
| R-10 | **R2-03's split session dates**: ignore, do not report. |
| R-11 | **Overlay videos** in scope as corroborating material for later analysis, not as the foundation of any claim. |

## 2. RULED — data and method

| # | Ruling |
|---|---|
| D-01 | **Round 2 read from `_Crop` exclusively.** Raises `MissingCropError` if an original lacks a crop. Non-wear trimming retired. |
| D-02 | **`t_rel_s` is the session clock.** Retires the D4 timestamp-repair wrapper. |
| D-03 | **Streams identified by filename**, not column count. |
| D-04 | **Gate re-baselined.** Round-1-only checks unchanged and bit-identical; the two pooled checks carry `rebaseline=True`. |
| D-05 | **Both Round 2 windows analysed**: `full` (primary) and `r1matched`. |
| D-06 | **Composite A = pupil + eye openness** (primary). **Composite B = A + gaze** (within-round only). A is the cleaner instrument. |
| D-07 | **Version discipline.** Documents chain `-v1-`…`-v4-`; prior versions never edited. v1 analysis tree frozen. |
| D-08 | **CropEvents.json is metadata, not a data source.** |
| **D-09** | **NEW — criterion-validity p is a WITHIN-SUBJECT PERMUTATION p** (20,000 shuffles of the three film labels inside each participant, fixed seed per test). The analytic p assumes independence the design does not have: 36 paired points are 12 participants × 3 films, and within-subject centring makes the dependence structural. Analytic values retained beside permutation values. |
| **D-10** | **NEW — Spearman is the reported coefficient; Pearson is computed alongside and reported in the appendix.** Rank chosen for robustness, not for result: on all four load-bearing associations Pearson is the LARGER, so the reported figure is the conservative one. |

## 3. ESTABLISHED — findings about the instrument

| # | Finding |
|---|---|
| F-01 | **Round 1 recorded in Unreal, Round 2 in Unity.** R1: X = forward, Y = horizontal, Z = vertical. R2: Z = forward, X = horizontal, Y = vertical. Confirmed from `eyetrackdatamapping_V3.m` (Das 2023). |
| F-02 | **The published gaze feature uses a FIXED FORWARD reference** (`1 − X`); the 2026 reimplementation substituted each file's own median, which removes sustained posture by construction. |
| F-03 | **Both rounds record gaze EYE-IN-HEAD, not head pose.** R2 `cgaze` never exceeds 38.8°, zero samples beyond 50°; R1 in the same envelope; the overlay shows the head rolling ~90° and pitching far down while the gaze marker stays near frame centre. |
| F-04 | **Head movement is where disengagement is visible and it is unmeasured this pass.** The section must NOT claim the boring film produced stillness. |
| F-05 | **Round 1's window is the middle ~13.6 min** of the 17-minute film. Round 2's crop is essentially the whole film. |
| F-06 | **Round 2 openness is binary at source** — {0,1} only across 3.4 M per-eye samples. |
| F-07 | **Round 1 blink sentinel is the vector (−1, +1, −1)** — Y's sentinel is positive. |
| F-08 | **The film started on "open your eyes" and stopped on "close your eyes."** The instructed closures ARE the stimulus boundaries. |

## 4. FINDINGS from the v2/v3/v4 runs

| # | Finding |
|---|---|
| N-01 | **Criterion validity — the study's own validation logic, never run before.** Corrected values: gaze deviation rho +0.524 vs boredom (perm p 0.0074) and −0.527 vs engagement (perm p 0.0075); eye openness −0.460 (0.0212) and +0.416 (0.0370). **Pupil does not track self-report at all** (rho −0.17, perm p 0.40) though it separates the films powerfully. Two different questions; keep them apart. |
| N-02 | **Amplitude and frequency point opposite ways.** Amplitude higher on the boring film and tracks self-report; frequency (departures >10°/min) *lower*, 7/8, **Holm p=0.047** — the first gaze result to survive correction. Matches the author's zombie-stare vs engaged-focus account. |
| N-03 | **The re-crop left eye openness completely unmoved** (11/12, F p=0.0004, W p=0.0010, rb −0.974). Pupil omnibus weakened, pairwise strengthened. |
| N-04 | **Openness is window-invariant; pupil is cleaner on the matched window** (pooled F 0.097 → 0.017). |
| N-05 | **Composite A is cleaner than B.** Clinical: A = 8 divergent / 4 both-engaged / 0 both-bored / 0 inverse; B = 7/3/1/1. |
| N-06 | **Divergence concentrates on the clinical film** — 8/12 against 0 on boring. Safe form: *the eyes place clinical with interesting and away from boring; the survey places it nearer boring.* |
| N-07 | **The per-file-median gaze baseline correlates with self-report better than the restored fixed-forward one** (0.52 vs 0.36). Reported against prediction; both computed. |
| **N-08** | **NEW — the analytic p-values in the first criterion run were wrong.** Found while explaining the calculation, not by review. Clustering inflates them 3–8× where associations are strong and barely at all where they are weak, so the distortion is largest exactly where a reader leans hardest. **Three associations that cleared alpha analytically do not clear it under permutation** — gaze degrees from centre vs boredom (0.032→0.075) and vs engagement (0.018→0.052), and % time beyond 10° vs engagement (0.047→0.099). All three now reported as non-significant. The four headline associations survive comfortably. |
| **N-09** | **NEW — Spearman and Pearson agree closely.** Median \|r − rho\| = 0.032, maximum 0.117. On all four load-bearing associations Pearson is the larger in magnitude, so the rank statistic is the conservative report. One borderline case runs the other way and is reported as such: gaze degrees from centre vs engagement, perm p 0.052 Spearman against 0.048 Pearson — treated as non-significant. |
| **N-10** | **NEW — the clustering correction applies to Pearson exactly as to Spearman**, which demonstrates it is a property of the design rather than an artefact of ranking. |

## 5. DEFERRED

| # | Item | Condition |
|---|---|---|
| X-01 | IMU head motion | after drafting, if time permits |
| X-02 | Video head pose (panel tracking, panel-visibility fraction) | as above |
| X-03 | Further gaze-baseline sensitivity | v5 if needed |
| X-04 | Extending `channel-correlation` to the v3 gaze columns | small; changes an existing figure, so awaiting approval |

## 6. OPEN — awaiting the author

| # | Question |
|---|---|
| O-01 | **The EEG framing.** Your account (cross-validation completed against self-report, then dropped for scaling) vs the current "too noisy" ruling. Does the N=8 non-replication get told alongside? |
| O-02 | **Naming the openness surface.** One term, one definition. |
| O-03 | **The two ASEE works-cited entries** and the co-author/participant surname overlap. |
| O-04 | **Within-episode time course** and **viewing order** — computed, never reported. Run them? |
| O-05 | **Per-participant matrix as an appendix**, all three films. |
| O-06 | **How much of P1/P2 to re-present** vs cite. |
| O-07 | **Prior exposure** as analytic variable or footnote. |
| O-08 | **How much statistical apparatus** the rendered prose carries. |
| O-09 | **Section length and module weighting.** |
| O-10 | **The boring film's exact title and source** for the works cited. |
| O-11 | Accept as a stated limit that Round 1 measures the eye only. |
| O-12 | **Which gaze baseline is primary** — per-file median (better criterion validity) or fixed forward (faithful to the published definition). Both computed. |
| O-13 | **How to present the two-questions distinction** — stimulus separation vs agreement with self-report — since pupil and gaze rank oppositely on them. |
| **O-14** | **NEW — multiplicity in the criterion family.** The criterion tests are currently reported as a family of descriptive associations with no Holm or FDR column. My recommendation is to keep it that way and justify it in a footnote rather than compute a correction and then argue against it. Marked `******` in the prose statement. |
| **O-15** | **NEW — the IRB-facing wording** of the survey-instrument description, if the method module restates it. Marked `******` in the prose statement. |

## 7. STANDING — unchanged

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted; no name in any output, log, figure, caption or filename. The author may use names in conversation; they never reach a file.
Verification-gated: quotes char-exact before entering prose; index entries first, then PDFs; backups before touching approved files; **nothing committed without explicit sign-off**.
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never "prove".
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for channels that do not; anything n<6 labelled descriptive.
Category caution: episodic structural grammar only, never a *Grundstimmung* claim. No learning-outcome claims.
