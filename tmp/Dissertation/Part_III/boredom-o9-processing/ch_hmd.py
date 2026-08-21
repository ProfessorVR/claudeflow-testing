#!/usr/bin/env python
"""ch-hmd O-9 processing: parse the already-exported Omnicept CSVs -> arousal/attention features.
Run with /home/dalton/.venv/bin/python (needs pandas + openpyxl).
Outputs (S01..S08 only, no names): out/ch-hmd-long.csv, out/ch-hmd-wide.csv, out/ch-hmd-qc.csv
"""
import os, re, glob
import numpy as np
import pandas as pd
from common import subject_map, norm_stim, norm_token, STIMULI

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")

COLS = ["hh", "mm", "ss", "ms", "gaze", "dilL", "dilR", "validL", "validR", "cogload", "hr", "hrv"]
ARO = ["cognitive_load", "hr", "hrv", "left_eye_dilation", "right_eye_dilation", "eye_gaze_deviation"]
GVEC = re.compile(r"X=(-?[\d.]+)\s+Y=(-?[\d.]+)\s+Z=(-?[\d.]+)")


def find_files(hmd_dir):
    """-> {stim: {'crop': path|None, 'full': path|None, 'note': str}}"""
    files = [f for f in os.listdir(hmd_dir) if f.lower().endswith((".csv", ".xlsx"))]
    out = {s: {"crop": None, "full": None, "note": ""} for s in STIMULI}
    for s in STIMULI:
        cand = [f for f in files if norm_stim(os.path.splitext(f)[0]) == s]
        crops = [f for f in cand if "crop" in norm_token(f)]
        fulls = [f for f in cand if "crop" not in norm_token(f)]
        # drop the '_Crop 2' duplicate: a crop whose normalized stem ends in a digit
        crops_clean = [f for f in crops if not re.search(r"\d$", norm_token(os.path.splitext(f)[0]))]
        crops_use = crops_clean or crops
        if crops_use:
            crops_use.sort(key=len)  # prefer the plain '_Crop.csv' (shortest)
            out[s]["crop"] = os.path.join(hmd_dir, crops_use[0])
            if crops_use[0].lower().endswith(".xlsx"):
                out[s]["note"] += "xlsx-crop;"
            if len(crops) > 1:
                out[s]["note"] += "dup-crop;"
        if fulls:
            fulls.sort(key=len)
            out[s]["full"] = os.path.join(hmd_dir, fulls[0])
        if not out[s]["crop"]:
            out[s]["note"] += "no-crop;"
    return out


def read_hmd(path):
    """Normalize both layouts to 12 cols. 12-col = H,M,S,ms + 8 signals (comma).
    9-col variant (some S07 Boring files) = 'HH:MM:SS:ms' colon-timestamp + the same 8 signals."""
    if path.lower().endswith(".xlsx"):
        df = pd.read_excel(path, header=None, engine="openpyxl")
    else:
        df = pd.read_csv(path, header=None, dtype=str)
    nc = df.shape[1]
    if nc == 9:
        ts = df.iloc[:, 0].astype(str).str.split(":", expand=True)
        if ts.shape[1] < 4:
            raise ValueError("9-col colon-timestamp split failed")
        norm = pd.concat([ts.iloc[:, :4].reset_index(drop=True),
                          df.iloc[:, 1:9].reset_index(drop=True)], axis=1)
        norm.columns = COLS
        return norm
    if nc >= 12:
        d = df.iloc[:, :12].copy()
        d.columns = COLS
        return d
    raise ValueError(f"unexpected col count {nc}")


