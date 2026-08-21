# Archon corpus flip + full-pipeline test — SCOPE (2026-07-01)

> **⚠ CROSS-CUTTING (2026-07-01, user): the corpus is largely SELF-SCANNED books** — full-page
> raster image per page + a user-OCR'd text layer (Uexküll = 281 pp / 281 full-page scans / text
> layer present). Implications:
> - **Content is handled right:** the text layer triggers the Marker path, and Marker re-does
>   layout + OCR + bbox on the page scans. Nothing lost.
> - **Image enrichment is WRONG for these:** each full-page scan is treated as a "figure" → (1)
>   re-OCR'd → `pdf-image-ocr-*` chunks that DUPLICATE the page text (and now, via #1, bloat
>   `chunks_root`); (2) VLM'd → expensive + useless. Must be fixed before the flip.
> - **FIX (new pre-flip item):** detect full-page scans (heuristic: `#embedded_images ≈ #pages` AND
>   a text layer is present → self-scanned book) → **skip image OCR + VLM**; add a policy escape
>   hatch. Removes duplicate-OCR bloat + wasted VLM.
> - **VLM reality:** on scanned books figures are baked INTO the page scans — no discrete embedded
>   images to describe. Current embedded-image VLM has nothing useful to do here. Real figure
>   descriptions for scanned books = a NEW path: VLM Marker's detected **figure regions** (crop the
>   figure bbox from the page → describe). Decide if wanted.
> - So: Uexküll's A-test becomes Marker + split/merge + integrity (enrichment skipped); the VLM test
>   needs a born-digital doc with real figures, or the figure-region path.

Two phases: **(A)** a single-document full-pipeline validation on the 5090 **and** the Mac (do this
first — it de-risks everything), then **(B)** the full corpus flip. A is the "does the whole chain
actually work end-to-end on real hardware" gate; B is the bulk re-ingest once A passes.

Ground truth (verified):
- `archon docs ingest <path>` takes **one file** (no dir/batch); `archon docs reprocess {target}`
  re-runs. archon bin is **built on the 5090** (`target/debug/archon`, 393 MB); **not yet on the
  Mac** (prereq: build it — deps already compiled from the example builds, so ~minutes).
- Ingest writes a **local Cozo/SQLite DB** (`open_db()`); embedding is in-process fastembed (CPU) or
  deferred — no external service needed for ingest.
- Pipeline order: extract → (if text layer) Marker chunks + bbox + **early chunks_root seal** →
  image OCR + VLM → **re-fold image chunks into chunks_root** (`1d9cb752`). Marker only runs when
  `pdftotext` yields a text layer.

---

## Part A — Single-document full-pipeline validation (FIRST)

### A.1 Test document

**Uexküll — `von Uexkull … A Foray … [Clean Copy].pdf`** — 189 MB, **281 pages**, **has a text
layer** (`pdftotext` works → the Marker + integrity path runs, NOT the deferred image-only gap),
**281 embedded raster images = one full-page scan per page**.

This is a scanned book with an OCR'd text layer. Consequences:
- ✅ Exercises Marker (text layer present), the integrity re-fold at scale, and — with a forced VRAM
  budget — page-range split/merge. It's also the named golden-corpus hard case, so we need it
  eventually anyway.
- ⚠️ Its "images" are **full-page scans, not discrete figures** — so VLM would describe 281 page
  images (~5–15 s each → **~25–70 min of VLM alone**, on top of Marker over 281 pages). The
  descriptions ("a page of text with a diagram") are low-value, but the run still validates the
  VLM + integrity plumbing at scale.

**Recommendation — a two-doc A phase:**
1. **Fast VLM smoke** on a *short, born-digital doc with discrete figures* (game-studies paper with
   screenshots, or any corpus PDF with real charts/diagrams — I'll pick one with variable
   images-per-page, i.e. actual figures not page-scans). ~5–15 min. This is the *meaningful* VLM
   test (real figure descriptions + integrity re-fold on a handful of image chunks).
2. **Uexküll stress run** for Marker-at-scale + **split/merge** + integrity-at-scale + cross-device.
   Run **VLM-off** here for speed (the smoke already covered VLM), OR VLM-on if you want the full
   281-image path — your call on the ~1–2 h cost.

