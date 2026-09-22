# Graphics defaults + first-launch auto-tune: what changed, how to test, how to roll back (2026-09-18)

Plan: `../graphics-autoconfig-plan-2026-09-18.md`. Findings: `../report/graphics-defaults-and-first-launch-benchmark-2026-09-18.md`.
Order (operator): Windows first; the Mac only after Windows is verified.

## What changed (Windows project `awsTutorial_VoiceRPCNew_ARBv3`)

| File | Change | How |
|---|---|---|
| `Content/AntizeMenuSystem/Widgets/W_Options.uasset` | Default values changed: Motion Blur 2→**0 (Off)**, Shadows 2→**1 (Low)**, Global Illumination 1→**0 (Low)**, Max FPS 5→**1 (30)**. V-Sync was already Enabled. | Headless editor Python (`evc_set_defaults.py`) with the StarterContent re-import suppressed. The decoded before/after comparison shows only these 4 rows changed, in both the Blueprint tree and the compiled tree. |
| `Config/DefaultEngine.ini` | `bAllowHighDPIInGameMode=True` added (+2 comment lines) under `[/Script/Engine.UserInterfaceSettings]`. | `apply_highdpi.sh`; CRLF kept; the diff is 3 added lines. |
| `Source/awsTutorial/GraphicsAutoTuneSubsystem.{h,cpp}` | **New** first-launch auto-tuner (GameInstanceSubsystem). | `apply_autotune_src.sh` from `src/`. |
| `Source/awsTutorial/awsTutorial.Build.cs` | One `PrivateDependencyModuleNames` line added (Slate, SlateCore, UMG, RHI, RenderCore, ApplicationCore). | `apply_autotune_src.sh`. |

Backup (taken before any edit, verified by manifest):
`<project>/.backups/graphics-autotune-20260918T224811/` holds `files.tar`, `manifest.md5` and `filelist.txt` (18 files, including the pre-change editor DLL).

Builds: `Packaged/25-dev` (Development, writes logs) and `Packaged/25-shipping`. Builds 22–24 are untouched.

## What the tuner does (first launch only)

1. **When it runs:**
   - Only on a first launch: no `/Settings/MyOptions` save and no `[GraphicsAutoTune] TunedVersion` in `Saved/Config/Windows/GameUserSettings.ini`.
   - It waits for the options menu that is built about 2 s after spawning in FirstPersonMap, then for shaders to finish compiling, and for at least 5 s after the level loads.
2. **During the run:**
   - It shows "Optimizing graphics for this computer..." and pauses movement, look and the Escape menu.
   - It sets windowed fullscreen at the display's resolution, Shadows Low, GI Low and Motion Blur Off.
   - It measures with V-Sync and the frame cap **off**, because the render thread's time includes display waits when they are on. The cost is the real frame time.
   - It measures a step once more if its median is fine but its p95 isn't (one-time shader-compile hitches).
   - V-Sync On and the chosen 60/30 cap are applied at the end.
3. **How it decides:**
   - Measures High, then Medium, then Low for 60 fps: a p95 frame cost of 15 ms or less.
   - If none holds 60: picks the highest rung that holds 30 (p95 of 30 ms or less), capped at 30.
   - If Low misses 30 and the GPU is the limit: lowers the resolution percentage, down to a floor of 50 %.
4. **How it saves:**
   - Applies the result through the menu's own rows.
   - Writes the menu's graphics array to the save. Key bindings, audio and UI are left as they were.
   - Makes the result the menu's "Cancel" point.
   - Logs every step (`LogGraphicsAutoTune`) and records `LastResult` and `LastSteps` in GameUserSettings.ini.
5. **If a run is cancelled** (menu opened, level change, 300 s timeout): the previous settings are restored. A timeout keeps the best result measured so far. After 3 cancelled runs it gives up and the menu defaults stay.

**Switches:**
- `-NoGraphicsAutoTune` or `gfx.AutoTune.Enable 0` (kill switch, no rebuild needed).
- `-GraphicsAutoTune` or the console command `gfx.AutoTune.Run` (force a run, for testing).

