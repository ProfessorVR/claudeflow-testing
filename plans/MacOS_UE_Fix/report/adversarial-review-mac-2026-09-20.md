# Adversarial review — the macOS system after build 34 (2026-09-20, late evening)

> **Update, same night:** H1 and H2 were fixed and verified in build 35 — see `high-fixes-verification-2026-09-20.md`.
> The Medium and Low items below are unchanged.

Read-only review; **nothing was changed**. Two passes: an independent reviewer over the four changed files with the
engine source as reference (findings marked R#), and an inspection of the Mac itself over ssh (findings marked M#). Each
finding has one recommended fix. Severity is about consequence for the shipped product, not code taste. Where a
reviewer claim was checked against the Mac's actual state and found wrong, the finding says so.

**Bottom line:** nothing found contradicts tonight's verification — build 34 runs, is trimmed, loads the level and
quits cleanly in both configurations. What the review found are (a) two silent-loss risks in the *setup* that will
bite a future session, (b) a performance debt created by the occlusion workaround that the auto-tuner has not yet
measured, and (c) robustness gaps in the window repair and tuner that only show on machines or menus unlike this one.

---

## High

### H1 (M1) — The engine patch is one `git checkout` from silently vanishing
`/Volumes/UnrealEngine/UE_5_4_1/Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp` is a plain uncommitted
working-tree modification in the engine repository (`git status` → ` M`, no stash, no branch). Any `git checkout`,
`git stash`, `git pull`, "Sync" in a Git client, or engine re-setup reverts it without a word, and the next Mac build
halves the resolution list again (`1440x932` maximum, native unselectable) — the bug the handoff warns about, with no
log line to say it happened. Both current configurations do carry the patch (`Intermediate/Build/Mac/arm64/awsTutorial/
{Development,Shipping}/MetalRHI/MetalRHI.cpp.o` built 09:41 / 09:43, after the 09:39 edit).
**Fix:** commit it on a local engine branch (`git switch -c local/metal-resolution-list` → `git commit`) so it survives
resets and shows up in `git log`, keep `git diff` of it as `plans/MacOS_UE_Fix/engine-patches/MetalRHI-resolution-list.patch`,
and add a two-line guard at the top of `package_mac_gfx.sh`: `grep -q 'Local fix 2026-09-20' …/MetalRHI.cpp || { echo
ENGINE PATCH MISSING; exit 1; }`.

### H2 (R2) — A deterministic row or save failure now makes the tuner run forever
`Commit` correctly refuses to write `TunedVersion` when a row failed to apply or the save failed (tonight's change,
matching the pre-existing save-failure behaviour). But `Attempts` is incremented by every `BeginRun`, and the stand-down
in `Initialize`/`BeginRun` clears it to 0 and returns — so an install where the failure is *deterministic* (a menu row
renamed or removed by a future AntizeMenu update; a save directory that cannot be written on a locked lab profile)
cycles forever: three launches with a 30–90 s overlay and blocked input, one launch skipped, repeat. Re-running cannot
cure it. Not reachable on this Mac today; reachable by content drift.
**Fix:** keep a separate `ApplyFailures` counter in `[GraphicsAutoTune]`; on the third finished-but-failed run write
`TunedVersion` anyway (permanent stand-down) with `LastResult` naming the row/save that failed, instead of clearing
`Attempts`.

---

## Medium

### M2 (R10) — The occlusion workaround changed the GPU cost and no install has been re-measured
`r.AllowOcclusionQueries=0` (build 34, macOS) removes GPU occlusion culling entirely on Mac. The reviewer verified that
`r.HZBOcclusion` is **not** an alternative: with queries disabled the renderer sets `bDisableQuerySubmissions`, which
also stops HZB submission (`SceneVisibility.cpp:2967-2970`), and HZB results are read through a staging-surface fence
wait of the same class as the hang; the query-less feedback path is mobile-only. What remains is frustum, distance and
precomputed visibility. The installs on this Mac were tuned to "Low, 30 fps" *with* occlusion culling
(`TunedVersion=2`); the frame cost is now higher by every occluded room's primitives, and the tuner will not
re-measure because the version has not changed. `TuneVersion` is shared with Windows, so a plain bump re-tunes every
Windows install for no reason.
**Fix:** make the tune key platform-aware (e.g. compare against `TuneVersion + 100 * PLATFORM_MAC`, or a separate
`TunedVersionMac` key) and bump it for Mac only; confirm the cost with `stat scenerendering` before/after on the
indoor level.

### M3 (R3) — The window repair rebuilds display metrics every frame for the life of the process
`RepairMacWindow` calls `FDisplayMetrics::RebuildDisplayMetrics` on every tick after the 3 s start delay, even when the
window is already right. On macOS that takes the screens mutex, opens an autorelease pool and, per display, calls
`CGDisplayCopyAllDisplayModes` (a WindowServer round trip that allocates and walks every mode), reads the localized
name and rebuilds the monitor array (`MacApplication.cpp:2224-2330`). Per-call cost unmeasured, but it is at least one
IPC per display per frame on the game thread, forever.
**Fix:** use `FSlateApplication::Get().GetCachedDisplayMetrics(Metrics)` (the cache is rebuilt on display
reconfiguration, `MacApplication.cpp:686-695`), and only when the window is found wrong; or throttle the whole check to
the tuner's `PollSeconds`.

### M4 (R4, verified) — The repair can declare success from its own request
`SWindow::MoveWindowTo` sets the cached screen position *speculatively* before the OS acts (`SWindow.cpp`, the `#if 1`
block: "sets the position speculatively, keeping Slate happy"); `FMacApplication::OnWindowDidMove` overwrites it later
from the real frame. So on the tick after a move the repair reads back its request, logs "reached", writes the ini
trace and resets the failure count — even if Cocoa clamps or refuses the frame. If the true frame then comes back
wrong, the cycle restarts and never trips the three-failure budget. Every observed run tonight did reach the true
state, so this is latent, not seen.
**Fix:** declare success only after the observed state has matched continuously for `MacWindowSettleSeconds` (a
second timestamp), and count a correction as taken only from that post-settle state.

### M5 (R5, R7) — The repair fights the user and the options menu, permanently
Any user drag or resize, or choosing Fullscreen / Windowed Fullscreen in the options menu, is a "wrong" state corrected
after one second, and because a correction that lands resets the budget, the window can never be moved, resized or
put in another mode for the life of the session — while the menu row keeps showing the mode the repair reverted. Each
correction also fires the engine's window-moved/resized handlers, which save 2880×1620 windowed into
`GameUserSettings.ini` (`GameEngine.cpp:725-756`), so the menu row, the ini and the window disagree. On top of that,
`Commit` on Mac still sets the Resolution row to the display's entry, whose command asks for a 2880×1864 windowed
window (taller than the screen), which the repair then shrinks 1–2 s later: a guaranteed grow/shrink flicker after
every commit and at every login re-apply.
**Fix:** on `PLATFORM_MAC` do not set the Resolution row at `Commit` (keep only ScreenMode = Windowed), and treat a
change the repair did not issue (state differs from the last correction's expected result, or the menu's ScreenMode row
changed since) as user intent — stop correcting until the next level or launch, and expose `gfx.MacWindowRepair 0`
through the menu.

### M6 (R1, premise corrected) — The tuner can start measuring while the repair is still mid-correction
The reviewer's version of this rested on the *stock* engine's halved resolution list (a 720×466 pt window); on this Mac
the engine is patched, so the row holds real pixels and that specific size cannot occur. The timing gap is real,
though: at login the menu re-applies its rows (observed both nights), the repair needs the window wrong for 1 s before
it corrects, and `BeginRun` waits only for menu grace 1.5 s + level grace 5 s; the moment the tuner enters
`Settling`, `RepairMacWindow` returns early (`IsTuning()`). A first launch with a stale menu save can therefore measure
in a window the repair has not yet fixed, commit, and only then be resized — settings tuned for the wrong pixel count.
**Fix:** on `PLATFORM_MAC`, make `WaitForSettle` also require `MacWindowWrongSince == 0.0 && !bMacWindowGaveUp` after the
start delay, and call `StartSettling()` again if the window's size or mode changes during `Sampling` (as is already done
for minimized).

