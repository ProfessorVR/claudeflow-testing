# Plan — Integrate Spring 2026 (4th quarter) VLE Survey Data + Fable Coding

**Status:** DRAFT — awaiting review. **Do not execute** until signed off (multi-round review per standing process).
**Date:** 2026-07-24 · **Author context:** Part III desktop section, Stage 3.
**Governing standard:** the revised coding protocol verified in the 12-station coding review (2026-07-23) — all-Fable canonical passes, double-blind reliability, emergent-code sweep discipline, merge-script safety warning, MASK policy.

---

## 0. What changed and what this plan covers

The professor-of-record supplied a 4th quarter. **Spring 2026 Week 10** (same "Global Healthcare Needs / Final Assessment" instrument, 39 columns, 14 items) has been **added to the survey folder** as of 2026-07-24:

```
corpus/Virtual Learning Environments/VLE_Survey_Data/
  Spring 2026 Week 10 …Student Analysis Report.csv   (byte-identical copy, N=80)
  Spring 2026 Week 10 …Item Analysis Report.csv
```

Verified facts about the new file (parsed, not filename-trusted):

| Metric | Existing corpus (3 terms) | Spring 2026 (new) | New 4-term total |
|---|---|---|---|
| Respondents | W25 102 · S25 79 · W26 60 = **241** | **80** | **321** |
| Open responses (Q5/Q6/Q9/Q10) | **873** | **312** (79/79/77/77) | **1185** |
| Instrument | 14-item, 39 cols | 14-item, 39 cols (identical) | — |
| Q7/Q8 columns located | all 14 | all 14 (0 missing) | — |
| Strata preview (Q8) | VID 43–46% every term | APP 39 · VID 41 (≈51% VID) | — |

This resolves **Decision O-1** in `plans/part-iii-reanalysis-and-draft-plan-2026-07-06.md` ("the expected 4th quarter is absent… gap candidates Fall 2025 or Spring 2026 … obtain if it exists — instrument-stable, slots in directly"). It exists; it is Spring 2026; it slots in.

**In scope:** ingest → anonymize → quant → **Fable coding of the 312 new responses** → merge/reliability/adjudication → diagnostics → findings integration → index-entry update. This is the same T0–T4 + index-registration treatment the other three quarters received.

**Out of scope (explicitly):** the Week 2 "BioDesign" early check-in instrument (per user, ignored for now — see §Appendix A for where it sits). No re-coding of the frozen 873-response canonical corpus.

---

## 1. Guiding principles (read before touching anything)

1. **The existing 873-response coded corpus is FROZEN.** It was rebuilt all-Fable and verified 2026-07-23 (`03-coded-corpus.csv`, backups `.backups/20260723T1732/180045/185233`). Spring 2026 is **appended**, never merged-over. Existing rcodes W25/S25/W26-Rnnn keep their identities and codes unchanged.
2. **New coding = Fable 5 only**, blind passes (Station 7 ruling: every canonical pass is Fable 5).
3. **The codebook is frozen v1** (`methodology-application/codebook-v1.md` / `coding/CODER-INSTRUCTIONS.md`). No structural revision unless a documented revision point is opened (Station 4/9).
4. **Backups before every mutating step** — timestamped `.backups/YYYYMMDDThhmmss/` (standing rule).
5. **Verification-gated**: each phase ends with an evidence check; **no git commit until you sign off** (standing rule). Nothing here is pushed automatically.
6. **Three analysis scripts are hardcoded to 3 terms** (`W25/S25/W26`). Extending to 4 terms is a required, mechanical code edit in each — see gotchas per phase.
7. **`scripts/merge-adjudicate.py` must NOT be run as-is** — its loader globs `pass1/pass2-*.txt` for all batches and would re-merge the superseded Haiku passes over the canonical corpus (Station 9 warning, annotated in `coding/agreement-stats.txt`). Spring 2026 gets a **separate, namespaced** merge path.

---

## 2. Phase A — Ingest, anonymize, quantitative summary (T0/T1)
*This is the "earlier detailed-analysis step" that mirrors the prior processing; coding (Phase B) consumes its output.*

