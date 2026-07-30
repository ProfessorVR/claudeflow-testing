# Micro-log: leadup-06 (frames l_0251–l_0300, clip t=01:25.00–01:29.90)

Frame timestamp formula: t = 60 + (frameNumber-1)/10 sec (clip time).

## t=85.00 (l_0251) – t=85.30 (l_0254)
- Screen shows the RADIAL WEAPON WHEEL menu open (semi-transparent, greyscale desaturated background visible behind it). Header "R — Weapons Items". Center shows "Fist / Unarmed" selected with stat bars (Damage, Range, Fire Rate, Reload, Accuracy, Condition). Revolver icon "3" at top, unarmed fist icon highlighted orange on right, lasso/rope icon bottom-left, knife icon bottom-right.
- Background behind the wheel: a wooden cabin porch, desaturated/greyscale (game's radial-menu time-slow visual filter), minimap visible bottom-left showing player position (red icon) near a body of water.
- HUD (behind menu): FPS/GPU/CPU/LAT debug overlay top-right (benchmarking overlay, not game HUD) reading e.g. "FPS 67 36(1%) | GPU 98% 66°C 3097MHz 1.065V 428W 2141RPM 14993MHz | CPU 24% | LAT 11.7ms 51.7ms". No health/stamina/deadeye core HUD visible (obscured by wheel menu).
- No subtitles visible in this span.

## t=85.40 (l_0255) – t=85.50 (l_0256)
- Weapon wheel CLOSES; screen returns to full color, player-controlled third-person view.
- Player-avatar (Arthur Morgan) visible from behind, standing/walking toward a wooden cabin, wearing dark long coat, satchel, gunbelt with holstered revolver, brimmed hat.
- Cabin exterior: elevated porch on wooden stilts, screen door, stacked wooden crates on porch, hanging lantern, an old wagon wheel leaning against a woodpile at left, dense pine/cypress forest surrounding, overcast diffuse lighting (daytime, hazy).
- A second figure (NPC, later identified as "Sonny" per audio) is visible standing on the porch near the doorway, pale/gaunt appearance, overalls, no shirt.
- Minimap bottom-left present throughout, showing player red marker and cabin location.
- Debug overlay (FPS/GPU/CPU/LAT) remains top-right throughout this entire span.

## t=85.60 (l_0257) – t=86.00 (l_0260)
- Player walks up toward porch steps, camera player-controlled third-person over-the-shoulder, slight camera drift/adjustment as player approaches.
- At t≈86.00 (l_0260) a subtitle/dialogue prompt box appears bottom-center: **"welcome!"** — first on-screen subtitle text in this window, corresponding to NPC speech (matches transcript "I said hello" region, though exact line differs from transcript excerpt — likely a separate ambient greeting VO line).
- Sonny (NPC) stands still in doorway, arms visible, watching player.

## t=86.10 (l_0261) – t=86.30 (l_0263)
- Subtitle "welcome!" persists on screen (t=86.10–86.30).
- Player continues approaching stairs at base of porch; no interaction/context prompt yet.
- Camera remains player-controlled third-person.

## t=86.40 (l_0264)
- Subtitle "welcome!" no longer visible (cleared).
- Player standing near foot of the porch stairs.

## t=86.50 (l_0265) – t=87.10 (l_0271)
- Interaction PROMPT PANEL appears bottom-right of screen: button-prompt list —
  "Aim Weapon [icon]"
  "Greet [icon]"
  "Antagonize [icon]"
  "Stranger [icon]" (highlighted/boxed, indicating focus/selection)
- This is a standard RDR2 NPC-interaction prompt wheel-list (not the radial wheel; a vertical list), confirming player-controlled free-roam state with an interactable NPC in range.
- Sonny remains standing in cabin doorway, static idle pose, facing player.
- Debug overlay persists top-right; minimap persists bottom-left.
- At l_0269–l_0271 the "Greet" prompt icon shows a partially-filled progress/highlight bar (button hold in progress) — player appears to be holding input to trigger "Greet" or "Stranger" interaction.

## t=87.20 (l_0272) – t=87.30 (l_0273)
- Prompt panel still visible; "Greet" bar shows further fill progression (input hold continuing).
- No camera cut; still player-controlled.

## t=87.40 (l_0274)
- CAMERA CUT: interaction transitions into a semi-scripted conversation shot — camera angle shifts slightly closer/different framing (still no full letterbox bars visible). Interaction prompt panel (Aim/Greet/Antagonize/Stranger) disappears.
- First subtitle line of the Sonny dialogue exchange appears bottom-center: **"Ain't this a fine place?"** — this is the player-character line (matches transcript "Yeah, ain't this a fine place").
- This marks a control/UI-state TRANSITION: free-roam interaction prompts → dialogue/conversation-cam state.

## t=87.50 (l_0275) – t=88.90 (l_0289)
- Subtitle **"Ain't this a fine place?"** remains on screen continuously across this entire span (15 consecutive frames, ~1.5s) — camera holds a static medium shot on player's back, Sonny standing in doorway ahead, both largely motionless (idle animation micro-movement only, e.g., slight shifting weight, breathing).
- Debug overlay and minimap persist unchanged throughout.
- No letterboxing/black bars observed — this appears to be an in-engine scripted dialogue shot without full cinematic letterbox, camera positioned as a locked medium-shot behind player.
- No HUD core meters (health/stamina/deadeye) visible in any frame of this scene — consistent with a dialogue/cutscene camera framing that omits them, or they are simply not rendered in this UI state.

## t=89.00 (l_0290) – t=89.20 (l_0292)
- Subtitle clears (no text visible) — brief gap between lines.
- Camera framing unchanged; player and Sonny both static.

## t=89.30 (l_0293) – t=89.90 (l_0300)
- New subtitle appears: **"An interesting place, the best of places."** (matches transcript "an interesting place, the best of places, huh?").
- Subtitle text persists unchanged from t=89.30 through end of window (t=89.90).
- Camera remains the same static locked medium/over-the-shoulder shot; Sonny remains standing in the doorway, static idle stance, no visible gesture change; player-avatar remains stationary at base of porch steps.
- No cuts, no letterboxing, no fades observed through end of window.

## Summary of environment (constant across window)
- Setting: swampy/wooded exterior, elevated wooden cabin on stilts (Sonny's cabin, Lakay), overcast diffuse daylight, dense cypress/pine trees with hanging moss, ground covered in tall grass, an old wagon wheel and stacked crates near porch, lantern hanging from porch beam.
- NPC "Sonny": thin/gaunt build, sleeveless/bib overalls, barefoot [UNCERTAIN — feet not clearly visible], standing in the cabin doorway for the entire window, largely static/idle.
- HUD: minimap present bottom-left continuously (except when weapon wheel open, when it is still visible beneath the desaturation filter); no health/stamina/deadeye core icons visible in any frame of this window; no money counter, no honor notification, no toast visible.
- Debug/benchmark overlay (FPS/GPU/CPU/temps/latency) present top-right in every frame — this is a non-diegetic capture overlay, not game UI.

## [UNCERTAIN] notes
- Exact trigger boundary between "Greet" prompt hold (t≈87.0–87.3) and the dialogue camera cut (t=87.4) is inferred from UI-panel disappearance/subtitle appearance; the precise frame of control handoff could be ±1 frame.
- Whether the t=87.4 transition constitutes a full "cutscene" (engine-scripted, control lost) or a lighter "dialogue-lock" (partial control) cannot be determined from visuals alone — no letterbox bars appeared to confirm a hard cutscene state, but the interaction-prompt UI's disappearance and camera reframing suggest at least a temporary control change.
- Sonny's overalls appear sleeveless with no shirt underneath, but fine detail is limited by 960x540 downscale — [UNCERTAIN] on exact garment detail.
