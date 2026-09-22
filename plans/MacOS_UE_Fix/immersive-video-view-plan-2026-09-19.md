# Plan: first-person "inside the video" viewing mode (2026-09-19)

**Goal (operator):** when a procedure or interview video plays in the video player, offer a view from inside the video
sphere, so the avatar's body, the floor, the ceiling and other avatars can't block any part of the footage, with a
button to return to the normal third-person view. It should also stop avatars from spoiling each other's view when
several people watch the same video.

Nothing has been built. This is a plan for review.

---

## What exists today (checked in the project, read-only)

**360 screens (BP_SC_*, one per module):**
- `360_Screen`: the mesh `Screen_360` at the actor's origin, scaled 13×, with an unlit, single-sided material
  (`MAT_360_*`) that shows the video. It is a sphere seen from the inside.
- `OrbitPivot` at the same origin. The **O** key spins the sphere through the `BPI_Orbitable` interface
  (StartOrbiting / AddOrbitInput / StopOrbiting). Each screen keeps its own `IsOrbiting?`.
- Flat screens for the other views in the same actor: `2D_Screen` / `ITV_Screen` (mesh `Screen_2D`) and
  `POV_Screen` planes, each with its own MediaSound component.
- A `Distance_Screen` spring arm (length 300) and a SceneCapture component, both used elsewhere.

**Player character (BP_FirstPersonCharacter) already has the camera plumbing:**
- `ThirdPersonCamera` on a `CameraBoom` (length 300) and a `FirstPersonCamera` at eye height, plus `FirstPersonMesh`
  (arms) and the full body mesh.
- `Set Point of View(Use First Person)`: activates one camera and hides the body from its own player
  (`SetOwnerNoSee`).
- `Set Player View Target(New View Target)`: `SetViewTargetWithBlend` on the player controller.
- `Set Camera Control Enabled(bool)`: gates mouse look.
- `Set Camera Boom Length and Offset(length, socket offset, target offset)`.

**Video player widget:** opened with **E**, closed with **Q** (now fixed). It has the play controls, the volume slider
(now working) and the Procedures / Interviews selection.

**Prior art:** `BPC_Interaction_Lecture` (the unused lecture chair) already combines `Set Player View Target` +
`Set Point of View` + a "cycle view" prompt widget. It is not placed in any level and you said it isn't needed, but it
shows the intended pattern.

---

## Two ways to do it

### Option A — a personal dome around the player (recommended)
Give the viewer their **own** copy of the video sphere, spawned only on their machine and centred on their camera at a
small radius (a few metres).

- Nothing can block the picture: the dome is nearer than the room, other avatars and the floor.
- Other players never see it: it is spawned on that client only, and never replicated.
- Several people can watch the same video, each inside their own dome, without affecting each other.
- The player stays where they are, so the audio, voice chat distances and the game's own logic don't change.
- It's the same thing the eventual VR view would need.
- The room is hidden simply by being behind a closed sphere, so no floor or ceiling has to be found and hidden.

Details: the dome uses the same mesh and material as the screen, so it shows the same video with no extra streaming or
texture work. It casts no shadows, has no collision and follows the camera.

### Option B — move the camera into the existing sphere
Place the viewer's camera at the sphere's centre in the level.

- No new asset, and it uses the real sphere.
- But the floor, ceiling and props between the camera and the sphere still block the view, so each screen would need
  a list of scenery to hide while viewing.
- Other avatars standing inside the sphere still block the picture unless they're hidden too.
- The audio listener moves to the sphere's centre, changing how the video and nearby voices sound.
- Risky per level: any new prop that intersects the sphere needs adding to the hide list.

**Recommendation: Option A.** Option B is a fallback if a real sphere-centre viewpoint is wanted for a specific room.

---

## How it behaves (operator decisions, 2026-09-19)

1. **Entering: automatic.** Immersive mode starts by itself when a chosen video begins playing, once the first frame
   is ready, so it never fades into a black screen. There is also a button, **"Immersive Mode"**, in the video player,
   directly **below the existing "Hide POV" button** (`Button_POV`). The 2D-only players have no such button, so it
   goes in the same place in their control column. The button toggles, and its label reads "Exit Immersive Mode"
   while immersed.
   - If the viewer leaves immersive mode by hand, it stays off for that video. Choosing another video starts it again.
2. **While in it: movement is locked.** Looking around with the mouse works as usual. The viewer's own body and arms
   are hidden. The video player widget stays on screen with play, pause, the volume slider and the toggle button.
3. **Leaving.** The same button, or **Q**, which also closes the video player. The view fades back to normal
   third-person and movement returns. No keyboard shortcut is added.
4. **Other players.** They see the avatar standing in place, as now. Nothing about this is sent over the network, and
   no nameplates are drawn in front of the view.
5. **360 and 180 videos.** The viewer is inside the video, looking anywhere.
6. **2D, POV and interview videos: the same button, cinema style.** The view moves to a first-person position centred
   on the picture, with everything else removed: a black surround with the video filling the view, squarely in front.
   Same button, same label.
7. **Interactions.** The settings menu (Escape), the microphone menu (M) and the speaker choice keep working while
   immersed. The O key's sphere spinning is ignored while immersed, since mouse look replaces it.
8. **Sound: centred on the viewer.** While immersed, the video plays evenly front and centre, like a cinema, wherever
   the avatar stands or faces. It goes back to coming from the screen on exit. Voice chat keeps its directions
   throughout, and the Video slider in Audio settings still sets the level.

