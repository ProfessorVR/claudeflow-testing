"""Render single-frame overlay previews for a Round 2 session to validate the
projection transfer (Round 1 fit M, axes g_R1 = (z, x, y)_R2).

Usage: python preview_overlay.py <session-substr> <fit.json> <t_rel[,t_rel...]> <outdir>
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from common import discover_sessions

PREVIEW_W, PREVIEW_H = 1920, 1080


def main():
    substr, fit_path, times, outdir = sys.argv[1:5]
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    M = np.array(json.load(open(fit_path))["M_r1_axes"])

    s = next(x for x in discover_sessions() if substr.lower() in x.key.lower())
    ev = json.loads((s.dir / "CropEvents.json").read_text())
    b = ev["sync"]["b_s"]
    w = ev["window"]
    crop = s.et_csv.with_name(s.et_csv.stem + "_Crop.csv")
    df = pd.read_csv(crop, usecols=["cgaze/x", "cgaze/y", "cgaze/z", "cgaze/q", "t_rel_s"])

    for t_rel in [float(t) for t in times.split(",")]:
        row = df.iloc[(df["t_rel_s"] - t_rel).abs().idxmin()]
        video_t = w["start_et_s"] + t_rel + b
        out = outdir / f"{s.key.replace(' ', '_')}_t{int(t_rel)}.png"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", f"{video_t:.3f}", "-i", str(s.hmd_video),
             "-frames:v", "1", "-vf", f"scale={PREVIEW_W}:{PREVIEW_H}",
             str(out), "-y"], check=True)
        if row["cgaze/q"] < 1 or row["cgaze/x"] == -1:
            print(f"t_rel={t_rel}: gaze invalid (blink) — frame saved without dot: {out.name}")
            continue
        g2 = np.array([row["cgaze/x"], row["cgaze/y"], row["cgaze/z"]])
        g1 = np.array([g2[2], g2[0], g2[1]])  # R2 -> R1 axes
        p = M @ g1
        u, v = p[0] / p[2], p[1] / p[2]
        us, vs = u * PREVIEW_W / 3840, v * PREVIEW_H / 2160
        import struct
        # draw with ffmpeg drawbox (avoid opencv dep): green ring + center dot
        tmp = out.with_suffix(".tmp.png")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(out),
             "-vf", (f"drawbox=x={us-12:.0f}:y={vs-12:.0f}:w=24:h=24:"
                     f"color=green@1.0:t=6"),
             str(tmp), "-y"], check=True)
        tmp.replace(out)
        inb = "IN " if (0 <= u <= 3840 and 0 <= v <= 2160) else "OUT-OF-FRAME "
        print(f"t_rel={t_rel}: gaze=({g2[0]:+.3f},{g2[1]:+.3f},{g2[2]:+.3f}) "
              f"-> px({u:.0f},{v:.0f}) {inb}{out.name}")


if __name__ == "__main__":
    main()
