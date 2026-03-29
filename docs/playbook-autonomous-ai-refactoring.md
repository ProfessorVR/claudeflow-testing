# Playbook: Autonomous AI Refactoring on Enterprise Codebases

**Origin**: God Agent audit, March 2026 (361K LOC, 771 files, 144 findings, 8 phases)
**Validated against**: TypeScript/Node.js monorepo with live services, 431 test files, 12,956 tests

This playbook documents the execution protocol for safely running autonomous AI coding agents against large, legacy codebases. It was developed iteratively during an 8-phase architectural audit and hardened through real failures and recoveries.

---

## Core Principles

1. **Isolation over trust.** The agent operates in a disposable worktree, never your primary working tree.
2. **Scope before execution.** Every phase has an explicit file allowlist. Out-of-scope edits are rejected mechanically, not by judgment.
3. **Regression gates, not hope.** `tsc --noEmit` and `vitest run` after every phase. Numbers must not regress.
4. **Revert by default, fix forward by exception.** If a phase breaks something, revert the commit and re-execute from clean state.
5. **Fresh context per phase.** Each phase gets its own agent session. Stale file snapshots from prior phases cause silent drift.

---

## 1. Worktree Isolation

Never run the agent in your primary working tree.

```bash
# Create worktree on a dedicated branch
git worktree add ../audit-workspace audit-fixes --no-track -b audit-fixes
cd ../audit-workspace
```

### Why Worktree Over Docker

- Pure code-edit phases need only `tsc` and `vitest` (mocked). No live services.
- WSL2 + Docker volume mounts impose severe I/O penalties on large TypeScript compilations.
- Worktree gives full filesystem isolation — the agent cannot modify your primary tree.
- If corrupted: `git worktree remove ../audit-workspace && git worktree add ...` from the last good commit.

### Exception: Live Service Testing

Phases requiring end-to-end testing against live services (databases, APIs, dashboards) need either:
- Your development services with database backups taken first, OR
- An ephemeral Docker Compose environment with throwaway volumes.

---

## 2. Pre-Flight Baseline

Before starting any phase, capture current state. These numbers are your regression floor.

```bash
echo "=== BASELINE $(date) ==="
echo "TS errors: $(npx tsc --noEmit 2>&1 | grep -c 'error TS')"
npx vitest run --reporter=json 2>/dev/null | jq '{passed: .numPassedTests, failed: .numFailedTests}'
```

**Rule**: After every phase, TS error count must not increase and test pass count must not decrease.

---

## 3. The Micro-Loop: Human-in-the-Loop Phase Execution

For every phase, follow this exact sequence. No shortcuts.

### Step 1: Invoke with Scope Constraints

Start a fresh agent session and provide this prompt template:

```
Read [plan-file] and execute Phase [N].

Strict constraints:
- Read every target file fresh. Do not rely on prior context.
- Only modify files explicitly listed in the phase instructions.
- If you believe a file outside this list needs changes, STOP and explain why.
- Do not modify or reference any file in [excluded-directories].
- Do not modify test files unless the phase explicitly instructs it.
- Do not commit. Stop and wait for my approval once the code is written.
- When you finish, run [verification-commands], then wait for my approval.
```

**Key additions that prevent common agent failures:**
- "Read every target file fresh" — prevents acting on stale cached state
- "Output a brief mapping showing..." — forces the agent to prove understanding before acting (show-your-work prompts)
- "Ensure X before Y" — gates destructive actions on preconditions

### Step 2: Mechanical Scope Check

Before reading the code diff, verify scope mechanically:

```bash
#!/bin/bash
# phase-scope.sh — run after agent completes, before reviewing diff
ALLOWED_FILES="
src/path/to/allowed-file-1.ts
src/path/to/allowed-file-2.ts
"

CHANGED=$(git diff --name-only)
VIOLATIONS=0
for f in $CHANGED; do
  echo "$ALLOWED_FILES" | grep -qxF "$f" || { echo "OUT OF SCOPE: $f"; VIOLATIONS=$((VIOLATIONS+1)); }
done

if [ $VIOLATIONS -gt 0 ]; then
  echo "BLOCKED: $VIOLATIONS out-of-scope file(s). Reject changeset."
  exit 1
fi
echo "PASS: All changed files are in scope."
```

