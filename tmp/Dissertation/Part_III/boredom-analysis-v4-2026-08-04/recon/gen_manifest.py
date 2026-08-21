"""Generate the N=12 file manifest.

PII design: redaction BY CONSTRUCTION. No name-bearing string is ever emitted --
subject folder names and subject-resident filenames are never printed, only
reconstructed descriptions (label + stimulus + window + format). Recorder-tree
filenames are date-stamped, carry no name, and are printed verbatim.
A substring guard at the end is a backstop, not the mechanism.
"""
import os, re, sys, glob, hashlib
import pandas as pd

sys.path.insert(0, "/home/dalton/projects/claudeflow-testing/scripts/boredom-o9")
sys.path.insert(0, "/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Part_III/boredom-o9-processing")
from common import subject_map, norm_stim, STIMULI
import ch_hmd, ch_hmd_r2

OUTMD = sys.argv[1]
R1ROOT = "/mnt/d/PhD/Dissertation/Boredom Experiment"
R2ROOT = os.path.join(R1ROOT, "Boredom Experiment Round 2")
SUB2 = ch_hmd_r2.subjects_dir()
ETD = os.path.join(R2ROOT, "EyeTrackingDatasets", "EyeTrackingDatasets")
LOGS = [r for r, d, f in os.walk(R2ROOT) if os.path.basename(r) == "Data Logs"][0]

STIMNAME = {"BOR": "Boring", "CLC": "Clinical", "INT": "Interesting"}


def sz(p):
    b = os.path.getsize(p)
    return f"{b/1e9:.2f} GB" if b >= 1e9 else (f"{b/1e6:.1f} MB" if b >= 1e6 else f"{b/1e3:.1f} KB")


def ncols(p):
    with open(p, errors="replace") as fh:
        return fh.readline().count(",") + 1


KIND = {32: "eye", 16: "imu", 8: "cog/hrv", 7: "hr"}
L = []
w = L.append

w("# Boredom Experiment — FILE MANIFEST for the N=12 analysis")
w("")
w("Generated 2026-07-30 from the live trees.")
w("")
w("**PII rule in force, applied by construction.** No subject folder name and no subject-resident filename is")
w("reproduced anywhere in this document — those are described structurally instead (label, stimulus, window,")
w("format). Recorder-tree CSV filenames are date-stamped rather than person-named and are given verbatim so you")
w("can find them. Subject labels come from sorted lexicographic folder order at runtime: `S01` is the first")
w("folder in Round 1 `Subjects/` under `ls | sort`, `S02` the second, and so on; likewise `R2-01`…`R2-04`.")
w("")
w("## Roots")
w("")
w("```")
w(f"R1    {R1ROOT}/Subjects/")
w(f"R2    {SUB2}/")
w(f"ETD   {ETD}/")
w(f"LOGS  {LOGS}/")
w("```")
w("")

# ---------------------------------------------------------------- A. _Test
w("## A. `_Test` sessions — EXCLUDED from the cohort, reported as instrument validation")
w("")
w("All three sit directly under `LOGS/`. Each is a **truncated *Interesting* rehearsal** — none reaches the")
w("~18–20 min of a real episode. To find them: list `LOGS/` and take the three folders whose names end `_Test`.")
w("They are uniquely identified below by their date token. Two of the three are the same person on different")
w("dates; the third is a different person.")
w("")
w("| # | folder name pattern | date | eye rows | eye span | vs 17-min stimulus |")
w("|---|---|---|---|---|---|")
tests = []
for s in sorted(os.listdir(LOGS)):
    if "_test" not in s.lower():
        continue
    m = re.search(r"\d{2}-\d{2}-\d{2}", s)
    has_et = "_ET_" in s
    rows = span = None
    for r, _, fs in os.walk(os.path.join(LOGS, s)):
        for f in sorted(fs):
            p = os.path.join(r, f)
            if not f.lower().endswith(".csv") or os.path.getsize(p) == 0:
                continue
            if KIND.get(ncols(p)) == "eye":
                df = pd.read_csv(p, low_memory=False)
                rows = len(df)
                v = pd.to_numeric(df["ts/sys"], errors="coerce")
                v = v[v > 0]
                med = v.median()
                v = v[(v > med - 1e12) & (v < med + 1e12)]
                span = (v.max() - v.min()) / 1e6
    tests.append((s, m.group(0), rows, span))
    pat = f"<name>_{m.group(0)}_{'ET_' if has_et else ''}Interesting_Test"
    w(f"| {len(tests)} | `{pat}` | {m.group(0)} | {rows:,} | **{span/60:.2f} min** | {span/60/17*100:.0f}% |")
