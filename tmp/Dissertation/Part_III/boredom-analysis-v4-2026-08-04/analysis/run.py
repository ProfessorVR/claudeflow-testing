#!/usr/bin/env python
"""Single deterministic entry point for the N=12 Boredom Experiment analysis.

    /home/dalton/.venv/bin/python analysis/run.py [--no-figures]

Deterministic: fixed seed, sorted iteration, no wall-clock dependence inside any
computation, fixed float precision on write. Two runs produce byte-identical CSVs.
The only wall-clock value recorded anywhere is the run timestamp in RUN-MANIFEST.json,
which is excluded from the byte-identity check.

The four locked verification checks run as a GATE before any analysis proceeds, and
again after this tree's own extractors replace the canonical ones.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import pandas as pd

import adapters
import config as C
import crossref as X
import gaze as GZ
import eeg as EEG
import gate
import journal as J
import r1
import r2
import stats as S
import survey


def _hdr(msg):
    print(f"\n{'=' * 78}\n{msg}\n{'=' * 78}", flush=True)


def viewing_order_from_timestamps(r1_wide, r2_wide):
    """Recording start time -> viewing rank, per subject. Validated on Round 1,
    where one subject's survey headings state the order independently."""
    order = {}
    for sid, subj in adapters.subject_map():
        ff = adapters.find_files(os.path.join(subj, "HMD"))
        starts = {}
        for stim in C.STIMULI:
            df = adapters.read_hmd(ff[stim]["crop"])
            for c in ("hh", "mm", "ss"):
                df[c] = pd.to_numeric(df[c], errors="coerce")
            starts[stim] = float(df.hh.iloc[0] * 3600 + df.mm.iloc[0] * 60 + df.ss.iloc[0])
        for rank, (stim, _) in enumerate(sorted(starts.items(), key=lambda kv: kv[1]), 1):
            order[(sid, stim)] = rank

    SUB2 = adapters.r2_subjects_dir()
    for i, d in enumerate(sorted(os.listdir(SUB2)), 1):
        sid = f"R2-{i:02d}"
        files, _ = adapters.r2_collect(os.path.join(SUB2, d))
        starts = {}
        for stim in C.STIMULI:
            p = files.get(stim, {}).get("eye")
            if not p:
                continue
            v = pd.to_numeric(pd.read_csv(p, usecols=["ts/sys"], low_memory=False)["ts/sys"],
                              errors="coerce")
            v = v[v > 0]
            med = v.median()
            v = v[(v > med - 1e12) & (v < med + 1e12)]
            starts[stim] = float(v.min()) / 1e6
        for rank, (stim, _) in enumerate(sorted(starts.items(), key=lambda kv: kv[1]), 1):
            order[(sid, stim)] = rank
    return order


