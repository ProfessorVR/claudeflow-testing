#!/bin/bash
# backup_graphics_autotune.sh <project dir>
# Snapshot every file the graphics-defaults + auto-tune change touches (or may touch) BEFORE anything is edited:
#   Content/AntizeMenuSystem/Widgets/W_Options.uasset, Config/DefaultEngine.ini, Config/DefaultGame.ini,
#   Build/Mac/Resources/Info.Template.plist (Mac project), Source/awsTutorial/** (whole module),
#   the project's editor module binaries (so a rollback does not need a rebuild).
# Writes <project>/.backups/graphics-autotune-<stamp>/{files.tar,manifest.md5,filelist.txt} and prints the folder.
# Portable: Linux/WSL (md5sum) and macOS (md5 -q). Nothing in the project is modified.
set -eu
PROJ="${1:?usage: backup_graphics_autotune.sh <project dir>}"
cd "$PROJ"
[ -f awsTutorial.uproject ] || { echo "not a project dir: $PROJ"; exit 1; }
STAMP=$(date +%Y%m%dT%H%M%S)
OUT=".backups/graphics-autotune-$STAMP"
mkdir -p "$OUT"
LIST="$OUT/filelist.txt"
: > "$LIST"
for f in Content/AntizeMenuSystem/Widgets/W_Options.uasset Config/DefaultEngine.ini Config/DefaultGame.ini \
         Build/Mac/Resources/Info.Template.plist awsTutorial.uproject; do
  [ -f "$f" ] && echo "$f" >> "$LIST"
done
find Source/awsTutorial -type f | sort >> "$LIST"
for f in Binaries/Win64/UnrealEditor-awsTutorial.dll Binaries/Win64/UnrealEditor-awsTutorial.pdb Binaries/Win64/UnrealEditor.modules \
         Binaries/Mac/UnrealEditor-awsTutorial.dylib Binaries/Mac/UnrealEditor.modules; do
  [ -f "$f" ] && echo "$f" >> "$LIST"
done
tar -cf "$OUT/files.tar" -T "$LIST"
if command -v md5sum >/dev/null 2>&1; then
  while read -r f; do printf '%s  %s\n' "$(md5sum "$f" | cut -c1-32)" "$f"; done < "$LIST" > "$OUT/manifest.md5"
else
  while read -r f; do printf '%s  %s\n' "$(md5 -q "$f")" "$f"; done < "$LIST" > "$OUT/manifest.md5"
fi
# verify the tar round-trips: list must equal the file list
tar -tf "$OUT/files.tar" | sort > "$OUT/.tarlist"; sort "$LIST" > "$OUT/.srclist"
if cmp -s "$OUT/.tarlist" "$OUT/.srclist"; then rm -f "$OUT/.tarlist" "$OUT/.srclist"; else echo "BACKUP TAR MISMATCH"; exit 2; fi
echo "BACKUP OK: $PROJ/$OUT ($(wc -l < "$LIST" | tr -d ' ') files, $(du -h "$OUT/files.tar" | cut -f1))"
