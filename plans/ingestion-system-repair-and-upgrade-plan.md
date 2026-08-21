# Ingestion System — Repair and Upgrade Plan
_Compiled 2026-06-27 from diagnostic session_

---

## Context

This plan consolidates findings from three parallel investigations:

1. **Marker server diagnostic** — why `--marker` mode was silently doing nothing
2. **Archon `ingest-extensions.md` analysis** — what the Rust port improved over the Python reference
3. **Python pipeline audit** — bugs uncovered by comparing the two

The plan is sequenced so each phase leaves the system in a working state. Nothing in Phase 2+ is a prerequisite for running the current `new_media` ingestion.

---

## Current State Snapshot

| Item | Status |
|------|--------|
| WRAITH (192.168.50.22) | ✓ Online and reachable |
| Marker on WRAITH:8001 | ✓ Running (one GPU; :8002 is dead) |
| `MARKER_URL` in `.env` | ✗ Not set — falls back to dead `10.0.0.2:8001` |
| `MARKER_ENABLED` in `.env` | ✗ Not set — defaults to `false` |
| `_init_marker_pool()` | ✗ Pool construction bug (ignores actual port) |
| marker-pdf local install | ✗ Not installed anywhere |
| god-launch Marker service | ✗ No entry |
| `verify_ingest.py` chunk count | ✗ Looks for wrong manifest keys |
| Bekker regex in Python pipeline | ✗ 3-digit cap + optional letter — misses `1147a` etc. |
| Table false-positive handling | ⚠ Possible silent drop (unconfirmed) |
| new_media ingestion (40 PDFs) | 37 unprocessed, 1 needs re-ingest (Wendt), 2 skip |

---

## Phase 1 — Restore Marker (WRAITH) [Minimal, ~30 min]

This is the only phase required before running the `new_media` ingestion with full Marker quality.

### 1a. Fix `.env`

Add two lines to `.env`:

```bash
MARKER_URL=http://192.168.50.22:8001
MARKER_ENABLED=true
```

**Why**: The code default is `http://10.0.0.2:8001` which is a dead address (100% packet loss confirmed). `MARKER_ENABLED` defaults to `false`, meaning Marker is never invoked even with a correct URL unless `--marker` is passed per-run. Setting it in `.env` makes it the persistent default.

### 1b. Fix `_init_marker_pool()` — pool construction bug

**File**: `scripts/ingest/run_ingest_phase2.py:127–133`
**File**: `scripts/ingest/parallel_ingest.py` (same logic, same fix needed)

**Current (broken)**:
```python
def _init_marker_pool():
    global MARKER_URLS, _marker_url_cycle
    import itertools
    if not MARKER_URLS:
        base = MARKER_URL.rsplit(":", 1)[0]   # strips port
        MARKER_URLS = [f"{base}:8001", f"{base}:8002"]   # hardcodes :8001/:8002
    _marker_url_cycle = itertools.cycle(MARKER_URLS)
```

**Problem A (WRAITH)**: With `MARKER_URL=http://192.168.50.22:8001`, pool becomes
`[192.168.50.22:8001, 192.168.50.22:8002]`. Port :8002 is dead on WRAITH, so half of
all round-robin Marker calls fail or time out before falling back to PyMuPDF.

**Problem B (local fallback)**: With `MARKER_URL=http://127.0.0.1:8003`, pool becomes
`[127.0.0.1:8001, 127.0.0.1:8002]` — hitting ChromaDB and vLLM with PDF upload requests.
Hard failure, not graceful degradation.

**Fix**:
```python
def _init_marker_pool():
    global MARKER_URLS, _marker_url_cycle
    import itertools
    if not MARKER_URLS:
        host = MARKER_URL.split("://", 1)[-1].split(":")[0]
        if host in ("127.0.0.1", "localhost", "::1"):
            # Local single-server: use URL exactly as given
            MARKER_URLS = [MARKER_URL]
        else:
            # Remote: probe both GPU ports; include only ones that respond
            base = MARKER_URL.rsplit(":", 1)[0]
            candidates = [f"{base}:8001", f"{base}:8002"]
            import requests
            alive = []
            for url in candidates:
                try:
                    r = requests.get(f"{url}/", timeout=3)
                    if r.status_code == 200:
                        alive.append(url)
                except Exception:
                    pass
            MARKER_URLS = alive if alive else [MARKER_URL]
    _marker_url_cycle = itertools.cycle(MARKER_URLS)
```

This makes the pool self-healing: WRAITH with one live GPU gets a single-entry pool;
two live GPUs get two entries; local always uses exactly the configured URL.

### 1c. Run new_media ingestion

Once 1a and 1b are done:

```bash
python3 scripts/ingest/run_ingest_phase2.py --root corpus/new_media
```

- Calleja and Fink will be skipped (phase=2, sha match)
- Wendt will be re-ingested (phase=None → gets embedded)
- 37 remaining PDFs will be processed with Marker extraction

