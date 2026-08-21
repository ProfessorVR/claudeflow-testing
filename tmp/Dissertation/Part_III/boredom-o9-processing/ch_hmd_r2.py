"""ch-hmd, ROUND 2 — raw HP Omnicept SDK export, parsed to the SAME feature schema as ch_hmd.py.

Methodology is mirrored from scripts/boredom-o9/ch_hmd.py line for line:
  * gaze deviation  = Euclidean distance of combined gaze from the per-file MEDIAN gaze direction,
                      then a 5-point CENTERED rolling median (min_periods=1)   [King & Salvo ASEE 2024]
  * gaze_dev_variance = sd**2 of that filtered deviation
  * pupil          = per-eye dilation means; dil_mean_bilateral = nanmean(left_mean, right_mean)
  * sentinels      = vendor 'no reading' masked to NaN before any aggregate
  * per-signal stats = mean/median/sd/min/max/slope/delta_last_first_third
  * window         = Round 2 has NO crop re-export, so 'full' is used and FLAGGED, exactly as
                     ch_hmd.py does when a crop is absent.

Round-2-specific facts (verified 2026-07-29):
  * uniform 120.0 Hz (Round 1 was bursty/bimodal at ~3.3-5.7 Hz effective)
  * NO HRV stream and NO EEG anywhere in Round 2 -> those columns are NaN, and stay N=8
  * quality flags (`*_q`) replace Round 1's binary validity flags; 0 = unusable, plus -1 value sentinels

PII: subjects are labelled R2-01..R2-04 by sorted folder order. No participant name is read into any
output field; source paths are never emitted.
"""
import os
import re
import sys

import numpy as np
import pandas as pd

ROOT = "/mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2"
OUT = os.path.dirname(os.path.abspath(__file__))
STIMULI = ("BOR", "CLC", "INT")
ARO = ["cognitive_load", "hr", "hrv", "left_eye_dilation", "right_eye_dilation", "eye_gaze_deviation"]
R1_MEDIAN_HZ = 3.3          # Round 1's effective median rate, for the poolability check


def norm_stim(s):
    s = s.lower()
    if "bor" in s:
        return "BOR"
    if "clinical" in s or "clc" in s:
        return "CLC"
    if "interest" in s or "int" in s:
        return "INT"
    return None


def subjects_dir():
    for r, d, _ in os.walk(ROOT):
        if os.path.basename(r) == "Subjects":
            return r
    raise SystemExit("Subjects/ not found")


def ncols(path):
    with open(path, errors="replace") as fh:
        return fh.readline().count(",") + 1


def collect(subj_path):
    """-> {stim: {'eye': p, 'cog': p, 'hr': p, 'imu': p}} ; largest file wins on duplicates."""
    out = {s: {} for s in STIMULI}
    for r, _, fs in os.walk(subj_path):
        for f in fs:
            if not f.lower().endswith(".csv"):
                continue
            p = os.path.join(r, f)
            if os.path.getsize(p) == 0:
                continue
            stim = norm_stim(os.path.relpath(r, subj_path)) or norm_stim(f)
            if stim is None:
                continue
            kind = {32: "eye", 8: "cog", 7: "hr", 16: "imu"}.get(ncols(p))
            if kind is None:
                continue
            prev = out[stim].get(kind)
            if prev is None or os.path.getsize(p) > os.path.getsize(prev):
                out[stim][kind] = p
    return out


def tsec(df):
    """microsecond epoch -> seconds from first sample; robust to 0/garbage rows."""
    for c in ("ts/sys", "ts/omni", "ts/hw"):
        if c in df.columns:
            v = pd.to_numeric(df[c], errors="coerce")
            v = v.where(v > 0)
            if v.notna().sum() > 10:
                return (v - v.min()) / 1e6
    return pd.Series(np.arange(len(df), dtype=float) / 120.0)


