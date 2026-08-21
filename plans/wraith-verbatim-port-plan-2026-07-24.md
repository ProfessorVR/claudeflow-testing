# Wraith-Verbatim: Porting archon-cli Verbatim Sentence-Level Ingestion / Provenance / Verify into god-agent

**Plan date:** 2026-07-24
**Branch of record (dev):** `feat/wraith-retrieval` (build/test happens in a git-worktree sandbox off this branch)
**Target for eventual merge:** `main` (god-agent), WSL-only, after end-to-end verification
**Status:** DRAFT (hardened v2, folds red-team findings) for multi-round user review — nothing here is executed until the plan is signed off.

---

## 0. What changed in this hardened revision (red-team fold-in log)

The following material corrections were made to the prior draft in response to adversarial review. They are load-bearing; read them before the body.

- **[CRITICAL — hot-path miss]** The prior draft wired only the **ICP subsystem**, which is instantiated exclusively by `observability/icp-api-routes.ts` (an HTTP surface the user's drafting never calls). The live dissertation drafting path is `god-write`/`god-complete-section` → `universal-agent.ts:1323` `WritePipelineOrchestrator` → `CitationEnforcer` → `QuotationFidelityValidator` (fuzzy Levenshtein), with the FCDP 7-gate quote gate at `QualityGauntlet`'s `QuotationFidelityStage`. **The wiring target is now the live surface** (§3 Layer 3, new Phase 4A). ICP wiring is retained but demoted to secondary.
- **[HIGH — accuracy overpromise]** "byte-exact quote" is only true against the **stored CLEANED chunk text**, not the source PDF. The deliverable is renamed everywhere to **"exact substring of the stored cleaned corpus representation, page-attributed"** and the acceptance battery now includes real hyphenated/line-wrapped PDF quotes (§1, §2, §5, §8).
- **[HIGH — raw-fallback overclaim]** `raw_content` recovers **Marker-paragraph-level** text, is stored **only when it differs from cleaned** (`run_ingest_phase2.py:1756`), and `raw_sha256` falls back to `clean_sha256` when absent (`:1730-1733`). It does **not** yield PDF bytes. Corrected in §2/§5/§7.
- **[HIGH — oracle methodology]** Algorithm parity is now proven by a **unit-level Rust shim over shared identical input buffers**, not `archon docs verify-quote --doc` (which runs over archon's own differently-chunked corpus and would diverge legitimately). `verify-quote` is retained only as a coarse smoke check (§3, Phase 0/1).
- **[HIGH — sandbox isolation]** The "assert no writes to the live collection" option is **deleted**. A filesystem copy / separate persist dir on a scratch port is now **mandatory**, with a preflight that hard-fails if the sandbox Chroma path resolves to the authoritative `vector_db_1536` or the port is `:8001` (§4.2).
- **[HIGH — pdftotext escalation hidden cost]** Cross-extractor page-break re-derivation is **reclassified from "page-exact" to best-effort/advisory**, gated on an alignment-similarity threshold and a source-PDF-exists + sha-match precondition (§5.2).
- **[MEDIUM]** Reconstruction contract pinned (single canonical function, fixed ordering/delimiter/text-source); per-doc **contiguity/completeness** integrity check added to the handshake; **cross-chunk-boundary** quote semantics specified and added to the battery; gate now **asserts offset-consistency** (`getCleanText.slice(range)===quote`) as a hard criterion; acceptance gate **split** into an independently-mergeable CPU Tier-A gate and a GPU Tier-B gate (§3, §4.4, §5, §8).
- **[LOW]** §1/§8 now state plainly that **sentence-tight bbox does NOT ship in the CPU deliverable** and QuoteSpan bbox fields remain page-level until Tier-B.

---

## 1. Executive summary

### What
Port archon-cli's *verbatim sentence-level* capability into god-agent so that dissertation drafting produces **quotes that are an exact substring of the stored cleaned corpus text, on a known page, behind a real blocking verification gate**, with sentence-tight bounding-box (bbox) visual provenance available as a separately-gated GPU upgrade.

**Precise deliverable wording (honest contract).** The shipping (CPU) guarantee is: *the emitted quote is an exact byte substring of the stored **cleaned** chunk text (`clean_corpus_text` output — dehyphenated, line-joined, whitespace-collapsed), attributed to an exact page on single-page chunks and to a page range otherwise, and the draft is hard-blocked on any non-exact match.* This is **corpus-representation-exact, not PDF-source-verbatim.** See §5.2 for the transformation ledger and §5.4 for what a committee checking against the PDF will and will not see.

### Why
god-agent's current quote provenance is **reconstructed after generation** by fuzzy Levenshtein over 800–1200-token chunks (`quotation-fidelity-validator.ts`, dual threshold 0.95/0.90), the live FCDP quote gate (`QualityGauntlet` `QuotationFidelityStage`) passes on `score≥0.90 && unmatched==0`, and the ICP auto-verifier path is additionally **vacuous** (its `getCleanText` dependency is never wired, so it matches quotes against a self-referential join of the spans themselves). Citations are page-*range* + page-*level* bbox only. For a Greek/Bekker-heavy dissertation under Gross-tier citation rigor, fuzzy-verified quotes are the exact dilution the rigor standard is watching for.

### The surgical-port framing
god-agent **already has** every piece of heavy infrastructure archon uses — embedder (gte-Qwen2-1.5B 1536-D, `:8000`), vector store (ChromaDB `:8001`, `knowledge_chunks`, ~15,107 chunks), reranker (bge-reranker-v2-m3, `:8100`), and a `QuoteSpan` schema (`icp-types.ts:309`, 7-state `verification_status`). All reused **unchanged**.

What god-agent **lacks** is exactly the archon *algorithmic* layer: `normalize()` + UTF-8 offset map, exact/Sellers approx-substring `locate`, sentence segmentation + `trim_to_relevant_span`, a source-scoped exact-match verify gate, and the per-chunk byte→page/bbox satellites that make sub-span attribution possible.

**This port adds only that layer, and wires it into the LIVE drafting path.** No re-embedding, no vector migration, no service-topology change for Tier-A. The headline capability ships as a **pure-CPU backfill** over already-stored Chroma chunk text — matching archon's "no GPU reingest" posture. **Sentence-tight bbox is NOT part of the CPU deliverable**; QuoteSpan bbox fields remain page-level until the separately-gated Tier-B GPU reingest.

---

## 2. Current vs target (gap table)

| Capability | Current god-agent | archon-cli (source) | Target after port | Backfill or reingest? |
|---|---|---|---|---|
| Quote text fidelity | Fuzzy Levenshtein reconstruction after generation (`quotation-fidelity-validator.ts`, raw≥0.95 / norm≥0.95) | Byte-exact substring of **its own** stored chunk text | **Exact substring of god-agent's stored CLEANED chunk text** (not PDF bytes — see §5.2/§5.4) | **Backfill (no GPU)** |
| Normalization | ad-hoc; JS `.toLowerCase()`-style folding risk | `normalize()`/`fold_char`: smart quotes/dashes→ASCII, drop soft-hyphen/ZW/BOM, collapse ws, **ASCII-only** lowercase, record per-char orig **byte** offset | Faithful TS port with UTF-8 byte offsets | Backfill |
| Approx match when not exact | Levenshtein score only | Sellers approx-substring DP, `REPORT_FLOOR=0.60`, `Exact=1.0` | Ported Sellers DP | Backfill |
| Sentence segmentation at ingest | **None** (paragraph/multi-para only) | `sentence_spans` (terminator+ws, merge <4-word fragments) | Sentence spans cached per chunk | Backfill |
| Relevance trim | None | `trim_to_relevant_span`: content-word coverage, grow window ≤60 words, INVARIANT = exact byte substring | Ported `trim.ts` | Backfill |
| **Live verify gate (drafting path)** | **Fuzzy** — `QuotationFidelityStage` passes `score≥0.90 && unmatched==0`; `CitationEnforcer`/`inline-claim-validator` use fuzzy `QuotationFidelityValidator` | `verify_bank`: source-scoped exact gate `Exact\|NearVerbatim≥0.9\|Drift\|Missing\|WrongSource`; blocks on ANY non-exact | Byte-exact gate delegated into `QuotationFidelityValidator`; `Missing`/`WrongSource` = **hard block** in `QuotationFidelityStage` | Backfill |
| ICP verify gate (API-only path) | Vacuous — `getCleanText` never wired; self-referential substring | (as above) | Ported gate; wired `getCleanText` | Backfill |
| Page precision | Chunk `page_start..page_end` range only | Sub-span page-exact via `doc_chunk_page_breaks` | **Page-exact on single-page chunks; page-range otherwise** (interior multi-page = range unless Tier-B). Fraction TBD, see §5.5 | Backfill (single-page) / GPU (interior) |
| BBox precision | Page-level union per chunk, only ~160/696 docs (`_bbox_by_page`) | Sentence-tight `sub_span_bbox` | **Page-level only in CPU deliverable**; sentence-tight after Tier-B reingest | **Reingest (GPU)** |
| BBox for degraded docs | None (~536 docs, ~77%) | n/a | Text+page now; bbox only via full reingest | Reingest (GPU) |
| Per-block char→page/bbox satellites | **Absent** | CozoDB `doc_chunk_blocks` / `doc_chunk_page_breaks` / `doc_locators` | New satellite SQLite `.god-agent/verbatim.db` | Backfill (page_breaks/sentences) + reingest (blocks) |
| QuoteSpan population | chunk-local offsets + single `page_start` (`faceted-retrieval.ts:282`); bridge stub literal `'bridge-...'` + pre-set `auto_verified` (`icp-orchestrator.ts:403`) | n/a | Document-scoped offsets, sub-span page; bbox null/page-level until Tier-B | Backfill |
| Tamper-evidence / raw layer | `raw_sha256`/`clean_sha256` per chunk; `raw_content` stored **only when `raw_text != c.text`**, `raw_sha256` falls back to `clean_sha256` when absent | per-chunk `raw_sha256`+`commit_hash` → `chunks_root` | Reconcile sha at startup handshake. **NOTE: `raw_content` = Marker-paragraph text, NOT PDF bytes** (§5.2) | Backfill |

---

## 3. Chosen architecture + why

**Strategy: Native-TS quote_verify + CPU-backfill satellite (bbox-gated reingest), wired into the LIVE drafting quote surfaces.** No Rust service at runtime, no Python at query time. Three layers.

### Layer 1 — Pure-TS algorithm core (`src/god-agent/core/verbatim/`)
1:1 port of archon's algorithmic files with **zero DB coupling**, fully unit-testable:

- `normalize.ts` — port of `quote_verify.rs` `normalize`/`fold_char`. Produces `Normalized { chars, origByte }` where `origByte` is a **UTF-8 byte** offset (via `TextEncoder`), iterating by **code point** (`for...of`), folding **only A–Z** (ASCII lowercase, *not* `.toLowerCase()`), using **Unicode White_Space** (*not* `\s`). These three are the byte-parity gotchas that would otherwise silently corrupt every Greek/accented span.
- `locate.ts` — `find_subslice` (naive window match) + `approx_substring_similarity` (Sellers DP, `REPORT_FLOOR=0.60`, `Exact=1.0`) + `Reconstructed.build` + `local_span_in_chunk` (constant `orig_start` shift arithmetic).
- `trim.ts` — port of `quote_trim.rs`: `sentence_spans`, `merge_short` (<4 words → `MIN_SENTENCE_WORDS=4`), `trim_to_relevant_span` (content-word coverage, grow contiguous window ≤`MAX_QUOTE_WORDS=60`), `strip_leading_locator_line`. INVARIANT: output is always an exact byte substring of source.
- `gate.ts` — `verify.rs` `status_for`/`blocking`/`strip_quote_wrap`: `Exact | NearVerbatim(≥0.9) | Drift | Missing | WrongSource`; blocks on any non-exact. **`Missing`/`WrongSource` are HARD blocks, never warnings.** The gate additionally **asserts offset-consistency** (see §3 "gate offset contract") as a precondition for returning `Exact`.
- `spatial.ts` — `sub_span_bbox` (box-union over `BlockSpan[]`) + `sub_span_page` (greatest `page_break.offset ≤ local`). Pure arithmetic; **degrades gracefully** to chunk super-box + `page_start` when satellites are absent.

**Canonical reconstruction contract (pinned).** A single exported function `reconstructDoc(docId): { text, chunkOffsets }` is the ONLY producer of document-scoped text, used by BOTH the offset computer and `getCleanText`:
- **Ordering:** strictly numeric by chunk index parsed from `{doc_id}:{index:05d}`.
- **Text source:** the stored **cleaned** chunk body (Chroma `documents`), never `raw_content`.
- **Join delimiter:** pinned constant `RECON_JOIN`. **archon joins with `'\n'`; god-agent chunks have NO overlap**, so a quote straddling a boundary would otherwise have a delimiter injected where the PDF had a space/nothing → false `Missing`/`Drift` block or offset drift. Boundary semantics are therefore specified explicitly and cross-boundary quotes are in the acceptance battery (§4.4). The chosen delimiter and its consequence for boundary matching are locked here and asserted in Phase 4.
- `chunkOffsets` gives each chunk's start offset in the reconstructed string, so a chunk-local `page_break.offset` is converted to doc-scope via `local + chunkOffsets[i]` — never read as doc-scoped.

**Gate offset contract (hard).** For a QuoteSpan to receive `Exact`, the gate MUST verify `reconstructDoc(docId).text.slice(clean_text_range[0], clean_text_range[1]) === quoteText` byte-for-byte over the canonical coordinate space. Verification depends on the *emitted offsets*, not a free-floating substring search (this closes the `auto-verifier.ts:413`-vs-`runStageA` decoupling).

### Layer 2 — Satellite store (`src/god-agent/core/verbatim/span-store.ts`)
Thin `better-sqlite3` DAO (already a dep; idiom in `episode-store.ts`, `core/database/connection.ts`) over a **NEW** `.god-agent/verbatim.db`, mirroring archon's tables 1:1, keyed by Chroma `chunk_id`. A NEW file means backfill is purely additive — authoritative stores stay read-only.

**Why satellite SQLite, not Chroma metadata:** every retrieval pulls `include:['documents','metadatas','distances']` (`smart-retrieval-layer.ts:932/:1035`), so stuffing multi-KB span arrays into metadata would deserialize them for ~15k chunks on *every* query; and metadata is surfaced only via two field whitelists (`:976-990/:1063-1072`), so it would not auto-appear anyway. Join by `ContextChunk.chunkId`.

### Layer 3 — Wiring (LIVE drafting surfaces first, ICP second)

**Primary target = the path the user actually drafts with.** `god-write`/`god-complete-section` → `universal-agent.ts:1323` `WritePipelineOrchestrator` → `CitationEnforcer` (`write-pipeline-orchestrator.ts:2928/3807`) → `QuotationFidelityValidator`. The opt-in staged-composition path (`composition-orchestrator.ts`) also routes to `CitationEnforcer`. The FCDP 7-gate quote gate is `QualityGauntlet`'s `QuotationFidelityStage`.

Live-path integration tasks (new **Phase 4A**, the critical phase):
- `core/writing/quotation-fidelity-validator.ts` — add a **byte-exact mode** that delegates to `gate.ts` + `reconstructDoc`, replacing (or fronting) the fuzzy Levenshtein path. `CitationEnforcer` and `inline-claim-validator.ts:209` (which instantiates its own `QuotationFidelityValidator`) inherit it automatically. Note `quotation-fidelity-validator.ts:162` carries its **own** `clean_corpus_text` mirror — reconcile it against the ported `normalize`/`clean_corpus_text` so both sides agree.
- `cli/quality/stages/quotation-fidelity-stage.ts` — change pass/fail from `score≥0.90 && unmatched==0` to require **`Exact` (or `NearVerbatim≥0.9` if the user permits) for every quote, with `Missing`/`WrongSource` as hard fails.**
- `core/writing/citation-enforcer.ts` — route its verification through the byte-exact validator; ensure the emitted cite string is the trimmed exact substring.

Secondary target = ICP subsystem (API-only today; keep honest but do not block Tier-A merge on it):
- `faceted-retrieval.ts:282` `extractSpansFromChunk` — the real primary ICP QuoteSpan builder. Keep honest fingerprints/hashes/scorecard; upgrade the three deficits (document-scoped offsets, sub-span page, bbox-when-available).
- `icp-orchestrator.ts:130/:1169` `getCleanText` — wire it as `reconstructDoc`.
- `auto-verifier.ts` `runStageA`/`verify` — swap the vacuous `cleanText.includes` for `gate.ts`.
- `icp-orchestrator.ts:403` bridge stub — route through the honest builder; stop pre-setting `verification_status='auto_verified'`.

### Grafted ideas folded in (corrected)
- **Archon binary as byte-parity ORACLE — UNIT-LEVEL only.** Do **not** use `archon docs verify-quote --doc` for parity: it runs over archon's own differently-chunked/cleaned corpus, so offsets/pages/bboxes legitimately differ from god-agent's even with a perfect port. Instead build a **thin Rust shim** exposing `normalize()`/`find_subslice`/`approx_substring_similarity`/`local_span_in_chunk`/`sub_span_page`, feed it **identical raw input buffers** as the TS core, and assert byte-identical normalized chars, `orig_byte` map, matched span, and page mapping. `docs verify-quote` is retained only as a coarse end-to-end smoke check with the divergence documented.
- **Hard-block + startup smoke handshake (extended).** `Missing`/`WrongSource` never warn. Before `verbatim.db` is trusted: (a) `raw_sha256`/`clean_sha256` reconciliation; (b) **per-doc contiguity/completeness check** — chunk indices run `0..max` with no gaps and count matches, else the doc is marked *unverifiable* and emits no page/offset attributions (sha reconciliation alone cannot detect a missing chunk); (c) a known-quote round-trip returning `Exact` + correct page.
- **Single-path offset-mapping cleaner for Tier-B.** When the gated bbox reingest happens, `clean_corpus_text_with_map(raw)` returns cleaned text AND `orig_byte` map from **one** traversal, with ingest-time assertion `clean == clean_corpus_text(raw)` and a byte-diff harness proving stored chunk text and `chunk_ids` are unchanged.
- **Re-locate, don't re-chunk, for the ~160 bbox docs.** Attach `BlockSpans`/`page_breaks` by re-locating cleaned Marker block text within EXISTING chunk bodies, preserving the `{doc_id}:{index:05d}` join key and vectors.

---

## 4. Sandbox & verification strategy (HARD REQUIREMENT)

> **User constraint:** all build/test happens in a **git worktree sandbox**; authoritative `corpus/`, ChromaDB, `.god-agent/*.db`, and services stay **READ-ONLY**; verify end-to-end **before** any merge to main.

### 4.1 Worktree sandbox
```
# from /home/dalton/projects/claudeflow-testing (WSL only)
git worktree add ../claudeflow-verbatim-sandbox feat/wraith-retrieval
cd ../claudeflow-verbatim-sandbox
```
All code changes, backfill runs, and tests live in `../claudeflow-verbatim-sandbox`. The main working tree is never written to during development.

### 4.2 Read-only authoritative stores — MANDATORY filesystem isolation
The prior "open the live collection read-only and assert no writes" option is **DELETED** — ChromaDB has no enforced read-only client, and a post-hoc assertion cannot prevent a buggy `upsert` from mutating the authoritative store first.

- **ChromaDB (mandatory copy):** `cp -a` (or a snapshot) the authoritative `vector_db_1536` persist dir to a scratch path under the sandbox scratch dir, and run a **separate** Chroma instance on a **scratch port (e.g. :8011)** against the copy. The backfill and all acceptance ingests point ONLY at the copy.
- **Preflight hard-fail (blocking):** before any Chroma connection, assert the resolved sandbox persist path is NOT the authoritative `vector_db_1536` path and the port is NOT `:8001`; abort the run otherwise.
- **Satellite DB:** `verbatim.db` is written ONLY at `../claudeflow-verbatim-sandbox/.god-agent/verbatim.db` (NEW file; never touches authoritative `.god-agent/*.db`).
- **Services:** embedder `:8000`, reranker `:8100` are reused unchanged and read-only. The Tier-B acceptance ingest writes ONLY to a throwaway scratch collection in the **copied** persist dir on `:8011`.
- **Throwaway index:** HNSW/LEANN scratch artifacts go under the sandbox scratch dir and are deleted after verification.

### 4.3 Parity / no-regression proof vs current system
1. **Algorithm parity (unit oracle):** shared-input Rust-shim vs TS-core comparison (§3). TS output must be byte-identical on the quote battery. Fail = block.
2. **Retrieval no-regression:** run a fixed query set through `SmartRetrievalLayer.retrieveContext` before/after wiring; assert identical `chunkId` ordering + scores. Diff must be empty (the port only annotates).
3. **Chunk-id / vector immutability:** assert the sandbox never wrote to the authoritative `knowledge_chunks`; `chunk_id` set + count (~15,107) unchanged; per-chunk `raw_sha256`/`clean_sha256` unchanged.
4. **Verification-becomes-real:** show the *old* live gate (`QuotationFidelityStage`) passes a deliberately-corrupted quote while the *new* gate returns `Drift`/`Missing` and hard-blocks.

### 4.4 Acceptance gates — SPLIT into two independently-mergeable gates

The CPU deliverable must NOT be gated on a GPU step. Two separate scripted gates:

**Gate A — CPU backfill (gates the Tier-A merge to main; NO GPU required):** `scripts/verbatim/acceptance-gate-cpu.ts`:
1. Over a sample of real stored chunks (from the copied persist dir), assert **exact-substring-to-cleaned-text** quote + `Exact` gate status, with **zero Chroma writes**.
2. Exact page on single-page chunks (`sub_span_page`); page-range on multi-page (documented, not asserted as exact).
3. **Real hyphenated / line-wrapped PDF-quote cases:** take quotes AS THEY APPEAR IN THE PDF (an original line-break hyphenation `know-\nledge`, a line-wrap rendered as a space) and assert exactly what the gate returns. Because the stored text is dehyphenated/line-joined, the query-side `normalize` must bridge these; **prove it does on real cases**, and document any case where a PDF-visible quote cannot match the cleaned representation (§5.4).
4. **Offset-consistency (hard):** `reconstructDoc(docId).slice(clean_text_range) === quoteText` for every fixture.
5. **Cross-chunk-boundary quotes:** genuine quotes straddling a chunk boundary do not false-block and produce correct doc-scoped offsets.
6. Gate hard-blocks a mutated variant; `getCleanText(docId)` returns canonical reconstruction; per-doc contiguity check flags a synthetically-holed doc as unverifiable.

**Gate B — Tier-B GPU bbox (gates ONLY the later Phase 6 rollout; requires WRAITH GPU-1):** `scripts/verbatim/acceptance-gate-bbox.ts`:
1. Ingests a known Bekker-heavy Aristotle + one Greek-quote PDF into the scratch collection with the BlockSpan emitter enabled.
2. Retrieves a known passage whose exact text, page, and bbox are hand-verified against the PDF.
3. Asserts correct sentence-tight `sub_span_bbox` within tolerance; re-located ~160-doc chunks keep `chunk_ids` + vectors.

**Tier-A can merge to main with Gate A green and user sign-off, without any GPU step.** Tier-B merges later on Gate B.

---

## 5. Backfill-vs-reingest decision

### 5.1 What the CPU backfill delivers (NO GPU, all ~696 docs / ~15,107 chunks)
Exact-substring-to-**cleaned**-chunk-text quotes, sentence segmentation + `trim_to_relevant_span`, the blocking verify gate wired into the LIVE drafting path, exact page on single-page chunks, page range on multi-page chunks. Matches archon's "no GPU reingest" invariant. **No bbox improvement** (stays page-level union).

### 5.2 Precision & exactness ceiling WITHOUT reingest — transformation ledger
- **"Exact" is to the stored CLEANED text, not the PDF.** `clean_corpus_text` (`run_ingest_phase2.py:544-633`) mutates aggressively: dehyphenation joins split words (`:569-577`), mid-sentence line breaks become spaces (`:588-623`), standalone locator lines are deleted (`:564`), NBSP/whitespace runs collapse (`:629-631`). An emitted "verbatim" quote can therefore be a string that does not appear byte-for-byte in the PDF. This is a substantive citation-honesty boundary, surfaced in the headline (§1) and tested (Gate A step 3), not buried.
- **`raw_content` is a WEAK fallback, corrected:** it is stored only when `raw_text is not None and raw_text != c.text` (`:1756`), and `raw_sha256` defaults to `clean_sha256` when `raw_text` is None (`:1730-1733`) — so a **subset of chunks have no distinct raw layer at all** (fraction to be quantified, §5.5). Moreover `raw_text` itself is `'\n\n'.join(cur_texts)` of Marker/pdftotext **paragraph** extractions (`flush :657`) — it is **not PDF bytes** and lacks original in-line hyphenation/line-wrapping. So `raw_content` buys back **Marker-paragraph-exactness only**, never PDF-byte-exactness. Any claim to the contrary is removed.
- **Page-exact interior sentences on multi-page chunks are NOT recoverable from Chroma alone** (paragraph→page map discarded at `flush()` `:660-662`; Marker JSON not on disk). Ceiling = chunk page range.
  - *Optional CPU escalation — reclassified to BEST-EFFORT / ADVISORY (not "page-exact"):* re-deriving `doc_chunk_page_breaks` from `pdftotext -layout` page splits requires **aligning two different text extractions** (Marker/original-pdftotext-then-cleaned vs a fresh `pdftotext -layout`), which is itself a fuzzy problem — the same error class the port eliminates elsewhere; a misalignment yields a WRONG interior page asserted as exact. Therefore this path (a) requires a **precondition** that the source PDF exists under `corpus/` at a resolvable path AND its `sha256` matches the stored metadata sha (`:1743`); (b) accepts a derived page break ONLY when the surrounding text aligns to the stored chunk above a **high similarity threshold**, else falls back to page-range; (c) is labelled *advisory*, never "page-exact." **Guaranteed interior-page precision comes only from Tier-B**, which persists real `doc_chunk_page_breaks` at ingest.

### 5.3 What strictly requires a scoped GPU (Marker) reingest — Tier B
Sentence-tight bbox on ANY doc; ANY bbox for the ~536 degraded text-only docs. Gated and out-of-band (Phase 6, Gate B).

| Doc class | Backfill (no GPU) | Reingest (GPU/Marker) |
|---|---|---|
| ~160 full-bbox docs | exact-to-cleaned quote + exact/range page + **page-level** bbox | + sentence-tight bbox (re-locate blocks in existing chunks — no re-embed) |
| ~536 degraded docs (~77%) | exact-to-cleaned quote + exact/range page, **no bbox** | + any bbox (full Marker reingest, new `chunk_ids` acceptable) |

### 5.4 Citation-honesty contract (what the committee sees)
Any cite string emitted to a draft is an exact substring of the **stored cleaned representation**. Where that differs from the PDF surface (dehyphenated token, line-break→space), the system must either (a) emit the PDF-surface form only when the query-side `normalize` provably bridges the difference, or (b) flag the transformation. The drafting system must **never** present a string as "verbatim from the PDF" that cannot be found in the PDF without stating the transformation applied. True PDF-byte-exact cites require a fresh PDF re-extraction (Tier-B or a dedicated raw layer) — scoped, not assumed.

### 5.5 Measurements required BEFORE headline claims (Phase 3 preflight)
Query the corpus and record: (1) single-page vs multi-page chunk distribution (determines whether "precise page" is honest as a headline or must be downgraded to "page-exact where derivable"); (2) count of chunks with no distinct `raw_content` layer (can never be reconciled even to Marker-paragraph text); (3) count of docs failing the contiguity/completeness check (unverifiable docs). These numbers are reported to the user before Tier-A sign-off.

---

## 6. Phase-by-phase tasks

- **Phase 0 — Sandbox setup & UNIT oracle harness:** worktree; **copied** scratch Chroma on :8011 with preflight hard-fail; build the ≥40-quote battery (Greek/Bekker, plus real hyphenated/line-wrapped and cross-chunk-boundary cases); build the thin Rust shim exposing `normalize`/`find_subslice`/`approx_substring_similarity`/`local_span_in_chunk`/`sub_span_page` for shared-input parity. *Checkpoint:* fixtures committed; shim runs.
- **Phase 1 — Pure-TS algorithm core (no DB):** `normalize.ts`/`locate.ts`/`trim.ts`/`gate.ts`/`spatial.ts`/`types.ts` + pinned `reconstructDoc`, with UTF-8/code-point/A–Z-fold discipline. *Checkpoint:* byte-identical to the Rust shim on identical inputs for every battery quote; zero DB.
- **Phase 2 — Satellite store & schema:** `span-store.ts` over `.god-agent/verbatim.db` with `doc_chunk_page_breaks`, `doc_chunk_blocks`, `doc_chunk_sentences`, `doc_locators`, `backfill_meta` (full DDL in file). *Checkpoint:* DAO CRUD tests; never touches authoritative DBs.
- **Phase 3 — CPU backfill pipeline + corpus measurements:** `scripts/verbatim/backfill.ts` reads copied Chroma read-only, writes sentences + single-page page_breaks + shas, idempotent/resumable; runs §5.5 measurements; optional advisory pdftotext escalation (with PDF-exists + sha-match precondition + alignment gate). *Checkpoint:* writes only to `verbatim.db`; re-run is no-op; sample round-trips exact-to-cleaned; measurements reported.
- **Phase 4A — Wire byte-exact gate into the LIVE drafting path (CRITICAL):** add byte-exact mode to `core/writing/quotation-fidelity-validator.ts` (reconcile its `:162` `clean_corpus_text` mirror); route `CitationEnforcer` and `inline-claim-validator.ts` through it; change `QualityGauntlet`'s `QuotationFidelityStage` pass/fail to require `Exact` (+ hard `Missing`/`WrongSource` block). *Checkpoint:* an FCDP draft with a corrupted quote is blocked; a genuine quote passes; cite string is the exact trimmed substring.
- **Phase 4B — Wire ICP path (secondary, non-blocking for Tier-A):** implement `getCleanText` as `reconstructDoc` (`icp-orchestrator.ts:130/:1169`); swap vacuous substring in `auto-verifier.ts` for `gate.ts`; make `clean_text_range` document-scoped; gate asserts offset-consistency. *Checkpoint:* corrupted quote blocked on API path; slices exact.
- **Phase 5 — Honest QuoteSpan population + surfacing:** upgrade `faceted-retrieval.ts:282` (document-scoped offsets, `sub_span_page`, bbox-when-available/else page-level); add optional bbox/page-tight fields to QuoteSpan (`icp-types.ts:309`) **defaulting null/page-level in CPU deliverable**; route `icp-orchestrator.ts:403` bridge through the honest builder. `SmartRetrievalLayer` whitelists untouched (chunkId join). *Checkpoint:* live-path QuoteSpans carry honest offsets/page; bbox null until Tier-B.
- **Phase 5.5 — Startup smoke handshake:** `handshake.ts` reconciles shas + per-doc contiguity/completeness + known-quote round-trip before `verbatim.db` is trusted. *Checkpoint:* tampered/holed DB refused.
- **Phase 6 — (GATED, GPU, Gate B) Tier-B sentence-tight bbox reingest:** `flush()` emits page_breaks; `_bbox_by_page`/metadata builder emit per-block `BlockSpan`; `markdown_chunker.py` carries char offsets; single-path `clean_corpus_text_with_map` with `clean == clean_corpus_text` assertion; re-locate-not-re-chunk for the ~160 bbox docs, full reingest for ~536 degraded. *Checkpoint:* Gate B green; re-located docs keep chunk_ids + vectors.

---

## 7. Risks & mitigations

- **PDF-vs-cleaned exactness gap** — deliverable renamed corpus-representation-exact; hyphenated/wrapped cases tested (Gate A.3); citation-honesty contract §5.4.
- **`raw_content` overclaim** — corrected: Marker-paragraph text, conditional presence; not a PDF-byte fallback.
- **Live hot-path miss** — wiring retargeted to `QuotationFidelityValidator`/`CitationEnforcer`/`QuotationFidelityStage` (Phase 4A); ICP demoted.
- **UTF-8 byte-offset parity** — `TextEncoder` + `for...of` + A–Z fold + Unicode whitespace, proven by unit shared-input shim (not corpus-level verify-quote).
- **Cross-system oracle conflation** — parity is unit-level over identical inputs; `verify-quote --doc` is smoke-only.
- **Reconstruction integrity / missing chunk / gaps** — pinned `reconstructDoc` + per-doc contiguity/completeness handshake; unverifiable docs emit no attributions.
- **Cross-chunk-boundary quotes** — boundary delimiter semantics pinned; boundary quotes in the battery.
- **Gate/offset decoupling** — offset-consistency is a precondition for `Exact` and a hard §8 criterion.
- **pdftotext escalation misalignment** — advisory only, PDF-exists+sha precondition, alignment-similarity gate, else page-range.
- **Sandbox write to live store** — mandatory filesystem copy + preflight hard-fail; assert-only option deleted.
- **Coordinate mismatch** — one canonical clean_text (`reconstructDoc`) shared by producer and consumer.
- **Embedding-space parity** — none; reuse unchanged; retrieval no-regression diff.
- **Chroma metadata limits** — satellite SQLite + chunkId join.
- **Backfill idempotency** — `backfill_meta` sha + handshake.
- **Degraded-doc coverage / bbox** — documented ceiling; Tier-B gated; QuoteSpan bbox null until then.
- **Locator misclassification** — advisory only; page-exactness from page_breaks not locators.
- **OCR artifacts** — Sellers ≥0.60 surfaces for review; hard-block prevents shipping.
- **:403 bridge bypass** — routed through honest builder; no pre-set `auto_verified`.

---

## 8. Acceptance criteria & rollout

**Tier-A acceptance (all in sandbox before merge; NO GPU):**
1. Algorithm byte-parity: TS core == Rust shim on identical inputs for every battery quote (incl. Greek/Bekker/hyphenated/wrapped/boundary).
2. **Exact-substring-to-CLEANED-text** backfill over full corpus, **zero Chroma writes** (deliverable stated as corpus-representation-exact, not PDF-verbatim).
3. **Live drafting gate is real:** `QuotationFidelityStage`/`CitationEnforcer` block a corrupted quote and pass a genuine one; `Missing`/`WrongSource` hard-block.
4. **Offset-consistency (hard):** `reconstructDoc(docId).slice(clean_text_range) === quoteText` for every emitted span.
5. `getCleanText`/`reconstructDoc` wired; cross-boundary quotes do not false-block.
6. No retrieval regression (identical chunkId order+scores).
7. Chunk id/count/sha immutability; per-doc contiguity/completeness handshake refuses holed/tampered `verbatim.db`.
8. §5.5 measurements reported (single/multi-page distribution; no-raw-layer count; unverifiable-doc count).
9. Gate A (§4.4) green.

**Tier-B acceptance (gates Phase 6 only; requires WRAITH GPU-1):** Gate B green — sentence-tight bbox correct within tolerance; re-located ~160-doc chunks keep chunk_ids + vectors.

**Rollout (WSL/Mac discipline):** develop + verify in WSL worktree, never Mac; present evidence and WAIT for sign-off before any commit/push; commit/push from WSL only into `feat/wraith-retrieval` → PR to `main`, ask permission before pushing; sync to Mac only after WSL-verified and with permission; Tier-B GPU reingest is a separate later gated rollout; timestamped `.backups/` before touching tracked files.

**Deliverable summary.**
- **Ships now (CPU, all docs):** exact-substring-to-cleaned-corpus quotes + `trim` + exact page on single-page chunks / page range otherwise + a **real blocking gate on the live drafting path** (`god-write`/FCDP), authoritative stores read-only, additive `verbatim.db`. **No bbox improvement; QuoteSpan bbox fields remain page-level/null.** Guarantee is corpus-representation-exact, NOT PDF-source-verbatim.
- **Ships later (gated GPU, Gate B):** sentence-tight bbox on the ~160 bbox docs (re-located, no re-embed) and any bbox on the ~536 degraded docs, same satellite schema; guaranteed interior-page precision via persisted `doc_chunk_page_breaks`.

---

## 9. Open questions for the user (decision points)

1. **Verbatim contract scope.** Is **corpus-representation-exact** (exact substring of the cleaned/dehyphenated/line-joined stored text, page-attributed) acceptable as the shipping guarantee for Gross-tier cites, or do you require **true PDF-byte-exact** quotes? The latter is not achievable from the current Chroma store and forces a fresh PDF re-extraction (Tier-B-style, GPU or at least a new CPU raw-extraction layer) before Tier-A can claim "verbatim from PDF." This is the single biggest scoping call.
2. **Tier-B reingest scope & timing.** Do you want sentence-tight bbox at all in this effort, and if so: only the ~160 already-bbox docs (re-locate, no re-embed, cheap), or also full Marker reingest of the ~536 degraded docs (~77% of corpus, real GPU cost, new chunk_ids, needs WRAITH GPU-1 manual reboot/login)? Or defer Tier-B entirely as a separate future project?
3. **Page-precision headline.** After the §5.5 measurement, if multi-page chunks are common, do you want (a) "page-exact where derivable, page-range otherwise" as the honest headline, or (b) promote the advisory pdftotext page-break escalation to default (CPU-only, but fuzzy cross-extractor alignment risk), or (c) accept page-range until Tier-B?
4. **`NearVerbatim(≥0.9)` policy on the live gate.** Should the FCDP `QuotationFidelityStage` accept `NearVerbatim` (allowing minor normalization drift) or require strict `Exact` only, hard-blocking everything else?
5. **Satellite store location/name.** Confirm `.god-agent/verbatim.db` (new, additive) is the right home, or specify an alternative path so it never collides with authoritative `.god-agent/*.db`.
6. **Unverifiable-doc handling.** For docs that fail the contiguity/completeness check (missing/gapped chunks), confirm the desired behavior is "emit no page/offset attribution and surface for manual review" rather than falling back to fuzzy.
7. **Timeline / sequencing.** Land Phase 4A (live byte-exact gate) as the first user-visible win and merge Tier-A before touching ICP (Phase 4B) and Tier-B, or hold everything for a single larger review?