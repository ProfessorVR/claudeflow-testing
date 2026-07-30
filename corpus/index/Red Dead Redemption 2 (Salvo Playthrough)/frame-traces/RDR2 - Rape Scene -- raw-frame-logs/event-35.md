# Event-tier Micro-log — Clip window 03:37.00–03:38.96 (frames e_1633–e_1680)

Timestamp formula: t = 149 + (frameNumber-1)/24 s (this is CLIP time per the source video's own numbering; frames span t≈68.0s–70.0s by that formula — noted discrepancy, see [UNCERTAIN] below). All 48 frames sampled at 1/24s spacing are visually near-identical.

## Overview
Across the entire 48-frame window (2.0s of 24fps footage) the image is **static and unchanging in composition**: a third-person cinematic camera holds a wide/medium shot on the player-character (Arthur Morgan) standing in tall grass in an open, foggy marsh/prairie clearing at dusk/overcast light. No cabin, no Sonny, no interior, no HUD elements, and no letterbox bars are visible in any frame of this window.

## Frame-by-frame observations

- **e_1633 (t=149.00s)**: Wide shot, player-character seen from behind/three-quarter angle, standing in grass, wearing dark long coat, gunbelt/bandolier, satchel pouch at hip, wide-brim hat. A riderless horse stands ~15m to the left near a distant small structure (shed/cabin silhouette, out of focus) partially obscured by fog. A bare dead tree trunk/branch stands directly behind the player's head. Overcast grey sky, ground-fog haze over background tree line. No HUD (no minimap, no health/stamina/deadeye cores, no button prompts, no subtitles visible). Top-right corner shows a performance-metrics overlay (FPS/GPU/CPU/latency telemetry — non-diegetic capture overlay, not game HUD).
- **e_1634–e_1645 (t=149.04s–149.52s)**: No discernible change in framing, character pose, or environment. Player figure remains static (idle stance, arms at sides), camera does not pan or cut. Horse in background remains stationary. This suggests either a held/paused cinematic beat or a very slow, sub-pixel camera drift not resolvable at this frame spacing.
- **e_1646–e_1650 (t=149.57s–149.74s)**: Same composition continues. FPS counter ticks from 70 to 75 (telemetry only, not scene-relevant).
- **e_1651–e_1655 (t=149.78s–149.96s)**: Same held shot. In e_1651 a small dark shape (possibly a bird in flight) is faintly visible in the upper-frame sky near the dead tree top; too indistinct to confirm — [UNCERTAIN].
- **e_1656–e_1660 (t=150.00s–150.17s)**: Composition unchanged. A dark bird-like silhouette appears consistently near the player's hat/upper-frame, slightly left of the dead-tree branch, across these frames — possibly a bird perched on/flying near the branch, or a foreground insect/particle effect. [UNCERTAIN — cannot confirm bird vs. environmental particle/lens artifact at this resolution.]
- **e_1661–e_1670 (t=150.22s–150.65s)**: Same static wide shot persists. No camera cut, no fade, no letterbox. Player figure and horse remain in identical screen positions. FPS telemetry shifts from 75 to 73; GPU temp reading in overlay ticks from 67°C to 66°C (non-diegetic).
- **e_1671–e_1680 (t=150.70s–151.13s)**: Composition remains unchanged through the end of the sampled window. No transition, cut, fade, or HUD element appears at any point.

## HUD / UI state (entire window)
- No minimap present in any frame.
- No health/stamina/deadeye core icons visible.
- No money counter, no honor notification, no button prompts.
- No subtitle text rendered on screen in any frame (despite transcript lines existing in this general time range; likely subtitles are either disabled or occur outside this specific sub-window, or overlap earlier/later tiers).
- No cutscene letterbox bars (black bars top/bottom) visible in this window — full 960x540 (16:9) image area is used edge-to-edge aside from the standard thin black strip at the very bottom (appears to be a fixed capture-window artifact, present identically in all frames, not a letterbox cue).
- Persistent non-diegetic performance-overlay (FPS/GPU%/temp/clock/power/RPM/CPU%/latency/frametime) in top-right corner throughout — this is a capture/monitoring overlay, not part of the game's own UI.

## Environment
- Setting: open marshy prairie/wetland clearing, tall grass, scattered dead/bare trees, denser tree line in far background wreathed in fog. Overcast, flat grey-white sky consistent with dusk or heavy overcast daylight — no directional shadows visible.
- A small wooden structure (shed or small cabin) is visible at distance on the left-center background, partially obscured by haze and a shrub in the near-foreground left edge.
- A single riderless horse stands grazing/idle near that structure throughout the entire window, no movement observed.
- No skulls, no bed, no table, no cabin interior visible in this specific window — none of the frames show an interior space.

## Player/NPC
- Player-character: idle standing pose, viewed from behind at a slight angle, facing generally toward the horse/cabin in the background. No walk-cycle, no gesture, no interaction animation observed across the 48 frames. No gait anomaly observable since no locomotion occurs.
- No NPC (Sonny) is visible in frame at any point in this window.

## Transitions
- **None observed.** No cuts, fades, black frames, blur/vision-distortion effects, control-loss/regain markers, or teleport/relocation events occur within this specific 03:37.00–03:38.96 window. The shot is a single continuous static (or near-static) composition for the full ~2-second sample.

## Flags
- [UNCERTAIN] Possible bird silhouette near player's hat/dead-tree branch in e_1651/e_1656–1660 — could not be confirmed as diegetic wildlife vs. lens/particle artifact at 960x540 downscale.
- [UNCERTAIN] Frame-number-to-timestamp formula given (t = 149 + (n-1)/24) yields t≈149.0–151.1s, not the stated clip window of 03:37.00–03:38.96 (217.0–218.96s); this note reports frame-derived timestamps as computed from the given formula, flagging the mismatch with the stated window label for reconciliation upstream.
- [UNCERTAIN] Whether this static shot represents a paused/held cinematic beat mid-scene (e.g., a lingering reaction shot) or a loading/transition gap is not determinable from visuals alone; no HUD or fade cues present to confirm cutscene state one way or the other.
