# TRAVEL GUIDE — Running the Stage 3 Drafting Workflow on CHIMERA (2026-07-17)

**Purpose.** Step-by-step guide for running the Part III desktop-section guided drafting
workflow (per `HANDOFF-DESKTOP-SECTION-STAGE3-DRAFTING-2026-07-16.md`) on the CHIMERA laptop
while travelling. Written after transfer verification 2026-07-17; everything below was checked
live on CHIMERA unless marked otherwise.

---

## 1. Component map on CHIMERA (verified 2026-07-17)

| Component | Path on CHIMERA | Verified state |
|---|---|---|
| God-agent (writing-pipeline-v2) | `~/projects/claudeflow-testing-writing-pipeline-v2` | worktree @ `b766783a`, branch `writing-pipeline-v2`; `dist/`, `node_modules/`, `.env` present (prebuilt dist — do NOT `npm run build`, the branch has pre-existing TS errors on both machines) |
| Dissertation working set | `…-writing-pipeline-v2/tmp/Dissertation/` | **rsync'd 2026-07-17** (156MB — was MISSING from the original transfer because `tmp/` is untracked); includes `Part_III/` (outline, handoff, survey-analysis, reanalysis, sources), Part II drafts, `REVISION-PROTOCOL.md` |
| Archon-cli (drafting build) | `~/archon-cli-travel` | worktree @ `740d3ea4`, binary `archon 1.3.11 (740d3ea4)` at `target/debug/archon` |
| Shared archon data store | `~/archon-cli/.archon/` (2.1G) | per-item symlinks from `~/archon-cli-travel/.archon/` (data shared, `config.toml` local); HNSW snapshot `doc-text-20260717T194332Z` present |
| Corpus PDFs | `~/archon-cli/corpus/` (1.9G) | **rsync'd 2026-07-17** (was missing — needed by the `/curate` red-box page viewer); symlinked at `~/archon-cli-travel/corpus` and `~/projects/archon-cli` → `~/archon-cli` (mirrors the desktop's absolute paths recorded in the DB) |
| Claude Code memory | `~/.claude/projects/-home-dalton-projects-claudeflow-testing-writing-pipeline-v2/memory/` | copied from the desktop project's memory 2026-07-17 (style locks, protocols, project state) |
| Retrieval path | end-to-end | **exercised 2026-07-17**: exact-mode returns `exact-1.00 · bbox ✓`; hybrid CSCL probe ranks Kreijns 2003 #1; cold ~21s, warm ~7s (desktop is ~3s — laptop parity acceptable) |

CHIMERA quirks: SSH from outside lands in **Windows cmd.exe** — wrap commands as
`ssh dalton@192.168.50.243 "wsl -e bash -lc '…'"` or pipe a script into `wsl -e bash -ls`.
WSL reaps background jobs when an SSH session closes — run long jobs foreground.
`claude` lives under nvm (`~/.nvm/versions/node/v22.21.1/bin/claude`) — present in interactive
shells; if a non-interactive shell can't find it, `source ~/.nvm/nvm.sh` first.

## 2. Starting a drafting session (each time)

1. Open a WSL terminal on CHIMERA (locally; not over SSH for interactive work).
2. `cd ~/projects/claudeflow-testing-writing-pipeline-v2`
3. `claude` — start the session, then paste/point it at
   `tmp/Dissertation/Part_III/HANDOFF-DESKTOP-SECTION-STAGE3-DRAFTING-2026-07-16.md`
   with an instruction like: "Read this handoff and the outline, then resume Stage 3 at the
   next unfinished module." The project memory (style locks, protocols) loads automatically —
   it was copied to this machine's project slug.
4. **OPENAI_API_KEY bug — FIXED IN CODE 2026-07-17.** CHIMERA's `~/.bashrc:134` exports
   `OPENAI_API_KEY`, and the shipped build's doc-store embedder auto-detected it and switched
   to OpenAI embeddings — panicking in tokio and wrong-dim (1536 vs the 768-dim snapshot)
   besides. Fixed in `crates/archon-docs/` (embed_config.rs / embed.rs / embed_openai.rs):
   `Auto` now opts into OpenAI only on the archon-specific keys (`ARCHON_DOCS_OPENAIKEY` /
   `ARCHON_MEMORY_OPENAIKEY`), and the OpenAI provider runs its blocking HTTP off the async
   runtime (graceful errors, no panic). Patched sources + rebuilt binary deployed to
   CHIMERA and verified with the real key present; desktop verified on the same build.
   `./target/debug/archon` is safe to call directly again. The wrapper
   `~/archon-cli-travel/archon` remains as harmless belt-and-suspenders (use either).
   The fix is UNCOMMITTED working-tree changes on the desktop checkout (branch
   `archon-coder/run-6a16cb60…`) pending user sign-off — do not discard them; a rebuild from a
   clean checkout resurrects the bug (the wrapper then covers you).
