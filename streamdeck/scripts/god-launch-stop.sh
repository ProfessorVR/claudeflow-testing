#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
scripts/god-launch stop 2>&1

# Stop Stream Deck MCP SSE watcher
if [ -f "$GOD_AGENT_DIR/.run/streamdeck-watcher.pid" ]; then
  kill "$(cat "$GOD_AGENT_DIR/.run/streamdeck-watcher.pid")" 2>/dev/null
  rm -f "$GOD_AGENT_DIR/.run/streamdeck-watcher.pid"
fi

god_toast "God Agent" "Services stopped"
