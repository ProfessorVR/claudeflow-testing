# Event Micro-Log — Window 02:51.00–02:52.96 (frames e_0529–e_0576)

Frame time formula: t = 149 + (frameNumber-1)/24 s (clip time offset per task spec; here reported as window-relative mm:ss for readability, computed from that formula).

## Overview of window
This entire 48-frame window (e_0529 → e_0576, ~2.0s at 24fps) is a SINGLE continuous cinematic (non-interactive) shot. No cuts, no fades, no black frames, and no camera movement of any significance were detected — the frame is essentially static across the whole span, consistent with a held cinematic close-up during dialogue.

## Composition (constant across all 48 frames)
- **Camera**: first-person POV, low angle looking up, fisheye/vignette lens distortion; framing suggests the camera is at ground level looking up at Sonny standing over it. Camera is cinematic (not player-controlled) — no crosshair, no player-movement HUD elements.
- **Color/vision effect**: entire frame has a heavy purple/mauve color-grade overlay with a warm sepia/yellow tint on the lit subject (Sonny) — consistent with a stylized "vision" or altered-perception filter, not natural lighting. Vignette (dark corners) present throughout.
- **NPC (Sonny)**: standing, facing camera/down toward it, both arms outstretched forward/downward toward the viewer (reaching gesture), mouth open, mid-speech animation (jaw/lip movement varies slightly frame to frame — see below). Wearing overalls with straps, bare chest visible under unclasped overall front, red/ginger hair. His posture and arm position remain essentially fixed (reaching pose held) across the whole window; only facial/mouth articulation changes frame to frame.
- **Environment**: interior of a wooden structure (visible cross-beams/rafters overhead, slatted wood ceiling), a small pale rectangular object (possibly a window with light or a framed picture) visible over Sonny's left shoulder (screen-left) throughout. Dark, dim lighting consistent with a rustic cabin/shed interior.
- **Player avatar**: no player body visible; POV is a fixed observer position (ground-level, looking up), not the player's normal standing eye-height perspective.

## HUD state (constant across all 48 frames)
- **Minimap**: ABSENT.
- **Health/Stamina/Dead-eye cores**: ABSENT — no core UI visible at all.
- **Money counter**: ABSENT.
- **Honor notification**: none observed.
- **Button prompts**: none visible.
- **UI toasts**: none.
- **Subtitle**: present and IDENTICAL across all 48 frames — exact text:
  > "but it was quite a tussle, I tell you."
  (Rendered in a dark semi-transparent subtitle box, bottom-left-of-center of frame.)
- **Top-right corner overlay**: a performance/diagnostic HUD (FPS, GPU%, temp, clocks, voltage, wattage, RPM, CPU%, LAT ms) is visible in every frame — this is a system monitoring overlay (e.g., RTSS/afterburner-style), not a game HUD element, and is constant/unrelated to game state. Values tick minutely frame-to-frame (FPS 88–92, GPU 96%, CPU 22–24%, etc.) but carry no diagnostic meaning for the scene itself.
- **Letterboxing**: no distinct black cinematic bars are visible separate from the vignette; the frame is not classically letterboxed (no hard black bars top/bottom) — the darkened corners are a vignette/lens effect rather than aspect-ratio bars. [UNCERTAIN: could be a very subtle/soft letterbox blended into the vignette, not clearly distinguishable at this resolution.]

## Frame-by-frame notes
- **e_0529 (~02:51.00)**: Sonny mid-sentence, mouth open in an "o"/wide shape, arms extended, subtitle "but it was quite a tussle, I tell you." visible. FPS 92.
- **e_0530–0533 (~02:51.04–02:51.17)**: Near-identical pose; minor jaw closing/reopening consistent with speech articulation. No camera movement detected.
- **e_0534–0540 (~02:51.21–02:51.46)**: Continued talking animation — mouth cycles through open/closed shapes; head appears to tilt very slightly frame to frame (micro head-bob, consistent with idle/talk animation, not a deliberate camera move). Hand holding an object [UNCERTAIN — small dark object in Sonny's right hand, screen-left, not clearly identifiable, possibly a knife or tool] remains raised.
- **e_0541–0550 (~02:51.50–02:51.88)**: Same held shot; Sonny's facial expression cycles between open-mouth speech shapes and brief closed-mouth moments; no environmental change; ceiling beams and pale object over shoulder remain constant reference points confirming camera has NOT moved.
- **e_0551–0560 (~02:51.92–02:52.29)**: Continued identical framing; subtitle text unchanged; hair color reads as reddish under the tint. Minor lighting/exposure flicker frame-to-frame [UNCERTAIN — could be JPEG compression artifact rather than actual in-engine flicker].
- **e_0561–0570 (~02:52.33–02:52.71)**: Same composition persists; performance-overlay FPS ticks from 88→89; no gameplay-relevant HUD changes. Sonny's mouth motion suggests continued speech though the transcribed line "but it was quite a tussle, I tell you" would have already been spoken per the whisper timestamp (02:46.0–02:52.6) — by the end of this range the audio line may be concluding or overlapping with the next line ("quite a tussle, my pet" at 02:53.1, just after this window closes). [UNCERTAIN: exact word/frame alignment between subtitle box and audio not verifiable from stills alone.]
- **e_0571–0576 (~02:52.75–02:52.96)**: Final frames of the window; framing, pose, and subtitle remain unchanged from the start of the window. No transition, fade, or cut occurs before the window ends.

## Transitions
- **No cutscene start/end boundary observed within this window** — the entire window is inside an already-active cinematic (letterbox/vignette state was already established before e_0529 and persists through e_0576).
- **No control loss/regain events observed** (no player HUD present at any point to indicate a gameplay state exists in this window).
- **No fades (to/from black) observed.**
- **No teleport/relocation of avatar observed.**
- **No HUD state changes observed** (HUD is uniformly absent throughout except the constant system-performance overlay).
- **No UI toast/notification events observed.**

## Flags
- [UNCERTAIN] Whether the dark frame corners constitute an actual letterbox/aspect-mask versus a lens vignette effect — visually they read as vignette, not hard bars.
- [UNCERTAIN] Identity of the small object in Sonny's raised hand (screen-left) — not resolvable at this resolution/compression.
- [UNCERTAIN] Minor frame-to-frame lighting flicker — likely compression artifact, not a scripted in-game effect.
- [UNCERTAIN] Precise word-to-frame alignment of the subtitle against the whisper transcript at the tail end of the window, given the whisper segment nominally ends at 02:52.6 (~2 frames before window close) while the identical subtitle persists to the window's end.
