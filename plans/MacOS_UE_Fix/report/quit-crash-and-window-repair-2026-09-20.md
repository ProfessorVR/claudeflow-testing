# Build 33 — the quit-time crash, and the macOS window repair rewritten (2026-09-20, evening)

Session boot: `HANDOFF-2026-09-20.md`. This report covers §7 items 1–4 of that handoff. Build status is at the end.

## 1. Source drift (handoff §5.5) — fixed

* Windows project: `GraphicsAutoTuneSubsystem.cpp` **and** `.h` were stale (`c44b5e745e` / `6be3498`, 2026-09-19 23:51).
  Both re-applied from the masters before anything else. Backup: Windows `.backups/graphics-resync-20260920T175020/`.
* Mac project: all four tuner/audio sources matched the masters. Engine patch (`MetalRHI.cpp`, `Local fix 2026-09-20`)
  intact, original beside it.
* **The plugin master was stale the other way round**: `plans/MacOS_UE_Fix/voice-aec-fix/EmbeddedVoiceChat/Private/Mac/
  EVCCaptureCore_Mac.cpp` (`63767e6b`) lacked the 2026-09-20 `InputChannels` overrun fix that both projects had
  (`1ab4ce6a`). The master was refreshed from the project copy before being edited. Every file under
  `voice-aec-fix/EmbeddedVoiceChat/` now matches the Windows project (checked file by file).

## 2. The quit-time crash (handoff §5.1) — diagnosed and fixed

### What the logs actually say

The stack header says `SIGSEGV at 0x3`, but that is the engine's fatal-error path. The line before it is the finding:

| Session | Fatal message | Freed pointer |
| --- | --- | --- |
| soak (70 min video, crashed on quit) | `MallocBinned2.cpp:1157` — `Attempt to GetAllocationSizeExternal an unrecognized block 0x139430000` | 64 KB-aligned |
| control2 (crashed on quit) | `MallocBinned2.cpp:1322` — `Attempt to realloc an unrecognized block 0x131050000 canary == 0xfe != 0xe3` | inside a page whose header is not the engine's |
| rdgtest | none — reached `LogExit: Exiting`, log closed | — |
| mac_login | none | — |

Both fatal messages mean the same thing: **`FMemory::Free` was handed a pointer the engine's allocator never issued.**
In the first case a large-block lookup fails; in the second the page the pointer lies in carries no engine pool header.
Neither is a small-integer overwrite (that would have faulted inside `GetPoolHeaderFromPointer` at a near-null address
with a different message), so the two Core Audio overrun fixes of the afternoon are not what this is about.

### Why

Every frame of the crash is the same: our device-watch dispatch queue → `AudioComponentInstanceDispose` (the deferred
dispose from `Close()`) → Apple `AudioToolboxCore` `DSPGraph::Graph::~Graph` → `AudioDSP` `AUAnomalyDetectionFactory`
→ `VAD3ConfigurationInterface` → **`awsTutorial!operator delete[]` → `FMemory::Free`**.

Unreal replaces the global `operator new`/`delete` (all 24 forms, `ModuleBoilerplate.h`) in the executable, and on
macOS dyld coalesces the weak libc++ definitions of those symbols onto the executable's for *every* image in the
process, Apple's frameworks included — which is why Apple's code lands in `FMemory::Free`. Apple's voice-activity
detector teardown then frees a block that did not come from `operator new` (malloc, vm_allocate, or a buffer owned by
another framework/daemon — it does not matter which). With the system allocator that is harmless; with the engine's it
is fatal. It is Apple's bug, but only visible inside a process that replaces the allocator, i.e. any UE game that
creates a VoiceProcessingIO unit.

The unit was created once per session and disposed once — at `Close()`, which in these sessions only happens at quit,
*asynchronously* on the device-watch queue. Whether the process exited before the queue got to the dispose is a race:
two sessions crashed, two exited first. Nothing about it is shutdown ordering; **every dispose of a VoiceProcessingIO
unit in this process would crash**, including a mid-session microphone re-selection (which closes and reopens the
stream).

Two pieces of evidence that `AudioUnitUninitialize` does *not* take the bad path: it runs immediately before the
dispose in the same deferred job and completed in both crashing sessions, and `Rebind()` (device changes) has always
uninitialized and re-initialized live units.

### The fix — park and reuse, never dispose (`EVCCaptureCore_Mac.cpp`)

