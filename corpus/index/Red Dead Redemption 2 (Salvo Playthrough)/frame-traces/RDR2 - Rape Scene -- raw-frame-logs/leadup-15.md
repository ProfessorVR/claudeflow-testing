# Micro-log: Lead-up tier, frames l_0701–l_0750 (clip time 02:10.00–02:14.90)

Frame timestamp formula: t = 60 + (frameNumber-1)/10 sec (clip-relative numbering per assignment; frame l_0701 = window start ≈ 02:10.0).

## Overview of window
This window spans 10 sampled frames read in detail (701, 702, 703, 704, 705, 706, 707, 708, 709, 710) plus spot-checks at 715, 720, 725, 730, 735, 740, 745, 750. All 18 frames examined show **the identical composition and gameplay state**: no visible change in camera angle, player position, NPC presence, or HUD across the entire ~4.9-second window.

## Frame-by-frame observations

- **l_0701 (~02:10.0) through l_0750 (~02:14.9)**: Player-controlled, third-person camera, NOT a cutscene (no letterboxing, no black bars, no fade). Camera is static/idle, positioned behind Arthur Morgan (player avatar), medium-close over-the-shoulder framing.
  - **Avatar**: Arthur stands facing a wooden cabin porch/exterior, back to camera, wearing long dark coat, holster/ammo belt visible across back, brimmed hat. No walking animation visible in the sampled frames — avatar appears essentially stationary (idle-stand pose) across the full span; very minor body sway consistent with idle-breathing animation, not locomotion. No gait anomaly observed.
  - **Camera**: Fixed player-controlled follow-cam, no cuts, no angle changes across all sampled frames.
  - **NPC (Sonny)**: Not visible in frame in any of the sampled images. No NPC silhouette present on porch.
  - **HUD**: Minimap present bottom-left (circular, compass-style, red terrain overlay, player arrow centered) in all frames — constant. Bottom-right context-action prompt stack ("Aim Weapon", "Greet", "Antagonize", "Stranger") present continuously, unchanged across all frames — indicates player is in a free-roam interaction-available state, not a scripted/cutscene state. Debug/perf overlay top-right (FPS/GPU/CPU/latency stats) present throughout — this is a dev/capture overlay, not game UI. No health/stamina/deadeye cores visible on screen (likely off-screen or not rendered in this HUD layout). No money counter, no honor notification, no toast/subtitle text visible in any frame in this range. No letterbox bars.
  - **Environment**: Foggy/misty swamp-cabin exterior, dim overcast lighting with visible light shafts (god rays) cutting through mist from upper right. Wooden raised porch structure with railing, steps leading up, various pots/jars/clutter on porch shelving, a hanging lantern/jar on a cord at left. Dense foggy tree line background. Appears to be daytime but heavily obscured by fog/mist (consistent with Lakay/Lannahechee swamp setting). No visible skulls, bed, or interior props (scene is still exterior).
  - Minor variation noted frame-to-frame: at l_0725/l_0730/l_0735/l_0740 the avatar's arm position/satchel visibility shifts slightly (item bag becomes more visible swinging at hip), consistent with idle micro-animation or slight repositioning, not a directional walk cycle. [UNCERTAIN: whether this represents player nudging the analog stick slightly or pure idle animation]

## Hard transitions / notable events in this window
**None observed.** No cutscene start/end, no fade-in/out, no control-loss/regain markers, no letterbox appearance, no HUD state change (prompts and minimap remain constant throughout), no subtitle text appeared on screen, no UI toast/notification fired, no teleport/relocation of avatar detected in the sampled frames.

[UNCERTAIN: Because only every 5th frame was sampled from 710–750, a brief sub-second event between sampled frames could have been missed; however the consistent state at every checked frame strongly suggests this entire window is a static idle/pre-interaction moment.]
