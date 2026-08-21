#!/bin/bash
# God Agent - Open Dashboard
# Stream Deck Button: DASHBOARD

DASHBOARD_PATH="${GOD_AGENT_DASHBOARD:-$HOME/god-agent-streamdeck/dashboard/index.html}"

if [ ! -f "$DASHBOARD_PATH" ]; then
  osascript -e 'display alert "Dashboard not found" message "Expected at: '"$DASHBOARD_PATH"'" as warning'
  exit 1
fi

open "$DASHBOARD_PATH"
