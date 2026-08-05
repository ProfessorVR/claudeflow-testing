# Round 2 Gaze-Overlay & Data-Trim Plan — 2026-07-31 (Rev 3, phased execution)

Goal: for each Boredom Experiment Round 2 session, (1) trim all five sensor CSVs to a
clean, mutually aligned analysis window; (2) cut the OBS first-person HMD recording to
that same window; (3) render a gaze-location overlay video in the style of the Round 1
deliverables; (4) cut the BodyCam recordings (Lucas ×3, Matthew Interesting ×1) to the
same window as a synchronized appendix artifact.

Status: plan only — nothing has been modified. All findings were measured against the
actual Round 2 data (Rev 1 recon 2026-07-31; Rev 2 additions verified same day).

Rev 2 changes (user rulings):
- **5 s head-guard adopted** — applied identically to CSVs and video cuts (§3b, §4).
- **Lucas Jones OBS videos added** (3 HMD + 3 BodyCam) — full deliverables now possible;
  BodyCam handling added (§3g).
- **Matthew Lo 03-15 Interesting manual anchors supplied and verified** (§2, §3a).
- **Output naming ruled**: originals never touched; every trimmed output is a new file
  named `<original name>_Crop.<ext>` beside its original, matching the Round 1 pattern (§3c).

Rev 3 changes (user rulings — execution ordering & GPU embargo):
- **Phase A (now): CSV crops for all 12 sessions, CPU-ONLY, then HARD PAUSE.** Another
  session is using the GPU heavily; engaging it would break that work. Phase A therefore
  runs whisper with `--device cpu` and `CUDA_VISIBLE_DEVICES=""` on every subprocess,
  uses audio demux only (no video decode), and touches neither NVDEC nor NVENC.
- **Gate 0 (new):** after CSV crops are written and verified, notify the user and STOP.
  Nothing beyond the CSV outputs executes without explicit user permission. A separate
  session will analyze the `_Crop.csv` files while Phase B runs later.
- **Phase B (only after explicit permission):** calibration, pilot overlay (Gate 1),
  batch video cuts + overlays, bodycam cuts, **gaze heatmaps** (new deliverable, §3h),
  QA bundle (Gate 2).

---

## 1. What was verified (pilot: Abner Portillo / Boring)

**Data formats.** Round 2 CSVs are raw HP Omnicept SDK streams, header-bearing, one file
per sensor per session: EyeTracking (120.0 Hz, 32 col), CL (cognitive load), HR, HRV
(very sparse — ~10 rows/session), IMU (~1 kHz). All share microsecond-epoch `ts/sys` /
`ts/omni` clocks, so cross-stream trimming is a timestamp range cut, not row counting.
Known gotchas confirmed: CL first rows carry `ts/sys=0` (fall back to `ts/omni`), and the
existing analysis code documents an outlier-timestamp row in R2-01 Interesting — the
same guard (drop timestamps > 4 h from median) is reused here.

**Eye-closure signature.** Closure is unambiguous: bilateral `openness = 0`,
`cgaze/q = 0`, `dilation = -1`. The pilot's row ranges reproduce exactly:
rows 1347–5280 = 11.2 s–44.0 s (32.8 s closed), rows 129185–132812 = 1076.3 s–EOF
(30.2 s closed, recording stops at reopen).

**Audio cues are machine-findable.** Whisper (base model, word timestamps, local
`~/.pyenv/versions/3.11.9/bin/whisper`, validated on this machine) on the pilot:

| Event | Video time | Track |
|---|---|---|
| "All right, three, two, one" | 9.2–14.5 s | a:0 (mix) |
| "Close your eyes" (start) | 15.2–16.2 s | a:0 |
| "Open your eyes" (start) | 46.3–47.9 s | a:0 |
| Stimulus narration onset | ~48.3 s | a:0 |
| "Close your eyes" (end — stimulus still playing) | 1079.3–1080.1 s | a:1 (mic-dominant) |
| "10 seconds" | 1096.9–1098.7 s | a:1 |
| "Open your eyes" (end) | 1109.2–1110.4 s | a:1 |

**Sync closes.** CSV closure edges vs. audio cues give video_t ≈ ET_t + 4.6 s at both
anchors → clock drift < 0.3 s over 18.4 min. Alignment to ±0.3–0.5 s from cues alone;
preview-based global-offset polish tightens further if needed.

**Closure scan across all 12 sessions** (bilateral openness < 0.5, runs ≥ 10 s, 2 s gap
tolerance): every session has a detectable start and end closure window. Boring sessions
show up to 10 sustained closure runs (mid-video drowsiness — the phenomenon behind the
eye-closure finding), and Warat/Interesting has an 11.8 s closure artifact at t=0, so
closure runs are **matched to the audio cue times**, never taken as "first/last run."

