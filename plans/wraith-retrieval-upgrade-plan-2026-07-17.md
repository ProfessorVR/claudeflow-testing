# WRAITH Retrieval Upgrade — Implementation Plan (v1, 2026-07-17)

**Goal:** Improve retrieval quality across god-agent and archon-cli by (a) standing up a GPU
inference service on WRAITH (2×RTX 3090, `192.168.50.22`) serving embeddings + a cross-encoder
reranker, (b) wiring the reranker into both systems' existing (currently stub/no-op) rerank hooks,
(c) fixing the query/document embedding asymmetry bug in god-agent, and (d) upgrading archon's
embeddings from CPU bge-base-768 to GPU gte-Qwen2-1536 — unifying both systems on one embedding
space.

**Audience:** This plan is written for handoff to a less capable model. Follow phases in order.
Each phase has explicit acceptance criteria — do not proceed to the next phase until they pass.
Do not improvise beyond the listed scope; if something doesn't match this plan's description of
the code, STOP and report the discrepancy instead of adapting.

---

## Ground truth (verified 2026-07-17)

### Machines
| Machine | Role | Notes |
|---|---|---|
| Primary (RTX 5090, WSL2) | god-agent (this repo), vLLM :8002, embedding server :8000, ChromaDB :8001 | `embedding-on-demand.sh` currently **kills vLLM to free VRAM** before embedding runs |
| WRAITH `192.168.50.22` (2×RTX 3090, 48GB, WSL2) | Marker OCR on **:8001 and :8002** | Ports 8001/8002 are TAKEN on WRAITH. New service must use **:8100**. Windows `netsh portproxy` + firewall rule needed for any new port |
| Mac / laptop | archon runs there too (device-agnostic core) | archon embedding falls back per-machine; see Phase 3 fallback rule |

### god-agent (this repo, `/home/dalton/projects/claudeflow-testing`)
- Embedding server: `embedding-api/api_embedder.py` (FastAPI, sentence-transformers), model
  `Alibaba-NLP/gte-Qwen2-1.5B-instruct`, **1536-dim**, `max_seq_length=8192`, normalized.
  Verified live: `GET http://localhost:8000/` → `"model": "gte-Qwen2-1.5B-instruct (1536D)"`.
- **Asymmetry bug:** the Python server applies `prompt_name="query"` only in its own `/search`
  endpoint. All TypeScript clients embed queries via `POST /embed`, which uses *document* mode —
  so every TS-side semantic query uses document-style vectors. (gte-Qwen2 is an asymmetric
  instruct model; queries are supposed to get an instruction prefix.)
- `/embed` has a side effect: it also **stores** into the embedder's own collection
  `god_agent_vectors_1536` (duplicate storage). Clients only use the returned `embeddings`.
- ChromaDB :8001, live collections: `knowledge_chunks` (main corpus, space=l2), `v2_knowledge_chunks`,
  `local_vectors_1536`, `god_agent_vectors_1536`, `dissertation-perplexity-cache` (cosine).
  `metaphysics`/`new_media`/`rhetorical_ontology` are **not** collections — they're `collection`
  metadata fields on chunks inside `knowledge_chunks`.
- Central retrieval: `src/god-agent/retrieval/smart-retrieval-layer.ts`
  - `DEFAULT_MAX_CHUNKS=10`, `DEFAULT_MIN_RELEVANCE=0.35` (lines ~47–48)
  - L2→cosine: `1 − d²/2` at lines ~952–954
  - **`rerankResults()` at line ~1170 is a stub** ("TODO: Implement cross-encoder re-ranking",
    returns input unchanged). God-write's retrieval-stage passes `rerank: true` — currently a no-op.
  - Pipeline order: semantic → relevance filter → diversity boost → rerank(stub) → KG boost →
    canonical-term boost (+0.10) → slice to maxChunks → page-context expansion.
- CLI-side vestigial reranker: `src/god-agent/cli/retrieval/cross-encoder-reranker.ts` —
  full class, `mock` mode = Jaccard heuristic, `real` mode = TODO stub (line ~540).
  `src/god-agent/retrieval/hybrid-retriever.ts` has a `setCrossEncoder(fn)` hook nobody calls.