---

## Phase 2 — Local Marker Fallback [~1 hour]

When WRAITH is offline, the pipeline currently falls back silently to PyMuPDF → pdftotext.
This phase makes local Marker a first-class option with its own managed service.

### 2a. Install marker-pdf in an isolated venv

Installing into `~/.venv` (the shared ingest venv) would:
- Downgrade `anthropic` 0.75.0 → 0.46.0 (breaks god-agent Anthropic API calls)
- Upgrade `tokenizers` 0.20.3 → 0.22.2 (potential vLLM compatibility risk)

**Fix**: dedicated `~/.venv-marker`:

```bash
python3.11 -m venv ~/.venv-marker --prompt marker
~/.venv-marker/bin/pip install marker-pdf
```

The ingest scripts communicate with Marker over HTTP only — no shared Python environment needed.

### 2b. Choose port for local Marker

Occupied ports:
- `:8000` — Embedding API
- `:8001` — ChromaDB
- `:8002` — vLLM (Qwen2.5-Coder-32B-AWQ)

**Use `:8003`** for local Marker.

Start command:
```bash
~/.venv-marker/bin/marker_server --port 8003
```

### 2c. Add Marker startup to god-launch

`scripts/god-launch.d/start.sh` needs a `start_marker()` function that:
- Starts only when `MARKER_LOCAL_ENABLED=true` in `.env` (separate flag from `MARKER_ENABLED`)
- Runs `~/.venv-marker/bin/marker_server --port 8003` in its own tmux window
- Writes pid to `.run/marker.pid`
- Waits for `http://127.0.0.1:8003/` to return 200 before marking ready

### 2d. Auto-detect WRAITH vs local

The ingest scripts should attempt WRAITH first and fall back to local if unreachable.
Add a pre-flight check function:

```python
def resolve_marker_url() -> str:
    """Try WRAITH first, then local fallback."""
    remote = os.environ.get("MARKER_URL_REMOTE", "http://192.168.50.22:8001")
    local  = os.environ.get("MARKER_URL_LOCAL",  "http://127.0.0.1:8003")
    for url in [remote, local]:
        try:
            r = requests.get(f"{url}/", timeout=3)
            if r.status_code == 200:
                return url
        except Exception:
            pass
    return remote  # let the normal failure path handle it
```

Call this at startup instead of reading `MARKER_URL` directly. Keep `MARKER_URL` as
a manual override that skips the probe if set explicitly.

---

## Phase 3 — Python Pipeline Bug Fixes [~2 hours]

These bugs were identified by diffing the Python reference against the Archon Rust port.
They affect correctness of all current and future ingestions, independent of Marker.

### 3a. Fix Bekker regex in `clean_corpus_text()`

**File**: `scripts/ingest/run_ingest_phase2.py` — the `_BEKKER_RE` pattern used in `clean_corpus_text()`

**Bug**: Python pattern caps at 3 leading digits and makes the column letter optional.
This misses 4-digit Bekker numbers (`1147a`, `1095b`, `1139b`) and conflates bare
integers with page numbers.

**Fix** (matches Archon's validated regex):
```python
# OLD — misses 4-digit Bekker, optional letter conflates with page numbers
_BEKKER_RE = re.compile(r'\b\d{2,3}[a-b]?\d{0,2}\b')

# NEW — requires column letter, allows 1–4 leading digits
_BEKKER_RE = re.compile(r'\b\d{1,4}[ab]\d{0,3}\s*\b')
```

**Scope**: affects the layout-stripping step in `clean_corpus_text()` AND the
Scholarly Fidelity Gate's `bekker` check in `scholarly_fidelity_gate.py` (separate
pattern there — fix both).

### 3b. Verify table false-positive handling

**File**: `scripts/ingest/table_extractor.py`

Archon's port documents that rejected tables must fall back to `Text`, not be silently
dropped. Audit `table_extractor.py` to confirm:
- What happens when `is_real_table()` returns False for a `Table` block from Marker
- Whether the stripped text is preserved as a Text block or discarded

If content is being dropped, add the Text fallback to match the Archon behavior.

Add the missing scholarly title markers to the rejection list:
```python
SCHOLARLY_TITLE_MARKERS = {
    "complete works", "revised oxford", "copyright", "isbn", "published by",
    "university press", "all rights reserved", "table of contents",
    "editors' introduction", "princeton university", "bollingen series",
}
```

### 3c. Fix `verify_ingest.py` chunk count validation

**File**: `scripts/ingest/verify_ingest.py:74–80` — `get_chunk_count_from_manifest()`

**Bug**: The function checks for keys `chunk_count`, `num_chunks`, `chunks_total`,
and `chunks` as a list. The manifest actually stores chunk count as an **integer**
under `"chunks"`. Chunk-count cross-validation is silently skipped for every record.

