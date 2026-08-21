"""T2 merge: combine pass1/pass2 coded files, compute agreement, auto-adjudicate
rule-governed disagreements, queue the rest for manual adjudication.

Merge rules (documented in 02-codebook-final.md):
  - Families D/E/G/F + X + flags: UNION (mention-level; union safe).
  - Families A/B/C (analytically load-bearing): intersection auto-kept; one-pass-only
    codes auto-accepted iff a keyword warrant matches the text, else queued.
  - A1 sub-tags: if both passes agree A1.* but differ on sub-tag, keep all
    text-warranted sub-tags; drop A1.other when a specific sub-tag is kept.
  - A4-DIV: keep if either pass flags (sensitivity); agreement level recorded;
    final register is reviewed manually downstream.
Outputs: 03-coded-corpus.csv · adjudication-queue.txt · agreement-stats.txt
"""
import csv, re, os
from collections import Counter, defaultdict

BASE = "tmp/Dissertation/Part_III/survey-analysis"
texts = {}
for r in csv.DictReader(open(f"{BASE}/data/open_text.csv", encoding="utf-8")):
    texts[(r["rcode"], r["item"])] = r["text"]

def load(pass_prefix):
    out = {}
    problems = []
    for n in range(1, 7):
        p = f"{BASE}/coding/{pass_prefix}-{n}.txt"
        if not os.path.exists(p):
            problems.append(f"MISSING FILE {p}")
            continue
        for ln, line in enumerate(open(p, encoding="utf-8"), 1):
            line = line.strip()
            if not line:
                continue
            parts = line.split("|")
            if len(parts) < 3:
                problems.append(f"{pass_prefix}-{n}:{ln} malformed: {line[:60]}")
                continue
            rc, item = parts[0].strip(), parts[1].strip()
            codes = set(c.strip() for c in parts[2].split(";") if c.strip())
            ev = parts[3].strip() if len(parts) > 3 else ""
            if (rc, item) not in texts:
                problems.append(f"{pass_prefix}-{n}:{ln} unknown key {rc}/{item}")
                continue
            out[(rc, item)] = (codes, ev)
    return out, problems

P1, prob1 = load("pass1")
P2, prob2 = load("pass2")

UNION_FAM = ("D", "E", "G", "F", "X", "H")
KEYWORDS = {
    "A1.crash": r"crash|bug|glitch|freez|broke|error",
    "A1.lag": r"lag|buffer|load|slow|optimi|performance|fps|frame",
    "A1.nav": r"navigat|find|lost|confus|wayfind|map|locate|figure out where",
    "A1.dark": r"dark|dim|see|blurry|grainy|visib|legib|quality of the (video|image)",
    "A1.install": r"install|download|setup|set up|compatib|run on|open|launch",
    "A1.hw": r"headset|laptop|computer.*(weak|old|couldn)|hardware|equipment|vr set",
    "A1.prox": r"close|distance|near the screen",
    "A1.occl": r"avatar|bodies|in the way|block",
    "A3-MONOTONY": r"monoton|boring|bored|repetit|tedious|dry|dull",
    "B1-FALLBACK": r"youtube|videos instead|online videos|resort",
    "B2-MINIMAL": r"just for the quiz|bare minimum|skimm|only watched",
    "C1-DRAG": r"drag|forever|so long|too long to sit|couldn'?t sit|felt long",
    "C3-LENGTH": r"long|short|length|duration",
    "A5-WITHDRAWN": r"gave up|stopped|quit|abandon|didn'?t bother",
    "A2-DIFFUSE": r"",
}

def fam(code):
    return code.split(".")[0].split("-")[0][0] if code and code[0] in "ABCDEFGHX" else "?"

rows, queue = [], []
code_stats = defaultdict(lambda: [0, 0, 0])  # both, p1only, p2only
jaccs = []

single_pass = 0
for key in sorted(texts):
    t = texts[key].lower()
    in1, in2 = key in P1, key in P2
    c1, e1 = P1.get(key, (set(), ""))
    c2, e2 = P2.get(key, (set(), ""))

    # LEAN DESIGN: single-passed keys accept their pass's codes directly (tidy only);
    # reliability machinery runs ONLY on double-coded keys (batch 6).
    if not (in1 and in2):
        single_pass += 1
        final = set(c1 | c2)
        if any(c.startswith("A1.") and c != "A1.other" for c in final):
            final.discard("A1.other")
        rows.append({"rcode": key[0], "item": key[1],
                     "term": key[0].split("-")[0],
                     "codes": ";".join(sorted(final)),
                     "disputed": "",
                     "agree_jaccard": "",
                     "evidence": (e1 or e2)[:200]})
        continue

    both = c1 & c2
    only1, only2 = c1 - c2, c2 - c1
    for c in both: code_stats[c][0] += 1
    for c in only1: code_stats[c][1] += 1
    for c in only2: code_stats[c][2] += 1
    uni = c1 | c2
    jaccs.append(len(both) / len(uni) if uni else 1.0)

    final = set(both)
    needs_manual = []
    for c in (only1 | only2):
        f0 = fam(c)
        if f0 in UNION_FAM or c in ("TRANSLATED", "MASK"):
            final.add(c)
        elif c == "A4-DIV":
            final.add(c)  # sensitivity; reviewed downstream
        else:
            rx = KEYWORDS.get(c, None)
            if rx and re.search(rx, t):
                final.add(c)          # keyword-warranted auto-accept
            else:
                needs_manual.append(c)
    # tidy: drop A1.other if a specific A1.* present
    if any(c.startswith("A1.") and c != "A1.other" for c in final):
        final.discard("A1.other")
    ev = "; ".join(x for x in (e1, e2) if x)[:200]
    rows.append({"rcode": key[0], "item": key[1],
                 "term": key[0].split("-")[0],
                 "codes": ";".join(sorted(final)),
                 "disputed": ";".join(sorted(needs_manual)),
                 "agree_jaccard": f"{(len(both)/len(uni)) if uni else 1.0:.2f}",
                 "evidence": ev})
    if needs_manual:
        queue.append(f"{key[0]}|{key[1]}|{texts[key]}|p1:{';'.join(sorted(c1))}|p2:{';'.join(sorted(c2))}|disputed:{';'.join(sorted(needs_manual))}")

with open(f"{BASE}/03-coded-corpus.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=["rcode", "term", "item", "codes", "disputed", "agree_jaccard", "evidence"])
    w.writeheader(); w.writerows(rows)
open(f"{BASE}/coding/adjudication-queue.txt", "w", encoding="utf-8").write("\n".join(queue) + "\n")

stats = [f"responses: {len(rows)}  coverage p1: {len(P1)}  p2: {len(P2)}  single-pass: {single_pass}  double-coded: {len(jaccs)}",
         f"mean jaccard agreement (reliability subsample, batch 6 only): {(sum(jaccs)/len(jaccs)) if jaccs else 0:.3f}",
         f"manual-adjudication queue: {len(queue)}",
         f"parse problems: {len(prob1)+len(prob2)}"]
stats += [f"  {p}" for p in (prob1 + prob2)[:20]]
stats.append("\ncode  both  p1only  p2only  agree%")
for c, (b, o1, o2) in sorted(code_stats.items(), key=lambda kv: -(sum(kv[1]))):
    tot = b + o1 + o2
    stats.append(f"{c:16s} {b:5d} {o1:6d} {o2:6d}  {100*b/max(tot,1):.0f}%")
open(f"{BASE}/coding/agreement-stats.txt", "w", encoding="utf-8").write("\n".join(stats) + "\n")
print("\n".join(stats[:10]))
