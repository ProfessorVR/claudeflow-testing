"""Cross-referencing: self-report against physiology (spec section D).

The keystone is physiology-engaged versus self-report-bored on the clinical
stimulus, now testable for all 12 subjects. The per-subject decomposition matters
more than the mean: the claim is not that everyone diverges but that nobody
diverges the other way, and an asymmetry is a stronger structural statement than an
average.

The engaged composite is the mean of a subject's within-subject z-scores on the
three channels that (a) run in the engagement direction and (b) are poolable across
rounds - pupil dilation, cognitive load and eye openness. Gaze-deviation variance is
deliberately excluded despite being informative, because it is rate-dependent and
the composite spans both rounds.
"""
import numpy as np
import pandas as pd

import adapters
import config as C
import journal as J
import stats as S

COMPOSITE_CHANNELS = [
    ("dil_mean_bilateral", "pupil dilation", +1),
    ("cognitive_load_mean", "cognitive load", +1),
    ("openness_frac", "eye openness", +1),
]


def unified_wide(r1_wide, r2_wide, variant="unified"):
    """One subject x stimulus frame spanning both rounds, on harmonised columns."""
    a = r1_wide[r1_wide.variant == variant].copy()
    a["openness_frac"] = a["pct_valid_eye"] * C.R1_OPENNESS_SCALE
    b = r2_wide.copy()
    b["openness_frac"] = b["openness_mean_bilateral"]
    keep = ["subject", "stimulus", "round", "dil_mean_bilateral", "cognitive_load_mean",
            "hr_mean", "gaze_dev_variance", "gaze_dev_median", "openness_frac",
            "pct_time_closed", "duration_s", "effective_hz"]
    for c in keep:
        for f in (a, b):
            if c not in f.columns:
                f[c] = np.nan
    return pd.concat([a[keep], b[keep]], ignore_index=True)


def composite(wide):
    """Within-subject z of each engagement channel, averaged -> engaged composite."""
    zs, used = [], []
    for col, label, sign in COMPOSITE_CHANNELS:
        t = adapters.surface_table(wide, col)
        if t.notna().sum().sum() == 0:
            continue
        zs.append(S.within_subject_z(t) * sign)
        used.append(label)
    if not zs:
        return pd.DataFrame(), []
    stack = pd.concat(zs).groupby(level=0).mean()
    return stack, used


def keystone(wide, survey_df, stimulus="CLC"):
    """Per-subject decomposition on one stimulus.

    divergent          physiology engaged (composite > 0) AND self-report bored (>=5)
    concordant-engaged physiology engaged AND not bored
    concordant-bored   physiology not engaged AND bored
    reverse            physiology not engaged AND not bored -- the case whose absence
                       is the actual claim
    """
    comp, used = composite(wide)
    sur = survey_df[survey_df.stimulus == stimulus].set_index("subject")
    rows = []
    for sid in sorted(comp.index):
        if stimulus not in comp.columns or sid not in sur.index:
            continue
        c = float(comp.loc[sid, stimulus])
        b = float(sur.loc[sid, "boredom"])
        e = float(sur.loc[sid, "engagement"])
        engaged = c > 0
        bored = b >= 5
        cat = ("divergent" if engaged and bored else
               "concordant-engaged" if engaged and not bored else
               "concordant-bored" if not engaged and bored else "reverse")
        rows.append(dict(subject=sid, stimulus=stimulus,
                         round=1 if sid.startswith("S") else 2,
                         engaged_composite=c, boredom=b, engagement=e,
                         physiology_engaged=engaged, selfreport_bored=bored,
                         category=cat))
    df = pd.DataFrame(rows)
    J.note("keystone composite",
           f"engaged composite = mean within-subject z of {', '.join(used)}; "
           f"gaze-deviation variance excluded because it is rate-dependent and the "
           f"composite spans both rounds")
    return df


def moderation(keystone_df, survey_df):
    """Prior-exposure split. Descriptive only: the strata are 4 and 8."""
    pe = survey_df.groupby("subject").prior_exposure.first()
    k = keystone_df.copy()
    k["prior_exposure"] = k.subject.map(pe)
    sur = survey_df[survey_df.stimulus == "CLC"].set_index("subject")
    k["felt_duration_min"] = k.subject.map(sur.felt_duration_min)
    g = k.groupby("prior_exposure").agg(
        n=("subject", "count"), boredom=("boredom", "mean"),
        engagement=("engagement", "mean"), felt_duration=("felt_duration_min", "mean"),
        engaged_composite=("engaged_composite", "mean")).reset_index()
    g["stratum"] = g.prior_exposure.map({1: "prior exposure to medical footage",
                                         0: "no prior exposure"})
    g["descriptive_only"] = True
    return g, k


def replication(r1_wide, r2_wide, variant="unified"):
    """Which effects reproduce across instrument generations, on z-scores."""
    a = r1_wide[r1_wide.variant == variant].copy()
    a["openness_frac"] = a["pct_valid_eye"] * C.R1_OPENNESS_SCALE
    b = r2_wide.copy()
    b["openness_frac"] = b["openness_mean_bilateral"]
    rows = []
    for col, label, poolkey in [
            ("dil_mean_bilateral", "pupil dilation", "pupil_dilation"),
            ("cognitive_load_mean", "cognitive load", "cognitive_load"),
            ("hr_mean", "HR", "hr"),
            ("openness_frac", "eye openness", "eye_openness"),
            ("gaze_dev_variance", "gaze deviation variance", "gaze_dev_variance")]:
        z1 = S.within_subject_z(adapters.surface_table(a, col)).mean()
        z2 = S.within_subject_z(adapters.surface_table(b, col)).mean()
        pool, reason = C.POOLABLE.get(poolkey, (None, ""))
        for stim in C.STIMULI:
            rows.append(dict(surface=label, stimulus=stim,
                             r1_z=float(z1.get(stim, np.nan)),
                             r2_z=float(z2.get(stim, np.nan)),
                             delta=float(z2.get(stim, np.nan) - z1.get(stim, np.nan)),
                             poolable=pool, poolable_reason=reason))
    return pd.DataFrame(rows)


def selfreport_tests(survey_df):
    """The self-report instrument's own within-subject tests."""
    rows, details = [], []
    for col, label in [("boredom", "self-report boredom"),
                       ("engagement", "self-report engagement"),
                       ("sleep_fight", "sleep-fight"),
                       ("felt_duration_min", "felt duration"),
                       ("felt_duration_ratio", "felt-duration dilation ratio"),
                       ("depletion", "depletion (fatigue after - prior)"),
                       ("minutes_until_bored", "minutes until bored")]:
        t = survey_df.pivot_table(index="subject", columns="stimulus", values=col,
                                  aggfunc="first").reindex(columns=list(C.STIMULI))
        note = ""
        if col == "minutes_until_bored":
            note = ("subjects who never became bored are absent by design, not by "
                    "missingness; n is reduced accordingly and the test is on those "
                    "who did become bored")
        r, d = S.test_surface(t, label, poolable_key="self_report",
                              scope="pooled N=12", n_note=note)
        rows.append(r)
        details.extend(d)
    return pd.DataFrame(rows), pd.DataFrame(details)
