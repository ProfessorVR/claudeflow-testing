"""The reproduction gate.

Four results are locked (spec section 4, re-verified 2026-07-30). A run that does
not reproduce them has a bug and must not proceed. The gate is run twice: once
against the canonical code path, and again after this tree's Round 2 extractor
replaces the original, to prove the extensions changed nothing that matters.
"""
import numpy as np
import pandas as pd
from scipy.stats import friedmanchisquare, wilcoxon

import adapters
import config as C


def _one(table):
    comp = table.dropna(axis=0, how="any")
    chi2, pf = friedmanchisquare(comp["BOR"], comp["CLC"], comp["INT"])
    sub = table[["BOR", "CLC"]].dropna()
    _, pw = wilcoxon(sub["BOR"], sub["CLC"])
    rb = adapters.rank_biserial(sub["BOR"].values, sub["CLC"].values)
    n_lower = int((sub["BOR"] < sub["CLC"]).sum())
    return dict(n=len(comp), friedman_p=float(pf), wilcoxon_p=float(pw),
                rb=float(rb), n_lower=n_lower, n_pairs=len(sub))


def build_tables(r1_wide, r1_qc, r2_wide):
    """The four surfaces the checks are defined on."""
    t = {}
    t["r1_pupil"] = adapters.surface_table(r1_wide, "dil_mean_bilateral")
    t["r1_openness"] = adapters.surface_table(r1_qc, "pct_valid_eye")
    t["pooled_pupil"] = pd.concat([
        adapters.surface_table(r1_wide, "dil_mean_bilateral"),
        adapters.surface_table(r2_wide, "dil_mean_bilateral")])
    # Round 1's proxy is 0-100, Round 2's is 0-1: harmonise before the signed-rank
    # test, which ranks the magnitude of paired differences.
    t["pooled_openness"] = pd.concat([
        adapters.surface_table(r1_qc, "pct_valid_eye") * C.R1_OPENNESS_SCALE,
        adapters.surface_table(r2_wide, "openness_mean_bilateral")])
    return t


def run(r1_wide, r1_qc, r2_wide, label="canonical"):
    """-> (all_passed, report DataFrame)."""
    tables = build_tables(r1_wide, r1_qc, r2_wide)
    rows, ok_all = [], True
    for chk in C.VERIFICATION_CHECKS:
        got = _one(tables[chk["key"]])
        ok = (got["n"] == chk["n"]
              and abs(round(got["friedman_p"], 4) - chk["friedman_p"]) <= C.CHECK_TOL
              and abs(round(got["wilcoxon_p"], 4) - chk["wilcoxon_p"]) <= C.CHECK_TOL
              and abs(got["rb"] - chk["rb"]) <= 1e-2)
        ok_all &= ok
        rows.append(dict(
            gate=label, check=chk["label"], expected_n=chk["n"], got_n=got["n"],
            expected_friedman_p=chk["friedman_p"], got_friedman_p=round(got["friedman_p"], 4),
            expected_wilcoxon_p=chk["wilcoxon_p"], got_wilcoxon_p=round(got["wilcoxon_p"], 4),
            expected_rb=chk["rb"], got_rb=round(got["rb"], 3),
            expected_direction=chk["direction"],
            got_direction=f"{got['n_lower']}/{got['n_pairs']}",
            passed=ok))
    return ok_all, pd.DataFrame(rows)


def report(df):
    lines = []
    for _, r in df.iterrows():
        mark = "PASS" if r.passed else "*** FAIL ***"
        lines.append(
            f"  [{mark}] {r['check']:24s} n={r.got_n:<3d} "
            f"dir={r.got_direction:<6s} Friedman p={r.got_friedman_p:.4f} "
            f"Wilcoxon p={r.got_wilcoxon_p:.4f} rb={r.got_rb:+.3f}")
        if not r.passed:
            lines.append(f"        expected: n={r.expected_n} dir={r.expected_direction} "
                         f"Friedman p={r.expected_friedman_p} "
                         f"Wilcoxon p={r.expected_wilcoxon_p} rb={r.expected_rb}")
    return "\n".join(lines)
