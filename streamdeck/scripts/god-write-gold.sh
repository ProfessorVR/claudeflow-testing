#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Gold standard writing topic")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — WRITE (GOLD STANDARD)"
echo "  Topic: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts write "$INPUT" \
  --execute \
  --whitelist \
  --multi-step \
  --style-profile dalton-academic-mkn82c3v \
  --use-inline-validation
god_wait
