# Micro-log: leadup tier, frames l_0651–l_0700 (clip t = 02:05.00–02:09.90)

Frame timestamp formula: t = 60 + (frameNumber-1)/10 sec (clip time).

## Overview
Free-roam gameplay throughout this window (player-controlled third-person camera, no letterboxing, no cuts, no fades, no black frames, no cinematic markers). Player-avatar (Arthur Morgan) stands in a static idle pose facing a fogged/misty wooden cabin porch, back to camera, sling/satchel visible on back. No movement, no gait change, no teleport across the entire window — this is a held idle stance in front of the cabin exterior. Sonny (NPC) is not visible on-screen in any of these frames; only Arthur's back is seen.

## Frame-by-frame

- **t=61.00 (l_0651)**: Player idle, standing facing cabin porch/steps, weapon holstered. HUD: minimap bottom-left (compass wheel style, red icon center), FPS/GPU/CPU debug overlay top-right (FPS 71, GPU 96%, 68°C), context-prompt panel bottom-right showing four stacked options: "Aim Weapon" (icon), "Greet", "Antagonize", "Stranger" (highlighted/selectable, white box). No subtitle text. Heavy volumetric light shafts crossing frame; dense fog/mist over cabin and tree line. No health/stamina/deadeye cores visible in these frames (HUD cores not rendered in this crop/state). No money counter visible. No honor notification.
- **t=61.10–65.30 (l_0652–l_0690, frames 652–690)**: No change in player position or pose — held idle stance continuous. Context-prompt panel (Aim Weapon / Greet / Antagonize / Stranger) persists unchanged through frame ~665. Debug overlay values fluctuate slightly (FPS 66–72, GPU 93–98%, CPU 21–26%, latency ~10.7–13.7ms) — normal telemetry noise, not gameplay-relevant. Fog/light-shaft environment static; no weather change observed. No camera movement (fixed player-controlled cam, no drift/pan detected across sampled frames).
- **t=~66.9 (between l_0669/670, first observed at l_0670)**: Context-prompt panel (Aim Weapon/Greet/Antagonize/Stranger) has DISAPPEARED from bottom-right. A subtitle bar appears bottom-center: **"What you stood there for?"** (white text, dark semi-transparent background bar). This aligns with the transcript line "02:06.3 What you stood there for" — subtitle on-screen matches transcript timing within this window.
- **t=67.4–69.9 (l_0675–l_0700)**: Subtitle "What you stood there for?" remains on screen continuously through the last sampled frame (l_0700, t=69.9). Player avatar remains in identical idle pose (no gait/animation change visible). No minimap change, no HUD core changes, no money/honor toasts. Debug overlay continues normal fluctuation (FPS 66–72, GPU 93–98%, CPU 21–26%).

## HUD state summary across window
- Minimap: present throughout, bottom-left, compass-wheel style with red center marker; no visible change in zoom/rotation across sampled frames.
- Health/Stamina/Deadeye cores: not visible/rendered in any sampled frame (may be faded per RDR2's auto-hide-when-full behavior) [UNCERTAIN — cores not visible in this HUD region at this crop].
- Money counter: not visible in frame (not in visible HUD region for this crop).
- Honor notification: none observed.
- Context-prompt panel: visible frames 651–~665 ("Aim Weapon", "Greet", "Antagonize", "Stranger" — "Stranger" appears highlighted/selectable with a filled white box), then disappears by frame 670 coincident with subtitle appearance.
- Subtitle: none until frame ~670, then "What you stood there for?" appears and persists through end of window (frame 700).
- Debug/telemetry overlay (FPS/GPU/CPU/latency) present top-right throughout — this is a non-diegetic capture overlay, not game UI.

## Environment
- Setting: exterior, misty/foggy wooded clearing in front of a weathered wood-plank cabin with a covered porch; porch holds various props (jars/bottles, potted plants, barrels) [UNCERTAIN — object identities], hanging lantern on porch post, steps leading up to porch. Heavy diagonal light shafts (god rays) through fog, suggesting low sun angle / early morning or dusk. No rain observed. No skulls or bed visible in this exterior framing.
- No fade-to-black, no letterboxing, no screen distortion/blur effects observed in any sampled frame.

## Transitions / control state
- No control-loss/control-regain observed — player retains free-roam control throughout (idle standing, no cutscene camera takeover).
- No cutscene start/end markers (no letterbox bars, no fade) in this window.
- No avatar teleport/relocation observed.

[UNCERTAIN]: Sonny's on-screen position/animation cannot be assessed in this window — he is off-camera (behind or out of frame relative to Arthur's fixed rear-facing view) in all sampled frames.
