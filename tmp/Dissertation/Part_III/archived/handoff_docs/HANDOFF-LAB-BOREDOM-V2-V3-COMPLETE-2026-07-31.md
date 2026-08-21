> # ⛔ SUPERSEDED — DO NOT USE
>
> **This document is archived history. It is NOT the current state and must not be
> read as instructions, quoted for numbers, or used to boot a session.**
>
> **Superseded by:** `HANDOFF-LAB-BOREDOM-V4-COMPLETE-2026-08-04.md`
> **Archived:** 2026-08-04 · **Reason:** predates the v4 tree and the criterion-validity statistical correction; its criterion p-values are the uncorrected analytic ones
>
> Retained only for rollback and audit. If you are an agent selecting a document to
> work from, STOP and use the superseded-by file above.

---

# HANDOFF — Laboratory Boredom section: analyses v2 and v3 COMPLETE, drafting not started (2026-07-31)

**Supersedes `HANDOFF-LAB-BOREDOM-ANALYSIS-AND-SECTION-2026-07-30.md` for current status.**
That file remains accurate for the overall goal, the arc ruling, the four gating decisions,
the FCM keystone revision, and the doctrine — read it for background, this one for state.

**Status in one line: three complete analysis trees exist (v1 frozen, v2, v3), every ruling
from this session is applied and evidenced, the outline is still STALE, and no prose is drafted.**

---

## 0. If you are reading this after a power loss

Nothing is committed to git, and `tmp/` is **not tracked**, so git offers no protection here.
The session's work is protected by an archive on a second physical drive:

```
/mnt/d/PhD/Dissertation/_SESSION-BACKUPS/LAB-BOREDOM-SESSION-FINAL-20260804-104929.tar.gz
md5 99790909ce14ab378fa32d745c5b361b        (current — includes v4 and the prose statement)
```

It contains all three analysis trees, both registers, this handoff, the boot prompt, the
version diff, the reanalysis notes, the drafts folder, the prior handoff and the stale
outline. An earlier archive (`…-20260731-224424.tar.gz`) sits beside it and predates the six new
v3 figures — prefer the newer one. To restore:

```bash
cd /home/dalton/projects/claudeflow-testing/tmp/Dissertation
md5sum /mnt/d/PhD/Dissertation/_SESSION-BACKUPS/LAB-BOREDOM-SESSION-FINAL-20260804-104929.tar.gz
tar xzf /mnt/d/PhD/Dissertation/_SESSION-BACKUPS/LAB-BOREDOM-SESSION-FINAL-20260804-104929.tar.gz
```

Verify first with `md5sum`. `scripts/boredom-o9/` is the methodology of record, is committed,
and was **never edited** — `git status --porcelain scripts/boredom-o9/` returns empty.

---

## 1. What this session did

Started from the finished N=12 analysis (v1). The author then issued a series of rulings and,
mid-session, **re-cropped the entire Round 2 dataset**, which invalidated half the analysis.
Two new analysis trees were built and run to completion.

### 1a. Author rulings issued this session
Full list in `DECISIONS-REGISTER-v2-2026-07-31.md`. The load-bearing ones:

- **Cognitive load, heart rate, HRV, IMU head motion: removed from the analysis**, appendix only.
- **Equal focus on all three films** — the clinical-centred framing was an IRB necessity, not a
  dissertation constraint.
- **Round 2 re-cropped**; read `_Crop` files exclusively, mirroring Round 1.
- **Version discipline**: v1/v2/v3 chains, prior versions never edited.
- **S04's `minutes until bored`** on the boring film is void.
- **Head movement deferred** until after drafting.

### 1b. Instrument findings established by investigation
These were discovered, not assumed, and several overturn earlier beliefs:

- **Round 1 was recorded in Unreal, Round 2 in Unity**, so the axis conventions differ.
  Round 1: X = forward, Y = horizontal, Z = vertical. Round 2: Z = forward, X = horizontal,
  Y = vertical. Confirmed from the original MATLAB (`V:\Production_Storage\MATLAB\eyetrackdatamapping_V3.m`).
- **The published gaze feature uses a fixed forward reference** (`1 − X`); the 2026
  reimplementation substituted each file's own median, which removes sustained posture.
