# God-Agent Retrieval Cutover — ChromaDB + gte-Qwen2(1536) → archon BGE-768 + SQLite

**Target repo:** `/home/dalton/projects/god-agent-clean` (cut on a branch off `main`)
**Deploy target:** boss's laptop — **CPU-only, no discrete GPU**, **no reranker**, KEEP Python VLM captioning + CLIP image wins.
**Boss distro's corpus is EMPTY** → reingest is light; the user's own corpus is a *separate* store and out of scope for this plan.
**Date:** 2026-07-27

---

## 0. Guiding facts (from the four maps — do not re-derive)

- The new backend **already exists in-tree**: `src/ingestion/*` is a tested archon port — `FastembedProvider` (BGE-base-en-v1.5, **768-dim**, backend namespace `"fastembed-onnx"`, async, `search_document:`/`search_query:` prefixes, L2-normed), `SqliteVectorStore` (Float32 BLOBs, provider-namespaced, per-row dim, exact cosine kNN, content-hash reuse cache), hybrid FTS5+cosine retrieval (`retrieval.ts`), `NoopReranker` off by default. `fastembed` + `better-sqlite3` are already in `package.json`. **No chromadb dep.**
- **Vector search has ONE chokepoint:** `SmartRetrievalLayer.semanticSearch()` (`src/god-agent/retrieval/smart-retrieval-layer.ts:873–1004`). ~30 caller sites funnel through `retrieveContext()` → this one method → the only embedding `POST :8000/embed` + the only Chroma `/query`. Repoint this one method and the whole write pipeline follows. All consumers depend on the `ContextChunk` shape, not on raw Chroma JSON.
- **god-agent-clean is a READ-ONLY consumer of Chroma.** Zero Chroma writes in the TS tree; ingestion lives in Python (`scripts/ingest/run_ingest_phase2.py`).
- **Two gaps block the native path today:** (1) **no ingestion driver** wires `markerSingle → persistBlockChunks → indexPendingChunksAsync(FastembedProvider)`; (2) the only wired consumer (`verbatim-backend.ts`) uses `DeterministicEmbeddingProvider(768)` (hash-bag, non-semantic) — **real BGE is never invoked** and its **ONNX weights are not cached** (first embed downloads from HF or throws offline).
- **The retirement is mostly deletion**, not construction: retire the Python `:8000` gte-Qwen2 embedder + ChromaDB `:8001` + `vector_db_1536/`, the WRAITH reranker default-on, and the OpenAI/Zilliz backends.

---

## A. TARGET ARCHITECTURE

