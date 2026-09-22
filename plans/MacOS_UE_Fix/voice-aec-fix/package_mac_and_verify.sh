#!/bin/bash
# package_mac_and_verify.sh - ON THE MAC. Runs the team packaging script (cook -> kill hung cook ->
# stage/pak/sign) and then verifies the new app. Output: /tmp/evc_package_mac.out (ends with VERIFY_DONE).
OUT=/tmp/evc_package_mac.out
APP=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/Packaged/Mac/awsTutorial.app
~/Downloads/ue541-team-package/package-awsTutorial-mac.sh > "$OUT" 2>&1
echo "PACKAGE_EXIT=$?" >> "$OUT"
{
  echo "--- verify"
  grep -a "BUILD SUCCESSFUL" /tmp/awsTutorial-stage.log | tail -1
  grep -a "Module.EmbeddedVoiceChat" /tmp/awsTutorial-stage.log | head -2
  ls -la "$APP/Contents/MacOS/awsTutorial"
  echo "async-open string present: $(strings "$APP/Contents/MacOS/awsTutorial" | grep -c 'in the background')"
  codesign -dv "$APP" 2>&1 | grep Signature
  du -sh "$APP"
  echo VERIFY_DONE
} >> "$OUT" 2>&1
