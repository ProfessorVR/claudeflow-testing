# Local-First Routing System Diagnostic Report

## Executive Summary

**Problem:** The local-first routing system exists in the codebase but is **NOT in the execution path** when `god-ask` commands are executed. The routing metrics remain at 0 because the `CapabilityRouter` is never invoked during actual LLM API calls.

**Root Cause:** The execution architecture has a critical gap between the routing system and the Task tool spawning mechanism.

---

## Architecture Analysis

### Current Execution Flow

```
User runs: god ask "write a fibonacci function"
    ↓
scripts/god → delegates to dist/god-agent/universal/cli.js
    ↓
cli.ts: main() → case 'ask'
    ↓
UniversalAgent.ask(input, options)
    ↓
executeTaskDefault() → builds structured task
    ↓
taskExecutor.execute() → calls executeTask callback
    ↓
TaskExecutor builds IStructuredTask JSON
    ↓
Claude Code skill: god-ask.md
    ↓
Skill runs: npx tsx src/god-agent/universal/cli.ts ask "$ARGUMENTS" --json
    ↓
Skill spawns: Task([agentType], [prompt])
    ↓
**Task tool directly calls Anthropic API (Claude)**
    ↓
NO ROUTER INVOCATION - Goes straight to Claude
```

### Where the Routing System Lives (But Isn't Used)

The `CapabilityRouter` is initialized in `UniversalAgent`:

```typescript
// File: src/god-agent/universal/universal-agent.ts:812-824
this.modelRouter = initializeRouter({
  routerConfig,
  adaptiveRouting: true,
});

// Register all providers
const providers = factory.getAllProviders();
for (const provider of providers) {
  this.modelRouter.registerProvider(provider);
}

this.modelRouterEnabled = true;
```

**Methods exist but are never called:**
- `getModelRouter()` - Returns the router instance
- `getRecommendedModel()` - Routes based on task/complexity
- `recordModelUsage()` - Tracks usage for metrics

### The Critical Gap

**The Task tool spawning happens in `executeTaskDefault()` at line 1286:**

```typescript
const structuredTask: IStructuredTask = this.taskExecutor.buildStructuredTask(
  agent,
  prompt,
  { timeout: options?.timeout, trajectoryId }
);

// Outputs structured task as JSON for Claude Code Task tool
// The markers allow Claude Code to parse the task specification
if (this.config.verbose) {
  console.log('\n================================================================================');
  // ... outputs task for parsing by Claude Code ...
}
```

**This structured task is then parsed by the Claude Code Task tool, which directly calls the Anthropic API without consulting any routing system.**

---

## Why Routing Doesn't Work

### 1. Task Tool Architecture Limitation

The `Task()` tool in Claude Code is a **black box** that:
- Accepts an agent type and prompt
- Directly spawns a new Claude conversation
- Has no hooks or configuration for model selection
- Cannot be intercepted or modified from TypeScript code

### 2. No LLM Provider Abstraction

The execution path has no abstraction layer where routing decisions could be injected:

```typescript
// Current flow (NO ROUTING)
buildStructuredTask() → Task tool → Claude API

// What's needed for routing (DOESN'T EXIST)
buildStructuredTask() → Router.route() → LLMProvider.complete() → (vLLM or Claude)
```

### 3. Router is Read-Only

Even though `UniversalAgent` initializes the router:
- It never calls `modelRouter.route()` during execution
- `getRecommendedModel()` is defined but never invoked
- The routing metrics (`getRoutingMetrics()`) remain at 0 because no routing decisions are made

---

## Evidence from Code

### File: `/home/dalton/projects/claudeflow-testing/src/god-agent/universal/universal-agent.ts`

**Lines 1086-1107: Router methods exist but are never called**
```typescript
async getRecommendedModel(
  taskType: TaskType,
  complexity: Complexity
): Promise<{
  modelId: string;
  provider: ProviderType;
  reason: string;
  isFallback: boolean;
} | null> {
  if (!this.modelRouterEnabled) {
    return null;
  }

  try {
    return await getModelForRequest(taskType, complexity);
  } catch (error) {
    this.log(`Model selection failed: ${error}`);
    return null;
  }
}
```

