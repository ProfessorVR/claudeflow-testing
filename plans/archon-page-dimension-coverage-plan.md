# Implementation Plan — Adoption #2: true page-dimension coverage (with A/B harness)

## Goal
Replace the pixel-dims **DPI-proxy + aspect** heuristic for detecting page-scale images with a
**true coverage %** (how much of the page the image actually occupies). This removes the two
fragilities the earlier work exposed:
- the **DPI coupling** in the size floor (`min side ≥ 1000 px` assumes ≥150 DPI — a low-DPI scan is missed);
- the **aspect-range boundary** (Uexküll's scans measured 1.58–1.61; the 1.6 bound was too tight and had to be widened to 1.7, and any fixed range is a guess).

Per the user's instinct: **keep the current heuristic and add coverage as a *second* classifier so we
can A/B them** — don't rip out the working one.

## Key simplification (important)
Coverage would normally need each image's **placement rectangle** on the page (from the content-stream
`cm`/`Do` transform) — hard. But we don't need to parse content streams: **`pdfimages -list` already
reports each image's `x-ppi`/`y-ppi`** (the effective resolution *as drawn*). So:

```
drawn_width_pt  = pixel_width  * 72 / x_ppi
drawn_height_pt = pixel_height * 72 / y_ppi
coverage        = (drawn_width_pt / page_width_pt) * (drawn_height_pt / page_height_pt)
```

Sanity check on Uexküll: 1303 px @ 241 ppi → 1303·72/241 = **389 pt drawn width**, and the page is
**389 pt wide** → width coverage = 100%. So the ppi (already in the list we parse) + the page
`MediaBox` give true coverage **without** content-stream parsing. A page-scan is `coverage ≥ ~0.80`;
a figure is well below. No DPI assumption, no aspect guess.

The only new input is **per-page dimensions** (MediaBox, in points). That's the anchoring question.

---

## Anchoring: Rust vs Marker sidecar

### Option A — anchor in Rust (poppler tools or a Rust PDF lib)
Page dims via `pdfinfo` (or a Rust crate that reads the MediaBox); image ppi/dims via the
`pdfimages -list` we **already** parse (`crates/archon-docs/src/pdf.rs:parse_pdfimages_list`).

**Pros**
- **Lives where the decision lives.** Classification happens in `enrich_pdf_images` *and* in the new
  pre-ingest CLI report — both Rust, both before/independent of Marker. No extra process.
- **Cheap + no model load.** `pdfinfo`/`pdfimages` are milliseconds; the Marker sidecar loads GB of
  surya models. Classification must be fast (runs on every doc, and in the confirm pre-pass).
- **Reuses existing plumbing.** We already shell poppler and parse its list output.
- **No cross-language contract.** No new JSON field to keep in sync between Rust and the sidecar.
- **Works when Marker is off** (e.g. `marker_sidecar` unset → pdftotext path still needs the scan
  decision).

**Cons**
- **Per-page MediaBox from `pdfinfo` is coarse** — `pdfinfo` reports one page size unless you pass
  `-f/-l` per page; mixed-page-size PDFs need a loop or a Rust MediaBox reader (lopdf/pdfium).
- Adds a small dependency surface (another poppler call, or a Rust PDF crate if we avoid shelling).
- Poppler-tool availability is an install requirement (already true for `pdftotext`/`pdfimages`).

### Option B — anchor in the Marker sidecar (Python / pypdfium2)
The sidecar already opens the PDF; `pypdfium2`/`fitz` expose `page.rect` (dims) and image placement
trivially. Have it return `{page: (w_pt, h_pt)}` (and optionally per-image placement rects).

**Pros**
- **Most accurate + trivial in Python** — real page rects and true placement rects, per page, no ppi
  proxy needed.
- The sidecar **already parses the PDF**, so page dims are "free" during a Marker run.

**Cons**
- **Wrong lifecycle.** The scan/enrich decision must be made *before* (and independent of) Marker —
  in the CLI pre-pass and for the pdftotext path. The sidecar loading surya models just to return
  page dims is a heavy, ~minute cost for a millisecond need.
- Would require a **separate lightweight sidecar mode** ("dims only, don't load models") — i.e. a new
  Python entrypoint + a cross-language JSON contract to maintain.
