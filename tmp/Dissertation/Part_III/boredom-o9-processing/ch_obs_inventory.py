"""ch-obs inventory — PII-safe.

Reads subject folder names ONLY to derive the canonical S01..S08 order (same rule as
scripts/boredom-o9/common.py). Emits Sxx labels and file metadata; never a real name,
never a source filename.
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, "/home/dalton/projects/claudeflow-testing/scripts/boredom-o9")
import common  # noqa: E402

VIDEO_EXT = {".mp4", ".mkv", ".flv", ".mov", ".avi", ".ts", ".webm"}


def probe(path):
    """ffprobe -> (codec, w, h, fps, duration_s) or None."""
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=codec_name,width,height,avg_frame_rate",
             "-show_entries", "format=duration",
             "-of", "json", path],
            capture_output=True, text=True, timeout=60).stdout
        d = json.loads(out)
        st = (d.get("streams") or [{}])[0]
        num, _, den = (st.get("avg_frame_rate") or "0/1").partition("/")
        fps = (float(num) / float(den)) if den and float(den) else 0.0
        dur = float((d.get("format") or {}).get("duration") or 0.0)
        return st.get("codec_name"), st.get("width"), st.get("height"), fps, dur
    except Exception as e:  # noqa: BLE001
        return ("ERR:" + type(e).__name__, None, None, 0.0, 0.0)


def main():
    total_bytes = total_secs = 0
    rows = []
    for sid, subj_path in common.subject_map():
        # find the OBS-ish folder without echoing names
        cands = []
        for root, dirs, files in os.walk(subj_path):
            for f in files:
                if os.path.splitext(f)[1].lower() in VIDEO_EXT:
                    cands.append(os.path.join(root, f))
        cands.sort()
        for p in cands:
            size = os.path.getsize(p)
            stim = common.norm_stim(os.path.basename(p)) or common.norm_stim(
                os.path.basename(os.path.dirname(p))) or "?"
            codec, w, h, fps, dur = probe(p)
            rows.append((sid, stim, size, codec, w, h, fps, dur, p))
            total_bytes += size
            total_secs += dur

    print(f"{'S':>4} {'stim':>5} {'GB':>7} {'codec':>8} {'WxH':>11} {'fps':>7} {'min':>7}")
    for sid, stim, size, codec, w, h, fps, dur, _ in rows:
        print(f"{sid:>4} {stim:>5} {size/2**30:>7.2f} {str(codec):>8} "
              f"{f'{w}x{h}':>11} {fps:>7.2f} {dur/60:>7.1f}")
    print(f"\nfiles={len(rows)}  total={total_bytes/2**30:.1f} GB  "
          f"duration={total_secs/3600:.2f} h")

    # pick the smallest well-formed file as the pilot; write path OUT-OF-BAND only
    ok = [r for r in rows if r[7] > 60 and not str(r[3]).startswith("ERR")]
    if ok:
        pilot = min(ok, key=lambda r: r[2])
        print(f"\nPILOT CANDIDATE: {pilot[0]} {pilot[1]}  "
              f"{pilot[2]/2**30:.2f} GB  {pilot[7]/60:.1f} min  {pilot[3]} {pilot[4]}x{pilot[5]} @{pilot[6]:.1f}fps")
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               ".pilot-path"), "w") as fh:
            fh.write(pilot[8])
        print("(absolute path written to .pilot-path — untracked, not printed)")


if __name__ == "__main__":
    main()
