#!/usr/bin/env python3
"""
Markdown-Aware Chunker — Splits Marker-pdf output at semantic boundaries.

Two entry points:
1. chunk_markdown(markdown_str) — text-only chunking (original)
2. chunk_marker_json(marker_json) — bbox-aware chunking from Marker JSON output

Output format:
- chunk_markdown: List[(page_num, text)]
- chunk_marker_json: List[dict] with keys: text, page_start, page_end, bboxes
  where bboxes = [{"page_num": N, "coords": [x1,y1,x2,y2], "blocks": [[x1,y1,x2,y2], ...]}]
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Target chunk size in estimated tokens (matches run_ingest.py constants)
TARGET_MIN_TOKENS = 800
TARGET_MAX_TOKENS = 1200
HARD_MAX_TOKENS = 1400

# Rough chars-per-token estimate (English academic prose)
CHARS_PER_TOKEN = 4


def _estimate_tokens(text: str) -> int:
    """Rough token count estimate."""
    return len(text) // CHARS_PER_TOKEN


# ---------------------------------------------------------------------------
# Markdown section splitter
# ---------------------------------------------------------------------------

# Heading pattern: ## or ### (not # which is title-level)
HEADING_RE = re.compile(r'^(#{1,4})\s+(.+)$', re.MULTILINE)

# Page marker pattern from Marker's paginate output
PAGE_MARKER_RE = re.compile(r'<!--\s*Page\s+(\d+)\s*-->')

# Table block: starts with | header |, followed by | --- |, then rows
TABLE_START_RE = re.compile(r'^\|.*\|$', re.MULTILINE)

# List item (bulleted or numbered)
LIST_ITEM_RE = re.compile(r'^\s*[-*+•]\s|^\s*\d+[.)]\s', re.MULTILINE)


def chunk_markdown(
    markdown: str,
    min_tokens: int = TARGET_MIN_TOKENS,
    max_tokens: int = TARGET_MAX_TOKENS,
    hard_max: int = HARD_MAX_TOKENS,
) -> List[Tuple[int, str]]:
    """Split Marker markdown into chunks respecting semantic boundaries.

    Args:
        markdown: Full markdown text (may contain page markers)
        min_tokens: Minimum target chunk size
        max_tokens: Maximum target chunk size
        hard_max: Absolute maximum (split forcefully if exceeded)

    Returns:
        List of (page_number, chunk_text) tuples, 1-indexed pages
    """
    # First, split into page-aware sections
    page_sections = _split_by_pages(markdown)

    chunks: List[Tuple[int, str]] = []

    for page_num, page_text in page_sections:
        # Split page into heading-delimited sections
        sections = _split_by_headings(page_text)

        # Accumulate sections into chunks
        current_chunk = ""
        for section in sections:
            section_tokens = _estimate_tokens(section)

            # If adding this section would exceed max, flush current
            combined_tokens = _estimate_tokens(current_chunk + "\n\n" + section)

            if current_chunk and combined_tokens > max_tokens:
                # Flush current chunk
                chunks.append((page_num, current_chunk.strip()))
                current_chunk = section
            elif section_tokens > hard_max:
                # Section itself is too big — split by paragraphs
                if current_chunk:
                    chunks.append((page_num, current_chunk.strip()))
                    current_chunk = ""
                sub_chunks = _split_oversized_section(section, min_tokens, max_tokens)
                for sc in sub_chunks:
                    chunks.append((page_num, sc.strip()))
            else:
                # Accumulate
                if current_chunk:
                    current_chunk += "\n\n" + section
                else:
                    current_chunk = section

        # Flush remaining
        if current_chunk.strip():
            chunks.append((page_num, current_chunk.strip()))

    # Merge undersized chunks with neighbors
    chunks = _merge_small_chunks(chunks, min_tokens)

    return chunks


def _split_by_pages(markdown: str) -> List[Tuple[int, str]]:
    """Split markdown by <!-- Page N --> markers."""
    parts = PAGE_MARKER_RE.split(markdown)

    if len(parts) <= 1:
        # No page markers — treat as page 1
        return [(1, markdown.strip())]

    pages: List[Tuple[int, str]] = []
    # parts[0] is text before first marker (usually empty)
    if parts[0].strip():
        pages.append((1, parts[0].strip()))

    for i in range(1, len(parts), 2):
        page_num = int(parts[i])
        page_text = parts[i + 1] if i + 1 < len(parts) else ""
        if page_text.strip():
            pages.append((page_num, page_text.strip()))

    return pages if pages else [(1, markdown.strip())]


def _split_by_headings(text: str) -> List[str]:
    """Split text at heading boundaries, keeping headings with their content."""
    lines = text.split('\n')
    sections: List[str] = []
    current: List[str] = []

    for line in lines:
        if HEADING_RE.match(line) and current:
            # Start new section at heading
            section_text = '\n'.join(current).strip()
            if section_text:
                sections.append(section_text)
            current = [line]
        else:
            current.append(line)

    # Final section
    if current:
        section_text = '\n'.join(current).strip()
        if section_text:
            sections.append(section_text)

    return sections if sections else [text]


def _split_oversized_section(
    text: str,
    min_tokens: int,
    max_tokens: int,
) -> List[str]:
    """Split an oversized section by paragraph boundaries."""
    paragraphs = re.split(r'\n\s*\n+', text)
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        combined_tokens = _estimate_tokens(current + "\n\n" + para)

        if current and combined_tokens > max_tokens:
            chunks.append(current)
            current = para
        else:
            current = (current + "\n\n" + para).strip() if current else para

    if current:
        chunks.append(current)

    return chunks


def _merge_small_chunks(
    chunks: List[Tuple[int, str]],
    min_tokens: int,
) -> List[Tuple[int, str]]:
    """Merge undersized chunks with their neighbors (same page only)."""
    if len(chunks) <= 1:
        return chunks

    merged: List[Tuple[int, str]] = []
    i = 0

    while i < len(chunks):
        page, text = chunks[i]
        tokens = _estimate_tokens(text)

        # If undersized and next chunk is same page, merge
        if tokens < min_tokens and i + 1 < len(chunks):
            next_page, next_text = chunks[i + 1]
            if next_page == page:
                combined = text + "\n\n" + next_text
                merged.append((page, combined.strip()))
                i += 2
                continue

        merged.append((page, text))
        i += 1

    return merged


# ---------------------------------------------------------------------------
# Bbox-aware chunking from Marker JSON output
# ---------------------------------------------------------------------------

# Block types that contain embeddable text content
_TEXT_BLOCK_TYPES = {"Text", "SectionHeader", "Table", "ListItem", "Caption"}


def merge_bboxes(boxes: List[List[float]]) -> List[float]:
    """Merge multiple [x1, y1, x2, y2] bboxes into one encompassing super-box."""
    if not boxes:
        return [0.0, 0.0, 0.0, 0.0]
    return [
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    ]


def _extract_text_from_html(html: str) -> str:
    """Strip HTML tags to get plain text."""
    return re.sub(r'<[^>]+>', '', html).strip()


def _walk_blocks(node: Dict[str, Any], page_num: int = 1) -> List[Dict[str, Any]]:
    """Flatten Marker's nested block tree into a list of text blocks with metadata.

    Phase 3: Iterative stack-based traversal instead of recursive — avoids
    Python recursion overhead and repeated list.extend() for large documents
    (e.g., von Uexkull 188MB with hundreds of thousands of nodes).

    Each returned dict has: text, block_type, bbox, page_num
    """
    blocks: List[Dict[str, Any]] = []
    # Stack of (node, current_page_num) — process in document order
    stack: List[Tuple[Dict[str, Any], int]] = [(node, page_num)]
    block_count = 0

    while stack:
        current, cur_page = stack.pop()
        bt = current.get("block_type", "")

        # Track current page from Page blocks
        if bt == "Page":
            node_id = current.get("id", "")
            m = re.match(r'/page/(\d+)/', node_id)
            if m:
                cur_page = int(m.group(1)) + 1  # Convert 0-indexed to 1-indexed

        if bt in _TEXT_BLOCK_TYPES:
            html = current.get("html", "")
            text = _extract_text_from_html(html)
            bbox = current.get("bbox")
            if text and bbox:
                blocks.append({
                    "text": text,
                    "block_type": bt,
                    "bbox": bbox,
                    "page_num": cur_page,
                })
                block_count += 1
                if block_count % 5000 == 0:
                    print(f"  [Chunker] {block_count} blocks extracted so far...")

        # Push children in reverse order so they're processed left-to-right
        children = current.get("children") or []
        for child in reversed(children):
            stack.append((child, cur_page))

    if block_count >= 1000:
        print(f"  [Chunker] Tree walk complete: {block_count} text blocks extracted")

    return blocks


# Citation locator patterns (Phase 9 / "V-0 satellites"): capture scholarly anchors with
# the precise block bbox where they appear, enabling "1147a13 -> page -> bbox -> overlay".
_LOC_BEKKER_RE = re.compile(r'\b\d{2,4}[ab]\d{0,3}\b')   # Aristotle (Bekker): 1147a13, 1095b, 403b
_LOC_STEPH_RE = re.compile(r'\b\d{2,3}[a-e]\d{0,2}\b')    # Plato (Stephanus): 248e, 248e6


def extract_locators_with_bbox(marker_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Walk the Marker block tree and capture citation locators (Bekker/Stephanus) with the
    precise block bbox + page where each appears.

    Returns a list of {kind, value, page, bbox}. De-duplicated per (value, page) so a locator
    repeated within a page is recorded once (first occurrence's bbox wins).
    """
    out: List[Dict[str, Any]] = []
    seen = set()
    for blk in _walk_blocks(marker_json):
        text = blk.get("text", "")
        if not text:
            continue
        page = blk.get("page_num", 1)
        bbox = blk.get("bbox")
        for kind, rx in (("bekker", _LOC_BEKKER_RE), ("stephanus", _LOC_STEPH_RE)):
            for m in rx.finditer(text):
                val = m.group(0)
                key = (val, page)
                if key in seen:
                    continue
                seen.add(key)
                out.append({"kind": kind, "value": val, "page": page, "bbox": bbox})
    return out


