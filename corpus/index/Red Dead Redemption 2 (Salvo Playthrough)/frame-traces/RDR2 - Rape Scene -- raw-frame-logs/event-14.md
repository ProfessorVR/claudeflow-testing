# Event Micro-Log — Segment 14 (clip 02:55.00–02:56.96, frames e_0625–e_0672, 24fps)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 sec. All 48 frames read in order.

## Persistent frame elements (entire segment unless noted)
- Camera: fixed cinematic low-angle close-up, looking upward at Sonny's face/torso from below (implied first-person/POV of the player character lying on the ground). No camera cuts within this window; only very slight handheld-style micro-jitter (breathing-like sway) frame to frame — consistent with a static cutscene camera with idle noise, not player input.
- No letterbox bars visible; image fills the full 960x540 frame top-to-bottom.
- No minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts visible in any frame of this window.
- Top-right corner: a persistent developer/performance overlay (FPS, frame-time, GPU%, temp, clocks, power draw, fan RPM, CPU%, latency) — this is a capture/monitoring overlay, not in-game HUD. [UNCERTAIN whether this is diegetic to any analysis — flagging as non-game telemetry only].
- Sonny: shirtless under open bib-overalls with straps hanging off shoulders, gaunt/lined face, mouth open mid-speech, head tilted back and to the side, one hand raised near his own chest/gesturing loosely (fingers curled, small idle motions), other arm extended down and forward out of frame toward the camera/player position. His position and pose do not change substantially across frames 625–658 beyond small idle sway of the raised hand and head.
- Color/lighting: the entire visible image carries a heavy purple-to-olive/yellow tint and low contrast, consistent across all non-black frames — appears to be a color-grade/vision-effect over the scene (dim interior cabin light, exposed roof rafters and a small window visible upper-left). [UNCERTAIN whether this is an in-engine "damaged vision" effect or a capture/tonemap artifact].
- Environment: interior of Sonny's cabin loft/attic — exposed wood roof beams and rafters visible behind Sonny's head, a small window with pale light upper-left, otherwise dark/cluttered background, consistent with the Lakay cabin interior established earlier in the scene.

## Chronological log

**02:55.00 (e_0625)** – Subtitle box on screen, exact text: `Quite a tussle, my pet.` White text in a dark semi-transparent rounded rectangle, standard RDR2 subtitle style, positioned lower-center. Sonny mid-speech, head back, mouth open, gesturing hand raised near chest.

**02:55.04 (e_0626)** – Same composition; subtitle `Quite a tussle, my pet.` still displayed, unchanged text.

**02:55.08 (e_0627)** – Same composition; subtitle `Quite a tussle, my pet.` still displayed (third and final frame in window showing this subtitle).

**02:55.13 (e_0628)** – Subtitle box no longer visible (disappeared). Framing, pose, and lighting otherwise continuous/unchanged from prior frame. No new subtitle appears for the remainder of the window.

**02:55.13–02:56.29 (e_0628–e_0657, 30 frames)** – Extended static-camera hold on the same shot: Sonny's face/torso from below, mouth continuing to move (silent/no new subtitle), raised hand with small idle finger/wrist motion, other arm extended toward camera. Only micro-variation in head angle and hand position frame-to-frame (idle animation noise); no camera cut, no HUD change, no environment change. GPU/FPS overlay values fluctuate slightly (e.g., FPS 86→91→97, GPU 94–98%, temp 68–70°C) — telemetry only, not scene content.

**02:56.29–02:56.33 (e_0657–e_0658)** – Image begins to darken uniformly (brightness/exposure dropping across the whole frame while composition remains identical) — start of a fade-to-black.

**02:56.42 (e_0659)** – First fully black frame. No image content, no HUD, no subtitle. Telemetry overlay (FPS/GPU/etc.) still present in the corner over black.

**02:56.42–02:56.96 (e_0659–e_0672, 14 frames)** – Full black screen continues uninterrupted through the end of the analysis window (last frame e_0672 at 02:56.96 still black). No fade-back-in occurs within this window.

## Whisper transcript cross-reference for this window
- "See, friendship ain't so tough" is logged at 02:59.5 and "and neither is you" at 03:01.5 in the provided transcript — both fall AFTER this window's end (02:56.96) and are not reflected in these frames; the only transcript line whose timing overlaps this window is "quite a tussle, my pet" (02:53.1), consistent with the subtitle observed at 02:55.00–02:55.08 (subtitle display lagging slightly behind the transcript's estimated line-start, as expected for subtitle timing vs. ASR onset detection).

## Flags / uncertainty
- [UNCERTAIN] Purple/olive color cast over the entire scene — possibly an in-game post-process/vision effect vs. a capture-side tonemap artifact; cannot confirm origin from frames alone.
- [UNCERTAIN] Whether the fade beginning at 02:56.29 is a hard scripted cutscene fade-to-black (e.g., preceding a time-skip / scene-end) — consistent with a deliberate narrative elision, but no additional evidence (loading icon, chapter card) appears within this window to confirm.