w("")
w("Per-session file detail (these filenames carry no name):")
w("")
for s, date, _, _ in tests:
    w(f"**date {date}**")
    w("")
    w("```")
    for r, _, fs in os.walk(os.path.join(LOGS, s)):
        for f in sorted(fs):
            p = os.path.join(r, f)
            if not f.lower().endswith(".csv"):
                continue
            b = os.path.getsize(p)
            kind = "ZERO-BYTE" if b == 0 else KIND.get(ncols(p), f"{ncols(p)}col")
            w(f"  {f:42s} {kind:9s} {'' if b == 0 else sz(p)}")
    w("```")
    w("")
w("The cohort window is 2024-03-13 → 2024-03-21; these sit one to five weeks earlier. Their retention and rate")
w("figures go into `QC-REPORT.md` so the instrument-validation claim is evidenced rather than asserted.")
w("")

# ------------------------------------------------------- B. undated non-cohort
w("## B. Undated recorder sessions — EXCLUDED (cohort confirmed as twelve by the author)")
w("")
w("These four folder names are numeric only — no person name, no stimulus label — so they are given verbatim.")
w("")
w("| # | folder | eye rows | eye span | streams | reading |")
w("|---|---|---|---|---|---|")
und = 0
for s in sorted(os.listdir(LOGS)):
    if "_test" in s.lower() or re.search(r"\d{2}-\d{2}-\d{2}", s):
        continue
    und += 1
    rows = span = None
    streams = []
    for r, _, fs in os.walk(os.path.join(LOGS, s)):
        for f in sorted(fs):
            p = os.path.join(r, f)
            if not f.lower().endswith(".csv") or os.path.getsize(p) == 0:
                continue
            streams.append(f.split("-")[0])
            if KIND.get(ncols(p)) == "eye":
                df = pd.read_csv(p, low_memory=False)
                rows = len(df)
                v = pd.to_numeric(df["ts/sys"], errors="coerce")
                v = v[v > 0]
                med = v.median()
                v = v[(v > med - 1e12) & (v < med + 1e12)]
                span = (v.max() - v.min()) / 1e6
    note = ("**candidate re-export of R2-03 INT** — and it carries the IMU stream that R2-03 INT lacks"
            if span and span > 2000 else "aborted / setup capture")
    w(f"| {und} | `{s}` | {rows:,} | {span/60:.2f} min | {', '.join(streams)} | {note} |")
w("")
w("These four contribute 15 of the 27 non-duplicate recorder CSVs; the three `_Test` sessions contribute the")
w("other 12. None is a cohort participant.")
w("")

# ---------------------------------------------------------------- C. Round 1
w("## C. INCLUDED — Round 1 (S01–S08)")
w("")
w("Every Round 1 HMD file follows the on-disk pattern `<participant>_HMD_<Stimulus>_Crop.<ext>`, so only the")
w("varying part is listed. Each cell reads the **crop window only**; if a crop were ever absent the run fails and")
w("logs rather than substituting the full recording.")
w("")
w("| subj | BOR | CLC | INT | rows (B/C/I) | EEG `.mat` | `.fig` unique | survey |")
w("|---|---|---|---|---|---|---|---|")
n_crop = n_eeg = n_fig = 0
for sid, path in subject_map():
    ff = ch_hmd.find_files(os.path.join(path, "HMD"))
    exts, rows = [], []
    for s in STIMULI:
        c = ff[s]["crop"]
        n_crop += 1
        ext = os.path.splitext(c)[1].lower()
        dup = " (+dup `_Crop 2`)" if "dup-crop" in ff[s]["note"] else ""
        exts.append(f"`_Crop{ext}`{dup}")
        rows.append(len(ch_hmd.read_hmd(c)))
    eegd = os.path.join(path, "EEG")
    ne = sum(1 for f in os.listdir(eegd) if f.lower().endswith(".mat")
             and norm_stim(os.path.splitext(f)[0]) in STIMULI)
    n_eeg += ne
    figs = glob.glob(os.path.join(path, "Images", "**", "*.fig"), recursive=True)
    uniq = {hashlib.md5(open(p, "rb").read()).hexdigest() for p in figs}
    n_fig += len(uniq)
    w(f"| {sid} | {exts[0]} | {exts[1]} | {exts[2]} | {rows[0]:,} / {rows[1]:,} / {rows[2]:,} | "
      f"{ne}/3 | {len(uniq)}{' of '+str(len(figs))+' files' if len(figs)!=len(uniq) else ''} | 1 |")
