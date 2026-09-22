# Build 35 — the two High findings fixed and verified unattended (2026-09-20, 22:53–23:18 PDT)

Order: "create extensive backups, implement the fixes for the two high items, perform extensive verification, produce a
report." Findings are H1 and H2 of `adversarial-review-mac-2026-09-20.md`. The operator was away; every runtime test
below was driven over ssh and judged from logs, thread samples and the settings file, never from a screen.

## 1. Backups (all taken before any change)

| Where | Path | Contents |
| --- | --- | --- |
| plans | `.backups/pre-highfix-20260920T225356/` | tuner masters, package scripts, `MacEngine.ini`, plugin Mac core |
| Windows project | `.backups/pre-highfix-20260920T225356/` | tuner pair, `Config/Mac/MacEngine.ini` |
| Mac project | `.backups/pre-highfix-20260920T225356/` | tuner pair, `MacEngine.ini`, **engine/**: patched `MetalRHI.cpp`, its stock original, the MetalRHI-only diff, the diff of all 15 locally modified engine files, `git status` before; **scripts/**: both Mac package scripts; **saved-config/**: the operator's three live ini files (used for the restore below) |
| Mac project | `.backups/build34-apps-20260920/apps/` | the build-34 Development and Shipping apps, runnable in place |
| plans | `engine-patches/` | the same two engine diffs plus a README (new, durable copy) |

Windows `Packaged\34-*` untouched; build 35 went to `35-dev` / `35-shipping`.

## 2. H1 — the engine patch made durable (three layers)

1. **Committed in the engine repository** on a new local branch `local/mac-engine-fixes`, one commit (`9f41a32f2`) on
   top of the detached `5.4.1 release` head, containing only `MetalRHI.cpp`; `git status` for that file is now clean and
   the working tree still carries the fix. `git switch local/mac-engine-fixes` restores it after any checkout. (The
   other 14 locally modified engine files remain uncommitted on that branch — same risk class, outside tonight's order;
   their diff is in the backups and in `engine-patches/`.)
2. **Patch file** `plans/MacOS_UE_Fix/engine-patches/MetalRHI-resolution-list.patch` with re-apply instructions.
3. **Build guard** `check_engine_patch.sh` (plans + `~/gfx_autotune/` on the Mac): passes only when the marker comment is
   present *and* the stock `/ Scale` divisions are gone. `package_mac_gfx.sh` runs it first and refuses to package
   (`ENGINE_PATCH_MISSING` in `/tmp/gfx_package_mac.out`) otherwise.

Guard tests: stock Windows engine copy → MISSING, exit 1; nonexistent path → exit 1; patched Mac engine → present, exit 0;
the Mac's stock `.orig-preresfix` → MISSING, exit 1. The real build-35 package run logged `engine patch present` first.

## 3. H2 — the tuner stops retrying after repeated finished-but-failed runs

`GraphicsAutoTuneSubsystem` (masters `38fa367d… .cpp`, `8f3eea60… .h`, identical on both projects):

* New ini keys in `[GraphicsAutoTune]`: `FinishedFailures` and `FinishedFailuresFor` (the `TuneVersion` the count belongs
  to — a new version gets a fresh chance, since it may be the fix for what failed). `MaxFinishedFailures = 3`.
* `Commit`: on success writes `FinishedFailures=0` and marks tuned as before. On a run that finished but could not be
  fully applied or saved it increments the count; on the third such run it marks the install tuned anyway
  (`TunedVersion` written) with `LastResult` saying so; otherwise `LastResult` says "will tune again next launch, N of 3".
* `Initialize`: if `TunedVersion < TuneVersion` and the count for this version has reached the bound, it records the
  permanent stand-down itself and skips — so a crash between Commit's two writes, or an older build, cannot leave the
  install retrying.
* Cancelled runs (`Attempts`) are unchanged: still three, then one launch skipped, then retry.

## 4. Builds

| Platform | Result |
| --- | --- |
| Windows 35 | Development: compiled clean (24 s), staged, exit 0. Shipping: exit 0. New strings present in the executable. |
| Mac 35 | Guard passed; cook `0 error(s)`; `DEV_EXIT=0`, `SHIP_EXIT=0`; both binaries contain the stand-down strings and the parked-unit code; `MacEngine.ini` (`r.AllowOcclusionQueries=0`) in both paks. |

## 5. Unattended runtime tests on the Mac (build 35)

Harness: `graphics-autotune/mac_runtime_test.sh` (launch with `open`, wait, `sample` the threads, read the log and the
ini, quit with SIGTERM — which the engine handles as a graceful exit, `MacPlatformMisc.cpp:2081`). Synthetic
`[GraphicsAutoTune]` states staged with `stage_gat_ini.sh`. Results and thread samples preserved in
`report/runtime-tests-2026-09-20/`.

| Test | App | Staged state | Expected | Observed |
| --- | --- | --- | --- | --- |
| T1, T1b | Dev | operator's real state (Windowed Fullscreen) | starts | **stuck in the fullscreen transition inside window creation** (`FMacWindow::UpdateFullScreenState`), before the engine initialized; SIGTERM could not exit; killed. Environment: an unattended launch cannot complete a macOS fullscreen transition on this Mac tonight. The identical path took 4 s when the operator launched at 22:05. Not a build defect; all later tests start windowed. |
| T1c | Dev | Windowed, 2880×1620 | init, no tune, clean exit | `Set CVar [[r.AllowOcclusionQueries:0]]`; `Startup: no tuning needed (TunedVersion=2)`; login map up in 0.88 s; window already at target so nothing to correct; SIGTERM → engine exit, both config files rewritten, log closed; no crash report. |
| T1d | Dev | Windowed, height **1400** (wrong on purpose) | repair corrects | `window is Windowed 2880x1400 at 0,172, wanted 2880x1620 windowed at 0,124; applying r.setres 2880x1620w (1 of 3)` → 41 ms later `window is 2880x1620 windowed at 0,124`; ini `MacWindow=reached … after 1 correction(s)`; clean exit. |
| T2 | Dev | `TunedVersion=1 FinishedFailures=3 For=2` | permanent stand-down | log `Not tuning this install any more: 3 runs finished but could not be applied or saved`; ini `TunedVersion=2`, `LastResult=stood down for good: …`, `Attempts=0`. |
| T3 | Dev | same, `For=1` (stale version) | counter ignored | `Startup: will tune in the first level with the options menu (TunedVersion=1)`; ini unchanged (`TunedVersion=1`). |
| T4 | Dev | `FinishedFailures=2 For=2` | below the bound | `will tune…`; ini unchanged. |
| T5 | Ship | tuned state, height 1400 | no freeze, repair, clean exit | sample at 50 s: game thread in the render fence (normal frame sync), **no occlusion-query wait**; ini `MacWindow=reached 2880x1620 … after 1 correction(s)`, `ResolutionSizeY=1620` saved; SIGTERM → exit, both config files rewritten; no crash report. |
| T6 | Ship | `TunedVersion=1 FinishedFailures=3 For=2` | stand-down (ini only) | ini `TunedVersion=2`, `LastResult=stood down for good…`; clean exit; no crash report. |

Notes on what the tests do not cover: the voice-chat capture only opens after the Cognito login, so the parked-unit
path was not exercised tonight (it was, four times, by the operator's own quits earlier). The one `GetResult` frame in
the T1c/T1d Development samples is the real-time GPU profiler reading its timer queries (1 of ~2 000 samples), not the
occlusion path. `LogExit: Exiting` does not appear on a SIGTERM exit — the graceful handler leaves through a shorter
path — but the config rewrite and closed log show the engine shutdown ran.

**Restore:** the operator's `GameUserSettings.ini` was put back from the 22:05 backup and verified by checksum
(`3913682d…`): Windowed Fullscreen, `TunedVersion=2`, the 22:05 `MacWindow` trace. No game process left running.

## 6. State at the end

* Masters, Windows project and Mac project agree on every changed file; the plugin tree and audio-output sources are
  untouched since build 33.
* Windows `35-dev` / `35-shipping` built, never run (Windows Shipping still untested by anyone).
* Mac `Packaged/Mac` and `Packaged/Mac-Shipping` are build 35 and passed the tests above; build 34 apps parked.
* Engine: branch `local/mac-engine-fixes` checked out with the patch committed; 14 other local modifications still
  uncommitted (listed in `engine-patches/README.md`).
* Nothing committed in the project repository, nothing pushed, distribution zips still build 30.
* Leftovers from tonight on the Mac: `/tmp/mac_runtime_test/`, `/tmp/gfx_pak_x`, three `Engine.ini.bak-*` files in the
  shared Saved/Config directory (review L6) — all harmless.

## 7. What the operator should still do

1. ~~Launch Mac build 35 once normally~~ **Done by the operator 2026-09-21 11:40–11:45:** Shipping 35 from the real
   Windowed Fullscreen start; trace `MacWindow=reached 2880x1620 windowed at 0,124 after 1 correction(s) @ 18:40:55Z`;
   `Input.ini` rewritten at the quit; no crash or ensure report. The fullscreen-start path the unattended tests could
   not take is therefore verified too.
2. Windows Shipping on CHIMERA.
3. The Medium items of the review, in the order it suggests (re-tune after occlusion-off first).
