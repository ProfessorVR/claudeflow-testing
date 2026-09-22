#!/bin/bash
# check_engine_patch.sh [MetalRHI.cpp] - ON THE MAC (or anywhere, given the path). Exit 0 when the local
# resolution-list fix of 2026-09-20 is present in the engine source; otherwise print ENGINE_PATCH_MISSING and exit 1.
#
# Why: FMetalDynamicRHI::RHIGetAvailableResolutions in the stock 5.4.1 engine divides every CGDisplayMode by the
# Retina backing scale a second time, so the options menu's resolution list tops out at half the panel and native
# can never be chosen. The fix is a local, uncommitted-by-default edit of the engine source; a git checkout, stash,
# pull or re-sync reverts it silently and nothing in the game logs that it happened. package_mac_gfx.sh runs this
# first and refuses to package without the fix. The diff is kept in plans/MacOS_UE_Fix/engine-patches/ and the
# engine repository carries it on the local branch local/mac-engine-fixes (H1 of adversarial-review-mac-2026-09-20).
F="${1:-/Volumes/UnrealEngine/UE_5_4_1/Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp}"
if [ ! -f "$F" ]; then
  echo "ENGINE_PATCH_MISSING: $F does not exist"
  exit 1
fi
# Three conditions: the marker comment is there, the stock divisions are gone, and the two fixed assignments are
# present verbatim (a revert that keeps the comment, or a differently spelled division, still fails — 2026-09-21).
if grep -q 'Local fix 2026-09-20' "$F" && ! grep -qE 'CGDisplayModeGet(Width|Height)\(Mode\) */ *Scale' "$F" \
   && grep -q 'const int32 Width = (int32)CGDisplayModeGetWidth(Mode);' "$F" \
   && grep -q 'const int32 Height = (int32)CGDisplayModeGetHeight(Mode);' "$F"; then
  echo "engine patch present: $F"
  exit 0
fi
echo "ENGINE_PATCH_MISSING: $F lacks the 2026-09-20 resolution-list fix (marker or stock '/ Scale' divisions found)."
echo "Re-apply: run the team package's run-ue541-mac.sh (step 6g applies patches/6g-MetalRHI-resolution-list.patch and rebuilds), or by hand:"
echo "  cd <engine> && git apply --check <team package>/patches/6g-MetalRHI-resolution-list.patch && git apply <same>   (add --ignore-whitespace on a CRLF tree)"
echo "  On the Air the engine branch local/mac-engine-fixes also carries it: git -C /Volumes/UnrealEngine/UE_5_4_1 switch local/mac-engine-fixes"
echo "Then rebuild (Build.sh UnrealEditor, or the next package run recompiles MetalRHI.cpp). Refusing to continue."
exit 1
