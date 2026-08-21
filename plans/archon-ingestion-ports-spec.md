# Spec — Structured PDF Ingestion Ports for Archon (Tables · Layout · Chunking)

**Date:** 2026-06-24 · **For:** todo #3, the three remaining GPU-free ingestion ports (companion to `plans/archon-verbatim-provenance-spec.md`, which covers the bbox/quote subsystem).
**Status:** design-complete; bind-points marked `[CONFIRM]`.
**Bound against verified source:** ours — `table_extractor.py` (`_is_real_table:162`), `layout_analyzer.py` (`LayoutAnalyzer`), `markdown_chunker.py` (`chunk_marker_json:301`); Archon — `archon-docs/src/chunking.rs` (`PageChunk`, `chunk_with_page_anchors`), `schema.rs`, `ingest_pdf.rs`.

---

## 1. The unifying insight: one block substrate feeds all three

Our chunker walks **Marker's JSON block tree** — typed blocks `{Text, SectionHeader, Table, ListItem, Caption}` each carrying `{html, bbox, page}` (`markdown_chunker.py:230,250`). That single stream is the input to **all three** ports *and* it produces the bboxes that the verbatim-provenance spec stores. So don't build three pipelines — build one **normalized block stage**, then three consumers.

```rust
pub enum BlockType { Text, SectionHeader, Table, ListItem, Caption, Image, Other }
pub struct Block {
    pub block_type: BlockType,
    pub text: String,          // HTML-stripped for text blocks; cell grid for Table (see §3)
    pub html: Option<String>,  // retained for Table cell parsing
    pub bbox: [f32; 4],        // [x0,y0,x1,y1]
    pub page_num: u32,         // 1-indexed
}
```

**Where blocks come from (per OCR engine — standalone Mac uses Marker, see the ingestion-report amendment):**
- **Marker (primary):** parse its JSON tree → `Vec<Block>` directly. Reading order, section headers, tables, captions, and bbox all come **free** from Marker's layout model. Iterative stack walk (our `_walk_blocks:250` already avoids recursion for huge docs — von Uexküll 188 MB).
- **Tesseract / poppler `-bbox` (fallback, born-digital):** build `Vec<Block>` from word/line boxes via **`pdfium-render`**; block typing is weaker (mostly `Text`), so Port L's column/header logic does more work here.

This substrate's bboxes are exactly what `doc_chunk_spatial` stores (verbatim spec §2) — **the chunker is where bbox capture happens.**

---

## 2. Port C — Token-aware, bbox-carrying chunking *(the spine; do this first)*

Replaces Archon's `chunk_with_page_anchors` (naive `\n\n` split, ~200-char min, no token awareness) with our `chunk_marker_json` logic, **while preserving Archon's `page_start/page_end` lineage** (it drives citation — a hard constraint).

**Constants (faithful to `markdown_chunker.py:26`):** `TARGET_MIN=800`, `TARGET_MAX=1200`, `HARD_MAX=1400` tokens; `CHARS_PER_TOKEN=4` → `est_tokens(s)=s.len()/4`. *(Optional accuracy upgrade: `tiktoken-rs`; keep chars/4 for parity-testing against the reference.)*

```rust
pub struct ChunkOut {
    pub text: String,
    pub page_start: u32,            // compatible with archon PageChunk
    pub page_end: u32,
    pub bboxes: Vec<PageBoxes>,     // → feeds doc_chunk_spatial (verbatim spec)
}
pub struct PageBoxes { pub page_num: u32, pub super_box: [f32;4], pub blocks: Vec<[f32;4]> }

pub fn chunk_blocks(blocks: &[Block], min: usize, max: usize, hard: usize) -> Vec<ChunkOut>;
```

