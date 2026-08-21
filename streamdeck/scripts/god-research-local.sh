#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Local research topic")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — LOCAL RESEARCH"
echo "  Topic: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts research "$INPUT" --local-only
god_wait
