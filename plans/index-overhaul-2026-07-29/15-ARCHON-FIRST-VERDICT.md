# §15 — Archon-first assessment: verdict, and corrections to my own reporting

*Appendix to `00-SESSION-LOG.md`. Full synthesis: `extracted/archon-first-synthesis.md` (31,540 chars). Raw per-agent evidence: `raw/workflow-journals/D-archon-first.journal.jsonl`.*

Workflow D completed 2026-07-29 after the outage resume. **49 agents · 181 findings · 40 load-bearing claims verified · 16 refuted (40%)** — the highest refutation rate of the four workflows, and several of the refuted claims are ones I reported to the user as established.

---

## 15.1 Verdict

**Qualified yes — a hybrid, with a specific split.**

> Build the store and the claim/clause layer in archon-cli; keep the authoring adapters in Python; **do not** make archon the producer of `compiled-index.json` in this phase.

The reasoning holds on both sides. The target is structurally unreachable in the incumbent — all five parsers destroy text offsets in the first executable statement of every function, the artifact format needs ~591× its current payload against a measured loader ceiling of ~25×, and `claudeflow-testing/.archon` is empty. Only archon has a substrate that can carry it: a 987 MB CozoDB, 226 ingested documents, `doc_chunk_blocks` populated at **114,612 live rows**, and a working exact/fuzzy locator.

But archon has no compiler, no `corpus_*` relations (`grep -rn ':create corpus_' crates/ src/` → empty), no adapters, and a track record where one M–L feature cost 15 days and landed incomplete. So the port is scoped to the half only archon can host. The half that is genuinely language-independent — parsing 27 entries across seven layouts and 41 CSV dialects — stays in Python and emits a typed intermediate that archon imports.

---

## 15.2 Corrections to what I reported

### The bbox coverage figure I gave was wrong

I reported "40 candidates · 40 re-anchored · **40/40 with real Marker bboxes** · 0 unresolved." Two defects in that.

**It measured a tautology.** `crates/archon-evidence/src/lib.rs:361` passes the retrieved chunk's *own content* to `find_fragment_bboxes`, which searches a concatenation of that document's chunks. A chunk is by construction a substring of that concatenation, so the exact branch is structurally guaranteed. Measured across 57 candidates: `match_kind: "exact"`, `similarity: 1.000`, **zero fuzzy, in every case**. `"exact"` in `evidence find` output is a constant, not a measurement. I flagged this caveat correctly in conversation but still reported the 40/40 as a coverage result.

**And true coverage is 68%, not universal.** Across 60 candidates over five queries: 3 returned no provenance and 16 more returned `"bbox": null` — **19/60, 32% missing**. The split is by ingest path: `chunk-doc-*` (Marker) carries bbox, `chunk-pdf-image-ocr-*` does not. Independently, `doc_chunk_spatial` holds **11,311 rows against 17,824 chunks — 36.5% of chunks have no spatial row at all**. And `locator` was null in 16 of 18 fragments in one run.

Consequence for the plan: **any gate keyed on bbox presence fails closed on a third of the corpus.** §5 of the creation plan must treat `bbox` as a degradable locator with a `degradation_reason`, not a required one.

### Other refutations that matter

**The draft-time verification gate is on one of five entry points.** `preflight_draft_inputs` has exactly one caller — `src/command/draft.rs:789`, the TUI `/draft` slash command — and that gated path then shells out to the ungated one (`slash.rs:210`). `archon draft`, `archon-fcdp run`, the wizard and `evidence curate --draft` are all ungated. Root cause confirmed: `crates/archon-draft/Cargo.toml` has **no archon-docs or archon-evidence dependency**. The drafting engine structurally cannot verify anything.

**"FCDP has no implementation in claudeflow-testing" was overstated.** `FCDP-DRAFTING-PROTOCOL.md` is 199 lines at the incumbent repo root and is the normative protocol; `scripts/analyze-lanham.ts` is the G-A style gate. The search that produced the claim used `find -name "*.py"` and was structurally incapable of matching a `.ts` file. The correct finding is *fragile and untracked*, not absent.

**Archon's `index/` tree is not a home.** It is committed under `e910839c`, whose own message reads *"a WORKING DATA ASSET, not part of the shipped code: it MUST be wiped before any upstream PR."* Its 1,730 tracked files have **zero readers** — an exhaustive grep for `units/|_synthesis|edges\.csv|book-level-ontology` across `crates/` and `src/` returns only unrelated test fixtures. Presence is not wiring; the adapter is exactly as unwritten in archon as in the incumbent.

---

## 15.3 The single most consequential number

Earlier Cozo probes measured the wrong layer: the "80 ms scan" was `select count(*)` resolved as a covering index. Reading actual values costs **2,543 ms — 32× worse**. Against the real engine: `docs status` 1.14 s, `verify-quote` **3.34–5.22 s exact and 12.12 s for a not-found quote**.