**No inherited tooling.** The Round 1 overlay generator does not exist in any repo on
this machine (presumed MATLAB, source lost; only the output MP4s and `_Crop.csv` files
survive). This plan builds a small new pipeline, reusing the Round 2 parsing conventions
from `tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/analysis/r2.py` (openness
< 0.5, blink ≤ 500 ms, timestamp guards) and the documented ffmpeg patterns. Hardware:
local RTX 5090 with NVDEC/NVENC — 4K60 HEVC decode+encode is cheap.

---

## 2. Session inventory (Rev 2)

| Subject | Session | ET dur | HMD video | BodyCam | Notes |
|---|---|---|---|---|---|
| Abner Portillo | Boring | 1106.5 | 1112.9 | — | pilot — fully validated |
| Abner Portillo | Clinical | 1113.7 | 1117.2 | — | |
| Abner Portillo | Interesting | 1167.6 | 1177.3 | — | no IMU file |
| Lucas Jones | Boring | 1107.0 | 1106.6 | 1102.9 | OBS folder added 2026-07-31 |
| Lucas Jones | Clinical | 1111.0 | 1101.0 | 1100.5 | |
| Lucas Jones | Interesting | 1119.0 | 1109.2 | 1109.9 | |
| Matthew Lo | Interesting (03-15) | 2429.5 | 2327.5 | 2318.4 (`Webcam_`) | see below |
| Matthew Lo | Boring (03-18) | 1238.5 | 1251.9 | — | first closure at 145 s (long pre-roll) — cues resolve |
| Matthew Lo | Clinical (03-18) | 1311.7 | 1304.8 | — | 03-15 folder lacks IMU; 03-18 folders complete |
| Warat Kosolpisitkul | Boring | 1099.3 | 1099.2 | — | |
| Warat Kosolpisitkul | Clinical | 1149.7 | 1143.2 | — | |
| Warat Kosolpisitkul | Interesting | 1111.5 | 1117.3 | — | t=0 closure artifact — cue-matching handles |

**Matthew Lo 03-15 Interesting (user-supplied anchors, verified against the CSV).**
The 40-min recording's protocol runs from ~22 min in. Openness transitions confirmed at
exactly: start closure onset **row 159999**, reopen **row 163806** (31.7 s closed,
ET ≈ 1333.3–1365.0 s); end closure onset **row 287622**, reopen **row 291497** (32.3 s
closed, ET ≈ 2396.4–2428.7 s); recording ends ~0.9 s after final reopen. The stimulus
period between anchors ≈ 17.2 min, consistent with the other Interesting sessions.
These rows are pre-seeded as manual anchors (§3a.6) and cross-checked against audio cues.
The earlier closure my scan found at 407 s belongs to the pre-protocol portion and is
ignored. The `Webcam_Interesting.mkv` file is this session's bodycam (§3g).

All 12 sessions now get the full deliverable set; 4 sessions additionally get a
bodycam cut.

---

## 3. Pipeline design

New scripts in `scripts/boredom-r2-overlay/` (git-tracked; `scripts/boredom-o9/` is
locked and will not be touched). Python (`/home/dalton/.venv/bin/python` for pandas) +
ffmpeg subprocesses. Stages per session:

### 3a. Event extraction (Phase A — CPU-only)
1. **Audio cues:** extract mono 16 kHz WAV for targeted windows (around expected
   protocol start and end — wide window for the Matthew 03-15 outlier) from both
   audio tracks (audio demux only — never video decode); whisper base **on CPU**
   (`--device cpu`, `CUDA_VISIBLE_DEVICES=""`) with word timestamps; fuzzy-match
   "close your eyes" / "open your eyes" / "three, two, one" / "N seconds". Escalate to
   the small model only if a cue is missing. The countdown disambiguates the start cue; end cues are read
   from the mic-dominant track (clean of stimulus audio, validated).
2. **Closure runs:** from the EyeTracking CSV as in §1.
3. **Anchor pairing:** protocol closure run = the run whose onset lies within
   [cue_onset − 2 s, cue_end + 15 s]. Two anchor pairs per session: start-reopen edge ↔
   start "open your eyes"; end-closure onset ↔ end "close your eyes". Fit
   `video_t = a·et_t + b`; flag for manual review if |a−1| > 1e-3 or residual > 1 s.
4. **Stimulus onset/offset:** onset = first sustained (≥ 10 s) desktop-audio activity
   after the start "open your eyes" cue, cross-checked against the transcript (first
   stimulus speech — validated at 48.3 s on the pilot). Offset = end of sustained
   desktop audio, bounded above by the end closure-instruction onset (the instruction
   can arrive while the clip still plays — pilot-confirmed).
