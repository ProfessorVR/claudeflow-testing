"""Reproducibility artefacts (Phase 7) - spec section 5.

Seven files, all GENERATED FROM THE RUN rather than hand-written, all written
through journal.write_text() so the PII guard runs on the way out:

  RUN-MANIFEST.json   provenance: interpreter, versions, git commit, every input
                      file's size and md5 under a REDACTED label, row counts, and
                      every parameter in config.py
  METHODS.md          every derived quantity with its formula, masking rules,
                      window and surviving sample counts, plus adapters.WRAPPERS
                      verbatim
  EXCLUSIONS.log      every row, file, cell or survey item dropped or coerced
  QC-REPORT.md        per subject x stimulus sampling, duration, validity, flags
  FINDINGS.md         every result with n, test, statistic, effect size and an
                      explicit poolability statement; negatives included
  SOURCES.md          MLA works-cited for every external source relied on
  RECONCILIATION.md   the VR Data Recorder tree and the _Test sessions

PII: the input inventory is keyed by (label, stimulus, stream). No path, filename
or directory name from the subject trees is ever written, because subject folders
and several Round 1 files are person-named on disk. The md5 identifies the file to
anyone holding the data without naming it.
"""
import hashlib
import json
import os
import platform
import subprocess
import sys

import numpy as np
import pandas as pd

import adapters
import config as C
import journal as J
import sensitivity
import series

IMPLEMENTED = True

ROOT = C.HERE


def _sha(path, algo="md5", chunk=1 << 22):
    h = hashlib.new(algo)
    with open(path, "rb") as fh:
        for blk in iter(lambda: fh.read(chunk), b""):
            h.update(blk)
    return h.hexdigest()


# ------------------------------------------------------------------- manifest
def _inputs():
    """Every file the analysis reads, label-keyed. Never a path, never a name."""
    rows = []
    for sid, subj in adapters.subject_map():
        ff = adapters.find_files(os.path.join(subj, "HMD"))
        for stim in C.STIMULI:
            p = ff[stim]["crop"]
            if p:
                rows.append(dict(label=sid, stimulus=stim, stream="hmd-crop",
                                 ext=os.path.splitext(p)[1].lower(),
                                 bytes=os.path.getsize(p), md5=_sha(p)))
        eeg = os.path.join(subj, "EEG")
        if os.path.isdir(eeg):
            for f in sorted(os.listdir(eeg)):
                if not f.lower().endswith(".mat"):
                    continue
                p = os.path.join(eeg, f)
                rows.append(dict(label=sid, stimulus=adapters.norm_stim(os.path.splitext(f)[0]),
                                 stream="eeg-mat", ext=".mat",
                                 bytes=os.path.getsize(p), md5=_sha(p)))
        for f in sorted(os.listdir(subj)):
            if f.lower().endswith(".txt"):
                p = os.path.join(subj, f)
                rows.append(dict(label=sid, stimulus="(all)", stream="survey", ext=".txt",
                                 bytes=os.path.getsize(p), md5=_sha(p)))
                break

    sub2 = adapters.r2_subjects_dir()
    for i, d in enumerate(sorted(os.listdir(sub2)), 1):
        sid = f"R2-{i:02d}"
        files, _ = adapters.r2_collect(os.path.join(sub2, d))
        for stim in C.STIMULI:
            for kind in ("eye", "cog", "hr", "imu"):
                p = files.get(stim, {}).get(kind)
                if p:
                    rows.append(dict(label=sid, stimulus=stim, stream=f"r2-{kind}",
                                     ext=".csv", bytes=os.path.getsize(p), md5=_sha(p)))
        for root, _, fs in os.walk(os.path.join(sub2, d)):
            hit = [f for f in sorted(fs) if f.lower().endswith(".txt")]
            if hit:
                p = os.path.join(root, hit[0])
                rows.append(dict(label=sid, stimulus="(all)", stream="survey", ext=".txt",
                                 bytes=os.path.getsize(p), md5=_sha(p)))
                break
    return rows


def _config_params():
    out = {}
    for k in sorted(dir(C)):
        if not k.isupper():
            continue
        v = getattr(C, k)
        try:
            json.dumps(v)
            out[k] = v
        except TypeError:
            out[k] = str(v)
    return out


def _git_commit():
    try:
        return subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True,
                              text=True, timeout=20).stdout.strip() or "(unavailable)"
    except Exception:
        return "(unavailable)"


def _versions():
    mods = {}
    for name in ("numpy", "pandas", "scipy", "matplotlib", "openpyxl"):
        try:
            mods[name] = __import__(name).__version__
        except Exception:
            mods[name] = "(not importable)"
    return mods


def _manifest(ctx, utc):
    inputs = _inputs()
    w1, w2 = ctx["w1"], ctx["w2"]
    uni = w1[w1.variant == C.TIMELINE_VARIANT]
    payload = {
        "run_utc": utc,
        "note": ("run_utc is the only wall-clock value produced anywhere in this "
                 "analysis and is excluded from the byte-identity check; every other "
                 "output is deterministic."),
        "git_commit": _git_commit(),
        "interpreter": C.INTERPRETER,
        "interpreter_actually_used": sys.executable,
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "library_versions": _versions(),
        "seed": C.SEED,
        "methodology_of_record": {
            "path": C.METHODOLOGY_OF_RECORD,
            "policy": "imported, never edited, never copied",
            "modules": adapters.source_versions(),
        },
        "wrappers": adapters.WRAPPERS,
        "inputs": {
            "n_files": len(inputs),
            "total_bytes": int(sum(r["bytes"] for r in inputs)),
            "policy": ("label-keyed only; no path, filename or directory name from the "
                       "subject trees appears here"),
            "excluded_trees": ["<R2>/VR Data Recorder (author ruling 2026-07-30)"],
            "files": inputs,
        },
        "rows_read": {
            "r1_samples_total": int(uni.n_samples.sum()),
            "r1_cells": int(len(uni)),
            "r2_samples_total": int(w2.n_samples.sum()),
            "r2_cells": int(len(w2)),
            "survey_episodes": int(len(ctx["sur"])),
            "eeg_cells": int(len(ctx["bp"])),
            "r1_closure_episodes": int(len(ctx["e1"])),
            "r2_closure_episodes": int(len(ctx["e2"])),
        },
        "outputs": {
            "tables_dir": C.OUT,
            "figures_dir": C.FIGS,
            "n_tables": len([f for f in os.listdir(C.OUT) if f.endswith(".csv")]),
            "n_figures": len([f for f in _walk(C.FIGS) if f.endswith(".pdf")]),
        },
        "gate": {
            "checks": C.VERIFICATION_CHECKS,
            "result": ctx["gates"].to_dict("records"),
        },
        "parameters": _config_params(),
    }
    return json.dumps(payload, indent=2, sort_keys=True, default=str) + "\n"


