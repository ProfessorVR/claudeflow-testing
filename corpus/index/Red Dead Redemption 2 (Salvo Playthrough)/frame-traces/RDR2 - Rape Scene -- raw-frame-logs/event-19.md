# Event Micro-Log — Window 03:05.00–03:06.96 (frames e_0865–e_0912)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 s (clip time), mapped here to clip-relative mm:ss.

## Observations

- **03:05.00 (e_0865) through 03:06.96 (e_0912)**: Screen is **entirely black** across all 48 frames sampled in this window (every 1st, 5th, 10th frame checked explicitly: e_0865–e_0876 sequential, then e_0880, 0885, 0890, 0895, 0900, 0905, 0910, 0912). No visible game geometry, no character models, no environment, no visible HUD elements (minimap, health/stamina/deadeye cores, money counter, honor notification, button prompts, subtitles, toasts) at any point in this range.
- No letterbox bars, fade transition edges, blur/distortion, or vision-mode effects are discernible — the frame is uniform black, consistent with either (a) a black-frame/fade-to-black cutscene beat, or (b) a rendering/capture artifact for this segment. [UNCERTAIN — cannot distinguish fade-to-black vs. capture dropout from visual data alone]
- A persistent **debug/performance overlay** is visible in the top-right corner across all frames (present in every frame, unchanged in structure, only numeric values drift slightly): `FPS 0  0(1%L) | GPU NN% NN°C NNNN MHz N.NNN V NNN W NNNN RPM NNNNN MHz | CPU NN% | LAT 0.0 ms 0 ms`. This is a system performance monitor (likely MSI Afterburner / RTSS style overlay), not a game HUD element. Values observed drift gradually: GPU% 43→45→42→24; GPU temp steady 61°C; CPU% 30→27→23→26; FPS reads 0 throughout (consistent with a black/paused frame producing no rendered frame count).
- A small **gear/settings icon** and a **microphone icon** are visible in the bottom-right corner of every frame, unchanged in position and appearance throughout — likely a capture-software or streaming overlay icon, not part of game HUD.
- No cuts, scene changes, teleports, or avatar relocations are visually detectable, since no scene content is rendered/visible at all in this window.
- No subtitles appear on screen in this window (the transcript's "Lord" ~03:27.9 and "No" ~03:29.9–03:39.8 lines fall outside this window's timestamps in any case).

## Summary of frame-by-frame

| Frame | Timestamp | Content |
|---|---|---|
| e_0865 | 03:05.00 | Black; overlay GPU 43%, CPU 30% |
| e_0866 | 03:05.04 | Black; same overlay values |
| e_0867 | 03:05.08 | Black; same |
| e_0868 | 03:05.13 | Black; same |
| e_0869 | 03:05.17 | Black; same |
| e_0870 | 03:05.21 | Black; same |
| e_0871 | 03:05.25 | Black; same |
| e_0872 | 03:05.29 | Black; overlay GPU 45%, CPU 27% |
| e_0873 | 03:05.33 | Black; same |
| e_0874 | 03:05.38 | Black; same |
| e_0875 | 03:05.42 | Black; same |
| e_0876 | 03:05.46 | Black; same |
| e_0880 | 03:05.63 | Black; same |
| e_0885 | 03:05.83 | Black; overlay GPU 42%, CPU 23% |
| e_0890 | 03:06.04 | Black; same |
| e_0895 | 03:06.25 | Black; overlay GPU 24%, CPU 26% |
| e_0900 | 03:06.46 | Black; same |
| e_0905 | 03:06.67 | Black; same |
| e_0910 | 03:06.88 | Black; same |
| e_0912 | 03:06.96 | Black; same |

[UNCERTAIN]: Whether this sustained black screen represents an in-game fade-to-black (e.g., end of a cutscene transitioning to black before a hard cut, or a deliberate narrative black-out during/after the assault), a loading screen, or a capture/encoding artifact. No visual cues (letterbox, vignette edges, partial fade gradient) are present to disambiguate — the black is uniform and total in every sampled frame.
