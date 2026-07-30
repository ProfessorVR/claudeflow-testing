# Index Entry Creation Plan — Claim and Clause Level

**Date:** 2026-07-29 · **Status:** DRAFT, for finalisation · **Supersedes:** `plans/secondary-cluster-index-plan-TEMPLATE-2026-07-15.md` (retained as the source of the parts worth keeping)
**Evidence base:** `index-system-ADVERSARIAL-REVIEW-2026-07-29.md`, same folder — four workflows, **280 agents, ~20.8M subagent tokens, 1,292 raw findings, 239 adversarially verified (199 confirmed, 40 refuted)**
**Goal it serves:** a large and extraordinarily detailed index of every document — every claim, every clause, every point of connection, every weakness

---

## HANDOFF — read this first

### The three decisions the author must make

Everything else in this plan is specified. These three are not, and each blocks a named phase. They are stated in full at §13.1–13.3.

| # | Decision | Blocks | Why it cannot be defaulted |
|---|---|---|---|
| **1** | **Verbatim storage.** Does a rights-tiered storage/display split replace the blanket 25-word quotation ban — store the exact span always with `rights_tier` + `redact_on_render`, apply word ceilings only to rendered output? | **Phase C1** | `rights_tier` and `redact_on_render` are columns. A clause-level index needs the clause, and a verbatim checker needs a stored span to compare against. The ban is currently applied uniformly to Aristotle, Radcliffe 1794, Equiano 1789 and the author's own MA thesis |
| **2** | **Density band.** Confirm 15–35 records per 1,000 source words. | **Phase D1** | Every gate threshold derives from it. Calibrated from the author's own two exemplars — `Dissertation/` at 1 per 58 words, `Veri(dis)similitude` at 1 per 59 — against today's ~1 per 1,218 |
| **3** | **Group layer.** Confirm that documented debates, the intra-cluster citation network and the scholarly-evolution arc move to an optional GROUP layer reporting `N/A-by-construction`. | **Phase D1** | These are the only three gates that genuinely collapse at N=1. Moving them is what lets a single-article entry pass, which the standing ruling that articles get standalone entries requires |

A finalising session should surface any *further* decisions it finds rather than choosing defaults for them.

### Provenance of every citation in this document

**Both repositories were on `feat/wraith-retrieval` throughout, and neither switched branch during the audit** (last checkout in each: 2026-07-17). But:

> **Every `path:line` in this plan resolves against the DIRTY WORKING TREE, not against HEAD.**

- `claudeflow-testing` HEAD `6cb0f563b`. `scripts/compile-corpus-index.py` is **1,412 lines in the tree against 1,397 committed** (+15, three extra `TEXT_DIRS` entries). A clean checkout puts every citation in that file out by roughly fifteen lines.
- `corpus/index/compiled-index.json` is tracked and dirty, and was **recompiled during the session** at `builtAt 2026-07-29T19:00:44Z` by a concurrent anchor repair (see `11-ANCHOR-REPAIR-2026-07-29.md`). Node and term counts quoted anywhere in the evidence base predate that rebuild.
- `archon-cli` HEAD `8758f2fa`; the binary used for all live measurement was `archon 1.3.11 (7b44c665)`, one test-only commit behind.
- The audit ran before the anchor repair, so the Boredom Experiment entry's recorded defects are partly stale **in the author's favour** — that entry improved.

Commit the compiler and the artifact before treating any citation as stable.

### What to read, in order

1. This plan.
2. `index-system-ADVERSARIAL-REVIEW-2026-07-29.md` — the consolidated findings, including §6, the honest record of what did *not* survive verification.
3. `00-SESSION-LOG.md` — narrative and state, plus §10, which corrects a drift-testing error I repeated.
4. `15-ARCHON-FIRST-VERDICT.md` — the repo decision and its refutations. **Note its recommendation to keep authoring adapters in Python is superseded by §0.2 below**, because full regeneration is now sanctioned.
5. `12-STALENESS-SWEEP-2026-07-29.md` and `11-ANCHOR-REPAIR-2026-07-29.md` — a live worked example of the reverse-reference problem the plan's E10 and G19 exist to solve.
6. `raw/workflow-journals/*.jsonl` — the verbatim return of all 280 agents, one JSON object per line, if any claim needs re-deriving.

### Corrections to apply while reading

- Workflow A's own synthesis says "12 of 27 entries, 288 defects." **Wrong** — all 27 were audited and the figure is **551**. Its input was truncated at 220,000 characters. Recovered from the journal.
- The plan-review strand refuted **13 of 43** attributed defects, nearly all by *causal inversion*: the canonical template is dated 2026-07-15 and was blamed for defects in files authored in May and June. It codified the gold-standard shape; it did not cause the earlier entries' problems.

---

## 0. The finding this plan is built on

The programme has treated claim-level indexing as an authoring problem. It is an addressing, schema and wiring problem.

Roughly 5,000 claim-shaped records are already authored and sitting on disk across the 27 entries, plus 4,961 span-anchored claims in the sandbox. Almost none is addressable, most is unregistered, and the finest addresses the corpus ever produced were captured at authoring time and replaced with a checkmark. The current process spends about 111 agent-runs and 138,000 words to deliver 68 name-only strings to runtime — one claim record per ~1,218 source words. The two artifacts that already hit the target, `corpus/index/Dissertation/` and `corpus/index/Veri(dis)similitude (Salvo MA)/`, achieve one per 58–59 words, roughly 21× finer, and both were built outside every plan in `plans/`.

A second finding, added 2026-07-29 after live verification against archon-cli, changes what this plan has to build. **The clause layer largely exists already, in a different repository.** `archon docs verify-quote` returns, for any named quotation, an exact-or-fuzzy verdict, a similarity score, the matched span, a sub-span-resolved page, a sub-span-narrowed bounding box, and a Bekker or page-number locator read off the running head at ingestion. Measured: *"the soul is in a way all existing things"* → exact, similarity 1.000, p.48, a 41-point box, `Bekker:431b1`. The fabricated VR Pedagogy quotation → no exact match at all. Full detail and its consequences are in §3.1a; the sizing, sequencing and gates below are written against that finding rather than against the assumption that clause addressing must be built from nothing.

One control case sizes the problem exactly. The canonical template has been instantiated once, as VR Pedagogy Secondary. That build was executed well by its own standard — 34 of 34 units complete, zero stubs, zero dangling ids, a concept matrix perfectly consistent with its ontology — and it drew 36 defects, more than any other entry. Sixty-nine agent-turns and 99,531 authored words produced an entry from which **exactly one file is read by any consumer**, yielding 60 ontology nodes and zero edges, because no `tension-edges.json` exists, because the template never names the file. The failure is not execution. It is that the plan specifies deliverables nothing reads and gates that cannot fail.

So this plan inverts the order of work. The first deliverable is not a source folder. It is the schema, the checkers, and the loader.

---

## 0.2 Operating constraints — user direction, 2026-07-29

Four directives received after this plan's first draft. They change the risk model materially and every section below is now written against them.

**The target repository is archon-cli.** Not a hybrid, not a proposal. The user is migrating to archon as their primary agent and began the god-agent port for that reason; the index and the ingestion system both land there. `plans/index-overhaul-2026-07-29/15-ARCHON-FIRST-VERDICT.md` recommended keeping the authoring adapters in Python because parsing 27 irregular entries was the long pole. **That recommendation is superseded** — see the regeneration contract below, which dissolves the adapter problem rather than solving it.

**Index first, ingestion second, and errors in the interim are accepted.** The stated rationale: a working index helps the dissertation now, even imperfect, while the ingestion system is fixed afterwards. This is sound, because the index work splits cleanly and almost all of it is ingestion-independent — wiring fixes need nothing from ingestion, and the integration of the existing and sandboxed indexes uses spans that already exist.

**Full re-ingestion and full regeneration of index entries are both acceptable**, provided the end state is a better entry than exists today. This is the most consequential of the four.

**Ingestion is hardened after the index is complete and locked.**

### 0.2.1 The regeneration contract, and what it changes

If every ingested document and every generated index entry may be rebuilt, then almost nothing in this programme is a one-way door. Three specific consequences.

**The Cozo column set stops being irreversible.** §2.3 and §12 previously flagged this as the hardest constraint, because Cozo has no `ALTER` and `run_create` only swallows "already exists." That is still true of a *populated* relation — but a relation whose every row is regenerable can be dropped and recreated. The schema therefore carries a **redo cost, not a permanent commitment**. It should still be designed carefully, because redo means re-running extraction over 226 documents, but a schema mistake is recoverable and should not gate the start of work.