- **Both rounds record gaze EYE-IN-HEAD, not head pose.** Confirmed three ways: Round 2's
  `cgaze` never exceeds 38.8° across millions of samples; Round 1 sits in the same envelope;
  and the overlay video shows the head rolling ~90° and pitching far down while the gaze
  marker stays near frame centre.
- **The film started on "open your eyes" and stopped on "close your eyes,"** so the instructed
  closures are the stimulus boundaries and the crop window is the stimulus interval.
- **Round 1's window is the middle ~13.6 min** of a 17-minute film; Round 2's is the whole of it.

---

## 2. The three trees

| version | path | state |
|---|---|---|
| **v1** | `tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/` | **FROZEN.** Do not edit or re-run. 23 tables, 65 figures, 8 artefacts. |
| **v2** | `tmp/Dissertation/Part_III/boredom-analysis-v2-2026-07-31/` | complete. 25 tables, 65 figures. Re-crop + rulings + two windows + criterion tests. |
| **v3** | `tmp/Dissertation/Part_III/boredom-analysis-v3-2026-07-31/` | complete. 27 tables, 71 figures. v2 + gaze rebuilt in degrees + composite B. |
| **v4** | `tmp/Dissertation/Part_III/boredom-analysis-v4-2026-08-04/` | **complete and CURRENT.** 27 tables, **72 figures**, + `APPENDIX-CRITERION-VALIDITY.md`. Criterion p-values corrected to within-subject permutation; Pearson computed alongside Spearman. |

Run any tree with:

```bash
cd tmp/Dissertation/Part_III/boredom-analysis-v4-2026-08-04/analysis
/home/dalton/.venv/bin/python run.py                # tables + figures + artefacts
/home/dalton/.venv/bin/python run.py --no-figures   # faster
```

**Read `ANALYSIS-VERSION-DIFF-v1-v2-v3-2026-07-31.md` for the full comparison** — it is the
document that makes the version chain useful, with every number that moved and why.

### What changed in the code
- `adapters.r2_collect` — crop-only, filename-based stream identification, raises
  `MissingCropError` rather than falling back. HRV recognised in order to be rejected.
- `adapters.r2_time_seconds` — uses `t_rel_s`; the D4 timestamp repair is now a fallback.
- `r2.extract` — loops over `C.R2_WINDOWS`, one row per (subject, stimulus, window);
  non-wear trimming deleted; IMU not read.
- `crossref` — `COMPOSITE_CHANNELS` (A) narrowed to pupil + openness; `SENSITIVITY_CHANNELS`
  retains cognitive load so the appendix keeps every subset; `COMPOSITE_B_CHANNELS` adds gaze
  with sign −1; new `window_comparison()` and `criterion_validity()`.
- `sensitivity` — sweeps the wider space, asserts the primary subset reproduces `keystone()`.
- `survey` — `config.VOID_SURVEY_ANSWERS` applies the S04 ruling.
- `gate` — `rebaseline=True` on the two pooled checks so they report without aborting.
- **v3 only:** new `gaze.py` — deviation in degrees against three labelled baselines
  (`forward`, `file`, `subject`), amplitude as a distribution, excursion rate at 5/10/15°.

---

## 3. Results that matter for drafting

**The continuity proof holds.** Round 1 returns bit-identical in v2 and v3 on both
Round-1-only locked checks. Everything that moved, moved because of the re-crop or a ruling.

**The re-crop did not touch the headline.** Pooled eye openness is unchanged: 11/12,
Friedman p=0.0004, Wilcoxon p=0.0010, rb −0.974. Pupil's omnibus weakened (0.046 → 0.097),
its pairwise strengthened (0.0093 → 0.0049, rb −0.872).

**Criterion validity — the test the study's own logic required and nobody had run.**
Each instrument scored against what participants said, 36 episodes, within-subject z, Spearman:

| channel | vs boredom | vs engagement |
|---|---|---|
| gaze deviation median | **+0.52, p=0.0011** | **−0.53, p=0.0009** |
| eye openness | **−0.46, p=0.0048** | **+0.42, p=0.0115** |
| gaze degrees off centre (v3) | +0.36, p=0.032 | −0.39, p=0.018 |
| pupil dilation | −0.17, **p=0.32** | +0.04, p=0.84 |
| cognitive load *(appendix)* | −0.09, n.s. | +0.11, n.s. |
| HR *(appendix)* | +0.09, n.s. | +0.04, n.s. |

