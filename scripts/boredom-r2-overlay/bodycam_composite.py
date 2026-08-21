"""Side-by-side bodycam+HMD composite — the plan §6.3 optional appendix extra.

Inputs are the synchronized bodycam `_Crop.mkv` cut and the session's
GAZE-OVERLAY render `<FirstLast>_ET_<Cond>.mp4` (user ruling 2026-08-05: the
right pane must carry the green gaze dot, not the plain HMD cut). Both start
at the analysis-window start with equal duration, so no offset math is
needed: each 4K60 pane is scaled to 1920x1080 and hstacked into a
3840x1080@60 HEVC render (bodycam left, overlaid first-person view right).
Audio is taken from the overlay render (the session mix). NVDEC decode +
NVENC encode; sources untouched.

Output: `ROUND2/Videos/BodyCam Side-by-Side/<Subject>/<FirstLast>_BodyCamHMD_<Condition>.mp4`

Usage: python bodycam_composite.py [--only SUBSTR]
"""
from __future__ import annotations

import argparse
import subprocess
import time

from common import ROUND2, discover_sessions

OUT_ROOT = ROUND2 / "Videos" / "BodyCam Side-by-Side"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    args = ap.parse_args()

    for s in discover_sessions():
        if s.bodycam_video is None:
            continue
        if args.only and args.only.lower() not in s.key.lower():
            continue
        body = s.bodycam_video.with_name(s.bodycam_video.stem + "_Crop.mkv")
        overlay = (ROUND2 / "Videos" / "Eye Tracking Overlay Videos" / s.subject
                   / f"{s.subject.replace(' ', '')}_ET_{s.condition}.mp4")
        if not body.exists() or not overlay.exists():
            print(f"{s.key}: missing input ({body.name} / {overlay.name}) — skip")
            continue
        out_dir = OUT_ROOT / s.subject
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / (f"{s.subject.replace(' ', '')}"
                         f"_BodyCamHMD_{s.condition}.mp4")
        if out.exists():
            print(f"{s.key}: {out.name} exists — skip")
            continue
        t0 = time.time()
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y",
             "-hwaccel", "cuda", "-i", str(body),
             "-hwaccel", "cuda", "-i", str(overlay),
             "-filter_complex",
             "[0:v]scale=1920:1080[l];[1:v]scale=1920:1080[r];"
             "[l][r]hstack=inputs=2[v]",
             "-map", "[v]", "-map", "1:a:0", "-shortest",
             "-c:v", "hevc_nvenc", "-preset", "p5", "-cq", "24",
             "-c:a", "aac", "-b:a", "160k", str(out)], check=True)
        print(f"{s.key}: wrote {out.name} ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
