# Ingestion System Comparison — Our God Agent vs Archon

**Date:** 2026-06-24 · **For:** todo #3 (cryptographic-ingestion port decision)
**Method:** 6-agent workflow (2 mapped our `scripts/ingest/*`, 2 researched Archon from a real repo checkout, synthesis + adversarial review). **Critique verdict:** *endorse-with-changes, high confidence* — the load-bearing Archon claims were confirmed against actual source (`archon-provenance/src/chain.rs`, `archon-docs/{retrieval,chunking,schema}.rs`, `archon-knowledge/claim_extractor.rs`, `ocr/rapid.rs`), not just web summaries.

---

## 1. Decisive finding

On the **fanless Apple-Silicon Mac (no CUDA)**, the honest comparison is **our portable CPU logic vs Archon's native self-contained stack** — because our highest-value pieces are GPU/host-bound and **cannot transfer**:

- Marker-pdf vision OCR on the dual-RTX **WRAITH** rig (`:8001/:8002`) — CUDA-only.
- `gte-Qwen2-1.5B` GPU embedder at `:8000`, hard-wired `EMBED_DIM=1536` (`run_ingest_phase2.py:114`).
- ChromaDB — and it's `chromadb.HttpClient(127.0.0.1:8001)` (`phase2:786`), a **host-bound network service**, not even an embedded file store.

Strip those away and the question becomes narrow and answerable: **Archon already wins on acquisition, embeddings, storage, retrieval, cryptographic provenance, and knowledge integration. We win on exactly four GPU-free things — and those are what's worth carrying across.**

**Recommendation: adopt Archon as the base; port only the GPU-free differentiators; reintroduce no Node/Python/CUDA.**

---

## Amendment — 2026-06-24: standalone-travel requirement (overrides the OCR-drop in §6 and upgrades the bbox scope in §4)

New requirement: the Mac must run **fully standalone when traveling (offline)** AND reach the networked PCs for bulk when available (**hybrid**, like the current system). Two consequences:

1. **Marker is NOT dropped.** The standalone Mac needs Marker vision-grade OCR (Bekker numbers, multi-column). Marker runs on Apple Silicon via `TORCH_DEVICE=mps` (layout detection + reading-order + header/footer handling — exactly what scholarly multi-column PDFs need), **but with caveats**: text-detection has a known MPS bug → CPU fallback; `TableRecEncoderDecoderModel` is not MPS-compatible; so it is **functional but slower and finicky** vs the RTX 3090s. It is a **Python + PyTorch sidecar** (multi-GB model weights) — heavier than, but the same pattern as, Archon's existing RapidOCR python-subprocess. **Hybrid:** local Marker-on-Metal when standalone; WRAITH Marker for bulk when networked (same engine, two hosts). **Bekker note:** configure layout to **preserve** running-head Bekker numbers as citation locators, not strip them (our `layout_analyzer.py` stripping is the *opposite* of what's wanted here).

2. **bbox visual provenance integrates INTO `archon-provenance`, not just `archon-docs`** — unified with the dual `raw/clean` hash it becomes a verbatim-verification subsystem stronger than either project has today. See the design note appended to §4 #2.

---

## 2. Capability matrix

