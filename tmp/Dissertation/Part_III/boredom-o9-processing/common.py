"""Shared helpers for Boredom Experiment O-9 processing.
stdlib-only so it imports under BOTH interpreters (.venv for ch-hmd, pyenv-3.11.9 for ch-fig/ch-eeg).

PII: the ONE canonical S01..S08 ordering = raw subject-folder names sorted lexicographically
(NOT stripping any '(Med)' tag — stripping could silently reorder). Every channel imports this.
The name->Sxx crosswalk is NEVER written to any output file; only Sxx labels are emitted.
"""
import os
import re

ROOT = "/mnt/d/PhD/Dissertation/Boredom Experiment"
SUBJECTS_DIR = os.path.join(ROOT, "Subjects")
VIDEOS_DIR = os.path.join(ROOT, "Videos")


def subject_dirs():
    """Canonical order: raw folder names, sorted lexicographically (locale-independent)."""
    ds = [d for d in os.listdir(SUBJECTS_DIR) if os.path.isdir(os.path.join(SUBJECTS_DIR, d))]
    return sorted(ds)


def subject_map():
    """[(sid, abspath), ...] with sid = S01..S08 by canonical order."""
    return [(f"S{i + 1:02d}", os.path.join(SUBJECTS_DIR, d)) for i, d in enumerate(subject_dirs())]


def norm_stim(name):
    """Map any filename/folder token to the canonical stimulus label. None if not a stimulus."""
    n = name.lower()
    if "boredom" in n or "boring" in n:
        return "BOR"
    if "clinical" in n:
        return "CLC"
    if "interesting" in n:
        return "INT"
    return None


STIMULI = ("BOR", "CLC", "INT")


def norm_token(s):
    """Lowercase alnum-only token for fuzzy signal/name matching (handles typos/spaces)."""
    return re.sub(r"[^a-z0-9]", "", s.lower())
