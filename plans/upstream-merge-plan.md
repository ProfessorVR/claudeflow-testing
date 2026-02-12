# Upstream Merge Plan: upstream/main → god-agent-v2-pr

**Created**: 2026-02-11
**Merge base**: `40b322ff`
**Local**: 111 commits ahead (8-SEAM refactor, 25+ god-write fixes, PhD pipeline)
**Upstream**: 71 commits ahead (48-agent coding pipeline, LEANN, Sherlock, Market Terminal)

---

## Phase 0 — Hygiene Split

**Goal**: Decouple "your real work" from "WIP noise" so the merge surface is clean.

### 0.1 Enable rerere (one-time, persists across attempts)

```bash
git config rerere.enabled true
git config rerere.autoupdate true
```

### 0.2 Decide dist/ policy (one-time)

dist/ is a build artifact. Committing it creates false conflicts and bloats the repo.

```bash
# Add dist/ to .gitignore if not already there
echo 'dist/' >> .gitignore

# Remove dist/ from git tracking (keeps files on disk)
git rm -r --cached dist/
git commit -m "chore: stop tracking dist/ — build artifact, not source"
```

> **Addition 2 — dist/ policy in Phase 0, not Phase 3**: Making this decision
> before the merge eliminates an entire category of conflicts from the merge
> surface. If upstream tracks dist/ and you stop tracking it, future merges
> will cleanly ignore dist/ conflicts. If you later need dist/ in-repo
> (e.g., for npm publishing), revisit this.

### 0.3 Snapshot current state

```bash
git branch backup/pre-upstream-merge-$(date +%Y%m%d-%H%M%S)
git push origin god-agent-v2-pr  # remote backup
```

### 0.4 Two-bucket staging

**Bucket 1 — Must-keep changes** (your actual feature/refactor work):

```bash
# Stage only intentional source changes
git add src/god-agent/core/router/capability-router.ts
git add src/god-agent/core/router/index.ts
git add src/god-agent/core/router/risk-classifier.ts
git add src/god-agent/core/router/router-config.ts
git add src/god-agent/core/router/router-types.ts
git add src/god-agent/core/writing/anthropic-writing-generator.ts
git add src/god-agent/core/writing/writing-generator.ts
git add src/god-agent/cli/cli-types.ts
git add src/god-agent/cli/final-stage/final-stage-orchestrator.ts
git add src/god-agent/cli/phd-cli.ts
git add src/god-agent/cli/session-manager.ts
git add src/god-agent/cli/style-injector.ts
git add src/god-agent/core/observability/logger.ts
git add src/god-agent/core/pipeline/phd-pipeline-orchestrator.ts
git add src/god-agent/observability/activity-stream.ts
git add src/god-agent/observability/dashboard/app.js
git add src/god-agent/observability/dashboard/index.html
git add src/god-agent/observability/dashboard/styles.css
git add src/god-agent/observability/explore-bridge.ts
git add src/god-agent/observability/express-server.ts
git add src/god-agent/observability/socket-server.ts
git add src/god-agent/observability/types.ts
git add src/god-agent/universal/cli.ts
git add src/god-agent/universal/interaction-store.ts
# Also: new src/ dirs, .claude/agents, test files — review each
git add tests/god-agent/

git commit -m "feat: batch commit of post-refactor source changes

Includes:
- Router enhancements (capability-router, risk-classifier, router-config)
- Writing pipeline updates (anthropic-writing-generator, writing-generator)
- CLI improvements (cli-types, phd-cli, session-manager, style-injector)
- Observability updates (dashboard, express-server, socket-server)
- Pipeline orchestrator refinements
- Updated test suites"
```

**Bucket 2 — Quarantine** (WIP, experiments, generated artifacts):

```bash
# Create a WIP branch for everything else
git checkout -b wip/pre-merge-quarantine
git add -A
git commit -m "wip: quarantine uncommitted work before upstream merge"
git checkout god-agent-v2-pr
```

> **Addition 1 — WIP branch over stash**: With 163 files including untracked
> ones, `git stash -u` is slow and opaque. A dedicated `wip/pre-merge-quarantine`
> branch is inspectable, diffable, and cherry-pickable. Prefer this always
> when quarantining large working trees.

### 0.5 Verify clean working tree

```bash
git status
# Should show: nothing to commit, working tree clean
```

---

## Phase 1 — Sandbox Merge via Worktree

**Goal**: Resolve conflicts in an isolated directory. Main workspace stays untouched.

### 1.1 Fetch upstream

```bash
git fetch upstream main
```

### 1.2 Create worktree sandbox

```bash
git worktree add ../merge-sandbox god-agent-v2-pr
cd ../merge-sandbox
```

