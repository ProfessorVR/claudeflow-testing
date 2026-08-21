#!/usr/bin/env python
"""ch-fig O-9 processing: extract embedded series from MATLAB .fig (v5) files.
Run with /home/dalton/.pyenv/versions/3.11.9/bin/python3 (needs scipy).
Value-add = the fig-ONLY processed signals (gaze axis/median, pupil L/R denoising cascade).
HR/HRV/CogLoad are byte-exact dups of the HMD CSV -> extracted ONLY for tail-aligned validation.
Outputs (S01..S08 only): out/ch-fig-long.csv, out/ch-fig-coverage.csv, out/ch-fig-validation.txt
"""
import os, glob, hashlib
import numpy as np
import scipy.io as sio
from common import subject_map, norm_stim, norm_token, STIMULI

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")

# canonical signal -> list of accepted normalized tokens
SIGTOK = {
    "HR": ["hr", "heartrate"],
    "HRV": ["hrv"],
    "CogLoad": ["cognitiveload", "cogload"],
    "EyeGazeAxis": ["eyegazeaxis", "gazeaxis"],
    "EyeGazeMedian": ["eyegazemedian", "gazemedian", "gazemedia", "eyegazemedia"],
    "PupilLeft": ["lefteyedilation", "pupildilationleft", "leftdilation", "leftpupil"],
    "PupilRight": ["righteyedilation", "pupildilationright", "rightdilation", "rightpupil"],
}
FIGONLY = {"EyeGazeAxis", "EyeGazeMedian", "PupilLeft", "PupilRight"}


def fig_stim(stem, parent):
    """Fig files use abbreviated prefixes (BOR_/CLC_/INT_) in flat layout OR full words in
    nested subfolders. Check filename first, then parent folder."""
    for src in (stem, parent):
        n = norm_token(src)
        if n.startswith("bor") or "boredom" in n or "boring" in n:
            return "BOR"
        if n.startswith("clc") or "clinical" in n:
            return "CLC"
        if n.startswith("int") or "interesting" in n:
            return "INT"
    return None


def resolve_signal(stem):
    t = norm_token(stem)
    # order matters: check HRV before HR, left/right before generic
    for sig in ["HRV", "CogLoad", "EyeGazeMedian", "EyeGazeAxis", "PupilLeft", "PupilRight", "HR"]:
        for tok in SIGTOK[sig]:
            if tok in t:
                return sig
    return None


def as_list(x):
    if x is None:
        return []
    if isinstance(x, np.ndarray):
        return list(x.ravel())
    if isinstance(x, (list, tuple)):
        return list(x)
    return [x]


def extract_series(path):
    """-> list of (XData, YData) in axes/lineseries document order."""
    m = sio.loadmat(path, struct_as_record=False, squeeze_me=True)
    fig = m.get("hgS_070000")
    if fig is None:
        return []
    series = []

    def walk(node):
        typ = str(getattr(node, "type", "")).lower()
        props = getattr(node, "properties", None)
        if ("lineseries" in typ or typ.endswith(".line") or typ == "line") and props is not None:
            x = getattr(props, "XData", None); y = getattr(props, "YData", None)
            if x is not None and y is not None:
                xa = np.asarray(x, float).ravel(); ya = np.asarray(y, float).ravel()
                if xa.size and ya.size:
                    series.append((xa, ya))
        for ch in as_list(getattr(node, "children", None)):
            walk(ch)

    walk(fig)
    return series


def find_figs(subj):
    """-> {(stim, signal): [paths]} handling flat + nested layouts, dedup by md5."""
    out = {}
    for path in glob.glob(os.path.join(subj, "Images", "**", "*.fig"), recursive=True):
        stem = os.path.splitext(os.path.basename(path))[0]
        parent = os.path.basename(os.path.dirname(path))
        stim = fig_stim(stem, parent)   # handles BOR_/CLC_/INT_ abbrevs + full-word folders
        sig = resolve_signal(stem)
        if stim and sig:
            out.setdefault((stim, sig), []).append(path)
    # dedup identical files by md5
    for k, paths in out.items():
        seen, uniq = {}, []
        for p in paths:
            h = hashlib.md5(open(p, "rb").read()).hexdigest()
            if h not in seen:
                seen[h] = 1; uniq.append(p)
        out[k] = uniq
    return out


def stats(y):
    y = np.asarray(y, float); y = y[np.isfinite(y)]
    if y.size < 3:
        return dict(mean=np.nan, sd=np.nan, min=np.nan, max=np.nan, roughness=np.nan, n=int(y.size))
    return dict(mean=float(y.mean()), sd=float(y.std()), min=float(y.min()), max=float(y.max()),
                roughness=float(np.std(np.diff(y))), n=int(y.size))


def main():
    long_rows, cov_rows, val = [], [], []
    for sid, subj in subject_map():
        figs = find_figs(subj)
        for stim in STIMULI:
            for sig in SIGTOK:
                paths = figs.get((stim, sig), [])
                if not paths:
                    cov_rows.append(dict(subject=sid, stimulus=stim, signal=sig, n_traces=0, found=False))
                    continue
                series = extract_series(paths[0])
                cov_rows.append(dict(subject=sid, stimulus=stim, signal=sig,
                                     n_traces=len(series), found=True,
                                     n_dupfiles=len(paths)))
                prov = "fig_derived_only" if sig in FIGONLY else "csv_exact_dup"
                for si, (x, y) in enumerate(series):
                    st = stats(y)
                    long_rows.append(dict(subject=sid, stimulus=stim, signal=sig, subseries=si,
                                          n_samples=st["n"], mean=st["mean"], sd=st["sd"],
                                          roughness=st["roughness"], provenance=prov))
    import csv
    # long
    with open(os.path.join(OUT, "ch-fig-long.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["subject", "stimulus", "signal", "subseries",
                                           "n_samples", "mean", "sd", "roughness", "provenance"])
        w.writeheader(); w.writerows(long_rows)
    with open(os.path.join(OUT, "ch-fig-coverage.csv"), "w", newline="") as fh:
        keys = ["subject", "stimulus", "signal", "n_traces", "found", "n_dupfiles"]
        w = csv.DictWriter(fh, fieldnames=keys, extrasaction="ignore")
        w.writeheader(); w.writerows(cov_rows)
    found = sum(1 for c in cov_rows if c["found"])
    print(f"ch-fig done: {found}/{len(cov_rows)} (subject x stimulus x signal) cells found; long={len(long_rows)} trace-rows")
    # trace-count profile per signal (validates positional structure)
    from collections import Counter
    prof = Counter()
    for c in cov_rows:
        if c["found"]:
            prof[(c["signal"], c["n_traces"])] += 1
    print("trace-count profile (signal, n_traces): count")
    for k in sorted(prof):
        print("  ", k, prof[k])
    # missing cells
    miss = [(c["subject"], c["stimulus"], c["signal"]) for c in cov_rows if not c["found"]]
    print("missing cells:", len(miss), miss[:12])


if __name__ == "__main__":
    main()
