# HANDOFF — Index/Ingestion Overhaul: F1 Driver Ready, Full Re-ingest PAUSED
**Date:** 2026-07-30 · **Status:** F1 driver built + validated; awaiting user go for the full-corpus run
**Working repo:** `/home/dalton/projects/archon-cli` (branch `feat/wraith-retrieval`)
**Push target:** `ProfessorVR/archon-cli-private` via SSH — **ONLY there; origin and all forks are PUBLIC and would publish the dissertation index.**

---

## 1. The overall goal

Migrate the dissertation corpus/index from the claudeflow-testing incumbent to **archon-cli** as a
**robust, airtight, integrated ingestion + index-entry system with sentence-level verbatim
granularity** — every claim/clause machine-anchored to byte spans, pages, bboxes, and locators in
verified source documents, with quality enforcement running **automatically on every bare
`docs ingest`** (user directive, 2026-07-30: "All of this work on improving the ingest state should
always run automatically on every ingest").

Authoritative plan: `plans/index-overhaul-2026-07-29/phase1-final-plan/01-FINAL-OVERHAUL-PLAN.md`
(this folder also holds the 239-finding traceability matrix, open questions, execution brief, the
ingestion analysis `05-…`, A/B comparison `06-…`, and `execution-log-2026-07-29.md`).

Binding directives (settled): archon-cli is the target repo; index first, ingestion second; **full
re-ingestion + regeneration sanctioned**; preservation first (done — git + Mac
`~/claudeflow-preserve/`); WRAITH fully retired incl. the reranker (accepted loss — never
reintroduce); archon-coder abandoned, archon-cli itself is NOT; ultracode OFF; commits/pushes from
WSL only.

## 2. Completed (Phases 0–E + the 2026-07-30 session)

**Index transfer + store (Phases 0–D, gates G0/G-A/G-B/G-C/G-D all passed):**
- 8 `corpus_*` relations live; **32,186 rows / 25 sources** (6,304 claims, 4,872 clauses incl. 235
  dissertation verbatims, 20,817 edges incl. all 5,437 previously-dead reasoning edges, 119/119
  tensions, 49 groups). CLI: `archon corpus-index ensure-schema|status|validate|import|dump|show|probes`.
- Decisions 1–3 ruled and live (rights-tiered verbatim w/ `rights_tier`+`redact_on_render`;
  density band 15–35/1k; GROUP layer). D5 pilot entry `vle-eyetracking-2024` (105 records, all 22
  clause quotes anchor EXACT). Gate suite: `archon-cli/scripts/checkers/` (9/15 roster
  implemented; missing checker FAILS; thresholds in `gates-config.json`; `gates.json` only via
  `emit_gates.py`).

**Pipeline hardening — all automatic on every ingest (commits `5d70a0e0`…`670c5477`):**
- **Sentence layer**: `doc_chunk_sentences` built inline BEFORE the Ingested flip (hard-fail);
  deterministic byte-span segmenter (Greek-aware); relation folded into `ensure_doc_schema`.
  Full corpus: **420,926 sentences, 95.6% bbox, verify-sample clean** — rebuilt in 1m53s after the
  batched-read fix (see gotchas).
- **S8 OCR quality arbiter** (`ocr/quality.rs`): deterministic scorer (mixed-script, vowel-less,
  U+FFFD, noise, English+Greek stopword lexicons); second-engine escalation on low-quality
  SUCCESS; engine+score+escalated recorded in `doc_image_ocr_status`; low-quality = `suspect` not
  `ok`; page-level quality scan on every PDF ingest for both chunkers.
- **Admissibility gate** (`admissibility.rs`): ligature markers / degenerate extraction / empty
  sentence layer ⇒ document **Failed**, never silently admitted (`ARCHON_ADMISSIBILITY=warn|off`).
- **Scan classification fixes**: (a) union third arm — a page whose ONLY image covers ≥0.50 of the
  page is a margin-cropped scan (Kassel JBIG2 class); (b) byte gate = `max(stream, w·h/8)` — the
  classifier was gating on compressed stream size while the pipeline gates on extracted file size
  (White-1985's 23 page scans were invisible to detection yet enriched by the pipeline);
  (c) marker parse now KEEPS `Footnote`+`Code` blocks (was silently dropping — 71/208 blocks of
  White-1985 lost). PageHeader/Footer stay dropped.
- **S1** de-hyphenation in the `quote_verify` engine; **E1** pypdfium2 4.30.0→5.12.1 (ligature
  dropout fixed at the source); **E4** five regression tests pin the incumbent's ingest failures.

**Proof runs (single bare `docs ingest`, everything automatic):**
- King & Salvo born-digital (`doc-ab7495f0…`): 57 chunks, 766 sentences (74% bbox / 100% page),
  0 ligature hits, admissibility pass.
- Kassel Greek scan (`doc-ad8c709d…`): SCANNED-BOOK auto-detected (261/279), enrichment
  auto-skipped, 120 chunks / 100% spatial, 5,633 sentences 100% bbox+page, 352 Bekker locators.
- White-1985 (`doc-8ba07f5a…`, the stress case): 143 chunks/10% spatial/38% sent-bbox →
  **16 chunks / 100% / 100% incl. footnotes**; its 280 not-found clauses flipped to exact/near-verbatim.

**C8 re-anchor CLOSED (4,872 clauses):** 65.3% exact · 20.4% near-verbatim · 10.7% not-found ·
2.7% drift · 1.0% not-in-corpus · 1 timeout. Runner (`scripts/corpus-import/reanchor_clauses.py`)
is now **doc-scoped** (`--doc` via c6 mapping + `docid-remap.json`), restart-safe, auto-redoes
timeout/stale-doc rows. **Not-in-corpus (F2 acquisition list): Withy-2023, Fredal-2020,
Christensen-2016, Agosta-2010, Caston "Cartesian Theatre" 2021 — no PDFs ingested for these.**

**Anchor write-back APPLIED:** `scripts/corpus-import/apply_anchors.py` wrote the ledger verdicts
into `corpus_clauses` — **3,181 exact anchors** (chunk_id, byte spans `offset_semantics=utf8-byte`,
page_pdf, `text_layer_id=archon:<doc>`, citation_address_json w/ locator) **+ 993 near-verbatim
annotations, 0 quarantined**. The index is sentence-addressable at the store level.

## 3. Where we are RIGHT NOW

- **F1 driver built and validated**: `scripts/corpus-import/f1_reingest_driver.py` — worst-first,
  serial, resumable (`f1-report.jsonl`), per-doc: probes-before → GPU preflight (ollama unload +
  free-VRAM wait + no-concurrent-marker) → delete (retry) → bare ingest → `docid-remap.json`
  append → ledger purge for the doc's clauses → `docs index` → probes-after delta; post-batch:
  re-anchor + apply_anchors. Validated on the worst ligature doc (Das & Khanna) — see
  `f1-report.jsonl` for the before/after delta.
- **PAUSED by user instruction before the full-corpus run** (`--all`). The footnote fix means every
  marker-ingested doc lacks footnote blocks, so the full staged re-ingest of all ~227 docs is
  justified and sanctioned — estimated 8–15 GPU-hours, resumable, but it does NOT start without an
  explicit go.

**User directives for the re-ingest (2026-07-30, late session):**
- When ingesting from the claudeflow-testing source corpus at the DIRECTORY level, **ignore these
  folders**: `.extracted_media`, `dissertation`, `download`, `index`, `Part_II`.
- `corpus/Virtual Learning Environments/` was **renamed** to
  `corpus/virtual_learning_environments/` (claudeflow-testing side; archon's corpus copy was
  already conformant). `scripts/ingest/manifest.jsonl` paths + collection fields updated (backup in
  `scripts/.backups/`); the compiler's "Virtual Learning Environments (King–Salvo)" string at
  `compile-corpus-index.py:37` is a display LABEL, deliberately untouched.

**Driver validation postscript:** the first validation attempts surfaced two real defects, both
fixed: (a) `docs list` path parsing kept the trailing content-hash column (driver now strips it
and refuses to delete when the source file is missing on disk); (b) repeated failed deletes GUT a
document (non-atomic delete strips chunks before the vector-store refusal) — Das & Khanna and
Hadjioannou were re-ingested to recover (`docid-remap.json` updated). An orphaned `verify-quote`
child from a killed re-anchor runner was the vector-store holder (see gotchas).

## 4. What remains (priority order)

1. **Full-corpus staged re-ingest** — `python3 scripts/corpus-import/f1_reingest_driver.py --all`
   (or staged via `--limit N` batches). AWAITING USER GO. After it: rerun probes; expect corpus-wide
   spatial/sentence-bbox to jump and ligature docs → 0.
2. **Phase-F prose extractors** (the largest remaining body): convert quotations living only in
   corpus/index prose into clause rows → scoped re-anchor → apply. Populations: BCAP ~488,
   Boredom cluster ~1,725, Being & Time ~1,230, FCM ~2,090, +49 bbox-ticked spans (~5,600 total).
   Reuse the C8 runner + apply_anchors machinery as-is.
3. **F2 triage**: 520 not-founds (concentrated: Chalmers 98, Barnes 86, Papachristou 72 — their
   docs are clean ⇒ likely sandbox-quote drift; inspect and re-author or reclassify), 130 drift,
   1 Dow timeout, the 5 not-in-corpus sources (user decides: acquire PDFs or accept prose-only).
4. **Remaining engineering debt**: 6 unimplemented roster checkers; `docs delete` atomicity (strips
   chunks BEFORE the vector-store step can refuse — the King doc got gutted this way once);
   orphan sentence-row sweep; marker ladder reports only its last rung's error (masks the real
   cause); S8 second-engine escalation for the MARKER path (Kassel's rho→eta page is detected but
   not re-OCR'd); DISS-03-C001 dangling ref; open questions N1/N3/N5.
5. **Closure**: regenerate `compiled-index.json` (`scripts/compile-corpus-index.py` in
   claudeflow-testing) after new clause rows; final full-probe + gate sweep (plan's G-F);
   off-machine preservation of end state; user-side: FCM keystone ruling, WRAITH power-down.

## 5. Hard-won operational gotchas (READ before running anything)

- **VLM residency starves Marker's GPU placement** (measured twice): the placement plan reads free
  VRAM at plan time; a resident ollama VLM ⇒ Marker lands on CPU ⇒ 20×+ slower or timeout. The
  driver's preflight handles this — never bypass it.
- **Never run two Marker ingests concurrently** (measured: one loses the GPU and falls to CPU).
- **cozo sqlite serializes EVERYTHING** — in-process AND cross-process, reads included. Worker
  threads/processes gain nothing. The 150x sentence-rebuild win came from batching doc-wide reads
  (`store::list_chunk_blocks_for_doc` / `list_page_breaks_for_doc`), NOT parallelism. Also:
  `run_script_guarded` takes the exclusive write lock even for Immutable reads — never put it in a
  per-item loop.
- **`docs delete` is not atomic** — retry loop needed while C8-style readers hold the vector store;
  a failure can leave a gutted doc (fix pending).
- **verify-quote MUST be `--doc` scoped** in batch — corpus-wide fuzzy on a miss = 125s timeouts.
- **Killing the re-anchor runner orphans its in-flight `verify-quote` child** — the child keeps
  running (no timeout enforcement without its parent) and holds the vector store, blocking every
  `docs delete` until found via `lsof .archon/doc-vector-store/LOCK` and killed. If a delete
  retries forever, look for an orphan first.
- **`pgrep -f` self-matches** wrapper cmdlines (bracket trick: `pgrep -f "reanchor_[c]lauses"`);
  heredocs are hook-blocked (use the Write tool); env prefixes (`PATH=… cargo test && cargo build`)
  apply only to the FIRST command — a stale binary burned an hour this way; check
  `ls -la target/debug/archon` mtime after building.
- `docs reprocess` re-runs the FULL pipeline (probe + live = Marker twice); coverage repair still
  prefers delete + re-ingest.

## 6. Key paths

| What | Where |
|---|---|
| Programme folder (plan, matrix, analyses, logs) | `plans/index-overhaul-2026-07-29/` (claudeflow-testing) |
| This handoff | `plans/index-overhaul-2026-07-29/HANDOFF-F1-READY-2026-07-30.md` |
| Archon repo / branch | `/home/dalton/projects/archon-cli` · `feat/wraith-retrieval` |
| F1 driver / anchor apply / re-anchor runner | `archon-cli/scripts/corpus-import/f1_reingest_driver.py`, `apply_anchors.py`, `reanchor_clauses.py` |
| Durable intermediates, ledger, remap, probes, F1 report | `archon-cli/.archon/corpus-import/` (`reanchor-ledger.jsonl`, `docid-remap.json`, `corpus-probes.json`, `f1-report.jsonl`, `logs/`) |
| Gate suite | `archon-cli/scripts/checkers/` (`gates-config.json`, `emit_gates.py`) |
| Corpus schema / relations | `archon-cli/crates/archon-knowledge/src/corpus.rs` |
| Pipeline code touched this session | `crates/archon-docs/src/`: `sentence_index.rs`, `ocr/quality.rs`, `admissibility.rs`, `pdf_scan.rs`, `ingest.rs`, `ingest_text.rs`, `reprocess.rs`, `pdf_image_enrichment.rs`, `store.rs`; `crates/archon-ingest-ext/src/marker.rs` |
| Session commits (all pushed to private) | `5d70a0e0`, `ddf86e6f`, `349eea89`, `e734cd20`, `670c5477` + F1-scripts commit |
| Memory file (session-level state) | `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/project-index-overhaul-2026-07-29.md` |
| Build env | `PATH=$HOME/.cargo/bin:$PATH LIBCLANG_PATH=/usr/lib/llvm-18/lib cargo build` (WSL) |

## 7. First moves for a fresh session

1. Read this file, then `01-FINAL-OVERHAUL-PLAN.md` §Phase F and the memory file.
2. `cd /home/dalton/projects/archon-cli && git log --oneline -8` — confirm you're at/after the
   F1-scripts commit on `feat/wraith-retrieval`.
3. `python3 scripts/corpus-import/f1_reingest_driver.py --plan` — inspect the work list and the
   validation row in `.archon/corpus-import/f1-report.jsonl`.
4. **Ask the user for the go** on the full re-ingest, then `--all` (or staged `--limit` batches),
   monitoring `f1-report.jsonl` deltas per doc.
5. After the batch: check the driver's own re-anchor + apply output, rerun
   `archon corpus-index probes`, run the gate suite, report corpus-wide before/after.
