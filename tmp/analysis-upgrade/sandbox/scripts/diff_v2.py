#!/usr/bin/env python3
"""3-way comparison: v1 (live+cap=1) vs v2 (sandbox+cap=1) vs v3 (sandbox+cap=5)."""
import json, re, sys
from pathlib import Path
from collections import Counter

SANDBOX = Path(__file__).resolve().parents[1]
TESTS = SANDBOX / "tests"

def load(name):
    p = TESTS / f"v2-{name}.json"
    if not p.exists() or p.stat().st_size == 0:
        return None, ""
    j = json.loads(p.read_text())
    return j, j.get("result", {}).get("content", "")

def metrics(j, text, label):
    words = re.findall(r"\b[A-Za-z][A-Za-z'-]*\b", text)
    cites = re.findall(r"\b([A-Z][a-zA-Z]+)\s*(?:\(|,?\s*)(\d{4}[a-z]?)\b", text)
    cite_authors = Counter(a for a, _ in cites)
    bekker = re.findall(r"\b\d{3,4}[ab]\d*", text)
    greek = re.findall(r"[α-ωΑ-Ω][α-ωΑ-Ωῖῆῶάέήίόύώᾶἀἁἐἑἠἡἰἱὀὁὐὑὠὡῤῥ]{2,}", text)
    sources = (j or {}).get("provenanceLedger",{}).get("sources",[])
    src_auth = Counter()
    for s in sources:
        m = re.match(r"([A-Z][a-zA-Z]+)", s.get("title",""))
        if m: src_auth[m.group(1)] += 1
    secondary = {"Nussbaum","Frede","Burnyeat","Wedin","Caston","Schofield","Hawhee","Rickert","Hamlyn","Bowin","Papachristou","Gonzalez"}
    return {
        "label": label,
        "chars": len(text),
        "words": len(words),
        "quality": (j or {}).get("qualityScore", 0),
        "nussbaum": len(re.findall(r"\bNussbaum\b", text, re.I)),
        "wedin":    len(re.findall(r"\bWedin\b", text, re.I)),
        "uexkull":  len(re.findall(r"\b[Uu]exk[üu]ll\b", text)),
        "merkbild": len(re.findall(r"\bMerkbild\b", text, re.I)),
        "seeing_as":len(re.findall(r"\bseeing[-\s]as\b", text, re.I)),
        "greek_unique": len(set(greek)),
        "bekker_unique": len(set(bekker)),
        "distinct_authors_cited": len(cite_authors),
        "secondary_lit_citations": sum(cite_authors[a] for a in secondary if a in cite_authors),
        "source_authors": dict(src_auth),
    }

def main():
    variants = [("v1-baseline","v1 live+cap1"),("v2-sandbox-cap1","v2 sandbox+cap1"),("v3-sandbox-cap5","v3 sandbox+cap5")]
    results = []
    for key, label in variants:
        j, t = load(key)
        if j is None:
            print(f"MISSING {key}")
            continue
        results.append(metrics(j, t, label))

    cols = [r["label"] for r in results]
    rows = ["chars","words","quality","nussbaum","wedin","uexkull","merkbild","seeing_as","greek_unique","bekker_unique","distinct_authors_cited","secondary_lit_citations"]
    print(f"{'METRIC':<28}" + "".join(f"{c:>17}" for c in cols))
    print("-" * (28 + 17*len(cols)))
    for r in rows:
        vals = [res[r] for res in results]
        line = f"{r:<28}" + "".join(f"{str(v):>17}" for v in vals)
        print(line)

    print("\n=== Source authors ===")
    all_auth = sorted(set().union(*(set(r["source_authors"].keys()) for r in results)))
    for a in all_auth:
        print(f"  {a:<20} " + " ".join(f"{r['source_authors'].get(a,0):>3}" for r in results))

    # Write MD
    out = TESTS / "comparison-v2-summary.md"
    with open(out, "w") as f:
        f.write("# god-write 3-way A/B/C: Phase-6 cap raise validation\n\n")
        f.write(f"**Prompt:** Nussbaum-targeted secondary-lit question.\n\n")
        f.write(f"## Metrics\n\n| Metric | v1 live+cap1 | v2 sandbox+cap1 | v3 sandbox+cap5 |\n|---|---:|---:|---:|\n")
        for r in rows:
            vals = [res[r] for res in results]
            f.write(f"| {r} | {vals[0] if len(vals)>0 else '—'} | {vals[1] if len(vals)>1 else '—'} | {vals[2] if len(vals)>2 else '—'} |\n")
        for res in results:
            j, t = load(res["label"].split()[0])
            if j:
                f.write(f"\n## {res['label']} — first 3500 chars\n\n```\n{t[:3500]}\n```\n")
    print(f"\nWrote {out}")

if __name__ == "__main__":
    main()