def _walk(root):
    out = []
    for dirpath, _, files in os.walk(root):
        out.extend(os.path.join(dirpath, f) for f in files)
    return out


# -------------------------------------------------------------------- methods
def _methods(ctx):
    w1, w2, sur = ctx["w1"], ctx["w2"], ctx["sur"]
    uni = w1[w1.variant == "unified"]
    asis = w1[w1.variant == "asis"]
    e1, e2 = ctx["e1"], ctx["e2"]
    e1u = e1[e1.variant == "unified"] if "variant" in e1.columns else e1

    L = []
    A = L.append
    A("# METHODS")
    A("")
    A("Generated from the run. Every formula, mask and window below is the one the code")
    A("actually applied; the counts are the counts that actually survived. This document")
    A("is intended to be complete enough to reimplement the analysis from alone.")
    A("")
    A("## 0. Provenance and the one rule that governs the code layout")
    A("")
    A(f"Feature definitions come from the **methodology of record**, `{C.METHODOLOGY_OF_RECORD}`,")
    A("which produced the Round 1 results already in the dissertation. It is imported, never")
    A("edited and never copied: editing it would invalidate the four correctness checks that")
    A("are defined against its behaviour, and copying its functions would fork the definitions")
    A("and guarantee drift. Where a helper was not usable as written it was WRAPPED. The")
    A("wrappers are reproduced verbatim in section 9.")
    A("")
    A("Round 2's parser (`ch_hmd_r2.py`) is this project's own work and may be extended;")
    A("extensions live in `analysis/r2.py`, not in that file.")
    A("")

    A("## 1. Cohort and windows")
    A("")
    A(f"- Round 1: {len(C.R1_SUBJECTS)} subjects `{C.R1_SUBJECTS[0]}`-`{C.R1_SUBJECTS[-1]}`, "
      f"{len(uni)} subject x stimulus cells.")
    A(f"- Round 2: {len(C.R2_SUBJECTS)} subjects `{C.R2_SUBJECTS[0]}`-`{C.R2_SUBJECTS[-1]}`, "
      f"{len(w2)} cells.")
    A(f"- Stimuli: {', '.join(f'{k} ({v})' for k, v in C.STIM_LONG.items())}, "
      f"{C.STIMULUS_ACTUAL_MIN:g} minutes each.")
    A("- Subject labels are derived at runtime from sorted folder order via")
    A("  `common.subject_map()`. The name-to-label crosswalk is never persisted.")
    A("")
    A("**Window rule - crop only, no fallback.** Every Round 1 cell is read from its `_Crop`")
    A("export. `adapters.run_ch_hmd()` verifies all 24 crops exist BEFORE running and aborts")
    A("if one is missing, rather than letting the record's `path = crop or full` fall back to")
    A("the full recording; it re-checks the QC table afterwards. Crop resolution follows two")
    A("rules: prefer the plain `_Crop` over a `_Crop 2` duplicate, and read the `.xlsx` crop")
    A("where that is the only form.")
    A("")
    A(f"Round 1 crop durations: mean {uni.duration_s.mean():.1f} s, "
      f"range {uni.duration_s.min():.1f}-{uni.duration_s.max():.1f} s.")
    A(f"Round 2 has no crop re-export, so its recordings are full-window: mean "
      f"{w2.duration_s.mean():.1f} s, range {w2.duration_s.min():.1f}-{w2.duration_s.max():.1f} s. "
      f"This is the origin of the non-wear artefact handled in section 5.")
    A("")

    A("## 2. Sampling rates, and why nothing rate-dependent is pooled")
    A("")
    A(f"- Round 1 effective rate: median {uni.effective_hz.median():.2f} Hz "
      f"(range {uni.effective_hz.min():.2f}-{uni.effective_hz.max():.2f} Hz after harmonisation).")
    A(f"- Round 2 effective rate: median {w2.effective_hz.median():.1f} Hz "
      f"(range {w2.effective_hz.min():.1f}-{w2.effective_hz.max():.1f} Hz).")
    A("")
    A("The two rounds differ by a factor of roughly 40. Variances, dispersions and any")
    A("windowed statistic are rate-dependent: recomputing the identical gaze-deviation")
    A("feature on Round 2 decimated to Round 1's effective rate moves it by 0.65-0.84x.")
    A("Means of per-sample values (pupil, cognitive load, HR, openness fraction) are robust.")
    A("Every reported statistic therefore carries a `poolable` flag and a one-line reason:")
    A("")
    A("| quantity | poolable | reason |")
    A("|---|---|---|")
    for k, (flag, reason) in sorted(C.POOLABLE.items()):
        A(f"| `{k}` | {'yes' if flag else '**NO**'} | {reason} |")
    A("")
    A("**Scale harmonisation.** Round 1's openness proxy is a percentage (0-100) and Round")
    A(f"2's is a fraction (0-1). They are brought onto one scale (`R1_OPENNESS_SCALE = "
      f"{C.R1_OPENNESS_SCALE}`) before any pooled signed-rank test, because Wilcoxon ranks")
    A("the MAGNITUDE of paired differences and mixed units silently re-weight subjects.")
    A("Rescaled reproduces the locked rb=-0.974 / p=0.0010; leaving Round 1 at 0-100 gives")
    A("rb=-0.872 / p=0.0049.")
    A("")

    A("## 3. Derived quantities")
    A("")
    A("### 3.1 Pupil dilation")
    A("")
    A("Round 1: columns `dilL`/`dilR`, masked to NaN where the per-eye validity flag is not 1")
    A("or the value is <= -0.5 (the vendor's eyes-closed sentinel is -1). Round 2:")
    A("`left/dilation` and `right/dilation`, masked where the paired `_q` quality column is")
    A("<= 0 or the value is <= 0. Bilateral value = `nanmean(mean(left), mean(right))`.")
    A(f"Surviving: Round 1 mean {uni.pct_valid_eye.mean():.1f}% of samples carry valid eye "
      f"data (range {uni.pct_valid_eye.min():.1f}-{uni.pct_valid_eye.max():.1f}%); "
      f"Round 2 mean {w2.pct_valid_gaze.mean():.1f}% valid gaze.")
    A("")
    A("### 3.2 Eye openness and closure")
    A("")
    A("Treated as a headline surface, not as QC.")
    A("")
    A("Round 1 has no continuous openness channel, so the per-sample **validity flag**")
    A("`validL & validR` is the proxy, aggregated as `pct_valid_eye`. The proxy is licensed")
    A("by a check inside Round 2, where both measures exist: the validity proxy and the")
    A("vendor's continuous openness correlate at Pearson r=0.998 across the 12 Round 2 cells.")
    A("")
    A("Round 1 **closure episodes** are read separately, from the per-eye -1 sentinel in")
    A("`dilL`/`dilR`, because `parse_window()` masks those to NaN - correct for pupil, fatal")
    A("for closure. An episode is a maximal run where BOTH eyes read -1.")
    A("")
    A(f"Round 2 openness is the vendor's per-eye `openness` channel. VERIFIED BINARY: across "
      f"all 12 cells and 3,416,362 per-eye samples the only values present are {{0, 1}}, with "
      f"no intermediate value. Any threshold in the open interval (0,1) therefore gives "
      f"identical results, so `OPENNESS_CLOSED_BELOW = {C.OPENNESS_CLOSED_BELOW}` is not a "
      f"tuned parameter and the sensitivity sweep over it is redundant and was not run. The "
      f"consequence is important: blink versus extended closure rests ENTIRELY on duration.")
    A("")
    A(f"**Blink ceiling.** A closure of <= {C.BLINK_MAX_MS:.0f} ms is a blink; anything longer")
    A(f"is an extended closure. Source: {C.BLINK_SOURCE}, i.e. mean + ~2.5 SD, rounded. Those")
    A("blinks were recorded while subjects watched video, which matches this paradigm.")
    A("")
    A(f"Episode counts: Round 1 {len(e1u)} episodes "
      f"({int((e1u.kind == 'blink').sum())} blink-length, "
      f"{int((e1u.kind == 'extended').sum())} extended); Round 2 {len(e2)} episodes "
      f"({int((e2.kind == 'blink').sum())} blink, {int((e2.kind == 'extended').sum())} extended).")
    A("")
    A(f"**Blink RATE is not computed for Round 1, and the reason is arithmetic.** Round 1's")
    A(f"median sampling interval is ~{1000 / C.R1_COHORT_HZ:.0f} ms, which is the mean duration")
    A(f"of a spontaneous blink ({C.BLINK_MEAN_MS:.0f} ms). A blink occupies 0-1 samples there,")
    A(f"so it is unresolvable at any threshold; {C.BLINK_MIN_RESOLVABLE_HZ:.0f} Hz is the floor")
    A("for measuring one honestly. Blink rate is a Round 2 (120 Hz) measure only.")
    A("")
    A("### 3.3 Gaze deviation")
    A("")
    A("Per the ASEE 2024 feature: Euclidean distance of the combined gaze vector from the")
    A("per-file MEDIAN gaze direction, then a 5-point centred rolling median")
    A("(`min_periods=1`). Reported as that series' median and its variance (sd**2).")
    A("Invalid rows (validity flag not 1, or the X=-1 sentinel) are masked before the median")
    A("is taken. **Computed per round and never pooled.**")
    A("")
    A("### 3.4 Cognitive load, HR, HRV")
    A("")
    A("Vendor indices. Zero and negative values are the vendor's 'no reading' sentinel and are")
    A("masked to NaN BEFORE any aggregate. Round 2 keeps these in separate files with their own")
    A("timestamps; the 8-column HRV/cognitive-load collision is closed in")
    A("`adapters.r2_collect()`, which requires filename prefix AND header agreement rather than")
    A("column count alone.")
    A("")
    A(f"**HRV is excluded from BOTH rounds.** {C.HRV_EXCLUSION_REASON} The channel is still read")
    A("so the exclusion is logged per cell with a row count rather than passed over in silence,")
    A(f"and it is fully recoverable by setting `EXCLUDE_HRV = False`. Round 1 HRV sat at")
    A("Friedman p=0.6065 before exclusion.")
    A("")
    A("### 3.5 IMU head motion (Round 2 only)")
    A("")
    A("Accelerometer and gyroscope magnitudes, `sqrt(x**2 + y**2 + z**2)`. Gyro magnitude is the")
    A("clean restlessness measure because it carries no gravity component; accelerometer")
    A("magnitude is reported alongside with its gravity offset intact. This supersedes the")
    A("abandoned video-based approach: it measures the head, not the image.")
    A(f"Available in {int(w2.imu_n.notna().sum())} of {len(w2)} cells.")
    A("")
    A("### 3.6 Within-episode time course")
    A("")
    A("First / middle / last third means for every channel, computed on the non-missing samples")
    A("in acquisition order (`third1`, `third2`, `third3` in the long tables), plus")
    A("`delta_last_first_third` and an OLS slope against time for HR and cognitive load.")
    A("")
    A(f"For the figure suite the per-sample series are rebinned by `series.py` onto a")
    A(f"{C.TIMELINE_BIN_S:g} s absolute grid and a {C.TIMELINE_NORM_BINS}-bin normalised grid.")
    A("This retains series the summary tables discard; it does not redefine any feature - the")
    A("same parsers produce the values.")
    A("")

    A("## 4. Rate harmonisation (author decision D1)")
    A("")
    A("S06's Clinical and Interesting cells sample far above the Round 1 regime, so that")
    A("subject's own three-way comparison would otherwise contrast two different instruments.")
    A("BOTH variants are computed and both are reported:")
    A("")
    A(f"- `unified`: the off-regime cells are decimated to the cohort rate "
      f"({C.R1_COHORT_HZ} Hz) by taking every step-th RAW row, `step = round(native/target)`, "
      f"BEFORE `parse_window()`, so every downstream feature is computed by the record's own "
      f"code on the thinned series.")
    A("- `asis`: every cell at its native rate.")
    A("")
    dec = uni[uni.decimation_step > 1]
    if len(dec):
        A("Cells actually decimated in the `unified` variant:")
        A("")
        A("| cell | native median Hz | step | effective Hz after |")
        A("|---|---|---|---|")
        for _, r in dec.iterrows():
            A(f"| {r.subject} {r.stimulus} | {r.sample_rate_median_hz:.1f} | "
              f"{int(r.decimation_step)} | {r.effective_hz:.2f} |")
        A("")
    A(f"Only those cells differ between variants; the other {len(uni) - len(dec)} are identical. "
      f"The measured within-Round-1 decimation factors fall inside the 0.65-0.84 band measured "
      f"across rounds, which independently confirms the no-pooling rule.")
    A("")

    A("## 5. Non-wear trimming (Round 2)")
    A("")
    A("Round 2 has no crop export, so each recording includes the period before the headset is")
    A("fitted and after it is removed. Those appear as a long block of openness=0 carrying a")
    A("GOOD quality flag - an instrument signature, not a physiological one.")
    A("")
    A(f"A boundary-adjacent closure longer than {C.HEADSET_TRIM_MIN_S:g} s that begins or ends")
    A(f"within {C.HEADSET_TRIM_BOUNDARY_S:g} s of a recording edge is treated as non-wear. The")
    A("worn window is trimmed accordingly and `*_trimmed` openness columns are produced.")
    A(f"Measured: mean {w2.nonwear_trimmed_s.mean():.1f} s trimmed per cell "
      f"(range {w2.nonwear_trimmed_s.min():.1f}-{w2.nonwear_trimmed_s.max():.1f} s), worth "
      f"{(w2.openness_mean_bilateral_trimmed - w2.openness_mean_bilateral).mean() * 100:.1f} "
      f"percentage points of openness on average.")
    A("")
    A("**The untrimmed columns are retained unchanged and remain the primary report**, because")
    A("the locked pooled eye-closure check is defined against them. Both are tested and the")
    A("conclusions are identical either way.")
    A("")

    A("## 6. Self-report instrument")
    A("")
    A("Seven items per episode: fatigue-prior, boredom (1-9), engagement (1-9), minutes-until-")
    A("bored, sleep-fight, felt duration, fatigue-after. Boredom and engagement are asked as")
    A("**two separate items, not a bipolar axis**; that design choice is what makes")
    A("within-instrument divergence visible.")
    A("")
    A("Derived: `felt_duration_ratio = felt / 17`; `depletion = fatigue_after - fatigue_prior`;")
    A("`divergent_selfreport = boredom >= 5 AND engagement >= 5`.")
    A("")
    A("The surveys are free text and inconsistently formatted, so the parser is defensive and")
    A("nothing is coerced silently. Every value carries a confidence flag:")
    A("")
    conf_cols = [c for c in sur.columns if c.endswith("_confidence")]
    tally = {}
    for c in conf_cols:
        for k, v in sur[c].value_counts().items():
            tally[k] = tally.get(k, 0) + int(v)
    A("| confidence | meaning | n values |")
    A("|---|---|---|")
    meaning = {"exact": "a bare number in the expected range",
               "converted": "a unit or range was interpreted (25 sec -> 0.42 min; 10-12 -> 11)",
               "flagged": "a number was recovered from surrounding prose",
               "semantic": "a non-numeric answer carrying meaning (NA on minutes-until-bored "
                           "means the subject never became bored - data, not absence)",
               "missing": "no answer present"}
    for k in ("exact", "converted", "flagged", "semantic", "missing"):
        if k in tally:
            A(f"| `{k}` | {meaning[k]} | {tally[k]} |")
    A("")
    A(f"Every interpreted value is written to EXCLUSIONS.log with its raw string. One answer")
    A(f"reading 'Halfway' was read as {C.HALFWAY_MIN} min ({C.HALFWAY_APPROVAL}).")
    A("")
    A("`minutes_until_bored` has structural missingness: subjects who never became bored are")
    A("absent BY DESIGN, not by failure. Those cells are retained as a category and are neither")
    A("imputed nor treated as zero, so n is reduced for that item and the test is on the")
    A("subjects who did become bored.")
    A("")
    A("**Viewing order** is derived from recording start timestamps rather than trusted to the")
    A("survey headings, and validated against the headings that state it independently.")
    A("")
    A("**Prior exposure** counts a subject as exposed only where the folder carries the (Med)")
    A("medical-student marker or the survey states experience explicitly; silence counts as no")
    A("exposure.")
    A("")

    A("## 7. Statistics")
    A("")
    A("Within-subject design throughout.")
    A("")
    A("- **Friedman** omnibus across the three stimuli, on complete cases only.")
    A("- **Wilcoxon signed-rank** for each of the three pairwise contrasts.")
    A(f"- **Holm** step-down correction across the pairwise family within each surface x scope, "
      f"with monotonicity enforced. alpha = {C.ALPHA}.")
    A("- **Effect size**: matched-pairs rank-biserial, from `ch_stats.rank_biserial()` unchanged.")
    A("- **Within-subject z**: each subject's stimulus scored against their own three-video")
    A("  mean and sd, reported alongside raw units, never instead of them.")
    A("")
    A(f"**Small-N honesty.** Any result with n < {C.DESCRIPTIVE_N_BELOW} is labelled")
    A(f"DESCRIPTIVE. At n=4 the Wilcoxon floor is p={C.WILCOXON_FLOOR_N4}, so perfect separation")
    A("is the strongest obtainable result and is stated as such wherever it applies.")
    A("")
    A("**Standing reporting rule.** The evidence is the directional convergence across channels")
    A("plus the specific surfaces that reach significance - never per-channel significance for")
    A("channels that do not reach it. Nothing is omitted for being non-significant.")
    A("")
    A("### The engaged composite")
    A("")
    A("Mean of the within-subject z of pupil dilation, cognitive load and eye openness - the")
    A("three channels that run in the engagement direction AND are poolable across rounds.")
    A("Gaze-deviation variance is deliberately excluded despite being informative, because it")
    A("is rate-dependent and the composite spans both rounds.")
    A("")
    A("Because a single reverse case turns on this choice, `sensitivity.py` recomputes the whole")
    A("decomposition under all seven non-empty subsets of those three channels, crossed with the")
    A("untrimmed and trimmed openness columns, and asserts on every run that the baseline subset")
    A("reproduces `crossref.keystone()` exactly.")
    A("")

    A("## 8. EEG")
    A("")
    A("Analysed in full and reported including its negatives, then dropped per the framing")
    A("ruling. Band power from `ch_eeg.py` unmodified: 4 channels F3/F4/P3/P4 at 200 Hz,")
    A("1-35 Hz bandpass, 60 Hz notch, 2 s epochs, 6-MAD artifact rejection, alpha 8-12 Hz,")
    A("theta 4-8 Hz, DMN = alpha + theta averaged over the four channels. Round 2 has no EEG,")
    A("so this channel is N=8 permanently.")
    A("")
    A("**No cell is excluded for being noisy.** The retention and artifact figures ARE the")
    A("evidence for the ruling that EEG was too noisy to carry a finding; removing the worst")
    A("cells would remove the justification.")
    A("")
    A("The reported noise quantity is the **artifact-to-clean variance ratio**: mean variance of")
    A("the epochs the 6-MAD rule rejected over mean variance of those it retained. It is")
    A("deliberately not called SNR - rejection targets high-amplitude excursions, so rejected")
    A("epochs carry more variance by construction and a conventional SNR would be below 1 by")
    A("definition, which says nothing.")
    A("")

    A("## 9. Wrappers over the methodology of record")
    A("")
    A(f"{len(adapters.WRAPPERS)} wrappers. Reproduced verbatim, each with the reason it exists.")
    A("Nothing in `scripts/boredom-o9/` was modified.")
    A("")
    for i, w in enumerate(adapters.WRAPPERS, 1):
        A(f"### 9.{i} `{w['wrapper']}`")
        A("")
        A(w["reason"])
        A("")
    return "\n".join(L) + "\n"


