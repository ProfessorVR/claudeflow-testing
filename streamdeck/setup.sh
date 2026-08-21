#!/bin/bash
# God Agent Stream Deck v2 — WSL2 Setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "  GOD AGENT STREAM DECK v2 SETUP (WSL2)"
echo "========================================="

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/scripts/*.sh
chmod +x "$SCRIPT_DIR"/scripts/feedback/*.sh
echo "✓ Scripts made executable"

# Check God Agent installation
source "$SCRIPT_DIR/scripts/_common.sh"
if [ -d "$GOD_AGENT_DIR" ]; then
  echo "✓ God Agent found at: $GOD_AGENT_DIR"
else
  echo "⚠ God Agent not found at: $GOD_AGENT_DIR"
  echo "  Edit streamdeck/scripts/_common.sh to set GOD_AGENT_DIR"
fi

# Check Node.js
if command -v node &>/dev/null; then
  echo "✓ Node.js: $(node --version)"
else
  echo "⚠ Node.js not found on PATH"
fi

# Check npx/tsx
if command -v npx &>/dev/null; then
  echo "✓ npx available"
else
  echo "⚠ npx not found"
fi

# Check Windows interop
POWERSHELL_EXE=$(command -v powershell.exe 2>/dev/null || echo "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe")
if [ -x "$POWERSHELL_EXE" ]; then
  echo "✓ PowerShell interop available ($POWERSHELL_EXE)"
else
  echo "⚠ powershell.exe not found — clipboard and toast features will not work"
fi

echo ""
echo "Stream Deck Layout — Page 1 (Main):"
echo ""
echo "  ┌──────────┬──────────┬──────────┬──────────┬──────────┐"
echo "  │ STATUS   │   ASK    │   CODE   │ RESEARCH │  WRITE   │"
echo "  │ (API*)   │ (intctv) │ (intctv) │ (intctv) │ (intctv) │"
echo "  ├──────────┼──────────┼──────────┼──────────┼──────────┤"
echo "  │  LEARN   │  QUERY   │ PDF SCAN │ COMPLETE │ FEEDBACK │"
echo "  │  (bkgd)  │ (intctv) │ (intctv) │ (intctv) │ (folder) │"
echo "  ├──────────┼──────────┼──────────┼──────────┼──────────┤"
echo "  │  START   │   STOP   │   DASH   │  ABORT   │ PAGE 2 → │"
echo "  │  (bkgd)  │  (bkgd)  │ (weblink)│  (bkgd)  │ (folder) │"
echo "  └──────────┴──────────┴──────────┴──────────┴──────────┘"
echo ""
echo "Stream Deck Layout — Page 2 (Research & Learning):"
echo ""
echo "  ┌──────────┬──────────┬──────────┬──────────┬──────────┐"
echo "  │ LOCAL    │ GROUNDED │ HYBRID   │ SYNTH    │ STYLE    │"
echo "  │ RESEARCH │ RESEARCH │ RESEARCH │ CHAPTERS │ STATUS   │"
echo "  ├──────────┼──────────┼──────────┼──────────┼──────────┤"
echo "  │ LEARN    │ LEARN    │ LEARN    │ CODE     │ SITREP   │"
echo "  │ UPDATE   │ COMPILE  │ VERIFY   │ PIPELINE │          │"
echo "  ├──────────┼──────────┼──────────┼──────────┼──────────┤"
echo "  │ANALYTICS │  COSTS   │ QUALITY  │ SVC STAT │ ← PAGE 1 │"
echo "  └──────────┴──────────┴──────────┴──────────┴──────────┘"
echo ""
echo "Execution Modes:"
echo "  (intctv)  = Opens in Windows Terminal tab"
echo "  (bkgd)    = Runs silently, result via toast notification"
echo "  (weblink) = Opens in browser (native Stream Deck Website action)"
echo "  (folder)  = Opens sub-page with preset buttons"
echo "  (API*)    = Dynamic icon via BarRaider API Ninja polling /api/health"
echo ""
echo "Stream Deck Button Configuration:"
echo "  Interactive: wt.exe -p \"God Agent\" wsl -e $SCRIPT_DIR/scripts/<script>.sh"
echo "  Background:  wsl.exe -e $SCRIPT_DIR/scripts/<script>.sh"
echo "  Dashboard:   http://localhost:3847 (Website action)"
echo ""
echo "========================================="
echo "Setup complete!"
