# HANDOFF — Boredom Round 2 Gaze-Overlay & Data-Trim Pipeline (2026-08-04)

State verified on disk 2026-08-04. Companion plan (full design + rulings):
`plans/boredom-r2-gaze-overlay-plan-2026-07-31.md` (Rev 4). Memory entry:
`project-boredom-r2-gaze-overlay-pipeline`.

## 1. Overall goal

For every Boredom Experiment **Round 2** session (4 subjects × 3 conditions =
12 sessions, data at `D:\PhD\Dissertation\Boredom Experiment\Boredom Experiment
Round 2\Subjects\`, i.e. `/mnt/d/...` in WSL):

1. Trim all five sensor CSVs (EyeTracking / CL / HR / HRV / IMU) to a clean,
   mutually aligned analysis window — the stimulus-viewing period between the two
   instructed ~30 s eye-closure sequences.
2. Cut the OBS first-person HMD recording to the same window.
3. Render a Round 1-style gaze-dot overlay video (green dot, 4K60).
4. Produce gaze heatmaps (per session + per condition).
5. Cut the 4 bodycam recordings (Lucas ×3, Matthew 03-15 Webcam) to the same
   window as a synchronized appendix artifact.

Hard rules (user rulings, all locked in the plan): originals NEVER modified —
every output is a new sibling file named `<original>_Crop.<ext>`; analysis
window is **CSV-primary** (eye-closure edges authoritative, audio only for
video sync); user's manually reviewed closure anchor lines are authoritative;
verification-gated workflow (show evidence, wait for sign-off); nothing
committed/pushed without explicit approval.

## 2. Completed (all verified on disk)

| Deliverable | Count | Location |
|---|---|---|
| `_Crop.csv` sensor trims (+`t_rel_s` col, common zero/session) | 55 | beside originals in each session folder |
| `CropEvents.json` provenance (events, sync, window in all clocks) | 12 | each session folder |
| CSV QA report (verification block incl.) | 1 | `Boredom Experiment Round 2/CROP-QA-REPORT-2026-07-31.md` |
| Gaze overlay videos `<Name>_ET_<Cond>.mp4` (4K60 HEVC + audio) | 12 | `Boredom Experiment Round 2/Videos/Eye Tracking Overlay Videos/<Subject>/` |
| Plain trimmed HMD copies `*_HMD_*_Crop.mkv` | 12 | each subject's `OBS/` |
| Heatmaps (12 per-session + 3 condition aggregates) | 15 | overlay tree; aggregates at its root |

Key technical facts a successor needs:

- **Analysis window** = start-closure reopen edge + 5 s guard → user-verified
  end-closure onset − 2 s guard, computed on the eye-tracker clock (`ts/sys`
  epoch µs, `ts/omni` fallback, outlier guard). User's anchor lines for all 12
  sessions live in `scripts/boredom-r2-overlay/common.py:MANUAL_ANCHOR_LINES`
  (1-based CSV file lines). End onsets use the USER's definitive lines because
  algorithmic run-merging starts early on pre-instruction drowsy flicker (41 s
  early on Matthew Boring — audio-confirmed).
- **Video↔ET sync** (`b_s` in each CropEvents.json): consensus over cue-phrase
  anchors ("close/open your eyes" + Lucas's 03-13 variants "eyes closed"/"it's
  open"), with a window-feasibility bound and a **stimulus-energy veto** that
  defeats close/open cue aliasing (a ~30 s-shifted false solution that
  otherwise looks self-consistent). Implemented in `harden_sync.py`.
- **Projection** (gaze direction → mirror pixel): 3×3 DLT reverse-engineered
  from Round 1 AndrewDo overlay videos (green-dot detection vs `_Crop.csv`
  gaze; median residual 7.7 px at 4K, 87 pairs). Fit JSON — DURABLE COPY IN
  REPO: `scripts/boredom-r2-overlay/calibration-fit-r1-boring.json` (pass this
  path to `overlay.py`/`heatmap.py`/`batch_phase_b.py`). Axis transfer:
  `g_R1 = (z, x, y)` of Round 2 `cgaze`. Regenerable anytime with
  `calibrate.py <AndrewDo_ET_Boring.mp4> <AndrewDo_HMD_Boredom_Crop.csv>` (~3 min).
- **Pilot approved by user** (Gate 1): Abner/Boring, dot style = Round 1 parity
  (r=20 px green + dark ring, hidden when `cgaze/q`=0). Batch rendered with
  identical settings; durations spot-verified against windows to the frame.
- Data gotchas: Lucas Boring has only CL+ET originals (no HR/HRV/IMU); Abner
  Interesting & Matthew 03-15 Interesting lack IMU; HR/HRV/CL final rows are
  truncated mid-write in several originals (dropped from crops, logged);
  Matthew 03-15 Interesting is a 40-min recording whose protocol starts ~22 min
  in; HRV is sparse (~10 rows/session) and can die mid-session.
- The dissertation-analysis session has ALREADY consumed the crops (memory:
  "Round 2 RE-CROPPED", analyses v1–v3, criterion-validity headline). Do not
  regenerate crops without coordinating — downstream results depend on them.

## 3. Current position

Phase B complete except bodycam. Nothing is running. GPU is free unless the
user says otherwise (they periodically embargo it for ingestion — ASK before
GPU-heavy work if in doubt; whisper must then run `--device cpu` with
`CUDA_VISIBLE_DEVICES=""`).

`scripts/boredom-r2-overlay/` and the plan file are **untracked/uncommitted**
(user's verification-gated rule: commit only when they approve).

## 4. Remaining work

1. **Bodycam cuts (4)** — the only unfinished deliverable. Both sync methods
   correctly refused: audio cross-correlation is too weak (subject wore
   headphones; only sparse room speech is shared between bodycam mic and HMD
   mic) and cue transcription found almost nothing in the bodycam audio (0–6
   candidates/session). Options, pending user input:
   a. User supplies rough per-session bodycam↔OBS start offsets → cut all 4
      via `bodycam_sync_cues.py`-style window math + verification frames.
   b. Audio forensics: gain-boost bodycam audio, listen-windows, wider search,
      larger whisper model, or visual sync (bodycam may show the subject's
      hand/headset motions matching session events).
   Scripts: `bodycam_cut.py` (envelope xcorr + guards), `bodycam_sync_cues.py`
   (cue-based). Bodycam durations ≈ HMD durations (Lucas ±6 s; Matthew Webcam
   2318.4 s vs HMD 2327.5 s), so duration priors are decent.
2. **Advisory sync flags to sanity-check with the user** (only if they report
   an overlay looks off): Lucas Interesting (single-anchor b=−9.54, matches
   duration prior) and Matthew Boring (start-side anchors only, b=+11.85,
   matches audio-confirmed end instruction). All other sessions are two-sided
   multi-anchor.
3. **Commit decision** — offer to commit `scripts/boredom-r2-overlay/` + plan
   + handoff after user review (WSL commit only; never push without approval).
4. Optional/if asked: corpus-index registration of the new artifacts; a
   side-by-side bodycam+HMD composite for the appendix.

## 5. File map (repo)

```
scripts/boredom-r2-overlay/
  common.py            paths, session discovery, MANUAL_ANCHOR_LINES, cue variants
  events.py            closure detection, CPU-whisper cues, sync fit, window, CropEvents
  trim.py              text-preserving CSV row filter + t_rel_s append
  run_phase_a.py       Phase A driver (events→trim→verify→QA report)
  harden_sync.py       consensus + energy-veto video sync (writes back CropEvents)
  calibrate.py         Round 1 green-dot DLT projection fit
  preview_overlay.py   single-frame overlay previews
  overlay.py           cut+overlay renderer (NVDEC→numpy→NVENC, ~26 min/session)
  heatmap.py           per-session + aggregate heatmaps
  bodycam_cut.py       bodycam sync via envelope xcorr (weak here) + cutter
  bodycam_sync_cues.py bodycam sync via cue transcription (found ~nothing)
  batch_phase_b.py     idempotent batch driver (skips existing outputs)
  calibration-fit-r1-boring.json   durable projection fit (7.7px median, 87 pairs)
plans/boredom-r2-gaze-overlay-plan-2026-07-31.md   design + all user rulings
plans/HANDOFF-BOREDOM-R2-OVERLAY-2026-08-04.md     this file
```

Interpreters: `/home/dalton/.venv/bin/python` (pandas/numpy);
whisper CLI `~/.pyenv/versions/3.11.9/bin/whisper`.

## 6. Boot prompt for a clean session

Paste the block from §6 of this file (kept verbatim below):

---

> **SUPERSEDED FOR §4.1 — bodycam cuts COMPLETE 2026-08-05, see §7.**

Resume the Boredom Round 2 gaze-overlay pipeline. Read
`plans/HANDOFF-BOREDOM-R2-OVERLAY-2026-08-04.md` first (state, rules, file
map), and skim `plans/boredom-r2-gaze-overlay-plan-2026-07-31.md` for the
locked rulings. Everything is COMPLETE and verified on D: except the 4 bodycam
cuts (Lucas ×3, Matthew 03-15 Webcam) — see handoff §4 for why both sync
methods refused and the two resolution paths; ask me which path to take (or
I'll provide manual offsets). Ground rules: originals are never modified
(outputs = `<original>_Crop.<ext>` siblings); the analysis windows are locked
(CSV closure anchors in `scripts/boredom-r2-overlay/common.py` — do NOT
recompute or re-crop; the dissertation analysis already consumed the crops);
verification-gated — show me evidence and wait for sign-off before committing
anything; ask before any GPU-heavy work in case my ingestion is running. The
projection calibration is durable at
`scripts/boredom-r2-overlay/calibration-fit-r1-boring.json` — use it for any
render/heatmap work; do not refit unless it visibly fails. Start by
re-verifying the deliverable counts from handoff §2 on disk, then address the
bodycam question.

---

---

## 7. ADDENDUM 2026-08-05 — bodycam cuts COMPLETE (all deliverables now done)

§4.1 resolved via path (a) seeded by the user's eyeball anchors, then upgraded
to a definitive sync. Root cause of both earlier refusals: the bodycam a:1
room-mic track is SILENT — there was never room audio to match. But the
bodycam OBS recordings carry the **same desktop/stimulus mix as HMD a:0 on
their a:0 track**, so envelope xcorr of the two mix tracks in two 90 s
stimulus-dense windows (search ±35 s around the user anchors) nails the sync:
z=9–22 per window, runner-up peaks at noise level (z≈2), early/late windows
agreeing to the 20 ms step in all 4 sessions (no drift).

| Session | b_body (bodycam_t = et_t + b) | vs user anchor | z early/late |
|---|---|---|---|
| Lucas Boring | −2.88 | −1.70 | 21.8 / 20.0 |
| Lucas Clinical | −13.50 | +2.96 | 9.4 / 13.2 |
| Lucas Interesting | −6.50 | +3.04 | 21.7 / 11.3 |
| Matthew 03-15 Interesting | −116.25 | −3.70 | 22.5 / 9.5 |

- Tool: `scripts/boredom-r2-overlay/bodycam_verify.py` (verify; `--apply` =
  NVENC cut). Supersedes `bodycam_cut.py`/`bodycam_sync_cues.py` for these
  sessions (kept for the record). A first verify pass wrongly promoted lone
  weak mic-track xcorr peaks over the user anchors — fixed: weak evidence
  never outranks the anchors.
- Outputs (user-signed-off 2026-08-05, durations match windows to ±0.03 s,
  originals untouched): 4 × `<stem>_Crop.mkv` beside sources. Note Matthew's
  bodycam is `Matthew Lo_03-15-24_BodyCam_Interesting.mkv` on disk (the
  "Webcam" stem in §1/§4 was renamed at some point).
- Provenance: `bodycam` block in each session's `CropEvents.json`
  (b_body_s, method=stimulus-mix-xcorr, window peaks, user anchor).
- Evidence bundle: `Boredom Experiment Round 2/BODYCAM-SYNC-VERIFICATION-2026-08-04/`
  (report + start/mid/end side-by-side frames per session).

Remaining from §4: commit decision (scripts + plans, WSL only, user approval)
and the optional §4.4 extras.
