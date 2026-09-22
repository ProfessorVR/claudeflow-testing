# Speaker selection in the microphone menu — as built (2026-09-19, v2)

An **Output Device** row appears under **Input Device** in the M menu (BP_AudioInput). The first entry,
`Default: <name>`, follows the system default output, as the game always did.

No Blueprint or content asset was changed. The row is built in C++ on each menu instance, in the frame the menu opens,
as a copy of the mic row: same font, styles, sizes and refresh button. The two labels are also made equal width so
the lists line up.

v2 (operator decisions 2026-09-19): Steam's virtual Remote Play devices are hidden, and the Mac offers Default only.
v1 sources are in `src-v1-20260919/`.

## Platform behavior
- **Windows:** the other entries are the connected output devices, except Steam's virtual devices.
  - Hidden: "Speakers (Steam Streaming Speakers)", and "Speakers (Steam Streaming Microphone)", whose sound comes out
    of Steam's virtual microphone. The log still lists them, marked `[not offered]`.
  - The choice is saved in `GameUserSettings.ini [AudioOutput] DeviceId/DeviceName` and applied again at every launch
    and whenever that device reconnects.
  - The XAudio2 mixer moves its stream to the chosen device (`RequestDeviceSwap`). The engine moves the game to the new
    default whenever Windows changes it, so a chosen device is re-applied afterwards (at most 3 times per 30 s).
  - If the chosen device is unplugged, the game plays on the default and the menu shows `<name> (not connected)`.
  - A saved choice of a Steam device from an earlier build is dropped at launch.
- **Mac: Default only.** The row shows `Default: <Mac's current output>`, and the name updates when the output changes.
  - The game never changes the Mac's output device; there is no code left that sets it. Players switch speakers in the
    Sound menu, and the game and the echo canceller (VoiceProcessingIO) follow automatically.
  - Any saved choice is dropped at launch.

## Code
- `Source/awsTutorial/AudioOutputSelectorSubsystem.{h,cpp}` (new; staged in `src/`).
- `awsTutorial.Build.cs`: `AudioMixer`, `AudioMixerCore`; `CoreAudio` framework on Mac, used for reading the device
  list and listening for changes.
- EmbeddedVoiceChat plugin (`patch_plugin_core.py`, `patch_plugin_adapter.py`, staged in `../voice-aec-fix/EmbeddedVoiceChat`):
  - The Windows echo canceller binds its echo reference to the speakers the game plays on (`SetRenderEndpoint`).
  - The Windows echo canceller follows every engine device switch (`DeviceSwitchedNative`).
  - The Mac core ignores it.
- `apply_audio_output_src.py <project>` puts all of it into a project; `rollback_audio_output.sh <project> <backup>` undoes it.

## Builds (current)
- Windows: `Packaged\28-dev`, `Packaged\28-shipping` (C++-only stage from the build-26 cook, `package_win_28.bat stage`).
  - CHIMERA copy: `Downloads\awsTutorial-28-dev`. All 107 build files are MD5-identical to the local build.
  - Build 27 (v1) stays as it was.
- Mac: `Packaged/Mac/awsTutorial.app`, `Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app`.
  - v1 apps: `.backups/audio-output-v1-20260919T104904/apps/`.
  - Pre-feature apps: `.backups/audio-output-20260919T100616/apps/`.

## Backups
- Windows:
  - Pre-feature: `.backups/audio-output-20260919T085650` (81 files: sources, plugin source, editor binaries,
    BP_AudioInput, DefaultEngine/Game/Input.ini).
  - v1: `.backups/audio-output-v1-20260919T103830` (18 files).
- Mac:
  - Pre-feature: `.backups/audio-output-20260919T100616` (75 files, plus the apps).
  - v1: `.backups/audio-output-v1-20260919T104904` (17 files, plus the apps).
  - Mac user settings: `~/gfx_autotune/audio_output_user_backup_20260919T100616/`. The current file is identical to it.

## Verified
- **CHIMERA, 28-dev:**
  - The log lists both Steam devices as `[not offered]`, and Realtek as `[default] [playing]`.
  - The open list shows only `Default: Speakers (Realtek(R) Audio)` and `Speakers (Realtek(R) Audio)`.
- **CHIMERA, 27-dev (v1; the same switching code runs in v2):**
  - The row appears in the same frame as the M press, matching the mic row.
  - Choosing a device moves the game there within 50 ms and saves the choice.
  - After a restart the choice is re-applied within the first second, and the reopened menu shows it.
  - Choosing Default moves the game back and clears the choice.
- **Mac, v2 Development app:**
  - The row is added in the same frame as M.
  - The log reads `MacBook Air Speakers [default] [playing]`.
  - The game binaries contain no call that sets the Mac's output device; the only such references come from the
    engine and the voice plugin, and they set other properties.
  - The Mac settings file is unchanged.
  - Screenshots from SSH cannot show app windows without Screen Recording permission.

## Not verified here
- The Windows echo reference following a switch in a live voice session. A standalone launch has no voice capture;
  needs the operator's voice test.
- The Windows re-apply after a Windows default-device change. Not triggered, to avoid changing CHIMERA's system settings.
- 28-shipping on CHIMERA. It has the same code as 28-dev.

## Pre-existing, unchanged
- In the menu, the first click is taken by the game's mouse capture (`CapturePermanently_IncludingInitialMouseDown`);
  the second click opens a list. The same applies to the mic list.
- The Metal `ensure` at Mac startup (MetalStateCache.cpp:2359) appears in every earlier Mac run.