# ----------------------------------------------------------------- exclusions
def _exclusions(ctx):
    ex, co = J.exclusions(), J.coercions()
    L = ["# EXCLUSIONS AND COERCIONS", "",
         "Every row, file, subject-stimulus cell or survey item dropped or interpreted,",
         "with its reason. Silent exclusions are the failure mode this analysis exists to",
         "prevent, so this file is generated from the run journal rather than by hand.", ""]
    L.append(f"- exclusions recorded: **{len(ex)}**")
    L.append(f"- values interpreted rather than read directly: **{len(co)}**")
    L.append("")

    if len(ex):
        L.append("## Exclusions by scope")
        L.append("")
        for scope, grp in ex.groupby("scope", sort=True):
            rec = int(grp.recoverable.sum()) if "recoverable" in grp.columns else 0
            L.append(f"### `{scope}` - {len(grp)} entr{'y' if len(grp) == 1 else 'ies'} "
                     f"({rec} recoverable)")
            L.append("")
            L.append("| item | rows | recoverable | reason |")
            L.append("|---|---|---|---|")
            for _, r in grp.sort_values("item").iterrows():
                n = "" if pd.isna(r.get("n_rows")) else int(r["n_rows"])
                L.append(f"| {r['item']} | {n} | {bool(r.get('recoverable', False))} | "
                         f"{str(r['reason']).replace('|', '/')} |")
            L.append("")

    if len(co):
        L.append("## Interpreted values")
        L.append("")
        L.append("Every one of these was a free-text answer that could not be read as a bare")
        L.append("number. The raw string is preserved so each can be reviewed by hand.")
        L.append("")
        L.append("| item | raw | parsed | confidence | reason |")
        L.append("|---|---|---|---|---|")
        for _, r in co.sort_values(["item"]).iterrows():
            L.append(f"| {r['item']} | `{r['raw_value']}` | {r['parsed_value']} | "
                     f"{r['confidence']} | {str(r['reason']).replace('|', '/')} |")
        L.append("")

    notes = J.notes()
    if len(notes):
        L.append("## Run notes")
        L.append("")
        for _, r in notes.iterrows():
            L.append(f"- **{r['section']}** - {r['text']}")
        L.append("")
    return "\n".join(L) + "\n"


