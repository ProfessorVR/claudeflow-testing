# Implementation plan — macOS next phase (2026-09-21)

Four items ordered by the operator on 2026-09-21, after build 35 was verified on the Mac in both configurations:

0. The window mode fights the menu (fullscreen reverts; the menu row still says Fullscreen).
1. Make the engine branch available to the lab, including a fork under the lab's GitHub account.
2. Prove the graphics benchmark and automatic settings on the lab's MacBook Pro (different screen).
3. Update the automated Mac engine build, the project migration script and the documentation for the forked engine.

Ground truth this plan builds on: `report/adversarial-review-mac-2026-09-20.md` (findings M2–M11),
`report/high-fixes-verification-2026-09-20.md` (build 35 state), `engine-patches/README.md` (the branch).
Sections 1 and 3 are completed from the two survey reports appended at the end (§A, §B).

---

## 0. Window mode: make the repair follow the menu instead of overriding it

### What is happening (diagnosed from tonight's logs, not guessed)

* At login the options menu re-applies its saved rows. Every Mac install tuned by version 2 saved **Windowed
  Fullscreen** in the ScreenMode row (that was the tuner's commit value until build 33), so at the level the window
  goes fullscreen — and one second later `RepairMacWindow` sees a mode that is not its target and puts it back to
  windowed 2880×1620. Log (build 33/34/35): `window is WindowedFullscreen 2880x1808 at 0,-10 … applying r.setres
  2880x1620w` right after login. That is the "goes fullscreen then immediately returns" the operator sees.
* Choosing **Fullscreen** in the graphics menu does the same: the row runs its command, the window changes, the repair
  reverts it. The row keeps showing Fullscreen because the row's value is whatever was last chosen in the menu; the
  repair changes the window with `r.setres`, which the menu does not observe. Review finding **M5**.

### Design: the menu's ScreenMode row is the source of truth; the repair only makes each mode *correct*

The repair keeps its job — clicks under the pointer, window clear of the Dock — but the *mode* comes from the menu:

| Menu row | Target the repair enforces | Why |
| --- | --- | --- |
| Windowed | windowed, display width × (display − menu bar − title bar − Dock), content at (0, menu bar + title bar) | today's behaviour, verified |
| Fullscreen | `r.setres <W>x<H − MacFullscreenTrim>f` (2880×1790f on this Mac) | the one fullscreen geometry where Slate's hit test matches the picture (handoff §5.2, measured); the existing `gfx.MacWindowRepair 2` path |
| Windowed Fullscreen | same as Fullscreen | WF cannot be made correct (UE caches `visibleFrame` as the window size); mapping it to trimmed Fullscreen gives the user what they asked for — the whole screen — with correct input |

Reading the row: `GetRowIndex(ScreenModeRow)` already exists (0 Windowed, 1 WF, 2 Fullscreen) and needs the menu
widget (`Menu` weak pointer, valid after `FindMenu`). Before the menu exists (loading, login) the target is the
**saved** mode: read `[/Script/Engine.GameUserSettings] FullscreenMode` through `GEngine->GetGameUserSettings()`
(`GetFullscreenMode()`), which the engine itself writes from the window state — or, simpler and more robust, keep the
last target in `[GraphicsAutoTune] MacWindowMode` and use it until the menu is found.

Handoff §5.2 caveat, unchanged: fullscreen **cannot be applied at startup** on this Mac (renders into the corner with
dead input); it works only from a settled state. So when the saved mode is Fullscreen/WF the repair must still start
**windowed** and switch to trimmed fullscreen only after the level is up and the window has been stable for
`MacWindowSettleSeconds` — exactly the "settled state" that was measured to work.

Also in this item (same code, one sitting), the review's related findings:

* **M5 user intent**: a change the repair did not issue and that matches none of the three targets (a drag, a manual
  resize) is left alone until the mode row changes or the next level — no more permanent fighting.
* **M7 geometry**: pick the `FMonitorInfo` whose `DisplayRect` contains the window, and hold the constants in points ×
  `Window->GetDPIScaleFactor()` — required before item 2 (different panel).
* **M4 success detection**: success only after the state has held for `MacWindowSettleSeconds`.
* **M3**: `GetCachedDisplayMetrics` instead of a rebuild per frame.
* **Commit on Mac**: keep ScreenMode = Windowed as the tuner's default, but stop setting the Resolution row (review M5/M7
  flicker); TuneVersion handling per item 2.

### Steps

1. `GraphicsAutoTuneSubsystem.cpp/.h`: add `MacWindowMode` (enum: Windowed / TrimmedFullscreen) derived from the menu
   row when available, else from the saved mode; extend `RepairMacWindow` to compute one of the two targets; add the
   "user intent" latch (`MacWindowUserSince`); DPI-scaled constants in points (`gfx.MacMenuBarPt` 34, `gfx.MacTitleBarPt`
   28, `gfx.MacDockPt` 60 — the current 68/56/120 ÷ 2); display chosen by containment; settle-confirmed success.
