# Event Micro-Log — Window 02:57.00–02:58.96 (frames e_0673–e_0720)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 seconds.
- e_0673 → t ≈ 149.00s (02:29.00 absolute-session... using clip-relative mapping supplied: this window corresponds to clip time ~02:57.00–02:58.96)
- e_0720 → t ≈ 150.96s

## Observation

Every one of the 48 sampled frames (e_0673 through e_0720, ≈150.00s–150.96s by the given formula, i.e., the 02:57.00–02:58.96 clip-time window) shows a **fully black frame**. There is no visible gameplay imagery, no player/avatar, no NPC (Sonny), no environment/props, no letterboxing bars distinguishable from the black field, and no minimap/health/stamina/deadeye cores, money counter, honor notification, button prompts, or subtitle text rendered in the frame.

The only visible element in every frame is a **performance-monitoring overlay** (likely a capture/benchmarking tool overlay, e.g. RTSS/MSI Afterburner-style OSD) fixed in the top-right corner, reading metrics such as:
- `FPS` (values observed: 97, then dropping to 92)
- a secondary frame counter e.g. `48 (1%L)`
- `GPU %`, temperature (°C), clock (MHz), voltage (V), power (W), fan RPM, VRAM clock (MHz)
- `CPU %`
- `LAT` (latency, ms) and a second ms value

Observed overlay value changes across the window (only numeric telemetry changes; no scene content changes):
- e_0673–e_0676: FPS 97, GPU 95%, 68°C, 3067MHz, 1.055V, 478W, 2229RPM, 14983MHz; CPU 24%; LAT 8.4ms/37.7ms
- e_0677 onward: FPS drops to 92, GPU 42%, 63°C, 3180MHz, 1.075V, 486W, 2248RPM, 14983MHz; CPU 26%; LAT 11.1ms/38.3ms (this reading persists essentially unchanged through e_0698)
- e_0699–e_0720: GPU 46%, 62°C, 3195MHz, 1.090V, 486W, 2264RPM, 14983MHz; CPU 30% (FPS/LAT otherwise stable at 92 / 11.1ms/38.3ms)

No cinematic bars, fades, blur, or vision-distortion effects are distinguishable from the pure black background — the frame is uniformly black aside from the overlay text, so it is [UNCERTAIN] whether this reflects: (a) a black screen transition/fade within the game (e.g., cutscene fade-to-black, loading transition, or death/blackout screen), or (b) a capture artifact (e.g., dropped/corrupted frame extraction, video output briefly blanked, or a genuinely black in-game moment such as an eyes-closed POV or unconscious-state effect). No on-screen subtitle text is rendered in any frame in this window, despite the whisper transcript indicating dialogue ("see, friendship ain't so tough" at 02:59.5, "and neither is you" at 03:01.5) occurring at the edge of/just after this window.

No transitions between distinguishable visual states occur within this window — the entire 48-frame sample is uniform black with only the overlay telemetry changing.

## Summary

Across the entire sampled window (02:57.00–02:58.96 clip time, frames e_0673–e_0720), the screen is uniformly black in every frame, with no visible player, NPC, environment, or HUD elements — only a fixed performance-telemetry overlay (FPS/GPU/CPU/LAT metrics) in the top-right corner shows any change. No subtitles, prompts, or UI toasts are legible. It is [UNCERTAIN] whether this reflects an in-game black-frame effect (e.g., a fade transition) or a capture/extraction issue, since no letterboxing, fade gradient, or distortion is distinguishable from the flat black field. No scene content transitions were observed to log as hard cuts.

- Exact timestamps of hard transitions observed: **none** — no fades, cuts, control-state changes, or HUD-state changes are visually discernible within this window; the image is uniformly black throughout e_0673–e_0720 (~150.00s–150.96s per the frame-number formula).
- Overlay telemetry shift (not a scene transition, flagged only as a data note): FPS 97→92 and GPU/thermal values step down between e_0676 and e_0677; GPU%/CPU% step again between e_0698 and e_0699 (42%→46% GPU, 26%→30% CPU) — these are performance-counter changes only, not visual scene changes.
