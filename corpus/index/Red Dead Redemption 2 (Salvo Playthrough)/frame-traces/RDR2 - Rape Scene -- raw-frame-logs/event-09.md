# Event Micro-Log — Segment 09 (frames e_0385–e_0432, clip t=02:45.00–02:46.96)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 sec (clip-relative here).

## Overview of window
Entire window is a single, unbroken shot: a heavily stylized, purple/magenta vignette-and-chromatic-aberration "dream/vision" filter fills the frame edges (round iris/tunnel-vision mask), with a warm sepia-yellow color grade on the visible central image. No letterbox bars are present; the visual distortion itself (circular vignette + color separation) functions as the non-diegetic marker of an altered mental/vision state rather than a standard cutscene frame. Camera is fixed/near-fixed, extremely close on Arthur Morgan's (player character) upper torso and one raised hand/arm, viewed from a low, tilted angle looking up past his chest toward his chin/jaw — consistent with the character lying on his back looking up, or the camera positioned very close to his body. No HUD elements (minimap, health/stamina/deadeye cores, money counter, honor notifications, button prompts) are visible anywhere in this window except a developer/debug performance overlay (FPS, GPU%, temp, CPU%, latency) in the top-right corner, present in every frame, unrelated to the game's diegetic HUD.

## Frame-by-frame

- **t=02:45.00 (e_0385):** Extreme close-up, canted low angle. Player-character's bare torso (shirt open/pulled down, overall-strap visible on left shoulder) fills right/center frame; a hand (his own) is extended toward camera at lower-left, fingers loosely curled. Background: dark wooden beams/lattice structure (cabin interior rafters/stairs), heavily blurred. Purple circular vignette with chromatic-aberration fringing at edges. No subtitle text visible. No HUD.
- **t=02:45.04–02:45.21 (e_0386–e_0389):** Framing essentially static; hand and torso position hold steady with only micro-movement (subtle breathing/sway). No subtitle yet. Performance overlay values fluctuate (FPS 63, GPU 87%, temp 64°C) — not diegetic.
- **t=02:45.25 (e_0390):** Subtitle box appears at bottom-center: **"Oh, you struggled..."** (matches Whisper transcript "You struggled and you lost, but it was quite a tussle, I tell you" beginning ~02:46.0 in clip-time reference, though subtitle text captured here is a partial/leading clause). This is the first HUD/UI element of the window — a dialogue subtitle in dark semi-transparent box, white serif-ish font.
- **t=02:45.29–02:46.71 (e_0391–e_0417):** Subtitle "Oh, you struggled..." remains persistently on screen, unchanged, for an extended run of frames (~27 frames / ~1.1s+ of window time held static). Framing continues to hold on the same extreme close-up of torso/arm/hand; only very slight camera drift/tilt changes (hand appears to slowly rotate/curl, fingers flex incrementally frame to frame — a slow grasping or twitching motion). No cuts, no fades, no letterboxing changes. Vignette and color grade remain constant throughout.
- **t=02:46.75 (e_0418):** Subtitle text is still present but the visible line is cut off / same box "Oh, you struggled..." continues to render (no visible change in text content across this run — the subtitle line does not appear to update to a second clause within this captured window).
- **t=02:46.79–02:46.96 (e_0419–e_0432):** Continued static hold: subtitle "Oh, you struggled..." persists unchanged through the remainder of the window. Player-character's head/jaw becomes slightly more visible tilting into frame at top (mouth appears open, as if speaking or gasping) in later frames (~e_0426 onward), while the hand at lower-left continues small flexing/curling motion. No new HUD elements, no button prompts, no minimap, no money/honor toasts. No black frames, no fade in/out, no scene cut within this window.

## HUD / UI summary for window
- Minimap: absent throughout.
- Health/stamina/Dead Eye cores: absent throughout.
- Money counter: absent.
- Honor notification: none observed.
- Button prompts: none observed.
- Subtitle: single line, exact text **"Oh, you struggled..."**, appears at t≈02:45.25 (e_0390) and remains on screen continuously through the end of the window (t=02:46.96, e_0432) with no visible text change — i.e., no second subtitle line replaces it within this segment.
- UI toasts: none.
- Debug/perf overlay (FPS/GPU/CPU/temp/latency, top-right) present in all frames — non-diegetic development telemetry, not part of game HUD.

## Camera / cutscene markers
- No letterbox bars visible (full non-letterboxed frame, consistent with either gameplay-cam cutscene style or a vision/dream effect rather than standard bar-letterboxed cutscene).
- No fades to/from black within this window.
- No hard cuts within this window — entire ~2-second segment is one continuous shot.
- Persistent circular vignette + purple/magenta chromatic-aberration distortion suggests a "vision"/altered-perception visual effect rather than ordinary gameplay or ordinary cutscene framing. [UNCERTAIN: whether this is a "Dead Eye"-style effect, a concussion/pain vision effect, or a scripted cinematic filter specific to this scene — cannot be determined from visuals alone.]
- No control loss/regain transition point is visually marked within this window (camera does not change from a player-controlled framing to a cinematic framing during this segment — it is static/held throughout).

## Environment
- Setting: dark interior with visible wooden beam/lattice structure in background (upper cabin interior, staircase, or roof framing), heavily out of focus.
- Lighting: low ambient light, warm/sepia cast from color grading; no discernible light source directly visible.
- Props: none clearly identifiable beyond structural beams.
- No NPC (Sonny) visible in frame at any point in this window — the framing is entirely on the player-character's own torso, arm, and hand; Sonny is presumably off-frame given the tight, unusual angle.

## Notes / uncertainty flags
- [UNCERTAIN] The exact nature of the round-vignette/color-distortion effect (dream-state, injury-vision, or engine post-process) cannot be determined from visual evidence alone.
- [UNCERTAIN] Whether the subtitle "Oh, you struggled..." is a partial render of the longer transcribed line ("You struggled and you lost, but it was quite a tussle, I tell you") or a distinct, separate subtitle event — the visible text does not change within this window's frame range.
- No visible transition of control state, no HUD elements beyond the single subtitle box, and no scene cut occur within t=02:45.00–02:46.96.

## Hard transitions observed in this window
- t≈02:45.25 (frame e_0390): subtitle text **"Oh, you struggled..."** appears (only UI/HUD change in the window).
- No other cuts, fades, letterbox changes, or control-state transitions detected between e_0385 and e_0432.
