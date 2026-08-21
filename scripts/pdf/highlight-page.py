#!/usr/bin/env python3
"""Render a PDF page as PNG with highlighted text regions using PyMuPDF.

Enhancements over original:
- Dehyphenation: joins line-break hyphens (be-\\nings → beings)
- Full quote coverage: highlights ALL matching text, not just first snippet
- Sentence-level chunking: splits quote into sentences and highlights each
- Footnote/endnote extraction: detects note markers and extracts note text
- Rich text extraction: preserves italic, bold, superscript flags per span
"""
import json
import re
import sys
import unicodedata
import fitz  # PyMuPDF


def normalize(text):
    """Normalize text for fuzzy matching: NFC Unicode + collapse whitespace."""
    text = unicodedata.normalize('NFC', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def strip_diacritics(text):
    """Strip combining diacritical marks, returning base characters only.

    Used as last-resort fallback when NFC search fails on polytonic Greek, etc.
    Example: ἐντελέχεια → εντελεχεια, Ἀρετή → Αρετη
    """
    # NFD decomposes precomposed characters (ά → α + combining acute)
    nfd = unicodedata.normalize('NFD', text)
    # Remove combining marks (category M: Mn, Mc, Me)
    stripped = ''.join(c for c in nfd if not unicodedata.category(c).startswith('M'))
    return stripped


def search_for_unicode(page, text):
    """search_for() with Unicode normalization fallback chain.

    Tries: raw text → NFC → NFKC → diacritics-stripped (last resort).
    Returns the first set of rects found.
    """
    if not text or not text.strip():
        return []

    # Try 1: raw text as-is
    rects = page.search_for(text)
    if rects:
        return rects

    # Try 2: NFC (precomposed) — most PDFs store text this way
    nfc = unicodedata.normalize('NFC', text)
    if nfc != text:
        rects = page.search_for(nfc)
        if rects:
            return rects

    # Try 3: NFKC (compatibility decomposition then compose)
    # Handles ligatures, width variants, etc.
    nfkc = unicodedata.normalize('NFKC', text)
    if nfkc != nfc and nfkc != text:
        rects = page.search_for(nfkc)
        if rects:
            return rects

    # Try 4: Extract page text, NFC both sides, do substring match
    # This handles cases where search_for() has internal normalization issues
    page_text = normalize(page.get_text("text"))
    search_nfc = normalize(text)
    if search_nfc in page_text:
        # The text IS on the page — search_for just can't find it.
        # Try progressively shorter snippets with search_for
        words = search_nfc.split()
        for wsize in [min(6, len(words)), min(4, len(words)), min(3, len(words))]:
            if wsize < 2:
                break
            snippet = ' '.join(words[:wsize])
            rects = page.search_for(snippet)
            if rects:
                return rects
            # Also try from end
            snippet = ' '.join(words[-wsize:])
            rects = page.search_for(snippet)
            if rects:
                return rects

    # Try 5: diacritics-stripped (absolute last resort — may match wrong text)
    stripped = strip_diacritics(text)
    if stripped != text and stripped != nfc:
        rects = page.search_for(stripped)
        if rects:
            return rects

    return []


def dehyphenate(text):
    """Join hyphenated line breaks: 'be-\\nings' → 'beings', 'self-\\naware' stays 'self-aware'.

    Only joins when the hyphen is at a line break AND the resulting word
    is a plausible word fragment continuation (lowercase after hyphen).
    """
    # Pattern: word-fragment + hyphen + newline + lowercase continuation
    text = re.sub(r'(\w)-\s*\n\s*([a-z])', r'\1\2', text)
    # Also handle cases where OCR already collapsed the newline but left the pattern
    # e.g., "be- ings" → "beings" (hyphen + space + lowercase)
    text = re.sub(r'(\w)-\s{2,}([a-z])', r'\1\2', text)
    return text


def strip_punctuation(text):
    """Remove most punctuation for looser matching."""
    return re.sub(r'[,;:!?\-\u2013\u2014\u201c\u201d\u2018\u2019\u2026]', '', text)


def split_into_sentences(text):
    """Split text into sentence-like chunks for multi-segment highlighting."""
    # Split on sentence boundaries but keep meaningful chunks
    parts = re.split(r'(?<=[.!?])\s+', text)
    return [p.strip() for p in parts if p.strip() and len(p.strip()) > 5]


def find_text_on_page(page, search_text):
    """Try multiple strategies to find the ENTIRE text on the page.

    Uses search_for_unicode() for robust Unicode/diacritic handling.
    Returns all rectangles covering the full quote, not just the first snippet.
    """
    all_rects = []

    # Pre-process: dehyphenate the search text
    dehyph = dehyphenate(search_text)
    cleaned = normalize(dehyph)

    # Strategy 1: Full text match (best case) — with Unicode fallback chain
    rects = search_for_unicode(page, cleaned)
    if rects:
        return rects

    # Strategy 2: Try the original text as-is (without dehyphenation)
    rects = search_for_unicode(page, normalize(search_text))
    if rects:
        return rects

    # Strategy 3: Sentence-level chunking — highlight each sentence separately
    # This captures the ENTIRETY of the quote across multiple text blocks
    sentences = split_into_sentences(cleaned)
    if len(sentences) > 1:
        for sentence in sentences:
            rects = search_for_unicode(page, sentence)
            if rects:
                all_rects.extend(rects)
            else:
                # Try shorter prefix of the sentence
                for length in [80, 50, 30]:
                    if len(sentence) > length:
                        rects = search_for_unicode(page, sentence[:length].strip())
                        if rects:
                            all_rects.extend(rects)
                            break
        if all_rects:
            return all_rects

    # Strategy 4: Overlapping phrase windows — slide through the text
    # Use longer windows than before to capture more of the quote
    words = cleaned.split()
    if len(words) >= 4:
        window_size = min(12, len(words))
        step = max(1, window_size // 2)
        for i in range(0, len(words) - 2, step):
            end = min(i + window_size, len(words))
            phrase = ' '.join(words[i:end])
            rects = search_for_unicode(page, phrase)
            if rects:
                all_rects.extend(rects)
            elif len(phrase) > 40:
                # Try shorter version of this window
                shorter = ' '.join(words[i:i + max(3, window_size // 2)])
                rects = search_for_unicode(page, shorter)
                if rects:
                    all_rects.extend(rects)
        if all_rects:
            return deduplicate_rects(all_rects)

    # Strategy 5: Progressive snippet fallback (original behavior, but try more variants)
    for variant in [cleaned, normalize(search_text), normalize(strip_punctuation(dehyph))]:
        for length in [len(variant), 150, 100, 60, 40, 25]:
            snippet = variant[:length].strip()
            if not snippet:
                continue
            rects = search_for_unicode(page, snippet)
            if rects:
                return rects

    # Strategy 6: Word windows from start AND end of quote
    if len(words) >= 3:
        for window_size in [5, 4, 3]:
            if len(words) >= window_size:
                # Try from start
                phrase = ' '.join(words[:window_size])
                rects = search_for_unicode(page, phrase)
                if rects:
                    all_rects.extend(rects)
                # Try from end
                phrase = ' '.join(words[-window_size:])
                rects2 = search_for_unicode(page, phrase)
                if rects2:
                    all_rects.extend(rects2)
                if all_rects:
                    return deduplicate_rects(all_rects)

    return all_rects


def deduplicate_rects(rects):
    """Remove overlapping/duplicate rectangles."""
    if not rects:
        return rects
    unique = []
    for r in rects:
        is_dup = False
        for u in unique:
            # If rects overlap substantially (>80% area), skip
            overlap = fitz.Rect(r) & fitz.Rect(u)
            if not overlap.is_empty:
                overlap_area = overlap.width * overlap.height
                r_area = max(r.width * r.height, 1)
                if overlap_area / r_area > 0.8:
                    is_dup = True
                    break
        if not is_dup:
            unique.append(r)
    return unique


def extract_footnotes(page, doc, page_idx):
    """Extract footnote/endnote text from the page.

    Looks for footnote markers (superscript numbers) and extracts the
    corresponding note text from the bottom of the page.

    Returns list of {marker, text} dicts.
    """
    notes = []
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]

    # Collect all text spans with position info
    page_height = page.rect.height
    bottom_threshold = page_height * 0.7  # footnotes typically in bottom 30%

    # Find footnote separator line or small-font text at bottom
    bottom_texts = []
    body_superscripts = set()

    for block in blocks:
        if block.get("type") != 0:  # text blocks only
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                bbox = span.get("bbox", (0, 0, 0, 0))
                text = span.get("text", "").strip()
                font_size = span.get("size", 12)
                flags = span.get("flags", 0)
                is_super = bool(flags & (1 << 0))  # superscript flag

                # Collect superscript numbers in body text
                if bbox[1] < bottom_threshold and is_super and re.match(r'^\d{1,3}$', text):
                    body_superscripts.add(text)

                # Collect text from bottom region (likely footnotes)
                if bbox[1] >= bottom_threshold:
                    bottom_texts.append({
                        "text": text,
                        "y": bbox[1],
                        "size": font_size,
                        "flags": flags,
                        "bbox": bbox,
                    })

    if not bottom_texts:
        return notes

    # Sort bottom text by y position then x
    bottom_texts.sort(key=lambda t: (t["y"], t["bbox"][0]))

    # Group into footnote entries (starts with a number matching a body superscript)
    current_note = None
    for item in bottom_texts:
        text = item["text"]
        # Check if this starts a new footnote (number at start)
        match = re.match(r'^(\d{1,3})\s*(.*)', text)
        if match and match.group(1) in body_superscripts:
            if current_note:
                notes.append(current_note)
            current_note = {"marker": match.group(1), "text": match.group(2)}
        elif current_note:
            current_note["text"] += " " + text
        # Also detect footnote patterns like "1. text" or "¹ text"
        elif not current_note:
            sup_match = re.match(r'^[\u00b9\u00b2\u00b3\u2074-\u2079]+\s*(.*)', text)
            if sup_match:
                marker_map = {'¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
                              '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'}
                marker = ''.join(marker_map.get(c, c) for c in text[0])
                current_note = {"marker": marker, "text": sup_match.group(1)}

    if current_note:
        notes.append(current_note)

    # Clean up note text
    for note in notes:
        note["text"] = normalize(note["text"])

    return notes


def find_region_by_span_text(blocks, search_words, tolerance=0.6):
    """Fallback: find quote region by fuzzy-matching span text content directly.

    When search_for() fails entirely (Unicode issues), we walk the page's text
    spans and find the region whose concatenated text best matches the search words.
    Returns (min_y, max_y) or None.
    """
    # Collect all text spans with positions
    all_spans = []
    for block in blocks:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                if text:
                    bbox = span.get("bbox", (0, 0, 0, 0))
                    all_spans.append({"text": text, "y": bbox[1], "y1": bbox[3]})

    if not all_spans:
        return None

    # Build a running text from spans and try to find the search text
    target = ' '.join(search_words).lower()
    target_stripped = strip_diacritics(target).lower()

    # Sliding window over spans
    best_start = None
    best_end = None
    best_score = 0

    for start_idx in range(len(all_spans)):
        running = ""
        for end_idx in range(start_idx, min(start_idx + 80, len(all_spans))):
            running += " " + all_spans[end_idx]["text"]
            running_clean = normalize(running).lower()

            # Check direct match
            if target[:40] in running_clean:
                score = min(len(running_clean), len(target)) / max(len(target), 1)
                if score > best_score:
                    best_score = score
                    best_start = start_idx
                    best_end = end_idx

            # Check diacritics-stripped match
            running_stripped = strip_diacritics(running_clean)
            if target_stripped[:40] in running_stripped:
                score = min(len(running_stripped), len(target_stripped)) / max(len(target_stripped), 1)
                if score > best_score:
                    best_score = score
                    best_start = start_idx
                    best_end = end_idx

            # If we've accumulated much more text than the target, stop
            if len(running_clean) > len(target) * 2:
                break

    if best_start is not None and best_score >= tolerance:
        min_y = all_spans[best_start]["y"] - 5
        max_y = all_spans[best_end]["y1"] + 10
        return (min_y, max_y)

    return None


def extract_rich_text(page, search_text):
    """Extract text with formatting info (italic, bold, superscript) for the quote region.

    Uses search_for_unicode() for robust diacritic handling, with a direct
    span-text-matching fallback when search_for() completely fails.
    Returns HTML-like formatted text preserving italics, bold, super/subscripts.
    """
    cleaned = normalize(dehyphenate(search_text))
    words = cleaned.split()
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]

    # Find the START of the quote region — with Unicode fallback
    start_rects = []
    for wsize in [len(cleaned), 150, 100, 60]:
        snippet = cleaned[:wsize].strip()
        if snippet:
            start_rects = search_for_unicode(page, snippet)
            if start_rects:
                break
    if not start_rects:
        for wsize in [8, 5, 3]:
            if len(words) >= wsize:
                start_rects = search_for_unicode(page, ' '.join(words[:wsize]))
                if start_rects:
                    break

    # Find the END of the quote region (search for last few words)
    end_rects = []
    if start_rects:
        for wsize in [8, 5, 3]:
            if len(words) >= wsize:
                end_rects = search_for_unicode(page, ' '.join(words[-wsize:]))
                if end_rects:
                    break

    # Calculate the region bounds
    min_y = None
    max_y = None

    if start_rects:
        min_y = min(r.y0 for r in start_rects) - 5
        if end_rects:
            max_y = max(r.y1 for r in end_rects) + 10
        else:
            # Estimate: ~15pt per line, ~10 words per line
            estimated_lines = max(3, len(words) // 8)
            max_y = max(r.y1 for r in start_rects) + (estimated_lines * 15)
    else:
        # FALLBACK: search_for() failed entirely — use direct span text matching
        region = find_region_by_span_text(blocks, words)
        if region:
            min_y, max_y = region
        else:
            return None

    # Determine the median body font size to distinguish sub/superscripts
    all_sizes = []
    for block in blocks:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                s = span.get("size", 0)
                if s > 4:
                    all_sizes.append(s)
    median_size = sorted(all_sizes)[len(all_sizes) // 2] if all_sizes else 10

    # Collect spans in the quote region
    formatted_parts = []
    for block in blocks:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                bbox = span.get("bbox", (0, 0, 0, 0))
                if bbox[1] < min_y or bbox[1] > max_y:
                    continue

                text = span.get("text", "")
                if not text.strip():
                    continue

                flags = span.get("flags", 0)
                font = span.get("font", "")
                size = span.get("size", 12)

                # Detect formatting from font flags and name
                is_italic = (bool(flags & (1 << 1))
                             or "italic" in font.lower()
                             or "oblique" in font.lower()
                             or "-it" in font.lower())
                is_bold = (bool(flags & (1 << 4))
                           or "bold" in font.lower()
                           or "-bd" in font.lower())
                is_super = bool(flags & (1 << 0))
                # Subscript: significantly smaller than median body text
                is_sub = (size < median_size * 0.75) and not is_super

                formatted_parts.append({
                    "text": text,
                    "italic": is_italic,
                    "bold": is_bold,
                    "superscript": is_super,
                    "subscript": is_sub,
                    "font": font,
                    "size": round(size, 1),
                    "y": bbox[1],
                    "x": bbox[0],
                })

    if not formatted_parts:
        return None

    # Filter out page headers and page numbers from rich text
    def is_page_noise(part):
        text = part["text"].strip()
        if not text:
            return True
        # Standalone page number
        if re.match(r'^\d{1,4}$', text):
            return True
        # All-caps running header (6+ chars, e.g., "ARISTOTLE'S METAPHYSICS")
        if len(text) > 5 and text == text.upper() and re.match(r'^[A-Z][A-Z\s\'\u2019\-:,\.]+$', text):
            return True
        # "Chapter N"
        if re.match(r'^Chapter\s+\d+$', text, re.IGNORECASE):
            return True
        return False

    formatted_parts = [p for p in formatted_parts if not is_page_noise(p)]
    if not formatted_parts:
        return None

    # Sort by position (top-to-bottom, left-to-right)
    formatted_parts.sort(key=lambda p: (round(p["y"] / 3) * 3, p["x"]))

    # Build HTML representation
    html_parts = []
    for part in formatted_parts:
        text = part["text"]
        if part["superscript"]:
            text = f"<sup>{text}</sup>"
        elif part["subscript"]:
            text = f"<sub>{text}</sub>"
        if part["bold"]:
            text = f"<b>{text}</b>"
        if part["italic"]:
            text = f"<i>{text}</i>"
        html_parts.append(text)

    # Join with appropriate spacing (dehyphenate the result)
    raw_html = " ".join(html_parts)
    # Clean up double spaces and hyphenation artifacts in HTML
    raw_html = re.sub(r'\s+', ' ', raw_html)
    raw_html = re.sub(r'(\w)-\s+([a-z])', r'\1\2', raw_html)

    return {
        "html": raw_html,
        "spans": formatted_parts,
    }


def main():
    if len(sys.argv) < 4:
        print("Usage: highlight-page.py <pdf_path> <page_num> <output_path> [search_text] [dpi] [--extract-meta]", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    page_num = int(sys.argv[2])  # 1-based
    output_path = sys.argv[3]
    search_text = sys.argv[4] if len(sys.argv) > 4 else ""
    dpi = 300
    extract_meta = False

    # Parse remaining args
    fallback_bboxes = None
    for i, arg in enumerate(sys.argv[5:], start=5):
        if arg == '--extract-meta':
            extract_meta = True
        elif arg == '--fallback-bboxes' and i + 1 < len(sys.argv):
            try:
                fallback_bboxes = json.loads(sys.argv[i + 1])
            except (json.JSONDecodeError, IndexError):
                pass
        elif arg.isdigit():
            dpi = int(arg)

    doc = fitz.open(pdf_path)
    if page_num < 1 or page_num > len(doc):
        print(f"Page {page_num} out of range (1-{len(doc)})", file=sys.stderr)
        sys.exit(1)

    # Try the requested page first, then adjacent pages (offset +-1, +-2)
    render_page_idx = page_num - 1
    rects = []
    used_fallback = False

    if search_text:
        for offset in [0, -1, 1, -2, 2]:
            candidate_idx = (page_num - 1) + offset
            if candidate_idx < 0 or candidate_idx >= len(doc):
                continue
            candidate_page = doc[candidate_idx]
            rects = find_text_on_page(candidate_page, search_text)
            if rects:
                render_page_idx = candidate_idx
                break

    # Fallback: if text search failed and chunk-level bboxes are available,
    # draw structural bounding box (light blue) to show source paragraph
    if search_text and not rects and fallback_bboxes:
        for entry in fallback_bboxes:
            fb_page = entry.get('page_num', entry.get('page'))
            if fb_page == page_num:
                coords = entry.get('coords', [])
                if len(coords) == 4:
                    rects.append(fitz.Rect(*coords))
                    used_fallback = True

    page = doc[render_page_idx]

    if rects:
        for rect in rects:
            shape = page.new_shape()
            shape.draw_rect(rect)
            if used_fallback:
                # Light blue: structural match (chunk-level bbox, text not found)
                shape.finish(color=(0.3, 0.5, 0.8), fill=(0.7, 0.85, 1.0),
                             fill_opacity=0.2, width=1.0)
            else:
                # Pink: exact text match (quote found via 6-strategy cascade)
                shape.finish(color=(0.9, 0.4, 0.5), fill=(1.0, 0.7, 0.8),
                             fill_opacity=0.35, width=0.5)
            shape.commit(overlay=True)

    # Render at specified DPI
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    pix.save(output_path)

    # Output metadata as JSON lines on stdout
    actual_page = render_page_idx + 1
    if actual_page != page_num:
        print(f"FOUND_ON_PAGE:{actual_page}", flush=True)

    # Output match type for downstream consumers (dashboard, endnote generator)
    if rects and not used_fallback:
        print("MATCH_TYPE:text", flush=True)
    elif rects and used_fallback:
        print("MATCH_TYPE:bbox-fallback", flush=True)
    else:
        print("MATCH_TYPE:none", flush=True)

    # Extract additional metadata if requested
    if extract_meta and search_text:
        meta = {}

        # Extract rich text (formatting info)
        rich = extract_rich_text(page, search_text)
        if rich:
            meta["rich_text"] = rich

        # Extract footnotes
        footnotes = extract_footnotes(page, doc, render_page_idx)
        if footnotes:
            meta["footnotes"] = footnotes

        if meta:
            print(f"META:{json.dumps(meta)}", flush=True)

    doc.close()


if __name__ == "__main__":
    main()
