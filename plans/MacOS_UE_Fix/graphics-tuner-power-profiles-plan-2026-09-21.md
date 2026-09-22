# Plan — graphics auto-tune with separate AC and battery profiles (2026-09-21)

> **Status (2026-09-21 12:40): implemented as build 36.** Masters `graphics-autotune/src/` (`14f855fc… .cpp`,
> `e6229bdd… .h`), identical on both projects. Windows `Packaged\36-dev` / `36-shipping` compiled clean and are copied
> to CHIMERA `Downloads\awsTutorial-36-dev` / `-36-shipping` (checksums verified). Mac build 36 packaged from the same
> sources. Implementation notes and what differs from the plan text:
> * The three helpers are named `ProfileGetInt` / `ProfileSetInt` / `ProfileSetString` — `GetProfileInt` and
>   `SetProfileString` collide with Win32 API macros (`GetProfileIntW`) through the Windows header the tuner includes;
>   the first Windows compile caught it.
> * Keys: `ProfileAC` / `ProfileBattery` = `rung,fps,percent`; `TunedVersion`, `Attempts`, `FinishedFailures`,
>   `FinishedFailuresFor`, `LastResult`, `LastSteps`, `LastRunUtc`, all suffixed `AC` / `Battery`;
>   `ProvisionalBattery=1` while the battery profile is derived; `Applied=AC|Battery`; plain `LastResult` /
>   `LastRunUtc` mirror the latest outcome prefixed with the profile name. `BatteryDeferrals` is deleted at startup.
> * `-NoGraphicsAutoTune` and the editor also switch the power poll off (`bDisabled`), so a disabled tuner never
>   re-arms itself on a plug/unplug.
> * Version-2 flat keys (`TunedVersion=2`, …) are left in place and ignored; `TuneVersion` is 3.
> Verification: see the end of this file (§6, appended after the Mac tests).

Ordered by the operator after the CHIMERA finding (next-phase plan §4): *the tuner should run the first time the laptop
is used on battery and the first time on AC, save settings for each, and apply the right set automatically — Windows
and macOS alike, since both cut power on battery — and on battery it should use at most Medium settings at 30 fps.*

This replaces the "postpone on battery" behaviour (BatteryDeferrals) entirely.

## 1. What exists and what changes

Today (`GraphicsAutoTuneSubsystem`, build 35): one tuned result per install, gated by `[GraphicsAutoTune] TunedVersion`;
on battery the run is postponed up to three launches and the menu defaults (1920×1080, 120 fps cap) apply meanwhile.
The tuner already owns everything a profile needs: `Commit(Rung, TargetFps, ScreenPercent)` applies a complete set of
menu rows (quality rungs, fixed rows, MaxFPS, ScreenMode, Resolution, Resolution Scale), writes the menu's save slot and
makes it the menu's "Cancel" point. **A profile is therefore just `(Rung, TargetFps, ScreenPercent)`** plus its
bookkeeping — no new persistence format for the menu's graphics array is needed.

