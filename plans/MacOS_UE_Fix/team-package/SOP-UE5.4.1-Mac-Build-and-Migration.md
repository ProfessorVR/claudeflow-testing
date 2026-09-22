# SOP — Building Unreal Engine 5.4.1 from Source on Apple Silicon
## (Xcode 16.4 / Clang 17) + Windows → Mac C++ Project Migration

**Validated:** 2026-07-23 on Apple M4 · macOS 15.7.7 (Sequoia) · Xcode 16.4 / Clang 17 · engine + tools built clean, a real Windows C++ project (AWS SDK + EmbeddedVoiceChat proximity voice) migrated and running.
**Clean engine build time:** ~33 min (`-MaxParallelActions=6`). **Project build:** ~2 min.
**Runtime/packaging validated 2026-07-24** (`awsTutorial`): one-command Mac package (§11f) → launches, Cognito login web view works (§11c CEF), hospital level loads, **streamed DASH surgical videos play via ElectraPlayer** (§11d — spot-checked, not every title individually), **microphone capture confirmed live** (§11e — real input levels + human-voice detection; end-to-end receipt by a remote peer not yet re-confirmed at time of writing). **Exit-hang update 2026-07-25:** the **packaged game now quits cleanly** (the hang traced to audio-capture teardown and was resolved by the §11e mic-permission fix — confirmed over repeated joined-voice sessions). A **dev-only** editor force-quit annoyance remains — see §12.

> **Why this SOP exists:** UE 5.4.1 (April 2024) targets Xcode 14/15 / Clang ≤16. Xcode 16.4 ships **Clang 17**, which promotes several warnings to hard errors and is stricter about template lookup. Epic fixed most of this only in later 5.4.x/5.5. This SOP is the exact, minimal set of source patches + build steps to make **5.4.1 specifically** build and run on a modern Apple-Silicon Mac.

---

## 0. Target environment & assumptions
- Apple-Silicon Mac (M-series), macOS 15 Sequoia, **Xcode 16.4** installed and selected (`xcode-select -p` → `/Applications/Xcode.app/Contents/Developer`).
- A GitHub account **linked to Epic Games** (required to clone `EpicGames/UnrealEngine`).
- Building on an **external SSD**. If the drive is **ExFAT**, you MUST build inside an APFS disk image (Section 2) — ExFAT lacks symlinks/permissions/case semantics UE needs.

---

## 1. Prerequisites
```bash
# Homebrew (if absent)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install cmake
brew install python@3.11              # Setup.sh can choke on very new system Python; 3.11 is a safe fallback
sudo xcodebuild -license accept
xcode-select -p                       # must be the Xcode 16.4 app
# Rosetta 2 — REQUIRED on Apple Silicon. UE 5.4 ships x86_64-only helper tools (e.g. the
# IOSTargetPlatform device-query tool run at editor startup); without Rosetta the built
# editor CRASHES on launch with "posix_spawn() failed (86, Bad CPU type in executable)".
softwareupdate --install-rosetta --agree-to-license
# .NET SDK is NOT needed — the engine ships its own dotnet under Engine/Binaries/ThirdParty/DotNet/ after Setup.sh.
```

