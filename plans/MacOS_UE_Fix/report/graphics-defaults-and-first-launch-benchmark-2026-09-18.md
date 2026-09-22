# Graphics defaults and a first-launch benchmark: findings (2026-09-18)

Analysis only. Nothing in either project, build or save file was changed.

**Evidence used:**
- The true first-launch log of the fresh CHIMERA copy `awsTutorial-24-dev`: `awsTutorial-backup-2026.09.19-03.49.44.log`, launched 20:46 PDT, with no saves present.
- The second-launch log from the same copy.
- The Mac log.
- The decoded `MyOptions.sav` files from CHIMERA (24-dev and AppData) and from the Mac.
- The decoded `W_Options` option instances.
- UE 5.4.1 engine source.

## 1. Who actually sets graphics

The **Antize options menu** sets graphics, not the engine's GameUserSettings. Its assets are `Content/AntizeMenuSystem`, `W_Options` and `W_TemplateGraphic`, and they are byte-identical in the Windows and Mac projects.

How it applies settings:
- About 4 s after `FirstPersonMap` loads, the menu pushes every setting as console commands.
- On a launch with a save, the values come from `SaveGames/Settings/MyOptions.sav` (slot `/Settings/MyOptions`).
- On a first launch, each option falls back to its designer value `ButtonDefaultIndex`.
- Console-set values outrank GameUserSettings and scalability. The log proves it: *"Setting the console variable 'r.MaxAnisotropy' with 'SetByScalability' was ignored as it is lower priority than the previous 'SetByConsole'"*.

So the menu is the single source of truth. Any default or benchmark has to feed the menu, or the menu overwrites it seconds later.

### First launch today

These values come from the CHIMERA log at 03:46:28, and they match the decoded `ButtonDefaultIndex` values.

| Setting | Default applied |
|---|---|
| Display mode / resolution | `r.SetRes 1024x768wf`: Windowed Fullscreen, resolution = index 0 of the monitor's mode list |
| **Motion blur** | **`r.MotionBlurQuality 2`: "Medium", which means ON** |
| Textures / Post-process / Effects / Foliage / View distance / Shaders / GI / Reflections | menu "Medium" (sg level 1) |
| Shadows / Anti-aliasing / Anisotropy / Detail | menu "Low" (sg 1) / "Medium" / 8x / Medium |
| V-Sync / Max FPS / Resolution scale | On / Unlimited / 100 % |

## 2. Resolution: two separate problems

**(a) The menu default is the smallest resolution.**
- The menu builds its list from `GetSupportedFullscreenResolutions`, with default index 0. That index was 1024x768 on CHIMERA.
- In Windowed Fullscreen, UE sizes the window to the monitor and ignores the requested size (`SceneViewport.cpp:1426`), so the picture is not shrunk.
- The menu still shows 1024x768, and switching to Windowed or Fullscreen would use it.
- The resolution is also saved as a list index, not as WxH. On a different monitor, the same index can select a different mode.

**(b) The main problem: the game is not high-DPI aware.**

Why:
- In a game, UE turns on DPI awareness only if `[/Script/Engine.UserInterfaceSettings] bAllowHighDPIInGameMode=True` (`SlateApplication.cpp:929`).
- The engine default is False (`BaseEngine.ini:1290`), and the project does not set it.
- The shipping exe's manifest has no `dpiAware` entry.
- On the Mac, the game also needs `NSHighResolutionCapable` = true in the bundle. Both of today's bundles say **false**, taken from the project's `Build/Mac/Resources/Info.Template.plist` (the engine template is also false).

What the game actually draws:

| Machine | Panel | Game draws | Share of panel pixels |
|---|---|---|---|
| CHIMERA (2560x1600 at 150 %) | 2560x1600 | **1707x1067**; the log says `resolution: 1707x1067`, and Windows stretches it | 44 % |
| MacBook Air M4 15" (1440x932 pt, 2x) | 2880x1864 | **1440x932**; macOS doubles it | 25 % |
| Typical 1080p laptop at 125 % | 1920x1080 | 1536x864 | 64 % |
| 1080p monitor at 100 % | 1920x1080 | 1920x1080 | 100 % (already correct) |

Fixing (b) does not break the menu fix from earlier today:
- UMG divides the OS scale back out (`SGameLayerManager::GetGameViewportDPIScale`).
- ScaleToFit is ratio-based, so the UI stays 1920x1200 units on 16:10 screens.
- The only UI change is sharper text.

## 3. Motion blur

- It is on at first launch only because `Graphic_MotionBlur.ButtonDefaultIndex = 2` ("Medium"). The options are Off, Low, Medium, High and Very High, mapped to `r.MotionBlurQuality` 0–4.
- No map, camera or post-process volume overrides the motion-blur amount. I searched every `.umap` and `__ExternalActors__`.
- Existing saves on CHIMERA (24-dev and AppData) and on the Mac already have it Off. Only new installs, and the menu's **Default** button, turn it on.

