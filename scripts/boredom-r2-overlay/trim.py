"""Phase A CSV trimming: write `<original stem>_Crop.csv` beside each original,
containing only rows whose timestamp falls inside the session's analysis window,
with a `t_rel_s` column appended. Original rows are copied byte-identically
(text passthrough) — only the new column is added. Originals are never modified.
"""
from __future__ import annotations

from pathlib import Path

from common import TS_CANDIDATES, TS_VALID_MIN, Session


def trim_csv(path: Path, start_us: float, end_us: float) -> dict:
    out_path = path.with_name(path.stem + "_Crop.csv")
    kept = total = short = 0
    t_first = t_last = None
    non_monotonic = 0
    with open(path, "r", newline="") as fin, open(out_path, "w", newline="") as fout:
        raw_header = fin.readline()
        eol = "\r\n" if raw_header.endswith("\r\n") else "\n"
        header = raw_header.rstrip("\r\n")
        cols = header.split(",")
        ts_idx = [cols.index(c) for c in TS_CANDIDATES if c in cols]
        if not ts_idx:
            raise RuntimeError(f"{path.name}: no timestamp column found")
        fout.write(header + ",t_rel_s" + eol)
        prev_ts = None
        for line in fin:
            total += 1
            row = line.rstrip("\r\n")
            if not row:
                continue
            fields = row.split(",")
            if len(fields) < len(cols):
                short += 1  # recorder killed mid-write; payload fields missing
                continue
            ts = None
            for i in ts_idx:
                try:
                    v = float(fields[i])
                except (ValueError, IndexError):
                    continue
                if v > TS_VALID_MIN:
                    ts = v
                    break
            if ts is None or not (start_us <= ts <= end_us):
                continue
            if prev_ts is not None and ts < prev_ts:
                non_monotonic += 1
            prev_ts = ts
            t_rel = (ts - start_us) / 1e6
            if t_first is None:
                t_first = t_rel
            t_last = t_rel
            fout.write(f"{row},{t_rel:.6f}{eol}")
            kept += 1
    return {"file": path.name, "out": out_path.name, "rows_in": total,
            "rows_kept": kept, "rows_truncated_skipped": short,
            "t_rel_first": t_first, "t_rel_last": t_last,
            "non_monotonic": non_monotonic}


def trim_session(session: Session, ev: dict) -> list[dict]:
    w = ev["window"]
    return [trim_csv(p, w["start_us"], w["end_us"])
            for _, p in sorted(session.stream_csvs.items())]
