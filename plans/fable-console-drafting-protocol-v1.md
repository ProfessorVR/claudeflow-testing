# Fable Console Drafting Protocol (FCDP) — v1

**Date:** 2026-07-02 · **Status:** PRELIMINARY DRAFT, awaiting user review
**Purpose:** A reusable, gate-enforced protocol for drafting dissertation prose in the Claude Code console with Fable 5 at every prose stage — replacing god-write's multi-step pipeline with a console process that keeps its two proven assets (the embedded pack; style-profile targeting) and adds the gates the pipeline never actually enforced (its QualityGauntlet stages return 0.5 defaults).
**Provenance of design decisions:** god-write winning run = no-corpus / no-multistep / embedded-pack (voice 0.96 vs Part I) → the pack is the load-bearing element, not stage count; corpus retrieval overrides the pack with junk → retrieval is BANNED from drafting context; Lanham fingerprint matching validated in-console 2026-07-01 (Ontological Violence analysis + conclusion drafts converged on the MA fingerprint in one revision cycle).

---

## 0. Roles and invariants

1. **Model.** Every prose-generating and prose-judging step runs on Fable 5 in the main console session (not subagents, not god-write API calls). Mechanical stages (frame reads, OCR, transcript extraction) may be delegated to cheaper models; their outputs enter the pack as *evidence*, never as prose.
2. **The pack is authoritative.** No corpus retrieval, no ChromaDB, no god-learn context during drafting. If a fact, quote, or definition is not in the pack, it does not enter the draft — it enters a `******` placeholder instead.
3. **Never modify the user's source documents.** New sections go to standalone `*-DRAFT-vN.md` files (or `*-iterations/` copies for revisions of existing prose); timestamped backups before any change to shared artifacts; commits only after user sign-off (verification-gated).
4. **Consult before drafting:** `tmp/Dissertation/REVISION-PROTOCOL.md` (rule tiers, turn-weight gate) and the session-degradation 7-step pre-output protocol + forbidden-phrase blacklist (`tmp/Dissertation/TODO_NOTES.md` §H). These are standing constraints on all output, not a gauntlet stage.

**Pipeline shape:**

```
P (pack) ──> D1 (movement plan, no prose) ──> [user approval, optional]
          ──> D2 (quotation-laden drafting) ──> G (quality gauntlet, 6 gates)
          ──> R (targeted revision, loop to G, max 3 cycles) ──> user review
```

---

## 1. Stage P — Pack assembly (the embedded pack)

One contiguous block assembled *before any prose exists*. It is the drafting context in its entirety. Template fields:

