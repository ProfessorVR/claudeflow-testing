# HANDOFF — Index/Ingestion Overhaul: Queue Done, B (Machine Work) + C (Closure) Remaining
**Date:** 2026-07-31 · **Status:** F1 + Phase-F extractors + F2 triage + 15/15 gates + Mac deploy ALL DONE; user-review tier deferred; next session executes B then C
**Working repo:** `/home/dalton/projects/archon-cli` (branch `feat/wraith-retrieval`, HEAD `d4dc299d`)
**Push target:** `ProfessorVR/archon-cli-private` via SSH — **ONLY there. Origin and all forks are PUBLIC. claudeflow-testing's origin is ALSO PUBLIC — local commits only, never push** (its `feat/wraith-retrieval` has never been pushed; keep it that way).

---

## 1. The overall goal

Migrate the dissertation corpus/index to **archon-cli** as a robust, airtight ingestion + index
system with sentence-level verbatim granularity — every claim/clause machine-anchored to byte
spans, pages, bboxes, and locators in verified source documents, quality enforced automatically on
every bare `docs ingest`. Authoritative plan:
`plans/index-overhaul-2026-07-29/phase1-final-plan/01-FINAL-OVERHAUL-PLAN.md` (we are past Phase F1;
remaining = F2 regeneration + F3 acceptance). Binding: WRAITH fully retired incl. reranker
(accepted loss, never relitigate); archon-coder abandoned; ultracode OFF; no multi-agent Workflows
without per-run permission; verification-gated commits (show evidence, wait for sign-off).

## 2. Completed (through 2026-07-31)

- **Phases 0–E + F1 full re-ingest:** all 226 docs through the hardened pipeline (sentence layer
  inline, S8 OCR arbiter, admissibility gate, fixed scan classifier, footnote retention).
  Corpus-wide: ligature docs 6→**0**, spatial 63.5%→**77.5%**, sentences 420,926→**~445K** at
  ~96.5% bbox. Big-scan lesson: whole-doc GPU Marker OOMs on high-res scans (resolution >
  MARKER_CAP_MB estimate) → `marker_memory_budget_mb = 9000` is **permanent policy** (windowed
  >82pp; proven on B&T 589pp / FCM 200pp, 11/11 windows CUDA).
- **Phase-F prose extractors** (`scripts/corpus-import/phase_f_extract.py`): 3,669 unique
  quotations back-extracted from six entry populations (BCAP 492 ≈ audit's 488 ✓, BT 428,
  FCM 1,455, Boredom 1,216, SVW 47, Presence 31) into clause rows + 52 sources; all imported,
  0 quarantined; re-anchored (1,008 exact + 534 near-verbatim).
- **F2 triage:** DA III.3 wrong-book c6 binding FIXED (78 not-founds → 65 exact + 14 nv);
  **all six no-PDF cited sources recovered from claudeflow `corpus/download`** (Fredal was
  mislabeled `Newman_Sara_2016_The_Enthymeme.pdf`), renamed properly, ingested, bound —
  **not-in-corpus class EMPTY, timeouts 0**; 31 `cited:*` sources registered (C4 gap the new
  registration gate caught). Core ledger: **93.8% verified** (3,308 exact + 1,239 nv of 4,850).
- **Store:** 8,525 clauses · 6,304 claims · 20,817 edges · 119 tensions · 49 groups · 108 sources
  = **35,922 rows**; anchors in `corpus_clauses`: **4,316 exact + 1,773 near-verbatim, 0 quarantined**.
- **Gate suite 15/15 implemented** (`scripts/checkers/`): + check_coverage (page-proxy w/
  `live_doc_id` remap-chain helper in gatelib), check_distribution, check_registration,
  check_lemmas, check_projection, check_derivation; density now MEASURES every entry (24 word
  counts machine-read into `gates-config.json`). Current verdicts: 8 PASS honestly; FAILs all
  known+measured (see §4-B and §5 of `REMAINING-WORK-2026-07-31.md`).
- **Drift pass:** 0 auto-applied — CORRECT (engine already normalizes; surviving drift is real
  wording; fuzzy match can return the WRONG PASSAGE — never auto-replace). User deliverables
  built: `DRIFT-REVIEW-2026-07-31.md` (405 rows) + reclass list (324) — **review DEFERRED by
  user**; see memory `project-drift-review-deferred`.
- **Mac deploy (2026-07-31):** `daltonsalvo@192.168.50.10:~/projects/archon-cli` = fresh private
  clone @ `d4dc299d` + full state rsync (corpus 1.9G, `.archon` 3.5G). Debug+release built;
  PATH `~/.cargo/bin/archon` updated (was stale July-10). Verified on-Mac: 35,922 rows,
  verify-quote EXACT w/ page+bbox, zero re-ingest. Old 29GB copy deleted; `archon-cli-v3` untouched.
- **Committed:** archon `99f6b24d` (bt_fcm_redo), `d4dc299d` (queue tooling) → private;
  claudeflow local-only `85e83ac4c` (reports), `609345a85` (remaining-work register),
  `ee3850ad6` (showcase + drafting plan).

