"""Within-subject statistics: Friedman omnibus, Wilcoxon signed-rank pairwise,
Holm correction across the pairwise family, matched-pairs rank-biserial effect size.

The effect size comes from ch_stats.rank_biserial() unchanged, so the number is the
one the methodology of record produces. Friedman and Wilcoxon are the same scipy
calls ch_stats.main() makes.

Every result carries a `poolable` flag and a one-line reason, per the standing rule
that a rate-dependent feature is never silently pooled across rounds.
"""
import numpy as np
import pandas as pd
from scipy.stats import friedmanchisquare, wilcoxon

import adapters
import config as C

PAIRS = (("BOR", "CLC"), ("BOR", "INT"), ("CLC", "INT"))


def holm(pvals):
    """Holm step-down across a family. Returns {key: adjusted p}."""
    valid = [(k, v) for k, v in pvals.items() if v == v]
    out = {k: np.nan for k in pvals}
    m = len(valid)
    running = 0.0
    for i, (k, v) in enumerate(sorted(valid, key=lambda t: t[1])):
        adj = min(1.0, v * (m - i))
        running = max(running, adj)      # enforce monotonicity
        out[k] = running
    return out


def test_surface(table, surface, poolable_key=None, scope="", n_note=""):
    """Friedman + pairwise Wilcoxon + Holm on a subject x stimulus table.

    `table` is indexed by subject with columns BOR/CLC/INT.
    """
    comp = table.dropna(axis=0, how="any")
    n = len(comp)
    pool, reason = C.POOLABLE.get(poolable_key or surface, (None, "not classified"))
    row = dict(surface=surface, scope=scope, n=n, poolable=pool, poolable_reason=reason)

    if n < 3:
        row.update(friedman_chi2=np.nan, friedman_p=np.nan,
                   note=f"n={n} too few complete cases")
        return row, []

    chi2, pf = friedmanchisquare(comp["BOR"], comp["CLC"], comp["INT"])
    row.update(friedman_chi2=float(chi2), friedman_p=float(pf))

    raw_p, details = {}, []
    for x, y in PAIRS:
        sub = table[[x, y]].dropna()
        npair = len(sub)
        if npair < 3:
            raw_p[f"{x}v{y}"] = np.nan
            continue
        try:
            _, pw = wilcoxon(sub[x], sub[y])
        except ValueError:
            pw = np.nan
        rb = adapters.rank_biserial(sub[x].values, sub[y].values)
        n_lower = int((sub[x] < sub[y]).sum())
        n_higher = int((sub[x] > sub[y]).sum())
        # `direction` reports the count of subjects who AGREE WITH THE EFFECT, i.e.
        # the count matching the sign of the rank-biserial. Both raw counts are kept
        # in their own columns.
        #
        # Before D-11 this field reported n_first_lower unconditionally, which
        # corroborated the effect only where the effect ran downward. That was
        # already the wrong way round for sleep-fight (rb +1.000 printed as "0/12"
        # while the finding is twelve of twelve), and renaming the openness surface
        # to eye closure would have turned the headline "11 of 12" into "1/12".
        # Changing it here makes the artifact state the finding rather than its
        # complement. Surfaces where rb > 0 now print the complement of what v4
        # printed - chiefly the EEG negatives and the self-report items; no
        # load-bearing downward effect (closure, pupil, gaze frequency) moves.
        n_agree = n_higher if rb > 0 else n_lower
        raw_p[f"{x}v{y}"] = pw
        details.append(dict(surface=surface, scope=scope, pair=f"{x}v{y}", n=npair,
                            wilcoxon_p=pw, effect_rb=rb,
                            n_first_lower=n_lower, n_first_higher=n_higher,
                            direction=f"{n_agree}/{npair}",
                            median_diff=float((sub[x] - sub[y]).median()),
                            poolable=pool))
    adj = holm(raw_p)
    for d in details:
        d["holm_p"] = adj.get(d["pair"], np.nan)
        d["significant"] = bool(d["holm_p"] == d["holm_p"] and d["holm_p"] < C.ALPHA)

    row["descriptive_only"] = n < C.DESCRIPTIVE_N_BELOW
    if n <= 4:
        row["small_n_note"] = (f"n={n}: the Wilcoxon floor is p={C.WILCOXON_FLOOR_N4}, "
                               "so perfect separation is the strongest obtainable result")
    row["note"] = n_note
    return row, details


def within_subject_z(table):
    """Each subject's stimulus scored against their own three-video mean."""
    m = table.mean(axis=1)
    s = table.std(axis=1, ddof=1)
    return table.sub(m, axis=0).div(s.replace(0, np.nan), axis=0)


def pooled_table(r1_table, r2_table, r1_scale=1.0):
    """Stack two rounds onto one subject x stimulus table.

    `r1_scale` exists because Round 1's openness proxy is a percentage while
    Round 2's is a fraction. Wilcoxon ranks the MAGNITUDE of paired differences,
    so mixed units silently re-weight subjects; the scale must be harmonized
    before any pooled signed-rank test.
    """
    return pd.concat([r1_table * r1_scale, r2_table])


def summarise(rows, details):
    return pd.DataFrame(rows), pd.DataFrame(details)
