"""T1: quantitative summary from anonymized derivatives.
Writes 00-data-audit.md and 01-quant-summary.md. Descriptive + associative only.
Strata: APP = Q8 in {Yes, No} (used the 3D app); VID = Q8 'YouTube videos only'; UNK = blank/other.
"""
import csv, math, os
from collections import Counter, defaultdict

BASE = "tmp/Dissertation/Part_III/survey-analysis"
R = list(csv.DictReader(open(f"{BASE}/data/respondents.csv", encoding="utf-8")))
T = list(csv.DictReader(open(f"{BASE}/data/open_text.csv", encoding="utf-8")))
TERMS = ["W25", "S25", "W26"]

def norm_q8(v):
    v = v.strip().lower()
    if not v: return ""
    if "youtube" in v: return "VID-only"
    if v.startswith("yes"): return "Yes"
    if v.startswith("no"): return "No"
    return "other:" + v[:30]

def norm_q7(v):
    v = v.strip().lower()
    if not v: return ""
    return "Yes" if v.startswith("yes") else ("No" if v.startswith("no") else "other:" + v[:30])

def stratum(q8):
    return "APP" if q8 in ("Yes", "No") else ("VID" if q8 == "VID-only" else "UNK")

for r in R:
    r["q7n"], r["q8n"] = norm_q7(r["q7"]), norm_q8(r["q8"])
    r["stratum"] = stratum(r["q8n"])

def tab(counter, keys=None, total=None):
    keys = keys or sorted(counter)
    total = total or sum(counter.values())
    return " · ".join(f"{k}: {counter[k]} ({100*counter[k]/max(total,1):.0f}%)" for k in keys if counter[k])

def dist(field, norm=lambda x: x.strip() or "(blank)"):
    out = {}
    for t in TERMS:
        c = Counter(norm(r[field]) for r in R if r["term"] == t)
        out[t] = c
    return out

def chi2_stat(table):  # table: list of rows (lists)
    rows, cols = len(table), len(table[0])
    rt = [sum(r) for r in table]; ct = [sum(table[i][j] for i in range(rows)) for j in range(cols)]
    n = sum(rt)
    stat = 0.0
    for i in range(rows):
        for j in range(cols):
            e = rt[i] * ct[j] / n
            if e > 0: stat += (table[i][j] - e) ** 2 / e
    dof = (rows - 1) * (cols - 1)
    v = math.sqrt(stat / (n * (min(rows, cols) - 1))) if n and min(rows, cols) > 1 else 0.0
    return stat, dof, v, n

CRIT = {1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 6: 12.592}

aud, q = [], []
q.append("# 01 — Quantitative Summary (T1)\n\nDescriptive + associative only; no causal claims. Strata from Q8: **APP** (answered Yes/No about the 3D app — used it) vs **VID** (YouTube-videos-only) vs UNK (blank). Deployment context: 2D-PC-primary era (author-confirmed); Q8 'Yes' = screen-based presence report.\n")

q.append("## Ns and completion")
c = Counter(r["term"] for r in R)
q.append(f"- Respondents: W25 {c['W25']} · S25 {c['S25']} · W26 {c['W26']} · **total {len(R)}**")
open_ct = Counter((t["term"], t["item"]) for t in T)
q.append(f"- Open responses: **{len(T)}** total; per item/term: " + " · ".join(
    f"{t}/{i}: {open_ct[(t,i)]}" for t in TERMS for i in ["Q5","Q6","Q9","Q10"]))

q.append("\n## Q7 — able to use the platform")
d7 = dist("q7n", lambda x: x or "(blank)")
for t in TERMS: q.append(f"- {t}: {tab(d7[t], total=c[t])}")

q.append("\n## Q8 — immersion/presence report (3-way)")
d8 = dist("q8n", lambda x: x or "(blank)")
for t in TERMS: q.append(f"- {t}: {tab(d8[t], total=c[t])}")

q.append("\n## Strata (from Q8)")
ds = dist("stratum")
for t in TERMS: q.append(f"- {t}: {tab(ds[t], total=c[t])}")
q.append("- Immersion-Yes among APP users: " + " · ".join(
    f"{t}: {sum(1 for r in R if r['term']==t and r['q8n']=='Yes')}/{sum(1 for r in R if r['term']==t and r['stratum']=='APP')}"
    f" ({100*sum(1 for r in R if r['term']==t and r['q8n']=='Yes')/max(1,sum(1 for r in R if r['term']==t and r['stratum']=='APP')):.0f}%)"
    for t in TERMS))

