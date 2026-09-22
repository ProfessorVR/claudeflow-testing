#!/usr/bin/env python3
"""light_census.py <list of external-actor .uasset paths> - decodes every PointLightComponent/SpotLightComponent export
(UE 5.4 tagged properties via tools/props.py) and tallies the settings that drive CPU cost: mobility, dynamic shadow
casting, attenuation radius, max draw distance. Properties absent from the package are at the class default
(placed light actors: Stationary, CastShadows on, MaxDrawDistance 0 = unlimited)."""
import collections
import os
import sys

sys.path.insert(0, "/home/dalton/projects/claudeflow-testing/plans/MacOS_UE_Fix/tools")
import props  # noqa: E402
import uasset2  # noqa: E402

LIGHT_CLASSES = {"PointLightComponent", "SpotLightComponent", "RectLightComponent"}
paths = [l.strip() for l in open(sys.argv[1]) if l.strip()]
tally = collections.Counter()
radius = []
owners = collections.Counter()
examples = {}
errors = 0
for path in paths:
    try:
        exports = uasset2.parse(path)["exports"]
        decoded = props.decode(path, None, show=False)
        _b, names, _nm, _imports = props.read_tables(path)
    except Exception:
        errors += 1
        continue
    for idx, (cls, name) in enumerate(exports):
        cls = str(cls)
        if cls not in LIGHT_CLASSES or idx >= len(decoded):
            continue
        d = {p[0]: str(p[3]) for p in (decoded[idx][1] or [])}
        mobility = d.get("Mobility", "(default Stationary)")
        if len(mobility) == 16 and all(ch in "0123456789abcdef" for ch in mobility):
            i = int.from_bytes(bytes.fromhex(mobility[:8]), "little")
            mobility = names[i] if 0 <= i < len(names) else mobility
        mobility = "Movable" if "Movable" in mobility else "Static" if "Static" in mobility else "Stationary" if "Stationary" in mobility else mobility
        shadows = d.get("CastShadows", "True(default)")
        dyn = d.get("CastDynamicShadows", "True(default)")
        mdd = d.get("MaxDrawDistance", "0(default)")
        visible = d.get("bVisible", "True(default)")
        affects = d.get("bAffectsWorld", "True(default)")
        key = (cls, mobility, "shadows" if shadows.startswith("True") and dyn.startswith("True") else "no-shadows",
               "unlimited-draw-distance" if mdd.startswith("0") else "has-draw-distance",
               "hidden" if visible.startswith("False") or affects.startswith("False") else "active")
        tally[key] += 1
        owner = os.path.basename(os.path.dirname(path))
        examples.setdefault(key, (path.split("__ExternalActors__/")[-1], {k: d[k] for k in list(d)[:12]}))
        try:
            radius.append(float(d.get("AttenuationRadius", "nan")))
        except ValueError:
            pass
print(f"{len(paths)} packages, {sum(tally.values())} light components, {errors} undecodable packages")
for key, n in tally.most_common():
    print(f"  {n:4d}  {' | '.join(key)}")
r = [x for x in radius if x == x]
if r:
    r.sort()
    print(f"AttenuationRadius (explicitly set on {len(r)}): min {r[0]:.0f}, median {r[len(r)//2]:.0f}, max {r[-1]:.0f}")
print("\nexample per category:")
for key, (p, d) in examples.items():
    print(f"  [{' | '.join(key)}] {p}")
    print(f"      {d}")
