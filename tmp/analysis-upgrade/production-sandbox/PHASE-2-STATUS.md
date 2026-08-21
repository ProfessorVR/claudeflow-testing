# Phase 2 — COMPLETE ✅

**As of:** 2026-04-19 — all consumer wiring done, O1 gate PASSING.

---

## What's DONE

| # | Item | File(s) touched | Notes |
|---|---|---|---|
| Env | `CORPUS_INDEX_PATH` env var with live fallback | `src-worktree/src/god-agent/shared/jsonl-loaders.ts` | `loadCompiledIndex` env var > live default |
| H1 | `getActiveBridges` cap 1 → 3 | `src-worktree/src/god-agent/shared/cross-author-utils.ts` | |
| H1 | `getActiveTensions` cap 3 → 5 | `src-worktree/src/god-agent/shared/cross-author-utils.ts` | |
| B2 | `Claim`, `ConceptMention`, `BridgeCandidate` TS interfaces; extended `CompiledIndex` with optional `claims`, `conceptMentions`, `bridgeCandidates`; added optional claim-provenance fields on `CrossPipelineHook` in both `corpus-index-provider.ts` and `cross-author-utils.ts` | `src-worktree/src/god-agent/universal/corpus-index-provider.ts` + `.../shared/cross-author-utils.ts` | All new fields optional — graceful fallback when extractor outputs absent |
| B3 | `loadActiveClaims(topic, options)` | `src-worktree/src/god-agent/universal/corpus-index-provider.ts` | Top-K claims by term-frequency, filterable by speaker/stance/use-mention/faithfulness/claim-type. Default faithfulness allowlist: `author-endorsed`, `supported`. Returns `{ claimLines, totalEvaluated, totalFiltered }` |
| B4 | `## ACTIVE CLAIMS (FROM SECONDARY LIT)` prompt block emission + `activeClaims` field on `GoldStandardPromptOptions` + `RollingContextSectionPromptOptions` | `src-worktree/src/god-agent/universal/gold-standard-prompt-builder.ts` (2 emission sites, with explicit use/mention discipline guidance) | |
| B4 | `claimLines` threaded through 6+ call sites in write pipeline | `src-worktree/src/god-agent/universal/write-pipeline-orchestrator.ts` (inline load + 5 prompt-build calls + `writeRollingContext` signature + rolling section prompt) + `.../universal/stages/retrieval-stage.ts` + `.../stages/stage-types.ts` (`RetrievalResult.claimLines`) | Graceful fallback: empty array when compiled index has no `claims` field |
| B5 | Ontology embeddings bootstrap | `data/corpus/index/ontology-embeddings.v1.jsonl` (9.1MB, 277 × 1536-D) + symlink → v1 + `releases/release-1.json` + `ARTIFACT-MANIFEST.json active_release=1` | |
| B6 | Extractor scripts + prompts + wrappers | `src-worktree/scripts/analyze-claims/` (extractor.py, fuzzy_match.py, pdf_utils.py, evaluate.py, resolve_concepts.py, generate_bridges.py, recompile_index.py, prompts/{candidate_primary,candidate_secondary,verify_faithfulness,judge_precision,judge_recall}.md, analyze-primary.sh, analyze-secondary.sh, README.md) | All accept `CORPUS_INDEX_PATH` env var for sandbox isolation |
| B7 | Taxonomy prompt revisions for 5 flagged categories | `src-worktree/scripts/analyze-claims/prompts/candidate_primary.md` + `.../candidate_secondary.md` | Addresses: (1) `exegetical_claim` excluded from primary texts; (2) aporetic question-form overrides thetic; (3) predecessor-report precedence over dialectical-objection; (4) reductio reconstruction = predecessor_report; (5) terminology borrowing with endorsement = use, not mention |
| B1 | Sandbox-aware recompile flow | `recompile_index.py` gains `--index-path` and `--bootstrap-empty` args; handles both `<slug>-claims.jsonl` and `claims.jsonl` file patterns | Chain approach — leaves live `compile-corpus-index.py` unchanged. See §Phase 6 B1-merge note below |

---

## O1 gate — PASSING end-to-end

```
smoke pass: no NEW live production file changes since baseline
smoke pass: no new tsc errors relative to baseline
claim round-trip: compile PASS; godwrite check skipped (scripts/god-write-minimal.sh not present)
claim round-trip: PASS
smoke pass: claim round-trip PASS
smoke test: PASS (sandbox)
```

