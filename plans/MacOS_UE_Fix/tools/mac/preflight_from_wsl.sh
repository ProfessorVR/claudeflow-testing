#!/bin/bash
# preflight_from_wsl.sh — run from WSL. Restart steps 1–3 of BOOT-PROMPT-MACOS-VOICE-ECHO in one shot:
#   1. Mac reachable + engine volume mounted (mounts it if not)
#   2. deploy voice_log_capture.sh / voice_log_summary.sh to the Mac's /tmp and verify
#   3. lineage probe: BP_WG_CAT_PARAOG.uasset must NOT exist (fork-only marker)
# Read-only on the project/engine. Exit non-zero on any failed gate.

set -u
MAC="daltonsalvo@192.168.50.10"
SSH="ssh -o BatchMode=yes -o ConnectTimeout=15 $MAC"
HERE="$(cd "$(dirname "$0")" && pwd)"
PROJ="/Volumes/UnrealEngine/Unreal_Projects/awsTutorial"

echo "== 1. reachability"
$SSH 'bash -lc "uptime"' || { echo "!! Mac unreachable — wake it at the lid"; exit 1; }

echo "== 1b. engine volume"
if ! $SSH 'bash -lc "ls -d /Volumes/UnrealEngine/UE_5_4_1"' >/dev/null 2>&1; then
  echo "   not mounted — attaching sparsebundle"
  $SSH 'bash -lc "hdiutil attach /Volumes/KingLab/UnrealEngine.sparsebundle"' || { echo "!! mount failed"; exit 1; }
fi
$SSH 'bash -lc "ls -d /Volumes/UnrealEngine/UE_5_4_1 '"$PROJ"'/Packaged/Mac/awsTutorial.app && df -h /Volumes/UnrealEngine | tail -1"' || { echo "!! engine/project/app path missing"; exit 1; }

echo "== 2. deploy log scripts"
scp -o BatchMode=yes "$HERE/voice_log_capture.sh" "$HERE/voice_log_summary.sh" "$MAC:/tmp/" || { echo "!! scp failed"; exit 1; }
$SSH 'bash -lc "ls -la /tmp/voice_log_*.sh && bash -n /tmp/voice_log_capture.sh && bash -n /tmp/voice_log_summary.sh && echo scripts-OK; ls /tmp/voice-*.log 2>/dev/null || echo \"(no old /tmp/voice-*.log present)\""' || { echo "!! script verify failed"; exit 1; }

echo "== 3. lineage probe"
if $SSH 'bash -lc "test -e '"$PROJ"'/Content/Blueprints/360_Screens/Widgets/BP_WG_CAT_PARAOG.uasset"'; then
  echo "!! FORK MARKER PRESENT (BP_WG_CAT_PARAOG.uasset) — this is NOT the live project. STOP."; exit 1
else
  echo "   BP_WG_CAT_PARAOG.uasset absent — live lineage OK"
fi
$SSH 'bash -lc "ls -la '"$PROJ"'/Content/Blueprints/360_Screens/Widgets/ | grep -i \"CAT_PARA\|BP_SC_T1\|BP_WG_TEST\" || true"'

echo "== 4. app + microphone plist"
$SSH 'bash -lc "stat -f \"%Sm  %N\" '"$PROJ"'/Packaged/Mac/awsTutorial.app/Contents/MacOS/awsTutorial; /usr/libexec/PlistBuddy -c \"Print :NSMicrophoneUsageDescription\" '"$PROJ"'/Packaged/Mac/awsTutorial.app/Contents/Info.plist"'

echo
echo "== PREFLIGHT PASSED. Test 2 rows:  bash /tmp/voice_log_capture.sh row1-mac-speakers   (on the Mac)"
