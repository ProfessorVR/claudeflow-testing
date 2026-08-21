# HANDOFF — B-Tier Progress + Dissertation Entry Deletion (Session 2026-07-31 evening)
**Date:** 2026-07-31 (second session that day) · **Status:** B-3, B-6, B-5(a)(b), B-2 DONE; dissertation entry DELETED from all systems (user order); **EVERYTHING UNCOMMITTED — first action next session = present the commit bundle for sign-off**
**Working repo:** `/home/dalton/projects/archon-cli` (branch `feat/wraith-retrieval`, HEAD still `d4dc299d` — no commits this session)
**Push target:** `ProfessorVR/archon-cli-private` via SSH — ONLY there. Origin and all forks are PUBLIC. claudeflow-testing's origin is ALSO PUBLIC — local commits only, never push.

---

## 1. The overall goal (unchanged)

Migrate the dissertation corpus/index to **archon-cli** as a robust, airtight ingestion + index
system with sentence-level verbatim granularity — every claim/clause machine-anchored to byte
spans, pages, bboxes, and locators in verified source documents, quality enforced automatically
on every bare `docs ingest`. Authoritative plan:
`plans/index-overhaul-2026-07-29/phase1-final-plan/01-FINAL-OVERHAUL-PLAN.md`. We are past F1
(full re-ingest), Phase-F extractors, F2 triage, and the 15-gate suite; remaining = the rest of
the B machine tier, then C closure (F2 regeneration, Heidegger claim layer, F3 acceptance).
Binding: WRAITH fully retired incl. reranker (accepted loss, never relitigate); archon-coder
abandoned; ultracode OFF; no multi-agent Workflows without per-run permission;
verification-gated commits (show evidence, wait for sign-off).

## 2. What THIS session accomplished (2026-07-31 evening, all machine-verified)

### B-3 — `corpus_sources.archon_document_id` column refresh ✅
24 stale pre-F1 ids refreshed to the docid-remap fixed point (83 already live, 1 empty =
test-paper, since removed). Post-check: 108/108 rows valid, 0 stale, every id exists in the
docs store. Script: `scripts/corpus-import/b3_refresh_source_docids.py` (dry-run default,
`--apply`, pre-state dump saved). The `gatelib.live_doc_id` chase is now a no-op for sources —
but KEEP using it (historical files still carry old ids).

