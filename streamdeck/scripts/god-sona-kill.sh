#!/bin/bash
# God Agent Stream Deck — SoNA KILL: instant 0.0 feedback for hallucination emergency
# Background mode (wsl.exe). Reads trajectory ID from clipboard.
source "$(dirname "$0")/_common.sh"
god_cd

TRAJ_ID=$(god_clipboard)
if [ -n "$TRAJ_ID" ]; then
  echo "SoNA KILL: sending 0.0 for trajectory $TRAJ_ID"
  npx tsx src/god-agent/universal/cli.ts feedback "$TRAJ_ID" 0.0 --reason "hallucination-kill"
  god_toast "SoNA KILL" "Feedback 0.0 sent for $TRAJ_ID"
else
  god_toast "SoNA KILL" "ERROR: No trajectory ID in clipboard"
fi