Power detection also exists: `GfxAutoTune::IsOnBatteryPower()` — Windows `GetSystemPowerStatus().ACLineStatus`
(the engine's own function is wrong on Windows and is bypassed), macOS `FPlatformMisc::IsRunningOnBattery()`
(IOPowerSources, correct). Desktops report AC always, so they get one profile and never see the battery path.

## 2. Design

### 2.1 Profiles and state (`[GraphicsAutoTune]` in `GameUserSettings.ini`)

| Key | Meaning |
| --- | --- |
| `ProfileAC=rung,fps,percent` / `ProfileBattery=…` | the tuned profile for each power state (absent = not tuned) |
| `TunedVersionAC` / `TunedVersionBattery` | version that measured each profile (replaces `TunedVersion`) |
| `LastResultAC` / `LastResultBattery`, `LastStepsAC` / `LastStepsBattery`, `LastRunUtc…` | diagnostics per profile (Shipping has no log) |
| `AttemptsAC` / `AttemptsBattery`, `FinishedFailuresAC` / `…Battery` (+ `…For`) | the existing cancel and finished-failure bounds, per profile |
| `Applied=AC` or `Battery` | which profile the menu currently holds |
| `ProvisionalBattery=1` | the battery profile in use was derived, not measured (see 2.3) |

`TuneVersion` → 3: every install re-tunes once into the new scheme (Mac installs need it anyway after occlusion
culling was switched off — review M2).

### 2.2 Ladders

| Profile | Start rung | Targets | Frame cap at commit | Resolution steps |
| --- | --- | --- | --- | --- |
| AC (unchanged) | High | 60 at native → 30 at native → Low + lower resolution | 60 or 30 | as today |
| Battery | **Medium** | **30 fps only** at native; Low if Medium misses; then resolution steps at Low (floor 50 %) | **30** | as today |

The overlay text names the state: "Optimizing graphics for this computer (plugged in)…" / "…(on battery)…".
Everything else about a run — settle, sampling, hitch re-measure, GPU-bound test, timeouts — is unchanged;
`BeginRun` takes the profile and `FinishStep` reads `StartRung`/`bAllow60` from it instead of constants.

### 2.3 When each profile is measured, and what applies meanwhile

* **First launch, any state:** the profile for the current state is measured (after login, as today) and applied.
* **The other profile is provisional until measured:**
  * measured AC first → provisional battery = `min(ACRung, Medium)`, 30 fps, AC's resolution percent; flagged
    `ProvisionalBattery=1`; measured for real on the first battery launch (the overlay runs once more, once).
  * measured battery first → no provisional AC (an AC machine can do more, not less, and guessing upward is unsafe);
    AC keeps the battery profile applied until the first AC launch measures it. A one-line log/ini note says so.
* A power change **during a run** aborts it (settings restored, like a level change) and re-arms for the new state.
* Once both are measured, no overlay ever again for this `TuneVersion`.

### 2.4 Applying the right profile automatically

* **At launch:** the menu re-applies its save slot ~2 s after the pawn spawns (today's behaviour). Once the tuner has
  found the menu (`WaitForMenu` → found) it compares `Applied` with the current power state; if they differ and the
  needed profile exists, `ApplyProfile` sets the rows, writes the save and `MakeBackUp` — the same code path as
  `Commit` minus the measurement — and updates `Applied`. If the needed profile does not exist, the tuner runs.
* **Live, mid-session:** `Tick` polls `IsOnBatteryPower()` every 2 s. On a change (debounced 5 s — Windows flaps for a
  moment on some docks): not tuning, menu not open, pawn valid → `ApplyProfile` for the new state (or start a run if it
  is untuned). Applying a profile changes rows through the menu's own event, so the resolution/mode rows are only
  touched when they differ (`SetRowIfDifferent`), which keeps the window still on a plug/unplug.
* **The user's own menu changes:** v1 — the tuner-owned profile is re-applied at the next power change or launch, so a
  manual change survives only within the current power state (documented). v2 (small, same session if time allows):
  snapshot the menu's graphics array (`MyGraphicIndex` as a `key=value;` string) into `ProfileACRows`/`ProfileBatteryRows`
  whenever the menu's save slot is rewritten by the user (poll the slot's timestamp every 2 s) and apply the snapshot
  instead of the tuple; then manual changes persist per state.

### 2.5 Platform notes

* **macOS:** `IsRunningOnBattery()` is correct; the window repair and the Windowed commit are unaffected; a MacBook on
  battery lowers GPU clocks like Windows laptops do, so the battery ladder is the same. The Mac-only tune-version
  key from the next-phase plan is subsumed by `TuneVersion 3`.
* **Windows:** desktops (no battery) always AC → single profile. CHIMERA (2560×1600 @150 %) is the reference laptop.
* **Shipping:** every decision is written to the ini immediately (`RecordOutcome`-style flush), as tonight's
  `MacWindow=` trace is, so a Shipping run can be read afterwards: `Applied`, both profiles, both `LastResult`s.

## 3. Code changes (all in `GraphicsAutoTuneSubsystem.{h,cpp}`, masters in `plans/MacOS_UE_Fix/graphics-autotune/src/`)

1. `enum class EPowerProfile { AC, Battery }`; `struct FProfile { int32 Rung; int32 Fps; int32 Percent; }`;
   `ReadProfile/WriteProfile(EPowerProfile)`; per-profile key helpers (suffix `AC`/`Battery`) replacing the flat keys;
   `ReadFinishedFailures/WriteFinishedFailures` and `Attempts` become per-profile.
2. `Initialize`: read both profiles; decide `bPending` per current state (`TunedVersion<State> < TuneVersion` and not
   stood down); keep the `MaxAttempts`/`MaxFinishedFailures` gates per profile. Remove `BatteryDeferrals` (clear the
   key once).
3. `BeginRun(EPowerProfile)`: overlay text; `CurrentProfile`; `ApplyCandidate(StartRung, 100)`. `FinishStep`: 60-fps
   test only when `bAllow60`; first rung from the profile. `Commit`: write the profile tuple + per-profile bookkeeping,
   set `Applied`, derive the provisional battery profile when AC was just measured and battery is unmeasured.
4. `ApplyProfile(EPowerProfile)`: the row-setting half of `Commit` factored out (rows, fixed rows, MaxFPS, ScreenMode,
   Resolution, ScreenPercent, `GraphicsEdited`, `WriteGraphicsSave`, `MakeBackUp`, `Applied=`).
5. `Tick`: 2 s power poll with 5 s debounce; on change → abort a running measurement (restore) and re-arm, or
   `ApplyProfile`/start a run for the new state once the menu is present and closed.
6. Header doc comment and the `LastResult` texts; `TuneVersion = 3`.

Roughly 250 lines changed. Windows and Mac compile the same code; the only `#if PLATFORM_*` is the existing power
query.

## 4. Verification

**Windows, CHIMERA, Development then Shipping (log for Development; ini for both):**
1. Fresh state (delete the `[GraphicsAutoTune]` section and the menu save, or `TuneVersion` bump does it). **On battery:**
   first launch → overlay "on battery", ladder Medium→(Low), `ProfileBattery=…,30,…`, `Applied=Battery`, native
   resolution, 30 fps cap; `ProfileAC` absent.
2. **Plug in** while in the level → within ~7 s the AC profile is missing → overlay "plugged in", full ladder,
   `ProfileAC=…`, `Applied=AC`, cap 60 or 30 per result.
3. **Unplug** → within ~7 s rows switch to the battery profile without a run (`Applied=Battery`, cap 30, rung ≤ Medium);
   **plug in** → back to AC without a run. No overlay in either direction.
4. Relaunch on each power state → `Startup: no tuning needed`, the matching profile applied by the menu save + tuner.
5. Provisional path: fresh state, first launch **on AC** → `ProfileAC` measured, `ProfileBattery` derived
   (`ProvisionalBattery=1`, rung ≤ Medium, 30 fps); unplug → derived battery profile applied, then a battery run
   measures it and clears the flag.
6. Unplug in the middle of a measurement → run cancelled ("power source changed"), settings restored, the battery run
   starts after settle.
7. Shipping: steps 1–4 judged from the ini (`Applied`, both profiles, both `LastResult`s) and the menu's rows.

**macOS, this Air and the lab MacBook Pro:** the same seven steps (the Air runs on battery; unplugging is the switch).
Confirms the window repair is untouched by profile switches (`MacWindow=` trace unchanged after a switch).

**Desktop (this Windows PC):** always AC → one profile, no behaviour change beyond the version-3 re-tune.

## 6. Verification (2026-09-21, operator-driven, evidence from logs and the settings files)

| Machine / build | Result |
| --- | --- |
| CHIMERA, Windows **36 Development** | Operator: benchmark ran on AC and on battery (AC first), and the settings shifted correctly on plug/unplug. |
| CHIMERA, Windows **36 Shipping** | Both profiles measured and applied (AC High/60 at 12:42, battery Medium/30 at 12:49). One relaunch after plugging in "did not run"; no record of it — explained below. |
| CHIMERA, Windows **37 Shipping** (trace) | First run: trace showed *both profiles already measured → nothing to measure*: an instance still alive when the section was deleted rewrote the old section on exit (my process check had failed silently). After a verified reset: "worked across the board" — battery first launch measured, plug-in without quitting triggered the AC measurement, unplug/replug switched without a run. |
| Mac Air, **36 Shipping** | AC first (plugged in): High/30 at 13:12:44 (all rungs ≈34 ms, GPU within budget → highest rung kept); provisional battery derived; unplug without quitting → battery measured Medium/30 at 13:13:31; replug → `Applied=AC` without a run; clean quit, no crash. |
| Mac Air, **36 Development**, unattended (P1) | Battery measurement on the login map: Medium 29.0 ms p95 → Medium/30 in 7 s; rows applied, save written. Also proves the tuner reaches the options menu before login on this build. |
| Unattended stand-down cases (Mac) | `FinishedFailures<state>=3` → permanent stand-down + `TunedVersion<state>=3`; `Attempts<state>=3` → one launch skipped and reset; provisional flag reported at startup. (Cases keyed to the other power state correctly did nothing.) |

**Cost observation:** with occlusion queries off (build 34+) the Air measures ≈34 ms at every rung; on 2026-09-19, with
culling on, Low was 23.8 ms. About 10 ms per frame.

**HZB experiment (2026-09-21 13:30, Shipping 38, `[SystemSettings] r.AllowOcclusionQueries=1 r.HZBOcclusion=1`):
froze after the login button**, exactly as the review predicted — render thread in
`FGPUOcclusion::Map → FHZBOcclusionTester::MapResults → FRHIGPUTextureReadback::Lock → FMetalDynamicRHI::RHIMapStagingSurface
→ FPThreadEvent::Wait`, game thread on the render fence, 1 % CPU. So the Shipping defect is not "occlusion queries": **any
CPU wait on a Metal GPU fence never completes in this Shipping build** (query fences and staging-readback fences alike),
while presentation and everything without a fence wait work. Culling stays off on macOS until the fence signalling
path is understood; sample kept at `/tmp/ship_hzb_frozen_sample.txt` on the Mac.

**RHI-thread experiment (13:37, Shipping 38, `-norhithread` in the bundle's `UECommandLine.txt` + queries on): froze
again after login in the same query wait** — but the sample still lists a thread named `RHIThread`, so whether the flag
was honoured by the packaged launcher is unproven (`r.RHIThread.Enable` is a console *command*, not settable from an
ini; the flag was the only switch available). Sample at `/tmp/ship_norhithread_frozen_sample.txt`. Command line and
config restored afterwards.

**Correction to the cost observation (13:45):** the ≈34 ms frame times were not the cost of culling-off. Per-thread
numbers in the same runs show the GPU 2–3 ms *faster* with queries off (29.0/26.7/20.9 vs 31.9/30.2/23.1 ms on 09-19),
while every rung's wall-clock time sat on 33.3–34 ms with CPU threads under 7 ms: in a **windowed** macOS window the
frame is shown only at a display refresh and `r.VSync 0` does not lift that, so any frame over 16.7 ms reads 33.3 ms.
The tuner therefore saw every rung as equal, took the "not GPU-limited → keep the highest rung" branch and chose
High/30 on AC and Medium/30 on battery for the wrong reason. This is a tuner defect on macOS since the windowed policy
(build 33), and it is the bigger issue.

**Fix — build 39 (Mac-only, `TuneVersion` 4 on macOS, 3 on Windows):** on macOS each step is scored by the real drawing
time `max(GPU p95, CPU p95)` (both already collected) instead of the wall-clock frame time; the wall time stays in the
log and in `LastSteps` (`wall N`); a log line names the display-synced step. **Verified 13:55–13:56, Development 39,
operator-driven:** every step logged "wall-clock p95 33.x ms is display-synced (GPU …); scoring the real drawing time";
AC ladder High 29.6 → Medium 28.0 → Low 21.9 ms (distinct at last), no rung under 15 ms, High holds 30 → **High/30 by
real cost** in 21 s; provisional battery Medium/30 derived; unplug → battery run Medium 28.0 ms → **Medium/30** in 7 s;
`TunedVersionAC=4`, `TunedVersionBattery=4`, clean exit, no crash. Windows 39 compiled (no Windows change; not copied to
CHIMERA).

**Conclusion of the cheap experiments:** culling-off (`r.AllowOcclusionQueries=0`) remains the shipped macOS config — and
its cost on the login map is nil (GPU time is lower with queries off); the cost on the real level is unmeasured.
The remaining path is engine-side: a Shipping build with `bUseLoggingInShipping=true` in `awsTutorial.Target.cs` and
`UE_LOG` lines in `FMetalCommandBufferFence::Insert/Wait` (`MetalUAV.cpp:714-750`) and `FMetalRHIRenderQuery::GetResult`,
to see whether the completion handler is ever added, ever fires, and on which command buffer — one build, one launch,
about an hour. Recorded as the first item of the engine follow-up list.

**Build 37** adds `[GraphicsAutoTune] Trace1..3` (newest first): startup state and intent, menu found (+seconds after
level start, shader work state), settle gate (+seconds, shader wait), power change, profile applied. It is what turned
the "did not run" report into a finding in one launch. **Build 38** (Mac-only code) saves Windowed and the repair's size
into GameUserSettings when the repair reaches its target, so later launches start windowed (operator decision:
a manual Fullscreen from the menu is still reverted by the repair — next-phase item 0 — so launch windowed instead).

## 5. Order with the next-phase plan

Do this before the lab-MacBook test (next-phase item 2): it removes the battery deferral that would otherwise make the
MacBook's first launch look broken, and its `TuneVersion 3` supplies the Mac re-tune the review asked for (M2). It is
independent of the window-mode work (item 0) and the engine-patch packaging (items 1, 3).

Effort: one session to implement and compile both platforms, one session with CHIMERA and a Mac for the seven steps.
