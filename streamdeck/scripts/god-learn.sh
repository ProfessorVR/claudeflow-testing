#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_clipboard)
if [ -z "$INPUT" ]; then
  god_toast "God Agent" "No content in clipboard to learn"
  exit 0
fi
npx tsx src/god-agent/universal/cli.ts learn "$INPUT" 2>&1
god_toast "God Agent" "Knowledge stored"