**Fix**:
```python
def get_chunk_count_from_manifest(rec):
    # Manifest stores count as int under "chunks"
    chunks = rec.get("chunks")
    if isinstance(chunks, int):
        return chunks
    # Legacy aliases
    for k in ("chunk_count", "num_chunks", "chunks_total"):
        v = rec.get(k)
        if isinstance(v, int):
            return v
    if isinstance(chunks, list):
        return len(chunks)
    return None
```

---

## Phase 4 — Archon Capability Backports [longer-term]

These are improvements from `archon-ingest-ext` that are not yet in the Python pipeline.
They represent real capability gaps, not just code-quality issues.

### 4a. Layout locator — capture Bekker/page anchors instead of discarding

**Current behavior**: `clean_corpus_text()` strips Bekker numbers and page numbers and
throws them away.

**Archon behavior**: `layout::extract_locators()` captures them as `LocatorHit` objects
(page, kind, value, bbox) and feeds them to the verbatim-provenance subsystem as citation
anchors.

**What to build**: A Python equivalent that, rather than discarding locators during
text cleaning, emits them into a per-chunk `locators` metadata field stored in Chroma.
This directly enables the verbatim subsystem to resolve `"1147a13"` → specific PDF page
→ specific bbox → rendered citation overlay.

This is the "V-0 satellites" referenced in the Archon port notes. It is the highest-value
capability gap in the current Python pipeline.

### 4b. Chunk-level SHA-256 deduplication

**Current**: file-level dedup via manifest (whole-file sha256 match → skip document).

**Archon**: chunk-level `sha256(content)` checked before insert → re-ingesting same file
produces zero new rows; partial corpus overlaps are handled correctly.

**What to build**: Before Chroma upsert, hash each chunk's cleaned text and check against
existing Chroma metadata (`clean_sha256` field already stored). Skip upsert if hash exists
with a different `doc_id` (cross-document dedup) or same `doc_id` but unchanged content.

### 4c. `[TABLE]` chunk serialization format

Archon serializes genuine tables into a `[TABLE]` header format:
```
[TABLE] Page 3, 4 rows × 2 columns
Source: <file> | Page 3

| Year | Count |
|---|---|
```

The Python pipeline stores table content as plain text within normal chunks. The structured
format makes table retrieval and citation significantly more reliable. Apply the same
serialization in `table_extractor.py` for `is_real_table()` passes.

---

## Phase 5 — Post-ingestion Verification [after each batch]

Run after any ingestion batch to confirm completeness and integrity.

### 5a. Cryptographic verification

```bash
python3 scripts/ingest/verify_ingest.py --root corpus/new_media
```

Per-PDF checks (after Phase 3c fix, chunk counts will also validate):
- Re-hash raw bytes → must match `manifest["sha256"]`
- `status == "ok"` and `phase >= 2`
- Chroma chunk count matches `manifest["chunks"]`
- 3 sample vectors confirmed 1536-dim

### 5b. BBox spot-check

```bash
# Get a chunk with bboxes from a newly-ingested doc
python3 -c "
import chromadb, json
c = chromadb.HttpClient(host='127.0.0.1', port=8001)
coll = c.get_or_create_collection('knowledge_chunks')
res = coll.get(where={'has_bboxes': True, 'collection': 'new_media'}, include=['metadatas'], limit=3)
for id_, m in zip(res['ids'], res['metadatas']):
    print(id_, m.get('path_rel','')[-40:], 'bboxes:', bool(m.get('bboxes')))
"
# Then render one:
python3 scripts/ingest/render_citation_bbox.py --chunk-id <id> --pdf <path> --output /tmp/bbox.png
```

### 5c. Compiled-index update

```bash
python3 scripts/compile-corpus-index.py
```

Registers new_media entries in `corpus/index/compiled-index.json` so LEANN search
and `/god-write` can retrieve them.

---

## Execution Order Summary

| Phase | What | Prerequisite | Time |
|-------|------|-------------|------|
| 1a | Fix `.env` (MARKER_URL + MARKER_ENABLED) | None | 2 min |
| 1b | Fix `_init_marker_pool()` in both ingest scripts | 1a | 20 min |
| 1c | Run new_media ingestion | 1a + 1b | ~30–60 min |
| 5a–c | Verify + index | 1c | 15 min |
| 3a | Fix Bekker regex | None | 15 min |
| 3b | Audit table false-positive handling | None | 30 min |
| 3c | Fix verify_ingest.py chunk count | None | 10 min |
| 2a–d | Local Marker fallback venv + god-launch | Phase 1 done | 1 hour |
| 4a | Layout locator / LocatorHit capture | Phase 3 done | several hours |
| 4b | Chunk-level SHA-256 dedup | Phase 3 done | 1–2 hours |
| 4c | `[TABLE]` chunk format | Phase 3b done | 1 hour |

Phases 1 → 5 → 3 → 2 → 4 is the recommended order.
Phases 3 and 2 are independent of each other and can be done in parallel.
Phase 4 items are non-blocking improvements — do not delay ingestion for them.
