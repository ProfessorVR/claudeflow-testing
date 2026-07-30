# Event-tier micro-log — window 03:31.00–03:32.96 (clip time), frames e_1489–e_1536 (24fps)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 sec (clip-internal seconds shown below match provided window, i.e. displayed as clip mm:ss).

## Shot description (constant across entire window)

All 48 frames (e_1489 through e_1536, covering 03:31.00–03:33.96 clip time) show a single unbroken cinematic shot with NO visible change in camera position, character pose, or HUD state:

- **Letterboxing**: black bars top and bottom, consistent cinematic aspect ratio throughout the entire window (present in every frame, no change).
- **Camera**: static, non-player-controlled (cinematic). No cuts, no pans, no zoom detected across the 48 frames.
- **Avatar (Arthur Morgan)**: framed in medium close-up/bust shot, body angled ~3/4 toward camera, hunched/bent forward at the waist, head bowed and tilted down so the wide-brimmed hat brim fully obscures the eyes and most of the face (only lower jaw/beard intermittently visible). Right shoulder raised, arms/hands not visible in frame (occluded below frame edge or by body). Ammo bandolier crossed over chest visible in all frames. No visible locomotion; the pose reads as a static held/idle animation — Arthur remains bent over in the same hunched posture with no perceptible change in silhouette from frame to frame. [UNCERTAIN: whether this is a looping idle/breathing animation or a fully static held frame — no discernible motion between consecutive frames in this sample].
- **NPC (Sonny)**: not visible in frame in any of the 48 frames sampled.
- **Environment**: overcast/foggy swamp-adjacent tall-grass field, sparse thin trees and dead snags in background, muted desaturated grey-green color grade consistent with a dusk/overcast lighting state. No weather particles (rain/fog volumetrics) clearly discernible beyond ambient haze. No cabin structure visible in this framing (background is open grass/tree line).
- **HUD**: no minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts, and no subtitle text visible in ANY of the 48 frames. Only a persistent developer/debug performance overlay is visible in the top-right corner of every frame (FPS, GPU%, temp, clock speeds, voltage, wattage, RPM, VRAM MHz, CPU%, LAT ms) — this is a capture/dev overlay, not game HUD, and is constant/non-diegetic.
- **Fades/transitions**: no black frames, no fade-to-black, no fade-in, no screen distortion/blur effect, no vision-mode effect observed in any of the 48 frames.
- **Subtitles**: none rendered on screen in this window, despite the accompanying Whisper transcript indicating dialogue/vocalization around 03:29.9–03:39.8 ("No" — long, possibly groan/ambient) overlapping this window. [UNCERTAIN: no on-screen subtitle text appears in the sampled frames even though this timeframe overlaps transcript audio — either subtitles are disabled/off in this capture, or audio and this frame range are not perfectly time-aligned].
- **Microphone/UI icon**: a small microphone icon persists in the bottom-right corner of every frame (bottom-right icon cluster) — likely a capture-software element, not game UI.

## Frame-by-frame notes

- e_1489–e_1536 (all 48 frames): No visible state change. Only very minor stochastic differences consistent with foliage/wind sway in background trees and grass, and a slight cosmetic dev-overlay value fluctuation (FPS 71→69, GPU 98%→96%, CPU 24%→19-22%, clock/voltage/wattage minor drift, LAT ms 14.3→10.0). These are performance-telemetry fluctuations only, not scene events.
- No cut, no camera movement, no letterbox change, no lighting change, no avatar repositioning, no NPC appearance, no HUD element appearing/disappearing, and no fade was observed anywhere in this 48-frame window.

## Summary of transitions within this window

**None.** No hard transitions (cutscene start/end, fade, control-loss/regain, HUD change, teleport) were observed within frames e_1489–e_1536 (03:31.00–03:33.96 clip time). The entire sampled window is a single continuous static cinematic composition of Arthur hunched over in tall grass, letterboxed, with no diegetic HUD present throughout.
