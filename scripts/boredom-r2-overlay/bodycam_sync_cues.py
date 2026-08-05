"""Bodycam sync via voice cues (primary method; envelope xcorr proved too weak
because the subject wore headphones and only sparse room speech is shared).

The bodycam room mic records the experimenter's cue phrases directly. We
transcribe windows around the expected cue times (duration-based prior),
cluster the implied bodycam<->ET offsets exactly like harden_sync, and accept a
two-sided tight consensus. Bodycam window = ET window + b_body.

Usage: python bodycam_sync_cues.py [--only SUBSTR] [--apply]
"""
from __future__ import annotations

import argparse
import json
import subprocess

import numpy as np

from common import (CUE_CLOSE_VARIANTS, CUE_OPEN_VARIANTS, L_CLOSE_S, L_OPEN_S,
                    SCRATCH, discover_sessions, ffprobe_duration)
from events import extract_wav, find_phrase, transcribe_cpu
from harden_sync import CONSENSUS_TOL_S, clusters

ANY_TRACK_CLOSE = [(p, (0, 1)) for p, _ in CUE_CLOSE_VARIANTS]
ANY_TRACK_OPEN = [(p, (0, 1)) for p, _ in CUE_OPEN_VARIANTS]


def n_audio_tracks(video) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a",
         "-show_entries", "stream=index", "-of", "csv=p=0", str(video)],
        capture_output=True, text=True).stdout
    return len([l for l in out.splitlines() if l.strip()])


def collect(session, ev, bdur: float) -> list:
    b0 = bdur - ev["et_duration_s"]
    sr, er = ev["start_run"], ev["end_run"]
    sdir = SCRATCH / session.key / "bodycam"
    wins = {
        "start": (max(0.0, sr["t_on"] + b0 - 90.0),
                  min(bdur, sr["t_off"] + b0 + 120.0)),
        "end": (max(0.0, er["t_on"] + b0 - 120.0),
                min(bdur, er["t_off"] + b0 + 90.0)),
    }
    slot_defs = {
        "start": (("start_close", ANY_TRACK_CLOSE, sr["t_on"], L_CLOSE_S, "on"),
                  ("start_open", ANY_TRACK_OPEN, sr["t_off"], L_OPEN_S, "off")),
        "end": (("end_close", ANY_TRACK_CLOSE, er["t_on"], L_CLOSE_S, "on"),
                ("end_open", ANY_TRACK_OPEN, er["t_off"], L_OPEN_S, "off")),
    }
    ntr = n_audio_tracks(session.bodycam_video)
    cands = []
    for label, (w0, w1) in wins.items():
        for track in range(min(2, ntr)):
            for model in ("base", "small"):
                wav = extract_wav(session.bodycam_video, track, w0, w1,
                                  sdir / f"{label}_a{track}.wav")
                try:
                    words = [(w, s + w0, e + w0)
                             for w, s, e in transcribe_cpu(wav, model)]
                except subprocess.CalledProcessError:
                    continue
                for slot, variants, et_edge, lat, kind in slot_defs[label]:
                    for phrase, tracks in variants:
                        if track not in tracks:
                            continue
                        for h in find_phrase(words, phrase, 0.75):
                            t_abs = h["t_on"] if kind == "on" else h["t_off"]
                            cands.append((slot, t_abs + lat - et_edge,
                                          h["score"], f"{phrase}@{t_abs:.1f}"))
    return cands


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    for s in discover_sessions():
        if args.only and args.only.lower() not in s.key.lower():
            continue
        if s.bodycam_video is None:
            continue
        ev = json.loads((s.dir / "CropEvents.json").read_text())
        w = ev["window"]
        bdur = ffprobe_duration(s.bodycam_video)
        b0 = bdur - ev["et_duration_s"]
        cands = collect(s, ev, bdur)
        ranked = []
        for cl in clusters(cands):
            b = cl["b"]
            cl["feasible"] = (w["start_et_s"] + b >= -2.0
                              and w["end_et_s"] + b <= bdur + 2.0)
            cl["rank"] = (cl["feasible"], cl["two_sided"], cl["n_slots"],
                          -abs(b - b0))
            ranked.append(cl)
        ranked.sort(key=lambda c: c["rank"], reverse=True)
        best = ranked[0] if ranked and ranked[0]["feasible"] else None
        if best is None:
            print(f"{s.key}: no feasible bodycam cue consensus "
                  f"({len(cands)} candidates) — NEEDS REVIEW")
            continue
        accept = best["two_sided"] or abs(best["b"] - b0) < 15.0
        note = " ".join(f"{m[0]}:{m[3]}(b={m[1]:+.1f})" for m in best["members"])
        print(f"{s.key}: b_body {best['b']:+.2f} (slots {best['n_slots']}, "
              f"span {best['span']:.2f}s, two-sided {best['two_sided']}, "
              f"b0 {b0:+.1f}){'' if accept else '  ** WEAK — REVIEW **'}")
        print(f"    {note}")
        if args.apply and accept:
            out = s.bodycam_video.with_name(s.bodycam_video.stem + "_Crop.mkv")
            start = w["start_et_s"] + best["b"]
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0.0, start):.3f}",
                 "-t", f"{w['duration_s']:.3f}", "-i", str(s.bodycam_video),
                 "-c:v", "hevc_nvenc", "-preset", "p5", "-cq", "23",
                 "-c:a", "aac", "-b:a", "160k", str(out)], check=True)
            ev["bodycam"] = {"b_body_s": best["b"], "method": "cue-consensus",
                             "slots": best["n_slots"], "span_s": best["span"],
                             "two_sided": best["two_sided"],
                             "members": [f"{m[0]}={m[3]}" for m in best["members"]],
                             "out": out.name}
            (s.dir / "CropEvents.json").write_text(json.dumps(ev, indent=2))
            print(f"    wrote {out.name}")


if __name__ == "__main__":
    main()