| Dimension | Ours | Archon | Verdict |
|---|---|---|---|
| Acquisition / formats | PDF-centric walk + thin text fallback | text/MD/HTML/JSON/XML/YAML/TOML/PDF/PNG/JPEG/TIFF + URLs/dirs, named KB buckets | **Archon** |
| OCR engine | Marker (CUDA, remote) best tier; Tesseract CPU fallback; PyMuPDF native text | Tesseract subprocess + RapidOCR-ONNX (python subprocess) | **Different** — our best is non-transferable; on CPU both ≈ Tesseract |
| Image extraction | PyMuPDF `get_images`/`extract_image` + bbox + sidecars | poppler `pdfimages`/`pdftoppm` + cloud-VLM captioning | **Parity** |
| **TABLE extraction** | camelot→PyMuPDF `find_tables` + `_is_real_table` heuristics; CSV/MD/JSON | **NONE** (`pdf.rs` text-only; tables flattened to paragraphs) | **OURS** ✅ |
| **Layout analysis** | multi-column clustering, derotation, fuzzy header/footer/Bekker stripping, caption↔figure assoc | `pdftotext -layout` text only | **OURS** ✅ |
| **Chunking** | token-aware (800–1200, hard 1400), heading/page-boundary, bbox-carrying | naive `\n\n` split, ~200 char min, no token-awareness, **page lineage preserved** | **OURS** (with a caveat — see §4) |
| Embeddings | `gte-Qwen2-1.5B` 1536-dim, GPU HTTP service | fastembed ONNX **BGE-base-en-v1.5 768-dim, CPU** | **Different** — ours can't run on Mac |
| Vector/graph storage | ChromaDB **HttpClient service**, one `knowledge_chunks` collection, no graph | RocksDB raw-vector + in-mem HNSW cosine **+ CozoDB graph** | **Archon** |
| Retrieval | vector similarity only (ingest layer) | **hybrid exact+semantic fusion + exact-shortcut + rerank** (two stacks: docs 0.45/0.55, knowledge 0.55/0.45) | **Archon** |
| **Crypto provenance / integrity** | SHA-256 only: file-hash → content+path `doc_id[:16]` → dual `clean_sha256`/`raw_sha256` + `cleaning_version`; append-only manifest; verify-by-rehash. **No chain/Merkle/signatures** | **Per-operation SHA-256 CHAIN** (`SHA256(parent\|op\|inputs\|output\|tool\|model\|params)`), typed 7-edge CozoDB prov graph, verify-by-recompute + `reaches_source`, **W3C PROV JSON-LD export** | **Archon** (exceeds ours on lineage; equals on tamper-evidence) |
| **Quotation-fidelity gate** | `QuotationFidelityValidator` + 10-stage gauntlet — but **write-time TS synthesis gates, NOT ingestion** | none on ingested quotes (`reasoning-quality` checks agent *output*) | **OURS** — but it's a write-time capability, not ingestion |
| **Citation / visual provenance (bbox)** | per-chunk/per-block bboxes + per-page super-box; `difflib` quote-level fuzzy highlight (hyphenation/ligature/ellipsis/CropBox tolerant) | **NONE** — page-level (form-feed) lineage only | **OURS** ✅ (signature feature, GPU-free) |
| Dedup / cache | content+path `doc_id` dedup + `cache_manager` | `content_hash` dedup on vector cache | **Parity** |
| Parallelism | GPU-pool ThreadPoolExecutor + dual-GPU routing/retry | native ingest concurrency | **Different** — ours meaningless without Marker GPUs |
| Ingestion → learning/knowledge | **none** (no ingest→knowledge path) | claims/entities/relations/contradictions → CozoDB + governed-learning loop | **Archon** |

---

## 3. The provenance distinction that matters

The comparison keeps two things **separate** because Archon has one and not the other:

- **Cryptographic-integrity provenance** (was this artifact tampered with? what produced it?) — Archon's per-operation hash chain + W3C PROV **exceeds our flat manifest**. Adopt Archon's; drop our manifest format.
- **Scholarly-citation provenance** (*where on the page did this quote come from?*) — Archon has **nothing below page granularity**. Our sub-page bbox + quote-matcher is unique and GPU-free. **This is the port that matters most for the dissertation use case.**

Conflating these would lead to either porting a redundant manifest or skipping the genuinely-missing visual provenance. We do neither.

---

## 4. What to port (priority order) — with corrected effort

