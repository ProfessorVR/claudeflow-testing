"""Phase B: bodycam cuts synchronized to the analysis window.

The bodycam records room audio, as does the HMD recording's mic track — the lag
between the two recordings is recovered by cross-correlating their audio
envelopes. Bodycam window = HMD window + lag. Output: `<stem>_Crop.mkv` beside
the source (originals untouched).

Usage: python bodycam_cut.py [--only SUBSTR] [--apply]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

from common import discover_sessions

ENV_HZ = 50
MAX_LAG_S = 180.0


def envelope(video: Path, track: int, ss: float = 0.0,
             dur: float | None = None) -> np.ndarray | None:
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{max(0.0, ss):.2f}"]
    if dur is not None:
        cmd += ["-t", f"{dur:.2f}"]
    cmd += ["-i", str(video), "-map", f"0:a:{track}",
            "-ac", "1", "-ar", "8000", "-f", "s16le", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    if len(raw) < 8000 * 2 * 30:
        return None
    x = np.frombuffer(raw, np.int16).astype(np.float64)
    frame = 8000 // ENV_HZ
    n = len(x) // frame
    env = np.sqrt((x[: n * frame].reshape(n, frame) ** 2).mean(axis=1))
    if env.std() < 1.0:  # silent / dead track
        return None
    return (env - env.mean()) / (env.std() + 1e-9)


def xcorr_lag_offset(a: np.ndarray, b: np.ndarray,
                     b_lead_s: float) -> tuple[float, float]:
    """b was extracted starting `b_lead_s` earlier than a. Slide a within b;
    return the lag (s, bodycam-relative-to-HMD) and a peak z-score."""
    na, nb = len(a), len(b)
    if nb <= na:
        pad = np.zeros(na - nb + 1)
        b = np.concatenate([b, pad])
        nb = len(b)
    shifts = np.arange(0, nb - na, 2)  # 40 ms steps
    cs = np.array([np.dot(a, b[s:s + na]) / na for s in shifts])
    i = int(np.argmax(cs))
    z = (cs[i] - cs.mean()) / (cs.std() + 1e-9)
    lag = shifts[i] / ENV_HZ - b_lead_s
    return float(lag), float(z)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    for s in discover_sessions():
        if args.only and args.only.lower() not in s.key.lower():
            continue
        if s.bodycam_video is None or s.hmd_video is None:
            continue
        ev = json.loads((s.dir / "CropEvents.json").read_text())
        w = ev["window"]
        if "start_v_s" not in w:
            print(f"{s.key}: no video sync — skip bodycam")
            continue
        # correlate speech-dense start and end segments; the instructions at
        # both ends give sharp peaks, and agreement between the two lags is the
        # acceptance test (clock drift over ~18 min is negligible).
        hdur = ev["video_duration_s"]
        SEG = 240.0
        best = None
        for track in (0, 1):
            lags = []
            for ss in (0.0, max(0.0, hdur - SEG)):
                he = envelope(s.hmd_video, 1, ss, SEG)
                if he is None:
                    he = envelope(s.hmd_video, 0, ss, SEG)
                bs = max(0.0, ss - MAX_LAG_S)
                be = envelope(s.bodycam_video, track, bs, SEG + 2 * MAX_LAG_S)
                if he is None or be is None:
                    continue
                # front-pad so the search always spans lag in [-MAX_LAG, +MAX_LAG]
                pad = int((MAX_LAG_S - (ss - bs)) * ENV_HZ)
                if pad > 0:
                    be = np.concatenate([np.zeros(pad), be])
                lag, z = xcorr_lag_offset(he, be, MAX_LAG_S)
                if z < 3.0 or abs(lag) > MAX_LAG_S - 2.0:
                    continue  # no credible peak / boundary artifact
                lags.append((lag, z))
            if len(lags) == 2:
                (l1, z1), (l2, z2) = lags
                agree = abs(l1 - l2)
                score = min(z1, z2) + (10 if agree <= 1.0 else 0)
                if best is None or score > best[4]:
                    best = (track, (l1 + l2) / 2, min(z1, z2), agree, score)
        if best is None:
            print(f"{s.key}: bodycam/HMD audio unusable — NEEDS REVIEW")
            continue
        track, lag, z, agree, _ = best
        accept = agree <= 1.0 or z >= 8
        b_start = w["start_v_s"] + lag
        print(f"{s.key}: bodycam lag {lag:+.2f}s (start/end agree {agree:.2f}s, "
              f"min z={z:.1f}, a:{track}) -> cut {b_start:.2f}s "
              f"+{w['duration_s']:.1f}s"
              f"{'' if accept else '  ** WEAK — REVIEW **'}")
        if args.apply and accept:
            out = s.bodycam_video.with_name(s.bodycam_video.stem + "_Crop.mkv")
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y",
                 "-ss", f"{max(0.0, b_start):.3f}", "-t", f"{w['duration_s']:.3f}",
                 "-i", str(s.bodycam_video),
                 "-c:v", "hevc_nvenc", "-preset", "p5", "-cq", "23",
                 "-c:a", "aac", "-b:a", "160k", str(out)], check=True)
            ev.setdefault("bodycam", {})
            ev["bodycam"] = {"lag_s": lag, "xcorr_z": z, "track": track,
                             "out": out.name}
            (s.dir / "CropEvents.json").write_text(json.dumps(ev, indent=2))
            print(f"    wrote {out.name}")


if __name__ == "__main__":
    main()
