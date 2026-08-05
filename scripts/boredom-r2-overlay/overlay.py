"""Phase B: single-pass video cut + gaze-dot overlay renderer.

Cuts the HMD recording to the session's analysis window (CropEvents.json) and
draws the Round 1-style green gaze dot per frame from the cropped 120 Hz
EyeTracking data, projected via the Round 1-fit matrix. Dot hidden whenever the
combined gaze is invalid (blinks / closures), matching Round 1 behavior.

Usage:
    python overlay.py <session-substr> <fit.json> <out.mp4> [--preview-seconds N]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

from common import discover_sessions

W, H, FPS = 3840, 2160, 60.0
DOT_R = 20                      # filled radius at 4K (Round 1 parity)
DOT_RGB = (0, 255, 0)
RING_RGB = (0, 90, 0)           # thin dark outline for visibility on light content
INTERP_MAX_GAP_S = 0.10


def disk_offsets(r_in: int, r_out: int) -> tuple[np.ndarray, np.ndarray]:
    dy, dx = np.mgrid[-r_out:r_out + 1, -r_out:r_out + 1]
    d = np.hypot(dy, dx)
    return dy[(d >= r_in) & (d <= r_out)], dx[(d >= r_in) & (d <= r_out)]


DOT_DY, DOT_DX = disk_offsets(0, DOT_R)
RING_DY, RING_DX = disk_offsets(DOT_R, DOT_R + 4)


def frame_positions(session, ev, M: np.ndarray, n_frames: int):
    """Precompute (u, v, visible) per output frame from the cropped ET stream."""
    crop = session.et_csv.with_name(session.et_csv.stem + "_Crop.csv")
    df = pd.read_csv(crop, usecols=["cgaze/x", "cgaze/y", "cgaze/z", "cgaze/q",
                                    "t_rel_s"])
    t = df["t_rel_s"].to_numpy()
    g = df[["cgaze/x", "cgaze/y", "cgaze/z"]].to_numpy()
    valid = (df["cgaze/q"].to_numpy() >= 1) & (g[:, 2] > 0)
    g1 = g[:, [2, 0, 1]]                      # R2 (x,y,z) -> R1 (X,Y,Z)=(z,x,y)
    p = g1 @ M.T
    with np.errstate(divide="ignore", invalid="ignore"):
        u = p[:, 0] / p[:, 2]
        v = p[:, 1] / p[:, 2]

    ft = np.arange(n_frames) / FPS
    idx = np.searchsorted(t, ft).clip(1, len(t) - 1)
    left, right = idx - 1, idx
    lt, rt = t[left], t[right]
    ok = (valid[left] & valid[right] & ((rt - lt) <= INTERP_MAX_GAP_S)
          & (ft >= lt) & (ft <= rt + 1e-9))
    w = np.where(rt > lt, (ft - lt) / np.maximum(rt - lt, 1e-9), 0.0)
    fu = u[left] * (1 - w) + u[right] * w
    fv = v[left] * (1 - w) + v[right] * w
    inb = (fu >= -50) & (fu < W + 50) & (fv >= -50) & (fv < H + 50)
    return fu, fv, ok & inb


def draw(fr: np.ndarray, u: float, v: float) -> None:
    for dy, dx, rgb in ((RING_DY, RING_DX, RING_RGB), (DOT_DY, DOT_DX, DOT_RGB)):
        ys = (dy + int(round(v))).clip(0, H - 1)
        xs = (dx + int(round(u))).clip(0, W - 1)
        fr[ys, xs] = rgb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("session")
    ap.add_argument("fit")
    ap.add_argument("out")
    ap.add_argument("--preview-seconds", type=float, default=None)
    args = ap.parse_args()

    s = next(x for x in discover_sessions()
             if args.session.lower() in x.key.lower())
    ev = json.loads((s.dir / "CropEvents.json").read_text())
    w = ev["window"]
    if "start_v_s" not in w:
        sys.exit(f"{s.key}: no video sync in CropEvents (flags: {ev['flags']})")
    start_v, dur = w["start_v_s"], w["duration_s"]
    if args.preview_seconds:
        dur = min(dur, args.preview_seconds)
    n = int(dur * FPS) + 2
    M = np.array(json.load(open(args.fit))["M_r1_axes"])
    fu, fv, vis = frame_positions(s, ev, M, n)
    print(f"{s.key}: cut {start_v:.2f}s +{dur:.1f}s, {n} frames, "
          f"dot visible {vis.mean() * 100:.1f}%", flush=True)

    dec = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-hwaccel", "cuda",
         "-ss", f"{start_v:.3f}", "-t", f"{dur:.3f}", "-i", str(s.hmd_video),
         "-vf", f"fps={FPS:g}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE, bufsize=W * H * 3)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", f"{FPS:g}", "-i", "-",
         "-ss", f"{start_v:.3f}", "-t", f"{dur:.3f}", "-i", str(s.hmd_video),
         "-map", "0:v", "-map", "1:a:0", "-c:v", "hevc_nvenc", "-preset", "p5",
         "-cq", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
         str(args.out)],
        stdin=subprocess.PIPE)

    t0 = time.time()
    k = 0
    while True:
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        if k < n and vis[k]:
            fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
            draw(fr, fu[k], fv[k])
            enc.stdin.write(fr.tobytes())
        else:
            enc.stdin.write(buf)
        k += 1
        if k % 6000 == 0:
            fps = k / (time.time() - t0)
            print(f"  {k}/{n} frames ({fps:.0f} fps, "
                  f"eta {(n - k) / max(fps, 1) / 60:.1f} min)", flush=True)
    enc.stdin.close()
    dec.wait()
    enc.wait()
    print(f"done: {args.out} ({k} frames, {(time.time() - t0) / 60:.1f} min)")


if __name__ == "__main__":
    main()
