#!/bin/bash
# perf_run.sh <label> <local .sav to use> "<extra game args>" - one uncapped CSV profiling run on CHIMERA (25-dev copy):
# moves the previous run's Profiling/Logs aside, installs the save, runs 100 s in the foreground, fetches the CSV
# to /tmp/gfx_perf/<label>.csv and prints the headline numbers.
set -u
GAMEFOLDER="${GAMEFOLDER:-awsTutorial-25-dev}"   # folder under C:/Users/Dalton/Downloads
LABEL="$1"; SAV="$2"; EXTRA="${3:-}"
H=dalton@192.168.50.243
W=/tmp/gfx_perf
B="C:/Users/Dalton/Downloads/${GAMEFOLDER}/awsTutorial/Saved"
printf '%s\n' "S=/mnt/c/Users/Dalton/Downloads/${GAMEFOLDER}/awsTutorial/Saved" \
  "mkdir -p /mnt/c/Users/Dalton/gfx_test/prev_$LABEL && mv \"\$S/Profiling\" \"\$S/Logs\" /mnt/c/Users/Dalton/gfx_test/prev_$LABEL/ 2>/dev/null; mkdir -p \"\$S/SaveGames/Settings\"; true" \
  | ssh -o BatchMode=yes $H "wsl -e bash -s" >/dev/null 2>&1
scp -q -o BatchMode=yes "$SAV" "$H:$B/SaveGames/Settings/MyOptions.sav"
ARGS="/Game/FirstPerson/Maps/FirstPersonMap -NoGraphicsAutoTune -csvCaptureFrames=4000 -csvGpuStats -csvStatCounts $EXTRA"
ESC=${ARGS//\"/\\\"}
ssh -o BatchMode=yes $H "powershell -NoProfile -ExecutionPolicy Bypass -File C:\\Users\\Dalton\\gfx_test\\run_game_test.ps1 -GameDir C:\\Users\\Dalton\\Downloads\\${GAMEFOLDER} -GameArgs \"$ESC\" -Seconds 100 -Foreground" 2>&1 | tr -d '\r' | tail -1
F=$(ssh -o BatchMode=yes $H "dir /b C:\\Users\\Dalton\\Downloads\\${GAMEFOLDER}\\awsTutorial\\Saved\\Profiling\\CSV" 2>/dev/null | tr -d '\r' | head -1)
scp -q -o BatchMode=yes "$H:$B/Profiling/CSV/$F" "$W/$LABEL.csv"
FG=$(printf '%s\n' 'awk "{print \$4}" /mnt/c/Users/Dalton/gfx_test/fg_log.txt | sort | uniq -c | tr "\n" " "' | ssh -o BatchMode=yes $H "wsl -e bash -s" 2>/dev/null | tr -d '\r')
echo "== $LABEL (foreground: $FG)"
python3 "$(dirname "$0")/csv_summary.py" "$W/$LABEL.csv" 2>/dev/null | grep -E "^  (FrameTime|GameThreadTime|RenderThreadTime|RHIThreadTime|GPUTime|RHI/DrawCalls) "
python3 "$(dirname "$0")/csv_summary.py" "$W/$LABEL.csv" 2>/dev/null | grep -E "RenderLighting|DrawCall/Lights|DrawCall/Basepass|DrawCall/BeginOcclusionTests|RDGCount/Passes|LightCount/(All|Unbatched)$" | sort -u
