# Event Micro-Log — Window 02:29.00–02:30.96 (clip time)

Frame timestamp formula: t = 149 + (frameNumber-1)/24 s (this is the source-video absolute clock referenced in the task header; clip-time equivalents given in parentheses per header window, i.e. frame e_0001 = clip 02:29.00).

## Overview of this window
All 48 frames (e_0001–e_0048, ~2.04s @ 24fps) show a single continuous, player-controlled (non-cinematic) camera shot from a third-person over-the-shoulder angle on a wooden porch. There is no cutscene cut, fade, letterbox, black frame, or teleport within this specific window. The avatar (Arthur Morgan) is stationary, standing on the porch of a ramshackle wooden cabin (consistent with the "Lakay"/Sonny's-cabin location), facing an open doorway leading into a dark, unlit interior. No NPC (Sonny) is visible on-screen in any frame of this window — the interior beyond the doorway is too dark to resolve any figure or animation.

## Frame-by-frame

- **e_0001 (t≈149.00s / clip 02:29.00)**: Static POV, player character back-facing camera, standing ~2m from an open cabin doorway on a covered porch. Wooden crates/planks stacked left of doorway. HUD: minimap visible bottom-left (circular, white overlay, red position markers), no health/stamina/deadeye cores visible in this crop (minimap appears to be default without cores drawn out, or cores are faded/hidden). Context-menu prompts visible bottom-right, all fully bright/active: "Aim Weapon" [ctrl icon], "Greet" [grey box], "Antagonize" [grey box], "Stranger" [highlighted grey box, appears selected/default]. Debug/perf overlay top-right (FPS 75, GPU/CPU telemetry — non-diegetic, a capture artifact, not game HUD). No subtitles on screen. Ambient interior/exterior lighting: dim, overcast/hazy daylight through window at frame-left; interior beyond door is solid black/near-black.
- **e_0002 (149.04s)**: No visible change from e_0001. Same static pose and framing.
- **e_0003 (149.08s)**: No visible change.
- **e_0004 (149.13s)**: No visible change.
- **e_0005 (149.17s)**: No visible change.
- **e_0006 (149.21s)**: No visible change.
- **e_0007 (149.25s)**: No visible change.
- **e_0008 (149.29s)**: No visible change. Frames 1–8 are essentially identical held frames — avatar idle, camera static, HUD static.
- **e_0009 (149.33s)**: No visible change.
- **e_0010 (149.38s)**: No visible change.
- **e_0011 (149.42s)**: No visible change.
- **e_0012 (149.46s)**: No visible change.
- **e_0013 (149.50s)**: No visible change.
- **e_0014 (149.54s)**: No visible change.
- **e_0015 (149.58s)**: No visible change.
- **e_0016 (149.63s)**: No visible change. GPU temp readout ticks 67°C→ (minor telemetry drift only, non-diegetic).
- **e_0017 (149.67s)**: No visible change.
- **e_0018 (149.71s)**: No visible change.
- **e_0019 (149.75s)**: No visible change.
- **e_0020 (149.79s)**: No visible change.
- **e_0021 (149.83s)**: [UNCERTAIN] Context-menu prompt row bottom-right begins to dim: "Greet" and "Antagonize" rows appear slightly greyed/lower-opacity compared to e_0001–e_0020; "Stranger" prompt remains bright/highlighted. This may indicate the interaction wheel losing/changing focus, or a compression artifact.
- **e_0022 (149.88s)**: Context-menu further dims — "Greet" label rendering is faint/garbled (partially overlapping pixels, reads ambiguously, possibly "Greet" transitioning to greyed-out state); "Antagonize" also dimmed; "Stranger" prompt box now shows a filled/darker highlight box (button icon) suggesting a control-input glyph is present. [UNCERTAIN — exact icon glyph not resolvable at this resolution].
- **e_0023 (149.92s)**: Same dimmed state as e_0022 continues.
- **e_0024 (149.96s)**: Same. FPS counter reads 76 (minor telemetry change only).
- **e_0025 (150.00s)**: Same dimmed prompts persist. "Aim Weapon" prompt remains fully bright throughout.
- **e_0026 (150.04s)**: No further change.
- **e_0027 (150.08s)**: No further change.
- **e_0028 (150.13s)**: No further change.
- **e_0029 (150.17s)**: No further change.
- **e_0030 (150.21s)**: No further change.
- **e_0031 (150.25s)**: No further change.
- **e_0032 (150.29s)**: No further change.
- **e_0033 (150.33s)**: No further change.
- **e_0034 (150.38s)**: Minor telemetry tick (CPU 23%); no diegetic change. Camera/avatar/HUD identical to prior frame.
- **e_0035 (150.42s)**: No visible change.
- **e_0036 (150.46s)**: No visible change.
- **e_0037 (150.50s)**: No visible change.
- **e_0038 (150.54s)**: No visible change.
- **e_0039 (150.58s)**: No visible change.
- **e_0040 (150.63s)**: No visible change.
- **e_0041 (150.67s)**: No visible change.
- **e_0042 (150.71s)**: No visible change.
- **e_0043 (150.75s)**: No visible change.
- **e_0044 (150.79s)**: No visible change.
- **e_0045 (150.83s)**: No visible change.
- **e_0046 (150.88s)**: No visible change.
- **e_0047 (150.92s)**: Telemetry: FPS drops to 73, CPU 25% (non-diegetic capture-machine load fluctuation). No on-screen game change.
- **e_0048 (150.96s)**: No visible change from e_0047. Final frame of window: avatar still standing static on porch, facing open dark doorway; HUD context menu still in dimmed "Greet/Antagonize" + bright "Stranger"/"Aim Weapon" state; no NPC visible; no cutscene indicators (no letterbox bars, no fade, no black frames) present anywhere in this window.

## HUD detail (constant across window)
- Minimap: present, circular, bottom-left, throughout all 48 frames. No visible health/stamina/deadeye core ring overlay resolvable in the crop provided (minimap style suggests cores may be toggled off-screen or beyond crop edge — [UNCERTAIN]).
- Money counter: not visible in frame (likely off-screen or not rendered in this camera crop).
- Honor notification: none observed.
- Button/context prompts: "Aim Weapon" (bright, constant), "Greet" (bright frames 1–20, dims from ~frame 21 onward), "Antagonize" (bright frames 1–20, dims from ~frame 21 onward), "Stranger" (bright/highlighted throughout, appears to be the currently-selected default interaction).
- Subtitles: none appear on screen in any of the 48 frames (the corresponding Whisper transcript lines "Now come here" at 02:28.7/02:32.7 fall just before/within this window but no matching on-screen subtitle text is rendered in these frames).
- No UI toasts, no death/mission-fail banners, no black bars/letterboxing observed.

## Environment
- Porch: covered, wood-plank flooring and roof overhang visible top of frame; wooden support post at far right of frame; open unglazed window opening at far left with hazy grey exterior light beyond (fog/overcast).
- Doorway: simple wood-plank door standing open, set in a rough-hewn log-cabin wall; interior is unlit and reads as solid dark/near-black in every frame — no interior props (skulls, bed, table) are resolvable due to lack of light.
- Lighting: overall scene dim/low-key, consistent with dusk/heavy overcast or an intentionally underlit interior approach shot; a thin shaft/mote of light is faintly visible just inside the doorway in several frames (e.g., e_0006 onward) but no distinguishable geometry.
- No weather particles (rain/snow) visible.

## Transitions
- No control-loss/control-regain markers, no cutscene start/end markers, no fades, no teleports, and no hard cuts occur within this specific 02:29.00–02:30.96 window. The only observed change is a soft dimming of two context-menu prompt labels ("Greet," "Antagonize") beginning around frame e_0021 (t≈149.83s), which may reflect an interaction-wheel/focus state change rather than a cutscene transition. [UNCERTAIN]

## Note on transcript alignment
The Whisper lines "Now come here" (02:28.7) and "Now come here" (02:32.7) bracket this window's start/end but no corresponding subtitle text or visible NPC/Sonny action is present on screen during 02:29.00–02:30.96 to visually corroborate either line; the avatar remains static throughout.
