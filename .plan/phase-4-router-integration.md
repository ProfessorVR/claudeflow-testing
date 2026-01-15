# Plan: Phase 4 - Router Integration

> **Status:** Ready for Implementation
> **Prerequisite:** Phase 3 (Intelligent Model Router) - Complete
> **Reference:** Phase 3.5 integration work from `deep-swinging-fairy.md`

---

## Goal

Integrate the Intelligent Model Router into the existing God Agent codebase:
1. Initialize router during agent startup
2. Route requests through the capability router
3. Track costs and quality for all LLM calls
4. Support manual model override via CLI flags
5. Log non-Claude changes for review

---

## Current State

**Router System (Complete):**
- `src/god-agent/core/router/` - 17 files, 433 tests
- All router components implemented and tested

**Files Requiring Modification:**
| File | Current State | Required Changes |
|------|---------------|------------------|
| `universal-agent.ts` | No router initialization | Initialize router at startup |
| `claude-task-executor.ts` | Direct Claude CLI spawn | Route through capability router |
| `anthropic-writing-generator.ts` | Hardcoded model | Accept model from router |

---

## Implementation Phases

### Phase 4.1: Universal Agent Router Initialization

**MANDATORY BACKUP:**
```bash
git add -A && git commit -m "backup: pre-phase-4.1-universal-agent-integration" && git tag backup/pre-phase-4.1
```

**File:** `src/god-agent/universal/universal-agent.ts`

**Changes:**
1. Import router components
2. Add router initialization in `initialize()` method (around line 700)
3. Store router instance for use in task processing
4. Add router configuration to UniversalConfig

**Key Code Points:**
- Line 574: `async initialize()` - Add router init
- Line 702: After DAI-003 routing init - Add model router init
- Constructor (line 525): Accept router config

**Tests:**
- `tests/god-agent/universal/universal-agent-router.test.ts`
- Verify router initializes correctly
- Verify router is available for task processing

---

### Phase 4.2: Claude Task Executor Integration

**MANDATORY BACKUP:**
```bash
git add -A && git commit -m "backup: pre-phase-4.2-task-executor-integration" && git tag backup/pre-phase-4.2
```

**File:** `src/god-agent/core/executor/claude-task-executor.ts`

**Changes:**
1. Import router and related types
2. Accept optional `modelOverride` parameter
3. Call router before spawning Claude CLI
4. Record completed requests for cost/quality tracking
5. Create audit entries for non-Claude model usage

**Key Integration Points:**
- Line 38: `ClaudeTaskExecutor` class - Add router dependency
- Task execution methods - Add routing decision before execution
- After completion - Call `recordCompletedRequest()`

**Audit Trail:**
- When non-Claude model is used, create audit entry via `AuditLogger`
- Store diff information for later review

**Tests:**
- `tests/god-agent/core/executor/task-executor-routing.test.ts`
- Verify routing decisions are made
- Verify fallback works when Claude unavailable
- Verify audit entries created for non-Claude usage

---

### Phase 4.3: Writing Generator Integration

**MANDATORY BACKUP:**
```bash
git add -A && git commit -m "backup: pre-phase-4.3-writing-generator-integration" && git tag backup/pre-phase-4.3
```

**File:** `src/god-agent/core/writing/anthropic-writing-generator.ts`

**Changes:**
1. Remove hardcoded model (line 17: `private model = 'claude-3-5-sonnet-20241022'`)
2. Accept model parameter in constructor/config
3. Use router to select model when no override provided
4. Record writing requests for cost tracking

**Current Hardcoding:**
```typescript
// Line 17 - TO BE REMOVED
private model = 'claude-3-5-sonnet-20241022';
```

**New Pattern:**
```typescript
private model: string | null = null;  // null = use router

async generate(prompt: string, options?: GenerateOptions): Promise<...> {
  const model = options?.model ?? this.model ?? await this.getRouterModel('writing');
  // ... use selected model
}
```

**Tests:**
- `tests/god-agent/core/writing/writing-generator-routing.test.ts`
- Verify model override works
- Verify router selection works
- Verify cost tracking integration

---

### Phase 4.4: CLI Flag Support

