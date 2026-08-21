# Fable Console Drafting Protocol (FCDP) — v2

**Date:** 2026-07-02 · **Status:** CURRENT DRAFT, awaiting user review (v1 retained at `fable-console-drafting-protocol-v1.md`)
**Purpose:** A reusable, gate-enforced protocol for drafting dissertation prose in the Claude Code console with Fable 5 at every prose stage — keeping god-write's two proven assets (the embedded pack; style-profile targeting) and adding the gates the pipeline never actually enforced.
**Provenance:** god-write winning run = no-corpus / no-multistep / embedded-pack → the pack is the load-bearing element; corpus retrieval overrides the pack with junk → retrieval BANNED from drafting context; Lanham fingerprint matching validated in-console 2026-07-01.

**v2 changelog (research-driven; report: `fable-console-drafting-protocol-research-2026-07-02.md`):**
1. **Quote-ID placeholder mechanism** — D2 emits `«Qnn»` markers, never quoted text; substitution is mechanical (`scripts/substitute-quote-ids.py`). [Copy-as-Decode / constrained-decoding literature]
2. **Pack reordering + stage-specific sub-packs** — critical constraints at the head, quote *index* early, full quote texts at the tail. [lost-in-the-middle; Anthropic context-engineering]
3. **New Stage D1.5 skeleton** — per-movement nucleus/satellite structure with rhetorical-relation labels + a counterargument pass. [RST; skeleton-of-thought]
4. **Judge/drafter separation** — semantic gates (G-E fidelity; new G-G consistency) run as separate judge calls with lean contexts, structured as binary question batteries. [LLM-as-judge findings on self-rationalization]
5. **Per-movement numeric style targets** in D1 (style specified up front, not only corrected post hoc). [StyleMC]
6. **Provenance log + LLM-usage disclosure statement** (P9; R-stage diff records tagged with gate outcomes).
7. **Optional G-C+ retrieval verification** for *secondary* literature citations only (post-gauntlet; CiteCheck-style). Primary/classical loci remain PDF-verified at pack time.
8. **Deferred, with trigger:** trained authorship-verification scorer — adopt only if G-A bands pass a draft that reads off-voice to the user.

---

## 0. Roles and invariants

1. **Model.** Every prose-generating and prose-judging step runs on Fable 5 in the console. Judge passes are **separate model calls with lean contexts** (the draft + the rubric + only the material the rubric needs — never the full drafting conversation). Mechanical stages (frame reads, OCR, transcripts) may be delegated to cheaper models; their outputs enter the pack as *evidence*, never as prose.
2. **The pack is authoritative.** No corpus retrieval, no ChromaDB, no god-learn context during drafting. Not in the pack → not in the draft; it becomes a `******` placeholder. (External retrieval is permitted **only** in the optional post-gauntlet citation-verification stage, G-C+, which runs on the finished draft, not in the drafting context.)
3. **Never modify the user's source documents.** New sections to standalone `*-DRAFT-vN.md` files (revisions of existing prose on `*-iterations/` copies); timestamped backups before touching shared artifacts; commits only after user sign-off.
4. **Standing constraints on all output:** `tmp/Dissertation/REVISION-PROTOCOL.md` (rule tiers, turn-weight gate) and the session-degradation 7-step pre-output protocol + forbidden-phrase blacklist (`tmp/Dissertation/TODO_NOTES.md` §H).

**Pipeline shape:**

```
P (pack) ─> D1 (movement plan + numeric style targets) ─> [user approval, default ON]
         ─> D1.5 (skeleton: nucleus/satellite + counterarguments, no prose)
         ─> D2 (drafting with «Qnn» markers) ─> substitute-quote-ids.py
         ─> G (gauntlet: 5 mechanical gates + 2 judge gates)
         ─> R (targeted revision, loop to G, ≤3 cycles) ─> user review (diff + provenance log)
```

---

## 1. Stage P — Pack assembly (the embedded pack)

One contiguous block assembled *before any prose exists*. **Field order is load-bearing** (long-context models attend most reliably to the head and tail of the context; the middle is the weakest position):

**HEAD — critical constraints (always first, clearly labeled):**

