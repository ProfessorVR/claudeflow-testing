# Micro-log: leadup-08 (frames l_0351–l_0400, t=01:35.00–01:39.90)

## Overview
This entire window is a single continuous, static two-shot: the player-character (Arthur, back to camera) standing in tall grass/reeds at the base of a wooden porch/steps leading up to a ramshackle cabin, facing an NPC woman (light tan/cream sleeveless top, patterned trousers) who stands leaning against the cabin's open doorway on the porch. No camera cuts, no letterboxing, no fades, and no control-state changes are visible across any of the sampled frames in this range. This is consistent with an idle/held dialogue-scene camera (game engine cinematic camera during a Stranger-mission conversation, not obviously a cutscene given the persistent HUD).

## Frame-by-frame observations

**t=01:35.00 (l_0351) through t=01:39.00 (l_0390)** — no visible change in camera framing, character poses, or environment. Held two-shot:
- Player character: standing still, back to camera, wearing dark hat, dark long coat, gun belt/holster visible at hip, bandolier/strap across back. No movement, no gait animation visible (static idle stance).
- NPC (presumed "Sonny's" female captive/associate per audio, referred to in transcript as woman on porch): standing in cabin doorway, leaning against door frame, arms loosely at sides, light-colored sleeveless top, dark patterned pants, weight on one leg — idle lean pose, no discernible gesture change across frames.
- Camera: fixed medium-wide angle, slightly low, from behind-right of player looking toward porch/cabin entrance. No pan, no zoom, no cut.
- HUD: minimap present (bottom-left, circular), showing player position (white arrow) near a small red/white marker cluster; performance overlay present top-of-screen throughout (FPS/GPU/CPU/latency telemetry — non-diegetic overlay, likely user's monitoring tool, present in all frames, e.g. "FPS 71 37(1%) GPU 98% 68C ... CPU 22% LAT 10.7ms 48.1ms"). No stamina/health/deadeye cores visible in this crop (likely off-screen or not rendered in this framing). No money counter visible. No honor notification visible. Context-action prompt panel present bottom-right throughout: "Aim Weapon", "Greet", "Antagonize", "Stranger" (last one highlighted/boxed, indicating available interaction prompt). No letterboxing bars present at any point — HUD and prompts fully visible, indicating this is likely player-controlled or lightly-scripted dialogue rather than full cinematic cutscene.
- Environment: dilapidated wooden cabin on stilts/porch, surrounded by foggy swamp/bayou vegetation (Spanish-moss-draped trees, tall grass/reeds in foreground). Overcast, hazy, diffuse lighting consistent with daytime fog. Props on porch: stacked wooden crates, ceramic jugs/jars, a wooden chair, a hanging lantern (unlit) on the porch support beam at left, and additional lidded boxes to the right of the doorway.
- Subtitles (exact text, changing over the window):
  - l_0351–l_0380 (t≈01:35.00–01:38.00): **"Is it land or is it water?"**
  - l_0385 (t≈01:38.50): **"Can't make up its mind..."**
  - l_0390 (t≈01:39.00): **"Can't make up its mind..."** (still displayed)
  - l_0395 (t≈01:39.50): **"no, siree."**
  - l_0400 (t≈01:39.90): **"no, siree."** (still displayed)

## Transitions / anomalies
- No cutscene start/end markers observed (no letterbox appearance/disappearance, no fade to/from black, no screen distortion or blur effects).
- No control-loss/control-regain indicators observed (HUD prompts remain persistently visible and unchanged in position/format throughout).
- No teleport or avatar relocation.
- No HUD state changes other than subtitle text updates (see above); minimap, action-prompt panel, and telemetry overlay remain constant in composition throughout.
- [UNCERTAIN] Whether this is a fully player-controlled standing idle (player has walked up and stopped) versus a soft-locked dialogue camera cannot be determined from static frames alone; the unchanging camera angle across ~5 seconds and fixed character poses is consistent with either.
- [UNCERTAIN] Identity/role of the female NPC on the porch (matches description of a woman associated with the "Sonny" stranger encounter per audio transcript context, but not confirmed by any on-screen label in this frame range).

## Timestamps of hard transitions
None observed in this window (t=01:35.00–01:39.90). The only observed changes are subtitle-text updates:
- t≈01:38.50 — subtitle changes from "Is it land or is it water?" to "Can't make up its mind..."
- t≈01:39.50 — subtitle changes from "Can't make up its mind..." to "no, siree."
