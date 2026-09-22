#!/bin/bash
# apply_highdpi.sh <project dir>
# Adds bAllowHighDPIInGameMode=True (+ comment) right after DesignScreenSize= in the project's
# [/Script/Engine.UserInterfaceSettings] block of Config/DefaultEngine.ini, keeping the file's line endings.
# Idempotent: does nothing if the key is already present. Back up first (backup_graphics_autotune.sh).
set -eu
PROJ="${1:?usage: apply_highdpi.sh <project dir>}"
F="$PROJ/Config/DefaultEngine.ini"
grep -q '^bAllowHighDPIInGameMode=' "$F" && { echo "already present"; grep -n 'bAllowHighDPIInGameMode' "$F"; exit 0; }
grep -q '^DesignScreenSize=(X=1920,Y=1080)' "$F" || { echo "anchor DesignScreenSize line not found"; exit 1; }
if grep -q $'\r$' "$F"; then EOL=$'\r'; else EOL=''; fi
TMP="$F.tmp.$$"
awk -v eol="$EOL" '
  { print }
  /^DesignScreenSize=\(X=1920,Y=1080\)/ && !done {
    print "; 2026-09-18: render at the display'"'"'s real pixel resolution (without this the game is DPI-unaware: Windows" eol
    print "; stretches a scaled-down image, e.g. 1707x1067 on a 2560x1600 150% panel; macOS also needs NSHighResolutionCapable)." eol
    print "bAllowHighDPIInGameMode=True" eol
    done = 1
  }' "$F" > "$TMP"
mv "$TMP" "$F"
grep -n -B1 -A1 'bAllowHighDPIInGameMode' "$F"
