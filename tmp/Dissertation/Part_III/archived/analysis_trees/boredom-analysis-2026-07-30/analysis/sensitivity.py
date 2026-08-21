"""How much of the keystone decomposition depends on how the composite is built.

The claim the specification expected to strengthen is an ASYMMETRY: physiology and
self-report diverge in one direction and never the other, which is a stronger
structural statement than any mean. At N=12 that asymmetry does not hold - there is
one reverse case, R2-03 - and the honest way to report a single case is to show how
stable it is rather than to assert or bury it.

This module varies the engaged composite over all seven non-empty subsets of the
three poolable engagement channels, crossed with the untrimmed and non-wear-trimmed
openness columns, and recomputes the whole decomposition each time. It answers three
questions with numbers instead of recollection:

  - how many reverse cases each definition produces
  - under how many definitions R2-03 specifically is reverse
  - whether the non-wear trim changes any of it

NOTHING HERE MODIFIES crossref.py. The composite is recomputed from the same
primitives crossref.composite() uses - adapters.surface_table() and
stats.within_subject_z() - with the channel list as a parameter instead of a module
constant. The baseline subset is asserted against crossref.keystone() on every run,
so if this file ever drifts from the definition of record the run fails rather than
quietly reporting a second, different answer.

Gaze-deviation variance stays out of every subset for the reason crossref gives: it
is rate-dependent and the composite spans both rounds.

`reverse` is a WITHIN-SUBJECT RELATIVE statement. A subject is reverse when their
clinical episode sits below their own three-video physiological mean while they did
not report boredom. It does not mean they were physiologically bored in absolute
terms, and for R2-03 in particular it cannot: they reported boredom 3/1/2 across the
three videos and never became bored on any stimulus. The reported columns carry the
raw ratings alongside the category so the distinction survives into the figure.
"""
import itertools

import numpy as np
import pandas as pd

import adapters
import config as C
import crossref as X
import stats as S

# The three poolable engagement channels, in the order crossref declares them.
CHANNELS = [(col, label) for col, label, _ in X.COMPOSITE_CHANNELS]
BASELINE = tuple(col for col, _ in CHANNELS)

TRIM_VARIANTS = ("untrimmed", "trimmed")


def _composite(wide, channels):
    """Mean within-subject z across `channels`. Same primitives as crossref.composite()."""
    zs = []
    for col in channels:
        t = adapters.surface_table(wide, col)
        if t.notna().sum().sum() == 0:
            continue
        zs.append(S.within_subject_z(t))
    if not zs:
        return pd.DataFrame()
    return pd.concat(zs).groupby(level=0).mean()


def _classify(wide, survey_df, channels, stimulus="CLC"):
    """Per-subject decomposition under one composite definition."""
    comp = _composite(wide, channels)
    if not len(comp) or stimulus not in comp.columns:
        return pd.DataFrame()
    sur = survey_df[survey_df.stimulus == stimulus].set_index("subject")
    rows = []
    for sid in sorted(comp.index):
        if sid not in sur.index:
            continue
        c = float(comp.loc[sid, stimulus])
        b = float(sur.loc[sid, "boredom"])
        engaged, bored = c > 0, b >= 5
        rows.append(dict(
            subject=sid, round=1 if sid.startswith("S") else 2,
            engaged_composite=c, boredom=b,
            engagement=float(sur.loc[sid, "engagement"]),
            category=("divergent" if engaged and bored else
                      "concordant-engaged" if engaged and not bored else
                      "concordant-bored" if not engaged and bored else "reverse")))
    return pd.DataFrame(rows)


def _trimmed_wide(wide, w2):
    """`wide` with Round 2's openness replaced by the non-wear-trimmed column.

    Round 1 has crop windows and therefore no non-wear period to trim, so its
    openness is untouched and the comparison isolates the Round 2 instrument
    artefact.
    """
    out = wide.copy()
    trim = w2.set_index(["subject", "stimulus"])["openness_mean_bilateral_trimmed"]
    key = list(zip(out.subject, out.stimulus))
    repl = pd.Series([trim.get(k, np.nan) for k in key], index=out.index)
    out.loc[out["round"] == 2, "openness_frac"] = repl[out["round"] == 2]
    return out


def analyse(wide, w2, survey_df, keystone_df, stimulus="CLC"):
    """-> (definition-level summary, per-subject-per-definition detail).

    Raises if the baseline subset fails to reproduce crossref.keystone(), which is
    the guarantee that this module reports the same composite as the pipeline.
    """
    subsets = [c for r in range(1, len(BASELINE) + 1)
               for c in itertools.combinations(BASELINE, r)]

    label_of = dict(CHANNELS)
    summary, detail = [], []

    for variant in TRIM_VARIANTS:
        frame = wide if variant == "untrimmed" else _trimmed_wide(wide, w2)
        for chans in subsets:
            d = _classify(frame, survey_df, list(chans), stimulus)
            if not len(d):
                continue
            d = d.assign(definition=" + ".join(label_of[c] for c in chans),
                         n_channels=len(chans), trim=variant,
                         is_baseline=(tuple(chans) == BASELINE))
            detail.append(d)

            rev = d[d.category == "reverse"]
            counts = d.category.value_counts()
            summary.append(dict(
                definition=" + ".join(label_of[c] for c in chans),
                n_channels=len(chans), trim=variant,
                is_baseline=(tuple(chans) == BASELINE), n=len(d),
                n_divergent=int(counts.get("divergent", 0)),
                n_concordant_engaged=int(counts.get("concordant-engaged", 0)),
                n_concordant_bored=int(counts.get("concordant-bored", 0)),
                n_reverse=len(rev),
                reverse_subjects=";".join(sorted(rev.subject)) or "(none)",
                descriptive_only=len(d) < C.DESCRIPTIVE_N_BELOW))

    det = pd.concat(detail, ignore_index=True) if detail else pd.DataFrame()
    summ = pd.DataFrame(summary)

    # ---- the guarantee ----------------------------------------------------
    base = det[(det.is_baseline) & (det.trim == "untrimmed")].set_index("subject")
    ref = keystone_df[keystone_df.stimulus == stimulus].set_index("subject")
    shared = sorted(set(base.index) & set(ref.index))
    mismatch = [s for s in shared if base.loc[s, "category"] != ref.loc[s, "category"]]
    if mismatch or len(shared) != len(ref):
        raise SystemExit(
            "sensitivity.py has drifted from crossref.keystone(): "
            f"{len(mismatch)} category mismatch(es) on {stimulus} "
            f"({', '.join(mismatch) or 'none'}), {len(shared)} of {len(ref)} subjects "
            "compared. The baseline subset must reproduce the definition of record.")

    return summ, det


def reverse_stability(detail, subject):
    """How often one subject is reverse across the definitions. -> dict."""
    d = detail[detail.subject == subject]
    if not len(d):
        return {}
    un = d[d.trim == "untrimmed"]
    return dict(
        subject=subject,
        n_definitions=int(len(un)),
        n_reverse=int((un.category == "reverse").sum()),
        composite_untrimmed=float(un[un.is_baseline].engaged_composite.iloc[0])
        if (un.is_baseline).any() else np.nan,
        composite_trimmed=float(
            d[(d.trim == "trimmed") & (d.is_baseline)].engaged_composite.iloc[0])
        if ((d.trim == "trimmed") & (d.is_baseline)).any() else np.nan,
        boredom_clinical=float(un.boredom.iloc[0]),
        engagement_clinical=float(un.engagement.iloc[0]))
