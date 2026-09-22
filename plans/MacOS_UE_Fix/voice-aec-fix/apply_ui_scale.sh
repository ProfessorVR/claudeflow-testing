#!/bin/bash
# apply_ui_scale.sh <project dir> - sets the UI DPI scaling rule to ScaleToFit (design size 1920x1080) in
# Config/DefaultEngine.ini, so the video-player "Procedures"/"Interviews" buttons stay on screen on 16:10 and 3:2
# displays (report: plans/MacOS_UE_Fix/report/video-selector-label-clipping-2026-09-18.md).
# Backs up DefaultEngine.ini first; refuses if a [/Script/Engine.UserInterfaceSettings] section already exists.
# Rollback: copy the backed-up DefaultEngine.ini back (path printed below).
set -u
PROJ="${1:?usage: apply_ui_scale.sh <project dir>}"
INI="$PROJ/Config/DefaultEngine.ini"
md5of() { if command -v md5sum >/dev/null 2>&1; then md5sum "$1" | cut -d' ' -f1; else md5 -q "$1"; fi; }
[ -f "$INI" ] || { echo "!! no $INI"; exit 2; }
if grep -q '^\[/Script/Engine.UserInterfaceSettings\]' "$INI"; then
  if grep -q '^UIScaleRule=ScaleToFit' "$INI"; then echo "== already applied"; exit 0; fi
  echo "!! a UserInterfaceSettings section already exists - refusing to guess; edit by hand"; exit 3
fi
BK="$PROJ/.backups/ui-scale-$(date +%Y%m%dT%H%M%S)"
mkdir -p "$BK" && cp -p "$INI" "$BK/DefaultEngine.ini" || { echo "!! backup failed"; exit 4; }
[ "$(md5of "$INI")" = "$(md5of "$BK/DefaultEngine.ini")" ] || { echo "!! backup verify failed"; exit 4; }
echo "restore: cp \"$BK/DefaultEngine.ini\" \"$INI\"" > "$BK/README.txt"
# keep the file's own line endings (the Windows copy is CRLF, the Mac copy LF)
if grep -q $'\r$' "$INI"; then NL=$'\r\n'; else NL=$'\n'; fi
# add a line break first only if the file does not end with one
[ -n "$(tail -c1 "$INI" | tr -d '\r')" ] && printf '%s' "$NL" >> "$INI"
{
  printf '%s' "$NL"
  printf '[/Script/Engine.UserInterfaceSettings]%s' "$NL"
  printf '; 2026-09-18: ScaleToFit keeps the UI layout at least 1920x1080 units on any aspect ratio (was the default%s' "$NL"
  printf '; ShortestSide rule, which made 16:10/3:2 layouts narrower and pushed the video selector buttons off-screen).%s' "$NL"
  printf 'UIScaleRule=ScaleToFit%s' "$NL"
  printf 'DesignScreenSize=(X=1920,Y=1080)%s' "$NL"
} >> "$INI"
echo "== applied. backup: $BK"
tail -6 "$INI"
