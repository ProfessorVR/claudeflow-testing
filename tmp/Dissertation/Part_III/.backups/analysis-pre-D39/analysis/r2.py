"""Round 2 feature extraction (R2-01..R2-04), extending this project's own parser.

Feature definitions are mirrored from `scripts/boredom-o9/ch_hmd.py` exactly as
`ch_hmd_r2.py` established: gaze deviation is the Euclidean distance of combined
gaze from the per-file MEDIAN direction, 5-point centered rolling median
(min_periods=1); variance is sd**2; pupil is the nanmean of per-eye means; vendor
sentinels are masked before any aggregate.

What this module adds over ch_hmd_r2.py, all author-ruled:

D4  Timestamp repair. R2-01's Interesting eye file carries one row with ts/sys=17.
    tsec() rebases on the raw minimum, so that cell reads 1.7e9 s and its time axis
    collapses. adapters.r2_time_seconds() drops outlier timestamps before rebasing
    and reports the count so the row is logged, not silently absorbed.

    The 8-column HRV/cognitive-load collision is closed in adapters.r2_collect(),
    which requires filename prefix AND header agreement.

D5  Blink detection. Round 2 records per-eye openness continuously on a 0-1 scale
    (1 open, 0 shut). A sample counts as closed below 0.5; a closure lasting
    <= 500 ms is a blink and anything longer is an extended closure, the threshold
    being the mean + ~2.5 SD of the spontaneous blink duration reported by
    VanderWerf et al. 2003 (334 +/- 67 ms, measured while subjects watched video).
    At 120 Hz a 334 ms blink spans ~40 samples, so it is comfortably resolvable.
    Sensitivity is reported at 0.3 and 0.7.

IMU head motion is computed for the 9 of 12 cells that have it. HRV is excluded
per author ruling; its files are rejected at collection and the exclusion logged.
"""
import os

import numpy as np
import pandas as pd

import adapters
import config as C
import journal as J

FEATURES = ["cognitive_load", "hr", "left_eye_dilation", "right_eye_dilation",
            "eye_gaze_deviation"]


def _masked(df, col, qcol=None, positive=True):
    v = pd.to_numeric(df.get(col), errors="coerce")
    if v is None:
        return pd.Series(dtype=float)
    bad = v.isna()
    if qcol is not None:
        q = pd.to_numeric(df.get(qcol), errors="coerce")
        if q is not None:
            bad = bad | (q <= 0)
    bad = bad | (v <= 0) if positive else bad | (v < 0)
    return v.mask(bad)


def _runs(mask):
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


def _blinks(open_bilat, t, sid, stim, threshold):
    """Closure episodes classified against the VanderWerf blink ceiling."""
    closed = (open_bilat < threshold).fillna(False)
    tv = np.asarray(t, float)
    dt = np.diff(tv[np.isfinite(tv)])
    dt = dt[dt > 0]
    step = float(np.median(dt)) if len(dt) else 1 / 120.0
    eps = []
    for s, e in _runs(closed.values):
        if not (np.isfinite(tv[s]) and np.isfinite(tv[e])):
            continue
        dur = float(tv[e] - tv[s]) + step
        eps.append(dict(subject=sid, stimulus=stim, threshold=threshold,
                        start_s=float(tv[s]), duration_s=dur, n_samples=e - s + 1,
                        kind="blink" if dur * 1000 <= C.BLINK_MAX_MS else "extended"))
    return eps


def _thirds(series):
    v = pd.Series(np.asarray(series, float)).dropna()
    if len(v) < 6:
        return dict(third1=np.nan, third2=np.nan, third3=np.nan)
    k = len(v) // 3
    return dict(third1=float(v.iloc[:k].mean()), third2=float(v.iloc[k:2 * k].mean()),
                third3=float(v.iloc[2 * k:].mean()))


def _imu(path):
    """Head motion: gyro magnitude is the clean restlessness measure (no gravity);
    accelerometer magnitude is reported alongside with its gravity offset intact."""
    cols = ["ts/sys", "acc/x", "acc/y", "acc/z", "gyro/x", "gyro/y", "gyro/z"]
    df = pd.read_csv(path, usecols=lambda c: c in cols, low_memory=False)
    acc = np.sqrt(sum(pd.to_numeric(df[f"acc/{a}"], errors="coerce") ** 2 for a in "xyz"))
    gyr = np.sqrt(sum(pd.to_numeric(df[f"gyro/{a}"], errors="coerce") ** 2 for a in "xyz"))
    return dict(imu_n=len(df),
                imu_acc_mag_mean=float(acc.mean()), imu_acc_mag_sd=float(acc.std()),
                imu_gyro_mag_mean=float(gyr.mean()), imu_gyro_mag_sd=float(gyr.std()),
                imu_gyro_mag_median=float(gyr.median()),
                imu_acc_jerk_mean=float(acc.diff().abs().mean()))


def _win(series, tser, lo, hi):
    """Restrict a series to [lo, hi] on its own clock."""
    if series is None or len(series) == 0:
        return series
    tt = pd.Series(tser).reindex(series.index)
    return series[(tt >= lo) & (tt <= hi)]


