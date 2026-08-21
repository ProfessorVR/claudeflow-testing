#!/usr/bin/env python3
"""
batch-ku-promote.py — Generate new KUs by querying ChromaDB with domain-specific
scholarly queries and extracting claims from high-relevance chunks.

Appends results to god-learn/knowledge.jsonl.

Usage:
    python scripts/batch-ku-promote.py
    python scripts/batch-ku-promote.py --dry-run
    python scripts/batch-ku-promote.py --max-per-domain 5 --min-distance 1.0
"""

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

EMBED_URL = "http://localhost:8000/embed"
CHROMA_BASE = "http://localhost:8001"
KNOWLEDGE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "god-learn",
    "knowledge.jsonl",
)

DOMAIN_QUERIES = {
    "aristotle": [
        "phantasia as distinct faculty in De Anima III",
        "aisthesis and phantasia distinction in Aristotle",
        "dynamis and energeia in Aristotle's psychology",
        "dual trace antichesis in Aristotle",
        "deliberative phantasia and practical reasoning",
        "phantasma formation and residual motion",
        "Aristotle on time perception and discrimination",
        "hexis and habituated phantasia",
    ],
    "heidegger_bt": [
        "Dasein and being-in-the-world",
        "hermeneutical-As and apophantical-As Heidegger",
        "temporality and care structure Heidegger",
        "Befindlichkeit and Stimmung attunement",
        "understanding and interpretation in Being and Time",
        "Vorhandenheit and Zuhandenheit present-at-hand",
    ],
    "heidegger_bcap": [
        "Heidegger GA 18 rhetorical ontology Aristotle",
        "pathos as Befindlichkeit Heidegger interpretation",
        "logos and being in GA 18",
        "Aristotle Rhetoric reception in Heidegger",
    ],
    "rickert": [
        "ambient rhetoric and disclosure Rickert",
        "rhetorical situation and kairos",
        "attunement and ambient persuasion",
    ],
    "uexkull": [
        "Umwelt and functional cycle von Uexkull",
        "Bedeutungslehre theory of meaning biosemiotics",
        "Merkwelt and Wirkwelt perceptual world",
        "biosemiotic sign and meaning carrier",
    ],
    "phantasia": [
        "rhetorical phantasia and image-making",
        "kinesis and chronos temporal motion",
        "resonant motion and affect in phantasia",
    ],
}

# Words to ignore when computing Jaccard similarity
STOPWORDS = frozenset(
    "a an the and or but in on of to for is are was were be been being "
    "it its that this which who whom with at by from as not no nor so "
    "if then than do does did has have had will would shall should may "
    "might can could also very more most such only just about into over "
    "after before between through during each any all both some".split()
)

# OCR boilerplate patterns to skip
OCR_BOILERPLATE_RE = re.compile(
    r"^("
    r"\d+\s*$"  # bare page numbers
    r"|[A-Z ]{10,}$"  # all-caps headers
    r"|={3,}"  # separator lines
    r"|-{3,}"
    r"|\.{3,}"
    r"|chapter\s+\d+"  # chapter headers
    r"|page\s+\d+"
    r"|downloaded from"
    r"|copyright\s"
    r"|all rights reserved"
    r"|https?://"
    r")",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def http_json(url, data=None, method="GET"):
    """Make an HTTP request and return parsed JSON."""
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            url, data=payload, method=method or "POST",
            headers={"Content-Type": "application/json"},
        )
    else:
        req = urllib.request.Request(url, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def embed_text(text):
    """Get embedding vector for a single text string."""
    result = http_json(EMBED_URL, {"texts": [text]}, method="POST")
    return result["embeddings"][0]


def find_collection_id():
    """Find the ChromaDB collection to query. Prefer 'knowledge_chunks'."""
    collections = http_json(f"{CHROMA_BASE}/api/v2/tenants/default_tenant/databases/default_database/collections")
    if not collections:
        print("ERROR: No ChromaDB collections found.", file=sys.stderr)
        sys.exit(1)

    # Prefer knowledge_chunks
    for col in collections:
        name = col.get("name", "")
        if name == "knowledge_chunks":
            return col["id"], name

    # Fall back to first collection
    col = collections[0]
    return col["id"], col.get("name", "unknown")


def query_chroma(collection_id, embedding, n_results=3):
    """Query ChromaDB and return documents, metadatas, distances."""
    url = (
        f"{CHROMA_BASE}/api/v2/tenants/default_tenant/databases/default_database"
        f"/collections/{collection_id}/query"
    )
    body = {
        "query_embeddings": [embedding],
        "n_results": n_results,
        "include": ["documents", "metadatas", "distances"],
    }
    return http_json(url, body, method="POST")


def content_words(text):
    """Extract a set of lowercase content words (no stopwords)."""
    words = set(re.findall(r"[a-z]+", text.lower()))
    return words - STOPWORDS


def jaccard(set_a, set_b):
    """Jaccard similarity between two sets."""
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)