5. All events written to `events.json` per session (row index + ET µs + video s for
   each), so any boundary policy can be revisited later without re-detection.
6. **Manual anchor overrides:** per-session config may pin closure rows directly
   (Matthew 03-15 Interesting is pre-seeded with rows 159999/163806/287622/291497);
   detection then only validates and localizes cues around them.

### 3b. Analysis window (RULED: CSV-primary, 5 s guard)
User ruling (Rev 4): the ~30 s instructed eye-closure windows in the eye-tracking CSV
are **more trustworthy than the auditory cues** — closure edges define the boundaries;
audio cues are primarily for syncing video to CSV.
- **start** = start-closure reopen edge (CSV) + **5 s** guard
- **end** = end-closure onset (CSV) − **2 s** guard

Consequence: CSV crops depend on no audio at all (sessions crop even when cue
detection fails); the audio-derived stimulus onset/offset and instruction times are
recorded in `CropEvents.json` as cross-checks that can raise flags (e.g. STIM_DELAY,
INSTR_EARLY) but never move boundaries. The window is computed **once per session in
the ET clock**, then mapped through the fitted sync to each video's clock. CSVs, the HMD cut/overlay video, and the bodycam cut
all use this identical window, so video t = 0 coincides with `t_rel_s` = 0 in every
trimmed CSV. Everything outside — lead-in, both closure windows, dead time, the first
5 s of stimulus, the contaminated tail, lead-out — is cut from all deliverables alike.

### 3c. CSV trimming (all five streams; naming RULED)
- Cut each stream to `ts ∈ [window_start, window_end]` using `ts/sys` with `ts/omni`
  fallback and the outlier guard.
- Add a `t_rel_s` column = (ts − window_start)/1e6 to every output.
- Write each output **beside its original** as `<original name>_Crop.csv`
  (e.g. `EyeTracking-2024-03-21-152854_Crop.csv`), matching the Round 1 `_Crop`
  pattern. **Originals are never modified**; all outputs are new files.
- HRV will retain only a handful of rows (sparse by design); IMU absent in 2 cells —
  logged, not fatal.

### 3d. Video cut + overlay (single pass)
- NVDEC decode of the window segment → per-frame draw in numpy/OpenCV → NVENC encode
  (hevc_nvenc, quality-tuned), mixed audio track copied for the same segment.
- Per output frame: map frame time → ET clock, linearly interpolate the 120 Hz `cgaze`
  samples, project direction → pixel with a pinhole model (fx, fy, cx, cy), draw the
  Round 1-style green dot. Dot hidden whenever gaze is invalid (`cgaze/q = 0` /
  openness < 0.5) — blinks and closures — matching Round 1 behavior.
- Two video outputs per session (config-toggleable):
  - `<original name>_Crop.mkv` in the OBS folder — the plain trimmed copy;
  - `Boredom Experiment Round 2/Videos/Eye Tracking Overlay Videos/<Subject>/<FirstLast>_ET_<Condition>.mp4`
    — the overlay render, 3840×2160@60 for Round 1 parity.

### 3e. Projection calibration (the one real unknown)
The mapping from Omnicept gaze direction to the OBS mirror pixel frame needs one
calibration, shared across sessions:
1. **Primary: reverse-engineer Round 1.** Chroma-detect the pure-green dot per frame in
   2–3 Round 1 overlay videos, pair with the matching `_Crop.csv` gaze vectors
   (timestamps in-file), least-squares fit (fx, fy, cx, cy). Same headset, same capture
   pipeline — likely transfers directly.
2. **Validate / fall back:** render 1080p preview snippets of Round 2 moments with
   obvious gaze targets (reading lines in the Word tutorial, the picture-in-picture
   speaker) and tune FOV/offset manually if the Round 1 fit doesn't transfer.
Calibration constants stored in the pipeline config with provenance notes.

### 3f. QA & sign-off gates (verification-gated; nothing committed or deleted)
- Per session: `events.json`, a QA text block (anchor residuals, window bounds in all
  clocks, % valid gaze in window, closure-run table), a 3-frame contact sheet, and a
  20 s preview clip.
- **Gate 1:** pilot session (Abner/Boring) end-to-end → user reviews preview + QA →
  approve or adjust (dot size/color, guards, calibration).
- **Gate 2:** batch all remaining sessions → user reviews the QA bundle → sign-off.
  Corpus-index registration is a separate task, only after sign-off.
- Privacy: transcripts are used only to locate cue timestamps; transcript files stay in
  the session scratchpad / on D:, never committed to the repo or corpus. BodyCam
  footage shows the subject's body — outputs stay on D: beside their sources.

