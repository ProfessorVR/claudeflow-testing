"""Per-sample timelines for the figure suite (Phase 6).

The wide, long and episode tables carry summaries; the per-sample series that
produced them are consumed inside r1.extract()/r2.extract() and discarded. Two
required figure families need those series back:

  6a  per-stimulus time series, three panels, eye-closure episodes shaded
  6b  cohort time-series envelope, median + IQR band across subjects

NOTHING HERE REDEFINES A FEATURE. Round 1 series come from the methodology of
record's own read_hmd() + parse_window(), reached through the already-recorded
adapters.r1_cell_frame() wrapper. Round 2 series are read exactly as r2.py reads
them - the same usecols, the same sentinel masking via r2._masked(), the same
adapters.gaze_dev() and adapters.r2_time_seconds(). This module decides only what
is RETAINED from those parsers, and on what grid.

Openness needs two Round 1 columns and they are NOT interchangeable:

  openness           the validity-flag proxy, (validL & validR). This is the
                     per-sample basis of pct_valid_eye, which is the surface the
                     locked pooled eye-closure check is defined on. Any figure
                     showing the reported openness result must plot this one.
  openness_sentinel  the per-eye -1 closure sentinel. This is what r1._closure()
                     segments into the closure episodes, so it is the column that
                     agrees with the shaded regions in the time-series figures.

Round 2 has a single openness measure and it fills `openness`. It is BINARY, not
continuous (verified: {0, 1} only across 3,416,362 per-eye samples), so a binned
mean of it reads as "fraction of that second with the eyes open".

Rate-dependence: gaze_dev is retained per round and is never averaged across
rounds by anything downstream. The cohort envelope draws Round 1 and Round 2 as
separate bands for every channel.

PII: cells are keyed by label only. The cache fingerprint stores (label, stream,
size, mtime) and never a path or a filename, because subject folders and several
Round 1 files are person-named on disk.

Caching: timelines are written to out/_raw/. A rebuild triggers automatically
when the fingerprint changes; delete out/_raw/timeline-*.csv to force one.
"""
import json
import os

import numpy as np
import pandas as pd

import adapters
import config as C
import journal as J
import r2 as _r2

# Harmonised channel names, shared by both rounds.
CHANNELS = ["pupil", "openness", "cognitive_load", "hr", "gaze_dev"]
R1_ONLY = ["openness_sentinel"]
R2_ONLY = ["imu_gyro_mag"]

TL1 = "timeline-r1.csv"
TL2 = "timeline-r2.csv"
FINGERPRINT = "timeline-fingerprint.json"

# Only the columns the timelines need. The Round 2 eye files are ~1.5 GB in
# total across 12 cells; 15 of 32 columns is the difference between a cheap
# rebuild and an expensive one.
_R2_EYE_COLS = {
    "ts/hw", "ts/sys", "ts/omni",
    "cgaze/x", "cgaze/y", "cgaze/z", "cgaze/q",
    "left/openness", "left/openness_q", "left/dilation", "left/dilation_q",
    "right/openness", "right/openness_q", "right/dilation", "right/dilation_q",
}
_R2_IMU_COLS = {"ts/hw", "ts/sys", "ts/omni", "gyro/x", "gyro/y", "gyro/z"}


def _raw_dir():
    return os.path.join(C.OUT, "_raw")


# --------------------------------------------------------------------- grids
def _bin_one(frame, duration):
    """One stream -> (absolute-grid, normalised-grid), both indexed by bin.

    Bin edges come from the cell's own duration, so nothing here depends on the
    wall clock or on iteration order.
    """
    d = frame.dropna(subset=["t"])
    d = d[(d["t"] >= 0) & (d["t"] <= duration)]
    chans = [c for c in d.columns if c != "t"]
    if not chans or duration <= 0:
        return pd.DataFrame(), pd.DataFrame()

    n_abs = int(np.floor(duration / C.TIMELINE_BIN_S)) + 1
    ia = np.floor(d["t"] / C.TIMELINE_BIN_S).astype(int).clip(0, n_abs - 1)
    a = d[chans].groupby(ia, sort=True).mean().reindex(range(n_abs))
    a.index.name = "bin"

    n_norm = C.TIMELINE_NORM_BINS
    inx = np.floor(d["t"] / duration * n_norm).astype(int).clip(0, n_norm - 1)
    n = d[chans].groupby(inx, sort=True).mean().reindex(range(n_norm))
    n.index.name = "bin"
    return a, n