* `DisposeUnit` is gone. `ParkUnit(AudioUnit)` stops, uninitializes, and pushes the unit onto a process-wide list
  (`FDeviceWatch::Parked`, own mutex so it can be taken under the watch lock and a core's `UnitMutex`). Still deferred
  to the device queue from `Close()` as before (stop is synchronous, so no callback can reach a closing core).
* `CreateUnit` first takes a parked unit and runs the full configuration on it (`ConfigureUnit`: EnableIO, devices,
  formats, callbacks, initialize, bypass/AGC/ducking — the same property set `Rebind()` re-applies to live units). If
  that fails the unit goes back to the park and a fresh instance is created once. A process normally holds one unit.
* Uninitializing releases the microphone and the aggregate device (the orange indicator goes out); what stays parked is
  one idle component instance.
* Log line to look for on reopen: `reusing the parked voice-processing unit`.

Also hardened, cheaply: `InputProc` no longer hands `AudioUnitRender` a bare stack `AudioBufferList` (room for eight
buffers; the returned buffer count, channel count and data pointer are checked; samples are read from wherever the
unit says they are). Not implicated in the crash — the capture format is mono — but it was the handoff's item 1.

### Upstream

Worth a Feedback Assistant report to Apple with the two stacks: `AudioComponentInstanceDispose` of a
`kAudioUnitSubType_VoiceProcessingIO` instance frees memory through `operator delete[]` that was not allocated with
`operator new[]`, which crashes any process that replaces the global allocator.

## 3. macOS window policy (handoff §5.2, §5.3, §5.4) — the watcher replaced by a state check

Decision: **windowed**, display width, content placed under the menu bar and the window's own title bar, height
stopping above the Dock. Fullscreen stays available as `gfx.MacWindowRepair 2` (only right once the options menu has
put the game there, never from launch — unchanged).

What changed in `GraphicsAutoTuneSubsystem`:

* `RepairMacWindow` no longer watches the `r.setres` cvar string. Every tick it compares the window's **actual** mode,
  size and position (as Slate caches them; on macOS `OnWindowDidMove/Resize` report the content area in pixels) with
  the target. Wrong for one second → correct it: a resize (`r.setres WxHw`) if mode or size are off, otherwise a move
  (`SWindow::MoveWindowTo` to the content origin). The engine centres a resized window (`FSceneViewport::ResizeFrame`),
  so the move follows on a later tick — about two seconds from wrong to right.
* This handles every case the old code had special states for: launch, the options menu re-applying its saved mode at
  login (same-value re-applications are visible now because the *window* changes), the tuner's commit, and knobs
  changed from the console (a new target resets the failure budget). No cooldown, no per-session cap.
* Stops after three corrections in a row that did not take (logged once) until the window or a knob changes. Never
  runs while a measurement is in progress (`IsTuning()`), never in the editor, never while minimized.
* Geometry from three measured constants (this MacBook, backing scale 2): `gfx.MacMenuBarPx` 68, `gfx.MacTitleBarPx`
  56, `gfx.MacDockPx` 120 → target `2880x1620` windowed at `0,124`. `gfx.MacWindowedTrim` is gone. The engine's work
  area is not used: `FDisplayMetrics` on macOS puts Cocoa's bottom-left `visibleFrame` origin (the Dock's height) in
  `Top`, which is the 28-vs-68 disagreement the handoff recorded.
* The tuner on macOS no longer sets the screen-mode and resolution rows when a run **starts** (it measures in the
  window the repair has put in place — native pixel density, 3 % fewer rows than the panel), and at **commit** saves
  `Windowed` (row index 0) instead of Windowed Fullscreen, so the menu and the window agree at the next launch. The
  resolution row is still set to the display's entry. Windows behaviour unchanged.

Not done from the review list, deliberately: `r.VSync`/`r.ScreenPercentage` at console priority — the options menu
itself sets every graphics value through console commands, so console priority *is* this menu system's design; the
tuner is consistent with it. `-NoGraphicsAutoTune` still does not switch the window repair off (`gfx.MacWindowRepair 0`
does); they are separate features.

## 4. Tuner correctness (handoff §5.4)

* `Commit` accumulates `bApplied &= SetRow(...)` over every row. A run whose rows did not all apply is recorded like a
  run whose save failed: `LastResult` says so, `TunedVersion` is **not** written, the next launch tunes again (with the
  existing three-attempt stand-down). Log line: `Result: … (rows applied|NOT ALL APPLIED, settings save written|FAILED)`.
* `Abort` now writes `LastResult = cancelled: <reason>` to `GameUserSettings.ini [GraphicsAutoTune]`, so a Shipping
  build's cancelled run can be diagnosed without a log.
* `TuneVersion` stays 2. Installs tuned by 2 on macOS carry Windowed Fullscreen in the save; the repair corrects that at
  login as before, so a forced re-tune of everyone was not worth thirty seconds of overlay.

## 5. Build 33

