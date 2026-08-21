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
- **WE recount (NEW 2026-07-23, pending sign-off):** report `survey-analysis/06-we-activation-recount.md`;
  candidate set + blind passes + agreed/disagreement TSVs in `survey-analysis/coding/we-recount-*`
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

## 5-REV. Coding-review state (UPDATED end-of-day 2026-07-23 — supersedes §5 for review resumption)

**Stations ruled.** Station 1 KEEP (masking, code scheme, no mapping file). Station 2 KEEP
(families A–C definitions/boundaries/sub-tag roster; zero-yield A1.occl + B3 kept as
UNATTESTED cells). **OPEN RESIDUE = FIRST ITEM NEXT SESSION: the C2-FLOW ruling** — both C2
applications (W25-R049/Q5, W25-R076/Q5) are definition misfits (brevity/self-pacing praise,
no time-vanishing talk); recommended ALTER cost 1 (strike both → C2=0, strengthens the
temporal-phenomenology limitation; re-check findings citing temporal counts). AWAITING RULING.

**Alignment audit (2026-07-23, adversarially verified) — executed under user rulings 1–5.**
The user's concern (WE under-foregrounded) confirmed as a grain asymmetry, not misdesign:
codebook (07-06) predates the F7 correction (07-13) and elevated-focus directive (07-15).
Approved repairs DONE (backups in `Part_III/.backups/20260723T112309/`): F7 non-verbatim
quote fixed in 05-findings + deployment-brief (real verbatim = W26-R052/Q9); exemplar bank
co-disclosedness section resorted to activation taxonomy; immersion figure corrected to
70.7% (87/123) in cross-case-synthesis + deployment-brief (outline M3.4's ≈69% → 70.7% when
drafted); Q10 duplicate flagged in 02; outline M5.2 gained rung 0 (awareness/onboarding) +
student-proposed mechanisms (W25-R060, S25-R079). Full rulings log + standing drafting
cautions: END of `plans/coding-review-interactive-plan-2026-07-20.md`.

**WE activation-status recount COMPLETE, INTEGRATION GATED on user sign-off.** Two blind
passes (both Fable 5) over 115 rows (E-SHA ∪ keyword sweep), 93.0% exact agreement, zero
disagreement on experience bins. Floors: ACTIVATOR 1 (W26-R037 only) · NON-ACTIVATOR 11 ·
OPTATIVE-MANDATE 3 · OPTATIVE-CAPABILITY (awareness-gap) 10, +8 disputed rows in an
adjudication queue with recommendations. Report: `survey-analysis/06-we-activation-recount.md`.
Consequences pending sign-off: M3.5 activator claim goes SINGULAR; non-activation is the
evidenced pole; gap = activation ∧ awareness; no denominator exists (mention-floors only);
M0.3's "as the data demonstrates" clause re-verify queued at full-draft stage.

**Standing directives.** Ultracode OFF (user 2026-07-23; re-enabled only explicitly —
memory `feedback-ultracode-off-by-default`). Recount disclosure rides on the Station 6
AI-coder ruling (still undecided — it now covers the recount passes too).

## 5. Session state at handoff (2026-07-23, morning — DRAFTING context; still accurate for M0/M1/M2 state)
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

## 6. Boot instruction for the clean session (UPDATED 2026-07-23 end-of-day)
Read: this handoff (§5-REV first) → the plan incl. its Rulings log
(`plans/coding-review-interactive-plan-2026-07-20.md`) → `codebook-v1.md` +
`02-codebook-final.md` → `survey-analysis/06-we-activation-recount.md`. Then resume in this
order: (1) present the **C2-FLOW ruling** (Station 2 residue) with the two rows verbatim;
(2) **Station 3** — families D/E/F review PLUS the folded-in WE-instrumentation ruling:
recount sign-off, the 8-row adjudication queue (recommendations in 06), and how M3.5 states
its numbers (mention-floors, singular activator); (3) continue Stations 4–12 per plan.
One station per exchange unless the user compresses. Backups before any file edit
(`Part_III/.backups/`, timestamped). No edits to `05-findings.md` or the coded corpus
without an explicit ruling; recount integration executes only on the sign-off in 06 §Integration.
Ultracode stays OFF unless the user re-enables it.
