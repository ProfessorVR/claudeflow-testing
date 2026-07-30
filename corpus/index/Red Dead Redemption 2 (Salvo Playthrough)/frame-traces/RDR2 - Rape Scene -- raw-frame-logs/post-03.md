# Micro-log: post-03 (context tier, 1fps, frames q_081–q_120)
Window: clip time 05:05.00–05:44.00. Timestamp formula: t = 225 + (frameNumber-1) seconds.

## Persistent HUD elements (frames 081–105)
- Toast (top-left, persistent multi-line): "Your Health Core is empty. Your Health will regenerate slower. Sleep or eat food such as meats and canned food to refill your Health Core." — visible continuously frames q_081–q_105 (t=305.00–329.00), then disappears.
- New toast appears frames q_106–q_120 (t=330.00–344.00): "You can rest by holding [!]. Your Cores will not drain while resting, and will refill slightly if they are very low."
- Minimap: present bottom-left throughout all frames, circular, showing player (white arrow) on a light-colored map with red/pink location marker cluster nearby (denoting a point of interest, presumably the cabin).
- Cores HUD (health/stamina/deadeye, top of 3 circular icons above minimap): all three shown as dark/depleted-looking (reddish-brown, low-fill) throughout — consistent with "Health Core empty" toast.
- Top-right system telemetry overlay (FPS/GPU/CPU/temp/latency counters) present in every frame — this is a debug/capture overlay, not game HUD; not narratively relevant.
- No letterboxing, no black bars, no fades observed in any frame in this window — camera is in standard player-controlled third-person gameplay framing throughout.
- No button prompts visible except at q_117–q_120 (see below).
- No money-counter, honor notification, or deadeye activation observed.

## Chronological log

**t=305.00 (q_081)** Player-character on horseback, third-person rear-follow camera, riding along a dirt trail through dense foggy woodland (heavy atmospheric fog/mist, muted grey-green palette, low visibility, indicating early morning/dawn or heavy weather). Horse at a walk/trot gait, reins loosely held. No NPCs visible. Minimap shows player arrow near a red marker cluster to the north.

**t=306.00–316.00 (q_082–q_092)** Continuous player-controlled horseback riding through fog/forest, camera trailing at a fixed offset behind and slightly above the character. Trail winds through cypress/pine woodland with palmetto undergrowth (swamp/bayou biome). No cuts, no camera mode changes. Health Core toast remains onscreen unchanged. Minimap red marker cluster stays roughly in same relative position (player closing distance). Frame q_089 (t=313.00) shows character briefly turning head as horse enters denser brush; no other notable animation changes. Gait remains a walk/light trot throughout — no gallop.

**t=317.00 (q_093)** Player dismounts (character now on foot, walking on the trail; horse no longer in frame ahead of/beneath camera). No visible dismount animation frame captured — transition occurred between t=316 and t=317 [UNCERTAIN — exact dismount frame not captured at 1fps]. Weapon now visible on player's back (rifle/shotgun slung).

**t=318.00–319.00 (q_094–q_095)** Player-character walking on foot along the trail, camera in standard rear third-person follow. Horse is beside/behind character in q_094, then not visible in q_095 (may have fallen behind or been left standing) [UNCERTAIN].

**t=320.00–325.00 (q_096–q_101)** Player continues walking on foot through foggy woods; a structure (dark rectangular silhouette, consistent with a wooden cabin roofline) becomes visible in the background fog starting ~q_098 (t=322.00), growing more distinct each frame as player approaches. This matches the "Sonny cabin" location.

**t=325.00 (q_101)** On-screen subtitle appears (bottom-center, standard game subtitle style, no speaker visibly on screen): **"Not you again."** No NPC character model visible on screen at this timestamp — line appears to be voice-over/off-screen dialogue. [UNCERTAIN whether Sonny is speaking from inside the cabin, off-camera, or this is non-diegetic]

**t=326.00 (q_102)** Same subtitle "Not you again." persists onscreen; player continues approaching cabin, now clearly visible ahead through fog/trees (single-story wooden cabin, pitched tin/shingle roof, covered porch with support posts, visible clutter — crates, jugs, hanging lantern on porch).

**t=327.00–333.00 (q_103–q_109)** Subtitle clears; toast switches from "Health Core empty" to "You can rest by holding [!]..." (occurs between q_105/t=329 and q_106/t=330). Player continues walking straight toward cabin front porch, camera steady rear-follow, no cuts. Cabin details resolve further: front door centered, porch railing, hanging lantern (left side), stacked crates/boxes (both sides of porch), various jugs/bottles and a basket on the porch surface, a small round table/stool visible near left edge, an old wagon wheel leaning against the cabin's left side (visible q_108–q_112). No NPCs visible on porch or in doorway in any frame.

**t=334.00–336.00 (q_110–q_112)** Player-character walks up to the base of the porch steps, camera position essentially unchanged (fixed rear-follow), continuing straight-line approach to the cabin door.

**t=337.00 (q_113)** Player ascends the porch steps (now standing on/near the top step, closer to door).

**t=338.00 (q_114)** Player now standing directly in front of the cabin's front door (door fills most of frame center), still in exterior third-person view, standing on porch.

**t=339.00 (q_115)** **Camera shifts to a closer, canted framing over player's right shoulder, aiming at the door** — player has raised a weapon (visible shotgun/rifle barrel and hands in an aiming stance) toward the closed door. This is a distinct camera-angle change from the prior straight-behind follow cam (shoulder-cam / aim-mode framing). Interior of porch now dark/shadowed (porch roof overhang blocks light); door shows a small barred/slatted transom window above it.

**t=340.00 (q_116)** Same aim-at-door framing continues; player still aiming weapon at the closed door. **On-screen subtitle appears: "I don't want you no more!"** — no speaker visible on screen (voice presumably from Sonny, off-screen/behind door) [UNCERTAIN — speaker not visually confirmed].

**t=341.00 (q_117)** Same framing/aim held; subtitle "I don't want you no more!" persists. **New UI prompt appears bottom-right: "Break Lock [3]" over "Door"** — indicating an interactable door prompt (lock-breaking context action), button icon "3" (PC key bind, since this is a PC capture with FPS/GPU counters).

**t=342.00–344.00 (q_118–q_120)** Same held aim-at-door pose and camera framing continues across three consecutive frames; "I don't want you no more!" subtitle persists throughout; "Break Lock [3] / Door" prompt persists unchanged. No door-opening, breach, or interior reveal occurs within this window — the clip ends (t=344.00, q_120) still on this held shot of the player aiming at the locked cabin door.

## Summary of ambiguous/uncertain items
- Exact frame of horse dismount not captured (falls in the 1fps gap between q_092/t=316 and q_093/t=317).
- Speaker identity for "Not you again." (t=325–326) and "I don't want you no more!" (t=340–344) not visually confirmed — no NPC model on screen in any frame of this window; both lines are presumably Sonny's voice from inside/behind the cabin door, but this is inferred from audio content, not observed.
- Whether the "Not you again." subtitle is addressed to the player-character or is ambient/non-diegetic dialogue is not visually determinable.