If ANY file is out of scope, reject the entire changeset without reviewing the code. Instruct the agent to revert and explain.

### Step 3: Manual Diff Review

```bash
git diff
```

Check specifically for:
- **Collateral damage**: Removed unrelated imports, reformatted adjacent code
- **Type coercion**: `as any` casts to bypass errors the agent didn't understand
- **Hallucinated dependencies**: New imports that don't exist in `package.json`
- **Silent behavior changes**: Modified default values, removed error handling
- **Experimental contamination**: Changes to files in excluded directories

### Step 4: Agent-Driven Verification

Once the diff looks correct, instruct the agent to run the phase-specific verification commands. Typical pattern:

```bash
# Type check — errors must not increase
npx tsc --noEmit 2>&1 | grep -c 'error TS'

# Subsystem tests — must pass
npx vitest run tests/[affected-subsystem]/ --reporter=verbose

# Full suite (at regression gate phases)
npx vitest run --reporter=verbose
```

### Step 5: Commit

Only after tests pass:

```bash
git add src/path/to/specific-files.ts  # explicit filenames, never git add -A
git commit -m "fix(audit): Phase N — [brief description]"
```

---

## 4. Cross-Phase Regression Gates

Per-phase verification only tests the affected subsystem. Regression gates catch interaction effects.

| After Phase | Gate |
|---|---|
| After every 2-3 phases | Full test suite |
| After any "High risk" phase | Full suite + `tsc --noEmit` |
| Before pushing to remote | Full suite + `tsc` + manual smoke test |

### If a Gate Fails

Per-phase commits make regressions attributable. With 2-3 commits between gates:

```bash
# Check which phase introduced the regression
git stash
git checkout <prior-phase-commit>
npx vitest run --reporter=verbose
# If passes: current phase broke it. If fails: prior phase broke it.
git checkout <branch-tip>
git stash pop
```

---

## 5. Rollback Policy

### Default: Revert and Re-Execute

```bash
git revert <bad-phase-commit>
```

Then re-invoke the agent for that phase with additional context about what went wrong. The agent solves the root problem from a clean slate rather than patching symptoms.

### Exception: Fix Forward

Only when ALL of:
1. The phase's fix is verifiably correct (the logic change is right)
2. The regression is in a different subsystem (a latent bug exposed by the fix)
3. The latent bug is simple and well-understood

If in doubt, revert. Fixing forward on a broken base invites compounding brittle patches.

---

## 6. Context Management: Session Boundaries

### One Session per Phase

Each phase gets its own fresh agent session. This ensures:
- The agent reads CURRENT file state, not stale cached versions
- The context window isn't diluted by prior-phase diffs
- A bad session can be killed without losing unrelated work
- Persistent memory (`.claude/`, project config) carries forward automatically

### High-Risk Phase Isolation

For phases that delete files, rewire imports, or change public APIs, start a fresh session even if the prior phase was in the same session group. The agent MUST read the post-edit state of files, not remember what they looked like before edits.

| Risk Level | Session Strategy |
|---|---|
| Low (add imports, create files) | Can share session with adjacent phases |
| Medium (extract/rename logic) | Own session preferred |
| High (delete files, rewire routes) | **Mandatory fresh session** |

---

## 7. Retry Discipline

### `tsc --noEmit` Failures: 2 Retries

Type errors are deterministic. The agent can read the error, trace the type chain, and fix it. Two attempts is usually sufficient.

### Test Failures: 1 Retry

If the agent's first fix doesn't resolve a test failure, it is likely misunderstanding the test's intent. A second retry typically leads to the agent modifying test assertions rather than fixing source code.

