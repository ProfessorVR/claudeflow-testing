#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
OUTPUT=$(npx tsx src/god-agent/universal/cli.ts costs 2>&1 | tail -10)
god_toast "Token Costs" "$OUTPUT"
