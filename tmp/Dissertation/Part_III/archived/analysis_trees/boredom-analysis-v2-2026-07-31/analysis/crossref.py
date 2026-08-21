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

# ---------------------------------------------------------------- composites
# Author ruling R-01 (2026-07-31): cognitive load is vendor-computed from
# undisclosed inputs and may carry NO dissertation claim. It therefore leaves the
# PRIMARY composite and stays in the SENSITIVITY space, so the appendix can still
# show what it does and the exclusion is evidenced rather than asserted.
#
# PRIMARY (composite A) = pupil dilation + eye openness: the two surfaces that
# survive Holm correction, both computed here from raw per-sample data rather than
# taken from a vendor index.
#
# The sign is +1 where a higher value means more engaged. Gaze runs the other way
# and is handled in v3, where composite B adds it.
COMPOSITE_CHANNELS = [
    ("dil_mean_bilateral", "pupil dilation", +1),
    ("openness_frac", "eye openness", +1),
]

# The space the sensitivity sweep explores. Retains cognitive load so every subset
# including it is still reported; the sweep asserts that the COMPOSITE_CHANNELS
# subset reproduces keystone() exactly.
SENSITIVITY_CHANNELS = [
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


# ---------------------------------------------------------------------------
def window_comparison(r1_unified, r2_wide_all):
    """The two Round 2 windows tested side by side, against the same Round 1.

    Author ruling D-05. Round 1's window is the middle ~13.6 min of the film;
    Round 2's crop is essentially the whole of it. Both Round 2 windows are carried
    through the same tests so the difference is measured rather than assumed away.
    """
    rows = []
    specs = [("eye openness", "openness_mean_bilateral", "pct_valid_eye",
              C.R1_OPENNESS_SCALE, "eye_openness"),
             ("pupil dilation", "dil_mean_bilateral", "dil_mean_bilateral",
              1.0, "pupil_dilation")]
    for wname in r2_wide_all.window.unique():
        w2 = r2_wide_all[r2_wide_all.window == wname]
        for label, r2col, r1col, scale, key in specs:
            if r2col not in w2.columns:
                continue
            t2 = adapters.surface_table(w2, r2col)
            r2r, r2d = S.test_surface(t2, label, poolable_key=key, scope=f"R2 {wname}")
            pooled = S.pooled_table(adapters.surface_table(r1_unified, r1col), t2,
                                    r1_scale=scale)
            pr, pd_ = S.test_surface(pooled, label, poolable_key=key,
                                     scope=f"POOLED N=12 {wname}")
            for r, det in ((r2r, r2d), (pr, pd_)):
                d = {x["pair"]: x for x in det}
                rows.append(dict(
                    surface=label, window=wname, scope=r["scope"], n=r["n"],
                    friedman_chi2=r.get("friedman_chi2"), friedman_p=r.get("friedman_p"),
                    bor_lt_clc=d.get("BORvCLC", {}).get("direction"),
                    bor_lt_int=d.get("BORvINT", {}).get("direction"),
                    p_bor_clc=d.get("BORvCLC", {}).get("wilcoxon_p"),
                    p_bor_int=d.get("BORvINT", {}).get("wilcoxon_p"),
                    rb_bor_clc=d.get("BORvCLC", {}).get("effect_rb"),
                    rb_bor_int=d.get("BORvINT", {}).get("effect_rb")))
    J.note("window comparison",
           "Round 2 analysed at both the full crop and a Round-1-matched window "
           f"dropping {C.R1_MATCH_TRIM_S:.0f} s from each end, mirroring the ~2 min "
           "sync guards Round 1 cut inside its instructed closures.")
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
def criterion_validity(wide, survey_df, eeg_keystone=None):
    """Each instrument scored AGAINST the participants' own reports.

    This is the study's own validation logic, and it had never been run. The
    reanalysis had only ever asked whether a channel separates the three films;
    the original question was whether a channel agrees with what the participant
    said. Both are reported; neither validates the other, per DA-04.

    Association is Spearman rho on WITHIN-SUBJECT z of both sides, so a subject
    with a large pupil or a habit of rating everything high cannot drive it.
    """
    from scipy import stats as sps
    rows = []
    sr = survey_df[["subject", "stimulus", "boredom", "engagement"]].copy()
    channels = [("dil_mean_bilateral", "pupil dilation", "load-bearing"),
                ("openness_frac", "eye openness", "load-bearing"),
                ("gaze_dev_variance", "gaze deviation variance", "load-bearing"),
                ("gaze_dev_median", "gaze deviation median", "load-bearing"),
                ("cognitive_load_mean", "cognitive load", "APPENDIX ONLY (vendor index)"),
                ("hr_mean", "HR", "APPENDIX ONLY (removed from analysis)")]
    for crit_col in ("boredom", "engagement"):
        ct = S.within_subject_z(adapters.surface_table(sr, crit_col))
        for col, label, note in channels:
            if col not in wide.columns:
                continue
            zt = S.within_subject_z(adapters.surface_table(wide, col))
            a, b = [], []
            for subj in zt.index:
                if subj not in ct.index:
                    continue
                for stim in C.STIMULI:
                    x, y = zt.loc[subj, stim], ct.loc[subj, stim]
                    if pd.notna(x) and pd.notna(y):
                        a.append(x); b.append(y)
            if len(a) < 6:
                rows.append(dict(channel=label, criterion=crit_col, rho=np.nan, p=np.nan,
                                 n=len(a), note=f"{note}; too few paired episodes"))
                continue
            rho, p = sps.spearmanr(a, b)
            rows.append(dict(channel=label, criterion=crit_col, rho=float(rho),
                             p=float(p), n=len(a), note=note))
    return pd.DataFrame(rows)
