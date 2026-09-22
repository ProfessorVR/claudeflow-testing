#!/bin/bash
# stage_gat_ini.sh <restore|set key=value ...> - ON THE MAC. Rewrites the [GraphicsAutoTune] section of the shared
# GameUserSettings.ini (~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/) for unattended tests of the
# tuner's startup gate (2026-09-20, H2). Every other section is kept byte for byte.
#   set TunedVersion=1 FinishedFailures=3 FinishedFailuresFor=2   -> section becomes exactly these keys
#   restore <file>                                                -> copies <file> over GameUserSettings.ini
set -u
G=~/Library/Application\ Support/Epic/awsTutorial/Saved/Config/Mac/GameUserSettings.ini
MODE="${1:?restore <file> | set key=value ...}"; shift
if [ "$MODE" = restore ]; then cp -p "${1:?file}" "$G" && echo "restored $G from $1" && exit 0; fi
[ "$MODE" = set ] || { echo "usage"; exit 2; }
TMP="$G.tmp.$$"
awk -v keys="$*" '
  BEGIN { n = split(keys, arr, " ") }
  /^\[GraphicsAutoTune\]/ { print; for (i = 1; i <= n; i++) print arr[i]; skip = 1; next }
  /^\[/ { skip = 0 }
  skip != 1 { print }
' "$G" > "$TMP" && mv "$TMP" "$G"
echo "--- [GraphicsAutoTune] now:"; awk '/^\[GraphicsAutoTune\]/{f=1;print;next} /^\[/{f=0} f' "$G"
