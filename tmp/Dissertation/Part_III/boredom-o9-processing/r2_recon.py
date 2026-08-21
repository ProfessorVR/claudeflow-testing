"""Round-2 recon — hard-redacting.

Every emitted path component is filtered: only extensions, sizes, counts, and
whitelisted tokens (stimulus labels, dates, channel names) are printed. Any other
token is replaced with <r>. No participant name can reach output.
"""
import os
import re
import sys

ROOT = "/mnt/d/PhD/Dissertation/Boredom Experiment/Boredom Experiment Round 2"

KEEP = re.compile(
    r"^(HMD|OBS|EEG|Images|Subjects|EyeTrackingDatasets|VR Data Recorder|"
    r"Boring|Boredom|Clinical|Interesting|BOR|CLC|INT|Crop|full|"
    r"\d{2}-\d{2}-\d{2}|\d{4}|survey|Survey|data|Data|log|Log)$", re.I)


def red(name):
    """Redact a single path component to safe tokens."""
    stem, ext = os.path.splitext(name)
    parts = re.split(r"[_\-\s.]+", stem)
    out = [p if (p and KEEP.match(p)) else "<r>" for p in parts if p != ""]
    # collapse runs of <r>
    coll = []
    for p in out:
        if p == "<r>" and coll and coll[-1] == "<r>":
            continue
        coll.append(p)
    return "_".join(coll) + ext


def human(n):
    for u in ("B", "K", "M", "G"):
        if n < 1024 or u == "G":
            return f"{n:.0f}{u}" if u == "B" else f"{n:.1f}{u}"
        n /= 1024


def tree(path, depth=0, maxdepth=3, subj_label=None):
    try:
        entries = sorted(os.listdir(path))
    except OSError:
        return
    dirs = [e for e in entries if os.path.isdir(os.path.join(path, e))]
    files = [e for e in entries if os.path.isfile(os.path.join(path, e))]
    for d in dirs:
        p = os.path.join(path, d)
        n = sum(len(fs) for _, _, fs in os.walk(p))
        sz = sum(os.path.getsize(os.path.join(r, f))
                 for r, _, fs in os.walk(p) for f in fs)
        print(f"{'  '*(depth+1)}DIR  {red(d):<38} {human(sz):>8}  {n:>3} files")
        if depth + 1 < maxdepth:
            tree(p, depth + 1, maxdepth)
    # group files by extension
    byext = {}
    for f in files:
        byext.setdefault(os.path.splitext(f)[1].lower() or "(none)", []).append(f)
    for ext, fs in sorted(byext.items()):
        tot = sum(os.path.getsize(os.path.join(path, f)) for f in fs)
        print(f"{'  '*(depth+1)}     {len(fs):>3} × {ext:<8} {human(tot):>8}"
              f"   e.g. {red(fs[0])}")


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "tree"
    if what == "tree":
        print("=== Round 2 tree (redacted, depth 3) ===")
        tree(ROOT, 0, 3)
    elif what == "csvprobe":
        # HMD CSV format compatibility vs Round 1 (headerless 12-col)
        print("=== HMD CSV format probe: column count + first-row shape ===")
        seen = {}
        for r, _, fs in os.walk(ROOT):
            for f in fs:
                if f.lower().endswith(".csv"):
                    p = os.path.join(r, f)
                    try:
                        with open(p, errors="replace") as fh:
                            first = fh.readline().rstrip("\n")
                    except OSError:
                        continue
                    ncol = first.count(",") + 1
                    # is first row a header (non-numeric first field)?
                    f0 = first.split(",")[0] if first else ""
                    hdr = not re.match(r"^-?\d+(\.\d+)?$", f0.strip())
                    key = (ncol, hdr)
                    seen.setdefault(key, []).append((p, os.path.getsize(p)))
        for (ncol, hdr), lst in sorted(seen.items()):
            tot = sum(s for _, s in lst)
            print(f"  {len(lst):>3} files | {ncol:>3} cols | "
                  f"{'HEADER row' if hdr else 'headerless'} | {human(tot):>8}")
            with open(lst[0][0], errors="replace") as fh:
                l1 = fh.readline().rstrip()[:150]
                l2 = fh.readline().rstrip()[:150]
            print(f"        row1: {l1}")
            print(f"        row2: {l2}")


if __name__ == "__main__":
    main()
