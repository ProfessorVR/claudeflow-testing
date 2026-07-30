# 06 — A/B ingestion comparison: old pipeline vs S1–S5-hardened pipeline

**Run 2026-07-30 on user instruction.** Two documents, chosen as the two extraction
regimes: a **scanned book** (Aristotle, *Ars Rhetorica*, ed. Rudolf Kassel — 279-page
Greek critical edition) and a **born-digital paper** (King & Salvo,
*Phenomenological Evaluation…*, 16 pp — one of the six ligature-damaged documents).
Method: capture BEFORE metrics from the E0 probe table + corpus-wide verbatim probes;
delete + full re-ingest through the hardened pipeline (pypdfium2 5.12.1, S1 engine
normalization, S5 OCR status); build the S2/S3 sentence layer; re-measure identically.

## Results

### Born-digital arm — King & Salvo (new doc `doc-f86e8ee3`)

| Metric | BEFORE (old ingest) | AFTER (hardened) |
|---|---|---|
| Ligature-dropout hits in stored text | **49** | **0** |
| Verbatim probe: *"students who felt the 3D VR versions were the most beneficial"* (the TRUE reading) | **not-found corpus-wide** (store held `benefcial`) | **exact, sim 1.000, p.8, with bbox and byte offsets (10, 71)** |
| Sentence layer | none | **766 sentences · 74% with tight bbox · 100% with page** · 50/50 seeded re-slice verified |
| Chunks | 57 | 57 (stable) |
| Chunk super-box (`doc_chunk_spatial`) coverage | 26.3% | 26.3% (see finding 2) |

### Scanned arm — Ars Rhetorica, Kassel (new doc `doc-8d2dccf7`)

| Metric | BEFORE (old ingest) | AFTER (hardened) |
|---|---|---|
| Chunks | **2,006** (fragment shrapnel) | **120** coherent chunks |
| Chunk spatial coverage | **5.9%** | **100.0%** (120/120) |
| Sentence layer | none | **5,633 sentences · 100% with bbox · 100% with page** · 100/100 seeded re-slice verified |
| Bekker running-head locators | 364 | 352 (capture preserved through re-ingest) |
| Verbatim probe: *"ῥητορική ἐστιν ἀντίστροφος"* (Rhet. I.1 opening) | **not-found** (old OCR text unusable) | **fuzzy sim 0.962, p.21, with bbox** — the scan now reads real Greek |

## Findings

1. **The hardened pipeline converts both failure regimes.** The born-digital arm goes
   from a citation-fatal invisible corruption (the paper's own author could not verify
   their own sentence) to exact byte-addressed verification. The scanned arm goes from
   noise (2,006 junk fragments, 6% spatial) to a fully spatially-addressed, sentence-
   segmented text with its Bekker apparatus intact.
2. **The binding bbox metric for sentence granularity is sentence-bbox coverage, not
   chunk super-box coverage.** King's super-box rate stayed 26% while 74% of its
   sentences got tight boxes — sentence boxes derive from the *block* layer
   (`doc_chunk_blocks`), which is far richer than the coarse `doc_chunk_spatial`
   relation. E0's headline "63.5% spatial" understates real addressability; the F1
   acceptance metric should be sentence-bbox coverage.
3. **The scanned arm's residual 3.8% similarity gap is the OCR-quality case the
   multi-engine question predicted:** surya read `ῥητορική` as `ἡητορική` (rho→eta)
   and the Bekker superscript `1354ᵃ` as `1354*` — a *successful* OCR pass with
   subtle artifacts that no failure-state check can catch. This is the concrete
   argument for the OCR quality-arbiter design (see §OCR below).
4. **Pipeline guardrail worth keeping manual:** on the first Kassel attempt the
   ingest itself warned that its 261 detected "figures" were probably page-scans and
   that enriching them would waste the VLM and duplicate text — a warning `-y`
   suppresses. F1's batch runs must classify scan-vs-figure BEFORE `-y` ingestion
   (policy `extract_embedded_images=false` for scanned books; it was toggled for this
   run and restored).
5. **Operational costs measured:** born-digital re-ingest ≈ 3 min end-to-end; the
   279-page scanned Greek book ≈ 12 min through Marker/surya on the RTX 5090 (with
   figure-enrichment correctly disabled); sentence-layer build for both: seconds to
   ~1 min; full-corpus sentence build runs ~2–3 h as a background batch (per-chunk
   write-lock cycling is the cost — batching the rm+put per *document* is the obvious
   F1 optimization).
6. **Two crashes taught two hardening lessons** (both fixed): the sentence builder's
   `:rm` needed the cozo retry guard (a concurrent reader must back it off, not kill
   a 227-doc build), and `docs delete` needed a sentence-layer purge block (orphan
   prevention). A residual orphan sweep runs after the full rebuild completes.

## OCR quality arbiter (the user's mid-session question, answered by this data)

S5's three recorded outcomes (ok / no-text / failed) cover *hard* failures. The
Kassel result shows the fourth state: **plausible garbage from a successful pass**.
Proposed F1 addition (S8): score every successful OCR text (real-word rate against a
language-appropriate lexicon, impossible-sequence rate, engine confidence where
exposed); below a floor, run a SECOND engine of a different family (tesseract and
RapidOCR are already cascaded on failure — promote the cascade to fire on low
quality too); on disagreement, a third arbiter (the VLM reading the crop, or
agreement voting); record `engine_used + quality_score` per image/page in
`doc_image_ocr_status`. For Greek specifically, the rho/eta confusion class is
detectable by lexicon scoring — `ἡητορική` is not a Greek word.

## Verdict

Quantified, the hardened pipeline is not an incremental improvement — it flips both
documents from *unverifiable* to *verifiable*: exact byte-addressed quotation on the
born-digital arm, near-verbatim page+bbox addressing with preserved Bekker apparatus
on the scanned arm, and a verified sentence layer on both. The F1 re-ingest should
proceed on this pipeline, worst-first (the 6 ligature-damaged, then the 39
low-coverage documents), with finding 2's metric as the acceptance surface and S8 as
the follow-on for scanned-book OCR quality.
