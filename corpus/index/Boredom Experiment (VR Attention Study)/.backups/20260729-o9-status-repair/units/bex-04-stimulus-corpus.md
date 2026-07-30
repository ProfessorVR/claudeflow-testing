# bex-04 — `ch-stimulus` + `ch-hmd` / `ch-obs` / `ch-fig`: Stimulus Corpus & Declared Channels

This unit carries the video-stimulus corpus (available FE metadata) plus the three remaining raw/derived channels, all
**O-9 deferred** (declared-but-unprocessed).

## `ch-stimulus` — video-stimulus corpus (FE, metadata)
- **Ten state-contrast 4K60 compilations**, plus per-subject labeled clips (e.g. a "Boring_Focused" exemplar and two
  "Boring_Bored (EC,HA,LA)" exemplars). Actual length **17 min**.
- **Naming key:** `CLC/INT/Boring` × `LA/HA/IE/E/ME/AS`; **EC = eyes-closed** (confirmed). Aliases across the record:
  **BOR ≡ Boring**, **CLC ≡ Clinical**, **INT ≡ Interesting** (the self-report codes vs the compilation labels).
- **The three canonical stimuli:** Boring = 1989 Word tutorial · Interesting = alien-reproduction-vehicles ·
  Clinical = 360° spinal surgery.
- This is the channel `ped-sec-14`'s anticipatory `bridges-to` edge points at (its IVR/desktop-3D/2D media ladder ×
  this dataset's media-condition channels).

## `ch-hmd` — HMD telemetry / exposure channel (raw; O-9)
HP Reverb G2 **Omnicept** telemetry; exposure-duration / session-time protocol. The reference channel for
exposure-time and cybersickness questions (e.g. ped-sec-23's exposure-time findings would align against this exposure
protocol). Telemetry decoding **deferred (O-9)**.

## `ch-obs` — session-video channel: first-person in-VR headset feed (raw; O-9)
OBS screen-capture of the subject's first-person in-VR view (Windows Mixed Reality feed) — 4K/HEVC/60 fps, ~85.6 GB
across the 8 subjects. **This is NOT a body/comportment camera:** it was confirmed 2026-07-16 that no participant body
footage was ever recorded, so posture / fidget / watch-glance cannot be recovered and there is **no independent third
behavioral surface** (the keystone remains a two-surface reading — self-report/EEG depth × gaze surface — with `ch-obs`
as a corroborating read). What the feed *can* yield under processing: **stimulus-state segmentation** (a precise
cross-channel alignment anchor for the other channels), head-restlessness (global optical flow, since the camera is the
head), and on/off-task — all of which corroborate `ch-gaze`/`ch-hmd` rather than adding a new axis. GPU processing
**deferred (O-9)** and scoped as its own final phase in `plans/boredom-experiment-o9-processing-scope-2026-07-16.md`.

## `ch-fig` — analysis-figure channel (derived; O-9)
Per-subject MATLAB `.fig` analysis outputs derived from the EEG/gaze channels. Metadata only; no reprocessing.

## Channel role
`ch-stimulus` is the shared media-condition substrate all three publications drew from; the three declared channels
(`ch-hmd`, `ch-obs`, `ch-fig`) are the dataset's unprocessed reserve — named and located here so the compiled index
records their existence, without any O-9 processing.
