#!/bin/bash
# apply_autotune_src.sh <project dir>
# Installs the staged auto-tuner sources (graphics-autotune/src, every file under it) into <project>/Source/awsTutorial
# and adds the module dependencies it needs to awsTutorial.Build.cs. Keeps each file's line-ending convention (the
# module's Build.cs decides: CRLF or LF). Idempotent. Back up first (backup_step.sh). Portable: macOS (BSD tools) and
# Linux/WSL — line endings are converted with tr/perl, never with sed's '\r', which BSD sed does not understand
# (2026-09-21 review finding).
set -eu
PROJ="${1:?usage: apply_autotune_src.sh <project dir>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MOD="$PROJ/Source/awsTutorial"
BUILD="$MOD/awsTutorial.Build.cs"
[ -f "$BUILD" ] || { echo "module not found: $MOD"; exit 1; }
[ -d "$HERE/src" ] || { echo "no src/ beside $0"; exit 1; }

if grep -q $'\r$' "$BUILD"; then CRLF=1; else CRLF=0; fi
# Mac/MacDisplayInsets.mm (2026-09-21) lives in a Mac/ folder: UBT leaves platform-named folders out of other
# platforms' builds, so the Windows copy carries it without compiling it.
n=0
while IFS= read -r f; do
  mkdir -p "$MOD/$(dirname "$f")"
  if [ "$CRLF" = 1 ]; then tr -d '\r' < "$HERE/src/$f" | perl -pe 's/\n/\r\n/' > "$MOD/$f"
  else tr -d '\r' < "$HERE/src/$f" > "$MOD/$f"; fi
  echo "installed $MOD/$f"; n=$((n+1))
done < <(cd "$HERE/src" && find . -type f ! -name '.DS_Store' ! -name '._*' | sed 's|^\./||' | sort)   # ._* = AppleDouble sidecars from an ExFAT copy
[ "$n" -gt 0 ] || { echo "no source files under $HERE/src"; exit 1; }

if grep -q 'GraphicsAutoTune' "$BUILD"; then
  echo "Build.cs already has the auto-tune dependencies"
else
  EOL=''; [ "$CRLF" = 1 ] && EOL=$'\r'
  # The anchor must be a complete one-line AddRange(...); statement — inserting after the first line of a multi-line
  # initializer would land inside the array (2026-09-22 review).
  grep -qE 'PublicDependencyModuleNames\.AddRange.*\);[[:space:]]*$' "$BUILD" || { echo "anchor PublicDependencyModuleNames.AddRange(...); is not on one line in $BUILD — add the PrivateDependencyModuleNames line by hand"; exit 1; }
  TMP="$BUILD.tmp.$$"
  awk -v eol="$EOL" '
    { print }
    /PublicDependencyModuleNames\.AddRange.*\);[[:space:]]*\r?$/ && !done {
      print "" eol
      print "\t\t// GraphicsAutoTuneSubsystem (2026-09-18): overlay (Slate), options-menu widgets (UMG), frame timing (RHI," eol
      print "\t\t// RenderCore) and display metrics (ApplicationCore)." eol
      print "\t\tPrivateDependencyModuleNames.AddRange(new string[] { \"Slate\", \"SlateCore\", \"UMG\", \"RHI\", \"RenderCore\", \"ApplicationCore\" });" eol
      done = 1
    }' "$BUILD" > "$TMP"
  grep -q 'GraphicsAutoTune' "$TMP" || { rm -f "$TMP"; echo "anchor PublicDependencyModuleNames.AddRange not found in $BUILD"; exit 1; }
  # awk always ends the last line with \n; keep the original's "no newline at end of file" if that was the case
  if [ -n "$(tail -c1 "$BUILD")" ]; then perl -pi -e 'chomp if eof' "$TMP"; fi
  mv "$TMP" "$BUILD"
  echo "patched $BUILD"
fi
grep -n 'DependencyModuleNames' "$BUILD"
