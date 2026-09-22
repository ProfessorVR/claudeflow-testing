#!/usr/bin/env bash
# =============================================================================
#  awsTutorial — one-command macOS packaging (Development)
# -----------------------------------------------------------------------------
#  WHY THIS EXISTS: on this project the UnrealEditor cook commandlet always
#  COMPLETES the cook, but the process never terminates (same reason the editor
#  itself won't quit normally and must be force-quit). That deadlock is what
#  hangs the editor's one-click "Package Project". This script works around it:
#      cook  ->  wait for cook to finish  ->  force-kill the stuck cook  ->
#      stage/pak/sign/archive with -skipcook  (no cook commandlet = no hang).
#
#  MAP SELECTION IS YOURS: this script does NOT change any map settings.
#  Pick the level to ship by saving Hospital_Server or Hospital_Client AS
#  FirstPersonMap in the editor first (preserving the UserLogin -> level flow),
#  then run this.  It only kills COOK processes (pattern '-run=Cook'); your
#  interactive editor, if open, is left alone.
# =============================================================================
set -uo pipefail

ENGINE="${UE_ENGINE:-/Volumes/UnrealEngine/UE_5_4_1}"
# UE_PROJECT (.uproject path) or UE_PROJECT_DIR (project folder) — both accepted since 2026-09-21; UE_ARCHIVE overrides the output.
if [ -n "${UE_PROJECT:-}" ]; then UPROJECT="$UE_PROJECT"
elif [ -n "${UE_PROJECT_DIR:-}" ]; then UPROJECT="$UE_PROJECT_DIR/awsTutorial.uproject"
else UPROJECT="/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/awsTutorial.uproject"; fi
ARCHIVE="${UE_ARCHIVE:-$(dirname "$UPROJECT")/Packaged/Mac}"
[ -f "$UPROJECT" ] || { echo "  !! project not found: $UPROJECT (set UE_PROJECT or UE_PROJECT_DIR)"; exit 1; }
RUNUAT="$ENGINE/Engine/Build/BatchFiles/RunUAT.sh"
UEDITOR="$ENGINE/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
APP="$ARCHIVE/awsTutorial.app"
COOKLOG="/tmp/awsTutorial-cook.log"
STAGELOG="/tmp/awsTutorial-stage.log"
COMMON=(-project="$UPROJECT" -target=awsTutorial -platform=Mac -clientconfig=Development
        -unrealexe="$UEDITOR" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompile -nocompileuat)

# Guard (2026-09-21): never package an engine that lacks patch 6g (resolution list) — the game depends on it and
# nothing at run time reports its absence. check_engine_patch.sh ships beside this script in the team package.
GUARD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/check_engine_patch.sh"
[ -f "$GUARD" ] || { echo "  !! check_engine_patch.sh is missing beside this script — the team package is incomplete; refusing to package."; exit 1; }
bash "$GUARD" "$ENGINE/Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp" || { echo "  !! ENGINE_PATCH_MISSING — nothing was packaged."; exit 1; }

echo "==> [1/4] Cook (auto-kills the stuck cook the moment it finishes)…"
: > "$COOKLOG"
caffeinate -dimsu "$RUNUAT" BuildCookRun "${COMMON[@]}" -cook >"$COOKLOG" 2>&1 &
UAT=$!
cooked=0
for _ in $(seq 1 400); do          # up to ~100 min
  # Only a cook with ZERO errors is complete; "Success - 3 error(s)" is a failed cook that must not be staged (2026-09-21).
  if grep -qaE 'Success - 0 error\(s\)' "$COOKLOG" && grep -qa 'Execution of commandlet took' "$COOKLOG"; then
    cooked=1; break
  fi
  if grep -qaE 'COOK FAILED|BUILD FAILED|Fatal error|Error: Cook' "$COOKLOG" \
     || { grep -qaE 'Success - [1-9][0-9]* error\(s\)' "$COOKLOG" && grep -qa 'Execution of commandlet took' "$COOKLOG"; }; then
    echo "  !! COOK FAILED — see $COOKLOG ($(grep -aoE 'Success - [0-9]+ error\(s\), [0-9]+ warning' "$COOKLOG" | tail -1))"
    pkill -f "UnrealEditor.*$(basename "$UPROJECT").*-run=Cook" 2>/dev/null; pkill -f "AutomationTool.dll.*BuildCookRun.*$(basename "$UPROJECT").*-cook" 2>/dev/null; kill "$UAT" 2>/dev/null; exit 1
  fi
  if ! kill -0 "$UAT" 2>/dev/null; then           # UAT exited on its own (cook didn't hang)
    grep -qa 'Execution of commandlet took' "$COOKLOG" && { cooked=1; break; }
    echo "  !! cook process ended before completion — see $COOKLOG"; exit 1
  fi
  sleep 15
done
# $UAT is caffeinate's PID (it does not forward signals): kill the cook and UAT themselves on a timeout, or a second run
# would cook concurrently into the same Saved/Cooked/Mac (2026-09-22 review).
[ "$cooked" = 1 ] || { echo "  !! timed out waiting for cook"; pkill -f "UnrealEditor.*$(basename "$UPROJECT").*-run=Cook" 2>/dev/null; pkill -f "AutomationTool.dll.*BuildCookRun.*$(basename "$UPROJECT").*-cook" 2>/dev/null; kill "$UAT" 2>/dev/null; exit 1; }
echo "    cook complete ($(grep -aoE 'Success - [0-9]+ error\(s\), [0-9]+ warning' "$COOKLOG" | tail -1)); force-killing the stuck cook…"
# Scoped to THIS project's cook (the command line carries the .uproject path) — never another project's (2026-09-21).
pkill -f "UnrealEditor.*$(basename "$UPROJECT").*-run=Cook" 2>/dev/null
pkill -f "AutomationTool.dll.*BuildCookRun.*$(basename "$UPROJECT").*-cook" 2>/dev/null
kill "$UAT" 2>/dev/null
sleep 3

echo "==> [2/4] Stage / pak / sign / archive (-skipcook — no cook, no hang)…"
: > "$STAGELOG"
caffeinate -dimsu "$RUNUAT" BuildCookRun "${COMMON[@]}" \
  -skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs \
  -archivedirectory="$ARCHIVE" >"$STAGELOG" 2>&1
grep -qa 'BUILD SUCCESSFUL' "$STAGELOG" || { echo "  !! stage/package FAILED — see $STAGELOG"; tail -n 15 "$STAGELOG"; exit 1; }

echo "==> [3/4] Ensure CEF framework is where UE looks (safety net for the Cognito login web view)…"
if [ -d "$APP/Contents/Frameworks/Chromium Embedded Framework.framework" ]; then
  CEFDIR="$APP/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac"
  mkdir -p "$CEFDIR"
  ln -sfn "../../../../../../Frameworks/Chromium Embedded Framework.framework" \
          "$CEFDIR/Chromium Embedded Framework.framework"
fi

echo "==> [4/4] DONE."
echo "    App:     $APP"
codesign -dv "$APP" 2>&1 | grep -iE 'Signature=|Identifier=' | sed 's/^/    /'
echo "    Launch:  open \"$APP\""