### Hard Rule: Do Not Modify Test Files

Unless explicitly instructed, the agent must not modify test files. If a test fails, the source code is wrong. If the agent claims a test is outdated, it must stop and explain rather than changing the test.

### Infinite Loop Prevention

If the agent enters a fix-break-fix cycle, interrupt after the retry limit. The agent's edit history shows whether it's converging or oscillating.

---

## 8. Show-Your-Work Prompts

The most powerful technique for preventing silent errors: force the agent to demonstrate understanding before taking destructive actions.

### Pattern: Precondition Mapping

Before deleting or replacing a component, require the agent to output a mapping proving the replacement covers all cases:

```
Before you delete [file], output a brief mapping showing which
line/method in [replacement] now handles each of the N [capabilities].
If [replacement] is missing one, add it before proceeding.
```

### Pattern: Quality Gate Verification

Before consolidating parallel implementations:

```
Ensure that [target] has a fully complete [quality-gate-sequence].
You are migrating [routes/calls] to [target], so it must not lose
any [enforcement/validation] that [source] previously had.
```

### Pattern: Dependency Trace

Before changing a public API:

```
Search the entire codebase for imports of [module]. List every consumer
file. For each consumer, verify the new API is compatible. If any
consumer needs changes, list them in your response before editing.
```

These prompts prevent the #1 failure mode of autonomous agents: confidently deleting things that are still needed.

---

## 9. Plan Structure: Dependency-Ordered Phases

A good refactoring plan has these properties:

1. **Bug fixes before refactoring.** Refactoring a buggy codebase risks masking bugs or introducing new ones during restructuring.
2. **Security fixes first.** Exploitable vulnerabilities are fixed before anything else.
3. **Dependency order.** Each phase's inputs are stable (fixed by prior phases).
4. **Explicit file allowlists per phase.** No ambiguity about scope.
5. **Phase-specific verification commands.** Not just "run tests" but which test directories.
6. **Architecture phases last.** Gated on all functional phases being complete and verified.

### Phase Template

```markdown
## Phase N: [Category] ([Risk Level])

### N.1 [Fix Title] [Finding-ID]

**File**: path/to/file.ts
**Lines**: 100-150

**Action**: [One-sentence description]

[Numbered steps with enough context to execute without reading surrounding code]

### Phase N Verification

[Exact commands to run]
```

---

## 10. What Goes Wrong (Failure Catalog)

| Failure | Symptom | Prevention |
|---|---|---|
| Stale context | Agent "remembers" file state from 3 phases ago | Fresh session per phase |
| Scope creep | Agent "improves" adjacent code while fixing a bug | File allowlist + mechanical scope check |
| Test modification | Agent changes assertions to make tests pass | Hard "no test edits" rule + retry limit |
| Type erasure | Agent adds `as any` to bypass type errors | Diff review for `as any` patterns |
| Missing quality gates | Agent deletes a module without verifying replacement coverage | Show-your-work precondition prompts |
| Oscillating fixes | Agent fixes A, breaks B, fixes B, breaks A | Retry limit + interrupt + manual inspection |
| Experimental contamination | Agent modifies files in excluded directories | Explicit exclusion in prompt + scope check |
| Phantom dependencies | Agent imports modules that don't exist | Diff review for new imports |

---

## Quick Reference: Execution Sequence

```
1. git worktree add ../audit-workspace <branch>
2. cd ../audit-workspace
3. Capture baseline (tsc errors, vitest pass/fail counts)
4. For each phase:
   a. Start fresh agent session
   b. Invoke with scope constraints + show-your-work prompts
   c. Agent writes code, stops
   d. Run phase-scope.sh (mechanical scope check)
   e. git diff review (manual)
   f. Agent runs verification commands
   g. Commit with explicit git add
   h. At regression gate phases: run full suite
5. Push to remote, verify CI
6. Repeat for architecture phases (fresh sessions, higher scrutiny)
7. Final: full suite + tsc + manual smoke test
```
