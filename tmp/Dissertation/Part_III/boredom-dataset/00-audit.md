# Boredom Raw Dataset — Audit (Phase 2A-lite, anonymized)

Metadata-level only (O-9/O-10 deferred). Subject codes S01–S08 by sorted directory order; mapping intentionally not recorded. '(Med)' cohort marker noted where present, meaning unconfirmed.

## Subjects inventory
### S01
- files: 35 · total 11GB · by dir: (root):3, EEG:3, HMD:6, Images:22, OBS:1 · by ext: fig:21, csv:6, mat:3, mp4:2, png:1, txt:1, avi:1
- state-labeled root files: Boring_Focused_Do.mp4 (41MB); Boring_Focus_Do.png (28KB)
### S02 · (Med) marker
- files: 34 · total 10GB · by dir: (root):1, EEG:3, HMD:6, Images:21, OBS:3 · by ext: fig:21, csv:6, mat:3, mp4:3, txt:1
### S03 · (Med) marker
- files: 47 · total 9GB · by dir: (root):2, EEG:3, HMD:6, Images:35, OBS:1 · by ext: fig:35, csv:5, mat:3, mp4:2, txt:1, xlsx:1
- state-labeled root files: Boring_Bored (EC,HA,LA)_Wu.mp4 (58MB)
### S04
- files: 34 · total 10GB · by dir: (root):1, EEG:3, HMD:6, Images:21, OBS:3 · by ext: fig:21, csv:6, mat:3, mp4:3, txt:1
### S05
- files: 32 · total 11GB · by dir: (root):1, EEG:3, HMD:6, Images:21, OBS:1 · by ext: fig:21, csv:6, mat:3, txt:1, mp4:1
### S06
- files: 32 · total 12GB · by dir: (root):1, EEG:3, HMD:6, Images:21, OBS:1 · by ext: fig:21, csv:6, mat:3, txt:1, mp4:1
### S07
- files: 28 · total 7GB · by dir: (root):1, EEG:3, HMD:7, Images:14, OBS:3 · by ext: fig:14, csv:7, mat:3, mp4:3, txt:1
### S08 · (Med) marker
- files: 35 · total 12GB · by dir: (root):3, EEG:3, HMD:5, Images:21, OBS:3 · by ext: fig:21, csv:5, mp4:4, mat:3, png:1, txt:1
- state-labeled root files: Boring_Bored(EC,HA)_Vermani.mp4 (2GB); BOR_Eye Gaze Axis.png (30KB)

## Videos/ (state-contrast compilations)
- `B-AvsIE_Clip.mp4` — 136MB · 1m04s · 3840x2160 · 60/1fps
- `Boring_LAvsEngagement.mp4` — 2GB · 12m33s · 3840x2160 · 60/1fps
- `Boring_LAvsHA.mp4` — 1GB · 11m34s · 3840x2160 · 60/1fps
- `CLC - IE vs E & Attention Span.mp4` — 2GB · 12m14s · 3840x2160 · 60/1fps
- `CLC_HAvsE.mp4` — 2GB · 13m30s · 3840x2160 · 60/1fps
- `CLC_HAvsME-A_Clip.mp4` — 191MB · 1m04s · 3840x2160 · 60/1fps
- `INT_LA,ASvsIE.mp4` — 2GB · 11m02s · 3840x2160 · 60/1fps
- `INT_LA,AvsIE.mp4` — 170MB · 1m08s · 3840x2160 · 60/1fps
- `LAvsHA_Clip.mp4` — 119MB · 1m04s · 3840x2160 · 60/1fps
- `LAvsIE_Clip.mp4` — 355MB · 2m32s · 3840x2160 · 60/1fps

## Naming key (user-confirmed + observed)
CLC=clinical video · INT=interesting (alien-reproduction-vehicles) · Boring=MS-Word tutorial · LA/HA=low/high arousal · IE=intense engagement · E=engagement · ME=moderate engagement · AS=attention span (graded) · EC=eyes closed (confirmed). Unconfirmed: '(Med)' cohort marker; 'B-A' prefix; AS grade levels → ask at O-10.

## Deferred (needs GPU session and/or O-9/O-10)
- Frame-tier ingest + comportment reads of the 10 compilations (ffmpeg/whisper on 5090; stop vLLM/embedder first).
- Any .mat/HMD processing (O-9); any subject↔paper mapping or unpublished-subject use (O-10).
