"""Phase A runner: events -> CSV trims -> verification, CPU-only, then STOP.

Usage:
    /home/dalton/.venv/bin/python run_phase_a.py [--only SUBSTR] [--events-only]

GPU embargo: CUDA is disabled process-wide before anything else; whisper runs with
--device cpu; no video decode occurs (audio demux only). See plan Rev 3, Gate 0.
"""
from __future__ import annotations

import os

os.environ["CUDA_VISIBLE_DEVICES"] = ""  # before any imports that might probe CUDA

import argparse
import json
import sys
import traceback
from datetime import datetime

from common import ROUND2, Session, discover_sessions
from events import extract_events, write_events
from trim import trim_session

EXPECTED_HZ = {"EyeTracking": 120.0}
PILOT_CHECK = {"session": "Abner Portillo_03-21-24_Boring",
               "reopen_et": 44.0, "end_close_et": 1076.3, "tol": 1.0}


def verify(session: Session, ev: dict, trims: list[dict]) -> list[str]:
    problems: list[str] = []
    w = ev.get("window")
    if not w:
        return [f"{session.key}: no window computed"]
    dur = w["duration_s"]
    # window must exclude both instructed closures entirely
    if w["start_et_s"] < ev["start_run"]["t_off"]:
        problems.append("window starts before eyes-open")
    if w["end_et_s"] > w.get("end_anchor_et_s", ev["end_run"]["t_on"]):
        problems.append("window overlaps end closure")
    for t in trims:
        if t["rows_kept"] == 0:
            problems.append(f"{t['file']}: 0 rows kept")
            continue
        if t["non_monotonic"] > 0:
            problems.append(f"{t['file']}: {t['non_monotonic']} non-monotonic ts rows")
        if t["t_rel_first"] < 0 or t["t_rel_last"] > dur + 0.02:
            problems.append(f"{t['file']}: t_rel out of range "
                            f"[{t['t_rel_first']:.3f}, {t['t_rel_last']:.3f}]")
        hz = EXPECTED_HZ.get(t["file"].split("-")[0])
        if hz:
            expect = dur * hz
            if abs(t["rows_kept"] - expect) > 0.05 * expect:
                problems.append(f"{t['file']}: rows {t['rows_kept']} vs "
                                f"expected ~{expect:.0f}")
    if session.key == PILOT_CHECK["session"]:
        if abs(ev["start_run"]["t_off"] - PILOT_CHECK["reopen_et"]) > PILOT_CHECK["tol"]:
            problems.append("pilot cross-check: start reopen drifted")
        if abs(ev["end_run"]["t_on"] - PILOT_CHECK["end_close_et"]) > PILOT_CHECK["tol"]:
            problems.append("pilot cross-check: end closure drifted")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None)
    ap.add_argument("--events-only", action="store_true")
    args = ap.parse_args()

    sessions = discover_sessions()
    if args.only:
        sessions = [s for s in sessions if args.only.lower() in s.key.lower()]
    print(f"Phase A over {len(sessions)} session(s); CUDA disabled: "
          f"CUDA_VISIBLE_DEVICES={os.environ.get('CUDA_VISIBLE_DEVICES')!r}")

    results = []
    for s in sessions:
        print(f"\n=== {s.key}")
        try:
            ev = extract_events(s)
            write_events(s, ev)
            row = {"session": s.key, "events": ev}
            if "window" in ev and not args.events_only:
                trims = trim_session(s, ev)
                row["trims"] = trims
                row["problems"] = verify(s, ev, trims)
            elif "window" not in ev:
                row["problems"] = ["no analysis window (see flags)"]
            else:
                row["problems"] = []
            w = ev.get("window", {})
            sync = ev.get("sync", {})
            print(f"    b={sync.get('b_s', float('nan')):+.2f}s "
                  f"spread={sync.get('spread_s')} "
                  f"window={w.get('start_et_s', 0):.1f}->{w.get('end_et_s', 0):.1f} "
                  f"({w.get('duration_s', 0):.1f}s) flags={ev['flags']}")
            for p in row["problems"]:
                print(f"    PROBLEM: {p}")
        except Exception:
            row = {"session": s.key, "problems": [traceback.format_exc()]}
            print(traceback.format_exc())
        results.append(row)

    report(results)
    bad = [r for r in results if r.get("problems")]
    print(f"\nDone: {len(results) - len(bad)}/{len(results)} clean; "
          f"{len(bad)} with problems/flags to review.")
    return 1 if bad else 0


def report(results: list[dict]) -> None:
    lines = [
        f"# Round 2 CSV Crop — QA Report ({datetime.now():%Y-%m-%d %H:%M})",
        "",
        "Phase A output (plan Rev 3, Gate 0). Originals untouched; every output is a",
        "new `_Crop.csv` beside its original, sharing one analysis window per session.",
        "Window is CSV-primary (user ruling): instructed-closure reopen + 5 s guard ->",
        "end-closure onset - 2 s guard, on the eye-tracker clock; audio cues are used",
        "only for video sync (Phase B) and cross-checks. `t_rel_s` = seconds from",
        "window start, common zero across all streams of a session.",
        "",
        "| Session | Window (ET s) | Dur s | Sync b (spread) | ET rows | CL | HR | HRV | IMU | Flags / problems |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in results:
        ev = r.get("events", {})
        w = ev.get("window", {})
        sync = ev.get("sync", {})
        t = {d["file"].split("-")[0]: d for d in r.get("trims", [])}

        def n(pref: str) -> str:
            return str(t[pref]["rows_kept"]) if pref in t else "—"

        spread = sync.get("spread_s")
        sync_txt = (f"{sync['b_s']:+.2f} ({spread:.2f})" if sync and spread is not None
                    else (f"{sync['b_s']:+.2f}" if sync else "—"))
        trunc = [f"{d['file'].split('-')[0]}: {d['rows_truncated_skipped']} truncated "
                 "row dropped" for d in r.get("trims", [])
                 if d.get("rows_truncated_skipped")]
        issues = "; ".join(ev.get("flags", []) + r.get("problems", []) + trunc) or "clean"
        lines.append(
            f"| {r['session']} | {w.get('start_et_s', 0):.1f}–{w.get('end_et_s', 0):.1f} "
            f"| {w.get('duration_s', 0):.1f} | {sync_txt} | {n('EyeTracking')} "
            f"| {n('CL')} | {n('HR')} | {n('HRV')} | {n('IMU')} | {issues} |")
    bad = [r for r in results if r.get("problems")]
    lines += [
        "",
        f"## Automated verification — {len(results) - len(bad)}/{len(results)} sessions PASSED",
        "",
        "Checks per session: window excludes both instructed closures; every stream's",
        "`t_rel_s` in [0, duration] and monotonic; EyeTracking rows within 5% of",
        "120 Hz x duration; no empty streams; pilot cross-check vs hand-verified rows.",
        "Failures appear as problems in the flags column above. SYNC_*/STIM_*/INSTR_*",
        "flags are Phase B video-sync cross-checks only; they never move CSV windows.",
    ]
    if bad:
        lines.append("")
        lines += [f"- NEEDS REVIEW: {r['session']}" for r in bad]
    out = ROUND2 / "CROP-QA-REPORT-2026-07-31.md"
    out.write_text("\n".join(lines) + "\n")
    print(f"\nQA report: {out}")


if __name__ == "__main__":
    sys.exit(main())
