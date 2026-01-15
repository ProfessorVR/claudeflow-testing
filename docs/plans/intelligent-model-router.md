# Plan: Intelligent Model Router with Capability Matrix & Audit System

> **Permanent Location:** `docs/plans/intelligent-model-router.md`
> **Created:** 2026-01-14
> **Status:** Draft - Ready for implementation when needed

## Goal
Build an intelligent routing system that:
1. Routes tasks to appropriate models based on capability and complexity
2. Falls back gracefully when Claude is unavailable
3. Logs all non-Claude changes for later review
4. Enables Claude to review accumulated changes when credits restore

---

## Manual Override System

### Override Syntax
```bash
# Use specific model for this request
claude --model deepseek "fix the null check"
claude --model gpt-4o "explain this algorithm"
claude --model o1 "design the architecture"
claude --model local "add logging"

# Or with aliases
claude @local "simple fix"
claude @openai "medium task"
claude @reasoning "complex analysis"

# Force through despite routing (skip capability check)
claude --force-model deepseek "complex refactor"  # Warning shown but proceeds
```

### Available Model Aliases
```yaml
# Configured in router-config.yaml
aliases:
  local: deepseek-coder-v2:33b
  openai: gpt-4o
  reasoning: o1
  claude: claude-sonnet-4-20250514
  cheap: deepseek-coder-v2:33b  # Custom alias
  fast: gpt-4o-mini
```

### Override Behavior
| Scenario | Behavior |
|----------|----------|
| `--model X` specified | Use model X, skip auto-routing |
| Model X unavailable | Show error, suggest alternatives |
| `--force-model X` on complex task | Warning + proceed anyway |
| No override | Use capability-based auto-routing |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Claude Code Request                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Task Classifier                                │
│  - Analyzes request type (code edit, reasoning, writing, etc.)      │
│  - Estimates complexity (single file, multi-file, architectural)    │
│  - Determines risk level (refactor, new feature, bug fix)           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Capability Router                               │
│  - Matches task → model based on capability matrix                  │
│  - Checks model availability (credits, API status)                  │
│  - Applies fallback chain if primary unavailable                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐   ┌───────────┐   ┌─────────┐
              │ Claude  │   │  OpenAI   │   │  Local  │
              │ (Paid)  │   │ (GPT-4o)  │   │ (Ollama)│
              └─────────┘   └───────────┘   └─────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Audit Logger                                    │
│  - Logs all non-Claude responses with full context                  │
│  - Tracks: model used, task type, files changed, diffs              │
│  - Stores in god-agent events.db or separate audit.db               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Review Queue (when Claude returns)                │
│  - Surfaces accumulated changes for Claude review                   │
│  - Prioritizes by risk level and complexity                         │
│  - Enables approve/reject/fix workflow                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Capability Matrix

| Task Type | Complexity | Primary Model | Fallback 1 | Fallback 2 |
|-----------|------------|---------------|------------|------------|
| **Code Edits** | Simple (1-2 files, localized) | Local (DeepSeek) | OpenAI | Claude |
| **Code Edits** | Medium (3-5 files, feature) | OpenAI | Claude | Local |
| **Code Edits** | Complex (architectural, multi-system) | Claude | OpenAI | BLOCK |
| **Reasoning** | Any | OpenAI (o1/o3) | Claude | Local |
| **Structured Writing** | Docs, specs | OpenAI | Claude | Local |
| **Research/Analysis** | Any | Claude | OpenAI | Local |
| **Refactoring** | Low risk | Local | OpenAI | Claude |
| **Refactoring** | High risk | Claude | OpenAI | BLOCK |
| **Bug Fixes** | Simple | Local | OpenAI | Claude |
| **Bug Fixes** | Complex/critical | Claude | OpenAI | BLOCK |

**BLOCK** = Don't attempt, queue for Claude when available

---

## Task Classification Rules

