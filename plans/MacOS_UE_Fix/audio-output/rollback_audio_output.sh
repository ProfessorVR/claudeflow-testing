#!/bin/bash
# rollback_audio_output.sh <project dir> <backup dir name, e.g. audio-output-20260919T085650>
# Undoes the speaker selection source change in a project (Windows via /mnt/c, or on the Mac):
#   - deletes Source/awsTutorial/AudioOutputSelectorSubsystem.{h,cpp} (new files, not in the backup),
#   - restores every file captured by backup_paths.sh (sources, plugin AEC files, Build.cs, editor binaries, the menu
#     asset and configs on Windows) from <project>/.backups/<backup>/files.tar and checks them against manifest.md5.
# Packaged builds are not touched: Windows builds 22-26 were never modified; on the Mac the pre-change apps are in
# <project>/.backups/<backup>/apps/ (move them back to Packaged/Mac and Packaged/Mac-Shipping).
set -eu
PROJ="${1:?usage: rollback_audio_output.sh <project dir> <backup dir name>}"; BK="${2:?backup dir name}"
cd "$PROJ"
[ -f awsTutorial.uproject ] || { echo "not a project dir: $PROJ"; exit 1; }
[ -f ".backups/$BK/files.tar" ] || { echo "no backup: $PROJ/.backups/$BK"; exit 1; }
rm -f Source/awsTutorial/AudioOutputSelectorSubsystem.h Source/awsTutorial/AudioOutputSelectorSubsystem.cpp
tar -xf ".backups/$BK/files.tar"
BAD=0
while read -r sum f; do
  if command -v md5sum >/dev/null 2>&1; then now=$(md5sum "$f" | cut -d' ' -f1); else now=$(md5 -q "$f"); fi
  [ "$now" = "$sum" ] || { echo "MISMATCH $f"; BAD=1; }
done < ".backups/$BK/manifest.md5"
[ "$BAD" = 0 ] && echo "ROLLBACK OK: $(wc -l < ".backups/$BK/manifest.md5" | tr -d ' ') files restored from .backups/$BK" || exit 2
