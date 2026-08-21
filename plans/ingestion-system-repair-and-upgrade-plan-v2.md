# Ingestion System — Repair and Upgrade Plan **v2 (LOCAL-FIRST)**
_Compiled 2026-06-27. Supersedes `ingestion-system-repair-and-upgrade-plan.md` (v1, kept intact for reference)._
_Grounded in 14 independent verification/discovery agents + live re-confirmation by the orchestrator._

---

## Why v2

v1 was **WRAITH-first**: it treated remote Marker as the default and local Marker as a deferred "fallback." The user's actual goal is the inverse — **a rock-solid COMPLETE ingestion (chunk + file crypto-hash, bboxes, tables, images, locators) running on THIS PC first**, with WRAITH as an *optional accelerator* selected automatically and a clean, recorded DEGRADED mode when no Marker is reachable.

v2 also corrects multiple **factually wrong** v1 claims (verified against live code and services): WRAITH `:8002` is **alive**, the `.env` edit v1 leads with is a **no-op** for the ingest scripts, the "broken Bekker regex" v1 patches **does not exist**, the "silent table drop" is **not a drop**, and several "missing" items are **already implemented**.

---

## Corrections to v1

Each row cites `file:line`. Severity reflects impact on the user's local-first COMPLETE-ingestion goal.

| # | v1 claim (where) | Verdict | Corrected reality (evidence) | Severity |
|---|---|---|---|---|
| C1 | "Marker on WRAITH:8001 — Running (one GPU; **:8002 is dead**)" (v1:23); Phase 1b "Problem A: half of round-robin Marker calls fail" (v1:67-70) | **WRONG/STALE** | Both WRAITH ports are live: `curl http://192.168.50.22:8001/` → 200 and `:8002/` → 200 (re-confirmed now). Their `openapi.json` is byte-identical. The dual-GPU pool `[base:8001, base:8002]` is **correct** for WRAITH. "Problem A" does not exist; delete it. | high |
| C2 | Phase 1a: "Add `MARKER_URL`/`MARKER_ENABLED` to `.env` … makes it the persistent default" (v1:40-49); Phase 1c runs `python3 scripts/ingest/run_ingest_phase2.py …` (v1:110) | **WRONG** | Neither `run_ingest_phase2.py` nor `parallel_ingest.py` loads `.env` (no `dotenv`/`load_dotenv` anywhere). Config is read only via `os.environ.get` at import (`run_ingest_phase2.py:117-119`). No wrapper sources `.env` (no Makefile; `god_learn.py:338` and `watch_corpus.py:149` call the script as a subprocess **without** `env=` or sourcing). Editing `.env` has **zero** effect → `MARKER_URL` stays the dead default `http://10.0.0.2:8001`, `MARKER_ENABLED` stays `false`. **The whole v1 Phase 1 is inert as written.** | blocker |
| C3 | Phase 1b "Problem B": local `127.0.0.1:8003` → "**hitting ChromaDB and vLLM with PDF upload requests. Hard failure**" (v1:71-73) | **PARTIALLY_WRONG** | The *symptom* is wrong: `_init_marker_pool` rewrites the port to `:8001/:8002` (`run_ingest_phase2.py:131-132`), then the startup probe `GET {url}/` (`:960-976`) rejects both (404≠200) and silently falls to **pdftotext**. No PDF is ever POSTed to Chroma/vLLM. The *core* claim (local `:8003` can never be selected as-is) is **correct and is the real blocker** for local-first. | high |
| C4 | Phase 1b "Fix" is sufficient to make Marker work (v1:102-103) | **PARTIALLY_WRONG** | The localhost special-case is correct but incomplete. It does not touch `run_marker_extract` (`:365-400`, hardcodes global `MARKER_URL` at `:377`, called at `:1150/1153/1248/1322`), depends on `.env` reaching the process (it does not — C2), and re-probes redundantly with the existing `:960-976` probe. Selection is fixed but four uncoordinated selection mechanisms remain. | high |
| C5 | Phase 2d `resolve_marker_url()` returns a single URL, **WRAITH-then-local** order (v1:166-182) | **PARTIALLY_WRONG** | (a) Order is WRAITH-first — **inverts** local-first. (b) Returns a scalar that `_init_marker_pool` then **re-expands** to `:8001/:8002`, re-breaking local. (c) "manual override if set explicitly" is unimplementable via `os.environ.get(default)` — needs `'MARKER_URL' in os.environ`. (d) Probes only remote `:8001`, discarding the 2nd GPU. Replace with a local-first resolver returning a **probed pool list**. | high |
| C6 | Phase 2a/2b: "WRAITH is a **custom server API**, likely NOT stock marker-pdf"; install marker-pdf and run `marker_server` (implicitly assumed compatible) | **WRONG (and good news)** | WRAITH **is stock marker-pdf** (FastAPI, `openapi.json` operationId `convert_pdf_upload_marker_upload_post`; response `{format, output, images, metadata, success}`; `output` is a JSON string for `output_format=json`; root HTML byte-identical to `marker.scripts.server`). The ingest client (`run_ingest_phase2.py:344-357`) was written against stock. ⇒ A **stock local `marker_server` is a drop-in** — no shim, no dual-schema needed. (Caveat: no agent POST-uploaded live, so the response *body* must be confirmed by a one-PDF acceptance test.) | high |
| C7 | Phase 3a: broken `_BEKKER_RE = re.compile(r'\b\d{2,3}[a-b]?\d{0,2}\b')` in `run_ingest_phase2.py`'s `clean_corpus_text()`; replace with `\b\d{1,4}[ab]\d{0,3}\s*\b` (v1:193-206) | **WRONG** | **No `_BEKKER_RE` exists** in `run_ingest_phase2.py` (grep: 0 hits). Cleaning uses `_LOCATOR_RE` (`:469-478`), line-anchored `^…$`, Bekker branch `[0-9]{2,4}[ab][0-9]*` which **already matches** `1147a/1095b/1139b`. The v1 regex is a fabrication. Worse, the v1 replacement is **dangerous**: it is unanchored `\b…\b` with no `$`, used by `.match()` at `:519`, so any prose line *beginning* with a Bekker ref would be deleted. **Do not touch `_LOCATOR_RE`.** | blocker (if applied) |
| C8 | Phase 3a (real target) "fix both" — the only genuinely weak pattern | **CONFIRMED (mislocated)** | The real weak regex is `scholarly_fidelity_gate.py:28 BEKKER_RE = \b\d{3,4}[ab]\d{1,2}\b` — requires 3-4 leading **and** 1-2 trailing digits, so it misses bare `1147a/1095b/403b/12a`. It feeds only `_count_matches` (a symmetric pdftotext-vs-Marker scoring heuristic, threshold 0.5) — it never strips/rewrites text, so impact is **low**. Fix → `\b\d{2,4}[ab]\d{0,2}\b`. | low (real) |
| C9 | Phase 3b: "Table false-positive handling — **possible silent drop**" (v1:31, 218-221) | **WRONG** | No content drop. `_is_real_table()` only gates whether a camelot/PyMuPDF candidate is **appended** (`table_extractor.py:382/459`); table extraction is an **additive** side pass — the prose stream is built independently first (`run_ingest_phase2.py:1330-1338`/`:1175-1205`). Rejected tables lose only structured representation, never text. Also `_is_real_table` **never sees Marker blocks** (camelot is bypassed when Marker wins, `:1343-1346`). | medium |
| C10 | Phase 3b: "Add the missing `SCHOLARLY_TITLE_MARKERS` to the rejection list" (v1:223-230) | **STALE** | All 11 markers are **already present** verbatim as a local list inside `_is_real_table()` (`table_extractor.py:235-238`). No-op. (Optional: hoist to a module constant for testability.) | low |
| C11 | Phase 4c: "Python pipeline stores table content as plain text … apply `[TABLE]` in `table_extractor.py`" (v1:303-305) | **PARTIALLY_WRONG** | The camelot path **already** emits `[TABLE] Page N, R rows × C columns` + markdown (`table_extractor.py:308-331`); only the `Source: … | Page N` line is missing. The **real** structure-loss is on the **Marker** path: `markdown_chunker._extract_text_from_html` bare-strips `<table>` via `re.sub(r'<[^>]+>','',html)` (`:247`), flattening rows/cols into prose. That is the dominant path (camelot bypassed under Marker). Re-target 4c to `markdown_chunker`. | high (real) |
| C12 | Phase 3c: `verify_ingest.py` reads wrong manifest key for chunk count (v1:232-255) | **CONFIRMED** | `get_chunk_count_from_manifest` (`verify_ingest.py:71-79`) checks int aliases then `chunks` only as a **list**; manifest stores `chunks` as **int** (all 937 records). Returns `None` ⇒ exact-count comparison (`:222-225`) is **dead**; control falls to `chroma_n<=0` presence check (`:216-221`), so a partial-ingest (e.g. 10 of 53 chunks) **passes**. v1's fix is correct. Apply it. | high |
| C13 | Phase 4b: "chunk-level SHA-256 dedup not implemented; backport a query-before-upsert hash skip" (v1:281-290) | **CONFIRMED premise, WRONG remedy** | `clean_sha256` is computed+stored (`run_ingest_phase2.py:1626/1647`) but **never read** — true. But v1's proposed *cross-document* hash-skip is **harmful**: the live corpus legitimately stores the same book at two paths (e.g. Aristotle Metaphysics under two doc_ids); skipping the 2nd insert mis-attributes its chunks' path/page/bbox. Reframe 4b as **re-ingest idempotency** (id-stable + delete-by-doc_id), not content dedup. | high |
| C14 | Snapshot: "new_media ingestion (40 PDFs)" (v1:32) | **CONFIRMED off-by-one** | `ls corpus/new_media/*.pdf | wc -l` → **41**. | nit |
| C15 | Snapshot: "37 unprocessed, 1 re-ingest (Wendt), 2 skip" (v1:32); Phase 1c "Calleja/Fink skipped, Wendt re-ingested" (v1:113-115) | **MISLEADING** | The **entire** corpus is already 100% DEGRADED (no doc has ever been ingested in FULL/bbox mode: `extraction_method` distribution `{NONE:643, text:253, layout_aware:27, pdftotext:10, ocr:2}`; zero `marker+bbox`). And `should_skip_phase2` (`:270-280`) skips on sha+status+phase only — it is **not fidelity-aware**, so degraded docs will be **SKIPPED** when Marker returns unless made fidelity-aware (see Phase 4). | high |

