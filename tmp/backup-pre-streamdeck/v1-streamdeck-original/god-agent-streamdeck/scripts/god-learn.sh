#!/bin/bash
# God Agent - Store Knowledge
# Stream Deck Button: LEARN

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

KNOWLEDGE=$(osascript -e 'Tell application "System Events" to display dialog "Knowledge to store:" default answer "" with title "God Agent — LEARN" buttons {"Cancel", "Store"} default button "Store"' -e 'text returned of result' 2>/dev/null)

if [ -z "$KNOWLEDGE" ]; then
  echo "Cancelled."
  exit 0
fi

echo "========================================="
echo "  GOD AGENT - LEARN"
echo "  Storing: $KNOWLEDGE"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts learn "$KNOWLEDGE"
echo "========================================="
echo "Knowledge stored! Press any key to close..."
read -n 1