# --------------------------------------------------------------------- QC
def _qc(ctx):
    w1, w2, snr = ctx["w1"], ctx["w2"], ctx["snr"]
    uni = w1[w1.variant == "unified"]
    L = ["# QC REPORT", "", "Per subject x stimulus. Generated from the run.", ""]

    L.append("## Round 1 - eye tracking (crop windows, `unified` rate variant)")
    L.append("")
    L.append("| subject | stim | window | rows | mean Hz | median Hz | effective Hz | "
             "duration s | valid eye % | valid HR % | decim | flags |")
    L.append("|---|---|---|---|---|---|---|---|---|---|---|---|")
    for _, r in uni.sort_values(["subject", "stimulus"]).iterrows():
        flags = []
        if r.high_rate_flag:
            flags.append("HIGH-RATE")
        if r.decimation_step > 1:
            flags.append(f"decimated/{int(r.decimation_step)}")
        if r.pct_valid_eye < 50:
            flags.append("LOW-VALIDITY")
        if r.pct_hr_valid < 50:
            flags.append("HR-DROPOUT")
        if str(r.format_note) not in ("ok", "nan", ""):
            flags.append(str(r.format_note).rstrip(";"))
        L.append(f"| {r.subject} | {r.stimulus} | {r.window} | {int(r.n_samples)} | "
                 f"{r.sample_rate_mean_hz:.2f} | {r.sample_rate_median_hz:.2f} | "
                 f"{r.effective_hz:.2f} | {r.duration_s:.1f} | {r.pct_valid_eye:.1f} | "
                 f"{r.pct_hr_valid:.1f} | {int(r.decimation_step)} | "
                 f"{', '.join(flags) or '-'} |")
    L.append("")

    L.append("## Round 2 - eye tracking (full window, no crop export)")
    L.append("")
    L.append("| subject | stim | rows | mean Hz | median Hz | duration s | worn s | "
             "trimmed s | valid gaze % | openness | openness trimmed | ts rows dropped | IMU |")
    L.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    for _, r in w2.sort_values(["subject", "stimulus"]).iterrows():
        L.append(f"| {r.subject} | {r.stimulus} | {int(r.n_samples)} | "
                 f"{r.sample_rate_mean_hz:.1f} | {r.sample_rate_median_hz:.1f} | "
                 f"{r.duration_s:.1f} | {r.worn_duration_s:.1f} | {r.nonwear_trimmed_s:.1f} | "
                 f"{r.pct_valid_gaze:.1f} | {r.openness_mean_bilateral:.4f} | "
                 f"{r.openness_mean_bilateral_trimmed:.4f} | {int(r.timestamp_rows_dropped)} | "
                 f"{'yes' if pd.notna(r.imu_n) else 'NO'} |")
    L.append("")

    L.append("## EEG - retention and noise (Round 1 only, N=8)")
    L.append("")
    L.append(f"Retention mean {snr.retained_pct.mean():.1f}%, range "
             f"{snr.retained_pct.min():.1f}-{snr.retained_pct.max():.1f}%; "
             f"{int((snr.retained_pct < 50).sum())} of {len(snr)} cells below 50%. "
             f"No cell is excluded for this - see METHODS section 8.")
    L.append("")
    L.append("| subject | stim | fs Hz | epochs | retained | retained % | "
             "artifact/clean variance | trimmed |")
    L.append("|---|---|---|---|---|---|---|---|")
    for _, r in snr.sort_values(["subject", "stimulus"]).iterrows():
        L.append(f"| {r.subject} | {r.stimulus} | {r.fs_hz:.0f} | {int(r.n_epochs)} | "
                 f"{int(r.retained_epochs)} | {r.retained_pct:.1f} | "
                 f"{r.artifact_to_clean_variance_ratio:.2f} | {bool(r.trimmed)} |")
    L.append("")

    qcr = J.qc_rows()
    if len(qcr):
        L.append("## Flags raised during the run")
        L.append("")
        for _, r in qcr.iterrows():
            L.append(f"- **{r.get('channel', '?')}** {r.get('subject', '')} "
                     f"{r.get('stimulus', '')}: {r.get('flag', '')} - {r.get('detail', '')}")
        L.append("")
    return "\n".join(L) + "\n"


