# Port Ingestion, Learning & Reasoning System to claudeflow-new

**Date**: 2026-03-24
**Source**: `/home/dalton/projects/claudeflow-testing` (mature)
**Target**: `/home/dalton/projects/claudeflow-new` (fresh)
**Goal**: Get the entire local doc ingestion → knowledge → reasoning pipeline operational

---

## Current State

### What claudeflow-new HAS
- `embedding-api/` (api_embedder.py, requirements.txt) — embedding server code
- `vector_db_1536/` — exists but **empty** (4KB)
- `src/god-agent/core/search/` — code-focused search (dual-code-embedding, fusion-scorer, hybrid-search) — **different architecture** from corpus retrieval
- `src/god-agent/core/learning/sona-engine.ts` — trajectory tracking (same version)
- `src/god-agent/core/reasoning/` — 18 files (GNN, EWC, contrastive loss) but **missing `auto-mode-selector.ts`**
- `scripts/hooks/`, `scripts/migration/`, `scripts/packaging/` — non-pipeline scripts only
- No corpus, no KUs, no reasoning edges, no Python pipeline scripts

### What claudeflow-new is MISSING
- `scripts/ingest/` — entire ingestion pipeline (6 Python scripts + manifest)
- `scripts/god_learn/` — learning compiler (god_learn.py)
- `scripts/reason/` — reasoning derivation (reason_over_knowledge.py + verify)
- `scripts/retrieval/` — query/retrieval scripts (query_chunks.py + verify + filter + synthesis)
- `scripts/learn/` — KU promotion scripts (promote_hits.py + verify + auto_promote + calibration)
- 7 standalone integration scripts (compute-corroboration, graph-visualize, knowledge-prune, llm-edge-derivation, merge-reasoning-edges, migrate-bridge-edges, normalize-edges, sync-ku-to-memory)
- `god-learn/` directory (knowledge.jsonl, index.json)
- `god-reason/` directory (reasoning.jsonl, phase7-derived-edges.jsonl)
- `corpus/` directory (scholarly PDFs — but this is DATA, not code)
- `src/god-agent/retrieval/` (SmartRetrievalLayer — corpus-focused retrieval, distinct from core/search)
- `src/god-agent/core/learning/convergence-tracker.ts`
- `src/god-agent/core/reasoning/auto-mode-selector.ts`

---

## Phase 1: Python Ingestion Pipeline

**Goal**: `python3 scripts/ingest/run_ingest.py --root corpus/` works end-to-end

### 1.1 Copy ingestion scripts

**Source** → **Target** (all paths relative to repo root):

| Source File | Purpose | Dependencies |
|---|---|---|
| `scripts/ingest/run_ingest.py` | Phase 1: PDF text extraction + chunking | `pdftotext` (poppler-utils) |
| `scripts/ingest/run_ingest_phase2.py` | Phase 2: embed chunks + Chroma upsert | `chromadb`, `requests`, embedding server on :8000 |
| `scripts/ingest/layout_analyzer.py` | Multi-column PDF layout detection | `pymupdf` (fitz) |
| `scripts/ingest/audit_ingest.py` | Phase 3: audit manifest by status | None (reads manifest.jsonl) |
| `scripts/ingest/verify_ingest.py` | Phase 3: integrity verification | `chromadb` |
| `scripts/ingest/reingest_layout.py` | Re-ingest with layout analysis | `layout_analyzer.py` |
| `scripts/ingest/watch_corpus.py` | Filesystem watcher for auto-ingest | `watchdog` |
| `scripts/ingest/healthcheck.sh` | One-command health check | bash |
| `scripts/ingest/Phase_1-3_README.md` | Documentation | — |

**Do NOT copy**: `scripts/ingest/manifest.jsonl` (this is data from the old corpus; the new repo will generate its own)

### 1.2 System dependencies

Verify these are installed (they likely are since embedding-api already exists):

```bash
# System
which pdftotext  # from poppler-utils

# Python (in whatever venv the scripts use)
pip install chromadb pymupdf watchdog requests
```

### 1.3 Create empty data directories

```
god-learn/           # Will be populated by Phase 2
god-reason/          # Will be populated by Phase 3
```

### 1.4 Verify embedding server compatibility

The ingestion scripts call `http://127.0.0.1:8000/embed`. Confirm that `claudeflow-new/embedding-api/api_embedder.py`:
- Listens on port 8000
- Accepts POST with `{"texts": [...]}` body
- Returns 1536-dim embeddings
- Uses same model (gte-Qwen2-1.5B-instruct)

**Action**: Read and compare `embedding-api/api_embedder.py` in both repos.

### 1.5 Validation test

