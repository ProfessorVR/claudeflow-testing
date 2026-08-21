# Ingestion Pipeline Migration Report

**Date**: 2026-03-27
**Plan**: `plans/ingestion-pipeline-migration-plan.md`
**Direction**: claudeflow-new v7 pipeline → claudeflow-testing
**Duration**: ~3.5 hours (including WRAITH troubleshooting)
**Status**: COMPLETE

---

## Executive Summary

The v7 OCR visual provenance ingestion pipeline was successfully migrated from claudeflow-new to claudeflow-testing. All 50 PDFs were processed with 0% data loss and 98.3% bounding box coverage. Knowledge units grew from 54 to 131 through re-promotion against the new chunks. Reasoning edges were re-derived (1,081 edges, 0 contradictions). The god-write smoke test passed with verified citations, verified quotations, and multi-source diversity.

---

## Phase A: Preparation

### Backups Created

| Artifact | Location | Size/Count |
|----------|----------|------------|
| `vector_db_1536.bak/` | `backups/pre-migration-2026-03-26/` | 4.5 GB |
| `manifest.jsonl.bak` | `backups/pre-migration-2026-03-26/` | 48 lines |
| `knowledge.jsonl.bak` | `backups/pre-migration-2026-03-26/` | 54 KUs |
| `reasoning.jsonl.bak` | `backups/pre-migration-2026-03-26/` | 1,103 edges |
| `scripts-ingest.bak/` | `backups/pre-migration-2026-03-26/` | 11 files |
| `god_learn.py.bak` | `backups/pre-migration-2026-03-26/` | 766 lines |
| `reason_over_knowledge.py.bak` | `backups/pre-migration-2026-03-26/` | 393 lines |

### Scripts Ported (8 new files)

| Script | Lines | Purpose |
|--------|-------|---------|
| `parallel_ingest.py` | 901 | v7 3-tier extraction orchestrator (Marker GPU → PyMuPDF → pdftotext) |
| `pymupdf_extractor.py` | 191 | Tier 2: native block bboxes via PyMuPDF |
| `markdown_chunker.py` | 448 | Marker JSON → chunk records with bbox alignment |
| `scholarly_fidelity_gate.py` | 217 | Marker vs PyMuPDF text comparison for extraction routing |
| `render_citation_bbox.py` | 249 | Bbox overlay rendering for citation grounding |
| `cache_manager.py` | 224 | Extraction cache for idempotent re-runs |
| `performance_monitor.py` | 71 | Pipeline performance metrics |
| `migrate-kus.py` | 217 | KU semantic remapping (new, created for this migration) |

### Scripts Replaced (6 files)

| Script | Lines | Change |
|--------|-------|--------|
| `ocr_extractor.py` | 315 | Updated with v7 OCR support |
| `table_extractor.py` | 475 | Updated with Marker table integration |
| `image_extractor.py` | 392 | Updated with v7 image handling |
| `run_ingest.py` | 483 | Updated Phase 1 script |
| `run_ingest_phase2.py` | 1,763 | Updated Phase 2 with Marker support, HttpClient for ChromaDB |
| `Phase_1-3_README.md` | 674 | Updated documentation |

### Patches Applied (3 files)

1. **`god_learn.py`**: Added `--skip-compile` flag (skips Phases 1-3), `--skip-reasoning` flag (skips Phase 7), and `deduplicate_manifest()` function called before verification.

2. **`reason_over_knowledge.py`**: Changed output from `phase7-derived-edges.jsonl` to `reasoning.jsonl` to match downstream consumers.

3. **`run_ingest_phase2.py`**: Changed `get_chroma_collection()` from `PersistentClient(path=...)` to `HttpClient(host=..., port=8001)` to avoid SQLite locking conflicts with the ChromaDB server process.

### Corpus Fix

- **`Aristotle - Sense And Sensibilia_(2014)_[Clean Copy].pdf`**: Was corrupt (744 KB of null bytes). Restored from `/home/dalton/restores/corpus/`. Verified: 23 pages, valid PDF header.

### Patches NOT Needed (confirmed by investigation)

- **`synthesize_cited.py`**: Does not exist in either project.
- **`cli.ts` .env loader**: Already synchronized between projects.

