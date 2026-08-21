"""Gaze deviation from center, rebuilt in degrees against a FIXED FORWARD axis.

Why this module exists
----------------------
The published feature (King et al., ASEE 2024) is *deviation from screen-center*.
The original MATLAB (`eyetrackdatamapping_V3.m`, Das 2023) implements it as

    xn = 1 - xn                 % X is the forward component of a unit vector,
    xfilt = medfilt1(xn, 5)     % so 1 - X is 1 - cos(theta): distance from center

against a FIXED reference. The 2026 reimplementation substituted each file's own
MEDIAN gaze direction for that reference, which removes any sustained posture by
construction: the reference moves with the participant, so someone sitting 13
degrees low for a whole film registers as centered. Restoring the fixed reference
is therefore a RESTORATION of the published definition, not a new feature.

Axis conventions differ between rounds and must never be hard-coded to one
-------------------------------------------------------------------------
Round 1 was recorded in **Unreal** (FVector::ToString, "X=0.935 Y=-0.002 Z=-0.355")
and Round 2 in **Unity** (HP Omnicept SDK, `cgaze/x,y,z`). Confirmed by the original
MATLAB, which plots the CSV's Y as the horizontal axis, its Z as the vertical axis,
and scatters (Y, Z) on a 3840x2160 screen.

    round 1 (Unreal):  X = forward,   Y = horizontal,  Z = vertical (up positive)
    round 2 (Unity):   Z = forward,   X = horizontal,  Y = vertical (up positive)

A single hard-coded forward direction would give Round 1 a meaningless ~90 degree
offset on every cell. Verified empirically: every cell's median gaze sits within
14 degrees of its own round's forward axis.

What this measures, and what it does not
----------------------------------------
Both rounds record gaze **EYE-IN-HEAD**, not head pose. Round 2's `cgaze` never
exceeds 38.8 degrees across 12 cells and millions of samples and has zero samples
beyond 50 degrees; Round 1 sits in the same envelope. The session video confirms
it directly - the head swings through ~90 degrees of roll and a deep downward pitch
while the rendered gaze marker stays near the center of the frame.

So a participant who turns their head away from the video registers NO deviation
here. Head movement is deferred by author ruling (2026-07-31) and is not measured
in this pass. Nothing in this module may be read as a restlessness measure of the
whole body; it is the eye inside the head.

Two components, per the author's construct
------------------------------------------
    degree     how far the eye sits from center - reported as a DISTRIBUTION
               (median, p90, p95), because a single middle value cancels
               symmetric swinging: S03's boring film swings 164 degrees
               horizontally and still has a median vector 1.7 degrees off center.
    frequency  how often the eye leaves the comfortable centered position -
               excursions per minute beyond a threshold, swept rather than tuned.

Three baselines are computed and labeled so the choice is visible:
    forward  the round's own device-forward axis  (the published definition)
    file     that cell's own median gaze direction (the 2026 reimplementation)
    subject  one median per participant across their three films - preserves
             individual seating while exposing between-film postural drift
"""
import os
import re

import numpy as np
import pandas as pd

import adapters
import config as C
import journal as J

# forward axis and component mapping, per round
AXES = {
    1: dict(forward=np.array([1.0, 0.0, 0.0]), horiz=1, vert=2, fwd=0, engine="Unreal"),
    2: dict(forward=np.array([0.0, 0.0, 1.0]), horiz=0, vert=1, fwd=2, engine="Unity"),
}
BASELINES = ("forward", "file", "subject")
EXCURSION_DEG = (5.0, 10.0, 15.0)
GVEC = re.compile(r"X=(-?[\d.]+)\s+Y=(-?[\d.]+)\s+Z=(-?[\d.]+)")


def _unit(v):
    n = np.linalg.norm(v, axis=1)
    out = np.full_like(v, np.nan, dtype=float)
    ok = n > 0
    out[ok] = v[ok] / n[ok, None]
    return out


def angles(u, rnd, ref=None):
    """-> (total_deg, horiz_deg, vert_deg) for unit vectors u under round `rnd`."""
    ax = AXES[rnd]
    r = ax["forward"] if ref is None else np.asarray(ref, float)
    r = r / np.linalg.norm(r)
    total = np.degrees(np.arccos(np.clip(u @ r, -1.0, 1.0)))
    horiz = np.degrees(np.arctan2(u[:, ax["horiz"]], u[:, ax["fwd"]]))
    vert = np.degrees(np.arcsin(np.clip(u[:, ax["vert"]], -1.0, 1.0)))
    return total, horiz, vert


def _features(u, t, rnd, ref, baseline, subject, stimulus, window):
    total, horiz, vert = angles(u, rnd, ref)
    ok = np.isfinite(total)
    total, horiz, vert = total[ok], horiz[ok], vert[ok]
    if len(total) < 10:
        return None
    tt = np.asarray(t, float)[ok] if t is not None and len(t) == len(ok) else None
    minutes = float(np.nanmax(tt) - np.nanmin(tt)) / 60.0 if tt is not None and len(tt) else np.nan
    row = dict(subject=subject, stimulus=stimulus, round=rnd, window=window,
               baseline=baseline, n_samples=int(len(total)),
               gaze_deg_median=float(np.median(total)),
               gaze_deg_p90=float(np.percentile(total, 90)),
               gaze_deg_p95=float(np.percentile(total, 95)),
               gaze_deg_mean=float(np.mean(total)),
               gaze_horiz_range_deg=float(np.percentile(horiz, 95) - np.percentile(horiz, 5)),
               gaze_vert_median_deg=float(np.median(vert)),
               gaze_vert_p5_deg=float(np.percentile(vert, 5)))
    # frequency: excursions beyond threshold, and how much time is spent there
    for thr in EXCURSION_DEG:
        beyond = total > thr
        # count maximal runs, so one long look away is one excursion, not thousands
        n_runs = int(np.sum(np.diff(beyond.astype(np.int8)) == 1) + (1 if beyond[:1].any() else 0))
        row[f"gaze_pct_beyond_{thr:g}deg"] = float(beyond.mean() * 100)
        row[f"gaze_excursions_beyond_{thr:g}deg"] = n_runs
        row[f"gaze_excursion_rate_{thr:g}deg_per_min"] = (
            float(n_runs / minutes) if minutes and minutes == minutes else np.nan)
    return row


