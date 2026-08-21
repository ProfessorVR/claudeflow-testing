#!/usr/bin/env python3
"""Survey ChromaDB rhetorical_ontology collection to catalog authors and titles."""
import json
import urllib.request
from collections import Counter

COL_ID = None

req = urllib.request.Request(
    "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections"
)
with urllib.request.urlopen(req, timeout=10) as r:
    cols = json.loads(r.read())

for c in cols:
    if c["name"] == "knowledge_chunks":
        COL_ID = c["id"]
        break

print(f"knowledge_chunks id: {COL_ID}")

# Query all chunks in rhetorical_ontology collection
body = json.dumps({
    "where": {"collection": {"$eq": "rhetorical_ontology"}},
    "limit": 5000,
    "include": ["metadatas"]
}).encode()

q = urllib.request.Request(
    f"http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections/{COL_ID}/get",
    data=body,
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(q, timeout=30) as r:
    data = json.loads(r.read())

metas = data.get("metadatas", [])
print(f"\nTotal chunks in rhetorical_ontology: {len(metas)}")

author_counts = Counter(m.get("author_raw", "UNKNOWN") for m in metas)
title_counts = Counter(m.get("title_raw", "UNKNOWN") for m in metas)

print("\n=== Authors in rhetorical_ontology ===")
for author, count in author_counts.most_common():
    print(f"  {count:5d}  {author}")

print("\n=== Titles in rhetorical_ontology ===")
for title, count in title_counts.most_common():
    print(f"  {count:5d}  {title}")

# Also inspect other collections
print("\n=== Distinct collection values across all knowledge_chunks ===")
body2 = json.dumps({"limit": 20000, "include": ["metadatas"]}).encode()
q2 = urllib.request.Request(
    f"http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections/{COL_ID}/get",
    data=body2,
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(q2, timeout=60) as r:
    all_data = json.loads(r.read())
all_metas = all_data.get("metadatas", [])
coll_counts = Counter(m.get("collection", "UNKNOWN") for m in all_metas)
for coll, count in coll_counts.most_common():
    print(f"  {count:5d}  {coll}")
