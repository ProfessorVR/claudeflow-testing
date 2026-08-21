#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
SITREP_FILE="tmp/sitrep-$(date +%Y%m%d-%H%M%S).md"
echo "# SITREP — $(date -Iseconds)" > "$SITREP_FILE"
echo "" >> "$SITREP_FILE"
echo "## Git Status" >> "$SITREP_FILE"
git status --short >> "$SITREP_FILE" 2>&1
echo "" >> "$SITREP_FILE"
echo "## Recent Commits" >> "$SITREP_FILE"
git log --oneline -10 >> "$SITREP_FILE" 2>&1
echo "" >> "$SITREP_FILE"
echo "## Service Status" >> "$SITREP_FILE"
curl -s http://localhost:3847/api/health >> "$SITREP_FILE" 2>&1 || echo "Services not running" >> "$SITREP_FILE"
god_toast "SITREP" "Written to $SITREP_FILE"