def _bin_cell(streams, duration, sid, stim, rnd, extra=None):
    """Several streams on their own clocks -> one absolute and one normalised row set.

    Round 2 keeps eye, cognitive load, HR and IMU in separate files with separate
    timestamps, so each is binned independently against the same grid and then
    joined on the bin index.
    """
    abs_parts, norm_parts = [], []
    for frame in streams:
        if frame is None or not len(frame):
            continue
        a, n = _bin_one(frame, duration)
        if len(a):
            abs_parts.append(a)
        if len(n):
            norm_parts.append(n)

    def _assemble(parts, n_bins, kind):
        if not parts:
            return pd.DataFrame()
        out = parts[0]
        for p in parts[1:]:
            out = out.join(p, how="outer")
        out = out.reindex(range(n_bins)).reset_index()
        out.insert(0, "subject", sid)
        out.insert(1, "stimulus", stim)
        out.insert(2, "round", rnd)
        out["duration_s"] = duration
        if kind == "abs":
            out["t_s"] = out["bin"] * C.TIMELINE_BIN_S
        else:
            out["t_frac"] = (out["bin"] + 0.5) / n_bins
        for k, v in (extra or {}).items():
            out[k] = v
        return out

    n_abs = int(np.floor(duration / C.TIMELINE_BIN_S)) + 1
    return (_assemble(abs_parts, n_abs, "abs"),
            _assemble(norm_parts, C.TIMELINE_NORM_BINS, "norm"))


# ----------------------------------------------------------------- round one
def _build_r1():
    fp, abs_rows, norm_rows = [], [], []
    for sid, subj in adapters.subject_map():
        ff = adapters.find_files(os.path.join(subj, "HMD"))
        for stim in C.STIMULI:
            path = ff[stim]["crop"]
            if not path:
                raise SystemExit(f"crop-only rule: {sid} {stim} has no _Crop file")
            st = os.stat(path)
            fp.append(dict(label=sid, stimulus=stim, stream="hmd-crop",
                           bytes=st.st_size, mtime=round(st.st_mtime, 3)))

            sig, t, qc, raw = adapters.r1_cell_frame(path)
            step = 1
            if C.TIMELINE_VARIANT == "unified" and (sid, stim) in C.S06_FAST_CELLS:
                # Mirror r1.extract() exactly: decimate the RAW rows, then re-parse
                # the thinned series through the record's own parser.
                _, step = adapters.decimate_r1_cell(raw, C.R1_COHORT_HZ, qc["median_hz"])
                raw = raw.iloc[::step].reset_index(drop=True)
                sig, t, qc = adapters.parse_window(raw.copy())
                for c in ("dilL", "dilR", "validL", "validR"):
                    raw[c] = pd.to_numeric(raw[c], errors="coerce")

            closed = (raw.dilL == C.R1_CLOSED_SENTINEL) & (raw.dilR == C.R1_CLOSED_SENTINEL)
            cell = pd.DataFrame({
                "t": np.asarray(t, float),
                "pupil": pd.concat([sig["left_eye_dilation"], sig["right_eye_dilation"]],
                                   axis=1).mean(axis=1).to_numpy(float),
                "openness": ((raw.validL == 1) & (raw.validR == 1)).to_numpy(float),
                "openness_sentinel": (~closed).to_numpy(float),
                "cognitive_load": np.asarray(sig["cognitive_load"], float),
                "hr": np.asarray(sig["hr"], float),
                "gaze_dev": np.asarray(sig["eye_gaze_deviation"], float),
            })
            a, n = _bin_cell([cell], float(qc["duration_s"]), sid, stim, 1,
                             extra=dict(variant=C.TIMELINE_VARIANT, decimation_step=step))
            abs_rows.append(a)
            norm_rows.append(n)

    return (pd.concat(abs_rows, ignore_index=True),
            pd.concat(norm_rows, ignore_index=True), fp)


