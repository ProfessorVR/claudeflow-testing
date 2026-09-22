#!/bin/bash
# package_mac_gfx.sh - ON THE MAC. Graphics defaults + auto-tune build:
#   1. moves the current Packaged/Mac/awsTutorial.app and Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app into the
#      graphics-autotune backup folder (same volume = instant; they stay runnable there for rollback),
#   2. cooks + stages the Development app with the team script (-> Packaged/Mac/awsTutorial.app),
#   3. stages the Shipping app from that cook (voice-aec-fix/package_mac_shipping.sh -> Packaged/Mac-Shipping),
#   4. verifies both: tuner compiled in, Retina flag in the built Info.plist, high-DPI setting inside the pak.
# Survives SSH disconnects when started with nohup; log /tmp/gfx_package_mac.out (ends with ALL_DONE).
# Paths (2026-09-21, so the lab Macs can run it from the team package): UE_ENGINE, UE_PROJECT_DIR and UE_TEAM_PACKAGE in
# the environment override the Air's defaults. The team cook+stage script and package_mac_shipping.sh are looked for
# beside this script first (team-package layout), then in the Air's ~/Downloads/ue541-team-package and ~/gfx_autotune.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
PROJ="${UE_PROJECT_DIR:-/Volumes/UnrealEngine/Unreal_Projects/awsTutorial}"
ENGINE="${UE_ENGINE:-/Volumes/UnrealEngine/UE_5_4_1}"
BACKUP="${1:?usage: package_mac_gfx.sh <backup folder name, e.g. graphics-autotune-20260919T061402> [rebuild]}"
MODE="${2:-first}"   # first = preserve the pre-change apps in the backup; rebuild = they are already preserved, package over
OUT=/tmp/gfx_package_mac.out
DEV_APP="$PROJ/Packaged/Mac/awsTutorial.app"
SHIP_APP="$PROJ/Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app"
TEAM="${UE_TEAM_PACKAGE:-}"
if [ -z "$TEAM" ]; then
  if [ -f "$HERE/package-awsTutorial-mac.sh" ]; then TEAM="$HERE"; else TEAM="$HOME/Downloads/ue541-team-package"; fi
fi
SHIP_SCRIPT="$HERE/package_mac_shipping.sh"; [ -f "$SHIP_SCRIPT" ] || SHIP_SCRIPT="$HOME/gfx_autotune/package_mac_shipping.sh"
: > "$OUT"
[ -f "$PROJ/awsTutorial.uproject" ] || { echo "no project at $PROJ (set UE_PROJECT_DIR)" >> "$OUT"; echo ALL_DONE >> "$OUT"; exit 1; }
[ -f "$TEAM/package-awsTutorial-mac.sh" ] || { echo "team package script not found at $TEAM/package-awsTutorial-mac.sh (set UE_TEAM_PACKAGE)" >> "$OUT"; echo ALL_DONE >> "$OUT"; exit 1; }
[ -f "$SHIP_SCRIPT" ] || { echo "package_mac_shipping.sh not found beside $0 or in ~/gfx_autotune" >> "$OUT"; echo ALL_DONE >> "$OUT"; exit 1; }
# The two scripts below read these; passing them keeps every path consistent on a Mac that is not the Air.
export UE_ENGINE="$ENGINE" UE_PROJECT_DIR="$PROJ" UE_PROJECT="$PROJ/awsTutorial.uproject" UE_ARCHIVE="$PROJ/Packaged/Mac"
# Guard (2026-09-20, H1): never package an engine that has lost the local resolution-list fix. The check script lives
# beside this one (team package, or ~/gfx_autotune/ on the Air) and in plans/MacOS_UE_Fix/graphics-autotune/.
GUARD="$HERE/check_engine_patch.sh"
[ -f "$GUARD" ] || { echo "check_engine_patch.sh missing beside $0 - refusing to package" >> "$OUT"; echo ALL_DONE >> "$OUT"; exit 1; }
if ! bash "$GUARD" "$ENGINE/Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp" >> "$OUT" 2>&1; then
  echo "ENGINE_PATCH_MISSING - nothing was packaged (see $GUARD)" >> "$OUT"
  echo ALL_DONE >> "$OUT"
  exit 1
