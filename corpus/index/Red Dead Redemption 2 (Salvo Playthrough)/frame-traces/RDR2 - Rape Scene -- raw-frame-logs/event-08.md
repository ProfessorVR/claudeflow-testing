# Event Micro-Log — e_0337 to e_0384 (clip t = 02:43.00–02:44.96)

Frame-to-time: t = 149 + (frameNumber-1)/24 sec (clip time)

## Frames e_0337–e_0377/378 (t ≈ 02:43.00–02:44.71)
- Screen is **fully black** (RGB ~0,0,0) across this entire span. No visible geometry, no HUD game elements (no minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts, no subtitle text rendered on any of these frames).
- The only persistent on-screen element in every frame is a **performance/diagnostic overlay** in the top-right corner (non-diegetic, appears to be a system monitoring overlay, not game UI): `FPS 80  40(1%L) | GPU %/°C/MHz/V/W/RPM/MHz | CPU % | LAT ms ms`. Values fluctuate slightly frame to frame (e.g., GPU load 48%→28%→75%, GPU temp 60°C→59°C, CPU 23%→24%→28%, power 432W→432W, fan RPM 1803→1703→1576) — these are hardware telemetry readings, not game content, and are logged only because they are the sole visible pixels.
- No letterboxing/cinematic bars are visible as such — the black may itself constitute a full-screen fade-to-black rather than letterboxing (cannot distinguish from these frames alone) [UNCERTAIN].
- No cuts, camera movement, or scene content are visible during this stretch; effectively a sustained black/fade frame across e_0337 through at least e_0377.
- No subtitle text is burned into any frame in this span, despite the transcript indicating dialogue ("Don't hate him," "What, oh," "You struggled and you lost, but it was quite a tussle, I tell you," etc.) falls chronologically within/near this window — subtitles are not visually present on these particular frames [UNCERTAIN — subtitles may be intermittent/timed to not coincide with sampled frames, or may not be enabled].

## e_0378 (t ≈ 02:44.71) — Visual transition begins
- Screen is no longer pure black. A **heavily stylized, distorted image** fades/resolves in: a circular/oval **vignette** with dark purple-magenta corners framing a warped, fisheye-like central image.
- Content within the vignette: a close-up of a **bare torso and arm** wearing tan/olive suspenders (braces) over bare skin, with a hand (own hand, visible fingers/knuckles) reaching across/gripping at the suspender strap near the chest/abdomen. Background behind the figure shows dark, vertical slatted/lattice-like structures (possibly wooden beams, stairs, or fencing) rendered in muted green-brown tones.
- Color grading is heavily tinted yellow-green/sepia in the lit areas and purple/magenta in the vignette shadow, consistent with a distortion/vision-effect overlay rather than standard gameplay color.
- Same performance-overlay telemetry persists top-right (GPU 75%, 59°C, CPU 28%).
- No HUD elements (minimap, cores, prompts) are visible; no subtitle text visible.

## e_0380–e_0383 (t ≈ 02:44.79–02:44.92)
- Composition is **static/near-static** — nearly identical framing of the torso/arm/suspenders/hand across all four frames, with only minor waviness/warping shifts in the distortion effect (the fisheye warp appears to subtly pulse/breathe frame to frame, consistent with a rippling or heartbeat-like vision-distortion effect rather than camera or character movement).
- No camera cut, no additional geometry revealed, no HUD change, no subtitle text in any of these frames.
- Telemetry overlay unchanged (GPU 75%, 59°C, 3202MHz, CPU 28%).

## e_0384 (t ≈ 02:44.96, window end)
- Same distorted torso/hand/suspenders composition persists, effectively unchanged from e_0383. Still within the warped/vignetted vision effect; no return to a clean gameplay HUD or standard rendering within this window.

## Summary of transitions
- A sustained black screen (likely a fade-to-black / dialogue-cutscene black-frame hold, indeterminate whether letterboxed) spans essentially the entire window from e_0337 to approximately e_0377.
- Beginning at e_0378 (t ≈ 02:44.71), the black gives way to a distorted, vignetted, color-shifted close-up of a torso/arm/hand/suspenders — a stylized "vision distortion" effect (blur/warp/color-grade), which continues static-to-near-static through the end of the sampled window at e_0384 (t ≈ 02:44.96).
- No standard gameplay HUD (minimap, health/stamina/deadeye cores, money counter, honor toast, button prompts) appears anywhere in this window.
- No burned-in subtitle text appears on any sampled frame in this window, despite transcript dialogue timestamps falling within/adjacent to this range.
- No control-loss/control-regain indicator is visually determinable from HUD (none present); the imagery itself (distorted POV-style close-up) suggests a first-person/POV cinematic-vision insert rather than standard third-person player-controlled gameplay, but this is an inference from content, flagged as [UNCERTAIN] since no explicit camera-mode indicator is visible.