1. **TABLE extraction** — *highest priority; Archon has none.* Reimplement the **PyMuPDF `find_tables` + `_is_real_table` prose/TOC-rejection** logic in Rust (NOT camelot — it drags in Ghostscript+OpenCV+Python). Effort **L**.
2. **Sub-page bbox / quote-level visual provenance** — *our signature feature.* Port the bbox schema `{page_num, super-box, blocks[]}` + the `difflib` sliding-window quote matcher. **Effort re-priced upward (L→L/XL):** the critique verified `archon-docs/schema.rs doc_chunks` has only `page_start`/`page_end` (Int) — **no JSON/blob column** — so this needs a **CozoDB schema migration** (and HNSW/vec-table coexistence), not just new extraction code. Also: the `difflib` matcher's hyphenation/ligature/CropBox tolerances accreted over time — budget real reimplementation+verification effort in Rust. **Design (per the standalone amendment): build this INTO `archon-provenance`, not as a side table.** Record the per-chunk bbox as the *output of the extraction operation* in Archon's hash chain, so the spatial fact is itself tamper-evident, and pair it with the dual `raw_sha256` (§4 #5). Result = a verbatim-verification subsystem: a quote can be **byte-verified** against source (`raw_sha256`) **and** **pixel-located** to a page rectangle (bbox+matcher) **and** the whole lineage is tamper-evident (chain). This couples with §4 #5 (chunks currently have no provenance record to attach hashes to), so do them together.
3. **Layout analysis** — multi-column clustering, derotation, fuzzy header/footer/page-number/Bekker stripping, caption↔figure association. Pure CPU/PyMuPDF logic; improves every downstream chunk. Effort **M**.
4. **Token-aware boundary chunking** — token target + heading/page-boundary splits (consider adding overlap, which neither side has). **Constraint:** must **preserve Archon's `page_start`/`page_end` lineage** (it drives citation) — a naive token-greedy repacker that splits across form-feed boundaries would break page-accurate citation. Effort **S–M**.
5. **Dual per-chunk hashing** (`clean_sha256` + `raw_sha256` + `cleaning_version`) — the primitive that makes future verbatim-quotation enforcement possible (`raw_sha256` pins pre-cleaning bytes). **Re-priced from "tiny" to "moderate":** the critique found ingest writes prov *edges* but leaves `provenance_record_id` empty (`ingest_pdf.rs:61`) — there's **no per-chunk provenance record to attach the hashes to**, so this needs a record/field added first. Effort **S–M**.

### Net-new, optional — NOT a port (separated per critique)
- **Content-addressing of artifacts** (Archon keys by `String` record_id) and **ed25519 signing of `chain_hash`** (integrity but not authenticity). Both are net-new hardening ideas surfaced by the comparison — *we have neither either* — so they're explicitly **out of scope for "the port"** and only worth doing if signed/non-repudiable provenance becomes a goal.

---

## 5. Adopt from Archon (do NOT reintroduce ours)

- RocksDB raw-vector store + in-memory HNSW cosine — **not** ChromaDB (host-bound service).
- fastembed ONNX **BGE-base 768-dim CPU** — **not** our GPU `gte-Qwen2-1.5B :8000` / hard-coded 1536-dim. Stronger model = a fastembed model-id swap, not an architecture change. *(Verify-on-Mac: confirm fastembed/ONNX runs CPU-only on aarch64 — likely fine via CoreML/CPU EP, but it's [unverified] for the target.)*
- Per-operation SHA-256 **provenance chain** + typed CozoDB prov graph + W3C PROV export — exceeds our manifest.
- **Hybrid retrieval** (exact+semantic fusion + exact-shortcut + rerank) — we have no equivalent.
- CozoDB **knowledge graph** + claim/entity/relation/contradiction extraction + governed-learning loop — we have no ingest→knowledge path. *(Note: Archon's extractor is hand-written copula/rule parsing — not even regex — so an optional cloud-LLM claim extractor would be a real upgrade, but that's a separate scope decision.)*
- CPU JEPA world-model backend (`CpuJepaBackend`) — never default to `CandleCudaJepaBackend` on the Mac.
- Multi-format acquisition + content-hash dedup.

---

## 6. Drop entirely (do not port)

- ~~Marker OCR + dual-RTX WRAITH rig — CUDA-only.~~ **REVERSED by the standalone amendment:** Marker is needed locally for travel (runs on Metal/MPS, with caveats) and stays on WRAITH for bulk. Keep both.
- `gte-Qwen2-1.5B` `:8000` embedder + `EMBED_DIM=1536` — GPU/host-bound.
- ChromaDB `HttpClient` (`vector_db_1536/`, single collection, no graph) — host-bound service.
- Dual-GPU routing/retry, Marker timeouts, GPU-pool ThreadPoolExecutor (`parallel_ingest.py`) — meaningless without Marker GPUs.
- `camelot-py[cv]` — Ghostscript+OpenCV+Python; reimplement the lighter PyMuPDF path instead.
- The append-only flat `manifest.jsonl` **format** (937 *records* — append-only incl. re-ingests/per-phase, ≈ the ~50-document corpus — drifted schema, `phase=None` gaps, no chaining) — superseded by Archon's chain. Keep only the dual-hash idea.
- The **Node/TS** QualityGauntlet/QuotationFidelityValidator as code — they're write-time synthesis gates, not ingestion. If verbatim-quote enforcement is wanted, reimplement the check in Rust against per-chunk `raw_sha256` (separate, answer-time effort).

---

## 7. Open questions / verify on install

1. Does `archon-docs` chunk schema have room for spatial metadata, or does the bbox port require the **CozoDB `doc_chunks` migration** (confirmed: only `page_start/end` today)? — gates port #2's real cost.
2. On a table-heavy PDF, does Archon **silently flatten** tables to paragraph text or drop them? — sizes port #1's value.
3. Where should the dual `raw/clean` hash attach, given ingest writes **edges** but no per-chunk provenance record (`provenance_record_id` empty)?
4. Is RapidOCR's **python subprocess** acceptable under "self-contained, no Python," or is the Mac path Tesseract-only? (Archon's own stack already has this wart.)
5. Is an **LLM claim/entity extractor** (into CozoDB) in scope, replacing Archon's rule-based extractor — or out of bounds for the ingestion port?
6. Does Archon want **answer-time verbatim-quotation enforcement** at all? If yes, it's a separate Rust validator over `raw_sha256`, not an ingestion change.

---

## 8. Bottom line

**Port four GPU-free Rust reimplementations on top of `archon-docs` — table extraction, sub-page visual provenance, layout intelligence, token-aware chunking — plus the dual-hash primitive. Adopt Archon's storage/embeddings/retrieval/provenance/knowledge wholesale. Drop the entire CUDA/host-bound stack and the manifest format.** Of the ~15 ingestion dimensions, Archon wins or ties on 11; we lead on 4, and those 4 are exactly the portable ones. This is a **small, surgical port**, not a migration of our pipeline.