---

## Verified Current-State Snapshot (live, re-confirmed)

| Item | Live state | Source |
|------|-----------|--------|
| WRAITH `192.168.50.22:8001` | **200, stock marker-pdf** | `curl` 200; `openapi.json` |
| WRAITH `192.168.50.22:8002` | **200, alive** (v1 "dead" is wrong) | `curl` 200 |
| WRAITH alt `10.0.0.2:8001` | **DEAD** (100% loss) — and it is the **code default** `MARKER_URL` | `run_ingest_phase2.py:117` |
| Local `:8000` Embedding | 200 (`/embed` → `dims:1536`, `backend:local`) — **also writes** to its own `local_vectors_1536` (153,919 rows) on every call | `curl`; finding |
| Local `:8001` ChromaDB | 200 on v2 (`404` on `/`); collection `knowledge_chunks` = 6,231 chunks; `has_bboxes=True` on 3,008 | `curl`; client probe |
| Local `:8002` vLLM | 200 on model routes (`404` on `/`); Qwen2.5-Coder-32B-AWQ, `--gpu-memory-utilization 0.85` | `ps`; `curl` |
| Local `:8003` (Marker) | **NOT listening** (free) | `curl` → 000 |
| GPU | RTX 5090 (Blackwell sm_120), 32,607 MiB total; **~20.4 GiB used by vLLM**; **~11.7-12 GiB free**. torch's 30 GiB "free" under WSL2 is a mirage — size to nvidia-smi free | `nvidia-smi` |
| `.env` (235 B) | only `PERPLEXITY_API_KEY`, `VLLM_BASE_URL`, `ANTHROPIC_API_KEY`; **no MARKER_***; **not loaded by any ingest script** | `cat .env`; grep |
| `~/.venv-marker` | exists (python3.11.9) but **EMPTY** — only pip/setuptools; **no marker-pdf, no `marker_server`** | `ls bin/` |
| `python-dotenv` | **1.1.0 installed** in both pyenv-3.11.9 (the actual ingest runtime via `.python-version`) and `~/.venv` | `pip show` |
| Ingest runtime | `python3` → pyenv shim → `3.11.9` (repo `.python-version`); all hard deps present (chromadb 1.4.0, fitz 1.26.7, requests, numpy, pdfplumber, camelot 1.0.9, torch cu128). **NOT `~/.venv`.** | `which python3` |
| `tesseract` binary | **MISSING** (pytesseract/pdf2image present); default OCR path errors on scanned PDFs → use `--disable-ocr` | `which tesseract` |
| `camelot` | installed in pyenv (1.0.9); in `~/.venv` it is **absent** → PyMuPDF table fallback | import test |
| bboxes / provenance | produced **ONLY** from Marker JSON (`run_ingest_phase2.py:1157-1200`, `:1663-1674`); pdftotext/PyMuPDF/layout/OCR set `has_bboxes=False`. **No non-Marker bbox path exists.** | code |
| `corpus/new_media` | **41 PDFs** | `ls | wc -l` |
| god-launch | **No Marker entry** (`SERVICES=(vllm embedding memory daemon ucm observe)`, `god-launch:86`); never sources `.env` | grep |