## 3. Where we are RIGHT NOW

- WSL is the working system; Mac is a verified current replica (divergence caveats in
  `reference-archon-mac-stale-path-binary` memory: six docs carry absolute WSL source paths;
  Python tooling hardcodes WSL BASE; Mac marker_python venv absent).
- GPU services (vLLM :8002, embedder :8000, marker :8003) are DOWN by user instruction; CPU god
  daemons + ChromaDB up. Restart via `/god-launch` if needed. GPU is free.
- Binary `archon 1.3.11 (d4dc299d)`; zero crate changes pending. Build env:
  `PATH=$HOME/.cargo/bin:$PATH LIBCLANG_PATH=/usr/lib/llvm-18/lib cargo build` — **verify
  `target/debug/archon` mtime + `--version` hash after building.**
- NAS Hermes mounted at `/mnt/v` (drvfs); `Library` scanned (~1,961 PDFs, ~45 fields) — bulk-ingest
  assessed, NOT sanctioned (needs scoping + dedup first; see session notes in overhaul memory).

## 4. WHAT REMAINS (execute in this order)

### B — Machine work, no user input needed (start here)

1. **Thin-entry enrichment targets** (real density measurements, records/1,000 words vs 15–35
   band): `sandbox:heidegger-bcap-4-5` **0.8** · `wendt-design-for-dasein` **2.1** ·
   `sandbox:aristotle-da-3-3` **2.5** · `sandbox:caston-1995` **3.3** · `sandbox:nussbaum-1985`
   **5.9** · `sandbox:metzinger-2018` **13.4**. These need NEW CLAIM AUTHORING under the D-gates
   (density, loci machine-resolved, quotes exact-anchored — the D5 pilot
   `scripts/corpus-import/pilot_vle_eyetracking.py` is the working exemplar of gate-compliant
   authoring). This overlaps C-1: treat each as an F2 entry regeneration.
2. **Page-locus enrichment** for `dissertation` / `veridissimilitude` / `wendt-design-for-dasein`
   claims (line-range loci → section-coverage + distribution gates NEEDS-DATA). Route: back-fill
   page loci from the entries' anchored clauses (exact anchors carry page_pdf) or supply
   `section_inventories` in `gates-config.json`.
3. **`corpus_sources.archon_document_id` column refresh**: column holds pre-F1 ids; readers must
   chase `docid-remap.json` (helper: `gatelib.live_doc_id`). One-shot fix: dump sources → remap →
   re-import. Removes the trap for all future readers.
4. **Skipped-span recovery** (`.archon/corpus-import/phase-f-skipped.jsonl`): 208 Greek spans
   (BCAP — verify against the Greek docs: Kassel Rhetorica, De Anima Ross_Greek), 62
   synthesis-file spans (need multi-doc attribution), 31 unmapped-article spans (improve the
   article→doc matcher in `phase_f_extract.py`).
