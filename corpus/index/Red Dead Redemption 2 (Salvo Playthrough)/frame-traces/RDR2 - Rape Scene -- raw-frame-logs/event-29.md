# Event Micro-Log — e_1345 to e_1392 (clip t=03:25.00–03:26.96)

Frame time formula: t = 149 + (frameNumber-1)/24 s (clip-relative timestamps below use MM:SS.ss of the CLIP, i.e., matching the whisper transcript timeline provided — computed directly from frame number per formula, then converted).

Note: all 48 frames in this window are visually a single continuous shot — a static-cinematic (non-player-controlled) close/medium shot from a fixed camera angle, with letterbox bars present at top and bottom of frame throughout (black bars occupying roughly the top ~14% and bottom ~9% of the 540px-tall frame), confirming cutscene/cinematic mode for the entire window.

## Overview of the shot
- Camera: fixed, slightly low angle, framing the player-character (Arthur Morgan) from behind/side, positioned in profile/three-quarter view. Camera does not cut during this window — same static composition across all 48 frames.
- Player character: wearing wide-brim hat with hat-band, heavy weathered coat/vest with fringe/tassel details and a bandolier (cartridge belt) across the chest, visible stubble/beard. Head oriented forward-left initially, gradually rotating so more of the face (eye, cheek, beard) becomes visible toward the end of the window.
- Background: soft-focus (heavy depth-of-field blur) trees/foliage, overcast pale-grey sky, muted desaturated color grade — consistent with the swamp/Lakay bayou exterior setting. No other NPCs (Sonny not visible in frame — likely off-camera or the camera is tight on Arthur).
- No visible weapon in hand (hands not in frame in most shots; a shoulder/bandolier row of cartridges is the dominant foreground texture).

## HUD state (constant across entire window)
- Top-right diagnostic overlay (non-diegetic, appears to be a performance monitor, NOT game HUD): "FPS 65-67 (1%L) | GPU 97-98% 66-68°C 3112-3120MHz 1.065V 400-411W 1368-1668RPM 14983MHz | CPU 19-23% | LAT 11.3-14.4ms 58.1-81.9ms". This is a hardware overlay, not a game element.
- No minimap visible anywhere in this window.
- No health/stamina/deadeye cores visible.
- No money counter, no honor notification, no button prompts, no subtitle text rendered on screen in any of these 48 frames (the transcript's "Lord" ~03:27.9 and "No" ~03:29.9-03:39.8 fall just after/within this window's audio but no on-screen subtitle text appears in the visual frames sampled).
- Small microphone icon bottom-right corner of frame throughout (recording indicator overlay, non-diegetic, present in every frame) — constant, no change.
- Letterboxing: black bars top and bottom present in ALL 48 frames (e_1345 through e_1392) — no change/removal observed in this window, confirming continuous cinematic/cutscene framing (control loss presumed already in effect from before this window, continuing through it).

## Chronological micro-log

- **e_1345 (t=149+1344/24=205.0s clip-render frame; corresponds to ~03:25.00 clip-time per prompt window)**: Static cinematic shot, heavy motion-blur/glitch streaking on left/right edges of frame (green/purple chromatic-aberration-like streaks on tree silhouettes) — suggests a fast camera pan/whip just prior, now settling. Player character head down-tilted, hat brim obscuring eyes, facing left-of-frame. Letterbox bars present.
- **e_1346–e_1348 (~03:25.04–03:25.13)**: Motion-blur streaking gradually resolves/diminishes on the background foliage; camera holds static; character's pose essentially unchanged (head angled left, hat down).
- **e_1349–e_1353 (~03:25.17–03:25.33)**: Background blur continues to settle into calmer soft-focus; no discernible character movement; camera fixed. Cartridge bandolier and coat fringe visible in lower-mid frame, unmoving.
- **e_1354–e_1359 (~03:25.38–03:25.58)**: Background streak/glitch effect fully dissipates into steady soft depth-of-blur foliage; character silhouette still static, head/hat angle unchanged; no gesture or head turn yet.
- **e_1360–e_1366 (~03:25.63–03:25.88)**: First subtle sign of head rotation begins — chin/jaw line becomes slightly more visible as head turns marginally rightward (toward camera / more profile view is establishing). Background continues calm blurred-forest.
- **e_1367–e_1372 (~03:25.92–03:26.13)**: Head continues slow rotation; beard/cheek now clearly visible in profile; eye still shadowed under hat brim. No camera cut. Static composition holds.
- **e_1373–e_1376 (~03:26.17–03:26.29)**: Rotation continues; more of the face (nose, mouth, beard) rotates into view facing camera-left; overall gaze direction reads as looking off into the middle distance (not toward a clear focal point in frame).
- **e_1377–e_1383 (~03:26.33–03:26.58)**: Sunglasses/dark eyewear becomes visible on the character's face as the head keeps turning (previously obscured by hat-brim shadow) — [UNCERTAIN: could be shadow across the eye rather than eyewear, image resolution/motion blur limits certainty]. Mouth appears slightly open in several frames (e_1378, e_1381) consistent with speaking, though no subtitle/audio cue is time-aligned to confirm dialogue at this exact instant [UNCERTAIN].
- **e_1384–e_1392 (~03:26.63–03:26.96, end of window)**: Head/face rotation stabilizes in a more forward-facing profile position; expression reads as neutral/mouth slightly open across the final frames; camera remains static; no cut, no fade, no letterbox change. Background remains soft-focus pale forest/sky. Sequence ends still mid-cinematic with no transition observed before window closes.

## Environment details (constant)
- Setting: outdoor, overcast diffuse daylight, densely wooded/swampy area consistent with Lakay bayou exterior (thin tree trunks, low scrub, hazy pale sky suggesting fog/humidity).
- No cabin interior, no skulls, no bed/table props visible in this specific window (camera framing is a tight character shot; environment only visible as blurred background).
- No weather effects (rain/particles) discernible at this resolution.
- Lighting: flat, diffuse, no directional shadows evident on the character within this window.

## Ambiguities / flags
- [UNCERTAIN] Whether the dark area over the character's eye is sunglasses/eyewear or simply hat-brim cast shadow — resolution and motion blur prevent confident identification.
- [UNCERTAIN] Whether slight mouth-open frames (e_1378, e_1381, several after) correspond to speech (transcript places "Lord" at 03:27.9 and "No" 03:29.9+, both after this window closes at 03:26.96, so no dialogue is expected to be mid-utterance here based on provided transcript — mouth movement may be idle/ambient animation, not lip-sync to logged dialogue).
- Sonny is not visible anywhere in this 48-frame window; his position/animation cannot be reported from these frames.
- No HUD, subtitle, or UI element changes were observed at any point in this window — the cutscene/letterboxed state that is presumably already active continues unbroken throughout, with no hard transition (cut, fade, control-change) occurring inside this specific 03:25.00–03:26.96 span.
