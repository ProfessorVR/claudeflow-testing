#!/bin/bash
# apply-project-masters.sh <project dir> — ON ANY MACHINE. Installs every file in masters/MANIFEST.tsv into the
# project (plain copy, line endings as in the master; the project's module files use LF), then runs
# masters/graphics-autotune/apply_autotune_src.sh (which re-writes the tuner files in the module's own line-ending
# convention and adds the Build.cs dependencies when absent), then verify-project-masters.sh. A backup of Source/,
# the voice plugin, Config/ and Build/Mac/ is taken first (backup_step.sh, into <project>/.backups/masters-<stamp>/).
# Idempotent. Exit 0 only when the backup, the copies, the tuner install and the final verification all succeed.
set -uo pipefail
PROJ="${1:?usage: apply-project-masters.sh <project dir>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$HERE/masters/MANIFEST.tsv"
[ -f "$MANIFEST" ] || { echo "no manifest at $MANIFEST — the team package is incomplete"; exit 2; }
[ -f "$PROJ/awsTutorial.uproject" ] || { echo "not a project dir: $PROJ"; exit 2; }
bash "$HERE/backup_step.sh" "$PROJ" masters || { echo "backup failed — nothing applied"; exit 1; }
n=0
while IFS=$'\t' read -r want master target; do
  [ -z "${want:-}" ] && continue; case "$want" in \#*) continue;; esac
  [ -f "$HERE/masters/$master" ] || { echo "master missing: $master"; exit 1; }
  mkdir -p "$(dirname "$PROJ/$target")"
  cp "$HERE/masters/$master" "$PROJ/$target" || { echo "copy failed: $target"; exit 1; }
  n=$((n+1))
done < "$MANIFEST"
echo "copied $n files"
bash "$HERE/masters/graphics-autotune/apply_autotune_src.sh" "$PROJ" || { echo "apply_autotune_src.sh failed"; exit 1; }
bash "$HERE/verify-project-masters.sh" "$PROJ"
