# DECISIONS REGISTER — Laboratory Boredom section (v4, 2026-08-04)

Supersedes `DECISIONS-REGISTER-v3-2026-08-04.md`. Complete and standalone.
Version chain: supersede with `-v5-`, never edit in place.

**v4 banks the outline-walkthrough rulings of 2026-08-04: all five blocking decisions resolved, plus O-01, O-10,
a dissertation-wide spelling lock, and one new deferred work item.**

---

## 0. STYLE LOCKS — new, and they bind every file written from here

| # | Lock |
|---|---|
| **S-01** | **American spelling throughout — "center," never "centre"** (author, 2026-08-04). Taken as dissertation-wide, consistent with MLA and a US institution. The rule generalizes: *analyze* not *analyse*, *normalize* not *normalise*, *harmonize* not *harmonise*, *labeled* not *labelled*, *artifact* not *artefact*, *behavior* not *behaviour*, *recognize* not *recognise*. **Measured footprint in the v4 tree as of this date: 52 instances across generated `.md`/`.txt` artifacts and 76 in the `analysis/*.py` strings that produce them** — `centre` 29 / 26, `artefact` 8 / 11, `labelled` 5 / 7, `harmonis-` 3 / 8, `analyse`/`analysed` 3 / 17, `organis-` 2 / 1, `normalis-` 1 / 5, `recognis-` 1 / 1. Note that *analysis* is correct in American English and is not part of the sweep. Repaired in the v5 pass (X-07); prior-version documents are never edited, so they keep the British forms and that is expected. |

## 1. RULED — analysis scope and channel status

| # | Ruling |
|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed; inputs unknown. Appendix only. **Evidenced:** flat against self-report (rho −0.09 / +0.11, permutation p 0.65 / 0.60). |
| R-02 | **Heart rate and HRV removed entirely.** Measurement failed for some participants owing to facial/head structure. Appendix only. **Evidenced:** rho +0.09 / +0.04, permutation p 0.68 / 0.86. |
| R-03 | **IMU head motion — DEFERRED.** Not read. See X-05: the overlay route now supersedes this as the intended path to a head channel. |
| R-04 | **Video-derived head pose — DEFERRED.** See X-05. |
| R-05 | **Load-bearing channels:** pupil, eye closure, gaze, and the 7-item self-report. EEG reported as a full negative. |
| R-06 | **Equal focus on all three films.** The clinical-centered framing was an IRB/publication necessity. |
| R-07 | **Survey administered per episode**, in the break immediately after each film. |
| R-08 | **Boring stimulus** = a 17-minute section of a **1989 Microsoft Word tutorial**. Task-structured instructional content, not visually empty filler. |
| R-09 | **S04's `minutes until bored` on the boring film is VOID** — she did not know the item allowed 0 or not-applicable. Reclassified *never became bored*. |
| R-10 | **R2-03's split session dates**: ignore, do not report. |
| R-11 | **Overlay videos** in scope as corroborating material for later analysis, not as the foundation of any claim. **Extended by X-05.** |

## 2. RULED — data and method