- Config: `src/god-agent/core/config/config-manager.ts` — `services.embedding.endpoint` default
  `http://127.0.0.1:8000/embed`; env overrides `GOD_EMBEDDING_ENDPOINT/HOST/PORT/MODEL`.
  BUT hardcoded `localhost:8000/8001` defaults ALSO live in: `smart-retrieval-layer.ts` (constructor),
  `core/ucm/config.ts:113`, `core/ucm/desc/embedding-proxy.ts:35`,
  `cli/context/agentdb-cold-accessor.ts:107`, ICP scripts, and
  `scripts/ingest/run_ingest_phase2.py:122` (`EMBED_URL` constant, no env var).
- Dimension 1536 hardcoded/validated at: `src/god-agent/core/validation/constants.ts:20`
  (`VECTOR_DIM`, enforced in embedding-provider.ts), `run_ingest_phase2.py:123`, api_embedder.py:128.
- WRAITH precedent in `.env`: `MARKER_URL_REMOTE=http://192.168.50.22:8001`; resolver
  `resolve_marker_pool()` in `run_ingest_phase2.py:125–160` tries WRAITH :8001 and :8002, falls
  back to local :8003.

### archon-cli (`/home/dalton/projects/archon-cli`, Rust workspace)
- Embeddings: `crates/archon-docs/src/embed_fastembed.rs` — fastembed/ort **CPU ONNX**,
  model `BAAI/bge-base-en-v1.5`, **768-dim** (`BGE_BASE_DIM` const, line 11), provider key string
  `"fastembed-onnx"`. Prefixes: `"search_document: "` / `"search_query: "` (lines 9–10). L2-normalized.
- HTTP alternative already exists: `crates/archon-docs/src/embed_openai.rs`
  (`OpenAiCompatEmbeddingProvider`) — dim inferred from model name: 3072 if it contains
  `"3-large"`, **else 1536** (lines ~9, 129–133). Selected via env
  `ARCHON_DOCS_EMBEDDING_PROVIDER=openai-compatible` + `ARCHON_DOCS_EMBEDDING_BASE_URL` +
  `ARCHON_DOCS_EMBEDDING_MODEL` (see `embed_config.rs`).
- Vector store: RocksDB at `.archon/doc-vector-store/`, keys `vec/<provider>/<chunk_id>`,
  embedding cache `cache/<provider>/<content_hash>` — **keyed by provider name**, so a provider
  with a different `backend_name()` gets a clean namespace (no stale-cache or mixed-dim risk
  as long as the provider name differs from `"fastembed-onnx"`).
- HNSW: `hnsw_rs 0.3.4`, snapshot at `.archon/doc-vector-store/hnsw/<provider>/manifest.json`.
  Live: `{provider: "fastembed-onnx", dimension: 768, vector_count: 21852}`.
  Rebuild: `archon docs vector-compact` (or auto post-index). Dim-mismatch → snapshot declined,
  falls back to slow in-memory rebuild. Freshness gate: snapshot used only when
  `manifest.vector_count == live raw count`.
- Search: `archon docs search <q> --mode exact|semantic|hybrid`, top_k hardcoded 10
  (`src/command/docs.rs:856`, `crates/archon-tools/src/docs_runtime.rs:34`).
  Hybrid: exact-shortcut if exact_score ≥ 0.75 (disable: `ARCHON_DOCS_HYBRID_ALWAYS_SEMANTIC=1`);
  otherwise semantic pool at `top_k*3`, fusion weights exact 0.45 / semantic 0.55
  (`retrieval.rs:89`; policy keys `[policy.docs.retrieval] exact_weight/semantic_weight`).
- **Reranker stub exists:** `crates/archon-docs/src/rerank.rs` — trait
  `LocalReranker { rerank(query, passages) -> Vec<RerankScore>; backend_name() }` + `NoOpReranker`.
  Nothing implements or calls it. (Spec ref: TSPEC-ARCHON-EVIDENCE-ENGINE-001 §6.3.)
- Evidence path (citation-critical): `crates/archon-evidence/src/lib.rs::discover()` —
  pool `top_k*6` when filtered/indexed, canonical-term query expansion, `+0.15` owning-work boost,
  primary-source quota 4, winners re-anchored via `quote_verify` (exact-1.00 page/bbox).
  Candidates carry full `content` — passages for a reranker are already in hand.
- Re-embed does NOT need OCR: chunk text lives in Cozo `doc_chunks.content`
  (`.archon/archon-data.db`); `retrieval.rs::reindex_all` → `indexing.rs::index_chunks(all:true)`
  exists explicitly "after model swap".

---

## Design decisions (locked — do not revisit during implementation)

