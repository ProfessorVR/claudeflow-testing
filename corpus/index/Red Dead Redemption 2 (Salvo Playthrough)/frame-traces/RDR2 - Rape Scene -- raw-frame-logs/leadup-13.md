# Micro-log: leadup-13 (clip time 02:00.00–02:04.90)

Frames sampled: l_0601–l_0650 (10fps, frame N → t = 60 + (N-1)/10s clip time)
Window covers t = 60.0s to 64.9s (clip time), i.e. displayed clock 01:00.0–01:04.9 in this segment's own counter, but per the mapping given this equates to the 02:00–02:04.9 window referenced in the task (frame-number-to-timestamp formula applied as given).

## Observations

**t≈60.0s (l_0601) through t≈64.9s (l_0650):**
- Camera: player-controlled, third-person over-the-shoulder, standing/idle. No cuts, no letterboxing, no fades, no black frames observed across the entire sampled range.
- Player avatar (Arthur Morgan): standing in foggy/misty forest clearing facing a raised wooden cabin porch/exterior. Body oriented toward the cabin, static stance throughout — no walk-cycle animation visible across sampled frames (l_0601, 605, 610, 615, 620, 625, 630, 635, 640, 645, 650), suggesting the avatar is idling in place rather than actively moving, or movement is too subtle/slow to register at this sampling density. Right arm/hand position near hip/holster consistent across frames. Hat, duster coat, gun belt, satchel/bandolier strap all visible, unchanged.
- NPC (Sonny): not visible on screen in any sampled frame; cabin interior door is a dark/black rectangle (open doorway) with no figure visible within it.
- HUD: minimap present bottom-left throughout (circular, compass rose, red player arrow, terrain unreadable through fog). Context-prompt panel present bottom-right throughout, listing (in order, all four visible every frame): "Aim Weapon" (with a controller/L2 icon), "Greet" (grayed), "Antagonize" (grayed), "Stranger" (bright/highlighted white — appears to be the active/nearest interaction prompt). No button-prompt icons for Greet/Antagonize appear filled/active in any frame; only "Stranger" label is bright white, others dim gray.
- No health/stamina/deadeye core reticle visible in these frames (no core HUD element visible in the cropped view shown).
- No money counter, no honor notification, no UI toast/popup observed.
- No subtitle text visible on screen in any sampled frame (dialogue per transcript occurs slightly before/after this window: "You want to come in, see my collection of skulls" ends ~01:53.5–~ before this window; next line "What you stood there for" at 02:06.3 is just after this window's end).
- Environment: dense fog/mist, diffused sunbeams (God-rays) slanting through trees onto the cabin's porch roof and structure. Cabin is a raised wooden shack — visible porch railing at left, staircase leading up center, cluttered porch at right with jugs/jars, potted plants/urns, crates, a birdcage-like object, hanging chain/bell object at left post. Ground is grass/undergrowth (ferns) at bottom. Small dark structure/shed visible at far left background, partially obscured by fog. Lighting reads as overcast/misty daytime, diffuse and low-contrast (swamp/bayou setting consistent with Lakay/Bluewater Marsh).
- Top-right of frame: debug/performance telemetry overlay (FPS, GPU%, temp, clocks, CPU%, latency) present in every frame — this is a non-diegetic capture/overlay artifact, not game UI, and is constant throughout (values fluctuate slightly: FPS 67→76, GPU% 93-98%, temps 66-68°C — indicates real-time capture, not a frozen/paused state, confirming the scene is live gameplay rendering even though the avatar's pose looks static).
- No teleport/relocation of avatar observed; avatar position/orientation is essentially identical across all 10 sampled frames (only extremely minor sub-pixel shifts consistent with idle breathing/sway animation, not translation).

## [UNCERTAIN]
- Whether the avatar is truly stationary/idling for the full ~5s span or undergoing very slow forward creep toward the porch cannot be fully confirmed from 10fps sampling at 5-frame intervals alone; no clear positional delta detected between l_0601 and l_0650.
- Exact identity/state of small objects on porch (bottles vs. jars vs. skulls per Sonny's "collection of skulls" line) cannot be resolved at this resolution/fog level.
- No frame in this window shows Sonny himself; his position relative to the cabin doorway is not determinable from this segment.

## Summary of hard transitions
None observed in this window — no cutscene start/end, no fades, no control-state change, no HUD change, and no UI notification occurred between t≈60.0s and t≈64.9s (frames l_0601–l_0650). The entire span is continuous player-controlled gameplay with a static prompt HUD ("Aim Weapon / Greet / Antagonize / Stranger", with "Stranger" active).
