#!/bin/bash
# Stream Deck MCP — PostToolUse hook for automatic page navigation
# Detects pipeline state transitions and switches the AI Stream Deck page.
#
# Transitions:
#   Pipeline start  → Page 2 (pipeline-active)
#   Pipeline complete → Page 4 (review)
#   /god-research   → Page 3 (research)
#
# Respects manual overrides and mode lock.
# All curl calls use --max-time 2 to avoid stalling PostToolUse.

ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
[ -z "$ROOT" ] && exit 0

MODE_FILE="$ROOT/.god-agent/streamdeck-mode"
mkdir -p "$ROOT/.god-agent"

# Read current mode
CURRENT_MODE=$(cat "$MODE_FILE" 2>/dev/null || echo "default")

# If locked, do nothing
[ "$CURRENT_MODE" = "locked" ] && exit 0

# Read hook input (tool output)
INPUT=$(cat 2>/dev/null || true)

# Detect pipeline start
if echo "$INPUT" | grep -qi "PIPELINE MODE ACTIVATED\|pipeline_started\|Pipeline Task #\|god-code pipeline mode"; then
  if [ "$CURRENT_MODE" != "pipeline-active" ]; then
    echo "pipeline-active" > "$MODE_FILE"
  fi
fi

# Detect pipeline complete
if echo "$INPUT" | grep -qi "pipeline.*complete\|Pipeline completed\|god-code pipeline mode cleared\|pipeline.*success"; then
  if [ "$CURRENT_MODE" = "pipeline-active" ]; then
    echo "review" > "$MODE_FILE"
  fi
fi

# Detect research mode
if echo "$INPUT" | grep -qi "god-research\|/god-research"; then
  if [ "$CURRENT_MODE" = "default" ]; then
    echo "research" > "$MODE_FILE"
  fi
fi

exit 0
