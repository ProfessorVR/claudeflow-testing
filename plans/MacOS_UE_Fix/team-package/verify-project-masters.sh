#!/bin/bash
# verify-project-masters.sh <project dir> — ON ANY MACHINE (macOS or Linux/WSL).
# Compares every file listed in masters/MANIFEST.tsv (beside this script) with the project's copy, CR-stripped md5,
# and prints one line per file. Exit 0 = every file matches; 1 = drift (listed as DRIFT/MISSING).
# The masters are the source of truth for the project's own C++ (graphics auto-tuner, Mac allocator shim,
# Target.cs), the EmbeddedVoiceChat plugin sources, Config/Mac/MacEngine.ini and the Mac-only Build/Mac/Resources
# files (HANDOFF-2026-09-21.md §3). Nothing is modified. See apply-project-masters.sh to install them.
set -u
PROJ="${1:?usage: verify-project-masters.sh <project dir>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$HERE/masters/MANIFEST.tsv"
[ -f "$MANIFEST" ] || { echo "no manifest at $MANIFEST — the team package is incomplete"; exit 2; }
[ -f "$PROJ/awsTutorial.uproject" ] || { echo "not a project dir: $PROJ"; exit 2; }
sum() { tr -d '\r' < "$1" | { md5sum 2>/dev/null || md5 -q; } | cut -c1-32; }
ok=0; bad=0
while IFS=$'\t' read -r want master target; do
  [ -z "${want:-}" ] && continue; case "$want" in \#*) continue;; esac
  if [ ! -f "$PROJ/$target" ]; then echo "MISSING $target"; bad=$((bad+1)); continue; fi
  have=$(sum "$PROJ/$target")
  if [ "$have" = "$want" ]; then echo "OK      $target"; ok=$((ok+1)); else echo "DRIFT   $target (project ${have:0:8} vs master ${want:0:8})"; bad=$((bad+1)); fi
done < "$MANIFEST"
echo "masters: $ok match, $bad differ or missing ($PROJ)"
[ "$bad" = 0 ]
