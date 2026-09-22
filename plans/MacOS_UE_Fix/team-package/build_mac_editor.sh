#!/bin/bash
# build_mac_editor.sh - ON THE MAC. Builds the awsTutorial EDITOR target (SOP §8d / §11h-3 L2: the cook
# runs as the editor). Survives SSH disconnects; log /tmp/evc_build_mac_editor.log (ends with BUILD_EXIT=).
# Paths: UE_ENGINE and UE_PROJECT_DIR in the environment override the Air's defaults; UE_PARALLEL the action count.
# 2026-09-21 review: the guard's result is tested directly (a `| tee` pipeline hid it), and the build command gets
# its paths as arguments, never interpolated into a bash -c string (quotes or $ in a path can no longer break it).
set -u
ENGINE="${UE_ENGINE:-/Volumes/UnrealEngine/UE_5_4_1}"
PROJDIR="${UE_PROJECT_DIR:-/Volumes/UnrealEngine/Unreal_Projects/awsTutorial}"
UPROJECT="$PROJDIR/awsTutorial.uproject"
PARALLEL="${UE_PARALLEL:-6}"
LOG=/tmp/evc_build_mac_editor.log
: > "$LOG"
[ -f "$UPROJECT" ] || { echo "project not found: $UPROJECT (set UE_PROJECT_DIR)" | tee -a "$LOG"; echo BUILD_EXIT=1 >> "$LOG"; exit 1; }
GUARD="$(cd "$(dirname "$0")" && pwd)/check_engine_patch.sh"
[ -f "$GUARD" ] || { echo "check_engine_patch.sh missing beside $0 — refusing to build" | tee -a "$LOG"; echo BUILD_EXIT=1 >> "$LOG"; exit 1; }
if ! GUARD_OUT="$(bash "$GUARD" "$ENGINE/Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp" 2>&1)"; then
  printf '%s\n' "$GUARD_OUT" | tee -a "$LOG"; echo BUILD_EXIT=1 >> "$LOG"; exit 1
fi
printf '%s\n' "$GUARD_OUT" >> "$LOG"
nohup bash -c 'cd "$1" && caffeinate -dimsu Engine/Build/BatchFiles/Mac/Build.sh awsTutorialEditor Mac Development -project="$2" -MaxParallelActions="$3" >> "$4" 2>&1; echo BUILD_EXIT=$? >> "$4"' \
  _ "$ENGINE" "$UPROJECT" "$PARALLEL" "$LOG" </dev/null >/dev/null 2>&1 &
echo "started pid $! ; log $LOG"