### A0. Backup
- `cp -r tmp/Dissertation/Part_III/survey-analysis .backups/survey-analysis-pre-s26-<ts>/`
- Snapshot `corpus/index/Virtual Learning Environments (King–Salvo)/` likewise.

### A1. Extend + re-run extraction/anonymization — `scripts/extract-anonymize.py`
- **Edit:** add the 4th term to the `TERMS` dict:
  `"S26": "Spring 2026 Week 10 Check In Quiz_ Global Healthcare Needs and Final Assessment Survey Quiz Student Analysis Report.csv"`.
- Re-run. It regenerates `data/respondents.csv` and `data/open_text.csv` deterministically (rcodes assigned in raw row order → **W25/S25/W26 rows are bit-identical to before; S26-Rnnn appended**).
- **GOTCHA — re-apply the one manual mask.** The 7th mask (W26-R007/Q5, self-identifying translator sentence) was applied *post-extraction directly to `open_text.csv`/`batch-5.txt`* and is **not** in the SCRUB regexes (it has no name). Re-running extraction reverts it. Fix: after re-extraction, re-apply the W26-R007/Q5 sentence mask (or add a targeted post-scrub for that key). The other 6 masks (instructor/author/email) ARE regex-covered and survive automatically. **Verify all 7 masks present** before proceeding.
- **Verify frozen counts unchanged:** script audit line must still read `W25: 102 … S25: 79 … W26: 60`, now plus `S26: 80; missing qcols: none`. Respondents total **321**, open responses **1185**.
- **Scrub check on S26 free text:** confirm no residual instructor/author names/emails (heuristic scrub is best-effort; coders will MASK-flag the rest in Phase B).

### A2. Cross-term duplicate scan (limitation 4 maintenance)
- The corpus already carries one flagged verbatim duplicate pair (S25-R021 ≡ W26-R011 at Q5 and Q10). Run a verbatim-match scan of S26 open text against all prior terms; log any new duplicate/retake artifacts to `02-codebook-final.md` limitation 4. Treat matches as possible retake/copy artifacts in any per-respondent claim.

### A3. Extend + re-run quant — `scripts/quant-summary.py`
- **Edits:** `TERMS = ["W25","S25","W26","S26"]`; update the two hardcoded audit strings ("3 Canvas CSVs (W25/S25/W26)" → 4; "row counts (102/79/60)" → "(102/79/60/80)").
- Re-run → regenerates `00-data-audit.md` + `01-quant-summary.md` over 4 terms.
- **Numbers that WILL move / appear (flag for downstream):**
  - Ns/open-response table gains an S26 column.
  - **Strata χ² term-stability**: dof goes **2 → 3** (crit@.05 5.991 → 7.815); re-report the verdict. S26's ≈51% VID may shift the "term-stable, V=.009" line — recompute and re-state honestly.
  - Q7/Q8 distributions, Q7×Q8 cross-tab, "could-use-but-video-only" count (was 47).
  - **Immersion-Yes among APP users** pooled figure (currently **70.7%, 87/123**) recomputes with S26 — this is the number cited in F7 and vle-01 ("echoes P3's 70%"). Expect a new pooled value; propagate everywhere it appears.
  - Demographics gain an S26 composition row (composition caveat for term comparisons).
  - Content items (Q1/Q2): confirm S26 also at ceiling → keep excluded; note S26 Item-Analysis α if computed is another force-keyed artifact.

**Phase-A verification gate →** show: audit line (321 / 1185, missing=none), 7 masks intact, frozen W25/S25/W26 rows byte-unchanged (`diff` against backup on those rows), duplicate-scan result, refreshed 00/01. **Wait for sign-off** before coding.

---

## 3. Phase B — Fable codes the new data (the headline)

### B1. Batch the S26 responses — **namespaced to avoid the merge glob**
- Do **not** re-run `make-batches.py` as-is (it re-splits the whole corpus into `coding/batch-1..6.txt` and would collide with the frozen batches/globs).
- Create an S26-only batch set under a **new subdir**: `coding/s26/` with files `s26-batch-1.txt`, `s26-batch-2.txt` (~156 lines each; 312 total, matching the ~146/batch size). Line format identical: `rcode|item|text`, drawn from the S26 rows of `open_text.csv`, in order.

