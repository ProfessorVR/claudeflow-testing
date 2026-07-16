# O-9 Processing Scoping Plan — Boredom Experiment (VR Attention Study)

> **Provenance:** produced 2026-07-16 by a multi-agent workflow (4 channel specialists → adversarial feasibility verify → synthesis), grounded in direct inspection of the raw dataset. Companion to the anchor `corpus/index/Boredom Experiment (VR Attention Study)/`. Subjects kept as **S01–S08** throughout.
>
> **Author operational note (2026-07-16):** D: drive space **will be freed** before ch-obs frame extraction. This relaxes the *streaming-only / no-frame-dump* constraint in §2.4 and §3 to a **recommendation** — a 720p JPEG frame-dump (~24–40 GB) becomes viable if preferred for iterating. NVDEC streaming remains the low-footprint default; the job is IO-bound on reading ~85.6 GB regardless, so freeing space removes the *blocker* but not the IO ceiling.
>
> **No body camera (confirmed 2026-07-16):** none was ever recorded, so ch-obs cannot be a body/comportment surface — it yields corroboration of ch-hmd/gaze only. Per the author, ch-obs is deferred as its **own separate final phase**; the three light channels (ch-hmd / ch-fig / ch-eeg) are the priority.


Deferred channels: **ch-hmd, ch-fig, ch-eeg, ch-obs.** All corrections from the adversarial verdicts are folded into the body below (not appended). Subjects are kept as **S01–S08** throughout; the real-name → S## crosswalk is pinned out-of-band and never appears in any deliverable.

---

## 1. Orientation — what O-9 processing buys

O-9 turns four already-captured but unprocessed raw streams into the **three-surface keystone** that the dissertation's boredom argument rests on: a **workload surface** (EEG band-power / cognitive load), an **arousal surface** (HR, HRV, pupil dilation, vendor cognitive-load), and a **comportment surface** (head-restlessness / off-task from the VR feed) — all three resolvable to a common stimulus timeline so the BOR-vs-INT contrast (CLC as control) can be read across surfaces per subject. Two payoffs are outsized relative to cost. First, **full N=8 EEG**: P1 published only N=3 (one "clean"); the format is fully decoded, all 24 `.mat` files load in ~1 s, and the entire filter→band-power→workload pipeline is CPU-seconds — the only real work is deciding the workload formula and artifact threshold. Second, the **arousal surface is largely already computed**: HR, HRV, pupil dilation and a normalized cognitive-load index are vendor-derived and sitting in the HMD CSVs — extraction and aggregation, not signal processing, is what remains. The comportment surface (ch-obs) is the one genuine unknown, and it required a premise pivot (below). Net: three of four channels are "light" CPU work measured in dev-hours, not compute-hours.

**Honest caveat up front:** ch-obs as originally commissioned (body-pose/posture/fidget from a comportment camera) **cannot be delivered** — the video is the first-person in-VR headset feed, not a body camera. The pivoted signals corroborate ch-hmd more than they add an independent axis. **Confirmed 2026-07-16: no body camera was ever recorded** — so ch-obs is corroboration-only, not a third surface. It is deferred as its own separate final phase (below); the three light channels are the priority.

---

## 2. Per-channel plans (recommended sequence: cheapest / most-already-done first)

### Sequence
1. **ch-hmd** — arousal already computed; establishes the canonical S01–S08 ordering + the crop (stimulus-locked) windows other channels align to. Light, CPU.
2. **ch-fig** — validates ch-hmd's inferred gaze/pupil definitions and supplies the *processed* gaze/pupil the CSV lacks; skip re-plotting HR/HRV/CogLoad (byte-exact CSV dups). Light, CPU. Depends on ch-hmd for the cross-check.
3. **ch-eeg** — full N=8 workload surface, fully independent. Light, CPU.
4. **ch-obs** — comportment surface; GPU + heavily IO-bound; premise pivot needs team sign-off. Moderate. Run last.

---

### 2.1 ch-hmd — HMD telemetry / arousal (already exported to CSV)

