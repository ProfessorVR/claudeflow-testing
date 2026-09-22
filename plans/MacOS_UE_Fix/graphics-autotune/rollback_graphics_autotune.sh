#!/bin/bash
# rollback_graphics_autotune.sh <project dir> <backup folder name, e.g. graphics-autotune-20260918T230000>
# Restores every file captured by backup_graphics_autotune.sh (byte-exact, verified against manifest.md5) and
# deletes the files the change ADDED (the auto-tune subsystem sources). Rebuild the editor/package afterwards,
# or, for the editor only, the restored UnrealEditor-awsTutorial binaries are already the pre-change ones.
set -eu
PROJ="${1:?usage: rollback_graphics_autotune.sh <project dir> <backup name>}"
NAME="${2:?usage: rollback_graphics_autotune.sh <project dir> <backup name>}"
cd "$PROJ"
B=".backups/$NAME"
[ -f "$B/files.tar" ] && [ -f "$B/manifest.md5" ] || { echo "backup not found: $PROJ/$B"; exit 1; }
# files added by the change (not present in the backup) -> remove
for f in Source/awsTutorial/GraphicsAutoTuneSubsystem.h Source/awsTutorial/GraphicsAutoTuneSubsystem.cpp; do
  if [ -f "$f" ] && ! grep -qF "  $f" "$B/manifest.md5"; then rm -f "$f"; echo "removed added file $f"; fi
done
tar -xf "$B/files.tar"
bad=0
while read -r sum f; do
  if command -v md5sum >/dev/null 2>&1; then now=$(md5sum "$f" | cut -c1-32); else now=$(md5 -q "$f"); fi
  [ "$now" = "$sum" ] || { echo "MISMATCH after restore: $f"; bad=1; }
done < "$B/manifest.md5"
[ $bad = 0 ] && echo "ROLLBACK OK: $(wc -l < "$B/manifest.md5" | tr -d ' ') files restored byte-exact from $B" || exit 2
