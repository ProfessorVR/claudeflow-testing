# 05 — Ingestion-System Analysis: the road to airtight, sentence-level verbatim granularity

**Written 2026-07-29 (Phase E close), on user instruction:** *"conduct an extensive
analysis of the ingestion system. the idea is to make the ingestion and index system
airtight, able to allow sentence level verbatim granularity."*

**Method.** Everything here is grounded in this session's measurements — the E0
per-document probe table (`archon-cli/.archon/corpus-import/corpus-probes.json`), the
C8 re-anchor ledger, the D5 pilot's live authoring experience, the E1 ligature
reproduction, and a code-level read of the archon ingestion pipeline
(`crates/archon-docs/src/{ingest*, marker_source, block_chunking, two_up,
provenance_chunks, quote_verify, schema, store}.rs`). Archive spot figures are cited
as such. Nothing below is narrated from memory.

---

## 1. The pipeline as it actually is

```
source PDF/text
  → admissibility (NEW, E2: page-hash distinctness · words/page floor · ligature · diacritics)
  → extraction        A) Marker sidecar (~/.venv-marker; surya models; per-block text+bbox)
                      B) pdftotext flat path (no bboxes; locators get NO coord_space)
                      C) image-OCR path (tesseract → RapidOCR → VLM description)
  → cleaning          (cleaning_version stamped; hash chain per chunk — H-5)
  → chunking          (block-aligned; doc_chunks.content; page-aware)
  → per-chunk layers  doc_chunk_blocks   (byte spans + bbox per block — 114,612 rows)
                      doc_chunk_page_breaks (byte offset → page — 27,227 rows)
                      doc_chunk_spatial  (chunk super_box — 63.5% of chunks)
                      doc_chunk_hashes   (integrity chain: raw_sha256, cleaning_version)
                      doc_locators       (running-head Bekker/page — 2,961 rows)
  → embedding/index   (fastembed 768 local; RocksDB vecs; Rust-HNSW snapshot)
  → verification      (locate_quote/find_fragment_bboxes: exact/fuzzy, sub-span page,
                       bbox, Bekker locator, byte offsets — B3)
```

**What is genuinely strong** (and must not be regressed by any redesign): the
block-level byte spans with real Marker bboxes; the page-break byte map; the
running-head locator capture; the H-5 integrity chain keyed on `raw_sha256 +
cleaning_version` (re-derivation is verifiable); content-hash reconciliation of
renames; honest `pending` embedding status; and — since Phase B — byte-offset
emission and the exact-only verify gate. The five E4 regression tests now pin the
bookkeeping honesty.

---

## 2. Measured state (this session, not spot figures)

| Axis | Measured | Consequence |
|---|---|---|
| Documents / chunks | 226–227 / ~17,800 | one doc perpetually "Ingesting"; E3 reprocess live |
| Spatial coverage | **63.5% overall; 87 docs full; 39 docs <50%; worst 2%** (Bitzer 0.02, Kolko 0.03, Gloria Mark 0.03, **Ars Rhetorica Greek 0.06**, Lombard & Ditton 0.07) | any bbox-dependent gate fails closed on a third of the corpus; the GREEK critical edition is nearly unaddressable spatially |
| Locators | 2,961 rows total, concentrated in few docs | Bekker capture works but is sparse; most pages carry no running-head locator row |
| Duplicate page hashes | **0 documents** (store-wide scan) | the audited identical-11-pages case was the INCUMBENT's manifest world; archon's page layer is clean on this axis |
| Ligature dropout | 6 docs carry probe tokens in stored text; root cause **reproduced and fixed** (pypdfium2 4.30.0 → 5.12.1; sidecar smoke-tested) | stored text for those docs remains damaged until re-extraction (F1) |
| OCR fallback | observed live during E3: `tesseract image OCR produced no text; RapidOCR fallback also failed` → VLM description only | image-text loss is currently a log line, not a recorded degradation |
| Quote re-anchoring (C8) | pre-fix: 55% exact / 37% not-found. **Root cause isolated: needle normalization** — sandbox spans carry PDF line-break hyphenation (`vir-\ntual`) and head truncations (`'ife` for "Life"); de-hyphenated variants match EXACT. Post-fix early rate: **28/30 exact** | the store text was largely fine; the *matching contract* was the gap |
| verify-quote latency | 3.3–5.2 s exact / 12.1 s not-found (archive measurement, confirmed order-of-magnitude in C8) | never a bulk-grounding path; C3's `(chunk_id, range)` rule stands |

---

## 3. Defect register (ingestion-scoped, all evidenced)