## How to test on Windows (CHIMERA)

1. **Simulate a first launch.** Use a **fresh copy** of `25-dev`; a Development build keeps its saves inside its own folder. Or delete that copy's `awsTutorial\Saved\SaveGames\Settings\MyOptions.sav` and `awsTutorial\Saved\Config\Windows\GameUserSettings.ini`.
2. **Log in and join as usual.** About 5–10 s after spawning, the "Optimizing graphics…" screen appears for roughly 15–40 s, then goes away.
3. **Open the menu (Escape → Graphics).** Expect:
   - Motion Blur Off, Shadows Low, GI Low, V-Sync Enabled.
   - Max FPS 60 (or 30 on a weaker GPU).
   - Resolution = the display's (2560x1600 on CHIMERA).
   - Display Mode = Windowed Fullscreen.
   - Global Graphics = Custom.
4. **Check the image is native-resolution.** Text and edges should be sharp, not stretched. For a precise check, run the console command `shot` (Development build); the screenshot in `Saved\Screenshots\` should be 2560x1600.
5. **Check persistence.** Quit and relaunch: there is no overlay the second time, and the menu shows the same values. Key bindings should still work.
6. **Check the menus and buttons still fit.** This includes "Procedures"/"Interviews", after the high-DPI change.
7. **Integrated-graphics floor:** repeat step 1 with the game forced onto the Radeon 780M. Use Windows Settings → Display → Graphics → awsTutorial.exe → Power saving, or launch with `-graphicsadapter=1`. Expect a lower rung or 30 fps.
8. **Where to read the result:** `awsTutorial\Saved\Logs\awsTutorial.log` → lines starting `LogGraphicsAutoTune`.

## Rollback

**No rebuild:** launch with `-NoGraphicsAutoTune`. The menu defaults and native resolution stay.

**Full rollback of the project:**
```
bash plans/MacOS_UE_Fix/graphics-autotune/rollback_graphics_autotune.sh \
  /mnt/c/Users/Dalton/Documents/Unreal_Projects/awsTutorial_VoiceRPCNew_ARBv3 graphics-autotune-20260918T224811
