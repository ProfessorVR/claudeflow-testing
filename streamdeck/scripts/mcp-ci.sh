#!/bin/bash
# Stream Deck MCP — CI-like validation wrapper
# Run after any change to pipelines, SSE, MCP config, or scripts.
# Usage: bash streamdeck/scripts/mcp-ci.sh
set -uo pipefail

GOD_AGENT_DIR="/home/dalton/projects/claudeflow-testing"

echo "╔══════════════════════════════════════════╗"
echo "║  Stream Deck MCP — CI Validation Suite   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Step 1: Fresh backup
echo ">>> Step 1: Backup"
bash "$GOD_AGENT_DIR/streamdeck/scripts/mcp-backup.sh" 2>&1 | tail -3
echo ""

# Step 2: Smoke test
echo ">>> Step 2: Smoke Test"
bash "$GOD_AGENT_DIR/streamdeck/scripts/mcp-smoke-test.sh"
SMOKE_EXIT=$?
echo ""

# Summary
if [ "$SMOKE_EXIT" -eq 0 ]; then
  echo "══════════════════════════════════"
  echo "  CI RESULT: ALL CHECKS PASSED"
  echo "══════════════════════════════════"
else
  echo "══════════════════════════════════"
  echo "  CI RESULT: FAILURES DETECTED"
  echo "══════════════════════════════════"
fi

exit $SMOKE_EXIT
