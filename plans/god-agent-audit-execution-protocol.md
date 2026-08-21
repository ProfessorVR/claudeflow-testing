# God Agent Audit — Execution Protocol

**Date**: 2026-03-28
**Companion**: `plans/god-agent-audit-implementation-guide.md` (the remediation plan)
**Purpose**: Defensive execution protocol for safely running an autonomous AI coding agent against a 361K LOC codebase.

---

## 1. Environment: Git Worktree Isolation

Do not run the agent in your primary working tree.

### Setup

```bash
# Create worktree OUTSIDE the main repo directory to prevent cross-traversal
git worktree add ../god-agent-audit audit-fixes --no-track -b audit-fixes

# Work from the worktree for all agent sessions
cd ../god-agent-audit
```

### Why Worktree Over Docker

- Phases 1-7 are pure code edits verified by `tsc --noEmit` and `vitest` (mocked tests). No live services needed.
- WSL2 + Docker volume mounts impose severe I/O penalties on `tsc` across 361K LOC.
- Worktree gives full file-system isolation — the agent cannot modify your primary working tree.
- If the worktree is corrupted, delete it and recreate from the last good commit.

### Exception: Phase 8 Manual Testing

Phase 8.2B ("manually test dashboard ICP workflow end-to-end") requires the live service stack (ChromaDB :8001, embedding :8000, express :3847). For this step only, either:
- Run against your development services with database backups taken first, OR
- Stand up an ephemeral Docker Compose environment with throwaway volumes.

---

## 2. Pre-Flight Baseline

Before starting any phase, capture the current state. These numbers must not regress.

```bash
# Run once before Phase 1 — record these values
echo "=== BASELINE $(date) ==="
echo "TS errors: $(npx tsc --noEmit 2>&1 | grep -c 'error TS')"
npx vitest run --reporter=json 2>/dev/null | jq '{passed: .numPassedTests, failed: .numFailedTests}'
```

After each phase: TS error count must not increase. Test pass count must not decrease.

---

## 3. Phase Execution: Human-in-the-Loop Micro-Loop

For every phase, follow this exact sequence. No shortcuts.

### Step 1: Invoke with Scope Constraints

Start a Claude Code session and provide this prompt template:

```
Read plans/god-agent-audit-implementation-guide.md and execute Phase [N].

Constraints:
- Only modify files explicitly listed in the phase instructions.
- If you believe a file outside this list needs changes, STOP and explain why before editing.
- Do not modify, delete, or reference any file under src/god-agent/__experimental__/.
- Do not modify test files unless the phase explicitly instructs you to (Phase 6.6 only).
- Do not commit. Stop and wait for my approval once the code is written.
- If tests fail, you may attempt to fix source code (NOT tests) up to:
  - 2 retries for tsc --noEmit failures
  - 1 retry for vitest failures
  If still failing after retries, stop and explain the issue.
```

### Step 2: Mechanical Scope Check

Before reading the code diff, run the scope check:

```bash
# Update ALLOWED_FILES per phase (see Appendix A)
CHANGED=$(git diff --name-only)
for f in $CHANGED; do
  echo "$ALLOWED_FILES" | grep -qxF "$f" || echo "OUT OF SCOPE: $f"
done
```

If ANY file prints as out of scope, reject the entire changeset without reviewing the code. Instruct the agent to revert the out-of-scope changes and explain why it touched them.

### Step 3: Manual Diff Review

```bash
git diff
```

Check specifically for:
- Collateral damage: removed unrelated imports, reformatted adjacent code
- Type coercion: `as any` casts to bypass errors the agent didn't understand
- Hallucinated dependencies: new imports that don't exist in `package.json`
- Silent behavior changes: modified default values, removed error handling

### Step 4: Agent-Driven Verification

Once the diff looks correct, instruct the agent to run the phase-specific verification commands listed at the bottom of each phase in the implementation guide.

### Step 5: Commit

Only after tests pass:

```bash
git add <specific-files-from-phase>
git commit -m "fix(audit): Phase N — [brief description]"
```

Use `git add` with explicit filenames, not `git add -A`.

**New file staging**: Phases that create new files (8.1 may populate `retrieval-stage.ts` stub, 8.2A creates `retrieval-utils.ts`, 8.3 creates `shared-types.ts` + ADR) require `git add` for both modified AND newly created files. Verify with `git status` that no new files are left untracked before committing.

---

## 4. Cross-Phase Regression Gates

