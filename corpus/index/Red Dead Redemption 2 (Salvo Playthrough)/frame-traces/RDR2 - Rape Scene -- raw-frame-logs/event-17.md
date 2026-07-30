# Event Micro-Log 17 — clip window 03:01.00–03:02.96 (frames e_0769–e_0816)

Frame-to-time mapping: t = 149 + (frameNumber-1)/24 s

## Overview
Every single frame in this window (48 frames, e_0769 through e_0816, spanning t=149.00s to t=150.96s clip time) shows a **completely black screen**. There is no visible game content whatsoever — no cabin interior, no player, no Sonny, no props, no letterbox bars, no subtitle text, no game HUD elements (no minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts). The only persistent element across all frames is a **debug/performance overlay HUD** in the top-right corner reading stats such as `FPS`, a secondary FPS/frame value, `GPU %`, temperature (°C), clock (MHz), voltage (V), power (W), fan RPM, memory clock (MHz), `CPU %`, and `LAT` (latency, ms) — this is a hardware-monitoring overlay (e.g., RivaTuner/MSI Afterburner-style OSD), not a game UI element.

A small microphone icon persists in the bottom-right corner throughout (recording indicator, likely from the capture/streaming software).

## Chronological log

- **t=149.00s (e_0769)** – Screen fully black. Overlay HUD top-right: `FPS 86 | 48 (1%L) | GPU 28% 61°C 3195MHz 1.090V 483W 2054RPM 14983MHz | CPU 25% | LAT 0.1ms 39.0ms`. Mic icon visible bottom-right.
- **t=149.04–149.17s (e_0770–e_0773)** – No change. Screen black, same overlay stats held static (FPS 86/48, GPU 28% 61°C, CPU 25%).
- **t=149.21s (e_0774)** – Overlay stats shift: `FPS 0 | 0 (1%L) | GPU 43% 61°C 3225MHz 1.090V 206W 1947RPM 14983MHz | CPU 23% | LAT 0.0ms 0ms`. This is a notable HUD value change (FPS drops to 0, power draw drops from 483W to 206W) — [UNCERTAIN whether this reflects an actual in-engine event such as a cutscene/render pause, or is simply an artifact of the overlay sampling during a black/paused frame].
- **t=149.25–149.79s (e_0775–e_0788)** – No visual change; screen remains black. Overlay stats held constant at the e_0774 values (FPS 0/0, GPU 43% 61°C, CPU 23%, LAT 0.0/0ms).
- **t=149.83s (e_0789)** – Overlay stats shift again: `FPS 0 | 0 (1%L) | GPU 40% 61°C 3202MHz 1.090V 206W 1840RPM 14983MHz | CPU 24% | LAT 0.0ms 0ms`.
- **t=149.83–150.42s (e_0789–e_0804)** – Screen remains black; overlay stats static at the e_0789 values.
- **t=150.46s (e_0805)** – Overlay stats shift: `FPS 0 | 0 (1%L) | GPU 25% 61°C 3210MHz 1.090V 206W 1743RPM 14983MHz | CPU 19% | LAT 0.0ms 0ms`. A small gear/settings-style icon [UNCERTAIN — possibly a loading spinner, pause-state icon, or capture-software icon] appears in the bottom-right corner next to the mic icon.
- **t=150.46–150.83s (e_0805–e_0813)** – Screen remains black; gear icon persists bottom-right alongside mic icon; overlay stats static.
- **t=150.88s (e_0814)** – Gear icon no longer visible (only mic icon remains bottom-right). Overlay stats shift: `FPS 0 | 0 (1%L) | GPU 47% 61°C 3232MHz 1.090V 206W 1696RPM 14983MHz | CPU 27% | LAT 0.0ms 0ms`.
- **t=150.88–150.96s (e_0814–e_0816)** – Screen remains black through the end of the window; overlay stats static at e_0814 values.

## Summary of environment/content
No cabin, no exterior, no weather, no lighting, no NPC (Sonny), no player avatar, no props (skulls/bed/table) are visible in any frame of this window — the entire span is a black frame. No cinematic letterbox bars are present (nothing to letterbox), no fade transition is visually resolvable (frames are uniformly black start to end, so no fade-in/fade-out gradient is observed within this specific window), no subtitles rendered, no button prompts, no toasts, no minimap, no core meters, no money counter, no honor notification.

## Ambiguous / flagged items
- [UNCERTAIN] Whether the black screen represents an intentional in-game fade-to-black/cutscene transition (consistent with a scene ending or vision effect) versus a rendering/capture artifact — no accompanying letterbox or fade gradient is visible to confirm either way.
- [UNCERTAIN] The FPS/power-draw shifts at e_0774, e_0789, e_0805, e_0814 in the debug overlay (drops from FPS 86 to FPS 0, power 483W→206W) may indicate the game rendering paused/idled during this black stretch (consistent with a loading pause or scripted black-frame hold), but this cannot be confirmed from visual content alone since it is a hardware-monitoring overlay, not a game-state indicator.
- [UNCERTAIN] The small gear-like icon appearing bottom-right from t=150.46s–150.83s (e_0805–e_0813) — its function/meaning is not identifiable from the frame image alone.