Gaze is the best single predictor of self-report. **Pupil separates the films powerfully and
agrees with the person not at all.** Two different questions; the section must keep them apart.

**Amplitude and frequency point opposite ways, and both are real.** Amplitude is higher on the
boring film and tracks self-report; frequency (departures >10°/min) is *lower* on the boring
film, 7/8, **Holm p=0.047** — the first gaze result in this study to survive correction. Fewer,
longer departures when bored; frequent short repositioning when engaged.

**The keystone, all three films, composite A (pupil + openness):**

| film | divergent | both engaged | both bored | inverse |
|---|---|---|---|---|
| Boring | 0 | 0 | 9 | 3 |
| **Clinical** | **8** | 4 | 0 | 0 |
| Interesting | 3 | 5 | 2 | 2 |

Composite B (adding gaze) gives 7/3/1/1 on clinical — **A is the cleaner instrument**.

**Safe statement of the divergence**, immune to the objection that the composite is partly a
boring-detector: *the eyes place the clinical film with the interesting one and away from the
boring one; the survey places it nearer the boring end.*

**Reported against my own prediction:** the per-file-median baseline correlates with
self-report better than the restored fixed-forward one (0.52 vs 0.36).

**Carried forward unchanged:** EEG a full negative (0/5 surfaces, 0/15 contrasts, concordance
4/8, retention 62.3%). S05's 449.2 s closure and S08's 124.5 s. Prior exposure still answers
the objection. Felt duration dilated in 25/36 episodes with no stimulus separation.

---

## 4. WHAT REMAINS

### 4a. FIRST — revise the Stage-2 outline
`PART-III-LAB-BOREDOM-SECTION-OUTLINE-v1-2026-07-29.md` is **STALE** and predates everything
in this handoff. Produce `PART-III-LAB-BOREDOM-SECTION-OUTLINE-v2-…` — never edit v1.

The rework, module by module:
- **L2** needs the most new work: four cohorts, two engines, two axis conventions, the
  poolability rule, the two window conventions, and the openness-proxy argument promoted
  from footnote to paragraph.
- **L3** is rebuilt, not patched. Eye-closure is the headline surface; pupil second and
  honestly weakened by pooling; the criterion-validity result is new and belongs here; the
  three-film decomposition replaces the clinical-only keystone.
- **L4.2** must absorb the reverse case rather than defer it. **L4.3**'s *Zeitvertreib* claim
  must move from body to eye and cite the amplitude/frequency split. **L4.4**'s third-form
  analog is better evidenced, so the category caution binds harder. **L4.5**'s anomaly pair
  becomes an anomaly set (3/12 not bored by the boring film; 5/12 bored by the interesting one).
- **L5** must **withdraw** the claim that the IMU supplies the restlessness channel.
- **L6** grows: eye-in-head only, no head channel, deferred head analysis, window difference,
  the openness proxy, the reverse case, the 27 unreconciled recorder CSVs.

Then: author walkthrough module by module → Stage 3 guided drafting in 1–3 ¶ batches with an
approval gate per batch, bare ¶-numbers when presenting.

### 4b. A drafting constraint that must not be violated
Head movement **is** present — verified in the session video, where the head rolls ~90° and
pitches far enough down to take the film out of view. It is simply not instrumented this pass.
**The section must not say the boring film produced stillness rather than restlessness.** The
accurate form: the eye channels show withdrawal, and the search behaviour visible in the
session video was not instrumented in this pass.

### 4c. Open decisions — 13 of them
All in `DECISIONS-REGISTER-v2-2026-07-31.md` §6. The two that most shape the prose are
**O-01** (the EEG framing) and **O-13** (how to present the stimulus-separation versus
agreement-with-self-report distinction, since pupil and gaze rank oppositely on them).

### 4d. Deferred by ruling
IMU head motion; video-derived head pose (panel tracking and panel-visibility fraction, both
feasible for Boring and Interesting, not for Clinical); further gaze-baseline sensitivity.

---

## 5. KEY PATHS