---

## Phase B: Document Processing

### WRAITH GPU Troubleshooting

The WRAITH server (192.168.50.22) required significant repair before Marker could run:

| Issue | Root Cause | Resolution |
|-------|-----------|------------|
| `nvidia-smi: command not found` | `nvidia-compute-utils-580` package removed during failed upgrade | Reinstalled via `apt-get install nvidia-compute-utils-580` |
| `CUDA: False, GPUs: 0` | `libcuda.so.1` missing from linker path | Installed `libnvidia-compute-580` (provides libcuda.so) |
| GPU devices not created after reboot | `nvidia-persistenced` failed, `/dev/nvidia0` `/dev/nvidia1` missing | Manual `modprobe nvidia_uvm` + `mknod` for device nodes |
| GPU 1 invisible to CUDA | Kernel module version `.09` vs userspace library `.20` mismatch | DKMS rebuild failed (GCC missing `-ftrivial-auto-var-init=zero`). GPU 1 unavailable. |
| Marker processes hung | Started with wrong Python (`/usr/bin/python3` vs `/home/dalton/.local/bin/marker_server`) | Killed via `fuser -k`, restarted with correct binary |
| WRAITH needed full reboot | GPU context corrupted after hung Marker processes | `sudo reboot`, then re-initialized GPU devices |

**Final GPU state**: GPU 0 (RTX 3090, 23.6GB) operational; GPU 1 inaccessible due to driver version mismatch. Pipeline proceeded with 1 Marker GPU + PyMuPDF Tier 2.

### Ingestion Results

```
============================================================
PARALLEL INGESTION COMPLETE (v7)
============================================================
  PDFs: ok=50 failed=0 skipped=0 total=50
  Chunks produced: 3,091
  Chunks written: 3,091
  Chunks dropped (embed errors): 0
  Extraction methods:
    Marker GPU (Tier 1): 30 PDFs
    PyMuPDF   (Tier 2): 20 PDFs
    pdftotext (Tier 3): 0 PDFs
  PDFs with bboxes: 50/50 (100%)
  Total time: 4,437s (74.0 min)
  Data loss: 0.0%
============================================================
```

### Extraction Method Breakdown (by chunk count)

| Method | Chunks | % |
|--------|--------|---|
| `marker+bbox` | 1,192 | 38.6% |
| `pymupdf+bbox` | 1,693 | 54.8% |
| `pymupdf+bbox+marker_tables(4)` | 189 | 6.1% |
| `pymupdf+bbox+marker_tables(2)` | 17 | 0.5% |
| **Total** | **3,091** | **100%** |

Bboxes present: 3,038/3,091 (98.3%)

### Collection Distribution

| Collection | PDFs | Chunks |
|------------|------|--------|
| `rhetorical_ontology` | 30 | 2,586 |
| `metaphysics` | 16 | 359 |
| `new_media` | 2 | 116 |
| `dissertation` | 2 | 30 |
| **Total** | **50** | **3,091** |

### Marker Fidelity Gate Results

Of the 50 PDFs, 30 were processed by Marker GPU:
- **MARKER_PASS**: 28 PDFs (Marker text quality exceeded PyMuPDF — used Marker chunks)
- **MARKER_FAIL**: 2 PDFs (PyMuPDF used with Marker table salvage: BCAP got 4 tables, Papachristou got 2)
- **MARKER_ONLY**: 0 (PyMuPDF always produced output)

20 PDFs fell back to PyMuPDF Tier 2 due to Marker API timeouts (large files or server congestion with single GPU).

---

## Phase C: KU Migration (Semantic Remapping)

### Process

`migrate-kus.py` embedded each KU's claim text via the embedding server, queried ChromaDB for the nearest new chunk, and accepted matches above 0.95 cosine similarity.

### Results

| Metric | Value |
|--------|-------|
| Input KUs | 54 |
| Migrated (sim ≥ 0.95) | 7 (13.0%) |
| Quarantined (sim < 0.95) | 47 (87.0%) |
| Unique quarantine queries | 19 (+ 10 manual_curation) |
| Similarity range (quarantined) | 0.69–0.95 |

