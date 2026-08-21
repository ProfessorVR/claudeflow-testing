# EXECUTION DOCUMENT — Boredom Experiment, full eye-tracking analysis (N=12)

**Written 2026-07-30 for a dedicated Fable session. Dissertation-grade: every number that reaches the dissertation
must be reproducible from a logged run.** Nothing in here is drafting; this is analysis + figure generation.

**Revision 2026-07-30 (later):** S08's Clinical crop was supplied and the Round 1 pipeline re-run. All 24 cells
are now crop-windowed, the fallback path is retired, and every correctness-check figure was re-verified. See the
window rule in §2 and the refreshed figures in §4.

**Model note (2026-07-30):** run this on **Opus 5**. Fable 5's safeguards flag physiological-signal reporting
(EEG / pupillometry / HR) as a false positive in its biology category — it fires on the *assistant's own output*, not
on the prompt, so it would interrupt repeatedly in an analysis whose entire job is reporting those results. Verified
by bisection: a bare "read this document" prompt passed, and the flag landed on the summary Fable produced from it.
Nothing about the task requires a specific model.

---

## 0. Purpose

Analyse **all** eye-tracking data now that the collection is complete — Round 1 (N=8) and Round 2 (N=4), **12 subjects
total** — together with the per-subject survey instrument, cross-referencing self-report against physiology, and
against EEG where it exists.

**Author framing ruling (2026-07-30):** the dissertation will state that **EEG was ultimately dropped because it was
too noisy, and the eye tracking was definitive enough.** EEG is therefore analysed as a **corroborating cross-check
only** — it must still be run where available, so the claim that it was too noisy is *evidenced* rather than asserted,
but no finding may rest on it. Report EEG's retention rate, SNR and non-significance as the justification for
dropping it.

---

## 1. Cohort — and the one rule that must never be broken

| | Round 1 | Round 2 |
|---|---|---|
| subjects | **S01–S08** | **R2-01–R2-04** |
| eye sampling | bursty/bimodal, **~3.3 Hz median / ~5.7 Hz mean** effective | **uniform 120.0 Hz** (verified) |
| format | headerless 12-column aggregate CSV | raw Omnicept SDK, header-bearing, per-sensor files |
| EEG | 3 × `.mat` per subject | **none** |
| HRV | present (vendor) | **none** |
| eye openness | **validity-flag proxy** | **continuous per-eye openness** |

**THE RULE: never silently pool a rate-dependent feature across rounds.** Verified 2026-07-29: recomputing the
identical gaze-variance feature on Round 2 decimated from 120 Hz to Round 1's effective rate changes its value by a
factor of **0.65–0.84**. Variances, dispersions and any windowed statistic are rate-dependent. **Means** (pupil,
cognitive load, HR, openness fraction) are far more robust and may be pooled **with the caveat stated in the output**.
Every pooled statistic must carry a `poolable: true/false` field and a one-line justification in the log.

Labels: keep `S01–S08` and `R2-01–R2-04` distinct. Do **not** renumber Round 2 as S09–S12.

---

## 2. PER-SUBJECT FILE MANIFEST

Root paths:
- **R1** = `/mnt/d/PhD/Dissertation/Boredom Experiment/Subjects/<subject>/`
- **R2** = `/mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2/Subjects/<subject>/`
- **ETD** = `…/Boredom Experiment Round 2/EyeTrackingDatasets/EyeTrackingDatasets/`
- **LOGS** = `…/Boredom Experiment Round 2/VR Data Recorder/Data Logs/`

Subject folders are person-named on disk. **Derive Sxx / R2-xx from sorted folder order at runtime**
(`scripts/boredom-o9/common.py :: subject_map()`); never write a name into any output, log, figure, caption or
filename.

### Round 1 — 8 subjects

