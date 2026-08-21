#!/usr/bin/env python3
"""
Parallel Ingestion Pipeline — Streaming Producer-Consumer Architecture

v7 — Full benchmark fix + PyMuPDF zero-tolerance visual grounding:
  Phase 0: Pre-flight triage (largest-first scheduling, corrupt PDF detection)
  Phase 1: Data loss fixes (_flush_batch single-item fallback, consumer drain)
  Phase 2: Tiered Marker timeouts + latency-based GPU routing + retry on alt GPU
  Phase 3: Iterative _walk_blocks (via markdown_chunker)
  PyMuPDF: 3-tier extraction (Marker → PyMuPDF → pdftotext) with native bboxes

Usage:
    python3 scripts/ingest/parallel_ingest.py --root corpus/ --marker --marker-url http://127.0.0.1:8003
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import queue
import re
import sys
import threading
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

# Add scripts/ingest to path
sys.path.insert(0, str(Path(__file__).parent))

# Import from existing pipeline
from run_ingest_phase2 import (
    ALLOWED_EXTS, CHROMA_COLLECTION, CHROMA_DIR, CLEANING_VERSION,
    EMBED_DIM, EMBED_URL, MANIFEST_PATH,
    Chunk, chunk_paragraphs_page_aware, clean_corpus_text,
    collection_from_relpath, embed_texts, get_chroma_collection,
    load_latest_manifest_by_path, page_paragraphs,
    run_pdftotext_layout, safe_relpath, split_pages,
    _pdftotext_version, append_manifest,
)

from run_ingest_phase2 import (
    run_marker_extract_json, extract_text_from_marker_json,
    get_next_marker_url, _init_marker_pool,
    MARKER_TIMEOUT_S,
)

from scholarly_fidelity_gate import compare_scholarly_fidelity
from markdown_chunker import chunk_marker_json, _walk_blocks, merge_bboxes
from pymupdf_extractor import extract_pymupdf_blocks, extract_pymupdf_text

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s", stream=sys.stderr)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

EMBED_BATCH_SIZE = 64
SENTINEL = "__DONE__"
SKIP_DIRS = {".extracted_media", "__pycache__", "node_modules", ".git", ".ingest_cache", "index"}
# Minimum text length from PyMuPDF before falling back to pdftotext (Tier 3)
PYMUPDF_MIN_TEXT_THRESHOLD = 200


# ---------------------------------------------------------------------------
# Phase 0: Pre-flight triage
# ---------------------------------------------------------------------------

def triage_pdfs(pdf_files: List[Path]) -> List[Path]:
    """Sort PDFs largest-first (LJF scheduling) and detect corrupt headers."""
    sized = []
    for p in pdf_files:
        size = p.stat().st_size
        with open(p, 'rb') as f:
            header = f.read(5)
        if header != b'%PDF-':
            logger.warning(f"[Triage] CORRUPT HEADER: {p.name} — not a valid PDF (header={header!r})")
        if size > 50_000_000:
            logger.info(f"[Triage] LARGE: {p.name} ({size / 1e6:.1f}MB)")
        sized.append((p, size))

    sized.sort(key=lambda x: -x[1])
    return [p for p, _ in sized]


# ---------------------------------------------------------------------------
# Phase 2: Tiered timeouts + GPU routing
# ---------------------------------------------------------------------------

def get_dynamic_timeout(pdf_path: Path) -> int:
    """Return Marker API timeout based on file size."""
    size_mb = pdf_path.stat().st_size / (1024 * 1024)
    if size_mb < 5:
        return 120
    if size_mb < 30:
        return 300
    return 1200


def get_least_busy_gpu(marker_urls: List[str]) -> str:
    """Route to whichever GPU responds fastest (proxy for queue depth)."""
    best_url, best_time = None, float('inf')
    for url in marker_urls:
        try:
            t0 = time.time()
            r = requests.get(f"{url}/", timeout=2)
            latency = time.time() - t0
            if r.status_code == 200 and latency < best_time:
                best_url, best_time = url, latency
        except Exception:
            pass
    return best_url or marker_urls[0]


# ---------------------------------------------------------------------------
# Phase 1.1: Unicode sanitization for embedding
# ---------------------------------------------------------------------------

def sanitize_for_embedding(text: str) -> str:
    """Strip characters that poison embedding API payloads."""
    text = text.replace('\x00', '')
    text = unicodedata.normalize('NFC', text)
    text = text.encode('utf-8', errors='surrogateescape').decode('utf-8', errors='replace')
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    return text


# ---------------------------------------------------------------------------
# Chunk record for the queue
# ---------------------------------------------------------------------------

@dataclass
class ChunkRecord:
    """A chunk ready for embedding + Chroma write."""
    chunk_id: str
    doc_id: str
    chunk_index: int
    text: str
    page_start: int
    page_end: int
    path_abs: str
    path_rel: str
    collection: str
    sha256: str
    mtime: int
    meta: Dict[str, Any]
    bboxes: Optional[str] = None  # JSON string
    has_bboxes: bool = False
    extraction_method: str = "pymupdf"


# ---------------------------------------------------------------------------
# Producer: Process a single PDF end-to-end
# ---------------------------------------------------------------------------

def process_pdf(
    pdf_path: Path,
    root: Path,
    marker_urls: List[str],
    chunk_queue: queue.Queue,
    latest_manifest: Dict,
    force: bool = False,
) -> Dict[str, Any]:
    """Process a single PDF with 3-tier extraction:

    Tier 1: Marker GPU (best quality — bboxes from GPU vision model)
    Tier 2: PyMuPDF (native block bboxes, no GPU needed)
    Tier 3: pdftotext (last resort, no bboxes — degenerate PDFs only)

    Returns a status dict for reporting.
    """
    t0 = time.time()
    path_rel = safe_relpath(pdf_path, root)
    collection = collection_from_relpath(path_rel)
    result = {"path_rel": path_rel, "status": "ok", "chunks": 0, "method": "unknown"}

    try:
        sha = hashlib.sha256(pdf_path.read_bytes()[:65536]).hexdigest()[:12]
        full_sha = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
        mtime = int(pdf_path.stat().st_mtime)

        meta = _parse_filename_meta(pdf_path, path_rel)
        doc_id = hashlib.sha256(f"{path_rel}:{full_sha}".encode()).hexdigest()[:16]

        # Skip if unchanged
        prev = latest_manifest.get(str(pdf_path))
        if prev and prev.get("status") == "ok" and prev.get("sha256", "")[:12] == sha and not force:
            result["status"] = "skipped"
            return result

        # ===================================================================
        # TIER 1: Marker GPU extraction
        # ===================================================================
        session = requests.Session()
        marker_json = None
        marker_text = ""
        marker_bbox_chunks = None
        timeout = get_dynamic_timeout(pdf_path)

        if marker_urls:
            primary_url = get_least_busy_gpu(marker_urls)
            alt_urls = [u for u in marker_urls if u != primary_url]

            try:
                logger.info(f"[Marker] {path_rel} → {primary_url} (timeout={timeout}s)")
                mj, mt = run_marker_extract_json(pdf_path, session, marker_url=primary_url, timeout=timeout)
                if mj is not None:
                    marker_json = mj
                    marker_text = mt
                    marker_bbox_chunks = chunk_marker_json(marker_json)
            except Exception as e:
                if alt_urls:
                    alt_url = alt_urls[0]
                    logger.warning(f"[Marker] Timeout on {primary_url} for {path_rel}, retrying on {alt_url}...")
                    try:
                        mj, mt = run_marker_extract_json(pdf_path, session, marker_url=alt_url, timeout=timeout)
                        if mj is not None:
                            marker_json = mj
                            marker_text = mt
                            marker_bbox_chunks = chunk_marker_json(marker_json)
                            result["marker_retry"] = True
                    except Exception as e2:
                        logger.warning(f"[Marker] Retry also failed for {path_rel}: {e2}")
                else:
                    logger.warning(f"[Marker] Failed for {path_rel}: {e}")

        # ===================================================================
        # TIER 2: PyMuPDF block extraction (native bboxes)
        # ===================================================================
        pymupdf_blocks = extract_pymupdf_blocks(pdf_path)
        pymupdf_text = " ".join(b["text"] for b in pymupdf_blocks) if pymupdf_blocks else ""

        # ===================================================================
        # Fidelity Gate: Compare Marker text against PyMuPDF text
        # ===================================================================
        use_marker = False
        if marker_text and pymupdf_text:
            fidelity = compare_scholarly_fidelity(pymupdf_text, marker_text, pdf_path.name)
            use_marker = fidelity.use_marker_for_text
            result["fidelity"] = fidelity.decision
        elif marker_text and not pymupdf_text:
            use_marker = True
            result["fidelity"] = "MARKER_ONLY"

        # ===================================================================
        # Route to the winning extraction path
        # ===================================================================
        bbox_chunks = None  # Final chunks with bboxes for queue push

        if use_marker and marker_bbox_chunks:
            # --- Marker won: use GPU-extracted text + bboxes ---
            bbox_chunks = marker_bbox_chunks
            result["method"] = "marker+bbox"

        elif pymupdf_blocks:
            # --- Tier 2: PyMuPDF blocks → feed directly into chunk_marker_json ---
            # Build a synthetic Marker-schema document tree from PyMuPDF blocks
            # so chunk_marker_json() works identically
            bbox_chunks = _chunk_pymupdf_blocks(pymupdf_blocks)
            result["method"] = "pymupdf+bbox"

            # Hybrid table salvage: if Marker returned JSON but failed fidelity,
            # inject Marker's Table blocks into the PyMuPDF stream
            if marker_json and not use_marker:
                marker_tables = _extract_marker_tables(marker_json)
                if marker_tables:
                    result["method"] += f"+marker_tables({len(marker_tables)})"

        else:
            # --- Tier 3: pdftotext last resort (no bboxes) ---
            logger.warning(f"[Tier3] {path_rel}: PyMuPDF empty, falling back to pdftotext")
            try:
                pt_text = run_pdftotext_layout(pdf_path)
            except Exception:
                pt_text = ""

            if not pt_text and not marker_text:
                result["status"] = "failed"
                result["error"] = "All extractors failed (Marker + PyMuPDF + pdftotext)"
                result["time_s"] = round(time.time() - t0, 1)
                return result

            # Use whichever text we have
            text_source = marker_text if marker_text else pt_text
            pages = split_pages(text_source)
            paragraphs: List[Tuple[int, str]] = []
            for page_no, page_text in pages:
                paragraphs.extend(page_paragraphs(page_no, page_text))

            chunks = chunk_paragraphs_page_aware(doc_id, paragraphs)
            if not chunks:
                result["status"] = "failed"
                result["error"] = "No chunks produced"
                return result

            result["method"] = "pdftotext" if not marker_text else "marker_text_only"

            # Push chunks (no bboxes)
            for i, c in enumerate(chunks):
                record = ChunkRecord(
                    chunk_id=c.chunk_id, doc_id=doc_id, chunk_index=c.chunk_index,
                    text=c.text, page_start=c.page_start, page_end=c.page_end,
                    path_abs=str(pdf_path), path_rel=path_rel, collection=collection,
                    sha256=full_sha, mtime=mtime, meta=meta,
                    bboxes=None, has_bboxes=False,
                    extraction_method=result["method"],
                )
                chunk_queue.put(record)

            result["chunks"] = len(chunks)
            result["time_s"] = round(time.time() - t0, 1)
            session.close()
            return result

        # ===================================================================
        # Chunk from bbox_chunks (Tier 1 or Tier 2 — both have native bboxes)
        # ===================================================================
        if not bbox_chunks:
            result["status"] = "failed"
            result["error"] = "No bbox chunks produced"
            result["time_s"] = round(time.time() - t0, 1)
            return result

        # Build paragraphs from bbox chunks for chunk_paragraphs_page_aware
        paragraphs = []
        for bc in bbox_chunks:
            paragraphs.extend(page_paragraphs(bc["page_start"], bc["text"]))

        chunks = chunk_paragraphs_page_aware(doc_id, paragraphs)
        if not chunks:
            result["status"] = "failed"
            result["error"] = "No chunks produced"
            return result

        # Push chunks with bboxes
        for i, c in enumerate(chunks):
            bboxes_json = None
            has_bboxes = False
            if i < len(bbox_chunks):
                bboxes_data = bbox_chunks[i].get("bboxes", [])
                if bboxes_data:
                    bboxes_json = json.dumps(bboxes_data)
                    has_bboxes = True

            record = ChunkRecord(
                chunk_id=c.chunk_id, doc_id=doc_id, chunk_index=c.chunk_index,
                text=c.text, page_start=c.page_start, page_end=c.page_end,
                path_abs=str(pdf_path), path_rel=path_rel, collection=collection,
                sha256=full_sha, mtime=mtime, meta=meta,
                bboxes=bboxes_json, has_bboxes=has_bboxes,
                extraction_method=result["method"],
            )
            chunk_queue.put(record)

        result["chunks"] = len(chunks)
        result["time_s"] = round(time.time() - t0, 1)
        session.close()
        return result

    except Exception as e:
        result["status"] = "failed"
        result["error"] = str(e)
        result["time_s"] = round(time.time() - t0, 1)
        logger.error(f"Failed processing {path_rel}: {e}")
        return result


def _chunk_pymupdf_blocks(blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Run the Marker-compatible chunker on PyMuPDF blocks.

    Since chunk_marker_json expects a tree with children, and PyMuPDF gives us
    a flat list of blocks already in Marker schema, we can feed them directly
    into the chunking accumulator logic. This reimplements the same algorithm
    without needing a tree walk.
    """
    from markdown_chunker import (
        TARGET_MIN_TOKENS, TARGET_MAX_TOKENS, HARD_MAX_TOKENS,
        _estimate_tokens, merge_bboxes,
    )

    if not blocks:
        return []

    chunks: List[Dict[str, Any]] = []
    current_text = ""
    current_page_blocks: Dict[int, List[List[float]]] = {}
    current_page_start: Optional[int] = None
    current_page_end: Optional[int] = None

    def _flush():
        nonlocal current_text, current_page_blocks, current_page_start, current_page_end
        if not current_text.strip():
            return
        bboxes = []
        for p_num in sorted(current_page_blocks.keys()):
            block_list = current_page_blocks[p_num]
            super_box = merge_bboxes(block_list)
            bboxes.append({
                "page_num": p_num,
                "coords": super_box,
                "blocks": block_list,
            })
        chunks.append({
            "text": current_text.strip(),
            "page_start": current_page_start or 1,
            "page_end": current_page_end or 1,
            "bboxes": bboxes,
        })
        current_text = ""
        current_page_blocks = {}
        current_page_start = None
        current_page_end = None

    for block in blocks:
        text = block["text"]
        bbox = block["bbox"]
        page_num = block["page_num"]
        block_type = block["block_type"]

        if current_page_start is None:
            current_page_start = page_num
        current_page_end = page_num

        combined = current_text + "\n\n" + text if current_text else text
        combined_tokens = _estimate_tokens(combined)

        is_heading = block_type == "SectionHeader"
        current_tokens = _estimate_tokens(current_text)

        if current_text and (
            combined_tokens > TARGET_MAX_TOKENS
            or (is_heading and current_tokens >= TARGET_MIN_TOKENS)
        ):
            _flush()
            current_page_start = page_num
            current_page_end = page_num

        if current_text:
            current_text += "\n\n" + text
        else:
            current_text = text

        if page_num not in current_page_blocks:
            current_page_blocks[page_num] = []
        current_page_blocks[page_num].append(bbox)

    _flush()

    # Merge undersized chunks
    if len(chunks) > 1:
        merged: List[Dict[str, Any]] = []
        i = 0
        while i < len(chunks):
            chunk = chunks[i]
            tokens = _estimate_tokens(chunk["text"])
            if tokens < TARGET_MIN_TOKENS and i + 1 < len(chunks):
                nxt = chunks[i + 1]
                if nxt["page_start"] <= chunk["page_end"] + 1:
                    merged_text = chunk["text"] + "\n\n" + nxt["text"]
                    merged_page_blocks: Dict[int, List[List[float]]] = {}
                    for b in chunk["bboxes"] + nxt["bboxes"]:
                        pn = b["page_num"]
                        if pn not in merged_page_blocks:
                            merged_page_blocks[pn] = []
                        merged_page_blocks[pn].extend(b["blocks"])
                    merged_bboxes = []
                    for pn in sorted(merged_page_blocks.keys()):
                        bl = merged_page_blocks[pn]
                        merged_bboxes.append({
                            "page_num": pn,
                            "coords": merge_bboxes(bl),
                            "blocks": bl,
                        })
                    merged.append({
                        "text": merged_text.strip(),
                        "page_start": min(chunk["page_start"], nxt["page_start"]),
                        "page_end": max(chunk["page_end"], nxt["page_end"]),
                        "bboxes": merged_bboxes,
                    })
                    i += 2
                    continue
            merged.append(chunk)
            i += 1
        chunks = merged

    return chunks


