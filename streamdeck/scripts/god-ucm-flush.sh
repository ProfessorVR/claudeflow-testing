#!/bin/bash
# God Agent Stream Deck — UCM FLUSH: clear rolling context window
# Background mode (wsl.exe). Use when agent reasoning degrades.
source "$(dirname "$0")/_common.sh"
god_cd

npx tsx src/god-agent/universal/cli.ts ucm-flush 2>&1
god_toast "UCM Flush" "Context window cleared"
