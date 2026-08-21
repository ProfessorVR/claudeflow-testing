# Spec — Integrated Verbatim-Verification & Visual-Provenance Subsystem for Archon

**Date:** 2026-06-24 · **For:** todo #3, the one genuine ingestion port (sub-page visual provenance integrated into `archon-provenance`).
**Status:** design-complete; bind-points to the real checkout marked `[CONFIRM]` (resolve once Archon is on the Mac).
**Bound against verified source:** ours — `scripts/ingest/render_citation_bbox.py:210` (matcher), `run_ingest_phase2.py:1626` (dual hash), `image_extractor.py:45` (bbox); Archon — `archon-docs/src/schema.rs` (relations), `archon-provenance/src/chain.rs` (`chain_hash_from_str`), `archon-docs/src/{ingest_pdf,chunking}.rs`.

---

## 1. Goal & the three guarantees

Given a quote (cited or generated) and the chunk it claims to come from, the subsystem answers, **offline**:

1. **Integrity** — the stored chunk text is byte-identical to what was extracted at ingest, and that fact is tamper-evident (hash + provenance chain).
2. **Authenticity** — the quote actually occurs in that chunk's source text (verbatim substring / fuzzy-confidence).
3. **Spatial provenance** — *where on the page* the quote sits (per-line rectangles + the chunk's super-box), renderable as an overlay.

Archon today gives **none** of these below page granularity. Our system gives 2 and 3 but not 1 (flat manifest, no chain). Integrating them yields all three at once — stronger than either system alone.

---

## 2. Data model — additive CozoDB relations (no destructive migration)

Archon's `doc_chunks` is a fixed-schema Cozo relation with no spatial/JSON column. **Do not migrate `doc_chunks`** (it would force a `:replace` and re-key the HNSW/vec store). Instead add **satellite relations keyed by `chunk_id`**, exactly the pattern Archon already uses for video (`video_chunk_timeref` etc.). Join at query time.

```
:create doc_chunk_hashes {
    chunk_id: String =>
    raw_sha256: String,         # sha256(raw extracted text, pre-clean)
    clean_sha256: String,       # sha256(stored chunk content)  == doc_chunks.content_hash if no cleaning
    cleaning_version: String,
    commit_hash: String,        # sha256(chunk_id ∥ raw_sha256 ∥ clean_sha256 ∥ spatial_hash ∥ cleaning_version)
}

:create doc_chunk_spatial {
    chunk_id: String =>
    page_num: Int,              # 1-indexed primary page of the chunk
    super_box: String,          # JSON "[x0,y0,x1,y1]"  (Cozo Json type if available [CONFIRM], else String)
    blocks: String,             # JSON "[[x0,y0,x1,y1],...]" per text block
    coord_space: String,        # "pdf_topleft" | "marker" | ... (origin + scale provenance)
    spatial_hash: String,       # sha256(canonical_json(page_num, super_box, blocks, coord_space))
}

# OPTIONAL, per-KB toggle — enables word-exact verification with the source PDF ABSENT (storage-heavy):
:create doc_page_words {
    doc_page_word_id: String => # f"{document_id}:{page_num}:{word_index}"
    document_id: String, page_num: Int, word_index: Int,
    text: String, x0: Float, y0: Float, x1: Float, y1: Float, line_no: Int,
}
```

Rationale: additive = low risk, no re-embedding, matches Archon's satellite-table convention. `super_box`/`blocks` as JSON strings unless Cozo's `Json` column type is confirmed available `[CONFIRM]`.

---

## 3. Chain integration — making the spatial + hash facts tamper-evident

The point of integrating *into* `archon-provenance` (not a side table) is that the bbox and hashes must be **covered by the hash chain**. Today ingest builds provenance *edges* but writes **no per-chunk provenance record** (`ingest_pdf.rs` sets `provenance_record_id: String::new()`). So this couples with closing that gap.

**Design:** the OCR/extraction operation that produces the chunks gets a provenance record whose `output_hash` commits to every chunk's `commit_hash`.

1. At ingest, for each chunk compute `commit_hash = sha256(chunk_id ∥ raw_sha256 ∥ clean_sha256 ∥ spatial_hash ∥ cleaning_version)` (null-separated, like the chain).
2. Compute `chunks_root = merkle_root(sorted commit_hashes)` (or, simpler v1: `sha256` over the sorted concatenation — a flat root; upgrade to Merkle if per-chunk inclusion proofs are wanted later).
3. Create the extraction operation's provenance record via the existing chain:
   ```rust
   let output_hash = chunks_root;
   let chain = chain_hash_from_str(
       &parent_hashes,          // the source-artifact / OCR-run hashes
       "extract_text_spatial",  // operation
       &input_hashes,           // file_sha256, ocr_run_id hash
       &output_hash,            // = chunks_root  ← commits to text+bbox of every chunk
       Some(ocr_engine),        // tool  e.g. "marker" | "tesseract"
       model,                   // OCR/VLM model if any
       &parameters_json,        // dpi, lang, frame_interval, cleaning_version, ...
   );
   ```
4. Persist the `ProvenanceRecord` `[CONFIRM struct in archon-provenance/src/record.rs]`, then set the OCR artifact's `provenance_record_id` to it (fixing the empty-string gap).

Now `verify-by-recompute` over the chain re-derives `chunks_root` from the stored `commit_hash`es; **any change to a chunk's text, raw hash, or bbox changes its `commit_hash` → changes the root → fails chain verification.** The spatial fact is now as tamper-evident as the lineage.

---

## 4. Ingest-time production (per OCR engine)

`run_pdf_ingest_pipeline` is extended after `persist_text_artifact_chunks`:

| OCR engine | Word/block bboxes come from |
|---|---|
| **Marker** (Metal sidecar / WRAITH) | Marker already emits block & line polygons per page → map to `{super_box, blocks}` directly. Capture `coord_space="marker"` + the page bbox for scaling (our `render_bbox_overlay` already scales `marker_page_bbox → pdf`). |
| **Tesseract** (Archon native) | hOCR/TSV gives word boxes → union into line `blocks`, page super-box. `coord_space="pdf_topleft"`. |
| **poppler `pdftotext -bbox`** (born-digital) | word boxes directly. |

For each `PageChunk` (which has `page_start/end` from char-offset `page_offsets`): assign `page_num = page_start`, compute `super_box` = union of its blocks' boxes, write `doc_chunk_spatial` + `doc_chunk_hashes` (raw vs clean: `raw_sha256 = sha256(pre-clean text)`, `clean_sha256 = sha256(content)`; if Archon does no cleaning, `raw_sha256 == clean_sha256 == doc_chunks.content_hash`, but keep the field for when a cleaning pass is added). Then build the provenance record (§3).

Optionally (per-KB) persist `doc_page_words` for offline-without-PDF verification.

---

## 5. The Rust quote-matcher contract (faithful port of `find_fragment_bboxes`)

Pure Rust, **no Python at verify time**. Use the **`difflib` crate** (a faithful port of Python's `difflib`) so `SequenceMatcher::ratio()` matches our reference output.

```rust
pub struct Word { pub text: String, pub x0: f32, pub y0: f32, pub x1: f32, pub y1: f32, pub line_no: u32 }
pub struct PageRect { pub x0: f32, pub y0: f32, pub x1: f32, pub y1: f32 }

/// Locate a text fragment among a page's words via difflib sliding-window fuzzy match.
/// Faithful to render_citation_bbox.py:210.
pub fn find_fragment_bboxes(
    page_words: &[Word],
    fragment: &str,
    similarity_threshold: f32,   // default 0.85
) -> Vec<PageRect>;

/// Full quote (may contain ellipses). Splits on `...`, `[...]`, `…`; matches fragments with >2 words; unions rects.
pub fn locate_quote(page_words: &[Word], quote: &str, threshold: f32) -> QuoteLocation;

pub struct QuoteLocation { pub rects: Vec<PageRect>, pub best_ratio: f32, pub matched: bool }
```

**Algorithm (must match exactly):**
1. `normalize(w)` = lowercase, strip all non-word chars (`\W+` → ""); Unicode-aware.
2. `quote_tokens` / `page_tokens` = normalized, non-empty; keep parallel index→`Word`.
3. Ellipsis split on `r"\.\.\.|\[\.\.\.\]|…"`; only fragments with `>2` words.
4. Window size = `quote_tokens.len()`; slide over `page_tokens`; `SequenceMatcher::new(window, quote_tokens).ratio()`; track best; **break on `1.0`**.
5. If `best_ratio < threshold` → empty.
6. Group `matched_words` by `line_no` → per-line min/max `(x0,y0,x1,y1)`; **pad `(-2,-2,+2,+2)`**.
7. Return rects (+ `best_ratio` as confidence).

**`page_words` providers** (pick at call site):
- **On-demand** (source PDF present): extract page words via **`pdfium-render`** (gives word text + boxes). `[CONFIRM]` pdfium coordinate origin (bottom-left) vs our top-left convention — apply a y-flip so rects share the render space (our Python relied on PyMuPDF's shared space; pdfium needs explicit alignment).
- **Stored** (offline, no PDF): read `doc_page_words`.
- **Fallback** (neither): return the chunk's `super_box` from `doc_chunk_spatial` (page-region answer, no word-exact highlight).

---

## 6. Verify API + CLI

```rust
pub struct QuoteVerification {
    pub chunk_integrity_ok: bool, // recomputed raw_sha256 == chain-committed commit_hash component
    pub chain_verified: bool,     // the chunk's artifact provenance record recomputes
    pub quote_found: bool,        // locate_quote matched ≥ threshold OR exact substring of raw text
    pub match_confidence: f32,    // best_ratio (1.0 = exact)
    pub verbatim_exact: bool,     // normalized quote is a contiguous substring of normalized raw text
    pub location: QuoteLocation,  // rects on page_num
    pub page_num: i64,
}

pub fn verify_quote(db: &DbInstance, chunk_id: &str, quote: &str) -> Result<QuoteVerification, DocsError>;
```

Flow: load `doc_chunks` + `doc_chunk_hashes` + `doc_chunk_spatial`; recompute `commit_hash`, compare to chain (`chain_verified`, `chunk_integrity_ok`); `verbatim_exact` = normalized-substring test against raw text; `location` = `locate_quote` via a `page_words` provider.

CLI surface (mirrors `archon video …`):
```
archon docs verify-quote <chunk_id> --quote "<text>" [--render out.png] [--json]
archon docs provenance <chunk_id>        # show chain + bbox + hashes
```
`--render` overlays the rects on a rasterized page (`pdfium-render` rasterize + `imageproc` draw — our orange semi-transparent fill, width 1.5), the one optional presentation piece; verification itself needs no rendering and no Python.

---

## 7. Phasing & effort

| Phase | Deliverable | Effort |
|---|---|---|
| V-0 | Satellite relations (`doc_chunk_hashes`, `doc_chunk_spatial`) + dual-hash write at ingest (`raw/clean/cleaning_version`) | S |
| V-1 | Per-chunk `commit_hash` → `chunks_root` → extraction `ProvenanceRecord`; populate `provenance_record_id`; `verify-by-recompute` covers it | M `[CONFIRM record.rs struct]` |
| V-2 | Bbox capture per OCR engine (Marker→`{super_box,blocks}`; Tesseract hOCR; poppler -bbox) into `doc_chunk_spatial` | M |
| V-3 | Rust `find_fragment_bboxes`/`locate_quote` (`difflib` crate) + golden tests vs the Python reference on fixture PDFs | M |
| V-4 | `verify_quote` + `archon docs verify-quote/provenance` CLI | S |
| V-5 | Optional `--render` overlay (`pdfium-render` + `imageproc`) and optional `doc_page_words` for PDF-absent verification | S–M |

**Golden-test gate:** V-3 must reproduce the Python matcher's rects on a fixture set (multi-column, hyphenated line-break, ligature, footnote-superscript, ellipsis-split, rotated page) before it's trusted — a wrong matcher silently mis-locates quotes.

---

## 8. `[CONFIRM]` on the Mac (resolve against the real checkout)

1. `ProvenanceRecord` struct + insert fn (`archon-provenance/src/record.rs` / `lib.rs`) — fields to populate, how `provenance_record_id` links from `doc_artifacts`.
2. Cozo `Json` column type availability (else JSON-as-`String`).
3. `pdfium-render` coordinate origin/scale vs the stored bbox space (y-flip alignment).
4. Whether Archon performs any text *cleaning* between extraction and `content` (decides if `raw_sha256 != clean_sha256` ever).
5. Whether `verify-by-recompute` is exposed to extend with the `chunks_root` check, or needs a new verifier entry point.

---

### Resolved 2026-06-24 against the local Archon source (`…/1168f25a-…/scratchpad/archon-cli`)

- **#1 `ProvenanceRecord` — RESOLVED** (`archon-provenance/src/record.rs:67`): `{record_id, artifact_id, artifact_type, operation, input_hashes: Vec<String>, output_hash, parent_record_ids: Vec<String>, tool_name: Option, agent_name: Option, model: Option, parameters_json: serde_json::Value, timestamp, chain_hash}`. §3 maps directly: create a record with `operation="extract_text_spatial"`, `output_hash = chunks_root`, `tool_name=Some(ocr_engine)`, `parameters_json={dpi,lang,cleaning_version}`, `chain_hash` via `chain::chain_hash(...)`; set `doc_artifacts.provenance_record_id` to its `record_id` (field exists, default `""`). The lineage edge uses the fixed `ProvenanceEdgeType` enum (DerivedFrom/Contains/**ExtractedFrom**/Describes/Cites/GeneratedBy/Used) — `ExtractedFrom` fits chunk←source.
- **#2 Cozo `Json` — RESOLVED → JSON-as-`String`.** Archon's relations declare only `String`/`Int`, and `archon-cozo` uses no `Json` column. Store `super_box`/`blocks` as JSON-encoded `String`.
- **#4 Text cleaning — RESOLVED → Archon does NONE.** `build_chunk_artifacts` sets `content_hash = sha256_str(&content)` over raw paragraph text (`chunking.rs:108`); no clean step. So **`clean_sha256` IS the existing `doc_chunks.content_hash`** (drop it from `doc_chunk_hashes`, reference `content_hash`), and `raw_sha256 == content_hash` until a cleaning pass is added. Chunk IDs are **`chunk-{document_id}-{i}`** (`chunking.rs:101`) — key the satellite relations on that.
- **#5 verify-by-recompute — RESOLVED → add a sibling verifier.** `verify_record_chain` (`verify.rs:29`) recomputes `chain_hash` from `(parents, operation, input_hashes, output_hash, tool, model, parameters_json)` and compares to the stored `chain_hash` — it proves **output_hash↔chain_hash**, but does NOT recompute `output_hash` from the chunks. Add a small **`verify_chunks_root(db, record_id)`** that recomputes `chunks_root` from `doc_chunk_hashes.commit_hash` and asserts `== record.output_hash`; run it alongside `verify_record_chain` for end-to-end tamper-evidence. (`verify_artifact`, `verify.rs:60`, already does reaches_source + chain_valid per artifact.)
- **#3 pdfium coordinate origin — STILL OPEN** (a `pdfium-render` crate concern, not Archon source): confirm origin/scale and apply the y-flip when binding word coords to render space.

## 9. Why this is the right shape

- **Additive**, so it can't break Archon's existing retrieval/embeddings.
- **Verification is pure Rust + offline** (the frequent operation); only *ingest-time* bbox capture leans on the OCR engine already in the pipeline.
- **Integrated, not bolted on**: the bbox/hash facts are committed into the existing hash chain, so spatial provenance inherits tamper-evidence — the actual upgrade to Archon's provenance, not a parallel feature.
- Directly delivers the travel requirement: *"determine exactly where on the page a quote came from, for verbatim verification,"* with the source PDF present **or** absent.
