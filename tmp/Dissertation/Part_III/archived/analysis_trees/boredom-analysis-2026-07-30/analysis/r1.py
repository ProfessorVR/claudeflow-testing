"""Round 1 feature extraction (S01-S08), via the methodology of record.

Every feature is computed by `scripts/boredom-o9/ch_hmd.py`'s own read_hmd() and
parse_window(); this module orchestrates, it does not redefine.

Two things it adds, both author-ruled:

D1  Rate variants. S06's Clinical and Interesting cells sample at ~111 and ~125 Hz
    while every other Round 1 cell samples at ~3 Hz. Gaze-deviation variance is
    rate-dependent, so S06's own three-way comparison would otherwise contrast two
    different instruments. Both variants are produced:
      unified - S06's two fast cells decimated to the cohort rate before parsing
      asis    - every cell at its native rate
    Only S06 CLC/INT differ between them; the other 22 cells are identical.

D5  Eye closure from the per-eye sentinel. Columns F/G (dilL/dilR) carry -1 when
    that eye is closed. parse_window() masks those to NaN, which is right for pupil
    and destroys the closure signal, so closure is read from the raw frame. This is
    per-eye and slightly more sensitive than the validity flag: in S05's Boring cell
    it catches 22 left-eye closures the flag misses.

    Blink RATE is not computed for Round 1 and the reason is arithmetic: the median
    sampling interval is ~334 ms, which is the mean duration of a spontaneous blink
    (VanderWerf et al. 2003). A blink occupies zero or one samples here, so only
    extended closures - runs spanning several samples - are recoverable.

HRV is excluded from both rounds per author ruling; the column is still read so the
exclusion can be logged with a row count rather than passed over in silence.
"""
import os

import numpy as np
import pandas as pd

import adapters
import config as C
import journal as J

FEATURES = ["cognitive_load", "hr", "left_eye_dilation", "right_eye_dilation",
            "eye_gaze_deviation"]


def _runs(mask):
    """Yield (start_idx, end_idx_inclusive) for each run of True."""
    m = np.asarray(mask, bool)
    if not m.any():
        return
    d = np.diff(m.astype(np.int8))
    starts = list(np.where(d == 1)[0] + 1)
    ends = list(np.where(d == -1)[0])
    if m[0]:
        starts.insert(0, 0)
    if m[-1]:
        ends.append(len(m) - 1)
    for s, e in zip(starts, ends):
        yield int(s), int(e)


def _closure(raw, t, sid, stim, variant, median_dt):
    """Per-eye closure from the -1 sentinel, plus full-closure episodes."""
    left_closed = raw.dilL == C.R1_CLOSED_SENTINEL
    right_closed = raw.dilR == C.R1_CLOSED_SENTINEL
    both_closed = left_closed & right_closed
    n = len(raw)

    episodes = []
    tv = np.asarray(t, float)
    for s, e in _runs(both_closed.values):
        dur = float(tv[e] - tv[s]) + median_dt      # a 1-sample run still spans one interval
        episodes.append(dict(subject=sid, stimulus=stim, variant=variant,
                             start_s=float(tv[s]), end_s=float(tv[e]) + median_dt,
                             duration_s=dur, n_samples=e - s + 1,
                             kind="blink" if dur * 1000 <= C.BLINK_MAX_MS else "extended",
                             resolvable=bool(1.0 / median_dt >= C.BLINK_MIN_RESOLVABLE_HZ)))

    ext = [e for e in episodes if e["kind"] == "extended"]
    feats = dict(
        openness_frac_left=float((~left_closed).mean()),
        openness_frac_right=float((~right_closed).mean()),
        openness_frac_bilateral=float((~both_closed).mean()),
        pct_time_closed=float(both_closed.mean() * 100),
        closure_episodes_n=len(episodes),
        extended_closure_n=len(ext),
        extended_closure_total_s=float(sum(e["duration_s"] for e in ext)),
        extended_closure_mean_s=float(np.mean([e["duration_s"] for e in ext])) if ext else np.nan,
        longest_closure_s=float(max((e["duration_s"] for e in episodes), default=0.0)),
        blink_rate_per_min=np.nan,          # unresolvable at this sampling rate
    )
    return feats, episodes


def _thirds(series, t):
    """First / middle / last third means, for the within-episode time course."""
    v = pd.Series(np.asarray(series, float))
    m = v.notna()
    vv = v[m]
    if len(vv) < 6:
        return dict(third1=np.nan, third2=np.nan, third3=np.nan)
    k = len(vv) // 3
    return dict(third1=float(vv.iloc[:k].mean()),
                third2=float(vv.iloc[k:2 * k].mean()),
                third3=float(vv.iloc[2 * k:].mean()))


