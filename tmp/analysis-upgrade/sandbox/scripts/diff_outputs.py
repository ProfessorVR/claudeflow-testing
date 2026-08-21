#!/usr/bin/env python3
"""Compare baseline vs upgraded god-write outputs. Extract prose from result.content."""
import json, re
from pathlib import Path
from collections import Counter

SANDBOX = Path(__file__).resolve().parents[1]
TESTS = SANDBOX / "tests"

def extract(p):
    j = json.loads(p.read_text())
    prose = j.get("result", {}).get("content", "")
    return j, prose

def metrics(text, sources, label):
    words = re.findall(r"\b[A-Za-z][A-Za-z'-]*\b", text)
    # Citations in author-year form
    cites_by_authoryear = re.findall(r"\b([A-Z][a-zA-Z]+)\s*(?:\(|,?\s*)(\d{4}[a-z]?)\b", text)
    cite_authors = Counter(a for a, _ in cites_by_authoryear)
    # Bekker
    bekker = re.findall(r"\b\d{3,4}[ab]\d*", text)
    # Greek terms
    greek = re.findall(r"[α-ωΑ-Ω][α-ωΑ-Ωῖῆῶάέήίόύώᾶἀἁἐἑἠἡἰἱὀὁὐὑὠὡῤῥ]{2,}", text)
    # sources (from provenanceLedger)
    source_authors = Counter()
    for s in sources:
        t = s.get("title","")
        m = re.match(r"([A-Z][a-zA-Z]+)", t)
        if m: source_authors[m.group(1)] += 1
    secondary_lit = {"Nussbaum","Frede","Burnyeat","Wedin","Caston","Schofield","Hawhee","O","Rickert","Gross","Hamlyn","White","Bowin","Papachristou","Gonzalez"}
    return {
        "label": label,
        "chars": len(text),
        "words": len(words),
        "sources_count": len(sources),
        "distinct_source_authors": len(source_authors),
        "source_authors": dict(source_authors),
        "secondary_lit_sources": sum(c for a, c in source_authors.items() if a in secondary_lit),
        "nussbaum_sources": source_authors.get("Nussbaum", 0),
        "in_text_citations": sum(cite_authors.values()),
        "in_text_distinct_authors": len(cite_authors),
        "nussbaum_mentions_in_text": len(re.findall(r"\bNussbaum\b", text, re.I)),
        "bekker_unique": len(set(bekker)),
        "greek_unique": len(set(greek)),
    }

def main():
    jb, before = extract(TESTS / "before-output.json")
    ja, after  = extract(TESTS / "after-output.json")
    sb = jb.get("provenanceLedger", {}).get("sources", [])
    sa = ja.get("provenanceLedger", {}).get("sources", [])

    print(f"BEFORE prose length: {len(before):,} chars ({jb.get('wordCount')} words per god-write)")
    print(f"AFTER  prose length: {len(after):,} chars ({ja.get('wordCount')} words per god-write)")
    print(f"BEFORE quality score: {jb.get('qualityScore', 0):.3f}")
    print(f"AFTER  quality score: {ja.get('qualityScore', 0):.3f}")
    print()

    mb = metrics(before, sb, "BASELINE")
    ma = metrics(after,  sa, "UPGRADED")

    rows = ["chars","words","sources_count","distinct_source_authors","secondary_lit_sources","nussbaum_sources","in_text_citations","in_text_distinct_authors","nussbaum_mentions_in_text","bekker_unique","greek_unique"]
    print(f"{'METRIC':<32} {'BASELINE':>12} {'UPGRADED':>12} {'DELTA':>10}")
    print("-" * 70)
    for r in rows:
        b, a = mb[r], ma[r]
        d = a - b
        sign = "+" if d > 0 else ""
        print(f"{r:<32} {b:>12} {a:>12} {sign}{d:>9}")

    print("\nBASELINE source authors:")
    for a, c in sorted(mb["source_authors"].items(), key=lambda x: -x[1]):
        print(f"  {c:3d}  {a}")
    print("\nUPGRADED source authors:")
    for a, c in sorted(ma["source_authors"].items(), key=lambda x: -x[1]):
        print(f"  {c:3d}  {a}")

    out = TESTS / "comparison-summary.md"
    with open(out, "w") as f:
        f.write("# god-write A/B comparison (baseline vs upgraded index)\n\n")
        f.write(f"**Prompt:** {jb.get('prompt','?')}\n\n")
        f.write(f"**Quality score:** baseline={jb.get('qualityScore', 0):.3f} · upgraded={ja.get('qualityScore', 0):.3f}\n\n")
        f.write("## Metrics\n\n| Metric | Baseline | Upgraded | Δ |\n|---|---:|---:|---:|\n")
        for r in rows:
            b, a = mb[r], ma[r]
            d = a - b
            f.write(f"| {r} | {b} | {a} | {'+' if d>0 else ''}{d} |\n")
        f.write("\n## Source-author distribution\n\n")
        f.write("| Author | Baseline | Upgraded |\n|---|---:|---:|\n")
        all_authors = sorted(set(mb["source_authors"].keys()) | set(ma["source_authors"].keys()))
        for au in all_authors:
            f.write(f"| {au} | {mb['source_authors'].get(au,0)} | {ma['source_authors'].get(au,0)} |\n")
        f.write(f"\n## Baseline prose (first 3500 chars)\n\n```\n{before[:3500]}\n```\n\n")
        f.write(f"## Upgraded prose (first 3500 chars)\n\n```\n{after[:3500]}\n```\n")
    print(f"\nFull report: {out}")

if __name__ == "__main__":
    main()
