#!/bin/bash
# copy_to_chimera_when_awake.sh <local build folder> <name under Downloads> [minutes to wait]
# Waits for the CHIMERA laptop (DHCP flips it between .243 and .245) to come online, then rsyncs the build
# into C:\Users\Dalton\Downloads\<name> and verifies file count, total bytes and the game-exe md5.
set -u
SRC="${1:?usage: <local build folder> <name> [minutes]}"
NAME="${2:?usage: <local build folder> <name> [minutes]}"
MINUTES="${3:-90}"
DEST="/mnt/c/Users/Dalton/Downloads/$NAME"
deadline=$(( $(date +%s) + MINUTES * 60 ))
HOST=""
while [ "$(date +%s)" -lt "$deadline" ]; do
  for H in 192.168.50.243 192.168.50.245; do
    if timeout 12 ssh -o BatchMode=yes -o ConnectTimeout=6 "dalton@$H" hostname 2>/dev/null | tr -d '\r' | grep -q CHIMERA; then HOST=$H; break 2; fi
  done
  sleep 15
done
[ -n "$HOST" ] || { echo "TIMEOUT: CHIMERA did not come online within $MINUTES min"; exit 1; }
echo "CHIMERA online at $HOST ($(date +%H:%M:%S)); copying $SRC -> Downloads/$NAME"
rsync -rt --rsync-path="wsl rsync" --info=stats1 -e "ssh -o BatchMode=yes" "$SRC/" "dalton@$HOST:$DEST/" 2>&1 | tr -d '\r' | tail -4
LOCAL_FILES=$(find "$SRC" -type f | wc -l); LOCAL_BYTES=$(find "$SRC" -type f -printf '%s\n' | awk '{s+=$1} END {print s}')
EXE_REL=$(cd "$SRC" && find . -name 'awsTutorial*.exe' -path '*Binaries*' | head -1)
LOCAL_MD5=$(md5sum "$SRC/$EXE_REL" | cut -c1-32)
printf 'D=%s\necho "files $(find "$D" -type f | wc -l) bytes $(find "$D" -type f -printf "%%s\\n" | awk "{s+=\\$1} END {print s}")"\nmd5sum "$D/%s" | cut -c1-32\n' "$DEST" "$EXE_REL" \
  | ssh -o BatchMode=yes "dalton@$HOST" "wsl -e bash -s" 2>&1 | tr -d '\r' > /tmp/chimera_verify.$$
REMOTE=$(head -1 /tmp/chimera_verify.$$); REMOTE_MD5=$(sed -n 2p /tmp/chimera_verify.$$); rm -f /tmp/chimera_verify.$$
echo "local : files $LOCAL_FILES bytes $LOCAL_BYTES exe-md5 $LOCAL_MD5"
echo "remote: $REMOTE exe-md5 $REMOTE_MD5"
if [ "$REMOTE" = "files $LOCAL_FILES bytes $LOCAL_BYTES" ] && [ "$REMOTE_MD5" = "$LOCAL_MD5" ]; then
  echo "COPY VERIFIED: C:\\Users\\Dalton\\Downloads\\$NAME\\awsTutorial.exe"
else
  echo "COPY MISMATCH - do not test from this copy"; exit 2
fi
