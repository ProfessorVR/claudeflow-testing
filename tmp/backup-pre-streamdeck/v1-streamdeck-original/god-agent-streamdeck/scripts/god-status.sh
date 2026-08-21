#!/bin/bash
# God Agent - Status Check
# Stream Deck Button: STATUS

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

echo "========================================="
echo "  GOD AGENT - SYSTEM STATUS"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts status
echo "========================================="
echo "Press any key to close..."
read -n 1
