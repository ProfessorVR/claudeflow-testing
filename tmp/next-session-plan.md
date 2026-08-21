# Next Session Plan: God-Write Parity + Multi-Prompt Completion

## Context
Branch: `writing-pipeline-v2`
Last commits: `d6986c803` (comprehensive hardening), `d249301de` (logging cleanup + multi-prompt harness)
Verification: 77/77 tests passing (`npx tsx scripts/verify-hardening.ts`)
Regression matrix: `tmp/prompt-regression-matrix.md` (2 of 4 profiles completed)

## Session State
The ICP pipeline has been comprehensively hardened across 3 sessions (2026-04-07 to 2026-04-09). All 15 original hardening items (H-01 through H-15) plus 35 additional tasks are complete. The only pending task is #47 (optional Levenshtein fuzzy matching, deferred to evidence-based trigger).

Key infrastructure built:
- `src/god-agent/shared/cross-author-utils.ts` — bridge detection, tension matching, manifest canonicals, query expansion, corpus catalog
- `src/god-agent/shared/jsonl-loaders.ts` — centralized cache for compiled-index, author KU index
- `scripts/verify-hardening.ts` — 77 verification tests
- `scripts/icp-multi-prompt-test.ts` — 4-profile regression harness

## What To Do

### Task 1: Complete Multi-Prompt Validation (remaining 2 profiles)

Run the multi-author and secondary-scholarship profiles:
```bash
npx tsx scripts/icp-multi-prompt-test.ts multi
npx tsx scripts/icp-multi-prompt-test.ts secondary
```

Watch for:
- **multi**: Does the pipeline handle 3 authors (Burke, Rickert, Heidegger)? Do bridges fire between them? Is citation coverage reasonable?
- **secondary**: Does the pipeline correctly prioritize Frede, Caston, Nussbaum as secondary scholarship? Does the authority tier distinction hold?

Results append to `tmp/prompt-regression-matrix.md`.

### Task 2: God-Write Path Parity Check (Task #53)

The ICP pipeline (icp-orchestrator.ts → constrained-generator.ts) has been hardened, but the god-write pipeline (write-pipeline-orchestrator.ts → gold-standard-prompt-builder.ts) shares some infrastructure:
- `gold-standard-prompt-builder.ts` — has the `<final_directive>`, OVERRIDE STYLE PROFILE, and [6d] MANDATORY THEORETICAL SYNTHESIS
- `quality-integration.ts` — validateEdgeCoherence, validateTensionAwareness, detectUnanchoredEdges
- `cross-author-utils.ts` — getActiveBridges, expandQueryWithCanonicalTerms
- `jsonl-loaders.ts` — loadCompiledIndex, loadReasoningEdgesAsync

What to verify:
1. Run `/god-write` with the cross-author prompt: "The role of phantasia and Erschlossenheit in disclosing the environment"
2. Check logs for:
   - `[SmartRetrievalLayer] Query expanded:` — confirms canonical term boosting
   - Cross-pipeline hooks in the prompt — confirms [6d] fires
   - `<final_directive>` at the end of the prompt
3. Check the generated output for parenthetical citations, cross-author synthesis, tension acknowledgment
4. The god-write path does NOT have Stage 6b (bridge enforcement) or Stage 8a (preventive coherence) — those are ICP-only. Assess whether the gold-standard-prompt-builder's [6d] static hook injection is sufficient or if the god-write path needs equivalent hardening.

### Task 3: Assess Citation Coverage Gap

Across 22+ E2E test runs, citation coverage has ranged from 0% to 20.3%. The closed-book constraint trades coverage for accuracy. For the next session:
- Review the generated prose from the regression runs qualitatively
- Determine if 10-20% parenthetical coverage is acceptable for a draft that will be manually enriched
- If not, consider: lowering `claimMinTopicOverlap` from 0.3 to 0.15, or adding a per-paragraph citation injection pass

### Task 4 (Optional): Run Remaining Infrastructure Backlog

Only if time permits:
- Task #47: Levenshtein fuzzy-matching — only if regression runs show title matching failures
- Per-chunk OCR scoring in ingestion — only when adding new texts

## Key File References
- SITREP: `tmp/SITREP_2026-04-09_120000.md`
- System analysis: `tmp/comprehensive-system-analysis-20260407.md` + `20260408.md`
- Regression matrix: `tmp/prompt-regression-matrix.md`
- Verification suite: `scripts/verify-hardening.ts` (run with `npx tsx scripts/verify-hardening.ts`)
- Multi-prompt harness: `scripts/icp-multi-prompt-test.ts`
- Memory: `.claude/projects/-home-dalton-projects-claudeflow-testing/memory/project-icp-hardening-sessions.md`

## Pre-Flight Checks for New Session
```bash
# Verify services
curl -sf http://localhost:8000/ && echo "Embedding OK"
curl -sf http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections && echo "ChromaDB OK"

# Verify tests
npx tsx scripts/verify-hardening.ts

# Check git status
git log --oneline -3
git status --short -- src/ scripts/
```