Build 33 = build 32 + everything above. C++-only, so both platforms were staged from the existing cook
(`package_win_33.bat stage`; Mac `package_mac_gfx.sh pre-build33-20260920T181239 first`, which parks the build-32
apps in `.backups/pre-build33-20260920T181239/apps/` on the Mac).

Backups taken before any change:

| Where | Path | Contents |
| --- | --- | --- |
| plans | `.backups/pre-build33-20260920T180611/` | masters as they were; the stale plugin master and the project copy it was replaced by |
| Windows project | `.backups/graphics-resync-20260920T175020/` | the stale tuner pair |
| Windows project | `.backups/pre-build33-20260920T181230/` | tuner pair + plugin Mac core, pre-edit |
| Mac project | `.backups/pre-build33-20260920T181239/` | same three files, pre-edit; `apps/` = build-32 apps |

Checksums after applying (LF-normalized; identical on masters, Windows and Mac):

```
3ab9cd0c2dec07cedb7bf90fad5fe218  GraphicsAutoTuneSubsystem.cpp
d40e94ed6d14abe1153a3d245b10ca83  GraphicsAutoTuneSubsystem.h
4a5a028c9831f89fb667fcf95281fd46  EVCCaptureCore_Mac.cpp
```

### Build status (2026-09-20, 18:14–18:22 PDT)

| Platform | Config | Result | Where |
| --- | --- | --- | --- |
| Windows | Development | compiled clean (no warnings), staged, archived, exit 0 | `Packaged\33-dev` (18:14) |
| Windows | Shipping | same, exit 0 | `Packaged\33-shipping` (18:15) |
| Mac | Development | cook `Success - 0 error(s)`, stage exit 0; binary contains the parked-unit string and the `gfx.MacMenuBarPx` cvar; no call to `AudioComponentInstanceDispose` left in the plugin core | `Packaged/Mac/awsTutorial.app` (18:18, 3.5 GB) |
| Mac | Shipping | stage exit 0, tuner compiled in, high-DPI flag and ini present | `Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app` (18:22, 3.4 GB) |

Build-32 Mac apps are parked in `.backups/pre-build33-20260920T181239/apps/` on the Mac; Windows `32-dev` / `32-shipping`
untouched. Neither build has been run by anyone yet; the distribution zips (build 30) were **not** refreshed — that
waits for the operator's verification and the Shipping tests (handoff §7.5–7.6).

## 7. Operator run of build 33 on the Mac, and the Shipping freeze (evening, 18:30–22:00)

**Development, build 33: verified by the operator.** Log `~/Library/Logs/awsTutorial/awsTutorial.log` (18:32–18:33):
the repair fired at launch (`WindowedFullscreen 2880x1836 at 0,28 → r.setres 2880x1620w`) and again after the login
re-apply (`2880x1808 at 0,-10`), each time reaching `2880x1620 windowed at 0,124` in about 0.6 s with no move needed;
the voice unit opened; the run ended `LogExit: Exiting` with the log closed — **the quit crash is gone**. Operator's
words: "trimmed perfectly".

**Shipping, build 33: froze before the level, every launch.** Shipping writes no log, so the diagnosis came from
`sample` over ssh on the frozen process (symbols are present in the Shipping binary):

* Render thread: `FDeferredShadingSceneRenderer::BeginInitViews → FGPUOcclusionSerial::AddPrimitives →
  OcclusionCullPrimitive → FMetalDynamicRHI::RHIGetRenderQueryResult(bWait=true) → FMetalRHIRenderQuery::GetResult →
  FPThreadEvent::Wait`. Game thread: `FEngineLoop::Tick → FRenderCommandFence::Wait`. Same stacks at 45 s, 75 s and
  5 min; ~30 % CPU; no GPU fault or Metal error in the unified log; screen shows the pre-level backdrop.
* `GetResult` waits 500 ms per query (`MetalRHIRenderQuery.cpp:345`) and the renderer asks again next frame for every
  primitive whose query is old enough (`SceneVisibility.cpp:2537`), so a query whose command buffer never signals
  completion turns every frame into minutes. Presentation still works (test A rendered normally), so command buffers
  in general complete — only the query fences do not, and only in Shipping.
* Experiments, one launch each, cvars set through `[SystemSettings]` in the shared
  `~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/Engine.ini` (Development and Shipping share that
  directory on this Mac — both run `-installed`):

| Test | Override | Result |
| --- | --- | --- |
| repair off | `gfx.MacWindowRepair=0` | froze, same stacks → **today's window code is not the cause** |
| A | `r.AllowOcclusionQueries=0` | **ran**: game thread in the frame limiter, render thread rendering; operator logged in, level loaded, quit normally, settings saved, **no crash report** (quit fix holds in Shipping) |
| B | `r.GPUCrashDebugging=1` (queries on) — the only Shipping-gated Metal command-buffer difference (`MetalCommandQueue.cpp:214`, `MTLCommandBufferErrorOptionEncoderExecutionStatus`) | froze, same stacks → not the cause |