---

## Strategy: Local-First

**Primary goal:** a COMPLETE, rock-solid ingestion that runs on THIS PC with no network dependency, producing for every document: file-level crypto hash, per-chunk crypto hash, token-aware chunks, **bbox visual provenance**, structured tables, images, and **locator (Bekker/page) citation anchors**.

**WRAITH is an optional accelerator**, auto-selected only when reachable, with automatic graceful fallback to the local Marker — never the reverse, never a hard dependency.

**Two modes, precisely defined and recorded in the manifest:**

- **FULL** — a Marker server (local `:8003` *or* WRAITH) successfully returned JSON for the document. Guarantees: `has_bboxes=True` for bbox-bearing chunks, Marker tables/images/captions, the Scholarly Fidelity Gate ran, `extraction_method ∈ {marker+bbox, pdftotext+marker_tables}`. Manifest records `fidelity_mode="full"`, `marker_used=true`, `marker_url_used=<server>`, doc-level `has_bboxes`.
- **DEGRADED** — no Marker reachable; text via pdftotext/layout-aware/OCR. Guarantees: file + per-chunk crypto hashes, token-aware chunks, text. **Loses:** bboxes, Marker tables/images, the fidelity gate. Manifest records `fidelity_mode="degraded"`, `marker_used=false`, `has_bboxes=false`, and a `degrade_reason` (e.g. `marker_unreachable`).

**Mode policy (non-negotiable for "rock solid"):**
1. DEGRADED must **fail loud** when FULL was requested but no Marker resolved (a `--require-full` flag hard-exits; otherwise emit a WARNING + per-doc DEGRADED record — never a silent `status:ok`).
2. The skip logic must be **fidelity-aware**: a doc stored DEGRADED is **re-ingested in FULL** automatically when a Marker becomes reachable (no `--force` needed).
3. Re-ingest must be **idempotent**: replacing a doc deletes its prior chunks (no orphans), so a FULL upgrade does not coexist with stale DEGRADED chunks.

**The bbox truth:** because there is no non-Marker bbox path, "COMPLETE local ingestion" is *impossible* without a working local Marker. Therefore **standing up local Marker (Phases 1-3 below) is a prerequisite, not a deferred fallback.** Today the only working FULL path is WRAITH; the missing piece is local Marker, not a WRAITH fix.

---

## Phases (re-sequenced for local-first)

> Blockers first: env-loading (P0), pool resolver (P1), local Marker install + contract proof (P2). Then service management (P3), mode integrity (P4), verification (P5). Quality/capability backports (P6-P10) follow. Post-ingest verification commands are corrected in P11.

---

### Phase 0 — Make `.env` actually reach the ingest process [BLOCKER, ~10 min]

**Problem (C2):** `.env` is never loaded; `MARKER_*` never reach Python.

**Files:** `scripts/ingest/run_ingest_phase2.py` (top, before line 117); transitively fixes `parallel_ingest.py` (it imports the resolved MARKER constants from `run_ingest_phase2`, so a single `load_dotenv()` there runs first).

**Edit** — at the very top of `run_ingest_phase2.py`, after the stdlib imports and **before** the line-117 module constants:
```python
from pathlib import Path as _Path
try:
    from dotenv import load_dotenv
    # Load the project .env regardless of CWD (script lives in scripts/ingest/)
    load_dotenv(_Path(__file__).resolve().parents[2] / ".env")
except Exception:
    pass  # dotenv optional; explicit env / --marker-url still work
```
`python-dotenv 1.1.0` is already installed in the pyenv-3.11.9 runtime — no install needed.

**Also unify the dead default (C-cross):** change `run_ingest_phase2.py:117` away from `http://10.0.0.2:8001`. After Phase 1 introduces the resolver, this constant becomes only a manual override; set its fallback to empty and let the resolver decide:
```python
MARKER_URL = os.environ.get("MARKER_URL", "")   # was "http://10.0.0.2:8001" (dead)
```

**Prerequisite:** none.
**Acceptance test:**
```bash
cd /home/dalton/projects/claudeflow-testing
printf '\nMARKER_URL=http://example.invalid:9999\nMARKER_ENABLED=true\n' >> .env   # temporary
python3 -c "import sys; sys.path.insert(0,'scripts/ingest'); import run_ingest_phase2 as m; print('MARKER_URL=',m.MARKER_URL,'ENABLED=',m.MARKER_ENABLED)"
# Expect: MARKER_URL= http://example.invalid:9999  ENABLED= True
git checkout .env   # or remove the temporary lines
```
**Note:** This does **not** fix god-launch's `.env`-blindness — that is handled separately in Phase 3 (god-launch never sources `.env`).

---

### Phase 1 — Single local-first Marker pool resolver [BLOCKER, ~1 hr]

**Problem (C3/C4/C5):** four uncoordinated selection mechanisms; local `:8003` is unreachable because the pool hardcodes `:8001/:8002`; `run_marker_extract` bypasses the pool; v1's resolver is WRAITH-first and re-expands a scalar.

**Design:** one source of truth, `resolve_marker_pool() -> List[str]`, **local-first**, returning a *probed pool* (never a scalar that gets re-expanded). Replace the body of `_init_marker_pool`, the inline probe at `:960-976`, and `parallel_ingest.py:737-746` with one call.

