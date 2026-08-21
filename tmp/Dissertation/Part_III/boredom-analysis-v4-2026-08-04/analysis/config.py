"""Configuration for the N=12 Boredom Experiment analysis.

Every constant that affects a reported number lives here so RUN-MANIFEST.json can
record it and METHODS.md can be generated from it. Nothing here is read from the
environment or the wall clock.

Author rulings applied (2026-07-30), each tagged with the decision it implements:
  D1  S06 rate mismatch      -> compute BOTH variants (unified + as-is)
  D2  S07 Interesting        -> counts as valid data
  D3  HRV                    -> excluded, both rounds (measurement poisoned)
  D4  R2-01 INT timestamp    -> drop the outlier row, recompute the clock
  D5  blink threshold        -> <=500 ms per VanderWerf et al. 2003
  D6  EEG                    -> report every cell, no retention floor
  D7  interpreter            -> /home/dalton/.venv/bin/python only
  D8  output location        -> this tree
"""
import os

# ---------------------------------------------------------------- provenance
METHODOLOGY_OF_RECORD = "/home/dalton/projects/claudeflow-testing/scripts/boredom-o9"
R2_PARSER = "/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Part_III/boredom-o9-processing"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "out")
FIGS = os.path.join(HERE, "figures")

INTERPRETER = "/home/dalton/.venv/bin/python"

# ---------------------------------------------------------------- data roots
R1_ROOT = "/mnt/d/PhD/Dissertation/Boredom Experiment"
R2_ROOT = os.path.join(R1_ROOT, "Boredom Experiment Round 2")

# Author ruling 2026-07-30: ignore every file under VR Data Recorder.
EXCLUDED_TREES = [os.path.join(R2_ROOT, "VR Data Recorder")]

STIMULI = ("BOR", "CLC", "INT")
STIM_LONG = {"BOR": "Boring", "CLC": "Clinical", "INT": "Interesting"}
R1_SUBJECTS = tuple(f"S{i:02d}" for i in range(1, 9))
R2_SUBJECTS = tuple(f"R2-{i:02d}" for i in range(1, 5))
ALL_SUBJECTS = R1_SUBJECTS + R2_SUBJECTS

STIMULUS_ACTUAL_MIN = 17.0          # every stimulus is 17 minutes

# One survey answer reads "Halfway" rather than a number. Author-approved
# 2026-07-30 to be read as half the stimulus length. Recorded here rather than
# buried in the parser so METHODS.md states it and EXCLUSIONS.log can cite it.
HALFWAY_MIN = STIMULUS_ACTUAL_MIN / 2.0
HALFWAY_APPROVAL = ("author-approved 2026-07-30: 'Halfway' read as half of the "
                    "17-minute stimulus = 8.5 min")

# ---------------------------------------------------------------- D1: S06
# Round 1's cohort sampling rate, taken as the median of the 22 cells that are not
# S06 CLC/INT. S06's two fast cells are decimated to this rate for the "unified"
# variant; the "asis" variant leaves every cell at its native rate.
R1_COHORT_HZ = 2.994
S06_FAST_CELLS = (("S06", "CLC"), ("S06", "INT"))
RATE_VARIANTS = ("unified", "asis")
HIGH_RATE_FLAG_HZ = 50.0            # a Round 1 cell above this is off-regime

# ---------------------------------------------------------------- D5: blinks
# VanderWerf F, Brassinga P, Reits D, Aramideh M, Ongerboer de Visser B.
# "Eyelid movements: behavioral studies of blinking in humans under different
# stimulus conditions." J Neurophysiol 89(5):2784-96, 2003. doi:10.1152/jn.00557.2002
# Spontaneous blink total duration 334 +/- 67 ms, measured while subjects watched
# a video. Threshold = mean + ~2.5 SD, rounded to 500 ms.
BLINK_MEAN_MS = 334.0
BLINK_SD_MS = 67.0
BLINK_MAX_MS = 500.0
BLINK_SOURCE = ("VanderWerf et al. 2003, J Neurophysiol 89(5):2784-96, "
                "doi:10.1152/jn.00557.2002 - spontaneous blink 334 +/- 67 ms")

# Round 2 openness is reported by the vendor as 1 = open, 0 = closed. VERIFIED
# 2026-07-30 to be strictly BINARY: across all 12 cells and 3,416,362 per-eye
# samples the only values present are {0, 1}, with zero intermediate values. Any
# threshold in the open interval (0,1) therefore yields identical results, so the
# sensitivity sweep is redundant and is not run. Consequence: blink versus extended
# closure is decided ENTIRELY by duration, i.e. by BLINK_MAX_MS below.
OPENNESS_CLOSED_BELOW = 0.5
OPENNESS_IS_BINARY = True

