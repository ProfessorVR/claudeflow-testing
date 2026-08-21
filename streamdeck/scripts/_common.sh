#!/bin/bash
# God Agent Stream Deck — Common utilities (WSL2)
export GOD_AGENT_DIR="/home/dalton/projects/claudeflow-testing"

# Ensure Node.js is on PATH (nvm support)
if [ -d "$HOME/.nvm/versions/node" ]; then
  export PATH="$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node/" | sort -V | tail -1)/bin:$PATH"
fi

# Ensure pyenv is on PATH (vLLM, Python tools)
if [ -d "$HOME/.pyenv" ]; then
  export PYENV_ROOT="$HOME/.pyenv"
  export PATH="$PYENV_ROOT/bin:$PYENV_ROOT/shims:$PATH"
fi

# Resolve powershell.exe (PATH may not include Windows dirs in non-interactive shells)
_POWERSHELL=$(command -v powershell.exe 2>/dev/null || echo "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe")
[ ! -x "$_POWERSHELL" ] && _POWERSHELL=""

# Navigate to project directory
god_cd() { cd "$GOD_AGENT_DIR" || { echo "ERROR: $GOD_AGENT_DIR not found"; exit 1; }; }

# Get input: clipboard first, then terminal prompt
# Use for interactive commands only (ask, write, research, code)
god_input() {
  local prompt="${1:-Enter input}"
  local input
  input=$($_POWERSHELL -NoProfile -Command "Get-Clipboard" 2>/dev/null | tr -d '\r\n')
  if [ -n "$input" ]; then
    echo "[Clipboard] $input" >&2
  else
    read -r -p "$prompt: " input
  fi
  echo "$input"
}

# Get clipboard content only (for background scripts like feedback)
god_clipboard() {
  [ -z "$_POWERSHELL" ] && return 1
  $_POWERSHELL -NoProfile -Command "Get-Clipboard" 2>/dev/null | tr -d '\r\n'
}

# Send Windows toast notification (for background commands)
# Requires: Install-Module -Name BurntToast (PowerShell)
god_toast() {
  local title="${1:-God Agent}"
  local message="${2:-Done}"
  [ -z "$_POWERSHELL" ] && return 0
  $_POWERSHELL -NoProfile -Command \
    "New-BurntToastNotification -Text '$title','$message'" 2>/dev/null &
}

# Open URL in Windows default browser
god_open() { explorer.exe "$1" 2>/dev/null || wslview "$1" 2>/dev/null; }

# Wait for keypress before closing (interactive commands only)
god_wait() {
  echo ""
  read -n 1 -s -r -p "Press any key to close..."
}

# Create pipeline abort sentinel
god_abort() {
  touch "$GOD_AGENT_DIR/.god-agent/abort-pipeline"
  god_toast "God Agent" "Abort signal sent — pipeline will stop at next stage boundary"
}
