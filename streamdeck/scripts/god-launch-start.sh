#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
echo "========================================="
echo "  GOD AGENT — LAUNCHING ALL SERVICES"
echo "========================================="
echo ""
scripts/god-launch start 2>&1
echo ""

# Start Stream Deck MCP SSE watcher (background)
if [ -f "$GOD_AGENT_DIR/streamdeck/scripts/mcp-sse-watcher.py" ]; then
  echo "Starting Stream Deck SSE watcher..."
  nohup python3 "$GOD_AGENT_DIR/streamdeck/scripts/mcp-sse-watcher.py" \
    > "$GOD_AGENT_DIR/logs/streamdeck-sse-watcher.log" 2>&1 &
  echo $! > "$GOD_AGENT_DIR/.run/streamdeck-watcher.pid"
  echo "  PID: $(cat "$GOD_AGENT_DIR/.run/streamdeck-watcher.pid")"
fi

echo "========================================="
echo "  All services launched."
echo "========================================="
god_wait