### 3g. BodyCam cuts (Lucas ×3, Matthew 03-15 Interesting ×1)
- Purpose: synchronized appendix artifact — a body-view aligned to the same analysis
  window, showcasing how the experiment could be extended toward bodily behavioral
  manifestations of boredom in future work. (Artifact production only; no analysis
  commitment in this plan.)
- Sync: the bodycam records room audio, so the same cue phrases are present; whisper
  cues give the coarse map, then cross-correlation of the bodycam audio against the HMD
  recording's mic track refines alignment to well under a video frame.
- Cut to the identical analysis window; no overlay (gaze is not defined in the body
  frame). Output beside the source: `<original name>_Crop.mkv`. Matthew's file keeps
  its original `Webcam_Interesting` stem → `Matthew Lo_03-15-24_Webcam_Interesting_Crop.mkv`.
- The bodycam sources are large (~3.2–3.4 GB each); cuts re-encode via NVENC at source
  resolution.

### 3h. Gaze heatmaps (Phase B deliverable)
- Per session: a 2D gaze-density heatmap in the mirror pixel frame, accumulated from the
  **cropped** eye-tracking data (valid samples only), rendered both standalone and
  composited over a representative mid-stimulus video frame.
- Per condition (Boring / Clinical / Interesting): aggregate heatmaps across the four
  subjects on the same pixel frame.
- Uses the same projection calibration as the overlay (§3e), so it cannot precede
  Phase B calibration. Exact styling (colormap, opacity, blur kernel) confirmed at
  Gate 1 alongside the pilot overlay.
- Output: PNGs under `Boredom Experiment Round 2/Videos/Eye Tracking Overlay Videos/<Subject>/`
  beside the session's overlay video, plus a `_Aggregate` set at the tree root.

---

## 4. Trim-boundary rationale (RESOLVED)

Ruling: **5 s head-guard**, applied to CSVs and videos identically (§3b). Event-based
boundaries remain the foundation — the pilot showed dead time between "open your eyes"
and stimulus onset can be as short as 0.4 s (so a fixed 15–20 s trim would have deleted
real viewing data), while Matthew's 03-15 session has a 22-minute pre-roll (so no fixed
trim could ever have worked). The detected stimulus onset anchors the window; the 5 s
guard then removes the orienting response from every deliverable uniformly, and the 2 s
pre-instruction guard plus instruction-onset bound clean the tail. `events.json`
preserves all raw event times, so boundaries can be recomputed under a different policy
without re-detection.

---

## 5. Execution stages & estimates (Rev 3 ordering)

**Phase A — CPU-only (runs now):**

| Stage | Work | Est. |
|---|---|---|
| A0 | Build events + trim + QA scripts (`scripts/boredom-r2-overlay/`) | short |
| A1 | Event extraction ×12 (CPU whisper on cue windows, closure detection, sync fit, stimulus bounds) | ~30–90 min |
| A2 | CSV trims ×12 sessions ×5 streams → `_Crop.csv` beside originals | minutes |
| A3 | Verification + `CROP-QA-REPORT` on D: → **Gate 0: notify user, HARD STOP** | — |

**Phase B — GPU (embargo re-instated 2026-07-31: user is ingesting documents on the
GPU; anything GPU-heavy — NVDEC/NVENC renders, batch encodes — waits for explicit
clearance. Minor GPU usage acceptable; calibration prep may run CPU-only.):**

| Stage | Work | Est. |
|---|---|---|
| B0 | Overlay/bodycam/heatmap scripts + Round 1 calibration fit | ~1–2 h |
| B1 | Pilot cut+overlay (Abner/Boring) → **Gate 1 review** | ~30 min compute |
| B2 | Batch: HMD cut+overlay ×11 remaining, bodycam ×4, heatmaps | ~6–9 h unattended |
| B3 | QA bundle → **Gate 2 sign-off** | — |

Storage estimate for D:: ~12 overlay videos + 12 `_Crop.mkv` HMD cuts (~2–3 GB each at
4K60 HEVC) + 4 bodycam cuts ≈ 60–80 GB. The plain `_Crop.mkv` HMD cut can be disabled
per config if that's excessive.

## 6. Remaining defaults (proceeding unless overruled)

1. **Overlay style** — exact Round 1 parity: plain green dot, vanishes during blinks and
   closures. (Optional extended-closure ring available but off.)
2. **Resolution** — 4K60 parity for overlays; bodycam cuts at source resolution.
3. **Lucas bodycam** — cut-only artifact (no side-by-side composite with the HMD view);
   a composite is easy to add later from the synchronized cuts if wanted for the
   appendix.
