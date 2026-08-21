#!/bin/bash
source "$(dirname "$0")/../_common.sh"
god_cd
ID=$(god_clipboard)
[ -z "$ID" ] && god_toast "Feedback" "No trajectory ID in clipboard" && exit 0
npx tsx src/god-agent/universal/cli.ts feedback "$ID" 1.0 2>&1
god_toast "Feedback" "Perfect (1.0) — $ID"