| Field | Content |
|---|---|
| **P1 TASK** | Section identity, insertion point, target length range, register (Part-I / MA-applications), audience, LaTeX conventions |
| **P2 STYLE TARGET** | Full Lanham fingerprint for the register (§6) + tolerance bands + runner invocation |
| **P3 TERMINOLOGY & STYLE LOCKS** | The enumerated lock list (§5), copied in, not referenced |
| **P8 NEGATIVE CONSTRAINTS** | Forbidden-phrase blacklist; banned patterns, stated greppably |
| **P9 USAGE STATEMENT** | The standing role boundary, in the pack itself: *the model contributes phrasing, structure, and analysis of pack-supplied evidence; it may not introduce claims beyond the evidence bank, may not invent or recall citations, and every quotation enters by ID substitution only.* (This doubles as the source text for the dissertation's eventual LLM-disclosure statement.) |

**MIDDLE — working material:**

| Field | Content |
|---|---|
| **P4a QUOTE INDEX** | Compact catalog: ID · source · locus · one-line description of each quote's content and intended rhetorical use. This—not the full text—is what drafting reasons over. |
| **P5 EVIDENCE BANK** | Timestamps, measurements, findings — each graded `CONFIRMED` / `AUTHOR-CONFIRMED` / `[UNCERTAIN]`. Only graded evidence may be asserted; grades set assertion strength (G-E enforces). |
| **P6 CONCEPTUAL SEMANTICS** | The operative apparatus (e.g., RODA: A₀–A₄, *bia*, the two *paschein* modes, the union's two poles) in the project's locked formulations |
| **P7 FOUNDATION TEXT** | The user's draft being built upon, verbatim and complete |

**TAIL — bulk reference:**

| Field | Content |
|---|---|
| **P4b QUOTATION BANK (full text)** | Every quotation, character-exact, PDF-verified, with citation and locus, keyed by ID, **also saved as JSON** (`{"Q1": {"text": "...", "cite": "..."}}`) for the substitution script. Verified at pack-assembly time, in-session — no "remembered" verifications. |

**Stage-specific sub-packs.** Each stage receives a tailored slice, not the monolith: **D1** = P1–P3, P8–P9, P5 (grades), P6, P7, P4a. **D1.5** = the D1 slice + the approved plan. **D2 (per movement)** = HEAD fields + that movement's skeleton, assigned evidence items, assigned P4a index entries, and the relevant P7 passages — *not* the full bank text (the `«Qnn»` mechanism makes it unnecessary). **Judge calls** = the draft + the rubric + only the P-fields the rubric names.

**Persistence.** Save the pack per section (`plans/packs/<section>-pack-v N.md` + `…-quotes.json`) — packs are reproducibility artifacts and the provenance log refers to them.

**Gate G-P (before D1):** every field present or marked N/A; every P4b quote verified against a PDF this session; every P5 item graded; correct fingerprint in P2; JSON bank parses; P4a and P4b keys match.

---

## 2. Stage D1 — Phase-one prompt: the movement plan (no prose)

From the D1 sub-pack, produce:

- **Movements:** ordered list; each with (a) its claim in one sentence, (b) assigned evidence items, (c) assigned quote IDs, (d) foundation anchors, (e) target word share, **(f) numeric style targets** — average sentence length, short/long share, periodic-vs-running lean, and diction note for *this* movement, derived from P2 (e.g., theoretical exposition movements run longer and more periodic; close-reading movements shorter and more paratactic). Style is specified up front, not only corrected at G-A.
- **Foundation disposition table:** every P7 beat → RETAIN / EXPAND / CORRECT (correction stated) / OMIT (reason surfaced — omissions are never silent).
- **Quote/evidence ledger:** every P4a and P5 item → ASSIGNED (to a movement) or UNUSED (reason).

**Gate G-1:** no orphan claims; no unmapped foundation beats; corrections listed; ledger closed. **User approval of the plan is default-ON** (skip only on explicit "draft straight through").

---

## 3. Stage D1.5 — Skeleton (structure, still no prose)

For each approved movement, enumerate its discourse structure before any sentence exists:

1. **Nucleus claims** in order, each with its **satellites** labeled by rhetorical relation — *evidence* / *elaboration* / *concession* / *contrast* / *restatement* — and each assigned quote and evidence item attached to the satellite it serves, with its rhetorical function stated ("«Q3» is the *evidence* satellite of N2"; "E7 grounds the *concession* answering C1").
2. **Counterargument pass:** for each major nucleus claim, the strongest plausible objection or rival reading (generated from the pack — the foundation text, the apparatus, and the evidence; not from outside sources), plus a disposition: ANSWER (with which satellite), CONCEDE-AND-LIMIT, or SURFACE-TO-USER (the protocol never silently drops a live objection). Straw-man objections are a defect; the objection must be one the dissertation's actual interlocutors could press.
3. **Transitions:** the discourse relation each movement-boundary performs (consequence, turn, widening, return).
4. **Rhythm placement:** where the short punch sentences land; where the long periodic builds run (refining D1's numeric targets to positions).

**Gate G-1.5:** every nucleus has at least one satellite; every assigned quote/evidence item sits on a named satellite; every major claim has a counterargument disposition; no new claims beyond the plan. The skeleton is compact — show it to the user only if the counterargument pass produced a SURFACE-TO-USER item; otherwise proceed.

---

## 4. Stage D2 — Phase-two prompt: drafting with quote markers

Full prose, movement by movement, from the skeleton. The phase-two prompt differs in kind:

1. **Quotations are never generated.** The draft emits `«Qnn»` where a quote belongs (`«Qnn+»` to append the bank's citation string). The prompt carries the movement's P4a index entries (source, locus, one-line content) so the prose can be written *around* each quote — but the quoted words themselves enter only by substitution: `python3 scripts/substitute-quote-ids.py <draft> <quotes.json> <out>` (exits nonzero on unknown IDs = automatic G-B fail). Anything quote-like outside the bank → paraphrase without quotation marks, or `****** UNVERIFIED:`.
2. **Evidence asserted per grade:** `AUTHOR-CONFIRMED` flatly; `CONFIRMED` with its timestamp/measure; `[UNCERTAIN]` hedged or omitted.
3. **Rhythm directives restated per movement** from the skeleton's placements — G-A will measure the result.
4. **RETAIN passages carried verbatim/near-verbatim** and marked in the footer comment for the user's diff.

Output: LaTeX body in `*-DRAFT-vN.md`; header comment records pack version + plan version + correction list; footer comment records retained/new/omitted material.

---

## 5. Stage G — The quality gauntlet (seven gates)

Mechanical gates first (cheap, deterministic), judge gates after; report appended to the draft file as a comment. Failures produce a *named defect list* → Stage R.

**G-A · Lanham style gate** (mechanical).
`python3 scripts/strip-latex-for-lanham.py <draft> <plain.txt>` → `npx tsx tmp/analyze-style-lanham.ts <plain.txt>` → compare to P2:

| Metric | Pass band |
|---|---|
| avg sentence length | target ± 3.5 words |
| short(<15) / long(>30) shares | ± 0.06 / ± 0.08 |
| periodicRunningRatio | ± 0.12 |
| preMainVerbClauseCount | ± 0.10 |
| voiceScore / dynamicRange | ± 0.12 each |
| beVerbRatio | ± 0.05 |
| nominalizationDensity | ± 1.5 per 100w |
| latinateGermanicRatio | ≤ target + 0.06 (more Germanic always passes) |
| opacityScore | ± 0.10 |
| **all categorical labels** | exact match |

Fix sentence architecture only during a G-A repair — claims, quotes, evidence untouched. *(Deferred upgrade: a trained same-author verification score as a holistic co-gate — adopt if these bands ever pass a draft the user reads as off-voice.)*

**G-B · Quote-fidelity gate** (mechanical).
The substitution script must exit 0 (no unknown IDs); post-substitution, every quoted span in the draft must character-match a P4b entry (ellipses only with bracketed marks; interpolations only in square brackets); no quotation marks outside bank coverage. Unused ASSIGNED quotes → defect (the plan said they'd be used).

**G-C · Citation-rigor gate** (mechanical + read).
Every citation carries a locus; every locus traces to P4/P5 or the foundation text; **no locus from model memory, ever.** Missing source → `******`; uncertain page → `[****** page unverified]`.
**G-C+ (optional, post-gauntlet, secondary literature only):** parse secondary-source citations, query Crossref/WorldCat, compare field-by-field, label Exact / Minor / Major; Minor+Major → manual correction. Runs on the finished draft in a separate context — the drafting RAG-ban is untouched. Primary/classical loci are exempt (already PDF-verified at pack time, which is stronger).

**G-D · Terminology-lock gate** (mechanical + read).
Greps: retired stem `phantasmat`; `\textbf{` run-in heads; gendered pronouns bound to "the player"; "supplies the … anchor"; back-reference phrases; Unicode quotes. Read-through: *hexis* ≠ habit; "emotion" not *pathē* (Rhetorica); Greek faculty-names italic; no unauthorized coinages.

**G-E · Foundation-fidelity gate** (**judge call, lean context**).
Separate model call: context = the draft movement + the relevant P7 passages + the relevant P5 grades + the disposition table — *not* the drafting conversation. The rubric is a binary battery, answered claim-by-claim with stated reasons: (1) Is each RETAIN beat present? (2) Is any foundation claim altered in strength or modality beyond its evidence grade? (3) Is each CORRECT beat corrected exactly as specified, and flagged? (4) Does the draft assert anything with no P5/P7 warrant? (5) Is every OMIT surfaced in the footer? Any YES on 2/4 or NO on 1/3/5 → named defect.

**G-F · Degradation gate** (checklist).
7-step pre-output protocol; blacklist consulted; turn-weight respected (one section per drafting cycle).

**G-G · Consistency gate** (**judge call, lean context** — new in v2).
Separate call: the draft + P3/P6 + the D1 claim list. Binary battery: (1) Is every locked term used per its locked definition at every occurrence? (2) Does any movement contradict an earlier movement's claim without explicit acknowledgment? (3) Is each evidence item cited with the same value/grade everywhere it appears? (4) Do any two passages characterize the same concept or interlocutor incompatibly? For multi-section work, run G-G across the assembled document, not only within the new section.

---

## 6. Stage R — Revision, provenance, handoff

1. Fix only what a gate named; one cycle addresses all failed gates; re-run the full gauntlet after.
2. **≤ 3 G↔R cycles** (independently supported by the self-refinement literature: returns diminish and over-regularization begins past two or three passes). Each cycle is guided by *fresh judge calls*, never by the drafter critiquing itself in its own context. Still failing → stop, surface the conflict (usually a spec conflict, e.g. quote density vs sentence-length band).
3. **Provenance log:** every draft version is diffed against its predecessor (`git diff --no-index` or equivalent); each diff is recorded in the draft's footer comment tagged with the cycle number, the gates that triggered it, and the judge findings it answered. The log + the saved pack reconstruct the full lineage of every passage — this is also the evidentiary basis for the dissertation's LLM-disclosure statement (P9).
4. Handoff: draft + gauntlet report + correction/omission list + provenance log, explicitly awaiting review. Revisions of user prose → per-paragraph (the 10-step protocol); new sections → whole-document with the footer diff-comment. Nothing committed or propagated until user sign-off.

---

## 7. The lock list (P3/P8 source of truth — copy into every pack)

- Quotes in LaTeX markup: `` `` … '' `` — zero Unicode quotes.
- No bold run-in heads (`\textbf{Topic.}` paragraph labels).
- *hexis* ≠ habit ≠ *doxa* — never conflate (habit = the repetition-tendency that cultivates the *hexis*).
- "emotion," not *pathē*, for Rhetorica emotions (except direct quotes).
- Ungendered prose; the in-game subject is "the player" (gendered pronouns only for named characters).
- Greek faculty-names in italics (*phantasia*, *doxa*, *orexis*…), not "faculty of X."
- Retired stem: "phantasmatic" → "phantasmic" (except verbatim MA-era quotes).
- The union's poles: **world-disclosedness / co-disclosedness**.
- *Prohairesis* = the bouletic's deliberative completion, never a coordinate "Type 4."
- No explicit back-references; no "supplies the canonical anchor"; coined-compound restraint (locked coinages only — *phantasia-load*, *rhetorical incorporation*, *veri(dis)similitude*).
- Missing source → `******` (marathon form: `****** UNVERIFIED:`).
- Part II applications = MA voice; Part I register = Part I voice — never mixed within a section.

---

## 8. Stored voice fingerprints (P2 source of truth)

Measured with `tmp/analyze-style-lanham.ts`; re-measure when the runner changes.

**MA-applications voice** (Part II §4+ / game analyses; measured 2026-07-01, 21,323 words; prepPhrase and latinate are ceilings — the MA numbers carry citation-apparatus inflation):

| metric | target |
|---|---|
| avg sentence length | 33.7 (working band 29–36) |
| short(<15) / long(>30) | 0.23 / 0.45 |
| nounVerbRatio | 0.65 (balanced) |
| nominalizationDensity | 5.0 |
| prepositionalPhraseDensity | ≤ 5.4 |
| beVerbRatio | 0.15 |
| parataxisHypotaxisRatio | 0.38 (mixed) |
| periodicRunningRatio | 0.44 (mixed) |
| preMainVerbClauseCount | 0.21 |
| voiceScore / dynamicRange | 0.41 / 0.74 (strongly voiced) |
| latinateGermanicRatio | ≤ 0.14 |
| opacityScore | 0.76 (opaque) |
| tacit figures | polyptoton ~0.10/sent; chiasmus, antithesis, isocolon, climax present |

**Part-I voice** (Part-I-register prose; frozen fingerprint): ~31w sentences; 85% Germanic; voiceScore 0.39; opacityScore 0.74; dynamicRange 0.90; heavy chiasmus/antithesis/polyptoton. **Refresh against the current `-v3.tex` before first Part-I-register use.**

---

## 9. Invocation checklist (the one-pager)

```
[ ] P: assemble pack, HEAD/MIDDLE/TAIL order; save to plans/packs/ ... gate G-P
[ ] D1: movement plan + per-movement numeric style targets .......... gate G-1 → user approval (default ON)
[ ] D1.5: skeleton (nucleus/satellite + counterargument pass) ....... gate G-1.5 (surface open objections)
[ ] D2: draft with «Qnn» markers, per-movement sub-packs
[ ] substitute-quote-ids.py (exit 0 required)
[ ] G-A Lanham (strip → runner → bands + labels)      [mechanical]
[ ] G-B quote fidelity (100% bank-covered)            [mechanical]
[ ] G-C citation rigor (no memory loci)               [mechanical+read]
[ ] G-D terminology locks                             [greps+read]
[ ] G-E foundation fidelity                           [JUDGE call, lean context]
[ ] G-F degradation checklist
[ ] G-G consistency                                   [JUDGE call, lean context]
[ ] R: targeted revision + provenance diff log, re-gauntlet (≤3 cycles)
[ ] (optional) G-C+ retrieval verification, secondary literature only
[ ] Handoff: draft + gauntlet report + provenance log — verification-gated; no commit
```

**Tooling:** `scripts/strip-latex-for-lanham.py` · `scripts/substitute-quote-ids.py` · `tmp/analyze-style-lanham.ts` · `pdftotext` for pack-time quote verification ([[feedback-pdf-read-as-images-api-400]]).

---

## Open questions (carried to v2 review)

1. G-A tolerance bands remain first-pass calibrations — tighten after the next 2–3 sections.
2. Part-I fingerprint refresh still pending (one runner pass on the current `-v3.tex`).
3. G-C+ default-off is my recommendation (your PDF-verification practice outranks it for primary sources) — flip to default-on if secondary-literature density rises in Part II/III.
4. Deferred authorship-verification scorer: trigger = any draft that passes G-A bands but reads off-voice to you.

---

## 10. Structural defaults (ADDED 2026-07-20, author-directed)

### 10.1 Introduction structure — DEFAULT for all introductions

Every introduction (section- or chapter-level, scientific or humanistic register) follows the
author's six-move structure (exemplar: `C:\Users\Dalton\Desktop\Introduction Structure Example.pdf`;
memory `feedback-user-intro-structure`):

1. **Opening move / hook** — catchy, poignant, relevant (exemplar uses a resonant quotation).
2. **Context** — everything needed to understand what follows (prior studies, the dissertation's
   frame, the field); internal order flexible.
3. **Disruption** — the transition; stylistically a rhetorical question; it IS the gap/problem the
   context leaves unresolved. Must be detailed and specific, never gestural.
4. **Resolution** — how the argument addresses the gap, with the METHODOLOGY folded in (no
   separate metatextual methodology block).
5. **Signpost** — the analytical roadmap (see §10.2).
6. **Thesis** — LAST; the direct answer to the gap (exemplar cadence: "By X … Therefore Y").

D1 movement plans for introductions map their movements onto these six moves. Bans in force:
no metatextual signposting sentences; no self-referential gap-framing ("this section enters the
gap"); no gambling vocabulary ("wager"/"stakes"); no sentence-initial "And"; "record" never names
the evidence (say "the survey data"/"corpus").

### 10.2 Gold-standard roadmap/signpost exemplar

The Part III desktop-section M0.4 seven-part roadmap (2026-07-20; `tmp/Dissertation/Part_III/
drafts/DESKTOP-M0-DRAFT-v1.tex`, carried into v2) is the GOLD STANDARD for signpost paragraphs
until the author acknowledges a better one (memory `reference-gold-standard-roadmap`). Its
reproducible features: an explicit part-count; one descriptive sentence per part stating what the
part DOES (not just its topic), in chronological order; concrete nouns from the actual content
(the virtual hospital, the flight to YouTube, the WE) rather than generic labels; zero
throat-clearing.
