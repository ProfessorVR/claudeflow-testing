# Local-First Routing System: Diagnosis & Solution

**Date:** 2026-01-16
**Status:** ⚠️ **ROUTING SYSTEM NOT CONNECTED TO EXECUTION PATH**

---

## 🔴 The Problem (One-Sentence Version)

**The `CapabilityRouter` is fully implemented and initialized, but it's never invoked during god-ask execution because the Task tool spawning mechanism bypasses it entirely and goes straight to the Claude API.**

---

## 🔍 Investigation Summary

### What the User Reported
1. ✅ Running `god ask "write a fibonacci function"` causes Claude usage to decrease
2. ✅ Dashboard routing metrics remain at 0 (no requests tracked)
3. ✅ Local-first routing system exists in codebase but doesn't seem to be in execution path

### What We Found

#### ✅ Router Implementation (Perfect)
- **File:** `/home/dalton/projects/claudeflow-testing/src/god-agent/core/router/capability-router.ts`
- **Status:** Fully implemented, correct logic, proper metrics structure
- **Initialized:** Yes, in `UniversalAgent` constructor
- **Registered Providers:** vLLM, Claude, OpenAI, etc.
- **Routing Rules:** LOCAL-FIRST configured (vLLM priority 0, Claude priority 10)

#### ❌ Execution Path (Broken)
- **File:** `/home/dalton/projects/claudeflow-testing/src/god-agent/universal/universal-agent.ts`
- **Method:** `executeTaskDefault()` (line ~1178)
- **Problem:** Builds `IStructuredTask` → Outputs JSON → Task tool parses → **Calls Claude API directly**
- **Result:** Router's `route()` method never called, metrics never incremented

#### 🔌 The Missing Link
There is **NO** abstraction layer between the routing decision and the LLM API call.

```typescript
// What exists (UNUSED):
CapabilityRouter.route() → RoutingDecision

// What's missing:
RoutingDecision → LLMProvider.complete() → (vLLM or Claude API)

// What currently happens:
Task tool → Claude API (ALWAYS)
```

---

## 📊 Evidence

### Metrics That Prove Routing Isn't Working

```typescript
// File: capability-router.ts:90-115
let routingMetrics: RoutingMetrics = {
  localRequests: 0,      // ← ALWAYS 0 (should be >0 if routing worked)
  cloudRequests: 0,      // ← ALWAYS 0 (should be >0 if routing worked)
  fallbackEvents: 0,     // ← ALWAYS 0 (should be >0 if fallbacks occurred)
  localFirst: {
    localTriedFirst: 0,         // ← ALWAYS 0
    localSucceeded: 0,          // ← ALWAYS 0
    localFellBackToClaude: 0,   // ← ALWAYS 0
    skippedLocal: 0,            // ← ALWAYS 0
  }
};
```

### Code That's Never Executed

```typescript
// File: capability-router.ts:406-429
async route(prompt: string, options?: RouteOptions): Promise<RoutingDecision> {
  // ... classification, rule matching ...

  for (const modelId of fallbackChain) {
    const provider = this.providers.get(modelId);

    // Check availability and route
    // ...

    // Track routing metrics
    if (isLocalProvider(provider.provider)) {
      routingMetrics.localRequests++;  // ← THIS LINE NEVER EXECUTES
    } else {
      routingMetrics.cloudRequests++;   // ← THIS LINE NEVER EXECUTES
    }
  }
}
```

**Proof:** If you set a breakpoint on line 408 (`routingMetrics.localRequests++`), it will **NEVER** be hit during any `god ask` command.

### Execution Path Trace

```bash
# User runs:
god ask "write a fibonacci function"

# Execution trace:
1. scripts/god → node dist/god-agent/universal/cli.js
2. cli.ts:main() → case 'ask'
3. UniversalAgent.ask() → executeTaskDefault()
4. TaskExecutor.buildStructuredTask() → outputs JSON
5. Claude Code skill parses JSON → Task([agentType], [prompt])
6. Task tool → Anthropic API (DIRECT, NO ROUTER)

# Router is initialized but:
- getRecommendedModel() never called
- route() never called
- recordModelUsage() never called
- Metrics remain at 0
```

---

## 🛠️ The Solution

### High-Level Architecture Change

```
BEFORE (Current):
  UniversalAgent → TaskExecutor → Task tool → Claude API
                                     ↑
                                  BYPASS

AFTER (Fixed):
  UniversalAgent → Router → LLMProvider → (vLLM or Claude)
                     ↓          ↓
                  Decision   Metrics++
```

### Required Components

#### 1. Provider Abstraction Layer (NEW)