w("")
w(f"**Round 1 totals: {n_crop} crop windows · {n_eeg} EEG `.mat` · {n_fig} unique `.fig` · 8 surveys.**")
w("")
w("Cell-level flags carried into `QC-REPORT.md`:")
w("")
w("- **S03 CLC** is the only `.xlsx` crop — read via `pd.read_excel(engine='openpyxl')`.")
w("- **S03 `.fig`** set is 35 files containing md5-identical flat and nested duplicates; dedupes to 21.")
w("- **S07 BOR** has a duplicate `_Crop 2`; the plain `_Crop` is used and the duplicate is logged.")
w("- **S07 INT** — the HMD crop parses (2,897 rows, 79.1% eye validity) and all three EEG `.mat` are present.")
w("  What is actually missing is the `.fig` set: 14 files, i.e. 7 signals × 2 stimuli instead of 3. Whether that")
w("  EEG cell is usable is decided empirically at run time, not assumed.")
w("- **S05 BOR** eye validity 21.2% — the sleep episode. Retained, not discarded.")
w("- **S06** is the rate outlier **per cell, not per subject**: BOR 2.98 Hz, CLC 87.9/111.1 Hz,")
w("  INT 99.1/125.0 Hz (mean/median). Rate-sensitive statistics are flagged at cell level.")
w("- **S08** HR dropout: CLC 73.3%, INT 39.2% of rows carry a non-sentinel HR.")
w("")

# ---------------------------------------------------------------- D. Round 2
w("## D. INCLUDED — Round 2 (R2-01–R2-04)")
w("")
w("Round 2 filenames are date-stamped and carry no name, so they are given verbatim. Subject↔stimulus")
w("attribution comes from the folder, never from a filename.")
w("")
w("| subj | stim | eye (32c) | cog (8c) | hr (7c) | imu (16c) | hrv (8c) |")
w("|---|---|---|---|---|---|---|")
cnt = dict(eye=0, cog=0, hr=0, imu=0, hrv=0)
for i, d in enumerate(sorted(os.listdir(SUB2)), 1):
    sid = f"R2-{i:02d}"
    files = ch_hmd_r2.collect(os.path.join(SUB2, d))
    hrv = {}
    for r, _, fs in os.walk(os.path.join(SUB2, d)):
        for f in fs:
            if f.upper().startswith("HRV") and f.lower().endswith(".csv") \
               and os.path.getsize(os.path.join(r, f)) > 0:
                s = ch_hmd_r2.norm_stim(os.path.relpath(r, os.path.join(SUB2, d))) or ch_hmd_r2.norm_stim(f)
                if s:
                    hrv[s] = os.path.join(r, f)
    for s in STIMULI:
        f = files.get(s, {})
        row = []
        for k in ("eye", "cog", "hr", "imu"):
            p = f.get(k)
            row.append(f"`{os.path.basename(p)}`<br>{sz(p)}" if p else "**absent**")
            if p:
                cnt[k] += 1
        p = hrv.get(s)
        row.append(f"`{os.path.basename(p)}`" if p else "**absent**")
        if p:
            cnt["hrv"] += 1
        w(f"| {sid} | {s} | " + " | ".join(row) + " |")
w("")
w(f"**Round 2 totals: {cnt['eye']} eye · {cnt['cog']} cognitive-load · {cnt['hr']} HR · {cnt['imu']} IMU · "
  f"{cnt['hrv']} HRV · 4 surveys.**")
w("")
w("Cell-level flags:")
w("")
w("- **R2-01 INT** carries exactly one corrupt timestamp row (`ts/sys = 17`); the other 140,142 rows are a normal")
w("  19.5-min capture at 120.12 Hz. Because `tsec()` subtracts the minimum, `duration_s` reads 1.7×10⁹ s and the")
w("  time axis collapses, so every slope for that cell is fitted against a degenerate axis. Means, medians, sds")
w("  and variances never touch the time axis and are unaffected. Fixed by a robust-span rule, and logged.")
w("- **R2-02 BOR** has no HR and no IMU file, and its HRV file is absent — the sparsest cell in the set.")
w("- **R2-01 BOR** HRV file exists with 11 rows, none valid.")
w("- **R2-01 INT** and **R2-03 INT** have no IMU → IMU coverage is 9/12.")
w("- **R2-03 INT** runs 40.5 min against the cohort's 18–22, and see §J: it was recorded three days early.")
w("")

# ---------------------------------------------------------------- E-J
w("## E. Surveys — 12 files, one per subject folder")
w("")
w("| round | location | n | use |")
w("|---|---|---|---|")
w("| R1 | Round 1 subject-folder root, `*.txt` | 8 | **used** — filename is person-named and is never read into any output |")
w("| R2 | Round 2 subject folder, `*.txt` | 4 | **used** — attribution from the folder |")
w("| R2 | Round 2 round-root `*.txt` | 8 files / 7 distinct md5 | **not used** — superset, see §I |")
w("")