1. **One new service on WRAITH, port 8100** ("wraith-infer"): FastAPI serving both embeddings and
   rerank. GPU 1 stays dedicated to Marker; wraith-infer pins to GPU 0 (`CUDA_VISIBLE_DEVICES=1`
   or whichever GPU Marker does NOT use — check `nvidia-smi` on WRAITH first).
2. **Embedding model stays `Alibaba-NLP/gte-Qwen2-1.5B-instruct` (1536-dim)** for both systems.
   - god-agent: same model ⇒ **no re-embed of the corpus**, no dimension changes anywhere.
   - archon: this IS the upgrade (768 CPU → 1536 GPU), and it unifies both systems on one
     embedding space. Archon re-embeds 21,852 vectors from stored chunk text (no OCR).
   - A stronger embedding model swap (would force god-agent full re-embed) is explicitly
     OUT OF SCOPE for this plan; revisit only after the eval harness (Phase 5) exists.
3. **Reranker: `BAAI/bge-reranker-v2-m3`** (~568M params, ~1.5GB fp16, strong general cross-encoder,
   8k context). Fits alongside the embedder on one 3090 with room to spare.
4. **API shapes:**
   - `POST /v1/embeddings` — **OpenAI-compatible** (`{model, input: string[]}` →
     `{data: [{embedding, index}], model, usage}`) so archon's existing
     `OpenAiCompatEmbeddingProvider` works with zero Rust changes to the provider itself.
     Extension: optional field `"kind": "query" | "document"` (default `"document"`); when
     `"query"`, apply gte-Qwen2's query prompt (same behavior as sentence-transformers
     `prompt_name="query"`). Archon sends its own `search_query:`/`search_document:` prefixes
     in-text for bge — those are bge-specific; for archon see Phase 3 step 4.
   - `POST /v1/rerank` — Jina/Cohere-style: `{model, query, documents: string[], top_n?}` →
     `{results: [{index, relevance_score}]}` sorted desc. Scores are sigmoid(logit) in [0,1].
   - `GET /health` → `{status, models: {embedding: {name, dim}, reranker: {name}}, device}`.
5. **Fallback rules (uniform):**
   - Rerank unavailable → skip rerank, keep current ordering, log a warning. Never fail a
     retrieval because the reranker is down.
   - Embeddings: god-agent keeps its local :8000 server as-is in this plan (migration of
     god-agent embedding traffic to WRAITH is Phase 6, optional). Archon: if WRAITH is
     unreachable, **fail loudly** — do NOT silently fall back to fastembed-768 (mixed spaces).
     On Mac/laptop where WRAITH may be unreachable, user explicitly sets provider back to
     fastembed per-machine.
6. **No commits without user sign-off.** Work on a branch per repo
   (`feat/wraith-retrieval` in each). Show evidence (acceptance outputs) and WAIT.
   Backup any config file before editing (timestamped copy under `.backups/`).

---

## Phase 0 — wraith-infer service on WRAITH

**Deliverable:** `wraith-infer/` directory (create in this repo under `services/wraith-infer/`,
deployed to WRAITH at `/opt/wraith-infer/`): `server.py`, `requirements.txt`, `run.sh`,
`README.md` with the portproxy/firewall commands.

Steps:
1. `server.py`: FastAPI + sentence-transformers.
   - Load `SentenceTransformer("Alibaba-NLP/gte-Qwen2-1.5B-instruct")`, `max_seq_length=8192`,
     device cuda. Embed with `normalize_embeddings=True`; use `prompt_name="query"` iff
     `kind=="query"`.
   - Load `CrossEncoder("BAAI/bge-reranker-v2-m3", max_length=1024)` (or FlagEmbedding
     `FlagReranker` — pick sentence-transformers CrossEncoder for one-dependency simplicity).
   - Endpoints exactly as in Design decision 4. Bind `0.0.0.0:8100`.
   - Batch: embeddings batch 32; rerank batch pairs 64. Truncate rerank passages to 1024 tokens.
   - NO storage side effects (unlike api_embedder.py) — pure inference.
2. Deploy to WRAITH over SSH (Marker deployment precedent exists; ask user for WRAITH SSH alias
   if not in `~/.ssh/config`). Install into a venv; `run.sh` with `CUDA_VISIBLE_DEVICES` pinned
   to the non-Marker GPU.