def stats(v, t):
    vv = pd.Series(v).astype(float).dropna()
    if len(vv) < 3:
        return {k: np.nan for k in
                ["mean", "median", "sd", "min", "max", "slope", "delta_last_first_third"]}
    tt = pd.Series(t).astype(float).reindex(vv.index)
    ok = tt.notna()
    slope = float(np.polyfit(tt[ok], vv[ok], 1)[0]) if ok.sum() > 2 else np.nan
    third = max(1, len(vv) // 3)
    delta = float(vv.iloc[-third:].mean() - vv.iloc[:third].mean())
    return {"mean": float(vv.mean()), "median": float(vv.median()), "sd": float(vv.std()),
            "min": float(vv.min()), "max": float(vv.max()), "slope": slope,
            "delta_last_first_third": delta}


def gaze_dev(gx, gy, gz, decimate_to=None, hz=120.0):
    """ch_hmd.py's definition, optionally on a decimated series (poolability check)."""
    d = pd.DataFrame({"x": gx, "y": gy, "z": gz}).dropna()
    if len(d) < 10:
        return pd.Series(dtype=float)
    if decimate_to:
        step = max(1, int(round(hz / decimate_to)))
        d = d.iloc[::step]
    cx, cy, cz = d.x.median(), d.y.median(), d.z.median()
    dev = np.sqrt((d.x - cx) ** 2 + (d.y - cy) ** 2 + (d.z - cz) ** 2)
    return dev.rolling(5, center=True, min_periods=1).median()


def main():
    SUB = subjects_dir()
    wide_rows, qc_rows, long_rows = [], [], []
    for i, sd in enumerate(sorted(os.listdir(SUB)), 1):
        sid = f"R2-{i:02d}"
        files = collect(os.path.join(SUB, sd))
        for stim in STIMULI:
            f = files.get(stim, {})
            if "eye" not in f:
                qc_rows.append(dict(subject=sid, stimulus=stim, note="NO-EYE-STREAM"))
                continue
            eye = pd.read_csv(f["eye"], low_memory=False)
            t = tsec(eye)

            # --- gaze: mask on quality flag + -1 sentinel (Round 1 masked flag + gx<=-0.99) ---
            q = pd.to_numeric(eye.get("cgaze/q"), errors="coerce")
            gx = pd.to_numeric(eye["cgaze/x"], errors="coerce")
            gy = pd.to_numeric(eye["cgaze/y"], errors="coerce")
            gz = pd.to_numeric(eye["cgaze/z"], errors="coerce")
            bad = (q <= 0) | (gx <= -0.99)
            gx, gy, gz = gx.mask(bad), gy.mask(bad), gz.mask(bad)
            dev = gaze_dev(gx, gy, gz)
            dev_dec = gaze_dev(gx, gy, gz, decimate_to=R1_MEDIAN_HZ)

            # --- pupil: mask on quality flag + non-positive sentinel ---
            def dil(side):
                v = pd.to_numeric(eye.get(f"{side}/dilation"), errors="coerce")
                vq = pd.to_numeric(eye.get(f"{side}/dilation_q"), errors="coerce")
                return v.mask((vq <= 0) | (v <= 0))
            dl, dr = dil("left"), dil("right")

            # --- openness (NEW channel, Round 2 only) ---
            def openness(side):
                v = pd.to_numeric(eye.get(f"{side}/openness"), errors="coerce")
                vq = pd.to_numeric(eye.get(f"{side}/openness_q"), errors="coerce")
                return v.mask((vq <= 0) | (v < 0))
            ol, orr = openness("left"), openness("right")

            # --- cognitive load / HR from their own streams ---
            cog = pd.Series(dtype=float); cog_t = pd.Series(dtype=float)
            if "cog" in f:
                c = pd.read_csv(f["cog"], low_memory=False)
                cog = pd.to_numeric(c.get("clvalue"), errors="coerce"); cog = cog.mask(cog <= 0)
                cog_t = tsec(c)
            hr = pd.Series(dtype=float); hr_t = pd.Series(dtype=float)
            if "hr" in f:
                h = pd.read_csv(f["hr"], low_memory=False)
                hr = pd.to_numeric(h.get("rate"), errors="coerce"); hr = hr.mask(hr <= 0)
                hr_t = tsec(h)

            sig = {"cognitive_load": (cog, cog_t), "hr": (hr, hr_t),
                   "hrv": (pd.Series(dtype=float), pd.Series(dtype=float)),   # absent in Round 2
                   "left_eye_dilation": (dl, t), "right_eye_dilation": (dr, t),
                   "eye_gaze_deviation": (dev, pd.Series(t).reindex(dev.index))}

            wide = dict(subject=sid, stimulus=stim, window="full",
                        n_samples=len(eye), duration_s=round(float(t.max()), 1))
            for name in ARO:
                v, tt = sig[name]
                st = stats(v, tt)
                for k, val in st.items():
                    long_rows.append(dict(subject=sid, stimulus=stim, window="full",
                                          signal=name, stat=k, value=val))
                wide[f"{name}_mean"] = st["mean"]
                if name == "eye_gaze_deviation":
                    wide["gaze_dev_median"] = st["median"]
                    wide["gaze_dev_variance"] = st["sd"] ** 2 if st["sd"] == st["sd"] else np.nan
                if name in ("hr", "cognitive_load"):
                    wide[f"{name}_slope"] = st["slope"]
            wide["dil_mean_bilateral"] = np.nanmean(
                [wide["left_eye_dilation_mean"], wide["right_eye_dilation_mean"]])
            # Round-2-only extras
            sdd = stats(dev_dec, None)
            wide["gaze_dev_variance_dec3hz"] = sdd["sd"] ** 2 if sdd["sd"] == sdd["sd"] else np.nan
            wide["openness_mean_bilateral"] = np.nanmean(
                [stats(ol, t)["mean"], stats(orr, t)["mean"]])
            wide_rows.append(wide)

            dt = np.diff(pd.Series(t).dropna().values)
            dt = dt[dt > 0]
            qc_rows.append(dict(
                subject=sid, stimulus=stim, n_rows=len(eye),
                mean_hz=round(len(eye) / float(t.max()), 2) if t.max() else np.nan,
                median_hz=round(1.0 / float(np.median(dt)), 2) if len(dt) else np.nan,
                duration_s=round(float(t.max()), 1),
                pct_valid_gaze=round(float((~bad).mean() * 100), 1),
                has_hr=("hr" in f), has_imu=("imu" in f), has_cog=("cog" in f),
                note="no-crop-window;full-used"))

    pd.DataFrame(wide_rows).to_csv(os.path.join(OUT, "r2-hmd-wide.csv"), index=False)
    pd.DataFrame(qc_rows).to_csv(os.path.join(OUT, "r2-hmd-qc.csv"), index=False)
    pd.DataFrame(long_rows).to_csv(os.path.join(OUT, "r2-hmd-long.csv"), index=False)
    print(f"ch-hmd R2 done: {len(wide_rows)} (subject x stimulus) cells of 12 expected")
    cols = ["subject", "stimulus", "dil_mean_bilateral", "cognitive_load_mean", "hr_mean",
            "gaze_dev_variance", "gaze_dev_variance_dec3hz", "openness_mean_bilateral", "duration_s"]
    print(pd.DataFrame(wide_rows)[cols].to_string(index=False))


if __name__ == "__main__":
    main()
