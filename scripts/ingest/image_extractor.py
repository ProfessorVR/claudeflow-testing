"""
Image extraction module for PDF ingestion pipeline.

Extracts embedded images from PDF documents using pymupdf (fitz),
filters by configurable size thresholds, and produces embeddable
text chunks for vector storage.

Dependencies: pymupdf (fitz), Pillow
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import fitz  # pymupdf
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default configuration
# ---------------------------------------------------------------------------
_DEFAULT_CONFIG = {
    "min_width": 150,
    "min_height": 150,
    "max_width": 5000,
    "max_height": 5000,
    "min_area": 50000,       # minimum pixel area (e.g. 224x224)
    "output_formats": ["png"],
}


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
@dataclass
class ExtractedImage:
    """A single image extracted from a PDF page."""

    page_num: int          # 1-indexed
    image_index: int       # 0-indexed within the entire document
    bbox: Tuple[float, float, float, float]  # (x0, y0, x1, y1)
    width: int             # pixels
    height: int            # pixels
    caption: Optional[str] = None   # set externally by layout analyzer
    format: str = "png"
    _data: bytes = field(default=b"", repr=False)  # raw image bytes


@dataclass
class ImageExtractionResult:
    """Aggregate result of image extraction for a single document."""

    total_images: int = 0
    pages_with_images: List[int] = field(default_factory=list)
    images: List[ExtractedImage] = field(default_factory=list)


# ---------------------------------------------------------------------------
# ImageExtractor
# ---------------------------------------------------------------------------
class ImageExtractor:
    """Extracts images from PDF files using pymupdf."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        cfg = {**_DEFAULT_CONFIG, **(config or {})}
        self.min_width: int = int(cfg["min_width"])
        self.min_height: int = int(cfg["min_height"])
        self.max_width: int = int(cfg["max_width"])
        self.max_height: int = int(cfg["max_height"])
        self.min_area: int = int(cfg.get("min_area", 50000))
        self.output_formats: List[str] = list(cfg["output_formats"])

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def extract_images(
        self,
        path_abs: str | Path,
        output_dir: Optional[Path] = None,
    ) -> ImageExtractionResult:
        """Extract images from a PDF file.

        Args:
            path_abs: Absolute path to the PDF.
            output_dir: If provided, save extracted images and JSON
                        metadata sidecars into this directory.

        Returns:
            ImageExtractionResult with extracted image metadata.
        """
        path_abs = Path(path_abs)
        if not path_abs.exists():
            logger.error("PDF not found: %s", path_abs)
            return ImageExtractionResult()

        if output_dir is not None:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)

        images: List[ExtractedImage] = []
        pages_with_images: set[int] = set()
        global_index = 0

        try:
            doc = fitz.open(str(path_abs))
        except Exception:
            logger.exception("Failed to open PDF: %s", path_abs)
            return ImageExtractionResult()

        try:
            for page_index in range(len(doc)):
                page = doc[page_index]
                page_num = page_index + 1  # 1-indexed

                image_list = page.get_images(full=True)
                if not image_list:
                    continue

                # Track xrefs already processed on this page to avoid
                # duplicates (same xref can appear in multiple references).
                seen_xrefs: set[int] = set()

                for img_info in image_list:
                    xref = img_info[0]
                    if xref in seen_xrefs:
                        continue
                    seen_xrefs.add(xref)

                    extracted = self._extract_single_image(
                        doc, page, xref, page_num, global_index,
                    )
                    if extracted is None:
                        continue

                    # Save to disk if output_dir given
                    if output_dir is not None:
                        self._save_image(extracted, output_dir)

                    images.append(extracted)
                    pages_with_images.add(page_num)
                    global_index += 1
        finally:
            doc.close()

        sorted_pages = sorted(pages_with_images)
        logger.info(
            "Extracted %d images from %s across %d pages",
            len(images), path_abs.name, len(sorted_pages),
        )

        return ImageExtractionResult(
            total_images=len(images),
            pages_with_images=sorted_pages,
            images=images,
        )

    def create_image_chunks(
        self,
        image: ExtractedImage,
        context_before: Optional[str],
        context_after: Optional[str],
        doc_id: str,
        chunk_index: int,
    ) -> Dict[str, Any]:
        """Produce an embeddable text chunk for a single extracted image.

        Args:
            image: The extracted image object.
            context_before: Text appearing before the image on the page.
            context_after: Text appearing after the image on the page.
            doc_id: Unique document identifier.
            chunk_index: Global chunk index within the document.

        Returns:
            Dict with ``"text"`` (embeddable string) and ``"metadata"``
            (image-specific metadata dict).
        """
        parts: List[str] = [
            f"[IMAGE] Page {image.page_num}, {image.width}\u00d7{image.height} pixels"
        ]

        if image.caption:
            parts.append(f"Caption: {image.caption}")

        if context_before:
            parts.append(context_before.strip())

        if context_after:
            parts.append(context_after.strip())

        text = "\n".join(parts)

        metadata: Dict[str, Any] = {
            "type": "image",
            "page_num": image.page_num,
            "image_index": image.image_index,
            "bbox": list(image.bbox),
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "doc_id": doc_id,
            "chunk_index": chunk_index,
        }
        if image.caption:
            metadata["caption"] = image.caption

        return {"text": text, "metadata": metadata}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _extract_single_image(
        self,
        doc: fitz.Document,
        page: fitz.Page,
        xref: int,
        page_num: int,
        global_index: int,
    ) -> Optional[ExtractedImage]:
        """Extract and validate a single image by xref."""
        try:
            base_image = doc.extract_image(xref)
        except Exception:
            logger.debug("Could not extract xref %d on page %d", xref, page_num)
            return None

        if not base_image or not base_image.get("image"):
            return None

        raw_bytes: bytes = base_image["image"]
        img_ext: str = base_image.get("ext", "png")
        width: int = base_image.get("width", 0)
        height: int = base_image.get("height", 0)

        # If pymupdf didn't report dimensions, measure via Pillow.
        if width == 0 or height == 0:
            try:
                with Image.open(BytesIO(raw_bytes)) as pil_img:
                    width, height = pil_img.size
            except Exception:
                logger.debug("Cannot determine size for xref %d", xref)
                return None

        # Size filters
        if width < self.min_width or height < self.min_height:
            logger.debug(
                "Skipping tiny image xref %d (%dx%d) on page %d",
                xref, width, height, page_num,
            )
            return None

        if (width * height) < self.min_area:
            logger.debug(
                "Skipping small-area image xref %d (%dx%d = %d px²) on page %d",
                xref, width, height, width * height, page_num,
            )
            return None

        if width > self.max_width or height > self.max_height:
            logger.debug(
                "Skipping oversized image xref %d (%dx%d) on page %d",
                xref, width, height, page_num,
            )
            return None

        # Filter out full-page background / scan images.
        # These cover most of the page area and are not actual figures.
        page_rect = page.rect
        page_area = page_rect.width * page_rect.height
        if page_area > 0:
            # Estimate image area on page via bbox or pixel ratio
            bbox_candidate = self._find_image_bbox(page, xref)
            if bbox_candidate:
                img_area = ((bbox_candidate[2] - bbox_candidate[0]) *
                            (bbox_candidate[3] - bbox_candidate[1]))
                coverage = img_area / page_area
                if coverage > 0.6:
                    logger.debug(
                        "Skipping full-page image xref %d (%.0f%% page coverage) on page %d",
                        xref, coverage * 100, page_num,
                    )
                    return None
            else:
                # No bbox available — use pixel dimensions vs typical page size
                # A4 at 150dpi ≈ 1240×1754. If image is >60% of that, skip.
                if width > 500 and height > 700:
                    # Likely a full-page scan or background
                    aspect = width / max(height, 1)
                    if 0.5 < aspect < 1.0:
                        logger.debug(
                            "Skipping likely full-page image xref %d (%dx%d) on page %d",
                            xref, width, height, page_num,
                        )
                        return None

        # Determine bounding box on the page. pymupdf may report the
        # image across multiple rectangles; take the union.
        bbox = self._find_image_bbox(page, xref)

        # Convert raw bytes to the desired output format if needed.
        output_fmt = self.output_formats[0] if self.output_formats else "png"
        if img_ext.lower() != output_fmt.lower():
            converted = self._convert_format(raw_bytes, output_fmt)
            if converted is not None:
                raw_bytes = converted
                img_ext = output_fmt

        return ExtractedImage(
            page_num=page_num,
            image_index=global_index,
            bbox=bbox,
            width=width,
            height=height,
            caption=None,
            format=img_ext.lower(),
            _data=raw_bytes,
        )

    @staticmethod
    def _find_image_bbox(
        page: fitz.Page, xref: int,
    ) -> Tuple[float, float, float, float]:
        """Return the bounding box of an image on a page by xref.

        Falls back to the full page rect if the image rect cannot
        be determined.
        """
        try:
            img_rects = page.get_image_rects(xref)
            if img_rects:
                # Union all rects for this xref
                union = img_rects[0]
                for r in img_rects[1:]:
                    union = union | r  # fitz.Rect union
                return (union.x0, union.y0, union.x1, union.y1)
        except Exception:
            pass

        # Fallback
        r = page.rect
        return (r.x0, r.y0, r.x1, r.y1)

    @staticmethod
    def _convert_format(raw_bytes: bytes, target_fmt: str) -> Optional[bytes]:
        """Convert raw image bytes to the target format via Pillow."""
        try:
            with Image.open(BytesIO(raw_bytes)) as pil_img:
                # Ensure RGB for JPEG output
                if target_fmt.lower() in ("jpeg", "jpg") and pil_img.mode in ("RGBA", "P"):
                    pil_img = pil_img.convert("RGB")
                buf = BytesIO()
                pil_fmt = "JPEG" if target_fmt.lower() in ("jpeg", "jpg") else target_fmt.upper()
                pil_img.save(buf, format=pil_fmt)
                return buf.getvalue()
        except Exception:
            logger.debug("Format conversion to %s failed", target_fmt)
            return None

    def _save_image(self, image: ExtractedImage, output_dir: Path) -> None:
        """Save an extracted image and its JSON sidecar to *output_dir*."""
        base_name = f"image_{image.image_index:03d}_page_{image.page_num:03d}"
        image_path = output_dir / f"{base_name}.{image.format}"
        meta_path = output_dir / f"{base_name}.json"

        try:
            image_path.write_bytes(image._data)
        except Exception:
            logger.exception("Failed to save image %s", image_path)
            return

        sidecar: Dict[str, Any] = {
            "page_num": image.page_num,
            "image_index": image.image_index,
            "bbox": list(image.bbox),
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "file": image_path.name,
        }
        if image.caption:
            sidecar["caption"] = image.caption

        try:
            meta_path.write_text(json.dumps(sidecar, indent=2), encoding="utf-8")
        except Exception:
            logger.exception("Failed to save metadata %s", meta_path)