def main(make_figures=True):
    np.random.seed(C.SEED)
    os.makedirs(C.OUT, exist_ok=True)
    raw = os.path.join(C.OUT, "_raw")
    os.makedirs(raw, exist_ok=True)

    # ---------------------------------------------------------------- GATE 1
    _hdr("GATE 1 - four locked checks, canonical code path")
    adapters.run_ch_hmd(raw)
    r1w_canon = pd.read_csv(os.path.join(raw, "ch-hmd-wide.csv"))
    r1q_canon = pd.read_csv(os.path.join(raw, "ch-hmd-qc.csv"))
    import ch_hmd_r2 as _r2mod
    prev, _r2mod.OUT = _r2mod.OUT, raw
    try:
        import contextlib, io
        with contextlib.redirect_stdout(io.StringIO()):
            _r2mod.main()
    finally:
        _r2mod.OUT = prev
    r2w_canon = pd.read_csv(os.path.join(raw, "r2-hmd-wide.csv"))
    ok1, g1 = gate.run(r1w_canon, r1q_canon, r2w_canon, "canonical")
    print(gate.report(g1))
    if not ok1:
        raise SystemExit("GATE 1 FAILED - refusing to proceed")

    # ---------------------------------------------------------------- extract
    _hdr("EXTRACTION")
    w1, l1, e1 = r1.extract_all()
    print(f"  Round 1: {len(w1)} cell-variants, {len(l1)} long rows, {len(e1)} closure episodes")
    w2_all, l2, e2 = r2.extract()
    # Author ruling D-05: two windows are computed. The primary window feeds every
    # pooled statistic; the matched window is tested alongside in the window
    # comparison so the Round 1 / Round 2 window difference is visible, not assumed.
    w2 = w2_all[w2_all.window == C.R2_PRIMARY_WINDOW].reset_index(drop=True)
    print(f"  Round 2: {len(w2_all)} cell-windows ({len(w2)} at the primary window "
          f"'{C.R2_PRIMARY_WINDOW}'), {len(l2)} long rows, {len(e2)} closure episodes")
    uni = w1[w1.variant == "unified"]

    _hdr("GATE 2 - same four checks through this tree's own extractors")
    ok2, g2 = gate.run(uni, uni, w2, "this-tree")
    print(gate.report(g2))
    if not ok2:
        raise SystemExit("GATE 2 FAILED - the new extractors changed a locked result")

    # ---------------------------------------------------------------- survey
    _hdr("SURVEY")
    sur, demo = survey.parse_all()
    order = viewing_order_from_timestamps(uni, w2)
    sur = survey.attach_viewing_order(sur, order)
    print(f"  {len(sur)} episodes, {sur.subject.nunique()} subjects")
    conf = J.coercions()
    print(f"  {len(conf)} values interpreted rather than read directly (all logged)")

    # ---------------------------------------------------------------- gaze v3
    _hdr("GAZE - rebuilt against fixed forward, in degrees")
    gz = GZ.extract()
    prim = gz[(gz.baseline == "forward")
              & (gz.window.isin(("crop", C.R2_PRIMARY_WINDOW)))]
    print(f"  {len(gz)} rows over {gz.baseline.nunique()} baselines; "
          f"primary = fixed forward, {len(prim)} cells")
    for b in GZ.BASELINES:
        d = gz[(gz.baseline == b) & (gz.window.isin(("crop", C.R2_PRIMARY_WINDOW)))]
        t = adapters.surface_table(d, "gaze_deg_median").dropna()
        print(f"    baseline={b:8s} Boring furthest off centre vs CLC "
              f"{int((t.BOR > t.CLC).sum())}/{len(t)}, vs INT {int((t.BOR > t.INT).sum())}/{len(t)}")

    # ---------------------------------------------------------------- stats
    _hdr("STATISTICS")
    SURFACES = [
        ("dil_mean_bilateral", "pupil dilation", "pupil_dilation", None),
        ("cognitive_load_mean", "cognitive load", "cognitive_load", None),
        ("hr_mean", "HR", "hr", None),
        ("gaze_dev_variance", "gaze deviation variance", "gaze_dev_variance", None),
        ("gaze_dev_median", "gaze deviation median", "gaze_dev_median", None),
    ]
    rows, details = [], []
    for col, label, key, _ in SURFACES:
        for scope, frame in (("R1-unified", uni), ("R1-asis", w1[w1.variant == "asis"]),
                             ("R2", w2)):
            if col not in frame.columns:
                continue
            r, d = S.test_surface(adapters.surface_table(frame, col), label,
                                  poolable_key=key, scope=scope)
            rows.append(r)
            details.extend(d)
        if C.POOLABLE.get(key, (False,))[0]:
            t = S.pooled_table(adapters.surface_table(uni, col),
                               adapters.surface_table(w2, col))
            r, d = S.test_surface(t, label, poolable_key=key, scope="POOLED N=12")
            rows.append(r)
            details.extend(d)

    # openness: Round 1's proxy is a percentage, Round 2's a fraction
    for scope, t in (
            ("R1-unified", adapters.surface_table(uni, "pct_valid_eye") * C.R1_OPENNESS_SCALE),
            ("R2", adapters.surface_table(w2, "openness_mean_bilateral")),
            ("POOLED N=12", S.pooled_table(
                adapters.surface_table(uni, "pct_valid_eye"),
                adapters.surface_table(w2, "openness_mean_bilateral"),
                r1_scale=C.R1_OPENNESS_SCALE))):
        r, d = S.test_surface(t, "eye openness", poolable_key="eye_openness", scope=scope)
        rows.append(r)
        details.extend(d)

    # Round-2-only channels
    R2_ONLY = [("blink_rate_per_min", "blink rate", "blink_rate"),
               ("pct_time_closed", "% time eyes closed", "closure_episodes")]
    if C.ANALYSE_IMU:
        R2_ONLY.append(("imu_gyro_mag_mean", "head motion (gyro magnitude)", "imu_motion"))
    for col, label, key in R2_ONLY:
        r, d = S.test_surface(adapters.surface_table(w2, col), label,
                              poolable_key=key, scope="R2 only")
        rows.append(r)
        details.extend(d)

    # rebuilt gaze surfaces, per round and never pooled (rate-dependent)
    for col, label in (("gaze_deg_median", "gaze deviation from centre (deg)"),
                       ("gaze_pct_beyond_10deg", "% time beyond 10 deg off centre"),
                       ("gaze_excursion_rate_10deg_per_min", "excursions >10 deg per min")):
        for rnd, scope in ((1, "R1 fixed-forward"), (2, "R2 fixed-forward")):
            d = gz[(gz.baseline == "forward") & (gz["round"] == rnd)
                   & (gz.window.isin(("crop", C.R2_PRIMARY_WINDOW)))]
            if not len(d):
                continue
            r, dd = S.test_surface(adapters.surface_table(d, col), label,
                                   poolable_key="gaze_dev_median", scope=scope)
            rows.append(r)
            details.extend(dd)

    stat_rows, stat_det = S.summarise(rows, details)
    print(f"  {len(stat_rows)} surface x scope tests, {len(stat_det)} pairwise contrasts")
    print(f"  significant after Holm: {int(stat_det.significant.sum())}/{len(stat_det)}")

    # ---------------------------------------------------------------- z-scores
    zrows = []
    for col, label, key, _ in SURFACES + [("openness_frac", "eye openness", "eye_openness", None)]:
        wide = X.unified_wide(w1, w2)
        if col not in wide.columns:
            continue
        for rnd, frame in ((1, wide[wide["round"] == 1]), (2, wide[wide["round"] == 2])):
            z = S.within_subject_z(adapters.surface_table(frame, col)).mean()
            for stim in C.STIMULI:
                zrows.append(dict(surface=label, round=rnd, stimulus=stim,
                                  cohort_mean_z=float(z.get(stim, np.nan))))
    zt = pd.DataFrame(zrows)

    # ---------------------------------------------------------------- crossref
    _hdr("CROSS-REFERENCING")
    wide = X.unified_wide(w1, w2)
    wide = wide.merge(prim[["subject", "stimulus", "gaze_deg_median", "gaze_deg_p90",
                            "gaze_pct_beyond_10deg",
                            "gaze_excursion_rate_10deg_per_min"]],
                      on=["subject", "stimulus"], how="left")
    keystones = pd.concat([X.keystone(wide, sur, s) for s in C.STIMULI], ignore_index=True)
    keystones_b = pd.concat([X.keystone(wide, sur, s, channels=X.COMPOSITE_B_CHANNELS,
                                        tag="B") for s in C.STIMULI], ignore_index=True)
    print("  composite B (pupil + openness + gaze), clinical:")
    for cat, n in keystones_b[keystones_b.stimulus == "CLC"].category.value_counts().items():
        print(f"    {cat:20s} {n}/12")
    kclc = keystones[keystones.stimulus == "CLC"]
    print("  keystone on clinical, N=12:")
    for cat, n in kclc.category.value_counts().items():
        print(f"    {cat:20s} {n}/12")
    mod, kmod = X.moderation(kclc, sur)
    repl = X.replication(w1, w2)
    sr_rows, sr_det = X.selfreport_tests(sur)

    # ------------------------------------------------------- window comparison
    _hdr("WINDOW COMPARISON - full crop vs Round-1-matched")
    wcmp = X.window_comparison(uni, w2_all)
    for _, r in wcmp.iterrows():
        print(f"  {r.surface:14s} {r.window:10s} {r.scope:12s} n={int(r.n):2d} "
              f"Friedman p={r.friedman_p:.4g}  BORvCLC {r.bor_lt_clc}  BORvINT {r.bor_lt_int}")

    # -------------------------------------------------- criterion validity
    # The study's own validation logic: the participants' reports are the criterion
    # and the instruments are scored against them. Never run before.
    _hdr("CRITERION VALIDITY - instruments against self-report")
    crit = X.criterion_validity(wide, sur, eeg_keystone=None)
    for _, r in crit.iterrows():
        print(f"  {r.channel:30s} vs {r.criterion:11s} rho={r.rho:+.3f} "
              f"perm p={r.p_perm:.4f} (analytic {r.p_analytic:.4g})  "
              f"r={r.pearson_r:+.3f}  n={int(r.n)}")

    # ---------------------------------------------------------------- EEG
    _hdr("EEG - analysed in full, negatives included")
    bp, ks, eqc, snr, erows, edet = EEG.analyse(raw)
    print(f"  {len(bp)}/24 band-power cells; retention mean {snr.retained_pct.mean():.1f}%, "
          f"range {snr.retained_pct.min():.1f}-{snr.retained_pct.max():.1f}%")
    print(f"  surfaces reaching Friedman p<0.05: {int((erows.friedman_p < 0.05).sum())}/{len(erows)}")
    print(f"  pairwise surviving Holm: {int(edet.significant.sum())}/{len(edet)}")
    print(f"  keystone concordance: {int(ks.keystone_consistent.sum())}/{len(ks)} (chance is 4/8)")
    stat_rows = pd.concat([stat_rows, erows], ignore_index=True)
    stat_det = pd.concat([stat_det, edet], ignore_index=True)

    # ---------------------------------------------------------------- write
    _hdr("WRITING TABLES")
    out = {
        "r1-features-wide.csv": w1, "r1-features-long.csv": l1,
        "r1-closure-episodes.csv": e1,
        "r2-features-wide.csv": w2_all, "r2-features-long.csv": l2,
        "window-comparison.csv": wcmp, "criterion-validity.csv": crit,
        "r2-closure-episodes.csv": e2,
        "features-pooled-wide.csv": wide,
        "survey-episodes.csv": sur, "survey-demographics.csv": demo,
        "stats-surfaces.csv": stat_rows, "stats-pairwise.csv": stat_det,
        "stats-within-subject-z.csv": zt,
        "selfreport-surfaces.csv": sr_rows, "selfreport-pairwise.csv": sr_det,
        "keystone-decomposition.csv": keystones,
        "keystone-decomposition-compositeB.csv": keystones_b,
        "gaze-angles.csv": gz,
        "keystone-moderation.csv": mod,
        "replication-r1-vs-r2.csv": repl,
        "eeg-bandpower.csv": bp, "eeg-keystone.csv": ks, "eeg-retention-snr.csv": snr,
        "gate-verification.csv": pd.concat([g1, g2], ignore_index=True),
    }
    for name, frame in sorted(out.items()):
        J.write_csv(frame, os.path.join(C.OUT, name))
        print(f"  {name:34s} {len(frame):6d} rows")

    ctx = dict(w1=w1, w2=w2, w2_all=w2_all, wcmp=wcmp, crit=crit, gz=gz,
               keystones_b=keystones_b, wide=wide, sur=sur, demo=demo, stat_rows=stat_rows,
               stat_det=stat_det, zt=zt, keystones=keystones, mod=mod, repl=repl,
               bp=bp, ks=ks, snr=snr, e1=e1, e2=e2, gates=pd.concat([g1, g2]),
               sr_rows=sr_rows, sr_det=sr_det)

    if make_figures:
        _hdr("FIGURES")
        import figures
        n = figures.make_all(ctx)
        if getattr(figures, "IMPLEMENTED", False):
            print(f"  {n} figures written (PDF + PNG + sibling CSV)")
        else:
            print("  NOT IMPLEMENTED (Phase 6 pending) - 0 figures written. "
                  "See analysis/figures.py for the required suite.")

    _hdr("ARTEFACTS")
    import report
    wrote = report.write_all(ctx)
    if wrote:
        print("  RUN-MANIFEST.json  METHODS.md  EXCLUSIONS.log  QC-REPORT.md")
        print("  FINDINGS.md  SOURCES.md  RECONCILIATION.md")
    else:
        print("  NOT IMPLEMENTED (Phase 7 pending) - 0 artefacts written. "
              "See analysis/report.py for the required set.")
    return ctx


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-figures", action="store_true")
    a = ap.parse_args()
    main(make_figures=not a.no_figures)
