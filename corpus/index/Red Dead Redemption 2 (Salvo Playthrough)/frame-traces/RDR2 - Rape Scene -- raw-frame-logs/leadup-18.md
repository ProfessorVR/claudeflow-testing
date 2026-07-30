# Lead-up Micro-Log — Window 02:25.00–02:28.90 (frames l_0851–l_0890)

Timestamp formula: t = 60 + (frameNumber-1)/10 seconds.
- l_0851 = 60 + 850/10 = 145.0s = 02:25.0
- l_0890 = 60 + 889/10 = 148.9s = 02:28.9

## Overview
This entire window (frames 851–890, 10fps, ~4 seconds of real time) is a single unbroken gameplay shot. There is no cut, no fade, no letterboxing, and no HUD state change across all 40 frames. The player-character (Arthur Morgan, viewed from behind in third-person) stands motionless on a covered wooden porch/breezeway, facing a dark open doorway leading into a dim cabin interior. The camera itself is essentially static, with only extremely minor sub-pixel drift consistent with idle-stance camera sway (no player input registered as movement).

## Frame-by-frame observations

**02:25.0 (l_0851) – 02:25.6 (l_0857):** Player stands still, back to camera, facing the black doorway ahead. Character wears a wide-brim hat, long buttoned coat/duster, bandana/scarf collar, ammo belt/bandolier across the back, holstered revolver visible at right hip. Camera is a fixed third-person over-the-shoulder angle, slightly left-of-center framing on the doorway. No camera rotation, no avatar movement — character is idle (subtle idle-breathing sway only, not full gait). To the left: wooden porch post, workbench with a bottle/jar and pale rag/cloth. To the right: another support post, and a small covered wooden object at frame edge (top of a create/box). Doorway: dark, unlit, interior obscured. A shaft of hazy backlight comes through the doorway opening from within, illuminating dust motes in the air. Overall lighting is dim, hazy/foggy atmosphere (heavy fog/God-ray shafts through porch roof slats above player, suggesting late-day or overcast light).
- HUD: minimap (circular) bottom-left, showing player position (white marker) roughly centered, small red dots/markers nearby (NPC or points of interest); no numeric health/stamina/deadeye "cores" visible in this crop (would be around minimap but not visible/rendered in these frames — presumed cores are off-screen or not present in visible capture region; NONE of the standard HP/Stamina/Deadeye ring cores appear in frame at all — screen only shows minimap circle). Bottom-right: context action prompt list — "Aim Weapon [rb icon]", "Greet [grey]", "Antagonize [grey]", "Stranger [white/bold, filled box icon]" — all present and static across these frames, with "Stranger" appearing as the active/highlighted prompt (white box icon, bold text) and Greet/Antagonize appearing greyed/inactive. Top-right: a debug/performance overlay reading "FPS 75/76/77 (varies frame to frame) 40 (1%) | GPU 93-98% ... °C | ... MHz | CPU 20-24% | LAT ~10-13ms ~45-47ms" — this is a developer/performance HUD overlay (likely RTSS/afterburner or in-engine benchmark overlay), not a game-native HUD element. No subtitles are visible on screen during this entire span. No money counter, no honor notification, no UI toast visible.

**02:25.7 (l_0858) – 02:26.5 (l_0865):** No change in composition. Player remains stationary in identical pose; camera identical framing. Minor GPU/FPS telemetry fluctuation only (values tick 96–98% GPU, FPS 75–77 — not gameplay-relevant). Doorway remains dark and unchanged. Prompt panel (Aim Weapon/Greet/Antagonize/Stranger) persists unchanged, all still visible.

**02:26.6 (l_0866) – 02:27.7 (l_0878):** Identical static shot continues. No avatar motion, no camera cut, no lighting change. HUD identical. This entire ~1.2s block is functionally a freeze/held idle shot.

**02:27.8 (l_0879):** First subtle HUD change observed: the bottom-right prompt panel context icons ("Greet", "Antagonize") appear to fade slightly greyer/more transparent relative to earlier frames (icons look more washed out) — [UNCERTAIN: could be a rendering/JPEG-compression artifact rather than an actual state change].

**02:28.0 (l_0880) – 02:28.1 (l_0881):** Minimap orientation changes — the pale wedge-shaped field-of-view indicator on the minimap rotates from pointing roughly north/up to pointing toward upper-left (northwest), suggesting a slight camera/player yaw or the compass needle updating — but the main viewport frame content (player back, doorway) shows no corresponding visible rotation of the camera framing [UNCERTAIN — may be a minimap-only heading indicator adjustment without a matching visible camera pan, or a very subtle pan not perceptible at this crop]. Prompt panel labels ("Aim Weapon," "Greet," "Antagonize," "Stranger") appear further greyed/faded compared to frames 851–878, consistent with a UI fade-out of the interaction prompt.

**02:28.2 (l_0882) – 02:28.6 (l_0886):** Prompt panel remains in this faded/greyed state (all four prompts — Aim Weapon, Greet, Antagonize, Stranger — now appear dimmed/translucent rather than bold-white as in the opening frames). Player pose and camera framing remain static. Doorway still dark, unchanged. Minimap FOV wedge remains in the northwest-tilted orientation established at l_0880.

**02:28.7 (l_0887) – 02:28.9 (l_0890):** No further visible change. Static idle shot persists to end of window. Faded prompt panel continues. GPU/FPS telemetry overlay continues fluctuating (94–97% GPU, FPS 75–76) — not narratively relevant.

## Audio cross-reference (from provided transcript, clip time)
- 02:28.7 "Now come here" (Sonny's dialogue) falls at the very end of this window (matches l_0890/l_0888 range) — no corresponding on-screen subtitle text was visible in any read frame; NPC (Sonny) is not visible in any frame of this window (player is alone in shot, facing the doorway, Sonny is presumably off-screen inside the cabin, matching the disembodied dialogue).

## Summary of transitions/notable events
- No cutscene start/end, fade, letterbox, black frame, or vision-distortion effects occurred anywhere in this window.
- No control loss/regain indicator observed (no visible loss-of-HUD-control marker); the standard gameplay context-prompt HUD is present throughout, suggesting the player retains standard free-roam control during this entire span (idle, not moving).
- The only observed HUD changes are: (1) the interaction-prompt panel (Aim Weapon/Greet/Antagonize/Stranger) transitioning from a bold/opaque state to a faded/greyed/dimmed state beginning around 02:27.8–02:28.0, and (2) the minimap field-of-view wedge indicator changing orientation around 02:28.0–02:28.1.
- No money counter, honor notification, health/stamina/deadeye core display, or UI toast was visible in any frame.
- No subtitle text was rendered on screen during this window despite audible NPC dialogue in the transcript ("Now come here" at 02:28.7).
