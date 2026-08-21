#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Search stored knowledge")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — KNOWLEDGE QUERY"
echo "  Search: $INPUT"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts query "$INPUT"
god_wait
