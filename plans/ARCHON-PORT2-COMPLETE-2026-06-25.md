# Archon Port #2 (Ingestion) — Wire-in COMPLETE (2026-06-25)

Supervised session, continuing the overnight handoff. The **Rust/Cozo substance of port #2 is
done and test-gated on WSL**; the only residue is what genuinely needs real Marker on the
Mac/WRAITH (run Marker on a PDF + the live-corpus parity diff). Everything is **uncommitted** on
`dissertation-ports` for review (standing rule: commit only when asked). Fresh backup:
`/home/dalton/projects/.backups/20260625-074457-archon-port2-wirein/`.

## Locked design decisions (from this session's Q&A)
This is a **NEW deploy → build the BEST system**, not the conservative/additive one; reingest/reprocess is fine.
And it must be **platform/device-AGNOSTIC** (Mac MPS + NVIDIA CUDA + CPU); endgame = convert the whole god-agent to Rust.
- **token_aware chunker is the DEFAULT** (`page_anchor` kept only as a comparison/fallback).
- **Integrity layer runs on ALL ingest** (both chunkers): per-chunk hashes + `chunks_root` + an
  `extract_text_spatial` provenance record, and it fills the previously-empty `provenance_record_id`.
- **Bekker / page-number locators are STRIP + CAPTURE** (leave embed text, become first-class anchors).
- **Marker sidecar is device-agnostic** (auto cuda→mps→cpu, override), transport orthogonal
  (local subprocess default / WRAITH HTTP / pre-extracted JSON).

## What was built (all test-gated)
| Phase | Deliverable | Where |
|---|---|---|
| S-0 | `marker.rs` — Marker JSON → `Vec<Block>` (faithful `_walk_blocks`: page-id N→N+1, html-strip, doc order) + `parse_marker_str` | archon-ingest-ext |
| Port T | `table.rs` — `parse_table_html` + `is_real_table` gate; Marker `Table` blocks → `[TABLE]` chunks (prose false-positive → text, no data loss) | archon-ingest-ext |
| S-3 | `layout.rs` — Bekker/page-number locator capture (strip+capture); Bekker regex broadened (see deviations) | archon-ingest-ext |
| V-0 | `doc_chunk_spatial` / `doc_chunk_hashes` / `doc_locators` satellite relations + store insert/get/join fns | archon-docs schema.rs/store.rs/models.rs |
| S-1 | `block_chunking.rs` — `ChunkOut→ChunkArtifact` (id `chunk-{document_id}-{i}`) + bbox→spatial + locator persist; `blocks_from_text` fallback | archon-docs |
| V-1 | `provenance_chunks.rs` — `commit_hash` → `chunks_root` → `extract_text_spatial` record + `verify_chunks_root` tamper check | archon-docs |
| Sidecar | `marker_source.rs` (subprocess/http/pre-extracted) + `scripts/archon_marker_sidecar.py` (device-agnostic, `--selftest`) | archon-docs + scripts |
| Wire-in | `run_pdf_ingest_pipeline` routes token_aware via Marker-if-configured (real bboxes) else flat-text fallback; integrity on all ingest | archon-docs ingest_pdf.rs |
| Policy | `PdfPolicy.chunker` (default `token_aware`) + `marker_sidecar` + `marker_device` + loader | archon-policy |

## Deviations from the Python reference (intentional, documented in code)
1. **`page_end` corrected** — a flushed chunk's `page_end` is the last page it actually contains,
   not (as in `chunk_marker_json`) the *next* chunk's first page. Citation-accurate. Your call this session.
2. **Bekker regex broadened** — reference `\d{2,3}[a-b]?\d{0,2}` misses 4-digit Aristotle Bekker
   numbers (`1147a`) and conflates letterless numbers with page numbers. Now `\d{1,4}[ab]\d{0,3}`
   (column letter required) → captures real Bekker citations, keeps them distinct from page numbers.

## Test status (WSL, login shell + `LIBCLANG_PATH=/usr/lib/llvm-18/lib`)
- `cargo test -p archon-ingest-ext` → **29 green** (parser, chunker incl. code-point + pairwise parity, table, layout, golden gate, sidecar contract)
- `cargo test -p archon-docs --lib` → **189 green** (incl. V-0 roundtrips, S-1 chunking, V-1 tamper, locator strip, marker source)
- `cargo test -p archon-policy` → **5 green**
- `cargo build --bin archon` → **Finished, clean** (full binary compiles with all wiring)
- **Golden gate:** `chunk_parity_matches_python_reference` reproduces the real Python `chunk_marker_json`
  output exactly (verified via `scripts/chunk_parity_check.py`, no torch).
- **Env note:** installed `libclang-dev` (bindgen needs `libclang.so`; was absent). Build cargo via a
  login shell (`bash -lc`) so the zstd-sys cache/env matches; a partial-env shell triggers a recompile.

