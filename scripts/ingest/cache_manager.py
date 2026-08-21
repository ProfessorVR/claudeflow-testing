#!/usr/bin/env python3
"""
Cache Manager — Intermediate result caching for ingestion pipeline.

Caches OCR, table, and image extraction results to avoid re-running
expensive operations on subsequent ingestion runs.

Interface contract (from run_ingest_phase2.py):
    from cache_manager import CacheManager
    cm = CacheManager(config={})
    cm.get_cached_ocr(path_abs, page_num) -> str | None
    cm.cache_ocr_result(path_abs, page_num, text, metadata={})
    cm.get_cached_tables(path_abs) -> TableExtractionResult | None
    cm.cache_table_result(path_abs, result)
    cm.get_cached_images(path_abs) -> ImageExtractionResult | None
    cm.cache_image_result(path_abs, result)
    cm.get_cache_stats() -> dict
    cm.clear_cache() -> int
"""

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def _file_hash(path: Path) -> str:
    """SHA-256 of first 64KB + file size for fast cache key."""
    h = hashlib.sha256()
    h.update(str(path.stat().st_size).encode())
    with open(path, "rb") as f:
        h.update(f.read(65536))
    return h.hexdigest()[:16]


class CacheManager:
    """Disk-backed cache for extraction results."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        self._cache_dir = Path(config.get("cache_dir", ".ingest_cache"))
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_images = config.get("cache_images", True)
        self._ttl_seconds = config.get("ttl_seconds", 86400 * 30)  # 30 days default

    def _key(self, path_abs, suffix: str = "") -> str:
        return _file_hash(Path(path_abs)) + suffix

    def _cache_path(self, key: str) -> Path:
        return self._cache_dir / f"{key}.json"

    # ── OCR cache ──────────────────────────────────────────────────────

    def get_cached_ocr(self, path_abs, page_num: int) -> Optional[str]:
        """Get cached OCR text for a specific page."""
        cp = self._cache_path(self._key(path_abs, f"_ocr_p{page_num}"))
        if not cp.exists():
            return None
        try:
            data = json.loads(cp.read_text())
            if time.time() - data.get("ts", 0) > self._ttl_seconds:
                cp.unlink(missing_ok=True)
                return None
            return data.get("text")
        except Exception:
            return None

    def cache_ocr_result(self, path_abs, page_num: int, text: str,
                         metadata: Optional[Dict] = None):
        """Cache OCR text for a specific page."""
        key = self._key(path_abs, f"_ocr_p{page_num}")
        data = {"text": text, "ts": time.time(), "meta": metadata or {}}
        self._cache_path(key).write_text(json.dumps(data))

    # ── Table cache ────────────────────────────────────────────────────

    def get_cached_tables(self, path_abs):
        """Get cached table extraction result. Returns None or reconstructed result."""
        cp = self._cache_path(self._key(path_abs, "_tables"))
        if not cp.exists():
            return None
        try:
            data = json.loads(cp.read_text())
            if time.time() - data.get("ts", 0) > self._ttl_seconds:
                cp.unlink(missing_ok=True)
                return None
            return _reconstruct_table_result(data["result"])
        except Exception:
            return None

    def cache_table_result(self, path_abs, result):
        """Cache a TableExtractionResult."""
        key = self._key(path_abs, "_tables")
        data = {"result": _serialize_table_result(result), "ts": time.time()}
        self._cache_path(key).write_text(json.dumps(data))

    # ── Image cache ────────────────────────────────────────────────────

    def get_cached_images(self, path_abs):
        """Get cached image extraction result."""
        cp = self._cache_path(self._key(path_abs, "_images"))
        if not cp.exists():
            return None
        try:
            data = json.loads(cp.read_text())
            if time.time() - data.get("ts", 0) > self._ttl_seconds:
                cp.unlink(missing_ok=True)
                return None
            return _reconstruct_image_result(data["result"])
        except Exception:
            return None

    def cache_image_result(self, path_abs, result):
        """Cache an ImageExtractionResult."""
        key = self._key(path_abs, "_images")
        data = {"result": _serialize_image_result(result), "ts": time.time()}
        self._cache_path(key).write_text(json.dumps(data))

    # ── Utility ────────────────────────────────────────────────────────

    def clear_cache(self) -> int:
        """Remove all cache files. Returns count of files removed."""
        count = 0
        for f in self._cache_dir.glob("*.json"):
            f.unlink()
            count += 1
        return count

    def get_cache_stats(self) -> Dict[str, Any]:
        """Return cache statistics."""
        files = list(self._cache_dir.glob("*.json"))
        total_size = sum(f.stat().st_size for f in files)
        ocr_count = sum(1 for f in files if "_ocr_" in f.name)
        table_count = sum(1 for f in files if "_tables" in f.name)
        image_count = sum(1 for f in files if "_images" in f.name)
        return {
            "enabled": True,
            "total_entries": len(files),
            "ocr_entries": ocr_count,
            "table_entries": table_count,
            "image_entries": image_count,
            "total_size_mb": total_size / (1024 * 1024),
        }


# ── Serialization helpers ──────────────────────────────────────────────

def _serialize_table_result(result) -> Dict:
    """Serialize a TableExtractionResult to JSON-safe dict."""
    tables = []
    for t in result.tables:
        tables.append({
            "page_num": t.page_num,
            "csv_content": t.csv_content,
            "markdown": t.markdown,
            "json_content": t.json_content,
            "rows": getattr(t, "rows", 0),
            "cols": getattr(t, "cols", 0),
        })
    return {
        "total_tables": result.total_tables,
        "pages_with_tables": result.pages_with_tables,
        "tables": tables,
    }


def _reconstruct_table_result(data: Dict):
    """Reconstruct a TableExtractionResult from cached dict."""
    try:
        from table_extractor import TableExtractionResult, Table
        tables = [Table(**t) for t in data["tables"]]
        return TableExtractionResult(
            total_tables=data["total_tables"],
            pages_with_tables=data["pages_with_tables"],
            tables=tables,
        )
    except ImportError:
        return None


def _serialize_image_result(result) -> Dict:
    """Serialize an ImageExtractionResult to JSON-safe dict."""
    images = []
    for img in result.images:
        images.append({
            "page_num": img.page_num,
            "image_index": img.image_index,
            "bbox": img.bbox,
            "width": img.width,
            "height": img.height,
            "caption": img.caption,
            "format": img.format,
        })
    return {
        "total_images": result.total_images,
        "pages_with_images": result.pages_with_images,
        "images": images,
    }


def _reconstruct_image_result(data: Dict):
    """Reconstruct an ImageExtractionResult from cached dict."""
    try:
        from image_extractor import ImageExtractionResult, ExtractedImage
        images = [ExtractedImage(
            page_num=d["page_num"],
            image_index=d["image_index"],
            bbox=tuple(d["bbox"]),
            width=d["width"],
            height=d["height"],
            caption=d.get("caption"),
            fmt=d.get("format", "png"),
        ) for d in data["images"]]
        return ImageExtractionResult(
            total_images=data["total_images"],
            pages_with_images=data["pages_with_images"],
            images=images,
        )
    except ImportError:
        return None