### M7 (R6) — Multi-monitor and non-Retina displays are wrong by construction
The target is always the primary display (`PrimaryDisplayWidth/Height`, position `0,124` on it), so a game window on a
second display is dragged to the primary and sized for it. The three constants are 2× pixel values applied unscaled:
on a 1× external monitor the content starts 62 pt too low and the window is 122 pt too short.
**Fix:** pick the `FMonitorInfo` whose `DisplayRect` contains `Window->GetRectInScreen()`, define the cvars in points and
multiply by `Window->GetDPIScaleFactor()`.

### M8 (M4) — Shipping ships with the debug entitlement and ad-hoc signature
Both apps are ad-hoc signed and carry `com.apple.security.get-task-allow=true` (from `Build/Mac/Resources/
NoSandbox.entitlements`, which `ShippingSpecificMacEntitlements` also points at). Locally harmless — tonight's runs
prove it — but a zip of this app downloaded on another Mac is quarantined and Gatekeeper refuses an ad-hoc signature
("damaged / can't be opened") until the user strips the attribute or right-click-opens; and notarization rejects
`get-task-allow`. Known and accepted in `DefaultEngine.ini`'s own comment; listed because "everything is good" is only
true on this machine.
**Fix:** before any external distribution, a Developer ID certificate with `bUseAutomaticCodeSigning` and notarization;
until then, a Shipping-only entitlements file without `get-task-allow`, and the `xattr -dr com.apple.quarantine` step
written into the distribution README.

