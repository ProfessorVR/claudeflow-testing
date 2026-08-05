"""Phase B: gaze-density heatmaps in mirror pixel space.

Per session: 2D histogram of projected valid gaze over the analysis window,
Gaussian-blurred, warm-colormapped, composited over a dimmed mid-window frame.
Per condition: aggregate of the subjects' normalized histograms on a dark field.

Usage: python heatmap.py <fit.json> <out_tree> [--only SUBSTR]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd

from common import discover_sessions

W, H = 3840, 2160
BW, BH = 480, 270          # histogram bins
SIGMA = 3.0                # blur in bins


def gaussian_blur(a: np.ndarray, sigma: float) -> np.ndarray:
    r = int(3 * sigma)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode="same"), 0, a)
    return np.apply_along_axis(lambda m: np.convolve(m, k, mode="same"), 1, a)


def session_hist(session, M: np.ndarray) -> np.ndarray | None:
    crop = session.et_csv.with_name(session.et_csv.stem + "_Crop.csv")
    if not crop.exists():
        return None
    df = pd.read_csv(crop, usecols=["cgaze/x", "cgaze/y", "cgaze/z", "cgaze/q"])
    g = df[["cgaze/x", "cgaze/y", "cgaze/z"]].to_numpy()
    ok = (df["cgaze/q"].to_numpy() >= 1) & (g[:, 2] > 0)
    g = g[ok][:, [2, 0, 1]]
    p = g @ M.T
    u = p[:, 0] / p[:, 2]
    v = p[:, 1] / p[:, 2]
    inb = (u >= 0) & (u < W) & (v >= 0) & (v < H)
    hist, _, _ = np.histogram2d(v[inb], u[inb], bins=[BH, BW],
                                range=[[0, H], [0, W]])
    return gaussian_blur(hist, SIGMA)


def colorize(hist: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Map density -> (rgb float [BH,BW,3], alpha [BH,BW])."""
    hn = hist / max(hist.max(), 1e-9)
    hn = np.sqrt(hn)  # compress dynamic range
    # blue -> cyan -> green -> yellow -> red
    stops = np.array([[0, 0, 0.5], [0, 0.8, 1], [0, 1, 0.2], [1, 1, 0], [1, 0, 0]])
    x = hn * (len(stops) - 1)
    i = np.clip(x.astype(int), 0, len(stops) - 2)
    f = (x - i)[..., None]
    rgb = stops[i] * (1 - f) + stops[i + 1] * f
    alpha = np.clip(hn * 1.6, 0, 0.85)
    return rgb, alpha


def render_png(rgb_img: np.ndarray, out: Path) -> None:
    h, w, _ = rgb_img.shape
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{w}x{h}", "-i", "-", "-frames:v", "1", str(out)],
        input=rgb_img.astype(np.uint8).tobytes())
    p.check_returncode()


def upscale(a: np.ndarray) -> np.ndarray:
    return np.repeat(np.repeat(a, H // BH, axis=0), W // BW, axis=1)


def composite(hist: np.ndarray, background: np.ndarray | None) -> np.ndarray:
    rgb, alpha = colorize(hist)
    rgb_full = upscale(rgb)
    a_full = upscale(alpha)[..., None]
    if background is None:
        base = np.full((H, W, 3), 24.0)
    else:
        base = background.astype(np.float64) * 0.45
    return np.clip(base * (1 - a_full) + rgb_full * 255 * a_full, 0, 255)


def mid_frame(session, ev) -> np.ndarray | None:
    w = ev["window"]
    if "start_v_s" not in w or session.hmd_video is None:
        return None
    t = w["start_v_s"] + w["duration_s"] / 2
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", str(session.hmd_video),
         "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True).stdout
    if len(raw) < W * H * 3:
        return None
    return np.frombuffer(raw[:W * H * 3], np.uint8).reshape(H, W, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fit")
    ap.add_argument("out_tree")
    ap.add_argument("--only", default=None)
    args = ap.parse_args()
    M = np.array(json.load(open(args.fit))["M_r1_axes"])
    tree = Path(args.out_tree)

    by_cond: dict[str, list[np.ndarray]] = {}
    for s in discover_sessions():
        if args.only and args.only.lower() not in s.key.lower():
            continue
        hist = session_hist(s, M)
        if hist is None:
            print(f"{s.key}: no crop — skipped")
            continue
        ev = json.loads((s.dir / "CropEvents.json").read_text())
        img = composite(hist, mid_frame(s, ev))
        out = tree / s.subject / f"{s.subject.replace(' ', '')}_Heatmap_{s.condition}.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        render_png(img, out)
        hn = hist / max(hist.sum(), 1e-9)
        by_cond.setdefault(s.condition, []).append(hn)
        print(f"{s.key}: heatmap -> {out.name}")

    if not args.only:
        for cond, hs in by_cond.items():
            agg = np.mean(hs, axis=0)
            out = tree / f"Aggregate_Heatmap_{cond}.png"
            render_png(composite(agg, None), out)
            print(f"aggregate {cond} ({len(hs)} subjects) -> {out.name}")


if __name__ == "__main__":
    main()
