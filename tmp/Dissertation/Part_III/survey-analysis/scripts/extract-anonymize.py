"""T0: parse the six Canvas CSVs, emit anonymized derivatives.
Outputs (PII-free):
  data/respondents.csv  one row per student: rcode,term,attempt,q1,q2,q3,q7,q8,q11,q12,q13,q14,n_correct,score
  data/open_text.csv    one row per non-empty open response: rcode,term,item,words,text
Respondent codes = <TERM>-Rnnn in raw row order (reproducible from raw files + this script; no mapping file written).
PII scrub: name/id/sis_id/section columns dropped; instructor/author names + emails masked in free text.
"""
import csv, re, sys, os

RAW = "corpus/Virtual Learning Environments/VLE_Survey_Data"
OUT = "tmp/Dissertation/Part_III/survey-analysis/data"
os.makedirs(OUT, exist_ok=True)

TERMS = {
    "W25": "Winter 2025 Week 10 Check In Quiz_ Global Healthcare Needs and Final Assessment Survey Quiz Student Analysis Report.csv",
    "S25": "Spring 2025 Week 10 Check In Quiz_ Global Healthcare Needs and Final Assessment Survey Quiz Student Analysis Report.csv",
    "W26": "Winter 2026 Week 10 Check In Quiz_ Global Healthcare Needs and Final Assessment Survey Quiz Student Analysis Report.csv",
}

QMAP = [  # (Q, header snippet)
    ("Q1", "research funding"), ("Q2", "Surgical suites"), ("Q3", "neglected diseases"),
    ("Q4", "Fill in the below survey"), ("Q5", "most useful"), ("Q6", "could be improved"),
    ("Q7", "able to use the VR platform"), ("Q8", "greater degree of immersion"),
    ("Q9", "added or improved"), ("Q10", "educational use cases"),
    ("Q11", "describe yourself"), ("Q12", "gender identity"),
    ("Q13", "first-generation"), ("Q14", "academic year"),
]
OPEN_ITEMS = ["Q5", "Q6", "Q9", "Q10"]
KEEP = ["Q1", "Q2", "Q3", "Q7", "Q8", "Q11", "Q12", "Q13", "Q14"]

SCRUB = [
    (re.compile(r"(dr\.?|professor|prof\.?)\s+king", re.I), "[instructor]"),
    (re.compile(r"\bchristine\s+king\b", re.I), "[instructor]"),
    (re.compile(r"\b(dalton\s+salvo|salvo|dalton)\b", re.I), "[instructor]"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "[email]"),
]

def scrub(t: str) -> str:
    for rx, rep in SCRUB:
        t = rx.sub(rep, t)
    return t

def clean(t: str) -> str:
    t = t.replace("\r", " ").replace("\n", " / ")
    return re.sub(r"\s+", " ", t).strip()

resp_rows, text_rows, audit = [], [], []
for term, fname in TERMS.items():
    path = os.path.join(RAW, fname)
    with open(path, encoding="utf-8-sig", newline="") as fh:
        rdr = csv.reader(fh)
        hdr = next(rdr)
        qcol = {}
        for i, h in enumerate(hdr):
            for q, snip in QMAP:
                if snip.lower() in h.lower() and re.match(r"^\d+:", h):
                    qcol[q] = i
        missing = [q for q, _ in QMAP if q not in qcol]
        ncorr = hdr.index("n correct") if "n correct" in hdr else None
        score = len(hdr) - 1 if hdr[-1].strip() == "score" else (hdr.index("score") if "score" in hdr else None)
        att = hdr.index("attempt") if "attempt" in hdr else None
        n = 0
        for row in rdr:
            if not any(c.strip() for c in row):
                continue
            n += 1
            rcode = f"{term}-R{n:03d}"
            rec = {"rcode": rcode, "term": term,
                   "attempt": row[att].strip() if att is not None else ""}
            for q in KEEP:
                rec[q.lower()] = clean(scrub(row[qcol[q]])) if q in qcol and qcol[q] < len(row) else ""
            rec["n_correct"] = row[ncorr].strip() if ncorr is not None and ncorr < len(row) else ""
            rec["score"] = row[score].strip() if score is not None and score < len(row) else ""
            resp_rows.append(rec)
            for q in OPEN_ITEMS:
                if q in qcol and qcol[q] < len(row):
                    t = clean(scrub(row[qcol[q]]))
                    if t:
                        text_rows.append({"rcode": rcode, "term": term, "item": q,
                                          "words": len(t.split()), "text": t})
        audit.append(f"{term}: {n} students; missing qcols: {missing or 'none'}")

with open(os.path.join(OUT, "respondents.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(resp_rows[0].keys()))
    w.writeheader(); w.writerows(resp_rows)
with open(os.path.join(OUT, "open_text.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=["rcode", "term", "item", "words", "text"])
    w.writeheader(); w.writerows(text_rows)

print("\n".join(audit))
print(f"respondents: {len(resp_rows)}  open responses: {len(text_rows)}")
masked = sum(1 for r in text_rows if "[instructor]" in r["text"] or "[email]" in r["text"])
print(f"responses with masked PII tokens: {masked}")