```
                         ┌─────────────────── INGESTION (TS-native, CPU) ──────────────────┐
                         │                                                                  │
  corpus/*.pdf ─► folder walk ─► docId+contentHash+dedupe ─► store.insertDocSource          │
                         │            │                                                     │
                         │            ▼                                                     │
                         │   MarkerSource.markerSingle({device:'cpu'}).blocksAndFiguresFor  │
                         │            │                          │                          │
                         │        Block[]                    FigureRegion[] (page+bbox)      │
                         │            │                          │                          │
                         │            ▼                          ▼                          │
                         │   persistBlockChunks(...,COORD_MARKER,isAristotle)   ┌── Python image SIDECAR (off hot path) ──┐
                         │   → doc_chunks(status='pending')                     │ PyMuPDF crop → PNG+sidecar               │
                         │   + doc_chunk_spatial/locators/blocks/page_breaks    │ VLM caption (Ollama)  → caption text ────┼──┐
                         │            │                                         │ CLIP-512 embed        → 512-D vector ────┼┐ │
                         │            ▼                                         └─────────────────────────────────────────┘│ │
                         │   indexPendingChunksAsync(store, vecText, FastembedProvider, {batchSize:32})                    │ │
                         │            │                                                                                    │ │
                         └────────────┼────────────────────────────────────────────────────────────────────────────────┘ │
                                      ▼                                                caption folds back as ordinary chunk │
   ┌─────────────── SQLite file (.god-agent/corpus.db, one better-sqlite3 handle) ───────────────┐  ◄────────────────────┘ │
   │                                                                                              │                        │
   │  IngestionStore (relational): doc_sources, doc_chunks, doc_chunk_spatial, doc_locators,      │                        │
   │                               doc_chunk_page_breaks, doc_chunk_blocks, doc_chunk_hashes,     │                        │
   │                               FTS5(porter unicode61) + NEW doc_chunk_meta (see §C.4)         │                        │
   │  SqliteVectorStore  #1  vec_text_chunks   dim=768   provider='fastembed-onnx'   (prose+caption)                       │
   │  SqliteVectorStore  #2  vec_page_images   dim=512   provider='clip-512'         (image vectors) ◄─────────────────────┘
   └──────────────────────────────────────────────────────────────────────────────────────────────┘
           │                                                        │
           ▼ (BGE query encoder)                                    ▼ (CLIP TEXT encoder — separate, never fused into BGE)
   ┌─ RETRIEVAL ADAPTER (§B) ───────────────────────┐      search_images_clip (Python) re-pointed at vec_page_images
   │ SmartRetrievalLayer.semanticSearch/keywordSearch│
   │  embedQuery (BGE) → semanticSearchAsync         │
   │  cosine-dist → sqrt(2·d) → caller's 1−d²/2       │
   │  join doc_chunk_meta → ContextChunk metadata     │
   │  reranker OFF (NoopReranker)                      │
   └─────────────────┬───────────────────────────────┘
                     ▼  ContextChunk[]  (unchanged shape)
   ~30 consumers: write-pipeline-orchestrator, retrieval-stage, icp-orchestrator,
   section-orchestrator, prompt-decomposer, claim-stress-tester, pdf-analysis-pipeline, faceted-retrieval
                     │
                     ▼
   VERBATIM GATE (verbatim-backend.ts) — native on doc_chunks; swap DeterministicEmbeddingProvider → FastembedProvider;
                                          relax the vector_db_1536 refuse-guard IF sharing the corpus DB.
```

**Two stores, two encoders, joined only by `doc_id`/`page`.** VLM captions are TEXT → they enter the **768** text store as ordinary chunks (same BGE retrieval as prose — the clean win). CLIP image vectors are **512** and require the **CLIP text encoder** at query time → a physically separate `SqliteVectorStore` table, never fused into BGE retrieval. Marker runs `TORCH_DEVICE=cpu` (single attempt, 30-min timeout); fastembed is CPU-only by construction (no GPU knob); reranker stays off.

---

## B. RETRIEVAL ADAPTER CONTRACT (drop-in for today's Chroma callers)

The adapter lives **inside** `smart-retrieval-layer.ts`, replacing the HTTP bodies of `semanticSearch()` (873–1004) and `keywordSearch()` (1009–1091). Everything downstream depends on `ContextChunk` (`retrieval/types.ts:136–181`), not on Chroma JSON, so a faithful adapter needs **zero** changes at the ~30 call sites.

### B.1 Semantic path (`semanticSearch`, was 873–1004)

| Concern | Chroma today | Native replacement |
|---|---|---|
| Query embedding | `POST :8000/embed {texts:[enrichedQuery], kind:'query'}` (898–902) | `await new FastembedProvider().embedQuery(enrichedQuery)` → 768-vec. **Keep** `expandQueryWithCanonicalTerms()` (884–892) — it runs *before* embed, unchanged. |
| Vector search | `POST .../collections/{id}/query {query_embeddings, n_results, include, where?}` (920–945) | `precomputedQueryProvider('fastembed-onnx', 768, vec)` → `semanticSearchAsync(store, vecText, provider, enrichedQuery, poolSize)` (async entrypoint — **R6**). |
| collection→UUID | `resolveCollectionId()` (121–177) | **Delete** — SQLite has no collection UUIDs. |
| Response parse | nested `ids[0]/documents[0]/metadatas[0]/distances[0]` (955–961) | Map `SearchResults.results[]` into that nested-by-query shape (wrap one level: `[[…]]`) OR bypass the wire shape and build `ContextChunk[]` directly. Prefer **direct `ContextChunk` construction** — fewer moving parts. |
| Distance→score | `relevanceScore = max(0, 1 − d²/2)` (969–970), expects **L2** | `SearchResult.distance = 1 − cosine` (cosine-distance). Emit `distances = sqrt(2·distance)` so the caller's `1 − d²/2` recovers cosine. **OR** set `relevanceScore = result.score`/`result.semanticScore` directly and skip the formula. Choose ONE explicitly — passing `distance` through raw silently corrupts scores. |
| `where` (author/collection filter) | Chroma metadata `where` (936–939) | `retrieval.ts` has **no metadata WHERE**. Translate `where` → docId set (author/collection → docIds via `doc_chunk_meta`) → `semanticSearchInDocs(store, vs, provider, query, docIds, perDoc)`, or post-filter results against `doc_chunk_meta`. |
| Metadata carriage | Chroma `metadatas[0][i]` supplies author/title/year/collection/… | `SearchResult` carries only `chunkId/documentId/content/pageStart/pageEnd`. **Join `doc_chunk_meta` on chunkId** (§C.4) to fill `author(_raw)`, `title(_raw)`, `year`, `collection`, `chunk_index`, `path_rel`, `content_type`, `has_bboxes`, `source_method`, `bboxes`. Preserve the `author_raw||author` / `title_raw||title` fallbacks and the `has_bboxes`-gated `bboxes` passthrough (972–992). |

