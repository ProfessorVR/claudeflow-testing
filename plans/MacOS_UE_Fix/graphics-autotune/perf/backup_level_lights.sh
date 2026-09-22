#!/bin/bash
# backup_level_lights.sh <project dir>
# Before the lighting performance fixes: snapshots every FirstPersonMap World Partition actor package, the map itself,
# its built data, and Config/DefaultEngine.ini into <project>/.backups/level-lights-<stamp>/{files.tar,manifest.md5,filelist.txt}.
# Verifies the tar lists exactly the captured files. Nothing in the project is modified.
set -eu
PROJ="${1:?usage: backup_level_lights.sh <project dir>}"
cd "$PROJ"
[ -f awsTutorial.uproject ] || { echo "not a project dir: $PROJ"; exit 1; }
STAMP=$(date +%Y%m%dT%H%M%S)
OUT=".backups/level-lights-$STAMP"
mkdir -p "$OUT"
LIST="$OUT/filelist.txt"
{
  find Content/__ExternalActors__/FirstPerson/Maps/FirstPersonMap -type f
  find Content/__ExternalObjects__/FirstPerson/Maps/FirstPersonMap -type f 2>/dev/null || true
  ls Content/FirstPerson/Maps/FirstPersonMap.umap Content/FirstPerson/Maps/FirstPersonMap_BuiltData.uasset Config/DefaultEngine.ini
} | sort > "$LIST"
tar -cf "$OUT/files.tar" -T "$LIST"
if command -v md5sum >/dev/null 2>&1; then
  while read -r f; do md5sum "$f"; done < "$LIST" > "$OUT/manifest.md5"   # (BSD xargs has no -d)
else
  while read -r f; do printf '%s  %s\n' "$(md5 -q "$f")" "$f"; done < "$LIST" > "$OUT/manifest.md5"
fi
tar -tf "$OUT/files.tar" | sort > "$OUT/.tarlist"
cmp -s "$OUT/.tarlist" "$LIST" && rm -f "$OUT/.tarlist" || { echo "BACKUP TAR MISMATCH"; exit 2; }
echo "BACKUP OK: $PROJ/$OUT ($(wc -l < "$LIST" | tr -d ' ') files, $(du -h "$OUT/files.tar" | cut -f1))"
