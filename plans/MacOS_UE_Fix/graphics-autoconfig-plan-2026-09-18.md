# Graphics defaults + first-launch auto-tuning: implementation plan (v1, 2026-09-18)

Status: **PLAN ONLY. Nothing is applied.** Each phase needs the operator's go-ahead.

Sources:
- Findings: `report/graphics-defaults-and-first-launch-benchmark-2026-09-18.md`.
- Options-menu internals: Kismet bytecode of the AntizeMenuSystem Blueprints. They were compiled in memory by a headless editor Python run; nothing was saved. Traced notes are in session scratch `gfx/agent/antize-flow.md`.

## Operator requirements (2026-09-18)

- **R-a:** The game renders at the display's native resolution.
- **R-b:** Defaults are motion blur **Off**, Shadows **Low**, Global Illumination **Low**, Max FPS **30** and V-Sync **On**. The Motion Blur row stays in the menu.
- **R-c:** A first-launch auto-tune:
  1. Aim for 60 fps, lowering graphics settings as far as needed.
  2. If 60 is out of reach at the lowest settings, drop to 30 fps and keep native resolution.
  3. If 30 cannot be held steadily at the lowest settings, lower the resolution percentage.
  4. Never go below 30 fps.
- **R-d:** The weakest target is a laptop with integrated graphics from the last 5 years: Intel Iris Xe (2020+), AMD 680M/780M, Apple M1. iPads and phones come later.

## Interpretations to confirm

- **I-1:** R-b values become the menu's built-in defaults. They apply before tuning, if tuning is skipped, and on the menu's "Default" button. The tuner may raise Max FPS to 60. It **never raises Shadows or GI above Low**, because those two are the most expensive: GI Low turns Lumen and distance-field AO off, and Shadows Low is `sg.ShadowQuality 0`. Players can still raise them.
- **I-2:** The highest level the tuner uses for the remaining settings is the menu's "High" (sg 2). It never picks "Very High" or "Epic".
- **I-3:** At 30 fps the tuner keeps the **highest** level that holds 30 steadily. It lowers settings only as far as needed.
- **I-4:** Tuning runs once, on the first spawn into `FirstPersonMap`. It takes about 15–40 s behind an "Optimizing graphics for this computer…" overlay, with movement and look input paused. The world keeps rendering underneath, so the measurement is real.

## How the options menu works (what the plan must respect)

- `BP_MainMenuComponent` (on the local pawn):
  - **Creation:** at BeginPlay it waits 2 s, then creates **one** `W_Options` and adds it to the viewport **Hidden** (`W_OptionsRef`).
  - **Apply:** each option row's Construct runs its console command about 0.2 s later.
  - **Timing:** this is the burst seen in the log, about 3.8 s after the level loads.
  - **Lifetime:** it happens again on every level load.
- **Load:**
  - The menu calls `BP_MainMenuFunction.LoadUserSettings` on slot `/Settings/MyOptions` once, when the menu is built.
  - Each row uses `SaveGraphicIndex[row].Index` if it isn't empty, otherwise its `ButtonDefaultIndex`.
  - **Nothing is saved on a first launch.**
- **Save:** only `W_Options.SaveOptions()` saves, when the player saves or confirms edits. It writes graphics, controls, audio and UI together. It also sets `Saved? = true` on the key bindings; if that happens before the input rows have loaded their keys, bindings get wiped on the next load.
- **GameUserSettings is never used.** Every setting goes through console commands, which override GameUserSettings and scalability. The tuner must therefore go through the menu.
- **"Global Graphics" preset row (index 17):**
  - Options: Very Low … Epic, plus **Custom = 6**.
  - It only pushes a preset when the player operates it. It must end on Custom.
- **Callable entry points** (UFunctions, called from C++ through reflection):

| Entry point | Belongs to | Kind | Parameters |
|---|---|---|---|
| `ByGlobalSetting` | each row | custom event | `int32 NewButtonIndex`; applies, updates the menu's stored values and marks the row edited |
| `SetSliderValue` | slider rows | function | `double` |
| `GraphicsEdited` | Global Graphics row | custom event | none |
| `SaveOptions` | `W_Options` | function | out `bool Success?` |
| `MakeBackUp` | `W_Options` | function | none; without it, a later Cancel reverts the tune |

## Phase A: static defaults and native resolution

Small change, config and asset values only.

1. **`W_Options` option instances** (Details panel). The asset is byte-identical in both projects: edit it once, then copy it to the other project after a backup.

