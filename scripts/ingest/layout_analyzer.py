"""
Layout Analyzer — Multi-column detection, page rotation handling,
and reading-order text extraction for PDF corpus ingestion.

Provides the LayoutAnalyzer, PageLayout, and DocumentStructure classes
expected by run_ingest_phase2.py (Phase 4).

Key capabilities:
  - Detect page rotation and text direction
  - Detect multi-column layout via text-block x-position clustering
  - Strip running headers, footers, and standalone page numbers
  - Extract text in correct reading order (column-by-column, top-to-bottom)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import fitz  # PyMuPDF


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

class PageLayout(Enum):
    single_column = "single_column"
    two_column = "two_column"
    three_column = "three_column"
    multi_column = "multi_column"
    title_page = "title_page"
    unknown = "unknown"


@dataclass
class DocumentStructure:
    """Result of full-document layout analysis."""
    layout_types: Dict[int, PageLayout] = field(default_factory=dict)
    headers: List[str] = field(default_factory=list)
    footers: List[str] = field(default_factory=list)
    equations: List[Any] = field(default_factory=list)
    captions: List[Any] = field(default_factory=list)
    rotated_pages: List[int] = field(default_factory=list)


# Patterns for running headers, footers, and page numbers
# Also catches OCR variants like "28o" for "280", "l3" for "13"
_PAGE_NUM_RE = re.compile(r"^\s*\d{1,3}[oO]?\s*$")
_BEKKER_RE = re.compile(r"^\s*\d{2,3}[a-b]?\d{0,2}\s*$")
_SHORT_HEADER_MAX_LEN = 80  # lines shorter than this that repeat across pages

# Caption prefixes (lower-cased) used to associate text blocks with figures/tables
_CAPTION_KEYWORDS = (
    "figure", "fig.", "fig ", "table", "tab.", "plate", "chart",
    "diagram", "illustration", "scheme", "graph", "map", "image", "exhibit",
)


# ---------------------------------------------------------------------------
# LayoutAnalyzer
# ---------------------------------------------------------------------------

class LayoutAnalyzer:
    """Analyze PDF layout and extract text in reading order."""

    def __init__(self, config: Any = None):
        self._config = config or {}
        self._header_cache: Dict[str, List[str]] = {}

    # ------------------------------------------------------------------
    # Public: full-document structure analysis
    # ------------------------------------------------------------------

    def extract_document_structure(self, path_abs) -> DocumentStructure:
        """Analyze every page of a PDF for layout, rotation, headers."""
        path_abs = Path(path_abs)
        doc = fitz.open(str(path_abs))
        structure = DocumentStructure()

        # First pass: detect headers/footers by finding repeated short lines
        page_top_lines: List[List[str]] = []
        page_bot_lines: List[List[str]] = []

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            had_rotation = page.rotation != 0
            if had_rotation:
                structure.rotated_pages.append(page_idx)
                page.set_rotation(0)

            text = page.get_text("text")
            lines = [l.strip() for l in text.split("\n") if l.strip()]

            # Collect top/bottom candidate header/footer lines
            top = [l for l in lines[:3] if len(l) < _SHORT_HEADER_MAX_LEN]
            bot = [l for l in lines[-3:] if len(l) < _SHORT_HEADER_MAX_LEN]

            # For two-column pages (especially rotated), headers also appear
            # at the start of the right column (middle of the text output).
            # Scan for short lines that could be column headers.
            if len(lines) > 10:
                mid_start = len(lines) // 3
                mid_end = 2 * len(lines) // 3
                for l in lines[mid_start:mid_end]:
                    if len(l) < _SHORT_HEADER_MAX_LEN and len(l) > 3:
                        top.append(l)

            page_top_lines.append(top)
            page_bot_lines.append(bot)

            # Restore rotation for later passes
            if had_rotation:
                page.set_rotation(90)

        # Identify repeated lines across pages as headers/footers
        header_candidates = self._find_repeated_lines(page_top_lines)
        footer_candidates = self._find_repeated_lines(page_bot_lines)
        structure.headers = header_candidates
        structure.footers = footer_candidates
        self._header_cache[str(path_abs)] = header_candidates + footer_candidates

        # Second pass: detect column layout per page
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            had_rotation = page.rotation != 0
            if had_rotation:
                page.set_rotation(0)

            layout = self._detect_page_layout(page, page_idx)
            structure.layout_types[page_idx] = layout

            if had_rotation:
                page.set_rotation(90)

        doc.close()
        return structure

    # ------------------------------------------------------------------
    # Public: reading-order text extraction for a single page
    # ------------------------------------------------------------------

    def extract_in_reading_order(self, path_abs, page_num: int) -> str:
        """
        Extract text from a single page in correct reading order.

        Handles:
          - Page rotation (derotates before extraction)
          - Multi-column layout (reads left column, then right column)
          - Strips running headers, footers, and standalone page numbers

        Args:
            path_abs: Path to PDF file
            page_num: 0-indexed page number

        Returns:
            Cleaned text in reading order.
        """
        path_abs = Path(path_abs)
        doc = fitz.open(str(path_abs))
        page = doc[page_num]

        was_rotated = page.rotation != 0

        # Derotate if needed — after derotation, PyMuPDF's get_text("text")
        # already reads columns in correct order (left then right)
        if was_rotated:
            page.set_rotation(0)
            text = page.get_text("text")
        else:
            # For non-rotated multi-column pages, use block-based column extraction
            layout = self._detect_page_layout(page, page_num)
            if layout in (PageLayout.two_column, PageLayout.three_column, PageLayout.multi_column):
                text = self._extract_columns(page, path_abs)
            else:
                text = page.get_text("text")

        doc.close()

        # Strip headers/footers/page numbers
        text = self._strip_headers_footers(text, path_abs)
        return text

    # ------------------------------------------------------------------
    # Public: figure/table caption association for extracted images
    # ------------------------------------------------------------------

    def detect_figure_captions(self, path_abs, page_num: int,
                               page_images: List[Dict[str, Any]]) -> Dict[int, str]:
        """
        Associate caption text with images on a single page.

        For each image, finds the nearest text block that reads like a caption,
        preferring blocks directly below the image (figures) or directly above it
        (tables), and boosting blocks that begin with a caption keyword
        ("Figure", "Table", "Fig.", etc.).

        Args:
            path_abs: Path to the PDF file.
            page_num: 0-indexed page number.
            page_images: list of dicts, each ``{"image_index": int, "bbox": bbox}``,
                where ``bbox`` is an (x0, y0, x1, y1) tuple or a fitz.Rect-like object.

        Returns:
            Mapping ``{image_index: caption_text}``; images with no plausible
            caption nearby are omitted. Best-effort: never raises.
        """
        result: Dict[int, str] = {}
        if not page_images:
            return result
        try:
            path_abs = Path(path_abs)
            doc = fitz.open(str(path_abs))
            try:
                if page_num < 0 or page_num >= len(doc):
                    return result
                page = doc[page_num]
                page_h = float(page.rect.height) or 1000.0
                was_rotated = page.rotation != 0
                if was_rotated:
                    page.set_rotation(0)
                blocks: List[Tuple[float, float, float, float, str]] = []
                for b in page.get_text("blocks"):
                    # block tuple: (x0, y0, x1, y1, text, block_no, block_type)
                    if len(b) >= 7 and b[6] != 0:
                        continue  # skip image / non-text blocks
                    txt = (b[4] or "").strip()
                    if txt:
                        blocks.append((float(b[0]), float(b[1]),
                                       float(b[2]), float(b[3]), txt))
                if was_rotated:
                    page.set_rotation(90)
            finally:
                doc.close()

            if not blocks:
                return result

            max_gap = page_h * 0.18  # caption must sit reasonably close to the image
            for item in page_images:
                try:
                    img_idx = int(item.get("image_index"))
                except (TypeError, ValueError):
                    continue
                ix0, iy0, ix1, iy1 = self._normalize_bbox(item.get("bbox"))
                if ix0 is None:
                    continue
                icx = (ix0 + ix1) / 2.0
                img_w = max(ix1 - ix0, 1.0)

                best: Optional[Tuple[float, str]] = None
                for bx0, by0, bx1, by1, txt in blocks:
                    bcx = (bx0 + bx1) / 2.0
                    # must be horizontally aligned with the image
                    h_overlap = min(ix1, bx1) - max(ix0, bx0)
                    if h_overlap <= 0 and abs(bcx - icx) > img_w:
                        continue
                    gap_below = by0 - iy1   # text below the image (figures)
                    gap_above = iy0 - by1   # text above the image (tables)
                    if 0 <= gap_below <= max_gap:
                        dist = gap_below
                    elif 0 <= gap_above <= max_gap:
                        dist = gap_above + 5.0   # slight preference for below
                    else:
                        continue
                    is_kw = txt.lower().lstrip().startswith(_CAPTION_KEYWORDS)
                    score = dist - (page_h if is_kw else 0.0)
                    if best is None or score < best[0]:
                        best = (score, txt)

                if best is not None:
                    cap = re.sub(r"\s+", " ", best[1]).strip()
                    if len(cap) > 400:
                        cap = cap[:400].rsplit(" ", 1)[0].rstrip() + "…"
                    if cap:
                        result[img_idx] = cap
            return result
        except Exception:
            # Caption association is best-effort; never break ingestion over it.
            return result

    @staticmethod
    def _normalize_bbox(bbox) -> Tuple[Optional[float], Optional[float],
                                       Optional[float], Optional[float]]:
        """Coerce a bbox (tuple/list/fitz.Rect-like) to (x0, y0, x1, y1) floats."""
        try:
            if bbox is None:
                return (None, None, None, None)
            if hasattr(bbox, "x0"):
                return (float(bbox.x0), float(bbox.y0),
                        float(bbox.x1), float(bbox.y1))
            if isinstance(bbox, (list, tuple)) and len(bbox) >= 4:
                return (float(bbox[0]), float(bbox[1]),
                        float(bbox[2]), float(bbox[3]))
        except (TypeError, ValueError):
            pass
        return (None, None, None, None)

    # ------------------------------------------------------------------
    # Internal: column layout detection
    # ------------------------------------------------------------------

    def _detect_page_layout(self, page, page_idx: int) -> PageLayout:
        """Detect whether a page has single or multi-column layout."""
        blocks = page.get_text("blocks")
        text_blocks = [b for b in blocks if b[6] == 0]  # type 0 = text

        if len(text_blocks) < 4:
            return PageLayout.title_page if page_idx == 0 else PageLayout.single_column

        page_width = page.rect.width
        mid_x = page_width / 2

        # Classify blocks as left, right, or spanning
        left_blocks = []
        right_blocks = []
        spanning_blocks = []

        for b in text_blocks:
            x0, y0, x1, y1 = b[0], b[1], b[2], b[3]
            block_mid = (x0 + x1) / 2
            block_width = x1 - x0

            # A block that spans most of the page width is "spanning"
            if block_width > page_width * 0.6:
                spanning_blocks.append(b)
            elif block_mid < mid_x - 10:
                left_blocks.append(b)
            elif block_mid > mid_x + 10:
                right_blocks.append(b)
            else:
                spanning_blocks.append(b)

        # Two-column if both sides have substantial content
        if len(left_blocks) >= 3 and len(right_blocks) >= 3:
            return PageLayout.two_column

        # For rotated PDFs, blocks may be narrow lines — check by
        # looking at the x-center distribution of all blocks
        centers = sorted((b[0] + b[2]) / 2 for b in text_blocks)
        if len(centers) >= 10:
            # Check if centers cluster into two groups
            gap = self._find_largest_gap(centers, page_width)
            if gap is not None and gap > page_width * 0.08:
                return PageLayout.two_column

        return PageLayout.single_column

    def _find_largest_gap(self, sorted_centers: List[float], page_width: float) -> Optional[float]:
        """Find the largest gap between consecutive center x-positions."""
        if len(sorted_centers) < 2:
            return None

        max_gap = 0.0
        max_gap_pos = 0.0
        for i in range(1, len(sorted_centers)):
            gap = sorted_centers[i] - sorted_centers[i - 1]
            if gap > max_gap:
                max_gap = gap
                max_gap_pos = (sorted_centers[i] + sorted_centers[i - 1]) / 2

        # Only count as column gap if it's in the middle third of the page
        if page_width * 0.25 < max_gap_pos < page_width * 0.75:
            return max_gap
        return None

    # ------------------------------------------------------------------
    # Internal: column-aware text extraction
    # ------------------------------------------------------------------

    def _extract_columns(self, page, path_abs: Path) -> str:
        """Extract text from a multi-column page, reading each column top-to-bottom."""
        blocks = page.get_text("blocks")
        text_blocks = [(b[0], b[1], b[2], b[3], b[4], b[5]) for b in blocks if b[6] == 0]

        if not text_blocks:
            return ""

        page_width = page.rect.width

        # Find the column divider by locating the largest x-gap
        centers = sorted(set(round((b[0] + b[2]) / 2, 1) for b in text_blocks))
        divider = page_width / 2  # default

        if len(centers) >= 4:
            max_gap = 0
            for i in range(1, len(centers)):
                gap = centers[i] - centers[i - 1]
                mid = (centers[i] + centers[i - 1]) / 2
                if gap > max_gap and page_width * 0.2 < mid < page_width * 0.8:
                    max_gap = gap
                    divider = mid

        # Split blocks into left and right columns
        left = []
        right = []
        for b in text_blocks:
            x0, y0, x1, y1, text, bno = b
            block_mid = (x0 + x1) / 2
            if block_mid < divider:
                left.append((y0, x0, text))
            else:
                right.append((y0, x0, text))

        # Sort each column by y-position (top to bottom), then x
        left.sort(key=lambda t: (t[0], t[1]))
        right.sort(key=lambda t: (t[0], t[1]))

        # Join text: left column first, then right column
        parts = []
        for _, _, text in left:
            parts.append(text.strip())
        for _, _, text in right:
            parts.append(text.strip())

        return "\n".join(parts)

    # ------------------------------------------------------------------
    # Internal: header/footer detection and stripping
    # ------------------------------------------------------------------

    def _find_repeated_lines(self, page_lines: List[List[str]], min_occurrences: int = 3) -> List[str]:
        """Find lines that appear on multiple pages (likely headers/footers)."""
        # Normalize for comparison
        line_counts: Dict[str, int] = {}
        for page in page_lines:
            seen = set()
            for line in page:
                normalized = self._normalize_header(line)
                if normalized and normalized not in seen:
                    line_counts[normalized] = line_counts.get(normalized, 0) + 1
                    seen.add(normalized)

        return [line for line, count in line_counts.items()
                if count >= min_occurrences]

    def _normalize_header(self, line: str) -> str:
        """Normalize a line for header/footer comparison — strip page numbers."""
        # Remove leading/trailing page numbers
        line = re.sub(r"^\d{1,4}\s+", "", line.strip())
        line = re.sub(r"\s+\d{1,4}$", "", line)
        line = line.strip()
        # Skip very short or purely numeric lines
        if len(line) < 3 or line.isdigit():
            return ""
        return line

    def _strip_headers_footers(self, text: str, path_abs: Path) -> str:
        """Remove running headers, footers, and standalone page numbers from text."""
        known = self._header_cache.get(str(path_abs), [])
        lines = text.split("\n")
        cleaned = []

        for line in lines:
            stripped = line.strip()

            # Skip empty lines (preserve them but don't analyze)
            if not stripped:
                cleaned.append(line)
                continue

            # Skip standalone page numbers (including OCR variants like "28o")
            if _PAGE_NUM_RE.match(stripped):
                continue

            # Skip Bekker-style references that are standalone
            if _BEKKER_RE.match(stripped) and len(stripped) < 8:
                continue

            # Skip known headers/footers (exact match after normalization)
            normalized = self._normalize_header(stripped)
            if normalized and any(normalized == h for h in known):
                continue

            # Fuzzy match for OCR-corrupted headers: if a short line is
            # >80% similar to a known header, skip it
            if normalized and len(normalized) < _SHORT_HEADER_MAX_LEN:
                if any(self._fuzzy_match(normalized, h) for h in known):
                    continue

            cleaned.append(line)

        return "\n".join(cleaned)

    @staticmethod
    def _fuzzy_match(a: str, b: str, threshold: float = 0.80) -> bool:
        """Check if two strings are similar enough (handles OCR typos)."""
        if not a or not b:
            return False
        # Quick length check
        if abs(len(a) - len(b)) > max(len(a), len(b)) * 0.4:
            return False
        # Use SequenceMatcher for proper edit-distance similarity
        # (handles character insertions/deletions from OCR, e.g. "o/" for "of ")
        return SequenceMatcher(None, a.lower(), b.lower()).ratio() >= threshold
