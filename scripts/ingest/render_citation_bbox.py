#!/usr/bin/env python3
"""
Citation Bbox Renderer — Draws bounding boxes on PDF pages for visual audit.

Called by Express server via child_process to render citation overlays.

Usage:
    python3 render_citation_bbox.py <chunk_id> [--output-dir /tmp/citation-renders]
    python3 render_citation_bbox.py <chunk_id> --metadata-only

Output (stdout, JSON):
    {
        "image_path": "/tmp/citation-renders/chunk_abc123_p5.png",
        "chunk_id": "abc123:00005",
        "doc_id": "abc123",
        "page_num": 5,
        "bbox_super": [59.2, 37.4, 375.1, 598.3],
        "bbox_blocks": [[59.2, 37.4, 375.1, 120.5], ...],
        "chunk_text": "The text content...",
        "path_rel": "rhetorical_ontology/Author - Title.pdf",
        "author": "Author",
        "title": "Title"
    }
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

# Ensure we can import from scripts/ingest/
sys.path.insert(0, str(Path(__file__).parent))


def find_chunk_in_manifest(chunk_id: str, manifest_path: Path) -> dict | None:
    """Find a chunk's metadata in manifest.jsonl by matching chunk IDs in Chroma."""
    doc_id = chunk_id.split(":")[0] if ":" in chunk_id else chunk_id

    for line in manifest_path.read_text().strip().split("\n"):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue

        if record.get("doc_id") == doc_id and record.get("status") == "ok":
            return record

    return None


def find_chunk_in_chroma(chunk_id: str, chroma_dir: str, collection: str) -> dict | None:
    """Look up chunk metadata from ChromaDB."""
    try:
        import chromadb
        client = chromadb.PersistentClient(path=chroma_dir)
        coll = client.get_collection(collection)
        result = coll.get(ids=[chunk_id], include=["metadatas", "documents"])
        if result and result["ids"]:
            meta = result["metadatas"][0] if result["metadatas"] else {}
            doc = result["documents"][0] if result["documents"] else ""
            return {**meta, "chunk_text": doc, "chunk_id": chunk_id}
    except Exception as e:
        print(json.dumps({"error": f"ChromaDB lookup failed: {e}"}), file=sys.stderr)
    return None