**Verify Epic/GitHub access BEFORE cloning** (this catches the #1 silent failure — auth works but the org link doesn't):
```bash
ssh -T git@github.com                                              # confirms GitHub auth
git ls-remote git@github.com:EpicGames/UnrealEngine.git 5.4.1-release
#   -> a SHA + "refs/tags/5.4.1-release" = you have access.
#   -> "Repository not found" = your GitHub account is NOT in the EpicGames org.
#      Fix: accept the EpicGames org invite (github.com/EpicGames or your email),
#      after linking at https://www.unrealengine.com/en-US/ue-on-github
```

---

## 2. Storage — APFS sparse bundle on the external drive (only if ExFAT)
```bash
# Case-INSENSITIVE APFS (the macOS dev default; case-sensitive breaks some ThirdParty/Xcode tooling).
# SPARSEBUNDLE (band files) is more resilient on an ExFAT host than a monolithic SPARSE image.
hdiutil create -size 600g -type SPARSEBUNDLE -fs "APFS" -volname "UnrealEngine" \
  /Volumes/<ExternalDrive>/UnrealEngine.sparsebundle
hdiutil attach /Volumes/<ExternalDrive>/UnrealEngine.sparsebundle      # mounts at /Volumes/UnrealEngine
# Re-mount each session with the same `hdiutil attach`. Expand later: hdiutil resize -size 900g <image>
```
Everything below assumes the engine lives at **`/Volumes/UnrealEngine/UE_5_4_1`** and projects at **`/Volumes/UnrealEngine/Unreal_Projects/`** (both on the APFS volume).

---

## 3. Clone
```bash
cd /Volumes/UnrealEngine
git clone --depth 1 --branch 5.4.1-release git@github.com:EpicGames/UnrealEngine.git UE_5_4_1
cd UE_5_4_1
git fetch --depth 1 origin tag 5.4.4-release      # for the Apple toolchain backport diff in Section 4
```

---

## 4. THE Xcode 16.4 / Clang 17 FIX SET  ⭐
Apply ALL of these to a fresh 5.4.1 tree, **before** running Setup/Build. Back up every file you touch.

### 4a. Let UBT accept Xcode 16 (Apple SDK ceiling) — backport from 5.4.4
5.4.1 refuses Xcode 16 as "unsupported." Pull the Apple toolchain fixes from 5.4.4 and apply:
```bash
git diff 5.4.1-release 5.4.4-release \
  -- "Engine/Source/Programs/UnrealBuildTool/" "Engine/Config/Apple/" "Engine/Build/BatchFiles/Mac/" \
  > /tmp/xcode16_apple.patch
git apply --whitespace=fix /tmp/xcode16_apple.patch
find . -name '*.rej'    # resolve any rejects manually
```
Net effect (verify present after applying): the Apple **SDK max version** is raised to ~16.x (e.g. `Apple_SDK.json` `MaxVersion`), and `AppleToolChain.cs` gains the Clang-16 handling + linker (`ld_classic`) fix.

### 4b. Demote Clang-17 warnings-as-errors — `MacToolChain.cs`  (the big one)
Clang 17 turns several warnings into `-Werror`. Add **5** suppressions, appended AFTER the base call so they win over per-module `UnsafeTypeCastWarningLevel=Error` (which force-enables some of these).

File: `Engine/Source/Programs/UnrealBuildTool/Platform/Mac/MacToolChain.cs`
In `GetCompileArguments_WarningsAndErrors(...)`, immediately after `base.GetCompileArguments_WarningsAndErrors(...)`:
```csharp
Arguments.Add("-Wno-shorten-64-to-32");                          // size_t->int32 narrowing (pervasive; hits nearly every IMPLEMENT_MODULE)
Arguments.Add("-Wno-vla-cxx-extension");                         // Clang-17 new: VLA-in-C++ (e.g. GarbageCollection.cpp)
Arguments.Add("-Wno-extra-qualification");                       // redundant Class::member (MetaSound macros)
Arguments.Add("-Wno-missing-template-arg-list-after-template-kw"); // stricter x.template disambiguation
Arguments.Add("-Wno-error=dangling-assignment");                 // demote (keep visible) — WebSocketServer.cpp
```
> Do **not** edit `ClangWarnings.cs` — its per-module `UnsafeTypeCastWarningLevel=Error` path would still re-enable `shorten-64-to-32` for ~31 strict modules. Putting the suppression in `MacToolChain` (after base) is what covers *all* modules.

### 4c. Fix the FBX SDK header typo
Clang 17's stricter template lookup catches a vendored typo.
File: `Engine/Source/ThirdParty/FBX/2020.2/include/fbxsdk/core/base/fbxredblacktree.h` (line ~318)
```
- while (lParent && lParent->mLefttChild == lNode)   // typo: mLefttChild
+ while (lParent && lParent->mLeftChild  == lNode)
```

### 4d. Don't force-compile broken experimental plugins — `bBuildAllModules`
Epic's editor target compiles **every** module, including `EnabledByDefault:false` experimental plugins (USD, Harmonix, Chaos-USD…) that carry their own latent Clang-17 bugs (some in vendored code). A standard editor doesn't need them.
File: `Engine/Source/UnrealEditor.Target.cs`
```csharp
- bBuildAllModules = true;
+ bBuildAllModules = false;   // standard, complete editor; optional/experimental plugins compile on-demand later
```
> Trade-off: the built editor won't *pre-compile* optional plugins (USD import, etc.). They still build if a project enables them. If you need the full set, keep `true` and instead disable/patch the specific broken plugins (USD has 4 dependents — expect a cascade).

### 4e. ⚠️ CRITICAL GOTCHA — rebuild UBT after ANY `.cs` edit
`Build.sh` runs the **prebuilt** `UnrealBuildTool.dll` and **ignores your UBT source edits** until you recompile it. After 4a/4b (or any UBT `.cs` change):
```bash
cd /Volumes/UnrealEngine/UE_5_4_1
DOTNET=$(ls Engine/Binaries/ThirdParty/DotNet/*/mac-arm64/dotnet | head -1)   # bundled dotnet (after Setup.sh)
"$DOTNET" build Engine/Source/Programs/UnrealBuildTool/UnrealBuildTool.csproj -c Development
```
Skipping this is the single most confusing failure mode — the build keeps erroring as if you changed nothing. (`Target.cs`/`Build.cs` and `.h`/`.cpp` engine edits do NOT need this; only UBT program `.cs` edits do.)

---

## 5. Dependencies & project files
```bash
cd /Volumes/UnrealEngine/UE_5_4_1
./Setup.sh                 # downloads ~15–30 GB of binaries; installs the bundled dotnet. (If system Python errors: python3.11 Setup.py)
# (do the UBT rebuild in 4e now, since Setup.sh provides the bundled dotnet)
./GenerateProjectFiles.sh  # optional for command-line builds; needed for the Xcode workspace
```
> **Setup.sh is idempotent — always run it, don't gate on a marker.** GitDependencies hash-verifies existing files and only fetches what's missing (fast when already complete). So after an *interrupted* download, just re-run `Setup.sh`; don't treat a partial `.uedependencies` marker (or the presence of the `DotNet/` dir) as "already done," or you'll build against incomplete dependencies.

---

## 6. Build the editor
```bash
cd /Volumes/UnrealEngine/UE_5_4_1
caffeinate -dimsu &        # keep the Mac awake for the whole build
Engine/Build/BatchFiles/Mac/Build.sh UnrealEditor Mac Development -MaxParallelActions=6 \
  2>&1 | tee /tmp/ue_build.log
```
- **Use `Build.sh`** (not the raw UBT binary) — it uses the bundled dotnet.
- **`-MaxParallelActions` is limited by RAM, not cores.** Compile actions use ~1–2 GB each, but the *link* phase spikes to several GB/action and is what OOM-kills a build. Rough guide (min RAM per level, and don't exceed your physical core count):

  | actions | 4 | 6 | 8 | 10 | 12 | 16 |
  |---|---|---|---|---|---|---|
  | min RAM | 12 GB | 16 GB | 24 GB | 32 GB | 40 GB | 48 GB |

  On **24 GB use 6–8** (8 is comfortable on a 10-core M-series). If it runs out of memory at link the build dies — just re-run at a lower number (it resumes). The team script computes this automatically and caps at core count.
- ~2100 actions with `bBuildAllModules=false`; ~4300 with `true`. Expect `** BUILD SUCCEEDED **`.
- Incremental & resumable — if it dies, just re-run the same command.
- **Long-run tip:** launch it `nohup … </dev/null &` so it survives an SSH disconnect; monitor via the log growing + active `clang` processes + disk climbing (NOT the agent/editor claiming success).

## 6b. Build the tool targets (REQUIRED — separate from the editor)
Building `UnrealEditor` does **not** build the standalone tools. At minimum build ShaderCompileWorker or the editor crashes on first launch ("Unable to launch ShaderCompileWorker"):
```bash
Engine/Build/BatchFiles/Mac/Build.sh ShaderCompileWorker Mac Development -MaxParallelActions=6
# Build as needed later: UnrealLightmass (lighting), InterchangeWorker (asset import), UnrealPak (packaging)
```

## 7. Verify the engine
```bash
open Engine/Binaries/Mac/UnrealEditor.app
# First launch compiles global shaders (many minutes, CPU pegged, no window) → then the Project Browser appears.
```

> **Crash on first launch — `posix_spawn() failed (86, Bad CPU type in executable)` in `IOSTargetPlatform.dylib!FDeviceQueryTask::QueryDevices`?** That's **Rosetta 2 missing** (§1), not a bad build. The editor is arm64-native, but at startup it spawns an x86_64-only helper to scan for iOS devices; on an Apple-Silicon Mac without Rosetta that spawn is fatal and aborts the editor. Fix: `softwareupdate --install-rosetta --agree-to-license`, then relaunch. (Seen on a fresh **M5 Pro / macOS 26** team Mac — the build itself succeeded.)

---

## 8. Migrate a Windows C++ project to this Mac engine
Example used to validate: a First-Person C++ project with the **AWS SDK** plugin (Cognito/DynamoDB/GameLift/S3…), BlueprintJson, VaRestX, and **EmbeddedVoiceChat** (proximity voice).

### 8·0. ⭐ FIRST — VERIFY YOU ARE MIGRATING THE RIGHT PROJECT
**Do this before anything else.** On 2026-08-25 an entire multi-day debugging effort — "Paraguay videos don't play on macOS" — turned out to be a copy of an **obsolete fork** on the Mac. The fork and the live project have **identical** `.uproject`, **byte-identical** `DefaultEngine.ini` / `DefaultGame.ini`, and **identical** C++ source, so no configuration diff will ever tell them apart. Only the content does.

Cheap discriminator for THIS project (`awsTutorial`):
```bash
P=<project>/Content/Blueprints/360_Screens
ls $P/Screens/BP_SC_CatPara.uasset  $P/Widgets/BP_WG_CatPara.uasset   # LIVE  -> both exist
ls $P/Screens/BP_SC_CAT_PARA.uasset $P/Widgets/BP_WG_CAT_PARAOG.uasset # FORK -> these exist
```
- **Live project** (`awsTutorial_VoiceRPCNew_ARBv3` lineage): `BP_SC_CatPara` / `BP_WG_CatPara` present; the `CAT_PARA` family absent.
- **Obsolete fork** (`UCI_Campus_Template_v1.0` lineage): `BP_SC_T1` / `BP_WG_TEST` (the same assets, renamed) **plus** `BP_SC_CAT_PARA`, `BP_WG_CAT_PARA`, `BP_WG_CAT_PARAOG`.

Verify the **zip** before transferring, not just the folder:
```bash
unzip -l <project>.zip | grep -E 'BP_(SC|WG)_(CatPara|CAT_PARAOG|CAT_PARA)\.uasset'
```
Generalising: before migrating any project, confirm the source is the one whose **last known-good build** you can point at. Compare the staged asset list of that build against the project you are about to ship:
```bash
grep -oE '360_Screens/(Screens|Widgets)/[A-Za-z0-9_-]+\.uasset' \
  <good-build>/Manifest_UFSFiles_Win64.txt | sort -u
```
`Manifest_UFSFiles_Win64.txt` ships inside every packaged build and lists every cooked asset — it is the most reliable record of what a working build actually contained.

### 8a·1. ⚠️ The editor's "Zip Up Project" OMITS `Build/`
Unreal's *File ▸ Zip Up Project* writes only `Config/ Content/ Plugins/ Source/ <Project>.uproject`. It does **not** include `Build/`, where the Mac fixes live:
- `Build/Mac/Resources/NoSandbox.entitlements` (§11b) — and `DefaultEngine.ini` *references* it, so the INI arrives pointing at a file that is not in the zip
- `Build/Mac/Resources/Info.Template.plist` (§11e microphone key)

So a zip made from a fully-fixed Mac project still arrives **half-fixed**. Observed 2026-08-26. After zipping, append `Build/` and verify:
```bash
cd <Project>
zip -r <the>.zip Build -x "Build/Mac/Resources/.backups/*" -x "*/._*"
unzip -Z1 <the>.zip | grep -c NoSandbox.entitlements                                   # want 1
unzip -p  <the>.zip Build/Mac/Resources/Info.Template.plist | grep -c NSMicrophone      # want 1
```
`apply-mac-project-fixes.sh` recreates both from scratch, so it also rescues a `Build/`-less zip — but a complete zip is better than relying on the rescue.

### 8a. Unzip onto APFS (never raw ExFAT — it must compile)
> ⚠️ **The destination is almost always already occupied.** Every migration unzips to the same
> project name (`awsTutorial`), so a previous — possibly obsolete — copy is usually sitting there.
> `run-ue541-mac.sh` used to detect that and *silently skip extraction*, then build and package
> whatever was already on disk while reporting success. **That is how the obsolete fork reached
> macOS.** The script now moves any existing copy aside to
> `<project>_superseded_<timestamp>` and extracts fresh (`UE_KEEP_EXISTING=1` restores the old
> behaviour deliberately). If you extract by hand, move the old one aside yourself first.

Any APFS location works — pick one; the example below uses the engine volume, the standard
macOS spot is `~/Documents/Unreal Projects`. (The team script prompts for this, defaulting to
`~/Documents/Unreal Projects`, and auto-redirects off ExFAT.)
```bash
DEST=~/Documents/Unreal\ Projects/<Project>   # or /Volumes/UnrealEngine/Unreal_Projects/<Project>
mkdir -p "$DEST" && cd "$DEST"
unzip -q /path/to/<project>.zip     # -> Config/ Content/ Plugins/ Source/ <Project>.uproject
```

### 8a·2. Engine already built? Skip straight to the project
```bash
UE_SKIP_ENGINE=1 UE_NONINTERACTIVE=1 \
UE_PROJECT_ZIP=/Volumes/UnrealEngine/Unreal_Projects/_incoming/<project>.zip \
./run-ue541-mac.sh
```
`UE_SKIP_ENGINE=1` skips steps 4–11 wholesale and goes to §12 (migrate) + §13 (build the project editor target).

Without it the script does **not** rebuild the engine — the clone check and all six §6 fixes self-detect "already applied", and §10/§11 builds are incremental — but it still walks 4–11: a few minutes of checking, an **unconditional** UnrealBuildTool rebuild (§8) and project-file regeneration (§9), and **§4 still verifies GitHub/EpicGames SSH access and `die`s if it has lapsed**, which aborts the run before the migration ever happens. On a Mac that only needs a new project zip, always pass `UE_SKIP_ENGINE=1`.

### 8b. Re-point the engine association
The Windows `.uproject` carries a Windows engine GUID. Point it at the source build:
```bash
# in <Project>.uproject, set:  "EngineAssociation": ""
# Empty + launching the specific UnrealEditor binary (8e) uses THIS engine.
```

### 8c. Vet the plugins (the make-or-break step)
- **Source plugins** (have a `Source/` dir) recompile for Mac automatically — fine.
- **Marketplace plugins** that shipped **Windows-only precompiled binaries** will NOT load on Mac. Confirm each enabled plugin either has `Source/` or ships **Mac** binaries:
  ```bash
  find Plugins -type d -iname 'Mac'      # Mac ThirdParty/native libs → good
  find Plugins \( -name '*.dylib' -o -name '*.a' \) | grep -i mac | head
  ```
  (The validated AWS SDK plugin ships full `Mac/Editor/*.dylib` + `Mac/Game/*.a` for every service — it "just built.")
- Note: a plugin's **folder name may differ from the plugin name** (e.g. folder `UltimateMultiplayerServicesPlugin` contains `awsSDK.uplugin`). Match by the `.uplugin`, not the folder.

### 8d. Compile the project's editor target for Mac
The engine's Clang-17 suppressions (Section 4b) automatically apply to project & plugin compiles too.
```bash
cd /Volumes/UnrealEngine/UE_5_4_1
Engine/Build/BatchFiles/Mac/Build.sh <Project>Editor Mac Development \
  -project="/Volumes/UnrealEngine/Unreal_Projects/<Project>/<Project>.uproject" \
  -MaxParallelActions=6
# Produces <Project>/Binaries/Mac/UnrealEditor-<Project>.dylib + plugin dylibs. Expect "Deploying now!".
```

### 8e. Open it
```bash
open /Volumes/UnrealEngine/UE_5_4_1/Engine/Binaries/Mac/UnrealEditor.app \
  --args "/Volumes/UnrealEngine/Unreal_Projects/<Project>/<Project>.uproject"
```

---

## 9. Runtime crash fixes (needed for EmbeddedVoiceChat / proximity voice on 5.4.1)
These are **UE 5.4.1 source bugs**, independent of the migration — they crash on project load once EmbeddedVoiceChat is active. Both are platform-agnostic engine edits; **rebuild the project editor target (8d) after applying** (fast — the audio one recompiles 1 module, Character.h ~47 actions).

Crash logs live in `Engine/Saved/Crashes/CrashReport-UE-<Project>-pid-*/` (the *engine's* Saved, not the project's, because it dies before the project log opens).

### 9a. `SIGSEGV 0x0` in `FAudioCapture::FAudioCapture()` at ~75% load
`AudioCapture` startup constructs `FAudioCapture` during a CDO while **`GEngine` is still null**, and the code calls `GEngine->UseSound()` unguarded.
File: `Engine/Source/Runtime/AudioCaptureCore/Private/AudioCaptureInternal.h` (in `FAudioCapture::CreateImpl`, ~line 41)
```cpp
- if (AudioCaptureStreamFactories.Num() > 0 && AudioCaptureStreamFactories[0] != nullptr && GEngine->UseSound())
+ if (AudioCaptureStreamFactories.Num() > 0 && AudioCaptureStreamFactories[0] != nullptr && (GEngine == nullptr || GEngine->UseSound()))
```

### 9b. Replicated editor-only property in `ACharacter` (multiplayer layout mismatch)
The replicated struct `FRepRootMotionMontage` contains an editor-only deprecated `UPROPERTY`, causing editor↔server layout mismatch in multiplayer.
File: `Engine/Source/Runtime/Engine/Classes/GameFramework/Character.h` — delete the block (~lines 48–52; it's only referenced at its own declaration, so removal is safe):
```cpp
#if WITH_EDITORONLY_DATA
	/** AnimMontage providing Root Motion */
	UPROPERTY(meta = (DeprecatedProperty, DeprecationMessage = "Use the GetAnimMontage function instead"))
	TObjectPtr<UAnimMontage> AnimMontage_DEPRECATED = nullptr;
#endif
```
> `Character.h` is a core header — this rebuild touches the Engine module + dependents (~47 actions in practice, ~1 min).

**Result:** editor launches → compiles project shaders → level loads → AWS SDK dylibs load → proximity voice works.

---

## 10. Quick reference — full fix inventory (on top of vanilla 5.4.1)
| # | Change | File | Purpose |
|---|--------|------|---------|
| 1 | 5.4.1→5.4.4 Apple UBT backport | `UnrealBuildTool/Platform/Apple`, `Config/Apple` | Accept Xcode 16 SDK |
| 2 | +5 `-Wno-…` lines | `Platform/Mac/MacToolChain.cs` | Clang-17 warnings-as-errors |
| 3 | `mLefttChild`→`mLeftChild` | `ThirdParty/FBX/.../fbxredblacktree.h` | Clang-17 lookup |
| 4 | `bBuildAllModules=false` | `Source/UnrealEditor.Target.cs` | skip broken experimental plugins |
| 5 | **rebuild UBT** after any UBT `.cs` edit | `dotnet build UnrealBuildTool.csproj` | edits ignored otherwise |
| 6 | Build `ShaderCompileWorker` (+ tools) | `Build.sh ShaderCompileWorker …` | first-launch requirement |
| 7 | `GEngine` null-guard | `AudioCaptureCore/.../AudioCaptureInternal.h` | project-load crash (voice) |
| 8 | delete `AnimMontage_DEPRECATED` block | `GameFramework/Character.h` | multiplayer replication |

**Pitfalls that cost the most time:** (5) forgetting to rebuild UBT; assuming a build/agent's "success" claim instead of checking ground truth (log growth, `clang` procs, disk); putting the project on ExFAT; and reading the *project* Saved/Logs when early crashes go to the *engine's* Saved/Crashes.

> The table above is the **build + editor-runtime** fix set. The separate **packaging/runtime-feature** fixes (signing, sandbox/entitlements, CEF, video, mic, AWS cook gate) are catalogued in **§11g**.

---

## 11. Packaging the project for macOS (`BuildCookRun`)
Packaging a **Development** build for Mac needs a set of project-specific fixes beyond the engine/editor build. All validated 2026-07-24 (`awsTutorial` → ad-hoc-signed `.app`, `BuildCookRun … ExitCode=0`, launches and runs with login + video + mic).

> **TL;DR — the fast path.** Once the one-time fixes in §11a–§11e are in place, packaging is a **single command** (§11f: `package-awsTutorial-mac.sh`). You only ever repeat §11f. The rest of this section explains *why* each fix exists so the team can maintain it.
>
> **⚠️ Package from the CLI — the editor's one-click "Package Project" does not work on this project.** It cooks correctly and then deadlocks on exit forever, with no way to recover from inside the editor. This is structural, not a misconfiguration, and none of §11a–§11g fixes it. **§11h** explains why and gives the explicit command-line build/package commands, the per-target build matrix, and hang recovery. If you are here to package: §11f (script) or §11h-4 (the raw commands).

### 11a. Code signing — ad-hoc for local/lab, real signing for distribution
UE 5.4's **Modern Xcode** workflow (`bUseModernXcode=True`) hands the finished `.app` to `xcodebuild`, which **refuses to sign without a development team or provisioning profile**:
```
error: Signing for "<Project>" requires selecting either a development team or a provisioning profile.
** BUILD FAILED **   →   ERROR: Failed to finalize the .app with Xcode.
```
A fresh dev Mac has **zero signing identities** (`security find-identity -v -p codesigning` → "0 valid identities"), and the project ships with `bUseAutomaticCodeSigning=False`, so there is nothing to sign with. Fix — enable **ad-hoc** ("Sign to Run Locally"); no Apple account, team, cert, or profile required.

File: `<Project>/Config/DefaultEngine.ini`
```ini
[/Script/MacTargetPlatform.XcodeProjectSettings]
bMacSignToRunLocally=True      ; ad-hoc sign — was False (the fix)
bUseAutomaticCodeSigning=False
bUseModernXcode=True
```
This lives in the project, so it fixes packaging for the whole team. Result: an ad-hoc `.app` (`codesign -dv` → `Signature=adhoc`, `TeamIdentifier=not set`). It runs on the build Mac; on **another** Mac, Gatekeeper blocks it (`spctl -a -t exec` → *rejected* — expected) until you either **right-click → Open** once, or clear quarantine:
```bash
xattr -dr com.apple.quarantine "<Project>.app"
```

**For real distribution** (outside the lab), instead of ad-hoc you need, one-time:
- A **paid Apple Developer account** and a **Developer ID Application** certificate in the login keychain.
- A real bundle id — the default is `com.YourCompany.<Project>` (`CodeSigningPrefix=com.YourCompany` in BaseEngine.ini); override `CodeSigningPrefix` / `BundleIdentifier` in the section above.
- Either automatic signing (`bUseAutomaticCodeSigning=True` + `CodeSigningTeam=<TEAMID>`) or manual (`bMacSignToRunLocally=False`, `MacSigningIdentity=Developer ID Application`).
- After packaging, **notarize + staple**: `xcrun notarytool submit <App>.zip --apple-id … --team-id … --wait`, then `xcrun stapler staple "<Project>.app"`. Only a notarized+stapled app launches with no warning on other Macs.

### 11b. App Sandbox must be OFF — custom entitlements (CEF login + voice need it)
UE 5.4 Modern Xcode signs the `.app` with the **App Sandbox** entitlement by default. Inside the sandbox, **CEF/Chromium cannot initialize** (the Cognito Hosted-UI login web view — see §11c — dies), and network behaviour is restricted. Ship a **no-sandbox** entitlements file instead.

Create `<Project>/Build/Mac/Resources/NoSandbox.entitlements`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- No com.apple.security.app-sandbox on purpose: CEF (WebBrowserWidget / Cognito
         login) cannot init in the sandbox. Outside the sandbox network is unrestricted;
         the network keys are harmless and kept for clarity. get-task-allow suits
         Development/local; drop it for a notarized Developer ID distribution build. -->
    <key>com.apple.security.get-task-allow</key><true/>
    <key>com.apple.security.network.client</key><true/>
    <key>com.apple.security.network.server</key><true/>
</dict>
</plist>
```
Point the project at it — `<Project>/Config/DefaultEngine.ini`, same `[/Script/MacTargetPlatform.XcodeProjectSettings]` block as §11a:
```ini
PremadeMacEntitlements=(FilePath="/Game/Build/Mac/Resources/NoSandbox.entitlements")
ShippingSpecificMacEntitlements=(FilePath="/Game/Build/Mac/Resources/NoSandbox.entitlements")
```
Verify after packaging: `codesign -d --entitlements :- <App>` must show **no** `com.apple.security.app-sandbox` key. (Reversible: delete the two INI lines to fall back to UE's default sandboxed entitlements.)

### 11c. Packaged app crashes at launch in `cef_initialize` (Cognito login) — CEF framework path
The Cognito login uses a CEF/Chromium web view. UE hard-codes CEF's location to `<EngineDir>/Binaries/ThirdParty/CEF3/Mac/…`, but Modern-Xcode packaging **stages the framework inside the app bundle** at `Contents/Frameworks/`. In the packaged app the engine-relative path doesn't exist, so `cef_initialize` dereferences a missing framework and the app **SIGTRAPs on launch** (right when the login web view would appear). *(Editor is unaffected — it runs from the engine dir, where the legacy path exists.)*

**Durable fix (engine source, reversible)** — `Engine/Source/Runtime/WebBrowser/Private/WebBrowserSingleton.cpp`, in `Initialize(...)`: after each of the two legacy paths is computed (`ResourcesPath` ~L305 and `CefFrameworkPath` ~L351), fall back to the executable-relative bundle path when the legacy one is absent. Both edits are Mac-relevant and guarded by `!FPaths::DirectoryExists(...)`, so they are inert anywhere the legacy path already resolves:
```cpp
// after ResourcesPath is built (marker: [ue541 packaging fix - reversible])
if (!FPaths::DirectoryExists(ResourcesPath))
{
    const FString BundleResources = FPaths::ConvertRelativePathToFull(FPaths::Combine(
        FPaths::GetPath(FPlatformProcess::ExecutablePath()),
        TEXT("../Frameworks/Chromium Embedded Framework.framework/Resources")));
    if (FPaths::DirectoryExists(BundleResources)) { ResourcesPath = BundleResources; }
}
// ...and the same pattern for CefFrameworkPath -> "../Frameworks/Chromium Embedded Framework.framework"
// applied to BOTH Settings.framework_dir_path and Settings.main_bundle_path.
```
This is an **engine** edit → rebuild the engine WebBrowser module, then the game target (the packaging script's `-build` does this). **Belt-and-suspenders:** the packaging script (§11f) also drops a symlink so even an un-patched engine finds CEF:
```bash
<App>/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac/Chromium Embedded Framework.framework
   ->  ../../../../../../Frameworks/Chromium Embedded Framework.framework
```

### 11d. Streamed surgical videos are blank on Mac (MPEG-DASH) — force ElectraPlayer
The surgical videos are `StreamMediaSource` assets pointing at **MPEG-DASH** manifests (`…/adaptive_360.mpd` on CloudFront). Mac's default media backend **AvfMedia (AVFoundation) cannot decode DASH** — it fails with `-12847` / "Failed to load video tracks" and the screen stays blank. **ElectraPlayer** decodes DASH cross-platform. Set a per-platform player override so Mac uses Electra while other platforms are untouched.

**This must be re-applied to EVERY freshly migrated project.** The override lives in the assets, so a new copy from Windows arrives with **zero** overrides (confirmed 2026-08-25: 442/442 had none straight out of the zip).

#### The one command (preferred — headless, does not touch `.uproject`)
```bash
cd ~/Downloads/ue541-team-package
./apply-electra-override-mac.sh           # DRY RUN — lists, changes nothing
./apply-electra-override-mac.sh apply     # applies, saves, then VERIFIES on disk
```
Requires the project's **editor target already built for Mac** (§8d). It runs `set_electra_override.py` as a `-run=pythonscript` commandlet with `-EnablePlugins=PythonScriptPlugin`, so **`awsTutorial.uproject` is never modified** (PythonScriptPlugin is `EnabledByDefault:false` and deliberately absent from the project file).

In-editor alternative: *Tools ▸ Execute Python Script…* → `set_electra_override.py` (`DRY_RUN=True` first, then `False`).
Per asset, by hand: open the `StreamMediaSource` → **Player Overrides** (a.k.a. `PlatformPlayerNames`) → add row **`Mac` → `ElectraPlayer`** → save.

#### ⚠️ Two silent failures this has actually produced
**1. Commandlet mode starts with an EMPTY Asset Registry.** `ar.get_assets()` returned **0** assets, the loop never ran, and the commandlet exited in **0.06 s** logging `Python script executed successfully` — a total no-op reported as success. Fixed in `set_electra_override.py` by calling `scan_paths_synchronous()` when the first query comes back empty (measured: 0 assets before the scan, **443** after). A run that reports `found: 0` is now a hard failure.

**2. `unreal.log()` output is SWALLOWED in commandlet mode** — only Warnings and Errors survive. Silence is not evidence of anything. The summary is therefore also emitted as a Warning (`ELECTRA_RESULT {...}`) and written to `/tmp/electra_result.json`.

#### ⚠️ VERIFY ON DISK — never trust the script's own report
```bash
python3 verify_media_overrides.py <Project>/Content/Media/StreamMediaSources
# PASS -> exit 0; anything missing/wrong -> exit 1 and the offenders are listed
```
`verify_media_overrides.py` parses the raw `.uasset` bytes and **needs no Unreal at all**, so it can contradict the tool it is checking. `apply-electra-override-mac.sh apply` runs it automatically.

**A `grep` CANNOT verify this.** `PlatformPlayerNames` is a `transient` UPROPERTY, hand-serialized by `UBaseMediaSource::Serialize` as a raw `TMap<FGuid,FGuid>`. Neither the string `PlatformPlayerNames` nor `ElectraPlayer` appears in an **uncooked** asset whether or not the override is set. (In **cooked** assets it *is* greppable — `PreSave` resolves the map to a plain `PlayerName` FName — so `grep -rl ElectraPlayer Saved/Cooked/Mac/...` is a valid post-cook check.)

What a correct result looks like — the override map sits at the tail of the media-source export blob (empty = 4 bytes; one entry = 4+16+16 = 36):
```
442/442   96e23b000c4f001760781f8e1fbbef81 -> 803fee949242608ed54dd2b4c2e1adfd
              Mac platform GUID                    ElectraPlayer plugin GUID
```
GUID sources: Mac = `GlobalIdentifier` in `Engine/Config/Mac/DataDrivenPlatformInfo.ini`; ElectraPlayer = `GetPlayerPluginGUID()` in `ElectraPlayerFactoryModule.cpp`. (Displayed forms are `003BE29617004F0C8E1F786081EFBB1F` and `94EE3F808E604292B4D24DD5FDADE1C2`; an `FGuid` is four little-endian `uint32`s, hence the different byte order on disk.)

The two files that legitimately report "not a media source" are `ObjectRedirector`s (`CHOC_BOTH_1080_Low`, `TAVR_Animation`) — 444 files, 442 media sources. That reconciles the older "443/443" note.

Changed `.uasset`s are picked up at the next cook. (ATS note: `NSAllowsArbitraryLoads=true` in the plist template — §11e path — is what lets the app hit the plaintext-HTTP CloudFront streams at all.)

### 11e. Microphone is silent to peers — `NSMicrophoneUsageDescription`
Without a mic-usage string in `Info.plist`, macOS never shows the permission prompt and **feeds the app pure silence** — voice capture "runs" but records `max recorded volume 0.000000`, so peers hear nothing (the app itself may still hear others). UE merges `Build/Mac/Resources/Info.Template.plist` into the packaged `Info.plist` at stage time, so add the key **there** (durable across repackages) — do **not** hand-edit the packaged `Info.plist`:

`<Project>/Build/Mac/Resources/Info.Template.plist` → add inside the top-level `<dict>`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>awsTutorial uses your microphone for in-game proximity voice chat.</string>
```
(The same template already carries `NSAppTransportSecurity → NSAllowsArbitraryLoads=true` for the HTTP video streams. `plutil -lint` it after editing.) On first launch of the new build, **click Allow** on the mic prompt (or System Settings ▸ Privacy & Security ▸ Microphone). Verified fixed: input levels went from a flat `0.000000` to live speech peaks with `LogEmbeddedVoiceChat … human voice` detection. *(Confirming a remote peer actually receives the audio is the last open voice check — see §12.)*

### 11f. One command to package — handles the AWS cook-hang — and YOUR map workflow
**The AWS cook-hang.** With the AWS SDK + EmbeddedVoiceChat plugins, the **cook succeeds** (`Success - 0 error(s)`) but the cook commandlet then **hangs on exit** — AWS Common Runtime (`libaws-c-io`) event-loop threads don't terminate, so UAT blocks and stage/pak/archive never start (`sample <pid>` shows it parked in `_pthread_cond_wait` with `libaws-c-io`/`AWSCore` loaded). This is the same teardown deadlock behind the app's force-quit problem (§12).

Two mitigations are in place:
- **Source gate (reversible), already applied** — `…/Plugins/UltimateMultiplayerServicesPlugin/Source/AWSCore/Private/AWSCoreModule.cpp` wraps **both** `Aws::InitAPI` (StartupModule) and `Aws::ShutdownAPI` (ShutdownModule) in `if (!IsRunningCommandlet()) { … }` (marker `[ue541 packaging fix - reversible]`). Effect: the **cook commandlet never starts the AWS CRT**, so it can't hang on it — while the **shipped game/editor still init + shut down AWS normally** (`IsRunningCommandlet()` is false there). This does **not** disable any AWS functionality in the running game. *(A deeper `NSApplication terminate` deadlock can still stall a cook's exit, so the script below keeps the kill step as insurance.)*
- **The packaging script** — `package-awsTutorial-mac.sh` does: **cook → wait for completion → force-kill the stuck cook → re-run with `-skipcook`** for stage/pak/sign/archive (UnrealPak doesn't load AWS, so no hang), then ensures the §11c CEF symlink. It only ever kills processes matching `-run=Cook`; an open interactive editor is left alone.

```bash
# One-time: make it executable, then just run it whenever you want a build.
chmod +x package-awsTutorial-mac.sh
./package-awsTutorial-mac.sh
# Overridable via env: UE_ENGINE, UE_PROJECT, UE_ARCHIVE. Output: <Project>/Packaged/Mac/awsTutorial.app
```

**⚠️ MAP SELECTION IS YOURS — the script never touches map settings.** The intended flow is *UserLogin → hospital level*. You choose which hospital level ships by **saving `Hospital_Server` or `Hospital_Client` AS `FirstPersonMap`** in the editor first, then packaging. The script does **not** modify `GameDefaultMap` / `ServerDefaultMap` / any map INI keys — it packages whatever you've saved as `FirstPersonMap`, preserving the login→level sequence. (Current project defaults, left intact: `GameDefaultMap=/Game/FirstPerson/Maps/UserLogin`, `ServerDefaultMap=/Game/FirstPerson/Maps/FirstPersonMap`.)

**Gatekeeper on other Macs** (ad-hoc builds): first launch is blocked until you **right-click ▸ Open** once, or `xattr -dr com.apple.quarantine "<Project>.app"`.

### 11g. Packaging fix inventory (project/plugin, on top of §4 & §9 engine fixes)
| # | Change | File | Purpose | Reversible |
|---|--------|------|---------|-----------|
| P1 | `bMacSignToRunLocally=True` | `Config/DefaultEngine.ini` | ad-hoc sign (no Apple team) | set False |
| P2 | `PremadeMacEntitlements` + `ShippingSpecificMacEntitlements` → `NoSandbox.entitlements` | `Config/DefaultEngine.ini` + `Build/Mac/Resources/NoSandbox.entitlements` | sandbox OFF so CEF/voice work | delete 2 INI lines |
| P3 | CEF exec-relative fallback (×2) | `Engine/…/WebBrowser/Private/WebBrowserSingleton.cpp` | packaged login web view doesn't crash | `.bak` restore |
| P4 | `Mac → ElectraPlayer` on all `StreamMediaSource` | `Content/Media/StreamMediaSources/**` (via `set_electra_override.py`) | DASH video plays on Mac | re-run script clearing Mac row |
| P5 | `NSMicrophoneUsageDescription` | `Build/Mac/Resources/Info.Template.plist` | mic captures real audio (not silence) | remove key |
| P6 | `!IsRunningCommandlet()` gate on `Aws::InitAPI`/`ShutdownAPI` | `…/AWSCore/Private/AWSCoreModule.cpp` | cook commandlet doesn't hang on AWS CRT | `.bak` restore |

### 11h. ⚠️ The editor's **Package Project** button does NOT work on this project — package from the CLI

**Rule: package `awsTutorial` for Mac from the command line. Do not use the editor's one-click Package Project.** This is not a misconfiguration and it is not fixed by §11a–§11g. Every CLI package in the validation session succeeded; **both** editor-GUI package attempts hung and had to be killed. The cause is structural (below), so the GUI path is not a supported fallback — it is a dead end that costs ~10 minutes of cook time before it strands you.

#### 11h-1. Why the GUI fails — two distinct hangs, in order

**Hang 1 — AWS CRT threads. Fixed by §11f, but *only* if you rebuilt the right target.**
The cook does not run as the game; it runs as the **editor** (`UnrealEditor -run=Cook`), so it loads the **editor's** plugin dylibs (`.../Binaries/Mac/UnrealEditor-AWSCore.dylib`). The `!IsRunningCommandlet()` gate from §11f therefore does nothing until the **editor** target is rebuilt. In the validation session the gate was written at 11:53 but `UnrealEditor-AWSCore.dylib` was still dated 07:16 — so the cook ran the old, unguarded AWS code and deadlocked exactly as before. After rebuilding the editor target (dylib → 12:28), a cook-only run exited cleanly in 42 s with `Aws::InitAPI called` occurrences = **0**. See §11h-3 for which target to build for what.

**Hang 2 — `-EditorIOPort` / AppKit termination. NOT fixed. This is the blocker.**
The editor spawns its cook with a live IPC back-channel to the still-running editor:
```
UnrealEditor … -run=Cook … -EditorIOPort=57842
```
With that port present the cook **finishes its work correctly** — all 2916 packages, `Success - 0 error(s)`, `LogExit: Exiting`, log closed — and then **never terminates**. `sample <pid>` puts the main thread in AppKit teardown:
```
main → -[NSApplication terminate:] → -[NSApplication _shouldTerminate]  (in AppKit) + 1188 → mach_msg wait
```
The process sits at **0 % CPU indefinitely**, so UAT never advances to stage/pak/archive and the editor's progress bar hangs forever. Observed on both attempts (`-EditorIOPort=56990`, then `=57842`). A plain `RunUAT` cook has **no** `-EditorIOPort` and exits cleanly — that difference is the whole story. This is the same AppKit teardown deadlock behind the dev-only editor force-quit in §12.

**Why you cannot recover from inside the editor:** the editor exposes no "reuse the existing cook" option. The CLI does (`-skipcook`), which is exactly what makes the CLI path reliable — the cook's output is complete and reusable, so recovery is a ~90 s stage/pak instead of a full re-cook.

**How to recognise it if someone tries the GUI anyway**
- Packaging progress bar stalls with no new output, indefinitely.
- Activity Monitor shows a `UnrealEditor` process at **0 % CPU** (not spinning — parked).
- `<Project>/Saved/Logs/Cook-*.log` ends **normally**: `Success - 0 error(s)` … `LogExit: Exiting`. The cook worked; only the exit is stuck. Do not go hunting for a cook error — there isn't one.
- Nothing ever appears in the archive directory.

Recovery = §11h-5 (kill the stuck cook), then run the stage command in §11h-4 step 2 — the completed cook is reused.

#### 11h-2. Prerequisites for any CLI build

```bash
# 1. The APFS volume must be mounted (it is NOT mounted automatically after a reboot/unplug — §2)
ls /Volumes/UnrealEngine || hdiutil attach /Volumes/<ExternalDrive>/UnrealEngine.sparsebundle

# 2. Paths used by every command below
ENGINE=/Volumes/UnrealEngine/UE_5_4_1
PROJDIR=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial
UPROJECT="$PROJDIR/awsTutorial.uproject"
ARCHIVE="$PROJDIR/Packaged/Mac"
RUNUAT="$ENGINE/Engine/Build/BatchFiles/RunUAT.sh"
UEDITOR="$ENGINE/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
```
- **`-MaxParallelActions`** on any `Build.sh` below: same RAM rule as §6 (24 GB → 6–8).
- Wrap long runs in `caffeinate -dimsu …` so the Mac never sleeps mid-build, and over SSH use `nohup … </dev/null &` so the build survives a disconnect (§6).
- **Set your map first** (§11f): save `Hospital_Server` or `Hospital_Client` **as `FirstPersonMap`** in the editor, then quit or leave the editor open — the CLI never touches map settings. *Then* run the CLI. Closing the editor first is cleaner but not required (the kill step in §11h-5 only matches cook processes).

#### 11h-3. Which target to build — the three layers, and the one that bites

`Build.sh` builds **one** target. Building the wrong one is the single most expensive mistake here, because the failure looks identical to not having applied the fix at all.

| # | Target | Command | Rebuild it when you changed… |
|---|--------|---------|------------------------------|
| L1 | **Engine editor** — `UnrealEditor` | `Engine/Build/BatchFiles/Mac/Build.sh UnrealEditor Mac Development -MaxParallelActions=6` | engine source (§4, §9, §11c `WebBrowserSingleton.cpp`) |
| L2 | **Project editor** — `awsTutorialEditor` <br>*(this is what produces the **cook** binaries)* | `Engine/Build/BatchFiles/Mac/Build.sh awsTutorialEditor Mac Development -project="$UPROJECT" -MaxParallelActions=6` | project or **plugin** source — incl. §11f `AWSCoreModule.cpp` |
| L3 | **Game** — `awsTutorial` | `Engine/Build/BatchFiles/Mac/Build.sh awsTutorial Mac Development -project="$UPROJECT" -MaxParallelActions=6` | anything shipping in the `.app` (the package command in §11h-4 does this for you via `-build`) |

> **⚠️ The cook runs as the EDITOR, so cook behaviour comes from L2 — never L3.** A plugin fix compiled only into the game target (L3) leaves `<Project>/Binaries/Mac/UnrealEditor-<Plugin>.dylib` stale, and the cook silently keeps running the old code. This is what made the §11f AWS gate appear not to work. **Verify, don't assume** — the dylib's mtime must be newer than your edit:
> ```bash
> ls -la "$PROJDIR"/Binaries/Mac/UnrealEditor-AWSCore.dylib     # must post-date your source edit
> ```
> macOS will relink these even with the editor open; restart the editor afterwards so it loads them.

#### 11h-4. Package from the CLI — the two explicit commands

`package-awsTutorial-mac.sh` (§11f) runs exactly these, with the wait/kill automated in between. Run them by hand when you're debugging, adapting the flow, or the script has stopped part-way.

```bash
COMMON=(-project="$UPROJECT" -target=awsTutorial -platform=Mac -clientconfig=Development
        -unrealexe="$UEDITOR" -nop4 -utf8output
        -nocompileeditor -skipbuildeditor -nocompile -nocompileuat)
```

**Step 1 — cook** (expect ~8 min for 2916 packages; it will very likely hang *after* succeeding — that's §11h-1 Hang 2 and it is fine):
```bash
caffeinate -dimsu "$RUNUAT" BuildCookRun "${COMMON[@]}" -cook 2>&1 | tee /tmp/awsTutorial-cook.log
```
Watch for **both** markers, which together mean the cook is genuinely done:
```
Success - 0 error(s), NN warning
Execution of commandlet took … seconds
```
The moment you see them, the cook's output is complete and reusable — **kill it** (§11h-5) rather than waiting.

**Step 2 — stage / pak / sign / archive with `-skipcook`** (~90 s; `UnrealPak` doesn't load AWS, so nothing hangs):
```bash
caffeinate -dimsu "$RUNUAT" BuildCookRun "${COMMON[@]}" \
  -skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs \
  -archivedirectory="$ARCHIVE" 2>&1 | tee /tmp/awsTutorial-stage.log
```
Success = `BUILD SUCCESSFUL` in the log. Output: `$ARCHIVE/awsTutorial.app`.

**Step 3 — CEF safety net** (harmless if the §11c engine fix is already in; re-run after *every* package):
```bash
APP="$ARCHIVE/awsTutorial.app"
if [ -d "$APP/Contents/Frameworks/Chromium Embedded Framework.framework" ]; then
  mkdir -p "$APP/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac"
  ln -sfn "../../../../../../Frameworks/Chromium Embedded Framework.framework" \
     "$APP/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac/Chromium Embedded Framework.framework"
fi
```

Flag notes, since these are the ones people delete and then wonder why it broke: `-nocompileeditor -skipbuildeditor` keep UAT from rebuilding the editor mid-package (you did that deliberately in §11h-3); `-nocompile -nocompileuat` stop it rebuilding UAT/UBT itself; `-unrealexe=` points the cook at *this* source-built editor rather than a Launcher install; `-iostore -compressed` match the shipping pak format; `-prereqs` is a no-op on Mac but harmless and kept so the line is copy-paste identical to the script.

#### 11h-5. Detect and clear a hung cook

```bash
# Is a cook alive, and is it doing anything?  (0.0 %CPU + cook log already finished = hung)
ps -Ao pid,pcpu,etime,command | grep '[-]run=Cook'

# Confirm WHERE it's stuck (expect -[NSApplication _shouldTerminate] on the main thread)
sample <pid> 3 -file /tmp/cook-sample.txt && head -40 /tmp/cook-sample.txt

# Kill only cook processes — an open interactive editor is NOT matched by these patterns
pkill -f 'UnrealEditor.*-run=Cook'
pkill -f 'AutomationTool.dll.*BuildCookRun.*-cook'
```
Then go straight to §11h-4 **Step 2**. Never re-cook to recover from this hang — the cook already succeeded.

#### 11h-6. Verify the result

```bash
APP="$ARCHIVE/awsTutorial.app"
ls -la "$APP/Contents/MacOS/"                                   # binary should be minutes old, not days
codesign -dv "$APP" 2>&1 | grep -E 'Signature=|Identifier='     # → Signature=adhoc  (§11a)
codesign -d --entitlements :- "$APP" 2>&1 | grep -c app-sandbox # → 0  (§11b — sandbox must be OFF)
du -sh "$APP"                                                   # ~3.5–3.6 GB for a healthy build
open "$APP"
```
**Check the timestamp, not just the exit code.** A stale `.app` from a previous run sitting in the archive directory is the classic false pass — in the validation session a "BUILD SUCCESSFUL" was matched against an old line in an accumulating log while the real cook was still hung, and the app in `Packaged/Mac` was two hours old. Confirm the binary's mtime is from *this* run before you conclude anything about a fix.

---

## 12. Known issues / open items (updated 2026-08-24)
- **Editor "Package Project" deadlocks — OPEN, worked around, use the CLI (§11h).** The editor-spawned cook carries `-EditorIOPort=<port>` and hangs in `-[NSApplication _shouldTerminate]` after cooking successfully, so the GUI package never reaches staging and cannot be recovered from inside the editor. Reproduced twice; every CLI package succeeded. **Workaround is permanent policy for this project: package via §11f (script) or §11h-4 (raw commands).** Root-causing the AppKit teardown is not planned — it is the same deadlock as the editor force-quit below and buys nothing the CLI path doesn't already give.
- **Packaged game exit hang — RESOLVED (2026-07-25).** The packaged `.app` previously went to a black screen on exit and had to be force-quit. Investigation (log analysis + live thread `sample`s + controlled reproduction) ruled out AWS (its event-loops destroy and `Aws::ShutdownAPI` completes cleanly in the log) and CEF (the login-screen quit exits clean), and localized the hang to the **audio-capture stream teardown**: with the mic in permission-limbo (no `NSMicrophoneUsageDescription` → macOS silence-feed), the CoreAudio/RtAudio capture stream never closed cleanly and blocked process teardown. Adding the mic key (§11e) fixed capture **and** the exit hang together — verified over repeated full joined-voice sessions that now reach `Log file closed` and the process actually terminates (no lingering PID). No risky teardown-code change was needed.
- **Editor-only force-quit — OPEN, dev-only, low priority.** *(Same AppKit teardown deadlock that breaks GUI packaging — §11h-1 Hang 2.)* The **source-built `UnrealEditor.app`** still hangs on quit (force-quit needed) after a play-in-editor session. It does **not** affect the shipped game (the deliverable quits cleanly). Its `Info.plist` already carries a mic-usage key, so the first thing to check is whether macOS mic permission was actually **granted to `UnrealEditor`** (System Settings ▸ Privacy & Security ▸ Microphone) — if denied, its capture stream is in the same limbo that hung the game. If it's granted and the editor still hangs, it's likely a generic UE-5.4-source-on-Mac editor-teardown issue (heavier module/CEF teardown), independent of this project. Diagnose the same way if desired: reproduce, then `sample <pid>` the lingering process. Not pursued further since it doesn't affect the packaged build.
- **Voice end-to-end receipt — last confirmation pending.** Mic **capture** is verified live (§11e). Confirming that a **remote peer actually hears** the packaged Mac client (capture → encode → GameLift → peer) is the final voice checkpoint and was not re-run at time of writing. If a peer can't hear you despite live capture, the issue is downstream of capture (session/channel routing), not the mic.

---
*Validated: engine build & Windows→Mac migration 2026-07-23; macOS packaging + runtime (ad-hoc sign, no-sandbox entitlements, CEF path, ElectraPlayer video, mic permission, one-command `-skipcook` package) 2026-07-24. **§11h added 2026-08-24** — the editor-GUI packaging deadlock and the explicit CLI build/package procedure, written up from the 2026-07-24 validation session (process args, `sample` stacks, and cook logs captured live at the time). Back up every edited engine/project file before changing it — see each item's "Reversible" note.*