| what | where |
|---|---|
| **This handoff** | `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-V2-V3-COMPLETE-2026-07-31.md` |
| **Decisions register (current)** | `tmp/Dissertation/Part_III/DECISIONS-REGISTER-v2-2026-07-31.md` |
| **Version diff — read this** | `tmp/Dissertation/Part_III/ANALYSIS-VERSION-DIFF-v1-v2-v3-2026-07-31.md` |
| **Current analysis tree** | `tmp/Dissertation/Part_III/boredom-analysis-v4-2026-08-04/` |
| Drafting-ready methods prose | `tmp/Dissertation/Part_III/PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md` |
| Frozen v1 | `tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/` |
| **Stale outline (revise, don't edit)** | `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v1-2026-07-29.md` |
| Prior handoff (background) | `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-ANALYSIS-AND-SECTION-2026-07-30.md` |
| Methodology of record — NEVER EDIT | `scripts/boredom-o9/` |
| Inherited three-forms exposition | `tmp/Dissertation/Part_III/drafts/DESKTOP-M4-DRAFT-v1.tex` ¶¶4–7 of M4.1 |
| The hand-forward to redeem | `tmp/Dissertation/Part_III/drafts/DESKTOP-M7-DRAFT-v1.tex` M7.1 |
| Round 1 raw (PII) | `/mnt/d/PhD/Dissertation/Boredom Experiment/Subjects/` |
| Round 2 raw, re-cropped (PII) | `…/Boredom Experiment Round 2/Subjects/` |
| Round 2 crop QA — 12/12 clean | `…/Boredom Experiment Round 2/CROP-QA-REPORT-2026-07-31.md` |
| Original MATLAB (axis provenance) | `/mnt/v/Production_Storage/MATLAB/eyetrackdatamapping_V3.m` |
| Session backup archive | `/mnt/d/PhD/Dissertation/_SESSION-BACKUPS/` |

---

## 6. DOCTRINE AND GATES — all in force

**PII (permanent):** `S01`–`S08` / `R2-01`–`R2-04` only. No participant name in any output,
log, figure, caption or filename. Crosswalk never persisted; derived at runtime from sorted
folder order. The author may use names in conversation; they never reach a file.

**Doctrine locks:** chain-node walkthrough is THE analytical form · **NO-STALL** · **GREATEST-DESIRE**
(never "better route") · "demonstrated" never "prove".

**Standing sweeps before presenting any batch:** sentence-initial *And* · "record" as
evidence-name · pole · ladder · stall · cost/price/spend metaphors · bare "incorporation"
(Calleja only) · vague paragraph frames.

**Register:** scientific-direct; MLA; *Rhetorica* in Aristotle parentheticals; no module labels
in rendered text; bare ¶-numbers when presenting.

**Verification-gated:** quotes char-exact vs source before entering prose; index entries FIRST
then PDFs (entry pdf-page loci run 1–2 high, always re-pin); backups before touching approved
files; **nothing committed without explicit sign-off**; forks discussed in prose, never polls;
ultracode OFF.

**Statistics:** directional convergence plus the surfaces that actually reach significance —
never per-channel significance for channels that don't. Anything n<6 labelled descriptive; at
n=4 the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result.

**Category caution:** episodic structural grammar only — **never** a *Grundstimmung* claim.
No learning-outcome claims.

**FCM loci:** `book_page = 2·pdf_page − 24`; cite the triple locus; GA pagination drifts —
read it from the running head, never compute it. K&S papers via `pdftotext`, never as images.

---

## 7. BOOT SEQUENCE for the next session

1. This handoff.
2. `DECISIONS-REGISTER-v2-2026-07-31.md` — what is ruled, deferred, and open.
3. `ANALYSIS-VERSION-DIFF-v1-v2-v3-2026-07-31.md` — every number that moved.
4. `boredom-analysis-v4-2026-08-04/FINDINGS.md`, `METHODS.md` and `APPENDIX-CRITERION-VALIDITY.md`.
5. `PART-III-LAB-BOREDOM-SECTION-OUTLINE-v1-2026-07-29.md` — **read knowing it is stale**; §4a above says how.
6. Desktop `M4.1 ¶¶4–7` (inherited apparatus) + `M7.1` (the hand-forward to redeem).
7. Then: revise the outline to v2 → present it for a module-by-module walkthrough.
