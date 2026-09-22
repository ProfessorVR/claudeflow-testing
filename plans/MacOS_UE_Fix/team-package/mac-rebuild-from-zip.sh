#!/bin/bash
# mac-rebuild-from-zip.sh — ON A MAC that already has the engine built (the Air or the lab MacBook Pro).
# ONE command that turns a project zip into verified Development + Shipping apps:
#     bash mac-rebuild-from-zip.sh /path/to/awsTutorial-src-2026-09-22.zip
# or, after a change made in the Unreal editor ON THIS MAC (no zip):
#     bash mac-rebuild-from-zip.sh --package-only
# It runs, in order: (1) the migration (run-ue541-mac.sh with the engine build skipped) — verifies the zip's
# checksum, extracts (or resumes), applies the Mac-side project fixes, checks the sources against the masters, builds
# the project's editor target; (2) the video fix (Mac -> ElectraPlayer on every streamed video; harmless if already
# set); (3) the packaging (package_mac_gfx.sh: Development cook + stage, Shipping stage, verification); then prints
# PASS with the two app paths, or FAIL with the one log to send. Every log of the run is in
# ~/awsTutorial-rebuild-<stamp>/. The Mac is kept awake. Written for someone who has never used Unreal: it asks
# nothing and stops at the first problem with a plain sentence. Total time: ~15 min (warm) to ~35 min (first time).
# Where things are: detected automatically (the Air's /Volumes/UnrealEngine layout, or ~/UnrealEngine on an internal
# disk); UE_ENGINE_PARENT / UE_PROJECT_DEST override.
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
HERE="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M)"
RUN="$HOME/awsTutorial-rebuild-$STAMP"; mkdir -p "$RUN"
say()  { printf '\n==> %s\n' "$*"; }
fail() { printf '\nFAIL: %s\n' "$1"; [ -n "${2:-}" ] && printf '      Send this file to the engineer: %s\n' "$2"; printf '      All logs of this run: %s\n' "$RUN"; exit 1; }
caffeinate -dimsu -w $$ >/dev/null 2>&1 &