2. Ini trace: `MacWindow=` gains the mode (`… fullscreen 2880x1790 …`).
3. Windows: no change (all under `PLATFORM_MAC`).
4. Tests, Development app on this Mac (log lines are the evidence, `mac_runtime_test.sh` for the windowed cases):
   * saved WF install (today's real state) → starts windowed, at the level switches to 2880×1790 fullscreen, hit test
     correct (operator: click the menu buttons at the corners);
   * menu → Windowed → windowed 2880×1620 at 0,124 within 2 s; menu → Fullscreen → 2880×1790f within 2 s, and stays;
   * drag the windowed window → it stays where dragged; change the row → repair resumes;
   * `gfx.MacWindowRepair 0` → nothing happens.
5. Shipping app: same sequence by the operator; `MacWindow=` trace read afterwards.

Effort: one session (code ~150 lines changed, tests ~1 h with the operator).

---

## 1. Making the engine fix available to the lab

**Route chosen 2026-09-21 (operator): ship the patch inside the automated engine build, not a fork.** Reasons, from
§A and §B: the team script `run-ue541-mac.sh` already turns a plain `5.4.1-release` checkout into the lab's engine by
applying six content-anchored edits (steps 6a–6f); adding the resolution-list fix as a seventh is a few lines and needs
no new GitHub organization plan, no org-fork visibility workaround, and no onboarding beyond the Epic-linked GitHub
access every member already needs to clone the engine. The patch is Engine Code, so it travels only inside the team
package on the lab drive (`/Volumes/KingLab/ue541-team-package/`, `~/Downloads/ue541-team-package/`), never on a public
share — permitted for same-version licensees (§A, EULA §5(a)(i)).

Steps (they are item 3's steps 1–2; listed here so item 1 is self-contained):

1. Put `engine-patches/MetalRHI-resolution-list.patch` (already exported, 25 lines, `git diff` format) into the team
   package as `patches/6g-MetalRHI-resolution-list.patch`, and export the §11c `WebBrowserSingleton.cpp` edit the same way
   (`git diff -- Engine/Source/Runtime/WebBrowser/Private/WebBrowserSingleton.cpp`) as `6h-WebBrowserSingleton-CEF-fallback.patch`
   — the one edit the script does not reproduce today.
2. `run-ue541-mac.sh` step 6 gains 6g and 6h: `git -C "$ENGINE_ROOT" apply --check "$PKG/patches/6g-…" && git apply …`,
   self-detecting like 6a–6f (skip when `check_engine_patch.sh` already passes / when `grep -q "../Frameworks/"` finds
   the CEF fallback), then `check_engine_patch.sh` as a hard gate at the end of step 6.
3. Copy `check_engine_patch.sh` into the team package (it is the gate for every later packaging step).
4. SOP §4/§10/§11c and README: the fix inventory gains the two rows; §11c stops being a manual edit.
5. On this Mac nothing changes: the branch `local/mac-engine-fixes` stays as the local safety net and the source of the
   patch files; regenerate the two patch files from it whenever it changes.

**The fork remains available later** if the lab wants one canonical repository; §A has the constraints and commands.
The original fork-route steps follow for reference:

1. **Prerequisites (one-time, per person):** each lab member creates an Epic Games account, links their GitHub
   account to it and accepts the GitHub invitation to the EpicGames organization. Until that is done a member cannot
   even *see* the fork. The lab's organization account does the same for whoever administers it.
2. **Fork:** from `github.com/EpicGames/UnrealEngine`, fork into the lab's GitHub organization. The fork is private and
   visible only to Epic-linked accounts; GitHub will not let it be made public. Add lab members as collaborators (or as
   org members with read access).
3. **Push the branch from the Mac** (the Mac engine is a clone with `origin` = EpicGames; see §B for the actual remote):
   ```
   cd /Volumes/UnrealEngine/UE_5_4_1
   git remote add lab git@github.com:<lab-org>/UnrealEngine.git
   git push lab local/mac-engine-fixes:lab/5.4.1-mac        # rename on the way; keep local/ for the machine
   git tag -a lab-5.4.1-mac-2026-09-21 -m "5.4.1 + MetalRHI resolution list" && git push lab lab-5.4.1-mac-2026-09-21
   ```
   Before pushing, decide what to do with the **14 other locally modified engine files** (§B lists them): either commit
   them to the same branch (they were needed to build on this Mac — the Apple toolchain edits) or leave them out and
   document them. Recommendation in §B.
4. **Fallback for members without GitHub access, or for a quick start:** the patch series in
   `plans/MacOS_UE_Fix/engine-patches/` applied onto a plain `5.4.1-release` checkout, or an *Installed Build* zip
   (BuildGraph `InstalledEngineBuild.xml`) shared inside the lab — both permitted for licensees, see §A.
5. **Do not** put engine source on a public repository or on a public file share (EULA §A).

---

## 2a. Lab MacBook Pro, first contact (2026-09-21 14:33) — macOS 26 crashes the voice capture at creation

The lab MacBook Pro (M5 Pro, 3024×1964, **macOS 26.5.2**; access `kinglab@192.168.50.242`, see memory
`reference-lab-macbook-pro`) received Development 39 and crashed twice, 9–20 s after launch, 66 ms after
`opening 'MacBook Pro Microphone' in the background`: `VoiceProcessor!vp::vx::database::v1::Database::load →
operator delete[] → FMemory::Free → FMallocBinned2` "unrecognized block" (`MallocBinned2.cpp:1322`), on the plugin's
device-watch queue during `AudioUnitInitialize` of the VoiceProcessingIO unit. Same allocator-mismatch class as the
Air's quit crash (`report/quit-crash-and-window-repair-2026-09-20.md` §2), but at **creation**, so parking cannot help;
the Air (macOS 15.7.7) creates the unit fine. The window repair, by contrast, adapted to the new panel on its own
(`display 3024x1964 … wanted 3024x1720 windowed at 0,124`, one correction in 76 ms).

Fix (build 40): `EVCAECCaptureStream.cpp::CreateCaptureStream` takes the engine capture back-end (no echo cancellation)
on macOS ≥ 26, logging `macOS 26 or newer: Apple's VoiceProcessingIO crashes at creation inside an Unreal process`;
macOS 15 keeps the echo-cancelling back-end. Interim on the lab Mac: `[SystemSettings] EmbeddedVoiceChat.CaptureBackend=1`.
Engine-level resolution of the allocator conflict (the only way to get echo cancellation back on macOS 26) joins the
engine follow-up list next to the fence-signalling investigation.

**Item 2 essentially done on the same evening (14:40, Development 39 with the interim back-end override):** on the
lab MacBook Pro the resolution list and repair worked unchanged (`3024x1720 windowed at 0,124`, one correction),
battery first → **Medium, 30 fps** (13.7 ms real, the battery ladder's ceiling), plug in without quitting → AC
measured **High, 60 fps** (13.9 ms real; wall-clock 17.1 ms was display-synced and correctly ignored — build 39's fix
doing its job on a second panel), both profiles version 4, `LogExit: Exiting`, no crash report. Voice ran on the
engine back-end (no echo cancellation). What remains of item 2: the operator's eye on the menu-bar/Dock margins
(M7) and a look at the real level's frame cost.

**Resolution, build 41 (2026-09-21 15:30) — the allocator conflict is gone, not gated.** The operator's requirement
is echo cancellation on every M-series macOS (M1–M5, macOS 15 → 26), so the build-40 gate was the wrong shape. Root
cause proven outside Unreal with `tools/mac/alloc_probe/` on the lab Mac: a program that replaces the 24 global
operators and exports them (as the game executable does) sees Apple's VoiceProcessingIO free 3 foreign blocks (1 at
creation, 2 at dispose); the same program linked with `-Wl,-unexported_symbols_list` (`__Zn*`, `__Zd*`) sees 0 — Apple's
frameworks stay on libc++'s allocator because dyld can no longer coalesce them onto ours. Fix = that linker option,
project-level, Mac-only, in `awsTutorial.Target.cs` via `AdditionalLinkerArguments` + `Build/Mac/unexported_operators.txt`
(`mac-linker/README.md`); the executable's dylibs and CEF neither define nor import operator symbols, so nothing crosses.
The OS gate in `EVCAECCaptureStream.cpp` is removed; parking stays. Verification: exported operator count 0 (`nm -gU`),
AEC back-end + no crash on the lab Mac (macOS 26) and the Air (macOS 15), Windows 41 compiled clean (Dev + Shipping).

**M7 in the same build:** the window repair reads the menu bar, title bar and Dock from AppKit at run time
(`Source/awsTutorial/Mac/MacDisplayInsets.mm`: `NSScreen.frame` vs `visibleFrame`, `frameRectForContentRect`), for the
screen the window is on; `gfx.MacMenuBarPx/MacTitleBarPx/MacDockPx` default to 0 = auto and only override when positive.
The lab MBP's Dock is 146 px (the Air's constant 120 left 26 px of the game under it) and its menu bar 66. The values are
logged once as `macOS insets: …` and traced as `insets menu=… title=… dock=…`.

Build 41 status (15:41): Windows `Packaged\41-dev` / `41-shipping` clean (tuner + voice module recompiled, `Mac/`
folder correctly left out). Mac Development + Shipping packaged (`.backups/build40-apps-20260921/apps/` holds 40);
`verify_build41.sh`: exported operator new/delete **0** in both executables (40 had 9–12), the operators still defined
inside (11 / 10), `GetMacDisplayInsetsPx` linked, the `macOS 26 or newer` gate text gone, the `macOS insets` log text
present in Development (Shipping strips log text). First attempt failed on `MacDisplayInsets.mm:8 'MacDisplayInsets.h'
file not found` — a file in a subfolder does not see the module root, fixed with `#include "../MacDisplayInsets.h"`.
Expected on the lab MBP with 41: `macOS insets: display 3024x1964 at 0,0; menu bar 66, title bar 56, Dock 146` and
`wanted 3024x1696 windowed at 0,122` (40 wanted 3024x1720 at 0,124 → 26 px under the Dock), plus
`Capture back-end: macOS VoiceProcessingIO (AEC)` with no crash. Dev 41 copied to the lab Mac as
`~/Downloads/awsTutorial-41.app` (then swapped in as `awsTutorial.app`; 40 kept as `awsTutorial-40.app`). Air regression
run (macOS 15: VPIO create + park + clean quit) still to do.

**Build 41 FAILED at launch on both Macs (15:54 lab, 15:56 Air):** `SIGABRT … BUG_IN_CLIENT_OF_LIBMALLOC_POINTER_BEING_FREED_WAS_NOT_ALLOCATED`
from `std::string::__grow_by_and_replace` inside libc++.dylib, called by `Aws::InitAPI → UnrealLogSystem::LogStream`
during `FAWSCoreModule::StartupModule` — deterministic, before the level. Hiding the operators split the process into
two allocators along the libc++ boundary: the executable's inline libc++ code allocated through FMemory, the dylib's
out-of-line code freed through the system allocator. The probe missed it because it never called out-of-line libc++.
Reverted (Target.cs stock again; `Build/Mac/unexported_operators.txt` removed from both projects).

**Build 42 (16:01) — foreign blocks go back to free().** The operators stay exported (the process stays on one
allocator, as in builds ≤ 40); the game's `operator delete` first asks `malloc_zone_from_ptr()` — FMemory never returns
a malloc-zone pointer (Binned2 maps its own regions), so a recognized pointer is a framework's malloc block and is
`free()`d; the rest goes to `FMemory::Free`. The probe shows all three VoiceProcessingIO foreign frees are system-zone
blocks; the check costs ~9 ns per delete (`tools/mac/alloc_probe/zone_check_cost.mm`, lab Mac). Implemented in
`Source/awsTutorial/awsTutorial.cpp` (Mac-only hand expansion of `IMPLEMENT_PRIMARY_GAME_MODULE`; Windows unchanged);
`mac-linker/README.md`. Backups `pre-zone-free-20260921T1601*` in both projects; 41's Mac apps parked in
`.backups/build41-apps-20260921/apps/`.

**Build 42 VERIFIED (16:15).** Windows 42 Dev + Shipping compiled clean (`Packaged\42-*`). Mac 42 Dev + Shipping
packaged (operators exported again: 9). Air, Dev 42, unattended 108 s: past the AWS init that killed 41, insets read
from the OS = 68/56/120 (the hand-measured constants, exactly), clean SIGTERM exit. **Lab MacBook Pro (macOS 26.5.2),
Dev 42, operator session 16:13–16:14: `Capture back-end: macOS VoiceProcessingIO (AEC)`, unit opened (`AEC ON, AGC`)
and ran 45 s where builds 39/40 died 66 ms after opening; insets `menu bar 66, title bar 56, Dock 146`; window
`3024x1696 windowed at 0,122` (bottom edge now at the Dock's top, not 26 px under it); `LogExit: Exiting.`, no crash
report; operator: "everything seemed like it worked and i just quit".** Echo cancellation is therefore on for macOS 15
and 26 alike, with no OS gate.

**Two-Mac session 17:13–17:18 (operator, Dev 42 on both):** Air (macOS 15) — VoiceProcessingIO `AEC ON, AGC`, insets
68/56/**116** (the Dock reads 116 today, not the hand-measured 120 — the OS read earns its keep), window `2880x1624 at
0,124`, `Engine exit requested (Mac RequestExit)` → `LogExit: Exiting.`, no crash report; lab MBP (macOS 26) — same
back-end, insets 66/56/146, window `3024x1696 at 0,122`, clean exit, no crash report. Both quit within 6 s of each
other with the voice unit open. The allocator conflict is closed on both OS generations.

**Shipping 42 on both Macs, operator session 17:30–17:37:** Air — window `2880x1624 windowed at 0,124` after one
correction, `Applied=Battery`, settled/nothing to measure, process ended, `Input.ini` rewritten at 17:36:53 (the
engine's normal shutdown write), no crash report, no `Saved/Crashes` folder; lab MBP — `3024x1696 windowed at 0,122`,
`Applied=AC`, process ended, no crash report, no crash folder. Shipping writes no log, so there is no positive
"Exiting" line; the operator reported both quit normally. Note: a crash log at 17:30:20 on the lab MBP was
**`awsTutorial-41.app` (Development 41, the known startup crash)** launched by mistake 14 s before Shipping; that
bundle is now in `~/Downloads/old-builds/awsTutorial-41-BROKEN-crashes-at-launch.app`. Remaining: distribution zips
(Mac still build 30, Windows 39); CHIMERA still Windows 37.

## 2. Benchmark and automatic settings on the lab's MacBook Pro

### What must hold on a different panel

* The **resolution list** (engine patch) shows the MBP's real modes and the tuner's `FindDisplayResolutionIndex`
  finds the exact native entry.
* The **repair geometry** comes from the display the window is on and from DPI-scaled constants (item 0 / M7). Menu
  bar height differs between notch and non-notch panels (notch MacBooks: 37 pt; older: 25 pt); until item 0 lands the
  operator can set `gfx.MacMenuBarPx` from the console on the Development app.
* The **tuner** must actually run: a fresh machine has no `[GraphicsAutoTune]` section → `Startup: will tune…` → after
  login and the 5 s level grace the overlay appears and the ladder runs (High → Medium → Low at native, then resolution
  steps if needed). With occlusion culling off (build 34+), the result may be lower than this Air's; that is the point
  of measuring.
* **TuneVersion**: this Air is tuned with version 2, measured *with* occlusion culling (review M2). Do the Mac-only
  version key before this test so the Air re-tunes too and both machines are comparable:
  `TunedVersionMac` key (or fold `PLATFORM_MAC` into the compare), bump to 3.

### Protocol (operator at the MBP, Development app, then Shipping)

1. Copy `Packaged/Mac/awsTutorial.app` (Development) to the MBP (zip; ad-hoc signature → `xattr -dr
   com.apple.quarantine` after unzipping, review M8). Note the MBP's panel: `system_profiler SPDisplaysDataType` (pixels,
   backing scale) and the menu-bar height in points (`[NSScreen mainScreen].frame.height - visibleFrame.maxY`, or from
   a screenshot).
2. First launch: expect `LogConfig: Set CVar [[r.AllowOcclusionQueries:0]]`, `Startup: will tune in the first level`,
   the repair lines with the MBP's numbers (`display WxH; … applying r.setres …`), then after login the overlay and
   `Step N: … p95 frame time …` lines, and `Result: <rung>, <fps>, <percent>% (rows applied, settings save written)`.
3. Read `[GraphicsAutoTune]` in `~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/GameUserSettings.ini`:
   `TunedVersion`, `LastSteps`, `LastResult`, `MacWindow`. Copy the log off the machine.
4. Check by eye: title bar under the menu bar, game clear of the Dock, clicks on the corner buttons land, the options
   menu shows the resolution list topping out at the panel's native size, Fullscreen from the menu behaves per item 0.
5. Second launch: `Startup: no tuning needed`, no overlay, same window geometry.
6. Shipping app: same, judged from the ini (`MacWindow=`, `TunedVersion`, `LastResult`) and a clean quit.
7. Bring back: the log, the ini, the panel numbers. Add the MBP's measured constants to the plan's table and, if item 0
   is not yet in, to `MacEngine.ini` as a per-machine override is *not* possible — hence item 0 first.

Effort: half a day with the machine, after item 0 and the TuneVersion change.

---

## 3. Automated engine build, project migration and documentation for the forked engine

Completed from §B (script survey, verbatim at the end). The facts that shape this item:

* The engine build **and** the Windows→Mac migration are one script: `team-package/run-ue541-mac.sh` (authoritative copy
  `~/Downloads/ue541-team-package/`, mirrored on `/Volumes/KingLab/`). It shallow-clones the `5.4.1-release` **tag** from
  `git@github.com:EpicGames/UnrealEngine.git`, fetches `5.4.4-release` for a backport, then re-applies **six hand-edit
  steps (6a–6f)** by content-anchored `sed`/patch, runs `Setup.sh`, rebuilds UBT, builds the editor, and in steps 12–13
  unzips the project, blanks `EngineAssociation`, scrubs AppleDouble files and builds `awsTutorialEditor`.
* The written procedure is `team-package/SOP-UE5.4.1-Mac-Build-and-Migration.md` (§3 clone, §4/§9/§10 the fix set,
  §11c a *manual* `WebBrowserSingleton.cpp` edit, §11h packaging) and `team-package/README.txt` (runbook). Neither
  mentions the branch or `MetalRHI.cpp`.
* The Mac engine repo is that shallow clone (`origin` = EpicGames, only the two tags fetched), now on
  `local/mac-engine-fixes` with **one** commit (`MetalRHI.cpp`). The other 14 working-tree edits are exactly steps
  6a–6f plus the §11c manual edit — reproducible, but only by re-running the script and the SOP.
* Every packaging/build script finds the engine by the absolute path `/Volumes/UnrealEngine/UE_5_4_1` and none checks
  *which* engine is there, except `package_mac_gfx.sh` via `check_engine_patch.sh`.
* There is **no** project sync script: the "migration" is a hand-made zip copied with rsync, then step 12.

With the patch route chosen (item 1), the script keeps cloning the plain tag and keeps steps 6a–6f; the changes are
additive. (If the fork route is ever taken instead, the alternative is: commit the 14 files on the branch, clone the
branch, and turn step 6 into a verification — kept in the plan's history, not repeated here.)

Steps:

1. **Patches into the team package:** `patches/6g-MetalRHI-resolution-list.patch` (from `engine-patches/`) and
   `patches/6h-WebBrowserSingleton-CEF-fallback.patch` (export from the Mac engine: `git diff --
   Engine/Source/Runtime/WebBrowser/Private/WebBrowserSingleton.cpp`); copy `check_engine_patch.sh` alongside. Update
   the three mirrors (WSL `team-package/`, `~/Downloads/ue541-team-package/`, `/Volumes/KingLab/ue541-team-package/`) and
   verify by md5 as §B did.
2. **`run-ue541-mac.sh`:** step 6 gains 6g/6h (`git apply --check` then `git apply`, self-detecting: skip 6g when
   `check_engine_patch.sh` passes, skip 6h when the CEF fallback string is present) and ends with `check_engine_patch.sh`
   as a hard gate ("ENGINE_PATCH_MISSING" aborts before the hours-long UBT/editor build). Also record the applied fix set
   in `$ENGINE_ROOT/.ue541_fix_backups/APPLIED.txt` for later audits.
3. **Guard everywhere:** `build_mac_editor.sh`, `package-awsTutorial-mac.sh`, `package_mac_shipping.sh` call
   `check_engine_patch.sh` first (one line each); `check_engine_patch.sh`'s re-apply hint gains `git fetch <fork>
   lab/5.4.1-mac`.
4. **Migration (step 12–13) additions:** the Mac-only project files must travel with the project and be verified after
   unzip — `Config/Mac/MacEngine.ini`, `Build/Mac/Resources/*.entitlements`, `Info.Template.plist`, the three signing
   lines in `DefaultEngine.ini` (review M9; put them in the Windows project too so the zip has them); and the
   masters-vs-project checksum list (tuner pair, audio-output pair, plugin tree, `MacEngine.ini`) printed at the end.
5. **Docs:** SOP §3 → clone the fork branch; §4/§9/§11c → "in the branch, verify with `git log --oneline
   5.4.1-release..HEAD`"; §10 fix-inventory gains `MetalRHI.cpp` (resolution list), `WebBrowserSingleton.cpp` and the four
   remaining backport files; a boxed warning "never `git checkout 5.4.1-release` on the build volume"; README one-time
   setup → fork/branch verify line and the EpicGames-org requirement (item 1 §A); `HANDOFF` §1/§4, `BOOT-PROMPT.md` and
   `plans/MacOS_Voice_Echo/BOOT-PROMPT.md` §6 → "engine = fork branch `lab/5.4.1-mac`". Add one new page for the lab,
   "Building awsTutorial on a Mac" (accounts → clone → Setup → editor → verify patch → migrate → package → read
   `[GraphicsAutoTune]`; limits: ad-hoc signing/quarantine, unattended launches must start windowed, Shipping has no log).
6. **Windows engine note:** `D:\UE_5.4.1` is a separate detached clone of the same tag; the Mac-only edits do not apply
   there, the UBT backport might — out of scope, recorded.

Effort: one session for the engine commits + script, one for the SOP/README rewrite, once item 1's fork exists.

---

## 4. Windows Shipping on CHIMERA: "the benchmark did not run" (2026-09-21 12:14) — diagnosed, not a regression

Evidence from CHIMERA's Shipping-side settings file (`%LOCALAPPDATA%\awsTutorial\Saved\Config\Windows\GameUserSettings.ini`,
written 12:14): `[GraphicsAutoTune] BatteryDeferrals=1, LastResult=postponed: running on battery`; no `TunedVersion`.
CHIMERA was on battery at the time and still is (`Win32_Battery.BatteryStatus=1`, 80 %). Native panel 2560×1600.

This is the designed behaviour since build 25: on battery the tuner postpones to a launch on AC power, up to three
launches, and "the menu defaults apply meanwhile" — the AntizeMenu defaults are **1920×1080 and a 120 fps cap**, which is
exactly what the operator saw. On the fourth battery launch it tunes anyway. Nothing in builds 33–35 touched this path,
and the Shipping gate fix (build 32) is upstream of it and did open (the deferral message proves the tuner reached the
level and the menu).

Why it reads as a regression: Shipping shows nothing — no overlay, no log — so a deferred first launch is
indistinguishable from a broken tuner, and the interim settings (non-native resolution in windowed-fullscreen, uncapped
120 fps) are worse than any measured result would be. Recommended fix (one sitting, `GraphicsAutoTuneSubsystem`):

* **Apply the structural rows immediately, battery or not:** display resolution row, ScreenMode (WF on Windows /
  Windowed on Mac), the fixed rows (shadows/GI Low, motion blur Off, V-Sync On) and a 60 fps cap — none of these depend
  on measurement. Save through the menu as Commit does, record `LastResult=postponed: running on battery (resolution,
  mode and 60 fps cap applied)`.
* **Then measure anyway on battery, but do not mark tuned:** run the ladder, commit the result with the existing
  "(measured on battery)" suffix, write `TunedOnBattery=1` instead of `TunedVersion`, so the next launch on AC power
  re-measures once and finalizes. Keeps the player usable now and correct later; replaces the three-launch deferral.
* Verification: on CHIMERA on battery, first launch → native resolution, 60 fps cap, overlay runs, `LastResult` says
  measured on battery; plug in, launch → re-measure, `TunedVersion=2`, no further runs.

Until that lands: plug CHIMERA in and launch once — the tuner will run.

**Superseded the same day by the operator's direction:** separate AC and battery profiles, each measured on the first
launch in that state and applied automatically (live on plug/unplug), battery capped at Medium / 30 fps, both platforms
— see `graphics-tuner-power-profiles-plan-2026-09-21.md`. That plan replaces the two bullets above.

---

## Order and dependencies

```
item 1 (patches into the team package)  ──►  item 3 (script step 6g/6h + docs)
item 0 (window mode)  ──►  item 2 (lab MBP test)      ← also needs the Mac-only TuneVersion key (M2)
item 4 (battery policy, Windows + Mac)   — independent; do before the lab MBP test so its first launch is not deferred
```
Items 0, 1 and 4 are independent and can start at once; 1 is now an hour of script work with no accounts involved.

---

## A. Research brief: sharing a modified Unreal Engine (agent report, 2026-09-21; citations as given, EULA section numbers to be spot-checked against the live text)

**What the EULA and Epic's GitHub rules permit.** No public repository: uploading Engine Code anywhere is a
"Distribution" (EULA §4), and §5(a)(i) limits it to "a third party who is separately licensed by us to use the same
version of the Engine Code". Epic's FAQ: "The only parts of the Unreal Engine you can't release to the general public are
the source code and tools or modifications to them; these components may only be distributed to other licensees with
access to the same version." Public snippets are capped at 30 lines (§5(a)(ii)). Sources:
https://www.unrealengine.com/en-US/eula/unreal , https://www.unrealengine.com/en-US/faq . GitHub enforces this: a fork's
visibility is tied to the upstream's network — private forks of `EpicGames/UnrealEngine` stay private and cannot be made
public (https://docs.github.com/en/pull-requests/reference/forks).

**How members get access.** Each person links a personal GitHub account to an Epic account (Epic dashboard →
Connections → Accounts → GitHub → accept EULA → Authorize), then accepts GitHub's invitation to the `@EpicGames`
organization within seven days (https://dev.epicgames.com/documentation/en-us/unreal-engine/downloading-source-code-in-unreal-engine).

**Org-owned forks.** Allowed, with two caveats: (1) a private repo can be forked to an organization only on GitHub Team
or Enterprise, not GitHub Free (unverified which plan the lab's org is on); (2) a *personal* fork is readable by every
EpicGames-org member because it inherits Epic's team permissions, but an *organization-owned* fork does not — other
Epic members get a 404 unless they are added explicitly as collaborators or org-team members
(https://forums.unrealengine.com/t/forking-unreal-engine-for-my-organization/1898724 ,
https://forums.unrealengine.com/t/how-to-share-ue4-source-private-fork-on-github/289912). Epic-forum guidance endorses
the org fork with members added to a team, provided every member is an Epic-linked licensee.

**Recommended approach and commands.** Fork under the lab org (private, cannot be otherwise), grant access explicitly,
rename the branch to something the lab owns (`lab/5.4.1-mac-fixes`; `local/` implies a throwaway):
```
gh repo fork EpicGames/UnrealEngine --org <lab-org> --clone=false      # or Fork → Owner = <lab-org> on github.com
cd /Volumes/UnrealEngine/UE_5_4_1
git branch -m local/mac-engine-fixes lab/5.4.1-mac-fixes
git remote add lab git@github.com:<lab-org>/UnrealEngine.git
git push -u lab lab/5.4.1-mac-fixes
# lab member (Epic-linked account, added to the fork):
git clone --branch lab/5.4.1-mac-fixes --single-branch --depth 1 git@github.com:<lab-org>/UnrealEngine.git
cd UnrealEngine && ./Setup.sh && ./GenerateProjectFiles.sh && Engine/Build/BatchFiles/Mac/Build.sh UnrealEditor Mac Development
```
Onboarding: link GitHub↔Epic and join `@EpicGames`; lab admin adds the member to an org team with Read (or Write) on
`<lab-org>/UnrealEngine`; clone as above. Confirm the fork appears under `github.com/EpicGames/UnrealEngine/forks`.

**Fallbacks.** A patch series (`git format-patch 5.4.1-release..lab/5.4.1-mac-fixes`) applied with `git am` on a plain
`5.4.1-release` checkout — permitted for same-version licensees, distributed only over an access-controlled channel
(the patch is Engine Code). An **Installed Build** zip: Epic documents it as "a fully featured Unreal Engine build that you
can redistribute to get your team up and running" (https://dev.epicgames.com/documentation/en-us/unreal-engine/installed-build-reference-guide-for-unreal-engine ,
https://dev.epicgames.com/documentation/en-us/unreal-engine/create-an-installed-build-of-unreal-engine):
`RunUAT BuildGraph -target="Make Installed Build Mac" -script="Engine/Build/InstalledEngineBuild.xml" -clean` (Mac option
set `-set:WithMac=true -set:WithWin64=false … -set:HostPlatformOnly=true`, not re-verified against the page today);
recipients must have accepted the EULA.

**macOS practical notes.** Dependencies are not in git — `Setup.sh` (GitDependencies) must run after every fresh clone;
tag `5.4.1-release`; ~106 GB after Setup before compiling (community report), 150–400 GB with a built editor; Xcode 14.1+
and macOS 13+ per Epic's requirements page. Unverified: the lab org's GitHub plan; the 404 behaviour is a user report
without an Epic reply, though the mitigation (explicit access) works regardless.

## B. Script and documentation survey (agent report, 2026-09-21, read-only)

Paths: `P/` = `plans/MacOS_UE_Fix/`. Mac copies are byte-identical to the WSL masters where noted.

| Path | What it does | How it locates the engine | Change needed for fork + branch |
|---|---|---|---|
| `P/team-package/run-ue541-mac.sh` (Mac copy `~/Downloads/ue541-team-package/`, identical) | The one-shot engine build + Windows→Mac migration. Steps 4–11 = access check, shallow clone, six hand-edits (6a–6f), `Setup.sh`, UBT rebuild, `GenerateProjectFiles.sh`, `Build.sh UnrealEditor`/`ShaderCompileWorker`; 12–13 = unzip project, `EngineAssociation=""`, AppleDouble scrub, build `<Proj>Editor`. | Hard-coded `ENGINE_TAG="5.4.1-release"`, `BACKPORT_TAG="5.4.4-release"`, remote literal `git@github.com:EpicGames/UnrealEngine.git`; `ENGINE_ROOT="$ENGINE_PARENT/UE_5_4_1"`; presence test `[ -f "$ENGINE_ROOT/GenerateProjectFiles.sh" ]`. Assumes a plain tag checkout and re-applies fixes by content-anchored edits. | The main rewrite: step 4 `git ls-remote` → fork URL + branch; step 5 `git clone --depth 1 --branch local/mac-engine-fixes <fork-url>` (keep the 5.4.4 tag fetch if 6a stays); step 6 redundant only if the branch holds all 15 files — today it holds only `MetalRHI.cpp`; presence check → branch check. |
| `P/team-package/SOP-UE5.4.1-Mac-Build-and-Migration.md` (52 KB, identical on Mac) | Full written procedure. | §3 clone of the tag + `5.4.4-release` fetch; §4 "Apply ALL of these to a fresh 5.4.1 tree"; §10 fix-inventory (8 rows); §11c hand edit of `WebBrowserSingleton.cpp`; §11h-2 `ENGINE=/Volumes/UnrealEngine/UE_5_4_1`. | §3 → clone the fork's branch; §4/§9/§11c → "already in the branch; verify with `git log`"; §10 gains `WebBrowserSingleton.cpp`, `MetalRHI.cpp` and the four extra backport files; warning never to `git checkout 5.4.1-release`. |
| `P/team-package/README.txt` (identical on Mac) | Runbook for teammates. | "Verify access: `git ls-remote git@github.com:EpicGames/UnrealEngine.git 5.4.1-release`". | Point at the fork/branch; EpicGames-org membership still required. |
| `P/team-package/package-awsTutorial-mac.sh` | Dev cook → kill hung cook → `-skipcook` stage/pak/sign; CEF symlink. | `ENGINE="${UE_ENGINE:-/Volumes/UnrealEngine/UE_5_4_1}"`. | None (path only); optionally run `check_engine_patch.sh` first. |
| `P/team-package/apply-mac-project-fixes.sh`, `apply-electra-override-mac.sh`, `set_electra_override.py`, `verify_media_overrides.py` | Project-side fixes (signing, entitlements, mic, Electra). | Project path only. | None. |
| `P/voice-aec-fix/build_mac_editor.sh` (= `~/gfx_autotune/`) | `Build.sh awsTutorialEditor Mac Development`. | `ENGINE=/Volumes/UnrealEngine/UE_5_4_1`. | None (add the guard). |
| `P/voice-aec-fix/package_mac_shipping.sh` (= `~/gfx_autotune/`) | Shipping stage from existing cook. | same | None (add the guard). |
| `P/voice-aec-fix/package_mac_and_verify.sh` | Wraps team packaging script + verify. | indirect | None. |
| `P/graphics-autotune/package_mac_gfx.sh` (= `~/gfx_autotune/`) | Backs up apps, Dev + Shipping package, verification; guard first. | same; calls `check_engine_patch.sh`. | None required; could add a branch check. |
| `P/graphics-autotune/check_engine_patch.sh` (= `~/gfx_autotune/`) | Greps `MetalRHI.cpp` for the marker and absence of `/ Scale`. | default path literal; hint names `git switch local/mac-engine-fixes`. | Add fork-fetch wording to the hint. |
| `P/engine-patches/README.md` + two `.patch` files | Documents the branch (one commit `9f41a32f2` on `16dc333db`), the 14 uncommitted files, hand re-apply. | path literal | "fetch the branch from the fork"; update once the 14 files are committed. |
| `P/graphics-autotune/build_editor_win.bat`, `P/voice-aec-fix/build_win_editor.bat`, `package_win_*.bat` | Windows builds. | `set ENGINE=D:\UE_5.4.1` | None; the Windows engine is a separate plain checkout. |
| `P/voice-aec-fix/copy_to_chimera_when_awake.sh` | rsync a Windows build to CHIMERA. | no engine | None. |
| `P/tools/mac/preflight_from_wsl.sh`, `probe_remote.sh` | Reachability + sparsebundle mount + lineage probe. | `ls -d /Volumes/UnrealEngine/UE_5_4_1` | Optionally gate on the branch name. |
| `P/HANDOFF-2026-09-20.md` §1/§4; `P/BOOT-PROMPT.md`; `plans/MacOS_Voice_Echo/BOOT-PROMPT.md` §5–6 | State docs ("locally patched"; "patches under `.ue541_fix_backups/`, re-applied by `run-ue541-mac.sh`"). | path literals | Name the fork + branch. |

Grep outside `MacOS_UE_Fix/` for migrate/sync/rsync/Setup.sh/GenerateProjectFiles/UE_5_4_1 hit only unrelated docs — no
other engine automation. **No Windows→Mac project sync script exists** beyond `run-ue541-mac.sh` step 12 (zip transfer by
hand: README "STEP 1 — `rsync … <project>.zip mac:/Volumes/UnrealEngine/Unreal_Projects/_incoming/`").

**How the Mac engine was obtained.** `origin git@github.com:EpicGames/UnrealEngine.git`; shallow clone (fetch refspec
`+refs/tags/5.4.1-release:refs/tags/5.4.1-release` only); tags `5.4.1-release`, `5.4.4-release`; HEAD
`local/mac-engine-fixes` (sole branch); `git describe` = `5.4.1-release-1-g9f41a32f2`; binaries from `Setup.sh`. A fork
can be pushed from this repo directly; a re-clone script must fetch the branch explicitly. The Windows engine
`D:\UE_5.4.1` is a separate clone at the same tag, detached, edits unchecked.

**The 14 uncommitted engine modifications** (`git diff --stat`, 96+/52−):
`Engine/Config/Apple/Apple_SDK.json` (MaxVersion 15.9→16.9, backport 6a); `UnrealBuildTool/Configuration/UEBuildModuleCPP.cs`
(6a); `UBAExecutor.cs` (6a); `UEDeployAndroid.cs` (6a); `MacToolChain.cs` (five `-Wno-…` Clang-17 suppressions, 6b);
`VCToolChain.cs` (6a); `VSWorkspaceProjectFile.cs` (6a); `XcodeProject.cs` (6a); `AppleToolChain.cs` (Xcode-16 flags,
`-ld_classic` range, 6a); `Runtime/AudioCaptureCore/Private/AudioCaptureInternal.h` (`GEngine` null guard, 6e/SOP §9a);
`Runtime/Engine/Classes/GameFramework/Character.h` (`AnimMontage_DEPRECATED` block removed, 6f/§9b);
`Runtime/WebBrowser/Private/WebBrowserSingleton.cpp` (+24 lines, Mac CEF `../Frameworks/…` fallback — SOP §11c **manual**
edit, not in the script); `ThirdParty/FBX/…/fbxredblacktree.h` (typo fix, 6c); `Engine/Source/UnrealEditor.Target.cs`
(`bBuildAllModules = false`, 6d). Key gap: the branch commit is only `MetalRHI.cpp`; 13 of 14 are reproducible by step 6,
`WebBrowserSingleton.cpp` only by following §11c by hand.

**Existing lab documentation.** The SOP (§0–§12, validated 2026-07-23/24, §11h added 2026-08-24) and README (2026-08-26)
describe a plain 5.4.1 checkout plus hand/script-applied edits; the branch and `MetalRHI.cpp` are absent. Mirrors:
`~/Downloads/ue541-team-package/` (authoritative, plus the 5.7 GB project zip), `/Volumes/KingLab/ue541-team-package/`,
and `plans/MacOS_UE_Fix/team-package/` — md5-identical for the five files checked. Not found: any project rsync script,
any doc of a fork remote, any check that the Windows engine carries the same edits.