### 1.3 Attempt merge (conflicts will appear here)

```bash
git merge --no-ff --no-commit upstream/main
```

> **Addition 3 — rerere training**: Because `rerere.enabled` was set in Phase 0.1,
> Git is now recording every conflict resolution we make in this sandbox. If we
> need to abort and re-attempt the merge (e.g., after fixing a missed issue
> on the real branch), `rerere` will automatically replay our conflict
> resolutions — no manual re-resolution needed. This makes the sandbox merge
> do double duty: it's both the real merge AND a training run for rerere.

### 1.4 Inventory conflicts

```bash
# List all conflicting files
git diff --name-only --diff-filter=U | tee /tmp/conflict-file-list.txt

# Save full conflict diff for reference
git diff > /tmp/merge-conflicts-full.diff

# Count conflict markers per file
for f in $(git diff --name-only --diff-filter=U); do
  echo "$(grep -c '<<<<<<<' "$f") conflicts in $f"
done
```

---

## Phase 2 — Conflict Resolution (in sandbox worktree)

### 2.1 cli.ts — 3 conflicts (all EASY: concatenate both sides)

**Conflict 1** (imports, line ~23):
- Take LOCAL's `.env` loader block first (must execute before env-dependent imports)
- Then take UPSTREAM's `CodingQualityCalculator`, `SonaEngine`, `CommandTaskBridge` imports
- Strategy: concatenate, no semantic conflict

**Conflict 2** (function definitions, line ~357):
- Take LOCAL's `handleRouterCommand()` (~78 lines)
- Then take UPSTREAM's `getSonaEngine()`, `submitCodeFeedback()`,
  `autoCompleteCodingTrajectories()`, `checkOrphanedTrajectories()` (~460 lines)
- Strategy: concatenate, independent function blocks

**Conflict 3** (help text, line ~2418):
- Take both LOCAL's model override help and UPSTREAM's code-feedback help entries
- Strategy: concatenate help entries

```bash
# After resolving:
git add src/god-agent/universal/cli.ts
```

### 2.2 universal-agent.ts — 4 conflicts (2 EASY, 2 HARD)

**Conflict 1** (imports, line ~94, MEDIUM):
- Keep LOCAL's deletion of `CommandTaskBridge` import (it lives in extracted module)
- ADD UPSTREAM's new LEANN imports:
  - `createLEANNAdapter` from `../core/search/adapters/leann-adapter.js`
  - `createDualCodeEmbeddingProvider`, `createLEANNEmbedder`, `DualCodeEmbeddingProvider`
    from `../core/search/dual-code-embedding.js`

**Conflict 2** (pipeline imports, line ~249, HARD):
- Keep LOCAL's reduced import set (moved symbols stay in extracted modules)
- ADD UPSTREAM's genuinely new imports:
  - `CodingPipelineOrchestrator`, `createOrchestrator` from `coding-pipeline-orchestrator.js`
  - `CODING_PIPELINE_MAPPINGS`, `getAgentsForPhase`, `buildPipelineDAG`
    from `command-task-bridge.js`
  - `PHASE_ORDER`, `CHECKPOINT_PHASES`, `CODING_MEMORY_NAMESPACE`,
    `CodingPipelinePhase`, `IPipelineExecutionConfig` from `types.js`
  - `createLeannContextService`, `LeannContextService`
    from `leann-context-service.js`

**Conflict 3** (type alias vs constant, line ~763, EASY):
- Take both: LOCAL's `InternalUniversalConfig` type alias AND
  UPSTREAM's `LEANN_PERSISTENCE_PATH` constant

**Conflict 4** (pipeline routing logic, line ~1977, HARD):

> **CRITICAL: Wrap, don't port.**
>
> Do NOT refactor upstream's DAG logic during the merge.
> First make it correct, then make it yours.

Strategy:

1. Take LOCAL's simplified `prepareCodeTask()` (delegates to `TaskRoutingOrchestrator`)

2. In `TaskRoutingOrchestrator`, add upstream's DAG logic as a **thin wrapper**
   that preserves upstream's structure as closely as possible:

```typescript
// task-routing-orchestrator.ts — add this method

/**
 * Upstream's coding DAG construction logic.
 * Wrapped as-is during merge; will be refactored to match
 * local architecture conventions after tests pass.
 *
 * Original location: universal-agent.ts prepareCodeTask() lines 2055-2120
 */
async buildCodingPipelineDAG(
  task: string,
  deps: {
    memoryClient: MemoryClient;       // was this.memoryClient
    contextService: LeannContextService; // was this.contextService
    logger: Logger;                    // was this.logger
  },
  options?: {
    startPhase?: number;
    endPhase?: number;
    triggeredByHook?: boolean;
  },
): Promise<IPipelineExecutionResult> {
  // === BEGIN UPSTREAM CODE (minimally adapted) ===
  // Paste upstream's ~200 lines here with ONLY these changes:
  //   this.memoryClient  →  deps.memoryClient
  //   this.contextService →  deps.contextService
  //   this.logger         →  deps.logger
  // NO other refactoring. Keep variable names, control flow, comments.
  // === END UPSTREAM CODE ===
}
```

