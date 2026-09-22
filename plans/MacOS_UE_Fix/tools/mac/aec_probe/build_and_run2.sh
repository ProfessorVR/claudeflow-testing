#!/bin/bash
# build_and_run2.sh — ON THE MAC from /tmp/aecprobe. Builds AECProbe2.app and runs probe v2 (~80 s;
# the Mac speaks through its BUILT-IN speakers regardless of AirPods; system defaults untouched).
set -u
cd /tmp/aecprobe || exit 1
rm -rf AECProbe2.app
mkdir -p AECProbe2.app/Contents/MacOS
sed 's/<string>AECProbe<\/string>/<string>AECProbe2<\/string>/g; s/edu.kinglab.aecprobe/edu.kinglab.aecprobe2/' Info.plist > AECProbe2.app/Contents/Info.plist
clang -O2 -fobjc-arc -Wall -Wno-unused-parameter -o AECProbe2.app/Contents/MacOS/AECProbe2 aec_probe2.m \
  -framework AVFoundation -framework AudioToolbox -framework CoreAudio -framework CoreFoundation -framework Foundation \
  || { echo "!! build failed"; exit 1; }
codesign --force --sign - AECProbe2.app 2>/dev/null || { echo "!! codesign failed"; exit 1; }
[ -s speech.aiff ] || { echo "!! speech.aiff missing"; exit 1; }
rm -f result2.txt
echo "--- running probe v2"
open -W -n AECProbe2.app --args /tmp/aecprobe/result2.txt /tmp/aecprobe/speech.aiff
cat result2.txt
