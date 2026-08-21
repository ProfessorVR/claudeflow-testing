# bex-05 — Round 2: Session Layer & Processed Artifact Registry (registered 2026-08-05)

## What this unit is
The **Round 2 layer** of the Boredom Experiment — the second data-collection round (March 2024) — registered here as a
**session grid + processed-artifact registry**. It carries the citable structure and provenance pointers for the
synchronized artifact set produced by the 2026-07-31 → 2026-08-05 gaze-overlay & data-trim pipeline. Raw data and all
artifacts live on D:; nothing binary is tracked. The analyses consuming these artifacts belong to the Part III
lab-boredom apparatus (`tmp/Dissertation/Part_III/`, untracked) and are **not** re-presented here, matching this
entry's channels-not-findings discipline.

## Dataset shape (entry-wide PII gate holds)
Four subjects — **R2-S01…R2-S04 by sorted `Subjects/` directory order** (the same convention as Round 1's S01–S08) —
× three conditions (Boring / Clinical / Interesting) = **12 sessions**, recorded 2024-03-13/-15/-18/-21 at
`D:\PhD\Dissertation\Boredom Experiment\Boredom Experiment Round 2\Subjects\`. R2-S03's Interesting session (03-15) is
a 40-min recording whose protocol starts ~22 min in; his Boring/Clinical are 03-18. Unlike Round 1, Round 2 subject
identities **are** recorded in the repo's operational pipeline docs (author ruling 2026-08-05, commit `acd31b469`);
this index entry remains name-free per the permanent PII gate.

Per-session channels — raw HP Omnicept **SDK** streams, header-bearing, one CSV per sensor (NOT Round 1's headerless
12-column export; shared µs-epoch `ts/sys`/`ts/omni` clocks):

| Stream | Rate / shape | Notes |
|---|---|---|
| EyeTracking | 120 Hz, 32-col | closure signature: bilateral `openness=0`, `cgaze/q=0`, `dilation=-1` |
| CL (cognitive load) | vendor rate | first rows carry `ts/sys=0` (use `ts/omni`) |
| HR | vendor rate | final rows truncated mid-write in several originals (dropped in crops) |
| HRV | ~10 rows/session | sparse by design; can die mid-session |
| IMU | ~1 kHz | absent in 2 sessions |
| OBS HMD feed | 4K60 HEVC + 2 audio tracks (mix / mic-dominant) | first-person in-VR view |
| BodyCam | 4K60 HEVC; 4 sessions (R2-S02 ×3, R2-S03 Interesting) | a:0 = desktop/stimulus mix, a:1 silent |

Missing cells: R2-S02 Boring has only ET+CL originals; R2-S01 Interesting and R2-S03 Interesting lack IMU — hence 55
(not 60) CSV crops.

**Round 2 introduces genuine body/comportment footage** — the surface Round 1's `ch-obs` was confirmed *not* to be
(bex-04): four sessions have a room camera showing the seated subject. Registered as synchronized artifacts only; any
comportment analysis is future work, gesture-scale.

## The locked analysis window (CSV-primary; author-ruled)
Per session: **start-closure reopen edge + 5 s guard → author-verified end-closure onset − 2 s guard**, computed once
on the eye-tracker clock and mapped to each video clock through the fitted sync. The author's manually reviewed
closure-anchor lines are authoritative (`scripts/boredom-r2-overlay/common.py:MANUAL_ANCHOR_LINES`; algorithmic
run-merging starts early on pre-instruction drowsy flicker). **The Part III lab-boredom analyses (v1–v4) have already
consumed these crops: the windows are LOCKED — do not recompute or re-crop without coordinating.** Video t=0 and CSV
`t_rel_s`=0 coincide in every deliverable.

## Artifact registry (verified on disk 2026-08-04/05; `_Crop` siblings beside originals, originals never modified)

| Artifact | Count | Location / naming |
|---|---|---|
| Sensor-stream crops `*_Crop.csv` (+`t_rel_s`) | 55 | beside originals in each session folder |
| `CropEvents.json` provenance (events, sync fits, window in all clocks, bodycam block) | 12 | each session folder |
| CSV QA report | 1 | `Boredom Experiment Round 2/CROP-QA-REPORT-2026-07-31.md` |
| Gaze-overlay renders `<FirstLast>_ET_<Cond>.mp4` (4K60, Round 1 dot parity) | 12 | `…Round 2/Videos/Eye Tracking Overlay Videos/<Subject>/` |
| Plain HMD cuts `*_HMD_*_Crop.mkv` | 12 | each subject's `OBS/` |
| Gaze heatmaps (per-session + 3 condition aggregates) | 15 | overlay tree; aggregates at root |
| BodyCam cuts `*_BodyCam_*_Crop.mkv` | 4 | beside sources in `OBS/` |
| BodyCam+HMD side-by-side composites `<FirstLast>_BodyCamHMD_<Cond>.mp4` (3840×1080@60) | 4 | `…Round 2/Videos/BodyCam Side-by-Side/<Subject>/` |
| Bodycam sync-evidence bundle (report + frames) | 1 | `…Round 2/BODYCAM-SYNC-VERIFICATION-2026-08-04/` |

## Sync & projection provenance
- **HMD↔ET** (`sync.b_s` per CropEvents.json): consensus over cue-phrase anchors with a window-feasibility bound and a
  stimulus-energy veto that defeats the ~30 s close/open cue-aliasing false solution (`harden_sync.py`).
- **BodyCam↔ET** (`bodycam.b_body_s`): **stimulus-mix xcorr** — the bodycam OBS recordings carry the same
  desktop/stimulus mix as the HMD's a:0, so envelope xcorr of the two mix tracks in two 90 s windows pins the offset
  (z=9–22, runner-up ≈ noise, early/late agreement ≤ 20 ms, no drift). The bodycam's own room-mic track is silent,
  which is why room-audio methods (envelope xcorr vs mic, cue transcription) had refused (`bodycam_verify.py`).
- **Projection** (gaze direction → mirror pixel): 3×3 DLT reverse-engineered from the Round 1 overlay deliverables
  (7.7 px median residual at 4K, 87 pairs); durable fit `scripts/boredom-r2-overlay/calibration-fit-r1-boring.json`;
  axis transfer `g_R1 = (z, x, y)` of the Round 2 `cgaze`.

## Pointers
Pipeline: `scripts/boredom-r2-overlay/` (commit `acd31b469`) · design + rulings:
`plans/boredom-r2-gaze-overlay-plan-2026-07-31.md` · state + bodycam resolution:
`plans/HANDOFF-BOREDOM-R2-OVERLAY-2026-08-04.md` (§7) · memory: `project-boredom-r2-gaze-overlay-pipeline` ·
analyses home (untracked): `tmp/Dissertation/Part_III/` lab-boredom apparatus.
