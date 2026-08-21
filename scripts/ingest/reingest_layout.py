"""
Re-ingest documents that need layout-aware extraction.

Targets documents that were originally ingested with plain pdftotext
but have rotated or multi-column pages (detected by LayoutAnalyzer).

Usage:
    python3 scripts/ingest/reingest_layout.py [--dry-run] [--doc-id DOC_ID]

Requires:
    - Embedding service running on localhost:8000
    - ChromaDB persistent store at vector_db_1536/
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure ingest modules are importable
sys.path.insert(0, str(Path(__file__).parent))

import fitz
import requests
import chromadb
from chromadb.config import Settings

from layout_analyzer import LayoutAnalyzer, PageLayout
from run_ingest_phase2 import (
    Chunk,
    clean_corpus_text,
    embed_texts,
    page_paragraphs,
    parse_filename_metadata,
    CHROMA_DIR,
    CHROMA_COLLECTION,
    CLEANING_VERSION,
    TARGET_MIN_TOKENS,
    TARGET_MAX_TOKENS,
    HARD_MAX_TOKENS,
    EMBED_BATCH_SIZE,
    est_tokens,
)


MANIFEST_PATH = Path(__file__).parent / "manifest.jsonl"
EMBED_URL = os.getenv("EMBED_URL", "http://localhost:8000")


def load_manifest() -> List[Dict[str, Any]]:
    entries = []
    with open(MANIFEST_PATH, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    return entries


def save_manifest(entries: List[Dict[str, Any]]):
    with open(MANIFEST_PATH, "w") as f:
        for entry in entries:
            f.write(json.dumps(entry, default=str) + "\n")


def chunk_paragraphs_page_aware(doc_id: str, paragraphs: List[Tuple[int, str]]) -> List[Chunk]:
    """Chunk paragraphs with page-awareness (copied from run_ingest_phase2)."""
    chunks: List[Chunk] = []
    cur_texts: List[str] = []
    cur_pages: List[int] = []
    cur_tokens = 0

    def flush():
        nonlocal cur_texts, cur_pages, cur_tokens
        if not cur_texts:
            return
        idx = len(chunks)
        raw_text = "\n\n".join(cur_texts)
        cleaned = clean_corpus_text(raw_text)
        cid = f"{doc_id}:{idx:05d}"
        ps = min(cur_pages) if cur_pages else None
        pe = max(cur_pages) if cur_pages else None
        chunks.append(Chunk(cid, idx, cleaned, ps, pe, raw_text=raw_text))
        cur_texts = []
        cur_pages = []
        cur_tokens = 0

    for page_no, para in paragraphs:
        t = est_tokens(para)
        if cur_texts and (cur_tokens >= TARGET_MIN_TOKENS) and (cur_tokens + t > TARGET_MAX_TOKENS):
            flush()
        cur_texts.append(para)
        cur_pages.append(page_no)
        cur_tokens += t
        if cur_tokens >= HARD_MAX_TOKENS:
            flush()

    flush()
    return chunks


def reingest_document(
    doc_id: str,
    path_abs: Path,
    collection: str,
    meta: Dict[str, Any],
    session: requests.Session,
    coll,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Re-ingest a single document using layout-aware extraction."""
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Processing: {path_abs.name}")
    print(f"  doc_id: {doc_id}")

    t0 = time.time()

    # Step 1: Layout analysis
    analyzer = LayoutAnalyzer()
    doc_structure = analyzer.extract_document_structure(path_abs)

    rotated = doc_structure.rotated_pages
    multi_col = [p for p, lt in doc_structure.layout_types.items()
                 if lt.value in ('two_column', 'three_column', 'multi_column')]
    print(f"  Rotated pages: {rotated}")
    print(f"  Multi-column pages: {multi_col}")
    print(f"  Headers: {doc_structure.headers}")
    print(f"  Footers: {doc_structure.footers}")

    # Step 2: Extract text page-by-page using layout-aware extraction
    doc = fitz.open(str(path_abs))
    paragraphs: List[Tuple[int, str]] = []

    for page_num in range(len(doc)):
        text = analyzer.extract_in_reading_order(path_abs, page_num)
        paragraphs.extend(page_paragraphs(page_num + 1, text))

    doc.close()

    print(f"  Paragraphs extracted: {len(paragraphs)}")

    # Step 3: Chunk
    chunks = chunk_paragraphs_page_aware(doc_id, paragraphs)
    print(f"  Chunks: {len(chunks)}")

    if not chunks:
        print("  WARNING: No chunks produced!")
        return {"status": "failed", "error": "No chunks produced"}

    # Preview first chunk
    print(f"  Chunk 0 preview: {chunks[0].text[:200]}")

    if dry_run:
        print(f"  [DRY RUN] Would delete old chunks and upsert {len(chunks)} new chunks")
        return {
            "status": "dry_run",
            "chunks": len(chunks),
            "multi_column_pages": multi_col,
            "rotated_pages": rotated,
        }

    # Step 4: Delete old chunks from ChromaDB
    old_results = coll.get(where={"doc_id": doc_id})
    old_ids = old_results["ids"] if old_results["ids"] else []
    if old_ids:
        print(f"  Deleting {len(old_ids)} old chunks...")
        coll.delete(ids=old_ids)

    # Step 5: Embed and upsert new chunks
    ids: List[str] = []
    documents: List[str] = []
    metadatas: List[Dict[str, Any]] = []
    embeddings: List[List[float]] = []

    sha = hashlib.sha256(path_abs.read_bytes()).hexdigest()
    mtime = path_abs.stat().st_mtime

    def flush_batch():
        nonlocal ids, documents, metadatas, embeddings
        if not ids:
            return
        coll.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        ids, documents, metadatas, embeddings = [], [], [], []

    for i in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch = chunks[i : i + EMBED_BATCH_SIZE]
        texts = [c.text for c in batch]
        vecs = embed_texts(texts, session)

        for c, v in zip(batch, vecs):
            clean_sha256 = hashlib.sha256(c.text.encode("utf-8")).hexdigest()
            raw_sha256 = (
                hashlib.sha256(c.raw_text.encode("utf-8")).hexdigest()
                if c.raw_text is not None
                else clean_sha256
            )

            chunk_metadata = {
                "doc_id": doc_id,
                "chunk_index": c.chunk_index,
                "path_abs": str(path_abs),
                "path_rel": str(path_abs.relative_to(path_abs.parent.parent)),
                "collection": collection,
                "sha256": sha,
                "mtime": mtime,
                "page_start": c.page_start,
                "page_end": c.page_end,
                "cleaning_version": CLEANING_VERSION,
                "raw_sha256": raw_sha256,
                "clean_sha256": clean_sha256,
                "content_type": "text",
                "source_method": "layout_aware",
                "is_table": False,
                "is_image": False,
                **meta,
            }

            if c.raw_text is not None and c.raw_text != c.text:
                chunk_metadata["raw_content"] = c.raw_text

            ids.append(c.chunk_id)
            documents.append(c.text)
            metadatas.append(chunk_metadata)
            embeddings.append(v)

        flush_batch()
        print(f"  Embedded+upserted {min(i + EMBED_BATCH_SIZE, len(chunks))}/{len(chunks)}")

    elapsed = time.time() - t0
    print(f"  Done in {elapsed:.1f}s")

    return {
        "status": "ok",
        "chunks": len(chunks),
        "multi_column_pages": multi_col,
        "rotated_pages": rotated,
        "old_chunks_deleted": len(old_ids),
        "elapsed": elapsed,
    }