3. WRAITH Windows host: add `netsh portproxy` rule + firewall allow for 8100 (same pattern as the
   existing 8001/8002 rules — see `plans/` OCR docs or the Task Scheduler startup script on WRAITH;
   this step needs the user at the Windows host if no remote admin path exists — flag it early).
4. Optional but recommended: systemd-style keepalive via WSL boot task, matching how Marker runs.

Acceptance (run from the primary machine):
```bash
curl -s http://192.168.50.22:8100/health          # models + dim 1536 + cuda
# embedding parity with local server (cosine sim of same text > 0.999):
#   embed "test sentence" on :8000/embed and on WRAITH /v1/embeddings (kind=document), compare.
# query-kind differs from document-kind for the same text (cos sim < 0.999).
# rerank sanity: query "boredom in Heidegger" over 3 passages (1 on-topic, 2 off-topic)
#   → on-topic passage ranked first with clearly higher score.
# throughput: 1000 rerank pairs < 30s; 1000-doc embed batch < 60s.
```
Parity check matters: same model + same normalization must produce near-identical vectors to the
local server, otherwise god-agent queries embedded on WRAITH later (Phase 6) would live in a
skewed space.

---

## Phase 1 — god-agent: wire the reranker

**Files:** `src/god-agent/retrieval/smart-retrieval-layer.ts` (primary),
`src/god-agent/core/config/config-manager.ts` (config keys).

Steps:
1. Config: add `services.rerank = { endpoint: 'http://192.168.50.22:8100/v1/rerank', enabled: true, timeoutMs: 8000, candidateMultiplier: 3 }` with env overrides
   `GOD_RERANK_ENDPOINT`, `GOD_RERANK_ENABLED`.
2. Implement `rerankResults()` (line ~1170): POST query + chunk texts to `/v1/rerank`,
   reorder by `relevance_score`, and **replace** `relevanceScore` with the cross-encoder score
   (preserve the original retrieval score in a new field `retrievalScore`). On any
   error/timeout: return input unchanged + `console.warn` once per process (not per call).
3. Widen the candidate pool when rerank is enabled: in `retrieveContext()`, fetch
   `maxChunks * candidateMultiplier` (bounded ≤ 50) from Chroma instead of `maxChunks * 2`,
   rerank, THEN apply the existing downstream boosts and slice to `maxChunks`.
   **Ordering constraint:** rerank must run BEFORE the canonical-term boost so the +0.10 boost
   still applies on top of cross-encoder scores (preserves compiled-index behavior).
   The relevance filter (`minRelevance`) applies to the retrieval score BEFORE rerank
   (unchanged), not to rerank scores — the two scales are not comparable.
4. `cli/retrieval/cross-encoder-reranker.ts` real mode (line ~540): implement against the same
   `/v1/rerank` endpoint; fix its default endpoint (currently wrongly `localhost:8000`). Leave
   mock mode intact as fallback. This activates the `enhanced-hybrid-retriever.ts` path when
   `reranking.enabled` is set — do not flip that default in this phase.
5. Do NOT touch: hybrid-retriever's `setCrossEncoder` hook (leave for later), the KG boost,
   diversity boost, page-context expansion.

Acceptance:
```bash
# unit-ish: a script scripts/test-rerank-wiring.ts that runs retrieveContext() on 5 fixed
# dissertation queries with rerank on vs off (GOD_RERANK_ENABLED) and prints both top-10 lists
# with scores. Expected: ordering changes for at least some queries; no errors; rerank-off
# output identical to pre-change behavior.
# degradation: stop wraith-infer, run again → identical to rerank-off, single warning, no crash.
npx tsc --noEmit   # typecheck passes
```
Save the A/B output to `tmp/rerank-ab-<date>.md` for user review. **STOP for user sign-off.**

---

## Phase 2 — god-agent: fix query/document asymmetry

**Files:** `embedding-api/api_embedder.py`, `src/god-agent/core/embedding-provider.ts` (or
wherever query embedding calls originate — trace callers of `/embed` used for QUERIES:
`smart-retrieval-layer.ts` semantic search, `embedding-proxy.ts`, `agentdb-cold-accessor.ts`).

Steps:
1. `api_embedder.py`: add optional `kind: "query"|"document"` to `/embed` request (default
   `document`, fully backward compatible). When `kind=="query"`: use `prompt_name="query"` AND
   **skip the vector-store write** (query vectors must never be stored in the corpus collection).
2. Also add a proper `GET /health` (alias of `/`) — `embedding-on-demand.sh` already probes
   `/health` which currently 404s.