w("## F. Present but deliberately NOT used")
w("")
nfull = sum(1 for sid, path in subject_map()
            for s in STIMULI if ch_hmd.find_files(os.path.join(path, "HMD"))[s]["full"])
netd = len([f for f in os.listdir(ETD) if f.lower().endswith(".csv")])
nmkv = len(glob.glob(os.path.join(R2ROOT, "**", "*.mkv"), recursive=True))
nvid = len(glob.glob(os.path.join(R1ROOT, "Subjects", "**", "*.mkv"), recursive=True))
w("| what | where | count | why |")
w("|---|---|---|---|")
w(f"| Round 1 full-window HMD CSVs | R1 subject `HMD/` | {nfull} | crop-only rule — the fallback path must never execute |")
w("| Round 1 duplicate `_Crop 2` | S07 BOR | 1 | plain `_Crop` preferred |")
w(f"| ETD curated eye CSVs | `ETD/` | {netd} | cross-check only; `Subjects/` preferred so attribution comes from the folder |")
w("| recorder CSVs duplicating `Subjects/` | `LOGS/` | 43 | already organised |")
w("| recorder CSVs not duplicating | `LOGS/` | 27 | 12 `_Test` + 15 undated non-cohort (§A, §B) |")
w("| zero-byte CSVs | `LOGS/` | 4 | application artefacts |")
w(f"| session video | R1 subject `OBS/` + R2 | {nvid} + {nmkv} | author-ruled out of scope this pass |")
w("| `.ipynb` analysis notebook | Round 2 root | 1 | method documentation, not input |")
w("| VR Data Recorder binaries | `VR Data Recorder/` | ~241 | application install |")
w("")

w("## G. Counts to expect in `RUN-MANIFEST.json`")
w("")
w("```")
w(f"Round 1   {n_crop} crop windows        (8 subjects x 3 stimuli, 0 fallback)")
w(f"          {n_eeg} EEG .mat")
w(f"         {n_fig} unique .fig         (S07 contributes 14, cohort norm 21)")
w("           8 surveys")
w(f"Round 2   {cnt['eye']} eye  |  {cnt['cog']} cog  |  {cnt['hr']} hr  |  {cnt['imu']} imu  |  {cnt['hrv']} hrv")
w("           4 surveys")
w("TOTAL     12 subjects x 3 stimuli = 36 subject-stimulus cells")
w("```")
w("")

w("## H. Two corrections to the existing recon note")
w("")
w("1. **Round 2 does have HRV.** `boredom-round2-recon-2026-07-29.md` states there is no HRV stream and that HRV")
w("   stays at N=8. Eleven `HRV-*.csv` files exist under Round 2 `Subjects/`, header")
w("   `ts/hw,ts/sys,ts/omni,sensor/dev/id,sensor/dev/sub,sensor/loc,sdnn,rmssd`, and **10 of 12 cells carry")
w("   usable rows**. The catch is density: ~10 rows per cell against Round 1's ~2,400, and the quantity differs —")
w("   Round 1 records a single vendor HRV index, Round 2 records `sdnn` and `rmssd` separately. Reported")
w("   within-round with `poolable: false` on both grounds.")
w("2. **An 8-column collision exists in the Round 2 parser.** `ch_hmd_r2.collect()` identifies streams by column")
w("   count alone, and HRV files are 8 columns exactly like cognitive-load files. Today it is harmless: the rule")
w("   is largest-file-wins and every `HRV-*.csv` is ~0 MB against a real `CL-*.csv` — verified, all 12 cells")
w("   selected a `CL-` file. But that is order-of-magnitude luck rather than logic, and in the 02-12-24 `_Test`")
w("   session the HRV file *is* classified as cognitive load. The new tree matches on filename prefix **and**")
w("   header, and asserts the selected column set before use.")
w("")

w("## I. The Round 2 survey-identity question — resolved")
w("")
root = [f for f in sorted(os.listdir(R2ROOT)) if f.lower().endswith(".txt")]
by_md5 = {}
for f in root:
    p = os.path.join(R2ROOT, f)
    by_md5.setdefault(hashlib.md5(open(p, "rb").read()).hexdigest(), []).append(f)
