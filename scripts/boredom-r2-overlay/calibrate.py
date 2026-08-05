"""Phase B0: recover the gaze-direction -> mirror-pixel projection by
reverse-engineering the Round 1 overlay videos.

The Round 1 overlays draw a saturated green dot; the matching `_Crop.csv` files
carry ~3 Hz gaze vectors on the video timeline (time-of-day columns). We detect
the dot per sampled frame, pair with temporally-stable gaze samples, scan a small
CSV<->video time offset, and fit a 3x3 projective mapping (DLT, 8 DOF):
    u = (m1.g)/(m3.g),  v = (m2.g)/(m3.g)
in Round 1 axis convention (X forward, Y lateral, Z vertical). Round 2 SDK cgaze
is (x lateral, y vertical, z forward); transfer uses g_R1 = (z, x, y)_R2.

Usage:
    python calibrate.py <overlay.mp4> <crop.csv> [--fps 1] [--out fit.json]
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys

import numpy as np

GVEC = re.compile(r"X=(-?[\d.]+) Y=(-?[\d.]+) Z=(-?[\d.]+)")
W, H = 3840, 2160


def load_r1_gaze(path: str) -> tuple[np.ndarray, np.ndarray]:
    """Return (t_rel_video_s, gaze[N,3]) for valid rows of a Round 1 crop CSV."""
    ts, gs = [], []
    for line in open(path):
        f = line.split(",")
        m = GVEC.search(line)
        if not m or len(f) < 5:
            continue
        g = np.array([float(v) for v in m.groups()])
        if g[0] <= 0.0:  # backwards/sentinel = invalid
            continue
        try:
            t = int(f[0]) * 3600 + int(f[1]) * 60 + int(f[2]) + int(f[3]) / 1000
        except ValueError:
            continue
        ts.append(t)
        gs.append(g / np.linalg.norm(g))
    t = np.array(ts)
    return t - t[0], np.array(gs)


def detect_dots(video: str, fps: float) -> tuple[np.ndarray, np.ndarray]:
    """Decode at `fps`, detect the green dot; returns (t_frame, uv[N,2]) with NaN
    where no dot was found."""
    proc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-hwaccel", "cuda", "-i", video,
         "-vf", f"fps={fps}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE, bufsize=W * H * 3,
    )
    ts, uvs = [], []
    i = 0
    while True:
        buf = proc.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        mask = (fr[:, :, 1] > 190) & (fr[:, :, 0] < 110) & (fr[:, :, 2] < 110)
        n = int(mask.sum())
        t = (i + 0.5) / fps
        i += 1
        ts.append(t)
        if 60 <= n <= 12000:  # plausible dot area at 4K
            ys, xs = np.nonzero(mask)
            # reject scattered false positives: dot must be compact
            if xs.std() < 60 and ys.std() < 60:
                uvs.append((xs.mean(), ys.mean()))
                continue
        uvs.append((np.nan, np.nan))
    proc.wait()
    return np.array(ts), np.array(uvs)


def stable_pairs(t_f, uv, t_g, g, offset: float, max_dt=0.20, max_move_deg=1.0):
    """Pair detected dots with gaze samples that are stable around the frame time."""
    P, Q = [], []
    tg = t_g + offset
    idx = np.searchsorted(tg, t_f)
    for k, t in enumerate(t_f):
        if np.isnan(uv[k, 0]):
            continue
        j = np.clip(idx[k], 1, len(tg) - 2)
        j = j if abs(tg[j] - t) < abs(tg[j - 1] - t) else j - 1
        if abs(tg[j] - t) > max_dt:
            continue
        ang = np.degrees(np.arccos(np.clip(np.dot(g[j - 1], g[j + 1]), -1, 1)))
        if ang > max_move_deg:  # gaze moving; pairing would smear
            continue
        P.append(g[j])
        Q.append(uv[k])
    return np.array(P), np.array(Q)


def fit_dlt(g: np.ndarray, uv: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Homogeneous DLT fit of 3x3 M; returns (M, per-pair pixel residuals)."""
    A = []
    for (x, y, z), (u, v) in zip(g, uv):
        A.append([x, y, z, 0, 0, 0, -u * x, -u * y, -u * z])
        A.append([0, 0, 0, x, y, z, -v * x, -v * y, -v * z])
    _, _, vt = np.linalg.svd(np.array(A))
    M = vt[-1].reshape(3, 3)
    proj = (M @ g.T)
    res = np.hypot(proj[0] / proj[2] - uv[:, 0], proj[1] / proj[2] - uv[:, 1])
    return M, res


def robust_fit(g, uv, rounds=3, keep=0.85):
    M, res = fit_dlt(g, uv)
    for _ in range(rounds):
        thr = np.quantile(res, keep)
        sel = res <= thr
        M, res = fit_dlt(g[sel], uv[sel])
        g, uv = g[sel], uv[sel]
    return M, res, len(g)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("csv")
    ap.add_argument("--fps", type=float, default=1.0)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    t_g, g = load_r1_gaze(args.csv)
    print(f"gaze rows: {len(g)} over {t_g[-1]:.1f}s")
    t_f, uv = detect_dots(args.video, args.fps)
    found = np.isfinite(uv[:, 0]).sum()
    print(f"frames: {len(t_f)}, dot found in {found}")

    best = None
    for off in np.arange(-2.0, 2.01, 0.1):
        P, Q = stable_pairs(t_f, uv, t_g, g, off)
        if len(P) < 40:
            continue
        M, res, n = robust_fit(P, Q)
        med = float(np.median(res))
        if best is None or med < best["med"]:
            best = {"off": round(float(off), 2), "med": med, "M": M, "n": n,
                    "p90": float(np.quantile(res, 0.9))}
    if best is None:
        sys.exit("no usable offset/pairs")
    M = best["M"] / np.linalg.norm(best["M"])
    print(f"best offset {best['off']:+.1f}s  pairs {best['n']}  "
          f"median residual {best['med']:.1f}px  p90 {best['p90']:.1f}px")
    print("M (R1 axes):\n", M)
    if args.out:
        json.dump({"M_r1_axes": M.tolist(), "video": args.video, "csv": args.csv,
                   "offset_s": best["off"], "pairs": best["n"],
                   "median_residual_px": best["med"], "p90_residual_px": best["p90"],
                   "note": "g_R1 = (z, x, y) of Round 2 cgaze; u=(m1.g)/(m3.g)"},
                  open(args.out, "w"), indent=2)
        print("wrote", args.out)


if __name__ == "__main__":
    main()
