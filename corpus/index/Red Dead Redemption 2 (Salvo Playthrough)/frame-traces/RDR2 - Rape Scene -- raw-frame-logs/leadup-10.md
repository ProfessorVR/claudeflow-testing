# Lead-up micro-log — 01:45.00–01:49.90 (clip time), frames l_0451–l_0500 (10fps)

Frame→time formula: t = 60 + (frameNumber-1)/10 sec (clip-internal frame numbering; window shown here is the segment sampled, timestamps below use clip time reference matching provided transcript window).

## Overview
All 50 sampled frames (every 5th frame read: 451, 455, 460, 465, 470, 475, 480, 485, 490, 495, 500) show an essentially static tableau: player-controlled third-person camera, Arthur Morgan standing facing the cabin porch, satchel/holster visible on his back, hat on. NPC "Sonny" — actually the figure visible is a woman (thin, sleeveless top, light-colored trousers) standing in the cabin doorway/porch, arms loosely at sides, facing outward toward the player. No cuts, no letterboxing, no fades, no black frames observed across this entire sampled range.

## Frame-by-frame observations

**t=45.045.0s [frame 451] (01:45.0 clip-relative)**
- Player: standing still, back to camera, facing cabin porch/steps. Satchel and rifle/carbine visible on back.
- NPC: standing in doorway between wooden crates, arms at sides, static pose.
- HUD: minimap bottom-left (compass, two red blips near center), FPS/GPU/CPU debug overlay top (FPS 81, GPU 96%, 67°C, etc. — appears to be a dev/perf overlay, not game HUD), no health/stamina/deadeye cores visible on screen, no honor notification, no money counter visible.
- Bottom-right prompt list present: "Aim Weapon", "Greet", "Antagonize", "Stranger" — all shown as available context prompts (controller-button icons blank/unassigned in this frame).
- Environment: foggy/hazy swamp lighting, dusk or overcast diffuse light, cabin exterior with crates, glass bottles, ceramic jugs on porch railing, hanging lantern on porch overhang, tall grass foreground.

**t≈45.4s [frame 455]**
- No visible change in player or NPC pose. FPS counter reads 81, GPU 98%. Same static composition.

**t≈45.9s [frame 460]**
- No visible change. FPS 82, GPU 98%, temp 66°C. Player and NPC unmoved.

**t≈46.4s [frame 465]**
- No visible change in poses. FPS 82, GPU 94%. Static frame, same camera angle.

**t≈46.9s [frame 470]**
- No visible change. FPS 76, GPU 95%, CPU 23%. Player/NPC still static.

**t≈47.4s [frame 475]**
- No visible change. FPS 76, GPU 95%. Composition identical to previous frames.

**t≈47.9s [frame 480]**
- Bottom-right prompt list now shows button-icon glyphs next to "Greet" (icon resembling a small square/button, possibly "Y"/triangle) and "Antagonize" (icon "F"-like) — these were blank/unlabeled in earlier frames. This is the first HUD change observed: button prompt icons populate next to Greet/Antagonize options. [UNCERTAIN: exact glyph/letter due to downscaled resolution]
- FPS 75, GPU 93%. Player/NPC poses unchanged.

**t≈48.4s [frame 485]**
- Same HUD state as frame 480 (Greet/Antagonize icons present). FPS 75, GPU 96%. No pose change.

**t≈48.9s [frame 490]**
- Same HUD state continues. FPS 81, GPU 95%. No pose change.

**t≈49.4s [frame 495]**
- Same HUD state continues. FPS 81, GPU 97%. No pose change.

**t≈49.9s [frame 500]**
- Same HUD state continues; NPC pose looks essentially identical (idle stand). FPS 81, GPU 96%. No pose change. End of sampled window.

## HUD state summary (entire window)
- Minimap: present throughout, bottom-left, no change in blips.
- Health/stamina/deadeye cores: not visible in any sampled frame (may be off-screen/hidden in this UI state, or cropped by the debug overlay region — [UNCERTAIN]).
- Money counter: not visible in any sampled frame.
- Honor notification: none observed.
- Subtitles: none visible as on-screen text in any sampled frame (audio transcript exists separately; no burned-in subtitle overlay appeared in these frames).
- UI toasts: none.
- Context-action prompt box (bottom-right): present in all frames — "Aim Weapon", "Greet", "Antagonize", "Stranger" labels; button icons for Greet/Antagonize become visible starting at approximately frame 480 (~47.9s into window) where they were blank/unpopulated in frames 451–475.
- Top-of-screen debug/performance overlay (FPS/GPU/CPU/temp/power/clock/latency): present continuously in all frames, values fluctuate normally (not a game UI element, appears to be a hardware monitoring overlay).

## Cutscene / transition markers
- No letterboxing observed at any point in the sampled window.
- No fades to/from black observed.
- No screen distortion/blur/vision effects observed.
- No camera cuts observed — camera remains a fixed player-controlled third-person view throughout (player is stationary; no visible walk/gait cycle in these frames).
- No control-loss/control-regain indicators (e.g., prompt UI disappearing, which typically signals cutscene) observed within this window — the interactive context-prompt box remains visible throughout, consistent with the game still being in free/player-control state at this point.

## Environment
- Setting: swamp/bayou cabin exterior (consistent with the Lakay/Sonny's-cabin location), heavy atmospheric fog/haze, diffuse overcast lighting suggesting dusk or heavily shaded daytime.
- Structure: elevated wooden porch with shed roof, support posts, plank flooring, external staircase (4-5 steps) leading up from ground level.
- Props visible: stacked wooden crates flanking the doorway, glass bottles and ceramic jugs on a railing/shelf to the right, a hanging metal lantern from the porch overhang (left side), a wagon wheel leaning against structure at lower-left foreground, tall grass in immediate foreground.
- No skulls collection visible in this exterior framing within the sampled frames.

## Flags
- [UNCERTAIN] Exact button-icon glyphs added to Greet/Antagonize prompts around frame 480 — resolution too low at 960x540 downscale to confirm exact controller button (likely triangle/square or Y/X depending on platform, cannot verify glyph shape).
- [UNCERTAIN] Whether health/stamina/deadeye HUD cores are absent from the frame or simply not rendered in this particular camera/UI state.
- No audio-synchronized visual events (e.g., mouth movement matching "You want to come in, see my collection of skulls" at 01:53.5) were observable in this window since the transcript line falls just after the sampled range end (01:49.9); NPC face not close enough at this camera distance to assess lip-sync in any case.
