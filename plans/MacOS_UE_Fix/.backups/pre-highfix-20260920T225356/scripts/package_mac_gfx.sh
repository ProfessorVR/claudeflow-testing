#!/bin/bash
# package_mac_gfx.sh - ON THE MAC. Graphics defaults + auto-tune build:
#   1. moves the current Packaged/Mac/awsTutorial.app and Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app into the
#      graphics-autotune backup folder (same volume = instant; they stay runnable there for rollback),
#   2. cooks + stages the Development app with the team script (-> Packaged/Mac/awsTutorial.app),
#   3. stages the Shipping app from that cook (voice-aec-fix/package_mac_shipping.sh -> Packaged/Mac-Shipping),
#   4. verifies both: tuner compiled in, Retina flag in the built Info.plist, high-DPI setting inside the pak.
# Survives SSH disconnects when started with nohup; log /tmp/gfx_package_mac.out (ends with ALL_DONE).
set -u
PROJ=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial
ENGINE=/Volumes/UnrealEngine/UE_5_4_1
BACKUP="${1:?usage: package_mac_gfx.sh <backup folder name, e.g. graphics-autotune-20260919T061402> [rebuild]}"
MODE="${2:-first}"   # first = preserve the pre-change apps in the backup; rebuild = they are already preserved, package over
OUT=/tmp/gfx_package_mac.out
DEV_APP="$PROJ/Packaged/Mac/awsTutorial.app"
SHIP_APP="$PROJ/Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app"
: > "$OUT"
{
  if [ "$MODE" = first ]; then
    echo "==> preserving the previous apps ($(date))"
    mkdir -p "$PROJ/.backups/$BACKUP/apps"
    [ -d "$DEV_APP" ] && mv "$DEV_APP" "$PROJ/.backups/$BACKUP/apps/awsTutorial.app" && echo "moved previous Development app"
    [ -d "$SHIP_APP" ] && mv "$SHIP_APP" "$PROJ/.backups/$BACKUP/apps/awsTutorial-Mac-Shipping.app" && echo "moved previous Shipping app"
  else
    echo "==> rebuild: pre-change apps already preserved in .backups/$BACKUP/apps; removing the current build's apps"
    rm -rf "$DEV_APP" "$SHIP_APP"
  fi

  echo "==> Development: cook + stage ($(date))"
  ~/Downloads/ue541-team-package/package-awsTutorial-mac.sh
  echo "DEV_EXIT=$?"

  echo "==> Shipping: stage from the cook ($(date))"
  bash ~/gfx_autotune/package_mac_shipping.sh
  echo "SHIP_EXIT=$?"
  cat /tmp/evc_package_mac_shipping.out 2>/dev/null | tail -12

  echo "==> verify ($(date))"
  for APP in "$DEV_APP" "$SHIP_APP"; do
    echo "--- $APP"
    ls -la "$APP/Contents/MacOS/" 2>&1 | tail -n +2
    echo "tuner compiled in (UTF-16 overlay text): $(perl -0777 -ne 'my $w=join("\0", split(//, q{Optimizing graphics for this computer}))."\0"; my $n=()=/\Q$w\E/g; print $n' "$APP"/Contents/MacOS/*)"
    echo "NSHighResolutionCapable: $(/usr/libexec/PlistBuddy -c 'Print :NSHighResolutionCapable' "$APP/Contents/Info.plist" 2>&1)"
    PAK=$(find "$APP" -name 'awsTutorial-Mac.pak' | head -1)
    rm -rf /tmp/gfx_pak_extract && mkdir -p /tmp/gfx_pak_extract
    "$ENGINE/Engine/Binaries/Mac/UnrealPak" "$PAK" -Extract /tmp/gfx_pak_extract -Filter='*DefaultEngine.ini' >/dev/null 2>&1
    echo "pak DefaultEngine: $(grep -hE 'bAllowHighDPIInGameMode|r.UseClusteredDeferredShading' $(find /tmp/gfx_pak_extract -name DefaultEngine.ini) 2>&1)"
    codesign -dv "$APP" 2>&1 | grep -E 'Signature=|Identifier='
    du -sh "$APP"
  done
  echo ALL_DONE
} >> "$OUT" 2>&1
