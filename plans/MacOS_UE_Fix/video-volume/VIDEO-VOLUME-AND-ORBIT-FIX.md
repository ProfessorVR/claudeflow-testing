# Video player volume slider + Q/O fix — as built (2026-09-19, builds 29 → 30)

> **Build 30 (current).** Two changes on top of build 29.
>
> **1. Why the build 29 slider did nothing (operator test):** in UE 5.4, `USynthComponent::Start` gives the sound the
> component's own `SoundClass`, which was None on every video component. The sound then fell back to
> `DefaultSoundClassName` (SC_Master). The `DefaultMediaSoundClassName` override in `UMediaSoundComponent::GetSoundClass`
> is never used on that path. My build 29 self-test measured the SC_Video class volume, not which class the playing
> video sounds were in.
> - **Fix:** the subsystem sets `SoundClass = SC_Video` on every MediaSoundComponent without a class when it appears in
>   the level. Components already playing are restarted, since they auto-activate at level start.
> - **Verified on CHIMERA (30-dev):**
>   - 19/19 playing video SynthSounds are in SC_Video; the rain ambience stays in SC_Master.
>   - Video slider 0.5 → SC_Video 0.5 with the others unchanged. Master 0.5 → Video 0.25.
>
> **2. A "Video" row in the settings menu's audio section (operator request):**
> - **How it's added:** C++ adds a real `W_TemplateAudio` row under Voice in every W_Options, a copy of the Voice row
>   with AudioName "Video", `SettingName` 4 and `SliderDefaultValue(Percent)` 1.0. The menu stores the value as
>   `MyAudio[4]`, seeded from GameUserSettings [VideoPlayer] Volume, which stays the source of truth.
> - **Registration:** after the row reads its value, the menu's own `GetTemplateAndApplySettings` registers it:
>   OptionsRef, Save/Cancel/Default lists, navigation and colours. Nothing in the Antize Blueprints was edited.
> - **Sync:** the row and the video player sliders move together. A change from a video player updates the row with
>   OptionsRef cleared for a moment, so the menu isn't marked as edited. It also becomes the row's Cancel point.
> - **Values:** rounded to 1 % steps, so the stored text reads back as the same value.
> - **Verified on CHIMERA:**
>   - Screenshots: the Video row sits under Voice, styled the same.
>   - A real click at the bar's middle set Video to 50 and saved 0.50.
>   - Self-test: settings row 0.40 gives video 0.40 and `MyAudio[4]=0.4`, and a newly opened video player's slider
>     sits at 0.40. Video player 0.70 moves the row to 0.70 and sets `MyAudio[4]=0.7`.
>   - The menu's `MyOptions.sav` wasn't written by the tests.
> - **Known:**
>   - Development builds log "Switch statement failed to match case" (LogScript warning) whenever the Video row
>     applies its value. The menu's mix switch has no entry 4, so it applies nothing, and the subsystem applies
>     SC_Video. Shipping doesn't log it.
>   - A Video row change is saved at once, even if the menu's Save is never pressed. Cancel still reverts it.
> - **Builds:** Windows `Packaged\30-dev` and `30-shipping` (C++ only, from the build 29 cook); CHIMERA
>   `Downloads\awsTutorial-30-dev`. Mac apps are rebuilt, with the build 29 apps in
>   `.backups/video-volume-v2-20260919T135101/apps/`.
> - **Backups:** Windows `.backups/video-volume-v2-20260919T131616` (includes W_Options, W_TemplateAudio and the menu's
>   Logics/SaveGame folders). Mac `.backups/video-volume-v2-20260919T135101`.
> - **Development-only self-tests:** `-VideoVolumeSelfTest` (full), `=open`, `=settings`.
> - **Mac, verified** (Development app, screen unlocked; a locked Mac screen stalls the game at startup, so the test
>   reports nothing): the same numbers as CHIMERA. The Video row is added and registered, settings row 0.40 gives
>   video 0.40 with `MyAudio[4]=0.4`, a video player opens at 0.40, video player 0.70 moves the row to 0.70, and 38
>   playing video sounds are in SC_Video while the 2 ambience sounds stay in SC_Master. The Mac user settings file was
>   restored to its pre-test copy.

## 1) Video player volume slider (operator: option B, "Master stays global")
- **New sound class `SC_Video`** (`/Game/AntizeMenuSystem/Sounds/ClassesAndMixes/`).
  - It's a child of the settings menu's `SC_Master`, with SC_Master's settings, so videos sound exactly as before.
  - `SC_Master`'s children are now Music, Effects, Voice and Video.
