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
#    UE_ENGINE_PARENT   parent dir for the engine (default $HOME/UnrealEngine; the Air uses /Volumes/UnrealEngine)
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
# Written for Apple's /bin/bash 3.2 (the default on every Mac): no bash-4 features — no empty-array expansion under
# set -u, no mapfile, no ${var,,}. Non-login shells (ssh, nohup, launchd) do not have Homebrew on PATH (2026-09-21).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

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
# Interactive prompts need a terminal: with stdin closed (nohup, ssh without a tty) `read` returns at once and every
# question used to be answered "yes"/"default" while none of the unattended safeguards were on (2026-09-21 review).
need_tty() { [ "${UE_NONINTERACTIVE:-0}" = 1 ] && return 0
  [ -t 0 ] || die "stdin is not a terminal — run with UE_NONINTERACTIVE=1 (and the UE_* variables) for an unattended run."
  # BSD nohup keeps stdin: a backgrounded interactive run would stop on SIGTTIN at the first prompt, silently.
  [ "$(ps -o tpgid= -p $$ | tr -d ' ')" = "$(ps -o pgid= -p $$ | tr -d ' ')" ] || die "running in the background — an interactive run must be in the foreground; use UE_NONINTERACTIVE=1 for nohup."; }
abspath() { case "$1" in /*) printf '%s' "$1";; *) printf '%s/%s' "$(cd "$(dirname "$1")" 2>/dev/null && pwd)" "$(basename "$1")";; esac; }
confirm() { # confirm "question" ; default yes
  [ "${UE_NONINTERACTIVE:-0}" = 1 ] && return 0
  need_tty; local a; read -r -p "$(printf '%s [Y/n] ' "$1")" a || return 1; [[ -z "$a" || "$a" =~ ^[Yy] ]]; }
ask() { # ask VAR "prompt" "default"
  local __v=$1 __p=$2 __d=${3:-}; local __in=""
  if [ "${UE_NONINTERACTIVE:-0}" = 1 ]; then printf -v "$__v" '%s' "$__d"; return; fi
  need_tty; read -r -p "$(printf '%s [%s]: ' "$__p" "$__d")" __in || die "no answer (stdin closed)"; printf -v "$__v" '%s' "${__in:-$__d}"; }
# Filesystem personality of the volume holding <path>: diskutil only knows devices and mount points ("Could not find
# disk" for a subfolder), so resolve the mount point with df first (2026-09-21 review).
mount_of() { df -P "$1" 2>/dev/null | awk 'NR==2' | sed 's/^.*%[[:space:]]*//'; }   # everything after the Capacity column: mount points may contain spaces
fs_of() { local mp; mp="$(mount_of "$1")"; [ -n "$mp" ] || { echo ""; return; }
  diskutil info "$mp" 2>/dev/null | awk -F: '/File System Personality/{gsub(/^[ \t]+/,"",$2);print $2; exit}'; }

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
# Keep the Mac awake for the whole run (clone, Setup.sh and the project build are as long as the editor build and
# used to run outside step 10's caffeinate); -w ends the assertion when this script exits.
caffeinate -dimsu -w $$ >/dev/null 2>&1 &

# =============================================================================
step "1 · Configuration"
# Default: build on the internal drive under the home directory (most common).
# To build on an external drive instead, enter that drive's path (e.g. /Volumes/MySSD);
# if it's ExFAT/FAT the script will create an APFS image on it automatically (Section 3).
ask ENGINE_PARENT "Where to build (internal home dir by default; or an external drive path)" "${UE_ENGINE_PARENT:-$HOME/UnrealEngine}"
ENGINE_PARENT="$(abspath "$ENGINE_PARENT")"   # step 5 cd's into the engine; a relative path would not survive that
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
  # Exactly one zip beside the script is auto-detected. Two or more used to pick the alphabetically first one in
  # silence (an older dated zip sorts first) — now it is an error unless UE_PROJECT_ZIP says which (2026-09-21).
  if [ -n "${UE_PROJECT_ZIP:-}" ]; then DEF_ZIP="$UE_PROJECT_ZIP"
  else
    # AppleDouble sidecars (._name.zip, written by macOS on the ExFAT lab drive) are not zips.
    NZIP=0; ZIPS=""; DEF_ZIP=""
    for z in "$SCRIPT_DIR"/*.zip; do
      [ -f "$z" ] || continue; case "$(basename "$z")" in ._*) continue;; esac
      NZIP=$((NZIP+1)); ZIPS="$ZIPS $(basename "$z")"; [ -n "$DEF_ZIP" ] || DEF_ZIP="$z"
    done
    [ "$NZIP" -gt 1 ] && die "More than one .zip beside this script:$ZIPS — set UE_PROJECT_ZIP=<the one to migrate> or move the others to old-zips/."
  fi
  ask PROJECT_ZIP "Path to the project .zip to migrate (blank = engine only)" "$DEF_ZIP"
  if [ -n "$PROJECT_ZIP" ]; then
    # Validate the zip NOW, not after the multi-hour engine build (2026-09-21 review): it must exist and hold exactly
    # one top-level .uproject (a zip with a wrapping folder, or a stray ._ sidecar first, would fail at step 12).
    [ -f "$PROJECT_ZIP" ] || die "Project zip not found: $PROJECT_ZIP"
    PROJECT_ZIP="$(abspath "$PROJECT_ZIP")"
    UPROJ_IN_ZIP="$(unzip -Z1 "$PROJECT_ZIP" 2>/dev/null | grep -iE '^[^/]*\.uproject$' | grep -v '^\._' | head -1)"
    [ -n "$UPROJ_IN_ZIP" ] || die "No top-level .uproject in $PROJECT_ZIP (is the project wrapped in a folder? make-project-zip.sh produces the right layout)."
    # Where the migrated project folder is created. Must be APFS (it compiles); an ExFAT
    # choice is caught & redirected in Section 12. Default = standard macOS UE location.
    ask PROJECT_DEST "Folder to place the migrated project in (APFS / internal drive)" "${UE_PROJECT_DEST:-$HOME/Documents/Unreal Projects}"
    PROJECT_DEST="$(abspath "$PROJECT_DEST")"
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
if xcodebuild -license check >/dev/null 2>&1; then log "Xcode license already accepted."
else
  log "Accepting Xcode license (may prompt for sudo)…"; sudo xcodebuild -license accept || warn "Could not auto-accept Xcode license."
  # An unaccepted license only surfaces hours later as an obscure UBT/clang error — stop here instead (2026-09-21).
  xcodebuild -license check >/dev/null 2>&1 || die "Xcode license not accepted. Run once in a terminal: sudo xcodebuild -license accept — then re-run."
fi
xcodebuild -runFirstLaunch >/dev/null 2>&1 || true

# =============================================================================
step "3 · Storage"
# Determine the filesystem hosting the chosen build location.
mkdir -p "$ENGINE_PARENT" 2>/dev/null || true
[ -d "$ENGINE_PARENT" ] || die "Build location $ENGINE_PARENT does not exist and could not be created (is the drive mounted?)."
RAW_PARENT="$ENGINE_PARENT"      # the physical drive chosen; the disk guard below measures it even after a redirect
FS_TYPE="$(fs_of "$ENGINE_PARENT")"
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
BK="$ENGINE_ROOT/.ue541_fix_backups"      # defined here, not in step 5: the DONE message and step 12 need it on every route
mkdir -p "$PROJECTS_DIR"
log "Engine root: $ENGINE_ROOT"
# Disk-space guard — a full source build (deps + intermediates + binaries) needs ~220-250 GB. Evaluated here, after
# the ExFAT→sparse-bundle redirect, against the FINAL engine root (an engine inside the image on a nearly full
# ExFAT drive used to be taken for "no engine" — 2026-09-21 review); skipped when the engine is not being built.
if [ "${UE_SKIP_ENGINE:-0}" != 1 ] && [ ! -f "$ENGINE_ROOT/GenerateProjectFiles.sh" ]; then
  # A sparse bundle reports its nominal free space; the physical drive underneath is what fills up — take the smaller.
  AVAIL_GB="$(df -g "$ENGINE_PARENT" 2>/dev/null | awk 'NR==2{print $4}')"
  RAW_GB="$(df -g "$RAW_PARENT" 2>/dev/null | awk 'NR==2{print $4}')"
  if [ -n "${RAW_GB:-}" ] && { [ -z "${AVAIL_GB:-}" ] || [ "$RAW_GB" -lt "$AVAIL_GB" ]; }; then AVAIL_GB="$RAW_GB"; fi
  if [ -n "${AVAIL_GB:-}" ] && [ "$AVAIL_GB" -lt 250 ]; then
    warn "Only ${AVAIL_GB} GB free at $RAW_PARENT / $ENGINE_PARENT — a full build needs ~220-250 GB."
    # Unattended, a fresh clone on a small disk fills it mid-Setup — refuse rather than auto-confirm.
    [ "${UE_NONINTERACTIVE:-0}" = 1 ] && die "Refusing an unattended fresh engine build with ${AVAIL_GB} GB free. Free up space or set UE_ENGINE_PARENT to a larger drive."
    confirm "Continue anyway (risky if it runs out mid-build)?" || die "Free up space or pick a drive with more room."
  fi
fi

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
  # The game depends on engine patch 6g (2026-09-21); an engine built before it must go through step 6 once
  # (run without UE_SKIP_ENGINE=1 — clone/fixes self-detect, the editor build is incremental and only recompiles MetalRHI).
  [ -f "$SCRIPT_DIR/check_engine_patch.sh" ] || die "check_engine_patch.sh is missing beside this script — the team package is incomplete (re-sync it)."
  bash "$SCRIPT_DIR/check_engine_patch.sh" "$ENGINE_ROOT/Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp" \
    || die "ENGINE_PATCH_MISSING — this engine lacks patch 6g. Re-run WITHOUT UE_SKIP_ENGINE=1 so step 6 applies it and step 10 rebuilds."
else
step "4 · Verify EpicGames / GitHub access"
# Captured into a variable: `git … | grep -q` under pipefail can fail on SIGPIPE when grep exits early (2026-09-21).
# accept-new: the first contact with github.com from a fresh Mac must not stall on the host-key prompt (unattended) or be
# reported as an Epic-access problem; ssh's own error is shown when it fails.
LSERR="$(mktemp -t ue541-lsremote)"
# BatchMode only when unattended: an interactive user whose key has a passphrase must still get ssh's prompt.
SSH_OPTS="-o StrictHostKeyChecking=accept-new"; { [ "${UE_NONINTERACTIVE:-0}" = 1 ] || [ ! -t 0 ]; } && SSH_OPTS="$SSH_OPTS -o BatchMode=yes"
LSREMOTE="$(GIT_SSH_COMMAND="ssh $SSH_OPTS" git ls-remote "git@github.com:EpicGames/UnrealEngine.git" "$ENGINE_TAG" 2>"$LSERR" || true)"
if ! printf '%s' "$LSREMOTE" | grep -q "$ENGINE_TAG"; then
  [ -s "$LSERR" ] && { echo "--- git/ssh said:" >&2; sed 's/^/    /' "$LSERR" >&2; }
  rm -f "$LSERR"
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
rm -f "$LSERR"
log "EpicGames access confirmed."

# =============================================================================
step "5 · Clone UE $ENGINE_TAG"
FRESH_CLONE=0
if [ -f "$ENGINE_ROOT/GenerateProjectFiles.sh" ]; then
  log "Engine already present at $ENGINE_ROOT (skipping clone)."
else
  log "Cloning (shallow)… this pulls ~15–25 GB."
  git clone --depth 1 --branch "$ENGINE_TAG" "git@github.com:EpicGames/UnrealEngine.git" "$ENGINE_ROOT" \
    || die "Clone failed or incomplete. Remove $ENGINE_ROOT (if it exists) and re-run."
  FRESH_CLONE=1
fi
cd "$ENGINE_ROOT" || die "cannot cd to $ENGINE_ROOT"
git fetch --depth 1 origin tag "$BACKPORT_TAG" 2>/dev/null || warn "Could not fetch $BACKPORT_TAG (needed for the Apple backport)."
mkdir -p "$BK"

# =============================================================================
step "6 · Apply Xcode 16.4 / Clang 17 engine fixes"
# Every step records its real outcome in STATUS6 (written to APPLIED.txt at the end); an anchor that is not found
# stops the run here instead of surfacing hours later as a compile error (2026-09-21).
STATUS6=""; LAST6="6a"; APPLIED_WRITTEN=0
note6() { STATUS6="$STATUS6 $1=$2"; LAST6="$1"; }
# The outcome block is written by an EXIT trap too, so a run that dies inside step 6 still leaves an honest record
# ("incomplete after 6x") instead of only successes ever reaching APPLIED.txt (2026-09-21 review).
write_applied() {
  [ "$APPLIED_WRITTEN" = 1 ] && return 0; APPLIED_WRITTEN=1
  local tail=""; [ "${1:-}" = incomplete ] && tail=" INCOMPLETE — died in/after $LAST6"
  { printf '%s run-ue541-mac.sh:%s%s\n' "$(date -u +%FT%TZ)" "$STATUS6" "$tail"
    printf '  6g %s  %s\n' "$(md5 -q "$PATCHES/6g-MetalRHI-resolution-list.patch" 2>/dev/null)" "6g-MetalRHI-resolution-list.patch"
    printf '  6h %s  %s\n' "$(md5 -q "$PATCHES/6h-WebBrowserSingleton-CEF-fallback.patch" 2>/dev/null)" "6h-WebBrowserSingleton-CEF-fallback.patch"
  } >> "$BK/APPLIED.txt" 2>/dev/null || true
}
PATCHES="$SCRIPT_DIR/patches"
trap 'write_applied incomplete' EXIT

# 6a — Apple SDK/toolchain backport from 5.4.4 -----------------------------------
# "Present" is decided by the backport's key effect (Apple_SDK.json accepts the 16.x SDK), not by reverse-applying the
# diff: on every tree that was patched with --whitespace=fix, or touched by hand afterwards, the reverse-check fails
# although the tree builds (both lab Macs, 2026-09-21). A fresh tree that cannot take the backport will not build on
# Xcode 16 — stop before the hours-long build; a tree that already holds a built editor evidently compiled.
PATCH="$BK/xcode16_apple.patch"
SDKJSON="Engine/Config/Apple/Apple_SDK.json"
sdk16_present() { grep -qE '"MaxVersion"[^0-9]*1[6-9]\.' "$SDKJSON" 2>/dev/null; }
git diff "$ENGINE_TAG" "$BACKPORT_TAG" -- \
  "Engine/Source/Programs/UnrealBuildTool/" "Engine/Config/Apple/" "Engine/Build/BatchFiles/Mac/" > "$PATCH" 2>/dev/null || true
if [ -s "$PATCH" ] && git apply --check "$PATCH" 2>/dev/null; then
  git apply --whitespace=fix "$PATCH" || die "6a git apply failed"
  sdk16_present || die "6a applied but $SDKJSON still does not accept a 16.x SDK — the 5.4.4 diff is not what this script expects."
  log "6a Apple backport applied."; note6 6a applied
elif sdk16_present; then
  if [ -s "$PATCH" ] && git apply --reverse --check "$PATCH" 2>/dev/null; then log "6a Apple backport already applied."; note6 6a present
  else log "6a Apple backport present (SDK 16 accepted; the tree differs from the plain diff, e.g. whitespace-fixed or hand-edited)."; note6 6a present-modified; fi
else
  [ -s "$PATCH" ] || warn "6a Could not generate the 5.4.1→5.4.4 Apple diff (is the $BACKPORT_TAG tag fetched?)."
  if [ "$FRESH_CLONE" = 1 ] || [ ! -d "Engine/Binaries/Mac/UnrealEditor.app" ]; then
    die "6a Apple backport is neither applicable nor present ($SDKJSON does not accept a 16.x SDK) and no built editor exists here — this tree will not build on Xcode 16. Check the $BACKPORT_TAG tag and the clone."
  fi
  warn "6a Apple backport unverified (diff does not apply, SDK 16 not detected) but a built editor exists — continuing; verify by hand."; note6 6a unverified
fi

# 6b — MacToolChain.cs: 5 Clang-17 warning suppressions ---------------------------
MTC="Engine/Source/Programs/UnrealBuildTool/Platform/Mac/MacToolChain.cs"
if grep -q '\-Wno-shorten-64-to-32' "$MTC"; then log "6b MacToolChain suppressions already present."; note6 6b present
else
  cp "$MTC" "$BK/MacToolChain.cs.bak"
  py_edit "$MTC" '
anchor="base.GetCompileArguments_WarningsAndErrors(CompileEnvironment, Arguments);"
assert s.count(anchor)==1, "anchor not found in MacToolChain.cs"
adds="".join("\n\t\t\tArguments.Add(\"%s\");"%f for f in [
  "-Wno-shorten-64-to-32","-Wno-vla-cxx-extension","-Wno-extra-qualification",
  "-Wno-missing-template-arg-list-after-template-kw","-Wno-error=dangling-assignment"])
s=s.replace(anchor, anchor+"\n"+adds+"  // Xcode16.4/Clang17 fixes", 1)
' || die "6b anchor not found in $MTC — engine tree differs from 5.4.1"
  log "6b Added 5 Clang-17 suppressions to MacToolChain.cs."; note6 6b applied
fi

# 6c — FBX SDK header typo --------------------------------------------------------
FBX="Engine/Source/ThirdParty/FBX/2020.2/include/fbxsdk/core/base/fbxredblacktree.h"
if [ -f "$FBX" ] && grep -q 'mLefttChild' "$FBX"; then
  cp "$FBX" "$BK/fbxredblacktree.h.bak"; perl -pi -e 's/mLefttChild/mLeftChild/g' "$FBX"; log "6c Fixed FBX header typo."; note6 6c applied
else log "6c FBX header already correct."; note6 6c present; fi

# 6d — bBuildAllModules = false ---------------------------------------------------
TGT="Engine/Source/UnrealEditor.Target.cs"
if grep -q 'bBuildAllModules = false' "$TGT"; then log "6d bBuildAllModules already false."; note6 6d present
elif grep -q 'bBuildAllModules = true' "$TGT"; then
  cp "$TGT" "$BK/UnrealEditor.Target.cs.bak"
  perl -pi -e 's/bBuildAllModules = true;/bBuildAllModules = false; \/\/ skip broken experimental plugins (Clang17)/' "$TGT"
  log "6d Set bBuildAllModules=false."; note6 6d applied
else die "6d Could not find bBuildAllModules in $TGT — engine tree differs from 5.4.1"; fi

# 6e — Runtime fix: AudioCapture GEngine null-guard (EmbeddedVoiceChat/proximity voice) --
ACI="Engine/Source/Runtime/AudioCaptureCore/Private/AudioCaptureInternal.h"
if grep -q '(GEngine == nullptr' "$ACI"; then log "6e AudioCapture GEngine guard already present."; note6 6e present
else
  cp "$ACI" "$BK/AudioCaptureInternal.h.bak"
  py_edit "$ACI" '
old="AudioCaptureStreamFactories[0] != nullptr && GEngine->UseSound())"
new="AudioCaptureStreamFactories[0] != nullptr && (GEngine == nullptr || GEngine->UseSound()))"
assert s.count(old)==1, "AudioCaptureInternal.h anchor not found"
s=s.replace(old,new)
' || die "6e anchor not found in $ACI"
  log "6e Applied AudioCapture GEngine null-guard."; note6 6e applied
fi

# 6f — Runtime fix: remove replicated editor-only AnimMontage_DEPRECATED from ACharacter --
CHR="Engine/Source/Runtime/Engine/Classes/GameFramework/Character.h"
if ! grep -q 'AnimMontage_DEPRECATED' "$CHR"; then log "6f Character.h AnimMontage_DEPRECATED already removed."; note6 6f present
else
  cp "$CHR" "$BK/Character.h.bak"
  py_edit "$CHR" '
import re
# remove the specific #if WITH_EDITORONLY_DATA ... AnimMontage_DEPRECATED ... #endif block
pat=re.compile(r"[ \t]*#if WITH_EDITORONLY_DATA\r?\n(?:[^\n]*\r?\n){0,4}?[^\n]*AnimMontage_DEPRECATED[^\n]*\r?\n[ \t]*#endif\r?\n")
new,n=pat.subn("",s,count=1)
assert n==1, "AnimMontage_DEPRECATED editor-only block not matched"
s=new
' || die "6f block not matched in $CHR"
  log "6f Removed AnimMontage_DEPRECATED editor-only block from Character.h."; note6 6f applied
fi

# 6g / 6h — awsTutorial engine patches (added 2026-09-21), shipped as git patches in patches/ beside this script ----
#   6g  MetalRHI.cpp — RHIGetAvailableResolutions reports display modes in pixels. Stock 5.4.1 divides by the Retina
#       backing scale a second time, so the options menu's resolution list tops out at half the panel and the
#       graphics auto-tuner can never select native. check_engine_patch.sh is the guard; every packaging script
#       refuses to run without it (HANDOFF-2026-09-21.md §5, engine-patches/README.md).
#   6h  WebBrowserSingleton.cpp — CEF framework/resources fall back to <App>/Contents/Frameworks (SOP §11c). Without
#       it the packaged app SIGTRAPs in cef_initialize when the Cognito login web view opens. A manual edit until
#       2026-09-21; now applied here.
# Both self-detect "already applied"; a CRLF working tree (a clone made on Windows) is handled with --ignore-whitespace.
GUARD="$SCRIPT_DIR/check_engine_patch.sh"
MRHI="Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp"
WBS="Engine/Source/Runtime/WebBrowser/Private/WebBrowserSingleton.cpp"
CEF_FALLBACK='../Frameworks/Chromium Embedded Framework.framework'
[ -f "$GUARD" ] || die "check_engine_patch.sh is missing beside this script — the team package is incomplete (re-sync it)."
apply_engine_patch() { # apply_engine_patch <label> <patch file> <already-applied test command…>  → sets APPLY_RESULT
  local label=$1 patch=$2; shift 2
  APPLY_RESULT=failed
  [ -f "$patch" ] || { warn "$label: patch file missing: $patch"; return 1; }
  # "Already applied" = the whole patch reverse-applies (both hunks), or the caller's own test passes.
  if git apply --reverse --check "$patch" 2>/dev/null || "$@" >/dev/null 2>&1; then log "$label already applied."; APPLY_RESULT=present; return 0; fi
  if git apply --check "$patch" 2>/dev/null; then
    git apply "$patch" && log "$label applied." && APPLY_RESULT=applied && return 0
  elif git apply --check --ignore-whitespace "$patch" 2>/dev/null; then
    git apply --ignore-whitespace "$patch" && log "$label applied (whitespace-tolerant: CRLF working tree)." && APPLY_RESULT=applied && return 0
  fi
  warn "$label does not apply cleanly to $ENGINE_ROOT — apply it by hand from $patch (git apply --reject) and re-run."
  return 1
}
cef_fallback_complete() { [ "$(grep -c "$CEF_FALLBACK" "$WBS")" -ge 2 ]; }   # both hunks (Resources + framework dir)
[ -f "$BK/MetalRHI.cpp.bak" ] || cp "$MRHI" "$BK/MetalRHI.cpp.bak"
[ -f "$BK/WebBrowserSingleton.cpp.bak" ] || cp "$WBS" "$BK/WebBrowserSingleton.cpp.bak"
apply_engine_patch "6g MetalRHI resolution list" "$PATCHES/6g-MetalRHI-resolution-list.patch" bash "$GUARD" "$ENGINE_ROOT/$MRHI"; note6 6g "$APPLY_RESULT"
apply_engine_patch "6h WebBrowserSingleton CEF fallback" "$PATCHES/6h-WebBrowserSingleton-CEF-fallback.patch" cef_fallback_complete; note6 6h "$APPLY_RESULT"
# Hard gate — never spend hours building an engine that lacks the fix the game depends on.
bash "$GUARD" "$ENGINE_ROOT/$MRHI" || die "ENGINE_PATCH_MISSING — 6g did not land in $MRHI. Nothing further is built."
cef_fallback_complete || die "6h did not land completely in $WBS (both hunks are required — a hand-edited tree with one of them: apply the second by hand from $PATCHES). Nothing further is built."
# Record the real outcome of every step for later audits (HANDOFF §5); one block per run (the EXIT trap writes the
# same block marked INCOMPLETE when a step above died).
write_applied complete; trap - EXIT
log "6g/6h verified; outcomes:$STATUS6 (recorded in $BK/APPLIED.txt)."

# =============================================================================
step "7 · Setup.sh (binary dependencies + bundled dotnet)"
# Always run it: GitDependencies is idempotent — it hash-verifies existing files and only
# fetches what's missing (fast if already complete), so a resume after an interrupted
# download can never be mistaken for 'done'.
# Non-interactive runs (2026-09-21): GitDependencies asks "Would you like to overwrite your changes (y/n)?" when a
# dependency-managed file differs (e.g. Python __pycache__ .pyc files written by a previous run) and aborts when
# stdin is not a terminal. --force answers yes for those managed binary files only; engine SOURCE edits (step 6) are
# not GitDependencies files and are never touched by it.
# (A plain string, not an array: bash 3.2 treats an empty array expansion as unbound under set -u.)
SETUP_FORCE=""; [ "${UE_NONINTERACTIVE:-0}" = 1 ] && SETUP_FORCE="--force"
# shellcheck disable=SC2086
./Setup.sh $SETUP_FORCE || die "Setup.sh failed (GitDependencies) — see the output above; re-run to resume the download."

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
# Build.sh is incremental: if the editor is already built & up-to-date this returns quickly. (The whole run is under
# caffeinate since step 0.)
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
PFS="$(fs_of "$PROJECT_DEST")"
if printf '%s' "$PFS" | grep -qiE 'exfat|msdos|fat'; then
  warn "Project destination '$PROJECT_DEST' is $PFS — a C++ project can't compile there."
  PROJECT_DEST="$ENGINE_PARENT/Unreal_Projects"; mkdir -p "$PROJECT_DEST"
  warn "Redirecting the project to $PROJECT_DEST (APFS)."
fi
# The project name comes from the zip's top-level .uproject (validated in step 1; re-read here for a UE_SKIP_ENGINE route).
UPROJ_IN_ZIP="$(unzip -Z1 "$PROJECT_ZIP" 2>/dev/null | grep -iE '^[^/]*\.uproject$' | grep -v '^\._' | head -1)"
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
# Resume (2026-09-21): a project extracted from THIS zip is recognized by the marker written after extraction and is
# kept (Intermediate and all); a different zip still moves the old project aside. UE_KEEP_EXISTING=1 keeps whatever
# is there regardless of the marker.
ZIP_ID="$(md5 -q "$PROJECT_ZIP" 2>/dev/null || md5sum "$PROJECT_ZIP" | cut -c1-32)  $(basename "$PROJECT_ZIP")"
MARKER="$DEST/.migrated-from"
if [ -d "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
  if [ "${UE_KEEP_EXISTING:-0}" = 1 ]; then
    warn "UE_KEEP_EXISTING=1 — keeping the project already at $DEST (the zip is NOT used; its origin: $(cat "$MARKER" 2>/dev/null || echo unknown))."
  elif [ -f "$MARKER" ] && [ "$(cat "$MARKER")" = "$ZIP_ID" ] && [ -f "$DEST/$UPROJ_IN_ZIP" ]; then
    log "Project at $DEST was extracted from this very zip ($ZIP_ID) — keeping it (resume)."
  else
    ASIDE="${DEST}_superseded_$(date +%Y%m%d-%H%M%S)"
    warn "$DEST is already occupied by a different project/zip (origin: $(cat "$MARKER" 2>/dev/null || echo 'no marker')) — moving it aside to:"
    warn "    $ASIDE"
    mv "$DEST" "$ASIDE" || die "Could not move $DEST aside (in use? permissions?)."
  fi
fi
if [ -f "$DEST/$UPROJ_IN_ZIP" ]; then log "Project present at $DEST."
else
  log "Extracting $PROJ_NAME -> $DEST …"; mkdir -p "$DEST"
  ( cd "$DEST" && unzip -q -o "$PROJECT_ZIP" -x '._*' '__MACOSX/*' ) || die "unzip failed"
  printf '%s\n' "$ZIP_ID" > "$MARKER"
  log "Extracted from: $PROJECT_ZIP"
fi
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
UPROJ_FS="$(fs_of "$(dirname "$UPROJ")")"
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

# =============================================================================
step "12b · Mac-side project fixes + Mac-only files (2026-09-21)"
# A zip made on Windows carries none of the Mac-side project fixes (SOP §11a/§11b/§11e) and — until they are pushed
# into the Windows project (review M9) — no Build/Mac/Resources at all. apply-mac-project-fixes.sh is idempotent
# and self-verifying; it creates the plist from the engine template when the project has none.
UE_ENGINE="$ENGINE_ROOT" bash "$SCRIPT_DIR/apply-mac-project-fixes.sh" "$DEST" || die "apply-mac-project-fixes.sh failed — see its output."
for f in Config/Mac/MacEngine.ini Build/Mac/Resources/NoSandbox.entitlements Build/Mac/Resources/Info.Template.plist; do
  [ -f "$DEST/$f" ] && log "present: $f" || die "missing after migration: $DEST/$f (Config/Mac/MacEngine.ini ships with the project — the zip is incomplete; see masters/)"
done
grep -q '^r.AllowOcclusionQueries=0' "$DEST/Config/Mac/MacEngine.ini" || die "Config/Mac/MacEngine.ini lacks r.AllowOcclusionQueries=0 (Mac Shipping freezes in Metal occlusion-query waits without it — HANDOFF §9)."

# =============================================================================
step "12c · Verify the project carries the current masters"
# The C++ and plugin sources of this project are mastered in the team package (masters/, from plans/MacOS_UE_Fix/).
# A zip that lags the masters builds an obsolete game while reporting success — the 2026-08-25 lesson (SOP §8·0).
bash "$SCRIPT_DIR/verify-project-masters.sh" "$DEST"; VRC=$?
if [ "$VRC" = 0 ]; then log "Project matches the masters."
elif [ "$VRC" = 2 ]; then die "verify-project-masters.sh could not run (no masters/MANIFEST.tsv beside this script, or not a project dir) — the team package copy is incomplete; re-sync it."
elif [ "${UE_ALLOW_MASTER_DRIFT:-0}" = 1 ]; then warn "UE_ALLOW_MASTER_DRIFT=1 — building a project that differs from the masters."
else die "Project differs from the masters. Re-zip from a project that has them applied, or run: bash '$SCRIPT_DIR/apply-project-masters.sh' '$DEST' (then re-run). UE_ALLOW_MASTER_DRIFT=1 overrides."
fi

step "13 · Build project editor target for Mac"
# Absolute path (2026-09-21): step 5's `cd "$ENGINE_ROOT"` is skipped under UE_SKIP_ENGINE=1, so the relative
# Build.sh path never worked on the documented "engine already built" route.
cd "$ENGINE_ROOT" || die "cannot cd to $ENGINE_ROOT"
"$ENGINE_ROOT/Engine/Build/BatchFiles/Mac/Build.sh" "${PROJ_NAME}Editor" Mac Development \
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

Package the game (Development + Shipping apps, CLI only — never the editor's Package button):
  UE_ENGINE='$ENGINE_ROOT' UE_PROJECT_DIR='$DEST' nohup bash '$SCRIPT_DIR/package_mac_gfx.sh' first-build-\$(date +%Y%m%dT%H%M%S) first > /dev/null 2>&1 &
  tail -f /tmp/gfx_package_mac.out        # ends with ALL_DONE; DEV_EXIT=0 and SHIP_EXIT=0 = both apps built
Then read Building-awsTutorial-on-a-Mac.md §5 (how to verify a launch) before handing an app to anyone.

Backups of every edited engine file: $BK  (APPLIED.txt lists the fix set)
Full method & rationale: the SOP markdown shipped alongside this script.
MSG
