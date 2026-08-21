#!/usr/bin/env python3
"""Fetch full text of Physics chunk b811388f4f1d7863:00044 and neighbors."""
import json, urllib.request

BASE = "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database"

def http_get(url):
    with urllib.request.urlopen(urllib.request.Request(url), timeout=15) as r:
        return json.loads(r.read())

def http_post(url, body):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

cols = http_get(f"{BASE}/collections")
col_id = next(c["id"] for c in cols if c["name"] == "knowledge_chunks")

ids = [f"b811388f4f1d7863:{n:05d}" for n in (42, 43, 44, 45, 46)]
r = http_post(f"{BASE}/collections/{col_id}/get",
              {"ids": ids, "include": ["metadatas", "documents"]})

for cid, doc, m in zip(r.get("ids", []), r.get("documents", []), r.get("metadatas", [])):
    pg = m.get("page_start") or m.get("page") or "?"
    print(f"\n{'='*78}\nID {cid}  page {pg}\n{'='*78}")
    print(doc)