```bash
# Phase 1 dry run (no corpus needed — just verify script loads)
cd /home/dalton/projects/claudeflow-new
python3 scripts/ingest/run_ingest.py --root corpus/ --dry-run 2>&1

# Phase 3 audit (should report 0 files, no errors)
python3 scripts/ingest/audit_ingest.py --root corpus/ --manifest scripts/ingest/manifest.jsonl
```

---

## Phase 2: Learning System (KU Promotion)

**Goal**: `python3 scripts/god_learn/god_learn.py compile --root corpus/` works

### 2.1 Copy retrieval scripts

| Source File | Purpose | Dependencies |
|---|---|---|
| `scripts/retrieval/query_chunks.py` | Phase 4: embed query + Chroma search | `chromadb`, `requests` |
| `scripts/retrieval/verify_phase4.py` | Phase 4: schema validation | None |
| `scripts/retrieval/filtering.py` | OCR noise / page furniture filter | None |
| `scripts/retrieval/synthesize_cited.py` | Citation-aware synthesis | None |
| `scripts/retrieval/batch_query.py` | Batch query interface | `query_chunks.py` |

### 2.2 Copy learning scripts

| Source File | Purpose | Dependencies |
|---|---|---|
| `scripts/learn/promote_hits.py` | Phase 6: hit → KU promotion | None (pure Python) |
| `scripts/learn/verify_knowledge.py` | Phase 6: KU integrity check | None |
| `scripts/learn/auto_promote.py` | Auto-promotion on threshold | `promote_hits.py` |
| `scripts/learn/calibration_tracker.py` | Promotion accuracy tracking | None |

### 2.3 Copy god_learn compiler

| Source File | Purpose | Dependencies |
|---|---|---|
| `scripts/god_learn/god_learn.py` | Phase 8: unified compiler front-end | All Phase 1-7 scripts |
| `scripts/god_learn/god-learn` | Shell wrapper | `god_learn.py` |

### 2.4 Copy missing TypeScript modules

| Source File | Purpose |
|---|---|
| `src/god-agent/core/learning/convergence-tracker.ts` | Learning convergence metrics |

**Verify**: Check if `convergence-tracker.ts` has imports that reference files missing in the new repo. If so, document those as additional dependencies.

### 2.5 Initialize data directories

```bash
mkdir -p god-learn god-reason
# Initialize empty knowledge store
echo -n '' > god-learn/knowledge.jsonl
echo '{}' > god-learn/index.json
```

### 2.6 Validation test

```bash
# Compile (should succeed with empty corpus — Phases 1-3 find nothing to do)
python3 scripts/god_learn/god_learn.py compile --root corpus/

# Verify (should pass with empty knowledge)
python3 scripts/god_learn/god_learn.py verify
```

---

## Phase 3: Reasoning System (Edge Derivation)

**Goal**: `python3 scripts/reason/reason_over_knowledge.py` works

### 3.1 Copy reasoning scripts

| Source File | Purpose | Dependencies |
|---|---|---|
| `scripts/reason/reason_over_knowledge.py` | Phase 7: auto-derive edges | None (pure Python, char n-gram) |
| `scripts/reason/verify_reasoning.py` | Phase 7: edge integrity check | None |
| `scripts/reason/build_candidates.py` | Phase 7A: candidate generation | None |
| `scripts/reason/compile_reasoning_llm.py` | LLM-based edge derivation | `anthropic` or `requests` |
| `scripts/reason/apply_annotations.py` | Manual annotation application | None |

### 3.2 Copy integration scripts

| Source File | Purpose |
|---|---|
| `scripts/merge-reasoning-edges.py` | Merge manual + Phase 7 + LLM edges |
| `scripts/normalize-edges.py` | Normalize edge formats across pipelines |
| `scripts/migrate-bridge-edges.py` | Bridge edge migration |
| `scripts/compute-corroboration.py` | Corroboration scoring |
| `scripts/graph-visualize.py` | Mermaid/Graphviz visualization |
| `scripts/knowledge-prune.py` | Prune low-confidence KUs |
| `scripts/sync-ku-to-memory.py` | Sync KUs to external memory |
| `scripts/llm-edge-derivation.py` | LLM-derived edges |
| `scripts/backfill-edge-ku-links.py` | Backfill knowledge_ids into edges |
| `scripts/backfill-ku-chunk-ids.py` | Backfill chunk_id refs in KUs |
| `scripts/batch-ku-promote.py` | Batch promote multiple hit files |

### 3.3 Copy missing TypeScript module

| Source File | Purpose |
|---|---|
| `src/god-agent/core/reasoning/auto-mode-selector.ts` | Reasoning mode selection |

