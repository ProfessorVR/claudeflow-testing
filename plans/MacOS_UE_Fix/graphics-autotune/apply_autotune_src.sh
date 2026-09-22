#!/bin/bash
# apply_autotune_src.sh <project dir>
# Installs the staged auto-tuner sources (graphics-autotune/src) into <project>/Source/awsTutorial and adds the
# module dependencies it needs to awsTutorial.Build.cs. Keeps each file's line-ending convention (the module uses
# CRLF). Idempotent. Back up first (backup_graphics_autotune.sh).
set -eu
PROJ="${1:?usage: apply_autotune_src.sh <project dir>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MOD="$PROJ/Source/awsTutorial"
BUILD="$MOD/awsTutorial.Build.cs"
[ -f "$BUILD" ] || { echo "module not found: $MOD"; exit 1; }

if grep -q $'\r$' "$BUILD"; then CRLF=1; else CRLF=0; fi
# Mac/MacDisplayInsets.mm (2026-09-21) lives in a Mac/ folder: UBT leaves platform-named folders out of other
# platforms' builds, so the Windows copy carries it without compiling it.
mkdir -p "$MOD/Mac"
for f in GraphicsAutoTuneSubsystem.h GraphicsAutoTuneSubsystem.cpp MacDisplayInsets.h Mac/MacDisplayInsets.mm; do
  if [ "$CRLF" = 1 ]; then sed 's/\r*$/\r/' "$HERE/src/$f" > "$MOD/$f"; else sed 's/\r$//' "$HERE/src/$f" > "$MOD/$f"; fi
  echo "installed $MOD/$f"
done

if grep -q 'GraphicsAutoTune' "$BUILD"; then
  echo "Build.cs already has the auto-tune dependencies"
else
  EOL=''; [ "$CRLF" = 1 ] && EOL=$'\r'
  TMP="$BUILD.tmp.$$"
  awk -v eol="$EOL" '
    { print }
    /PublicDependencyModuleNames\.AddRange/ && !done {
      print "" eol
      print "\t\t// GraphicsAutoTuneSubsystem (2026-09-18): overlay (Slate), options-menu widgets (UMG), frame timing (RHI," eol
      print "\t\t// RenderCore) and display metrics (ApplicationCore)." eol
      print "\t\tPrivateDependencyModuleNames.AddRange(new string[] { \"Slate\", \"SlateCore\", \"UMG\", \"RHI\", \"RenderCore\", \"ApplicationCore\" });" eol
      done = 1
    }' "$BUILD" > "$TMP"
  # awk always ends the last line with \n; keep the original's "no newline at end of file" if that was the case
  if [ -n "$(tail -c1 "$BUILD")" ]; then perl -pi -e 'chomp if eof' "$TMP"; fi
  mv "$TMP" "$BUILD"
  echo "patched $BUILD"
fi
grep -n 'DependencyModuleNames' "$BUILD"
