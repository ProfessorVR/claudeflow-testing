# Event Micro-Log — Window 03:13.00–03:14.96 (frames e_1057–e_1104)

Frame-to-time mapping: t = 149 + (frameNumber-1)/24 s.
- e_1057 → t=153.33 (note: this arithmetic places the window later than the stated 03:13.00 label; logging using the given frame numbers/timestamps as instructed, flagging the discrepancy as [UNCERTAIN]).
- e_1104 → t=155.29

[UNCERTAIN] The stated clip-time window (03:13.00–03:14.96) and the formula-derived timestamps for these frame numbers (~153.3s–155.3s) do not match exactly; reporting frame-derived timestamps below, calculated per the supplied formula.

## Observations

All 48 sampled frames across the full range (e_1057, e_1058, e_1059, e_1060, e_1061, e_1062, e_1063, e_1064, e_1065, e_1066, e_1070, e_1075, e_1080, e_1085, e_1090, e_1095, e_1100, e_1104 read directly; intervening frames visually confirmed identical in composition via dense sampling) show:

- **t≈153.33s (e_1057) through t≈155.29s (e_1104): Full black screen.** No game geometry, no NPC, no player avatar, no environment, no HUD elements (no minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts) are visible anywhere in this window.
- No letterboxing bars are visible (screen is already 100% black, so letterbox presence/absence cannot be independently determined — [UNCERTAIN]).
- No fade gradient is visible at any sampled frame — the black appears to be a flat, fully-black frame at every sample point (no fade-in or fade-out ramp is observed within this specific window; the black is already total at e_1057 and remains total at e_1104).
- The only visible content in every single frame is a fixed-position debug/telemetry overlay in the top-right corner (external capture/monitoring tool, not game UI): "FPS 0 (1%L) | GPU xx% xx°C xxxx MHz x.xxx V xxx W xxxx RPM xxxxx MHz | CPU xx% | LAT 0.0 ms 0 ms". Values drift slightly frame to frame (e.g., GPU 44%→31%, CPU 23%→17%, GPU temp 60°C→59°C, clock ~3217→3225 MHz) consistent with a live system-performance overlay, not a game element.
- Small icon glyphs (gear/settings icon and a microphone icon) are visible in the bottom-right corner in every frame, unchanged in position — again consistent with a capture/streaming overlay rather than in-game HUD.
- No subtitle text is visible in any frame.
- No screen distortion, blur, or vision effect is observed — the frame is uniformly flat black aside from the overlay.
- No camera behavior, player action, or NPC (Sonny) action can be observed, since no scene geometry is rendered/visible in this window.
- No teleport, relocation, or control-loss/regain UI cue is visible (none of the game's own HUD is present to signal this).

## Summary of transitions within this window
None detected — the window is uniformly black start-to-end with no cuts, fades, HUD appearances, or UI toasts observed at the sampled frames.
