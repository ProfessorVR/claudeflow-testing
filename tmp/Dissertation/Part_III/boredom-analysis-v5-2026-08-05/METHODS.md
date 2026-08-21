# METHODS

Generated from the run. Every formula, mask and window below is the one the code
actually applied; the counts are the counts that actually survived. This document
is intended to be complete enough to reimplement the analysis from alone.

## 0. Provenance and the one rule that governs the code layout

Feature definitions come from the **methodology of record**, `/home/dalton/projects/claudeflow-testing/scripts/boredom-o9`,
which produced the Round 1 results already in the dissertation. It is imported, never
edited and never copied: editing it would invalidate the four correctness checks that
are defined against its behavior, and copying its functions would fork the definitions
and guarantee drift. Where a helper was not usable as written it was WRAPPED. The
wrappers are reproduced verbatim in section 9.

Round 2's parser (`ch_hmd_r2.py`) is this project's own work and may be extended;
extensions live in `analysis/r2.py`, not in that file.

## 1. Cohort and windows

- Round 1: 8 subjects `S01`-`S08`, 24 subject x stimulus cells.
- Round 2: 4 subjects `R2-01`-`R2-04`, 12 cells.
- Stimuli: BOR (Boring), CLC (Clinical), INT (Interesting), 17 minutes each.
- Subject labels are derived at runtime from sorted folder order via
  `common.subject_map()`. The name-to-label crosswalk is never persisted.

**Window rule - crop only, no fallback.** Every Round 1 cell is read from its `_Crop`
export. `adapters.run_ch_hmd()` verifies all 24 crops exist BEFORE running and aborts
if one is missing, rather than letting the record's `path = crop or full` fall back to
the full recording; it re-checks the QC table afterwards. Crop resolution follows two
rules: prefer the plain `_Crop` over a `_Crop 2` duplicate, and read the `.xlsx` crop
where that is the only form.

Round 1 crop durations: mean 818.0 s, range 661.1-973.7 s.
Round 2 has no crop re-export, so its recordings are full-window: mean 1038.9 s, range 1013.2-1167.8 s. This is the origin of the non-wear artifact handled in section 5.

## 2. Sampling rates, and why nothing rate-dependent is pooled

- Round 1 effective rate: median 3.00 Hz (range 2.79-3.00 Hz after harmonization).
- Round 2 effective rate: median 120.1 Hz (range 120.0-120.1 Hz).

The two rounds differ by a factor of roughly 40. Variances, dispersions and any
windowed statistic are rate-dependent: recomputing the identical gaze-deviation
feature on Round 2 decimated to Round 1's effective rate moves it by 0.65-0.84x.
Means of per-sample values (pupil, cognitive load, HR, openness fraction) are robust.
Every reported statistic therefore carries a `poolable` flag and a one-line reason:

| quantity | poolable | reason |
|---|---|---|
| `blink_rate` | **NO** | Round 1's 334 ms sampling interval equals the mean blink duration, so blinks are unresolvable there; Round 2 only |
| `closure_episodes` | **NO** | episode segmentation depends on sampling rate |
| `cognitive_load` | yes | mean of a vendor index; robust to sampling rate |
| `eye_closure` | yes | time-fraction/mean; robust to sampling rate |
| `eye_openness` | yes | time-fraction/mean; robust to sampling rate |
| `gaze_dev_median` | **NO** | windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz |
| `gaze_dev_variance` | **NO** | variance of a 5-point rolling median: rate-dependent. Decimating Round 2 from 120 Hz to Round 1's ~3.3 Hz moves it by 0.65-0.84x (mean 0.74) |
| `hr` | yes | mean of a vendor index; robust to sampling rate |
| `hrv` | **NO** | excluded from both rounds by author ruling |
| `imu_motion` | **NO** | Round 2 only; no Round 1 equivalent |
| `pupil_dilation` | yes | mean of a per-sample value; robust to sampling rate |
| `self_report` | yes | the same 7-item instrument was administered in both rounds; no instrument change, so the items pool |

