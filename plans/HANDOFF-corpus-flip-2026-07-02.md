# HANDOFF — Archon Corpus Flip + Post-Flip Spot-Check (2026-07-02)

**Goal:** Ingest the full dissertation corpus (166 PDFs) into the Rust **archon** system in a
clean session, then run a detailed spot-check that proves every ingestion improvement we built
this cycle is (a) present and (b) actually used on real corpus data.

**Who runs this:** a clean Claude session on **this WSL box** (it *is* the RTX 5090 — 32 GB,
~29 GB free — with ollama, tesseract, poppler, and the local Marker sidecar all present). No
remote machine or DB transfer is required for the primary flip.

---

## 0. TL;DR — the happy path

```bash
cd /home/dalton/projects/archon-cli
export PATH="$HOME/.cargo/bin:$PATH" LIBCLANG_PATH=/usr/lib/llvm-18/lib

# 0. build (verify-integrity command must be in the binary — see §1 prerequisite)
cargo build --bin archon

# 1. PRE-FLIGHT classification dry-run (no ingest, no GPU) — sanity-check union verdicts
python3 scripts/coverage_oracle.py /home/dalton/projects/claudeflow-testing/corpus > /tmp/preflip-oracle.txt
#   → review: how many born-digital / scanned / image-only? matches expectations?

# 2. FLIP: ingest the corpus tree (recursive; union default) — hours on the 5090
#    NB: image-description VLM is currently ON (policy.docs.vlm.enabled=true) → slower; see §1.5
./target/debug/archon docs ingest /home/dalton/projects/claudeflow-testing/corpus --yes 2>&1 | tee /tmp/flip-ingest.log

# 3. embeddings (semantic index)
./target/debug/archon docs index --all 2>&1 | tee /tmp/flip-index.log

# 4. SPOT-CHECK (see §5 — run scripts/spotcheck_corpus.sh, review the report)
bash scripts/spotcheck_corpus.sh | tee /tmp/flip-spotcheck.txt
```

Backup already exists (§3). If anything looks wrong, restore (§6) and stop.

---

## 1. Prerequisite / open decisions — RESOLVE BEFORE FLIPPING

Decisions #1/#2/#5 are **locked** (2026-07-02); #3/#4 are prep steps the clean session performs.

1. **`verify-integrity` command — COMMITTED** as `eeb2ccd2` on `dissertation-ports`
   (`docs verify-integrity` + `scripts/spotcheck_corpus.sh`), validated on King + Uexküll
   (both `✓ INTACT`). The clean session only needs to `cargo build --bin archon` to pick it up.
   Decisions #2 (whole-corpus set) and #5 (VLM ON) below are **locked** (2026-07-02).

2. **Which set to ingest?** `corpus/` has **166 PDFs**, but that includes
   `corpus/download/` (20 loose) and `corpus/download/dissertation-fresh-perplexity/` (Perplexity
   citation scratch downloads). The god-agent's *curated* set is defined by
   `scripts/ingest/manifest.jsonl` (dedup by `is_my_copy` / `is_notes`, authority tiers).
   - **Option A (simple):** ingest the whole `corpus/` tree → 166 docs, includes scratch PDFs.
   - **Option B (curated):** build a file list from `manifest.jsonl` and ingest only those.
   → **DECIDED (2026-07-02): Option A — ingest the whole `corpus/` tree (166 PDFs).** Scratch
     PDFs are harmless and searchable; prune later if needed.

3. **Metadata fidelity.** archon extracts title/author from the PDF itself (pdftotext/Marker).
   It does **not** read the god-agent manifest's curated `author_raw`/`title_raw`/`year`/
   `authority_tier`. If those matter downstream, that's a follow-up mapping task, not part of this flip.