def _r1_vectors():
    """-> {(sid, stim): (unit vectors, time)} from the Round 1 crop files."""
    out = {}
    for sid, path in adapters.subject_map():
        hmd = os.path.join(path, "HMD")
        if not os.path.isdir(hmd):
            continue
        ff = adapters.find_files(hmd)
        for stim, info in ff.items():
            if not info["crop"]:
                continue
            df = adapters.read_hmd(info["crop"])
            g = df.gaze.astype(str).str.extract(GVEC).astype(float)
            vl = pd.to_numeric(df.validL, errors="coerce")
            vr = pd.to_numeric(df.validR, errors="coerce")
            good = (vl == 1) & (vr == 1) & g.notna().all(axis=1)
            v = g[good].values
            t = (pd.to_numeric(df.hh, errors="coerce") * 3600
                 + pd.to_numeric(df.mm, errors="coerce") * 60
                 + pd.to_numeric(df.ss, errors="coerce")
                 + pd.to_numeric(df.ms, errors="coerce") / 1000.0)
            t = (t - t.iloc[0])[good].values
            out[(sid, stim)] = (_unit(v), t)
    return out


def _r2_vectors():
    """-> {(sid, stim, window): (unit vectors, time)} from the Round 2 crops."""
    out = {}
    SUB = adapters.r2_subjects_dir()
    for i, d in enumerate(sorted(os.listdir(SUB)), 1):
        sid = f"R2-{i:02d}"
        files, _ = adapters.r2_collect(os.path.join(SUB, d))
        for stim in C.STIMULI:
            f = files.get(stim, {})
            if "eye" not in f:
                continue
            eye = pd.read_csv(f["eye"], usecols=["cgaze/x", "cgaze/y", "cgaze/z",
                                                 "cgaze/q", "t_rel_s"], low_memory=False)
            t_all = pd.to_numeric(eye["t_rel_s"], errors="coerce")
            crop_dur = float(np.nanmax(t_all.values))
            q = pd.to_numeric(eye["cgaze/q"], errors="coerce")
            g = eye[["cgaze/x", "cgaze/y", "cgaze/z"]].apply(pd.to_numeric, errors="coerce")
            good = (q > 0) & g.notna().all(axis=1) & (g["cgaze/x"] > -0.99)
            for wname, (wlo, whi) in C.R2_WINDOWS.items():
                lo = 0.0 if wlo is None else float(wlo)
                hi = crop_dur if whi is None else float(crop_dur - whi)
                keep = good & (t_all >= lo) & (t_all <= hi)
                out[(sid, stim, wname)] = (_unit(g[keep].values), t_all[keep].values)
    return out


def extract():
    """-> tidy frame: one row per (subject, stimulus, window, baseline)."""
    rows = []
    r1 = _r1_vectors()
    r2 = _r2_vectors()

    # per-subject reference vectors, pooled across that participant's three films
    subj_ref = {}
    for src, rnd in ((r1, 1), (r2, 2)):
        by = {}
        for key, (u, _) in src.items():
            sid = key[0]
            if len(key) == 3 and key[2] != C.R2_PRIMARY_WINDOW:
                continue
            by.setdefault(sid, []).append(u[np.isfinite(u).all(axis=1)])
        for sid, chunks in by.items():
            subj_ref[sid] = np.median(np.vstack(chunks), axis=0)

    for (sid, stim), (u, t) in sorted(r1.items()):
        fin = u[np.isfinite(u).all(axis=1)]
        refs = dict(forward=None, file=np.median(fin, axis=0) if len(fin) else None,
                    subject=subj_ref.get(sid))
        for b in BASELINES:
            if b != "forward" and refs[b] is None:
                continue
            r = _features(u, t, 1, refs[b], b, sid, stim, "crop")
            if r:
                rows.append(r)

    for (sid, stim, wname), (u, t) in sorted(r2.items()):
        fin = u[np.isfinite(u).all(axis=1)]
        refs = dict(forward=None, file=np.median(fin, axis=0) if len(fin) else None,
                    subject=subj_ref.get(sid))
        for b in BASELINES:
            if b != "forward" and refs[b] is None:
                continue
            r = _features(u, t, 2, refs[b], b, sid, stim, wname)
            if r:
                rows.append(r)

    J.note("gaze rebuilt",
           "Deviation from center restored to a FIXED FORWARD reference in degrees, "
           "per the published definition (1 - X, i.e. 1 - cos theta, against the "
           "device axis) rather than each file's own median. Axis is per round: "
           "Round 1 Unreal (X forward, Y horizontal, Z vertical), Round 2 Unity "
           "(Z forward, X horizontal, Y vertical). EYE-IN-HEAD only; head pose is "
           "deferred by author ruling 2026-07-31.")
    return pd.DataFrame(rows).sort_values(
        ["baseline", "subject", "stimulus", "window"]).reset_index(drop=True)