5. Quick archon smoke test (once per trip, ~10s warm):
   `cd ~/archon-cli-travel && ./archon evidence find "necessary but not sufficient" --mode exact`
   — expect `exact-1.00 · bbox ✓` hits, Moss 2012 at 1.000. (Piping to `head` triggers a
   harmless broken-pipe panic after the listed hits — cosmetic.) If the binary is missing (a
   `cargo clean` can wipe it):
   `source ~/.cargo/env && export LIBCLANG_PATH=/usr/lib/llvm-18/lib && cargo build --bin archon`
6. **Pre-departure offline test (once, before leaving home wifi):** disconnect CHIMERA from the
   network and run one `--mode hybrid` query **via the wrapper**. (The 2026-07-17 "offline
   failure" turned out to be the OPENAI_API_KEY bug above, not a missing model — so offline
   semantic search is still *probable, not proven*: the warm-cache timing suggests the BGE model
   is cached locally, but the file was never positively located.) Exact-mode retrieval is
   DB-only and safe offline regardless. If the offline hybrid test fails, run one hybrid query
   online and re-test.

## 3. The drafting loop itself (unchanged from the handoff)

Per `HANDOFF …STAGE3…` §4 — the protocol is machine-independent:
1–3 paragraphs at a time, paragraph plans first, user approval before drafting, module order
M0 → M7. Register, band/hinge discipline, citation rules, and glossary policy all as written
in the handoff. Literature verbatims via archon:

- Exact pull: `./archon evidence find "<verbatim>" --mode exact` (wrapper — see §2.4)
- Discovery:  `./archon evidence find "<query>" --mode hybrid`
- Deeper curation: `archon evidence curate "<question>"` (needs internet — Sonnet RA) or the
  `/curate` TUI (`o` renders the page with the red box — works now that `corpus/` is on disk).
- Accept only `exact-1.00 · bbox ✓`; quote text enters prose only as the retrieved span.

Guardrails that still apply on the road: M2.3 blocked on the arc-placement fork; M4.4
soft-blocked on the Part II closing differential; DA-10 honesty clause at M4.3; Barrett not
"Colin"; `PageNumber` locators LOW TRUST (chunk page + P2 sub-span resolution is the
trustworthy layer); `****** UNVERIFIED:` for anything unverifiable.

## 4. Single-machine sync mode (differs from the desktop)

CHIMERA has **no** `.claude/worktrees/boredom-cluster-phase4-5` mirror. While travelling:
- Work directly on the single copy under
  `~/projects/claudeflow-testing-writing-pipeline-v2/tmp/Dissertation/Part_III/`.
- Keep the backup rule: timestamped copies into `Part_III/.backups/` before substantive edits.
- **The CHIMERA copy is authoritative for the duration of the trip.** Do not edit the desktop
  copy remotely while travelling.

**Return-home procedure (do this before resuming work on the desktop):**
1. From the desktop:
   `rsync -a --info=stats2 --rsync-path="wsl rsync" dalton@192.168.50.243:/home/dalton/projects/claudeflow-testing-writing-pipeline-v2/tmp/Dissertation/ /home/dalton/projects/claudeflow-testing/tmp/Dissertation/`
2. Re-sync the desktop worktree mirror (`cp` outline/handoff into
   `.claude/worktrees/boredom-cluster-phase4-5/tmp/Dissertation/Part_III/`), then diff the two
   copies per the standard workflow before any new session edits.
3. If memory files were updated on CHIMERA, merge them back by hand (they diverge silently).

## 5. Git / services discipline on CHIMERA

- **No commits or pushes from CHIMERA** during the trip (verification-gated workflow; commits
  happen on the desktop after sign-off). `tmp/Dissertation/` is untracked anyway; note any
  corpus/index edits that will need a desktop commit in a running note file.
- God-agent services (vLLM, ChromaDB, embedding server) are **not running** on CHIMERA and are
  not needed for this workflow: the analytic layer is file-based (`corpus/index/` FIRST rule).
  Don't run `/god-launch` there.
- Drafting requires internet regardless (Claude itself). Archon `evidence find` exact/hybrid is
  fully local; `evidence curate` and any `/draft` run need the API (key is in the travel
  worktree's local `.archon/config.toml`, verified present).

## 6. Known differences / limitations vs. the desktop

- Warm retrieval ~7s (vs ~3s desktop) — RTX 5070 laptop, WSL disk; fine for the loop.
- `npm run build` fails on this branch on BOTH machines (pre-existing TS errors) — always run
  from the prebuilt `dist/`.
- **Archon OPENAI_API_KEY bug — fixed in code 2026-07-17** (see §2.4); commit of the 3-file
  `archon-docs` patch awaits user sign-off on the desktop checkout. The `[memory]
  embedding_provider` knob (a different subsystem) is pinned to `local` on CHIMERA — harmless,
  matches how the store was built; config backup at
  `~/archon-cli-travel/.archon/config.toml.bak-2026-07-17`.
- The Stream Deck integration, dashboards, and OCR/Marker ingestion stack are desktop-only.
  Marker matters only for ingestion, not retrieval — do not ingest new PDFs on CHIMERA (if you
  must, remember the OP rule: `archon docs vector-compact` after ANY ingest, then note that the
  desktop and laptop stores have diverged and the desktop will need the same ingest re-run).
