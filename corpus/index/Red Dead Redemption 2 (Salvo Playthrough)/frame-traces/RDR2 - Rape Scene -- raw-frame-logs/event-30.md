# Event Tier Micro-Log — window 03:27.00–03:28.96 (frames e_1393–e_1440)

Timestamp formula: t = 149 + (frameNumber-1)/24 s. Frame e_1393 = 149.0s (clip-relative offset applied by pipeline; logged times below are RELATIVE clip times per the stated window 03:27.00–03:28.96, i.e. frame e_1393 ≈ 03:27.00).

All 48 frames in this window show a single continuous shot: a static/near-static close-up of the male playable-character avatar (Arthur Morgan), seen from a low, slightly upward angle, framed from mid-torso to top of hat. No cuts occur across the entire window.

## Shot description (constant across all 48 frames)
- Full-screen image (no visible letterbox bars in this crop) — top strip contains a persistent performance-overlay HUD (FPS/GPU/CPU/latency stats: e.g. "FPS 66 34(1%) GPU 98% 66°C ... CPU 22% ... LAT 12.0ms 58.1ms"), which is a debug/benchmark overlay, not game HUD, present in every frame.
- No minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts visible anywhere in this window.
- Avatar: wearing wide-brim green hat with lighter hatband, bandolier/ammo-belt draped diagonally across chest, dark green/olive coat with fringe/embroidered panel on chest, collar upturned. Head tilted down and to the right in a slumped posture; eyes appear closed or downcast; mouth region shows beard, lips separated as if breathing/speaking.
- Background: soft-focus pale sky/overcast light at top, thin tree trunks and green foliage/grass at edges, consistent with cabin-exterior woodland setting seen earlier in the sequence. Lighting is flat, hazy, diffused (overcast day).
- Camera is static/cinematic (fixed framing) — no player-input movement, no camera pan/tilt/cut detected across the 48 frames. This reads as a held cinematic shot (likely a paused/lingering post-cutscene or slow-motion beat), not player-controlled free camera.
- No letterbox bars, no fades, no blur/vision distortion, no black frames observed in this window.

## Frame-by-frame notes

- 03:27.00 (e_1393) – Static shot begins/continues: avatar slumped, head down-right, hat obscuring eyes, mouth slightly open. No subtitle text on screen.
- 03:27.04–03:27.29 (e_1394–e_1400) – No visible change frame-to-frame; avatar holds same slumped pose; head angle and mouth position essentially identical (micro-movement only, consistent with idle/breathing animation, not a distinct action). No subtitles, no HUD elements beyond the debug overlay.
- 03:27.33–03:27.63 (e_1401–e_1408) – Same static held pose continues; no subtitle text appears yet. Performance-overlay values fluctuate slightly (FPS 66→65, GPU 95→98%) — these are non-diegetic engine stats, not scene content.
- 03:27.67 (e_1409) – Subtitle appears at bottom-center of frame: **"Oh my Lord..."** (white text, dark semi-transparent caption box). This is the first on-screen subtitle in the window.
- 03:27.71–03:28.96 (e_1410–e_1440) – Subtitle **"Oh my Lord..."** remains on screen continuously through the remainder of the window (all subsequent frames e_1410 through e_1440 show the identical caption box and text, unchanged). Avatar pose remains essentially static/slumped throughout — head down-right, hat brim shadowing face, no gross body movement, no gait/locomotion (character is seated/kneeling on ground, not walking). No further NPC (Sonny) visible in this crop — the frame is tightly cropped on the avatar only, and no other character is visible in any of the 48 frames.
- No control-loss/regain indicator, no cutscene start/end marker (no letterbox transition), no fade-in/out, no teleport/relocation observed — the entire 48-frame window is one continuous static shot with the sole visible change being the appearance of the subtitle "Oh my Lord..." at 03:27.67, which persists to the end of the window (03:28.96).

## [UNCERTAIN]
- Whether this is a still-cinematic (non-interactive) shot or a player-controlled camera on a stationary/incapacitated avatar cannot be determined from these cropped frames alone (no HUD cores/minimap visible to confirm player-control state).
- Exact avatar identity assumption (Arthur Morgan) based on visual similarity to known model; not independently confirmed from this crop.
- The "Oh my Lord..." subtitle's speaker is not confirmable from the image alone (no NPC visible in frame); attributed by inference to the transcript's contextual proximity to the "Lord" (03:27.9) whisper-transcript entry.
- Slight blur/softness in the background trees may be depth-of-field rather than a vision-distortion effect; treated here as normal DOF, not a scene transition.