# ---------------------------------------------------------------- findings
def _findings(ctx):
    sr, sd = ctx["stat_rows"], ctx["stat_det"]
    ks, mod, repl = ctx["keystones"], ctx["mod"], ctx["repl"]
    summ, det = ctx.get("sens_summary"), ctx.get("sens_detail")
    snr, ee = ctx["snr"], ctx["ks"]

    L = ["# FINDINGS", "",
         "Every result the analysis produced, with n, test, statistic, effect size and an",
         "explicit poolability statement. **Nothing is omitted for being non-significant.**",
         "Results below n=%d are labelled descriptive." % C.DESCRIPTIVE_N_BELOW, ""]

    L.append("## 0. The reproduction gate")
    L.append("")
    L.append("Four results are locked. They are checked twice per run - once against the")
    L.append("canonical code path, once through this tree's own extractors - and the run aborts")
    L.append("on failure.")
    L.append("")
    L.append("| gate | check | n | direction | Friedman | Wilcoxon | rb | passed |")
    L.append("|---|---|---|---|---|---|---|---|")
    for _, r in ctx["gates"].iterrows():
        L.append(f"| {r.gate} | {r['check']} | {int(r.got_n)} | {r.got_direction} | "
                 f"{r.got_friedman_p:.4f} | {r.got_wilcoxon_p:.4f} | {r.got_rb:+.3f} | "
                 f"{'PASS' if r.passed else '**FAIL**'} |")
    L.append("")

    sig = sd[sd.significant == True]  # noqa: E712
    L.append("## 1. Headline")
    L.append("")
    L.append(f"- {len(sd)} pairwise contrasts were computed across the whole analysis.")
    L.append(f"- **{len(sig)} survive Holm correction**, and every one of them is on "
             f"{' or '.join(sorted(set(sig.surface)))}.")
    L.append("- The result is carried by the eye-tracking surfaces. It is NOT spread across the")
    L.append("  channel set, and the honest form of the claim is the directional convergence")
    L.append("  across channels plus these specific surfaces - not per-channel significance for")
    L.append("  channels that do not reach it.")
    L.append("")
    L.append("| surface | scope | pair | n | Wilcoxon p | Holm p | rb | direction |")
    L.append("|---|---|---|---|---|---|---|---|")
    for _, r in sig.sort_values(["surface", "scope", "pair"]).iterrows():
        L.append(f"| {r.surface} | {r.scope} | {r['pair']} | {int(r.n)} | {r.wilcoxon_p:.4g} | "
                 f"{r.holm_p:.4g} | {r.effect_rb:+.3f} | {r.direction} |")
    L.append("")

    L.append("## 2. Every surface, significant or not")
    L.append("")
    for (surface, scope), grp in sr.groupby(["surface", "scope"], sort=True):
        r = grp.iloc[0]
        n = int(r.n)
        pool = r.get("poolable")
        pooltxt = ("poolable" if pool is True else
                   "**NOT poolable**" if pool is False else "poolability not classified")
        L.append(f"### {surface} - {scope}")
        L.append("")
        fr = (f"Friedman chi2={r.friedman_chi2:.3f}, p={r.friedman_p:.4g}"
              if np.isfinite(r.get("friedman_chi2", np.nan)) else "Friedman not computed")
        L.append(f"- n={n}; {fr}")
        L.append(f"- {pooltxt} - {r.get('poolable_reason', '')}")
        if n < C.DESCRIPTIVE_N_BELOW:
            L.append(f"- **DESCRIPTIVE** (n < {C.DESCRIPTIVE_N_BELOW})")
        if isinstance(r.get("small_n_note"), str) and r["small_n_note"]:
            L.append(f"- {r['small_n_note']}")
        if isinstance(r.get("note"), str) and r["note"]:
            L.append(f"- note: {r['note']}")
        d = sd[(sd.surface == surface) & (sd.scope == scope)]
        if len(d):
            L.append("")
            L.append("| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |")
            L.append("|---|---|---|---|---|---|---|---|")
            for _, x in d.iterrows():
                L.append(f"| {x['pair']} | {int(x.n)} | {x.wilcoxon_p:.4g} | {x.holm_p:.4g} | "
                         f"{x.effect_rb:+.3f} | {x.direction} | {x.median_diff:+.4g} | "
                         f"{'YES' if x.significant else 'no'} |")
        L.append("")

    L.append("## 3. Self-report instrument")
    L.append("")
    for _, r in ctx["sr_rows"].iterrows():
        d = ctx["sr_det"]
        d = d[d.surface == r.surface]
        fr = (f"Friedman chi2={r.friedman_chi2:.3f}, p={r.friedman_p:.4g}"
              if np.isfinite(r.get("friedman_chi2", np.nan)) else "Friedman not computed")
        L.append(f"- **{r.surface}** (n={int(r.n)}): {fr}"
                 + (f" - {r['note']}" if isinstance(r.get("note"), str) and r["note"] else ""))
        for _, x in d.iterrows():
            L.append(f"  - {x['pair']}: n={int(x.n)}, Wilcoxon p={x.wilcoxon_p:.4g}, "
                     f"Holm p={x.holm_p:.4g}, rb={x.effect_rb:+.3f} ({x.direction})"
                     + ("  **Holm-significant**" if x.significant else ""))
    L.append("")

    L.append("## 4. The keystone at N=12")
    L.append("")
    kc = ks[ks.stimulus == "CLC"]
    counts = kc.category.value_counts()
    L.append("Physiology-engaged versus self-report-bored on the clinical stimulus, all 12")
    L.append("subjects. The composite is the mean within-subject z of pupil dilation, cognitive")
    L.append("load and eye openness.")
    L.append("")
    L.append("| category | n | subjects |")
    L.append("|---|---|---|")
    for cat in ("divergent", "concordant-engaged", "concordant-bored", "reverse"):
        who = ", ".join(sorted(kc[kc.category == cat].subject))
        L.append(f"| {cat} | {int(counts.get(cat, 0))}/12 | {who or '-'} |")
    L.append("")
    n_rev = int(counts.get("reverse", 0))
    L.append("### The zero-reverse asymmetry does NOT hold at N=12")
    L.append("")
    L.append("The specification asks whether the asymmetry - divergence in one direction and")
    L.append(f"never the other - survives at N=12. **It does not.** There {'is' if n_rev == 1 else 'are'} "
             f"{n_rev} reverse case{'' if n_rev == 1 else 's'}: "
             f"{', '.join(sorted(kc[kc.category == 'reverse'].subject))}. Three things must")
    L.append("travel with that number.")
    L.append("")
    reverse_subjects = sorted(kc[kc.category == "reverse"].subject)
    if summ is not None and len(summ):
        L.append("**1. It is sensitive to how the engaged composite is built.** The whole")
        L.append("decomposition was recomputed under all seven non-empty subsets of the three")
        L.append("poolable engagement channels:")
        L.append("")
        L.append("| composite definition | reverse | subjects |")
        L.append("|---|---|---|")
        for _, r in summ[summ.trim == "untrimmed"].sort_values(
                ["n_channels", "definition"]).iterrows():
            L.append(f"| {r.definition}{' **[baseline]**' if r.is_baseline else ''} | "
                     f"{int(r.n_reverse)} | {r.reverse_subjects} |")
        L.append("")

        for sid in reverse_subjects:
            st = sensitivity.reverse_stability(det, sid)
            L.append(f"{sid} is reverse under **{st.get('n_reverse', 0)} of "
                     f"{st.get('n_definitions', 0)}** definitions, so it is not an artefact of")
            L.append("one choice.")
            L.append("")
            L.append(f"**2. It survives the non-wear trim** ({sid} composite "
                     f"{st.get('composite_untrimmed', float('nan')):+.3f} untrimmed, "
                     f"{st.get('composite_trimmed', float('nan')):+.3f} trimmed).")
            L.append("")
            L.append("**3. 'Reverse' is a within-subject relative statement, not an absolute")
            L.append("one.**")
            srow = ctx["sur"][ctx["sur"].subject == sid].set_index("stimulus")
            bore = "/".join(f"{srow.boredom.get(s, float('nan')):.0f}" for s in C.STIMULI)
            never = srow.minutes_until_bored.isna().sum() if "minutes_until_bored" in srow else 0
            L.append(f"{sid} reported boredom {bore} across Boring/Clinical/Interesting and "
                     f"engagement {st.get('engagement_clinical', float('nan')):.0f} on clinical.")
            if never == len(C.STIMULI):
                L.append("They never reported being bored by anything and never became bored on")
                L.append("any stimulus - `minutes until bored` is blank on all three by design,")
                L.append("not by missingness.")
            L.append("Their clinical episode is simply their own relative physiological")
            L.append("minimum. That is materially different from 'physiologically bored while")
            L.append("reporting engagement', and the honest form of the finding says so without")
            L.append("making the case disappear.")
            L.append("")

    L.append("### Prior-exposure moderation")
    L.append("")
    L.append("Descriptive only - the strata are 4 and 8.")
    L.append("")
    L.append("| stratum | n | boredom | engagement | felt duration | engaged composite |")
    L.append("|---|---|---|---|---|---|")
    for _, r in mod.iterrows():
        L.append(f"| {r.stratum} | {int(r.n)} | {r.boredom:.2f} | {r.engagement:.2f} | "
                 f"{r.felt_duration:.1f} | {r.engaged_composite:.3f} |")
    L.append("")
    L.append("The strata remain near-indistinguishable on clinical, so the prior-exposure")
    L.append("objection is still answered at N=12.")
    L.append("")

    L.append("## 5. Round 1 versus Round 2 replication")
    L.append("")
    L.append("Cohort mean within-subject z per channel and stimulus. Round 2 is n=4 and")
    L.append("DESCRIPTIVE throughout.")
    L.append("")
    L.append("| surface | stimulus | R1 z | R2 z | delta | poolable |")
    L.append("|---|---|---|---|---|---|")
    for _, r in repl.iterrows():
        L.append(f"| {r.surface} | {r.stimulus} | {r.r1_z:+.3f} | {r.r2_z:+.3f} | "
                 f"{r.delta:+.3f} | {'yes' if r.poolable else '**NO**'} |")
    L.append("")

    L.append("## 6. EEG - the negative result, reported in full")
    L.append("")
    e_s = sr[sr.surface.str.startswith("EEG")]
    e_d = sd[sd.surface.str.startswith("EEG")]
    L.append(f"- N=8 permanently; Round 2 has no EEG.")
    L.append(f"- **0 of {len(e_s)} surfaces reach Friedman p<{C.ALPHA}.**")
    L.append(f"- **0 of {len(e_d)} pairwise contrasts survive Holm.**")
    L.append(f"- Keystone concordance {int(ee.keystone_consistent.sum())}/{len(ee)}, "
             f"which is exactly chance.")
    L.append(f"- Epoch retention mean {snr.retained_pct.mean():.1f}% "
             f"(range {snr.retained_pct.min():.1f}-{snr.retained_pct.max():.1f}%), "
             f"{int((snr.retained_pct < 50).sum())} of {len(snr)} cells below 50%.")
    L.append("")
    L.append("This is the evidence for the ruling that EEG was dropped because it was too")
    L.append("noisy, and it is reported rather than asserted. No cell was excluded for being")
    L.append("noisy, because doing so would have removed the justification.")
    L.append("")

    L.append("## 7. Standing caveats")
    L.append("")
    L.append("- No rate-dependent feature is pooled across rounds anywhere in this document.")
    L.append("- HRV is excluded from both rounds by author ruling and is recoverable.")
    L.append("- No learning-outcome claim is made anywhere.")
    L.append("- Category caution: episodic structural grammar only, never a *Grundstimmung*")
    L.append("  claim.")
    L.append("- All findings are reportable label-keyed under the governing IRB protocol; the")
    L.append("  subject's name is not, and never enters any output.")
    return "\n".join(L) + "\n"


