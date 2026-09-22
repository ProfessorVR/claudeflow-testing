#!/bin/bash
# build_and_run.sh — runs ON THE MAC from /tmp/aecprobe. Builds AECProbe.app, makes a speech file,
# runs the probe (≈75 s; the Mac speaks aloud through its built-in speakers), prints the result.
set -u
cd /tmp/aecprobe || exit 1
rm -rf AECProbe.app
mkdir -p AECProbe.app/Contents/MacOS
cp Info.plist AECProbe.app/Contents/Info.plist
clang -O2 -fobjc-arc -Wall -Wno-unused-parameter -o AECProbe.app/Contents/MacOS/AECProbe aec_probe.m \
  -framework AVFoundation -framework AudioToolbox -framework CoreAudio -framework CoreFoundation -framework Foundation \
  || { echo "!! build failed"; exit 1; }
codesign --force --sign - AECProbe.app || { echo "!! codesign failed"; exit 1; }
if [ ! -s speech.aiff ]; then
  say -o speech.aiff "The quick brown fox jumps over the lazy dog. Voice chat in the virtual campus should never send your own voice back to you. We are measuring whether the echo canceller hears the game audio. One, two, three, four, five, six, seven, eight, nine, ten."
fi
afinfo speech.aiff | grep -E "duration|Data format" || true
rm -f result.txt
echo "--- running probe (the Mac will speak for about a minute)"
open -W -n AECProbe.app --args /tmp/aecprobe/result.txt /tmp/aecprobe/speech.aiff
cat result.txt