1. **Damaged stored text for ligature-era ingests** — 6+ docs (incl. both King & Salvo
   VLE papers). Fix is re-extraction under pypdfium2 5.12.1 (F1), not text repair.
   The B4 `StoreCorruptionSuspected` class already diagnoses these at the quote gate.
2. **Two-tool text divergence.** pdftotext (poppler) and Marker produce different
   text for the same PDF (pilot CL012: the sentence head differed; the ANOVA span was
   exact only under the store's rendering). Any workflow that authors quotes from a
   NON-store extraction will generate false rejections. *The store's text layer must
   be the single text-of-record for authoring* — or the matcher must own the
   normalization (see §5, N-contract).
3. **Needle-normalization gap in matching** (found via C8): raw line-break
   hyphenation and soft hyphens in supplied quotes defeat exact matching against
   cleaned store text. Fixed in the C8 runner; must be fixed IN
   `quote_verify`'s normalization for every consumer (currently it normalizes
   whitespace/punctuation/case but **not line-break hyphenation** — that is why
   `vir- tual` still failed after whitespace collapse).
4. **Spatial-coverage cliff on the OCR/flat paths** — 39 docs <50%. The flat-text
   path stamps locators with no `coord_space` and chunks with no spatial rows.
5. **Sparse locator capture** — running-head locators exist for only a fraction of
   pages; `locator: null` dominates outside the Greek editions.
6. **Silent image-text loss** — when tesseract AND RapidOCR fail, the pipeline keeps
   a VLM *description* but records no machine-readable "image text missing" state.
7. **Exact-mode + `--index` breaks Cozo FTS** — the canonical-expanded (Greek) query
   reaches the FTS parser raw (discovered at A8 acceptance; pre-existing).
8. **`doc_chunk_blocks` columns named `char_*` hold BYTES** (schema doc comment says
   so) — the C2 trap, still latent for any new reader; rename impossible without
   migration (Cozo no-ALTER), so it must be neutralized by documentation + accessor
   discipline until F1's store regeneration.
9. **`docs model-status` panics on exit** (tokio blocking-drop; cosmetic).
10. **Sandbox-extraction quote defects** — head-truncated spans (`'ife`), raw
    newlines: the *upstream* extractor (incumbent sandbox pipeline) emitted
    unnormalized spans. Regeneration (F) retires that pipeline; until then C8's
    normalization compensates.

---

## 4. The gap to sentence-level verbatim granularity

What exists: chunk-level content; block-level byte spans + bboxes; byte-resolved
page breaks; supplied-quote verification to sub-span page/bbox/byte-offsets.

**What is missing is exactly one layer: a durable SENTENCE segmentation of the
store's text-of-record.** Nothing in the store knows where sentences begin and end,
so: clause records cannot cite a stable sentence address; sentence-tight bboxes
cannot be precomputed (only derived per-query); and the density/coverage gates
cannot count sentence-addressable content.

Everything needed to build it already exists: the text-of-record
(`doc_chunks.content`), the byte→page map, the byte→bbox block map, and the
integrity chain that makes derived layers re-derivable and verifiable.

---

## 5. The design: `doc_chunk_sentences` + three contracts

### 5.1 The sentence layer

New relation (created empty now, populated by a builder — additive, no migration):

```
:create doc_chunk_sentences {
    chunk_id: String, sentence_idx: Int =>
    byte_start: Int,          # UTF-8 byte offsets into doc_chunks.content —
    byte_end: Int,            # named for what they hold (C2 rule)
    text_sha256: String,      # of the exact slice
    page: Int,                # derived once via doc_chunk_page_breaks
    bbox: String,             # derived once via doc_chunk_blocks (sub_span_bbox), "" if none
    derivation_version: String
}
```

- **Builder:** `archon docs sentence-index [--doc id]` — segments every chunk's
  content with a deterministic, dependency-free segmenter (terminal punctuation +
  closing quotes/brackets; abbreviation and initialism guard; Greek ano teleia `·`
  and `;` question mark; ellipsis guard; never splits inside a bbox-less OCR island
  without flagging). Unicode-safe by construction (operates on char boundaries,
  stores byte offsets).
- **Determinism contract:** identical `(content_hash, segmenter_version)` ⇒
  identical sentence table. `derivation_version` joins the H-5 chain so a re-ingest
  or cleaning change invalidates and rebuilds the layer verifiably.
- **Scale:** ~17.8k chunks → est. 350–550k sentence rows ≈ 30–60 MB. Batched
  guarded writes (the corpus-import writer pattern). Build cost is one linear pass —
  minutes, not hours.
- **Address:** `(document_id, chunk_id, sentence_idx)` becomes the canonical
  sentence-level address; CLAUSE records reference it in `citation_address_json`
  today (no schema change) and as first-class columns in the F1-regenerated store.

### 5.2 The three contracts that make it airtight