tmpl = {h for h, fs in by_md5.items() if any(re.search("template", x, re.I) for x in fs)}
ndup = sum(1 for fs in by_md5.values() if len(fs) > 1)
folder = {}
for i, d in enumerate(sorted(os.listdir(SUB2)), 1):
    for r, _, fs in os.walk(os.path.join(SUB2, d)):
        for f in fs:
            if f.lower().endswith(".txt"):
                folder[f"R2-{i:02d}"] = hashlib.md5(open(os.path.join(r, f), "rb").read()).hexdigest()
matched = sorted(k for k, h in folder.items() if h in by_md5)
w("The recon note recorded eight root-level `.txt` resolving to six distinct people, called the match unreliable,")
w("and promoted the question to load-bearing because the keystone needs self-report on both sides. It closes:")
w("")
w(f"- **{len(root)} files at the Round 2 root, {len(by_md5)} distinct by md5.**")
w("- **One is a blank instrument template** — not a participant at all. This is what made the count look odd.")
w(f"- **{ndup} exact-duplicate pair** among the rest.")
w(f"- That leaves **{len(by_md5)-len(tmpl)} distinct participant surveys** — precisely the \"six distinct people\"")
w("  the note could not account for.")
w(f"- **{len(matched)} of the 4 in-folder Round 2 surveys have an md5 twin at the root** "
  f"({', '.join(matched)}); the other two exist only inside their subject folder.")
w("")
w("**Consequence:** the four in-folder surveys are authoritative and complete, so self-report exists for all 12")
w("subjects and **the keystone is testable at N=12**. The root-level set is a superset containing non-cohort")
w("material and is not read. The note's stated blocker — \"there is no verified self-report for the Round 2")
w("subjects\" — no longer holds.")
w("")

w("## J. Viewing order, derived from timestamps")
w("")
w("Round 1 states the order in its stimulus headings for one subject only. The wall-clock timestamps in the HMD")
w("crops reproduce that stated order exactly (1/1), which validates the method; order is therefore derived from")
w("timestamps for all 12 subjects rather than left at \"where noted\".")
w("")
w("| subj | round | order | note |")
w("|---|---|---|---|")
w("| S01 | 1 | CLC → BOR → INT | the one subject with a stated order; timestamps agree |")
w("| S02–S04, S06–S08 | 1 | INT → CLC → BOR | |")
w("| S05 | 1 | CLC → BOR → INT | |")
w("| R2-01 | 2 | INT → CLC → BOR | single sitting, 38 / 30 min gaps |")
w("| R2-02 | 2 | INT → CLC → BOR | single sitting, 33 / 35 min gaps |")
w("| R2-03 | 2 | INT → CLC → BOR | **INT recorded 3.10 days earlier**; CLC→BOR gap 27 min |")
w("| R2-04 | 2 | INT → CLC → BOR | single sitting, 33 / 30 min gaps |")
w("")
w("**R2-03 needs flagging in the write-up.** Its *Interesting* episode is not only the 40.5-minute duration")
w("outlier already noted — it was recorded **three days before** that subject's other two episodes. It therefore")
w("carries no within-session carryover from them, and its fatigue-prior item refers to a different day. Any order")
w("or depletion analysis must treat R2-03 INT as a separate sitting.")
w("")

open(OUTMD, "w").write("\n".join(L) + "\n")

# ------------------------------------------------- backstop substring guard
variants = set()


def add(s):
    s = s.strip()
    if len(s) < 3:
        return
    variants.add(s.lower())
    variants.add(re.sub(r"[^a-z0-9]", "", s.lower()))
    for t in re.findall(r"[A-Za-z]{3,}", s):
        variants.add(t.lower())


for _, p in subject_map():
    add(os.path.basename(p))
    for f in os.listdir(p):
        add(os.path.splitext(f)[0])
for d in os.listdir(SUB2):
    add(d)
for s in os.listdir(LOGS):
    add(s)
for f in os.listdir(R2ROOT):
    if f.lower().endswith(".txt"):
        add(os.path.splitext(f)[0])

SAFE = {"survey", "med", "test", "boredom", "experiment", "subjects", "round", "interesting", "clinical",
        "boring", "data", "logs", "recorder", "eyetracking", "imu", "hrv", "csv", "txt", "mat", "fig",
        "images", "hmd", "eeg", "crop", "videos", "phd", "dissertation", "mnt", "eye", "tracking",
        "datasets", "template", "surveytemplate", "obs", "xlsx", "cropcsv", "hr", "cl"}
body = open(OUTMD).read().lower()
leaks = sorted(v for v in variants if v not in SAFE and len(v) >= 3 and v in body)
print(f"lines written: {len(L)}")
print(f"BACKSTOP GUARD: {len(variants)} name variants checked (substring, no word boundaries)")
print(f"LEAKS: {leaks if leaks else 'NONE'}")
