# Boredom Experiment — O-9 processing (three light channels) — RESULTS

**Run 2026-07-16.** Processes `ch-hmd`, `ch-fig`, `ch-eeg` per the scoping plan
`plans/boredom-experiment-o9-processing-scope-2026-07-16.md`. Outputs are keyed **S01–S08 only**
(sorted-folder-order canonical mapping in `common.py`); no participant name appears in any output file.
This directory is **untracked** (working analysis, FE-U per-subject features — not committed pending O-10).

## Scripts (interpreter matters — PATH trap under /mnt/d)
- `common.py` — canonical S01–S08 ordering + stimulus normalization (stdlib; both interpreters).
- `ch_hmd.py` — run with `/home/dalton/.venv/bin/python` (pandas + openpyxl).
- `ch_fig.py`, `ch_eeg.py`, `ch_validate.py` — run with `/home/dalton/.pyenv/versions/3.11.9/bin/python3` (scipy).

## Outputs (`out/`)
| File | What |
|---|---|
| `ch-hmd-wide.csv` / `-long.csv` / `-qc.csv` | 24 (subject×stimulus) arousal-feature cells: HR, HRV, cognitive-load, L/R pupil, gaze; means/slopes/deltas + QC (rate, %valid) |
| `ch-fig-long.csv` / `-coverage.csv` | 161/168 extracted fig series (gaze 3-trace, pupil 5-trace denoise cascade); HR/HRV/CogLoad flagged `csv_exact_dup` |
| `ch-fig-validation.txt` | cross-check: HR/HRV/CogLoad fig==CSV in 60/63 cells (mapping confirmed); gaze flagged unvalidated |
| `ch-eeg-summary.csv` (24) / `-epochs.csv` / `-qc.csv` | within-subject theta/alpha workload surface + band %s |
| `combined-features.csv` | the payoff: arousal + workload joined per (subject×stimulus) |

## Methods are PAPER-GROUNDED (King & Salvo ASEE 2023 #37129 EEG; 2024 #44685 gaze)
The two published papers pin the definitions my scoping had to infer:
- **EEG:** montage = **F3, F4, P3, P4** (Table 2 lists them in that column order); bandpass **1–35 Hz**;
  the boredom marker is **increased DMN power in alpha (8–12) + theta (4–8)** over frontal+parietal
  (higher = more boring-like) — NOT a theta/alpha workload ratio (my first pass had the framing backwards).
- **Gaze:** the feature is the **variance of the 5-point sliding-window-median Euclidean deviation from
  center** (higher = searching/boredom; lower = engaged / "zombie stare") — NOT angle-from-mean.

## Headline result (within-subject z-scores; higher DMN/gaze-var = boring-like, higher load/pupil = engaged)
| stimulus | EEG DMN | parietal α | gaze variance | cognitive-load | pupil |
|---|---|---|---|---|---|
| **BOR** | **+0.48** | **+0.70** | **+0.21** | −0.19 | −0.69 |
| CLC | −0.24 | −0.32 | −0.20 | **+0.33** | **+0.40** |
| INT | −0.24 | −0.38 | −0.01 | −0.14 | +0.30 |

**All five physiological surfaces agree: BORING is the boredom outlier (high DMN alpha, high gaze variance,
low load, low pupil), and CLINICAL sits with the engaging pole on every channel.** The boredom marker
(parietal alpha: BOR 22.9 vs CLC 11.4 vs INT 12.4 µV²) is clean.

**Keystone — an honest correction the N=8 + proper montage enables.** The 2023 paper's headline (from its ONE
clean subject) was "clinical EEG resembles boring." At **N=8 this does NOT replicate**: clinical's DMN is
*low* (engaging-like), equal to interesting, and clinical resembles boring on EEG in only **4/8** subjects
(chance). So the keystone is NOT "gaze-engaged vs EEG-boring." It is stronger and simpler: **every physiological
surface (EEG DMN, gaze, cognitive-load, pupil) reads clinical as engaged, while the self-report rates clinical
fairly boring (6.0/9).** The surface/depth divergence is *physiology-engaged vs self-report-bored* — more robust
than the paper's fragile N=1 EEG split. (Statistical testing across N=8 is the next analytical step.)

## Honest caveats / QC (all flagged in the `-qc` files)
- **ch-eeg channel identity — RESOLVED from P1** (F3,F4,P3,P4 = columns 0–3; DMN alpha+theta; 1–35 Hz). Remaining
  caveats: raw band-power (µV²) is **not comparable across subjects** (per-subject amplitude varies) — use the
  within-subject z-normed values; retained-epoch fraction ~60% (S05-CLC 47%, S08-CLC 36%, S08-INT 44% low), and the
  team itself demoted EEG as low-SNR, so **treat EEG as suggestive**. The clinical≈boring keystone from the paper
  (N=1 clean) does not replicate at N=8 (see Headline).
- **ch-hmd gaze — RESOLVED from P2** (variance of 5-point-median Euclidean deviation from center). No longer a
  provisional proxy; `gaze_dev_variance`/`gaze_dev_median` reproduce the paper's direction (BOR highest variance,
  CLC lowest). HR/HRV/cognitive-load/pupil remain solid (fig==CSV byte-match confirmed, 60/63).
- **HR/HRV/CogLoad `0` = vendor no-reading sentinel** (masked to NaN). S08 has heavy HR dropout (INT 39% valid,
  CLC 70%) — S08 HR means are over fewer samples.
- **Data-quality flags:** S05-BOR eye validity 21% (gaze/pupil noisy); S06-CLC/INT sampled ~88–125 Hz (30× rate);
  S08-CLC used the full window (no crop); S03-CLC crop read from `.xlsx`; **S07-BOR has inconsistent duplicate
  crop files** (fig/CSV lengths disagree — lower-confidence cell); **S07-INT is entirely missing** across fig
  (and its EEG/HMD INT exist). Two EEG recordings auto-trimmed (S06-BOR double-length, S07-INT garbage tail).
- **Format variants handled:** HMD is 12-col (H,M,S,ms) for 42 files and a **9-col colon-timestamp** variant for
  5 (S07 Boring); fig layout is flat (`BOR_`/`CLC_`/`INT_` prefixes) or nested per-stimulus folders, with typos
  (`RIght`, `Media`, bare names) resolved by token+folder matching.

## Re-run
```
cd tmp/Dissertation/Part_III/boredom-o9-processing
/home/dalton/.venv/bin/python ch_hmd.py
/home/dalton/.pyenv/versions/3.11.9/bin/python3 ch_fig.py
/home/dalton/.pyenv/versions/3.11.9/bin/python3 ch_eeg.py
/home/dalton/.pyenv/versions/3.11.9/bin/python3 ch_validate.py
```
`ch-obs` (Phase d) is NOT included here (corroboration-only; separate GPU/IO pass).