**T — Text-of-record contract.** One extraction of record per document (Marker
where it succeeds; flat-text otherwise), identified by `(tool, version, flags,
content_hash)` — already mostly captured; make it queryable per doc. *Authoring
quotes from any other extraction is a defect* (the pilot proved why). The
sentence layer is derived ONLY from the text-of-record.

**N — Normalization contract (matching).** One normalization, owned by
`quote_verify`, applied to BOTH needle and store text before exact comparison:
NFC · whitespace collapse · smart-quote/punctuation folding (exists) · **line-break
de-hyphenation (`-\n` → ``)** and soft-hyphen removal (missing — add) · ligature
folding (`ﬁ`→`fi`, defensive). Every consumer goes through it; no ad-hoc
normalization in runners (the C8 fix migrates INTO the engine at F0.5).

**D — Degradation contract.** Every sentence row either carries a bbox or the
document carries a recorded degradation reason (`ocr-only | scanned-image |
no-text-layer | media-source`); every image whose OCR fails writes an
`image_text_missing` state, not just a log line. The E0 probe table becomes the
acceptance surface: coverage may only move up, and every gap is named.

### 5.3 What this buys the index

- CLAUSE records gain stable sentence addresses with precomputed page + tight bbox —
  no 3–12 s verify-quote calls for grounding (the C3 rule generalizes: grounding is
  a `(chunk_id, sentence_idx)` lookup).
- `check-loci` (the unimplemented roster gate) becomes implementable exactly as
  specified: locator resolution round-trips by slicing the sentence table.
- The verbatim checker gets a *sentence-scoped* diff on failure: "your quote spans
  sentences 12–13; sentence 13 differs at bytes 44–52" — diagnosis, not accusation.
- Density and span-coverage gates gain a machine denominator (sentences per doc).

---

## 6. Sequenced implementation (F0.5 — before F1's re-ingest)

| # | Work | Size | Acceptance |
|---|---|---|---|
| S1 | Add `-\n` de-hyphenation + soft-hyphen removal to `quote_verify` normalization; migrate the C8 runner's fix into the engine | ~20 lines + tests | the Chalmers hyphenated quote matches EXACT through `docs verify-quote` directly |
| S2 | `doc_chunk_sentences` relation + deterministic segmenter + `docs sentence-index` builder | ~350–500 lines | full-corpus build in minutes; 20-doc random sample: every sentence slices back byte-exact (incl. Greek/German); identical rebuild is byte-identical |
| S3 | Derive page + bbox per sentence via existing `page_breaks`/`blocks` machinery | ~80 lines (reuse `sub_span_page`/`sub_span_bbox`) | sentence bbox coverage ≥ block coverage per doc; gaps carry the D-contract reason |
| S4 | `check_loci.py` roster gate over the sentence layer (flips one FAIL-by-rule gate to implemented) | ~80 lines | red on a corrupted fixture; green on the pilot entry |
| S5 | OCR-failure state: `image_text_missing` recorded per image; probe surfaces it | ~40 lines | the E3-observed tesseract/RapidOCR failure produces a queryable row |
| S6 | F1 re-ingest ordering: re-extract the 6 ligature-damaged docs + the 39 <50%-spatial docs FIRST (worst-first), rebuild sentence layer per doc as ingestion completes | policy, not code | E0 probe table strictly improves per doc; C8-class re-anchor of affected clauses converts not-founds |
| S7 | Retire the `char_*`-naming trap at F1 store regeneration (new columns named `byte_*`); until then, the accessor-discipline note stands | F1 item | grep gate: no new reader touches `doc_chunk_blocks.char_*` without the conversion module |

Explicitly NOT proposed: porting extraction off Marker, any wraith-adjacent
inference, FTS over sentence text (one-way storage cost — decide at F with measured
query needs), or sentence-level embeddings (the 768 chunk embeddings + sentence
addressing compose; embedding 500k sentences is a separate decision with real cost).

---

## 7. Judgment

The ingestion system's foundations are genuinely good — the block/byte/bbox/page
machinery is exactly what sentence-level granularity needs, and the audit's worst
ingestion fears (silent batch loss, prefix hashing, positional bboxes, path-only
reconciliation, fake-ok status) are all *absent from archon* and now pinned by
tests. The real gaps were: one extraction-layer bug (fixed), one matching-contract
gap (fixed in the runner, migrating into the engine), a coverage cliff on the
OCR path (measured, worst-first re-extraction queued), and the missing sentence
layer (designed above, ~a day of implementation). With S1–S5 landed before F1, the
re-ingested corpus comes up sentence-addressable from day one, and every verbatim
in the index resolves to a page, a tight box, and a stable sentence address — which
is what "airtight" means here.
