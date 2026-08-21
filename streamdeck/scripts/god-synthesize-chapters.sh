#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Chapters to synthesize (e.g. 'chapter 3 and chapter 4')")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — SYNTHESIZE CHAPTERS"
echo "  Task: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts write "$INPUT" --execute
god_wait