**Span anchoring against the current imperfect store is acceptable.** Claims generated now will carry offsets into a text layer that is partly ligature-corrupted, partly OCR-damaged, and missing spatial rows for 36.5% of chunks. Under the regeneration contract that is a known, bounded, temporary cost rather than permanent contamination. The mitigation in §3.1a still applies and is still worth having — store `chunk_id` plus a local range and derive page and bbox on read, so a re-ingest invalidates a derivation rather than a record — but it is now an efficiency measure, not a survival measure.

**The only genuinely irreversible asset is the hand-authored analytical judgment.** Everything else in this programme regenerates. What does not is the cross-author relational knowledge in the 27 entries — the debates, tensions, concordances, contested readings and interlocutor maps, roughly forty hours per good entry, which no extraction pass reproduces. **1,522 files of it are untracked by git and not gitignored, on one disk.** Against a regeneration contract that makes every other risk cheap, this is the one that is not, and it should be closed before anything else in this plan begins.

### 0.2.2 What "an improved index entry" has to mean

The user's condition on regeneration is that the result be better than what exists. That has to be measurable rather than asserted, and the audit supplies the baselines:

| Property | Today (measured) | Target |
|---|---|---|
| Addressable records per 1,000 source words | ~0.8 (Boredom Secondary: 1 per 1,218 words) | 15–35 |
| Records reaching runtime | 2.3% of the entry (Boredom Secondary); ~1% (VR Pedagogy) | ≥95% |
| Character spans | **0** in 1,758 files | ≥90% where a text layer exists |
| Quotations machine-verifiable | 0 — a 6-word fabrication passed all 14 gates | 100%, gated on `match_kind == "exact"` |
| Gates satisfiable by narration | 14 of 14 | 0 |
| Relational apparatus (debates, tensions, concordances) | present, rich, unreachable | **preserved and reachable** |

The last row is the binding one. An entry that gains spans and loses the relational layer is not an improvement, and any regeneration route has to carry that layer forward rather than re-derive it.

---

## 1. Scope

| | |
|---|---|
| Produces | Per-source CLAIM, CLAUSE, EDGE, TENSION, TERM and SOURCE records, schema-validated, span-anchored, reachable at runtime |
| Target density | 15–35 records per 1,000 source words (calibrated from Dissertation 1/58w, Veri(dis)similitude 1/59w, sandbox 155–512 claims/article) |
| Applies to | Every source in `corpus/`, monograph and article alike, plus the user's own prose and primary-analysis artifacts |
| Does not cover | Group-level relational apparatus (debates, citation networks, evolution arcs) — those move to a GROUP layer, §6.4 |
| Prerequisite | §2. Do not author under this plan until §2 is green |

---

## 2. Preconditions — code that must land before any authoring

Authoring into a system that cannot report what it discarded reproduces the current state at higher volume. These are the minimum, drawn from the code audit's dependency-ordered list.

### 2.1 Observability (Tier 0)

| # | Change | Location | Why |
|---|---|---|---|
| P1 | `argparse` with `--root`/`--out`/`--strict`/`--dry-run`; module `ERRORS` counter inside `warn()`; call `warn()` at all 23 discard sites with path and line; `sys.exit(1)` under `--strict` | `compile-corpus-index.py:30-32, :153-154, :1361-1412` | The compiler emits **zero bytes to stderr** on the live corpus while discarding 37.6% of header source and 55 of 119 tension records. All 12 `warn()` sites sit inside `except` handlers; the 23 real discard sites are bare `continue`, so no handler can fire |
| P2 | Golden-file test: compile a 5-file fixture into a temp dir, assert exact JSON output | new `tests/` (~120 lines) | Every fix below is otherwise unverifiable except by manual diff of a 664 KB nondeterministic file. This is why a 10,009-character `centralityTier` survived three feature commits |
| P3 | Total sort key `(-len(t), t.lower(), t)`; drop or content-hash `builtAt` | `:1304`, `:1375` | 106 of 1,722 positions churn per run; `builtAt` is declared at `corpus-index-provider.ts:53` and read by nothing |
| P4 | Atomic write (`.tmp` + `os.replace`); refuse to publish on zero nodes or a >20% count drop without `--allow-shrink` | `:1383-1387` | An interrupted write truncates the JSON, which `jsonl-loaders.ts:215` converts to `null` — a silent total blackout |
| P5 | Log the `catch` in the index loader with error and path; distinguish absent from denied from corrupt; log the empty-context case | `jsonl-loaders.ts:215-217`, `corpus-index-provider.ts:108-109`, `retrieval-stage.ts:477` | Index missing, index corrupt, and topic-too-short currently collapse into one observable: no log line |
| P6 | Wire `npm run typecheck` as a CI gate; fix the two arity errors it already reports | `package.json:23`, `faceted-retrieval.ts:154-164, :186-195` | 157 errors accumulate unseen; everything runs through `tsx`, transpile-only |
| P7 | Add a count and schema gate on `compiled-index.json` to `god-audit.yml` | `.github/workflows/god-audit.yml` | **No CI job references the compiler or the artifact at all** |

### 2.2 Stop active corruption (Tier 1, the subset that touches authored content)

| # | Change | Location | Why |
|---|---|---|---|
| P8 | Guard both sides of the bridge match: `targetLower.length > 0 && …` | `cross-author-utils.ts:473-474` | `t.includes('')` is always true in JS. 31 of 72 hooks fire for **every** facet. The bridge feature has never worked on this corpus |
| P9 | Refuse to emit a bridge section when either author is `Unknown` or undefined | `gold-standard-prompt-builder.ts:712-716` | The prompt currently reads `**Bridge:** Summary Matrix (Aristotle) ↔ ? (Unknown)` followed by `Both authors MUST be cited with direct textual evidence` — a mandatory instruction to fabricate a synthesis with a non-existent author |
| P10 | Delete `_hooksDerivationDone`; derive lazily per hook | `cross-author-utils.ts:56, :342, :351` | One-shot global with no reset anywhere. Any recompile renders `(undefined)` into the prompt and kills ICP cross-author backfill **after logging "Bridge activated"** |
| P11 | Reorder `:718-721` so the terminator precedes the continuation arm; bound the field/value split at `:308` to its enclosing section | `compile-corpus-index.py` | Two shipped nodes are corrupt. `Preparatory Rhetoric` carries 10,009 characters and 973 junk unit tokens — 3.07% of the whole artifact. `Temporalität` ships another node's units as its own: a plausible-looking, wholly wrong provenance assertion |
| P12 | Merge key `(name.lower(), text)`, not `name.lower()`; rank tiers and keep max | `:1319-1348` | All 51 collisions are cross-text. 14,066 characters of definition discarded; in 32 of 51 the surviving definition and the surviving tier come from different books; Part III clusters are first in `TEXT_DIRS` and systematically demote primary sources |
| P13 | `authority_tier` emits `UNCLASSIFIED`, never defaults to `secondary` | `cross-author-utils.ts:317` | 71 of 117 catalog titles are mislabelled, including *Fundamental Concepts of Metaphysics* and the Greek critical editions of *De Anima* |
| P14 | De-duplicate retrieval results on `chunkId`, not `page_start` | `retrieval-stage.ts:226, :303, :343` and 16 sites in `write-pipeline-orchestrator.ts` | The corpus is currently de-duplicated by page number across every author. The unique id already exists and already lands on `chunk.chunkId` |
| P15 | Stop mutating retrieval output; clone on cache set and get; carry `trimmedContent` separately from an immutable `sourceText` | `smart-retrieval-layer.ts:303, :1430`; `retrieval-stage.ts:305, :319, :346` | **Prerequisite for any offset-based record.** Claim offsets into mutable text are meaningless |

### 2.3 Clause addressing

> **Revised 2026-07-29.** P16 was previously described as "the gate for the entire programme." It is not. Live verification established that archon-cli already resolves quotations to a sub-span page, a narrowed bbox and a Bekker locator (§3.1a). P16 remains necessary for the *hand-authored analyses* — the prose in `corpus/index` — but the *sources* are already addressable. P19 below is now the cheapest and highest-value item in this section.