# ----------------------------------------------------------------- round two
def _build_r2():
    fp, abs_rows, norm_rows = [], [], []
    sub = adapters.r2_subjects_dir()
    for i, d in enumerate(sorted(os.listdir(sub)), 1):
        sid = f"R2-{i:02d}"
        files, _ = adapters.r2_collect(os.path.join(sub, d))
        for stim in C.STIMULI:
            f = files.get(stim, {})
            if "eye" not in f:
                continue
            for kind in ("eye", "cog", "hr", "imu"):
                if kind in f:
                    st = os.stat(f[kind])
                    fp.append(dict(label=sid, stimulus=stim, stream=kind,
                                   bytes=st.st_size, mtime=round(st.st_mtime, 3)))

            eye = pd.read_csv(f["eye"], usecols=lambda c: c in _R2_EYE_COLS,
                              low_memory=False)
            t, _, _ = adapters.r2_time_seconds(eye)

            # Identical masking to r2.extract().
            q = pd.to_numeric(eye.get("cgaze/q"), errors="coerce")
            gx = pd.to_numeric(eye["cgaze/x"], errors="coerce")
            gy = pd.to_numeric(eye["cgaze/y"], errors="coerce")
            gz = pd.to_numeric(eye["cgaze/z"], errors="coerce")
            bad = (q <= 0) | (gx <= -0.99)
            dev = adapters.gaze_dev(gx.mask(bad), gy.mask(bad), gz.mask(bad))

            dl = _r2._masked(eye, "left/dilation", "left/dilation_q")
            dr = _r2._masked(eye, "right/dilation", "right/dilation_q")
            ol = _r2._masked(eye, "left/openness", "left/openness_q", positive=False)
            orr = _r2._masked(eye, "right/openness", "right/openness_q", positive=False)

            tv = np.asarray(t, float)
            dur = float(np.nanmax(tv)) if np.isfinite(tv).any() else 0.0
            eye_stream = pd.DataFrame({
                "t": tv,
                "pupil": pd.concat([dl, dr], axis=1).mean(axis=1).to_numpy(float),
                "openness": pd.concat([ol, orr], axis=1).mean(axis=1).to_numpy(float),
                "gaze_dev": pd.Series(dev).reindex(range(len(eye))).to_numpy(float),
            })
            del eye, gx, gy, gz, q, bad, dev, dl, dr, ol, orr

            streams = [eye_stream]
            if "cog" in f:
                c = pd.read_csv(f["cog"], low_memory=False)
                ct, _, _ = adapters.r2_time_seconds(c)
                v = pd.to_numeric(c.get("clvalue"), errors="coerce")
                streams.append(pd.DataFrame({"t": np.asarray(ct, float),
                                             "cognitive_load": v.mask(v <= 0).to_numpy(float)}))
                del c
            if "hr" in f:
                h = pd.read_csv(f["hr"], low_memory=False)
                ht, _, _ = adapters.r2_time_seconds(h)
                v = pd.to_numeric(h.get("rate"), errors="coerce")
                streams.append(pd.DataFrame({"t": np.asarray(ht, float),
                                             "hr": v.mask(v <= 0).to_numpy(float)}))
                del h
            if "imu" in f:
                m = pd.read_csv(f["imu"], usecols=lambda c: c in _R2_IMU_COLS,
                                low_memory=False)
                mt, _, _ = adapters.r2_time_seconds(m)
                gyr = np.sqrt(sum(pd.to_numeric(m[f"gyro/{a}"], errors="coerce") ** 2
                                  for a in "xyz"))
                streams.append(pd.DataFrame({"t": np.asarray(mt, float),
                                             "imu_gyro_mag": gyr.to_numpy(float)}))
                del m, gyr

            a, n = _bin_cell(streams, dur, sid, stim, 2, extra=dict(variant="native"))
            abs_rows.append(a)
            norm_rows.append(n)
            del streams, eye_stream

    return (pd.concat(abs_rows, ignore_index=True),
            pd.concat(norm_rows, ignore_index=True), fp)


# ------------------------------------------------------------------- caching
def _tidy(frame, kind):
    """Stable column order and sort, so the cached files are deterministic."""
    lead = ["subject", "stimulus", "round", "variant", "bin",
            "t_s" if kind == "abs" else "t_frac", "duration_s"]
    lead = [c for c in lead if c in frame.columns]
    rest = [c for c in frame.columns if c not in lead]
    out = frame[lead + sorted(rest)]
    return out.sort_values(["subject", "stimulus", "bin"]).reset_index(drop=True)