4. **Make the scan policy explicit.** The active `.archon/policy.toml` has **neither**
   `scan_detector` nor `figure_region_vlm` → the flip relies on code defaults (union / C4-off).
   Add them explicitly so the flip is self-documenting and reproducible:
   ```toml
   [policy.docs.pdf]         # the existing table (already holds marker_sidecar/marker_python)
   scan_detector = "union"   # aspect OR coverage → scanned (this is ALSO the code default)
   figure_region_vlm = false # opt-in C4 figure-CROP VLM; leave OFF for the bulk flip
   ```

5. **Image-description VLM is currently ON — decide before flipping (cost/time).** This is a
   *separate* knob from C4's `figure_region_vlm`. The active policy has
   `[policy.docs.vlm] enabled = true, mode = "local", provider = "ollama",
   model = "qwen2.5vl:7b"`, so the flip will run local VLM on **every retained embedded image**
   across all 166 docs. Evidence it's live: the already-ingested King has **17 VLM descriptions**
   (Uexküll has 0 — its 281 embedded images were filtered out before VLM by the retained-images
   gate, so only *figure-like* images get described). Across 166 docs this is likely the single
   biggest chunk of flip wall-clock.
   - **Keep ON:** figure/plate contents become searchable (richer corpus), but the flip is much slower.
   - **Turn OFF for the bulk flip** (`enabled = false`), then selectively re-run VLM on
     figure-heavy docs with `docs reprocess <id>` afterward.
   → **DECIDED (2026-07-02): leave image-description VLM ON** for the bulk flip — accept the
     longer wall-clock for a richer, figure-searchable corpus. Ensure ollama is up and
     `qwen2.5vl:7b` is pulled before starting; expect VLM to dominate flip time.

---

## 2. Environment preconditions (verify, don't assume)

| Check | Command | Expect |
|---|---|---|
| GPU free VRAM | `nvidia-smi --query-gpu=name,memory.free --format=csv,noheader` | RTX 5090, ~29 GB free |
| Marker sidecar python | `ls /home/dalton/.venv-marker/bin/python3.11` | exists |
| Marker device | policy `marker_device` (commented → `auto`) | auto → CUDA on 5090 |
| VLM model (image-desc VLM is ON — §1.5) | `ollama list \| grep qwen2.5vl` | model present |
| poppler | `which pdftotext pdfimages pdftoppm` | all present |
| tesseract | `which tesseract` | present |

Note: a `marker_server` on `:8003` is **god-agent's**, unrelated to archon. Archon spawns the
**local subprocess sidecar** (`scripts/archon_marker_sidecar.py` + `.venv-marker`), one run per
`archon-accel` chunk. Do not confuse them.

---

## 3. Backup — ALREADY DONE (pre-flip snapshot)

Location: `/home/dalton/projects/archon-cli/.backups/preflip-20260702-082831/`

```
archon-data.db          10 MB   (cozo/rocksdb store: 2 docs — King + Uexküll)
doc-vector-store/               (embedding vectors)
archon-data.db.sha256           (integrity)
MANIFEST.txt                    (git HEAD 104cf6b8 + doc list)
```

**Verify the backup before flipping:**
```bash
cd /home/dalton/projects/archon-cli/.backups/preflip-20260702-082831
sha256sum -c archon-data.db.sha256   # → archon-data.db: OK
```

**Restore (rollback) — see §6.**

> The god-agent ChromaDB corpus is a **separate** store and is **not touched** by this flip.

---

## 4. The flip procedure (detailed)

### 4.1 Pre-flight classification dry-run (no ingest)
`scripts/coverage_oracle.py` (pypdfium2) classifies every PDF's scan-type **without** ingesting
or touching the GPU. Run it over the corpus and eyeball the distribution:
```bash
python3 scripts/coverage_oracle.py /home/dalton/projects/claudeflow-testing/corpus > /tmp/preflip-oracle.txt
```
Sanity check: born-digital scholarly PDFs should dominate; a handful of scanned/image-only. A
surprise (e.g. everything "scanned") means a policy or detector problem — stop and investigate.

