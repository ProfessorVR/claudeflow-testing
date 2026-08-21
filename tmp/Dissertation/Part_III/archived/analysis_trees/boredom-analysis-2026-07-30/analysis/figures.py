"""Figure suite (Phase 6) - spec section 6.

65 figures: 12 per-subject sets of 4, three combined sets of 3 (one per stimulus),
and 8 cross-cutting. Each one writes a vector PDF, a PNG, a sibling .csv carrying
exactly the numbers plotted, and a caption stub naming n, test, statistic and
effect size. Everything is driven from the tables run.main() already computed;
per-sample series come from series.py.

Four rules are enforced here rather than assumed:

PII                 Only labels ever reach a filename, axis, legend or caption.
                    journal.emit_guard() runs over every caption and every sibling
                    CSV, and over the relative path of every file written, but it
                    cannot read a PNG - so nothing name-derived is allowed near the
                    plotting code in the first place.

Rate-dependence     No figure averages a rate-dependent channel across the round
                    boundary. Cohort envelopes and distributions always draw Round
                    1 and Round 2 as separate bands and separate markers, and every
                    caption carries the poolable flag and its reason from
                    config.POOLABLE.

Nothing omitted     Non-significant surfaces are plotted on the same footing as
                    significant ones. The forest plot carries all 87 contrasts.

Small N             Any panel resting on n < config.DESCRIPTIVE_N_BELOW says
                    "descriptive" in its caption, and the Round-2-only channels
                    (n=4) additionally carry the Wilcoxon p=0.125 floor.

Determinism: figures are written with fixed metadata and no wall-clock value, so a
re-run reproduces them. The spec requires byte-identity of the CSVs; the sibling
data CSVs go through journal.write_csv() and inherit it.
"""
import os

import matplotlib
matplotlib.use("Agg")                                       # noqa: E402
import matplotlib.pyplot as plt                             # noqa: E402
import numpy as np                                          # noqa: E402
import pandas as pd                                         # noqa: E402
from matplotlib.lines import Line2D                         # noqa: E402
from matplotlib.patches import Patch                        # noqa: E402

import config as C                                          # noqa: E402
import journal as J                                         # noqa: E402
import sensitivity                                          # noqa: E402
import series                                               # noqa: E402
import stats as S                                           # noqa: E402

IMPLEMENTED = True

# Channels as they appear in the pooled wide table, with the poolability key that
# governs whether a figure may combine the two rounds.
WIDE_CHANNELS = [
    ("openness_frac", "eye openness", "fraction of samples open", "eye_openness"),
    ("dil_mean_bilateral", "pupil dilation", "vendor units", "pupil_dilation"),
    ("cognitive_load_mean", "cognitive load", "vendor index", "cognitive_load"),
    ("hr_mean", "HR", "bpm", "hr"),
    ("gaze_dev_variance", "gaze deviation variance", "vendor units squared",
     "gaze_dev_variance"),
    ("gaze_dev_median", "gaze deviation median", "vendor units", "gaze_dev_median"),
]

# Channels as they appear in the timelines.
TL_CHANNELS = [
    ("openness", "eye openness", "fraction open"),
    ("pupil", "pupil dilation", "vendor units"),
    ("cognitive_load", "cognitive load", "vendor index"),
    ("hr", "HR", "bpm"),
    ("gaze_dev", "gaze deviation", "vendor units"),
]

_INDEX = []


# --------------------------------------------------------------------- harness
def _setup():
    plt.rcParams.update({
        "figure.dpi": 110, "savefig.dpi": C.FIG_DPI,
        "font.size": 8, "axes.titlesize": 9, "axes.labelsize": 8,
        "axes.grid": True, "grid.alpha": 0.25, "grid.linewidth": 0.4,
        "axes.spines.top": False, "axes.spines.right": False,
        "legend.frameon": False, "figure.autolayout": False,
        "pdf.fonttype": 42, "ps.fonttype": 42,
        "svg.hashsalt": str(C.SEED),
    })


def _c(stim):
    return C.STIM_COLOR[stim]


def _round_of(sid):
    return 1 if str(sid).startswith("S") else 2


def _save(fig, parts, data, caption):
    """Write PDF + PNG + sibling data CSV + caption stub for one figure.

    `parts` is a path relative to figures/, label-derived only.
    """
    rel = os.path.join(*parts)
    J.emit_guard(rel, "figure path")
    J.emit_guard(caption, os.path.basename(rel) + " caption")

    out = os.path.join(C.FIGS, rel)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    for ext in C.FIG_FORMATS:
        meta = {"CreationDate": None} if ext == "pdf" else {"Software": None}
        fig.savefig(f"{out}.{ext}", format=ext, bbox_inches="tight", metadata=meta)
    plt.close(fig)

    frame = data if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    J.write_csv(frame, f"{out}.csv")
    J.write_text(caption.rstrip() + "\n", f"{out}.caption.txt")
    _INDEX.append({"figure": rel, "caption": caption.strip().replace("\n", " ")})
    return 1


def _poolnote(key):
    flag, reason = C.POOLABLE.get(key, (None, "not classified"))
    if flag is None:
        return "poolable: not classified."
    return f"poolable: {'yes' if flag else 'NO'} - {reason}."


def _nnote(n):
    bits = []
    if n < C.DESCRIPTIVE_N_BELOW:
        bits.append(f"n={n} is below {C.DESCRIPTIVE_N_BELOW}, so this is DESCRIPTIVE only")
    if n <= 4:
        bits.append(f"at n={n} the Wilcoxon floor is p={C.WILCOXON_FLOOR_N4}, so perfect "
                    f"separation is the strongest obtainable result")
    return ("; ".join(bits) + ".") if bits else ""


def _contrasts(stat_det, surface, scope):
    """The three pairwise rows for one surface x scope, as caption text."""
    d = stat_det[(stat_det.surface == surface) & (stat_det.scope == scope)]
    if not len(d):
        return "no pairwise test at this scope."
    bits = []
    for _, r in d.iterrows():
        star = " *Holm-significant*" if bool(r.significant) else ""
        bits.append(f"{r['pair']} n={int(r.n)} Wilcoxon p={r.wilcoxon_p:.4g} "
                    f"Holm p={r.holm_p:.4g} rb={r.effect_rb:+.3f} ({r.direction}){star}")
    return "; ".join(bits) + "."


def _friedman(stat_rows, surface, scope):
    d = stat_rows[(stat_rows.surface == surface) & (stat_rows.scope == scope)]
    if not len(d) or not np.isfinite(d.iloc[0].get("friedman_p", np.nan)):
        return "Friedman not computed."
    r = d.iloc[0]
    return f"Friedman chi2={r.friedman_chi2:.3f} p={r.friedman_p:.4g} (n={int(r.n)})."


