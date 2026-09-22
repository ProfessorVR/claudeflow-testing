#!/bin/bash
# run_probe_mac.sh - ON THE MAC from /tmp/evcprobe (sources copied there). Builds EVCProbe.app around the
# SHIPPING core and runs it. Needs /tmp/aecprobe/speech.aiff. AirPods must be in their case (the core,
# like the game, follows the default input/output devices).
set -u
cd /tmp/evcprobe || exit 1
rm -rf EVCProbe.app
mkdir -p EVCProbe.app/Contents/MacOS
clang++ -std=c++17 -O2 -Wall -Wextra -Wshadow -Werror -I. -c probe_mac.cpp Mac/EVCCaptureCore_Mac.cpp AEC/EVCCaptureCore.cpp || { echo "!! build failed"; exit 1; }
clang++ -fobjc-arc -O2 -Wall -Werror -c probe_mac_perm.mm || { echo "!! build failed (perm)"; exit 1; }
clang++ -o EVCProbe.app/Contents/MacOS/EVCProbe probe_mac.o EVCCaptureCore_Mac.o EVCCaptureCore.o probe_mac_perm.o \
  -framework AudioToolbox -framework CoreAudio -framework CoreFoundation -framework AVFoundation -framework Foundation || { echo "!! link failed"; exit 1; }
cat > EVCProbe.app/Contents/Info.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>edu.kinglab.evcprobe</string>
<key>CFBundleExecutable</key><string>EVCProbe</string>
<key>CFBundleName</key><string>EVCProbe</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSUIElement</key><true/>
<key>NSMicrophoneUsageDescription</key><string>Measures echo cancellation for the awsTutorial voice-chat fix.</string>
</dict></plist>
PLIST
codesign --force --sign - EVCProbe.app 2>/dev/null || { echo "!! codesign failed"; exit 1; }
rm -f result.txt
echo "--- defaults now:"; system_profiler SPAudioDataType | grep -B8 "Default Input Device: Yes\|Default Output Device: Yes" | grep -E "^        [^ ].*:$"
echo "--- running (the Mac speaks for ~45 s)"
open -W -n EVCProbe.app --args /tmp/evcprobe/result.txt /tmp/aecprobe/speech.aiff
cat result.txt
