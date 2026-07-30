# Micro-log — leadup-17 (frames l_0801–l_0850, clip t=02:20.00–02:24.90)

Frame timestamp formula: t = 60 + (frameNumber-1)/10 sec (clip time as stated in task; note this places the window well after the "02:2x" transcript cues below, consistent with the frame-number offset used for this batch).

## Overview
Across all 50 frames sampled (l_0801, l_0805, l_0810, l_0815, l_0820, l_0825, l_0830, l_0835, l_0840, l_0845, l_0850), the shot is essentially static: player-character (Arthur Morgan) stands on a covered wooden porch, viewed from behind/over-the-shoulder in third-person gameplay camera, facing an open interior doorway of a rustic log cabin. No visible movement, no cuts, no letterboxing, no fades across the sampled range.

## Frame-by-frame observations

**t=60.0s (l_0801)**
- Camera: player-controlled third-person, over-the-shoulder, static framing.
- Avatar: standing still on porch, facing cabin doorway (back to camera), wearing top hat, long coat, satchel/bandolier straps visible on back, holstered weapon at hip.
- NPC: Sonny not visible in frame (presumably inside, beyond the dark doorway).
- HUD: minimap bottom-left (circular, showing tan road icon, character arrow static); button-prompt panel bottom-right reads "Aim Weapon [LT icon]" (white/active), "Greet" (greyed), "Antagonize" (greyed), "Stranger" (white/active, highlighted box). No health/stamina/deadeye cores visible on screen (likely faded/hidden — no HUD core wheel present in frame). No money counter visible. No subtitles on screen at this instant.
- Environment: dim interior/porch lighting, dust motes/light shafts visible streaming through doorway, stacked wooden crates beside door, porch railing and support post at left, bottles/jars on a shelf at far left edge, wood-plank flooring, foggy exterior visible through left window/opening. Overlay: debug/performance telemetry bar at very top of frame (FPS, GPU%, temp, clocks, CPU%, LAT) — this is a benchmarking overlay, not game UI.
- No cutscene markers (no black bars, no vignette/blur).

**t=60.4s (l_0805)**
- No change from l_0801: same static pose, same HUD state (Aim Weapon/Stranger active, Greet/Antagonize greyed), same minimap, same environment framing. Player has not moved.

**t=60.9s (l_0810)**
- No change: identical composition and HUD. Player static.

**t=61.4s (l_0815)**
- No change: identical composition and HUD. Player static.

**t=61.9s (l_0820)**
- No change: identical composition and HUD. Player static.

**t=62.4s (l_0825)**
- No change: identical composition and HUD. Player static.

**t=62.9s (l_0830)**
- No change: identical composition and HUD. Player static.

**t=63.4s (l_0835)**
- No change: identical composition and HUD. Player static.

**t=63.9s (l_0840)**
- No change: identical composition and HUD. Player static.

**t=64.4s (l_0845)**
- No change: identical composition and HUD. Player static.

**t=64.9s (l_0850)**
- No change: identical composition and HUD. Player static.

## HUD state summary (constant across window)
- Minimap: present, bottom-left, circular, static content (no waypoint pings observed changing).
- Health/Stamina/Deadeye cores: not visible/rendered in any sampled frame.
- Money counter: not visible in any sampled frame.
- Honor notification: none observed.
- Button prompts: constant — "Aim Weapon" (active/white), "Greet" (greyed/inactive), "Antagonize" (greyed/inactive), "Stranger" (active/white, boxed/highlighted) — bottom-right, unchanged across all 11 sampled frames.
- Subtitles: none visible in any of the sampled frames (no on-screen text captions present at the sampled instants).
- UI toasts: none observed.
- Top-of-screen performance/debug telemetry overlay (FPS/GPU/CPU/LAT) present throughout — external capture overlay, not native game UI.

## Cutscene markers
- No letterboxing/black bars in any sampled frame.
- No fade-to-black or fade-in transitions observed in the sampled frames.
- No screen distortion/blur/vision effects observed.
- No teleport/relocation of the avatar observed across the sampled frames.

## Environment
- Setting: cabin porch/threshold, log construction, stacked crates beside the doorway, wood-plank porch flooring, support posts, railing with jars/bottles on a shelf at left. Interior beyond the doorway is dark/underlit; light shafts (god rays) stream through the doorway and porch roof gaps, consistent with daytime exterior light penetrating a dim interior — hazy/foggy atmosphere visible through the left-side opening.
- No skulls, bed, or table visible within the framing of these particular sampled frames (only crates/shelf/bottles visible in frame).
- Time of day: appears daytime/overcast given diffuse light shafts; weather reads as foggy/hazy.

## [UNCERTAIN]
- Only every 5th frame (of 50) was sampled for this batch given the visual redundancy of a static shot; if micro-movements (idle sway, breathing animation) occurred between sampled frames, they were not captured. All sampled frames show the player in the identical standing pose with no observable gait, gesture, or camera-angle change.
- Sonny (NPC) is not visible in any sampled frame within this window — presumably positioned inside the cabin beyond the dark doorway, out of camera view.
- The relationship between this window's clip-time label (02:20.00–02:24.90) and the frame-number-derived timestamps (60.0–64.9s) is inconsistent; timestamps above follow the literal formula provided in the task instructions.
