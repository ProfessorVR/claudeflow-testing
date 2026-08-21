#!/usr/bin/env python3
"""Inspect top dedup hits per gap result file."""
import json
import os
import re
import sys


def show_top(filename, top_n=5):
    with open(filename) as f:
        d = json.load(f)
    print(f"\n========== {filename} ==========")
    print(f"gap_id: {d.get('gap_id')} | missing_locus: {d.get('missing_locus')}")
    print(f"claim: {d.get('claim_text', '')[:300]}")
    all_hits = []
    for r in d["results"]:
        for h in r.get("hits", []):
            all_hits.append({**h, "q_label": r["label"], "q_text": r["query_text"]})
    seen = {}
    for h in all_hits:
        cid = h["id"]
        if cid not in seen or h["distance"] < seen[cid]["distance"]:
            seen[cid] = h
    dedup = sorted(seen.values(), key=lambda x: x["distance"])[:top_n]
    for i, h in enumerate(dedup):
        meta = h["metadata"]
        author = meta.get("author") or meta.get("author_raw") or "?"
        year = meta.get("year") or "?"
        pgs = f"pp.{meta.get('page_start','?')}-{meta.get('page_end','?')}"
        title = (meta.get("title") or meta.get("title_raw") or meta.get("source_pdf_filename") or "?")[:80]
        chunk = meta.get("chunk_index", "?")
        text = re.sub(r"\s+", " ", h["document"] or "").strip()
        print(f"\n  ## Hit {i+1} | dist={h['distance']:.4f} | q_label={h['q_label']}")
        print(f"  source: {author} ({year}) — {title}")
        print(f"  loc:    {pgs} chunk={chunk}")
        print(f"  text:   {text[:1200]}")
        if len(text) > 1200:
            print(f"  ...({len(text)-1200} more chars)")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    results_dir = os.path.join(os.path.dirname(__file__), "results")
    if target:
        show_top(os.path.join(results_dir, target), top_n=top_n)
    else:
        for f in sorted(os.listdir(results_dir)):
            if f == "_all.json" or f.startswith("deep-"):
                continue
            show_top(os.path.join(results_dir, f), top_n=top_n)