fi
echo "engine $ENGINE ; project $PROJ ; team script $TEAM/package-awsTutorial-mac.sh ; shipping script $SHIP_SCRIPT" >> "$OUT"
{
  if [ "$MODE" = first ]; then
    # A second `first` with the same name would mv the app INTO the existing backup app (rollback copy lost) — refuse.
    if [ -e "$PROJ/.backups/$BACKUP/apps" ]; then
      echo "backup folder $PROJ/.backups/$BACKUP/apps already exists — the previous apps are already parked there; re-run with 'rebuild' (or a new backup name)"
      echo ALL_DONE; exit 1
    fi
    echo "==> preserving the previous apps ($(date))"
    mkdir -p "$PROJ/.backups/$BACKUP/apps"
    [ -d "$DEV_APP" ] && mv "$DEV_APP" "$PROJ/.backups/$BACKUP/apps/awsTutorial.app" && echo "moved previous Development app"
    [ -d "$SHIP_APP" ] && mv "$SHIP_APP" "$PROJ/.backups/$BACKUP/apps/awsTutorial-Mac-Shipping.app" && echo "moved previous Shipping app"
  else
    # rebuild = the pre-change apps are already parked under this name; refuse to delete unparked apps (2026-09-22 review).
    if [ ! -d "$PROJ/.backups/$BACKUP/apps" ] && { [ -d "$DEV_APP" ] || [ -d "$SHIP_APP" ]; }; then
      echo "rebuild requested but $PROJ/.backups/$BACKUP/apps does not exist and apps are present — nothing is parked under that name; use 'first' (or the right backup name)"
      echo ALL_DONE; exit 1
    fi
    echo "==> rebuild: pre-change apps already preserved in .backups/$BACKUP/apps; removing the current build's apps"
    rm -rf "$DEV_APP" "$SHIP_APP"
  fi

  echo "==> Development: cook + stage ($(date))"
  bash "$TEAM/package-awsTutorial-mac.sh"; DEV_RC=$?
  echo "DEV_EXIT=$DEV_RC"

  # A failed Development run must not be followed by a Shipping stage from whatever old cook is on disk (2026-09-21).
  if [ "$DEV_RC" != 0 ]; then
    echo "SHIP_SKIPPED: Development failed (DEV_EXIT=$DEV_RC) — Shipping was not staged; nothing to verify"
    echo ALL_DONE
    exit 1
  fi
  echo "==> Shipping: stage from the cook ($(date))"
  bash "$SHIP_SCRIPT"; SHIP_RC=$?
  echo "SHIP_EXIT=$SHIP_RC"
  cat /tmp/evc_package_mac_shipping.out 2>/dev/null | tail -12

  echo "==> verify ($(date))"
  for APP in "$DEV_APP" "$SHIP_APP"; do
    echo "--- $APP"
    [ -d "$APP/Contents/MacOS" ] || { echo "MISSING: $APP was not produced"; continue; }
    ls -la "$APP/Contents/MacOS/" 2>&1 | tail -n +2
    echo "tuner compiled in (UTF-16 overlay text): $(perl -0777 -ne 'my $w=join("\0", split(//, q{Optimizing graphics for this computer}))."\0"; my $n=()=/\Q$w\E/g; print $n' "$APP"/Contents/MacOS/*)"
    echo "NSHighResolutionCapable: $(/usr/libexec/PlistBuddy -c 'Print :NSHighResolutionCapable' "$APP/Contents/Info.plist" 2>&1)"
    PAK=$(find "$APP" -name 'awsTutorial-Mac.pak' | head -1)
    if [ -n "$PAK" ]; then
      rm -rf /tmp/gfx_pak_extract && mkdir -p /tmp/gfx_pak_extract
      "$ENGINE/Engine/Binaries/Mac/UnrealPak" "$PAK" -Extract /tmp/gfx_pak_extract -Filter='*DefaultEngine.ini' >/dev/null 2>&1
      INI_IN_PAK=$(find /tmp/gfx_pak_extract -name DefaultEngine.ini | head -1)
      echo "pak DefaultEngine: $([ -n "$INI_IN_PAK" ] && grep -hE 'bAllowHighDPIInGameMode|r.UseClusteredDeferredShading' "$INI_IN_PAK" 2>&1 || echo 'NOT FOUND in pak')"
    else echo "pak: awsTutorial-Mac.pak NOT FOUND in $APP"; fi
    codesign -dv "$APP" 2>&1 | grep -E 'Signature=|Identifier='
    du -sh "$APP"
  done
  echo ALL_DONE
  [ "$SHIP_RC" = 0 ] || exit 1
} >> "$OUT" 2>&1
