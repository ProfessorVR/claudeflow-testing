#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
OUTPUT=$(npx tsx src/god-agent/universal/cli.ts feedback-health 2>&1 | tail -5)
god_toast "God Agent" "Verify: $OUTPUT"
