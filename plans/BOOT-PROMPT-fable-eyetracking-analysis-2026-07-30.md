# BOOT PROMPT — paste into a clean Fable session (v2)

*v1 tripped safeguards. v2 leads with research context, states data-hygiene once as ordinary practice, keeps
sensitive-category detail in the execution document, and puts the EEG reasoning in evidence-then-conclusion order.
Technical substance unchanged.*

---

I'm finishing the empirical chapter of my dissertation and need help with the signal processing and statistics. The study is my own — an IRB-approved VR attention experiment I ran with my co-author — and I'm analysing my own data. Sensor recordings from 12 participants across two collection rounds, plus a short post-video questionnaire each. Standard practice applies: everything is keyed to participant codes rather than names, which the analysis scripts already handle by reading folder order at runtime.

The work here is analysis and figures. No dissertation prose gets written in this session.

**The specification is this document — read it in full first. It is authoritative, and where it and this prompt disagree, it wins:**

`\\wsl.localhost\Ubuntu-24.04\home\dalton\projects\claudeflow-testing\plans\boredom-eyetracking-full-analysis-execution-2026-07-30.md`

It has the per-participant file manifest, the analysis categories, the statistical plan, the logging requirements and the figure suite.

**Then read, in order:**

1. `...\scripts\boredom-o9\` — `common.py`, `ch_hmd.py`, `ch_stats.py`, `ch_eeg.py`, `ch_fig.py`. This is the **methodology of record** for Round 1. Mirror the feature definitions from these scripts; don't reimplement them from prose.
2. `...\tmp\Dissertation\Part_III\boredom-o9-processing\ch_hmd_r2.py` — the Round 2 parser, already written and run, mirroring `ch_hmd.py` against the newer sensor export format.
3. `...\tmp\Dissertation\Part_III\reanalysis\boredom-o9-physiological-findings.md` — Round 1 results and corrections.
4. `...\tmp\Dissertation\Part_III\reanalysis\boredom-round2-recon-2026-07-29.md` — Round 2 recon and processed results.
5. `...\tmp\Dissertation\Part_III\reanalysis\boredom-experiment-brief.md` — the questionnaire master table for Round 1.

**Start by reproducing these four results.** They were re-verified 2026-07-30. If your run doesn't reproduce them, stop and find the bug before going further:

- Round 1 pupil dilation: 8/8 Boring < Clinical, Friedman p=0.0302, Wilcoxon p=0.0078, rank-biserial −1.00
- Round 1 eye-closure: 7/8 Boring lowest, Friedman p=0.0076, Wilcoxon p=0.0156, rank-biserial −0.94
- Pooled pupil, N=12: 10/12, Friedman p=0.0458, Wilcoxon p=0.0093, rank-biserial −0.82
- Pooled eye-closure, N=12: 11/12, Friedman p=0.0004, Wilcoxon p=0.0010, rank-biserial −0.97

**Four decisions already settled — please don't reopen them:**

**Crop windows only.** All 24 Round 1 cells have a `_Crop` file. If one is ever missing, fail and log it rather than substituting the full recording. Prefer the plain `_Crop` over the one duplicate; one crop is `.xlsx` and needs `read_excel`.

**Don't pool rate-dependent features across rounds.** Round 1 sampled at roughly 3.3 Hz effective, Round 2 at a uniform 120 Hz. The same gaze-variance feature changes by a factor of 0.65–0.84 under decimation, so variances and windowed statistics stay within round. Means — pupil, cognitive load, heart rate, openness — pool fine. Tag every pooled statistic with a `poolable` flag and a one-line reason in the log.

**Eye openness is a primary measure, not a QC field.** Round 2 records it continuously; Round 1 has a validity flag that serves as a proxy, validated at r = +0.998 against Round 2's continuous version. It is the strongest effect in the dataset and had been sitting unanalysed in a quality-control column.

**EEG: analyse it fully, report what it shows, then let the write-up follow from that.** Run the EEG where it exists and report epoch retention, signal-to-noise and the significance tests honestly, including the negative results. The eye-tracking channels are far cleaner, and I expect the chapter to say so and to foreground them — but that conclusion has to rest on the reported EEG numbers, not stand in place of them. Nothing should be omitted because it came out non-significant.

**Order of work:** environment check and the four reproductions → parse the questionnaires → the analysis categories in the document's order → the figure suite → the logging artefacts.

**On the questionnaires:** the responses are free text and inconsistently formatted — `a. 2`, `a.6`, `a. 20 min`, `a. NA`, `5 min (fell asleep)`. Parse defensively, attach a per-item confidence flag, and write every coerced or unparsed value to the log so I can review them. Don't coerce silently; that's the likeliest way this goes quietly wrong.

**Figures:** both per-participant and all-participants-combined, for each of the three video conditions, plus the cross-cutting effect-size and divergence figures the document specifies. Every figure writes its source data to a sibling CSV and carries a caption stub naming n, test, statistic and effect size.

**Reproducibility:** emit `RUN-MANIFEST.json`, a generated `METHODS.md`, `EXCLUSIONS.log`, `QC-REPORT.md` and `FINDINGS.md`. Two runs should produce byte-identical CSVs. This is going into a dissertation, so the methods section needs to be reconstructable from the run itself.

**Please don't:** process the session video (out of scope for this pass), write chapter prose, commit anything, or edit an existing approved file without backing it up and telling me first.

Interpreters, absolute paths — `/home/dalton/.venv/bin/python` for pandas work including the `.xlsx` crop, `/home/dalton/.pyenv/versions/3.11.9/bin/python3` for anything needing scipy.

Two things I haven't resolved and would like you to raise rather than decide: 27 recorder-log CSVs that don't duplicate the organised copies and need reconciling, and three sessions marked `_Test` that I'm treating as instrument validation rather than cohort data.

Read the execution document first, then tell me your plan and what the four verification checks returned.