- `corpus-index-provider.ts` → adds claim types, `loadActiveClaims` → emits markdown lines.
- Prompt builder → new `## ACTIVE CLAIMS` block at 2 emission points, with use-mention discipline.
- Pipeline orchestrator → threads `claimLines` through 6 prompt-build sites + rolling-context writer.
- Python recompile → consumes per-paper sidecars and writes into compiled-index `claims`/`conceptMentions`/`bridgeCandidates` arrays plus promoted hooks and novel ontology nodes.

The hand-crafted claim RT-0001 seeded into `data/corpus/index/test-paper/claims.jsonl` is:
- picked up by `recompile_index.py --bootstrap-empty`
- merged into `compiled-index.json`
- ready to be surfaced by the TS `loadActiveClaims` function in the next write invocation.

(The godwrite check remains skipped because the sandbox has no minimal god-write wrapper. A full `run-ab.sh` invocation will exercise it in Phase 5 prerequisites.)

---

## Phase 6 note — B1 merge decision

Approach chosen: **chain** (compile then recompile) rather than **merge** (inline sidecar logic into `compile-corpus-index.py`). This keeps the 1329-line live compiler untouched during Phase 2 and isolates the new behavior to `recompile_index.py`.

For Phase 6 promotion, two options:

**(a) One-line delegation in live `compile-corpus-index.py`** — add a final block:
```python
if args.enable_claims_recompile:
    from subprocess import run
    run([sys.executable, str(Path(__file__).parent / "analyze-claims" / "recompile_index.py"),
         "--index-path", str(INDEX_DIR)], check=True)
```

**(b) Document two-step operation** in the post-promotion runbook. Simpler, but requires all callers to remember both steps.

Recommendation: (a) with a feature-flag default-off at promotion, flipped on as a Phase-6 sub-step after post-promotion smoke passes. This keeps rollback atomic at the bundle level.

---

## Sandbox isolation confirmation

Live-tree `git status --porcelain -- src/god-agent scripts/compile-corpus-index.py corpus/index`: **97 lines (unchanged from Phase 1 baseline).** All edits live in `tmp/analysis-upgrade/production-sandbox/src-worktree/`.

Worktree dirty file list:
- `src/god-agent/shared/jsonl-loaders.ts` (env var)
- `src/god-agent/shared/cross-author-utils.ts` (caps + types)
- `src/god-agent/universal/corpus-index-provider.ts` (types + loadActiveClaims)
- `src/god-agent/universal/gold-standard-prompt-builder.ts` (prompt block)
- `src/god-agent/universal/stages/retrieval-stage.ts` (claimLines plumbing)
- `src/god-agent/universal/stages/stage-types.ts` (RetrievalResult field)
- `src/god-agent/universal/write-pipeline-orchestrator.ts` (6 injection points + rolling)
- `scripts/analyze-claims/` (entire new directory from B6)
- `corpus/index/compiled-index.json` (pre-existing diff, not caused by phase-2 work)
- `.claude/runtime/leann-index-queue.json` (pre-existing runtime housekeeping)
- `.god-agent/streamdeck-mode` (pre-existing runtime)

---

## Phase 3 gate — ready, requires user authorization

Next action: **Phase 3a canary extraction (3–5 PDFs, ~$2 API spend).** The extractor is wired and ready:

```bash
export CORPUS_INDEX_PATH=/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox/data/corpus/index

# Canary candidates (unprocessed by prior sandbox work):
#   - 1 phantasia commentator: Frede 1992 (or similar)
#   - 1 rhetoric-tradition: O'Gorman 2005 (or similar)
#   - 1 non-phantasia: Burnyeat or Bowin
bash /home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox/src-worktree/scripts/analyze-claims/analyze-secondary.sh <pdf-1>
# ... etc
```

**Awaiting explicit user approval** before calling the Anthropic API at any scale.

Further downstream:
- Phase 3b full batch (~30 PDFs, ~$15) — after 3a passes gates.
- Phase 4 resolver gold set (50 dev + 20 holdout, ~4 hr human annotation) — user domain expertise required.
- Phase 5 prerequisites (harness + canonical suite + release bundles exercise) then E0–E8 ladder (~$17 + 27 hr).
- Phase 6 promotion (~30-min write-freeze window) — coordinate with dissertation writing schedule.
