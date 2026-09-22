#!/usr/bin/env python3
"""csv_summary.py <profile.csv> [first_frame] [last_frame]
Summarises an Unreal CSV profile (-csvCaptureFrames). Default window: frames from 20 s after the last LoadMap-like
event to the end minus 2 s (steady state standing in the level). Prints frame/thread/GPU times, draw counts, and the
top exclusive timing categories per thread and the top GPU passes, by mean ms per frame."""
import csv
import statistics
import sys

path = sys.argv[1]
rows = []
with open(path, newline="", encoding="utf-8", errors="replace") as f:
    reader = csv.reader(f)
    header = next(reader)
    for r in reader:
        if len(r) < 5 or r[0].startswith("[HasHeaderRowAtEnd]") or r[0] == "EVENTS" and len(rows) > 10:
            break
        rows.append(r)
col = {name: i for i, name in enumerate(header)}


def val(r, name):
    i = col.get(name)
    if i is None or i >= len(r):
        return None
    try:
        return float(r[i])
    except ValueError:
        return None


# steady-state window
ft = [val(r, "FrameTime") or 0.0 for r in rows]
events_i = col.get("EVENTS")
last_load = 0
for n, r in enumerate(rows):
    ev = r[events_i] if events_i is not None and events_i < len(r) else ""
    if "LoadMap" in ev or "Loading" in ev:
        last_load = n
if len(sys.argv) > 2:
    lo, hi = int(sys.argv[2]), int(sys.argv[3])
else:
    t, lo = 0.0, last_load
    while lo < len(rows) and t < 20000.0:
        t += ft[lo]
        lo += 1
    t, hi = 0.0, len(rows)
    while hi > lo and t < 2000.0:
        hi -= 1
        t += ft[hi]
win = rows[lo:hi]
print(f"{path}: {len(rows)} frames captured; window frames {lo}..{hi} ({len(win)} frames, {sum(ft[lo:hi]) / 1000:.1f} s)")


def stats(name):
    v = [x for x in (val(r, name) for r in win) if x is not None]
    if not v:
        return None
    v.sort()
    return statistics.mean(v), v[len(v) // 2], v[min(len(v) - 1, int(0.95 * len(v)))]


for name in ["FrameTime", "GameThreadTime", "RenderThreadTime", "RHIThreadTime", "GPUTime", "RenderThreadTime_CriticalPath",
             "RHI/DrawCalls", "RHI/PrimitivesDrawn", "RenderThreadIdle/Total", "RenderThreadIdle/CriticalPath",
             "RenderThreadIdle/SwapBuffer", "RenderThreadIdle/NonCriticalPath", "RenderThreadIdle/GPUQuery"]:
    s = stats(name)
    if s:
        print(f"  {name:40s} mean {s[0]:9.2f}  median {s[1]:9.2f}  p95 {s[2]:9.2f}")

groups = {}
for name in header:
    if name.startswith("COUNTS/") or name == "EVENTS":
        continue
    parts = name.split("/")
    if parts[0] == "Exclusive" and len(parts) >= 3:
        groups.setdefault("Exclusive/" + parts[1], []).append(name)
    elif parts[0] in ("GPU", "View", "Basic", "RHI", "Slate", "Ticks", "Animation", "Stats", "Physics", "Audio",
                      "MediaStreaming", "Niagara", "FX", "Materials", "RDGCount", "DrawCall", "LightCount", "Shadows"):
        groups.setdefault(parts[0], []).append(name)
for g in sorted(groups):
    items = []
    for name in groups[g]:
        s = stats(name)
        if s and s[0] > 0.0:
            items.append((s[0], s[1], name))
    items.sort(reverse=True)
    if not items:
        continue
    print(f"\n== {g} (top by mean per frame)")
    for mean, med, name in items[:18]:
        print(f"  {mean:9.3f}  (median {med:8.3f})  {name}")
