#!/usr/bin/env python3
"""
PyMuPDF Block Extractor — Native block-level text extraction with bounding boxes.

Replaces pdftotext as the CPU-side fallback extractor. Every text block comes
with exact [x0, y0, x1, y1] coordinates from the PDF's internal layout,
eliminating any need for fuzzy bbox matching.

Output schema matches Marker JSON walker format:
    {"text": str, "block_type": str, "bbox": [x0,y0,x1,y1], "page_num": int}

This allows chunk_marker_json() to process PyMuPDF output identically to
Marker GPU output with zero downstream changes.
"""

from __future__ import annotations

import logging
import statistics
from pathlib import Path
from typing import Any, Dict, List, Optional

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

# Block types in PyMuPDF: 0 = text, 1 = image
_PYMUPDF_TEXT_BLOCK = 0


def extract_pymupdf_blocks(
    pdf_path: Path,
    min_text_len: int = 5,
) -> List[Dict[str, Any]]:
    """Extract text blocks with native bounding boxes from a PDF using PyMuPDF.

    Args:
        pdf_path: Path to the PDF file.
        min_text_len: Minimum character length to keep a block (filters noise).

    Returns:
        List of block dicts in Marker-compatible schema:
        {"text": str, "block_type": str, "bbox": [x0,y0,x1,y1], "page_num": int}
    """
    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        logger.error(f"[PyMuPDF] Failed to open {pdf_path.name}: {e}")
        return []

    # Phase 1: Collect all spans to compute document-level median font size
    all_font_sizes: List[float] = []
    for page in doc:
        page_dict = page.get_text("dict", sort=True)
        for block in page_dict.get("blocks", []):
            if block.get("type") != _PYMUPDF_TEXT_BLOCK:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if text:
                        all_font_sizes.append(span["size"])

    if not all_font_sizes:
        logger.warning(f"[PyMuPDF] No text spans found in {pdf_path.name}")
        doc.close()
        return []

    median_font_size = statistics.median(all_font_sizes)

    # Phase 2: Extract blocks with heading classification
    blocks: List[Dict[str, Any]] = []
    total_pages = len(doc)

    for page_idx, page in enumerate(doc):
        page_num = page_idx + 1  # 1-indexed
        page_dict = page.get_text("dict", sort=True)

        for block in page_dict.get("blocks", []):
            if block.get("type") != _PYMUPDF_TEXT_BLOCK:
                continue

            # Extract text from all spans in the block
            block_text = _extract_block_text(block)
            if len(block_text) < min_text_len:
                continue

            # Get bounding box [x0, y0, x1, y1]
            bbox = [
                block["bbox"][0],
                block["bbox"][1],
                block["bbox"][2],
                block["bbox"][3],
            ]

            # Classify as heading or body text
            block_type = _classify_block_type(block, median_font_size)

            blocks.append({
                "text": block_text,
                "block_type": block_type,
                "bbox": bbox,
                "page_num": page_num,
            })

        if total_pages >= 100 and page_num % 50 == 0:
            logger.info(f"[PyMuPDF] {pdf_path.name}: page {page_num}/{total_pages}")

    doc.close()

    if len(blocks) >= 100:
        logger.info(f"[PyMuPDF] {pdf_path.name}: {len(blocks)} blocks from {total_pages} pages "
                    f"(median font={median_font_size:.1f}pt)")

    return blocks


def extract_pymupdf_text(pdf_path: Path) -> str:
    """Extract plain text from a PDF using PyMuPDF.

    Used for the fidelity gate comparison against Marker text.
    """
    try:
        doc = fitz.open(str(pdf_path))
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text("text", sort=True))
        doc.close()
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"[PyMuPDF] Text extraction failed for {pdf_path.name}: {e}")
        return ""


def _extract_block_text(block: Dict[str, Any]) -> str:
    """Extract clean text from a PyMuPDF text block's line/span structure."""
    lines = []
    for line in block.get("lines", []):
        spans_text = []
        for span in line.get("spans", []):
            t = span.get("text", "")
            if t:
                spans_text.append(t)
        if spans_text:
            lines.append("".join(spans_text))
    return "\n".join(lines).strip()


def _classify_block_type(block: Dict[str, Any], median_font_size: float) -> str:
    """Heuristic heading detection based on font size and weight.

    A block is classified as SectionHeader if:
    - Its average font size is >= 1.3x the document median AND it has <= 15 words, OR
    - It is bold AND has <= 12 words
    """
    spans = [s for line in block.get("lines", []) for s in line.get("spans", [])]
    if not spans:
        return "Text"

    # Compute average font size across spans (weighted by text length)
    total_chars = 0
    weighted_size = 0.0
    any_bold = False

    for span in spans:
        text = span.get("text", "")
        size = span.get("size", 0)
        flags = span.get("flags", 0)
        n = len(text)
        total_chars += n
        weighted_size += size * n
        # PyMuPDF flags: bit 4 (value 16) = bold
        if flags & (1 << 4):
            any_bold = True

    if total_chars == 0:
        return "Text"

    avg_size = weighted_size / total_chars
    full_text = _extract_block_text(block)
    word_count = len(full_text.split())

    # Large font + short text = heading
    if avg_size >= median_font_size * 1.3 and word_count <= 15:
        return "SectionHeader"

    # Bold + short text = heading
    if any_bold and word_count <= 12:
        return "SectionHeader"

    return "Text"
