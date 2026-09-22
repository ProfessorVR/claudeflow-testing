#!/bin/bash
# voice_log_capture.sh <tag>
# Rebuilt 2026-09-18 from TEST-PROTOCOL-echo-2026-08-26.md (the 2026-08-26 originals lived only
# in the Mac's /tmp and were lost). Deploy: scp to the Mac's /tmp, run with `bash`.
#
#   1. prints the log path and the current default input/output devices (system_profiler)
#   2. refuses to start if the app is already running (Part F5 — one instance per row)
#   3. launches the packaged app with -log -ABSLOG=<file>
#   4. waits and CONFIRMS the log file exists and is growing before telling you to proceed
#
# Nothing is modified. Read-only instrument.

set -u

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "usage: bash /tmp/voice_log_capture.sh <tag>   (e.g. mac-solo, row1-mac-speakers)" >&2
  exit 2
fi

APP="/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/Packaged/Mac/awsTutorial.app"
BIN="$APP/Contents/MacOS/awsTutorial"
STAMP="$(date +%Y%m%dT%H%M%S)"
LOG="/tmp/voice-${TAG}-${STAMP}.log"
DEV="/tmp/voice-${TAG}-${STAMP}.devices.txt"

if [ ! -x "$BIN" ]; then
  echo "!! app binary not found/executable: $BIN" >&2
  echo "   is the engine volume mounted?  ls /Volumes  →  hdiutil attach /Volumes/KingLab/UnrealEngine.sparsebundle" >&2
  exit 3
fi

# --- 2. refuse a second instance --------------------------------------------------------------
RUNNING="$(pgrep -f 'awsTutorial.app/Contents/MacOS/awsTutorial' || true)"
if [ -n "$RUNNING" ]; then
  echo "!! awsTutorial is ALREADY RUNNING (pid $RUNNING). Cmd-Q it first — one instance per row." >&2
  exit 4
fi

# --- 1. header + device snapshot ---------------------------------------------------------------
{
  echo "# captured $(date)"
  echo "# tag: $TAG"
  echo "# log: $LOG"
  echo
  system_profiler SPAudioDataType 2>/dev/null
} > "$DEV"

echo "=== voice capture: tag=$TAG"
echo "log      : $LOG"
echo "devices  : $DEV"
echo
echo "--- default devices right now:"
awk '
  /^ {8}[^ ].*:$/ { name=$0; sub(/^ +/,"",name); sub(/:$/,"",name) }
  /Default Input Device: Yes/  { print "  INPUT  : " name }
  /Default Output Device: Yes/ { print "  OUTPUT : " name }
' "$DEV"
echo

# --- 3. launch -----------------------------------------------------------------------------------
echo "--- launching $APP"
# No -log: it opens a live log console, and the voice library writes ~1,000+ lines/s, which is real
# overhead the operator noticed as lag (2026-09-18). -ABSLOG alone still writes the full log to $LOG.
open -n "$APP" --args -ABSLOG="$LOG"
sleep 1
PID="$(pgrep -f 'awsTutorial.app/Contents/MacOS/awsTutorial' || true)"
echo "pid      : ${PID:-<not found yet>}"

# --- 4. confirm the log exists and grows ---------------------------------------------------------
echo "--- waiting for the log to appear and grow (up to 45 s)..."
FOUND=0
for i in $(seq 1 45); do
  if [ -s "$LOG" ]; then FOUND=1; break; fi
  sleep 1
done
if [ "$FOUND" -eq 0 ]; then
  echo "!! NO LOG appeared at $LOG after 45 s. INSTRUMENT BROKEN — stop, do not run the row." >&2
  DEFLOG="$HOME/Library/Logs/awsTutorial/awsTutorial.log"
  if [ -f "$DEFLOG" ]; then
    echo "   (a log exists at the default path $DEFLOG — -ABSLOG may not have been honored; " >&2
    echo "    check its mtime: $(stat -f '%Sm' "$DEFLOG"))" >&2
  fi
  exit 5
fi
S1="$(stat -f '%z' "$LOG")"
sleep 5
S2="$(stat -f '%z' "$LOG")"
echo "log size : ${S1} B → ${S2} B over 5 s"
if [ "$S2" -le "$S1" ]; then
  echo "!! log exists but is NOT GROWING. Treat the instrument as broken until explained." >&2
  exit 6
fi

echo
echo "=== OK — log is live. Proceed: log in, reach the world (capture opens on BeginPlay),"
echo "    run the row ≥60 s, speak intermittently, then Cmd-Q (not force-quit)."
echo "    Then:  bash /tmp/voice_log_summary.sh $LOG"
