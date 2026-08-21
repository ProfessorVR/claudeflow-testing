# Adoption #2 (page-dimension coverage) — implementation + dry-run validation (2026-07-01)

Status: **IMPLEMENTED + corpus-validated** on `archon-cli` branch `dissertation-ports` (local, unpushed).
Default detector remains `aspect` (zero production behavior change). This doc records the work-item #5
dry-run so the future default-flip decision is data-backed.

## What shipped (per `plans/archon-page-dimension-coverage-plan.md`)
- `crates/archon-docs/src/pdf_scan.rs` (NEW): `ScanDetector`, `CoverageVerdict`, `classify_by_coverage`,
  `classify_scan`, `resolve`, `page_dimensions`, `get_media_box` (lopdf; inheritance walk + depth-10
  cycle guard + array guard + Integer-or-Real numeric — the plan's `as_f64()` snippet would have
  rejected integer MediaBoxes, the common case).
- `pdf.rs`: `PdfImagesListEntry` gains `x_ppi`/`y_ppi`/`bytes` (parsed from `pdfimages -list` cols 12/13/14);
  `classify_pdf_enrichment(path, &PdfPolicy)` delegates to `classify_scan`, returns BOTH verdicts.
- `pdf_image_enrichment.rs`: `enrich_pdf_images` gains `scanned_override` — coverage mode drives the
  skip decision; aspect (default) path byte-identical.
- `ingest_pdf.rs`: computes the override from policy+path; coverage mode passes the SAME selected
  verdict the report shows (incl. aspect fallback when page dims unreadable) → report == pipeline.
- `archon-policy`: `PdfPolicy.scan_detector` + loader wiring (`RawPdfPolicy` + validated `apply_pdf`;
  the field was silently dropped until wired into the Raw layer).
- `src/command/docs.rs`: pre-ingest banner shows BOTH detector verdicts + peak coverage % +
  low-confidence + a loud DISAGREE line.
- Report/classifier now apply the pipeline's image gate (`extract_embedded_images` +
  `min_image_dimension`/`min_image_bytes` via the size-column proxy) so the report tracks what
  enrichment will actually do — closes 6 confirmed review findings about report↔pipeline divergence.

Tests: archon-docs lib **225 pass** (+ new pdf_scan/parser/retained_images cases); archon-policy **+3**
loader cases; clippy clean (touched files); fmt clean.

## Dry-run oracle (`archon-cli/scripts/coverage_oracle.py`, pypdfium2 ground truth)
Ran over **161 corpus PDFs**. Raw table: `plans/archon-adoption2-oracle-results-2026-07-01.txt`.

### Proxy accuracy — the ppi-proxy is decision-exact
- `coverage_proxy` (poppler ppi) vs `coverage_true` (pdfium placement rects): **median 0.0000, mean
  0.0017, p90 0.0007, max 0.125**. **158/161 (98.1%) within ±0.02.**
- The 3 over-tolerance docs (Salvo MA 0.082, Beyond-Narrative 0.125, Morton 0.023) **do not flip any
  verdict** — cov(px) and cov(true) agree (both born-digital) on all three.
- ⇒ The ppi-proxy reproduces true placement; content-stream parsing is unnecessary (plan confirmed).

### Detector agreement (aspect vs coverage), 161 docs
| aspect | coverage | count | meaning |
|---|---|---|---|
| False | False | 95 | both born-digital (agree) |
| True  | True  | 36 | both scanned (agree) |
| **False** | **True** | **29** | **coverage catches a scanned book aspect MISSES** |
| True  | False | 1  | Konstan — coverage misses a scan aspect catches |

- **29 coverage wins**: low-DPI / sub-1000px scans that aspect's pixel floor misses — Burke ×3
  (Grammar/Rhetoric/War of Words), the whole Aristotle set, Wendt (Design for Dasein), Gibson,
  Lefebvre, Rickert, Gross, Hawk, Fortenbaugh, Caston, Hussey, Heidegger (Kant), etc. All show
  cov_scans = 100% of pages → solid full-page scans. Under the shipped `aspect` default these would be
  **wrongly enriched** at the corpus flip (duplicate page OCR + wasted VLM).
- **1 coverage miss (Konstan)**: a scanned book whose page images are **margin-cropped to the text
  block** (e.g. p4 1352×2134px@300ppi = 324×512pt on a 375×610pt page → 0.73 coverage). Cropped scans
  sit at ~0.70, under the 0.80 page-scan threshold, so coverage reads born-digital. Aspect catches it
  (large + page-shaped).

## Recommendation for the corpus flip (queue item #3)
Neither detector alone is complete: aspect misses low-DPI scans (29 docs); coverage misses
margin-cropped scans (Konstan). The data argued for a **union verdict** — a page is a scan if
`is_page_scale (aspect)` OR `coverage ≥ 0.80` — which correctly classifies all 30 divergent docs.

**UPDATE: the union detector is now IMPLEMENTED + committed** (`de20f89f`, `scan_detector = "union"`).
Validated end-to-end: Konstan → SCANNED (via the aspect half), the 29 low-DPI books → SCANNED (via
the coverage half), every agreeing doc unchanged. Set `scan_detector = "union"` in the real
`.archon/policy.toml` for the corpus flip (the shipped default still ships `"aspect"` for safety).

**Do NOT run the corpus flip on the `aspect` default** — 29 scanned books would be wrongly enriched.
Use `scan_detector = "union"`.