def _paths():
    r = _raw_dir()
    return (os.path.join(r, TL1), os.path.join(r, TL2), os.path.join(r, FINGERPRINT))


def build(force=False):
    """-> {'r1_abs','r1_norm','r2_abs','r2_norm'}, rebuilding only when stale."""
    p1, p2, pf = _paths()

    if not force and all(os.path.exists(p) for p in (p1, p2, pf)):
        try:
            cached = json.load(open(pf))
        except (ValueError, OSError):
            cached = None
        if cached is not None:
            d1 = pd.read_csv(p1)
            d2 = pd.read_csv(p2)
            now = _fingerprint_only()
            if cached.get("sources") == now["sources"] and cached.get("params") == now["params"]:
                return _split(d1, d2)

    a1, n1, fp1 = _build_r1()
    a2, n2, fp2 = _build_r2()
    a1, n1 = _tidy(a1, "abs"), _tidy(n1, "norm")
    a2, n2 = _tidy(a2, "abs"), _tidy(n2, "norm")

    d1 = pd.concat([a1.assign(grid="abs"), n1.assign(grid="norm")], ignore_index=True)
    d2 = pd.concat([a2.assign(grid="abs"), n2.assign(grid="norm")], ignore_index=True)
    J.write_csv(d1, p1)
    J.write_csv(d2, p2)

    payload = dict(sources=fp1 + fp2, params=_params())
    J.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", pf)
    J.note("timelines",
           f"per-sample series rebinned to a {C.TIMELINE_BIN_S:g} s absolute grid and a "
           f"{C.TIMELINE_NORM_BINS}-bin normalised grid; Round 1 on the "
           f"{C.TIMELINE_VARIANT} rate variant. Feature definitions are unchanged - "
           f"the same parsers produce the series, this only retains them.")
    return _split(d1, d2)


def _params():
    return dict(bin_s=C.TIMELINE_BIN_S, norm_bins=C.TIMELINE_NORM_BINS,
                variant=C.TIMELINE_VARIANT, cohort_hz=C.R1_COHORT_HZ,
                closed_sentinel=C.R1_CLOSED_SENTINEL)


def _fingerprint_only():
    """Source inventory without reading any sample data. Labels only, never paths."""
    fp = []
    for sid, subj in adapters.subject_map():
        ff = adapters.find_files(os.path.join(subj, "HMD"))
        for stim in C.STIMULI:
            p = ff[stim]["crop"]
            if p:
                st = os.stat(p)
                fp.append(dict(label=sid, stimulus=stim, stream="hmd-crop",
                               bytes=st.st_size, mtime=round(st.st_mtime, 3)))
    sub = adapters.r2_subjects_dir()
    for i, d in enumerate(sorted(os.listdir(sub)), 1):
        sid = f"R2-{i:02d}"
        files, _ = adapters.r2_collect(os.path.join(sub, d))
        for stim in C.STIMULI:
            for kind in ("eye", "cog", "hr", "imu"):
                p = files.get(stim, {}).get(kind)
                if p:
                    st = os.stat(p)
                    fp.append(dict(label=sid, stimulus=stim, stream=kind,
                                   bytes=st.st_size, mtime=round(st.st_mtime, 3)))
    return dict(sources=fp, params=_params())


def _split(d1, d2):
    return dict(r1_abs=d1[d1.grid == "abs"].reset_index(drop=True),
                r1_norm=d1[d1.grid == "norm"].reset_index(drop=True),
                r2_abs=d2[d2.grid == "abs"].reset_index(drop=True),
                r2_norm=d2[d2.grid == "norm"].reset_index(drop=True))


def combined(tl, grid="abs"):
    """Both rounds on one frame, for figures that plot them side by side.

    Concatenation is for LAYOUT only. Nothing downstream averages a rate-dependent
    channel across the round boundary; the `round` column is carried so every
    consumer can and must separate them.
    """
    return pd.concat([tl[f"r1_{grid}"], tl[f"r2_{grid}"]], ignore_index=True)


if __name__ == "__main__":
    tl = build(force=True)
    for k, v in sorted(tl.items()):
        print(f"{k:10s} {len(v):7d} rows  "
              f"{v.subject.nunique()} subjects x {v.stimulus.nunique()} stimuli")
