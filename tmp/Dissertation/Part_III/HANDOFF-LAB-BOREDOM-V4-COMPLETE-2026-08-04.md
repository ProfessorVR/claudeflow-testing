# HANDOFF — Laboratory Boredom section: analysis COMPLETE through v4, drafting not started (2026-08-04)

**Supersedes `archived/handoff_docs/HANDOFF-LAB-BOREDOM-V2-V3-COMPLETE-2026-07-31.md`, which supersedes the 2026-07-30
handoff.** The 2026-07-30 file remains accurate for background — the overall goal, the arc
ruling, the four gating decisions, the FCM keystone revision. Read this one for state.

**Status in one line: four complete analysis trees (v1 frozen, v2, v3, v4 current), every ruling
applied and evidenced, a drafting-ready methodological statement written, the outline still
STALE, and no prose drafted.**

---

## 0. If you are reading this after a power loss

Nothing is committed to git, and `tmp/` is **not tracked**, so git offers no protection.

```
/mnt/d/PhD/Dissertation/_SESSION-BACKUPS/LAB-BOREDOM-SESSION-FINAL-20260804-123525.tar.gz
md5 a82c9a215d8bd256489a0ae97857b157        (88 MB)
```

Contains all four analysis trees, every register, every handoff, the boot prompt, the version
diffs, the prose statement, the reanalysis notes, the drafts folder and the stale outline. The
key `.md` files also sit unarchived in that directory. Restore with:

```bash
cd /home/dalton/projects/claudeflow-testing/tmp/Dissertation
md5sum /mnt/d/PhD/Dissertation/_SESSION-BACKUPS/LAB-BOREDOM-SESSION-FINAL-20260804-123525.tar.gz
tar xzf /mnt/d/PhD/Dissertation/_SESSION-BACKUPS/LAB-BOREDOM-SESSION-FINAL-20260804-123525.tar.gz
```

Verify the checksum before extracting. `scripts/boredom-o9/` is the methodology of record, is
committed, and was **never edited** — `git status --porcelain scripts/boredom-o9/` is empty.

---

## 1. The four trees

| version | path | state |
|---|---|---|
| **v1** | `archived/analysis_trees/boredom-analysis-2026-07-30/` | **FROZEN.** Never edit or re-run. 23 tables, 65 figures. |
| **v2** | `archived/analysis_trees/boredom-analysis-v2-2026-07-31/` | complete. 25 tables, 65 figures. Re-crop + channel rulings + two windows + criterion tests. |
| **v3** | `archived/analysis_trees/boredom-analysis-v3-2026-07-31/` | complete. 27 tables, 71 figures. + gaze rebuilt in degrees + composite B. |
| **v4** | `boredom-analysis-v4-2026-08-04/` | **CURRENT.** 27 tables, **72 figures**, 8 artefacts. + criterion p corrected to permutation + Pearson alongside + `APPENDIX-CRITERION-VALIDITY.md`. |

```bash
cd tmp/Dissertation/Part_III/boredom-analysis-v4-2026-08-04/analysis
/home/dalton/.venv/bin/python run.py                # ~6 min (permutation stage dominates)
/home/dalton/.venv/bin/python run.py --no-figures
```

**Read `ANALYSIS-VERSION-DIFF-v1-v4-2026-08-04.md`** for every number that moved and why.

## 2. What happened across these sessions

Started from the finished N=12 analysis (v1). The author issued a series of channel and scope
rulings, **re-cropped the entire Round 2 dataset** mid-session, and then asked for the gaze
metrics to be rebuilt in his own terms. A statistical error in the criterion analysis was found
and corrected in v4.

### 2a. Rulings
Full list in `DECISIONS-REGISTER-v3-2026-08-04.md`. Load-bearing ones: cognitive load, heart
rate, HRV and IMU head motion are **appendix only**; **equal focus on all three films**; Round 2
**crop-only**; **version discipline**; S04's void answer; **head movement deferred**.

### 2b. Instrument findings established by investigation
- **Round 1 recorded in Unreal, Round 2 in Unity** — axis conventions differ. R1: X forward,
  Y horizontal, Z vertical. R2: Z forward, X horizontal, Y vertical. Confirmed from
  `/mnt/v/Production_Storage/MATLAB/eyetrackdatamapping_V3.m`.
- **The published gaze feature uses a fixed forward reference** (`1 − X`); the 2026
  reimplementation substituted each file's own median, removing sustained posture.
- **Both rounds record gaze EYE-IN-HEAD, not head pose.** Confirmed three ways, including the
  overlay video: the head rolls ~90° and pitches far down while the gaze marker stays centred.