## 4. Benchmark

- Nothing runs today. `LastCPUBenchmarkResult` and `LastGPUBenchmarkResult` are -1 on both machines.
- UE has a built-in benchmark: `UGameUserSettings::RunHardwareBenchmark` and `ApplyHardwareBenchmarkResults` (Synthbenchmark, about 1–3 s, CPU and GPU index mapped to sg levels 0–3). It is Blueprint-callable.
- Calling it on its own would be undone, because the menu re-applies its own values a few seconds later. Its output has to become the menu's defaults.
- **Calibration:** the thresholds in `BaseScalability.ini` are old. Almost any modern discrete GPU scores "Epic" (3), so the thresholds need tuning against the real CPU/GPU indices of CHIMERA, the Mac, and ideally one weak target laptop.
- **Why not a timed FPS run on first launch:** that session also compiles shaders and pipeline states (`Encountered a new compute PSO`) and starts CEF and the 360-video stream. All of that skews a stopwatch test. The synthetic benchmark gives the same result each time it runs.

## 5. Recommendations (each needs your go-ahead)

| # | Change | Where | Effect / risk |
|---|---|---|---|
| **P1** | `bAllowHighDPIInGameMode=True` under the existing `[/Script/Engine.UserInterfaceSettings]` block | both `Config/DefaultEngine.ini` | Native-resolution rendering. It affects **all** users. It costs GPU: 2.25x the pixels on CHIMERA and 4x on the fanless M4, so pair it with P3's resolution scale, or at first ship with a fixed Mac default of about 60 %. |
| **P1-Mac** | `NSHighResolutionCapable` false → true | Mac `Build/Mac/Resources/Info.Template.plist` | Required together with P1 on the Mac. |
| **P2** | `Graphic_MotionBlur`: ButtonDefaultIndex 2 → 0 and ButtonIndex 2 → 0 (Details panel) | `W_Options` (edit once, copy to the other project) | Motion blur off on first launch and on "Default". The menu row keeps working. |
| P2-alt | `r.DefaultFeature.MotionBlur=False` | DefaultEngine.ini | Hard off everywhere. The menu's Motion Blur row then does nothing, so hide it. Only choose this if you never want motion blur. |
| **P3** | C++ `GameInstanceSubsystem` in the `awsTutorial` module (same pattern as `GlobalVideoManagerSubsystem`) plus one Blueprint hook in `W_TemplateGraphic` where it falls back to `ButtonDefaultIndex` | new C++ file, one node | See the details below this table. |

What P3 does:
- **When it runs:** only when the save does not exist and the benchmark has never run. Existing players are untouched.
- **Benchmark:** runs `RunHardwareBenchmark` during startup, before the login screen, for about 1–3 s.
- **Menu indices:** maps each sg level to the menu's index for that option.
- **Resolution scale:** picked from the GPU index times the native pixel count.
- **Resolution:** set to the desktop resolution rather than index 0.
- **Motion blur:** Off.
- **Texture pool:** sized from VRAM.
- **Result:** the first launch uses benchmarked values, the menu shows them, and "Default" means "recommended for this PC". An "Auto-detect" button can come later.
- **If the Blueprint hook can't be placed cleanly:** the subsystem can set the same defaults on the `W_Options` template at startup, with no Blueprint edits at all.

**Order:**
1. P2 (trivial).
2. P1 + P1-Mac, with a temporary fixed Mac resolution scale.
3. P3.

Each step gets:
- backups under `.backups/`;
- an editor rebuild;
- packaging;
- a first-launch test.

To simulate a first launch, rename `Saved/SaveGames/Settings/MyOptions.sav` and `Saved/Config/<Platform>/GameUserSettings.ini`. To check the render size, run the console command `shot` and read the screenshot's pixel size.

## 6. Side findings (not requested; no action proposed)

- `sg.ResolutionQuality=0` in GameUserSettings is harmless: 0 means "project default screen percentage", which is 100 %.
- The menu's Anti-Aliasing option sends `r.PostProcessAAQuality`, which UE5 removed. Every launch logs `Command not recognized`, and only its `sg.AntiAliasingQuality` half works.
- The menu's labels are one step above UE's names. Menu "Epic" is sg 4, which UE calls Cinematic.
- Save locations:
  - **Windows Development builds:** the build folder.
  - **Windows Shipping builds:** `%LOCALAPPDATA%\awsTutorial\Saved`, which already holds a 2025 save on CHIMERA.
  - **Mac:** `~/Library/Application Support/Epic/awsTutorial/Saved`.

## Open questions for you

1. What is the target frame rate: 60, or higher?
2. What is the weakest machine this must run on, for example an integrated-graphics laptop? This sets the benchmark thresholds.
3. Should the Motion Blur row stay in the menu (P2), or should blur be removed entirely (P2-alt)?