Per-phase verification only tests the affected subsystem. Cross-phase gates catch interaction effects.

| After Phase | Full Regression Check |
|---|---|
| 2 | `npx vitest run --reporter=verbose` (full suite) |
| 4 | `npx vitest run --reporter=verbose` + `npx tsc --noEmit` |
| 6 | Full suite + `tsc` (TS error count should reach 0, excluding `__experimental__/`) |
| 7 | Full suite + `tsc` + `git push origin audit-fixes` for CI |

### If a Cross-Phase Gate Fails

Per-phase commits make regressions attributable. With 2-3 commits between gates, manual checkout is faster than `git bisect`:

```bash
# Example: Phase 4 gate fails. Check if Phase 3 or Phase 4 broke it.
git stash
git checkout <phase-3-commit-hash>
npx vitest run --reporter=verbose
# If passes → Phase 4 introduced the regression
# If fails → Phase 3 introduced the regression
git checkout audit-fixes  # return to tip
git stash pop
```

---

## 5. Rollback Policy: Revert by Default

When a phase introduces a regression:

**Default — Option A (Revert and re-execute):**
```bash
git revert <bad-phase-commit>
```
Then re-invoke the agent for that phase with additional context about what went wrong and why. The agent solves the root problem from a clean slate rather than patching symptoms on a broken foundation.

**Exception — Option B (Fix forward):**
Only when ALL of the following are true:
1. The phase's fix is verifiably correct (the logic change is right)
2. The regression is in a different subsystem (a latent bug exposed by the fix)
3. The latent bug is simple and well-understood

If in doubt, revert. Fixing forward on a broken base invites compounding brittle patches.

---

## 6. Context Management: Session Boundaries

### Phases 1-7: One Session per Phase

Each phase gets its own Claude Code session. This ensures:
- The agent reads the CURRENT file state (post-prior-phases), not stale cached versions
- The context window isn't diluted by thousands of lines of prior-phase diffs
- A bad session can be killed without losing unrelated work

### Phase 8: Sub-Session Boundaries

Phase 8 is split across two sessions based on risk:

| Sub-task | Risk | Session |
|---|---|---|
| 8.1 Extract retrieval logic | Medium | Session A |
| 8.2A Extract utility functions | Low | Session A |
| 8.2B Rewire routes + delete adapter | **High** | Session B (fresh) |
| 8.3 ADR + type dedup | Low | Session B |
| 8.4 Type writeV2 options | Medium | Session B |

**Critical**: Start a fresh session before 8.2B. The agent must read the current state of `icp-api-routes.ts` and `ICPOrchestrator` as they exist after 8.2A, not from cached memory of reading the plan.

### What to Preserve Across Sessions

- **Persistent memory** (`.claude/` auto-memory, `.agentdb/`): KEEP. Contains project-level facts (path aliases, service ports, routing rules) that every phase needs.
- **Conversational context**: CLEAR (by starting a new session). Contains stale file snapshots and prior-phase reasoning that pollutes the current task.

---

## 7. Retry Discipline

### `tsc --noEmit` Failures: 2 Retries

Type errors are deterministic. The agent can read the error, trace the type chain, and fix it. Two attempts is usually sufficient.

### `vitest` Failures: 1 Retry

If the agent's first fix doesn't resolve a test failure, it is likely misunderstanding the test's intent. A second retry typically leads to the agent modifying test assertions rather than fixing source code.

### Hard Rule: Do Not Modify Test Files

Unless the phase explicitly instructs it (Phase 6.6 only), the agent must not modify any file under `tests/`. If a test fails, the source code is wrong — not the test. If the agent claims a test is outdated or incorrect, it must stop and explain to you rather than changing the test.

### Infinite Loop Prevention

If the agent enters a fix-break-fix cycle (changing code, running tests, changing code again), interrupt after the retry limit and manually inspect. The agent's edit history in the session will show whether it's converging on a solution or oscillating.

---

## Appendix A: Per-Phase File Allowlists

Update the `ALLOWED_FILES` variable in the scope check script for each phase.

### Phase 1
```
src/god-agent/cli/phd-cli.ts
src/god-agent/cli/quality/endnote-generator.ts
src/god-agent/cli/quality/open-access-searcher.ts
src/god-agent/cli/dissertation/tools/tool-executor.ts
```

### Phase 2
```
src/god-agent/core/writing/corpus-constraint-builder.ts
src/god-agent/core/composition/icp-orchestrator.ts
src/god-agent/core/writing/citation-enforcer.ts
src/god-agent/core/writing/citation-validator.ts
src/god-agent/core/writing/quotation-fidelity-validator.ts
```

