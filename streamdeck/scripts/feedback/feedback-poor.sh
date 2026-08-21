#!/bin/bash
source "$(dirname "$0")/../_common.sh"
god_cd
ID=$(god_clipboard)
[ -z "$ID" ] && god_toast "Feedback" "No trajectory ID in clipboard" && exit 0
npx tsx src/god-agent/universal/cli.ts feedback "$ID" 0.2 2>&1
god_toast "Feedback" "Poor (0.2) — $ID"
