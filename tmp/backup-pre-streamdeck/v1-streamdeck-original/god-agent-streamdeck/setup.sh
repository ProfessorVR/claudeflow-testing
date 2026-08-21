#!/bin/bash
# Run this once to set up God Agent Stream Deck integration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "  GOD AGENT STREAM DECK SETUP"
echo "========================================="

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/scripts/*.sh
echo "✓ Scripts made executable"

# Check God Agent installation
GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"
if [ -d "$GOD_AGENT_DIR" ]; then
  echo "✓ God Agent found at: $GOD_AGENT_DIR"
else
  echo "⚠ God Agent not found at: $GOD_AGENT_DIR"
  echo "  Set GOD_AGENT_DIR in your environment to override."
fi

echo ""
echo "Stream Deck Layout (MK.2 - 15 keys):"
echo ""
echo "  ┌─────────┬─────────┬─────────┬─────────┬─────────┐"
echo "  │ STATUS  │   ASK   │  CODE   │RESEARCH │  WRITE  │"
echo "  ├─────────┼─────────┼─────────┼─────────┼─────────┤"
echo "  │  LEARN  │  QUERY  │LEARNSTYL│ STYLES  │FEEDBACK │"
echo "  ├─────────┼─────────┼─────────┼─────────┼─────────┤"
echo "  │         │         │         │         │DASHBOARD│"
echo "  └─────────┴─────────┴─────────┴─────────┴─────────┘"
echo ""
echo "Each button → Open in Terminal → run scripts/god-<name>.sh"
echo ""
echo "Dashboard: open dashboard/index.html in browser"
echo "========================================="
echo "Setup complete!"
