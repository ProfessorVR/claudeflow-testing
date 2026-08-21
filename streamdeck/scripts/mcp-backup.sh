#!/bin/bash
# Stream Deck MCP Integration — Comprehensive Backup
# Creates a single restore point covering all artifacts the MCP integration touches.
# Usage: bash streamdeck/scripts/mcp-backup.sh

set -euo pipefail

GOD_AGENT_DIR="/home/dalton/projects/claudeflow-testing"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$GOD_AGENT_DIR/backups/streamdeck-mcp-$TIMESTAMP"
PROFILES_SRC="/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/ProfilesV3"
BACKUP_V3_SRC="/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/BackupV3"
SD_LOGS="/mnt/c/Users/Dalton/AppData/Roaming/Elgato/StreamDeck/logs"

echo "=== Stream Deck MCP — Backup ==="
echo "Destination: $BACKUP_DIR"
echo ""

mkdir -p "$BACKUP_DIR"

# 1. WSL-side: streamdeck/ directory
echo "[1/6] Backing up WSL streamdeck/ ..."
cp -r "$GOD_AGENT_DIR/streamdeck/" "$BACKUP_DIR/streamdeck/"
WSL_FILES=$(find "$BACKUP_DIR/streamdeck" -type f | wc -l)
echo "       $WSL_FILES files"

# 2. .mcp.json
echo "[2/6] Backing up .mcp.json ..."
if [ -f "$GOD_AGENT_DIR/.mcp.json" ]; then
  cp "$GOD_AGENT_DIR/.mcp.json" "$BACKUP_DIR/mcp.json"
else
  echo "       (not found — skipped)"
fi

# 3. .claude/settings.json
echo "[3/6] Backing up .claude/settings.json ..."
if [ -f "$GOD_AGENT_DIR/.claude/settings.json" ]; then
  cp "$GOD_AGENT_DIR/.claude/settings.json" "$BACKUP_DIR/claude-settings.json"
else
  echo "       (not found — skipped)"
fi

# 4. Windows ProfilesV3 (all profiles)
echo "[4/6] Backing up Windows ProfilesV3 ..."
if [ -d "$PROFILES_SRC" ]; then
  cp -r "$PROFILES_SRC" "$BACKUP_DIR/ProfilesV3/"
  PROFILE_COUNT=$(ls -d "$BACKUP_DIR/ProfilesV3/"*.sdProfile 2>/dev/null | wc -l)
  echo "       $PROFILE_COUNT profiles"
else
  echo "       WARNING: ProfilesV3 not found at $PROFILES_SRC"
  PROFILE_COUNT=0
fi

# 5. Windows BackupV3 (Elgato's own backups)
echo "[5/6] Backing up Windows BackupV3 ..."
if [ -d "$BACKUP_V3_SRC" ]; then
  cp -r "$BACKUP_V3_SRC" "$BACKUP_DIR/BackupV3/"
  ELGATO_BACKUPS=$(ls "$BACKUP_DIR/BackupV3/" 2>/dev/null | wc -l)
  echo "       $ELGATO_BACKUPS Elgato backups"
else
  echo "       (not found — skipped)"
  ELGATO_BACKUPS=0
fi

# 6. Gather metadata and write MANIFEST
echo "[6/6] Writing MANIFEST.txt ..."

# Try to extract Stream Deck version from logs
SD_VERSION="unknown"
if [ -f "$SD_LOGS/StreamDeck.json" ]; then
  SD_VERSION=$(grep -o '"version":"[^"]*"' "$SD_LOGS/StreamDeck.json" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "unknown")
  [ -z "$SD_VERSION" ] && SD_VERSION="unknown"
fi

# Read integration VERSION
INTEGRATION_VERSION="unknown"
if [ -f "$GOD_AGENT_DIR/streamdeck/VERSION" ]; then
  INTEGRATION_VERSION=$(cat "$GOD_AGENT_DIR/streamdeck/VERSION")
fi

# List profile UUIDs and names
PROFILE_LIST=""
if [ -d "$BACKUP_DIR/ProfilesV3" ]; then
  for dir in "$BACKUP_DIR/ProfilesV3/"*.sdProfile; do
    [ ! -d "$dir" ] && continue
    uuid=$(basename "$dir")
    name=$(python3 -c "import json; print(json.load(open('$dir/manifest.json'))['Name'])" 2>/dev/null || echo "?")
    model=$(python3 -c "import json; print(json.load(open('$dir/manifest.json'))['Device']['Model'])" 2>/dev/null || echo "?")
    PROFILE_LIST="$PROFILE_LIST  $uuid  $name  ($model)\n"
  done
fi

cat > "$BACKUP_DIR/MANIFEST.txt" <<EOF
=== Stream Deck MCP Backup ===
Timestamp:            $TIMESTAMP
Date:                 $(date '+%Y-%m-%d %H:%M:%S %Z')
Stream Deck Version:  $SD_VERSION
Integration Version:  $INTEGRATION_VERSION

--- File Counts ---
WSL streamdeck/:      $WSL_FILES files
ProfilesV3:           $PROFILE_COUNT profiles
Elgato BackupV3:      $ELGATO_BACKUPS backups
.mcp.json:            $([ -f "$BACKUP_DIR/mcp.json" ] && echo "yes" || echo "no")
.claude/settings.json: $([ -f "$BACKUP_DIR/claude-settings.json" ] && echo "yes" || echo "no")

--- Profiles ---
$(echo -e "$PROFILE_LIST")
--- Restore ---
bash streamdeck/scripts/mcp-restore.sh "$BACKUP_DIR"
bash streamdeck/scripts/mcp-restore.sh --dry-run "$BACKUP_DIR"
EOF

echo ""
echo "=== Backup Complete ==="
cat "$BACKUP_DIR/MANIFEST.txt"
echo ""
echo "Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