tbl = [[sum(1 for r in R if r["term"] == t and r["stratum"] == s) for t in TERMS] for s in ("APP", "VID")]
stat, dof, v, n = chi2_stat(tbl)
q.append(f"- APP-vs-VID × term (excl. UNK): χ²={stat:.2f}, dof={dof} (crit@.05={CRIT.get(dof,'?')}), Cramér's V={v:.3f}, n={n} → " +
         ("**term-stable** (fail to reject)" if stat < CRIT.get(dof, 1e9) else "**differs by term**"))

q.append("\n## Q7 × Q8 consistency")
cross = Counter((r["q7n"] or "(blank)", r["q8n"] or "(blank)") for r in R)
q.append("- Full cross-tab: " + " · ".join(f"[Q7={a} ∧ Q8={b}]: {n2}" for (a, b), n2 in sorted(cross.items(), key=lambda kv: -kv[1])))
fled = [r["rcode"] for r in R if r["q7n"] == "Yes" and r["q8n"] == "VID-only"]
claim = [r["rcode"] for r in R if r["q7n"] == "No" and r["q8n"] in ("Yes", "No")]
q.append(f"- **Could-use-but-video-only** (Q7=Yes ∧ Q8=VID-only): **{len(fled)}** — the 'hassle-flight despite access' group (DIV-relevant); codes: {', '.join(fled[:20])}{'…' if len(fled)>20 else ''}")
q.append(f"- Inconsistent (Q7=No ∧ Q8 answers about the app): {len(claim)} ({', '.join(claim)})" if claim else "- Inconsistent (Q7=No ∧ Q8 app-answer): 0")

q.append("\n## Demographics (composition caveats for term comparisons)")
for f, label in [("q14", "Academic year"), ("q12", "Gender identity"), ("q13", "First-gen")]:
    dd = dist(f)
    for t in TERMS: q.append(f"- {label} {t}: {tab(dd[t], total=c[t])}")

q.append("\n## Content items (reported once, then excluded)")
q.append("- Q1/Q2 at ceiling in all terms (0.98–1.00 correct, per Item Analysis) → no performance channel; Item-Analysis psychometrics are force-keyed artifacts (survey items carry fake 'correct' answers; W26 α=1.092 impossible) → EXCLUDED from all analysis.")

q.append("\n## Open-text volume")
wb = defaultdict(Counter)
for t in T:
    w = int(t["words"])
    wb[t["item"]]["<10" if w < 10 else ("10-50" if w <= 50 else ">50")] += 1
for i in ["Q5", "Q6", "Q9", "Q10"]:
    q.append(f"- {i}: {sum(wb[i].values())} responses — {tab(wb[i], keys=['<10','10-50','>50'])}")
nonascii = [t for t in T if any(ord(ch) > 0x2500 for ch in t["text"])]
q.append(f"- Non-Latin-script responses (translate + [translated] flag): {len(nonascii)} — " + ", ".join(f"{t['rcode']}/{t['item']}" for t in nonascii))

aud.append("# 00 — Data Audit (T0)\n")
aud.append("- Source: 3 Canvas Student Analysis CSVs (W25/S25/W26), parsed with csv module (multi-line fields safe).")
aud.append(f"- Extraction: `scripts/extract-anonymize.py` → `data/respondents.csv` ({len(R)} rows), `data/open_text.csv` ({len(T)} rows).")
aud.append("- Anonymization: name/id/sis_id/section columns DROPPED; respondent codes <TERM>-Rnnn assigned in raw row order (reproducible from raw + script; no mapping file written). Instructor/author names + emails masked in free text (6 responses affected). Raw dir gitignored 2026-07-06 (`.gitignore` L38).")
aud.append("- All 14 question columns located in all terms (header-snippet matching); attempt=1 throughout; IDs unique per Agent-recon and row counts (102/79/60).")
blanks7 = sum(1 for r in R if not r["q7n"]); blanks8 = sum(1 for r in R if not r["q8n"])
aud.append(f"- Missingness: Q7 blank {blanks7}; Q8 blank {blanks8}; open-item non-response by item/term in 01-quant §Open-text.")
aud.append("- Known limits: single self-report instrument (no depth channel); content items at ceiling; IA stats excluded as artifacts; instrument says 'VR platform' but deployment era is 2D-PC-primary (terminology gap stated once in §III.3).")
aud.append("- PII residual risk: heuristic scrub only (instructor/author/emails); coding passes must flag any remaining self-identifying text for masking in exemplars.")

open(f"{BASE}/00-data-audit.md", "w", encoding="utf-8").write("\n".join(aud) + "\n")
open(f"{BASE}/01-quant-summary.md", "w", encoding="utf-8").write("\n".join(q) + "\n")
print("wrote 00-data-audit.md and 01-quant-summary.md")
print("\n".join(q[:6]))
