# Building awsTutorial on a Mac — from a blank machine to a verified Shipping app

Lab runbook, 2026-09-21 (awsTutorial build 44). Every command below exists in this folder; every expected line was
read from a real run on the Air or the lab MacBook Pro, except the two failure warnings quoted in §1 step 6 and §2
step 12, which are quoted from the script. The long explanations are in `SOP-UE5.4.1-Mac-Build-and-Migration.md` (section numbers
cited as SOP §n) and the engineering state in `docs/HANDOFF-2026-09-21.md`.

Time budget: one session to launch (accounts, copy, start the engine build — the build itself is 30–45 min of
machine time on an M-series chip after a 15–30 GB download), one session to migrate, package and verify.

## 0. What you need

| | |
| --- | --- |
| Mac | Apple silicon (M1–M5), macOS 15 or 26, **Xcode 16.4** installed and selected (`xcode-select -p` → `/Applications/Xcode.app/Contents/Developer`; `xcodebuild -version` → `Xcode 16.4`) |
| Disk | ~250 GB free where the engine will live (APFS; an ExFAT drive is handled by the script with a sparse bundle, SOP §2), plus ~30 GB for the project and its packages |
| Homebrew + cmake | install interactively before any unattended run (SOP §1: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`, then `brew install cmake`). The script can install them itself only in an interactive terminal |
| GitHub ↔ Epic | a GitHub account with an SSH key, linked to an Epic account, invitation to the EpicGames org accepted (`README.txt` "ONE-TIME SETUP"). Test: `git ls-remote git@github.com:EpicGames/UnrealEngine.git 5.4.1-release` prints a SHA |
| This folder | copied from the lab drive `/Volumes/KingLab/ue541-team-package/` to the Mac's internal disk (e.g. `~/Downloads/ue541-team-package/`). Verify the copy: `cd` into it and run the `PACKAGE.md5` loop in `README.txt` — it must print nothing |
| The project zip | lives in the lab-drive package folder beside the scripts (`/Volumes/KingLab/ue541-team-package/awsTutorial-src-<date>.zip`, 5.3 GB); it was made with `make-project-zip.sh` on the Mac that holds the current project (today the Air). Verify the copy: `md5 -q <zip>` must equal `cat <zip>.md5`. **`BME_Virtual_Hospital_08-25-26.zip` (in `old-zips/`) is stale** — it predates builds 25–44 (no graphics tuner, no Mac allocator shim, old voice plugin) and must not be used. Keep exactly one zip beside `run-ue541-mac.sh` or pass `UE_PROJECT_ZIP=`. The zip already carries the map choice (the level saved as `FirstPersonMap` on the Air) and the video overrides — nothing to set on a fresh migration |

## 1. Build the engine (steps 4–11 of `run-ue541-mac.sh`)

```bash
cd ~/Downloads/ue541-team-package && chmod +x *.sh masters/graphics-autotune/*.sh tools/display_survey/*.sh
UE_ENGINE_PARENT=/Volumes/UnrealEngine UE_PROJECT_ZIP="$PWD/awsTutorial-src-2026-09-21.zip" \
UE_PROJECT_DEST=/Volumes/UnrealEngine/Unreal_Projects bash ./run-ue541-mac.sh 2>&1 | tee ~/run-ue541-$(date +%Y%m%d-%H%M).log
```
(Internal-disk values, as on the lab MBP: `UE_ENGINE_PARENT=$HOME/UnrealEngine`, `UE_PROJECT_DEST=$HOME/Unreal_Projects`
here; `UE_ENGINE=$HOME/UnrealEngine/UE_5_4_1`, `UE_PROJECT_DIR=$HOME/Unreal_Projects/awsTutorial` in §3–§6. Unattended: add `UE_NONINTERACTIVE=1`
and run it under `nohup … &`; the script itself keeps the Mac awake with `caffeinate`. Exactly one zip may sit beside
the script — with two it stops and lists them; `make-project-zip.sh` parks the previous one in `old-zips/`.)

Answer the prompts (or add `UE_NONINTERACTIVE=1`). Leave the terminal open or start it under `nohup … &` /
`caffeinate` — the script already runs the builds under `caffeinate`. What you will see, and what it means:

| Step | Expected line | If not |
| --- | --- | --- |
| 0 | `Xcode 16.4 (expected)` | select Xcode 16.4; another major version needs different patches |
| 2 | `Rosetta 2 present.` (or it installs it) | without Rosetta the built editor aborts with `Bad CPU type in executable` |
| 4 | `EpicGames access confirmed.` | fix the GitHub↔Epic link; the script prints the exact steps |
| 5 | `Cloning (shallow)…` then `Engine already present` on re-runs | |
| 6 | `6a … applied`, `6b …`, … `6f …`, **`6g MetalRHI resolution list applied.`**, **`6h WebBrowserSingleton CEF fallback applied.`**, `engine patch present: …/MetalRHI.cpp`, `6g/6h verified; outcomes: 6a=applied 6b=applied … 6h=applied (recorded in …/.ue541_fix_backups/APPLIED.txt)` (`present` on a re-run) | an anchor or patch that does not apply stops the run here — the engine tree is not plain 5.4.1; on a tree patched or edited before, 6a reports `present-modified` (SDK 16 accepted) or `unverified` (no evidence, but a built editor exists) and continues |
| 7 | `Setup.sh` downloads dependencies (idempotent, resumable; `--force` is passed automatically when non-interactive) | |
| 8 | `UBT rebuilt` | required after the `.cs` edits of 6a/6b |
| 10 | `UnrealEditor built.` — the long step | re-run the script to resume an interrupted build |
| 11 | no line of its own (Build.sh output only) | a failure warns `ShaderCompileWorker build failed` — the editor cannot compile shaders without it |

Engine log of the compile itself: `~/Library/Logs/Unreal Engine/LocalBuildLogs/`. Backups of every edited engine
file and the applied set: `<engine>/.ue541_fix_backups/` (`APPLIED.txt`).

Standing rule (SOP §3): never `git checkout` / `git stash` inside the engine on a build volume. The fixes are
working-tree edits; a checkout reverts them silently. The guard catches it (`ENGINE_PATCH_MISSING`); step 6 re-applies.

## 2. Migrate the project (steps 12–13)

The same run continues, or with the engine already built:

```bash
UE_SKIP_ENGINE=1 UE_NONINTERACTIVE=1 UE_ENGINE_PARENT=/Volumes/UnrealEngine \
UE_PROJECT_ZIP=~/Downloads/ue541-team-package/awsTutorial-src-2026-09-21.zip \
UE_PROJECT_DEST=/Volumes/UnrealEngine/Unreal_Projects bash ./run-ue541-mac.sh
```

Re-running is safe: a project extracted from this very zip is recognized (`.migrated-from` marker) and kept, so only
steps 12b, 12c and an incremental step 13 run (~10 s on the lab MBP). A *different* zip moves the old project aside
to `awsTutorial_superseded_<stamp>` (never deleted). `UE_KEEP_EXISTING=1` keeps whatever is there regardless.

| Step | Expected line | If not |
| --- | --- | --- |
| 4–11 skipped | `Engine binaries found.` then `engine patch present` | `ENGINE_PATCH_MISSING` → run once without `UE_SKIP_ENGINE=1` |
| 12 | `Extracting awsTutorial -> …`, `Set EngineAssociation to the local source engine.` — or, on a re-run, `Project at … was extracted from this very zip … — keeping it (resume).` | a warning `is already occupied by a different project/zip — moving it aside` means the zip changed since the last run |
| 12b | `[ok]`/`[FIX]` lines from `apply-mac-project-fixes.sh`, ending `ALL MAC PROJECT FIXES PRESENT — safe to package.`; then `present: Config/Mac/MacEngine.ini`, `present: Build/Mac/Resources/NoSandbox.entitlements`, `present: Build/Mac/Resources/Info.Template.plist` | a missing `Config/Mac/MacEngine.ini` means the zip is incomplete — re-make it with `make-project-zip.sh` |
| 12c | `OK      Source/awsTutorial/GraphicsAutoTuneSubsystem.cpp` … `masters: N match, 0 differ or missing`, `Project matches the masters.` | `DRIFT`/`MISSING` → the zip lags the masters: `./apply-project-masters.sh <project>` (takes a backup) then re-run, or re-zip from a current project |
| 13 | `Project 'awsTutorial' built for Mac.` | compiler output above it; the plugin scan warnings name a Windows-only plugin if that is the cause |

Then, once per migrated project, the video overrides (SOP §11d — a zip from the Air already carries them, the dry
run says so): `UE_ENGINE=<engine> UE_PROJECT_DIR=<project> bash ./apply-electra-override-mac.sh` (dry run) → the same
with `apply`.

## 3. Package (Development + Shipping)

```bash
UE_ENGINE=/Volumes/UnrealEngine/UE_5_4_1 UE_PROJECT_DIR=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial \
  nohup ./package_mac_gfx.sh build-$(date +%Y%m%dT%H%M%S) first > /dev/null 2>&1 &
tail -f /tmp/gfx_package_mac.out
```

Never the editor's Package Project button (it deadlocks on this project, SOP §11h). Expected in
`/tmp/gfx_package_mac.out`: `engine patch present`, `==> Development: cook + stage`, `cook complete (Success - 0
error(s), …)`, `DEV_EXIT=0`, `==> Shipping: stage from the cook`, `SHIP_EXIT=0`, the verify block for both apps
(`tuner compiled in (UTF-16 overlay text): 1` or more, `NSHighResolutionCapable: true`, `pak DefaultEngine:
bAllowHighDPIInGameMode=True`, `Signature=adhoc`, ~3.5 GB each), then `ALL_DONE`. Outputs:

```
<project>/Packaged/Mac/awsTutorial.app                              Development
<project>/Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app        Shipping
```

`first` parks the previous apps in `<project>/.backups/<name>/apps/` (still runnable); `rebuild` assumes they are
parked and overwrites. First run on a new Mac ~20–25 min (cold cook plus the first monolithic game compile for each
configuration); ~7 min for both apps with a warm cook and built game targets. Per-step logs:
`/tmp/awsTutorial-cook.log`, `/tmp/awsTutorial-stage.log`, `/tmp/awsTutorial-stage-shipping.log`.

## 4. Copy an app to another Mac

```bash
tar -C <project>/Packaged/Mac -cf - awsTutorial.app | ssh user@other-mac 'tar -C ~/Downloads -xf -'
ssh user@other-mac 'xattr -dr com.apple.quarantine ~/Downloads/awsTutorial.app; md5 -q ~/Downloads/awsTutorial.app/Contents/MacOS/awsTutorial'
```
Compare the md5 with the source. Ad-hoc signature: the quarantine attribute must be removed (or right-click ▸ Open
once) on every Mac the app lands on.

## 5. Verify a launch — what "it works" means

Launch with `open <project>/Packaged/Mac/awsTutorial.app` (or the Shipping bundle). "After login" needs the lab's
Cognito credentials and network; click Allow on the first microphone prompt, or the voice line below never appears.
Both configurations share `~/Library/Application Support/Epic/awsTutorial/Saved/` (a Development run pre-tunes
Shipping and vice versa) and both run `-installed`.

**Development** (`~/Library/Logs/awsTutorial/awsTutorial.log`), in this order:

```
LogConfig: Set CVar [[r.AllowOcclusionQueries:0]]                                  MacEngine.ini is in the pak
LogGraphicsAutoTune: Display: Startup on <AC|Battery> power: …                     the tuner ran its gate
LogGraphicsAutoTune: Display: macOS insets: display WxH at 0,0 (panel WxH, 1.00x virtual, scale 2); menu bar M, title bar 56, Dock D, left 0, right 0, notch N px (read from the OS; …)
LogGraphicsAutoTune: Display: … reached WxH windowed at X,Y after 1 correction(s)  window under the menu bar, clear of the Dock
                                                                                   (no such line when the saved window size already matches — normal on a relaunch)
LogEmbeddedVoiceChatAEC: … Capture back-end: macOS VoiceProcessingIO (AEC)         after login, mic granted: echo cancellation on (macOS 15 and 26)
LogExit: Exiting.                                                                   after a quit from the level
```
First launch on a machine (no `[GraphicsAutoTune]` section yet): after login the overlay "Optimizing graphics for
this computer" runs the ladder and logs `Step N: … p95 …` then `Result: <AC|Battery> profile: <rung>, <N> fps, <P>% resolution (rows applied, settings save written) …`; it measures the
AC and the battery profile separately (plug/unplug without quitting switches live). Second launch: `no measurement
needed`. The engine ensure `MetalStateCache.cpp:2359 Mismatched texture type` once per Development run is known
noise (absent in Shipping).

**Shipping** writes no log. Read `[GraphicsAutoTune]` in
`~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/GameUserSettings.ini` after the run:
`MacWindow=reached WxH windowed at X,Y after N correction(s) @ <time>`, `Trace1..3=` (`insets …`, `startup on …`,
`insets-changed …` when fullscreen was used), `ProfileAC=`/`ProfileBattery=` (`rung,fps,percent`), `Applied=`.
A clean quit rewrites `Input.ini` beside it. No crash = nothing new in `~/Library/Logs/DiagnosticReports/awsTutorial*`
and no `…/Saved/Crashes/` folder.

**By hand, once per Mac (window repair, build 44):** in the options menu cycle the Screen Mode row without Apply →
nothing moves; Apply Fullscreen → fullscreen, corner buttons click where they are drawn; Apply Windowed → back under
the menu bar; quit from fullscreen and relaunch → starts windowed, goes fullscreen after login.

**Unattended smoke test** (no login, so no tuner result and no microphone):
`UE_PROJECT_DIR=<project> ./mac_runtime_test.sh dev smoke 90 term` (or `ship`) → `/tmp/mac_runtime_test/smoke/result.txt` with the ini
lines, a thread sample and the log evidence. The saved mode must be Windowed (build 43+ forces it at start; an
unattended launch cannot complete a macOS fullscreen transition). Confirm no `awsTutorial` process is alive before
touching the ini — an exiting instance rewrites it.

## 6a. After a content change (anything done in the Unreal editor)

Not an engineering task any more: `PACKAGING-STEP-BY-STEP.md` — on Windows `windows\make-project-zip.bat` makes the
zip, on the Mac `bash mac-rebuild-from-zip.sh <zip>` does §2 + the video fix + §3 in one command and ends PASS/FAIL
(`--package-only` when the change was made in the editor on that Mac). Its logs land in `~/awsTutorial-rebuild-<stamp>/`.

## 6. After a source change (project C++, plugin, MacEngine.ini)

The masters are in the engineering repository (`plans/MacOS_UE_Fix/`, HANDOFF §3) and mirrored here under `masters/`
by `tools/sync_team_package.sh`. On the Mac: `./apply-project-masters.sh <project>` (backup to
`<project>/.backups/masters-<stamp>/`, copies, `Build.cs` dependencies, verify) → `./build_mac_editor.sh` (the cook
runs as the editor — SOP §11h-3; `/tmp/evc_build_mac_editor.log` ends `BUILD_EXIT=0`) → §3 packaging with
`rebuild` if the previous apps are already parked, else `first`. Then §5.

## 7. A laptop panel the lab has not seen

`tools/display_survey/README.md`: `build_survey.sh` compiles three small tools; `/tmp/display_modes` prints the panel,
the default mode and the insets; `phase1_run.sh <Development app> baseline 60` launches once and prints the game's
`reached … windowed …` line next to the window macOS actually placed (`win_bounds`). Five minutes; no login needed.
The geometry is panel-independent by design (HANDOFF §9; every Apple laptop mode was emulated on 2026-09-21), so a
new panel that reads `after 1 correction` with matching bounds is done.

## 8. Limits to know

- Ad-hoc signing, nothing notarized: quarantine must be cleared on every Mac (§4).
- Shipping has no log (§5). Development and Shipping share the saved settings.
- Unattended launches must start windowed; they never open the microphone and never reach the options menu.
- Mac Shipping keeps occlusion culling off (`Config/Mac/MacEngine.ini`); the engine-level fence issue is open.
- The engine patches are Epic Engine Code: this folder stays on the lab drive and lab Macs, never on a public share.
- Two Macs can produce a Mac build since 2026-09-21: the Air (`/Volumes/UnrealEngine/…`) and the lab MacBook Pro
  (`~/UnrealEngine/UE_5_4_1`, `~/Unreal_Projects/awsTutorial`), both from this package.

## 9. Where things are

Defaults are the Air's. Overrides: the build/package/test scripts (`package_mac_gfx.sh`, `package-awsTutorial-mac.sh`,
`package_mac_shipping.sh`, `build_mac_editor.sh`, `mac_runtime_test.sh`, `apply-electra-override-mac.sh`) take
`UE_ENGINE` and `UE_PROJECT_DIR` (the first and last also `UE_PROJECT=<path to .uproject>`); `run-ue541-mac.sh` takes
`UE_ENGINE_PARENT` and `UE_PROJECT_DEST`; the masters/backup/zip/fixes scripts (`apply-project-masters.sh`,
`verify-project-masters.sh`, `backup_step.sh`, `make-project-zip.sh`, `apply-mac-project-fixes.sh`) take the project
folder as their first argument; `check_engine_patch.sh` takes the `MetalRHI.cpp` path; `stage_gat_ini.sh` takes `UE_GUS_INI`.

| | |
| --- | --- |
| Engine | `/Volumes/UnrealEngine/UE_5_4_1` (`Engine/Binaries/Mac/UnrealEditor.app`; fixes in `.ue541_fix_backups/`) |
| Project | `/Volumes/UnrealEngine/Unreal_Projects/awsTutorial` (`Packaged/Mac`, `Packaged/Mac-Shipping`, `.backups/`) |
| Team package | `/Volumes/KingLab/ue541-team-package/` (lab drive, ExFAT) and `~/Downloads/ue541-team-package/` on each Mac |
| Game state | `~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/{GameUserSettings,Engine,Input}.ini` |
| Development log | `~/Library/Logs/awsTutorial/awsTutorial.log` (rotated `awsTutorial-backup-*.log`) |
| Crash reports | `~/Library/Logs/DiagnosticReports/awsTutorial*`; engine crash folders `…/Saved/Crashes/` |
| Packaging logs | `/tmp/gfx_package_mac.out`, `/tmp/awsTutorial-cook.log`, `/tmp/awsTutorial-stage*.log`, `/tmp/evc_package_mac_shipping.out`, `/tmp/evc_build_mac_editor.log` |