| # | Ruling |
|---|---|
| D-01 | **Round 2 read from `_Crop` exclusively.** Raises `MissingCropError` if an original lacks a crop. Non-wear trimming retired. |
| D-02 | **`t_rel_s` is the session clock.** |
| D-03 | **Streams identified by filename**, not column count. |
| D-04 | **Gate re-baselined.** Round-1-only checks unchanged and bit-identical; the two pooled checks carry `rebaseline=True`. |
| D-05 | **Both Round 2 windows analyzed**: `full` (primary) and `r1matched`. |
| D-06 | **Composite A = pupil + eye closure** (primary). **Composite B = A + gaze** (within-round only). A is the cleaner instrument. |
| D-07 | **Version discipline.** Documents chain `-v1-`…`-v5-`; prior versions never edited. v1 analysis tree frozen. |
| D-08 | **CropEvents.json is metadata, not a data source.** |
| D-09 | **Criterion-validity p is a WITHIN-SUBJECT PERMUTATION p** — 20,000 shuffles of the three film labels inside each participant, fixed seed per test. Analytic values retained beside permutation values and never quoted as the result. |
| D-10 | **Spearman is the reported coefficient; Pearson computed alongside and reported in the appendix.** On all four load-bearing associations Pearson is the LARGER, so the reported figure is the conservative one. |
| **D-11** | **NEW — the openness surface is named EYE CLOSURE** (O-02 resolved, author 2026-08-04). One term, one definition, everywhere: *the proportion of the episode during which the eyes were shut*; for Round 1, *the proportion during which the eye tracker could not obtain a valid read of both eyes*, validated against Round 2's direct vendor measure at **Pearson r = 0.998** across twelve cells. Chosen over "eye openness" because the finding is about closing, because the memorable evidence is closure events (S05's 449.2 s, S08's 124.5 s), and because "the tracker could not see the eye" is a truthful description of a closure where "the eye was open by this fraction" is not a truthful description of a validity flag. **Consequence:** the surface enters the engaged composite with a negative sign; every table, figure and caption currently reads "eye openness" and is renamed in the v5 pass (X-07). |
| **D-12** | **NEW — gaze baselines: NEITHER is primary; each is assigned to the question it answers** (O-12 resolved, author 2026-08-04). Fixed forward (the round's own device axis, restoring the published `1 − X`) is the baseline for **stimulus separation**; per-file median is the baseline for **agreement with self-report**. Every gaze result names its baseline. Full log, justification, drafting-ready prose and anticipated objections: **`PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md`**. |
| **D-13** | **NEW — the two-questions distinction is introduced three times at increasing specificity** (O-13 resolved): as part of the methodology statement in the introduction, compactly restated in the method module, then applied without re-explanation at the criterion subsection. Rationale: the channels rank oppositely on the two questions, so a reader not told in advance reads half the results as failures. |
| **D-14** | **NEW — section structure is body plus appendix** (O-09 resolved). Body target ~30 pp, carrying the argument and the evidence that argues. A methods-and-limits appendix carries the technical detail, the full limit set, the existing criterion appendix and the per-participant matrix. **The literature module is capped at 4–5 pp maximum** — explicitly *not* the 8–10 pp the outline's own recommendation floated. |
| **D-15** | **NEW — the eye-only scope is accepted and made the section's methodological argument** (O-11 resolved). Stated plainly in the limits and again at the close: this study's evidence is ocular plus self-report. The argument it carries: the published headline rested on the noisiest instrument and did not survive reprocessing, while the strongest result in the corpus comes from the simplest possible measurement — whether the eye was shut. One well-understood channel plus an honest report, rigorously analyzed, outperforms a multi-channel apparatus analyzed loosely. **Qualified by X-05.** |
| **D-16** | **NEW — EEG framing** (O-01 resolved). Both halves are told, in this order: the channel was dropped for scaling, which is a decision about a research program; the reprocessing then established what it could have carried, which is nothing. The originality claim and the author's own account are reconciled thus: **agreement with self-report was asserted qualitatively in the published work and is computed here for the first time, per channel, with a clustering-corrected probability.** The two published sentences supporting this must be verified char-exact through archon before either enters prose. |
| **D-17** | **NEW — the three stimulus films are identified for the works cited** (O-10 resolved), from the published reference lists: boring = Whamtan, "THE MOST BORING VIDEO EVER MADE (Microsoft Word tutorial, 1989)," YouTube, 20 April 2014; interesting = The Why Files, "How to Build a Working UFO \| Alien Reproduction Vehicles (ARVs)," YouTube, 8 December 2022; clinical = UCI Virtual Reality, "Spinal Deformation," YouTube, 11 April 2022. |
| **D-18** | **NEW — van den Brink et al., "Pupil Diameter Tracks Lapses of Attention" (2016), is approved for citation**, from the otherwise-unindexed `corpus/AD(H)D/` folder. It anchors the reading of pupil as an index of attention and arousal rather than of boredom-as-reported, which is what the pupil null needs in order to read as an answer. No index entry required. |

## 3. ESTABLISHED — findings about the instrument

| # | Finding |
|---|---|
| F-01 | **Round 1 recorded in Unreal, Round 2 in Unity.** R1: X forward, Y horizontal, Z vertical. R2: Z forward, X horizontal, Y vertical. Confirmed from `eyetrackdatamapping_V3.m`. |
| F-02 | **The published gaze feature uses a FIXED FORWARD reference** (`1 − X`); the 2026 reimplementation substituted each file's own median, which removes sustained posture by construction. |
| F-03 | **Both rounds record gaze EYE-IN-HEAD, not head pose.** R2 combined gaze never exceeds 38.8°, zero samples beyond 50°; the overlay shows the head rolling ~90° and pitching far down while the gaze marker stays near frame center. |
| F-04 | **Head movement is where disengagement is visible and it is unmeasured in this pass.** The section must NOT claim the boring film produced stillness. |
| F-05 | **Round 1's window is the middle ~13.6 min** of the 17-minute film. Round 2's crop is essentially the whole film. |
| F-06 | **Round 2 closure is binary at source** — {0,1} only across 3,416,362 per-eye samples. |
| F-07 | **Round 1 blink sentinel is the vector (−1, +1, −1).** |
| F-08 | **The film started on "open your eyes" and stopped on "close your eyes."** The instructed closures ARE the stimulus boundaries. |
| **F-09** | **NEW — viewing order is very largely fixed and confounded with stimulus.** The published protocol set the order at interesting → clinical → boring, on the stated ground that early experiments showed the boring film raised exhaustion and degraded what followed. The archived data confirms it: **ten of twelve ran interesting → clinical → boring; S01 and S05 ran clinical → boring → interesting.** Derived from recording timestamps and validated against the three survey headings that state an order independently. |
| **F-10** | **NEW — the published 120 Hz is the sensor's rate, not Round 1's logging rate.** The 2024 paper states 120 Hz citing the vendor's developer documentation. Round 1's archived telemetry logs at a median 3.00 Hz; Round 2 is the first round in which every attached sensor polled and logged at 120 Hz. The published five-point rolling window therefore spans ~42 ms at the sensor's rate and ~1.5 s at Round 1's logging rate. Stated as a fact about logging, never as an error in the paper. |
| **F-11** | **NEW — the published gaze cohort cannot contain Round 2.** The 2024 paper's own access dates are January 2024; Round 2 was recorded March 2024. The published twelve and this analysis's twelve are two different twelves. |

## 4. FINDINGS from the v2/v3/v4 runs

| # | Finding |
|---|---|
| N-01 | **Criterion validity — the study's own validation logic.** gaze deviation rho +0.524 vs boredom (perm p 0.0074) and −0.527 vs engagement (0.0075); eye closure −0.460 (0.0212) and +0.416 (0.0370). **Pupil does not track self-report** (rho −0.17, perm p 0.40) though it separates the films powerfully. |
| N-02 | **Amplitude and frequency point opposite ways.** Frequency (departures >10°/min) *lower* on the boring film, 7/8 both contrasts, **Holm p = 0.047** — the first gaze result to survive correction. |
| N-03 | **The re-crop left eye closure completely unmoved** (11/12, F p = 0.0004, W p = 0.0010, rb −0.974). |
| N-04 | **Closure is window-invariant; pupil is cleaner on the matched window** (pooled F 0.097 → 0.017). |
| N-05 | **Composite A is cleaner than B.** Clinical: A = 8 / 4 / 0 / 0; B = 7 / 3 / 1 / 1. |
| N-06 | **Divergence concentrates on the clinical film** — 8/12 against 0 on boring. |
| N-07 | **The per-file-median gaze baseline correlates with self-report better than the restored fixed-forward one** (0.52 vs 0.36). Reported against prediction. **Now governed by D-12.** |
| N-08 | **The analytic p-values in the first criterion run were wrong.** Three associations that cleared alpha analytically do not clear it under permutation and are reported as non-significant. |
| N-09 | **Spearman and Pearson agree closely.** Median \|r − rho\| = 0.032, maximum 0.117. |
| N-10 | **The clustering correction applies to Pearson exactly as to Spearman.** |
| **N-11** | **NEW — the order confound has a partial internal control.** S01 and S05 saw the boring film second and the interesting film last, in the most-fatigued position, and in both the boring film still carried the lower eye-open fraction (S01 0.904 against 0.926; S05 0.212 against 0.852). S05's 449 s closure — the most extreme withdrawal in the corpus — occurred mid-session rather than at its end. Boring sits below interesting on this surface in **12 of 12**, so the effect is not carried by the out-of-order pair. **At n = 2 this is descriptive and does not dissolve the confound.** |
| **N-12** | **NEW — the two published studies cite one of the 55 indexed boredom units** (Raffaelli). Their lineage is the clinical-immersion engineering-education literature plus the vendor's developer documentation. The 2023 paper does cite phenomenology of VR — Morie; Heinzel and Heinzel; Tham et al. — as framing rather than as an interpretive frame for its own data. **Whether either observation enters the prose is N-02 in §6, still open.** |

## 5. DEFERRED

| # | Item | Condition |
|---|---|---|
| X-01 | IMU head motion | superseded in practice by X-05 |
| X-02 | Video head pose | superseded in practice by X-05 |
| X-03 | Further gaze-baseline sensitivity | partly discharged by D-12; see X-06 |
| X-04 | Extending `channel-correlation` to the v3 gaze columns | awaiting approval; changes an existing figure |
| **X-05** | **NEW — the overlay pass (author, 2026-08-04).** *If time permits*, use the gaze-overlay videos for **every participant × every film** to enhance the analysis with awareness of head movement and of where participants were actually looking. This is the intended route to a head channel and it supersedes the IMU rationale. **It changes nothing in the current claims and no current wording may anticipate it:** the section states the eye-only scope as this pass's scope (D-15), and the overlay work is named as the route beyond it. Twelve overlays plus `_Crop` CSVs and heatmaps already exist from the 2026-08-01 pipeline. |
| **X-06** | **NEW — add the per-participant gaze baseline to the criterion family** in the v5 pass. It was computed for the figure and never scored against self-report, and it produces the strongest directional separation of the three baselines on boring against interesting (8/8 in Round 1, 4/4 in Round 2), so its omission from the test that decided D-12 is a hole in that justification. Two additional tests; the permutation stage dominates runtime. Until it runs, the omission is stated in the prose. |
| **X-07** | **NEW — the v5 regeneration pass**, one run covering: (a) the three artifact defects — the composite misdescribed in `report.py:493`, `figures.py:656` and `crossref.py`'s docstring; the stale "1099–2430 s" durations in `figures.py:523` and `config.py:194`; the two empty enumerations and the "+nan trimmed" string; (b) the two gaze-caption defects — the amplitude/frequency caption blending baselines in one sentence, and its "10/12" pooled across rounds for a channel marked not poolable; (c) the **eye openness → eye closure** rename per D-11; (d) the **American spelling sweep** per S-01; (e) X-06. **Run after the outline walkthrough, before any caption is carried into the dissertation.** |

## 6. OPEN — awaiting the author (12)

| # | Question | Status |
|---|---|---|
| O-03 | The two ASEE works-cited entries and the co-author/participant surname overlap | at assembly |
| O-04 | **Within-episode time course** — computed, never reported. Run it into prose? *(Viewing order is no longer part of this question; F-09 made it a required disclosure.)* | open |
| O-05 | Per-participant matrix as an appendix, all three films | now shaped by D-14 — an appendix exists |
| O-06 | How much of the two published studies to re-present vs cite | now constrained by D-14's 4–5 pp cap |
| O-07 | Prior exposure as analytic variable or footnote | open |
| O-08 | How much statistical apparatus the rendered prose carries | largely settled by D-14; the body/appendix split needs specifics |
| O-14 | Multiplicity in the criterion family — recommendation is a footnote, not a computed correction | at drafting |
| O-15 | The IRB-facing wording of the survey-instrument description | at drafting |
| **N-01** | **Source acquisition** — 23 sources cited by the two published papers are absent from the corpus. Author is ingesting the most important as of 2026-08-04; **awaiting confirmation of what landed.** | in progress |
| **N-02** | **The two self-critical observations**, both about the author's own published work: whether L1.3 states in prose that the two papers cite one of the fifty-five indexed units, and whether L2.4 states the sampling-rate seam (F-10). Both accurate, both defensible as descriptions of where the work stood, both readable as self-indictment if the framing is off. | **open** |
| **N-04** | **Viewing-order presentation** — whether the findings module carries the confound together with the S01/S05 internal control (N-11), or whether the confound goes to the limits alone and the findings stay clean. | **open** |
| **N-05** | **Literature-module depth allocation** — which of the seven strands get worked prose and which are surveyed by citation, inside D-14's 4–5 pp. | **open, and next at the walkthrough** |

**Resolved since v3:** O-01 → D-16 · O-02 → D-11 · O-09 → D-14 · O-10 → D-17 · O-11 → D-15 · O-12 → D-12 ·
O-13 → D-13 · N-03 (AD(H)D) → D-18 plus the author's own indexing pass.

## 7. STANDING — unchanged

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted; no name in any output, log, figure, caption or
filename. The author may use names in conversation; they never reach a file.
Verification-gated: quotes char-exact before entering prose; **index entries first, then archon
(`docs search` → `docs verify-quote`, gate on `match_kind`), then the PDF**; backups before touching approved
files; **nothing committed without explicit sign-off**.
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never
"prove".
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for
channels that do not; anything n < 6 labeled descriptive; at n = 4 the signed-rank floor is p = 0.125.
Category caution: episodic structural grammar only, never a *Grundstimmung* claim. No learning-outcome claims.