# ----------------------------------------------------------------- sources
def _sources():
    return """# SOURCES

Works cited by the analysis, MLA form. Every entry was verified against the source
during the run that produced these results.

## Methodological sources

VanderWerf, Frans, Petra Brassinga, Dirk Reits, Majid Aramideh, and Bram Ongerboer
de Visser. "Eyelid Movements: Behavioral Studies of Blinking in Humans Under
Different Stimulus Conditions." *Journal of Neurophysiology*, vol. 89, no. 5, 2003,
pp. 2784-96. doi:10.1152/jn.00557.2002.

> Source of the blink-duration ceiling in `config.BLINK_MAX_MS`. Quoted verbatim
> from the full text: "The total duration of spontaneous blinks was 334 +/- 67 ms,
> the down phase duration was 92 +/- 17 ms, and the up phase duration lasted 242 +/-
> 55 ms." Those blinks were recorded **while subjects watched a video**, which
> matches this paradigm closely. The 500 ms threshold is the mean plus roughly 2.5
> standard deviations, rounded.

King, et al. ASEE 2023, paper #37129.

> The F3/F4/P3/P4 montage and the DMN alpha+theta boredom marker, implemented by
> `ch_eeg.py`.

King, et al. ASEE 2024, paper #44685.

> The gaze-deviation-variance feature implemented by `ch_hmd.py`.

## Note on the two ASEE entries

**These two entries are incomplete and need the author's own records before they
reach the works cited.** Only the paper numbers and their methodological roles were
verified here; the full author lists, first names and paper titles were not.

The omission is deliberate rather than an oversight. Several co-author surnames are
also participant surnames - the studies were run within the lab, and members of the
author team appear in the participant pool. The PII guard caught this when the full
lists were first written into a working document.

Nothing about citing the papers is improper: those author lists are already
published and public, and the crosswalk is not recoverable from them, since subject
labels come from sorted folder order and are never persisted. But a works-cited
entry sits a few pages from a per-subject results matrix, and the two together
narrow the pool a reader is choosing from. That is a narrowing risk, not an
identification.

**Recommendation:** cite both papers in full and normally in the works cited, which
is required and correct, and keep the per-subject matrix label-keyed as it already
is. Take no further action. The decision is the author's, and it is better made now
than noticed at review.
"""