**At 45,000 claims, one `verify-quote` per claim is 42.5 hours serial best case and 151 hours for the not-found path.**

The design implication is decisive and is now in the plan: **do not ground claims by calling `find_fragment_bboxes` with claim text.** A claim extracted from a known chunk already knows its `chunk_id` and local char range; grounding is a direct `(chunk_id, char range) → doc_chunk_blocks` lookup. Reserve `find_fragment_bboxes` for the adversarial case — checking a *supplied* quotation, where the 12 s not-found path is exactly the behaviour wanted.

---

## 15.4 Two hazards to carry forward

**A byte-versus-char trap on precisely this corpus.** `doc_chunk_blocks` columns are named `char_start`/`char_end`, but the doc comment at `schema.rs:189-192` says they are **byte** ranges, and `local_span_in_chunk` returns bytes — while `quote_verify.rs:150` normalizes into a *char* vector. A claim record that inherits the name without the semantics will mis-slice every Greek, German and accented span. That is the entire Aristotle and Heidegger corpus.

**Corpus text quality, not architecture, is the binding constraint.** Live retrieval returns `pnractical`, `consiaered in 1tsely`, `Involvernent`. A chunk-level system tolerates a few corrupted tokens; a clause-level system indexes them as claims.

---

## 15.5 The cheapest week — and it is mostly Python

Ranked, all reversible, ~1–2 days total:

1. `SKIP_DIRS += "index"` in `scripts/ingest/run_ingest.py:365`, `run_ingest_phase2.py:978`, `parallel_ingest.py:69` — three tokens; stops 518 of 522 index manifest records re-embedding on the next ingest. *(Note: paths are under `scripts/ingest/`, correcting the review's citation.)*
2. `compile-corpus-index.py:718-721` elif reorder — four lines; stops the field-spill corruption at source.
3. `git add corpus/index` (**1,522 untracked files**) plus commit the dirty artifact and compiler — establishes the frozen baseline every later diff depends on, and removes a single-disk data-loss exposure.
4. Delete `archon-cli/index/`; add a production `ARCHON_INDEX_PATH` / `--corpus-index-root` reader — ~30–60 lines; ends the drift and makes archon read today's artifact instead of a 13-day-old one.
5. Fix `ig-10-incorporation.json` — minutes; one file blocks the Calleja monograph for any strict importer.
6. Move the verify gate into `handle_draft_command`, close the swallowed `Err` at `draft.rs:1050-1053` — ~60–120 lines. Highest-value cheap item in archon; closes the gap that produced the `ped-sec-29` fabrication.
7. `char_start`/`char_end` on `QuoteFragment` and its two emitters — ~10 lines, **as plumbing for item 6, not before it.** Adding fields that flow nowhere is a down-payment, not a delivery.

Items 1, 2, 3 and 5 are in the incumbent. **The cheapest high-value week is mostly Python, and it is not the port.**

---

## 15.6 Sequencing, with the one-way doors marked

| # | Work | Size | Door |
|---|---|---|---|
| P0 | The seven items above | 1–2 d | Reversible |
| P1 | Python emits a typed intermediate: tree-walk all 27 entries replacing the 19-key `TEXT_DIRS`; read the 12 ignored `*-ontology.json` files; ship a schema and a validator that **exits non-zero** | ~300–500 Py + 150 schema | Reversible, additive |
| P2 | `corpus_*` Cozo relations, importer, batched writers, retry guard | ~900–1,250 Rust | **ONE-WAY on column set** — Cozo has no `ALTER` |
| P3 | Claim + clause relations; direct `(chunk_id, range)` grounding; offsets plumbed to `QuoteEntry` | ~600–700 Rust | **ONE-WAY on column set** |
| P4 | Dual-run diff across separate process invocations, 2 weeks | ~150 Py | Reversible |
| P5 | Prefix-pushdown query rewrites; FTS decision | ~75 lines | One-way in storage once FTS exists over 450k rows (~1.6 GB) |
| P6 | Claim/clause extraction over 226 documents | **UNSIZED — repo-neutral** | **ONE-WAY on semantics** |
| Deferred | Legacy-view emitter with bug-compatibility | ~350–450 Rust | Revisit when Python is retired |
| Never | Porting the five markdown scrapers to Rust | 1,300–1,600 lines | — |

**Two conditions on P2 and beyond.** Land the 186 unpushed commits, or at least push them somewhere — the whole archon-evidence crate exists only on this WSL box, HEAD is contained by no remote. And point CI at the working branch or merge to `main`; every workflow triggers only on `main`, frozen since 2026-06-13, so none of those 186 commits has run through CI, and the blocking `cargo fmt` gate is red today.

The dual-run diff has a prerequisite: `compiled-index.json` is dirty (+589/−61) and `compile-corpus-index.py` is uncommitted (+15). Until both land, "the incumbent's output" is not a fixed object and no diff is meaningful.
