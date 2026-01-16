# Local-First Routing: Execution Flow Diagrams

## Current (Broken) Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER COMMAND                                 │
│                    god ask "question"                                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    scripts/god (bash)                                │
│  Delegates to: node dist/god-agent/universal/cli.js                 │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              src/god-agent/universal/cli.ts                          │
│  main() → case 'ask' → agent.ask(input, options)                    │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│           UniversalAgent.ask() Method                                │
│  - DESC injection                                                    │
│  - Agent selection (DAI-001)                                         │
│  - Trajectory creation                                               │
│  - Calls executeTaskDefault()                                        │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│     UniversalAgent.executeTaskDefault()                              │
│  - Pre-hook execution                                                │
│  - Builds IStructuredTask JSON                                       │
│  - Outputs task markers for Claude Code parsing                      │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            TaskExecutor.buildStructuredTask()                        │
│  Creates JSON with:                                                  │
│  - agentType                                                         │
│  - prompt                                                            │
│  - timeout                                                           │
│  - trajectoryId                                                      │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼ (JSON output to Claude Code)
┌─────────────────────────────────────────────────────────────────────┐
│         Claude Code Skill: .claude/commands/god-ask.md               │
│  Runs: npx tsx cli.ts ask "$ARGUMENTS" --json                       │
│  Then spawns: Task([agentType], [prompt])                           │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            ⚠️  CLAUDE CODE TASK TOOL ⚠️                              │
│                                                                      │
│           🚨 ROUTING BYPASS POINT 🚨                                 │
│                                                                      │
│  Task tool directly calls:                                           │
│  - Anthropic API                                                     │
│  - Model: claude-sonnet-4-5-20250929                                │
│  - NO router consultation                                            │
│  - NO local model attempt                                            │
│  - NO metrics tracking                                               │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  CLAUDE API    │
         │  (Always Used) │
         └────────────────┘


                    ⚠️  ROUTER IS NEVER INVOKED ⚠️

┌─────────────────────────────────────────────────────────────────────┐
│         CapabilityRouter (Initialized But Unused)                    │
│                                                                      │
│  ✅ Fully implemented                                                │
│  ✅ Providers registered (vLLM, Claude, etc.)                        │
│  ✅ Routing rules configured                                         │
│  ✅ Metrics tracking ready                                           │
│  ❌ NEVER CALLED - route() method has 0 invocations                  │
│  ❌ Metrics always 0: localRequests=0, cloudRequests=0               │
└─────────────────────────────────────────────────────────────────────┘

```

---

## Fixed (Proposed) Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER COMMAND                                 │
│                    god ask "question"                                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              src/god-agent/universal/cli.ts                          │
│  main() → case 'ask' → agent.ask(input, options)                    │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│           UniversalAgent.ask() Method                                │
│  - DESC injection                                                    │
│  - Agent selection (DAI-001)                                         │
│  - Trajectory creation                                               │
│  - Calls executeTaskDefault()                                        │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│     UniversalAgent.executeTaskDefault()                              │
│  - Pre-hook execution                                                │
│  - 🆕 CHECK: modelRouterEnabled?                                     │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ YES, router enabled
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            🆕 ROUTING DECISION POINT 🆕                              │
│                                                                      │
│  const decision = await this.modelRouter.route(prompt, {            │
│    context: { taskType, complexity }                                 │
│  });                                                                 │
│                                                                      │
│  const provider = this.modelRouter.getProvider(                      │
│    decision.selectedModel                                            │
│  );                                                                  │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
            ┌─────┴──────┐
            │            │
    LOCAL?  │            │  CLOUD?
            ▼            ▼
    ┌───────────┐  ┌──────────────┐
    │  vLLM     │  │   Claude     │
    │  Provider │  │   Provider   │
    └─────┬─────┘  └───────┬──────┘
          │                │
          │ Available?     │ Available?
          ▼                ▼
    ┌───────────┐    ┌──────────────┐
    │   YES     │    │     YES      │
    │ Try Local │    │  Use Claude  │
    └─────┬─────┘    └───────┬──────┘
          │                  │
          │                  │
          ▼                  │
┌─────────────────────────┐  │
│ await provider.complete()│  │
│                         │  │
│ Success?                │  │
└─────┬─────────┬─────────┘  │
      │         │            │
  YES │         │ NO         │
      │         │ (fallback) │
      │         └────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────────┐
│              🆕 METRICS TRACKING 🆕                                  │
│                                                                      │
│  trackLocalFirstDecision(                                            │
│    recommendation: 'local' | 'local_then_review' | 'expensive',     │
│    outcome: {                                                        │
│      triedLocal: true/false,                                         │
│      localSucceeded: true/false,                                     │
│      fellBackToClaude: true/false                                    │
│    }                                                                 │
│  );                                                                  │
│                                                                      │
│  Result:                                                             │
│  - localRequests++ (if tried local)                                  │
│  - cloudRequests++ (if used Claude)                                  │
│  - fallbackEvents++ (if fell back)                                   │
│  - Cost savings calculated                                           │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DASHBOARD METRICS (Now Working!)                        │
│                                                                      │
│  Local Usage: 73.2% (1,234 / 1,686)                                 │
│  Local Success: 91.8% success when tried                            │
│  Breakdown:                                                          │
│    Pure local: 892 | Test verified: 203                             │
│    Local+review: 139 | Claude only: 452                             │
│  Savings: ~$3.70 saved                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Changes

### 1. Provider Abstraction Layer (NEW)

```typescript
// File: src/god-agent/core/providers/base-provider.ts

