"""Bodycam sync verification via stimulus-mix xcorr + (post-sign-off) cut.

Resolution of the 2026-08-04 handoff item. The user supplied approximate
bodycam-clock times for the analysis-window edges of the 4 bodycam sessions;
probing around those seeds revealed the real sync channel: the bodycam OBS
recordings carry the SAME desktop/stimulus mix as the HMD recordings on track
a:0 (their a:1 room-mic track is silent — which is why both earlier
room-audio methods refused: there is no room audio to match).

Method: envelope xcorr of bodycam a:0 vs HMD a:0 in two 90 s stimulus-dense
windows (early and late in the analysis window), searching ±SEARCH_S around
the user-anchor candidate. Probe result (Lucas Boring): z≈20-22 with
runner-up z≈1.8 and identical b in both windows — unambiguous, no drift.

Acceptance: both windows z >= Z_STRONG and |b_early - b_late| <= AGREE_S.
Anything less falls back to the user anchor and is flagged for review; a lone
noise peak is never promoted over the user's readings (the 2026-08-04 first
pass got that wrong).

Evidence (report + side-by-side frames) lands in
`ROUND2/BODYCAM-SYNC-VERIFICATION-2026-08-04/`. CPU-only until `--apply`
(sign-off gated), which cuts with NVENC exactly like bodycam_cut.py.

Usage: python bodycam_verify.py [--only SUBSTR] [--apply]
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

from common import ROUND2, discover_sessions, ffprobe_duration

VERIF_DIR = ROUND2 / "BODYCAM-SYNC-VERIFICATION-2026-08-04"

# User-anchor candidates (2026-08-04): mean of the two eyeball anchors except
# Lucas Interesting, where the user confirmed their "end" reading was the end
# of the closure sequence (reopen), reconciling to the HMD-prior offset.
USER_B = {
    "Lucas Jones_03-13-24_Boring": -1.18,
    "Lucas Jones_03-13-24_Clinical": -16.46,
    "Lucas Jones_03-13-24_Interesting": -9.54,
    "Matthew Lo_03-15-24_Interesting": -119.95,
}
SEARCH_S = 35.0      # lag search half-width around the candidate
HALF_WIN_S = 45.0    # stimulus window half-width
WIN_INSET_S = 120.0  # window centers: analysis-window edge ± this
ENV_HZ = 50
Z_STRONG = 8.0
AGREE_S = 0.5


def envelope_seg(video: Path, track: int, ss: float, dur: float) -> np.ndarray | None:
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{max(0.0, ss):.3f}",
           "-t", f"{dur:.3f}", "-i", str(video), "-map", f"0:a:{track}",
           "-ac", "1", "-ar", "8000", "-f", "s16le", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    if len(raw) < int(8000 * 2 * dur * 0.6):
        return None
    x = np.frombuffer(raw, np.int16).astype(np.float64)
    frame = 8000 // ENV_HZ
    n = len(x) // frame
    env = np.sqrt((x[: n * frame].reshape(n, frame) ** 2).mean(axis=1))
    if env.std() < 1.0:
        return None
    return (env - env.mean()) / (env.std() + 1e-9)


def stim_xcorr(hmd: Path, body: Path, et_c: float, b_hmd: float,
               b_cand: float, bdur: float) -> dict | None:
    """xcorr HMD a:0 vs bodycam a:0 around ET-clock center et_c.
    Returns {b, z, z2} — z2 is the best peak > 2 s away (dominance)."""
    e0, e1 = et_c - HALF_WIN_S, et_c + HALF_WIN_S
    he = envelope_seg(hmd, 0, e0 + b_hmd, e1 - e0)
    ss_b = max(0.0, e0 + b_cand - SEARCH_S)
    dur_b = min(bdur, e1 + b_cand + SEARCH_S) - ss_b
    be = envelope_seg(body, 0, ss_b, dur_b)
    if he is None or be is None or len(be) <= len(he):
        return None
    na = len(he)
    shifts = np.arange(0, len(be) - na)          # 20 ms steps
    cs = np.array([np.dot(he, be[s:s + na]) / na for s in shifts])
    i = int(np.argmax(cs))
    z = (cs[i] - cs.mean()) / (cs.std() + 1e-9)
    mask = np.abs(shifts - shifts[i]) > 2 * ENV_HZ
    z2 = (cs[mask].max() - cs.mean()) / (cs.std() + 1e-9) if mask.any() else 0.0
    return {"b": float(ss_b + shifts[i] / ENV_HZ - e0), "z": float(z),
            "z2": float(z2)}


def frame_pair(body: Path, hmd_crop: Path, t_body: float, t_crop: float,
               out: Path) -> None:
    tmp_b = out.with_suffix(".body.png")
    tmp_h = out.with_suffix(".hmd.png")
    for src, t, tmp in ((body, t_body, tmp_b), (hmd_crop, t_crop, tmp_h)):
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(src),
             "-frames:v", "1", "-vf", "scale=-2:540", str(tmp)], check=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(tmp_b), "-i", str(tmp_h),
         "-filter_complex", "hstack", str(out)], check=True)
    tmp_b.unlink(missing_ok=True)
    tmp_h.unlink(missing_ok=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    ap.add_argument("--apply", action="store_true",
                    help="cut with the proposed b (NVENC) — sign-off gated")
    args = ap.parse_args()

    report = ["# Bodycam sync verification — 2026-08-04 (stimulus-mix xcorr)",
              "",
              "Sync channel: bodycam a:0 carries the same desktop/stimulus mix"
              " as HMD a:0 (bodycam a:1 room-mic is silent — root cause of the"
              " earlier refusals). b maps bodycam_t = et_t + b.", ""]
    for s in discover_sessions():
        if s.name not in USER_B:
            continue
        if args.only and args.only.lower() not in s.key.lower():
            continue
        b_cand = USER_B[s.name]
        ev = json.loads((s.dir / "CropEvents.json").read_text())
        w = ev["window"]
        b_hmd = ev["sync"]["b_s"]
        bdur = ffprobe_duration(s.bodycam_video)
        sdir = VERIF_DIR / s.name
        sdir.mkdir(parents=True, exist_ok=True)

        rows = []
        for tag, et_c in (("early", w["start_et_s"] + WIN_INSET_S),
                          ("late", w["end_et_s"] - WIN_INSET_S)):
            r = stim_xcorr(s.hmd_video, s.bodycam_video, et_c, b_hmd,
                           b_cand, bdur)
            if r is not None:
                rows.append({"window": tag, **r})

        strong = [r for r in rows if r["z"] >= Z_STRONG]
        if len(strong) == 2 and abs(strong[0]["b"] - strong[1]["b"]) <= AGREE_S:
            b_prop = float(np.mean([r["b"] for r in strong]))
            grade = "STRONG"
        elif len(strong) == 1:
            b_prop, grade = strong[0]["b"], "SINGLE-STRONG — review"
        else:
            b_prop, grade = b_cand, "USER-ANCHOR-ONLY — review"

        c0, c1 = w["start_et_s"] + b_prop, w["end_et_s"] + b_prop
        dur = w["duration_s"]
        hmd_crop = s.hmd_video.with_name(s.hmd_video.stem + "_Crop.mkv")
        for tag, t_rel in (("start", 1.0), ("mid", dur / 2), ("end", dur - 1.0)):
            frame_pair(s.bodycam_video, hmd_crop, c0 + t_rel, t_rel,
                       sdir / f"frame_{tag}_bodycam-vs-hmdcrop.png")

        report += [f"## {s.name}", "",
                   f"- user-anchor candidate b = {b_cand:+.2f} s; "
                   f"HMD sync b_s = {b_hmd:+.2f}; bodycam dur {bdur:.1f} s",
                   f"- **proposed b = {b_prop:+.2f} s** ({grade}); "
                   f"cut window (bodycam clock) {c0:.2f}–{c1:.2f} s "
                   f"({dur:.1f} s); delta to user anchor "
                   f"{b_prop - b_cand:+.2f} s", "",
                   "| window | b (s) | peak z | runner-up z |", "|---|---|---|---|"]
        report += [f"| {r['window']} | {r['b']:+.2f} | {r['z']:.1f} "
                   f"| {r['z2']:.1f} |" for r in rows] or ["| (none) | — | — | — |"]
        report.append("")
        print(f"{s.key}: b_prop {b_prop:+.2f} ({grade}); "
              + "; ".join(f"{r['window']} b={r['b']:+.2f} z={r['z']:.1f}"
                          for r in rows))

        if args.apply and grade == "STRONG":
            out = s.bodycam_video.with_name(s.bodycam_video.stem + "_Crop.mkv")
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0.0, c0):.3f}",
                 "-t", f"{dur:.3f}", "-i", str(s.bodycam_video),
                 "-c:v", "hevc_nvenc", "-preset", "p5", "-cq", "23",
                 "-c:a", "aac", "-b:a", "160k", str(out)], check=True)
            ev["bodycam"] = {"b_body_s": b_prop, "method": "stimulus-mix-xcorr",
                             "windows": rows, "user_anchor_b_s": b_cand,
                             "out": out.name}
            (s.dir / "CropEvents.json").write_text(json.dumps(ev, indent=2))
            print(f"    wrote {out.name}")

    (VERIF_DIR / "VERIFICATION-REPORT.md").write_text("\n".join(report))
    print(f"\nreport: {VERIF_DIR / 'VERIFICATION-REPORT.md'}")


if __name__ == "__main__":
    main()
