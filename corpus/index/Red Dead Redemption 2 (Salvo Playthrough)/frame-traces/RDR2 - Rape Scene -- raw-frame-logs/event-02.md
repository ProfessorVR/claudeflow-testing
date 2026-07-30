# Event Tier Micro-Log — Segment 02 (frames e_0049–e_0096)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 sec (clip time).
Note: on-screen top bar throughout is a developer performance overlay (FPS / GPU temp-load / clock / VRAM RPM / CPU % / LAT ms), not game UI — logged only where it changes meaningfully (e.g., a cut).

## e_0049 (t=149.000) – e_0064 (t=151.625): Player-controlled approach through doorway, exterior threshold
- Player avatar (Arthur, brown long coat, tan hat, rifle/weapon slung on back) stands just outside an open cabin doorway, viewed from behind/over-the-shoulder (player-controlled third-person camera). Camera angle is essentially static across this span, with only minor head/body sway (idle-adjacent stance), not full walking gait.
- Interior beyond the door is very dark; only faint silhouettes of interior shelving/boxes and a hanging pale object (cloth or skin) are visible.
- HUD present throughout this span: circular minimap bottom-left (player marker, terrain wedges, a small red marker on the map), context-action prompt list bottom-right reading exactly: "Aim Weapon", "Greet", "Antagonize", "Stranger" (with corresponding button/input glyphs). No health/stamina/deadeye cores visible in frame (prompt panel occupies that HUD area instead), no money counter, no honor notification, no subtitle text.
- Exterior: wood-plank cabin wall, a crude wooden lattice/crate structure to the left, weathered vertical door frame. Lighting is dim, dusk/night ambience, muted desaturated color grade.
- No camera cuts in this span; only the door itself and Arthur's head/hat position show micro-movement frame to frame [UNCERTAIN whether this is idle sway or the start of a slow walk-in].
- FPS/perf overlay reads "FPS 73 40(1%L) | GPU 96% 67°C 3090MHz 1.060V 419W 2140RPM 14983MHz | CPU 25% | LAT 11.9ms 47.1ms" through e_0063; at e_0064 GPU load ticks to 95%, LAT to 11.0/46.2ms (trivial perf fluctuation, not scene-relevant).

## e_0065 (t=151.667): HARD TRANSITION — HUD drops, letterbox appears (cutscene start)
- Between e_0064 and e_0065 the minimap and the "Aim Weapon/Greet/Antagonize/Stranger" prompt panel both disappear simultaneously.
- Black letterbox bars appear at the top and bottom of the frame (cinematic aspect ratio), consistent with a scripted cutscene/cinematic camera taking over.
- Player avatar's on-screen position and pose are continuous with the prior frame (no teleport), but framing is now clearly cinematic (tighter crop from letterboxing).
- This is the clearest hard transition in the window: control-HUD-off / letterbox-on at e_0065, t≈151.67s.

## e_0065 (t=151.667) – e_0080 (t=152.292): Cinematic interior tracking shot, empty room
- Camera follows Arthur (still viewed from behind/left-behind shoulder) moving through a narrow interior passage/threshold into a second, dimly-lit room.
- Interior details resolve as the camera moves in: a hanging round wicker/basket-shaped lantern or feed-basket from the ceiling, rough-hewn plank walls and roof beams, a wooden table/workbench with round pale objects (bowls/jugs) on it, a low stool, a small chest/crate on the floor, a second doorway further ahead with light seams around its edges (implying an exterior door, closed), coiled rope/chain hanging on the right wall, and scattered debris/papers on the floor.
- No other characters visible in this sub-span (room reads as empty).
- No HUD elements of any kind (no minimap, no prompts, no cores) — consistent with cutscene state established at e_0065.
- Perf overlay switches to "FPS 78 40(1%L) | GPU 98% 67°C 3082MHz 1.055V 415W 2139RPM 14983MHz | CPU 22% | LAT 11.0ms 46.2ms" beginning e_0071 (t=151.917) and stays fixed at that reading through e_0080; this is a step-change in the dev-overlay only, not a visual game event.

## e_0081 (t=152.333): Second NPC becomes visible
- A second figure appears in frame for the first time, positioned to the left background, partially in shadow, mostly obscured by Arthur's body/shoulder in the foreground. Visible features: pale/bald or light-haired head, gaunt facial structure, pale skin tone, appears to be leaning or positioned against the left wall near a bed frame with light-colored bedding.
- Arthur (foreground, still back to camera) has stopped moving; his stance is now static, angled slightly toward the NPC.
- Framing, letterbox, and absence of HUD are unchanged from prior sub-span (cinematic, no minimap/prompts/cores).

## e_0082 (t=152.375) – e_0087 (t=152.625): Static two-shot, NPC comes further into view
- Camera holds a static composition: Arthur in the near-foreground (back to camera, occupying center-right of frame), second NPC visible over Arthur's left shoulder in the background, partially cropped by frame edge.
- The NPC's head is at a downward/forward-tilted angle across these frames; body remains largely stationary. Only very subtle head-position shifts frame-to-frame [UNCERTAIN — could be idle animation vs. dialogue-driven head movement].
- Background room details (hanging basket-lantern, workbench with bowls, stool, closed door with light around its frame, rope/chain on right wall) remain static and consistent with previous frames — no cuts.

## e_0088 (t=152.667) – e_0096 (t=152.958): NPC identified more clearly; arm gesture begins
- Starting at e_0088, the second NPC is more clearly visible: appears to be an emaciated/frail person wearing a light-colored, loose garment (slip/nightgown-like), collarbone and upper chest visible, complexion pale, expression strained/open-mouthed (consistent with speaking) [UNCERTAIN — precise identity of this figure not determinable from framing/lighting].
- By e_0090 (t=152.75) the NPC's right arm/hand extends outward toward Arthur, palm/fingers open, held mid-gesture through the remaining frames (e_0091–e_0096). Arthur remains stationary, back three-quarter to camera, no visible reciprocal gesture.
- No further camera cuts through e_0096; letterboxing remains present; no HUD elements (minimap, cores, prompts, money/honor toasts, subtitle text) appear anywhere in this sub-span.
- Perf overlay updates once more at e_0095 (t=152.917): "FPS 75 40(1%L) | GPU 97% 67°C 3090MHz 1.060V 428W 2140RPM 14983MHz | CPU 26% | LAT 10.8ms 45.0ms" — again a dev-overlay-only change.

## Summary of exact transition timestamps in this window
- t≈151.667s (e_0065): HUD (minimap + context-prompt panel) disappears and top/bottom black letterbox bars appear simultaneously — cutscene/cinematic-camera start, implying loss of player control at or immediately before this frame.
- t≈152.333s (e_0081): second NPC first becomes visible in frame (background, left).
- t≈152.75s (e_0090): NPC's arm/hand extends toward Arthur, held through end of window (e_0096, t=152.958) — no resolution/cut visible before window ends.
- No fades-to-black, no teleport/relocation of the avatar, and no additional HUD toasts (honor/money) observed anywhere in e_0049–e_0096.