* Not run: the parked build-32 Shipping app. Unnecessary after the repair-off test; no Shipping build had been run on
  either platform before tonight, so this is almost certainly as old as the Mac port.
* Root cause inside the engine is still open (why the query command-buffer fences never fire under Shipping; nothing
  in `MetalRHIRenderQuery.cpp` / `MetalUAV.cpp` is Shipping-gated and no `check()` there has a side effect).
  Candidates for a later engine session: `r.HZBOcclusion=1` as a culling-preserving alternative (untested), and
  instrumenting `FMetalCommandBufferFence::Insert` in a Shipping build.

**Shipped workaround (build 34):** `Config/Mac/MacEngine.ini` with `[SystemSettings] r.AllowOcclusionQueries=0`,
identical in both projects (master `plans/MacOS_UE_Fix/graphics-autotune/config/Mac/MacEngine.ini`). Applies to
Development too, so both configurations behave alike and the tuner measures what Shipping runs. Cost: no GPU occlusion
culling on macOS; the tuner's next measurement absorbs it.

**Also in build 34:** the window repair writes its last action to `GameUserSettings.ini [GraphicsAutoTune] MacWindow=`
immediately (`RecordMacWindow`), because the Shipping screenshot at 50 s still showed the untrimmed fullscreen window
and, with no log, nothing could say whether the repair ran. Read that key after the next Shipping run.

Checksums (LF-normalized, identical on masters, Windows, Mac): `07b5886b… GraphicsAutoTuneSubsystem.cpp`,
`bea93268… GraphicsAutoTuneSubsystem.h`, `255b4d8a… Config/Mac/MacEngine.ini`. Build-33 Mac apps parked in the Mac
project's `.backups/build33-apps-20260920/apps/`; Windows `33-dev`/`33-shipping` untouched.

**Build 34 status (21:56–22:03 PDT):** Windows `34-dev` / `34-shipping` staged, exit 0 (compile 29 s, clean). Mac cook
`Success - 0 error(s)`, `DEV_EXIT=0`, `SHIP_EXIT=0`; `Config/Mac/MacEngine.ini` with `r.AllowOcclusionQueries=0`
confirmed inside both Mac paks (UnrealPak extract). **Mac Development 34 operator-verified** at 22:01: log shows
`LogConfig: Set CVar [[r.AllowOcclusionQueries:0]]`, the repair trimmed the window at launch and after login, the level
loaded, quit reached `LogExit: Exiting`; ini trace `MacWindow=reached 2880x1620 windowed at 0,124 after 1 correction(s)`.
**Mac Shipping 34 operator-verified** at 22:04–22:07: no freeze (sample at 50 s: game thread in the frame limiter, no
query wait), `MacWindow=reached 2880x1620 windowed at 0,124 after 1 correction(s)` written 4 s after launch, level
loaded, operator: "everything looks good"; normal quit went through the engine shutdown (`Input.ini` rewritten at exit;
`GameUserSettings.ini` unchanged so not rewritten), no crash or ensure report from the Shipping process.

Note for reading Shipping runs: screenshots taken with `screencapture -x` over ssh returned the same static backdrop
frame in every state tonight — not a reliable view of the game window; use the `MacWindow=` trace and the operator.

**Still open after build 34:** Windows Shipping has never been run (the gate fix and TuneVersion 2 are Windows-relevant);
the four build-30 distribution zips are stale; the engine root cause of the Shipping occlusion-query stall.

## 6. What to verify on the Mac (operator)

1. Launch the Development app. Expect within ~5 s of the level: `macOS: display 2880x1864; window is … wanted
   2880x1620 windowed at 0,124; applying r.setres 2880x1620w (1 of 3)`, then `moving the window from … to 0,124`, then
   `window is 2880x1620 windowed at 0,124; clicks land under the pointer`.
2. Title bar fully visible under the menu bar; the bottom edge of the game (video player controls) clear of the Dock.
   If not: adjust `gfx.MacMenuBarPx` / `gfx.MacTitleBarPx` / `gfx.MacDockPx` from the console and watch it re-apply.
3. Log in. The menu re-applies its mode; the repair should correct it within ~2 s (same three lines).
4. Quit. The log must end with `LogExit: Exiting` and no `Fatal error`. Then `GameUserSettings.ini` must contain the
   windowed size, and `[GraphicsAutoTune]` the last outcome.
5. Optional: change the microphone in the options menu, so the stream closes and reopens — expect `reusing the parked
   voice-processing unit`, and voice still captured.
6. Shipping on both platforms remains untested by anyone.
