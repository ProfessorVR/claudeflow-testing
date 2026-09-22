#!/usr/bin/env bash
# =============================================================================
#  Unreal Engine 5.4.1 — one-shot source build + Windows→Mac project migration
#  Apple Silicon · macOS 15 (Sequoia) · Xcode 16.4 / Clang 17
#
#  Runs end-to-end: verify access → clone → apply Xcode16/Clang17 fixes → build
#  engine + tools → migrate the bundled project → build project → ready to open.
#
#  IDEMPOTENT & RE-RUNNABLE: safe to re-run after an interruption; completed
#  steps are detected and skipped. Every source edit is content-anchored and
#  self-detects "already applied".
#
#  Prompts for the few needed variables, or read them from env vars:
#    UE_ENGINE_PARENT   parent dir for the engine (default /Volumes/UnrealEngine)
#    UE_PROJECT_ZIP     path to the project .zip  (default: the single .zip beside this script)
#    UE_PARALLEL        -MaxParallelActions       (default: auto from RAM)
#    UE_NONINTERACTIVE  =1 to accept all defaults without prompting
#    UE_SKIP_PROJECT    =1 to build only the engine (no project migration)
#    UE_SKIP_ENGINE     =1 to SKIP steps 4-11 entirely and go straight to the project
#                          migration (step 12). Use when the engine is already built and
#                          you are only swapping in a new project zip. Also avoids the
#                          step-4 GitHub/EpicGames access check, which otherwise aborts
#                          the whole run if your SSH key or org membership has lapsed.
# =============================================================================
set -uo pipefail

# Stop macOS from writing AppleDouble (._*) sidecars during this script's own
# copies/unzips. On ExFAT/FAT these ._ files are created by the OS regardless, so
# they are also scrubbed explicitly before the project build (Section 12).
export COPYFILE_DISABLE=1 COPY_EXTENDED_ATTRIBUTES_DISABLE=1

ENGINE_TAG="5.4.1-release"
BACKPORT_TAG="5.4.4-release"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
C_G=$'\033[0;32m'; C_Y=$'\033[0;33m'; C_R=$'\033[0;31m'; C_B=$'\033[1m'; C_0=$'\033[0m'

log()  { printf "%s\n" "${C_G}[+]${C_0} $*"; }
warn() { printf "%s\n" "${C_Y}[!]${C_0} $*" >&2; }
die()  { printf "%s\n" "${C_R}[x] $*${C_0}" >&2; exit 1; }
step() { printf "\n%s\n" "${C_B}==== $* ====${C_0}"; }
have() { command -v "$1" >/dev/null 2>&1; }
confirm() { # confirm "question" ; default yes
  [ "${UE_NONINTERACTIVE:-0}" = 1 ] && return 0
  local a; read -r -p "$(printf '%s [Y/n] ' "$1")" a; [[ -z "$a" || "$a" =~ ^[Yy] ]]; }
ask() { # ask VAR "prompt" "default"
  local __v=$1 __p=$2 __d=${3:-}; local __in=""
  if [ "${UE_NONINTERACTIVE:-0}" = 1 ]; then printf -v "$__v" '%s' "$__d"; return; fi
  read -r -p "$(printf '%s [%s]: ' "$__p" "$__d")" __in; printf -v "$__v" '%s' "${__in:-$__d}"; }

# --- apply-once python edit helper: apply_edit <file> <python-body-using p,s> ---
py_edit() { python3 - "$1" <<PYEOF
import sys
p=sys.argv[1]; s=open(p,encoding='utf-8',errors='surrogateescape').read()
$2
open(p,'w',encoding='utf-8',errors='surrogateescape').write(s)
PYEOF
}