### Complexity Signals
```yaml
simple:
  - Single file edit
  - < 50 lines changed
  - No new dependencies
  - Pattern: typo fix, add logging, simple function

medium:
  - 2-5 files
  - 50-200 lines changed
  - May add dependencies
  - Pattern: new feature, refactor module

complex:
  - 5+ files
  - Architectural changes
  - Cross-cutting concerns
  - Pattern: new system, major refactor, API redesign
```

### Task Type Detection
```yaml
code_edit:
  signals: ["edit", "change", "modify", "update", "fix"]

reasoning:
  signals: ["why", "explain", "analyze", "compare", "design"]

writing:
  signals: ["write", "document", "spec", "readme", "report"]

refactor:
  signals: ["refactor", "restructure", "reorganize", "clean up"]
```

---

## Audit Log Schema

```typescript
interface AuditEntry {
  id: string;
  timestamp: Date;

  // Request context
  taskType: 'code_edit' | 'reasoning' | 'writing' | 'refactor';
  complexity: 'simple' | 'medium' | 'complex';
  originalPrompt: string;

  // Routing decision
  primaryModel: string;
  actualModel: string;  // Which model actually handled it
  routingReason: string;  // "capability_match" | "fallback_credits" | "fallback_error"

  // Changes made
  filesModified: string[];
  diffSummary: string;
  fullDiff: string;  // Git-style diff

  // Review status
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'fixed';
  reviewedBy: string | null;
  reviewNotes: string | null;
}
```

---

## Implementation Components

### 1. Router Configuration (`~/.claude/router-config.yaml`)
```yaml
models:
  claude:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${ANTHROPIC_API_KEY}
    priority: 1
    capabilities: [code, reasoning, research, writing, refactor]
    max_complexity: complex

  openai:
    provider: openai
    model: gpt-4o
    api_key: ${OPENAI_API_KEY}
    priority: 2
    capabilities: [code, reasoning, writing]
    max_complexity: medium

  openai-reasoning:
    provider: openai
    model: o1
    api_key: ${OPENAI_API_KEY}
    priority: 1  # Preferred for reasoning
    capabilities: [reasoning]

  local:
    provider: ollama
    model: deepseek-coder-v2:33b
    base_url: http://localhost:11434
    priority: 3
    capabilities: [code, writing]
    max_complexity: simple

routing_rules:
  - task: reasoning
    route: [openai-reasoning, claude, openai]

  - task: code_edit
    complexity: simple
    route: [local, openai, claude]

  - task: code_edit
    complexity: medium
    route: [openai, claude, local]

  - task: code_edit
    complexity: complex
    route: [claude, openai]  # No local fallback
    block_if_unavailable: true

  - task: refactor
    risk: high
    route: [claude, openai]
    block_if_unavailable: true

audit:
  enabled: true
  log_non_claude: true
  db_path: .god-agent/audit.db
```

### 2. Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/god-agent/core/router/task-classifier.ts` | Analyze requests, determine type/complexity |
| `src/god-agent/core/router/capability-router.ts` | Route to appropriate model |
| `src/god-agent/core/router/audit-logger.ts` | Log non-Claude changes |
| `src/god-agent/core/router/review-queue.ts` | Surface changes for Claude review |
| `src/god-agent/core/router/cost-tracker.ts` | Track spending, enforce budgets |
| `src/god-agent/core/router/quality-scorer.ts` | Track response quality, ratings |
| `src/god-agent/core/router/model-manager.ts` | Model lifecycle, aliases, testing |
| `src/god-agent/core/router/config.ts` | Load router configuration |
| `~/.claude/router-config.yaml` | User configuration |

### 3. God-Agent Integration

Modify `src/god-agent/universal/universal-agent.ts` to:
- Intercept requests before sending to model
- Run through task classifier
- Route via capability router
- Log via audit system
- Queue complex blocked tasks

### 4. Review Command

