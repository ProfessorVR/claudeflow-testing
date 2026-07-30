# Boot prompt for the fresh session (paste everything below the line)

---

Continue the index/ingestion overhaul (claudeflow-testing → archon-cli migration). We are at the
start of Phase F1: the full-corpus re-ingest is built, validated, and DELIBERATELY PAUSED awaiting
my go.

First, read these in order — they are the complete state:
1. `plans/index-overhaul-2026-07-29/HANDOFF-F1-READY-2026-07-30.md` (the handoff — goal, what's
   done, what remains, all paths, and the operational gotchas; treat its §5 gotchas as binding)
2. `plans/index-overhaul-2026-07-29/phase1-final-plan/01-FINAL-OVERHAUL-PLAN.md` (authoritative
   plan; we are at Phase F)
3. The memory file `project-index-overhaul-2026-07-29.md` (auto-memory; 2026-07-30 session block)

Standing rules that override defaults:
- Work happens in `/home/dalton/projects/archon-cli`, branch `feat/wraith-retrieval`. Push ONLY to
  the `private` remote (ProfessorVR/archon-cli-private, SSH). Origin and forks are PUBLIC — pushing
  there would publish my dissertation index.
- WRAITH is fully retired (including the bge reranker — an accepted loss; never reintroduce or
  relitigate). archon-coder is abandoned; archon-cli is not.
- No multi-agent Workflows without my per-run permission. Ultracode is off.
- Build with `PATH=$HOME/.cargo/bin:$PATH LIBCLANG_PATH=/usr/lib/llvm-18/lib` and verify the binary
  mtime after building (a stale-binary footgun burned us once).

Current state in one paragraph: the pipeline is airtight-on-every-ingest (inline sentence layer,
S8 OCR quality arbiter, admissibility gate, fixed scan classifier, footnote retention — all proven
on King/Kassel/White-1985); C8 re-anchoring is closed (65.3% exact + 20.4% near-verbatim of 4,872
clauses) and the anchors are WRITTEN INTO `corpus_clauses` (3,181 exact + 993 annotations, zero
quarantined); the F1 driver (`archon-cli/scripts/corpus-import/f1_reingest_driver.py`) is validated
on the worst ligature doc with its report in `.archon/corpus-import/f1-report.jsonl`.

Your first actions:
1. Verify state: `git log --oneline -8` in archon-cli; `python3
   scripts/corpus-import/f1_reingest_driver.py --plan`; read the validation row in
   `.archon/corpus-import/f1-report.jsonl`.
2. Confirm with me, then start the full staged re-ingest (`--all`, or `--limit` batches if I ask) —
   serial, resumable, ~8–15 GPU-hours for ~227 docs. Monitor per-doc deltas from
   `f1-report.jsonl` and report regularly. The driver already handles GPU preflight (ollama
   unload), docid-remap, ledger purge, re-anchor, and anchor apply.
3. After the batch: rerun `archon corpus-index probes` + the gate suite
   (`scripts/checkers/emit_gates.py`), and give me corpus-wide before/after (spatial coverage,
   sentence-bbox, ligature docs → expect 0).
4. Then queue: Phase-F prose extractors (~5,600 spans: BCAP/Boredom/B&T/FCM — see handoff §4.2),
   F2 triage (520 not-founds, 130 drift, 5 not-in-corpus sources needing my acquisition decision),
   and the engineering-debt list (handoff §4.4).

Re-ingest constraints I have already given: ignore the claudeflow corpus folders
`.extracted_media`, `dissertation`, `download`, `index`, `Part_II` in any directory-level ingest;
the `Virtual Learning Environments` folder is now `virtual_learning_environments` (already
renamed, manifest updated).

Pause for my decision before anything destructive or outward-facing, keep commits on the private
remote only, and give me regular progress updates.
