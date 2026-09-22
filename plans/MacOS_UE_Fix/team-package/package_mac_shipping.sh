#!/bin/bash
# package_mac_shipping.sh - ON THE MAC. Builds + stages a SHIPPING Mac app from the existing cook (SOP §11h-4
# step 2b with -clientconfig=Shipping), into Packaged/Mac-Shipping, leaving Packaged/Mac (Development) alone.
# Then the §11c CEF safety net and verification. Output: /tmp/evc_package_mac_shipping.out (ends VERIFY_DONE).
# Exit status = the UAT exit status (0 only when BUILD SUCCESSFUL) — 2026-09-21 review: it used to be the verify
# block's, always 0. Paths: UE_ENGINE and UE_PROJECT_DIR in the environment override the Air's defaults.
set -u
ENGINE="${UE_ENGINE:-/Volumes/UnrealEngine/UE_5_4_1}"
PROJDIR="${UE_PROJECT_DIR:-/Volumes/UnrealEngine/Unreal_Projects/awsTutorial}"
UPROJECT="$PROJDIR/awsTutorial.uproject"
ARCHIVE="$PROJDIR/Packaged/Mac-Shipping"
RUNUAT="$ENGINE/Engine/Build/BatchFiles/RunUAT.sh"
UEDITOR="$ENGINE/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
OUT=/tmp/evc_package_mac_shipping.out
LOG=/tmp/awsTutorial-stage-shipping.log
APP="$ARCHIVE/awsTutorial-Mac-Shipping.app"   # Mac Shipping bundles are named <Project>-Mac-Shipping.app
: > "$OUT"
[ -f "$UPROJECT" ] || { echo "!! project not found: $UPROJECT (set UE_PROJECT_DIR)" >> "$OUT"; echo VERIFY_DONE >> "$OUT"; exit 1; }
# Guard (2026-09-21): refuse to stage from an engine that lacks patch 6g (resolution list). The check script lives
# beside this one (team package, or ~/gfx_autotune/ on the Air).
GUARD="$(cd "$(dirname "$0")" && pwd)/check_engine_patch.sh"
[ -f "$GUARD" ] || { echo "!! check_engine_patch.sh missing beside $0 — refusing to stage" >> "$OUT"; echo VERIFY_DONE >> "$OUT"; exit 1; }
if ! bash "$GUARD" "$ENGINE/Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp" >> "$OUT" 2>&1; then
  echo "ENGINE_PATCH_MISSING - nothing was staged" >> "$OUT"; echo VERIFY_DONE >> "$OUT"; exit 1
fi
[ -d "$PROJDIR/Saved/Cooked/Mac" ] || { echo "!! no cook at $PROJDIR/Saved/Cooked/Mac" >> "$OUT"; echo VERIFY_DONE >> "$OUT"; exit 1; }
echo "==> stage/pak/sign/archive SHIPPING from the existing cook ($(date))" >> "$OUT"
caffeinate -dimsu "$RUNUAT" BuildCookRun -project="$UPROJECT" -target=awsTutorial -platform=Mac -clientconfig=Shipping \
  -unrealexe="$UEDITOR" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompile -nocompileuat \
  -skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo \
  -archivedirectory="$ARCHIVE" > "$LOG" 2>&1
UAT_RC=$?
echo "UAT_EXIT=$UAT_RC" >> "$OUT"
grep -a "BUILD SUCCESSFUL\|BUILD FAILED\|ExitCode=" "$LOG" | tail -3 >> "$OUT"
if [ -d "$APP/Contents/Frameworks/Chromium Embedded Framework.framework" ]; then
  mkdir -p "$APP/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac"
  ln -sfn "../../../../../../Frameworks/Chromium Embedded Framework.framework" \
     "$APP/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac/Chromium Embedded Framework.framework"
  echo "CEF symlink ensured" >> "$OUT"
fi
{
  echo "--- verify"
  if [ -d "$APP/Contents/MacOS" ]; then
    ls -la "$APP/Contents/MacOS/"
    echo "fix compiled in: $(strings "$APP"/Contents/MacOS/* 2>/dev/null | grep -c 'macOS VoiceProcessingIO (AEC)')"
    codesign -dv "$APP" 2>&1 | grep -E "Signature=|Identifier="
    echo "sandbox keys: $(codesign -d --entitlements :- "$APP" 2>&1 | grep -c app-sandbox)"
    /usr/libexec/PlistBuddy -c "Print :NSMicrophoneUsageDescription" "$APP/Contents/Info.plist"
    du -sh "$APP"
  else echo "MISSING: $APP was not produced (UAT_EXIT=$UAT_RC)"; fi
  echo VERIFY_DONE
} >> "$OUT" 2>&1
exit "$UAT_RC"
