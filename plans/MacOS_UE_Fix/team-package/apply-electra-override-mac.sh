#!/usr/bin/env bash
# =============================================================================
#  apply-electra-override-mac.sh
#  One command to set Player Overrides -> Mac -> ElectraPlayer on every
#  StreamMediaSource, headlessly, and then PROVE it landed.
#
#  Without this override macOS hands the DASH (.mpd) streams to AvfMedia, which
#  cannot decode them: blank video, error -12847. (SOP 11d)
#
#  USAGE
#      ./apply-electra-override-mac.sh            # DRY RUN — changes nothing
#      ./apply-electra-override-mac.sh apply      # apply, save, then verify
#
#  ENV OVERRIDES
#      UE_ENGINE   default /Volumes/UnrealEngine/UE_5_4_1
#      UE_PROJECT  default /Volumes/UnrealEngine/Unreal_Projects/awsTutorial/awsTutorial.uproject
#
#  WHY A COMMANDLET AND NOT THE EDITOR
#      PythonScriptPlugin is EnabledByDefault:false and is deliberately NOT in
#      awsTutorial.uproject. -EnablePlugins=PythonScriptPlugin turns it on for
#      this one invocation, so the project file is never modified.
#
#  REQUIREMENT: the project's editor target must already be built for Mac
#      (SOP 8d), otherwise the commandlet cannot load the project.
# =============================================================================
set -uo pipefail

MODE="${1:-dry}"
case "$MODE" in
  dry|apply) ;;
  *) echo "usage: $0 [dry|apply]"; exit 2 ;;
esac

ENGINE="${UE_ENGINE:-/Volumes/UnrealEngine/UE_5_4_1}"
# UE_PROJECT (.uproject path) or UE_PROJECT_DIR (project folder) — both accepted since 2026-09-21.
if [ -n "${UE_PROJECT:-}" ]; then UPROJECT="$UE_PROJECT"
elif [ -n "${UE_PROJECT_DIR:-}" ]; then UPROJECT="$UE_PROJECT_DIR/awsTutorial.uproject"
else UPROJECT="/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/awsTutorial.uproject"; fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/set_electra_override.py"
WORK=/tmp/electra_run.py
LOG="/tmp/electra_$MODE.log"
RESULT=/tmp/electra_result.json

[ -f "$UPROJECT" ] || { echo "FATAL: project not found: $UPROJECT"; exit 1; }
[ -f "$SRC" ]      || { echo "FATAL: set_electra_override.py not next to this script"; exit 1; }

PROJDIR="$(dirname "$UPROJECT")"
MEDIA="$PROJDIR/Content/Media/StreamMediaSources"

# The editor target must exist or the commandlet silently fails to load modules.
if ! ls "$PROJDIR"/Binaries/Mac/UnrealEditor-*.dylib >/dev/null 2>&1; then
  echo "FATAL: no Mac editor binaries in $PROJDIR/Binaries/Mac"
  echo "       Build first (SOP 8d):"
  echo "       cd $ENGINE && Engine/Build/BatchFiles/Mac/Build.sh $(basename "${UPROJECT%.uproject}")Editor Mac Development -project=$UPROJECT"
  exit 1
fi

CMD=""
for c in "$ENGINE/Engine/Binaries/Mac/UnrealEditor-Cmd" \
         "$ENGINE/Engine/Binaries/Mac/UnrealEditor"; do
  [ -x "$c" ] && CMD="$c" && break
done
[ -n "$CMD" ] || { echo "FATAL: no editor binary under $ENGINE/Engine/Binaries/Mac"; exit 1; }

# Copy the script and set DRY_RUN for this invocation (source file untouched).
cp "$SRC" "$WORK"
if [ "$MODE" = apply ]; then
  perl -pi -e 's/^DRY_RUN(\s*)=\s*True/DRY_RUN$1= False/' "$WORK"
else
  perl -pi -e 's/^DRY_RUN(\s*)=\s*False/DRY_RUN$1= True/' "$WORK"
fi

echo "engine : $CMD"
echo "project: $UPROJECT"
echo "mode   : $MODE   ($(grep -m1 '^DRY_RUN' "$WORK"))"
echo "log    : $LOG"
echo
rm -f "$RESULT"

"$CMD" "$UPROJECT" \
  -run=pythonscript -script="$WORK" \
  -EnablePlugins=PythonScriptPlugin \
  -unattended -nosplash -nopause -nullrhi \
  >"$LOG" 2>&1
rc=$?

echo "commandlet exit=$rc"
echo
echo "==== summary (Display-level logs are swallowed in commandlet mode) ===="
if [ -f "$RESULT" ]; then cat "$RESULT"; echo; else
  echo "NO RESULT FILE — the script did not reach its end. Tail of log:"
  tail -20 "$LOG"; exit 1
fi
grep -E "ELECTRA_RESULT|LogPython: Error" "$LOG" | tail -5

# A run that found nothing is a FAILURE, not a success (the 2026-08-25 trap).
found=$(python3 -c "import json;print(json.load(open('$RESULT'))['found'])" 2>/dev/null || echo 0)
if [ "${found:-0}" -eq 0 ]; then
  echo
  echo "FAIL: 0 StreamMediaSource assets found. Nothing was changed."
  exit 1
fi

echo
if [ "$MODE" = apply ]; then
  echo "==== VERIFYING ON DISK (independent of the script's own report) ===="
  python3 "$SCRIPT_DIR/verify_media_overrides.py" "$MEDIA"
  vrc=$?
  echo
  [ $vrc -eq 0 ] && echo "OK — overrides confirmed in the asset bytes." \
                 || echo "VERIFY FAILED — see above; do NOT package."
  exit $vrc
else
  echo "Dry run only. Nothing written. Re-run with:  $0 apply"
fi
