# Micro-log — Lead-up Tier, Window 01:10.00–01:14.90 (clip time), frames l_0101–l_0150 (10fps)

Formula: t = 60 + (frameNumber-1)/10 sec. Frame l_0101 → t=70.0s (01:10.0); l_0150 → t=74.9s (01:14.9).

## General/persistent state across entire window
- Camera: player-controlled third-person, over-the-shoulder, following the mounted avatar from behind/slightly right — no letterboxing, no cinematic bars, no fades, no black frames observed at any point in this window.
- Avatar: mounted on a gray/dappled (leopard-appaloosa) horse, walking/idling toward a swamp cabin. Avatar wears dark hat, dark coat/duster.
- HUD: minimap visible bottom-left throughout (circular, showing river/swamp terrain, one red marker/blip near center, one white directional arrow for avatar facing, a nearby unlabeled dot). No stamina/health/deadeye core HUD elements are visible in this cropped view (likely off-screen or not rendered in this camera framing). No money counter, no honor notification, no button prompts, no UI toast visible in any frame of this window. FPS/GPU/CPU debug overlay bar present top-right throughout (developer telemetry overlay, not game UI: "FPS ##  ## (1%L) | GPU ##% ##°C ... | CPU ##% | LAT ...").
- Subtitle bar: persistent dark subtitle box at bottom-center for most of window, text changes as noted below.
- Environment: foggy/hazy swamp/bayou clearing, Spanish-moss-draped cypress trees, tall grass, a wooden swamp cabin (Sonny's cabin) with a porch, exterior clutter (crates, hanging cloth/skulls-like white objects on the porch railing, a wagon wheel leaning against the cabin exterior, a small wooden bench/table structure to the left). Lighting is overcast/diffuse, midday-grey, consistent with the described dense fog/mist. Foreground tree branches and large leaves partially occlude the camera intermittently (foliage overdraw, not a vision effect).

## Frame-by-frame micro-log

- **t=70.0s (l_0101)**: Avatar on horseback approaching cabin through dense foreground branches; cabin visible in mid-distance with a human NPC figure standing on/near the porch (Sonny, distant, static). Subtitle: "don't be shy now." Minimap shows red blip left-of-center, avatar arrow pointing up.
- **t=70.1–70.3s (l_0102–l_0104)**: Same shot continues; horse advancing at walk, camera panning slightly with movement. Subtitle unchanged: "don't be shy now." NPC figure remains stationary on porch, small at this distance.
- **t=70.4–70.6s (l_0105–l_0107)**: Camera drifts/pans right (apparent free-look or slight path curve), foreground leaves increasingly occlude frame at 70.6s (l_0107) — motion-blur artifacting visible on foliage (fast camera pan blur). Subtitle unchanged.
- **t=70.7–70.9s (l_0108–l_0110)**: Motion blur persists/intensifies across frame (streaking blur effect over trees/porch), consistent with a rapid camera swing rather than a cut. Cabin and standing NPC (now visible mid-frame on porch, arms visible) remain in view through the blur. Subtitle unchanged: "don't be shy now."
- **t=71.0s (l_0111)**: Blur resolves; clear view of cabin exterior and Sonny standing upright on the porch (torso visible above railing, static idle pose facing cabin interior/side). Wagon wheel, hanging pale cloth-like objects on porch post visible. Subtitle unchanged.
- **t=71.1–71.9s (l_0112–l_0120)**: Camera continues steady slow push toward cabin; avatar's horse walking forward at a slow, even gait (no gait anomalies observed — normal walk cycle). Sonny remains visible standing on the porch in a static/idle stance through l_0119; minimap shows avatar's position marker shifting slightly closer to the red blip as horse advances. Subtitle persists: "don't be shy now." No HUD changes.
- **t=72.0s (l_0121)**: Same composition; Sonny still standing on porch (last frame he's clearly visible standing before the camera/approach angle changes). Avatar continues approach at walking pace.
- **t=72.1s (l_0122)**: Subtitle text still "don't be shy now." Sonny figure still present on porch (partially visible, side profile).
- **t=72.2–72.9s (l_0123–l_0129)**: Continued slow approach; camera angle shifts slightly (now viewing cabin more head-on/slightly left), Sonny becomes less distinctly visible in the darker porch interior/doorway — figure obscured by porch shadow/interior darkness rather than a cut [UNCERTAIN whether Sonny has moved indoors or is merely occluded by shadow]. Horse continues steady walk. No subtitle change until l_0127/l_0128 transition.
- **t=73.0s (l_0130)**: Subtitle text changes to: **"Come over to see old Sonny..."** — first new subtitle line in the window (previous line "don't be shy now." held from t=70.0 through ~t=72.9s). This is a clean subtitle-box text swap, no visual transition accompanying it.
- **t=73.1–73.9s (l_0131–l_0139)**: Subtitle "Come over to see old Sonny..." persists across this entire span (9 frames / ~0.9s — unusually long hold, consistent with description as slow/drawled dialogue). Avatar continues walking horse toward cabin at a steady, unhurried pace; camera slowly rotates/tracks around avatar's right side (yaw drifting rightward across frames, exposing more of the cabin's right side and the small tree/scaffold structure at left of frame). No NPC (Sonny) visible in doorway/porch during this span — porch interior appears empty/dark in these frames [UNCERTAIN — porch interior consistently dark, cannot confirm Sonny's presence or absence for this stretch].
- **t=74.0s (l_0141)**: Same subtitle "Come over to see old Sonny..." continues. Avatar/horse now closer to cabin steps, camera closer/tighter framing.
- **t=74.1–74.6s (l_0142–l_0147)**: Foreground large leaf/branch briefly sweeps across and occludes most of the frame at l_0146–0147 (natural foliage parallax from camera movement, not a scene transition). Horse continues walking approach toward cabin steps. Subtitle text remains "Come over to see old Sonny..." throughout.
- **t=74.7–74.9s (l_0148–l_0150)**: Foliage occlusion clears; cabin and porch steps in clear view again, avatar/horse now very near the base of the porch steps. Subtitle still reads "Come over to see old Sonny..." at the end of the window (t=74.9s, final frame l_0150). No cut, fade, or control-state change observed through the end of this window.

## Notable absence / non-events (explicitly checked)
- No letterbox bars appear/disappear in this window.
- No fade-to-black or fade-in observed.
- No screen distortion/blur effects other than ordinary camera-motion blur on fast pans (l_0107–l_0110) and incidental foliage occlusion (l_0107, l_0146–0147).
- No HUD prompt icons (e.g., button prompts) appear.
- No honor/money/notification toasts appear.
- No teleport/relocation of avatar; motion is continuous, incremental forward approach at a walking gait the entire window.
- Camera behavior throughout reads as standard player-controlled follow-cam (no discrete cinematic cut detected); the only ambiguity is whether a slow auto-pan/yaw occurred under player control or via a soft scripted camera easing during approach — visually indistinguishable from an ordinary player-directed turn [UNCERTAIN].

## Whisper transcript cross-reference for this window
- "Don't be shy now, come over to see old Sonny, come on" (transcript timestamp 01:08.5) — matches the two subtitle lines seen on screen: "don't be shy now." (through t≈72.9s) then "Come over to see old Sonny..." (from t≈73.0s onward), confirming the subtitle box is displaying a segmented/split rendering of this single spoken line.
