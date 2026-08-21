#!/bin/bash
# God Agent - Provide Feedback on Interaction
# Stream Deck Button: FEEDBACK

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

INTERACTION_ID=$(osascript -e 'Tell application "System Events" to display dialog "Interaction ID to rate:" default answer "" with title "God Agent — FEEDBACK" buttons {"Cancel", "Next"} default button "Next"' -e 'text returned of result' 2>/dev/null)

if [ -z "$INTERACTION_ID" ]; then
  echo "Cancelled."
  exit 0
fi

QUALITY=$(osascript -e 'Tell application "System Events" to display dialog "Quality score (0.0 - 1.0):" default answer "0.9" with title "God Agent — FEEDBACK" buttons {"Cancel", "Submit"} default button "Submit"' -e 'text returned of result' 2>/dev/null)

if [ -z "$QUALITY" ]; then
  echo "Cancelled."
  exit 0
fi

echo "========================================="
echo "  GOD AGENT - FEEDBACK"
echo "  ID: $INTERACTION_ID | Quality: $QUALITY"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts feedback "$INTERACTION_ID" "$QUALITY"
echo "========================================="
echo "Feedback submitted! Press any key to close..."
read -n 1