*(If you'd rather keep it to one doc, Uexküll-with-VLM covers everything but costs ~1–2 h/machine.)*

### A.2 What it must exercise + how we verify each

| Capability | How to trigger | Verify |
|---|---|---|
| Marker layout + real bbox | text-layer doc + `marker_sidecar` set | chunks have `coord_space="marker"`, non-sentinel bboxes |
| **Page-range split/merge** | **force** `marker_memory_budget_mb ≈ 7000` (else 281 pp fits whole on 31 GB/24 GB) | contiguous page coverage 0..N-1, no gaps/dupes; block count sane |
| Image OCR | doc with images | `pdf-image-ocr-*` chunks exist |
| VLM figure descriptions | `docs.vlm.enabled` + ollama up | `image_description` rows; non-empty text |
| **Integrity re-fold** (#1) | doc with text + images | `verify_chunks_root` = true; an image-OCR chunk is IN the root (tamper it → verify flips) |
| Retrieval | after ingest | `archon docs search` returns text + image chunks |
| Cross-device (CUDA vs MPS) | run on both | compare **schema** (chunk count, page coverage, integrity pass) NOT hash digests — bboxes differ by device (§8, by design) |

### A.3 Execution
- **Both machines, in parallel** — they're independent hosts, so yes: two background ingests at
  once (5090/CUDA + Mac/MPS). No contention between them.
- **Prereqs:** (1) build `archon` on the Mac; (2) set the Mac's VLM `keep_alive="0"` + `num_ctx≈4096`
  (the new knobs — the 22 GB default model would otherwise squeeze Marker on 24 GB); (3) a
  scratch/fresh DB per run so the test is clean and repeatable.
- Drive: `archon docs ingest "<uexküll>.pdf"` under a policy with `marker_memory_budget_mb` set;
  capture logs; then run the A.2 verifications.

### A.4 Success criteria
All A.2 rows green on **both** machines; split/merge produces contiguous coverage; `verify_chunks_root`
true including image chunks; retrieval returns results; no crashes. Schemas match cross-device (hashes
may differ — expected).

---

## Part B — Full corpus flip (AFTER A passes)

### B.1 Discovery
Enumerate the corpus PDFs (corpus lives at `claudeflow-testing/corpus/{metaphysics,new_media,
rhetorical_ontology,…}` — ~50 PDFs per the prior v7 ingestion). Produce a manifest: path, size,
pages, has-text-layer, image count. Flag pure-scans (empty text layer → the **image-only root gap**,
a known follow-up — those docs get chunks but no root until that's built).

### B.2 Driving the flip
No batch CLI → a **sequential shell loop** over the manifest calling `archon docs ingest` (or
`reprocess`) per PDF. Sequential, not parallel across docs: each doc's Marker/VLM already saturates
the GPU, so concurrent docs would contend. Long-running → background + progress logging.

### B.3 Idempotency
`archon docs reprocess {target}` exists for re-ingest; confirm whether a second `ingest` of the same
file upserts (deterministic text chunk-ids `chunk-{document_id}-{i}` suggest yes for text; image
chunk-ids embed a uuid so they'd duplicate on naive re-ingest — reprocess or clear-then-ingest is the
clean path). Decide: fresh DB for the flip, or reprocess in place.

### B.4 Cross-device strategy (the key efficiency point)
Do the **flip ONCE on the 5090** (most VRAM, fastest) → that DB is the **system of record** →
**transfer** it to the Mac/laptop. Per the device-hash portability finding, *transfer is safe*; only
*independent re-ingest* on a different device diverges (neural bbox floats). So Part A proves the
pipeline runs correctly on each device; Part B's actual corpus is ingested once on the 5090 and synced.

### B.5 Verification
Per-doc `verify_chunks_root`; a retrieval smoke across N queries; a coverage report (docs ingested,
chunks, image chunks, VLM descriptions, integrity pass-rate, any pure-scan docs skipped).

---

## Decisions needed from you
1. **Test doc:** (a) two-doc A (fast discrete-figure smoke + Uexküll stress, VLM-off on Uexküll) —
   *recommended*; or (b) Uexküll only, VLM-on (~1–2 h/machine, covers everything).
2. **Force split/merge?** Set `marker_memory_budget_mb≈7000` so Uexküll actually chunks on the
   5090/Mac (otherwise 281 pp fits whole and split/merge isn't exercised on these boxes). Recommended: yes.
3. **Flip scope:** whole corpus, or a subset first? And fresh DB vs reprocess-in-place.
