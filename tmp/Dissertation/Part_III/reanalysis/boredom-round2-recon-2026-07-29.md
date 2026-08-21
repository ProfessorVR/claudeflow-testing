# Boredom Experiment — ROUND 2 recon (2026-07-29)

**Source:** `/mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2` · 35 GB · read-only recon,
nothing modified. Subjects labelled **R2-01…R2-04** by sorted folder order (labelling scheme is an open decision —
see §6). PII: no participant name appears in this file.

**Author fact (2026-07-29):** "the second round we finally got all of the sensors polling correctly at 120 Hz
threshold from every sensor attached." **Verified** — see §3.

---

## 1. What Round 2 is

**Four subjects**, sessions dated March 2024, recorded with the **raw HP Omnicept SDK export** rather than the
aggregated CSV of Round 1. Per-sensor files with header rows, microsecond epoch timestamps.

| | R2-01 | R2-02 | R2-03 | R2-04 |
|---|---|---|---|---|
| size | 8.0 GB | 348 MB | 15.9 GB | 7.9 GB |
| eye gaze + openness (32-col) | 3 | 3 | 3 | 3 |
| IMU acc + gyro (16-col) | 2 | 2 | 2 | 3 |
| cognitive-load (8-col) | 6 | 5 | 6 | 6 |
| HR (7-col) | 3 | 2 | 3 | 3 |
| session video `.mkv` | 3 | **0** | 4 | 3 |
| survey `.txt` | 1 | **0** | 1 | 1 |

**There is no EEG and no MATLAB `.fig` material anywhere in Round 2.** EEG therefore stays at N=8.

## 2. The two channels Round 2 adds that we did not have

- **IMU accelerometer + gyroscope — head motion, directly measured.** This is precisely the head-restlessness
  signal that `ch-obs` was probe-closed for failing to deliver (the black-void optical-flow confound). The IMU has
  none of that problem: it measures the head, not the image. **It supersedes the ch-obs rationale entirely.**
- **Eye openness** (per-eye, in the 32-column stream) — blink / eye-closure, which the boredom cluster's
  construct-measure concordance records as **documented NON-COVERAGE** for this dataset. That gap is now fillable.

Also newly available at the raw level: per-eye gaze with quality flags (the 32-column stream carries
`cgaze/x,y,z,q`, `left/gaze/…`, `left/open`, and right-eye equivalents), and cognitive load with its standard
deviation rather than a bare index.

## 3. Sampling rate — verified, and it is the critical caveat

Measured across all 12 `EyeTrackingDatasets` files from the timestamp column:

- **Uniform 120.0 Hz**, every file. dt percentiles p10/p50/p90 ≈ **7.1 / 8.33 / 8.85 ms**; 8.33 ms is exactly 1/120 s.
- **Round 1, for contrast** (per the O-9 scoping plan): bursty and bimodal — ~8 ms bursts spaced ~300 ms apart,
  giving ~5.7 Hz by mean-dt and ~3.3 Hz by median-dt, with one subject an ~88 Hz outlier.

**Consequence: gaze variance cannot be pooled across rounds.** P2's published feature is the *variance of a
5-point-median Euclidean deviation from centre*. Five samples span ~42 ms at 120 Hz and ~1.5 s at 3.3 Hz — these are
not the same measurement, and the second is not the feature the paper defines. This is also the most likely
explanation for why gaze variance came out non-significant at N=8 (p=0.61): **Round 1's telemetry could not support
the feature.** Pupil and cognitive-load *means* are far less sampling-sensitive than a variance, so pooling those is
defensible with an explicit statement; a pooled gaze variance would not be.

## 4. Format incompatibility

`scripts/boredom-o9/ch_hmd.py` **cannot read Round 2.** Round 1 is headerless, 12 columns, wall-clock H/M/S/ms, with
a gaze *unit vector* packed into a string field and a `-1` invalid sentinel. Round 2 is header-bearing, split across
four per-sensor file types, on microsecond epoch timestamps. A new parser is required — not a patch.

## 5. Data-quality flags found

- **4 zero-byte CSVs**, all inside the recorder tree. Application artifacts, **not lost subject data.**
- **One eye file has a corrupted duration span** (timestamp discontinuity / epoch mix — apparent span 1.7 × 10⁹ s);
  its median rate is a normal 120.1 Hz, so the payload looks sound and only the min/max span is affected. Needs a
  per-file QC rule.
- **One session runs 40.5 min** against the others' 18–22 min.
- **R2-02 has no video and no survey**, and is an order of magnitude smaller than its peers (348 MB).
- **The recorder tree holds 16 session folders; `Subjects/` organises 12** (4 subjects × 3 stimuli). First-1 MB md5
  comparison: **43 of 70** distinct recorder CSVs duplicate the organised copies, so **27 do not.** The recorder tree
  is therefore the *fuller* raw source and `Subjects/` is a partial organisation of it — reconcile before treating
  `Subjects/` as complete.
- **The 8 root-level survey `.txt` files resolve to 6 distinct people**, of whom only 1 matches an R2 subject folder
  on a crude first-token match, and none matches a Round-1 folder. **My name matching is unreliable and this needs the
  author's eye** — it may be a formatting difference rather than five unaccounted-for people.