### M9 (M5) — Mac-only project files exist on the Mac alone
`Build/Mac/Resources/*.entitlements`, `Info.Template.plist` and the Mac signing lines in `DefaultEngine.ini`
(`bMacSignToRunLocally=True`, `PremadeMacEntitlements`, `ShippingSpecificMacEntitlements`) exist only in the Mac
project; the Windows project has no `Build/Mac` at all and its `DefaultEngine.ini` says `bMacSignToRunLocally=False`.
Tonight's `Config/Mac/MacEngine.ini` was deliberately put on both machines, but the older Mac-only set was not, so the
Windows project is not a complete source of truth and a Mac rebuilt from it would not sign. (`.uproject` differs only in
`EngineAssociation`, which is expected.)
**Fix:** copy `Build/Mac/Resources/` and the three `DefaultEngine.ini` lines into the Windows project (inert there) and
keep a master under `plans/MacOS_UE_Fix/`, as was done for the tuner and plugin sources.

### M10 (R8) — A parked audio unit still points its callbacks at a dead core
Between `AudioOutputUnitStop` in `DestroyUnit` and the deferred `AudioUnitUninitialize` (~0.7 s later on the device
queue), and for as long as it sits in `Parked`, the unit's input and render callbacks still carry `RefCon` = a core that
may have been deleted. Safety rests on `AudioOutputUnitStop` being synchronous with respect to VoiceProcessingIO's
private aggregate-device IO thread — the documented behaviour for AUHAL and consistent with four clean quits tonight,
but unproven for VPIO and stated nowhere in the file.
**Fix:** before parking, set `kAudioOutputUnitProperty_SetInputCallback` and `kAudioUnitProperty_SetRenderCallback` to
`{nullptr, nullptr}` (settable on a stopped unit; `ConfigureUnit` re-sets them on reuse), so a parked unit can never
call into a core.

### M11 (R9, pre-existing) — `UnitMutex` is held across the 2.5 s `AudioUnitInitialize`
`CompleteOpen` and `Rebind` hold `UnitMutex` across initialize (and uninitialize + initialize for a device change).
`Start`, `Stop`, `OpenedDevice` and `SetAsyncFailureHandler` take the same lock from the game thread, and the microphone
widget stops a stream before reopening it — so a `Stop`/`Start` during the background open or any device change stalls
the game thread for the whole initialize. Older than tonight; the parking change did not touch it.
**Fix:** create and configure into a local `AudioUnit` outside `UnitMutex` (guarded by `bCreating`), then take the lock
only to publish `Unit`/`InputDevice`/`OutputDevice`; same shape for `Rebind`.

---

## Low

### L1 (R12, partly corrected) — Budget arithmetic and the give-up reset
The reviewer's claim that leaving fullscreen takes three corrections is contradicted by the Development log: both
tonight's login re-applies went from Windowed Fullscreen to the target with **one** `r.setres` in 0.6 s. What stands:
`bMacWindowGaveUp` is cleared only when the window matches or the target string changes, so a window that becomes
*differently* wrong after a give-up never resumes, contrary to the log text "until the window or a knob changes".
**Fix:** clear `bMacWindowGaveUp` whenever the observed mode/size/position changes, and count a correction as a failure
only when the observed state did not change.

### L2 (R13) — Parked units can accumulate under a deterministic open failure
Every failed `Open` parks one more never-disposed VoiceProcessingIO instance (the reused one that failed to reconfigure
and/or the fresh one), and `TakeParkedUnit` is LIFO so the last-failed unit is tried first. A denied microphone
permission with periodic reopen attempts grows the pool by one instance per attempt for the process lifetime.
**Fix:** cap `Parked` at two; when full, fail the `Open` rather than create another instance.

