#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Path to PDF file")
[ -z "$INPUT" ] && echo "No input provided." && exit 0
echo "========================================="
echo "  GOD AGENT — PDF ANALYZE"
echo "  File: $INPUT"
echo "========================================="
npx tsx src/god-agent/pipelines/pdf-cli.ts "$INPUT"
god_wait
