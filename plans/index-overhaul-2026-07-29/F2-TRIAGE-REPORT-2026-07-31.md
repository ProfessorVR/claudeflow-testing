# F2 Triage Report — post-F1 re-anchor ledger
**Date:** 2026-07-31 · **Input:** `reanchor-ledger.jsonl` last-verdicts over the 4,850 core clauses (post-F1 re-ingest; Phase-F prose-extract rows excluded — their batch is running)

## Baseline (post-F1)

| Class | Count | Pre-F1 | Movement |
|---|---|---|---|
| exact | 3,231 (66.6%) | 3,181 (65.3%) | +50 |
| near-verbatim | 1,203 (24.8%) | 993 (20.4%) | +210 |
| drift | 200 (4.1%) | 131 (2.7%) | +69 (former not-founds became findable-but-different) |
| not-found | 165 (3.4%) | 518 (10.7%) | **−353 (−68%)** |
| not-in-corpus | 43 (0.9%) | 49 | −6 |
| error-timeout | 8 | 1 | +7 (being auto-redone) |

The pre-F1 not-found concentrations (Chalmers 98, Barnes 86, Papachristou 72) are **gone** —
resolved by the clean re-ingest, not by triage.

## Finding 1 — WRONG-BOOK BINDING (78 not-founds, largest single block) — FIX IN FLIGHT

`sandbox:aristotle-da-3-3` was c6-bound to **Movement of Animals (2014)**; its 78 De Anima III.3
clauses were doc-scope-verified against the wrong PDF. The corpus holds the right target:
`Aristotle - On The Soul (De Anima)_(2014)_[My Copy]` (doc-4d575985). A full audit of all 24 c6
bindings found **no other wrong-book mapping**. Disposition: correct the c6 row, purge the
source's ledger rows, re-run scoped (queued behind the running Phase-F batch to avoid the ledger
race). Expect most of the 78 to flip to exact.

## Finding 2 — drift decomposes by similarity band (200 rows)

- **79 rows at sim 0.85–0.90** (just under the near-verbatim bar): mostly extraction artifacts in
  the stored quote — embedded hard newlines and glued footnote superscripts inherited from the
  incumbent sandbox extraction (e.g., `…grounds [p].31\nAccording…`). Disposition: re-author the
  quote text to the document's actual bytes per the D5 precedent (never bypass the gate) — a
  mechanical pass with human spot-check.
- **79 rows at 0.75–0.85**: inspect individually; mixed artifact/paraphrase.
- **42 rows < 0.75**: almost certainly paraphrase recorded as quotation — reclassify as claim
  paraphrase (drop the verbatim contract for these rows) rather than repair.
- Concentrations: papachristou 32 · bowin 21 · ogorman 13 · fodor 12 · kim-1988 11 (Greek-heavy
  and footnote-dense papers, consistent with the artifact story).

## Finding 3 — the acquisition decision (43 not-in-corpus + 5 stranded not-founds)

No corpus PDF exists for: **Christensen-2016 (11 clauses), Agosta-2010 (10), Fredal-2020 (9),
Withy-2023 (8), Caston "Cartesian Theatre" 2021 (5)** — plus **Costache-2013 (5 not-found rows,
no doc)** which is effectively a sixth. NAS library scan (2026-07-31) did NOT close any of these
(the library's Caston is the 1995 paper; its Christensen is a different work). **User decision
required per source: acquire the PDF, or accept prose-only (clauses stay unanchored, marked).**
Note: corpus_sources rows now exist for all six (registration backfill below) — unbound, visibly.

## Finding 4 — remaining not-founds after Finding 1 (~87 rows)

Small per-source counts (Caston-1995 9, Dow 8, Hawhee 6, Frede 6, White 5, Nussbaum 5, …).
Lengths cluster at 80–200 chars (92 rows). Likely translation-variant quotes and OCR-vs-quote
divergence. Disposition: per-source inspection in the drift pass (same session), against the
now-clean post-F1 docs.

## Finding 5 — timeouts (8) — auto-resolving

2× Fredal, 2× Withy (no doc — will reclassify not-in-corpus), Dow, O'Gorman, Kisiel ×2 (now
correctly scoped to the Heidegger-and-Rhetoric volume / O'Gorman article after the registration
backfill). The running batch redoes error-class rows automatically.

## Registration backfill (DONE this session)

The new registration-contract gate surfaced 31 `cited:*` sources referenced by dissertation
verbatims but never registered at C4. All 31 imported (validated, 0 quarantined); 25 bound to
live docs (incl. the Heidegger-and-Rhetoric volume for its essays; the O'Gorman surname-split
and Cartesian-Theatre mis-matches caught and corrected in review); 6 unbound = the acquisition
list. `check_registration` now PASSES entries-registered; 1 honest orphan remains
(`prose:bor:miyauchi…` — that article's index entry yielded zero extractable quotes: a thin-entry
signal, not papered over).

## Concordance unbacked assertions (8, was 316)

`check_projection` measures 8 remaining unbacked assertion tags in
`Boredom Secondary (Part III)/_synthesis/boredom-construct-measure-concordance.md` (the user's
anchor-repair session fixed the audited 316 down to these). The file is in the out-of-band
repair set — **user's repair session writes it**; listed here, not touched.