**`ContextChunk` fields the adapter must populate** (types.ts:136–181): `chunkId ← result.chunkId`; `docId ← meta.doc_id ?? chunkId`; `content ← result.content`; `metadata.{author,title,year,page_start,page_end,collection,doc_id,chunk_index,path_rel,content_type,has_bboxes?,source_method?,bboxes?}`; `relevanceScore ←` chosen conversion; `retrievalScore?` = pre-rerank cosine (rerank OFF → equals relevanceScore); `embedding?` optional.

### B.2 Keyword path (`keywordSearch`, was 1009–1091)

- Chroma `POST .../get {where_document:{$contains:keyword}, limit, include}` (flat arrays) → **`exactSearch(store, keyword, topK, totalChunks)`** or `store.ftsMatchChunkIds(keyword)` (FTS5 porter unicode61). Build the same `ContextChunk[]` (score = lexical overlap, no distances). Join `doc_chunk_meta` for metadata identically.

### B.3 Backend switch (rollback lever — R1/R7)

- Gate the whole adapter behind **`GOD_RETRIEVAL_BACKEND=sqlite|chroma`** (default `chroma` until Stage 4, then flip to `sqlite`). One env var restores the Chroma path during bake-in. Keep both branches compiling until Stage 5.

### B.4 Namespace + async guards (R6)

- Assert the store's provider namespace is **`fastembed-onnx`** before trusting results; a stale `deterministic-768` index yields `totalIndexedChunks=0` and **silently skips** semantic retrieval. Route **only** through async entrypoints (`semanticSearchAsync`, `indexPendingChunksAsync`/`reindexAllAsync`) — the sync `search()`/`searchWithMode()` bind `DeterministicEmbeddingProvider` and return non-semantic garbage that *looks* like it works.

---

## C. INGESTION DRIVER SPEC (new — the biggest genuine build)

New module + thin CLI, e.g. `src/ingestion/driver/corpus-ingest.ts` + `src/ingestion/driver/cli.ts` (npm script `corpus:ingest`). No driver exists today; this is the one substantial piece of net-new code.

### C.1 Per-folder / per-PDF flow

1. **Walk** the target dir for `*.pdf`.
2. **Assign** `documentId` + `artifactId`; compute content hash; dedupe via `store.documentHashExists(hash)` / `getDocumentByContentHash`. On hash change → `vectorStore.deleteVectorsForDoc(documentId)` then re-persist (content-hash cache retained by design — R8/idempotency).
3. `store.insertDocSource({ documentId, sourcePath, mediaType:'application/pdf', contentHash, discoveredAt, status:'Ingesting' })` (optionally `insertOcrRun`).
4. **Marker CPU parse:** `await MarkerSource.markerSingle({ device:'cpu' }).blocksAndFiguresFor(pdf)` → `{ blocks, figures }`. Filename-gate `isAristotle`.
5. `persistBlockChunks(store, documentId, artifactId, 'ocr_text', blocks, COORD_MARKER, isAristotle)` → chunks land `embedding_status='pending'`, ids `chunk-{documentId}-{i}`.
6. **Write `doc_chunk_meta`** (§C.4) for each chunk (author/title/year/collection/path_rel/content_type/source_method/has_bboxes/bboxes/chunk_index) from doc-source + filename/folder + Marker block info.
7. **Embed + index (real BGE):** `await indexPendingChunksAsync(store, vecText, new FastembedProvider(), { batchSize:32 })` → 768-vec into `vec_text_chunks` under `fastembed-onnx`.
8. **Figures → Python sidecar** (Stage 6): emit `figures` + PDF path to the sidecar; sidecar returns per-figure `{caption, clip512}`. Ingest `caption` as a normal pending chunk (BGE-768, links back via `doc_id`/`page`), then re-run step 7 for the new pending caption chunks; write `clip512` into `vec_page_images` (dim 512, provider `clip-512`) + a `doc_images` metadata row.
9. `store.updateDocStatus(documentId, 'Ingested')` → `'Processed'`.

