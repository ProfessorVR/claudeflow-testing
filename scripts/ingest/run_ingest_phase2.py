#!/usr/bin/env python3
"""
Phase 5 — Embedding + Chroma Storage (Enhanced with Full Pipeline + Optimization)

Pipeline Phases:
- Phase 1: OCR integration with content type detection
- Phase 2: Table extraction (pdfplumber + camelot)
- Phase 3: Image extraction with AI descriptions
- Phase 4: Layout analysis (multi-column, equations, captions)
- Phase 5: Optimization (caching, parallel processing, performance monitoring)

Features:
- Walk corpus and parse files
- SHA256 hashing + doc_id generation
- Intelligent skip logic via manifest
- Content type detection (text-based vs scanned)
- Multi-modal extraction: text, tables, images, layout
- Performance optimization with caching and monitoring
- Chunk text intelligently (800-1200 tokens)
- Embed chunks via http://127.0.0.1:8000/embed
- Assert 1536-D embeddings
- Upsert into Chroma persistent store vector_db_1536/, collection knowledge_chunks
- Append manifest record per file (ok/failed)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import time
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

import chromadb
from chromadb.config import Settings

import random
import fitz  # PyMuPDF - needed for cache key generation and layout extraction

# Import OCR extractor
try:
    from ocr_extractor import OCRExtractor, PDFContentType, load_ocr_config
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logging.warning("OCR extractor not available - only text-based PDFs will be processed")

# Import table extractor
try:
    from table_extractor import TableExtractor, TableExtractionResult
    TABLE_EXTRACTION_AVAILABLE = True
except ImportError:
    TABLE_EXTRACTION_AVAILABLE = False
    logging.warning("Table extractor not available - tables will not be extracted")

# Import image extractor
try:
    from image_extractor import ImageExtractor, ImageExtractionResult
    IMAGE_EXTRACTION_AVAILABLE = True
except ImportError:
    IMAGE_EXTRACTION_AVAILABLE = False
    logging.warning("Image extractor not available - images will not be extracted")

# Import layout analyzer
try:
    from layout_analyzer import LayoutAnalyzer, PageLayout, DocumentStructure
    LAYOUT_ANALYSIS_AVAILABLE = True
except ImportError:
    LAYOUT_ANALYSIS_AVAILABLE = False
    logging.warning("Layout analyzer not available - layout analysis will not be performed")

# Import optimization modules (Phase 5)
try:
    from parallel_processor import ParallelProcessor
    PARALLEL_AVAILABLE = True
except ImportError:
    PARALLEL_AVAILABLE = False
    logging.warning("Parallel processor not available")

try:
    from cache_manager import CacheManager
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    logging.warning("Cache manager not available")

try:
    from performance_monitor import PerformanceMonitor
    MONITOR_AVAILABLE = True
except ImportError:
    MONITOR_AVAILABLE = False
    logging.warning("Performance monitor not available")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# -----------------------------
# Locked targets
# -----------------------------
EMBED_URL = "http://127.0.0.1:8000/embed"
EMBED_DIM = 1536

CHROMA_DIR = "vector_db_1536"
CHROMA_COLLECTION = "knowledge_chunks"

MANIFEST_PATH = Path("scripts/ingest/manifest.jsonl")

ALLOWED_EXTS = {".pdf", ".md", ".txt"}

# Chunking targets (token-estimated)
TARGET_MIN_TOKENS = 800
TARGET_MAX_TOKENS = 1200
HARD_MAX_TOKENS = 1400

# Embedding batching
EMBED_BATCH_SIZE = 8
EMBED_TIMEOUT_S = 600


# -----------------------------
# Helpers (same as Phase 1)
# -----------------------------

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def compute_doc_id(path_rel: str, sha256_hex: str) -> str:
    s = f"{path_rel}:{sha256_hex}".encode("utf-8", errors="ignore")
    return hashlib.sha256(s).hexdigest()[:16]


def est_tokens(text: str) -> int:
    text = text.strip()
    if not text:
        return 0
    return max(1, len(text) // 4)


def safe_relpath(path_abs: Path, root: Path) -> str:
    return str(path_abs.resolve().relative_to(root.resolve())).replace("\\", "/")


def collection_from_relpath(path_rel: str) -> str:
    parts = path_rel.split("/")
    return parts[0] if parts else ""


FILENAME_RE = re.compile(
    r"""
    ^
    (?P<author>.+?)\s-\s
    (?P<title>.+?)
    (?:_\((?P<year>\d{4})\))?
    (?:_\[(?P<qualifier>[^\]]+)\])?
    $
    """,
    re.VERBOSE,
)


def parse_filename_metadata(path_abs: Path) -> Dict[str, Any]:
    stem = path_abs.stem
    m = FILENAME_RE.match(stem)

    author_raw = None
    title_raw = None
    year = None
    qualifier = None

    if m:
        author_raw = (m.group("author") or "").strip() or None
        title_raw = (m.group("title") or "").strip() or None
        y = m.group("year")
        if y:
            try:
                year = int(y)
            except ValueError:
                year = None
        qualifier = (m.group("qualifier") or "").strip() or None
    else:
        title_raw = stem

    q = qualifier or ""
    is_my_copy = "my copy" in q.lower()
    is_clean_copy = "clean copy" in q.lower()
    is_notes = "notes" in q.lower()

    return {
        "author_raw": author_raw,
        "title_raw": title_raw,
        "year": year,
        "qualifier": qualifier,
        "is_my_copy": bool(is_my_copy),
        "is_clean_copy": bool(is_clean_copy),
        "is_notes": bool(is_notes),
    }


def load_latest_manifest_by_path(manifest_path: Path) -> Dict[str, Dict[str, Any]]:
    latest: Dict[str, Dict[str, Any]] = {}
    if not manifest_path.exists():
        return latest
    with manifest_path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            p = rec.get("path_abs")
            if p:
                latest[p] = rec
    return latest


def should_skip_phase2(path_abs: Path, sha256_hex: str, latest_manifest: Dict[str, Dict[str, Any]]) -> bool:
    """
    Phase-aware skip:
    Skip only if the latest record for this path_abs indicates Phase 2 succeeded.
    """
    rec = latest_manifest.get(str(path_abs))
    if not rec:
        return False
    same = (rec.get("sha256") == sha256_hex) and (rec.get("status") == "ok")
    phase_ok = int(rec.get("phase") or 0) >= 2
    return same and phase_ok



def ensure_parent_dir(p: Path) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)


def append_manifest(record: Dict[str, Any]) -> None:
    ensure_parent_dir(MANIFEST_PATH)
    with MANIFEST_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


# -----------------------------
# PDF extraction (locked: pdftotext -layout, keep \f)
# -----------------------------

def run_pdftotext_layout(path_abs: Path) -> str:
    cmd = ["pdftotext", "-layout", str(path_abs), "-"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"pdftotext failed (rc={proc.returncode}): {proc.stderr.strip()[:500]}")
    return proc.stdout


def split_pages(pdf_text: str) -> List[Tuple[int, str]]:
    pages = pdf_text.split("\f")
    return [(i, p) for i, p in enumerate(pages, start=1)]


def page_paragraphs(page_no: int, page_text: str) -> List[Tuple[int, str]]:
    text = page_text.replace("\r\n", "\n").replace("\r", "\n")
    parts = re.split(r"\n\s*\n+", text)
    out = []
    for p in parts:
        s = p.strip()
        if s:
            out.append((page_no, s))
    return out


# -----------------------------------------------------------------------
# Corpus text cleaning pipeline  (v1)
#
# Execution order:
#   1. Standalone locator removal (page numbers, Bekker refs)
#   2. Guarded dehyphenation (word-internal + known-prefix)
#   3. Structural line-break joining (with bullet/quote/colon guards)
#   4. Two-stage whitespace normalization (NBSP → space, collapse runs)
#
# The function is deterministic and returns the cleaned string.
# -----------------------------------------------------------------------

CLEANING_VERSION = "clean_v1"

# Known prefixes where a hyphen before an uppercase continuation is intentional
# e.g. "non-\nBeing" → "non-Being", NOT "nonBeing"
_KNOWN_PREFIXES = r"(?:non|anti|pre|post|self|sub|super|inter|intra|extra|meta|proto|quasi|semi|ultra)"

# Bullet line pattern — these lines should NOT be joined to previous line
_BULLET_RE = re.compile(r"^(?:\d+[\.\)]\s|[•\-\*]\s+)")

# Standalone locator lines: bare page numbers, Bekker refs (e.g. "  403b  " or "  — 12 —  ")
_LOCATOR_RE = re.compile(
    r"^[ \t]*"
    r"(?:"
    r"\d{1,4}"                  # bare page number: "12", "403"
    r"|[0-9]{2,4}[ab][0-9]*"   # Bekker ref: "403b", "403b12"
    r"|—\s*\d+\s*—"            # dash-delimited number: "— 12 —"
    r")"
    r"[ \t]*$"
)


def _get_pdftotext_version() -> str:
    """Return pdftotext version string, or 'unknown' if unavailable."""
    try:
        proc = subprocess.run(
            ["pdftotext", "-v"],
            capture_output=True, text=True, timeout=5,
        )
        # pdftotext prints version to stderr
        out = (proc.stderr or proc.stdout or "").strip()
        # Typical: "pdftotext version 24.02.0"
        m = re.search(r"version\s+([\d.]+)", out, re.IGNORECASE)
        return m.group(1) if m else out[:80] or "unknown"
    except Exception:
        return "unknown"


# Cache at module level — called once on import
_pdftotext_version: str = _get_pdftotext_version()


def clean_corpus_text(raw: str) -> str:
    """
    Deterministic corpus text cleaning pipeline (v1).

    Steps in order:
      1. Remove standalone locator lines (page numbers, Bekker refs)
      2. Guarded dehyphenation
         a. Standard: [A-Za-z]-\\n[a-z]  →  join without hyphen
         b. Known-prefix: (non|anti|...)-\\n[A-Z]  →  keep hyphen, remove newline
      3. Structural line-break joining (with guards for bullets, quotes, colons)
      4. Two-stage whitespace normalization
         a. NBSP (\\u00a0) → ASCII space
         b. Collapse [ \\t]{2,} → single space
    """
    text = raw

    # --- Step 1: Remove standalone locator lines ---
    lines = text.split("\n")
    cleaned_lines = [ln for ln in lines if not _LOCATOR_RE.match(ln)]
    text = "\n".join(cleaned_lines)

    # --- Step 2a: Standard dehyphenation ---
    # [A-Za-z]-\n[a-z] → join the word (remove hyphen + newline)
    text = re.sub(r"([A-Za-z])-\n([a-z])", r"\1\2", text)

    # --- Step 2b: Known-prefix dehyphenation ---
    # e.g. "non-\nBeing" → "non-Being" (keep hyphen, remove newline)
    text = re.sub(
        r"(" + _KNOWN_PREFIXES + r")-\n([A-Z])",
        r"\1-\2",
        text,
    )

    # --- Step 3: Structural line-break joining ---
    # Join mid-sentence line breaks that are NOT structural boundaries.
    # Guards (do NOT join if next line matches):
    #   - Bullet/list item: ^(\d+[.)]\s | [•\-\*]\s+)
    #   - Opening quote mark: ^["'"'\u201c\u2018]
    #   - Empty/blank line (already handled by paragraph splitter, but be safe)
    #
    # Guard (do NOT join if current line ends with):
    #   - Colon followed by a newline (likely introduces a list)
    result_lines: List[str] = []
    for line in text.split("\n"):
        if not result_lines:
            result_lines.append(line)
            continue

        prev = result_lines[-1]

        # Don't join if previous line ends with colon (list intro)
        if prev.rstrip().endswith(":"):
            result_lines.append(line)
            continue

        # Don't join if current line is a bullet/list item
        stripped = line.lstrip()
        if _BULLET_RE.match(stripped):
            result_lines.append(line)
            continue

        # Don't join if current line starts with a quote mark
        if stripped and stripped[0] in '"\'"\u201c\u2018\u2019\u201d':
            result_lines.append(line)
            continue

        # Don't join blank lines
        if not stripped:
            result_lines.append(line)
            continue

        # Don't join if previous line is blank
        if not prev.strip():
            result_lines.append(line)
            continue

        # Otherwise: join (replace the newline with a space)
        result_lines[-1] = prev.rstrip() + " " + stripped

    text = "\n".join(result_lines)

    # --- Step 4: Two-stage whitespace normalization ---
    # 4a: NBSP → ASCII space
    text = text.replace("\u00a0", " ")
    # 4b: Collapse horizontal whitespace runs (spaces/tabs) → single space
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


@dataclass
class Chunk:
    chunk_id: str
    chunk_index: int
    text: str
    page_start: Optional[int]
    page_end: Optional[int]
    raw_text: Optional[str] = field(default=None)  # original pre-cleaning text


def chunk_paragraphs_page_aware(doc_id: str, paragraphs: List[Tuple[int, str]]) -> List[Chunk]:
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


def chunk_non_pdf_text(doc_id: str, text: str) -> List[Chunk]:
    parts = re.split(r"\n\s*\n+", text.replace("\r\n", "\n").replace("\r", "\n"))
    paras = [p.strip() for p in parts if p.strip()]

    chunks: List[Chunk] = []
    cur: List[str] = []
    cur_tokens = 0

    def flush():
        nonlocal cur, cur_tokens
        if not cur:
            return
        idx = len(chunks)
        raw_txt = "\n\n".join(cur)
        cleaned = clean_corpus_text(raw_txt)
        cid = f"{doc_id}:{idx:05d}"
        chunks.append(Chunk(cid, idx, cleaned, None, None, raw_text=raw_txt))
        cur = []
        cur_tokens = 0

    for para in paras:
        t = est_tokens(para)
        if cur and (cur_tokens >= TARGET_MIN_TOKENS) and (cur_tokens + t > TARGET_MAX_TOKENS):
            flush()
        cur.append(para)
        cur_tokens += t
        if cur_tokens >= HARD_MAX_TOKENS:
            flush()

    flush()
    return chunks


# -----------------------------
# Embedding client (robust shape handling)
# -----------------------------

def _extract_embeddings(obj: Any) -> List[List[float]]:
    """
    Supports common response shapes:
      { "embeddings": [[...], ...] }
      { "data": [ {"embedding":[...]} , ... ] }
      { "data": [[...], ...] }
      [ [...], ... ]
    """
    if isinstance(obj, list):
        # could be list-of-vectors
        if obj and isinstance(obj[0], list):
            return obj  # type: ignore
        raise ValueError("Unexpected list response shape")

    if not isinstance(obj, dict):
        raise ValueError("Unexpected embed response type")

    if "embeddings" in obj and isinstance(obj["embeddings"], list):
        return obj["embeddings"]

    if "data" in obj:
        data = obj["data"]
        if isinstance(data, list) and data:
            if isinstance(data[0], dict) and "embedding" in data[0]:
                return [d["embedding"] for d in data]  # type: ignore
            if isinstance(data[0], list):
                return data  # type: ignore

    raise ValueError(f"Unrecognized embed response keys: {list(obj.keys())}")


def embed_texts(texts: List[str], session: requests.Session) -> List[List[float]]:
    """
    Robust embed call:
    - tries multiple payload shapes
    - retries transient failures
    - on timeout/5xx: split the batch and retry (adaptive batching)
    """
    def _try_once(payload: Dict[str, Any]) -> List[List[float]]:
        r = session.post(EMBED_URL, json=payload, timeout=EMBED_TIMEOUT_S)
        if r.status_code >= 400:
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:300]}")
        data = r.json()
        vecs = _extract_embeddings(data)
        if len(vecs) != len(texts):
            raise ValueError(f"Embedding count mismatch: got {len(vecs)} expected {len(texts)}")
        for i, v in enumerate(vecs):
            if (not isinstance(v, list)) or (len(v) != EMBED_DIM):
                raise ValueError(f"Bad embedding dim at {i}: len={len(v) if isinstance(v, list) else 'non-list'} expected {EMBED_DIM}")
        return vecs

    payloads = [{"texts": texts}, {"input": texts}]

    # If the batch is large and fails, split recursively
    def _embed_recursive(txs: List[str], depth: int = 0) -> List[List[float]]:
        if not txs:
            return []
        # base case: single text, just retry a few times
        if len(txs) == 1:
            last_err = None
            for attempt in range(5):
                for payload in [{"texts": txs}, {"input": txs}]:
                    try:
                        return _try_once(payload)
                    except Exception as e:
                        last_err = e
                # backoff
                time.sleep(min(2 ** attempt, 10) + random.random())
            raise RuntimeError(f"Embedding failed for single item after retries: {last_err}")

        # normal case: try whole batch, then split on timeout/overload
        last_err = None
        for attempt in range(3):
            for payload in [{"texts": txs}, {"input": txs}]:
                try:
                    # use a local shim so _extract_embeddings validates length against *txs*
                    r = session.post(EMBED_URL, json=payload, timeout=EMBED_TIMEOUT_S)
                    if r.status_code >= 500:
                        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
                    if r.status_code >= 400:
                        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
                    data = r.json()
                    vecs = _extract_embeddings(data)
                    if len(vecs) != len(txs):
                        raise ValueError(f"Embedding count mismatch: got {len(vecs)} expected {len(txs)}")
                    for i, v in enumerate(vecs):
                        if (not isinstance(v, list)) or (len(v) != EMBED_DIM):
                            raise ValueError(f"Bad embedding dim at {i}: len={len(v) if isinstance(v, list) else 'non-list'} expected {EMBED_DIM}")
                    return vecs
                except (requests.exceptions.Timeout, requests.exceptions.ReadTimeout) as e:
                    last_err = e
                except Exception as e:
                    last_err = e
            time.sleep(min(2 ** attempt, 8) + random.random())

        # Split batch and embed halves
        mid = len(txs) // 2
        left = _embed_recursive(txs[:mid], depth + 1)
        right = _embed_recursive(txs[mid:], depth + 1)
        return left + right

    # use the recursive function on the original texts
    return _embed_recursive(texts)


# -----------------------------
# Chroma
# -----------------------------

def get_chroma_collection():
    client = chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=Settings(anonymized_telemetry=False),
    )
    return client.get_or_create_collection(name=CHROMA_COLLECTION)


# -----------------------------
# Main
# -----------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Phase 2: embed + upsert into Chroma (with OCR support).")
    ap.add_argument("--root", required=True, help="Corpus root.")
    ap.add_argument("--force", action="store_true", help="Ignore skip logic and re-embed/upsert.")
    ap.add_argument("--ocr-config", type=Path, help="Path to ocr_config.yaml (default: scripts/ingest/ocr_config.yaml)")
    ap.add_argument("--disable-ocr", action="store_true", help="Disable OCR processing (text-only mode)")

    # Phase 5: Optimization control arguments
    ap.add_argument("--enable-cache", action="store_true", help="Enable caching (overrides config)")
    ap.add_argument("--enable-monitoring", action="store_true", help="Enable performance monitoring (overrides config)")
    ap.add_argument("--clear-cache", action="store_true", help="Clear cache before processing")

    args = ap.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"ERROR: --root invalid: {root}")
        return 2

    # Initialize OCR if available and not disabled
    ocr_extractor = None
    if OCR_AVAILABLE and not args.disable_ocr:
        ocr_config_path = args.ocr_config or Path("scripts/ingest/ocr_config.yaml")
        if ocr_config_path.exists():
            logger.info(f"Loading OCR config from: {ocr_config_path}")
            config = load_ocr_config(ocr_config_path)
            ocr_extractor = OCRExtractor(config=config)
            logger.info("OCR extractor initialized successfully")
        else:
            logger.info("OCR config not found, using default settings")
            ocr_extractor = OCRExtractor()
    else:
        if args.disable_ocr:
            logger.info("OCR processing disabled by user")
        else:
            logger.warning("OCR not available - processing text-based PDFs only")

    # Initialize table extractor if available
    table_extractor = None
    if TABLE_EXTRACTION_AVAILABLE:
        ocr_config_path = args.ocr_config or Path("scripts/ingest/ocr_config.yaml")
        if ocr_config_path.exists():
            logger.info(f"Loading table config from: {ocr_config_path}")
            config = load_ocr_config(ocr_config_path)
            table_extractor = TableExtractor(config=config)
            logger.info("Table extractor initialized successfully")
        else:
            logger.info("Table config not found, using default settings")
            table_extractor = TableExtractor()
    else:
        logger.warning("Table extraction not available")

    # Initialize image extractor if available
    image_extractor = None
    if IMAGE_EXTRACTION_AVAILABLE:
        ocr_config_path = args.ocr_config or Path("scripts/ingest/ocr_config.yaml")
        if ocr_config_path.exists():
            logger.info(f"Loading image config from: {ocr_config_path}")
            config = load_ocr_config(ocr_config_path)
            image_extractor = ImageExtractor(config=config)
            logger.info("Image extractor initialized successfully")
        else:
            logger.info("Image config not found, using default settings")
            image_extractor = ImageExtractor()
    else:
        logger.warning("Image extraction not available")

    # Initialize layout analyzer if available
    layout_analyzer = None
    if LAYOUT_ANALYSIS_AVAILABLE:
        ocr_config_path = args.ocr_config or Path("scripts/ingest/ocr_config.yaml")
        if ocr_config_path.exists():
            logger.info(f"Loading layout config from: {ocr_config_path}")
            config = load_ocr_config(ocr_config_path)
            layout_analyzer = LayoutAnalyzer(config=config)
            logger.info("Layout analyzer initialized successfully")
        else:
            logger.info("Layout config not found, using default settings")
            layout_analyzer = LayoutAnalyzer()
    else:
        logger.warning("Layout analysis not available")

    # Phase 5: Initialize optimization modules
    # Load config for optimization settings
    ocr_config_path = args.ocr_config or Path("scripts/ingest/ocr_config.yaml")
    optimization_config = {}
    if ocr_config_path.exists():
        full_config = load_ocr_config(ocr_config_path)
        optimization_config = full_config.get('optimization', {})

    # Initialize cache manager if enabled
    cache_manager = None
    cache_enabled = args.enable_cache or optimization_config.get('caching', {}).get('enabled', False)
    if CACHE_AVAILABLE and cache_enabled:
        cache_config = optimization_config.get('caching', {})
        cache_manager = CacheManager(config=cache_config)
        logger.info("Cache manager initialized")

        # Clear cache if requested
        if args.clear_cache:
            cleared = cache_manager.clear_cache()
            logger.info(f"Cleared {cleared} cache entries")
    else:
        if args.enable_cache:
            logger.warning("Cache manager not available, caching disabled")

    # Initialize performance monitor if enabled
    monitor = None
    monitor_enabled = args.enable_monitoring or optimization_config.get('performance', {}).get('monitor_enabled', False)
    if MONITOR_AVAILABLE and monitor_enabled:
        monitor_config = optimization_config.get('performance', {})
        monitor = PerformanceMonitor(config=monitor_config)
        logger.info("Performance monitor initialized")
    else:
        if args.enable_monitoring:
            logger.warning("Performance monitor not available, monitoring disabled")

    # Initialize parallel processor if enabled (currently opt-in, not used in this integration)
    parallel_processor = None
    parallel_enabled = optimization_config.get('parallel_processing', {}).get('enabled', False)
    if PARALLEL_AVAILABLE and parallel_enabled:
        parallel_config = optimization_config.get('parallel_processing', {})
        parallel_processor = ParallelProcessor(config=parallel_config)
        logger.info("Parallel processor initialized (experimental)")
    else:
        logger.info("Parallel processing disabled (opt-in feature)")

    latest_manifest = load_latest_manifest_by_path(MANIFEST_PATH)
    coll = get_chroma_collection()

    files: List[Path] = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in ALLOWED_EXTS:
            files.append(p)
    files.sort()

    print(f"[Phase5+Optimization] root={root}")
    print(f"[Phase5+Optimization] embed_url={EMBED_URL} dim={EMBED_DIM}")
    print(f"[Phase5+Optimization] chroma_dir={Path(CHROMA_DIR).resolve()} collection={CHROMA_COLLECTION}")
    print(f"[Phase5+Optimization] ocr_enabled={ocr_extractor is not None}")
    print(f"[Phase5+Optimization] table_extraction_enabled={table_extractor is not None}")
    print(f"[Phase5+Optimization] image_extraction_enabled={image_extractor is not None}")
    print(f"[Phase5+Optimization] layout_analysis_enabled={layout_analyzer is not None}")
    print(f"[Phase5+Optimization] cache_enabled={cache_manager is not None}")
    print(f"[Phase5+Optimization] monitoring_enabled={monitor is not None}")
    print(f"[Phase5+Optimization] parallel_processing_enabled={parallel_processor is not None}")
    print(f"[Phase5+Optimization] files_found={len(files)}")

    ok = failed = skipped = 0
    ocr_used = 0
    text_extraction_used = 0
    tables_extracted = 0
    images_extracted = 0

    with requests.Session() as session:
        for path_abs in files:
            t0 = time.time()
            path_rel = safe_relpath(path_abs, root)
            collection = collection_from_relpath(path_rel)
            mtime = int(path_abs.stat().st_mtime)
            meta = parse_filename_metadata(path_abs)

            base_record: Dict[str, Any] = {
                "path_abs": str(path_abs),
                "path_rel": path_rel,
                "collection": collection,
                "mtime": mtime,
                "sha256": None,
                "doc_id": None,
                "status": None,
                "chunks": None,
                "error": None,
                "ts": int(time.time()),
                "meta": meta,
                "phase": 5,  # Updated to Phase 5 (OCR + Tables + Images + Layout + Optimization)
                # OCR metadata (Phase 1 enhancement)
                "content_type": None,
                "extraction_method": None,
                "ocr_confidence": None,
                # Table metadata (Phase 2 enhancement)
                "total_tables": 0,
                "table_pages": [],
                # Image metadata (Phase 3 enhancement)
                "total_images": 0,
                "image_pages": [],
                # Layout metadata (Phase 4 enhancement)
                "layout_detected": False,
                "multi_column_pages": [],
                "total_equations": 0,
                "total_captions": 0,
                "has_headers_footers": False,
            }

            try:
                sha = sha256_file(path_abs)
                doc_id = compute_doc_id(path_rel, sha)
                base_record["sha256"] = sha
                base_record["doc_id"] = doc_id

                if (not args.force) and should_skip_phase2(path_abs, sha, latest_manifest):
                    skipped += 1
                    print(f"\n[SKIP] {path_rel} doc_id={doc_id} sha256={sha[:12]}…")
                    continue

                print(f"\n[EMBED+UPSERT] {path_rel}")
                print(f"  doc_id={doc_id} sha256={sha[:12]}…")

                # Rebuild chunks deterministically (same as Phase 1, with OCR + Layout enhancement)
                if path_abs.suffix.lower() == ".pdf":
                    # Phase 4 Enhancement: Analyze document layout if enabled
                    multi_column_pages = []
                    layout_info = {}

                    if layout_analyzer is not None:
                        try:
                            logger.info(f"Analyzing document layout for {path_rel}")

                            # Phase 5: Wrap layout analysis with monitoring
                            if monitor:
                                with monitor.operation("layout_analysis", {"file": path_rel}) as op:
                                    doc_structure = layout_analyzer.extract_document_structure(path_abs)
                                    op['multi_column_pages'] = len([p for p, lt in doc_structure.layout_types.items()
                                                                    if lt.value in ['two_column', 'three_column', 'multi_column']])
                            else:
                                doc_structure = layout_analyzer.extract_document_structure(path_abs)
                            base_record["layout_detected"] = True
                            base_record["total_equations"] = len(doc_structure.equations)
                            base_record["total_captions"] = len(doc_structure.captions)
                            base_record["has_headers_footers"] = len(doc_structure.headers) > 0 or len(doc_structure.footers) > 0

                            # Track multi-column pages
                            for page_num, layout_type in doc_structure.layout_types.items():
                                if layout_type.value in ['two_column', 'three_column', 'multi_column']:
                                    multi_column_pages.append(page_num)

                            base_record["multi_column_pages"] = multi_column_pages

                            # Store layout info for use during text extraction
                            layout_info = {
                                'structure': doc_structure,
                                'analyzer': layout_analyzer
                            }

                            logger.info(
                                f"Layout analysis complete: {len(multi_column_pages)} multi-column pages, "
                                f"{len(doc_structure.equations)} equations, {len(doc_structure.captions)} captions"
                            )
                        except Exception as e:
                            logger.error(f"Layout analysis failed: {e}")
                            # Continue without layout analysis

                    # Phase 1 Enhancement: Detect content type and route extraction
                    paragraphs: List[Tuple[int, str]] = []

                    if ocr_extractor is not None:
                        # Detect content type (with monitoring)
                        if monitor:
                            with monitor.operation("content_detection", {"file": path_rel}):
                                detection_result = ocr_extractor.detect_content_type(path_abs)
                        else:
                            detection_result = ocr_extractor.detect_content_type(path_abs)

                        content_type = detection_result.content_type
                        base_record["content_type"] = content_type.value

                        print(f"  content_type={content_type.value} (confidence={detection_result.confidence:.2f})")

                        # Route to appropriate extraction method
                        if content_type == PDFContentType.TEXT_BASED:
                            # Check if we should use layout-aware extraction
                            if layout_info and multi_column_pages:
                                # Use layout-aware extraction for multi-column pages
                                logger.info(f"Using layout-aware extraction for text-based PDF with multi-column pages: {path_rel}")
                                analyzer = layout_info['analyzer']

                                doc = fitz.open(str(path_abs))
                                for page_num in range(len(doc)):
                                    if page_num in multi_column_pages:
                                        # Use layout-aware extraction for multi-column pages
                                        text = analyzer.extract_in_reading_order(path_abs, page_num)
                                        paragraphs.extend(page_paragraphs(page_num + 1, text))
                                    else:
                                        # Use pdftotext for single-column pages (faster)
                                        page = doc[page_num]
                                        text = page.get_text()
                                        paragraphs.extend(page_paragraphs(page_num + 1, text))
                                doc.close()

                                base_record["extraction_method"] = "layout_aware"
                                text_extraction_used += 1
                            else:
                                # Use fast pdftotext path for text-based PDFs
                                logger.info(f"Using pdftotext for text-based PDF: {path_rel}")
                                pdf_text = run_pdftotext_layout(path_abs)
                                pages = split_pages(pdf_text)
                                for page_no, page_text in pages:
                                    paragraphs.extend(page_paragraphs(page_no, page_text))
                                base_record["extraction_method"] = "pdftotext"
                                text_extraction_used += 1
                        else:
                            # Use OCR for scanned/hybrid/image-heavy PDFs
                            # Phase 5: Check cache for OCR results
                            cached_pages = []
                            doc = fitz.open(str(path_abs))
                            total_pages = len(doc)
                            doc.close()

                            if cache_manager:
                                cache_hits = 0
                                for page_num in range(total_pages):
                                    cached = cache_manager.get_cached_ocr(path_abs, page_num)
                                    if cached:
                                        cached_pages.append((page_num + 1, cached))  # 1-indexed
                                        cache_hits += 1

                                if cache_hits > 0:
                                    logger.info(f"Cache hits: {cache_hits}/{total_pages} pages for {path_rel}")

                            if cached_pages and len(cached_pages) == total_pages:
                                # All pages cached
                                logger.info(f"Using cached OCR results for all pages: {path_rel}")
                                page_texts = cached_pages
                            else:
                                # Extract with OCR and cache results
                                logger.info(f"Using OCR for {content_type.value} PDF: {path_rel}")

                                # Wrap OCR extraction with performance monitoring
                                if monitor:
                                    with monitor.operation("ocr_extraction", {"pages": total_pages, "file": path_rel}) as op:
                                        page_texts = ocr_extractor.extract_full_document(path_abs)
                                        op['extracted_pages'] = len(page_texts)
                                else:
                                    page_texts = ocr_extractor.extract_full_document(path_abs)

                                # Cache results
                                if cache_manager:
                                    for page_no, page_text in page_texts:
                                        cache_manager.cache_ocr_result(
                                            path_abs,
                                            page_no - 1,  # Convert to 0-indexed
                                            page_text,
                                            metadata={"content_type": content_type.value}
                                        )
                                    logger.info(f"Cached {len(page_texts)} OCR results for {path_rel}")

                            for page_no, page_text in page_texts:
                                paragraphs.extend(page_paragraphs(page_no, page_text))

                            base_record["extraction_method"] = "ocr"
                            # Store average OCR confidence
                            if page_texts:
                                # Note: OCR confidence is logged but not returned in page_texts format
                                # For now, we rely on the extractor's logging
                                base_record["ocr_confidence"] = None  # Could be enhanced
                            ocr_used += 1
                    else:
                        # Fallback to pdftotext (OCR not available)
                        logger.info(f"Using pdftotext (OCR not available): {path_rel}")
                        pdf_text = run_pdftotext_layout(path_abs)
                        pages = split_pages(pdf_text)
                        for page_no, page_text in pages:
                            paragraphs.extend(page_paragraphs(page_no, page_text))
                        base_record["extraction_method"] = "pdftotext"
                        base_record["content_type"] = "text_based"  # Assumed
                        text_extraction_used += 1

                    chunks = chunk_paragraphs_page_aware(doc_id, paragraphs)

                    # Phase 2 Enhancement: Extract tables from PDFs
                    table_chunks = []
                    if table_extractor is not None:
                        try:
                            # Phase 5: Check cache for table extraction results
                            cached_tables = None
                            if cache_manager:
                                cached_tables = cache_manager.get_cached_tables(path_abs)
                                if cached_tables:
                                    logger.info(f"Using cached table extraction for {path_rel} ({cached_tables.total_tables} tables)")

                            if cached_tables:
                                # Use cached results
                                table_result = cached_tables
                            else:
                                # Extract tables and cache results
                                logger.info(f"Extracting tables from {path_rel}")

                                # Phase 5: Wrap table extraction with monitoring
                                if monitor:
                                    with monitor.operation("table_extraction", {"file": path_rel}) as op:
                                        table_result = table_extractor.extract_tables(path_abs)
                                        op['tables_found'] = table_result.total_tables
                                else:
                                    table_result = table_extractor.extract_tables(path_abs)

                                # Cache the extraction results
                                if cache_manager:
                                    cache_manager.cache_table_result(path_abs, table_result)
                                    logger.info(f"Cached {table_result.total_tables} tables for {path_rel}")

                            base_record["total_tables"] = table_result.total_tables
                            base_record["table_pages"] = table_result.pages_with_tables

                            if table_result.total_tables > 0:
                                logger.info(f"Found {table_result.total_tables} tables on pages {table_result.pages_with_tables}")

                                # Create table directory for this document
                                media_dir = Path(".extracted_media") / doc_id / "tables"
                                media_dir.mkdir(parents=True, exist_ok=True)

                                # Create chunks for each table
                                for table_idx, table in enumerate(table_result.tables):
                                    # Save table files
                                    table_base_name = f"page_{table.page_num:03d}_table_{table_idx:03d}"

                                    csv_path = media_dir / f"{table_base_name}.csv"
                                    md_path = media_dir / f"{table_base_name}.md"
                                    json_path = media_dir / f"{table_base_name}.json"

                                    csv_path.write_text(table.csv_content, encoding='utf-8')
                                    md_path.write_text(table.markdown, encoding='utf-8')
                                    json_path.write_text(table.json_content, encoding='utf-8')

                                    # Create chunk
                                    chunk_data = table_extractor.create_table_chunks(
                                        table=table,
                                        context_before=None,  # TODO: Extract surrounding text
                                        context_after=None,
                                        doc_id=doc_id,
                                        chunk_index=len(chunks) + len(table_chunks)
                                    )

                                    # Update metadata with file paths
                                    chunk_data["metadata"]["table_file_csv"] = str(csv_path.relative_to(Path.cwd()))
                                    chunk_data["metadata"]["table_file_json"] = str(json_path.relative_to(Path.cwd()))

                                    # Create Chunk object
                                    chunk_id = f"{doc_id}:{len(chunks) + len(table_chunks):05d}"
                                    table_chunk = Chunk(
                                        chunk_id=chunk_id,
                                        chunk_index=len(chunks) + len(table_chunks),
                                        text=chunk_data["text"],
                                        page_start=table.page_num,
                                        page_end=table.page_num
                                    )

                                    # Store table-specific metadata separately (will be merged later)
                                    table_chunk._table_metadata = chunk_data["metadata"]

                                    table_chunks.append(table_chunk)

                                tables_extracted += table_result.total_tables
                                logger.info(f"Created {len(table_chunks)} table chunks")

                        except Exception as e:
                            logger.error(f"Table extraction failed: {e}")
                            # Continue processing without tables

                    # Combine text chunks and table chunks
                    chunks.extend(table_chunks)

                    # Phase 3 Enhancement: Extract images from PDFs
                    image_chunks = []
                    if image_extractor is not None:
                        try:
                            # Phase 5: Check cache for image extraction results (if enabled)
                            cached_images = None
                            cache_images_enabled = False
                            if cache_manager:
                                # Check if image caching is enabled
                                cache_images_enabled = cache_manager.cache_images
                                if cache_images_enabled:
                                    cached_images = cache_manager.get_cached_images(path_abs)
                                    if cached_images:
                                        logger.info(f"Using cached image extraction for {path_rel} ({cached_images.total_images} images)")

                            if cached_images:
                                # Use cached results
                                image_result = cached_images
                                media_dir = Path(".extracted_media") / doc_id / "images"
                            else:
                                # Extract images and cache results
                                logger.info(f"Extracting images from {path_rel}")

                                # Create image directory for this document
                                media_dir = Path(".extracted_media") / doc_id / "images"

                                # Phase 5: Wrap image extraction with monitoring
                                if monitor:
                                    with monitor.operation("image_extraction", {"file": path_rel}) as op:
                                        image_result = image_extractor.extract_images(path_abs, output_dir=media_dir)
                                        op['images_found'] = image_result.total_images
                                else:
                                    image_result = image_extractor.extract_images(path_abs, output_dir=media_dir)

                                # Cache the extraction results (if enabled)
                                if cache_manager and cache_images_enabled:
                                    cache_manager.cache_image_result(path_abs, image_result)
                                    logger.info(f"Cached {image_result.total_images} images for {path_rel}")

                            base_record["total_images"] = image_result.total_images
                            base_record["image_pages"] = image_result.pages_with_images

                            if image_result.total_images > 0:
                                logger.info(f"Found {image_result.total_images} images on pages {image_result.pages_with_images}")

                                # Associate captions with images using layout analyzer
                                caption_map = {}
                                if layout_info and 'analyzer' in layout_info:
                                    try:
                                        analyzer = layout_info['analyzer']
                                        # Group images by page
                                        images_by_page = {}
                                        for img in image_result.images:
                                            page_num = img.page_num - 1  # Convert to 0-indexed
                                            if page_num not in images_by_page:
                                                images_by_page[page_num] = []
                                            images_by_page[page_num].append({
                                                'image_index': img.image_index,
                                                'bbox': img.bbox
                                            })

                                        # Find captions for each page
                                        for page_num, page_images in images_by_page.items():
                                            page_caption_map = analyzer.detect_figure_captions(
                                                path_abs, page_num, page_images
                                            )
                                            # Update global caption map with page-specific results
                                            for img_idx, caption in page_caption_map.items():
                                                # Find the actual image index in the full list
                                                for img in image_result.images:
                                                    if img.page_num - 1 == page_num and img.image_index == img_idx:
                                                        global_idx = image_result.images.index(img)
                                                        caption_map[global_idx] = caption
                                                        break

                                        logger.info(f"Associated {len(caption_map)} captions with images")
                                    except Exception as e:
                                        logger.error(f"Caption association failed: {e}")

                                # Create chunks for each image
                                for img_idx, image in enumerate(image_result.images):
                                    # Get caption from layout analyzer if available
                                    caption_text = caption_map.get(img_idx, None)
                                    if caption_text:
                                        # Update image object with caption
                                        image.caption = caption_text

                                    # Create chunk
                                    chunk_data = image_extractor.create_image_chunks(
                                        image=image,
                                        context_before=None,  # TODO: Extract surrounding text
                                        context_after=None,
                                        doc_id=doc_id,
                                        chunk_index=len(chunks) + len(image_chunks)
                                    )

                                    # Update metadata with file paths
                                    image_base_name = f"image_{image.image_index:03d}_page_{image.page_num:03d}"

                                    # Determine saved format
                                    saved_format = image_extractor.output_formats[0] if image_extractor.output_formats else 'png'
                                    image_file_path = media_dir / f"{image_base_name}.{saved_format}"
                                    metadata_file_path = media_dir / f"{image_base_name}.json"

                                    if image_file_path.exists():
                                        chunk_data["metadata"]["image_file"] = str(image_file_path.relative_to(Path.cwd()))
                                    if metadata_file_path.exists():
                                        chunk_data["metadata"]["image_metadata_file"] = str(metadata_file_path.relative_to(Path.cwd()))

                                    # Create Chunk object
                                    chunk_id = f"{doc_id}:{len(chunks) + len(image_chunks):05d}"
                                    image_chunk = Chunk(
                                        chunk_id=chunk_id,
                                        chunk_index=len(chunks) + len(image_chunks),
                                        text=chunk_data["text"],
                                        page_start=image.page_num,
                                        page_end=image.page_num
                                    )

                                    # Store image-specific metadata separately (will be merged later)
                                    image_chunk._image_metadata = chunk_data["metadata"]

                                    image_chunks.append(image_chunk)

                                images_extracted += image_result.total_images
                                logger.info(f"Created {len(image_chunks)} image chunks")

                        except Exception as e:
                            logger.error(f"Image extraction failed: {e}")
                            # Continue processing without images

                    # Combine text chunks, table chunks, and image chunks
                    chunks.extend(image_chunks)

                else:
                    # .md / .txt files
                    text = path_abs.read_text(encoding="utf-8", errors="replace")
                    chunks = chunk_non_pdf_text(doc_id, text)
                    base_record["extraction_method"] = "text"
                    base_record["content_type"] = "text"

                base_record["chunks"] = len(chunks)
                if not chunks:
                    raise RuntimeError("No chunks produced (empty document after extraction).")

                # Batch embed + upsert
                ids: List[str] = []
                documents: List[str] = []
                metadatas: List[Dict[str, Any]] = []
                embeddings: List[List[float]] = []

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

                    # Phase 5: Monitor embedding operations
                    if monitor:
                        with monitor.operation("embedding", {"batch_size": len(texts), "file": path_rel}):
                            vecs = embed_texts(texts, session)
                    else:
                        vecs = embed_texts(texts, session)

                    for c, v in zip(batch, vecs):
                        ids.append(c.chunk_id)
                        documents.append(c.text)

                        # Compute SHA-256 hashes for clean and raw text
                        clean_sha256 = hashlib.sha256(c.text.encode("utf-8")).hexdigest()
                        raw_sha256 = (
                            hashlib.sha256(c.raw_text.encode("utf-8")).hexdigest()
                            if c.raw_text is not None
                            else clean_sha256
                        )

                        # Base metadata
                        chunk_metadata = {
                            "doc_id": doc_id,
                            "chunk_index": c.chunk_index,
                            "path_abs": str(path_abs),
                            "path_rel": path_rel,
                            "collection": collection,
                            "sha256": sha,
                            "mtime": mtime,
                            "page_start": c.page_start,
                            "page_end": c.page_end,
                            # Cleaning pipeline metadata
                            "cleaning_version": CLEANING_VERSION,
                            "raw_sha256": raw_sha256,
                            "clean_sha256": clean_sha256,
                            "pdftotext_version": _pdftotext_version,
                            **meta,
                        }

                        # Store raw (pre-cleaning) text if available and different
                        if c.raw_text is not None and c.raw_text != c.text:
                            chunk_metadata["raw_content"] = c.raw_text

                        # Add table-specific metadata if this is a table chunk
                        if hasattr(c, '_table_metadata'):
                            chunk_metadata.update(c._table_metadata)
                        # Add image-specific metadata if this is an image chunk
                        elif hasattr(c, '_image_metadata'):
                            chunk_metadata.update(c._image_metadata)
                        else:
                            # Default values for non-table/non-image chunks
                            chunk_metadata.update({
                                "content_type": "text",
                                "source_method": base_record.get("extraction_method", "pdftotext"),
                                "is_table": False,
                                "is_image": False,
                            })

                        metadatas.append(chunk_metadata)
                        embeddings.append(v)

                    flush_batch()
                    print(f"  embedded_upserted {min(i+EMBED_BATCH_SIZE, len(chunks))}/{len(chunks)}")

                base_record["status"] = "ok"
                base_record["error"] = None
                append_manifest(base_record)
                ok += 1

            except Exception as e:
                base_record["status"] = "failed"
                base_record["error"] = str(e)[:2000]
                if base_record["chunks"] is None:
                    base_record["chunks"] = 0
                append_manifest(base_record)
                failed += 1
                print(f"\n[FAILED] {path_rel}\n  error={base_record['error']}")

            finally:
                print(f"  time={time.time()-t0:.2f}s")

    print("\n[Phase5+Optimization Summary]")
    print(f"  ok={ok} failed={failed} skipped={skipped} total={len(files)}")
    if ocr_extractor is not None:
        print(f"  extraction_methods: ocr={ocr_used}, pdftotext={text_extraction_used}")
    if table_extractor is not None:
        print(f"  tables_extracted={tables_extracted}")
    if image_extractor is not None:
        print(f"  images_extracted={images_extracted}")
    if layout_analyzer is not None:
        print(f"  layout_analysis: enabled")

    # Phase 5: Export performance metrics if monitoring enabled
    if monitor:
        metrics_dir = Path(optimization_config.get('performance', {}).get('metrics_dir', 'output/metrics'))
        metrics_dir.mkdir(parents=True, exist_ok=True)

        report = monitor.get_report()
        output_file = metrics_dir / f"ingestion_metrics_{int(time.time())}.json"

        try:
            with output_file.open('w') as f:
                json.dump(report, f, indent=2)

            logger.info(f"Performance metrics exported to: {output_file}")

            # Print summary
            print("\n[Performance Summary]")
            if 'operations' in report:
                for operation, stats in report['operations'].items():
                    print(f"  {operation}: {stats['mean']:.3f}s avg, {stats['total']:.2f}s total ({stats['count']} ops)")
        except Exception as e:
            logger.error(f"Failed to export performance metrics: {e}")

    # Phase 5: Print cache statistics if caching enabled
    if cache_manager:
        stats = cache_manager.get_cache_stats()
        if stats.get('enabled'):
            print("\n[Cache Statistics]")
            print(f"  Total entries: {stats['total_entries']}")
            print(f"  OCR entries: {stats['ocr_entries']}")
            print(f"  Table entries: {stats['table_entries']}")
            print(f"  Image entries: {stats['image_entries']}")
            print(f"  Cache size: {stats['total_size_mb']:.2f} MB")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
