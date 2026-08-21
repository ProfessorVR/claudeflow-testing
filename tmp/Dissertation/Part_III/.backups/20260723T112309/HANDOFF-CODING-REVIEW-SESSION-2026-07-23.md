# HANDOFF — Interactive Coding Review (dedicated session, 2026-07-23)

**Purpose.** Boot document for a CLEAN session running the interactive review of the survey-coding
apparatus. Read this, then the plan, then open Station 1. Do not redo work recorded here.

## 1. The task
Run `plans/coding-review-interactive-plan-2026-07-20.md` — 12 stations, one per exchange, in the
propose→rule→apply loop (present artifact + reasoning + alternatives + alteration cost; user rules
KEEP/ALTER/DEFER). The user's goal: understand the reasoning at every step of the coding process
and alter what needs altering. End deliverables (Station 12): the M2.2 ¶2 rewrite and the
AI-coder disclosure ruling.

## 2. What the coding apparatus is (orientation)
Dissertation-original, unpublished methodology (built 2026-07-06) for the 873 open-text survey
responses (N=241; Winter 2025/Spring 2025/Winter 2026). Pipeline: anonymize → codebook v1
(8 families, ~40 codes, segment unit, multi-coding) → 6 batches, blind AI coding passes (both
Fable 5) → lean executed design (730 single-pass + batch 6 = 143 double-coded) → Jaccard
agreement .878 → deterministic merge (union for D/E/G/F/X; intersection + keyword-warrant for
A/B/C; A4-DIV either-pass) → 4 manual adjudications → coded corpus → counts/scorecards/exemplars
→ findings F1–F8. Everything is re-runnable; alteration costs are graded in the plan (wording /
recompute / recode).

## 3. Artifact map (read per station, not all up front)
- Plan (the roadmap): `plans/coding-review-interactive-plan-2026-07-20.md`
- Codebook: `tmp/Dissertation/Part_III/methodology-application/codebook-v1.md`
- Executed-design record: `tmp/Dissertation/Part_III/survey-analysis/02-codebook-final.md`
- Coder protocol: `survey-analysis/coding/CODER-INSTRUCTIONS.md`
- Pass files: `survey-analysis/coding/pass1-{1,2,3,5,6}.txt`, `pass2-{4,6}.txt`, `batch-*.txt`
  (batch 6 = the double-coded reliability subsample; "missing" pass files are the lean design,
  not data loss)
- Agreement: `survey-analysis/coding/agreement-stats.txt` (mean Jaccard .878 + per-code table)
- Adjudication: `survey-analysis/coding/adjudication-queue.txt` (4 items; decisions in 02)
- Merge logic: `survey-analysis/scripts/merge-adjudicate.py` (rules in docstring, mirrored in 02)
- Data: `survey-analysis/data/open_text.csv` (873 rows), `respondents.csv` (241 rows);
  raw Canvas exports (gitignored): `corpus/Virtual Learning Environments/VLE_Survey_Data/`
- Outputs downstream: `03-coded-corpus.csv`, `04-exemplar-bank.md`, `05-findings.md` (F1–F8)
- The prose under review: `tmp/Dissertation/Part_III/drafts/DESKTOP-M2-DRAFT-v1.tex`, M2.2 ¶2

## 4. Rules in force (memory carries these; do not relearn them the hard way)
MLA citations (abbreviated-title parentheticals; Works Cited holds full entries) · first person
for the user's own publications; "I" for dissertation-argument claims · Part III scientific-direct
register; plain paragraph openers/closers; no compressed synthesis sentences; no invented
shorthand · BANS: "record" for the evidence (say survey data/corpus), sentence-initial "And",
metatextual signposting, gambling vocabulary, self-referential gap-framing, bare "incorporation"
for our theory (always "rhetorical incorporation"; bare = Calleja only), no abstract quotations ·
FIRST analysis framing (never "reanalysis" for the three-quarter data) · prose decision points,
never polls · backups before substantive edits (`Part_III/.backups/`, timestamped) · tag
author-supplied facts AUTHOR-CONFIRMED <date> · verification-gated: no commits without sign-off ·
codes name signatures in talk, never certified attunements (category caution).

## 5. Session state at handoff (2026-07-23)
- **M0 v2 LOCKED** (`drafts/DESKTOP-M0-DRAFT-v2.tex`, six-move intro structure). Queued for it:
  post-indexing revision pass (fold svw/ptf/riv entries + vle-05 into the resolution's
  social-interior passage + institutional facts); class-name `(******)` + Berkeley/Merced
  enrollment follow-ups; roadmap count + thesis re-verify at first full section draft.
- **M2** (`drafts/DESKTOP-M2-DRAFT-v1.tex`): M2.1 revised per user (Kadin Diec CONFIRMED third
  author on the ASEE paper — footnote = King/Diec/Salvo); M2.2 ¶1 approved (incl.
  global-questions revision); **M2.2 ¶2 = what this review settles**; M2.3 blocked (arc
  decision). Open M2.1 flags: exact procedure list; hub-and-rooms structure; device animations.
- **M1** lit review = separate parallel session ("The Two Literatures", DESKTOP-M1-DRAFT-v1.tex).
- **Index work COMPLETE** (agent, 2026-07-20): entries "Social Presence in Virtual Worlds
  (Part III)" (svw-01..03), "Presence Theory (Foundations)" (ptf-01..04 + built Part II bridge),
  "Rhetoric of Interactivity and Virtual Reality (Part III)" (riv-01..02), vle-05 in the
  King–Salvo entry; compiled index 701 nodes; snapshot doc-text-20260720T153656Z (21,929 vec).
  Report: `plans/new-media-presence-ingestion-phase1-report-2026-07-20.md`.
  Open: Ulrich year confirmation (recommended: *Young Scholars in Writing*, vol. 9, 2012,
  pp. 5–18 — venue PDF-verified from running footers; riv-02 unit still carries the superseded
  *Intersect* inference pending user confirmation). Mantovani & Riva (ptf-01) = NO TEXT LAYER:
  paraphrase-only, ****** UNVERIFIED quotes.
- Memory is current (`project-dissertation-part-iii-structure`); MEMORY.md index points here.

## 6. Boot instruction for the clean session
Read: this handoff → the plan → `codebook-v1.md` + `02-codebook-final.md`. Then present
Station 1. One station per exchange unless the user compresses. Backups before any file edit.
No edits to `05-findings.md` or the coded corpus without an explicit cost-2/recompute ruling.
