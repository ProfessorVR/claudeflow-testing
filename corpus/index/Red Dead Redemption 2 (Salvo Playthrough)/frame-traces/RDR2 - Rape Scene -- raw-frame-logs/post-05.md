# Micro-log: ctx-post window 06:25.00–07:04.00 (frames q_161–q_200)

Frame-to-time mapping: t = 225 + (frameNumber-1) seconds. q_161 = 385s... 

Note: the task header states the window is 06:25.00–07:04.00 clip time, but the formula given (t=225+(N-1)) produces much larger values (e.g., q_161 → 385s = 6:25). Using the formula literally: q_161=385s(6:25.0), q_162=386s(6:26.0), ... q_200=424s(7:04.0). This aligns with the stated window, so frame N corresponds to (385+(N-161)) seconds = 6:25 + (N-161) sec. Timestamps below use this mapping.

## Overview
This entire window is post-cutscene, player-controlled, free-roam exploration inside the Sonny/O'Driscoll cabin (interior). No cutscene markers, no letterboxing, no black frames, no fades occur anywhere in this window — control is already restored at the start of frame q_161 and remains with the player throughout.

## HUD state (constant throughout window)
- Top-left onscreen tutorial toast, present in every frame, unchanging text: "You can rest by holding [!]. Your Cores will not drain while resting, and will refill slightly if they are very low." (system tutorial popup, not scene-specific)
- Top-right: debug/perf overlay (FPS, GPU%, temp, clocks, CPU%, LAT) — not a game HUD element, appears to be a recording overlay, present every frame.
- Minimap: circular, bottom-left, present every frame. Player marker (arrow) visible; interior map view of cabin. No red/hostile dots. No enemies or NPCs shown on minimap the entire window — Sonny is NOT visible on minimap at any point in this segment.
- Core meters (health/stamina/dead-eye) bottom-left above minimap: three core icons visible in early frames (q_161–q_178) each appearing DEPLETED/hollow (rings drawn but not filled/lit — icons appear dim/grey rather than glowing), consistent with post-exertion state. By q_181–q_200 the cores appear to show partial fill (small amount of color visible in the leftmost heart core in some frames, e.g. q_199-200 show a reddish glint) [UNCERTAIN — hard to confirm exact fill fraction at this resolution].
- No health/stamina drain visible, no damage flashes, no honor notification, no money-counter change, no button-prompt HUD element except contextual world-interaction prompts (see below).
- Contextual interaction prompts (bottom-right) cycle as player looks at/approaches objects:
  - q_165: "Pick up [prompt] / Stranger" (looking at cabinet/dresser area)
  - q_166–167: "Search Cabinet [prompt] / Cabinet"
  - q_168–170: "Pick up [prompt] / Stranger" then "Search Cabinet [prompt] / Cabinet"
  - q_171: "Search Cabinet [prompt] / Cabinet"
  - q_174: cabinet door opens fully, shelved contents (tins, jars, small boxes) visible; prompt reads "Close Cabinet [prompt] / Search Drawer [prompt] / Cabinet"
  - q_175: cabinet interior close-up, same prompts
  - q_176: prompt "Close Drawer [prompt] / Cabinet" — a drawer at the base of the cabinet has been opened
  - q_177: drawer open, player's view suddenly shows a bright white/grey blur/haze filling most of right frame — a soft, out-of-focus light bloom effect (likely a lit lantern or window glare catching the camera at close range), no letterboxing, transient one-frame artifact — [UNCERTAIN: could be a light source flare or a motion-blur artifact from rapid camera pan]
  - q_178–182: "Close Drawer [prompt] / Cabinet" continues; drawer visibly open at cabinet base with jars/tins/folded cloth contents visible
  - q_183–184: prompt changes to "Pick up [prompt] / Stranger" — player has moved to a different shelf area (fireplace mantel with skull, bottles)
  - q_190–191: "Take [prompt] / Valerian Root" — player facing fireplace mantel shelf with bottles and a skull, prompt indicates a lootable item "Valerian Root" on the shelf
  - q_192–194: same "Take / Valerian Root" prompt persists as player stands facing the mantel
  - q_197: item icon "Valerian Root" appears as a floating world-space label with icon (right-mid frame), indicating the item has been highlighted/tagged, player's arm is raised toward the shelf (interacting/picking up animation)
  - q_198–200: no prompt visible; player has turned away from the shelf and moved toward a doorway; item-pickup interaction appears complete

