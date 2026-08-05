"""Phase B0: harden per-session video sync (b) by consensus anchor selection.

The Phase A cue picker chose each cue independently (best fuzzy score near the
prior), so a single false match inflates the anchor spread. Here we re-use the
cached whisper transcripts, enumerate ALL candidate hits for every cue slot, and
pick the subset whose implied b values agree most tightly. CSV windows are
untouched (ET-clock, closure-anchored); only the video mapping in
CropEvents.json (sync + window.start_v_s/end_v_s) is updated.

Usage: python harden_sync.py [--only SUBSTR] [--apply]
"""
from __future__ import annotations

import argparse
import itertools
import json
from pathlib import Path

import numpy as np

from common import (CUE_CLOSE_VARIANTS, CUE_OPEN_VARIANTS, L_CLOSE_S, L_OPEN_S,
                    SCRATCH, discover_sessions)
from events import find_phrase

CONSENSUS_TOL_S = 2.5
MIN_SCORE = 0.75
ENERGY_VETO_DB = -2.0   # aliased offsets put "stimulus" in closure silence


def load_words(sdir: Path, label: str, track: int) -> list:
    words = []
    for sub in ("", "wh_small"):
        p = sdir / sub / f"{label}_a{track}.json" if sub else sdir / f"{label}_a{track}.json"
        if not p.exists():
            continue
        data = json.loads(p.read_text())
        for seg in data.get("segments", []):
            for w in seg.get("words", []):
                import re
                words.append((re.sub(r"[^a-z0-9 ]+", "", w["word"].strip().lower()),
                              float(w["start"]), float(w["end"])))
    return words


def window_offsets(ev: dict) -> dict:
    """Reconstruct the wav extraction offsets used in Phase A."""
    b0 = ev["b0_prior_s"]
    vdur = ev["video_duration_s"]
    sr, er = ev["start_run"], ev["end_run"]
    return {
        "start": max(0.0, sr["t_on"] + b0 - 60.0),
        "end": max(0.0, er["t_on"] + b0 - 90.0),
    }


def candidates(ev: dict, sdir: Path) -> list[tuple[str, float, float, str]]:
    """All (slot, b_implied, score, text) anchor candidates from cached words."""
    offs = window_offsets(ev)
    sr, er = ev["start_run"], ev["end_run"]
    out = []
    for label, slot_defs in (
        ("start", (("start_close", CUE_CLOSE_VARIANTS, sr["t_on"], L_CLOSE_S, "on"),
                   ("start_open", CUE_OPEN_VARIANTS, sr["t_off"], L_OPEN_S, "off"))),
        ("end", (("end_close", CUE_CLOSE_VARIANTS, er["t_on"], L_CLOSE_S, "on"),
                 ("end_open", CUE_OPEN_VARIANTS, er["t_off"], L_OPEN_S, "off"))),
    ):
        for track in (0, 1):
            words = load_words(sdir, label, track)
            wav_off = offs[label]
            for slot, variants, et_edge, lat, kind in slot_defs:
                for phrase, tracks in variants:
                    if track not in tracks:
                        continue
                    for h in find_phrase(words, phrase, MIN_SCORE):
                        t_abs = h["t_on"] + wav_off if kind == "on" else h["t_off"] + wav_off
                        b = t_abs + lat - et_edge
                        out.append((slot, b, h["score"], f"{phrase}@{t_abs:.1f}"))
    return out


def clusters(cands: list) -> list[dict]:
    """Cluster candidate b values (2.5 s linkage); one best candidate per slot
    within a cluster. Returns clusters with b, members, slot count, two-sidedness."""
    out = []
    for c in sorted(cands, key=lambda c: c[1]):
        if out and c[1] - out[-1]["members"][-1][1] <= CONSENSUS_TOL_S:
            out[-1]["members"].append(c)
        else:
            out.append({"members": [c]})
    for cl in out:
        best_per_slot: dict[str, tuple] = {}
        for c in cl["members"]:
            if c[0] not in best_per_slot or c[2] > best_per_slot[c[0]][2]:
                best_per_slot[c[0]] = c
        cl["members"] = sorted(best_per_slot.values(), key=lambda c: c[0])
        bs = [c[1] for c in cl["members"]]
        cl["b"] = float(np.median(bs))
        cl["span"] = float(max(bs) - min(bs))
        cl["n_slots"] = len(bs)
        cl["two_sided"] = (any(c[0].startswith("start") for c in cl["members"])
                           and any(c[0].startswith("end") for c in cl["members"]))
    return out


