#!/bin/bash
# Stream Deck MCP — Generate Windows .bat wrappers for all God Agent scripts
# Each .bat calls the corresponding WSL script via wt.exe (interactive) or wsl.exe (background)

set -euo pipefail

SCRIPTS_DIR="/mnt/c/Users/Dalton/StreamDeckScripts"
WSL_SCRIPTS="/home/dalton/projects/claudeflow-testing/streamdeck/scripts"

mkdir -p "$SCRIPTS_DIR"

create_wrapper() {
  local script_name="$1"
  local mode="$2"  # "interactive" or "background"
  local bat_path="$SCRIPTS_DIR/${script_name}.bat"

  if [ "$mode" = "interactive" ]; then
    printf '@echo off\r\nwt.exe -p "God Agent" wsl -e %s/%s.sh\r\n' "$WSL_SCRIPTS" "$script_name" > "$bat_path"
  else
    printf '@echo off\r\nwsl.exe -e %s/%s.sh\r\n' "$WSL_SCRIPTS" "$script_name" > "$bat_path"
  fi
}

echo "=== Creating .bat wrappers in $SCRIPTS_DIR ==="

# Interactive commands (open Windows Terminal)
for s in god-ask god-code god-research god-write god-query god-pdf-analyze \
         god-complete-section god-sitrep god-status god-research-local \
         god-research-grounded god-research-hybrid god-synthesize-chapters \
         god-code-pipeline god-style-status; do
  create_wrapper "$s" interactive
done

# Background commands (silent, toast notify)
# Service start/stop need interactive mode (terminal output, god_wait)
for s in god-launch-start god-launch-stop; do
  create_wrapper "$s" interactive
done

# Background commands (silent, toast notify)
for s in god-learn god-abort-pipeline \
         god-costs god-analytics god-quality god-learn-compile \
         god-learn-verify god-learn-update god-sona-kill god-ucm-flush \
         god-launch-status; do
  create_wrapper "$s" background
done

# Feedback presets (background)
for s in feedback-perfect feedback-good feedback-meh feedback-poor feedback-fail; do
  # Feedback scripts are in a subfolder
  bat_path="$SCRIPTS_DIR/${s}.bat"
  printf '@echo off\r\nwsl.exe -e %s/feedback/%s.sh\r\n' "$WSL_SCRIPTS" "$s" > "$bat_path"
done

# Dashboard (opens browser directly — no WSL needed)
printf '@echo off\r\nstart http://localhost:3847\r\n' > "$SCRIPTS_DIR/god-dashboard.bat"

COUNT=$(ls "$SCRIPTS_DIR"/*.bat 2>/dev/null | wc -l)
echo "Created $COUNT wrapper scripts"
ls "$SCRIPTS_DIR"/*.bat