| Row | ButtonDefaultIndex / ButtonIndex | Result |
|---|---|---|
| `Graphic_MotionBlur` | 2 → **0** | Off |
| `Graphic_Shadow` | 2 → **1** | "Low" = sg.ShadowQuality 0 |
| `Graphic_GlobalIllumination` | 1 → **0** | "Low" = sg 0: no Lumen, no DFAO |
| `Graphic_MaxFPS` | 5 → **1** | 30 |
| `Graphic_VSync` | 1 | Enabled, unchanged |

2. **Both `Config/DefaultEngine.ini` files:** add `bAllowHighDPIInGameMode=True` to the existing `[/Script/Engine.UserInterfaceSettings]` block. UI layout is unaffected: UMG divides out the OS scale, and ScaleToFit is ratio-based.
3. **Mac `Build/Mac/Resources/Info.Template.plist`:** change `NSHighResolutionCapable` from false to true.
4. **Rollout:** back up to `.backups/graphics-defaults-<stamp>`, rebuild the editor, and package Windows 25-dev/shipping and the Mac test/Shipping apps.
5. **First-launch test:** rename `Saved/SaveGames/Settings/MyOptions.sav` and `Saved/Config/<Platform>/GameUserSettings.ini` first. Check the render size with the console command `shot`: the screenshot should be 2560x1600 on CHIMERA and 2880x1864 on the Mac.
6. **Gate before Phase B:** check `stat unit` on the Mac at Retina with the new defaults. If 30 fps doesn't hold, ship the Mac without step 3 until Phase B exists.

## Phase B: `UGraphicsAutoTuneSubsystem`

A C++ GameInstanceSubsystem in the `awsTutorial` module, the same pattern as `GlobalVideoManagerSubsystem`. No Blueprint asset edits.

### Trigger

- **First launch:** only when the slot `/Settings/MyOptions` doesn't exist and no `[GraphicsAutoTune] TunedVersion` is recorded in GameUserSettings.ini. Existing players keep their settings.
- **Manual runs:**
  - console `gfx.AutoTune.Run`
  - `-GraphicsAutoTune` to force a run (testing)
  - `-NoGraphicsAutoTune` / `gfx.AutoTune.Enable 0` as a kill switch

### Start conditions (all checked on the client)

1. The local pawn's `BP_MainMenuComponent.W_OptionsRef` is valid, plus at least 1 s so the rows and input rows have loaded.
2. Shader/pipeline precompilation has settled: `PipelineStateCache::NumActivePrecacheRequests()==0` and `FShaderPipelineCache::NumPrecompilesRemaining()==0`, waiting at most 60 s.
3. At least 5 s since the level started.
4. The options menu is not visible to the player. If the player opens it during tuning, the tuner aborts and retries on the next launch.

### Measurement

- Per-frame cost = max(game, render, RHI thread, GPU), taken from `GGameThreadTime`, `GRenderThreadTime`, `GRHIThreadTime` and `RHIGetGPUFrameCycles()` (`stat unit`).
- This ignores V-Sync and frame caps, so V-Sync stays on.
- Each step gets 2 s to settle, then a 5 s sample. **Stable** = 95th percentile ≤ 90 % of budget:
  - 60 fps: 15.0 ms
  - 30 fps: 30.0 ms
- **Metal:** Metal's GPU time comes from command-buffer timings. Verify in a Mac Shipping build. If it reads 0, fall back to presented frame time with V-Sync off during the sample.

### Settings ladder (menu indices)

**Fixed on every rung:**
- Shadows 1 (Low) and GI 0 (Low), per I-1
- Motion Blur 0 (Off)
- V-Sync 1 (On)
- Display Mode 1 (Windowed Fullscreen)
- Resolution = the row entry equal to the desktop resolution; this also fixes the misleading "1024x768"
- Global Graphics 6 (Custom)
- Gamma/FOV untouched
- Pool Size: not touched. The Textures row's linked settings already set the streaming pool.

**Tunable rows:**

| Row | High | Medium | Low |
|---|---|---|---|
| Textures | 2 | 1 | 0 |
| Anisotropy | 3 (16x) | 2 (8x) | 1 (4x) |
| Post-process | 2 | 1 | 0 |
| Anti-aliasing | 3 | 2 | 1 (kept on for temporal upscaling) |
| Effects | 2 | 1 | 0 |
| Detail | 2 | 1 | 0 |
| Foliage | 2 | 1 | 0 |
| View distance | 2 | 1 | 0 |
| Shaders | 2 | 1 | 0 |
| Reflections | 2 | 1 | 0 |