### C.2 Shared handles

- One SQLite file: `const vecText = new SqliteVectorStore({ db: store.db, table:'vec_text_chunks', dim:768, provider:'fastembed-onnx' })`; `const vecImg = new SqliteVectorStore({ db: store.db, table:'vec_page_images', dim:512, provider:'clip-512' })`. Schema declares no FK REFERENCES, but `doc_sources` must exist before `locateQuote`/metadata joins.

### C.3 Model pre-warm (R4)

- `fastembed@2.1.0` is installed but **ONNX weights are NOT cached** (no `~/.cache/fastembed`). Add a one-time pre-warm step (`corpus:warm-embedder` → construct `FastembedProvider` + one `embedChunks(['warm'])`), or set `cacheDir` / ship weights. On an offline laptop the first embed throws `"fastembed model not available"` — pre-warm on a networked pass before deploy.

### C.4 `doc_chunk_meta` (NEW additive table — closes the metadata-carriage gap)

`SearchResult` does not carry author/title/year/collection/chunk_index/path_rel/content_type/has_bboxes/source_method/bboxes. Add an additive table keyed by `chunk_id` holding exactly these columns, written at ingest (C.1 step 6) and joined at retrieval (§B.1). This is the minimal bridge that makes the adapter metadata-faithful without touching `retrieval.ts`'s return type.

---

## D. ORDERED STAGES (each independently verifiable; distro stays working at every step)

Sequence rationale: **build + prove the new substrate behind a flag → repoint consumers → delete old stack → docs.** A working system at every checkpoint; the Chroma path remains the live default until Stage 4.

---

### STAGE 0 — Branch, tag, baseline (safety net)

- **Do:** branch off `main`; tag pre-cutover commit. Confirm boss-distro corpus is empty (`corpus/` = `.gitkeep`+README only; no `vector_db_1536/`, no `.god-agent/verbatim.db`).
- **Files:** none (git only).
- **Verify:** `git tag` present; `ls corpus/` and `ls .god-agent/*.db` confirm empty corpus.
- **Rollback:** n/a.

---

### STAGE 1 — Ingestion driver + BGE pre-warm (net-new, no consumer touched)

- **Do:** write `src/ingestion/driver/corpus-ingest.ts` + CLI (§C.1–C.3); add `doc_chunk_meta` DDL (§C.4, additive) to `schema.ts`; add `corpus:ingest` + `corpus:warm-embedder` npm scripts. Text-only for now (no figures — Stage 6). Pre-warm BGE weights on a networked pass.
- **Files:** new `src/ingestion/driver/*`; `src/ingestion/schema.ts` (additive DDL only); `package.json` scripts. **No consumer, no old-stack file touched.**
- **Verify:** run `corpus:warm-embedder` (weights cached); ingest **the VR paper** into `.god-agent/corpus-test.db`; assert `doc_chunks` rows have `embedding_status='indexed'`, `vec_text_chunks` provider = `fastembed-onnx` with dim 768 and `rawVectors > 0`, `doc_chunk_meta` populated.
- **Rollback:** delete new files + test DB; zero blast radius (nothing else imports them).

---

### STAGE 2 — Prove native retrieval on the VR paper (adapter, flag default OFF)