- **The film started on "open your eyes" and stopped on "close your eyes."**
- **Round 1's window is the middle ~13.6 min** of a 17-minute film; Round 2's is the whole.

### 2c. The v4 correction — read this before quoting any criterion number
The first criterion run reported **analytic** p-values. Those were wrong: 36 paired points are
12 participants contributing 3 films each, and within-subject centring makes the dependence
structural. v4 reports a **within-subject permutation p** (20,000 shuffles of the film labels
inside each participant, fixed seed). **Three associations that cleared alpha analytically do
not clear it under permutation** and are now reported as non-significant. The error was found
while walking the calculation through in response to a question, not by review.

## 3. Results that matter for drafting

**Continuity proof.** Round 1 returns bit-identical in v2, v3 and v4 on both Round-1-only
locked checks.

**The re-crop did not touch the headline.** Pooled eye openness unchanged: 11/12, Friedman
p=0.0004, Wilcoxon p=0.0010, rb −0.974.

**Criterion validity, corrected.** Four associations survive permutation:

| channel | vs boredom | vs engagement |
|---|---|---|
| gaze deviation median | rho +0.524, perm p 0.0074 | rho −0.527, perm p 0.0075 |
| eye openness | rho −0.460, perm p 0.0212 | rho +0.416, perm p 0.0370 |

**Pupil dilation does not track self-report** (rho −0.17, perm p 0.40) though it separates the
films more powerfully than anything else. Two different questions; the section must keep them
apart. Cognitive load and HR are flat against both items — the rulings evidenced.

**Spearman against Pearson.** Median |r − rho| = 0.032; on all four load-bearing associations
Pearson is the LARGER, so the reported rank statistic is the conservative one.

**Amplitude and frequency point opposite ways.** Amplitude higher on the boring film and tracks
self-report; frequency (departures >10°/min) **lower**, 7/8, Holm p=0.047 — the first gaze
result to survive correction.

**Keystone, composite A (pupil + openness):** Boring 0/0/9/3 · **Clinical 8/4/0/0** ·
Interesting 3/5/2/2. Composite B gives 7/3/1/1 on clinical, so **A is cleaner**. Safe form:
*the eyes place clinical with interesting and away from boring; the survey places it nearer
boring.*

**Carried forward:** EEG a full negative (0/5, 0/15, concordance 4/8, retention 62.3%) · S05's
449.2 s closure and S08's 124.5 s · prior exposure still answers the objection · felt duration
dilated in 25/36 episodes with no stimulus separation.

## 4. WHAT REMAINS

### 4a. FIRST — revise the Stage-2 outline
`PART-III-LAB-BOREDOM-SECTION-OUTLINE-v1-2026-07-29.md` is **STALE**. Produce
`PART-III-LAB-BOREDOM-SECTION-OUTLINE-v2-…` as a new file; never edit v1.

- **L2** needs the most new work: four cohorts, two engines with different axis conventions,
  the poolability rule, the two window conventions, the openness-proxy argument promoted to a
  paragraph — and **the criterion-validity method**, for which the prose is already written.
- **L3** rebuilt, not patched: eye-closure as headline surface, pupil second and weakened by
  pooling, criterion validity as a new subsection, three-film decomposition in place of the
  clinical-only keystone.
- **L4.2** absorbs the reverse case. **L4.3**'s *Zeitvertreib* claim moves from body to eye,
  citing the amplitude/frequency split. **L4.4**'s third-form analog is better evidenced, so
  category caution binds harder. **L4.5**'s anomaly pair becomes an anomaly set.
- **L5** must **withdraw** the claim that the IMU supplies the restlessness channel.
- **L6** grows: eye-in-head only, deferred head analysis, window difference, openness proxy.

Then walkthrough module by module → Stage 3 guided drafting in 1–3 ¶ batches with an approval
gate per batch, bare ¶-numbers when presenting.

### 4b. A drafting constraint that must not be violated
Head movement **is** present — visible in the session video, where the head rolls ~90° and
pitches far enough down to take the film out of view — but it is not instrumented this pass.
**The section must not say the boring film produced stillness rather than restlessness.**
Accurate form: the eye channels show withdrawal, and the search behaviour visible in the
session video was not instrumented in this pass.

### 4c. Already written and ready to paste
`PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md` — a drafting-ready methodological
statement for the criterion analysis. Six paragraphs in full form, a two-paragraph short form,
and six anticipated objections with answers already in the text. Two `******` markers where a
drafting decision is still the author's (O-14, O-15).

