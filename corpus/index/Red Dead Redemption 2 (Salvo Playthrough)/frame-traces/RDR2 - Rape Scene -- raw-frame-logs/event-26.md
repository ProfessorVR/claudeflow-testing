# Event-tier micro-log — window 03:19.00–03:20.96 (clip time), frames e_1201–e_1248

Frame timestamp formula: t = 149 + (frameNumber-1)/24 s (absolute clip time). Window covers ~t=199.17s–201.13s in that absolute scheme, but per task instructions this corresponds to clip-time 03:19.00–03:20.96 for frames 1201–1248 (24fps, 1/24s = ~0.0417s per frame).

## Observations

**e_1201–e_1229 (~03:19.00–03:19.58):** Full-frame BLACK. No image content whatsoever — pure black frame, letterboxed appearance is total (entire 960x540 canvas is black, not just top/bottom bars). Only a thin performance-overlay HUD strip is visible at top-right corner (FPS/GPU/CPU telemetry: "FPS 0 0 (1%L) | GPU 34-45% ... CPU 17-28% | LAT 0.0ms 0ms") — this is a system/dev overlay, not a game HUD element, present continuously throughout. No minimap, no health/stamina/deadeye cores, no button prompts, no subtitles, no toasts visible during this entire black stretch. No game HUD elements of any kind are visible — consistent with a cutscene black-screen/transition or scene holding on black.
  - e_1201–e_1210 (03:19.00–03:19.37): sustained black, telemetry reads GPU 34%, 60°C.
  - e_1211 (03:19.42): telemetry shifts to GPU 44%, 60°C — minor system load change, no visual change on screen.
  - e_1212–e_1224 (03:19.46–03:19.96): sustained black, telemetry GPU 44-45%, CPU 23-28%.
  - e_1225 (03:20.00): black, GPU 45%, CPU 23%.
  - e_1226 (03:20.04): black, GPU 45%, CPU 23% — last fully black frame.

**e_1227 (03:20.08) — [TRANSITION START]:** First faint visual content appears. Extremely dark, low-contrast image begins to fade in from black: a top letterbox bar (solid black, ~55px) and bottom letterbox bar (solid black, ~70px) become visible, framing a dim, blurred/soft-focus image in the center. The image shows what appears to be a very dark interior close-up — indistinct shapes, warm/muddy dark-brown and olive tones, with a bright out-of-focus round highlight (window light or lamp bokeh) on the left side. This is a fade-up from black, extremely subtle at this frame.

**e_1228–e_1229 (03:20.13–03:20.17):** Image brightens slightly further; the cinematic letterbox bars (black bars top ~55px, bottom ~65-70px) are now clearly established, confirming a cutscene frame. The blurred content resolves marginally: appears to be a close, low-angle, soft-focus shot with dark silhouetted/blurred foreground shapes (possibly bedding, drapery, or a figure's shoulder/head near-camera) against a lighter blown-out background wall/ceiling. Bright specular highlights (2-3 small round bokeh circles) visible left-of-center, consistent with lamp light or window glow diffused through soft focus.

**e_1230–e_1248 (03:20.21–03:20.96):** Letterboxed cinematic frame holds steady with only very gradual, subtle brightening/blur changes (the shot appears to slowly rack focus or the exposure very slightly increases — differences between consecutive frames are minor). Composition throughout: extreme close-up, canted/low angle, heavily blurred, of what reads as bedding/pillow material (pale cream-colored soft shape, lower-left) and a darker diagonal shape running upper-left to right (possibly a headboard, beam, or drapery edge) with a partially discernible dark silhouetted head/face shape right-of-center in shadow — features not resolvable at this resolution/blur level [UNCERTAIN — exact subject of the close-up (face vs. object vs. fabric) cannot be confirmed given the extreme blur and low light]. 2-3 small bright circular bokeh highlights remain visible left-of-frame throughout (unchanged position), suggesting a static or near-static camera during this held shot. No HUD game elements (minimap, health/stamina/deadeye cores, money counter, honor notification, button prompts) appear at any point in e_1230–e_1248. No subtitle text is visible baked into any frame. Top-right telemetry overlay persists throughout, values drift: GPU 45%→94%, CPU 23%→17%, temp 60°C→64°C (GPU load rises sharply between e_1234/1236 and e_1240, consistent with a rendering-intensive cinematic frame such as a lighting/DoF-heavy shot).
  - e_1230–e_1234 (03:20.21–03:20.38): image essentially static, GPU 45%, CPU 23%.
  - e_1235–e_1239 (03:20.42–03:20.58): image essentially static, GPU 94%, CPU 17%, temp 64°C — jump in GPU load.
  - e_1240–e_1248 (03:20.63–03:20.96): image essentially static, held composition, same GPU/CPU/temp readings persist to end of window.

## Transitions summary

- **03:19.00–03:20.04 (e_1201–e_1226):** sustained full black frame (cutscene black hold / transition).
- **03:20.08 (e_1227):** fade-up begins — first faint non-black visual content appears from black.
- **03:20.08–03:20.17 (e_1227–e_1229):** cinematic letterbox bars become visible/established; image continues to brighten from black.
- **03:20.21 onward (e_1230–e_1248):** letterboxed cinematic close-up shot holds, extreme soft-focus/blur, dim lighting, static-ish framing, held through end of window (03:20.96) with no further hard cuts.
- No HUD/game UI elements (minimap, cores, money, honor toast, button prompts, subtitles) appear anywhere in this window.
- No further cuts, additional fades, or control-loss/regain indicators are visible within this specific window (03:19.00–03:20.96); the sustained black-to-fade-up is the only transition captured.