### 4.2 Run the ingest
```bash
./target/debug/archon docs ingest /home/dalton/projects/claudeflow-testing/corpus --yes 2>&1 | tee /tmp/flip-ingest.log
```
- `--yes` skips the per-file confirm (there is no per-file banner on directory ingest anyway).
- Recursive (walkdir) → covers every subdir including the nested Perplexity folder.
- Duplicates (same content hash) are skipped automatically.
- Expect the tail summary: `Ingested: N sources`, plus PDF-image / OCR / VLM counters.
- **Watch for:** `Failed: k sources` + per-error lines. Note any failures for the spot-check.

### 4.3 Build the semantic index
```bash
./target/debug/archon docs index --all 2>&1 | tee /tmp/flip-index.log
./target/debug/archon docs index-status         # queue should drain to 0
```

### 4.4 (Optional) propagate to Mac / laptop
Neural bboxes + Marker layout are **device-dependent** (§8 of the port plan). To keep the offline
machines identical, **do not re-ingest there** — copy the ingested store instead:
```bash
# bundle the DB + vectors and move them; DO NOT independently re-ingest on Mac/laptop
tar -czf /tmp/archon-corpus-postflip.tgz -C /home/dalton/projects/archon-cli .archon/archon-data.db .archon/doc-vector-store
# → transfer + extract into the peer's .archon/
```

---

## 5. Post-flip DETAILED SPOT-CHECK (the requested verification)

Goal: prove each improvement is present **and used on real data**, across the three document
types (born-digital / scanned / image-only). Pick 2–3 representative docs of each type from the
oracle output; the script below auto-samples but review by hand too.

| # | Improvement | How to verify | PASS looks like |
|---|---|---|---|
| 1 | **Union scan classifier** (aspect OR coverage) | oracle dry-run vs. actual: born-digital docs get many chunks + OCR/VLM 0; scanned docs get image-OCR runs | classification matches doc reality; no born-digital doc wrongly marked scanned |
| 2 | **C3 image-only content + synthetic root** | `docs inspect <image-only-doc>` → non-empty Chunks + OCR Runs > 0; `docs verify-integrity --doc <id>` → INTACT | image-only doc has content **and** a valid chunks_root (the C3 gap is closed) |
| 3 | **C4 figure-region VLM** (opt-in) | availability only (OFF in bulk flip): `grep figure_region_vlm .archon/policy.toml`; optional 1-doc proof with flag on | flag documented + wired; not run in bulk |
| 4 | **Marker bboxes + coord_space** | `docs verify-quote "<known phrase from a born-digital doc>" --doc <id>` | EXACT match, real bbox `[x,y,x,y]`, `coord_space: marker` |
| 5 | **chunks_root integrity** (V-1) | `docs verify-integrity` (all docs) | every ingested doc `✓ INTACT`; `0 mismatch` |
| 6 | **V-3/V-4 quote verify** (fuzzy + fragment bbox) | `docs verify-quote "<slightly misquoted phrase>"` | FUZZY nn% with source span + page + bbox; absent quote → NOT FOUND |
| 7 | **Retrieval** | `docs search "<conceptual query>" --mode hybrid` | on-topic chunks from expected docs |
| 8 | **Provenance** | `docs inspect <id>` → Provenance Edges count > 0 | extract/OCR/chunk edges present |

