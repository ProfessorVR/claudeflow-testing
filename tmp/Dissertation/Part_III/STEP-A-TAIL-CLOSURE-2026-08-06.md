# STEP A — tail closure (2026-08-06)

**Closes §4 items 3 and 4 of `STEP-A-QUOTE-VERIFICATION-LEDGER-2026-08-05.md`.** Items 1 and 2 (the four
formerly un-indexed documents; the `_synthesis` layer) were closed by the index-authoring session — all four now
carry claim-level entries, and the synthesis layer was regenerated per X-08 §4.

All verification against `archon-cli-v3`, binary rebuilt at `75d8c210` (stamp now matches HEAD; the FTS hyphen
fix is compiled in and was confirmed functionally before use). Gate: `match_kind == "exact"`.

---

## 1. The eight genuine unverified candidates — all resolved

**One verifies as written. Four are recoverable with corrected wording. Three must not be used as quotations.**

| # | candidate as the entry gave it | disposition |
|---|---|---|
| 1 | *slipping away from ourselves toward whatever is happening* (Mansikka) | **SPLICE ACROSS TWO AUTHORS — do not use.** See §2. |
| 2 | *internally directed attention or mind-wandering* | **CORRECTED → EXACT:** *internally directed attention or mindwandering* — Yuvaraj sets it as a closed compound. Both the hyphenated and spaced variants score 98%. |
| 3 | *time passing slower than usual* (Perone) | **CORRECTED → EXACT:** *Time is passing by slower than usual.* **It is a questionnaire item Perone quotes, not Perone's own claim** — one of the scale items used to confirm the peg-turning task induced boredom. Cite it as an instrument item. |
| 4 | *lower alpha = cortical activation* (Perone) | **NOT A QUOTATION.** The `=` marks it as a reading note. Dropped from the candidate set; if the point is wanted, state it as a paraphrase with a locus. |
| 5 | *would predict higher levels of misses, rather than false-alarms* (Yakobi) | **EXACT as written.** One typesetting caveat: the PDF carries a **soft hyphen (U+00AD)** inside "false-­alarms". The gate normalizes it; LaTeX must receive a plain hyphen. |
| 6 | *the holistic sensation that people feel when they act with total involvement* (Csikszentmihalyi via Nacke) | **CORRECTED → EXACT:** *holistic sensation that people feel when they act with total involvement.* The leading "the" belongs to Nacke's sentence and sits **outside** the quotation marks — which is the whole of the 99% miss. **It is Csikszentmihalyi quoted by Nacke**; cite accordingly. |
| 7 | *gets us unstuck when we find ourselves stuck* (Elpidorou) | **CORRECTED → EXACT:** *Boredom strives to get us unstuck when we find ourselves stuck.* See §2 — the attribution is not Elpidorou's. |
| 8 | *without relying on any specific genre of content* | **NO HIT anywhere in the store.** Not quotable. Do not use. |

## 2. Two attribution hazards, both of which would have reached prose

**The Mansikka candidate is a splice across two authors.** *slipping away from ourselves* verifies EXACT in
Mansikka — but it is a **diagram label**, not prose: the page sets `Being | Time | self-forming emptiness ——
slipping away from ourselves —— stretching 'now'` as a schematic. *whatever is happening* verifies EXACT in
**Slaby**. The entry joined a figure element from one author to a phrase from another and presented the result as
a single quotation. Neither half is usable as the entry framed it, and the composite is not a quotation at all.

**The Elpidorou candidate is Elpidorou citing Fahlman.** The sentence reads *Boredom strives to get us unstuck
when we find ourselves stuck (Fahlman et al., 2013, p. 68).* Quoting it as Elpidorou's own formulation would
misattribute the substance to the wrong source — and Fahlman is the definitional middle term this section's
spine already runs through, so the misattribution would land inside the argument rather than beside it.

## 3. The twelve ellipsis-elided quotations

Superseded by `archon-cli-v3/reports/ellipsis-classification-2026-08-06.jsonl`, which classifies the whole store
rather than this section's hand-built subset: **339 rows, of which 34 belong to the boredom family.**

| class | bor rows | what it means for prose |
|---|---|---|
| `degraded` | 22 | elision loses text; must be re-cut against the source before use |
| `spliced-fuzzy` | 11 | two spans joined; recoverable by quoting the segments separately |
| `no-match` | 1 | not located; do not use |
| `source-own-ellipsis` | **0** | — |

**None of the 34 is quotable as it stands**, because none is a case where the source itself prints the ellipsis.
All 34 sit in the legacy `phf-bor-*` clause layer.

**Scope ruling, consistent with the demand-driven scoping approved for the synthesis layer: these are resolved on
demand, not exhaustively.** Most belong to entries L1 cites without discussion (Aroles and Küpers, Cheval,
Feldges, Hadjioannou). The ones that would become load-bearing are Elpidorou & Freeman (`bor-sec-04`, L1 ¶2),
Gibbs (`bor-sec-07`, L1 ¶4) and Elpidorou's *Good of Boredom* (`bor-sec-26`, L1 ¶12) — re-cut those against the
source at the moment a paragraph calls for them, and only those.

## 4. Standing findings reaffirmed

The index entries put paraphrases inside quotation marks, use ellipses inside quoted spans, splice across
authors, and carry a citing author's quotation as though it were their own. **Nothing from an entry enters prose
without passing the gate in its own right**, and the two archon false-failure modes are ruled out with `--doc`
before any quotation is called wrong.

Three of the eight above were near-verbatim misses of exactly this kind — an article moved outside the quotation
marks, a compound hyphenated that the source closes, a verb tense changed. Each scored 98–99% and each would have
failed a defense.

## 5. What remains open in Step A

**Nothing blocking.** The on-demand ellipsis re-cuts above are the only outstanding item, and they are scoped to
whichever of the three entries a paragraph actually quotes.