def extract(variant):
    """-> (wide DataFrame, long DataFrame, episodes DataFrame) for one rate variant."""
    wide_rows, long_rows, episode_rows = [], [], []

    for sid, subj in adapters.subject_map():
        hmd = os.path.join(subj, "HMD")
        ff = adapters.find_files(hmd)
        for stim in C.STIMULI:
            info = ff[stim]
            if not info["crop"]:
                raise SystemExit(f"crop-only rule: {sid} {stim} has no _Crop file")

            sig, t, qc, raw = adapters.r1_cell_frame(info["crop"])
            native_hz = qc["median_hz"]
            step = 1

            if variant == "unified" and (sid, stim) in C.S06_FAST_CELLS:
                raw_dec, step = adapters.decimate_r1_cell(raw, C.R1_COHORT_HZ, native_hz)
                n_before = len(raw)
                sig, t, qc, raw = adapters.r1_cell_frame(info["crop"])
                raw = raw.iloc[::step].reset_index(drop=True)
                # re-parse the thinned rows through the record's own parser
                sig, t, qc = adapters.parse_window(raw.copy())
                for c in ("dilL", "dilR", "validL", "validR"):
                    raw[c] = pd.to_numeric(raw[c], errors="coerce")
                J.exclude(scope="rate-harmonisation", item=f"{sid} {stim}",
                          reason=(f"D1: cell sampled at {native_hz:.1f} Hz against the "
                                  f"cohort's {C.R1_COHORT_HZ} Hz; decimated by taking every "
                                  f"{step}th row ({n_before} -> {len(raw)}) so gaze variance "
                                  f"is one instrument across Round 1"),
                          n_rows=n_before - len(raw), recoverable=True)

            dt = np.diff(np.asarray(t, float))
            dt = dt[dt > 0]
            median_dt = float(np.median(dt)) if len(dt) else np.nan
            eff_hz = 1.0 / median_dt if median_dt and median_dt == median_dt else np.nan

            row = dict(subject=sid, stimulus=stim, round=1, variant=variant,
                       window="crop", n_samples=len(raw),
                       sample_rate_mean_hz=qc["mean_hz"], sample_rate_median_hz=qc["median_hz"],
                       effective_hz=eff_hz, decimation_step=step,
                       duration_s=qc["duration_s"], pct_valid_eye=qc["pct_valid_eye"],
                       pct_hr_valid=qc["pct_hr_valid"],
                       high_rate_flag=bool(native_hz > C.HIGH_RATE_FLAG_HZ),
                       format_note=info["note"] or "ok")

            for name in FEATURES:
                st = adapters.signal_stats(sig[name], t)
                for k, v in st.items():
                    long_rows.append(dict(subject=sid, stimulus=stim, round=1,
                                          variant=variant, signal=name, stat=k, value=v))
                row[f"{name}_mean"] = st["mean"]
                if name == "eye_gaze_deviation":
                    row["gaze_dev_median"] = st["median"]
                    row["gaze_dev_variance"] = st["sd"] ** 2 if st["sd"] == st["sd"] else np.nan
                if name in ("hr", "cognitive_load"):
                    row[f"{name}_slope"] = st["slope"]
                if name in ("hr", "cognitive_load", "left_eye_dilation", "right_eye_dilation"):
                    row[f"{name}_delta"] = st["delta_last_first_third"]
                for tk, tv in _thirds(sig[name], t).items():
                    long_rows.append(dict(subject=sid, stimulus=stim, round=1,
                                          variant=variant, signal=name, stat=tk, value=tv))

            row["dil_mean_bilateral"] = float(np.nanmean(
                [row["left_eye_dilation_mean"], row["right_eye_dilation_mean"]]))

            cl, eps = _closure(raw, t, sid, stim, variant, median_dt)
            row.update(cl)
            episode_rows.extend(eps)
            for tk, tv in _thirds((raw.dilL != C.R1_CLOSED_SENTINEL).astype(float), t).items():
                long_rows.append(dict(subject=sid, stimulus=stim, round=1, variant=variant,
                                      signal="eye_openness_left", stat=tk, value=tv))

            if C.EXCLUDE_HRV:
                hrv_n = int(pd.to_numeric(raw.hrv, errors="coerce").gt(0).sum())
                J.exclude(scope="channel", item=f"{sid} {stim} HRV",
                          reason=C.HRV_EXCLUSION_REASON, n_rows=hrv_n, recoverable=True)

            wide_rows.append(row)

    return (pd.DataFrame(wide_rows).sort_values(["subject", "stimulus"]).reset_index(drop=True),
            pd.DataFrame(long_rows).sort_values(["subject", "stimulus", "signal", "stat"]).reset_index(drop=True),
            pd.DataFrame(episode_rows))


def extract_all():
    """Both rate variants, stacked, plus the blink-resolvability note."""
    wides, longs, eps = [], [], []
    for v in C.RATE_VARIANTS:
        w, lo, e = extract(v)
        wides.append(w)
        longs.append(lo)
        if len(e):
            eps.append(e)
    J.note("blink resolvability",
           f"Round 1's median sampling interval is ~{1000/C.R1_COHORT_HZ:.0f} ms, which is the "
           f"mean spontaneous blink duration ({C.BLINK_MEAN_MS:.0f} ms, {C.BLINK_SOURCE}). "
           f"A blink therefore occupies 0-1 samples and blink RATE is not recoverable in "
           f"Round 1 at any threshold; only extended closures are. Blink rate is reported "
           f"for Round 2 (120 Hz) only.")
    return (pd.concat(wides, ignore_index=True),
            pd.concat(longs, ignore_index=True),
            pd.concat(eps, ignore_index=True) if eps else pd.DataFrame())
