#!/bin/bash
# package_mac_shipping.sh - ON THE MAC. Builds + stages a SHIPPING Mac app from the existing cook (SOP §11h-4
# step 2 with -clientconfig=Shipping), into Packaged/Mac-Shipping, leaving Packaged/Mac (Development) alone.
# Then the §11c CEF safety net and verification. Output: /tmp/evc_package_mac_shipping.out (ends VERIFY_DONE).
ENGINE=/Volumes/UnrealEngine/UE_5_4_1
PROJDIR=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial
UPROJECT="$PROJDIR/awsTutorial.uproject"
ARCHIVE="$PROJDIR/Packaged/Mac-Shipping"
RUNUAT="$ENGINE/Engine/Build/BatchFiles/RunUAT.sh"
UEDITOR="$ENGINE/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor"
OUT=/tmp/evc_package_mac_shipping.out
LOG=/tmp/awsTutorial-stage-shipping.log
APP="$ARCHIVE/awsTutorial-Mac-Shipping.app"   # Mac Shipping bundles are named <Project>-Mac-Shipping.app
: > "$OUT"
[ -d "$PROJDIR/Saved/Cooked/Mac" ] || { echo "!! no cook at $PROJDIR/Saved/Cooked/Mac" >> "$OUT"; echo VERIFY_DONE >> "$OUT"; exit 1; }
echo "==> stage/pak/sign/archive SHIPPING from the existing cook ($(date))" >> "$OUT"
caffeinate -dimsu "$RUNUAT" BuildCookRun -project="$UPROJECT" -target=awsTutorial -platform=Mac -clientconfig=Shipping \
  -unrealexe="$UEDITOR" -nop4 -utf8output -nocompileeditor -skipbuildeditor -nocompile -nocompileuat \
  -skipcook -build -stage -pak -iostore -compressed -package -archive -prereqs -nodebuginfo \
  -archivedirectory="$ARCHIVE" > "$LOG" 2>&1
echo "UAT_EXIT=$?" >> "$OUT"
grep -a "BUILD SUCCESSFUL\|BUILD FAILED\|ExitCode=" "$LOG" | tail -3 >> "$OUT"
if [ -d "$APP/Contents/Frameworks/Chromium Embedded Framework.framework" ]; then
  mkdir -p "$APP/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac"
  ln -sfn "../../../../../../Frameworks/Chromium Embedded Framework.framework" \
     "$APP/Contents/UE/Engine/Binaries/ThirdParty/CEF3/Mac/Chromium Embedded Framework.framework"
  echo "CEF symlink ensured" >> "$OUT"
fi
{
  echo "--- verify"
  ls -la "$APP/Contents/MacOS/"
  echo "fix compiled in: $(strings "$APP"/Contents/MacOS/* 2>/dev/null | grep -c 'macOS VoiceProcessingIO (AEC)')"
  codesign -dv "$APP" 2>&1 | grep -E "Signature=|Identifier="
  echo "sandbox keys: $(codesign -d --entitlements :- "$APP" 2>&1 | grep -c app-sandbox)"
  /usr/libexec/PlistBuddy -c "Print :NSMicrophoneUsageDescription" "$APP/Contents/Info.plist"
  du -sh "$APP"
  echo VERIFY_DONE
} >> "$OUT" 2>&1