**File:** `scripts/ingest/run_ingest_phase2.py:125-133` (and the probe block `:958-978`); `scripts/ingest/parallel_ingest.py:737-738`.

**New constants (top of file, after Phase 0):**
```python
MARKER_LOCAL_URL  = os.environ.get("MARKER_URL_LOCAL",  "http://127.0.0.1:8003")
MARKER_REMOTE_URL = os.environ.get("MARKER_URL_REMOTE", "http://192.168.50.22:8001")
MARKER_EXPLICIT   = os.environ.get("MARKER_URL", "").strip()   # manual override iff non-empty
```

**Replace `_init_marker_pool` with:**
```python
def _probe(url: str, session=None, timeout=4) -> bool:
    import requests
    try:
        r = (session or requests).get(f"{url}/", timeout=timeout)
        return r.status_code == 200
    except Exception:
        return False

def resolve_marker_pool() -> List[str]:
    """LOCAL-FIRST. Returns a probed pool (verbatim ports, no rewrite for local).
    Order: explicit override -> local :8003 -> WRAITH (both GPU ports)."""
    # 1. Explicit manual override: use exactly as given (single-entry), no port rewrite.
    if MARKER_EXPLICIT:
        return [MARKER_EXPLICIT] if _probe(MARKER_EXPLICIT) else []
    # 2. Local first.
    if _probe(MARKER_LOCAL_URL):
        return [MARKER_LOCAL_URL]
    # 3. Remote accelerator: probe BOTH GPU ports, keep responders.
    base = MARKER_REMOTE_URL.rsplit(":", 1)[0]
    alive = [u for u in (f"{base}:8001", f"{base}:8002") if _probe(u)]
    return alive

def _init_marker_pool():
    global MARKER_URLS, _marker_url_cycle
    import itertools
    if not MARKER_URLS:
        MARKER_URLS = resolve_marker_pool()
    _marker_url_cycle = itertools.cycle(MARKER_URLS) if MARKER_URLS else None
```

**Replace the inline probe (`:958-976`)** so it no longer re-probes — just call the resolver and set `marker_available`:
```python
marker_available = False
if MARKER_ENABLED:
    MARKER_URLS[:] = resolve_marker_pool()
    _init_marker_pool()
    if MARKER_URLS:
        marker_available = True
        print(f"[Marker] FULL mode — pool={MARKER_URLS}")
    else:
        msg = "[Marker] no server reachable (local :8003 / WRAITH) — DEGRADED (pdftotext)"
        if REQUIRE_FULL:   # see Phase 4
            print(msg + " — REQUIRE_FULL set, aborting"); sys.exit(3)
        print("WARNING " + msg)
```

**Fix `run_marker_extract` to honor the pool (C4):** give it a `marker_url: str = ""` param (mirror `run_marker_extract_json`), use `url = marker_url or (MARKER_URLS[0] if MARKER_URLS else MARKER_REMOTE_URL)`, and pass `get_next_marker_url()` at all four call sites (`:1150/1153/1248/1322`). Also fix its stale fields while there: `data={'paginate_output':'true','output_format':'markdown'}` (stock field is `paginate_output`, not `paginate`) and read `resp['output']` (there is no `markdown` key). **Delete `check_marker_health` (`:298-306`)** — it is dead code (zero callers) and uses the global URL.

**Apply the same `resolve_marker_pool()`** in `parallel_ingest.py` (replace `:737-738`); it already imports MARKER constants from `run_ingest_phase2`, so import and call the same function.

**IPv6 edge:** `http://[::1]:8003` is not handled by simple parsing; document localhost as `127.0.0.1` only.

**Prerequisite:** Phase 0.
**Acceptance test (selection logic, no upload):**
```bash
# With nothing on :8003 and WRAITH up, expect the WRAITH pool:
MARKER_ENABLED=true python3 -c "import sys;sys.path.insert(0,'scripts/ingest');import run_ingest_phase2 as m;print(m.resolve_marker_pool())"
# Expect: ['http://192.168.50.22:8001', 'http://192.168.50.22:8002']
# With an explicit dead override, expect []:
MARKER_URL=http://127.0.0.1:8003 python3 -c "import sys;sys.path.insert(0,'scripts/ingest');import run_ingest_phase2 as m;print(m.resolve_marker_pool())"
# Expect: []  (because :8003 not yet running)
```

---

### Phase 2 — Install local Marker + PROVE API compatibility [BLOCKER for local FULL, ~1-2 hr incl. model download]

**Problem (C6):** local Marker does not exist (`~/.venv-marker` empty). Good news: WRAITH is **stock marker-pdf**, so a stock local `marker_server` is a drop-in — the response body is the only thing not yet live-verified.

**2a. Install (Blackwell-safe order) into the existing empty `~/.venv-marker`:**
```bash
~/.venv-marker/bin/pip install --upgrade pip
# cu128 torch FIRST so the resolver keeps a Blackwell (sm_120) wheel:
~/.venv-marker/bin/pip install torch --index-url https://download.pytorch.org/whl/cu128
~/.venv-marker/bin/pip install "marker-pdf==1.10.2" uvicorn fastapi python-multipart
```
Pin `marker-pdf==1.10.2` (latest; `/marker/upload` schema stable across 1.x and matches WRAITH). Isolation is **required** (do NOT use `~/.venv`): marker pins `anthropic ^0.46.0`, which would downgrade god-agent's `anthropic 0.75.0`. HTTP-only coupling means no shared Python env is needed.

**2b. Smoke-test the install (Blackwell):**
```bash
TORCH_DEVICE=cuda ~/.venv-marker/bin/python -c "import torch;print(torch.version.cuda, torch.cuda.get_arch_list())"
# Expect cu128 and 'sm_120' present. If 'no kernel image' at runtime -> wrong (non-cu128) torch wheel.
```

