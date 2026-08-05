"""Phase B2 batch driver: overlay renders for all synced sessions (skipping any
whose output already exists), plain `_Crop.mkv` HMD cuts, heatmaps, bodycam cuts.

Usage: python batch_phase_b.py <fit.json>
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

from common import ROUND2, discover_sessions

OVERLAY_TREE = ROUND2 / "Videos" / "Eye Tracking Overlay Videos"
PY = "/home/dalton/.venv/bin/python"
HERE = Path(__file__).parent


def run(label: str, cmd: list[str]) -> bool:
    t0 = time.time()
    print(f"[{time.strftime('%H:%M:%S')}] {label} ...", flush=True)
    r = subprocess.run(cmd)
    ok = r.returncode == 0
    print(f"[{time.strftime('%H:%M:%S')}] {label}: "
          f"{'ok' if ok else f'FAILED rc={r.returncode}'} "
          f"({(time.time() - t0) / 60:.1f} min)", flush=True)
    return ok


def main():
    fit = sys.argv[1]
    failures = []
    sessions = discover_sessions()

    for s in sessions:
        if s.hmd_video is None:
            continue
        ev = json.loads((s.dir / "CropEvents.json").read_text())
        w = ev["window"]
        if "start_v_s" not in w:
            failures.append(f"{s.key}: no sync")
            continue
        compact = s.subject.replace(" ", "")
        out = OVERLAY_TREE / s.subject / f"{compact}_ET_{s.condition}.mp4"
        out.parent.mkdir(parents=True, exist_ok=True)
        if not out.exists():
            if not run(f"overlay {s.key}",
                       [PY, str(HERE / "overlay.py"), s.key, fit, str(out)]):
                failures.append(f"{s.key}: overlay")
        plain = s.hmd_video.with_name(s.hmd_video.stem + "_Crop.mkv")
        if not plain.exists():
            ok = run(f"plain cut {s.key}",
                     ["ffmpeg", "-v", "error", "-y",
                      "-ss", f"{w['start_v_s']:.3f}", "-t", f"{w['duration_s']:.3f}",
                      "-i", str(s.hmd_video),
                      "-c:v", "hevc_nvenc", "-preset", "p5", "-cq", "23",
                      "-c:a", "aac", "-b:a", "160k", str(plain)])
            if not ok:
                failures.append(f"{s.key}: plain cut")

    run("heatmaps", [PY, str(HERE / "heatmap.py"), fit, str(OVERLAY_TREE)])
    run("bodycam cuts", [PY, str(HERE / "bodycam_cut.py"), "--apply"])

    print("\n=== BATCH DONE ===")
    if failures:
        for f in failures:
            print("FAILED:", f)
        sys.exit(1)
    print("all outputs complete")


if __name__ == "__main__":
    main()