3. TS: pass `kind: "query"` at every query-side embed call site (the ones listed above);
   ingestion (`run_ingest_phase2.py`) stays `document` (no change — default).
4. **No re-embedding needed** — stored document vectors are already document-mode; only query
   vectors change at request time.

Acceptance: rerun the Phase 1 A/B script (rerank OFF) before/after this change → retrieval
ordering changes for at least some queries; spot-check 3 queries where the new top-5 is
plausibly better (show user). `run_ingest_phase2.py --help`/dry-run still works. **STOP for sign-off.**

---

## Phase 3 — archon: remote GPU embeddings (768 → 1536)

**Repo:** `/home/dalton/projects/archon-cli`, branch `feat/wraith-retrieval`.
Reminder: WSL-only commits; no push until user reviews (standing rule).

Steps:
1. Verify `OpenAiCompatEmbeddingProvider.backend_name()` returns something ≠ `"fastembed-onnx"`
   (read `embed_openai.rs`). Provider-keyed RocksDB namespaces + cache mean a distinct name gives
   a clean 1536 namespace with zero migration of the old 768 data. If the name does NOT differ,
   fix `backend_name()` first.
2. Confirm dim inference: model name won't contain `"3-large"` ⇒ provider assumes 1536. Set
   `ARCHON_DOCS_EMBEDDING_MODEL=gte-Qwen2-1.5B-instruct` (server ignores/echoes the name). If the
   provider hardcodes dim rather than reading the response, verify 1536 is what it uses — it is
   (default path), per survey.
3. Check whether `OpenAiCompatEmbeddingProvider` distinguishes query vs document embedding. If it
   has no notion of kind, add the `kind` extension field for query-side calls
   (`retrieval_semantic.rs` query path) — small Rust change; document embeddings use default.
4. Strip bge-specific `search_query:`/`search_document:` prefixes for this provider (they are
   fastembed-path artifacts; gte-Qwen2 uses its own instruction prompt via `kind`). Check where
   prefixes are applied — if in shared code rather than the fastembed provider, gate them on
   provider type.
5. Env for the run (put in a documented `.env`/shell snippet, not committed as default):
   `ARCHON_DOCS_EMBEDDING_PROVIDER=openai-compatible`,
   `ARCHON_DOCS_EMBEDDING_BASE_URL=http://192.168.50.22:8100/v1`,
   `ARCHON_DOCS_EMBEDDING_MODEL=gte-Qwen2-1.5B-instruct`, timeout 120s.