**2c. Launch local Marker on `:8003` (VRAM-capped against vLLM's ~20 GiB; ~11.7 GiB free):**
```bash
TORCH_DEVICE=cuda \
RECOGNITION_BATCH_SIZE=16 DETECTOR_BATCH_SIZE=4 LAYOUT_BATCH_SIZE=4 TABLE_REC_BATCH_SIZE=4 OCR_ERROR_BATCH_SIZE=4 \
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True \
~/.venv-marker/bin/marker_server --host 127.0.0.1 --port 8003
```
Marker peaks ~5 GiB/worker (single worker default) → fits in ~11.7 GiB with headroom. On any CUDA OOM, fall back per-doc to `TORCH_DEVICE=cpu` (correct but 10-50x slower; reserve as emergency only). See Open Decisions.

**2d. PROVE the contract (the one thing no agent verified live):** a real one-PDF round-trip must confirm `resp['output']` is a JSON string that `json.loads` to a block tree with `children`/`bbox`:
```bash
curl -s http://127.0.0.1:8003/ | grep -q "Marker API" && echo "ROOT 200 OK"
P=$(ls corpus/new_media/*.pdf | head -1)
curl -s -F "file=@${P};type=application/pdf" -F "output_format=json" \
     http://127.0.0.1:8003/marker/upload \
 | python3 -c "import sys,json;r=json.load(sys.stdin);o=json.loads(r['output']);print('OK keys:',list(r.keys()));print('root children:',('children' in o))"
# Expect: OK keys: [...'output'...]  ;  root children: True
```
If this passes, **no shim and no dual-schema client are needed** (the client at `run_ingest_phase2.py:344-357` works unchanged). If it fails (unexpected), the fallback is a thin FastAPI shim wrapping marker-pdf to emit `{'output': <json-string>}` — but the evidence says it will pass.

**Prerequisite:** Phases 0+1.
**Acceptance test (end-to-end local FULL on ONE doc — note correct `--root` to preserve `collection='new_media'`):**
```bash
mkdir -p /tmp/smoke/new_media && cp "$(ls corpus/new_media/*.pdf | head -1)" /tmp/smoke/new_media/
MARKER_ENABLED=true MARKER_URL=http://127.0.0.1:8003 \
  python3 scripts/ingest/run_ingest_phase2.py --root /tmp/smoke --disable-ocr
# Then confirm bboxes landed (see Phase 11 corrected query):
python3 - <<'PY'
import chromadb
c=chromadb.HttpClient(host='127.0.0.1',port=8001).get_collection('knowledge_chunks')
r=c.get(where={'$and':[{'has_bboxes':True},{'collection':'new_media'}]},include=['metadatas'],limit=3)
print('bbox chunks:',len(r['ids']))
PY
# Expect bbox chunks > 0  => local FULL mode works end-to-end with zero WRAITH dependency.
```

---

### Phase 3 — god-launch managed `marker` service [~1.5 hr]

**Problem (C2 for shell side):** god-launch never sources `.env`; adding a service is a **5-file** change, and the repo's convention pre-creates tmux windows in `create_session()`.

**3a. Source `.env` once in god-launch** (so `MARKER_LOCAL_ENABLED`/`MARKER_LOCAL_PORT` work). In `scripts/god-launch`, after `load_launcher_config` (~line 117):
```bash
set -a; [[ -f "${GOD_PROJECT_DIR}/.env" ]] && source "${GOD_PROJECT_DIR}/.env"; set +a
```

**3b. Pre-create the window.** In `scripts/god-launch.d/start.sh:293-299`, add before the `shell` window:
```bash
tmux new-window -t "${GOD_SESSION_NAME}" -n "marker"
```
and bump the `"Session created with 8 windows"` log to 9.

**3c. `start_marker()`** in `start.sh` (idiomatic: tmux `send-keys` + reuse `wait_for_http`, capture pid via `pgrep` because a foreground send-keys cannot `echo $!`):
```bash
MARKER_LOCAL_PORT="${MARKER_LOCAL_PORT:-8003}"
MARKER_VENV="${MARKER_VENV:-${HOME}/.venv-marker}"
start_marker() {
  [[ "${MARKER_LOCAL_ENABLED:-false}" == "true" ]] || { log_info "Skipping local Marker (MARKER_LOCAL_ENABLED!=true)"; return 0; }
  if curl -sf "http://127.0.0.1:${MARKER_LOCAL_PORT}/" >/dev/null 2>&1; then log_success "Local Marker already running"; return 0; fi
  local bin="${MARKER_VENV}/bin/marker_server"
  [[ -x "$bin" ]] || { log_error "marker_server not found: $bin (run Phase 2a)"; return 1; }
  tmux send-keys -t "${GOD_SESSION_NAME}:marker" \
    "TORCH_DEVICE=cuda RECOGNITION_BATCH_SIZE=16 DETECTOR_BATCH_SIZE=4 PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True '$bin' --host 127.0.0.1 --port ${MARKER_LOCAL_PORT} 2>&1 | tee '${GOD_LOG_DIR}/marker.log'; echo '--- Marker exited ---'; read" Enter
  if wait_for_http "http://127.0.0.1:${MARKER_LOCAL_PORT}/" 120; then
    local pid; pid=$(pgrep -f "marker_server.*${MARKER_LOCAL_PORT}" | head -1); [[ -n "$pid" ]] && echo "$pid" > "${GOD_PROJECT_DIR}/.run/marker.pid"
    log_success "Local Marker ready on :${MARKER_LOCAL_PORT}"
  else log_error "Local Marker failed within 120s"; return 1; fi
}
```
Call `start_marker` in `do_start()` right after `start_embedding` (~`start.sh:385`).

**3d. Wire the other 4 files** (v1 only mentioned start.sh):
- `god-launch:86` — add `marker` to `SERVICES=(...)`.
- `status.sh check_service_status()` — add `marker)` case: running iff `MARKER_LOCAL_ENABLED==true` and `curl -sf :${MARKER_LOCAL_PORT}/`; pid from `.run/marker.pid` or `pgrep`; show `stopped` (not failed) when disabled.
- `stop.sh do_stop()` — kill via `.run/marker.pid` (or `pkill -f marker_server`) and `rm -f` the pidfile **before** `tmux kill-session`; add a `marker)` case to `stop_service()`.
- `start.sh do_restart()` — add a `marker)` case.

**Prerequisite:** Phase 2 (binary installed).
**Acceptance test:**
```bash
echo "MARKER_LOCAL_ENABLED=true" >> .env
scripts/god-launch start marker && scripts/god-launch status | grep -i marker   # expect running
curl -sf http://127.0.0.1:8003/ >/dev/null && echo "health OK"
scripts/god-launch stop marker; [[ -f .run/marker.pid ]] && echo "STALE PIDFILE (bug)" || echo "clean stop"
```

---

### Phase 4 — Mode integrity: label, fail-loud, fidelity-aware re-ingest [HIGH, ~2-3 hr]

**Problem (C15 + findings):** corpus is 100% DEGRADED; degraded docs are trapped (skip is not fidelity-aware); no queryable mode label; degradation is silent.

**4a. Record mode in the manifest (both branches).** In `run_ingest_phase2.py`, add to `base_record` (near `:1588` where `chunks=len(chunks)` is set), written for FULL **and** DEGRADED:
```python
base_record["fidelity_mode"]   = "full" if marker_json_available else "degraded"
base_record["marker_used"]     = bool(marker_json_available)
base_record["has_bboxes"]      = bool(bbox_chunks)               # doc-level OR
base_record["marker_url_used"] = (marker_url if marker_json_available else "")
if not marker_json_available and MARKER_ENABLED:
    base_record["degrade_reason"] = "marker_unreachable"
```
Then "find docs to upgrade" = `jq 'select(.fidelity_mode=="degraded")' manifest.jsonl` — no Chroma scan.

**4b. `--require-full` flag + loud degrade.** Add `REQUIRE_FULL = ("--require-full" in sys.argv)` (or argparse); used in the Phase 1 probe block to `sys.exit(3)` when FULL was requested but the pool is empty. When not required, the WARNING already added in Phase 1 makes degradation visible.

**4c. Fidelity-aware skip.** Patch `should_skip_phase2` (`:270-280`) and the pre-fetch skip (`:998`): skip only if `sha matches AND status ok AND phase>=2 AND (rec.fidelity_mode=="full" OR not marker_available_this_run)`. So when a Marker is reachable and the stored record is DEGRADED, the doc is **re-ingested in FULL automatically** (no `--force`). Pass `marker_available` into the skip function.

**Prerequisite:** Phases 1-2 (so FULL is reachable to upgrade into); pairs with Phase 8 (idempotent replace).
**Acceptance test:**
```bash
# 1) Force a degraded ingest of one doc (no marker), confirm label:
MARKER_ENABLED=false python3 scripts/ingest/run_ingest_phase2.py --root /tmp/smoke --disable-ocr --force
tail -1 corpus/index/... # or: grep the doc in manifest -> fidelity_mode":"degraded"
# 2) With local Marker up, re-run WITHOUT --force; the degraded doc must be picked up (not skipped):
MARKER_ENABLED=true MARKER_URL=http://127.0.0.1:8003 python3 scripts/ingest/run_ingest_phase2.py --root /tmp/smoke --disable-ocr
# Expect: doc re-ingested, manifest now fidelity_mode":"full", has_bboxes":true
# 3) --require-full with no marker must hard-exit 3:
MARKER_ENABLED=true MARKER_URL=http://bad:9 python3 scripts/ingest/run_ingest_phase2.py --root /tmp/smoke --require-full; echo "exit=$?"  # expect 3
```

---

### Phase 5 — Fix `verify_ingest.py` (the local integrity gate) [HIGH, ~45 min]

**Problem (C12 + findings):** chunk-count comparison is dead; ID-continuity helper is unused; PersistentClient contends with the live server; missing collection is silently created empty.

**File:** `scripts/ingest/verify_ingest.py`.

**5a. Int-chunks fix** (`:71-79`) — read `chunks` as int first:
```python
def get_chunk_count_from_manifest(rec):
    chunks = rec.get("chunks")
    if isinstance(chunks, int):
        return chunks
    for k in ("chunk_count", "num_chunks", "chunks_total"):
        v = rec.get(k)
        if isinstance(v, int):
            return v
    if isinstance(chunks, list):
        return len(chunks)
    return None
```

**5b. Read via HTTP, fail on missing collection** (`:95-96`): replace `chromadb.PersistentClient(path=...)` with `chromadb.HttpClient(host='127.0.0.1', port=8001)` and `get_collection` (not `get_or_create_collection`) so a missing collection **fails loudly** instead of returning an empty count. This matches the ingest write path (`run_ingest_phase2.py:786`) and avoids SQLite lock contention with the running server. (Apply the same HttpClient switch to `render_citation_bbox.py:61` for consistency.)

**5c. Implement the promised ID-set check** (`expected_chunk_ids` at `:82-83` is dead): fetch ids via `collection.get(where={'doc_id':doc_id}, include=[])` and compare the set against `expected_chunk_ids(doc_id, expected_n)` — catches gapped/duplicated ids that a count-only check misses. (Or delete the helper and correct the `:9` docstring; implementing it is the rock-solid choice.)

**5d. Optional:** add a per-batch `has_bboxes` coverage assertion so a silently-bbox-less "FULL" batch is caught; pass `limit=embed_sample` to the embeddings `get` (`:108`) to avoid pulling all vectors.

**Prerequisite:** none (independent).
**Acceptance test:**
```bash
python3 scripts/ingest/verify_ingest.py --root corpus   # NOTE: --root corpus, not corpus/new_media (collection-tag trap, see Phase 11)
# Expect: chunk-count comparison now runs (no longer silently skipped); a doc with a deliberately wrong manifest count reports COUNT_MISMATCH.
```

---

### Phase 6 — Fidelity-gate Bekker regex (the ONLY real regex bug) [LOW, ~10 min]

**Problem (C7/C8):** v1 targeted a nonexistent `_BEKKER_RE` and proposed a regex that would corrupt the line-anchored stripper. The real (low-impact) bug is in the fidelity gate.

**Do NOT touch** `run_ingest_phase2.py` `_LOCATOR_RE` (`:469-478`) — it already matches 4-digit Bekker and is correctly `^…$`-anchored for `.match()`-based whole-line deletion.

**File:** `scripts/ingest/scholarly_fidelity_gate.py:28`:
```python
# OLD: BEKKER_RE = re.compile(r'\b\d{3,4}[ab]\d{1,2}\b')   # misses bare 1147a / 403b / 12a
BEKKER_RE = re.compile(r'\b\d{2,4}[ab]\d{0,2}\b')           # letter required, 0-2 trailing
```
This is a symmetric scoring heuristic (threshold 0.5) only — it never strips or stores. Optional parity: `layout_analyzer.py:54` `^\s*\d{2,3}[a-b]?\d{0,2}\s*$` → `^\s*\d{1,4}[ab]?\d{0,3}\s*$` (belt-and-suspenders; `_LOCATOR_RE` already covers these lines).

**Acceptance test:**
```bash
python3 -c "import re;r=re.compile(r'\b\d{2,4}[ab]\d{0,2}\b');print([bool(r.search(x)) for x in ['1147a','1095b','403b','12a','1147a13']])"
# Expect: [True, True, True, True, True]
```

---

### Phase 7 — Bbox→chunk alignment + Marker-table structure [HIGH quality, ~2-3 hr]

Two real provenance/quality defects v1 missed.

**7a. Bbox-to-chunk index misalignment (corrupts overlays even on WRAITH).** When Marker wins, paragraphs are exploded from `bbox_chunks` (`run_ingest_phase2.py:1175-1178`) then **re-chunked** by `chunk_paragraphs_page_aware` into fresh `0..N` indices (`:1338`), yet bbox injection does `bbox_chunks[c.chunk_index]` (`:1664`). The re-chunked index is not 1:1 with `bbox_chunks`, so chunks get mismatched bboxes and any index `>= len(bbox_chunks)` silently gets `has_bboxes=False`. **Fix:** carry per-paragraph bbox/page **through** `chunk_paragraphs_page_aware` (attach bbox to each paragraph, merge boxes at flush), OR chunk once directly from `bbox_chunks` and embed those exact chunks (skip the second re-chunk). Add an assertion `len(chunks)==len(bbox_chunks)` in marker+bbox mode.

**7b. Marker-table structure loss (the real 4c, C11).** `markdown_chunker._extract_text_from_html` (`:247`) bare-strips `<table>` into run-together prose, and this is the dominant path (camelot bypassed under Marker, `:1343-1346`). **Fix:** special-case `block_type=='Table'` in `markdown_chunker` — parse `<tr>/<td>` into a markdown pipe-table, emit as its **own** chunk prefixed `[TABLE] Page N, R rows × C columns` + `Source: <relpath> | Page N`, excluded from prose merging. The camelot path already does this (`table_extractor.py:308-331`); only add the `Source:` line there (thread `relpath` from `:1400-1406`).

**Prerequisite:** Phase 2 (need real Marker JSON to test).
**Acceptance test:** ingest a doc with a known table under local Marker; confirm (a) a chunk with `type='table'` and a `[TABLE]`/pipe-table body exists, and (b) `render_citation_bbox.py '<chunk_id>' --output-dir /tmp/r` draws a box on the correct region (visual check).

---

### Phase 8 — Re-ingest idempotency + orphan cleanup (the REAL 4b) [HIGH, ~2 hr]

**Problem (C13 + findings):** content-derived `doc_id` (`compute_doc_id = sha256(f"{path_rel}:{sha}")[:16]`, `:179-181`) means editing a file changes every `chunk_id`; old chunks are **never deleted** (no `.delete(` in `run_ingest_phase2.py`) → orphans with stale path/page/bbox (2 such doc_ids already live). This is the real robustness hole for a citation-grade corpus.

**Fix (provenance-safe; the pattern already exists in `reingest_layout.py:169-173`):**
1. Make `doc_id` **stable on file identity** — derive from `path_rel` only; keep `sha` in metadata/manifest for change detection. (Apply to `parallel_ingest.py:192` too.)
2. Before upsert (always under `--force`, and whenever re-ingesting), delete the doc's prior chunks: `old=coll.get(where={'doc_id':doc_id}); coll.delete(ids=old['ids'])` — or delete only `old_ids - new_ids` to also handle the shrinking-chunk-count case.
3. One-time cleanup of the 2 known orphan doc_ids.

**Reject** v1's cross-document hash-skip (would collapse legitimately duplicated books and mis-attribute provenance). Leave `clean_sha256` as **descriptive**; optionally add a non-destructive duplicate-hash WARNING to `verify_ingest.py`.

**Prerequisite:** none, but pairs with Phase 4 (FULL upgrade must replace DEGRADED cleanly).
**Acceptance test:** ingest a doc; edit one byte; re-ingest; confirm `coll.get(where={'doc_id':<stable_id>})` count equals the new chunk count with **no** leftover old-content chunks.

---

### Phase 9 — Locator capture (LocatorHit / V-0) [HIGH capability, several hr]

**Problem (4a, real):** locators are matched then **discarded** (`_LOCATOR_RE` strips standalone lines at `:519`; no `locators` metadata field exists in either mode). Without them, "1147a13 → page → bbox → overlay" is impossible even once bboxes work.

**Build:** instead of discarding, capture `(page, kind, value, bbox)` into a per-chunk `locators` JSON metadata field; populate `bbox` from the Marker block whose text contains the locator. This is downstream of Phases 2 (bboxes) and 7a (correct bbox↔chunk mapping) — sequence after them.

**Acceptance test:** a chunk citing `1147a13` carries a `locators` entry resolving to the correct page and a bbox that `render_citation_bbox.py` overlays accurately.

---

### Phase 10 — Optional hardening [LOW, as time permits]

- `camelot-py[cv]` in the ingest runtime for ruled-table quality (PyMuPDF fallback works without it).
- `apt install tesseract-ocr` + `pip install pytesseract` **only if** scanned PDFs are in scope; otherwise make `detect_content_type` surface a hard error on scanned input (currently the default path errors silently without the binary). For text corpora, prefer `--disable-ocr`.
- Point ingestion at a non-storing embed route (or periodically prune `local_vectors_1536`) so `:8000/embed` does not silently accumulate a parallel vector store; document `knowledge_chunks` (:8001) as the single source of truth.

---

### Phase 11 — Corrected post-ingestion verification commands [~15 min]

v1's 5b commands **crash**. Corrected:

**Collection-tag trap (critical):** run ingestion with `--root corpus` (or a staged `/tmp/<root>/new_media/…` copy), **never `--root corpus/new_media`** — `collection_from_relpath` takes `parts[0]` of the path relative to `--root` (`:195-197`), so `--root corpus/new_media` tags every chunk's `collection` with the **filename**, breaking all `where collection='new_media'` filters. A symlinked root fails too (`.resolve()` dereferences then `relative_to` raises) — use a real copy.

**5b BBox query (chromadb 1.4.0 needs `$and` for multi-key where):**
```python
import chromadb
c=chromadb.HttpClient(host='127.0.0.1',port=8001).get_collection('knowledge_chunks')
res=c.get(where={'$and':[{'has_bboxes':True},{'collection':'new_media'}]},include=['metadatas'],limit=3)
for i,m in zip(res['ids'],res['metadatas']): print(i, m.get('path_rel','')[-40:], 'bboxes:', bool(m.get('bboxes')))
```
**5b render (positional chunk_id + `--output-dir`, no `--chunk-id`/`--output`/`--pdf`):**
```bash
python3 scripts/ingest/render_citation_bbox.py '<chunk_id>' --output-dir /tmp/citation-renders
```
**5c clarification:** `compile-corpus-index.py` parses ontology markdown (hardcoded `TEXT_DIRS`) — it does **not** register new_media chunks. New_media is retrievable via Chroma directly. Correct the v1 wording.

**Health check:** `:8000` has no `/health` (`/` → 200, `/embed` → 1536).

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Local Marker OOM vs vLLM (only ~11.7 GiB free) | Medium | Marker crashes mid-batch | Single worker + capped batches (Phase 2c); `expandable_segments:True`; per-doc CPU fallback on OOM; or pause vLLM during a big local batch |
| `pip install marker-pdf` pulls non-cu128 torch → "no kernel image" on sm_120 | Medium | Local Marker DOA | Install cu128 torch **first** (Phase 2a); smoke-test arch_list (2b) |
| Stock response body differs from `{'output':<jsonstr>}` (not POST-verified by any agent) | Low | Client can't parse local Marker | Phase 2d one-PDF round-trip proves it before wiring; FastAPI shim is the documented fallback |
| Applying v1's Phase 3a regex to `_LOCATOR_RE` | (avoided) | Deletes prose lines beginning with a Bekker ref | Phase 6 explicitly forbids touching `_LOCATOR_RE` |
| Fidelity-aware auto-re-ingest mass-reprocesses 41 PDFs unexpectedly | Medium | Long unattended GPU run | Gate behind explicit batch; report planned upgrades (`jq fidelity_mode=="degraded"`) before running |
| `doc_id` change to path-stable breaks existing skip/verify keyed on old ids | Medium | Re-ingest churn / orphan window | One-time migration + orphan cleanup (Phase 8); verify by doc_id set |
| god-launch `.env` sourcing leaks secrets into all child windows | Low | Secret exposure in tmux env | `set -a; source; set +a` only around `.env`; `.env` already holds API keys the session uses |
| `:8000/embed` side-writes inflate `local_vectors_1536` | Low | Disk + drift | Phase 10 prune / non-storing route |
| WSL2 torch reports 30 GiB free (mirage) | Medium | Over-allocation → host spill thrash | Size to nvidia-smi free, never torch free |

---

## Open decisions for the user

1. **Local Marker device:** GPU (capped, concurrent with vLLM; ~5 GiB peak fits ~11.7 GiB free) vs CPU (cannot OOM but 10-50x slower, RAM-tight at ~12 GiB host). Recommendation: **GPU capped**, CPU only as per-doc OOM fallback. Confirm?
2. **Local Marker server:** stock `marker_server` (evidence: drop-in, recommended) vs FastAPI shim vs dual-schema client. Recommendation: **stock**, gated by the Phase 2d contract test. Approve stock-first?
3. **Degraded auto-re-ingest:** should DEGRADED docs auto-upgrade to FULL the moment a Marker is reachable (fidelity-aware skip), or only on an explicit `--upgrade-degraded` flag? (Auto is more "rock solid"; explicit is safer for a 41-PDF GPU run.)
4. **`doc_id` stability:** switch to path-stable `doc_id` now (cleaner idempotency, but a one-time migration of existing chunk ids) vs keep content-derived and only add delete-by-doc_id? Recommendation: **path-stable + migration**.
5. **WRAITH role:** keep WRAITH as a probed accelerator *after* local (local-first), or prefer WRAITH when both are up (it offloads the shared GPU)? Recommendation: **local-first** per stated goal; revisit if local Marker contends badly with vLLM.
6. **Scanned-PDF OCR:** install tesseract for full coverage, or declare scanned PDFs out of scope and hard-error on them? (Corpus is overwhelmingly text PDFs.)
7. **`MARKER_TIMEOUT_S=1200`** (20 min/doc) — keep for big PDFs, or lower for faster fail-fast on a wedged local server?

---

## Execution order

| Step | Phase | What | Prereq | Time | Blocker for |
|------|-------|------|--------|------|-------------|
| 1 | 0 | `load_dotenv()` in `run_ingest_phase2.py`; drop dead default | — | 10 min | local FULL, env config |
| 2 | 1 | `resolve_marker_pool()` local-first; fix `run_marker_extract` callers; delete dead `check_marker_health` | 0 | 1 hr | local FULL selection |
| 3 | 2 | Install marker-pdf (cu128 torch first); launch `:8003`; **prove `/marker/upload` contract** | 0,1 | 1-2 hr | local FULL |
| 4 | 5 | `verify_ingest` int-chunks + HttpClient + ID-set check | — (parallel) | 45 min | trustworthy verification |
| 5 | 6 | Fidelity-gate `BEKKER_RE` only | — (parallel) | 10 min | — |
| 6 | 4 | Manifest mode label + `--require-full` + fidelity-aware skip | 1,2 | 2-3 hr | graceful upgrade |
| 7 | 3 | god-launch `marker` service (5-file) + source `.env` | 2 | 1.5 hr | one-command local FULL |
| 8 | 8 | Path-stable `doc_id` + delete-by-doc_id + orphan cleanup | — | 2 hr | idempotent re-ingest |
| 9 | 7 | Bbox↔chunk alignment fix; Marker-table `[TABLE]` serialization | 2 | 2-3 hr | correct overlays/tables |
| 10 | 11 | Corrected verify/render/bbox commands; collection-tag discipline | 2 | 15 min | provenance proof |
| 11 | 9 | Locator (LocatorHit) capture | 2,7 | several hr | citation anchors |
| 12 | 10 | Optional: camelot, tesseract, embed-store hygiene | — | as available | hardening |

**Recommended path:** 0 → 1 → 2 (local FULL proven on one doc) → 5 → 6 (cheap correctness, parallelizable) → 4 → 3 (one-command local FULL) → 8 → 7 → 11 → 9 → 10.
Steps 4 and 5 are independent and can run alongside 1-3. **Do not run a full 41-PDF batch until Phases 0-2 pass their acceptance tests** (otherwise you re-confirm the 100%-DEGRADED status quo).
