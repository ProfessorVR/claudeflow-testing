"""Cross-referencing: self-report against physiology (spec section D).

The keystone is physiology-engaged versus self-report-bored on the clinical
stimulus, now testable for all 12 subjects. The per-subject decomposition matters
more than the mean: the claim is not that everyone diverges but that nobody
diverges the other way, and an asymmetry is a stronger structural statement than an
average.

The engaged composite (composite A) is the mean of a subject's within-subject z-scores
on the TWO channels that (a) run in the engagement direction, (b) are poolable across
rounds, and (c) survive Holm correction - pupil dilation and eye closure. Cognitive
load is NOT in it: author ruling R-01 removed it from the primary composite because it
is vendor-computed from undisclosed inputs, and it stays in the sensitivity space only.
Gaze-deviation variance is deliberately excluded despite being informative, because it
is rate-dependent and the composite spans both rounds; composite B adds gaze amplitude
within each round.

The channel list below is the single source of truth. Any prose in this tree that
enumerates the composite's channels is generated from it (see report.py and
figures.py), never hardcoded - the v4 tree carried a three-channel sentence against a
two-channel computation, and that defect is what this rule prevents.
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
# PRIMARY (composite A) = pupil dilation + eye closure: the two surfaces that
# survive Holm correction, both computed here from raw per-sample data rather than
# taken from a vendor index.
#
# The sign is +1 where a higher value means more engaged. Gaze runs the other way
# and is handled in v3, where composite B adds it.
COMPOSITE_CHANNELS = [
    ("dil_mean_bilateral", "pupil dilation", +1),
    ("closure_frac", "eye closure", -1),
]

# The space the sensitivity sweep explores. Retains cognitive load so every subset
# including it is still reported; the sweep asserts that the COMPOSITE_CHANNELS
# subset reproduces keystone() exactly.
SENSITIVITY_CHANNELS = [
    ("dil_mean_bilateral", "pupil dilation", +1),
    ("cognitive_load_mean", "cognitive load", +1),
    ("closure_frac", "eye closure", -1),
]


def unified_wide(r1_wide, r2_wide, variant="unified"):
    """One subject x stimulus frame spanning both rounds, on harmonized columns."""
    a = r1_wide[r1_wide.variant == variant].copy()
    a["openness_frac"] = a["pct_valid_eye"] * C.R1_OPENNESS_SCALE
    b = r2_wide.copy()
    b["openness_frac"] = b["openness_mean_bilateral"]
    # D-11 (author ruling, full rename approved 2026-08-05): the REPORTED surface is
    # EYE CLOSURE - the proportion of the episode during which the eyes were shut -
    # not openness. closure = 1 - openness exactly, on both rounds, so these are one
    # measurement read in opposite directions. `openness_frac` is RETAINED because the
    # locked reproduction gate is defined on it and must not move; the gate therefore
    # goes on proving continuity against the methodology of record while every
    # reported number is stated in the closure direction.
    for f in (a, b):
        f["closure_frac"] = 1.0 - f["openness_frac"]
    keep = ["subject", "stimulus", "round", "dil_mean_bilateral", "cognitive_load_mean",
            "hr_mean", "gaze_dev_variance", "gaze_dev_median", "openness_frac",
            "closure_frac", "pct_time_closed", "duration_s", "effective_hz"]
    for c in keep:
        for f in (a, b):
            if c not in f.columns:
                f[c] = np.nan
    return pd.concat([a[keep], b[keep]], ignore_index=True)


# Composite B (v3): composite A plus the rebuilt gaze amplitude. Gaze runs the
# OPPOSITE way to pupil and openness -- more deviation from center means less
# engaged -- so it enters with sign -1. Gaze is NOT poolable across rounds, so
# composite B is computed within each round separately and never pooled.
COMPOSITE_B_CHANNELS = [
    ("dil_mean_bilateral", "pupil dilation", +1),
    ("closure_frac", "eye closure", -1),
    ("gaze_deg_median", "gaze deviation from center", -1),
]


def composite(wide, channels=None):
    """Within-subject z of each engagement channel, averaged -> engaged composite."""
    zs, used = [], []
    for col, label, sign in (channels or COMPOSITE_CHANNELS):
        t = adapters.surface_table(wide, col)
        if t.notna().sum().sum() == 0:
            continue
        zs.append(S.within_subject_z(t) * sign)
        used.append(label)
    if not zs:
        return pd.DataFrame(), []
    stack = pd.concat(zs).groupby(level=0).mean()
    return stack, used


def assert_rename_is_value_preserving(wide):
    """PROOF, re-run every time: D-11's rename moves no composite value.

    Within-subject z of (1 - x) is exactly -z(x), because the mean maps to 1 - mean
    and the standard deviation is unchanged. A composite carrying eye CLOSURE at
    sign -1 is therefore numerically identical to one carrying eye OPENNESS at +1.
    The rename changes the name and the reported direction; it changes no number in
    the keystone, the decomposition or the sensitivity sweep.

    This is asserted here rather than argued in prose, so a future edit that breaks
    the equivalence aborts the run instead of quietly shifting the keystone.
    """
    now, _ = composite(wide, COMPOSITE_CHANNELS)
    then, _ = composite(wide, [("dil_mean_bilateral", "pupil dilation", +1),
                               ("openness_frac", "eye openness", +1)])
    if now.empty or then.empty:
        raise AssertionError("D-11 equivalence check: composite came back empty")
    a, b = now.align(then, join="inner")
    delta = float(np.nanmax(np.abs(a.values - b.values)))
    if not delta < 1e-12:
        raise AssertionError(
            f"D-11 equivalence BROKEN: closure-at-(-1) and openness-at-(+1) composites "
            f"differ by {delta:.3e}. The rename must be value-preserving.")
    J.note("D-11 rename", f"eye closure at sign -1 reproduces eye openness at sign +1 "
                          f"exactly (max |delta| = {delta:.1e} across "
                          f"{a.shape[0]} subjects x {a.shape[1]} stimuli); the rename is "
                          f"a change of name and direction, not of value")
    return delta


def keystone(wide, survey_df, stimulus="CLC", channels=None, tag="A"):
    """Per-subject decomposition on one stimulus.

    divergent          physiology engaged (composite > 0) AND self-report bored (>=5)
    concordant-engaged physiology engaged AND not bored
    concordant-bored   physiology not engaged AND bored
    reverse            physiology not engaged AND not bored -- the case whose absence
                       is the actual claim
    """
    comp, used = composite(wide, channels)
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
                         engaged_composite=c, boredom=b, engagement=e, composite=tag,
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
    for f in (a, b):
        f["closure_frac"] = 1.0 - f["openness_frac"]          # D-11
    rows = []
    for col, label, poolkey in [
            ("dil_mean_bilateral", "pupil dilation", "pupil_dilation"),
            ("cognitive_load_mean", "cognitive load", "cognitive_load"),
            ("hr_mean", "HR", "hr"),
            ("closure_frac", "eye closure", "eye_closure"),
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
    specs = [("eye closure", "openness_mean_bilateral", "pct_valid_eye",
              C.R1_OPENNESS_SCALE, "eye_closure", True),
             ("pupil dilation", "dil_mean_bilateral", "dil_mean_bilateral",
              1.0, "pupil_dilation", False)]
    for wname in r2_wide_all.window.unique():
        w2 = r2_wide_all[r2_wide_all.window == wname]
        for label, r2col, r1col, scale, key, invert in specs:
            if r2col not in w2.columns:
                continue
            # D-11: the closure surface is reported as closure here too. Friedman is
            # invariant under 1 - x (it ranks within subject, and reversing all ranks
            # leaves chi2 unchanged) and Wilcoxon is invariant because the paired
            # differences merely negate; only the rank-biserial sign and the direction
            # count move, and they move to match the way the surface is now named.
            t2 = adapters.surface_table(w2, r2col)
            pooled = S.pooled_table(adapters.surface_table(r1_unified, r1col), t2,
                                    r1_scale=scale)
            if invert:
                t2, pooled = 1.0 - t2, 1.0 - pooled
            r2r, r2d = S.test_surface(t2, label, poolable_key=key, scope=f"R2 {wname}")
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
           "Round 2 analyzed at both the full crop and a Round-1-matched window "
           f"dropping {C.R1_MATCH_TRIM_S:.0f} s from each end, mirroring the ~2 min "
           "sync guards Round 1 cut inside its instructed closures.")
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# D-12 REVISED (author ruling 2026-08-05). "Center" is not given by the recording;
# three references are defensible and all three are computed. Neither is primary -
# each is assigned to the question it can answer, and every gaze result names the
# baseline it was computed on. The assignment is stated here once so captions and
# generated prose read it rather than restating it.
GAZE_BASELINE_ASSIGNMENT = {
    "separation": "device-forward baseline",
    "criterion": "per-participant baseline",
    "alongside": "per-file baseline",
}
GAZE_BASELINE_WHY = (
    "The agreement analysis is entirely within-subject, and the per-participant "
    "baseline is the only one of the three built the same way: it removes what "
    "differs between people and does not matter - how the headset happened to sit on "
    "that face - while preserving what differs within a person and does matter, "
    "whether they held the eye differently during one film than another. The per-file "
    "baseline recenters inside each episode and erases that between-film difference "
    "by construction. The device-forward baseline keeps the difference but carries "
    "the headset-fit variation with it, which is why it is used for stimulus "
    "separation, where between-person differences are not what the test compares.")

_LEGACY_N = 10          # channels present in v1-v4, whose seeds must not move
_ROUND_OFFSET = {"pooled": 0, "R1": 10_000, "R2": 20_000}


def _perm_seed_offset(criterion, j):
    """Seed offset for one (criterion, channel), stable under appending channels."""
    if j < _LEGACY_N:
        return j + (0 if criterion == "boredom" else _LEGACY_N)
    k = j - _LEGACY_N
    return 2 * _LEGACY_N + 2 * k + (0 if criterion == "boredom" else 1)


def criterion_validity(wide, survey_df, eeg_keystone=None, round_scope="pooled"):
    """Each instrument scored AGAINST the participants' own reports.

    This is the study's own validation logic and it had never been run. The
    reanalysis had only ever asked whether a channel SEPARATES THE THREE FILMS;
    the original question was whether a channel AGREES WITH WHAT THE PARTICIPANT
    SAID. Both are reported; neither validates the other, per DA-04.

    Both sides are converted to WITHIN-SUBJECT z first, so a participant with a
    large pupil, a wide-ranging eye, or a habit of rating everything high cannot
    drive the association. Each participant then contributes only the SHAPE of
    their three films relative to themselves.

    THE CLUSTERING PROBLEM, and why the reported p is a permutation p
    ----------------------------------------------------------------
    The 36 paired points are NOT 36 independent observations: they are 12
    participants contributing 3 each. Worse, within-subject z-scoring makes the
    dependence structural - forcing a participant's three values to have mean 0
    and sd 1 means knowing two nearly determines the third. `spearmanr` and
    `pearsonr` both assume independence, so their analytic p-values are
    ANTI-CONSERVATIVE here: measured inflation is roughly 3-8x.

    The reported p is therefore a WITHIN-SUBJECT PERMUTATION p: the three film
    labels are shuffled INSIDE each participant, the coefficient recomputed, and
    the process repeated C.PERMUTATIONS times. That null distribution preserves
    the clustering exactly. The analytic p is retained beside it in the output so
    the difference is on the record rather than silently corrected.

    Both coefficients are computed. SPEARMAN (rank) is the reported one: it makes
    no assumption of linearity and no single extreme value can dominate it.
    PEARSON (linear) is carried for the appendix - where the two agree closely the
    monotonic relationship is also close to linear, which shows the rank test was
    not chosen to manufacture a result and costs almost nothing in power. The
    permutation correction is applied to BOTH, which demonstrates that the
    clustering inflation is a property of the design and not an artifact of
    ranking.
    """
    from scipy import stats as sps
    rows = []
    round_offset = _ROUND_OFFSET[round_scope]
    # X-06(b): per-round splits as a sensitivity check that the pooled association is
    # not carried by one round. Round 2 is THIN by construction - four participants
    # give twelve paired points and only 6^4 = 1296 distinct within-subject
    # arrangements - so its permutation p has a coarse floor and is descriptive.
    if round_scope != "pooled":
        wide = wide[wide["round"] == (1 if round_scope == "R1" else 2)]
    sr = survey_df[["subject", "stimulus", "boredom", "engagement"]].copy()
    sr = sr[sr.subject.isin(set(wide.subject.unique()))]
    channels = [("dil_mean_bilateral", "pupil dilation", "load-bearing"),
                # D-11 rename, IN PLACE at index 1 so the per-job seed is unchanged.
                # rho(closure) == -rho(openness) exactly and the permutation p is
                # IDENTICAL, because the null is compared on |rho|.
                ("closure_frac", "eye closure", "load-bearing"),
                # EVERY gaze channel names its baseline. Standing rule: no gaze number
                # is ever presented without saying what "center" was defined against,
                # and two of these labels did not say ("gaze deviation median" is the
                # per-file measure; "(v3)" meant device-forward and named a code
                # version rather than a reference).
                ("gaze_dev_median", "gaze deviation (per-file baseline)", "load-bearing"),
                ("gaze_deg_median", "gaze deviation (device-forward baseline)", "load-bearing"),
                ("gaze_deg_p90", "gaze deg p90 (device-forward baseline)", "load-bearing"),
                ("gaze_pct_beyond_10deg", "% time >10 deg off center (device-forward baseline)",
                 "load-bearing"),
                ("gaze_excursion_rate_10deg_per_min",
                 "excursion rate >10 deg (device-forward baseline)", "load-bearing"),
                ("gaze_dev_variance", "gaze deviation variance (per-file baseline)",
                 "load-bearing"),
                ("cognitive_load_mean", "cognitive load", "APPENDIX ONLY (vendor index)"),
                ("hr_mean", "HR", "APPENDIX ONLY (removed from analysis)"),
                # X-06(a): the PER-PARTICIPANT gaze baseline, computed for the
                # gaze-baselines figure but never scored against self-report until now.
                # APPENDED, so every seed above is untouched.
                #
                # D-12 REVISED (author ruling 2026-08-05): this baseline is now the
                # ASSIGNED criterion measure. The ground is the design, not the
                # coefficient - the agreement analysis is entirely within-subject, and
                # this is the only baseline built the same way, removing what differs
                # between people (how the headset sat on a face) while preserving what
                # differs within a person between films. The per-file baseline recenters
                # inside each episode and so erases that between-film difference before
                # the test can see it. That it also scores highest is corroboration.
                ("gaze_deg_median_subject", "gaze deviation (per-participant baseline)",
                 "load-bearing")]

    # Deterministic: one fixed seed per (criterion, channel), so the permutation p is
    # byte-reproducible across runs.
    #
    # X-06 (2026-08-05): the seed is now PINNED rather than taken from the position in
    # `jobs`. Under the positional scheme, appending a channel shifted the index of
    # every engagement job and silently moved every engagement permutation p. The
    # first _LEGACY_N channels keep exactly the seeds the v1-v4 trees used
    # (boredom j -> SEED+j, engagement j -> SEED+_LEGACY_N+j); channels added after
    # them draw from SEED+2*_LEGACY_N upward, interleaved by criterion. Appending is
    # therefore value-preserving for everything already reported.
    jobs = [(c, j, col, lab, note) for c in ("boredom", "engagement")
            for j, (col, lab, note) in enumerate(channels)]

    for crit_col, j, col, label, note in jobs:
        if col not in wide.columns:
            continue
        i = _perm_seed_offset(crit_col, j) + round_offset
        ct = S.within_subject_z(adapters.surface_table(sr, crit_col))
        zt = S.within_subject_z(adapters.surface_table(wide, col)).reindex(ct.index)
        A, B = zt.values, ct.values
        m = ~(np.isnan(A) | np.isnan(B))
        n = int(m.sum())
        if n < 6:
            rows.append(dict(channel=label, criterion=crit_col, round_scope=round_scope,
                             n=n, n_subjects=0,
                             rho=np.nan, p_perm=np.nan, p_analytic=np.nan,
                             pearson_r=np.nan, pearson_p_perm=np.nan,
                             pearson_p_analytic=np.nan, r_minus_rho=np.nan,
                             permutations=0, note=f"{note}; too few paired episodes"))
            continue

        rho, p_rho = sps.spearmanr(A[m], B[m])
        r_p, p_r = sps.pearsonr(A[m], B[m])

        rng = np.random.default_rng(C.SEED + i)
        null_s = np.empty(C.PERMUTATIONS)
        null_p = np.empty(C.PERMUTATIONS)
        for k in range(C.PERMUTATIONS):
            P = np.array([rng.permutation(row) for row in B])
            mm = ~(np.isnan(A) | np.isnan(P))
            null_s[k] = sps.spearmanr(A[mm], P[mm])[0]
            null_p[k] = sps.pearsonr(A[mm], P[mm])[0]
        pp_s = float((np.abs(null_s) >= abs(rho)).mean())
        pp_p = float((np.abs(null_p) >= abs(r_p)).mean())

        rows.append(dict(channel=label, criterion=crit_col, round_scope=round_scope, n=n,
                         n_subjects=int((~np.isnan(A) & ~np.isnan(B)).any(axis=1).sum()),
                         rho=float(rho), p_perm=pp_s, p_analytic=float(p_rho),
                         pearson_r=float(r_p), pearson_p_perm=pp_p,
                         pearson_p_analytic=float(p_r),
                         r_minus_rho=float(r_p - rho),
                         permutations=C.PERMUTATIONS, note=note))

    J.note("criterion validity",
           f"Reported p is a WITHIN-SUBJECT PERMUTATION p over {C.PERMUTATIONS} shuffles of the "
           "three film labels inside each participant, because the 36 paired points are 12 "
           "participants contributing 3 each and the analytic p assumes independence. The "
           "analytic p is retained beside it. Pearson is computed alongside Spearman for the "
           "appendix; the permutation correction is applied to both.")
    return pd.DataFrame(rows)
