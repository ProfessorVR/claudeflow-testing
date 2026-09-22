#!/bin/bash
# backup_paths.sh <project dir> <backup label> <path>... - snapshot files/directories (relative to the project) into
# <project>/.backups/<label>-<stamp>/{files.tar,manifest.md5,filelist.txt}; verifies the tar lists exactly the files.
# Missing paths are skipped (listed as "absent"). Portable: WSL (md5sum) and macOS (md5 -q). Changes nothing else.
set -eu
PROJ="${1:?usage: backup_paths.sh <project dir> <label> <path>...}"; LABEL="${2:?label}"; shift 2
cd "$PROJ"
[ -f awsTutorial.uproject ] || { echo "not a project dir: $PROJ"; exit 1; }
OUT=".backups/$LABEL-$(date +%Y%m%dT%H%M%S)"
mkdir -p "$OUT"
LIST="$OUT/filelist.txt"
: > "$LIST"
for p in "$@"; do
  if [ -d "$p" ]; then find "$p" -type f >> "$LIST"
  elif [ -f "$p" ]; then echo "$p" >> "$LIST"
  else echo "absent: $p"; fi
done
sort -o "$LIST" "$LIST"
tar -cf "$OUT/files.tar" -T "$LIST"
if command -v md5sum >/dev/null 2>&1; then
  while read -r f; do md5sum "$f"; done < "$LIST" > "$OUT/manifest.md5"
else
  while read -r f; do printf '%s  %s\n' "$(md5 -q "$f")" "$f"; done < "$LIST" > "$OUT/manifest.md5"
fi
tar -tf "$OUT/files.tar" | sort > "$OUT/.tarlist"
cmp -s "$OUT/.tarlist" "$LIST" && rm -f "$OUT/.tarlist" || { echo "BACKUP TAR MISMATCH"; exit 2; }
echo "BACKUP OK: $PROJ/$OUT ($(wc -l < "$LIST" | tr -d ' ') files, $(du -h "$OUT/files.tar" | cut -f1))"
