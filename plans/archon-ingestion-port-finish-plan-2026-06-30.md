> **Editor's note (2026-06-30, added on save).** The workflow ran from the WSL/RTX-5090 box and therefore could
> not see the user's other machines, so it raised **§9 Q15** ("does an 8 GB constrained target exist?"). The user's
> own request answers it: the constrained fleet is **(a) a laptop with an RTX 5070, 8 GB VRAM (constrained CUDA — REAL,
> not a 5090-cap proxy)** and **(b) a Mac with 24 GB unified memory**. So the constrained-CUDA decision rows (§4.3) and
> the Apple-unified rows are BOTH live targets; the "memory-cap the 5090 as a proxy" idea in PR-D is now only a
> convenience for testing the CUDA path on this box, not the real validation. Q15 reduces to: confirm the Mac is 24 GB
> (stated) and treat the RTX 5070 8 GB laptop as the canonical constrained-CUDA host.

---

# Plan of Attack — Finish the God-Agent → Archon (Rust) Ingestion Port, with a GPU-Resource-Adaptive Layer as the Centerpiece

- **Status:** Scoped / ready for go. The chunk/bbox/integrity *substrate* is built, committed, and parity-green; this plan finishes it and adds the **net-new** device/resource-adaptive layer the user flagged.
- **Date:** 2026-06-30
- **Repo (target):** `archon-cli` (fork `ProfessorVR/archon-cli`, working copy `/home/dalton/projects/archon-cli`), branch **`dissertation-ports`** (verified checked-out), working tree clean. Built on commits `f637a00c` (port #2 wire-in + style train), `594ecb5e` (B2 local Marker real bboxes + I2 CLIP image embeddings), `7029966b` (4 audit-fix bugs). None of these are on `main` (`git log --oneline main..dissertation-ports`).
- **Parity target (source of truth):** god-agent `claudeflow-testing`, ingestion repaired "local-first" 2026-06-28. Canonical chunker: `scripts/ingest/markdown_chunker.py`; orchestrator `scripts/ingest/run_ingest_phase2.py`.
- **Deployment target (per port roadmap memory):** a **MacBook Air** (Apple Silicon, unified memory). This — not an 8 GB NVIDIA card — is the realistic *constrained* host; the NVIDIA fleet (RTX 5090 32 GB dev box + WRAITH 2×RTX 3090 24 GB) is dev/pool hardware. See §9 Q15.
- **Method:** Six-reader code-mapping pass over both repos (the DOSSIER), synthesized here; every `file:line` anchor below was source-verified on `dissertation-ports` and **fully crate-qualified** unless explicitly marked `[R#]` (reader-reported, not re-verified by the author) or `[CONFIRM]` (needs real Marker hardware).

---

## 0. Provenance & key corrections to prior plans/SITREPs

Read this first — several documents in `plans/` are now stale and will mislead a planner who trusts them over the code.

- **`plans/archon-ingest-ext-wirein-plan.md` is SUPERSEDED.** Its central claims — "`scripts/archon_marker_sidecar.py` / `scripts/chunk_parity_check.py` **do not exist**," "no `plans/` dir," "real Marker JSON is produced nowhere" — are **all false now.** The wire-in landed in `f637a00c`; the sidecar (`scripts/archon_marker_sidecar.py`, 138 lines) and harness (`scripts/chunk_parity_check.py`, repo-root `scripts/`) both exist. Do not treat that plan's "X does not exist" prose as current.
- **`plans/ARCHON-PORT2-COMPLETE-2026-06-25.md` says the work is "uncommitted on `dissertation-ports`." STALE.** It is now committed (`f637a00c`/`594ecb5e`/`7029966b`) with a clean tree. [R4]
- **DOSSIER R1 path correction:** the parity harness is at **`scripts/chunk_parity_check.py`** (repo-root `scripts/`), *not* `scripts/ingest/chunk_parity_check.py`. Verified; R6 had the correct path.
- **Crate-path discipline (lesson from the prior wire-in plan's failure mode).** The earlier plan mis-located code and a reader (R2) grepped the wrong crate. **Every anchor in this plan is crate-qualified, and the two distinct wiring sites are kept separate:**
  - **Policy *parsing*** lives in **`crates/archon-policy/src/loader/loader_docs.rs`** — verified *parse-only*: it declares `marker_device: Option<String>` (`:65`) and assigns `policy.marker_device = raw.marker_device` (`:199-200`); there is **no** `Command::new`, no `--device`, no subprocess spawn here. Do **not** treat `loader_docs.rs` as a device-actuation site.
  - **Device *actuation*** lives in **`crates/archon-docs/src/marker_source.rs`** (`from_policy` `:36`, the `cmd.arg("--device").arg(dev)` push `:62`) and the ingest flow **`crates/archon-docs/src/ingest_pdf.rs`**.
  - `block_chunking.rs` is **`crates/archon-docs/src/block_chunking.rs`** (where R2 mistakenly looked in `archon-ingest-ext`).
- **DOSSIER R2 vs R4 locator tension — RESOLVED in R4's favor.** Rust **does** extract+store locators: `crates/archon-docs/src/block_chunking.rs:158` calls `layout::extract_locators(blocks)`, mapped via `map_locator_kind` (`block_chunking.rs:90`). R2's "grep found no regex in `marker.rs`/`chunk.rs`" looked in the wrong files — the regex lives in `crates/archon-ingest-ext/src/layout.rs:44`. **But** there is a real semantic divergence (Rust anchored standalone-line strip+capture vs Python unanchored inline scan) — see §3.5.
- **Headline correction (the reason this plan exists):** the user's GPU-resource-aware adaptation appears in **none** of the ingestion specs (`archon-ingestion-ports-spec.md`, `archon-verbatim-provenance-spec.md`) and **no** code in either repo. A planner reading only the specs/SITREP will conclude "port done" and miss the one item the user explicitly flagged. It is greenfield (§4).
- **Centerpiece reframed after adversarial review (see §4).** The draft framed the deliverable as a *shared cross-component VRAM budget*. On the in-scope PDF path that is unjustified: the Rust embedder is **CPU-only** and Marker is a **sequential subprocess**, so there is **no intra-Archon co-residency to arbitrate**. The adaptive layer remains the centerpiece, but its in-scope job is **single-consumer Marker placement on a heterogeneous, co-tenanted host**; the multi-consumer budget is a **dormant forward-seam** whose only real contention case (whisper + frame-VLM) is the deferred video work.

---

## 1. Status & ground truth — what is already DONE and committed

The chunk/table/locator/integrity **substrate** is built and tested on `dissertation-ports`. Treat the following as DONE (do not re-port):

**Structured-extraction substrate (S-0…S-3), in `crates/archon-ingest-ext/src/`:**
- `chunk.rs` — token-aware, bbox-carrying chunker; `chars/4` **code-point** token estimate (matches Python `len()//4` — both count Unicode code points, so Greek glyphs don't diverge), pairwise undersized-merge. 29 tests pass (`cargo test -p archon-ingest-ext`).
- `marker.rs` — Marker JSON block-tree parser (`{block_type,id,html,bbox,children}`, `/page/N/` → 1-indexed page N+1).
- `table.rs` — `is_real_table` gate + HTML→`TableGrid` (structured; **diverges from Python by design**, see §3.6).
- `layout.rs` — Bekker/page-number locator **strip + capture**; `bekker_re()` = `^\s*\d{1,4}[ab]\d{0,3}\s*$` (`layout.rs:44`), intentionally **broadened** from Python (`\d{2,4}`) to catch 4-digit Aristotle numbers like `1147a`.

**Integrity + provenance, in `crates/archon-docs/src/`:**
- `schema.rs:158-176` — `doc_chunk_spatial` (with `coord_space`), `doc_chunk_hashes`, `doc_locators` satellites.
- `block_chunking.rs` — `ChunkOut → ChunkArtifact` (id format preserved, bbox→spatial capture, locator persist via `:158`; sentinel `bbox`/`coord_space="none"` on the pdftotext fallback path).
- `provenance_chunks.rs` — **V-1 Merkle provenance (Rust-only addition):** `commit_hash()` (`:35`, sha256 of `chunk_id∥raw∥clean∥spatial∥cleaning_version`), `chunks_root()` (`:48`, sorted-flat root, comment "upgradeable to a Merkle root"), populates `provenance_record_id`, plus `verify_chunks_root` tamper check.
- `marker_source.rs:20` — `MarkerSource::{Subprocess, Http, PreExtracted}`; `from_policy` (`:36`) forwards `--device <dev>` (`:62`) only when `marker_device` is `Some`.
- `embed_fastembed.rs` — fastembed BGE-base-en-v1.5 (768-dim, `:11`) + CLIP ViT-B/32 (512-dim); `InitOptions` at `:237`/`:266`/`:280` set **no** ONNX execution provider ⇒ **CPU EP** (verified). This is load-bearing for §4.

**Policy + sidecar:**
- `crates/archon-policy/src/models.rs:222` `PdfPolicy` — `chunker` (`:233`, default `"token_aware"`), `marker_sidecar` (`:237`), `marker_device` (`:240`, default `None`), `marker_python` (`:245`); **parsed** in `crates/archon-policy/src/loader/loader_docs.rs:199-200` (parse-only, see §0).
- `scripts/archon_marker_sidecar.py` — `resolve_device()` (`:28-42`) auto-detects `cuda→mps→cpu`; `--selftest` is torch-free; `run_marker` (`:83`).

**Tests green (local):** archon-ingest-ext 29, archon-docs ~189–190 (`--lib`, ~78s single-thread), archon-policy 5. `cargo build --bin archon` clean. Golden gate `chunk_parity_matches_python_reference` (`crates/archon-ingest-ext/src/marker.rs:259`) reproduces real Python `chunk_marker_json` output on a synthetic fixture.

**Two intentional, documented deviations from Python (already in `dissertation-ports`):** (a) `page_end` = last page actually contained (citation-accurate); (b) Bekker regex broadened. These are *features*, not drift.

**Bottom line:** the part the 2026-06-28 Python fix targeted (sha + bbox + integrity per chunk) is mirrored in Rust and tested. What remains is (1) confirming parity still holds after that fix, (2) the greenfield device/resource-adaptive layer, and (3) a defined residue tail (§5).

---

## 2. Scope

### IN scope (this round = "finish the ingestion system")
1. **PDF/OCR text ingestion with integrity** — per-chunk `raw_sha256`/`clean_sha256`, `chunks_root`/`commit_hash`, bbox (`doc_chunk_spatial`), Bekker/Stephanus + page locators. (Substrate done; this round finishes parity + the residue.)
2. **GPU-resource-adaptive layer (the centerpiece, §4)** — cross-platform **detect** (free VRAM, not card size) → **fit/placement policy** → **actuation** into the Marker sidecar (device/precision/surya batch caps + per-doc OOM→CPU). Built as a **shared, video-aware `archon-accel` crate**, but in this round it places **one** GPU consumer (Marker); the multi-consumer budget arbiter is a **dormant seam** (see §4 framing).
3. **Parity reconciliation** with the just-fixed (2026-06-28) Python ingestion (§3).
4. The defined ingestion residue (§5): real-Marker parity diff, sidecar field-mapping/`bbox-vs-polygon` `[CONFIRM]`, page-count reconcile, image-OCR integrity, corpus flip+re-ingest, and (sequenced last) V-3/V-4 quote verification.

### OUT / LATER (with interfaces noted)
- **Full god-agent → Rust endgame.** The long-term goal; not this task.
- **Corpus/index migration** (`archon-corpus-index-migration-spec.md`, 8 phases P0–P7). **Adjacent / after.** It is an offline CozoDB authoring+retrieval layer with **no device/PDF-runtime dimension**; it *depends on* ingestion (its `corpus_concept_chunks` link to `doc_chunks`) but is not part of finishing ingestion. **Interface to preserve:** ingestion must keep emitting `doc_chunks` with stable `chunk_id`s that the corpus importer can reference. [R5]
- **Lanham style port** — unrelated to ingestion (prompt-injection + scoring, no device dimension). [R5]

### VIDEO — recommendation: **sequence the video port AFTER PDF, but build `archon-accel` video-aware (multi-consumer-capable) from day one.**
Rationale (DOSSIER R5):
- Video **already shares** the chunk/integrity/provenance backbone (`archon-video::ingest_video` reuses `archon_docs::schema`, `store::insert_chunk` with `content_hash`, provenance edges). bbox is legitimately N/A — the spatial analog is `video_chunk_timeref{timestamp_start_ms,end_ms}` (`crates/archon-video/src/schema.rs:70` [R5]) + frame perceptual hashes. So integrity/provenance parity is effectively **done and clean** for video.
- **But** video's device handling is *more* stubbed than PDF's: `asr.rs` `probe_gpu_backend` (`:414` [R5]) maps every GPU request → `("cpu", true)`; `whisper-rs` returns a `NullAsrAdapter`; `faster-whisper` is unwired; frames shell to a `python3` OpenCV subprocess (`opencv_frames.rs`). Folding full whisper/frame-VLM GPU wiring into *this* plan would balloon scope well beyond "PDF ingestion with integrity+bbox+device-adaptive."
- **Why this matters for the centerpiece framing:** the **only** real multi-consumer VRAM contention case (Marker + embed + **whisper + frame-VLM** sharing one small pool concurrently) is the *video* case. PDF has no such concurrency (CPU-only embedder + sequential Marker subprocess). So the shared *budget arbiter* must exist as an API seam **but is exercised by exactly one consumer (Marker) in this round.** Building `archon-accel`'s consumer-registration interface now — and letting whisper/frame-VLM register later — is the hedge that avoids re-stubbing device logic when video lands; it does **not** require building the multi-consumer arbitration to "done" today.

---

## 3. Parity reconciliation (after the 2026-06-28 Python fix)

**The naïve test — "do the chunk hashes match across systems?" — is the WRONG test and WILL fail by design.** Confirm *schemas and semantics*, not hash values. Concrete reconciliation steps:

**3.1 Chunk-boundary parity (the one that must stay byte-exact).**
- Run `python3 scripts/chunk_parity_check.py` (imports `markdown_chunker.chunk_marker_json` from `CHUNKER_REF_DIR=/home/dalton/projects/claudeflow-testing/scripts/ingest`) → reference `{page_start,page_end,text_head,text_len,bbox_pages}`. Diff against Rust `chunk_blocks` (`crates/archon-ingest-ext/src/chunk.rs`) on the **same** Marker JSON.
- Constants must match: `TARGET_MIN_TOKENS=800`, `TARGET_MAX_TOKENS=1200`, `HARD_MAX_TOKENS=1400`, `CHARS_PER_TOKEN=4` (`scripts/ingest/markdown_chunker.py:26-31`). est-token parity is OK (both code-points/4).
- **Known ungated divergence:** the cross-page max-flush `page_end` correction (Rust = last page actually contained). The harness uses only the "clean case"; the corpus diff (§5/PR-E) must expect this on multi-page chunks and the parity report must annotate it as intentional.

**3.2 SHA-scheme reconciliation — divergent by design, document don't "fix":**
- Python `clean_sha256` hashes **cleaned** text (`clean_corpus_text` strips standalone Bekker/page lines, collapses whitespace), `cleaning_version="clean_v1"` (verified `scripts/ingest/run_ingest_phase2.py:505`), so `clean_sha256 ≠ raw_sha256`. [R2]
- Rust does **no** cleaning: `cleaning_version="none"`, `raw_sha256 == clean_sha256 == content_hash` (`crates/archon-docs/src/provenance_chunks.rs`).
- → Field *names* match, *values* don't. **Decision needed (§9 Q4):** replicate `clean_v1` so the two corpora are hash-comparable, or keep `none`. Until decided, drift detection must compare the *scheme*, not the digest.

**3.3 `chunks_root`/`commit_hash` — Rust-only.** Python has no Merkle equivalent (grep: 0 hits — verified) [R2]. This is an Archon *addition*, not a port. **Decision (§9 Q5):** keep Rust-only, or back-port into Python for true parity.

**3.4 bbox schema parity.** Rust carries bbox 1:1 through `ChunkOut.bboxes` → `doc_chunk_spatial` (per-page super-box + members, `coord_space="marker"`). Python injects bbox **per-page** (coarser than 1:1) [R2]. Rust may be *more* precise — confirm the intended target is the 1:1 Rust schema, not the coarser Python one.

**3.5 Locator-regex semantics (newly surfaced divergence).** Rust `bekker_re` is **anchored** (`^\s*…\s*$`, `crates/archon-ingest-ext/src/layout.rs:44`) → captures only *standalone running-head* locators (strip+capture). Python `_LOC_BEKKER_RE = \b\d{2,4}[ab]\d{0,3}\b` / `_LOC_STEPH_RE = \b\d{2,3}[a-e]\d{0,2}\b` (`scripts/ingest/markdown_chunker.py:303-304`) are **unanchored** → capture **inline** locators anywhere in body text. These produce different `total_locators`. **Decision (§9 Q7):** match Python (inline) or keep Rust (running-head-only).

**3.6 Table-structure parity.** Python **flattens** Marker `Table` blocks into run-together prose (`Table ∈ _TEXT_BLOCK_TYPES`, bare HTML-strip); Rust builds structured `TableGrid` (`crates/archon-ingest-ext/src/table.rs`). **This is a known Python quality loss, not a feature to replicate** — porting it verbatim would *regress* the corpus. Recommend keeping Rust structured tables; confirm before declaring "drift" (§9 Q6).

**3.7 Golden-corpus need (blocking for an authoritative gate).** Today only a synthetic 2-page fixture is gated. To make S-1 authoritative we need **real Marker JSON dumps** from representative corpus PDFs + captured Python reference chunks. The named hard cases: **multi-column, hyphenated, footnote-heavy, and a large doc (von Uexküll, `[Clean Copy]` = 197,187,544 bytes ≈ 197 MB — verified on disk; the draft's "~188 MB" was wrong)** [R4]. **This cannot be produced on WSL** (no local Marker) — it requires a real-Marker run on Mac MPS or NVIDIA CUDA, so the golden-corpus capture is itself gated on §4/PR-D hardware.

---

## 4. GPU-resource-adaptive layer (CENTERPIECE) — design + phased implementation

### Framing (right-sized after adversarial review)

The resource-adaptive layer **remains the centerpiece** — but its in-scope PDF job is **single-consumer Marker placement on a heterogeneous, co-tenanted host**, not multi-consumer VRAM arbitration.

**Why the "shared budget" framing was wrong for PDF:** on the PDF path there is **no intra-Archon co-residency to arbitrate.** Verified: the Rust embedder is CPU-only (`crates/archon-docs/src/embed_fastembed.rs` `InitOptions` set no EP; root `Cargo.toml:52` fastembed `default-features=false, features=["ort-download-binaries","hf-hub-rustls-tls"]` → CPU ONNX EP), and Marker runs as a **sequential** Python subprocess (`marker_source.rs:21`) that emits JSON *before* Rust ever embeds (`ingest_pdf.rs` persists chunks/`chunks_root` ~`:149` then enriches images ~`:178`). So on any single box the **only** GPU consumer for PDF is **Marker, alone**. The "8 GB co-residency OOM" the draft worried about is a *video* scenario (whisper + frame-VLM concurrent), which §2 defers.

**What is real — and justifies the layer with a single consumer:**
1. **Host heterogeneity.** The standalone deploy target is a **MacBook Air (Apple unified memory)** per the port roadmap; dev/pool hosts are CUDA (5090, 2×3090); CI is CPU-only. One binary must adapt at runtime.
2. **Co-tenancy (verified on this very box).** Free VRAM is **not** a function of card size. This dev box reports **32607 MiB total but only ~139 MiB free** (other processes hold the 5090). A naïve "big card → put Marker on GPU" rule **OOMs immediately.** The layer must read **free**, not total, and route to CPU/`Http`→WRAITH when `free < footprint`. This single fact justifies the adaptive layer independently of any multi-consumer case.
3. **Per-doc complexity variance.** surya VRAM peak scales with page complexity/DPI, so even a correct *static* budget can under-provision on hard docs → the **per-doc OOM→CPU fallback is the load-bearing correctness mechanism**, not the static estimate.

**What is honestly Python-sidestepped today:** Python never fits-to-VRAM on one box either — it offloads Marker to a remote round-robin **WRAITH pool** (`resolve_marker_pool()`, WRAITH-first, all-reachable, `scripts/ingest/run_ingest_phase2.py:147-163` [R2]) plus hand-tuned surya batch-cap env vars in `god-launch`. So for the standalone Mac case **the Rust port must invent the single-box fit policy.** It is net-new design, not a 1:1 port.

**Consumer-registration seam (built now, dormant):** `archon-accel` exposes a `ConsumerRequest { footprint_mb, can_cpu_fallback, … }` → `PlacementPlan` interface. In this round **one** consumer (Marker) registers; arbitration is trivially single-consumer. Video later registers whisper + frame-VLM, at which point the *multi-consumer budget* logic is filled in. **We build the seam, not the arbiter.**

### 4.1 Architecture — three stages, one new shared crate, minimal touch to existing wiring

The split is **fundamental and must be respected:** Marker device/precision is actuated **Python-side** (`TORCH_DEVICE` + surya env, torch); embedding device, *if ever moved off CPU* (opt-in, PR-C2), is actuated **Rust-side** (ONNXRuntime execution providers). In this round embedding stays CPU.

```
archon-accel (NEW crate)
  Stage 1  AcceleratorReport   <- nvidia-smi(free) | sysctl+sysinfo | sysinfo
  Stage 2  PlacementPlan       <- plan_placement(report, ModelFootprintTable, headroom, overrides)
                                   (single consumer now: Marker; seam for more later)
  Stage 3  actuation:
             Marker   -> sidecar flags  (--device, --dtype, surya batch env, OOM->CPU)  [Python/torch]
             Embedder -> CPU EP (default) ; opt-in CUDA/CoreML EP                         [Rust/onnxruntime, PR-C2]
             Batcher  -> seed IndexOptions.batch_size + AdaptiveBatchController            [Rust]
```

### 4.2 Stage 1 — Detection (`archon-accel`, new crate)

Produce a runtime report (degrade-safe; **never panic, always yield a valid CPU answer**):
```rust
struct AcceleratorReport {
  platform, arch,
  accelerators: Vec<AccelDevice { kind: Cuda|Metal|Cpu, index, name, total_mb, free_mb }>,
  host_ram_total_mb, host_ram_free_mb,
  unified_memory: bool,
}
```
- **CUDA:** shell out to `nvidia-smi --query-gpu=index,name,memory.total,memory.free --format=csv,noheader,nounits` — the proven god-agent mechanism, no link-time CUDA dep, works under WSL (`/usr/lib/wsl/lib/nvidia-smi`). **KEY LESSON:** placement is driven by **`free`**, not `total`. This box returns `0, NVIDIA GeForce RTX 5090, 32607, 139` — a 32 GB card with ~139 MB free — the canonical "trust `nvidia-smi free`, and even then a big card can be unusable under contention" case. `nvml-wrapper` is a later optimization, not required for v1.
- **Apple Silicon:** `cfg!(target_os="macos") && target_arch="aarch64"` ⇒ `unified_memory=true`; total via `sysctl -n hw.memsize` (or `sysinfo` total); free via `sysinfo` available_memory; Metal presence via `system_profiler SPDisplaysDataType`. On unified memory GPU-usable ≈ `total − OS_RESERVE (~6 GiB)`, further reduced by live pressure.
- **CPU/RAM everywhere:** `sysinfo` (already root `Cargo.toml:97` `sysinfo = "0.33"`, currently unused for this).
- **Reuse, don't reinvent:** generalize `crates/archon-world-model/src/backend/mod.rs` — `BackendKind {Cpu,Cuda,Metal,Auto}` (`:13`), `BackendStatus` with `fallback_reason` (`:34/:40`), `select_backend_status(requested, cuda_available, metal_available, allow_cpu_fallback)` (`:117`), `BackendProbeReport` (`:74`) — into `archon-accel`, **adding `total_mb`/`free_mb` memory fields** to the probe report. Keep the Cpu/Cuda/Metal/Auto + CPU-fallback semantics already proven in `jepa/09_training_entry.rs`. Note the existing scaffold is **compile-feature gated** (`crates/archon-world-model/Cargo.toml:9-11`: `candle`/`cuda`/`mlx-metal`) and **memory-blind** — `archon-accel`'s probe must be **runtime** (shell-out), not compile-gated, so a single binary adapts on whatever host it lands on.

### 4.3 Stage 2 — Placement/fit policy (a pure planner fn — most testable piece)

```rust
fn plan_placement(report: &AcceleratorReport, models: &ModelFootprintTable,
                  overrides: &DeviceOverrides) -> PlacementPlan
struct PlacementPlan {
  marker:    DevicePlacement { device, dtype, surya_batch_caps },
  embedding: DevicePlacement { ep, batch_size, instances },   // ep=CPU default this round
  fallbacks: …,   // per-doc OOM -> CPU
}
```
**ModelFootprintTable — ALL FIGURES UNVERIFIED, to be measured in PR-D (do not treat as guarantees):** Marker peak **~5 GiB/worker** is a *reader estimate* attributed to "v2 plan l.233" [R4], **not** a live measurement (no local Marker on WSL; corpus 100% DEGRADED) and surya peak is strongly **page-complexity/DPI-dependent**, so it can under-provision on exactly the named hard cases (multi-column/footnote-heavy/von Uexküll). BGE-base **~0.4 GiB**, CLIP ViT-B/32 **~0.3 GiB**, *(if god-agent parity model adopted)* gte-Qwen2-1.5B **~3–4 GiB fp16, 1536-dim** are likewise unverified. Headroom constant: **~1.5 GiB CUDA**, larger on unified. **→ PR-D captures the real surya peak on the hard cases before any "fits on N GB" claim is made.**

**Decision rules — driven by FREE memory, not card size. The first rule is load-bearing and proven on this box:**

> **⚠ SUPERSEDED IN PART by PR-D calibration (see "execution status" below).** The "surya caps" column and the *reduced/minimal* tier bands are obsolete: PR-D proved batch size is **VRAM-inert**, so there is no "reduced-caps to squeeze onto a GPU" middle rung. The live model is binary per document — **GPU iff `free ≥ page_scaled_footprint(pages) + headroom`, else CPU** (footprint `min(6000+30·pages,10240)` MiB), with per-doc **OOM→CPU** and, for a big doc on a small card, **page-range chunking** onto the GPU. The *free-not-total* first row and the Apple-pressure back-off still hold.

| Detected envelope (driven by **free**, not total) | Marker | Embedding | surya caps | Rationale / status |
|---|---|---|---|---|
| **GPU present, large total / tiny free** (THIS dev box: 32607 MiB total, ~139 MiB free) | **CPU, or `Http`→WRAITH / `PreExtracted`** | CPU | n/a | **`free < footprint` ⇒ never pick GPU on `total`. Co-tenancy fallback. VERIFIED case.** |
| **CUDA, free ≥ Marker_footprint+headroom** | GPU `cuda`, fp16 | CPU (status quo) | generous | fits at current free |
| **CUDA, minimal < free < footprint+headroom** | GPU `cuda` fp16 with reduced surya caps + `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`; **per-doc OOM→CPU** | CPU | reduced | **whether it fits is UNVERIFIED → PR-D measures; OOM→CPU is the guarantee** |
| **CUDA, free < minimal** | CPU (10–50× slower, emergency) or `Http`→WRAITH | CPU | minimal | never OOM |
| **Apple unified, ample (e.g. 24 GB)** | GPU `mps`, fp16 | CPU (or CoreML EP, PR-C2) | generous | budget ≈ total − ~6 GiB OS; **watch pressure, back off if `available_memory` drops** |
| **Apple unified, constrained — MacBook Air 8/16 GB (the actual deploy target)** | GPU `mps`, fp16, reduced caps; back off on pressure | CPU | reduced | **soft-pressure, not catchable OOM → conservative budget; this is the real constrained host (§9 Q15)** |
| **No accelerator (WSL-no-GPU / CI)** | CPU (or `Http`→WRAITH / `PreExtracted`) | CPU | n/a | safe default |

- **ALWAYS attach a per-doc CUDA/Metal-OOM (and Apple-pressure) → CPU fallback for Marker** — the mandatory emergency path. Because the ~5 GiB estimate is unverified and Marker peak varies with PDF complexity, **this fallback, not the static budget, is what guarantees "never OOM."**
- **Precision:** Marker/torch supports fp16 on cuda+mps (set via a `--dtype` env in the sidecar); surya has no standard int8. fastembed/ort *could* load int8-quantized BGE to halve embed memory *if* a GPU EP is ever contended (PR-C2 only).
- **Batch sizing — close the reactive-only gap:** feed the budget into `IndexOptions.batch_size` **and** `AdaptiveBatchController` initial+max (`crates/archon-docs/src/indexing_adaptive.rs:12`, `ARCHON_DOCS_BATCH_MIN/MAX` at `:17-18`). Today that controller is **throughput/failure-reactive only** (grows when `<350ms/chunk` at `:31`, halves on `observe_failure` `:41`) and **never sees Marker GPU OOM** (Marker is a separate subprocess) — so the **first** Marker placement must be made memory-safe up front, and the controller only governs the CPU-side embed batching.

### 4.4 Stage 3 — Placement/wiring (small edits to existing code)

- **Sidecar (`scripts/archon_marker_sidecar.py`):** (a) fix `resolve_device` so `--device auto` means *auto-detect* (today `"auto"` is forwarded verbatim → an invalid torch device; only `None` triggers real auto-detect — `models.rs:240` default is `None`, so this is latent until "auto" is ever passed); (b) add `--dtype` and read surya batch env (`RECOGNITION_BATCH_SIZE`, `DETECTOR_BATCH_SIZE`, `LAYOUT_BATCH_SIZE`, `TABLE_REC_BATCH_SIZE`, `OCR_ERROR_BATCH_SIZE`, `PYTORCH_CUDA_ALLOC_CONF`) the planner sets; (c) on CUDA/MPS OOM, **emit a structured error** the Rust side can catch to retry the doc on CPU (the OOM contract between Rust and the sidecar must be *designed* — it is absent today). Anchors: `archon_marker_sidecar.py:28-42,83-92`.
- **Device-actuation site — `crates/archon-docs/src/marker_source.rs`** (NOT the policy loader): replace the opaque `marker_device` string pass-through (`from_policy:36`, `--device:62`) with a **resolved** device + dtype + batch caps from the `PlacementPlan`; surface the structured-OOM→CPU retry here / in `ingest_pdf.rs`.
- **Policy-parse site — `crates/archon-policy/src/models.rs` + `crates/archon-policy/src/loader/loader_docs.rs:199-200`:** add `PdfPolicy` fields: `marker_device` default `"auto"` (→ planner-resolved; safe-fallback maps to sidecar `None`), plus `embedding_device`/`embedding_ep` and a `memory_budget_mb` override. This is **parse-only plumbing** — it carries the override into `marker_source.rs`, it does not actuate.
- **Embedding GPU EP (OPT-IN ONLY, the riskiest change):** add fastembed/ort Cargo features (`cuda` for NVIDIA, `coreml` for Apple) behind `cfg`, select the EP from the `PlacementPlan`. **`Cargo.toml:52` today is CPU-only.** **`[CONFIRM]` (§9 Q2):** fastembed v4 may not expose ORT execution-provider selection in `InitOptions` — if not, this requires dropping to `ort` directly (a larger change touching `embed_fastembed.rs` + `Cargo.toml`, possibly a dep bump). **Sequencing: do NOT build this in the core round.** Embedding stays CPU; GPU embedding is opt-in PR-C2 gated on the CONFIRM. (Note: because PDF has no co-residency, GPU embedding buys *throughput on big-VRAM/Mac*, not OOM relief — it is a performance option, not a correctness requirement.)

### 4.5 Where the placement decision lives (recommendation)
**Rust-side (`archon-accel`), not the sidecar.** Reasons: it can probe *before* spawning Marker (so placement is decided up front), it is unit-testable on the CPU-only CI runners, and it keeps a single source of truth. The sidecar still resolves its own `cuda/mps/cpu` as a *fallback* when run standalone, but in the Archon path Rust passes the resolved device + caps down. (Alternative: sidecar self-adapts via `torch.cuda.mem_get_info()` — cheaper but only runs when Marker runs and duplicates logic. §9 Q9.)

---

## 5. Remaining ingestion residue (R4's definition-of-done)

Priority map for *this* task's scope:

**P0 — required for "finished":**
- **GPU-resource-adaptive (Marker-fit) layer** (§4) — headline, greenfield.
- **Real-Marker parity diff on corpus PDFs** — Python `chunk_marker_json` vs Rust `chunk_blocks` on real Marker JSON from the named hard cases (multi-column, hyphenated, footnote, von Uexküll-size ~197 MB), modulo the documented `page_end` correction. **Cannot be done on WSL** — needs Mac MPS or NVIDIA CUDA.
- **Sidecar field-mapping + `bbox-vs-polygon` `[CONFIRM]`** against the *installed* Marker version (`archon_marker_sidecar.py:90-92` carries the open CONFIRM note). Confirm the `/page/N/` id pattern, `html` vs `text` field, and **whether boxes come back as `bbox` or `polygon`** — a wrong mapping **silently corrupts every `spatial_hash`/`commit_hash`/`chunks_root`.** Must be validated on real Marker **before any corpus flip.**
- **Marker-vs-pdftotext page-count reconcile** — `doc_pages` come from pdftotext but Marker-path chunk pages come from Marker block ids; reconcile/warn on mismatch (affects citation page lineage). [Spec `[CONFIRM]` #1]

**P1 — strongly wanted (dissertation-relevant), but decoupled from the device headline:**
- **V-3 quote matcher** — pure-Rust `find_fragment_bboxes`/`locate_quote` (difflib sliding-window: normalize, ellipsis-split, >2-word fragments, window slide, line-group pad) + golden tests vs `render_citation_bbox.py:210`. **In scope, sequenced LAST (PR-E)** — it is the verbatim-provenance spec's core deliverable and matters for the user's citation rigor, but it is **independent of the device work** and its golden tests need *trustworthy real bboxes*, so it gates on the §5-P0 bbox CONFIRM landing first.
- **V-4 verify-quote / provenance CLI** — `verify_quote(db, chunk_id, quote) -> {chunk_integrity_ok, chain_verified, quote_found, match_confidence, verbatim_exact, location, page_num}` + `archon docs verify-quote/provenance`. Depends on V-3. **In scope, PR-E.**
- **Image-OCR chunk integrity gap** — chunks from `pdf_image_enrichment` (`pdf-image-ocr-*`) are persisted **after** `chunks_root` is built (verified: persist ~`ingest_pdf.rs:149` vs enrich ~`:178`), so they get no `doc_chunk_hashes` and are excluded from the text artifact's root. `I2` (`594ecb5e`) added CLIP image embeddings, **widening** this surface. Shipping "verbatim verification" while image-derived chunks are unverifiable is a trust gap for the dissertation use case. **Decision (§9 Q13):** fold into root now vs tracked follow-up. **In scope, PR-E.**
- **Corpus flip + re-ingest under `token_aware`** — terminal step; re-chunk + re-embed once parity + device adaptation validated.

**P2 — explicitly DEFERRED with rationale:**
- **V-5 render overlay** (`pdfium-render` rasterize + `imageproc` orange overlay, y-flip bottom-left↔top-left) + optional `doc_page_words`. **Deferred** — optional visual debug aid, not required for ingestion correctness; the `[CONFIRM]` #3 pdfium-origin question is unresolved.
- **Port L(a/c/d)** — header/footer fuzzy-dedup, multi-column reading order, caption→figure association, + the PyMuPDF `find_tables` non-Marker fallback. **Deferred** — fallback-only path (born-digital / non-Marker); the standalone Mac target uses Marker. [Spec `[CONFIRM]` #4]
- **Tesseract/poppler bbox providers** (V-2). **Deferred** — only the Marker provider is wired; needed only if non-Marker engines run on the target.
- **Multi-consumer VRAM budget arbiter.** **Deferred to the video round** — its only real contention case is whisper + frame-VLM concurrency; the `archon-accel` seam is built now, the arbitration is filled in then.

---

## 6. Phased PR breakdown (dependency-ordered)

Each PR is independently shippable; **boundary-changing** vs **additive** is called out because it drives re-embed cost. File-size guard: every new `.rs` must be **≤ 500 lines** (`scripts/check-file-sizes.sh` `THRESHOLD=500`) — split modules accordingly. `ci-gate.sh` baseline test-list diff means tests may only be **ADDED**, never renamed.

### PR-A — Parity reconcile + golden-corpus harness (S–M) — *additive, no boundary change*
- **Tasks:** (1) extend `scripts/chunk_parity_check.py` to ingest real Marker JSON dumps (not just the synthetic fixture) and emit the reference chunk table; (2) capture a **golden corpus** of Marker-JSON + Python-reference chunks for the named hard cases (multi-column, hyphenated, footnote, von Uexküll ~197 MB) — **gated on real Marker, so this task is finished in PR-D**, but stub the harness + fixtures now; (3) write a parity report covering the 3.2–3.6 *intentional* divergences (sha-scheme, `chunks_root`-only, anchored-vs-inline locators §3.5, structured-vs-flattened tables §3.6) so they are encoded as "expected," not "drift."
- **Anchors:** `scripts/chunk_parity_check.py`, `scripts/ingest/markdown_chunker.py:26-31,303-304`, `crates/archon-ingest-ext/src/{chunk,marker,layout}.rs`, `crates/archon-docs/src/block_chunking.rs:158`.
- **Tests/CI:** new harness as a non-blocking CI artifact on WSL (synthetic fixture only); real-corpus diff is a **manual** PR-D gate. fmt + clippy `-Dwarnings` (local `ci-gate.sh`).
- **Migration cost:** none.

### PR-B — `archon-accel`: device + **resource** detection + Marker-fit planner (M) — *additive*
- **Tasks:** (1) new crate `crates/archon-accel`; (2) generalize `crates/archon-world-model/src/backend/mod.rs` (`BackendKind`/`BackendStatus`/`select_backend_status` `:13/34/117`) **+ add `total_mb`/`free_mb`** to `BackendProbeReport` (`:74`); (3) implement `AcceleratorReport` (§4.2) with `nvidia-smi` (**free**, not torch/total), `sysctl hw.memsize`+`sysinfo` (Apple unified), `sysinfo` (RAM); (4) implement `plan_placement` (§4.3) with the **`free < footprint` → CPU/`Http` rule first**; (5) define the `ConsumerRequest` seam but register only Marker; (6) degrade-safe (`nvidia-smi`/`system_profiler` shell-outs can fail in locked-down envs → fall back to CPU report, never panic).
- **Anchors:** `crates/archon-world-model/src/backend/mod.rs`, `crates/archon-world-model/Cargo.toml:9-11`, root `Cargo.toml:97` (`sysinfo`).
- **Split (file-size):** `device_detect.rs` (probes) / `report.rs` (types) / `fit_policy.rs` (Stage-2 planner) — keep each ≤ 500 lines.
- **Tests/CI:** **host-agnostic unit tests runnable on CPU CI runners** — `detect()` with no GPU returns a valid CPU report; **planner with a synthetic "32 GB total / 139 MB free" report routes Marker to CPU/`Http` (the verified dev-box co-tenancy case)**; synthetic constrained-CUDA → Marker-GPU-reduced-caps + OOM→CPU; 24 GB unified → Marker-mps; 0 accelerators → all-CPU. (No GPU assertion in CI — those are `#[ignore]`/runtime-guarded.) Must pass nextest on ubuntu+macos.
- **Migration cost:** none (nothing consumes it yet).

### PR-C — Adaptive Marker placement wired into sidecar + actuation site (M–L) — *additive to code; device-dependent hash change on re-ingest*
- **Tasks:** (1) `plan_placement` consumed at ingest entry; (2) sidecar `--dtype` + surya batch env + `auto`-device fix + structured OOM error (`archon_marker_sidecar.py:28-42,83-92`); (3) **policy-parse** fields `marker_device="auto"`, `embedding_device`, `memory_budget_mb` in `crates/archon-policy/src/models.rs` + `loader/loader_docs.rs:199-200`; (4) **actuation** in `crates/archon-docs/src/marker_source.rs` (`from_policy:36`, `--device:62`) forwards resolved device+dtype+caps; (5) **per-doc CUDA/Metal-OOM (+Apple-pressure) → CPU retry** for Marker in `marker_source.rs`/`ingest_pdf.rs`; (6) seed `IndexOptions.batch_size` + `AdaptiveBatchController` initial/max from the budget (`crates/archon-docs/src/indexing_adaptive.rs:12,17-18`).
- **Tests/CI:** unit — planner→sidecar-arg mapping; OOM-error → CPU-retry path (mock sidecar). GPU-real assertions deferred to PR-D.
- **Migration cost:** **does not change chunker boundaries** — but **moving Marker between GPU/CPU changes neural bbox floats → `spatial_hash`/`commit_hash`/`chunks_root` change on any re-ingest** (cross-device nondeterminism, §8). No text re-embed *unless* boundaries also change; provenance roots must be re-derived for re-ingested docs.

### PR-C2 — *(optional, gated)* GPU embedding EP (S–M, risk-laden) — *additive*
- **Tasks:** add fastembed/ort `cuda`/`coreml` features behind `cfg`; select EP from `PlacementPlan`. **Blocked on §9 Q2 CONFIRM** (fastembed v4 EP API; may require `ort`-direct). **Performance-only** (PDF has no co-residency, so this does not relieve OOM); pursue only if a big-VRAM/Mac embedding-throughput win is wanted or the gte-Qwen2-1.5B parity model is adopted (Q1). Default stays CPU.
- **Migration cost:** if embedding moves to a different model (Q1), **vector dimension 768→1536 forces full index re-migration** — large.

### PR-D — Hardware validation on the real fleet (M) — *produces the first real device-specific hashes + the first real surya peak*
- **Tasks:** run the §7 matrix on the **available** hardware — the **RTX 5070 8 GB laptop** (the REAL constrained-CUDA host, per the editor's note — not a proxy), the **Mac 24 GB unified** deploy target, the **RTX 5090** (also usable **memory-capped** via `PYTORCH_CUDA_ALLOC_CONF`/`CUDA_VISIBLE_DEVICES` to reproduce a tighter envelope), and the **WRAITH 2×3090** pool (`Http` path). **Capture the real surya VRAM peak on the named hard cases** (closes the §4.3 UNVERIFIED footprint); **resolve `bbox-vs-polygon` `[CONFIRM]`** (`archon_marker_sidecar.py`) per installed Marker version; **capture the golden corpus** (finishes PR-A) and run the first real cross-platform parity diff; confirm zero CUDA/MPS OOM / no Apple swap-thrash under adaptation.
- **Task D0 (the cross-device bbox-jitter experiment — gates the §3 quantization decision).** Dump the SAME fixture PDF's Marker JSON on each device and run `scripts/bbox_jitter_diff.py a.json b.json … --labels …` (built in PR-C, WSL-validated). Run order: **(1)** same device twice → the within-device noise floor (if non-zero, set `torch.use_deterministic_algorithms` / `CUBLAS_WORKSPACE_CONFIG` and re-check; if it persists, geometry can never be a cross-machine identity key — keep `spatial_hash` verify-by-recompute-only); **(2)** all devices forced to **fp32** → pure kernel/library jitter (include 5090 vs 5070 — different chips can autotune different cuDNN kernels); **(3)** native precision (GPU fp16 / CPU fp32) → the real-world delta. **Decision gate:** the harness's per-bucket unify-rate picks the quantization granularity — `≥99.9%` at bucket *N* px ⇒ implement bbox rounding-before-hash (in `block_chunking.rs`/`provenance_chunks.rs`) so `spatial_hash` becomes device-independent and re-ingestion is portable; otherwise keep verify-by-recompute and base cross-machine identity on the text/source hash (already device-independent). NB: the user's transfer workflow (ingest once → sync the data) is unaffected either way; quantization only buys device-stable *re-ingestion*.
- **CI:** **manual** — GitHub runners are CPU-only (ubuntu+macos, no NVIDIA/Apple-GPU); GPU paths compile but cannot be exercised in CI. (§9 Q12: is a self-hosted GPU runner available?)
- **Migration cost:** re-ingest on real hardware → device-specific hashes (expected, not a regression — unless Task D0 adopts quantization, which makes them device-stable).

### PR-E — Residue tail (M–L) — *mixed*
- **Tasks:** (1) **image-OCR integrity** — fold `pdf-image-ocr-*` chunks into `chunks_root` (re-derives roots; *additive to integrity, boundary-neutral*); (2) **page-count reconcile** warn; (3) **V-3** quote matcher + golden tests vs `render_citation_bbox.py:210`; (4) **V-4** verify-quote/provenance CLI; (5) **corpus flip + re-ingest** under `token_aware` once PR-A–D green.
- **Tests/CI:** V-3 golden tests (need real bboxes from PR-D); V-4 integration on a re-ingested doc.
- **Migration cost:** corpus flip = full re-chunk + re-embed of the live corpus (one-time, per device).

**Sequencing:** PR-A ∥ PR-B (independent) → PR-C → PR-C2 *(optional)* → **PR-D (hardware gate)** → PR-E. PR-D is the choke point: real-Marker parity, the `bbox-vs-polygon` confirm, the real surya-peak measurement, and OOM-avoidance **all** require physical NVIDIA/Apple hardware and cannot be closed on WSL or in CI.

---

## 7. Validation matrix

Common to all hosts (no GPU needed):
- `LIBCLANG_PATH=/usr/lib/llvm-18/lib bash -lc 'cargo build -p archon-docs -p archon-ingest-ext -p archon-policy -p archon-accel'` → exit 0 (libclang only needed for the optional whisper-rs/`archon-video`, not ingestion).
- `bash scripts/ci-gate.sh` (file-sizes ≤500, fmt, clippy `-Dwarnings`, test `--test-threads=2`, baseline test-list add-only).
- `python3 scripts/archon_marker_sidecar.py --selftest` → torch-free fixture (contract smoke).
- `python3 scripts/chunk_parity_check.py` → reference chunks; diff vs Rust `chunk_blocks` golden.

| Host | DETECT | FIT / PLACEMENT | PARITY | OOM/PRESSURE-AVOIDANCE |
|---|---|---|---|---|
| **WSL dev box (THIS machine): RTX 5090 32 GB, ~139 MB free** | `archon-accel::detect()` returns **CUDA, total 32607 / free ~139** (NOT a CPU report) | **`free < Marker_footprint` ⇒ Marker→CPU or `Http`→WRAITH, never GPU**; embed CPU | synthetic-fixture parity diff (boundary logic) | **assert the co-tenancy rule fires: big total + tiny free routes away from GPU; no panic** |
| **RTX 5090 32 GB, uncontended** (or memory-**capped** to simulate constrained-CUDA) | detect returns CUDA, large free (or the capped budget) | Marker on cuda fp16, embed CPU; surya caps sized to free | real CUDA parity diff on hard-case PDFs | **capture real surya peak**; force a low cap → confirm per-doc CPU fallback fires (controller alone will **not** catch Marker GPU OOM) |
| **MacBook Air (Apple unified — the deploy target)** | detect returns **mps + N GB unified**; budget ≈ N − ~6 GiB OS | Marker on mps fp16, caps sized to N; embed CPU (or CoreML EP if PR-C2) | first cross-platform parity diff (`CHUNKER_REF_DIR` → god-agent ref) on an identical real PDF | **soft-pressure, not catchable OOM** → conservative budget, **back off if `available_memory` drops**, no swap thrash; **resolve `bbox-vs-polygon` for the installed Marker** |
| **WRAITH 2×RTX 3090 24 GB pool** | detect (per node) returns CUDA 24 GB | `Http` path (Python's existing pool mechanism) | remote-pool parity (Q8) | per-node free check; round-robin as today |

CI gates a device/ingest PR must pass (`.github/workflows/ci.yml`): fmt (blocking), clippy (advisory in CI / `-Dwarnings` locally), build+test nextest on ubuntu+macos, arch-lint + check-file-sizes (500-line), preserve-invariants, build-release-smoke. Local `--test-threads=2` is mandatory on the WSL2 box.

---

## 8. Risks & blast radius

- **Big card, near-zero free (VERIFIED on this box).** Free VRAM is not a function of card size — the dev box is 32607 MiB total but ~139 MiB free under co-tenancy. A `total`-based "big card → GPU" rule **OOMs immediately.** Mitigation: the planner's **first** rule is `free < footprint → CPU/Http`; it must be unit-tested with exactly this report. This is also the strongest single justification for the adaptive layer (independent of the deferred multi-consumer case).
- **Unverified Marker footprint → under-provisioning on hard docs.** The ~5 GiB figure is a reader estimate, not a measurement, and surya peak scales with page complexity. "Marker-on-GPU fits at N GB" is a **hope, not a guarantee** until PR-D measures it. The **per-doc OOM→CPU fallback is the load-bearing correctness mechanism**; do not ship the constrained rows without it.
- **chunk_id churn / orphaned vectors / re-embed.** Chunk ids are positional; any boundary change churns the id set and orphans vectors + embedding-cache entries (no GC for stale vectors). **Note:** `token_aware` is *already* the Rust default (`models.rs:233`), so the page_anchor→token_aware churn is already absorbed in the port; the remaining live re-embed cost is the **PR-E corpus flip** (one-time, per device).
- **Cross-device hash nondeterminism (BY DESIGN).** Marker bbox floats come from a neural layout model whose kernels differ across cuda/mps/cpu, so `spatial_hash`/`commit_hash`/`chunks_root` are reproducible **only via verify-by-recompute, not by re-extracting on another device.** ⇒ The placement policy **must be a re-ingest-time decision** and must **not** be expected to reproduce prior hashes. (PR-C/PR-D consequence.)
- **Apple soft-pressure (not clean OOM) — the actual deploy risk.** Unified memory has no hard split; aggressive co-residency triggers OS pressure/swap rather than a catchable OOM. Since the MacBook Air is the real constrained target, this — not CUDA OOM — is the primary failure mode to defend: conservative budget + back-off on `available_memory` drop.
- **Wrong Marker field-mapping silently corrupts integrity.** A `polygon`-vs-`bbox` mismatch or wrong block-id/html field against the installed Marker version corrupts **every** spatial hash and the root with no error — **must** be validated on real Marker before any corpus flip (PR-D, blocking).
- **Image-OCR chunks outside the integrity root** (`pdf-image-ocr-*`, persist ~`ingest_pdf.rs:149` vs enrich ~`:178`), now widened by I2 CLIP embeddings — shipping "verbatim verification" while image-derived chunks are unverifiable is a correctness/trust gap (PR-E).
- **fastembed/ort EP risk (PR-C2 only).** fastembed v4 may not expose EP selection in `InitOptions`; GPU embedding could require `ort`-direct + a dep bump. The core round is designed to **NOT** depend on GPU embedding (it is performance-only, since PDF has no co-residency).
- **CI cannot exercise GPU.** ubuntu+macos GitHub runners are CPU-only; cuda/mps assertions must be `#[ignore]`/runtime-guarded or nextest fails. Real validation is manual on the fleet. **File-size 500-line gate** will trip a monolithic device module → split (PR-B). `ci-gate.sh` baseline diff: **add tests, never rename.**
- **Scope creep into video/corpus-index.** Building device logic PDF-only without the `archon-accel` seam would bake in rework when video lands (its device handling is *more* stubbed); folding full whisper wiring in now balloons scope. The §2 "build the consumer seam now, fill the arbiter when video lands" cut is the hedge.

---

## 9. Open questions / decisions needed from the user

**Hardware target (must resolve before the constrained-fit work is real):**
- **Q15 (NEW).** **Does an 8 GB constrained target actually exist, and what is it?** The fleet I can see is RTX 5090 32 GB (dev) + WRAITH 2×3090 24 GB — **no 8 GB NVIDIA card.** The port roadmap names a **MacBook Air** deploy target (Apple unified). Confirm: (a) the MacBook Air's RAM (8 / 16 / 24 GB — this sets the unified budget); and (b) whether any CUDA-constrained box exists, or whether the constrained-CUDA path should be validated by **memory-capping the 5090** as a proxy. If the only real constrained host is Apple unified, the constrained decision rows re-center on **soft-pressure** behavior, not catchable CUDA OOM.

**Embedding model & GPU path (drives the whole memory budget):**
- **Q1.** Keep Archon's **fastembed BGE-base (768-dim, CPU, cheap)** or port god-agent's **gte-Qwen2-1.5B (1536-dim, GPU, ~3–4 GiB)** for true parity? The latter forces a **768→1536 index re-migration**. *(Recommendation: keep BGE-base for this round; revisit at the corpus-index migration.)*
- **Q2.** Is GPU embedding wanted at all? On PDF it is **performance-only** (no co-residency to relieve). *(Recommendation: CPU-embed default — sidesteps the fastembed-EP risk; make GPU embedding opt-in PR-C2.)*
- **Q3.** *(Now largely moot on PDF.)* If a future co-resident case arises, which stays on GPU — Marker or embedding? *(Recommendation: Marker-GPU / embed-CPU — matches the status quo since embedding is already CPU-only and Marker is the only GPU consumer.)*

**Parity semantics (decides whether the two corpora are comparable at all):**
- **Q4.** Replicate Python's `clean_v1` cleaning so `clean_sha256` is semantically comparable, or keep Archon's `cleaning_version="none"`?
- **Q5.** Keep `chunks_root`/`commit_hash` Merkle as a **Rust-only** Archon capability, or back-port it into the Python source-of-truth for true parity?
- **Q6.** Marker tables: keep Python's **flatten-into-prose** or adopt Rust's **structured `TableGrid`**? *(Recommendation: Rust structured — Python flatten is a known quality loss.)*
- **Q7.** Locators: match Python's **unanchored inline** scan or keep Rust's **anchored running-head** strip+capture (§3.5)? Affects `total_locators`.
- **Q8.** Marker server policy for Rust: **single-box standalone** (sidecar/subprocess — current Rust target) only, or also mirror Python's **WRAITH-first all-reachable pool**? (Is remote-pool parity in scope?)

**Architecture & ops:**
- **Q9.** Placement decision in **Rust `archon-accel`** (probe before spawn, CI-testable) vs the **Python sidecar** (self-adapting, only runs when Marker runs)? *(Recommendation: Rust-side.)*
- **Q10.** New shared **`archon-accel`** crate (recommended) vs extend `archon-policy` + reuse `archon-world-model::backend` in place?
- **Q11.** Video: confirm **sequence-after-PDF + build-the-consumer-seam-now (arbiter later).** Is **faster-whisper** the intended real ASR backend (determines in-process vs subprocess device handling)?
- **Q12.** Is a **self-hosted GPU CI runner** (NVIDIA or Apple-silicon) available, or is adaptive-layer validation **manual** on the physical fleet?
- **Q13.** Fold **image-OCR chunks into `chunks_root` now** (close the integrity gap) or track as a follow-up?
- **Q14.** Confirm the **canonical parity fixture set** (multi-column, hyphenated, footnote, von Uexküll ~197 MB are named — are these the four, and where do the source PDFs live?).

---

## Changes from draft (post-critique)

1. **Centerpiece right-sized (critique #1, major).** Removed the "shared cross-component VRAM budget" framing for the PDF round — verified there is **no intra-Archon co-residency** to arbitrate (CPU-only embedder + sequential Marker subprocess; `embed_fastembed.rs` sets no EP, `ingest_pdf.rs` embeds after extraction). The adaptive layer stays the centerpiece but its in-scope job is now **single-consumer Marker placement**; the multi-consumer budget **arbiter** is demoted to a **dormant `archon-accel` seam** explicitly justified by (and deferred to) the video round. Re-justified the layer on three single-consumer pressures: host heterogeneity, **co-tenancy**, and per-doc variance.
2. **Removed the unconfirmed "RTX 5070 8 GB" target (critique #2, major).** Verified the fleet has no 8 GB NVIDIA card (5090 32 GB + WRAITH 2×3090 24 GB). Re-centered the constrained envelope on **Apple unified memory (the MacBook Air deploy target per the port roadmap)** with soft-pressure (not catchable OOM) behavior, plus a **memory-capped 5090** as the constrained-CUDA proxy. Added **§9 Q15** to confirm the real constrained hardware and the MacBook Air RAM. Updated §6 PR-D and the §7 matrix accordingly.
3. **Marker footprint marked UNVERIFIED (critique #3, major).** The ~5 GiB/worker figure is now flagged as an unmeasured reader estimate that can under-provision on the named hard cases; "fits on N GB" is no longer presented as settled; capturing the **real surya peak** is moved into PR-D as a gating measurement; the **per-doc OOM→CPU fallback** is elevated to *the* correctness guarantee. Corrected the von Uexküll size **~188 MB → 197,187,544 bytes (~197 MB)**, verified on disk.
4. **All anchors fully crate-qualified and the two wiring sites separated (critique #4, minor).** `block_chunking.rs` → `crates/archon-docs/src/`; **policy-parse** (`crates/archon-policy/src/loader/loader_docs.rs:199-200`, verified parse-only — declares/assigns `marker_device`, no subprocess spawn) is now distinguished from **device actuation** (`crates/archon-docs/src/marker_source.rs:36/62` + `ingest_pdf.rs`). Added a §0 crate-path-discipline note.
5. **Validation-matrix dev-box row corrected (critique #5, minor).** This box **detects CUDA, not CPU** — `nvidia-smi` returns `RTX 5090, 32607 total, ~139 free` (verified). Added the **load-bearing `free < footprint` → CPU/`Http` decision rule** (driven by *free*, not *total*) as the planner's first rule, a required PR-B unit test against the synthetic "32 GB total / 139 MB free" report, and a §8 risk entry; this co-tenancy case is now a primary justification for the adaptive layer.

---

## Decisions locked & execution status (2026-06-30)

User decisions on the §9 open questions:
- **Q1 → keep fastembed BGE-base (768-dim, CPU) this round.** FOLLOW-UP (tracked): re-evaluate porting god-agent's gte-Qwen2-1.5B (1536-dim) at the corpus/index migration — forces a 768→1536 index re-migration; decide there, not here.
- **Q4/Q5/Q6/Q7 → keep the Rust behavior, DOCUMENT the divergence (do not "fix" toward Python):** structured `TableGrid` (not Python flatten), `chunks_root`/`commit_hash` stays a Rust-only addition, `cleaning_version="none"` (no `clean_v1`), locators stay anchored running-head capture. PR-A produces the divergence register encoding all four as EXPECTED, not drift.
- **Video → recommended:** sequence after PDF; build the `archon-accel` consumer-registration seam now, fill the multi-consumer arbiter when video lands.

Hardware (from the user, supersedes Q15): constrained-CUDA target = **RTX 5070 8 GB laptop** (REAL, not a 5090-cap proxy); Apple target = **Mac 24 GB unified**. The §4.3 constrained-CUDA rows AND the Apple-unified rows are both live.

**Execution 2026-06-30 → 07-01 (committed on `dissertation-ports`; nothing pushed):**
- **PR-A — DONE.** `docs/ingestion/parity-divergences.md` (124 lines) registers all 6 divergences + 4 must-match constants, every anchor source-verified. Additive `--marker-json` mode added to `scripts/chunk_parity_check.py`; the no-arg invocation is byte-identical to baseline (sha256 match, exit 0). **Correction surfaced:** the Bekker-broadening (#6) gain is vs `layout_analyzer.py:54` `_BEKKER_RE=^\s*\d{2,3}[a-b]?\d{0,2}\s*$` (caps at 3 digits, misses `1147a`), NOT `markdown_chunker.py:303` (`\d{2,4}`, already reaches 4) — register documents both.
- **PR-B — DONE.** `crates/archon-accel` (detect.rs/report.rs/placement.rs + 13 tests + examples/probe.rs). Gates green: build · 13/13 tests · clippy `-D warnings` · fmt · file-size (max 379≤500). LIVE-proven on this box: detect saw RTX 5090 (153 MiB free / 32607 total), planner routed Marker→CPU via `free<footprint`. The `free`-not-`total` co-tenancy rule works on real hardware.
- **PR-C — DONE** (commits `bf7f9350` wiring + `00f77ae9` harness). `from_policy()` (`marker_source.rs`) now resolves the Marker device + surya caps from free VRAM via `archon-accel` (None/`"auto"` → planner, explicit `cuda|mps|cpu` forces); `MarkerSource::Subprocess` carries the env; `run_sidecar()` does the per-doc **GPU-OOM → CPU retry** (sidecar exits 42 on torch OOM); `PdfPolicy.marker_memory_budget_mb` override; sidecar `--device auto` fixed. **192 archon-docs lib tests green; touched code clippy-clean.** Cross-device **`scripts/bbox_jitter_diff.py`** harness added (PR-D Task D0). `ingest_pdf.rs` unchanged (from_policy is the chokepoint).
- **fmt — RESOLVED** (commit `ad41e9d7`). Investigation showed the dirty files were **un-fmt'd feature code** (lanham port #1 + ingestion port #2 committed without `cargo fmt`), NOT a version mismatch: local rustfmt 1.9.0 / rustc 1.96.0 == the stable line CI's `dtolnay/rust-toolchain@stable` installs, and the prior `style: cargo fmt` commits stay clean under it. Ran `cargo fmt --all` → **19 files normalized** (archon-docs 9, archon-ingest-ext 4, archon-lanham 3, src/command 3); `fmt --check` exit 0, bin builds, golden tests green. NB: CI fmt only gates **PRs to main**, not `dissertation-ports` pushes. CI clippy is advisory (no `-D warnings`).
- **PR-D — EXECUTED 2026-06-30/07-01 on real hardware** (guide `plans/archon-PR-D-mac-setup-guide.md`). archon-accel placement PROVEN on **Apple MPS** (Mac 24 GB: CPU under memory pressure, `mps` fp16 when freed) AND **RTX 5070 8 GB laptop** (CUDA); marker-pdf 1.10.2 verified on both. **bbox-vs-polygon RESOLVED** — 1.10.2 emits both, `bbox` is standard → the sidecar mapping is correct, no silent hash corruption. **Cross-platform chunk parity BYTE-IDENTICAL** (10/10 blocks, sole diff = the documented `page_end` correction) via new `chunk_dump.rs` (`83a922e1`). **Task D0 jitter DECISION: do NOT quantize `spatial_hash`** — mac_mps vs laptop_cuda max Δ=7.68 px (p50=0, no bucket ≥99.9%); KEEP verify-by-recompute; the TRANSFER workflow (ingest once → sync) is safe, only independent re-ingest on a different device diverges (neural bbox floats). **Footprint MEASURED** (`scripts/mem_probe.py`): RTX 5070 CUDA ~5956 MiB reserved, Apple MPS ~6089 MiB — both ~6 GiB (`marker_mb` 5120→6144, `c36edef5`+`27fa64cd`).
- **CALIBRATION CORRECTION `15609aea` — the upward-batch-tiers (`3b0e4904`) were DISPROVEN + REVERTED.** PR-D calibration on the 5090 showed surya **batch size is VRAM-INERT** (batch 1→256 identical peak — the OCR encoder ingests the whole document's line-crops in one pass; `RECOGNITION_BATCH_SIZE` only sizes the fixed decode KV-cache). Marker VRAM tracks **document size** but is **bounded/saturating**: 13pp→5956, 129pp→9424, 578pp→8470 MiB (578<129 → page *resolution*, not count, drives the top end). FIX: `SuryaTier{Gpu,Cpu,None}`; `marker_footprint_mb(pages)=min(6000+30·pages,10240)`; `page_count` threaded from `ingest_pdf`. Placement now = free VRAM vs **page-scaled** footprint (small doc GPU on 8 GB; 300pp→CPU on 8 GB / GPU on 16 GB+); per-doc OOM→CPU backstop retained.
- **PAGE-RANGE CHUNKING `6ef908a8` — DONE (was "phase-2"); the ONLY lever to fit a big doc on a small card's GPU** (batch being inert). marker `--page-range START-END` (0-idx incl) keeps **absolute page ids**, so slices concatenate in page order with no re-offset. `marker_chunk_pages` (inverse of the footprint) + `MarkerChunk{page_range,attempts}` + `marker_ingest_plan()` = a whole-doc chunk if it fits, else contiguous GPU slices each sized to free VRAM, each with its own [GPU,CPU] OOM ladder; `marker_source::Subprocess.chunks`, `blocks_for` runs + concats. **Device-agnostic, verified on real hardware: CUDA** (5090, sidecar slices) **AND Apple MPS** (Mac: sidecar slices + full Rust-binary `blocks_for` — budget 6700 MiB/12pp split into 2 `mps` chunks → 38 blocks / 12 contiguous pages; `chunk_ingest.rs` example `82177ba1`). archon-accel 20 tests / archon-docs 192 / clippy+fmt clean.
- **PR-C2 / PR-E — pending.** PR-C2 = optional GPU embedding EP (perf-only). PR-E = residue (image-OCR integrity into `chunks_root`; V-3 `find_fragment_bboxes`/`locate_quote`; V-4 verify-quote CLI; corpus flip + re-ingest). Remaining PR-D residue: golden-corpus capture on the named hard cases (von Uexküll ~197 MB) — needs a real-Marker bulk run.