```typescript
// File: src/god-agent/core/providers/base-provider.ts
export interface ILLMProvider {
  id: string;
  provider: ProviderType;
  complete(prompt: string, options: CompletionOptions): Promise<string>;
  isAvailable(): Promise<boolean>;
}
```

#### 2. vLLM Provider Implementation (NEW)

```typescript
// File: src/god-agent/core/providers/vllm-provider.ts
export class VLLMProvider implements ILLMProvider {
  async complete(prompt: string, options: CompletionOptions): Promise<string> {
    // Call vLLM endpoint at http://localhost:8000
    const response = await fetch('http://localhost:8000/v1/completions', { ... });
    return response.json().choices[0].text;
  }

  async isAvailable(): Promise<boolean> {
    // Health check vLLM server
    try { await fetch('http://localhost:8000/health'); return true; }
    catch { return false; }
  }
}
```

#### 3. Claude Provider Implementation (NEW)

```typescript
// File: src/god-agent/core/providers/claude-provider.ts
export class ClaudeProvider implements ILLMProvider {
  async complete(prompt: string, options: CompletionOptions): Promise<string> {
    // Call Anthropic API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({ ... });
    return message.content[0].text;
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.ANTHROPIC_API_KEY;
  }
}
```

#### 4. Modified Execution Flow (UPDATED)

```typescript
// File: src/god-agent/universal/universal-agent.ts
// Method: executeTaskDefault() at line ~1200

private async executeTaskDefault(...): Promise<TaskExecutionResult> {
  // ... pre-hooks ...

  let result: string;
  let routingUsed = false;

  // 🆕 NEW: Route execution through CapabilityRouter
  if (this.modelRouterEnabled && options?.useRouter !== false) {
    try {
      // Infer task characteristics
      const taskType = this.inferTaskType(agentType);
      const complexity = this.inferComplexity(modifiedInput);

      // Route to appropriate model
      const decision = await this.modelRouter.route(modifiedInput, {
        context: { taskType, complexity }
      });

      // Get provider and execute
      const provider = this.modelRouter.getProvider(decision.selectedModel);
      result = await provider.complete(modifiedInput, { maxTokens: 8192 });

      // Track metrics
      trackLocalFirstDecision(
        this.getRecommendationType(decision),
        {
          triedLocal: isLocalProvider(decision.selectedProvider),
          localSucceeded: result.length > 0,
          fellBackToClaude: decision.isFallback
        }
      );

      routingUsed = true;

    } catch (error) {
      // Fall back to Task tool on routing failure
      this.log(`Routing failed, using Task tool: ${error}`);
    }
  }

  if (!routingUsed) {
    // Original Task tool path (backward compatibility)
    result = await this.executeViaTaskTool(...);
  }

  // ... post-hooks ...
}
```

---

## 📋 Implementation Checklist

### Phase 1: Provider Abstraction
- [ ] Create `src/god-agent/core/providers/base-provider.ts`
  - [ ] Define `ILLMProvider` interface
  - [ ] Define `CompletionOptions` interface
- [ ] Create `src/god-agent/core/providers/vllm-provider.ts`
  - [ ] Implement `VLLMProvider` class
  - [ ] Add health check endpoint (`/health`)
  - [ ] Add completion endpoint (`/v1/completions`)
- [ ] Create `src/god-agent/core/providers/claude-provider.ts`
  - [ ] Implement `ClaudeProvider` class
  - [ ] Use `@anthropic-ai/sdk`
  - [ ] Add API key validation

### Phase 2: Routing Integration
- [ ] Modify `src/god-agent/universal/universal-agent.ts`
  - [ ] Add `inferTaskType()` helper method
  - [ ] Add `inferComplexity()` helper method
  - [ ] Add `getRecommendationType()` helper method
  - [ ] Modify `executeTaskDefault()` to use routing
  - [ ] Keep Task tool as fallback path

### Phase 3: Provider Registration
- [ ] Update `UniversalAgent.initialize()`
  - [ ] Instantiate `VLLMProvider`
  - [ ] Instantiate `ClaudeProvider`
  - [ ] Register with `modelRouter.registerProvider()`

### Phase 4: Testing
- [ ] Start vLLM server on `localhost:8000`
- [ ] Run `god ask "simple test"` → Should use vLLM
- [ ] Check metrics: `god analytics routing` → Should show localRequests > 0
- [ ] Stop vLLM server
- [ ] Run `god ask "another test"` → Should fall back to Claude
- [ ] Check metrics: `god analytics routing` → Should show fallbackEvents > 0

### Phase 5: Verification
- [ ] Verify dashboard shows non-zero metrics
- [ ] Verify local usage percentage > 0%
- [ ] Verify cost savings calculated correctly
- [ ] Verify fallback behavior works correctly

