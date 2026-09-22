#!/bin/bash
# build_mac_editor.sh - ON THE MAC. Builds the awsTutorial EDITOR target (SOP §8d / §11h-3 L2: the cook
# runs as the editor). Survives SSH disconnects; log /tmp/evc_build_mac_editor.log (ends with BUILD_EXIT=).
ENGINE=/Volumes/UnrealEngine/UE_5_4_1
UPROJECT=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/awsTutorial.uproject
LOG=/tmp/evc_build_mac_editor.log
: > "$LOG"
nohup bash -c "cd '$ENGINE' && caffeinate -dimsu Engine/Build/BatchFiles/Mac/Build.sh awsTutorialEditor Mac Development -project='$UPROJECT' -MaxParallelActions=6 >> '$LOG' 2>&1; echo BUILD_EXIT=\$? >> '$LOG'" </dev/null >/dev/null 2>&1 &
echo "started pid $! ; log $LOG"