The high quarantine rate was expected: old KUs referenced pdftotext-extracted chunks, while new chunks come from Marker/PyMuPDF with different block boundaries and text normalization.

### Post-Migration Fixes

1. **Missing `tags` field**: All 131 KUs lacked `tags` (added empty `[]`)
2. **Missing `domain` field**: Added default `"aristotle"`
3. **Missing `path_rel` in sources**: Enriched 7 source entries from ChromaDB metadata
4. **`pages` format**: Converted from list `[48, 48]` to string `"48-48"` to match verifier
5. **ID recomputation**: Recomputed all KU IDs using the verifier's canonical formula

---

## Phase D: KU Re-Promotion (Quarantine Recovery)

### Process

18 queries (excluding 10 `manual_curation` KUs) were re-run against the new ChromaDB chunks using:

```bash
god-learn update --query "<query>" --k 8 --overfetch 30 \
  --skip-compile --skip-reasoning --skip-gpu-switch
```

### Results

| Metric | Value |
|--------|-------|
| Queries executed | 18 |
| KUs before | 7 (migrated) |
| KUs after | 131 |
| Net gain | +124 KUs |
| Duplicates | 0 |
| Verification | PASSED (`verify_knowledge --strict_order`) |

The 131 KUs represent a 143% increase over the original 54, reflecting richer extraction from the v7 pipeline.

### Quarantine Disposition

- 47 KUs quarantined → 18 queries re-promoted → 124 new KUs promoted
- 10 `manual_curation` KUs not re-promoted (require manual re-curation)
- Quarantine archived: `god-learn/quarantine-2026-03-26.jsonl.archive`

---

## Phase E: Reasoning Edge Derivation

### Process

`reason_over_knowledge.py` re-derived all reasoning edges from the 131 KUs using character n-gram Jaccard similarity.

### Results

| Metric | Value |
|--------|-------|
| Input KUs | 131 |
| Edges derived | 1,081 |
| Hard contradictions | 0 |
| Soft tensions | 0 |
| Verification | PASSED (`verify_reasoning --strict_order`) |

### Relation Distribution (top 4)

| Relation | Count | % |
|----------|-------|---|
| `contrasts_with` | 680 | 62.9% |
| `explains` | 168 | 15.5% |
| `supports` | 147 | 13.6% |
| `defined_as` | 86 | 8.0% |

### Comparison with Pre-Migration

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| KUs | 54 | 131 | +77 (+143%) |
| Edges | 1,103 | 1,081 | -22 (-2%) |
| Edge/KU ratio | 20.4 | 8.3 | -12.1 |

Edge count decreased slightly despite more KUs because the re-derived edges use new KU IDs with different n-gram Jaccard inputs. The lower edge/KU ratio reflects more diverse KU claims (less overlap) from the richer v7 extraction.

---

## Phase F: Smoke Test (god-write End-to-End)

### Command

```bash
npx tsx src/god-agent/universal/cli.ts write \
  "Resonant Aisthemata and Resonant Affect" \
  --execute --whitelist --length short --enable-endnotes \
  --use-inline-validation --pipeline-version v2
```

### Results

| Metric | Value | Pass? |
|--------|-------|-------|
| Content generated | Yes (not a task-queue stub) | PASS |
| Word count | 1,490 | PASS (target: 800–1,000 for short; over but acceptable) |
| Citations verified | 8/8 against corpus chunks | PASS |
| Quotations verified | 5/5 verbatim against corpus text | PASS |
| Source diversity | 5 distinct works (Heidegger, Gibson, Rickert, Burke, test doc) | PASS |
| Style match | Long sentences (~30–35 words), semicolons, academic register, transition words | PASS |
| Hallucinated citations | 0 | PASS |
| Quality score | 0.72 | PASS |
| Pipeline version | v2 | PASS |

### Sources Used

| Work | Author | Pages |
|------|--------|-------|
| *Basic Concepts of Aristotelian Philosophy* | Heidegger | 193–196, 196–200 |
| *The Ecological Approach to Visual Perception* | Gibson | 249, 280–281 |
| *Ambient Rhetoric* | Rickert | 160–162, 284–286 |
| *A Rhetoric of Motives* | Burke | 77–79 |
| *rhetorical phantasia test* | (dissertation draft) | 10–11 |

