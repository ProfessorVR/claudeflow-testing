# Interactive Coding-Review Plan (v1, 2026-07-20)

**Goal.** Walk the user through every aspect of the survey-coding process — one station per
exchange, in the same propose→rule→apply loop as the Stage 3 drafting — so the user (a)
understands the reasoning at each step, (b) alters anything that needs altering, and (c) rules
on the two writing deliverables that depend on the review: the M2.2 ¶2 rewrite and the
AI-coder disclosure wording.

**Why this shape.** The coding apparatus is unpublished, dissertation-original methodology
(built 2026-07-06). It is fully re-runnable: raw exports on disk, extraction and merge are
deterministic scripts, all pass files retained. So alterations at any station are
*implementable*, not merely cosmetic — but they have different costs, which each station
states up front:

- **Cost 0 — wording only.** Changes how M2.2 describes the step; no data changes.
- **Cost 1 — recompute.** Re-run a script (merge/stats); downstream counts shift; findings
  F1–F8 must be re-checked where they cite affected counts.
- **Cost 2 — recode.** Codebook or protocol change requiring re-coding of affected
  segments/families (agent-executable; largest token cost; needs explicit sign-off).

**Cadence.** One station per exchange, user may compress or reorder. At each station I
present: the artifact (with live examples pulled from the actual files), my reasoning, the
alternatives I considered or that exist, and the alteration cost. User rules: KEEP / ALTER
(specify) / DEFER.

---

## Station 1 — Corpus preparation & anonymization (cost of changes: mostly 1)
Present: the two derived tables (`respondents.csv`, `open_text.csv`) with sample rows; the
dropped-column list; respondent-code scheme (`<TERM>-Rnnn`, re-derivable, no mapping file);
free-text masking (6 responses); raw exports gitignored. Reasoning: PII-minimal storage;
row-per-answer shape for coding. Rulings available: masking policy, code scheme, whether a
mapping file should exist (currently: no).

## Station 2 — Codebook, part 1: Families A–C (boredom-forms, flight, temporal) (cost 2 if altered)
The analytically load-bearing families. Present each code with its definition, an actual coded
segment from the corpus, and the theory hook (A1's nine friction sub-tags ← the
friction-prediction scorecard; A4-DIV ← the two-channel divergence rule; C1 vs C3 ← felt drag
vs objective length). Key reasoning to examine: codes name *signatures in talk*, never
certified attunements (provenance = projected; category caution). Rulings: definitions,
inclusion/exclusion boundaries, sub-tag roster.

## Station 3 — Codebook, part 2: Families D–F (design nodes, involvement channels,
incorporation) (cost 2 if altered)
D0–D4 keyed to the chain stations (feeds the node scorecard); E = Calleja channel vocabulary
(vocabulary only — no walkthrough claims); F = incorporation-positive signatures
(presence/world/carry-over). Reasoning: the D/A double-coding rule (same friction codes once
for form-diagnosis, once for design). Rulings: node mapping, channel roster, F-family scope.

## Station 4 — Codebook, part 3: Families G–H + housekeeping (cost 1–2)
Suggestion taxonomy (G1–G6), emergent family H with promotion rules, X-codes, TRANSLATED flag.
Rulings: taxonomy grain, how emergent promotion should work in any future coding.

## Station 5 — Unit of coding & multi-coding (cost 2 if altered)
The segment (clause/sentence carrying one codable idea); multi-coding across families,
best-fit within family; every application records rcode/item/segment/code/pass. Reasoning:
multi-topic responses; co-occurrence structure needed for the divergence register. Rulings:
unit definition, within-family exclusivity.

## Station 6 — Coder protocol & the AI-coder question (cost 0 for disclosure; 2 for re-coding
under a different protocol)
Present `CODER-INSTRUCTIONS.md` in full: context given to coders, the no-inference rule,
translation handling, batch structure (6 batches). State plainly: both passes were AI passes
(Fable 5), independent and blind. **Deliverable at this station: the user's disclosure
ruling** — options prepared: (a) named in M2.2 prose; (b) substantive footnote at the
reliability sentence; (c) dissertation-level methods statement with M2.2 silent; (d) hybrid.

## Station 7 — Executed design: single-pass + reliability subsample (cost 1–2)
Original two-full-pass design vs the executed lean design (user-directed mid-run): batches
1/2/3/5 pass-1, batch 4 pass-2, batch 6 (143 responses, mostly W26) double-coded. Coverage
numbers (730 + 143 = 873). Reasoning: agreement estimated on a sizable subsample licenses the
single-pass remainder at ~half cost; batch 6 = mostly-unseen-term material. Rulings: is the
subsample adequate; should any further batch be double-coded now (cost 2, quotable before
running).

## Station 8 — Agreement measurement (cost 1 if changed)
Jaccard over code-sets, mean 0.878 on batch 6; per-code agreement table (strongest 100%
G6-USECASE; weakest E-NAR 53%; H-NEW 0% by construction). Reasoning: multi-label coding →
set-overlap measure; kappa-family stats fit single-label designs. Live examples of a
high-agreement and a low-agreement response. Rulings: measure choice, whether to also report
per-family agreement in the dissertation, how to characterize 0.878 honestly.

## Station 9 — Merge rules & auto-adjudication (cost 1 if altered — re-run merge)
The asymmetry, rule by rule with examples: union for mention-level families (D/E/G/F/X);
intersection + keyword-warranted auto-accept for load-bearing A/B/C; A1 sub-tag handling;
A4-DIV at either-pass sensitivity (recall at flag stage, precision at manual review).
Reasoning per rule. Rulings: any rule change → deterministic re-run → downstream count
refresh (F1–F8 re-check).

## Station 10 — Manual adjudication, emergent codes, negative cases, saturation (cost 0–1)
The 4 adjudicated items shown verbatim with the decisions and rationale; H-NEW dispositions
(skeptic/playback/optional); negative-case search results; saturation statement. Rulings:
re-decide any adjudication; emergent-code dispositions.

## Station 11 — Outputs & downstream dependencies (cost 0; orientation)
The coded corpus → counts per term×item×stratum → co-occurrence matrices → friction scorecard
→ DIV register → node scorecard → exemplar bank → findings F1–F8. Map of which findings
depend on which upstream rules, so any Station 2–9 alteration's blast radius is visible
before it's ordered.

## Station 12 — The writing deliverables (cost 0)
With all rulings in hand: (a) rewrite M2.2 ¶2 to the user's chosen depth (working spec from
2026-07-20: instrument derivation, segment unit, codebook-before-coding + family count,
single-pass + double-coded subsample stated plainly, Jaccard with one clause of why, merge
asymmetry in one sentence, adjudication count, disclosure per Station 6); (b) decide whether
the dissertation needs a short coding-methods appendix (gesture-scale per the future-work
rule if deferred).

---

**Standing state going in:** M2.1 revised per user edits (Diec footnote fixed); M2.2 ¶1
approved incl. global-questions revision; M2.2 ¶2 = the coding sentences under review here.
Open items riding alongside: Ulrich year confirmation (recommend vol. 9, 2012); Batch A flags
(exact procedure list; hub structure; device animations); M2.3 blocked (arc decision); M0
post-indexing revision pass queued (svw + ptf + riv + vle-05 material).