### B-6 — hygiene ✅
- **Clause-anchor audit** (new, `b6_audit_clause_docids.py` + `b6_stale_anchor_analysis.py`):
  found 250 clauses referencing dead doc ids across 19 stale ids. Breakdown: 153 near-verbatim
  (stale `text_layer_id` kept BY DESIGN by apply_anchors' annotation-only rule), 69 drift + 6
  not-found (apply leaves rows alone — all queued in the deferred user review), 22 D5-pilot
  vle-eyetracking clauses (never entered the C8 ledger), 1 `diss-verbatim-W-4` (anchored to a
  phantom reprocess-probe doc). **The 23 fixable ones re-anchored 23/23 EXACT sim 1.0** against
  live docs (`b6_reanchor_pilot_and_w4.py` — same needle normalization + ledger row shape as the
  runner), THEN the 3 phantom "Ingesting" reprocess-probe doc rows were deleted (0 chunks each;
  docs 236→233, 0 Ingesting remain).
- **test-paper**: REMOVED per user ruling (claim RT-0001 + source row sandbox:test-paper).
- **DISS-03-C001**: re-pointed per user ruling to `["DISS-02-C105","DISS-02-C089"]` — then
  mooted by the dissertation deletion (row gone). check_ids: 3/3 PASS, 0 dangling anywhere.

### New CLI capability: `corpus-index remove` ✅
`archon corpus-index remove <kind> <id> [-y]` or `--ids-file <file>` (batch). Verify-before-
remove (ANY missing id aborts the whole batch), guarded batched `:rm` via new
`corpus::remove_rows` (archon-knowledge), audit rows written to `corpus_imports`
(`rm-<kind>-<hash>`), refusal path without `-y`. This did not exist — deletion previously
required going around the store's guard discipline.

### B-5(a) — driver preflight page-scaling ✅
`f1_reingest_driver.py`: flat `MIN_FREE_VRAM_MB = 12000` replaced by per-doc
`required_free_vram_mb(pages)` mirroring `crates/archon-accel/src/placement.rs` EXACTLY
(`min(6000 + 30·pages, 10240)`), budget-aware (reads `marker_memory_budget_mb` from
`.archon/policy.toml` — **9000, comment says user-ratified PERMANENT**), + 1024 MB margin;
pdfinfo page count; unknown pages → worst case; **REFUSES loudly** when a doc's footprint
exceeds MARKER_CAP_MB and no windowing budget is set (the exact B&T/FCM CPU-fallback class).
Smoke-tested: 10pp→7324 MB bar, 82pp→9484, 200/589/unknown→10024.

### B-5(b) — loud Marker-fallback failure, BOTH halves ✅
- **Pipeline half (Rust)**: `admissibility::check_document` gained `expect_spatial`; a document
  with chunks but ZERO `doc_chunk_spatial` rows FAILS when `outcome.pdf_marker_fallback` is set —
  a NEW `PipelineOutcome` flag set ONLY in the two subprocess-transport Marker fallback arms in
  `ingest_pdf.rs` (HTTP transport already hard-fails). Route-scoped on purpose: a first blanket
  `media_type == "application/pdf"` version broke 2 VLM-resilience tests whose fixtures
  legitimately ingest PDFs without Marker. Call sites updated: ingest.rs, reprocess.rs,
  ingest_text.rs(false).
- **Driver half (Python)**: `process_doc` records `status: "spatial-regressed"` (never "ok")
  when before-spatial > 0 → after == 0, prints a loud warning; `already_done()` only skips
  "ok" rows → the doc **auto-requeues** on the next run.
- **Tests: archon-docs 331/331 PASS** including 2 new (`bboxless_fallback_on_pdf_is_a_failure`,
  `pdf_with_spatial_rows_is_admissible`); archon-knowledge suites green.

### DISSERTATION ENTRY DELETED — user ordered mid-session ✅
User: *"ignore the dissertation enrichment. I will have it reanalyzed once the first complete
draft is done. delete any related materials from the embeddings and index."* Scope rulings
(both explicit): **full sweep** in the store, **all systems**.
- **Measured footprint first** (fully self-contained): 982 claims (entry_id=dissertation),
  235 diss-verbatim-* clauses (the dissertation's quotations of 31 cited:* sources),
  **0 edges / 0 tensions / 0 groups / 0 cross-entry clause refs**.
- **Archon store**: −982 claims, −235 clauses, −31 cited:* source rows (ALL became orphans —
  verified none served other entries). Rollback backups:
  `.archon/corpus-import/pre-dissdelete-{claims,clauses,sources}-20260731-200516.jsonl` +
  id lists `dissdelete-*-ids-20260731-*.txt`. Script:
  `scripts/corpus-import/b2x_delete_dissertation_entry.py`. **All corpus DOCUMENTS stay
  ingested** (the 6 cited PDFs etc. are sources, not dissertation materials).
- **claudeflow**: `corpus/index/Dissertation/` deleted — 358 files, verified 100% git-tracked
  first (recoverable; deletion is in the uncommitted working tree). `compiled-index.json`
  regenerated via `scripts/compile-corpus-index.py` — counts IDENTICAL (701 ontologyNodes / 72
  hooks / 64 tensionEdges / 1722 terms): the entry contributed nothing to it.
- **ChromaDB (:8001) verified CLEAN — nothing to purge**: corpus/index entries were never
  embedded. The 972 chunks matching "dissertation" are `corpus/download/
  dissertation-fresh-perplexity/` EXTERNAL source PDFs (Burke, Hussey, Heidegger trans., …) —
  KEPT. `dissertation-perplexity-cache` (2,599) is a research cache — KEPT.
  `local_vectors_1536` / `god_agent_vectors_1536` are the WRAITH-era orphan collections
  (no metadata; purge separately deferred since Phase A) — UNTOUCHED.
- Consequences: DISS-03-C001 gate row gone; dissertation density/coverage/distribution rows
  gone; any diss-verbatim rows in the deferred drift-review files are moot (files left as-is);
  the F2 regeneration population is now **26 entries, not 27**.

### B-2 — page-locus enrichment (wendt + veridissimilitude; dissertation dropped) ✅
- `b2_enrich_page_loci.py`: **296 claims enriched, 0 unparsed** — wendt `"p.6 / pdf 8"`,
  `"(p.29 / pdf 31)"`, ranges `"pdf 8-9"`; vds `raw_printed_pages` `"9,64–65"` en-dash lists
  and `"64fn16"` footnote loci (page extracted). Idempotent; refuses absurd ranges.
- wendt source row registered → `doc-14c31fc3` (Design for Dasein, live doc; entry_profile
  MONOGRAPH).
- `check_coverage.py` gained a **`page_totals` config route** for entries whose source document
  is not an archon doc: `gates-config.json → section_coverage.page_totals.veridissimilitude =
  {total_pages: 67, provenance: manifest.json, printed==pdf 1:1}`. (The vds MA-thesis PDF
  EXISTS at `archon-cli/corpus/Part_II/Salvo, Dalton - MA Submission - …pdf` but is NOT
  ingested — ingesting it would upgrade vds to true page-proxy coverage; needs user say-so.)
- **Gates flipped NEEDS-DATA → PASS: vds coverage 0.91, distribution 0.066; wendt coverage
  0.554 (floor 0.3 MONOGRAPH), distribution 0.0.**

## 3. Where we are RIGHT NOW

- **Store: 77 sources / 8,290 clauses / 5,321 claims / 20,817 edges / 119 tensions / 49 groups
  = 34,673 rows; 233 docs, 0 Ingesting.** check_ids 3/3 PASS; registration orphans = Miyauchi
  ONLY (pre-existing, belongs to thin-entry flow).
- Binary `target/debug/archon` = `1.3.11 (d4dc299d)`, rebuilt 2026-07-31 ~20:04 with all the
  session's Rust changes, hash+mtime verified. NOTE: session opened on a stale `7faa18ba`
  binary — the check caught it; intervening commits were Python-only so nothing was affected.
- **NOTHING COMMITTED.** Working tree carries: Rust (5 archon-docs files, corpus.rs, 2 CLI
  files), driver, 2 checkers + gates-config, 7 new corpus-import scripts (b3_*, b6_*×3, b2_*,
  b2x_*, plus diss-03 patch artifact); claudeflow carries the Dissertation deletion (358 D) +
  compiled-index.json + this handoff. Long-standing untracked corpus/ PDF dirs from earlier
  sessions are also present in archon (`corpus/AD(H)D/` etc.) — those predate this session.
- **Mac replica (`daltonsalvo@192.168.50.10:~/projects/archon-cli`) is STALE**: store, binary,
  and scripts all changed after yesterday's deploy. Re-sync AFTER the commit lands.
- GPU services down (fine — nothing this session needed them; ChromaDB + god daemons up).
- Memory file `project-index-overhaul-2026-07-29.md` has the full session block (2026-07-31
  EVENING SESSION).

## 4. WHAT REMAINS

### FIRST ACTION next session (user instruction, 2026-07-31)
**Present the commit bundle for sign-off, then commit + push archon → private remote only.**
Suggested split:
1. archon commit A (Rust): `corpus-index remove` (+ batch, audit rows), admissibility
   `expect_spatial` gate + `pdf_marker_fallback` flag, `remove_rows`. Evidence: 331/331
   archon-docs tests, 2 new tests pin the fallback class.
2. archon commit B (tooling): driver preflight page-scaling + spatial-regressed requeue,
   b3/b6/b2/b2x scripts, check_coverage page_totals + gates-config.
   (Or one commit if the user prefers.)
3. claudeflow LOCAL-ONLY commit: Dissertation entry deletion + compiled-index regen + handoff
   docs. NEVER push claudeflow.
Then: refresh the Mac replica (rsync store + scripts, rebuild, verify `--version` hash — see
`reference-archon-mac-stale-path-binary`).

### B — remaining machine tier
- **B-4 skipped-span recovery** (`.archon/corpus-import/phase-f-skipped.jsonl`): 208 Greek
  spans (verify against Kassel Rhetorica / De Anima Ross_Greek), 62 synthesis-file spans
  (multi-doc attribution), 31 unmapped-article spans (improve the article→doc matcher in
  `phase_f_extract.py`).
- **B-1 thin-entry enrichment** (density, records/1k words vs 15–35 band):
  `sandbox:heidegger-bcap-4-5` 0.8 · `wendt-design-for-dasein` 2.1 · `sandbox:aristotle-da-3-3`
  2.5 · `sandbox:caston-1995` 3.3 · `sandbox:nussbaum-1985` 5.9 · `sandbox:metzinger-2018`
  13.4. New claim authoring under the D-gates; exemplar =
  `scripts/corpus-import/pilot_vle_eyetracking.py`. Miyauchi orphan resolves here too
  (enrich or documented waiver). Flows directly into C-1.

### C — programme closure
1. **F2 entry regeneration** — now **26 entries** (dissertation removed; reanalysis deferred by
   user until the first complete draft is done), each against its defect checklist in
   `phase1-final-plan/02-FINDINGS-TRACEABILITY.md`; relational apparatus migrated, never
   re-derived; order by the B-1 thin-entry list.
2. **Heidegger claim layer (C-2)**: BCAP/BT/FCM clause-level quotes exist but no claim rows
   (FCM draft-plan row: 245 structured + ~1,100 locus-anchored prose claims).
3. **F3 acceptance (C-3)**: measure the §0.2.2 table — density in band, reachability ≥95%,
   char-spans ≥90%, quotes 100% exact-gated, 0 narration-satisfiable gates, relational layer
   preserved AND reachable.
4. **N1/N3/N5** open questions (`phase1-final-plan/03-OPEN-QUESTIONS.md`) — user rulings.
5. **Preservation**: Mac `~/claudeflow-preserve/` refresh (needs user permission) + Mac replica
   re-sync (above).
6. **Drafting-system upgrade** (`plans/drafting-index-integration-plan-2026-07-30.md`) —
   awaiting the user's multi-round review; do NOT start.

### A — deferred user-review tier (do NOT start; offer when user has time)
Drift review 405 · reclass 324 · Phase-F not-found tail 1,596 (offer heuristic pre-sort) ·
core not-founds ~89 · concordance 8 · FCM keystone ruling · WRAITH power-down. Note: any
diss-verbatim rows inside these files are now moot (entry deleted).

## 5. Hard-won operational gotchas (carry forward — all still binding)

- **pgrep/pkill -f SELF-MATCH**: always bracket-trick (`pgrep -f "reanchor_[c]lauses"`), and
  never put the literal target string in the same command line you grep from.
- **Heredocs are hook-BLOCKED** — write scripts with the Write tool.
- **cozo sqlite serializes EVERYTHING** — batch doc-wide reads; never two Marker ingests
  concurrently; verify-quote MUST be `--doc` scoped in batch.
- **Never rewrite `reanchor-ledger.jsonl` while a runner is appending** (b6 script guards with
  pgrep; keep that pattern).
- **Mid-run `--plan` lies**; trust `f1-report.jsonl`.
- **Drift ≠ cosmetic**: fuzzy `source_span` can be the WRONG PASSAGE — never auto-replace
  quotes; review-only.
- **Env prefixes apply only to cmd1**; check binary mtime + `--version` hash after EVERY build
  (caught a stale binary AGAIN this session — third time).
- Build env: `PATH=$HOME/.cargo/bin:$PATH LIBCLANG_PATH=/usr/lib/llvm-18/lib cargo build`.
- Marker budget 9000 (windowed >82pp) is PERMANENT policy (comment in policy.toml says
  user-ratified).
- New: `corpus-index remove` refuses without `-y` and aborts batches on any missing id — use
  `--ids-file` for bulk work, never loop single removes (per-invocation DB open is ~1s).

## 6. Key paths

| What | Where |
|---|---|
| Programme folder (plan, matrix, logs, THIS handoff) | `plans/index-overhaul-2026-07-29/` (claudeflow-testing) |
| Boot prompt for next session | `BOOT-PROMPT-RESUME-2026-07-31B.md` (same folder) |
| Previous handoff (B/C definitions §4, gotchas §5) | `HANDOFF-B-C-REMAINING-2026-07-31.md` |
| Work register (A/B/C detail) | `REMAINING-WORK-2026-07-31.md` (B-2/B-3/B-5/B-6/B-7 now done; dissertation rows moot) |
| Authoritative plan / traceability / open questions | `phase1-final-plan/01|02|03-…` |
| Archon repo / branch / HEAD | `/home/dalton/projects/archon-cli` · `feat/wraith-retrieval` · `d4dc299d` (uncommitted work on top) |
| This session's scripts | `archon-cli/scripts/corpus-import/b3_refresh_source_docids.py`, `b6_audit_clause_docids.py`, `b6_stale_anchor_analysis.py`, `b6_reanchor_pilot_and_w4.py`, `b2_enrich_page_loci.py`, `b2x_delete_dissertation_entry.py` |
| Deletion rollback backups | `archon-cli/.archon/corpus-import/pre-dissdelete-*-20260731-200516.jsonl` |
| Gate suite + config | `archon-cli/scripts/checkers/` (`check_coverage.py` + `gates-config.json` changed this session) |
| Store | `archon-cli/.archon/archon-data.db` — 34,673 rows / 233 docs |
| Skipped spans (B-4 input) | `archon-cli/.archon/corpus-import/phase-f-skipped.jsonl` |
| vds MA-thesis PDF (uningested; optional upgrade) | `archon-cli/corpus/Part_II/Salvo, Dalton - MA Submission - …pdf` |
| Mac replica (STALE until re-sync) | `daltonsalvo@192.168.50.10:~/projects/archon-cli` (bash -lc) |
| Memory files | `project-index-overhaul-2026-07-29` (session block added), `project-drift-review-deferred`, `reference-archon-mac-stale-path-binary` |

## 7. First moves for a fresh session

1. Read this handoff, then `HANDOFF-B-C-REMAINING-2026-07-31.md` §4–5, then the memory file's
   2026-07-31 EVENING block.
2. Verify state: `git log --oneline -1` (expect `d4dc299d` + dirty tree), `git status --short`
   (expect the §3 file list), `./target/debug/archon --version` (expect `d4dc299d`, mtime
   2026-07-31 ~20:04), `corpus-index status` (expect **34,673 rows**), `docs list | wc -l`
   (expect 234 = header + 233).
3. **Present the commit bundle (§4 FIRST ACTION) and WAIT for sign-off.** Push archon → private
   only; claudeflow commit stays local.
4. Then B-4 → B-1 → C-1/C-2 → C-3, pausing for user rulings where marked.