- **Do:** implement the retrieval adapter (§B) inside `semanticSearch()`/`keywordSearch()` behind `GOD_RETRIEVAL_BACKEND` (default `chroma`). Wire the async path + namespace guard (§B.4). Delete/park `resolveCollectionId`.
- **Files:** `src/god-agent/retrieval/smart-retrieval-layer.ts` (both methods, gated); adapter helper if factored out.
- **Verify:** A/B harness (adapt `scripts/test-rerank-wiring.ts`, **rerank OFF**) on a fixed query set against the Stage-1 VR-paper DB with `GOD_RETRIEVAL_BACKEND=sqlite`: assert non-empty `ContextChunk[]`, correct metadata (author/title/page_start/page_end/bboxes), sane `relevanceScore` ordering, and that the distance-conversion choice (§B.1) yields cosine-consistent scores. Confirm `chroma` default path still works unchanged.
- **Rollback:** unset `GOD_RETRIEVAL_BACKEND` (or set `chroma`) — instant revert; old path untouched.

---

### STAGE 3 — Verbatim gate onto real BGE + shared-store decision (R3)

- **Do:** swap `DeterministicEmbeddingProvider(768)` → `FastembedProvider` in `verbatim-backend.ts:60`. Decide shared-vs-separate store; if the verbatim store == corpus `.god-agent/corpus.db`, relax the `vector_db_1536`/`chroma.sqlite3` **refuse-guard** (`verbatim-backend.ts:41`) and confirm `IngestionStore` additive DDL is safe on the corpus DB. Keep `GOD_AGENT_VERBATIM_DISABLE` kill-switch intact.
- **Files:** `src/god-agent/core/writing/verbatim-backend.ts`.
- **Verify:** run `verbatim:verify` against a known quote from the VR paper; assert semantic (not hash-bag) match; assert namespace `fastembed-onnx`. Confirm kill-switch still disables cleanly.
- **Rollback:** revert provider swap + guard; `GOD_AGENT_VERBATIM_DISABLE=1` as instant lever.

---

### STAGE 4 — Repoint live drafting: flip default to `sqlite` (R1/R5)

- **Do:** flip `GOD_RETRIEVAL_BACKEND` default → `sqlite`. **Flip reranker default OFF:** `isRerankEnabled()` (`smart-retrieval-layer.ts:1190`) `true→false` so no per-query **8s** `:8100` stall (WRAITH unreachable on the laptop — R5). Ingest the full boss corpus (light, empty today) via the Stage-1 driver.
- **Files:** `src/god-agent/retrieval/smart-retrieval-layer.ts` (default flag + `isRerankEnabled` default); `src/god-agent/retrieval/types.ts:283–296` (rerank config default).
- **Verify:** end-to-end god-write / section-orchestrator / ICP smoke run pulls real corpus context from SQLite; **no 8s rerank stall** (time a query); `retrieval-stage.ts:222–338` returns populated `ContextChunk[]`. All ~30 callers unchanged.
- **Rollback:** `GOD_RETRIEVAL_BACKEND=chroma` + re-enable rerank env — Chroma path still present (not yet deleted).

---

### STAGE 5 — Repoint the NON-corpus :8000 dependents (R8 — easy to miss)

- **Do:** `:8000` also served CapabilityIndex routing + DESC/UCM episodic memory via `embedding-proxy.ts`. Repoint `src/god-agent/core/ucm/desc/embedding-proxy.ts` consumers to an in-process fastembed shim (or tiny local embed). Drop the `ucm depends_on embedding` edge in `launcher.yaml.default`. These are internal-reasoning vectors — split from the corpus dim (see R2): introduce a **separate corpus-dim constant (768)** for the retrieval/verbatim path and **leave `VECTOR_DIM=1536`** (`constants.ts:20`) for attention/GNN/compression head math (1536/12=128; a blind flip → 64 corrupts attention). Purge+rebuild derived local indexes (episode-store, capability-cache, DESC — all regenerable).
- **Files:** `embedding-proxy.ts`; `launcher.yaml.default`; new corpus-dim constant; scope the hard `!== 1536` asserts (`god-agent.ts:835`, `provenance-utils.ts:285`, `capability-cache.ts:31`, `health-service.ts:116–117`, `vector-service.ts:123`, `episode-store.ts:181`, `analogical-engine.ts:559`) off the corpus path or to the new constant.
- **Verify:** smoke-test daemon + ucm startup **with the embedding service absent**; CapabilityIndex routing + DESC embeddings still function; attention/head config unchanged (VECTOR_DIM still 1536 internally).
- **Rollback:** restore `embedding-proxy.ts` endpoint + `depends_on` edge; keep `:8000` runnable from history until this stage verifies.

