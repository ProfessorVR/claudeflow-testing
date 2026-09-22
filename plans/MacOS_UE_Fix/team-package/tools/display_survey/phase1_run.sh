#!/bin/bash
# phase1_run.sh <app path> <label> [wait=60] - ON THE MAC. One cell of the Phase 1 panel matrix (2026-09-21).
# Records the display mode and AppKit insets, launches the packaged app, waits, reads the [GraphicsAutoTune]
# MacWindow/Trace lines written AFTER launch, screenshots, SIGTERMs, and checks for crashes. Portable to any Mac that
# has /tmp/display_modes and /tmp/set_mode compiled (display_survey/). Never touches the project, engine or the ini.
set -u
APP="${1:?app path}"; LABEL="${2:?label}"; WAIT="${3:-60}"
PROC=$(basename "$APP" .app)
OUT=/tmp/phase1/$LABEL; mkdir -p "$OUT"
CFG=~/Library/Application\ Support/Epic/awsTutorial/Saved/Config/Mac
LOG=~/Library/Logs/awsTutorial/awsTutorial.log
ini_lines() { grep -E "^(MacWindow|Trace[123])=" "$CFG/GameUserSettings.ini" 2>/dev/null; }
{
echo "=== $LABEL  $(date -u +%FT%TZ)  app=$PROC wait=${WAIT}s"
if pgrep -x "$PROC" >/dev/null; then echo "ABORT: $PROC already running"; exit 2; fi
echo "mode: $(/tmp/set_mode current)"
/tmp/display_modes | grep -E "^screen\[|safeAreaInsets" | cut -c1-260
START_UTC=$(date -u +%FT%T)
open "$APP" || { echo "ABORT: open failed"; exit 2; }
PID=""; for i in $(seq 1 30); do PID=$(pgrep -x "$PROC" | head -1); [ -n "$PID" ] && break; sleep 1; done
[ -z "$PID" ] && { echo "ABORT: process never appeared"; exit 2; }
echo "pid $PID at $(date +%T)"
sleep "$WAIT"
if ! kill -0 "$PID" 2>/dev/null; then echo "EXITED_EARLY (before ${WAIT}s)"; else
  ps -o pid,%cpu,rss,etime,state -p "$PID" | tail -1
  screencapture -x "$OUT/screen.png" 2>/dev/null
  # actual window geometry as macOS sees it (CGWindowList; points, y-down from the top of the main display)
  /tmp/win_bounds 2>/dev/null || echo "(window bounds unavailable)"
fi
echo "--- ini lines written after $START_UTC:"
ini_lines | awk -v s="$START_UTC" -F'@ ' '{ if ($NF >= s) print }' | cut -c1-220
echo "--- (all current ini lines)"; ini_lines | cut -c1-220
if kill -0 "$PID" 2>/dev/null; then
  kill -TERM "$PID"; for i in $(seq 1 60); do kill -0 "$PID" 2>/dev/null || break; sleep 1; done
  if kill -0 "$PID" 2>/dev/null; then kill -9 "$PID"; sleep 2; echo "quit: KILLED (did not exit on SIGTERM)"; else echo "quit: exited after SIGTERM at $(date +%T)"; fi
else echo "quit: exited on its own"; fi
echo "--- crash reports newer than start:"; find ~/Library/Logs/DiagnosticReports -maxdepth 1 -name "awsTutorial*" -newer "$OUT" 2>/dev/null || true; find ~/Library/Application\ Support/Epic/UnrealEngine/5.4/Saved/Crashes -maxdepth 1 -newer "$OUT" 2>/dev/null | grep -v "Crashes$" || echo "(none)"
if [ -f "$LOG" ] && [ "$PROC" = awsTutorial ]; then
  echo "--- dev log:"; grep -E "LogGraphicsAutoTune: .*(macOS|insets|window|correction|Windowed)|Ensure condition failed|Fatal error|LogExit: Exiting" "$LOG" | cut -c1-220 | tail -14
  cp "$LOG" "$OUT/awsTutorial.log" 2>/dev/null
fi
echo "=== done $(date +%T)"
} 2>&1 | tee "$OUT/result.txt"
