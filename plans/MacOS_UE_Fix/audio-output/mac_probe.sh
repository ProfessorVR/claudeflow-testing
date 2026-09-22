#!/bin/bash
# mac_probe.sh <seconds> "<steps>" [game args...] - ON THE MAC (GUI session unlocked). Launches the Development app,
# and at given seconds after launch presses a key, clicks (points), or saves a screenshot:
#   "45:key:m;49:shot:menu;52:click:1100,60"   key = System Events keystroke, click = System Events click at {x, y}
# Screenshots /tmp/aud_probe_<name>.png; action log /tmp/aud_probe_log.txt; game log copied to /tmp/aud_mac_game.log.
set -u
SECS="${1:?seconds}"; STEPS="${2:-}"; shift 2 || true
APP=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/Packaged/Mac/awsTutorial.app
LOGDIR="$HOME/Library/Logs/awsTutorial"
LOG=/tmp/aud_probe_log.txt
rm -f /tmp/aud_probe_*.png
: > "$LOG"
echo "locked: $(ioreg -n Root -d1 | grep -o '"CGSSessionScreenIsLocked"=[A-Za-z]*')" >> "$LOG"
rm -f "$LOGDIR/awsTutorial.log"
START=$(date +%s)
open -n -a "$APP" --args "$@"
PLAN=()
[ -n "$STEPS" ] && IFS=';' read -r -a PLAN <<< "$STEPS"
for step in ${PLAN[@]+"${PLAN[@]}"}; do
  AT="${step%%:*}"; REST="${step#*:}"; KIND="${REST%%:*}"; ARG="${REST#*:}"
  while [ $(( $(date +%s) - START )) -lt "$AT" ]; do sleep 0.5; done
  front=$(lsappinfo info -only name "$(lsappinfo front)" 2>/dev/null | sed 's/.*="\(.*\)"/\1/')
  case "$KIND" in
    key)   out=$(osascript -e "tell application \"System Events\" to keystroke \"$ARG\"" 2>&1) ;;
    click) out=$(osascript -e "tell application \"System Events\" to click at {${ARG}}" 2>&1) ;;
    shot)  out=$(/usr/sbin/screencapture -x "/tmp/aud_probe_$ARG.png" 2>&1) ;;
  esac
  echo "$(( $(date +%s) - START ))s $KIND $ARG front=$front ${out:+-> $out}" >> "$LOG"
done
while [ $(( $(date +%s) - START )) -lt "$SECS" ]; do sleep 1; done
osascript -e 'tell application "awsTutorial" to quit' >/dev/null 2>&1
sleep 8
pkill -x awsTutorial 2>/dev/null
cp "$LOGDIR/awsTutorial.log" /tmp/aud_mac_game.log 2>/dev/null
echo "RUN_DONE $(date +%T)" >> "$LOG"