---

### STAGE 6 — Python image sidecar: VLM captions (768) + CLIP (512)

- **Do:** reduce Python to a **figures-only sidecar**. Sever the inline VLM/CLIP block (`run_ingest_phase2.py:1704–1739`); keep `image_extractor` (PyMuPDF crop), `vlm_captioner.py` (Ollama), `clip_embedder.py`. Sidecar consumes Stage-1 driver's emitted `figures`+PDF, returns `{caption, clip512}`. Driver folds captions into `vec_text_chunks` (768) and CLIP into a **new `vec_page_images` (512, provider `clip-512`)** + `doc_images` metadata. Re-point `search_images_clip.py` at the 512-D SQLite store (was Chroma `image_vectors`). CLIP image search stays a **separate CLIP-text-encoder path, never fused into BGE**.
- **Files:** `scripts/ingest/run_ingest_phase2.py` (strip to sidecar or new thin `image_sidecar.py`); `scripts/ingest/index_images_clip.py`, `search_images_clip.py` (re-point to SQLite); driver figure-handling (C.1 step 8); `schema.ts` (`doc_images` DDL).
- **Verify:** ingest a figure-bearing PDF; assert caption chunks searchable in ordinary BGE retrieval (`relevanceScore` sane); `vec_page_images` has 512-D rows; `search_images_clip` returns image hits via CLIP text query against SQLite.
- **Rollback:** disable sidecar step in driver (text-only ingest still works — Stage 1); image search degrades to unavailable, not broken.

---

### STAGE 7 — Retire the old stack (delete Chroma + gte-Qwen2 + rerank + OpenAI/Zilliz)

Only after Stages 4–6 verify. Do **not** flip a dim and hard-delete in the same commit (R7) — the dim split already landed in Stage 5; this stage is deletion only.

- **Do (see §E checklist):** remove `:8000` embedder, ChromaDB launch, WRAITH rerank branch, OpenAI/Zilliz backends, Python ingest/maintenance scripts, packaging bundles, stale `.pre-*-bak` copies. Fix health probes that would report DOWN forever.
- **Files:** §E.
- **Verify:** `god-launch` starts with **no** embedding/Chroma service; full drafting + verbatim + image search run green; `grep -rn 'localhost:8001\|:8000/embed\|knowledge_chunks\|isRerankEnabled.*true' src/` returns only intentionally-kept or removed-branch results; no health probe reports a hard-down corpus backend.
- **Rollback:** git revert this deletion commit — restores the entire old stack from history (kept intact through Stage 6).

---

### STAGE 8 — Docs, config, packaging reconciliation

- **Do:** update all docs to the native-SQLite reality (§E.2). Remove `chromadb`/`pymilvus`/`sentence-transformers`/`torch`/`openai` from requirements. Reword verbatim-gate + FCDP + setup docs.
- **Files:** §E.2.
- **Verify:** fresh-clone dry read of `SETUP.md`/`README.md` describes only the CPU-only SQLite/BGE path; no stale `:8000`/`:8001`/`vector_db_1536`/1536-dim claims on the corpus path; `.env.example` drops `EMBEDDING_BACKEND`/`VECTOR_DB`/`OPENAI_*`/`ZILLIZ_*`.
- **Rollback:** docs-only; trivially revertible.

---

## E. REMOVAL / CLEANUP CHECKLIST

### E.1 Code / deps / services to REMOVE or disable