def parse_window(df):
    """Return per-signal float series (NaN-masked) + time(s, relative) + qc dict."""
    for c in ["hh", "mm", "ss", "ms", "dilL", "dilR", "validL", "validR", "cogload", "hr", "hrv"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    t = df.hh * 3600 + df.mm * 60 + df.ss + df.ms / 1000.0
    t = t - t.iloc[0]
    # gaze vector
    g = df.gaze.astype(str).str.extract(GVEC).astype(float)
    g.columns = ["gx", "gy", "gz"]
    # validity masks
    vL = df.validL == 1
    vR = df.validR == 1
    dilL = df.dilL.where(vL & (df.dilL > -0.5))
    dilR = df.dilR.where(vR & (df.dilR > -0.5))
    gvalid = vL & (g.gx > -0.99)  # invalid rows carry X=-1
    gx = g.gx.where(gvalid); gy = g.gy.where(gvalid); gz = g.gz.where(gvalid)
    # HR/HRV/cognitive-load: 0 (and negative) = vendor 'no reading'/lock-on sentinel -> NaN
    hr = df.hr.where(df.hr > 0)
    hrv = df.hrv.where(df.hrv > 0)
    cog = df.cogload.where(df.cogload > 0)
    # gaze deviation from center (PAPER, King & Salvo ASEE 2024): a 5-point sliding-window MEDIAN filter of
    # the Euclidean distance from center; center/neutral = the median gaze direction (looking-forward baseline).
    # The paper's two gaze features are the MEDIAN of this deviation and its VARIANCE (higher variance = more
    # boredom / searching gaze; lower = engaged or 'zombie stare').
    cx, cy, cz = np.nanmedian(gx), np.nanmedian(gy), np.nanmedian(gz)
    dev = np.sqrt((gx - cx) ** 2 + (gy - cy) ** 2 + (gz - cz) ** 2)
    dev_med = pd.Series(dev).rolling(5, center=True, min_periods=1).median()
    sig = {
        "cognitive_load": cog,
        "hr": hr,
        "hrv": hrv,
        "left_eye_dilation": dilL,
        "right_eye_dilation": dilR,
        "eye_gaze_deviation": dev_med,
    }
    # sampling QC
    dt = np.diff(t.values)
    dt = dt[dt > 0]
    mean_hz = 1.0 / np.mean(dt) if len(dt) else np.nan
    med_hz = 1.0 / np.median(dt) if len(dt) else np.nan
    qc = {
        "n_rows": len(df),
        "mean_hz": round(float(mean_hz), 3),
        "median_hz": round(float(med_hz), 3),
        "duration_s": round(float(t.iloc[-1]), 1),
        "pct_valid_eye": round(float((vL & vR).mean() * 100), 1),
        "pct_hr_valid": round(float((df.hr > 0).mean() * 100), 1),
    }
    return sig, t, qc


def stats(v, t):
    v = pd.Series(np.asarray(v, float)); t = pd.Series(np.asarray(t, float))
    m = v.notna()
    if m.sum() < 3:
        return {k: np.nan for k in ["mean", "median", "sd", "min", "max", "slope", "delta_last_first_third"]}
    vv, tt = v[m], t[m]
    slope = float(np.polyfit(tt, vv, 1)[0])
    n = len(vv); third = max(1, n // 3)
    delta = float(vv.iloc[-third:].mean() - vv.iloc[:third].mean())
    return {"mean": float(vv.mean()), "median": float(vv.median()), "sd": float(vv.std()),
            "min": float(vv.min()), "max": float(vv.max()), "slope": slope,
            "delta_last_first_third": delta}


def main():
    long_rows, wide_rows, qc_rows = [], [], []
    for sid, subj in subject_map():
        hmd = os.path.join(subj, "HMD")
        if not os.path.isdir(hmd):
            continue
        ff = find_files(hmd)
        for stim in STIMULI:
            info = ff[stim]
            path = info["crop"] or info["full"]
            window = "crop" if info["crop"] else ("full" if info["full"] else None)
            note = info["note"] + ("full-fallback;" if window == "full" else "")
            if not path:
                qc_rows.append(dict(subject=sid, stimulus=stim, window="MISSING", n_rows=0,
                                    mean_hz=np.nan, median_hz=np.nan, duration_s=np.nan,
                                    pct_valid_eye=np.nan, crop_available=False, format_note="MISSING;"))
                continue
            try:
                df = read_hmd(path)
                sig, t, qc = parse_window(df)
            except Exception as e:
                qc_rows.append(dict(subject=sid, stimulus=stim, window=window, n_rows=0,
                                    mean_hz=np.nan, median_hz=np.nan, duration_s=np.nan,
                                    pct_valid_eye=np.nan, crop_available=bool(info["crop"]),
                                    format_note=note + f"ERROR:{type(e).__name__};"))
                continue
            wide = dict(subject=sid, stimulus=stim, window=window,
                        n_samples=qc["n_rows"], sample_rate_mean_hz=qc["mean_hz"],
                        sample_rate_median_hz=qc["median_hz"], duration_s=qc["duration_s"],
                        pct_valid_eye=qc["pct_valid_eye"])
            for signame in ARO:
                st = stats(sig[signame], t)
                for k, val in st.items():
                    long_rows.append(dict(subject=sid, stimulus=stim, window=window,
                                          signal=signame, stat=k, value=val))
                wide[f"{signame}_mean"] = st["mean"]
                if signame == "eye_gaze_deviation":
                    wide["gaze_dev_median"] = st["median"]
                    wide["gaze_dev_variance"] = (st["sd"] ** 2) if st["sd"] == st["sd"] else float("nan")
                if signame in ("hr", "cognitive_load"):
                    wide[f"{signame}_slope"] = st["slope"]
                if signame in ("hr", "cognitive_load", "left_eye_dilation", "right_eye_dilation"):
                    wide[f"{signame}_delta"] = st["delta_last_first_third"]
            wide["dil_mean_bilateral"] = np.nanmean([wide["left_eye_dilation_mean"], wide["right_eye_dilation_mean"]])
            wide_rows.append(wide)
            qc_rows.append(dict(subject=sid, stimulus=stim, window=window, n_rows=qc["n_rows"],
                                mean_hz=qc["mean_hz"], median_hz=qc["median_hz"], duration_s=qc["duration_s"],
                                pct_valid_eye=qc["pct_valid_eye"], pct_hr_valid=qc["pct_hr_valid"],
                                crop_available=bool(info["crop"]), format_note=note or "ok"))
    pd.DataFrame(long_rows).to_csv(os.path.join(OUT, "ch-hmd-long.csv"), index=False)
    pd.DataFrame(wide_rows).to_csv(os.path.join(OUT, "ch-hmd-wide.csv"), index=False)
    pd.DataFrame(qc_rows).to_csv(os.path.join(OUT, "ch-hmd-qc.csv"), index=False)
    print(f"ch-hmd done: {len(wide_rows)} (subject x stimulus) cells; long={len(long_rows)} rows; qc={len(qc_rows)} rows")
    print("cells with usable data:", len(wide_rows), "/ 24 expected")


if __name__ == "__main__":
    main()
