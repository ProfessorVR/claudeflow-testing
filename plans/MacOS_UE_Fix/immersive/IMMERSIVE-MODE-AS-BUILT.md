# Immersive Mode — as built (2026-09-19)

Build 31-dev, Windows. `Source/awsTutorial/ImmersiveViewSubsystem.{h,cpp}` (a GameInstanceSubsystem; no Blueprint asset
was edited). Masters live in `plans/MacOS_UE_Fix/immersive/src/`, applied with `apply_immersive_src.py <project>`.

## What it does

While a video plays, the viewer watches it from inside, with nothing in the way — no avatar body, no floor, no ceiling,
no one else's avatar. It starts by itself, and the video player has an **Immersive Mode** button under **Hide POV**
that turns it off and on (the label reads "Exit Immersive Mode" while it is on).

* **360 / 180 video** — the room's own video sphere is brought around the viewer's camera. The video is decoded once
  and only one sphere is ever drawn. Other players still see it where it always was; the move is local.
* **2D, POV and interview video** — a cinema: the room's flat screen is brought in front of the viewer at eye level,
  square on, sized to the view. The black surround is the room's own 360 sphere, which is black while a flat video
  plays (see "The black screen", below).

While immersed: the viewer's own body is hidden (the character's own "Set Point of View" event), movement is locked,
mouse look is free, and the video's sound is centred on the viewer. Leaving restores all of it, and so does closing the
video player (Q), the video ending, walking to another screen, or the level changing.

## The black screen, and what it was

Cinema mode showed nothing but black for several builds. Two causes, both found by measurement rather than guesswork:

1. **The seat is inside the screen actor's own 360 sphere** (`BP_SC_*.360_Screen`, about 211 cm of room around the
   viewer at the test seat), and that sphere is black while a flat video plays. Anything outside it — the picture
   placed 450 cm ahead, the walls, the floor — cannot be seen from in there.
2. **The picture at 450 cm was also out in the room, behind a wall.**

The fix keeps that sphere exactly where it is, because a black sphere around the viewer *is* the cinema surround. The
picture is placed **inside** it: `MeasureEnclosure` returns how much room there is, the screen moves to 60 % of it, and
the picture shrinks by the same factor, so it covers the same part of the view. At the test seat: 127 cm ahead,
190 × 95 cm. A very wide screen is held to `Distance × 1.5` so it cannot run off the edges of the view. Where there is
no enclosing sphere, a black sphere is spawned around the viewer instead (`immersive.CinemaSurround`).

The picture's facing is derived from the room: these materials are one-sided, so the side that faced the room is turned
to face the viewer. Verified correct on screen — text in the video reads the right way round.

## Console (tuning during review; whatever is chosen becomes the default)

| cvar | default | what it does |
| --- | --- | --- |
| `immersive.Enable` | 1 | the whole feature |
| `immersive.AutoEnter` | 1 | start by itself when a video plays |
| `immersive.DomeRadius` | 400 | how far the 360 video sits from the viewer (cm) |
| `immersive.FadeTime` | 0.25 | fade in/out (s) |
| `immersive.CenterAudio` | 1 | centre the video's sound on the viewer |
| `immersive.BorrowRoomScreen` | 1 | bring the room's own screen around rather than drawing a copy |
| `immersive.ComfortFloor` | 1 | faint grid disc under the viewer |
| `immersive.FloorRadius` / `FloorOpacity` / `FloorDrop` | 250 / 0.25 / 90 | that disc |
| `immersive.CinemaDistance` | 450 | how far ahead the cinema picture would sit with room to spare (cm) |
| `immersive.CinemaSize` | 360 | its height at that distance (cm); width follows the video's shape |
| `immersive.CinemaHeight` | 0 | raise or lower it (cm) |
| `immersive.CinemaYaw` | 0 | facing correction (degrees) |
| `immersive.CinemaSurround` | 1 | black sphere when the seat is not already inside one |
| `immersive.Status` | — | what the mode is doing |
| `immersive.Toggle` | — | same as the button |

## Verified on CHIMERA (build 31-dev)

| Run | Result |
| --- | --- |
| `-ImmersiveTest` (360) | video surrounds the viewer, floor reference at the bottom, room restored on exit |
| `-ImmersiveTest2D` (cinema) | 190 × 95 cm picture 127 cm ahead, pure black surround, correct facing |
| enclosure measurement | `BP_SC_CAT_UCI_02.360_Screen(211)` found and fitted to |

Not testable through the probe harness: a real mouse click on the Immersive Mode button (synthetic clicks do not reach
UMG in this setup). The button's binding is exercised by `immersive.Toggle` and by hand.

## Testing notes for whoever comes next

A packaged build **ignores `-ini:Engine:[SystemSettings]:...` on the command line**. To set cvars for a packaged run,
write them into `<GameDir>/awsTutorial/Saved/Config/Windows/Engine.ini` under `[SystemSettings]` — that is honoured.
`imm_run.sh` in the job's tmp directory does this, runs the probe, and brings back the screenshot and the log.

---

## Why it was shelved — operator-observed on build 31-dev, 2026-09-19

Taken out of the project the same evening; see `plans/MacOS_UE_Fix/revert-to-build-30-plan-2026-09-19.md`. In the
operator's words: *"a permanent change in third person camera, walls popping through the sphere, and 2d harnesses as
well."* None of the three showed up in the automated runs, which looked at one seat and one screenshot each.

**1. The third-person camera never comes back.** The worst of the three: it outlives the video and the video player.
`Enter` calls the character's own `Set Point of View` with `true` and `Exit` calls it with `false`. If that Blueprint
event is a *toggle* rather than a setter, `false` restores nothing; and any path that leaves the mode without reaching
`Exit` — the widget closing on Q, a level change, the subsystem shutting down — strands the player in first person for
the rest of the session. Before anything else: read what `Set Point of View` actually does, record the camera state on
entry and put *that* back, and make `Exit` run on every teardown path, `Deinitialize` included.

**2. Walls pop through the 360 sphere.** The borrowed sphere is rescaled to `immersive.DomeRadius` (400 cm) around the
camera, but the seat has only about 211 cm of clear room, so walls, door frames and props at 250–350 cm cut through the
video. `MeasureEnclosure`, written today for cinema mode, is exactly what the sphere needs as well: fit the radius
inside the free space, or leave the sphere at its authored size and only move it to the camera.

**3. The same intrusion on the 2D screen rigs.** Room geometry cuts into the cinema view too. Today's cinema fix puts
the picture inside the enclosing sphere, which handles the wall at the test seat but not a rig or prop standing
*inside* that free radius. That probably needs an answer that does not depend on the room's geometry at all — hiding
room props while immersed, or drawing the picture and its surround so nothing can intersect them.

The common thread: every measurement was taken at one seat, in one room, while inside the mode. Whatever comes next
has to be checked at several screens, on both sides of the room, and **after leaving** the mode.