- **gte-Qwen2 :8000 service:** `embedding-api/api_embedder.py` (whole FastAPI server; model load `:53`; OpenAI branch `:274,:299`); `scripts/packaging/api_embedder.py`; `embedding-api/api-embed.sh` (starts Chroma `:95` + API `:116–118`); `embedding-api/requirements.txt` (`chromadb`/`pymilvus`/`sentence-transformers`/`transformers`/`torch`/`openai` `:6–20`); `requirements-full.txt:13` (`chromadb==1.4.0`).
- **Chroma client usage:** `smart-retrieval-layer.ts` `CHROMADB_URL`/`resolveCollectionId`/`semanticSearch`/`keywordSearch` (superseded by adapter — Stage 2); `corpus-citation-connector.ts:120,146` (`vector_db_1536`); Python scripts bound to Chroma+`knowledge_chunks`: `run_ingest_phase2.py`, `index_images_clip.py`, `reingest_layout.py`, `render_citation_bbox.py`, `query_chunks.py`, `migrate-kus.py`, `batch-ku-promote.py`, `backfill-ku-bboxes.py`, `backfill-edge-ku-links.py`, `llm-edge-derivation.py`, `qa/core/consistency_checker.py`, `qa/duplicate_detector.py`, `audit/core/{missing_link_detector,coverage_analyzer}.py`, `learn/verify_knowledge.py`, `highlights/map_highlights_to_chunks.py`.
- **Health/status probes (fix so they don't report DOWN forever):** `observability/express-server.ts:591,3910–3926,4077,4453–4495`; `observability/icp-api-routes.ts:286,296–297` (folder-discovery `/get` — port to `doc_chunk_meta` scan or drop).
- **god-launch Chroma/embedding launch:** `scripts/god-launch` (`SERVICES` `embedding` `:86`, `EMBEDDING_PORT=8000` `:97`, `ucm depends_on embedding`); `scripts/god-launch.d/start.sh:83–124,495–504`; `scripts/god-launch.d/embedding-on-demand.sh` (whole file); `scripts/god-launch.d/status.sh:24–31,154`; `scripts/god-launch.d/launcher.yaml.default:14–20,61–72`; `scripts/gpu-mode:12`; `scripts/packaging/setup-god-agent.sh:453`, `package-god-agent.sh:244–267,502–671`.
- **Reranker (task: NO reranker):** `smart-retrieval-layer.ts:1184–1207` (`isRerankEnabled` default `true→false` or delete branch `:239–247,924–931,1220–1286`); `retrieval/types.ts:283–296`; `scripts/test-rerank-wiring.ts` (repurpose as A/B harness first, then remove); `cli/retrieval/cross-encoder-reranker.ts.pre-p1-bak`.
- **OpenAI embed backend:** `api_embedder.py` OpenAI branch; `api-embed.sh:117`; `core/migration/backward-compat.ts:17`. (Native side already correctly **defers** the OpenAI-1536 provider — leave that deferral; remove only the live Python path.)
- **Stale `.pre-*-bak` copies (delete — pollute greps):** `gpu-server-manager.ts.pre-p1-fix-bak`; `smart-retrieval-layer.ts.{git-version,pre-p0-fix-bak,pre-p1-bak,pre-p1-fix-bak,pre-retrieval-fix-bak}`; `icp-api-routes.ts.pre-*-bak` (8); `cross-encoder-reranker.ts.pre-p1-bak`; `section-orchestrator.ts.pre-p3-bak`.
- **1536 constants (DO NOT blindly flip — R2):** keep `VECTOR_DIM=1536` (`constants.ts:20`) for internal reasoning; introduce a separate corpus-dim (768); scope the hard `!== 1536` asserts off the corpus path (list in Stage 5).

### E.2 Config / docs to UPDATE

- `README.md` (`:139–174` dual-backend, `:427`, `:707,1740` gte-Qwen2-1536, `:1672` `vector_db_1536/`, services table `:1755–1773`).
- `SETUP.md` / `SETUP-WINDOWS-SOP.md` (`:28,206,234–235,251–266,488,524`).
- `VERBATIM-GATE.md:41–52` ("requires ChromaDB backend"; `local_vectors_1536`) → native-SQLite reality.
- `GRANT-WRITING-WORKFLOW.md:48,55–56,170`; `FCDP-DRAFTING-PROTOCOL.md:17`.
- `scripts/common/CONFIG_GUIDE.md:71,293`; `god_learn_pipeline_readme_phases_1_10.md:30–33`; `learn/Phase_6_README.md:75`; `qa/WEEK2_SUMMARY.md:28,206`.
- `.claude/commands/god-launch.md:14`, `god-write.md:40,98`.
- `.gitignore:18–20` (`vector_db_1536/` may stay ignored; live store = `.god-agent/*.db`).
- `.env.example` / `SETUP*`: drop `EMBEDDING_BACKEND`/`VECTOR_DB`/`OPENAI_API_KEY`/`ZILLIZ_*`.
- `package.json`: **no dep change** (`fastembed`, `better-sqlite3` already present; no chromadb dep); keep `verbatim:backfill`/`verbatim:verify`.

---

## F. RISK REGISTER (with de-risks)

- **R1 — Drafting-retrieval breakage (HIGH).** `SmartRetrievalLayer` feeds god-write/section-orchestrator/ICP. *De-risk:* adapter behind `GOD_RETRIEVAL_BACKEND` (Stage 2–4), fixed-query A/B (rerank OFF) before flip; Chroma branch kept until Stage 7.
- **R2 — 1536→768 dim mismatch (HIGH).** `VECTOR_DIM=1536` also drives attention head math (1536/12=128 → 64 if flipped) + persisted internal vectors. *De-risk:* **separate corpus-dim constant (768)**; leave `VECTOR_DIM` for internal reasoning; purge+rebuild derived indexes (episode/capability/DESC — regenerable); scope `!== 1536` asserts off the corpus path (Stage 5).
- **R3 — Verbatim gate store interaction (MEDIUM).** Gate refuses any `vector_db_1536`/`chroma.sqlite3` path; post-cutover the corpus + gate store may be the same SQLite DB. *De-risk:* decide shared-vs-separate (Stage 3); if shared, relax the refuse-guard, confirm additive DDL safe; keep `GOD_AGENT_VERBATIM_DISABLE` kill-switch.
- **R4 — Reingest + cold BGE model (LOW, corpus empty).** No `vector_db_1536/`/`verbatim.db` to migrate; fresh native ingest builds from scratch. *De-risk:* pre-warm fastembed weights on a networked pass (offline first-embed throws — Stage 1/C.3).
- **R5 — Rerank default-ON footgun / :8100 stall (MEDIUM).** `isRerankEnabled()=true` → WRAITH `:8100` unreachable on laptop → **8s timeout/query**. *De-risk:* default `false`, leave `GOD_RERANK_ENABLED` unset, confirm no per-query stall in A/B (Stage 4).
- **R6 — fastembed async-vs-sync silent garbage (MEDIUM).** Sync `search()`/`searchWithMode()` bind `DeterministicEmbeddingProvider` (hash vectors that *look* fine). *De-risk:* route only through `semanticSearchAsync` + `indexPendingChunksAsync`/`reindexAllAsync`; assert provider namespace `fastembed-onnx` (not `deterministic-768`) before trusting results.
- **R7 — Rollback (MEDIUM).** One-commit dim-flip + hard-delete is hard to revert. *De-risk:* branch + pre-cutover tag; dim split lands in Stage 5, deletion in Stage 7 (never same commit); `GOD_RETRIEVAL_BACKEND` restores Chroma during bake-in; keep `api_embedder.py`/`api-embed.sh`/Chroma launch in history until Stage 7 verifies.
- **R8 — Orphaned :8000 dependents beyond corpus (MEDIUM, easy to miss).** `:8000` also served CapabilityIndex routing + DESC/UCM via `embedding-proxy.ts`; `ucm depends_on embedding`. *De-risk:* repoint `embedding-proxy.ts` to in-process fastembed shim, drop the `depends_on` edge, smoke-test daemon+ucm with embedding service absent (Stage 5).

---

## Effort — honest

- **Genuinely new / substantial:** the ingestion driver (§C, Stage 1) and `doc_chunk_meta` metadata carriage (§C.4). This is the only real build; everything downstream reuses the tested `src/ingestion/*` port.
- **Moderate, bounded:** the retrieval adapter (§B, Stage 2) — one method rewrite behind a flag; distance-unit + `where`→docIds translation are the fiddly bits. Non-corpus `:8000` repoint (Stage 5, R8) — small but easy to overlook.
- **Mechanical:** verbatim provider swap (Stage 3), rerank default flip (Stage 4), deletion (Stage 7), docs (Stage 8).
- **Cheap because pre-decided:** no schema drift risk (TS is sole writer — chose TS-native over the two-writer Python-swap), no migration (empty corpus), no chromadb dep to add/remove on the TS side.
- **Named accepted-losses (decide, don't drift):** OCR-fallback content routing, camelot/pdfplumber tables (already auto-bypassed when Marker JSON succeeds), and the **scholarly fidelity gate** (pdftotext-vs-Marker text choice) — the one genuine quality feature with no TS equivalent; flag for a later port or an accepted regression under a Marker-FULL policy.