3. In `universal-agent.ts`, call the wrapper:

```typescript
// Where prepareCodeTask delegates to TaskRoutingOrchestrator:
const dagResult = await this.taskRoutingOrchestrator.buildCodingPipelineDAG(
  task,
  {
    memoryClient: this.memoryClient,
    contextService: this.contextService,
    logger: this.logger,
  },
  options
);
```

4. Update `TaskRoutingDeps` interface to accept the new dependency types.

5. **Do not refactor further until Phase 3 passes.**

```bash
# After resolving all 4 conflicts:
git add src/god-agent/universal/universal-agent.ts
```

### 2.3 package.json

- Take UPSTREAM's new dependencies (`agentdb`, `sharp`, `@types/cors`,
  `agentic-flow`, `@ruvector/attention-darwin-arm64`)
- Keep LOCAL's removals (unless upstream's new modules depend on them —
  check `coding-pipeline-orchestrator.ts` imports)

```bash
git add package.json
```

### 2.4 .gitignore

Take the union of both sides' ignore patterns.

```bash
git add .gitignore
```

### 2.5 .claude/agents/phdresearch/*.md files

- Favor LOCAL's scholarly citation enforcement content
- Incorporate UPSTREAM's structural changes (phase boundaries, agent counts)
- Review each file individually

```bash
git diff --name-only --diff-filter=U -- '.claude/agents/phdresearch/'
# Resolve each, then:
git add .claude/agents/phdresearch/
```

### 2.6 Any remaining conflicts

```bash
# Check for stragglers
git diff --name-only --diff-filter=U
# Resolve case-by-case, then git add each
```

---

## Phase 3 — Deterministic Rebuild & Verification (still in sandbox)

### 3.1 Install dependencies (BEFORE compilation)

```bash
npm install
```

> npm install runs first so tsc doesn't fail on missing modules
> from upstream's new dependencies.

### 3.2 Delete and rebuild dist/

```bash
rm -rf dist/
npx tsc --build
```

### 3.3 TypeScript compilation gate

```bash
npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.txt
```

**Expected error categories and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| Missing imports in `TaskRoutingOrchestrator` | New types needed for wrapped DAG code | Add imports for `MemoryClient`, `LeannContextService`, etc. |
| `TaskRoutingDeps` missing properties | Wrapper needs new deps passed through | Extend the interface |
| Type mismatch in pipeline types | Upstream changed interfaces local modules depend on | Align types, preferring upstream's version |

Fix each error, re-run `tsc --noEmit`, iterate until clean.

### 3.4 Test suite

```bash
# Full suite
npx vitest run 2>&1 | tee /tmp/test-results.txt
```

Triage failures:
- **Pre-existing failures** (the 30 from before merge): ignore, known
- **New failures in local tests**: likely import path changes → fix
- **New failures in upstream tests**: likely missing wiring → fix

### 3.5 CLI smoke tests

```bash
# Local feature: god-write
npx tsx src/god-agent/universal/cli.ts write "test prompt" --dry-run

# Upstream feature: god-code (new)
npx tsx src/god-agent/universal/cli.ts code "test coding task" --dry-run

# Routing: should distinguish academic vs coding
npx tsx src/god-agent/universal/cli.ts ask "write an essay about Aristotle" --dry-run
npx tsx src/god-agent/universal/cli.ts ask "implement a REST API" --dry-run
```

### 3.6 Dashboard health check

```bash
npx tsx src/god-agent/observability/express-server.ts &
sleep 3
curl http://localhost:3847/health
kill %1
```

### 3.7 Commit the merge (only after all gates pass)

```bash
git commit -m "merge: integrate upstream/main (coding pipeline, LEANN, Sherlock, Market Terminal)

Upstream features integrated:
- 48-agent coding pipeline with DAG orchestration (/god-code)
- LEANN semantic search with HNSW and hub-node caching
- Sherlock forensic quality gates at phase boundaries
- CodingQualityCalculator (5-dimension scoring)
- RLM context store for cross-phase state
- Market Terminal (FastAPI + React financial analysis)
- Hook infrastructure for pipeline enforcement
- Dual embedding backend (local gte-Qwen2 / OpenAI ada-002)
- Zilliz Cloud vector DB backend

Conflict resolution:
- cli.ts: concatenated both sides (3 conflicts, all additive)
- universal-agent.ts: preserved SEAM extractions, wrapped upstream
  DAG logic in TaskRoutingOrchestrator adapter (4 conflicts)
- package.json: merged dependency sets
- Agent .md files: kept scholarly citation rules, added structural updates"
```

