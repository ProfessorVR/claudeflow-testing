#!/usr/bin/env python3
"""Pull full text of candidate chunks for the 'moved mover as patient and agent' passage."""
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

# Physics chunks around V.2 / III.3 / VIII.5, and DA III.10 / II.5
ids = [
    "b811388f4f1d7863:00022",  # Physics III.3 (202a) area
    "b811388f4f1d7863:00023",
    "b811388f4f1d7863:00024",
    "b811388f4f1d7863:00051",  # p.69 — the agent/patient hit
    "b811388f4f1d7863:00052",
    "8662a2c3d5da7ce2:00018",  # DA II.5
    "8662a2c3d5da7ce2:00019",
    "8662a2c3d5da7ce2:00038",  # DA III.10 area
    "8662a2c3d5da7ce2:00039",
    "8662a2c3d5da7ce2:00040",
    "8662a2c3d5da7ce2:00041",
]

r = http_post(f"{BASE}/collections/{col_id}/get",
              {"ids": ids, "include": ["metadatas", "documents"]})

for cid, doc, m in zip(r.get("ids", []), r.get("documents", []), r.get("metadatas", [])):
    title = m.get("title_raw","?"); pg = m.get("page_start") or m.get("page") or "?"
    print(f"\n{'='*78}\nID {cid}  [{title} / p.{pg}]\n{'='*78}")
    print(doc[:4000])
