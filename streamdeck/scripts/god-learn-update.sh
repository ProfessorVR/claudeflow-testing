#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
god_toast "God Agent" "Running learn update..."
npx tsx src/god-agent/universal/cli.ts batch-learn 2>&1
god_toast "God Agent" "Learn update complete"