New command: `/god-review` or `god review`
```bash
god review              # Show pending reviews
god review --approve 5  # Approve entry #5
god review --reject 3   # Reject and rollback entry #3
god review --fix 7      # Have Claude fix issues in entry #7
```

### 5. Model Management Commands

```bash
# List available models and their status
god models
# Output:
#   claude (anthropic)    ✓ available   [primary]
#   gpt-4o (openai)       ✓ available
#   o1 (openai)           ✓ available   [reasoning]
#   deepseek-33b (local)  ✓ running     [local]

# Set default model for session
god use local           # All requests go to local until changed
god use auto            # Return to capability-based routing

# Check current routing mode
god routing
# Output: Mode: auto (capability-based)
#         Primary: claude (if available)
#         Fallbacks: openai → local

# Add new model
god models add --name qwen --provider ollama --model qwen2.5-coder:32b

# Test model connectivity
god models test openai
```

### 6. Interactive Model Selection (Optional)

When routing is ambiguous or you want control:
```bash
# Enable interactive mode
god config set routing.interactive true

# Now for medium-complexity tasks:
# ┌─────────────────────────────────────────┐
# │ Task: "refactor auth module"            │
# │ Complexity: medium                      │
# │                                         │
# │ Select model:                           │
# │ > [1] gpt-4o (recommended)              │
# │   [2] claude                            │
# │   [3] deepseek-33b (local)              │
# │   [4] let router decide                 │
# └─────────────────────────────────────────┘
```

---

## Review Workflow (When Claude Returns)

```
┌─────────────────────────────────────────────────────────────────────┐
│  $ god review                                                       │
│                                                                     │
│  📋 Pending Reviews (12 changes made while Claude was unavailable)  │
│                                                                     │
│  #1 [HIGH] Architectural refactor - 8 files (OpenAI)               │
│     Files: src/core/*, src/api/*                                    │
│     Risk: Complex multi-file change                                 │
│                                                                     │
│  #2 [MED] New feature: user auth - 4 files (OpenAI)                │
│     Files: src/auth/*, src/middleware/*                             │
│                                                                     │
│  #3 [LOW] Bug fix: null check - 1 file (Local)                     │
│     Files: src/utils/helpers.ts                                     │
│                                                                     │
│  Commands: [a]pprove [r]eject [f]ix [d]iff [s]kip                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cost Tracking System

### Cost Configuration
```yaml
# In router-config.yaml
cost_tracking:
  enabled: true
  currency: USD

  # Cost per 1M tokens (input/output)
  models:
    claude-sonnet-4:
      input: 3.00
      output: 15.00
    gpt-4o:
      input: 2.50
      output: 10.00
    o1:
      input: 15.00
      output: 60.00
    local:
      input: 0.00  # Free
      output: 0.00

  budgets:
    daily: 10.00      # Daily spending limit
    weekly: 50.00     # Weekly limit
    monthly: 150.00   # Monthly limit

  alerts:
    - at: 80%         # Warn at 80% of budget
      action: notify
    - at: 100%        # Block paid APIs at limit
      action: fallback_to_local
```

### Cost Tracking Commands
```bash
# View cost summary
god costs
# Output:
#   Today:     $2.45 / $10.00 (24.5%)
#   This week: $18.30 / $50.00 (36.6%)
#   This month: $45.20 / $150.00 (30.1%)
#
#   By model:
#     claude:  $32.00 (70.8%)
#     gpt-4o:  $12.50 (27.7%)
#     o1:      $0.70 (1.5%)
#     local:   $0.00

# Detailed breakdown
god costs --detailed
god costs --by-task-type
god costs --last-7-days

# Set budget
god budget set daily 15.00
god budget set monthly 200.00
```

### Budget Enforcement
| Budget Status | Behavior |
|---------------|----------|
| Under 80% | Normal routing |
| 80-99% | Warning shown, suggest local |
| 100% | Block paid APIs, route to local |
| Override | `--ignore-budget` flag for urgent tasks |

---

## Response Quality Scoring

### Quality Metrics Tracked
```typescript
interface QualityScore {
  modelUsed: string;
  taskType: string;
  complexity: string;

