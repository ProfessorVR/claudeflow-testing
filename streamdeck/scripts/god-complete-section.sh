#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Section topic to complete")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — COMPLETE SECTION"
echo "  Topic: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts write "$INPUT" --execute --whitelist --multi-step --style-profile dalton-academic-mkn82c3v
god_wait