**Format facts**
- Headerless, comma-delimited, **12 columns**: `col1–4` = wall-clock H,M,S,ms; `col5` = gaze *unit* vector string `X=.. Y=.. Z=..` (norm ≈ 0.9995–0.9999); `col6/7` = L/R eye dilation mm; `col8/9` = L/R validity flags {0,1}; `col10` = cognitive load 0–1; `col11` = HR bpm int; `col12` = HRV ms float.
- **Invalid sentinel:** validity flag 0 rows carry `col5 = X=-1 Y=1 Z=-1` and dilation `-1.0`. One S01 file had ~33% invalid rows. Must mask to NaN before any mean/SD — never average the `-1`.
- **Sampling is non-uniform and bimodal within a file.** Most files ~6 Hz *by mean-dt* but **dt is bimodal** — samples arrive in ~8 ms bursts spaced ~300 ms (S01 dt percentiles 10/50/90 = 8/300/342 ms), so median-dt gives ~3.3 Hz while mean-dt gives ~5.7 Hz. **S06** Clinical + Interesting run ~88 Hz (mean) / ~125 Hz (median) — ~30× the row count. A single `sample_rate_hz` scalar is ill-defined.
- HR/HRV/CogLoad (`col10–12`) are **held/step** vendor values at a slower internal cadence; duplicated consecutive values are expected, not errors. HRV metric type (RMSSD vs SDNN) is undocumented — treat as vendor black-box.
- **`_Crop` = a re-export** trimmed to the stimulus-presentation window, at a *lower* effective rate than `full` — **not a row-subset**. Use crop as the canonical stimulus-locked window; record the discrepancy.
- **File inventory (corrected):** "6 CSVs per folder" holds only for S01/S02/S04/S05/S06. **S03 = 5 CSV + 1 `.xlsx`** (its Clinical crop is Excel 2007+); **S07 = 7 CSV** (a `Boring_Crop 2.csv` duplicate); **S08 = 5 CSV**. Total = **47 HMD CSVs + 1 xlsx**.
- **S08 IS NOT missing Interesting_Crop** (verdict correction) — `..._Interesting_Crop.csv` exists (2286 rows) alongside Boring_Crop (2307). **S08 is missing ONLY Clinical_Crop.** The step-7 crop-fallback must use S08's real INT crop — it is a key BOR-vs-INT cell.
- **S06** has four large files, not two: Interesting full 122,791 + crop 95,079, Clinical full 105,962 + crop 84,354 (all ~88–125 Hz). Still trivial compute.
- Naming irregularities beyond the obvious BOR label split: a subject's own name is spelled inconsistently across their filenames — transposed letters (a surname mis-typed two ways), embedded spaces, and misspellings. Folder-based globbing tolerant of these is fine; **any code keying on a filename prefix breaks.**

**Approach**
1. Build a manifest by folder, robust to the `{Boredom|Boring}→BOR`, `{Clinical}→CLC`, `{Interesting}→INT` variants; exclude `_Crop`, `Crop 2`, `.xlsx` when collecting `full` files. Assign S01–S08 by **one shared canonical sorted order** (see §3 PII) — the same rule every channel uses.
2. Parse with `pandas.read_csv(header=None, names=[...])`; regex-parse `col5` into `gaze_x/y/z`.
3. Build `t = hh*3600+mm*60+ss+ms/1000` (seconds-of-day). Keep **absolute wall-clock** (the cross-channel alignment key to EEG/OBS) plus within-stimulus relative time.
4. Mask invalids to NaN (validity 0 → dilation + gaze NaN; treat all `-1` sentinels as NaN).
5. Derive the two gaze signals from the unit vector — `Eye Gaze Axis` = angular displacement `acos(clip(dot(v, v_ref)))` in degrees; `Eye Gaze Median` = median-filtered angle. **These definitions are inferred — validation against a ch-fig numeric series is MANDATORY (not optional) before trusting all 24 files.** This is the channel's main correctness risk and the explicit coordination point with ch-fig.
6. Per-file QC: **report BOTH mean-Hz and median-Hz** and note the burst structure; do **not** naively interpolate over bursts to a common grid (it distorts). Surface S06's ~88–125 Hz and any file >20k rows as outliers.
7. Aggregate per (subject × stimulus × signal): mean/median/SD/min/max; for arousal signals (HR, HRV, cognitive load, dilation) also within-window slope and first-vs-last-third delta (boredom is a time-course phenomenon). **Aggregate on the crop window when available**; fall back to full *with a flag* only where crop is genuinely missing (S08 CLC; S03 CLC if xlsx unreadable).
8. Emit tidy-long + wide feature tables + a QC/manifest table.

**Tooling / deps + env note**
- **Interpreter: `/home/dalton/.venv/bin/python`** (pandas 2.3.3, numpy 1.26.4). Base pyenv `python3` has no pandas.
- **`openpyxl` is confirmed ABSENT** in `.venv` — `read_excel` raised ImportError. `pip install openpyxl` before reading S03's Clinical crop. If pip is blocked, S03 CLC-crop falls back to the full window **with an explicit flag** (CLC = control, low impact) — never silently dropped.
- No scipy/h5py/mne/opencv needed. `numpy/pandas rolling().median()` covers the gaze-median filter; stdlib `re` for the gaze-vector parse.
- No GPU; vLLM untouched.

**Compute / effort:** CPU-only, well under a minute total (seconds for small files, ~1–2 s each for the S06 giants). **~1–2 dev-hours** to write and validate the parser (manifest, gaze regex, invalid-masking, fig cross-check), then minutes to run.

