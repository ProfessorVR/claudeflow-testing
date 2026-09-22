===============================================================================
 UE 5.4.1 — Mac Build + Project Migration + Packaging — TEAM PACKAGE
 (updated 2026-09-21, awsTutorial build 44)
===============================================================================

WHAT THIS IS
  Everything a lab Mac needs to go from a blank machine to a verified Development
  and Shipping awsTutorial app, with no access to the engineering repository:
  a one-shot, re-runnable script that builds Unreal Engine 5.4.1 from source on
  an Apple-Silicon Mac (Xcode 16.4 / Clang 17), applies every required engine
  fix INCLUDING the two awsTutorial engine patches, builds the editor + tools,
  migrates the project, applies the Mac-side project fixes, verifies the project
  against the source masters, and the packaging scripts with their guard.

  NOT AN ENGINEER? Read only PACKAGING-STEP-BY-STEP.md: one file to double-click on Windows, one
                             command to type on a Mac, and the word OK or FAILED at the end.
  START HERE for a new Mac:  Building-awsTutorial-on-a-Mac.md  (the engineer's runbook)
  Full method & rationale:   SOP-UE5.4.1-Mac-Build-and-Migration.md
  Engineering state:         docs/HANDOFF-2026-09-21.md

PACKAGE CONTENTS
  PACKAGING-STEP-BY-STEP.md        the non-engineer page: Windows build, Mac build from a Windows change, Mac build
                                   from a Mac change — each as one file to run and one word to read
  windows\make-project-zip.bat     WINDOWS PC, double-click inside the project folder: makes the zip a Mac needs
                                   (with Build\, without Intermediate/Binaries/Saved) + its .md5, one folder up
  windows\package-windows.bat      WINDOWS PC, double-click inside the project folder: cook + Development + Shipping
                                   builds into Packaged\<date>-dev and <date>-shipping; ends PACKAGE OK / FAILED
  mac-rebuild-from-zip.sh          MAC, one command: zip -> migrate -> video fix -> Development + Shipping apps,
                                   ends PASS / FAIL; --package-only after a change made in the editor on that Mac
  run-ue541-mac.sh                 engine build + project migration (steps 4-13; run this first)
  patches/6g-MetalRHI-resolution-list.patch          engine patch: resolution list in pixels (SOP 9c)
  patches/6h-WebBrowserSingleton-CEF-fallback.patch  engine patch: CEF bundle-path fallback (SOP 11c)
  check_engine_patch.sh            THE GUARD: exit 0 only when patch 6g is in the engine source;
                                   every build/packaging script runs it first and stops on ENGINE_PATCH_MISSING
  apply-mac-project-fixes.sh       Mac-side project fixes (signing, entitlements, mic key, Retina flag) — SOP 11a/11b/11e;
                                   run-ue541-mac.sh step 12b runs it; safe to run again any time
  verify-project-masters.sh        md5-compares the project's C++/plugin/config against masters/ (step 12c)
  apply-project-masters.sh         installs masters/ into a project (backup first) — after a source update
  masters/                         source of truth for the project's own code, copied from plans/MacOS_UE_Fix/:
      MANIFEST.tsv                 md5 + master path + project path for every mastered file
      graphics-autotune/           tuner sources (src/), apply_autotune_src.sh, config/Mac/MacEngine.ini
      mac-linker/                  awsTutorial.cpp (Mac allocator shim), awsTutorial.Target.cs
      voice-aec-fix/               EmbeddedVoiceChat plugin sources (macOS echo cancellation, parked units)
      project-mac/                 Build/Mac/Resources/{Info.Template.plist,NoSandbox.entitlements}
  package_mac_gfx.sh               PACKAGE BOTH: guard -> park old apps -> Development cook+stage -> Shipping stage -> verify
  package-awsTutorial-mac.sh       Development cook -> kill the stuck cook -> stage/pak/sign (SOP 11f); guarded
  package_mac_shipping.sh          Shipping staged from the existing cook (SOP 11h-4 step 2b); guarded
  build_mac_editor.sh              rebuild the project EDITOR target after a source change (SOP 11h-3 L2); guarded
  backup_step.sh                   snapshot Source/, the voice plugin, Config/, Build/Mac into <project>/.backups/
  mac_runtime_test.sh              unattended launch test of a packaged app (dev|ship), reads log + ini traces
  stage_gat_ini.sh                 stage a [GraphicsAutoTune] state in the shared GameUserSettings.ini for a test
  make-project-zip.sh              make the migration zip FROM THE MAC THAT HOLDS THE CURRENT PROJECT (incl. Build/)
  tools/display_survey/            prove the window repair on a new laptop panel (README.md inside)
  apply-electra-override-mac.sh    one command: set Mac->ElectraPlayer on every video, then verify (SOP 11d)
  set_electra_override.py          the Python it runs (also usable in-editor)
  verify_media_overrides.py        independent on-disk proof the overrides landed (no Unreal needed)
  docs/HANDOFF-2026-09-21.md       reference copy of the engineering handoff
  PACKAGE.md5                      md5 of every file here except zips, *.zip.md5, old-zips/ and .backups/ — verify a copy with:
                                     cd <folder> && while read -r m f; do [ "$(md5 -q "$f")" = "$m" ] || echo "BAD $f"; done < PACKAGE.md5
  <project>.zip                    the project to migrate. BME_Virtual_Hospital_08-25-26.zip is the 2026-08-26
                                   zip and is STALE (it predates builds 25-44: no tuner, no Mac allocator shim,
                                   old voice plugin). Use a zip made by make-project-zip.sh on the Mac that holds
                                   the current project (the Air: /Volumes/UnrealEngine/Unreal_Projects/awsTutorial),
                                   and drop it beside run-ue541-mac.sh (or pass UE_PROJECT_ZIP=).

  *** IF YOU RE-ZIP FROM THE UNREAL EDITOR, READ THIS ***
  The editor's "Zip Up Project" writes only Config/ Content/ Plugins/ Source/ *.uproject.
  It OMITS Build/ — which is where Build/Mac/Resources/NoSandbox.entitlements and
  Info.Template.plist (the microphone key + Retina flag) live. Caught 2026-08-26. Use
  make-project-zip.sh instead; if you must zip by hand, add Build/ and confirm:
        unzip -Z1 <the>.zip | grep -c NoSandbox.entitlements          # want 1
        unzip -p  <the>.zip Build/Mac/Resources/Info.Template.plist | grep -c NSMicrophone  # want 1
        unzip -Z1 <the>.zip | grep -c Config/Mac/MacEngine.ini        # want 1
  (Step 12b creates the two Build/Mac files from masters/project-mac when a zip lacks them,
   and stops if Config/Mac/MacEngine.ini is missing.)

ONE-TIME SETUP PER PERSON (cannot be scripted — do this first)
  1. Install Xcode 16.4 from the App Store / Apple Developer, then:
        sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  2. Have a GitHub account and add an SSH key to it:
        ssh-keygen -t ed25519 -C "you@email"     # then add ~/.ssh/id_ed25519.pub
        to GitHub -> Settings -> SSH and GPG keys
  3. Link that GitHub account to Epic and ACCEPT the org invite:
        https://www.unrealengine.com/en-US/ue-on-github
        (then accept the emailed invitation to join the EpicGames GitHub org)
  4. Verify access (must print a SHA):
        git ls-remote git@github.com:EpicGames/UnrealEngine.git 5.4.1-release
  The engine source and these patches are Epic Engine Code: share them only with people
  who have accepted the same EULA (the lab drive, never a public repository or share).

HOW TO RUN
        chmod +x *.sh masters/graphics-autotune/*.sh tools/display_survey/*.sh
        bash ./run-ue541-mac.sh
  It prompts for:
    - Build location  (DEFAULT: ~/UnrealEngine on the internal drive.
                       To use an external drive, enter its path, e.g. /Volumes/MyoSSD;
                       if that drive is ExFAT the script makes an APFS image on it.)
    - Parallel actions (auto from RAM; lower = less memory pressure)
    - Project .zip     (auto-detected if exactly one zip is beside the script; else UE_PROJECT_ZIP=)
    - Project location (DEFAULT: ~/Documents/Unreal Projects. Must be an APFS / internal
                        path — the project compiles; an ExFAT choice is auto-redirected next
                        to the engine.)
      HEADS-UP: the default path contains a space ("Unreal Projects"). This is Epic's own
      Launcher default and is fully supported, but if some third-party plugin's build
      tooling ever chokes on the space, just enter a no-space path at this prompt
      (e.g. ~/UnrealProjects).
  Non-interactive / overrides:
        UE_ENGINE_PARENT=~/UnrealEngine UE_PROJECT_ZIP=~/proj.zip \
        UE_PROJECT_DEST="$HOME/Documents/Unreal Projects" UE_NONINTERACTIVE=1 bash ./run-ue541-mac.sh
        UE_SKIP_PROJECT=1   # build only the engine, no project migration
        UE_SKIP_ENGINE=1    # engine already built: skip steps 4-11, go straight to migration
                            # (the guard still runs: an engine without patch 6g is refused)
        UE_KEEP_EXISTING=1  # deliberately keep whatever project is already at the destination
                            # (not needed for a plain re-run: a project extracted from the SAME zip is
                            #  recognized by its .migrated-from marker and kept automatically)
        UE_ALLOW_MASTER_DRIFT=1  # build a project that differs from masters/ (step 12c) — you know why
  Re-runs resume: clone/fixes self-detect, downloads continue, builds are incremental, the migrated
  project is kept when the zip is unchanged. Exactly ONE .zip may sit beside the script (two = the
  script stops and lists them; make-project-zip.sh parks the previous awsTutorial-src-*.zip in old-zips/;
  the stale BME_Virtual_Hospital_08-25-26.zip already lives in old-zips/ on the lab mirrors).

  WHAT STEP 6 DOES (engine fixes, all self-detecting, all backed up under <engine>/.ue541_fix_backups/):
        6a  Apple toolchain backport 5.4.1 -> 5.4.4 (Xcode 16 SDK)     SOP 4a
        6b  5 Clang-17 warning suppressions in MacToolChain.cs         SOP 4b
        6c  FBX header typo                                            SOP 4c
        6d  bBuildAllModules=false                                     SOP 4d
        6e  AudioCapture GEngine null-guard                            SOP 9a
        6f  Character.h AnimMontage_DEPRECATED removed                 SOP 9b
        6g  MetalRHI.cpp resolution list in pixels   (patches/6g-…)    SOP 9c   <- guarded
        6h  WebBrowserSingleton.cpp CEF fallback     (patches/6h-…)    SOP 11c
      then check_engine_patch.sh as a HARD GATE and the set written to .ue541_fix_backups/APPLIED.txt.
      A patch that does not apply stops the run before the hours-long build — fix by hand, re-run.

REQUIREMENTS
  - Apple-Silicon Mac, macOS 15+ (validated on Sequoia; also built on macOS 26 / Tahoe + M5 Pro), Xcode 16.4.
  - Rosetta 2 — the script auto-installs it if missing. Required for UE's x86_64 helper tools;
    without it the built editor crashes on launch ("posix_spawn ... Bad CPU type in executable").
  - ~250 GB free at the build location (engine deps + intermediates + binaries).
    The script warns if there isn't enough and, when run unattended (UE_NONINTERACTIVE=1) with no
    engine present yet, refuses to start a fresh build.
  - Time: ~30-45 min for the engine build on an M-series chip, plus downloads
    (~15-30 GB clone + dependencies).

SAFE TO RE-RUN
  The script is idempotent: if it's interrupted, just run it again — completed
  steps (clone, fixes, dependencies) are detected and skipped, and the ~33-min
  editor build resumes incrementally. Every engine file it edits is backed up
  under <engine>/.ue541_fix_backups/.

WHEN IT FINISHES
  It prints the exact command to open the migrated project and the packaging
  command. First launch of the editor compiles shaders for several minutes
  (CPU pegged, no window) before the level appears.

THE COMPLETE RUNBOOK — CURRENT PROJECT -> VERIFIED MAC APPS
  Do these in order. Building-awsTutorial-on-a-Mac.md has the same steps with the
  expected output of each.

  STEP 0 — VERIFY YOU HAVE THE RIGHT PROJECT   *** DO NOT SKIP ***  (SOP 8.0)
      On 2026-08-25 an entire multi-day "videos don't play on macOS" investigation turned out to
      be an OBSOLETE FORK of the project sitting on the Mac. The fork and the live project have
      identical .uproject, byte-identical Config/*.ini and identical C++ — only the CONTENT
      differs, so no settings diff can tell them apart.

        unzip -l <project>.zip | grep -E 'BP_(SC|WG)_(CatPara|CAT_PARAOG)\.uasset'
        #  BP_SC_CatPara + BP_WG_CatPara present, CAT_PARA family absent  -> LIVE project, good
        #  BP_SC_T1/BP_WG_TEST + BP_SC_CAT_PARA/BP_WG_CAT_PARAOG present  -> OBSOLETE FORK, stop

      make-project-zip.sh runs this check and the masters check before it zips, and
      run-ue541-mac.sh step 12c refuses a project whose sources lag the masters — the
      code-side version of the same lesson.

  STEP 1 — TRANSFER + MIGRATE
        rsync -h --partial --progress <project>.zip mac:/Volumes/UnrealEngine/Unreal_Projects/_incoming/

      ENGINE ALREADY BUILT? (the normal case — you are only swapping in a new project)
        UE_SKIP_ENGINE=1 UE_NONINTERACTIVE=1 \
        UE_ENGINE_PARENT=<engine parent, e.g. /Volumes/UnrealEngine or $HOME/UnrealEngine> \
        UE_PROJECT_DEST=<projects dir, e.g. /Volumes/UnrealEngine/Unreal_Projects or $HOME/Unreal_Projects> \
        UE_PROJECT_ZIP=/Volumes/UnrealEngine/Unreal_Projects/_incoming/<project>.zip \
        bash ./run-ue541-mac.sh
      (Without UE_ENGINE_PARENT/UE_PROJECT_DEST the non-interactive defaults are ~/UnrealEngine and
       ~/Documents/Unreal Projects — on the Air that means "no built editor found".)
      UE_SKIP_ENGINE=1 jumps straight to step 12 (migrate), 12b (Mac project fixes), 12c
      (masters check) and 13 (build the project editor target).

      WITHOUT that flag the script still does NOT rebuild the engine — the clone and every
      fix self-detect "already applied" and the builds are incremental — but it DOES walk
      steps 4-11 anyway, which means a few minutes of checking, an unconditional
      UnrealBuildTool rebuild + project-file regeneration, and, critically, step 4 still
      verifies GitHub/EpicGames SSH access and ABORTS the whole run if your key or org
      membership has lapsed. UE_SKIP_ENGINE=1 avoids all of that.

      Either way: a project already extracted from the SAME zip is kept (.migrated-from marker,
      resume); a project from a DIFFERENT zip is MOVED aside to <project>_superseded_<timestamp>
      instead of being silently reused (SOP 8a); UE_KEEP_EXISTING=1 keeps whatever is there.

  STEP 2 — BUILD THE PROJECT EDITOR TARGET FOR MAC   (done by step 13; by hand: SOP 8d)
        UE_ENGINE=<engine> UE_PROJECT_DIR=<project> ./build_mac_editor.sh      # log /tmp/evc_build_mac_editor.log, ends BUILD_EXIT=
      Required before anything else can load the project, and after EVERY source change:
      the cook runs as the editor (SOP 11h-3). The script returns at once (the build runs under
      nohup); wait until the log ends with BUILD_EXIT=0 before STEP 4/5.

  STEP 3 — MAC PROJECT FIXES   (done by step 12b; idempotent, re-run any time)
        ./apply-mac-project-fixes.sh <project>
      Signing, entitlements, microphone key, Retina flag. Ends with
      "ALL MAC PROJECT FIXES PRESENT — safe to package."

  STEP 4 — MAKE THE VIDEOS PLAY   *** OR EVERY VIDEO IS BLANK ***   (SOP 11d)
        UE_ENGINE=<engine> UE_PROJECT_DIR=<project> ./apply-electra-override-mac.sh            # dry run first
        UE_ENGINE=<engine> UE_PROJECT_DIR=<project> ./apply-electra-override-mac.sh apply      # applies + verifies on disk
      macOS cannot decode DASH with AvfMedia; every StreamMediaSource needs Mac->ElectraPlayer.
      A zip made from the Air project already carries the overrides (the dry run says so).

  STEP 5 — PACKAGE   (CLI ONLY, never the editor button — SOP 11h)
        UE_ENGINE=<engine> UE_PROJECT_DIR=<project> nohup ./package_mac_gfx.sh build-$(date +%Y%m%dT%H%M%S) first >/dev/null 2>&1 &
        tail -f /tmp/gfx_package_mac.out          # ends ALL_DONE; want DEV_EXIT=0 and SHIP_EXIT=0
        # -> <project>/Packaged/Mac/awsTutorial.app  and  <project>/Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app
      Development only: ./package-awsTutorial-mac.sh   (env UE_ENGINE, UE_PROJECT_DIR or UE_PROJECT=<.uproject>, UE_ARCHIVE)

  STEP 6 — VERIFY THE BUILD   (Building-awsTutorial-on-a-Mac.md §5 has the exact lines)
        xattr -dr com.apple.quarantine "<app>"    # if moved between Macs (ad-hoc signature)
      Development: ~/Library/Logs/awsTutorial/awsTutorial.log must show
        "macOS insets: display WxH ..." and "reached WxH windowed at X,Y after N correction(s)"
        (no such line when the saved window size already matches — normal on a relaunch),
        the graphics tuner's "Startup ..." line, and "LogExit: Exiting." after a quit from the level.
      Shipping writes NO log: read [GraphicsAutoTune] in
        ~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/GameUserSettings.ini
        (MacWindow=, Trace1..3=) and check ~/Library/Logs/DiagnosticReports for awsTutorial crash reports.
      Unattended: UE_PROJECT_DIR=<project> ./mac_runtime_test.sh dev <label> 90 term   (the saved mode must be Windowed —
        an unattended launch hangs in a fullscreen transition; build 43+ forces windowed at start).
      Then PLAY a video from more than one station — see SOP 11d for how to judge playback.

PACKAGING FOR MACOS  (after the editor + project are working — see SOP section 11)

  *** PACKAGE FROM THE COMMAND LINE. DO NOT USE THE EDITOR'S "PACKAGE PROJECT" BUTTON. ***
  On this project the editor's one-click package ALWAYS deadlocks: the editor spawns its cook
  with -EditorIOPort=<port>, the cook finishes its work correctly, and then the process never
  terminates (stuck in -[NSApplication _shouldTerminate]). Staging never starts, and the editor
  has no "reuse existing cook" button, so there is no way out from inside the GUI. It looks like
  a frozen progress bar with a UnrealEditor process at 0% CPU and a Cook log that ends in
  "Success - 0 error(s)". This is structural, not a misconfiguration — SOP 11h has the full
  explanation, the explicit CLI commands, the per-target build matrix, and hang recovery.

  *** THE ENGINE MUST CARRY PATCH 6g. *** Every packaging script checks
  (check_engine_patch.sh) and refuses with ENGINE_PATCH_MISSING otherwise. The symptom
  without it is silent: the options menu's resolution list tops out at half the panel and
  the graphics auto-tuner can never choose native. A `git checkout`/`stash` in the engine
  reverts the patch without any message — re-run run-ue541-mac.sh (step 6 re-applies) and
  rebuild.

  *** MAC SHIPPING NEEDS Config/Mac/MacEngine.ini (r.AllowOcclusionQueries=0). *** It ships
  with the project; without it the Shipping app freezes before the level (Metal fence waits,
  2026-09-20). Step 12b stops if it is missing.

  IF YOU CHANGED PLUGIN OR PROJECT SOURCE, rebuild the PROJECT EDITOR target (awsTutorialEditor,
  build_mac_editor.sh), not the game target — the cook runs as the editor and loads the editor's
  plugin dylibs, so a fix compiled only into the game target is silently ignored and the cook
  behaves as if unfixed. SOP 11h-3 has the three-target matrix. Then package_mac_gfx.sh.

  *** YOUR MAP CHOICE IS RESPECTED ***  The scripts NEVER change map settings. Pick the level
  to ship by saving Hospital_Server or Hospital_Client AS FirstPersonMap in the editor first,
  then run the script (this keeps the UserLogin -> hospital flow). SOP 11f explains it.

  THE FULL FIX SET (all in SOP 11, each with a "reversible" note):
    11a signing (ad-hoc)   11b sandbox OFF / entitlements   11c CEF login crash (now patch 6h)
    11d video (ElectraPlayer — apply-electra-override-mac.sh)  11e mic permission
    11f the packaging scripts + map workflow                  11g fix-inventory table
    11h WHY THE EDITOR GUI CAN'T PACKAGE THIS + the explicit CLI commands

  KNOWN OPEN ISSUES (SOP 12):
    - The editor's Package Project button deadlocks — use the CLI (above / SOP 11h). Not being
      fixed; the CLI path is the supported one.
    - Mac Shipping loses every CPU wait on a Metal GPU fence — occlusion culling stays off via
      Config/Mac/MacEngine.ini. Engine-level cause open (HANDOFF §9, §10 H).
    - The source-built UnrealEditor still needs a force-quit after a play-in-editor session.
      Dev-only annoyance, same AppKit teardown deadlock; the shipped game is unaffected.
    - Development builds log the engine ensure "MetalStateCache.cpp:2359 Mismatched texture type"
      once per run (EnsureReport written; absent in Shipping). Cosmetic.

  Distribution outside the lab still needs a paid Developer ID cert + notarization (SOP 11a);
  until then every copy moved between Macs needs `xattr -dr com.apple.quarantine`.

KEEPING THIS PACKAGE CURRENT
  The masters live in the engineering repository (plans/MacOS_UE_Fix/); this folder is assembled
  from them by tools/sync_team_package.sh (WSL), which also pushes to the Air's
  ~/Downloads/ue541-team-package/ and /Volumes/KingLab/ue541-team-package/ and verifies every
  file by md5. Never edit the copies here; edit the masters and re-sync. PACKAGE.md5 is the
  proof that a copy is complete.

See the SOP markdown for the full explanation of every fix and why it's needed.
===============================================================================
