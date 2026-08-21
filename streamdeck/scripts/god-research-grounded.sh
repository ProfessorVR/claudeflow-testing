#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Grounded research topic")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — GROUNDED RESEARCH"
echo "  Topic: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts research "$INPUT" --grounded
god_wait
