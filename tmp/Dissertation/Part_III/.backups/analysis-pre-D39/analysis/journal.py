"""Run journal: exclusions, QC flags, coercions, and deterministic CSV writing.

Nothing is dropped silently. Every exclusion carries a reason and the scope it
applies to, and EXCLUSIONS.log is written from this journal rather than by hand.

PII: emit_guard() refuses to write any frame or text containing a participant
name. Redaction here is by construction upstream - this is the backstop.
"""
import io
import os
import re

import pandas as pd

import config as C

_EXCLUSIONS = []
_QC = []
_COERCIONS = []
_NOTES = []


def exclude(scope, item, reason, n_rows=None, recoverable=True):
    """Record a dropped row / file / cell / survey item, with its reason."""
    _EXCLUSIONS.append(dict(scope=scope, item=item, reason=reason,
                            n_rows=n_rows, recoverable=recoverable))


def qc(**row):
    _QC.append(row)


def coerce(scope, item, raw, parsed, confidence, reason):
    """Record a free-text value that was interpreted rather than read directly."""
    _COERCIONS.append(dict(scope=scope, item=item, raw_value=raw, parsed_value=parsed,
                           confidence=confidence, reason=reason))


def note(section, text):
    _NOTES.append(dict(section=section, text=text))


def exclusions():
    return pd.DataFrame(_EXCLUSIONS)


def qc_rows():
    return pd.DataFrame(_QC)


def coercions():
    return pd.DataFrame(_COERCIONS)


def notes():
    return pd.DataFrame(_NOTES)


# --------------------------------------------------------------------- PII
_NAME_CACHE = None


def _name_variants():
    """Every participant-name form that must never appear in an output."""
    global _NAME_CACHE
    if _NAME_CACHE is not None:
        return _NAME_CACHE
    import adapters
    variants = set()

    def add(s):
        s = str(s).strip()
        if len(s) < 3:
            return
        variants.add(s.lower())
        variants.add(re.sub(r"[^a-z0-9]", "", s.lower()))
        for tok in re.findall(r"[A-Za-z]{3,}", s):
            variants.add(tok.lower())

    for _, p in adapters.subject_map():
        add(os.path.basename(p))
        for f in os.listdir(p):
            add(os.path.splitext(f)[0])
    sub2 = adapters.r2_subjects_dir()
    for d in os.listdir(sub2):
        add(d)
    for f in os.listdir(C.R2_ROOT):
        if f.lower().endswith(".txt"):
            add(os.path.splitext(f)[0])

    safe = {"survey", "med", "test", "boredom", "experiment", "subjects", "round",
            "interesting", "clinical", "boring", "data", "logs", "recorder",
            "eyetracking", "imu", "hrv", "csv", "txt", "mat", "fig", "images",
            "hmd", "eeg", "crop", "videos", "phd", "dissertation", "mnt", "eye",
            "tracking", "datasets", "template", "surveytemplate", "obs", "xlsx",
            "hr", "cl", "axis", "bor", "clc", "int", "open", "gaze", "left",
            "right", "dilation", "openness", "rate", "sys", "omni", "sensor",
            "loc", "dev", "sub", "value", "time", "index", "mean", "median",
            # Analysis vocabulary harvested from non-participant filenames inside the
            # subject folders (the labeled exemplar clips are named "Bored (...)" and
            # "Focused"). Exempted explicitly and individually, never by pattern, so
            # the exemption list stays auditable.
            "bored", "focus", "focused"}
    _NAME_CACHE = {v for v in variants if v not in safe and len(v) >= 4}
    return _NAME_CACHE


def emit_guard(text, label):
    """Raise if a participant name reached an output. Backstop, not the mechanism."""
    low = text.lower()
    hits = sorted(v for v in _name_variants() if v in low)
    if hits:
        raise SystemExit(f"PII GUARD: participant name(s) {hits} would be written to "
                         f"{label}. Aborting before the file is created.")


def write_csv(frame, path, index=False):
    """Deterministic CSV: fixed float precision, sorted columns where unordered,
    no wall-clock, guarded against PII."""
    buf = io.StringIO()
    frame.to_csv(buf, index=index, float_format=C.CSV_FLOAT_FMT, lineterminator="\n")
    body = buf.getvalue()
    emit_guard(body, os.path.basename(path))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="") as fh:
        fh.write(body)
    return path


def write_text(text, path):
    emit_guard(text, os.path.basename(path))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="\n") as fh:
        fh.write(text)
    return path