def chunk_marker_json(
    marker_json: Dict[str, Any],
    min_tokens: int = TARGET_MIN_TOKENS,
    max_tokens: int = TARGET_MAX_TOKENS,
    hard_max: int = HARD_MAX_TOKENS,
) -> List[Dict[str, Any]]:
    """Chunk Marker's JSON block tree with full bounding box tracking.

    Args:
        marker_json: Parsed Marker JSON output (the document tree with children/block_type/bbox)
        min_tokens, max_tokens, hard_max: Token targets

    Returns:
        List of chunk dicts, each with:
        - text: str (chunk content)
        - page_start: int (1-indexed)
        - page_end: int (1-indexed)
        - bboxes: list of {"page_num": int, "coords": [x1,y1,x2,y2], "blocks": [[x1,y1,x2,y2], ...]}
    """
    # Flatten the block tree
    all_blocks = _walk_blocks(marker_json)

    if not all_blocks:
        return []

    chunks: List[Dict[str, Any]] = []

    # Accumulator for current chunk
    current_text = ""
    current_page_blocks: Dict[int, List[List[float]]] = {}  # page_num → [bbox, ...]
    current_page_start: Optional[int] = None
    current_page_end: Optional[int] = None

    def _flush_chunk():
        nonlocal current_text, current_page_blocks, current_page_start, current_page_end
        if not current_text.strip():
            return

        # Build bboxes array with super-box + blocks per page
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

        # Reset
        current_text = ""
        current_page_blocks = {}
        current_page_start = None
        current_page_end = None

    for block in all_blocks:
        text = block["text"]
        bbox = block["bbox"]
        page_num = block["page_num"]
        block_type = block["block_type"]

        # Initialize page tracking
        if current_page_start is None:
            current_page_start = page_num
        current_page_end = page_num

        # Check if adding this block exceeds max tokens
        combined = current_text + "\n\n" + text if current_text else text
        combined_tokens = _estimate_tokens(combined)

        # Break at heading boundaries if chunk is non-empty and big enough
        is_heading = block_type == "SectionHeader"
        current_tokens = _estimate_tokens(current_text)

        if current_text and (
            combined_tokens > max_tokens
            or (is_heading and current_tokens >= min_tokens)
        ):
            _flush_chunk()
            current_page_start = page_num
            current_page_end = page_num

        # Accumulate text
        if current_text:
            current_text += "\n\n" + text
        else:
            current_text = text

        # Track bbox for this page
        if page_num not in current_page_blocks:
            current_page_blocks[page_num] = []
        current_page_blocks[page_num].append(bbox)

    # Flush final chunk
    _flush_chunk()

    # Merge undersized chunks (same logic as markdown chunker)
    if len(chunks) > 1:
        merged: List[Dict[str, Any]] = []
        i = 0
        while i < len(chunks):
            chunk = chunks[i]
            tokens = _estimate_tokens(chunk["text"])

            if tokens < min_tokens and i + 1 < len(chunks):
                nxt = chunks[i + 1]
                # Only merge if pages overlap or are adjacent
                if nxt["page_start"] <= chunk["page_end"] + 1:
                    # Merge text
                    merged_text = chunk["text"] + "\n\n" + nxt["text"]
                    # Merge bboxes
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
