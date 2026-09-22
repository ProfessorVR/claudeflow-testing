#!/bin/bash
# probe_remote.sh — runs ON THE MAC in one ssh session (for flapping-network windows).
# Read-only except: attaches the engine sparsebundle if absent; copies nothing.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
echo "== $(date) uptime: $(uptime)"
echo "== pmset:"; pmset -g 2>/dev/null | grep -i 'sleep\|lidwake\|womp\|powernap\|SleepDisabled' | head -8
echo "== lid/power:"; pmset -g batt | head -2
echo "== /Volumes:"; ls -la /Volumes/
echo "== external disks:"; diskutil list external physical 2>&1 | head -30
echo "== KingLab:"; ls /Volumes/KingLab 2>&1 | head
if [ ! -d /Volumes/UnrealEngine/UE_5_4_1 ]; then
  if [ -e /Volumes/KingLab/UnrealEngine.sparsebundle ]; then
    echo "== attaching sparsebundle"; hdiutil attach /Volumes/KingLab/UnrealEngine.sparsebundle 2>&1 | tail -3
  else
    echo "!! sparsebundle path missing — KingLab not mounted"
  fi
fi
echo "== engine/project:"; ls -d /Volumes/UnrealEngine/UE_5_4_1 /Volumes/UnrealEngine/Unreal_Projects/awsTutorial/Packaged/Mac/awsTutorial.app 2>&1
echo "== /tmp scripts:"; ls -la /tmp/voice_log_*.sh /tmp/voice-*.log 2>&1 | head
echo "== top cpu:"; ps -eo pid,pcpu,comm | sort -k2 -nr | head -5
echo "== END $(date)"
