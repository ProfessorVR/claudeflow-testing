# Event Tier Micro-Log — Window 02:59.00–03:00.96 (clip time)

Frames: e_0721–e_0768 (frame N → t = 149 + (N-1)/24 s)
- e_0721 = 149.00s
- e_0768 = 150.958s

## Observation

Every sampled frame across the full window (e_0721, e_0722, e_0723, e_0724, e_0725, e_0726,
e_0727, e_0728, e_0729, e_0730, e_0731, e_0732, e_0733, e_0734, e_0735, e_0736, e_0737, e_0738,
e_0739, e_0740, e_0745, e_0750, e_0755, e_0760, e_0765, e_0768 — spanning t≈149.00s to t≈150.958s)
is **solid black** across the entire 960x540 frame. No game geometry, characters, HUD elements
(minimap, health/stamina/deadeye cores, money counter, honor notification, button prompts),
subtitles, letterboxing, or environmental detail are visible in any frame.

The only persistent on-screen element in every frame is a **performance-monitoring overlay**
(third-party capture/overlay tool, not game UI) fixed to the top-right corner, reading:
`FPS 86  48 (1%L)  |  GPU xx %  xx °C  xxxx MHz  1.090 V  xxx W  xxxx RPM  14983 MHz  |  CPU xx %  |  LAT 0.1 ms  39.0 ms`

This overlay's individual numeric values fluctuate slightly frame-to-frame (GPU % drifting
46→40→27→28%, GPU temp 62→60→61°C, GPU clock 3180→3225→3195 MHz, GPU power 483→483→483W,
fan RPM 2254→2190→2148→2054, CPU % 26→20→25%), confirming these are live, distinct video
frames and not a single frozen/duplicated black frame — the underlying game render is simply
not present/visible (black) for the entire duration sampled.

A small microphone icon and a circular record/capture icon are visible in the bottom-right
corner in all frames, consistent with the same overlay/capture software chrome, unchanged
throughout.

No fades-from-black or fades-to-something-else are observed within the sampled frames — the
image is already black at the window's first sampled frame (149.00s) and remains black through
the window's last sampled frame (150.958s). [UNCERTAIN: whether this represents a genuine
in-game black screen — e.g., a cinematic fade/blackout, loading transition, or player
unconsciousness/blackout effect — versus a capture/encoding dropout, since no letterbox bars,
vision-effect vignetting, or any other diagnostic game-UI element is visible to confirm engine
state.]

## Chronological Table

| Frame | Time (s) | Screen state | Overlay telemetry (top-right) | Notes |
|---|---|---|---|---|
| e_0721 | 149.000 | Solid black | GPU 46% 62°C 3180MHz 483W 2254RPM / CPU 26% | mic+record icons bottom-right |
| e_0722 | 149.042 | Solid black | same as above | |
| e_0723 | 149.083 | Solid black | same as above | |
| e_0724 | 149.125 | Solid black | same as above | |
| e_0725 | 149.167 | Solid black | same as above | |
| e_0726 | 149.208 | Solid black | GPU 40% 60°C 3180MHz 483W 2190RPM / CPU 20% | telemetry shift |
| e_0727 | 149.250 | Solid black | same as e_0726 | |
| e_0728 | 149.292 | Solid black | same as e_0726 | |
| e_0729 | 149.333 | Solid black | same as e_0726 | |
| e_0730 | 149.375 | Solid black | same as e_0726 | |
| e_0731 | 149.417 | Solid black | same as e_0726 | |
| e_0732 | 149.458 | Solid black | same as e_0726 | |
| e_0733 | 149.500 | Solid black | same as e_0726 | |
| e_0734 | 149.542 | Solid black | same as e_0726 | |
| e_0735 | 149.583 | Solid black | same as e_0726 | |
| e_0736 | 149.625 | Solid black | same as e_0726 | |
| e_0737 | 149.667 | Solid black | same as e_0726 | |
| e_0738 | 149.708 | Solid black | same as e_0726 | |
| e_0739 | 149.750 | Solid black | same as e_0726 | |
| e_0740 | 149.792 | Solid black | same as e_0726 | |
| e_0745 | 150.000 | Solid black | GPU 40% 60°C 3180MHz 483W 2190RPM / CPU 20% | |
| e_0750 | 150.208 | Solid black | GPU 27% 60°C 3225MHz 483W 2148RPM / CPU 20% | telemetry shift |
| e_0755 | 150.417 | Solid black | same as e_0750 | |
| e_0760 | 150.625 | Solid black | same as e_0750 | |
| e_0765 | 150.833 | Solid black | GPU 28% 61°C 3195MHz 483W 2054RPM / CPU 25% | telemetry shift |
| e_0768 | 150.958 | Solid black | same as e_0765 | |

## Audio cross-reference (from provided transcript, not independently verified against this window)
- 02:59.5 "see, friendship ain't so tough" — falls within/just before this window
- 03:01.5 "and neither is you" — falls just after this window's end (150.958s / 03:00.958 clip time)

No visual corroboration of these lines is possible from the sampled frames since the entire
window is black.