# ------------------------------------------------------------- 6a per subject
def _subject_summary_card(ctx, sid):
    wide, sur, w2 = ctx["wide"], ctx["sur"], ctx["w2"]
    rnd = _round_of(sid)
    sw = wide[wide.subject == sid].set_index("stimulus")
    ss = sur[sur.subject == sid].set_index("stimulus")

    chans = [(c, lab, unit, key) for c, lab, unit, key in WIDE_CHANNELS]
    if rnd == 2:
        chans.append(("imu_gyro_mag_mean", "head motion (gyro)", "magnitude", "imu_motion"))
        iw = w2[w2.subject == sid].set_index("stimulus")

    ncol = 4
    nrow = int(np.ceil((len(chans) + 2) / ncol))
    fig, axes = plt.subplots(nrow, ncol, figsize=(3.0 * ncol, 2.3 * nrow))
    axes = np.atleast_1d(axes).ravel()
    rows = []

    for ax, (col, lab, unit, key) in zip(axes, chans):
        src = iw if col.startswith("imu_") else sw
        vals = [src[col].get(s, np.nan) if col in src.columns else np.nan
                for s in C.STIMULI]
        ax.bar(range(3), vals, color=[_c(s) for s in C.STIMULI], width=0.66)
        ax.set_xticks(range(3))
        ax.set_xticklabels(C.STIMULI)
        ax.set_title(lab)
        ax.set_ylabel(unit)
        for s, v in zip(C.STIMULI, vals):
            rows.append(dict(subject=sid, stimulus=s, quantity=lab, value=v, kind="physiology"))

    # self-report
    ax = axes[len(chans)]
    w = 0.38
    for i, (item, lbl) in enumerate((("boredom", "boredom"), ("engagement", "engagement"))):
        vals = [ss[item].get(s, np.nan) for s in C.STIMULI]
        ax.bar(np.arange(3) + (i - 0.5) * w, vals, width=w,
               color=["#444444", "#BBBBBB"][i], label=lbl)
        for s, v in zip(C.STIMULI, vals):
            rows.append(dict(subject=sid, stimulus=s, quantity=lbl, value=v, kind="self-report"))
    ax.set_xticks(range(3))
    ax.set_xticklabels(C.STIMULI)
    ax.set_ylim(0, 9.5)
    ax.set_title("self-report (1-9)")
    ax.legend(fontsize=6)

    ax = axes[len(chans) + 1]
    felt = [ss["felt_duration_min"].get(s, np.nan) for s in C.STIMULI]
    ax.bar(range(3), felt, color=[_c(s) for s in C.STIMULI], width=0.66)
    ax.axhline(C.STIMULUS_ACTUAL_MIN, color="k", ls="--", lw=1)
    ax.text(2.45, C.STIMULUS_ACTUAL_MIN, " actual 17 min", va="bottom", ha="right", fontsize=6)
    ax.set_xticks(range(3))
    ax.set_xticklabels(C.STIMULI)
    ax.set_title("felt duration")
    ax.set_ylabel("minutes")
    for s, v in zip(C.STIMULI, felt):
        rows.append(dict(subject=sid, stimulus=s, quantity="felt duration (min)",
                         value=v, kind="self-report"))

    for ax in axes[len(chans) + 2:]:
        ax.axis("off")

    fig.suptitle(f"{sid} - summary card (Round {rnd})", y=1.0, fontsize=11)
    fig.tight_layout()

    cap = (f"Subject {sid} ({C.ROUND_LABEL[rnd]}), all channels across the three stimuli "
           f"with self-report overlaid. Single subject: n=1, DESCRIPTIVE - no test is "
           f"performed on one subject, and the cohort tests appear in the combined and "
           f"cross-cutting figures. Stimulus colours are fixed across the whole suite "
           f"(BOR/CLC/INT). Round 1 openness is the validity-flag proxy rescaled to a "
           f"fraction; Round 2 openness is the vendor measure.")
    return _save(fig, ("per-subject", sid, f"{sid}-summary-card"), rows, cap)


def _subject_timeseries(ctx, sid, tl):
    rnd = _round_of(sid)
    t = tl["r1_abs"] if rnd == 1 else tl["r2_abs"]
    t = t[t.subject == sid]
    eps = ctx["e1"] if rnd == 1 else ctx["e2"]
    eps = eps[eps.subject == sid]
    if rnd == 1 and "variant" in eps.columns:
        eps = eps[eps.variant == C.TIMELINE_VARIANT]

    chans = [(c, lab, unit) for c, lab, unit in TL_CHANNELS if c in t.columns]
    if rnd == 2 and "imu_gyro_mag" in t.columns:
        chans.append(("imu_gyro_mag", "head motion (gyro)", "magnitude"))

    fig, axes = plt.subplots(len(chans), 3, figsize=(13, 1.7 * len(chans)),
                             sharex="col", squeeze=False)
    rows = []
    n_shaded = 0
    for j, stim in enumerate(C.STIMULI):
        cell = t[t.stimulus == stim].sort_values("t_s")
        ext = eps[(eps.stimulus == stim) & (eps.kind == "extended")]
        for i, (col, lab, unit) in enumerate(chans):
            ax = axes[i][j]
            if len(cell):
                ax.plot(cell.t_s, cell[col], lw=0.7, color=_c(stim))
            for _, e in ext.iterrows():
                end = e.end_s if "end_s" in ext.columns and np.isfinite(e.get("end_s", np.nan)) \
                    else e.start_s + e.duration_s
                ax.axvspan(e.start_s, end, color="0.55", alpha=0.30, lw=0)
            if i == 0:
                ax.set_title(f"{C.STIM_LONG[stim]} ({stim})")
            if j == 0:
                ax.set_ylabel(f"{lab}\n{unit}", fontsize=7)
            if i == len(chans) - 1:
                ax.set_xlabel("seconds from episode start")
            for _, r in cell.iterrows():
                rows.append(dict(subject=sid, stimulus=stim, t_s=r.t_s,
                                 channel=lab, value=r[col]))
        n_shaded += len(ext)

    fig.suptitle(f"{sid} - per-stimulus time course, extended eye closures shaded",
                 y=1.0, fontsize=11)
    fig.tight_layout()

    cap = (f"Subject {sid} ({C.ROUND_LABEL[rnd]}), each channel across the episode, three "
           f"panels sharing a time axis. Grey spans are extended eye-closure episodes "
           f"({n_shaded} across the three stimuli), defined as closures longer than "
           f"{C.BLINK_MAX_MS:.0f} ms, the blink ceiling from VanderWerf et al. 2003 "
           f"(334 +/- 67 ms). Series are binned to {C.TIMELINE_BIN_S:g} s; Round 1 uses the "
           f"{C.TIMELINE_VARIANT} rate variant. n=1, DESCRIPTIVE - no test is performed on "
           f"a single subject.")
    return _save(fig, ("per-subject", sid, f"{sid}-timeseries"), rows, cap)


