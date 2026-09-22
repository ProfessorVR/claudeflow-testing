#!/bin/bash
# rollback_voice_aec.sh <.../Source/EmbeddedVoiceChat> <backup dir made by apply_voice_aec.sh>
#
# Restores the EmbeddedVoiceChat module source exactly as it was before apply_voice_aec.sh ran:
# removes the files the fix added, extracts the backup tarball, then verifies every source file against
# the backup's md5 manifest (same file set, same content). Rebuild the editor target afterwards, or copy
# the backed-up binaries back (see the backup's README.txt).
#
# No-rebuild alternative: launch the game with -EVCEngineCapture (or set the console variable
# EmbeddedVoiceChat.CaptureBackend=1 in DefaultEngine.ini [ConsoleVariables]) to use the old capture path.
set -u

MOD="${1:?usage: rollback_voice_aec.sh <.../Source/EmbeddedVoiceChat> <backup dir>}"
BK="${2:?usage: rollback_voice_aec.sh <.../Source/EmbeddedVoiceChat> <backup dir>}"
MOD="$(cd "$MOD" && pwd)" || exit 2
BK="$(cd "$BK" && pwd)" || exit 2

md5of() { if command -v md5sum >/dev/null 2>&1; then md5sum "$1" | cut -d' ' -f1; else md5 -q "$1"; fi; }
manifest() { (cd "$1" && find . -type f \( -name '*.cpp' -o -name '*.h' -o -name '*.cs' \) | LC_ALL=C sort | while read -r f; do echo "$(md5of "$f")  $f"; done); }

[ -f "$BK/EmbeddedVoiceChat-source.tar.gz" ] && [ -f "$BK/MANIFEST.md5" ] || { echo "!! not a voice-aec backup: $BK"; exit 2; }
[ -f "$MOD/EmbeddedVoiceChat.Build.cs" ] || { echo "!! not the EmbeddedVoiceChat module: $MOD"; exit 2; }
tar tzf "$BK/EmbeddedVoiceChat-source.tar.gz" >/dev/null || { echo "!! backup tarball unreadable"; exit 2; }

ADDED=(Private/AEC/EVCCaptureCore.h Private/AEC/EVCCaptureCore.cpp Private/AEC/EVCAECCaptureStream.h Private/AEC/EVCAECCaptureStream.cpp
       Private/Mac/EVCCaptureCore_Mac.cpp Private/Windows/EVCCaptureCore_Windows.cpp)
for f in "${ADDED[@]}"; do
  # keep a file only if the backup itself contains it (i.e. it predates this backup)
  if ! grep -q "  ./$f\$" "$BK/MANIFEST.md5"; then rm -f "$MOD/$f"; fi
done
for d in Private/AEC Private/Mac Private/Windows; do rmdir "$MOD/$d" 2>/dev/null; done

tar xzf "$BK/EmbeddedVoiceChat-source.tar.gz" -C "$MOD/.." || { echo "!! extract failed"; exit 3; }

if diff <(manifest "$MOD") "$BK/MANIFEST.md5" >/dev/null; then
  echo "== ROLLED BACK: module source identical to $BK/MANIFEST.md5 ($(wc -l < "$BK/MANIFEST.md5" | tr -d ' ') files)"
  echo "   next: rebuild the editor target (and repackage), or restore binaries per $BK/README.txt"
else
  echo "!! module source does NOT match the backup manifest:"
  diff <(manifest "$MOD") "$BK/MANIFEST.md5"
  exit 4
fi
