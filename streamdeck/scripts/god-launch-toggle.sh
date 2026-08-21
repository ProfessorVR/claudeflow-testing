#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd

if tmux has-session -t god-agent 2>/dev/null; then
  echo "========================================="
  echo "  GOD AGENT — STOPPING ALL SERVICES"
  echo "========================================="
  echo ""
  scripts/god-launch stop 2>&1
  echo ""
  echo "========================================="
  echo "  All services stopped."
  echo "========================================="
else
  echo "========================================="
  echo "  GOD AGENT — LAUNCHING ALL SERVICES"
  echo "========================================="
  echo ""
  scripts/god-launch start 2>&1
  echo ""
  echo "========================================="
  echo "  All services launched."
  echo "========================================="
fi
god_wait