def main():
    ap = argparse.ArgumentParser(description="Re-ingest documents using layout-aware extraction.")
    ap.add_argument("--dry-run", action="store_true", help="Analyze only, don't modify ChromaDB")
    ap.add_argument("--doc-id", help="Re-ingest a specific doc_id only")
    ap.add_argument("--all-pdftotext", action="store_true",
                    help="Re-ingest ALL documents that used plain pdftotext extraction")
    args = ap.parse_args()

    # Verify embedding service
    try:
        r = requests.get(EMBED_URL, timeout=5)
        print(f"Embedding service: {r.json().get('status', 'unknown')}")
    except Exception as e:
        if not args.dry_run:
            print(f"ERROR: Embedding service not available at {EMBED_URL}: {e}")
            print("Start it with: ./scripts/god-launch start")
            return 1
        else:
            print(f"WARNING: Embedding service not available (OK for dry-run)")

    # Load manifest
    manifest = load_manifest()
    print(f"Manifest entries: {len(manifest)}")

    # Find documents to re-ingest
    targets = []
    for entry in manifest:
        doc_id = entry.get("doc_id", "")

        if args.doc_id and doc_id != args.doc_id:
            continue

        if args.all_pdftotext and entry.get("extraction_method") != "pdftotext":
            continue

        # Skip non-PDF entries
        path_abs = Path(entry.get("path_abs", ""))
        if not path_abs.suffix.lower() == ".pdf":
            continue

        if not path_abs.exists():
            print(f"WARNING: File not found: {path_abs}")
            continue

        # If specific doc_id requested, always include it
        if args.doc_id:
            targets.append(entry)
            continue

        # Otherwise, check if layout analysis reveals issues
        if entry.get("extraction_method") == "pdftotext":
            # These were ingested without layout awareness — check if they need it
            analyzer = LayoutAnalyzer()
            structure = analyzer.extract_document_structure(path_abs)
            has_rotation = len(structure.rotated_pages) > 0
            has_multicol = any(lt.value != "single_column" and lt.value != "title_page"
                              for lt in structure.layout_types.values())

            if has_rotation or has_multicol:
                print(f"  NEEDS RE-INGEST: {path_abs.name} (rotation={has_rotation}, multicol={has_multicol})")
                targets.append(entry)
            else:
                print(f"  OK: {path_abs.name} (single-column, no rotation)")

    if not targets:
        print("\nNo documents need re-ingestion.")
        return 0

    print(f"\n{'='*60}")
    print(f"Documents to re-ingest: {len(targets)}")
    for t in targets:
        print(f"  - {t.get('meta', {}).get('author_raw', '?')} — {t.get('meta', {}).get('title_raw', '?')}")
    print(f"{'='*60}")

    # Connect to ChromaDB
    coll = None
    if not args.dry_run:
        client = chromadb.PersistentClient(
            path=CHROMA_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
        coll = client.get_or_create_collection(name=CHROMA_COLLECTION)

    session = requests.Session()

    # Process each target
    results = {}
    for entry in targets:
        doc_id = entry["doc_id"]
        path_abs = Path(entry["path_abs"])
        collection = entry.get("collection", "")
        meta = entry.get("meta", {})

        result = reingest_document(
            doc_id=doc_id,
            path_abs=path_abs,
            collection=collection,
            meta=meta,
            session=session,
            coll=coll,
            dry_run=args.dry_run,
        )
        results[doc_id] = result

        # Update manifest entry if successful
        if result["status"] == "ok":
            for i, m in enumerate(manifest):
                if m.get("doc_id") == doc_id:
                    manifest[i]["extraction_method"] = "layout_aware"
                    manifest[i]["multi_column_pages"] = result["multi_column_pages"]
                    manifest[i]["chunks"] = result["chunks"]
                    break

    # Save updated manifest
    if not args.dry_run:
        save_manifest(manifest)
        print("\nManifest updated.")

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    for doc_id, result in results.items():
        entry = next(e for e in targets if e["doc_id"] == doc_id)
        name = entry.get("meta", {}).get("author_raw", doc_id)
        print(f"  {name}: {result['status']} ({result.get('chunks', 0)} chunks)")
    print(f"{'='*60}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
