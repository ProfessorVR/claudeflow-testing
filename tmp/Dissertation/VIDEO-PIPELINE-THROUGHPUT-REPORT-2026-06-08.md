# Video-Analysis Pipeline — Throughput Report & Frame-Density Guidance

**Date:** 2026-06-08 · **Purpose:** measured throughput for the "full fresh re-analysis from recordings" decision, with speed/cost estimates across frame-sampling options so we can choose frame density deliberately.
**Hardware:** RTX 5090 (32 GB, now ~29.7 GB free after stopping god-agent GPU services) · pyenv Python 3.11.9 · torch 2.9.1+cu128 · ffmpeg 6.1.1 (with `cuda`/`h264_cuvid` HW decode) · openai-whisper 20250625 (large-v3).
**Source profile:** RDR2 captures are **3840×2160 (4K), 60 fps, ~150 Mbps H.264**. Corpus ≈ **537 GB ≈ ~8 hours** total. Test file: `RDR2 - 10 - Bar Fight.mp4` (8.9 GB, 7.93 min).

---

## 1. TL;DR / verdict

- **The pipeline works end-to-end.** Audio→transcript and video→frames both validated on real footage.
- **Audio is effectively free.** Extraction = 447× realtime (1s for an 8-min file). Transcription = 4.6× realtime (openai large-v3) → the **entire ~8 h corpus transcribes in ~100 min**, once, and the timestamped transcript captures **all dialogue**.
- **Frames are the scarce resource — but the cost is in *reading*, not extracting or storing.** Extraction time is ~constant across interval; storage is trivial; **the binding constraint is how many frames *I* read** (≈1.2 K vision-tokens each at 1280px). Uniform dense frames over the whole corpus is infeasible to read at any interval ≤1/10s.
- **Therefore: transcript = complete backbone; frames = tiered by moment-importance** (dense at load-bearing moments, sparse on traversal). This delivers "full fresh re-analysis" without trying to read tens of thousands of frames.
- **Scene-change detection is unusable on gameplay** (0 frames on continuous-camera play). Use fixed intervals; reserve scene-detect (low threshold) for cutscene-heavy files only.

---

## 2. Audio (extraction + transcription) — measured

| Step | Measure | Extrapolation to ~8 h corpus |
|---|---|---|
| Audio extract → 16 kHz mono WAV | **1 s** for 7.93 min (447× realtime); ~15 MB/8 min | ~2–3 min total; ~0.5 GB WAV |
| Transcribe (openai large-v3, GPU, fp16) | **107.7 s** for 494 s audio = **4.6× realtime**; 221 segments | **~100 min** total transcription |
| Model load | 67 s first run (incl. 2.88 GB download); ~5–10 s after | one-time |

**Quality:** good on clear single-speaker dialogue; **degrades on music/ambient/overlapping audio** (repetition hallucinations, e.g. "I got it ×5"). **Recommended upgrade for real runs:** `faster-whisper` (CTranslate2) with **Silero VAD** — cuts hallucinations and runs several× faster; *risk:* CUDA `sm_120` (Blackwell) support in CTranslate2 is unproven, so keep **openai-whisper as the validated fallback**. Either way, transcripts get a light manual cleanup pass where they feed a citation.

---

## 3. Frames — measured (120 s window, 1280px, q:v 3)

| Method | Wall time | Frames | Note |
|---|---|---|---|
| CPU decode, 1 frame/1 s | 27 s | 120 | full decode pass |
| CPU decode, 1 frame/5 s | 25 s | 24 | **~same time as 1/1s** → decode dominates, interval only changes frames kept |
| GPU decode (`-hwaccel cuda`), 1 frame/1 s | 25 s | 120 | ≈CPU; bottleneck is scale+JPEG-encode+write, not decode |
| Scene-change (`select gt(scene,0.3)`) | 27 s | **0** | continuous-camera gameplay has no hard cuts → unusable here |
| Avg frame size @1280px | — | — | **~110 KB** |

**Two extraction modes (matters for sparse sampling):**
- **Dense (≤1/2s): one full-decode pass** ≈ **13.5 s per minute of footage** (~4.5× realtime), *independent of interval*. A 40-min file ≈ 9 min; whole corpus ≈ ~108 min.
- **Sparse/targeted (≥1/10s, or specific timestamps): fast-seek per frame** (`-ss` before `-i`) ≈ **~0.3–0.5 s/frame**, far cheaper than a full pass. Best for traversal stretches and for pulling exact moments by transcript timestamp.

---

## 4. Frame-option comparison table (the "more vs fewer frames" decision)

Per-frame read cost ≈ **~1.2 K tokens @1280px** (≈0.7 K @960px — a lever if we need cheaper reads). Storage ≈ 110 KB/frame.

