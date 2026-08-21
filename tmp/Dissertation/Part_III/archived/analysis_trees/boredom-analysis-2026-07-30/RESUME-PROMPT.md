# Paste this into a clean session

The analysis is **complete** (Phases 0–7). This prompt orients a new session so it does not try to
rebuild finished work. Add your actual task where marked.

Copy everything inside the fenced block below.

---

```
I'm continuing the empirical-chapter work for my VR attention study — 12 participants, sensor
recordings across three video conditions, plus a short questionnaire after each.

The analysis, statistics, figures and reproducibility artefacts are ALREADY COMPLETE and verified.
Do not rebuild them. Read these first, in full, before doing anything else:

1. The handoff, which is authoritative on current state:
   tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/HANDOFF-ANALYSIS-2026-07-30.md

2. The execution specification, which is authoritative on requirements — where it and the handoff
   disagree, the specification wins:
   plans/boredom-eyetracking-full-analysis-execution-2026-07-30.md

3. The results themselves:
   tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/FINDINGS.md
   tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/METHODS.md
   tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/figures/INDEX.md

Where things are: 23 tables in out/, 65 figures in figures/ (each PDF + PNG + sibling data CSV +
caption stub), and 7 artefacts at the tree root — RUN-MANIFEST.json, METHODS.md, EXCLUSIONS.log,
QC-REPORT.md, FINDINGS.md, SOURCES.md, RECONCILIATION.md. The code is in analysis/ (15 modules, no
stubs). scripts/boredom-o9/ is the methodology of record and is untouched — confirm with
`git status --porcelain scripts/boredom-o9/` (must be empty).

State of verification, all re-confirmed at the end of the last session:
- The four locked checks PASS at two independent gates on every run.
- All five secondary values in spec section 4 reproduce.
- Two consecutive full runs produce 300 of 301 artefacts byte-identical; the only difference is the
  run_utc line in RUN-MANIFEST.json.

If you need to re-run to confirm the environment (about 80 seconds):

    cd tmp/Dissertation/Part_III/boredom-analysis-2026-07-30/analysis
    /home/dalton/.venv/bin/python run.py

>>> YOUR TASK THIS SESSION: ____________________________________________
>>> (e.g. "draft the lab-boredom section from these results" — note that would be PROSE, so the
>>>  no-prose constraint below does not apply and should be struck; or "add analysis X"; or
>>>  "review the figures with me")

Standing constraints, non-negotiable:
- Interpreter is /home/dalton/.venv/bin/python for everything. It is the only one with matplotlib.
- PII: S01–S08 / R2-01–R2-04 only. No participant name in any output, log, figure, caption or
  filename. Redact BY CONSTRUCTION — never emit a subject folder name or subject-resident filename
  and then try to scrub it. journal.emit_guard() is a backstop, not the mechanism.
- Never edit scripts/boredom-o9/. Wrap, don't edit, and record every wrapper in METHODS.md.
- Never pool a rate-dependent feature across rounds; every pooled statistic carries a poolable flag
  and a one-line reason.
- Nothing is omitted for being non-significant. Label every n<6 result descriptive.
- No commits, no video processing. Back up before touching any existing file and tell me first.
- No chapter prose UNLESS this session's task is explicitly to write it.

Two things I want you to carry forward rather than rediscover:
- The reverse case (R2-03) breaks the zero-reverse asymmetry at N=12. It is sensitive to how the
  engaged composite is built — reverse cases number 0 / 1 / 2 / 3 depending on the definition, and
  R2-03 is reverse under 6 of 7 — and it is a within-subject relative statement, not an absolute one:
  they reported boredom 3/1/2 and never became bored on any stimulus. See handoff section 8. Report it
  honestly, don't let it quietly disappear, and don't overstate it either.
- HRV is settled: EXCLUDED in both rounds, heart rate RETAINED. Round 1 HRV sat at Friedman p=0.6065
  before exclusion and is recoverable by flipping config.EXCLUDE_HRV. No need to raise it again.

One thing still waiting on me, which you should raise but not decide: the two ASEE works-cited entries
in SOURCES.md are lead-author-only, because several co-author surnames are also participant surnames.
The recommendation there is to cite both in full and change nothing else — but I have not confirmed it.

Keep me updated as you go.
```