# =============================================================================
step "0 · Preflight"
[ "$(uname -s)" = "Darwin" ] || die "This script is for macOS."
[ "$(uname -m)" = "arm64" ]  || warn "Not Apple Silicon (arm64). The fixes are validated on arm64 only."
have git || die "git not found (install Xcode command line tools: xcode-select --install)."
have python3 || die "python3 not found."
XCV="$(xcodebuild -version 2>/dev/null | awk 'NR==1{print $2}')"
[ -n "$XCV" ] || die "Xcode not found / not selected. Run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
case "$XCV" in 16.*) log "Xcode $XCV (expected)";; *) warn "Xcode $XCV — fixes are calibrated for 16.4/Clang 17; a different major version may need different patches.";; esac
RAM_GB=$(( $(sysctl -n hw.memsize) / 1073741824 ))
CORES=$(sysctl -n hw.physicalcpu 2>/dev/null || echo 8)
log "Detected ${RAM_GB} GB RAM, ${CORES} physical cores."

# =============================================================================
step "1 · Configuration"
# Default: build on the internal drive under the home directory (most common).
# To build on an external drive instead, enter that drive's path (e.g. /Volumes/MySSD);
# if it's ExFAT/FAT the script will create an APFS image on it automatically (Section 3).
ask ENGINE_PARENT "Where to build (internal home dir by default; or an external drive path)" "${UE_ENGINE_PARENT:-$HOME/UnrealEngine}"
# Parallelism is limited by RAM, not cores: compile actions use ~1-2 GB each, but
# the LINK phase spikes to several GB/action and is what OOM-kills a build.
# Recommend the highest level whose min-RAM fits, capped at physical cores.
REC=4
for pair in 6:16 8:24 10:32 12:40 16:48; do
  n=${pair%%:*}; need=${pair##*:}
  [ "$RAM_GB" -ge "$need" ] && REC=$n
done
[ "$REC" -gt "$CORES" ] && REC=$CORES
cat <<EONG
  ${C_B}-MaxParallelActions — RAM guidance${C_0} (min RAM; the link phase spikes highest):
       actions :   4      6      8     10     12     16
       min RAM :  12GB   16GB   24GB   32GB   40GB   48GB
  This Mac: ${RAM_GB} GB RAM / ${CORES} cores  ->  recommended: ${C_B}${REC}${C_0}
  Higher = faster, but if it exhausts RAM at link the build dies; just re-run at a
  lower number (it resumes). On 24 GB, 6-8 is the safe range.
EONG
ask PARALLEL "Max parallel compile actions" "${UE_PARALLEL:-$REC}"
if [ "${UE_SKIP_PROJECT:-0}" != 1 ]; then
  DEF_ZIP="${UE_PROJECT_ZIP:-$(ls "$SCRIPT_DIR"/*.zip 2>/dev/null | head -1)}"
  ask PROJECT_ZIP "Path to the project .zip to migrate (blank = engine only)" "$DEF_ZIP"
  if [ -n "$PROJECT_ZIP" ]; then
    # Where the migrated project folder is created. Must be APFS (it compiles); an ExFAT
    # choice is caught & redirected in Section 12. Default = standard macOS UE location.
    ask PROJECT_DEST "Folder to place the migrated project in (APFS / internal drive)" "${UE_PROJECT_DEST:-$HOME/Documents/Unreal Projects}"
  fi
else PROJECT_ZIP=""; fi
ENGINE_ROOT="$ENGINE_PARENT/UE_5_4_1"
PROJECTS_DIR="$ENGINE_PARENT/Unreal_Projects"
log "Engine:   $ENGINE_ROOT"
[ -n "${PROJECT_ZIP:-}" ] && log "Project:  ${PROJECT_DEST}/  (folder named from the zip's .uproject)"
log "Parallel: $PARALLEL   Project zip: ${PROJECT_ZIP:-<none>}"
confirm "Proceed with these settings?" || die "Aborted."

# =============================================================================
step "2 · Prerequisites"
# Rosetta 2 — REQUIRED on Apple Silicon. UE 5.4 ships x86_64-only helper tools (e.g. the
# IOSTargetPlatform device-query tool spawned at editor startup). Without Rosetta the built
# editor ABORTS on launch: "posix_spawn() failed (86, Bad CPU type in executable)".
if [ "$(uname -m)" = "arm64" ]; then
  if [ -f /Library/Apple/usr/libexec/oah/libRosettaRuntime ]; then
    log "Rosetta 2 present."
  else
    log "Installing Rosetta 2 (required for UE's x86_64 helper tools)…"
    softwareupdate --install-rosetta --agree-to-license \
      || warn "Rosetta 2 auto-install failed — run 'softwareupdate --install-rosetta --agree-to-license' manually before launching the editor, or it crashes with 'Bad CPU type in executable'."
  fi
fi
if ! have brew; then
  confirm "Homebrew not found. Install it?" && /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || die "Homebrew required."
fi
have cmake   || { log "Installing cmake";        brew install cmake; }
brew list python@3.11 >/dev/null 2>&1 || { log "Installing python@3.11 (Setup.sh fallback)"; brew install python@3.11 || warn "python@3.11 install failed (non-fatal)."; }
log "Accepting Xcode license (may prompt for sudo)…"; sudo xcodebuild -license accept || warn "Could not auto-accept Xcode license."
xcodebuild -runFirstLaunch >/dev/null 2>&1 || true

# =============================================================================
step "3 · Storage"
# Determine the filesystem hosting the chosen build location.
mkdir -p "$ENGINE_PARENT" 2>/dev/null || true
[ -d "$ENGINE_PARENT" ] || die "Build location $ENGINE_PARENT does not exist and could not be created (is the drive mounted?)."
# Disk-space guard — a full source build (deps + intermediates + binaries) needs ~220-250 GB.
AVAIL_GB="$(df -g "$ENGINE_PARENT" 2>/dev/null | awk 'NR==2{print $4}')"
if [ -n "${AVAIL_GB:-}" ] && [ "$AVAIL_GB" -lt 250 ]; then
  warn "Only ${AVAIL_GB} GB free at $ENGINE_PARENT — a full build needs ~220-250 GB."
  confirm "Continue anyway (risky if it runs out mid-build)?" || die "Free up space or pick a drive with more room."
fi
FS_TYPE="$(diskutil info "$ENGINE_PARENT" 2>/dev/null | awk -F: '/File System Personality/{gsub(/^[ \t]+/,"",$2);print $2; exit}')"
if printf '%s' "$FS_TYPE" | grep -qiE 'exfat|msdos|fat'; then
  warn "Build location is $FS_TYPE — UE cannot build on ExFAT/FAT. Using an APFS sparse bundle image on it."
  IMG="$ENGINE_PARENT/UnrealEngine.sparsebundle"          # <-- image lives ON the chosen (external) drive
  if [ ! -e "$IMG" ]; then
    confirm "Create a 600 GB case-insensitive APFS sparse bundle at $IMG?" || die "APFS volume required."
    hdiutil create -size 600g -type SPARSEBUNDLE -fs "APFS" -volname "UnrealEngine" "$IMG"
  fi
  hdiutil attach "$IMG" >/dev/null 2>&1 || true
  [ -d /Volumes/UnrealEngine ] || die "Sparse bundle failed to mount at /Volumes/UnrealEngine (try: hdiutil attach '$IMG')."
  ENGINE_PARENT="/Volumes/UnrealEngine"
  log "Mounted APFS build volume at $ENGINE_PARENT"
else
  log "Build location filesystem: ${FS_TYPE:-unknown} (assuming APFS / OK)."
fi
ENGINE_ROOT="$ENGINE_PARENT/UE_5_4_1"; PROJECTS_DIR="$ENGINE_PARENT/Unreal_Projects"
mkdir -p "$PROJECTS_DIR"
log "Engine root: $ENGINE_ROOT"

# =============================================================================
# -----------------------------------------------------------------------------
# Steps 4-11 build the ENGINE. With UE_SKIP_ENGINE=1 they are skipped wholesale.
# Without it they are individually idempotent (clone/fixes detect "already done",
# builds are incremental) but still take a few minutes AND still require working
# GitHub/EpicGames access in step 4.
# -----------------------------------------------------------------------------
if [ "${UE_SKIP_ENGINE:-0}" = 1 ]; then
  step "4-11 · SKIPPED (UE_SKIP_ENGINE=1) — using the engine already at $ENGINE_ROOT"
  [ -x "$ENGINE_ROOT/Engine/Binaries/Mac/UnrealEditor-Cmd" ] \
    || [ -d "$ENGINE_ROOT/Engine/Binaries/Mac/UnrealEditor.app" ] \
    || die "UE_SKIP_ENGINE=1 but no built editor found at $ENGINE_ROOT — build it first."
  log "Engine binaries found."
else
step "4 · Verify EpicGames / GitHub access"
if ! git ls-remote "git@github.com:EpicGames/UnrealEngine.git" "$ENGINE_TAG" 2>/dev/null | grep -q "$ENGINE_TAG"; then
  cat >&2 <<'MSG'
[x] Cannot read EpicGames/UnrealEngine over SSH.
    This is per-user and cannot be scripted. Each teammate must, ONE TIME:
      1. Create/confirm an SSH key:   ssh-keygen -t ed25519 -C "you@email"
         and add ~/.ssh/id_ed25519.pub to GitHub → Settings → SSH keys.
      2. Link GitHub↔Epic:  https://www.unrealengine.com/en-US/ue-on-github
         then ACCEPT the emailed invitation to join the EpicGames GitHub org
         (check github.com/EpicGames or your notifications).
    Verify with:  git ls-remote git@github.com:EpicGames/UnrealEngine.git 5.4.1-release
    Re-run this script once that returns a SHA.
MSG
  exit 1
fi
log "EpicGames access confirmed."

# =============================================================================
step "5 · Clone UE $ENGINE_TAG"
if [ -f "$ENGINE_ROOT/GenerateProjectFiles.sh" ]; then
  log "Engine already present at $ENGINE_ROOT (skipping clone)."
else
  log "Cloning (shallow)… this pulls ~15–25 GB."
  git clone --depth 1 --branch "$ENGINE_TAG" "git@github.com:EpicGames/UnrealEngine.git" "$ENGINE_ROOT"
fi
cd "$ENGINE_ROOT"
git fetch --depth 1 origin tag "$BACKPORT_TAG" 2>/dev/null || warn "Could not fetch $BACKPORT_TAG (needed for the Apple backport)."
BK="$ENGINE_ROOT/.ue541_fix_backups"; mkdir -p "$BK"

# =============================================================================
step "6 · Apply Xcode 16.4 / Clang 17 engine fixes"

# 6a — Apple SDK/toolchain backport from 5.4.4 -----------------------------------
PATCH="$BK/xcode16_apple.patch"
git diff "$ENGINE_TAG" "$BACKPORT_TAG" -- \
  "Engine/Source/Programs/UnrealBuildTool/" "Engine/Config/Apple/" "Engine/Build/BatchFiles/Mac/" > "$PATCH" 2>/dev/null || true
if [ -s "$PATCH" ]; then
  if git apply --reverse --check "$PATCH" 2>/dev/null; then log "6a Apple backport already applied."
  elif git apply --check "$PATCH" 2>/dev/null; then git apply --whitespace=fix "$PATCH"; log "6a Apple backport applied."
  else warn "6a Apple backport does not apply cleanly (already partially applied or conflict) — verify manually."; fi
else warn "6a Could not generate the 5.4.1→5.4.4 Apple diff (is the $BACKPORT_TAG tag fetched?)."; fi

# 6b — MacToolChain.cs: 5 Clang-17 warning suppressions ---------------------------
MTC="Engine/Source/Programs/UnrealBuildTool/Platform/Mac/MacToolChain.cs"
if grep -q '\-Wno-shorten-64-to-32' "$MTC"; then log "6b MacToolChain suppressions already present."
else
  cp "$MTC" "$BK/MacToolChain.cs.bak"
  py_edit "$MTC" '
anchor="base.GetCompileArguments_WarningsAndErrors(CompileEnvironment, Arguments);"
assert s.count(anchor)==1, "anchor not found in MacToolChain.cs"
adds="".join("\n\t\t\tArguments.Add(\"%s\");"%f for f in [
  "-Wno-shorten-64-to-32","-Wno-vla-cxx-extension","-Wno-extra-qualification",
  "-Wno-missing-template-arg-list-after-template-kw","-Wno-error=dangling-assignment"])
s=s.replace(anchor, anchor+"\n"+adds+"  // Xcode16.4/Clang17 fixes", 1)
'
  log "6b Added 5 Clang-17 suppressions to MacToolChain.cs."
fi

# 6c — FBX SDK header typo --------------------------------------------------------
FBX="Engine/Source/ThirdParty/FBX/2020.2/include/fbxsdk/core/base/fbxredblacktree.h"
if [ -f "$FBX" ] && grep -q 'mLefttChild' "$FBX"; then
  cp "$FBX" "$BK/fbxredblacktree.h.bak"; perl -pi -e 's/mLefttChild/mLeftChild/g' "$FBX"; log "6c Fixed FBX header typo."
else log "6c FBX header already correct."; fi

# 6d — bBuildAllModules = false ---------------------------------------------------
TGT="Engine/Source/UnrealEditor.Target.cs"
if grep -q 'bBuildAllModules = false' "$TGT"; then log "6d bBuildAllModules already false."
elif grep -q 'bBuildAllModules = true' "$TGT"; then
  cp "$TGT" "$BK/UnrealEditor.Target.cs.bak"
  perl -pi -e 's/bBuildAllModules = true;/bBuildAllModules = false; \/\/ skip broken experimental plugins (Clang17)/' "$TGT"
  log "6d Set bBuildAllModules=false."
else warn "6d Could not find bBuildAllModules in $TGT."; fi

# 6e — Runtime fix: AudioCapture GEngine null-guard (EmbeddedVoiceChat/proximity voice) --
ACI="Engine/Source/Runtime/AudioCaptureCore/Private/AudioCaptureInternal.h"
if grep -q '(GEngine == nullptr' "$ACI"; then log "6e AudioCapture GEngine guard already present."
else
  cp "$ACI" "$BK/AudioCaptureInternal.h.bak"
  py_edit "$ACI" '
old="AudioCaptureStreamFactories[0] != nullptr && GEngine->UseSound())"
new="AudioCaptureStreamFactories[0] != nullptr && (GEngine == nullptr || GEngine->UseSound()))"
assert s.count(old)==1, "AudioCaptureInternal.h anchor not found"
s=s.replace(old,new)
'
  log "6e Applied AudioCapture GEngine null-guard."
fi

# 6f — Runtime fix: remove replicated editor-only AnimMontage_DEPRECATED from ACharacter --
CHR="Engine/Source/Runtime/Engine/Classes/GameFramework/Character.h"
if ! grep -q 'AnimMontage_DEPRECATED' "$CHR"; then log "6f Character.h AnimMontage_DEPRECATED already removed."
else
  cp "$CHR" "$BK/Character.h.bak"
  py_edit "$CHR" '
import re
# remove the specific #if WITH_EDITORONLY_DATA ... AnimMontage_DEPRECATED ... #endif block
pat=re.compile(r"[ \t]*#if WITH_EDITORONLY_DATA\r?\n(?:[^\n]*\r?\n){0,4}?[^\n]*AnimMontage_DEPRECATED[^\n]*\r?\n[ \t]*#endif\r?\n")
new,n=pat.subn("",s,count=1)
assert n==1, "AnimMontage_DEPRECATED editor-only block not matched"
s=new
'
  log "6f Removed AnimMontage_DEPRECATED editor-only block from Character.h."
fi

# =============================================================================
step "7 · Setup.sh (binary dependencies + bundled dotnet)"
# Always run it: GitDependencies is idempotent — it hash-verifies existing files and only
# fetches what's missing (fast if already complete), so a resume after an interrupted
# download can never be mistaken for 'done'.
./Setup.sh || python3.11 Setup.py || die "Setup.sh failed."

# =============================================================================
step "8 · Rebuild UnrealBuildTool (REQUIRED after UBT .cs edits)"
DOTNET="$(ls "$ENGINE_ROOT"/Engine/Binaries/ThirdParty/DotNet/*/mac-arm64/dotnet 2>/dev/null | head -1)"
[ -n "$DOTNET" ] || die "Bundled dotnet not found — did Setup.sh complete?"
"$DOTNET" build Engine/Source/Programs/UnrealBuildTool/UnrealBuildTool.csproj -c Development -v minimal \
  || die "UBT rebuild failed."
log "UBT rebuilt (your MacToolChain/Apple fixes are now live)."

# =============================================================================
step "9 · Generate project files"
./GenerateProjectFiles.sh || warn "GenerateProjectFiles reported an issue (continuing — not required for the CLI build)."

# =============================================================================
step "10 · Build UnrealEditor (long — go get coffee)"
# Build.sh is incremental: if the editor is already built & up-to-date this returns quickly.
caffeinate -dimsu & CAFF=$!
trap 'kill $CAFF 2>/dev/null || true' EXIT
Engine/Build/BatchFiles/Mac/Build.sh UnrealEditor Mac Development -MaxParallelActions="$PARALLEL" \
  || die "Editor build failed — see output above. (Incremental: just re-run this script to resume.)"
log "UnrealEditor built."

# =============================================================================
step "11 · Build tool targets (ShaderCompileWorker is required to launch)"
Engine/Build/BatchFiles/Mac/Build.sh ShaderCompileWorker Mac Development -MaxParallelActions="$PARALLEL" \
  || warn "ShaderCompileWorker build failed — the editor will not compile shaders without it."

fi   # end of UE_SKIP_ENGINE guard (steps 4-11)

# =============================================================================
if [ -z "${PROJECT_ZIP:-}" ]; then
  step "Done — engine only"
  log "Launch:  open '$ENGINE_ROOT/Engine/Binaries/Mac/UnrealEditor.app'"
  exit 0
fi

step "12 · Migrate project"
[ -f "$PROJECT_ZIP" ] || die "Project zip not found: $PROJECT_ZIP"
# Resolve & validate the project destination (default: next to the engine if never set).
PROJECT_DEST="${PROJECT_DEST:-$ENGINE_PARENT/Unreal_Projects}"
mkdir -p "$PROJECT_DEST" 2>/dev/null || true
PFS="$(diskutil info "$PROJECT_DEST" 2>/dev/null | awk -F: '/File System Personality/{gsub(/^[ \t]+/,"",$2);print $2; exit}')"
if printf '%s' "$PFS" | grep -qiE 'exfat|msdos|fat'; then
  warn "Project destination '$PROJECT_DEST' is $PFS — a C++ project can't compile there."
  PROJECT_DEST="$ENGINE_PARENT/Unreal_Projects"; mkdir -p "$PROJECT_DEST"
  warn "Redirecting the project to $PROJECT_DEST (APFS)."
fi
# Detect the project name from the zip's .uproject
UPROJ_IN_ZIP="$(unzip -Z1 "$PROJECT_ZIP" 2>/dev/null | grep -iE '^[^/]*\.uproject$' | head -1)"
[ -n "$UPROJ_IN_ZIP" ] || die "No top-level .uproject found in $PROJECT_ZIP"
PROJ_NAME="${UPROJ_IN_ZIP%.uproject}"
DEST="$PROJECT_DEST/$PROJ_NAME"
# -----------------------------------------------------------------------------
# ⚠️ 2026-08-25 FIX — DO NOT silently skip when $DEST is already occupied.
# The old guard was simply:
#     if [ -f "$DEST/$UPROJ_IN_ZIP" ]; then log "Project already extracted"
# Every migrated project unzips to the SAME name (awsTutorial), so an OBSOLETE
# copy already sitting there was kept, built and packaged, while the zip you had
# just transferred was ignored — and the script still reported success. That is
# exactly how an obsolete fork reached macOS and cost days of debugging.
# Now: move whatever is there aside (never delete) and extract fresh.
# Set UE_KEEP_EXISTING=1 to deliberately keep what is already at $DEST.
# -----------------------------------------------------------------------------
if [ -d "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
  if [ "${UE_KEEP_EXISTING:-0}" = 1 ]; then
    warn "UE_KEEP_EXISTING=1 — keeping the project already at $DEST (the zip is NOT used)."
  else
    ASIDE="${DEST}_superseded_$(date +%Y%m%d-%H%M%S)"
    warn "$DEST is already occupied — moving it aside to:"
    warn "    $ASIDE"
    mv "$DEST" "$ASIDE" || die "Could not move $DEST aside (in use? permissions?)."
  fi
fi
if [ -f "$DEST/$UPROJ_IN_ZIP" ]; then log "Project already extracted at $DEST."
else log "Extracting $PROJ_NAME -> $DEST …"; mkdir -p "$DEST"; ( cd "$DEST" && unzip -q -o "$PROJECT_ZIP" -x '._*' '__MACOSX/*' ) || die "unzip failed"; fi
log "Extracted from: $PROJECT_ZIP"
UPROJ="$DEST/$UPROJ_IN_ZIP"

# EngineAssociation -> "" (use this source engine)
perl -pi -e 's/("EngineAssociation":\s*)"[^"]*"/$1""/' "$UPROJ"
log "Set EngineAssociation to the local source engine."

# Plugin sanity scan (warn on Windows-only precompiled plugins)
if [ -d "$DEST/Plugins" ]; then
  for pdir in "$DEST"/Plugins/*/; do
    [ -d "$pdir" ] || continue; pn="$(basename "$pdir")"
    if [ ! -d "${pdir}Source" ] && [ -d "${pdir}Binaries/Win64" ] && [ ! -d "${pdir}Binaries/Mac" ]; then
      warn "Plugin '$pn' has Windows binaries but no Source/ and no Mac binaries — it may fail to load on Mac."
    fi
  done
fi

# --- AppleDouble guard ---------------------------------------------------------
# UBT globs *.uplugin / *.uproject / *.Build.cs / *.Target.cs and FATALLY chokes on
# macOS AppleDouble (._*) sidecar files, which parse as binary not JSON
# ("'0x00' is an invalid start of a value"). These appear whenever the project lives
# on ExFAT/FAT (the OS shadows every xattr'd file) or came from a Mac-created zip.
# If the project is on ExFAT/FAT, mirror it to APFS first; then always scrub ._*.
UPROJ_FS="$(diskutil info "$(dirname "$UPROJ")" 2>/dev/null | awk -F: '/File System Personality/{gsub(/^[ \t]+/,"",$2);print $2; exit}')"
if printf '%s' "$UPROJ_FS" | grep -qiE 'exfat|msdos|fat'; then
  warn "Project is on $UPROJ_FS — UE cannot build reliably there (AppleDouble ._ files break UBT)."
  APFS_DEST="$ENGINE_PARENT/Unreal_Projects/$PROJ_NAME"
  log "Mirroring project to APFS at $APFS_DEST (excluding ._*, .DS_Store, build intermediates)…"
  mkdir -p "$APFS_DEST"
  rsync -a --delete --exclude '._*' --exclude '.DS_Store' \
        --exclude 'Intermediate/' --exclude 'Saved/' --exclude 'DerivedDataCache/' --exclude 'Binaries/' \
        "$DEST"/ "$APFS_DEST"/ || die "Failed to mirror project to APFS."
  DEST="$APFS_DEST"; UPROJ="$DEST/$UPROJ_IN_ZIP"
  log "Building the APFS copy at $DEST."
fi
# Strip any AppleDouble sidecars UBT would try to JSON-parse (idempotent; harmless on APFS).
have dot_clean && dot_clean -m "$DEST" 2>/dev/null || true
find "$DEST" -name '._*' -type f -delete 2>/dev/null || true

step "13 · Build project editor target for Mac"
Engine/Build/BatchFiles/Mac/Build.sh "${PROJ_NAME}Editor" Mac Development \
  -project="$UPROJ" -MaxParallelActions="$PARALLEL" \
  || die "Project build failed — check the plugin scan warnings above and the compiler output."
log "Project '$PROJ_NAME' built for Mac."

# =============================================================================
step "DONE — everything built"
cat <<MSG
${C_B}Engine + tools + project are ready.${C_0}

Open the migrated project:
  open '$ENGINE_ROOT/Engine/Binaries/Mac/UnrealEditor.app' --args '$UPROJ'

First launch compiles project shaders (several minutes, CPU pegged, no window)
before the level appears — that is normal.

Backups of every edited engine file: $BK
Full method & rationale: the SOP markdown shipped alongside this script.
MSG