## 6. Open decisions this raises

1. **Labelling.** Round 1 subjects are S01–S08 by sorted folder order. Round 2 needs labels that do not disturb that
   crosswalk — recommend **R2-01…R2-04** (used here) over S09–S12, because the two rounds differ in instrument and
   sampling and should never be silently pooled.
2. **Scope.** Does the laboratory section absorb Round 2 at all, given the deadline? See the recommendation below.
3. **The survey-file question** in §5.
4. Whether the `.ipynb` (below) is the provenance of P2's published analysis, which would make it a method source
   rather than a working file.

---

## 7. THE FILE LIST

### Relevant — the data
| # | What | Where | Size | Verdict |
|---|---|---|---|---|
| 1 | **12 eye-tracking CSVs**, one header, 4 subjects × 3 stimuli, verified 120 Hz. Combined + per-eye gaze, quality flags, **eye openness** | `EyeTrackingDatasets/EyeTrackingDatasets/` | 362 MB | **HIGHEST VALUE — analysis-ready** |
| 2 | **55 per-subject CSVs** organised by session: eye (12), **IMU (9)**, cognitive-load (23), HR (11) | `Subjects/<4>/` | 32 GB | **Keep — the only home of the IMU streams** |
| 3 | **70 non-empty CSVs / 16 session folders** — 43 duplicate #2, **27 do not** | `VR Data Recorder/…/Data…/` | 1.47 GB | **Keep pending reconciliation** — fuller raw source |
| 4 | **8 survey `.txt`** (self-report instrument) | Round-2 root | 17 KB | **Keep — but identity needs checking (§5)** |
| 5 | **1 `.ipynb`** eye-tracking analysis notebook (pandas/numpy/scipy/sklearn; 21 mentions each of pupil and gaze) | Round-2 root | 386 KB | **Keep as method documentation** |
| 6 | **10 session `.mkv`** | `Subjects/<3 of 4>/` | ~30 GB | **Out of scope** (author-ruled: videos set aside) — listed for completeness |

### Not useful — the application install
The `VR Data Recorder` binaries: **168 `.dll` · 32 `.pdb` · 2 `.exe` · 7 `.config` · 3 each `.aspx`/`.browser`/`.ress`/`.assets`/`.map` · 1 each `.xml`/`.resource`/`.mdb`/`.ini`/`.info`/`.asset`** — 241 files, ~146 MB. Plus the 4 zero-byte CSVs. **Nothing to process; do not delete blindly** (the `.mdb` and `.config` may document the recorder's own settings, i.e. how the 120 Hz polling was configured).

---

## 8. Recommendation

**The single highest-value, lowest-cost move is item #1 alone.** Twelve clean 120 Hz eye-tracking files, one uniform
header, already split per subject and per stimulus — a parser plus pupil and gaze features is a few hours, and it
would take **pupil to N=12, matching P2's published cohort**, on data that actually supports the feature definitions.

**Item #2's IMU is the more interesting prize** and it retires a limitation rather than adding a number: it supplies
the visible-restlessness channel the section currently declares unobtainable. But it is a second parser against a
third file format, and it applies to only 4 of 12 subjects — so it cannot support a cohort-level claim, only a
four-subject demonstration that the measure is available.

**Against the deadline,** the honest ordering is: #1 if anything, #2 only if the restlessness channel is judged worth
a four-subject scope, and #3–#5 as record-keeping. Round 2 does not change the corrected keystone — that rests on
physiology-versus-self-report at N=8 and is unaffected — so none of this is load-bearing for the section's argument.
It would strengthen the statistics, not the claim.

---

# ROUND 2 PROCESSED (2026-07-29) — same methodology, N=4

Parser `boredom-o9-processing/ch_hmd_r2.py`, mirroring `scripts/boredom-o9/ch_hmd.py` definition for definition:
gaze deviation = Euclidean distance of combined gaze from the per-file median gaze direction, 5-point **centered**
rolling median (min_periods=1); `gaze_dev_variance` = sd²; `dil_mean_bilateral` = nanmean of per-eye means; vendor
sentinels masked before any aggregate; per-signal mean/median/sd/min/max/slope/delta. Round 2 has **no crop
re-export**, so the full window is used and flagged — exactly the fallback `ch_hmd.py` applies when a crop is absent.
Outputs: `r2-hmd-wide.csv`, `r2-hmd-long.csv`, `r2-hmd-qc.csv`. **12 of 12 cells parsed.**

**Methodology verified by replication.** Re-running the pooled script's own path on Round 1 alone reproduces the
published result exactly: pupil 8/8, Friedman p=0.0302, Wilcoxon p=0.0078, rank-biserial −1.00. (An earlier pass of
mine filtered to crop-window rows and got 7/7 — `ch_stats.py` does not filter, and the unfiltered path is the correct
one. Recorded because it is the kind of deviation that silently moves a headline number.)

## Within-subject z, cohort mean — Round 2 (N=4) beside Round 1 (N=8)

| stimulus | gaze var | cog load | pupil | **openness** | HR |
|---|---|---|---|---|---|
| **R2 Boring** | **+0.21** | −0.18 | −0.54 | **−1.03** | −0.51 |
| R2 Clinical | −0.52 | −0.83 | −0.12 | +0.72 | −0.32 |
| R2 Interesting | +0.31 | **+1.01** | **+0.66** | +0.30 | +0.57 |
| *R1 Boring* | *+0.21* | *−0.19* | *−0.69* | — | — |
| *R1 Clinical* | *−0.20* | *+0.33* | *+0.40* | — | — |
| *R1 Interesting* | *−0.01* | *−0.14* | *+0.30* | — | — |

## What replicates
**Boring's profile, closely.** Gaze variance is **+0.21 in both rounds — identical**; cognitive load −0.18 against
−0.19; pupil −0.54 against −0.69. Boring is the least-engaged condition on pupil, cognitive load and openness. The
boredom outlier is stable across instrument generations.

## What does NOT replicate
**Clinical's position.** In Round 1 clinical sat at the engaged extreme (cognitive load +0.33, pupil +0.40). In Round 2
**Interesting is the engaged extreme** (cognitive load +1.01, pupil +0.66) and clinical falls back: most engaged on
gaze variance (−0.52) and openness (+0.72), middling on pupil (−0.12), and **least engaged on cognitive load
(−0.83)**. So "every physiological surface reads clinical as engaged" holds on two of four surfaces in Round 2, not
four. Gaze variance also no longer makes Boring the outlier (INT +0.31 vs BOR +0.21, a narrow gap).

## Pooled tests, N=12 (within-subject signed-rank, so cross-round amplitude differences are irrelevant)
| surface | n | Friedman p | BOR<CLC | Wilcoxon p | rank-biserial |
|---|---|---|---|---|---|
| **pupil dilation** | 12 | **0.0458** | **10/12** | **0.0093** | −0.82 |
| cognitive load | 12 | 0.3385 | 7/12 | 0.4238 | −0.28 |
| HR | 10 | 0.6703 | 4/10 | 0.3750 | +0.35 |

**Pupil survives pooling and stays significant — but weakens honestly.** Round 1's perfect separation (8/8,
rb −1.00) becomes 10/12 (rb −0.82), and **Round 2 alone is 2/4, i.e. chance.** The N=12 result is therefore
substantially carried by Round 1. Report it as significant at N=12 with that dependence stated. Cognitive load and HR
remain non-significant, and Round 2 runs against cognitive load (1/4).

