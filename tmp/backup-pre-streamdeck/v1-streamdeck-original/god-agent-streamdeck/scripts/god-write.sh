#!/bin/bash
# God Agent - Write Document
# Stream Deck Button: WRITE

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

TASK=$(osascript -e 'Tell application "System Events" to display dialog "What should I write?" default answer "" with title "God Agent — WRITE" buttons {"Cancel", "Write"} default button "Write"' -e 'text returned of result' 2>/dev/null)

if [ -z "$TASK" ]; then
  echo "Cancelled."
  exit 0
fi

echo "========================================="
echo "  GOD AGENT - WRITE"
echo "  Task: $TASK"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts write "$TASK"
echo "========================================="
echo "Press any key to close..."
read -n 1
