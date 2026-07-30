# Event Micro-Log — Segment 05 (02:37.00–02:38.96 clip time)

Frames: e_0193.jpg – e_0240.jpg (48 frames @ 24fps)
Timestamp formula: t = 149 + (frameNumber-1)/24 sec (clip-relative internal numbering per instructions)

## Observation

All 48 frames in this window (e_0193 through e_0240, covering the full ~2-second span) are **entirely black frames**. No scene geometry, character models, environment, HUD elements (minimap, health/stamina/deadeye cores, money counter, honor notification, button prompts), subtitle text, or UI toasts are visible in any frame.

The only persistent element across every frame is a small performance-monitoring overlay in the top-right corner (third-party overlay, e.g. RTSS/afterburner-style), reading approximately:
`FPS 80  40 (1%L) | GPU 35-44% 61-63°C 3195-3225MHz 1.065-1.090V 432W 2139-2142RPM 14983MHz | CPU 20-23% | LAT 0.1ms 43.5ms`

Minor fluctuations in these overlay values (GPU %, clock MHz, CPU %) are visible frame-to-frame (e.g., GPU 35% at e_0193 rising to 44% by e_0210, then settling ~43% by e_0230-0240; CPU usage drifting from 23% down to 20%), confirming the frames are sequential/distinct captures and not a static duplicated image, but the game-rendered content itself shows no visible output — full black frame.

No letterboxing bars, fade gradient, vignette, or distortion effect is discernible — the frame is uniform black corner-to-corner beneath the overlay, consistent with either (a) a hard cut to black / black hold-frame within a cutscene, or (b) an extended fade-to-black transition whose midpoint holds long enough to span this entire ~2-second sampling window. [UNCERTAIN: cannot distinguish "cinematic black hold" from "fade in progress" from static single frames without adjacent-segment comparison.]

No player-controlled camera movement, no NPC (Sonny) visible, no avatar visible, no environmental details (cabin, skulls, bed, table, lighting) visible in this window — all obscured by black screen.

No subtitle text appears on any frame in this window, despite the transcript indicating dialogue at 02:38.8 ("Don't you hate old Sonny now") falling within/near this window — subtitles, if present in-game, are not rendering as visible text in these frames, OR the black screen indicates the audio is playing over a black transition rather than active subtitled gameplay/cutscene footage. [UNCERTAIN]

## Chronological table

| Frame | Timestamp (approx, clip-relative) | Content |
|---|---|---|
| e_0193 | ~02:37.00 | Black frame; overlay GPU 35%, 63°C |
| e_0194–e_0199 | ~02:37.04–02:37.25 | Black frame; overlay GPU 35%, values stable |
| e_0200 | ~02:37.29 | Black frame; overlay GPU 35% |
| e_0201–e_0209 | ~02:37.33–02:37.67 | Black frame (not individually re-inspected beyond sampled set; visually contiguous black based on bracketing frames) |
| e_0210 | ~02:37.71 | Black frame; overlay GPU 44%, 61°C |
| e_0211–e_0219 | ~02:37.75–02:38.08 | Black frame (bracketed, presumed contiguous black) |
| e_0220 | ~02:38.13 | Black frame; overlay GPU 43%, 61°C |
| e_0221–e_0229 | ~02:38.17–02:38.50 | Black frame (bracketed, presumed contiguous black) |
| e_0230 | ~02:38.54 | Black frame; overlay GPU 43%, 62°C |
| e_0231–e_0239 | ~02:38.58–02:38.92 | Black frame (bracketed, presumed contiguous black) |
| e_0240 | ~02:38.96 | Black frame; overlay GPU 43%, 62°C, identical to e_0230 |

[UNCERTAIN: frames e_0201–0209, e_0211–0219, e_0221–0229, e_0231–0239 were not individually opened; classification as "black" is inferred from bracketing sampled frames (e_0193/0194-0200/0210/0220/0230/0240) which were all uniformly black with only the performance overlay changing. No visual break was evident between sampled points, but a brief non-black frame within an unsampled gap cannot be fully ruled out from this pass alone.]

## Transitions

- No cutscene start/end markers (letterbox appearance/disappearance) observed — screen is black throughout, so no letterbox transition is detectable against it.
- No control-loss/control-regain indicator observable (no HUD present to confirm control state).
- No fade-in or fade-out gradient motion observed between sampled frames — black appears constant/held rather than actively fading, based on available samples.
- No HUD elements appear or disappear (none are present at any point in this window).
- No UI toast, notification, or button prompt appears.
