import csv, json, hashlib

edges = []

def edge_id(source, relation, target, pipeline):
    h = hashlib.md5(f"{source}|{relation}|{target}|{pipeline}".encode()).hexdigest()[:12]
    return f"edge_{h}"

# 1. Phantasia (source,relation,target,domain,units,confidence,chapter)
with open("phantasia-analysis/global-edges.csv") as f:
    for row in csv.DictReader(f):
        edges.append({
            "id": edge_id(row["source"], row["relation"], row["target"], "phantasia"),
            "source": row["source"].strip(),
            "relation": row["relation"].strip(),
            "target": row["target"].strip(),
            "domain": row["domain"].strip(),
            "confidence": row.get("confidence","medium").strip(),
            "pipeline": "phantasia",
            "units": row.get("units","").strip(),
            "chapter": row.get("chapter","").strip(),
        })

# 2. Rickert (source,relation,edge_domain,target,note,chapters)
with open("corpus/index/Rickert - Ambient Rhetoric/rickert-analysis/global-edges.csv") as f:
    for row in csv.DictReader(f):
        edges.append({
            "id": edge_id(row["source"], row["relation"], row["target"], "rickert"),
            "source": row["source"].strip(),
            "relation": row["relation"].strip(),
            "target": row["target"].strip(),
            "domain": row.get("edge_domain","").strip(),
            "confidence": "high",
            "pipeline": "rickert",
            "note": row.get("note","").strip(),
            "chapters": row.get("chapters","").strip(),
        })

# 3. B&T (source,target,relation,edge_domain,units,note)
with open("corpus/index/Heidegger - Being and Time/bt-analysis/global-edges.csv") as f:
    for row in csv.DictReader(f):
        edges.append({
            "id": edge_id(row["source"], row["relation"], row["target"], "bt"),
            "source": row["source"].strip(),
            "relation": row["relation"].strip(),
            "target": row["target"].strip(),
            "domain": row.get("edge_domain","").strip(),
            "confidence": "high",
            "pipeline": "bt",
            "units": row.get("units","").strip(),
            "note": row.get("note","").strip(),
        })

# 4. BCAP (source,relation,target,edge_domain,note,units)
with open("corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/global-edges.csv") as f:
    for row in csv.DictReader(f):
        edges.append({
            "id": edge_id(row["source"], row["relation"], row["target"], "bcap"),
            "source": row["source"].strip(),
            "relation": row["relation"].strip(),
            "target": row["target"].strip(),
            "domain": row.get("edge_domain","").strip(),
            "confidence": "high",
            "pipeline": "bcap",
            "units": row.get("units","").strip(),
            "note": row.get("note","").strip(),
        })

# 5. Uexkull (source,target,relation,edge_domain,units,note)
with open("corpus/index/Von Uexkull - A Foray into the Worlds of Animals and Humans/uex-analysis/global-edges.csv") as f:
    for row in csv.DictReader(f):
        edges.append({
            "id": edge_id(row["source"], row["relation"], row["target"], "uexkull"),
            "source": row["source"].strip(),
            "relation": row["relation"].strip(),
            "target": row["target"].strip(),
            "domain": row.get("edge_domain","").strip(),
            "confidence": "high",
            "pipeline": "uexkull",
            "units": row.get("units","").strip(),
            "note": row.get("note","").strip(),
        })

# 6. Aristotle (source,target,relation,domain,weight,works,units,evidence)
with open("corpus/index/Aristotle - Complete Works/global-edges.csv") as f:
    for row in csv.DictReader(f):
        edges.append({
            "id": edge_id(row["source"], row["relation"], row["target"], "aristotle"),
            "source": row["source"].strip(),
            "relation": row["relation"].strip(),
            "target": row["target"].strip(),
            "domain": row.get("domain","").strip(),
            "confidence": "high",
            "pipeline": "aristotle",
            "units": row.get("units","").strip(),
            "works": row.get("works","").strip(),
            "evidence": row.get("evidence","").strip(),
        })

# Deduplicate by id
seen = set()
deduped = []
for e in edges:
    if e["id"] not in seen:
        seen.add(e["id"])
        clean = {k: v for k, v in e.items() if v}
        deduped.append(clean)

with open("god-learn/reasoning.jsonl", "w") as f:
    for e in deduped:
        f.write(json.dumps(e) + "\n")

# Stats
pipelines = {}
for e in deduped:
    p = e.get("pipeline","unknown")
    pipelines[p] = pipelines.get(p, 0) + 1

print(f"Total edges written: {len(deduped)}")
print(f"Duplicates removed: {len(edges) - len(deduped)}")
print()
for p, c in sorted(pipelines.items()):
    print(f"  {p}: {c}")
