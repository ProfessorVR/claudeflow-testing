"""Results figures F1–F5 for Section II (figure plan approved 2026-08-22).

ADDITIVE script — touches no gate, no existing module. Reads out/*.csv, emits PDF+PNG to
out/figures-results/. Conventions per the approved plan: tree-convention values; single
marker in the scatters (no film or round coding); colorblind-safe palette that survives
grayscale; F5 as the 12x3 category mosaic with film codes as identifiers only.
Run: /home/dalton/.pyenv/versions/3.11.9/bin/python3 analysis/results_figures.py
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

OUT = os.path.join(os.path.dirname(__file__), "..", "out")
DEST = os.path.join(OUT, "figures-results")
STIM = ["BOR", "CLC", "INT"]
os.makedirs(DEST, exist_ok=True)

plt.rcParams.update({"font.family": "serif", "font.size": 9,
                     "axes.spines.top": False, "axes.spines.right": False})

BLUE, SKY, VERM, YELL, GREY = "#0072B2", "#56B4E9", "#D55E00", "#F0E442", "#888888"

sur = pd.read_csv(os.path.join(OUT, "survey-episodes.csv"))
wide = pd.read_csv(os.path.join(OUT, "features-pooled-wide.csv"))
crit = pd.read_csv(os.path.join(OUT, "criterion-validity.csv"))
key = pd.read_csv(os.path.join(OUT, "keystone-decomposition.csv"))
SUBJ = sorted(sur.subject.unique())


def surf(f, c):
    return (f.pivot_table(index="subject", columns="stimulus", values=c, aggfunc="first")
            .reindex(index=SUBJ, columns=STIM))


def wz(t):
    m = t.mean(axis=1); s = t.std(axis=1, ddof=1)
    return t.sub(m, axis=0).div(s.replace(0, np.nan), axis=0)


def save(fig, name):
    for ext in ("pdf", "png"):
        fig.savefig(os.path.join(DEST, f"{name}.{ext}"), dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {name}.pdf/.png")


# ---------------------------------------------------------------- F1 dumbbell
LABELS = {
    "gaze deviation (per-participant baseline)": "gaze deviation (participant baseline)",
    "gaze deviation (per-file baseline)": "gaze deviation (per-file baseline)",
    "gaze deviation (device-forward baseline)": "gaze deviation (device-forward)",
    "gaze deg p90 (device-forward baseline)": "gaze deviation, 90th pct (device-forward)",
    "% time >10 deg off center (device-forward baseline)":
        "share of episode beyond 10° (device-forward)",
    "excursion rate >10 deg (device-forward baseline)":
        "excursions beyond 10° per minute (device-forward)",
    "gaze deviation variance (per-file baseline)": "gaze deviation variance (per-file)",
    "HR": "heart rate",
    "eye closure": "eye closure",
    "pupil dilation": "pupil dilation",
    "cognitive load": "cognitive load",
}
d = crit[crit.round_scope == "pooled"]
chans = (d[d.criterion == "boredom"].set_index("channel").rho.abs()
         .sort_values().index.tolist())
fig, axes = plt.subplots(1, 2, figsize=(7.4, 4.2), sharey=True)
for ax, critname, title in [(axes[0], "boredom", "against reported boredom"),
                            (axes[1], "engagement", "against reported engagement")]:
    for i, ch in enumerate(chans):
        r0 = d[(d.channel == ch) & (d.criterion == critname)].iloc[0]
        ax.plot([r0.rho, r0.pearson_r], [i, i], color=GREY, lw=1, zorder=1)
        ax.scatter([r0.rho], [i], color=BLUE, s=26, zorder=2,
                   label="Spearman $\\rho$" if i == 0 else None)
        ax.scatter([r0.pearson_r], [i], color=VERM, s=26, marker="s", zorder=2,
                   label="Pearson $r$" if i == 0 else None)
    ax.axvline(0, color="black", lw=0.6)
    ax.set_xlim(-1, 1)
    ax.set_title(title, fontsize=9)
    ax.set_xlabel("correlation")
axes[0].set_yticks(range(len(chans)))
axes[0].set_yticklabels([LABELS.get(c, c) for c in chans], fontsize=8)
axes[0].legend(loc="lower right", fontsize=8, frameon=False)
save(fig, "F1-spearman-pearson")

# ---------------------------------------------------------------- F2/F3 scatters
for name, col, ylab in [("F2-gaze-scatter", "gaze_deg_median_subject",
                         "gaze deviation, standardized within participant"),
                        ("F3-closure-scatter", "closure_frac",
                         "eye closure, standardized within participant")]:
    x = wz(surf(sur, "boredom")).values.ravel()
    y = wz(surf(wide, col)).values.ravel()
    fig, ax = plt.subplots(figsize=(4.6, 4.0))
    ax.scatter(x, y, color=BLUE, alpha=0.65, s=30)
    b1, b0 = np.polyfit(x, y, 1)
    xs = np.linspace(x.min(), x.max(), 2)
    ax.plot(xs, b1 * xs + b0, color=VERM, lw=1.4)
    ax.set_xlabel("reported boredom, standardized within participant")
    ax.set_ylabel(ylab)
    save(fig, name)

# ---------------------------------------------------------------- F4 paired panels
PANELS = [("gaze deviation (degrees)", "gaze_deg_median_subject", wide),
          ("eye closure (% of episode)", "closure_frac", wide),
          ("sleep-fight (1–9)", "sleep_fight", sur),
          ("fatigue after (1–9)", "fatigue_after", sur)]
fig, axes = plt.subplots(2, 2, figsize=(7.0, 6.2))
for ax, (title, col, src) in zip(axes.ravel(), PANELS):
    for sid in SUBJ:
        g = sur[sur.subject == sid]
        gb = g.sort_values(["boredom", "engagement"], ascending=[False, True]).iloc[0]
        ge = g.sort_values(["engagement", "boredom"], ascending=[False, True]).iloc[0]
        a = src[(src.subject == sid) & (src.stimulus == gb.stimulus)][col].iloc[0]
        b = src[(src.subject == sid) & (src.stimulus == ge.stimulus)][col].iloc[0]
        if col == "closure_frac":
            a, b = 100 * a, 100 * b
        if a > b:
            color, ls = BLUE, "-"          # agrees: higher on the most-boring side
        elif a < b:
            color, ls = VERM, "-"          # contra
        else:
            color, ls = GREY, "--"         # tied
        ax.plot([0, 1], [a, b], color=color, ls=ls, lw=1.2, alpha=0.85)
        ax.scatter([0, 1], [a, b], color=color, s=12, alpha=0.85)
    ax.set_xticks([0, 1])
    ax.set_xticklabels(["own most-boring\nepisode", "own most-engaging\nepisode"],
                       fontsize=8)
    ax.set_xlim(-0.25, 1.25)
    ax.set_title(title, fontsize=9)
import matplotlib.lines as mlines
fig.legend(handles=[
    mlines.Line2D([], [], color=BLUE, lw=1.4, label="higher on the most-boring side (agrees)"),
    mlines.Line2D([], [], color=VERM, lw=1.4, label="higher on the most-engaging side (contra)"),
    mlines.Line2D([], [], color=GREY, lw=1.4, ls="--", label="same value in both (tied)")],
    loc="lower center", ncol=3, fontsize=8, frameon=False, bbox_to_anchor=(0.5, -0.015))
fig.tight_layout(rect=(0, 0.035, 1, 1))
save(fig, "F4-paired-panels")

# ---------------------------------------------------------------- F5 mosaic
CAT = {"concordant-bored": (BLUE, "concordant-bored (both say bored)"),
       "concordant-engaged": (SKY, "concordant-engaged (both say engaged)"),
       "divergent": (VERM, "divergent (eyes engaged, person bored)"),
       "reverse": (YELL, "reverse (eyes bored, person not bored)")}
k = key.set_index(["subject", "stimulus"]).category
fig, ax = plt.subplots(figsize=(4.6, 5.4))
for i, sid in enumerate(SUBJ):
    for j, st in enumerate(STIM):
        cat = k.loc[(sid, st)]
        ax.add_patch(Rectangle((j, len(SUBJ) - 1 - i), 0.94, 0.94,
                               facecolor=CAT[cat][0], edgecolor="white"))
ax.set_xlim(0, 3)
ax.set_ylim(0, len(SUBJ))
ax.set_xticks([0.47, 1.47, 2.47])
ax.set_xticklabels(STIM)
ax.set_yticks([len(SUBJ) - 1 - i + 0.47 for i in range(len(SUBJ))])
ax.set_yticklabels(SUBJ, fontsize=8)
ax.set_xlabel("episode (film code as identifier only)")
for spine in ax.spines.values():
    spine.set_visible(False)
ax.tick_params(length=0)
handles = [Rectangle((0, 0), 1, 1, facecolor=c) for c, _ in CAT.values()]
ax.legend(handles, [lab for _, lab in CAT.values()], loc="upper center",
          bbox_to_anchor=(0.5, -0.09), fontsize=7.5, frameon=False, ncol=1)
save(fig, "F5-decomposition-mosaic")

print("\ncounts check:", key.category.value_counts().to_dict())