## How to use
```toml
# .archon/config.toml  → [policy.docs.pdf]
chunker = "token_aware"                 # default; "page_anchor" = legacy comparison mode
marker_sidecar = "scripts/archon_marker_sidecar.py"   # set on the Mac to get real bboxes
marker_device = "mps"                   # optional; omit → auto cuda→mps→cpu
```
Unset `marker_sidecar` (e.g. on WSL) → token-aware chunking over flat `pdftotext` text + full integrity,
no bboxes. Set it on the Mac → Marker blocks with real bboxes into `doc_chunk_spatial`.

## Mac / WRAITH residue (needs real Marker — NOT done here, do NOT assume complete)
1. **Run Marker on a real PDF** (Apple Silicon MPS / NVIDIA CUDA) end-to-end and confirm the sidecar's
   JSON field mapping against the installed Marker version: block `id` `/page/N/` pattern, `html` vs `text`
   field, and **`bbox` vs `polygon`** (the script currently emits `bbox`; map polygon→bbox if needed). Spec [CONFIRM] #3.
2. **Live-corpus parity diff** — run `chunk_marker_json` vs Rust `chunk_blocks` on real Marker JSON from a
   handful of corpus PDFs (multi-column, hyphenated, footnote, von Uexküll-size) and confirm boundaries match
   (modulo the documented `page_end` correction).
3. **Flip + re-ingest** the corpus under `token_aware` when ready (re-chunks + re-embeds — expected).
4. **Out of scope this session (later V-phases):** `verify-quote` CLI + `find_fragment_bboxes`/`locate_quote`
   matcher (V-3/V-4), `--render` overlay + pdfium y-flip (V-5), optional `doc_page_words`.

## Adversarial review (5-lens panel, per-finding verified — 17 confirmed of 21)
**Fixed this session (7 substantive, each test-locked):**
1. **`est_tokens` byte→code-point** (`chunk.rs`) — was `s.len()` (UTF-8 bytes); Python uses `len()` =
   code points. On the Greek/German corpus this ~doubled the estimate and shifted every flush
   boundary (→ different chunks/hashes/embeddings). Now `chars().count()`. Regression test added.
2. **`merge_undersized` chained→pairwise** (`chunk.rs`) — Python is strictly pairwise (`i += 2`);
   the port chained runs of adjacent undersized chunks (`[A+B+C]` vs reference `[A+B, C]`). Fixed +
   test.
3. **Reprocess clear path** (`reprocess.rs`) — now deletes `doc_chunk_spatial` / `doc_chunk_hashes`
   (joined via doc_chunks before deletion) and `doc_locators`; were leaking stale rows on re-ingest.
4. **Title markers restored** (`table.rs`) — re-added the 5 dropped Python markers incl.
   `princeton university` / `bollingen series` (the Aristotle Complete Works publisher).
5. **Marker-path artifact hash** (`block_chunking.rs`) — artifact `content_hash` now hashes the actual
   ingested (clean) block content, not the pdftotext layer.
6. **Zero-chunk guard** (`block_chunking.rs`) — if every block is a standalone number, keep the content
   instead of stripping to zero chunks.
7. **Provenance input hash** (`ingest_pdf.rs`) — `extract_text_spatial` `input_hashes` now use the true
   source-file hash (`doc_sources.content_hash`), not the extracted-text hash; param renamed.

**Documented, intentionally NOT changed (known limitations / residue):**
- **Image-OCR chunk integrity gap** — chunks from `pdf_image_enrichment` (artifact `pdf-image-ocr-*`)
  are persisted *after* `chunks_root` is built, so they get no `doc_chunk_hashes` and are not in the
  text artifact's root. Integrity currently covers the primary text artifact's chunks; folding image-OCR
  chunks in is a follow-up (separate later pass).
- **Cross-DEVICE hash nondeterminism** — Marker bbox floats come from a neural layout model; cuda/mps/cpu
  kernels are not bit-identical, so `spatial_hash`/`commit_hash`/`chunks_root` are reproducible via
  **verify-by-recompute** (stored hashes) but NOT by re-extracting on a different device. This is correct
  and sufficient for tamper-evidence; do not expect device-independent re-derivation.
- **Marker vs pdftotext page count** — page records (`doc_pages`) come from pdftotext; chunk pages on the
  Marker path come from Marker block ids. Reconcile/warn on mismatch when validating on the Mac (spec [CONFIRM] #1).
- **`:update` precondition** — `set_artifact_provenance_record` needs an existing artifact; always true at
  the call site (artifact inserted before integrity).
- **NOT implemented (out of scope, tracked):** verbatim V-3 (`find_fragment_bboxes`/`locate_quote`),
  V-4 (`verify-quote`/`provenance` CLI), V-5 (`--render` overlay + pdfium y-flip, `doc_page_words`);
  the PyMuPDF `find_tables` non-Marker fallback; Port L(a) header/footer fuzzy-dedup, L(c) multi-column
  reading order, L(d) caption→figure association. "Port #2 complete" means the chunk/table/locator/
  integrity substrate — NOT quote localization/verification.

**Post-fix verification:** `archon-ingest-ext` 29 · `archon-docs` 189 · `archon-policy` 5 — all green;
`cargo build --bin archon` clean.
