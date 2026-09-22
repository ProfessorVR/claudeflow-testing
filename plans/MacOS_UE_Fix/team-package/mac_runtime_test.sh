#!/bin/bash
# mac_runtime_test.sh <dev|ship> <label> [seconds=45] [quit=term|kill] - ON THE MAC. Unattended launch test of a
# packaged app (2026-09-20): starts it with `open`, waits, samples the process (threads), screenshots, reads the
# Development log (dev only) and the shared GameUserSettings.ini traces, then quits it. Output: /tmp/mac_runtime_test/<label>/.
#   quit=term  : send SIGTERM and wait up to 20 s for the process to exit (a graceful exit writes Input.ini and, for dev,
#                "LogExit: Exiting"); falls back to SIGKILL.
#   quit=kill  : SIGKILL at once (for a frozen instance).
# Never touches the project or the engine. The operator's GameUserSettings.ini is NOT modified here; the caller may
# stage synthetic [GraphicsAutoTune] states before calling and must restore afterwards.
set -uo pipefail   # pipefail: the ABORT exits inside the `{ … } | tee` group must reach the caller (2026-09-22 review)
KIND="${1:?dev|ship}"; LABEL="${2:?label}"; WAIT="${3:-45}"; QUIT="${4:-term}"
P="${UE_PROJECT_DIR:-/Volumes/UnrealEngine/Unreal_Projects/awsTutorial}"   # UE_PROJECT_DIR overrides (2026-09-21, lab Macs)
if [ "$KIND" = dev ]; then APP="$P/Packaged/Mac/awsTutorial.app"; PROC=awsTutorial; else APP="$P/Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app"; PROC=awsTutorial-Mac-Shipping; fi
OUT=/tmp/mac_runtime_test/$LABEL; mkdir -p "$OUT"
# Reference time for "newer than this test": a file, not the folder (the folder's mtime moves whenever sample.txt or
# screen.png is created inside it, which hid reports written during the first WAIT seconds — 2026-09-22 review).
touch "$OUT/.start"
CFG=~/Library/Application\ Support/Epic/awsTutorial/Saved/Config/Mac
LOG=~/Library/Logs/awsTutorial/awsTutorial.log
{
echo "=== $LABEL: $KIND app, wait ${WAIT}s, quit=$QUIT, $(date +%T)"
if pgrep -x "$PROC" >/dev/null; then echo "ABORT: $PROC already running"; exit 2; fi
BEFORE_GUS=$(stat -f %m "$CFG/GameUserSettings.ini" 2>/dev/null || echo 0)
BEFORE_INPUT=$(stat -f %m "$CFG/Input.ini" 2>/dev/null || echo 0)
echo "--- [GraphicsAutoTune] before:"; grep -A9 "^\[GraphicsAutoTune\]" "$CFG/GameUserSettings.ini" | grep -E "^(TunedVersion|Attempts|FinishedFailures|FinishedFailuresFor|LastResult|MacWindow)="
open "$APP" || { echo "ABORT: open failed"; exit 2; }
for i in $(seq 1 30); do PID=$(pgrep -x "$PROC" | head -1); [ -n "$PID" ] && break; sleep 1; done
[ -z "$PID" ] && { echo "ABORT: process never appeared"; exit 2; }
echo "pid $PID at $(date +%T)"
sleep "$WAIT"
if ! kill -0 "$PID" 2>/dev/null; then echo "EXITED_EARLY (before ${WAIT}s)"; else
  ps -o pid,%cpu,rss,etime,state -p "$PID"
  sample "$PID" 3 -mayDie -file "$OUT/sample.txt" >/dev/null 2>&1
  echo "sample: query-wait frames=$(grep -c 'FMetalRHIRenderQuery::GetResult' "$OUT/sample.txt") fence-wait=$(grep -c 'FRenderCommandFence::Wait' "$OUT/sample.txt") game-thread-top: $(grep -A1 'FEngineLoop::Tick' "$OUT/sample.txt" | sed -n 2p | sed 's/^ *[+!:| ]*[0-9]* //' | cut -c1-70)"
  screencapture -x "$OUT/screen.png" 2>/dev/null   # over ssh this is a STALE frame (HANDOFF §9) — never evidence; win_bounds (display_survey) is
fi
echo "--- [GraphicsAutoTune] after ${WAIT}s:"; grep -A9 "^\[GraphicsAutoTune\]" "$CFG/GameUserSettings.ini" | grep -E "^(TunedVersion|Attempts|FinishedFailures|FinishedFailuresFor|LastResult|MacWindow)="
if kill -0 "$PID" 2>/dev/null; then
  if [ "$QUIT" = term ]; then kill -TERM "$PID"; for i in $(seq 1 20); do kill -0 "$PID" 2>/dev/null || break; sleep 1; done; fi
  if kill -0 "$PID" 2>/dev/null; then echo "still alive after $QUIT -> SIGKILL"; kill -9 "$PID"; sleep 2; QUIT_RESULT=killed; else QUIT_RESULT="exited after $QUIT"; fi
else QUIT_RESULT="exited on its own"; fi
echo "quit: $QUIT_RESULT at $(date +%T)"
AFTER_GUS=$(stat -f %m "$CFG/GameUserSettings.ini" 2>/dev/null || echo 0); AFTER_INPUT=$(stat -f %m "$CFG/Input.ini" 2>/dev/null || echo 0)
echo "config rewritten at exit: GameUserSettings=$([ "$AFTER_GUS" -gt "$BEFORE_GUS" ] && echo yes || echo no) Input.ini=$([ "$AFTER_INPUT" -gt "$BEFORE_INPUT" ] && echo yes || echo no)"
echo "--- crash/ensure reports newer than this test (macOS DiagnosticReports, the game's and the engine's Crashes folders):"
{ find ~/Library/Logs/DiagnosticReports -maxdepth 1 -name 'awsTutorial*' -newer "$OUT/.start" 2>/dev/null
  find ~/Library/Application\ Support/Epic/awsTutorial/Saved/Crashes -maxdepth 1 -newer "$OUT/.start" 2>/dev/null | grep -v "Crashes$"
  find ~/Library/Application\ Support/Epic/UnrealEngine/5.4/Saved/Crashes -maxdepth 1 -newer "$OUT/.start" 2>/dev/null | grep -v "Crashes$"; } | grep . || echo "(none)"
if [ "$KIND" = dev ]; then
  echo "--- dev log evidence:"; head -c 200 "$LOG" | head -1
  grep -E "LogConfig: Set CVar \[\[r.AllowOcclusionQueries|LogGraphicsAutoTune: |LogEmbeddedVoiceChatAEC: |Capture back-end|LogExit: Exiting|Fatal error|Critical error|Log file closed" "$LOG" | cut -c1-200
  cp "$LOG" "$OUT/awsTutorial.log" 2>/dev/null
fi
echo "=== done $(date +%T)"
} 2>&1 | tee "$OUT/result.txt"