**Lines 1178-1295: `executeTaskDefault()` builds tasks but doesn't route**
```typescript
private async executeTaskDefault(
  agentSelection: {...},
  taskExecutionFn?: ...,
  options?: {...}
): Promise<TaskExecutionResult> {
  // ... hooks, validation ...

  // THIS IS WHERE ROUTING SHOULD HAPPEN BUT DOESN'T
  const executionResult = await this.taskExecutor.execute(
    agent,
    modifiedInput,
    async (_agentType: string, prompt: string, options?: { timeout?: number }) => {
      // Builds structured task for Claude Code
      const structuredTask: IStructuredTask = this.taskExecutor.buildStructuredTask(
        agent,
        prompt,
        { timeout: options?.timeout, trajectoryId }
      );

      // Outputs task as JSON for Claude Code Task tool
      // NO ROUTING DECISION MADE HERE
      console.log(JSON.stringify(structuredTask, null, 2));

      // Task tool then directly calls Claude API
      return "..."; // Result from Task tool
    }
  );
}
```

### File: `/home/dalton/projects/claudeflow-testing/src/god-agent/core/router/capability-router.ts`

**Lines 40-116: Routing metrics defined but never incremented**
```typescript
export interface RoutingMetrics {
  localRequests: number;      // Always 0
  cloudRequests: number;       // Always 0
  fallbackEvents: number;      // Always 0
  // ...
  localFirst: {
    localTriedFirst: number;         // Always 0
    localSucceeded: number;          // Always 0
    localFellBackToClaude: number;  // Always 0
    skippedLocal: number;           // Always 0
  };
}
```

**Lines 342-456: `route()` method exists but is never called**
```typescript
async route(
  prompt: string,
  options?: RouteOptions
): Promise<RoutingDecision> {
  const startTime = Date.now();

  // Classify the task
  const classification = this.classifier.classify(prompt, options?.context);

  // Find matching routing rule
  const rule = this.findMatchingRule(classification);

  // Try each model in the chain
  for (const modelId of fallbackChain) {
    const provider = this.providers.get(modelId);

    // Check availability and route
    // ...

    // Track routing metrics
    if (isLocalProvider(provider.provider)) {
      routingMetrics.localRequests++;  // THIS NEVER EXECUTES
    } else {
      routingMetrics.cloudRequests++;   // THIS NEVER EXECUTES
    }
  }
}
```

---

## Why Claude Usage Decreased (But Not Zero)

The user observed Claude usage decreased but wasn't zero. This means:

1. **The Task tool always uses Claude** for the actual execution
2. **Some reduction might be from:**
   - Fewer Task tool calls overall
   - Shorter prompts (less token usage)
   - Caching effects
   - Other optimizations in the prompt building

**But it's NOT because local models are being used** - they simply cannot be invoked through the current architecture.

---

## Solution Requirements

To actually use local-first routing, the system needs:

### 1. LLM Provider Abstraction Layer

```typescript
interface ILLMExecutor {
  complete(prompt: string, options: CompletionOptions): Promise<string>;
}

class RoutedLLMExecutor implements ILLMExecutor {
  constructor(private router: CapabilityRouter) {}

  async complete(prompt: string, options: CompletionOptions): Promise<string> {
    // Route to appropriate model
    const decision = await this.router.route(prompt, options);

    // Get provider for selected model
    const provider = this.router.getProvider(decision.selectedModel);

    // Execute with selected provider
    const result = await provider.complete(prompt, options);

    // Track metrics
    trackLocalFirstDecision(...);

    return result;
  }
}
```

### 2. Bypass Task Tool for Routed Execution

```typescript
// In executeTaskDefault():
if (this.modelRouterEnabled && !options?.forceTaskTool) {
  // Use routed execution path
  const routedExecutor = new RoutedLLMExecutor(this.modelRouter);
  result = await routedExecutor.complete(modifiedInput, {
    taskType: this.inferTaskType(agentType),
    complexity: this.inferComplexity(modifiedInput),
  });
} else {
  // Fall back to Task tool (direct Claude)
  result = await this.executeViaTaskTool(...);
}
```

### 3. Provider Implementations

Implement actual LLM providers that the router can use:

```typescript
class VLLMProvider implements ILLMProvider {
  async complete(prompt: string, options: any): Promise<string> {
    // Call vLLM endpoint
    const response = await fetch('http://localhost:8000/v1/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-coder',
        prompt,
        max_tokens: options.maxTokens,
      }),
    });
    return response.json();
  }

  async isAvailable(): Promise<boolean> {
    try {
      await fetch('http://localhost:8000/health');
      return true;
    } catch {
      return false;
    }
  }
}

class ClaudeProvider implements ILLMProvider {
  async complete(prompt: string, options: any): Promise<string> {
    // Call Anthropic API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: options.maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return message.content[0].text;
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.ANTHROPIC_API_KEY;
  }
}
```

