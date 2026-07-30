# Event Micro-Log — Window 02:47.00–02:48.96 (clip time), frames e_0433–e_0480

Frame→time formula: t = 149 + (frameNumber-1)/24 s. This window covers frames 433-480 (t ≈ 167.0–167.96s in absolute clip-clock, but per task header the window label is clip time 02:47.00–02:48.96, consistent with the whisper transcript's ~02:46–02:53 dialogue "You struggled and you lost...").

## Shot composition (constant across entire window, frames 433-480)
- Full-screen cinematic cutscene, first-person POV, camera tilted/angled sharply upward (looking up at NPC from a low, near-ground position), consistent with the avatar being on the floor/ground looking up.
- Heavy vignette: entire frame is bordered by a large soft-edged dark/purple-tinted oval mask (fisheye/tunnel-vision effect), leaving only a central elliptical clear area — consistent with a "blurred vision" / disorientation POV filter. This vignette is present in every single frame of the window without change.
- No HUD elements visible: no minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts. Only a persistent developer/debug performance overlay in the top-right corner (FPS, GPU%, temp, clock, power draw, RPM, CPU%, LAT ms) — this is a benchmark overlay, not a game HUD element, and is present in all frames.
- No visible letterbox bars (top/bottom black bars) — the oval vignette mask serves the visual-restriction function instead.
- NPC (Sonny Macgregor) fills the upper-center of frame: bare-chested, wearing overalls with shoulder straps, gaunt/lined face, close to camera, leaning down toward camera/avatar. His left hand (frame-left) is raised, fingers curled/twitching near camera in a grasping/reaching gesture throughout. His right arm extends further down toward the camera (frame lower-right), out of focus, suggesting his hand is reaching toward or resting on the avatar (implying the avatar being addressed is below/prone).
- Background: wooden cabin interior — exposed roof beams/rafters, wood-plank ceiling, a single small window (upper left) admitting dim grayish light. Lighting throughout is dim, low-key, greenish-yellow/sepia grade with strong purple vignette tint overlay.
- Camera does not cut or change angle at any point in this window; it is a static (or near-static, very slight micro-drift) held shot for the full ~2-second span.

## Frame-by-frame subtitle/dialogue and micro-changes

- **e_0433 (t≈167.00s)**: Subtitle onscreen: "Oh, you struggled..." Sonny's mouth open mid-speech, left hand raised with fingers slightly spread near camera.
- **e_0434 (t≈167.04s)**: Same subtitle "Oh, you struggled...", identical framing; Sonny's head angle marginally shifted (very subtle head bob).
- **e_0435 (t≈167.08s)**: Subtitle unchanged, Sonny's raised hand fingers curl slightly further inward.
- **e_0436 (t≈167.13s)**: Subtitle unchanged. No visible change beyond micro facial-animation (mouth position).
- **e_0437 (t≈167.17s)**: Subtitle unchanged. Sonny's brow/eye area shows a slight squint change.
- **e_0438 (t≈167.21s)**: Subtitle unchanged. Hand position continues its slow closing gesture.
- **e_0439 (t≈167.25s)**: Subtitle unchanged. Minimal head movement, mouth slightly more closed.
- **e_0440 (t≈167.29s)**: Subtitle unchanged. Same general pose, fingers now more curled (approaching a loose fist).
- **e_0441 (t≈167.33s)**: Subtitle unchanged. Mouth reopening slightly (continuing speech animation).
- **e_0442 (t≈167.38s)**: Subtitle unchanged. No other visible change.
- **e_0443 (t≈167.42s)**: Subtitle unchanged. GPU/perf overlay values tick over (75%→79% range across this cluster) — background telemetry only, not gameplay-relevant.
- **e_0444 (t≈167.46s)**: Subtitle unchanged. Sonny's head tilts marginally further down toward camera.
- **e_0445 (t≈167.50s)**: Subtitle unchanged. Same pose held.
- **e_0446 (t≈167.54s)**: Subtitle unchanged. Same pose held.
- **e_0447 (t≈167.58s)**: Subtitle unchanged. Same pose held; hand gesture steady.
- **e_0448 (t≈167.63s)**: Subtitle unchanged. Same pose held.
- **e_0449 (t≈167.67s)**: Subtitle unchanged. Same pose held; perf overlay shows CPU 26%.
- **e_0450 (t≈167.71s)**: Subtitle unchanged. Same pose held (this is the last frame of the "Oh, you struggled..." line — 18 consecutive frames, ~0.75s, matching whisper's continuous line).
- **e_0451 (t≈167.75s)**: Subtitle still "Oh, you struggled..." (transition frame).
- **e_0452 (t≈167.79s)**: **Subtitle changes to: "and you lost,"** — this is a hard subtitle-text transition (new caption card). Sonny's mouth reopens to continue speaking; hand gesture position resets slightly (fingers re-extend before curling again).
- **e_0453 (t≈167.83s)** through **e_0480 (t≈168.96s)**: Subtitle remains fixed on **"and you lost,"** for the remainder of the window (28 consecutive frames, ~1.17s). Across these frames:
  - Sonny's head sways subtly side to side (slow oscillation, consistent with a scripted talking-head idle/loop).
  - His raised left hand continues a slow repetitive curl-extend cycle (fingers open→closed→open), never fully closing into a fist, never touching the camera lens.
  - His right arm (frame-right, lower edge) remains extended down/forward out of frame, position essentially static except for very slight tremor/idle animation.
  - No cuts, no fades, no letterbox changes, no HUD appearance, no additional subtitle changes, no camera-angle changes for the entire 28-frame stretch.
  - Performance overlay ticks: FPS fluctuates 77→91→94→96→91; frame counter resets/increments (e.g. "37 (1%L)" appears steadily from e_0459 onward, GPU% settles ~94-96%, CPU% 23-26%) — purely telemetry, not diegetic.

## Environment/prop notes
- Skulls, bed, table (mentioned in task prompt as possible props) are NOT visible in this window — frame is entirely occupied by Sonny's torso/face against the cabin ceiling; no other props enter frame.
- Window (small, upper-left) shows flat dim gray-blue light, consistent with overcast daylight seen through a cabin window; no visible weather effects (rain/snow) discernible through the small pane at this resolution.
- No changes in lighting or time-of-day cues across the window.

## Transitions summary within this window
- No cutscene start/end boundary occurs inside this window (already mid-cutscene at e_0433; still mid-cutscene at e_0480).
- No control loss/regain markers (no HUD to indicate control state either way).
- No fades, no teleport/relocation events observed.
- The only "hard transition" is the subtitle text change.

[UNCERTAIN]: Whether the avatar is on the ground/floor is inferred only from the steep upward camera angle and Sonny's downward-reaching posture; no avatar body part or ground plane is directly visible in frame to confirm position. [UNCERTAIN]: Exact contact point of Sonny's lower-frame-right hand — it exits frame bottom-right before any contact would be visible.

## Summary
This 2-second window (frames e_0433–e_0480) is a static, uncut, first-person cinematic shot from a steep low upward angle, framed through a heavy dark oval vignette, showing only Sonny Macgregor's face/torso leaning over the camera in a dim wooden cabin interior with one window. No HUD, letterboxing, minimap, or button prompts are present at any point — only a non-diegetic performance-benchmark overlay. The sole on-screen event is a subtitle-text transition from "Oh, you struggled..." (frames 433–451) to "and you lost," (frames 452–480), spoken continuously by Sonny while he performs a slow, looping hand-curling gesture and subtle head sway; no cuts, fades, camera moves, or control-state changes occur within the window.

- Exact timestamps of hard transitions observed:
  - Subtitle change "Oh, you struggled..." → "and you lost," at frame e_0452 (t ≈ 167.79s / clip-relative ≈02:47.79–02:47.83)
  - No other cuts, fades, control-state, or HUD transitions occur in this window (433–480).