| Field | Content | Notes |
|---|---|---|
| **P1 Task spec** | Section identity, insertion point in the parent document, target length (words), register (Part-I voice / MA-applications voice / other), audience, LaTeX conventions (`` `` '' `` quotes, biblatex vs parenthetical) | Length stated as a range, not a point |
| **P2 Voice target** | The full Lanham fingerprint table for the chosen register (§6) + tolerance bands + the exact runner invocation | The fingerprint is a spec, not a vibe |
| **P3 Terminology & style locks** | The enumerated lock list (§5) — copied in, not referenced, so the drafting context physically contains them | Locks change; copy the current set each time |
| **P4 Verbatim quotation bank** | Every direct quotation the draft may use, **character-exact, PDF-verified, with full citation and locus**, each tagged `VERIFIED <source> <page/Bekker>`. Quotes are *pre-selected here*, during pack assembly, not recalled during drafting | The single highest-leverage anti-hallucination device: quoting becomes copying |
| **P5 Evidence bank** | Frame timestamps, measurements, findings — each with a confidence grade (`CONFIRMED` / `AUTHOR-CONFIRMED` / `[UNCERTAIN]`) | Only graded evidence may be asserted; `[UNCERTAIN]` items must be hedged or omitted |
| **P6 Conceptual semantics** | The operative theory apparatus (e.g., RODA: A₀–A₄ definitions, bia, the two paschein modes, the union's two poles) stated in the project's own locked formulations | Prevents drift toward generic paraphrase of Aristotle/Heidegger |
| **P7 Foundation text** | The user's draft being built upon, verbatim and complete | The protocol threshes foundations; it does not replace them |
| **P8 Negative constraints** | Forbidden-phrase blacklist; patterns to avoid (no bold run-in heads, no explicit back-references, no "supplies the canonical anchor," coined-compound restraint, ungendered "player") | Stated as greppable patterns where possible |

**Gate G-P (pack completeness, before D1):** every P-field present or explicitly marked N/A; every quote in P4 verified against a PDF *in this session or a prior verified pass* (no "remembered" verifications); every P5 item graded; the correct fingerprint chosen in P2. Fail → assemble, don't draft.

---

## 2. Stage D1 — Phase-one prompt: the movement plan (no prose)

A structured plan, not draft prose. The phase-one prompt takes the pack and produces:

- **Movements:** the section's argument arc as an ordered list, each movement with (a) its claim in one sentence, (b) its assigned evidence items from P5, (c) its assigned quotations from P4, (d) its foundation anchors — which passages of P7 it retains, expands, or corrects, (e) its target word share.
- **Foundation disposition table:** every beat of P7 mapped to exactly one of RETAIN / EXPAND / CORRECT (with the correction stated) / OMIT (with reason surfaced to the user — omissions are never silent).
- **Quote/evidence ledger:** every P4 and P5 item marked ASSIGNED (to a movement) or UNUSED (with reason).
- **Rhythm plan:** sentence-length strategy per movement (where the short punch sentences go; where the long periodic builds go) derived from P2.

**Gate G-1 (plan completeness):** no orphan claims (every claim has evidence or is marked as the dissertation's own construction); no unmapped foundation beats; corrections to the foundation explicitly listed; the ledger closed. The plan is small enough to read in two minutes — **offer it to the user for approval by default;** skip only on explicit "draft straight through" instruction.

---

## 3. Stage D2 — Phase-two prompt: quotation-laden drafting

Full prose, movement by movement, from the approved plan. The phase-two prompt differs from phase one in kind, not just detail:

1. **Direct quotations are embedded in the prompt itself.** Each movement's drafting instruction carries its assigned P4 quotes inline, character-exact, with citations pre-formatted to the document's convention. The drafting act *copies* them into position; it never reconstructs them. Anything quote-like that is not in P4 must be paraphrase-without-quotation-marks or `****** UNVERIFIED:` placeholder.
2. **Evidence is cited with its grade.** `AUTHOR-CONFIRMED` items may be asserted flatly; `CONFIRMED` (frame-read) items may be asserted with their timestamp; `[UNCERTAIN]` items appear only as hedged observations or not at all.
3. **Rhythm directives are explicit.** The movement's rhythm plan (from D1) is restated in the prompt: e.g., "open periodic, one short declarative after the colon-list, close on a two-clause antithesis" — because the Lanham gate will measure the result.
4. **Foundation passages marked RETAIN are carried verbatim or near-verbatim,** and marked as such in a trailing comment block for the user's diff.

Output: the complete draft as LaTeX body in a `*-DRAFT-vN.md` file, with a header comment recording pack version, plan version, and the correction list, and a footer comment recording retained/new/omitted material.

---

## 4. Stage G — The quality gauntlet (six gates, all must pass)

Run in order; report results as a table appended to the draft file as a comment. A gate failure produces a *named defect list*, which is Stage R's input.

**G-A · Lanham style gate.**
Strip LaTeX (`python3 scripts/strip-latex-for-lanham.py <draft> <plain.txt>`), run `npx tsx tmp/analyze-style-lanham.ts <plain.txt>`, compare against the P2 fingerprint:

| Metric | Pass band |
|---|---|
| avg sentence length | target ± 3.5 words |
| short(<15) share | target ± 0.06 |
| long(>30) share | target ± 0.08 |
| periodicRunningRatio | target ± 0.12 |
| preMainVerbClauseCount | target ± 0.10 |
| voiceScore | target ± 0.12 |
| dynamicRange | target ± 0.12 |
| beVerbRatio | target ± 0.05 |
| nominalizationDensity | target ± 1.5 per 100w |
| latinateGermanicRatio | ≤ target + 0.06 (more Germanic than target always passes) |
| opacityScore | target ± 0.10 |
| **All categorical labels** | must match target labels exactly |

Fail → revise sentence architecture only (merges, splits, subordinate-clause openings, diction swaps); do not alter claims, quotes, or evidence during a G-A fix.

**G-B · Quote-fidelity gate.**
Extract every quoted span from the draft; diff each against P4 character-exact (ellipses permitted only with bracketed marks; interpolations only in square brackets). Any span not matching a P4 entry → replace with the P4 text, demote to unquoted paraphrase, or `****** UNVERIFIED:`. Target: 100% of quotation marks covered by the bank. (This is the console replacement for god-write's QuotationFidelityValidator, with the threshold raised from 70% to exact.)

**G-C · Citation-rigor gate (the Gross standard).**
Every citation carries a locus (page or Bekker); every locus traces to a P4/P5 entry or the foundation text; **no locus is ever supplied from model memory.** Missing source → `******`. Uncertain page → `[****** page unverified]`, never a guessed number.

**G-D · Terminology-lock gate.**
Mechanical greps + one read-through against P3/P8. Greppable minimums: retired stem `phantasmat` (must be `phantasmic`); `\textbf{` at paragraph openings (run-in heads); gendered pronouns bound to "the player"; "supplies the … anchor"; back-reference phrases ("as discussed above", "as we saw in section"); straight/Unicode quotes outside LaTeX markup. Read-through checks: *hexis* never glossed as habit; "emotion" (not *pathē*) for Rhetorica emotions; Greek faculty-names italicized; no new coined compounds beyond the locked set.

**G-E · Foundation-fidelity gate.**
Re-read P7 against the draft with the D1 disposition table in hand: every RETAIN beat present; every CORRECT beat corrected as specified and *flagged for the user*; every OMIT surfaced in the footer comment; no foundation claim silently strengthened beyond its evidence grade (e.g., a foundation hypothesis may not become an assertion unless P5 upgraded it).

**G-F · Degradation gate.**
The 7-step pre-output protocol executed; forbidden-phrase blacklist consulted; turn-weight gate respected (one section per drafting cycle — no marathon multi-section output in a single turn).

---

## 5. The lock list (P3/P8 source of truth — copy into every pack)

- Quotes in LaTeX markup: `` `` … '' `` — zero Unicode quotes.
- No bold run-in heads (`\textbf{Topic.}` paragraph labels).
- *hexis* ≠ habit ≠ *doxa* — never conflate (habit = the repetition-tendency that cultivates the *hexis*).
- "emotion," not *pathē*, for Rhetorica emotions (except direct quotes).
- Ungendered prose; the in-game subject is "the player" (no she/he/they for the player; gendered pronouns only for named characters).
- Greek faculty-names in italics (*phantasia*, *doxa*, *orexis*…), not English "faculty of X."
- Retired stem: "phantasmatic" → "phantasmic" (except in verbatim quotes from MA-era text).
- The union's poles: **world-disclosedness / co-disclosedness** (never world-face/other-face).
- *Prohairesis* = the bouletic's deliberative completion, never a coordinate "Type 4."
- No explicit back-references to prior sections; no "supplies the canonical anchor" pattern; coined-compound restraint (use the locked coinages — *phantasia-load*, *rhetorical incorporation*, *veri(dis)similitude* — mint nothing new without user sign-off).
- Missing source → `******` (relaxed marathon form: `****** UNVERIFIED:`).
- Part II applications register = MA voice; Part I register = Part I voice (§6) — never mix within a section.

---

## 6. Stored voice fingerprints (P2 source of truth)

Measured with `tmp/analyze-style-lanham.ts`. Re-measure targets whenever the runner changes.

**MA-applications voice** (target for Part II §4+ / game analyses; measured 2026-07-01 from the MA thesis PDF text, 21,323 words — note: citation apparatus inflates prepPhrase and latinate slightly, treat those two as ceilings):

| metric | target |
|---|---|
| avg sentence length | 33.7 (working band 29–36) |
| short(<15) / long(>30) | 0.23 / 0.45 |
| nounVerbRatio | 0.65 (label: balanced) |
| nominalizationDensity | 5.0 |
| prepositionalPhraseDensity | ≤ 5.4 (ceiling) |
| beVerbRatio | 0.15 |
| parataxisHypotaxisRatio | 0.38 (label: mixed) |
| periodicRunningRatio | 0.44 (label: mixed) |
| preMainVerbClauseCount | 0.21 |
| voiceScore / dynamicRange | 0.41 / 0.74 (label: strongly voiced) |
| latinateGermanicRatio | ≤ 0.14 (≥ 86% Germanic) |
| opacityScore | 0.76 (label: opaque) |
| tacit figures | polyptoton ~0.10/sent; chiasmus, antithesis, isocolon, climax all present |

**Part-I voice** (target for Part-I-register prose; from the frozen Part I fingerprint): ~31w sentences; 85% Germanic; voiceScore 0.39 (modest); opacityScore 0.74; dynamicRange 0.90; heavy chiasmus / antithesis / polyptoton. (Re-run the runner on the current Part I `.tex` before any Part-I-register drafting to refresh the full table.)

---

## 7. Stage R — Revision and handoff

1. Fix only what a gate named; one revision cycle addresses all failed gates at once; re-run the full gauntlet after.
2. Maximum three G↔R cycles; if still failing, stop and surface the conflict to the user (usually a spec conflict: e.g., quote density vs sentence-length band).
3. Handoff: draft file + gauntlet report + the correction/omission list, explicitly awaiting review. For revisions of the user's existing prose, hand off per-paragraph (the user-first 10-step protocol); for new sections, whole-document with the footer diff-comment.
4. Nothing is committed, merged into the parent document, or propagated to the corpus until the user signs off.

---

## 8. Invocation checklist (the one-pager)

```
[ ] P: assemble pack (P1–P8) ....................... gate G-P
[ ] D1: movement plan (no prose) ................... gate G-1 → user approval
[ ] D2: draft with embedded quotations ............. output *-DRAFT-vN.md
[ ] G-A Lanham (strip → runner → bands + labels)
[ ] G-B quote fidelity (100% bank-covered)
[ ] G-C citation rigor (no memory-supplied loci)
[ ] G-D terminology locks (greps + read)
[ ] G-E foundation fidelity (disposition table honored)
[ ] G-F degradation protocol (7-step + blacklist)
[ ] R: targeted revision, re-gauntlet (≤3 cycles)
[ ] Handoff for user review — verification-gated; no commit
```

**Tooling:** `scripts/strip-latex-for-lanham.py` (LaTeX → plain text) · `tmp/analyze-style-lanham.ts` (fingerprint runner) · PDFs via `pdftotext` for quote verification ([[feedback-pdf-read-as-images-api-400]]).

---

## Open questions for the user (v1 review)

1. Should D1 user-approval be mandatory rather than default-on? (Cost: one interaction round per section; benefit: no wasted D2 pass.)
2. Tolerance bands in G-A are first guesses calibrated from the two 2026-07-01 drafts — tighten or loosen after the next few sections.
3. Should the pack (P1–P8) be saved per-section as an artifact (`plans/packs/…`) for reproducibility, or treated as ephemeral console context?
4. Part-I fingerprint table needs one refresh run against the current `-v3.tex` before first Part-I-register use.