### 4. Integration Point

Modify `UniversalAgent.ask()` to use routed execution:

```typescript
async ask(input: string, options: AskOptions = {}): Promise<string | AskResult> {
  // ... setup and agent selection ...

  // NEW: Use router if enabled and no Task tool override
  if (this.modelRouterEnabled && options.executeTask !== false) {
    const taskType = this.inferTaskType(agentType);
    const complexity = this.inferComplexity(input);

    // Route to appropriate model
    const routingDecision = await this.modelRouter.route(input, {
      context: { taskType, complexity },
    });

    // Execute with routed provider
    const provider = this.modelRouter.getProvider(routingDecision.selectedModel);
    output = await provider.complete(modifiedInput, {
      maxTokens: 4096,
      temperature: 0.7,
    });

    // Track metrics
    trackLocalFirstDecision(
      routingDecision.recommendationType,
      {
        triedLocal: isLocalProvider(routingDecision.selectedProvider),
        localSucceeded: output.length > 0,
        fellBackToClaude: false,
      }
    );
  } else {
    // Fall back to Task tool execution (current behavior)
    output = await this.executeTaskDefault(agentSelection, undefined, { trajectoryId });
  }

  // ... quality assessment and feedback ...
}
```

---

## Summary

### Current State
- ✅ Routing system is **fully implemented and initialized**
- ✅ Router has **correct logic for local-first decisions**
- ✅ Metrics tracking is **properly structured**
- ❌ Router is **NEVER CALLED during execution**
- ❌ Task tool **bypasses routing entirely**
- ❌ No LLM provider abstraction **to route between**

### Required Changes
1. **Create LLM provider abstraction layer** with implementations for vLLM, Claude, etc.
2. **Add routed execution path** in `UniversalAgent.executeTaskDefault()`
3. **Integrate router decision** into the execution flow
4. **Track metrics** at the actual execution point
5. **Make Task tool optional** - use routed path by default

### Impact
- **Zero changes to routing logic** (already correct)
- **Minimal changes to UniversalAgent** (add routed execution path)
- **New provider implementations** (vLLM, Claude, etc.)
- **Backward compatible** (Task tool still available as fallback)

---

## Files Requiring Changes

### Primary Changes
- `/home/dalton/projects/claudeflow-testing/src/god-agent/universal/universal-agent.ts`
  - Add `RoutedLLMExecutor` class
  - Modify `executeTaskDefault()` to use router
  - Add provider availability checks

### New Files Needed
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/providers/vllm-provider.ts`
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/providers/claude-provider.ts`
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/providers/base-provider.ts`

### No Changes Required
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/router/capability-router.ts` ✅
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/router/task-classifier.ts` ✅
- `/home/dalton/projects/claudeflow-testing/src/god-agent/core/router/router-commands.ts` ✅

---

## Verification Steps

After implementing the solution:

1. **Check routing metrics:**
   ```bash
   god analytics routing
   # Should show non-zero localRequests and cloudRequests
   ```

2. **Verify local usage:**
   ```bash
   god ask "write a simple hello world"
   # Should route to local model (vLLM)
   # Check metrics: localRequests should increment
   ```

3. **Verify fallback:**
   ```bash
   # Stop vLLM server
   god ask "write complex algorithm"
   # Should fall back to Claude
   # Check metrics: fallbackEvents should increment
   ```

4. **Check dashboard:**
   ```bash
   god analytics dashboard
   # Should show:
   # - Local usage percentage > 0%
   # - Local success rate
   # - Cost savings from local execution
   ```

---

## Conclusion

The local-first routing system is **architecturally complete but functionally disconnected**. The `CapabilityRouter` never receives execution requests because the Task tool spawning mechanism bypasses it entirely. To fix this, we need to:

1. Add an LLM provider abstraction layer
2. Implement provider classes for vLLM and Claude
3. Insert routing decisions into the execution path
4. Make the Task tool an optional fallback instead of the primary execution mechanism

This is a **surgical fix** that leverages all existing routing infrastructure while adding the missing execution bridge.