## Environment / props detail
- Interior is a dim, dusty one-room cabin with rough plank walls, exposed beams, a stone/brick fireplace built into one wall, hanging chains, coiled rope, animal traps (bear-trap-like devices) hung on the wall, ceramic jugs/urns, a wooden barrel, a tall wooden apothecary-style cabinet/hutch with open shelving (containing small tins, jars, folded cloth/papers, a soap-labeled box), a curtained window (right side, daylight-grey light diffusing through), a human/animal skull sitting atop the cabinet and another skull on the fireplace mantel, several glass bottles (liquor/tonic-shaped) lined on the mantel shelf, loose papers/notes scattered on the floor near the cabinet.
- Lighting: dim, grey, overcast/interior ambient light; no strong directional key light; consistent overcast daylight through the window throughout — no time-of-day change observed.
- No blood, no visible props tied specifically to the preceding scene (no bed shown in this frame range); no other NPCs (Sonny is off-screen / not encountered) appear anywhere in this window.

## Player/camera behavior
- Camera is player-controlled over-the-shoulder third person throughout; no cinematic angles, no forced camera pans, no cuts.
- Player animation: walking/idle turning, crouched slightly while rummaging through cabinet drawer (q_173–176), reaching/interacting animation at shelf (q_197), otherwise normal idle-standing with dual long-guns visible on the character's back (rifle + shotgun/carbine slung).
- No gait anomalies, no stumbling, no combat stance, weapon not drawn/aimed.
- Player moves from cabinet/dresser area (west side of room) toward the fireplace/mantel (east side), then toward a doorway (q_198–200), suggesting the player is exiting the cabin.

## Chronological beat list (approximate, 1fps sampling)
- 06:25–06:29 (q_161–165): Player near a tall dresser/nightstand area in a dim back-room corner; skull and rope visible; contextual prompts "Pick up/Stranger" appear.
- 06:30–06:32 (q_166–167): Player at a window-side cabinet, "Search Cabinet" prompt.
- 06:33–06:36 (q_168–170): Player crouches/reaches near cabinet, alternating "Pick up/Stranger" and "Search Cabinet" prompts; picks up small object(s) [UNCERTAIN exact item].
- 06:37–06:38 (q_171–172): Player moves to a wooden apothecary cabinet with skull-topped decor, "Search Cabinet" prompt persists.
- 06:39 (q_173): Player opens cabinet door — interior shelving with cloth and boxes revealed; prompt "Close Cabinet/Search Drawer/Cabinet".
- 06:40 (q_174): Full cabinet interior visible — tins, jars, small boxes on shelves.
- 06:41 (q_175): Camera close on shelf contents.
- 06:42 (q_176): Drawer at cabinet base opened; prompt "Close Drawer/Cabinet".
- 06:43 (q_177): Transient bright blur/haze fills right portion of frame — brief light-bloom/flare artifact, one frame only [UNCERTAIN cause: lens flare vs. motion blur].
- 06:44–06:48 (q_178–182): Drawer remains open; player lingers, examining drawer contents (jars, tins, folded cloth); prompt "Close Drawer/Cabinet" persists.
- 06:49–06:50 (q_183–184): Player turns toward the stone fireplace/mantel; prompt shifts to "Pick up/Stranger".
- 06:51–06:53 (q_185–187): Player approaches mantel with skull and bottles; no prompt visible in q_185–186, general browsing.
- 06:54–06:56 (q_188–190): Player stands directly in front of mantel shelf; "Take/Valerian Root" prompt appears at q_190.
- 06:57–06:59 (q_191–193): Prompt "Take/Valerian Root" persists; player stationary, facing shelf.
- 07:00 (q_194): Same prompt, player still facing shelf.
- 07:01 (q_195): Player very close to shelf, prompt "Take/Valerian Root" continues, no world-space icon yet.
- 07:02 (q_196): Player leans/reaches, hand near bottles.
- 07:03 (q_197): World-space floating icon labeled "Valerian Root" appears — pickup animation (arm raised) in progress.
- 07:04 (q_198–200): Player turns away from shelf/mantel, moves toward a plank door on the right side of the room (interaction prompt no longer visible), heading toward exit; table with a basin/bowl and boxes visible near the door.

## Subtitles
No subtitle text appears in any frame in this window (no dialogue captions on-screen).

## Notifications / toasts
Only the persistent system tutorial toast about resting via holding [!] (identical text, present in all 40 frames) and contextual world-interaction prompts described above. No honor, no money, no achievement/challenge toasts.

## Hard transitions
None observed within this window — no cutscene start/end, no fade in/out, no control loss/regain, no letterboxing, no teleport. The single anomalous frame is the transient light-blur/haze at q_177 (~06:43), flagged as [UNCERTAIN] (likely benign lens-flare/motion-blur artifact rather than a scripted transition).