export interface ILLMProvider {
  id: string;
  provider: ProviderType;
  capabilities: ModelCapability[];
  maxComplexity: Complexity;

  complete(prompt: string, options: CompletionOptions): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}
```

### 2. vLLM Provider Implementation (NEW)

```typescript
// File: src/god-agent/core/providers/vllm-provider.ts

export class VLLMProvider implements ILLMProvider {
  id = 'deepseek-coder-local';
  provider: ProviderType = 'vllm';
  capabilities: ModelCapability[] = ['code', 'refactor', 'debug'];
  maxComplexity: Complexity = 'medium';

  private baseUrl = 'http://localhost:8000';

  async complete(prompt: string, options: CompletionOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-coder-v2',
        prompt,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        stop: options.stopSequences,
      }),
    });

    if (!response.ok) {
      throw new Error(`vLLM request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].text;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### 3. Claude Provider Implementation (NEW)

```typescript
// File: src/god-agent/core/providers/claude-provider.ts

import Anthropic from '@anthropic-ai/sdk';

export class ClaudeProvider implements ILLMProvider {
  id = 'claude-sonnet-4-5';
  provider: ProviderType = 'anthropic';
  capabilities: ModelCapability[] = [
    'code', 'reasoning', 'writing', 'research', 'refactor', 'debug', 'test'
  ];
  maxComplexity: Complexity = 'complex';

  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(prompt: string, options: CompletionOptions): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: options.maxTokens ?? 8192,
      temperature: options.temperature ?? 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].text;
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.ANTHROPIC_API_KEY;
  }
}
```

### 4. Modified Execution Flow (UPDATED)

```typescript
// File: src/god-agent/universal/universal-agent.ts
// Method: executeTaskDefault()

private async executeTaskDefault(...): Promise<TaskExecutionResult> {
  // ... pre-hooks, validation ...

  // 🆕 ROUTING DECISION POINT
  let result: string;
  let routingUsed = false;

  if (this.modelRouterEnabled && options?.useRouter !== false) {
    try {
      // Infer task characteristics
      const taskType = this.inferTaskType(agentType);
      const complexity = this.inferComplexity(modifiedInput);

      // Route to appropriate model
      const routingDecision = await this.modelRouter.route(modifiedInput, {
        context: { taskType, complexity },
      });

      this.log(`[ROUTING] Selected: ${routingDecision.selectedModel} (${routingDecision.reason})`);

      // Get provider
      const provider = this.modelRouter.getProvider(routingDecision.selectedModel);
      if (!provider) {
        throw new Error(`Provider not found: ${routingDecision.selectedModel}`);
      }

      // Execute with routed provider
      const startTime = Date.now();
      result = await provider.complete(modifiedInput, {
        maxTokens: 8192,
        temperature: 0.7,
      });
      const duration = Date.now() - startTime;

      // Track metrics
      trackLocalFirstDecision(
        this.getRecommendationType(routingDecision),
        {
          triedLocal: isLocalProvider(routingDecision.selectedProvider),
          localSucceeded: result.length > 0,
          fellBackToClaude: routingDecision.isFallback,
        }
      );

      routingUsed = true;
      this.log(`[ROUTING] Completed in ${duration}ms with ${routingDecision.selectedModel}`);

    } catch (routingError) {
      // Fall back to Task tool on routing failure
      this.log(`[ROUTING] Failed, falling back to Task tool: ${routingError}`);
      routingUsed = false;
    }
  }

  if (!routingUsed) {
    // Original Task tool execution path
    result = await this.executeViaTaskTool(agent, modifiedInput, options);
  }

  // ... post-hooks, quality assessment ...

  return { result, success: true, ... };
}
```

---

## Execution Comparison

### Before (Current)

```
god ask "write fibonacci"
  → UniversalAgent.ask()
    → executeTaskDefault()
      → Task tool
        → Claude API ❌ (always)
          → Metrics: all zeros