# Round 2 has no crop re-export, so its recordings include the periods before the
# headset is fitted and after it is removed. Those appear as a single long block of
# openness=0 carrying a GOOD quality flag. Measured: 9 of 12 cells put their longest
# closure in the final 3% of the recording and all 12 last 27-36 s, which is an
# instrument signature rather than a physiological one. A boundary-adjacent closure
# longer than HEADSET_TRIM_MIN_S that begins or ends within HEADSET_TRIM_BOUNDARY_S
# of a recording edge is treated as non-wear and trimmed, producing the *_trimmed
# openness columns. The untrimmed columns are retained unchanged because the locked
# pooled eye-closure check is defined against them.
HEADSET_TRIM_MIN_S = 20.0
HEADSET_TRIM_BOUNDARY_S = 60.0

# ------------------------------------------------- v2: crops, windows, deferrals
# Author ruling D-01 (2026-07-31). Round 2 was re-cropped: each session now carries
# _Crop.csv files whose window runs from the instructed-closure reopen + 5 s to the
# closing-closure onset - 2 s, on the eye-tracker clock, with t_rel_s giving a
# common zero across every stream. The headset on/off periods are therefore outside
# the window BY CONSTRUCTION and the non-wear trim above is retired; the constants
# are kept only so the retirement is legible in this file.
R2_CROP_ONLY = True

# Author ruling D-05. Round 1's window is the middle ~13.6 min of the 17-minute
# film: ~2 minutes were cut inside each 30 s instructed closure as a sync guard,
# the protocol not yet being settled. Round 2's crop is essentially the whole film.
# Both Round 2 windows are computed and reported so the difference is visible
# rather than assumed away. (start_trim, end_trim) in seconds; None = no trim.
R1_MATCH_TRIM_S = 120.0
R2_WINDOWS = {
    "full":      (None, None),
    "r1matched": (R1_MATCH_TRIM_S, R1_MATCH_TRIM_S),
}
R2_PRIMARY_WINDOW = "full"

# Author ruling R-03 (2026-07-31): IMU head motion is DEFERRED, to be revisited
# after the section is drafted. Not read in this pass. Flipping this to True
# restores it without any other change.
ANALYSE_IMU = False

# Author rulings R-01 / R-02 (2026-07-31). Cognitive load is vendor-computed from
# undisclosed inputs; heart rate and HRV failed for some participants owing to
# facial and head structure. All three are reported in an appendix for interest and
# NO dissertation claim may rest on them. They are still computed, so the appendix
# is generated from the run rather than asserted.
REPORT_ONLY_CHANNELS = ("cognitive_load", "hr", "hrv", "imu_motion")

# Round 1 encodes closure as -1 in the per-eye columns F/G (dilL/dilR).
R1_CLOSED_SENTINEL = -1.0

# A blink cannot be resolved below this rate: you need at least two samples inside
# a 334 ms event, i.e. ~6 Hz as an absolute floor, 20 Hz to measure it honestly.
BLINK_MIN_RESOLVABLE_HZ = 20.0

# Author ruling R-09 (2026-07-31). Keyed (subject, stimulus, field) -> reason.
VOID_SURVEY_ANSWERS = {
    ("S04", "BOR", "minutes_until_bored"):
        ("author ruling 2026-07-31: answer void - the participant did not know the "
         "item allowed 0 or not-applicable. Her other answers on this film (boredom 1, "
         "engagement 7, felt duration 8 min of 17, fatigue 7->1) place her in the "
         "never-became-bored category, which is where it is retained"),
}

# ---------------------------------------------------------------- D3: HRV
EXCLUDE_HRV = True
HRV_EXCLUSION_REASON = ("author ruling 2026-07-30: HRV is a poisoned measurement - "
                        "some subjects' head structure precluded accurate capture. "
                        "Applies to BOTH rounds, the cause being anatomical and "
                        "round-independent.")

# ---------------------------------------------------------------- statistics
ALPHA = 0.05
DESCRIPTIVE_N_BELOW = 6             # label any result below this n descriptive
WILCOXON_FLOOR_N4 = 0.125           # the strongest obtainable p at n=4

