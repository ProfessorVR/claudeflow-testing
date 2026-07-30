# Event-tier micro-log: clip window 03:39.00–03:40.96 (frames e_1681–e_1728)

Timestamp formula: t = 149 + (frameNumber-1)/24 sec (clip absolute time; NOTE: this places the window at ~2:12:04 absolute clip-time convention used elsewhere in this pipeline, but per instructions using the given formula, frame e_1681 = 149 + 1680/24 = 219.0s = 03:39.0 — consistent with stated window).

## Overview of visual content
Across all 48 frames (e_1681–e_1728) the camera shows Arthur Morgan (player avatar), viewed from behind/over-the-shoulder, standing nearly motionless in a foggy/misty overgrown field near a distant cabin (visible far left-background) with a horse (not the player's, riderless/loose) grazing nearby and a dead/burnt tree snag beside a large fanned agave/yucca-like plant. Full letterbox black bars are present top and bottom of the frame in every single frame of this window (cinematic aspect ratio maintained throughout). A performance/debug overlay (FPS, GPU%, temp, clocks, CPU%, latency) is present in the top-right corner throughout. No dialogue subtitles appear on screen in this window despite the transcript listing "Lord" (03:27.9) and "No" (03:29.9–03:39.8) — those timestamps fall just before/at the very start of this window and are not visually represented here.

## Frame-by-frame log

**e_1681 (t=219.00s/03:39.00):** Arthur stands facing away from camera (back to viewer), static idle stance, hands loosely at sides, hat on. Camera fixed, slightly elevated, static — appears cinematic/locked (no player-reticle, no HUD elements besides perf overlay). Letterboxed. Background: grazing horse ~15m ahead-left, dead tree snag, cabin silhouette far left, overcast/foggy sky, tall grass field. No visible HUD (no minimap, no health/stamina/deadeye cores, no money counter, no subtitle). Lighting: dim, grey, overcast, hazy/foggy atmosphere consistent with dawn/dusk or storm-light.

**e_1682–e_1696 (t=219.04–219.65s):** Frame-to-frame content is visually static/near-identical — Arthur's pose, camera angle, and background elements (horse position, cabin, tree) do not perceptibly change across these 15 frames. This suggests either a held static cinematic shot or the game is paused/frozen momentarily during this stretch. Letterbox bars remain present throughout. No HUD elements appear. Perf overlay values fluctuate slightly (FPS 73→83, GPU% 96→97, temps 66→68°C) confirming the game is running/rendering, not paused, but the depicted scene shows no camera or character motion.

**e_1697–e_1707 (t=219.67–220.11s):** Same static composition continues — Arthur standing, back to camera, horse grazing, cabin distant, dead tree/yucca cluster mid-ground. No HUD. No letterbox change. No perceptible animation change in Arthur's pose (idle stance held).

**e_1708 (t=220.17s):** First visible HUD element in this window appears: a faint reddish icon+text partially visible at right-center edge of frame (small icon near "$" symbol area) — too small/blurred to transcribe with confidence. [UNCERTAIN — possible HUD toast beginning to fade in].

**e_1709 (t=220.19s):** No visible HUD element carried over from e_1708 (blank again in that region). Scene otherwise unchanged.

**e_1710 (t=220.25s):** Money counter appears top-right: **"$1097.xx"** (partially obscured/blurry digits, reads approx. "$1097" with fractional cents not fully legible) — first appearance of a HUD money display in this window. This is a HARD TRANSITION (HUD element newly rendered).

**e_1711 (t=220.29s):** Money counter still visible, reads approx. **"$1097.17"**. Small red icon/number appears far right-center of frame near screen edge (a floating value, likely a small currency-loss/spend indicator) — [UNCERTAIN, small/blurred].

**e_1712–e_1720 (t=220.33–220.71s):** Money counter persists top-right, digits fluctuate slightly frame to frame (blur artifact of counter animating down/up, e.g. readings drift between "$1097.02" and "$1097.23" across frames) — indicates the money value is ticking/animating (small amount changing). A faint reddish/orange small numeric indicator continues to appear intermittently at right-mid-screen edge (e.g. "-$1.00" or similar small floating currency-change text) — [UNCERTAIN, resolution insufficient to read exact value/sign]. Scene composition (Arthur, horse, cabin) remains static/unchanged; no camera movement; letterbox unchanged.

**e_1721 (t=220.75s):** Same as above; money counter ~"$1097.23"; small floating indicator at right edge still present.

**e_1722 (t=220.79s):** A UI tutorial/tooltip box appears in the top-left of frame for the first time — HARD TRANSITION. Text (partially legible, standard RDR2 rest-prompt wording): **"You can rest by holding [1]. Your Cores will not drain while resting, and will refill slightly if they are very low."** White rounded rectangle tooltip box with a button-glyph icon ("1"). This is a game-system tutorial popup, appearing over the same static field/cabin/horse backdrop. Money counter still shown top-right (~"$1097.xx").

**e_1723 (t=220.83s):** Tutorial tooltip box persists, same text. Money counter still present.

**e_1724 (t=220.87s):** Tutorial tooltip persists. Minimap appears for the first time in the bottom-left corner — HARD TRANSITION (HUD minimap now rendered, circular map with Arthur's position marker centered, faint terrain/road lines, a couple of small dots/markers visible on it). This indicates a shift from a cinematic/no-HUD state to a normal gameplay-HUD state.

**e_1725 (t=220.91s):** Tutorial tooltip persists; minimap now shows small colored (red) icon(s) near center-bottom of the minimap circle. No stamina/health/deadeye core icons visible yet above the minimap.

**e_1726 (t=220.96s):** Same tutorial tooltip; minimap present with red marker(s); three small circular "core" icon outlines appear just above the minimap (empty/outline state, no fill color) — likely health/stamina/deadeye core UI beginning to render — HARD TRANSITION (cores HUD appearing).

**e_1727 (t=221.00s):** Tooltip persists; minimap persists; the three core icons above the minimap now show reddish/colored fill in the leftmost icon (partial fill state) — [UNCERTAIN exact fill level due to compression/resolution].

**e_1728 (t=221.04s/03:41.04, end of window):** Tooltip text persists (same wording); minimap persists with markers; three core icons visible, left one shows red/filled indicator, others appear faded/outline. Scene composition (Arthur standing, back to camera, horse, cabin, dead tree) remains otherwise unchanged from the start of the window. No camera cut, no fade, no letterbox change occurred at any point in this window — the letterbox bars are present in every single frame from e_1681 through e_1728.

## Summary of environment across window
- Cabin: only a distant, small silhouette visible far left-background throughout; no interior shown in this window.
- Weather/lighting: overcast, hazy/foggy, flat grey-toned lighting consistent with dawn or storm conditions; no visible rain droplets on screen; tall grass field with a dead/burnt tree snag and a large fanned yucca/agave-type plant in the mid-ground.
- Horse: a riderless horse (not obviously saddled/Arthur's, though [UNCERTAIN] on ownership) grazes in place, positioned consistently across all frames without visible movement.
- Arthur/player: standing still, back to camera, hat on, dark riding coat, hands down; no weapon drawn; no visible gait or locomotion animation — a held idle pose for the entire ~1.96s window.

## Ambiguous items flagged
- [UNCERTAIN] Exact digits of the money counter (e.g., "$1097.xx" cents) due to JPEG compression/motion blur on the animating counter.
- [UNCERTAIN] Small floating reddish currency-change indicator at right-mid screen edge (frames ~1710–1721) — value and sign not legible.
- [UNCERTAIN] Whether the near-total static/frozen appearance of frames e_1681–e_1721 reflects a genuine held cinematic shot, a paused/frozen capture, or a very slow camera creep too subtle to detect at this resolution.
- [UNCERTAIN] Exact fill-state/color of the three "core" icons appearing at e_1726–e_1728 (health/stamina/deadeye) due to small icon size and compression.
- No dialogue subtitle text appeared on screen in this specific window despite the transcript indicating audio ("Lord" / "No") in adjacent/overlapping timestamps — this may mean subtitles are disabled in this playthrough, or the relevant lines were not captioned.