### 5.1 Spot-check runner (write to `scripts/spotcheck_corpus.sh`)
```bash
#!/usr/bin/env bash
# Post-flip corpus spot-check. Run from archon-cli root after ingest + index.
set -uo pipefail
BIN=./target/debug/archon
echo "===== 1. DOC INVENTORY ====="
$BIN docs list | head -5; echo "..."; TOTAL=$($BIN docs list | grep -c '  doc-'); echo "total docs: $TOTAL"

echo; echo "===== 5. CHUNK-INTEGRITY (all docs) ====="
$BIN docs verify-integrity                      # every doc should be ✓ INTACT

echo; echo "===== 2/8. PER-DOC INSPECT (sample) ====="
for id in $($BIN docs list | grep -oE 'doc-[0-9a-f-]+' | head -6); do
  echo "--- $id ---"; $BIN docs inspect "$id" | grep -iE 'chunks|ocr runs|image|provenance|pages' | head -8
done

echo; echo "===== 4/6. QUOTE VERIFY (fill in real phrases per doc) ====="
# EXACT (born-digital → expect coord_space: marker + bbox):
$BIN docs verify-quote "REPLACE_WITH_VERBATIM_PHRASE" --json | python3 -m json.tool | grep -E 'match_kind|coord_space|bbox|page_' | head
# ABSENT (expect NOT FOUND):
$BIN docs verify-quote "quantum chromodynamics lagrangian gauge invariance"

echo; echo "===== 7. RETRIEVAL ====="
$BIN docs search "phenomenological evaluation of virtual learning" --mode hybrid | head -12
```
> The quote-verify lines need **real verbatim phrases** pulled from the sampled docs (use
> `docs inspect <id>` chunk previews to grab one). Leave the ABSENT probe as-is.

### 5.2 What each result proves
- `verify-integrity` all-INTACT ⇒ V-1 chunks_root sealing works on the whole corpus (tamper-evident).
- An image-only doc with chunks + INTACT ⇒ C3 fix live (no zero-content regression under union).
- `verify-quote` returning `coord_space: marker` + a bbox ⇒ Marker spatial layout captured & queryable.
- A FUZZY hit on a misquote ⇒ V-3 Sellers matcher + offset-map normalization working.
- Hybrid search hits ⇒ embeddings + retrieval intact.

---

## 6. Rollback

```bash
cd /home/dalton/projects/archon-cli
B=.backups/preflip-20260702-082831
cp "$B/archon-data.db" .archon/archon-data.db
rm -rf .archon/doc-vector-store && cp -r "$B/doc-vector-store" .archon/doc-vector-store
sha256sum -c "$B/archon-data.db.sha256"     # sanity
./target/debug/archon docs list             # → back to 2 docs (King + Uexküll)
```
(Remove the stale `.archon/archon-data.db.archon-cozo-write.lock` if a crashed run left it.)

---

## 7. What changed since the backed-up DB (the improvements under test)

Backed-up DB was built at git `104cf6b8`. Since then (this cycle):
- **Adoption #2** — page-dimension **coverage** classifier + **union** detector (aspect OR
  coverage), shipped as the default scan detector.
- **C3** — image-only docs now get OCR content **and** a synthetic `chunks_root` (closed a
  zero-content gap that union exposed).
- **C4** — opt-in figure-region VLM (crop → qwen2.5vl description); manually crop-verified on 5090.
- **V-1** — per-chunk commit hashes → `chunks_root` provenance (tamper-evidence). **New this
  session:** `docs verify-integrity` CLI to check it (§1.1).
- **V-3/V-4** — fuzzy quote matcher (Sellers) + `docs verify-quote` (source/page/bbox/coord_space).
- Reprocess-test flake fixed (serial group); Mac (MPS) + laptop (RTX 5070 8 GB) builds prove
  device-agnosticism.

---

## 8. Files/paths quick-ref
- archon repo: `/home/dalton/projects/archon-cli` (branch `dissertation-ports`)
- corpus: `/home/dalton/projects/claudeflow-testing/corpus` (166 PDFs, recursive)
- backup: `/home/dalton/projects/archon-cli/.backups/preflip-20260702-082831/`
- policy: `/home/dalton/projects/archon-cli/.archon/policy.toml`
- oracle: `scripts/coverage_oracle.py` · sidecar: `scripts/archon_marker_sidecar.py`
- god-agent manifest (curated set): `/home/dalton/projects/claudeflow-testing/scripts/ingest/manifest.jsonl`