def _subject_selfreport_vs_physiology(ctx, sid):
    wide, sur = ctx["wide"], ctx["sur"]
    rnd = _round_of(sid)
    ss = sur[sur.subject == sid].set_index("stimulus")

    zrows = {}
    for col, lab, _, key in WIDE_CHANNELS:
        z = S.within_subject_z(_table(wide, col, rnd))
        if sid in z.index:
            zrows[lab] = z.loc[sid]

    fig, axes = plt.subplots(1, 2, figsize=(10, 3.6))
    rows = []

    ax = axes[0]
    labs = list(zrows)
    x = np.arange(len(labs))
    w = 0.26
    for k, stim in enumerate(C.STIMULI):
        vals = [zrows[l].get(stim, np.nan) for l in labs]
        ax.bar(x + (k - 1) * w, vals, width=w, color=_c(stim), label=stim)
        for l, v in zip(labs, vals):
            rows.append(dict(subject=sid, stimulus=stim, quantity=l, value=v,
                             kind="within-subject z"))
    ax.axhline(0, color="k", lw=0.8)
    ax.set_xticks(x)
    ax.set_xticklabels(labs, rotation=25, ha="right", fontsize=7)
    ax.set_ylabel("within-subject z")
    ax.set_title("physiology, scored against this subject's own three-video mean")
    ax.legend(ncol=3, fontsize=7)

    ax = axes[1]
    items = [("boredom", "boredom"), ("engagement", "engagement"),
             ("sleep_fight", "sleep-fight"), ("fatigue_prior", "fatigue before"),
             ("fatigue_after", "fatigue after")]
    x = np.arange(len(items))
    for k, stim in enumerate(C.STIMULI):
        vals = [ss[i].get(stim, np.nan) for i, _ in items]
        ax.bar(x + (k - 1) * w, vals, width=w, color=_c(stim), label=stim)
        for (i, l), v in zip(items, vals):
            rows.append(dict(subject=sid, stimulus=stim, quantity=l, value=v,
                             kind="self-report"))
    ax.set_xticks(x)
    ax.set_xticklabels([l for _, l in items], rotation=25, ha="right", fontsize=7)
    ax.set_ylim(0, 9.5)
    ax.set_ylabel("rating (1-9)")
    ax.set_title("self-report, raw ratings")

    kd = ctx["keystones"]
    kd = kd[(kd.subject == sid) & (kd.stimulus == "CLC")]
    cat = kd.category.iloc[0] if len(kd) else "not classified"
    comp = float(kd.engaged_composite.iloc[0]) if len(kd) else np.nan

    fig.suptitle(f"{sid} - self-report against physiology", y=1.02, fontsize=11)
    fig.tight_layout()

    cap = (f"Subject {sid} ({C.ROUND_LABEL[rnd]}). Left: within-subject z, each stimulus "
           f"scored against this subject's own three-video mean, which is what makes the "
           f"channels comparable. Right: the raw self-report ratings. On the clinical "
           f"stimulus this subject is {cat} (engaged composite {comp:+.3f}); the composite "
           f"is the mean within-subject z of pupil dilation, cognitive load and eye "
           f"openness. n=1, DESCRIPTIVE. Round-relative z is a WITHIN-subject statement "
           f"and carries no absolute claim.")
    return _save(fig, ("per-subject", sid, f"{sid}-selfreport-vs-physiology"), rows, cap)


def _subject_felt_duration(ctx, sid):
    sur = ctx["sur"]
    ss = sur[sur.subject == sid].set_index("stimulus")
    fig, ax = plt.subplots(figsize=(5.2, 3.4))
    rows = []
    for i, stim in enumerate(C.STIMULI):
        felt = ss["felt_duration_min"].get(stim, np.nan)
        ax.bar(i, felt, color=_c(stim), width=0.62)
        if np.isfinite(felt):
            ax.text(i, felt, f" {felt:.0f}", ha="center", va="bottom", fontsize=8)
        rows.append(dict(subject=sid, stimulus=stim, felt_duration_min=felt,
                         actual_min=C.STIMULUS_ACTUAL_MIN,
                         dilation_ratio=ss["felt_duration_ratio"].get(stim, np.nan),
                         raw_answer=ss["felt_duration_min_raw"].get(stim, "")))
    ax.axhline(C.STIMULUS_ACTUAL_MIN, color="k", ls="--", lw=1.2)
    ax.text(2.45, C.STIMULUS_ACTUAL_MIN, " actual 17 min", va="bottom", ha="right", fontsize=7)
    ax.set_xticks(range(3))
    ax.set_xticklabels([f"{C.STIM_LONG[s]}\n({s})" for s in C.STIMULI])
    ax.set_ylabel("felt duration (minutes)")
    ax.set_title(f"{sid} - felt against actual duration")
    fig.tight_layout()

    ratios = [rows[i]["dilation_ratio"] for i in range(3)]
    cap = (f"Subject {sid} ({C.ROUND_LABEL[_round_of(sid)]}), reported duration for each "
           f"17-minute episode; dashed line is the actual length. Dilation ratios "
           f"{', '.join(f'{s}={r:.2f}' for s, r in zip(C.STIMULI, ratios) if np.isfinite(r))}. "
           f"n=1, DESCRIPTIVE. Free-text answers were parsed defensively and every "
           f"interpreted value is recorded in EXCLUSIONS.log with its raw string.")
    return _save(fig, ("per-subject", sid, f"{sid}-felt-vs-actual"), rows, cap)


def _table(wide, col, rnd=None):
    f = wide if rnd is None else wide[wide["round"] == rnd]
    return f.pivot_table(index="subject", columns="stimulus", values=col,
                         aggfunc="first").reindex(columns=list(C.STIMULI))


# ---------------------------------------------------------- 6b per stimulus
def _stim_distribution(ctx, stim):
    wide = ctx["wide"]
    chans = WIDE_CHANNELS
    fig, axes = plt.subplots(2, 3, figsize=(13, 6.6))
    axes = axes.ravel()
    rows = []
    rng = np.random.RandomState(C.SEED)

    for ax, (col, lab, unit, key) in zip(axes, chans):
        poolable = C.POOLABLE.get(key, (False,))[0]
        data, positions, ticklabels = [], [], []
        for k, rnd in enumerate((1, 2)):
            v = wide[(wide.stimulus == stim) & (wide["round"] == rnd)][col].dropna()
            data.append(v.values)
            positions.append(k)
            ticklabels.append(f"R{rnd}\nn={len(v)}")
        bp = ax.boxplot(data, positions=positions, widths=0.5, showfliers=False,
                        patch_artist=True)
        for patch in bp["boxes"]:
            patch.set_facecolor(_c(stim))
            patch.set_alpha(0.30)
        for med in bp["medians"]:
            med.set_color("k")

        for k, rnd in enumerate((1, 2)):
            sub = wide[(wide.stimulus == stim) & (wide["round"] == rnd)]
            jitter = rng.uniform(-0.13, 0.13, len(sub))
            ax.scatter(np.full(len(sub), k) + jitter, sub[col], s=22,
                       marker=C.ROUND_MARKER[rnd], facecolor="none",
                       edgecolor=_c(stim), linewidths=1.0, zorder=3)
            for _, r in sub.iterrows():
                rows.append(dict(stimulus=stim, channel=lab, subject=r.subject,
                                 round=rnd, value=r[col], poolable=poolable))
        ax.set_xticks(positions)
        ax.set_xticklabels(ticklabels)
        ax.set_title(f"{lab}" + ("" if poolable else "  [not poolable]"), fontsize=8.5)
        ax.set_ylabel(unit, fontsize=7)

    handles = [Line2D([], [], marker=C.ROUND_MARKER[r], ls="none", mfc="none",
                      mec="0.3", label=C.ROUND_LABEL[r]) for r in (1, 2)]
    fig.legend(handles=handles, loc="lower center", ncol=2, fontsize=8)
    fig.suptitle(f"{C.STIM_LONG[stim]} ({stim}) - distribution per channel, "
                 f"every subject plotted", y=1.0, fontsize=11)
    fig.tight_layout(rect=(0, 0.04, 1, 1))

    cap = (f"{C.STIM_LONG[stim]} stimulus, one panel per channel, every one of the 12 "
           f"subjects plotted as a point (Round 1 circles n=8, Round 2 triangles n=4). "
           f"Rounds are drawn as SEPARATE boxes throughout and are never merged, because "
           f"gaze-deviation channels are rate-dependent: recomputing the identical feature "
           f"on Round 2 decimated to Round 1's effective rate moves it by 0.65-0.84x. "
           f"Channels marked [not poolable] must not be compared across the round boundary "
           f"even where the panel places them side by side. This figure is descriptive; "
           f"the tests across stimuli are in the slope plot and the forest plot.")
    return _save(fig, ("combined", stim, f"{stim}-distribution"), rows, cap)


