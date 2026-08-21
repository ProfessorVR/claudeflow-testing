#!/usr/bin/env python3
"""
Scholarly Fidelity Gate — Per-document quality comparison between Marker and pdftotext.

Determines whether Marker's structured Markdown output preserves scholarly
formatting (Bekker numbers, Greek text, footnotes) as well as pdftotext's
raw extraction. Used by run_ingest_phase2.py to auto-route each PDF.

Decision:
  MARKER_PASS  → Use Marker output (better structure, tables, images)
  MARKER_FAIL  → Use pdftotext for text + Marker for tables/images only
"""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Regex patterns for scholarly formatting
# ---------------------------------------------------------------------------

# Aristotle Bekker numbers: 1447a8, 102b12, 1050b1, and bare forms like 1147a / 403b / 12a.
# Letter column is required; 0-2 leading-digit width 2-4; 0-2 trailing line digits.
BEKKER_RE = re.compile(r'\b\d{2,4}[ab]\d{0,2}\b')

# Greek Unicode block (Greek and Coptic: U+0370–U+03FF)
GREEK_RE = re.compile(r'[\u0370-\u03FF]')

# Extended Greek (polytonic, combining marks)
GREEK_EXTENDED_RE = re.compile(r'[\u0370-\u03FF\u1F00-\u1FFF]')

# Footnote superscripts: word followed immediately by a number (e.g., "argues.12" or "world,3")
# Also catches explicit superscript markers
FOOTNOTE_INLINE_RE = re.compile(r'[a-zA-Z][.,:;)]\s?\d{1,3}\b')

# Standalone footnote references at line start (e.g., "12. See Aristotle...")
FOOTNOTE_START_RE = re.compile(r'^\s*\d{1,3}[.\s]', re.MULTILINE)

# German special characters (common in Heidegger quotations)
GERMAN_RE = re.compile(r'[äöüÄÖÜß]')

# Stephanus numbers (Plato): 245a, 532e, etc. (similar to Bekker but single letter a-e)
STEPHANUS_RE = re.compile(r'\b\d{2,3}[a-e]\b')


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class FidelityResult:
    """Result of a scholarly fidelity comparison."""
    decision: str  # "MARKER_PASS" or "MARKER_FAIL"
    confidence: float  # 0.0 - 1.0
    checks: Dict[str, Dict] = field(default_factory=dict)
    reason: str = ""

    @property
    def use_marker_for_text(self) -> bool:
        return self.decision == "MARKER_PASS"


# ---------------------------------------------------------------------------
# Comparison functions
# ---------------------------------------------------------------------------

def _count_matches(pattern: re.Pattern, text: str) -> int:
    return len(pattern.findall(text))


def _compare_feature(
    name: str,
    pdftotext_count: int,
    marker_count: int,
    threshold: float = 0.5,
) -> Dict:
    """Compare a single feature between pdftotext and Marker.

    Returns dict with counts and pass/fail status.
    Marker passes if it preserves at least `threshold` fraction of pdftotext's matches.
    """
    if pdftotext_count == 0:
        # Nothing to compare — Marker can't lose what doesn't exist
        return {
            "pdftotext": pdftotext_count,
            "marker": marker_count,
            "ratio": 1.0,
            "pass": True,
            "note": "no instances in pdftotext (not applicable)",
        }

    ratio = marker_count / pdftotext_count
    passed = ratio >= threshold

    return {
        "pdftotext": pdftotext_count,
        "marker": marker_count,
        "ratio": round(ratio, 3),
        "threshold": threshold,
        "pass": passed,
    }


def compare_scholarly_fidelity(
    pdftotext_output: str,
    marker_output: str,
    filename: str = "",
) -> FidelityResult:
    """Compare Marker vs pdftotext output for scholarly formatting preservation.

    Args:
        pdftotext_output: Raw text from pdftotext -layout
        marker_output: Markdown from Marker-pdf
        filename: PDF filename (for logging)

    Returns:
        FidelityResult with decision and per-check details
    """
    checks: Dict[str, Dict] = {}

    # 1. Bekker numbers (Aristotle)
    checks["bekker"] = _compare_feature(
        "Bekker numbers",
        _count_matches(BEKKER_RE, pdftotext_output),
        _count_matches(BEKKER_RE, marker_output),
        threshold=0.5,
    )

    # 2. Greek characters
    pt_greek = _count_matches(GREEK_EXTENDED_RE, pdftotext_output)
    mk_greek = _count_matches(GREEK_EXTENDED_RE, marker_output)

    # Use percentage-based comparison for Greek (corpus texts may have sparse Greek)
    pt_greek_pct = pt_greek / max(len(pdftotext_output), 1) * 100
    mk_greek_pct = mk_greek / max(len(marker_output), 1) * 100

    if pt_greek_pct > 0.1:  # Only check if >0.1% of text is Greek
        greek_ratio = mk_greek_pct / pt_greek_pct if pt_greek_pct > 0 else 1.0
        checks["greek"] = {
            "pdftotext": pt_greek,
            "marker": mk_greek,
            "pdftotext_pct": round(pt_greek_pct, 3),
            "marker_pct": round(mk_greek_pct, 3),
            "ratio": round(greek_ratio, 3),
            "threshold": 0.25,
            "pass": greek_ratio >= 0.25,
        }
    else:
        checks["greek"] = {
            "pdftotext": pt_greek,
            "marker": mk_greek,
            "ratio": 1.0,
            "pass": True,
            "note": "insufficient Greek text for comparison (<0.1%)",
        }

    # 3. Footnote markers
    pt_fn = _count_matches(FOOTNOTE_INLINE_RE, pdftotext_output) + _count_matches(FOOTNOTE_START_RE, pdftotext_output)
    mk_fn = _count_matches(FOOTNOTE_INLINE_RE, marker_output) + _count_matches(FOOTNOTE_START_RE, marker_output)
    checks["footnotes"] = _compare_feature(
        "Footnote markers",
        pt_fn, mk_fn,
        threshold=0.5,
    )

    # 4. German characters (Heidegger)
    checks["german"] = _compare_feature(
        "German characters",
        _count_matches(GERMAN_RE, pdftotext_output),
        _count_matches(GERMAN_RE, marker_output),
        threshold=0.5,
    )

    # 5. Text length preservation (Marker shouldn't lose >30% of content)
    pt_len = len(pdftotext_output.strip())
    mk_len = len(marker_output.strip())
    len_ratio = mk_len / max(pt_len, 1)
    checks["text_length"] = {
        "pdftotext": pt_len,
        "marker": mk_len,
        "ratio": round(len_ratio, 3),
        "threshold": 0.7,
        "pass": len_ratio >= 0.7,
    }

    # Decision: fail if any critical check fails
    critical_checks = ["bekker", "greek", "footnotes", "text_length"]
    failed_checks = [name for name in critical_checks if not checks[name]["pass"]]

    if failed_checks:
        decision = "MARKER_FAIL"
        reason = f"Failed checks: {', '.join(failed_checks)}"
        confidence = 1.0 - (len(failed_checks) / len(critical_checks))
    else:
        decision = "MARKER_PASS"
        reason = "All scholarly fidelity checks passed"
        # Confidence based on how close ratios are to 1.0
        ratios = [checks[c].get("ratio", 1.0) for c in critical_checks]
        confidence = sum(min(r, 1.0) for r in ratios) / len(ratios)

    result = FidelityResult(
        decision=decision,
        confidence=round(confidence, 3),
        checks=checks,
        reason=reason,
    )

    logger.info(
        "Fidelity gate [%s]: %s (confidence=%.2f) %s",
        filename, decision, confidence, reason,
    )

    return result