**Output schema**
- **(A) Tidy long:** `subject_id ∈ S01..S08, stimulus ∈ {BOR,INT,CLC}, window ∈ {crop,full}, signal ∈ {cognitive_load, eye_gaze_axis, eye_gaze_median, hr, hrv, left_eye_dilation, right_eye_dilation}, stat ∈ {mean,median,sd,min,max,slope,delta_last_first_third,pct_valid}, value`.
- **(B) Wide arousal vector** per (subject, stimulus, window): `hr_mean, hr_slope, hrv_mean, hrv_sd, cogload_mean, cogload_slope, dilL_mean, dilR_mean, dil_mean, gaze_axis_mean_deg, gaze_axis_sd_deg, gaze_median_deg, pct_valid_eye, n_samples, sample_rate_mean_hz, sample_rate_median_hz, duration_s`.
- **(C) QC/manifest:** `subject_id, stimulus, window, n_rows, mean_hz, median_hz, duration_s, pct_invalid, crop_available(bool), format_note ∈ {xlsx|dup|missing|full-fallback}`. **`source_path` and `format_note` must be name-scrubbed.**

**Risks:** non-uniform/bimodal rate (over-weights S06 if pooled raw); sentinel leakage; naming variance breaking globs; crop-is-re-export; **inferred gaze definitions (mandatory fig validation)**; **overlap with ch-gaze (P2 eye-tracking) and ch-fig** — decide ch-hmd CSV is the authoritative *raw* source and ch-fig is validation; wall-clock timestamps assume synchronized capture clocks (flag drift risk for downstream alignment); HRV algorithm undocumented.

---

### 2.2 ch-fig — MATLAB `.fig` embedded-series extraction

