#!/bin/bash
# God Agent - Generate Code
# Stream Deck Button: CODE

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

TASK=$(osascript -e 'Tell application "System Events" to display dialog "Describe the code to generate:" default answer "" with title "God Agent — CODE" buttons {"Cancel", "Generate"} default button "Generate"' -e 'text returned of result' 2>/dev/null)

if [ -z "$TASK" ]; then
  echo "Cancelled."
  exit 0
fi

echo "========================================="
echo "  GOD AGENT - CODE GENERATION"
echo "  Task: $TASK"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts code "$TASK"
echo "========================================="
echo "Press any key to close..."
read -n 1