### B2. Coding passes — protocol (per CODER-INSTRUCTIONS.md, frozen codebook v1)
- **Coder:** Fable 5. **Blind:** each pass sees only `rcode|item|text` — never another pass's output, never the quant strata.
- **Output format (STRICT):** one line per input, same order, `rcode|item|CODE1;CODE2;CODE3|evidence`. Evidence = ≤12-word verbatim span, present **only** when any Family-A code, `F1-PRESENCE`, or `C1-DRAG` is assigned; else empty (line ends `|`).
- **Families:** A (boredom-form: A1.* sub-tags, A2-DIFFUSE, A3-MONOTONY, A4-DIV, A5-WITHDRAWN) · B (flight) · C (temporal) · D (Wendt chain-node D0–D4) · E (involvement channels) · F (incorporation-positive) · G (suggestions) · H (emergent) · housekeeping (X-*, MASK, TRANSLATED).
- **Coverage design (mirror the original, all-Fable):**
  - **Primary (matches prior processing):** single-pass all of S26 with Fable 5, **plus** a **double-blind reliability subsample** — a second independent blind Fable pass over ~140 S26 responses (≈ the batch-6 subsample size), to confirm reliability holds on the new term.
  - **Optional strengthening (low cost, recommended given only 312 responses):** double-code **all** of S26 with two blind Fable passes. Cleaner per-term reliability + lets the documented merge rules run over the whole term instead of the lean single-pass shortcut. → decision point for the user.
- **Emergent codes (H-NEW-*):** admissible in any pass. **No distribution/trend claim** for any mid-run-invented code until a **batch/term-neutral keyword sweep** across all 4 terms is run — report sweep numbers, not raw code counts (Station 4/9). Watch specifically whether S26 independently re-invents the **value-skepticism** theme (H-NEW-skeptic / -vr-redundant / -videos-suffice) — if so, fold into the existing sweep and refresh F6's per-term rates (adds a 4th term to `1.3 / 0.7 / 4.2 per-100`).
- **MASK discipline:** any self-identifying S26 text → MASK flag; mask in derived files only (`open_text.csv` + the S26 batch file), raw export untouched (Station 1). Log as the corpus's Nth masked response.
- **TRANSLATED:** any non-English response → translate, code the translation, flag `TRANSLATED`.

**Phase-B deliverables:** `coding/s26/pass1-*.txt` (+ `pass2-*.txt` for the double-coded subsample or full set); a short coding log noting any emergent slugs, MASK flags, translations, uncodable count.

---

## 4. Phase C — Merge, reliability, adjudication (S26-scoped)

