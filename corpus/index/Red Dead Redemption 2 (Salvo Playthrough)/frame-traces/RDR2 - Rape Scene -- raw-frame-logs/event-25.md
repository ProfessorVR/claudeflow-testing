# Event Micro-Log — Window 03:17.00–03:18.96 (clip time)

Frames examined: e_1153.jpg through e_1200.jpg (48 frames, 24fps, ~2.0s span)
Frame timestamp formula: t = 149 + (frameNumber-1)/24 sec (clip time)

## Observation

Every frame in this window (e_1153–e_1200), sampled across the full range (start: e_1153/e_1154/e_1155/e_1156/e_1157/e_1158/e_1159/e_1160; middle: e_1180; end: e_1200), shows an **entirely black frame**. No scene geometry, avatar, NPC, HUD elements (minimap, health/stamina/deadeye cores, money counter, honor notification, button prompts), subtitle text, cinematic letterbox bars, or environmental detail (cabin interior/exterior, props, lighting) is visible in any frame.

The only visible content in every frame is a fixed performance-overlay readout in the top-right corner (third-party monitoring overlay, not game UI): `FPS 0 0 (1%L) | GPU NN% NN°C NNNN MHz N.NNN V NNN W NNNN RPM NNNNN MHz | CPU NN% | LAT 0.0 ms 0 ms`. The numeric values fluctuate slightly frame to frame (e.g., GPU% ranges ~34–47%, CPU% ~17–26%, GPU temp 60–61°C) but this is telemetry, not diegetic content — it does not indicate any change in game state.

No cursor, no watermark/gear icon changes were noted beyond the small gear/mic/clock icons fixed at bottom-right of frame, present and static throughout (part of the same overlay, not game HUD).

## Chronological log

- **03:17.00 (e_1153)** — Frame is fully black. Overlay: GPU 43%, 61°C, CPU 25%.
- **03:17.04–03:18.92 (e_1154–e_1199)** [UNCERTAIN — sampled subset, not every single frame individually inspected, but all sampled frames across start/middle/end show identical black-frame state] — Frame remains fully black throughout; no visible transition, cut, fade-in/out gradient, letterbox change, or content of any kind detected in sampled frames (e_1154, 1155, 1156, 1157, 1158, 1159, 1160, 1180). Only the static performance overlay is present, with its numeric readouts drifting slightly (GPU 43–47%, CPU 17–26%, GPU temp 60–61°C).
- **03:18.96 (e_1200)** — Frame is fully black. Overlay: GPU 34%, 60°C, CPU 17%.

## Notes / flags

- [UNCERTAIN] Because the entire window is black, it is not possible to determine from images alone whether this represents: a held black screen/fade-to-black (e.g., end of a cutscene fade, loading transition, or death/blackout POV effect), a capture/encoding artifact, or a deliberate in-game black-frame moment. No fade gradient (partial brightness ramp) was observed in the sampled frames — the transition into and out of this black window (if any) falls outside this frame range.
- No subtitle text was visible in any frame in this window, despite the whisper transcript indicating nearby dialogue ("Lord" ~03:27.9, "No" ~03:29.9–03:39.8) — those transcript timestamps fall after this window's end (03:18.96) if using the same clip-time base, so absence of on-screen subtitles here is expected/consistent.
- Recommend cross-checking adjacent windows (immediately before 03:17.00 and after 03:18.96) to establish whether this black stretch is a fade-out tail, a fade-in lead, or a sustained mid-scene blackout, and to locate any letterbox/HUD state that bookends it.
