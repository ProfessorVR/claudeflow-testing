===============================================================================
 UE 5.4.1 — Mac Build + Project Migration — TEAM PACKAGE
===============================================================================

WHAT THIS IS
  A one-shot, re-runnable script that builds Unreal Engine 5.4.1 from source on
  an Apple-Silicon Mac (Xcode 16.4 / Clang 17), applies all required fixes,
  builds the editor + tools, and migrates the bundled project — ending with a
  fully working editor you can open.

PACKAGE CONTENTS
  run-ue541-mac.sh                         engine build + project migration script (run this first)
  apply-mac-project-fixes.sh               *** RUN AFTER EVERY FRESH MIGRATION *** applies the Mac-side
                                           project fixes (signing, entitlements, mic) — SOP 11a/11b/11e
  apply-electra-override-mac.sh            one command: set Mac->ElectraPlayer on every video, then verify
  set_electra_override.py                  the Python it runs (also usable in-editor) — SOP 11d
  verify_media_overrides.py                independent on-disk proof the overrides landed (no Unreal needed)
  package-awsTutorial-mac.sh               one-command macOS packaging of the project (SOP 11f)
  SOP-UE5.4.1-Mac-Build-and-Migration.md   the full written procedure & rationale
  README.txt                               this file
  BME_Virtual_Hospital_08-25-26.zip        the project to migrate — zipped FROM THE MAC on
                                           2026-08-26, so it already contains every fix:
                                           live lineage, Mac signing/entitlements/microphone,
                                           and Mac->ElectraPlayer on all 442 media sources.
                                           (Point the script at it, or drop a newer zip here.)

  *** IF YOU RE-ZIP FROM THE UNREAL EDITOR, READ THIS ***
  The editor's "Zip Up Project" writes only Config/ Content/ Plugins/ Source/ *.uproject.
  It OMITS Build/ — which is where Build/Mac/Resources/NoSandbox.entitlements and
  Info.Template.plist (the microphone key) live. DefaultEngine.ini would then point at an
  entitlements file that is not in the zip. Caught and corrected 2026-08-26. After zipping:
        cd <Project> && zip -r <the>.zip Build -x "Build/Mac/Resources/.backups/*"
  Then confirm:
        unzip -Z1 <the>.zip | grep -c NoSandbox.entitlements          # want 1
        unzip -p  <the>.zip Build/Mac/Resources/Info.Template.plist | grep -c NSMicrophone  # want 1

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

HOW TO RUN
        chmod +x run-ue541-mac.sh
        ./run-ue541-mac.sh
  It prompts for:
    - Build location  (DEFAULT: ~/UnrealEngine on the internal drive.
                       To use an external drive, enter its path, e.g. /Volumes/MyoSSD;
                       if that drive is ExFAT the script makes an APFS image on it.)
    - Parallel actions (auto from RAM; lower = less memory pressure)
    - Project .zip     (auto-detected if placed beside the script)
    - Project location (DEFAULT: ~/Documents/Unreal Projects. Must be an APFS / internal
                        path — the project compiles; an ExFAT choice is auto-redirected next
                        to the engine.)
      HEADS-UP: the default path contains a space ("Unreal Projects"). This is Epic's own
      Launcher default and is fully supported, but if some third-party plugin's build
      tooling ever chokes on the space, just enter a no-space path at this prompt
      (e.g. ~/UnrealProjects).
  Non-interactive / overrides:
        UE_ENGINE_PARENT=~/UnrealEngine UE_PROJECT_ZIP=~/proj.zip \
        UE_PROJECT_DEST="$HOME/Documents/Unreal Projects" UE_NONINTERACTIVE=1 ./run-ue541-mac.sh
        UE_SKIP_PROJECT=1   # build only the engine, no project migration
        UE_SKIP_ENGINE=1    # engine already built: skip steps 4-11, go straight to migration
        UE_KEEP_EXISTING=1  # deliberately keep whatever project is already at the destination

REQUIREMENTS
  - Apple-Silicon Mac, macOS 15+ (validated on Sequoia; also built on macOS 26 / Tahoe + M5 Pro), Xcode 16.4.
  - Rosetta 2 — the script auto-installs it if missing. Required for UE's x86_64 helper tools;
    without it the built editor crashes on launch ("posix_spawn ... Bad CPU type in executable").
  - ~250 GB free at the build location (engine deps + intermediates + binaries).
    The script warns if there isn't enough.
  - Time: ~30-45 min for the engine build on an M-series chip, plus downloads
    (~15-30 GB clone + dependencies).

