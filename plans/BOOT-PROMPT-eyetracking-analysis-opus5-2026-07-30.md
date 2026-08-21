# BOOT PROMPT — paste into a fresh Opus 5 session

*Supersedes the three Fable-targeted drafts. Those failed because Fable 5's safeguards flag physiological-signal
reporting (biology false positive) on the assistant's own output — not because of prompt wording. Verified by
bisection. Opus 5 is unaffected.*

---

I'm finishing the empirical chapter of my dissertation and need the full analysis run on my VR attention study — 12 participants, sensor recordings across three video conditions, plus a short questionnaire after each. This session is analysis, statistics and figures. No chapter prose.

**Read this specification first, in full. It's authoritative — where it and this prompt disagree, it wins:**

`\\wsl.localhost\Ubuntu-24.04\home\dalton\projects\claudeflow-testing\plans\boredom-eyetracking-full-analysis-execution-2026-07-30.md`

Then read, in order:

1. `scripts/boredom-o9/` — `common.py`, `ch_hmd.py`, `ch_stats.py`, `ch_eeg.py`, `ch_fig.py`. **Methodology of record.** Mirror feature definitions from this code, never reimplement them from prose.
2. `tmp/Dissertation/Part_III/boredom-o9-processing/ch_hmd_r2.py` — the Round 2 parser, already written and run.
3. `tmp/Dissertation/Part_III/reanalysis/` — `boredom-o9-physiological-findings.md`, `boredom-round2-recon-2026-07-29.md`, `boredom-experiment-brief.md`.

**Before writing new analysis code, reproduce these four results.** Re-verified 2026-07-30. If your run disagrees, stop and find the bug rather than proceeding:

| result | n | outcome | Friedman | Wilcoxon | rb |
|---|---|---|---|---|---|
| Round 1 pupil dilation | 8 | 8/8 Boring < Clinical | p=0.0302 | p=0.0078 | −1.00 |
| Round 1 eye-closure | 8 | 7/8 Boring lowest | p=0.0076 | p=0.0156 | −0.94 |
| Pooled pupil | 12 | 10/12 | p=0.0458 | p=0.0093 | −0.82 |
| Pooled eye-closure | 12 | 11/12 | p=0.0004 | p=0.0010 | −0.97 |

**Five decisions already settled — please don't reopen them:**

**Code organisation.** Build a fresh `analysis/` tree with one deterministic entry point that **imports** the existing feature functions. Do not modify, refactor or duplicate `scripts/boredom-o9/` — it is the methodology of record, and the four checks above are defined against its behaviour. If a helper isn't importable as written, wrap it and note the wrapper in `METHODS.md`. The Round 2 parser is this project's own work and may be extended.

**Crop windows only.** All 24 Round 1 cells have a `_Crop` file. If one is ever missing, fail and log rather than substituting the full recording. Prefer the plain `_Crop` over the single duplicate; one crop is `.xlsx` and needs `read_excel`.

**Don't pool rate-dependent features across rounds.** Round 1 sampled ~3.3 Hz effective, Round 2 a uniform 120 Hz; the same gaze-variance feature shifts by 0.65–0.84× under decimation. Means — pupil, cognitive load, heart rate, openness — pool fine. Variances and windowed statistics stay within round. Tag every pooled statistic with a `poolable` flag and a one-line reason in the log.

**Eye openness is a primary measure, not a QC field.** Round 2 records it continuously; Round 1's validity flag is a proxy validated at r = +0.998 against it. It is the strongest effect in the dataset and had been sitting unanalysed in a quality-control column.

**EEG: analyse it fully, report what it shows, then let the conclusion follow.** Report epoch retention, signal-to-noise and significance including the negative results. The eye-tracking channels are much cleaner and I expect the chapter to foreground them, but that has to rest on the reported EEG numbers rather than stand in place of them. Nothing gets omitted for being non-significant.

**Order of work:** environment check and the four reproductions → parse the questionnaires → analysis categories in the document's order → figure suite → logging artefacts.

**Questionnaires** are free text and inconsistently formatted (`a. 2`, `a.6`, `a. 20 min`, `a. NA`, `5 min (fell asleep)`). Parse defensively with a per-item confidence flag, and log every coerced or unparsed value for my review. Don't coerce silently — that's the likeliest way this goes quietly wrong.

**Figures:** per-participant sets for all 12, all-participants-combined sets for each of the three conditions, plus the cross-cutting effect-size and divergence figures in the document. Each writes its source data to a sibling CSV and carries a caption stub naming n, test, statistic and effect size. PDF and PNG.

**Reproducibility:** emit `RUN-MANIFEST.json`, a `METHODS.md` generated from the run rather than hand-written, `EXCLUSIONS.log`, `QC-REPORT.md` and `FINDINGS.md`. Two runs should produce byte-identical CSVs. The methods section of the dissertation gets built from these, so they need to be complete enough to reimplement from.

**Please don't:** process the session video (out of scope this pass), write chapter prose, commit anything, or edit an existing file without backing it up and telling me first.

Interpreters by absolute path — `/home/dalton/.venv/bin/python` for pandas work including the `.xlsx`, `/home/dalton/.pyenv/versions/3.11.9/bin/python3` for anything needing scipy.

Two open items I'd like you to raise rather than decide: 27 recorder-log CSVs that don't duplicate the organised copies and need reconciling, and three sessions marked `_Test` that I'm treating as instrument validation rather than cohort data.

Read the document, then give me your plan and what the four verification checks returned before running anything else.
