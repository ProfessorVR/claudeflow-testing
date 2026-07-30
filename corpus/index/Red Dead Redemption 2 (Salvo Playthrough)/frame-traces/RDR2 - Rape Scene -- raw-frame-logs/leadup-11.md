# Micro-log: leadup-11 (clip time 01:50.00–01:54.90)

Frame timestamp formula: t = 60 + (frameNumber-1)/10 sec (clip time).

## 01:50.0 (frame 501)
- Player-controlled third-person camera, gameplay HUD active: minimap (bottom-left, circular, compass markers), context-prompt panel bottom-right reading "Aim Weapon [LT icon]", "Greet [—]", "Antagonize [—]", "Stranger [A icon]".
- Player-character (Arthur) stands facing the cabin porch/steps, back to camera, hat on, satchel/strap visible on back, holstered weapon at hip. No weapon drawn.
- NPC (Sonny) stands upright at the cabin doorway/porch interior, leaning against door frame, shirtless/sleeveless, arms loose at sides. Static idle posture, no visible gesture.
- Environment: foggy/hazy swamp cabin exterior, wooden porch with support posts, hanging lantern (unlit) on porch beam, stacked wooden crates, barrels, jugs on porch railing to the right. Overcast/foggy lighting, daytime, heavy atmospheric haze.
- No letterboxing (full 16:9 gameplay frame, no black bars). No subtitle text on screen at this instant.
- Debug/perf overlay top of screen (FPS, GPU%, temp, clocks, CPU%, latency) — not part of game HUD, present throughout entire clip.

## 01:50.1–01:50.3 (frames 502–504)
- Player character remains stationary in same position/pose facing porch.
- Frame 503 (01:50.2): subtitle/dialogue box appears bottom-center: **"Anyway..."** — first subtitle text of this segment.
- Frame 504 onward: subtitle "Anyway..." persists on screen, unchanged text, through frame ~520.
- Sonny NPC holds same static leaning idle pose at doorway throughout.
- HUD prompts (Aim Weapon/Greet/Antagonize/Stranger) remain visible and unchanged.

## 01:50.4–01:52.0 (frames 505–520)
- No camera cuts; camera remains in the same player-controlled third-person framing, slight micro-jitter typical of idle/breathing sway, but no directional movement or repositioning of the player character.
- Player character does not walk, turn, or otherwise animate — held in idle standing pose facing the cabin steps/porch.
- Sonny remains in fixed leaning idle stance at the doorway; no gesture, no walk cycle, no head turn observed across these frames.
- Subtitle "Anyway..." remains displayed continuously from frame 503 through approximately frame 520 (i.e., through ~01:52.0).
- Minimap content unchanged (player position marker roughly centered, red compass tick visible).
- No health/stamina/deadeye core reticle visible on screen (cores not shown in this HUD state — likely because no weapon is drawn/aimed).
- No money counter, no honor notification, no UI toast observed.
- Performance overlay values fluctuate slightly (FPS 81→93→97→78→76→74; GPU 96%→93%→97%→94%→98%; temps 66–68°C) — non-diegetic, no narrative significance.

## 01:52.1 (frame ~521) through 01:54.0 (frame ~540)
- Scene composition unchanged: same static two-shot of player character's back at cabin steps and Sonny at doorway.
- Subtitle box no longer visible in frames 521 and 525 (gap between "Anyway..." and next line) — screen has no subtitle text in this stretch [UNCERTAIN — exact frame subtitle cleared, sampled at 521/525/530/535 showed no text].
- No control-loss/cutscene indicators (no letterbox bars, no fade, no blur) — this remains standard third-person gameplay/dialogue-idle framing throughout, consistent with an NPC conversation triggered in open world (not a scripted cinematic with black bars).
- Player and Sonny both remain in fixed idle poses; no locomotion, no cuts.

## 01:54.0 (frame 540)
- New subtitle appears bottom-center: **"You wanna come in, see my collection of skulls?"**
- This is Sonny's line (matches transcript "You want to come in, see my collection of skulls" at 01:53.5, slight timing offset from sampling).
- Sonny's pose still static leaning idle at doorway; no visible mouth/gesture animation change detected at this sampling resolution.

## 01:54.1–01:54.9 (frames 541–550)
- Subtitle "You wanna come in, see my collection of skulls?" persists unchanged through frame 545 and 550, the end of this segment window.
- Frame 550: same static composition — player character back-facing camera at base of porch steps, Sonny leaning at doorway to the right, HUD prompts unchanged (Aim Weapon/Greet/Antagonize/Stranger), minimap unchanged, no letterboxing, no fades, no cuts.
- No control loss/regain observed in this window; player retains standard gameplay HUD and stranger-interaction prompts throughout.

## Summary of state at end of window (01:54.9)
- Camera: player-controlled third-person, static framing (player not moving).
- HUD: full gameplay HUD present (minimap, context prompts, no core reticles, no money/honor toasts).
- Subtitle: "You wanna come in, see my collection of skulls?" displayed.
- No cutscene transition (no letterbox, fade, or cut) occurred within this specific window; the encounter is still in open-world dialogue-idle state as Sonny invites the player character inside.