- **New sound mix `SM_Video`**: a copy of `SM_Voice` with one adjuster, on SC_Video.
- **`Config/DefaultEngine.ini`**: `DefaultMediaSoundClassName=.../SC_Video.SC_Video` (was SC_Master). Every
  MediaSound component has no class of its own, so all video audio now plays in SC_Video.
- **C++ `UVideoPlayerVolumeSubsystem`** (`Source/awsTutorial/VideoPlayerVolumeSubsystem.{h,cpp}`):
  - Pushes SM_Video in every level.
  - Links the `Slider_Volume` of every `BP_WG_*` video player in the frame it's created: it places the dot at the saved
    level and sets SC_Video when the slider moves.
  - Keeps the level in `GameUserSettings.ini [VideoPlayer] Volume` (0–1; default 1 = far right).
  - Other video players on screen follow.
  - No video player Blueprint was edited. Their own slider code (SetSoundMixClassOverride with no mix) did nothing and
    still does nothing.
- **Result:** what you hear is Master × category.
  - The settings Master scales video, music, effects and voice.
  - The video slider changes only video.
  - Music, Effects and Voice never touch video.
- **Development-only checks:** `-VideoVolumeSelfTest` and `-VideoVolumeSelfTest=open`. Both are compiled out of
  Shipping.

## 2) Q not closing the video player after using O (operator's manual fix, from `../report/orbiting-screen-manual-fix-guide-2026-09-19.md`)
- **BP_FirstPersonCharacter:** new variable `OrbitingScreen`. The O press and release nodes use it instead of
  `CurrentOrbitTarget`.
- **Verified by bytecode diff:** exactly 4 references changed (ubergraph 0xA50/0x19DF/0x1A0A/0x1A83). CurrentOrbitTarget
  now appears only in ShowFromActiveTrigger (E) and Hide Current (Q).
- **Mac:** the edited file was copied from Windows. The Mac original was byte-identical to the Windows original.

## Verified (CHIMERA, 29-dev, all 107 build files MD5-identical to the local build)

| Step | Master | Music | Effects | Voice | Video |
|---|---|---|---|---|---|
| start | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| video slider 0.5 | 1.0 | 1.0 | 1.0 | **1.0** | **0.5** |
| + settings Master 0.5 (as W_TemplateAudio applies it) | 0.5 | 0.5 | 0.5 | 0.5 | **0.25** |

- **Slider position:** the dot sits at the saved level when a player opens (1.00 = far right, then 0.50 after a
  restart). A real mouse click at the right end set 0.96 and saved it. Checked in screenshots.
- **Packaged config:** `DefaultMediaSoundClassName=…SC_Video.SC_Video` is inside the pak. SC_Video and SM_Video are
  cooked.
- **Q/O:** the operator tested it in the editor ("everything worked correctly").
- **Test residue:** removed the test value from the CHIMERA 29-dev copy (`[VideoPlayer]` section deleted).
- **Mac, Development app:** the self-test gives the same numbers (1.00 on open; video 0.5 leaves the other classes at
  1.0; Master 0.5 gives Video 0.25). The Mac user settings were restored to the exact pre-test copy
  (`~/gfx_autotune/video_volume_user_backup_20260919T130444.ini`).
- **All 4 builds** contain the code: the SC_Video path string is in both Windows exes and both Mac binaries. The Mac
  Shipping pak holds the SC_Video config line.

## Builds
- Windows: `Packaged\29-dev`, `Packaged\29-shipping` (`package_win_29.bat cook|dev|ship`).
  - CHIMERA copy: `Downloads\awsTutorial-29-dev`.
- Mac: `Packaged/Mac/awsTutorial.app`, `Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app`.
  - Previous apps: `.backups/video-volume-20260919T125658/apps/`.

## Backups
- Windows: `.backups/video-volume-20260919T124001` (28 files). Contents:
  - DefaultEngine.ini;
  - the ClassesAndMixes folder;
  - BP_FirstPersonCharacter as edited;
  - sources and editor binaries.
- Windows: `.backups/bp-firstpersoncharacter-20260919T121427` (BP before the manual edit).
- Mac: `.backups/video-volume-20260919T125658` (27 files, plus the apps).
- Mac: `.backups/bp-firstpersoncharacter-20260919T121427`.
- **Rollback:**
  - Restore those files from `files.tar`.
  - Delete `SC_Video`, `SM_Video` and `VideoPlayerVolumeSubsystem.*`.
  - Rebuild the editor.

## Not verified here
- Listening to an actual video on speakers at different slider levels (operator). The class volumes above are the
  engine's own numbers.
- The Mac video slider by mouse (SSH screenshots on the Mac can't show app windows).
