#!/bin/bash
# Stream Deck MCP Integration — Smoke Test
# Verifies all components are correctly installed and configured.
set -uo pipefail

GOD_AGENT_DIR="/home/dalton/projects/claudeflow-testing"
PROFILES_ROOT="/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/ProfilesV3"
MCP_PROFILE="$PROFILES_ROOT/19BBCADB-65EE-484C-86CF-5EA0AE391361.sdProfile"
SCRIPTS_DIR="/mnt/c/Users/Dalton/StreamDeckScripts"

PASS=0
FAIL=0
WARN=0

check() {
  local label="$1"
  shift
  if eval "$@" >/dev/null 2>&1; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    ((FAIL++))
  fi
}

warn() {
  local label="$1"
  shift
  if eval "$@" >/dev/null 2>&1; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  WARN: $label"
    ((WARN++))
  fi
}

echo "=== Stream Deck MCP — Smoke Test ==="
VERSION=$(cat "$GOD_AGENT_DIR/streamdeck/VERSION" 2>/dev/null || echo "unknown")
echo "Integration Version: $VERSION"
echo ""

echo "--- Phase 1: MCP Servers ---"
check ".mcp.json has streamdeck server" \
  "python3 -c \"import json; assert 'streamdeck' in json.load(open('$GOD_AGENT_DIR/.mcp.json'))['mcpServers']\""
check ".mcp.json has elgato server" \
  "python3 -c \"import json; assert 'elgato' in json.load(open('$GOD_AGENT_DIR/.mcp.json'))['mcpServers']\""
check "streamdeck-mcp Python package installed" \
  "pip3 show streamdeck-mcp"
check "sseclient-py installed" \
  "python3 -c 'import sseclient'"
check "Pillow installed" \
  "python3 -c 'from PIL import Image'"
warn "@elgato/mcp-server npm package cached" \
  "ls ~/.npm/_npx/*/node_modules/@elgato/mcp-server 2>/dev/null | head -1"

echo ""
echo "--- Phase 2: Profile & Actions ---"
check "MCP Actions profile exists" \
  "test -d '$MCP_PROFILE'"
check "Profile has 4 pages" \
  "python3 -c \"import json; d=json.load(open('$MCP_PROFILE/manifest.json')); assert len(d['Pages']['Pages']) == 4\""
check "Page 1 (DEFAULT) has actions" \
  "python3 -c \"import json; d=json.load(open('$MCP_PROFILE/Profiles/A71FFA10-6F33-44D3-8F05-5092296E590E/manifest.json')); assert d['Controllers'][0]['Actions'] is not None\""
check "Page 2 (PIPELINE-ACTIVE) has actions" \
  "python3 -c \"import json; d=json.load(open('$MCP_PROFILE/Profiles/53F7B969-F208-4A72-AB07-8056462AF932/manifest.json')); assert d['Controllers'][0]['Actions'] is not None\""
check "StreamDeckScripts has .bat wrappers" \
  "test -f '$SCRIPTS_DIR/god-ask.bat'"
check "StreamDeckScripts has 30+ wrappers" \
  "test \$(ls '$SCRIPTS_DIR'/*.bat 2>/dev/null | wc -l) -ge 30"
check "Static icons generated" \
  "test \$(ls '$GOD_AGENT_DIR/streamdeck/icons/'*.png 2>/dev/null | wc -l) -ge 30"
check "Page UUID mapping exists" \
  "test -f '$GOD_AGENT_DIR/streamdeck/mcp-page-uuids.json'"

echo ""
echo "--- Phase 3: SSE Watcher ---"
check "SSE watcher script exists" \
  "test -f '$GOD_AGENT_DIR/streamdeck/scripts/mcp-sse-watcher.py'"
check "god-launch-start.sh has watcher startup" \
  "grep -q 'mcp-sse-watcher' '$GOD_AGENT_DIR/streamdeck/scripts/god-launch-start.sh'"
check "god-launch-stop.sh has watcher cleanup" \
  "grep -q 'streamdeck-watcher.pid' '$GOD_AGENT_DIR/streamdeck/scripts/god-launch-stop.sh'"
warn "Observability server reachable" \
  "curl -s --max-time 2 http://localhost:3847/api/health"
warn "SSE watcher running (PID file)" \
  "test -f '$GOD_AGENT_DIR/.run/streamdeck-watcher.pid' && kill -0 \$(cat '$GOD_AGENT_DIR/.run/streamdeck-watcher.pid') 2>/dev/null"

echo ""
echo "--- Phase 4: Hooks ---"
check "Mode switch hook exists" \
  "test -x '$GOD_AGENT_DIR/.claude/hooks/streamdeck-mode-switch.sh'"
check "settings.json has streamdeck hook" \
  "grep -q 'streamdeck-mode-switch' '$GOD_AGENT_DIR/.claude/settings.json'"
check "settings.json has streamdeck MCP permissions" \
  "grep -q 'mcp__streamdeck__' '$GOD_AGENT_DIR/.claude/settings.json'"
check "Mode state file writable" \
  "mkdir -p '$GOD_AGENT_DIR/.god-agent' && echo 'default' > '$GOD_AGENT_DIR/.god-agent/streamdeck-mode'"

echo ""
echo "--- General ---"
check "VERSION file exists" \
  "test -f '$GOD_AGENT_DIR/streamdeck/VERSION'"
warn "Backup exists" \
  "ls '$GOD_AGENT_DIR/backups/streamdeck-mcp-'* >/dev/null 2>&1"
check "New scripts: god-sona-kill.sh" \
  "test -x '$GOD_AGENT_DIR/streamdeck/scripts/god-sona-kill.sh'"
check "New scripts: god-ucm-flush.sh" \
  "test -x '$GOD_AGENT_DIR/streamdeck/scripts/god-ucm-flush.sh'"

echo ""
echo "=== Results: $PASS passed, $FAIL failed, $WARN warnings ==="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
