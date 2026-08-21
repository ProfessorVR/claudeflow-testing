"""
Fix Phase 9 linkage: add IDs to KUs, add knowledge_ids to reasoning edges.

Strategy:
- Assign stable IDs to each KU based on claim hash
- For each reasoning edge, check if source or target concept appears in any KU claim
- Add matching KU IDs to the edge's knowledge_ids field
"""
import json, hashlib, re
from pathlib import Path

KU_PATH = Path("god-learn/knowledge.jsonl")
EDGE_PATH = Path("god-learn/reasoning.jsonl")
EDGE_OUT_PATH = Path("god-reason/reasoning.jsonl")

# Step 1: Load and ID the KUs
kus = []
with open(KU_PATH) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        ku = json.loads(line)
        # Generate stable ID from claim text
        claim = ku.get("claim", "")
        ku_id = "ku_" + hashlib.md5(claim.encode()).hexdigest()[:10]
        ku["id"] = ku_id
        kus.append(ku)

# Write back KUs with IDs
with open(KU_PATH, "w") as f:
    for ku in kus:
        f.write(json.dumps(ku) + "\n")

print(f"KUs with IDs: {len(kus)}")
for ku in kus:
    print(f"  {ku['id']}: {ku['claim'][:80]}...")

# Step 2: Build concept-to-KU index
# Extract key concepts from each KU claim for matching
def extract_concepts(text):
    """Extract key concepts from a claim for fuzzy matching."""
    text = text.lower()
    # Remove common words
    stopwords = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
                 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
                 'from', 'as', 'into', 'through', 'during', 'before', 'after',
                 'above', 'below', 'between', 'but', 'and', 'or', 'not', 'no',
                 'nor', 'so', 'yet', 'both', 'each', 'every', 'all', 'any',
                 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too',
                 'very', 'just', 'also', 'it', 'its', 'that', 'this', 'those',
                 'these', 'he', 'she', 'they', 'them', 'his', 'her', 'their',
                 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
                 'if', 'then', 'else', 'while', 'until', 'because', 'although'}
    words = re.findall(r'[a-zäöüß_-]+', text)
    return set(w for w in words if len(w) > 2 and w not in stopwords)

ku_concept_index = {}
for ku in kus:
    concepts = extract_concepts(ku["claim"])
    ku_concept_index[ku["id"]] = concepts

# Step 3: Load edges and add knowledge_ids
edges = []
with open(EDGE_PATH) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        edges.append(json.loads(line))

linked = 0
for edge in edges:
    source = edge.get("source", "").lower().replace("_", " ").replace("-", " ")
    target = edge.get("target", "").lower().replace("_", " ").replace("-", " ")
    note = edge.get("note", "").lower() if edge.get("note") else ""

    # Build edge concept set from source + target + note
    edge_concepts = set()
    for term in [source, target]:
        # Add full term and individual words
        edge_concepts.add(term)
        edge_concepts.update(term.split())
    if note:
        edge_concepts.update(extract_concepts(note))

    # Find matching KUs
    matching_ku_ids = []
    for ku in kus:
        ku_concepts = ku_concept_index[ku["id"]]
        ku_claim_lower = ku["claim"].lower()

        # Match if: source or target appears in KU claim, or significant concept overlap
        source_in_claim = source in ku_claim_lower
        target_in_claim = target in ku_claim_lower

        # Also check individual words from source/target
        source_words = set(source.split())
        target_words = set(target.split())
        source_word_match = len(source_words & ku_concepts) >= max(1, len(source_words) * 0.5)
        target_word_match = len(target_words & ku_concepts) >= max(1, len(target_words) * 0.5)

        if source_in_claim or target_in_claim or (source_word_match and target_word_match):
            matching_ku_ids.append(ku["id"])

    if matching_ku_ids:
        edge["knowledge_ids"] = matching_ku_ids
        linked += 1

# Write edges with knowledge_ids to both locations
for out_path in [EDGE_PATH, EDGE_OUT_PATH]:
    with open(out_path, "w") as f:
        for edge in edges:
            f.write(json.dumps(edge) + "\n")

print(f"\nEdges total: {len(edges)}")
print(f"Edges linked to KUs: {linked} ({linked*100//len(edges)}%)")

# Show distribution
kid_counts = {}
for edge in edges:
    n = len(edge.get("knowledge_ids", []))
    kid_counts[n] = kid_counts.get(n, 0) + 1
print(f"\nEdge-to-KU link distribution:")
for n in sorted(kid_counts.keys()):
    print(f"  {n} KUs: {kid_counts[n]} edges")
