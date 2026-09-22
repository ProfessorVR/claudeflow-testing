#!/bin/bash
# voice_log_summary.sh <log>
# Rebuilt 2026-09-18 from TEST-PROTOCOL-echo-2026-08-26.md. Sections match the protocol's
# "What Test 1 must show" table: 1 session reality · 2 startup notices · 3 device + AEC · 4 rate.
# Read-only.

set -u
LOG="${1:-}"
if [ -z "$LOG" ] || [ ! -f "$LOG" ]; then
  echo "usage: bash /tmp/voice_log_summary.sh /tmp/voice-<tag>-<stamp>.log" >&2
  exit 2
fi

cnt() { grep -c -- "$1" "$LOG" 2>/dev/null || true; }
first_ts() { grep -m1 -- "$1" "$LOG" | sed -E 's/^\[([^]]*)\].*/\1/'; }

echo "=== summary of $LOG  ($(wc -l < "$LOG" | tr -d ' ') lines, $(stat -f '%z' "$LOG") B)"
echo "first line : $(head -1 "$LOG" | cut -c1-120)"
echo "last line  : $(tail -1 "$LOG" | cut -c1-120)"
echo

echo "--- 1. session reality"
echo "OpenCaptureStream attempts       : $(grep -ci 'OpenCaptureStream\|Opened audio capture stream\|Failed to open.*capture' "$LOG" || true)"
echo "  of which opened OK             : $(cnt 'Opened audio capture stream')"
echo "capture callbacks fired          : $(cnt 'captured .* frames in')"
echo "VoiceChat BeginPlay              : $(cnt '::BeginPlay')"
echo "joinGroup / leaveGroup           : $(cnt '::joinGroup') / $(cnt '::leaveGroup')"
echo "mic permission lines             : $(grep -ci 'microphone.*\(denied\|permission\|authoriz\)' "$LOG" || true)"
echo

echo "--- 2. startup notices (watch whether they sit right before 'Found default device')"
echo "No Audio Capture implementations : $(cnt 'No Audio Capture implementations found')"
grep -n 'No Audio Capture implementations found' "$LOG" | sed -E 's/^([0-9]+):\[([^]]*)\].*/  line \1  @ \2/' | head -5
FD="$(first_ts 'Found default device')"
echo "first 'Found default device' @ ${FD:-<none>}"
echo

echo "--- 3. device + AEC  (verbatim)"
grep -- 'Found [0-9]* audio devices' "$LOG" | sort | uniq -c | sed 's/^/  /'
grep -- 'Found default device' "$LOG" | sed -E 's/^\[[^]]*\]\[ *[0-9]+\]//' | sort | uniq -c | sed 's/^/  /'
grep -- 'capture device name' "$LOG" | sed -E 's/^\[[^]]*\]\[ *[0-9]+\]//' | sort | uniq -c | sed 's/^/  /'
echo
echo "--- 3b. echo-cancelling capture (2026-09-18 fix; empty = pre-fix build or rolled back)"
grep -- '\[VoiceChat\] Capture back-end' "$LOG" | sed -E 's/^\[[^]]*\]\[ *[0-9]+\]//' | sort | uniq -c | sed 's/^/  /'
grep -- '\[VoiceChat\] Opening capture device' "$LOG" | sed -E 's/^\[([^]]*)\]\[ *[0-9]+\]/  \1 /'
grep -- 'LogEmbeddedVoiceChatAEC' "$LOG" | sed -E 's/^\[([^]]*)\]\[ *[0-9]+\]LogEmbeddedVoiceChatAEC: /  \1 /' | head -20
echo "  AEC errors/warnings             : $(grep -c 'LogEmbeddedVoiceChatAEC: \(Error\|Warning\)' "$LOG" || true)"
echo

echo "--- 4. rate / resampling"
grep -o -- 'captured [0-9]* frames in [0-9]* sample rate' "$LOG" | sort | uniq -c | sed 's/^/  /'
echo "resample lines                   : $(grep -ci 'resampl' "$LOG" || true)"
grep -i 'resampl' "$LOG" | sed -E 's/^\[[^]]*\]\[ *[0-9]+\]//' | sort | uniq -c | head -5 | sed 's/^/  /'
echo

echo "--- 5. teardown / noise (informational)"
echo "sio client is null               : $(cnt 'sio client is null')"
echo "Metal / RHI errors               : $(grep -ci 'LogMetal.*Error\|RHI.*Error' "$LOG" || true)"
echo "Errors total                     : $(grep -c 'Error:' "$LOG" || true)"
echo "Warnings total                   : $(grep -c 'Warning:' "$LOG" || true)"
echo "Log file closed                  : $(cnt 'Log file closed')"