## NEW CHANNEL — eye openness (Round 2 only, and the cleanest new result)
| | BOR | CLC | INT |
|---|---|---|---|
| R2-01 | 0.772 | 0.908 | 0.862 |
| R2-02 | 0.712 | 0.909 | 0.916 |
| R2-03 | 0.845 | 0.890 | 0.904 |
| R2-04 | 0.869 | 0.901 | 0.875 |

**Boring is the lowest of the three in 4/4 subjects** — rank-biserial −1.00, a perfect separation; Friedman p=0.0498.
(Wilcoxon's floor at n=4 is p=0.125, so perfect separation is the strongest obtainable result at this N.) The eyes are
measurably less open during the boring stimulus, which converges independently with the self-report sleep-fight
ratings and with S05 falling asleep. **This fills a gap the boredom cluster's concordance records as documented
NON-COVERAGE** (blink / eye-closure). Descriptive at n=4.

## Gaze variance is not poolable — now demonstrated, not asserted
Recomputing the identical feature on Round 2 decimated from 120 Hz to Round 1's ~3.3 Hz effective rate changes its
value by a factor of **0.65–0.84 (mean 0.74)**. The feature is rate-dependent, so a pooled gaze variance across rounds
is not one measurement. Note also that Round 2's 120 Hz data runs in the *predicted* direction (Boring > Clinical) in
**3/4** subjects, against Round 1's **4/8** — chance. Consistent with the reading that Round 1's undersampling
degraded the feature rather than the phenomenon being absent, though n=4 cannot establish it.

## What Round 2 CANNOT do — and it is the important limit
**The corrected keystone cannot be tested at N=12.** It is a two-channel claim — physiology engaged *against*
self-report bored — and **there is no verified self-report for the Round 2 subjects.** The eight root-level survey
files resolve to six distinct people, only one of whom matches a Round-2 folder on a crude match. Until that identity
question is settled, Round 2 strengthens only the physiological side. **This promotes the survey-file question from
housekeeping to load-bearing.**

## QC flags
- **R2-01 INT:** corrupted timestamp span (apparent duration 1.7×10⁹ s) — median rate is a normal 120.12 Hz and the
  140,143 rows look sound, so use `median_hz`, never `mean_hz`, for this file.
- **R2-03 INT:** a 40.5-minute session against the others' 18–22 min.
- **Gaze validity** 70.0–91.8%; lowest on R2-02 BOR (70.0%) and R2-01 BOR (75.8%).
- **HR absent or fully masked** for R2-01 BOR and R2-02 BOR → HR pools at n=10, not 12.
- **No HRV stream and no EEG in Round 2** → both stay at N=8 permanently.
