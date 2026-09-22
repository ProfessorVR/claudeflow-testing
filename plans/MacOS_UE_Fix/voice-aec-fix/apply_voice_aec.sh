#!/bin/bash
# apply_voice_aec.sh <.../Plugins/UltimateMultiplayerServicesPlugin/Source/EmbeddedVoiceChat>
#
# Applies the 2026-09-18 voice-echo fix (echo-cancelling OS capture) from the staged tree next to this
# script (./EmbeddedVoiceChat). Runs on WSL/Linux (GNU tools) and on macOS (BSD tools).
#
# Safety:
#   * refuses unless the three files it replaces are the KNOWN ORIGINALS (md5), or the fix is already
#     applied (then it updates in place, backing up the current state first);
#   * backs up BEFORE touching anything, to <Project>/.backups/voice-aec-<stamp>/ - outside Source/ and
#     Plugins/, so Unreal Build Tool can never pick the copy up as a second module - as a tarball of the
#     whole module, an md5 manifest, and a copy of this module's compiled binaries;
#   * verifies every copied file by md5 afterwards.
# Rollback: rollback_voice_aec.sh <module dir> <backup dir>  (or, without any rebuild, run the game with
# -EVCEngineCapture / set EmbeddedVoiceChat.CaptureBackend=1 to use the old capture path).
set -u

MOD="${1:?usage: apply_voice_aec.sh <.../Source/EmbeddedVoiceChat>}"
MOD="$(cd "$MOD" && pwd)" || exit 2
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/EmbeddedVoiceChat"
STAMP="$(date +%Y%m%dT%H%M%S)"

md5of() { if command -v md5sum >/dev/null 2>&1; then md5sum "$1" | cut -d' ' -f1; else md5 -q "$1"; fi; }
manifest() { (cd "$1" && find . -type f \( -name '*.cpp' -o -name '*.h' -o -name '*.cs' \) | LC_ALL=C sort | while read -r f; do echo "$(md5of "$f")  $f"; done); }

CHANGED=(EmbeddedVoiceChat.Build.cs Public/EmbeddedVoiceChatAudioCapture.h Private/EmbeddedVoiceChatAudioCapture.cpp)
ORIG_MD5=(3af3d95044958e77ae85ad6a7fafcad0 cc770ed1aa393468640a4bdf76cd25df b60ba2bf441df78c5483de10c635df60)
ADDED=(Private/AEC/EVCCaptureCore.h Private/AEC/EVCCaptureCore.cpp Private/AEC/EVCAECCaptureStream.h Private/AEC/EVCAECCaptureStream.cpp
       Private/Mac/EVCCaptureCore_Mac.cpp Private/Windows/EVCCaptureCore_Windows.cpp)

[ -f "$MOD/EmbeddedVoiceChat.Build.cs" ] || { echo "!! not the EmbeddedVoiceChat module: $MOD"; exit 2; }
PLUGIN="$(cd "$MOD/../.." && pwd)"
PROJ="$(cd "$PLUGIN/../.." && pwd)"
ls "$PROJ"/*.uproject >/dev/null 2>&1 || { echo "!! no .uproject at $PROJ"; exit 2; }
for f in "${CHANGED[@]}" "${ADDED[@]}"; do [ -f "$SRC/$f" ] || { echo "!! staged file missing: $SRC/$f"; exit 2; }; done

if grep -q "2026-09-18 voice-echo fix" "$MOD/EmbeddedVoiceChat.Build.cs"; then
  same=1
  for f in "${CHANGED[@]}" "${ADDED[@]}"; do
    if [ ! -f "$MOD/$f" ] || [ "$(md5of "$MOD/$f")" != "$(md5of "$SRC/$f")" ]; then same=0; fi
  done
  if [ "$same" = 1 ]; then echo "== already applied and identical to the staged files - nothing to do"; exit 0; fi
  MODE=update
  echo "== fix already applied but differs from the staged files: updating in place"
else
  for i in 0 1 2; do
    m="$(md5of "$MOD/${CHANGED[$i]}")"
    [ "$m" = "${ORIG_MD5[$i]}" ] || { echo "!! ${CHANGED[$i]} is not the known original (md5 $m) - refusing to overwrite"; exit 3; }
  done
  for f in "${ADDED[@]}"; do [ -e "$MOD/$f" ] && { echo "!! $f already exists - refusing"; exit 3; }; done
  MODE=fresh
  echo "== originals verified (3/3 md5 match)"
fi

BK="$PROJ/.backups/voice-aec-$STAMP"
mkdir -p "$BK/binaries" || exit 4
tar czf "$BK/EmbeddedVoiceChat-source.tar.gz" -C "$MOD/.." EmbeddedVoiceChat || { echo "!! backup tar failed"; exit 4; }
manifest "$MOD" > "$BK/MANIFEST.md5"
for d in "$PLUGIN"/Binaries/*/; do
  [ -d "$d" ] || continue
  sub="$BK/binaries/$(basename "$d")"
  mkdir -p "$sub"
  cp -p "$d"*EmbeddedVoiceChat* "$d"*.modules "$sub"/ 2>/dev/null
done
{
  echo "voice-echo fix backup, $STAMP, mode=$MODE"
  echo "module:  $MOD"
  echo "restore: bash rollback_voice_aec.sh \"$MOD\" \"$BK\""
  echo "then rebuild the editor target (and repackage), or copy binaries/<Platform>/* back into $PLUGIN/Binaries/<Platform>/"
} > "$BK/README.txt"
tar tzf "$BK/EmbeddedVoiceChat-source.tar.gz" >/dev/null || { echo "!! backup tar unreadable"; exit 4; }
echo "== backup: $BK ($(wc -l < "$BK/MANIFEST.md5" | tr -d ' ') source files, binaries: $(find "$BK/binaries" -type f | wc -l | tr -d ' ') files)"

for f in "${CHANGED[@]}" "${ADDED[@]}"; do
  mkdir -p "$(dirname "$MOD/$f")"
  cp "$SRC/$f" "$MOD/$f" || { echo "!! copy failed: $f"; exit 5; }
  [ "$(md5of "$MOD/$f")" = "$(md5of "$SRC/$f")" ] || { echo "!! verify failed: $f"; exit 5; }
  echo "   applied $f"
done
echo "== APPLIED ($MODE). Backup: $BK"
