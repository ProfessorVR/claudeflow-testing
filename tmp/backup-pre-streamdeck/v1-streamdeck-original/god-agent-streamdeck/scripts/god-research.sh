#!/bin/bash
# God Agent - Deep Research
# Stream Deck Button: RESEARCH

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

TOPIC=$(osascript -e 'Tell application "System Events" to display dialog "Research topic:" default answer "" with title "God Agent — RESEARCH" buttons {"Cancel", "Research"} default button "Research"' -e 'text returned of result' 2>/dev/null)

if [ -z "$TOPIC" ]; then
  echo "Cancelled."
  exit 0
fi

echo "========================================="
echo "  GOD AGENT - DEEP RESEARCH"
echo "  Topic: $TOPIC"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts research "$TOPIC"
echo "========================================="
echo "Press any key to close..."
read -n 1