| Subject | HMD CSV (of which crop) | EEG `.mat` | Images `.fig` | Survey | Notes |
|---|---|---|---|---|---|
| S01 | 6 (3 crop) | 3 | 21 | 1 | |
| S02 | 6 (3 crop) | 3 | 21 | 1 | |
| S03 | 6 (3 crop) | 3 | **35** | 1 | `.fig` set contains md5-identical flat + nested duplicates → dedupe to 21; one crop is `.xlsx` |
| S04 | 6 (3 crop) | 3 | 21 | 1 | |
| S05 | 6 (3 crop) | 3 | 21 | 1 | **BOR eye validity 21.2%** — the sleep episode; keep, do not discard as bad data |
| S06 | 6 (3 crop) | 3 | 21 | 1 | HMD runs ~88–125 Hz — the Round-1 rate outlier; flag in every rate-sensitive statistic |
| S07 | **7** (4 crop) | 3 | **14** | 1 | duplicate `Boring_Crop 2.csv` → use the plain `_Crop`; **INT physiological capture failed although the session ran** |
| S08 | **6** (3 crop) | 3 | 21 | 1 | Clinical crop **supplied 2026-07-30**, pipeline re-run; heavy HR dropout |

**WINDOW RULE — CROP ONLY, NO FALLBACK (ruled 2026-07-30).** Every one of the 24 Round 1 cells now has a genuine
`_Crop` file, so the analysis reads **crop windows exclusively**. The full-window fallback in `ch_hmd.py`
(`path = info["crop"] or info["full"]`) must **not** be exercised: if a crop is ever absent, **fail loudly and log it**
rather than substituting the full recording. Two crop-resolution rules still apply — prefer the plain `_Crop` over a
`_Crop 2`-style duplicate (S07 Boring), and read the `.xlsx` crop where that is the only form (S03 Clinical).

**Clinical crop durations, for reference and as a window-uniformity check** — S01 733.0 · S02 908.7 · S03 803.8 ·
S04 849.5 · S05 737.0 · S06 823.5 · S07 878.5 · S08 891.4 s. Mean 828.2 s, range 733.0–908.7. Any future crop landing
outside roughly ±2 sd of its stimulus's cohort mean should be flagged before use, not silently accepted.

### Round 2 — 4 subjects

| Subject | eye (32-col) | IMU (16-col) | cognitive-load (8-col) | HR (7-col) | Survey | Notes |
|---|---|---|---|---|---|---|
| R2-01 | 3 | 2 | 6 | 3 | 1 | **INT has a corrupted timestamp span** → use `median_hz`, never `mean_hz`; no IMU for INT |
| R2-02 | 3 | 2 | 5 | 2 | 1 | no video/survey at root (survey now in folder); **BOR has no usable HR**; BOR gaze validity 70.0% |
| R2-03 | 3 | 2 | 6 | 3 | 1 | **INT session runs 40.5 min** vs the usual 18–22; no IMU for INT |
| R2-04 | 3 | **3** | 6 | 3 | 1 | complete |

### Supporting sets
- **ETD — 12 curated eye CSVs** (4 subjects × 3 stimuli), single uniform header, verified 120 Hz. **Cross-check these
  against the `Subjects/` copies; if identical, prefer `Subjects/` so subject↔stimulus attribution comes from the
  folder rather than a filename.**
- **LOGS — 16 session folders, 3 marked `_Test`.** These are the recorder's raw output; 43 of 70 non-empty CSVs
  duplicate the organised copies, **27 do not**. **Reconcile before treating `Subjects/` as complete.** The `_Test`
  sessions are rehearsals (one verified: 8 min 45 s of a 17-min stimulus, dated two weeks early) — **exclude from the
  cohort, report as instrument validation.**
- **Out of scope (author-ruled):** all `.mkv` / `OBS` video. Do not process.

---

## 3. ANALYSIS CATEGORIES

