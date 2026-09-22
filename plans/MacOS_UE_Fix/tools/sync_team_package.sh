#!/bin/bash
# sync_team_package.sh [--push] — ON WSL. Assembles the lab's team package (plans/MacOS_UE_Fix/team-package/) from the
# masters in plans/MacOS_UE_Fix/ and, with --push, mirrors it to the Air's two copies and verifies them by md5.
#
# The team package is what a lab Mac needs to go from a blank machine to a verified Shipping app with no access to
# this repository: the engine build + migration script and its patches, the packaging scripts with their guard, the
# project-source masters (so a migrated project can be verified/re-applied), the display-survey harness and the
# documents. Masters stay where HANDOFF-2026-09-21.md §3 says; this script copies them, so never edit the copies.
#
#   masters (source of truth)                          -> team-package/ (copy)
#   graphics-autotune/check_engine_patch.sh            -> check_engine_patch.sh
#   graphics-autotune/package_mac_gfx.sh               -> package_mac_gfx.sh
#   voice-aec-fix/package_mac_shipping.sh              -> package_mac_shipping.sh
#   voice-aec-fix/build_mac_editor.sh                  -> build_mac_editor.sh
#   graphics-autotune/{mac_runtime_test,stage_gat_ini,backup_step}.sh -> same names
#   graphics-autotune/apply_autotune_src.sh + src/**   -> masters/graphics-autotune/{apply_autotune_src.sh,src/**}
#   graphics-autotune/config/Mac/MacEngine.ini         -> masters/graphics-autotune/config/Mac/MacEngine.ini
#   mac-linker/{awsTutorial.cpp,awsTutorial.Target.cs} -> masters/mac-linker/
#   voice-aec-fix/EmbeddedVoiceChat/**                 -> masters/voice-aec-fix/EmbeddedVoiceChat/**
#   engine-patches/MetalRHI-resolution-list.patch      -> patches/6g-MetalRHI-resolution-list.patch
#   (WebBrowserSingleton hunk of engine-all-local-modifications.patch) -> patches/6h-WebBrowserSingleton-CEF-fallback.patch
#   tools/mac/display_survey/**                        -> tools/display_survey/**
#   HANDOFF-2026-09-21.md                              -> docs/HANDOFF-2026-09-21.md (reference copy)
# Hand-maintained IN team-package/ (not copied): run-ue541-mac.sh, apply-mac-project-fixes.sh, package-awsTutorial-mac.sh,
# verify-project-masters.sh, apply-project-masters.sh, make-project-zip.sh, apply-electra-override-mac.sh,
# set_electra_override.py, verify_media_overrides.py, README.txt, SOP, Building-awsTutorial-on-a-Mac.md,
# masters/project-mac/** (the two Build/Mac/Resources files).
# Every copied tree/file is removed before copying, so a renamed or deleted master cannot leave a stale copy behind
# (2026-09-21 review). Then masters/MANIFEST.tsv (md5 <TAB> master path <TAB> project path; CR-stripped md5; the
# tuner list is derived from src/, not hard-coded) and PACKAGE.md5 (every file except zips, old-zips/, .backups/).
#
# --push: per mirror, rsync --delete (excluding *.zip, old-zips/, .backups/) after a tar backup into
# ~/team-package-backups/<stamp>/ on the Air, then md5-verify that mirror against PACKAGE.md5 AND list any file present
# on the mirror that PACKAGE.md5 does not know (stale extras). Mirrors: ~/Downloads/ue541-team-package/ and
# /Volumes/KingLab/ue541-team-package/ on daltonsalvo@192.168.50.10. Also refreshes every ~/gfx_autotune/ copy of the
# scripts the Air's operator runs from there. Exit 0 only when every mirror verifies.
set -euo pipefail
PUSH=0; [ "${1:-}" = "--push" ] && PUSH=1
P="$(cd "$(dirname "$0")/.." && pwd)"          # plans/MacOS_UE_Fix
T="$P/team-package"
AIR="${AIR_SSH:-daltonsalvo@192.168.50.10}"
# Remote paths (the Air's home, not this WSL one): the literal ~ is expanded by the Air's shell and by rsync.
MIRRORS=('~/Downloads/ue541-team-package' '/Volumes/KingLab/ue541-team-package')
GFX_SCRIPTS="package_mac_gfx.sh package_mac_shipping.sh build_mac_editor.sh check_engine_patch.sh mac_runtime_test.sh stage_gat_ini.sh backup_step.sh"
sum() { tr -d '\r' < "$1" | md5sum | cut -c1-32; }
cp_f() { mkdir -p "$(dirname "$2")"; cp "$1" "$2"; }