| # | Change | Location | Why |
|---|---|---|---|
| **P19** | **Expose the offsets archon already computes.** Add `char_start`/`char_end` to `QuoteFragment`, populate from `local_span_in_chunk`'s `(lo, hi)` and `find_subslice`'s `(a, b)`, and emit them in both JSON writers | `archon-cli crates/archon-docs/src/quote_verify.rs:33-46, :169-176, :296-310`; `src/command/docs.rs:150-160`; `src/command/evidence.rs:568` | The offsets are computed, used to narrow the page and box, then discarded for want of a field. **This is the entire remaining gap to clause-level addressing.** Two struct fields and two emitters |
| **P20** | **Gate on `match_kind == "exact"`, never on `found`** | `quote_verify.rs:20` (`REPORT_FLOOR = 0.60`) | A fabricated quotation returns `found: true` with fuzzy hits on unrelated books. Verified against the real ped-sec-29 string |
| **P21** | **Record the archon `document_id` on every source record** | this plan, §3.3 SOURCE | `vle-05` did this (`archon doc-4caaf4dc`) and it is the only reason its provenance survived the source PDF going missing from `corpus/` (§14) |
| P16 | Thread an offset cursor `(path, line, char)` through all five parsers and every call site; emit `{id, source_path, heading_path, line_start, line_end, char_start, char_end}` on every record | `compile-corpus-index.py:195-1025` | The parsers discard offsets in the first statement of every function (`:244`, `:326`, `:533`, `:577`, `:679`, `:701`). Still required for the hand-authored prose layer, but no longer blocking |
| P17 | `extra` passthrough for unrecognised keys at every emit site | `:344`, `:756-767`, `:1165-1174` | The compiler demonstrably parses Rickert's tension structure and Aristotle's 14 numbered Key Positions with Bekker loci, then throws them away for want of a slot. This one change would have made the whole bug class visible on day one |
| P18 | Invert the source of truth: read the **12 existing `*-ontology.json` files**; markdown becomes rendering; a missing JSON is an error | `:1196-1227` | The string `ontology.json` appears nowhere in 1,412 lines while twelve structured twins sit in the same directories. *Heidegger and Rhetoric*'s is 56,912 bytes with `canonical_nodes`, `contributors`, `cross_pipeline_links`, `contested_concepts` and `tension_summary` — none recoverable from the scrape |

Gate P: `--strict` exits non-zero on a corrupted fixture · the golden-file test passes · two consecutive runs are byte-identical excluding `builtAt` · every discard site emits a counted warning · `npm run typecheck` is green in CI · every record carries a span.

---

## 3. The record model

Five principles, then the records.

1. The CLAIM is the atom. A source is a container of claims. Prose is a rendering of records, never an input constraint.
2. The CLAUSE is a separate, independently identified record. One clause may ground many claims; one claim may span several clauses. Nesting the span inside the claim, as every current entry does, makes reuse impossible.
3. Address and text are separable. The address is always stored; the text's storage is universal and its display is rights-tiered. This dissolves the conflict between the 25-word ban and a clause-level index.
4. Ids are the only join key. Display strings never join.
5. Every enum is closed, stated inline in this plan, and validated. Free text lives in a sibling `*_note` field.

### 3.1 CLAUSE

| Field | Type | Justified by |
|---|---|---|
| `clause_id` | `<DOC>-CL<nnnnn>`, global | Wendt's 20 collisions and Boredom's 37 prove per-file counters fail |
| `doc_id` | `sha256(source_file)` + `edition_key` — never a path | In-Game addressed `/tmp`; Aristotle addressed "the PDF" and a superseded offset poisoned 33 of 34 records |
| `text_layer_id` | `{tool, tool_version, exact_command, flags, text_sha256}` | Two extractions of one PDF give different offsets. In-Game's 995 anchors died for want of this one field |
| `char_start`, `char_end` | int, into that text layer | Net-new **in `corpus/index`** — but see §3.1a: archon computes these internally today and discards them. This is the single structural addition that makes the corpus clause-level |
| `sentence_index` | int | Net-new; the graceful-degradation target when char offsets are unstable |
| `line_start`, `line_end` | int | Already in use and cheaply recoverable: In-Game 995 refs; Dissertation anchors 982 of 982 by line |
| `page_pdf`, `page_printed` | int, both, always | Generalises the double-locus rule the Wendt plan already applies at 307 of 307 |
| `citation_address` | typed union (§5) | Aristotle's `bekker-index.json` proves an edition-independent address must coexist with a rendering-specific one |
| `quote` | verbatim clause text | The 235 Dissertation cached verbatims are the only place a claim and its grounding words are both present and linked |
| `quote_sha256`, `quote_word_count` | | The hash is the address that survives re-extraction; the count drives display policy |
| `normalized_quote` | NFC, ligature-repaired, whitespace-collapsed | `Wohnhulle`/`Wohnhülle`; `difﬁ culty`; four German orthographies inside one entry |
| `rights_tier` | `own-work \| public-domain \| licensed \| third-party-copyright` | The uniform assumption suppressed clauses in Equiano 1789, Radcliffe 1794, Austen 1811, Darwin 1872 and all of Aristotle |
| `redact_on_render` | bool | Separates storage from display; retires the practice of truncating definitions to exactly 24 words to clear a ceiling |
| `bbox` | `[x0,y0,x1,y1]` or null | `archon evidence find --mode exact` already returns it; 45+ `bbox ✓` ticks discarded the coordinates |
| `extraction_probe` | `{ligature_ok, diacritic_ok, words_per_page}` | 13 encoding defects; the corrupted Uexküll orthography is the one that reaches runtime |

### 3.1a The clause layer mostly exists already — in archon-cli

Verified live 2026-07-29 against `/home/dalton/projects/archon-cli/.archon/archon-data.db` (987 MB, 224 documents) with binary `archon 1.3.11 (7b44c665)`. This materially reduces the cost of §3.1 and should be read before implementing it.

`archon docs verify-quote <quote> --json` already returns, for a named quotation: an exact-vs-fuzzy verdict, a similarity score, the matched `source_span`, a **sub-span-resolved page**, a **sub-span-narrowed bbox** with `coord_space`, and a **`FragmentLocator`** whose `kind` is `Bekker` or `PageNumber`.

Three measured results:

| Test | Result |
|---|---|
| `"enabling collaborative team viewing"` | `exact`, sim 1.000, **p.4** (narrowed from the chunk's pp.4–6), bbox height **188pt** (narrowed from 642pt), span returned as 36 chars |
| `"the soul is in a way all existing things"` | `exact`, sim 1.000, **p.48**, bbox height **41pt** — roughly two lines — and **`locator = Bekker:431b1`** |
| `"sense of being in the place"` *(the ped-sec-29 fabrication)* | **no exact match.** Only fuzzy hits at sim 0.741 and 0.704, both on unrelated books (Sorabji; Heidegger *BT* translator's note) |

Consequences for this plan:

- **The `bekker` locator subtype in §5 is already implemented**, read off each page's running head at ingestion. Aristotle's 101-of-188 wrong bekker-index page numbers should be reconciled against these observed locators rather than recomputed from an offset.
- **`char_start`/`char_end` are computed and then thrown away.** `find_fragment_bboxes` (`crates/archon-docs/src/quote_verify.rs:169-176`) computes `(a, b)` in document-concatenation byte space via `find_subslice`, and `local_span_in_chunk` (`:296-310`) derives the chunk-local `(lo, hi)`. Both are used to narrow the page and the bbox, then discarded, because `QuoteFragment` (`:33-46`) has no field for them. **Adding two fields to that struct and to the two JSON emitters is the entire remaining gap to clause-level addressing.** It is the same failure pattern as the index compiler: the structure is parsed and dropped for want of a slot.
- **Gate on `match_kind == "exact"`, never on `found`.** `REPORT_FLOOR = 0.60` (`:20`) means a fabricated quotation returns `found: true` with fuzzy hits on unrelated books, as test three shows. This is the machine check that would have caught the VR Pedagogy fabrication, and it is worthless if it keys on the wrong field.
- **The `bbox ✓` transcription was avoidable.** `src/command/evidence.rs:487-497` prints the literal string `" · bbox ✓"`; `provenance_json` at `:568` emits the coordinates. The 49 ticks in `corpus/index` came from reading the pretty output instead of `--json`.
- **`evidence find` is not the verification path.** `crates/archon-evidence/src/lib.rs:361` re-anchors each retrieved chunk against its own content, so its provenance is trivially exact and its bbox is chunk-wide. Use `docs verify-quote` / `locate_quote` for any fidelity claim.

Field-by-field, archon supplies `doc_id`, `page_pdf`, `page_printed`, `citation_address`, `quote`, `bbox`, `coord_space`, and the match verdict. This plan must still add `rights_tier`, `redact_on_render`, `sentence_index`, the line range, and `extraction_probe` — and must land the two-field archon change above.

### 3.2 CLAIM

Field list, each justified by the entry that proves it earns its place. Required fields are marked ●.

| Field | Type / enum | Proven by |
|---|---|---|
| ● `claim_id` | `<ENTRY>-<UNIT>-C<nnnn>`, content-addressed `sha256(claim_text)[0:8]`, registered | Dissertation 982 records with zero collisions; BT 108 of 108 distinct; Veri(dis)similitude 157 distinct. Counter-proof: Wendt 91 id-less, 20 colliding |
| ● `entry_id`, `unit_id` | | Without them Wendt's per-file `C1` is meaningless |
| ● `claim_text` | ≤60 words, our paraphrase | Present in every claim-bearing entry under six competing key names; this fixes one |
| ● `clause_refs[]` | array of `clause_id` | Uncomfortable's 176 loci records already sit at or below clause level and are referenced by several positions each |
| ● `claim_kind` | `assertion \| definition \| textual-report \| interpretation \| premise \| conclusion \| methodological \| programmatic \| quotation \| contrast \| open-question \| negative` | Dissertation's `claim_type` is populated 982 of 982 — the facet is wanted — with **378 distinct values**, so it must be closed. `negative` is forced by the discarded "Not treated:" content |
| ● `scope` | `book-thesis \| chapter-thesis \| section-thesis \| unit-thesis \| local-support \| transitional` | BT's `status` column, the only place argumentative altitude is recorded, 94% controlled |
| ● `stance` | §4 | 162 free values, 195 nulls, 108 hapax in Boredom |
| ● `support_tier` | 8 values, adopted verbatim, §4 | 982 records. **This field is "every weakness"** |
| ● `evidence_type` | §4 | Uexküll's `Evidence type` column, 107 of 107 — the only place that separates what kind of evidence from how strong |
| `strength_rationale` | free text, separate field | Uexküll glued rationale to enum with an em-dash, producing ~100 values from a 3-value vocabulary |
| ● `provenance` | §4 enum + registry-resolved author slot | 2,761 `FE` + 1,323 `P/anticipatory-application` + 1,196 `burke-direct` + 85 distinct `FAITHFUL-` keys in use |
| ● `locus[]` | array of typed locator objects, min 1, never a string | As a free string it produced 17,287 cells in 10+ formats, 961 with no digit at all |
| `verbatim_ref` | `clause_id` + `insertion_anchor` | Dissertation's `insertion_anchor`, present on 235 of 235 and the corpus's only content-addressed pointer that still resolves |
| `premises[]` | ordered `{premise_index, premise_text, ref}` | BCAP records enumerated premises with an explicit conclusion step; BT carries premises 108 of 108. Both encode them as one prose cell, which is why nothing can traverse them |
| `supports[]`, `supported_by[]` | arrays of `claim_id` | Dissertation puts 76% of 982 claims into an explicit support graph with 841 typed edges. This is "every point of connection" |
| `contests[]`, `contested_by[]` | `claim_id` or `interlocutor_id` | Uncomfortable positions carry `contested_by`; BT carries 84 explicit claim-to-tension back-references |
| `tension_ids[]` | array | Second half of "every weakness" |
| `cites_primary[]`, `cites_secondary[]`, `implicit_citations_needed[]` | `{locus, tier, rationale}` | Dissertation populates all three 982 of 982. **The third names the citation the prose is missing** — it is what makes the index an instrument rather than a record |
| `interlocutors[]` | `{interlocutor_id, role, locus}`, role ∈ `anchor \| corroborating \| contested \| superseded \| background \| methodological \| definitional` | Uncomfortable carries `role` on all 176 loci records |
| `coined_terms[]` | array | Dissertation `ct` plus its canonical-definition-site index — lets the index police the project's own vocabulary |
| `flag_present`, `flag_text` | bool + the quoted hedge | Pairing them makes T3 auditable rather than asserted |
| `disposition` | `keep-verbatim \| re-ground \| enrich \| supersede \| drop` | Veri(dis)similitude, 157 of 157 populated. The only forward-looking field in the corpus |
| `analytic_anchor[]` | RODA enum: `A0-horizon, A1-perception, A2-phantasma, A3-doxa/emotion, A4-action/hexis, A4→A0′, union(R1–R7), recalcitrance, rupture, hinge, VR↔2D, framing` | Veri(dis)similitude: 12 values, ~240 attachments over 157 rows; also the RODA-locus column in every RDR2 beat-map. The corpus-wide generalisation of the concordance idea |
| `volatility` | `{is_volatile, depends_on, resolved_at, resolution_note}` | Veri(dis)similitude's `[V:…]` flags with in-place resolution stamps. Turns a vocabulary change into a work queue instead of silent rot |
| `remediation` | `{action, corpus_index_candidates[], chroma_candidates[], external_query, effort}` | Dissertation `rem`, 982 of 982, with real routing values |
| `use_scope` | `index-only \| citable-pending-<gate> \| citable` | Consent modelled per record rather than as an entry-wide content ceiling |
| ● `derivation` | `agent-read \| self-authored \| inferred \| script-derived` | The template authorises orchestrator self-authoring with no marker; no record survives of which units were agent-built |
| `confidence`, `needs_human_review` | `high/medium/low`, bool | `****** UNVERIFIED:` is the de-facto review flag with no field to live in |
| ● `build_provenance` | `{agent_id, model, retries, built_at, plan_sha}` | 26 defects trace to unrecoverable build history |
| ● `schema_version` | string | Only Dissertation stamps one today |

### 3.3 EDGE, TENSION, TERM, SOURCE

**EDGE** — one canonical record, one physical format at both per-source and aggregate level:
`{edge_id, entry_id, subject_id, relation (registry-resolved), object_id, locator[] (a set), provenance, support_tier, deriving_unit, note}`.
Endpoints must be resolvable ids from declared namespaces; any unresolvable endpoint fails the build. Four sibling clusters shipped four headers and 47 dialects exist corpus-wide, so the header line is given verbatim in the plan and gated on exact equality after BOM and CRLF normalisation.

**TENSION** — one schema subsuming all eight shapes on disk:
`{tension_id, entry_id, endpoint_a{node_id,label}, endpoint_b{node_id,label}, relation, directed, evidence_locus_a, evidence_locus_b, description, unit_ids[], claim_ids[]}`.
It must absorb `node_a/node_b`, `nodeA/nodeB/type`, `wendt_position/against`, `pole_A/pole_B`, `tension_id/label/supporting_units`, `pentad_terms_involved`, and the FCM `locus_a/locus_b` variant. Four of eleven files currently yield zero, silently; eight further registered entries have no tension file at all and the loop has no `else` branch.

The cause is precisely located, and it is not the template — which does not mention `tension-edges.json` at all. Four separate per-book plans each specified the file by target **count** and never by key name: `in-game-calleja-2011-analysis.md:211` ("target 10–14"), `grammar-of-motives-burke-1945-analysis.md:255` ("target 14–18"), `uncomfortable-situations-2017-analysis.md:199, :260` ("target ≥8"), and `wendt-design-for-dasein-analysis.md:44, :74`. Each executing agent then invented a shape. This is the strongest single argument for §3's principle that every record type ships a JSON Schema file, not a count.

**TERM** — `{term_id, canonical, variants[], language, transliteration, first_locus, definition_claim_id}`. Admission to the global greedy-match list is gated (§4.5).

**SOURCE** — `{source_id, doc_id, sha256, edition_key, bibliography{author,title,year,venue,pages,doi}, verified_bibliography, rights_tier, text_layer_id, page_offset_map, text_quality, entry_profile}`.

---

## 4. Controlled vocabularies

Derived by union-and-dedup from actual use, not invented.

### 4.1 `provenance`

Observed corpus-wide with counts: `FE` 2,761 · `P/anticipatory-application` 1,323 · `burke-direct` 1,196 · bare `anticipatory-application` 524 · `INTERP-high` 380 · `INTERP-low` 368 · `calleja-direct` 180 · `FAITHFUL-<author>` across 85 distinct keys · bracketed variants totalling 631.

Normalisations: merge `INTERP-med` with `INTERP-medium`; fold bare `anticipatory-application` into `P/anticipatory-application`; strip brackets; resolve `FAITHFUL-<author>` against a per-entry interlocutor registry, since the free-surname convention has already produced `FAITHFUL-B`, `FAITHFUL-C`, `FAITHFUL-DB`, `FAITHFUL-O` and doubled forms.

Closed set: `FE | FE-U | FE-STUDENT | FE-TEACHER | FAITHFUL:<author_key> | P/anticipatory-application | INTERP-low | INTERP-med | INTERP-high | burke-direct | calleja-direct`.

### 4.2 `support_tier`

Adopted verbatim from the dissertation analysis pipeline, the only closed and fully populated tier vocabulary in the corpus. Observed over 982 records: T3 interpretive-but-flagged 477 · T1 textually-confirmed 277 · T2 textually-supported 78 · T5 under-supported 71 · T4 interpretive-but-unflagged 41 · T7 overreach 22 · T6 unsupported 12 · T8 secondary-needed 4.

Migration crosswalk: Uexküll `Strong` → T1/T2, `Moderate` → T3/T5, `Weak` → T6; BCAP "Explicitly stated" → T1, `[INTERP-high]` → T3; Veri(dis)similitude tier 1 → T1, tier 2 → T3.

### 4.3 `stance`

`asserts | defines | classifies | reports | extends | refines | qualifies | concedes | contests | refutes | restates | synthesizes | concludes | self-critiques | defers`

One bug to design out: Boredom carries `stance: "FE"` twenty-two times. `stance` and `provenance` are separate required fields with disjoint enums, and the validator rejects cross-contamination. `null` is illegal.

### 4.4 `evidence_type`

Collapsed from Uexküll's 105 distinct values: `textual-explicit | textual-inferred | philosophical-argument | empirical-experiment | empirical-observation | comparative | analogical | diagrammatic | statistical | anecdotal | authority-citation | methodological-principle`

### 4.5 `relation` and the canonical-term gate

`relation` is a versioned global registry file, seeded from the 645 observed values, with a reserved core that may not be renamed and an `other` escape requiring `relation_raw` plus a review flag. Entries extend it only by adding a subtype declaring its parent, written back in the same commit.

A term enters the global greedy-match list only if it is declared in a per-entry terms file, is above a minimum length, and is not a bare common English word on a stoplist. The full diff of terms an entry adds is printed for sign-off. The current list holds 1,722 entries including whole sentences and the bare words `technological`, `control` and `Presence`.

---

## 5. The locator model

A locator is a typed object, never a string.

| `locator_kind` | Fields | Precision | Proven by |
|---|---|---|---|
| `char-span` | `text_layer_id, char_start, char_end` | clause | Sandbox achieves 93.0% (4,615/4,961); archon computes the same offsets today and discards them — see P19 |
| `bbox` | `doc_id, page_pdf, x0,y0,x1,y1` | clause | **Implemented.** `archon docs verify-quote --json` returns a sub-span-narrowed box with `coord_space` — measured at 41pt height (~2 lines) for a 40-character quotation |
| `bekker` | `work, book, chapter, bekker_start, bekker_end` | clause | **Implemented.** Archon's `FragmentLocator {kind: "Bekker", value, bbox}` is read off each page's running head at ingestion — measured returning `Bekker:431b1`. This is also the fix for the bekker-index's 101-of-188 wrong pages: reconcile against observed locators rather than recomputing an offset |
| `timestamp` | `media_id, start_ms, end_ms, frame_id` | sub-clause | RDR2 Playthrough: 529 timestamps, 1,040 frame ids |
| `line-range` | `text_layer_id, line_start, line_end` | near-clause | In-Game 995; Dissertation 982 of 982 |
| `heidegger-h` | `h_page` | paragraph | `H.96`, `H.95–101` |
| `section` | `section_ref` | paragraph | `§21`, `§9b-β` |
| `cell` | `subject, condition, item` | record | VLE and Boredom Experiment respondent×item keys |
| `page` | `page_printed, page_pdf` | coarsest permitted | |

Degradation rule: every claim carries at least one locator. `char-span` is required wherever the source has an extractable text layer. Degradation to a coarser kind requires an explicit `degradation_reason` from `ocr-only | scanned-image | no-text-layer | rights-withheld-span | media-source`, and the entry's gate report publishes the span-coverage rate against a floor of 0.90. A `page`-only locator with no `degradation_reason` is a validation failure. Every locator resolves through the source's declared `page_offset_map`, and at least five sampled loci per source must round-trip by exact string match.

---

## 6. Entry profiles

Declared before building, recorded in the manifest, and used to select gate thresholds. A two-source rhetoric pair, a four-source theory cluster and a 92 GB instrumented dataset all converged on the same seven-to-ten-node ontology-only shape, which is what a single profile produces.

| Profile | Applies to | Unit | Notes |
|---|---|---|---|
| `MONOGRAPH` | Books, edited volumes | one per chapter | Full gates |
| `ARTICLE` | Journal articles, chapters | one per section, or single-unit with section structure | Relational apparatus lives at group level |
| `SMALL-PAIR` | N ≤ 3 sources | per source | Group gates emit `N/A-by-construction` |
| `PRIMARY-DATASET` | Instrumented studies | channel/cohort | Needs a DATASET record type; findings live in the analysing entry, not duplicated |
| `OWN-PROSE` | The user's own writing | section | `rights_tier: own-work`; no redaction |
| `ANALYSIS-ARTIFACT` | Playthroughs, prior theses, method documents | beat/frame/version | Registered and retrievable — today D4 promises this and it is false for both members |

### 6.4 The GROUP layer

Three gates genuinely collapse at N=1 and only these three: documented debates, the intra-cluster citation network, and the scholarly-evolution arc. Verified against the gold cluster — 12 of 12 Phantasia and 11 of 11 Boredom debate axes are multi-unit, minimum three units each. They move to an optional GROUP layer with `N/A-by-construction` semantics, and skipping is a pass.

The concordance, contested readings, concept extraction and the edge floor do **not** collapse and stay at entry level. The prior report's claim that every numeric gate is cross-unit is overstated by roughly half; the ruling that articles get standalone entries stands on firmer ground than that report allowed.

---

## 7. The pipeline

### Phase 0 — Source preparation

Derive the source inventory from disk: `md5sum`, `pdfinfo`, first-page title/author/year/venue. Diff it against any plan-supplied table and report phantoms and extras as blocking findings before any unit is assigned. The Boredom build's plan asserted a nonexistent "Standish 2015" that was a mislabelled duplicate, reversed a byline, and omitted the two files that were the sole grounding for its own debate axis.

Every factual assertion the plan makes about a file carries its verification command and output inline, or is marked UNVERIFIED and assigned to this phase.

Source admissibility: text-layer sanity (distinct per-page text hashes, an extracted-words-per-page floor), a ligature-integrity probe for the pypdfium2 fi/ff/fl dropout, a diacritic probe for the source's language, and citation completeness. Record `text_quality` and **quarantine** failures with a remediation task rather than authoring around them. One current entry shipped with identical `text_hash` on all eleven pages and all verbatims UNVERIFIED.

Declare `rights_tier` per source. Declare the entry profile. Reserve the entry's id prefix in a committed registry as step zero.

Commit the normalized full text as an immutable entry artifact at `<entry>/_source/<source_id>.txt` plus a sidecar recording extractor, version, exact command, flags, source and text hashes, and the page-offset map. Scratchpad destinations are forbidden — the current template specifies one, observes that it does not persist, and specifies it anyway.

Locator calibration is mandatory and precedes extraction: sample at least five pages spread across the document, record `(page_pdf, page_printed)` pairs, assert the mapping is affine and constant, check monotonicity, and record a piecewise map when it is not. Aristotle has 33 of 34 records wrong by up to 47 pages and 101 of 188 Bekker loci off by more than two; Rickert declares an offset of 20 that drifts to 15.

A correction worth recording, because it changes the fix. `plans/aristotle-corpus-analysis.md:317-345` already defines a "Phase 0.5: PDF Offset Validation" requiring at least two Bekker landmarks per work, three for major works, with mid-text and late-text landmarks explicitly "to confirm offset is uniform throughout" and non-uniform offsets flagged. At least eight plans carry comparable requirements. The Aristotle and Rickert defects are therefore **plan-compliance failures, not specification gaps** — the instruction existed and no machine check enforced it. That is an argument for §8, not for more prose in §7.

### Phase 1 — Registration

Registration happens **here**, not at the end. A stub entry registers on day one and grows. Eight of 27 entries are unregistered precisely because registration was the terminal step, leaving 685 files invisible.

The entry declares itself in a committed `entry.json` at a conventional path — `{entry_id, profile, adapter, schema_version, expected_record_counts}` — and the loader discovers entries by glob. The hand-edited `TEXT_DIRS` dict is deleted. Under a ~265-single-source-entry direction it would otherwise need 265 manual edits against a demonstrated 30% forget rate.

Mandatory bibliographic verification against the title page and DOI or copyright line, recording the version-of-record year. Gate: every unit carries `verified_bibliography: true`.

### Phase 2 — Extraction

One agent per source. Each agent receives the text-artifact path, the id/slug/profile/depth, the closed vocabularies, the density floor, the anchor id list, the provenance enum, and one exemplar that is itself schema-valid and reachable.

Each agent emits records, not prose: CLAUSE records for every span it cites, CLAIM records at the target density, EDGE records with resolvable endpoints, TENSION records, TERM records. The unit `.md` is demoted to an optional rendering **generated** from records by committed script.

Every record carries `derivation`. Orchestrator self-authoring of a unit it has not read is forbidden; the current template explicitly authorises it and no record survives of which units were invented.

Conformance is checked immediately on agent return, not at the end: schema-validate, assert record floors, assert enum membership, assert every `quote_id` verifies, assert no placeholder strings. Failures are re-dispatched to a fresh agent with the source.

### Phase 3 — Aggregation

All aggregation is performed by a committed, re-runnable script, never by a model. Model-authored synthesis operates over the script's output, sharded by axis with a declared merge order. The aggregation is re-run from scratch at the end and byte-compared to the committed artifact.

Never dedupe on content. The global store is a concatenation keyed on `edge_id`; near-duplicate detection produces a report a human resolves. Gate: `count(global) == Σ count(per-unit)` as exact equality. The current "concat + dedup" instruction destroyed 18 locus-distinct rows in one entry and 2 note-distinct rows in another, both from the same sentence.

The concordance and every matrix is a generated view over claim records, never authored and never join-built. Every cell-source assertion resolves to exactly one `claim_id` and carries page or span, direction, effect size or null, and provenance. In one entry 316 of 348 assertions are unbacked.

The manifest is regenerated from disk at the end of every phase, with the hand-authored table kept as `declared` beside a script-produced `discovered` block. Gate: `declared == discovered`, both directions, exact. Count mismatch is the single largest defect class at 66 instances.

### Phase 4 — Verification

An independent second-reader pass on a stated sample fraction with a stated pass threshold, performed by a **different agent than the author**. Today the producer and the judge are the same agent, and every gate verdict that exists is embedded in the artifact it judges.

Quotation is machine-verified, not length-limited. Store `{quote_id, source_doc, char_start, char_end, exact_text, sha256}`; interpolate quotes into prose only by `quote_id`; gate byte equality against the committed source on every build. Forbid the `FE` tag on any sentence containing a quoted span lacking a verified `quote_id`. Ban quotation marks in hand-typed prose. This is what catches the six-word fabrication that sat inside the twelve-word allowance, tagged as the source's own claim, and passed all fourteen current gates.

### Phase 5 — Wiring

Every phase ends with records reaching runtime, and that number strictly increases. New record types land alongside the existing compiled index before any storage migration.

---

## 8. Gates

Every gate is a named executable with a numeric threshold and an exit code, collected in a committed per-entry gate script. **A gate whose executable is missing FAILS; it does not pass by narration.** Three current gates name a verbatim detector that does not exist.

Checkers this plan must ship before authoring begins: `check-schema.py` · `check-ids.py` · `check-loci.py` · `check-projection.py` · `check-density.py` · `check-coverage.py` · `check-registration.py` · `check-quotes.py` · `check-lemmas.py` · `check-mermaid.sh` · `check-debates.py` · `check-reachability.py` · `emit-gates.py`.

`_synthesis/gates.json` and `metrics.json` are mandatory per entry, written by the checker and never by an authoring agent: `{gate_id, scope, statement, threshold_expr, threshold_value, measured, verdict, checker, checker_version, measured_at, input_sha256, evidence_path}` plus an aggregate exit code. Two of 27 entries currently have any gate report.

| Gate | Threshold | Meaningful at N=1 |
|---|---|---|
| Schema validity | 1.00 | yes |
| Id uniqueness, cross-entry collision report | 0 duplicates | yes |
| Locator resolution | 1.00, ≥5 round-trip by exact string match | yes |
| Span coverage (`char-span` present) | ≥ 0.90 | yes |
| **Quote verification** — every quotation resolves via `archon docs verify-quote --json` with **`match_kind == "exact"`**; `found` is not sufficient (`REPORT_FLOOR = 0.60` lets fabrications through) | 1.00 | yes |
| Enum conformance | 1.00 | yes |
| Referential integrity (edge endpoints, claim refs) | 0 dangling | yes |
| Density | 15–35 records per 1,000 source words, band by profile | yes |
| Distribution | no unit below 50% of the entry median claims/page | yes |
| Section coverage | `sections_with_≥1_claim / total_sections`, floor by profile | yes |
| Unbacked assertions in generated views | 0 | yes |
| **Reachability** | `reachable_records / authored_records ≥ 0.95` | yes |
| Per-layer non-zero contribution | `compiled_count[layer][entry] > 0` | yes |
| Registration contract test | compiled name string-equals authored heading; `canonicalTerms` diff signed off | yes |
| Self-authored fraction | below a declared ceiling | yes |
| Documented debates | GROUP layer | `N/A-by-construction` |
| Intra-cluster citation network | GROUP layer | `N/A-by-construction` |
| Scholarly-evolution arc | GROUP layer | `N/A-by-construction` |

Three rules that make these bite. Never write a derived constant into a gate — every threshold is an expression over a machine-read value, since one plan froze N=23 while the manifest said 34. Replace "compiler runs clean" with validate-then-load that exits non-zero, defining clean as `exit 0 AND discarded == 0`. Keep a required "Gates NOT fully met, reported honestly" section, which is the only reason one entry's shortfall is knowable at all.

Reachability deserves its own note. Boredom Secondary sits at 2.3%, VR Pedagogy at about 1%, and eight of nine Boredom Experiment files at 0%. No artifact may ship at 0% reachability without a signed waiver naming the future loader. For every commissioned artifact, name its reader — file and function — on the same line. Twelve synthesis artifacts are commissioned today and one is wired.

---

## 9. Orchestration

G0 (spec sign-off) and G1 (pre-commit review) are preserved with the no-commit rule and mandatory timestamped backups. What changes is what G1 is shown: `gates.json`, the per-layer compiled-contribution delta, a **checker-selected random sample** of k records with their loci actually opened and resolved, and the unresolved-debt list. G1 currently inspects one author-chosen trio — 1.8% of a 55-unit build.

Every deferral is a typed record in `_audit/deferred.json` with an unblock condition and the exact files to rewrite on clear. Gate: fail any entry whose deferral references a dependency that now exists. Thirty-seven, twelve and three markers sat unresolved thirteen days after their blocker cleared, and a p=0.008 finding never entered the index.

A post-build corpus-wide consistency sweep is a gate: after any entry is created or renamed, grep the whole index for assertions about its prior state and fail on any hit. There are 22 live hits for one anchor and 12 for a superseded figure.

One plan per entry, versioned, with `governing_plan`, `plan_version` and `plan_sha` in the entry manifest. Supersession requires a banner and a fact-migration checklist enumerating every verified fact and its destination. Verified facts are entry content, not plan content, and are written into the entry the moment they are verified.

Budget reference points: $20 for 3,776 claims across 15 papers (~$1.33/paper, ~$0.005/claim); $0.30 per drafting run. A 27-entry claim-level pass is on the order of $40–80 for extraction plus harness runs.

---

## 10. Migration — the largest available jump, re-authoring nothing

This is part of the plan, not a sequel.

| Asset | Volume | Lift |
|---|---|---|
| `corpus/index/Dissertation/` | 982 claims, 100% line-anchored, 8-tier, 841 edges, 235 cached verbatims | Already schema-shaped — **register it** |
| `tmp/analysis-upgrade/.../claims.jsonl` | **4,961 claims, 93.0% with char spans**, 14,811 concept-mentions with `{bekker, chunk_id, char_start, char_end}` | **Promote out of `tmp/`** into `corpus/index/_atoms/<slug>/`. Note: with P19 landed, any claim can be re-anchored on demand, so these matter less as irreplaceable data and more as proof the extraction density works |
| **Every existing quotation in `corpus/index`** | 49 `bbox ✓` assertions · 235 Dissertation cached verbatims · 488 BCAP inline quotations · 1,725 Boredom quoted spans ≥40 chars · 1,230 BT quoted strings · 2,090 FCM quoted spans · the Part III OCR-only "ALL UNVERIFIED" candidates | **Re-anchor through `verify-quote`, gated on `match_kind == "exact"`.** Converts a decade of unverifiable quotation into either a span-anchored record or a named defect. This is step S0 |
| `Veri(dis)similitude/vds-claims-moves.md` | 157 rows, stable ids, tier, disposition enum, RODA anchors, volatility | Parse pipe table → JSONL |
| Aristotle | 973 Bekker claim bullets, 2,323 line-numbered loci | Bekker → clause-address subtype |
| Boredom Secondary | 2,924 sub-items, 2,012 of 2,258 already carrying a page locus | Normalise 42 shapes → 1 |
| VR Pedagogy | 233 structured vs **1,277 provenance-tagged prose assertions** | Back-extract the prose |
| FCM | 245 structured + ~1,100 locus-anchored prose claims + 2,090 quoted spans | Parse + back-extract |
| Being and Time | 108 markdown claim rows + 299 fenced-JSON edges + 84 claim↔tension back-refs | Parse |
| BCAP | 150 records with enumerated premises and explicit conclusions | Split premise cells |
| Uexküll | 107 rows `Claim \| Evidence type \| Strength \| Page ref` | Split enum from rationale |
| Uncomfortable Situations | 55 positions + **176 loci already at or below clause level** | Direct map |
| Wendt | 139 `{text, locus}` claim objects | Mint ids for 91, resolve 20 collisions |
| In-Game | 995 line anchors | **One deterministic re-extraction resurrects them** |
| RDR2 Playthrough | 1,040 frame ids + 529 timestamps + 1,326 bullets | Timestamp → clause-address subtype |
| 240 edge CSVs | 20,610 curated rows at 0% reachability | CSV adapter; promote `locus`, `book_page`, `page_anchor` to first-class fields |

---

## 11. Runtime contract

Open with a reachability contract derived by reading the compiler at execution time — a table of (path → reader function → runtime destination) — pasted into the gates report. The rule in one line: **content not in a reader-visible file does not exist.**

Today's complete reader set: `collect_ontology_nodes` (`:1217-1229`), `collect_tension_edges` (`:1253-1274`, requires `node_a`/`node_b`), `collect_cross_pipeline_hooks` (`:1234-1250`, **Aristotle directory only**), `build_canonical_terms` (`:1276-1305`), and `normalize-edges.py:36-41` (a hardcoded six-pipeline whitelist, one of which points outside `corpus/index`).

Make the index path injectable — deliverable number one, roughly 20 lines. Honour `CORPUS_INDEX_PATH` in `jsonl-loaders.ts:198-200` and stop ignoring `options.indexPath` in `corpus-index-provider.ts:73-77`. Without it no A/B of any index is runnable in the live tree.

Fix the retrieval contract before scaling records: two-stage retrieval where concepts select a candidate set and claims are retrieved within it, a per-source quota, length-normalised scoring, and a claim budget additive to the concept budget. A 4.3× index scale-up previously **regressed** quality 0.794 → 0.789 and dropped six named authors.

Land the measurement harness first, with a SHA-frozen prompt suite. Four index-sensitive metrics, not `qualityScore` (which moved 0.005 across a 4.3× index change): locator-resolution rate (baseline 3/20), claim-ledger fill (baseline 0 even in a 4,921-claim run), quote-verifiability, and source-coverage retention.

Run the paired arm that needs no new authoring: seven sources already have both representations — Caston 1995, Frede 1992, Nussbaum 1985, O'Gorman 2005, Papachristou 2013, White 1985 and Bowin 2017 — versus their sandbox equivalents. Twelve prompts × 2 arms × 3 seeds = 72 runs, about $22.

---

## 12. Sequencing

> **Re-sequenced 2026-07-29** against the §0.2 directives: archon-cli is the target, the index is completed and locked before ingestion is touched, and full re-ingestion plus full regeneration are accepted. Every phase must leave the system usable, because the dissertation continues in parallel.

### Phase A — Preserve, then unbreak (1–2 days, all reversible)

The only irreversible risk first, then the wiring.

| # | Work | Where | Exit |
|---|---|---|---|
| A1 | **Preserve the three irreplaceable assets — see §12.0** | incumbent + sandbox | The only losses this programme cannot regenerate are closed |
| A2 | **Transfer the full current index tree into archon** — see §12.1. Replace the stale fork; verify by manifest, not by eye | both | Archon holds today's entries, not a 13-day-old copy missing three of them |
| A2b | Add a production `ARCHON_INDEX_PATH` / `--corpus-index-root` reader (~30–60 lines) and a **staleness check** that compares the loaded artifact's `builtAt` against the authoring tree and warns | archon | Archon reads the 701-node artifact, and future drift is visible instead of silent |
| A3 | Log the four `.ok()` swallows on index load | archon | A missing or corrupt index is visible rather than silent |
| A4 | Refuse to emit a bridge when either author is `Unknown`; guard `targetLower.length > 0` | incumbent | Stops the prompt instructing fabrication of a non-existent author on most topics |
| A5 | Fix `ig-10-incorporation.json` (one character) | incumbent | The last unparseable JSON of 494 |

### 12.0 A1 — the three things that cannot be regenerated

Under §0.2.1 every ingested document, every claim record and every Cozo relation can be rebuilt. Three assets cannot, and all three are currently on one disk with no version history. This is the whole of A1 and it precedes everything.

**1. The hand-authored analytical entries.** `corpus/index/` — **1,522 files untracked and not gitignored** out of 1,759. This is the cross-author relational judgment the audit measured at roughly forty hours per good entry: debates, tensions, concordances, contested readings, interlocutor maps. No extraction pass reproduces it, and §0.2.2 makes preserving it the condition on which regeneration counts as an improvement. `git add corpus/index` plus a commit.

**2. The resolver gold set, mid-annotation.** `tmp/analysis-upgrade/production-sandbox/data/gold/` — the user is **halfway through hand-verifying and completing it**: 25 of 50 dev items, 20 of 20 holdout, against a 1,124-line `CONVENTIONS.md` and a 480 KB drift log. Roughly forty hours of annotation. The 79 snapshots under `production-sandbox/.backups/` cover `data/gold` only and sit **on the same volume**, so they protect against a bad edit and not against disk loss. Untracked. Preserve the whole tree, including the in-progress state, the conventions, the drift log, the protocols and the inspections — the partial annotations are only meaningful alongside the conventions that produced them.

**3. The extracted claim corpus.** `tmp/analysis-upgrade/production-sandbox/data/corpus/` — 4,961 claims across 24 `claims.jsonl` files, 93% span-anchored, plus 14,811 concept mentions and 552 bridge candidates. ~$20 of extraction, and the only clause-level addressing that exists anywhere in the system. Untracked, no off-machine copy. Note the two relative symlinks in that tree (`compiled-index.json`, `ontology-embeddings.jsonl`); archive the whole directory and do not use `tar -h`, which doubles it.

Get all three into git, and get at least one copy off this machine. Everything else in this plan is a redo; these are not.

### 12.1 The index transfer, A2 — one-way, verified, and it must not become a sync

Archon must hold the most up-to-date entries before any work starts there. A copy already exists at `archon-cli/index/` and it is the cautionary case: 1,730 tracked files, built 2026-07-16, **missing three entire entries** — Presence Theory (Foundations), Rhetoric of Interactivity and VR (Part III), Social Presence in Virtual Worlds (Part III), 25 files — with a `compiled-index.json` of 643,548 bytes / 670 nodes against the live 666,303 / 701. Nothing read it and nothing noticed. Its own commit message says it must be wiped before any upstream PR.

So the transfer is not "copy the folder again." Three conditions:

**Verify by manifest, not by eye.** Take a SHA-256 manifest of the source tree, copy, take a manifest of the destination, and diff them. The existing fork drifted precisely because nobody did this. Include the 1,522 untracked files — A1 puts them in git first, which is the other reason A1 comes before A2.

**One-way, with a declared owner at every moment.** Do not build a two-way sync; that is how the current fork happened. Until Phase C, `claudeflow-testing/corpus/index` is the authoring home and archon's copy is a read replica refreshed on demand. From Phase C onward, when entries are created in archon under the locked schema, **ownership moves to archon** and the claudeflow tree is frozen as reference. Write the ownership date into both trees so no future session has to guess.

**Make staleness loud.** A2b's check exists because a 13-day-old artifact silently routed archon's retrieval, curation and drafting. A read replica is acceptable; a *silently* stale one is not.

One genuine benefit worth recording: archon tracks 1,730 index files in git while claudeflow tracks 335 of 1,759. On version control alone archon is already the better home, which is an argument for the transfer independent of everything else.

### Phase B — Verification before generation (2–4 days)

Build the checker before building the thing it checks. This is also the fastest path to dissertation value.

| # | Work | Exit |
|---|---|---|
| B1 | Wire `archon-docs` + `archon-evidence` into `crates/archon-draft`; move the `verify.rs:88-101` gate to the engine boundary, not the TUI wrapper (~60–120 lines) | All five drafting entry points verify, not one of five |
| B2 | Gate on `match_kind == "exact"`; never on `found` (`REPORT_FLOOR = 0.60`) | A fabricated quotation fails rather than returning `found: true` |
| B3 | Expose `char_start`/`char_end` on `QuoteFragment` and both emitters (~10 lines) as plumbing for B1 | A quotation resolves to `{page, bbox, char_start, char_end, locator}` in one call |
| B4 | **Corruption-aware outcome classes.** Report `exact / drifted / store-corruption-suspected / not-found`, never a binary pass | A correctly-typed quotation that fails on a ligature-dropped store word is diagnosed, not accused |

B4 is not optional polish. With ligature corruption and OCR damage present in the store today, a binary checker will accuse correct quotations of being misquotations, and the user will learn to distrust it before it is ever right.

### Phase C — Schema, then integration (5–10 days)

| # | Work | Exit |
|---|---|---|
| C1 | Lock the CLAIM / CLAUSE / EDGE / TENSION / TERM / SOURCE record set as Cozo relations; ship JSON Schema files and one worked exemplar per type | Schema is a redo cost, not a door (§0.2.1) — but redo means re-extracting 226 documents, so design it once |
| C2 | State the **byte-versus-char convention** explicitly and put the conversion in exactly one place | `doc_chunk_blocks` names columns `char_*` while holding byte ranges; inheriting the name without the semantics mis-slices every Greek and German span |
| C3 | Import the sandbox: 4,961 claims, 93% span-anchored, Toulmin fields, faithfulness grades, 17 claim types, 5 stances, 14,811 concept mentions | The only clause-level addressing in the system stops living in `tmp/` |
| C4 | Import the already-claim-shaped entries: `Dissertation/` 982 line-anchored records with the 8-tier taxonomy, `Veri(dis)similitude` 157, Wendt 139 | ~6,200 claims addressable |
| C5 | **Import the relational apparatus** from all 27 entries — debates, tensions, concordances, contested readings, interlocutors | The irreplaceable layer survives regeneration. This is the row in §0.2.2 that decides whether the result is an improvement |

C5 is the part no extraction pass reproduces, and the part most at risk of being skipped because it is small in volume and large in value.

### Phase D — Lock the creation system (4–6 days)

| # | Work | Exit |
|---|---|---|
| D1 | Ship the checkers as executables with exit codes; `gates.json` written by the checker, never by an authoring agent | Zero gates satisfiable by narration, against 14 of 14 today |
| D2 | Separate producer from judge structurally | No gate verdict embedded in the artifact it judges |
| D3 | Post-recompile assertion: re-read the artifact and fail on any superseded claim | The gap the anchor repair exposed — "no loss on any axis" is not "no falsehood on any axis" |
| D4 | Author one entry end to end under the locked system, from the citation-priority queue | All gates green at N=1 |

### Phase E — Ingestion hardening (scoped after D)

Deferred by direction. What is already known and will need addressing: bbox coverage 68%; `doc_chunk_spatial` 11,311 rows against 17,824 chunks; live retrieval returning `pnractical`, `consiaered in 1tsely`, `Involvernent`; the recorded pypdfium2 ligature dropout described as citation-fatal and invisible to every existing check. **Archon's ingestion has never been audited** — every figure here is from spot measurement during the review, which is a thin basis and should be treated as such.

### Phase F — Re-ingest and regenerate

Explicitly sanctioned by §0.2. Full re-ingestion under the hardened pipeline, then regeneration of every entry under the locked creation system. The acceptance test is §0.2.2: every row of that table improved, with the relational layer intact.

**What the user can do after each phase:** after A, archon reads current analysis and the drafting prompt stops fabricating. After B, every quotation in the draft can be checked, with corruption distinguished from misquotation. After C, roughly 6,200 span-anchored claims are queryable. After D, new entries can be authored under gates that cannot be talked past. After F, the whole corpus is trustworthy.

---

## 13. Decisions

> **Updated 2026-07-29.** The §0.2 directives settle four of these. Struck items are recorded rather than deleted so the reasoning stays traceable.

**Settled by direction:**

- ~~Sandbox promotion~~ — **settled.** Phase C3 imports the 4,961 span-anchored claims into archon. The promote-or-defer question is closed.
- ~~Which store is authoritative~~ — **settled: archon-cli.** `claudeflow-testing/.archon` is empty and stays empty; the 987 MB Cozo store is the home.
- ~~Compiler disposition (replace or harden)~~ — **settled by implication.** With archon as the target and regeneration accepted, `compile-corpus-index.py` becomes a frozen legacy producer for the incumbent drafting path, not something to rebuild. It is maintained only enough to keep today's drafting honest (Phase A4, A5).
- ~~Migrate versus re-author~~ — **settled: both, split by layer.** Claim and clause records are regenerated natively (C3, C4, F); the relational apparatus is migrated (C5) because no extraction reproduces it.

**Still open, and now the only ones that block:**

### 13.1 Verbatim storage — blocks Phase C1

Two entries deliberately suppress verbatim text under a content-filter discipline, and the 25-word ban is applied uniformly to Aristotle, Radcliffe 1794, Equiano 1789 and the user's own MA thesis. A clause-level index needs the clause, and a verbatim checker needs the stored span to compare against.

Does the rights-tiered storage/display split in §3.1 replace the blanket ban — store the exact span always with a `rights_tier` and `redact_on_render`, and apply word ceilings only to rendered output?

This blocks C1 because `rights_tier` and `redact_on_render` are columns, and columns are a redo cost.

### 13.2 Density band — blocks Phase D1

15–35 records per 1,000 source words, calibrated from the two artifacts that already hit the target (`Dissertation/` at 1 per 58 words, `Veri(dis)similitude` at 1 per 59). That implies roughly 50–500 claims per article against today's ~7. Every gate threshold in D1 derives from this number, so it wants confirming before the checkers are written.

### 13.3 Group layer — blocks Phase D1

Only three gates genuinely collapse at N=1: documented debates, the intra-cluster citation network, and the scholarly-evolution arc. Confirm they move to an optional GROUP layer reporting `N/A-by-construction`, so a single-article entry can pass — which is what the standing ruling that articles get standalone entries requires.

### 13.4 Duplicate plan copies — housekeeping

`index-entry-creation-plan-CLAIM-LEVEL-2026-07-29.md` and `index-system-ADVERSARIAL-REVIEW-2026-07-29.md` exist in **both** `plans/` and `plans/index-overhaul-2026-07-29/`. Verified separate inodes, one link each, byte-identical as of 2026-07-29 21:00 — so they will diverge on the next edit of either. This folder is canonical per the user's relocation; the two at `plans/` root should be deleted. Not done, pending confirmation.

---

## 14. Data-integrity item surfaced by the 2026-07-29 verification

`vle-05`'s claim at `units/vle-05-scalable-vr-global-immersion.md:67` — `exact-1.00 (sim 1.00) · bbox ✓` — **is true**; it re-verifies today at similarity 1.0 with a real bbox. But its declared source, `corpus/virtual_learning_environments/King, Christine and Dalton Salvo - scalable-virtual-reality-…pdf`, resolves nowhere: the lowercase directory does not exist, `corpus/Virtual Learning Environments/` does exist and does not contain that file, and no file matching `*scalable-virtual*` is anywhere under `corpus/`. Archon ingested it on 2026-07-20 from a path that has since changed, and retains the full text, 14 pages, 21 chunks and 5 VLM image descriptions.

So the quotations are verifiable and the source file is missing from the corpus tree. Two actions: restore the PDF to `corpus/Virtual Learning Environments/`, and adopt vle-05's one genuinely good habit — it recorded `archon doc-4caaf4dc`, which is why this was recoverable at all. **Every source record must carry its archon `document_id`.**
