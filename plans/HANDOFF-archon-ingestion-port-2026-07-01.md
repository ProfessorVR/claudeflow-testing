# HANDOFF — Archon (Rust) ingestion port + corpus flip (2026-07-01)

> **FIRST ACTION in the new session:** implement
> **`plans/archon-page-dimension-coverage-plan.md`** (the finalized "true page-dimension coverage"
> plan — adoption #2). It was designed + reviewed across three rounds this session and is
> implementation-ready. Everything else below is context and the queue behind it.

## 0. Read-first
- **Memory note (dense running log):** `project-archon-ingestion-port-finish-plan.md` — the most
  detailed state; skim it before touching code.
- **Plans:** `plans/archon-page-dimension-coverage-plan.md` (#2, do first),
  `plans/archon-corpus-flip-and-pipeline-test-scope.md` (the flip + single-doc test design),
  `plans/archon-ingestion-port-finish-plan-2026-06-30.md` (master plan / PR breakdown),
  `plans/archon-PR-D-mac-setup-guide.md` (Mac/hardware guide).

## 1. Overall goal
Finish porting the god-agent (Python/Node) **ingestion** system into the Rust **archon** system
(`/home/dalton/projects/archon-cli`, fork `ProfessorVR/archon-cli`, branch `dissertation-ports`),
make it **multi-platform GPU-resource-adaptive** (NVIDIA CUDA + Apple Metal/MPS + CPU; free-VRAM
driven, not card-size), and then **flip the corpus** onto it. Endgame: archon as the system of
record (full god-agent → Rust conversion later).

## 2. Repos / machines / key paths
- **archon-cli:** `/home/dalton/projects/archon-cli` — branch `dissertation-ports`, **22 session
  commits, NOT pushed** (all local). Working tree clean.
- **god-agent (corpus + plans):** `/home/dalton/projects/claudeflow-testing`.
- **Machines / SSH:**
  - **5090 (this box, WSL):** fully set up. `~/.venv-marker` (marker-pdf, python3.11); Ollama
    running with `qwen2.5vl:7b`; tesseract installed; `archon` bin built at `target/debug/archon`.
  - **Mac** `daltonsalvo@192.168.50.216` (MPS, 24 GB): Ollama+`qwen2.5vl:7b` **persistent** (brew
    services); marker venv `~/.archon-marker-venv` (python3.12); archon repo `~/archon-cli`.
    **NOT yet:** archon bin built, `tesseract-ocr`, `workers.vlm=allow-local`, King/Uexküll docs.
  - **Laptop** `dalton@192.168.50.243` (Windows; use `wsl -e bash`), WSL Ubuntu-24.04 `CHIMERA`,
    **RTX 5070 8 GB** (real constrained-CUDA target). Rust 1.96.0 + archon-cli code cloned in WSL;
    **build deferred to the end** (needs `sudo apt install libclang-dev …`, cargo build, marker venv
    w/ torch cu128, policy). Note: laptop is Windows-WSL+NVIDIA like the 5090, so 5090 builds port.

## 3. Accomplished this session (commit chain, newest first)
All on `dissertation-ports`:
- `25765100` **loud pre-ingest enrichment report + confirmation** — `archon docs ingest <pdf>` prints
  an ENRICHMENT PLAN banner (SCANNED BOOK→skip N / BORN-DIGITAL→enrich M + warning); TTY-gated
  confirm unless `-y/--yes`. `pdf::classify_pdf_enrichment` (pdfimages-list + pdfinfo, reuses the
  pipeline detector so report=reality).
- `ec462bc5` widen page-scan aspect gate to **1.7** (book/legal; Uexküll scans 1.58–1.61).
- `4c53317c` **aspect-ratio gate** (adoption #1) — page-scan = large AND page-shaped.
- `814c3f61` document the **workers.vlm master gate** + tesseract requirement (template).
- `0d69f04f` **skip enrichment of full-page scans** (self-scanned books).
- `1d9cb752` **fold image-OCR + VLM chunks into chunks_root** (V-1 image integrity re-fold).
- `1ebf773e` **VLM constrained-VRAM knobs** (num_ctx / keep_alive / num_gpu).
- `58bedc6d` VRAM/compatibility guide (`docs/ingestion/hardware-vram-guide.md`) + qwen2.5vl template.
- `d10ef53b`/`801ad344` Marker as DEFAULT via policy (gitignored real `policy.toml` + committed
  `policy.example.toml`) + `effective_policy` verifier.
- `6ef908a8`/`82177ba1` **page-range chunking** (big-doc-on-small-card GPU) + `chunk_ingest` verifier.
- `15609aea` **page-scaled Marker footprint** `min(6000+30·pages,10240)`; reverted `3b0e4904` batch
  tiers (PR-D calibration: batch VRAM-inert, VRAM ~doc-size bounded).
- `c36edef5`/`27fa64cd`/`83a922e1`/`00f77ae9`/`bf7f9350`/`1f0dcd4c`/`12f2c780` — PR-D footprint
  measurement, chunk-parity/bbox-jitter harnesses, **archon-accel** (free-VRAM detect + placement),
  parity register.

**Validated on the 5090 (both pipeline modes PASS):**
- **King** (born-digital, 17 pp): Marker + image OCR + **17/17 VLM figure descriptions**
  (qwen2.5vl:7b, real + retrievable, e.g. "a pie chart titled Why VR is More Educationally
  Beneficial") + integrity re-fold + retrieval.
- **Uexküll** (self-scanned, 281 pp): Marker + **split/merge** (pages 1–281 contiguous, forced
  `marker_memory_budget_mb=9000`→~4 chunks) + **scan-skip** (281 scans → 0 OCR/0 VLM) + integrity +
  retrieval.

**Tests:** archon-docs **202 lib** + 8 scan-detection + archon-policy 15 + archon-accel 20; clippy
(touched files) + fmt clean.

**Design/plans finalized:** page-dimension coverage (#2, reviewed 3×), corpus-flip-and-test scope.

## 4. Config / operational gotchas (IMPORTANT)
- **Commits are NOT pushed** — `dissertation-ports` is local-only. Nothing on GitHub yet.
- **VLM needs TWO gates + a dep:** `[policy.workers] vlm = "allow-local"` (master gate — a "deny"
  silently overrides `[policy.docs.vlm] enabled=true`) **and** `docs.vlm.enabled=true`, **and**
  `tesseract-ocr` installed for image OCR. All set on the 5090; **needed on the Mac/laptop.**
- **Ingest is idempotent by content-hash** → re-ingesting the same file "Skipped: duplicate". To
  re-run the pipeline on an existing doc use **`archon docs reprocess <doc-id>`** (clears + re-runs).
- **Run archon FROM `~/archon-cli`** so `load_effective_policy(cwd)` picks up `.archon/policy.toml`.
- The Marker sidecar's stderr is captured internally (not in ingest logs) — confirm Marker ran by
  the **absence** of a "falling back to text chunking" warning.
- `marker_memory_budget_mb` was a **test-only** override (reverted); the 5090 uses full 31 GB
  whole-doc; chunking auto-triggers only on the 8 GB laptop. Set the budget again to force chunking
  in tests.
- **Parity rule:** compare SCHEMA (chunk count, page coverage, integrity) NOT hash digests — bboxes
  are neural and device-dependent by design (§8). Transfer-once-then-sync is safe; independent
  re-ingest on different devices diverges.
- The real `.archon/policy.toml` is **gitignored** (machine-specific paths); the shareable template
  is `.archon/policy.example.toml`.

## 5. Remaining work (in order)
1. **▶ FIRST — implement adoption #2** per `plans/archon-page-dimension-coverage-plan.md`: `lopdf`
   page dims (inheritance walk + cycle/array guards), `classify_by_coverage` (ppi-proxy; unusable
   ppi → defer to aspect + low-confidence flag; capped multi-strip sum), A/B wrapper + `scan_detector`
   policy knob + divergence logging, wire both verdicts into the #1 report, corpus dry-run validated
   by the **pypdfium2 placement oracle** (±0.02 tolerance; coordinate note de-risks the figure-region
   VLM path).
2. **Mac cross-device validation:** build `archon` bin on the Mac, `sudo apt install tesseract-ocr`
   (or brew equiv), set `workers.vlm=allow-local`, transfer King + Uexküll, run both on MPS. (Mac
   sleeps — may refuse SSH until woken.)
3. **Corpus flip:** enumerate the corpus (`claudeflow-testing/corpus/**`, ~50 PDFs), ingest **once on
   the 5090** (whole-doc, full VRAM), verify per-doc, then **transfer the DB** to Mac/laptop. Use the
   pre-ingest report/confirm to catch misclassifications; watch for the image-only-doc root gap.
4. **PR-E residue (dissertation-facing):** V-3 quote matcher (`locate_quote`/`find_fragment_bboxes`),
   V-4 `archon docs verify-quote` CLI, the **image-only/scanned-PDF `chunks_root` gap** (docs with an
   empty text layer still get no root — needs a synthetic artifact; noted in `ingest_pdf.rs`), and the
   optional **figure-region VLM** (crop Marker figure bboxes → describe; needs the pdfium y-flip the #2
   dry-run validates).
5. **PR-C2** GPU embedding EP (perf-only, optional). **Deferred:** multi-consumer VRAM arbiter (video
   round), **laptop full build**, golden-corpus capture on the hard cases.

## 6. Quick verification commands (sanity in the new session)
```
cd ~/archon-cli && git log --oneline -3          # expect 25765100 at HEAD
./target/debug/archon docs list                  # King + Uexküll present
./target/debug/archon docs ingest "<some.pdf>"   # see the ENRICHMENT PLAN banner
LIBCLANG_PATH=/usr/lib/llvm-18/lib cargo test -p archon-docs --lib   # 202 pass
```
