#!/bin/bash
# God Agent - Learn Writing Style from PDF
# Stream Deck Button: STYLE IN

GOD_AGENT_DIR="${GOD_AGENT_DIR:-$HOME/god-agent-package}"

cd "$GOD_AGENT_DIR" || { echo "ERROR: God Agent not found at $GOD_AGENT_DIR"; exit 1; }

# Open file picker for PDF
PDF_PATH=$(osascript -e 'tell application "System Events" to POSIX path of (choose file with prompt "Select a PDF to learn style from:" of type {"pdf"})' 2>/dev/null)

if [ -z "$PDF_PATH" ]; then
  echo "Cancelled."
  exit 0
fi

echo "========================================="
echo "  GOD AGENT - LEARN STYLE"
echo "  PDF: $PDF_PATH"
echo "========================================="
npx tsx src/god-agent/universal/cli.ts learn-style "$PDF_PATH"
echo "========================================="
echo "Style learned! Press any key to close..."
read -n 1
