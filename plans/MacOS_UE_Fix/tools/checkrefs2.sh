#!/usr/bin/env bash
# FName-aware reference check.
# UE stores "Foo_360" as FName("Foo", number=361), so the name table holds "Foo".
# A reference "X" therefore resolves if X.uasset OR X_<digits>.uasset exists.
CONTENT=/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/Content

check() {
  local f="$1" label="$2"
  local tot=0 miss=0
  local missing=()
  while IFS= read -r ref; do
    local pkg="${ref%%.*}"
    case "$pkg" in /Game/*) ;; *) continue ;; esac
    local dir="$CONTENT/$(dirname "${pkg#/Game/}")"
    local base; base="$(basename "$pkg")"
    tot=$((tot+1))
    if [ -f "$dir/$base.uasset" ]; then continue; fi
    # FName number-suffix form: base_<digits>
    if compgen -G "$dir/${base}_[0-9]*.uasset" > /dev/null 2>&1; then continue; fi
    miss=$((miss+1)); missing+=("$pkg")
  done < <(strings -a "$f" | grep -oE '^/Game/[A-Za-z0-9_/.() -]+' | sort -u)
  printf '%-26s refs=%-4s UNRESOLVED=%-4s\n' "$label" "$tot" "$miss"
  [ "${#missing[@]}" -gt 0 ] && printf '        %s\n' "${missing[@]}"
  return 0
}

echo "================ WIDGETS ================"
for n in BP_WG_CAT_UCI_01 BP_WG_CAT_UCI_02 BP_WG_CAT_VIET BP_WG_BilateralScar \
         BP_WG_CAT_PARA BP_WG_CAT_PARAOG BP_WG_CAT_PARA_Test BP_WG_CAT_PARA_V2; do
  check "$CONTENT/Blueprints/360_Screens/Widgets/$n.uasset" "$n"
done
echo
echo "================ SCREENS ================"
for n in BP_SC_CAT_UCI_02 BP_SC_CAT_VIET BP_SC_BilateralScar \
         BP_SC_CAT_PARA BP_SC_CAT_PARAOG BP_SC_CAT_PARA_Test BP_SC_CAT_PARA_V3; do
  check "$CONTENT/Blueprints/360_Screens/Screens/$n.uasset" "$n"
done
