"""Phase 2A-lite: anonymized audit of the boredom raw dataset (metadata level only —
no .mat processing, no unpublished-subject claims; O-9/O-10 deferred).
Writes: tmp/Dissertation/Part_III/boredom-dataset/00-audit.md
        tmp/Dissertation/Part_III/boredom-dataset/subject-survey-digests.md (anonymized)
Subject codes S01..S08 = sorted(dir names); mapping NOT written anywhere.
"""
import os, re, subprocess, json

ROOT = "/mnt/d/PhD/Dissertation/Boredom Experiment"
OUT = "tmp/Dissertation/Part_III/boredom-dataset"
os.makedirs(OUT, exist_ok=True)

subs = sorted(d for d in os.listdir(f"{ROOT}/Subjects") if os.path.isdir(f"{ROOT}/Subjects/{d}"))
scode = {d: f"S{i+1:02d}" for i, d in enumerate(subs)}

def name_tokens(d):
    toks = re.findall(r"[A-Za-z]+", d)
    return [t for t in toks if t.lower() not in ("med",) and len(t) > 2]

def scrub_text(t, toks):
    for tok in toks:
        t = re.sub(rf"\b{re.escape(tok)}\b", "[S]", t, flags=re.I)
    t = re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+", "[email]", t)
    return t

def human(n):
    for u in ("B", "KB", "MB", "GB"):
        if n < 1024: return f"{n:.0f}{u}"
        n /= 1024
    return f"{n:.1f}TB"

aud = ["# Boredom Raw Dataset — Audit (Phase 2A-lite, anonymized)\n",
       "Metadata-level only (O-9/O-10 deferred). Subject codes S01–S08 by sorted directory order; mapping intentionally not recorded. '(Med)' cohort marker noted where present, meaning unconfirmed.\n"]

aud.append("## Subjects inventory")
dig = ["# Per-Subject Survey Digests (anonymized)\n",
       "Full scrubbed text of each `Survey - <name>.txt` (subject name tokens → [S]).\n"]
for d in subs:
    sc = scode[d]
    med = " · (Med) marker" if "(med)" in d.lower() else ""
    base = f"{ROOT}/Subjects/{d}"
    entries = []
    labeled = []
    surveys = []
    for dirpath, dirnames, filenames in os.walk(base):
        rel = os.path.relpath(dirpath, base)
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            sz = os.path.getsize(p)
            ext = fn.rsplit(".", 1)[-1].lower() if "." in fn else ""
            entries.append((rel, ext, sz))
            if ext == "txt" and "survey" in fn.lower():
                surveys.append(p)
            if ext in ("mp4", "avi", "png") and rel == ".":
                labeled.append((scrub_text(fn, name_tokens(d)), human(sz)))
    from collections import Counter
    per_dir = Counter()
    per_ext = Counter()
    tot = 0
    for rel, ext, sz in entries:
        d0 = rel.split(os.sep)[0] if rel != "." else "(root)"
        per_dir[d0] += 1
        per_ext[ext] += 1
        tot += sz
    aud.append(f"### {sc}{med}")
    aud.append(f"- files: {len(entries)} · total {human(tot)} · by dir: " +
               ", ".join(f"{k}:{v}" for k, v in sorted(per_dir.items())) +
               " · by ext: " + ", ".join(f"{k}:{v}" for k, v in per_ext.most_common()))
    if labeled:
        aud.append("- state-labeled root files: " + "; ".join(f"{n} ({s})" for n, s in labeled))
    for sp in surveys:
        try:
            t = open(sp, encoding="utf-8", errors="replace").read()
        except Exception as e:
            t = f"[unreadable: {e}]"
        t = scrub_text(t, name_tokens(d)).strip()
        dig.append(f"## {sc}{med}\n\n```\n{t}\n```\n")

aud.append("\n## Videos/ (state-contrast compilations)")
vdir = f"{ROOT}/Videos"
for fn in sorted(os.listdir(vdir)):
    p = os.path.join(vdir, fn)
    if not os.path.isfile(p): continue
    info = ""
    try:
        r = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json",
                            "-show_format", "-show_streams", p],
                           capture_output=True, text=True, timeout=60)
        j = json.loads(r.stdout or "{}")
        durs = float(j.get("format", {}).get("duration", 0))
        vs = next((s for s in j.get("streams", []) if s.get("codec_type") == "video"), {})
        info = f"{int(durs//60)}m{int(durs%60):02d}s · {vs.get('width','?')}x{vs.get('height','?')} · {vs.get('avg_frame_rate','?')}fps"
    except Exception as e:
        info = f"[ffprobe failed: {e}]"
    aud.append(f"- `{fn}` — {human(os.path.getsize(p))} · {info}")

aud.append("\n## Naming key (user-confirmed + observed)")
aud.append("CLC=clinical video · INT=interesting (alien-reproduction-vehicles) · Boring=MS-Word tutorial · LA/HA=low/high arousal · IE=intense engagement · E=engagement · ME=moderate engagement · AS=attention span (graded) · EC=eyes closed (confirmed). Unconfirmed: '(Med)' cohort marker; 'B-A' prefix; AS grade levels → ask at O-10.")
aud.append("\n## Deferred (needs GPU session and/or O-9/O-10)")
aud.append("- Frame-tier ingest + comportment reads of the 10 compilations (ffmpeg/whisper on 5090; stop vLLM/embedder first).")
aud.append("- Any .mat/HMD processing (O-9); any subject↔paper mapping or unpublished-subject use (O-10).")

open(f"{OUT}/00-audit.md", "w", encoding="utf-8").write("\n".join(aud) + "\n")
open(f"{OUT}/subject-survey-digests.md", "w", encoding="utf-8").write("\n".join(dig) + "\n")
print(f"subjects: {len(subs)}; wrote 00-audit.md + subject-survey-digests.md")