**Verify**: Same import-dependency check as 2.4.

### 3.4 Initialize reasoning data

```bash
echo -n '' > god-reason/reasoning.jsonl
# Create symlink (learning system expects this)
ln -sf ../god-reason/reasoning.jsonl god-learn/reasoning.jsonl
```

### 3.5 Validation test

```bash
# Should succeed with empty knowledge (0 KUs → 0 edges)
python3 scripts/reason/reason_over_knowledge.py \
  --knowledge god-learn/knowledge.jsonl \
  --out god-reason

# Verify (should pass with empty edges)
python3 scripts/reason/verify_reasoning.py \
  --knowledge god-learn/knowledge.jsonl \
  --reasoning god-reason/reasoning.jsonl
```

---

## Phase 4: End-to-End Integration Test

**Goal**: Full pipeline from PDF drop → KU → reasoning edges

### 4.1 Prerequisites
- Embedding server running on :8000
- At least 1 test PDF in `corpus/test/`

### 4.2 Run full pipeline

```bash
# 1. Compile (ingest + embed + verify)
python3 scripts/god_learn/god_learn.py compile --root corpus/

# 2. Update with query (retrieve + promote + reason)
python3 scripts/god_learn/god_learn.py update \
  --root corpus/ \
  --query "test query about the PDF content" \
  --k 8

# 3. Verify everything
python3 scripts/god_learn/god_learn.py verify

# 4. Check outputs
wc -l god-learn/knowledge.jsonl    # Should have KUs
wc -l god-reason/reasoning.jsonl   # Should have edges
```

### 4.3 Success criteria
- [ ] `manifest.jsonl` has records for all PDFs with `status: "ok"`, `phase: 2`
- [ ] `vector_db_1536/` is populated (size > 1MB)
- [ ] `god-learn/knowledge.jsonl` has ≥1 KU
- [ ] `god-learn/index.json` has matching offsets
- [ ] `god-reason/reasoning.jsonl` has edges (if ≥2 KUs exist)
- [ ] All verify scripts exit 0

---

## Phase 5: CLI Integration (Optional, after pipeline works)

### 5.1 Wire `/god-learn` commands in cli.ts

Check if `claudeflow-new/src/god-agent/universal/cli.ts` already has learn/compile/update/verify subcommands. If not, port the relevant command handlers from the testing repo's cli.ts.

### 5.2 Wire `/god-reason` command

Same approach — check existing CLI routing, add if missing.

---

## What This Plan Does NOT Cover

These are **separate porting efforts** beyond the ingestion/learning/reasoning scope:

- **Corpus retrieval for writing** (`src/god-agent/retrieval/SmartRetrievalLayer`) — needed for `/god-write`
- **Composition pipeline** (`src/god-agent/core/composition/`) — ICP orchestrator, constrained generator
- **Writing constraints** (`src/god-agent/core/writing/`) — corpus constraints, inline validation
- **Quality Gauntlet** — 7-stage validation pipeline
- **Author scrubber** — non-corpus author removal
- **Style profile enforcement** — learned writing style injection
- **Corpus data** — the actual PDF files (user must copy or symlink `corpus/` manually)

---

## Execution Order Summary

```
Phase 1: Copy scripts/ingest/ (6 files) + verify deps
Phase 2: Copy scripts/retrieval/ (5 files) + scripts/learn/ (4 files) + scripts/god_learn/ (2 files)
         + convergence-tracker.ts
Phase 3: Copy scripts/reason/ (5 files) + 11 integration scripts
         + auto-mode-selector.ts
Phase 4: Drop test PDF → run full pipeline → verify outputs
Phase 5: Wire CLI commands (if not already present)
```

**Estimated file count**: ~33 Python scripts + 2 TypeScript modules + 3 empty data directories + 1 symlink

**No code modifications expected** — these are pure copies. The scripts use relative paths (`scripts/ingest/manifest.jsonl`, `god-learn/knowledge.jsonl`, `god-reason/reasoning.jsonl`) that work identically in either repo. The only config difference is the embedding server URL (`http://127.0.0.1:8000/embed`) which is the same in both repos.

---

## Risk Factors

1. **Python environment mismatch**: If claudeflow-new uses a different venv or Python version, `chromadb`/`pymupdf` may need reinstalling
2. **Import paths in god_learn.py**: It orchestrates scripts via `subprocess.run()` with relative paths — verify these resolve correctly from the new repo root
3. **convergence-tracker.ts imports**: May reference types or modules that exist in testing but not in new — check before copying
4. **auto-mode-selector.ts imports**: Same concern
5. **Chroma version**: If the two repos have different `chromadb` versions, the `vector_db_1536/` format may differ