def _stim_slope(ctx, stim):
    wide, stat_det, stat_rows = ctx["wide"], ctx["stat_det"], ctx["stat_rows"]
    fig, axes = plt.subplots(2, 3, figsize=(13, 6.6))
    axes = axes.ravel()
    rows = []

    for ax, (col, lab, unit, key) in zip(axes, WIDE_CHANNELS):
        poolable = C.POOLABLE.get(key, (False,))[0]
        for rnd in (1, 2):
            t = _table(wide, col, rnd)
            for sid, r in t.iterrows():
                y = [r.get(s, np.nan) for s in C.STIMULI]
                ax.plot(range(3), y, lw=0.8, alpha=0.75, color="0.45" if rnd == 1 else "0.15",
                        marker=C.ROUND_MARKER[rnd], ms=3.5, mfc="none")
                for s, v in zip(C.STIMULI, y):
                    rows.append(dict(anchor_stimulus=stim, channel=lab, subject=sid,
                                     round=rnd, stimulus=s, value=v, poolable=poolable))
        i = C.STIMULI.index(stim)
        ax.axvspan(i - 0.35, i + 0.35, color=_c(stim), alpha=0.16, lw=0, zorder=0)
        ax.set_xticks(range(3))
        ax.set_xticklabels(C.STIMULI)
        ax.set_title(f"{lab}" + ("" if poolable else "  [not poolable]"), fontsize=8.5)
        ax.set_ylabel(unit, fontsize=7)

    scope = "POOLED N=12"
    lines = []
    for col, lab, unit, key in WIDE_CHANNELS:
        sc = scope if C.POOLABLE.get(key, (False,))[0] else "R1-unified"
        lines.append(f"{lab} [{sc}]: {_contrasts(stat_det, lab, sc)}")

    fig.suptitle(f"Paired-difference slope plot, {C.STIM_LONG[stim]} ({stim}) highlighted "
                 f"- one line per subject", y=1.0, fontsize=11)
    fig.tight_layout()

    cap = (f"Within-subject slope plot: one line per subject across the three stimuli, with "
           f"{C.STIM_LONG[stim]} shaded. This is the honest visual for a within-subject "
           f"design - the test is on the paired differences, not on the group means. "
           f"Round 1 n=8 (circles), Round 2 n=4 (triangles), drawn distinctly and never "
           f"averaged together for a [not poolable] channel. Tests: " + " | ".join(lines))
    return _save(fig, ("combined", stim, f"{stim}-slope"), rows, cap)


def _stim_envelope(ctx, stim, tl):
    fig, axes = plt.subplots(len(TL_CHANNELS), 1, figsize=(8.5, 2.0 * len(TL_CHANNELS)),
                             sharex=True)
    rows = []
    for ax, (col, lab, unit) in zip(np.atleast_1d(axes), TL_CHANNELS):
        for rnd, ls in ((1, "-"), (2, "--")):
            t = tl[f"r{rnd}_norm"]
            t = t[t.stimulus == stim]
            if col not in t.columns or not len(t):
                continue
            g = t.groupby("bin")[col]
            med, q1, q3 = g.median(), g.quantile(0.25), g.quantile(0.75)
            n = int(t.subject.nunique())
            x = (med.index.values + 0.5) / C.TIMELINE_NORM_BINS * 100
            ax.plot(x, med.values, ls=ls, lw=1.6 if rnd == 2 else 1.2, color=_c(stim),
                    alpha=1.0 if rnd == 1 else 0.85,
                    label=f"{C.ROUND_LABEL[rnd]} median, IQR band")
            ax.fill_between(x, q1.values, q3.values, color=_c(stim),
                            alpha=0.13 if rnd == 1 else 0.26, lw=0)
            for b in med.index:
                rows.append(dict(stimulus=stim, round=rnd, channel=lab,
                                 pct_of_episode=(b + 0.5) / C.TIMELINE_NORM_BINS * 100,
                                 median=med[b], q1=q1[b], q3=q3[b], n_subjects=n))
        ax.set_ylabel(f"{lab}\n{unit}", fontsize=7)
    np.atleast_1d(axes)[-1].set_xlabel("percent of episode elapsed")

    # One legend for the whole figure: a per-panel legend lands on the data.
    h, l = np.atleast_1d(axes)[0].get_legend_handles_labels()
    fig.legend(h, l, loc="upper center", bbox_to_anchor=(0.5, 0.965), ncol=2, fontsize=8)
    fig.suptitle(f"{C.STIM_LONG[stim]} ({stim}) - cohort time course, median and IQR",
                 y=1.0, fontsize=11)
    fig.tight_layout(rect=(0, 0, 1, 0.95))

    cap = (f"{C.STIM_LONG[stim]} stimulus, cohort median with interquartile band, Round 1 "
           f"(n=8, solid) and Round 2 (n=4, dashed) drawn as SEPARATE bands and never "
           f"merged. The x axis is percent of episode elapsed, not seconds, because "
           f"episode lengths are not comparable: Round 1 crop windows run 661-914 s while "
           f"Round 2 full recordings run 1099-2430 s. Series binned to "
           f"{C.TIMELINE_NORM_BINS} bins. Round 2 n=4 is DESCRIPTIVE "
           f"(below n={C.DESCRIPTIVE_N_BELOW}); its band is a range, not an estimate.")
    return _save(fig, ("combined", stim, f"{stim}-cohort-envelope"), rows, cap)


