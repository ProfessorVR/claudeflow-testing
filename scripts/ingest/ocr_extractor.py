"""
OCR Extractor — Content-type detection and text extraction for PDF corpus
ingestion, with automatic fallback from native text extraction to Tesseract OCR.

Provides the OCRExtractor, PDFContentType, and load_ocr_config interface
expected by run_ingest_phase2.py (Phase 2).

Key capabilities:
  - Detect whether a PDF is text-based, scanned, hybrid, or image-heavy
  - Extract text page-by-page using pymupdf with OCR fallback
  - Configurable via YAML (dpi, language, thresholds)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional dependencies — degrade gracefully when unavailable
# ---------------------------------------------------------------------------

try:
    import pytesseract

    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.debug("pytesseract not installed; OCR fallback disabled")

try:
    from pdf2image import convert_from_path

    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False
    logger.debug("pdf2image not installed; OCR fallback disabled")

try:
    import yaml

    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Enums and data classes
# ---------------------------------------------------------------------------

class PDFContentType(Enum):
    """Classification of PDF content origin."""

    TEXT_BASED = "text_based"
    SCANNED = "scanned"
    HYBRID = "hybrid"
    IMAGE_HEAVY = "image_heavy"


@dataclass
class ContentDetectionResult:
    """Result of PDF content-type detection."""

    content_type: PDFContentType
    confidence: float
    pages_sampled: int = 0
    text_pages: int = 0
    sparse_pages: int = 0
    image_pages: int = 0


# ---------------------------------------------------------------------------
# Default configuration
# ---------------------------------------------------------------------------

DEFAULT_CONFIG: Dict[str, Any] = {
    "dpi": 300,
    "language": "eng",
    # Minimum characters per page to consider it "text-bearing".
    "min_text_threshold": 100,
    # Fraction of sampled pages that must have text for TEXT_BASED.
    "text_page_ratio": 0.8,
    # Fraction below which we call it SCANNED.
    "scanned_page_ratio": 0.2,
    # Maximum pages to sample for content-type detection (0 = all).
    "sample_pages": 10,
}


# ---------------------------------------------------------------------------
# Config loader
# ---------------------------------------------------------------------------

def load_ocr_config(yaml_path: str | Path) -> Dict[str, Any]:
    """Load an OCR / ingest YAML configuration file and return it as a dict.

    Falls back to an empty dict if the file is missing or pyyaml is
    unavailable, so callers can always merge with DEFAULT_CONFIG.
    """
    yaml_path = Path(yaml_path)

    if not yaml_path.exists():
        logger.warning("Config file not found: %s — using defaults", yaml_path)
        return {}

    if not YAML_AVAILABLE:
        logger.warning("pyyaml not installed; cannot load %s — using defaults", yaml_path)
        return {}

    with open(yaml_path, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)

    if not isinstance(data, dict):
        logger.warning("Config file %s did not produce a dict — using defaults", yaml_path)
        return {}

    return data


# ---------------------------------------------------------------------------
# OCRExtractor
# ---------------------------------------------------------------------------

class OCRExtractor:
    """Extracts text from PDFs, falling back to Tesseract OCR for pages
    that lack embedded text (scanned pages, image-heavy layouts)."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        merged = {**DEFAULT_CONFIG}
        if config:
            # Allow nested "ocr" key as well as flat keys.
            ocr_section = config.get("ocr", {})
            merged.update(ocr_section)
            # Also merge top-level keys that match known config names.
            for key in DEFAULT_CONFIG:
                if key in config:
                    merged[key] = config[key]

        self.dpi: int = int(merged["dpi"])
        self.language: str = str(merged["language"])
        self.min_text_threshold: int = int(merged["min_text_threshold"])
        self.text_page_ratio: float = float(merged["text_page_ratio"])
        self.scanned_page_ratio: float = float(merged["scanned_page_ratio"])
        self.sample_pages: int = int(merged["sample_pages"])

        self._ocr_available = TESSERACT_AVAILABLE and PDF2IMAGE_AVAILABLE
        if not self._ocr_available:
            logger.info(
                "OCR fallback unavailable (pytesseract=%s, pdf2image=%s)",
                TESSERACT_AVAILABLE,
                PDF2IMAGE_AVAILABLE,
            )

    # ------------------------------------------------------------------
    # Content-type detection
    # ------------------------------------------------------------------

    def detect_content_type(self, path_abs: str | Path) -> ContentDetectionResult:
        """Classify a PDF as text-based, scanned, hybrid, or image-heavy.

        Opens the PDF with pymupdf, samples a subset of pages, and
        categorises based on how many pages yield meaningful extracted text
        versus how many contain only images.
        """
        path_abs = Path(path_abs)
        doc = fitz.open(str(path_abs))
        total_pages = len(doc)

        if total_pages == 0:
            doc.close()
            return ContentDetectionResult(
                content_type=PDFContentType.SCANNED,
                confidence=0.5,
            )

        # Decide which pages to sample.
        if self.sample_pages <= 0 or self.sample_pages >= total_pages:
            sample_indices = list(range(total_pages))
        else:
            # Evenly spaced sample across the document.
            step = max(1, total_pages // self.sample_pages)
            sample_indices = list(range(0, total_pages, step))[: self.sample_pages]

        text_pages = 0
        sparse_pages = 0
        image_pages = 0

        for idx in sample_indices:
            page = doc[idx]
            text = page.get_text().strip()
            text_len = len(text)
            image_list = page.get_images(full=True)

            has_text = text_len >= self.min_text_threshold
            has_images = len(image_list) > 0

            if has_text:
                text_pages += 1
            elif has_images:
                image_pages += 1
            else:
                sparse_pages += 1

        doc.close()

        pages_sampled = len(sample_indices)
        text_fraction = text_pages / pages_sampled if pages_sampled else 0.0
        image_fraction = image_pages / pages_sampled if pages_sampled else 0.0

        # Classification logic.
        if text_fraction >= self.text_page_ratio:
            content_type = PDFContentType.TEXT_BASED
            confidence = min(1.0, text_fraction)
        elif text_fraction <= self.scanned_page_ratio:
            if image_fraction > 0.5:
                content_type = PDFContentType.IMAGE_HEAVY
                confidence = min(1.0, image_fraction)
            else:
                content_type = PDFContentType.SCANNED
                confidence = min(1.0, 1.0 - text_fraction)
        else:
            content_type = PDFContentType.HYBRID
            # Confidence reflects how far we are from the boundary.
            confidence = 1.0 - abs(text_fraction - 0.5) * 2

        return ContentDetectionResult(
            content_type=content_type,
            confidence=round(confidence, 3),
            pages_sampled=pages_sampled,
            text_pages=text_pages,
            sparse_pages=sparse_pages,
            image_pages=image_pages,
        )

    # ------------------------------------------------------------------
    # Full-document extraction
    # ------------------------------------------------------------------

    def extract_full_document(
        self, path_abs: str | Path
    ) -> List[Tuple[int, str]]:
        """Extract text from every page of the PDF.

        For each page, pymupdf text extraction is attempted first.  If the
        result is below ``min_text_threshold`` characters, Tesseract OCR is
        used as a fallback (when available).

        Returns a list of ``(page_number, text)`` tuples with **1-indexed**
        page numbers.
        """
        path_abs = Path(path_abs)
        doc = fitz.open(str(path_abs))
        total_pages = len(doc)
        results: List[Tuple[int, str]] = []

        for page_idx in range(total_pages):
            page_no = page_idx + 1  # 1-indexed
            page = doc[page_idx]
            text = page.get_text().strip()

            if len(text) >= self.min_text_threshold:
                results.append((page_no, text))
                continue

            # Fallback to OCR.
            ocr_text = self._ocr_page(path_abs, page_no)
            if ocr_text is not None:
                results.append((page_no, ocr_text))
            else:
                # Return whatever pymupdf got, even if sparse.
                results.append((page_no, text))

        doc.close()
        return results

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ocr_page(self, path_abs: Path, page_no: int) -> Optional[str]:
        """Run Tesseract on a single page. Returns ``None`` on failure."""
        if not self._ocr_available:
            return None

        try:
            images = convert_from_path(
                str(path_abs),
                first_page=page_no,
                last_page=page_no,
                dpi=self.dpi,
            )
        except Exception:
            logger.warning(
                "pdf2image failed for page %d of %s", page_no, path_abs, exc_info=True
            )
            return None

        if not images:
            return None

        try:
            text = pytesseract.image_to_string(images[0], lang=self.language)
            return text.strip()
        except Exception:
            logger.warning(
                "Tesseract OCR failed for page %d of %s", page_no, path_abs, exc_info=True
            )
            return None