echo "== assembling $T from masters in $P"
COPIED_FILES="check_engine_patch.sh package_mac_gfx.sh package_mac_shipping.sh build_mac_editor.sh mac_runtime_test.sh stage_gat_ini.sh backup_step.sh"
for f in $COPIED_FILES; do rm -f "$T/$f"; done
rm -rf "$T/masters/graphics-autotune" "$T/masters/mac-linker" "$T/masters/voice-aec-fix" "$T/tools/display_survey" "$T/patches" "$T/docs"
mkdir -p "$T/masters/graphics-autotune" "$T/masters/mac-linker" "$T/masters/voice-aec-fix" "$T/tools" "$T/patches" "$T/docs"
cp_f "$P/graphics-autotune/check_engine_patch.sh"  "$T/check_engine_patch.sh"
cp_f "$P/graphics-autotune/package_mac_gfx.sh"     "$T/package_mac_gfx.sh"
cp_f "$P/voice-aec-fix/package_mac_shipping.sh"    "$T/package_mac_shipping.sh"
cp_f "$P/voice-aec-fix/build_mac_editor.sh"        "$T/build_mac_editor.sh"
for s in mac_runtime_test.sh stage_gat_ini.sh backup_step.sh; do cp_f "$P/graphics-autotune/$s" "$T/$s"; done
cp_f "$P/graphics-autotune/apply_autotune_src.sh"  "$T/masters/graphics-autotune/apply_autotune_src.sh"
cp -R "$P/graphics-autotune/src" "$T/masters/graphics-autotune/src"
cp_f "$P/graphics-autotune/config/Mac/MacEngine.ini" "$T/masters/graphics-autotune/config/Mac/MacEngine.ini"
cp_f "$P/mac-linker/awsTutorial.cpp"       "$T/masters/mac-linker/awsTutorial.cpp"
cp_f "$P/mac-linker/awsTutorial.Target.cs" "$T/masters/mac-linker/awsTutorial.Target.cs"
cp -R "$P/voice-aec-fix/EmbeddedVoiceChat" "$T/masters/voice-aec-fix/EmbeddedVoiceChat"
find "$T/masters" -name '.DS_Store' -delete
cp_f "$P/engine-patches/MetalRHI-resolution-list.patch" "$T/patches/6g-MetalRHI-resolution-list.patch"
awk '/^diff --git.*WebBrowserSingleton/{p=1} p&&/^diff --git/&&!/WebBrowserSingleton/{p=0} p' \
  "$P/engine-patches/engine-all-local-modifications.patch" > "$T/patches/6h-WebBrowserSingleton-CEF-fallback.patch"