def render_bbox_overlay(
    pdf_path: str,
    page_num: int,
    bboxes_data: list,
    output_path: str,
    marker_page_bbox: list | None = None,
) -> str:
    """Draw bounding boxes on a PDF page and save as PNG.

    Args:
        pdf_path: Path to source PDF
        page_num: 1-indexed page number
        bboxes_data: List of {"page_num": N, "coords": [...], "blocks": [[...]]}
        output_path: Where to save the PNG
        marker_page_bbox: Marker's page bbox for coordinate scaling

    Returns:
        Path to the saved PNG
    """
    import fitz

    doc = fitz.open(pdf_path)
    page_idx = page_num - 1

    if page_idx < 0 or page_idx >= len(doc):
        doc.close()
        raise ValueError(f"Page {page_num} out of range (doc has {len(doc)} pages)")

    page = doc[page_idx]
    page_rect = page.rect

    # Find the matching page entry in bboxes_data
    page_entry = None
    for entry in bboxes_data:
        if entry.get("page_num") == page_num:
            page_entry = entry
            break

    if not page_entry:
        # No bbox for this page — render without overlay
        pix = page.get_pixmap(dpi=200)
        pix.save(output_path)
        doc.close()
        return output_path

    # Scale factors (Marker coords → PDF coords)
    if marker_page_bbox:
        sx = page_rect.width / max(marker_page_bbox[2], 1)
        sy = page_rect.height / max(marker_page_bbox[3], 1)
    else:
        sx = sy = 1.0

    coords = page_entry.get("coords", [])
    blocks = page_entry.get("blocks", [])

    # Draw super-box in red (thick)
    if coords and len(coords) == 4:
        x1, y1, x2, y2 = coords
        page.draw_rect(
            fitz.Rect(x1 * sx, y1 * sy, x2 * sx, y2 * sy),
            color=(1, 0, 0),
            width=2.5,
        )

    # Draw individual blocks in blue (thin)
    for blk in blocks:
        if len(blk) == 4:
            bx1, by1, bx2, by2 = blk
            page.draw_rect(
                fitz.Rect(bx1 * sx, by1 * sy, bx2 * sx, by2 * sy),
                color=(0, 0, 1),
                width=1.0,
            )

    # Render to PNG
    pix = page.get_pixmap(dpi=200)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pix.save(output_path)
    doc.close()

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Render citation bounding boxes on PDF")
    parser.add_argument("chunk_id", nargs="?", default=None,
                        help="Chunk ID to render (e.g., 'abc123:00005')")
    parser.add_argument("--output-dir", default="/tmp/citation-renders",
                        help="Directory for rendered PNGs")
    parser.add_argument("--metadata-only", action="store_true",
                        help="Return metadata JSON without rendering")
    parser.add_argument("--manifest", default="scripts/ingest/manifest.jsonl",
                        help="Path to manifest.jsonl")
    parser.add_argument("--chroma-dir", default="vector_db_1536",
                        help="ChromaDB directory")
    parser.add_argument("--collection", default="knowledge_chunks",
                        help="ChromaDB collection name")
    # Direct mode: bypass ChromaDB lookup, pass PDF path and bboxes directly
    parser.add_argument("--pdf", default=None,
                        help="Direct PDF path (bypasses ChromaDB lookup)")
    parser.add_argument("--bboxes-json", default=None,
                        help="Direct bboxes JSON array (bypasses ChromaDB lookup)")
    # Quote-level mode: search for exact text on a specific page
    parser.add_argument("--quote-text", default=None,
                        help="Specific quotation text to highlight (uses PyMuPDF search_for)")
    parser.add_argument("--target-page", type=int, default=None,
                        help="Page number to search for quote text (1-indexed)")
    args = parser.parse_args()

    # Quote-level mode: --pdf + --quote-text + --target-page
    # Uses difflib fuzzy sequence matching on word-level coordinates.
    # Handles hyphenation, ligatures, footnote superscripts, ellipsis splits,
    # and CropBox/MediaBox coordinate discrepancies (since get_text("words")
    # and draw_rect() share the same internal coordinate space).
    if args.pdf and args.quote_text and args.target_page:
        import fitz
        import difflib

        if not Path(args.pdf).exists():
            print(json.dumps({"error": f"PDF not found: {args.pdf}"}))
            sys.exit(1)

        os.makedirs(args.output_dir, exist_ok=True)
        doc = fitz.open(args.pdf)
        page_idx = args.target_page - 1

        if page_idx < 0 or page_idx >= len(doc):
            print(json.dumps({"error": f"Page {args.target_page} out of range (doc has {len(doc)} pages)"}))
            doc.close()
            sys.exit(1)

        page = doc[page_idx]

        def normalize_word(w: str) -> str:
            """Strip punctuation and lowercase for robust matching."""
            return re.sub(r'\W+', '', w.lower())

        def find_fragment_bboxes(page_words: list, fragment_text: str,
                                 similarity_threshold: float = 0.85) -> list:
            """Find tight line-level bounding boxes for a text fragment using
            difflib sliding-window fuzzy matching."""
            quote_tokens = [normalize_word(w) for w in fragment_text.split()
                            if normalize_word(w)]
            page_tokens = [normalize_word(w[4]) for w in page_words]

            if not quote_tokens:
                return []

            best_ratio = 0.0
            best_start = -1
            quote_len = len(quote_tokens)

            for i in range(len(page_tokens) - quote_len + 1):
                window = page_tokens[i:i + quote_len]
                ratio = difflib.SequenceMatcher(None, window, quote_tokens).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_start = i
                if ratio == 1.0:
                    break

            if best_ratio < similarity_threshold or best_start == -1:
                return []

            matched_words = page_words[best_start:best_start + quote_len]

            # Group coordinates by line number for clean per-line rectangles
            lines: dict = {}
            for w in matched_words:
                line_no = w[6]
                if line_no not in lines:
                    lines[line_no] = list(w[:4])
                else:
                    lines[line_no][0] = min(lines[line_no][0], w[0])
                    lines[line_no][1] = min(lines[line_no][1], w[1])
                    lines[line_no][2] = max(lines[line_no][2], w[2])
                    lines[line_no][3] = max(lines[line_no][3], w[3])

            return [fitz.Rect(coords) + (-2, -2, 2, 2) for coords in lines.values()]

        page_words = page.get_text("words")

        # Split the LLM quote by ellipsis patterns and match each fragment
        fragments = re.split(r'\.\.\.|\[\.\.\.\]|…', args.quote_text)
        all_rects = []
        for frag in fragments:
            if len(frag.strip().split()) > 2:
                rects = find_fragment_bboxes(page_words, frag.strip())
                all_rects.extend(rects)

        safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', Path(args.pdf).stem)
        output_path = os.path.join(args.output_dir, f"{safe_name}_p{args.target_page}.png")

        if all_rects:
            for r in all_rects:
                page.draw_rect(r, color=(1, 0.5, 0), width=1.5,
                               fill=(1, 0.8, 0.2), fill_opacity=0.3)
            pix = page.get_pixmap(dpi=150)
            pix.save(output_path)
        else:
            # Don't write a PNG if no quote was found — prevents orphan renders
            output_path = ""

        doc.close()

        print(json.dumps({
            "image_path": output_path,
            "page_num": args.target_page,
            "quote_matches": len(all_rects),
            "mode": "quote" if all_rects else "no_match",
        }))
        return

    # Direct mode: --pdf + --bboxes-json (bypasses ChromaDB)
    if args.pdf and args.bboxes_json:
        bboxes_data = json.loads(args.bboxes_json)
        os.makedirs(args.output_dir, exist_ok=True)

        if not Path(args.pdf).exists():
            print(json.dumps({"error": f"PDF not found: {args.pdf}"}))
            sys.exit(1)

        results = []
        for bbox_entry in bboxes_data:
            page_num = bbox_entry.get("page", bbox_entry.get("page_num", 1))
            # Normalize key to "page_num" for render_bbox_overlay
            if "page" in bbox_entry and "page_num" not in bbox_entry:
                bbox_entry["page_num"] = bbox_entry["page"]
            safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', Path(args.pdf).stem)
            output_path = os.path.join(args.output_dir, f"{safe_name}_p{page_num}.png")
            render_bbox_overlay(args.pdf, page_num, [bbox_entry], output_path)
            results.append({"image_path": output_path, "page_num": page_num})

        # Return first result (primary page) for single-image consumers
        if results:
            print(json.dumps(results[0]))
        return

    if not args.chunk_id:
        parser.error("chunk_id is required unless --pdf and --bboxes-json are provided")

    # Look up chunk in ChromaDB
    chunk_meta = find_chunk_in_chroma(args.chunk_id, args.chroma_dir, args.collection)
    if not chunk_meta:
        print(json.dumps({"error": f"Chunk {args.chunk_id} not found in ChromaDB"}))
        sys.exit(1)

    # Parse bboxes from Chroma metadata
    bboxes_raw = chunk_meta.get("bboxes", "")
    if isinstance(bboxes_raw, str) and bboxes_raw:
        try:
            bboxes_data = json.loads(bboxes_raw)
        except json.JSONDecodeError:
            bboxes_data = []
    elif isinstance(bboxes_raw, list):
        bboxes_data = bboxes_raw
    else:
        bboxes_data = []

    # Get document info from manifest
    manifest_path = Path(args.manifest)
    doc_record = find_chunk_in_manifest(args.chunk_id, manifest_path) if manifest_path.exists() else None

    path_rel = chunk_meta.get("path_rel", "")
    path_abs = chunk_meta.get("path_abs", "")
    page_start = int(chunk_meta.get("page_start", 1))
    author = chunk_meta.get("author_raw", "")
    title = chunk_meta.get("title_raw", "")

    if doc_record:
        path_abs = doc_record.get("path_abs", path_abs)
        path_rel = doc_record.get("path_rel", path_rel)

    # Determine target page
    target_page = page_start
    if bboxes_data:
        target_page = bboxes_data[0].get("page_num", page_start)

    # Build result
    result = {
        "chunk_id": args.chunk_id,
        "doc_id": chunk_meta.get("doc_id", ""),
        "page_num": target_page,
        "path_rel": path_rel,
        "path_abs": path_abs,
        "author": author,
        "title": title,
        "chunk_text": chunk_meta.get("chunk_text", ""),
        "has_bboxes": bool(bboxes_data),
        "bbox_super": bboxes_data[0].get("coords", []) if bboxes_data else [],
        "bbox_blocks": bboxes_data[0].get("blocks", []) if bboxes_data else [],
        "bboxes_all_pages": bboxes_data,
    }

    if args.metadata_only:
        print(json.dumps(result, indent=2))
        return

    # Render
    if not Path(path_abs).exists():
        result["error"] = f"PDF not found: {path_abs}"
        print(json.dumps(result, indent=2))
        sys.exit(1)

    if not bboxes_data:
        result["error"] = "No bounding boxes to render"
        print(json.dumps(result, indent=2))
        sys.exit(1)

    safe_id = re.sub(r'[^a-zA-Z0-9_]', '_', args.chunk_id)
    output_path = os.path.join(args.output_dir, f"{safe_id}_p{target_page}.png")

    render_bbox_overlay(path_abs, target_page, bboxes_data, output_path)
    result["image_path"] = output_path

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