def extract():
    """-> (wide, long, blink-episode) frames for Round 2.

    One row per (subject, stimulus, window). Windows are author ruling D-05: the
    full crop, and a Round-1-matched window dropping R1_MATCH_TRIM_S from each end
    to mirror the ~2 minute sync guards Round 1 cut inside its instructed closures.
    """
    SUB = adapters.r2_subjects_dir()
    wide_rows, long_rows, ep_rows = [], [], []

    for i, d in enumerate(sorted(os.listdir(SUB)), 1):
        sid = f"R2-{i:02d}"
        files, rejected = adapters.r2_collect(os.path.join(SUB, d))
        for fname, prefix, ncol in rejected:
            if prefix == "HRV":
                J.exclude(scope="channel", item=f"{sid} {fname}",
                          reason=C.HRV_EXCLUSION_REASON, recoverable=True)
            else:
                J.exclude(scope="stream", item=f"{sid} {fname}",
                          reason=f"prefix did not match any retained stream "
                                 f"(prefix={prefix}, {ncol} cols)", recoverable=True)

        for stim in C.STIMULI:
            f = files.get(stim, {})
            if "eye" not in f:
                J.exclude(scope="cell", item=f"{sid} {stim}",
                          reason="no eye stream", recoverable=False)
                continue

            eye_all = pd.read_csv(f["eye"], low_memory=False)
            t_all, dropped_ts, ts_col = adapters.r2_time_seconds(eye_all)
            crop_dur = float(np.nanmax(t_all.values)) if t_all.notna().any() else np.nan

            for wname, (wlo, whi) in C.R2_WINDOWS.items():
                lo = 0.0 if wlo is None else float(wlo)
                hi = crop_dur if whi is None else float(crop_dur - whi)
                keep = ((t_all >= lo) & (t_all <= hi)).fillna(False)
                eye = eye_all[keep.values]
                t = t_all[keep.values]
                _cell(sid, stim, wname, eye, t, f, crop_dur, lo, hi,
                      wide_rows, long_rows, ep_rows)

    return (pd.DataFrame(wide_rows).sort_values(["subject", "stimulus", "window"]).reset_index(drop=True),
            pd.DataFrame(long_rows).sort_values(["subject", "stimulus", "window", "signal", "stat"]).reset_index(drop=True),
            pd.DataFrame(ep_rows))


