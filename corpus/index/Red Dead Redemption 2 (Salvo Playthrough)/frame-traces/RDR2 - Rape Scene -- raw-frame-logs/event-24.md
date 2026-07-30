# Event-tier micro-log — frames e_1105–e_1152 (clip t = 03:15.00–03:16.96)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 s (clip-relative).

## Observation

Every sampled frame in this window (e_1105 through e_1152, spot-checked at e_1105–e_1120, e_1130, e_1140, e_1152) shows an entirely **black frame**. The only visible content in any frame is a thin system performance-monitor overlay in the top-right corner (text: "FPS 0  0 (1%L) | GPU xx% xx°C xxxx MHz 1.090V xxx W xxxx RPM 14983 MHz | CPU xx% | LAT 0.0 ms 0 ms"), plus small gear/mic/clock icons in the bottom-right corner. This overlay is a capture/recording utility HUD (external to the game), not game UI.

- No game HUD elements are visible: no minimap, no health/stamina/deadeye cores, no money counter, no honor notification, no button prompts, no subtitles.
- No letterboxing bars are distinguishable from the black background (frame is uniformly black, so letterbox presence/absence cannot be determined) [UNCERTAIN].
- No NPC (Sonny) or player avatar visible.
- No environment/props visible (cabin, skulls, bed, table) — screen is fully black.
- GPU/CPU telemetry values in the overlay fluctuate slightly frame to frame (e.g., GPU% rises from ~31% at e_1105-1114 to ~46% by e_1119-1120, then settles ~37-46% through e_1130-1152; CPU% ~23-30%), indicating the capture is live/active and frames are genuinely distinct, not a frozen/duplicated single frame — but the on-screen game content itself does not change: it remains black throughout.
- GPU clock jumps from 3225 MHz (e_1105-1118) to 3195 MHz (e_1119 onward), coinciding with the GPU% climb — plausibly marking a scene/rendering-load transition, but this is inferred from performance telemetry only, not from visible game content [UNCERTAIN].

### Per-frame notes (representative sample)

| Frame | Timestamp | Content |
|---|---|---|
| e_1105 | 03:15.000 | Black; overlay GPU 31%, 3225 MHz, CPU 23% |
| e_1106 | 03:15.042 | Black; overlay unchanged |
| e_1107 | 03:15.083 | Black; overlay unchanged |
| e_1108 | 03:15.125 | Black; overlay unchanged |
| e_1109 | 03:15.167 | Black; overlay unchanged |
| e_1110 | 03:15.208 | Black; overlay unchanged |
| e_1111 | 03:15.250 | Black; overlay unchanged |
| e_1112 | 03:15.292 | Black; overlay unchanged |
| e_1113 | 03:15.333 | Black; overlay unchanged |
| e_1114 | 03:15.375 | Black; overlay unchanged |
| e_1115 | 03:15.417 | Black; overlay unchanged |
| e_1116 | 03:15.458 | Black; overlay unchanged |
| e_1117 | 03:15.500 | Black; overlay unchanged |
| e_1118 | 03:15.542 | Black; overlay unchanged |
| e_1119 | 03:15.583 | Black; overlay GPU jumps to 46%, 3195 MHz, CPU 29% |
| e_1120 | 03:15.625 | Black; overlay GPU 46%, CPU 29% |
| ... (e_1121–e_1129, not individually sampled) | 03:15.667–03:16.000 | Presumed black based on bracketing samples [UNCERTAIN — not directly viewed] |
| e_1130 | 03:16.042 | Black; overlay GPU 46%, 3195 MHz, CPU 27% |
| ... (e_1131–e_1139, not individually sampled) | 03:16.083–03:16.417 | Presumed black based on bracketing samples [UNCERTAIN — not directly viewed] |
| e_1140 | 03:16.458 | Black; overlay GPU 37%, 3225 MHz, CPU 30% |
| ... (e_1141–e_1151, not individually sampled) | 03:16.500–03:16.917 | Presumed black based on bracketing samples [UNCERTAIN — not directly viewed] |
| e_1152 | 03:16.958 | Black; overlay GPU 43%, 3195 MHz, CPU 25% |

Note: frames e_1121–e_1129, e_1131–e_1139, e_1141–e_1151 were not individually opened in this pass but bracketing frames on both sides are uniformly black with only the capture-utility overlay visible; given the total absence of any visible game imagery across the full sampled range, the unsampled frames are assessed as very likely also black, but this is flagged as [UNCERTAIN] since they were not directly read.

## Transitions

No hard transitions (cutscene start/end, letterbox appear/disappear, control-loss/regain cue, HUD element appear/disappear, fade edge) could be identified within this window, because the entire window is black and no game UI or environment content is visible to compare against. If this window corresponds to a fade-to-black (e.g., following the "quite a tussle" dialogue and the "friendship ain't so tough" line heard earlier in the transcript, or preceding the ambient "No" utterances at 03:29.9–03:39.8), the fade itself is not observable within these frames — the entire sampled span is already fully black at both the start (e_1105/03:15.00) and end (e_1152/03:16.96).

## Audio cross-reference (for context only, per instructions — not visually confirmed)

No transcript lines fall within 03:15.00–03:16.96 per the provided Whisper transcript (nearest lines: "and neither is you" at 03:01.5, then "Lord" [possibly hallucinated] at 03:27.9). This window is likely a silent/ambient stretch corresponding to sustained blackness on screen.
