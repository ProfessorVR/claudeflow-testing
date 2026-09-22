#!/bin/bash
# verify_build41.sh - ON THE MAC. Build-41 checks on both packaged apps: the engine's operator new/delete must no longer
# be exported (0), the OS-read insets code must be compiled in, the macOS-26 voice gate text must be gone.
# UE_LOG text is UTF-16 in the binary, so those strings are counted with the perl trick, not `strings`.
P=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial
u16count() { perl -0777 -ne 'my $w=join("\0", split(//, $ENV{W}))."\0"; my $n=()=/\Q$w\E/g; print $n' "$1"; }
for A in "$P/Packaged/Mac/awsTutorial.app" "$P/Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app"; do
  X="$A/Contents/MacOS/$(ls "$A/Contents/MacOS" | head -1)"
  echo "== $X"
  echo "  exported operator new/delete (want 0): $(nm -gU "$X" | grep -c -E ' __Z[nd][aw]')"
  echo "  operator new/delete still defined inside (want >0): $(nm -U "$X" | grep -c -E ' __Z[nd][aw]')"
  echo "  'macOS insets' log text, UTF-16 (want 1): $(W='macOS insets' u16count "$X")"
  echo "  macOS-26 gate text, UTF-16 (want 0): $(W='macOS 26 or newer' u16count "$X")"
  echo "  GetMacDisplayInsetsPx symbol (want >=1): $(nm "$X" | grep -c GetMacDisplayInsetsPx)"
  echo "  VoiceProcessingIO back-end name present (want >=1): $(strings -a "$X" | grep -c 'VoiceProcessingIO')"
  echo "  md5: $(md5 -q "$X")"
done
echo "-- UBT logs (newest first):"
ls -t "$HOME/Library/Logs/Unreal Engine/LocalBuildLogs/" | head -4
L=$(ls -t "$HOME/Library/Logs/Unreal Engine/LocalBuildLogs/"*.txt | head -1)
echo "-- newest UBT log: $L"
echo "  MacDisplayInsets mentions: $(grep -c 'MacDisplayInsets' "$L")"
echo "  linker option: $(grep -o -E 'unexported_symbols_list,[^ "]+' "$L" | sort -u | head -1)"
echo VERIFY41_DONE