| Interval | Frames/min | 40-min file | Full ~8 h corpus | Storage (corpus) | **Read cost (corpus, tokens)** | Read cost (40-min file) |
|---|--:|--:|--:|--:|--:|--:|
| **1 / 1 s** | 60 | 2,400 | 28,800 | ~3.0 GB | ~34.6 M ❌ infeasible | ~2.9 M |
| **1 / 2 s** | 30 | 1,200 | 14,400 | ~1.5 GB | ~17.3 M ❌ | ~1.4 M |
| **1 / 5 s** | 12 | 480 | 5,760 | ~605 MB | ~6.9 M ❌ | ~576 K |
| **1 / 10 s** | 6 | 240 | 2,880 | ~303 MB | ~3.5 M ⚠ heavy | ~288 K |
| **1 / 30 s** | 2 | 80 | 960 | ~101 MB | ~1.15 M ⚠ | ~96 K |
| **targeted** | n/a | ~30–150/file | ~1–3 K total | <300 MB | ~1.2–3.6 M (spread across sessions) ✅ | ~36–180 K |

*Extraction time and storage are NOT reasons to choose fewer frames (both cheap/constant). The decision is governed entirely by the rightmost columns — what I can actually read.*

**What each density buys / misses (continuous gameplay):**
- **1/1 s** — every subtitle + micro-action + expression; heavy redundancy. *Worth it only for short load-bearing moments* (a 30–120 s cutscene, fight choreography).
- **1/2 s** — practically all distinct subtitles + actions; the "dense" setting for important sequences.
- **1/5 s** — beat/scene-level state + most UI prompts; misses rapid visual changes (dialogue is covered by transcript anyway). Good *default for ordinary gameplay*.
- **1/10 s** — location/situation-level; good for traversal/exploration (riding between objectives, G&G wandering).
- **1/30 s+** — orientation only ("where am I, what's around"); for long low-event stretches.

---

## 5. Recommended strategy — transcript backbone + tiered frames

Because dialogue lives in the (complete) transcript, **frames only need to carry visual state**: UI/control prompts, on-screen action, environment, character expression, HUD. So:

1. **Transcribe the full audio** of every analyzed file (complete, timestamped). Cheap.
2. **Index** each file: skim transcript + the beat structure to mark load-bearing moments.
3. **Tier the frames** I *read* by moment-importance:
   - **Tier A — load-bearing moments** (the bar-fight choreography, the bell-gift/miniaturization, the rape-scene cutscene, key NPC exchanges): **1/1–1/2 s**.
   - **Tier B — ordinary gameplay/mechanics teaching** (tasks, camp chores, combat tutorials, UI prompts): **1/5 s**.
   - **Tier C — traversal/exploration/low-event**: **1/10–1/30 s** (fast-seek).
4. **Pull exact frames by transcript timestamp** when a line needs a visual (fast-seek, ~instant).
5. **Resolution 1280px default** (subtitles + prompts legible); drop to 960px for bulk Tier-B/C to halve read cost; bump only if fine UI detail is needed.

This keeps total frames *read* to ~1–3 K across the whole project (feasible over the planned sessions) while still grounding every claim in real footage + real dialogue.

---

## 6. Per-case recommended defaults

| Case | Footage | Audio | Frame plan |
|---|---|---|---|
| **RDR2 tutorial** (Sessions 5–6) | ~15 numbered files, many GB each | full transcripts of all | Tier B (1/5 s) across mechanics/camp/NPC beats; Tier A (1/2 s) on the validation beat (Bar Fight / Train Robbery) + key narrative moments; Tier C on riding/traversal |
| **Gnomes & Goblins** (Session 7) | (VR capture — need path) | full transcript | Tier B (1/5 s) over exploration; Tier A (1/1–1/2 s) on the bell-gift → miniaturization shock |
| **Rape scene** (Session 8) | the relevant clip(s) | full transcript (Sonny's lines, Bill's camp dialogue — critical) | **Tier A (1/1 s)** over the entire cutscene + lead-in/threshold + aftermath (this is the capstone; dense reading justified) |

---

## 7. Open levers for the user to set
- **Default ordinary-gameplay interval:** 1/5 s (recommended) vs 1/10 s (lighter) vs 1/2 s (richer).
- **Frame resolution:** 1280px (recommended) vs 960px (cheaper) vs higher (fine UI).
- **Transcription engine:** openai-whisper (validated now) vs try faster-whisper+VAD (faster/cleaner; Blackwell risk).
- Whether to **batch-transcribe all audio up front** (~100 min, one pass) vs per-session.

## 8. Pipeline artifacts (validated)
- Audio extract: `ffmpeg -i SRC -vn -ac 1 -ar 16000 -c:a pcm_s16le out.wav`
- Frames (dense): `ffmpeg -ss <t0> -t <dur> -i SRC -vf "fps=1/N,scale=1280:-1" -q:v 3 f_%04d.jpg`
- Frame (exact): `ffmpeg -ss <t> -i SRC -frames:v 1 -vf scale=1280:-1 -q:v 3 f.jpg`
- Transcribe: `python3 transcribe_test.py` (large-v3, cuda, fp16; writes timestamped `.txt`) — at `/tmp/rdr2-preflight/transcribe_test.py`.
- Scratch: `/tmp/rdr2-preflight/` (transient; outputs are cheap to regenerate).
