# Event-tier micro-log — frames e_1729–e_1776 (03:41.00–03:42.96 clip time)

*(Reconstructed by the orchestrator from direct reads of e_1735 / e_1747 / e_1759 / e_1771 after the batch agent failed to write its log; adjacent windows event-36 [letterbox through e_1728] and event-38 [full HUD from e_1777] bracket the transition.)*

## Overview
This 2-second window contains the **cinematic→gameplay handback**: event-36 reports letterbox bars present through e_1728 (03:41.04); by e_1735 (03:41.25) the letterbox is gone and the full free-roam HUD is restored. Control regain therefore occurs at **≈03:41.1–03:41.25**.

## Observed state (all four sampled frames, 03:41.25 / 03:41.75 / 03:42.25 / 03:42.75)
- **No letterbox; player-controlled third-person camera.** Arthur stands back-to-camera in an open, fog-choked grass field; a saddled riderless horse ~15–20 m ahead beside a dead tree snag; cabin/homestead silhouette with fencing in the left background. Overcast, flat grey light; overall image reads dim/desaturated.
- **HUD fully restored:** circular minimap bottom-left; **three core icons above it** (small; at least one — health — reads as filled/reddish, the others faint/outline at this resolution [UNCERTAIN on exact fill]); money counter top-right **"$1096.35"**; persistent top-left tutorial toast: **"You can rest by holding [D-pad-up]. Your Cores will not drain while resting, and will refill slightly if they are very low."**
- **Red money-debit ticker at right-mid screen edge: "$1.00" with a red $ icon** (visible at 03:41.25 and 03:41.75, fading by 03:42.25) — the −$1.00 theft debit resolving on-screen in this window.
- **Arthur's animation:** held idle → first slow steps toward the horse by 03:42.75 (weight-shifted, short stride [UNCERTAIN whether gait anomaly or ordinary walk-start]).
- No subtitles, no honor notification, no button prompts beyond the rest toast; no NPC visible.

## Hard transitions
- **≈03:41.1–03:41.25 — letterbox OFF, full HUD ON: control returned to player** (bracketed by e_1728 letterboxed / e_1735 clean).
- 03:41.25–03:42.25 — red "−$1.00" money-debit ticker visible, then fades.
- Rest-core tutorial toast present continuously from the start of this window (first appearance was earlier, during the wake-up — see event-36) and persists into event-38.
