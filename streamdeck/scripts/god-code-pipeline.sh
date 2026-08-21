#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Code pipeline task")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — CODE PIPELINE (48-agent)"
echo "  Task: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts code-pipeline "$INPUT"
god_wait