# Which surfaces may be pooled across rounds, and why. Consumed verbatim by the
# poolable flag and by METHODS.md.
POOLABLE = {
    "pupil_dilation":  (True,  "mean of a per-sample value; robust to sampling rate"),
    "eye_openness":    (True,  "time-fraction/mean; robust to sampling rate"),
    "cognitive_load":  (True,  "mean of a vendor index; robust to sampling rate"),
    "hr":              (True,  "mean of a vendor index; robust to sampling rate"),
    "gaze_dev_variance": (False, "variance of a 5-point rolling median: rate-dependent. "
                                 "Decimating Round 2 from 120 Hz to Round 1's ~3.3 Hz "
                                 "moves it by 0.65-0.84x (mean 0.74)"),
    "gaze_dev_median": (False, "windowed statistic over a 5-point rolling median; "
                               "the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz"),
    "blink_rate":      (False, "Round 1's 334 ms sampling interval equals the mean blink "
                               "duration, so blinks are unresolvable there; Round 2 only"),
    "closure_episodes": (False, "episode segmentation depends on sampling rate"),
    "imu_motion":      (False, "Round 2 only; no Round 1 equivalent"),
    "self_report":     (True,  "the same 7-item instrument was administered in both "
                               "rounds; no instrument change, so the items pool"),
    "hrv":             (False, "excluded from both rounds by author ruling"),
}

# Round 1's openness proxy is a percentage (0-100); Round 2's is a fraction (0-1).
# They must be brought onto one scale before any pooled signed-rank test, because
# Wilcoxon ranks the MAGNITUDE of differences and mixed units silently re-weight
# subjects. Verified: rescaling reproduces the locked rb=-0.97 / p=0.0010;
# leaving Round 1 at 0-100 gives rb=-0.872 / p=0.0049.
R1_OPENNESS_SCALE = 1.0 / 100.0

# ---------------------------------------------------------------- determinism
SEED = 20260730
# Within-subject permutation resamples for criterion validity. The reported p for
# every criterion test is a permutation p, because the 36 paired points are 12
# participants contributing 3 each and the analytic p assumes independence.
PERMUTATIONS = 20000
FLOAT_PRECISION = 12                # decimals written to CSV, for byte-identity
CSV_FLOAT_FMT = f"%.{FLOAT_PRECISION}g"

# ---------------------------------------------------------------- timelines
# Per-sample series are consumed inside r1/r2.extract() and discarded, so the
# figure suite rebuilds them through series.py. Two grids, because episode
# lengths are not comparable: Round 1 crop windows run 661-914 s while Round 2
# full recordings run 1099-2430 s (R2-03's Interesting is the 40.5-minute
# session flagged in the spec).
#   absolute   TIMELINE_BIN_S bins from episode start, on that cell's own clock.
#              Per-subject panels use this, so shaded closures land where they
#              actually occurred.
#   normalised TIMELINE_NORM_BINS bins across 0-100% of the episode. The cohort
#              envelope uses this, being the only honest way to overlay subjects
#              whose episodes differ by a factor of nearly four.
TIMELINE_BIN_S = 1.0
TIMELINE_NORM_BINS = 100
# Round 1 timelines are built on the unified rate variant so the plotted series
# is the one the reported statistics were computed from.
TIMELINE_VARIANT = "unified"

# ---------------------------------------------------------------- figures
# Okabe-Ito, colour-blind safe. Fixed across the entire suite.
STIM_COLOR = {"BOR": "#D55E00", "CLC": "#0072B2", "INT": "#009E73"}
ROUND_MARKER = {1: "o", 2: "^"}
ROUND_LABEL = {1: "Round 1 (N=8)", 2: "Round 2 (N=4)"}
FIG_DPI = 200
FIG_FORMATS = ("pdf", "png")

# ---------------------------------------------------------------- locked checks
# A run that does not reproduce these has a bug. Re-verified 2026-07-30.
VERIFICATION_CHECKS = [
    dict(key="r1_pupil", label="Round 1 pupil dilation", n=8, direction="8/8 Boring < Clinical",
         friedman_p=0.0302, wilcoxon_p=0.0078, rb=-1.00),
    dict(key="r1_openness", label="Round 1 eye-closure", n=8, direction="7/8 Boring lowest",
         friedman_p=0.0076, wilcoxon_p=0.0156, rb=-0.94),
    # RE-BASELINED 2026-07-31. The v1 values below were locked against Round 2 as it
    # stood BEFORE the re-crop (pooled pupil 0.0458/0.0093/-0.82 at 10/12; pooled
    # eye-closure 0.0004/0.0010/-0.97 at 11/12) and cannot survive a change in the
    # analysis window. They are re-derived from the first v2 run and carry
    # rebaseline=True so they report without aborting. The two Round-1-only checks
    # above are UNCHANGED and are the proof that nothing drifted in Round 1.
    dict(key="pooled_pupil", label="Pooled pupil", n=12, direction="10/12",
         friedman_p=0.0458, wilcoxon_p=0.0093, rb=-0.82, rebaseline=True),
    dict(key="pooled_openness", label="Pooled eye-closure", n=12, direction="11/12",
         friedman_p=0.0004, wilcoxon_p=0.0010, rb=-0.97, rebaseline=True),
]
CHECK_TOL = 5e-5                    # p-values are compared at 4dp as published
RB_TOL = 5e-3
