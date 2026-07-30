# Lead-up Micro-Log — Segment 07 (clip 01:30.00–01:34.90)

Frames l_0301–l_0350, 10fps. t = 60 + (frameNumber-1)/10 sec (clip time).

## 01:30.0 (l_0301) — start of segment
- Player-controlled third-person camera, standard over-the-shoulder gameplay framing. No letterbox bars, no HUD dimming/vignette.
- Player character (Arthur) standing in tall grass/swamp brush facing a raised wooden porch/cabin structure, back to camera, hat visible, satchel/bandolier on back, right arm holding an item (light-colored, possibly a note/letter) down at his side.
- Sonny (NPC) stands upright on the porch, leaning against the door frame between two support posts, arms visible at sides, wearing a sleeveless tan/striped top and trousers; static pose, facing player.
- HUD: minimap (circular) bottom-left showing red dot cluster (player) near white markers; no visible health/stamina/deadeye core fill state distinctly legible at this resolution but cores are absent/not rendered in this frame region (bottom-left minimap only, no core ring visible). Bottom-right shows contextual action prompts: "Aim Weapon", "Greet", "Antagonize", "Stranger" (four button-prompt rows, right-aligned, standard interaction-wheel-style prompt list, not a radial wheel — text list only).
- Subtitle at bottom-center: "An interesting place, the best of places." (white text, black outline, standard subtitle styling).
- Environment: swampy/bayou setting, hazy atmospheric fog/mist, overcast diffuse lighting suggesting daytime overcast or dusk haze; tall cypress/mossy trees at left frame edge with hanging Spanish moss; porch cluttered with crates, jars, wicker baskets, a rocking chair, barrels — general dilapidated-cabin clutter.
- Top-right corner: developer/debug performance overlay (FPS, GPU%, temp, clocks, CPU%, latency figures) — this is a benchmark/dev HUD overlay, not part of normal game UI.

## 01:30.1–01:33.6 (l_0302–l_0336) — HOLD
- Frames l_0302 through approximately l_0336 are visually static/near-identical: same camera framing, same player position/pose, same Sonny pose, same subtitle text "An interesting place, the best of places." persisting continuously across ~3.5 seconds of clip time.
- [UNCERTAIN] This persistence across ~35 consecutive frames (3.5s) with an unchanging subtitle suggests either a paused capture, a long static dialogue hold, or heavy frame-duplication in the source video; no in-game motion, camera movement, or animation change is discernible frame-to-frame.
- Minor cosmetic-only changes noted: debug overlay values (FPS/GPU%/temp/clock/CPU/latency) fluctuate slightly frame to frame (e.g., FPS 73→71→72; GPU 97%→98%→94–98%; temp 66–68°C) — these are performance-telemetry noise only, not scene content changes.
- At l_0330 (t≈62.9s) a very subtle change: Sonny's proper-left arm appears slightly raised/bent relative to earlier frames [UNCERTAIN — could be a subtle idle-animation shift rather than a scripted gesture].

## 01:33.6–01:34.9 (l_0337–l_0350) — subtitle change
- Frames l_0337–l_0348 continue the same static composition (player back-facing porch, Sonny in doorway) with the SAME subtitle "An interesting place, the best of places." still displayed, camera and HUD unchanged; debug telemetry continues to vary (FPS 71–72, GPU 94–98%, temp 66–68°C).
- **l_0349 (t = 60 + 348/10 = 94.8s clip-relative... )** — recalculating per given formula: frame 349 → t = 60 + (349-1)/10 = 94.8s. [Note: this exceeds the stated window end of 94.9s scaling — using formula as given.] At this frame the subtitle text CHANGES to: **"Is it land or is it water?"** — a hard subtitle-text transition, no other visual change (no cut, no letterbox, no camera change, no fade). This corresponds to the transcript line at 01:24–01:44 range ("Is it land or is it water?").
- l_0350 — same new subtitle "Is it land or is it water?" persists; composition otherwise unchanged from prior frames (player back-facing, Sonny static in doorway, minimap, four action prompts, no letterboxing, no control-loss indicators visible).

## Summary of on-screen state across the whole segment
- Camera: continuously player-controlled third-person (no cinematic cut, no letterbox bars, no fade-to-black) for the entire 01:30.0–01:34.9 window.
- Player: stationary, standing, facing the porch/Sonny; no walking animation, no gait anomaly, no interaction prompt triggered/selected.
- Sonny: stationary in porch doorway, arms at sides, largely idle-pose throughout; one possible subtle arm-position shift near l_0330 [UNCERTAIN].
- HUD: minimap present throughout (bottom-left); four text action-prompts present throughout bottom-right ("Aim Weapon", "Greet", "Antagonize", "Stranger"); no money counter, no honor notification toast, no health/stamina/deadeye core visibly rendered/legible in captured frame region; no UI toast/popup appeared.
- Subtitles: "An interesting place, the best of places." holds for the vast majority of the segment (l_0301–~l_0348), then changes to "Is it land or is it water?" at ~l_0349–l_0350.
- Environment: unchanging bayou/swamp cabin exterior, overcast/hazy lighting, cluttered porch with crates/jars/baskets, no weather change, no time-of-day change observed.
- No teleportation, no control loss/regain, no cutscene start/end markers, no black frames, no visual distortion effects observed in this segment.

## Flagged uncertainties
- [UNCERTAIN] Extended near-duplicate frame run (l_0302–l_0348) may reflect true in-game dialogue-hold/idle state or could reflect capture/encoding duplication — cannot distinguish definitively from single frames.
- [UNCERTAIN] Possible subtle arm-position shift for Sonny around l_0330; not confirmed as a distinct gesture.