**Scale harmonization.** Round 1's openness proxy is a percentage (0-100) and Round
2's is a fraction (0-1). They are brought onto one scale (`R1_OPENNESS_SCALE = 0.01`) before any pooled signed-rank test, because Wilcoxon ranks
the MAGNITUDE of paired differences and mixed units silently re-weight subjects.
Rescaled reproduces the locked rb=-0.974 / p=0.0010; leaving Round 1 at 0-100 gives
rb=-0.872 / p=0.0049.

## 3. Derived quantities

### 3.1 Pupil dilation

Round 1: columns `dilL`/`dilR`, masked to NaN where the per-eye validity flag is not 1
or the value is <= -0.5 (the vendor's eyes-closed sentinel is -1). Round 2:
`left/dilation` and `right/dilation`, masked where the paired `_q` quality column is
<= 0 or the value is <= 0. Bilateral value = `nanmean(mean(left), mean(right))`.
Surviving: Round 1 mean 82.5% of samples carry valid eye data (range 21.2-95.4%); Round 2 mean 91.3% valid gaze.

### 3.2 Eye openness and closure

Treated as a headline surface, not as QC.

Round 1 has no continuous openness channel, so the per-sample **validity flag**
`validL & validR` is the proxy, aggregated as `pct_valid_eye`. The proxy is licensed
by a check inside Round 2, where both measures exist: the validity proxy and the
vendor's continuous openness correlate at Pearson r=0.998 across the 12 Round 2 cells.

Round 1 **closure episodes** are read separately, from the per-eye -1 sentinel in
`dilL`/`dilR`, because `parse_window()` masks those to NaN - correct for pupil, fatal
for closure. An episode is a maximal run where BOTH eyes read -1.

Round 2 openness is the vendor's per-eye `openness` channel. VERIFIED BINARY: across all 12 cells and 3,416,362 per-eye samples the only values present are {0, 1}, with no intermediate value. Any threshold in the open interval (0,1) therefore gives identical results, so `OPENNESS_CLOSED_BELOW = 0.5` is not a tuned parameter and the sensitivity sweep over it is redundant and was not run. The consequence is important: blink versus extended closure rests ENTIRELY on duration.

**Blink ceiling.** A closure of <= 500 ms is a blink; anything longer
is an extended closure. Source: VanderWerf et al. 2003, J Neurophysiol 89(5):2784-96, doi:10.1152/jn.00557.2002 - spontaneous blink 334 +/- 67 ms, i.e. mean + ~2.5 SD, rounded. Those
blinks were recorded while subjects watched video, which matches this paradigm.

Episode counts: Round 1 4365 episodes (3501 blink-length, 864 extended); Round 2 5131 episodes (4895 blink, 236 extended).

**Blink RATE is not computed for Round 1, and the reason is arithmetic.** Round 1's
median sampling interval is ~334 ms, which is the mean duration
of a spontaneous blink (334 ms). A blink occupies 0-1 samples there,
so it is unresolvable at any threshold; 20 Hz is the floor
for measuring one honestly. Blink rate is a Round 2 (120 Hz) measure only.

### 3.3 Gaze deviation

Per the ASEE 2024 feature: Euclidean distance of the combined gaze vector from the
per-file MEDIAN gaze direction, then a 5-point centered rolling median
(`min_periods=1`). Reported as that series' median and its variance (sd**2).
Invalid rows (validity flag not 1, or the X=-1 sentinel) are masked before the median
is taken. **Computed per round and never pooled.**

### 3.4 Cognitive load, HR, HRV

Vendor indices. Zero and negative values are the vendor's 'no reading' sentinel and are
masked to NaN BEFORE any aggregate. Round 2 keeps these in separate files with their own
timestamps; the 8-column HRV/cognitive-load collision is closed in
`adapters.r2_collect()`, which requires filename prefix AND header agreement rather than
column count alone.

**HRV is excluded from BOTH rounds.** author ruling 2026-07-30: HRV is a poisoned measurement - some subjects' head structure precluded accurate capture. Applies to BOTH rounds, the cause being anatomical and round-independent. The channel is still read
so the exclusion is logged per cell with a row count rather than passed over in silence,
and it is fully recoverable by setting `EXCLUDE_HRV = False`. Round 1 HRV sat at
Friedman p=0.6065 before exclusion.

### 3.5 IMU head motion (Round 2 only) - DEFERRED

Author ruling 2026-07-31: head motion is DEFERRED and is not read in this pass.
The IMU streams are present in 9 of the 12 Round 2 cells and the accelerometer and
gyroscope magnitudes remain computable, but a within-subject three-way comparison
needs all three films from one participant and only one participant has that, so the
channel could not carry a cohort statistic in any case. It is not a limitation of the
sensor: head movement is plainly visible in the session video, and the eye-tracking
channels are blind to it because both rounds record gaze as EYE-IN-HEAD. Setting
`ANALYSE_IMU = True` restores the computation without any other change.

### 3.6 Within-episode time course

First / middle / last third means for every channel, computed on the non-missing samples
in acquisition order (`third1`, `third2`, `third3` in the long tables), plus
`delta_last_first_third` and an OLS slope against time for HR and cognitive load.

For the figure suite the per-sample series are rebinned by `series.py` onto a
1 s absolute grid and a 100-bin normalized grid.
This retains series the summary tables discard; it does not redefine any feature - the
same parsers produce the values.

## 4. Rate harmonization (author decision D1)

S06's Clinical and Interesting cells sample far above the Round 1 regime, so that
subject's own three-way comparison would otherwise contrast two different instruments.
BOTH variants are computed and both are reported:

- `unified`: the off-regime cells are decimated to the cohort rate (2.994 Hz) by taking every step-th RAW row, `step = round(native/target)`, BEFORE `parse_window()`, so every downstream feature is computed by the record's own code on the thinned series.
- `asis`: every cell at its native rate.

Cells actually decimated in the `unified` variant:

| cell | native median Hz | step | effective Hz after |
|---|---|---|---|
| S06 CLC | 2.8 | 37 | 2.79 |
| S06 INT | 2.9 | 42 | 2.86 |

Only those cells differ between variants; the other 22 are identical. The measured within-Round-1 decimation factors fall inside the 0.65-0.84 band measured across rounds, which independently confirms the no-pooling rule.

## 5. Round 2 windows (the non-wear trim is RETIRED)

Round 2 was re-cropped on 2026-07-31. Each session now carries `_Crop.csv` files whose
window runs from the reopening of the instructed start closure + 5 s to the onset of the
instructed end closure - 2 s, on the eye-tracker clock, with `t_rel_s` giving a common
zero across every stream of a session. The film itself began when participants were told
to open their eyes and stopped when they were told to close them, so the window IS the
stimulus interval. The headset on/off periods fall outside it by construction and the
heuristic non-wear trim that preceded this is retired; it agreed closely with the crop
where both exist, which is why the earlier conclusions were not artifacts of it.

Two windows are computed and reported:

| window | rule | Round 2 duration |
|---|---|---|
| `full` | the crop as delivered | mean 1038.9 s, range 1013.2-1167.8 s |
| `r1matched` | crop minus 120 s from each end | mean 798.9 s, range 773.2-927.8 s |

The second exists because the two rounds cut their windows differently. Round 1 removed
roughly two minutes inside each 30 s instructed closure as a sync guard, the protocol
not yet being settled, so its window is the middle ~13.6 minutes of a 17-minute film;
Round 2's crop is essentially the whole of it. Since closure accumulates across an
episode, that difference is not neutral, and it is measured rather than assumed away:
`full` is the primary window for every pooled statistic and both are
carried through the same tests in `window-comparison.csv`.

## 6. Self-report instrument

Seven items per episode: fatigue-prior, boredom (1-9), engagement (1-9), minutes-until-
bored, sleep-fight, felt duration, fatigue-after. Boredom and engagement are asked as
**two separate items, not a bipolar axis**; that design choice is what makes
within-instrument divergence visible.

Derived: `felt_duration_ratio = felt / 17`; `depletion = fatigue_after - fatigue_prior`;
`divergent_selfreport = boredom >= 5 AND engagement >= 5`.

The surveys are free text and inconsistently formatted, so the parser is defensive and
nothing is coerced silently. Every value carries a confidence flag:

| confidence | meaning | n values |
|---|---|---|
| `exact` | a bare number in the expected range | 239 |
| `converted` | a unit or range was interpreted (25 sec -> 0.42 min; 10-12 -> 11) | 5 |
| `flagged` | a number was recovered from surrounding prose | 1 |
| `semantic` | a non-numeric answer carrying meaning (NA on minutes-until-bored means the subject never became bored - data, not absence) | 7 |

Every interpreted value is written to EXCLUSIONS.log with its raw string. One answer
reading 'Halfway' was read as 8.5 min (author-approved 2026-07-30: 'Halfway' read as half of the 17-minute stimulus = 8.5 min).

`minutes_until_bored` has structural missingness: subjects who never became bored are
absent BY DESIGN, not by failure. Those cells are retained as a category and are neither
imputed nor treated as zero, so n is reduced for that item and the test is on the
subjects who did become bored.

**Viewing order** is derived from recording start timestamps rather than trusted to the
survey headings, and validated against the headings that state it independently.

**Prior exposure** counts a subject as exposed only where the folder carries the (Med)
medical-student marker or the survey states experience explicitly; silence counts as no
exposure.

## 7. Statistics

Within-subject design throughout.

- **Friedman** omnibus across the three stimuli, on complete cases only.
- **Wilcoxon signed-rank** for each of the three pairwise contrasts.
- **Holm** step-down correction across the pairwise family within each surface x scope, with monotonicity enforced. alpha = 0.05.
- **Effect size**: matched-pairs rank-biserial, from `ch_stats.rank_biserial()` unchanged.
- **Within-subject z**: each subject's stimulus scored against their own three-video
  mean and sd, reported alongside raw units, never instead of them.

**Small-N honesty.** Any result with n < 6 is labeled
DESCRIPTIVE. At n=4 the Wilcoxon floor is p=0.125, so perfect separation
is the strongest obtainable result and is stated as such wherever it applies.

**Standing reporting rule.** The evidence is the directional convergence across channels
plus the specific surfaces that reach significance - never per-channel significance for
channels that do not reach it. Nothing is omitted for being non-significant.

### The engaged composite

Composite A, the primary composite, is the mean of the within-subject z of
eye closure and gaze deviation (per-participant baseline) - the 2 channels that run in the engagement direction,
are poolable across rounds, and survive Holm correction. Both are computed here from raw
per-sample data rather than taken from a vendor index.

NOT in it: , removed from the primary composite by author ruling R-01
(vendor-computed from undisclosed inputs) and retained in the sensitivity space only; and
gaze deviation, which is rate-dependent while the composite spans both rounds. Composite B
adds gaze amplitude and is computed within each round, never pooled.

Because a single reverse case turns on this choice, `sensitivity.py` recomputes the whole
decomposition under all 3 non-empty subsets of the 2 poolable
engagement channels, and asserts on every run that the baseline subset reproduces
`crossref.keystone()` exactly. The non-wear trim is retired with the re-cropped Round 2
data (D-01), so the sweep runs one trim variant rather than two.

## 8. EEG

Analyzed in full and reported including its negatives, then dropped per the framing
ruling. Band power from `ch_eeg.py` unmodified: 4 channels F3/F4/P3/P4 at 200 Hz,
1-35 Hz bandpass, 60 Hz notch, 2 s epochs, 6-MAD artifact rejection, alpha 8-12 Hz,
theta 4-8 Hz, DMN = alpha + theta averaged over the four channels. Round 2 has no EEG,
so this channel is N=8 permanently.

**No cell is excluded for being noisy.** The retention and artifact figures ARE the
evidence for the ruling that EEG was too noisy to carry a finding; removing the worst
cells would remove the justification.

The reported noise quantity is the **artifact-to-clean variance ratio**: mean variance of
the epochs the 6-MAD rule rejected over mean variance of those it retained. It is
deliberately not called SNR - rejection targets high-amplitude excursions, so rejected
epochs carry more variance by construction and a conventional SNR would be below 1 by
definition, which says nothing.

## 9. Wrappers over the methodology of record

9 wrappers. Reproduced verbatim, each with the reason it exists.
Nothing in `scripts/boredom-o9/` was modified.

### 9.1 `run_ch_hmd(outdir)`

ch_hmd.main() writes to a module-level OUT that is .gitignored and absent. The wrapper rebinds ch_hmd.OUT to this run's out/ directory and calls main() unmodified, so the feature code path is byte-for-byte the one that produced the dissertation's Round 1 numbers. Nothing is written into scripts/boredom-o9/.

### 9.2 `run_ch_eeg(outdir)`

Same OUT-rebinding as run_ch_hmd, plus a numpy compatibility shim. ch_eeg.bandpower() calls np.trapezoid, which exists only in NumPy >= 2.0; the run interpreter carries NumPy 1.26.4, where the identical function is named np.trapz (np.trapezoid IS the 2.0 rename of np.trapz, same implementation). The shim aliases the new name to the old for the duration of the call and is removed afterwards. VERIFIED numerically: band powers computed under NumPy 1.26.4 + shim are bit-identical to those computed under NumPy 2.2.6's native np.trapezoid. ch_eeg.py is not edited.

### 9.3 `surface_table(frame, column)`

ch_stats.wide() reads a CSV from its own OUT by filename. The wrapper takes an in-memory DataFrame instead, so the same pivot (index=subject, columns=stimulus, aggfunc='first', reindexed to BOR/CLC/INT) is applied to tables this run builds - including pooled and rate-variant tables that have no file in ch_stats' directory.

### 9.4 `r1_cell_frame(sid, stim, path)`

ch_hmd.main() consumes parse_window() inline and emits only summary rows, so per-sample series are unreachable for time-course figures, closure episodes and rate decimation. The wrapper calls the SAME read_hmd() and parse_window() and returns their per-sample output instead of aggregating it. No feature definition is re-implemented.

### 9.5 `decimate_r1_cell(raw, target_hz, native_hz)`

Implements author decision D1 for S06's two off-regime cells. Mirrors the step rule already used by ch_hmd_r2.gaze_dev(decimate_to=...): step = round(native/target), take every step-th row. Applied to the RAW rows before parse_window(), so every downstream feature is computed by the record's own code on the thinned series.

### 9.6 `r2_collect(subject_path)`

ch_hmd_r2.collect() identifies streams by column count alone, and HRV files carry 8 columns exactly like cognitive-load files. It is currently saved only by 'largest file wins' - verified, all 12 cells select a CL- file - but that is magnitude luck, and in one recorder session the HRV file IS classified as cognitive load. The wrapper requires filename prefix AND header agreement before accepting a stream.

### 9.7 `r2_collect(subject_path)`

Round 2 crop-only collector (author ruling D-01/D-03, 2026-07-31). Reads ONLY files whose name carries _Crop, mirroring Round 1's crop-only rule, and identifies each stream by its FILENAME PREFIX alone rather than by column count. Column counts became unusable when cropping appended t_rel_s to every file (32->33, 16->17, 8->9, 7->8) and they never separated cognitive load from HRV, which share a count in both the original and the cropped form. Every file names its own measurement, so the filename is the reliable key. HRV is recognized in order to be rejected and logged.

### 9.8 `r2_time_seconds(df)`

Implements author decision D4. ch_hmd_r2.tsec() subtracts the raw minimum of the timestamp column; R2-01's Interesting file carries one row with ts/sys = 17, which makes that cell read 1.7e9 s and collapses its time axis. The wrapper drops timestamp rows more than 1e12 us from the median before rebasing, and reports how many it dropped so the exclusion is logged rather than silent. Cells with no outlier are numerically identical to ch_hmd_r2.tsec().

### 9.9 `gaze_dev(gx, gy, gz, decimate_to)`

Re-exported from ch_hmd_r2 unchanged. Identical in definition to the record's inline Round 1 computation: Euclidean distance of combined gaze from the per-file MEDIAN gaze direction, then a 5-point centered rolling median with min_periods=1; variance = sd**2.