5. **F1 engineering debt**: (a) `f1_reingest_driver.py` preflight `MIN_FREE_VRAM_MB` is a flat
   12GB — should scale with page count (this let B&T/FCM plan onto CPU); (b) a Marker fallback
   that zeroes an existing spatial layer passes admissibility as "ok" — make it FAIL or
   auto-requeue; (c) `docs delete` non-atomic (strips chunks before vector-store refusal);
   (d) orphan sentence-row sweep; (e) Marker ladder reports only last rung's error; (f) S8
   second-engine escalation for the MARKER path (Kassel rho→eta detected, not re-OCR'd).
   (a),(b) = highest value. These are Rust/driver changes — rebuild + verify binary hash after.
6. **Hygiene:** 3 phantom "Ingesting" doc rows on the store (killed-attempt leftovers — find via
   `docs list | grep Ingesting`, delete); `sandbox:test-paper` fixture disposition (ASK USER:
   remove or exempt); DISS-03-C001 dangling support ref (re-point to a clause — may need user
   ruling on which clause).

### C — Programme closure

1. **F2 entry regeneration** (THE major body): the 27 entries under the locked creation system,
   each against its per-entry defect checklist from `02-FINDINGS-TRACEABILITY.md`; relational
   apparatus migrated, never re-derived; per-entry acceptance = all D1 gates green + checklist
   dispositioned. Order by the thin-entry list (B-1). Plan §F2.
2. **Heidegger claim layer**: BCAP/BT/FCM have clause-level quotes but NO claim rows (draft plan
   row: FCM = "245 structured + ~1,100 locus-anchored prose claims + 2,090 quoted spans | Parse +
   back-extract"). Parse the entries' structured JSON/positions tables into claim rows under gates.
3. **F3 programme acceptance**: measure the §0.2.2 table — density in band, reachability ≥95%,
   char-spans ≥90% where text layer exists, quotes 100% exact-gated, 0 narration-satisfiable
   gates, relational layer preserved AND reachable. Every row at target or not done.
4. **Open questions N1/N3/N5** (`phase1-final-plan/03-OPEN-QUESTIONS.md`) — need user rulings.
5. **Preservation**: refresh Mac `~/claudeflow-preserve/` with end state (**needs user
   permission**); the archon-side replica is already current (§3).
6. **Drafting-system upgrade** (`plans/drafting-index-integration-plan-2026-07-30.md`) — awaiting
   the user's multi-round plan review; do NOT start without it.

### A — Deferred user-review tier (do NOT start; offer when user has time)

Drift review 405 (`DRIFT-REVIEW-2026-07-31.md`) · reclass 324 · Phase-F not-found tail 1,596
(offer heuristic pre-sort first) · core not-founds ~89 · concordance 8 (user's repair session
writes that file) · FCM keystone ruling · WRAITH power-down. See memory
`project-drift-review-deferred` and `REMAINING-WORK-2026-07-31.md` §A.

## 5. Hard-won operational gotchas (READ before running anything)

- **pgrep/pkill -f SELF-MATCH** (burned 3×): the calling shell's cmdline contains the pattern —
  ALWAYS bracket-trick (`pgrep -f "reanchor_[c]lauses"`), including INSIDE Monitor scripts, and
  never `pkill -f` a pattern present in your own command line (it killed our own shell, exit 144).
- **Heredocs are hook-BLOCKED** — write scripts with the Write tool; also `cmd | tail` buffers all
  output until exit (use for post-hoc capture only).
- **cozo sqlite serializes EVERYTHING** (in-process AND cross-process, reads incl.); batch
  doc-wide reads, never per-item guarded reads; never two Marker ingests concurrently; verify-quote
  MUST be `--doc` scoped in batch (corpus-wide fuzzy = 125s timeouts).
- **Never rewrite `reanchor-ledger.jsonl` while a runner is appending** — every fix script guards
  with pgrep; keep it that way. Runner is restart-safe; killing it orphans its verify-quote child
  (holds the vector store — `lsof .archon/doc-vector-store/LOCK`, kill the orphan).
- **Mid-run `--plan` lies**: `f1_reingest_driver.py --plan` re-lists re-ingested docs as pending
  (doc-ids changed); trust `f1-report.jsonl`, not the plan, for done-ness.
- **`corpus_sources.archon_document_id` is STALE post-F1** until B-3 lands — always resolve
  through `gatelib.live_doc_id` / docid-remap.json.
- **Drift ≠ cosmetic**: the verify engine already normalizes whitespace/hyphens/quotes; a drift
  verdict means real wording differences, and the fuzzy `source_span` can be the WRONG PASSAGE.
  Never auto-replace quotes; review-only (user precedent D5: re-author to source, never bypass).
- **VLM residency starves Marker placement**; driver preflight unloads ollama but the flat 12GB
  threshold is the B-5(a) debt. Marker budget 9000 (windowed >82pp) is PERMANENT policy.
- Env prefixes (`PATH=… cmd1 && cmd2`) apply only to cmd1; check binary mtime + `--version` hash
  after every build (stale-binary footgun hit twice: WSL pre-commit build, Mac PATH binary).

## 6. Key paths

| What | Where |
|---|---|
| Programme folder (plan, matrix, logs, THIS handoff) | `plans/index-overhaul-2026-07-29/` (claudeflow-testing) |
| Remaining-work register (A/B/C detail) | `REMAINING-WORK-2026-07-31.md` (same folder) |
| F2 triage report · drift review doc | `F2-TRIAGE-REPORT-2026-07-31.md` · `DRIFT-REVIEW-2026-07-31.md` |
| Authoritative plan / traceability / open questions | `phase1-final-plan/01-…PLAN.md` / `02-…` / `03-…` |
| Archon repo / branch / HEAD | `/home/dalton/projects/archon-cli` · `feat/wraith-retrieval` · `d4dc299d` |
| Import tooling | `archon-cli/scripts/corpus-import/` (extractor, drivers, reanchor, apply, fixes) |
| Gate suite (15 checkers + config + emit) | `archon-cli/scripts/checkers/` |
| Durable intermediates (ledger, remap, reports, review files) | `archon-cli/.archon/corpus-import/` |
| Store | `archon-cli/.archon/archon-data.db` (+ `doc-vector-store/`) |
| Mac replica | `daltonsalvo@192.168.50.10:~/projects/archon-cli` (bash -lc; PATH archon = current) |
| Memory files | `project-index-overhaul-2026-07-29`, `project-drift-review-deferred`, `reference-archon-mac-stale-path-binary` |

## 7. First moves for a fresh session

1. Read this handoff, then `REMAINING-WORK-2026-07-31.md`, then the memory file's 2026-07-31 blocks.
2. Verify state: `cd /home/dalton/projects/archon-cli && git log --oneline -3` (expect `d4dc299d`);
   `./target/debug/archon --version` (expect `d4dc299d`); `corpus-index status` (expect 35,922 rows).
3. Start with B-3 (doc-id refresh — small, removes a trap) and B-6 hygiene, then B-5(a)(b)
   (driver+admissibility hardening), then B-2/B-4, then B-1 flowing into C-1/C-2.
4. Pause for user decisions where marked (test-paper, DISS-03-C001 target, N1/N3/N5, preservation
   permission, drafting-plan review). Commits: evidence first, sign-off, then archon→private only.