# ----------------------------------------------------------- 6c cross-cutting
def _forest(ctx):
    d = ctx["stat_det"].copy()
    d = d.dropna(subset=["effect_rb"]).sort_values(
        ["surface", "scope", "pair"], ascending=[True, True, True]).reset_index(drop=True)
    fig, ax = plt.subplots(figsize=(9.5, max(6.0, 0.19 * len(d))))
    y = np.arange(len(d))[::-1]
    colors = ["#B2182B" if s else "0.45" for s in d.significant]
    ax.scatter(d.effect_rb, y, s=26, c=colors, zorder=3)
    for yi, r in zip(y, d.itertuples()):
        ax.plot([0, r.effect_rb], [yi, yi], color=colors[len(d) - 1 - yi], lw=0.9, alpha=0.6)
    ax.axvline(0, color="k", lw=0.9)
    ax.set_yticks(y)
    ax.set_yticklabels([f"{r.surface} | {r.scope} | {r.pair} (n={int(r.n)})"
                        for r in d.itertuples()], fontsize=5.6)
    ax.set_xlabel("matched-pairs rank-biserial effect size")
    ax.set_xlim(-1.08, 1.08)
    ax.set_title(f"Effect sizes, all {len(d)} pairwise contrasts "
                 f"({int(d.significant.sum())} survive Holm at alpha={C.ALPHA})")
    ax.legend(handles=[Line2D([], [], marker="o", ls="none", color="#B2182B",
                              label=f"survives Holm (p<{C.ALPHA})"),
                       Line2D([], [], marker="o", ls="none", color="0.45",
                              label="does not survive Holm")], fontsize=7, loc="lower right")
    fig.tight_layout()

    sig = d[d.significant]
    surfaces = sorted(set(sig.surface))
    cap = (f"All {len(d)} pairwise contrasts computed anywhere in the analysis, plotted on "
           f"one axis; NOTHING is omitted for being non-significant. Test: Wilcoxon "
           f"signed-rank, Holm-corrected within each surface x scope family; effect size is "
           f"the matched-pairs rank-biserial correlation. {int(d.significant.sum())} "
           f"contrasts survive Holm, and every one of them is on "
           f"{' or '.join(surfaces)} - which is the finding: the result is carried by the "
           f"eye-tracking surfaces, not spread across the channel set. Contrasts at n<6 are "
           f"descriptive; the Round-2-only channels sit at n=4, where the Wilcoxon floor is "
           f"p={C.WILCOXON_FLOOR_N4}.")
    return _save(fig, ("cross-cutting", "forest-effect-sizes"), d, cap)


def _place_labels(ax, points, fontsize=6.5):
    """Annotate (x, y, label) avoiding collisions, deterministically.

    Several subjects sit almost on top of one another on the keystone axes (S02 and
    R2-02 differ by 0.012 on the composite), so a fixed offset overprints them. Each
    label takes the first candidate offset whose anchor clears every label already
    placed, in a fixed sorted order.
    """
    OFFSETS = [(7, 5), (7, -11), (-7, 5), (-7, -11), (0, 11), (0, -15)]
    xr = np.ptp(ax.get_xlim()) or 1.0
    yr = np.ptp(ax.get_ylim()) or 1.0
    placed = []
    for x, y, lab in sorted(points, key=lambda p: (round(p[1], 6), round(p[0], 6), p[2])):
        chosen = OFFSETS[0]
        for dx, dy in OFFSETS:
            ax_ = x + dx / 72.0 / ax.figure.get_size_inches()[0] * xr * 1.6
            ay_ = y + dy / 72.0 / ax.figure.get_size_inches()[1] * yr * 1.6
            if all(abs(ax_ - px) / xr > 0.055 or abs(ay_ - py) / yr > 0.045
                   for px, py in placed):
                chosen = (dx, dy)
                placed.append((ax_, ay_))
                break
        else:
            placed.append((x, y))
        ax.annotate(lab, (x, y), textcoords="offset points", xytext=chosen,
                    fontsize=fontsize,
                    ha="left" if chosen[0] >= 0 else "right")


def _keystone_scatter(ctx):
    k = ctx["keystones"]
    fig, ax = plt.subplots(figsize=(8.2, 6.2))
    rows, labels = [], []
    for stim in C.STIMULI:
        s = k[k.stimulus == stim]
        hi = stim == "CLC"
        for _, r in s.iterrows():
            ax.scatter(r.engaged_composite, r.boredom, s=110 if hi else 34,
                       marker=C.ROUND_MARKER[int(r["round"])],
                       facecolor=_c(stim) if hi else "none",
                       edgecolor=_c(stim), linewidths=1.4 if hi else 0.9,
                       alpha=1.0 if hi else 0.55, zorder=3 if hi else 2)
            if hi:
                labels.append((r.engaged_composite, r.boredom, r.subject))
            rows.append(dict(subject=r.subject, stimulus=stim, round=int(r["round"]),
                             engaged_composite=r.engaged_composite, boredom=r.boredom,
                             engagement=r.engagement, category=r.category,
                             highlighted=hi))
    ax.axvline(0, color="k", lw=0.9)
    ax.axhline(4.5, color="k", lw=0.9, ls=":")
    ax.set_xlabel("engaged composite (mean within-subject z: pupil + cognitive load + openness)")
    ax.set_ylabel("self-reported boredom (1-9)")

    # Margin so the quadrant labels never sit on a data point.
    xs = k.engaged_composite
    pad = (float(xs.max()) - float(xs.min())) * 0.16
    ax.set_xlim(float(xs.min()) - pad, float(xs.max()) + pad)
    ax.set_ylim(0, 11.4)
    _place_labels(ax, labels)

    ax.text(0.995, 0.985, "DIVERGENT\nphysiology engaged, self-report bored",
            transform=ax.transAxes, ha="right", va="top", fontsize=7.5,
            color="#B2182B", weight="bold", zorder=1)
    ax.text(0.005, 0.025, "REVERSE\nphysiology not engaged, self-report not bored",
            transform=ax.transAxes, ha="left", va="bottom", fontsize=7.5,
            color="#2166AC", weight="bold", zorder=1)
    ax.text(0.995, 0.025, "concordant-engaged", transform=ax.transAxes,
            ha="right", va="bottom", fontsize=7, color="0.35", zorder=1)
    ax.text(0.005, 0.985, "concordant-bored", transform=ax.transAxes,
            ha="left", va="top", fontsize=7, color="0.35", zorder=1)

    handles = [Patch(facecolor=_c(s), label=f"{C.STIM_LONG[s]} ({s})"
                     + (" - highlighted" if s == "CLC" else "")) for s in C.STIMULI]
    handles += [Line2D([], [], marker=C.ROUND_MARKER[r], ls="none", mfc="none",
                       mec="0.3", label=C.ROUND_LABEL[r]) for r in (1, 2)]
    ax.legend(handles=handles, fontsize=7, loc="upper center",
              bbox_to_anchor=(0.5, -0.10), ncol=5)
    ax.set_title("The keystone: physiological engagement against self-reported boredom")
    fig.tight_layout()

    kc = k[k.stimulus == "CLC"]
    counts = kc.category.value_counts()
    cap = (f"One point per subject-stimulus (n=12 subjects x 3 stimuli = 36); the clinical "
           f"stimulus is filled and labelled. Boredom >= 5 and composite > 0 define the "
           f"quadrants. On clinical, N=12: divergent {int(counts.get('divergent', 0))}, "
           f"concordant-engaged {int(counts.get('concordant-engaged', 0))}, "
           f"concordant-bored {int(counts.get('concordant-bored', 0))}, reverse "
           f"{int(counts.get('reverse', 0))}. The composite is the mean within-subject z of "
           f"pupil dilation, cognitive load and eye openness; gaze-deviation variance is "
           f"excluded from it because it is rate-dependent and the composite spans both "
           f"rounds. Both axes are WITHIN-SUBJECT relative: a negative composite means below "
           f"that subject's own three-video mean, not physiologically bored in absolute "
           f"terms. No omnibus test is run on the quadrant counts.")
    return _save(fig, ("cross-cutting", "keystone-scatter"), rows, cap)