---

## Phase 4 — Return to Main Workspace

### 4.1 Update the real branch

```bash
cd /home/dalton/projects/claudeflow-testing

# Fast-forward the real branch to the merge result
git merge merge-sandbox/god-agent-v2-pr
# (or: git pull ../merge-sandbox god-agent-v2-pr)
```

### 4.2 Remove worktree

```bash
git worktree remove ../merge-sandbox
```

### 4.3 Reapply quarantined WIP

```bash
# Cherry-pick or merge the quarantined work
git merge wip/pre-merge-quarantine --no-ff

# Or selectively cherry-pick specific changes:
# git cherry-pick <specific-commits-from-wip-branch>
```

### 4.4 Re-run verification after WIP reapply

```bash
npx tsc --noEmit
npx vitest run
```

### 4.5 Clean up temporary branches

```bash
git branch -d wip/pre-merge-quarantine
# Keep backup/pre-upstream-merge-* for a week, then delete
```

---

## Rollback Plan

### During Phase 1-2 (sandbox)

Main branch is untouched. Just delete the worktree:

```bash
git worktree remove ../merge-sandbox --force
```

### During Phase 3 (sandbox, post-commit)

Same — delete the worktree. The merge commit only exists in the sandbox.

### After Phase 4.1 (real branch updated)

```bash
git reset --hard backup/pre-upstream-merge-YYYYMMDD-HHMMSS
```

### After push to origin

```bash
git revert -m 1 <merge-commit-sha>
git push origin god-agent-v2-pr
```

---

## Post-Merge Refactoring (Phase 5, optional, after everything is green)

Only after the merge is committed, tested, and stable:

1. **Refactor the wrapped DAG logic** in `TaskRoutingOrchestrator`:
   - Replace `deps.memoryClient` pattern with proper dependency injection
   - Align naming conventions with local codebase style
   - Add unit tests for the new method

2. **Evaluate LEANN integration** with local's SmartRetrievalLayer:
   - LEANN uses HNSW; local uses ChromaDB
   - Determine if they complement or conflict
   - Possibly route: LEANN for code search, ChromaDB for corpus/academic search

3. **Evaluate Sherlock integration** with local's QualityGauntlet:
   - Sherlock: forensic phase-boundary review (coding pipeline)
   - QualityGauntlet: 7-stage academic writing validation
   - These serve different domains — likely complementary

4. **Review hook infrastructure** compatibility with local's pipeline:
   - Upstream's hooks enforce Write/Edit blocking until Phase 4
   - Local's pipeline doesn't use this enforcement model
   - Decide: adopt upstream's hook model, or keep local's approach

---

## Time Estimates (Revised)

| Phase | Time | Notes |
|-------|------|-------|
| Phase 0: Hygiene split | 30-45 min | Sorting 163 files into two buckets |
| Phase 1: Sandbox setup | 5 min | |
| Phase 2: Conflict resolution | 60-90 min | Conflict #4 wrap is the long pole |
| Phase 3: Rebuild + verify | 30-45 min | Depends on tsc error count |
| Phase 4: Reapply WIP | 15-30 min | May surface new conflicts |
| **Total** | **2.5-3.5 hours** | Assumes no cascading type issues |

**Risk buffer**: If `TaskRoutingDeps` interface changes cascade into multiple
extracted modules, add 1-2 hours for type alignment. This is the most likely
source of time overrun.

---

## Checklist (print this)

- [ ] `git config rerere.enabled true`
- [ ] dist/ policy decided and .gitignore updated
- [ ] Backup branch created
- [ ] Must-keep changes committed (Bucket 1)
- [ ] WIP quarantined to side branch (Bucket 2)
- [ ] Working tree clean
- [ ] Worktree sandbox created
- [ ] Upstream fetched
- [ ] Merge attempted in sandbox
- [ ] cli.ts conflicts resolved (3/3)
- [ ] universal-agent.ts conflicts resolved (4/4)
- [ ] package.json resolved
- [ ] .gitignore resolved
- [ ] Agent .md files resolved
- [ ] All other conflicts resolved
- [ ] `npm install` clean
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vitest run` — no new failures
- [ ] CLI smoke tests pass (write, code, ask)
- [ ] Dashboard health check passes
- [ ] Merge committed in sandbox
- [ ] Real branch updated from sandbox
- [ ] Worktree removed
- [ ] WIP reapplied
- [ ] Final tsc + test pass
- [ ] Temporary branches cleaned up
