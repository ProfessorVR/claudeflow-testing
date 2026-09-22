#!/bin/bash
# apply_clustered.sh <project dir> - adds r.UseClusteredDeferredShading=1 (+ comment) as the first entry of the
# project's [/Script/Engine.RendererSettings] section in Config/DefaultEngine.ini, keeping line endings. Idempotent.
set -eu
F="${1:?usage: apply_clustered.sh <project dir>}/Config/DefaultEngine.ini"
grep -q '^r.UseClusteredDeferredShading=' "$F" && { echo "already present"; grep -n 'r.UseClusteredDeferredShading' "$F"; exit 0; }
grep -q '^\[/Script/Engine.RendererSettings\]' "$F" || { echo "RendererSettings section not found"; exit 1; }
if grep -q $'\r$' "$F"; then EOL=$'\r'; else EOL=''; fi
TMP="$F.tmp.$$"
awk -v eol="$EOL" '
  { print }
  /^\[\/Script\/Engine\.RendererSettings\]/ && !done {
    print "; 2026-09-19: clustered deferred shading renders all unshadowed local lights in one pass instead of one draw per" eol
    print "; light (FirstPersonMap has ~830 local lights; measured 13.2 -> 8.0 ms per frame on an RTX 5070 laptop)." eol
    print "r.UseClusteredDeferredShading=1" eol
    done = 1
  }' "$F" > "$TMP"
if [ -n "$(tail -c1 "$F")" ]; then perl -pi -e 'chomp if eof' "$TMP"; fi
mv "$TMP" "$F"
grep -n -B1 -A3 'RendererSettings\]' "$F" | head -6