---

## 🎯 Expected Outcomes

### Before Implementation

```bash
$ god analytics routing
┌────────────────────────────────────────┐
│ ROUTING METRICS                        │
│ ────────────────────────────────────── │
│ Local requests:  0                     │
│ Cloud requests:  0                     │
│ Fallback events: 0                     │
│ Local usage:     0.0% (0/0)            │
└────────────────────────────────────────┘
```

### After Implementation

```bash
$ god analytics routing
┌────────────────────────────────────────┐
│ ROUTING METRICS                        │
│ ────────────────────────────────────── │
│ Local requests:  1,234                 │ ← Was 0
│ Cloud requests:    452                 │ ← Was 0
│ Fallback events:    39                 │ ← Was 0
│ Local usage:     73.2% (1,234/1,686)   │ ← Was 0.0%
│                                        │
│ LOCAL-FIRST BREAKDOWN:                 │
│ Pure local:      892                   │
│ Test verified:   203                   │
│ Local+review:    139                   │
│ Claude only:     452                   │
│                                        │
│ SAVINGS:                               │
│ Est. saved:     ~$3.70                 │
│ Actual cost:    $1.36 (Claude only)    │
└────────────────────────────────────────┘
```

---

## 📚 Reference Documents

1. **Full Diagnostic Report:**
   `/home/dalton/projects/claudeflow-testing/research/routing-diagnostic-report.md`
   → Complete analysis of why routing doesn't work

2. **Execution Flow Diagrams:**
   `/home/dalton/projects/claudeflow-testing/research/routing-execution-flow-diagram.md`
   → Visual diagrams showing current vs fixed architecture

3. **Key Source Files:**
   - `/home/dalton/projects/claudeflow-testing/src/god-agent/core/router/capability-router.ts` (Router implementation)
   - `/home/dalton/projects/claudeflow-testing/src/god-agent/universal/universal-agent.ts` (Execution path)
   - `/home/dalton/projects/claudeflow-testing/src/god-agent/core/agents/task-executor.ts` (Task building)
   - `/home/dalton/projects/claudeflow-testing/.claude/commands/god-ask.md` (Skill that spawns Task)

---

## 🚀 Quick Start (For Implementation)

```bash
# 1. Review the diagnostic report
cat research/routing-diagnostic-report.md

# 2. Review the execution flow diagrams
cat research/routing-execution-flow-diagram.md

# 3. Create provider implementations
# See: Phase 1 in Implementation Checklist

# 4. Modify UniversalAgent.executeTaskDefault()
# See: Phase 2 in Implementation Checklist

# 5. Test with vLLM server
docker run -p 8000:8000 vllm/vllm-openai --model deepseek-ai/deepseek-coder-33b-instruct

# 6. Verify routing works
god ask "write hello world"
god analytics routing  # Should show localRequests > 0

# 7. Test fallback
docker stop <vllm-container>
god ask "write another test"
god analytics routing  # Should show fallbackEvents > 0
```

---

## ✅ Success Criteria

The local-first routing system will be **WORKING** when:

1. ✅ `god analytics routing` shows **non-zero** localRequests
2. ✅ `god analytics routing` shows **non-zero** cloudRequests
3. ✅ `god analytics routing` shows **non-zero** fallbackEvents (when vLLM is down)
4. ✅ `god analytics dashboard` shows **localUsagePercentage > 0%**
5. ✅ `god analytics dashboard` shows **cost savings > $0.00**
6. ✅ Running `god ask "test"` with vLLM running uses **local model**
7. ✅ Running `god ask "test"` with vLLM stopped falls back to **Claude**
8. ✅ Logs show **`[ROUTING] Selected: deepseek-coder-local`** messages

---

## 🤝 Conclusion

**The local-first routing system is architecturally sound but functionally disconnected.**

All the routing logic, metrics tracking, and local-first prioritization exists and is correct. The only missing piece is the **execution bridge** that connects routing decisions to actual LLM API calls.

Once the provider abstraction layer is implemented and integrated into `executeTaskDefault()`, the routing system will work exactly as designed:

- ✅ Local models tried first (70%+ usage target)
- ✅ Automatic fallback to Claude when needed
- ✅ Full metrics tracking visible in dashboard
- ✅ Cost savings from local execution
- ✅ All existing router code works without modification

**Estimated Implementation Time:** 4-6 hours
**Files to Create:** 3 (base-provider, vllm-provider, claude-provider)
**Files to Modify:** 1 (universal-agent.ts)
**Breaking Changes:** None (Task tool remains as fallback)
