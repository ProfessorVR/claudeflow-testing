"""(Med) stratum check — Boredom Experiment N=8.

Question: is the corrected keystone (all-physiology-engaged vs self-report-bored on the
CLINICAL stimulus) uniform across the cohort, or concentrated in one stratum?

PII: reads subject folder NAMES only to derive the canonical S01..S08 order and a boolean
(Med) flag. Names are never printed and never written. Output is Sxx-keyed only.
Descriptive only — N=8 with a 3/5 split has no inferential power.
"""
import csv
import os
import sys
from statistics import mean

sys.path.insert(0, "/home/dalton/projects/claudeflow-testing/scripts/boredom-o9")
import common  # noqa: E402

OUT = "/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Part_III/boredom-o9-processing/out"

# FE-U self-report master, transcribed from reanalysis/boredom-experiment-brief.md §1
# (bored, engaged, felt_minutes | None where non-numeric/verbatim)
SELFREPORT = {
    ("S01", "INT"): (2, 7, 10),   ("S01", "CLC"): (3, 5, 20),  ("S01", "BOR"): (6, 3, 15),
    ("S02", "INT"): (3, 6, 30),   ("S02", "CLC"): (8, 3, 30),  ("S02", "BOR"): (9, 2, 20),
    ("S03", "INT"): (3, 7, 30),   ("S03", "CLC"): (3, 7, 15),  ("S03", "BOR"): (9, 1, 60),
    ("S04", "INT"): (3, 7, 20),   ("S04", "CLC"): (9, 1, 30),  ("S04", "BOR"): (1, 7, 8),
    ("S05", "INT"): (5, 4, 20),   ("S05", "CLC"): (6, 5, 17),  ("S05", "BOR"): (9, 2, 5),
    ("S06", "INT"): (8, 2, 30),   ("S06", "CLC"): (6, 3, 25),  ("S06", "BOR"): (4, 5, 20),
    ("S07", "INT"): (7, 6, 11),   ("S07", "CLC"): (6, 7, 20),  ("S07", "BOR"): (9, 2, 30),
    ("S08", "INT"): (5, 4, 15),   ("S08", "CLC"): (7, 3, 20),  ("S08", "BOR"): (9, 1, 25),
}


def med_flags():
    """{sid: bool} — True where the raw folder name carries a '(Med)' tag. Names never emitted."""
    flags = {}
    for sid, path in common.subject_map():
        base = os.path.basename(path)
        flags[sid] = "(med)" in base.lower()
    return flags


def load_features():
    feats = {}
    with open(os.path.join(OUT, "combined-features.csv")) as fh:
        for row in csv.DictReader(fh):
            key = (row["subject"], row["stimulus"])
            feats[key] = {k: (float(v) if v not in ("", "nan") else None)
                          for k, v in row.items() if k not in ("subject", "stimulus")}
    return feats


def engagement_composite(f):
    """Higher = more engaged. Engaged-direction: pupil, cognitive load.
    Boring-direction (sign-flipped): DMN, parietal alpha, gaze variance."""
    parts = []
    for k, sign in (("pupil_z", +1), ("cog_z", +1), ("dmn_z", -1), ("palpha_z", -1), ("gazevar_z", -1)):
        v = f.get(k)
        if v is not None:
            parts.append(sign * v)
    return mean(parts) if parts else None


def fmt(v, nd=2):
    return "  n/a" if v is None else f"{v:+.{nd}f}"


def main():
    flags = med_flags()
    feats = load_features()
    subs = sorted(flags)

    print("== per-subject, CLINICAL stimulus ==")
    print(f"{'S':>4} {'(Med)':>6} {'bored':>6} {'engag':>6} {'felt':>5} "
          f"{'pupil_z':>8} {'cog_z':>7} {'dmn_z':>7} {'palpha_z':>9} {'gazevar_z':>10} {'ENG-composite':>14} {'divergent?':>11}")
    rows = []
    for s in subs:
        f = feats.get((s, "CLC"), {})
        bored, engaged, felt = SELFREPORT[(s, "CLC")]
        comp = engagement_composite(f)
        divergent = (comp is not None and comp > 0 and bored >= 5)
        rows.append((s, flags[s], bored, engaged, felt, comp, divergent))
        print(f"{s:>4} {('YES' if flags[s] else '-'):>6} {bored:>6} {engaged:>6} {felt:>5} "
              f"{fmt(f.get('pupil_z')):>8} {fmt(f.get('cog_z')):>7} {fmt(f.get('dmn_z')):>7} "
              f"{fmt(f.get('palpha_z')):>9} {fmt(f.get('gazevar_z')):>10} {fmt(comp):>14} "
              f"{('YES' if divergent else 'no'):>11}")

    print("\n== stratum comparison (CLINICAL) — DESCRIPTIVE ONLY, N=8, 3/5 split ==")
    for label, want in (("(Med) medical students", True), ("non-(Med)", False)):
        grp = [r for r in rows if r[1] is want]
        if not grp:
            continue
        comps = [r[5] for r in grp if r[5] is not None]
        print(f"{label:<24} n={len(grp)}  "
              f"bored mean {mean(r[2] for r in grp):.2f}  "
              f"engaged mean {mean(r[3] for r in grp):.2f}  "
              f"felt mean {mean(r[4] for r in grp):.1f} min  "
              f"ENG-composite mean {mean(comps):+.3f}  "
              f"divergent {sum(1 for r in grp if r[6])}/{len(grp)}")

    print("\n== same split, all three stimuli (self-report boredom) ==")
    print(f"{'stimulus':<10}{'(Med) mean':>12}{'non-(Med) mean':>16}{'gap':>8}")
    for stim in ("BOR", "CLC", "INT"):
        m = [SELFREPORT[(s, stim)][0] for s in subs if flags[s] and (s, stim) in SELFREPORT]
        n = [SELFREPORT[(s, stim)][0] for s in subs if not flags[s] and (s, stim) in SELFREPORT]
        print(f"{stim:<10}{mean(m):>12.2f}{mean(n):>16.2f}{mean(m)-mean(n):>+8.2f}")

    print("\n== pupil separation (Boring < Clinical) by stratum ==")
    for label, want in (("(Med)", True), ("non-(Med)", False)):
        grp = [s for s in subs if flags[s] is want]
        held = []
        for s in grp:
            b = feats.get((s, "BOR"), {}).get("pupil_z")
            c = feats.get((s, "CLC"), {}).get("pupil_z")
            if b is not None and c is not None:
                held.append(b < c)
        print(f"{label:<12} held in {sum(held)}/{len(held)}")


if __name__ == "__main__":
    main()
