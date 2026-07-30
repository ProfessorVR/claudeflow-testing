# Micro-log: leadup-09 (clip time 01:40.00–01:44.90; frames l_0401–l_0450, 10fps)

Timestamp formula: t = 60 + (frameNumber-1)/10 s (server/absolute clip clock referenced in the transcript). Frame range 401–450 corresponds to t = 100.0s–104.9s.

## Overview
This entire 50-frame window (401–450) is a single continuous, player-controlled, static-camera shot with no cuts, no fades, no letterboxing, and no HUD changes. It captures the tail end of Arthur Morgan's dialogue exchange with Sonny (NPC) on the porch of the swamp cabin near Lakay, immediately preceding the player's approach/entry into the cabin (which occurs after this window closes).

## Frame-by-frame

**t=100.0s (l_0401) – t=100.9s (l_0410):**
- Camera: player-controlled third-person over-the-shoulder, fixed framing, no movement of camera or avatar detected across these 10 frames (avatar is stationary, standing at the base of the cabin's wooden porch steps, facing the porch).
- Player/avatar: Arthur stands motionless in idle stance, facing Sonny; right hand near holstered revolver, left arm relaxed. No gait/animation change.
- NPC (Sonny): stands upright on the porch, leaning against the door frame, arms loosely crossed/at sides; static idle pose, no gesture change across these frames.
- HUD: minimap present bottom-left (circular, compass-style, red blip cluster near center); dialogue-wheel/context prompts present bottom-right reading "Aim Weapon," "Greet," "Antagonize," "Stranger" (persistent throughout, unchanged). No health/stamina/deadeye cores visible on screen (not in current framing — likely off-screen or not rendered in this UI state). No money counter, no honor notification, no toast visible.
- Subtitle: a subtitle box is visible at frame 401 reading "no, siree." (lower-case as rendered), persisting through l_0410. This corresponds to transcript line "No, sirree" (~01:24-01:44 range, tail end).
- Environment: overcast/foggy swamp daylight, heavy diffused white-gray light through tree canopy; cabin is elevated wood-plank structure with covered porch, support posts, crates/barrels stacked on porch (wooden crates, glass jugs/bottles, ceramic jugs, a wagon wheel leaning against exterior at left, a birdcage-like object hanging from porch beam at left). Wooden steps lead up to porch. Grass/reeds in foreground. No visible weather effects (rain/wind) beyond ambient haze.
- Debug/perf overlay: top-right corner shows FPS/GPU/CPU telemetry text (development overlay, not a game HUD element) — present in all frames, values fluctuate slightly (FPS 70→69→73→81 etc.) — not related to game state, just performance monitor overlay.

**t=101.0s (l_0411) – t=101.9s (l_0420):**
- No change in camera, avatar position, or Sonny's pose. Subtitle "no, siree." persists through roughly l_0411–l_0419.
- l_0420: subtitle box appears empty/transitioning (no visible text in frame), suggesting the line has ended and a new one is about to begin.

**t=102.0s (l_0421):**
- Subtitle box empty/no text visible.

**t=102.1s (l_0422):**
- New subtitle appears: "I can't make up my mind about things, neither." — matches transcript line "No, sirree. I can't make up my mind about things neither" (~01:24–01:44 window, final clause). This subtitle persists unchanged from l_0422 through the remainder of the window (l_0450, t=104.9s).
- No other visual change (avatar, NPC, camera, HUD all static).

**t=102.2s (l_0423) – t=104.9s (l_0450):**
- Fully static composition: avatar idle at foot of porch steps, Sonny idle on porch, same subtitle "I can't make up my mind about things, neither." held on screen continuously.
- No camera cuts, no letterboxing, no fade in/out, no blur/vision distortion, no black frames.
- No HUD state changes: minimap unchanged, dialogue-wheel prompts (Aim Weapon / Greet / Antagonize / Stranger) unchanged, no money/honor toasts, no core-fill UI visible.
- Minor cosmetic variance only in the top-right performance-overlay telemetry (FPS/GPU temp/wattage/clock/CPU/latency numbers ticking, e.g., FPS values 70, 69, 73, 81 across the span; GPU 93-98%; these are systems-monitoring overlay artifacts, not in-game HUD elements) [UNCERTAIN: whether this overlay is part of the recorded game feed or an external capture overlay — treating as non-diegetic].
- No control loss/regain, no teleport, no relocation of avatar detected within this window.

## Transitions summary
No hard cutscene transitions (cuts, fades, letterboxing, control-state changes) occur within this window. The only "transitions" observed are text-level (subtitle-line changes) and are listed below.

## Return: Summary

This 4.9-second window (clip t=100.0–104.9s / frames l_0401–l_0450) shows a completely static, player-controlled over-the-shoulder shot of Arthur Morgan standing at the foot of the cabin porch steps facing Sonny, who leans in the doorway; neither character moves or changes pose across all 50 frames. The dialogue-wheel HUD ("Aim Weapon / Greet / Antagonize / Stranger") and minimap remain constant throughout, with no cuts, fades, letterboxing, or control-state changes. Two subtitle lines are displayed in sequence, spanning a brief empty gap between them: "no, siree." (frames 401–~419) then, after a short gap with no subtitle (~420–421), "I can't make up my mind about things, neither." (frames 422–450), matching the Whisper transcript's "No, sirree. I can't make up my mind about things neither."

- t≈102.0–102.1s (l_0420–l_0421): subtitle clears (end of "no, siree." line) — brief no-text gap
- t≈102.1s (l_0422): new subtitle appears — "I can't make up my mind about things, neither." (holds through end of window, t=104.9s)
- No cuts, fades, letterboxing, control-loss/regain, or HUD-state transitions detected anywhere in this window.