### C1. S26-scoped merge — **new script, do not reuse the globbing loader**
- Author `scripts/merge-s26.py` (a copy of `merge-adjudicate.py`'s logic restricted to S26 keys) that:
  - Reads only `coding/s26/pass*` files (never the frozen `coding/pass1/2-*.txt`).
  - Applies the **documented merge rules**: UNION for D/E/G/F/X/H + flags; intersection + keyword-warrant auto-accept for A/B/C; A4-DIV kept at either-pass sensitivity; drop A1.other when a specific A1.* is present.
  - **GOTCHA (Station 9):** before any keyword-warrant auto-accept may fire on new data, **tighten the loose warrants**: drop/anchor `load` (A1.lag), `find` (A1.nav — collides with the course's "needs-finding" vocabulary), `see` (A1.dark). Do this in `merge-s26.py`, not the historical script.
  - **Appends** merged S26 rows to `03-coded-corpus.csv` (never rewrites existing rows).
- Outputs: appended `03-coded-corpus.csv`, `coding/s26/adjudication-queue.txt`, `coding/s26/agreement-stats.txt`.

### C2. Reliability
- Compute **mean Jaccard** over the S26 double-coded pairs (target: comparable to the 0.878 Fable–Fable benchmark; ≥0.80 convention) and the **Krippendorff α-MASI** companion (set-distance; ≥0.800 convention, matching the 0.820 corpus figure) — script pattern per the Station 8 `alpha_masi.py`. If reliability lands materially below benchmark, flag before proceeding (may indicate an instrument/phrasing shift in S26).

### C3. Manual adjudication
- Resolve the S26 adjudication queue by hand; **append** decisions to the log (currently 7 decisions in `02-codebook-final.md` §Manual adjudication + `apply-and-analyze.py` DECISIONS). Add any S26 decisions as items 8+.

**Phase-C verification gate →** show agreement stats (Jaccard + α-MASI), queue size, adjudication decisions, emergent-slug dispositions. **Wait for sign-off.**

---

## 5. Phase D — Diagnostics + findings integration (T3/T4)

### D1. Extend + re-run diagnostics — `scripts/apply-and-analyze.py`
- **Edits:** add S26 adjudication decisions to `DECISIONS`; `TERMS = ["W25","S25","W26","S26"]`; the t3 per-term format strings (`ct['W25']/ct['S25']/ct['W26']`) gain a 4th column `ct['S26']`.
- Re-run → refreshes `t3-stats.md` (code counts by term/stratum, friction scorecard, DIV register, Wendt node scorecard, co-occurrences, E-family by term, emergent inventory) + `exemplar-candidates.md` over the full 4-term corpus.

### D2. Findings impact memo (the "07-analogue")
- Produce `08-s26-integration-impact-memo.md` (mirroring `07-repass-impact-memo.md`): headline code-count deltas (3-term → 4-term), and a **per-finding F1–F8 verdict** — does each finding STAND / SHIFT / need a number swap with S26 added? Nothing edited in `05-findings.md` until the memo is reviewed.

### D3. Apply approved updates
- `05-findings.md`: refresh every rate/count that moved (F1 threshold per-100s; F2 scorecard counts + verdicts; F3 D2/D3/G4 counts; F4 B1 + co-occurrences; F5 A4-DIV register + §D re-sort; **F6** 4th-term skepticism sweep rate; **F7** F1-PRESENCE per-100, E-SHA count, and the pooled immersion-Yes % / "70.7%" echo; F8 limits incl. any new duplicate). Update the data header to `321 respondents / 1185 open responses, four terms`.
- `06-we-activation-recount.md`: the WE-activation floors (ACT 1 / NON-ACT 11 / OPT-MAND 4 / OPT-CAP 13, awareness-gap 12) are **mention-level floors, not rates**. S26 may add to them — extend the candidate set (all E-SHA rows ∪ keyword sweep) over S26 with the same two-blind-pass + adjudication procedure, and update floors. Keep the "no activation denominator exists" caveat.
- `04-exemplar-bank.md`: add any stronger S26 verbatim exemplars; **verbatim-verify** every new quote against `open_text.csv` (Gross-rigor); keep anonymized.
- `02-codebook-final.md`: update executed-design counts, reliability line (add S26 Jaccard/α-MASI), adjudication items, emergent dispositions, negative-case/saturation statement (does S26 surface any phenomenon the scheme lacks a home for? expect no), limitations (duplicates, any new MASK).

**Phase-D verification gate →** show impact memo + diffs of 05/02/04/06 for approval. **Wait for sign-off.**

---

## 6. Phase E — Index-entry extension + registration
*The index entry already exists (`vle-01` etc.) — this is a 4-term extension, not a from-scratch build.*

- `units/vle-01-deployment-survey.md`: header `three terms, N=241` → `four terms, N=321`; refresh instrument/strata line (new VID%, immersion-Yes pooled %), coding record (add S26 to "873/873 coded" → "1185/1185"; add S26 reliability), and the condensed F1–F8 numbers.
- `units/vle-00-corpus-overview.md`: any N/term references.
- `_synthesis/manifest.json`: `survey_corpus` → `W25 102 / S25 79 / W26 60 / S26 80; 1185 open responses`; add the Spring 2026 deployment to `sources.publications` context if applicable; bump `coding_reliability` note; update `built`/status.
- `_synthesis/book-level-ontology.md`: reconcile any term-count or ontology-node references.
- **Re-register:** `python3 scripts/compile-corpus-index.py` to refresh `corpus/index/compiled-index.json` (per the manifest's registration note).

**Phase-E verification gate →** show index diffs + compiled-index rebuild result. **Wait for sign-off.**

---

## 7. Downstream-numbers-impact checklist (everything that moves 3-term → 4-term)

- [ ] Respondents 241 → **321**; open responses 873 → **1185**
- [ ] Strata χ² dof 2 → 3 (crit 5.991 → 7.815); term-stability verdict + Cramér's V re-stated
- [ ] Immersion-Yes-among-APP **pooled 70.7% (87/123)** → new value (F7 + vle-01 "echoes P3's 70%")
- [ ] F1-PRESENCE per-100 (APP vs VID) — currently 2.8 vs 1.5
- [ ] E-SHA mention count — currently 91 (+ per-100 term-stability line)
- [ ] Friction scorecard counts/verdicts (lag 25, nav 21, dark 10, crash 29, install 26, hw 13)
- [ ] A4-DIV divergence register — currently 13 (12 unique); §D re-sort
- [ ] F6 value-skepticism sweep — 4th-term rate appended to 1.3 / 0.7 / 4.2
- [ ] WE-activation floors (ACT 1 / NON-ACT 11 / OPT-MAND 4 / OPT-CAP 13 / awareness-gap 12)
- [ ] Demographic composition table (+ S26 row)
- [ ] Duplicate-response ledger (limitation 4)
- [ ] The outline's M3.4 "70.7%" and any drafted §III.3–§III.5 prose citing 3-term figures (flagged at-drafting fixes)

---

## 8. Deliverables

New/modified files (all under `tmp/Dissertation/Part_III/` unless noted):
`survey-analysis/data/{respondents,open_text}.csv` (extended) · `survey-analysis/coding/s26/{s26-batch-*,pass1-*,pass2-*}.txt` · `scripts/merge-s26.py` · `survey-analysis/coding/s26/{agreement-stats,adjudication-queue}.txt` · `survey-analysis/03-coded-corpus.csv` (appended) · `survey-analysis/{00,01,02,04,05,06}` (refreshed) · `survey-analysis/t3-stats.md` + `exemplar-candidates.md` (refreshed) · `survey-analysis/08-s26-integration-impact-memo.md` (new) · `corpus/index/Virtual Learning Environments (King–Salvo)/**` (extended) · `corpus/index/compiled-index.json` (re-registered) · edits to `scripts/{extract-anonymize,quant-summary,apply-and-analyze}.py`.

---

## 9. Risk / gotcha register (consolidated)

| # | Risk | Guard |
|---|---|---|
| 1 | Re-running `merge-adjudicate.py` clobbers canonical corpus (globs all batches) | Use namespaced `coding/s26/` + new `merge-s26.py`; never re-run the original |
| 2 | Re-extraction reverts the W26-R007/Q5 manual mask | Re-apply after extraction; verify all 7 masks present |
| 3 | Hardcoded `TERMS` in 3 scripts | Edit all three (extract, quant, apply-and-analyze) + the audit strings |
| 4 | Loose keyword warrants (`load`/`find`/`see`) mis-fire on S26 | Tighten in `merge-s26.py` before any auto-accept (Station 9) |
| 5 | Emergent-code trend from a mid-run slug | Term-neutral keyword sweep before any distribution claim (Station 4/9) |
| 6 | S26 reliability may differ from 0.878 benchmark | Compute Jaccard + α-MASI on S26; flag if materially lower |
| 7 | Frozen 873 rows accidentally altered | `diff` W25/S25/W26 rows vs backup after every step; append-only |
| 8 | New self-identifying / non-English S26 text | MASK / TRANSLATED discipline in Phase B |
| 9 | Committing before verification | Verification gates each phase; no commit/push until user sign-off |

---

## Appendix A — The Week 2 "BioDesign" instrument (parked)
The download also contains a **second, different instrument** (Week 2 BioDesign early check-in: N = 111/84/64/80 across the four terms) that the corpus has never held. Ignored per this task. If later wanted, it is a *new instrument entry*, not an extension of vle-01 — it would need its own codebook mapping (content-knowledge quiz, not the immersion self-report) and the prior audit's caution that content items sit at ceiling. Files remain in `C:\Users\Dalton\Downloads\quizreports`.

## Appendix B — Coder decision points for the user (before Phase B)
1. **Reliability design:** mirror-original (single-pass + ~140 double-coded subsample) **or** full double-code of all 312 S26 responses (recommended; low marginal cost). 
2. Whether to open a documented codebook-revision point if S26 surfaces a genuinely new, non-redundant phenomenon (default: no — keep v1 frozen, treat as emergent + sweep).
