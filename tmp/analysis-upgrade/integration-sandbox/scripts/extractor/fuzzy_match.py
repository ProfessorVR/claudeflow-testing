"""Fuzzy-match a quote against source text."""
from __future__ import annotations
import difflib
import re


def _normalize(s: str) -> str:
    """Lowercase + collapse whitespace + strip common OCR artefacts."""
    s = s.lower()
    s = re.sub(r"\s+", " ", s)
    # remove punctuation for matching purposes
    s = re.sub(r"[^\w\s]", "", s)
    return s.strip()


def fuzzy_locate(quote: str, source: str, min_ratio: float = 0.82) -> dict:
    """Locate a quote in source text using sliding-window difflib.

    Returns {found: bool, ratio: float, char_start: int|None, char_end: int|None,
             matched_span: str|None}.
    """
    if not quote.strip():
        return {"found": False, "ratio": 0.0, "char_start": None, "char_end": None, "matched_span": None}

    nq = _normalize(quote)
    ns = _normalize(source)
    L = len(nq)
    if L == 0 or len(ns) < L * 0.5:
        return {"found": False, "ratio": 0.0, "char_start": None, "char_end": None, "matched_span": None}

    # Fast exact match on normalized source first
    idx = ns.find(nq)
    if idx >= 0:
        # Map normalized index back to source char offset (approximate)
        return _map_to_source_offsets(source, nq, idx, 1.0)

    # Windowed approximate match
    best_ratio = 0.0
    best_start = None
    step = max(1, L // 8)
    window = int(L * 1.25)
    for start in range(0, max(1, len(ns) - L), step):
        seg = ns[start : start + window]
        r = difflib.SequenceMatcher(None, nq, seg).quick_ratio()
        if r > best_ratio:
            # refine
            real = difflib.SequenceMatcher(None, nq, seg).ratio()
            if real > best_ratio:
                best_ratio = real
                best_start = start
                if real > 0.98:
                    break

    if best_ratio >= min_ratio and best_start is not None:
        return _map_to_source_offsets(source, nq, best_start, best_ratio)

    return {"found": False, "ratio": round(best_ratio, 3), "char_start": None, "char_end": None, "matched_span": None}


def _map_to_source_offsets(source: str, nq: str, norm_start: int, ratio: float) -> dict:
    """Map a normalized-source start-offset back to raw source char offsets.

    Implementation: walk through source, skipping chars the normalizer removes,
    until we've seen `norm_start` normalized chars; that gives raw start.
    Then continue until we've consumed the quote's normalized length to get end.
    """
    def iter_normalized(s: str):
        prev_space = False
        for i, ch in enumerate(s):
            c = ch.lower()
            if re.match(r"[^\w\s]", c):
                yield i, None  # stripped
            elif re.match(r"\s", c):
                if prev_space:
                    yield i, None
                else:
                    prev_space = True
                    yield i, " "
            else:
                prev_space = False
                yield i, c

    raw_start = None
    raw_end = None
    norm_count = 0
    for raw_i, norm_ch in iter_normalized(source):
        if norm_ch is None:
            continue
        if raw_start is None and norm_count == norm_start:
            raw_start = raw_i
        if raw_start is not None and norm_count == norm_start + len(nq):
            raw_end = raw_i
            break
        norm_count += 1
    if raw_end is None and raw_start is not None:
        raw_end = len(source)

    matched = source[raw_start:raw_end] if raw_start is not None else None
    return {
        "found": True,
        "ratio": round(ratio, 3),
        "char_start": raw_start,
        "char_end": raw_end,
        "matched_span": matched,
    }
