#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "What should I write?")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — WRITE"
echo "  Task: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts write "$INPUT" --execute
god_wait
