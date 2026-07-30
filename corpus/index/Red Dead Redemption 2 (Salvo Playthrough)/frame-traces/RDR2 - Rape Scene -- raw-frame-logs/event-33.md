# Event-tier micro-log — window 03:33.00–03:34.96 (clip time)

Frames read: e_1537.jpg – e_1584.jpg (48 frames, 24fps). Timestamp formula: t = 149 + (frameNumber-1)/24 s (absolute source-video time; noted alongside clip-relative time for cross-reference). Clip-relative time in this window runs 03:33.00 → 03:34.96.

Global observations across the whole window:
- Persistent black letterbox bars top and bottom of frame for all 48 frames — cinematic/cutscene framing throughout, no change in letterbox thickness observed.
- No game HUD elements visible in any frame: no minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts, no subtitle text rendered on screen.
- Top-right corner shows a persistent developer/performance overlay (FPS, GPU%, temp, clocks, power draw, RPM, CPU%, latency) — this is a system monitoring overlay, not game UI; values fluctuate slightly frame to frame (FPS 69–72, GPU 93–98%, temp 66–68°C) but this is incidental telemetry, not a game state change.
- Environment: foggy/misty overcast swamp or wet grassland, tall thin bare/sparse trees in background (bald-cypress-like silhouettes), low scrubby palmetto-type plant lower-left foreground in later frames, wet dark ground/mud patches visible right-of-frame in several shots. Overcast grey sky. Diffuse flat lighting consistent with dusk/overcast daytime, no strong directional light. No cabin, skulls, table, or bed props visible in any frame of this window.
- No fades to black, no screen distortion/blur effects, no vision-mode color shifts observed in this window.

## Shot A (e_1537–e_1557, ≈149.0–149.8s abs / 03:33.00–03:33.83 clip): bent-over walking cycle, camera trailing high-behind
- Frames e_1537 through e_1557 show a male figure wearing a wide-brim weathered hat, dark/olive long coat, and a bandolier/ammunition belt draped diagonally across the back, viewed from behind at a high-medium angle.
- Figure is bent forward at the waist ~70-80°, torso nearly horizontal, head down, in a shuffling/stooped gait through tall grass — a gait anomaly consistent with a labored, hunched, or injured walk cycle (not a standard upright locomotion animation).
- Camera is a trailing/tracking cinematic camera (non-player-controlled framing, no crosshair/reticle, no third-person control indicators), positioned slightly above and behind the figure, holding a fairly steady medium-close framing as the figure advances through grass; slow parallax of background trees indicates continuous forward camera movement (dolly/track), not a static shot.
- No cuts detected within this shot — continuous motion across e_1537–e_1557 (frames flow smoothly, hat/coat/bandolier position shifts incrementally frame to frame).
- By e_1553–e_1557 the framing tightens slightly and camera appears to lower/rotate, beginning to bring the figure's face into view in right-profile.

## Shot continuation (e_1558–e_1568, ≈149.9–150.5s abs / 03:33.9–03:34.5 clip): face reveal, still bent-over
- Camera has continued to rotate/arc around to the figure's left side, now framing a right-side profile view of the head and upper torso.
- Figure's face becomes visible starting ~e_1558: a bearded adult male face, eyes appear closed or downcast, expression neutral/blank, head still tilted down, hat brim shadowing upper face.
- Torso remains bent forward at the waist through e_1568; the bandolier is visible crossing the chest/shoulder; a pouch/bag (light tan/cream colored, fringed) hangs at the hip on the belt.
- Right arm hangs loosely, hand visible near hip level, fingers loosely curled — no gripping animation, no weapon in hand.
- Gait continues to look heavy/labored — shuffling steps through wet grass, no run, no normal brisk walk cadence.
- No cuts in this stretch; continuous camera arc/pan.

## Shot continuation (e_1569–e_1584, ≈150.5–151.96s abs / 03:34.5–03:34.96+ clip): figure straightens to upright walk, camera drops to torso-level trailing shot
- Starting ~e_1569–e_1571, the figure begins to straighten from the bent-over posture toward a more upright walking stance; by e_1572–e_1575 the figure is walking upright, camera now framing from roughly chest-height/behind-right, showing shoulder, arm, and hip/pouch area (head is now above the top frame edge/letterbox in several of these tighter shots).
- A horse (riderless, saddled — visible saddle silhouette) appears in the background left of frame starting ~e_1575 and remains visible (grazing/standing, tail visible) through e_1584, positioned in the misty grass field at roughly 8-10 o'clock relative to the walking figure.
- Palmetto/spiky low plant visible foreground-left in these later frames (e_1575–e_1584), unchanged in position — suggests a slow lateral or forward camera dolly past static environment props.
- Figure's right arm swings gently at the side in a relaxed walking-arm-swing animation (visible hand/fingers loosely open); left arm/hand not clearly visible (out of frame or occluded by body).
- The tan fringed pouch and bandolier remain visible at the hip/torso throughout this final stretch, consistent with the same character/outfit as the earlier bent-over shot — no costume change detected.
- No additional camera cuts detected in this final stretch (e_1569–e_1584); camera holds a fairly stable trailing composition tracking forward movement, with only minor vertical/horizontal drift.
- Window ends at e_1584 (≈151.96s abs / 03:34.96 clip) with the figure still walking upright, mid-stride, no fade or cut visible at the final sampled frame.

## Audio cross-reference (per provided transcript, not independently verified against frames)
- Transcript indicates a sustained "No" vocalization spanning 03:29.9–03:39.8, which overlaps this entire visual window; no corresponding subtitle text is rendered on screen in any frame sampled.
- No button prompts or UI toasts co-occur with this audio in the sampled frames.

## Uncertain / flagged items
- [UNCERTAIN] Whether the transition from bent-over to upright gait (occurring ~e_1568–e_1572) represents a scripted animation blend or a hard cut; no black frame or letterbox-size change was observed, and background elements (trees) appear continuous, suggesting a blend/camera move rather than a cut, but this could not be confirmed frame-by-frame with full certainty given motion blur in a few frames.
- [UNCERTAIN] Identity of the walking figure cannot be confirmed from visual data alone (face partially visible only in profile, no name plate/label on screen).
- [UNCERTAIN] Whether the riderless horse first visible at e_1575 was present earlier in frame but occluded/out of shot, or newly entered frame due to camera movement.
- No skulls, cabin exterior/interior, bed, or table props appear anywhere in this specific window (03:33.00–03:34.96); this window is entirely an exterior grass/swamp environment.

## Hard transitions / notable timestamps within this window
- No cutscene start/end boundary occurs within this window (cutscene/letterbox state is constant throughout — already in cutscene at window start, still in cutscene at window end).
- No control-loss/regain moment observed (no HUD present at any point to indicate a state change).
- No fades to/from black observed.
- No HUD appearance/disappearance observed (HUD absent throughout).
- Approx. e_1568–e_1572 (≈150.4–150.6s abs / 03:34.4–03:34.6 clip): gait/posture transition — figure shifts from a sustained bent-over/stooped walk to an upright walking posture; camera reframes from high-behind angle to a lower trailing torso-level angle around the same interval. Flagged as the single most notable visual change in this window, though not a hard cut (see [UNCERTAIN] above).
