#!/bin/bash
# Stream Deck MCP Integration — Restore from Backup
# Usage:
#   bash streamdeck/scripts/mcp-restore.sh /path/to/backup
#   bash streamdeck/scripts/mcp-restore.sh --dry-run /path/to/backup
#   bash streamdeck/scripts/mcp-restore.sh --yes /path/to/backup

set -euo pipefail

GOD_AGENT_DIR="/home/dalton/projects/claudeflow-testing"
PROFILES_DST="/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/ProfilesV3"
SD_EXE_NAME="StreamDeck.exe"

DRY_RUN=false
AUTO_YES=false
BACKUP_DIR=""

# Parse args
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes) AUTO_YES=true ;;
    *) BACKUP_DIR="$arg" ;;
  esac
done

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: mcp-restore.sh [--dry-run] [--yes] /path/to/backup"
  echo ""
  echo "Options:"
  echo "  --dry-run   Print what would be restored without writing anything"
  echo "  --yes       Skip confirmation prompt"
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "ERROR: Backup directory not found: $BACKUP_DIR"
  exit 1
fi

if [ ! -f "$BACKUP_DIR/MANIFEST.txt" ]; then
  echo "ERROR: No MANIFEST.txt in $BACKUP_DIR — not a valid backup"
  exit 1
fi

echo "=== Stream Deck MCP — Restore ==="
$DRY_RUN && echo "*** DRY RUN — no changes will be made ***"
echo ""
cat "$BACKUP_DIR/MANIFEST.txt"
echo ""

# Build restore plan
PLAN=""
[ -d "$BACKUP_DIR/streamdeck" ] && PLAN="$PLAN  [WSL] streamdeck/ → $GOD_AGENT_DIR/streamdeck/\n"
[ -f "$BACKUP_DIR/mcp.json" ] && PLAN="$PLAN  [WSL] mcp.json → $GOD_AGENT_DIR/.mcp.json\n"
[ -f "$BACKUP_DIR/claude-settings.json" ] && PLAN="$PLAN  [WSL] claude-settings.json → $GOD_AGENT_DIR/.claude/settings.json\n"
[ -d "$BACKUP_DIR/ProfilesV3" ] && PLAN="$PLAN  [WIN] ProfilesV3/ → $PROFILES_DST/\n"

echo "--- Restore Plan ---"
echo -e "$PLAN"

if ! $AUTO_YES && ! $DRY_RUN; then
  read -r -p "Continue with restore? (y/N) " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
fi

if $DRY_RUN; then
  echo "Dry run complete — no changes made."
  exit 0
fi

# Stop Stream Deck app before touching Windows files
echo ""
echo "[1/5] Stopping Stream Deck app ..."
if cmd.exe /c "tasklist /FI \"IMAGENAME eq $SD_EXE_NAME\"" 2>/dev/null | grep -q "$SD_EXE_NAME"; then
  cmd.exe /c "taskkill /IM $SD_EXE_NAME /F" 2>/dev/null || true
  sleep 2
  echo "       Stopped"
else
  echo "       (not running)"
fi

# Restore WSL-side streamdeck/
echo "[2/5] Restoring WSL streamdeck/ ..."
if [ -d "$BACKUP_DIR/streamdeck" ]; then
  rm -rf "$GOD_AGENT_DIR/streamdeck"
  cp -r "$BACKUP_DIR/streamdeck" "$GOD_AGENT_DIR/streamdeck"
  # Re-apply execute permissions
  chmod +x "$GOD_AGENT_DIR/streamdeck/scripts/"*.sh 2>/dev/null || true
  chmod +x "$GOD_AGENT_DIR/streamdeck/scripts/feedback/"*.sh 2>/dev/null || true
  echo "       Done"
else
  echo "       (not in backup — skipped)"
fi

# Restore .mcp.json
echo "[3/5] Restoring .mcp.json ..."
if [ -f "$BACKUP_DIR/mcp.json" ]; then
  cp "$BACKUP_DIR/mcp.json" "$GOD_AGENT_DIR/.mcp.json"
  echo "       Done"
else
  echo "       (not in backup — skipped)"
fi

# Restore .claude/settings.json
echo "[4/5] Restoring .claude/settings.json ..."
if [ -f "$BACKUP_DIR/claude-settings.json" ]; then
  cp "$BACKUP_DIR/claude-settings.json" "$GOD_AGENT_DIR/.claude/settings.json"
  echo "       Done"
else
  echo "       (not in backup — skipped)"
fi

# Restore Windows ProfilesV3
echo "[5/5] Restoring Windows ProfilesV3 ..."
if [ -d "$BACKUP_DIR/ProfilesV3" ]; then
  rm -rf "$PROFILES_DST"
  cp -r "$BACKUP_DIR/ProfilesV3" "$PROFILES_DST"
  echo "       Done ($(ls -d "$PROFILES_DST/"*.sdProfile 2>/dev/null | wc -l) profiles)"
else
  echo "       (not in backup — skipped)"
fi

# Restart Stream Deck app
echo ""
echo "Restarting Stream Deck app ..."
SD_INSTALL=$(find "/mnt/c/Program Files/Elgato/StreamDeck" -name "$SD_EXE_NAME" 2>/dev/null | head -1)
if [ -z "$SD_INSTALL" ]; then
  SD_INSTALL=$(find "/mnt/c/Program Files (x86)/Elgato/StreamDeck" -name "$SD_EXE_NAME" 2>/dev/null | head -1)
fi
if [ -n "$SD_INSTALL" ]; then
  WIN_PATH=$(echo "$SD_INSTALL" | sed 's|/mnt/c/|C:\\|' | tr '/' '\\')
  cmd.exe /c "start \"\" \"$WIN_PATH\"" 2>/dev/null &
  echo "Stream Deck app restarted."
else
  echo "WARNING: Could not find StreamDeck.exe — please restart manually."
fi

echo ""
echo "=== Restore Complete ==="
