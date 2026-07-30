# Micro-log — ctx-post (03:45.00–04:24.00 clip time), 1fps, 960x540

Frame→time mapping: t = 225 + (frameNumber-1) seconds (window covers t=225s [03:45] to t=264s [04:24]).

## q_001 (t=225.0s / 03:45.0)
Player-controlled third-person camera, avatar (Arthur) walking on foot through foggy grassland/swamp, moving away from camera toward a saddled horse standing ~15m ahead. Cabin/shack structures visible far background-left, partially obscured by fog. Overcast/foggy weather, dim grey lighting, dusk/dawn ambiguous [UNCERTAIN]. HUD: minimap bottom-left (circular, red trail line visible, red dots/markers on rim), three cores top-left of minimap (health red-full, stamina appears partially depleted/orange, dead-eye third core faded/empty-looking), no money counter visible, no honor notification. On-screen tutorial toast top-left: "You can rest by holding [!]. Your Cores will not drain while resting, and will refill slightly if they are very low." Top-right debug/perf overlay (FPS/GPU/CPU/LAT stats — not game UI, appears to be a benchmark overlay). No letterboxing — full HUD visible, player has control.

## q_002–q_010 (t=226–234s / 03:46–03:54)
Continuous player-controlled walk cycle, normal gait, Arthur walking toward the horse. Camera follows at consistent over-the-shoulder distance/angle, slight lateral drift consistent with player stick input. Horse remains stationary, facing left, saddled with bedroll. Tutorial toast persists unchanged through q_009. Cores unchanged (health full, stamina depleted core, third core faint). No cuts, no letterbox, no subtitles. Environment: dead/burnt tree stump right-of-frame throughout, fog thick, silhouetted structures far left background remain static in frame (indicating slow linear approach). By q_010, HUD gains two new prompt lines bottom-right: "Horse Weapons [Tab]" and "Horse Cargo [B]" plus a compass/waypoint icon "Nebula" bottom-right — indicating proximity prompt to horse; player is now standing directly adjacent/behind the horse.

## q_011–q_012 (t=235–236s / 03:55–03:56)
Player standing beside horse; "Horse Weapons," "Horse Cargo," and "Nebula" (location name) prompts remain on screen. Tutorial toast still present. No mount animation visible yet in these two frames.

## q_013 (t=237s / 03:57)
Player now mounted on horse (avatar seated in saddle, camera raised to mounted height). New HUD state: four cores now visible (health, stamina, dead-eye, and a 4th "cores" icon appears — likely horse stamina/health core added). Tutorial toast still present ("You can rest by holding..."). "Horse Weapons/Cargo" prompts gone.

## q_014–q_016 (t=238–240s / 03:58–04:00)
Player riding horse, walking gait, facing away from camera down through the grass toward the distant structures. Camera stable, player-controlled. Same 4-core HUD. Tutorial toast persists into q_015; gone by q_016 (toast disappeared — first HUD-content change/removal, approx t=240s / 04:00).

## q_017 (t=241s / 04:01) — TRANSITION: fade to black
Screen mostly solid black except perf overlay (FPS/GPU/CPU stats) remaining visible top-right and a visible mouse cursor arrow near center of screen. No player HUD elements (health/stamina cores, minimap, prompts) visible. This indicates either a loading screen or a UI/menu transition — the mouse cursor strongly suggests a menu/pause-map screen is opening rather than a cinematic fade. **Transition marker: ~t=241s (04:01) — HUD elements (cores/minimap) disappear; cursor appears.**

## q_018–q_026 (t=242–250s / 04:02–04:10) — MAP SCREEN OPEN
Full-screen world map UI displayed (parchment-style RDR2 map), showing region labels "Bluewater Marsh," "Lagras," "Lakay," "Bayou Nwa," "Saint Denis," "Sisika Penitentiary." A location pin/red marker is visible near "Lakay" (small red icon south of the Lakay label) consistent across all these frames — likely the player's current/waypoint position. Bottom-of-screen prompts read "Add Marker [Z]," "Index [Tab/other]," "Waypoint [Enter]," "Back [Esc]" in q_018–q_022; by q_023 "Remove Marker" replaces "Add Marker" (indicating player placed a waypoint marker at that point, ~t=247s/04:07), and by q_026 the "Back" prompt/Esc icon disappears from bottom-right while "Index"/"Waypoint" prompts remain — map view persists with slight panning/zoom differences frame to frame (cursor/map is being scrolled). No subtitles, no cinematic bars. This is a paused/menu map screen — gameplay time is separate from real elapsed session time.
- **t≈247s (04:07): waypoint marker placed near Lakay** ("Add Marker" → "Remove Marker" label change).

## q_027 (t=251s / 04:11) — TRANSITION: map closes, motion blur
Screen returns to in-world gameplay view but frame is heavily motion-blurred (radial/directional blur consistent with a fast camera whip or fast-forward/warp transition), showing player on horseback riding away from camera in fog. HUD partially visible/faded: three cores (dimmed/blurred), tutorial toast text visible but blurred/illegible-partial ("You can rest by holding...", cut off by blur), minimap present but blurred. This is the map-close transition frame. **Transition marker: ~t=251s (04:11) — map UI closes, gameplay resumes with blur artifact.**

## q_028–q_040 (t=252–264s / 04:12–04:24)
Player-controlled, mounted riding (walk/trot gait) continuing away from the Lakay area along a dirt path, then onto a wooden plank bridge/boardwalk, heading toward Saint Denis (industrial smokestack with smoke plume visible in background, church spire visible distantly by q_036–q_040). Camera stable third-person mounted view, no cuts. 
- HUD: standard 3-core display returns (q_028 onward); by q_030 a new toast appears top-left: "Your Stamina Core is empty. Your Stamina will regenerate slower. Sleep or eat food such as meats and canned food to refill your Stamina Core." This toast persists unchanged through q_031–q_040 (t=253–264s), indicating stamina core fully depleted and no replenishment during this window.
- Minimap (bottom-left) shows a red road/path line and red dot marker consistent with the waypoint set during the map screen; minimap orientation shifts as the horse turns to follow the road/bridge.
- Environment: swamp/marsh terrain gives way to a wooden boardwalk bridge (q_032–q_040) with railings, leading toward small shack/shed clusters and eventually visible Saint Denis skyline elements (chimney/smokestack with smoke, distant spire). Lighting remains flat, overcast/foggy throughout; no time-of-day change apparent.
- No further cuts, fades, letterboxing, or subtitle text observed through q_040 (final frame, t=264s / 04:24).

## Summary of HUD/core states
- Health core: full (red) throughout all frames where visible.
- Stamina core: shown partially depleted early (q_001–q_016), later flagged as fully "empty" via toast from q_030 onward.
- Dead-eye core: present, appears low/faded throughout.
- Fourth "core" icon appears once mounted (q_013 onward) — likely horse-related indicator.
- No money counter, no honor notification, no button-prompt combat/interaction icons other than horse-mount prompts (q_010–q_012) and map-menu prompts (q_018–q_026).
- No dialogue subtitles appear anywhere in this window (consistent with the transcript's silence in this stretch aside from earlier ambient hallucination loops, which are outside this window).

## Ambiguous/uncertain items
- [UNCERTAIN] Exact time-of-day (dawn/dusk/overcast day) cannot be determined from lighting alone.
- [UNCERTAIN] Whether q_017's black frame is a menu-open transition or a brief loading hitch — inferred as menu-open due to visible mouse cursor and subsequent full map UI.
- [UNCERTAIN] The precise nature of the 4th HUD core icon appearing at q_013 (assumed horse-related; not confirmed by visible icon design at this resolution).