SAFE TO RE-RUN
  The script is idempotent: if it's interrupted, just run it again — completed
  steps (clone, fixes, dependencies) are detected and skipped, and the ~33-min
  editor build resumes incrementally. Every engine file it edits is backed up
  under <engine>/.ue541_fix_backups/.

WHEN IT FINISHES
  It prints the exact command to open the migrated project. First launch compiles
  shaders for several minutes (CPU pegged, no window) before the level appears.

THE COMPLETE RUNBOOK — WINDOWS PROJECT -> WORKING MAC BUILD
  Do these in order. Steps 3 and 4 are the ones people forget, and skipping either
  produces a build that either fails to package or plays no video.

  STEP 0 — VERIFY YOU HAVE THE RIGHT PROJECT   *** DO NOT SKIP ***  (SOP 8.0)
      On 2026-08-25 an entire multi-day "videos don't play on macOS" investigation turned out to
      be an OBSOLETE FORK of the project sitting on the Mac. The fork and the live project have
      identical .uproject, byte-identical Config/*.ini and identical C++ — only the CONTENT
      differs, so no settings diff can tell them apart.

        unzip -l <project>.zip | grep -E 'BP_(SC|WG)_(CatPara|CAT_PARAOG)\.uasset'
        #  BP_SC_CatPara + BP_WG_CatPara present, CAT_PARA family absent  -> LIVE project, good
        #  BP_SC_T1/BP_WG_TEST + BP_SC_CAT_PARA/BP_WG_CAT_PARAOG present  -> OBSOLETE FORK, stop

      Generally: every packaged build ships Manifest_UFSFiles_Win64.txt listing every cooked
      asset. Diff that from your last KNOWN-GOOD build against what you are about to ship.

  STEP 1 — TRANSFER + MIGRATE
        rsync -h --partial --progress <project>.zip mac:/Volumes/UnrealEngine/Unreal_Projects/_incoming/

      ENGINE ALREADY BUILT? (the normal case — you are only swapping in a new project)
        UE_SKIP_ENGINE=1 UE_NONINTERACTIVE=1 \
        UE_PROJECT_ZIP=/Volumes/UnrealEngine/Unreal_Projects/_incoming/<project>.zip \
        ./run-ue541-mac.sh
      UE_SKIP_ENGINE=1 jumps straight to step 12 (migrate) + 13 (build project editor).

      WITHOUT that flag the script still does NOT rebuild the engine — the clone and every
      fix self-detect "already applied" and the builds are incremental — but it DOES walk
      steps 4-11 anyway, which means a few minutes of checking, an unconditional
      UnrealBuildTool rebuild + project-file regeneration, and, critically, step 4 still
      verifies GitHub/EpicGames SSH access and ABORTS the whole run if your key or org
      membership has lapsed. UE_SKIP_ENGINE=1 avoids all of that.

      Either way the script now MOVES any existing project at the destination aside to
      <project>_superseded_<timestamp> instead of silently skipping extraction (see SOP 8a).

  STEP 2 — BUILD THE PROJECT EDITOR TARGET FOR MAC   (SOP 8d)
        cd /Volumes/UnrealEngine/UE_5_4_1
        Engine/Build/BatchFiles/Mac/Build.sh awsTutorialEditor Mac Development \
          -project=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/awsTutorial.uproject \
          -MaxParallelActions=6
      Required before anything else can load the project. ~80 s once the engine is built.

  STEP 3 — APPLY THE MAC PROJECT FIXES   *** OR PACKAGING WILL FAIL ***   (SOP 11a/11b/11e)
        ./apply-mac-project-fixes.sh /Volumes/UnrealEngine/Unreal_Projects/awsTutorial
      Idempotent; self-verifies; backs up what it edits. Also push these back into the Windows
      source project so future migrations do not need this step.

  STEP 4 — MAKE THE VIDEOS PLAY   *** OR EVERY VIDEO IS BLANK ***   (SOP 11d)
        ./apply-electra-override-mac.sh            # dry run first
        ./apply-electra-override-mac.sh apply      # applies + verifies on disk
      macOS cannot decode DASH with AvfMedia; every StreamMediaSource needs Mac->ElectraPlayer.

  STEP 5 — PACKAGE   (SOP 11f / 11h — CLI ONLY, never the editor button)
        ./package-awsTutorial-mac.sh
        # -> <Project>/Packaged/Mac/awsTutorial.app

  STEP 6 — VERIFY THE BUILD
        xattr -dr com.apple.quarantine "<Project>/Packaged/Mac/awsTutorial.app"   # if moved between Macs
      Launch it and actually PLAY a video from more than one station. If anything is blank or
      frozen, capture a log and read the Electra statistics block:
        open <App> --args -LogCmds="LogElectraPlayer Verbose, LogMediaAssets Verbose" -abslog=/tmp/v.log
      In that log, "play position" advancing is NOT proof of playback — the clock free-runs with
      no data. Judge it by "Bytes of video data streamed" and the segment count in the
      per-player "Electra player statistics" block written at Close. Any test shorter than
      ~30 s hides inside the initial 2-segment prefetch and proves nothing.

PACKAGING FOR MACOS  (after the editor + project are working — see SOP section 11)

  *** PACKAGE FROM THE COMMAND LINE. DO NOT USE THE EDITOR'S "PACKAGE PROJECT" BUTTON. ***
  On this project the editor's one-click package ALWAYS deadlocks: the editor spawns its cook
  with -EditorIOPort=<port>, the cook finishes its work correctly, and then the process never
  terminates (stuck in -[NSApplication _shouldTerminate]). Staging never starts, and the editor
  has no "reuse existing cook" button, so there is no way out from inside the GUI. It looks like
  a frozen progress bar with a UnrealEditor process at 0% CPU and a Cook log that ends in
  "Success - 0 error(s)". This is structural, not a misconfiguration — SOP 11h has the full
  explanation, the explicit CLI commands, the per-target build matrix, and hang recovery.

  *** THE PROJECT-SIDE FIXES ARE **NOT** IN A FRESHLY MIGRATED PROJECT. ***
  This README used to claim they were "ALREADY IN the project". That is only true of a copy that
  has already been fixed up on a Mac. Signing, entitlements and the microphone key live in the
  project's Config/ and Build/Mac/, and were historically only ever applied to the copy sitting on
  the Mac — so a fresh zip from Windows has NONE of them, and the ElectraPlayer video overrides are
  absent too (verified 2026-08-25: 442/442 media sources had no override straight out of the zip).
  Packaging then dies at the very last step, AFTER a full cook and a 12-minute build:
        error: Signing for "awsTutorial" requires selecting either a development team
        or a provisioning profile.   ** BUILD FAILED **
  Run the two fix-up scripts first (see THE COMPLETE RUNBOOK above). Then packaging is ONE COMMAND:

        chmod +x package-awsTutorial-mac.sh
        ./package-awsTutorial-mac.sh
        # -> <Project>/Packaged/Mac/awsTutorial.app  (ad-hoc signed, ready to run)

  IT DOES: cook -> wait for the cook to finish -> force-kill the stuck cook -> re-run with
  -skipcook for stage/pak/sign/archive -> ensure the CEF login framework is where UE looks.
  It only kills COOK processes. To run those steps by hand (debugging, or the script stopped
  part-way), the raw RunUAT BuildCookRun commands are in SOP 11h-4.

  IF YOU CHANGED PLUGIN OR PROJECT SOURCE, rebuild the PROJECT EDITOR target (awsTutorialEditor),
  not the game target — the cook runs as the editor and loads the editor's plugin dylibs, so a
  fix compiled only into the game target is silently ignored and the cook behaves as if unfixed.
  SOP 11h-3 has the three-target matrix.

  *** YOUR MAP CHOICE IS RESPECTED ***  The script NEVER changes map settings. Pick the level
  to ship by saving Hospital_Server or Hospital_Client AS FirstPersonMap in the editor first,
  then run the script (this keeps the UserLogin -> hospital flow). SOP 11f explains it.

  THE FULL FIX SET (all in SOP 11, each with a "reversible" note):
    11a signing (ad-hoc)   11b sandbox OFF / entitlements   11c CEF login crash
    11d video (ElectraPlayer — apply-electra-override-mac.sh)  11e mic permission
    11f the one-command script + map workflow                11g fix-inventory table
    11h WHY THE EDITOR GUI CAN'T PACKAGE THIS + the explicit CLI commands

  KNOWN OPEN ISSUES (SOP 12):
    - The editor's Package Project button deadlocks — use the CLI (above / SOP 11h). Not being
      fixed; the CLI path is the supported one.
    - The source-built UnrealEditor still needs a force-quit after a play-in-editor session.
      Dev-only annoyance, same AppKit teardown deadlock; the shipped game is unaffected.
    (The packaged game's own exit hang was RESOLVED 2026-07-25 — it was the missing microphone
     usage key, SOP 11e. The .app now quits cleanly.)

  Distribution outside the lab still needs a paid Developer ID cert + notarization (SOP 11a).

See the SOP markdown for the full explanation of every fix and why it's needed.
===============================================================================
