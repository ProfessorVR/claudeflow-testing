# Voice-echo fix — verification test and rollback (2026-09-18)

## What changed
Plugin `UltimateMultiplayerServicesPlugin`, module `EmbeddedVoiceChat` only (no engine file, no asset,
no map, no `.uproject` touched):

- The microphone is captured through the operating system's voice processing, which removes the
  game's own sound from the microphone (echo cancellation):
  Mac → Apple VoiceProcessingIO; Windows → Microsoft Voice Capture DSP.
- Microphone selection is fixed: the device list, the device info and "open device" now all use the
  same list, whose first entry is the OS default microphone. The game opens entry 0 at start, so it
  now uses whatever mic the OS is set to (before: always the first mic in the list, e.g. the laptop
  mic while AirPods were the default). The M-key microphone widget opens exactly the device you pick,
  and now pre-selects the mic actually in use (the old index mismatch stored the wrong device's ID).
- Device changes mid-session (plugging/unplugging a headset, switching the default output) re-bind
  the echo canceller to the new devices automatically; an unplugged chosen mic falls back to the default.
- Safety net: if the echo-cancelling capture cannot open on some machine, the game automatically falls
  back to the old capture path for that session (mic works, no echo cancellation) and logs
  `Echo-cancelling capture failed to open; falling back`.

Reviewed by an independent adversarial code review (2026-09-18); all robustness findings that could
leave a player without a microphone or hang the game were fixed before these builds.

What to look for in a log (Mac `/tmp/voice-*.log`; Windows `…\awsTutorial\Saved\Logs\awsTutorial.log`):
`[VoiceChat] Capture back-end: macOS VoiceProcessingIO (AEC)` / `Windows Voice Capture DSP (AEC)`,
`[VoiceChat] Opening capture device [0]: <your mic> … AEC: Yes`, and `LogEmbeddedVoiceChatAEC:` lines
(`opened …`, `Voice Capture DSP bound: …`). Any `LogEmbeddedVoiceChatAEC: Error` or the fallback line
means echo cancellation is NOT active on that machine — report it.

## Builds
| platform | new build | previous build (unchanged, still usable) |
|---|---|---|
| Mac | `Packaged/Mac/awsTutorial.app` | `.backups/voice-aec-20260918T161135/awsTutorial-pre-aec.app` |
| Windows (test) | `Packaged/23-aec-dev/Windows/awsTutorial.exe` (Development — writes a log; 5.6 GB incl. a 2.4 GB `.pdb` you can skip when copying) | `Packaged/22/Windows/awsTutorial.exe` |
| Windows (ship) | `Packaged/23-aec-shipping/Windows/awsTutorial.exe` (3.1 GB, same file layout as build 22; debug symbols kept in `Packaged/23-aec-shipping-symbols`) | same |
| Windows probe | `Packaged/23-aec-probe/` — `probe_win.exe acoustic speech.wav` (see PROBE-README.txt) | — |

## The test (same set-up as Test 2: two rooms, door closed)
Copy the **whole** `Packaged/23-aec-dev/Windows` folder to the Windows laptop.
Mac: `bash /tmp/voice_log_capture.sh fix-row1` (then `fix-row2`, …) — one launch per row.

| row | room B (alone, speakers) | room A (you, headset worn) | expected now |
|---|---|---|---|
| 1 | Mac on built-in speakers | Windows laptop | **no echo** (was: mild echo) |
| 2 | Windows laptop on built-in speakers | Mac | **no echo** (was: mild echo) |
| 3 | both on speakers, separate rooms | — | **no echo / no howl** (was: mild echo on both) |
| 4 | both on headsets | both | clean (control, as before) |

Also note for each row: can you hear the other person clearly (level, no choppiness)? Does the
game's own sound (music/ambience) get quieter while voice is on? — both should be "fine / no".

Optional quick check on the Windows laptop before the game (30 s, headphones unplugged):
`probe_win.exe acoustic speech.wav` from the `probe` folder → it prints `ECHO REMOVED BY THE DSP: N dB`
(20+ dB = working). The Mac equivalent was measured on the MacBook Air: 32.7 dB.

Record: row, echo yes/no, strength, anything odd. Send the Mac log names; for Windows send
`<build folder>\awsTutorial\Saved\Logs\awsTutorial.log` from the laptop.

## Rollback — three levels, fastest first
1. **No rebuild, per launch** — start the game with `-EVCEngineCapture`
   (Mac: `open awsTutorial.app --args -EVCEngineCapture`; Windows: add it to a shortcut's target).
   The game then uses the old capture path exactly as before the fix.
2. **Use the previous build** — Mac: move `awsTutorial-pre-aec.app` back to
   `Packaged/Mac/awsTutorial.app`; Windows: run build 22.
3. **Restore the source** — `rollback_voice_aec.sh <…/Source/EmbeddedVoiceChat> <project>/.backups/voice-aec-<stamp>`
   restores the module byte-for-byte (verified against an md5 manifest), then rebuild the editor target
   and repackage. **Restore the EARLIEST backup** — it holds the untouched original:
   Windows `…/awsTutorial_VoiceRPCNew_ARBv3/.backups/voice-aec-20260918T161022`,
   Mac `…/awsTutorial/.backups/voice-aec-20260918T161135` (each: source tarball, manifest, the module's
   original compiled binaries; the Mac one also holds the pre-fix app). Later `voice-aec-*` backups
   (`…T164318` Windows, `…T164321` Mac) are snapshots of the first fix version, taken when the reviewed
   version replaced it.
A console variable does the same as level 1 project-wide: `EmbeddedVoiceChat.CaptureBackend=1` under
`[ConsoleVariables]` in `Config/DefaultEngine.ini`.
