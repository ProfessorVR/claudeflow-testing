#!/bin/bash
# God Agent - Ask a Question
# Stream Deck Button: ASK

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

# Prompt for input via AppleScript dialog (macOS)
QUERY=$(osascript -e 'Tell application "System Events" to display dialog "Ask the God Agent:" default answer "" with title "God Agent — ASK" buttons {"Cancel", "Ask"} default button "Ask"' -e 'text returned of result' 2>/dev/null)

if [ -z "$QUERY" ]; then
  echo "Cancelled."
  exit 0
fi

echo "========================================="
echo "  GOD AGENT - ASK"
echo "  Query: $QUERY"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts ask "$QUERY"
echo "========================================="
echo "Press any key to close..."
read -n 1
