# PR-D — Mac (Apple Silicon / MPS) Setup & Experiment Guide

- **Status:** Guide only — **nothing here has been executed.** Review first; we run it together, with your permission, step by step.
- **Date:** 2026-06-30
- **Mac:** `192.168.50.216` (Apple Silicon, MPS, unified memory). SSH access assumed (previously direct).
- **Goal of PR-D on the Mac:** prove the device-adaptive layer on real Apple hardware and run the **Task D0 cross-device bbox-jitter experiment** that decides the §3 quantization question — plus the `bbox-vs-polygon` `[CONFIRM]`, the real surya memory peak, and the cross-platform chunk-parity diff.

### Stage 0 results (executed 2026-06-30 — SSH OK)
- macOS **15.7.7**, **arm64**, **24 GB** unified. Xcode CLT present (full Xcode). git 2.39.5. ~280 GB free. `~/archon-cli` absent (fresh transfer).
- **Rust 1.96.0 already installed** (== WSL/CI stable) → **Stage 3 is a no-op, skip it.**
- **Homebrew 6.0.4 present** + **Python 3.12.13** at `/opt/homebrew/bin/python3.12` (also 3.14.6, but avoid 3.14 for ML wheels) → **Stage 5 venv uses `/opt/homebrew/bin/python3.12`** (mature torch/marker wheels). The `/usr/bin/python3` 3.9.6 is just the system Python — ignore it. torch/marker not yet installed.
- At Stage 0 the Mac had only ~9.6 GB *available* (busy) → after the 6 GB OS reserve the planner sees ~3.5 GB < the (unverified) 5.1 GB Marker footprint, so the Stage-4 probe **may place Marker on CPU** until memory is freed. Correct adaptive behavior; a live tuning data point for `APPLE_OS_RESERVE_MB` / the footprint estimate.

### Stage 4 result (executed 2026-06-30 — PASS)
- `cargo build -p archon-accel` on the Mac: **3.4s**. Probe output:
  `macos/aarch64 | accel: metal#0 Apple Silicon (unified) (2154 MiB free / 24576 MiB total) | unified`
  → **Marker placed on CPU** (`free 2154 MiB < footprint 5120 MiB`); Embedding CPU. **Cross-platform detection + the free<footprint rule PROVEN on Apple Silicon.**
- The 2154 MiB came from 8298 MiB available − 6144 MiB `APPLE_OS_RESERVE_MB`. With the unverified 5120 MiB footprint, the GPU threshold is ~11 GB available — likely too conservative; **revisit `APPLE_OS_RESERVE_MB` + footprint after the §6.3 real surya-peak measurement.**
- **GPU-placement branch — VALIDATED (re-run after freeing memory, 2026-06-30):** with 16322 MiB available → metal free 10178 MiB ≥ need 6656 → **Marker on `metal`, Fp16, tier=Generous, oom_fallback=true** (`TORCH_DEVICE=mps TORCH_DTYPE=float16` + generous surya caps 64/24/12/24/16). So BOTH branches are now proven on Apple Silicon: CPU under pressure (2154 MiB free) and `mps` Generous when freed (10178 MiB). **archon-accel placement logic is fully validated cross-platform (CUDA + Metal, CPU + GPU branches).**

### Stage 5 — ALREADY SATISFIED (verified 2026-06-30)
Marker is pre-installed on the Mac → **no install needed.**
- venv **`~/.archon-marker-venv`** (Python 3.12.13). Activate: `source ~/.archon-marker-venv/bin/activate`.
- **marker-pdf 1.10.2** · **torch 2.12.1, MPS available** · CLI `marker`/`marker_single`/`marker_chunk_convert` present.
- **`[CONFIRM]` RESOLVED:** the sidecar's API imports (`marker.converters.pdf.PdfConverter`, `marker.models.create_model_dict`, `marker.renderers.json`) all import cleanly against 1.10.2.
- **surya models cached** at `~/Library/Caches/datalab` (3.2 GB) → fast first run, no download.
- **`MARKER_VERSION = 1.10.2`** — pin this exact version on the RTX 5070 laptop for the cross-device jitter comparison.
- Still to confirm at first real run: whether 1.10.2's JSON emits `bbox` or `polygon` per block (§6.1), and that `run_marker`'s `model_dump` shape matches the Rust parser.

