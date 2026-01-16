# Research Documentation Index

## Local-First Routing System Investigation (2026-01-16)

### 📋 Quick Reference

**Start here:** [`DIAGNOSIS_SUMMARY.md`](./DIAGNOSIS_SUMMARY.md)
- One-sentence problem statement
- Quick evidence summary
- Implementation checklist
- Success criteria

### 📚 Complete Investigation

1. **[DIAGNOSIS_SUMMARY.md](./DIAGNOSIS_SUMMARY.md)**
   - Executive summary and problem statement
   - Evidence and proof that routing isn't working
   - High-level solution architecture
   - Implementation checklist with phases
   - Expected outcomes before/after
   - Success criteria

2. **[routing-diagnostic-report.md](./routing-diagnostic-report.md)**
   - Detailed architecture analysis
   - Complete execution flow trace
   - Code evidence from source files
   - Root cause analysis
   - Solution requirements
   - Files requiring changes

3. **[routing-execution-flow-diagram.md](./routing-execution-flow-diagram.md)**
   - Visual ASCII diagrams of execution flow
   - Current (broken) architecture diagram
   - Fixed (proposed) architecture diagram
   - Provider implementation examples
   - Before/after comparison
   - Verification flow

### 🔍 Key Findings

**Problem:** The `CapabilityRouter` is fully implemented but never invoked during god-ask execution because the Task tool spawning mechanism bypasses it entirely.

**Root Cause:** No abstraction layer exists between routing decisions and LLM API calls. The Task tool directly calls Claude API without consulting the router.

**Solution:** Implement provider abstraction layer (vLLM, Claude providers) and integrate routing decision into `executeTaskDefault()` execution path.

**Impact:** Zero changes to existing router logic (already correct), minimal changes to UniversalAgent, backward compatible with Task tool as fallback.

### 📊 Evidence Summary

```typescript
// Metrics that prove routing doesn't work:
routingMetrics = {
  localRequests: 0,      // ← Always 0 (should be >0)
  cloudRequests: 0,      // ← Always 0 (should be >0)
  fallbackEvents: 0,     // ← Always 0 (should be >0)
  localFirst: {
    localTriedFirst: 0,         // ← Always 0
    localSucceeded: 0,          // ← Always 0
    localFellBackToClaude: 0,   // ← Always 0
  }
};
```

### 🎯 Solution Components

1. **Provider Abstraction Layer** (NEW)
   - `base-provider.ts` - Interface definitions
   - `vllm-provider.ts` - vLLM implementation
   - `claude-provider.ts` - Claude implementation

2. **Routing Integration** (MODIFIED)
   - `universal-agent.ts` - Add routed execution path in `executeTaskDefault()`
   - Keep Task tool as fallback for backward compatibility

3. **Metrics Tracking** (ACTIVATED)
   - Track routing decisions at execution point
   - Increment metrics: localRequests, cloudRequests, fallbackEvents
   - Calculate cost savings

### 📁 Source Files Referenced

**Core Router:**
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/router/capability-router.ts`
  - Lines 40-116: Routing metrics structure
  - Lines 342-456: `route()` method (never called)

**Execution Path:**
- `/home/dalton/projects/claudeflow-testing/src/god-agent/universal/universal-agent.ts`
  - Lines 1086-1107: `getRecommendedModel()` (never called)
  - Lines 1178-1295: `executeTaskDefault()` (routing bypass point)

**Task Executor:**
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/agents/task-executor.ts`
  - Lines 121-165: `execute()` method (builds structured task)

**CLI Entry Point:**
- `/home/dalton/projects/claudeflow-testing/src/god-agent/universal/cli.ts`
  - Lines 432-479: `case 'ask'` (god-ask command handler)

**Skill Definition:**
- `/home/dalton/projects/claudeflow-testing/.claude/commands/god-ask.md`
  - Lines 36-48: Task spawning logic

### ✅ Verification Commands

```bash
# Check current metrics (should be all zeros)
god analytics routing

# After implementation, test local routing
god ask "write hello world"

# Verify metrics incremented
god analytics routing
# Expected: localRequests > 0

# Test fallback
docker stop <vllm-container>
god ask "write another test"

# Verify fallback metrics
god analytics routing
# Expected: fallbackEvents > 0, cloudRequests > 0
```

### 🚀 Implementation Time Estimate

- **Phase 1** (Provider Abstraction): 2 hours
- **Phase 2** (Routing Integration): 2 hours
- **Phase 3** (Provider Registration): 30 minutes
- **Phase 4** (Testing): 1 hour
- **Phase 5** (Verification): 30 minutes

**Total:** 4-6 hours

### 🔗 Related Documentation

- **Router Configuration:** `src/god-agent/core/router/router-config.ts`
- **Task Classification:** `src/god-agent/core/router/task-classifier.ts`
- **Router Commands:** `src/god-agent/core/router/router-commands.ts`
- **God Agent CLI:** `scripts/god`

---

## Other Research Documents

- [Add other research documents here as they are created]

---

**Last Updated:** 2026-01-16
**Status:** Investigation Complete
**Next Action:** Implement provider abstraction layer (Phase 1)