### Phase 3
```
src/god-agent/core/reasoning/training-trigger.ts
src/god-agent/core/reasoning/weight-manager.ts
src/god-agent/core/router/circuit-breaker.ts
src/god-agent/core/router/retry-handler.ts
src/god-agent/core/router/rate-limiter.ts
```

### Phase 4
```
src/god-agent/core/composition/icp-pipeline-adapter.ts
src/god-agent/core/composition/icp-orchestrator.ts
src/god-agent/core/router/providers/anthropic-provider.ts
src/god-agent/core/reasoning/training-history.ts
```

### Phase 5
```
src/god-agent/core/writing/comprehensive-claim-validator.ts
src/god-agent/core/writing/claim-verifier.ts
src/god-agent/core/writing/inline-validation-orchestrator.ts
```

### Phase 6
NOTE: Fix 6.1 modifies logger.ts + 7 consumer files (~20 files total in this phase).
Before executing Phase 6, grep for StructuredLogger imports to identify all consumer
files and add them to this list. The list below is a starting point — expand it with
the actual consumer file paths discovered at execution time.
```
src/god-agent/core/observability/logger.ts
src/god-agent/retrieval/types.ts
src/god-agent/core/composition/icp-orchestrator.ts
src/god-agent/observability/express-server.ts
src/god-agent/cli/pipeline-daemon-service.ts
src/god-agent/cli/dissertation/tools/retrieval-orchestrator.ts
src/god-agent/cli/style/enhanced-style-drift-detector.ts
src/god-agent/__experimental__/style-drift-detector.ts
src/god-agent/__experimental__/enhanced-quality-integration.ts
tests/god-agent/core/leann/leann-backend.test.ts
tests/god-agent/core/persistence/persistence.test.ts
tests/god-agent/core/routing/writing-agent-routing.test.ts
tests/god-agent/core/routing/multi-agent-handoff.test.ts
```
(+ ~7 StructuredLogger consumer files to be identified via grep before execution)

### Phase 7
```
src/god-agent/core/ucm/token/usage-tracker.ts
src/god-agent/core/episode/episode-store.ts
src/god-agent/core/graph-db/fallback-graph.ts
src/god-agent/retrieval/smart-retrieval-layer.ts
src/god-agent/core/gpu/gpu-server-manager.ts
src/god-agent/universal/write-pipeline-orchestrator.ts
src/god-agent/universal/author-scrubber.ts
```

### Phase 8.1
```
src/god-agent/universal/write-pipeline-orchestrator.ts
src/god-agent/universal/stages/retrieval-stage.ts
```

### Phase 8.2A
```
src/god-agent/core/composition/icp-pipeline-adapter.ts
src/god-agent/core/composition/retrieval-utils.ts
src/god-agent/universal/write-pipeline-orchestrator.ts
```

### Phase 8.2B
```
src/god-agent/core/composition/icp-pipeline-adapter.ts
src/god-agent/core/composition/icp-orchestrator.ts
src/god-agent/observability/icp-api-routes.ts
```

### Phase 8.3
```
docs/adr/001-router-vs-routing-boundary.md
src/god-agent/core/router/shared-types.ts
src/god-agent/core/routing/task-analyzer.ts
src/god-agent/core/routing/failure-classifier.ts
src/god-agent/core/routing/routing-learner.ts
```

### Phase 8.4
```
src/god-agent/universal/write-pipeline-orchestrator.ts
```

---

## Quick Reference: Execution Sequence

```
1. git worktree add ../god-agent-audit audit-fixes
2. cd ../god-agent-audit
3. Capture baseline (tsc errors, vitest pass/fail)
4. For each phase 1-7:
   a. Start fresh Claude Code session
   b. Invoke with scope constraints (Section 3, Step 1)
   c. Agent writes code → stops
   d. Run phase-scope.sh (Step 2)
   e. git diff review (Step 3)
   f. Agent runs phase verification (Step 4)
   g. Commit (Step 5)
   h. If cross-phase gate phase: run full suite (Section 4)
5. Push audit-fixes to remote → CI
6. Hard stop. Verify CI passes.
7. For Phase 8 (fresh sessions per Section 6):
   a. Session A: 8.1, 8.2A (commit each, verify)
   b. Session B: 8.2B (commit, full suite + manual dashboard test), 8.3, 8.4
8. Final full suite + tsc + push
```