MODE=zip; ZIP=""
case "${1:-}" in
  --package-only) MODE=package;;
  "") fail "give me the zip to build from, e.g.  bash mac-rebuild-from-zip.sh ~/Downloads/ue541-team-package/awsTutorial-src-2026-09-22.zip   (or --package-only after a change made in the editor on this Mac)";;
  *) ZIP="$1"; [ -f "$ZIP" ] || fail "zip not found: $ZIP"; case "$ZIP" in /*) ;; *) ZIP="$(cd "$(dirname "$ZIP")" && pwd)/$(basename "$ZIP")";; esac;;
esac

# --- where the engine and the project live -------------------------------------------------------------------
if [ -n "${UE_ENGINE_PARENT:-}" ]; then EP="$UE_ENGINE_PARENT"
elif [ -f /Volumes/UnrealEngine/UE_5_4_1/GenerateProjectFiles.sh ]; then EP=/Volumes/UnrealEngine
elif [ -f "$HOME/UnrealEngine/UE_5_4_1/GenerateProjectFiles.sh" ]; then EP="$HOME/UnrealEngine"
else fail "no built engine found at /Volumes/UnrealEngine/UE_5_4_1 or ~/UnrealEngine/UE_5_4_1 — this Mac has not done Building-awsTutorial-on-a-Mac.md §1 yet (or the external drive is not mounted)"; fi
ENGINE="$EP/UE_5_4_1"
if [ -n "${UE_PROJECT_DEST:-}" ]; then PD="$UE_PROJECT_DEST"
elif [ "$EP" = /Volumes/UnrealEngine ]; then PD=/Volumes/UnrealEngine/Unreal_Projects
else PD="$HOME/Unreal_Projects"; fi
PROJ="$PD/awsTutorial"
[ -d "$ENGINE/Engine/Binaries/Mac/UnrealEditor.app" ] || fail "the engine at $ENGINE has no built editor — run Building-awsTutorial-on-a-Mac.md §1 first"
for f in run-ue541-mac.sh apply-electra-override-mac.sh package_mac_gfx.sh check_engine_patch.sh verify_media_overrides.py; do
  [ -f "$HERE/$f" ] || fail "$f is missing next to this script — the package folder is incomplete; copy it again from the lab drive and check PACKAGE.md5 (README.txt)"
done
say "Engine: $ENGINE"; echo "    Project: $PROJ"; echo "    Logs:    $RUN"
pgrep -x awsTutorial >/dev/null 2>&1 && fail "the game is running on this Mac — quit it first"
pgrep -x awsTutorial-Mac-Shipping >/dev/null 2>&1 && fail "the Shipping game is running on this Mac — quit it first"

# --- 1. migrate ------------------------------------------------------------------------------------------------
if [ "$MODE" = zip ]; then
  if [ -f "$ZIP.md5" ]; then
    say "Checking the zip's checksum (a minute)…"
    WANT="$(tr -d ' \r\n' < "$ZIP.md5")"; HAVE="$(md5 -q "$ZIP")"
    [ "$WANT" = "$HAVE" ] || fail "the zip is damaged or incomplete: its checksum ($HAVE) differs from $ZIP.md5 ($WANT). Copy it again."
    echo "    ok ($HAVE)"
  else echo "    (no .md5 file beside the zip — skipping the checksum; make-project-zip writes one)"; fi
  say "1/3 Unpacking the project and preparing it for the Mac (5–10 min the first time; seconds if this zip was already unpacked)…"
  if UE_SKIP_ENGINE=1 UE_NONINTERACTIVE=1 UE_ENGINE_PARENT="$EP" UE_PROJECT_DEST="$PD" UE_PROJECT_ZIP="$ZIP" \
       bash "$HERE/run-ue541-mac.sh" > "$RUN/1-migrate.log" 2>&1 && grep -q "DONE — everything built" "$RUN/1-migrate.log"; then
    grep -E "keeping it \(resume\)|Extracted from:|moving it aside|masters:" "$RUN/1-migrate.log" | sed 's/\x1b\[[0-9;]*m//g; s/^/    /'
  else
    sed 's/\x1b\[[0-9;]*m//g' "$RUN/1-migrate.log" | grep -E '^\[x\]|error:' | tail -5 | sed 's/^/    /'
    fail "the project could not be prepared (see the lines above)" "$RUN/1-migrate.log"
  fi
else
  [ -f "$PROJ/awsTutorial.uproject" ] || fail "no project at $PROJ to package (use the zip form of this command first)"
  say "1/3 Skipped (package-only): using the project already at $PROJ"
fi

# --- 2. video fix -----------------------------------------------------------------------------------------------
say "2/3 Making the streamed videos play on Mac (Mac -> ElectraPlayer on every video; 1–3 min)…"
if UE_ENGINE="$ENGINE" UE_PROJECT_DIR="$PROJ" bash "$HERE/apply-electra-override-mac.sh" apply > "$RUN/2-videos.log" 2>&1 \
   && python3 "$HERE/verify_media_overrides.py" "$PROJ/Content/Media/StreamMediaSources" > "$RUN/2-videos-verify.log" 2>&1; then
  tail -1 "$RUN/2-videos-verify.log" | sed 's/^/    /'
else
  tail -4 "$RUN/2-videos.log" "$RUN/2-videos-verify.log" 2>/dev/null | sed 's/^/    /'
  fail "the video fix did not verify" "$RUN/2-videos.log"
fi

# --- 3. package ---------------------------------------------------------------------------------------------------
say "3/3 Packaging Development + Shipping (15–30 min; progress in $RUN/3-package.out)…"
UE_ENGINE="$ENGINE" UE_PROJECT_DIR="$PROJ" bash "$HERE/package_mac_gfx.sh" "rebuild-$STAMP" first >/dev/null 2>&1
PRC=$?
cp /tmp/gfx_package_mac.out "$RUN/3-package.out" 2>/dev/null
for f in /tmp/awsTutorial-cook.log /tmp/awsTutorial-stage.log /tmp/awsTutorial-stage-shipping.log /tmp/evc_package_mac_shipping.out; do [ -f "$f" ] && cp "$f" "$RUN/" ; done
DEV="$PROJ/Packaged/Mac/awsTutorial.app"; SHIP="$PROJ/Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app"
if [ "$PRC" = 0 ] && grep -q "^DEV_EXIT=0" "$RUN/3-package.out" && grep -q "^SHIP_EXIT=0" "$RUN/3-package.out" \
   && [ -f "$DEV/Contents/MacOS/awsTutorial" ] && [ -f "$SHIP/Contents/MacOS/awsTutorial-Mac-Shipping" ]; then
  grep -E "cook complete|NSHighResolutionCapable|Signature=" "$RUN/3-package.out" | sort -u | sed 's/^/    /'
  printf '\nPASS — both apps were built %s\n' "$(date +%H:%M)"
  printf '   Development: %s\n   Shipping:    %s\n' "$DEV" "$SHIP"
  printf '   Next: PACKAGING-STEP-BY-STEP.md, "How to check a build" — open the Shipping app, log in, reach the level, quit.\n'
  printf '   To give it to someone: copy the .app, then on their Mac run  xattr -dr com.apple.quarantine <the app>\n'
  printf '   Previous apps were parked in %s/.backups/rebuild-%s/apps/\n' "$PROJ" "$STAMP"
  exit 0
fi
grep -E "DEV_EXIT|SHIP_EXIT|SHIP_SKIPPED|COOK FAILED|ENGINE_PATCH|FAILED|MISSING" "$RUN/3-package.out" | sed 's/^/    /'
if ! grep -q "^DEV_EXIT=0" "$RUN/3-package.out"; then
  L="$RUN/awsTutorial-cook.log"; grep -q "cook complete" "$RUN/3-package.out" && L="$RUN/awsTutorial-stage.log"
  fail "the Development app was not built" "$L"
fi
fail "the Shipping app was not built" "$RUN/awsTutorial-stage-shipping.log"
