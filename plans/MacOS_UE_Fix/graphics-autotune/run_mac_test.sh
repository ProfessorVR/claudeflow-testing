#!/bin/bash
# run_mac_test.sh <seconds> [game args...] - ON THE MAC (GUI session must be unlocked).
# Launches Packaged/Mac/awsTutorial.app with the given args, records the frontmost app every 5 s
# (/tmp/gfx_mac_front.txt), quits the game after <seconds>, and copies the game log to /tmp/gfx_mac_game.log.
set -u
SECS="${1:-150}"; shift || true
APP=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/Packaged/Mac/awsTutorial.app
LOGDIR="$HOME/Library/Logs/awsTutorial"
: > /tmp/gfx_mac_front.txt
echo "locked: $(ioreg -n Root -d1 | grep -o '"CGSSessionScreenIsLocked"=[A-Za-z]*')" >> /tmp/gfx_mac_front.txt
echo "power: $(pmset -g batt | head -1)" >> /tmp/gfx_mac_front.txt
rm -f "$LOGDIR/awsTutorial.log"
open -n -a "$APP" --args "$@"
end=$(( $(date +%s) + SECS ))
while [ "$(date +%s)" -lt "$end" ]; do
  sleep 5
  front=$(lsappinfo info -only name "$(lsappinfo front)" 2>/dev/null | sed 's/.*="\(.*\)"/\1/')
  echo "$(date +%T) front=$front" >> /tmp/gfx_mac_front.txt
done
osascript -e 'tell application "awsTutorial" to quit' >/dev/null 2>&1
sleep 8
pkill -x awsTutorial 2>/dev/null
cp "$LOGDIR/awsTutorial.log" /tmp/gfx_mac_game.log 2>/dev/null
echo "RUN_DONE $(date +%T)" >> /tmp/gfx_mac_front.txt
