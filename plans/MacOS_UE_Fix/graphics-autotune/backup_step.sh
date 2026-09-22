#!/bin/bash
# backup_step.sh <project dir> <label>
# Snapshot, BEFORE a change step, everything the Mac/Windows fix work edits: Source/awsTutorial/** (module + Target.cs
# files), the EmbeddedVoiceChat plugin sources, Config/**, Build/Mac/** (when present) and the .uproject.
# Writes <project>/.backups/<label>-<stamp>/{files.tar,manifest.md5,filelist.txt} and prints the folder.
# Portable: Linux/WSL (md5sum) and macOS (md5 -q). Nothing in the project is modified.
set -eu
PROJ="${1:?usage: backup_step.sh <project dir> <label>}"
LABEL="${2:?usage: backup_step.sh <project dir> <label>}"
cd "$PROJ"
[ -f awsTutorial.uproject ] || { echo "not a project dir: $PROJ"; exit 1; }
STAMP=$(date +%Y%m%dT%H%M%S)
OUT=".backups/$LABEL-$STAMP"
mkdir -p "$OUT"
LIST="$OUT/filelist.txt"
: > "$LIST"
echo awsTutorial.uproject >> "$LIST"
find Source -type f | sort >> "$LIST"
[ -d Plugins/UltimateMultiplayerServicesPlugin/Source/EmbeddedVoiceChat ] && find Plugins/UltimateMultiplayerServicesPlugin/Source/EmbeddedVoiceChat -type f | sort >> "$LIST"
find Config -type f | sort >> "$LIST"
[ -d Build/Mac ] && find Build/Mac -type f | sort >> "$LIST"
tar -cf "$OUT/files.tar" -T "$LIST"
if command -v md5sum >/dev/null 2>&1; then
  while read -r f; do printf '%s  %s\n' "$(md5sum "$f" | cut -c1-32)" "$f"; done < "$LIST" > "$OUT/manifest.md5"
else
  while read -r f; do printf '%s  %s\n' "$(md5 -q "$f")" "$f"; done < "$LIST" > "$OUT/manifest.md5"
fi
tar -tf "$OUT/files.tar" | sort > "$OUT/.tarlist"; sort "$LIST" > "$OUT/.srclist"
if cmp -s "$OUT/.tarlist" "$OUT/.srclist"; then rm -f "$OUT/.tarlist" "$OUT/.srclist"; else echo "BACKUP TAR MISMATCH"; exit 2; fi
echo "BACKUP OK: $PROJ/$OUT ($(wc -l < "$LIST" | tr -d ' ') files, $(du -h "$OUT/files.tar" | cut -f1))"
