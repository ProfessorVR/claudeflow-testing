#!/usr/bin/env python
"""N=8 within-subjects statistics on the O-9 physiological surfaces.
Friedman omnibus (3 conditions, repeated-measures) + Wilcoxon signed-rank post-hoc per pair.
Non-parametric (small N, matches the papers' Kruskal-Wallis/ANOVA lineage but respects the within-subject design).
Run: /home/dalton/.pyenv/versions/3.11.9/bin/python3 . Writes out/ch-stats.csv + prints a summary.
"""
import os
import numpy as np
import pandas as pd
from scipy.stats import friedmanchisquare, wilcoxon

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")
STIM = ["BOR", "CLC", "INT"]
# surface -> (file, column, direction expected: 'boring-high' or 'engaged-high')
SURFACES = [
    ("EEG DMN power", "ch-eeg-bandpower.csv", "dmn_power", "boring-high"),
    ("EEG parietal alpha", "ch-eeg-bandpower.csv", "parietal_alpha", "boring-high"),
    ("gaze deviation variance", "ch-hmd-wide.csv", "gaze_dev_variance", "boring-high"),
    ("cognitive load", "ch-hmd-wide.csv", "cognitive_load_mean", "engaged-high"),
    ("pupil dilation", "ch-hmd-wide.csv", "dil_mean_bilateral", "engaged-high"),
    ("HR", "ch-hmd-wide.csv", "hr_mean", "-"),
    ("HRV", "ch-hmd-wide.csv", "hrv_mean", "-"),
]


def wide(fname, col):
    df = pd.read_csv(os.path.join(OUT, fname))
    p = df.pivot_table(index="subject", columns="stimulus", values=col, aggfunc="first")
    return p.reindex(columns=STIM)


def rank_biserial(a, b):
    """matched-pairs rank-biserial effect size for Wilcoxon (a-b)."""
    d = np.asarray(a) - np.asarray(b); d = d[d != 0]
    if len(d) == 0:
        return 0.0
    r = pd.Series(np.abs(d)).rank().values
    rp = r[d > 0].sum(); rn = r[d < 0].sum()
    return float((rp - rn) / (rp + rn))


def main():
    rows, summary = [], []
    for label, fname, col, direction in SURFACES:
        p = wide(fname, col)
        comp = p.dropna(axis=0, how="any")   # complete cases across all 3 conditions
        n = len(comp)
        if n < 3:
            summary.append(f"{label}: n={n} too few complete cases"); continue
        chi2, pf = friedmanchisquare(comp["BOR"], comp["CLC"], comp["INT"])
        row = dict(surface=label, direction=direction, n=n, friedman_chi2=round(chi2, 3), friedman_p=round(pf, 4))
        pairs = [("BOR", "CLC"), ("BOR", "INT"), ("CLC", "INT")]
        for x, y in pairs:
            sub = p[[x, y]].dropna()
            npair = len(sub)
            try:
                w, pw = wilcoxon(sub[x], sub[y])
            except ValueError:
                w, pw = np.nan, np.nan
            md = float((sub[x] - sub[y]).median())
            rb = rank_biserial(sub[x].values, sub[y].values)
            row[f"{x}v{y}_n"] = npair
            row[f"{x}v{y}_p"] = round(pw, 4) if pw == pw else np.nan
            row[f"{x}v{y}_median_diff"] = round(md, 4)
            row[f"{x}v{y}_effect_rb"] = round(rb, 3)
        rows.append(row)
        # Holm across the 3 within-surface pairwise p's
        ps = [(f"{x}v{y}", row[f"{x}v{y}_p"]) for x, y in pairs]
        ps_valid = [(k, v) for k, v in ps if v == v]
        ps_sorted = sorted(ps_valid, key=lambda t: t[1])
        holm = {}
        m = len(ps_sorted)
        for i, (k, v) in enumerate(ps_sorted):
            holm[k] = min(1.0, v * (m - i))
        sig = [f"{k}(p={row[k+'_p']}, holm={round(holm[k],3)}, rb={row[k+'_effect_rb']})"
               for k, _ in ps_sorted if holm.get(k, 1) < 0.05]
        omni = "SIG" if pf < 0.05 else "ns"
        summary.append(f"{label} [{direction}]: Friedman χ²={chi2:.2f} p={pf:.4f} ({omni}), n={n}"
                       + ("  |  post-hoc (Holm<.05): " + "; ".join(sig) if sig else "  |  no pair survives Holm"))

    pd.DataFrame(rows).to_csv(os.path.join(OUT, "ch-stats.csv"), index=False)
    print("=== N=8 within-subjects stats (Friedman + Wilcoxon signed-rank, Holm-corrected post-hoc) ===")
    for s in summary:
        print(s)
    print("\nNote: n<8 where a subject lacks a cell (S07 missing INT drops it from any INT contrast).")


if __name__ == "__main__":
    main()