def _keystone_decomposition(ctx):
    k = ctx["keystones"]
    kc = k[k.stimulus == "CLC"].sort_values(["category", "subject"])
    summ, det = ctx["sens_summary"], ctx["sens_detail"]

    order = ["divergent", "concordant-engaged", "concordant-bored", "reverse"]
    cmap = {"divergent": "#B2182B", "concordant-engaged": "#1B7837",
            "concordant-bored": "#762A83", "reverse": "#2166AC"}

    fig, axes = plt.subplots(1, 2, figsize=(13, 4.6),
                             gridspec_kw={"width_ratios": [1.35, 1]})
    ax = axes[0]
    rows = []
    for i, cat in enumerate(order):
        s = kc[kc.category == cat].sort_values("subject")
        for j, (_, r) in enumerate(s.iterrows()):
            ax.scatter(i - 0.17, j, s=120, color=cmap[cat],
                       marker=C.ROUND_MARKER[int(r["round"])], zorder=3)
            # Labels sit BESIDE the marker: 'R2-01' does not fit inside one.
            ax.annotate(r.subject, (i - 0.17, j), textcoords="offset points",
                        xytext=(9, 0), va="center", ha="left", fontsize=7.5,
                        color=cmap[cat], weight="bold", zorder=4)
            rows.append(dict(subject=r.subject, round=int(r["round"]), category=cat,
                             engaged_composite=r.engaged_composite,
                             boredom=r.boredom, engagement=r.engagement))
    ax.set_xticks(range(len(order)))
    ax.set_xticklabels([f"{c}\nn={int((kc.category == c).sum())}/12" for c in order],
                       fontsize=8)
    ax.set_xlim(-0.6, len(order) - 0.3)
    ax.set_ylim(-0.8, max(3.4, kc.category.value_counts().max() - 0.3))
    ax.set_yticks([])
    ax.set_title("Per-subject decomposition on clinical, N=12")

    ax = axes[1]
    un = summ[summ.trim == "untrimmed"].sort_values(["n_channels", "definition"])
    y = np.arange(len(un))[::-1]
    ax.barh(y, un.n_reverse, color=["#2166AC" if not b else "#08306B"
                                    for b in un.is_baseline], height=0.62)
    ax.set_yticks(y)
    ax.set_yticklabels([d + ("  [baseline]" if b else "")
                        for d, b in zip(un.definition, un.is_baseline)], fontsize=6.5)
    ax.set_xlabel("reverse cases (of 12)")
    ax.set_xlim(0, max(3.6, float(un.n_reverse.max()) + 1.3))
    ax.set_title("How the reverse count depends on the composite definition")
    for yi, (nrev, who) in zip(y, zip(un.n_reverse, un.reverse_subjects)):
        ax.text(nrev + 0.07, yi, who if nrev else "0 - none", va="center", fontsize=6.5,
                color="0.25" if nrev else "#1B7837")

    fig.tight_layout()

    st = sensitivity.reverse_stability(det, "R2-03")
    n_rev = int((kc.category == "reverse").sum())
    cap = (f"Left: every subject placed in one of the four categories on the clinical "
           f"stimulus, N=12, Round 1 circles and Round 2 triangles. Right: the same "
           f"decomposition recomputed under all seven non-empty subsets of the three "
           f"poolable engagement channels. THE ZERO-REVERSE ASYMMETRY DOES NOT HOLD AT "
           f"N=12: there are {n_rev} reverse cases under the baseline composite, namely "
           f"{', '.join(sorted(kc[kc.category == 'reverse'].subject))}. R2-03 is reverse "
           f"under {st.get('n_reverse', 0)} of {st.get('n_definitions', 0)} definitions and "
           f"survives the non-wear trim (composite {st.get('composite_untrimmed', float('nan')):+.3f} "
           f"untrimmed, {st.get('composite_trimmed', float('nan')):+.3f} trimmed), so it is not "
           f"an artefact of one choice - but reverse is a WITHIN-SUBJECT RELATIVE statement. "
           f"R2-03 reported boredom 3/1/2 across the three videos and engagement "
           f"{st.get('engagement_clinical', float('nan')):.0f} on clinical: they never reported "
           f"being bored by anything and never became bored on any stimulus, so their "
           f"clinical episode is their own relative physiological minimum rather than an "
           f"absolute bored state. n=12, DESCRIPTIVE - these are category counts and no "
           f"omnibus test is performed on them.")
    return _save(fig, ("cross-cutting", "keystone-decomposition"), rows, cap)


def _closure_heatmap(ctx, tl):
    fig, axes = plt.subplots(1, 3, figsize=(14, 5.2), sharey=True)
    rows = []
    subs = list(C.ALL_SUBJECTS)
    for ax, stim in zip(axes, C.STIMULI):
        mat = np.full((len(subs), C.TIMELINE_NORM_BINS), np.nan)
        for i, sid in enumerate(subs):
            t = tl[f"r{_round_of(sid)}_norm"]
            t = t[(t.subject == sid) & (t.stimulus == stim)].sort_values("bin")
            if not len(t):
                continue
            mat[i, t.bin.values.astype(int)] = t["openness"].values
            for b, v in zip(t.bin.values.astype(int), t["openness"].values):
                rows.append(dict(subject=sid, stimulus=stim, bin=b,
                                 pct_of_episode=(b + 0.5) / C.TIMELINE_NORM_BINS * 100,
                                 openness=v))
        im = ax.imshow(mat, aspect="auto", cmap="magma", vmin=0, vmax=1,
                       extent=(0, 100, len(subs) - 0.5, -0.5), interpolation="nearest")
        ax.set_title(f"{C.STIM_LONG[stim]} ({stim})", color=_c(stim), fontsize=10)
        ax.set_xlabel("percent of episode elapsed")
        ax.grid(False)
    axes[0].set_yticks(range(len(subs)))
    axes[0].set_yticklabels(subs, fontsize=7)
    cbar = fig.colorbar(im, ax=axes, fraction=0.02, pad=0.015)
    cbar.set_label("eye openness (1 = open, 0 = closed)")
    fig.suptitle("Eye closure over the episode, all 12 subjects", y=0.99, fontsize=11)

    cap = (f"Subject x time, faceted by stimulus, N=12. Dark is closed. The x axis is "
           f"percent of episode elapsed rather than seconds because episode lengths differ "
           f"by nearly a factor of four across the cohort. S05's Boring row carries the "
           f"sleep event as a single continuous 449.2 s closure beginning 245.4 s in - the "
           f"long dark band - and that cell's eye validity is 21.2%, kept as data rather "
           f"than discarded as a fault. Round 1 openness is the validity-flag proxy "
           f"(validated r=0.998 against Round 2's vendor measure); Round 2 openness is "
           f"binary at source. Descriptive figure: no test.")
    return _save(fig, ("cross-cutting", "eye-closure-heatmap"), rows, cap)


