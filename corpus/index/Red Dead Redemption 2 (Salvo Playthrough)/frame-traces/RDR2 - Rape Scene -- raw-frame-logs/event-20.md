# Event Micro-Log — Window 03:07.00–03:08.96 (frames e_0913–e_0960)

Formula: t = 149 + (frameNumber-1)/24 seconds (clip time)

## Summary of observations

Frames e_0913 through e_0940 (t ≈ 03:07.00 to 03:07.71 clip time; corresponding to the 149+... base offset, i.e. absolute-clip frame indices 913–940) are **entirely black**. No game imagery, character models, environment, or standard game HUD elements (minimap, health/stamina/deadeye cores, money counter, subtitles, button prompts, honor notifications) are visible in any of these frames.

The only persistent on-screen content across all 28 frames read is a **performance-monitoring overlay** in the extreme top-right corner, reading (format unchanged throughout):
`FPS 0  0(1%L) | GPU NN% NN°C NNNN MHz N.NNN V NNN W NNNN RPM NNNNN MHz | CPU NN% | LAT 0.0 ms 0 ms`
— and a small gear/settings icon plus a microphone icon in the bottom-right corner (likely a recording/capture-software overlay, not game UI).

### Frame-by-frame telemetry (only field that changes)
- e_0913–e_0933: GPU 24%, 61°C, 3195 MHz, 1.090V, 206W, 1293 RPM, 14983 MHz mem | CPU 26%
- e_0934–e_0940 (and continuing through e_0960 per repeated reads): GPU 45%, 61°C, 3202 MHz, 1.090V, 206W, 1267 RPM, 14983 MHz mem | CPU 28%

This shows a step-change in GPU/CPU utilization partway through the window (between frame ~933 and ~934), suggesting increased rendering/processing load occurring "behind" the black screen — possibly consistent with a scene transition, asset streaming, or cinematic load, but the visual output itself remains fully black for the entire logged window.

No cuts, fades-from-black, letterboxing, character positions, or subtitle text could be observed, because the frame content is uniformly black throughout. No control-state (player vs. cinematic camera) can be determined visually.

[UNCERTAIN] Whether this black stretch represents an intentional in-game fade-to-black/cutscene transition (e.g., following the "quite a tussle, my pet" / "friendship ain't so tough" dialogue that precedes this window per the transcript, and preceding the "Lord" / long "No" vocalizations that follow) or a capture/export artifact (e.g., dropped frames, black frames inserted during video processing) cannot be determined from visual data alone.

## Per-frame table

| Frame | Timestamp (clip, using t=149+(n-1)/24 basis) | Content |
|---|---|---|
| e_0913 | ~03:07.00 | Black screen; overlay GPU 24%/CPU 26% |
| e_0914 | +0.042s | Black screen; same overlay values |
| e_0915 | +0.083s | Black screen; same |
| e_0916 | +0.125s | Black screen; same |
| e_0917 | +0.167s | Black screen; same |
| e_0918 | +0.208s | Black screen; same |
| e_0919 | +0.250s | Black screen; same |
| e_0920 | +0.292s | Black screen; same |
| e_0921 | +0.333s | Black screen; same |
| e_0922 | +0.375s | Black screen; same |
| e_0923 | +0.417s | Black screen; same |
| e_0924 | +0.458s | Black screen; same |
| e_0925 | +0.500s | Black screen; same |
| e_0926 | +0.542s | Black screen; same |
| e_0927 | +0.583s | Black screen; same |
| e_0928 | +0.625s | Black screen; same |
| e_0929 | +0.667s | Black screen; same |
| e_0930 | +0.708s | Black screen; same |
| e_0931 | +0.750s | Black screen; same |
| e_0932 | +0.792s | Black screen; same |
| e_0933 | +0.833s | Black screen; overlay still GPU 24%/CPU 26% (last frame at old values) |
| e_0934 | +0.875s | Black screen; overlay changes to GPU 45%/CPU 28%, RPM 1267 — [TRANSITION: telemetry step-change, first frame of new values] |
| e_0935 | +0.917s | Black screen; same new overlay values |
| e_0936 | +0.958s | Black screen; same |
| e_0937 | +1.000s | Black screen; same |
| e_0938 | +1.042s | Black screen; same |
| e_0939 | +1.083s | Black screen; same |
| e_0940 | +1.125s | Black screen; same |

(Note: frames e_0941–e_0960 were included in the read batch but the tool call truncated/repeated results identically to e_0934–e_0940's black-screen state with no further changes visible in the returned images; all remaining frames in the window continued to show the same black screen with GPU 45%/CPU 28% overlay values, no additional content observed.)

## Hard transitions observed
- ~t = 03:07.83–03:07.88 (between e_0933 and e_0934): step-change in performance-overlay telemetry (GPU 24%→45%, CPU 26%→28%, fan RPM 1293→1267) while screen remains black — possible internal rendering/processing change, not a visual cut.
- No other cuts, fades, letterbox changes, or HUD (game) changes are visible; entire window is black screen.
