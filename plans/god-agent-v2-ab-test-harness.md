# Plan: State-Isolated God-Agent v2 Clone for Revision Work

## Context

The god-agent system needs a major revision: integrating Lanham's *Analyzing Prose* framework as a new linguistic analysis layer, with corpus ingestion, KU extraction, style profile enhancements, and quality gauntlet changes (see `~/.claude/plans/drifting-inventing-map.md`).

This requires a state-isolated clone where code, databases, and vector storage can diverge freely without any risk to the original. Only one environment runs at a time — the clone shares the inference services (vLLM, embedding API) with the original, but never concurrently.

**Isolation model: state-isolated, single-active-at-a-time.**

- **Separate (stateful)**: git repo, `.god-agent-v2/` SQLite DBs, `.agentdb-v2/` (SoNA/trajectories), ChromaDB data directory, daemon/UCM/memory sockets.
- **Shared (stateless)**: vLLM (port 8002), embedding API (port 8000). Safe to share because: (1) only one environment is active at a time, eliminating contention; (2) the Lanham revision does not touch the embedding model — Phase A explicitly consumes `localhost:8000` with 1536-D vectors unchanged; (3) vLLM is used for coding/OCR, not the academic writing path being revised.

A/B test harness and benchmark protocol will be designed separately after the revision stabilizes.

---

## Step 1 — Shallow clone, exclude backups (~147GB saved)
```bash
git clone --depth 1 --no-checkout --branch writing-pipeline-v2 \
  file:///home/dalton/projects/claudeflow-testing \
  ~/projects/god-agent-v2

cd ~/projects/god-agent-v2
git sparse-checkout init --no-cone
git sparse-checkout set '/*' '!backups/' '!.backups/'
git checkout writing-pipeline-v2
```
Result: ~34GB working copy, fully independent git repo.

## Step 2 — Copy `.env`, install dependencies
```bash
cp /home/dalton/projects/claudeflow-testing/.env ~/projects/god-agent-v2/.env
cd ~/projects/god-agent-v2 && npm install
```

## Step 3 — Isolate all stateful paths
Append to `~/projects/god-agent-v2/.env`:
```env
# === v2 isolation overrides ===
GOD_STORAGE_DIR=.god-agent-v2
GOD_DAEMON_SOCKET=/tmp/godagent-db-v2.sock
GOD_UCM_SOCKET=/tmp/godagent-ucm-v2.sock
GOD_MEMORY_SOCKET=/tmp/god-agent-memory-v2.sock
GOD_AGENTDB_PATH=.agentdb-v2
GOD_LEARNING_DB=.god-agent-v2/learning.db
GOD_DESC_DB=.god-agent-v2/desc.db
CHROMA_PORT=8003
CHROMA_URL=http://localhost:8003
```

Copy seed state so v2 starts with identical learned knowledge:
```bash
cd ~/projects/god-agent-v2
cp -r .god-agent .god-agent-v2
cp -r .agentdb .agentdb-v2
```

**Explicit pathing is mandatory.** In a system with DESC injection, trajectory capture hooks, event storage, and daemon-managed context, implicit CWD-relative resolution is too fragile. Every known state path must be set explicitly.

### Isolation boundaries
| Resource | v1 (original) | v2 (clone) | Isolation | Notes |
|----------|---------------|------------|-----------|-------|
| vLLM (8002) | Shared | Shared | Service-shared | Stateless inference; single-active-at-a-time eliminates contention |
| Embedding API (8000) | Shared | Shared | Service-shared | Stateless inference; Lanham revision does not change embedding model/config |
| ChromaDB data | `vector_db_1536/` | **own `vector_db_1536/`** | **State-isolated** | v2 can reingest freely; separate data directory per clone |
| ChromaDB port | 8001 | **8003** | **Port-isolated** | Required wiring in `api-embed.sh` and `SmartRetrievalLayer` |
| `.god-agent/` SQLite DBs | `.god-agent/` | **`.god-agent-v2/`** | **State-isolated** | learning.db, desc.db, events.db diverge independently |
| `.agentdb/` (SoNA, trajectories) | `.agentdb/` | **`.agentdb-v2/`** | **State-isolated** | SoNA weights + trajectory bins are write-heavy |
| Daemon/UCM/Memory sockets | Default paths | **`*-v2.sock`** | **Socket-isolated** | No IPC collision |

### ChromaDB isolation detail

The original ChromaDB runs on port 8001, launched by `embedding-api/api-embed.sh` with data in `$PROJECT_DIR/vector_db_1536/`. The v2 clone gets its own ChromaDB instance on port 8003 with its own data directory. This requires three wiring points:

1. **`api-embed.sh`** (required change) — reads `$PROJECT_DIR` from its own location, so the clone's copy already points at the clone's `vector_db_1536/`. The port is hardcoded to 8001 on line 95; parameterize it:
   ```bash
   # line 95: change from:
   nohup "$VENV_BIN/chroma" run --path "$DB_DIR" --port 8001 --host 127.0.0.1 > "$CHROMA_LOG" 2>&1 &
   # to:
   nohup "$VENV_BIN/chroma" run --path "$DB_DIR" --port ${CHROMA_PORT:-8001} --host 127.0.0.1 > "$CHROMA_LOG" 2>&1 &
   ```

2. **`SmartRetrievalLayer`** (required change) — constructed with no config in `universal-agent.ts:929`, defaults to port 8001. Wire `CHROMA_PORT` from env into the constructor:
   ```typescript
   // in universal-agent.ts, where SmartRetrievalLayer is constructed:
   this.smartRetrieval = new SmartRetrievalLayer({
     chromadb: { port: parseInt(process.env.CHROMA_PORT || '8001', 10) }
   });
   ```

3. **`icp-api-routes.ts`** — already reads `process.env.CHROMA_URL`, so setting `CHROMA_URL=http://localhost:8003` in `.env` handles this. No code change needed.

### Why shared embedding API is safe for this revision

The Lanham integration plan (Phase A) explicitly consumes the embedding API as-is: `embed chunks via localhost:8000 (1536-D)`. No phase in the 10-phase plan changes the embedding model, dimensionality, tokenization, or preprocessing. The revision operates entirely above the embedding layer — new KU extraction, style dimensions, quality gauntlet stages, prompt building, and a new Prose Analyst agent.

If a future revision changes the embedding model or its configuration, a separate embedding API instance would become mandatory to prevent vector incompatibility in ChromaDB. For the Lanham revision, this is not a concern.

## Step 4 — Rename remote
```bash
cd ~/projects/god-agent-v2
git remote rename origin source
```

## Step 5 — Operational workflow

Only one environment runs at a time. To switch between original and v2:

**Start v2 (from stopped state):**
```bash
cd ~/projects/god-agent-v2
CHROMA_PORT=8003 ./embedding-api/api-embed.sh start   # v2 ChromaDB on 8003 + shared embedding API on 8000
./scripts/god-launch start                              # v2 daemon/UCM/memory using .env overrides
```

**Stop v2, return to original:**
```bash
cd ~/projects/god-agent-v2
./scripts/god-launch stop
./embedding-api/api-embed.sh stop

cd ~/projects/claudeflow-testing
./embedding-api/api-embed.sh start                      # original ChromaDB on 8001
./scripts/god-launch start
```

The embedding API (port 8000) is stateless and shared — whichever environment starts it, both can use it. ChromaDB is the component that must point at the correct data directory, which `api-embed.sh` handles via `$PROJECT_DIR`.

## Verification
1. **Clone size**: `du -sh ~/projects/god-agent-v2` — ~34GB; `ls ~/projects/god-agent-v2/backups/` fails (excluded)
2. **Database isolation**: `.god-agent-v2/` and `.agentdb-v2/` exist with separate DB files
3. **ChromaDB isolation**: after starting v2, `curl http://127.0.0.1:8003/api/v1/heartbeat` responds; port 8001 is not running
4. **Socket isolation**: v2 daemon/UCM/memory sockets use `-v2.sock` paths, no collision with original
5. **Ingestion independence**: running ingestion scripts in v2 mutates only v2's ChromaDB (port 8003) and v2's databases
6. **Git independence**: `git remote -v` in v2 shows `source` (not `origin`), pointing at the original repo as a read-only reference

## Files Modified in v2 Clone
| File | Change | Required |
|------|--------|----------|
| `.env` | Appended v2 isolation overrides (storage dirs, sockets, ChromaDB port) | Yes |
| `src/god-agent/universal/universal-agent.ts` | SmartRetrievalLayer constructor reads `CHROMA_PORT` from env | Yes |
| `embedding-api/api-embed.sh` | Parameterize ChromaDB port via `${CHROMA_PORT:-8001}` | Yes |

No files in the original repo are modified.

---

## Future: A/B Test Harness
Once the v2 revision stabilizes, a test harness will be built to run identical prompts through both systems and compare quality, retrieval, cost, and latency metrics across multiple trials. This includes cache-state-aware benchmarking (cold vs warm latency reported separately with observable validation). Design deferred until revision work is complete.
