# Micro-log: leadup-04 (frames l_0151–l_0200, clip t=01:15.00–01:19.90)

Frame→time formula: t = 60 + (frameNumber-1)/10 s.

## t=01:15.00 (f151) – t=01:16.20 (f163)
- Static-ish player-controlled 3rd-person camera, avatar (Arthur/protagonist) mounted on brown/black horse, positioned in front of a small wooden swamp cabin (tin/corrugated roof), facing the porch/steps. A second horse (grey/white appaloosa, riderless, tied) stands beside the player's horse throughout.
- HUD: minimap bottom-left (circular, no red dot/threat markers visible), no visible health/stamina/deadeye core widgets in these crops (likely off-screen or minimized), no honor notification, no money counter change, no button prompt visible.
- Top-right corner: debug/perf overlay (FPS, GPU%, temp, clocks, CPU%, latency) present in every frame — this is a benchmarking/dev overlay, not game UI.
- Environment: foggy/hazy swamp forest, overcast diffuse light, Spanish-moss-draped trees, wooden props (broken cart wheel, sawhorse/table-like structure) left of cabin, cabin porch has indistinct objects on a table (jugs/jars).
- No subtitle text on screen in f151–f159.
- f160–f163: avatar/horse essentially static, minor idle-animation sway; no camera cut.

## t=01:16.30 (f164) – t=01:17.20 (f173): subtitle "come on."
- f164: subtitle box appears bottom-center: **"come on."** (lowercase, period included) — this corresponds to transcript's "Don't be shy now, come over to see old Sonny, come on" region tail-end.
- Subtitle "come on." persists through f164–f172 (~0.9s on screen).
- Player camera/avatar remains mounted, static idle on horse; no movement of avatar yet.
- f169 (t=01:16.80): avatar's head/hat visible leaning slightly forward — start of dismount wind-up.
- f170–f173: avatar begins dismount animation — body leaning down/left off the saddle, one arm extending downward (classic RDR2 dismount pose). Subtitle "come on." still visible through f172; gone by f173.

## t=01:17.30 (f174) – t=01:18.20 (f183): dismount and approach
- f174–f177: avatar continues dismount, torso lowers past the horse's side, legs bending; horse remains stationary. No subtitle.
- f178 (t=01:17.70): avatar now on the ground (dismounted), standing beside/behind the horse, camera has adjusted closer/lower — consistent with dismount camera settle, not a hard cut (gradual reframe).
- A humanoid figure is now visible standing on the cabin porch near the doorway (partially occluded by horse/trees) — this is presumably Sonny. A second, seated/slumped figure is also visible on the porch to the right of the door (indistinct, could be another NPC or prop/sack) [UNCERTAIN].
- f179–f183: avatar walks from beside the horse toward the cabin; camera follows behind (over-the-shoulder), consistent with normal player-controlled walk-cam. Gait appears to be a normal walk cycle, no obvious anomaly.
- Large green blurred foreground shape (foliage/leaf swiped across lens, a tree branch/leaf close to camera) partially obscures the frame in f183–f188 — this is environmental foreground clutter (a nearby branch), not a scripted effect. No letterboxing, no black bars, no fade observed.

## t=01:18.30 (f184) – t=01:19.00 (f191): approach continues, "Stranger" tag appears
- f184–f188: avatar continues walking toward cabin porch, weaving around foreground foliage; camera remains player-controlled third-person, following avatar.
- Standing figure on porch (Sonny, presumed) remains near doorway, roughly stationary, facing outward toward the approaching avatar.
- **f186 (t=01:18.50): a small UI label "STRANGER" with a circular icon/button-prompt glyph appears bottom-right of screen** — this is the game's on-screen character/interaction identifier tag (typically appears when nearing an interactable NPC). This is a HUD toast, not a subtitle.
- "STRANGER" tag persists continuously from f186 through f200 (end of window).
- No minimap change, no honor notification, no money change, no health/stamina core pop-up visible in these crops.

## t=01:19.10 (f192) – t=01:19.90 (f200): final approach, near porch
- f192–f200: avatar continues walking, now closer to the cabin, horse (appaloosa) left in mid-frame; camera stays behind/over-shoulder of avatar, no cuts, no letterboxing, no fades.
- The standing porch figure (presumed Sonny) remains fixed near the doorway; a second indistinct pale/light-colored seated shape remains on the porch to the right [UNCERTAIN — could be a rocking chair with an object, or a seated NPC/effigy].
- "STRANGER" HUD tag remains on screen through last frame (f200, t=01:19.90).
- No control-loss/cutscene indicators (no letterbox bars, no fade-to-black, no camera-cut) observed anywhere in this window — entire segment appears to be continuous player-controlled gameplay (walking/approach), consistent with a "lead-up" tier.
- No subtitles on screen at end of window (last subtitle "come on." ended by f173).

## Summary of on-screen UI states across window
- Perf/debug overlay (FPS/GPU/CPU/latency): present in all 50 frames, unchanged in content/position.
- Minimap: present bottom-left throughout, no visible marker changes.
- Subtitle "come on.": visible f164–f172 only (~t=01:16.30–01:17.10).
- "STRANGER" NPC-tag UI element: appears first at f186 (t≈01:18.50) and remains visible through f200 (t=01:19.90).
- No honor toast, no money-counter change, no health/stamina/deadeye core pop-up, no button-prompt icon (other than the STRANGER tag) observed.
- No cutscene letterboxing, fades, or control-loss markers observed in this window.