  // Automatic metrics
  responseTime: number;      // ms
  tokensUsed: number;
  errorRate: number;         // Did it produce errors?

  // User feedback (optional)
  userRating: 1 | 2 | 3 | 4 | 5 | null;
  userAccepted: boolean;     // Did user accept the change?
  userReverted: boolean;     // Did user revert?

  // Code quality (for code tasks)
  testsPass: boolean | null;
  lintErrors: number | null;
  buildSuccess: boolean | null;
}
```

### Quality Feedback Commands
```bash
# Rate last response
god rate 5              # 5-star rating
god rate 3 "too verbose"

# Mark response as problematic
god reject "broke the build"

# View quality stats
god quality
# Output:
#   Model Quality Scores (last 30 days):
#
#   Task: code_edit (simple)
#     local:   4.2★ (156 tasks, 94% accepted)
#     gpt-4o:  4.5★ (43 tasks, 97% accepted)
#     claude:  4.8★ (89 tasks, 99% accepted)
#
#   Task: code_edit (complex)
#     gpt-4o:  3.8★ (12 tasks, 83% accepted)
#     claude:  4.7★ (45 tasks, 98% accepted)
#
#   Task: reasoning
#     o1:      4.9★ (23 tasks, 100% accepted)
#     claude:  4.4★ (34 tasks, 94% accepted)

# Adjust routing based on quality
god routing optimize
# Analyzes quality scores and suggests routing rule changes
```

### Adaptive Routing (Optional)
```yaml
# In router-config.yaml
adaptive_routing:
  enabled: true
  min_samples: 20          # Need 20+ samples before adapting
  quality_threshold: 4.0   # Demote models below this score

  # If local model scores >4.0 on medium tasks, promote it
  auto_promote: true

  # If a model's quality drops, auto-demote
  auto_demote: true
```

---

## Verification Plan

1. **Unit tests** for task classifier (various prompts → correct categorization)
2. **Integration tests** for routing logic (capability matrix applied correctly)
3. **Manual test**: Simulate credit exhaustion, verify fallback and logging
4. **Review workflow test**: Accumulate changes, run `god review`

---

## Summary

This is a comprehensive intelligent routing system with full user control:

### Core Features
- **Smart routing** based on task type and complexity
- **Multi-provider** support (Claude, OpenAI, Local/Ollama)
- **Manual override** with `--model` flag and aliases
- **Risk-aware** blocking of complex tasks when Claude unavailable

### Audit & Review
- **Audit trail** for all non-Claude changes with full diffs
- **Review queue** for Claude to validate changes when available
- **Approve/reject/fix workflow** via `god review`

### Cost Management
- **Cost tracking** per model, per task type
- **Budget limits** (daily/weekly/monthly)
- **Automatic fallback** to local when budget exceeded

### Quality Intelligence
- **Response quality scoring** automatic + user ratings
- **Model performance tracking** by task type
- **Adaptive routing** - auto-promote/demote based on quality

### Model Management
- **Model aliases** for quick access
- **Session defaults** (`god use local`)
- **Interactive mode** for medium-complexity tasks
- **Health checks** and connectivity testing

---

## Implementation Phases

| Phase | Components | Effort |
|-------|------------|--------|
| 1 | Task classifier + basic router | Core |
| 2 | Audit logger + review queue | Core |
| 3 | Cost tracking + budgets | Enhancement |
| 4 | Quality scoring + adaptive routing | Enhancement |
| 5 | Model management CLI | Polish |

---

## Prerequisites

1. **Ollama installed** with coding model pulled
2. **OpenAI API key** (optional, for GPT-4o/o1)
3. **Anthropic API key** (existing)