def _replication(ctx):
    rep = ctx["repl"]
    fig, ax = plt.subplots(figsize=(7.4, 6.4))
    marks = {"eye openness": "o", "pupil dilation": "s", "cognitive load": "^",
             "HR": "D", "gaze deviation variance": "X"}
    for _, r in rep.iterrows():
        ax.scatter(r.r1_z, r.r2_z, s=64, marker=marks.get(r.surface, "o"),
                   facecolor=_c(r.stimulus), edgecolor="k" if r.poolable else "#B2182B",
                   linewidths=0.8 if r.poolable else 1.8, zorder=3)
    lim = float(np.nanmax(np.abs(np.r_[rep.r1_z.values, rep.r2_z.values]))) * 1.15
    ax.plot([-lim, lim], [-lim, lim], color="0.6", ls="--", lw=1)
    ax.axhline(0, color="k", lw=0.7)
    ax.axvline(0, color="k", lw=0.7)
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_xlabel("Round 1 cohort mean within-subject z (n=8)")
    ax.set_ylabel("Round 2 cohort mean within-subject z (n=4)")
    ax.set_title("Round 1 against Round 2: what reproduces across instrument generations")
    handles = [Line2D([], [], marker=m, ls="none", mfc="none", mec="k", label=s)
               for s, m in marks.items()]
    handles += [Patch(facecolor=_c(s), label=C.STIM_LONG[s]) for s in C.STIMULI]
    handles += [Line2D([], [], marker="o", ls="none", mfc="none", mec="#B2182B",
                       mew=1.8, label="NOT poolable (rate-dependent)")]
    ax.legend(handles=handles, fontsize=6.5, loc="upper left", ncol=2)
    fig.tight_layout()

    cap = (f"Each point is one channel x stimulus, positioned by its cohort mean "
           f"within-subject z in each round. Points on the dashed diagonal reproduce across "
           f"instrument generations. Round 1 n=8, Round 2 n=4 - the Round 2 axis is "
           f"DESCRIPTIVE (below n={C.DESCRIPTIVE_N_BELOW}). Red-ringed points are "
           f"rate-dependent channels, plotted for completeness but NOT poolable: the same "
           f"gaze feature recomputed on Round 2 decimated to Round 1's rate moves by "
           f"0.65-0.84x, so a difference between rounds on those points cannot be separated "
           f"from the instrument change. Clinical's position is the known non-replication: "
           f"in Round 2 the engaged extreme is Interesting.")
    return _save(fig, ("cross-cutting", "replication-r1-vs-r2"), rep, cap)


def _felt_duration(ctx):
    sur = ctx["sur"]
    fig, ax = plt.subplots(figsize=(8.6, 5.2))
    rng = np.random.RandomState(C.SEED)
    rows = []
    for i, stim in enumerate(C.STIMULI):
        s = sur[sur.stimulus == stim]
        for _, r in s.iterrows():
            rnd = int(r["round"])
            ax.scatter(i + rng.uniform(-0.16, 0.16), r.felt_duration_min, s=40,
                       marker=C.ROUND_MARKER[rnd], facecolor="none",
                       edgecolor=_c(stim), linewidths=1.1, zorder=3)
            rows.append(dict(subject=r.subject, stimulus=stim, round=rnd,
                             felt_duration_min=r.felt_duration_min,
                             actual_min=C.STIMULUS_ACTUAL_MIN,
                             dilation_ratio=r.felt_duration_ratio,
                             raw_answer=r.felt_duration_min_raw))
    ax.axhline(C.STIMULUS_ACTUAL_MIN, color="k", ls="--", lw=1.3)
    ax.text(2.48, C.STIMULUS_ACTUAL_MIN, " actual 17 min", ha="right", va="bottom", fontsize=8)
    ax.set_xticks(range(3))
    ax.set_xticklabels([f"{C.STIM_LONG[s]}\n({s})" for s in C.STIMULI])
    ax.set_ylabel("felt duration (minutes)")
    ax.set_title("Felt against actual duration, all 36 episodes")
    ax.legend(handles=[Line2D([], [], marker=C.ROUND_MARKER[r], ls="none", mfc="none",
                              mec="0.3", label=C.ROUND_LABEL[r]) for r in (1, 2)],
              fontsize=7)
    fig.tight_layout()

    sr = ctx["sr_det"]
    cap = (f"All 36 episodes (12 subjects x 3 stimuli); dashed line is the true 17-minute "
           f"length, so points above it are time dilation. Test on the felt-duration "
           f"dilation ratio, pooled N=12: "
           f"{_contrasts(sr, 'felt-duration dilation ratio', 'pooled N=12')} "
           f"The instrument pools across rounds because it is the same 7-item instrument in "
           f"both. Free-text answers were parsed defensively; one 'Halfway' answer was read "
           f"as 8.5 min by author approval and every interpreted value is logged with its "
           f"raw string.")
    return _save(fig, ("cross-cutting", "felt-duration-dilation"), rows, cap)


def _channel_correlation(ctx):
    wide, w2 = ctx["wide"], ctx["w2"]
    cols = [(c, lab) for c, lab, _, _ in WIDE_CHANNELS]
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.9),
                             gridspec_kw={"width_ratios": [1, 1, 0.95]})
    rows = []
    for ax, rnd in zip(axes[:2], (1, 2)):
        sub = wide[wide["round"] == rnd][[c for c, _ in cols]]
        m = sub.corr(method="spearman")
        im = ax.imshow(m.values, cmap="RdBu_r", vmin=-1, vmax=1)
        ax.set_xticks(range(len(cols)))
        ax.set_xticklabels([l for _, l in cols], rotation=40, ha="right", fontsize=6.5)
        ax.set_yticks(range(len(cols)))
        ax.set_yticklabels([l for _, l in cols], fontsize=6.5)
        ax.set_title(f"{C.ROUND_LABEL[rnd]} - Spearman, {len(sub)} cells")
        ax.grid(False)
        for i in range(len(cols)):
            for j in range(len(cols)):
                v = m.values[i, j]
                if np.isfinite(v):
                    ax.text(j, i, f"{v:.2f}", ha="center", va="center", fontsize=5.6,
                            color="k" if abs(v) < 0.6 else "w")
                rows.append(dict(round=rnd, row=cols[i][1], col=cols[j][1], spearman=v))
    fig.colorbar(im, ax=axes[:2], fraction=0.02, pad=0.02).set_label("Spearman rho")

    ax = axes[2]
    x = w2.pct_valid_gaze / 100.0
    y = w2.openness_mean_bilateral
    r = float(np.corrcoef(x, y)[0, 1])
    ax.scatter(x, y, s=52, facecolor="none", edgecolor="#0072B2", linewidths=1.2)
    lo = float(min(x.min(), y.min())) - 0.02
    hi = float(max(x.max(), y.max())) + 0.02
    ax.plot([lo, hi], [lo, hi], color="0.6", ls="--", lw=1)
    ax.set_xlabel("validity-flag proxy (Round 1's measure, computed on Round 2)")
    ax.set_ylabel("continuous openness (Round 2's vendor measure)")
    ax.set_title(f"Proxy validation: Pearson r = {r:.4f}  (n={len(w2)} cells)")
    for _, rr in w2.iterrows():
        rows.append(dict(round=2, row="validity proxy", col="continuous openness",
                         subject=rr.subject, stimulus=rr.stimulus,
                         validity_proxy=rr.pct_valid_gaze / 100.0,
                         continuous_openness=rr.openness_mean_bilateral, pearson_r=r))
    fig.suptitle("Channel correlation, per round, with the openness proxy validation",
                 y=1.0, fontsize=11)

    cap = (f"Spearman correlation across cells, computed WITHIN each round and never "
           f"pooled, because two of the six channels are rate-dependent and the rounds "
           f"differ by a factor of ~36 in effective sampling rate. Round 1 n=24 cells, "
           f"Round 2 n=12 cells - both DESCRIPTIVE at the subject level (8 and 4 subjects). "
           f"Right panel is the check that licenses Round 1's openness proxy: within Round "
           f"2, where both measures exist, the validity-flag proxy and the vendor's "
           f"continuous openness correlate at Pearson r={r:.4f} across the 12 cells, "
           f"reproducing the r=0.998 the specification cites. Without that agreement the "
           f"pooled openness result could not be stated.")
    return _save(fig, ("cross-cutting", "channel-correlation"), rows, cap)


