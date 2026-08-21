# Archon Port — Overnight Autonomous Session Handoff (2026-06-24 → 25)

Executed autonomously while you slept. **Build never left a broken state**; all changes are
on branch `dissertation-ports` in `~/projects/archon-cli` (WSL) and rsynced to the Mac.

## 0. Backup (done first, per your standing rule)
`/home/dalton/projects/.backups/20260624-231544-archon-port/`
- `archon-cli-src.tgz` (full source, ex-target/.git) · `lanham-rs.tgz` · `archon-cli-HEAD.txt` (revert point) · `archon-cli-status.txt` (clean baseline).
Restore archon-cli: `git -C ~/projects/archon-cli reset --hard $(cat .../archon-cli-HEAD.txt)` or untar.

## 1. ✅ Deleted `mac-trained-demo.md`
Removed from the Mac's `~/.archon/output-styles/` (+ the stray sample). Only `dalton-philosophical.md` remains.

## 2. ✅ `archon style train` — now a true first-class subcommand
- New workspace crate **`crates/archon-lanham`** = the golden-tested Lanham analyzer + renderer +
  `train_to_output_style()` (6 crate tests green).
- Wired: `StyleAction::Train` (`cli_args/data_actions.rs`) → `Commands::Style` (`cli_args/commands.rs`) →
  re-export (`cli_args.rs`) → dispatch (`main_dispatch.rs`, data group) → handler `command/style.rs`.
- **Built + installed on the Mac** (`cargo install --path . --force`, replaced `~/.cargo/bin/archon`).
  Verified: `archon style train --help` works; trained a sample into `~/.archon/output-styles/` then cleaned it.
- **Usage:** `archon style train <files...> [--name X] [--genre academic] [--out PATH] [--stdout]`
  (no files → stdin; no `--out` → `~/.archon/output-styles/<name>.md`). Then `output_style = "X"` in config.

## 3. ✅ Port #4 (Video) — finalized config recommendation
`plans/archon-video-policy.toml` — schema-verified `[policy.video]`, the one substantive change is
`[policy.video.frames] mode = "interval"` (drops moment-importance tiering per your 2026-06-24 call).
Local whisper-rs ASR (Metal), interval frames + OCR/VLM. **Network/cloud toggles left OFF** (your
privacy/cost/connectivity decision — documented how to flip). Apply by pasting into your `.archon/config.toml`.
Adopt Archon's `archon-video` crate; the RODA/DIA method rides on the corpus port (#3), not here.

## 4. ◐ Port #2 (Ingestion) — two pure-Rust cornerstones built + tested (NOT yet wired)
New workspace crate **`crates/archon-ingest-ext`** (15 tests green, additive — NOT referenced by the
`archon` binary, so it cannot break the live build):
- `chunk.rs` — **token-aware, bbox-carrying chunker** (Port C "spine"). Faithful to `chunk_marker_json`:
  TARGET_MIN/MAX/HARD 800/1200/1400 tok (chars/4), max-flush + SectionHeader-boundary split, per-page
  super-box, merge-undersized-adjacent. `ChunkOut` maps 1:1 to Archon `PageChunk`; `bboxes → doc_chunk_spatial`.
- `table.rs` — **`is_real_table` gate** (verbatim `_is_real_table:162`: prose/phantom-col/TOC/2-col-prose
  rejection) + CSV/Markdown/JSON serialization + `[TABLE] …` chunk builder. Zero deps.

### What remains for #2 (needs you — do NOT do blind):
1. **Wire-in:** call `chunk_blocks` in `run_pdf_ingest_pipeline` *instead of* `chunk_with_page_anchors`
   (archon-docs); map `ChunkOut → ChunkArtifact` keeping the `chunk-{document_id}-{i}` id format.
2. **Marker sidecar** (Python) → the normalized `Block` stream (the bbox source). Environment-dependent
   setup; on Apple Silicon `TORCH_DEVICE=mps`. This is the substrate feeding chunker + tables + provenance.
3. **Cozo migration:** additive satellite relations `doc_chunk_spatial` + `doc_chunk_hashes` + `doc_locators`
   (verbatim spec `plans/archon-verbatim-provenance-spec.md`) — schema change on real data → review first.
4. Locators (Bekker), caption→figure association, dual raw/clean sha256 (specced, not yet ported).
   **Golden gate (S-1..S-4):** reproduce the Python reference on fixtures before trusting the wire-in.

## 5. ☐ Port #3 (Corpus/index) — NOT started tonight (deliberately)
Spec `plans/archon-corpus-index-migration-spec.md` is build-ready, but the work is **migrate-and-preserve
of real scholarly data**: new CozoDB relations + a Rust importer with **~19 heterogeneous adapters** (the
spec's stated "long pole") + a Datalog retriever + a **line-for-line parity diff vs the live TS retriever**.
Getting adapters subtly wrong on your corpus is exactly the hard-to-undo error I won't risk unsupervised.
Teed up for a supervised session: start with the additive `:create` relations + 2–3 representative adapters
(burke-monograph `gm-NN-DEEP.json`, calleja-monograph, structured-analysis) tested against a **scratch** CozoDB.

## Verify everything (WSL, fast)
```
cd ~/projects/archon-cli
cargo test -p archon-lanham        # 6 green — analyzer + renderer + train
cargo test -p archon-ingest-ext    # 15 green — chunker + table gate/serialize
```
Mac: `archon style train --help` (installed). Full archon rebuild on Mac: `cargo build --release --bin archon` (~4 min).

## State of the tree
- Changes are **uncommitted** on `dissertation-ports` (your rule: I commit only when asked). Review with
  `git -C ~/projects/archon-cli status` / `diff`, then commit when you're happy.
- New crates: `crates/archon-lanham`, `crates/archon-ingest-ext`. Edited: root `Cargo.toml`, `src/cli_args.rs`,
  `src/cli_args/commands.rs`, `src/cli_args/data_actions.rs`, `src/main_dispatch.rs`, `src/command/mod.rs`, `src/command/style.rs`.
