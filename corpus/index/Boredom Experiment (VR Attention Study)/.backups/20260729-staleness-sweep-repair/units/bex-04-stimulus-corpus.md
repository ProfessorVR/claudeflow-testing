# bex-04 — `ch-stimulus` + `ch-hmd` / `ch-obs` / `ch-fig`: Stimulus Corpus & Declared Channels

This unit carries the video-stimulus corpus (available FE metadata) plus three raw/derived channels. **Status updated
2026-07-29:** `ch-hmd` and `ch-fig` are **PROCESSED** (O-9, 2026-07-16, full N=8); **`ch-obs` alone remains deferred.**

## `ch-stimulus` — video-stimulus corpus (FE, metadata)
- **Ten state-contrast 4K60 compilations**, plus per-subject labeled clips (e.g. a "Boring_Focused" exemplar and two
  "Boring_Bored (EC,HA,LA)" exemplars). Actual length **17 min**.
- **Naming key:** `CLC/INT/Boring` × `LA/HA/IE/E/ME/AS`; **EC = eyes-closed** (confirmed). Aliases across the record:
  **BOR ≡ Boring**, **CLC ≡ Clinical**, **INT ≡ Interesting** (the self-report codes vs the compilation labels).
- **The three canonical stimuli:** Boring = 1989 Word tutorial · Interesting = alien-reproduction-vehicles ·
  Clinical = 360° spinal surgery.
- This is the channel `ped-sec-14`'s anticipatory `bridges-to` edge points at (its IVR/desktop-3D/2D media ladder ×
  this dataset's media-condition channels).

## `ch-hmd` — HMD telemetry / exposure + arousal channel (PROCESSED, O-9 2026-07-16)
HP Reverb G2 **Omnicept** telemetry; exposure-duration / session-time protocol. The reference channel for
exposure-time and cybersickness questions (e.g. ped-sec-23's exposure-time findings would align against this exposure
protocol). **Telemetry is decoded and processed at full N=8**: headerless 12-column CSV (wall-clock, gaze unit-vector,
L/R pupil mm, validity flags, vendor cognitive-load, HR, HRV) yielding the arousal surface — pupil dilation, cognitive
load, HR, HRV — plus gaze-deviation variance computed per P2's definition. **Pupil dilation is the dataset's one
statistically robust surface** (Friedman p=0.030; Boring < Clinical in all 8 subjects, Wilcoxon p=0.008 Holm-corrected,
rank-biserial −1.0); the rest are directional only. Format variants handled in the scripts: a 9-column colon-timestamp
variant, `0` as a vendor sentinel on HR/HRV/cognitive-load, and `_Crop` files being lower-rate re-exports rather than
row subsets.

## `ch-obs` — session-video channel: first-person in-VR headset feed (the one channel still O-9 deferred)
OBS screen-capture of the subject's first-person in-VR view (Windows Mixed Reality feed) — 4K/HEVC/60 fps, ~85.6 GB
across the 8 subjects. **This is NOT a body/comportment camera:** it was confirmed 2026-07-16 that no participant body
footage was ever recorded, so posture / fidget / watch-glance cannot be recovered and there is **no independent third
behavioral surface** (the keystone remains a two-surface reading — self-report/EEG depth × gaze surface — with `ch-obs`
as a corroborating read). What the feed *can* yield under processing: **stimulus-state segmentation** (a precise
cross-channel alignment anchor for the other channels), head-restlessness (global optical flow, since the camera is the
head), and on/off-task — all of which corroborate `ch-gaze`/`ch-hmd` rather than adding a new axis. GPU processing
**deferred (O-9)** and scoped as its own final phase in `plans/boredom-experiment-o9-processing-scope-2026-07-16.md`.

## `ch-fig` — analysis-figure channel (derived; PROCESSED, O-9 2026-07-16)
Per-subject MATLAB `.fig` analysis outputs derived from the EEG/gaze channels. **Extracted**: MATLAB v5 files read with
`scipy.io.loadmat`, 161 unique series of 168. The channel's unique contribution is the **processed** gaze (two filter
levels) and pupil (five-level denoise cascade), which exist only in the `.fig` files and cannot be regenerated from the
raw CSV; the HR/HRV/cognitive-load traces proved byte-exact tail-aligned duplicates of the HMD CSV and are kept as
validation rather than new signal, confirming the channel mapping in 60/63 checks. Known gaps: S07 is missing the
entire Interesting set; S03 carries md5-identical flat and nested duplicates.

## Channel role
`ch-stimulus` is the shared media-condition substrate all three publications drew from. Of the three channels this
unit carries, `ch-hmd` and `ch-fig` are now processed and supply real signal — `ch-hmd` the arousal surface that
contains the dataset's only significant result, `ch-fig` the processed gaze and pupil series the raw CSV cannot
reproduce. `ch-obs` remains the unprocessed reserve, named and located here, scoped as its own final phase.
