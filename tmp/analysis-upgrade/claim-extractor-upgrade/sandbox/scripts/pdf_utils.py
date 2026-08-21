"""PDF reading and Bekker/page marker detection."""
from __future__ import annotations
import re
from pathlib import Path
from typing import Iterator

import fitz  # pymupdf


# Bekker patterns:
#   "427a1", "427b15", "1029a" — standard
#   "427*1", "410*1" — OCR artifact where italic a/b becomes '*'
BEKKER_RE = re.compile(r"(\d{3,4})([ab*])(\d{1,3})?")
# Page-header pattern in running text (plain number on its own short line)
PAGENUM_RE = re.compile(r"^\s*(\d{2,4})\s*$")


def read_pdf_pages(pdf_path: Path, first: int = 1, last: int | None = None) -> list[tuple[int, str]]:
    """Return list of (pdf_page_1indexed, text) for pages first..last inclusive."""
    doc = fitz.open(str(pdf_path))
    if last is None:
        last = doc.page_count
    out = []
    for i in range(first - 1, min(last, doc.page_count)):
        out.append((i + 1, doc[i].get_text()))
    return out


def iter_bekker_markers(text: str) -> Iterator[tuple[int, str]]:
    """Yield (char_offset, canonical_bekker) for each Bekker marker found.

    Canonicalizes '*' → 'a' (OCR artifact in Revised Oxford Translation PDFs).
    """
    for m in BEKKER_RE.finditer(text):
        page, col, line = m.group(1), m.group(2), m.group(3) or ""
        col = "a" if col == "*" else col
        canon = f"{page}{col}{line}"
        yield m.start(), canon


def extract_book_chapter(text: str) -> str | None:
    """Heuristic: find a header like 'BOOK III' or 'III.3' or '3.3' near the top."""
    for line in text.splitlines()[:8]:
        m = re.search(r"\b(BOOK\s+[IVX]+|[IVX]{1,4}\.\d+|[1-9]\.\d+)\b", line)
        if m:
            return m.group(1)
    return None


def nearest_bekker_before(text: str, char_offset: int) -> str | None:
    """Return the canonical Bekker marker closest to (but before/around) char_offset."""
    markers = list(iter_bekker_markers(text))
    if not markers:
        return None
    # Prefer the last marker whose offset is ≤ char_offset
    candidate = None
    for off, canon in markers:
        if off <= char_offset:
            candidate = canon
        else:
            if candidate is None:
                # No markers before; return the first one (target is in early chunk)
                return canon
            # Return the last one before, unless the forward one is very close
            forward_dist = off - char_offset
            return canon if forward_dist < 80 else candidate
    return candidate


def chunk_primary_by_bekker(
    pages: list[tuple[int, str]],
    target_chars: int = 2500,
) -> list[dict]:
    """Chunk primary text targeting ~target_chars per chunk, breaking at Bekker
    or paragraph boundaries."""
    chunks = []
    buf: list[str] = []
    buf_pages: list[int] = []
    buf_len = 0
    buf_start_page = None

    for page_no, text in pages:
        if buf_start_page is None:
            buf_start_page = page_no
        buf.append(f"[PDF-p{page_no}]\n{text}")
        buf_pages.append(page_no)
        buf_len += len(text)
        if buf_len >= target_chars:
            body = "\n\n".join(buf)
            bekkers = [c for _, c in iter_bekker_markers(body)]
            chunks.append({
                "id": f"primary-p{buf_start_page}-p{page_no}",
                "text": body,
                "pdf_pages": buf_pages[:],
                "bekker_range": f"{bekkers[0]}-{bekkers[-1]}" if bekkers else None,
                "book_chapter": extract_book_chapter(body),
            })
            buf, buf_pages, buf_len, buf_start_page = [], [], 0, None

    if buf:
        body = "\n\n".join(buf)
        bekkers = [c for _, c in iter_bekker_markers(body)]
        chunks.append({
            "id": f"primary-p{buf_start_page}-p{buf_pages[-1]}",
            "text": body,
            "pdf_pages": buf_pages,
            "bekker_range": f"{bekkers[0]}-{bekkers[-1]}" if bekkers else None,
            "book_chapter": extract_book_chapter(body),
        })
    return chunks


def chunk_secondary_by_pages(
    pages: list[tuple[int, str]],
    pages_per_chunk: int = 3,
) -> list[dict]:
    """Secondary-lit chunking: N consecutive PDF pages per chunk."""
    chunks = []
    for i in range(0, len(pages), pages_per_chunk):
        group = pages[i : i + pages_per_chunk]
        body = "\n\n".join(f"[PDF-p{p}]\n{t}" for p, t in group)
        header_candidates = []
        for _, t in group:
            for line in t.splitlines()[:12]:
                l = line.strip()
                if l and (l.isupper() or re.match(r"^\d+\.\s+[A-Z]", l)):
                    if 5 < len(l) < 80:
                        header_candidates.append(l)
                        break
        chunks.append({
            "id": f"secondary-p{group[0][0]}-p{group[-1][0]}",
            "text": body,
            "pdf_pages": [p for p, _ in group],
            "section_header": header_candidates[0] if header_candidates else None,
        })
    return chunks