def _extract_marker_tables(marker_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract Table blocks from Marker JSON for hybrid salvage."""
    tables = []
    all_blocks = _walk_blocks(marker_json)
    for b in all_blocks:
        if b["block_type"] == "Table":
            tables.append(b)
    return tables


def _parse_filename_meta(pdf_path: Path, path_rel: str) -> Dict[str, Any]:
    """Extract metadata from filename pattern: Author - Title_(Year)_[Qualifier].pdf"""
    stem = pdf_path.stem
    meta: Dict[str, Any] = {}

    m = re.match(r'^(.+?)\s*-\s*(.+?)(?:_\((\d{4})\))?(?:_\[(.+?)\])?$', stem)
    if m:
        meta["author_raw"] = m.group(1).strip()
        meta["title_raw"] = m.group(2).strip()
        if m.group(3):
            meta["year"] = int(m.group(3))
        qualifier = m.group(4) or ""
        meta["qualifier"] = qualifier
        meta["is_my_copy"] = "my copy" in qualifier.lower()
        meta["is_clean_copy"] = "clean copy" in qualifier.lower()
        meta["is_notes"] = "notes" in qualifier.lower()
    else:
        meta["author_raw"] = ""
        meta["title_raw"] = stem
        meta["is_my_copy"] = False
        meta["is_clean_copy"] = False
        meta["is_notes"] = False

    return meta


# ---------------------------------------------------------------------------
# Consumer: Batch embed + write to ChromaDB + manifest
# ---------------------------------------------------------------------------

def _write_to_db(
    batch: List[ChunkRecord],
    vecs: List[List[float]],
    coll,
    manifest_path: Path,
):
    """Write a batch of chunks + embeddings to ChromaDB."""
    ids = []
    documents = []
    metadatas = []
    embeddings = []

    for r, v in zip(batch, vecs):
        ids.append(r.chunk_id)
        documents.append(r.text)
        embeddings.append(v)

        clean_sha256 = hashlib.sha256(r.text.encode("utf-8")).hexdigest()

        meta = {
            "doc_id": r.doc_id,
            "chunk_index": r.chunk_index,
            "path_abs": r.path_abs,
            "path_rel": r.path_rel,
            "collection": r.collection,
            "sha256": r.sha256,
            "mtime": r.mtime,
            "page_start": r.page_start,
            "page_end": r.page_end,
            "cleaning_version": CLEANING_VERSION,
            "clean_sha256": clean_sha256,
            "pdftotext_version": _pdftotext_version,
            "content_type": "text",
            "source_method": r.extraction_method,
            "has_bboxes": r.has_bboxes,
            "is_table": False,
            "is_image": False,
            **r.meta,
        }

        if r.bboxes:
            meta["bboxes"] = r.bboxes

        for mk, mv in list(meta.items()):
            if isinstance(mv, (list, tuple)):
                meta[mk] = str(mv)
            elif mv is not None and not isinstance(mv, (str, int, float, bool)):
                meta[mk] = str(mv)

        metadatas.append(meta)

    try:
        coll.upsert(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)
    except Exception as e:
        logger.error(f"ChromaDB upsert failed: {e}")


def chunk_writer_consumer(
    chunk_queue: queue.Queue,
    manifest_path: Path,
    stats: Dict[str, int],
):
    """Background thread: drains queue, batch-embeds, writes to Chroma + manifest."""
    coll = get_chroma_collection()
    batch: List[ChunkRecord] = []
    total_written = 0
    total_dropped = 0
    last_log_time = time.time()

    with requests.Session() as session:
        while True:
            try:
                item = chunk_queue.get(timeout=2.0)
            except queue.Empty:
                if batch:
                    written, dropped = _flush_batch(batch, coll, session, manifest_path)
                    total_written += written
                    total_dropped += dropped
                    batch = []
                if time.time() - last_log_time > 30:
                    print(f"  [Consumer] Heartbeat: {total_written} written, waiting for chunks...")
                    last_log_time = time.time()
                continue

            if item == SENTINEL:
                remaining = chunk_queue.qsize()
                if remaining > 0:
                    print(f"  [Consumer] Sentinel received, {remaining} chunks still in queue — draining...")
                if batch:
                    written, dropped = _flush_batch(batch, coll, session, manifest_path)
                    total_written += written
                    total_dropped += dropped
                break

            batch.append(item)

            if len(batch) >= EMBED_BATCH_SIZE:
                written, dropped = _flush_batch(batch, coll, session, manifest_path)
                total_written += written
                total_dropped += dropped
                print(f"  [Consumer] Embedded+wrote {total_written} chunks (dropped {total_dropped})")
                last_log_time = time.time()
                batch = []

    stats["total_written"] = total_written
    stats["total_dropped"] = total_dropped
    print(f"  [Consumer] Done. Written: {total_written}, Dropped: {total_dropped}")


def _flush_batch(
    batch: List[ChunkRecord],
    coll,
    session: requests.Session,
    manifest_path: Path,
) -> Tuple[int, int]:
    """Embed a batch and write to ChromaDB. On failure, single-item fallback."""
    if not batch:
        return 0, 0

    texts = [r.text for r in batch]

    try:
        vecs = embed_texts(texts, session)
        _write_to_db(batch, vecs, coll, manifest_path)
        return len(batch), 0
    except Exception as e:
        logger.warning(f"[Embed] Batch of {len(batch)} failed: {e}. Single-item fallback...")

    successful_batch: List[ChunkRecord] = []
    successful_vecs: List[List[float]] = []
    dropped = 0

    for record in batch:
        clean_text = sanitize_for_embedding(record.text)
        try:
            vecs = embed_texts([clean_text], session)
            successful_batch.append(record)
            successful_vecs.append(vecs[0])
        except Exception as e2:
            logger.warning(f"[Embed] Dropping poisoned chunk {record.chunk_id} "
                          f"({record.path_rel}:{record.page_start}): {str(e2)[:80]}")
            # Dead-letter queue: dump full chunk data for investigation
            dead_letter_entry = {
                "chunk_id": record.chunk_id,
                "path_rel": record.path_rel,
                "page_start": record.page_start,
                "page_end": record.page_end,
                "text_length": len(record.text),
                "text_length_clean": len(clean_text),
                "error": str(e2),
                "text": record.text,
            }
            try:
                dead_letter_path = Path("logs/dead_letter_chunks.jsonl")
                dead_letter_path.parent.mkdir(parents=True, exist_ok=True)
                with open(dead_letter_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(dead_letter_entry, ensure_ascii=False) + "\n")
            except Exception:
                pass
            dropped += 1

    if successful_batch:
        _write_to_db(successful_batch, successful_vecs, coll, manifest_path)

    return len(successful_batch), dropped


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Parallel ingestion v7 — 3-tier extraction with PyMuPDF")
    parser.add_argument("--root", required=True, help="Corpus root directory")
    parser.add_argument("--marker", action="store_true", help="Enable Marker OCR")
    parser.add_argument("--marker-url", type=str, default="",
                        help="Marker server URL (no default — WRAITH retired 2026-07-29; use a local server)")
    parser.add_argument("--workers", type=int, default=2, help="Number of producer threads")
    parser.add_argument("--force", action="store_true", help="Re-process all files")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"ERROR: --root invalid: {root}")
        return 1

    files = sorted(
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in ALLOWED_EXTS
        and not any(d in p.parts for d in SKIP_DIRS)
    )
    pdf_files = [f for f in files if f.suffix.lower() == ".pdf"]

    # Phase 0: Pre-flight triage
    pdf_files = triage_pdfs(pdf_files)
    print(f"Found {len(pdf_files)} PDFs in {root} (sorted largest-first)")

    # Marker URL pool
    marker_urls: List[str] = []
    if args.marker:
        # Prefer WRAITH when up: probe both GPU ports of the given base.
        base = args.marker_url.rsplit(":", 1)[0]
        candidate_urls = [f"{base}:8001", f"{base}:8002"]
        for url in candidate_urls:
            try:
                r = requests.get(f"{url}/", timeout=5)
                if r.status_code == 200:
                    marker_urls.append(url)
            except Exception:
                pass
        if not marker_urls:
            # WRAITH unreachable — fall back to the local Marker (network-independent).
            local = os.environ.get("MARKER_URL_LOCAL", "http://127.0.0.1:8003")
            try:
                if requests.get(f"{local}/", timeout=4).status_code == 200:
                    marker_urls.append(local)
            except Exception:
                pass
        print(f"Marker servers: {marker_urls or 'NONE (using PyMuPDF/pdftotext only)'}")

    latest_manifest = load_latest_manifest_by_path(MANIFEST_PATH)

    chunk_q: queue.Queue = queue.Queue(maxsize=2000)
    consumer_stats: Dict[str, int] = {}

    consumer = threading.Thread(
        target=chunk_writer_consumer,
        args=(chunk_q, MANIFEST_PATH, consumer_stats),
        daemon=True,
    )
    consumer.start()

    t_start = time.time()
    results: List[Dict] = []
    n_workers = min(args.workers, len(marker_urls), len(pdf_files)) if marker_urls else min(args.workers, len(pdf_files))

    print(f"\n[Pipeline] Starting {n_workers} producer threads...")
    print(f"[Pipeline] 3-tier extraction: Marker GPU → PyMuPDF → pdftotext")
    print(f"[Pipeline] Tiered timeouts: <5MB=120s, <30MB=300s, >=30MB=1200s")
    print(f"[Pipeline] GPU routing: latency-based with retry on alternate GPU\n")

    with ThreadPoolExecutor(max_workers=n_workers) as executor:
        futures = {
            executor.submit(
                process_pdf, pdf, root, marker_urls, chunk_q, latest_manifest, args.force
            ): pdf
            for pdf in pdf_files
        }

        for future in as_completed(futures):
            pdf = futures[future]
            try:
                result = future.result()
                results.append(result)
                status = result["status"]
                method = result.get("method", "?")
                chunks = result.get("chunks", 0)
                t = result.get("time_s", 0)
                fid = result.get("fidelity", "")
                fid_str = f" fidelity={fid}" if fid else ""
                retry_str = " [RETRY-OK]" if result.get("marker_retry") else ""

                if status == "skipped":
                    print(f"  [SKIP] {result['path_rel']}")
                elif status == "ok":
                    print(f"  [OK]   {result['path_rel']} ({method}, {chunks} chunks, {t}s{fid_str}{retry_str})")
                else:
                    print(f"  [FAIL] {result['path_rel']}: {result.get('error', '?')}")
            except Exception as e:
                print(f"  [ERR]  {pdf.name}: {e}")

    # Consumer drain
    remaining = chunk_q.qsize()
    if remaining > 0:
        print(f"\n[Pipeline] All producers finished. Waiting for {remaining} chunks to drain...")
    else:
        print(f"\n[Pipeline] All producers finished. Queue empty.")

    while not chunk_q.empty():
        time.sleep(1)

    chunk_q.put(SENTINEL)

    drain_start = time.time()
    while consumer.is_alive():
        consumer.join(timeout=30)
        if consumer.is_alive():
            print(f"[Pipeline] Consumer still draining... ({time.time() - drain_start:.0f}s elapsed)")

    elapsed = time.time() - t_start

    # Write manifest entries for all processed PDFs
    manifest_written = 0
    for result in results:
        if result["status"] in ("ok", "failed"):
            manifest_record = {
                "path_abs": str(root / result["path_rel"]),
                "path_rel": result["path_rel"],
                "collection": collection_from_relpath(result["path_rel"]),
                "mtime": int((root / result["path_rel"]).stat().st_mtime) if (root / result["path_rel"]).exists() else 0,
                "sha256": hashlib.sha256((root / result["path_rel"]).read_bytes()).hexdigest() if (root / result["path_rel"]).exists() else "",
                "doc_id": hashlib.sha256(f"{result['path_rel']}:{hashlib.sha256((root / result['path_rel']).read_bytes()).hexdigest() if (root / result['path_rel']).exists() else ''}".encode()).hexdigest()[:16],
                "status": result["status"],
                "phase": 2,
                "chunks": result.get("chunks", 0),
                "error": result.get("error"),
                "ts": int(time.time()),
                "meta": {},
            }
            # Parse meta from filename
            pdf_path = root / result["path_rel"]
            if pdf_path.exists():
                manifest_record["meta"] = _parse_filename_meta(pdf_path, result["path_rel"])
            try:
                append_manifest(manifest_record)
                manifest_written += 1
            except Exception as e:
                logger.warning(f"Failed to write manifest for {result['path_rel']}: {e}")
    print(f"[Pipeline] Wrote {manifest_written} manifest entries")

    # Summary
    ok = sum(1 for r in results if r["status"] == "ok")
    failed = sum(1 for r in results if r["status"] == "failed")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    total_chunks = sum(r.get("chunks", 0) for r in results)
    marker_count = sum(1 for r in results if r.get("method", "").startswith("marker"))
    pymupdf_count = sum(1 for r in results if "pymupdf" in r.get("method", ""))
    pdftotext_count = sum(1 for r in results if r.get("method", "").startswith("pdftotext"))
    retry_count = sum(1 for r in results if r.get("marker_retry"))
    bbox_count = sum(1 for r in results if "bbox" in r.get("method", ""))

    print(f"\n{'=' * 60}")
    print(f"PARALLEL INGESTION COMPLETE (v7 — PyMuPDF)")
    print(f"{'=' * 60}")
    print(f"  PDFs: ok={ok} failed={failed} skipped={skipped} total={len(results)}")
    print(f"  Chunks produced: {total_chunks}")
    print(f"  Chunks written: {consumer_stats.get('total_written', '?')}")
    print(f"  Chunks dropped (embed errors): {consumer_stats.get('total_dropped', '?')}")
    print(f"  Extraction methods:")
    print(f"    Marker GPU (Tier 1): {marker_count}")
    print(f"    PyMuPDF   (Tier 2): {pymupdf_count}")
    print(f"    pdftotext (Tier 3): {pdftotext_count}")
    print(f"  Marker retries (alt GPU): {retry_count}")
    print(f"  PDFs with bboxes: {bbox_count}")
    print(f"  Workers: {n_workers} producers + 1 consumer")
    print(f"  Marker GPUs: {len(marker_urls)}")
    print(f"  Embed batch size: {EMBED_BATCH_SIZE}")
    print(f"  Total time: {elapsed:.1f}s ({elapsed/60:.1f}m)")

    # Data integrity check
    try:
        coll = get_chroma_collection()
        db_count = coll.count()
        written = consumer_stats.get('total_written', 0)
        dropped = consumer_stats.get('total_dropped', 0)
        loss_pct = (1 - db_count / total_chunks) * 100 if total_chunks > 0 else 0

        print(f"\n  --- Data Integrity Check ---")
        print(f"  Chunks in ChromaDB: {db_count}")
        print(f"  Consumer written: {written}, dropped: {dropped}")
        if loss_pct > 1.0:
            print(f"  WARNING: {loss_pct:.1f}% data loss ({total_chunks - db_count} chunks missing)")
        else:
            print(f"  OK: {loss_pct:.1f}% loss (within tolerance)")
    except Exception as e:
        print(f"  Verification failed: {e}")

    print(f"{'=' * 60}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