**Format facts**
- All 175 `.fig` are **Matlab v5 mat-file little-endian PCWIN64** (every file checked) — `scipy.io.loadmat` is correct; **h5py genuinely not needed** (zero v7.3/HDF5).
- Struct keys `hgS_070000` / `hgM_070000` / `meta_data`. `DisplayName` empty on every lineseries → **sub-signal identity is POSITIONAL only.**
- **Structure correction (critical):** multi-trace signals are **NOT one axes carrying N lineseries.** Pupil L/R = **5 separate axes (subplots), each with exactly ONE `graph2d.lineseries`**; gaze likewise. Sub-series order (pupil `smooth0..4`, gaze `X/Y/Z`) is **axes/subplot document order** — a walker keyed on a single axes is wrong. **Recurse figure→axes→lineseries over all axes, order by axes document position.**
- 19 numeric traces per (subject, stimulus): HR=1, HRV=1, CogLoad=1, EyeGazeAxis=3, EyeGazeMedian=3, PupilLeft=5, PupilRight=5.
- **XData = irregular elapsed seconds from 0** (~2.97 Hz; S01 BOR dt min 0.268 / max 0.407 / mean 0.337). **Carry XData verbatim; never assume fixed dt.**
- **Duplication (corrected — off-by-one):** HR/CogLoad/HRV fig YData == HMD `_Crop.csv` cols 11/10/12 **byte-exact, but only TAIL-aligned.** S01 BOR happened to be head==tail (fig 2178 == csv 2178). **S08 BOR: fig 2308 vs csv 2307** — the fig carries one extra *leading* sample; head-aligned maxAbsDiff = 7.0, tail-aligned = 0.0. **Enforce tail alignment (or length-diff offset) and re-verify per (subject,stimulus)** — a head-aligning provenance check misclassifies S08's HR/Cog/HRV as `fig_derived_only`.
- **Gaze/pupil figs are PROCESSED and exist ONLY in the `.fig`** — gaze differs from raw CSV `col5` (unit vector vs filtered angle); pupil differs from raw `col6/7` (blink-removed, `-1` dropouts gone). Pupil 5-trace = a monotonic denoising cascade (roughness 0.134→0.060→0.046→0.038→0.020 at constant mean ~3.02); gaze axis vs median = two filter levels. **Filter windows are undocumented — the fig pupil/gaze cannot be regenerated from the CSV.** For pupil/gaze the `.fig` is authoritative.
- **Coverage:** 175 on disk, **161 unique.** **S03 has 35 figs** — flat `Images/{BOR,INT}` are **md5-identical** to nested `Boring/Interesting` → dedup to 21 (verify identity per-file, don't assume). **S07 is missing the entire Interesting set** (BOR+CLC only = 14 figs; a real data gap, not extraction error). Other six subjects = complete 21. Layouts: flat = S01/S03/S07/S08; nested `Images/{Boring,Clinical,Interesting}/` = S02/S04/S05/S06.
- **Normalizer under-scoped (corrected):** beyond the known typos (`INT_RIght`, `EyeGaze_Media` [missing *n* — won't fuzzy-match "median"]), some nested folders carry **bare names with no stimulus prefix** (`HR.fig`, `CogLoad.fig`, `PupilDilation_Left.fig`) — **stimulus and sometimes signal must come from the PARENT FOLDER.** `Heart Rate` is an HR alias (S08's `BOR_Heart Rate.fig` has no "HR" substring). A filename-only resolver silently drops these.

**Approach**
1. Invoke **`/home/dalton/.pyenv/versions/3.11.9/bin/python3` by absolute path** (see env note — this is the critical trap).
2. `loadmat(path, struct_as_record=False, squeeze_me=True)`; recurse figure→axes→lineseries, collect XData/YData per lineseries, **order sub-series by axes document order.**
3. Resolve `(stimulus, signal)` by **token-normalized match on filename AND mandatory parent-folder fallback**: `Boring/Clinical/Interesting → BOR/CLC/INT`; `Heart Rate → HR`; `Media → Median`.
4. **Skip re-extracting HR/HRV/CogLoad as new signal** — mark them `csv_exact_dup` (ch-hmd is the better raw source); extract them only as a **tail-aligned validation** cross-check.
5. Extract gaze (2 filter levels) and pupil (5-level cascade) as the fig's **unique value-add** (`fig_derived_only`).
6. Validate positional sub-series labels by **roughness monotonicity** (pupil `smooth0..4`) and value/geometry ranges (gaze X/Y/Z vs raw CSV) **per subject before trusting axis labels.**
7. Dedup S03 (per-file md5), flag S07-missing-INT explicitly.

**Tooling / deps + env note**
- **Interpreter: `/home/dalton/.pyenv/versions/3.11.9/bin/python3` — by absolute path.** `python3` on PATH resolves to `/usr/bin/python3` 3.12 (no scipy) whenever cwd is `/mnt/d` (the data location); the pyenv shim only selects 3.11.9 inside the project dir. `cd '/mnt/d/.../Boredom Experiment' && python3 extract.py` fails `ModuleNotFoundError: scipy`. Verified. (Alternatively `export PYENV_VERSION=3.11.9`.)
- scipy 1.16.0 + numpy 2.2.6 (present in 3.11.9). h5py NOT required. No GPU/vLLM.

**Compute / effort:** CPU-only, 161 files @ 0.1–0.5 s each → **<2–3 min** full extraction, <1 GB RAM. **~1–2 dev-hours** for extractor + name-normalizer + validation.

**Output schema:** long/tidy — `subject (S01..S08), stimulus (BOR|INT|CLC), signal (HR|HRV|CogLoad|EyeGazeAxis|EyeGazeMedian|PupilLeft|PupilRight), subseries (na | X/Y/Z | smooth0..smooth4), t_sec (irregular ~2.97 Hz from XData), value, provenance (csv_exact_dup | fig_derived_only)`. Companion coverage manifest flags S07-missing-INT and S03 dedup. **Provenance/manifest must never carry a real name or source filename.**

**Risks:** positional sub-series identity (validate by roughness/geometry); layout+typo heterogeneity (token+folder resolver); S07 genuine INT gap (don't misalign); off-by-one dup alignment (tail-align, re-verify per file); irregular dt (carry XData); fig pupil/gaze not reproducible from CSV (fig is authoritative for these); wasted effort if HR/HRV/CogLoad are re-plotted (validation-only).

---

### 2.3 ch-eeg — 4-channel EEG workload channel

**Format facts**
- **24/24 present** (8 subjects × 3 stimuli). BOR-pole naming split: `Boredom` (S01/S05/S06) vs `Boring` (S02/S03/S04/S07/S08) — normalize to BOR in code.
- All 24 = **MAT v5 PCWIN64** (BIOPAC/AcqKnowledge export) — `scipy.io.loadmat` reads every file; **h5py not needed.** Variables: `data (N×5)`, `labels`, `units`, `isi`, `isi_units='ms'`, `start_sample=0`.
- **5 columns, not 4:** `col0–3` = EEG (mV, all labeled generically `EEG100C`); **`col4` = a near-constant aux/marker line** (`Custom, AMI / HLT - A16`, Volts) → **DROP for EEG analysis.** (Verdict correction to the aux description: only **2 of 8** subjects have aux ~9.93 V — **S01 and S06** — the other six are ~0.01 V; S07 is *not* uniquely low. Immaterial since the column is dropped.)
- **`isi = 5.0 ms → fs = 200 Hz`, uniform across all 24** (Nyquist 100 Hz, adequate for theta 4–8 / alpha 8–13). **Read `isi` per file; don't hardcode.**
- **Channel identity is UNKNOWN** — all four EEG cols labeled `EEG100C`; the expected F3/F4/P3/P4 montage appears nowhere in the data or the survey `.txt` (grep for F3/F4/P3/P4/montage/10-20 = no hits). Frontal-vs-parietal formulas rest on an unverified column-order assumption.
- **Two duration anomalies** (anchors confirmed exact): **S06 BOR = 404,789 rows / 33.73 min** (~double); **S07 INT = 390,183 rows / 32.52 min**, filename itself notes "(forgot to shut down, last 5-7 minutes garbage)". Both need tail truncation. For reference: min-normal 192,584 = S03 INT (16.05 m); max-normal 227,602 = S06 INT (18.97 m); **S07 BOR = 227,281 (~18.9 m) is long but clean/normal** — do not mistake it for an anomaly.
- No systematic clipping (|x|≥0.4999 mV = 0.0–0.2% per channel, transient). **No EOG/EMG/reference channels** (only the flat aux) → artifact rejection must be amplitude/statistics-based, not regression/ICA.
- ~8 MB/file, ~205 MB total — loads fully in RAM.

**Approach**
1. **Re-run the 1-s inventory as the pipeline's first step** rather than trusting cached facts (format decode is trivially recoverable — the verdict reproduced the whole inventory in ~1.1 s; no persisted artifacts exist yet, nothing was lost).
2. Load each file `squeeze_me=True`, take `data[:, :4]` (mV), discard `col4`; confirm `fs=200` from `isi` per file.
3. **Trim anomalies:** truncate S06 BOR and S07 INT to the intended ~17-min window (~204k samples) / clip the flagged tail; log both as QC exceptions. Normalize BOR naming.
4. **Filter:** demean/detrend → 4th-order Butterworth bandpass ~1–40 Hz (`butter`+`filtfilt`) + **60 Hz notch** (US mains, `iirnotch`).
5. **Artifact rejection (no EOG):** epoch (2 s, 50% overlap); mark bad if any channel exceeds a robust amplitude threshold (`|x| > median + k·MAD`, or a fixed ±0.3–0.5 mV cap) or shows abnormal variance/kurtosis; reject/interpolate; keep **retained-epoch fraction** as QC.
6. **Band power:** per retained epoch/channel, `welch` (Hann, `nperseg≈fs*2`), integrate theta (4–8) and alpha (8–13) (± delta/beta for context).
7. **Workload proxy (B-Alert-*style*, NOT licensed B-Alert):** frontal-theta rise + parietal-alpha suppression → higher load. **Because channel identity is undocumented, either average the metric across all 4 channels OR state the assumed acquisition column order explicitly as an assumption.** Map to 0–1 by **per-subject** normalization (min-max or z→logistic across that subject's 3 stimuli), then bin: `<0.40 = underload/boredom`, `0.40–0.70 = ideal`, `>0.70 = overload`. Report bands **within-subject** — an "overload" epoch for S01 is not numerically comparable to S05 absent group calibration.
8. **Validate against P1's published N=3** (reproduce those three, confirm BOR < INT/CLC workload direction) before extending to all 8.

**Tooling / deps + env note**
- **`/home/dalton/.pyenv/versions/3.11.9/bin/python3` by absolute path** (same `/mnt/d` PATH trap as ch-fig). scipy 1.16.0 provides `io.loadmat` + `signal.butter/filtfilt/iirnotch/welch` — sufficient alone.
- mne **optional** (`pip install mne` only if you want its epoching/ICA/PSD conveniences); scipy-only path is recommended and lighter. h5py not needed.
- No GPU; vLLM irrelevant.

**Compute / effort:** trivial — all 24 load in ~1.1 s; full filter+reject+Welch+index+aggregate in **seconds to ~1 min single-threaded CPU.** **~1–3 dev-hours**, most of it spent choosing the workload formula, normalization reference, and artifact threshold.

**Output schema**
- **Epoch-level time-series** per (subject, stimulus): `{t_sec, workload_index_0to1, band_label ∈ {boredom,ideal,overload}, theta_power, alpha_power, retained_bool}` at ~1 s hop.
- **Summary row** per recording: `{subject, stimulus, fs=200, duration_min, n_epochs, retained_epoch_pct, mean_workload, median_workload, pct_time_boredom, pct_time_ideal, pct_time_overload, qc_flag}`.
- Deliverable = one tidy CSV/parquet of **24 summary rows (8×3)** + optional long epoch table. QC columns carry the anomaly flags (S06-BOR trimmed, S07-INT tail trimmed) and the channel-identity assumption note.

**Risks:** **channel identity unknown** (any frontal/parietal formula is assumption-laden — a montage note from the experimenter is needed for rigor); **B-Alert .40/.70 thresholds are proprietary/calibrated** (meaningful only after per-subject normalization; cross-subject absolute comparison fragile); **no EOG/EMG** (coarse amplitude rejection; P1 called only 1/3 "clean" → expect variable retained fractions); two corrupt tails (trim length for S06's double-length is a judgment call); BOR naming split; undocumented BIOPAC on-amp filtering; per-subject normalization → report within-subject.

---

### 2.4 ch-obs — session video / comportment surface (PIVOTED)

**Premise pivot (verified, load-bearing):** OBS `.mp4` is the **first-person in-VR headset feed** (Windows Mixed Reality screen capture), **not a third-person body camera.** Verified by frame extraction (WMR desktop portal, surgical/OR stimulus, curved-screen Word tutorial, talking-head). The camera *is* the subject's head, so head rotation moves the whole frame; any visible faces are stimulus presenters. **No participant body footage exists anywhere in the dataset.** Body-pose (RTMPose/YOLO-pose/MediaPipe) and face-gaze (6DRepNet/L2CS) models have **no valid input**. **Confirmed 2026-07-16: no body camera was ever recorded**; the pivoted signals corroborate ch-hmd rather than forming an independent third surface. ch-obs is scoped as its own separate final phase — decide at that point whether the segmentation/alignment value alone justifies the ~85.6 GB pass.

The pivot yields three deliverable signals from what a first-person VR feed actually supports: **(a) stimulus-state segmentation** (the cross-channel alignment anchor), **(b) head-motion / restlessness** (global optical flow, since the camera is the head — a fidget proxy), **(c) on-stimulus vs off-stimulus** (gaze-away = WMR-portal visible during a stimulus).

**Format facts**
- **Scope frame extraction to `*/OBS/*.mp4` ONLY** (correction). S01/S03/S08 each also carry a **derived team label-clip at the subject root** (e.g. a 733.8 s / 1.9 GB clip long enough to masquerade as real content) — a naive `find <subject> -iname '*.mp4'` sweeps these in and corrupts the manifest. Exclude everything not under `OBS/`. The `Videos/` folder holds team label-comparison compilations (LA/HA/IE/AS) — also excluded.
- **Structure (once scoped to OBS/):** **combined single file = S01/S03/S05/S06** (all 3 stimuli + WMR-portal gaps interleaved → must be segmented); **3 per-stimulus files = S02/S04/S07/S08** (S07 uses `*_ScreenCap_*`; the split files give **free stimulus-boundary ground truth**). The earlier "S08 has 4 files" worry is resolved — its 4th is the root-level derived clip, correctly excluded.
- Specs (ffprobe): **HEVC Main, 3840×2160, yuv420p, 60 fps, ~18–19.6 Mbps**, + an **aac audio stream** (PII/consent-sensitive — see PII).
- Per-subject OBS duration ranges **52.7–87.9 min** (not a uniform 83 min). **Grand total ≈ 8.86 h, ≈ 85.6 GB** (79.8 GiB across OBS/ files) — decode/IO-dominated.
- **RTX 5090, 32607 MiB, driver 610.74** (Blackwell sm_120, torch capability (12,0)).
- NVDEC verified: `ffmpeg -hwaccel cuda -c:v hevc_cuvid`; micro-benchmark decode+scale+fps=5 = **~10.4× realtime**.

**Approach**
0. **PREP:** deactivate vLLM (GPU contention, though 32 GB headroom is ample). **Pre-fetch model weights** (correction — neither is cached): CLIP ViT-B/32 (~600 MB) and torchvision `raft_small`; huggingface network is up now (HTTP 200), so download once before the batch or first model load stalls/fails. Build the OBS-scoped manifest with S01–S08 from the frozen canonical sort order (§3).
1. **Frame extraction — piped rawvideo, REQUIRED** (correction, not "JPEG or rawvideo"). **Do NOT stage source or dump ~160k JPEG frames to disk** — D: is **99% full (~39 GB free)** and WSL `/` is **98% full (~28 GB free)**; there is nowhere to stage and no room for a ~24–40 GB frame dump. `ffmpeg -hwaccel cuda -c:v hevc_cuvid -i <f> -an -vf 'fps=5,scale=1280:720' -f rawvideo -pix_fmt rgb24 -` → python stdin; process per-window **in memory**; write only the tiny derived outputs. Use `fps=2` for the classifier pass. `-an` always (drop audio).
2. **Stimulus-state segmentation (highest-value product):** CLIP ViT-B/32 zero-shot per frame (prompts: "a VR desktop menu", "a surgery operating room video", "an old computer tutorial screen", "a person talking to camera"), or a tiny logistic head on ~200 hand-labeled frames. Combined files (S01/S03/S05/S06) MUST be segmented; split files validate/refine the given boundaries. **Output timestamps become the alignment anchor for EEG/HMD/fig.**
3. **Head-motion / restlessness:** global inter-frame optical flow at 5 fps (`torchvision raft_small` GPU batched, or `cv2` Farneback CPU) → mean/percentile flow magnitude + a "large reorientation" event flag → continuous head-restlessness series + discrete head-turn events.
4. **On/off-stimulus:** frames classified WMR-portal *during* a stimulus segment = gaze-away/off-task. **This measures the same construct as the HMD gaze-vector — validate against it, do not treat as independent.**
5. **Scoring:** resample the three signals to a 1 Hz grid, z-score per subject, threshold into the team's LA/HA/IE/AS bins → per-subject-per-stimulus §D signature row.
6. **QA:** overlay derived off-task intervals on HMD gaze magnitude for 2–3 subjects; spot-check segmentation against split-file ground truth.

**Tooling / deps + env note**
- **`/home/dalton/.pyenv/versions/3.11.9/bin/python3`** — already has torch 2.9.1+cu128 (sees the 5090), torchvision 0.24.1+cu128 (`raft_small`), opencv 4.13, scipy 1.16, numpy 2.2, transformers 4.57.5 (CLIP). ffmpeg with `hevc_cuvid`/NVDEC present. **No new installs for the pivoted pipeline.** (onnxruntime is CPU-only / no CUDA provider — irrelevant since pose is dropped; decord not needed.)

**Compute / effort:** **IO-bound, not compute-bound.** NVDEC decode of 8.86 h ≈ 51 min pure-GPU, but **reading ~85.6 GB off a 99%-full (fragmented) D: drive sets the wall clock** — treat 2–3 h end-to-end as the **IO ceiling**, not a compute estimate. Segmentation (CLIP @1–2 fps) ~2–5 min; RAFT optical flow @5 fps ~20–40 min GPU. VRAM (NVDEC ~1–2 GB + RAFT ~2–4 GB + CLIP ~2 GB ≪ 32 GB) is a non-constraint. **Moderate** dev effort. Far lighter than the original body-pose framing (no body to track).

**Output schema** per (subject S01–S08, stimulus ∈ {BOR,CLC,INT}): **(A)** segment table `[state, t_start, t_end]` (the alignment anchor); **(B)** 1 Hz series `head_restlessness (z-scored flow magnitude), head_turn_events (rate), offtask_fraction (binary on-stimulus vs WMR-portal, + optional continuous screen-centroid offset)`; **(C)** §D signature-grid row (thresholded LA/HA/IE/AS cells). All keyed on S01–S08; **no names, no audio**. **Caveat in the schema: (B) overlaps ch-hmd — report as a corroborating surface, not an independent axis.**

**Risks:** **premise failure** (confirm with team first); **redundancy with ch-hmd** (scope as validation, not a new keystone axis); **disk near-full** (streaming-only, no staging); **weights not cached** (pre-fetch); **PII in filenames + folders + aac audio** (`-an`, never transcribe without authorization); segmentation ambiguity in combined files (calibrate on split-file ground truth); IO-bound wall clock.

---

## 3. Shared infrastructure

### Python environments (base python lacks scipy/pandas — always call by absolute path)
Two working interpreters already exist; **no full env needs to be built from scratch** — only one small install (`openpyxl`).

| Env | Path | Has | Used by |
|---|---|---|---|
| pyenv 3.11.9 | `/home/dalton/.pyenv/versions/3.11.9/bin/python3` | scipy 1.16.0, numpy 2.2.6, cv2 4.13, torch 2.9.1+cu128, torchvision 0.24.1+cu128, transformers 4.57.5, onnxruntime 1.22 (CPU-only), sklearn 1.7.1 | **ch-eeg, ch-fig, ch-obs** |
| venv | `/home/dalton/.venv/bin/python` | pandas 2.3.3, numpy 1.26.4 | **ch-hmd** |

- **The PATH trap (verified both directions):** bare `python3` resolves to `/usr/bin/python3` (3.12, **no scipy, no pandas**) whenever cwd is `/mnt/d` (where the data lives) or anywhere outside the project dir. The pyenv shim only selects 3.11.9 inside the project. **Always invoke the full interpreter path** (or `export PYENV_VERSION=3.11.9`). `cd '/mnt/d/.../Boredom Experiment' && python3 script.py` fails with `ModuleNotFoundError`.
- **`h5py` is NOT needed anywhere** — every `.mat` and `.fig` in the dataset is MAT v5, zero v7.3/HDF5. Do not install it.
- **`mne` optional** (ch-eeg only, if you want its epoching/ICA/PSD conveniences); the scipy-only path is recommended.
- **`openpyxl` — the one required install** (`/home/dalton/.venv/bin/pip install openpyxl`), for S03's Clinical-crop `.xlsx`. If pip is blocked, S03 CLC falls back to `full` with a flag (control channel, low impact).

### GPU plan (ch-obs only)
- Hardware: **RTX 5090, 32 GB, driver 610.74, sm_120**; torch cu128 sees it. VRAM is a non-constraint (peak ~6–8 GB across NVDEC + RAFT + CLIP).
- **Deactivate vLLM first** (frees the GPU; avoids contention).
- **NVDEC decode** via `ffmpeg -hwaccel cuda -c:v hevc_cuvid` (~10.4× realtime, verified). **Pre-fetch CLIP ViT-B/32 + `raft_small` weights** before the batch (not cached; network up now).
- **Disk is the binding constraint, not GPU:** D: ~39 GB free (99% full), `/` ~28 GB free (98% full). **Stream frames via ffmpeg rawvideo → python stdin; process in memory; write only the small derived outputs.** No source staging, no frame dump. Wall clock is set by ~85.6 GB HDD reads, not by the 5090.
- ch-eeg / ch-hmd / ch-fig need **no GPU** and leave vLLM untouched.

### PII handling
- **All working outputs key on S01–S08**; the dissertation-facing deliverable **must** carry no PII. Real names live in **folder names, every filename, and the OBS aac audio track**; medication status is embedded as `(Med)/(med)` folder tags.
- **One shared canonical S01–S08 ordering across ALL channels** (ch-eeg/ch-hmd/ch-fig/ch-obs). Freeze it explicitly: `sorted()` under a **fixed, documented key** — `os.listdir` is unordered and locale-dependent, and stripping `(Med)` tags before sorting could silently reorder subjects, both misaligning the cross-channel merge and enabling re-identification by mismatch. **Pin the name→S## crosswalk out-of-band; never persist it in any deliverable, log, manifest, or `provenance`/`source_path`/`format_note` field.** Scrub name-bearing filenames (xlsx/dup/typo variants) out of all outputs.
- **Medication** is a covariate in folder tags (three subjects tagged). If needed for analysis, capture as a **de-identified boolean column**, never the raw name; otherwise drop cleanly.
- **ch-obs audio:** extract frames with `-an`; **do not transcribe or export audio** without separate authorization (consent-sensitive experimenter/participant speech).

---

## 4. Sequenced checklist + honest total-effort read

**Shared prep (once):**
- [ ] Pin the name→S01–S08 crosswalk out-of-band; define the single `sorted()` key every channel imports.
- [ ] `pip install openpyxl` into `/home/dalton/.venv` (ch-hmd S03).
- [x] **Confirmed 2026-07-16: no body camera was ever recorded** — ch-obs is corroboration-only and is deferred to its own separate final phase (its stimulus-segmentation output remains useful as the cross-channel alignment anchor).

**1. ch-hmd (light, CPU, ~1–2 dev-h + minutes run)**
- [ ] Build folder-based manifest (BOR/CLC/INT normalization, `.xlsx`/dup/`Crop 2` handling; use S08's real INT crop; S03 xlsx via openpyxl or full-fallback flag).
- [ ] Parse, build wall-clock + relative time, mask invalids to NaN, derive gaze axis/median.
- [ ] QC with **both** mean-Hz and median-Hz + burst note; aggregate on crop window (flagged full-fallback where crop missing).
- [ ] Emit tidy-long + wide arousal + QC tables (name-scrubbed). **Hold the gaze axis/median definitions as provisional pending ch-fig.**

**2. ch-fig (light, CPU, ~1–2 dev-h + <3 min run) — validates ch-hmd, adds processed gaze/pupil**
- [ ] Extract via absolute-path 3.11.9; recurse figure→axes→lineseries, order by axes document position.
- [ ] Token+parent-folder resolver (bare names, `Heart Rate`, `Media` typo); dedup S03; flag S07-missing-INT.
- [ ] **Tail-align** HR/HRV/CogLoad to CSV, re-verify per (subject,stimulus) → mark `csv_exact_dup`.
- [ ] Extract gaze (2 levels) + pupil (5-level cascade) as `fig_derived_only`; validate sub-series order by roughness monotonicity + geometry.
- [ ] **Feed one gaze series back to lock ch-hmd's axis/median definitions.**

**3. ch-eeg (light, CPU, ~1–3 dev-h + seconds run) — full N=8 workload surface**
- [ ] Re-run the ~1 s inventory as step 1; load `data[:,:4]`, drop aux, read `isi` per file.
- [ ] Trim S06-BOR + S07-INT tails; normalize BOR naming.
- [ ] Filter (1–40 Hz + 60 Hz notch) → epoch + MAD/kurtosis rejection → Welch theta/alpha.
- [ ] Workload index (average across 4 channels **or** state assumed column order); per-subject 0–1 normalization + banding.
- [ ] **Reproduce P1's N=3 first**, confirm BOR < INT/CLC direction, then extend to 8. Emit 24-row summary + epoch table (QC flags + channel-identity assumption noted).

**4. ch-obs (moderate, GPU + IO-bound, ~2–3 h wall (IO ceiling) + dev) — comportment surface, LAST**
- [ ] Deactivate vLLM; pre-fetch CLIP + raft_small weights.
- [ ] OBS-scoped manifest (`*/OBS/*.mp4` only; exclude root/`Videos/` derived clips); frozen S01–S08.
- [ ] Stream (rawvideo pipe, `-an`, fps=5/2, 720p) → CLIP segmentation (anchor timestamps) + RAFT head-restlessness + on/off-task.
- [ ] Resample to 1 Hz, z-score, LA/HA/IE/AS signature grid; QA against HMD gaze + split-file boundaries. Schema caveat: corroborates ch-hmd, not independent.

**Honest total-effort read**
- **Compute is nearly free** for three of four channels: ch-eeg (~1 s load, seconds to run), ch-fig (<3 min), ch-hmd (<1 min). ch-obs is the only heavy one and it is **IO-bound** (~85.6 GB off a near-full HDD), so budget **2–3 h wall as the IO ceiling**, GPU is idle-headroom.
- **Dev effort dominates:** roughly **1–2 h each** for ch-hmd and ch-fig, **1–3 h** for ch-eeg (mostly the workload-formula/threshold decisions), and the **largest, least-certain** slice for ch-obs (segmentation prompts/labels + pipeline plumbing + team confirmation). Ballpark **1.5–2.5 focused days** across all four, most of it decisions and validation, not runtime.
- **What is still genuinely uncertain (flag before trusting outputs):** (1) EEG electrode→column mapping is undocumented — the workload formula is assumption-laden without a montage note from the experimenter; (2) B-Alert .40/.70 bands are proprietary — the reproduced index is comparable only *within subject*; (3) HMD gaze axis/median definitions are inferred until the ch-fig cross-check locks them; (4) HRV algorithm (RMSSD vs SDNN) is a vendor black box; (5) ch-obs premise — whether a body camera exists elsewhere, and whether the pivoted head/off-task signals count as an independent third surface or merely corroborate ch-hmd. Everything else (formats, fs, inventories, dup relationships, tooling) is verified.