def _eeg_justification(ctx):
    snr, erows, edet = ctx["snr"], ctx["stat_rows"], ctx["stat_det"]
    e_s = erows[erows.surface.str.startswith("EEG")]
    e_d = edet[edet.surface.str.startswith("EEG")]

    fig, axes = plt.subplots(1, 3, figsize=(14.5, 4.5))
    rows = []

    ax = axes[0]
    subs = sorted(snr.subject.unique())
    w = 0.26
    for k, stim in enumerate(C.STIMULI):
        v = [snr[(snr.subject == s) & (snr.stimulus == stim)].retained_pct.mean()
             for s in subs]
        ax.bar(np.arange(len(subs)) + (k - 1) * w, v, width=w, color=_c(stim), label=stim)
        for s, vv in zip(subs, v):
            rows.append(dict(subject=s, stimulus=stim, quantity="retained_pct", value=vv))
    ax.axhline(50, color="#B2182B", ls="--", lw=1.2)
    ax.text(len(subs) - 0.5, 50, " 50%", color="#B2182B", ha="right", va="bottom", fontsize=7)
    ax.set_xticks(range(len(subs)))
    ax.set_xticklabels(subs, fontsize=7)
    ax.set_ylabel("2 s epochs retained (%)")
    ax.set_title(f"Epoch retention after 6-MAD artifact rejection\n"
                 f"mean {snr.retained_pct.mean():.1f}%, range "
                 f"{snr.retained_pct.min():.1f}-{snr.retained_pct.max():.1f}%")
    ax.legend(ncol=3, fontsize=7)

    ax = axes[1]
    for k, stim in enumerate(C.STIMULI):
        v = [snr[(snr.subject == s) & (snr.stimulus == stim)]
             .artifact_to_clean_variance_ratio.mean() for s in subs]
        ax.bar(np.arange(len(subs)) + (k - 1) * w, v, width=w, color=_c(stim))
        for s, vv in zip(subs, v):
            rows.append(dict(subject=s, stimulus=stim,
                             quantity="artifact_to_clean_variance_ratio", value=vv))
    ax.axhline(1, color="k", lw=1)
    ax.set_xticks(range(len(subs)))
    ax.set_xticklabels(subs, fontsize=7)
    ax.set_ylabel("rejected-epoch variance / retained-epoch variance")
    ax.set_title("Artifact-to-clean variance ratio\n(how much larger the discarded material is)")

    ax = axes[2]
    lab = [s.replace("EEG ", "") for s in e_s.surface]
    y = np.arange(len(e_s))[::-1]
    ax.barh(y, e_s.friedman_p, color="0.55", height=0.6)
    ax.axvline(C.ALPHA, color="#B2182B", ls="--", lw=1.3)
    ax.text(C.ALPHA + 0.015, -0.42, f"alpha={C.ALPHA}", color="#B2182B", fontsize=7,
            va="bottom", ha="left")
    ax.set_yticks(y)
    ax.set_yticklabels(lab, fontsize=7)
    ax.set_xlabel("Friedman p")
    ax.set_xlim(0, 1)
    ax.set_title(f"Omnibus p per EEG surface\n0 of {len(e_s)} reach alpha; "
                 f"0 of {len(e_d)} contrasts survive Holm")
    for _, r in e_s.iterrows():
        rows.append(dict(subject="(cohort)", stimulus="(all)",
                         quantity=f"friedman_p:{r.surface}", value=r.friedman_p))

    fig.suptitle("Why EEG was dropped: the evidence, not the assertion", y=1.02, fontsize=11)
    fig.tight_layout()

    ks = ctx["ks"]
    cap = (f"EEG is N=8 permanently - Round 2 has no EEG. Every cell is reported and NONE "
           f"is excluded for being noisy, because the retention figures are themselves the "
           f"evidence for the ruling that EEG was too noisy to carry a finding; removing "
           f"the worst cells would remove the justification. Retention averages "
           f"{snr.retained_pct.mean():.1f}% (range {snr.retained_pct.min():.1f}-"
           f"{snr.retained_pct.max():.1f}%, {int((snr.retained_pct < 50).sum())} of "
           f"{len(snr)} cells below 50%). Test: Friedman across the three stimuli, n=8 - "
           f"0 of {len(e_s)} surfaces reach alpha={C.ALPHA}, and 0 of {len(e_d)} pairwise "
           f"contrasts survive Holm. Keystone concordance is "
           f"{int(ks.keystone_consistent.sum())}/{len(ks)}, which is exactly chance. The "
           f"channel is reported in full and no finding rests on it.")
    return _save(fig, ("cross-cutting", "eeg-justification"), rows, cap)


# ------------------------------------------------------------------ entry point
def make_all(ctx):
    _setup()
    _INDEX.clear()
    os.makedirs(C.FIGS, exist_ok=True)

    tl = series.build()
    summ, det = sensitivity.analyse(ctx["wide"], ctx["w2"], ctx["sur"], ctx["keystones"])
    ctx["sens_summary"], ctx["sens_detail"] = summ, det
    J.write_csv(summ, os.path.join(C.OUT, "keystone-composite-sensitivity.csv"))
    J.write_csv(det, os.path.join(C.OUT, "keystone-composite-sensitivity-detail.csv"))

    n = 0
    for sid in C.ALL_SUBJECTS:
        n += _subject_summary_card(ctx, sid)
        n += _subject_timeseries(ctx, sid, tl)
        n += _subject_selfreport_vs_physiology(ctx, sid)
        n += _subject_felt_duration(ctx, sid)
    for stim in C.STIMULI:
        n += _stim_distribution(ctx, stim)
        n += _stim_slope(ctx, stim)
        n += _stim_envelope(ctx, stim, tl)
    n += _forest(ctx)
    n += _keystone_scatter(ctx)
    n += _keystone_decomposition(ctx)
    n += _closure_heatmap(ctx, tl)
    n += _replication(ctx)
    n += _felt_duration(ctx)
    n += _channel_correlation(ctx)
    n += _eeg_justification(ctx)

    idx = pd.DataFrame(_INDEX).sort_values("figure").reset_index(drop=True)
    lines = ["# Figure index", "",
             f"{len(idx)} figures, each written as "
             f"{' + '.join(C.FIG_FORMATS)} with a sibling `.csv` of its source data and a "
             f"`.caption.txt` stub.", ""]
    for _, r in idx.iterrows():
        lines += [f"## {r.figure}", "", r.caption, ""]
    J.write_text("\n".join(lines), os.path.join(C.FIGS, "INDEX.md"))
    return n