6. Re-embed: run the existing reindex-all path (`archon docs …` command wrapping
   `reindex_all` — find the exact CLI subcommand; survey says `indexing.rs::index_chunks(all:true)`
   exists "after model swap"), then `archon docs vector-compact`.
   Expect a fresh snapshot at `.archon/doc-vector-store/hnsw/<new-provider>/manifest.json` with
   `dimension: 1536, vector_count: 21852` (count must match the old manifest's).
7. Failure mode: WRAITH down ⇒ command errors loudly (test it). Old fastembed-768 data stays
   intact under its own provider key — instant rollback = flip the env var back.

Acceptance:
```bash
archon docs model-status                       # openai-compatible, 1536
cat .archon/doc-vector-store/hnsw/*/manifest.json   # new provider, dim 1536, count 21852
archon docs search "world-disclosedness in virtual environments" --mode semantic   # sane results, ~seconds
archon docs search "..." --mode hybrid         # fusion still works
# evidence path: run one `archon evidence` discover on a Part III query; quote_verify still
# anchors winners at exact-1.00.
# A/B: 10 fixed dissertation queries, old provider vs new (flip env var), save side-by-side.
```
**STOP for user sign-off** (this changes citation-evidence selection).

---

## Phase 4 — archon: reranker

**Files:** `crates/archon-docs/src/rerank.rs` (trait exists), new `rerank_http.rs`,
`crates/archon-docs/src/retrieval.rs` (`fuse_results`, line ~366),
`crates/archon-evidence/src/lib.rs` (`discover`), `crates/archon-policy` (config keys).

Steps:
1. Implement `HttpReranker` (reqwest, blocking or async matching surrounding code) for
   `POST /v1/rerank`; `backend_name() = "wraith-bge-reranker-v2-m3"`. Timeout 8s; on error
   return an Err that callers treat as "skip rerank" (log once).
2. Policy config: `[policy.docs.rerank] enabled=false, url="http://192.168.50.22:8100/v1/rerank", top_n, candidate_multiplier=3` — mirror how `[policy.docs.retrieval]` keys are parsed in
   `archon-policy/src/models.rs` + `loader/loader_docs.rs`. Default OFF; enable in the local
   `config.toml`.
3. Wire point A — `retrieval.rs`: when enabled and mode is semantic/hybrid, widen the semantic
   pool (`top_k*3` already exists for hybrid; use it for the rerank pool), rerank the fused
   candidate list post-`fuse_results`, pre-truncate. Exact-shortcut path (score ≥ 0.75) skips
   rerank — leave it.
4. Wire point B — `archon-evidence::discover`: rerank the assembled pool (candidates carry
   `content`) BEFORE the owning-work boost and primary-quota logic, so boosts/quotas apply on
   top of cross-encoder ordering (mirrors the god-agent ordering constraint).
5. Do not touch quote_verify, pack assembly, or archon-draft.

Acceptance: `cargo build` + `cargo test -p archon-docs -p archon-evidence` green (build with
`LIBCLANG_PATH=/usr/lib/llvm-18/lib` if bindgen complains — known requirement); rerank-off output
byte-identical to Phase 3 behavior; rerank-on A/B over the same 10 queries saved for review;
WRAITH-down degradation test (skip + warn, no failure). **STOP for sign-off.**

---

## Phase 5 — evaluation harness (proves the whole thing was worth it)

1. Build a small gold set: ~25 queries drawn from real Part II/III drafting needs, each with
   2–5 known-relevant chunk IDs (source them from existing citations in canonical drafts +
   compiled-index entries; the user should skim/approve the gold set — it's a judgment artifact).
   Store as `corpus/eval/retrieval-gold-v1.jsonl` (query, relevant_chunk_ids, notes).
2. Script `scripts/eval-retrieval.ts` (god-agent) and a matching `archon` invocation script:
   report Recall@5, Recall@10, MRR for each config: {old baseline, +query-fix, +rerank} (god-agent)
   and {768-local, 1536-remote, +rerank} (archon).
3. Output one markdown table per system to `tmp/retrieval-eval-<date>.md`.

Acceptance: table produced; reranked config ≥ baseline on MRR and Recall@5 in aggregate. If it
is NOT better, do not rationalize — report the numbers and stop; the user decides whether to
keep, tune (candidate pool size, reranker model), or revert.

---

## Phase 6 (optional, separate sign-off) — retire the 5090 embedding dance

Point god-agent's embedding traffic at WRAITH (`GOD_EMBEDDING_ENDPOINT`, plus the hardcoded
localhost call sites listed in Ground truth, plus `EMBED_URL` in `run_ingest_phase2.py` — make it
env-driven), which removes the `embedding-on-demand.sh` kill-vLLM-to-embed VRAM swap on the 5090.
Requires the Phase 0 parity check to have passed. ChromaDB stays local on :8001. Keep the local
:8000 server as documented fallback. Not started without explicit user approval.

---

## Risks / gotchas the implementer must respect

- **Never mix embedding spaces.** Any vector written with one model/dim must live in a
  provider-or-collection namespace distinct from the other. Archon does this by provider key;
  god-agent avoids it by not changing models at all.
- **Rerank scores replace, boosts stack after.** Both systems apply their domain boosts
  (canonical-term / owning-work / primary-quota) AFTER cross-encoder ordering.
- **Reranker down ≠ retrieval down.** Always degrade to current behavior.
- **Port 8100 only** on WRAITH; 8001/8002 are Marker. On the primary machine 8000/8001/8002 are
  embedder/Chroma/vLLM — don't reuse those numbers in docs or code comments for WRAITH services.
- **god-agent `/embed` stores as a side effect** — Phase 2 must not let query vectors leak into
  stored collections.
- Commits: WSL only, branch per repo, no push, user reviews evidence before any commit
  (standing workflow rules).
- If any file/line reference in this plan doesn't match reality, STOP and report — do not adapt
  silently.

## Explicitly out of scope
- Swapping god-agent to a different/bigger embedding model (forces full corpus re-embed; decide
  after Phase 5 numbers exist).
- LEANN index (`vector_db_leann`), AgentDB/DESC memory retrieval, KU edges, BM25 internals.
- Any Marker/OCR changes; any archon-draft/FCDP gauntlet changes.
- Fine-tuning embedder or reranker (candidate for a later phase using Lanham/gold-set data).