def energy_contrast(ev: dict, sdir: Path, b: float) -> float | None:
    """Stimulus-onset test: env after implied reopen minus env before (the 30 s
    closure before the true reopen is silent; stimulus starts right after)."""
    from events import rms_envelope
    wav = sdir / "start_a0.wav"
    if not wav.exists():
        return None
    t, env = rms_envelope(wav)
    t = t + window_offsets(ev)["start"]
    reopen_v = ev["start_run"]["t_off"] + b
    pre = env[(t >= reopen_v - 25) & (t <= reopen_v - 3)]
    post = env[(t >= reopen_v + 3) & (t <= reopen_v + 25)]
    if len(pre) < 10 or len(post) < 10:
        return None
    eps = 1e-5
    return float(20 * np.log10((np.median(post) + eps) / (np.median(pre) + eps)))


def pick(ev: dict, sdir: Path, cands: list) -> tuple[dict | None, list[dict]]:
    """Rank feasible clusters: hard window-fit bound, then energy contrast,
    slot count, two-sidedness."""
    w, vdur = ev["window"], ev["video_duration_s"]
    ranked = []
    for cl in clusters(cands):
        b = cl["b"]
        cl["feasible"] = (w["start_et_s"] + b >= -2.0
                          and w["end_et_s"] + b <= vdur + 2.0)
        cl["energy_db"] = energy_contrast(ev, sdir, b)
        e = cl["energy_db"]
        # energy is a VETO against ~30s close/open aliasing (silence after the
        # implied reopen), not a promoter — Clinical stimuli start quiet.
        cl["rank"] = (cl["feasible"], e is None or e > ENERGY_VETO_DB,
                      cl["two_sided"], cl["n_slots"],
                      -abs(b - ev["b0_prior_s"]))
        ranked.append(cl)
    ranked.sort(key=lambda c: c["rank"], reverse=True)
    best = ranked[0] if ranked and ranked[0]["feasible"] else None
    return best, ranked


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    for s in discover_sessions():
        if args.only and args.only.lower() not in s.key.lower():
            continue
        evp = s.dir / "CropEvents.json"
        ev = json.loads(evp.read_text())
        if "video_duration_s" not in ev:
            print(f"{s.key}: no video — skip")
            continue
        sdir = SCRATCH / s.key
        cands = candidates(ev, sdir)
        best, ranked = pick(ev, sdir, cands)
        b_old = ev.get("sync", {}).get("b_s")
        b0 = ev["b0_prior_s"]
        if best is None:
            print(f"{s.key}: NO FEASIBLE CONSENSUS ({len(cands)} candidates) — "
                  f"keep b={b_old}  ** NEEDS MANUAL REVIEW **")
            continue
        b_new, n, span = best["b"], best["n_slots"], best["span"]
        e = best["energy_db"]
        note = " ".join(f"{m[0]}:{m[3]}(b={m[1]:+.1f})" for m in best["members"])
        alt = []
        for c in ranked[1:4]:
            e_txt = "" if c["energy_db"] is None else f",{c['energy_db']:.0f}dB"
            alt.append(f"{c['b']:+.1f}({'F' if c['feasible'] else 'x'}{e_txt})")
        print(f"{s.key}: b {b_old if b_old is None else round(b_old, 2)} -> "
              f"{b_new:+.2f} (slots {n}, span {span:.2f}s, "
              f"energy {'n/a' if e is None else f'{e:+.0f}dB'}, "
              f"two-sided {best['two_sided']}, b0 {b0:+.1f})")
        print(f"    {note}")
        if len(ranked) > 1:
            print(f"    alternatives: {alt}")
        if args.apply:
            ev["sync"] = {"b_s": b_new, "method": "consensus+energy",
                          "anchors_used": n, "span_s": span,
                          "energy_db": e, "two_sided": best["two_sided"],
                          "members": [f"{m[0]}={m[3]}" for m in best["members"]],
                          "b_old": b_old}
            w = ev["window"]
            w["start_v_s"] = w["start_et_s"] + b_new
            w["end_v_s"] = w["end_et_s"] + b_new
            flags = [f for f in ev["flags"] if not f.startswith("SYNC_")]
            if e is not None and e <= 3.0:
                flags.append("SYNC_ENERGY_WEAK")
            if not best["two_sided"]:
                flags.append("SYNC_ONE_SIDED")
            if abs(b_new - b0) > 45.0:
                flags.append(f"SYNC_VS_PRIOR_{b_new - b0:+.0f}S")
            ev["flags"] = flags
            evp.write_text(json.dumps(ev, indent=2))


if __name__ == "__main__":
    main()
