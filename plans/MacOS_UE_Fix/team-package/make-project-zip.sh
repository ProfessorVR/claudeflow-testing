#!/bin/bash
# make-project-zip.sh [project dir] [out zip] — ON THE MAC that holds the current project (the Air today).
# Zips the project for run-ue541-mac.sh step 12: sources, content, config, plugins AND Build/ (the editor's "Zip Up
# Project" omits Build/ — SOP §8a·1), without intermediates, saved data, binaries, packaged apps, backups or
# AppleDouble sidecars. Checks first that the project carries the masters (verify-project-masters.sh) and the live
# lineage (SOP §8·0), moves any previous awsTutorial-src-*.zip beside the output into old-zips/ (run-ue541-mac.sh
# refuses to guess between two zips), and prints the zip's md5 and the same checks read back from the zip.
# Defaults: /Volumes/UnrealEngine/Unreal_Projects/awsTutorial -> ~/Downloads/ue541-team-package/awsTutorial-src-<date>.zip
# Takes ~3 min for ~5 GB on the Air. Nothing in the project is modified.
# Note: '*/Binaries/*' also drops every plugin's prebuilt binaries — correct while every plugin has Source/ (the
# read-back lists any plugin that does not).
set -uo pipefail
PROJ="${1:-/Volumes/UnrealEngine/Unreal_Projects/awsTutorial}"
OUT="${2:-$HOME/Downloads/ue541-team-package/awsTutorial-src-$(date +%Y-%m-%d).zip}"
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -f "$PROJ/awsTutorial.uproject" ] || { echo "not a project dir: $PROJ"; exit 2; }
echo "== masters check"
VOUT="$(bash "$HERE/verify-project-masters.sh" "$PROJ")"; VRC=$?
echo "$VOUT" | grep -vE '^OK ' ; echo "$VOUT" | tail -1
[ "$VRC" = 0 ] || { echo "project differs from the masters (or the package is incomplete, rc=$VRC) — apply them first (apply-project-masters.sh)"; exit 1; }
echo "== lineage check (SOP §8·0): BP_SC_CatPara + BP_WG_CatPara present, CAT_PARA family absent"
LIVE=$(find "$PROJ/Content" \( -name 'BP_SC_CatPara.uasset' -o -name 'BP_WG_CatPara.uasset' \) | wc -l | tr -d ' ')
FORK=$(find "$PROJ/Content" \( -name 'BP_SC_CAT_PARAOG.uasset' -o -name 'BP_WG_CAT_PARAOG.uasset' \) | wc -l | tr -d ' ')
echo "   live markers $LIVE (want 2), fork markers $FORK (want 0)"
[ "$LIVE" = 2 ] && [ "$FORK" = 0 ] || { echo "LINEAGE CHECK FAILED — this is not the live project"; exit 1; }
echo "== plugins without Source/ (their Binaries/ are NOT zipped):"
for p in "$PROJ"/Plugins/*/; do [ -d "$p" ] || continue; [ -d "${p}Source" ] || echo "   $(basename "$p")"; done
mkdir -p "$(dirname "$OUT")/old-zips"
for old in "$(dirname "$OUT")"/awsTutorial-src-*.zip; do
  [ -f "$old" ] && [ "$old" != "$OUT" ] && { mv "$old" "$old.md5" "$(dirname "$OUT")/old-zips/" 2>/dev/null; echo "== moved previous $(basename "$old") to old-zips/"; }
done
rm -f "$OUT" "$OUT.md5"
echo "== zipping $PROJ -> $OUT ($(date +%T))"
( cd "$PROJ" && COPYFILE_DISABLE=1 zip -q -r -X "$OUT" awsTutorial.uproject Build Config Content Plugins Source \
    -x '*/Intermediate/*' '*/Binaries/*' '*/Saved/*' '*/DerivedDataCache/*' '*/.backups/*' '*/__pycache__/*' \
       '*.DS_Store' '._*' '*/._*' 'Build/Mac/Resources/.backups/*' ) || { echo "zip failed"; exit 1; }
echo "== $(du -h "$OUT" | cut -f1)  md5 $(md5 -q "$OUT")  ($(date +%T))"
echo "== read-back checks"
fail=0
chk() { local got="$1" want="$2" what="$3"; if [ "$got" = "$want" ]; then echo "   $what: $got (want $want)"; else echo "   $what: $got (WANT $want) <- FAIL"; fail=1; fi; }
LIST="$(unzip -Z1 "$OUT")"
chk "$(echo "$LIST" | grep -c 'Build/Mac/Resources/NoSandbox.entitlements')" 1 "NoSandbox.entitlements"
chk "$(unzip -p "$OUT" Build/Mac/Resources/Info.Template.plist | grep -c NSMicrophone)" 1 "Info.Template.plist mic key"
chk "$(echo "$LIST" | grep -c '^Config/Mac/MacEngine.ini$')" 1 "Config/Mac/MacEngine.ini"
chk "$(echo "$LIST" | grep -c 'Source/awsTutorial/GraphicsAutoTuneSubsystem')" 2 "tuner sources"
chk "$(echo "$LIST" | grep -cE 'BP_(SC|WG)_CatPara\.uasset')" 2 "lineage live markers"
chk "$(echo "$LIST" | grep -cE 'BP_(SC|WG)_CAT_PARAOG\.uasset')" 0 "lineage fork markers"
chk "$(echo "$LIST" | grep -cE '^(Packaged|Saved|Intermediate|Binaries)/')" 0 "Packaged/Saved/Intermediate/Binaries leaked"
[ "$fail" = 0 ] || { echo "READ-BACK FAILED — do not use this zip"; exit 1; }
md5 -q "$OUT" > "$OUT.md5"; echo "== done: $OUT (+ .md5)"
