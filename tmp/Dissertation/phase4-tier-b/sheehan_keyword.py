#!/usr/bin/env python3
"""Manual keyword scan over all Sheehan 2015 chunks for technē / praxis / hexis content."""
import json
import re
import urllib.request

CHROMA_BASE = "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections"
DPC_ID = "b215ff2b-e3ce-4067-aa00-dc8fdc9be24c"

req = urllib.request.Request(
    f"{CHROMA_BASE}/{DPC_ID}/get",
    data=json.dumps({
        "limit": 1000,
        "include": ["metadatas", "documents"],
        "where": {"author": {"$eq": "Sheehan, Thomas"}},
    }).encode("utf-8"),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req, timeout=120) as r:
    data = json.loads(r.read())

docs = data["documents"]
metas = data["metadatas"]
print(f"Total Sheehan chunks: {len(docs)}")

# Keywords to scan
keywords = {
    "techne_praxis": [r"\btechnē\b", r"\btechne\b", r"\bpoiesis\b", r"\bpraxis\b", r"τέχνη", r"πρᾶξις"],
    "hexis": [r"\bhexis\b", r"\bhexeis\b", r"\bdisposition\b", r"ἕξις"],
    "phronesis": [r"\bphronēsis\b", r"\bphronesis\b", r"φρόνησις"],
    "habituation": [r"\bhabituat\w*\b", r"ethismos", r"ἕθος"],
    "aristotle_NE_VI": [r"NE\s*VI", r"Nicomachean\s*Ethics\s*VI", r"Eth.\s*Nic.\s*VI", r"\b1140\b", r"\b1141\b"],
    "GA18_Bewegtheit": [r"\bGA\s*18\b", r"Bewegtheit", r"Basic\s*Concepts.*Aristotelian"],
    "unreflective_action": [r"unreflect\w*", r"pre-reflect\w*", r"\bauto\w*\b", r"prereflect\w*"],
    "GA_19_sophist": [r"\bGA\s*19\b", r"Sophist", r"phronēsis"],
}

# Tally hits per chunk per category
results = []
for meta, doc in zip(metas, docs):
    text = doc or ""
    chunk_hits = {}
    for cat, pats in keywords.items():
        ct = 0
        for p in pats:
            ct += len(re.findall(p, text, flags=re.IGNORECASE))
        if ct:
            chunk_hits[cat] = ct
    total = sum(chunk_hits.values())
    if total:
        results.append((total, meta.get("chunk_index"), meta.get("page_start"), meta.get("page_end"), chunk_hits, text))

results.sort(key=lambda x: -x[0])

print("\nTop 15 Sheehan chunks by techne/praxis/hexis density:")
for total, idx, ps, pe, hits, text in results[:15]:
    print(f"\nchunk={idx} pp.{ps}-{pe} total={total}")
    print(f"  hits: {hits}")
    text_short = re.sub(r"\s+", " ", text[:600]).strip()
    print(f"  text: {text_short}")
