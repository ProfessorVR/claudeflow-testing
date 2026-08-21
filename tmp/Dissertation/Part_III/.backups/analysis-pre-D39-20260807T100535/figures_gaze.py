"""v3 figure suite: the rebuilt gaze metrics, criterion validity, composites, windows.

Six figures the v1/v2 suite has no equivalent for. House style, colors, save path
and caption convention are inherited from `figures.py` rather than re-declared, so
these sit in the same tree with the same provenance: PDF + PNG + sibling data CSV
+ caption stub naming n, test and effect size.

Every one of these carries the same standing caution: BOTH ROUNDS RECORD GAZE
EYE-IN-HEAD, NOT HEAD POSE. A participant who turns their head away from the film
registers no deviation here. Head movement is deferred by author ruling.
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

import config as C
import crossref as X
from figures import _save, _c, _round_of

EYE_IN_HEAD = ("Gaze is EYE-IN-HEAD, not head pose: a participant who turns their head away "
               "from the film registers no deviation here. Head movement is visible in the "
               "session video and is DEFERRED by author ruling, not measured in this pass.")
PRIMARY_WIN = ("crop", C.R2_PRIMARY_WINDOW)


def _prim(gz, baseline="forward"):
    return gz[(gz.baseline == baseline) & (gz.window.isin(PRIMARY_WIN))]


def _tab(d, col):
    return d.pivot_table(index="subject", columns="stimulus", values=col).reindex(
        columns=list(C.STIMULI))


def _per_round_counts(t, a, b):
    """Subjects with film `a` above film `b`, PER ROUND and never pooled (D-28).

    The v4 caption reported a pooled '10/12' for a channel the analysis marks not
    poolable and for which no pooled test is run anywhere. The counts are of
    within-participant signs, each computed inside one round, so they are more
    defensible than pooling values would be - but stating them pooled contradicts
    the analysis's own rule, and an internal inconsistency is what a reader catches.
    """
    acc = {}
    for sid, r in t.iterrows():
        if pd.isna(r.get(a)) or pd.isna(r.get(b)):
            continue
        n, k = acc.get(_round_of(sid), (0, 0))
        acc[_round_of(sid)] = (n + 1, k + int(r[a] > r[b]))
    return " and ".join(f"{k} of {n} (Round {rnd})" for rnd, (n, k) in sorted(acc.items()))


def _crit_rho(ctx, channel_contains, criterion):
    """Look one coefficient up from the criterion family rather than restating it."""
    d = ctx.get("crit_pooled")
    if d is None or not len(d):
        return None
    m = d[(d.criterion == criterion)
          & (d.channel.str.contains(channel_contains, case=False, regex=False))]
    return None if not len(m) else (float(m.rho.iloc[0]), float(m.p_perm.iloc[0]))


# ---------------------------------------------------------------------------
def criterion_validity(ctx):
    """Each instrument scored against what the participants themselves reported."""
    crit = ctx["crit_pooled"].copy()
    order = (crit[crit.criterion == "boredom"]
             .assign(a=lambda d: d.rho.abs()).sort_values("a").channel.tolist())
    fig, axes = plt.subplots(1, 2, figsize=(11.5, 5.2), sharey=True)
    for ax, which in zip(axes, ("boredom", "engagement")):
        d = crit[crit.criterion == which].set_index("channel").reindex(order)
        y = np.arange(len(d))
        appendix = d.note.fillna("").str.contains("APPENDIX")
        colors = ["#999999" if a else ("#0072B2" if r >= 0 else "#D55E00")
                   for a, r in zip(appendix, d.rho.fillna(0))]
        ax.hlines(y, 0, d.rho, color=colors, lw=2.4, zorder=2)
        ax.scatter(d.rho, y, s=46, color=colors, zorder=3,
                   edgecolor="white", linewidth=0.7)
        for i, (rho, p) in enumerate(zip(d.rho, d.p_perm)):
            if pd.isna(rho):
                continue
            mark = "**" if p < 0.01 else ("*" if p < 0.05 else "")
            off = 0.035 if rho >= 0 else -0.035
            ax.text(rho + off, i, f"{rho:+.2f}{mark}", va="center",
                    ha="left" if rho >= 0 else "right", fontsize=7.6)
        ax.axvline(0, color="#444444", lw=0.9)
        ax.set_xlim(-0.75, 0.75)
        ax.set_yticks(y)
        ax.set_yticklabels(d.index, fontsize=8)
        ax.set_xlabel(f"Spearman rho vs self-reported {which}")
        ax.set_title(f"vs {which}", fontsize=10)
        ax.grid(axis="x", alpha=0.25)
    fig.suptitle("Criterion validity: each instrument against the participants' own reports",
                 fontsize=11.5)
    fig.tight_layout()

    n = int(ctx["crit_pooled"].n.max())
    nperm = int(ctx["crit_pooled"].permutations.max())
    cap = (
        f"Every channel scored AGAINST what the participants themselves reported, which is the "
        f"study's own validation logic and had never been run. Spearman rho on WITHIN-SUBJECT z "
        f"of both sides, so a participant with a large pupil or a habit of rating everything "
        f"high cannot drive it; n={n} paired episodes from 12 participants. STARS MARK A "
        f"WITHIN-SUBJECT PERMUTATION p ({nperm:,} shuffles of the three film labels inside each "
        f"participant), NOT the analytic p: the 36 points are 12 participants contributing 3 "
        f"each, so the analytic p assumes an independence the design does not have and runs "
        f"3-8x too small. Both are in the sibling CSV. * p<0.05, ** p<0.01. Grey bars are the "
        f"channels ruled APPENDIX-ONLY (cognitive load is vendor-computed from undisclosed "
        f"inputs; heart rate failed for some participants owing to facial and head structure) - "
        f"both are flat against both items, which is the ruling evidenced rather than asserted. "
        f"The result that matters: GAZE DEVIATION on the "
        f"{X.GAZE_BASELINE_ASSIGNMENT['criterion'].upper()} - the measure assigned to this "
        f"question under D-12 as revised - is the strongest single predictor of "
        f"self-report on both items, with the {X.GAZE_BASELINE_ASSIGNMENT['alongside']} "
        f"next and pointing the same way, so the finding does not turn on which of the two "
        f"is chosen. PUPIL DILATION does not track self-report at all "
        f"even though it separates the three films powerfully. Those are two different "
        f"questions - does a channel separate the stimuli, and does it agree with the person - "
        f"and the channels rank oppositely on them. Neither channel validates the other "
        f"(DA-04): both are reported. {EYE_IN_HEAD}")
    return _save(fig, ("cross-cutting", "criterion-validity"), ctx["crit_pooled"], cap)


# ---------------------------------------------------------------------------
def amplitude_vs_frequency(ctx):
    """The two components of the construct, running in opposite directions."""
    gz = _prim(ctx["gz"])
    specs = [("gaze_deg_median", "Amplitude\nmedian degrees off center", "higher when bored"),
             ("gaze_excursion_rate_10deg_per_min",
              "Frequency\nexcursions >10 deg per minute", "LOWER when bored")]
    fig, axes = plt.subplots(1, 2, figsize=(10.5, 5.0))
    rows = []
    for ax, (col, title, note) in zip(axes, specs):
        t = _tab(gz, col)
        for sid, r in t.iterrows():
            rnd = _round_of(sid)
            ax.plot(range(3), r.values, "-", color="#888888", lw=0.9, alpha=0.75, zorder=1)
            for j, stim in enumerate(C.STIMULI):
                ax.scatter(j, r[stim], color=_c(stim), marker=C.ROUND_MARKER[rnd],
                           s=44, zorder=3, edgecolor="white", linewidth=0.6)
                rows.append(dict(subject=sid, stimulus=stim, measure=col, value=r[stim]))
        med = t.median()
        ax.plot(range(3), med.values, "-", color="#111111", lw=2.4, zorder=4, label="cohort median")
        ax.set_xticks(range(3))
        ax.set_xticklabels([C.STIM_LONG[s] for s in C.STIMULI])
        ax.set_title(f"{title}\n({note})", fontsize=9.5)
        ax.grid(axis="y", alpha=0.25)
        ax.legend(fontsize=7.5, loc="best")
    fig.suptitle("Gaze amplitude and gaze frequency separate the films in OPPOSITE directions",
                 fontsize=11.5)
    fig.tight_layout()

    amp = _tab(gz, "gaze_deg_median")
    a_clc, a_int = _per_round_counts(amp, "BOR", "CLC"), _per_round_counts(amp, "BOR", "INT")
    ff = _crit_rho(ctx, "gaze deviation (device-forward baseline)", "boredom")
    cr = _crit_rho(ctx, f"gaze deviation ({X.GAZE_BASELINE_ASSIGNMENT['criterion']})", "boredom")
    _mix = ""
    if ff and cr:
        _mix = (f" BASELINES DO NOT MIX. Both panels are computed on the device-forward axis, "
                f"where the association with self-reported boredom is rho {ff[0]:+.2f} at "
                f"permutation p={ff[1]:.4f} and does NOT survive. The association that does "
                f"survive - rho {cr[0]:+.2f}, p={cr[1]:.4f} - belongs to a DIFFERENT baseline, "
                f"the {X.GAZE_BASELINE_ASSIGNMENT['criterion']}, and is reported in the "
                f"criterion-validity figure, never against the counts above.")
    cap = (
        "The author's construct has two components and they behave differently, which is why a "
        "single 'gaze variance' number was ambiguous. LEFT, amplitude: how far the eye sits from "
        "center on the DEVICE-FORWARD baseline, higher on the boring film in "
        f"{a_clc} against clinical and {a_int} against interesting - stated PER ROUND and never "
        "pooled, because every gaze measure is rate-dependent. RIGHT, "
        "frequency: departures beyond 10 degrees per minute on the same device-forward "
        "baseline, LOWER on the boring film - Wilcoxon "
        "signed-rank, Round 1 n=8, Boring<Clinical 7/8 Holm p=0.047 rb=-0.889 and Boring<Interesting "
        "7/8 Holm p=0.047 rb=-0.944, the FIRST gaze result in this study to survive correction. "
        "Read together: fewer but longer departures when bored, frequent short repositioning when "
        "engaged. That is the measurable form of the distinction between a zombie stare and "
        f"engaged focus.{_mix} Round 1 circles, Round 2 triangles; Round 2 n=4 is DESCRIPTIVE and its "
        "Wilcoxon floor is p=0.125. Not poolable across rounds - every gaze measure is "
        f"rate-dependent, so the rounds are drawn together but never merged. {EYE_IN_HEAD}")
    return _save(fig, ("cross-cutting", "gaze-amplitude-vs-frequency"), pd.DataFrame(rows), cap)


# ---------------------------------------------------------------------------
def degrees_by_film(ctx):
    """Per-participant angular deviation, median with the p90 reach above it."""
    gz = _prim(ctx["gz"])
    med, p90 = _tab(gz, "gaze_deg_median"), _tab(gz, "gaze_deg_p90")
    subs = [s for s in C.ALL_SUBJECTS if s in med.index]
    fig, ax = plt.subplots(figsize=(11.5, 5.0))
    w = 0.26
    for j, stim in enumerate(C.STIMULI):
        x = np.arange(len(subs)) + (j - 1) * w
        m = med.loc[subs, stim].values
        hi = p90.loc[subs, stim].values
        ax.bar(x, m, width=w, color=_c(stim), label=C.STIM_LONG[stim], zorder=2)
        ax.vlines(x, m, hi, color="#333333", lw=1.0, zorder=3)
        ax.scatter(x, hi, s=9, color="#333333", zorder=4)
    ax.set_xticks(np.arange(len(subs)))
    ax.set_xticklabels(subs, fontsize=8)
    ax.set_ylabel("degrees off device forward")
    ax.axvline(7.5, color="#666666", ls=":", lw=1.0)
    ax.text(7.6, ax.get_ylim()[1] * 0.96, "Round 2", fontsize=7.5, va="top")
    ax.legend(fontsize=8)
    ax.grid(axis="y", alpha=0.25)
    ax.set_title("How far the eye sits from center, per participant and film "
                 "(bar = median, whisker to the 90th percentile)", fontsize=10.5)
    fig.tight_layout()

    data = med.reset_index().melt(id_vars="subject", var_name="stimulus",
                                  value_name="gaze_deg_median").merge(
        p90.reset_index().melt(id_vars="subject", var_name="stimulus",
                               value_name="gaze_deg_p90"), on=["subject", "stimulus"])
    cap = (
        "Angular deviation from the round's own device-forward axis, in degrees, on the fixed-"
        "forward baseline that restores the published definition. Bar is the median over the "
        "episode and the whisker reaches the 90th percentile, because a single middle value "
        "cancels symmetric swinging: one participant's boring film swings 164 degrees "
        "horizontally and still has a median vector 1.7 degrees off center. Round 1 uses the "
        "Unreal convention (X forward) and Round 2 the Unity convention (Z forward); a single "
        "hard-coded forward direction would give Round 1 a meaningless ~90 degree offset on "
        "every cell. Descriptive figure - the tests are in the amplitude/frequency figure and "
        f"the forest plot. Round 2 n=4 is DESCRIPTIVE. {EYE_IN_HEAD}")
    return _save(fig, ("cross-cutting", "gaze-degrees-by-film"), data, cap)


# ---------------------------------------------------------------------------
def baselines(ctx):
    """The same measure under all three references, so the choice is visible."""
    gz = ctx["gz"]
    fig, axes = plt.subplots(1, 3, figsize=(12.5, 4.6), sharey=True)
    rows = []
    for ax, b in zip(axes, ("forward", "file", "subject")):
        t = _tab(_prim(gz, b), "gaze_deg_median")
        for sid, r in t.iterrows():
            ax.plot(range(3), r.values, "-", color="#999999", lw=0.9, alpha=0.7, zorder=1)
            for j, stim in enumerate(C.STIMULI):
                ax.scatter(j, r[stim], color=_c(stim),
                           marker=C.ROUND_MARKER[_round_of(sid)], s=38, zorder=3,
                           edgecolor="white", linewidth=0.5)
                rows.append(dict(baseline=b, subject=sid, stimulus=stim, value=r[stim]))
        ok = t.dropna()
        ax.plot(range(3), t.median().values, "-", color="#111111", lw=2.2, zorder=4)
        ax.set_xticks(range(3))
        ax.set_xticklabels([C.STIM_LONG[s] for s in C.STIMULI], fontsize=8)
        ax.set_title(f"{b}\nBoring furthest: {int((ok.BOR > ok.CLC).sum())}/{len(ok)} vs CLC, "
                     f"{int((ok.BOR > ok.INT).sum())}/{len(ok)} vs INT", fontsize=9)
        ax.grid(axis="y", alpha=0.25)
    axes[0].set_ylabel("median degrees off the reference")
    fig.suptitle("The reference matters: the same measure under three baselines", fontsize=11.5)
    fig.tight_layout()

    cap = (
        "The same angular deviation computed against three references, reported side by side so "
        "the choice is made in the open rather than buried. FORWARD is the round's own device "
        "axis and restores the published definition (`1 - X`, i.e. 1 - cos theta). FILE is each "
        "cell's own median gaze direction, which the 2026 reimplementation substituted and which "
        "removes any sustained posture by construction, since the reference moves with the "
        "participant. SUBJECT is one median per participant across their three films, preserving "
        "individual headset seating while still exposing between-film drift. Reported against the "
        "analyst's own prediction: the faithful restoration is not automatically the better "
        "instrument, and on the criterion test the FORWARD baseline does not survive at all. "
        "RULED 2026-08-04, REVISED 2026-08-05 (D-12): NEITHER baseline is primary; each is "
        "assigned to the question it answers, and every gaze result in this analysis names "
        f"the baseline it was computed on. STIMULUS SEPARATION -> "
        f"{X.GAZE_BASELINE_ASSIGNMENT['separation'].upper()}. AGREEMENT WITH SELF-REPORT -> "
        f"{X.GAZE_BASELINE_ASSIGNMENT['criterion'].upper()}, with the "
        f"{X.GAZE_BASELINE_ASSIGNMENT['alongside']} reported alongside it. "
        f"{X.GAZE_BASELINE_WHY} The per-participant baseline was computed for this figure "
        "from v3 onward and was scored against self-report for the first time in the v5 pass "
        f"(X-06), where it is the strongest criterion channel in the study. {EYE_IN_HEAD}")
    return _save(fig, ("cross-cutting", "gaze-baselines"), pd.DataFrame(rows), cap)


# ---------------------------------------------------------------------------
def swing_vs_offset(ctx):
    """Two physically different behaviors that summary statistics conflate."""
    gz = _prim(ctx["gz"])
    fig, ax = plt.subplots(figsize=(8.6, 6.4))
    for _, r in gz.iterrows():
        ax.scatter(r.gaze_horiz_range_deg, r.gaze_vert_median_deg, color=_c(r.stimulus),
                   marker=C.ROUND_MARKER[int(r["round"])], s=58, zorder=3,
                   edgecolor="white", linewidth=0.7)
    for _, r in gz[gz.stimulus == "BOR"].iterrows():
        ax.annotate(r.subject, (r.gaze_horiz_range_deg, r.gaze_vert_median_deg),
                    fontsize=6.8, xytext=(4, 3), textcoords="offset points", color="#333333")
    ax.axhline(0, color="#666666", lw=0.9, ls="--")
    ax.set_xlabel("horizontal swing: 5th-to-95th percentile range (degrees)")
    ax.set_ylabel("sustained vertical offset: median (degrees, negative = looking down)")
    ax.grid(alpha=0.25)
    handles = [plt.Line2D([], [], marker="s", ls="", color=_c(s), label=C.STIM_LONG[s])
               for s in C.STIMULI]
    handles += [plt.Line2D([], [], marker=C.ROUND_MARKER[r], ls="", color="#555555",
                           label=C.ROUND_LABEL[r]) for r in (1, 2)]
    ax.legend(handles=handles, fontsize=7.5, loc="best")
    ax.set_title("Swinging and sustained offset are different behaviors\n"
                 "(boring-film points labeled)", fontsize=10.5)
    fig.tight_layout()

    cols = ["subject", "stimulus", "round", "gaze_horiz_range_deg", "gaze_vert_median_deg",
            "gaze_deg_median", "gaze_deg_p90"]
    cap = (
        "Each point is one participant-film. The horizontal axis is how widely the eye swings "
        "left and right; the vertical axis is how far it sits above or below center on average, "
        "with negative meaning looking down. The two are independent, and conflating them is what "
        "made the earlier probes contradict each other. A participant far to the RIGHT is "
        "swinging: their median vector can sit almost dead center while they are barely ever "
        "actually looking forward, because symmetric swings cancel in a component-wise median. A "
        "participant far DOWN is holding a sustained posture: a narrow spread around an off-axis "
        "position, which any per-file-recentered measure removes entirely. Neither published "
        "feature separates these - gaze deviation variance sees part of the swinging and is blind "
        "to the offset, and the median vector reports the widest swinger in the cohort as its "
        "quietest cell. Descriptive figure, no test. Round 1 circles, Round 2 triangles; Round 2 "
        f"n=4 is DESCRIPTIVE. {EYE_IN_HEAD}")
    return _save(fig, ("cross-cutting", "gaze-swing-vs-offset"), gz[cols], cap)


# ---------------------------------------------------------------------------
def composites_and_windows(ctx):
    """Composite A against B, and the full crop against the Round-1-matched window."""
    ka, kb, wc = ctx["keystones"], ctx["keystones_b"], ctx["wcmp"]
    cats = ["divergent", "concordant-engaged", "concordant-bored", "reverse"]
    shade = {"divergent": "#D55E00", "concordant-engaged": "#009E73",
             "concordant-bored": "#0072B2", "reverse": "#CC79A7"}
    fig, axes = plt.subplots(1, 2, figsize=(12.0, 4.8))

    ax = axes[0]
    labels, xs = [], []
    for i, stim in enumerate(C.STIMULI):
        for k, (tag, frame) in enumerate((("A", ka), ("B", kb))):
            x = i * 2.4 + k * 0.9
            bottom = 0
            sub = frame[frame.stimulus == stim]
            for cat in cats:
                v = int((sub.category == cat).sum())
                if v:
                    ax.bar(x, v, width=0.8, bottom=bottom, color=shade[cat], zorder=2,
                           label=cat if (i == 0 and k == 0) else None)
                    ax.text(x, bottom + v / 2, str(v), ha="center", va="center",
                            fontsize=7.5, color="white")
                bottom += v
            xs.append(x)
            labels.append(f"{C.STIM_LONG[stim][:4]}\n{tag}")
    ax.set_xticks(xs)
    ax.set_xticklabels(labels, fontsize=7.6)
    ax.set_ylabel("participants (N=12)")
    ax.set_title("Composite A (pupil + closure) vs B (+ gaze)", fontsize=10)
    ax.legend(fontsize=7, loc="upper center", ncol=2)

    ax = axes[1]
    pooled = wc[wc.scope.str.startswith("POOLED")]
    surf = sorted(pooled.surface.unique())
    for i, s in enumerate(surf):
        for k, win in enumerate(sorted(pooled.window.unique())):
            r = pooled[(pooled.surface == s) & (pooled.window == win)]
            if not len(r):
                continue
            r = r.iloc[0]
            x = i * 2.0 + k * 0.8
            ax.bar(x, -np.log10(max(r.friedman_p, 1e-6)), width=0.7,
                   color="#0072B2" if win == "full" else "#E69F00", zorder=2,
                   label=win if i == 0 else None)
            ax.text(x, -np.log10(max(r.friedman_p, 1e-6)) + 0.06, f"{r.friedman_p:.3g}",
                    ha="center", fontsize=7)
    ax.axhline(-np.log10(0.05), color="#444444", ls="--", lw=1.0)
    ax.text(0.02, -np.log10(0.05) + 0.06, "alpha = 0.05", fontsize=7, transform=ax.get_yaxis_transform())
    ax.set_xticks([i * 2.0 + 0.4 for i in range(len(surf))])
    ax.set_xticklabels(surf, fontsize=8)
    ax.set_ylabel("-log10 Friedman p  (higher = stronger)")
    ax.set_title("Round 2 window: full crop vs Round-1-matched", fontsize=10)
    ax.legend(fontsize=7.5)
    fig.tight_layout()

    data = pd.concat([ka.assign(composite="A"), kb.assign(composite="B")], ignore_index=True)
    cap = (
        "LEFT: the per-participant decomposition on all three films under both composites. "
        f"Composite A is the mean within-subject z of "
        f"{' and '.join(lab for _, lab, _ in X.COMPOSITE_CHANNELS)} - the "
        f"{len(X.COMPOSITE_CHANNELS)} "
        "surfaces that survive Holm correction, both computed from raw per-sample data rather "
        "than taken from a vendor index. Composite B adds the rebuilt gaze amplitude, entering "
        "with sign -1 because more deviation means less engaged. A is the cleaner instrument on "
        "the clinical film (8 divergent, and zero cases in either off-diagonal cell, against "
        "B's 7/3/1/1), so the hypothesis that adding gaze would strengthen the keystone is NOT "
        "supported even though gaze is the best single channel against self-report. Composite B "
        "is within-round only: every gaze measure is rate-dependent and cannot be pooled. "
        "Category counts, N=12, DESCRIPTIVE - no omnibus test is run on them. RIGHT: the Round 2 "
        "window as a sensitivity check. Round 1's window is the middle ~13.6 minutes of the "
        "17-minute film, roughly two minutes having been cut inside each 30 s instructed closure "
        "as a sync guard; Round 2's crop is essentially the whole film. Eye closure is "
        "WINDOW-INVARIANT, identical either way. Pupil is CLEANER on the matched window "
        "(Friedman p 0.097 -> 0.017, direction 10/12 -> 11/12), because trimming removes the "
        "settling-in and wind-down. Friedman omnibus, pooled N=12.")
    return _save(fig, ("cross-cutting", "composites-and-windows"), data, cap)


# ---------------------------------------------------------------------------
def criterion_appendix(ctx):
    """Spearman against Pearson, and analytic p against permutation p."""
    d = ctx["crit_pooled"].dropna(subset=["rho", "pearson_r"]).copy()
    fig, axes = plt.subplots(1, 2, figsize=(11.5, 5.0))

    ax = axes[0]
    lim = 0.75
    ax.plot([-lim, lim], [-lim, lim], ls="--", color="#888888", lw=1.0, zorder=1)
    for _, r in d.iterrows():
        mk = "o" if r.criterion == "boredom" else "^"
        col = "#999999" if "APPENDIX" in str(r.note) else "#0072B2"
        ax.scatter(r.rho, r.pearson_r, marker=mk, s=58, color=col, zorder=3,
                   edgecolor="white", linewidth=0.6)
    # label only the points a reader needs to identify: the strong associations, the
    # channel that separates the films but fails here, and the appendix-only channels
    lab = d[(d.criterion == "boredom")
            & ((d.rho.abs() > 0.30) | (d.channel.isin(["pupil dilation", "cognitive load", "HR"])))]
    for _, r in lab.iterrows():
        dy = 7 if r.pearson_r >= 0 else -11
        ax.annotate(r.channel, (r.rho, r.pearson_r), fontsize=6.6, ha="center",
                    xytext=(0, dy), textcoords="offset points", color="#333333")
    ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim)
    ax.set_xlabel("Spearman rho (rank, reported)")
    ax.set_ylabel("Pearson r (linear)")
    ax.grid(alpha=0.25)
    md = float(d.r_minus_rho.abs().median())
    ax.set_title(f"The two coefficients agree\nmedian |r - rho| = {md:.3f}", fontsize=10)

    ax = axes[1]
    y = np.arange(len(d))
    lab = [f"{r.channel[:26]} / {r.criterion[:4]}" for _, r in d.iterrows()]
    ax.hlines(y, d.p_analytic, d.p_perm, color="#BBBBBB", lw=1.6, zorder=1)
    ax.scatter(d.p_analytic, y, s=34, color="#D55E00", zorder=3, label="analytic p (assumes independence)")
    ax.scatter(d.p_perm, y, s=34, color="#0072B2", zorder=3, label="within-subject permutation p")
    ax.axvline(0.05, color="#444444", ls="--", lw=1.0)
    ax.set_xscale("log")
    ax.set_yticks(y); ax.set_yticklabels(lab, fontsize=6.6)
    ax.set_xlabel("p (log scale); dashed line = 0.05")
    ax.legend(fontsize=7, loc="lower right")
    ax.grid(axis="x", alpha=0.25)
    ax.set_title("Clustering inflates every analytic p", fontsize=10)

    fig.suptitle("Criterion validity, appendix: rank against linear, analytic against permutation",
                 fontsize=11.5)
    fig.tight_layout()

    flips = d[(d.p_analytic < 0.05) & (d.p_perm >= 0.05)]
    cap = (
        f"LEFT: Spearman rho against Pearson r for every channel and criterion. Points sitting on "
        f"the dashed identity line mean the rank and linear coefficients agree, i.e. the monotonic "
        f"relationship is also close to linear. Median absolute difference is {md:.3f}. That is why "
        f"Spearman is the reported statistic: where the two agree, the rank test costs almost "
        f"nothing in power, and it is chosen for robustness - no assumption of linearity, and no "
        f"single extreme value able to dominate - rather than to manufacture a result. Circles are "
        f"the boredom criterion, triangles engagement; grey are the APPENDIX-ONLY channels. RIGHT: "
        f"the analytic p from the library against the within-subject permutation p, on a log axis, "
        f"one line per test. EVERY analytic p is too small, by roughly 3-8x, and the inflation "
        f"applies to Pearson exactly as it does to Spearman - so it is a property of the DESIGN, "
        f"not an artifact of ranking. The cause: the 36 paired points are 12 participants "
        f"contributing 3 films each, and within-subject z-scoring makes the dependence structural, "
        f"since forcing three values to mean 0 and sd 1 means knowing two nearly determines the "
        f"third. The permutation null preserves that clustering by shuffling film labels only "
        f"WITHIN each participant. {len(flips)} test(s) cross alpha=0.05 when corrected: "
        f"{'; '.join(f'{r.channel} vs {r.criterion}' for _, r in flips.iterrows()) or 'none'}. "
        f"Both p-values are retained in the sibling CSV for every test.")
    return _save(fig, ("cross-cutting", "criterion-validity-appendix"), ctx["crit_pooled"], cap)


def make_all(ctx):
    return (criterion_appendix(ctx) + criterion_validity(ctx) + amplitude_vs_frequency(ctx) + degrees_by_film(ctx)
            + baselines(ctx) + swing_vs_offset(ctx) + composites_and_windows(ctx))