def is_boilerplate(line):
    """Check if a line looks like OCR boilerplate."""
    stripped = line.strip()
    if not stripped:
        return True
    if len(stripped) < 8:
        return True
    if OCR_BOILERPLATE_RE.match(stripped):
        return True
    return False


def extract_claim(text):
    """
    Extract a claim from chunk text: find the most substantive 1-2 sentences,
    skipping OCR boilerplate, headers, and fragmentary text.
    """
    if not text:
        return ""

    # Split into lines, skip boilerplate
    lines = [ln.strip() for ln in text.split("\n") if not is_boilerplate(ln)]
    clean_text = " ".join(lines)

    # Normalize whitespace
    clean_text = re.sub(r"\s+", " ", clean_text).strip()

    if not clean_text:
        return ""

    # Split into sentences (simple heuristic)
    sentences = re.split(r"(?<=[.!?])\s+", clean_text)

    # Filter sentences: must be substantive scholarly prose
    def is_scholarly(sent):
        s = sent.strip()
        if len(s) < 40:  # too short to be a real claim
            return False
        if s[0].isdigit() and not any(c.isalpha() for c in s[:5]):
            return False  # starts with page/chapter number
        if re.match(r"^(BOOK|CHAPTER|PART|SECTION|INDEX|NOTES)\b", s, re.IGNORECASE):
            return False  # section header
        if re.match(r"^[A-Z\s•·\-]{8,}$", s[:30]):
            return False  # all-caps header fragment
        # Must contain at least a few content words
        words = set(re.findall(r"[a-z]+", s.lower())) - STOPWORDS
        if len(words) < 5:
            return False
        return True

    picked = []
    for sent in sentences:
        sent = sent.strip()
        if is_scholarly(sent):
            picked.append(sent)
        if len(picked) >= 2:
            break

    return " ".join(picked)


def make_ku_id(claim):
    """Generate a ku_<10-char md5 hex> ID."""
    digest = hashlib.md5(claim.encode("utf-8")).hexdigest()[:10]
    return f"ku_{digest}"


def extract_author(metadata):
    """Pull the best author name from chunk metadata."""
    for key in ("author_raw", "author", "source_author"):
        val = metadata.get(key)
        if val:
            return val
    return "Unknown"


def extract_pages(metadata):
    """Pull page numbers from chunk metadata."""
    for key in ("page", "pages", "page_number"):
        val = metadata.get(key)
        if val is not None:
            if isinstance(val, list):
                return val
            if isinstance(val, int):
                return [val]
            if isinstance(val, str) and val.isdigit():
                return [int(val)]
    return []