**MANDATORY BACKUP:**
```bash
git add -A && git commit -m "backup: pre-phase-4.4-cli-flags" && git tag backup/pre-phase-4.4
```

**Files to Modify:**
- `src/god-agent/universal/cli.ts` - Add `--model` flag parsing
- `src/god-agent/cli/phd-cli.ts` - Add model flag to commands

**CLI Syntax:**
```bash
# Explicit model selection
god ask --model gpt-4o "explain this algorithm"
god code --model deepseek "fix the null check"
god write --model claude-sonnet "write documentation"

# Alias syntax
god ask @local "simple question"    # Use best local model
god ask @fast "quick task"          # Use fastest model
god ask @cheap "budget task"        # Use cheapest model

# Session commands
god use local                       # Force local for session
god use auto                        # Return to auto-routing
```

**Implementation:**
1. Parse `--model` flag in CLI argument handler
2. Parse `@alias` syntax in prompt preprocessing
3. Pass model override to executor/generator
4. Store session preference via `useModel()`

**Tests:**
- `tests/god-agent/cli/cli-model-flags.test.ts`
- Verify --model flag parsing
- Verify @alias syntax
- Verify session override works

---

### Phase 4.5: End-to-End Integration Tests

**MANDATORY BACKUP:**
```bash
git add -A && git commit -m "backup: pre-phase-4.5-integration-tests" && git tag backup/pre-phase-4.5
```

**Test Files:**
```
tests/god-agent/integration/
├── router-executor-integration.test.ts
├── router-generator-integration.test.ts
├── router-fallback-scenarios.test.ts
└── router-audit-flow.test.ts
```

**Test Scenarios:**

1. **Happy Path**
   - Request routes to Claude
   - Response completes successfully
   - Cost and quality recorded

2. **Fallback Scenario**
   - Primary model unavailable
   - Fallback to secondary model
   - Audit entry created

3. **Budget Exceeded**
   - Daily budget exhausted
   - Automatic fallback to local
   - Warning displayed

4. **Manual Override**
   - `--model deepseek` flag
   - Correctly routes to specified model
   - No routing decision made

5. **Review Flow**
   - Non-Claude changes made
   - Entries appear in review queue
   - Approve/reject workflow works

**Manual Testing Checklist:**
- [ ] `god models` - Lists all configured models with status
- [ ] `god use local` then run task - Uses local model
- [ ] `god ask --model gpt-4o "test"` - Uses specified model
- [ ] `god routing` - Shows current routing mode
- [ ] `god costs` - Shows accurate cost tracking
- [ ] `god review` - Shows pending non-Claude reviews
- [ ] Simulate credit exhaustion - Verify fallback triggers

---

## File Summary

| Phase | Files Modified | Files Created | Tests |
|-------|----------------|---------------|-------|
| 4.1 | universal-agent.ts | - | ~15 |
| 4.2 | claude-task-executor.ts | - | ~20 |
| 4.3 | anthropic-writing-generator.ts | - | ~15 |
| 4.4 | cli.ts, phd-cli.ts | - | ~20 |
| 4.5 | - | 4 integration test files | ~30 |
| **Total** | 5 files | 4 files | ~100 |

---

## Verification Plan

After each phase:
1. Run `npx vitest run tests/god-agent/` - All tests pass
2. Run `npx tsc --noEmit` - No TypeScript errors
3. Manual smoke test of affected functionality

Final verification:
1. Full test suite passes (500+ tests)
2. Manual testing checklist complete
3. Documentation updated

---

## Rollback Procedures

If any phase fails:
```bash
# Rollback to before specific phase
git reset --hard backup/pre-phase-4.X
git tag -d backup/pre-phase-4.X
```

If entire Phase 4 fails:
```bash
git reset --hard backup/phase-3.5-complete
```

---

## Dependencies

- Phase 3 router system (complete)
- OpenAI SDK (for GPT-4o provider)
- Ollama (for local model testing)

---

## Implementation Order

1. **Phase 4.1** - Router initialization (foundation)
2. **Phase 4.2** - Task executor integration (main usage)
3. **Phase 4.3** - Writing generator integration (secondary usage)
4. **Phase 4.4** - CLI flags (user interface)
5. **Phase 4.5** - Integration tests (verification)

Each phase must pass all tests before proceeding to the next.
