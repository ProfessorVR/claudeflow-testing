#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
god_toast "God Agent" "Compiling knowledge substrate..."
npx tsx src/god-agent/universal/cli.ts batch-learn --limit 50 2>&1
god_toast "God Agent" "Compile complete"
