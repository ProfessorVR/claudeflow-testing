# wraith-infer

GPU inference service for the **WRAITH** box (2× RTX 3090, `192.168.50.22`, WSL2). Serves
embeddings **and** reranking from one FastAPI process on **port 8100**.

- **Embeddings** — `Alibaba-NLP/gte-Qwen2-1.5B-instruct`, 1536-dim, normalized. Parity-identical
  to the primary box's `embedding-api/api_embedder.py` so both boxes share one embedding space.
- **Reranker** — `BAAI/bge-reranker-v2-m3` cross-encoder, scores as `sigmoid(logit)` ∈ [0, 1].

> Port 8100 is deliberate. On WRAITH, 8001/8002 are Marker OCR. On the primary box, 8000/8001/8002
> are embedder/Chroma/vLLM. Do **not** reuse those numbers.

## API

| Method | Path | Shape |
|---|---|---|
| `GET`  | `/health` | `{status, models: {embedding: {name, dim}, reranker: {name}}, device}` |
| `POST` | `/v1/embeddings` | OpenAI-compatible: `{model, input: string[], kind?: "query"\|"document"}` → `{object, data: [{object, index, embedding}], model, usage}`. `kind` defaults to `"document"`; `"query"` applies gte-Qwen2's query instruction prompt. |
| `POST` | `/v1/rerank` | Jina/Cohere-style: `{model, query, documents: string[], top_n?}` → `{model, results: [{index, relevance_score}]}` sorted desc. |

Archon's existing `OpenAiCompatEmbeddingProvider` speaks `/v1/embeddings` with zero Rust changes
to the provider itself (base URL `http://192.168.50.22:8100/v1`).

## Deploy to WRAITH

Run these **on the WRAITH box, inside WSL2**. (No `wraith` alias exists in `~/.ssh/config` on the
primary box yet — add one, or run these directly at the WRAITH terminal.)

```bash
# 1. Copy this directory to WRAITH, e.g.:
#    rsync -av services/wraith-infer/ wraith:/opt/wraith-infer/
# 2. Check which GPU Marker uses so wraith-infer can pin to the OTHER one:
nvidia-smi
# 3. First-time CUDA torch install (match WRAITH's driver, cu121 shown):
cd /opt/wraith-infer
python3 -m venv .venv && source .venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
# 4. Launch, pinning to the non-Marker GPU (WRAITH_GPU=0 or 1 per step 2):
WRAITH_GPU=0 ./run.sh
```

`run.sh` creates the venv on first run and installs `requirements.txt`. Set `WRAITH_GPU` to the
GPU index Marker does **not** use.

### Windows host: expose 8100 (WSL2 → LAN)

WSL2 runs on an internal NAT, so the Windows host must forward 8100 to the WSL instance and open
the firewall — same pattern as the existing 8001/8002 Marker rules. Run in an **Administrator
PowerShell on the WRAITH Windows host**:

```powershell
# WSL instance IP (changes across WSL reboots — see keepalive note):
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]

netsh interface portproxy add v4tov4 listenport=8100 listenaddress=0.0.0.0 `
  connectport=8100 connectaddress=$wslIp
netsh advfirewall firewall add rule name="wraith-infer 8100" dir=in action=allow `
  protocol=TCP localport=8100

# verify:
netsh interface portproxy show v4tov4
```

> The WSL IP can change on reboot. If you already have a Task Scheduler startup script that
> refreshes the 8001/8002 portproxy rules on boot, add the 8100 rule there too (delete + re-add
> with the fresh `$wslIp`). Otherwise re-run the `portproxy add` after a WSL restart.

## Acceptance (Phase 0)

Run from the **primary box** once the service is up and 8100 is reachable:

```bash
curl -s http://192.168.50.22:8100/health
python services/wraith-infer/smoke_test.py   # requires: pip install requests numpy
```

`smoke_test.py` checks: health (dim 1536 + cuda), embedding parity vs local `:8000` (cosine
> 0.999), query-kind ≠ document-kind, rerank on-topic-first, and throughput (1000 rerank pairs
< 30s, 1000-doc embed < 60s).

## Notes

- **No storage side effects.** Unlike `api_embedder.py`'s `/embed`, this service never writes to a
  vector DB — pure inference.
- Tunables via env: `WRAITH_EMBED_BATCH` (32), `WRAITH_RERANK_BATCH` (64),
  `WRAITH_RERANK_MAX_LENGTH` (1024), `WRAITH_MAX_SEQ_LENGTH` (8192), `WRAITH_INFER_PORT` (8100),
  `WRAITH_GPU` (CUDA device index), `WRAITH_DEVICE` (`cuda`).
