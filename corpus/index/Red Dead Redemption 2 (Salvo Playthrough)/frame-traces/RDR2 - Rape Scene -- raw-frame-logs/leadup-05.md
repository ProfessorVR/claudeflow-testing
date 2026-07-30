# Lead-up Micro-Log 05 — 01:20.00–01:24.90 (clip time)

Frames l_0201–l_0250, 10fps, t = 60 + (frameNumber-1)/10 sec. This window corresponds to clip range 81.0s–84.9s.

## Persistent state across whole window
- Camera: player-controlled third-person, standard over-the-shoulder gameplay framing, no letterbox bars, no fades, no cinematic camera cuts observed anywhere in this window.
- HUD: minimap visible bottom-left throughout (circular, showing player red arrow + white cabin/building blip); no visible health/stamina/deadeye core widgets rendered in these frames (likely faded out from inactivity — standard RDR2 behavior); no money counter change observed; no honor notification observed; "Stranger" tag visible top-right of screen in frames l_0201–l_0209 (mission/encounter tag), then disappears from l_0210 onward.
- Debug/perf overlay present top-right of every frame (FPS, GPU%, temp, clocks, CPU%, latency) — this is a benchmark/dev overlay, not a game HUD element; values fluctuate normally (FPS 65-67, GPU 95-98%, CPU 22-30%).
- Environment: heavily fogged/misty swamp forest exterior, overcast diffuse daylight (daytime, low contrast, greenish-grey haze consistent with Lemoyne bayou). Weathered wooden cabin (Sonny's cabin) center-frame, elevated on stilts/piers, tin roof, open porch with support posts, stacked wooden crates flanking a central doorway, various jugs/pots/bottles on a table to the right of the door, a smaller outbuilding/shed to the left rear, a wagon wheel leaning against the cabin's left support post, wooden barrels near the porch steps.
- NPC (young woman, presumed Sonny's captive/"pet") stands motionless in the cabin's doorway/porch threshold throughout the entire window, in a light-colored sleeveless top, arms visibly at sides, facing outward toward the player — no animation change, no movement, no gesture change observed frame-to-frame.
- Player character (Arthur): dark long coat/duster, hat, satchel/bandolier visible on torso, walking on foot toward the cabin across a grassy/muddy clearing; player's horse (black-and-white tobiano/pinto with saddle pack) visible at left edge of frame in early frames, stationary, tied/left behind.

## Chronological log

**t=60.0–60.9s (l_0201–l_0210):** Player standing near/at horse at left edge of frame, cabin ~15-20m ahead. Player takes a few steps forward and slightly right, closing distance to cabin. NPC visible standing in doorway the whole time, static. Camera slowly pans/tracks with player movement (player-controlled, no cuts). "Stranger" tag top-right visible through l_0209, gone by l_0210 [marks encounter-tag fade, not a hard cutscene transition].

**t=61.0–61.9s (l_0211–l_0220):** Player continues walking forward across the clearing, gait is a normal walk cycle, arms swinging naturally, gun holster/knife sheath visible at belt. Horse recedes from frame as player advances; by l_0217-l_0220 horse is at far edge/partially cropped. No subtitle text yet in this stretch. NPC still static in doorway.

**t=62.0–62.9s (l_0221–l_0230):** Player closes further on cabin, now roughly 8-10m out. At l_0222 (t≈62.1s) a subtitle box appears at bottom-center: **"I said hello..."** — this subtitle persists continuously from l_0222 through l_0250 (through t=64.9s), i.e., no change in on-screen subtitle text for the remainder of the logged window. This aligns with the transcript's "I said hello" cue at 01:21.6, appearing slightly after in this frame numbering. No camera cut accompanies the subtitle's appearance — it overlays the ongoing player-controlled shot.

**t=63.0–63.9s (l_0231–l_0240):** Player continues approach, now near the porch steps/lower stairs area at cabin's left side, angling to camera-right toward the doorway. Walking animation continues uninterrupted (no signs of a forced/scripted walk lock; still appears player-directed). NPC unchanged in doorway. Subtitle "I said hello..." remains fixed on screen.

**t=64.0–64.9s (l_0241–l_0250):** Player reaches the base of the porch stairs, standing close to the steps/crates near the cabin's left support post (l_0241–l_0245). Subtitle "I said hello..." still displayed through l_0245.
- **Hard transition at l_0246 (t≈64.5s):** Screen shifts to a **radial weapon/item wheel HUD overlay** — background desaturates to greyscale and blurs/darkens (the wheel-select dimming effect), with "R" button prompt and "WEAPONS ITEMS" header at top, revolver icon (ammo "3") at top of the wheel, "Fist / Unarmed" selected/highlighted at center with stat bars (Damage, Range, Fire Rate, Reload, Accuracy, Condition), a fist icon highlighted orange at right slot, a knife icon bottom-right, a lasso/rope icon bottom-left. Bottom-center text reads **"welcome!"** [UNCERTAIN — likely a weapon-wheel radial-menu label/tooltip, not a subtitle of dialogue].
- This weapon-wheel overlay persists identically from l_0246 through l_0250 (t=64.5–64.9s, end of window), with the background cabin/porch scene visible but static/frozen-looking beneath the greyscale wheel overlay (game appears paused or player has held the weapon-select input, freezing gameplay motion — consistent with RDR2's radial-menu time-slow/pause behavior).
- Minimap in these frames shows the player marker with map rotated/reoriented differently than prior frames [reflects the same time-dilation pause state].

## Flagged ambiguities
- [UNCERTAIN] Exact reason for "Stranger" tag disappearing between l_0209 and l_0210 — could be UI fade timing unrelated to any state change.
- [UNCERTAIN] Bottom text "welcome!" under the weapon wheel — unclear if this is a UI tooltip/label (e.g., naming a favorites-wheel slot) or something else; not dialogue-subtitle styled the same as "I said hello...".
- No control-loss/cutscene-letterbox transition observed in this window — the only hard interruption to normal player-controlled gameplay is the weapon-wheel invocation at l_0246 (t≈64.5s), which is a player-initiated pause-menu-style overlay, not a scripted cutscene.