### Algorithm (R-c)

1. Measure High at 100 %. If it's stable for 60, pick High at 60 fps.
2. Otherwise try Medium, then Low, against 60. The first one that passes gives 60 fps.
3. If none passes 60, pick the highest rung whose measured p95 is ≤ 30 ms (I-3), and set Max FPS to 30. The earlier samples are reused.
4. If Low fails 30, lower the resolution percentage:
   - Estimate it as 100·√(30 ms / Low's GPU p95), limited to 50–100 %.
   - Verify, and step down 10 % until it's stable. The floor is 50 %.
   - If it's still unstable at 50 %, keep 50 % and log "below minimum spec".

### As built (2026-09-18, after the adversarial code review)

These points supersede the relevant details elsewhere in this plan.

- **Save:** the tuner writes the menu's graphics array into the menu's own save object (`W_Options.AntizeSave`) and calls `SaveGameToSlot`. It does NOT call `SaveOptions`, which would set `Saved?=true` on the key bindings and freeze them. `SaveOptions` is only a fallback.
- **Before measuring:** Display Mode is set to Windowed Fullscreen and the Resolution row to the display's resolution. A **60 fps cap** applies while measuring, because a 30 fps cap lets iGPUs clock down.
- **CPU-bound test:** uses the game and render threads only. On Metal the RHI thread blocks on GPU back-pressure. All four p95 values are logged.
- **Attempts:** at most 3 cancelled attempts, then it gives up and the menu defaults stay. A 300 s timeout keeps the best result so far. `TunedVersion` is written only when the save succeeded.
- **Aborts after the menu is gone:** r.ScreenPercentage, t.MaxFPS and r.VSync are restored by console.
- **Input:** it is restored with `EnableInput(nullptr)`.

### Commit (through the live menu)

1. Call `ByGlobalSetting(index)` on every button row. Call `SetSliderValue(pct)` and apply for Resolution Scale.
2. Call `GraphicsEdited()` on the global row.
3. Call `SaveOptions()`, then `MakeBackUp()`.
4. Record `TunedVersion=1` along with the step log in GameUserSettings.ini.

Result: the player sees the tuned values in the menu, the next launch loads them from the save, and "Default" restores the safe Phase A values.

**Trials during measurement:** these are sent as the same console commands the rows use. They are not saved until commit.

**Overlay:** a Slate widget from C++ with a progress line. Movement and look input are ignored during the run and restored afterwards, including on abort.

- **Log:** `LogGraphicsAutoTune` lines per step (rung, fps target, p95 per thread and GPU, verdict) for calibration and support.
- **Build.cs:** add `Slate`, `SlateCore`, `UMG`, `RHI` and `RenderCore`.
- **Size:** about 500–700 lines, in new files plus one Build.cs line.

## Phase C: calibration and tests

1. **CHIMERA RTX 5070 at native 2560x1600:** expected High at 60.
2. **CHIMERA forced onto its Radeon 780M iGPU** (Windows Graphics settings → power saving for the exe): this is the stand-in for the R-d floor. Record the rung, the fps target and the percentage.
3. **MacBook Air M4 at Retina:** first launch.
4. **Menu checks:**
   - The tuned values are shown in the menu.
   - A relaunch keeps them.
   - "Default" gives the Phase A values.
   - Key bindings are intact after the tuner's SaveOptions.
   - Cancel doesn't revert the tune.
5. **Frame pacing:** check 30 and 60 fps caps with V-Sync on 60 Hz and 165 Hz panels (CHIMERA is 165 Hz), and the `rhi.SyncInterval` behaviour.
6. **Integrated-graphics floor:** the older Iris Xe class (2020) still needs a real machine. Otherwise infer the margin from the 780M, which is about twice as fast.
7. **Later platforms:** iPad and phones reuse this subsystem with a mobile-renderer ladder. That is out of scope now.

## Rollback

- **Phase A:** restore `.backups/graphics-defaults-<stamp>` (W_Options.uasset, DefaultEngine.ini, Info.Template.plist).
- **Phase B:** use the kill switch without rebuilding, or delete the new source files and revert the Build.cs line.
- **Player saves:** these are only written through the menu's own SaveOptions, the same as a manual save.