**Algorithm (faithful to `chunk_marker_json:363`):**
1. Iterate blocks in document order; track `current_text`, `page_start` (first block's page), `page_end` (latest), and `page→Vec<bbox>`.
2. **Flush** the current chunk when it is non-empty AND (`est_tokens(current+"\n\n"+text) > max` **OR** (`block.type==SectionHeader` AND `est_tokens(current) >= min`)). Heading-boundary split is the key quality lever.
3. On flush: per page, `super_box = merge(boxes)` (`min x0,min y0,max x1,max y1`, `merge_bboxes:233`), emit `PageBoxes`; reset.
4. Accumulate text with `"\n\n"` join; append bbox to `page_num`'s list.
5. **Merge undersized** trailing chunks (`< min`) with the next **iff `next.page_start <= cur.page_end + 1`** (same/adjacent page) — unions text + bboxes (`:405`).

**Archon binding:** call `chunk_blocks` in `run_pdf_ingest_pipeline` *instead of* `chunk_with_page_anchors`, mapping `ChunkOut → PageChunk{content,page_start,page_end}` for `doc_chunks`, and `ChunkOut.bboxes → doc_chunk_spatial`. `page_start/end` come from block pages (Marker) which must agree with Archon's `page_offsets` char-mapping `[CONFIRM]` — if Archon owns `page_offsets`, derive block pages from it for the fallback path; for Marker, trust Marker's page ids (`/page/N/`, 0→1-indexed, `:271`).

**Markdown-only fallback** (`chunk_markdown:56`, no Marker JSON): page-split on `<!--\s*Page\s+(\d+)\s*-->`, heading-split on `^#{1,4}\s+`, accumulate→max, oversized→paragraph split (`\n\s*\n+`), merge small same-page. No bboxes in this path.

---

## 3. Port T — Tables *(highest value; Archon has zero table support)*

**Scope honestly:** do **not** reimplement table *detection* in Rust (PyMuPDF `find_tables` / camelot are heavy line-detection algorithms; camelot also drags Ghostscript+OpenCV). Instead:

- **Detection source = Marker `Table` blocks** (already in the substrate, with cell HTML + bbox). For the non-Marker fallback, invoke **PyMuPDF `find_tables()` via the OCR sidecar** (same Python process Marker already uses) and receive a cell grid — detection stays in Python where a mature impl exists; Rust never reimplements it.
- **Port to Rust = the quality GATE + serialization**, which is the genuinely valuable, fully-portable logic.

**`is_real_table` gate — port verbatim (`table_extractor.py:162`).** Input = cell grid `Vec<Vec<String>>`:
```
reject if rows < 3 or cols < 2
data = rows[1..]; col_content[c] = count(rows in data with non-empty cell c)
meaningful = count(col_content[c] >= 0.4*data.len()); reject if meaningful < 2
reject if cols > 3 and meaningful <= 2                 # phantom whitespace columns
if rows <= 4 and meaningful <= 3 and col_content[0] < 0.3*data.len(): reject
reject if header row all-empty
cells = non-empty trimmed cells; avg_len = mean(len); reject if avg_len > 40     # prose
reject if meaningful == 2 and rows > 20                # 2-col prose layout
reject if count(len(cell) > 80) > 0.15*cells.len()     # long prose fragments
reject if any(title_marker in csv.lower())             # TOC/copyright/title pages
return true
```
`title_markers` (copyright/isbn/"complete works"/"university press"/…) are **corpus-specific → make them a config list** (`[CONFIRM]` keep our defaults for the dissertation corpus).

**Serialization (faithful to `_dataframe_to_*` / `_rows_cols_to_table:105`):** from the cell grid emit CSV (`csv` crate, QUOTE_MINIMAL), Markdown pipe-table (escape `|`→`\|`), and JSON (`serde_json`, list-of-row-dicts keyed by header). Pad short rows to `cols`; first row = header.

**Table chunk (faithful to `create_table_chunks:287`):** emit a `Block{type:Table, text = "[TABLE] Page {p}, {r} rows × {c} columns\n" + context_before + markdown + context_after}` so it flows through Port C like any block — tables become first-class, retrievable, citable chunks with their own bbox.

```rust
pub struct TableGrid { pub page_num: u32, pub rows: Vec<Vec<String>>, pub bbox: [f32;4] }
pub fn is_real_table(grid: &TableGrid, cfg: &TableCfg) -> bool;
pub fn table_to_block(grid: &TableGrid, ctx_before: Option<&str>, ctx_after: Option<&str>) -> Block; // CSV/MD/JSON stored in metadata
```

---

## 4. Port L — Layout *(reading order, headers/footers, Bekker-as-locator)*

**Most of this is free when Marker is the engine** (Marker does layout/reading-order/rotation natively). The portable value Marker does **not** provide:

**(a) Header/footer detection + fuzzy OCR-dedup** (`layout_analyzer.py:426,489`): collect short lines (`< 80` chars) from top-3/bottom-3 of each page (+ mid-third for 2-col), normalize (strip leading/trailing page numbers), keep those repeating on **≥3 pages**. Strip from body: exact match, OR **fuzzy** `difflib::SequenceMatcher.ratio() >= 0.80` (handles OCR typos like "o/"→"of "; the same `difflib` crate as the verbatim matcher), with a length-prefilter (`|len(a)-len(b)| <= 0.4*max`).

**(b) Standalone page-number / Bekker handling — INVERTED per the amendment.** Our code *strips and discards* `_PAGE_NUM_RE = ^\s*\d{1,3}[oO]?\s*$` and `_BEKKER_RE = ^\s*\d{2,3}[a-b]?\d{0,2}\s*$` (`:53,471`). For the dissertation we **remove them from body text but CAPTURE them as citation locators**:
```rust
pub struct Locator { pub page_num: u32, pub kind: LocatorKind, pub value: String, pub bbox: [f32;4] }
pub enum LocatorKind { PageNumber, Bekker } // Bekker e.g. "1147a" → anchors Aristotle citations
```
Emit `Locator`s into a satellite relation `doc_locators { id => document_id, page_num, kind, value, bbox }`, and link them to the chunk(s) whose page/region they head. This makes Bekker numbers **first-class citation anchors** that the verbatim subsystem can resolve (a quote on page→Bekker `1147a`), rather than noise. *(Plain running-head page numbers: capture as `PageNumber` locators, useful for "p. 47" citations; still removed from embed text.)*

**(c) Multi-column reading order (fallback path only)** (`_detect_page_layout:307`, `_extract_columns:375`): over pdfium blocks — classify left/right/spanning by `block_mid` vs `page_width/2` (±10), `>3` each side ⇒ two-column; or x-center sort + largest-gap-in-middle-third (`gap > 0.08*width`, `0.25 < pos/width < 0.75`). Extract by splitting at the divider, sorting each column by `(y0,x0)`, left-then-right. **Skip entirely when Marker is the engine** (Marker already returns reading order).

**(d) Caption→figure association** (`detect_figure_captions:192`): for each image bbox, find the nearest text block below (figure) within `0.18*page_h`, or above (table) with a `+5` penalty, requiring horizontal overlap; boost blocks starting with `figure/table/fig./…`; pick min score; truncate to 400 chars. Feeds image-chunk captions. Pure geometry — port as-is; useful in both paths.

---

## 5. Rust crates (no Python/CUDA in the hot path)

| Need | Crate |
|---|---|
| Fuzzy string ratio (headers + quote matcher) | **`difflib`** (faithful `SequenceMatcher`) |
| PDF words/blocks/rotation (fallback path) | **`pdfium-render`** |
| CSV / JSON serialization | `csv`, `serde_json` |
| HTML strip from Marker blocks | small regex (`regex`) faithful to `re.sub(r'<[^>]+>','')`, or `scraper` |
| Token estimate | chars/4 (parity) — optional `tiktoken-rs` |

Detection that stays in the **Python OCR sidecar** (already present for Marker): Marker layout/tables, and the PyMuPDF `find_tables` fallback. **No new Python in Rust-side verify/query paths.**

---

## 6. Phasing & effort (interleaves with the verbatim V-phases)

| Phase | Deliverable | Effort |
|---|---|---|
| **S-0** | Normalized `Block` substrate: Marker-JSON → `Vec<Block>` (iterative walk) + pdfium fallback builder | M |
| **S-1 (=V-bbox source)** | Port C `chunk_blocks` replacing `chunk_with_page_anchors`; emit `doc_chunks` + bboxes for `doc_chunk_spatial`; preserve page lineage | M |
| **S-2** | Port T: `is_real_table` gate + tri-format serialize + `table_to_block`; Marker Table blocks primary, sidecar `find_tables` fallback | L |
| **S-3** | Port L(a)(b): header/footer fuzzy-dedup + Bekker/page-number → `doc_locators` (the amendment's inversion) | M |
| **S-4** | Port L(c)(d): fallback multi-column reading order + caption association | M (fallback-only) |

**Ordering:** S-0 → S-1 first (S-1 is the bbox source the verbatim subsystem depends on — build it before/with verbatim V-2). S-2 (tables) is the highest *capability* gain. S-3 (Bekker locators) ties into citations. S-4 only matters for the non-Marker fallback.

**Golden-test gates** (reproduce the Python reference on fixtures before trusting each): chunk boundaries + page lineage on a multi-page Marker doc (S-1); `is_real_table` accept/reject on the known prose-false-positive set incl. a title page and a real data table (S-2); header/footer + Bekker capture on an Aristotle 2-column scan (S-3); column reading order + caption match on a born-digital multi-column PDF (S-4).

---

## 7. `[CONFIRM]` on the Mac

1. Whether block `page_num` (Marker) must be reconciled with Archon's `page_offsets` char-mapping, or can drive it (decides Port C's lineage wiring).
2. `doc_locators` + `doc_chunk_spatial` as new satellite relations vs extending an existing one (same decision as the verbatim spec).
3. Marker JSON schema specifics on Apple-Silicon build (block `id` page pattern `/page/N/`, `html` vs `text` field) — confirm against the installed Marker version.
4. Whether to keep the `find_tables` fallback (needs PyMuPDF in the sidecar) or rely on Marker-only tables for the standalone Mac.
5. `title_markers` list — keep dissertation-corpus defaults or externalize to config.

---

### Resolved 2026-06-24 against the local Archon source

- **#1 page lineage — RESOLVED.** `PageChunk{content,page_start,page_end}` → `build_chunk_artifacts` → `ChunkArtifact{ chunk_id:"chunk-{document_id}-{i}", chunk_index, page_start, page_end, content, content_hash=sha256(content), embedding_status:"pending" }` (`chunking.rs:92-112`); pages from `page_for_offset` over char-offset `PageOffset{page,char_start,char_end}`. Port C's `ChunkOut` maps 1:1 to `ChunkArtifact` — use Marker block pages on the Marker path, `page_offsets` on the fallback — and **keep the `chunk-{document_id}-{i}` id format** so the bbox/hash satellite rows align.
- **#2 satellite vs extend — RESOLVED → additive satellite relations** (Archon's `:create` is additive/idempotent; `archon-cozo::run_script_guarded` allows raw `:create`/`:put`). Don't migrate `doc_chunks`.
- **#5 title_markers — externalize to a config list** (keep the dissertation defaults).
- **#3 Marker JSON schema / #4 `find_tables` fallback — Mac-side checks** (confirm block `id`/`html` fields against the Marker version you install; decide Marker-`Table`-blocks-only vs keeping the PyMuPDF `find_tables` sidecar fallback).

## 8. How the four ports compose

```
Marker/pdfium ─▶ [S-0 Block substrate] ─▶ [S-1 chunk_blocks] ─▶ doc_chunks + doc_chunk_spatial(bbox)
                                          ├▶ [S-2 tables]  ─▶ Table blocks ─▶ chunks
                                          └▶ [S-3/4 layout] ─▶ doc_locators(Bekker/page) + clean body
                                                                        │
                              [verbatim spec] commit_hash/chain + quote-matcher ◀───────┘
```
One structured-extraction subsystem on top of `archon-docs`: it chunks token-aware with page-accurate lineage, recovers tables Archon currently loses, turns Bekker numbers into citation anchors, and hands every chunk's bbox to the tamper-evident verbatim-verification layer — all GPU-free, Marker-on-Metal standalone, WRAITH for bulk.