---

## Work, in stages

**Stage 0 — decisions and a look at the room.** Confirm the decisions below and measure one screen in the editor:
sphere size, where players stand, and how the 360 material is assigned per module. Half a day.

**Stage 1 — the dome.** A small actor with the sphere mesh and a material that follows the same video as the screen,
spawned by the local player only, attached to the camera, no collision, no shadows. Verify it looks identical to the
current 360 view and hides the room. About a day.

*Cost (operator question: does a second sphere cost performance or decode the video twice?)*
- **No second decode or stream.** The media player decodes into one texture and the material samples it; the dome uses
  the same material, so it is one video drawn in two places. A second MediaPlayer must never be opened for the dome —
  that would double decoding and bandwidth.
- **One extra mesh draw**, unlit and textured, covering the screen. Naively the wall sphere would then be drawn behind
  it as well (double overdraw, which matters most on integrated GPUs).
- **Cancel it out:** hide the room's 360 sphere locally while immersed. It's invisible behind the dome anyway, so
  exactly one sphere is drawn, as today.
- **Likely a net win:** the dome is an opaque surface right in front of the camera, so occlusion culling drops most of
  the room's geometry, props, avatars and lights — the same costs the lighting work targeted.
- **Checkpoint:** measure it with the existing profiling setup (`graphics-autotune/perf/`), normal view vs immersive,
  on CHIMERA's RTX 5070 and its integrated 780M, before building the rest.

**Stage 2 — enter and exit.** The character-side logic: hide the avatar, lock movement, fade in and out, exit on Q or
the button, and make sure that closing the video, the video ending, leaving the area, or disconnecting always restores
the normal view. About a day.

**Stage 2b — the cinema version for flat videos.** The same surround, black instead of video, with a copy of the flat
screen placed squarely in front of the viewer at a comfortable size, matching the video's shape. Half a day.

**Stage 3 — the button in the video player.** An "Immersive Mode" button added below the existing "Hide POV" button
(`Button_POV`), and in the same column position for the 2D-only players, which have no POV button. It toggles, and its
label changes while immersed. Like the volume slider and the speaker row, this is done in C++ so the ~20 video player
widgets don't each need editing, and it picks up the style of the button it sits under. About a day.

**Stage 4 — multi-player check and polish.** Two machines watching the same video: confirm neither sees the other's
dome, neither blocks the other, voice chat still sounds right, and the avatars behave. Comfort options if wanted.
About a day.

**Stage 5 — operator review build (before anything ships).** A Windows Development build for the operator to look at
in both 360 and 2D. The operator is concerned that a 360 view with no floor or other landmark may be disorienting, so
the review build carries comfort aids that can be switched from the console without rebuilding:
- a faint floor disc or grid under the viewer, on or off;
- a subtle horizon line;
- dome distance and fade-in time.
Whatever the operator picks becomes the default. Half a day, plus the review.

**Stage 6 — ship it.** After the operator's approval: the Windows Shipping build, then the Mac (both apps), with
backups, as with the recent work. Half a day.

**Backups for rollback (taken 2026-09-19 17:10, before any of this):**
- Windows `.backups/pre-immersive-mode-20260919T170948` (278 files).
- Mac `.backups/pre-immersive-mode-20260919T171020` (277 files).
Both hold the sources, the configs, every video screen and widget, the character, the whole Antize menu and the editor
binaries. Builds 22-30 are untouched, so the shipped build before this work is `Packaged\30-shipping` and the current
Mac apps.

Rough total: about four to five days of work, spread over the usual build-and-test cycle.

---

## Risks and how they're handled

| Risk | Handling |
|---|---|
| The dome looks different from the wall screen (brightness, fog) | Same unlit material; disable fog and shadows on the dome; compare screenshots side by side |
| Motion sickness for some viewers | The dome doesn't move relative to the head; optionally keep a faint horizon line, and always allow instant exit |
| Getting stuck in the mode | Exit on Q, on the video ending, on leaving the area, on disconnect, and on the settings menu's "Quit to Desktop" |
| Other players see a stray sphere | The dome is spawned on the local client only, never replicated; verified with a two-machine test |
| Interaction with the menus | Tested: settings, microphone menu, speaker choice, video volume |
| Video switching while immersed | The dome follows the same video as the screen; switching updates it |

## The sound, centred (decided)

Normally a video's sound comes from the screen in the room, like a TV on a wall: stand to one side and it leans that
way, walk away and it gets quieter. While immersed it plays evenly front and centre instead, matching a picture that
surrounds the viewer, and sounding the same for everyone watching wherever they stand.

- **How:** on that machine only, the video's sound components stop being positioned in the world while immersed, and
  go back to normal on exit. Nothing is sent over the network, and other players' sound is unaffected.
- Voice chat keeps its directions the whole time, so people around you still sound like they're around you.
- The Video slider in Audio settings and the video player's own slider still set the level, as they do now.
- Restoring it is part of the same "always leave cleanly" rule as the camera: on exit, on Q, when the video ends, on
  leaving the area and on disconnect.

## Decided
Entering is automatic, with an "Immersive Mode" toggle button under "Hide POV"; movement locked; 2D and POV videos get
the cinema version under the same button; no keyboard shortcut; no nameplates in view; the sound is centred on the
viewer while immersed.