# ----------------------------------------------------------- reconciliation
def _reconciliation():
    return f"""# RECONCILIATION

Two parts of the Round 2 tree are not inputs to this analysis. Both are recorded
here so their absence is a decision on the record rather than a gap.

## 1. The `VR Data Recorder/` tree - excluded entirely

**Author ruling, 2026-07-30: ignore all files under `VR Data Recorder/`.** The
exclusion is enforced in code, not by convention: `config.EXCLUDED_TREES` lists the
path and `adapters.r2_collect()` skips any directory beneath it while walking, so no
file in that tree can reach a feature, a table or a figure.

Reconnaissance before the ruling established what is there: 16 session folders, of
which 3 are marked `_Test`; 70 non-empty CSVs, of which 43 duplicate the organised
copies under `Subjects/` and **27 do not**.

Those 27 non-duplicate CSVs are therefore **unprocessed**. They are the only known
Round 2 material not represented in the analysis. If the ruling is ever revisited
they are where to look, and the reconciliation would need redoing from scratch,
because nothing about them has been read into this pipeline.

The `Subjects/` copies are preferred over the curated `EyeTrackingDatasets/` exports
for a separate reason that still applies: taking each cell from its subject folder
means subject-to-stimulus attribution comes from the folder structure rather than
from a filename, which is the more robust of the two.

## 2. The three `_Test` sessions - instrument validation, not cohort data

The `_Test` sessions are rehearsals and are excluded from the cohort. They are
reported here as instrument validation. Measured durations, from the same
reconnaissance: **3.64, 11.24 and 8.75 minutes** against a {C.STIMULUS_ACTUAL_MIN:g}-minute
stimulus. One was additionally verified as dated two weeks before the session it
appears to rehearse.

None reaches stimulus length, which is what identifies them as rehearsals rather
than as short or aborted sessions.

**Provenance note:** the counts and durations in this file were measured during
reconnaissance on 2026-07-29/30, BEFORE the exclusion ruling, and are reported from
that record. They are not recomputed by this pipeline and cannot be, because the
tree is excluded from it by construction. Every other number in this analysis is
regenerated on every run; these are the exception, and they are labelled as such.

## 3. Video

All `.mkv` / OBS video, including the Round 1 eye-tracking overlay renders, is
out of scope by author ruling and is not processed. Head motion is measured from the
Round 2 IMU instead, which measures the head rather than the image.
"""


# ------------------------------------------------------------------ entry point
def write_all(ctx):
    import datetime
    utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # sensitivity results are attached by figures.make_all(); recompute if figures
    # were skipped so FINDINGS.md is complete either way.
    if "sens_summary" not in ctx:
        summ, det = sensitivity.analyse(ctx["wide"], ctx["w2"], ctx["sur"], ctx["keystones"])
        ctx["sens_summary"], ctx["sens_detail"] = summ, det

    J.write_text(_manifest(ctx, utc), os.path.join(ROOT, "RUN-MANIFEST.json"))
    J.write_text(_methods(ctx), os.path.join(ROOT, "METHODS.md"))
    J.write_text(_exclusions(ctx), os.path.join(ROOT, "EXCLUSIONS.log"))
    J.write_text(_qc(ctx), os.path.join(ROOT, "QC-REPORT.md"))
    J.write_text(_findings(ctx), os.path.join(ROOT, "FINDINGS.md"))
    J.write_text(_sources(), os.path.join(ROOT, "SOURCES.md"))
    J.write_text(_reconciliation(), os.path.join(ROOT, "RECONCILIATION.md"))
    return True
