#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Ask the God Agent")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — ASK"
echo "  Query: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts ask "$INPUT"
god_wait