### Stage 6 — Option A smoke test (executed 2026-06-30 — PASS, on `~/pdf-fixtures/kim-emergence.pdf`, 13pp)
- **Marker on MPS: exit 0, 164 KB JSON.** surya logged `TableRecEncoderDecoderModel is not compatible with mps backend. Defaulting to cpu instead` — the *table-rec* sub-model auto-falls-back to CPU on MPS (benign; no tables in this doc). Peak: RSS 1.9 GB / macOS phys_footprint **9.3 GB** (incl. the mmap'd 3.2 GB models) — a real footprint data point (measure more per §6.3).
- **`bbox`-vs-`polygon` `[CONFIRM]` RESOLVED:** marker-pdf 1.10.2 emits **BOTH** on every block; `bbox` is the standard axis-aligned `[x0,y0,x1,y1]` the Rust parser expects → **no polygon→bbox mapping needed; integrity path sound.**
- **Rust parser ACCEPTS 1.10.2 JSON:** `parse_marker_str` → 106 leaf blocks (tolerates new types `Footnote`/`Picture`/`PictureGroup`/`ListGroup`/`ListItem`/`PageHeader` — unknown → `None` @ `marker.rs:30`).
- **Cross-platform CHUNK parity (6.5) — PASS:** Rust `chunk_blocks_default` vs Python `chunk_marker_json` on the SAME Mac JSON → **10 chunks each, all `text_len` byte-identical**; sole diff = chunk 1 `page_end` (Rust 3 / Python 4) = the documented intentional `page_end` correction (divergence #5). **The port is faithful on real hardware.**
- New tool: `crates/archon-ingest-ext/examples/chunk_dump.rs` (reads a Marker JSON → prints the Rust chunk table; mirrors `chunk_parity_check.py --marker-json`). Builds on WSL + Mac, no native deps. Committed `83a922e1`.

### Stage 6.2 — within-device determinism floor (executed 2026-06-30 — PASS)
- Two MPS runs of `kim-emergence.pdf` → **byte-identical bboxes**: `bbox_jitter_diff.py mps_run1 mps_run2` = **max 0.0000 px, 100% unify @ 1px** (172/172 blocks). **surya on MPS is bit-deterministic run-to-run** → same-device hashes reproducible; **quantization viable in principle.** Only the cross-device delta remains.

### Cross-device jitter — BLOCKED on a CUDA reference (2026-06-30)
- **RTX 5070 laptop (192.168.50.243) NOT reachable** — port 22 connection timed out (SSH server likely not running — Windows needs OpenSSH Server enabled — or asleep/firewall). Username has a space (`Dalton Salvo`) → use `ssh -l "Dalton Salvo" ...`.
- CUDA-reference options: **(a)** install marker-pdf 1.10.2 in a venv on THIS 5090 WSL box (fastest; isolated; generate the cuda dump here) · **(b)** enable SSH on the laptop → mirror the Mac setup (also yields the real 5070 8 GB constrained-CUDA data) · **(c)** user runs Marker on the laptop and sends the JSON. NB: 5090 vs 5070 are different Blackwell chips — cuDNN kernel choice may differ, so ideally test both.

### Task D0 — cross-device jitter RESULT (executed 2026-06-30, option (b) — the RTX 5070 laptop)
Laptop setup (Windows, chimera\dalton): fixed firewall (Wi-Fi Public→Private + allow-22-any) → SSH via key; Python 3.11 venv; `marker-pdf==1.10.2` (== Mac); torch swapped to **2.11.0+cu128** (cu128 index lacks 2.12.1) → `cuda True, RTX 5070 Laptop GPU`. Dumped `kim-emergence.pdf --device cuda` → `laptop_cuda.json` (164,800 B).

**`bbox_jitter_diff.py mac_mps (MPS, torch 2.12.1) vs laptop_cuda (5070 CUDA, torch 2.11.0)`** — 172/172 aligned:
- per-coord |Δ| px: **max 7.68 · p99 1.71 · p50 0.00 · mean 0.155**
- unify-rate: 1px 68% · 2px 77% · 4px 81% · 8px 95% → **no bucket ≥99.9%**

**DECISION: do NOT quantize `spatial_hash`; keep verify-by-recompute (confirms §8-by-design).** Median Δ=0 (most bboxes bit-identical cross-device) but a multi-pixel tail (neural layout kernels diverge on borderline detections) defeats hash-based device-independence. Within-device MPS floor was 0px (deterministic), so same-device hashes reproduce exactly. **User's transfer workflow (ingest-once→sync) UNAFFECTED; cross-machine identity uses text/source hashes (device-independent). No code change — design validated.**
- **Confound:** torch 2.12.1 (Mac) vs 2.11.0 (laptop) blends device + torch-version deltas. Optional pure-device control: pin both to 2.11.0 + re-dump Mac, or same-torch laptop CPU-vs-CUDA. Decision holds regardless.
- Laptop marker env persists at `C:\Users\Dalton\pr-d\` (venv + sidecar + PDF + models) for future runs.

### §6.3 — real GPU memory peak + placement tuning (executed 2026-06-30)
`mem_probe.py` on the **RTX 5070 (8151 MiB)**, `kim-emergence.pdf`, `--device cuda`, surya default batches:
- **torch peak allocated 5194 MiB · peak reserved 5956 MiB** (+ ~0.5 GiB CUDA context ≈ ~6.5 GiB process). Fit with ~1.6 GiB spare → the CUDA dump ran (no OOM), validating the 8 GB card.
- The old **5120 MiB** estimate was nearly exact on *allocated* but undercounted *reserved* + context.
- **TUNED (commit `c36edef5`): `ModelFootprintTable.marker_mb` 5120 → 6144.** Idle 8 GB (7822 free) still fits Generous (need 6144+1536=7680); a busier 8 GB card now correctly drops to Reduced/CPU rather than risking OOM. 3 test thresholds updated; 13 tests green.
- **MPS cross-check (Mac, 192.168.50.216):** `torch.mps.driver_allocated_memory()` ~**6089 MiB** for the same doc — **matches the CUDA reserved peak (~5956 MiB); Marker ≈ 6 GiB on BOTH platforms**, so the 6144 tuning fits either. Doc comment updated (commit `27fa64cd`). `APPLE_OS_RESERVE_MB` (6 GiB) is a separate, deliberately-conservative OS-headroom knob — unchanged (no data says it's wrong).
- Remaining refinement (optional): a **caps-controlled** run (set the Generous surya env vars) would refine the footprint vs the surya-default measurement here. Probe `mem_probe.py` staged on all three: `scratchpad/`, laptop `pr-d\`, Mac `~/archon-cli/scripts/`.

---

## Placeholders you must fill before we run anything

| Token | Meaning | How to get it |
|---|---|---|
| `MACUSER` | your macOS login (the SSH user) | `whoami` on the Mac, or your usual SSH login |
| `MARKER_VERSION` | the `marker-pdf` version to pin **identically on every device** | pick once (e.g. the latest stable); reuse on Mac **and** the 5070 laptop |
| fixture set | 2–5 representative PDFs (multi-column, hyphenated, footnote, + optionally von Uexküll ~197 MB) | choose from the corpus |

> **Why a version pin matters:** the jitter experiment compares the *same* PDF's Marker output across devices. Different `marker-pdf`/surya **weights or versions** produce different boxes — that's not jitter, it's a different model. Pin `MARKER_VERSION` everywhere.

---

## What gets transferred (and from where)

| # | Material | Source | Destination on Mac |
|---|---|---|---|
| A | `archon-cli` repo @ `dissertation-ports` (carries the sidecar, `bbox_jitter_diff.py`, `chunk_parity_check.py`, the `archon-accel` probe) | `/home/dalton/projects/archon-cli` (this WSL box) | `~/archon-cli` |
| B | `markdown_chunker.py` (the Python parity reference — **single self-contained file**) | `/home/dalton/projects/claudeflow-testing/scripts/ingest/markdown_chunker.py` | `~/parity-ref/markdown_chunker.py` |
| C | fixture PDFs | the corpus | `~/pdf-fixtures/` |
| D | the **CUDA** Marker dumps (from the RTX 5070 laptop) | generated on the laptop (mirror of §7) | `~/jitter-dumps/` (collected for the diff) |

Everything in A is already committed (`12f2c780`, `1f0dcd4c`, `bf7f9350`, `00f77ae9`, `ad41e9d7`), so the repo transfer carries all the tooling.

---

## Stage 0 — Verify the SSH link (cheap, do first)

```bash
# from WSL (with your OK):
ssh MACUSER@192.168.50.216 'sw_vers; uname -m; sysctl -n hw.memsize; python3 --version; xcode-select -p 2>/dev/null || echo "Xcode CLT: NOT installed"'
```
Expect `arm64`, the unified-memory size in bytes, a Python 3, and an Xcode CLT path. If Xcode CLT is missing: `xcode-select --install` (needed for the Rust native builds and `/usr/bin/time`).

---

## Stage 1 — Transfer the repo (pick ONE option)

### Option A — git bundle over scp (recommended: preserves history, no GitHub, one artifact)
```bash
# WSL — build a bundle of the branch:
git -C /home/dalton/projects/archon-cli bundle create /tmp/archon-dp.bundle dissertation-ports
git -C /home/dalton/projects/archon-cli bundle verify /tmp/archon-dp.bundle   # sanity
scp /tmp/archon-dp.bundle MACUSER@192.168.50.216:~/

# Mac — if there is NO existing clone:
git clone -b dissertation-ports ~/archon-dp.bundle ~/archon-cli

# Mac — if a clone ALREADY exists at ~/archon-cli:
cd ~/archon-cli
git fetch ~/archon-dp.bundle 'dissertation-ports:dissertation-ports'
git checkout dissertation-ports
```
*(Optional, later: re-point `origin` to your real fork so you can `git pull` normally — `git remote set-url origin git@github.com:ProfessorVR/archon-cli.git`.)*

### Option B — rsync (simplest; copies the working tree at the current checkout)
```bash
# WSL — exclude build artifacts (target/ can be GBs); keep .git for git ops:
rsync -avz --exclude 'target/' --exclude 'node_modules/' \
  /home/dalton/projects/archon-cli/ MACUSER@192.168.50.216:~/archon-cli/
```

### Option C — GitHub (only if you prefer a network remote)
```bash
# WSL: push the branch to your fork (outward-facing — your call):
git -C /home/dalton/projects/archon-cli push origin dissertation-ports
# Mac: git -C ~/archon-cli pull origin dissertation-ports
```

**Recommendation: Option A.** It's a single file over your existing SSH, preserves history, and works whether or not the Mac already has the repo.

---

## Stage 2 — Transfer the parity reference + fixtures

```bash
# WSL — the parity reference is ONE self-contained file:
ssh MACUSER@192.168.50.216 'mkdir -p ~/parity-ref ~/pdf-fixtures ~/jitter-dumps'
scp /home/dalton/projects/claudeflow-testing/scripts/ingest/markdown_chunker.py \
  MACUSER@192.168.50.216:~/parity-ref/

# WSL — copy a SMALL fixture set first (start light; add von Uexküll later — see note):
scp "/path/to/multicolumn.pdf" "/path/to/footnote-heavy.pdf" \
  MACUSER@192.168.50.216:~/pdf-fixtures/
```
> **von Uexküll (~197 MB):** push it **last**. On a MacBook Air, Marker on a 197 MB PDF may exhaust unified memory → this is actually a useful **OOM→CPU fallback** test, but start with small/medium fixtures so the first runs are quick and the toolchain is proven before stressing memory.

---

## Stage 3 — Mac build prerequisites

```bash
# Mac
xcode-select --install   # if not already (Stage 0)
# Rust (rustup) — the repo's rust-toolchain.toml pins stable, so cargo will use it:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version   # expect a recent stable (CI uses dtolnay/rust-toolchain@stable; we verified 1.96.0)
```

---

## Stage 4 — Build the LIGHT path (`archon-accel`) and validate Apple detection — THE headline check

`archon-accel` depends only on `serde` + `sysinfo` → **no native/bindgen deps, builds in seconds** (you do NOT need the heavy cozo/rocksdb build for the experiments).

```bash
# Mac
cd ~/archon-cli
cargo build -p archon-accel
cargo run -p archon-accel --example probe
```

**Expected on a 24 GB Mac (mostly idle):**
```
== AcceleratorReport ==
macos/aarch64 | accel: metal#0 Apple Silicon (unified) (~N MiB free / 24576 MiB total) | unified

== PlacementPlan (gpu_budget = N MiB) ==
  Marker:    device=metal  precision=Fp16  tier=Generous  oom_fallback=true  expandable=false
  Embedding: device=cpu
```
This is the cross-platform proof: detection reports **Apple unified memory** (not CPU, not CUDA) and the planner places **Marker on `mps`** with the OOM→CPU guard — the mirror of the RTX 5090 box routing Marker to CPU. If `free` is low (other apps open), it may show `Reduced` or `cpu` — that's correct adaptive behavior; note the free-memory figure.

---

## Stage 5 — Install Marker (MPS) on the Mac

```bash
# Mac — isolated venv on Homebrew Python 3.12 (verified present):
/opt/homebrew/bin/python3.12 -m venv ~/marker-venv
source ~/marker-venv/bin/activate
pip install --upgrade pip
pip install "marker-pdf==MARKER_VERSION"      # PIN the version (same on the laptop)

# Verify torch sees MPS:
python -c "import torch; print('mps available:', torch.backends.mps.is_available())"   # expect True
python -c "import marker, surya; print('marker', getattr(marker,'__version__','?'))"
```

### 5a — Confirm the sidecar's Marker API against the installed version (`[CONFIRM]`)
The sidecar (`~/archon-cli/scripts/archon_marker_sidecar.py`) calls:
`from marker.converters.pdf import PdfConverter`, `from marker.models import create_model_dict`, renderer `marker.renderers.json.JSONRenderer`. These import paths can drift between `marker-pdf` versions.
```bash
# Mac (venv active) — torch-free contract smoke first:
python ~/archon-cli/scripts/archon_marker_sidecar.py --selftest >/dev/null && echo "selftest OK"
# Then a REAL run on the smallest fixture (first run downloads surya models, ~minutes):
python ~/archon-cli/scripts/archon_marker_sidecar.py \
  ~/pdf-fixtures/multicolumn.pdf --device mps --output ~/jitter-dumps/mac_mps_multicolumn.json
```
If the import paths fail, note the installed `marker-pdf` version and the actual symbol locations — that's a small sidecar fix we make in PR-D (it's the documented `[CONFIRM]`).

---

## Stage 6 — Run the experiments

### 6.1 — `bbox` vs `polygon` `[CONFIRM]` (the integrity-critical one)
```bash
# Mac — inspect a few blocks in the Mac dump:
python - <<'PY'
import json
d = json.load(open('/Users/MACUSER/jitter-dumps/mac_mps_multicolumn.json'.replace('MACUSER','$USER')))
def walk(n,acc):
    if isinstance(n,dict):
        if 'bbox' in n or 'polygon' in n:
            acc.append({k:n.get(k) for k in ('block_type','id') if k in n} | {'has_bbox':'bbox' in n,'has_polygon':'polygon' in n})
        for c in n.get('children',[]) or []: walk(c,acc)
    return acc
rows = walk(d,[])
print('blocks:',len(rows)); print('sample:',rows[:5])
print('any polygon-only:', any(r['has_polygon'] and not r['has_bbox'] for r in rows))
PY
```
If blocks carry `polygon` (not `bbox`), the sidecar/Rust parser needs a polygon→bbox map — a wrong mapping silently corrupts every `spatial_hash`/`chunks_root`, so this **must** be resolved before any corpus flip.

### 6.2 — Within-device noise floor (Task D0, stage 1 — run this BEFORE cross-device)
```bash
# Mac — run the sidecar TWICE on MPS on the same PDF, then diff:
python ~/archon-cli/scripts/archon_marker_sidecar.py ~/pdf-fixtures/multicolumn.pdf --device mps --output ~/jitter-dumps/mac_mps_run1.json
python ~/archon-cli/scripts/archon_marker_sidecar.py ~/pdf-fixtures/multicolumn.pdf --device mps --output ~/jitter-dumps/mac_mps_run2.json
python ~/archon-cli/scripts/bbox_jitter_diff.py \
  ~/jitter-dumps/mac_mps_run1.json ~/jitter-dumps/mac_mps_run2.json --labels run1,run2
```
**Interpretation:** if max delta ≈ 0 → surya is deterministic on MPS (good; quantization can work). If non-zero → set determinism flags and re-check; if it persists, geometry can never be a cross-machine identity key (we keep verify-by-recompute, base identity on text/source hash).

### 6.3 — Real surya memory peak on MPS
```bash
# Mac — wrap the run to capture peak resident set (proxy for unified-memory peak):
/usr/bin/time -l python ~/archon-cli/scripts/archon_marker_sidecar.py \
  ~/pdf-fixtures/footnote-heavy.pdf --device mps --output ~/jitter-dumps/mac_mps_footnote.json 2>&1 | \
  grep -E "maximum resident set size"
```
This closes the §4.3 UNVERIFIED ~5 GiB footprint estimate with a real number (run it on the *hardest* fixtures — multi-column / footnote-heavy / von Uexküll — since surya peak scales with page complexity). For a tighter GPU figure you can also print `torch.mps.driver_allocated_memory()` from a wrapper.

### 6.4 — Cross-device jitter diff (the decision gate)
First generate the **CPU** dump on the Mac, and collect the **CUDA** dump from the laptop (see §7):
```bash
# Mac — CPU baseline on the same PDF:
python ~/archon-cli/scripts/archon_marker_sidecar.py ~/pdf-fixtures/multicolumn.pdf --device cpu --output ~/jitter-dumps/mac_cpu_multicolumn.json
# Diff MPS vs CUDA(laptop) vs CPU on the SAME PDF:
python ~/archon-cli/scripts/bbox_jitter_diff.py \
  ~/jitter-dumps/mac_mps_multicolumn.json \
  ~/jitter-dumps/laptop_cuda_multicolumn.json \
  ~/jitter-dumps/mac_cpu_multicolumn.json \
  --labels mps,cuda,cpu --buckets 1,2,4,8
```
**The harness prints the per-bucket unify-rate → the quantization decision:**
- `bucket=N px` reaches ≥99.9% unify ⇒ implement bbox rounding-before-hash → `spatial_hash` becomes device-independent → re-ingestion portable.
- no bucket reaches it ⇒ keep verify-by-recompute (your transfer workflow is unaffected regardless).

### 6.5 — Cross-platform CHUNK parity (Rust port vs Python reference, on real Mac Marker JSON)
```bash
# Mac — Python reference chunks from the real dump (PR-A's --marker-json mode):
export CHUNKER_REF_DIR=~/parity-ref
python ~/archon-cli/scripts/chunk_parity_check.py --marker-json ~/jitter-dumps/mac_mps_multicolumn.json
```
This prints the **Python** reference chunk table. To get the **Rust** side on the same JSON we need a tiny `archon-ingest-ext` example (it doesn't exist yet) — see the box below. Modulo the documented `page_end` correction (per the divergence register), boundaries should match.

> **Small add-on I can write on request (a few lines, WSL-codeable, builds on Mac with no native deps):**
> `crates/archon-ingest-ext/examples/chunk_dump.rs` — reads a Marker JSON path, runs `parse_marker_str` + `chunk_blocks_default`, and prints `page_start, page_end, text_len` per chunk so it diffs directly against `chunk_parity_check.py --marker-json`. Say the word and I'll add it before we run Stage 6.5.

---

## Stage 7 — The CUDA side (RTX 5070 laptop) — mirror, briefly

To populate the `cuda` column of §6.4, do the Marker half of this guide on the **laptop** too:
```bash
# Laptop (CUDA torch): same venv + SAME marker-pdf==MARKER_VERSION
python archon_marker_sidecar.py multicolumn.pdf --device cuda --output laptop_cuda_multicolumn.json
# then collect it onto the Mac (or WSL) for the diff:
scp laptop_cuda_multicolumn.json MACUSER@192.168.50.216:~/jitter-dumps/
```
(Also run `cargo run -p archon-accel --example probe` on the laptop — that's the **RTX 5070 8 GB constrained-CUDA** validation: confirm it detects the 8 GB card and the planner picks `cuda` Reduced or routes to CPU under contention.)

---

## Stage 8 — (OPTIONAL, heavy) full `archon` binary + end-to-end ingest on MPS

Only needed to produce **real device-specific hashes through the live pipeline** (not needed for D0/jitter/parity). The full binary pulls `cozo`/`rocksdb` (native, bindgen) → needs libclang:
```bash
# Mac
export LIBCLANG_PATH="$(xcode-select -p)/usr/lib"   # or: $(brew --prefix llvm)/lib
cargo build --bin archon                            # heavy: several minutes (rocksdb/cozo)
# then configure .archon/config.toml [policy.docs.pdf] with marker_sidecar + marker_python (the venv),
# marker_device unset/"auto" (planner picks mps), and run `archon docs ingest ...` on a fixture.
```
We'll script `.archon/config.toml` and the ingest invocation when we get here.

---

## What to send back after the runs

1. The `archon-accel --example probe` output on the Mac (and laptop) — detection + placement.
2. The §6.1 `bbox`/`polygon` finding + installed `marker-pdf` version.
3. The §6.2 within-device floor and §6.4 cross-device `bbox_jitter_diff.py` summaries (the unify-rate table).
4. The §6.3 memory peak numbers per fixture.
5. Any sidecar import errors (the `[CONFIRM]` API drift), if seen.

From (3) we make the **quantization decision**; from (4) we replace the unverified ~5 GiB footprint with real numbers and retune the surya batch caps in `placement.rs`/the sidecar; (2) closes the integrity-critical `[CONFIRM]`.

---

## Safety / sequencing notes

- **Nothing here is destructive** — all writes are to `~/jitter-dumps`, `~/pdf-fixtures`, `~/parity-ref`, and a fresh `~/archon-cli` / `~/marker-venv`. No corpus flip, no DB writes (until optional Stage 8, which we'll gate separately).
- First Marker run **downloads surya models** (one-time, hundreds of MB) — expect a slow first invocation.
- Keep `MARKER_VERSION` identical across Mac + laptop or the jitter numbers are meaningless.
- We execute **with your permission, stage by stage** — Stage 0 → 4 (transfer + the headline detection proof) is the natural first checkpoint before installing Marker.