- **Device/venv coupling.** The sidecar needs its Python venv present; classification would then fail
  or degrade on hosts where only poppler is installed.

### Recommendation
**Anchor in Rust (Option A)**, using `pdfimages -list` ppi + page dims. It matches where the decision
is made, is fast, and needs no model load or cross-language contract. If we ever want true placement
rects (rare — the ppi proxy is already exact for full-page images), add a **dims-only** flag to the
sidecar later as an optional precision upgrade — but don't gate the common path on it.

---

## A/B harness (per the user's instinct — keep both, compare)
Do **not** replace `is_scanned_page_images`. Instead:

1. Keep the current classifier as `classify_by_aspect_heuristic(images, page_count)` (the shipped one).
2. Add `classify_by_coverage(images_with_ppi, page_dims)` as a **separate** function, returning the
   same verdict type (`scanned_book` bool + per-image page-scale flags + a coverage number).
3. A thin `classify_pdf_enrichment()` runs **both**, uses one as the ACTIVE decision (config-selectable:
   `[policy.docs.pdf] scan_detector = "aspect" | "coverage"`, default `aspect` until coverage is
   validated), and **logs any DISAGREEMENT** (loud): *"aspect=scanned, coverage=born-digital on doc X —
   review."* That divergence log is the A/B signal.
