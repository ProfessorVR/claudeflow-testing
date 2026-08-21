#!/bin/bash
# God Agent - Style Profile Status
# Stream Deck Button: STYLES

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

echo "========================================="
echo "  GOD AGENT - STYLE PROFILES"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts style-status
echo "========================================="
echo "Press any key to close..."
read -n 1
