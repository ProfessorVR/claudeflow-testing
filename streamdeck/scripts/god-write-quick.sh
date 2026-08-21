#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Quick write topic")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — WRITE (QUICK)"
echo "  Topic: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts write "$INPUT" --execute
god_wait