### A. Eye tracking — the primary channel
1. **Eye openness / closure** ← *treat as a headline surface, not QC*. Round 2: continuous per-eye `openness`.
   Round 1: the validity flag as proxy (**validated r = +0.998 against Round 2's continuous measure**). Report
   mean openness, % time closed, and closure-episode count/duration.
2. **Pupil dilation** — per-eye and bilateral mean; mask on quality flag and non-positive sentinel.
3. **Gaze deviation variance** — P2's feature: Euclidean distance of combined gaze from the per-file **median** gaze
   direction, then a **5-point centred rolling median** (`min_periods=1`); variance = sd². **Per round, never pooled.**
4. **Gaze dispersion / fixation stability** — supplementary.
5. **Blink rate and inter-blink interval** — derived from openness/validity transitions.
6. **Within-episode time course** — first / middle / last third for every channel above; onset dynamics.

### B. Arousal / workload
7. **Cognitive load** (vendor index; Round 2 also has its sd).
8. **HR** (both rounds) and **HRV** (Round 1 only). Mask `0` and negative vendor sentinels **before** any aggregate.
9. **IMU head motion** (Round 2 only, 9 of 12 sessions) — accelerometer + gyro magnitude as a restlessness measure.
   *This supersedes the abandoned video-based approach; it measures the head, not the image.*

### C. Survey / self-report — the 7-item instrument, both rounds
10. Per stimulus: fatigue-prior · **boredom (1–9)** · **engagement (1–9)** · minutes-until-bored · sleep-fight ·
    **felt duration** · fatigue-after.
11. **Felt-duration dilation ratio** (felt ÷ 17 min actual).
12. **Within-instrument divergence** — boredom *and* engagement both high (the S07 signature). Boredom and engagement
    are asked as **two separate items, not a bipolar axis**; that design choice is what makes divergence visible.
13. **Depletion** — fatigue-after minus fatigue-prior.
14. **Viewing order** — Round 1 encodes it in the stimulus headings (e.g. "Interesting (3rd)", "Clinical (First
    video)"). Extract it; it is a real order/carryover covariate.
15. **Demographics — Round 2 only**: age, major, year, ethnicity, first-generation status, gender, and
    **previous experience with medical footage**. That last item is a *direct* measure of the prior-exposure variable
    that Round 1 could only proxy via the `(Med)` medical-student marker. Use it as the moderator; report
    descriptively only (n=4).

**Parser warning:** the surveys are free-text with inconsistent formatting — `a. 2`, `a.6`, `a. 20 min`, `a. NA`,
`5 min (fell asleep)`, `"1 hour"`. Parse defensively, emit a per-item confidence flag, and **dump every unparsed or
coerced value to the log for manual review**. Never silently coerce.

### D. Cross-referencing — the analytical core
16. **The keystone at N=12** — physiology-engaged vs self-report-bored on the **clinical** stimulus. Now testable for
    all 12 subjects (all four Round-2 surveys located 2026-07-30). Report the **per-subject decomposition**:
    divergent / concordant-engaged / concordant-bored / **reverse** (Round 1 + Round 2 so far show **zero** reverse
    cases — check whether that holds at N=12; the asymmetry is a stronger claim than the mean).
17. **Prior-experience moderation** — Round 2's explicit item + Round 1's `(Med)` proxy. Round 1 result to replicate
    or overturn: the strata were **indistinguishable on clinical (boredom 6.00 vs 6.00)**.
18. **EEG × eye-tracking concordance** (Round 1 only) — run it, report retention (~60%), SNR and non-significance,
    **then drop it per the framing ruling.**
19. **Round 1 vs Round 2 replication** — which effects reproduce across instrument generations. Known: Boring's
    profile replicates closely (gaze variance **+0.21 in both rounds**); **clinical's position does not** — in Round 2
    *Interesting* is the engaged extreme.

### E. Per-subject case profiles
20. Narrative profile for **each of the 12**, plus explicit treatment of the load-bearing cases: **S07**
    (within-instrument divergence), **S05** (sleep-collapse; 21.2% eye validity on BOR — the sleep event is directly
    visible), **S04** (inversion), **S03** (extremity). Identify any new cases in Round 2.

---

## 4. STATISTICAL PLAN

- Within-subject design. **Friedman** omnibus across the three stimuli, **Wilcoxon signed-rank** pairwise,
  **Holm** correction across the pairwise family. Effect size = **matched-pairs rank-biserial**.
- Report **within-subject z-scores** (each subject's stimulus scored against their own three-video mean) for
  cross-channel comparison, and **raw units** for interpretation. Both.
- **Small-N honesty is mandatory.** At n=4 the Wilcoxon floor is p=0.125, so perfect separation is the strongest
  obtainable result — say so wherever it applies. Label every n<6 result **descriptive**.
- **Standing reporting rule (do not soften in either direction):** the evidence is the **directional convergence
  across channels plus the specific surfaces that reach significance** — never per-channel significance for channels
  that do not.
- **Known results to reproduce as a correctness check** — a run that does not reproduce these has a bug.
  **All four re-verified 2026-07-30 against the corrected S08 Clinical crop and are unchanged:**
  - Round 1 pupil: **8/8 Boring<Clinical, Friedman p=0.0302, Wilcoxon p=0.0078, rb=−1.00**
  - Round 1 eye-closure: **7/8 Boring lowest, Friedman p=0.0076, Wilcoxon p=0.0156, rb=−0.94**
  - Pooled pupil N=12: **10/12, Friedman p=0.0458, Wilcoxon p=0.0093, rb=−0.82**
  - Pooled eye-closure N=12: **11/12, Friedman p=0.0004, Wilcoxon p=0.0010, rb=−0.97**

  **Secondary values that MOVED at the re-run** (all non-significant before and after — none crossed threshold; use
  these, not the older figures): Round 1 cognitive load Friedman **p=0.4169** (was 0.6065) · Round 1 HR
  Boring-vs-Clinical **p=0.5469** (was 0.4609) · pooled cognitive load **p=0.4724** (was 0.3385) · pooled HR n=10,
  Wilcoxon **p=0.4316**. Round 1 gaze variance (p=0.6065) and HRV (p=0.6065) unchanged.

  **Refreshed Round 1 z-table** (three cells moved by ≤0.03): gaze variance BOR **+0.22** / CLC **−0.23** / INT
  **0.00**; cognitive load CLC **+0.35** / INT **−0.16**. EEG DMN, parietal alpha and pupil unchanged.

  *Historical trap, retained as a warning: the earlier fallback era required the **unfiltered** pivot, because
  filtering to crop-window rows dropped S08 and turned pupil's 8/8 into 7/7. Under the crop-only rule above the
  distinction disappears — all 24 cells are crop — but a filter that drops whole subjects remains the failure mode to
  watch for.*

---

## 5. LOGGING & REPRODUCIBILITY — dissertation grade

Every run must emit, without exception:

1. **`RUN-MANIFEST.json`** — UTC timestamp, git commit, Python version, library versions (numpy/pandas/scipy/
   matplotlib), the exact interpreter path, every input file's **size + md5 + redacted label** (never a name), row
   counts read, and every parameter used.
2. **`METHODS.md`** — generated **from the run, not hand-written**: for each derived quantity, the formula, the
   masking rules applied, the window used, the sample count surviving each filter. This is the text the methods
   section is built from, so it must be complete enough that a reader could reimplement from it alone.
3. **`EXCLUSIONS.log`** — every row, file, subject-stimulus cell or survey item dropped or coerced, **with the
   reason**. Silent exclusions are the failure mode this document exists to prevent.
4. **`QC-REPORT.md`** — per subject × stimulus: sampling rate (mean **and** median), duration, validity %, retention
   %, sentinel counts, format variant, and every flag from §2.
5. **Figure provenance** — every figure writes its underlying data to a sibling `.csv` with the same stem, and every
   figure carries a caption stub naming n, test, statistic and effect size.
6. **Determinism** — fixed seeds, sorted iteration order, no wall-clock dependence. Two runs must produce
   byte-identical CSVs.
7. Interpreters (PATH trap — use absolute paths): `/home/dalton/.venv/bin/python` for pandas-only work;
   `/home/dalton/.pyenv/versions/3.11.9/bin/python3` for anything needing scipy/torch/cv2.

---

## 6. VISUALIZATION SUITE

**Requirement (author, 2026-07-30): per-subject figures AND all-subjects-combined figures, for each video set.**
Every figure: colour-blind-safe palette, consistent stimulus colours across the whole suite (BOR / CLC / INT fixed),
readable at print size, vector **PDF** + **PNG**, and a caption stub stating n, test and effect size.

### 6a. Per subject — one set for each of the 12
- **Subject summary card** — all channels for that subject across the three stimuli on one page: openness, pupil,
  gaze deviation, cognitive load, HR (+ IMU for Round 2), with the subject's own self-report ratings overlaid.
- **Per-stimulus time series** — each channel over the episode, three panels (BOR / CLC / INT) sharing an axis, with
  eye-closure episodes shaded.
- **Self-report vs physiology panel** — that subject's boredom/engagement ratings beside their physiological z-scores,
  so a reader can see divergence or concordance for that individual.
- **Felt vs actual duration** for that subject's three episodes.

### 6b. All subjects combined — one set per video set (BOR, CLC, INT)
- **Distribution per channel** — violin or box with **every individual subject plotted as a point**, Round 1 and
  Round 2 distinguished by marker.
- **Paired-difference (slope) plot** — one line per subject between stimuli, which is the honest visual for a
  within-subject design.
- **Cohort time-series envelope** — median with interquartile band across subjects, per stimulus.

### 6c. Cross-cutting — the significance figures
- **Forest plot of effect sizes** across all channels, with the significance threshold marked — the single figure that
  shows which surfaces carry the result.
- **The keystone scatter** — physiological engagement composite (x) against self-reported boredom (y), one point per
  subject-stimulus, clinical highlighted; the divergent quadrant labelled.
- **Per-subject keystone decomposition** — divergent / concordant-engaged / concordant-bored / reverse, as a
  categorical strip, N=12.
- **Eye-closure heatmap** — subject × time, faceted by stimulus. This should make S05's sleep episode visible at a
  glance.
- **Round 1 vs Round 2 replication plot** — the same statistic in both rounds, to show what reproduces and what does
  not.
- **Felt-duration dilation** — felt vs actual across all 24+12 episodes, with the 17-minute line marked.
- **Channel correlation matrix** — including the openness↔validity r=0.998 check that licenses the Round 1 proxy.
- **EEG justification figure** — retention rate and SNR per subject, the figure that earns the sentence "EEG was
  dropped because it was too noisy."

---

## 6b. CODE ORGANISATION — resolved 2026-07-30

**Build a fresh `analysis/` tree with one deterministic entry point that IMPORTS the existing feature functions.
Do not modify, refactor or duplicate `scripts/boredom-o9/`.**

Rationale: `scripts/boredom-o9/` is the **methodology of record** — the Round 1 results in the dissertation were
produced by it, and the four correctness-check figures in §4 are defined against its behaviour. Editing it would
invalidate the check it exists to provide. Copying its functions instead forks the definitions and guarantees drift.
Importing keeps one definition of every feature while allowing the new orchestration, pooling logic, survey parsing
and figure generation to live in new code.

Concretely:
- `analysis/run.py` — the single entry point. Deterministic, no wall-clock dependence, sorted iteration, fixed seeds.
- Import from `scripts/boredom-o9/` (`common.subject_map`, the feature/statistics helpers in `ch_hmd.py`,
  `ch_stats.py`, `ch_eeg.py`, `ch_fig.py`) rather than reimplementing. If a helper is not importable as written,
  **wrap it — do not edit it** — and record the wrapper in `METHODS.md`.
- `boredom-o9-processing/ch_hmd_r2.py` (the Round 2 parser) may be moved into `analysis/` or imported in place;
  it is this project's own work, not the methodology of record, so it may be extended.
- Any new shared helper goes in `analysis/`, never back into `scripts/boredom-o9/`.

## 7. DELIVERABLES

1. `analysis/` — scripts, one entry point, deterministic.
2. `out/` — tidy-long + wide feature tables, per round and pooled, with `poolable` flags.
3. `figures/` — the full suite of §6, PDF + PNG + sibling data CSVs.
4. `RUN-MANIFEST.json` · `METHODS.md` · `EXCLUSIONS.log` · `QC-REPORT.md`.
5. `FINDINGS.md` — every result with n, test, statistic, effect size, and an explicit poolability statement.
6. A short **reconciliation note** on the `LOGS` tree (the 27 non-duplicate CSVs) and the `_Test` sessions.

---

## 8. GATES AND STANDING DOCTRINE

- **PII (permanent):** `S01–S08` / `R2-01–R2-04` only. No real name in any output, log, figure, caption or filename.
  The name→label crosswalk is **never persisted**; derive it at runtime from sorted folder order.
- **O-10 (resolved 2026-07-29):** under the governing IRB protocol all findings are reportable **except the subject's
  name**. The per-subject matrix may be reported label-keyed.
- **Verification-gated:** nothing is committed without the author's explicit sign-off. Back up before touching any
  existing approved file.
- **Category caution:** episodic structural grammar only — **never** a *Grundstimmung* claim.
- **No learning-outcome claims** anywhere.
- Existing canonical sources: `scripts/boredom-o9/` (Round 1 pipeline, methodology of record) ·
  `boredom-o9-processing/ch_hmd_r2.py` (Round 2 parser) ·
  `reanalysis/boredom-o9-physiological-findings.md` · `reanalysis/boredom-round2-recon-2026-07-29.md` ·
  `reanalysis/boredom-experiment-brief.md`.