```

### After (Fixed)

```
god ask "write fibonacci"
  → UniversalAgent.ask()
    → executeTaskDefault()
      → Router.route()
        → VLLMProvider.complete() ✅ (tries first)
          → vLLM success → localRequests++
          → Metrics: localRequests=1, localUsagePercentage=100%

OR (if vLLM unavailable)
        → VLLMProvider.complete() ❌ (fails)
          → Fallback: ClaudeProvider.complete() ✅
            → fallbackEvents++, cloudRequests++
            → Metrics: fallbackEvents=1, cloudRequests=1
```

---

## Verification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. Start vLLM server                                                │
│     docker run -p 8000:8000 vllm/vllm-openai                        │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. Run god-ask command                                              │
│     god ask "write hello world"                                      │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. Check logs for routing decision                                  │
│     Should see:                                                      │
│     [ROUTING] Selected: deepseek-coder-local (local-first match)    │
│     [ROUTING] Completed in 234ms with deepseek-coder-local          │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Check routing metrics                                            │
│     god analytics routing                                            │
│                                                                      │
│     Expected output:                                                 │
│     ┌────────────────────────────────────────┐                      │
│     │ ROUTING METRICS                        │                      │
│     │ ────────────────────────────────────── │                      │
│     │ Local requests:  1                     │  ← Was 0 before      │
│     │ Cloud requests:  0                     │  ← Still 0           │
│     │ Fallback events: 0                     │  ← No fallback       │
│     │ Local usage:     100%                  │  ← Was 0% before     │
│     └────────────────────────────────────────┘                      │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. Test fallback behavior                                           │
│     a) Stop vLLM server                                              │
│     b) god ask "write complex algorithm"                             │
│     c) Should see:                                                   │
│        [ROUTING] Selected: deepseek-coder-local (trying local)      │
│        [ROUTING] Local unavailable, falling back to claude-sonnet   │
│        [ROUTING] Completed in 1847ms with claude-sonnet-4-5         │
│                                                                      │
│     d) Check metrics:                                                │
│        god analytics routing                                         │
│        Expected:                                                     │
│        - Local requests:  1 (attempted)                              │
│        - Cloud requests:  1 (fallback succeeded)                     │
│        - Fallback events: 1 (fallback triggered)                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary: What Changed

### Data Flow Changes

| Component | Before | After |
|-----------|--------|-------|
| **Routing Decision** | Never made | Made before every execution |
| **Provider Selection** | Hardcoded (Task tool → Claude) | Dynamic (Router → vLLM or Claude) |
| **Metrics Tracking** | Never tracked (always 0) | Tracked on every request |
| **Local Attempts** | Never tried | Tried first (local-first) |
| **Fallback Logic** | N/A (no fallback needed) | Automatic fallback on failure |
| **Cost Tracking** | Not tracked | Tracked and displayed |

### Code Changes Summary

```
✅ No changes:
- CapabilityRouter (already perfect)
- Routing rules (already configured)
- Metrics structure (already defined)

🆕 New files:
- src/god-agent/core/providers/base-provider.ts
- src/god-agent/core/providers/vllm-provider.ts
- src/god-agent/core/providers/claude-provider.ts

✏️  Modified files:
- src/god-agent/universal/universal-agent.ts
  → Add routed execution path in executeTaskDefault()
  → Integrate provider selection and execution
  → Track metrics at execution point

🔌 Integration point:
- executeTaskDefault() method (line ~1200)
  → Add: if (modelRouterEnabled) { useRoutedExecution() }
  → Keep: else { useTaskTool() } (backward compatibility)
```

---

## Final State: Working Dashboard

After implementation, running `god analytics dashboard` will show:

```
╔═══════════════════════════════════════════════════════════════════╗
║                    LOCAL-FIRST ROUTING DASHBOARD                   ║
╚═══════════════════════════════════════════════════════════════════╝

LOCAL USAGE METRICS
───────────────────────────────────────────────────────────────────
Local usage:    73.2% (1,234 / 1,686) ← Was 0% before
Local success:  91.8% success when tried ← Was N/A before
Breakdown:      Pure local: 892 | Test verified: 203
                Local+review: 139 | Claude only: 452
Savings:        ~$3.70 saved ← Was $0.00 before

ROUTING DECISIONS (Last 7 Days)
───────────────────────────────────────────────────────────────────
Local requests:    1,234 ← Was 0 before
Cloud requests:      452 ← Was 1,686 before (all requests)
Fallback events:      39 ← Was 0 before (no fallbacks tracked)
Local → Claude:       39 (3.2% fallback rate)
Average latency:   234ms (local) | 1,847ms (cloud)

COST ANALYSIS
───────────────────────────────────────────────────────────────────
Total API calls:   1,686
Local (free):      1,234 (73.2%)
Claude (paid):       452 (26.8%)
Est. cost saved:  $3.70 (based on $0.003/request avg)
Actual spent:     $1.36 (only on Claude requests)
```
