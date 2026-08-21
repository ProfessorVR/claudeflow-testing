"""Apply the 4 manual adjudication decisions, then run T3 diagnostics.
Outputs: 03-coded-corpus.csv (updated) · t3-stats.md · exemplar-candidates.md
"""
import csv, os
from collections import Counter, defaultdict

BASE = "tmp/Dissertation/Part_III/survey-analysis"
DECISIONS = {  # (rcode,item): (add, remove)
    ("W26-R023", "Q9"): ({"A5-WITHDRAWN"}, set()),
    ("W26-R036", "Q6"): (set(), {"A1.other"}),
    ("W26-R049", "Q6"): ({"B2-MINIMAL"}, set()),
    ("W26-R055", "Q9"): (set(), {"A1.other"}),
}

rows = list(csv.DictReader(open(f"{BASE}/03-coded-corpus.csv", encoding="utf-8")))
for r in rows:
    key = (r["rcode"], r["item"])
    if key in DECISIONS:
        add, rem = DECISIONS[key]
        codes = set(c for c in r["codes"].split(";") if c) | add
        codes -= rem
        r["codes"] = ";".join(sorted(codes))
        r["disputed"] = ""
with open(f"{BASE}/03-coded-corpus.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)

texts = {(r["rcode"], r["item"]): r["text"] for r in csv.DictReader(open(f"{BASE}/data/open_text.csv", encoding="utf-8"))}
resp = {r["rcode"]: r for r in csv.DictReader(open(f"{BASE}/data/respondents.csv", encoding="utf-8"))}

def norm_q8(v):
    v = (v or "").strip().lower()
    if "youtube" in v: return "VID"
    if v.startswith("yes") or v.startswith("no"): return "APP"
    return "UNK"
strat = {rc: norm_q8(r["q8"]) for rc, r in resp.items()}
q8val = {rc: ("Yes" if (r["q8"] or "").strip().lower().startswith("yes") else
              ("VID-only" if "youtube" in (r["q8"] or "").lower() else
               ("No" if (r["q8"] or "").strip().lower().startswith("no") else "blank")))
         for rc, r in resp.items()}

def codes_of(r): return [c for c in r["codes"].split(";") if c]

TERMS = ["W25", "S25", "W26"]
out = ["# T3 Diagnostics — coded-corpus statistics (post-adjudication)\n"]

# 1. code counts by term
cnt_term = defaultdict(Counter)
cnt_strat = defaultdict(Counter)
n_strat = Counter()
for r in rows:
    s = strat.get(r["rcode"], "UNK")
    n_strat[s] += 1
    for c in codes_of(r):
        cnt_term[c][r["term"]] += 1
        cnt_strat[c][s] += 1
tot = Counter()
for c in cnt_term: tot[c] = sum(cnt_term[c].values())
out.append("## Code counts (total | W25/S25/W26 | per-100-responses APP vs VID)")
napp, nvid = n_strat["APP"], n_strat["VID"]
for c, t in tot.most_common():
    ct = cnt_term[c]; cs = cnt_strat[c]
    ra = 100 * cs["APP"] / max(napp, 1); rv = 100 * cs["VID"] / max(nvid, 1)
    out.append(f"- `{c}`: {t} | {ct['W25']}/{ct['S25']}/{ct['W26']} | APP {ra:.1f} vs VID {rv:.1f}")
out.append(f"\n(responses by stratum: APP {napp} · VID {nvid} · UNK {n_strat['UNK']})")

# 2. friction-prediction scorecard
out.append("\n## Friction-prediction scorecard (Wendt bme-vle-read predictions vs complaints)")
PRED = {"A1.dark": "dark rooms / legibility", "A1.occl": "avatar occlusion", "A1.prox": "must-stand-close",
        "A1.lag": "buffer latency / performance", "A1.nav": "wayfinding/navigation"}
for c, label in PRED.items():
    n = tot.get(c, 0)
    verdict = "CONFIRMED" if n >= 5 else ("WEAKLY ATTESTED" if n >= 1 else "UNATTESTED")
    out.append(f"- {label} (`{c}`): {n} complaints → **{verdict}**")
out.append("- Unpredicted-but-found frictions: " + ", ".join(
    f"`{c}`={tot.get(c,0)}" for c in ("A1.crash", "A1.install", "A1.hw", "A1.other") if tot.get(c, 0)))

# 3. DIV register
out.append("\n## DIV-candidate register (A4-DIV, full)")
for r in rows:
    if "A4-DIV" in codes_of(r):
        rc = r["rcode"]
        out.append(f"- **{rc}/{r['item']}** (Q8={q8val.get(rc,'?')}, {strat.get(rc,'?')}): \"{texts.get((rc, r['item']), '')[:220]}\"")

# 4. Wendt node scorecard (D-family with A co-occur = foreclosure evidence; F co-occur = afford)
out.append("\n## Wendt node scorecard (D-code count | co-occur A-family | co-occur F-family)")
for d in ("D0-A0A1", "D1-A2", "D2-A3", "D3-A3A4", "D4-LOOP"):
    n = tot.get(d, 0); wa = wf = 0
    for r in rows:
        cs = codes_of(r)
        if d in cs:
            if any(c.startswith("A") for c in cs): wa += 1
            if any(c.startswith("F") for c in cs): wf += 1
    out.append(f"- `{d}`: {n} | with-A {wa} | with-F {wf}")

# 5. co-occurrences of interest
out.append("\n## Selected co-occurrences")
pairs = [("A1.lag", "B1-FALLBACK"), ("A1.install", "B1-FALLBACK"), ("A1.crash", "B1-FALLBACK"),
         ("A3-MONOTONY", "D1-A2"), ("A3-MONOTONY", "C3-LENGTH"), ("F1-PRESENCE", "D2-A3"),
         ("H-NEW-skeptic", "B1-FALLBACK"), ("A1.nav", "G5-GUIDE")]
for a, b in pairs:
    n = sum(1 for r in rows if a in codes_of(r) and b in codes_of(r))
    out.append(f"- `{a}` ∧ `{b}`: {n}")

# 6. E-SHA fade + emergent inventory
out.append("\n## Channel mentions by term (E-family)")
for e in ("E-SHA", "E-SPA", "E-KIN", "E-NAR", "E-AFF", "E-LUD"):
    ct = cnt_term[e]
    out.append(f"- `{e}`: W25 {ct['W25']} · S25 {ct['S25']} · W26 {ct['W26']}")
out.append("\n## Emergent (H-NEW-*) inventory")
for c, t in tot.most_common():
    if c.startswith("H-NEW"):
        exemplar = next((texts[(r['rcode'], r['item'])][:120] for r in rows if c in codes_of(r)), "")
        out.append(f"- `{c}`: {t} — e.g. \"{exemplar}\"")

open(f"{BASE}/t3-stats.md", "w", encoding="utf-8").write("\n".join(out) + "\n")

# 7. exemplar candidates (up to 3 per key code, shortest evidence-bearing first)
KEY = ["A1.lag", "A1.crash", "A1.install", "A1.nav", "A1.hw", "A1.dark", "A3-MONOTONY", "A4-DIV", "A5-WITHDRAWN",
       "B1-FALLBACK", "B2-MINIMAL", "C1-DRAG", "C3-LENGTH", "D2-A3", "D3-A3A4", "E-SHA",
       "F1-PRESENCE", "F2-WORLD", "F3-CARRY", "G1-PROVISION", "G4-INTERACT", "G5-GUIDE", "H-NEW-skeptic"]
ex = ["# Exemplar candidates (auto-drawn; curate into 04-exemplar-bank.md)\n"]
for c in KEY:
    cands = [(len(texts.get((r["rcode"], r["item"]), "")), r) for r in rows if c in codes_of(r)]
    cands.sort(key=lambda x: x[0])
    ex.append(f"## {c}")
    for _, r in cands[:3]:
        ex.append(f"- {r['rcode']}/{r['item']}: \"{texts.get((r['rcode'], r['item']), '')[:260]}\"")
open(f"{BASE}/exemplar-candidates.md", "w", encoding="utf-8").write("\n".join(ex) + "\n")
print("applied 4 decisions; wrote t3-stats.md + exemplar-candidates.md")
