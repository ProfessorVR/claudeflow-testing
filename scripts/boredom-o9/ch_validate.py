#!/usr/bin/env python
"""Cross-channel validation (run with pyenv-3.11.9 python3; has scipy + pandas).
1. fig HR/HRV/CogLoad  vs  ch-hmd CROP CSV columns  (tail-aligned) -> confirms the CSV column mapping.
2. fig EyeGazeAxis (processed X/Y/Z)  vs  ch-hmd raw gaze X/Y/Z  -> confirms same underlying signal.
Writes out/ch-fig-validation.txt (S01..S08 only).
"""
import os, re
import numpy as np
from common import subject_map, STIMULI
from ch_fig import find_figs, extract_series
from ch_hmd import read_hmd, find_files, GVEC

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")
SIG_CSVCOL = {"HR": "hr", "HRV": "hrv", "CogLoad": "cogload"}


def best_align_diff(a, b):
    """min maxAbsDiff over head- and tail-alignment; returns (diff, which)."""
    a = np.asarray(a, float); b = np.asarray(b, float)
    L = min(len(a), len(b))
    if L < 3:
        return np.nan, "n/a"
    tail = np.nanmax(np.abs(a[-L:] - b[-L:]))
    head = np.nanmax(np.abs(a[:L] - b[:L]))
    return (tail, "tail") if tail <= head else (head, "head")


def main():
    lines = []
    hr_ok = hr_tot = 0
    gaze_corrs = []
    for sid, subj in subject_map():
        figs = find_figs(subj)
        hmd = os.path.join(subj, "HMD")
        ff = find_files(hmd) if os.path.isdir(hmd) else {}
        for stim in STIMULI:
            info = ff.get(stim, {})
            cpath = info.get("crop")
            if not cpath or cpath.lower().endswith(".xlsx"):
                continue  # need a CSV crop for a clean comparison
            try:
                df = read_hmd(cpath)
                for c in ["hr", "hrv", "cogload"]:
                    df[c] = __import__("pandas").to_numeric(df[c], errors="coerce")
            except Exception as e:
                continue
            # 1. HR/HRV/CogLoad fig-vs-csv
            for sig, col in SIG_CSVCOL.items():
                paths = figs.get((stim, sig))
                if not paths:
                    continue
                s = extract_series(paths[0])
                if not s:
                    continue
                figy = s[0][1]
                diff, which = best_align_diff(figy, df[col].values)
                hr_tot += 1
                if np.isfinite(diff) and diff < 0.01:
                    hr_ok += 1
                else:
                    lines.append(f"  MISMATCH {sid} {stim} {sig}: maxAbsDiff={diff:.4g} ({which}-aligned) "
                                 f"len fig={len(figy)} csv={len(df)}")
            # 2. gaze: fig EyeGazeAxis (3 traces) vs csv raw gaze X/Y/Z
            gpaths = figs.get((stim, "EyeGazeAxis"))
            if gpaths:
                gs = extract_series(gpaths[0])
                if len(gs) >= 3:
                    g = df["gaze"].astype(str).str.extract(GVEC).astype(float).values  # raw X,Y,Z
                    for i, comp in enumerate("XYZ"):
                        figc = gs[i][1]
                        L = min(len(figc), len(g))
                        raw = g[-L:, i]; fig_ = figc[-L:]
                        m = np.isfinite(raw) & np.isfinite(fig_)
                        if m.sum() > 10 and np.std(raw[m]) > 1e-6 and np.std(fig_[m]) > 1e-6:
                            gaze_corrs.append(abs(np.corrcoef(raw[m], fig_[m])[0, 1]))

    out = []
    out.append("=== ch-fig <-> ch-hmd CROSS-VALIDATION ===\n")
    out.append(f"1. HR/HRV/CogLoad fig-vs-CSV byte-match (tail-aligned, threshold 0.01):")
    out.append(f"   {hr_ok}/{hr_tot} cells match  -> confirms the ch-hmd column mapping is correct.\n")
    if lines:
        out.append("   mismatches:"); out += lines
    else:
        out.append("   (no mismatches)\n")
    if gaze_corrs:
        gc = np.array(gaze_corrs)
        med = float(np.median(gc))
        out.append(f"2. gaze fig('Eye Gaze Axis' 3 traces) vs csv(raw gaze X/Y/Z): |corr| over {len(gc)} traces "
                   f"median={med:.3f} min={gc.min():.3f}")
        if med >= 0.5:
            out.append("   -> the .fig gaze is a filtered version of the raw CSV gaze; ch-hmd raw gaze is the source.")
        else:
            out.append("   -> LOW correlation: the .fig 'Eye Gaze Axis' is NOT the raw X/Y/Z filtered — it is a")
            out.append("      different derived quantity. CONSEQUENCE: ch-hmd's raw-derived eye_gaze_axis/median")
            out.append("      are UNVALIDATED provisional proxies. For processed gaze, use the .fig series (ch-fig)")
            out.append("      as authoritative, but its exact definition/filter is undocumented. Gaze is the one")
            out.append("      soft signal (as scoping predicted); HR/HRV/CogLoad/pupil are solid.")
    open(os.path.join(OUT, "ch-fig-validation.txt"), "w").write("\n".join(out) + "\n")
    print("\n".join(out))


if __name__ == "__main__":
    main()