[ -s "$T/patches/6h-WebBrowserSingleton-CEF-fallback.patch" ] || { echo "6h patch came out empty"; exit 1; }
cp -R "$P/tools/mac/display_survey" "$T/tools/display_survey"
cp_f "$P/HANDOFF-2026-09-21.md" "$T/docs/HANDOFF-2026-09-21.md"
for f in masters/project-mac/Build/Mac/Resources/Info.Template.plist masters/project-mac/Build/Mac/Resources/NoSandbox.entitlements \
         run-ue541-mac.sh apply-mac-project-fixes.sh package-awsTutorial-mac.sh verify-project-masters.sh apply-project-masters.sh \
         make-project-zip.sh apply-electra-override-mac.sh set_electra_override.py verify_media_overrides.py \
         mac-rebuild-from-zip.sh windows/make-project-zip.bat windows/package-windows.bat PACKAGING-STEP-BY-STEP.md \
         README.txt SOP-UE5.4.1-Mac-Build-and-Migration.md Building-awsTutorial-on-a-Mac.md; do
  [ -f "$T/$f" ] || { echo "hand-maintained file missing from the package: $f"; exit 1; }
done
chmod +x "$T"/*.sh "$T"/masters/graphics-autotune/*.sh "$T"/tools/display_survey/*.sh

echo "== masters/MANIFEST.tsv"
M="$T/masters/MANIFEST.tsv"
{
  printf '# md5 (CR-stripped)\tmaster path (under masters/)\tproject path — generated by tools/sync_team_package.sh; do not edit\n'
  ( cd "$T/masters/graphics-autotune/src" && find . -type f | sort | sed 's|^\./||' ) | while read -r f; do
    printf '%s\tgraphics-autotune/src/%s\tSource/awsTutorial/%s\n' "$(sum "$T/masters/graphics-autotune/src/$f")" "$f" "$f"
  done
  printf '%s\tmac-linker/awsTutorial.cpp\tSource/awsTutorial/awsTutorial.cpp\n' "$(sum "$T/masters/mac-linker/awsTutorial.cpp")"
  printf '%s\tmac-linker/awsTutorial.Target.cs\tSource/awsTutorial.Target.cs\n' "$(sum "$T/masters/mac-linker/awsTutorial.Target.cs")"
  printf '%s\tgraphics-autotune/config/Mac/MacEngine.ini\tConfig/Mac/MacEngine.ini\n' "$(sum "$T/masters/graphics-autotune/config/Mac/MacEngine.ini")"
  ( cd "$T/masters/voice-aec-fix/EmbeddedVoiceChat" && find . -type f | sort | sed 's|^\./||' ) | while read -r f; do
    printf '%s\tvoice-aec-fix/EmbeddedVoiceChat/%s\tPlugins/UltimateMultiplayerServicesPlugin/Source/EmbeddedVoiceChat/%s\n' "$(sum "$T/masters/voice-aec-fix/EmbeddedVoiceChat/$f")" "$f" "$f"
  done
  for f in Info.Template.plist NoSandbox.entitlements; do
    printf '%s\tproject-mac/Build/Mac/Resources/%s\tBuild/Mac/Resources/%s\n' "$(sum "$T/masters/project-mac/Build/Mac/Resources/$f")" "$f" "$f"
  done
} > "$M"
echo "   $(grep -vc '^#' "$M") files in the manifest"

echo "== PACKAGE.md5"
( cd "$T" && find . -type f ! -name '*.zip' ! -name '*.zip.md5' ! -name PACKAGE.md5 ! -name '.DS_Store' ! -path './old-zips/*' ! -path './.backups/*' \
    | sort | sed 's|^\./||' | while read -r f; do printf '%s  %s\n' "$(md5sum "$f" | cut -c1-32)" "$f"; done ) > "$T/PACKAGE.md5"
echo "   $(wc -l < "$T/PACKAGE.md5") files"
for s in "$T"/*.sh "$T"/masters/graphics-autotune/*.sh "$T"/tools/display_survey/*.sh; do bash -n "$s" || { echo "SYNTAX: $s"; exit 1; }; done
echo "   bash -n: all scripts parse"
[ "$PUSH" = 1 ] || { echo "== done (no --push)"; exit 0; }

echo "== pushing to the Air ($AIR)"
STAMP=$(date +%Y%m%dT%H%M%S)
# Remote verify: every PACKAGE.md5 entry matches, and no unknown file exists outside zips/old-zips/.backups.
REMOTE_VERIFY='cd "$1" || { echo "NO MIRROR at $1 (unmounted?)"; exit 1; }; bad=0; n=0; while read -r want f; do n=$((n+1)); have=$(md5 -q "$f" 2>/dev/null); [ "$have" = "$want" ] || { echo "MISMATCH $1/$f"; bad=$((bad+1)); }; done < PACKAGE.md5; extra=0; while IFS= read -r f; do grep -q "  $f\$" PACKAGE.md5 || { echo "EXTRA $1/$f"; extra=$((extra+1)); }; done < <(find . -type f ! -name "*.zip" ! -name "*.zip.md5" ! -name PACKAGE.md5 ! -name .DS_Store ! -path "./old-zips/*" ! -path "./.backups/*" | sed "s|^\./||"); echo "$1: $n files, $bad mismatches, $extra extras"; [ $bad = 0 ] && [ $extra = 0 ]'
# The backup of each existing mirror must succeed before anything is pushed (fail closed — 2026-09-22 review).
ssh -o BatchMode=yes "$AIR" "ok=1; mkdir -p ~/team-package-backups/$STAMP ~/gfx_autotune/.backups/$STAMP; for d in ${MIRRORS[*]}; do if [ -d \"\$d\" ]; then tar -C \"\$d\" --exclude='*.zip' --exclude='old-zips' -cf ~/team-package-backups/$STAMP/\$(basename \$(dirname \"\$d\"))-\$(basename \"\$d\").tar . && echo \"backed up \$d\" || { echo \"BACKUP FAILED \$d\"; ok=0; }; else echo \"no mirror yet at \$d (nothing to back up)\"; fi; done; for s in $GFX_SCRIPTS; do cp ~/gfx_autotune/\$s ~/gfx_autotune/.backups/$STAMP/ 2>/dev/null; done; echo gfx_autotune backed up; [ \$ok = 1 ]" \
  || { echo "== FAILED: a mirror backup failed on the Air — nothing pushed"; exit 1; }
ALL_OK=1
for d in "${MIRRORS[@]}"; do
  if ! rsync -rlt --delete --exclude '*.zip' --exclude '*.zip.md5' --exclude 'old-zips/' --exclude '.backups/' --exclude '.DS_Store' "$T/" "$AIR:$d/"; then
    echo "   RSYNC FAILED -> $d (unmounted? partial transfer?)"; ALL_OK=0; continue
  fi
  echo "   rsynced -> $d"
  ssh -o BatchMode=yes "$AIR" "bash -c '$REMOTE_VERIFY' _ $d" || ALL_OK=0
done
for s in $GFX_SCRIPTS; do rsync -t "$T/$s" "$AIR:~/gfx_autotune/$s" || { echo "   RSYNC FAILED -> ~/gfx_autotune/$s"; ALL_OK=0; }; done
rsync -t "$T/masters/graphics-autotune/apply_autotune_src.sh" "$AIR:~/gfx_autotune/apply_autotune_src.sh" || { echo "   RSYNC FAILED -> ~/gfx_autotune/apply_autotune_src.sh"; ALL_OK=0; }
ssh -o BatchMode=yes "$AIR" "for s in $GFX_SCRIPTS apply_autotune_src.sh; do src=~/Downloads/ue541-team-package/\$s; [ \$s = apply_autotune_src.sh ] && src=~/Downloads/ue541-team-package/masters/graphics-autotune/\$s; [ \"\$(md5 -q ~/gfx_autotune/\$s)\" = \"\$(md5 -q \$src)\" ] && echo \"gfx_autotune/\$s = team package\" || { echo \"MISMATCH gfx_autotune/\$s\"; exit 1; }; done" || ALL_OK=0
if [ "$ALL_OK" = 1 ]; then echo "== done: all mirrors identical"; else echo "== FAILED: at least one mirror differs (see MISMATCH/EXTRA lines)"; exit 1; fi
