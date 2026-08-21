#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Describe the code to generate")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — CODE"
echo "  Task: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts code "$INPUT"
god_wait