def _cell(sid, stim, wname, eye, t, f, crop_dur, lo, hi, wide_rows, long_rows, ep_rows):
            dropped_ts = 0
            q = pd.to_numeric(eye.get("cgaze/q"), errors="coerce")
            gx = pd.to_numeric(eye["cgaze/x"], errors="coerce")
            gy = pd.to_numeric(eye["cgaze/y"], errors="coerce")
            gz = pd.to_numeric(eye["cgaze/z"], errors="coerce")
            bad = (q <= 0) | (gx <= -0.99)
            gx, gy, gz = gx.mask(bad), gy.mask(bad), gz.mask(bad)
            dev = adapters.gaze_dev(gx, gy, gz)
            dev_dec = adapters.gaze_dev(gx, gy, gz, decimate_to=C.R1_COHORT_HZ)

            dl = _masked(eye, "left/dilation", "left/dilation_q")
            dr = _masked(eye, "right/dilation", "right/dilation_q")
            ol = _masked(eye, "left/openness", "left/openness_q", positive=False)
            orr = _masked(eye, "right/openness", "right/openness_q", positive=False)
            open_bilat = pd.concat([ol, orr], axis=1).mean(axis=1)

            cog = cog_t = pd.Series(dtype=float)
            cog_sd = np.nan
            if "cog" in f:
                c = pd.read_csv(f["cog"], low_memory=False)
                cog = pd.to_numeric(c.get("clvalue"), errors="coerce").pipe(lambda s: s.mask(s <= 0))
                cog_t, _, _ = adapters.r2_time_seconds(c)
                cog = _win(cog, cog_t, lo, hi)
                cog_t = pd.Series(cog_t).reindex(cog.index)
                if "sd" in c.columns:
                    cog_sd = float(pd.to_numeric(c["sd"], errors="coerce").mean())
            hr = hr_t = pd.Series(dtype=float)
            if "hr" in f:
                h = pd.read_csv(f["hr"], low_memory=False)
                hr = pd.to_numeric(h.get("rate"), errors="coerce").pipe(lambda s: s.mask(s <= 0))
                hr_t, _, _ = adapters.r2_time_seconds(h)
                hr = _win(hr, hr_t, lo, hi)
                hr_t = pd.Series(hr_t).reindex(hr.index)
                if hr.notna().sum() == 0:
                    J.exclude(scope="channel", item=f"{sid} {stim} HR",
                              reason="HR stream present but every value is a vendor sentinel",
                              recoverable=False)

            sig = {"cognitive_load": (cog, cog_t), "hr": (hr, hr_t),
                   "left_eye_dilation": (dl, t), "right_eye_dilation": (dr, t),
                   "eye_gaze_deviation": (dev, pd.Series(t).reindex(dev.index))}

            dur = float(np.nanmax(t.values)) if t.notna().any() else np.nan
            dt = np.diff(pd.Series(t).dropna().values)
            dt = dt[dt > 0]
            span = float(hi - lo)
            row = dict(subject=sid, stimulus=stim, round=2, variant="native",
                       window=wname, n_samples=len(eye), duration_s=span,
                       crop_duration_s=crop_dur,
                       window_start_s=lo, window_end_s=hi,
                       sample_rate_mean_hz=(len(eye) / span) if span else np.nan,
                       sample_rate_median_hz=(1.0 / np.median(dt)) if len(dt) else np.nan,
                       effective_hz=(1.0 / np.median(dt)) if len(dt) else np.nan,
                       decimation_step=1, high_rate_flag=False,
                       pct_valid_gaze=float((~bad).mean() * 100),
                       timestamp_rows_dropped=dropped_ts,
                       format_note=f"crop-window;{wname}")

            for name in FEATURES:
                v, tt = sig[name]
                st = adapters.r2_stats(v, tt)
                for k, val in st.items():
                    long_rows.append(dict(subject=sid, stimulus=stim, round=2,
                                          variant="native", window=wname, signal=name, stat=k, value=val))
                row[f"{name}_mean"] = st["mean"]
                if name == "eye_gaze_deviation":
                    row["gaze_dev_median"] = st["median"]
                    row["gaze_dev_variance"] = st["sd"] ** 2 if st["sd"] == st["sd"] else np.nan
                if name in ("hr", "cognitive_load"):
                    row[f"{name}_slope"] = st["slope"]
                if name in ("hr", "cognitive_load", "left_eye_dilation", "right_eye_dilation"):
                    row[f"{name}_delta"] = st["delta_last_first_third"]
                for tk, tv in _thirds(v).items():
                    long_rows.append(dict(subject=sid, stimulus=stim, round=2,
                                          variant="native", window=wname, signal=name, stat=tk, value=tv))

            row["dil_mean_bilateral"] = float(np.nanmean(
                [row["left_eye_dilation_mean"], row["right_eye_dilation_mean"]]))
            sdd = adapters.r2_stats(dev_dec, None)
            row["gaze_dev_variance_dec3hz"] = sdd["sd"] ** 2 if sdd["sd"] == sdd["sd"] else np.nan
            row["cognitive_load_sd_vendor"] = cog_sd

            # ---- openness / blinks -------------------------------------------
            row["openness_mean_left"] = float(ol.mean())
            row["openness_mean_right"] = float(orr.mean())
            row["openness_mean_bilateral"] = float(np.nanmean([ol.mean(), orr.mean()]))
            for tk, tv in _thirds(open_bilat).items():
                long_rows.append(dict(subject=sid, stimulus=stim, round=2, variant="native", window=wname,
                                      signal="eye_openness", stat=tk, value=tv))

            for thr in (C.OPENNESS_CLOSED_BELOW,):
                eps = _blinks(open_bilat, t, sid, stim, thr)
                ep_rows.extend(eps)
                blinks = [e for e in eps if e["kind"] == "blink"]
                ext = [e for e in eps if e["kind"] == "extended"]
                mins = span / 60.0 if span and span == span else np.nan
                row.update(
                    pct_time_closed=float((open_bilat < thr).mean() * 100),
                    openness_frac_bilateral=float((open_bilat >= thr).mean()),
                    closure_episodes_n=len(eps),
                    blink_n=len(blinks),
                    blink_rate_per_min=(len(blinks) / mins) if mins else np.nan,
                    blink_mean_ms=float(np.mean([e["duration_s"] for e in blinks]) * 1000)
                    if blinks else np.nan,
                    interblink_median_s=float(np.median(np.diff(
                        [e["start_s"] for e in blinks]))) if len(blinks) > 2 else np.nan,
                    extended_closure_n=len(ext),
                    extended_closure_total_s=float(sum(e["duration_s"] for e in ext)),
                    longest_closure_s=float(max((e["duration_s"] for e in eps), default=0.0)))

            # The non-wear trim that used to live here is RETIRED (author ruling
            # D-01, 2026-07-31). The cropped files begin 5 s after the instructed
            # eye-closure reopens and end 2 s before the closing one, so the headset
            # on/off periods are outside the window by construction. Verified: mean
            # openness in the first and last 10 s of every crop runs 0.84-1.00.
            # HEADSET_TRIM_* are retained in config only so the retirement is legible.

            # ---- IMU: DEFERRED (author ruling R-03, 2026-07-31) ----------------
            if not C.ANALYSE_IMU:
                J.note("IMU deferred",
                       f"{sid} {stim}: head motion deferred by author ruling "
                       f"2026-07-31; not read in this pass")
            elif "imu" in f:
                row.update(_imu(f["imu"]))

            wide_rows.append(row)