### L3 (R14) — The `Extra[7]` buffers in `InputProc` protect the stack but are not usable
`mNumberBuffers` is 1 and the format is mono interleaved, so the room is never used; if a unit did honour more buffers
their `mData` would be uninitialized. The post-render checks (buffer count, channel count, data pointer, byte size,
`min(Delivered, NumFrames)`) are correct and are the real protection.
**Fix:** either drop `Extra` and keep the checks, or zero-initialize the struct and give the extra buffers scratch
`mData` so they are genuinely usable.

### L4 (R11) — The editor does not get the occlusion setting
`[SystemSettings]` is read by the game; the editor reads `[SystemSettingsEditor]` (`SystemSettings.cpp:31-32`), so
play-in-editor on the Mac still runs with occlusion queries. The comment in `MacEngine.ini` ("Development gets it too")
is true for standalone builds only. Loading of `Config/Mac/MacEngine.ini` in a packaged game was verified
(`ConfigHierarchy.h:33`, staging in `CopyBuildToStagingDirectory.Automation.cs:1258`), and nothing in
`BaseDeviceProfiles.ini` overrides the key today.
**Fix:** add the same key under `[SystemSettingsEditor]` if editor parity matters; re-check `BaseDeviceProfiles.ini`
after any engine upgrade.

### L5 (R15, unverified) — Process exit with a park job still queued
At quit a `ParkUnit` job may be mid-`AudioUnitUninitialize` on the dispatch thread while the main thread runs exit.
Four clean quits tonight (two Development, two Shipping) show no problem; the unit is simply leaked to the OS.
**Fix:** none unless a quit-time crash with a dispatch-queue stack ever appears; then park synchronously on the last
`Close()`.

### L6 (M2) — Leftovers in the shared save directory
`~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/` holds three `Engine.ini.bak-*` files from tonight's
cvar tests and `Input.ini` holds the Development console history (Development and Shipping share this directory; both
run `-installed`). Harmless; `Engine.ini` itself is clean (no `[SystemSettings]`).
**Fix:** delete the three `.bak` files.

### L7 (M3) — Cook warnings are content debt, not a Mac fault
149 cook warnings on the Mac, the same set as the Windows cook (`gfx26_package_win_cook.log`, 151): missing
`/VideoPlayer360/Sound/SoundClass_MediaPlayer` and `/VideoPlayer360/Material/2D_Mode_Material`, missing
`/Game/Hangar/vegetation/FieldGrass/...` textures and materials, a legacy reflection capture in
`/Game/EmergencyRoom/Maps/Overview` cooked non-deterministically. The two VideoPlayer360 references mean the 360 video
player's sound class and 2D material do not resolve on either platform.
**Fix:** a content pass in the editor: restore or re-point the VideoPlayer360 references, resave the Overview map's
reflection capture; not a build-side change.

### L8 (M6) — Disk and backups
`/Volumes/UnrealEngine` has 326 GB free. The project's `.backups/` now carries two 6.9 GB app sets (build 32 in
`pre-build33-…/apps`, build 33 in `build33-apps-20260920/apps`) plus older ones. Fine for now.
**Fix:** prune the parked app sets once build 34 is distributed.

---

## Verified as sound (no finding)
* Source drift: every tuner, audio-output and voice-plugin master matches both projects file for file;
  `Config/Mac/MacEngine.ini` identical on both; plugin manifests identical.
* Engine patch present in both Mac configurations (object timestamps after the edit).
* Lock order in the voice core is consistent (watch → unit → park); the async failure handler is marshalled to the game
  thread; the serial queue orders a deferred park before a later create, so a reopen reuses rather than duplicates;
  every property `ConfigureUnit` sets survives `AudioUnitUninitialize` and is re-set on reuse.
* `r.setres` and the repair agree on units and origin (content top-left, backing pixels) with
  `bAllowHighDPIInGameMode=True`, which the pak carries.
* Shipping: `UE_LOG` compiles out with no side effects; the console commands used are not `ECVF_Cheat`; the ini traces
  flush at most once per correction. `MacWindow=` trace proved the repair ran in Shipping.
* Occlusion workaround: loaded (`LogConfig: Set CVar [[r.AllowOcclusionQueries:0]]`), in both paks, verified to reach the
  level in Shipping.

## Suggested order if the fixes are taken up
H1 (ten minutes, prevents a silent regression) → M2 (re-tune, protects the shipped frame rate) → M5 + M6 + M4 (the
repair's robustness, one sitting) → H2 → M3 → M10 → the rest as convenient. M8 and M9 before any external distribution.