def load_existing_kus():
    """Load existing KUs from knowledge.jsonl for dedup."""
    kus = []
    if not os.path.exists(KNOWLEDGE_PATH):
        return kus
    with open(KNOWLEDGE_PATH, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    kus.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return kus


def is_duplicate(claim, existing_word_sets, threshold=0.5):
    """Check if claim is a duplicate of any existing KU (Jaccard > threshold)."""
    claim_words = content_words(claim)
    for existing_words in existing_word_sets:
        if jaccard(claim_words, existing_words) > threshold:
            return True
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Generate KUs from ChromaDB via domain-specific scholarly queries."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print KUs that would be created without writing to disk.",
    )
    parser.add_argument(
        "--max-per-domain",
        type=int,
        default=0,
        help="Max KUs to create per domain (0 = no limit).",
    )
    parser.add_argument(
        "--min-distance",
        type=float,
        default=1.2,
        help="Max L2 distance threshold for chunk relevance (lower = stricter). Default: 1.2",
    )
    args = parser.parse_args()

    # --- Connectivity checks ---
    print("Checking services...")
    try:
        embed_text("test")
        print("  Embedding server: OK")
    except Exception as e:
        print(f"ERROR: Cannot reach embedding server at {EMBED_URL}: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        collection_id, collection_name = find_collection_id()
        print(f"  ChromaDB: OK (collection: {collection_name}, id: {collection_id})")
    except Exception as e:
        print(f"ERROR: Cannot reach ChromaDB at {CHROMA_BASE}: {e}", file=sys.stderr)
        sys.exit(1)

    # --- Load existing KUs for dedup ---
    existing_kus = load_existing_kus()
    existing_ids = {ku["id"] for ku in existing_kus}
    existing_word_sets = [content_words(ku.get("claim", "")) for ku in existing_kus]
    print(f"Loaded {len(existing_kus)} existing KUs for dedup.\n")

    # --- Process each domain ---
    stats = {
        "queries_attempted": 0,
        "chunks_found": 0,
        "kus_created": 0,
        "duplicates_skipped": 0,
        "low_relevance_skipped": 0,
        "empty_claim_skipped": 0,
    }
    new_kus = []

    for domain, queries in DOMAIN_QUERIES.items():
        domain_count = 0
        print(f"--- Domain: {domain} ({len(queries)} queries) ---")

        for query in queries:
            if args.max_per_domain > 0 and domain_count >= args.max_per_domain:
                print(f"  [skip] Reached max-per-domain ({args.max_per_domain})")
                break

            stats["queries_attempted"] += 1
            print(f"  Query: \"{query}\"")

            try:
                embedding = embed_text(query)
            except Exception as e:
                print(f"    [error] Embedding failed: {e}")
                continue

            try:
                result = query_chroma(collection_id, embedding, n_results=3)
            except Exception as e:
                print(f"    [error] ChromaDB query failed: {e}")
                continue

            documents = result.get("documents", [[]])[0]
            metadatas = result.get("metadatas", [[]])[0]
            distances = result.get("distances", [[]])[0]

            for i, (doc, meta, dist) in enumerate(zip(documents, metadatas, distances)):
                stats["chunks_found"] += 1

                if dist > args.min_distance:
                    stats["low_relevance_skipped"] += 1
                    print(f"    chunk {i}: dist={dist:.3f} > {args.min_distance} (skip)")
                    continue

                claim = extract_claim(doc)
                if not claim or len(claim) < 30:
                    stats["empty_claim_skipped"] += 1
                    print(f"    chunk {i}: dist={dist:.3f} — empty/short claim (skip)")
                    continue

                # Dedup against existing + newly created
                if is_duplicate(claim, existing_word_sets):
                    stats["duplicates_skipped"] += 1
                    print(f"    chunk {i}: dist={dist:.3f} — duplicate (skip)")
                    continue

                # Build KU
                ku_id = make_ku_id(claim)
                if ku_id in existing_ids:
                    stats["duplicates_skipped"] += 1
                    print(f"    chunk {i}: dist={dist:.3f} — duplicate ID (skip)")
                    continue

                chunk_id = meta.get("chunk_id", meta.get("id", "unknown"))
                doc_id = meta.get("doc_id", meta.get("document_id", "unknown"))
                author = extract_author(meta)
                pages = extract_pages(meta)

                # Confidence: inversely proportional to distance
                # dist 0.0 -> 0.95, dist 1.2 -> 0.70
                confidence = round(max(0.70, 0.95 - (dist * 0.2083)), 2)

                ku = {
                    "id": ku_id,
                    "claim": claim,
                    "sources": [
                        {
                            "chunk_id": chunk_id,
                            "doc_id": doc_id,
                            "pages": pages,
                            "author": author,
                        }
                    ],
                    "confidence": confidence,
                    "domain": domain,
                    "created_from_query": query,
                }

                new_kus.append(ku)
                existing_ids.add(ku_id)
                existing_word_sets.append(content_words(claim))
                domain_count += 1
                stats["kus_created"] += 1

                preview = claim[:80] + ("..." if len(claim) > 80 else "")
                print(f"    chunk {i}: dist={dist:.3f} — NEW KU {ku_id}")
                print(f"             \"{preview}\"")

                if args.max_per_domain > 0 and domain_count >= args.max_per_domain:
                    break

        print()

    # --- Write results ---
    if new_kus and not args.dry_run:
        os.makedirs(os.path.dirname(KNOWLEDGE_PATH), exist_ok=True)
        with open(KNOWLEDGE_PATH, "a") as f:
            for ku in new_kus:
                f.write(json.dumps(ku) + "\n")
        print(f"Appended {len(new_kus)} KUs to {KNOWLEDGE_PATH}")
    elif new_kus and args.dry_run:
        print("[DRY RUN] Would append these KUs:")
        for ku in new_kus:
            print(f"  {ku['id']}  [{ku['domain']}]  {ku['claim'][:70]}...")
        print(f"\n[DRY RUN] {len(new_kus)} KUs would be written to {KNOWLEDGE_PATH}")
    else:
        print("No new KUs to write.")

    # --- Summary ---
    print("\n=== Summary ===")
    print(f"  Queries attempted:      {stats['queries_attempted']}")
    print(f"  Chunks found:           {stats['chunks_found']}")
    print(f"  KUs created:            {stats['kus_created']}")
    print(f"  Duplicates skipped:     {stats['duplicates_skipped']}")
    print(f"  Low relevance skipped:  {stats['low_relevance_skipped']}")
    print(f"  Empty/short skipped:    {stats['empty_claim_skipped']}")


if __name__ == "__main__":
    main()