### 4d. Open decisions — 15
All in `DECISIONS-REGISTER-v3-2026-08-04.md` §6. The three that most shape the prose are
**O-01** (EEG framing), **O-13** (how to present the two-questions distinction), and **O-14**
(multiplicity in the criterion family).

### 4e. Deferred by ruling
IMU head motion; video-derived head pose; further gaze-baseline sensitivity; extending
`channel-correlation` to the v3 gaze columns.

---

## 5. KEY PATHS

| what | where |
|---|---|
| **This handoff** | `Part_III/HANDOFF-LAB-BOREDOM-V4-COMPLETE-2026-08-04.md` |
| **Boot prompt (current)** | `Part_III/BOOT-PROMPT-LAB-BOREDOM-v2-2026-08-04.md` |
| **Decisions register (current)** | `Part_III/DECISIONS-REGISTER-v3-2026-08-04.md` |
| **Version diff (current)** | `Part_III/ANALYSIS-VERSION-DIFF-v1-v4-2026-08-04.md` |
| **Drafting-ready methods prose** | `Part_III/PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md` |
| **Current analysis tree** | `Part_III/boredom-analysis-v4-2026-08-04/` |
| Generated criterion appendix | `…/boredom-analysis-v4-2026-08-04/APPENDIX-CRITERION-VALIDITY.md` |
| **Stale outline (revise, don't edit)** | `Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v1-2026-07-29.md` |
| Methodology of record — NEVER EDIT | `scripts/boredom-o9/` |
| Inherited three-forms exposition | `Part_III/drafts/DESKTOP-M4-DRAFT-v1.tex` ¶¶4–7 of M4.1 |
| The hand-forward to redeem | `Part_III/drafts/DESKTOP-M7-DRAFT-v1.tex` M7.1 |
| Round 2 crop QA — 12/12 clean | `/mnt/d/…/Boredom Experiment Round 2/CROP-QA-REPORT-2026-07-31.md` |
| Original MATLAB (axis provenance) | `/mnt/v/Production_Storage/MATLAB/eyetrackdatamapping_V3.m` |
| Session backups | `/mnt/d/PhD/Dissertation/_SESSION-BACKUPS/` |

---

## 6. DOCTRINE AND GATES — all in force

**PII (permanent):** `S01`–`S08` / `R2-01`–`R2-04` only. No participant name in any output,
log, figure, caption or filename. Crosswalk never persisted. The author may use names in
conversation; they never reach a file.

**Doctrine locks:** chain-node walkthrough is THE analytical form · **NO-STALL** ·
**GREATEST-DESIRE** (never "better route") · "demonstrated" never "prove".

**Standing sweeps before presenting any batch:** sentence-initial *And* · "record" as
evidence-name · pole · ladder · stall · cost/price/spend metaphors · bare "incorporation"
(Calleja only) · vague paragraph frames.

**Register:** scientific-direct; MLA; *Rhetorica* in Aristotle parentheticals; no module labels
in rendered text; bare ¶-numbers when presenting.

**Verification-gated:** quotes char-exact before entering prose; index entries FIRST then PDFs
(entry pdf-page loci run 1–2 high, always re-pin); backups before touching approved files;
**nothing committed without explicit sign-off**; forks discussed in prose, never polls;
ultracode OFF.

**Statistics:** directional convergence plus the surfaces that actually reach significance —
never per-channel significance for channels that don't. Anything n<6 labelled descriptive; at
n=4 the Wilcoxon floor is p=0.125.

**Category caution:** episodic structural grammar only — **never** a *Grundstimmung* claim.
No learning-outcome claims.

**FCM loci:** `book_page = 2·pdf_page − 24`; cite the triple locus; GA pagination drifts — read
it from the running head. K&S papers via `pdftotext`, never as images.

---

## 7. BOOT SEQUENCE

1. This handoff.
2. `DECISIONS-REGISTER-v3-2026-08-04.md`.
3. `ANALYSIS-VERSION-DIFF-v1-v4-2026-08-04.md`.
4. `boredom-analysis-v4-2026-08-04/`: `FINDINGS.md`, `METHODS.md`, `APPENDIX-CRITERION-VALIDITY.md`, `figures/INDEX.md`.
5. `PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md`.
6. `PART-III-LAB-BOREDOM-SECTION-OUTLINE-v1-2026-07-29.md` — **stale**; §4a says how.
7. Desktop `M4.1 ¶¶4–7` + `M7.1`.
8. Then: revise the outline to v2 → present for a module-by-module walkthrough.
