# Video player: volume slider and Q-to-close (investigation only, 2026-09-19)

> **Addendum (later on 2026-09-19): Master vs. Voice/Effects.** Verified in the engine source (`FAudioDevice::
> UpdateSoundClassProperties`: class propagation first, then every active mix's adjusters multiplied in) and in
> W_TemplateAudio (Master override: `ApplyToChildren = true`, fade 0). What you hear = **Master × category**:
> - voice chat = Master × Voice × 4 (EmbeddedVoiceChatAudio: SoundClass SC_Voice, VolumeMultiplier 4.0);
> - video = Master.
>
> Moving Master never changes the Voice/Effects/Music *settings*, but it changes how loud they sound. So a video
> slider that drives Master cannot leave voice chat at its heard 80%. A video slider for the video's own volume,
> under Master, can: SC_Video as a child of SC_Master. See the operator reply.
>
> Also found: no game sound uses SC_Effects or SC_Music except the Antize menu's own cues. Unassigned level sounds
> play in SC_Master, and one MetaSound uses the separate /Game/Audio/Classes tree, which no settings slider controls.
>
> The O-key manual fix guide is in `orbiting-screen-manual-fix-guide-2026-09-19.md`.

Nothing in the project was changed. The evidence is Kismet bytecode from a read-only headless editor run: the
Blueprints were compiled in memory with `CompileDisplaysBinaryBackend=True`, and nothing was saved. The run left no file
in Content, Config, Source or Plugins newer than a marker set just before it. That run was combined with an offline
scan of every asset's name table, plus DefaultEngine.ini and DefaultInput.ini. The dumps are in the job scratch folder
`vid_dump/`.

---

## 1) The video player's volume slider does nothing

### What it does today
All 20 video widgets built from the template have the same `Slider_Volume` wiring: BP_WG_2D_01…04 and _DBS, and the
360 widgets such as BP_WG_BilateralScar, CatPara, CHOC, CORNEA, DBS, PeriMortem, SD, TAVR and CAT_*. The bytecode was
checked in BP_WG_2D_01, BilateralScar and CatPara. The name-table scan shows the same nodes in all the others, and none
of them references any sound class or sound mix asset. BP_WG_YouTube has no volume slider.

- **Slider changed** (`BndEvt__Slider_Volume…`; in BP_WG_2D_01 the call is at `Label_0xEDC`):
  `SetSoundMixClassOverride(Mix = None, Class = None, Volume = Value × 3, Pitch 1, FadeIn 1 s, ApplyToChildren = true)`.
- **Construct** (`Label_0xE63`): `SetBaseSoundMix(None)`.
- `Sound_Button` (the speaker icon) has no click handler, so it does nothing.

### Why it does nothing
- **Both calls have empty mix and class pins, so the engine ignores them.** `SetSoundMixClassOverride` and
  `SetBaseSoundMix` return immediately when the mix is None. The template was never wired to a real mix or class.
- **Even if it were wired, nothing would route the video's audio to a separate class.** Every video MediaSound
  component (BP_2D_*, BP_SC_*, BP_ElectraPlayer) has **no sound class**. DefaultEngine.ini sets
  `DefaultMediaSoundClassName=/Game/AntizeMenuSystem/Sounds/ClassesAndMixes/SC_Master`, so all video audio plays in
  the settings menu's **Master** class.

### How the settings menu's audio sliders work (and why only Master affects video)
- **W_TemplateAudio → ChangeAudio:** calls `SetSoundMixClassOverride(SM_<row>, SC_<row>, value 0–1, fade 0,
  ApplyToChildren = true)`, then `PushSoundMixModifier(SM_<row>)`. The rows are Master, Music, Effects and Voice. The
  values are saved in the options save.
- **BP_MainMenuComponent:** BeginPlay → 2 s delay → `SetBaseSoundMix(SM_Master)`.
- **Sound class tree:** SC_Master → SC_Music, SC_Effects, SC_Voice.
  - The **Master** slider scales everything, **including video**, because video plays in SC_Master itself.
  - Music, Effects and Voice only change their own classes, so they don't affect video today.

### Also found
- The `×3` makes the slider range 0–300%. The default of 0.5 means 150%.
- The 1-second fade makes the slider feel laggy. The settings menu uses 0.
- The slider's starting value is never applied. It shows 0.5, but the audio stays at 100% until it's moved.

### Potential fixes
**A. Recommended: give video audio its own sound class and mix.**
1. Create `SC_Video` and `SM_Video`: a mix with one adjuster on SC_Video.
2. Point every video component at SC_Video with **one ini line**, `DefaultMediaSoundClassName=…/SC_Video.SC_Video`.
   This covers every MediaSound component that has no class of its own, which today is all of them. The
   alternative is setting the class on each MediaSound component in ~20 screen Blueprints.
3. In the widget template:
   - On Construct, `PushSoundMixModifier(SM_Video)`. Don't use `SetBaseSoundMix`: the game allows only one base mix,
     and SM_Master is it.
   - When the slider changes, `SetSoundMixClassOverride(SM_Video, SC_Video, Value, fade 0)`.
   - Apply the starting value on Construct.
4. Scope: 2 new assets, 1 ini line, and the same pin edits in ~20 widgets. Alternatively, make it one shared parent
   widget or function once, and call it from each widget.

**Decision for you:** should the settings menu's **Master** slider still affect video?
- **No: fully separate.** SC_Video gets no parent class, so no settings slider touches video, and only the video player
  slider controls it.
- **Yes: Master stays a global volume.** SC_Video becomes a child of SC_Master. Master × Video applies, and Music,
  Effects and Voice still don't touch video.

**B. Set the video components' volume directly.** When the slider changes, set `VolumeMultiplier` on the screen
actor's MediaSound components.
- No new assets.
- Video stays under Master.
- The value has to be re-applied whenever the player re-opens a video.
- The logic goes into ~20 widgets unless it's shared.

**C. Audio Modulation control buses.** The most flexible option, and more setup than this needs.

**Options with any fix:**
- Remember the video volume between videos (game instance) and between sessions (the save game), and set the slider
  to it when the widget opens.
- Wire `Sound_Button` as mute and unmute.
- Drop the ×3 unless the boost is wanted.

---

## 2) Q sometimes doesn't close the video player; E then Q works

### How E and Q work (BP_FirstPersonCharacter; legacy actions `Call Widget` = E, `Remove Widget` = Q)
- **E → `ShowFromActiveTrigger`:**
  1. Finds the orbit trigger the player stands in.
  2. Sets `CurrentOrbitTarget` = its screen and calls ShowScreen.
  3. Removes any old `CurrentWidget`.
  4. Creates the video widget, adds it to the screen, stores it in `CurrentWidget`, and shows the mouse cursor.
- **Q → `Hide Current`:** closes only if **`IsValid(CurrentOrbitTarget) AND IsValid(CurrentWidget)`**. Otherwise it
  jumps straight to the end and does nothing (`Jump to 0x3EC`). When both are valid, it:
  1. Removes the widget, runs CollectGarbage, pauses and closes the media, and hides the screen.
  2. Clears both variables and hides the cursor.

### Root cause (high confidence): releasing O wipes `CurrentOrbitTarget`
The **O** key (orbit, a raw key event on the character) writes the same variable:
- **O pressed:** starts orbiting the screen and sets `CurrentOrbitTarget` to that screen.
- **O released:** calls `StopOrbiting()` and then **sets `CurrentOrbitTarget` to None** (`Label_0x1A83`).

What the player does:
1. Opens a video with E.
2. Holds and releases O to look around or orbit.
3. Presses Q. The widget is still on screen, but `CurrentOrbitTarget` is empty, so the AND check fails and Q silently
   does nothing.

Pressing E runs `ShowFromActiveTrigger`, which is the only other code that sets `CurrentOrbitTarget`, so Q works again.
That matches the "E then Q" recovery exactly.

Only four places write `CurrentOrbitTarget` (O pressed, O released, E, Q), and only E and Q write `CurrentWidget`.

**How to confirm:** in a Development build, Q prints a debug line. When Q fails, it reads
`Current Orbit Target =  | Current Widget = BP_WG_…`, with the target empty.

**Related bugs on the same variable:**
- Pressing Q *while holding O* clears the target, so releasing O never calls StopOrbiting and the screen keeps
  orbiting.
- Using O at a *different* screen while a video is open retargets Q's pause and close to the wrong screen.

### Ruled out
- **A focused widget swallowing Q:** the character, widgets, screens and menu never call SetInputMode, focus or key
  overrides. E still works in the same state, so input isn't blocked.
- **A DoOnce, Gate or FlipFlop out of sync:** none exist on the E or Q paths.
- **Stacked video widgets:** E removes the old widget before creating a new one.
- **The duplicate Q mapping, "Stop Interacting":** its only handler is `BPC_Interaction_Lecture` on
  `BP_Interactable_Lecture_Chair`, and the chair is not placed or referenced anywhere. You said it isn't needed.

### Potential fixes (all in BP_FirstPersonCharacter)
1. **Root-cause fix: orbiting gets its own variable.**
   - Add `OrbitingScreen`. O pressed sets it, and O released stops orbiting that screen and clears it.
   - O no longer touches `CurrentOrbitTarget`, which then belongs only to E and Q.
   - This also fixes the two related bugs.
   - The smallest version is to delete the `CurrentOrbitTarget = None` node on O released. It's weaker, because O
     pressed would still retarget.
2. **Defensive: split the Q check.**
   - If `CurrentWidget` is valid, always remove the widget and hide the cursor.
   - Separately, if `CurrentOrbitTarget` is valid, pause and close the media and hide the screen.
   - Optionally drop `CollectGarbage`, which can hitch on every Q.
   - On its own, this closes the UI but can leave the video playing, so pair it with fix 1.
3. **Optional cleanup:**
   - Remove the unused `Stop Interacting` = Q mapping from DefaultInput.ini, and the lecture component's node.
   - Keys with two mappings, to review: H (Hide and Heal), Tab (Cycle Views and Inventory), and the gamepad left face
     button (Crouch and Interact).
4. **Separate bug on the same E/Q keys (course page):** pressing E twice in a course-page trigger creates a second
   `WG_Course_Homepage` without removing the first, so Q can't remove the orphan. The fix is an IsValid check before
   creating the page.

**Retest list after fixing:**
1. E → Q.
2. E → hold and release O → Q.
3. E → hold O → Q → release O (the screen must stop orbiting).
4. E at screen A → O at screen B → Q (A's video must close).
5. E twice → Q (only one widget).
6. E twice at the course page → Q.

### Scope note
The 2D screens (BP_2D_*) don't implement the orbit interface, so they aren't on this E/Q path; this bug concerns the
360 screens. `BP_OrbitTrigger` and the level Blueprints weren't dumped. If Q ever fails *without* O having been
touched, check those next.
