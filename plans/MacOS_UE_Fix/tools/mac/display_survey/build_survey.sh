#!/bin/bash
# build_survey.sh [out dir=/tmp] — ON THE MAC. Compiles the three display-survey tools with Xcode's swiftc into
# <out dir>/display_modes, set_mode, win_bounds (phase1_run.sh and phase1_matrix.sh expect them in /tmp).
#   display_modes  — the screen(s): frame, visibleFrame, safeAreaInsets, backing scale, every CGDisplayMode incl. 1x
#   set_mode       — `set_mode current` prints the main display's mode; `set_mode W H hidpi|lowdpi` switches it for
#                    this login session only (CGConfigureDisplayWithDisplayMode; a logout restores the saved mode)
#   win_bounds     — every on-screen window of awsTutorial as macOS places it (CGWindowListCopyWindowInfo)
# Needs Xcode (xcrun swiftc). Read-only tools except set_mode.
set -u
OUT="${1:-/tmp}"; mkdir -p "$OUT"
HERE="$(cd "$(dirname "$0")" && pwd)"
xcrun -f swiftc >/dev/null 2>&1 || { echo "swiftc not found — install/select Xcode (xcode-select -p)"; exit 1; }
# xcrun with an explicit SDK: a bare swiftc over ssh has no SDKROOT and fails with "unable to load standard library".
for t in display_modes set_mode win_bounds; do
  xcrun --sdk macosx swiftc -O -o "$OUT/$t" "$HERE/$t.swift" && echo "built $OUT/$t" || { echo "FAILED: $t"; exit 1; }
done
echo "survey a new Mac:  $OUT/display_modes ; $OUT/set_mode current ; (game running) $OUT/win_bounds"