4. Feed the new pre-ingest confirmation report (item #1) with **both** verdicts side by side, so a
   human sees when they differ before committing.
5. Once coverage agrees with aspect on the corpus (or is demonstrably better on the disagreements),
   flip the default to `coverage` and keep `aspect` as the fallback for PDFs where `pdfimages` can't
   report ppi.

**Why A/B and not a swap:** the aspect heuristic is now validated on King (born-digital) and Uexküll
(scanned). Coverage is more principled but unproven on the real corpus (odd page sizes, vector-drawn
"images", multi-image pages). Running both with a divergence log lets the corpus itself tell us which
is right, at zero risk to the shipped path.

## Work items (sequenced)
1. **Page dims via `lopdf` (pure Rust), NOT a `pdfinfo -f/-l` loop.** `pdfinfo` reports one page size
   for the doc; per-page dims need a spawn-per-page loop (O(n) subprocesses) + a version-drifting
   text parser. `lopdf::Document::load` reads MediaBox per page, handles mixed page sizes natively.
   Two required guards in the MediaBox reader (malformed PDFs are the norm in a scanned corpus):
   - **Inheritance walk** — MediaBox is inheritable; if a `Page` dict lacks it, climb `Parent` (most
     scanners set MediaBox once on the tree root, so the naive `page.get(b"MediaBox")` returns empty
     on exactly the uniform scanned books we care about).
   - **Cycle guard + array guard** — cap the Parent climb at depth 10 (terminates firmware-bug
     `Parent` loops; real trees are 1–3 deep), and index MediaBox with `arr.get(2)?` (not `arr[2]`)
     so a truncated `[…]` degrades to `None` instead of panicking.
   ```rust
   fn get_media_box(doc: &lopdf::Document, page_id: lopdf::ObjectId) -> Option<(f64, f64)> {
       let mut cur = page_id;
       for _ in 0..10 {                       // cycle guard
           let d = doc.get_object(cur).ok()?.as_dict().ok()?;
           if let Ok(mb) = d.get(b"MediaBox") {
               let a = mb.as_array().ok()?;
               if a.len() < 4 { return None; } // malformed MediaBox guard (truncation + as_f64 rejects non-numeric)
               return Some((a[2].as_f64().ok()? - a[0].as_f64().ok()?,
                            a[3].as_f64().ok()? - a[1].as_f64().ok()?));
           }
           cur = d.get(b"Parent").ok()?.as_reference().ok()?; // inherit
       }
       None // no MediaBox in ancestry → aspect-only, low confidence
   }
   ```
   `lopdf` loads the whole PDF (incl. compressed stream bytes) eagerly → ~189 MB resident for the
   Uexküll scan; a transient one-time cost, fine on these machines. If it ever shows in a profile
   (batch-classifying a huge corpus), `pdfium-render` reads dims *lazily* (at the cost of the native
   pdfium lib) — the escape hatch, not the default. Also: extend the `pdfimages -list` parse to keep
   `x_ppi`/`y_ppi` (currently dropped).
2. `classify_by_coverage()` — per-image `coverage = (px·72/ppi)/page_pt`; page-scan = coverage ≥ 0.80
   (tune on the corpus). Guards:
   - **Unusable ppi** (`ppi < 10`, e.g. JBIG2/CCITT reporting 0/1) → do NOT compute `px·72/ppi` (÷0 =
     NaN) and do NOT "assume it fills the page" (that silently eats born-digital line-art figures,
     which are often CCITT). Instead **defer that image to the aspect classifier** (needs only pixel
     dims) and mark the doc **low-confidence** so the #1 report flags it for review.
   - **Multi-strip / thumbnail+full pages** → sum per-page coverage but `.min(1.0)` (overlapping
     thumbnail+full-res pairs otherwise exceed 1.0). This also *fixes* an aspect-detector weakness:
     the current "exactly one image per page" rule fails on legit multi-image scans; coverage-sum
     handles them — a concrete A/B win for coverage.
3. `classify_pdf_enrichment()` A/B wrapper + `scan_detector` policy knob + divergence logging.
4. Wire both verdicts (+ the low-confidence flag) into the #1 confirmation report.
5. **Corpus dry-run with an independent oracle.** Classify every corpus PDF with BOTH classifiers,
   and validate the ppi-proxy against a **true placement rect** from **pypdfium2** (already in the
   Marker venv) via image page-object bounds — the actual drawn rect in points, a *stable library
   API* independent of poppler (so it catches poppler-ppi quirks). Do NOT use `pdfcpu extract` +
   `pdftoppm` render-compare: that measures a *resolution ratio*, not coverage (a 300-DPI scan
   rendered at 150 reads as 2× the page, not 1.0; a high-res small figure reads as full-page).
   ```python
   import pypdfium2 as pdfium
   def placement_rects(path):  # {page_idx: [ {width_pt, height_pt, x0,y0,x1,y1} ]}
       out = {}
       for i, page in enumerate(pdfium.PdfDocument(path)):
           rects = []
           for obj in page.get_objects():
               if obj.type == pdfium.ObjectType.IMAGE:
                   x0, y0, x1, y1 = obj.get_pos()   # PDF user space: origin BOTTOM-LEFT, y-up
                   rects.append(dict(x0=x0, y0=y0, x1=x1, y1=y1,
                                     width_pt=abs(x1 - x0), height_pt=abs(y1 - y0)))
           if rects: out[i] = rects
       return out
   ```
   Diff `coverage_proxy = (px_w*72/ppi_x)/page_w_pt` (poppler path) vs `coverage_true =
   rect_w_pt/page_w_pt` (pdfium) per image; **agree within ±0.02**. Tolerance rationale: poppler
   reports ppi as an INTEGER in `pdfimages -list` (Uexküll = `241 241`), so the proxy has a
   quantization floor (~0.2% at 241 ppi, larger for small/low-ppi images) — do NOT tighten below it
   or integer rounding registers as false divergence. A doc that diverges beyond ±0.02 is the real
   poppler-ppi quirk the oracle exists to catch; add `pdfcpu`/`mutool` as an optional third check
   only then. If proxy ≈ pypdfium2 across the corpus, the proxy is proven exact and content-stream
   parsing is dead.
   > **Coordinate note (load-bearing for a future feature):** `get_pos()` is bottom-left / y-up.
   > It's neutral for width/height (`abs`), but the placement rects collected here ARE the crops the
   > deferred **figure-region VLM** path needs — so getting the y-flip right in this dry-run validates
   > the coordinate handling (the unresolved V-5 `pdfium-origin` question) before that cropper is built.

## Risks / edge cases
- **Vector "images"** (figures drawn as vector ops, not raster XObjects) don't appear in `pdfimages`
  at all — neither classifier sees them; fine (nothing to enrich).
- **Unusable ppi** (JBIG2/CCITT → 0/1) — handled by the aspect-defer + low-confidence flag above,
  NOT a blind coverage=1.0 (which would drop born-digital line-art figures).
- **Multi-image pages** — coverage-sum (capped at 1.0) per page, per work item 2.
- **Mixed page sizes** — per-page MediaBox via `lopdf` handles it natively.
- **Malformed page trees** (Parent cycles, truncated MediaBox) — cycle + array guards degrade to
  aspect-only rather than hanging/panicking.