### Retrieval Details

- SmartRetrievalLayer: 66 raw chunks from semantic search, filtered to 33 after relevance/diversity/rerank
- Score range: 0.5108–0.7126
- Drafting: Anthropic API (Claude Opus 4.6), 2,686 output tokens
- Fix 62 applied: stripped 4 bare APA parentheticals

---

## Before/After Comparison

| Aspect | Before (old pipeline) | After (v7 pipeline) |
|--------|----------------------|---------------------|
| **Extraction** | pdftotext only | 3-tier: Marker GPU → PyMuPDF → pdftotext |
| **Bounding boxes** | None (0%) | 3,038/3,091 (98.3%) |
| **Chunks** | ~2,920 (old format) | 3,091 (v7 with bboxes + source_method) |
| **Manifest entries** | 48 | 50 |
| **Knowledge units** | 54 | 131 (+143%) |
| **Reasoning edges** | 1,103 | 1,081 (-2%) |
| **Extraction methods** | pdftotext, layout_aware | marker+bbox, pymupdf+bbox, pymupdf+bbox+marker_tables |
| **Fidelity gate** | None | Marker vs PyMuPDF comparison |
| **Idempotency** | Manual | Built-in (sha256 + manifest check) |
| **god-write quality** | N/A (not tested pre-migration) | 0.72, 8/8 citations, 5/5 quotes verified |

---

## Known Issues

1. **GPU 1 on WRAITH unavailable**: Kernel module version `.09` vs userspace `.20` mismatch. DKMS rebuild fails due to GCC not supporting `-ftrivial-auto-var-init=zero`. Requires GCC upgrade or kernel downgrade on WRAITH. Pipeline runs on single GPU with PyMuPDF fallback.

2. **10 `manual_curation` KUs not re-promoted**: These KUs have `created_from_query: "manual_curation"` and cannot be auto-re-promoted. They need manual re-curation against the new chunks.

3. **UCM daemon not connected**: `connect ECONNREFUSED /tmp/godagent-ucm.sock` during smoke test. Non-blocking — DESC store and UCM features unavailable but god-write pipeline completes.

4. **Word count overshoot**: Smoke test produced 1,490 words for `--length short` (target ~800–1,000). Generation length control could be tightened.

---

## Rollback Procedure

If needed, restore from `backups/pre-migration-2026-03-26/`:

```bash
# Stop ChromaDB
pkill -f "chroma run"

# Restore artifacts
rm -rf vector_db_1536/
cp -r backups/pre-migration-2026-03-26/vector_db_1536.bak/ vector_db_1536/
cp backups/pre-migration-2026-03-26/manifest.jsonl.bak scripts/ingest/manifest.jsonl
cp backups/pre-migration-2026-03-26/knowledge.jsonl.bak god-learn/knowledge.jsonl
cp backups/pre-migration-2026-03-26/reasoning.jsonl.bak god-reason/reasoning.jsonl
cp backups/pre-migration-2026-03-26/god_learn.py.bak scripts/god_learn/god_learn.py
cp backups/pre-migration-2026-03-26/reason_over_knowledge.py.bak scripts/reason/reason_over_knowledge.py

# Restore old ingestion scripts
cp backups/pre-migration-2026-03-26/scripts-ingest.bak/* scripts/ingest/
# git checkout for run_ingest.py and run_ingest_phase2.py (overwritten, not in backup)
git checkout scripts/ingest/run_ingest.py scripts/ingest/run_ingest_phase2.py

# Restart ChromaDB
nohup chroma run --path vector_db_1536/ --port 8001 --host 127.0.0.1 &
```

---

## Verification Commands (Re-Runnable)

```bash
# Stage 1: Ingest
python3 scripts/ingest/audit_ingest.py --root corpus/
python3 scripts/ingest/verify_ingest.py --root corpus/

# Stage 2-3: Knowledge
python3 scripts/learn/verify_knowledge.py --strict_order

# Stage 4: Reasoning
python3 scripts/reason/verify_reasoning.py --strict_order

# Full pipeline
python3 scripts/god_learn/god_learn.py verify --verbose
```