```
This restores W_Options, DefaultEngine.ini, DefaultGame.ini, the whole awsTutorial module and the pre-change editor DLL, byte-exact. It also deletes the two new source files. Then rebuild the editor and re-package if a build is needed.

**Previous builds:** `Packaged/24-dev` and `24-shipping` are unchanged.

## Automated test results on CHIMERA (2026-09-19, standalone FirstPersonMap, fresh copies)

**Important:** CHIMERA's screen was **locked** during these runs (the foreground window was LockApp). Windows throttles presentation behind the lock screen, so every run was held to about 50 fps (20 ms frames) whatever the GPU load. The absolute frame rates and the resulting 60/30 decisions are therefore **not** representative. Everything else is.

| Run | GPU | Result | What it verified |
|---|---|---|---|
| A | RTX 5070 | High@60 (older 60-cap build) | DPI-aware ("Setting process to per monitor DPI aware", monitor 2560x1600); first-launch detection; menu found; `r.SetRes 2560x1600wf`; save written with the expected values. Key bindings not frozen (`Saved?` absent = false; player saves have it true). |
| B | Radeon 780M (`-graphicsadapter=1`) | Low@30 | The ladder walks High→Medium→Low; the "highest rung holding 30" rule. |
| C | 780M with `gfx.AutoTune.TestBudgetScale 0.6` | Low@30, 70 % | The resolution path (estimate 80 % from GPU time, then 70 %); the stop rule; the slider row is written to the save. |
| D | RTX, second launch | no tuning | "no tuning needed"; the menu re-applies the saved values (70 %, V-Sync 1, 30 fps, …). |
| E / E2 / F | RTX | High@30 | These runs revealed two things. First, render-thread time includes display waits (fixed: uncapped measurement). Second, the 50 fps ceiling was the lock screen (run F logged the foreground window). |

### Valid runs (2026-09-19 morning: screen unlocked, AC power, game in the foreground — logged by `fg_launch.ps1` / `run_mac_test.sh`)

| Machine | Result | Notes |
|---|---|---|
| CHIMERA RTX 5070, 2560x1600 | **High, 30 fps, 100 %** | About 47 fps at every rung (p95 about 22–24 ms, GPU only 6–8 ms). The render thread (about 16 ms) limits the frame rate: CPU-bound content, so 60 is unreachable and 30 holds at High. |
| CHIMERA, second launch | no tuning | Saved values applied (2560x1600wf, V-Sync, 30 cap, …). |
| CHIMERA Radeon 780M | **Low, 30 fps, 70 %** | GPU-bound. The display is wired to the NVIDIA GPU, so every 780M frame is also copied across; real iGPU laptops should do better. |
| Operator, CHIMERA on battery (earlier build) | Low, 30 fps (would now be High) | The battery caps the laptop at 30 fps. It led to two changes: keep the higher rung when lower settings don't help, and postpone tuning on battery (up to 3 launches). |
| MacBook Air M4, Retina 2880x1836 | **Low, 30 fps, 50 %** | GPU-bound at native Retina (Low 57 ms GPU). 70 % → 38 ms, 60 % → 34 ms, 50 % → 31.7 ms p95 (median 30.5): it holds a 30 cap. 50 % draws the same pixel count the Mac drew before this change, with the UI now at full Retina sharpness. |
| Mac, second launch | no tuning | Saved values applied (r.ScreenPercentage 50, V-Sync, 30 cap, …). |

Engine bug found: `FWindowsPlatformMisc::IsRunningOnBattery` (UE 5.4.1) tests the battery's charge flag, not the AC line. It returns true for any plugged-in laptop with a charged battery. The tuner uses its own `GetSystemPowerStatus().ACLineStatus` check on Windows; the macOS engine function is correct.

## Mac (project `/Volumes/UnrealEngine/Unreal_Projects/awsTutorial`)

**Backup:** `.backups/graphics-autotune-20260919T061402/` holds `files.tar` and `manifest.md5` (18 files, including the pre-change editor dylib). `apps/` holds the pre-change `awsTutorial.app` and `awsTutorial-Mac-Shipping.app`, runnable as they are.

**Changes:**
- W_Options, the tuner sources and Build.cs were copied from the Windows project; they are md5-identical.
- `apply_highdpi.sh` added the DefaultEngine.ini line.
- In `Build/Mac/Resources/Info.Template.plist`, `NSHighResolutionCapable` changed to true. PlistBuddy re-sorted the keys; nothing else changed.

**Builds** (`package_mac_gfx.sh`): `Packaged/Mac/awsTutorial.app` (Development) and `Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app`. Both were verified: tuner compiled in (UTF-16 string search), `NSHighResolutionCapable` true in the built Info.plist, `bAllowHighDPIInGameMode=True` inside the pak, ad-hoc signed.

**The operator's own Mac settings before the test:**
- They are in `~/gfx_autotune/user_saved_backup_20260919T062204/` (the whole `Saved` folder).
- The two files moved aside for the first-launch test are in `moved_aside/`: MyOptions.sav from July and GameUserSettings.ini.
- To restore them, copy those two files back into `~/Library/Application Support/Epic/awsTutorial/Saved/SaveGames/Settings/` and `…/Saved/Config/Mac/`.

**Mac rollback:**
```
bash ~/gfx_autotune/rollback_graphics_autotune.sh /Volumes/UnrealEngine/Unreal_Projects/awsTutorial graphics-autotune-20260919T061402
```
Then rebuild the editor (`~/gfx_autotune/build_mac_editor.sh`), or use the pre-change apps from `.backups/…/apps/`.

Known cosmetic point: when the game runs on a GPU with no display output (the 780M on CHIMERA), the menu's resolution list falls back to its built-in 11-entry list. The Resolution label then shows a default entry. In windowed fullscreen it has no effect on the picture.
